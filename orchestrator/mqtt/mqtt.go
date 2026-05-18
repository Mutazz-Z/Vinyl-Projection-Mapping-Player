package mqtt

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
	"time"
	"vinyl-orchestrator/globals"
	"vinyl-orchestrator/models"
	"vinyl-orchestrator/player"
	"vinyl-orchestrator/utils"

	paho "github.com/eclipse/paho.mqtt.golang"
)

const (
	mqttConnectionTimeout    = 10 * time.Second
	playbackWatchdogDuration = 10 * time.Second
)

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

var playbackWatchdogTimer *time.Timer

type playbackEventPayload struct {
	Event      string `json:"event"`
	TrackIndex int    `json:"track_index"`
	TrackName  string `json:"track_name"`
	Position   int    `json:"position"`
	Duration   int    `json:"duration"`
}

func startPlaybackWatchdog() {
	if playbackWatchdogTimer != nil {
		playbackWatchdogTimer.Stop()
	}
	playbackWatchdogTimer = time.AfterFunc(playbackWatchdogDuration, func() {
		fmt.Println("Watchdog: Target device failed to respond in 10s")
		globals.CurrentPlayingUID = ""

		errorVisual := map[string]interface{}{
			"effect":  "error",
			"message": "Playback failed to start\n\nTarget device did not respond in time. Please check its connection and try again",
		}
		errorPayload, _ := json.Marshal(errorVisual)
		globals.MQTTClient.Publish("vinyl/shelf/visuals", 0, false, errorPayload)
	})
}

func normalizeUID(uid string) string {
	return strings.ToUpper(strings.TrimSpace(uid))
}

func tagHandler(_ paho.Client, message paho.Message) {
	var tagPayload models.TagPayload
	if unmarshalError := json.Unmarshal(message.Payload(), &tagPayload); unmarshalError != nil {
		return
	}

	tagPayload.UID = normalizeUID(tagPayload.UID)
	if tagPayload.UID == "" {
		log.Printf("Ignoring empty UID from tag payload: %q", string(message.Payload()))
		return
	}

	fmt.Printf("\nScanning Shelf: %s\n", tagPayload.UID)

	var album models.RegistrationPayload
	queryError := globals.Database.QueryRow(`
		SELECT artist, album, media_uri, tracks, inner_record_color, inner_record_image, 
		       outer_design_color, outer_design_image, overlay_art, album_cover_art 
		FROM albums WHERE uid = ?`, tagPayload.UID).
		Scan(
			&album.Artist, &album.Album, &album.MediaURI, &album.Tracks,
			&album.InnerRecordColor, &album.InnerRecordImage,
			&album.OuterDesignColor, &album.OuterDesignImage,
			&album.OverlayArt, &album.AlbumCoverArt,
		)

	if queryError == sql.ErrNoRows {
		if globals.RecordRemovedTimer != nil {
			globals.RecordRemovedTimer.Stop()
			globals.RecordRemovedTimer = nil
			fmt.Println("Removal timer cancelled.")
		}
		player.HandleNewTag(tagPayload.UID)
	} else if queryError != nil {
		log.Printf("Database error: %v", queryError)
	} else if tagPayload.UID == globals.CurrentPlayingUID && globals.RecordRemovedTimer != nil {
		player.HandleReplacedTag()
	} else {
		if globals.RecordRemovedTimer != nil {
			globals.RecordRemovedTimer.Stop()
			globals.RecordRemovedTimer = nil
			fmt.Println("Removal timer cancelled.")
		}
		player.HandleKnownTag(tagPayload.UID, album)
		startPlaybackWatchdog()
	}
}

