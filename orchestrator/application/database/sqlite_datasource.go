package database

import (
	"database/sql"
	"encoding/json"
	"errors"
	"sync"

	_ "github.com/glebarez/go-sqlite"
	"vinyl-orchestrator/core"
)

type SQLiteDataSource struct {
	connection       *sql.DB
	memoryCache      map[string]interface{}
	cacheMutex       sync.RWMutex
	eventSubscribers map[string][]chan Event
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
		eventSubscribers: make(map[string][]chan Event),
	}

	dataSource.initializeCacheFromRegistry()

	return dataSource, nil
}

func (dataSource *SQLiteDataSource) initializeCacheFromRegistry() {
	for registryKey, definition := range core.SystemRegistry {
		dataSource.memoryCache[registryKey] = definition.DefaultDataValue

		if definition.StorageType == core.NonVolatile {
			var jsonString string
			queryError := dataSource.connection.QueryRow(
				"SELECT value FROM app_settings WHERE key = ?", registryKey,
			).Scan(&jsonString)

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

	return json.Unmarshal(jsonBytes, destination)
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
		if _, executionError := dataSource.connection.Exec(insertQuery, key, string(jsonBytes)); executionError != nil {
			return executionError
		}
	}

	go dataSource.Publish("datasource", DataSourceChangedArgs{
		Variable: key,
		Data:     value,
	})

	return nil
}

func (dataSource *SQLiteDataSource) Publish(topic string, payload interface{}) {
	dataSource.subscriberMutex.RLock()
	defer dataSource.subscriberMutex.RUnlock()

	subscriberChannels, topicExists := dataSource.eventSubscribers[topic]
	if !topicExists {
		return
	}

	systemEvent := Event{
		Topic:   topic,
		Payload: payload,
	}
	for _, channel := range subscriberChannels {
		go pushEvent(channel, systemEvent)
	}
}

func pushEvent(targetChannel chan Event, outgoingEvent Event) {
	targetChannel <- outgoingEvent
}

func (dataSource *SQLiteDataSource) Subscribe(topic string) <-chan Event {
	dataSource.subscriberMutex.Lock()
	defer dataSource.subscriberMutex.Unlock()

	newSubscriberChannel := make(chan Event, 100)
	dataSource.eventSubscribers[topic] = append(dataSource.eventSubscribers[topic], newSubscriberChannel)

	return newSubscriberChannel
}

type Event struct {
	Topic   string
	Payload interface{}
}

type DataSourceChangedArgs struct {
	Variable string      `json:"variable"`
	Data     interface{} `json:"data"`
}

type DataSource interface {
	Read(key string, destination interface{}) error
	Write(key string, value interface{}) error
	Publish(topic string, payload interface{})
	Subscribe(topic string) <-chan Event
}
