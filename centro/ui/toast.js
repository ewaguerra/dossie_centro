/**
 * Toast in-runtime — feedback temporário (window.centroToast).
 */
(function () {
  "use strict";

  function setupToast() {
    var toastEl = null;
    var msgEl = null;

    function hideToast() {
      if (toastEl) toastEl.classList.add("is-hidden");
    }

    window.centroToast = function (msg, type) {
      if (!toastEl) {
        toastEl = document.createElement("div");
        toastEl.id = "centro-toast";
        toastEl.className = "toast is-hidden";
        toastEl.setAttribute("role", "status");
        toastEl.setAttribute("aria-live", "polite");

        msgEl = document.createElement("span");
        msgEl.className = "toast__message";

        var closeBtn = document.createElement("button");
        closeBtn.type = "button";
        closeBtn.className = "toast__close";
        closeBtn.setAttribute("aria-label", "Fechar");
        closeBtn.textContent = "\u00d7";
        closeBtn.addEventListener("click", hideToast);

        toastEl.appendChild(msgEl);
        toastEl.appendChild(closeBtn);
        document.body.appendChild(toastEl);
      }

      msgEl.textContent = msg;
      toastEl.classList.toggle("toast--warn", type === "warn");
      toastEl.classList.remove("is-hidden");

      if (window.centroToastTimer) clearTimeout(window.centroToastTimer);
      window.centroToastTimer = setTimeout(hideToast, 4000);
    };
    console.log("[CENTRO] Toast system ready");
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.ui = window.CENTRO.ui || {};
  window.CENTRO.ui.setupToast = setupToast;
})();
