/* Geoportal ASMATOZ — WebGIS interativo
   Camadas: Bairros (dia de coleta seletiva), Vias, Setores Censitários (IBGE), Endereços (IBGE)
   Base: Leaflet + Leaflet.markercluster (CDN), 5 mapas de fundo, sem chaves de API. */

(function () {
  "use strict";

  /* ---------- Cores por dia da semana (paleta harmonizada com a marca) ---------- */
  var DAY_COLORS = {
    "Segunda": "#2e9959",
    "Terça": "#3b82c4",
    "Quarta": "#d99a3e",
    "Quinta": "#8f5fb0",
    "Sexta": "#c1584f",
    "Todos os dias": "#123c26",
    "": "#d9d9d9"
  };
  var DAY_ORDER = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", ""];
  var DAY_LABELS = {
    "Segunda": "Segunda-feira",
    "Terça": "Terça-feira",
    "Quarta": "Quarta-feira",
    "Quinta": "Quinta-feira",
    "Sexta": "Sexta-feira",
    "Todos os dias": "Todos os dias",
    "": "Sem coleta seletiva"
  };

  function dayColor(dia) {
    return DAY_COLORS[dia] !== undefined ? DAY_COLORS[dia] : DAY_COLORS[""];
  }

  /* ---------- Mapa base ---------- */
  var map = L.map("map", {
    zoomControl: false,
    minZoom: 11,
    maxZoom: 19,
    attributionControl: true
  }).setView([-19.5535, -44.0575], 13);

  L.control.zoom({ position: "topright" }).addTo(map);
  L.control.scale({ position: "bottomright", metric: true, imperial: false }).addTo(map);

  /* ---------- 5 mapas de fundo (todos sem necessidade de chave de API) ---------- */
  var basemaps = {
    positron: {
      label: "Claro",
      color: "#eef2f0",
      layer: L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd", maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      })
    },
    osm: {
      label: "Ruas (OSM)",
      color: "#c9d8c2",
      layer: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        subdomains: "abc", maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      })
    },
    topo: {
      label: "Topográfico",
      color: "#dcd2b0",
      layer: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri — Esri, HERE, Garmin, FAO, NOAA, USGS'
      })
    },
    imagery: {
      label: "Satélite",
      color: "#3d4a36",
      layer: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri — Esri, Maxar, Earthstar Geographics'
      })
    },
    dark: {
      label: "Escuro",
      color: "#1c2420",
      layer: L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd", maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      })
    }
  };

  var currentBasemap = "positron";
  basemaps[currentBasemap].layer.addTo(map);

  function setBasemap(id) {
    if (id === currentBasemap) return;
    map.removeLayer(basemaps[currentBasemap].layer);
    basemaps[id].layer.addTo(map);
    currentBasemap = id;
    document.querySelectorAll(".geo-basemap-btn").forEach(function (btn) {
      btn.classList.toggle("active", btn.dataset.basemap === id);
    });
  }

  /* ---------- Controle flutuante: mapas de fundo (ao lado do zoom in/out) ---------- */
  var BasemapControl = L.Control.extend({
    options: { position: "topright" },
    onAdd: function () {
      var wrap = L.DomUtil.create("div", "leaflet-bar geo-basemap-control");

      var toggle = L.DomUtil.create("a", "geo-basemap-toggle", wrap);
      toggle.href = "#";
      toggle.title = "Mapa de fundo";
      toggle.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3l9 5-9 5-9-5 9-5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M3 13l9 5 9-5" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';

      var panel = L.DomUtil.create("div", "geo-basemap-panel", wrap);
      panel.hidden = true;

      Object.keys(basemaps).forEach(function (id) {
        var b = basemaps[id];
        var item = L.DomUtil.create("button", "geo-basemap-btn" + (id === currentBasemap ? " active" : ""), panel);
        item.type = "button";
        item.dataset.basemap = id;
        item.innerHTML = '<span class="geo-bm-icon" style="background:' + b.color + '"></span>' + b.label;
        L.DomEvent.on(item, "click", function (e) {
          L.DomEvent.stop(e);
          setBasemap(id);
          panel.hidden = true;
        });
      });

      L.DomEvent.on(toggle, "click", function (e) {
        L.DomEvent.stop(e);
        panel.hidden = !panel.hidden;
      });

      L.DomEvent.disableClickPropagation(wrap);
      L.DomEvent.disableScrollPropagation(wrap);
      return wrap;
    }
  });
  map.addControl(new BasemapControl());

  /* ---------- Controle flutuante: localização do usuário (ao lado do zoom in/out) ---------- */
  var LocateControl = L.Control.extend({
    options: { position: "topright" },
    onAdd: function () {
      var wrap = L.DomUtil.create("div", "leaflet-bar geo-locate-control");
      var btn = L.DomUtil.create("a", "", wrap);
      btn.href = "#";
      btn.title = "Ver minha localização";
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
      L.DomEvent.on(btn, "click", function (e) {
        L.DomEvent.stop(e);
        map.locate({ setView: true, maxZoom: 16 });
      });
      L.DomEvent.disableClickPropagation(wrap);
      return wrap;
    }
  });
  map.addControl(new LocateControl());

  /* ---------- Popups auxiliares ---------- */
  function popupRow(k, v) {
    if (v === undefined || v === null || v === "") return "";
    return '<tr><td class="k">' + k + '</td><td class="v">' + v + '</td></tr>';
  }

  function tagHtml(text, color) {
    return '<span class="geo-tag" style="background:' + color + '">' + text + '</span>';
  }

  /* ---------- Camada: Bairros (coleta seletiva) ---------- */
  var bairrosLayer = null;
  var bairrosData = null;

  function styleBairro(feature) {
    var c = dayColor(feature.properties.dia_seletiva);
    return {
      color: "#ffffff",
      weight: 1.2,
      fillColor: c,
      fillOpacity: 0.55,
      opacity: 0.9
    };
  }

  function onEachBairro(feature, layer) {
    var p = feature.properties;
    var html = '<div class="geo-popup"><h4>' + (p.bairro || "Bairro") + "</h4><table>";
    html += popupRow("Coleta seletiva", tagHtml(DAY_LABELS[p.dia_seletiva], dayColor(p.dia_seletiva)));
    if (p.dia_convencional) html += popupRow("Coleta convencional", p.dia_convencional);
    html += "</table></div>";
    layer.bindPopup(html);
    layer.on("mouseover", function () { layer.setStyle({ weight: 2.5, fillOpacity: 0.72 }); });
    layer.on("mouseout", function () { bairrosLayer.resetStyle(layer); });
  }

  /* ---------- Camada: Vias ---------- */
  var viasLayer = null;
  var viasData = null;

  function styleVia(feature) {
    return {
      color: dayColor(feature.properties.dia),
      weight: 3,
      opacity: 0.85
    };
  }

  function onEachVia(feature, layer) {
    var p = feature.properties;
    var html = '<div class="geo-popup"><h4>' + (p.nome || "Via sem nome") + "</h4><table>";
    html += popupRow("Tipo", p.tipo);
    html += popupRow("Bairro", p.bairro);
    if (p.dia) html += popupRow("Dia de coleta", tagHtml(DAY_LABELS[p.dia] || p.dia, dayColor(p.dia)));
    html += popupRow("Extensão", p.extensao_m ? p.extensao_m + " m" : null);
    html += "</table></div>";
    layer.bindPopup(html);
    layer.on("mouseover", function () { layer.setStyle({ weight: 6 }); });
    layer.on("mouseout", function () { viasLayer.resetStyle(layer); });
  }

  /* ---------- Camada: Setores censitários ---------- */
  var setoresLayer = null;
  var setoresData = null;

  function styleSetor() {
    return {
      color: "#5c6b62",
      weight: 1,
      dashArray: "4 3",
      fillColor: "#cdeecd",
      fillOpacity: 0.12
    };
  }

  function onEachSetor(feature, layer) {
    var p = feature.properties;
    var html = '<div class="geo-popup"><h4>Setor censitário</h4><table>';
    html += popupRow("Código IBGE", p.codigo);
    html += popupRow("Tipo", p.tipo);
    html += popupRow("Bairro", p.bairro);
    html += popupRow("Distrito", p.distrito);
    html += popupRow("Município", p.municipio);
    html += "</table></div>";
    layer.bindPopup(html);
  }

  /* ---------- Camada: Endereços (pontos, carregado sob demanda + cluster) ---------- */
  var enderecosGroup = null;
  var enderecosLoaded = false;
  var enderecosLoading = false;

  function buildEnderecosLayer(data) {
    var group = L.markerClusterGroup({
      maxClusterRadius: 55,
      spiderfyOnMaxZoom: true,
      chunkedLoading: true,
      iconCreateFunction: function (cluster) {
        var count = cluster.getChildCount();
        var size = count < 50 ? 32 : count < 300 ? 40 : 48;
        return L.divIcon({
          html: '<div style="background:#1f6e43;color:#fff;border:2px solid #fff;border-radius:50%;width:' + size + "px;height:" + size + "px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.75rem;box-shadow:0 2px 8px rgba(18,60,38,0.35);\">" + count + "</div>",
          className: "",
          iconSize: [size, size]
        });
      }
    });

    var markers = data.features.map(function (feature) {
      var coords = feature.geometry.coordinates;
      var latlng = L.latLng(coords[1], coords[0]);
      var marker = L.circleMarker(latlng, {
        radius: 5,
        color: "#fff",
        weight: 1,
        fillColor: "#1f6e43",
        fillOpacity: 0.9
      });
      var p = feature.properties;
      var html = '<div class="geo-popup"><h4>Endereço IBGE</h4><table>';
      html += popupRow("ID", p.id);
      html += popupRow("Tipo", p.tipo);
      html += popupRow("Coordenadas", coords[1].toFixed(5) + ", " + coords[0].toFixed(5));
      html += "</table></div>";
      marker.bindPopup(html);
      return marker;
    });

    group.addLayers(markers);
    return group;
  }

  /* ---------- Carregamento de dados ---------- */
  function fetchJson(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("Falha ao carregar " + url);
      return r.json();
    });
  }

  var loadingEl = document.getElementById("geo-loading");

  Promise.all([
    fetchJson("data/bairros.geojson"),
    fetchJson("data/vias.geojson"),
    fetchJson("data/setores.geojson")
  ]).then(function (results) {
    bairrosData = results[0];
    viasData = results[1];
    setoresData = results[2];

    bairrosLayer = L.geoJSON(bairrosData, { style: styleBairro, onEachFeature: onEachBairro });
    viasLayer = L.geoJSON(viasData, { style: styleVia, onEachFeature: onEachVia });
    setoresLayer = L.geoJSON(setoresData, { style: styleSetor, onEachFeature: onEachSetor });

    bairrosLayer.addTo(map);
    viasLayer.addTo(map);

    document.getElementById("count-bairros").textContent = bairrosData.features.length;
    document.getElementById("count-vias").textContent = viasData.features.length;
    document.getElementById("count-setores").textContent = setoresData.features.length;

    map.fitBounds(bairrosLayer.getBounds(), { padding: [30, 30] });

    buildBairroDatalist(bairrosData);
    updateLegend();
    loadingEl.setAttribute("hidden", "");
  }).catch(function (err) {
    loadingEl.querySelector("p").textContent = "Erro ao carregar dados: " + err.message;
  });

  /* ---------- Toggles de camadas ---------- */
  function wireToggle(checkboxId, getLayer, onFirstEnable) {
    var el = document.getElementById(checkboxId);
    el.addEventListener("change", function () {
      if (el.checked) {
        if (onFirstEnable) onFirstEnable(function (layer) { if (layer) map.addLayer(layer); });
        else { var l = getLayer(); if (l) map.addLayer(l); }
      } else {
        var l2 = getLayer();
        if (l2) map.removeLayer(l2);
      }
      updateLegend();
    });
  }

  wireToggle("toggle-bairros", function () { return bairrosLayer; });
  wireToggle("toggle-vias", function () { return viasLayer; });
  wireToggle("toggle-setores", function () { return setoresLayer; });

  document.getElementById("toggle-enderecos").addEventListener("change", function (e) {
    if (e.target.checked) {
      if (enderecosLoaded) {
        map.addLayer(enderecosGroup);
        return;
      }
      if (enderecosLoading) return;
      enderecosLoading = true;
      var statusEl = document.getElementById("enderecos-status");
      statusEl.textContent = "Carregando ~20 mil pontos…";
      fetchJson("data/enderecos.geojson").then(function (data) {
        enderecosGroup = buildEnderecosLayer(data);
        enderecosLoaded = true;
        enderecosLoading = false;
        map.addLayer(enderecosGroup);
        document.getElementById("count-enderecos").textContent = data.features.length;
        statusEl.textContent = "";
      }).catch(function (err) {
        statusEl.textContent = "Erro ao carregar: " + err.message;
        enderecosLoading = false;
      });
    } else {
      if (enderecosGroup) map.removeLayer(enderecosGroup);
    }
  });

  /* ---------- Opacidade ---------- */
  document.getElementById("opacity-bairros").addEventListener("input", function (e) {
    var v = parseFloat(e.target.value);
    if (!bairrosLayer) return;
    bairrosLayer.eachLayer(function (l) { l.setStyle({ fillOpacity: v }); });
  });

  document.getElementById("opacity-vias").addEventListener("input", function (e) {
    var v = parseFloat(e.target.value);
    if (!viasLayer) return;
    viasLayer.eachLayer(function (l) { l.setStyle({ opacity: v }); });
  });

  /* ---------- Legenda dinâmica ---------- */
  function updateLegend() {
    var wrap = document.getElementById("geo-legend");
    var bairrosOn = document.getElementById("toggle-bairros").checked;
    var viasOn = document.getElementById("toggle-vias").checked;
    if (!bairrosOn && !viasOn) {
      wrap.innerHTML = '<p class="geo-legend-empty">Ative "Bairros" ou "Vias" para ver a legenda de dias de coleta.</p>';
      return;
    }
    var html = "";
    DAY_ORDER.forEach(function (d) {
      html += '<div class="geo-legend-item"><span class="geo-legend-swatch" style="background:' + dayColor(d) + '"></span>' + DAY_LABELS[d] + "</div>";
    });
    wrap.innerHTML = html;
  }

  /* ---------- Busca de bairro ---------- */
  function buildBairroDatalist(data) {
    var datalist = document.getElementById("bairro-list");
    var names = data.features.map(function (f) { return f.properties.bairro; }).filter(Boolean).sort();
    datalist.innerHTML = names.map(function (n) { return '<option value="' + n + '"></option>'; }).join("");
  }

  document.getElementById("geo-search-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var q = document.getElementById("geo-search-input").value.trim().toLowerCase();
    if (!q || !bairrosLayer) return;
    var found = null;
    bairrosLayer.eachLayer(function (l) {
      if (l.feature.properties.bairro && l.feature.properties.bairro.toLowerCase() === q) found = l;
    });
    if (!found) {
      bairrosLayer.eachLayer(function (l) {
        if (!found && l.feature.properties.bairro && l.feature.properties.bairro.toLowerCase().indexOf(q) !== -1) found = l;
      });
    }
    if (found) {
      if (!document.getElementById("toggle-bairros").checked) {
        document.getElementById("toggle-bairros").checked = true;
        map.addLayer(bairrosLayer);
        updateLegend();
      }
      map.fitBounds(found.getBounds(), { padding: [50, 50], maxZoom: 16 });
      found.openPopup();
    } else {
      document.getElementById("geo-search-input").setCustomValidity("Bairro não encontrado");
      document.getElementById("geo-search-input").reportValidity();
      setTimeout(function () { document.getElementById("geo-search-input").setCustomValidity(""); }, 2000);
    }
  });

  /* ---------- Coordenadas do cursor ---------- */
  var coordsEl = document.getElementById("geo-coords");
  map.on("mousemove", function (e) {
    coordsEl.textContent = e.latlng.lat.toFixed(5) + ", " + e.latlng.lng.toFixed(5);
  });

  /* ---------- Localização do usuário (feedback dos eventos do controle acima) ---------- */
  map.on("locationfound", function (e) {
    L.marker(e.latlng).addTo(map).bindPopup("Você está aqui (aprox.)").openPopup();
  });
  map.on("locationerror", function () {
    alert("Não foi possível obter sua localização. Verifique as permissões do navegador.");
  });

  /* ---------- Painel lateral (mobile) ---------- */
  var sidebar = document.getElementById("geo-sidebar");
  var sidebarToggle = document.getElementById("geo-sidebar-toggle");
  sidebarToggle.addEventListener("click", function () {
    sidebar.classList.toggle("open");
  });
  document.getElementById("geo-sidebar-close").addEventListener("click", function () {
    sidebar.classList.remove("open");
  });
})();
