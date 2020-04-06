import sqlite3 from 'better-sqlite3';


const CREATE_GROUPS_STATEMENT = `
    CREATE TABLE IF NOT EXISTS groups (
        airtableId TEXT PRIMARY KEY,
        name TEXT,
        missionShort TEXT,
        website TEXT,
        campaignWebsite TEXT,
        groupPhone TEXT,
        groupEmail TEXT,
        twitter TEXT,
        instagram TEXT,
        region TEXT,
        servicingNeighborhood TEXT,
        communitiesServed TEXT,
        advocacyIssues TEXT
    )
`;
const UPSERT_GROUP_STATEMENT = `
    INSERT INTO groups (
        airtableId,
        name,
        missionShort,
        website,
        campaignWebsite,
        groupPhone,
        groupEmail,
        twitter,
        instagram,
        region,
        servicingNeighborhood,
        communitiesServed,
        advocacyIssues
    ) VALUES (
        @airtableId,
        @name,
        @missionShort,
        @website,
        @campaignWebsite,
        @groupPhone,
        @groupEmail,
        @twitter,
        @instagram,
        @region,
        @servicingNeighborhood,
        @communitiesServed,
        @advocacyIssues
    )
    ON CONFLICT(airtableId) DO UPDATE SET
        name=excluded.name,
        missionShort=excluded.missionShort,
        website=excluded.website,
        campaignWebsite=excluded.campaignWebsite,
        groupPhone=excluded.groupPhone,
        groupEmail=excluded.groupEmail,
        twitter=excluded.twitter,
        instagram=excluded.instagram,
        region=excluded.region,
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
        boroName TEXT,
        state TEXT,
        address TEXT,
        geocode TEXT,
        countyfips INTEGER,
        hide INTEGER
    )
`;
const UPSERT_NEIGHBORHOOD_STATEMENT = `
    INSERT INTO neighborhoods (
        airtableId,
        name,
        ntaName,
        ntaCode,
        boroName,
        state,
        address,
        geocode,
        countyfips,
        hide
    ) VALUES (
        @airtableId,
        @name,
        @ntaName,
        @ntaCode,
        @boroName,
        @state,
        @address,
        @geocode,
        @countyfips,
        @hide
    )
    ON CONFLICT(airtableId) DO UPDATE SET
        name=excluded.name,
        ntaName=excluded.ntaName,
        ntaCode=excluded.ntaCode,
        boroName=excluded.boroName,
        state=excluded.state,
        address=excluded.address,
        geocode=excluded.geocode,
        countyfips=excluded.countyfips,
        hide=excluded.hide
    ;
`

const CREATE_COMMUNITIES_STATEMENT = `
    CREATE TABLE IF NOT EXISTS communities (
        airtableId TEXT PRIMARY KEY,
        name TEXT,
        displayOrder INTEGER
    )
`;
const UPSERT_COMMUNITY_STATEMENT = `
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
        this.upsertGroupQuery = this.db.prepare(UPSERT_GROUP_STATEMENT);

        this.selectAllNeighborhoodsQuery = this.db.prepare('SELECT * FROM neighborhoods;');
        this.upsertNeighborhoodQuery = this.db.prepare(UPSERT_NEIGHBORHOOD_STATEMENT);

        this.selectAllCommunitiesQuery = this.db.prepare('SELECT * FROM communities;');
        this.upsertCommunityQuery = this.db.prepare(UPSERT_COMMUNITY_STATEMENT);

        this.updateData = this.db.transaction(([groups, neighborhoods, communities]) => {
            groups.forEach((group) => this.upsertGroupQuery.run(group));
            neighborhoods.forEach((neighborhood) => this.upsertNeighborhoodQuery.run(neighborhood));
            communities.forEach((community) => this.upsertCommunityQuery.run(community));
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
