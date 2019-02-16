'use strict';
var User          = require('../models/user/local');
var LocalStrategy = require('passport-local').Strategy;

module.exports = function (passport) {

    // Login using username + password
    passport.use(new LocalStrategy(function(username, password, done) {

        // Find user with the given username
        User.findOne({ username: username }, function (err, user) {

            // Err access db
            if (err) {
              return done(err);
            }
            // Err user doesn't exist
            if (!user) {
                return done(null, false, { message: 'Incorrect username.' });
            }
            // Verify password
            user.verifyPassword(password, function(err, isMatch) {
                if (err) { return done(err); }

                // Err wrong password
                if (!isMatch) {
                    return done(null, false, { message: 'Incorrect password.' });
                }
                // Success
                return done(null, user);
            });
        });
      }
    )); // end LocalStrategy
};