/*
 * Handles media player operations by polling Music Assistant on play/stop.
 */

package musicassistant

import (
	"vinyl-orchestrator/application/database"
	"vinyl-orchestrator/core"
	"vinyl-orchestrator/typedefs"
	"vinyl-orchestrator/utils"
)

func (instance *SystemMediaPlayer_t) retrieveTargetPlayerIdentifier() string {
	var targetPlayerIdentifier string
	utils.Read(instance._private.systemDataSource, core.Global_MusicAssistantTargetPlayerId, &targetPlayerIdentifier)

	return targetPlayerIdentifier
}

func (instance *SystemMediaPlayer_t) PlayMedia(mediaUri string) error {
	targetPlayerIdentifier := instance.retrieveTargetPlayerIdentifier()

	commandArguments := map[string]interface{}{
		"queue_id": targetPlayerIdentifier,
		"media":    []string{mediaUri},
	}

	playMediaError := instance._private.messageRouter.SendFireAndForgetCommand("player_queues/play_media", commandArguments)
	if playMediaError != nil {
		return playMediaError
	}

	instance.syncStatusSnapshotForTargetPlayer(targetPlayerIdentifier)
	instance.startStatusPolling(targetPlayerIdentifier)

	return nil
}

func (instance *SystemMediaPlayer_t) StopMedia() error {
	targetPlayerIdentifier := instance.retrieveTargetPlayerIdentifier()

	commandArguments := map[string]interface{}{
		"queue_id": targetPlayerIdentifier,
	}

	stopMediaError := instance._private.messageRouter.SendFireAndForgetCommand("player_queues/stop", commandArguments)
	utils.StopTimer(&instance._private.statusPollTimer)

	return stopMediaError
}

func (instance *SystemMediaPlayer_t) applyStatusSnapshotToDataSource(statusSnapshot MediaPlayerStatus_t) {
	utils.Write(instance._private.systemDataSource, core.Global_MediaPlaybackState, statusSnapshot.State)
	utils.Write(instance._private.systemDataSource, core.Global_ActiveTrackProgressInSeconds, statusSnapshot.ElapsedTime)
	utils.Write(instance._private.systemDataSource, core.Global_ActiveTrackTotalDurationInSeconds, statusSnapshot.TotalDuration)
	utils.Write(instance._private.systemDataSource, core.Global_ActiveTrack, statusSnapshot.ActiveTrack)
}

func (instance *SystemMediaPlayer_t) syncStatusSnapshotForTargetPlayer(targetPlayerIdentifier string) {

	statusSnapshot, _ := instance.getMediaPlayerStatus(targetPlayerIdentifier)
	instance.applyStatusSnapshotToDataSource(statusSnapshot)
}

func (instance *SystemMediaPlayer_t) startStatusPolling(targetPlayerIdentifier string) {
	utils.StopTimer(&instance._private.statusPollTimer)
	utils.StartPeriodicTimer(&instance._private.statusPollTimer, 250, func() {
		instance.syncStatusSnapshotForTargetPlayer(targetPlayerIdentifier)
	})
}

func (instance *SystemMediaPlayer_t) GetAvailablePlayers() ([]typedefs.AvailableMediaPlayers_t, error) {
	return instance.getAvailablePlayers()
}

func (instance *SystemMediaPlayer_t) onDataSourceChanged(dataSourceChanged <-chan database.Event) {
	go utils.ListenToDataSourceEvents(dataSourceChanged, func(args core.OnDataSourceChangedArgs_t) {

		switch args.Variable {
		case core.Global_DefinedProjectorErrorMessage.Key:
			errorMessage, _ := args.Data.(string)
			if errorMessage != "" {
				utils.StopTimer(&instance._private.statusPollTimer)
			}

		}
	})
}



type SystemMediaPlayer_t struct {
	_private struct {
		systemDataSource database.DataSource
		messageRouter    *RpcMessageRouter_t
		statusPollTimer  utils.Timer_t
	}
}

func (instance *SystemMediaPlayer_t) Init(dataSource database.DataSource, routerInstance *RpcMessageRouter_t) {
	instance._private.systemDataSource = dataSource
	instance._private.messageRouter = routerInstance

	dsChannel := instance._private.systemDataSource.Subscribe("datasource")
	go instance.onDataSourceChanged(dsChannel)
}
