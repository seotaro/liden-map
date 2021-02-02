(function () {
  let datetimes = ["2020-08-12T06:00:00Z"]; // 時刻リスト。集計間隔で正規化された時刻

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
          .then((datetimes) => {
            initializeController(datetimes.datetimes);
            updateMap(datetimes.datetimes[datetimes.datetimes.length - 1]);
          });
      });
    });

    initializeController(datetimes);
    updateMap(datetimes[datetimes.length - 1]);
  });

  function initializeController(datetimes_) {
    datetimes = datetimes_;

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
        updateDatetimeController(ev.target.value);
        updateMap(datetimes[ev.target.value]);
      });
    }

    // 時刻セレクター
    {
      const el = document.getElementById("datetimesSelector");
      el.addEventListener("change", (ev) => {
        updateDatetimeController(ev.target.value);
        updateMap(datetimes[ev.target.value]);
      });
    }

    // 初期値をセットする。
    updateDatetimeController(datetimes.length - 1);
  }

  // 時刻コントローラーを更新する。
  function updateDatetimeController(index) {
    let selector = document.getElementById("datetimesSelector");
    selector.value = index;

    let slider = document.getElementById("datetimesSlider");
    slider.value = index;
  }

  // マップを更新する。
  function updateMap(t) {
    if (map.getLayer("points")) {
      map.removeLayer("points");
    }

    if (map.getSource("points")) {
      map.removeSource("points");
    }

    map.addLayer({
      id: "points",
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

    // map.addLayer({
    //   id: "multipoint",
    //   type: "symbol",
    //   source: {
    //     type: "geojson",
    //     data:
    //       "https://asia-northeast1-weather-282200.cloudfunctions.net/LightningAPI/v1/lightning/simple/lightnings.json?basetime=2020-08-12T05:35:00Z&duration=300",
    //   },

    //   layout: {
    //     "icon-image": "cloud-to-cloud",
    //     "icon-size": 0.4,
    //     "icon-allow-overlap": true,
    //   },
    // });
  }
})();
