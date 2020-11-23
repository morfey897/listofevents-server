const express = require("express");
const cors = require('cors');
const { graphqlHTTP } = require("express-graphql");
const mongoose = require("mongoose");
const AppSchema = require("./graphql");
const {authenticateMiddleware, authenticateBasicMiddleware, authenticateBearerMiddleware} = require("./middlewares");
const {signInRouter, signOutRouter, signUpRouter, outhCodeRouter} = require("./routers");

function start() {
  const mongoUri = `${process.env.MONGO_URI}/${process.env.MONGO_DB}`
  const mongoOptions = { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, }
  const app = express();
  
  app.use(cors());
  app.use(express.json());
  // app.use(authenticateMiddleware);
  app.post("/oauth/signin", authenticateBasicMiddleware, signInRouter);
  app.post("/oauth/signout", authenticateBearerMiddleware, signOutRouter);
  app.post("/oauth/signup", authenticateBasicMiddleware, signUpRouter);
  app.post("/oauth/outhcode", authenticateBasicMiddleware, outhCodeRouter);
  app.use("/api/graphql", authenticateMiddleware, graphqlHTTP({
      schema: AppSchema,
      graphiql: true,
    })
  );
  
  mongoose
    .connect(mongoUri, mongoOptions)
    .then(() => app.listen(process.env.SERVER_PORT, console.log("Server is listening " + process.env.SERVER_PORT + " port.")))
    .catch(error => {
      console.log(error);
    })
}

module.exports = {
  start
}

