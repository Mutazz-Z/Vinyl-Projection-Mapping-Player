package webapi

import (
	"context"
	"net/http"
	"path/filepath"
	"time"

	"vinyl-orchestrator/application/assets"
	"vinyl-orchestrator/application/database"
	"vinyl-orchestrator/application/musicassistant"
	typedefinitions "vinyl-orchestrator/type_definitions"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type WebServerPlugin struct {
	dataSource           database.DataSource
	AlbumLibrary         database.AlbumLibrary
	musicAssistantPlugin *musicassistant.MusicAssistantPlugin
	assetPlugin          *assets.AssetPlugin
	server               *http.Server
}

func NewWebServerPlugin(musicAssistantPlugin *musicassistant.MusicAssistantPlugin, assetPlugin *assets.AssetPlugin) *WebServerPlugin {
	return &WebServerPlugin{
		musicAssistantPlugin: musicAssistantPlugin,
		assetPlugin:          assetPlugin,
	}
}

func (plugin *WebServerPlugin) Name() string {
	return "Web_API_Server"
}

func (plugin *WebServerPlugin) StopPlugin(applicationContext context.Context) error {
	shutdownContext, cancel := context.WithTimeout(applicationContext, 5*time.Second)
	defer cancel()
	return plugin.server.Shutdown(shutdownContext)
}

func (plugin *WebServerPlugin) Init(dataSource database.DataSource, AlbumLibrary database.AlbumLibrary) error {
	plugin.dataSource = dataSource
	plugin.AlbumLibrary = AlbumLibrary
	return nil
}

func (plugin *WebServerPlugin) StartPlugin(applicationContext context.Context) error {
	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	api := router.Group("/api")
	{
		library := api.Group("/library")
		{
			library.GET("/", plugin.getAllAlbumsInLibrary)
			library.GET("/:provider/:itemId", plugin.GetAlbumTrackList)
			library.GET("/savedTags", plugin.getSavedTags)
			library.POST("/saveAlbum", plugin.saveNewAlbumRecord)
			library.DELETE("/deleteAlbum/:id", plugin.deleteAlbumRecordGivenId)
		}

		system := api.Group("/system")
		{
			system.GET("/network", plugin.handleNetworkInfo)
			system.GET("/test", plugin.handleConnectionTestRequest)
			system.GET("/verify_reader", plugin.handleVerifyReaderRequest)
		}

		players := api.Group("/players")
		{
			players.GET("/", plugin.getAvailablePlayers)
		}

		assetsApi := api.Group("/assets")
		{
			assetsApi.POST("/upload", plugin.assetPlugin.HandleGinAssetUpload)
			assetsApi.GET("/list", plugin.assetPlugin.HandleGinAssetList)
		}
	}

	absPath, _ := filepath.Abs(plugin.assetPlugin.GetAssetRootPath())
	assetsDir := router.Group("/assets")

	assetsDir.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Cross-Origin-Resource-Policy", "cross-origin")
		c.Next()
	})

	assetsDir.StaticFS("/", http.Dir(absPath))
	router.GET("/ws", plugin.handleWebSockets)

	plugin.server = &http.Server{
		Addr:    ":8080",
		Handler: router,
	}

	go func() {
		if err := plugin.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		}
	}()

	return nil
}

func (plugin *WebServerPlugin) getSavedTags(c *gin.Context) {
	albums, err := plugin.AlbumLibrary.RetrieveAllSavedAlbums()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, albums)
}

func (plugin *WebServerPlugin) handleVerifyReaderRequest(c *gin.Context) {
	if c.Request.Method != http.MethodGet {
		c.JSON(http.StatusMethodNotAllowed, gin.H{"error": "Method Not Allowed"})
		return
	}

	plugin.dataSource.Publish("CMD_PingReader", "ping")

	timeout := time.After(5 * time.Second)
	ticker := time.NewTicker(200 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-timeout:
			c.JSON(http.StatusGatewayTimeout, gin.H{"error": "Timeout waiting for reader response"})
			return
		case <-ticker.C:
			var status string
			plugin.dataSource.Read("GLOBAL_ReaderConnectionStatus", &status)
			if status == "online" {
				c.JSON(http.StatusOK, gin.H{"message": "Reader is online"})
				return
			}
		}
	}
}

func (plugin *WebServerPlugin) GetAlbumTrackList(c *gin.Context) {
	itemId := c.Param("itemId")
	if itemId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "item ID is required"})
		return
	}
	provider := c.Param("provider")
	if provider == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "provider is required"})
		return
	}

	tracks, err := plugin.musicAssistantPlugin.GetAlbumTracklist(itemId, provider)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tracks)
}

func (plugin *WebServerPlugin) deleteAlbumRecordGivenId(c *gin.Context) {
	albumID := c.Param("id")
	if albumID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Album ID is required"})
		return
	}

	err := plugin.AlbumLibrary.DeleteAlbumRecord(albumID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Album record deleted successfully"})
}

func (plugin *WebServerPlugin) saveNewAlbumRecord(c *gin.Context) {
	var albumRecord typedefinitions.VinylRecordTagData
	if err := c.ShouldBindJSON(&albumRecord); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := plugin.AlbumLibrary.SaveAlbumRecord(albumRecord)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Album record saved successfully"})
}

func (plugin *WebServerPlugin) getAvailablePlayers(c *gin.Context) {
	players, err := plugin.musicAssistantPlugin.GetAvailablePlayers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, players)
}

func (plugin *WebServerPlugin) getAllAlbumsInLibrary(c *gin.Context) {
	albums, err := plugin.musicAssistantPlugin.GetAllAlbumsInLibrary()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, albums)
}

func (plugin *WebServerPlugin) handleConnectionTestRequest(c *gin.Context) {
	err := plugin.musicAssistantPlugin.ValidateSystemCredentials()

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Authentication Successful",
	})
}

func (plugin *WebServerPlugin) handleNetworkInfo(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"host_ip": "127.0.0.1"})
}
