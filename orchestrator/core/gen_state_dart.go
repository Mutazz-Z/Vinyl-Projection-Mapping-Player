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
	"path/filepath"
	"reflect"
	"strings"
	"text/template"

	"gopkg.in/yaml.v3"
)

func getTypeName(expr ast.Expr) string {
	switch t := expr.(type) {
	case *ast.Ident:
		return t.Name
	case *ast.ArrayType:
		return "[]" + getTypeName(t.Elt)
	case *ast.SelectorExpr:
		return getTypeName(t.X) + "." + t.Sel.Name
	default:
		return "dynamic"
	}
}

var uint8Enums = map[string][]string{}

var boolEnums = map[string][2]string{}

func isEnumType(goType string) bool {
	goType = strings.TrimPrefix(goType, "typedefs.")
	_, isUint8 := uint8Enums[goType]
	_, isBool := boolEnums[goType]
	return isUint8 || isBool
}

func toDartType(goType string) string {
	goType = strings.TrimPrefix(goType, "typedefs.")

	if strings.HasPrefix(goType, "[]") {
		inner := toDartType(goType[2:])
		return fmt.Sprintf("List<%s>", inner)
	}
	if _, ok := uint8Enums[goType]; ok {
		return goType
	}
	if _, ok := boolEnums[goType]; ok {
		return goType
	}
	switch goType {
	case "string":
		return "String"
	case "int", "uint8", "int64":
		return "int"
	case "float64", "float32":
		return "double"
	case "bool":
		return "bool"
	case "interface{}":
		return "dynamic"
	default:
		return goType
	}
}

func isCustomStruct(goType string) bool {
	goType = strings.TrimPrefix(goType, "typedefs.")
	if strings.HasPrefix(goType, "[]") {
		return false
	}
	if isEnumType(goType) {
		return false
	}
	switch goType {
	case "string", "int", "uint8", "int64", "float64", "float32", "bool", "interface{}":
		return false
	default:
		return true
	}
}

type Variable struct {
	Name string `yaml:"name"`
	Type string `yaml:"type"`
}

type Registry struct {
	Variables []Variable `yaml:"variables"`
}

const dartGlobalsTemplate = `
{{range .Variables}}
final global{{.Name}} = TypedKey<{{toDartType .Type}}>(
  'Global_{{.Name}}',
  {{- if isCustomStruct .Type}}
  fromJson: (json) => {{toDartType .Type}}.fromJson(json),
  toJson: (data) => data.toJson(),
  {{- else if isEnumType .Type}}
  fromJson: (json) => {{toDartType .Type}}.fromJson(json),
  toJson: (data) => data.toJson(),
  {{- end}}
);
{{end}}
`

func collectTypedefs(packages map[string]*ast.Package) {
	for _, pkg := range packages {
		for _, file := range pkg.Files {
			for _, decl := range file.Decls {
				genDecl, ok := decl.(*ast.GenDecl)
				if !ok {
					continue
				}

				if genDecl.Tok == token.TYPE {
					for _, spec := range genDecl.Specs {
						ts := spec.(*ast.TypeSpec)
						underlying := getTypeName(ts.Type)
						switch underlying {
						case "uint8":
							if _, exists := uint8Enums[ts.Name.Name]; !exists {
								uint8Enums[ts.Name.Name] = []string{}
							}
						case "bool":
							if _, exists := boolEnums[ts.Name.Name]; !exists {
								boolEnums[ts.Name.Name] = [2]string{}
							}
						}
					}
				}

				if genDecl.Tok == token.CONST {
					for _, spec := range genDecl.Specs {
						vs, ok := spec.(*ast.ValueSpec)
						if !ok {
							continue
						}
						typeName := getTypeName(vs.Type)
						if typeName == "dynamic" || typeName == "" {
							continue
						}
						constName := vs.Names[0].Name
						if _, ok := uint8Enums[typeName]; ok {
							uint8Enums[typeName] = append(uint8Enums[typeName], constName)
						} else if _, ok := boolEnums[typeName]; ok {
							if len(vs.Values) > 0 {
								if ident, ok := vs.Values[0].(*ast.Ident); ok {
									if ident.Name == "false" {
										pair := boolEnums[typeName]
										pair[0] = constName
										boolEnums[typeName] = pair
									} else if ident.Name == "true" {
										pair := boolEnums[typeName]
										pair[1] = constName
										boolEnums[typeName] = pair
									}
								}
							}
						}
					}
				}
			}
		}
	}

	for _, pkg := range packages {
		for _, file := range pkg.Files {
			for _, decl := range file.Decls {
				genDecl, ok := decl.(*ast.GenDecl)
				if !ok || genDecl.Tok != token.CONST {
					continue
				}
				var currentEnumType string
				for _, spec := range genDecl.Specs {
					vs, ok := spec.(*ast.ValueSpec)
					if !ok {
						continue
					}
					if typeName := getTypeName(vs.Type); typeName != "dynamic" && typeName != "" {
						if _, ok := uint8Enums[typeName]; ok {
							currentEnumType = typeName
						} else {
							currentEnumType = ""
						}
					}
					if currentEnumType == "" {
						continue
					}
					constName := vs.Names[0].Name
					found := false
					for _, existing := range uint8Enums[currentEnumType] {
						if existing == constName {
							found = true
							break
						}
					}
					if !found {
						uint8Enums[currentEnumType] = append(uint8Enums[currentEnumType], constName)
					}
				}
			}
		}
	}
}

