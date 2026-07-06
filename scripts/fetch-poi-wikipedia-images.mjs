#!/usr/bin/env node
/**
 * Busca imagens na Wikipedia / Wikimedia Commons para todos os temas POI do Centro.
 * Gera centro/data/catalog/poi-wikipedia-images.json
 *
 * Uso:
 *   node scripts/fetch-poi-wikipedia-images.mjs [--dry-run] [--limit=N]
 *   node scripts/fetch-poi-wikipedia-images.mjs --theme=monumentos [--skip-existing]
 *   DEBUG_ID=501 node scripts/fetch-poi-wikipedia-images.mjs --theme=memoria-paulistana
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveImageForPoi, sleep } from "./lib/wikipedia-image-resolver.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "centro/data/catalog/poi-wikipedia-images.json");
const LEGACY_MEMORIA = path.join(ROOT, "centro/data/catalog/memoria-paulistana-images.json");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const skipExisting = args.includes("--skip-existing");
const limitArg = args.find((a) => a.startsWith("--limit="));
const themeArg = args.find((a) => a.startsWith("--theme="));
const themeFilter = themeArg ? themeArg.split("=")[1] : null;
const limit = limitArg ? Number(limitArg.split("=")[1]) : Infinity;

/** Busca manual — Memória Paulistana (cd_identificador). */
const MEMORIA_OVERRIDES = {
  67: "Companhia Cervejaria Brahma São Paulo",
  106: "Conjunto Nacional São Paulo",
  103: "Raul Seixas",
  227: "Ramos de Azevedo arquiteto São Paulo",
  296: "Edifício Mirante do Vale",
  300: "Edifício Itália São Paulo",
  299: "Edifício Esther São Paulo",
  351: "Companhia Antarctica Paulista",
  389: "Theatro São Pedro",
  372: "Convento de São Francisco São Paulo",
  463: "Jardim da Luz São Paulo",
  427: "Palácio dos Bandeirantes",
  428: "Faculdade de Medicina da USP",
  429: "Santa Casa de São Paulo",
  443: "Edifício São Vito",
  292: "Moinho Matarazzo",
  290: "Mansão Matarazzo",
  305: "Indústrias Matarazzo São Paulo",
  486: "Ford do Brasil São Paulo",
  204: "Adoniran Barbosa",
  285: "Carlos Marighella",
  326: "Tarsila do Amaral",
  314: "Haroldo de Campos",
  317: "Roberto Burle Marx São Paulo",
  395: "Darcy Penteado",
  350: "Amácio Mazzaropi",
  224: "Luiz Gama abolicionista",
  104: "Cacique Tibiriçá",
  163: "Marquesa de Santos",
  345: "Olavo Bilac",
  493: "Frei Tito de Alencar Lima",
  55: "Diretas Já São Paulo",
  98: "Parada Gay São Paulo 1987",
  117: "Chacina da Sé",
  352: "Enchente de 1929 São Paulo",
  374: "Gripe espanhola São Paulo 1918",
  353: "Jornadas de Junho de 2013 São Paulo",
  491: "Trólebus São Paulo",
  439: "Primeiro jogo de futebol São Paulo",
  99: "Cinematógrafo São Paulo 1897",
  269: "Hospital das Clínicas São Paulo",
  509: "Hotel Othon Palace São Paulo",
  511: "Parque da Água Branca",
  419: "Hotel Cambridge São Paulo",
  478: "Grande Hotel São Paulo",
  297: "Pavilhão da Bienal de São Paulo",
  110: "Teatro Brasileiro de Comédia",
  501: "Teatro Bandeirantes São Paulo",
  387: "Teatro de Arena São Paulo",
  165: "Teatro Ruth Escobar",
  495: "Congregação Israelita Paulista",
  144: "Sinagoga Beth El São Paulo",
  363: "Frente Negra Brasileira",
  453: "Associação dos Surdos de São Paulo",
  34: "Cine Alhambra São Paulo",
  35: "Cine Belas Artes São Paulo",
  42: "Cine Majestic São Paulo",
  46: "Cine Metro São Paulo",
  48: "Cine Olido São Paulo",
  256: "Cine Rex São Paulo",
  268: "Cine Metrópole São Paulo",
  275: "Cine São Bento São Paulo",
  320: "Cine Lux São Paulo",
  436: "Cine Astor São Paulo",
  494: "Cine Joia São Paulo",
  158: "Edifício Sampaio Moreira",
  261: "Edifício CBI Esplanada São Paulo",
  270: "Associação das Classes Laboriosas São Paulo",
  271: "Piso Paulista",
  252: "Parque Augusta São Paulo",
  253: "Festa da Achiropita",
  148: "Vila Itororó São Paulo",
  114: "Vila Flavio de Carvalho São Paulo",
  177: "Bixiga São Paulo",
  263: "Escadaria do Bixiga",
  178: "Nova Babilônia São Paulo",
  334: "Favela do Canindé",
  487: "Favela do Moinho São Paulo",
  336: "Mappin São Paulo",
  490: "Light Serviços de Eletricidade São Paulo",
  361: "Garagem de bondes São Paulo",
  315: "Bonde São Paulo histórico",
  302: "Associação Atlética São Paulo",
  304: "Clube de Regatas Tietê",
  422: "Parque Infantil Dom Pedro II São Paulo",
  465: "Pátio do Colégio São Paulo",
  323: "Igreja Nossa Senhora dos Remédios São Paulo",
  78: "Igreja Nossa Senhora do Rosário dos Homens Pretos São Paulo",
  333: "Capela Nossa Senhora da Luz São Paulo",
  5: "Superior Tribunal Militar São Paulo",
  8: "Centro Universitário Maria Antônia",
  10: "Praça Roosevelt São Paulo hip hop",
  219: "Figueira da Marquesa São Paulo",
  230: "Casarões da Paulista São Paulo",
  241: "Plano Bouvard São Paulo",
  386: "Tabaris São Paulo",
  512: "Boate Prohibidus São Paulo",
};

