package tests

// import (
// 	"context"
// 	"testing"
// 	"time"

// 	"github.com/stretchr/testify/require"

// 	playbackapp "vinyl-orchestrator/application/playback"
// 	"vinyl-orchestrator/core"
// 	typedefinitions "vinyl-orchestrator/type_definitions"

// 	mock_datasource "vinyl-orchestrator/test/mocks/datasource"
// 	mock_library "vinyl-orchestrator/test/mocks/library_repository"
// 	mock_playback "vinyl-orchestrator/test/mocks/playback"
// )

// type PlaybackServiceTestContext struct {
// 	player       *mock_playback.MockMediaPlayer
// 	dataSource   *mock_datasource.MockDataSource
// 	AlbumLibrary *mock_library.MockAlbumLibrary
// }

// func setupPlaybackServiceTest(t *testing.T, watchdogTimeoutInMsec int) PlaybackServiceTestContext {

// 	t.Helper()

// 	mockMediaPlayer := &mock_playback.MockMediaPlayer{CurrentState: "idle"}
// 	mockDataSource := mock_datasource.DataSourceMock()
// 	mockAlbumLibrary := mock_library.NewMockAlbumLibrary()
// 	playbackService := playbackapp.NewPlaybackApplicationService(mockMediaPlayer)

// 	playbackService.WatchdogTimeout = time.Duration(watchdogTimeoutInMsec) * time.Millisecond

// 	playbackService.Init(mockDataSource, mockAlbumLibrary)
// 	applicationContext, cancelApplicationContext := context.WithCancel(context.Background())

// 	t.Cleanup(cancelApplicationContext)

// 	playbackService.StartPlugin(applicationContext)

// 	return PlaybackServiceTestContext{
// 		player:       mockMediaPlayer,
// 		dataSource:   mockDataSource,
// 		AlbumLibrary: mockAlbumLibrary,
// 	}
// }

// func TestPlaybackService_PlaysAlbumWhenRecordIsScanned(t *testing.T) {

// 	playbackServiceTestContext := setupPlaybackServiceTest(t, 10000)

// 	testAlbum := typedefinitions.VinylRecordTagData{
// 		Uid:        "TEST-TAG-123",
// 		ArtistName: "Test Artist",
// 		Title:      "Test Album",
// 		Uri:        "test://media/uri",
// 	}

// 	playbackServiceTestContext.AlbumLibrary.SaveAlbumRecord(testAlbum)

// 	playbackServiceTestContext.dataSource.Publish("hardware_record_scanned", testAlbum.Uid)

// 	time.Sleep(100 * time.Millisecond)

// 	require.Equal(t, 1, playbackServiceTestContext.player.PlayCommandCount)

// 	require.Equal(t, testAlbum.Uri, playbackServiceTestContext.player.LastMediaUri)
// }

// func TestPlaybackService_StopsPlaybackWhenRecordIsRemoved(t *testing.T) {
// 	playbackServiceTestContext := setupPlaybackServiceTest(t, 10000)

// 	testAlbum := core.VinylAlbumRecord{
// 		Uid:        "TEST-TAG-456",
// 		ArtistName: "Another Artist",
// 		Title:      "Another Album",
// 		Uri:        "test://another/media/uri",
// 	}
// 	playbackServiceTestContext.AlbumLibrary.SaveAlbumRecord(testAlbum)

// 	playbackServiceTestContext.dataSource.Publish("hardware_record_scanned", testAlbum.Uid)
// 	time.Sleep(100 * time.Millisecond)

// 	playbackServiceTestContext.dataSource.Publish("hardware_record_removed", testAlbum.Uid)

// 	time.Sleep(1200 * time.Millisecond)

// 	require.Equal(t, 1, playbackServiceTestContext.player.StopCommandCount)
// }

// func TestPlaybackService_IgnoresQuickRecordReplacement(t *testing.T) {
// 	playbackServiceTestContext := setupPlaybackServiceTest(t, 10000)

