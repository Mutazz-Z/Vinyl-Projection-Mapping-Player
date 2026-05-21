package musicassistant

import (
	"encoding/json"
	"fmt"
	"strings"

	"vinyl-orchestrator/core"
)

type SystemMetadataResolver struct {
	messageRouter     *RpcMessageRouter
	connectionManager *WebSocketManager
}

func NewSystemMetadataResolver(routerInstance *RpcMessageRouter, managerInstance *WebSocketManager) *SystemMetadataResolver {
	return &SystemMetadataResolver{
		messageRouter:     routerInstance,
		connectionManager: managerInstance,
	}
}

func (resolver *SystemMetadataResolver) ValidateSystemCredentials() error {
	activeConnection, isConnectionAuthenticated := resolver.connectionManager.RetrieveActiveConnectionState()
	if activeConnection == nil {
		return fmt.Errorf("not connected to Music Assistant — check the URL and ensure the server is reachable")
	}

	if !isConnectionAuthenticated {
		return fmt.Errorf("connected but not yet authenticated — the token may be incorrect")
	}

	return nil
}

func (resolver *SystemMetadataResolver) FetchCleanMetadata(mediaResourceIdentifier string) (*core.VinylAlbumRecord, error) {
	commandArguments := map[string]interface{}{
		"uri": mediaResourceIdentifier,
	}

	remoteProcedureCallResponseData, executionError := resolver.messageRouter.ExecuteRemoteProcedureCall("music/item_by_uri", commandArguments)
	if executionError != nil {
		return nil, executionError
	}

	fetchedVinylRecord, extractionError := resolver.extractVinylAlbumRecordFromRpcResponse(remoteProcedureCallResponseData)
	if extractionError != nil {
		return nil, extractionError
	}

	fetchedVinylRecord.MediaResourceUri = mediaResourceIdentifier

	resolver.enrichRecordWithAlbumTracksIfApplicable(fetchedVinylRecord, mediaResourceIdentifier)

	return fetchedVinylRecord, nil
}

func (resolver *SystemMetadataResolver) enrichRecordWithAlbumTracksIfApplicable(fetchedVinylRecord *core.VinylAlbumRecord, mediaResourceIdentifier string) {
	uriPartsArray := strings.SplitN(mediaResourceIdentifier, "://", 2)
	if len(uriPartsArray) != 2 {
		return
	}

	providerDomainString := uriPartsArray[0]
	pathSegmentsArray := strings.SplitN(uriPartsArray[1], "/", 2)

	if len(pathSegmentsArray) == 2 {
		mediaTypeString := pathSegmentsArray[0]
		itemIdentifierString := pathSegmentsArray[1]

		if mediaTypeString == "album" {
			resolver.executeTrackEnrichmentProcedure(fetchedVinylRecord, itemIdentifierString, providerDomainString)
		}
	}
}

func (resolver *SystemMetadataResolver) executeTrackEnrichmentProcedure(fetchedVinylRecord *core.VinylAlbumRecord, itemIdentifierString string, providerDomainString string) {
	tracksCommandArguments := map[string]interface{}{
		"item_id":                        itemIdentifierString,
		"provider_instance_id_or_domain": providerDomainString,
	}

	tracksResponseData, executionError := resolver.messageRouter.ExecuteRemoteProcedureCall("music/albums/album_tracks", tracksCommandArguments)
	if executionError == nil {
		resolver.extractAndFormatTrackList(fetchedVinylRecord, tracksResponseData)
	} else {
		fmt.Printf("Warning: failed to fetch album tracks: %v\n", executionError)
	}
}

func (resolver *SystemMetadataResolver) extractAndFormatTrackList(fetchedVinylRecord *core.VinylAlbumRecord, tracksResponseData map[string]interface{}) {
	rawResultData, containsResult := tracksResponseData["result"]
	if !containsResult {
		return
	}

	var parsedTrackNamesList []string

	switch typedResultData := rawResultData.(type) {
	case []interface{}:
		parsedTrackNamesList = resolver.extractTrackNamesFromInterfaceArray(typedResultData)
	case map[string]interface{}:
		parsedTrackNamesList = resolver.extractTrackNamesFromNestedItemsMap(typedResultData)
	}

	if len(parsedTrackNamesList) > 0 {
		fetchedVinylRecord.TrackList = strings.Join(parsedTrackNamesList, "\n")
	}
}

