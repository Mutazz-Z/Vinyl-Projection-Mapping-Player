"use strict";
(function () {
    function getContainer() {
        return document.getElementById('context-message-container');
    }
    function getTextElement() {
        return document.getElementById('context-message-text');
    }
    function show(message) {
        const container = getContainer();
        const textElement = getTextElement();
        textElement.textContent = message || '';
        container.classList.add('visible');
    }
    function hide() {
        const container = getContainer();
        container.classList.remove('visible');
    }
    window.ContextMessageWidget = {
        show: show,
        hide: hide,
    };
})();
