/**
 * Bootstrap da UI chrome do Centro (R5 — extraído de centro-runtime.js).
 */
(function () {
  "use strict";

  function create(ctx) {
    ctx = ctx || {};

    function flyToLocation(lng, lat, zoom, pitch) {
      if (typeof ctx.flyToLocation === "function") {
        ctx.flyToLocation(lng, lat, zoom, pitch);
      }
    }

    function subterraneanFlyToView() {
      if (typeof ctx.subterraneanFlyToView === "function") ctx.subterraneanFlyToView();
    }

    function whenMapReady(cb) {
      if (typeof ctx.whenMapReady === "function") return ctx.whenMapReady(cb);
      if (typeof cb === "function") cb();
    }

    function setupHamburgerMenu() {
      var btn = document.getElementById("hamburger-btn");
      var dd = document.getElementById("hamburger-dropdown");
      if (!btn || !dd) return;
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        dd.style.display = dd.style.display === "none" ? "block" : "none";
      });
      document.addEventListener("click", function () {
        dd.style.display = "none";
      });
      dd.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    }

    function setSidebarCollapsed(collapsed) {
      var sb = document.getElementById("panel");
      var btn = document.getElementById("sidebar-toggle");
      var openBtn = document.getElementById("sidebar-open-btn");
      if (!sb) return;
      sb.classList.remove("collapsed");
      if (collapsed) {
        sb.classList.add("sidebar--collapsed");
      } else {
        sb.classList.remove("sidebar--collapsed");
      }
      document.body.classList.toggle("centro-sidebar-collapsed", collapsed);
      if (openBtn) openBtn.hidden = !collapsed;
      if (btn) {
        btn.classList.toggle("open", collapsed);
        btn.innerHTML = collapsed
          ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>'
          : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>';
      }
    }

    function toggleSidebar() {
      var sb = document.getElementById("panel");
      if (!sb) return;
      setSidebarCollapsed(!sb.classList.contains("sidebar--collapsed"));
    }

    function activateSidebarTab(targetTabId) {
      var tabs = document.querySelectorAll(".sidebar-tab[role='tab']");
      tabs.forEach(function (tab) {
        var active = tab.id === targetTabId;
        tab.setAttribute("aria-selected", active ? "true" : "false");
        var panelId = tab.getAttribute("aria-controls");
        var panel = panelId ? document.getElementById(panelId) : null;
        if (panel) panel.hidden = !active;
      });
    }

    function setupSidebarTabs() {
      var tabs = Array.prototype.slice.call(
        document.querySelectorAll(".sidebar-tab[role='tab']")
      );
      if (!tabs.length) return;

      function focusTabAt(index) {
        var tab = tabs[index];
        if (!tab) return;
        tab.focus();
        activateSidebarTab(tab.id);
      }

      tabs.forEach(function (tab, index) {
        tab.addEventListener("click", function () {
          activateSidebarTab(tab.id);
        });
        tab.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            activateSidebarTab(tab.id);
            return;
          }
          var next = index;
          if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            next = (index + 1) % tabs.length;
          } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            next = (index - 1 + tabs.length) % tabs.length;
          } else if (e.key === "Home") {
            e.preventDefault();
            next = 0;
          } else if (e.key === "End") {
            e.preventDefault();
            next = tabs.length - 1;
          } else {
            return;
          }
          focusTabAt(next);
        });
      });
      var defaultTab = document.getElementById("sidebar-tab-fases");
      if (defaultTab) activateSidebarTab(defaultTab.id);
    }

    function setupSidebarToggle() {
      var btn = document.getElementById("sidebar-toggle");
      if (btn) {
        btn.addEventListener("click", toggleSidebar);
      }
    }

    function setupNarrativeNav() {
      document.querySelectorAll("#narrative-nav .nav-btn[data-nav-lng]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          flyToLocation(
            parseFloat(btn.dataset.navLng),
            parseFloat(btn.dataset.navLat),
            parseFloat(btn.dataset.navZoom),
            parseFloat(btn.dataset.navPitch)
          );
        });
      });
    }

    function setupKeyboardShortcuts() {
      document.addEventListener("keydown", function (e) {
        if ((e.key === "s" || e.key === "S") && !e.ctrlKey && !e.metaKey) {
          toggleSidebar();
        }
      });
    }

    function setupSubterraneanFlyButtons() {
      var FLY_BTN_IDS = ["subterranean-fly-btn", "subterranean-fly-sidebar-btn"];
      FLY_BTN_IDS.forEach(function (id) {
        var btn = document.getElementById(id);
        if (!btn) return;
        btn.addEventListener("click", function () {
          whenMapReady(function () {
            subterraneanFlyToView();
          });
        });
      });

      function syncFlyBtn() {
        var sidebarBtn = document.getElementById("subterranean-fly-sidebar-btn");
        if (!sidebarBtn) return;
        var cb = document.getElementById("centro-subterranean-toggle");
        sidebarBtn.hidden = !(cb && cb.checked);
      }

      function attachFlySync() {
        var cb = document.getElementById("centro-subterranean-toggle");
        if (!cb || cb.dataset.centroFlySync) return;
        cb.dataset.centroFlySync = "1";
        cb.addEventListener("change", syncFlyBtn);
      }

      syncFlyBtn();
      var cutaway = window.CENTRO && window.CENTRO.subterraneanCutaway;
      if (cutaway && cutaway.ready) {
        attachFlySync();
      } else {
        document.addEventListener("centro:subterranean-ready", function onReady() {
          document.removeEventListener("centro:subterranean-ready", onReady);
          attachFlySync();
          syncFlyBtn();
        });
      }
    }

    function setupSubterraneanGuide() {
      var GUIDE_MIN_PHASE = 7;
      var guide = document.getElementById("subterranean-guide");
      var closeBtn = document.getElementById("subterranean-guide-close");
      var openBtns = document.querySelectorAll(
        "#subterranean-guide-open, #subterranean-guide-open-fases"
      );
      if (!guide || !closeBtn) return;

      function getCurrentPhase() {
        var ph = window.CENTRO && window.CENTRO.protocoloPhase;
        if (ph && typeof ph.getPhase === "function") return ph.getPhase();
        return 1;
      }

      function isSubterraneanGuideAvailable() {
        return getCurrentPhase() >= GUIDE_MIN_PHASE;
      }

      function closeGuide() {
        guide.hidden = true;
      }

      function openGuide() {
        if (!isSubterraneanGuideAvailable()) return;
        guide.hidden = false;
      }

      function syncSubterraneanGuideAccess() {
        var available = isSubterraneanGuideAvailable();
        openBtns.forEach(function (btn) {
          btn.hidden = !available;
        });
        if (!available && !guide.hidden) closeGuide();
      }

      closeBtn.addEventListener("click", closeGuide);
      openBtns.forEach(function (btn) {
        btn.addEventListener("click", openGuide);
      });

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && !guide.hidden) closeGuide();
      });
      document.addEventListener("centro:arg-state-changed", syncSubterraneanGuideAccess);

      guide.hidden = true;
      syncSubterraneanGuideAccess();

      window.CENTRO = window.CENTRO || {};
      window.CENTRO.ui = window.CENTRO.ui || {};
      window.CENTRO.ui.openSubterraneanGuide = openGuide;
      window.CENTRO.ui.syncSubterraneanGuideAccess = syncSubterraneanGuideAccess;
    }

    function install() {
      setupHamburgerMenu();
      setupSidebarTabs();
      setupSidebarToggle();
      setupSubterraneanFlyButtons();
      setupNarrativeNav();
      setupKeyboardShortcuts();
      setupSubterraneanGuide();
    }

    function wireSidebarMobileButtons() {
      var closeBtn = document.getElementById("sidebar-close-btn");
      var openBtn = document.getElementById("sidebar-open-btn");
      if (closeBtn) {
        closeBtn.addEventListener("click", function () {
          setSidebarCollapsed(true);
        });
      }
      if (openBtn) {
        openBtn.addEventListener("click", function () {
          setSidebarCollapsed(false);
        });
      }
    }

    return {
      install: install,
      wireSidebarMobileButtons: wireSidebarMobileButtons,
      setSidebarCollapsed: setSidebarCollapsed,
      toggleSidebar: toggleSidebar,
    };
  }

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.centroChrome = { create: create };
})();
