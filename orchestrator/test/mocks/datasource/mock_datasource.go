package mock_datasource

import (
	"vinyl-orchestrator/core"
)

type MockDataSource struct {
	subscribers map[string][]chan core.Event
	Storage     map[string]interface{}
}

func DataSourceMock() *MockDataSource {
	return &MockDataSource{
		subscribers: make(map[string][]chan core.Event),
		Storage:     make(map[string]interface{}),
	}
}

func (m *MockDataSource) Read(key string, dest interface{}) error {
	val, exists := m.Storage[key]
	if !exists {
		return nil
	}

	switch target := dest.(type) {
	case *string:
		if strVal, isString := val.(string); isString {
			*target = strVal
		}
	case *int:
		if intVal, isInt := val.(int); isInt {
			*target = intVal
		}
	case *bool:
		if boolVal, isBool := val.(bool); isBool {
			*target = boolVal
		}
	}

	return nil
}
func (m *MockDataSource) Write(key string, val interface{}) error {
	m.Storage[key] = val
	return nil
}

func (m *MockDataSource) Subscribe(topic string) <-chan core.Event {
	ch := make(chan core.Event, 1)
	m.subscribers[topic] = append(m.subscribers[topic], ch)
	return ch
}

func (m *MockDataSource) Publish(topic string, payload interface{}) {
	for _, ch := range m.subscribers[topic] {
		ch <- core.Event{Topic: topic, Payload: payload}
	}
}
