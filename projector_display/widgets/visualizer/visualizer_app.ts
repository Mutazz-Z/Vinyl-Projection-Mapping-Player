(function () {
    let visualizerInterval: ReturnType<typeof setInterval> | null = null;

    function getVisualizerElement(): HTMLElement | null {
        return document.getElementById('visualizer');
    }

    function play(): void {
        const visualizerElement = getVisualizerElement();
        if (!visualizerElement) return;
        visualizerElement.classList.remove('paused', 'hidden');

        if (visualizerInterval) {
            clearInterval(visualizerInterval);
        }

        const barElements = visualizerElement.querySelectorAll<HTMLElement>('.bar');
        visualizerInterval = setInterval(function () {
            barElements.forEach(function (barElement) {
                barElement.style.height = (Math.random() * 80 + 20) + '%';
            });
        }, 140);
    }

    function pause(): void {
        const visualizerElement = getVisualizerElement();
        if (visualizerElement) {
            if (!visualizerElement.classList.contains('hidden')) {
                visualizerElement.classList.add('paused');

                const barElements = visualizerElement.querySelectorAll<HTMLElement>('.bar');
                barElements.forEach(function (barElement) {
                    barElement.style.height = '2%';
                });
            }
        }

        if (visualizerInterval) {
            clearInterval(visualizerInterval);
        }
        visualizerInterval = null;
    }

    function stop(): void {
        const visualizerElement = getVisualizerElement();
        if (visualizerElement) {
            visualizerElement.classList.remove('paused');
            visualizerElement.classList.add('hidden');

            const barElements = visualizerElement.querySelectorAll<HTMLElement>('.bar');
            barElements.forEach(function (barElement) {
                barElement.style.height = '0%';
            });
        }

        if (visualizerInterval) {
            clearInterval(visualizerInterval);
        }
        visualizerInterval = null;
    }

    function show(): void {
        play();
    }

    function hide(): void {
        stop();
    }

    window.VisualizerWidget = {
        show: show,
        hide: hide,
        play: play,
        pause: pause,
    };
})();
