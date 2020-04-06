import sqlite3 from 'better-sqlite3';


const CREATE_GROUPS_STATEMENT = `
    CREATE TABLE IF NOT EXISTS groups (
        airtableId TEXT PRIMARY KEY,
        name TEXT,
        missionShort TEXT,
        website TEXT,
        groupPhone TEXT,
        groupEmail TEXT,
        region TEXT,
        servicingNeighborhood TEXT
    )
`;
const UPSERT_GROUP_STATEMENT = `
    INSERT INTO groups (
        airtableId,
        name,
        missionShort,
        website,
        groupPhone,
        groupEmail,
        region,
        servicingNeighborhood
    ) VALUES (
        @airtableId,
        @name,
        @missionShort,
        @website,
        @groupPhone,
        @groupEmail,
        @region,
        @servicingNeighborhood
    )
    ON CONFLICT(airtableId) DO UPDATE SET
        name=excluded.name,
        missionShort=excluded.missionShort,
        website=excluded.website,
        groupPhone=excluded.groupPhone,
        groupEmail=excluded.groupEmail,
        region=excluded.region,
        servicingNeighborhood=excluded.servicingNeighborhood
    ;
`;

const CREATE_NEIGHBORHOODS_STATEMENT = `
    CREATE TABLE IF NOT EXISTS neighborhoods (
        airtableId TEXT PRIMARY KEY,
        name TEXT,
        ntaCode TEXT,
        boroName TEXT,
        hide INTEGER
    )
`;
const UPSERT_NEIGHBORHOOD_STATEMENT = `
    INSERT INTO neighborhoods (
        airtableId,
        name,
        ntaCode,
        boroName,
        hide
    ) VALUES (
        @airtableId,
        @name,
        @ntaCode,
        @boroName,
        @hide
    )
    ON CONFLICT(airtableId) DO UPDATE SET
        name=excluded.name,
        ntaCode=excluded.ntaCode,
        boroName=excluded.boroName,
        hide=excluded.hide
    ;
`;



class Database {
    constructor(databasePath) {
        this.db = sqlite3(databasePath);
        this.createTables();

        this.selectAllGroupsQuery = this.db.prepare('SELECT * FROM groups;');
        this.upsertGroupQuery = this.db.prepare(UPSERT_GROUP_STATEMENT);

        this.selectAllNeighborhoodsQuery = this.db.prepare('SELECT * FROM neighborhoods;');
        this.upsertNeighborhoodQuery = this.db.prepare(UPSERT_NEIGHBORHOOD_STATEMENT);

        this.updateData = this.db.transaction(([groups, neighborhoods]) => {
            groups.forEach((group) => this.upsertGroupQuery.run(group));
            neighborhoods.forEach((neighborhood) => this.upsertNeighborhoodQuery.run(neighborhood));
        });
    }

    createTables() {
        this.db.prepare(CREATE_GROUPS_STATEMENT).run();
        this.db.prepare(CREATE_NEIGHBORHOODS_STATEMENT).run();
    }

    update([groups, neighborhoods]) {
        console.log('Updating the database with records fetched from Airtable.');

        try {
            this.updateData([groups, neighborhoods]);
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

    close() {
        console.log('Closing database.');
        this.db.close();
    }
}

module.exports = Database;
