import sqlite3 from 'better-sqlite3';


// Helper methods for creating SQL statements.

const whereIn = (strings) => (array) => {
    const statement = [...strings];
    const statementEnd = statement.pop();
    return [
        ...statement,
        array.map(() => "?").join(','),
        statementEnd
    ]
    .join('')
    .trim();
};

const insertMany = (strings, columnCount) => (tuples) => {
    const statement = [...strings];
    const statementEnd = statement.pop();
    return [
        ...statement,
        tuples.map(() => `(${'?'.repeat(columnCount).split('').join(',')})`).join(','),
        statementEnd
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

const CREATE_GEOSCOPES_STATEMENTS =
[
`
    CREATE TABLE IF NOT EXISTS geoscopes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
    );
`,
`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_geoscopes_name
    ON geoscopes(name);
`
];
const UPSERT_GEOSCOPE_STATEMENT_TEMPLATE = insertMany`
    INSERT OR IGNORE INTO geoscopes ( name ) VALUES ${1};
`;

const CREATE_GROUPS_STATEMENT = `
    CREATE TABLE IF NOT EXISTS groups (
        airtableId TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        missionShort TEXT,
        website TEXT,
        groupPhone TEXT,
        groupEmail TEXT,
        hasLocalNeighborhoods INTEGER NOT NULL
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
        hasLocalNeighborhoods
    ) VALUES (
        @airtableId,
        @name,
        @missionShort,
        @website,
        @groupPhone,
        @groupEmail,
        @hasLocalNeighborhoods
    )
    ON CONFLICT(airtableId) DO UPDATE SET
        name=excluded.name,
        missionShort=excluded.missionShort,
        website=excluded.website,
        groupPhone=excluded.groupPhone,
        groupEmail=excluded.groupEmail,
        hasLocalNeighborhoods=excluded.hasLocalNeighborhoods
    ;
`;

const CREATE_GEOSCOPEGROUPS_STATEMENTS = [
`
    CREATE TABLE IF NOT EXISTS geoscope_groups (
        geoscopeId INTEGER NOT NULL,
        groupId TEXT NOT NULL,
        FOREIGN KEY(geoscopeId) REFERENCES geoscopes(id) ON DELETE CASCADE,
        FOREIGN KEY(groupId) REFERENCES groups(airtableId) ON DELETE CASCADE
    );
`,
`
    -- Index on geoscopeId first, groupId second, to query "groups by geoscope".
    CREATE UNIQUE INDEX IF NOT EXISTS idx_geoscopegroups_geoscopeId_groupId
    ON geoscope_groups (geoscopeId, groupId);
`
];
const INSERT_GEOSCOPEGROUPS_STATEMENT_TEMPLATE = insertMany`
    INSERT INTO geoscope_groups (geoscopeId, groupId)
    VALUES ${2};
`;
const SELECT_ALL_GROUPS_IN_GEOSCOPES_STATEMENT_TEMPLATE = whereIn`
    SELECT
        geoscopes.name as geoscopeName,
        groups.*
    FROM groups
    INNER JOIN geoscope_groups
        ON geoscope_groups.groupId = groups.airtableId
    INNER JOIN geoscopes
        ON geoscope_groups.geoscopeId = geoscopes.id
    WHERE geoscopes.name IN (${0})
    ORDER BY geoscopes.name;
`;
const SELECT_ALL_GROUPS_IN_BORO_STATEMENT = `
    SELECT groups.*, geoscopes.name as geoscopeName
    FROM groups
    INNER JOIN geoscope_groups
        ON groups.airtableId = geoscope_groups.groupId
    INNER JOIN geoscopes
        ON geoscopes.id = geoscope_groups.geoscopeId
    WHERE geoscopes.name = ?;
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
    VALUES ${2};
`;

const SELECT_ALL_GROUPS_IN_NEIGHBORHOOD_STATEMENT = `
    SELECT * FROM groups INNER JOIN neighborhood_groups
    ON groups.airtableId = neighborhood_groups.groupId
    WHERE neighborhood_groups.neighborhoodId = ?;
`;


class Database {
    constructor(databasePath) {
        this.db = sqlite3(databasePath);
        this.configureDatabase()
        this.createTables();

        this.selectAllNeighborhoodsQuery = this.db.prepare('SELECT * FROM neighborhoods;');
        this.upsertNeighborhoodQuery = this.db.prepare(UPSERT_NEIGHBORHOOD_STATEMENT);

        this.selectAllGroupsQuery = this.db.prepare('SELECT * FROM groups;');
        this.selectAllGroupsInNeighborhoodQuery = this.db.prepare(SELECT_ALL_GROUPS_IN_NEIGHBORHOOD_STATEMENT);
        this.selectAllGroupsInBoroQuery = this.db.prepare(SELECT_ALL_GROUPS_IN_BORO_STATEMENT);
        this.upsertGroupQuery = this.db.prepare(UPSERT_GROUP_STATEMENT);
        this.deleteGroupsQuery = this.db.prepare('DELETE FROM groups;');

        this.selectAllGeoscopesQuery = this.db.prepare('SELECT * FROM geoscopes;');

        this.deleteGeoscopeGroupsQuery = this.db.prepare('DELETE FROM geoscope_groups');
        this.deleteNeighborhoodGroupsQuery = this.db.prepare('DELETE FROM neighborhood_groups');

        this.updateData = this.db.transaction(({ neighborhoods, groups }) => {
            this.updateNeighborhoods(neighborhoods);
            this.updateGroups(groups);
            this.updateGeoscopes(groups);

            this.rebuildGeoscopeGroups(groups);
            this.rebuildNeighborhoodGroups(groups);
        });
    }

    configureDatabase() {
        this.db.pragma('foreign_keys = ON;');
    }

    createTables() {
        const statements = [
            ...CREATE_NEIGHBORHOODS_STATEMENTS,
            ...CREATE_GEOSCOPES_STATEMENTS,
            CREATE_GROUPS_STATEMENT,
            ...CREATE_GEOSCOPEGROUPS_STATEMENTS,
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
        // FIXME: Airtable sometimes changes the IDs of records,
        //        resulting in us storing duplicates when syncing.
        //        Delete all groups first to prevent this from happening.
        //        This nullifies the benefits of our UPSERT query.
        this.deleteGroupsQuery.run();

        for (const group of groups) {
            // Number because SQLite uses INTEGER for booleans.
            group.hasLocalNeighborhoods = Number(group.neighborhoods.length !== 0);
            this.upsertGroupQuery.run(group);
        }
    }

    updateGeoscopes(groups) {
        const geoscopes = new Set();

        for (const group of groups) {
            for (const geoscope of group.geoscopes) {
                geoscopes.add(geoscope);
            }
        }

        this.db.prepare(UPSERT_GEOSCOPE_STATEMENT_TEMPLATE([...geoscopes])).run([...geoscopes]);
    }

    rebuildGeoscopeGroups(groups) {
        const geoscopeNameToId = new Map();
        for (const { id, name } of this.selectAllGeoscopesQuery.all()) {
            geoscopeNameToId.set(name, id);
        }

        const geoscopeIdToGroupIds = new Map();
        for (const group of groups) {
            for (const geoscopeName of group.geoscopes) {
                const geoscopeId = geoscopeNameToId.get(geoscopeName);
                const geoscopeGroupIds = geoscopeIdToGroupIds.get(geoscopeId) || new Set();
                geoscopeGroupIds.add(group.airtableId);
                geoscopeIdToGroupIds.set(geoscopeId, geoscopeGroupIds);
            }
        }

        // Delete existing many-to-many relationships between geoscopes and groups.
        this.deleteGeoscopeGroupsQuery.run();

        // Add many-to-many relationships between geoscopes and groups.
        for (const [geoscopeId, groupIds] of geoscopeIdToGroupIds.entries()) {
            const pairs = [...groupIds].map(groupId => [geoscopeId, groupId]);
            this.db.prepare(INSERT_GEOSCOPEGROUPS_STATEMENT_TEMPLATE(pairs)).run(pairs.flat());
        }
    }

    rebuildNeighborhoodGroups(groups) {
        const neighborhoodIdToGroupIds = new Map();
        for (const group of groups) {
            for (const neighborhoodId of group.neighborhoods) {
                const neighborhoodGroupIds = neighborhoodIdToGroupIds.get(neighborhoodId) || new Set();
                neighborhoodGroupIds.add(group.airtableId);
                neighborhoodIdToGroupIds.set(neighborhoodId, neighborhoodGroupIds);
            }
        }

        // Set `hasLocalGroups` on neighborhoods table,
        // for neighborhoods that have local groups.
        const neighborhoodIds = [...neighborhoodIdToGroupIds.keys()];
        this.db.prepare(FLAG_NEIGHBORHOODS_WITH_LOCAL_GROUPS_STATEMENT_TEMPLATE(neighborhoodIds)).run(neighborhoodIds);

        // Delete existing many-to-many relationships between neighborhoods and groups.
        this.deleteNeighborhoodGroupsQuery.run();

        // Add many-to-many relationships between neighborhoods and groups.
        for (const [neighborhoodId, groupIds] of neighborhoodIdToGroupIds.entries()) {
            const pairs = [...groupIds].map(groupId => [neighborhoodId, groupId]);
            this.db.prepare(INSERT_NEIGHBORHOODGROUPS_STATEMENT_TEMPLATE(pairs)).run(pairs.flat());
        }
    }

    allGroups() {
        return this.selectAllGroupsQuery.all();
    }

    allGroupsInNeighborhood(neighborhoodId) {
        return this.selectAllGroupsInNeighborhoodQuery.all(neighborhoodId);
    }

    allGroupsInBoro(boroName) {
        return this.selectAllGroupsInBoroQuery.all(boroName);
    }

    allNonlocalGroups() {
        const groups = {
            'New York City': [],
            'New York State': [],
            'National': [],
            'Global': [],
        };

        const geoscopeNames = Object.keys(groups);
        const records = this.db.prepare(SELECT_ALL_GROUPS_IN_GEOSCOPES_STATEMENT_TEMPLATE(geoscopeNames)).all(geoscopeNames);

        // Place groups in buckets by geoscope name.
        records.reduce((memo, group) => {
            const geoscopeName = group.geoscopeName;
            delete group.geoscopeName;
            memo[geoscopeName].push(group);
            return memo;
        }, groups);

        return groups;
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
