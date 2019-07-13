var express      = require('express'),
    app          = express(),
    cookieParser = require('cookie-parser'),
    routes       = require('./app/routes/index.js');

//---------------------------------------------------------

require('dotenv').config(); // load .env variables

// Connect DB
var mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useCreateIndex: true
});
mongoose.Promise = global.Promise;

// Auth
var passport = require('passport');
require('./app/auth/passport')(passport);

var session    = require('express-session'),
    MongoStore = require('connect-mongo')(session);

app.use(session({
    secret: 'ce0c04361d',
    resave: true,
    saveUninitialized: true,
    cookie: {maxAge: 24 * 60 * 60 * 1000}, // 1 day

    // Save session in database (so it doesn't get lost when server stops)
    store: new MongoStore({
        mongooseConnection: mongoose.connection,
        autoRemove: 'interval',
        autoRemoveInterval: 30, // check expired sessions every 30 min
        touchAfter: 12 * 3600
    })
}));

app.use(passport.initialize());
app.use(passport.session());

// Handle requests
app.set('etag', false);
app.use(require('connect-flash')());
app.use(require('body-parser').urlencoded({extended: false}));
app.use(cookieParser());

app.locals.env = process.env;

app.use(function(req, res, next){
    res.locals.cookies = req.cookies;
    res.locals.user    = req.user;
    res.locals.error   = req.flash('error').pop() || false;
    res.locals.success = req.flash('success').pop() || false;
    next();
});

//---------------------------------------------------------

// Handle requests
app.set('view engine', 'pug');
app.use('/public', express.static(process.cwd() + '/public'));
routes(app);

app.set('json spaces', 2);

// Start server
var port = process.env.PORT || 8080;
app.listen(port, function(){
   console.log('The server is listening on port ' + port);
});