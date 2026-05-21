package assets

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"

	"vinyl-orchestrator/core"
)

type AssetPlugin struct {
	systemDataSource  core.DataSource
	libraryRepository core.LibraryRepository
	assetRootPath     string
}

func NewAssetPlugin() *AssetPlugin {
	return &AssetPlugin{}
}

func (plugin *AssetPlugin) Name() string {
	return "Standard_Static_Asset_Manager"
}

func (plugin *AssetPlugin) Init(dataSource core.DataSource, libraryRepository core.LibraryRepository) error {
	plugin.systemDataSource = dataSource
	plugin.libraryRepository = libraryRepository
	plugin.assetRootPath = plugin.resolveAssetRoot()
	return plugin.initializeFileSystem()
}

func (plugin *AssetPlugin) resolveAssetRoot() string {
	configuredPath := os.Getenv("VINYL_ASSET_STORAGE_PATH")
	if configuredPath != "" {
		return configuredPath
	}
	return "./builds/assets"
}

func (plugin *AssetPlugin) initializeFileSystem() error {
	requiredAssetCategories := []string{"overlays", "labels", "outer-rings", "covers", "utils", "ring-images", "album-covers"}

	if directoryCreationError := os.MkdirAll(plugin.assetRootPath, 0755); directoryCreationError != nil {
		return directoryCreationError
	}

	for _, assetCategory := range requiredAssetCategories {
		categoryDirectoryPath := filepath.Join(plugin.assetRootPath, assetCategory)
		if categoryCreationError := os.MkdirAll(categoryDirectoryPath, 0755); categoryCreationError != nil {
			return categoryCreationError
		}
	}
	return nil
}

func (plugin *AssetPlugin) StartPlugin(applicationContext context.Context) error {
	fmt.Println("Asset Manager Online: Serving files from /assets")
	return nil
}

func (plugin *AssetPlugin) RegisterRoutes(requestRouter *http.ServeMux) {
	absPath, err := filepath.Abs(plugin.assetRootPath)
	if err != nil {
		absPath = plugin.assetRootPath
	}

	fileServerHandler := http.StripPrefix("/assets/", http.FileServer(http.Dir(absPath)))

	corsFileServer := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "*")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		fileServerHandler.ServeHTTP(w, r)
	})

	requestRouter.Handle("/assets/", corsFileServer)

	requestRouter.HandleFunc("/api/assets/upload", plugin.handleAssetUpload)
	requestRouter.HandleFunc("/api/assets/upload/", plugin.handleAssetUpload)
	requestRouter.HandleFunc("/api/assets/list", plugin.handleAssetList)
	requestRouter.HandleFunc("/api/assets/list/", plugin.handleAssetList)
}

func (plugin *AssetPlugin) handleAssetUpload(responseWriter http.ResponseWriter, httpRequest *http.Request) {
	if !plugin.validatePostMethod(responseWriter, httpRequest) {
		return
	}

	uploadedFile, fileHeader, fileRetrievalError := plugin.extractUploadedFile(httpRequest)
	if fileRetrievalError != nil {
		http.Error(responseWriter, "Error retrieving uploaded file", http.StatusBadRequest)
		return
	}
	defer uploadedFile.Close()

	assetCategory := plugin.determineAssetCategory(httpRequest)
	targetFilePath := filepath.Join(plugin.assetRootPath, assetCategory, fileHeader.Filename)

	if fileSaveError := plugin.saveFileToDisk(uploadedFile, targetFilePath); fileSaveError != nil {
		http.Error(responseWriter, "Error saving asset to disk", http.StatusInternalServerError)
		return
	}

	plugin.sendSuccessfulUploadResponse(responseWriter, assetCategory, fileHeader.Filename)
}

func (plugin *AssetPlugin) validatePostMethod(responseWriter http.ResponseWriter, httpRequest *http.Request) bool {
	if httpRequest.Method != http.MethodPost {
		http.Error(responseWriter, "HTTP Method not allowed", http.StatusMethodNotAllowed)
		return false
	}
	return true
}

func (plugin *AssetPlugin) extractUploadedFile(httpRequest *http.Request) (multipart.File, *multipart.FileHeader, error) {
	parseFormError := httpRequest.ParseMultipartForm(10 << 20)
	if parseFormError != nil {
		return nil, nil, parseFormError
	}
	return httpRequest.FormFile("file")
}

func (plugin *AssetPlugin) determineAssetCategory(httpRequest *http.Request) string {
	assetCategory := httpRequest.FormValue("category")
	if assetCategory == "" {
		assetCategory = httpRequest.FormValue("folder")
	}
	if assetCategory == "" {
		assetCategory = "covers"
	}
	return assetCategory
}

func (plugin *AssetPlugin) saveFileToDisk(uploadedFile multipart.File, targetFilePath string) error {
	destinationFile, creationError := os.Create(targetFilePath)
	if creationError != nil {
		return creationError
	}
	defer destinationFile.Close()

	_, copyError := io.Copy(destinationFile, uploadedFile)
	return copyError
}

func (plugin *AssetPlugin) sendSuccessfulUploadResponse(responseWriter http.ResponseWriter, assetCategory string, filename string) {
	responseWriter.WriteHeader(http.StatusOK)

	assetUrlPath := fmt.Sprintf("/assets/%s/%s", assetCategory, filename)
	fmt.Fprint(responseWriter, assetUrlPath)
}

func (plugin *AssetPlugin) handleAssetList(responseWriter http.ResponseWriter, httpRequest *http.Request) {
	foundAssetPaths := make([]string, 0)

	directoryWalkError := filepath.Walk(plugin.assetRootPath, func(currentPath string, fileInformation os.FileInfo, incomingError error) error {
		if incomingError != nil {
			return incomingError
		}
		if !fileInformation.IsDir() {
			relativePath, pathResolutionError := filepath.Rel(plugin.assetRootPath, currentPath)
			if pathResolutionError == nil {
				foundAssetPaths = append(foundAssetPaths, relativePath)
			}
		}
		return nil
	})

	if directoryWalkError != nil {
		http.Error(responseWriter, "Error listing asset files", http.StatusInternalServerError)
		return
	}

	responseWriter.Header().Set("Content-Type", "application/json")
	jsonEncoder := json.NewEncoder(responseWriter)
	jsonEncoder.Encode(foundAssetPaths)
}

func (plugin *AssetPlugin) StopPlugin(applicationContext context.Context) error {
	return nil
}
