import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const DOMPurify = createDOMPurify(new JSDOM('').window)
const sanitize = DOMPurify.sanitize;


class AirtableFetcher {
    constructor(base) {
        this.base = base;
    }

    async fetch() {
        return Promise.all([
            this.fetchNeighborhoods(),
            this.fetchGroups(),
        ]);
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
                    ntaCode: sanitize(record.get('NTACode')),
                    // String
                    boroName: sanitize(record.get('BoroName')),
                    // Boolean
                    hide: Number(!!record.get('Hide')),
                    // Initial state that'll be updated in the database once all groups are processed.
                    // Is a number to match SQLite's INTEGER type used for booleans.
                    hasLocalGroups: 0,
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

    async fetchGroups() {
        console.log('Fetching Groups from Airtable');

        const groupsBase = await this.base('Groups').select({
            view: "Published Groups - map data source",
        });

        const groups = [];

        try {
            await groupsBase.eachPage((records, fetchNextPage) => {
                records.map((record) => ({
                    // String
                    airtableId: record.id,
                    // String
                    name: sanitize(record.get('Group Name')),
                    // String
                    missionShort: sanitize(record.get('Short Description')),
                    // String
                    website: sanitize(record.get('Website')),
                    // String
                    groupPhone: sanitize(record.get('Group Phone') || '').trim(),
                    // String
                    groupEmail: sanitize(record.get('Group Email') || '').trim(),
                    // Array of strings
                    geoscopes: (record.get('Geographical Scope') || []).map(b => sanitize(b)),
                    // Array of foreign keys to "Ref - Neighborhoods" table.
                    neighborhoods: (record.get('Neighborhoods') || []).map(n => sanitize(n)),
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
}

module.exports = AirtableFetcher;
