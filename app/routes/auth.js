var authHandler = require('../controllers/auth.js'),
    passport    = require('passport');

module.exports = function(app) {

    // pages that require an authenticated user redirect to /login
    global.isLoggedIn = function(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        } else {
            res.redirect('/login');
        }
    };

    // signup
    app.route('/signup')
        .get(authHandler.signup)
        .post(authHandler.addUser);

    // login
    app.route('/login')
        .get(authHandler.signin)
        .post(passport.authenticate('local', {
            successRedirect: '/',
            failureRedirect: '/login',
            failureFlash: true
        }));

    // logout
    app.get('/logout', function (req, res) {
        req.logout(function(){
            res.redirect('/');
        });
    });

    // change password
    app.get(/profile\/([a-z0-9]+)/, authHandler.displayProfile);

    app.route('/profile')
        .get(isLoggedIn, authHandler.settings)
        .post(isLoggedIn, authHandler.settingsSubmit);
};