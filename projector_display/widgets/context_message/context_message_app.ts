export class ContextMessageWidget {
    public getContainer(): HTMLElement {
        return document.getElementById('context-message-container') as HTMLElement;
    }

    public getTextElement(): HTMLElement {
        return document.getElementById('context-message-text') as HTMLElement;
    }

    public show(): void {
        const container = this.getContainer();
        container.classList.add('visible');
    }

    public hide(): void {
        const container = this.getContainer();
        container.classList.remove('visible');
    }

    public updateData(message: string): void {
        const textElement = this.getTextElement();
        textElement.textContent = message;
    }
}

export const contextMessageWidget = new ContextMessageWidget();