require('dotenv').config();

const path = require('path');
const express = require('express');
const Airtable = require('airtable');
const AirtableFetcher = require('./airtable-fetcher');
const Database = require('./database');


const AIRTABLE_FETCH_INTERVAL_MINUTES = 10;
const airtableBase = new Airtable({
    endpointUrl: 'https://api.airtable.com',
    apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_API_BASE);

const airtableFetcher = new AirtableFetcher(airtableBase);

const DATABASE_PATH = path.resolve(__dirname, 'database.sqlite');
const database = new Database(DATABASE_PATH);

const app = express();
const port = 8000;


// Sync Airtable to Database on a timer.

async function syncAirtableToDatabase() {
    database.update(await airtableFetcher.fetch());
}

if (AIRTABLE_FETCH_INTERVAL_MINUTES > 0) {
    // Perform initial fetch.
    syncAirtableToDatabase();
    // Kickoff fetch timer.
    setInterval(() => syncAirtableToDatabase(), AIRTABLE_FETCH_INTERVAL_MINUTES * 60 * 1000);
}


// Configure and start HTTP server.

app.use(express.static('frontend/src'));

app.get('/mapbox-access-token', (req, res) => {
    res.send(process.env.MAPBOX_ACCESS_TOKEN);
});

app.get('/data/groups', (req, res) => {
    res.json(database.allGroups());
});

app.get('/data/neighborhoods', (req, res) => {
    res.json(database.allNeighborhoods());
});

app.get('/data/communities', (req, res) => {
    res.json(database.allCommunities());
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));


// Close database on exit.

process.on('exit', () => database.close());
process.on('SIGHUP', () => process.exit(128 + 1));
process.on('SIGINT', () => process.exit(128 + 2));
process.on('SIGTERM', () => process.exit(128 + 15));
