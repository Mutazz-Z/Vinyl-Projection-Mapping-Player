package main

import (
	"database/sql"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
)

var (
	Database          *sql.DB
	MQTTClient        mqtt.Client
	StopTimer         *time.Timer
	CurrentPlayingUID string
)

const (
	RecordRemovedTimeout = 5 * time.Second
)
