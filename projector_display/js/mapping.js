/*
 * mapping.js — Maptastic setup for the single #projection-group.
 *
 * Keys:
 * M   — toggle mapping mode (shows Maptastic corner handles)
 * 0   — reset all saved positions and reload
 *
 */

const LAYOUT_KEY = 'vinylProjectionLayout';
const LAYOUT_BACKUP_KEY = 'vinylProjectionLayoutBackup';
let saveDbTimeout = null;

function readJSON(key) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch (err) {
        console.warn(`mapping.js: failed to parse localStorage["${key}"]`, err);
        return null;
    }
}

function saveLayoutToDB(layoutStr) {
    clearTimeout(saveDbTimeout);
    saveDbTimeout = setTimeout(() => {
        const piIp = window.PI_IP || window.location.hostname || '127.0.0.1';
        fetch(`http://${piIp}:8100/api/config/ui`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 'mapping_projector_layout': layoutStr })
        }).catch(e => console.warn('Could not save layout to global DB', e));
    }, 800);
}

function saveLayout() {
    if (!maptastic || typeof maptastic.getLayout !== 'function') return;
    const layout = maptastic.getLayout();
    if (layout) {
        const data = JSON.stringify(layout);
        localStorage.setItem(LAYOUT_KEY, data);
        localStorage.setItem(LAYOUT_BACKUP_KEY, data);
        saveLayoutToDB(data);
    }
}

function restoreLayout() {
    if (!maptastic || typeof maptastic.setLayout !== 'function') return;

    const piIp = window.PI_IP || window.location.hostname || '127.0.0.1';

    fetch(`http://${piIp}:8100/api/config/ui`)
        .then(res => res.json())
        .then(data => {
            let layout = null;
            if (data['mapping_projector_layout']) {
                layout = JSON.parse(data['mapping_projector_layout']);
            } else {
                layout = readJSON(LAYOUT_KEY) || readJSON(LAYOUT_BACKUP_KEY);
            }

            if (layout) {
                maptastic.setLayout(layout);
                window.dispatchEvent(new Event('resize'));
            }
        })
        .catch(e => {
            const layout = readJSON(LAYOUT_KEY) || readJSON(LAYOUT_BACKUP_KEY);
            if (layout) maptastic.setLayout(layout);
        });
}

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();

    if (key === 'm') {
        document.body.classList.toggle('mapping-mode');
        const on = document.body.classList.contains('mapping-mode');
        console.log('Mapping mode:', on ? 'ON' : 'OFF');
        if (on) saveLayout();
        return;
    }

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
            const currentLayout = maptastic.getLayout();
            if (currentLayout && currentLayout.length > 0 && layoutData && layoutData.length > 0) {

                const newLayout = JSON.parse(JSON.stringify(currentLayout));
                newLayout[0].targetPoints = layoutData[0].targetPoints;
                maptastic.setLayout(newLayout);

            } else {
                maptastic.setLayout(layoutData);
            }

            window.dispatchEvent(new Event('resize'));
            saveLayout();
            console.log('Remote layout applied successfully.');
        } catch (err) {
            console.error("Failed to apply remote layout", err);
        }
    }
};