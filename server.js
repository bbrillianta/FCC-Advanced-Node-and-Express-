'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
const passport = require('passport');
const routes = require('./routes');
const auth = require('./auth');

const app = express();

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'pug');

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());

myDB(async client => {
  const myDatabase = await client.db('qa_fcc').collection('users');

  routes(app, myDatabase);

  auth(app, myDatabase);
})
.catch(e => {
  app.route('/').get((req, res) => {
    const resjson = {title: e, message: 'Unable to login'};
    res.render('pug/index', resjson);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
