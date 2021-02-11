'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
const passport = require('passport');
const passportSocketIo = require('passport.socketio');
const URI = process.env.MONGO_URI;
const MongoStore = require('connect-mongo')(session);
const store = new MongoStore({ url: URI });
const cookieParser = require('cookie-parser');

const routes = require('./routes');
const auth = require('./auth');


const app = express();

const http = require('http').createServer(app);
const io = require('socket.io')(http);

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'pug');

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  key: 'express.sid',
  store: store,
  cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());

function onAuthorizeSuccess(data, accept) {
  console.log('successful connection to socket.io');

  accept(null, true);
}

function onAuthorizeFail(data, message, error, accept) {
  if (error) throw new Error(message);
  console.log('failed connection to socket.io:', message);
  accept(null, false);
}

io.use(
  passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: 'express.sid',
    secret: process.env.SESSION_SECRET,
    store: store,
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail
  })
);

myDB(async client => {
  const myDatabase = await client.db('qa_fcc').collection('users');

  routes(app, myDatabase);

  auth(app, myDatabase);

  let currentUsers = 0;

  io.on('connection', socket => {
    ++currentUsers;

    io.emit('user', {
      name: socket.req.user.username,
      currentUsers,
      connected: true
    });

    socket.on('disconnect', () => {
      --currentUsers;

      io.emit('user', {
        name: socket.req.user.username,
        currentUsers,
        connected: false
      });
      
      console.log('A user has disconnected');
    });

    console.log('A user ' + socket.request.user.username + ' has connected');
  })
})
.catch(e => {
  app.route('/').get((req, res) => {
    const resjson = {title: e, message: 'Unable to login'};
    res.render('pug/index', resjson);
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
