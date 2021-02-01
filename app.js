(function () {
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

        map.addLayer({
          id: "points",
          type: "symbol",
          source: {
            type: "geojson",
            data:
              "https://asia-northeast1-weather-282200.cloudfunctions.net/LightningAPI/v1/lightning/multi/lightnings.json?basetime=2020-08-12T05:40:00Z&duration=300",
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
      });
    });
  });
})();
