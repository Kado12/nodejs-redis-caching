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

// NodeJS
const express = require("express");
const axios = require("axios");
const { createClient } = require("redis");
const responseTime = require("response-time");
const bodyParser = require('body-parser');

// Models
const User = require('./models/users')

const app = express();

app.use(bodyParser.json()); // parse application/json
app.use(bodyParser.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded

// ...

// Connecting to redis
const client = createClient({
  host: "127.0.0.1",
  port: 6379,
});

app.use(responseTime());

// Get all 
app.get("/Users", async (req, res, next) => {
  try {
    // Search Data in Redis
    const reply = await client.get("user");

    // if exists returns from redis and finish with response
    if (reply) return res.send(JSON.parse(reply));

    const users = await User.find().exec()

    // Saving the results in Redis. The "EX" and 10, sets an expiration of 10 Seconds
    const saveResult = await client.set(
      "user",
      JSON.stringify(users),
      {
        EX: 60,
      }
    );
    console.log(saveResult)

    res.send(users);
  } catch (error) {
    res.send(error.message);
  }
});


// Get for Id
app.get("/Users/:id", async (req, res, next) => {
  try {
    const userId = req.params.id;
    // Search Data in Redis
    const reply = await client.get(`user:${userId}`);
    // if exists returns from redis and finish with response
    if (reply) return res.send(JSON.parse(reply));

    const users = await User.findById(userId).exec()
    console.log(users)

    // Saving the results in Redis. The "EX" and 10, sets an expiration of 10 Seconds
    const saveResult = await client.set(
      `user:${userId}`,
      JSON.stringify(users),
      {
        EX: 60,
      }
    );
    console.log(saveResult)

    res.send(users);
  } catch (error) {
    res.send(error.message);
  }
});


// Patch
app.patch("/Users/:id", async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { name, active } = req.body; // Obtenemos los datos actualizados desde el cuerpo de la solicitud

    // Buscamos el usuario por ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send({ message: "Usuario no encontrado" });
    }

    // Actualizamos los campos del usuario
    if (name) {
      user.name = name;
    }
    if (active !== undefined) {
      user.active = active;
    }

    // Guardamos los cambios en la base de datos
    await user.save();

    // Actualizamos los datos en Redis
    const saveResult = await client.set(
      `user:${userId}`,
      JSON.stringify(user),
      {
        EX: 60,
      }
    );
    console.log(saveResult)

    res.send({ message: "Usuario actualizado correctamente" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Error al actualizar usuario" });
  }
});


async function main() {
  await client.connect();
  app.listen(3000);
  console.log("Server listen on port 3000");
}

main();
