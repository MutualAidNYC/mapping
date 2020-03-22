function loadMapboxAccessToken() {
    return fetch('/mapbox-access-token')
        .then(response => response.text());
}

function loadMap() {
    return new Promise((resolve, reject) => {
        var map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/light-v10',
            center: [-73.97, 40.77427],
            zoom: 13,
        });

        map.on('load', () => {
            resolve(map);
        });
    });
}

function configureMap(map, geojson) {
    const code = 'nta';
    const fillColor = '#81b1e4';
    const strokeColor = '#0366d6';

    map.addSource(code, {
        type: 'geojson',
        data: geojson,
    });

    map.addLayer({
        id: code,
        type: 'fill',
        source: code,
        paint: {
            'fill-color': fillColor,
            'fill-opacity': 0.8,
            'fill-outline-color': strokeColor,
        }
    });
}

function loadNeighborhoods() {
    // GeoJSON - "Feature" Format
    //
    // {
    //   "type": "Feature",
    //   "properties": {
    //     "ntacode": "BK88",
    //     "shape_area": "54005019.048",
    //     "county_fips": "047",
    //     "ntaname": "Borough Park",
    //     "shape_leng": "39247.2278309",
    //     "boro_name": "Brooklyn",
    //     "boro_code": "3"
    //   },
    //   "geometry": {
    //     "type": "MultiPolygon",
    //     "coordinates": [...]
    //   }
    // }
    return fetch('/data/nta.geojson')
        .then(response => response.json());
}

document.addEventListener('DOMContentLoaded', () => {
    loadMapboxAccessToken()
        .then(token => { mapboxgl.accessToken = token; })
        .then(() => Promise.all([loadMap(), loadNeighborhoods()]))
        .then(([map, geojson]) => configureMap(map, geojson));
});
