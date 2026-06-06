(function () {
    function getContainer() {
        return document.getElementById('context-message-container');
    }

    function getTextElement() {
        return document.getElementById('context-message-text');
    }

    function show(message) {
        var container = getContainer();
        var textElement = getTextElement();

        textElement.textContent = message || '';
        container.classList.add('visible');
    }

    function hide() {
        var container = getContainer();
        container.classList.remove('visible');
    }

    window.ContextMessageWidget = {
        show: show,
        hide: hide,
    };
})();