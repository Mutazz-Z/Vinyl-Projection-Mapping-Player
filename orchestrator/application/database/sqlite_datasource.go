package database

import (
	"database/sql"
	"encoding/json"
	"errors"
	"reflect"
	"sync"

	"vinyl-orchestrator/core"

	_ "github.com/glebarez/go-sqlite"
)

type SQLiteDataSource struct {
	connection *sql.DB
	memoryCache      map[core.StateKey_t]interface{}
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
		memoryCache:      make(map[core.StateKey_t]interface{}),
		eventSubscribers: make(map[string][]chan Event),
	}

	dataSource.initializeCacheFromRegistry()

	return dataSource, nil
}

func (dataSource *SQLiteDataSource) initializeCacheFromRegistry() {
	for registryKey, metadata := range core.StateRegistry {
		keyStr := string(registryKey)

		dataSource.memoryCache[registryKey] = metadata.DefaultData

		if metadata.StorageType == core.NonVolatile {
			var jsonString string
			queryError := dataSource.connection.QueryRow(
				"SELECT value FROM app_settings WHERE key = ?", keyStr,
			).Scan(&jsonString)

			if queryError == nil {
				parsedValue := reflect.New(reflect.TypeOf(metadata.DefaultData)).Interface()

				if unmarshalError := json.Unmarshal([]byte(jsonString), parsedValue); unmarshalError == nil {
					dataSource.memoryCache[registryKey] = reflect.ValueOf(parsedValue).Elem().Interface()
				}
			}
		}
	}
}

func (dataSource *SQLiteDataSource) Read(key core.StateKey_t, destination interface{}) error {
	_, isRegistered := core.StateRegistry[key]
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

func (dataSource *SQLiteDataSource) Write(key core.StateKey_t, value interface{}) error {
	definition, isRegistered := core.StateRegistry[key]
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
		if _, executionError := dataSource.connection.Exec(insertQuery, string(key), string(jsonBytes)); executionError != nil {
			return executionError
		}
	}

	go dataSource.Publish("datasource", core.OnDataSourceChangedArgs_t{
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

type DataSource interface {
	Read(key core.StateKey_t, destination interface{}) error
	Write(key core.StateKey_t, value interface{}) error
	Publish(topic string, payload interface{})
	Subscribe(topic string) <-chan Event
}
