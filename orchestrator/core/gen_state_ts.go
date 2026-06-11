//go:build ignore

package main

import (
	"bytes"
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"log"
	"os"
	"reflect"
	"strings"
	"text/template"

	"gopkg.in/yaml.v3"
)

type Variable struct {
	Name    string `yaml:"name"`
	Storage string `yaml:"storage"`
	Type    string `yaml:"type"`
	Default string `yaml:"default"`
}

type Registry struct {
	Variables []Variable `yaml:"variables"`
}

var uint8Enums = map[string][]string{}
var booleanEnums = map[string][2]string{}

type StructField struct {
	JSName  string
	JsonKey string
	GoType  string
}

var structFields = map[string][]StructField{}

func getTypeName(expression ast.Expr) string {
	switch target := expression.(type) {
	case *ast.Ident:
		return target.Name
	case *ast.ArrayType:
		return "[]" + getTypeName(target.Elt)
	case *ast.SelectorExpr:
		return getTypeName(target.X) + "." + target.Sel.Name
	default:
		return ""
	}
}

func collectTypedefs(typedefsDirectory string) {
	fileSet := token.NewFileSet()
	packages, parseError := parser.ParseDir(fileSet, typedefsDirectory, nil, 0)
	if parseError != nil {
		log.Fatalf("Failed to parse typedefs: %v", parseError)
	}

	for _, parsedPackage := range packages {
		for _, file := range parsedPackage.Files {
			for _, declaration := range file.Decls {
				genericDeclaration, isGenericDeclaration := declaration.(*ast.GenDecl)
				if !isGenericDeclaration || genericDeclaration.Tok != token.TYPE {
					continue
				}
				for _, specification := range genericDeclaration.Specs {
					typeSpecification := specification.(*ast.TypeSpec)
					switch getTypeName(typeSpecification.Type) {
					case "uint8":
						uint8Enums[typeSpecification.Name.Name] = []string{}
					case "bool":
						booleanEnums[typeSpecification.Name.Name] = [2]string{}
					}
					if _, isStructType := typeSpecification.Type.(*ast.StructType); isStructType {
						structFields[typeSpecification.Name.Name] = []StructField{}
					}
				}
			}
		}
	}

	for _, parsedPackage := range packages {
		for _, file := range parsedPackage.Files {
			for _, declaration := range file.Decls {
				genericDeclaration, isGenericDeclaration := declaration.(*ast.GenDecl)
				if !isGenericDeclaration || genericDeclaration.Tok != token.CONST {
					continue
				}
				var currentEnumType string
				for _, specification := range genericDeclaration.Specs {
					valueSpecification, isValueSpecification := specification.(*ast.ValueSpec)
					if !isValueSpecification {
						continue
					}
					if typeName := getTypeName(valueSpecification.Type); typeName != "" {
						if _, isUint8 := uint8Enums[typeName]; isUint8 {
							currentEnumType = typeName
						} else if _, isBool := booleanEnums[typeName]; isBool {
							currentEnumType = typeName
						} else {
							currentEnumType = ""
						}
					}
					if currentEnumType == "" {
						continue
					}
					constantName := valueSpecification.Names[0].Name
					if _, isUint8 := uint8Enums[currentEnumType]; isUint8 {
						alreadyExists := false
						for _, constant := range uint8Enums[currentEnumType] {
							if constant == constantName {
								alreadyExists = true
								break
							}
						}
						if !alreadyExists {
							uint8Enums[currentEnumType] = append(uint8Enums[currentEnumType], constantName)
						}
					} else if _, isBool := booleanEnums[currentEnumType]; isBool {
						if len(valueSpecification.Values) > 0 {
							if identifier, isIdentifier := valueSpecification.Values[0].(*ast.Ident); isIdentifier {
								pair := booleanEnums[currentEnumType]
								if identifier.Name == "false" {
									pair[0] = constantName
								} else if identifier.Name == "true" {
									pair[1] = constantName
								}
								booleanEnums[currentEnumType] = pair
							}
						}
					}
				}
			}
		}
	}

	for _, parsedPackage := range packages {
		for _, file := range parsedPackage.Files {
			ast.Inspect(file, func(node ast.Node) bool {
				typeSpecification, isTypeSpecification := node.(*ast.TypeSpec)
				if !isTypeSpecification {
					return true
				}
				structType, isStructType := typeSpecification.Type.(*ast.StructType)
				if !isStructType {
					return true
				}
				var fields []StructField
				for _, field := range structType.Fields.List {
					if len(field.Names) == 0 {
						continue
					}
					fieldName := field.Names[0].Name
					goType := getTypeName(field.Type)
					javascriptName := strings.ToLower(fieldName[:1]) + fieldName[1:]
					jsonKey := javascriptName
					if field.Tag != nil {
						tagRaw := strings.Trim(field.Tag.Value, "`")
						if parsed := reflect.StructTag(tagRaw).Get("json"); parsed != "" {
							jsonKey = strings.Split(parsed, ",")[0]
						}
					}
					fields = append(fields, StructField{
						JSName:  javascriptName,
						JsonKey: jsonKey,
						GoType:  goType,
					})
				}
				structFields[typeSpecification.Name.Name] = fields
				return false
			})
		}
	}
}

