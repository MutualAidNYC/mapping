function loadMapboxAccessToken() {
    return fetch('/mapbox-access-token')
        .then(response => response.text());
}

function loadMap() {
    return new Promise((resolve, reject) => {
        const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/light-v10',
            center: [-74.005, 40.705],
            zoom: 9.9,
            scrollZoom: false,
        });

        map.addControl(new mapboxgl.NavigationControl());

        map.on('load', () => {
            resolve(map);
        });
    });
}

function configureMap(map, geodata) {
    const bordersSourceId = 'nta-borders';
    const servicedNeighborhoodsSourceId = 'nta-serviced-neighborhoods';
    const neighborhoodsWithLocalGroupsSourceId = 'nta-neighborhoods-with-local-groups';
    const unservicedNeighborhoodsSourceId = 'nta-unserviced-neighborhoods';

    map.addSource(bordersSourceId, {
        type: 'geojson',
        data: geodata.allNeighborhoods,
    });

    map.addSource(servicedNeighborhoodsSourceId, {
        type: 'geojson',
        data: geodata.neighborhoodsWithServicingLocalGroups,
    });

    map.addSource(neighborhoodsWithLocalGroupsSourceId, {
        type: 'geojson',
        data: geodata.neighborhoodsWithLocalGroups,
    });

    map.addSource(unservicedNeighborhoodsSourceId, {
        type: 'geojson',
        data: geodata.neighborhoodsWithoutLocalGroups,
    });

    const fillOpacity = window.FILL_OPACITY || 1;

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
            'fill-color': '#A27CEF',
            'fill-opacity': fillOpacity,
        }
    });

    map.addLayer({
        id: servicedNeighborhoodsSourceId,
        type: 'fill',
        source: servicedNeighborhoodsSourceId,
        paint: {
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

        new mapboxgl.Popup()
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
    map.on('click', servicedNeighborhoodsSourceId, handleClick);

    // Change the cursor to normal when the mouse leaves the layer.
    map.on('mouseleave', unservicedNeighborhoodsSourceId, handleMouseLeave);
    map.on('mouseleave', neighborhoodsWithLocalGroupsSourceId, handleMouseLeave);
    map.on('mouseleave', servicedNeighborhoodsSourceId, handleMouseLeave);

    // Change the cursor to a pointer when the mouse is over the layer.
    map.on('mouseenter', unservicedNeighborhoodsSourceId, handleMouseEnter);
    map.on('mouseenter', neighborhoodsWithLocalGroupsSourceId, handleMouseEnter);
    map.on('mouseenter', servicedNeighborhoodsSourceId, handleMouseEnter);
}

function loadNTAGeodata() {
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

function loadGroups() {
    return fetch('/data/groups')
        .then(response => response.json())
        .then(groups => groups.map(group => Object.assign({}, group, {
            // Array of strings
            region: JSON.parse(group.region),
            // Array of foreign keys to "Ref - Neighborhood" table.
            servicingNeighborhood: JSON.parse(group.servicingNeighborhood),
            // Array of foreign keys to "Ref - Most Impacted Groups" table.
            communitiesServed: JSON.parse(group.communitiesServed),
            // Array of foreign keys to "Ref - Most Impacted Groups" table.
            advocacyIssues: JSON.parse(group.advocacyIssues),
        })));
}

function loadNeighborhoods() {
    return fetch('/data/neighborhoods')
        .then(response => response.json());
}

function loadCommunities() {
    return fetch('/data/communities')
        .then(response => response.json());
}

function createStore(groups, neighborhoods) {
    // break down group list on click into
    //
    // Servicing this Neighborhood
    // Located in this Neighborhood
    // Servicing this Borough
    // Servicing all of NYC

    const idToNeighborHood = neighborhoods.reduce((obj, neighborhood) => {
        obj[neighborhood.airtableId] = neighborhood;
        return obj;
    }, {});

    const ntaCodeToNeighborhood = neighborhoods.reduce((obj, neighborhood) => {
        obj[neighborhood.ntaCode] = neighborhood;
        return obj;
    }, {});

    const ntaCodeToServicingGroup = {};
    const boroughToLocatedGroup = {};
    const nycGroups = [];
    const nyGroups = [];
    const nationalGroups = [];

    groups.forEach(group => {
        const servicingNeighborhoods = group.servicingNeighborhood;
        const regions = group.region;

        if (Array.isArray(servicingNeighborhoods) && servicingNeighborhoods.length) {
            servicingNeighborhoods.forEach((neighborhoodId) => {
                const neighborhood = idToNeighborHood[neighborhoodId];
                const ntaCode = neighborhood.ntaCode;

                if (ntaCodeToServicingGroup[ntaCode] != null) {
                    ntaCodeToServicingGroup[ntaCode].push(group);
                } else {
                    ntaCodeToServicingGroup[ntaCode] = [group];
                }
            });
        } else if (Array.isArray(regions) && regions.length) {
            regions.forEach((region) => {
                if (region === 'New York City') {
                    nycGroups.push(group);
                } else if (region === 'New York State') {
                    nyGroups.push(group);
                } else if (region === 'National') {
                    nationalGroups.push(group);
                } else {
                    if (boroughToLocatedGroup[region] != null) {
                        boroughToLocatedGroup[region].push(group);
                    } else {
                        boroughToLocatedGroup[region] = [group];
                    }
                }
            });
        }
    });

    const store = {
        idToNeighborHood,
        ntaCodeToNeighborhood,
        ntaCodeToServicingGroup,
        boroughToLocatedGroup,
        nycGroups,
        nyGroups,
        nationalGroups,
    };

    return store;
}

function groupHtml(group) {
    let groupName = group.name;
    if (group.website) {
        let website = group.website;
        if (group.website.indexOf('http') < 0) {
            website = `http://${website}`;
        }
        groupName = [
            `<a class="neighborhoodPopup__groupWebsite" href="${website}" target="_blank">`,
                groupName,
            '</a>'
        ].join('');
    }

    return `
        <div class="neighborhoodPopup__group">
            <h3 class="neighborhoodPopup__groupName">${groupName}</h3>
            ${group.missionShort
                ? `<span class="neighborhoodPopup__groupMissionShort">${group.missionShort}</span>`
                : '' }
        </div>
    `;
    // ${group.twitter
    //     ? `<span class="neighborhoodPopup__groupTwitter"><a href="https://twitter.com/${group.twitter.replace(/^@/, '')}">${group.twitter}</a></span>`
    //     : '' }
    // ${group.instagram
    //     ? `<span class="neighborhoodPopup__groupInstagram"><a href="https://instagram.com/${group.instagram.replace(/^@/, '')}">${group.instagram}</span>`
    //     : '' }
}

function transformNTAGeodata(ntaGeodata, store) {
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

    const allNeighborhoods = {
        type: 'FeatureCollection',
        features: [],
    };

    const neighborhoodsWithServicingLocalGroups = {
        type: 'FeatureCollection',
        features: [],
    };

    const neighborhoodsWithLocalGroups = {
        type: 'FeatureCollection',
        features: [],
    };

    const neighborhoodsWithoutLocalGroups = {
        type: 'FeatureCollection',
        features: [],
    };

    const features = ntaGeodata.features.forEach((feature) => {
        const ntaCode = feature.properties.ntacode;
        const neighborhood = store.ntaCodeToNeighborhood[ntaCode];

        if (neighborhood.hide) {
            return;
        }

        const groupsServicingNeighborhood = store.ntaCodeToServicingGroup[ntaCode];
        const boroughGroups = store.boroughToLocatedGroup[ntaCode];
        const { nycGroups, nyGroups, nationalGroups } = store;

        const hasServicingGroups = groupsServicingNeighborhood && groupsServicingNeighborhood.length;

        const html = [];

        if (hasServicingGroups) {
            html.push('<h2 class="neighborhoodPopup__sectionTitle neighborhoodPopup__sectionTitle-hasServicingGroups">Servicing this Neighborhood</h2>');
            groupsServicingNeighborhood.forEach((group) => html.push(groupHtml(group)));
        }

        if (boroughGroups && boroughGroups.length) {
            html.push('<h2 class="neighborhoodPopup__sectionTitle">Groups in this Borough</h2>');
            boroughGroups.forEach((group) => html.push(groupHtml(group)));
        }

        if (nycGroups.length) {
            html.push('<h2 class="neighborhoodPopup__sectionTitle">Groups in NYC</h2>');
            nycGroups.forEach((group) => html.push(groupHtml(group)));
        }

        if (nyGroups.length) {
            html.push('<h2 class="neighborhoodPopup__sectionTitle">Groups in NY State</h2>');
            nyGroups.forEach((group) => html.push(groupHtml(group)));
        }

        if (nationalGroups.length) {
            html.push('<h2 class="neighborhoodPopup__sectionTitle">National Groups</h2>');
            nationalGroups.forEach((group) => html.push(groupHtml(group)));
        }

        const outerHtml = `
            <div class="neighborhoodPopup">
                <h1 class="neighborhoodPopup__neighborhoodName">${neighborhood.name}</h1>
                ${html.join('')}
            </div>
        `.trim();

        const properties = Object.assign({}, feature.properties, {
            description: outerHtml,
        });

        feature.properties = properties;

        if (hasServicingGroups) {
            neighborhoodsWithServicingLocalGroups.features.push(feature);
        } else {
            neighborhoodsWithoutLocalGroups.features.push(feature);
        }

        allNeighborhoods.features.push(feature);
    });

    return {
        allNeighborhoods,
        neighborhoodsWithLocalGroups,
        neighborhoodsWithoutLocalGroups,
        neighborhoodsWithServicingLocalGroups,
    }
}

function loadGeodata() {
    return Promise.all([loadGroups(), loadNeighborhoods(), loadNTAGeodata()])
        .then(([groups, neighborhoods, ntaGeodata]) => {
            const store = createStore(groups, neighborhoods);
            const geodata = transformNTAGeodata(ntaGeodata, store);
            return geodata;
        });
}

document.addEventListener('DOMContentLoaded', () => {
    loadMapboxAccessToken()
        .then(token => { mapboxgl.accessToken = token; })
        .then(() => Promise.all([loadMap(), loadGeodata()]))
        .then(([map, geodata]) => configureMap(map, geodata));
});
