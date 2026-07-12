/**
 * Rastreamento em tempo real do caminhao da coleta seletiva — ASMATOZ
 * Servidor Traccar: https://136.248.77.228.sslip.io
 *
 * COMO USAR no geoportal (index.html), DEPOIS do script que cria o mapa:
 *
 *   <script src="rastreamento-caminhao.js"></script>
 *   <script>
 *     RastreamentoASMATOZ.iniciar(map);   // troque "map" pelo nome da sua variavel Leaflet
 *   </script>
 */

var RastreamentoASMATOZ = (function () {
  "use strict";

  var SERVIDOR = "https://136.248.77.228.sslip.io";
  var TOKEN = "RzBFAiBb1_5IQ9TynLTkOhrqOS43kFcz1J2p1EVxKkLHaShxvgIhALnUTGyTe1CRm7HoSVRqdyyhh0QAi7cpmHjJMjSBoVde0eyJpIjo5MDEyNTQzNzM0MzgZMjUxNTAzLCJ1IjoyLCJlIjoiMjAzMC0wMS0wMVQwMDowMDowMC4wMDArMDA6MDAifQ";
  var INTERVALO_SEGUNDOS = 15;
  var MAX_PONTOS_TRILHA = 300;

  var mapa = null, timer = null;
  var marcadores = {}, trilhas = {};

  var iconeCaminhao = L.divIcon({
    className: "caminhao-icone",
    html:
      '<div style="background:#2e7d32;border:2px solid #fff;border-radius:50%;' +
      'width:38px;height:38px;display:flex;align-items:center;justify-content:center;' +
      'box-shadow:0 2px 6px rgba(0,0,0,.4);font-size:20px;">&#128667;</div>',
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20]
  });

  function buscar(caminho) {
    return fetch(SERVIDOR + caminho, {
      headers: { Authorization: "Bearer " + TOKEN }
    }).then(function (r) {
      if (!r.ok) throw new Error("Traccar HTTP " + r.status);
      return r.json();
    });
  }

  function minutosAtras(iso) {
    return Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  }

  function textoPopup(dispositivo, pos) {
    var atraso = minutosAtras(pos.fixTime);
    var status = atraso <= 5
      ? '<span style="color:#2e7d32;font-weight:bold;">&#9679; Em rota agora</span>'
      : '<span style="color:#b26a00;font-weight:bold;">&#9679; Ultima posicao ha ' + atraso + ' min</span>';
    var vel = Math.round((pos.speed || 0) * 1.852); // nos -> km/h
    var hora = new Date(pos.fixTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return "<strong>" + (dispositivo.name || "Caminhao da coleta") + "</strong><br>" +
           status + "<br>Velocidade: " + vel + " km/h<br>Atualizado as " + hora;
  }

  function atualizar(dispositivo, pos) {
    var id = dispositivo.id;
    var latlng = [pos.latitude, pos.longitude];

    if (!marcadores[id]) {
      marcadores[id] = L.marker(latlng, { icon: iconeCaminhao, zIndexOffset: 1000 })
        .addTo(mapa)
        .bindPopup(textoPopup(dispositivo, pos));
      trilhas[id] = L.polyline([latlng], {
        color: "#2e7d32", weight: 4, opacity: 0.7, dashArray: "6 8"
      }).addTo(mapa);
    } else {
      marcadores[id].setLatLng(latlng);
      marcadores[id].setPopupContent(textoPopup(dispositivo, pos));
      var pts = trilhas[id].getLatLngs();
      var ult = pts[pts.length - 1];
      if (!ult || ult.lat !== latlng[0] || ult.lng !== latlng[1]) {
        pts.push(L.latLng(latlng[0], latlng[1]));
        if (pts.length > MAX_PONTOS_TRILHA) pts.shift();
        trilhas[id].setLatLngs(pts);
      }
    }
  }

  function ciclo() {
    Promise.all([buscar("/api/devices"), buscar("/api/positions")])
      .then(function (res) {
        var dispositivos = res[0], posicoes = res[1];
        var porId = {};
        posicoes.forEach(function (p) { porId[p.deviceId] = p; });
        dispositivos.forEach(function (d) {
          if (porId[d.id]) atualizar(d, porId[d.id]);
        });
      })
      .catch(function (e) {
        console.warn("Rastreamento ASMATOZ:", e.message);
      });
  }

  return {
    iniciar: function (mapaLeaflet) {
      mapa = mapaLeaflet;
      ciclo();
      timer = setInterval(ciclo, INTERVALO_SEGUNDOS * 1000);
    },
    parar: function () { if (timer) clearInterval(timer); },
    centralizarNoCaminhao: function () {
      var ids = Object.keys(marcadores);
      if (ids.length) mapa.setView(marcadores[ids[0]].getLatLng(), 16);
    }
  };
})();
