(function() {
  "use strict";

  // ── Instâncias de Sistema ──────────────────────────────────────────
  const windowManager = new WindowManager();
  const effects = new DesktopEffects();

  // ── Estado Global ──────────────────────────────────────────────────
  let isNightMode = false;
  let isTyping = false;
  let attempts = parseInt(localStorage.getItem('arquivista_attempts') || '0');
  let lockTime = parseInt(localStorage.getItem('arquivista_lockTime') || '0');

  // ── Eventos de Integração Linux ──────────────────────────────────────
  window.addEventListener('open-app', (e) => {
    openApplication(e.detail.app);
  });

  // ── Sidebar e Abertura de Apps ───────────────────────────────────────
  // Mantemos para compatibilidade se houver elementos legados
  document.querySelectorAll('.desktop-icon').forEach(icon => {
    icon.addEventListener('click', () => {
      const app = icon.dataset.app;
      openApplication(app);
    });
  });

  function openApplication(app) {
    if (typeof window.openArquivistaApplication === 'function') {
      window.openArquivistaApplication(app, {
        windowManager: windowManager,
        renderClues: renderClues,
        setupPhotosApp: setupPhotosApp,
        setupWordApp: setupWordApp,
        setupTerminal: setupTerminal,
      });
    }
  }

  // ... (rest of the file remains same, except removing the old login listener)

  // ── Aplicação: Dossiê (Explorador de Ficheiros) ───────────────────────
  function renderClues() {
    const grid = document.getElementById('clues-grid');
    if (!grid) {
      console.warn('[Arquivista] #clues-grid não encontrado. O template do dossiê pode não ter sido montado.');
      return;
    }
    grid.innerHTML = '';

    /* ── SVGs inline por categoria ────────────────────────────────── */
    const ICONS = {
      folder: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>`,
      lock:   `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/><circle cx="12" cy="14" r="2"/><path d="M12 12v-2"/></svg>`,
      warn:   `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/><path d="M12 10v4"/><path d="M12 16h.01"/></svg>`,
      search: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/><circle cx="13" cy="14" r="2"/><path d="m15.5 16.5 1.5 1.5"/></svg>`,
      archive:`<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/><path d="M9 13h6"/></svg>`,
      git:    `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/><circle cx="11" cy="14" r="1"/><path d="M11 13V9"/><path d="M13 14h2"/></svg>`,
      map:    `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/><path d="m9 14 5-5"/><path d="m9 9 5 5"/></svg>`,
    };

    /* ── Cores por categoria ─────────────────────────────────────── */
    const CAT_COLOR = {
      folder:  '#00ff41',
      lock:    '#ff003c',
      warn:    '#ffeb3b',
      search:  '#00f3ff',
      archive: '#9d4edd',
      git:     '#f59e0b',
      map:     '#3b82f6',
    };

    /* ── 85 Pastas narrativas com categoria ─────────────────────── */
    const FOLDERS = [
      // ── NÍVEL 0: Arquivos Gerais (1-15) ─────────────────────────
      { n:'ANHANGABAÚ_ORIG',   cat:'folder'  },
      { n:'RIOS_INVISÍVEIS',   cat:'map'     },
      { n:'PLANTA_1905',       cat:'archive' },
      { n:'SARACURA_ENTUBADA', cat:'warn'    },
      { n:'TAMANDUATEÍ_PRÉ',  cat:'folder'  },
      { n:'OPERAÇÃO_TAMPÃO',   cat:'lock'    },
      { n:'TIBIRIÇÁ_DEPOS',   cat:'folder'  },
      { n:'RIO_DO_CARMO',      cat:'map'     },
      { n:'RIACHO_BEXIGA',     cat:'search'  },
      { n:'CÓRREGO_SARACURA',  cat:'archive' },
      { n:'PIRATININGA_1554',  cat:'git'     },
      { n:'ALDEIA_TEJUPARÉ',   cat:'folder'  },
      { n:'JESUITAS_MAPA',     cat:'archive' },
      { n:'BEXIGA_COTAS',      cat:'map'     },
      { n:'ANHANGUERA_ROTA',   cat:'folder'  },
      // ── NÍVEL 1: Documentos Classificados (16-30) ───────────────
      { n:'COMISSÃO_ALINHAMENTO', cat:'lock' },
      { n:'PROTOCOLO_1554',    cat:'lock'    },
      { n:'PROTOCOLO_1822',    cat:'lock'    },
      { n:'PROTOCOLO_1897',    cat:'warn'    },
      { n:'PROTOCOLO_1945',    cat:'warn'    },
      { n:'PROTOCOLO_1972',    cat:'lock'    },
      { n:'PROTOCOLO_2026',    cat:'warn'    },
      { n:'DOSSIÊ_GUARDIÃO',  cat:'lock'    },
      { n:'TAMPA_CENTRAL_SP',  cat:'lock'    },
      { n:'CONTENÇÃO_TELÚRICA',cat:'warn'    },
      { n:'FREQUÊNCIA_444HZ',  cat:'search'  },
      { n:'MAPA_PRESSÃO_SUB',  cat:'map'     },
      { n:'LINHAS_FORÇA_XVYZ', cat:'git'     },
      { n:'CONVERGÊNCIA_0000', cat:'lock'    },
      { n:'GUARDIÃO_COORD_GPS',cat:'map'     },
      // ── NÍVEL 2: Rios e Hidrografia (31-45) ─────────────────────
      { n:'TIETÊ_RETIFICAÇÃO', cat:'archive' },
      { n:'PINHEIROS_CANAL',   cat:'archive' },
      { n:'BILLINGS_REPRESA',  cat:'folder'  },
      { n:'GUARAPIRANGA_1906', cat:'folder'  },
      { n:'CABUÇU_SUMIÇO',    cat:'search'  },
      { n:'ARICANDUVA_FRAG',   cat:'warn'    },
      { n:'MOOCA_BARRAGEM',    cat:'archive' },
      { n:'RIACHO_IPIRANGA',   cat:'folder'  },
      { n:'CÓRREGO_CONSOLAÇÃO',cat:'map'     },
      { n:'ÁGUA_VERDE_OCULTA', cat:'search'  },
      { n:'RIBEIRÃO_VERMELHO', cat:'warn'    },
      { n:'LAVAPÉS_ENTUBADO',  cat:'archive' },
      { n:'JACEGUAI_PERDIDO',  cat:'search'  },
      { n:'PEDREGULHO_CANAL',  cat:'folder'  },
      { n:'JURUBATUBA_ANTIGO', cat:'map'     },
      // ── NÍVEL 3: Incidentes e Eventos (46-60) ───────────────────
      { n:'INCIDENTE_JOELMA_74',   cat:'warn' },
      { n:'INCIDENTE_EDIFÍCIO_SP', cat:'warn' },
      { n:'RACHADURAS_2019',       cat:'warn' },
      { n:'ENCHENTE_1929',         cat:'archive'},
      { n:'ENCHENTE_1983',         cat:'archive'},
      { n:'ENCHENTE_2010',         cat:'archive'},
      { n:'SINAL_PERDIDO_0113',    cat:'lock'  },
      { n:'RESPOSTA_TELÚRICA_V3',  cat:'git'   },
      { n:'ANOMALIA_MAGNÉTICA',    cat:'search' },
      { n:'DESAPARECIDOS_1992',    cat:'lock'  },
      { n:'RUMOR_SUBTERRÂNEO',    cat:'search' },
      { n:'ECOS_DO_CONCRETO',      cat:'git'   },
      { n:'CAVIDADE_SEDES',        cat:'warn'  },
      { n:'VIBRAÇÃO_ANHANGABAÚ',   cat:'git'   },
      { n:'OSCILAÇÃO_1985',        cat:'archive'},
      // ── NÍVEL 4: Pessoas e Entidades (61-75) ────────────────────
      { n:'MATO_GROSSO_IDENT',  cat:'lock'   },
      { n:'JOCA_CANTOR_1951',   cat:'folder' },
      { n:'RUA_AURORA_DEPOIM',  cat:'search' },
      { n:'MORADOR_ANHANGABAÚ', cat:'folder' },
      { n:'COMISSÁRIOS_LISTA',  cat:'lock'   },
      { n:'ENGENHEIROS_1897',   cat:'archive'},
      { n:'AGENTES_TAMPÃO',     cat:'lock'   },
      { n:'SACERDOTISA_13',     cat:'lock'   },
      { n:'GUARDIÃO_ARQUIVOS',  cat:'git'    },
      { n:'O_SOTERRADO_001',    cat:'warn'   },
      { n:'O_SOTERRADO_002',    cat:'warn'   },
      { n:'O_SOTERRADO_003',    cat:'warn'   },
      { n:'VÍTIMA_SEM_NOME_77', cat:'lock'   },
      { n:'TESTEMUNHA_RAUA',    cat:'search' },
      { n:'FONTE_ANÔNIMA_XT9',  cat:'git'    },
      // ── NÍVEL 5: Dados Geoespaciais (76-85) ─────────────────────
      { n:'GEOJSON_CENTRO_SP',  cat:'map'    },
      { n:'GEOJSON_RIOS_1900',  cat:'map'    },
      { n:'OVERLAY_HISTÓRICO',  cat:'map'    },
      { n:'COORDENADAS_TAMPA',  cat:'map'    },
      { n:'HEATMAP_PRESSÃO',    cat:'git'    },
      { n:'LIDAR_SUBSOLO_2024', cat:'archive'},
      { n:'RASTER_1954_AEREO',  cat:'archive'},
      { n:'VETORIAL_IGREJAS',   cat:'folder' },
      { n:'SHAPEFILE_ANTIGO',   cat:'git'    },
      { n:'CORRUPÇÃO_777',      cat:'warn'   },
    ];

    const ALMA_COLORS = [
      '#ff003c', '#ff6b00', '#ffeb3b', '#8bc34a', '#00ff41', '#00f3ff', '#3b82f6',
      '#7c4dff', '#9d4edd', '#ff4d9d', '#ff8a65', '#ffd54f', '#66bb6a'
    ];
    const ALMA_COUNT = 13;
    const ALMAS = Array.from({ length: ALMA_COUNT }, (_, i) => ({
      n: i === 0 ? 'ALMA_01' : `alma_${i + 1}`,
      cat: 'folder',
      color: ALMA_COLORS[i % ALMA_COLORS.length],
      type: 'alma',
      children: []
    }));

    // Distribuição temática:
    // alma_1..5  -> níveis narrativos 0..4 (15 pastas cada)
    // alma_6     -> nível 5 (dados geoespaciais, 10 pastas)
    // alma_7..13 -> clusters por categoria (folder, lock, warn, search, archive, git, map)
    FOLDERS.forEach((folder, idx) => {
      const item = { ...folder, type: 'folder' };
      if (idx <= 14) { ALMAS[0].children.push(item); return; }   // nível 0
      if (idx <= 29) { ALMAS[1].children.push(item); return; }   // nível 1
      if (idx <= 44) { ALMAS[2].children.push(item); return; }   // nível 2
      if (idx <= 59) { ALMAS[3].children.push(item); return; }   // nível 3
      if (idx <= 74) { ALMAS[4].children.push(item); return; }   // nível 4
      if (idx <= 84) { ALMAS[5].children.push(item); return; }   // nível 5

      const catToAlma = {
        folder: 6,
        lock: 7,
        warn: 8,
        search: 9,
        archive: 10,
        git: 11,
        map: 12
      };
      const almaIdx = catToAlma[item.cat] ?? 12;
      ALMAS[almaIdx].children.push(item);
    });

    // Duplicação temática por categoria nas almas 7..13 para consulta cruzada.
    FOLDERS.forEach((folder) => {
      const item = { ...folder, type: 'folder' };
      const catToAlma = {
        folder: 6,
        lock: 7,
        warn: 8,
        search: 9,
        archive: 10,
        git: 11,
        map: 12
      };
      const almaIdx = catToAlma[item.cat] ?? 12;
      ALMAS[almaIdx].children.push(item);
    });

    let selectedCount = 0;
    let currentView = 'root'; // root | alma
    let currentAlmaIndex = -1;
    let currentItems = ALMAS;

    function updatePath() {
      const pathActive = document.querySelector('.fe-path-active');
      if (!pathActive) return;
      pathActive.textContent = currentView === 'root'
        ? 'Dossiê_Oficial'
        : `Dossiê_Oficial › ${ALMAS[currentAlmaIndex].n}`;
    }

    function updateCount(visible) {
      const countEl = document.getElementById('fe-status-count');
      if (countEl) countEl.textContent = `${visible} objectos`;
    }

    function clearSelection() {
      selectedCount = 0;
      updateStatusBar(selectedCount);
    }

    function renderCurrentItems() {
      grid.innerHTML = '';
      clearSelection();

      currentItems.forEach((f, idx) => {
        const color = f.color || CAT_COLOR[f.cat] || '#00ff41';
        const item = document.createElement('div');
        item.className = 'fe-folder-item';
        item.dataset.name = f.n.toLowerCase();
        item.dataset.idx = idx;
        const label = f.type === 'alma' ? `${f.n} (${f.children.length})` : f.n;
        item.innerHTML = `
          <div class="fe-folder-icon" style="color:${color}">
            ${ICONS[f.cat] || ICONS.folder}
          </div>
          <span class="fe-folder-name">${label}</span>
        `;

        item.addEventListener('click', (e) => {
          if (!e.ctrlKey && !e.metaKey) {
            grid.querySelectorAll('.fe-folder-item.selected').forEach(el => el.classList.remove('selected'));
            selectedCount = 0;
          }
          const wasSelected = item.classList.contains('selected');
          item.classList.toggle('selected', !wasSelected);
          selectedCount += wasSelected ? -1 : 1;
          updateStatusBar(selectedCount);
        });

        item.addEventListener('dblclick', () => {
          item.classList.add('fe-folder-opening');
          setTimeout(() => item.classList.remove('fe-folder-opening'), 500);

          if (f.type === 'alma') {
            // ALMA_01 requer codinome antes de abrir
            if (f.n === 'ALMA_01') {
              openAlma01Modal(() => {
                currentView = 'alma';
                currentAlmaIndex = idx;
                currentItems = ALMAS[idx].children;
                updatePath();
                renderCurrentItems();
              });
              return;
            }
            currentView = 'alma';
            currentAlmaIndex = idx;
            currentItems = ALMAS[idx].children;
            updatePath();
            renderCurrentItems();
          }

          if (window.ReactBitsEffects) window.ReactBitsEffects.triggerAllGlitches();
        });

        grid.appendChild(item);
      });

      updateCount(currentItems.length);
    }

    renderCurrentItems();
    console.log(`[Arquivista] renderClues concluído: ${ALMAS.length} almas e ${FOLDERS.length} pastas distribuídas.`);

    const backBtn = document.querySelector('.fe-nav-btn[title="Voltar"]');
    if (backBtn) {
      backBtn.disabled = currentView === 'root';
      backBtn.onclick = () => {
        if (currentView === 'alma') {
          currentView = 'root';
          currentAlmaIndex = -1;
          currentItems = ALMAS;
          updatePath();
          renderCurrentItems();
          backBtn.disabled = true;
        }
      };
    }

    updatePath();

    const searchInput = document.getElementById('fe-search-input');
    if (searchInput) {
      searchInput.value = '';
      searchInput.addEventListener('input', () => {
        const q = searchInput.value.toLowerCase();
        let visible = 0;
        grid.querySelectorAll('.fe-folder-item').forEach(el => {
          const match = el.dataset.name.includes(q);
          el.style.display = match ? '' : 'none';
          if (match) visible++;
        });
        updateCount(visible);
      });
    }

    document.querySelectorAll('.fe-view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.fe-view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const view = btn.dataset.view;
        grid.classList.toggle('fe-list', view === 'list');
        grid.classList.toggle('fe-grid-view', view === 'grid');
      });
    });

    function updateStatusBar(count) {
      const el = document.getElementById('fe-status-selected');
      if (el) el.textContent = `${count} seleccionado${count !== 1 ? 's' : ''}`;
    }

    const selectAllBtn = document.getElementById('fe-select-all');
    if (selectAllBtn) {
      selectAllBtn.addEventListener('click', () => {
        const visible = Array.from(grid.querySelectorAll('.fe-folder-item')).filter(el => el.style.display !== 'none');
        const allSelected = visible.every(el => el.classList.contains('selected'));
        visible.forEach(el => el.classList.toggle('selected', !allSelected));
        selectedCount = allSelected ? 0 : visible.length;
        updateStatusBar(selectedCount);
      });
    }
  }


  // ── Aplicação: Fotos ────────────────────────────────────────────────
  function setupPhotosApp() {
    const win = document.querySelector('[data-window-id="win-fotos"]');
    if (!win) return;

    win.querySelectorAll('.folder-item').forEach(item => {
      item.addEventListener('click', () => {
        const action = item.dataset.action;
        if (action === 'deny') {
          const msg = item.querySelector('.locked-msg');
          msg.style.opacity = '1';
          setTimeout(() => msg.style.opacity = '0', 800);
          win.classList.add('glitching');
          setTimeout(() => win.classList.remove('glitching'), 300);
        } else if (action === 'reveal') {
          win.querySelector('#folder-view').classList.add('hidden');
          win.querySelector('#image-display').classList.remove('hidden');
        }
      });
    });

    win.querySelector('#reset-gallery').addEventListener('click', () => {
      win.querySelector('#folder-view').classList.remove('hidden');
      win.querySelector('#image-display').classList.add('hidden');
    });
  }

  // ── Aplicação: Word ─────────────────────────────────────────────────
  function setupWordApp() {
    const win = document.querySelector('[data-window-id="win-codinomes"]');
    if (!win) return;

    win.querySelector('#unlock-word').addEventListener('click', () => {
      const pass = win.querySelector('#wordPass').value;
      if (pass.toUpperCase() === 'ANHANGA') {
        win.querySelector('#word-overlay').classList.add('hidden');
        win.querySelector('.blur-text').classList.remove('opacity-10');
      } else {
        win.querySelector('#word-err').classList.remove('hidden');
        win.classList.add('glitching');
        setTimeout(() => win.classList.remove('glitching'), 300);
      }
    });
  }



  // ── Aplicação: Terminal ─────────────────────────────────────────────
  function setupTerminal() {
    const win = document.querySelector('[data-window-id="win-terminal"]');
    if (!win) return;

    const input = win.querySelector('#cmdInput');
    const output = win.querySelector('#term-output');
    input.focus();

    // Interface para Operation13Almas
    const terminalInterface = {
      println: async (text, type) => {
        let color = "#aaa";
        if (type === 'system') color = "#00ff41";
        if (type === 'success') color = "#00ff41";
        if (type === 'error') color = "#ff003c";
        if (type === 'hint') color = "#ffeb3b";
        if (type === 'warning') color = "#ff9800";
        if (type === 'output') color = "#fff";
        
        await typeWriter(output, text, color);
      },
      /**
       * Cria e appenda a linha no terminal sem animação de typewriter,
       * retornando o elemento DOM para que o DecryptedText possa animá-lo.
       */
      printlnEl: (text, type) => {
        let color = "#aaa";
        const baseType = type.split(' ')[0];
        if (baseType === 'system') color = "#00ff41";
        if (baseType === 'success') color = "#00ff41";
        if (baseType === 'error') color = "#ff003c";
        if (baseType === 'hint') color = "#ffeb3b";
        if (baseType === 'warning') color = "#ff9800";
        if (baseType === 'output') color = "#fff";

        const line = document.createElement('div');
        line.style.color = color;
        line.style.fontFamily = 'monospace';
        line.style.fontSize = '11px';
        line.style.lineHeight = '1.6';
        line.style.whiteSpace = 'pre';
        // Adiciona classes extras de tipo (ex: terminal-line-decrypting)
        const extraClasses = type.split(' ').slice(1);
        if (extraClasses.length) line.classList.add(...extraClasses);
        line.textContent = text;
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
        return line;
      },
      animateLoading: async (text, dots, callback) => {
        await typeWriter(output, text, "#00ff41");
        if (callback) await callback();
      }
    };

    let operation = null;

    input.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter' && !isTyping) {
        const commandLine = input.value.trim();
        if (commandLine === '') return;

        const parts = commandLine.split(/\s+/);
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);

        const echo = document.createElement('div');
        echo.innerHTML = `<span class="text-red-500 font-bold">root@sys></span> <span class="text-white">${commandLine}</span>`;
        output.appendChild(echo);
        input.value = '';

        if (cmd === 'help') {
          await terminalInterface.println('COMANDOS DISPONÍVEIS:', 'system');
          await terminalInterface.println('  help           - Listar operações.', 'output');
          await terminalInterface.println('  run [script]   - Executar script de hacking.', 'output');
          await terminalInterface.println('  summon [alma]  - Invocar alma (requer run 13).', 'output');
          await terminalInterface.println('  status         - Status do sistema.', 'output');
          await terminalInterface.println('  clear          - Limpar buffer.', 'output');
        } 
        else if (cmd === 'clear') {
          output.innerHTML = '';
        } 
        else if (cmd === 'status') {
          if (operation) {
            const s = operation.getStatus();
            await terminalInterface.println(`┌─ STATUS DO SISTEMA ─┐`, 'system');
            await terminalInterface.println(`│ Invocada: ${s.invoked ? 'SIM' : 'NÃO'}`, 'output');
            await terminalInterface.println(`│ Progresso: ${s.progress}`, 'output');
            await terminalInterface.println(`└─────────────────────┘`, 'system');
          } else {
            await terminalInterface.println('Sistema nominal. Nenhuma operação ativa.', 'output');
          }
        }
        else if (cmd === 'run') {
          const scriptName = args.join(' ').toUpperCase();
          if (scriptName === 'OPERATION_13ALMAS' || scriptName === '13' || scriptName === 'ALMAS') {
            await terminalInterface.println('PREPARANDO INVOCAÇÃO...', 'system');
            operation = new window.Operation13Almas(terminalInterface);
            await operation.invoke();
          } else {
            await terminalInterface.println(`Script '${scriptName}' não encontrado.`, 'error');
            await terminalInterface.println('DICA: Procure no ficheiro "Protocolo 1554"', 'hint');
          }
        }
        else if (cmd === 'summon') {
          if (!operation) {
            await terminalInterface.println('ERRO: Nenhuma operação ativa. Use: run 13', 'error');
          } else {
            const alma = args.join(' ');
            if (alma === 'all' || alma === '') {
              await operation.summonAll();
            } else {
              await operation.summon(alma);
            }
          }
        }
        else if (cmd === 'ping') {
          await terminalInterface.println(`Rastreando ${args[0] || 'alvo'}...`, 'output');
          await terminalInterface.println("Resposta de 200.144.32.10: bytes=32 tempo=14ms TTL=54", 'hint');
        }
        else {
          await terminalInterface.println(`Comando desconhecido: '${cmd}'.`, 'error');
        }
        
        output.scrollTop = output.scrollHeight;
      }
    });
  }

  async function typeWriter(container, text, color) {
    isTyping = true;
    const line = document.createElement('div');
    line.style.color = color;
    line.style.marginTop = '4px';
    container.appendChild(line);

    for (let i = 0; i < text.length; i++) {
      line.innerHTML += text.charAt(i);
      container.scrollTop = container.scrollHeight;
      await new Promise(r => setTimeout(r, 15));
    }
    isTyping = false;
  }

  // ── ALMA_01 — Modal de codinome ────────────────────────────────────
  function openAlma01Modal(onSuccess) {
    // Remove modal anterior se existir
    const old = document.getElementById('alma01-modal');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = 'alma01-modal';
    overlay.className = 'alma01-overlay';
    overlay.innerHTML = `
      <div class="alma01-box">
        <div class="alma01-header">
          <span class="alma01-badge">⬤ ACESSO RESTRITO</span>
          <span class="alma01-folder">📁 ALMA_01</span>
        </div>
        <p class="alma01-pergunta">
          Você encontrou a pasta.<br>
          Mas o sistema exige confirmação de identidade.<br><br>
          <em>Em qual estabelecimento do Vale do Anhangabaú
          você encontrou o selo físico do Protocolo?</em>
        </p>
        <div class="alma01-form">
          <label class="alma01-label" for="alma01-input">CODINOME DO LOCAL</label>
          <input
            id="alma01-input"
            class="alma01-input"
            type="text"
            placeholder="Digite o codinome…"
            autocomplete="off"
            spellcheck="false"
            maxlength="40"
          />
          <button class="alma01-btn" id="alma01-confirmar">CONFIRMAR</button>
        </div>
        <p class="alma01-erro" id="alma01-erro" aria-live="polite"></p>
        <button class="alma01-fechar" id="alma01-fechar" title="Cancelar">✕ cancelar</button>
      </div>
    `;
    document.body.appendChild(overlay);

    const input  = overlay.querySelector('#alma01-input');
    const btnOk  = overlay.querySelector('#alma01-confirmar');
    const erro   = overlay.querySelector('#alma01-erro');
    const fechar = overlay.querySelector('#alma01-fechar');

    input.focus();

    function tentar() {
      const val = input.value.trim().toUpperCase().replace(/[\s\-]+/g, '_');
      const aceito = val === 'CAFE_PARCEIRO'
        || val === 'ARQ_ALMA_01_CODENOME_CAFE_PARCEIRO'
        || val.endsWith('CAFE_PARCEIRO');
      if (aceito) {
        overlay.remove();
        openImageViewer('/landing/assets/codinome_cafe_parceiro.png', 'CODINOME_CAFE_PARCEIRO');
        onSuccess();
      } else {
        erro.textContent = 'CODINOME INVÁLIDO — verifique o selo e tente novamente.';
        erro.classList.remove('alma01-shake');
        void erro.offsetWidth;
        erro.classList.add('alma01-shake');
        input.select();
        if (window.ReactBitsEffects) window.ReactBitsEffects.triggerAllGlitches();
      }
    }

    btnOk.addEventListener('click', tentar);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') tentar(); });
    fechar.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  }

  // ── Viewer de imagem com canvas (zoom / rotação / fechar) ───────────
  function openImageViewer(src, titulo) {
    const old = document.getElementById('img-viewer-overlay');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = 'img-viewer-overlay';
    overlay.className = 'imgv-overlay';
    overlay.innerHTML = `
      <div class="imgv-box">
        <div class="imgv-toolbar">
          <span class="imgv-titulo">${titulo}</span>
          <div class="imgv-controls">
            <button class="imgv-btn" id="imgv-zoom-in"  title="Zoom +">＋</button>
            <button class="imgv-btn" id="imgv-zoom-out" title="Zoom −">－</button>
            <button class="imgv-btn" id="imgv-rot-l"    title="Girar esquerda">↺</button>
            <button class="imgv-btn" id="imgv-rot-r"    title="Girar direita">↻</button>
            <button class="imgv-btn" id="imgv-reset"    title="Resetar">⊙</button>
            <button class="imgv-btn imgv-btn--close" id="imgv-fechar" title="Fechar">✕</button>
          </div>
        </div>
        <div class="imgv-stage" id="imgv-stage">
          <canvas id="imgv-canvas" class="imgv-canvas"></canvas>
          <div class="imgv-lanterna" id="imgv-lanterna"></div>
          <span class="imgv-pista-palavra" data-pista="0" style="top:18%;left:12%;transform:rotate(-8deg)">VIADUTO</span>
          <span class="imgv-pista-palavra" data-pista="1" style="top:55%;left:47%;transform:rotate(5deg)">DO</span>
          <span class="imgv-pista-palavra" data-pista="2" style="top:78%;left:71%;transform:rotate(-3deg)">CHÁ</span>
        </div>
        <div class="imgv-rodape">
          <p class="imgv-hint">Scroll: zoom &nbsp;|&nbsp; Arraste: mover &nbsp;|&nbsp; Shift+Scroll: rotacionar</p>
          <p class="imgv-enigma">
            <span class="imgv-enigma__icone">🔦</span>
            <span class="imgv-enigma__texto">O registro foi corrompido. Três fragmentos do nome verdadeiro foram dispersos na imagem. Mova a lanterna sobre as sombras — o que estava soterrado ainda pulsa sob a superfície.</span>
          </p>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const canvas  = overlay.querySelector('#imgv-canvas');
    const ctx     = canvas.getContext('2d');
    const img     = new Image();

    let scale  = 1;
    let angle  = 0;   // graus
    let tx     = 0;   // offset x
    let ty     = 0;   // offset y
    let drag   = false;
    let lastX  = 0;
    let lastY  = 0;

    function resize() {
      const box = overlay.querySelector('.imgv-box');
      const w = box.clientWidth  || 800;
      const h = box.clientHeight || 560;
      canvas.width  = w;
      canvas.height = Math.max(h - 48 - 24, 200); // toolbar(44) + hint(24)
    }

    function draw() {
      if (!img.complete || !img.naturalWidth) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2 + tx, canvas.height / 2 + ty);
      ctx.rotate(angle * Math.PI / 180);
      ctx.scale(scale, scale);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
    }

    img.onload = () => {
      // Aguarda dois frames para o DOM ter dimensionado o canvas
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resize();
          const maxW = canvas.width  * 0.85;
          const maxH = canvas.height * 0.85;
          scale = Math.min(maxW / img.width, maxH / img.height, 1);
          tx = 0; ty = 0;
          draw();
        });
      });
    };
    img.onerror = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff003c';
      ctx.font = '13px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('ERRO: imagem não encontrada — ' + src, canvas.width / 2, canvas.height / 2);
    };
    img.crossOrigin = 'anonymous';
    img.src = src;

    window.addEventListener('resize', () => { resize(); draw(); });

    // Botões
    overlay.querySelector('#imgv-zoom-in').addEventListener('click',  () => { scale = Math.min(scale * 1.25, 8); draw(); });
    overlay.querySelector('#imgv-zoom-out').addEventListener('click', () => { scale = Math.max(scale / 1.25, 0.05); draw(); });
    overlay.querySelector('#imgv-rot-l').addEventListener('click',    () => { angle -= 15; draw(); });
    overlay.querySelector('#imgv-rot-r').addEventListener('click',    () => { angle += 15; draw(); });
    overlay.querySelector('#imgv-reset').addEventListener('click',    () => { scale = Math.min((canvas.width * 0.85) / img.width, (canvas.height * 0.85) / img.height, 1); angle = 0; tx = 0; ty = 0; draw(); });
    overlay.querySelector('#imgv-fechar').addEventListener('click',   () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    // Drag
    canvas.addEventListener('mousedown', (e) => { drag = true; lastX = e.clientX; lastY = e.clientY; canvas.style.cursor = 'grabbing'; });
    window.addEventListener('mouseup',   () => { drag = false; canvas.style.cursor = 'grab'; });
    window.addEventListener('mousemove', (e) => {
      if (!drag) return;
      tx += e.clientX - lastX;
      ty += e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      draw();
    });

    // Scroll: zoom ou rotação (Shift)
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.shiftKey) {
        angle += e.deltaY > 0 ? 5 : -5;
      } else {
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        scale = Math.max(0.05, Math.min(8, scale * factor));
      }
      draw();
    }, { passive: false });

    // Touch (mobile)
    let lastDist = 0;
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) { drag = true; lastX = e.touches[0].clientX; lastY = e.touches[0].clientY; }
      if (e.touches.length === 2) { lastDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); }
    }, { passive: true });
    canvas.addEventListener('touchend',  () => { drag = false; }, { passive: true });
    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && drag) {
        tx += e.touches[0].clientX - lastX;
        ty += e.touches[0].clientY - lastY;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
        draw();
      }
      if (e.touches.length === 2) {
        const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        if (lastDist) scale = Math.max(0.05, Math.min(8, scale * (dist / lastDist)));
        lastDist = dist;
        draw();
      }
    }, { passive: true });

    // ── Efeito Lanterna ──────────────────────────────────────────────
    const stage    = overlay.querySelector('#imgv-stage');
    const lanterna = overlay.querySelector('#imgv-lanterna');
    const palavras = Array.from(overlay.querySelectorAll('.imgv-pista-palavra'));
    const RAIO     = 72;

    function moveLanterna(x, y) {
      lanterna.style.setProperty('--lx', x + 'px');
      lanterna.style.setProperty('--ly', y + 'px');
      const sr = stage.getBoundingClientRect();
      palavras.forEach(el => {
        const r  = el.getBoundingClientRect();
        const cx = r.left - sr.left + r.width  / 2;
        const cy = r.top  - sr.top  + r.height / 2;
        el.classList.toggle('imgv-pista-palavra--revelada', Math.hypot(x - cx, y - cy) < RAIO);
      });
    }

    stage.addEventListener('mousemove', (e) => {
      const r = stage.getBoundingClientRect();
      moveLanterna(e.clientX - r.left, e.clientY - r.top);
    });
    stage.addEventListener('mouseleave', () => {
      lanterna.style.setProperty('--lx', '-9999px');
      lanterna.style.setProperty('--ly', '-9999px');
      palavras.forEach(el => el.classList.remove('imgv-pista-palavra--revelada'));
    });

    // Touch: lanterna segue o dedo
    stage.addEventListener('touchmove', (e) => {
      const r = stage.getBoundingClientRect();
      const t = e.touches[0];
      moveLanterna(t.clientX - r.left, t.clientY - r.top);
    }, { passive: true });
  }

  // ── Menu Iniciar e Temas ────────────────────────────────────────────
  const startBtn = document.getElementById('start-btn');
  const startMenu = document.getElementById('start-menu');
  const themeToggle = document.getElementById('theme-toggle');

  if (startBtn) {
    startBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      startMenu.classList.toggle('active');
    });
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      isNightMode = !isNightMode;
      document.body.classList.toggle('night-mode', isNightMode);
      themeToggle.innerText = isNightMode ? "☀️" : "🌙";
      effects.triggerSystemGlitch();
      renderClues();
    });
  }

  // ── Inicialização ──────────────────────────────────────────────────
  // (checkLock removido pois o linux-login lida com o estado inicial)

})();
