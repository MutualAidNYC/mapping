function loadMapboxAccessToken() {
    return fetch('/mapbox-access-token')
        .then(response => response.text());
}

function loadMap() {
    return new Promise((resolve, reject) => {
        const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/light-v10',
            center: [-73.97, 40.77427],
            zoom: 11,
        });

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

    map.addLayer({
        id: unservicedNeighborhoodsSourceId,
        type: 'fill',
        source: unservicedNeighborhoodsSourceId,
        paint: {
            'fill-color': '#59A6E5',
            'fill-opacity': 1,
        }
    });

    map.addLayer({
        id: neighborhoodsWithLocalGroupsSourceId,
        type: 'fill',
        source: neighborhoodsWithLocalGroupsSourceId,
        paint: {
            'fill-color': '#A27CEF',
            'fill-opacity': 1,
        }
    });

    map.addLayer({
        id: servicedNeighborhoodsSourceId,
        type: 'fill',
        source: servicedNeighborhoodsSourceId,
        paint: {
            'fill-color': '#43C59E',
            'fill-opacity': 1,
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
            neighborhood: JSON.parse(group.neighborhood),
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
    const ntaCodeToLocatedGroup = {};
    const boroughToLocatedGroup = {};
    const nycGroups = [];
    const nyGroups = [];

    groups.forEach(group => {
        const servicingNeighborhoods = group.servicingNeighborhood;
        const locatedNeighborhoods = group.neighborhood;
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
        } else if (Array.isArray(locatedNeighborhoods) && locatedNeighborhoods.length) {
            locatedNeighborhoods.forEach((neighborhoodId) => {
                const neighborhood = idToNeighborHood[neighborhoodId];
                const ntaCode = neighborhood.ntaCode;

                if (ntaCodeToLocatedGroup[ntaCode] != null) {
                    ntaCodeToLocatedGroup[ntaCode].push(group);
                } else {
                    ntaCodeToLocatedGroup[ntaCode] = [group];
                }
            });
        } else if (Array.isArray(regions) && regions.length) {
            regions.forEach((region) => {
                if (region === 'Citywide') {
                    nycGroups.push(group);
                } else if (region === 'Statewide') {
                    nyGroups.push(group);
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
        ntaCodeToLocatedGroup,
        boroughToLocatedGroup,
        nycGroups,
        nyGroups,
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
            `<a class="neighborhoodPopup__groupWebsite" href="${website}">`,
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
        const groupsServicingNeighborhood = store.ntaCodeToServicingGroup[ntaCode];
        const groupsLocatedInNeighborhood = store.ntaCodeToLocatedGroup[ntaCode];
        const boroughGroups = store.boroughToLocatedGroup[ntaCode];
        const { nycGroups, nyGroups } = store;

        const hasServicingGroups = groupsServicingNeighborhood && groupsServicingNeighborhood.length;
        const hasLocalGroups = groupsLocatedInNeighborhood && groupsLocatedInNeighborhood.length;

        const html = [];

        if (hasServicingGroups) {
            html.push('<h2 class="neighborhoodPopup__sectionTitle neighborhoodPopup__sectionTitle-hasServicingGroups">Servicing this Neighborhood</h2>');
            groupsServicingNeighborhood.forEach((group) => html.push(groupHtml(group)));
        }

        if (hasLocalGroups) {
            html.push('<h2 class="neighborhoodPopup__sectionTitle neighborhoodPopup__sectionTitle-hasLocalGroups">Located in this Neighborhood</h2>');
            groupsLocatedInNeighborhood.forEach((group) => html.push(groupHtml(group)));
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
        } else if (hasLocalGroups) {
            neighborhoodsWithLocalGroups.features.push(feature);
        } else {
            neighborhoodsWithoutLocalGroups.features.push(feature);
        }
    });

    return {
        allNeighborhoods: ntaGeodata,
        neighborhoodsWithLocalGroups,
        neighborhoodsWithoutLocalGroups,
        neighborhoodsWithServicingLocalGroups,
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadMapboxAccessToken()
        .then(token => { mapboxgl.accessToken = token; })
        .then(() => Promise.all([loadGroups(), loadNeighborhoods(), loadCommunities(), loadNTAGeodata()]))
        .then(([groups, neighborhoods, communities, ntaGeodata]) => {
            const store = createStore(groups, neighborhoods);
            const geodata = transformNTAGeodata(ntaGeodata, store);
            return geodata;
        })
        .then((geodata) => Promise.all([loadMap(), geodata]))
        .then(([map, geodata]) => configureMap(map, geodata));
});
