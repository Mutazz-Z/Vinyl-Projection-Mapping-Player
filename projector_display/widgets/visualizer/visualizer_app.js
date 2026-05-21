(function () {
    var visualizerInterval = null;

    function start() {
        var viz = document.getElementById('visualizer');
        if (!viz) return;
        viz.classList.remove('paused', 'hidden');

        clearInterval(visualizerInterval);

        var bars = viz.querySelectorAll('.bar');
        visualizerInterval = setInterval(function () {
            bars.forEach(function (bar) {
                bar.style.height = (Math.random() * 80 + 20) + '%';
            });
        }, 140);
    }

    function pause() {
        var viz = document.getElementById('visualizer');
        if (viz) {
            if (!viz.classList.contains('hidden')) {
                viz.classList.add('paused');

                var bars = viz.querySelectorAll('.bar');
                bars.forEach(function (bar) {
                    bar.style.height = '2%';
                });
            }
        }

        clearInterval(visualizerInterval);
        visualizerInterval = null;
    }

    function stop() {
        var viz = document.getElementById('visualizer');
        if (viz) {
            viz.classList.remove('paused');
            viz.classList.add('hidden');

            var bars = viz.querySelectorAll('.bar');
            bars.forEach(function (bar) {
                bar.style.height = '0%';
            });
        }

        clearInterval(visualizerInterval);
        visualizerInterval = null;
    }

    window.VisualizerWidget = {
        start: start,
        pause: pause,
        stop: stop
    };
})();