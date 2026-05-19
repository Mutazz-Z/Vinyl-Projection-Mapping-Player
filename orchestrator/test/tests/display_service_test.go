package tests

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/require"

	"vinyl-orchestrator/core"
	display "vinyl-orchestrator/application/display"
	mock_datasource "vinyl-orchestrator/test/mocks/datasource"
	mock_library "vinyl-orchestrator/test/mocks/library_repository"
)

type DisplayServiceTestContext struct {
	dataSource        *mock_datasource.MockDataSource
	libraryRepository *mock_library.MockLibraryRepository
	projectorChannel  <-chan core.Event
}

func setupDisplayServiceTest(t *testing.T) DisplayServiceTestContext {
	t.Helper()

	mockDataSource := mock_datasource.DataSourceMock()
	mockLibraryRepository := mock_library.NewMockLibraryRepository()

	displayService := display.NewDisplayApplicationService()
	displayService.Init(mockDataSource, mockLibraryRepository)

	applicationContext, cancelApplicationContext := context.WithCancel(context.Background())
	t.Cleanup(cancelApplicationContext)

	testProjectorChannel := mockDataSource.Subscribe("projector_visual_update")

	displayService.StartPlugin(applicationContext)

	return DisplayServiceTestContext{
		dataSource:        mockDataSource,
		libraryRepository: mockLibraryRepository,
		projectorChannel:  testProjectorChannel,
	}
}

func TestDisplayService_PublishesPlayEffectForKnownRecord(t *testing.T) {
	testContext := setupDisplayServiceTest(t)

	testAlbum := core.VinylAlbumRecord{
		NfcUniqueIdentifier: "TEST-TAG-KNOWN",
		ArtistName:          "Visual Artist",
		AlbumTitle:          "Visual Album",
		InnerRecordColor:    "#FF5733",
	}
	testContext.libraryRepository.SaveAlbumRecord(testAlbum)

	testContext.dataSource.Publish("hardware_record_scanned", testAlbum.NfcUniqueIdentifier)

	select {
	case incomingVisualEvent := <-testContext.projectorChannel:
		visualPayload, isPayloadValid := incomingVisualEvent.Payload.(core.VisualEffectPayload)
		require.True(t, isPayloadValid)
		
		require.Equal(t, core.VisualEffectPlay, visualPayload.Effect)
		require.Equal(t, testAlbum.ArtistName, visualPayload.ArtistName)
		require.Equal(t, testAlbum.InnerRecordColor, visualPayload.InnerRecordColor)
	case <-time.After(100 * time.Millisecond):
		t.Fatal("Display service failed to publish visual payload in time")
	}
}

func TestDisplayService_PublishesUnknownEffectWithRegistrationUrl(t *testing.T) {
	testContext := setupDisplayServiceTest(t)

	testContext.dataSource.Write("registration_host_address", "192.168.1.50")
	testContext.dataSource.Write("registration_host_port", "9000")

	unknownTagId := "GHOST-TAG-999"
	testContext.dataSource.Publish("hardware_record_unknown", unknownTagId)

	select {
	case incomingVisualEvent := <-testContext.projectorChannel:
		visualPayload, isPayloadValid := incomingVisualEvent.Payload.(core.VisualEffectPayload)
		require.True(t, isPayloadValid)
		
		require.Equal(t, core.VisualEffectUnknown, visualPayload.Effect)
		require.Equal(t, unknownTagId, visualPayload.UniqueIdentifier)
		require.Equal(t, "http://192.168.1.50:9000/?uid=GHOST-TAG-999", visualPayload.RegistrationURL)
	case <-time.After(100 * time.Millisecond):
		t.Fatal("Display service failed to publish unknown visual payload")
	}
}

func TestDisplayService_PublishesStopEffectWhenRecordRemoved(t *testing.T) {
	testContext := setupDisplayServiceTest(t)

	testContext.dataSource.Publish("hardware_record_removed", nil)

	select {
	case incomingVisualEvent := <-testContext.projectorChannel:
		visualPayload, isPayloadValid := incomingVisualEvent.Payload.(core.VisualEffectPayload)
		require.True(t, isPayloadValid)
		
		require.Equal(t, core.VisualEffectStop, visualPayload.Effect)
	case <-time.After(100 * time.Millisecond):
		t.Fatal("Display service failed to publish stop payload")
	}
}

func TestDisplayService_PublishesErrorEffectOnWatchdogTimeout(t *testing.T) {
	testContext := setupDisplayServiceTest(t)

	testContext.dataSource.Publish("playback_watchdog_timeout", nil)

	select {
	case incomingVisualEvent := <-testContext.projectorChannel:
		visualPayload, isPayloadValid := incomingVisualEvent.Payload.(core.VisualEffectPayload)
		require.True(t, isPayloadValid)
		
		require.Equal(t, core.VisualEffectError, visualPayload.Effect)
		require.NotEmpty(t, visualPayload.ErrorMessage)
	case <-time.After(100 * time.Millisecond):
		t.Fatal("Display service failed to publish error payload")
	}
}