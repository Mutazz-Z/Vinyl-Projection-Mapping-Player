package player

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"

	"vinyl-orchestrator/globals"
)

var (
	haURL    string
	haToken  string
	haPlayer string
	// Custom client to aggressively bypass local TLS certificate blocks
	haClient = &http.Client{
		Timeout: 5 * time.Second,
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
		},
	}

	lastPlayerState string
	lastTrackName   string
)

// loadCredentials securely extracts the settings from the SQLite database
func loadCredentials() bool {
	if haURL != "" && haPlayer != "" && haToken != "" {
		return true
	}

	globals.Database.QueryRow("SELECT value FROM app_settings WHERE key='home_assistant_url'").Scan(&haURL)
	globals.Database.QueryRow("SELECT value FROM app_settings WHERE key='home_assistant_token'").Scan(&haToken)
	globals.Database.QueryRow("SELECT value FROM app_settings WHERE key='home_assistant_player'").Scan(&haPlayer)

	// Sanitize the URL in case it has trailing slashes or /api paths
	if haURL != "" {
		haURL = strings.TrimSuffix(strings.TrimSpace(haURL), "/")
		haURL = strings.TrimSuffix(haURL, "/api")
	}

	return haURL != "" && haPlayer != "" && haToken != ""
}

// InitHAClient safely waits until credentials exist before booting the engine
func InitHAClient() {
	go func() {
		for {
			if loadCredentials() {
				fmt.Printf("▶ HA Native Client Online! Watching: %s\n", haPlayer)
				monitorLoop()
				return
			}
			time.Sleep(2 * time.Second)
		}
	}()
}

// getCandidateURIs generates fallback URIs by stripping instance IDs (e.g., spotify--abc:// -> spotify://)
func getCandidateURIs(uri string) []string {
	candidates := []string{strings.TrimSpace(uri)}
	re := regexp.MustCompile(`^([a-z0-9_]+)--[^:]+://`)

	if match := re.FindStringSubmatch(uri); len(match) > 1 {
		provider := match[1]
		stripped := re.ReplaceAllString(uri, provider+"://")
		candidates = append(candidates, stripped)
	}
	return candidates
}

func PlayMedia(uri string) {
	if !loadCredentials() {
		fmt.Println("❌ HA Client Error: Credentials missing, cannot play.")
		return
	}

	candidates := getCandidateURIs(uri)
	fmt.Printf("HA Client: Attempting playback. Candidates: %v\n", candidates)

	for _, candidate := range candidates {
		payload := map[string]interface{}{
			"entity_id":          haPlayer,
			"media_content_id":   candidate,
			"media_content_type": "music",
			"enqueue":            "replace",
		}

		// 1. Try standard media_player domain
		err := callService("media_player", "play_media", payload)
		if err == nil {
			fmt.Println("✅ HA Client: media_player.play_media command accepted!")
			return
		}
		fmt.Printf("⚠️ HA Client: media_player failed: %v\n", err)

		// 2. Try Music Assistant specific mass domain fallback
		err = callService("mass", "play_media", payload)
		if err == nil {
			fmt.Println("✅ HA Client: mass.play_media command accepted!")
			return
		}
		fmt.Printf("⚠️ HA Client: mass failed: %v\n", err)
	}

	fmt.Println("❌ HA Client: ALL playback attempts rejected by Home Assistant.")
}

func StopMedia() {
	if !loadCredentials() {
		return
	}
	callService("media_player", "media_stop", map[string]interface{}{"entity_id": haPlayer})
}

func callService(domain, service string, payload map[string]interface{}) error {
	body, _ := json.Marshal(payload)
	url := fmt.Sprintf("%s/api/services/%s/%s", haURL, domain, service)

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
	if err != nil {
		return err
	}

	req.Header.Set("Authorization", "Bearer "+haToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := haClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	// THIS IS THE FIX: Explicitly fail if Home Assistant returns a 400/500 error!
	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		return nil
	}

	respBody, _ := io.ReadAll(resp.Body)
	return fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(respBody))
}

func monitorLoop() {
	ticker := time.NewTicker(1 * time.Second)
	tickCount := 0

	for range ticker.C {
		tickCount++

		// Force Home Assistant to wake up the entity cache every 4 seconds
		if tickCount%4 == 0 {
			callService("homeassistant", "update_entity", map[string]interface{}{"entity_id": haPlayer})
		}

		url := fmt.Sprintf("%s/api/states/%s", haURL, haPlayer)
		req, err := http.NewRequest("GET", url, nil)
		if err != nil {
			continue
		}
		req.Header.Set("Authorization", "Bearer "+haToken)

		resp, err := haClient.Do(req)
		if err != nil {
			continue
		}

		var stateData map[string]interface{}
		if err := json.NewDecoder(resp.Body).Decode(&stateData); err == nil {
			processState(stateData)
		}
		resp.Body.Close()
	}
}

func processState(stateData map[string]interface{}) {
	state, _ := stateData["state"].(string)
	attributes, ok := stateData["attributes"].(map[string]interface{})
	if !ok {
		return
	}

	getFloat := func(key string) float64 {
		if val, exists := attributes[key]; exists {
			if f, ok := val.(float64); ok {
				return f
			}
		}
		return 0
	}

	mediaDuration := int(getFloat("media_duration"))
	basePosition := getFloat("media_position")

	trackName, _ := attributes["media_title"].(string)
	if trackName == "" {
		trackName = "Unknown"
	}

	position := int(basePosition)
	if state == "playing" {
		if updatedAtStr, ok := attributes["media_position_updated_at"].(string); ok {
			if updatedAt, err := time.Parse(time.RFC3339, updatedAtStr); err == nil {
				elapsed := int(time.Since(updatedAt).Seconds())
				if elapsed > 0 {
					position += elapsed
				}
			}
		}
	}
	if mediaDuration > 0 && position > mediaDuration {
		position = mediaDuration
	}

	event := "progress"
	if state != lastPlayerState {
		if state == "playing" {
			event = "play"
			fmt.Printf("🎵 HA Client: State changed to PLAYING! (%s)\n", trackName)
		} else if state == "paused" {
			event = "pause"
		} else if state == "idle" {
			event = "stop"
		}
		lastPlayerState = state
	} else if trackName != lastTrackName && lastTrackName != "" {
		event = "track_changed"
	}
	lastTrackName = trackName

	if event == "progress" && state != "playing" {
		return
	}

	payload := map[string]interface{}{
		"event":      event,
		"track_name": trackName,
		"position":   position,
		"duration":   mediaDuration,
		"state":      state,
		"timestamp":  time.Now().Format(time.RFC3339),
	}

	payloadBytes, _ := json.Marshal(payload)
	globals.MQTTClient.Publish("vinyl/shelf/playback/state", 0, false, payloadBytes)
}
