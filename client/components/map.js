import mapboxgl, { Map, NavigationControl, Popup } from 'mapbox-gl';

import style from './map.scss';


class NeighborhoodMap {

    constructor({ mapId, fillOpacity }) {
        this.mapId = mapId;
        this.fillOpacity = fillOpacity;
        this.map = null;
        this.isShowingGroupsPopup = false;
        this.hoverPopup = new Popup({
            closeButton: false,
            closeOnClick: false
        });
    }

    async load(baseUrl) {
        const response = await fetch(`${baseUrl}/mapbox-access-token`);
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

    configure(store, generatePopupHtml) {
        const areaIds = {
            allNeighborhoods: 'nta-all-neighborhoods',
            neighborhoodsWithLocalGroups: 'nta-neighborhoods-with-local-groups',
            neighborhoodsWithoutLocalGroups: 'nta-neighborhoods-without-local-groups',
        };

        this.addSources(areaIds, store);
        this.addLayers(areaIds);
        this.addEventHandlers(areaIds, store, generatePopupHtml);
    }

    addSources(areaIds, store) {
        // Source: All Neighborhoods.
        this.map.addSource(areaIds.allNeighborhoods, {
            type: 'geojson',
            data: store.allNeighborhoods(),
        });

        // Source: Neighborhoods with local groups.
        this.map.addSource(areaIds.neighborhoodsWithLocalGroups, {
            type: 'geojson',
            data: store.neighborhoodsWithLocalGroups(),
        });

        // Source: Neighborhoods without local groups.
        this.map.addSource(areaIds.neighborhoodsWithoutLocalGroups, {
            type: 'geojson',
            data: store.neighborhoodsWithoutLocalGroups(),
        });
    }

    addLayers(areaIds) {
        // Layer: All Neighborhoods.
        this.map.addLayer({
            id: areaIds.allNeighborhoods,
            type: 'fill',
            source: areaIds.allNeighborhoods,
            paint: {
                'fill-opacity': 0,
            }
        });

        // Layer: Neighborhoods with local groups.
        this.map.addLayer({
            id: areaIds.neighborhoodsWithLocalGroups,
            type: 'fill',
            source: areaIds.neighborhoodsWithLocalGroups,
            paint: {
                'fill-color': '#43C59E',
                'fill-opacity': this.fillOpacity,
            }
        });

        // Layer: Neighborhoods without local groups.
        this.map.addLayer({
            id: areaIds.neighborhoodsWithoutLocalGroups,
            type: 'fill',
            source: areaIds.neighborhoodsWithoutLocalGroups,
            paint: {
                'fill-color': '#59A6E5',
                'fill-opacity': this.fillOpacity,
            }
        });

        // Layer: All Neighborhoods, borderlines only.
        this.map.addLayer({
            id: 'nta-borders',
            type: 'line',
            source: areaIds.allNeighborhoods,
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': 'rgba(0,0,0,0.4)',
                'line-width': 2,
            }
        });
    }

    addEventHandlers(areaIds, store, generatePopupHtml) {
        // When a click event occurs on a feature in the layer, open a popup at the
        // location of the feature, with description HTML from its properties.
        this.map.on('click', areaIds.allNeighborhoods, this.showGroupsPopup.bind(this, store, generatePopupHtml));

        this.map.on('mouseenter', areaIds.allNeighborhoods, () => this.startCursorPointer());
        this.map.on('mousemove', areaIds.allNeighborhoods, (event) => this.showHoverPopup(store, event));
        this.map.on('mouseleave', areaIds.allNeighborhoods, () => {
            this.stopCursorPointer();
            this.hideHoverPopup();
        });
    }

    startCursorPointer() {
        this.map.getCanvas().style.cursor = 'pointer';
    }

    stopCursorPointer() {
        this.map.getCanvas().style.cursor = '';
    }

    showHoverPopup(store, event) {
        if (this.isShowingGroupsPopup) {
            return;
        }

        const { ntacode } = event.features[0].properties;
        const neighborhood = store.neighborhoodByNtaCode(ntacode);
        this.hoverPopup
            .setMaxWidth('')
            .setLngLat(event.lngLat)
            .setHTML(`<h2 class=${style.hoverPopupTitle}>${neighborhood.name}</h2>`)
            .addTo(this.map);
    }

    hideHoverPopup() {
        this.hoverPopup.remove();
    }

    async showGroupsPopup(store, generatePopupHtml, event) {
        this.hideHoverPopup();

        const { ntacode, boro_name } = event.features[0].properties;
        const neighborhood = store.neighborhoodByNtaCode(ntacode);
        const [localGroups, boroGroups, nonlocalGroups] = await Promise.all([
            store.fetchGroupsInNeighborhood(ntacode),
            store.fetchGroupsByBoroName(boro_name),
            store.fetchNonlocalGroups()
        ]);

        const description = generatePopupHtml({
            neighborhoodName: neighborhood.name,
            localGroups,
            boroGroups,
            nonlocalGroups,
        });

        const groupsPopup = new Popup()
            .setMaxWidth('')
            .setLngLat(event.lngLat)
            .setHTML(description)
            .addTo(this.map);
        groupsPopup.addClassName(style.groupsPopup);

        this.isShowingGroupsPopup = true;
        groupsPopup.on('close', () => this.isShowingGroupsPopup = false);
    }
}

export default NeighborhoodMap;
