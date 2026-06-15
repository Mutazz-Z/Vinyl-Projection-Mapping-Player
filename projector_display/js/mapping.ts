import { Global_CurrentMaptasticProjectorPositions, MaptasticProjectorPositions_t } from "../types/state";

type MaptasticController = {
    getLayout: () => any;
    setLayout: (layout: any) => void;
};

declare const Maptastic: (targetSelector: string) => MaptasticController;
const LAYOUT_LOCALSTORAGE_KEY = 'vinylProjectionLayout';
const LAYOUT_LOCALSTORAGE_BACKUP_KEY = 'vinylProjectionLayoutBackup';

type ProjectorMappingLayout = unknown;

export class ProjectorMapping_t {
    private maptastic: MaptasticController;
    private saveToDatabaseTimeout: ReturnType<typeof setTimeout> | null = null;

    constructor() {
        this.maptastic = Maptastic('projection-group');
        this.installKeyboardListeners();
        this.startPeriodicSave();
        void this.waitForDataSourceAndRestoreLayout();
    }

    private readLocalStorageJson(storageKey: string): unknown {
        try {
            const rawValue = localStorage.getItem(storageKey);
            return rawValue ? JSON.parse(rawValue) : null;
        } catch (error) {
            console.warn(`mapping.js: failed to parse localStorage["${storageKey}"]`, error);
            return null;
        }
    }

    private saveLayout(): void {
        if (!this.maptastic || typeof this.maptastic.getLayout !== 'function') return;

        const currentLayout = this.maptastic.getLayout();
        if (!currentLayout) return;

        const layoutJson = JSON.stringify(currentLayout);
        localStorage.setItem(LAYOUT_LOCALSTORAGE_KEY, layoutJson);
        localStorage.setItem(LAYOUT_LOCALSTORAGE_BACKUP_KEY, layoutJson);

        if (this.saveToDatabaseTimeout) {
            clearTimeout(this.saveToDatabaseTimeout);
        }

        this.saveToDatabaseTimeout = setTimeout(() => {
            if (window.AppDataSource) {
                window.AppDataSource.write(
                    Global_CurrentMaptasticProjectorPositions,
                    new MaptasticProjectorPositions_t({ layoutJson }),
                );
            }
        }, 800);
    }

    private async restoreLayout(): Promise<void> {
        if (!this.maptastic || typeof this.maptastic.setLayout !== 'function') return;

        let restoredLayout: ProjectorMappingLayout = null;

        try {
            if (window.AppDataSource) {
                const storedValue = await window.AppDataSource.read(Global_CurrentMaptasticProjectorPositions);
                if (storedValue) {
                    restoredLayout = storedValue.layoutJson ? JSON.parse(storedValue.layoutJson) : null;
                }
            }
        } catch (error) {
            console.warn('mapping.js: could not read layout from DataSource, falling back to localStorage', error);
        }

        if (!restoredLayout) {
            restoredLayout = this.readLocalStorageJson(LAYOUT_LOCALSTORAGE_KEY)
                || this.readLocalStorageJson(LAYOUT_LOCALSTORAGE_BACKUP_KEY);
        }

        if (restoredLayout) {
            this.maptastic.setLayout(restoredLayout);
            window.dispatchEvent(new Event('resize'));
        }
    }

    private installKeyboardListeners(): void {
        window.addEventListener('keydown', (event: KeyboardEvent) => {
            const key = event.key.toLowerCase();

            if (key === 'm') {
                this.toggleMode();
                return;
            }

            if (key === '0') {
                localStorage.clear();
                location.reload();
            }
        });
    }

    private startPeriodicSave(): void {
        setInterval(() => {
            if (document.body.classList.contains('mapping-mode')) {
                this.saveLayout();
            }
        }, 2000);
    }

    private async waitForDataSourceAndRestoreLayout(): Promise<void> {
        if (window.AppDataSource) {
            await this.restoreLayout();
            return;
        }

        setTimeout(() => {
            void this.waitForDataSourceAndRestoreLayout();
        }, 100);
    }

    public toggleMode(): void {
        document.body.classList.toggle('mapping-mode');
        const mappingModeActive = document.body.classList.contains('mapping-mode');
        console.log('Remote mapping mode:', mappingModeActive ? 'ON' : 'OFF');
        if (mappingModeActive) this.saveLayout();
    }

    public updateLayout(layoutData: any): void {
        if (!this.maptastic || typeof this.maptastic.setLayout !== 'function') return;

        try {
            const currentLayout = this.maptastic.getLayout();
            if (currentLayout && currentLayout.length > 0 && layoutData && layoutData.length > 0) {
                const updatedLayout = JSON.parse(JSON.stringify(currentLayout));
                updatedLayout[0].targetPoints = layoutData[0].targetPoints;
                this.maptastic.setLayout(updatedLayout);
            } else {
                this.maptastic.setLayout(layoutData);
            }

            window.dispatchEvent(new Event('resize'));
            this.saveLayout();
            console.log('Remote layout applied successfully.');
        } catch (error) {
            console.error('Failed to apply remote layout:', error);
        }
    }
}

export const ProjectorMapping = new ProjectorMapping_t();
