package database

import (
	"fmt"
	"log"
	"vinyl-orchestrator/globals"
)

func ensureColumnExists(columnName string, columnType string) {
	existsQuery := fmt.Sprintf("SELECT 1 FROM pragma_table_info('albums') WHERE name = '%s' LIMIT 1", columnName)
	row := globals.Database.QueryRow(existsQuery)

	var exists int
	scanError := row.Scan(&exists)
	if scanError == nil {
		return
	}

	alterQuery := fmt.Sprintf("ALTER TABLE albums ADD COLUMN %s %s", columnName, columnType)
	if _, err := globals.Database.Exec(alterQuery); err != nil {
		log.Printf("Failed to add column %s: %v", columnName, err)
	}
}

func SetupDatabase() {
	query := `
    CREATE TABLE IF NOT EXISTS albums (
        uid TEXT PRIMARY KEY,
        artist TEXT,
        album TEXT,
        tracks TEXT,
        media_uri TEXT,
        inner_record_color TEXT,
        inner_record_image TEXT,
        outer_design_color TEXT,
        outer_design_image TEXT,
        overlay_art TEXT,
        album_cover_art TEXT,
        created_at DATETIME
    );`
	_, err := globals.Database.Exec(query)
	if err != nil {
		log.Fatalf("Failed to create table: %v", err)
	}

	ensureColumnExists("inner_record_color", "TEXT")
	ensureColumnExists("inner_record_image", "TEXT")
	ensureColumnExists("outer_design_color", "TEXT")
	ensureColumnExists("outer_design_image", "TEXT")
	ensureColumnExists("overlay_art", "TEXT")
	ensureColumnExists("album_cover_art", "TEXT")
}
