const dotenv = require('dotenv');
dotenv.config();
const CFG = require("./config");

const express = require("express");
const {graphqlHTTP} = require("express-graphql");
const mongoose = require("mongoose");
const AppSchema = require("./graphql");
const mongoUri = `${process.env.MONGO_URI}/${process.env.MONGO_DB}`
const mongoOptions = { useNewUrlParser: true, useUnifiedTopology: true }

const app = express();

app.use(
  "/graphql",
  graphqlHTTP({
    schema: AppSchema,
    // rootValue,
    graphiql: true,
  })
)

mongoose
  .connect(mongoUri, mongoOptions)
  .then(() => app.listen(process.env.SERVER_PORT, console.log("Server is running")))
  .catch(error => {
    console.log(error);
  })