(function () {
    function getContainer() {
        return document.getElementById('context-message-container');
    }

    function getTextElement() {
        return document.getElementById('context-message-text');
    }

    function showError(message) {
        var container = getContainer();
        var textEl = getTextElement();
        if (!container || !textEl) return;

        textEl.textContent = message;
        container.classList.add('visible');
    }

    function hide() {
        var container = getContainer();
        if (container) {
            container.classList.remove('visible');
        }
    }

    window.ContextMessageWidget = {
        showError: showError,
        hide: hide
    };
})();