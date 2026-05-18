/*
 * mapping.js — Maptastic setup for the single #projection-group.
 *
 * Keys:
 *   M   — toggle mapping mode (shows Maptastic corner handles)
 *   0   — reset all saved positions and reload
 *
 */

const LAYOUT_KEY = 'vinylProjectionLayout';
const LAYOUT_BACKUP_KEY = 'vinylProjectionLayoutBackup';

function readJSON(key) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch (err) {
        console.warn(`mapping.js: failed to parse localStorage["${key}"]`, err);
        return null;
    }
}

function saveLayout() {
    if (!maptastic || typeof maptastic.getLayout !== 'function') return;
    const layout = maptastic.getLayout();
    if (layout) {
        const data = JSON.stringify(layout);
        localStorage.setItem(LAYOUT_KEY, data);
        localStorage.setItem(LAYOUT_BACKUP_KEY, data);
    }
}

function restoreLayout() {
    if (!maptastic || typeof maptastic.setLayout !== 'function') return;
    const layout = readJSON(LAYOUT_KEY) || readJSON(LAYOUT_BACKUP_KEY);
    if (layout) {
        try {
            maptastic.setLayout(layout);
        } catch (err) {
            console.warn('mapping.js: could not restore layout', err);
        }
    }
}

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();

    // M — toggle Maptastic corner handles / mapping mode
    if (key === 'm') {
        document.body.classList.toggle('mapping-mode');
        const on = document.body.classList.contains('mapping-mode');
        console.log('Mapping mode:', on ? 'ON' : 'OFF');
        return;
    }

    // 0 — reset all saved positions and reload
    if (key === '0') {
        localStorage.clear();
        location.reload();
    }
});

var maptastic = Maptastic('projection-group');

restoreLayout();

setInterval(() => {
    if (document.body.classList.contains('mapping-mode')) {
        saveLayout();
    }
}, 2000);

window.ProjectorMapping = {
    toggleMode: function () {
        document.body.classList.toggle('mapping-mode');
        const on = document.body.classList.contains('mapping-mode');
        console.log('Remote Mapping mode:', on ? 'ON' : 'OFF');
        if (on) saveLayout();
    },

    updateLayout: function (layoutData) {
        if (!maptastic || typeof maptastic.setLayout !== 'function') return;
        try {
            maptastic.setLayout(layoutData);

            window.dispatchEvent(new Event('resize'));

            saveLayout();
            console.log('Remote layout applied successfully.');
        } catch (err) {
            console.error("Failed to apply remote layout", err);
        }
    }
};