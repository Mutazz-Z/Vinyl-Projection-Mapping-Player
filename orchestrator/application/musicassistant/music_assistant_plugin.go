package musicassistant

import (
	"context"
	"vinyl-orchestrator/application/database"
)

type MusicAssistantPlugin struct {
	systemDataSource  database.DataSource
	connectionManager *WebSocketManager
	messageRouter     *RpcMessageRouter
	mediaPlayer       *SystemMediaPlayer
}

func NewMusicAssistantPlugin() *MusicAssistantPlugin {
	messageRouterInstance := NewRpcMessageRouter()
	connectionManagerInstance := NewWebSocketManager(messageRouterInstance)
	messageRouterInstance.BindConnectionManager(connectionManagerInstance)

	return &MusicAssistantPlugin{
		connectionManager: connectionManagerInstance,
		messageRouter:     messageRouterInstance,
		mediaPlayer:       NewSystemMediaPlayer(messageRouterInstance),
	}
}

func (plugin *MusicAssistantPlugin) Name() string {
	return "Music_Assistant_Core_Client"
}

func (plugin *MusicAssistantPlugin) GetAvailablePlayers() (interface{}, error) {
	return plugin.mediaPlayer.GetAvailablePlayers()
}

func (plugin *MusicAssistantPlugin) Init(dataSource database.DataSource, AlbumLibrary database.AlbumLibrary) error {
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

func (plugin *MusicAssistantPlugin) GetAllAlbumsInLibrary() (interface{}, error) {
	return plugin.getAllAlbumsFromMusicAssistantLibrary()
}

func (plugin *MusicAssistantPlugin) GetAlbumTracklist(itemId string, provider string) ([]AlbumTrackList, error) {
	return plugin.getAlbumTrackList(itemId, provider)
}

func (plugin *MusicAssistantPlugin) ValidateSystemCredentials() error {
	return plugin.validateCredentials()
}
