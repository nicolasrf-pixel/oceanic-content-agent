/*
 * Oceanic Content Engine — Master Catalog dashboard.
 * Vanilla JS, no build step, no dependencies. Reads directly from:
 *   ../data/catalog/master-catalog.json
 *   ../data/catalog/oceanic-catalog.json
 * Nothing here is hardcoded from the dataset — every number, filter option
 * and card is derived at load time from those two files.
 */
(function () {
  "use strict";

  var MASTER_URL = "../data/catalog/master-catalog.json";
  var OCEANIC_URL = "../data/catalog/oceanic-catalog.json";

  var STATUS_META = {
    CURRENT:      { label: "Vigente",        glyph: "●", cls: "current" },
    NEW:          { label: "Nuevo",          glyph: "◆", cls: "new" },
    ANNOUNCED:    { label: "Anunciado",      glyph: "◐", cls: "announced" },
    DISCONTINUED: { label: "Descontinuado",  glyph: "✕", cls: "discontinued" },
    UNCONFIRMED:  { label: "Sin confirmar",  glyph: "?", cls: "unconfirmed" }
  };

  var REVIEW_REASON_LABELS = {
    unresolved_discrepancy: "Discrepancia entre fuentes sin resolver",
    low_confidence: "Nivel de confianza bajo (LOW)",
    single_source: "Solo una fuente registrada",
    unconfirmed_lifecycle: "Estado del modelo sin confirmar"
  };

  // ---- state -------------------------------------------------------

  var state = {
    allModels: [],       // flat array, every model enriched with brand info
    oceanicKeySet: null, // Set of "brandId::modelId" confirmed via oceanic-catalog.json
    filters: { brand: "", category: "", family: "", status: "", oceanic: "", review: false },
    search: "",
    view: "brands"       // "brands" | "models"
  };

  var els = {};

  // ---- boot ----------------------------------------------------------

  document.addEventListener("DOMContentLoaded", function () {
    cacheEls();
    bindEvents();
    loadData();
  });

  function cacheEls() {
    els.headerMeta = document.getElementById("header-meta");
    els.kpiBar = document.getElementById("kpi-bar");
    els.searchInput = document.getElementById("search-input");
    els.filterBrand = document.getElementById("filter-brand");
    els.filterCategory = document.getElementById("filter-category");
    els.filterFamily = document.getElementById("filter-family");
    els.filterStatus = document.getElementById("filter-status");
    els.filterOceanic = document.getElementById("filter-oceanic");
    els.filterReview = document.getElementById("filter-review");
    els.clearFilters = document.getElementById("clear-filters");
    els.resultCount = document.getElementById("result-count");
    els.brandsView = document.getElementById("brands-view");
    els.modelsView = document.getElementById("models-view");
    els.modelsViewTitle = document.getElementById("models-view-title");
    els.modelGrid = document.getElementById("model-grid");
    els.backToBrands = document.getElementById("back-to-brands");
    els.overlay = document.getElementById("detail-overlay");
    els.detailPanel = document.getElementById("detail-panel");
    els.detailContent = document.getElementById("detail-content");
    els.detailClose = document.getElementById("detail-close");
    els.main = document.querySelector(".app-main");
  }

  function bindEvents() {
    els.searchInput.addEventListener("input", debounce(function (e) {
      state.search = e.target.value.trim().toLowerCase();
      state.view = state.search ? "models" : (hasActiveFilters() ? "models" : "brands");
      render();
    }, 120));

    els.filterBrand.addEventListener("change", function (e) {
      state.filters.brand = e.target.value;
      populateFamilyOptions();
      state.view = "models";
      render();
    });
    els.filterCategory.addEventListener("change", function (e) {
      state.filters.category = e.target.value;
      populateFamilyOptions();
      state.view = "models";
      render();
    });
    els.filterFamily.addEventListener("change", function (e) {
      state.filters.family = e.target.value;
      state.view = "models";
      render();
    });
    els.filterStatus.addEventListener("change", function (e) {
      state.filters.status = e.target.value;
      state.view = "models";
      render();
    });
    els.filterOceanic.addEventListener("change", function (e) {
      state.filters.oceanic = e.target.value;
      state.view = "models";
      render();
    });
    els.filterReview.addEventListener("change", function (e) {
      state.filters.review = e.target.checked;
      state.view = "models";
      render();
    });

    els.clearFilters.addEventListener("click", function () {
      state.filters = { brand: "", category: "", family: "", status: "", oceanic: "", review: false };
      state.search = "";
      els.searchInput.value = "";
      els.filterBrand.value = "";
      els.filterCategory.value = "";
      els.filterStatus.value = "";
      els.filterOceanic.value = "";
      els.filterReview.checked = false;
      populateFamilyOptions();
      state.view = "brands";
      render();
    });

    els.backToBrands.addEventListener("click", function () {
      state.filters.brand = "";
      els.filterBrand.value = "";
      populateFamilyOptions();
      state.view = "brands";
      render();
    });

    els.detailClose.addEventListener("click", closeDetail);
    els.overlay.addEventListener("click", closeDetail);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeDetail();
    });
  }

  // ---- data loading ----------------------------------------------------

  function loadData() {
    Promise.all([fetchJSON(MASTER_URL), fetchJSON(OCEANIC_URL)])
      .then(function (results) {
        var master = results[0];
        var oceanic = results[1];
        state.allModels = flatten(master);
        state.oceanicKeySet = buildOceanicKeySet(oceanic);
        applyOceanicCrossCheck();
        els.headerMeta.textContent =
          master.catalog_meta.total_models + " modelos · " +
          master.catalog_meta.total_brands + " marcas · generado " +
          master.catalog_meta.generated_at;
        populateFilterOptions();
        render();
      })
      .catch(function (err) {
        showLoadError(err);
      });
  }

  function fetchJSON(url) {
    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error(url + " → HTTP " + res.status);
      return res.json();
    });
  }

  function showLoadError(err) {
    els.headerMeta.textContent = "Error al cargar datos";
    var tpl = document.getElementById("tpl-error");
    var node = tpl.content.cloneNode(true);
    node.querySelector(".error-state__detail").textContent = String(err.message || err);
    els.brandsView.innerHTML = "";
    els.brandsView.appendChild(node);
    els.kpiBar.innerHTML = "";
  }

  // flatten the Marca -> Categoria -> Familia -> Modelo tree into an array
  function flatten(catalog) {
    var out = [];
    (catalog.brands || []).forEach(function (brand) {
      (brand.categories || []).forEach(function (cat) {
        (cat.families || []).forEach(function (fam) {
          (fam.models || []).forEach(function (model) {
            var copy = Object.assign({}, model);
            copy._brandOfficialName = brand.official_name;
            copy._brandManufacturerUrl = brand.manufacturer_url;
            copy._brandPortfolioStatus = brand.portfolio_status;
            out.push(copy);
          });
        });
      });
    });
    return out;
  }

  function buildOceanicKeySet(oceanicCatalog) {
    var set = new Set();
    (oceanicCatalog.brands || []).forEach(function (brand) {
      (brand.categories || []).forEach(function (cat) {
        (cat.families || []).forEach(function (fam) {
          (fam.models || []).forEach(function (model) {
            set.add(brand.brand_id + "::" + model.model_id);
          });
        });
      });
    });
    return set;
  }

  // cross-check: the authoritative "confirmed by Oceanic" flag used across
  // the UI is membership in oceanic-catalog.json, not just the embedded
  // oceanic_evidence field on the master record (both are generated
  // together today, but this keeps the two files genuinely load-bearing).
  function applyOceanicCrossCheck() {
    state.allModels.forEach(function (m) {
      m._oceanicConfirmed = state.oceanicKeySet.has(m.brand_id + "::" + m.model_id);
    });
  }

  // ---- filter option population (dynamic, never hardcoded) -------------

  function populateFilterOptions() {
    var brands = uniqueSorted(state.allModels.map(function (m) { return m.brand_id + " " + m.brand_name; }))
      .map(function (s) { var p = s.split(" "); return { id: p[0], name: p[1] }; });
    fillSelect(els.filterBrand, brands.map(function (b) { return [b.id, b.name]; }), "Todas");

    var categories = uniqueSorted(state.allModels.map(function (m) { return m.category + " " + m.category_label; }))
      .map(function (s) { var p = s.split(" "); return { id: p[0], name: p[1] }; });
    fillSelect(els.filterCategory, categories.map(function (c) { return [c.id, c.name]; }), "Todas");

    populateFamilyOptions();
  }

  function populateFamilyOptions() {
    var scoped = state.allModels.filter(function (m) {
      if (state.filters.brand && m.brand_id !== state.filters.brand) return false;
      if (state.filters.category && m.category !== state.filters.category) return false;
      return true;
    });
    var families = uniqueSorted(scoped.map(function (m) { return m.family; }));
    fillSelect(els.filterFamily, families.map(function (f) { return [f, f]; }), "Todas");
    if (families.indexOf(state.filters.family) === -1) {
      state.filters.family = "";
      els.filterFamily.value = "";
    }
  }

  function fillSelect(select, pairs, allLabel) {
    var current = select.value;
    select.innerHTML = "";
    var optAll = document.createElement("option");
    optAll.value = "";
    optAll.textContent = allLabel;
    select.appendChild(optAll);
    pairs.forEach(function (p) {
      var opt = document.createElement("option");
      opt.value = p[0];
      opt.textContent = p[1];
      select.appendChild(opt);
    });
    if (pairs.some(function (p) { return p[0] === current; })) select.value = current;
  }

  function uniqueSorted(arr) {
    return Array.from(new Set(arr)).sort(function (a, b) { return a.localeCompare(b, "es"); });
  }

  // ---- filtering ---------------------------------------------------

  function hasActiveFilters() {
    var f = state.filters;
    return !!(f.brand || f.category || f.family || f.status || f.oceanic || f.review);
  }

  function getFilteredModels() {
    var f = state.filters;
    var q = state.search;
    return state.allModels.filter(function (m) {
      if (f.brand && m.brand_id !== f.brand) return false;
      if (f.category && m.category !== f.category) return false;
      if (f.family && m.family !== f.family) return false;
      if (f.status && m.lifecycle_status !== f.status) return false;
      if (f.oceanic === "yes" && !m._oceanicConfirmed) return false;
      if (f.oceanic === "no" && m._oceanicConfirmed) return false;
      if (f.review && !m.requires_review) return false;
      if (q) {
        var hay = (m.model_name + " " + m.family + " " + m.brand_name).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  // ---- render: orchestrator -----------------------------------------

  function render() {
    renderKPIs();
    if (state.view === "brands") {
      els.brandsView.hidden = false;
      els.modelsView.hidden = true;
      els.resultCount.textContent = "";
      renderBrandCards();
    } else {
      els.brandsView.hidden = true;
      els.modelsView.hidden = false;
      var filtered = getFilteredModels();
      els.resultCount.textContent = filtered.length + " modelo(s) encontrados de " + state.allModels.length + " en total.";
      els.modelsViewTitle.textContent = state.filters.brand
        ? (state.allModels.find(function (m) { return m.brand_id === state.filters.brand; }) || {}).brand_name || ""
        : "Resultados";
      renderModelGrid(filtered);
    }
  }

  // ---- KPIs ----------------------------------------------------------

  function renderKPIs() {
    var models = state.allModels;
    var brandCount = new Set(models.map(function (m) { return m.brand_id; })).size;
    var oceanicCount = models.filter(function (m) { return m._oceanicConfirmed; }).length;
    var currentCount = models.filter(function (m) { return m.status_bucket === "current"; }).length;
    var historicalCount = models.filter(function (m) { return m.status_bucket === "historical"; }).length;
    var reviewCount = models.filter(function (m) { return m.requires_review; }).length;
    var unconfirmedCount = models.filter(function (m) { return m.lifecycle_status === "UNCONFIRMED"; }).length;

    var tiles = [
      { label: "Marcas", value: brandCount, cls: "" },
      { label: "Modelos fabricante", value: models.length, cls: "" },
      { label: "Modelos Oceanic", value: oceanicCount, cls: "accent" },
      { label: "Current", value: currentCount, cls: "" },
      { label: "Historical", value: historicalCount, cls: "" },
      { label: "Requires Review", value: reviewCount, cls: "warn" },
      { label: "Unconfirmed", value: unconfirmedCount, cls: "bad" }
    ];

    els.kpiBar.innerHTML = tiles.map(function (t) {
      return '<div class="kpi' + (t.cls ? " kpi--" + t.cls : "") + '">' +
        '<div class="kpi__value">' + t.value + '</div>' +
        '<div class="kpi__label">' + escapeHtml(t.label) + '</div>' +
        '</div>';
    }).join("");
  }

  // ---- brand cards -----------------------------------------------------

  function renderBrandCards() {
    var byBrand = {};
    state.allModels.forEach(function (m) {
      if (!byBrand[m.brand_id]) {
        byBrand[m.brand_id] = {
          brand_id: m.brand_id, brand_name: m.brand_name,
          portfolio_status: m._brandPortfolioStatus,
          total: 0, oceanic: 0, current: 0, historical: 0, review: 0
        };
      }
      var b = byBrand[m.brand_id];
      b.total++;
      if (m._oceanicConfirmed) b.oceanic++;
      if (m.status_bucket === "current") b.current++;
      if (m.status_bucket === "historical") b.historical++;
      if (m.requires_review) b.review++;
    });

    var brands = Object.values(byBrand).sort(function (a, b) {
      return a.brand_name.localeCompare(b.brand_name, "es");
    });

    if (!brands.length) {
      els.brandsView.innerHTML = '<div class="empty-state">Sin marcas para mostrar.</div>';
      return;
    }

    els.brandsView.innerHTML = brands.map(function (b) {
      return (
        '<button type="button" class="brand-card" data-brand="' + escapeAttr(b.brand_id) + '">' +
          '<p class="brand-card__name">' + escapeHtml(b.brand_name) + '</p>' +
          '<p class="brand-card__status">' + escapeHtml(b.portfolio_status) + '</p>' +
          '<div class="brand-card__total">' + b.total + ' <span style="font-size:0.6em;color:var(--muted);font-weight:500;">modelos</span></div>' +
          '<div class="brand-card__stats">' +
            statBlock(b.oceanic, "Oceanic") +
            statBlock(b.current, "Vigentes") +
            statBlock(b.historical, "Histórico") +
          '</div>' +
          (b.review ? '<div class="brand-card__stats" style="grid-template-columns:1fr;margin-top:6px;padding-top:0;border-top:none;">' +
            '<span class="badge badge--review"><span class="badge__glyph">⚠</span>' + b.review + ' requieren revisión</span></div>' : '') +
        '</button>'
      );
    }).join("");

    els.brandsView.querySelectorAll(".brand-card").forEach(function (card) {
      card.addEventListener("click", function () {
        var brandId = card.getAttribute("data-brand");
        state.filters.brand = brandId;
        els.filterBrand.value = brandId;
        populateFamilyOptions();
        state.view = "models";
        render();
      });
    });
  }

  function statBlock(value, label) {
    return '<div><div class="brand-card__stat-value">' + value + '</div><div class="brand-card__stat-label">' + escapeHtml(label) + '</div></div>';
  }

  // ---- model grid -----------------------------------------------------

  function renderModelGrid(models) {
    if (!models.length) {
      els.modelGrid.innerHTML = '<div class="empty-state">Ningún modelo coincide con los filtros actuales.</div>';
      return;
    }

    models.sort(function (a, b) {
      return (a.brand_name + a.family + a.model_name).localeCompare(b.brand_name + b.family + b.model_name, "es");
    });

    els.modelGrid.innerHTML = models.map(function (m) {
      var statusBadge = statusBadgeHtml(m.lifecycle_status);
      var oceanicBadge = m._oceanicConfirmed
        ? '<span class="badge badge--oceanic-yes"><span class="badge__glyph">✓</span>Oceanic</span>'
        : '<span class="badge badge--oceanic-no"><span class="badge__glyph">–</span>Sin evidencia Oceanic</span>';
      var reviewBadge = m.requires_review ? '<span class="badge badge--review"><span class="badge__glyph">⚠</span>Revisión</span>' : "";
      var link = m.manufacturer_url
        ? '<a class="model-card__link" href="' + escapeAttr(m.manufacturer_url) + '" target="_blank" rel="noopener noreferrer" data-nostop="1">Fuente oficial ↗</a>'
        : '<span class="model-card__link model-card__link--empty">Sin fuente oficial</span>';
      var variants = (m.variants && m.variants.length)
        ? '<p class="model-card__variants">' + m.variants.length + ' variante(s): ' + escapeHtml(m.variants.map(function (v) { return v.variant_name; }).join(", ")) + '</p>'
        : "";
      var media = m.media || { images: [], videos: [] };
      var nImg = media.images ? media.images.length : 0;
      var nVid = media.videos ? media.videos.length : 0;
      var mediaBadge = (nImg || nVid)
        ? '<span class="badge badge--media">' + (nImg ? '<span class="badge__glyph">🖼</span>' + nImg : '') + (nImg && nVid ? ' · ' : '') + (nVid ? '<span class="badge__glyph">🎬</span>' + nVid : '') + '</span>'
        : '';

      return (
        '<article class="model-card" data-model="' + escapeAttr(m.brand_id + "::" + m.model_id) + '">' +
          '<p class="model-card__breadcrumb">' + escapeHtml(m.brand_name) + ' · ' + escapeHtml(m.category_label) + ' · ' + escapeHtml(m.family) + '</p>' +
          '<p class="model-card__name">' + escapeHtml(m.model_name) + '</p>' +
          variants +
          '<div class="model-card__row">' + statusBadge + oceanicBadge + reviewBadge + mediaBadge + '</div>' +
          '<div class="model-card__row">' + link + '</div>' +
        '</article>'
      );
    }).join("");

    els.modelGrid.querySelectorAll(".model-card").forEach(function (card) {
      card.addEventListener("click", function (e) {
        if (e.target.closest("[data-nostop]")) return; // let the source link open normally
        var key = card.getAttribute("data-model");
        var parts = key.split("::");
        var model = state.allModels.find(function (m) { return m.brand_id === parts[0] && m.model_id === parts[1]; });
        if (model) openDetail(model);
      });
    });
  }

  function statusBadgeHtml(status) {
    var meta = STATUS_META[status] || { label: status, glyph: "•", cls: "unconfirmed" };
    return '<span class="badge badge--' + meta.cls + '"><span class="badge__glyph">' + meta.glyph + '</span>' + escapeHtml(meta.label) + '</span>';
  }

  var MEDIA_TYPE_LABELS = {
    gallery_page: "Galería del fabricante",
    press_kit: "Kit de prensa",
    single_photo_page: "Nota con fotos"
  };
  var MEDIA_PLATFORM_LABELS = {
    youtube: "YouTube",
    vimeo: "Vimeo",
    manufacturer_page: "Página del fabricante",
    other: "Otro"
  };

  // media (embebido en cada modelo por scripts/build_catalog.py, leído
  // directamente de data/models/<brand>/<model>.json -> campo "media").
  // Son siempre enlaces a la página que aloja el contenido, nunca archivos
  // descargados/hotlinkeados (CLAUDE.md sección 2.1 "assets").
  function buildMediaHtml(media) {
    media = media || { media_status: "NOT_RESEARCHED", images: [], videos: [] };
    var notResearchedNote = '<p style="color:var(--muted);font-size:0.85rem;">Sin investigar aún — este modelo es de una pasada anterior a la incorporación de galería/video al esquema (2026-09-14).</p>';

    var imagesHtml;
    if (!media.images || !media.images.length) {
      imagesHtml = media.media_status === "RESEARCHED"
        ? '<p style="color:var(--muted);font-size:0.85rem;">Investigado: no se encontraron imágenes con fuente suficiente.</p>'
        : notResearchedNote;
    } else {
      imagesHtml = '<ul class="source-list">' + media.images.map(function (img) {
        return '<li><a href="' + escapeAttr(img.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(img.url) + '</a>' +
          '<div class="source-meta">' + escapeHtml(MEDIA_TYPE_LABELS[img.type] || img.type) + ' · Nivel ' + img.level + ' · ' + escapeHtml(img.verification_state) + '</div></li>';
      }).join("") + '</ul>';
    }

    var videosHtml;
    if (!media.videos || !media.videos.length) {
      videosHtml = media.media_status === "RESEARCHED"
        ? '<p style="color:var(--muted);font-size:0.85rem;">Investigado: no se encontraron videos con fuente suficiente.</p>'
        : notResearchedNote;
    } else {
      videosHtml = '<ul class="source-list">' + media.videos.map(function (v) {
        return '<li><a href="' + escapeAttr(v.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(v.title || v.url) + '</a>' +
          '<div class="source-meta">' + escapeHtml(MEDIA_PLATFORM_LABELS[v.platform] || v.platform) + ' · Nivel ' + v.level + ' · ' + escapeHtml(v.verification_state) + '</div></li>';
      }).join("") + '</ul>';
    }

    return { images: imagesHtml, videos: videosHtml };
  }

  // ---- detail panel -----------------------------------------------------

  function openDetail(m) {
    var oceanicSourceHtml = m.oceanic_source
      ? '<a href="' + escapeAttr(m.oceanic_source.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(m.oceanic_source.url) + '</a> <span class="source-meta">(' + escapeHtml(m.oceanic_source.verification_state) + ')</span>'
      : '<span style="color:var(--muted)">Sin fuente de representación registrada</span>';

    var mfrUrlHtml = m.manufacturer_url
      ? '<a href="' + escapeAttr(m.manufacturer_url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(m.manufacturer_url) + '</a>'
      : '<span style="color:var(--muted)">UNKNOWN</span>';

    var issuesHtml = m.review_reasons && m.review_reasons.length
      ? '<ul class="issue-list">' + m.review_reasons.map(function (r) {
          return '<li>' + escapeHtml(REVIEW_REASON_LABELS[r] || r) + '</li>';
        }).join("") + '</ul>'
      : '<p style="color:var(--good);font-size:0.85rem;">Sin issues detectados por el sistema.</p>';

    var discrepanciesHtml = "";
    if (m.discrepancies && m.discrepancies.length) {
      discrepanciesHtml = '<ul class="issue-list">' + m.discrepancies.map(function (d) {
        var values = (d.values || []).map(function (v) { return escapeHtml(String(v.value)); }).join(" vs. ");
        return '<li><strong>' + escapeHtml(d.field) + ':</strong> ' + values + '</li>';
      }).join("") + '</ul>';
    }

    var sourcesHtml = (m.sources && m.sources.length)
      ? '<ul class="source-list">' + m.sources.map(function (s) {
          return '<li><a href="' + escapeAttr(s.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(s.url) + '</a>' +
            '<div class="source-meta">Nivel ' + s.level + ' (' + escapeHtml(s.level_label) + ') · ' + escapeHtml(s.verification_state) + ' · ' + escapeHtml(s.retrieved_at || "") + '</div></li>';
        }).join("") + '</ul>'
      : '<p style="color:var(--muted);font-size:0.85rem;">Sin fuentes registradas.</p>';

    var variantsHtml = (m.variants && m.variants.length)
      ? '<ul class="issue-list">' + m.variants.map(function (v) {
          return '<li><strong>' + escapeHtml(v.variant_name || "") + '</strong>' + (v.description ? " — " + escapeHtml(v.description) : "") + '</li>';
        }).join("") + '</ul>'
      : '<p style="color:var(--muted);font-size:0.85rem;">Sin variantes registradas.</p>';

    var mediaHtml = buildMediaHtml(m.media);

    els.detailContent.innerHTML =
      '<div class="detail-section">' +
        '<p class="detail-title">' + escapeHtml(m.model_name) + '</p>' +
        '<p class="detail-subtitle">' + escapeHtml(m.brand_name) + ' · ' + escapeHtml(m.family) + '</p>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">' +
          statusBadgeHtml(m.lifecycle_status) +
          (m._oceanicConfirmed
            ? '<span class="badge badge--oceanic-yes"><span class="badge__glyph">✓</span>Representación Oceanic confirmada</span>'
            : '<span class="badge badge--oceanic-no"><span class="badge__glyph">–</span>Sin evidencia de Oceanic</span>') +
          (m.requires_review ? '<span class="badge badge--review"><span class="badge__glyph">⚠</span>Requiere revisión</span>' : '') +
        '</div>' +
      '</div>' +

      '<div class="detail-section">' +
        '<h3>Identificación</h3>' +
        '<dl class="detail-fields">' +
          '<dt>Marca</dt><dd>' + escapeHtml(m.brand_name) + '</dd>' +
          '<dt>Familia</dt><dd>' + escapeHtml(m.family) + '</dd>' +
          '<dt>Modelo</dt><dd>' + escapeHtml(m.model_name) + '</dd>' +
          '<dt>Variantes</dt><dd>' + (m.variants && m.variants.length ? m.variants.map(function(v){return escapeHtml(v.variant_name);}).join(", ") : "—") + '</dd>' +
          '<dt>Categoría</dt><dd>' + escapeHtml(m.category_label) + '</dd>' +
          '<dt>Estado</dt><dd>' + statusBadgeHtml(m.lifecycle_status) + '</dd>' +
        '</dl>' +
      '</div>' +

      '<div class="detail-section">' +
        '<h3>Representación</h3>' +
        '<dl class="detail-fields">' +
          '<dt>Oceanic</dt><dd>' + (m._oceanicConfirmed ? "Confirmada" : "Sin evidencia") + '</dd>' +
          '<dt>Fuente</dt><dd>' + oceanicSourceHtml + '</dd>' +
        '</dl>' +
      '</div>' +

      '<div class="detail-section">' +
        '<h3>Fuente oficial (fabricante)</h3>' +
        '<dl class="detail-fields">' +
          '<dt>URL</dt><dd>' + mfrUrlHtml + '</dd>' +
        '</dl>' +
      '</div>' +

      '<div class="detail-section">' +
        '<h3>Validación</h3>' +
        '<dl class="detail-fields">' +
          '<dt>Confianza</dt><dd>' + escapeHtml(m.confidence_level) + '</dd>' +
          '<dt>Verificado</dt><dd>' + escapeHtml(m.verified_at || "—") + '</dd>' +
          '<dt>Actualizado</dt><dd>' + escapeHtml(m.last_updated || "—") + '</dd>' +
          '<dt>Pipeline</dt><dd>' + escapeHtml(m.status_pipeline || "—") + '</dd>' +
        '</dl>' +
        '<div style="margin-top:10px;">' + issuesHtml + '</div>' +
        (discrepanciesHtml ? '<p style="font-size:0.75rem;color:var(--muted);margin:10px 0 4px;">Discrepancias entre fuentes (ambos valores conservados):</p>' + discrepanciesHtml : '') +
      '</div>' +

      '<div class="detail-section">' +
        '<h3>Variantes</h3>' + variantsHtml +
      '</div>' +

      '<div class="detail-section">' +
        '<h3>Galería e imágenes</h3>' + mediaHtml.images +
      '</div>' +

      '<div class="detail-section">' +
        '<h3>Video</h3>' + mediaHtml.videos +
      '</div>' +

      '<div class="detail-section">' +
        '<h3>Fuentes (' + (m.sources ? m.sources.length : 0) + ')</h3>' + sourcesHtml +
      '</div>' +

      '<div class="detail-section">' +
        '<h3>Notas</h3>' +
        '<div class="notes-block">' + escapeHtml(m.notes || "Sin notas.") + '</div>' +
        '<p class="source-meta" style="margin-top:8px;">Archivo fuente: ' + escapeHtml(m.source_file || "") + '</p>' +
      '</div>';

    els.overlay.hidden = false;
    els.detailPanel.hidden = false;
    document.body.style.overflow = "hidden";
    els.detailClose.focus();
  }

  function closeDetail() {
    els.overlay.hidden = true;
    els.detailPanel.hidden = true;
    document.body.style.overflow = "";
  }

  // ---- utils -----------------------------------------------------------

  function debounce(fn, ms) {
    var t;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  function escapeAttr(str) { return escapeHtml(str); }

})();
