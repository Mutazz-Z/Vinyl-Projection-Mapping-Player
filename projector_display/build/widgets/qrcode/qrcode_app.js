"use strict";
(function () {
    function getContainer() {
        return document.getElementById('qrcode-container');
    }
    function getUnknownTagIndicator() {
        return document.getElementById('unknown-tag-indicator');
    }
    function buildRegistrationUrl(projectorData) {
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
    function resolveProjectorData(input) {
        if (!input)
            return undefined;
        if (typeof input === 'object' && input !== null && 'projectorData' in input) {
            return input.projectorData;
        }
        return input;
    }
    function show(input) {
        const projectorData = resolveProjectorData(input);
        const container = getContainer();
        const qrImageElement = document.getElementById('unknown-tag-qr');
        const uidLabelElement = document.getElementById('unknown-tag-uid');
        if (!container || !qrImageElement || !uidLabelElement)
            return;
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
            const qrCanvasElement = hiddenQRCodeContainer.querySelector('canvas');
            if (qrCanvasElement) {
                qrImageElement.src = qrCanvasElement.toDataURL('image/png');
            }
            else {
                const qrImageFallbackElement = hiddenQRCodeContainer.querySelector('img');
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
    function hide(options) {
        const config = (options && typeof options === 'object') ? options : {};
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
