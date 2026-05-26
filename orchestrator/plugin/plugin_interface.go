package pluginInterface

import (
	"context"
	"vinyl-orchestrator/application/database"
)

type Plugin interface {
	Name() string
	Init(dataSource database.DataSource, AlbumLibrary database.AlbumLibrary) error
	StartPlugin(context context.Context) error
	StopPlugin(context context.Context) error
}
