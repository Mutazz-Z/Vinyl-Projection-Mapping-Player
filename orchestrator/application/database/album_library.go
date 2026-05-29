/*
 * NFC tag album library management using SQLite and GORM
 */

package database

import (
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"vinyl-orchestrator/core"
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

func (repository *SQLiteAlbumLibrary) RetrieveAlbumByNfcIdentifier(nfcUniqueIdentifier string) (core.VinylRecordTagData_t, error) {
	var retrievedAlbum core.VinylRecordTagData_t

	result := repository.Database.Where("tag_uid = ?", nfcUniqueIdentifier).Find(&retrievedAlbum)
	if result.Error != nil {
		return retrievedAlbum, result.Error
	}

	if result.RowsAffected == 0 {
		return retrievedAlbum, gorm.ErrRecordNotFound
	}

	return retrievedAlbum, nil
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
	RetrieveAlbumByNfcIdentifier(nfcUniqueIdentifier string) (core.VinylRecordTagData_t, error)
	RetrieveAllSavedAlbums() ([]core.VinylRecordTagData_t, error)
	DeleteAlbumRecord(nfcUniqueIdentifier string) error
}
