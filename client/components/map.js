import mapboxgl, { Map, NavigationControl, Popup } from 'mapbox-gl';

import './map.scss';


class NeighborhoodMap {

    constructor({ mapId, fillOpacity }) {
        this.mapId = mapId;
        this.fillOpacity = fillOpacity;
        this.map = null;
    }

    async load() {
        const response = await fetch('/mapbox-access-token');
        const token = await response.text();
        mapboxgl.accessToken = token;

        await new Promise((resolve) => {
            const map = new Map({
                container: this.mapId.replace(/^#/, ''),
                style: 'mapbox://styles/mapbox/light-v10',
                center: [-74.005, 40.705],
                zoom: 9.9,
                scrollZoom: false,
            });

            map.addControl(new NavigationControl());

            map.on('load', () => {
                this.map = map;
                resolve(map);
            });
        });
    }

    async configure(store, generatePopupHtml) {
        const sourceIds = {
            borders: 'nta-borders',
            neighborhoodsWithLocalGroups: 'nta-neighborhoods-with-local-groups',
            neighborhoodsWithoutLocalGroups: 'nta-unserviced-neighborhoods',
        };

        this.map.addSource(sourceIds.borders, {
            type: 'geojson',
            data: store.allNeighborhoods(),
        });

        this.map.addSource(sourceIds.neighborhoodsWithLocalGroups, {
            type: 'geojson',
            data: store.neighborhoodsWithLocalGroups(),
        });

        this.map.addSource(sourceIds.neighborhoodsWithoutLocalGroups, {
            type: 'geojson',
            data: store.neighborhoodsWithoutLocalGroups(),
        });

        this.map.addLayer({
            id: sourceIds.neighborhoodsWithoutLocalGroups,
            type: 'fill',
            source: sourceIds.neighborhoodsWithoutLocalGroups,
            paint: {
                'fill-color': '#59A6E5',
                'fill-opacity': this.fillOpacity,
            }
        });

        this.map.addLayer({
            id: sourceIds.neighborhoodsWithLocalGroups,
            type: 'fill',
            source: sourceIds.neighborhoodsWithLocalGroups,
            paint: {
                'fill-color': '#43C59E',
                'fill-opacity': this.fillOpacity,
            }
        });

        // Neighborhood Borderlines Layer.
        this.map.addLayer({
            id: sourceIds.borders,
            type: 'line',
            source: sourceIds.borders,
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': 'rgba(0,0,0,0.4)',
                'line-width': 2,
            }
        });

        const handleClick = async (event) => {
            const {
                ntacode: ntaCode,
                boro_name: boroName,
            } = event.features[0].properties;

            const neighborhood = store.neighborhoodByNtaCode(ntaCode);
            const [localGroups, boroGroups] = await Promise.all([
                store.fetchGroupsInNeighborhood(ntaCode),
                store.fetchGroupsByBoroName(boroName)
            ]);
            const {
                groupsInNyc,
                groupsInNys,
                nationalGroups,
            } = store;

            const description = generatePopupHtml({
                neighborhoodName: neighborhood.name,
                localGroups,
                boroGroups,
                groupsInNyc,
                groupsInNys,
                nationalGroups,
            })

            new Popup()
                .setMaxWidth('')
                .setLngLat(event.lngLat)
                .setHTML(description)
                .addTo(this.map);
        }

        const handleMouseEnter = () => {
            this.map.getCanvas().style.cursor = 'pointer';
        };

        const handleMouseLeave = () => {
            this.map.getCanvas().style.cursor = '';
        };

        // When a click event occurs on a feature in the layer, open a popup at the
        // location of the feature, with description HTML from its properties.
        this.map.on('click', sourceIds.neighborhoodsWithoutLocalGroups, handleClick);
        this.map.on('click', sourceIds.neighborhoodsWithLocalGroups, handleClick);

        // Change the cursor to normal when the mouse leaves the layer.
        this.map.on('mouseleave', sourceIds.neighborhoodsWithoutLocalGroups, handleMouseLeave);
        this.map.on('mouseleave', sourceIds.neighborhoodsWithLocalGroups, handleMouseLeave);

        // Change the cursor to a pointer when the mouse is over the layer.
        this.map.on('mouseenter', sourceIds.neighborhoodsWithoutLocalGroups, handleMouseEnter);
        this.map.on('mouseenter', sourceIds.neighborhoodsWithLocalGroups, handleMouseEnter);
    }

}

export default NeighborhoodMap;
