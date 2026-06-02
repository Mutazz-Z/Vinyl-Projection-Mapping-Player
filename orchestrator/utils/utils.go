/*
 * Global helper functions
 */

package utils

import (
	"fmt"
	"net"
	"vinyl-orchestrator/application/database"
	"vinyl-orchestrator/core"
)

/*
 * Continuously listens to a channel of DataSource change events
 */
func ListenToDataSourceEvents(dsChannel <-chan database.Event, handler func(args core.OnDataSourceChangedArgs_t)) {
	for incomingEvent := range dsChannel {
		args, ok := incomingEvent.Payload.(core.OnDataSourceChangedArgs_t)
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
	return fmt.Sprintf("%s://album/%s", provider, itemId)
}

/*
 * Determines the local IP address of the machine
 */
func GetLocalIP() string {
	conn, err := net.Dial("udp", "8.8.8.8:80")
	if err != nil {
		return "localhost"
	}
	defer conn.Close()
	localAddr := conn.LocalAddr().(*net.UDPAddr)
	return localAddr.IP.String()
}

/*
 * Writes a value to the data source using a typed key
 */
func Write[T any](dataSource database.DataSource, typedKey core.TypedKey[T], value T) error {
	return dataSource.Write(typedKey.Key, value)
}

/*
 * Reads a value from the data source using a typed key
 */
func Read[T any](dataSource database.DataSource, typedKey core.TypedKey[T], dest *T) error {
	return dataSource.Read(typedKey.Key, dest)
}
