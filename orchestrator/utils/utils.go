/*
 * Global helper functions
 */

package utils

import (
	"vinyl-orchestrator/application/database"
)

/*
 * Continuously listens to a channel of DataSource change events
 */
func ListenToDataSourceEvents(dsChannel <-chan database.Event, handler func(args database.DataSourceChangedArgs)) {
	for incomingEvent := range dsChannel {
		args, ok := incomingEvent.Payload.(database.DataSourceChangedArgs)
		if !ok {
			continue
		}
		handler(args)
	}
}

/*
 * Generates a URI for a media item based on its ID and provider
 */
func GenerateUriForMedia(itemId string, provider string) string {
	return provider + "://album/" + itemId
}
