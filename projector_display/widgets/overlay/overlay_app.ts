import { OverlayData_t } from "../../types/state";

type OverlayStatusType = 'play' | 'pause';

interface OverlayWidgetPrivateState {
    statusTimer: ReturnType<typeof setTimeout> | null;
}

export class OverlayWidget_t {
    private _private: OverlayWidgetPrivateState;

    constructor() {
        this._private = {
            statusTimer: null,
        };
    }

    private getOverlayContainer(): HTMLElement {
        return document.getElementById('fx-video-container') as HTMLElement;
    }

    private setActive(active: boolean): void {
        const overlayContainer = this.getOverlayContainer();
        overlayContainer.classList.toggle('active', Boolean(active));
    }

    private setOverlayArt(url: string): void {
        const overlayContainer = this.getOverlayContainer();

        if (url) {
            const safeOverlayUrl = String(url).replace(/"/g, '\\"');
            overlayContainer.style.backgroundImage = 'url("' + safeOverlayUrl + '")';
            overlayContainer.style.backgroundSize = 'cover';
            overlayContainer.style.backgroundPosition = 'center center';
            overlayContainer.style.backgroundRepeat = 'no-repeat';
        } else {
            overlayContainer.style.backgroundImage = 'none';
        }
    }

    private showStatusIcon(type: OverlayStatusType): void {
        const iconElement = document.getElementById('status-icon-overlay') as HTMLElement;
        const overlayContainer = this.getOverlayContainer();

        if (overlayContainer) {
            overlayContainer.classList.toggle('paused', type === 'pause');
        }

        if (this._private.statusTimer) {
            clearTimeout(this._private.statusTimer);
            this._private.statusTimer = null;
        }

        let imgPath = '';
        if (type === 'play') imgPath = 'widgets/assets/play_overlay.png';
        else if (type === 'pause') imgPath = 'widgets/assets/pause_overlay.png';

        if (!imgPath) {
            iconElement.classList.remove('visible');
            return;
        }

        iconElement.style.backgroundImage = 'url("' + imgPath + '")';
        void iconElement.offsetWidth;
        iconElement.classList.add('visible');

        if (type !== 'pause') {
            this._private.statusTimer = setTimeout(function () {
                iconElement.classList.remove('visible');
            }, 2000);
        }
    }

    public updateData(overlayData: OverlayData_t): void {
        this.setOverlayArt(overlayData.overlayImage);
    }

    public show(): void {
        this.setActive(true);
    }

    public hide(): void {
        this.setActive(false);
    }

    public play(): void {
        this.show();
        this.showStatusIcon('play');
    }

    public pause(): void {
        this.show();
        this.showStatusIcon('pause');
    }
}

export const OverlayWidget = new OverlayWidget_t();
