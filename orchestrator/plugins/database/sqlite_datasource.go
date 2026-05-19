package database

import (
	"database/sql"
	"encoding/json"
	"errors"
	"sync"

	_ "github.com/mattn/go-sqlite3"
	"vinyl-orchestrator/core"
)

type SQLiteDataSource struct {
	connection       *sql.DB
	memoryCache      map[string]interface{}
	cacheMutex       sync.RWMutex
	eventSubscribers map[string][]chan core.Event
	subscriberMutex  sync.RWMutex
}

func NewSQLiteDataSource(databaseConnection *sql.DB) (*SQLiteDataSource, error) {
	tableQuery := `CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT);`
	if _, executionError := databaseConnection.Exec(tableQuery); executionError != nil {
		return nil, executionError
	}

	dataSource := &SQLiteDataSource{
		connection:       databaseConnection,
		memoryCache:      make(map[string]interface{}),
		eventSubscribers: make(map[string][]chan core.Event),
	}

	dataSource.initializeCacheFromRegistry()

	return dataSource, nil
}

func (dataSource *SQLiteDataSource) initializeCacheFromRegistry() {
	for registryKey, definition := range core.SystemRegistry {
		dataSource.memoryCache[registryKey] = definition.DefaultDataValue

		if definition.StorageType == core.NonVolatile {
			var jsonString string
			queryError := dataSource.connection.QueryRow("SELECT value FROM app_settings WHERE key = ?", registryKey).Scan(&jsonString)

			if queryError == nil {
				var parsedValue interface{}
				if unmarshalError := json.Unmarshal([]byte(jsonString), &parsedValue); unmarshalError == nil {
					dataSource.memoryCache[registryKey] = parsedValue
				}
			}
		}
	}
}

func (dataSource *SQLiteDataSource) Read(key string, destination interface{}) error {
	_, isRegistered := core.SystemRegistry[key]
	if !isRegistered {
		return errors.New("unregistered configuration key requested")
	}

	dataSource.cacheMutex.RLock()
	cachedValue := dataSource.memoryCache[key]
	dataSource.cacheMutex.RUnlock()

	jsonBytes, encodeError := json.Marshal(cachedValue)
	if encodeError != nil {
		return encodeError
	}

	decodeError := json.Unmarshal(jsonBytes, destination)
	return decodeError
}

func (dataSource *SQLiteDataSource) Write(key string, value interface{}) error {
	definition, isRegistered := core.SystemRegistry[key]
	if !isRegistered {
		return errors.New("unregistered configuration key provided")
	}

	dataSource.cacheMutex.Lock()
	dataSource.memoryCache[key] = value
	dataSource.cacheMutex.Unlock()

	if definition.StorageType == core.NonVolatile {
		jsonBytes, encodeError := json.Marshal(value)
		if encodeError != nil {
			return encodeError
		}

		insertQuery := `INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)`
		_, executionError := dataSource.connection.Exec(insertQuery, key, string(jsonBytes))
		return executionError
	}

	return nil
}

func (dataSource *SQLiteDataSource) Publish(topic string, payload interface{}) {
	dataSource.subscriberMutex.RLock()
	defer dataSource.subscriberMutex.RUnlock()

	subscriberChannels, topicExists := dataSource.eventSubscribers[topic]
	if topicExists {
		systemEvent := core.Event{
			Topic:   topic,
			Payload: payload,
		}
		for _, channel := range subscriberChannels {
			go pushEvent(channel, systemEvent)
		}
	}
}

func pushEvent(targetChannel chan core.Event, outgoingEvent core.Event) {
	targetChannel <- outgoingEvent
}

func (dataSource *SQLiteDataSource) Subscribe(topic string) <-chan core.Event {
	dataSource.subscriberMutex.Lock()
	defer dataSource.subscriberMutex.Unlock()

	newSubscriberChannel := make(chan core.Event, 100)
	dataSource.eventSubscribers[topic] = append(dataSource.eventSubscribers[topic], newSubscriberChannel)

	return newSubscriberChannel
}
