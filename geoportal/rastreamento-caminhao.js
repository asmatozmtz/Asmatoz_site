/**
 * Rastreamento em tempo real do caminhao da coleta seletiva — ASMATOZ
 * Servidor Traccar: https://136.248.77.228.sslip.io
 *
 * COMO USAR no geoportal/index.html:
 *   Cole a linha abaixo logo ANTES de </body>:
 *     <script src="rastreamento-caminhao.js"></script>
 *
 *   Nao precisa chamar nada: o script encontra o mapa Leaflet sozinho.
 *   (Se preferir controlar manualmente: RastreamentoASMATOZ.iniciar(suaVariavelDoMapa))
 */

var RastreamentoASMATOZ = (function () {
  "use strict";

  var SERVIDOR = "https://136.248.77.228.sslip.io";
  var TOKEN = "RzBFAiA64-b5OOwKgf_h01N7lJACIjIGiMuTgQLx2p0v4_ou6wIhAOigkUmO0gzR9MGK7N56J1s73JF-WrfknsPUvnN7kmMXeyJpIjo4ODA3NzY3MjAwOTY3NTUzOTcxLCJ1IjoyLCJlIjoiMjAzMC0wMS0wMVQwMDowMDowMC4wMDArMDA6MDAifQ";
  var INTERVALO_SEGUNDOS = 15;
  var MAX_PONTOS_TRILHA = 300;

  var mapa = null, timer = null, iniciado = false;
  var marcadores = {}, trilhas = {};

  var icone = L.divIcon({
    className: "caminhao-asmatoz",
    html:
      '<div style="background:#1f6e43;border:2px solid #fff;border-radius:50%;' +
      'width:38px;height:38px;display:flex;align-items:center;justify-content:center;' +
      'box-shadow:0 2px 8px rgba(0,0,0,.45);font-size:20px;line-height:1;">&#128667;</div>',
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -22]
  });

  function api(caminho) {
    return fetch(SERVIDOR + caminho, {
      headers: { Authorization: "Bearer " + TOKEN }
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }

  function popup(dispositivo, pos) {
    var min = Math.round((Date.now() - new Date(pos.fixTime).getTime()) / 60000);
    var status = min <= 5
      ? '<span style="color:#1f6e43;font-weight:700;">&#9679; Em rota agora</span>'
      : '<span style="color:#b26a00;font-weight:700;">&#9679; Última posição há ' + min + ' min</span>';
    var vel = Math.round((pos.speed || 0) * 1.852);
    var hora = new Date(pos.fixTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return '<div style="font-family:inherit;min-width:180px;">' +
           '<strong>' + (dispositivo.name || "Caminhão da coleta") + "</strong><br>" +
           status + "<br>Velocidade: " + vel + " km/h<br>" +
           '<span style="color:#666;font-size:12px;">Atualizado às ' + hora + "</span></div>";
  }

  function atualizar(dispositivo, pos) {
    var id = dispositivo.id;
    var latlng = [pos.latitude, pos.longitude];

    if (!marcadores[id]) {
      trilhas[id] = L.polyline([latlng], {
        color: "#1f6e43", weight: 4, opacity: 0.65, dashArray: "6 8"
      }).addTo(mapa);
      marcadores[id] = L.marker(latlng, { icon: icone, zIndexOffset: 1000 })
        .addTo(mapa)
        .bindPopup(popup(dispositivo, pos));
    } else {
      marcadores[id].setLatLng(latlng);
      marcadores[id].setPopupContent(popup(dispositivo, pos));
      var pts = trilhas[id].getLatLngs();
      var ult = pts[pts.length - 1];
      if (!ult || ult.lat !== latlng[0] || ult.lng !== latlng[1]) {
        pts.push(L.latLng(latlng[0], latlng[1]));
        if (pts.length > MAX_PONTOS_TRILHA) pts.shift();
        trilhas[id].setLatLngs(pts);
      }
    }
  }

  function mostrarStatus(texto, cor) {
    var el = document.getElementById("status-caminhao");
    if (el) { el.textContent = texto; el.style.color = cor || ""; }
  }

  function ciclo() {
    if (!mapa) return;
    Promise.all([api("/api/devices"), api("/api/positions")])
      .then(function (res) {
        var porId = {};
        res[1].forEach(function (p) { porId[p.deviceId] = p; });
        var achou = false;
        res[0].forEach(function (d) {
          if (porId[d.id]) {
            atualizar(d, porId[d.id]);
            achou = true;
            var min = Math.round((Date.now() - new Date(porId[d.id].fixTime).getTime()) / 60000);
            if (min <= 5) mostrarStatus("em rota", "#1f6e43");
            else if (min < 120) mostrarStatus("há " + min + " min", "#b26a00");
            else mostrarStatus("fora de rota", "#888");
          }
        });
        if (!achou) mostrarStatus("sem sinal", "#888");
      })
      .catch(function (e) {
        mostrarStatus("indisponível", "#888");
        console.warn("[Rastreamento ASMATOZ]", e.message);
      });
  }

  function iniciar(mapaLeaflet) {
    if (iniciado || !mapaLeaflet) return;
    iniciado = true;
    mapa = mapaLeaflet;
    ciclo();
    timer = setInterval(ciclo, INTERVALO_SEGUNDOS * 1000);

    var btn = document.getElementById("btn-ver-caminhao");
    if (btn) {
      btn.addEventListener("click", function (ev) {
        ev.preventDefault();
        var ids = Object.keys(marcadores);
        if (ids.length) {
          mapa.setView(marcadores[ids[0]].getLatLng(), 16);
          marcadores[ids[0]].openPopup();
        } else {
          alert("O caminhão não está transmitindo posição neste momento.");
        }
      });
    }
    console.log("[Rastreamento ASMATOZ] ativo");
  }

  // --- Descoberta automatica do mapa Leaflet -------------------------------
  // 1) Mapas criados DEPOIS deste script: capturados pelo init hook do Leaflet.
  if (window.L && L.Map && L.Map.addInitHook) {
    L.Map.addInitHook(function () {
      var m = this;
      setTimeout(function () { iniciar(m); }, 1500);
    });
  }

  // 2) Mapa ja existente (script colado no final da pagina): procura nas globais.
  function procurarMapaExistente(tentativa) {
    if (iniciado) return;
    for (var k in window) {
      try {
        if (window[k] instanceof L.Map) { iniciar(window[k]); return; }
      } catch (e) { /* alguns acessos a window disparam erro; ignorar */ }
    }
    if ((tentativa || 0) < 20) {
      setTimeout(function () { procurarMapaExistente((tentativa || 0) + 1); }, 500);
    } else {
      console.warn("[Rastreamento ASMATOZ] mapa Leaflet nao encontrado. " +
                   "Chame RastreamentoASMATOZ.iniciar(suaVariavelDoMapa) manualmente.");
    }
  }

  if (document.readyState === "complete") {
    setTimeout(function () { procurarMapaExistente(0); }, 800);
  } else {
    window.addEventListener("load", function () {
      setTimeout(function () { procurarMapaExistente(0); }, 800);
    });
  }

  return {
    iniciar: iniciar,
    parar: function () { if (timer) clearInterval(timer); iniciado = false; },
    centralizarNoCaminhao: function () {
      var ids = Object.keys(marcadores);
      if (ids.length && mapa) mapa.setView(marcadores[ids[0]].getLatLng(), 16);
    }
  };
})();
