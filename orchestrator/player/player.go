package player

import (
	"encoding/json"
	"fmt"
	"net/url"
	"strings"
	"vinyl-orchestrator/globals"
	"vinyl-orchestrator/models"
)

const (
	defaultRegistrationHost = "192.168.50.214"
	defaultRegistrationPort = "8000"
)

func normalizeUID(uid string) string {
	return strings.ToUpper(strings.TrimSpace(uid))
}

func HandleReplacedTag() {
	fmt.Println("Same record replaced: removed timer reset.")
	if globals.RecordRemovedTimer != nil {
		globals.RecordRemovedTimer.Stop()
	}
	globals.RecordRemovedTimer = nil
}

func HandleNewTag(recordUID string) {
	recordUID = normalizeUID(recordUID)
	fmt.Printf("New record detected: %s\n", recordUID)
	globals.MQTTClient.Publish("vinyl/request_register", 0, false, recordUID)

	registrationURL := fmt.Sprintf("http://%s:%s/?uid=%s", defaultRegistrationHost, defaultRegistrationPort, url.QueryEscape(recordUID))

	unknownVisualPayload := models.VisualEffectPayload{
		Effect:          models.VisualEffectUnknown,
		UID:             recordUID,
		RegistrationURL: registrationURL,
	}

	visualPayloadBytes, _ := json.Marshal(unknownVisualPayload)
	globals.MQTTClient.Publish("vinyl/shelf/visuals", 0, false, visualPayloadBytes)
}

func sendDataToProjector(albumMetadata models.RegistrationPayload) {
	visualPayload := models.VisualEffectPayload{
		Effect:           models.VisualEffectPlay,
		Artist:           albumMetadata.Artist,
		Album:            albumMetadata.Album,
		Tracks:           albumMetadata.Tracks,
		MediaURI:         albumMetadata.MediaURI,
		InnerRecordColor: albumMetadata.InnerRecordColor,
		InnerRecordImage: albumMetadata.InnerRecordImage,
		OuterDesignColor: albumMetadata.OuterDesignColor,
		OuterDesignImage: albumMetadata.OuterDesignImage,
		OverlayArt:       albumMetadata.OverlayArt,
		AlbumCoverArt:    albumMetadata.AlbumCoverArt,
	}

	visualPayloadBytes, _ := json.Marshal(visualPayload)
	globals.MQTTClient.Publish("vinyl/shelf/visuals", 0, false, visualPayloadBytes)
}

func HandleKnownTag(recordUID string, albumMetadata models.RegistrationPayload) {
	recordUID = normalizeUID(recordUID)

	globals.CurrentPlayingUID = recordUID
	fmt.Printf("NOW PLAYING: %s - %s\n", albumMetadata.Artist, albumMetadata.Album)

	sendDataToProjector(albumMetadata)
}
