class WindowManager {
  constructor() {
    this.windows = new Map();
    this.zIndexCounter = 1000;
    this.activeWindow = null;
    this.windowsContainer = document.getElementById('desktop-windows');
    this.taskbar = document.getElementById('taskbar-items');
    this.init();
  }

  init() {
    // Listener global para cliques em janelas para focar
    document.addEventListener('mousedown', (e) => {
      const windowEl = e.target.closest('.window');
      if (windowEl) {
        this.focusWindow(windowEl.dataset.windowId);
      }
    });

    // Fechar menu iniciar ao clicar fora
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#start-menu') && !e.target.closest('#start-btn')) {
        const startMenu = document.getElementById('start-menu');
        if (startMenu) startMenu.classList.remove('active');
      }
    });
  }

  createWindow(config) {
    if (!this.windowsContainer) {
      console.error('[WindowManager] Container #desktop-windows não encontrado.');
      return null;
    }
    // Se a janela já existe, foca ela
    if (config.id && this.windows.has(config.id)) {
      const win = this.windows.get(config.id);
      if (win.minimized) {
        this.minimizeWindow(config.id);
      }
      this.focusWindow(config.id);
      return win.element;
    }

    const windowId = config.id || `window-${Date.now()}`;
    const windowEl = document.createElement('div');
    windowEl.classList.add('window');
    windowEl.dataset.windowId = windowId;
    windowEl.style.zIndex = this.zIndexCounter++;
    
    windowEl.innerHTML = `
      <div class="window-header">
        <div class="window-title">${config.title}</div>
        <div class="window-controls">
          <button class="window-btn minimize" title="Minimizar">_</button>
          <button class="window-btn maximize" title="Maximizar">□</button>
          <button class="window-btn close" title="Fechar">✕</button>
        </div>
      </div>
      <div class="window-content">
        ${config.content || ''}
      </div>
      <div class="window-resize-handle"></div>
    `;

    // Aplicar posição inicial
    windowEl.style.left = config.x || '100px';
    windowEl.style.top = config.y || '100px';
    windowEl.style.width = config.width || '600px';
    windowEl.style.height = config.height || '400px';

    this.windowsContainer.appendChild(windowEl);

    // Registrar janela
    this.windows.set(windowId, {
      element: windowEl,
      config: config,
      minimized: false,
      maximized: false
    });

    // Aplicar funcionalidades
    this.makeWindowDraggable(windowId);
    this.makeWindowResizable(windowId);
    this.setupWindowControls(windowId);

    // Adicionar ao taskbar
    this.addToTaskbar(windowId, config.title);

    // Focar janela
    this.focusWindow(windowId);

    return windowEl;
  }

  makeWindowDraggable(windowId) {
    const window = this.windows.get(windowId).element;
    const header = window.querySelector('.window-header');
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('.window-controls')) return;
      
      isDragging = true;
      const rect = window.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      
      window.classList.add('dragging');
      this.focusWindow(windowId);

      const mouseMoveHandler = (e) => {
        if (!isDragging) return;
        
        const newX = e.clientX - offsetX;
        const newY = e.clientY - offsetY;

        // Limitar dentro da viewport (considerando o taskbar)
        const maxX = window.parentElement.clientWidth - window.offsetWidth;
        const maxY = window.parentElement.clientHeight - window.offsetHeight;

        window.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
        window.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';
      };

      const mouseUpHandler = () => {
        isDragging = false;
        window.classList.remove('dragging');
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
      };

      document.addEventListener('mousemove', mouseMoveHandler);
      document.addEventListener('mouseup', mouseUpHandler);
    });
  }

  makeWindowResizable(windowId) {
    const window = this.windows.get(windowId).element;
    const resizeHandle = window.querySelector('.window-resize-handle');
    let isResizing = false;
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;

    resizeHandle.addEventListener('mousedown', (e) => {
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startWidth = window.offsetWidth;
      startHeight = window.offsetHeight;

      window.classList.add('resizing');
      this.focusWindow(windowId);

      const mouseMoveHandler = (e) => {
        if (!isResizing) return;

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        const newWidth = Math.max(320, startWidth + deltaX);
        const newHeight = Math.max(240, startHeight + deltaY);

        window.style.width = newWidth + 'px';
        window.style.height = newHeight + 'px';
      };

      const mouseUpHandler = () => {
        isResizing = false;
        window.classList.remove('resizing');
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
      };

      document.addEventListener('mousemove', mouseMoveHandler);
      document.addEventListener('mouseup', mouseUpHandler);
    });
  }

  setupWindowControls(windowId) {
    const window = this.windows.get(windowId).element;
    const closeBtn = window.querySelector('.window-btn.close');
    const minimizeBtn = window.querySelector('.window-btn.minimize');
    const maximizeBtn = window.querySelector('.window-btn.maximize');

    closeBtn.addEventListener('click', () => this.closeWindow(windowId));
    minimizeBtn.addEventListener('click', () => this.minimizeWindow(windowId));
    maximizeBtn.addEventListener('click', () => this.maximizeWindow(windowId));
  }

  focusWindow(windowId) {
    if (this.activeWindow === windowId) return;

    // Desfocar anterior
    if (this.activeWindow && this.windows.has(this.activeWindow)) {
      this.windows.get(this.activeWindow).element.classList.remove('active');
    }

    // Focar nova
    const window = this.windows.get(windowId);
    if (window) {
      window.element.classList.add('active');
      window.element.style.zIndex = ++this.zIndexCounter;
      this.activeWindow = windowId;

      // Atualizar taskbar
      document.querySelectorAll('.taskbar-item').forEach(item => {
        item.classList.remove('active');
      });
      document.querySelector(`.taskbar-item[data-window-id="${windowId}"]`)?.classList.add('active');
    }
  }

  minimizeWindow(windowId) {
    const window = this.windows.get(windowId);
    window.minimized = !window.minimized;
    window.element.classList.toggle('minimized');
    
    if (!window.minimized) {
      this.focusWindow(windowId);
    }
  }

  maximizeWindow(windowId) {
    const window = this.windows.get(windowId);
    window.maximized = !window.maximized;
    window.element.classList.toggle('maximized');
  }

  closeWindow(windowId) {
    const window = this.windows.get(windowId);
    window.element.classList.add('closing');
    
    setTimeout(() => {
      window.element.remove();
      this.windows.delete(windowId);
      this.removeFromTaskbar(windowId);
      
      // Focar próxima janela disponível
      if (this.windows.size > 0) {
        const remainingIds = Array.from(this.windows.keys());
        this.focusWindow(remainingIds[remainingIds.length - 1]);
      } else {
        this.activeWindow = null;
      }
    }, 250);
  }

  addToTaskbar(windowId, title) {
    if (!this.taskbar) {
      // No layout atual (dock GNOME-like) o taskbar clássico pode não existir.
      // Evita quebrar a abertura de janelas quando #taskbar-items está ausente.
      return;
    }
    const taskbarItem = document.createElement('div');
    taskbarItem.classList.add('taskbar-item');
    taskbarItem.dataset.windowId = windowId;
    taskbarItem.innerHTML = `
      <span class="taskbar-label">${title}</span>
    `;

    taskbarItem.addEventListener('click', () => {
      const window = this.windows.get(windowId);
      if (window.minimized) {
        this.minimizeWindow(windowId);
      } else if (this.activeWindow === windowId) {
        this.minimizeWindow(windowId);
      } else {
        this.focusWindow(windowId);
      }
    });

    this.taskbar.appendChild(taskbarItem);
  }

  removeFromTaskbar(windowId) {
    document.querySelector(`.taskbar-item[data-window-id="${windowId}"]`)?.remove();
  }
}
