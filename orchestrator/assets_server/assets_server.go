package assets_server

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"time"
)

const (
	defaultAssetHost   = "0.0.0.0"
	defaultAssetPort   = "8099"
	maxMultipartMemory = 40 << 20 // 40 MB
	defaultFileMode    = 0o755
	defaultFilePerm    = 0o644
)

var sanitizeFileNamePattern = regexp.MustCompile(`[^a-zA-Z0-9._-]+`)

var builtInOverlayFiles = map[string]string{
	"pulse-placeholder.gif": "R0lGODlhAQABAIAAAO7u7gAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==",
	"noise-placeholder.gif": "R0lGODlhAQABAIAAAKysrAAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==",
	"bloom-placeholder.gif": "R0lGODlhAQABAIAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==",
}

type assetListItem struct {
	Name string `json:"name"`
	Path string `json:"path"`
	URL  string `json:"url"`
}

type assetListResponse struct {
	Items []assetListItem `json:"items"`
}

type assetUploadResponse struct {
	Name string `json:"name"`
	Path string `json:"path"`
	URL  string `json:"url"`
}

func resolveAssetRoot() string {
	configuredRoot := strings.TrimSpace(os.Getenv("VINYL_ASSET_STORAGE_PATH"))
	if configuredRoot != "" {
		return configuredRoot
	}
	return "./builds/assets"
}

func seedBuiltInOverlays(assetRoot string) error {
	overlayPath := filepath.Join(assetRoot, "overlays")

	for fileName, encoded := range builtInOverlayFiles {
		targetPath := filepath.Join(overlayPath, fileName)
		if _, err := os.Stat(targetPath); err == nil {
			continue
		}

		decoded, err := base64.StdEncoding.DecodeString(encoded)
		if err != nil {
			return fmt.Errorf("failed to decode %s: %w", fileName, err)
		}

		if err := os.WriteFile(targetPath, decoded, defaultFilePerm); err != nil {
			return fmt.Errorf("failed to write %s: %w", fileName, err)
		}
	}

	return nil
}

func createAssetDirectories(assetRoot string) error {
	categories := []string{"overlays", "album-covers", "ring-images"}
	if err := os.MkdirAll(assetRoot, defaultFileMode); err != nil {
		return fmt.Errorf("failed to create asset root: %w", err)
	}
	for _, category := range categories {
		categoryPath := filepath.Join(assetRoot, category)
		if err := os.MkdirAll(categoryPath, defaultFileMode); err != nil {
			return fmt.Errorf("failed to create category folder %s: %w", category, err)
		}
	}
	return nil
}

func sanitizeCategory(value string) string {
	trimmed := strings.TrimSpace(strings.ToLower(value))
	if trimmed == "" {
		return ""
	}
	replaced := sanitizeFileNamePattern.ReplaceAllString(trimmed, "-")
	return strings.Trim(replaced, "-._/")
}

// FIXED: Returns a clean, root-relative path.
// Browsers automatically resolve this against whatever domain/IP/port the user typed
// into their address bar, removing the need to manage dynamic host domains entirely.
func buildAssetURL(_ *http.Request, assetPath string) string {
	return assetPath
}

