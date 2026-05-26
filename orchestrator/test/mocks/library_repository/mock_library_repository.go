package mock_library

// import (
// 	"errors"
// 	typedefinitions "vinyl-orchestrator/type_definitions"
// )

// type MockAlbumLibrary struct {
// 	storage map[string]typedefinitions.VinylRecordTagData
// }

// func NewMockAlbumLibrary() *MockAlbumLibrary {
// 	return &MockAlbumLibrary{
// 		storage: make(map[string]typedefinitions.VinylRecordTagData),
// 	}
// }

// func (mock *MockAlbumLibrary) SaveAlbumRecord(albumRecord typedefinitions.VinylRecordTagData) error {
// 	// mock.storage[albumRecord.Uid] = albumRecord
// 	return nil
// }

// func (mock *MockAlbumLibrary) RetrieveAlbumByNfcIdentifier(nfcUniqueIdentifier string) (typedefinitions.VinylRecordTagData, error) {
// 	record, exists := mock.storage[nfcUniqueIdentifier]
// 	if !exists {
// 		return typedefinitions.VinylRecordTagData{}, errors.New("album not found")
// 	}
// 	return record, nil
// }

// func (mock *MockAlbumLibrary) RetrieveAllSavedAlbums() ([]typedefinitions.VinylRecordTagData, error) {
// 	var results []typedefinitions.VinylRecordTagData
// 	for _, record := range mock.storage {
// 		results = append(results, record)
// 	}
// 	return results, nil
// }

// func (mock *MockAlbumLibrary) DeleteAlbumRecord(nfcUniqueIdentifier string) error {
// 	delete(mock.storage, nfcUniqueIdentifier)
// 	return nil
// }
