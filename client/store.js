function createStore(neighborhoods) {
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

    const ntaCodeToGroups = {};
    const boroughToLocatedGroup = {};
    const nycGroups = [];
    const nyGroups = [];
    const nationalGroups = [];

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

    const store = {
        idToNeighborHood,
        ntaCodeToNeighborhood,
        ntaCodeToGroups,
        boroughToLocatedGroup,
        nycGroups,
        nyGroups,
        nationalGroups,
    };

    return store;
}

export default createStore;
