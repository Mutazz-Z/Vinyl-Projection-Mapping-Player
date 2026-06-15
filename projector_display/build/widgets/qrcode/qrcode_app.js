"use strict";
(() => {
  // widgets/qrcode/qrcode_app.ts
  var QrCodeWidget_t = class {
    getContainer() {
      return document.getElementById("qrcode-container");
    }
    getUnknownTagIndicator() {
      return document.getElementById("unknown-tag-indicator");
    }
    getQrRenderTargetElement() {
      return document.getElementById("unknown-tag-qr");
    }
    getUidLabelElement() {
      return document.getElementById("unknown-tag-uid");
    }
    renderQrCodeImage(registrationUrl) {
      const qrRenderTargetElement = this.getQrRenderTargetElement();
      qrRenderTargetElement.innerHTML = "";
      new window.QRCode(qrRenderTargetElement, {
        text: registrationUrl,
        width: 240,
        height: 240,
        correctLevel: window.QRCode.CorrectLevel.M
      });
    }
    updateData(qrCodeData) {
      if (qrCodeData.readyForDisplay) {
        this.renderQrCodeImage(qrCodeData.registrationUrl);
        const uidLabelElement = this.getUidLabelElement();
        uidLabelElement.textContent = `Register Tag: ${qrCodeData.uid}`;
      }
    }
    show() {
      const container = this.getContainer();
      container.classList.add("visible");
    }
    hide() {
      const container = this.getContainer();
      container.classList.remove("visible");
      const indicator = this.getUnknownTagIndicator();
      indicator.classList.remove("visible");
    }
  };
  var QrCodeWidget = new QrCodeWidget_t();
})();
