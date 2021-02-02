(function () {
  let current = 0;
  let datetimes = ["2020-08-12T06:00:00Z"]; // 時刻リスト。集計間隔で正規化された時刻

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
            datetimes[0]
        )
          .then((res) => res.json())
          .then((d) => {
            datetimes = d.datetimes;
            current = d.datetimes.length - 1;
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
    // 時刻optionの生成とセット
    {
      let list = document.getElementById("datetimeList");
      while (list.lastChild) {
        list.removeChild(list.lastChild);
      }

      let selector = document.getElementById("datetimesSelector");
      while (selector.lastChild) {
        selector.removeChild(selector.lastChild);
      }

      for (let i = 0; i < datetimes.length; i++) {
        let option = document.createElement("option");
        option.setAttribute("value", i);
        option.innerHTML = datetimes[i];

        list.appendChild(option);
        selector.appendChild(option);
      }
    }

    // 時刻スライダー
    {
      const el = document.getElementById("datetimesSlider"); // input要素
      el.min = 0;
      el.max = datetimes.length - 1;
      el.addEventListener("change", (ev) => {
        current = ev.target.value;
        updateDatetimeController();
        updateMap();
      });
    }

    // 時刻セレクター
    {
      const el = document.getElementById("datetimesSelector");
      el.addEventListener("change", (ev) => {
        current = ev.target.value;
        updateDatetimeController();
        updateMap();
      });
    }
  }

  // 時刻コントローラーを更新する。
  function updateDatetimeController() {
    let selector = document.getElementById("datetimesSelector");
    selector.value = current;

    let slider = document.getElementById("datetimesSlider");
    slider.value = current;
  }

  // 放電種別コントローラーを初期化する。
  function initializeLightingTypeController() {
    // 放電種別区別なし
    {
      let el = document.getElementById("simpleLightnings");
      el.checked = true;
      el.addEventListener("change", (ev) => {
        updateMap();
      });
    }

    // 放電種別区別あり
    {
      let el = document.getElementById("multiLightnings");
      el.checked = false;
      el.addEventListener("change", (ev) => {
        updateMap();
      });
    }
  }

  // 放電種別を返す。
  function isEnableLightingType() {
    let el = document.getElementById("multiLightnings");
    return el.checked;
  }

  // マップを更新する。
  function updateMap() {
    if (map.getLayer("lightnings")) {
      map.removeLayer("lightnings");
    }

    if (map.getSource("lightnings")) {
      map.removeSource("lightnings");
    }

    let t = datetimes[current];

    if (isEnableLightingType()) {
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
    } else {
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
    }
  }
})();
