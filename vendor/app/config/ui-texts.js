(function () {
  window.MAPA_SP_UI_TEXTS = {
    searchPlaceholder: "Filtrar registros de evidência…",
    buttons: {
      clear: "Limpar filtro",
      open: "Exumar registro",
      close: "Sellar dossiê",
      explain: "Como decifrar?"
    },
    status: {
      loadingCatalog: "Sincronizando arquivo soterrado…"
    },
    empty: {
      noLayersFound: "Nenhum rastro localizado neste setor."
    },
    errors: {
      catalogLoad: "FALHA CRÍTICA: arquivo não sincronizou."
    },
    globalToggle: {
      label: "Sobrepor camadas de superfície e transversais"
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
      kicker: "Sinal identificado",
      title: "Relatório de evidência"
    },
    sidebar: {
      tabs: {
        territorio: "Território",
        evidencias: "Evidências",
        demo: "Demo",
        fases: "13 Almas",
        visualizacao: "Visualização"
      },
      intro: {
        territorio:
          "Operador: sobreponha camadas de superfície — bairros, rios soterrados, zoneamento, risco. Marque o que ainda aparece no mapa-base. Pontos no mapa levam à aba Evidências.",
        evidencias:
          "Sinais recuperados no terreno: patrimônio, turismo, rastros da Rua São Bento. Filtre por temática — decifre o que importa e silencie o ruído.",
        fases:
          "Registro das 13 Almas — fases do Protocolo. Cada alma cruzada libera rastros no Território, sinais em Evidências e instrumentos em Visualização.",
        visualizacao:
          "Instrumentos forenses: maquete estrutural 3D e corte subterrâneo (Fase 7 — Rasgue o Asfalto). Ative quando tiver liberação de acesso para ver o que a cidade enterrou.",
        demo:
          "Investigação demo: Demonão, Titília e o Marco Zero que mente. Siga os passos, decifre senhas narrativas e cruze o mapa entre a Praça da Sé e o Solar da Marquesa."
      },
      meta: {
        layers: "21 camadas",
        sections: "3 seções",
        themes: "6 temas de evidência"
      },
      vizCards: {
        maquete3d: {
          title: "Maquete 3D",
          desc: "Relevo estrutural dos edifícios — leitura de altura sobre o tecido urbano."
        },
        missaoFase7: {
          title: "Missão Fase 7 — Rasgue o Asfalto",
          desc: "Visão subterrânea, corte vertical e coleta das 13 almas soterradas."
        }
      },
      pistasToggle: "Exibir rastros RSB no mapa (Rua São Bento)",
      poiLegendHint: "Marque só as temáticas que quer decifrar no mapa."
    },
    help: {
      lines: [
        "PROTOCOLO ALPHA-09 — Sistema de visualização forense",
        "",
        "- Território: camadas de superfície — bairros, rios soterrados, zoneamento, risco",
        "- Evidências: pontos no mapa — patrimônio, turismo, rastros Rua São Bento",
        "- 13 Almas: registro das Almas e liberação do Protocolo",
        "- Visualização: maquete 3D e corte subterrâneo (Fase 7)",
        "- Relatórios: transcrição de metadados recuperados",
        "",
        "Raiz visual = topografia de superfície",
        "Ponto temático = registro de soterramento",
        "Relatório técnico = propriedades da evidência",
        "Knowledge.js = voz do Arquivista"
      ]
    },
    keyboardShortcuts: {
      toggleSidebar: "S — abrir/fechar painel de camadas"
    }
  };
})();