const DEMO_OVERRIDES = {
  "demo-santa-luzia": "Capela do Menino Jesus e Santa Luzia",
  "demo-solar-marquesa": "Solar da Marquesa de Santos",
  "demo-figueira-marquesa": "Domitila de Castro",
  "demo-marco-zero": "Marco zero da cidade de São Paulo",
  "demo-igreja-carmo": "Igreja da Ordem Terceira do Carmo (São Paulo)",
  "demo-triangulo": "Domitila de Castro",
};

const THEME_CONFIGS = [
  {
    themeId: "memoria-paulistana",
    geojson: "centro/data/context/centro_memoria_paulistana__point.geojson",
    idProp: "cd_identificador",
    titleProp: "nm_titulo_placa",
    addressProp: "nm_endereco_placa",
    localProp: "nm_local_placa",
    overrides: MEMORIA_OVERRIDES,
  },
  {
    themeId: "acervo-tombado",
    geojson: "centro/data/context/centro_acervo_tombado__point.geojson",
    idProp: "cd_identificador",
    titleProp: "nm_acervo",
    addressProp: "nm_endereco",
  },
  {
    themeId: "bem-arqueologico",
    geojson: "centro/data/context/centro_bem_arqueologico__point.geojson",
    idProp: "cd_identificador",
    titleProp: "nm_imovel",
    addressProp: "nm_endereco",
    overrides: { 8003: "Pátio do Colégio São Paulo" },
  },
  {
    themeId: "monumentos",
    geojson: "centro/data/context/centro_monumentos__point.geojson",
    idProp: "cd_identificador",
    titleProp: "nm_obra",
    addressProp: "dc_localizacao",
  },
  {
    themeId: "poi-turistico",
    geojson: "centro/data/geojson/special/pois/centro_pois_turisticos__point.geojson",
    idProp: "officialIndex",
    titleProp: "name",
    addressProp: "matchedName",
  },
  {
    themeId: "linha-tempo",
    geojson: "centro/data/geojson/special/timeline/centro_linha_tempo__point.geojson",
    idProp: "event_id",
    titleProp: "nm_titulo",
    addressProp: "evidence_address",
  },
  {
    themeId: "demo",
    geojson: "centro/data/demo/demonao-titilia-markers.geojson",
    idProp: "markerId",
    titleProp: "title",
    overrides: DEMO_OVERRIDES,
  },
];

function loadManifest() {
  if (fs.existsSync(OUT)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(OUT, "utf8"));
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      /* recria */
    }
  }
  if (fs.existsSync(LEGACY_MEMORIA)) {
    try {
      const legacy = JSON.parse(fs.readFileSync(LEGACY_MEMORIA, "utf8"));
      if (legacy && typeof legacy === "object") {
        return { "memoria-paulistana": legacy };
      }
    } catch {
      /* ignora */
    }
  }
  return {};
}

