import { RecordDesignData_t } from "../../types/state";

export class RecordWidget_t {
    private readonly RECORD_SLIDE_MS = 700;
    private currentDesignData: RecordDesignData_t = RecordDesignData_t.fromJson({});
    private hideCleanupTimer: ReturnType<typeof setTimeout> | null = null;

    private getRecord(): HTMLElement {
        return document.getElementById('record') as HTMLElement;
    }

    private getRecordContainer(): HTMLElement {
        const record = this.getRecord();
        return record.closest('.record-container') as HTMLElement;
    }

    private setSpinState(state: 'running' | 'paused'): void {
        const record = this.getRecord();
        if (record) record.style.animationPlayState = state;
    }

    private applyLayerStyle(targetElement: HTMLElement, value: string, isImage: boolean, fallbackColor?: string): void {
        if (isImage) {
            const safeUrl = String(value).replace(/"/g, '\\"');
            targetElement.style.backgroundImage = 'url("' + safeUrl + '")';
            targetElement.style.removeProperty('background-color');
        } else {
            targetElement.style.backgroundImage = 'none';
            if (value) {
                targetElement.style.backgroundColor = value;
            } else if (fallbackColor) {
                targetElement.style.backgroundColor = fallbackColor;
            } else {
                targetElement.style.removeProperty('background-color');
            }
        }
    }

    private applyDesignData(designData: RecordDesignData_t): void {
        const labelDesign = designData.labelDesign;
        const ringDesign = designData.ringDesign;

        const label = labelDesign.usesImage ? labelDesign.labelImage : labelDesign.labelColor;
        const ring = ringDesign.usesImage ? ringDesign.ringImage : ringDesign.ringColor;

        const record = this.getRecord();
        this.applyLayerStyle(record, ring, ringDesign.usesImage, '#ffffff');

        const recordLabel = document.querySelector('.record-label') as HTMLElement;
        this.applyLayerStyle(recordLabel, label, labelDesign.usesImage, '#2a2a2a');

    }

    private applyDesignToWidgets(designData: RecordDesignData_t): void {
        if (!designData.readyForDisplay) return;

        this.currentDesignData = designData;
        this.applyDesignData(designData);
    }

    public updateData(recordDesignData: RecordDesignData_t): void {
        this.applyDesignToWidgets(recordDesignData);
    }

    public show(): void {
        const recordContainer = this.getRecordContainer();
        if (!recordContainer) return;

        if (this.hideCleanupTimer) {
            clearTimeout(this.hideCleanupTimer);
            this.hideCleanupTimer = null;
        }

        recordContainer.style.display = '';
        void recordContainer.offsetWidth;
        recordContainer.classList.add('visible');
    }

    public hide(): void {
        const recordContainer = this.getRecordContainer();

        if (this.hideCleanupTimer) {
            clearTimeout(this.hideCleanupTimer);
            this.hideCleanupTimer = null;
        }

        const widgetSlot = recordContainer.parentElement as HTMLElement | null;
        if (widgetSlot) {
            widgetSlot.style.removeProperty('overflow');
            widgetSlot.style.removeProperty('clip-path');
        }

        recordContainer.classList.remove('error-eject');
        recordContainer.classList.remove('visible');

        this.hideCleanupTimer = setTimeout(() => {
            if (!recordContainer.classList.contains('visible') && !recordContainer.classList.contains('error-eject')) {
                recordContainer.style.display = 'none';
            }
            this.hideCleanupTimer = null;
        }, this.RECORD_SLIDE_MS);
    }

    public play(): void {
        this.setSpinState('running');
    }

    public pause(): void {
        this.setSpinState('paused');
    }

    public ejectRecord(): void {
        const recordContainer = this.getRecordContainer();
        if (!recordContainer) return;

        this.applyDesignData(this.currentDesignData);

        const widgetSlot = recordContainer.parentElement as HTMLElement | null;
        if (widgetSlot) {
            widgetSlot.style.overflow = 'visible';
            widgetSlot.style.clipPath = 'inset(-100px -1000px -100px 0)';
        }

        recordContainer.style.display = 'block';
        void recordContainer.offsetWidth;
        recordContainer.classList.add('error-eject');
    }
}

export const RecordWidget = new RecordWidget_t();
