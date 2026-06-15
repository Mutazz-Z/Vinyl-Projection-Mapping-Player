import { QrCodeData_t } from "../../types/state";

export class QrCodeWidget_t {

    private getContainer(): HTMLElement {
        return document.getElementById('qrcode-container') as HTMLElement;
    }

    private getUnknownTagIndicator(): HTMLElement {
        return document.getElementById('unknown-tag-indicator') as HTMLElement;
    }

    private getQrRenderTargetElement(): HTMLElement {
        return document.getElementById('unknown-tag-qr') as HTMLElement;
    }

    private getUidLabelElement(): HTMLElement {
        return document.getElementById('unknown-tag-uid') as HTMLElement;
    }

    private renderQrCodeImage(registrationUrl: string): void {
        const qrRenderTargetElement = this.getQrRenderTargetElement();

        qrRenderTargetElement.innerHTML = '';

        new (window as any).QRCode(qrRenderTargetElement, {
            text: registrationUrl,
            width: 240,
            height: 240,
            correctLevel: (window as any).QRCode.CorrectLevel.M,
        });
    }

    public updateData(qrCodeData: QrCodeData_t): void {
        if (qrCodeData.readyForDisplay) {
            this.renderQrCodeImage(qrCodeData.registrationUrl);

            const uidLabelElement = this.getUidLabelElement();
            uidLabelElement.textContent = `Register Tag: ${qrCodeData.uid}`;
        }
    }

    public show(): void {
        const container = this.getContainer();
        container.classList.add('visible');
    }

    public hide(): void {
        const container = this.getContainer();
        container.classList.remove('visible');

        const indicator = this.getUnknownTagIndicator();
        indicator.classList.remove('visible');
    }
}

export const QrCodeWidget = new QrCodeWidget_t();
