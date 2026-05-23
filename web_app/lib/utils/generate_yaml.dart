import 'dart:convert';
import 'dart:js_interop';
import 'package:web/web.dart' as web;

void generateAndDownloadEspReaderYaml(String hostIp) {
  final String yamlContent =
      '''
substitutions:
  name: vinylreader
  friendly_name: VinylReader
  mqtt_broker: $hostIp

esphome:
  name: \${name}
  name_add_mac_suffix: true
  project:
    name: adonno.tag_reader
    version: mqtt-standalone

api:
  reboot_timeout: 0s

esp8266:
  board: d1_mini

mqtt:
  broker: \${mqtt_broker}
  topic_prefix: vinyl/shelf
  discovery: false
  on_connect:
    then:
      - logger.log: "Successfully connected to MQTT!"
  on_message:
    - topic: vinyl/shelf/command/restart
      then:
        - button.press: restart_button
    - topic: vinyl/shelf/command/ping
      then:
        - logger.log: "🔔 Ping received from Go backend! Sending Pong..."
        - mqtt.publish:
            topic: "vinyl/shelf/pong"
            payload: "pong"

wifi:
  networks:
    - ssid: "ssid_name_here"
      password: "password_here"
  ap:
    ssid: \${name}

captive_portal:

ota:
  - platform: esphome

logger:
  level: DEBUG

i2c:
  scan: False
  frequency: 400kHz

button:
  - platform: restart
    id: restart_button
    name: "\${friendly_name} Restart"

pn532_i2c:
  id: pn532_board
  on_tag:
    then:
      - mqtt.publish_json:
          topic: "vinyl/shelf/tag"
          payload: |-
            root["uid"] = x;

  on_tag_removed:
    then:
      - mqtt.publish:
          topic: "vinyl/shelf/status"
          payload: "removed"
''';

  final bytes = utf8.encode(yamlContent);
  final blob = web.Blob([bytes.toJS].toJS);
  final url = web.URL.createObjectURL(blob);

  final anchor = web.HTMLAnchorElement()
    ..href = url
    ..download = "espreader.yaml";

  web.document.body?.appendChild(anchor);
  anchor.click();
  anchor.remove();

  web.URL.revokeObjectURL(url);
}
