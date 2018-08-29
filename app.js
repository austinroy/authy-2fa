import config from './config';

import mongoose from 'mongoose';
import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import users from './routes/users';
import expressSession from 'express-session';

const app = express();

const mongoStore = require('connect-mongo')({session: expressSession});

app.use(express.static(__dirname + '/src'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));



if(!config.API_KEY){
    console.log("Please set your ACCOUNT_SECURITY_API_KEY environment variable before proceeding.");
    process.exit(1);
}

/**
 * Setup MongoDB connection.
 */
mongoose.connect('mongodb://localhost/authydemo');
var db = mongoose.connection;

app.use(
    expressSession(
        {
            'secret': config.SECRET,
            resave: true,
            saveUninitialized: true
        }
    )
);

app.use('/api/users', users);

http.createServer(app).listen(3000);

module.exports = app;
