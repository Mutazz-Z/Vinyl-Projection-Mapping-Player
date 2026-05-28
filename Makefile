ifneq (,$(wildcard ./.env))
    include .env
    export
endif

BINARY_MACOS = builds/app/vinyl-orchestrator-macos-arm64
BINARY_RPI64 = builds/app/vinyl-orchestrator-linux-arm64
DATABASE     = builds/data/vinyl.db

.PHONY: \
	build_all \
	build-rpi64 \
	build-macos-arm64 \
	clean-binaries \
	clean-database \
	run-mac-stack \
	projection \
	build-flutter-web \
	hotfix_orchestrator \
	hotfix_frontend \
	hotfix_all


build_all: build-rpi64 build-macos-arm64

build-rpi64:
	cd orchestrator && CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -a -o ../$(BINARY_RPI64) .

build-macos-arm64:
	cd orchestrator && GOOS=darwin GOARCH=arm64 go build -o ../$(BINARY_MACOS) . 

clean-binaries:
	rm -f $(BINARY_MACOS) $(BINARY_RPI64)

clean-database:
	rm -f $(DATABASE)

run-mac-stack: build-macos-arm64
	@FLUTTER_BIN="$(FLUTTER_BIN)" bash scripts/run_mac_stack.sh

build-flutter-web:
	cd web_app && flutter build web --release

projection:
	@echo "Starting projector display server on http://localhost:8000 (serving projector_display)..."
	cd projector_display && python3 -m http.server 8000

hotfix_orchestrator: build-rpi64
	@echo "Stopping engine on Pi to release file lock..."
	sshpass -p '$(RASPBERRYPI_SSH_PASSWORD)' ssh vinyl@$(RASPBERRYPI_TARGET) "echo '$(RASPBERRYPI_SSH_PASSWORD)' | sudo -S systemctl stop vinyl-orchestrator.service"
	
	@echo "Uploading fresh arm64 binary payload..."
	sshpass -p '$(RASPBERRYPI_SSH_PASSWORD)' scp $(BINARY_RPI64) vinyl@$(RASPBERRYPI_TARGET):/opt/vinyl/bin/
	
	@echo "Starting engine back up..."
	sshpass -p '$(RASPBERRYPI_SSH_PASSWORD)' ssh vinyl@$(RASPBERRYPI_TARGET) "echo '$(RASPBERRYPI_SSH_PASSWORD)' | sudo -S systemctl start vinyl-orchestrator.service"
	
	@echo "Backend hotfix deployed to $(RASPBERRYPI_TARGET)"

hotfix_admin: build-flutter-web
	
	@echo "Streaming assets to Admin view (Port 80) via Tar-Pipe..."
	COPYFILE_DISABLE=1 tar -czf - -C web_app/build/web . | sshpass -p '$(RASPBERRYPI_SSH_PASSWORD)' ssh vinyl@$(RASPBERRYPI_TARGET) "tar -xzf - -C /opt/vinyl/www/flutter/"
	@echo "Admin panel updated!"

hotfix_projector:
	@echo "Streaming vanilla JS assets to Projector view (Port 8080)..."
	COPYFILE_DISABLE=1 tar -czf - -C projector_display . | sshpass -p '$(RASPBERRYPI_SSH_PASSWORD)' ssh vinyl@$(RASPBERRYPI_TARGET) "tar -xzf - -C /opt/vinyl/www/projector/"
	
	@echo "Flushing remote browser caches and rebooting Pi..."
	sshpass -p '$(RASPBERRYPI_SSH_PASSWORD)' ssh vinyl@$(RASPBERRYPI_TARGET) "echo '$(RASPBERRYPI_SSH_PASSWORD)' | sudo -S reboot"
	@echo "⚡ Projector display restored and Pi is rebooting!"

hotfix_frontend: hotfix_admin hotfix_projector
	@echo "All hotfixes deployed successfully!"