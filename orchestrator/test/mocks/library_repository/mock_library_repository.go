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

// func (mock *MockAlbumLibrary) RetrieveAlbumByUid(nfcUniqueIdentifier string) (typedefinitions.VinylRecordTagData, error) {
// 	record := mock.storage[nfcUniqueIdentifier]

// 	return record
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
