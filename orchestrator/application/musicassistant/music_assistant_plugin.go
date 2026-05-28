package musicassistant

import (
	"context"
	"vinyl-orchestrator/application/database"
)

func (plugin *MusicAssistantPlugin) GetAvailablePlayers() (interface{}, error) {
	return plugin.mediaPlayer.GetAvailablePlayers()
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

func (plugin *MusicAssistantPlugin) Init(ctx context.Context, dataSource database.DataSource) {
	plugin.systemDataSource = dataSource

	plugin.messageRouter = &RpcMessageRouter{}
	plugin.connectionManager = &WebSocketManager{}
	plugin.mediaPlayer = &SystemMediaPlayer{}

	plugin.messageRouter.Init(dataSource, plugin.connectionManager)
	plugin.connectionManager.Init(ctx, dataSource, plugin.messageRouter)
	plugin.mediaPlayer.Init(dataSource, plugin.messageRouter)

	go func() {
		<-ctx.Done()
		plugin.connectionManager.CloseActiveConnection()
	}()
}

type MusicAssistantPlugin struct {
	systemDataSource  database.DataSource
	connectionManager *WebSocketManager
	messageRouter     *RpcMessageRouter
	mediaPlayer       *SystemMediaPlayer
}
