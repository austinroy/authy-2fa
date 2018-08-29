import config from './config';

import mongoose from 'mongoose';
import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import users from './routes/users';
import expressSession from 'express-session';
import path from 'path';

const app = express();

const mongoStore = require('connect-mongo')({session: expressSession});

app.use(express.static(__dirname + '/src'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('*', function(req, res) {
    res.sendFile(path.resolve(__dirname, 'src', 'index.html'));
});

if(!config.API_KEY){
    console.log("Please set your ACCOUNT_SECURITY_API_KEY environment variable before proceeding.");
    process.exit(1);
}

const server = http.createServer(app);

/**
 * Setup MongoDB connection.
 */
mongoose.connect('mongodb://localhost/authydemo');
const db = mongoose.connection;

/**
 * Open the DB connection.
 */
db.once('open', function (err) {
    if(err){
        console.log("Error Opening the DB Connection: ", err);
        return;
    }
    app.use(expressSession({
        secret: config.SECRET,
        cookie: {maxAge: 60 * 60 * 1000},
        store: new mongoStore({
            db: mongoose.connection.db,
            collection: 'sessions'
        }),
        resave: true,
        saveUninitialized: true
    }));
    const port = config.PORT || 3000;
    server.listen(port);
    console.log("Server running on port " + port);
});

db.on('error', console.error.bind(console, 'Connection Error:'));

app.use(
    expressSession(
        {
            'secret': config.SECRET,
            resave: true,
            saveUninitialized: true
        }
    )
);

// app.use('/api/users', users);

// http.createServer(app).listen(3000);

module.exports = app;
