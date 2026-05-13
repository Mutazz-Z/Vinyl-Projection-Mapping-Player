package main

import (
	"log"
)

func setupDatabase() {
	query := `
    CREATE TABLE IF NOT EXISTS albums (
        uid TEXT PRIMARY KEY,
        artist TEXT,
        album TEXT,
        tracks TEXT,
        media_uri TEXT,
        created_at DATETIME
    );`
	_, err := Database.Exec(query)
	if err != nil {
		log.Fatalf("Failed to create table: %v", err)
	}
}
