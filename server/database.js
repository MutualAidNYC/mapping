import sqlite3 from 'better-sqlite3';


// Helper methods for creating SQL statements.

const whereIn = (strings) => (array) => {
    const statement = [...strings];
    const endingParenthesis = statement.pop();
    return [
        ...statement,
        array.map(() => "?").join(','),
        endingParenthesis
    ]
    .join('')
    .trim();
};

const insertMany = (strings) => (pairs) => {
    const statement = [...strings];
    const endingSemicolon = statement.pop();
    return [
        ...statement,
        pairs.map(() => "(?, ?)").join(','),
        endingSemicolon
    ]
    .join('')
    .trim();
};


// SQL Statements

const CREATE_NEIGHBORHOODS_STATEMENTS = [
`
    CREATE TABLE IF NOT EXISTS neighborhoods (
        airtableId TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        ntaCode TEXT NOT NULL,
        boroName TEXT NOT NULL,
        hide INTEGER NOT NULL,
        hasLocalGroups INTEGER NOT NULL
    );
`,
`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_neighborhoods_ntaCode
    ON neighborhoods (ntaCode);
`
];
const FLAG_NEIGHBORHOODS_WITH_LOCAL_GROUPS_STATEMENT_TEMPLATE = whereIn`
    UPDATE neighborhoods SET hasLocalGroups = 1
    WHERE airtableId IN (${0});
`;
const UPSERT_NEIGHBORHOOD_STATEMENT = `
    INSERT INTO neighborhoods (
        airtableId,
        name,
        ntaCode,
        boroName,
        hide,
        hasLocalGroups
    ) VALUES (
        @airtableId,
        @name,
        @ntaCode,
        @boroName,
        @hide,
        @hasLocalGroups
    )
    ON CONFLICT(airtableId) DO UPDATE SET
        name=excluded.name,
        ntaCode=excluded.ntaCode,
        boroName=excluded.boroName,
        hide=excluded.hide,
        hasLocalGroups=excluded.hasLocalGroups
    ;
`;

const CREATE_GROUPS_STATEMENT = `
    CREATE TABLE IF NOT EXISTS groups (
        airtableId TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        missionShort TEXT,
        website TEXT,
        groupPhone TEXT,
        groupEmail TEXT,
        geoScope TEXT
    );
`;
const UPSERT_GROUP_STATEMENT = `
    INSERT INTO groups (
        airtableId,
        name,
        missionShort,
        website,
        groupPhone,
        groupEmail,
        geoScope
    ) VALUES (
        @airtableId,
        @name,
        @missionShort,
        @website,
        @groupPhone,
        @groupEmail,
        @geoScope
    )
    ON CONFLICT(airtableId) DO UPDATE SET
        name=excluded.name,
        missionShort=excluded.missionShort,
        website=excluded.website,
        groupPhone=excluded.groupPhone,
        groupEmail=excluded.groupEmail,
        geoScope=excluded.geoScope
    ;
`;

const CREATE_NEIGHBORHOODGROUPS_STATEMENTS = [
`
    CREATE TABLE IF NOT EXISTS neighborhood_groups (
        neighborhoodId TEXT NOT NULL,
        groupId TEXT NOT NULL,
        FOREIGN KEY(neighborhoodId) REFERENCES neighborhoods(airtableId) ON DELETE CASCADE,
        FOREIGN KEY(groupId) REFERENCES groups(airtableId) ON DELETE CASCADE
    );
`,
`
    -- Index on neighborhoodId first, groupId second, to query "groups by neighborhood".
    CREATE UNIQUE INDEX IF NOT EXISTS idx_neighborhoodgroups_neighborhoodId_groupId
    ON neighborhood_groups (neighborhoodId, groupId);
`
];
const INSERT_NEIGHBORHOODGROUPS_STATEMENT_TEMPLATE = insertMany`
    INSERT INTO neighborhood_groups (neighborhoodId, groupId)
    VALUES ${0};
`;


class Database {
    constructor(databasePath) {
        this.db = sqlite3(databasePath);
        this.configureDatabase()
        this.createTables();

        this.selectAllNeighborhoodsQuery = this.db.prepare('SELECT * FROM neighborhoods;');
        this.upsertNeighborhoodQuery = this.db.prepare(UPSERT_NEIGHBORHOOD_STATEMENT);

        this.selectAllGroupsQuery = this.db.prepare('SELECT * FROM groups;');
        this.upsertGroupQuery = this.db.prepare(UPSERT_GROUP_STATEMENT);

        this.deleteNeighborhoodGroups = this.db.prepare('DELETE FROM neighborhood_groups');

        this.updateData = this.db.transaction(({ neighborhoods, groups }) => {
            this.updateNeighborhoods(neighborhoods);
            this.updateGroups(groups);
            this.rebuildNeighborhoodGroups(groups);
        });
    }

    configureDatabase() {
        this.db.pragma('foreign_keys = ON;');
    }

    createTables() {
        const statements = [
            ...CREATE_NEIGHBORHOODS_STATEMENTS,
            CREATE_GROUPS_STATEMENT,
            ...CREATE_NEIGHBORHOODGROUPS_STATEMENTS,
        ];

        for (const statement of statements) {
            this.db.prepare(statement).run();
        }
    }

    update([neighborhoods, groups]) {
        console.log('Updating the database with records fetched from Airtable.');

        try {
            this.updateData({neighborhoods, groups});
        } catch (err) {
            console.error('There was an error updating the database with records fetched from Airtable. Aborting the update.', err);
        }
    }

    updateNeighborhoods(neighborhoods) {
        for (const neighborhood of neighborhoods) {
            this.upsertNeighborhoodQuery.run(neighborhood);
        }
    }

    updateGroups(groups) {
        for (const group of groups) {
            this.upsertGroupQuery.run(group);
        }
    }

    rebuildNeighborhoodGroups(groups) {
        const neighborhoodIdsToGroups = new Map();
        for (const group of groups) {
            if (group.neighborhoods.length === 0) {
                continue;
            }

            for (const neighborhoodId of group.neighborhoods) {
                const neighborhoodGroupIds = neighborhoodIdsToGroups.get(neighborhoodId) || new Set();
                neighborhoodGroupIds.add(group.airtableId);
                neighborhoodIdsToGroups.set(neighborhoodId, neighborhoodGroupIds);
            }
        }

        // Set `hasLocalGroups` on neighborhoods table,
        // for neighborhoods that have local groups.
        const neighborhoodIds = [...neighborhoodIdsToGroups.keys()];
        this.db.prepare(FLAG_NEIGHBORHOODS_WITH_LOCAL_GROUPS_STATEMENT_TEMPLATE(neighborhoodIds)).run(neighborhoodIds);

        // Delete existing many-to-many relationships between neighborhoods and groups.
        this.deleteNeighborhoodGroups.run();

        // Add many-to-many relationships between neighborhoods and groups.
        for (const [neighborhoodId, groupIds] of neighborhoodIdsToGroups.entries()) {
            const pairs = [...groupIds].map(groupId => [neighborhoodId, groupId]);
            this.db.prepare(INSERT_NEIGHBORHOODGROUPS_STATEMENT_TEMPLATE(pairs)).run(pairs.flat());
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
