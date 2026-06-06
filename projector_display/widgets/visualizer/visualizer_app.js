(function () {
    var visualizerInterval = null;

    function getVisualizerElement() {
        return document.getElementById('visualizer');
    }

    function play() {
        var visualizerElement = getVisualizerElement();
        if (!visualizerElement) return;
        visualizerElement.classList.remove('paused', 'hidden');

        clearInterval(visualizerInterval);

        var barElements = visualizerElement.querySelectorAll('.bar');
        visualizerInterval = setInterval(function () {
            barElements.forEach(function (barElement) {
                barElement.style.height = (Math.random() * 80 + 20) + '%';
            });
        }, 140);
    }

    function pause() {
        var visualizerElement = getVisualizerElement();
        if (visualizerElement) {
            if (!visualizerElement.classList.contains('hidden')) {
                visualizerElement.classList.add('paused');

                var barElements = visualizerElement.querySelectorAll('.bar');
                barElements.forEach(function (barElement) {
                    barElement.style.height = '2%';
                });
            }
        }

        clearInterval(visualizerInterval);
        visualizerInterval = null;
    }

    function stop() {
        var visualizerElement = getVisualizerElement();
        if (visualizerElement) {
            visualizerElement.classList.remove('paused');
            visualizerElement.classList.add('hidden');

            var barElements = visualizerElement.querySelectorAll('.bar');
            barElements.forEach(function (barElement) {
                barElement.style.height = '0%';
            });
        }

        clearInterval(visualizerInterval);
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