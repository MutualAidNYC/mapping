require('dotenv').config();

const express = require('express');
const app = express();
const port = 8000;

app.use(express.static('frontend/src'));

app.get('/mapbox-access-token', (req, res) => {
    res.send(process.env.MAPBOX_ACCESS_TOKEN);
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