func handleAssetUpload(assetRoot string) http.HandlerFunc {
	return func(response http.ResponseWriter, request *http.Request) {
		if request.Method != http.MethodPost {
			http.Error(response, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		err := request.ParseMultipartForm(maxMultipartMemory)
		if err != nil {
			http.Error(response, "invalid multipart form", http.StatusBadRequest)
			return
		}

		category := sanitizeCategory(request.FormValue("category"))
		if category == "" {
			category = "uploads"
		}

		uploadedFile, fileHeader, err := request.FormFile("file")
		if err != nil {
			http.Error(response, "file is required", http.StatusBadRequest)
			return
		}
		defer uploadedFile.Close()

		fileExtension := filepath.Ext(fileHeader.Filename)
		safeBaseName := strings.TrimSuffix(fileHeader.Filename, fileExtension)
		safeBaseName = sanitizeFileNamePattern.ReplaceAllString(safeBaseName, "_")
		safeBaseName = strings.Trim(safeBaseName, "._-")
		if safeBaseName == "" {
			safeBaseName = "asset"
		}

		storedName := fmt.Sprintf("%d_%s%s", time.Now().UnixNano(), safeBaseName, fileExtension)
		categoryPath := filepath.Join(assetRoot, category)
		if err := os.MkdirAll(categoryPath, defaultFileMode); err != nil {
			http.Error(response, "failed to prepare category folder", http.StatusInternalServerError)
			return
		}

		targetPath := filepath.Join(categoryPath, storedName)
		destinationFile, err := os.Create(targetPath)
		if err != nil {
			http.Error(response, "failed to create file", http.StatusInternalServerError)
			return
		}
		defer destinationFile.Close()

		if _, err := io.Copy(destinationFile, uploadedFile); err != nil {
			http.Error(response, "failed to write file", http.StatusInternalServerError)
			return
		}

		// FIXED: Routed safely under the /api/assets/ unified location structure
		assetPath := fmt.Sprintf("/api/assets/files/%s/%s", category, storedName)
		uploadResponse := assetUploadResponse{
			Name: storedName,
			Path: assetPath,
			URL:  buildAssetURL(request, assetPath),
		}

		response.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(response).Encode(uploadResponse)
	}
}

func handleAssetList(assetRoot string) http.HandlerFunc {
	return func(response http.ResponseWriter, request *http.Request) {
		if request.Method != http.MethodGet {
			http.Error(response, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		category := sanitizeCategory(request.URL.Query().Get("category"))
		if category == "" {
			category = "overlays"
		}

		categoryPath := filepath.Join(assetRoot, category)
		directoryEntries, err := os.ReadDir(categoryPath)
		if err != nil {
			response.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(response).Encode(assetListResponse{Items: []assetListItem{}})
			return
		}

		items := make([]assetListItem, 0, len(directoryEntries))
		for _, directoryEntry := range directoryEntries {
			if directoryEntry.IsDir() {
				continue
			}

			// FIXED: Routed safely under the /api/assets/ unified location structure
			assetPath := fmt.Sprintf("/api/assets/files/%s/%s", category, directoryEntry.Name())
			items = append(items, assetListItem{
				Name: directoryEntry.Name(),
				Path: assetPath,
				URL:  buildAssetURL(request, assetPath),
			})
		}

		sort.Slice(items, func(i, j int) bool {
			return items[i].Name < items[j].Name
		})

		response.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(response).Encode(assetListResponse{Items: items})
	}
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		response.Header().Set("Access-Control-Allow-Origin", "*")
		response.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		response.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if request.Method == http.MethodOptions {
			response.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(response, request)
	})
}

func getEnvOrDefault(key string, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

func StartAssetServer() {
	assetRoot := resolveAssetRoot()

	assetDirectoryError := createAssetDirectories(assetRoot)
	if assetDirectoryError != nil {
		log.Printf("Asset server disabled: %v", assetDirectoryError)
		return
	}

	builtInOverlayError := seedBuiltInOverlays(assetRoot)
	if builtInOverlayError != nil {
		log.Printf("Asset server warning: unable to seed built-in overlays: %v", builtInOverlayError)
	}

	serverMux := http.NewServeMux()
	serverMux.Handle("/api/assets/upload", withCORS(handleAssetUpload(assetRoot)))
	serverMux.Handle("/api/assets/list", withCORS(handleAssetList(assetRoot)))

	// FIXED: Static file server mounted inside the existing Nginx proxy route scope
	serverMux.Handle("/api/assets/files/", withCORS(http.StripPrefix("/api/assets/files/", http.FileServer(http.Dir(assetRoot)))))

	host := getEnvOrDefault("VINYL_ASSET_HOST", defaultAssetHost)
	port := getEnvOrDefault("VINYL_ASSET_PORT", defaultAssetPort)
	serverAddress := fmt.Sprintf("%s:%s", host, port)

	go func() {
		log.Printf("Asset server listening on http://%s", serverAddress)
		if err := http.ListenAndServe(serverAddress, serverMux); err != nil {
			log.Printf("Asset server stopped: %v", err)
		}
	}()
}
