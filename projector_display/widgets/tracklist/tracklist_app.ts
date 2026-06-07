(function () {
    const TRACKLIST_FADE_MS = 220;
    const RECORD_SLIDE_MS = 700;

    let currentActiveIndex = 0;
    let uiTracks: Array<{ name: string; element: HTMLElement }> = [];
    let renderedTrackSignature = '';
    let pendingTransitionCleanup: (() => void) | null = null;

    type TrackListItemPayload = {
        trackIndex: number;
        track: string;
    };

    type TrackListWidgetDataPayload = {
        tracks?: TrackListItemPayload[];
        currentPlayingIndex?: number;
        readyForDisplay?: boolean;
    };

    type TracklistShowOptions = {
        visible?: boolean;
    };

    type TracklistHideOptions = {
        cancelPendingTransitions?: boolean;
        beginStopSequence?: {
            token: number;
            getPlaybackToken: () => number;
        };
        clear?: boolean;
        visible?: boolean;
    };

    function renderTracklist(tracks: TrackListItemPayload[]): void {
        const container = document.getElementById('tracklist-arc');
        if (!container) return;
        container.innerHTML = '';

        currentActiveIndex = 0;
        uiTracks = [];

        (tracks || []).forEach(function (trackItem) {
            const trackName = trackItem.track || '';
            if (!trackName) return;

            const trackElement = document.createElement('div');
            trackElement.className = 'track-item';
            trackElement.textContent = trackName;
            container.appendChild(trackElement);

            uiTracks.push({
                name: trackName,
                element: trackElement,
            });
        });

        renderedTrackSignature = tracks.map(function (trackItem) {
            return String(trackItem.trackIndex) + ':' + trackItem.track;
        }).join('|');
    }

    function getContainer(): Element | null {
        return document.querySelector('#tracklist-widget .tracklist-container');
    }

    function show(options?: unknown): void {
        const config: TracklistShowOptions = (options && typeof options === 'object') ? (options as TracklistShowOptions) : {};

        if (config.visible === false) {
            return;
        }

        const container = getContainer();
        console.debug('[TL] show()', { container: !!container, uiTracks: uiTracks.length, sig: renderedTrackSignature });
        if (!container) return;

        if (pendingTransitionCleanup) {
            pendingTransitionCleanup();
            pendingTransitionCleanup = null;
        }

        container.classList.remove('hiding');
        container.classList.add('visible');
        container.classList.add('carousel');
        updateArcCarousel(currentActiveIndex);
        console.debug('[TL] show() done', { classes: container.className, uiTracks: uiTracks.length });
    }

    function hide(options?: unknown): null | void {
        const config: TracklistHideOptions = (options && typeof options === 'object') ? (options as TracklistHideOptions) : {};

        if (config.cancelPendingTransitions === true) {
            cancelPendingTransitions();
        }

        if (config.beginStopSequence) {
            const stopConfig = config.beginStopSequence;
            cancelPendingTransitions();

            hideAndClearAfterStopAnimation(stopConfig.token, stopConfig.getPlaybackToken, function () {
                TrackResolver.clear();
            });

            return null;
        }

        if (config.clear === true) {
            clear();
        }

        if (config.visible === false) {
            return;
        }

        const container = getContainer();
        if (!container) return;

        if (pendingTransitionCleanup) {
            pendingTransitionCleanup();
            pendingTransitionCleanup = null;
        }

        const onTransitionEnd = function (event: Event) {
            const transitionEvent = event as TransitionEvent;
            if (transitionEvent.target !== container) return;
            if (transitionEvent.propertyName !== 'opacity') return;

            container.classList.remove('hiding');
            container.removeEventListener('transitionend', onTransitionEnd);
            if (pendingTransitionCleanup === cleanup) {
                pendingTransitionCleanup = null;
            }
        };

        const cleanup = function (): void {
            container.removeEventListener('transitionend', onTransitionEnd);
            container.classList.remove('hiding');
        };

        pendingTransitionCleanup = cleanup;
        container.addEventListener('transitionend', onTransitionEnd);
        container.classList.remove('hiding');
        container.classList.add('visible');
        container.classList.add('carousel');
        void (container as HTMLElement).offsetHeight;
        requestAnimationFrame(function () {
            container.classList.add('hiding');
            container.classList.remove('visible');
            container.classList.remove('carousel');
        });
    }

    function setLinearLayout(): void {
        if (uiTracks.length === 0) return;

        const anchorIndex = currentActiveIndex || 0;
        const yStep = 58;

        uiTracks.forEach(function (track, index) {
            const trackElement = track.element;
            if (!trackElement) return;

            const offset = index - anchorIndex;
            const y = offset * yStep;

            trackElement.classList.toggle('active', offset === 0);

            let opacity = 0;
            if (Math.abs(offset) === 0) opacity = 1;
            else if (Math.abs(offset) === 1) opacity = 0.45;
            else if (Math.abs(offset) === 2) opacity = 0.1;

            trackElement.style.opacity = String(opacity);
            trackElement.style.transform = 'translate(0px, calc(' + y + 'px - 50%)) scale(' + (offset === 0 ? 1.12 : 1) + ')';
        });
    }

    function updateArcCarousel(activeIndex: number): void {
        if (uiTracks.length === 0) return;

        const container = getContainer();

        if (container && !container.classList.contains('carousel')) {
            const newIndex = Number(activeIndex);
            if (!Number.isNaN(newIndex)) currentActiveIndex = newIndex;

            setLinearLayout();
            return;
        }

        const safeIndex = Number(activeIndex);
        if (!Number.isNaN(safeIndex)) {
            currentActiveIndex = safeIndex;
        }

        const TEXT_GAP = 40;
        const ARC_RADIUS = 250;
        const ANGLE_STEP = 0.35;

        uiTracks.forEach(function (track, index) {
            const trackElement = track.element;
            if (!trackElement) return;

            const offset = index - currentActiveIndex;

            if (Math.abs(offset) > 2) {
                trackElement.style.opacity = '0';
                const yDir = offset > 0 ? 300 : -300;
                trackElement.style.transform = 'translate(' + TEXT_GAP + 'px, ' + yDir + 'px) scale(0.5)';
                trackElement.classList.remove('active');
                return;
            }

            const angle = offset * ANGLE_STEP;
            const x = (Math.cos(angle) * ARC_RADIUS) - ARC_RADIUS + TEXT_GAP;
            const y = Math.sin(angle) * ARC_RADIUS;

            let scale = 1;
            let opacity = 1;

            if (offset === 0) {
                scale = 1.3;
                opacity = 1;
                trackElement.classList.add('active');
            } else {
                scale = 1.0 - (Math.abs(offset) * 0.15);
                opacity = 0.6 - (Math.abs(offset) * 0.25);
                trackElement.classList.remove('active');
            }

            trackElement.style.opacity = String(opacity);
            trackElement.style.transform = 'translate(' + x + 'px, calc(' + y + 'px - 50%)) scale(' + scale + ')';
        });
    }

    function clear(): void {
        const container = document.getElementById('tracklist-arc');
        if (container) container.innerHTML = '';
        uiTracks = [];
        renderedTrackSignature = '';
        if (pendingTransitionCleanup) {
            pendingTransitionCleanup();
            pendingTransitionCleanup = null;
        }
    }

    function updateData(trackListWidgetData: TrackListWidgetDataPayload): void {
        const payload = trackListWidgetData || {};
        const tracks = payload.tracks || [];

        console.debug('[TL] updateData()', { incoming: tracks.length, sig: renderedTrackSignature });
        if (tracks.length === 0) {
            return;
        }

        cancelPendingTransitions();

        const incomingIndex = Number(payload.currentPlayingIndex ?? 0);
        const nextSignature = tracks.map(function (trackItem) {
            return String(trackItem.trackIndex) + ':' + trackItem.track;
        }).join('|');

        if (nextSignature !== renderedTrackSignature) {
            renderTracklist(tracks);
            console.debug('[TL] rendered', { uiTracks: uiTracks.length });
        }

        TrackResolver.setTrackNames(tracks.map(function (entry) {
            return entry.track;
        }));

        const safeIndex = Number.isNaN(incomingIndex) ? 0 : Math.floor(incomingIndex);
        currentActiveIndex = Math.max(0, Math.min(tracks.length - 1, safeIndex));
        updateArcCarousel(currentActiveIndex);
    }

    function cancelPendingTransitions(): void {
        if (pendingTransitionCleanup) {
            pendingTransitionCleanup();
            pendingTransitionCleanup = null;
        }
    }

    function hideAndClearAfterStopAnimation(guardToken: number, getPlaybackToken: () => number, onCleared?: () => void): null {
        const container = getContainer();

        if (!container) {
            clear();
            if (onCleared) onCleared();
            return null;
        }

        container.classList.remove('carousel');
        container.classList.add('visible');
        setLinearLayout();

        if (pendingTransitionCleanup) {
            pendingTransitionCleanup();
            pendingTransitionCleanup = null;
        }

        const onTransitionEnd = function (event: Event) {
            const transitionEvent = event as TransitionEvent;
            if (transitionEvent.target !== container) return;
            if (transitionEvent.propertyName !== 'opacity') return;

            if (guardToken !== getPlaybackToken()) return;

            container.classList.remove('hiding');
            container.removeEventListener('transitionend', onTransitionEnd);
            if (pendingTransitionCleanup === cleanup) {
                pendingTransitionCleanup = null;
            }
            if (onCleared) onCleared();
        };

        const cleanup = function (): void {
            container.removeEventListener('transitionend', onTransitionEnd);
            container.classList.remove('hiding');
        };

        pendingTransitionCleanup = cleanup;
        container.addEventListener('transitionend', onTransitionEnd);
        container.classList.remove('carousel');
        container.classList.add('visible');
        void (container as HTMLElement).offsetHeight;
        requestAnimationFrame(function () {
            container.classList.add('hiding');
            container.classList.remove('visible');
            container.classList.remove('carousel');
        });

        return null;
    }

    window.TracklistWidget = {
        show: show,
        hide: hide,
        updateData: updateData,
    };
})();
