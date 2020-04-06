function createStore(groups, neighborhoods) {
    // Support breaking down group list into:
    //
    // Groups in this Neighborhood
    // Groups in this Borough
    // Groups in NYC
    // Groups in New York State
    // National Groups

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

export default createStore;
