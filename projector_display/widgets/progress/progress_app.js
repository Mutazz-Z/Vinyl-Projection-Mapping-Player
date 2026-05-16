(function() {
    function getContainer() {
        return document.querySelector('#progress-widget .progress-container');
    }

    function show() {
        var container = getContainer();
        if (container) container.classList.add('visible');
    }

    function hide() {
        var container = getContainer();
        if (container) container.classList.remove('visible');
    }

    function fmtTime(secs) {
        if (isNaN(secs)) return '0:00';
        var m = Math.floor(secs / 60);
        var s = Math.floor(secs % 60).toString().padStart(2, '0');
        return m + ':' + s;
    }

    function reset() {
        var progressBar = document.getElementById('progress-bar');
        if (progressBar) progressBar.style.width = '0%';

        var curEl = document.getElementById('current-time');
        var totEl = document.getElementById('total-time');
        if (curEl) curEl.textContent = '0:00';
        if (totEl) totEl.textContent = '0:00';
    }

    function update(position, duration) {
        if (!duration || duration === 0) return;

        var percent = (position / duration) * 100;
        var progressBar = document.getElementById('progress-bar');
        if (progressBar) progressBar.style.width = percent + '%';

        var curEl = document.getElementById('current-time');
        var totEl = document.getElementById('total-time');
        if (curEl) curEl.textContent = fmtTime(position);
        if (totEl) totEl.textContent = fmtTime(duration);
    }

    window.ProgressWidget = {
        show: show,
        hide: hide,
        reset: reset,
        update: update
    };
})();
