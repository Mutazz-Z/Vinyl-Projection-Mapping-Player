export class VisualizerWidget_t {
    private visualizerInterval: ReturnType<typeof setInterval> | null = null;

    private getElement(): HTMLElement | null {
        return document.getElementById('visualizer');
    }

    public show(): void {
        this.play();
    }

    public hide(): void {
        const el = this.getElement();
        if (!el) return;

        el.classList.remove('paused');
        el.classList.add('hidden');

        el.querySelectorAll<HTMLElement>('.bar').forEach((bar) => {
            bar.style.height = '0%';
        });

        if (this.visualizerInterval) {
            clearInterval(this.visualizerInterval);
            this.visualizerInterval = null;
        }
    }

    public play(): void {
        const el = this.getElement();
        if (!el) return;

        el.classList.remove('paused', 'hidden');

        if (this.visualizerInterval) clearInterval(this.visualizerInterval);

        const bars = el.querySelectorAll<HTMLElement>('.bar');
        this.visualizerInterval = setInterval(() => {
            bars.forEach((bar) => {
                bar.style.height = (Math.random() * 80 + 20) + '%';
            });
        }, 140);
    }

    public pause(): void {
        const el = this.getElement();
        if (!el || el.classList.contains('hidden')) return;

        el.classList.add('paused');
        el.querySelectorAll<HTMLElement>('.bar').forEach((bar) => {
            bar.style.height = '2%';
        });

        if (this.visualizerInterval) {
            clearInterval(this.visualizerInterval);
            this.visualizerInterval = null;
        }
    }
}

export const VisualizerWidget = new VisualizerWidget_t();
