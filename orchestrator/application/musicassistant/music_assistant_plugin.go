package musicassistant

import (
	"context"
	"vinyl-orchestrator/core"
)

type MusicAssistantPlugin struct {
	systemDataSource  core.DataSource
	connectionManager *WebSocketManager
	messageRouter     *RpcMessageRouter
	mediaPlayer       *SystemMediaPlayer
	metadataResolver  *SystemMetadataResolver
}

func NewMusicAssistantPlugin() *MusicAssistantPlugin {
	messageRouterInstance := NewRpcMessageRouter()
	connectionManagerInstance := NewWebSocketManager(messageRouterInstance)
	messageRouterInstance.BindConnectionManager(connectionManagerInstance)

	return &MusicAssistantPlugin{
		connectionManager: connectionManagerInstance,
		messageRouter:     messageRouterInstance,
		mediaPlayer:       NewSystemMediaPlayer(messageRouterInstance),
		metadataResolver:  NewSystemMetadataResolver(messageRouterInstance, connectionManagerInstance),
	}
}

func (plugin *MusicAssistantPlugin) Name() string {
	return "Music_Assistant_Core_Client"
}

func (plugin *MusicAssistantPlugin) Init(dataSource core.DataSource, libraryRepository core.LibraryRepository) error {
	plugin.systemDataSource = dataSource
	plugin.connectionManager.SetDataSource(dataSource)
	plugin.messageRouter.SetDataSource(dataSource)
	plugin.mediaPlayer.SetDataSource(dataSource)
	return nil
}

func (plugin *MusicAssistantPlugin) StartPlugin(applicationContext context.Context) error {
	go plugin.connectionManager.MaintainWebSocketConnection(applicationContext)
	return nil
}

func (plugin *MusicAssistantPlugin) StopPlugin(applicationContext context.Context) error {
	plugin.connectionManager.CloseActiveConnection()
	return nil
}

func (plugin *MusicAssistantPlugin) PlayMedia(mediaResourceIdentifier string) error {
	return plugin.mediaPlayer.PlayMedia(mediaResourceIdentifier)
}

func (plugin *MusicAssistantPlugin) StopMedia() error {
	return plugin.mediaPlayer.StopMedia()
}

func (plugin *MusicAssistantPlugin) GetState() (string, error) {
	return plugin.mediaPlayer.GetState()
}

func (plugin *MusicAssistantPlugin) FetchCleanMetadata(mediaResourceIdentifier string) (*core.VinylAlbumRecord, error) {
	return plugin.metadataResolver.FetchCleanMetadata(mediaResourceIdentifier)
}

func (plugin *MusicAssistantPlugin) ValidateSystemCredentials() error {
	return plugin.metadataResolver.ValidateSystemCredentials()
}
