const express = require('express');
const redis = require('redis');
const keys = require('./keys');
const bodyParser = require('body-parser')
const cors = require('cors');

// Express app setup
const app = express();

app.use(cors());
app.use(bodyParser.json());

// Postgres Client Setup

const { Pool } = require('pg');
const { redisPort } = require('./keys');
const pgClient = new Pool({
    user: keys.pgUser,
    host: keys.pgHOST,
    database: keys.pgDatabase,
    password: keys.pgPASSWORD,
    port: keys.pgPORT
})

pgClient.on('connect', () => {
    console.log("CONNECTED TO DB")
    pgClient.query('CREATE TABLE IF NOT EXISTS values (number INT)')
    .catch((err) => console.log(err));
    console.log("TABLE CREATED")
    pgClient.query("SELECT * FROM values");
    console.log("TABLE SUCCESS")
})

// Redis Client Setup 

const redisClient = redis.createClient({
    host: keys.redisHost,
    port: redisPort,
    retry_strategy: () => 1000
});

const redisPublisher = redisClient.duplicate();

// Express route handlers

app.get('/', (req, res) => {
    res.send("test ok");
})

app.get('/values/all', async (req, res) => {
    const values = await pgClient.query('SELECT * FROM values');
    res.send(values.rows);
});

app.get('/values/current', async (req, res) => {
    redisClient.hgetall('values', (err, values) => {
        res.send(values);
    })
})

app.post('/values', async (req, res) => {
    console.log("here")
    const index = req.body.index;
    
    if (parseInt(index) > 40) {
        return res.status(422).send("index too high");
    }

    redisClient.hset('values', index, 'Nothing yet!');
    redisPublisher.publish('insert', index);
    pgClient.query('INSERT INTO values(number) VALUES ($1)', [index]);

    res.send({ working: true });
});

app.listen(5000, err => {
    console.log('Listening on port 5000...')
})

