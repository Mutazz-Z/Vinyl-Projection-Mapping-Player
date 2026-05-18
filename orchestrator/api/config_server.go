package api

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	orchestratormqtt "vinyl-orchestrator/mqtt"
)

type ConfigUpdateRequest struct {
	MQTTHost string `json:"mqtt_host"`
	MQTTPort string `json:"mqtt_port"`
}

func StartConfigServer() {
	http.HandleFunc("/api/config/mqtt", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		var req ConfigUpdateRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		err := orchestratormqtt.ReconnectMQTT(req.MQTTHost, req.MQTTPort)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"success"}`))
	})

	fmt.Println("Config API listening on http://0.0.0.0:8100")
	go func() {
		if err := http.ListenAndServe(":8100", nil); err != nil {
			log.Printf("Config server error: %v", err)
		}
	}()
}
