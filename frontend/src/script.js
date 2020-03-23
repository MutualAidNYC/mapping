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
            zoom: 11,
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

    // When a click event occurs on a feature in the places layer, open a popup at the
    // location of the feature, with description HTML from its properties.
    map.on('click', code, function(e) {
        const description = e.features[0].properties.description;

        new mapboxgl.Popup()
            .setMaxWidth('')
            .setLngLat(e.lngLat)
            .setHTML(description)
            .addTo(map);
    });

    // Change the cursor to a pointer when the mouse is over the places layer.
    map.on('mouseenter', code, function() {
        map.getCanvas().style.cursor = 'pointer';
    });

    // Change it back to a pointer when it leaves.
    map.on('mouseleave', code, function() {
        map.getCanvas().style.cursor = '';
    });
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
    return `
        <div class="neighborhoodPopup__group">
            <h3 class="neighborhoodPopup__groupName">${group.name}</h3>
            ${group.missionShort
                ?  '<span class="neighborhoodPopup__groupMissionShort">' + group.missionShort + '</span>'
                    : '' }
            ${group.website
                ?  '<a class="neighborhoodPopup__groupWebsite"' + 'href="' + group.website + '"' + '>' + group.website + '</a></span>'
                    : '' }
            ${group.twitter
                ?  '<span class="neighborhoodPopup__groupTwitter">' + group.twitter + '</span>'
                    : '' }
            ${group.instagram
                ?  '<span class="neighborhoodPopup__groupInstagram">' + group.instagram + '</span>'
                    : '' }
        </div>
    `;
}

function amendNTAGeodata(ntaGeodata, store) {
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
    const features = ntaGeodata.features.map((feature) => {
        const ntaCode = feature.properties.ntacode;
        const neighborhood = store.ntaCodeToNeighborhood[ntaCode];
        const groupsServicingNeighborhood = store.ntaCodeToServicingGroup[ntaCode];
        const groupsLocatedInNeighborhood = store.ntaCodeToLocatedGroup[ntaCode];
        const boroughGroups = store.boroughToLocatedGroup[ntaCode];
        const { nycGroups, nyGroups } = store;

        const html = [];

        if (groupsServicingNeighborhood && groupsServicingNeighborhood.length) {
            html.push('<h2 class="neighborhoodPopup__sectionTitle">Servicing this Neighborhood</h2>');
            groupsServicingNeighborhood.forEach((group) => html.push(groupHtml(group)));
        }

        if (groupsLocatedInNeighborhood && groupsLocatedInNeighborhood.length) {
            html.push('<h2 class="neighborhoodPopup__sectionTitle">Located in this Neighborhood</h2>');
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
        return feature;
    });

    return Object.assign({}, ntaGeodata, {features});
}

document.addEventListener('DOMContentLoaded', () => {
    loadMapboxAccessToken()
        .then(token => { mapboxgl.accessToken = token; })
        .then(() => Promise.all([loadGroups(), loadNeighborhoods(), loadCommunities(), loadNTAGeodata()]))
        .then(([groups, neighborhoods, communities, ntaGeodata]) => {
            const store = createStore(groups, neighborhoods);
            const geojson = amendNTAGeodata(ntaGeodata, store);
            return geojson;
        })
        .then((geojson) => Promise.all([loadMap(), geojson]))
        .then(([map, geojson]) => configureMap(map, geojson));
});
