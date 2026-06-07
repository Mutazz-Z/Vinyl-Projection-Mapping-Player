(function () {
    type QrHideOptions = {
        visible?: boolean;
        clearUnknownTagIndicator?: boolean;
    };

    type QrShowInput =
        | ProjectorData_t
        | {
            projectorData?: ProjectorData_t;
        };

    function getContainer(): HTMLElement | null {
        return document.getElementById('qrcode-container');
    }

    function getUnknownTagIndicator(): HTMLElement | null {
        return document.getElementById('unknown-tag-indicator');
    }

    function buildRegistrationUrl(projectorData?: ProjectorData_t): string {
        if (projectorData && projectorData.registerTagUrl) {
            return String(projectorData.registerTagUrl).replace(':8000', '');
        }

        let fallbackUid = '';
        if (projectorData && projectorData.tagData && projectorData.tagData.tagUid) {
            fallbackUid = projectorData.tagData.tagUid;
        }

        let piIp = window.PI_IP || window.location.hostname;
        piIp = piIp.replace(':8000', '');
        return 'http://' + piIp + '/?uid=' + encodeURIComponent(fallbackUid);
    }

    function resolveProjectorData(input?: QrShowInput): ProjectorData_t | undefined {
        if (!input) return undefined;
        if (typeof input === 'object' && input !== null && 'projectorData' in input) {
            return (input as { projectorData?: ProjectorData_t }).projectorData;
        }
        return input as ProjectorData_t;
    }

    function show(input?: QrShowInput): void {
        const projectorData = resolveProjectorData(input);

        const container = getContainer();
        const qrImageElement = document.getElementById('unknown-tag-qr') as HTMLImageElement | null;
        const uidLabelElement = document.getElementById('unknown-tag-uid');
        if (!container || !qrImageElement || !uidLabelElement) return;

        const registrationUrl = buildRegistrationUrl(projectorData);

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

        const tagUid = projectorData?.tagData?.tagUid || '';
        uidLabelElement.textContent = tagUid ? ('UID: ' + tagUid) : '';

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