func writeUint8Enum(buf *bytes.Buffer, name string, consts []string) {
	buf.WriteString(fmt.Sprintf("enum %s {\n", name))
	for _, c := range consts {
		buf.WriteString(fmt.Sprintf("  %s,\n", c))
	}
	buf.WriteString("  ;\n\n")
	buf.WriteString(fmt.Sprintf("  static %s fromJson(dynamic json) {\n", name))
	buf.WriteString("    final idx = (json ?? 0) as int;\n")
	buf.WriteString(fmt.Sprintf("    return %s.values[idx.clamp(0, %s.values.length - 1)];\n", name, name))
	buf.WriteString("  }\n\n")
	buf.WriteString("  int toJson() => index;\n")
	buf.WriteString("}\n\n")
}

func writeBoolEnum(buf *bytes.Buffer, name string, consts [2]string) {
	falseName := consts[0]
	trueName := consts[1]
	if falseName == "" {
		falseName = "falseValue"
	}
	if trueName == "" {
		trueName = "trueValue"
	}
	buf.WriteString(fmt.Sprintf("enum %s {\n", name))
	buf.WriteString(fmt.Sprintf("  %s,\n", falseName))
	buf.WriteString(fmt.Sprintf("  %s,\n", trueName))
	buf.WriteString("  ;\n\n")
	buf.WriteString(fmt.Sprintf("  static %s fromJson(dynamic json) {\n", name))
	buf.WriteString(fmt.Sprintf("    return (json == true) ? %s.%s : %s.%s;\n", name, trueName, name, falseName))
	buf.WriteString("  }\n\n")
	buf.WriteString(fmt.Sprintf("  bool toJson() => this == %s.%s;\n", name, trueName))
	buf.WriteString("}\n\n")
}


