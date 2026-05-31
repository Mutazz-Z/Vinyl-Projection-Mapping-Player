/*
 * NFC tag album library management using SQLite and GORM
 */

package database

import (
	"fmt"
	"vinyl-orchestrator/typedefs"

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

	err = Database.AutoMigrate(&typedefs.VinylRecordTagData_t{})
	if err != nil {
		return nil, err
	}

	return &SQLiteAlbumLibrary{
		Database: Database,
	}, nil
}

func (repository *SQLiteAlbumLibrary) CheckUidExistsInLibrary(nfcUniqueIdentifier string) bool {
	var count int64
	repository.Database.Model(&typedefs.VinylRecordTagData_t{}).Where("tag_uid = ?", nfcUniqueIdentifier).Count(&count)

	return count > 0
}

func (repository *SQLiteAlbumLibrary) RetrieveAlbumByUid(nfcUniqueIdentifier string) typedefs.VinylRecordTagData_t {
	var retrievedAlbum typedefs.VinylRecordTagData_t

	result := repository.Database.Where("tag_uid = ?", nfcUniqueIdentifier).Find(&retrievedAlbum)
	if result.Error != nil {
		fmt.Printf("Error retrieving album by UID %s: %v\n", nfcUniqueIdentifier, result.Error)
	}
	return retrievedAlbum
}

func (repository *SQLiteAlbumLibrary) RetrieveAllSavedAlbums() ([]typedefs.VinylRecordTagData_t, error) {
	var allAlbumsList []typedefs.VinylRecordTagData_t

	err := repository.Database.Find(&allAlbumsList).Error

	return allAlbumsList, err
}

func (repository *SQLiteAlbumLibrary) SaveAlbumRecord(albumRecord typedefs.VinylRecordTagData_t) error {
	return repository.Database.Save(&albumRecord).Error
}

func (repository *SQLiteAlbumLibrary) DeleteAlbumRecord(uid string) error {
	return repository.Database.Where("tag_uid = ?", uid).Delete(&typedefs.VinylRecordTagData_t{}).Error
}

type AlbumLibrary interface {
	SaveAlbumRecord(albumRecord typedefs.VinylRecordTagData_t) error
	CheckUidExistsInLibrary(nfcUniqueIdentifier string) bool
	RetrieveAlbumByUid(nfcUniqueIdentifier string) typedefs.VinylRecordTagData_t
	RetrieveAllSavedAlbums() ([]typedefs.VinylRecordTagData_t, error)
	DeleteAlbumRecord(nfcUniqueIdentifier string) error
}
