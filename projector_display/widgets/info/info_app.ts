import { TitleAndArtist_t } from "../../types/state";

interface InfoWidgetPrivateState {
    pendingTransitionCleanupFunction: (() => void) | null;
    resizeTimerIdentifier: ReturnType<typeof setTimeout> | undefined;
}

export class InfoWidget {
    private _private: InfoWidgetPrivateState;

    constructor() {
        this._private = {
            pendingTransitionCleanupFunction: null,
            resizeTimerIdentifier: undefined,
        };

        window.addEventListener('resize', () => {
            clearTimeout(this._private.resizeTimerIdentifier);
            this._private.resizeTimerIdentifier = setTimeout(() => this.updateLayout(), 100);
        });
    }

    private getContainer(): HTMLElement {
        return document.querySelector('#info-widget .info-container') as HTMLElement;
    }

    private getTitleElement(): HTMLElement {
        return document.getElementById('album-title') as HTMLElement;
    }

    private getArtistElement(): HTMLElement {
        return document.getElementById('artist-name') as HTMLElement;
    }

    private getTitleWrapper(): HTMLElement {
        return document.getElementById('title-wrap') as HTMLElement;
    }

    private getArtistWrapper(): HTMLElement {
        return document.getElementById('artist-wrap') as HTMLElement;
    }

    private resetMarquee(element: HTMLElement): void {
        element.classList.remove('marquee');
        if (element.dataset.originalText !== undefined) {
            element.textContent = element.dataset.originalText;
            delete element.dataset.originalText;
        }
    }

    private applyMarquee(element: HTMLElement): void {
        const textContent = element.textContent;
        element.dataset.originalText = textContent;

        element.innerHTML = '';

        const firstTextSpan = document.createElement('span');
        firstTextSpan.textContent = textContent;

        const spacerSpan = document.createElement('span');
        spacerSpan.className = 'spacer';

        const secondTextSpan = document.createElement('span');
        secondTextSpan.textContent = textContent;

        element.appendChild(firstTextSpan);
        element.appendChild(spacerSpan);
        element.appendChild(secondTextSpan);

        element.classList.add('marquee');
    }

    private updateLayout(): void {
        const container = this.getContainer();
        const titleElement = this.getTitleElement();
        const titleWrapper = this.getTitleWrapper();
        const artistWrapper = this.getArtistWrapper();

        container.style.setProperty('--scale', '1');
        titleWrapper.style.width = 'auto';
        titleWrapper.style.flex = 'none';
        artistWrapper.style.width = 'auto';
        artistWrapper.style.flex = 'none';
        this.resetMarquee(titleElement);

        void container.offsetHeight;

        const rawTitleWidth = titleElement.scrollWidth;
        const rawArtistWidth = artistWrapper.scrollWidth;
        const availableWidth = container.clientWidth - 8;

        if (rawTitleWidth === 0 && rawArtistWidth === 0) {
            return;
        }

        const actualGap = (rawTitleWidth > 0 && rawArtistWidth > 0) ? 20 : 0;

        const totalContentWidth = rawTitleWidth + rawArtistWidth + actualGap;
        const scaleAmount = Math.max(0.8, Math.min(1.2, availableWidth / totalContentWidth));

        const scaledArtistWidth = Math.ceil(rawArtistWidth * scaleAmount);
        const scaledTitleTextWidth = Math.ceil(rawTitleWidth * scaleAmount);

        const maxTitleBoxWidth = Math.floor(availableWidth - scaledArtistWidth - actualGap);

        container.style.setProperty('--scale', String(scaleAmount));

        artistWrapper.style.width = scaledArtistWidth + 'px';
        artistWrapper.style.flex = '0 0 ' + scaledArtistWidth + 'px';

        titleWrapper.style.width = maxTitleBoxWidth + 'px';
        titleWrapper.style.flex = '0 0 ' + maxTitleBoxWidth + 'px';

        if (scaledTitleTextWidth > maxTitleBoxWidth + 2) {
            this.applyMarquee(titleElement);
        }
    }

    private setText(album: string, artist: string): void {
        const albumTitle = this.getTitleElement();
        const artistName = this.getArtistElement();

        this.resetMarquee(albumTitle);

        albumTitle.textContent = album;
        artistName.textContent = artist;

        this.updateLayout();
    }

    public show(): void {
        const container = this.getContainer();

        if (this._private.pendingTransitionCleanupFunction) {
            this._private.pendingTransitionCleanupFunction();
            this._private.pendingTransitionCleanupFunction = null;
        }

        container.classList.remove('hiding');
        if (!container.classList.contains('visible')) {
            requestAnimationFrame(() => {
                container.classList.add('visible');
            });
        }
    }

    public hide(): void {
        const container = this.getContainer();

        if (container.classList.contains('hiding')) {
            return;
        }

        if (this._private.pendingTransitionCleanupFunction) {
            this._private.pendingTransitionCleanupFunction();
            this._private.pendingTransitionCleanupFunction = null;
        }

        const transitionEndCallback = (event: Event) => {
            const transitionEvent = event as TransitionEvent;
            if (transitionEvent.target !== container) {
                return;
            }
            if (transitionEvent.propertyName !== 'transform') {
                return;
            }

            container.classList.remove('hiding');
            container.removeEventListener('transitionend', transitionEndCallback);
            if (this._private.pendingTransitionCleanupFunction === cleanupFunction) {
                this._private.pendingTransitionCleanupFunction = null;
            }
        };

        const cleanupFunction = () => {
            container.removeEventListener('transitionend', transitionEndCallback);
            container.classList.remove('hiding');
        };

        this._private.pendingTransitionCleanupFunction = cleanupFunction;
        container.addEventListener('transitionend', transitionEndCallback);
        container.classList.remove('hiding');
        container.classList.add('visible');
        void container.offsetHeight;
        requestAnimationFrame(() => {
            container.classList.add('hiding');
            container.classList.remove('visible');
        });
    }

    public updateData(albumInfo: TitleAndArtist_t): void {
        if (!albumInfo.title && !albumInfo.artist) {
            return;
        }

        this.setText(albumInfo.title, albumInfo.artist);
    }
}

export const infoWidget = new InfoWidget();