func (resolver *SystemMetadataResolver) extractTrackNamesFromInterfaceArray(rawTrackArray []interface{}) []string {
	var trackNamesList []string
	for _, rawTrackData := range rawTrackArray {
		if trackDataMap, isMapValid := rawTrackData.(map[string]interface{}); isMapValid {
			if trackNameString, isNameStringValid := trackDataMap["name"].(string); isNameStringValid {
				trackNamesList = append(trackNamesList, trackNameString)
			}
		}
	}
	return trackNamesList
}

func (resolver *SystemMetadataResolver) extractTrackNamesFromNestedItemsMap(nestedItemsMap map[string]interface{}) []string {
	var trackNamesList []string
	if itemsInterfaceArray, containsItems := nestedItemsMap["items"].([]interface{}); containsItems {
		trackNamesList = resolver.extractTrackNamesFromInterfaceArray(itemsInterfaceArray)
	}
	return trackNamesList
}

func (resolver *SystemMetadataResolver) extractVinylAlbumRecordFromRpcResponse(remoteProcedureCallResponseData map[string]interface{}) (*core.VinylAlbumRecord, error) {
	rawResultData, containsResult := remoteProcedureCallResponseData["result"]
	if !containsResult {
		rawJsonBytes, _ := json.MarshalIndent(remoteProcedureCallResponseData, "", "  ")
		return nil, fmt.Errorf("response did not contain a 'result' field. Raw response: \n%s", string(rawJsonBytes))
	}

	responseResultDataMap, validationError := resolver.validateAndConvertResultDataToMap(rawResultData)
	if validationError != nil {
		return nil, validationError
	}

	fetchedVinylRecord := &core.VinylAlbumRecord{}

	if albumNameString, isNameStringValid := responseResultDataMap["name"].(string); isNameStringValid {
		fetchedVinylRecord.AlbumTitle = albumNameString
	}

	fetchedVinylRecord.ArtistName = resolver.extractArtistNameFromResultData(responseResultDataMap)
	fetchedVinylRecord.AlbumCoverArt = resolver.extractAlbumCoverArtFromResultData(responseResultDataMap)

	return fetchedVinylRecord, nil
}

func (resolver *SystemMetadataResolver) validateAndConvertResultDataToMap(rawResultData interface{}) (map[string]interface{}, error) {
	switch typedResultData := rawResultData.(type) {
	case map[string]interface{}:
		return typedResultData, nil
	case []interface{}:
		if len(typedResultData) > 0 {
			if firstItemMap, isMapValid := typedResultData[0].(map[string]interface{}); isMapValid {
				return firstItemMap, nil
			}
			return nil, fmt.Errorf("result list did not contain a valid JSON object")
		}
		return nil, fmt.Errorf("music assistant returned an empty list")
	case nil:
		return nil, fmt.Errorf("music assistant returned null (item not found)")
	default:
		return nil, fmt.Errorf("expected Map or List, got %T", rawResultData)
	}
}

func (resolver *SystemMetadataResolver) extractArtistNameFromResultData(responseResultDataMap map[string]interface{}) string {
	artistsInterfaceArray, isArrayValid := responseResultDataMap["artists"].([]interface{})
	if !isArrayValid || len(artistsInterfaceArray) == 0 {
		return ""
	}

	firstArtistMap, isArtistMapValid := artistsInterfaceArray[0].(map[string]interface{})
	if !isArtistMapValid {
		return ""
	}

	artistNameString, isArtistNameStringValid := firstArtistMap["name"].(string)
	if !isArtistNameStringValid {
		return ""
	}

	return artistNameString
}

func (resolver *SystemMetadataResolver) extractAlbumCoverArtFromResultData(responseResultDataMap map[string]interface{}) string {
	metadataMap, isMetadataMapValid := responseResultDataMap["metadata"].(map[string]interface{})
	if !isMetadataMapValid {
		return ""
	}

	imagesInterfaceArray, isImagesArrayValid := metadataMap["images"].([]interface{})
	if !isImagesArrayValid || len(imagesInterfaceArray) == 0 {
		return ""
	}

	for _, rawImageData := range imagesInterfaceArray {
		if imageMap, isImageMapValid := rawImageData.(map[string]interface{}); isImageMapValid {
			if imageUrlString, isUrlStringValid := imageMap["url"].(string); isUrlStringValid && imageUrlString != "" {
				return imageUrlString
			}
			if imagePathString, isPathStringValid := imageMap["path"].(string); isPathStringValid && imagePathString != "" {
				return imagePathString
			}
		}
	}

	return ""
}
