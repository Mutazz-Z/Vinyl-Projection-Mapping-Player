// esbuild bundler script
// Bundles all TypeScript entry points as browser-compatible IIFE scripts.
// Each file is self-contained: imports from other project files are inlined.
// Run: node build.js           (single build)
// Run: node build.js --watch   (watch mode)

const esbuild = require('esbuild');

const entryPoints = [
    'js/track_resolver.ts',
    'js/mapping.ts',
    'js/playback_clock.ts',
    'js/datasource.ts',
    'js/websocket_router.ts',
    'widgets/tracklist/tracklist_app.ts',
    'widgets/tracklist/tracklist_playback.ts',
    'widgets/visualizer/visualizer_app.ts',
    'widgets/visualizer/visualizer_playback.ts',
    'widgets/overlay/overlay_app.ts',
    'widgets/overlay/overlay_playback.ts',
    'widgets/loading/loading_app.ts',
    'widgets/loading/loading_playback.ts',
    'widgets/lyrics/lyrics_app.ts',
    'widgets/lyrics/lyrics_playback.ts',
    'widgets/record/record_app.ts',
    'widgets/record/record_playback.ts',
    'widgets/info/info_app.ts',
    'widgets/info/info_playback.ts',
    'widgets/progress/progress_app.ts',
    'widgets/progress/progress_playback.ts',
    'widgets/context_message/context_message_app.ts',
    'widgets/context_message/context_message_playback.ts',
    'widgets/qrcode/qrcode_app.ts',
    'widgets/qrcode/qrcode_playback.ts',
];

const buildOptions = {
    entryPoints,
    bundle: true,
    format: 'iife',
    outdir: 'build',
    platform: 'browser',
    target: 'es2020',
};

const isWatch = process.argv.includes('--watch');

if (isWatch) {
    esbuild.context(buildOptions).then(ctx => {
        ctx.watch();
        console.log('esbuild: watching for changes...');
    }).catch(() => process.exit(1));
} else {
    esbuild.build(buildOptions).then(() => {
        console.log('esbuild: build complete');
    }).catch(() => process.exit(1));
}
