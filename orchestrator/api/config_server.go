package api

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/http/httputil" // NEW
	"net/url"           // NEW
	"strings"           // NEW
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

	http.HandleFunc("/api/ha-proxy/", func(w http.ResponseWriter, r *http.Request) {
		// 1. Handle CORS Preflight for the Flutter Web App
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		// 2. Fetch the user's dynamic Home Assistant URL from the database
		config := getConfigFromDB()
		if config.HAUrl == "" {
			http.Error(w, "Home Assistant URL not configured in database", http.StatusBadRequest)
			return
		}

		target, err := url.Parse(config.HAUrl)
		if err != nil {
			http.Error(w, "Invalid Home Assistant URL", http.StatusInternalServerError)
			return
		}

		proxy := &httputil.ReverseProxy{
			Rewrite: func(pr *httputil.ProxyRequest) {
				// Automatically handles the base routing, schema, and X-Forwarded headers
				pr.SetXForwarded()
				pr.SetURL(target)

				// CRITICAL FIX: Strip the proxy prefix from BOTH path variables
				pr.Out.URL.Path = strings.TrimPrefix(pr.Out.URL.Path, "/api/ha-proxy")
				if pr.Out.URL.RawPath != "" {
					pr.Out.URL.RawPath = strings.TrimPrefix(pr.Out.URL.RawPath, "/api/ha-proxy")
				}

				// Overwrite the Host header so Cloudflare routes the domain correctly
				pr.Out.Host = target.Host
			},
		}

		// 5. Serve the proxy (This automatically supports WebSockets for live HA data too!)
		proxy.ServeHTTP(w, r)
	})

	fmt.Println("Config API listening on http://0.0.0.0:8100")
	go func() {
		if err := http.ListenAndServe(":8100", nil); err != nil {
			log.Printf("Config server error: %v", err)
		}
	}()

	http.HandleFunc("/api/config/ui", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		if r.Method == "GET" {
			rows, err := globals.Database.Query("SELECT key, value FROM app_settings WHERE key LIKE 'mapping_%'")
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			defer rows.Close()

			data := make(map[string]string)
			for rows.Next() {
				var k, v string
				rows.Scan(&k, &v)
				data[k] = v
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(data)
			return
		}

		if r.Method == "POST" {
			var req map[string]string
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				http.Error(w, "Invalid request body", http.StatusBadRequest)
				return
			}

			tx, err := globals.Database.Begin()
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			stmt, err := tx.Prepare(`INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value;`)
			if err == nil {
				for k, v := range req {
					_, err := stmt.Exec(k, v)
					if err != nil {
						log.Printf("Failed to save setting %s: %v", k, err)
					}
				}
				stmt.Close()
			}

			tx.Commit()

			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"status":"success"}`))
			return
		}
	})
}
