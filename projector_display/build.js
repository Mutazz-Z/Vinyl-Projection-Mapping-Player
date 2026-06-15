// esbuild bundler script
// Bundles all TypeScript entry points as browser-compatible IIFE scripts.
// Each file is self-contained: imports from other project files are inlined.
// Run: node build.js           (single build)
// Run: node build.js --watch   (watch mode)

const esbuild = require('esbuild');

const entryPoints = [
    'js/websocket_router.ts',
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
