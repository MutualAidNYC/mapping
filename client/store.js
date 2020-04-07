class Store {

    constructor() {
        this.neighborhoods = [];
        this.neighborhoodsById = {};
        this.neighborhoodsByNtaCode = {};
        this.geodata = null;

        // Local groups data.
        this.groupsByNeighborhoodId = {};
        this.groupsByBoroName = {};

        // Nonlocal groups data.
        this.nonlocalGroupsFetched = false;
        this.groupsInNyc = [];
        this.groupsInNys = [];
        this.nationalGroups = [];
    }

    async fetchData() {
        const [neighborhoods, geodata] = await Promise.all([this._fetchNeighborhoods(), this._fetchGeodata()]);
        this.neighborhoods = neighborhoods;
        this.neighborhoodsById = neighborhoods.reduce((memo, neighborhood) => {
            memo[neighborhood.id] = neighborhood;
            return memo;
        }, {});
        this.neighborhoodsByNtaCode = neighborhoods.reduce((memo, neighborhood) => {
            memo[neighborhood.ntaCode] = neighborhood;
            return memo;
        }, {});
        this.geodata = geodata;
    }

    async fetchGroupsInNeighborhood(ntaCode) {
        const neighborhood = this.neighborhoodsByNtaCode[ntaCode];
        const neighborhoodId = neighborhood.airtableId;

        if (this.groupsByNeighborhoodId[neighborhoodId] == null) {
            const [localGroupsResponse] = await Promise.all([
                fetch(`/data/neighborhoods/${neighborhoodId}/groups`),
                // Lazy-load all nonlocal groups as well.
                this._fetchNonlocalGroups()
            ])
            const json = await localGroupsResponse.json();
            const groups = json.map(this._transformFetchedGroup);

            this.groupsByNeighborhoodId[neighborhoodId] = groups;
        }

        return this.groupsByNeighborhoodId[neighborhoodId];
    }

    async fetchGroupsByBoroName(boroName) {
        if (this.groupsByBoroName[boroName] == null) {
            const response = await fetch(`/data/groups?boroName=${boroName}`);
            const json = await response.json();
            this.groupsByBoroName[boroName] = json.map(this._transformFetchedGroup);
        }

        return this.groupsByBoroName[boroName];
    }

    allNeighborhoods() {
        return this._filterGeodata((neighborhood) => {
            return !neighborhood.hide;
        });
    }

    neighborhoodsWithLocalGroups() {
        return this._filterGeodata((neighborhood) => {
            return !neighborhood.hide && !!neighborhood.hasLocalGroups;
        });
    }

    neighborhoodsWithoutLocalGroups() {
        return this._filterGeodata((neighborhood) => {
            return !neighborhood.hide && !neighborhood.hasLocalGroups;
        });
    }

    // NOTE: This uses the local store,
    //       and so doesn't fetch the neighborhood from the server.
    neighborhoodByNtaCode(ntaCode) {
        return this.neighborhoodsByNtaCode[ntaCode];
    }

    async _fetchNeighborhoods() {
        const response = await fetch('/data/neighborhoods');
        const neighborhoods = await response.json();
        return neighborhoods;
    }

    async _fetchNonlocalGroups() {
        if (!this.nonlocalGroupsFetched) {
            const response = await fetch(`/data/groups?nonlocal=true`);
            const json = await response.json();

            const {
                groupsInNyc,
                groupsInNys,
                nationalGroups,
            } = json;

            this.groupsInNyc = groupsInNyc.map(this._transformFetchedGroup);
            this.groupsInNyc = groupsInNys.map(this._transformFetchedGroup);
            this.nationalGroups = nationalGroups.map(this._transformFetchedGroup);
            this.nonlocalGroupsFetched = true;
        }

        const {
            groupsInNyc,
            groupsInNys,
            nationalGroups,
        } = this;

        return {
            groupsInNyc,
            groupsInNys,
            nationalGroups,
        };
    }

    _transformFetchedGroup(group) {
        return Object.assign({}, group, {
            // Array of strings
            geoScope: JSON.parse(group.geoScope),
        });
    }

    async _fetchGeodata() {
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
        const response = await fetch('/data/nta.geojson');
        const geodata = await response.json();
        return geodata;
    }

    _filterGeodata(filterFn) {
        return {
            type: 'FeatureCollection',
            features: this.geodata.features.filter((feature) => {
                const neighborhood = this.neighborhoodsByNtaCode[feature.properties.ntacode];
                return filterFn(neighborhood);
            }),
        };
    }

    // _breakdownGroup() {
        // Support breaking down group list into:
        //
        // Groups in this Neighborhood
        // Groups in this Borough
        // Groups in NYC
        // Groups in New York State
        // National Groups

        // const ntaCodeToGroups = {};
        // const boroughToLocatedGroup = {};

        // groups.forEach(group => {
        //     const neighborhoods = group.neighborhoods;
        //     const regions = group.region;

        //     if (Array.isArray(neighborhoods) && neighborhoods.length) {
        //         neighborhoods.forEach((neighborhoodId) => {
        //             const neighborhood = idToNeighborHood[neighborhoodId];
        //             const ntaCode = neighborhood.ntaCode;

        //             if (ntaCodeToGroups[ntaCode] != null) {
        //                 ntaCodeToGroups[ntaCode].push(group);
        //             } else {
        //                 ntaCodeToGroups[ntaCode] = [group];
        //             }
        //         });
        //     } else if (Array.isArray(regions) && regions.length) {
        //         regions.forEach((region) => {
        //             if (region === 'New York City') {
        //                 nycGroups.push(group);
        //             } else if (region === 'New York State') {
        //                 nyGroups.push(group);
        //             } else if (region === 'National') {
        //                 nationalGroups.push(group);
        //             } else {
        //                 if (boroughToLocatedGroup[region] != null) {
        //                     boroughToLocatedGroup[region].push(group);
        //                 } else {
        //                     boroughToLocatedGroup[region] = [group];
        //                 }
        //             }
        //         });
        //     }
        // });

        // const store = {
        //     idToNeighborHood,
        //     ntaCodeToNeighborhood,
        //     ntaCodeToGroups,
        //     boroughToLocatedGroup,
        //     nycGroups,
        //     nyGroups,
        //     nationalGroups,
        // };

        // return store;
    // }

}

export default Store;
