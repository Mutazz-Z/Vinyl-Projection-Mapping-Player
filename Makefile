BINARY_MACOS = builds/vinyl-orchestrator-macos-arm64
BINARY_RPI64 = builds/vinyl-orchestrator-linux-arm64
DATABASE     = builds/vinyl.database

.PHONY: \
	build_all \
	build-rpi64 \
	build-macos-arm64 \
	clean-binaries \
	clean-database \
	run-mac-stack \
	projection

build_all: build-rpi64 build-macos-arm64

build-rpi64:
	cd orchestrator && GOOS=linux GOARCH=arm64 go build -o ../$(BINARY_RPI64) .

build-macos-arm64:
	cd orchestrator && GOOS=darwin GOARCH=arm64 go build -o ../$(BINARY_MACOS) . 

clean-binaries:
	rm -f $(BINARY_MACOS) $(BINARY_RPI64)

clean-database:
	rm -f $(DATABASE)

run-mac-stack: build-macos-arm64
	@FLUTTER_BIN="$(FLUTTER_BIN)" bash scripts/run_mac_stack.sh

projection:
	@echo "Starting projector display server on http://localhost:8000 (serving projector_display)..."
	cd projector_display && python3 -m http.server 8000