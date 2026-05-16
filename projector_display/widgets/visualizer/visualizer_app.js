(function() {
    var visualizerInterval = null;

    function start() {
        var viz = document.getElementById('visualizer');
        if (!viz) return;
        viz.classList.remove('paused');

        clearInterval(visualizerInterval);

        var bars = viz.querySelectorAll('.bar');
        visualizerInterval = setInterval(function() {
            bars.forEach(function(bar) {
                bar.style.height = (Math.random() * 80 + 20) + '%';
            });
        }, 140);
    }

    function stop() {
        var viz = document.getElementById('visualizer');
        if (viz) viz.classList.add('paused');
        clearInterval(visualizerInterval);
        visualizerInterval = null;
    }

    window.VisualizerWidget = {
        start: start,
        stop: stop
    };
})();
