window.MAPA_SP_ICONS = {
  iconBasePath: "/centro/assets/icons/",

  // Paleta forense — cores maximamente separadas no círculo cromático
  palette: {
    memoria: "#d97706",
    acervo: "#0d9488",
    arqueologia: "#9333ea",
    monumentos: "#be123c",
    pistas: "#eab308",
    hidrologico: "#0284c7",
  },

  patrimonio: {
    "memoria-paulistana": {
      file: "icon-memoria",
      lucide: "scroll-text",
      color: "#d97706",
      label: "Memória paulistana",
      layerIds: ["memoria-paulistana-icon", "memoria-paulistana-label"],
    },
    "acervo-tombado": {
      file: "icon-acervo",
      lucide: "archive",
      color: "#0d9488",
      label: "Acervo tombado",
      layerIds: ["acervo-tombado-icon", "acervo-tombado-label"],
    },
    "bem-arqueologico": {
      file: "icon-arqueologia",
      lucide: "pickaxe",
      color: "#9333ea",
      label: "Bem arqueológico",
      layerIds: ["bem-arqueologico-icon"],
    },
    monumentos: {
      file: "icon-monumentos",
      lucide: "landmark",
      color: "#be123c",
      label: "Monumentos",
      layerIds: ["monumentos-icon", "monumentos-label"],
    },
    "poi-turistico": {
      file: "icon-turismo",
      lucide: "binoculars",
      color: "#2563eb",
      label: "Pontos turísticos",
      layerIds: ["poi-turistico-icon", "poi-turistico-label"],
    },
  },

  pistas: {
    id: "pistas",
    file: "icon-pista",
    lucide: "camera",
    color: "#eab308",
    label: "Pistas — Rua São Bento",
    layerIds: ["rsb-pistas-icon"],
  },

  layers: {
    "13_saude__point": { lucide: "heart-pulse", color: "#ef4444" },
    "13_educacao__point": { lucide: "graduation-cap", color: "#2563eb" },
    "13_cultura__point": { lucide: "clapperboard", color: "#6366f1" },
    "13_atendimento_ao_cidadao__point": { lucide: "headset", color: "#8b5cf6" },
    "13_seguranca__point": { lucide: "shield", color: "#64748b" },
    "13_habitacao__point": { lucide: "home", color: "#f97316" },
    "13_esporte_e_lazer__point": { lucide: "trophy", color: "#eab308" },
    "13_espacos_publicos__point": { lucide: "tree-pine", color: "#22c55e" },
    "15_osm_saude__point": { lucide: "heart-pulse", color: "#dc2626" },
    "15_osm_comercio__point": { lucide: "shopping-bag", color: "#ca8a04" },
    "15_osm_alimentacao__point": { lucide: "utensils", color: "#ea580c" },
    "15_osm_transporte__point": { lucide: "bus", color: "#7c3aed" },
    "15_osm_lazer__point": { lucide: "trees", color: "#ec4899" },
    "15_osm_servicos__point": { lucide: "landmark", color: "#0f766e" },
    "15_osm_educacao__point": { lucide: "graduation-cap", color: "#1d4ed8" },
    "17_alagamentos_contexto_hidrografico__point": { lucide: "droplets", file: "icon-droplets", color: "#0284c7" },
  },

  settings: {
    size: 36,
    strokeWidth: 1.5,
    paper: "#fdfbf7",
    ink: "#1a1a1a",
  },

  getIconPath: function (fileStem) {
    return this.iconBasePath + fileStem + ".svg";
  },

  resolvePatrimonio: function (poiId) {
    var entry = this.patrimonio[poiId];
    if (!entry) return null;
    return this.getIconPath(entry.file);
  },

  resolvePistasIcon: function () {
    return this.getIconPath(this.pistas.file);
  },

  getLayerEntry: function (layerId) {
    var entry = this.layers[layerId];
    if (!entry) return null;
    if (typeof entry === "string") {
      return { lucide: entry, color: this.palette.hidrologico };
    }
    return entry;
  },

  resolveLayerIcon: function (layerId) {
    var entry = this.getLayerEntry(layerId);
    if (!entry) return null;
    if (entry.file) return this.getIconPath(entry.file);
    if (!entry.lucide) return null;
    return this.getIconPath("icon-" + entry.lucide);
  },

  getThemeFilters: function () {
    var items = [];
    var order = ["memoria-paulistana", "acervo-tombado", "bem-arqueologico", "monumentos", "poi-turistico"];
    for (var i = 0; i < order.length; i++) {
      var id = order[i];
      var entry = this.patrimonio[id];
      if (!entry) continue;
      items.push({
        id: id,
        color: entry.color,
        label: entry.label,
        iconPath: this.getIconPath(entry.file),
        layerIds: entry.layerIds || [],
      });
    }
    items.push({
      id: this.pistas.id || "pistas",
      color: this.pistas.color,
      label: this.pistas.label,
      iconPath: this.getIconPath(this.pistas.file),
      layerIds: this.pistas.layerIds || [],
    });
    return items;
  },

  getLegendItems: function () {
    return this.getThemeFilters().map(function (item) {
      return {
        color: item.color,
        label: item.label,
        iconPath: item.iconPath,
      };
    });
  },
};
