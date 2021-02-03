"use strict";

(function () {
  class LightningSettings {
    type = 0; // 0=放電種別区別なし、1=区別あり

    // 時刻リスト
    currentDatetimeIndex = -1;
    datetimes = [];

    // 集計間隔リスト
    currentDurationIndex = -1;
    durations = [];

    constructor(datetimes) {
      this.type = 0;

      this.currentDatetimeIndex = datetimes.length - 1;
      this.datetimes = datetimes;

      this.currentDurationIndex = 2;
      this.durations = [60, 150, 300, 600, 1800, 3600];
    }

    currentDatetime() {
      return this.datetimes[this.currentDatetimeIndex];
    }

    currentDuration() {
      return this.durations[this.currentDurationIndex];
    }
  }

  let lightningSettings = new LightningSettings(["2020-08-12T06:00:00Z"]);

  initializeLightingTypeController();
  initializeDurationController();

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

        fetchLightningDatetimes();
      });
    });

    initializeDatetimeController();
    updateDatetimeController();
    updateDurationController();
  });

  // 時刻コントローラーを初期化する。
  function initializeDatetimeController() {
    // 時刻スライダー
    {
      const el = document.getElementById("datetimesSlider"); // input要素

      while (el.lastChild) {
        el.removeChild(el.lastChild);
      }
      for (let i = 0; i < lightningSettings.datetimes.length; i++) {
        let option = document.createElement("option");
        option.setAttribute("value", i);
        el.appendChild(option);
      }

      el.min = 0;
      el.max = lightningSettings.datetimes.length - 1;
      el.addEventListener("change", (ev) => {
        lightningSettings.currentDatetimeIndex = ev.target.value;

        let el = document.getElementById("datetimesSelector");
        el.value = lightningSettings.currentDatetimeIndex;

        updateMap();
      });
    }

    // 時刻セレクター
    {
      const el = document.getElementById("datetimesSelector");

      while (el.lastChild) {
        el.removeChild(el.lastChild);
      }
      for (let i = 0; i < lightningSettings.datetimes.length; i++) {
        let option = document.createElement("option");
        option.setAttribute("value", i);
        option.innerHTML = lightningSettings.datetimes[i];
        el.appendChild(option);
      }

      el.addEventListener("change", (ev) => {
        lightningSettings.currentDatetimeIndex = ev.target.value;

        let el = document.getElementById("datetimesSlider");
        el.value = lightningSettings.currentDatetimeIndex;

        updateMap();
      });
    }
  }

  // 集計間隔コントローラーを初期化する。
  function initializeDurationController() {
    // 集計間隔セレクター
    {
      const el = document.getElementById("durationSelector");

      while (el.lastChild) {
        el.removeChild(el.lastChild);
      }
      for (let i = 0; i < lightningSettings.durations.length; i++) {
        let option = document.createElement("option");
        option.setAttribute("value", i);
        option.innerHTML = lightningSettings.durations[i] + "[sec]";
        el.appendChild(option);
      }

      el.addEventListener("change", (ev) => {
        lightningSettings = new LightningSettings(["2020-08-12T06:00:00Z"]);
        lightningSettings.currentDurationIndex = ev.target.value;

        fetchLightningDatetimes();
      });
    }
  }

  // 時刻コントローラーを更新する。
  function updateDatetimeController() {
    {
      let el = document.getElementById("datetimesSelector");
      el.value = lightningSettings.currentDatetimeIndex;
    }

    {
      let el = document.getElementById("datetimesSlider");
      el.value = lightningSettings.currentDatetimeIndex;
    }
  }

  // 集計間隔コントローラーを更新する。
  function updateDurationController() {
    let el = document.getElementById("durationSelector");
    el.value = lightningSettings.currentDurationIndex;
  }

  // 更新する。
  function updateLightningsCountController(count) {
    let el = document.getElementById("lightingCount");
    if (count == null) {
      el.value = "-";
    } else {
      el.value = count;
    }
  }

  // 放電種別コントローラーを初期化する。
  function initializeLightingTypeController() {
    // 放電種別区別なし
    {
      let el = document.getElementById("simpleLightnings");
      el.checked = true;
      el.addEventListener("change", (ev) => {
        lightningSettings.type = 0;
        updateMap();
      });
    }

    // 放電種別区別あり
    {
      let el = document.getElementById("multiLightnings");
      el.checked = false;
      el.addEventListener("change", (ev) => {
        lightningSettings.type = 1;
        updateMap();
      });
    }
  }

  // マップを更新する。
  function updateMap() {
    document.body.style.cursor = "progress";

    let t = lightningSettings.currentDatetime();

    updateLightningsCountController();
    if (lightningSettings.type == 0) {
      fetch(
        "https://asia-northeast1-weather-282200.cloudfunctions.net/lightning/v1/simple/lightnings.json?basetime=" +
          t +
          "&duration=" +
          lightningSettings.currentDuration()
      )
        .then((res) => res.json())
        .then((d) => {
          if (map.getLayer("lightnings")) {
            map.removeLayer("lightnings");
          }

          if (map.getSource("lightnings")) {
            map.removeSource("lightnings");
          }

          map.addLayer({
            id: "lightnings",
            type: "symbol",
            source: {
              type: "geojson",
              data: d,
            },

            layout: {
              "icon-image": "cloud-to-cloud",
              "icon-size": 0.4,
              "icon-allow-overlap": true,
            },
          });

          updateLightningsCountController(
            d.features[0].geometry.coordinates.length
          );
        });
    } else {
      fetch(
        "https://asia-northeast1-weather-282200.cloudfunctions.net/lightning/v1/multi/lightnings.json?basetime=" +
          t +
          "&duration=" +
          lightningSettings.currentDuration()
      )
        .then((res) => res.json())
        .then((d) => {
          if (map.getLayer("lightnings")) {
            map.removeLayer("lightnings");
          }

          if (map.getSource("lightnings")) {
            map.removeSource("lightnings");
          }

          map.addLayer({
            id: "lightnings",
            type: "symbol",
            source: {
              type: "geojson",
              data:
                "https://asia-northeast1-weather-282200.cloudfunctions.net/lightning/v1/multi/lightnings.json?basetime=" +
                t +
                "&duration=" +
                lightningSettings.currentDuration(),
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

          updateLightningsCountController(d.features.length);
        });
    }

    document.body.style.cursor = "auto";
  }

  function fetchLightningDatetimes() {
    document.body.style.cursor = "progress";

    fetch(
      "https://asia-northeast1-weather-282200.cloudfunctions.net/lightning/v1/datetimes.json?duration=" +
        lightningSettings.currentDuration() +
        "&count=50&basetime=" +
        lightningSettings.currentDatetime()
    )
      .then((res) => res.json())
      .then((d) => {
        lightningSettings = new LightningSettings(d.datetimes); // 取得した時刻リストで上書きする。
        initializeDatetimeController();
        updateDatetimeController();
        updateMap();

        document.body.style.cursor = "auto";
      });
  }
})();
