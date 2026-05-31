package musicassistant

import (
	"context"
	"fmt"
	"vinyl-orchestrator/application/database"
	"vinyl-orchestrator/typedefs"
)

func (plugin *MusicAssistantPlugin) GetAvailablePlayers() ([]typedefs.AvailableMediaPlayers_t, error) {
	return plugin.mediaPlayer.GetAvailablePlayers()
}

func (plugin *MusicAssistantPlugin) PlayMedia(mediaResourceIdentifier string) error {
	return plugin.mediaPlayer.PlayMedia(mediaResourceIdentifier)
}

func (plugin *MusicAssistantPlugin) StopMedia() error {
	return plugin.mediaPlayer.StopMedia()
}

func (plugin *MusicAssistantPlugin) GetAllAlbumsInLibrary() (interface{}, error) {
	return plugin.getAllAlbumsFromMusicAssistantLibrary()
}

func (plugin *MusicAssistantPlugin) GetAlbumTracklist(itemId string, provider string) ([]typedefs.AlbumTrackList_t, error) {
	return plugin.getAlbumTrackList(itemId, provider)
}

func (plugin *MusicAssistantPlugin) ValidateSystemCredentials() error {
	if plugin.connectionManager == nil {
		return fmt.Errorf("internal error: websocket manager is offline")
	}

	activeConnection, isConnectionAuthenticated := plugin.connectionManager.RetrieveActiveConnectionState()

	if activeConnection == nil {
		return fmt.Errorf("not connected to Music Assistant — check the URL and ensure the server is reachable")
	}

	if !isConnectionAuthenticated {
		return fmt.Errorf("connected but not yet authenticated — the token may be incorrect")
	}

	return nil
}

func (plugin *MusicAssistantPlugin) Init(ctx context.Context, dataSource database.DataSource) {
	plugin.systemDataSource = dataSource

	plugin.messageRouter = &RpcMessageRouter_t{}
	plugin.connectionManager = &WebSocketManager_t{}
	plugin.mediaPlayer = &SystemMediaPlayer_t{}

	plugin.messageRouter.Init(dataSource, plugin.connectionManager)
	plugin.connectionManager.Init(ctx, dataSource, plugin.messageRouter)
	plugin.mediaPlayer.Init(dataSource, plugin.messageRouter)

	go func() {
		<-ctx.Done()
		plugin.connectionManager.CloseActiveConnection()
	}()
}

type MusicAssistantPlayer_t interface {
	GetAvailablePlayers() ([]typedefs.AvailableMediaPlayers_t, error)
	PlayMedia(mediaResourceIdentifier string) error
	StopMedia() error
}

type MusicAssistantPlugin struct {
	systemDataSource  database.DataSource
	connectionManager *WebSocketManager_t
	messageRouter     *RpcMessageRouter_t
	mediaPlayer       *SystemMediaPlayer_t
}
