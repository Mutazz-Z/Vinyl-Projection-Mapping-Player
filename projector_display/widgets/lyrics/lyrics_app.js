(function () {
    let uiLines = [];
    let currentActiveIndex = null;
    let fixedStepPx = 120;

    const MIN_STEP_PX = 112;
    const STEP_PADDING_PX = 26;

    function computeLineUnitPx(el) {
        const style = window.getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize) || 28;
        const lineHeight = parseFloat(style.lineHeight) || (fontSize * 1.25);
        return Math.ceil(lineHeight);
    }

    function recomputeFixedStep() {
        if (uiLines.length === 0) {
            fixedStepPx = MIN_STEP_PX;
            return;
        }

        const unit = computeLineUnitPx(uiLines[0].element);
        let maxHeight = unit;

        uiLines.forEach(function (line) {
            const renderedHeight = Math.ceil(line.element.getBoundingClientRect().height || 0);
            if (renderedHeight > maxHeight) {
                maxHeight = renderedHeight;
            }
        });

        fixedStepPx = Math.max(MIN_STEP_PX, maxHeight + STEP_PADDING_PX);
    }

    function updateLyrics(lyricsData) {
        const container = document.getElementById('lyrics-scroll');
        if (!container) return;

        container.innerHTML = '';
        uiLines = [];
        currentActiveIndex = null;
        fixedStepPx = MIN_STEP_PX;

        if (!lyricsData || !Array.isArray(lyricsData.lines)) return;

        lyricsData.lines.forEach(function (lineObj) {
            if (!lineObj.text) return;

            const el = document.createElement('div');
            el.className = 'lyric-line';
            el.textContent = lineObj.text;
            container.appendChild(el);

            uiLines.push({
                time: Number(lineObj.timeStart),
                element: el
            });
        });

        if (uiLines.length > 0) {
            recomputeFixedStep();
        }

        syncProgress(0);
    }

    function syncProgress(currentTimeSeconds) {
        if (uiLines.length === 0) return;

        let newActiveIndex = -1;
        for (let i = 0; i < uiLines.length; i++) {
            if (currentTimeSeconds >= uiLines[i].time) {
                newActiveIndex = i;
            } else {
                break;
            }
        }

        if (newActiveIndex < 0) {
            newActiveIndex = 0;
        }

        if (newActiveIndex === currentActiveIndex) return;
        currentActiveIndex = newActiveIndex;

        const step = fixedStepPx;

        uiLines.forEach(function (line, index) {
            const el = line.element;
            const indexDelta = index - currentActiveIndex;
            const y = indexDelta * step;

            if (Math.abs(indexDelta) > 1) {
                el.style.opacity = '0';
                el.style.transform = 'translateY(' + y + 'px)';
                el.classList.remove('active');
                return;
            }

            let opacity = 0;

            if (indexDelta === 0) {
                opacity = 1;
                el.classList.add('active');
            } else {
                opacity = 0.42;
                el.classList.remove('active');
            }

            el.style.opacity = Math.max(0, opacity);
            el.style.transform = 'translateY(calc(' + y + 'px - 50%))';
        });
    }

    function clear() {
        updateLyrics(null);
    }

    window.LyricsWidget = {
        updateLyrics: updateLyrics,
        syncProgress: syncProgress,
        clear: clear
    };
})();