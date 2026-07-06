#!/usr/bin/env node
/**
 * Busca imagens na Wikipedia / Wikimedia Commons (pt) para placas da Memória Paulistana.
 * Gera centro/data/catalog/memoria-paulistana-images.json
 *
 * Uso: node scripts/fetch-memoria-wikipedia-images.mjs [--dry-run] [--limit=N]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const GEOJSON = path.join(
  ROOT,
  "centro/data/context/centro_memoria_paulistana__point.geojson"
);
const OUT = path.join(ROOT, "centro/data/catalog/memoria-paulistana-images.json");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const limitArg = args.find((a) => a.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : Infinity;

const STOP_WORDS = new Set([
  "da",
  "de",
  "do",
  "das",
  "dos",
  "e",
  "o",
  "a",
  "os",
  "as",
  "na",
  "no",
  "em",
  "um",
  "uma",
  "primeira",
  "primeiro",
  "antiga",
  "antigo",
  "grande",
  "caminho",
  "bordas",
  "triângulo",
  "histórico",
  "sp",
]);

/** Busca manual quando o título da placa não encontra artigo relevante. */
const SEARCH_OVERRIDES = {
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function tokenize(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function isRelevantMatch(pageTitle, placaTitle) {
  const placaTokens = tokenize(placaTitle);
  if (placaTokens.length === 0) return false;
  const pageNorm = pageTitle
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const placaNorm = placaTitle
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (pageNorm.includes(placaNorm) || placaNorm.includes(pageNorm.split("(")[0].trim())) {
    return true;
  }

  let overlap = 0;
  for (const token of placaTokens) {
    if (pageNorm.includes(token)) overlap++;
  }

  if (overlap >= Math.ceil(placaTokens.length / 2)) {
    return true;
  }

  if (pageNorm.includes(placaTokens[0])) {
    return overlap >= 1;
  }

  return false;
}

const WIKI_HEADERS = {
  "User-Agent": "DossieCentroMemoriaPaulistana/1.0 (ARG mapa Centro; +https://github.com/)",
  Accept: "application/json",
};

async function wikiQuery(apiBase, params, attempt) {
  const url = `${apiBase}?${new URLSearchParams({ format: "json", origin: "*", ...params })}`;
  try {
    const res = await fetch(url, { headers: WIKI_HEADERS });
    if (!res.ok) {
      if ((attempt || 0) < 2) {
        await sleep(400);
        return wikiQuery(apiBase, params, (attempt || 0) + 1);
      }
      return null;
    }
    return res.json();
  } catch {
    if ((attempt || 0) < 2) {
      await sleep(400);
      return wikiQuery(apiBase, params, (attempt || 0) + 1);
    }
    return null;
  }
}

function scoreCandidate(pageTitle, placaTitle, address) {
  if (!isRelevantMatch(pageTitle, placaTitle)) return -999;
  const pageTokens = new Set(tokenize(pageTitle));
  const placaTokens = tokenize(placaTitle);
  if (placaTokens.length === 0) return 0;

  let overlap = 0;
  for (const token of placaTokens) {
    if (pageTokens.has(token)) overlap++;
  }

  const ratio = overlap / placaTokens.length;
  let score = overlap * 2 + ratio * 5;

  const normalizedPage = pageTitle.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (normalizedPage.includes("sao paulo") || normalizedPage.includes("paulista")) {
    score += 4;
  }
  if (address) {
    const street = String(address).split(",")[0] || "";
    const streetTokens = tokenize(street);
    for (const token of streetTokens) {
      if (pageTokens.has(token)) score += 1;
    }
  }

  return score;
}

async function opensearchTitle(apiBase, query) {
  const data = await wikiQuery(apiBase, {
    action: "opensearch",
    search: query,
    limit: "3",
    namespace: "0",
  });
  return (data && data[1]) || [];
}

async function pageImageByTitle(apiBase, pageTitle) {
  const data = await wikiQuery(apiBase, {
    action: "query",
    titles: pageTitle,
    prop: "pageimages|info",
    inprop: "url",
    pithumbsize: "480",
  });
  const pages = data && data.query && data.query.pages;
  if (!pages) return null;
  const page = Object.values(pages)[0];
  if (!page || page.missing !== undefined || !page.thumbnail) return null;
  return {
    imageUrl: page.thumbnail.source,
    wikiUrl: page.fullurl || "",
    wikiTitle: page.title || pageTitle,
    attribution: "Wikimedia Commons / Wikipedia",
  };
}

function stripCitySuffix(query) {
  return String(query || "")
    .replace(/\s+S[aã]o Paulo.*$/i, "")
    .replace(/\s+SP$/i, "")
    .trim();
}

async function directLookup(apiBase, query, placaTitle, strictRelevance) {
  const variants = [];
  if (query) variants.push(query);
  const stripped = stripCitySuffix(query);
  if (stripped && stripped !== query) variants.push(stripped);

  for (const variant of variants) {
    const titles = await opensearchTitle(apiBase, variant);
    for (const pageTitle of titles) {
      if (strictRelevance !== false && !isRelevantMatch(pageTitle, placaTitle)) continue;
      const hit = await pageImageByTitle(apiBase, pageTitle);
      if (hit) return hit;
      await sleep(80);
    }
  }
  return null;
}

async function searchWithImages(apiBase, query, limitResults) {
  const data = await wikiQuery(apiBase, {
    action: "query",
    generator: "search",
    gsrsearch: query,
    gsrlimit: String(limitResults || 5),
    prop: "pageimages|info",
    inprop: "url",
    pithumbsize: "480",
  });
  const pages = data && data.query && data.query.pages;
  if (!pages) return [];
  return Object.values(pages)
    .filter((p) => p.thumbnail && p.thumbnail.source)
    .map((p) => ({
      imageUrl: p.thumbnail.source,
      wikiUrl: p.fullurl || "",
      wikiTitle: p.title || "",
      attribution: "Wikimedia Commons / Wikipedia",
    }));
}

async function commonsSearch(query) {
  const data = await wikiQuery("https://commons.wikimedia.org/w/api.php", {
    action: "query",
    generator: "search",
    gsrnamespace: "6",
    gsrsearch: query,
    gsrlimit: "5",
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: "480",
  });
  const pages = data && data.query && data.query.pages;
  if (!pages) return [];
  const out = [];
  for (const page of Object.values(pages)) {
    const info = page.imageinfo && page.imageinfo[0];
    if (!info || !info.thumburl) continue;
    out.push({
      imageUrl: info.thumburl,
      wikiUrl: info.descriptionurl || "https://commons.wikimedia.org/wiki/" + encodeURIComponent(page.title),
      wikiTitle: page.title.replace(/^File:/, ""),
      attribution: "Wikimedia Commons",
    });
  }
  return out;
}

function pickBest(candidates, placaTitle, address, minScore) {
  let best = null;
  let bestScore = minScore;
  for (const candidate of candidates) {
    const score = scoreCandidate(candidate.wikiTitle, placaTitle, address);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best;
}

async function resolveImage(id, props) {
  const title = props.nm_titulo_placa || "";
  const address = props.nm_endereco_placa || "";
  const local = props.nm_local_placa || "";
  const queries = [title];
  if (local) queries.push(`${title} ${local}`);
  queries.push(`${title} São Paulo`);
  if (SEARCH_OVERRIDES[id] && !queries.includes(SEARCH_OVERRIDES[id])) {
    queries.unshift(SEARCH_OVERRIDES[id]);
  }

  const ptApi = "https://pt.wikipedia.org/w/api.php";
  const enApi = "https://en.wikipedia.org/w/api.php";

  if (SEARCH_OVERRIDES[id]) {
    const overrideHit =
      (await directLookup(ptApi, SEARCH_OVERRIDES[id], title, false)) ||
      (await directLookup(enApi, SEARCH_OVERRIDES[id], title, false));
    if (overrideHit) return overrideHit;
    await sleep(100);
  }

  for (const q of queries) {
    const directPt = await directLookup(ptApi, q, title);
    if (directPt) return directPt;
    await sleep(100);

    const ptHits = await searchWithImages(ptApi, q, 8);
    const picked = pickBest(ptHits, title, address, 2);
    if (picked) return picked;
    await sleep(100);

    const directEn = await directLookup(enApi, q + " São Paulo", title);
    if (directEn) return directEn;
    await sleep(100);

    const commonsHits = await commonsSearch(q + " São Paulo");
    const pickedCommons = pickBest(commonsHits, title, address, 2);
    if (pickedCommons) return pickedCommons;
    await sleep(100);
  }

  return null;
}

async function main() {
  const debugId = process.env.DEBUG_ID;
  if (debugId) {
    const geo = JSON.parse(fs.readFileSync(GEOJSON, "utf8"));
    const feature = geo.features.find(
      (f) => String(f.properties.cd_identificador) === String(debugId)
    );
    if (!feature) {
      console.error("ID não encontrado:", debugId);
      process.exit(1);
    }
    const result = await resolveImage(Number(debugId), feature.properties);
    console.log(result || "null");
    return;
  }

  const geo = JSON.parse(fs.readFileSync(GEOJSON, "utf8"));
  const features = geo.features.slice(0, limit);
  const manifest = {};
  let found = 0;
  let missed = 0;

  for (let i = 0; i < features.length; i++) {
    const props = features[i].properties || {};
    const id = String(props.cd_identificador || "");
    const title = props.nm_titulo_placa || "";
    if (!id || !title) continue;

    process.stdout.write(`[${i + 1}/${features.length}] ${id} ${title}… `);
    const entry = await resolveImage(Number(id), props);
    if (entry) {
      manifest[id] = entry;
      found++;
      console.log("OK → " + entry.wikiTitle.slice(0, 48));
    } else {
      missed++;
      console.log("—");
    }
    await sleep(120);
  }

  console.log(`\nResumo: ${found} com imagem, ${missed} sem imagem, ${features.length} total.`);

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
