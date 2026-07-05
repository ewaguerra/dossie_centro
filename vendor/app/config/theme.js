window.MAPA_SP_THEME = {
  baseStyle: {
    version: 8,
    name: "Mapa SP - Base OSM",
    sources: {
      osm: {
        type: "raster",
        tiles: [
          "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        ],
        tileSize: 256,
        attribution: "© OpenStreetMap contributors"
      }
    },
    layers: [
      {
        id: "osm-base",
        type: "raster",
        source: "osm"
      }
    ]
  },

  buildings3D: {
    // ── Pastel base (fallback para prédios sem categoria) ──────────────
    lowRise: "#fdf2f2",
    midRise: "#f0fdf4",
    corporateGlow1: "#eff6ff",
    corporateGlow2: "#faf5ff",

    // ── Paleta randômica legacy (fallback cíclico por height mod 10) ──
    palette: [
      "#ffb3ba", "#ffdfba", "#ffffba", "#baffc9", "#bae1ff",
      "#e0bbe4", "#957dad", "#d291bc", "#fec8d8", "#ffdfd3"
    ],

    // ── Sistema semântico por altura (height-bands) ────────────────────
    // OpenFreeMap só expõe: render_height, render_min_height, colour, hide_3d
    // Usamos altura como proxy de tipo: baixo=residencial, médio=comercial, alto=corporativo
    heightBands: {
      // 0–6m: térreos, casas, comércios de rua
      ground:      { max: 6,   color: "#fef3c7" }, // âmbar claro — residencial/comercio térreo
      // 6–15m: edifícios de 2-4 andares — mistura comercial/residencial
      low:         { max: 15,  color: "#d1fae5" }, // verde claro — uso misto baixo
      // 15–30m: 5-10 andares — comercial / serviços
      medium:      { max: 30,  color: "#dbeafe" }, // azul claro — comercial médio
      // 30–60m: 10-20 andares — corporativo / institucional
      tall:        { max: 60,  color: "#ede9fe" }, // violeta — corporativo
      // 60–100m: torres corporativas / hotéis
      tower:       { max: 100, color: "#fce7f3" }, // rosa — torre corporativa
      // 100m+: arranha-céus / marcos
      skyscraper:  { max: Infinity, color: "#e0f2fe" } // azul gelo — marco urbano
    },

    // ── Cores semânticas para overlays de categorias conhecidas ────────
    // Aplicadas via camadas extras sobre bem_tombado / POIs / monumentos
    semantic: {
      religioso:        "#f5e6cc", // creme dourado — igrejas, templos
      patrimonio:       "#ffd6a5", // âmbar — bem tombado / histórico
      cultural:         "#c8e6c9", // verde suave — museus, teatros, bibliotecas
      educacao:         "#bbdefb", // azul suave — escolas, universidades
      saude:            "#ffcdd2", // vermelho suave — hospitais, UBSs
      transporte:       "#e1bee7", // lilás — estações, terminais
      lazer:            "#b2ebf2", // ciano — parques, praças cobertas, esporte
      comercio:         "#fff9c4", // amarelo — shopping, mercado, comércio
      servico_publico:  "#cfd8dc", // cinza azulado — prefeitura, fórum, banco
      residencial:      "#fce4ec", // rosa — habitação
      industrial:       "#d7ccc8", // bege acastanhado — galpão, indústria
      monumento:        "#ffe0b2", // laranja claro — monumento, obelisco
      default:          "#f5f5f5"  // cinza neutro — não classificado
    },

    // ── Mapeamento: categoria do POI → cor semântica ──────────────────
    // Usado para colorir o extrude overlay dos POIs conhecidos
    poiCategoryToSemantic: {
      "igreja_religiosidade":      "religioso",
      "arquitetura_mirante":       "patrimonio",
      "museu_memoria":             "cultural",
      "teatro_espetaculo":         "cultural",
      "educacao_institucional":    "educacao",
      "sesc_lazer":                "lazer",
      "mercado_comercio":          "comercio",
      "transporte_estacao":        "transporte",
      "praca_espaco_publico":      "lazer",
      "outro":                     "patrimonio"
    },

    // ── Mapeamento: tx_tipo_uso do bem_tombado → cor semântica ────────
    tombadoUsoToSemantic: {
      "RELIGIOSO":                 "religioso",
      "IMÓVEL":                    "patrimonio",
      "CONJUNTO":                  "patrimonio",
      "CONJUNTO URBANO":           "patrimonio",
      "MONUMENTO":                 "monumento",
      "OBRA DE ARTE":              "monumento",
      "ESTAÇÃO":                   "transporte",
      "PARQUE":                    "lazer",
      "PRAÇA":                     "lazer",
      "LARGO":                     "lazer",
      "LOGRADOURO":                "servico_publico",
      "PASSARELA / VIADUTO":       "transporte",
      "VIADUTO":                   "transporte",
      "VIADUTO / PONTE":           "transporte",
      "TRAÇADO URBANO":            "patrimonio",
      "VILA":                      "residencial",
      "IMÓVEL / CONJUNTO URBANO":  "patrimonio"
    }
  },

  groups: {
    "01_macrozoneamento": {
      color: "#7c3aed",
      fillOpacity: 0.14,
      lineWidth: 1.5,
      circleRadius: 5
    },

    "02_macroareas_e_eixos": {
      color: "#2563eb",
      fillOpacity: 0.13,
      lineWidth: 1.8,
      circleRadius: 5
    },

    "03_zoneamento": {
      color: "#f59e0b",
      fillOpacity: 0.26,
      lineWidth: 1.4,
      circleRadius: 5
    },

    "04_ambiental": {
      color: "#22c55e",
      fillOpacity: 0.16,
      lineWidth: 1.4,
      circleRadius: 5
    },

    "05_mobilidade": {
      color: "#ef4444",
      fillOpacity: 0.18,
      lineWidth: 2.5,
      circleRadius: 5.5
    },

    "06_equipamentos": {
      color: "#3b82f6",
      fillOpacity: 0.22,
      lineWidth: 1.8,
      circleRadius: 5.5
    },

    "07_objetivos_tematicos": {
      color: "#ec4899",
      fillOpacity: 0.22,
      lineWidth: 1.8,
      circleRadius: 5.5
    },

    "08_hidrografia": {
      color: "#0284c7",
      fillOpacity: 0.10,
      lineWidth: 1.2,
      circleRadius: 4.5
    },

    "09_saneamento": {
      color: "#14b8a6",
      fillOpacity: 0.15,
      lineWidth: 2.2,
      circleRadius: 5
    },

    "10_ambiental_protecao": {
      color: "#16a34a",
      fillOpacity: 0.18,
      lineWidth: 1.5,
      circleRadius: 5
    },

    "11_territorios_tradicionais": {
      color: "#a16207",
      fillOpacity: 0.28,
      lineWidth: 1.5,
      circleRadius: 5
    },

    "12_intervencoes_urbanas_parcerias": {
      color: "#f97316",
      fillOpacity: 0.24,
      lineWidth: 1.8,
      circleRadius: 6
    },

    "13_atendimento_cidadao": {
      color: "#6366f1",
      fillOpacity: 0.22,
      lineWidth: 1.8,
      circleRadius: 6
    },

    "14_perimetros_especiais": {
      color: "#9333ea",
      fillOpacity: 0.20,
      lineWidth: 2,
      circleRadius: 5
    },

    "17_risco_hidrologico": {
      color: "#2563eb",
      fillOpacity: 0.15,
      lineWidth: 2,
      circleRadius: 6
    },

    "15_osm_contexto": {
      color: "#0ea5e9",
      fillOpacity: 0.10,
      lineWidth: 1.2,
      circleRadius: 4
    }
  },

  layerOverrides: {
    // Macrozoneamento
    "01a_zona_urbana__polygon": {
      border: true,
      paint: {
        "fill-color": "#0ea5e9",
        "fill-opacity": 0.04,
        "fill-outline-color": "#0ea5e9"
      }
    },
    "01a_zona_rural__polygon": {
      border: true,
      paint: {
        "fill-color": "#16a34a",
        "fill-opacity": 0.04,
        "fill-outline-color": "#16a34a"
      }
    },
    "01_macrozona_estruturacao_qualificacao_urbana__polygon": {
      border: true,
      paint: {
        "fill-color": "#8b5cf6",
        "fill-opacity": 0.12,
        "fill-outline-color": "#8b5cf6"
      }
    },
    "01_macrozona_protecao_recuperacao_ambiental__polygon": {
      border: true,
      paint: {
        "fill-color": "#059669",
        "fill-opacity": 0.12,
        "fill-outline-color": "#059669"
      }
    },

    // ZEIS
    "04_zeis1__polygon": {
      border: true,
      paint: {
        "fill-color": "#fef9c3",
        "fill-opacity": 0.35,
        "fill-outline-color": "#facc15"
      }
    },
    "04a_zeis2__polygon": {
      border: true,
      paint: {
        "fill-color": "#fef08a",
        "fill-opacity": 0.35,
        "fill-outline-color": "#eab308"
      }
    },
    "04a_zeis3__polygon": {
      border: true,
      paint: {
        "fill-color": "#fde047",
        "fill-opacity": 0.35,
        "fill-outline-color": "#ca8a04"
      }
    },
    "04a_zeis4__polygon": {
      border: true,
      paint: {
        "fill-color": "#facc15",
        "fill-opacity": 0.35,
        "fill-outline-color": "#a16207"
      }
    },
    "04a_zeis5__polygon": {
      border: true,
      paint: {
        "fill-color": "#eab308",
        "fill-opacity": 0.35,
        "fill-outline-color": "#854d0e"
      }
    },

    // Eixos e Macroáreas
    "03_eixo_existente__polygon": {
      border: true,
      paint: {
        "fill-color": "#2563eb",
        "fill-opacity": 0.15,
        "fill-outline-color": "#1d4ed8"
      }
    },
    "03a_eixo_previsto__polygon": {
      border: true,
      paint: {
        "fill-color": "#60a5fa",
        "fill-opacity": 0.12,
        "fill-outline-color": "#2563eb"
      }
    },

    // Perímetros Especiais
    "11_cupece__polygon": {
      border: true,
      paint: {
        "fill-color": "#d946ef",
        "fill-opacity": 0.15,
        "fill-outline-color": "#a21caf"
      }
    },
    "11_fernao_dias__polygon": {
      border: true,
      paint: {
        "fill-color": "#d946ef",
        "fill-opacity": 0.15,
        "fill-outline-color": "#a21caf"
      }
    },
    "11_jacu_pessego__polygon": {
      border: true,
      paint: {
        "fill-color": "#d946ef",
        "fill-opacity": 0.15,
        "fill-outline-color": "#a21caf"
      }
    },
    "11_raimundo__polygon": {
      border: true,
      paint: {
        "fill-color": "#d946ef",
        "fill-opacity": 0.15,
        "fill-outline-color": "#a21caf"
      }
    },

    "05_hidrografia_rios__line": {
      paint: {
        "line-color": "#0284c7",
        "line-width": 1.1,
        "line-opacity": 0.8
      }
    },

    "05_bacias_hidrograficas__polygon": {
      paint: {
        "fill-color": "#38bdf8",
        "fill-opacity": 0.08,
        "fill-outline-color": "#0284c7"
      }
    },

    "09_metro_linha_existente__line": {
      paint: {
        "line-color": "#dc2626",
        "line-width": 3.2,
        "line-opacity": 0.95
      }
    },

    "09_trem_linha_existente__line": {
      paint: {
        "line-color": "#7c3aed",
        "line-width": 2.8,
        "line-opacity": 0.95
      }
    },

    "08_rodoanel__line": {
      paint: {
        "line-color": "#f97316",
        "line-width": 3,
        "line-opacity": 0.9
      }
    },

    "15_osm_ruas__line": {
      paint: {
        "line-color": "#64748b",
        "line-width": 1,
        "line-opacity": 0.55
      }
    },

    "15_osm_enderecos__point": {
      paint: {
        "circle-radius": 3,
        "circle-color": "#f97316",
        "circle-opacity": 0.85,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#ffffff"
      }
    },

    "15_osm_comercio__point": {
      paint: {
        "circle-radius": 4,
        "circle-color": "#eab308",
        "circle-opacity": 0.88,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#ffffff"
      }
    },

    "15_osm_alimentacao__point": {
      paint: {
        "circle-radius": 4,
        "circle-color": "#f97316",
        "circle-opacity": 0.88,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#ffffff"
      }
    },

    "15_osm_saude__point": {
      paint: {
        "circle-radius": 5,
        "circle-color": "#dc2626",
        "circle-opacity": 0.9,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#ffffff"
      }
    },

    "15_osm_educacao__point": {
      paint: {
        "circle-radius": 4,
        "circle-color": "#2563eb",
        "circle-opacity": 0.88,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#ffffff"
      }
    },

    "15_osm_transporte__point": {
      paint: {
        "circle-radius": 4,
        "circle-color": "#7c3aed",
        "circle-opacity": 0.88,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#ffffff"
      }
    },

    "15_osm_lazer__point": {
      paint: {
        "circle-radius": 4,
        "circle-color": "#ec4899",
        "circle-opacity": 0.88,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#ffffff"
      }
    },

    "15_osm_servicos__point": {
      paint: {
        "circle-radius": 4,
        "circle-color": "#0f766e",
        "circle-opacity": 0.88,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#ffffff"
      }
    },

    // Regiões de São Paulo
    "16_regiao_centro__polygon": { border: true, paint: { "fill-color": "#f59e0b", "fill-opacity": 0.15, "fill-outline-color": "#d97706" } },
    "16_regiao_norte__polygon": { border: true, paint: { "fill-color": "#22c55e", "fill-opacity": 0.15, "fill-outline-color": "#16a34a" } },
    "16_regiao_sul__polygon": { border: true, paint: { "fill-color": "#06b6d4", "fill-opacity": 0.15, "fill-outline-color": "#0891b2" } },
    "16_regiao_leste__polygon": { border: true, paint: { "fill-color": "#ef4444", "fill-opacity": 0.15, "fill-outline-color": "#dc2626" } },
    "16_regiao_oeste__polygon": { border: true, paint: { "fill-color": "#8b5cf6", "fill-opacity": 0.15, "fill-outline-color": "#7c3aed" } },
    
    // Administrativo
    "distrito_municipal__polygon": { paint: { "fill-color": "#94a3b8", "fill-opacity": 0.05, "fill-outline-color": "#64748b" } },
    "subprefeitura__polygon": { paint: { "fill-color": "#64748b", "fill-opacity": 0.08, "fill-outline-color": "#475569" } },

    // Risco Hidrológico
    "17_ocorrencias_alagamento_defesa_civil__point": {
      paint: {
        "circle-radius": 7,
        "circle-color": "#2563eb",
        "circle-opacity": 0.9,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff"
      }
    },
    "17_alagamentos_contexto_hidrografico__point": {
      paint: {
        "circle-radius": 8,
        "circle-color": "#06b6d4",
        "circle-opacity": 0.9,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff"
      }
    },
    "17_alagamentos_ate_50m_hidrografia__point": {
      paint: {
        "circle-radius": 8,
        "circle-color": "#1e3a8a",
        "circle-opacity": 0.9,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff"
      }
    },
    "17_alagamentos_50_100m_hidrografia__point": {
      paint: {
        "circle-radius": 8,
        "circle-color": "#3b82f6",
        "circle-opacity": 0.9,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff"
      }
    },
    "17_alagamentos_100_250m_hidrografia__point": {
      paint: {
        "circle-radius": 8,
        "circle-color": "#93c5fd",
        "circle-opacity": 0.9,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff"
      }
    },
    "17_alagamentos_acima_250m_hidrografia__point": {
      paint: {
        "circle-radius": 8,
        "circle-color": "#f97316",
        "circle-opacity": 0.9,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff"
      }
    }
  },

  getGroupStyle(layer) {
    // Estilos genéricos para Arcos e Subsetores
    if (layer.id.includes("arco_")) {
      return {
        color: "#9333ea",
        fillOpacity: 0.14,
        lineWidth: 1.5
      };
    }

    if (layer.id.includes("subsetores_")) {
      return {
        color: "#06b6d4",
        fillOpacity: 0.12,
        lineWidth: 1.5
      };
    }

    return this.groups[layer.group] || {
      color: "#00d1ff",
      fillOpacity: 0.2,
      lineWidth: 2,
      circleRadius: 5
    };
  },

  isPlannedLayer(layer) {
    return /planejad|previst|implantacao|pos_2018|2025|2018|2016/.test(layer.id);
  },

  getPaint(layer) {
    const groupStyle = this.getGroupStyle(layer);
    const color = groupStyle.color;

    let paint;

    if (layer.type === "circle") {
      paint = {
        "circle-radius": groupStyle.circleRadius || 5,
        "circle-color": color,
        "circle-opacity": 0.88,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#ffffff"
      };
    } else if (layer.type === "line") {
      paint = {
        "line-color": color,
        "line-width": groupStyle.lineWidth || 2,
        "line-opacity": 0.82
      };

      if (this.isPlannedLayer(layer)) {
        paint["line-dasharray"] = [2, 2];
      }
    } else {
      paint = {
        "fill-color": color,
        "fill-opacity": groupStyle.fillOpacity ?? 0.2,
        "fill-outline-color": color
      };
    }

    const override = this.layerOverrides[layer.id];

    if (override && override.paint) {
      paint = {
        ...paint,
        ...override.paint
      };
    }

    return paint;
  },

  getOutlinePaint(layer) {
    const paint = this.getPaint(layer);
    const color = paint["fill-outline-color"] || paint["fill-color"] || "#ffffff";

    const outlinePaint = {
      "line-color": color,
      "line-width": 1.2,
      "line-opacity": 0.8
    };

    if (this.isPlannedLayer(layer)) {
      outlinePaint["line-dasharray"] = [3, 2];
    }

    return outlinePaint;
  },

  getLayout(layer) {
    let layout = {};

    if (layer.type === "line") {
      layout = {
        "line-cap": "round",
        "line-join": "round"
      };
    }

    const override = this.layerOverrides[layer.id];

    if (override && override.layout) {
      layout = {
        ...layout,
        ...override.layout
      };
    }

    return layout;
  },

  // ── Prédios 3D (fill-extrusion OpenFreeMap) ─────────────────────────
  // Usado por centro-runtime.js ao ativar a maquete estrutural na sidebar.

  getBuildings3DHeightBandOrder() {
    return ["ground", "low", "medium", "tall", "tower", "skyscraper"];
  },

  getBuildings3DHeightBandLabels() {
    return {
      ground: "Térreo (0–6 m)",
      low: "Baixo (6–15 m)",
      medium: "Médio (15–30 m)",
      tall: "Alto (30–60 m)",
      tower: "Torre (60–100 m)",
      skyscraper: "Marco (+100 m)",
    };
  },

  getBuildings3DExtrusionColorExpression() {
    var bands = this.buildings3D.heightBands;
    var order = this.getBuildings3DHeightBandOrder();
    var expr = ["case"];
    var height = ["coalesce", ["get", "render_height"], 0];

    for (var i = 0; i < order.length; i++) {
      var key = order[i];
      var band = bands[key];
      if (!band) continue;
      if (band.max !== Infinity) {
        expr.push(["<", height, band.max]);
        expr.push(band.color);
      }
    }

    expr.push(bands.skyscraper ? bands.skyscraper.color : "#f5f5f5");
    return expr;
  },

  getBuildings3DFilter() {
    return [
      "all",
      [
        "any",
        ["!", ["has", "hide_3d"]],
        ["!=", ["get", "hide_3d"], true],
      ],
    ];
  },

  getBuildings3DExtrusionPaint() {
    return {
      "fill-extrusion-color": this.getBuildings3DExtrusionColorExpression(),
      "fill-extrusion-opacity": 0.88,
      "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
      "fill-extrusion-height": ["coalesce", ["get", "render_height"], 6],
    };
  },
};