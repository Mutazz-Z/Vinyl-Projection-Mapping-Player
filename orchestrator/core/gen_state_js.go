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

// ── YAML registry ─────────────────────────────────────────────────────────────

type Variable struct {
	Name    string `yaml:"name"`
	Storage string `yaml:"storage"`
	Type    string `yaml:"type"`
	Default string `yaml:"default"`
}

type Registry struct {
	Variables []Variable `yaml:"variables"`
}

// ── Typedef registries ────────────────────────────────────────────────────────

var uint8Enums = map[string][]string{}
var boolEnums = map[string][2]string{}

// structFields: struct name → ordered fields
type StructField struct {
	JSName  string // camelCase
	JsonKey string // json tag value
	GoType  string // raw Go type string
}

var structFields = map[string][]StructField{}

func getTypeName(expr ast.Expr) string {
	switch t := expr.(type) {
	case *ast.Ident:
		return t.Name
	case *ast.ArrayType:
		return "[]" + getTypeName(t.Elt)
	case *ast.SelectorExpr:
		return getTypeName(t.X) + "." + t.Sel.Name
	default:
		return ""
	}
}

func collectTypedefs(typedefsDir string) {
	fset := token.NewFileSet()
	packages, err := parser.ParseDir(fset, typedefsDir, nil, 0)
	if err != nil {
		log.Fatalf("Failed to parse typedefs: %v", err)
	}

	for _, pkg := range packages {
		for _, file := range pkg.Files {
			for _, decl := range file.Decls {
				genDecl, ok := decl.(*ast.GenDecl)
				if !ok || genDecl.Tok != token.TYPE {
					continue
				}
				for _, spec := range genDecl.Specs {
					ts := spec.(*ast.TypeSpec)
					switch getTypeName(ts.Type) {
					case "uint8":
						uint8Enums[ts.Name.Name] = []string{}
					case "bool":
						boolEnums[ts.Name.Name] = [2]string{}
					}
					if _, ok := ts.Type.(*ast.StructType); ok {
						structFields[ts.Name.Name] = []StructField{}
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
					if typeName := getTypeName(vs.Type); typeName != "" {
						if _, isUint8 := uint8Enums[typeName]; isUint8 {
							currentEnumType = typeName
						} else if _, isBool := boolEnums[typeName]; isBool {
							currentEnumType = typeName
						} else {
							currentEnumType = ""
						}
					}
					if currentEnumType == "" {
						continue
					}
					constName := vs.Names[0].Name
					if _, isUint8 := uint8Enums[currentEnumType]; isUint8 {
						already := false
						for _, e := range uint8Enums[currentEnumType] {
							if e == constName {
								already = true
								break
							}
						}
						if !already {
							uint8Enums[currentEnumType] = append(uint8Enums[currentEnumType], constName)
						}
					} else if _, isBool := boolEnums[currentEnumType]; isBool {
						if len(vs.Values) > 0 {
							if ident, ok := vs.Values[0].(*ast.Ident); ok {
								pair := boolEnums[currentEnumType]
								if ident.Name == "false" {
									pair[0] = constName
								} else if ident.Name == "true" {
									pair[1] = constName
								}
								boolEnums[currentEnumType] = pair
							}
						}
					}
				}
			}
		}
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
				var fields []StructField
				for _, field := range structType.Fields.List {
					if len(field.Names) == 0 {
						continue
					}
					fieldName := field.Names[0].Name
					goType := getTypeName(field.Type)
					jsName := strings.ToLower(fieldName[:1]) + fieldName[1:]
					jsonKey := jsName
					if field.Tag != nil {
						tagRaw := strings.Trim(field.Tag.Value, "`")
						if parsed := reflect.StructTag(tagRaw).Get("json"); parsed != "" {
							jsonKey = strings.Split(parsed, ",")[0]
						}
					}
					fields = append(fields, StructField{
						JSName:  jsName,
						JsonKey: jsonKey,
						GoType:  goType,
					})
				}
				structFields[ts.Name.Name] = fields
				return false
			})
		}
	}
}

// ── JS type helpers ───────────────────────────────────────────────────────────

func isStructType(goType string) bool {
	goType = strings.TrimPrefix(goType, "typedefs.")
	if strings.HasPrefix(goType, "[]") {
		return false
	}
	_, ok := structFields[goType]
	return ok
}

