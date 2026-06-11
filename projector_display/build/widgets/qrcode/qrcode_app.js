"use strict";
(() => {
  // widgets/qrcode/qrcode_app.ts
  (function() {
    function getContainer() {
      return document.getElementById("qrcode-container");
    }
    function getUnknownTagIndicator() {
      return document.getElementById("unknown-tag-indicator");
    }
    function buildRegistrationUrl(qrCodeData) {
      if (qrCodeData && qrCodeData.registrationUrl) {
        return String(qrCodeData.registrationUrl).replace(":8000", "");
      }
      return "";
    }
    function show(qrCodeData) {
      const currentQrCodeData = qrCodeData;
      const container = getContainer();
      const qrImageElement = document.getElementById("unknown-tag-qr");
      const uidLabelElement = document.getElementById("unknown-tag-uid");
      if (!container || !qrImageElement || !uidLabelElement) return;
      const registrationUrl = buildRegistrationUrl(currentQrCodeData);
      if (typeof QRCode !== "undefined") {
        const hiddenQRCodeContainer = document.createElement("div");
        hiddenQRCodeContainer.style.cssText = "position:fixed;left:-9999px;top:-9999px;visibility:hidden;";
        document.body.appendChild(hiddenQRCodeContainer);
        new QRCode(hiddenQRCodeContainer, {
          text: registrationUrl,
          width: 240,
          height: 240,
          correctLevel: QRCode.CorrectLevel.M
        });
        const qrCanvasElement = hiddenQRCodeContainer.querySelector("canvas");
        if (qrCanvasElement) {
          qrImageElement.src = qrCanvasElement.toDataURL("image/png");
        } else {
          const qrImageFallbackElement = hiddenQRCodeContainer.querySelector("img");
          if (qrImageFallbackElement && qrImageFallbackElement.src) {
            qrImageElement.src = qrImageFallbackElement.src;
          }
        }
        document.body.removeChild(hiddenQRCodeContainer);
      }
      uidLabelElement.textContent = currentQrCodeData?.readyForDisplay ? "Registration QR" : "";
      void container.offsetWidth;
      container.classList.add("visible");
    }
    function hide(options) {
      const config = options && typeof options === "object" ? options : {};
      const container = getContainer();
      if (config.visible !== false && container) {
        container.classList.remove("visible");
      }
      if (config.clearUnknownTagIndicator !== false) {
        const indicator = getUnknownTagIndicator();
        if (indicator) {
          indicator.classList.remove("visible");
        }
      }
    }
    window.QrCodeWidget = {
      show,
      hide
    };
  })();
})();
