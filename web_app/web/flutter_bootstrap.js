{{flutter_js}}
{{flutter_build_config}}

_flutter.loader.load({
  // HTTP on local LAN is not a secure context; avoid service worker warning noise.
  serviceWorkerSettings: null,
});
