(function () {
    function getContainer() {
        return document.getElementById('qrcode-container');
    }

    function buildRegistrationUrl(payload) {
        if (payload && payload.registration_url) return payload.registration_url;
        const uid = (payload && payload.uid) ? payload.uid : '';
        const piIp = window.PI_IP || window.location.hostname;
        return 'http://' + piIp + ':8000/?uid=' + encodeURIComponent(uid);
    }

    function show(payload) {
        const container = getContainer();
        const qrImg = document.getElementById('unknown-tag-qr');
        const uidLabel = document.getElementById('unknown-tag-uid');
        if (!container || !qrImg || !uidLabel) return;

        const url = buildRegistrationUrl(payload);

        if (typeof QRCode !== 'undefined') {
            const tmp = document.createElement('div');
            tmp.style.cssText = 'position:fixed;left:-9999px;top:-9999px;visibility:hidden;';
            document.body.appendChild(tmp);

            new QRCode(tmp, {
                text: url,
                width: 240,
                height: 240,
                correctLevel: QRCode.CorrectLevel.M
            });

            const canvas = tmp.querySelector('canvas');
            if (canvas) {
                qrImg.src = canvas.toDataURL('image/png');
            } else {
                const img = tmp.querySelector('img');
                if (img && img.src) {
                    qrImg.src = img.src;
                }
            }
            document.body.removeChild(tmp);
        }

        uidLabel.textContent = (payload && payload.uid) ? ('UID: ' + payload.uid) : '';

        void container.offsetWidth;
        container.classList.add('visible');
    }

    function hide() {
        const container = getContainer();
        if (container) {
            container.classList.remove('visible');
        }
    }

    window.QrCodeWidget = {
        show: show,
        hide: hide
    };
})();