import { Global_CurrentMaptasticProjectorPositions } from "../types/state";

const LAYOUT_LOCALSTORAGE_KEY = 'vinylProjectionLayout';
const LAYOUT_LOCALSTORAGE_BACKUP_KEY = 'vinylProjectionLayoutBackup';

let saveToDbTimer: ReturnType<typeof setTimeout> | null = null;

function readLocalStorageJson(key: string): unknown {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        console.warn(`mapping.js: failed to parse localStorage["${key}"]`, error);
        return null;
    }
}

function saveLayout(): void {
    if (!maptastic || typeof maptastic.getLayout !== 'function') return;

    const layout = maptastic.getLayout();
    if (!layout) return;

    const layoutJson = JSON.stringify(layout);
    localStorage.setItem(LAYOUT_LOCALSTORAGE_KEY, layoutJson);
    localStorage.setItem(LAYOUT_LOCALSTORAGE_BACKUP_KEY, layoutJson);

    if (saveToDbTimer) {
        clearTimeout(saveToDbTimer);
    }

    saveToDbTimer = setTimeout(function () {
        if (window.AppDataSource) {
            window.AppDataSource.write(Global_CurrentMaptasticProjectorPositions, layoutJson);
        }
    }, 800);
}

async function restoreLayout(): Promise<void> {
    if (!maptastic || typeof maptastic.setLayout !== 'function') return;

    let layout: unknown = null;

    try {
        if (window.AppDataSource) {
            const storedValue = await window.AppDataSource.read(Global_CurrentMaptasticProjectorPositions);
            if (storedValue) {
                layout = typeof storedValue === 'string' ? JSON.parse(storedValue) : storedValue;
            }
        }
    } catch (error) {
        console.warn('mapping.js: could not read layout from DataSource, falling back to localStorage', error);
    }

    if (!layout) {
        layout = readLocalStorageJson(LAYOUT_LOCALSTORAGE_KEY)
            || readLocalStorageJson(LAYOUT_LOCALSTORAGE_BACKUP_KEY);
    }

    if (layout) {
        maptastic.setLayout(layout);
        window.dispatchEvent(new Event('resize'));
    }
}

window.addEventListener('keydown', function (event: KeyboardEvent) {
    const key = event.key.toLowerCase();

    if (key === 'm') {
        document.body.classList.toggle('mapping-mode');
        const mappingModeActive = document.body.classList.contains('mapping-mode');
        console.log('Mapping mode:', mappingModeActive ? 'ON' : 'OFF');
        if (mappingModeActive) saveLayout();
        return;
    }

    if (key === '0') {
        localStorage.clear();
        location.reload();
    }
});

const maptastic = Maptastic('projection-group');

(function waitForDataSourceAndRestore() {
    if (window.AppDataSource) {
        void restoreLayout();
    } else {
        setTimeout(waitForDataSourceAndRestore, 100);
    }
})();

setInterval(function () {
    if (document.body.classList.contains('mapping-mode')) {
        saveLayout();
    }
}, 2000);

window.ProjectorMapping = {
    toggleMode: function (): void {
        document.body.classList.toggle('mapping-mode');
        const mappingModeActive = document.body.classList.contains('mapping-mode');
        console.log('Remote mapping mode:', mappingModeActive ? 'ON' : 'OFF');
        if (mappingModeActive) saveLayout();
    },

    updateLayout: function (layoutData: any): void {
        if (!maptastic || typeof maptastic.setLayout !== 'function') return;
        try {
            const currentLayout = maptastic.getLayout();
            if (currentLayout && currentLayout.length > 0 && layoutData && layoutData.length > 0) {
                const updatedLayout = JSON.parse(JSON.stringify(currentLayout));
                updatedLayout[0].targetPoints = layoutData[0].targetPoints;
                maptastic.setLayout(updatedLayout);
            } else {
                maptastic.setLayout(layoutData);
            }

            window.dispatchEvent(new Event('resize'));
            saveLayout();
            console.log('Remote layout applied successfully.');
        } catch (error) {
            console.error('Failed to apply remote layout:', error);
        }
    },
};
