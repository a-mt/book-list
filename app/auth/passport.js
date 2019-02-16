'use strict';
var User = require('../models/user/local');

module.exports = function (passport) {

    // Serialize and deserialize user instances to and form the session
	passport.serializeUser(function (user, done) {
		done(null, user.id);
	});
	passport.deserializeUser(function (id, done) {
		User.findById(id, function (err, user) {
			done(err, user);
		});
	});

	// Local auth
	require('./passport-local')(passport);
};