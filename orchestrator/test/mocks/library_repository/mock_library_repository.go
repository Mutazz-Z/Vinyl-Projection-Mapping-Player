package mock_library

import (
	"errors"
	"vinyl-orchestrator/core"
)

type MockLibraryRepository struct {
	storage map[string]core.VinylAlbumRecord
}

func NewMockLibraryRepository() *MockLibraryRepository {
	return &MockLibraryRepository{
		storage: make(map[string]core.VinylAlbumRecord),
	}
}

func (mock *MockLibraryRepository) SaveAlbumRecord(albumRecord core.VinylAlbumRecord) error {
	mock.storage[albumRecord.NfcUniqueIdentifier] = albumRecord
	return nil
}

func (mock *MockLibraryRepository) RetrieveAlbumByNfcIdentifier(nfcUniqueIdentifier string) (core.VinylAlbumRecord, error) {
	record, exists := mock.storage[nfcUniqueIdentifier]
	if !exists {
		return core.VinylAlbumRecord{}, errors.New("album not found")
	}
	return record, nil
}

func (mock *MockLibraryRepository) RetrieveAllSavedAlbums() ([]core.VinylAlbumRecord, error) {
	var results []core.VinylAlbumRecord
	for _, record := range mock.storage {
		results = append(results, record)
	}
	return results, nil
}

func (mock *MockLibraryRepository) DeleteAlbumRecord(nfcUniqueIdentifier string) error {
	delete(mock.storage, nfcUniqueIdentifier)
	return nil
}