func isStructType(goType string) bool {
	goType = strings.TrimPrefix(goType, "typedefs.")
	if strings.HasPrefix(goType, "[]") {
		return false
	}
	_, exists := structFields[goType]
	return exists
}

func isEnumType(goType string) bool {
	goType = strings.TrimPrefix(goType, "typedefs.")
	_, isUint8 := uint8Enums[goType]
	_, isBool := booleanEnums[goType]
	return isUint8 || isBool
}

func isBoolEnum(goType string) bool {
	goType = strings.TrimPrefix(goType, "typedefs.")
	_, exists := booleanEnums[goType]
	return exists
}

func typescriptClassName(goType string) string {
	return strings.TrimPrefix(goType, "typedefs.")
}

func stripTypePrefix(typeName, constantName string) string {
	prefix := typeName + "_"
	if strings.HasPrefix(constantName, prefix) {
		return constantName[len(prefix):]
	}
	if index := strings.Index(constantName, "_"); index != -1 {
		return constantName[index+1:]
	}
	return constantName
}

type EnumEntry struct {
	TSKey string
	Value interface{}
}

type EnumBlock struct {
	TSName    string
	IsBoolean bool
	Entries   []EnumEntry
}

type TemplateData struct {
	EnumBlocks []EnumBlock
}

func getTypeScriptType(goType string) string {
	rawType := strings.TrimPrefix(goType, "typedefs.")
	if strings.HasPrefix(rawType, "[]") {
		innerType := rawType[2:]
		return getTypeScriptType(innerType) + "[]"
	}
	if isStructType(goType) {
		return rawType
	}
	if isEnumType(goType) {
		if isBoolEnum(goType) {
			return "boolean"
		}
		return rawType
	}
	switch rawType {
	case "string":
		return "string"
	case "int", "uint8", "int64", "float64", "float32":
		return "number"
	case "bool":
		return "boolean"
	default:
		return "any"
	}
}

