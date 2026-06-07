"use strict";
(function () {
    let visualizerInterval = null;
    function getVisualizerElement() {
        return document.getElementById('visualizer');
    }
    function play() {
        const visualizerElement = getVisualizerElement();
        if (!visualizerElement)
            return;
        visualizerElement.classList.remove('paused', 'hidden');
        if (visualizerInterval) {
            clearInterval(visualizerInterval);
        }
        const barElements = visualizerElement.querySelectorAll('.bar');
        visualizerInterval = setInterval(function () {
            barElements.forEach(function (barElement) {
                barElement.style.height = (Math.random() * 80 + 20) + '%';
            });
        }, 140);
    }
    function pause() {
        const visualizerElement = getVisualizerElement();
        if (visualizerElement) {
            if (!visualizerElement.classList.contains('hidden')) {
                visualizerElement.classList.add('paused');
                const barElements = visualizerElement.querySelectorAll('.bar');
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
    function stop() {
        const visualizerElement = getVisualizerElement();
        if (visualizerElement) {
            visualizerElement.classList.remove('paused');
            visualizerElement.classList.add('hidden');
            const barElements = visualizerElement.querySelectorAll('.bar');
            barElements.forEach(function (barElement) {
                barElement.style.height = '0%';
            });
        }
        if (visualizerInterval) {
            clearInterval(visualizerInterval);
        }
        visualizerInterval = null;
    }
    function show() {
        play();
    }
    function hide() {
        stop();
    }
    window.VisualizerWidget = {
        show: show,
        hide: hide,
        play: play,
        pause: pause,
    };
})();