function getOverride(cfg, id) {
  if (!cfg.overrides) return "";
  const key = cfg.overrides[id] != null ? id : cfg.overrides[String(id)];
  return cfg.overrides[id] || cfg.overrides[String(id)] || "";
}

function extractFeature(cfg, props) {
  const id = props[cfg.idProp];
  const title = props[cfg.titleProp] || "";
  if (id == null || id === "" || !title) return null;
  return {
    id: String(id),
    title,
    address: cfg.addressProp ? props[cfg.addressProp] || "" : "",
    local: cfg.localProp ? props[cfg.localProp] || "" : "",
    searchOverride: getOverride(cfg, id),
  };
}

async function resolveForFeature(featureInfo) {
  return resolveImageForPoi({
    title: featureInfo.title,
    address: featureInfo.address,
    local: featureInfo.local,
    searchOverride: featureInfo.searchOverride,
  });
}

async function processTheme(cfg, manifest) {
  const geoPath = path.join(ROOT, cfg.geojson);
  if (!fs.existsSync(geoPath)) {
    console.warn("GeoJSON ausente:", cfg.geojson);
    return { found: 0, missed: 0, skipped: 0, total: 0 };
  }

  const geo = JSON.parse(fs.readFileSync(geoPath, "utf8"));
  const features = geo.features.slice(0, limit);
  if (!manifest[cfg.themeId]) manifest[cfg.themeId] = {};

  let found = 0;
  let missed = 0;
  let skipped = 0;

  for (let i = 0; i < features.length; i++) {
    const props = features[i].properties || {};
    const info = extractFeature(cfg, props);
    if (!info) continue;

    if (skipExisting && manifest[cfg.themeId][info.id]) {
      skipped++;
      continue;
    }

    if (cfg.themeId === "linha-tempo") {
      const srcTheme = props.source_theme_id || "";
      const srcId = props.source_feature_id;
      if (srcTheme && srcId != null && srcId !== "") {
        const inherited = manifest[srcTheme] && manifest[srcTheme][String(srcId)];
        if (inherited) {
          manifest[cfg.themeId][info.id] = inherited;
          skipped++;
          continue;
        }
      }
    }

    process.stdout.write(
      `[${cfg.themeId} ${i + 1}/${features.length}] ${info.id} ${info.title.slice(0, 42)}… `
    );
    const entry = await resolveForFeature(info);
    if (entry) {
      manifest[cfg.themeId][info.id] = entry;
      found++;
      console.log("OK → " + entry.wikiTitle.slice(0, 48));
    } else {
      missed++;
      console.log("—");
    }
    await sleep(120);
  }

  return { found, missed, skipped, total: features.length };
}

async function main() {
  const debugId = process.env.DEBUG_ID;
  const themes = themeFilter
    ? THEME_CONFIGS.filter((c) => c.themeId === themeFilter)
    : THEME_CONFIGS;

  if (themes.length === 0) {
    console.error("Tema desconhecido:", themeFilter);
    process.exit(1);
  }

  if (debugId) {
    const cfg = themes[0];
    const geo = JSON.parse(fs.readFileSync(path.join(ROOT, cfg.geojson), "utf8"));
    const feature = geo.features.find((f) => {
      const props = f.properties || {};
      return String(props[cfg.idProp]) === String(debugId);
    });
    if (!feature) {
      console.error("ID não encontrado:", debugId);
      process.exit(1);
    }
    const info = extractFeature(cfg, feature.properties);
    const result = await resolveForFeature(info);
    console.log(result || "null");
    return;
  }

  const manifest = loadManifest();
  let totals = { found: 0, missed: 0, skipped: 0 };

  for (const cfg of themes) {
    console.log(`\n=== ${cfg.themeId} ===`);
    const stats = await processTheme(cfg, manifest);
    totals.found += stats.found;
    totals.missed += stats.missed;
    totals.skipped += stats.skipped;
    console.log(
      `${cfg.themeId}: ${stats.found} novas, ${stats.missed} sem imagem, ${stats.skipped} já existentes`
    );
  }

  console.log(
    `\nResumo: ${totals.found} com imagem, ${totals.missed} sem imagem, ${totals.skipped} ignoradas (skip-existing).`
  );

  if (dryRun) {
    console.log("(dry-run — manifest não gravado)");
    return;
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log("Gravado:", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
