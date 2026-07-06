/**
 * Visão subterrânea — Three.js custom layer MapLibre.
 * Fase 7 — "Rasgue o Asfalto".
 *
 * Efeitos: 13 almas pulsantes, rio respirando, scanlines geológicas,
 * glitch de aparição em 3 estágios e explosão de partículas por alma.
 */
import * as THREE from "/vendor/three/three.module.min.js";

(function () {
  "use strict";

  var LAYER_ID          = "centro-subterranean-cutaway";
  var TOGGLE_ID         = "centro-subterranean-toggle";
  var STATUS_ID         = "subterranean-status";
  var LEGEND_ID         = "subterranean-legend";
  var LABELS_ID         = "subterranean-labels";
  var REQUIRED_PHASE    = 7;
  var REQUIRED_CLUES    = ["agua-calada", "aresta-fria", "peso-fundacao"];
  // centroSubterraneanEnabled        — "0"/"1"
  // centroSubterraneanUnlockedElements — JSON array de IDs descobertos
  // centroMaster                      — "1" activa modo mestre
  var ENABLED_STORAGE_KEY = "centroSubterraneanEnabled";
  var FOUND_STORAGE_KEY   = "centroSubterraneanUnlockedElements";
  var MASTER_STORAGE_KEY  = "centroMaster";
  var CADERNO_STORAGE_KEY = "protocolo13_caderno_clues";
  var PHASE_STORAGE_KEY   = "protocolo13_phase";
  var PHASE_TITLE         = "Rasgue o Asfalto";
  var CENTER              = [-46.6346, -23.5482];
  var MODEL_ORIGIN        = [-46.6361, -23.5505];
  var HIT_SOUL_PX         = 54;
  var HIT_ELEM_PX         = 82;

  var PREFERES_REDUCED = !!(
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  // ── Elementos geológicos ─────────────────────────────────────────────────

  var CUTAWAY_ITEMS = [
    {
      id: "rio-anhangabau-soterrado",
      title: "Rio Anhangabaú soterrado",
      depthLabel: "-10 m",
      kind: "rio",
      color: "#0ea5e9",
      foundColor: "#22c55e",
      emissiveHex: "#0369a1",
      opacity: 0.74,
      topMeters: -8,
      bottomMeters: -14,
      path: [
        [-46.6386, -23.5465],
        [-46.6362, -23.5476],
        [-46.6339, -23.5489],
        [-46.6321, -23.5503],
      ],
    },
    {
      id: "fundacao-martinelli",
      title: "Fundação século XX",
      depthLabel: "-18 m",
      kind: "fundacao",
      color: "#dc2626",
      foundColor: "#22c55e",
      emissiveHex: "#7f1d1d",
      opacity: 0.78,
      topMeters: -4,
      bottomMeters: -19,
      path: [
        [-46.6357, -23.5455],
        [-46.6349, -23.5459],
      ],
    },
    {
      id: "tunel-metro-linha-3",
      title: "Túnel metrô linha 3",
      depthLabel: "-24 m",
      kind: "tunel",
      color: "#eab308",
      foundColor: "#22c55e",
      emissiveHex: "#713f12",
      opacity: 0.80,
      topMeters: -20,
      bottomMeters: -27,
      path: [
        [-46.6391, -23.5506],
        [-46.6362, -23.5502],
        [-46.6327, -23.5498],
      ],
    },
    {
      id: "camada-argila",
      title: "Camada de argila/arenito",
      depthLabel: "-35 m",
      kind: "geotecnia",
      color: "#a16207",
      foundColor: "#22c55e",
      emissiveHex: "#451a03",
      opacity: 0.56,
      topMeters: -31,
      bottomMeters: -39,
      path: [
        [-46.6402, -23.5523],
        [-46.6361, -23.5521],
        [-46.6314, -23.5518],
      ],
    },
    {
      id: "rocha-basaltica",
      title: "Rocha basáltica",
      depthLabel: "-50 m",
      kind: "geotecnia",
      color: "#3f3f46",
      foundColor: "#22c55e",
      emissiveHex: "#18181b",
      opacity: 0.86,
      topMeters: -48,
      bottomMeters: -57,
      path: [
        [-46.6404, -23.5535],
        [-46.636,  -23.5533],
        [-46.6312, -23.553],
      ],
    },
  ];

  // ── 13 Almas — coordenadas reais na área central de SP ───────────────────

  // IDs `subsolo-NN` — NÃO confundir com `alma-NN` do ARG (souls[] / missions/).
  var TREZE_ALMAS = [
    { id: "subsolo-01", title: "Rio soterrado",                         lngLat: [-46.6355, -23.5488], depthM: -11, freq: 1.10, phaseOff: 0.0 },
    { id: "subsolo-02", title: "Fundação colonial",                     lngLat: [-46.6348, -23.5466], depthM: -17, freq: 0.90, phaseOff: 0.7 },
    { id: "subsolo-03", title: "Câmara submersa",                       lngLat: [-46.6337, -23.5499], depthM: -9,  freq: 1.30, phaseOff: 1.4 },
    { id: "subsolo-04", title: "Adro do Colégio",                       lngLat: [-46.6325, -23.5480], depthM: -14, freq: 0.70, phaseOff: 2.1 },
    { id: "subsolo-05", title: "Argila do aterro",                      lngLat: [-46.6368, -23.5493], depthM: -33, freq: 1.50, phaseOff: 2.8 },
    { id: "subsolo-06", title: "Leito do Tamanduateí",                  lngLat: [-46.6313, -23.5503], depthM: -21, freq: 0.80, phaseOff: 3.5 },
    { id: "subsolo-07", title: "Túnel da Linha 3",                      lngLat: [-46.6351, -23.5511], depthM: -24, freq: 1.20, phaseOff: 4.2 },
    { id: "subsolo-08", title: "Galeria pluvial",                       lngLat: [-46.6378, -23.5472], depthM: -10, freq: 1.00, phaseOff: 0.3 },
    { id: "subsolo-09", title: "Rocha basáltica",                       lngLat: [-46.6341, -23.5524], depthM: -49, freq: 0.60, phaseOff: 1.0 },
    { id: "subsolo-10", title: "Vala do processo",                      lngLat: [-46.6362, -23.5455], depthM: -6,  freq: 1.40, phaseOff: 1.7 },
    { id: "subsolo-11", title: "Câmara de gás",                         lngLat: [-46.6332, -23.5468], depthM: -20, freq: 0.85, phaseOff: 2.4 },
    { id: "subsolo-12", title: "Aterro compactado",                     lngLat: [-46.6387, -23.5509], depthM: -28, freq: 1.15, phaseOff: 3.1 },
    { id: "subsolo-13", title: "Núcleo original",                       lngLat: [-46.6346, -23.5482], depthM: -42, freq: 0.50, phaseOff: 3.8 },
  ];

  // ── State helpers ────────────────────────────────────────────────────────

  function isMasterMode() {
    try {
      if (/[?&]master=1\b/.test(window.location.search)) return true;
      if (window.localStorage && window.localStorage.getItem(MASTER_STORAGE_KEY) === "1") return true;
    } catch (_e) { /* ignora */ }
    return false;
  }

  function unlockAlma7(options) {
    options = options || {};
    var enableView = options.enableView !== false;
    var clearProgress = options.clearProgress === true;
    try {
      if (window.localStorage) {
        window.localStorage.setItem(PHASE_STORAGE_KEY, String(getRequiredPhase()));
        if (enableView) window.localStorage.setItem(ENABLED_STORAGE_KEY, "1");
        var existing = [];
        var raw = window.localStorage.getItem(CADERNO_STORAGE_KEY);
        if (raw) {
          var parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) existing = parsed;
        }
        var set = new Set(existing);
        for (var i = 0; i < REQUIRED_CLUES.length; i++) set.add(REQUIRED_CLUES[i]);
        window.localStorage.setItem(CADERNO_STORAGE_KEY, JSON.stringify(Array.from(set)));
        if (clearProgress) window.localStorage.removeItem(FOUND_STORAGE_KEY);
      }
      var ph = window.CENTRO && window.CENTRO.protocoloPhase;
      if (ph && typeof ph.setPhase === "function") {
        ph.setPhase(getRequiredPhase());
      } else {
        document.dispatchEvent(new CustomEvent("centro:arg-state-changed"));
      }
      if (typeof window.centroToast === "function") {
        window.centroToast(
          "Alma 7 desbloqueada — Fase 7, 3 pistas do subsolo" +
            (clearProgress ? ", progresso zerado." : "."),
          "warn"
        );
      }
      return true;
    } catch (_e) {
      return false;
    }
  }

  function applyMasterBootstrap() {
    if (!isMasterMode()) return false;
    try {
      if (window.localStorage) window.localStorage.setItem(MASTER_STORAGE_KEY, "1");
    } catch (_e) {
      /* ignora */
    }
    var mm = window.CENTRO && window.CENTRO.masterMode;
    if (mm && typeof mm.bootstrapReviewUnlocks === "function") {
      mm.bootstrapReviewUnlocks();
      return true;
    }
    return unlockAlma7({ enableView: true, clearProgress: false });
  }

  function getCollectedClues() {
    var lu = window.CENTRO && window.CENTRO.layerUnlocks;
    if (lu && typeof lu.getCollectedClueIds === "function") return lu.getCollectedClueIds();
    return new Set();
  }

  function getPhase() {
    var ph = window.CENTRO && window.CENTRO.protocoloPhase;
    if (ph && typeof ph.getPhase === "function") return ph.getPhase();
    return 1;
  }

  function getRequiredPhase() {
    var ph = window.CENTRO && window.CENTRO.protocoloPhase;
    if (ph && typeof ph.getMinPhaseForFeature === "function") {
      return ph.getMinPhaseForFeature("subterranean");
    }
    return REQUIRED_PHASE;
  }

  function getPhaseLockLabel() {
    var ph = window.CENTRO && window.CENTRO.protocoloPhase;
    if (ph && typeof ph.formatPhaseLockLabel === "function") {
      return ph.formatPhaseLockLabel(getRequiredPhase());
    }
    return "Fase " + getRequiredPhase() + " — " + PHASE_TITLE;
  }

  function migrateLegacySoulId(id) {
    if (typeof id !== "string") return id;
    if (id.indexOf("subsolo-") === 0) return id;
    var match = /^alma-(\d{2})$/.exec(id);
    if (match) return "subsolo-" + match[1];
    return id;
  }

  function getFoundElementIds() {
    try {
      var raw = window.localStorage && window.localStorage.getItem(FOUND_STORAGE_KEY);
      if (!raw) return new Set();
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return new Set();
      var ids = new Set();
      for (var i = 0; i < parsed.length; i++) {
        if (typeof parsed[i] !== "string") continue;
        ids.add(migrateLegacySoulId(parsed[i]));
      }
      return ids;
    } catch (_e) { return new Set(); }
  }

  function persistFoundElementIds(ids) {
    try {
      if (window.localStorage) window.localStorage.setItem(FOUND_STORAGE_KEY, JSON.stringify(Array.from(ids)));
    } catch (_e) { /* ignora */ }
  }

  function countSoulsFound() {
    var found = getFoundElementIds();
    var n = 0;
    for (var i = 0; i < TREZE_ALMAS.length; i++) {
      if (found.has(TREZE_ALMAS[i].id)) n++;
    }
    return n;
  }

  function countGeoFound() {
    var found = getFoundElementIds();
    var n = 0;
    for (var i = 0; i < CUTAWAY_ITEMS.length; i++) {
      if (found.has(CUTAWAY_ITEMS[i].id)) n++;
    }
    return n;
  }

  function isViewEnabled() {
    try {
      return window.localStorage && window.localStorage.getItem(ENABLED_STORAGE_KEY) === "1";
    } catch (_e) {
      return false;
    }
  }

  function dispatchProgressEvent() {
    try {
      document.dispatchEvent(new CustomEvent("centro:subterranean-progress"));
    } catch (_e) { /* ignora */ }
  }

  function getMissingClues() {
    if (isMasterMode()) return [];
    var collected = getCollectedClues();
    var missing = [];
    for (var i = 0; i < REQUIRED_CLUES.length; i++) if (!collected.has(REQUIRED_CLUES[i])) missing.push(REQUIRED_CLUES[i]);
    return missing;
  }

  function isUnlocked() {
    if (isMasterMode()) return true;
    return getPhase() >= getRequiredPhase() && getMissingClues().length === 0;
  }

  function advancePhaseIfReady() {
    if (getMissingClues().length > 0 || getPhase() >= getRequiredPhase()) return;
    var ph = window.CENTRO && window.CENTRO.protocoloPhase;
    if (ph && typeof ph.setPhase === "function") ph.setPhase(REQUIRED_PHASE);
  }

  function getGateMessage() {
    if (isMasterMode()) return "Modo mestre — visão subterrânea liberada.";
    var missing = getMissingClues();
    var req = getRequiredPhase();
    var lockLabel = getPhaseLockLabel();
    if (getPhase() < req && missing.length > 0) return lockLabel + " e pistas exigidas: " + missing.join(", ") + ".";
    if (getPhase() < req) return "Pistas reunidas. Ative para abrir " + lockLabel + ".";
    if (missing.length > 0) return "Colete no Arquivo Morto: " + missing.join(", ") + ".";
    return "Visão subterrânea liberada.";
  }

  function getInitialEnabled() {
    if (isMasterMode()) return true;
    try { return window.localStorage && window.localStorage.getItem(ENABLED_STORAGE_KEY) === "1"; }
    catch (_e) { return false; }
  }

  function persistEnabled(enabled) {
    try { if (window.localStorage) window.localStorage.setItem(ENABLED_STORAGE_KEY, enabled ? "1" : "0"); }
    catch (_e) { /* ignora */ }
  }

  // ── Coordenadas Mercator ─────────────────────────────────────────────────

  function modelOriginMercator() {
    return maplibregl.MercatorCoordinate.fromLngLat({ lng: MODEL_ORIGIN[0], lat: MODEL_ORIGIN[1] }, 0);
  }

  function localPoint(origin, scale, lngLat, altMeters) {
    var p = maplibregl.MercatorCoordinate.fromLngLat({ lng: lngLat[0], lat: lngLat[1] }, altMeters || 0);
    return new THREE.Vector3(
      (p.x - origin.x) / scale,
      (p.y - origin.y) / scale,
      altMeters || 0
    );
  }

  // ── Geometria: painéis geológicos ────────────────────────────────────────

  function addPanelGeometry(verts, aT, aB, bT, bB) {
    verts.push(aT.x, aT.y, aT.z, aB.x, aB.y, aB.z, bT.x, bT.y, bT.z);
    verts.push(bT.x, bT.y, bT.z, aB.x, aB.y, aB.z, bB.x, bB.y, bB.z);
  }

  function makeItemMesh(item, origin, scale, foundIds) {
    var verts = [];
    for (var i = 0; i < item.path.length - 1; i++) {
      var a = item.path[i], b = item.path[i + 1];
      addPanelGeometry(
        verts,
        localPoint(origin, scale, a, item.topMeters),
        localPoint(origin, scale, a, item.bottomMeters),
        localPoint(origin, scale, b, item.topMeters),
        localPoint(origin, scale, b, item.bottomMeters)
      );
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geo.computeBoundingSphere();
    var isFound = foundIds.has(item.id);
    var mat = new THREE.MeshStandardMaterial({
      color:             isFound ? item.foundColor : item.color,
      emissive:          item.emissiveHex,
      emissiveIntensity: item.kind === "rio" ? 0.45 : 0.15,
      transparent: true,
      opacity:     item.opacity,
      side:        THREE.DoubleSide,
      depthWrite:  false,
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.name = item.id;
    mesh.userData.subterraneanItem = item;
    mesh.userData.isGeo = true;
    return mesh;
  }

  // ── Geometria: almas ─────────────────────────────────────────────────────

  function makeSoulMesh(alma, origin, scale, isFound) {
    var pos = localPoint(origin, scale, alma.lngLat, alma.depthM);
    var geo = new THREE.SphereGeometry(1.2, 16, 16);
    var mat = new THREE.MeshStandardMaterial({
      color:             isFound ? "#22c55e" : "#ef4444",
      emissive:          isFound ? "#166534" : "#7f1d1d",
      emissiveIntensity: 0.6,
      transparent: true,
      opacity:     0.90,
      roughness:   0.3,
      metalness:   0.1,
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.name = alma.id;
    mesh.userData.alma   = alma;
    mesh.userData.isSoul = true;
    mesh.userData.found  = isFound;
    return mesh;
  }

  function makeSurfaceLine(origin, scale) {
    var pts = [
      localPoint(origin, scale, [-46.6408, -23.5448], 0),
      localPoint(origin, scale, [-46.6310, -23.5538], 0),
    ];
    var geo = new THREE.BufferGeometry().setFromPoints(pts);
    var mat = new THREE.LineBasicMaterial({ color: "#f8fafc", transparent: true, opacity: 0.65 });
    var line = new THREE.Line(geo, mat);
    line.name = "linha-do-solo";
    return line;
  }

  // ── Sistema de partículas ────────────────────────────────────────────────

  var activeParticles = [];

  function createParticleBurst(soulPosition, scene) {
    var count = 50;
    var positions = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      positions[i * 3]     = soulPosition.x;
      positions[i * 3 + 1] = soulPosition.y;
      positions[i * 3 + 2] = soulPosition.z;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    var mat = new THREE.PointsMaterial({
      color: "#22c55e",
      size:  0.6,
      transparent: true,
      opacity:     1.0,
      depthWrite:  false,
      sizeAttenuation: true,
    });
    var pts = new THREE.Points(geo, mat);
    scene.add(pts);

    var vels = [];
    for (var i = 0; i < count; i++) {
      var theta = Math.random() * Math.PI * 2;
      var phi   = Math.random() * Math.PI;
      var spd   = 0.06 + Math.random() * 0.14;
      vels.push({
        x: Math.sin(phi) * Math.cos(theta) * spd,
        y: Math.sin(phi) * Math.sin(theta) * spd,
        z: Math.cos(phi) * spd + 0.02,
      });
    }
    activeParticles.push({ pts: pts, vels: vels, startMs: performance.now(), durationMs: 1500 });
  }

  function updateParticles(scene) {
    var now = performance.now();
    var keep = [];
    for (var i = 0; i < activeParticles.length; i++) {
      var p = activeParticles[i];
      var elapsed = now - p.startMs;
      if (elapsed >= p.durationMs) {
        scene.remove(p.pts);
        p.pts.geometry.dispose();
        p.pts.material.dispose();
        continue;
      }
      var t   = elapsed / p.durationMs;
      var arr = p.pts.geometry.attributes.position.array;
      for (var j = 0; j < arr.length / 3; j++) {
        arr[j * 3]     += p.vels[j].x;
        arr[j * 3 + 1] += p.vels[j].y;
        arr[j * 3 + 2] += p.vels[j].z;
        p.vels[j].x *= 0.96;
        p.vels[j].y *= 0.96;
        p.vels[j].z *= 0.96;
      }
      p.pts.geometry.attributes.position.needsUpdate = true;
      p.pts.material.opacity = 1.0 - t;
      keep.push(p);
    }
    activeParticles = keep;
  }

  // ── Glitch de aparição ───────────────────────────────────────────────────

  var glitchState = null;

  function startGlitchEffect(objects) {
    if (PREFERES_REDUCED) return;
    var origPositions = objects.map(function (o) { return o.position.clone(); });
    objects.forEach(function (o) {
      o.position.x += (Math.random() - 0.5) * 14;
      o.position.z += (Math.random() - 0.5) * 9;
    });
    glitchState = { startMs: performance.now(), origPositions: origPositions, objects: objects };
  }

  function updateGlitchEffect() {
    if (!glitchState) return false;
    var elapsed   = performance.now() - glitchState.startMs;
    var amplitude = elapsed < 200 ? 12 : elapsed < 500 ? 4 : elapsed < 1000 ? 1.2 : 0;
    var objs  = glitchState.objects;
    var origs = glitchState.origPositions;
    if (amplitude === 0) {
      for (var i = 0; i < objs.length; i++) objs[i].position.copy(origs[i]);
      glitchState = null;
      return false;
    }
    for (var i = 0; i < objs.length; i++) {
      objs[i].position.x = origs[i].x + (Math.random() - 0.5) * amplitude;
      objs[i].position.z = origs[i].z + (Math.random() - 0.5) * amplitude * 0.6;
    }
    return true;
  }

  // ── Animações ────────────────────────────────────────────────────────────

  function animateSouls(soulMeshes, time) {
    for (var i = 0; i < soulMeshes.length; i++) {
      var mesh = soulMeshes[i];
      if (mesh.userData.found) continue;
      var alma = mesh.userData.alma;
      if (!alma) continue;
      var s = 1.0 + 0.18 * Math.sin(time * alma.freq * Math.PI * 2 + alma.phaseOff);
      mesh.scale.setScalar(s);
      mesh.material.emissiveIntensity = 0.45 + 0.45 * Math.abs(Math.sin(time * alma.freq * Math.PI + alma.phaseOff));
    }
  }

  function animateRiver(riverMesh, time) {
    if (!riverMesh) return;
    var t = Math.sin(time * 0.5 * Math.PI * 2);
    riverMesh.material.opacity           = 0.65 + 0.12 * t;
    riverMesh.material.emissiveIntensity = 0.35 + 0.25 * Math.abs(t);
  }

  function animateScanlines(geoMeshes, time) {
    for (var i = 0; i < geoMeshes.length; i++) {
      var mesh = geoMeshes[i];
      if (!mesh.userData.isGeo) continue;
      if (mesh.userData.subterraneanItem && mesh.userData.subterraneanItem.kind === "rio") continue;
      var wave = Math.sin(time * 0.3 * Math.PI * 2 + i * 0.9);
      mesh.material.emissiveIntensity = 0.08 + 0.12 * Math.abs(wave);
    }
  }

  // ── Hit testing por espaço de tela ───────────────────────────────────────

  function nearestSoulByScreen(map, point, soulMeshes) {
    var best = null, bestDist = Infinity;
    for (var i = 0; i < soulMeshes.length; i++) {
      var alma = soulMeshes[i].userData.alma;
      if (!alma) continue;
      var p = map.project(alma.lngLat);
      var dist = Math.hypot(p.x - point.x, p.y - point.y);
      if (dist < bestDist) { best = soulMeshes[i]; bestDist = dist; }
    }
    return bestDist <= HIT_SOUL_PX ? best : null;
  }

  function nearestItemByScreen(map, point) {
    var best = null, bestDist = Infinity;
    for (var i = 0; i < CUTAWAY_ITEMS.length; i++) {
      var item = CUTAWAY_ITEMS[i];
      var lngLat = item.path[Math.floor(item.path.length / 2)] || item.path[0];
      var p = map.project(lngLat);
      var dist = Math.hypot(p.x - point.x, p.y - point.y);
      if (dist < bestDist) { best = item; bestDist = dist; }
    }
    return bestDist <= HIT_ELEM_PX ? best : null;
  }

  // ── Custom Layer Three.js ─────────────────────────────────────────────────

  function createThreeLayer(map) {
    var origin = modelOriginMercator();
    var scale  = origin.meterInMercatorCoordinateUnits();
    var mt     = { translateX: origin.x, translateY: origin.y, translateZ: origin.z, scale: scale };

    var scene, camera, renderer, clock, raycaster;
    var soulMeshes = [], geoMeshes = [], riverMesh = null;

    return {
      id: LAYER_ID,
      type: "custom",
      renderingMode: "3d",

      onAdd: function (_map, gl) {
        clock    = new THREE.Clock();
        camera   = new THREE.Camera();
        scene    = new THREE.Scene();
        raycaster = new THREE.Raycaster();

        scene.add(new THREE.AmbientLight(0x334155, 0.65));
        var dir = new THREE.DirectionalLight(0xffffff, 0.85);
        dir.position.set(0, -70, 100).normalize();
        scene.add(dir);

        scene.add(makeSurfaceLine(origin, scale));

        var foundIds = getFoundElementIds();
        for (var i = 0; i < CUTAWAY_ITEMS.length; i++) {
          var m = makeItemMesh(CUTAWAY_ITEMS[i], origin, scale, foundIds);
          scene.add(m);
          geoMeshes.push(m);
          if (CUTAWAY_ITEMS[i].kind === "rio") riverMesh = m;
        }

        for (var i = 0; i < TREZE_ALMAS.length; i++) {
          var soul = makeSoulMesh(TREZE_ALMAS[i], origin, scale, foundIds.has(TREZE_ALMAS[i].id));
          scene.add(soul);
          soulMeshes.push(soul);
        }

        renderer = new THREE.WebGLRenderer({ canvas: _map.getCanvas(), context: gl, antialias: true });
        renderer.autoClear = false;

        startGlitchEffect(geoMeshes.concat(soulMeshes));
      },

      render: function (_gl, matrix) {
        var time = clock.getElapsedTime();

        var m = new THREE.Matrix4().fromArray(matrix);
        var l = new THREE.Matrix4()
          .makeTranslation(mt.translateX, mt.translateY, mt.translateZ)
          .scale(new THREE.Vector3(mt.scale, -mt.scale, mt.scale));
        camera.projectionMatrix = m.multiply(l);
        camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();

        if (!PREFERES_REDUCED) {
          animateSouls(soulMeshes, time);
          animateRiver(riverMesh, time);
          animateScanlines(geoMeshes, time);
          updateParticles(scene);
          updateGlitchEffect();
        }

        renderer.resetState();
        renderer.render(scene, camera);

        if (!PREFERES_REDUCED) map.triggerRepaint();
      },

      updateFoundColors: function () {
        var foundIds = getFoundElementIds();
        for (var i = 0; i < geoMeshes.length; i++) {
          var item = geoMeshes[i].userData.subterraneanItem;
          if (!item) continue;
          geoMeshes[i].material.color.set(foundIds.has(item.id) ? item.foundColor : item.color);
          geoMeshes[i].material.needsUpdate = true;
        }
        for (var i = 0; i < soulMeshes.length; i++) {
          var alma = soulMeshes[i].userData.alma;
          if (!alma) continue;
          var isFound = foundIds.has(alma.id);
          soulMeshes[i].material.color.set(isFound ? "#22c55e" : "#ef4444");
          soulMeshes[i].material.emissive.set(isFound ? "#166534" : "#7f1d1d");
          soulMeshes[i].userData.found = isFound;
          if (isFound) soulMeshes[i].scale.setScalar(1.0);
        }
        map.triggerRepaint();
      },

      burstAt: function (almaId) {
        if (!scene) return;
        for (var i = 0; i < soulMeshes.length; i++) {
          if (soulMeshes[i].name === almaId) {
            if (!PREFERES_REDUCED) createParticleBurst(soulMeshes[i].position, scene);
            map.triggerRepaint();
            return;
          }
        }
      },

      pickSoul: function (point) {
        return nearestSoulByScreen(map, point, soulMeshes);
      },

      pickItem: function (point) {
        return nearestItemByScreen(map, point);
      },

      onRemove: function () {
        if (scene) scene.traverse(function (o) {
          if (o.geometry) o.geometry.dispose();
          if (o.material) o.material.dispose();
        });
        if (renderer) renderer.dispose();
        activeParticles = [];
        glitchState     = null;
        soulMeshes      = [];
        geoMeshes       = [];
        riverMesh       = null;
        scene = camera = renderer = clock = raycaster = null;
      },
    };
  }

  // ── Sidebar: status ───────────────────────────────────────────────────────

  function syncStatus() {
    var el = document.getElementById(STATUS_ID);
    if (!el) return;
    el.textContent = getGateMessage();
    el.classList.toggle("subterranean-status--locked", !isUnlocked());
    syncPhaseGateCard();
  }

  function syncPhaseGateCard() {
    var cb = document.getElementById(TOGGLE_ID);
    var card = cb && cb.closest(".sidebar-viz-card");
    var unlocked = isUnlocked();
    if (cb) cb.disabled = !unlocked;
    if (card) card.classList.toggle("sidebar-viz-card--phase-locked", !unlocked);
  }

  // ── Sidebar: legenda (elementos + almas) ─────────────────────────────────

  function syncLegend() {
    var legend = document.getElementById(LEGEND_ID);
    if (!legend) return;
    legend.innerHTML = "";
    var found = getFoundElementIds();

    var geoGroup = document.createElement("div");
    geoGroup.className = "subterranean-legend__group";
    var geoTitle = document.createElement("div");
    geoTitle.className = "subterranean-legend__group-title";
    geoTitle.textContent = "Corte geológico";
    geoGroup.appendChild(geoTitle);

    for (var i = 0; i < CUTAWAY_ITEMS.length; i++) {
      var item = CUTAWAY_ITEMS[i];
      var row  = document.createElement("div");
      row.className = "subterranean-legend__item" + (found.has(item.id) ? " subterranean-legend__item--found" : "");
      var sw = document.createElement("span");
      sw.className = "subterranean-legend__swatch subterranean-legend__swatch--" + item.kind;
      sw.setAttribute("aria-hidden", "true");
      var txt = document.createElement("span");
      txt.className = "subterranean-legend__label";
      txt.textContent = item.depthLabel + " — " + item.title;
      row.appendChild(sw);
      row.appendChild(txt);
      geoGroup.appendChild(row);
    }
    legend.appendChild(geoGroup);

    var soulFound  = TREZE_ALMAS.filter(function (a) { return found.has(a.id); }).length;
    var soulGroup  = document.createElement("div");
    soulGroup.className = "subterranean-legend__group";
    var soulTitle  = document.createElement("div");
    soulTitle.className = "subterranean-legend__group-title";
    soulTitle.textContent = "13 Almas — " + soulFound + "/13 encontradas";
    soulGroup.appendChild(soulTitle);
    for (var i = 0; i < TREZE_ALMAS.length; i++) {
      var alma = TREZE_ALMAS[i];
      var row  = document.createElement("div");
      row.className = "subterranean-legend__item" + (found.has(alma.id) ? " subterranean-legend__item--found" : "");
      var sw = document.createElement("span");
      sw.className = "subterranean-legend__swatch subterranean-legend__swatch--alma";
      sw.setAttribute("aria-hidden", "true");
      var txt = document.createElement("span");
      txt.className = "subterranean-legend__label";
      txt.textContent = alma.title;
      row.appendChild(sw);
      row.appendChild(txt);
      soulGroup.appendChild(row);
    }
    legend.appendChild(soulGroup);
  }

  // ── Rótulos flutuantes no mapa ───────────────────────────────────────────

  function ensureLabelsHost() {
    var host = document.getElementById(LABELS_ID);
    if (host) return host;
    host = document.createElement("div");
    host.id        = LABELS_ID;
    host.className = "subterranean-labels";
    host.setAttribute("aria-hidden", "true");
    document.body.appendChild(host);
    return host;
  }

  function updateLabels(map, enabled) {
    var host = ensureLabelsHost();
    host.hidden = !enabled;
    if (!enabled) return;
    host.innerHTML = "";
    var found = getFoundElementIds();
    for (var i = 0; i < CUTAWAY_ITEMS.length; i++) {
      var item  = CUTAWAY_ITEMS[i];
      var lngLat = item.path[Math.floor(item.path.length / 2)] || item.path[0];
      var p     = map.project(lngLat);
      var lbl   = document.createElement("span");
      lbl.className = "subterranean-label" + (found.has(item.id) ? " subterranean-label--found" : "");
      lbl.style.transform = "translate(" + Math.round(p.x) + "px," + Math.round(p.y) + "px)";
      lbl.textContent     = item.depthLabel + " " + item.title;
      host.appendChild(lbl);
    }
  }

  // ── API de interacção ────────────────────────────────────────────────────

  function create(ctx) {
    var getMap       = ctx.getMap;
    var clickHandler = null;
    var moveHandler  = null;
    var activeLayer  = null;
    var enabled      = false;

    function markItemFound(item) {
      var ids    = getFoundElementIds();
      var wasNew = !ids.has(item.id);
      ids.add(item.id);
      persistFoundElementIds(ids);
      syncLegend();
      if (activeLayer) activeLayer.updateFoundColors();
      var map = getMap();
      if (map) updateLabels(map, enabled);
      if (typeof window.centroToast === "function") {
        window.centroToast(
          wasNew ? "Evidência subterrânea registrada: " + item.title + "." : "Evidência já registrada: " + item.title + ".",
          "warn"
        );
      }
      dispatchProgressEvent();
    }

    function markSoulFound(soulMesh) {
      var alma = soulMesh.userData.alma;
      if (!alma) return;
      var ids    = getFoundElementIds();
      var wasNew = !ids.has(alma.id);
      ids.add(alma.id);
      persistFoundElementIds(ids);
      syncLegend();
      if (activeLayer) {
        activeLayer.updateFoundColors();
        activeLayer.burstAt(alma.id);
      }
      var map = getMap();
      if (map) updateLabels(map, enabled);
      if (typeof window.centroToast === "function") {
        window.centroToast(
          wasNew ? "ALMA ENCONTRADA: " + alma.title + "." : "Alma já registrada: " + alma.title + ".",
          "warn"
        );
      }
      dispatchProgressEvent();
    }

    function bindInteraction(map) {
      if (clickHandler) return;
      clickHandler = function (e) {
        if (!enabled || !activeLayer) return;
        var soul = activeLayer.pickSoul(e.point);
        if (soul) { markSoulFound(soul); return; }
        var item = activeLayer.pickItem(e.point);
        if (item) markItemFound(item);
      };
      moveHandler = function () { updateLabels(map, enabled); };
      map.on("click", clickHandler);
      map.on("move",  moveHandler);
      map.on("zoom",  moveHandler);
      map.on("pitch", moveHandler);
      map.on("rotate", moveHandler);
    }

    function unbindInteraction(map) {
      if (!clickHandler) return;
      map.off("click", clickHandler);
      map.off("move",  moveHandler);
      map.off("zoom",  moveHandler);
      map.off("pitch", moveHandler);
      map.off("rotate", moveHandler);
      clickHandler = moveHandler = null;
    }

    function syncToggleUI(nextEnabled) {
      var cb = document.getElementById(TOGGLE_ID);
      if (cb) cb.checked = !!nextEnabled;
      document.body.classList.toggle("subterranean-active", !!nextEnabled);
      var flyBtn = document.getElementById("subterranean-fly-sidebar-btn");
      if (flyBtn) flyBtn.hidden = !nextEnabled;
      syncStatus();
      syncLegend();
      var map = getMap();
      if (map) updateLabels(map, !!nextEnabled);
    }

    function flyToSubterranean(map) {
      // Aguarda o mapa ficar idle antes de voar — evita que o flyTo seja
      // cancelado pelo render inicial ou pela actualização do hash da URL.
      if (!map) return;
      if (map.isMoving() || map.isZooming() || map.isRotating()) {
        map.once("idle", function () {
          map.flyTo({ center: CENTER, zoom: 16.35, pitch: 70, bearing: -18, duration: 1800 });
        });
      } else {
        map.flyTo({ center: CENTER, zoom: 16.35, pitch: 70, bearing: -18, duration: 1800 });
      }
    }

    function setEnabled(nextEnabled, options) {
      options = options || {};
      var map = getMap();
      if (!map || !map.addLayer) return false;
      if (nextEnabled) advancePhaseIfReady();
      if (nextEnabled && !isUnlocked()) {
        enabled = false;
        persistEnabled(false);
        syncToggleUI(false);
        if (!options.silent && typeof window.centroToast === "function") {
          window.centroToast("Visão subterrânea bloqueada. " + getGateMessage(), "warn");
        }
        return false;
      }
      enabled = !!nextEnabled;
      if (enabled && !map.getLayer(LAYER_ID)) {
        activeLayer = createThreeLayer(map);
        map.addLayer(activeLayer);
        bindInteraction(map);
        // noFly=true quando restaurado no boot (usuário já está orientado).
        // Voa apenas quando o usuário activa explicitamente o toggle.
        if (!options.noFly) flyToSubterranean(map);
      } else if (!enabled && map.getLayer(LAYER_ID)) {
        unbindInteraction(map);
        map.removeLayer(LAYER_ID);
        activeLayer = null;
      }
      if (options.persist !== false) persistEnabled(enabled);
      syncToggleUI(enabled);
      return true;
    }

    function setupToggle() {
      var cb = document.getElementById(TOGGLE_ID);
      if (!cb) return;
      syncStatus();
      syncLegend();
      cb.addEventListener("change", function () {
        // mapReadyPromise já resolvida — .then() executa no próximo microtask,
        // depois do event handler corrente, dando ao mapa tempo de estabilizar.
        ctx.mapReadyPromise.then(function () { setEnabled(cb.checked); });
      });
    }

    function initState() {
      applyMasterBootstrap();
      syncStatus();
      syncLegend();
      if (getInitialEnabled()) {
        // noFly: evita conflito com posição inicial/hash durante o boot.
        setEnabled(true, { persist: false, silent: true, noFly: true });
        if (isMasterMode() && typeof window.centroToast === "function") {
          window.centroToast("Modo mestre activo. Active o toggle para a visão subterrânea.", "warn");
        }
      } else {
        syncToggleUI(false);
      }
    }

    function syncPhaseGate() {
      syncStatus();
      if (!isUnlocked() && enabled) {
        setEnabled(false, { persist: true, silent: true });
      }
    }

    function flyToView() {
      var map = getMap();
      if (!map) return;
      flyToSubterranean(map);
    }

    return {
      LAYER_ID:            LAYER_ID,
      REQUIRED_PHASE:      REQUIRED_PHASE,
      getRequiredPhase:    getRequiredPhase,
      REQUIRED_CLUES:      REQUIRED_CLUES.slice(),
      ENABLED_STORAGE_KEY: ENABLED_STORAGE_KEY,
      FOUND_STORAGE_KEY:   FOUND_STORAGE_KEY,
      isUnlocked:          isUnlocked,
      advancePhaseIfReady: advancePhaseIfReady,
      getGateMessage:      getGateMessage,
      setEnabled:          setEnabled,
      flyToView:           flyToView,
      setupToggle:         setupToggle,
      initState:           initState,
      syncToggleUI:        syncToggleUI,
      syncPhaseGate:       syncPhaseGate,
    };
  }

  applyMasterBootstrap();

  window.CENTRO = window.CENTRO || {};
  window.CENTRO.subterraneanCutaway = {
    create: create,
    ready: true,
    SOUL_COUNT: TREZE_ALMAS.length,
    GEO_COUNT: CUTAWAY_ITEMS.length,
    SOUL_IDS: TREZE_ALMAS.map(function (a) {
      return a.id;
    }),
    GEO_ITEM_IDS: CUTAWAY_ITEMS.map(function (item) {
      return item.id;
    }),
    FOUND_STORAGE_KEY: FOUND_STORAGE_KEY,
    getFoundElementIds: getFoundElementIds,
    countSoulsFound: countSoulsFound,
    countGeoFound: countGeoFound,
    isUnlocked: isUnlocked,
    isViewEnabled: isViewEnabled,
  };
  window.CENTRO.dev = window.CENTRO.dev || {};
  window.CENTRO.dev.unlockAlma7 = unlockAlma7;
  document.dispatchEvent(new CustomEvent("centro:subterranean-ready"));
})();