// 	testAlbum := core.VinylAlbumRecord{
// 		Uid:        "TEST-TAG-789",
// 		ArtistName: "Debounce Artist",
// 		Title:      "Debounce Album",
// 		Uri:        "test://debounce/media/uri",
// 	}
// 	playbackServiceTestContext.AlbumLibrary.SaveAlbumRecord(testAlbum)

// 	playbackServiceTestContext.dataSource.Publish("hardware_record_scanned", testAlbum.Uid)
// 	time.Sleep(100 * time.Millisecond)

// 	playbackServiceTestContext.dataSource.Publish("hardware_record_removed", testAlbum.Uid)

// 	time.Sleep(200 * time.Millisecond)

// 	playbackServiceTestContext.dataSource.Publish("hardware_record_scanned", testAlbum.Uid)

// 	time.Sleep(1200 * time.Millisecond)

// 	require.Equal(t, 0, playbackServiceTestContext.player.StopCommandCount)
// }

// func TestPlaybackService_ErrorsPlaybackAfterWatchdogTimeout(t *testing.T) {
// 	playbackServiceTestContext := setupPlaybackServiceTest(t, 50)

// 	timeoutChannel := playbackServiceTestContext.dataSource.Subscribe("playback_watchdog_timeout")

// 	testAlbum := core.VinylAlbumRecord{
// 		Uid:        "TEST-TAG-TIMEOUT",
// 		ArtistName: "Timeout Artist",
// 		Title:      "Timeout Album",
// 		Uri:        "test://timeout/media/uri",
// 	}
// 	playbackServiceTestContext.AlbumLibrary.SaveAlbumRecord(testAlbum)

// 	playbackServiceTestContext.player.CurrentState = "idle"

// 	playbackServiceTestContext.dataSource.Publish("hardware_record_scanned", testAlbum.Uid)

// 	select {
// 	case <-timeoutChannel:
// 	case <-time.After(200 * time.Millisecond):
// 		t.Fatal("Watchdog timeout event was not published within the expected window.")
// 	}

// 	require.Equal(t, "error", playbackServiceTestContext.dataSource.Storage["GLOBAL_ActiveRecordPlaybackState"])
// }

// func TestPlaybackService_HandlesPlayerRejection(t *testing.T) {
// 	playbackServiceTestContext := setupPlaybackServiceTest(t, 10000)

// 	testAlbum := core.VinylAlbumRecord{
// 		Uid: "TEST-TAG-BROKEN",
// 		Uri: "test://broken/uri",
// 	}
// 	playbackServiceTestContext.AlbumLibrary.SaveAlbumRecord(testAlbum)

// 	playbackServiceTestContext.player.ForcePlayError = true

// 	playbackServiceTestContext.dataSource.Publish("hardware_record_scanned", testAlbum.Uid)
// 	time.Sleep(50 * time.Millisecond)

// 	require.Equal(t, 1, playbackServiceTestContext.player.PlayCommandCount)

// 	timeoutChannel := playbackServiceTestContext.dataSource.Subscribe("playback_watchdog_timeout")

// 	select {
// 	case <-timeoutChannel:
// 		t.Fatal("Watchdog fired, but it never should have been started!")
// 	case <-time.After(100 * time.Millisecond):
// 	}
// }

// func TestPlaybackService_HandlesUnknownTags(t *testing.T) {
// 	playbackServiceTestContext := setupPlaybackServiceTest(t, 10000)

// 	unknownTagChannel := playbackServiceTestContext.dataSource.Subscribe("hardware_record_unknown")

// 	playbackServiceTestContext.dataSource.Publish("hardware_record_scanned", "UNKNOWN-GHOST-TAG")

// 	select {
// 	case <-unknownTagChannel:
// 	case <-time.After(100 * time.Millisecond):
// 		t.Fatal("Service failed to broadcast the 'hardware_record_unknown' event.")
// 	}

// 	require.Equal(t, 0, playbackServiceTestContext.player.PlayCommandCount)
// }
