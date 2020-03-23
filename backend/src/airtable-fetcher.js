var createDOMPurify = require('dompurify');
var JSDOM = require('jsdom').JSDOM;

const DOMPurify = createDOMPurify(new JSDOM('').window)
const sanitize = DOMPurify.sanitize;


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
                    name: sanitize(record.get('Name')),
                    // String
                    missionShort: sanitize(record.get('Mission (short)')),
                    // String
                    website: sanitize(record.get('Website')),
                    // String
                    campaignWebsite: sanitize(record.get('Link to campaign website')),
                    // String
                    publicEmail: sanitize(record.get('Public Email')),
                    // String
                    twitter: sanitize(record.get('Twitter')),
                    // String
                    instagram: sanitize(record.get('Instagram')),
                    // Array of strings
                    region: JSON.stringify((record.get('Borough/Region') || []).map(b => sanitize(b))),
                    // Array of foreign keys to "Ref - Neighborhood" table.
                    neighborhood: JSON.stringify((record.get('Neighborhood') || []).map(n => sanitize(n))),
                    // Array of foreign keys to "Ref - Neighborhood" table.
                    servicingNeighborhood: JSON.stringify((record.get('Neighborhood You Provide Service') || []).map(n => sanitize(n))),
                    // Array of foreign keys to "Ref - Most Impacted Groups" table.
                    communitiesServed: JSON.stringify((record.get('Communities Served') || []).map(c => sanitize(c))),
                    // Array of foreign keys to "Ref - Most Impacted Groups" table.
                    advocacyIssues: JSON.stringify((record.get('Advocacy Issues') || []).map(a => sanitize(a))),
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
                    name: sanitize(record.get('Neighborhood Name')),
                    // String
                    ntaName: sanitize(record.get('NTA Name')),
                    // String
                    ntaCode: sanitize(record.get('NTACode')),
                    // String
                    state: sanitize(record.get('State')),
                    // String
                    address: sanitize(record.get('Address')),
                    // String
                    geocode: sanitize(record.get('GeoCode')),
                    // Integer
                    countyfips: Number(sanitize(record.get('CountyFIPS'))),
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
                    name: sanitize(record.get('Name')),
                    // Integer
                    displayOrder: Number(sanitize(record.get('Order'))),
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