func registrationHandler(_ paho.Client, message paho.Message) {
	var registrationPayload models.RegistrationPayload
	if unmarshalError := json.Unmarshal(message.Payload(), &registrationPayload); unmarshalError != nil {
		log.Printf("Failed to parse registration JSON: %v", unmarshalError)
		return
	}

	registrationPayload.UID = normalizeUID(registrationPayload.UID)
	if registrationPayload.UID == "" {
		log.Printf("Ignoring registration with empty UID")
		return
	}

	var existingUID string
	checkError := globals.Database.QueryRow("SELECT uid FROM albums WHERE uid = ? LIMIT 1", registrationPayload.UID).Scan(&existingUID)
	isNewRegistration := checkError == sql.ErrNoRows
	uidForWrite := registrationPayload.UID
	if checkError == nil {
		uidForWrite = existingUID
	}

	upsertQuery := `
		INSERT INTO albums (
			uid, artist, album, tracks, media_uri,
			inner_record_color, inner_record_image, outer_design_color, outer_design_image,
			overlay_art, album_cover_art, created_at
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(uid) DO UPDATE SET
			artist=excluded.artist,
			album=excluded.album,
			tracks=excluded.tracks,
			media_uri=excluded.media_uri,
			inner_record_color=excluded.inner_record_color,
			inner_record_image=excluded.inner_record_image,
			outer_design_color=excluded.outer_design_color,
			outer_design_image=excluded.outer_design_image,
			overlay_art=excluded.overlay_art,
			album_cover_art=excluded.album_cover_art;`

	_, databaseExecError := globals.Database.Exec(
		upsertQuery,
		uidForWrite,
		registrationPayload.Artist,
		registrationPayload.Album,
		registrationPayload.Tracks,
		registrationPayload.MediaURI,
		registrationPayload.InnerRecordColor,
		registrationPayload.InnerRecordImage,
		registrationPayload.OuterDesignColor,
		registrationPayload.OuterDesignImage,
		registrationPayload.OverlayArt,
		registrationPayload.AlbumCoverArt,
		time.Now(),
	)
	if databaseExecError != nil {
		log.Printf("Failed to save registration: %v", databaseExecError)
		return
	}

	fmt.Printf("Database updated: %s by %s\n", registrationPayload.Album, registrationPayload.Artist)

	if isNewRegistration {
		player.HandleKnownTag(uidForWrite, registrationPayload)
		startPlaybackWatchdog()
	}
}

func statusHandler(_ paho.Client, message paho.Message) {
	shelfStatus := string(message.Payload())
	if shelfStatus == "removed" {
		if playbackWatchdogTimer != nil {
			playbackWatchdogTimer.Stop()
			playbackWatchdogTimer = nil
		}

		fmt.Printf("Record removed: Stopping in %v...\n", globals.RecordRemovedTimeout)

		globals.RecordRemovedTimer = time.AfterFunc(globals.RecordRemovedTimeout, func() {
			fmt.Println("Stop sequence initiated.")
			globals.CurrentPlayingUID = ""

			stopVisual := map[string]interface{}{
				"effect": models.VisualEffectStop,
			}
			stopVisualPayload, _ := json.Marshal(stopVisual)
			globals.MQTTClient.Publish("vinyl/shelf/visuals", 0, false, stopVisualPayload)
		})
	}
}

func libraryRequestHandler(_ paho.Client, _ paho.Message) {
	fmt.Println("Library request received, fetching database...")

	libraryRows, queryError := globals.Database.Query(`
		SELECT
			uid, artist, album, tracks, media_uri,
			inner_record_color, inner_record_image, outer_design_color, outer_design_image,
			overlay_art, album_cover_art
		FROM albums
		ORDER BY created_at DESC`)
	if queryError != nil {
		log.Printf("Failed to query library: %v", queryError)
		return
	}
	defer libraryRows.Close()

	var albumRegistrations []models.RegistrationPayload
	for libraryRows.Next() {
		var albumRegistration models.RegistrationPayload
		if scanError := libraryRows.Scan(
			&albumRegistration.UID,
			&albumRegistration.Artist,
			&albumRegistration.Album,
			&albumRegistration.Tracks,
			&albumRegistration.MediaURI,
			&albumRegistration.InnerRecordColor,
			&albumRegistration.InnerRecordImage,
			&albumRegistration.OuterDesignColor,
			&albumRegistration.OuterDesignImage,
			&albumRegistration.OverlayArt,
			&albumRegistration.AlbumCoverArt,
		); scanError != nil {
			log.Printf("Error scanning row: %v", scanError)
			continue
		}
		albumRegistrations = append(albumRegistrations, albumRegistration)
	}

	if albumRegistrations == nil {
		albumRegistrations = []models.RegistrationPayload{}
	}

	libraryResponse := models.LibraryResponse{Albums: albumRegistrations}
	libraryPayload, _ := json.Marshal(libraryResponse)

	globals.MQTTClient.Publish("vinyl/shelf/library/data", 0, false, libraryPayload)
	fmt.Printf("Sent %d albums to the Flutter app\n", len(albumRegistrations))
}

