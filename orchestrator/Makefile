BINARY_MACOS = ../builds/vinyl-orchestrator-macos-arm64
BINARY_RPI64 = ../builds/vinyl-orchestrator-linux-arm64
DATABASE = ../builds/vinyl.database

.PHONY: \
    build_all \
    build-rpi64 \
    build-macos-arm64 \
    clean-binaries \
	clean-database

build_all: build-rpi64 build-macos-arm64

build-rpi64:
	GOOS=linux GOARCH=arm64 go build -o $(BINARY_RPI64) .

build-macos-arm64:
	GOOS=darwin GOARCH=arm64 go build -o $(BINARY_MACOS) .

clean-binaries:
	rm -f $(BINARY_MACOS) $(BINARY_RPI64)

clean-database:
	rm -f $(DATABASE)