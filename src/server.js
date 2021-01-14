const express = require("express");
const bodyParser = require('body-parser');
const cors = require('cors');
const { graphqlHTTP } = require("express-graphql");
const { graphqlUploadExpress } = require('graphql-upload');

const mongoose = require("mongoose");
const AppSchema = require("./graphql");
const { authenticateMiddleware, authenticateBasicMiddleware, authenticateBearerMiddleware } = require("./middlewares");
const { signInRouter, signOutRouter, signUpRouter, outhCodeRouter, renameRouter, configRouter, signInFacebook, deletionFacebook } = require("./routers");

const { getError } = require("./errors");

function start() {
  const mongoUri = `${process.env.MONGO_URI}/${process.env.MONGO_DB}`
  const mongoOptions = { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, }
  const app = express();

  const urlencodedParser = bodyParser.urlencoded({ extended: false })

  app.use(cors());
  app.use(bodyParser.json());

  app.use("/api/config", authenticateMiddleware, configRouter);
  app.post("/oauth/rename", authenticateBearerMiddleware, renameRouter);
  app.post("/oauth/outhcode", authenticateMiddleware, outhCodeRouter);

  app.post("/oauth/signin", authenticateBasicMiddleware, signInRouter);
  app.post("/oauth/signout", authenticateBearerMiddleware, signOutRouter);
  app.post("/oauth/signup", authenticateBasicMiddleware, signUpRouter);
  app.use("/oauth/signin-facebook", signInFacebook);
  app.use("/oauth/deletion-facebook", urlencodedParser, deletionFacebook);

  app.use("/api/graphql", authenticateMiddleware,
    graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }),
    graphqlHTTP({
      schema: AppSchema,
      graphiql: true,
      customFormatErrorFn: (error) => {
        console.log(error);
        return getError(error.message);
      }
    })
  );

  mongoose
    .connect(mongoUri, mongoOptions)
    .then(() => app.listen(process.env.SERVER_PORT, () => {
      console.log("Server is listening " + process.env.SERVER_PORT + " port.");
    }))
    .catch(error => {
      console.log(error);
    })
}

module.exports = {
  start
}

