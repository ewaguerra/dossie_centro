/**
 * Desktop Application Manager - Linux Version
 */

class DesktopManager {
  constructor() {
    this.appCards = document.querySelectorAll('.app-card, .dock-item');
    this.windowsContainer = document.getElementById('windows-container');
    this.gridViewBtns = document.querySelectorAll('.grid-view-btn');
    this.appsContainer = document.querySelector('.apps-container');
  }

  init() {
    this.attachEventListeners();
  }

  attachEventListeners() {
    // Click em app cards
    this.appCards.forEach(card => {
      card.addEventListener('click', () => {
        const app = card.dataset.app;
        this.openApplication(app);
      });
    });

    // Toggle grid/list view
    this.gridViewBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = btn.dataset.view;
        this.switchView(view);
      });
    });
  }

  openApplication(appName) {
    console.log('Abrindo aplicação:', appName);
    
    // Mapeamento de nomes de app para os IDs internos
    const appMap = {
      'dossiê': 'dossie',
      'fotos': 'fotos',
      'codinomes': 'codinomes',
      'geoscanner': 'geoscanner',
      'cmd': 'terminal',
      'arquivo': 'arquivo',
      'terminal': 'terminal'
    };

    const targetApp = appMap[appName.toLowerCase()] || appName;

    // Se o script.js original estiver carregado, ele terá a função openApplication no escopo global (ou via evento)
    // No nosso caso, o script.js original usa uma IIFE, então precisamos expor a função ou disparar um evento.
    const event = new CustomEvent('open-app', { detail: { app: targetApp } });
    window.dispatchEvent(event);
  }

  switchView(view) {
    if (!this.appsContainer) return;
    this.appsContainer.classList.remove('grid-view', 'list-view');
    this.appsContainer.classList.add(`${view}-view`);

    this.gridViewBtns.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.view === view) {
        btn.classList.add('active');
      }
    });
  }
}

window.desktopManager = new DesktopManager();
