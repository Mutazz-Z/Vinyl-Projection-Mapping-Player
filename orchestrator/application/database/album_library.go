/*
 * NFC tag album library management using SQLite and GORM
 */

package database

import (
	"fmt"
	"vinyl-orchestrator/core"

	"github.com/glebarez/sqlite"
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

	err = Database.AutoMigrate(&core.VinylRecordTagData_t{})
	if err != nil {
		return nil, err
	}

	return &SQLiteAlbumLibrary{
		Database: Database,
	}, nil
}

func (repository *SQLiteAlbumLibrary) CheckUidExistsInLibrary(nfcUniqueIdentifier string) bool {
	var count int64
	repository.Database.Model(&core.VinylRecordTagData_t{}).Where("tag_uid = ?", nfcUniqueIdentifier).Count(&count)

	return count > 0
}

func (repository *SQLiteAlbumLibrary) RetrieveAlbumByUid(nfcUniqueIdentifier string) core.VinylRecordTagData_t {
	var retrievedAlbum core.VinylRecordTagData_t

	result := repository.Database.Where("tag_uid = ?", nfcUniqueIdentifier).Find(&retrievedAlbum)
	if result.Error != nil {
		fmt.Printf("Error retrieving album by UID %s: %v\n", nfcUniqueIdentifier, result.Error)
	}
	return retrievedAlbum
}

func (repository *SQLiteAlbumLibrary) RetrieveAllSavedAlbums() ([]core.VinylRecordTagData_t, error) {
	var allAlbumsList []core.VinylRecordTagData_t

	err := repository.Database.Find(&allAlbumsList).Error

	return allAlbumsList, err
}

func (repository *SQLiteAlbumLibrary) SaveAlbumRecord(albumRecord core.VinylRecordTagData_t) error {
	return repository.Database.Save(&albumRecord).Error
}

func (repository *SQLiteAlbumLibrary) DeleteAlbumRecord(uid string) error {
	return repository.Database.Where("tag_uid = ?", uid).Delete(&core.VinylRecordTagData_t{}).Error
}

type AlbumLibrary interface {
	SaveAlbumRecord(albumRecord core.VinylRecordTagData_t) error
	CheckUidExistsInLibrary(nfcUniqueIdentifier string) bool
	RetrieveAlbumByUid(nfcUniqueIdentifier string) core.VinylRecordTagData_t
	RetrieveAllSavedAlbums() ([]core.VinylRecordTagData_t, error)
	DeleteAlbumRecord(nfcUniqueIdentifier string) error
}
