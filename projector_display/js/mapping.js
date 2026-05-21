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

function saveLayout() {
    if (!maptastic || typeof maptastic.getLayout !== 'function') return;
    const layout = maptastic.getLayout();
    if (!layout) return;

    const data = JSON.stringify(layout);
    localStorage.setItem(LAYOUT_KEY, data);
    localStorage.setItem(LAYOUT_BACKUP_KEY, data);

    clearTimeout(saveDbTimeout);
    saveDbTimeout = setTimeout(() => {
        if (window.dataSource) {
            window.dataSource.write('GLOBAL_CurrentMaptasticProjectorPositions', data);
        }
    }, 800);
}

async function restoreLayout() {
    if (!maptastic || typeof maptastic.setLayout !== 'function') return;

    let layout = null;

    try {
        if (window.dataSource) {
            const stored = await window.dataSource.read('GLOBAL_CurrentMaptasticProjectorPositions');
            if (stored) {
                layout = typeof stored === 'string' ? JSON.parse(stored) : stored;
            }
        }
    } catch (e) {
        console.warn('mapping.js: could not read layout from DataSource, falling back to localStorage', e);
    }

    if (!layout) {
        layout = readJSON(LAYOUT_KEY) || readJSON(LAYOUT_BACKUP_KEY);
    }

    if (layout) {
        maptastic.setLayout(layout);
        window.dispatchEvent(new Event('resize'));
    }
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

(function waitForDsAndRestore() {
    if (window.dataSource) {
        restoreLayout();
    } else {
        setTimeout(waitForDsAndRestore, 100);
    }
})();

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
            console.error('Failed to apply remote layout', err);
        }
    }
};