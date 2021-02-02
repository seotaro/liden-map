"use strict";

(function () {
  class Lightning {
    current = -1;
    datetimes = [];
    type = 0; // 0=放電種別区別なし、1=区別あり

    constructor(datetimes) {
      this.current = datetimes.length - 1;
      this.datetimes = datetimes;
      this.type = 0;
    }

    currentDatetime() {
      return this.datetimes[this.current];
    }
  }

  let lightning = new Lightning(["2020-08-12T06:00:00Z"]);

  initializeLightingTypeController();

  mapboxgl.accessToken =
    "pk.eyJ1Ijoic2VvdGFybyIsImEiOiJjazA2ZjV2ODkzbmhnM2JwMGYycmc5OTVjIn0.5k-2FWYVmr5FH7E4Uk6V0g";

  var map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/seotaro/ckccx2ir32ft21ilprmbedyud",
    center: [139.5, 36.0],
    zoom: 8,
    antialias: true,
  });

  map.on("load", function () {
    map.loadImage("cloud-to-cloud.png", function (error, image) {
      if (error) throw error;
      map.addImage("cloud-to-cloud", image);

      map.loadImage("cloud-to-ground.png", function (error, image) {
        if (error) throw error;
        map.addImage("cloud-to-ground", image);

        fetch(
          "https://asia-northeast1-weather-282200.cloudfunctions.net/LightningAPI/v1/lightning/datetimes.json?duration=300&count=10&basetime=" +
            lightning.datetimes[0]
        )
          .then((res) => res.json())
          .then((d) => {
            lightning = new Lightning(d.datetimes);
            initializeDatetimeController();
            updateDatetimeController();
            updateMap();
          });
      });
    });

    initializeDatetimeController();
    updateDatetimeController();
    updateMap();
  });

  // 時刻コントローラーを初期化する。
  function initializeDatetimeController() {
    // 時刻スライダー
    {
      const el = document.getElementById("datetimesSlider"); // input要素

      while (el.lastChild) {
        el.removeChild(el.lastChild);
      }
      for (let i = 0; i < lightning.datetimes.length; i++) {
        let option = document.createElement("option");
        option.setAttribute("value", i);
        el.appendChild(option);
      }

      el.min = 0;
      el.max = lightning.datetimes.length - 1;
      el.addEventListener("change", (ev) => {
        lightning.current = ev.target.value;
        updateDatetimeController();
        updateMap();
      });
    }

    // 時刻セレクター
    {
      const el = document.getElementById("datetimesSelector");

      while (el.lastChild) {
        el.removeChild(el.lastChild);
      }
      for (let i = 0; i < lightning.datetimes.length; i++) {
        let option = document.createElement("option");
        option.setAttribute("value", i);
        option.innerHTML = lightning.datetimes[i];
        el.appendChild(option);
      }

      el.addEventListener("change", (ev) => {
        lightning.current = ev.target.value;
        updateDatetimeController();
        updateMap();
      });
    }
  }

  // 時刻コントローラーを更新する。
  function updateDatetimeController() {
    let selector = document.getElementById("datetimesSelector");
    selector.value = lightning.current;

    let slider = document.getElementById("datetimesSlider");
    slider.value = lightning.current;
  }

  // 放電種別コントローラーを初期化する。
  function initializeLightingTypeController() {
    // 放電種別区別なし
    {
      let el = document.getElementById("simpleLightnings");
      el.checked = true;
      el.addEventListener("change", (ev) => {
        lightning.type = 0;
        updateMap();
      });
    }

    // 放電種別区別あり
    {
      let el = document.getElementById("multiLightnings");
      el.checked = false;
      el.addEventListener("change", (ev) => {
        lightning.type = 1;
        updateMap();
      });
    }
  }

  // マップを更新する。
  function updateMap() {
    if (map.getLayer("lightnings")) {
      map.removeLayer("lightnings");
    }

    if (map.getSource("lightnings")) {
      map.removeSource("lightnings");
    }

    let t = lightning.currentDatetime();

    if (lightning.type == 0) {
      map.addLayer({
        id: "lightnings",
        type: "symbol",
        source: {
          type: "geojson",
          data:
            "https://asia-northeast1-weather-282200.cloudfunctions.net/LightningAPI/v1/lightning/simple/lightnings.json?basetime=" +
            t +
            "&duration=300",
        },

        layout: {
          "icon-image": "cloud-to-cloud",
          "icon-size": 0.4,
          "icon-allow-overlap": true,
        },
      });
    } else {
      map.addLayer({
        id: "lightnings",
        type: "symbol",
        source: {
          type: "geojson",
          data:
            "https://asia-northeast1-weather-282200.cloudfunctions.net/LightningAPI/v1/lightning/multi/lightnings.json?basetime=" +
            t +
            "&duration=300",
        },

        layout: {
          "icon-image": [
            "case",
            ["==", ["get", "type"], 0],
            "cloud-to-cloud",
            ["==", ["get", "type"], 1],
            "cloud-to-ground",
            "cloud-to-cloud",
          ],
          "icon-size": 0.4,
          "icon-allow-overlap": true,
        },
      });
    }
  }
})();
