const sqlite3 = require('better-sqlite3');


const CREATE_GROUPS_STATEMENT = `
    CREATE TABLE IF NOT EXISTS groups (
        airtableId TEXT PRIMARY KEY,
        name TEXT,
        missionShort TEXT,
        website TEXT,
        campaignWebsite TEXT,
        publicEmail TEXT,
        twitter TEXT,
        instagram TEXT,
        region TEXT,
        neighborhood TEXT,
        servicingNeighborhood TEXT,
        communitiesServed TEXT,
        advocacyIssues TEXT
    )
`;
const UPSERT_GROUPS_STATEMENT = `
    INSERT INTO groups (
        airtableId,
        name,
        missionShort,
        website,
        campaignWebsite,
        publicEmail,
        twitter,
        instagram,
        region,
        neighborhood,
        servicingNeighborhood,
        communitiesServed,
        advocacyIssues
    ) VALUES (
        @airtableId,
        @name,
        @missionShort,
        @website,
        @campaignWebsite,
        @publicEmail,
        @twitter,
        @instagram,
        @region,
        @neighborhood,
        @servicingNeighborhood,
        @communitiesServed,
        @advocacyIssues
    )
    ON CONFLICT(airtableId) DO UPDATE SET
        name=excluded.name,
        missionShort=excluded.missionShort,
        website=excluded.website,
        campaignWebsite=excluded.campaignWebsite,
        publicEmail=excluded.publicEmail,
        twitter=excluded.twitter,
        instagram=excluded.instagram,
        region=excluded.region,
        neighborhood=excluded.neighborhood,
        servicingNeighborhood=excluded.servicingNeighborhood,
        communitiesServed=excluded.communitiesServed,
        advocacyIssues=excluded.advocacyIssues
    ;
`;

const CREATE_NEIGHBORHOODS_STATEMENT = `
    CREATE TABLE IF NOT EXISTS neighborhoods (
        airtableId TEXT PRIMARY KEY,
        name TEXT,
        ntaName TEXT,
        ntaCode TEXT,
        state TEXT,
        address TEXT,
        geocode TEXT,
        countyfips INTEGER
    )
`;
const UPSERT_NEIGHBORHOODS_STATEMENT = `
    INSERT INTO neighborhoods (
        airtableId,
        name,
        ntaName,
        ntaCode,
        state,
        address,
        geocode,
        countyfips
    ) VALUES (
        @airtableId,
        @name,
        @ntaName,
        @ntaCode,
        @state,
        @address,
        @geocode,
        @countyfips
    )
    ON CONFLICT(airtableId) DO UPDATE SET
        name=excluded.name,
        ntaName=excluded.ntaName,
        ntaCode=excluded.ntaCode,
        state=excluded.state,
        address=excluded.address,
        geocode=excluded.geocode,
        countyfips=excluded.countyfips
    ;
`

const CREATE_COMMUNITIES_STATEMENT = `
    CREATE TABLE IF NOT EXISTS communities (
        airtableId TEXT PRIMARY KEY,
        name TEXT,
        displayOrder INTEGER
    )
`;
const UPSERT_COMMUNITIES_STATEMENT = `
    INSERT INTO communities (
        airtableId,
        name,
        displayOrder
    ) VALUES (
        @airtableId,
        @name,
        @displayOrder
    )
    ON CONFLICT(airtableId) DO UPDATE SET
        name=excluded.name,
        displayOrder=excluded.displayOrder
    ;
`


class Database {
    constructor(databasePath) {
        this.db = sqlite3(databasePath);
        this.createTables();

        this.selectAllGroupsQuery = this.db.prepare('SELECT * FROM groups;');
        this.upsertGroupsQuery = this.db.prepare(UPSERT_GROUPS_STATEMENT);

        this.selectAllNeighborhoodsQuery = this.db.prepare('SELECT * FROM neighborhoods;');
        this.upsertNeighborhoodsQuery = this.db.prepare(UPSERT_NEIGHBORHOODS_STATEMENT);

        this.selectAllCommunitiesQuery = this.db.prepare('SELECT * FROM communities;');
        this.upsertCommunitiesQuery = this.db.prepare(UPSERT_COMMUNITIES_STATEMENT);

        this.updateData = this.db.transaction(([groups, neighborhoods, communities]) => {
            groups.forEach((group) => this.upsertGroupsQuery.run(group));
            neighborhoods.forEach((neighborhood) => this.upsertNeighborhoodsQuery.run(neighborhood));
            communities.forEach((community) => this.upsertCommunitiesQuery.run(community));
        });
    }

    createTables() {
        this.db.prepare(CREATE_GROUPS_STATEMENT).run();
        this.db.prepare(CREATE_NEIGHBORHOODS_STATEMENT).run();
        this.db.prepare(CREATE_COMMUNITIES_STATEMENT).run();
    }

    update([groups, neighborhoods, communities]) {
        console.log('Updating the database with records fetched from Airtable.');

        try {
            this.updateData([groups, neighborhoods, communities]);
        } catch (err) {
            console.error('There was an error updating the database with records fetched from Airtable. Aborting the update.', err);
        }
    }

    allGroups() {
        return this.selectAllGroupsQuery.all();
    }

    allNeighborhoods() {
        return this.selectAllNeighborhoodsQuery.all();
    }

    allCommunities() {
        return this.selectAllCommunitiesQuery.all();
    }

    close() {
        console.log('Closing database.');
        this.db.close();
    }
}

module.exports = Database;
