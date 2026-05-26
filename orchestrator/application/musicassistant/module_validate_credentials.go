package musicassistant

import "fmt"

func (plugin *MusicAssistantPlugin) validateCredentials() error {
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