func writeStructClass(outputBuffer *bytes.Buffer, name string, fields []StructField) {
	outputBuffer.WriteString(fmt.Sprintf("export class %s {\n", name))

	for _, field := range fields {
		typescriptType := getTypeScriptType(field.GoType)
		outputBuffer.WriteString(fmt.Sprintf("    %s: %s;\n", field.JSName, typescriptType))
	}
	outputBuffer.WriteString("\n")

	outputBuffer.WriteString("    constructor(parameters: {\n")
	for _, field := range fields {
		typescriptType := getTypeScriptType(field.GoType)
		outputBuffer.WriteString(fmt.Sprintf("        %s?: %s,\n", field.JSName, typescriptType))
	}
	outputBuffer.WriteString("    }) {\n")

	for _, field := range fields {
		rawType := strings.TrimPrefix(field.GoType, "typedefs.")
		isList := strings.HasPrefix(rawType, "[]")
		if isList {
			outputBuffer.WriteString(fmt.Sprintf("        this.%s = parameters.%s ?? [];\n", field.JSName, field.JSName))
		} else if isStructType(field.GoType) {
			outputBuffer.WriteString(fmt.Sprintf("        this.%s = parameters.%s ?? new %s({});\n", field.JSName, field.JSName, typescriptClassName(field.GoType)))
		} else if isEnumType(field.GoType) {
			if isBoolEnum(field.GoType) {
				outputBuffer.WriteString(fmt.Sprintf("        this.%s = parameters.%s ?? false;\n", field.JSName, field.JSName))
			} else {
				outputBuffer.WriteString(fmt.Sprintf("        this.%s = parameters.%s ?? 0;\n", field.JSName, field.JSName))
			}
		} else {
			switch rawType {
			case "string":
				outputBuffer.WriteString(fmt.Sprintf("        this.%s = parameters.%s ?? '';\n", field.JSName, field.JSName))
			case "int", "uint8", "int64", "float64", "float32":
				outputBuffer.WriteString(fmt.Sprintf("        this.%s = parameters.%s ?? 0;\n", field.JSName, field.JSName))
			case "bool":
				outputBuffer.WriteString(fmt.Sprintf("        this.%s = parameters.%s ?? false;\n", field.JSName, field.JSName))
			default:
				outputBuffer.WriteString(fmt.Sprintf("        this.%s = parameters.%s ?? null;\n", field.JSName, field.JSName))
			}
		}
	}
	outputBuffer.WriteString("    }\n\n")

	outputBuffer.WriteString(fmt.Sprintf("    static fromJson(json: any): %s {\n", name))
	outputBuffer.WriteString(fmt.Sprintf("        if (!json || typeof json !== 'object') return new %s({});\n", name))
	outputBuffer.WriteString(fmt.Sprintf("        return new %s({\n", name))
	for _, field := range fields {
		rawType := strings.TrimPrefix(field.GoType, "typedefs.")
		isList := strings.HasPrefix(rawType, "[]")
		if isList {
			innerType := rawType[2:]
			if isStructType(innerType) {
				outputBuffer.WriteString(fmt.Sprintf("            %s: Array.isArray(json['%s']) ? json['%s'].map((element: any) => %s.fromJson(element)) : [],\n",
					field.JSName, field.JsonKey, field.JsonKey, innerType))
			} else {
				outputBuffer.WriteString(fmt.Sprintf("            %s: Array.isArray(json['%s']) ? json['%s'] : [],\n",
					field.JSName, field.JsonKey, field.JsonKey))
			}
		} else if isStructType(field.GoType) {
			outputBuffer.WriteString(fmt.Sprintf("            %s: %s.fromJson(json['%s'] ?? {}),\n",
				field.JSName, typescriptClassName(field.GoType), field.JsonKey))
		} else if isEnumType(field.GoType) {
			if isBoolEnum(field.GoType) {
				outputBuffer.WriteString(fmt.Sprintf("            %s: json['%s'] === true,\n",
					field.JSName, field.JsonKey))
			} else {
				outputBuffer.WriteString(fmt.Sprintf("            %s: Number(json['%s'] ?? 0),\n",
					field.JSName, field.JsonKey))
			}
		} else {
			switch rawType {
			case "string":
				outputBuffer.WriteString(fmt.Sprintf("            %s: typeof json['%s'] === 'string' ? json['%s'] : '',\n",
					field.JSName, field.JsonKey, field.JsonKey))
			case "int", "uint8", "int64", "float64", "float32":
				outputBuffer.WriteString(fmt.Sprintf("            %s: Number(json['%s'] ?? 0),\n",
					field.JSName, field.JsonKey))
			case "bool":
				outputBuffer.WriteString(fmt.Sprintf("            %s: json['%s'] === true,\n",
					field.JSName, field.JsonKey))
			default:
				outputBuffer.WriteString(fmt.Sprintf("            %s: json['%s'] ?? null,\n",
					field.JSName, field.JsonKey))
			}
		}
	}
	outputBuffer.WriteString("        });\n    }\n\n")

	outputBuffer.WriteString("    toJson(): any {\n        return {\n")
	for _, field := range fields {
		rawType := strings.TrimPrefix(field.GoType, "typedefs.")
		isList := strings.HasPrefix(rawType, "[]")
		if isList && isStructType(rawType[2:]) {
			outputBuffer.WriteString(fmt.Sprintf("            '%s': this.%s.map(function(element: %s) { return element.toJson(); }),\n",
				field.JsonKey, field.JSName, rawType[2:]))
		} else if isStructType(field.GoType) || isEnumType(field.GoType) {
			outputBuffer.WriteString(fmt.Sprintf("            '%s': this.%s,\n", field.JsonKey, field.JSName))
		} else {
			outputBuffer.WriteString(fmt.Sprintf("            '%s': this.%s,\n", field.JsonKey, field.JSName))
		}
	}
	outputBuffer.WriteString("        };\n    }\n}\n\n")
}

