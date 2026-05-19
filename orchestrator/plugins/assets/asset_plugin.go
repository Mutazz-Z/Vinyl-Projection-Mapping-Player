package assets

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"path/filepath"

	"vinyl-orchestrator/core"
)

type AssetPlugin struct {
	systemDataSource  core.DataSource
	libraryRepository core.LibraryRepository
	httpServer        *http.Server
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
	return "../builds/assets"
}

func (plugin *AssetPlugin) initializeFileSystem() error {
	requiredSubfolders := []string{"overlays", "labels", "outer-rings", "covers", "utils"}

	if err := os.MkdirAll(plugin.assetRootPath, 0755); err != nil {
		return err
	}

	for _, subfolder := range requiredSubfolders {
		path := filepath.Join(plugin.assetRootPath, subfolder)
		if err := os.MkdirAll(path, 0755); err != nil {
			return err
		}
	}
	return nil
}

func (plugin *AssetPlugin) StartPlugin(applicationContext context.Context) error {
	requestRouter := http.NewServeMux()

	fileServerHandler := http.FileServer(http.Dir(plugin.assetRootPath))
	requestRouter.Handle("/assets/", http.StripPrefix("/assets/", fileServerHandler))

	plugin.httpServer = &http.Server{
		Addr:    ":8099",
		Handler: plugin.enableCrossOriginRequests(requestRouter),
	}

	go func() {
		fmt.Println("Asset Manager Online: Serving files from /assets")
		plugin.httpServer.ListenAndServe()
	}()

	return nil
}

func (plugin *AssetPlugin) StopPlugin(applicationContext context.Context) error {
	if plugin.httpServer != nil {
		return plugin.httpServer.Shutdown(applicationContext)
	}
	return nil
}

func (plugin *AssetPlugin) enableCrossOriginRequests(nextHandler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		nextHandler.ServeHTTP(w, r)
	})
}
