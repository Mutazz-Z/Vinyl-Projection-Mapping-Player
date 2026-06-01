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


var uint8Enums = map[string][]string{}

var boolEnums = map[string][2]string{}

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
						// Avoid duplicates.
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
}

// ── JS helpers ────────────────────────────────────────────────────────────────

func jsDoc(goType string) string {
	goType = strings.TrimPrefix(goType, "typedefs.")
	switch goType {
	case "string":
		return "string"
	case "int", "uint8", "int64", "float64", "float32":
		return "number"
	case "bool":
		return "boolean"
	case "interface{}":
		return "*"
	default:
		return goType
	}
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


type EnumEntry struct {
	JSKey string
	Value interface{}
}

type EnumBlock struct {
	JSName  string
	Entries []EnumEntry
}

type TemplateData struct {
	Variables  []Variable
	EnumBlocks []EnumBlock
}

// ── Template ──────────────────────────────────────────────────────────────────

const jsTemplate = `// ==========================================
// GENERATED CODE - DO NOT EDIT
// ==========================================

// ── Enum value maps ───────────────────────────────────────────────────────────
// Mirror of Go/Dart enum definitions — use these instead of raw numbers/bools.
{{range .EnumBlocks}}
const {{.JSName}} = Object.freeze({
{{- range .Entries}}
    {{.JSKey}}: {{.Value}},
{{- end}}
});
{{end}}
// ── State key constants ───────────────────────────────────────────────────────
// Use these with DataSource_Read / DataSource_Write / DataSource_OnChanged.
//
//   DataSource_Write(dataSource, Global_ActiveRecordTrackName, trackName);
//   const value = await DataSource_Read(dataSource, Global_CurrentProjectorData);
//   DataSource_OnChanged(dataSource, function (variable, data) {
//       if (variable === Global_MediaPlaybackState) { ... }
//   });
{{range .Variables}}
/** @type {string} {{jsDoc .Type}} ({{.Storage}}) */
const Global_{{.Name}} = 'Global_{{.Name}}';
{{end}}`

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
		falseName, trueName := pair[0], pair[1]
		if falseName == "" {
			falseName = "False"
		}
		if trueName == "" {
			trueName = "True"
		}
		block := EnumBlock{
			JSName: jsName,
			Entries: []EnumEntry{
				{JSKey: stripTypePrefix(typeName, falseName), Value: false},
				{JSKey: stripTypePrefix(typeName, trueName), Value: true},
			},
		}
		enumBlocks = append(enumBlocks, block)
	}

	data := TemplateData{
		Variables:  registry.Variables,
		EnumBlocks: enumBlocks,
	}

	funcMap := template.FuncMap{
		"jsDoc": jsDoc,
	}

	tmpl, err := template.New("stateJs").Funcs(funcMap).Parse(jsTemplate)
	if err != nil {
		log.Fatalf("Failed to parse template: %v", err)
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		log.Fatalf("Failed to execute template: %v", err)
	}

	if err := os.MkdirAll(outputDir, os.ModePerm); err != nil {
		log.Fatalf("Failed to create output directory: %v", err)
	}

	if err := os.WriteFile(outputPath, buf.Bytes(), 0644); err != nil {
		log.Fatalf("Failed to write state.js: %v", err)
	}

	fmt.Printf("Successfully generated %s!\n", outputPath)
}
