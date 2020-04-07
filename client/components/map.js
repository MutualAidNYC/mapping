import mapboxgl, { Map, NavigationControl, Popup } from 'mapbox-gl';

import './map.scss';


function loadMapboxAccessToken() {
    return fetch('/mapbox-access-token')
        .then(response => response.text())
        .then(token => { mapboxgl.accessToken = token; });
}

function loadMap(container) {
    return new Promise((resolve) => {
        const map = new Map({
            container,
            style: 'mapbox://styles/mapbox/light-v10',
            center: [-74.005, 40.705],
            zoom: 9.9,
            scrollZoom: false,
        });

        map.addControl(new NavigationControl());

        map.on('load', () => {
            resolve(map);
        });
    });
}

function configureMap(map, geodata, fillOpacity) {
    const bordersSourceId = 'nta-borders';
    const neighborhoodsWithLocalGroupsSourceId = 'nta-neighborhoods-with-local-groups';
    const unservicedNeighborhoodsSourceId = 'nta-unserviced-neighborhoods';

    map.addSource(bordersSourceId, {
        type: 'geojson',
        data: geodata.allNeighborhoods,
    });

    map.addSource(neighborhoodsWithLocalGroupsSourceId, {
        type: 'geojson',
        data: geodata.neighborhoodsWithLocalGroups,
    });

    map.addSource(unservicedNeighborhoodsSourceId, {
        type: 'geojson',
        data: geodata.neighborhoodsWithoutLocalGroups,
    });

    map.addLayer({
        id: unservicedNeighborhoodsSourceId,
        type: 'fill',
        source: unservicedNeighborhoodsSourceId,
        paint: {
            'fill-color': '#59A6E5',
            'fill-opacity': fillOpacity,
        }
    });

    map.addLayer({
        id: neighborhoodsWithLocalGroupsSourceId,
        type: 'fill',
        source: neighborhoodsWithLocalGroupsSourceId,
        paint: {
            // 'fill-color': '#A27CEF',
            'fill-color': '#43C59E',
            'fill-opacity': fillOpacity,
        }
    });

    // Neighborhood Borderlines Layer
    map.addLayer({
        id: bordersSourceId,
        type: 'line',
        source: bordersSourceId,
        layout: {
            'line-join': 'round',
            'line-cap': 'round'
        },
        paint: {
            'line-color': 'rgba(0,0,0,0.4)',
            'line-width': 2,
        }
    });

    function handleClick(e) {
        const description = e.features[0].properties.description;

        new Popup()
            .setMaxWidth('')
            .setLngLat(e.lngLat)
            .setHTML(description)
            .addTo(map);
    }

    function handleMouseEnter() {
        map.getCanvas().style.cursor = 'pointer';
    }

    function handleMouseLeave() {
        map.getCanvas().style.cursor = '';
    }

    // When a click event occurs on a feature in the layer, open a popup at the
    // location of the feature, with description HTML from its properties.
    map.on('click', unservicedNeighborhoodsSourceId, handleClick);
    map.on('click', neighborhoodsWithLocalGroupsSourceId, handleClick);

    // Change the cursor to normal when the mouse leaves the layer.
    map.on('mouseleave', unservicedNeighborhoodsSourceId, handleMouseLeave);
    map.on('mouseleave', neighborhoodsWithLocalGroupsSourceId, handleMouseLeave);

    // Change the cursor to a pointer when the mouse is over the layer.
    map.on('mouseenter', unservicedNeighborhoodsSourceId, handleMouseEnter);
    map.on('mouseenter', neighborhoodsWithLocalGroupsSourceId, handleMouseEnter);
}

export {
    loadMapboxAccessToken,
    loadMap,
    configureMap,
};
