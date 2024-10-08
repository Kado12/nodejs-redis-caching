// Variables de Entorno DOTENV
require('dotenv').config()
const { MONGO_DB_HOST, MONGO_DB_DATABASE } = process.env


// MongoDB
const mongoose = require('mongoose')
const MONGODB_URI = `mongodb://${MONGO_DB_HOST}/${MONGO_DB_DATABASE}`
mongoose.connect(MONGODB_URI, {
})
  .then(db => console.log('Database is connected'))
  .catch(err => console.log(err))


const express = require("express");
const axios = require("axios");
const { createClient } = require("redis");
const responseTime = require("response-time");



const app = express();

// Connecting to redis
const client = createClient({
  host: "127.0.0.1",
  port: 6379,
});

app.use(responseTime());

// Get all characters
app.get("/character", async (req, res, next) => {
  try {
    // Search Data in Redis
    const reply = await client.get("character");

    // if exists returns from redis and finish with response
    if (reply) return res.send(JSON.parse(reply));

    // Fetching Data from Rick and Morty API
    const response = await axios.get(
      "https://rickandmortyapi.com/api/character"
    );

    // Saving the results in Redis. The "EX" and 10, sets an expiration of 10 Seconds
    const saveResult = await client.set(
      "character",
      JSON.stringify(response.data),
      {
        EX: 60,
      }
    );
    console.log(saveResult)

    // resond to client
    res.send(response.data);
  } catch (error) {
    res.send(error.message);
  }
});

// Get a single character
app.get("/character/:id", async (req, res, next) => {
  try {
    const reply = await client.get(req.params.id);

    if (reply) {
      console.log("using cached data");
      return res.send(JSON.parse(reply));
    }

    const response = await axios.get(
      "https://rickandmortyapi.com/api/character/" + req.params.id
    );
    const saveResult = await client.set(
      req.params.id,
      JSON.stringify(response.data),
      {
        EX: 60,
      }
    );

    console.log("saved data:", saveResult);

    res.send(response.data);
  } catch (error) {
    console.log(error);
    res.send(error.message);
  }
});

async function main() {
  await client.connect();
  app.listen(3000);
  console.log("Server listen on port 3000");
}

main();
