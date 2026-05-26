package assets

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"path/filepath"

	"vinyl-orchestrator/core"

	"github.com/gin-gonic/gin"
)

type AssetPlugin struct {
	systemDataSource core.DataSource
	AlbumLibrary     core.AlbumLibrary
	assetRootPath    string
}

func NewAssetPlugin() *AssetPlugin {
	return &AssetPlugin{}
}

func (plugin *AssetPlugin) Name() string {
	return "Standard_Static_Asset_Manager"
}

func (plugin *AssetPlugin) resolveAssetRoot() string {
	configuredPath := os.Getenv("VINYL_ASSET_STORAGE_PATH")
	if configuredPath != "" {
		return configuredPath
	}
	return "./builds/assets"
}

func (plugin *AssetPlugin) initializeFileSystem() error {
	requiredAssetCategories := []string{"overlays", "labels", "outer-rings", "covers", "utils", "album-covers"}

	if err := os.MkdirAll(plugin.assetRootPath, 0755); err != nil {
		return err
	}

	for _, category := range requiredAssetCategories {
		if err := os.MkdirAll(filepath.Join(plugin.assetRootPath, category), 0755); err != nil {
			return err
		}
	}
	return nil
}

func (plugin *AssetPlugin) Init(dataSource core.DataSource, AlbumLibrary core.AlbumLibrary) error {
	plugin.systemDataSource = dataSource
	plugin.AlbumLibrary = AlbumLibrary
	plugin.assetRootPath = plugin.resolveAssetRoot()
	return plugin.initializeFileSystem()
}

func (plugin *AssetPlugin) StartPlugin(applicationContext context.Context) error {
	fmt.Println("Asset Manager Online: Serving files from /assets")
	return nil
}

func (plugin *AssetPlugin) StopPlugin(applicationContext context.Context) error {
	return nil
}

func (plugin *AssetPlugin) HandleGinAssetUpload(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.String(http.StatusBadRequest, "Error retrieving uploaded file")
		return
	}

	category := c.PostForm("category")
	if category == "" {
		category = "covers"
	}

	targetFilePath := filepath.Join(plugin.assetRootPath, category, file.Filename)

	if err := c.SaveUploadedFile(file, targetFilePath); err != nil {
		c.String(http.StatusInternalServerError, "Error saving asset to disk")
		return
	}

	assetUrlPath := fmt.Sprintf("/assets/%s/%s", category, file.Filename)
	c.String(http.StatusOK, assetUrlPath)
}

func (plugin *AssetPlugin) HandleGinAssetList(c *gin.Context) {
	foundAssetPaths := make([]string, 0)

	err := filepath.Walk(plugin.assetRootPath, func(currentPath string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() {
			relativePath, err := filepath.Rel(plugin.assetRootPath, currentPath)
			if err == nil {
				foundAssetPaths = append(foundAssetPaths, relativePath)
			}
		}
		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error listing asset files"})
		return
	}

	c.JSON(http.StatusOK, foundAssetPaths)
}

func (plugin *AssetPlugin) GetAssetRootPath() string {
	return plugin.assetRootPath
}
