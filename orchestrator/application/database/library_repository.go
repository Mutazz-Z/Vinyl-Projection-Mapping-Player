package database

import (
	"database/sql"
	"vinyl-orchestrator/core"
)

type SQLiteLibraryRepository struct {
	databaseConnection *sql.DB
}

func NewSQLiteLibraryRepository(databaseConnection *sql.DB) (*SQLiteLibraryRepository, error) {
	createLibraryTableQuery := `
		CREATE TABLE IF NOT EXISTS vinyl_library (
			nfc_identifier TEXT PRIMARY KEY,
			artist_name TEXT,
			album_title TEXT,
			track_list TEXT,
			media_uri TEXT,
			inner_record_color TEXT,
			inner_record_image TEXT,
			outer_design_color TEXT,
			outer_design_image TEXT,
			overlay_art TEXT,
			album_cover_art TEXT
		);`

	_, executionError := databaseConnection.Exec(createLibraryTableQuery)
	if executionError != nil {
		return nil, executionError
	}

	return &SQLiteLibraryRepository{
		databaseConnection: databaseConnection,
	}, nil
}

func (repository *SQLiteLibraryRepository) SaveAlbumRecord(albumRecord core.VinylAlbumRecord) error {
	insertAlbumQuery := `
		INSERT OR REPLACE INTO vinyl_library 
		(nfc_identifier, artist_name, album_title, track_list, media_uri, inner_record_color, inner_record_image, outer_design_color, outer_design_image, overlay_art, album_cover_art) 
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

	_, executionError := repository.databaseConnection.Exec(
		insertAlbumQuery,
		albumRecord.NfcUniqueIdentifier,
		albumRecord.ArtistName,
		albumRecord.AlbumTitle,
		albumRecord.TrackList,
		albumRecord.MediaResourceUri,
		albumRecord.InnerRecordColor,
		albumRecord.InnerRecordImage,
		albumRecord.OuterDesignColor,
		albumRecord.OuterDesignImage,
		albumRecord.OverlayArt,
		albumRecord.AlbumCoverArt,
	)

	return executionError
}

func (repository *SQLiteLibraryRepository) RetrieveAlbumByNfcIdentifier(nfcUniqueIdentifier string) (core.VinylAlbumRecord, error) {
	var retrievedAlbum core.VinylAlbumRecord

	retrieveQuery := `
		SELECT 
			COALESCE(nfc_identifier, ''), 
			COALESCE(artist_name, ''), 
			COALESCE(album_title, ''), 
			COALESCE(track_list, ''), 
			COALESCE(media_uri, ''), 
			COALESCE(inner_record_color, ''), 
			COALESCE(inner_record_image, ''), 
			COALESCE(outer_design_color, ''), 
			COALESCE(outer_design_image, ''), 
			COALESCE(overlay_art, ''), 
			COALESCE(album_cover_art, '')
		FROM vinyl_library 
		WHERE nfc_identifier = ?`

	queryError := repository.databaseConnection.QueryRow(retrieveQuery, nfcUniqueIdentifier).Scan(
		&retrievedAlbum.NfcUniqueIdentifier,
		&retrievedAlbum.ArtistName,
		&retrievedAlbum.AlbumTitle,
		&retrievedAlbum.TrackList,
		&retrievedAlbum.MediaResourceUri,
		&retrievedAlbum.InnerRecordColor,
		&retrievedAlbum.InnerRecordImage,
		&retrievedAlbum.OuterDesignColor,
		&retrievedAlbum.OuterDesignImage,
		&retrievedAlbum.OverlayArt,
		&retrievedAlbum.AlbumCoverArt,
	)

	return retrievedAlbum, queryError
}

func (repository *SQLiteLibraryRepository) RetrieveAllSavedAlbums() ([]core.VinylAlbumRecord, error) {
	
	retrieveAllQuery := `
		SELECT 
			COALESCE(nfc_identifier, ''), 
			COALESCE(artist_name, ''), 
			COALESCE(album_title, ''), 
			COALESCE(track_list, ''), 
			COALESCE(media_uri, ''), 
			COALESCE(inner_record_color, ''), 
			COALESCE(inner_record_image, ''), 
			COALESCE(outer_design_color, ''), 
			COALESCE(outer_design_image, ''), 
			COALESCE(overlay_art, ''), 
			COALESCE(album_cover_art, '')
		FROM vinyl_library`

	databaseRows, queryError := repository.databaseConnection.Query(retrieveAllQuery)
	if queryError != nil {
		return nil, queryError
	}
	defer databaseRows.Close()

	var allAlbumsList []core.VinylAlbumRecord

	for databaseRows.Next() {
		var currentRowAlbum core.VinylAlbumRecord
		scanError := databaseRows.Scan(
			&currentRowAlbum.NfcUniqueIdentifier,
			&currentRowAlbum.ArtistName,
			&currentRowAlbum.AlbumTitle,
			&currentRowAlbum.TrackList,
			&currentRowAlbum.MediaResourceUri,
			&currentRowAlbum.InnerRecordColor,
			&currentRowAlbum.InnerRecordImage,
			&currentRowAlbum.OuterDesignColor,
			&currentRowAlbum.OuterDesignImage,
			&currentRowAlbum.OverlayArt,
			&currentRowAlbum.AlbumCoverArt,
		)
		if scanError == nil {
			allAlbumsList = append(allAlbumsList, currentRowAlbum)
		}
	}

	return allAlbumsList, nil
}

func (repository *SQLiteLibraryRepository) DeleteAlbumRecord(nfcUniqueIdentifier string) error {
	deleteQuery := `DELETE FROM vinyl_library WHERE nfc_identifier = ?`
	_, executionError := repository.databaseConnection.Exec(deleteQuery, nfcUniqueIdentifier)
	return executionError
}
