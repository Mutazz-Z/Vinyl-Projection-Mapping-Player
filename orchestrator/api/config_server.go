package api

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"vinyl-orchestrator/globals"
	orchestratormqtt "vinyl-orchestrator/mqtt"
)

type AppConfig struct {
	HAUrl       string `json:"home_assistant_url"`
	HAToken     string `json:"home_assistant_token"`
	HAPlayer    string `json:"home_assistant_player"`
	HAApiPath   string `json:"home_assistant_api_path"`
	MQTTHost    string `json:"mqtt_host"`
	MQTTWSPort  string `json:"mqtt_ws_port"`
	MQTTTCPPort string `json:"mqtt_tcp_port"`
}

func initConfigTable() {
	query := `CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT);`
	if _, err := globals.Database.Exec(query); err != nil {
		log.Printf("Warning: Failed to ensure app_settings table exists: %v", err)
	}
}

func getConfigFromDB() AppConfig {
	rows, err := globals.Database.Query("SELECT key, value FROM app_settings")
	var config AppConfig
	if err != nil {
		return config
	}
	defer rows.Close()

	for rows.Next() {
		var key, value string
		rows.Scan(&key, &value)
		switch key {
		case "ha_url":
			config.HAUrl = value
		case "ha_token":
			config.HAToken = value
		case "ha_player":
			config.HAPlayer = value
		case "ha_api_path":
			config.HAApiPath = value
		case "mqtt_host":
			config.MQTTHost = value
		case "mqtt_ws_port":
			config.MQTTWSPort = value
		case "mqtt_tcp_port":
			config.MQTTTCPPort = value
		}
	}
	return config
}

func saveSettingToDB(key string, value string) {
	_, err := globals.Database.Exec(`
		INSERT INTO app_settings (key, value) VALUES (?, ?) 
		ON CONFLICT(key) DO UPDATE SET value=excluded.value;`, key, value)
	if err != nil {
		log.Printf("Failed to save setting %s: %v", key, err)
	}
}

func StartConfigServer() {
	initConfigTable()

	http.HandleFunc("/api/config", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		if r.Method == "GET" {
			config := getConfigFromDB()
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(config)
			return
		}

		if r.Method == "POST" {
			var req AppConfig
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				http.Error(w, "Invalid request body", http.StatusBadRequest)
				return
			}

			saveSettingToDB("ha_url", req.HAUrl)
			saveSettingToDB("ha_token", req.HAToken)
			saveSettingToDB("ha_player", req.HAPlayer)
			saveSettingToDB("ha_api_path", req.HAApiPath)
			saveSettingToDB("mqtt_host", req.MQTTHost)
			saveSettingToDB("mqtt_ws_port", req.MQTTWSPort)
			saveSettingToDB("mqtt_tcp_port", req.MQTTTCPPort)

			if req.MQTTHost != "" && req.MQTTTCPPort != "" {
				err := orchestratormqtt.ReconnectMQTT(req.MQTTHost, req.MQTTTCPPort)
				if err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}
			}

			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"status":"success"}`))
			return
		}
	})

	fmt.Println("Config API listening on http://0.0.0.0:8100")
	go func() {
		if err := http.ListenAndServe(":8100", nil); err != nil {
			log.Printf("Config server error: %v", err)
		}
	}()
}
