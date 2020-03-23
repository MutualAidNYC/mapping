class AirtableFetcher {
    constructor(base) {
        this.base = base;
    }

    async fetch() {
        return Promise.all([
            this.fetchGroups(),
            this.fetchNeighborhoods(),
            this.fetchCommunities(),
        ]);
    }

    async fetchGroups() {
        console.log('Fetching Groups from Airtable');

        const groupsBase = await this.base('Groups').select({
            view: "Grid view",
            filterByFormula: "Published = TRUE()"
        });

        const groups = [];

        try {
            await groupsBase.eachPage((records, fetchNextPage) => {
                records.map((record) => ({
                    // String
                    airtableId: record.id,
                    // String
                    name: record.get('Name'),
                    // String
                    missionShort: record.get('Mission (short)'),
                    // String
                    website: record.get('Website'),
                    // String
                    campaignWebsite: record.get('Link to campaign website'),
                    // String
                    publicEmail: record.get('Public Email'),
                    // String
                    twitter: record.get('Twitter'),
                    // String
                    instagram: record.get('Instagram'),
                    // Array of strings
                    region: JSON.stringify(record.get('Borough/Region')),
                    // Array of foreign keys to "Ref - Neighborhood" table.
                    neighborhood: JSON.stringify(record.get('Neighborhood')),
                    // Array of foreign keys to "Ref - Neighborhood" table.
                    servicingNeighborhood: JSON.stringify(record.get('Neighborhood You Provide Service')),
                    // Array of foreign keys to "Ref - Most Impacted Groups" table.
                    communitiesServed: JSON.stringify(record.get('Communities Served')),
                    // Array of foreign keys to "Ref - Most Impacted Groups" table.
                    advocacyIssues: JSON.stringify(record.get('Advocacy Issues')),
                }))
                .forEach(record => groups.push(record));

                fetchNextPage();
            });
        } catch(err) {
            console.error(err);
            throw err;
        }

        return groups;
    }

    async fetchNeighborhoods() {
        console.log('Fetching Neighborhoods from Airtable');

        const neighborhoodsBase = await this.base('Ref - Neighborhoods').select({
            view: "Grid view"
        });

        const neighborhoods = [];

        try {
            await neighborhoodsBase.eachPage((records, fetchNextPage) => {
                records.map((record) => ({
                    // String
                    airtableId: record.id,
                    // String
                    name: record.get('Neighborhood Name'),
                    // String
                    ntaName: record.get('NTA Name'),
                    // String
                    ntaCode: record.get('NTACode'),
                    // String
                    state: record.get('State'),
                    // String
                    address: record.get('Address'),
                    // String
                    geocode: record.get('GeoCode'),
                    // Integer
                    countyfips: Number(record.get('CountyFIPS')),
                }))
                .forEach(record => neighborhoods.push(record));

                fetchNextPage();
            });
        } catch(err) {
            console.error(err);
            throw err;
        }

        return neighborhoods;
    }

    async fetchCommunities() {
        console.log('Fetching Communities from Airtable');

        const communitiesBase = await this.base('Ref - Most Impacted Groups').select({
            view: "Grid view"
        });

        const communities = [];

        try {
            await communitiesBase.eachPage((records, fetchNextPage) => {
                records.map((record) => ({
                    // String
                    airtableId: record.id,
                    // String
                    name: record.get('Name'),
                    // Integer
                    displayOrder: Number(record.get('Order')),
                }))
                .forEach(record => communities.push(record));

                fetchNextPage();
            });
        } catch(err) {
            console.error(err);
            throw err;
        }

        return communities;
    }
}

module.exports = AirtableFetcher;
