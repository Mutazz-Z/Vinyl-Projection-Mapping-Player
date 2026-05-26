/*
 * NFC tag album library management using SQLite and GORM
 */

package database

import (
	typedefinitions "vinyl-orchestrator/type_definitions"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type SQLiteAlbumLibrary struct {
	Database *gorm.DB
}

func NewSQLiteAlbumLibrary(databasePath string) (*SQLiteAlbumLibrary, error) {
	Database, err := gorm.Open(sqlite.Open(databasePath), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	err = Database.AutoMigrate(&typedefinitions.VinylRecordTagData{})
	if err != nil {
		return nil, err
	}

	return &SQLiteAlbumLibrary{
		Database: Database,
	}, nil
}

func (repository *SQLiteAlbumLibrary) RetrieveAlbumByNfcIdentifier(nfcUniqueIdentifier string) (typedefinitions.VinylRecordTagData, error) {
	var retrievedAlbum typedefinitions.VinylRecordTagData
	err := repository.Database.Where("tag_uid = ?", nfcUniqueIdentifier).First(&retrievedAlbum).Error

	return retrievedAlbum, err
}

func (repository *SQLiteAlbumLibrary) RetrieveAllSavedAlbums() ([]typedefinitions.VinylRecordTagData, error) {
	var allAlbumsList []typedefinitions.VinylRecordTagData

	err := repository.Database.Find(&allAlbumsList).Error

	return allAlbumsList, err
}

func (repository *SQLiteAlbumLibrary) SaveAlbumRecord(albumRecord typedefinitions.VinylRecordTagData) error {
	return repository.Database.Save(&albumRecord).Error
}

func (repository *SQLiteAlbumLibrary) DeleteAlbumRecord(uid string) error {
	return repository.Database.Where("tag_uid = ?", uid).Delete(&typedefinitions.VinylRecordTagData{}).Error
}
