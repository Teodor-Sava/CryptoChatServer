/* eslint-disable linebreak-style */
// Importing Node modules and initializing Express
const express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    logger = require('morgan'),
    cors = require('cors'),
    helmet = require('helmet'),
    express_enforces_ssl = require('express-enforces-ssl');
router = require('./router'),
    mongoose = require('mongoose'),
    socketEvents = require('./socketEvents'),
    config = require('./config/main');

// Database Setup
if (process.env.DATABASE) {
    mongoose.connect(process.env.DATABASE);
} else {
    mongoose.connect(config.database);
}

// Start the server
let server;
if (process.env.NODE_ENV !== config.test_env) {
    server = app.listen(process.env.PORT || 5000);
    console.log(`Your server is running on port ${config.port}.`);
} else {
    server = app.listen(config.test_port);
}


const io = require('socket.io').listen(server);

socketEvents(io);

// Set static file location for production
// app.use(express.static(__dirname + '/public'));

// Setting up basic middleware for all Express requests
app.use(bodyParser.urlencoded({extended: false})); // Parses urlencoded bodies
app.use(bodyParser.json()); // Send JSON responses
app.use(logger('dev')); // Log requests to API using morgan

const corsOptions = {
    origin: 'https://thundering-advice.surge.sh',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));

app.use(helmet());

app.enable('trust proxy');
app.use(express_enforces_ssl());


// Import routes to be served
router(app);

// necessary for testing
module.exports = server;
