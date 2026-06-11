import { QrCodeData_t } from "../../types/state";

(function () {
    type QrHideOptions = {
        visible?: boolean;
        clearUnknownTagIndicator?: boolean;
    };

    function getContainer(): HTMLElement | null {
        return document.getElementById('qrcode-container');
    }

    function getUnknownTagIndicator(): HTMLElement | null {
        return document.getElementById('unknown-tag-indicator');
    }

    function buildRegistrationUrl(qrCodeData?: QrCodeData_t): string {
        if (qrCodeData && qrCodeData.registrationUrl) {
            return String(qrCodeData.registrationUrl).replace(':8000', '');
        }

        return '';
    }

    function show(qrCodeData?: QrCodeData_t): void {
        const currentQrCodeData = qrCodeData;

        const container = getContainer();
        const qrImageElement = document.getElementById('unknown-tag-qr') as HTMLImageElement | null;
        const uidLabelElement = document.getElementById('unknown-tag-uid');
        if (!container || !qrImageElement || !uidLabelElement) return;

        const registrationUrl = buildRegistrationUrl(currentQrCodeData);

        if (typeof QRCode !== 'undefined') {
            const hiddenQRCodeContainer = document.createElement('div');
            hiddenQRCodeContainer.style.cssText = 'position:fixed;left:-9999px;top:-9999px;visibility:hidden;';
            document.body.appendChild(hiddenQRCodeContainer);

            new QRCode(hiddenQRCodeContainer, {
                text: registrationUrl,
                width: 240,
                height: 240,
                correctLevel: QRCode.CorrectLevel.M,
            });

            const qrCanvasElement = hiddenQRCodeContainer.querySelector('canvas') as HTMLCanvasElement | null;
            if (qrCanvasElement) {
                qrImageElement.src = qrCanvasElement.toDataURL('image/png');
            } else {
                const qrImageFallbackElement = hiddenQRCodeContainer.querySelector('img') as HTMLImageElement | null;
                if (qrImageFallbackElement && qrImageFallbackElement.src) {
                    qrImageElement.src = qrImageFallbackElement.src;
                }
            }
            document.body.removeChild(hiddenQRCodeContainer);
        }

        uidLabelElement.textContent = currentQrCodeData?.readyForDisplay ? 'Registration QR' : '';

        void container.offsetWidth;
        container.classList.add('visible');
    }

    function hide(options?: unknown): void {
        const config: QrHideOptions = (options && typeof options === 'object') ? (options as QrHideOptions) : {};
        const container = getContainer();

        if (config.visible !== false && container) {
            container.classList.remove('visible');
        }

        if (config.clearUnknownTagIndicator !== false) {
            const indicator = getUnknownTagIndicator();
            if (indicator) {
                indicator.classList.remove('visible');
            }
        }
    }

    window.QrCodeWidget = {
        show: show,
        hide: hide,
    };
})();
