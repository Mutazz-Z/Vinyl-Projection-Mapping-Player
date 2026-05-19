package mock_playback

import "fmt"

type MockMediaPlayer struct {
	LastMediaUri     string
	PlayCommandCount int
	StopCommandCount int
	CurrentState     string
	ForcePlayError   bool
}

func (mock *MockMediaPlayer) PlayMedia(mediaUri string) error {
	mock.LastMediaUri = mediaUri
	mock.PlayCommandCount++
	if mock.ForcePlayError {
		return fmt.Errorf("simulated play error")
	}
	return nil
}

func (mock *MockMediaPlayer) StopMedia() error {
	mock.StopCommandCount++
	return nil
}

func (mock *MockMediaPlayer) GetState() (string, error) {
	return mock.CurrentState, nil
}
