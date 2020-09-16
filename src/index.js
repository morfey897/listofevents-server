const dotenv = require('dotenv');
dotenv.config();

const express = require("express");
const cors = require('cors');
const { graphqlHTTP } = require("express-graphql");
const mongoose = require("mongoose");
const AppSchema = require("./graphql");
const mongoUri = `${process.env.MONGO_URI}/${process.env.MONGO_DB}`
const mongoOptions = { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, }

const app = express();

app.use(cors());

app.use(
  "/graphql",
  graphqlHTTP({
    schema: AppSchema,
    graphiql: true,
  })
);

mongoose
  .connect(mongoUri, mongoOptions)
  .then(() => app.listen(process.env.SERVER_PORT, console.log("Server is running")))
  .catch(error => {
    console.log(error);
  })