func main() {
	typedefsDir := "../typedefs"
	registryPath := "registry.yaml"
	outputDir := "../../web_app/lib/factories"
	outputPath := filepath.Join(outputDir, "state.dart")

	fset := token.NewFileSet()
	packages, err := parser.ParseDir(fset, typedefsDir, nil, parser.ParseComments)
	if err != nil {
		log.Fatalf("Failed to parse typedefs: %v", err)
	}

	collectTypedefs(packages)

	var dartClasses bytes.Buffer
	dartClasses.WriteString("// ignore_for_file: camel_case_types, non_constant_identifier_names, constant_identifier_names\n")
	dartClasses.WriteString("// ==========================================\n")
	dartClasses.WriteString("// GENERATED CODE - DO NOT EDIT\n")
	dartClasses.WriteString("// ==========================================\n\n")
	dartClasses.WriteString("import 'typed_key.dart';\n\n")

	for name, consts := range uint8Enums {
		if len(consts) > 0 {
			writeUint8Enum(&dartClasses, name, consts)
		}
	}
	for name, consts := range boolEnums {
		writeBoolEnum(&dartClasses, name, consts)
	}

	for _, pkg := range packages {
		for _, file := range pkg.Files {
			ast.Inspect(file, func(n ast.Node) bool {
				ts, ok := n.(*ast.TypeSpec)
				if !ok {
					return true
				}

				structType, ok := ts.Type.(*ast.StructType)
				if !ok {
					return true
				}

				structName := ts.Name.Name
				dartClasses.WriteString(fmt.Sprintf("class %s {\n", structName))

				type fieldData struct {
					DartName string
					JsonKey  string
					GoType   string
					DartType string
				}
				var fields []fieldData

				for _, field := range structType.Fields.List {
					fieldName := field.Names[0].Name
					goTypeName := getTypeName(field.Type)
					dartTypeName := toDartType(goTypeName)

					dartName := strings.ToLower(fieldName[:1]) + fieldName[1:]
					jsonKey := dartName

					if field.Tag != nil {
						tagRaw := strings.Trim(field.Tag.Value, "`")
						if parsedJson := reflect.StructTag(tagRaw).Get("json"); parsedJson != "" {
							jsonKey = strings.Split(parsedJson, ",")[0]
						}
					}

					dartClasses.WriteString(fmt.Sprintf("  final %s %s;\n", dartTypeName, dartName))
					fields = append(fields, fieldData{
						DartName: dartName,
						JsonKey:  jsonKey,
						GoType:   goTypeName,
						DartType: dartTypeName,
					})
				}

				dartClasses.WriteString(fmt.Sprintf("\n  %s({\n", structName))
				for _, f := range fields {
					dartClasses.WriteString(fmt.Sprintf("    required this.%s,\n", f.DartName))
				}
				dartClasses.WriteString("  });\n\n")

				dartClasses.WriteString(fmt.Sprintf("  factory %s.fromJson(Map<String, dynamic> json) {\n", structName))
				dartClasses.WriteString(fmt.Sprintf("    return %s(\n", structName))
				for _, f := range fields {
					rawGoType := strings.TrimPrefix(f.GoType, "typedefs.")
					isList := strings.HasPrefix(rawGoType, "[]")
					switch {
					case isList:
						innerType := rawGoType[2:]
						if isCustomStruct(innerType) {
							dartClasses.WriteString(fmt.Sprintf(
								"      %s: (json['%s'] as List?)?.map((e) => %s.fromJson(e)).toList() ?? [],\n",
								f.DartName, f.JsonKey, toDartType(innerType)))
						} else {
							dartClasses.WriteString(fmt.Sprintf(
								"      %s: List<%s>.from(json['%s'] ?? []),\n",
								f.DartName, toDartType(innerType), f.JsonKey))
						}
					case isCustomStruct(f.GoType):
						dartClasses.WriteString(fmt.Sprintf(
							"      %s: %s.fromJson(json['%s'] ?? {}),\n",
							f.DartName, f.DartType, f.JsonKey))
					case isEnumType(f.GoType):
						dartClasses.WriteString(fmt.Sprintf(
							"      %s: %s.fromJson(json['%s']),\n",
							f.DartName, f.DartType, f.JsonKey))
					case f.DartType == "String":
						dartClasses.WriteString(fmt.Sprintf(
							"      %s: json['%s']?.toString() ?? '',\n",
							f.DartName, f.JsonKey))
					case f.DartType == "int":
						dartClasses.WriteString(fmt.Sprintf(
							"      %s: json['%s'] ?? 0,\n",
							f.DartName, f.JsonKey))
					case f.DartType == "double":
						dartClasses.WriteString(fmt.Sprintf(
							"      %s: (json['%s'] ?? 0.0).toDouble(),\n",
							f.DartName, f.JsonKey))
					case f.DartType == "bool":
						dartClasses.WriteString(fmt.Sprintf(
							"      %s: json['%s'] ?? false,\n",
							f.DartName, f.JsonKey))
					default:
						dartClasses.WriteString(fmt.Sprintf(
							"      %s: json['%s'],\n",
							f.DartName, f.JsonKey))
					}
				}
				dartClasses.WriteString("    );\n  }\n")

				dartClasses.WriteString("  Map<String, dynamic> toJson() {\n    return {\n")
				for _, f := range fields {
					rawGoType := strings.TrimPrefix(f.GoType, "typedefs.")
					isList := strings.HasPrefix(rawGoType, "[]")
					switch {
					case isList && isCustomStruct(rawGoType[2:]):
						dartClasses.WriteString(fmt.Sprintf(
							"      '%s': %s.map((e) => e.toJson()).toList(),\n",
							f.JsonKey, f.DartName))
					case isCustomStruct(f.GoType), isEnumType(f.GoType):
						dartClasses.WriteString(fmt.Sprintf(
							"      '%s': %s.toJson(),\n",
							f.JsonKey, f.DartName))
					default:
						dartClasses.WriteString(fmt.Sprintf(
							"      '%s': %s,\n",
							f.JsonKey, f.DartName))
					}
				}
				dartClasses.WriteString("    };\n  }\n")

				dartClasses.WriteString("}\n\n")
				return false
			})
		}
	}

	yamlFile, err := os.ReadFile(registryPath)
	if err != nil {
		log.Fatalf("Failed to read YAML: %v", err)
	}

	var registry Registry
	if err := yaml.Unmarshal(yamlFile, &registry); err != nil {
		log.Fatalf("Failed to parse YAML: %v", err)
	}

	tmpl, err := template.New("dartGlobals").Funcs(template.FuncMap{
		"toDartType":     toDartType,
		"isCustomStruct": isCustomStruct,
		"isEnumType":     isEnumType,
	}).Parse(dartGlobalsTemplate)
	if err != nil {
		log.Fatalf("Failed to parse template: %v", err)
	}

	if err := tmpl.Execute(&dartClasses, registry); err != nil {
		log.Fatalf("Failed to execute template: %v", err)
	}

	if err := os.MkdirAll(outputDir, os.ModePerm); err != nil {
		log.Fatalf("Failed to create output directory: %v", err)
	}

	if err := os.WriteFile(outputPath, dartClasses.Bytes(), 0644); err != nil {
		log.Fatalf("Failed to write Dart file: %v", err)
	}

	fmt.Printf("Successfully generated %s from Go AST!\n", outputPath)
}
