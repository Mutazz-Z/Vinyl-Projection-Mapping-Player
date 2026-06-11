"use strict";
(() => {
  // widgets/context_message/context_message_app.ts
  var ContextMessageWidget = class {
    getContainer() {
      return document.getElementById("context-message-container");
    }
    getTextElement() {
      return document.getElementById("context-message-text");
    }
    show() {
      const container = this.getContainer();
      container.classList.add("visible");
    }
    hide() {
      const container = this.getContainer();
      container.classList.remove("visible");
    }
    updateData(message) {
      const textElement = this.getTextElement();
      textElement.textContent = message;
    }
  };
  var contextMessageWidget = new ContextMessageWidget();
})();