func isEnumType(goType string) bool {
	goType = strings.TrimPrefix(goType, "typedefs.")
	_, isUint8 := uint8Enums[goType]
	_, isBool := boolEnums[goType]
	return isUint8 || isBool
}

func isBoolEnum(goType string) bool {
	goType = strings.TrimPrefix(goType, "typedefs.")
	_, ok := boolEnums[goType]
	return ok
}

func bareType(goType string) string {
	return strings.TrimPrefix(goType, "typedefs.")
}

func jsClassName(goType string) string {
	return strings.TrimPrefix(goType, "typedefs.")
}

func stripTypePrefix(typeName, constName string) string {
	prefix := typeName + "_"
	if strings.HasPrefix(constName, prefix) {
		return constName[len(prefix):]
	}
	if idx := strings.Index(constName, "_"); idx != -1 {
		return constName[idx+1:]
	}
	return constName
}

func isCustomType(goType string) bool {
	return isStructType(goType) || isEnumType(goType)
}

// ── Template data ─────────────────────────────────────────────────────────────

type EnumEntry struct {
	JSKey string
	Value interface{}
}

type EnumBlock struct {
	JSName  string
	Entries []EnumEntry
}

type StructDef struct {
	Name   string
	Fields []StructField
}

type KeyDef struct {
	Name        string
	KeyStr      string
	GoType      string
	HasFromJson bool
}

type TemplateData struct {
	EnumBlocks []EnumBlock
	Structs    []StructDef
	Keys       []KeyDef
}

func writeStructClass(buf *bytes.Buffer, name string, fields []StructField) {
	buf.WriteString(fmt.Sprintf("class %s {\n", name))

	// constructor
	buf.WriteString("    constructor({\n")
	for _, f := range fields {
		buf.WriteString(fmt.Sprintf("        %s,\n", f.JSName))
	}
	buf.WriteString("    }) {\n")
	for _, f := range fields {
		buf.WriteString(fmt.Sprintf("        this.%s = %s;\n", f.JSName, f.JSName))
	}
	buf.WriteString("    }\n\n")

	// static fromJson
	buf.WriteString(fmt.Sprintf("    static fromJson(json) {\n"))
	buf.WriteString(fmt.Sprintf("        if (!json || typeof json !== 'object') return new %s({});\n", name))
	buf.WriteString(fmt.Sprintf("        return new %s({\n", name))
	for _, f := range fields {
		raw := strings.TrimPrefix(f.GoType, "typedefs.")
		isList := strings.HasPrefix(raw, "[]")
		if isList {
			innerType := raw[2:]
			if isStructType(innerType) {
				buf.WriteString(fmt.Sprintf("            %s: Array.isArray(json['%s']) ? json['%s'].map(%s.fromJson) : [],\n",
					f.JSName, f.JsonKey, f.JsonKey, innerType))
			} else {
				buf.WriteString(fmt.Sprintf("            %s: Array.isArray(json['%s']) ? json['%s'] : [],\n",
					f.JSName, f.JsonKey, f.JsonKey))
			}
		} else if isStructType(f.GoType) {
			buf.WriteString(fmt.Sprintf("            %s: %s.fromJson(json['%s'] ?? {}),\n",
				f.JSName, jsClassName(f.GoType), f.JsonKey))
		} else if isEnumType(f.GoType) {
			if isBoolEnum(f.GoType) {
				buf.WriteString(fmt.Sprintf("            %s: json['%s'] === true,\n",
					f.JSName, f.JsonKey))
			} else {
				buf.WriteString(fmt.Sprintf("            %s: Number(json['%s'] ?? 0),\n",
					f.JSName, f.JsonKey))
			}
		} else {
			switch raw {
			case "string":
				buf.WriteString(fmt.Sprintf("            %s: typeof json['%s'] === 'string' ? json['%s'] : '',\n",
					f.JSName, f.JsonKey, f.JsonKey))
			case "int", "uint8", "int64", "float64", "float32":
				buf.WriteString(fmt.Sprintf("            %s: Number(json['%s'] ?? 0),\n",
					f.JSName, f.JsonKey))
			case "bool":
				buf.WriteString(fmt.Sprintf("            %s: json['%s'] === true,\n",
					f.JSName, f.JsonKey))
			default:
				buf.WriteString(fmt.Sprintf("            %s: json['%s'] ?? null,\n",
					f.JSName, f.JsonKey))
			}
		}
	}
	buf.WriteString("        });\n    }\n\n")

	// toJson
	buf.WriteString("    toJson() {\n        return {\n")
	for _, f := range fields {
		raw := strings.TrimPrefix(f.GoType, "typedefs.")
		isList := strings.HasPrefix(raw, "[]")
		if isList && isStructType(raw[2:]) {
			buf.WriteString(fmt.Sprintf("            '%s': this.%s.map(function(e) { return e.toJson(); }),\n",
				f.JsonKey, f.JSName))
		} else if isStructType(f.GoType) || isEnumType(f.GoType) {
			buf.WriteString(fmt.Sprintf("            '%s': this.%s,\n", f.JsonKey, f.JSName))
		} else {
			buf.WriteString(fmt.Sprintf("            '%s': this.%s,\n", f.JsonKey, f.JSName))
		}
	}
	buf.WriteString("        };\n    }\n}\n\n")
}

