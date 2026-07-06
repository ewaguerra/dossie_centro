(function () {
  window.MAPA_SP_UI_TEXTS = {
    searchPlaceholder: "Filtrar protocolos de evidência...",
    buttons: {
      clear: "Purgar",
      open: "Exumar",
      close: "Selar",
      explain: "Descodificar?"
    },
    status: {
      loadingCatalog: "Sincronizando banco de dados soterrados..."
    },
    empty: {
      noLayersFound: "Nenhum rastro detectado no setor."
    },
    errors: {
      catalogLoad: "FALHA CRÍTICA: Erro ao sincronizar catálogo."
    },
    globalToggle: {
      label: "Interpolar camadas de superfície e transversais"
    },
    layerCard: {
      features: "rastros",
      size: "Densidade",
      type: "Natureza",
      spatialExtent: "Raio de incidência",
      hasBbox: "com delimitação",
      noBbox: "sem delimitação"
    },
    inspector: {
      kicker: "Sinal Identificado",
      title: "Relatório de Evidência"
    },
    sidebar: {
      tabs: {
        territorio: "Território",
        evidencias: "Evidências",
        fases: "13 Almas",
        visualizacao: "Visualização"
      },
      intro: {
        territorio:
          "Operador: interpole camadas de superfície — bairros, rios soterrados, zoneamento, risco. Marque o que ainda resiste no mapa-base. Nódulos clicáveis → aba Evidências.",
        evidencias:
          "Sinais recuperados no terreno: património, turismo, pistas da Rua São Bento. Filtre por temática — decodifique o que importa, silencie o ruído abaixo.",
        fases:
          "Registo das 13 Almas — fases do Protocolo. Cada alma cruzada libera rastros no Território, sinais em Evidências e instrumentos em Visualização.",
        visualizacao:
          "Instrumentos forenses: maquete estrutural 3D e corte subterrâneo (Fase 7 — Rasgue o Asfalto). Ative quando tiver clearance para ver o que a cidade enterrou."
      },
      meta: {
        layers: "21 camadas",
        sections: "3 secções",
        themes: "6 temas evidência"
      },
      vizCards: {
        maquete3d: {
          title: "Maquete 3D",
          desc: "Relevo estrutural dos edifícios — leitura de altura sobre o tecido urbano."
        },
        missaoFase7: {
          title: "Missão Fase 7 — Rasgue o Asfalto",
          desc: "Visão subterrânea, corte vertical e colecta das 13 almas soterradas."
        }
      },
      pistasToggle: "Exibir rastros RSB no mapa (Rua São Bento)",
      poiLegendHint: "Marque só as temáticas que quer decodificar no mapa."
    },
    help: {
      lines: [
        "PROTOCOL ALPHA-09: Sistema de Visualização Forense",
        "",
        "- Território: camadas de superfície — bairros, rios soterrados, zoneamento, risco",
        "- Evidências: nódulos no mapa — património, turismo, rastros Rua São Bento",
        "- 13 Almas: registo das Almas e clearance do Protocolo",
        "- Visualização: maquete 3D e corte subterrâneo (Fase 7)",
        "- Relatórios: Transcrição de metadados recuperados",
        "",
        "Raiz visual = Topografia de superfície",
        "Nódulo temático = Registos de soterramento",
        "Relatório técnico = Propriedades da evidência",
        "Knowledge.js = A voz do Arquivista"
      ]
    },
    keyboardShortcuts: {
      toggleSidebar: "S — abrir/fechar painel de camadas"
    }
  };
})();
