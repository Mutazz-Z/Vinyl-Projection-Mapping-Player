interface LoadingWidgetPrivateState {
    loadingTransitionToken: number;
    scheduledWaitTimer: ReturnType<typeof setTimeout> | null;
}

const LOADING_SCALE = 0.33;
const HIDE_HOLD_MILLISECONDS = 1000;

export class LoadingWidget_t {
    private _private: LoadingWidgetPrivateState;

    constructor() {
        this._private = {
            loadingTransitionToken: 0,
            scheduledWaitTimer: null,
        };

        this.idle();
    }

    private getOutline(): HTMLElement {
        return document.getElementById('loading-outline') as HTMLElement;
    }

    private waitForTransition(element: HTMLElement, propertyName?: string, timeoutInMilliseconds = 700): Promise<void> {
        return new Promise((resolve) => {
            let isComplete = false;

            const finishTransition = () => {
                if (isComplete) return;
                isComplete = true;
                element.removeEventListener('transitionend', onTransitionEnd);
                resolve();
            };

            const onTransitionEnd = (event: TransitionEvent) => {
                if (propertyName && event.propertyName !== propertyName) return;
                finishTransition();
            };

            element.addEventListener('transitionend', onTransitionEnd);
            setTimeout(finishTransition, timeoutInMilliseconds);
        });
    }

    private freezeCurrentVisualState(outline: HTMLElement): void {
        const computedStyles = window.getComputedStyle(outline);
        const currentTransform = computedStyles.transform;
        const currentOpacity = computedStyles.opacity;
        const currentBackgroundColor = computedStyles.backgroundColor;
        const currentBorderColor = computedStyles.borderColor;

        outline.style.transition = 'none';

        if (currentTransform && currentTransform !== 'none') {
            outline.style.transform = currentTransform;
        }
        outline.style.opacity = currentOpacity;
        outline.style.backgroundColor = currentBackgroundColor;
        outline.style.borderColor = currentBorderColor;

        void outline.offsetWidth;
        outline.style.transition = '';
    }

    private clearInlineOverrides(outline: HTMLElement): void {
        outline.style.backgroundColor = '';
        outline.style.borderColor = '';
    }

    private show(): void {
        const outline = this.getOutline();

        this.freezeCurrentVisualState(outline);
        outline.classList.remove('hidden', 'pulsing', 'error', 'error-fill');

        void outline.offsetWidth;

        requestAnimationFrame(() => {
            outline.style.opacity = '1';
            outline.style.transform = 'translate(-50%, -50%) scale(1.25)';
            this.clearInlineOverrides(outline);
        });
    }

    private beginScanLoading(sequenceToken: number): Promise<void> {
        const outline = this.getOutline();

        this.freezeCurrentVisualState(outline);
        outline.classList.remove('hidden', 'pulsing', 'error', 'error-fill');

        void outline.offsetWidth;

        requestAnimationFrame(() => {
            outline.style.opacity = '1';
            outline.style.transform = `translate(-50%, -50%) scale(${LOADING_SCALE})`;
            this.clearInlineOverrides(outline);
        });

        return this.waitForTransition(outline, 'transform', 560).then(() => {
            if (sequenceToken !== this._private.loadingTransitionToken) return;
            outline.classList.add('pulsing');
        });
    }

    private fadeOut(sequenceToken: number): Promise<void> {
        const outline = this.getOutline();

        this.freezeCurrentVisualState(outline);
        outline.classList.remove('pulsing', 'hidden', 'error', 'error-fill');

        void outline.offsetWidth;

        requestAnimationFrame(() => {
            outline.style.opacity = '0';
            this.clearInlineOverrides(outline);
        });

        return this.waitForTransition(outline, 'opacity', 420).then(() => {
            if (sequenceToken !== this._private.loadingTransitionToken) return;
            outline.classList.add('hidden');
        });
    }

    private waitDuration(durationInMilliseconds: number): Promise<void> {
        return new Promise((resolve) => {
            this._private.scheduledWaitTimer = setTimeout(() => {
                this._private.scheduledWaitTimer = null;
                resolve();
            }, durationInMilliseconds);
        });
    }

    private expandToOverlay(sequenceToken: number): Promise<void> {
        const outline = this.getOutline();

        this.freezeCurrentVisualState(outline);
        outline.classList.remove('pulsing', 'hidden', 'error', 'error-fill');

        void outline.offsetWidth;

        requestAnimationFrame(() => {
            outline.style.opacity = '1';
            outline.style.transform = 'translate(-50%, -50%) scale(1)';
            this.clearInlineOverrides(outline);
        });

        return this.waitForTransition(outline, 'transform', 560).then(() => {
            if (sequenceToken !== this._private.loadingTransitionToken) return;
        });
    }

    private cancelScheduledTransitions(): void {
        if (this._private.scheduledWaitTimer) {
            clearTimeout(this._private.scheduledWaitTimer);
            this._private.scheduledWaitTimer = null;
        }
    }

    private showError(sequenceToken: number): Promise<void> {
        const outline = this.getOutline();

        this.freezeCurrentVisualState(outline);
        outline.classList.remove('pulsing', 'hidden', 'error', 'error-fill');

        void outline.offsetWidth;

        requestAnimationFrame(() => {
            outline.style.opacity = '1';
            outline.classList.add('error-fill');
            this.clearInlineOverrides(outline);
        });

        return this.waitForTransition(outline, 'transform', 420).then(() => {
            if (sequenceToken !== this._private.loadingTransitionToken) return;
        });
    }

    public idle(): void {
        this.cancelScheduledTransitions();
        this._private.loadingTransitionToken++;
        this.show();
    }

    public loading(): Promise<void> {
        this.cancelScheduledTransitions();
        this._private.loadingTransitionToken++;
        return this.beginScanLoading(this._private.loadingTransitionToken);
    }

    public hide(): Promise<void> {
        this.cancelScheduledTransitions();
        this._private.loadingTransitionToken++;
        const sequenceToken = this._private.loadingTransitionToken;

        return this.expandToOverlay(sequenceToken)
            .then(() => {
                if (sequenceToken !== this._private.loadingTransitionToken) return;
                return this.waitDuration(HIDE_HOLD_MILLISECONDS);
            })
            .then(() => {
                if (sequenceToken !== this._private.loadingTransitionToken) return;
                return this.fadeOut(sequenceToken);
            });
    }

    public error(): Promise<void> {
        this.cancelScheduledTransitions();
        this._private.loadingTransitionToken++;
        return this.showError(this._private.loadingTransitionToken);
    }
}

export const LoadingWidget = new LoadingWidget_t();