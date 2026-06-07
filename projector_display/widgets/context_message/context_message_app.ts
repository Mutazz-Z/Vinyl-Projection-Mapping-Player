(function () {
    function getContainer(): HTMLElement {
        return document.getElementById('context-message-container') as HTMLElement;
    }

    function getTextElement(): HTMLElement {
        return document.getElementById('context-message-text') as HTMLElement;
    }

    function show(message?: string): void {
        const container = getContainer();
        const textElement = getTextElement();

        textElement.textContent = message || '';
        container.classList.add('visible');
    }

    function hide(): void {
        const container = getContainer();
        container.classList.remove('visible');
    }

    window.ContextMessageWidget = {
        show: show,
        hide: hide,
    };
})();
