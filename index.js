const dotenv = require('dotenv');
dotenv.config();

const server = require("./src/server");

server.start();