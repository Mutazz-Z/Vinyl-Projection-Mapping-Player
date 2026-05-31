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

func toDartType(goType string) string {
	goType = strings.TrimPrefix(goType, "typedefs.")

	if strings.HasPrefix(goType, "[]") {
		inner := toDartType(goType[2:])
		return fmt.Sprintf("List<%s>", inner)
	}
	switch goType {
	case "string":
		return "String"
	case "int", "uint8", "int64", "VisualDataState_t", "MediaPlaybackState_t":
		return "int"
	case "float64", "float32":
		return "double"
	case "bool", "ReaderStatus_t", "ShelfStatus_t":
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
	switch goType {
	case "string", "int", "uint8", "int64", "float64", "float32", "bool", "interface{}":
		return false
	case "VisualDataState_t", "MediaPlaybackState_t", "ReaderStatus_t", "ShelfStatus_t":
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
  {{if isCustomStruct .Type}}fromJson: (json) => {{toDartType .Type}}.fromJson(json),
  toJson: (data) => data.toJson(),{{end}}
);
{{end}}
`

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

	var dartClasses bytes.Buffer
	dartClasses.WriteString("// ignore_for_file: camel_case_types, non_constant_identifier_names\n")
	dartClasses.WriteString("// ==========================================\n")
	dartClasses.WriteString("// GENERATED CODE - DO NOT EDIT\n")
	dartClasses.WriteString("// ==========================================\n\n")
	dartClasses.WriteString("import 'typed_key.dart';\n\n")

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
					JsonKey  string
					GoType   string
					DartType string
				}
				var fields []fieldData

				for _, field := range structType.Fields.List {
					fieldName := field.Names[0].Name
					goTypeName := getTypeName(field.Type)
					dartTypeName := toDartType(goTypeName)
					jsonKey := strings.ToLower(fieldName[:1]) + fieldName[1:]

					dartClasses.WriteString(fmt.Sprintf("  final %s %s;\n", dartTypeName, jsonKey))
					fields = append(fields, fieldData{JsonKey: jsonKey, GoType: goTypeName, DartType: dartTypeName})
				}

				dartClasses.WriteString(fmt.Sprintf("\n  %s({\n", structName))
				for _, f := range fields {
					dartClasses.WriteString(fmt.Sprintf("    required this.%s,\n", f.JsonKey))
				}
				dartClasses.WriteString("  });\n\n")

				dartClasses.WriteString(fmt.Sprintf("  factory %s.fromJson(Map<String, dynamic> json) {\n", structName))
				dartClasses.WriteString(fmt.Sprintf("    return %s(\n", structName))
				for _, f := range fields {
					isList := strings.HasPrefix(f.GoType, "[]")
					if isList {
						innerType := f.GoType[2:]
						if isCustomStruct(innerType) {
							dartClasses.WriteString(fmt.Sprintf("      %s: (json['%s'] as List?)?.map((e) => %s.fromJson(e)).toList() ?? [],\n", f.JsonKey, f.JsonKey, toDartType(innerType)))
						} else {
							dartClasses.WriteString(fmt.Sprintf("      %s: List<%s>.from(json['%s'] ?? []),\n", f.JsonKey, toDartType(innerType), f.JsonKey))
						}
					} else if isCustomStruct(f.GoType) {
						dartClasses.WriteString(fmt.Sprintf("      %s: %s.fromJson(json['%s'] ?? {}),\n", f.JsonKey, f.DartType, f.JsonKey))
					} else {
						dartClasses.WriteString(fmt.Sprintf("      %s: json['%s'],\n", f.JsonKey, f.JsonKey))
					}
				}
				dartClasses.WriteString("    );\n  }\n")

				dartClasses.WriteString("  Map<String, dynamic> toJson() {\n    return {\n")
				for _, f := range fields {
					isList := strings.HasPrefix(f.GoType, "[]")
					if isList && isCustomStruct(f.GoType[2:]) {
						dartClasses.WriteString(fmt.Sprintf("      '%s': %s.map((e) => e.toJson()).toList(),\n", f.JsonKey, f.JsonKey))
					} else if isCustomStruct(f.GoType) {
						dartClasses.WriteString(fmt.Sprintf("      '%s': %s.toJson(),\n", f.JsonKey, f.JsonKey))
					} else {
						dartClasses.WriteString(fmt.Sprintf("      '%s': %s,\n", f.JsonKey, f.JsonKey))
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
