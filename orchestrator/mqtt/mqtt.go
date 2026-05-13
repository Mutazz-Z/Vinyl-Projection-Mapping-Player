package mqtt

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/exec"
	"time"
	"vinyl-orchestrator/globals"
	"vinyl-orchestrator/models"
	"vinyl-orchestrator/player"

	paho "github.com/eclipse/paho.mqtt.golang"
)

func tagHandler(_ paho.Client, message paho.Message) {
	var tagPayload models.TagPayload
	if unmarshalError := json.Unmarshal(message.Payload(), &tagPayload); unmarshalError != nil {
		return
	}

	if globals.RecordRemovedTimer != nil {
		globals.RecordRemovedTimer.Stop()
		fmt.Println("Removal timer cancelled.")
	}

	fmt.Printf("\nScanning Shelf: %s\n", tagPayload.UID)

	var artistName, albumTitle, mediaURI, trackList string
	queryError := globals.Database.QueryRow("SELECT artist, album, media_uri, tracks FROM albums WHERE uid = ?", tagPayload.UID).
		Scan(&artistName, &albumTitle, &mediaURI, &trackList)

	if queryError == sql.ErrNoRows {
		player.HandleNewTag(tagPayload.UID)
	} else if queryError != nil {
		log.Printf("Database error: %v", queryError)
	} else if tagPayload.UID == globals.CurrentPlayingUID && globals.RecordRemovedTimer != nil {
		player.HandleReplacedTag()
	} else {
		player.HandleKnownTag(tagPayload.UID, artistName, albumTitle, mediaURI, trackList)
	}
}

func registrationHandler(_ paho.Client, message paho.Message) {
	var registrationPayload models.RegistrationPayload
	if unmarshalError := json.Unmarshal(message.Payload(), &registrationPayload); unmarshalError != nil {
		log.Printf("Failed to parse registration JSON: %v", unmarshalError)
		return
	}

	upsertQuery := `
    INSERT INTO albums (uid, artist, album, tracks, media_uri, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(uid) DO UPDATE SET
        artist=excluded.artist,
        album=excluded.album,
        tracks=excluded.tracks,
        media_uri=excluded.media_uri;`

	_, databaseExecError := globals.Database.Exec(
		upsertQuery,
		registrationPayload.UID,
		registrationPayload.Artist,
		registrationPayload.Album,
		registrationPayload.Tracks,
		registrationPayload.MediaURI,
		time.Now(),
	)
	if databaseExecError != nil {
		log.Printf("Failed to save registration: %v", databaseExecError)
		return
	}

	fmt.Printf("Database updated: %s by %s\n", registrationPayload.Album, registrationPayload.Artist)
	player.HandleKnownTag(
		registrationPayload.UID,
		registrationPayload.Artist,
		registrationPayload.Album,
		registrationPayload.MediaURI,
		registrationPayload.Tracks,
	)
}

func statusHandler(_ paho.Client, message paho.Message) {
	shelfStatus := string(message.Payload())
	if shelfStatus == "removed" {
		fmt.Printf("Record removed: Stopping in %v...\n", globals.RecordRemovedTimeout)

		globals.RecordRemovedTimer = time.AfterFunc(globals.RecordRemovedTimeout, func() {
			fmt.Println("Stop sequence initiated.")

			exec.Command("pkill", "-9", "mpv").Run()
			os.Remove("/tmp/mpvsocket")
			globals.CurrentPlayingUID = ""

			globals.MQTTClient.Publish("vinyl/shelf/visuals", 0, false, `{"effect": "stop"}`)
		})
	}
}

func libraryRequestHandler(_ paho.Client, _ paho.Message) {
	fmt.Println("Library request received, fetching database...")

	libraryRows, queryError := globals.Database.Query("SELECT uid, artist, album, tracks, media_uri FROM albums ORDER BY created_at DESC")
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
	recordUID := string(message.Payload())
	fmt.Printf("◎ - Delete request received for UID: %s\n", recordUID)

	_, deleteError := globals.Database.Exec("DELETE FROM albums WHERE uid = ?", recordUID)
	if deleteError != nil {
		log.Printf("Failed to delete record: %v", deleteError)
		return
	}

	fmt.Printf("◉ - Deleted record: %s\n", recordUID)
}

func SubscribeToTopics(client paho.Client) {
	client.Subscribe("vinyl/shelf/tag", 0, tagHandler)
	client.Subscribe("vinyl/shelf/register", 0, registrationHandler)
	client.Subscribe("vinyl/shelf/status", 0, statusHandler)
	client.Subscribe("vinyl/shelf/library/request", 0, libraryRequestHandler)
	client.Subscribe("vinyl/shelf/delete", 0, deleteHandler)
}

func waitForMQTTConnection(connectionToken paho.Token) {
	connectedWithinTimeout := connectionToken.WaitTimeout(10 * time.Second)
	if !connectedWithinTimeout {
		log.Fatal("MQTT connection timeout: Unable to connect to broker at 192.168.50.214:1883")
	}

	if connectionToken.Error() != nil {
		log.Fatal(connectionToken.Error())
	}
}

func createMQTTClientOptions(mqttClientID string) *paho.ClientOptions {
	mqttClientOptions := paho.NewClientOptions().AddBroker("tcp://192.168.50.214:1883")
	mqttClientOptions.SetClientID(mqttClientID)
	mqttClientOptions.SetAutoReconnect(true)

	mqttClientOptions.OnConnect = func(connectedMQTTClient paho.Client) {
		fmt.Printf("Orchestrator Online: %s\n", mqttClientID)
		SubscribeToTopics(connectedMQTTClient)
	}

	return mqttClientOptions
}

func SetupMQTT() {
	mqttClientID := fmt.Sprintf("vinyl_orchestrator_%d", time.Now().Unix())
	mqttClientOptions := createMQTTClientOptions(mqttClientID)
	globals.MQTTClient = paho.NewClient(mqttClientOptions)

	fmt.Println("⚭ - Connecting to MQTT broker at 192.168.50.214:1883...")
	connectionToken := globals.MQTTClient.Connect()
	waitForMQTTConnection(connectionToken)
}