// ── Template ──────────────────────────────────────────────────────────────────

const jsTemplate = `// ==========================================
// GENERATED CODE - DO NOT EDIT
// ==========================================

// ── Enum value maps ───────────────────────────────────────────────────────────
{{range .EnumBlocks}}
const {{.JSName}} = Object.freeze({
{{- range .Entries}}
    {{.JSKey}}: {{.Value}},
{{- end}}
});
{{end}}
`

// ── Main ──────────────────────────────────────────────────────────────────────

func main() {
	typedefsDir := "../typedefs"
	registryPath := "registry.yaml"
	outputDir := "../../projector_display/js"
	outputPath := outputDir + "/state.js"

	collectTypedefs(typedefsDir)

	yamlFile, err := os.ReadFile(registryPath)
	if err != nil {
		log.Fatalf("Failed to read YAML: %v", err)
	}
	var registry Registry
	if err := yaml.Unmarshal(yamlFile, &registry); err != nil {
		log.Fatalf("Failed to parse YAML: %v", err)
	}

	// ── Build enum blocks ─────────────────────────────────────────────────────
	var enumBlocks []EnumBlock
	for typeName, consts := range uint8Enums {
		if len(consts) == 0 {
			continue
		}
		jsName := strings.TrimSuffix(typeName, "_t")
		block := EnumBlock{JSName: jsName}
		for i, c := range consts {
			block.Entries = append(block.Entries, EnumEntry{
				JSKey: stripTypePrefix(typeName, c),
				Value: i,
			})
		}
		enumBlocks = append(enumBlocks, block)
	}
	for typeName, pair := range boolEnums {
		jsName := strings.TrimSuffix(typeName, "_t")
		falseName := pair[0]
		trueName := pair[1]
		if falseName == "" {
			falseName = "False"
		}
		if trueName == "" {
			trueName = "True"
		}
		enumBlocks = append(enumBlocks, EnumBlock{
			JSName: jsName,
			Entries: []EnumEntry{
				{JSKey: stripTypePrefix(typeName, falseName), Value: false},
				{JSKey: stripTypePrefix(typeName, trueName), Value: true},
			},
		})
	}

	tmpl, err := template.New("stateJs").Parse(jsTemplate)
	if err != nil {
		log.Fatalf("Failed to parse template: %v", err)
	}
	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, TemplateData{EnumBlocks: enumBlocks}); err != nil {
		log.Fatalf("Failed to execute template: %v", err)
	}

	buf.WriteString("// ── Struct classes ──────────────────────────────────────────────────────────\n\n")
	for name, fields := range structFields {
		if len(fields) == 0 {
			continue
		}
		writeStructClass(&buf, name, fields)
	}

	buf.WriteString("// ── State key constants ─────────────────────────────────────────────────────\n\n")
	for _, v := range registry.Variables {
		goType := strings.TrimPrefix(v.Type, "typedefs.")
		if isStructType(goType) {
			buf.WriteString(fmt.Sprintf(
				"const Global_%s = { key: 'Global_%s', fromJson: %s.fromJson };\n",
				v.Name, v.Name, goType,
			))
		} else {
			buf.WriteString(fmt.Sprintf(
				"const Global_%s = 'Global_%s';\n",
				v.Name, v.Name,
			))
		}
	}
	buf.WriteString("\n")

	if err := os.MkdirAll(outputDir, os.ModePerm); err != nil {
		log.Fatalf("Failed to create output directory: %v", err)
	}
	if err := os.WriteFile(outputPath, buf.Bytes(), 0644); err != nil {
		log.Fatalf("Failed to write state.js: %v", err)
	}
	fmt.Printf("Successfully generated %s!\n", outputPath)
}
