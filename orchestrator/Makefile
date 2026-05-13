BINARY = ../builds/vinyl-orchestrator
BINARY_RPI64 = ../builds/vinyl-orchestrator-linux-arm64
BINARY_RPI32 = ../builds/vinyl-orchestrator-linux-armv7

.PHONY: build_all clean build-rpi64 build-rpi32

build_all: build-rpi64 build-rpi32

build-rpi64:
	GOOS=linux GOARCH=arm64 go build -o $(BINARY_RPI64) .

build-rpi32:
	GOOS=linux GOARCH=arm GOARM=7 go build -o $(BINARY_RPI32) .

clean:
	rm -f $(BINARY) $(BINARY_RPI64) $(BINARY_RPI32)