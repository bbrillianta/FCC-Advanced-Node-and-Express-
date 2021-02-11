const passport = require('passport');
const bcrypt = require('bcrypt');

module.exports = (app, myDatabase) => {
    const ensureAuthenticated = (req, res, next) => {
        if(req.isAuthenticated()) { return next(); }
        
        res.redirect('/');
    }

    app.route('/')
    .get((req, res) => {
      const resjson = { 
        title: 'Connected to Database', 
        message: 'Please login', 
        showLogin: true,
        showRegistration: true,
        showSocialAuth: true
      };
      res.render('pug/index', resjson);
    });
  
    app.route('/login')
    .post(passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
      res.redirect('/profile');
    });
  
    app.route('/profile')
    .get(ensureAuthenticated, (req, res) => {
      res.render('pug/profile', { username: req.user.username });
    });
  
    app.route('/logout')
    .get((req, res) => {
      req.logout();
      res.redirect('/');
    });
  
    app.route('/register')
    .post((req, res, next) => {
      myDatabase.findOne({ username: req.body.username }, (err, user) => {
        if(user) { return res.redirect('/'); }
        if(err) { next(err); }
  
        const hash = bcrypt.hashSync(req.body.password, 12);
        myDatabase.insertOne({ username: req.body.username, password: hash}, (err, doc) => {
          if(err) { return res.redirect('/'); }
          else { next(null, doc.ops[0]); }
        })
      });
    },
    passport.authenticate('local', { failureRedirect: '/' }), (req, res, next) => {
      res.redirect('/profile');
    });

    app.route('/auth/github')
    .get(passport.authenticate('github'));

    app.route('/auth/github/callback')
    .get(passport.authenticate('github', { failureRedirect : '/'}), (req, res) => {
        req.session.user_id = req.user.id
        res.redirect('/chat');
    });

    app.route('/chat')
    .get(ensureAuthenticated, (req, res) => {
      res.render('pug/chat', { user: req.user });
    });

    app.use((req, res, next) => {
        res.status(404)
        .type('text')
        .send('Not Found');
    });
}