const typescriptTemplate = `{{range .EnumBlocks}}
{{if .IsBoolean}}
export const {{.TSName}} = {
{{- range .Entries}}
    {{.TSKey}}: {{.Value}},
{{- end}}
} as const;
{{else}}
export enum {{.TSName}} {
{{- range .Entries}}
    {{.TSKey}} = {{.Value}},
{{- end}}
}
{{end}}
{{end}}
`

func main() {
	typedefsDirectory := "../typedefs"
	registryPath := "registry.yaml"
	outputDirectory := "../../projector_display/types"
	outputPath := outputDirectory + "/state.ts"

	collectTypedefs(typedefsDirectory)

	yamlFileBytes, readError := os.ReadFile(registryPath)
	if readError != nil {
		log.Fatalf("Failed to read YAML: %v", readError)
	}
	var registry Registry
	if unmarshalError := yaml.Unmarshal(yamlFileBytes, &registry); unmarshalError != nil {
		log.Fatalf("Failed to parse YAML: %v", unmarshalError)
	}

	var enumBlocks []EnumBlock
	for typeName, constants := range uint8Enums {
		if len(constants) == 0 {
			continue
		}
		typescriptName := strings.TrimSuffix(typeName, "_t")
		block := EnumBlock{TSName: typescriptName, IsBoolean: false}
		for index, constant := range constants {
			block.Entries = append(block.Entries, EnumEntry{
				TSKey: stripTypePrefix(typeName, constant),
				Value: index,
			})
		}
		enumBlocks = append(enumBlocks, block)
	}
	for typeName, pair := range booleanEnums {
		typescriptName := strings.TrimSuffix(typeName, "_t")
		falseName := pair[0]
		trueName := pair[1]
		if falseName == "" {
			falseName = "False"
		}
		if trueName == "" {
			trueName = "True"
		}
		enumBlocks = append(enumBlocks, EnumBlock{
			TSName:    typescriptName,
			IsBoolean: true,
			Entries: []EnumEntry{
				{TSKey: stripTypePrefix(typeName, falseName), Value: false},
				{TSKey: stripTypePrefix(typeName, trueName), Value: true},
			},
		})
	}

	templateDefinition, parseError := template.New("stateTypescript").Parse(typescriptTemplate)
	if parseError != nil {
		log.Fatalf("Failed to parse template: %v", parseError)
	}
	var outputBuffer bytes.Buffer
	if executeError := templateDefinition.Execute(&outputBuffer, TemplateData{EnumBlocks: enumBlocks}); executeError != nil {
		log.Fatalf("Failed to execute template: %v", executeError)
	}

	for name, fields := range structFields {
		if len(fields) == 0 {
			continue
		}
		writeStructClass(&outputBuffer, name, fields)
	}

	for _, variable := range registry.Variables {
		goType := strings.TrimPrefix(variable.Type, "typedefs.")
		if isStructType(goType) {
			outputBuffer.WriteString(fmt.Sprintf(
				"export const Global_%s = { key: 'Global_%s', fromJson: %s.fromJson };\n",
				variable.Name, variable.Name, goType,
			))
		} else {
			outputBuffer.WriteString(fmt.Sprintf(
				"export const Global_%s = 'Global_%s';\n",
				variable.Name, variable.Name,
			))
		}
	}
	outputBuffer.WriteString("\n")

	if makeDirectoryError := os.MkdirAll(outputDirectory, os.ModePerm); makeDirectoryError != nil {
		log.Fatalf("Failed to create output directory: %v", makeDirectoryError)
	}
	if writeError := os.WriteFile(outputPath, outputBuffer.Bytes(), 0644); writeError != nil {
		log.Fatalf("Failed to write state.ts: %v", writeError)
	}
	fmt.Printf("Successfully generated %s!\n", outputPath)
}
