package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/url"
	"os"
	"os/exec"
	"time"
)

func HandleReplacedTag() {
	fmt.Println("Same record replaced, resuming without restart.")
	StopTimer.Stop()
	StopTimer = nil
}

func HandleNewTag(recordUID string) {
	fmt.Printf("New record detected: %s\n", recordUID)
	MQTTClient.Publish("vinyl/request_register", 0, false, recordUID)

	unknownVisual := map[string]string{
		"effect":           "unknown",
		"uid":              recordUID,
		"registration_url": fmt.Sprintf("http://192.168.50.214:8000/?uid=%s", url.QueryEscape(recordUID)),
	}
	unknownVisualPayload, _ := json.Marshal(unknownVisual)
	MQTTClient.Publish("vinyl/shelf/visuals", 0, false, unknownVisualPayload)
}

func SendDataToProjector(artistName, albumTitle, mediaURI, trackList string) {
	visualData := map[string]string{
		"artist":    artistName,
		"album":     albumTitle,
		"tracks":    trackList,
		"effect":    "play",
		"media_uri": mediaURI,
	}
	visualPayload, _ := json.Marshal(visualData)
	MQTTClient.Publish("vinyl/shelf/visuals", 0, false, visualPayload)
}

func KillOldPlayback() {
	exec.Command("pkill", "-9", "mpv").Run()
	os.Remove("/tmp/mpvsocket")
	CurrentPlayingUID = ""
}

func StartMpvPlayback(mediaURI string) {
	mpvCommand := exec.Command("mpv", "--no-video", "--input-ipc-server=/tmp/mpvsocket", mediaURI)
	startPlaybackError := mpvCommand.Start()
	if startPlaybackError != nil {
		log.Printf("Failed to start playback: %v", startPlaybackError)
		return
	}
}

func HandleKnownTag(recordUID, artistName, albumTitle, mediaURI, trackList string) {
	CurrentPlayingUID = recordUID
	fmt.Printf("NOW PLAYING: %s - %s\n", artistName, albumTitle)

	SendDataToProjector(artistName, albumTitle, mediaURI, trackList)
	KillOldPlayback()
	StartMpvPlayback(mediaURI)

	go TrackPlaybackProgress()
}

func GetMPVProperty(connection net.Conn, propertyName string) (float64, error) {
	commandPayload := map[string]interface{}{
		"command": []interface{}{"get_property", propertyName},
	}
	jsonPayload, _ := json.Marshal(commandPayload)

	_, writeError := connection.Write(append(jsonPayload, '\n'))
	if writeError != nil {
		return 0, writeError
	}

	scanner := bufio.NewScanner(connection)
	if scanner.Scan() {
		var response struct {
			Data  float64 `json:"data"`
			Error string  `json:"error"`
		}
		if unmarshalError := json.Unmarshal(scanner.Bytes(), &response); unmarshalError != nil {
			return 0, unmarshalError
		}
		if response.Error != "success" {
			return 0, fmt.Errorf("mpv error: %s", response.Error)
		}
		return response.Data, nil
	}
	return 0, fmt.Errorf("no response from mpv")
}

func TrackPlaybackProgress() {
	socketPath := "/tmp/mpvsocket"
	var socketConnection net.Conn
	var socketConnectionError error

	for attemptIndex := 0; attemptIndex < 10; attemptIndex++ {
		socketConnection, socketConnectionError = net.Dial("unix", socketPath)
		if socketConnectionError == nil {
			break
		}
		time.Sleep(1 * time.Second)
	}

	if socketConnectionError != nil {
		log.Printf("Progress Tracker: Could not connect to mpv socket after retries: %v", socketConnectionError)
		return
	}
	defer socketConnection.Close()

	fmt.Println("Progress Tracker: Connected to mpv. Broadcasting progress...")

	ticker := time.NewTicker(500 * time.Millisecond)
	defer ticker.Stop()

	for range ticker.C {
		trackPositionSeconds, trackPositionError := GetMPVProperty(socketConnection, "time-pos")
		trackDurationSeconds, trackDurationError := GetMPVProperty(socketConnection, "duration")
		playlistTrackIndex, playlistIndexError := GetMPVProperty(socketConnection, "playlist-pos")

		if trackPositionError != nil || trackDurationError != nil || playlistIndexError != nil {
			continue
		}

		progressData := map[string]interface{}{
			"position":  trackPositionSeconds,
			"duration":  trackDurationSeconds,
			"remaining": trackDurationSeconds - trackPositionSeconds,
			"percent":   (trackPositionSeconds / trackDurationSeconds) * 100,
			"track_idx": int(playlistTrackIndex),
		}

		payload, _ := json.Marshal(progressData)
		MQTTClient.Publish("vinyl/shelf/visuals/progress", 0, false, payload)
	}
}