func deleteHandler(_ paho.Client, message paho.Message) {
	recordUID := normalizeUID(string(message.Payload()))
	if recordUID == "" {
		log.Printf("Ignoring delete request with empty UID")
		return
	}
	fmt.Printf("◎ - Delete request received for UID: %s\n", recordUID)

	_, deleteError := globals.Database.Exec("DELETE FROM albums WHERE uid = ?", recordUID)
	if deleteError != nil {
		log.Printf("Failed to delete record: %v", deleteError)
		return
	}

	fmt.Printf("◉ - Deleted record: %s\n", recordUID)
}

func updateHandler(_ paho.Client, message paho.Message) {
	var updatePayload models.RegistrationPayload
	if unmarshalError := json.Unmarshal(message.Payload(), &updatePayload); unmarshalError != nil {
		log.Printf("Failed to parse update JSON: %v", unmarshalError)
		return
	}

	updatePayload.UID = normalizeUID(updatePayload.UID)
	if updatePayload.UID == "" {
		log.Printf("Ignoring update with empty UID")
		return
	}

	updateQuery := `
		UPDATE albums SET
			artist=?,
			album=?,
			tracks=?,
			media_uri=?,
			inner_record_color=?,
			inner_record_image=?,
			outer_design_color=?,
			outer_design_image=?,
			overlay_art=?,
			album_cover_art=?
		WHERE uid=?`

	_, databaseExecError := globals.Database.Exec(
		updateQuery,
		updatePayload.Artist,
		updatePayload.Album,
		updatePayload.Tracks,
		updatePayload.MediaURI,
		updatePayload.InnerRecordColor,
		updatePayload.InnerRecordImage,
		updatePayload.OuterDesignColor,
		updatePayload.OuterDesignImage,
		updatePayload.OverlayArt,
		updatePayload.AlbumCoverArt,
		updatePayload.UID,
	)
	if databaseExecError != nil {
		log.Printf("Failed to update record: %v", databaseExecError)
		return
	}

	fmt.Printf("Metadata updated for album: %s\n", updatePayload.Album)
}

func playbackEventHandler(_ paho.Client, message paho.Message) {
	var playbackEvent playbackEventPayload
	if unmarshalError := json.Unmarshal(message.Payload(), &playbackEvent); unmarshalError != nil {
		log.Printf("Failed to parse playback event JSON: %v", unmarshalError)
		return
	}

	if playbackEvent.Event == "" {
		return
	}

	globals.CurrentTrackIndex = playbackEvent.TrackIndex
	globals.CurrentTrackName = playbackEvent.TrackName
	globals.PlaybackPositionInMsec = playbackEvent.Position
	globals.PlaybackDurationInMsec = playbackEvent.Duration

	switch playbackEvent.Event {
	case "play":
		if playbackWatchdogTimer != nil {
			playbackWatchdogTimer.Stop()
			playbackWatchdogTimer = nil
		}

		globals.PlaybackState = models.PlaybackStatePlaying
		fmt.Printf("▶ PLAYING: Track %d - %s (Duration: %dms)\n", playbackEvent.TrackIndex, playbackEvent.TrackName, playbackEvent.Duration)
	case "pause":
		globals.PlaybackState = models.PlaybackStatePaused
		fmt.Printf("⏸ PAUSED: Track %d - %s (Position: %dms / %dms)\n", playbackEvent.TrackIndex, playbackEvent.TrackName, playbackEvent.Position, playbackEvent.Duration)
	case "skip_forward":
		globals.LastSkipEvent = models.SkipEventForward
		globals.LastSkipEventTime = time.Now()
		fmt.Printf("⏭ SKIP FORWARD: Track %d - %s\n", playbackEvent.TrackIndex, playbackEvent.TrackName)
	case "skip_backward":
		globals.LastSkipEvent = models.SkipEventBackward
		globals.LastSkipEventTime = time.Now()
		fmt.Printf("⏮ SKIP BACKWARD: Track %d - %s\n", playbackEvent.TrackIndex, playbackEvent.TrackName)
	case "seek":
		globals.LastSkipEvent = models.SkipEventSeek
		globals.LastSkipEventTime = time.Now()
		fmt.Printf("SEEK: Track %d - %s (Position: %dms / %dms)\n", playbackEvent.TrackIndex, playbackEvent.TrackName, playbackEvent.Position, playbackEvent.Duration)
	case "track_changed":
		fmt.Printf("→ TRACK CHANGED: Track %d - %s\n", playbackEvent.TrackIndex, playbackEvent.TrackName)
	}
}

