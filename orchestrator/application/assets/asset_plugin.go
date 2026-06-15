package assets

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"net/http"
	"os"
	"path/filepath"
)

func (plugin *AssetPlugin) resolveAssetRoot() string {
	configuredPath := os.Getenv("VINYL_ASSET_STORAGE_PATH")
	if configuredPath != "" {
		return configuredPath
	}
	return "./builds/assets"
}

func (plugin *AssetPlugin) initializeFileSystem() error {
	requiredAssetCategories := []string{"overlays", "labels", "outer-rings"}

	if err := os.MkdirAll(plugin.AssetRootPath, 0755); err != nil {
		return err
	}

	for _, category := range requiredAssetCategories {
		if err := os.MkdirAll(filepath.Join(plugin.AssetRootPath, category), 0755); err != nil {
			return err
		}
	}
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

	targetFilePath := filepath.Join(plugin.AssetRootPath, category, file.Filename)

	if err := c.SaveUploadedFile(file, targetFilePath); err != nil {
		c.String(http.StatusInternalServerError, "Error saving asset to disk")
		return
	}

	assetUrlPath := fmt.Sprintf("/assets/%s/%s", category, file.Filename)
	c.String(http.StatusOK, assetUrlPath)
}

func (plugin *AssetPlugin) HandleGinAssetList(c *gin.Context) {
	foundAssetPaths := make([]string, 0)

	err := filepath.Walk(plugin.AssetRootPath, func(currentPath string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() {
			relativePath, err := filepath.Rel(plugin.AssetRootPath, currentPath)
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

type AssetPlugin struct {
	AssetRootPath    string
}

func (plugin *AssetPlugin) Init() *AssetPlugin {
	plugin.AssetRootPath = plugin.resolveAssetRoot()
	plugin.initializeFileSystem()

	return plugin
}
