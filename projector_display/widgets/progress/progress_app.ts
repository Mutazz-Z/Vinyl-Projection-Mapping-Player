import { ProgressData_t } from "../../types/state";

interface ProgressWidgetPrivateState_t {
    lastProgressSeconds: number;
    lastDurationSeconds: number;
}

export class ProgressWidget_t {
    private _private: ProgressWidgetPrivateState_t;

    constructor() {
        this._private = {
            lastProgressSeconds: 0,
            lastDurationSeconds: 0,
        };
    }

    private getContainer(): Element {
        return document.querySelector('#progress-widget .progress-container') as Element;
    }

    public show(): void {
        const containerElement = this.getContainer();
        containerElement.classList.add('visible');

        this.renderFromValues(this._private.lastProgressSeconds, this._private.lastDurationSeconds);
    }

    public hide(): void {
        const containerElement = this.getContainer();
        containerElement.classList.remove('visible');

        this.reset();
    }

    private formatTimeInMinutesAndSeconds(seconds: number): string {
        if (isNaN(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const secondsPart = Math.floor(seconds % 60).toString().padStart(2, '0');
        return minutes + ':' + secondsPart;
    }

    private reset(): void {
        this._private.lastProgressSeconds = 0;
        this._private.lastDurationSeconds = 0;
        this.renderFromValues(0, 0);
    }

    private renderFromValues(progressSeconds: number, durationSeconds: number): void {
        const boundedDuration = Number(durationSeconds || 0);
        const boundedProgress = Number(progressSeconds || 0);
        if (!durationSeconds || durationSeconds <= 0) return;

        const progressPercentage = (boundedProgress / boundedDuration) * 100;
        const progressBarElement = document.getElementById('progress-bar');
        if (progressBarElement) progressBarElement.style.width = progressPercentage + '%';

        const currentTimeElement = document.getElementById('current-time');
        const totalTimeElement = document.getElementById('total-time');
        if (currentTimeElement) currentTimeElement.textContent = this.formatTimeInMinutesAndSeconds(boundedProgress);
        if (totalTimeElement) totalTimeElement.textContent = this.formatTimeInMinutesAndSeconds(boundedDuration);
    }

    public updateData(progressData: ProgressData_t): void {
        this._private.lastProgressSeconds = Number(progressData.currentDurationInTrack || 0);
        this._private.lastDurationSeconds = Number(progressData.totalDurationInTrack || 0);
        this.renderFromValues(this._private.lastProgressSeconds, this._private.lastDurationSeconds);
    }
}

export const ProgressWidget = new ProgressWidget_t();