func SubscribeToTopics(client paho.Client) {
	client.Subscribe("vinyl/shelf/tag", 0, tagHandler)
	client.Subscribe("vinyl/shelf/register", 0, registrationHandler)
	client.Subscribe("vinyl/shelf/update", 0, updateHandler)
	client.Subscribe("vinyl/shelf/status", 0, statusHandler)
	client.Subscribe("vinyl/shelf/library/request", 0, libraryRequestHandler)
	client.Subscribe("vinyl/shelf/delete", 0, deleteHandler)
	client.Subscribe("vinyl/shelf/playback/state", 0, playbackEventHandler)
}

func waitForMQTTConnection(connectionToken paho.Token, brokerAddress string) {
	connectedWithinTimeout := connectionToken.WaitTimeout(mqttConnectionTimeout)
	if !connectedWithinTimeout {
		log.Printf("MQTT timeout: Unable to connect to %s. Waiting for config update...", brokerAddress)
		return
	}

	if connectionToken.Error() != nil {
		log.Printf("MQTT error: %v. Waiting for config update...", connectionToken.Error())
		return
	}
}

func createMQTTClientOptions(mqttClientID string, brokerAddress string) *paho.ClientOptions {
	mqttClientOptions := paho.NewClientOptions().AddBroker(fmt.Sprintf("tcp://%s", brokerAddress))
	mqttClientOptions.SetClientID(mqttClientID)
	mqttClientOptions.SetAutoReconnect(true)

	mqttClientOptions.OnConnect = func(connectedMQTTClient paho.Client) {
		fmt.Printf("Orchestrator Online: %s\n", mqttClientID)
		SubscribeToTopics(connectedMQTTClient)
	}

	return mqttClientOptions
}

func ReconnectMQTT(newHost string, newPort string) error {
	fmt.Printf("\nReceived command to switch MQTT Broker to %s:%s...\n", newHost, newPort)

	if globals.MQTTClient != nil && globals.MQTTClient.IsConnected() {
		globals.MQTTClient.Disconnect(250)
		fmt.Println("Disconnected from old broker.")
	}

	brokerAddress := fmt.Sprintf("%s:%s", newHost, newPort)
	mqttClientID := fmt.Sprintf("vinyl_orchestrator_%d", time.Now().Unix())

	mqttClientOptions := createMQTTClientOptions(mqttClientID, brokerAddress)
	globals.MQTTClient = paho.NewClient(mqttClientOptions)

	connectionToken := globals.MQTTClient.Connect()
	connectedWithinTimeout := connectionToken.WaitTimeout(mqttConnectionTimeout)

	if !connectedWithinTimeout || connectionToken.Error() != nil {
		return fmt.Errorf("failed to connect to new broker at %s", brokerAddress)
	}

	fmt.Printf("Successfully migrated to new MQTT broker at %s\n", brokerAddress)
	return nil
}

func SetupMQTT() {
	brokerHost := getEnv("MQTT_BROKER_HOST", utils.GetLocalIP())
	brokerPort := getEnv("MQTT_BROKER_PORT", "1883")
	brokerAddress := fmt.Sprintf("%s:%s", brokerHost, brokerPort)

	mqttClientID := fmt.Sprintf("vinyl_orchestrator_%d", time.Now().Unix())
	mqttClientOptions := createMQTTClientOptions(mqttClientID, brokerAddress)
	globals.MQTTClient = paho.NewClient(mqttClientOptions)

	fmt.Printf("⚭ - Connecting to MQTT broker at %s...\n", brokerAddress)
	connectionToken := globals.MQTTClient.Connect()
	waitForMQTTConnection(connectionToken, brokerAddress)
}
