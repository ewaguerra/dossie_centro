/**
 * Resolução de imagens Wikipedia / Wikimedia Commons para POIs do Centro.
 */
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

const WIKI_HEADERS = {
  "User-Agent": "DossieCentroPoiImages/1.0 (ARG mapa Centro; +https://github.com/)",
  Accept: "application/json",
};

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function tokenize(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

export function isRelevantMatch(pageTitle, poiTitle) {
  const poiTokens = tokenize(poiTitle);
  if (poiTokens.length === 0) return false;
  const pageNorm = pageTitle
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const poiNorm = poiTitle
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (pageNorm.includes(poiNorm) || poiNorm.includes(pageNorm.split("(")[0].trim())) {
    return true;
  }

  let overlap = 0;
  for (const token of poiTokens) {
    if (pageNorm.includes(token)) overlap++;
  }

  if (overlap >= Math.ceil(poiTokens.length / 2)) {
    return true;
  }

  if (pageNorm.includes(poiTokens[0])) {
    return overlap >= 1;
  }

  return false;
}

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

function scoreCandidate(pageTitle, poiTitle, address) {
  if (!isRelevantMatch(pageTitle, poiTitle)) return -999;
  const pageTokens = new Set(tokenize(pageTitle));
  const poiTokens = tokenize(poiTitle);
  if (poiTokens.length === 0) return 0;

  let overlap = 0;
  for (const token of poiTokens) {
    if (pageTokens.has(token)) overlap++;
  }

  const ratio = overlap / poiTokens.length;
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

async function directLookup(apiBase, query, poiTitle, strictRelevance) {
  const variants = [];
  if (query) variants.push(query);
  const stripped = stripCitySuffix(query);
  if (stripped && stripped !== query) variants.push(stripped);

  for (const variant of variants) {
    const titles = await opensearchTitle(apiBase, variant);
    for (const pageTitle of titles) {
      if (strictRelevance !== false && !isRelevantMatch(pageTitle, poiTitle)) continue;
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

function pickBest(candidates, poiTitle, address, minScore) {
  let best = null;
  let bestScore = minScore;
  for (const candidate of candidates) {
    const score = scoreCandidate(candidate.wikiTitle, poiTitle, address);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best;
}

/**
 * @param {{ title: string, address?: string, local?: string, searchOverride?: string }} opts
 */
export async function resolveImageForPoi(opts) {
  const title = opts.title || "";
  const address = opts.address || "";
  const local = opts.local || "";
  const searchOverride = opts.searchOverride || "";

  const queries = [];
  if (searchOverride && !queries.includes(searchOverride)) {
    queries.push(searchOverride);
  }
  if (title) queries.push(title);
  if (local) queries.push(`${title} ${local}`);
  if (title) queries.push(`${title} São Paulo`);

  const ptApi = "https://pt.wikipedia.org/w/api.php";
  const enApi = "https://en.wikipedia.org/w/api.php";

  if (searchOverride) {
    const overrideHit =
      (await directLookup(ptApi, searchOverride, title, false)) ||
      (await directLookup(enApi, searchOverride, title, false));
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
