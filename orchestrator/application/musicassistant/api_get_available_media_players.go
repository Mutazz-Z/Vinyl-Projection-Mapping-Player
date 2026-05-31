/*
 * Grabs the list of available media players and their display names to populate the media player selection dropdown in the UI
 */

package musicassistant

import (
	"fmt"
	"vinyl-orchestrator/typedefs"

	"github.com/mitchellh/mapstructure"
)

func (instance *SystemMediaPlayer_t) getAvailablePlayers() ([]typedefs.AvailableMediaPlayers_t, error) {
	responseData, executionError := instance._private.messageRouter.ExecuteRemoteProcedureCall("players/all", nil)
	if executionError != nil {
		return nil, executionError
	}

	rawResult, ok := responseData["result"]
	if !ok {
		return nil, fmt.Errorf("response did not contain a 'result' field")
	}

	var availablePlayers []typedefs.AvailableMediaPlayers_t
	err := mapstructure.Decode(rawResult, &availablePlayers)
	if err != nil {
		return nil, fmt.Errorf("failed to decode players: %w", err)
	}

	return availablePlayers, nil
}