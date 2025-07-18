'use strict';
var User  = require('../models/user/local'),
    Langs = require('../data/langs');

function AuthHandler(){

    // Create a new account
    this.signup = function(req, res) {
        res.render('auth/signup', {
            title: 'Signup',
            errors: req.flash('errors').pop() || {},
            data: req.flash('data').pop() || {}
        });
    };
    this.addUser = function(req, res) {
        var params = req.body;
        var user   = new User(params);

        // Save user
        user.save()
            .then(() => {
                req.login(user).then(() => {
                    res.redirect('/profile');
                });
            })
            .catch((err) => {

                // Data validation of model failed
               var errors = err.errors || {};

               // Err duplicate
                if (err.name === 'MongoServerError' && err.code === 11000) {
                    errors.username = {
                        message: 'User already exists',
                    };
                }
                if (!Object.keys(errors).length) {
                    errors.username = {
                        message: 'Something went wrong',
                    };
                }
                // Render form with errors
                req.flash('errors', errors);
                req.flash('data', req.body);

                res.redirect('/signup');
            });
    };

    // Login with an account
    this.signin = function(req, res) {
        res.render('auth/signin', {
            title: 'Login'
        });
    };

    // Change password
    this.settings = function(req, res){
        res.render('auth/settings', {
            title: 'About me',
            errors: req.flash("errors").pop() || {},
            data: req.flash('data').pop() || {},
            langs: Langs,
            url: 'https://' + req.headers.host
        });
    };
    this.settingsSubmit = function(req, res){
        var user = req.user;
        var post = req.body;

        // Check if given password matches current
        if(post.submitPassword) {
            user.verifyPassword(post.password, function(err, isMatch){

                // Render form with errors
                if(!isMatch) {
                    req.flash('errors', {
                        password: {message: 'Incorrect password.'}
                    });
                    req.flash('data', req.body);
                    res.redirect('/profile');
                    return;
                }

                // Save changes
                user.password = post.newpassword;
                user.save()
                    .then(() => {
                        req.flash('success', 'Your password has been successfully updated');
                    })
                    .catch((err) => {
                        // Data validation failed ?
                        req.flash('errors', {
                            newpassword: err.errors.password
                        });
                        req.flash('data', post);
                    })
                    .finally(() => {
                        res.redirect('/profile');
                    });
            });
        } else {
            user.lang     = post.lang;
            user.email    = post.email;

            user.save()
                .then((data) => {
                    req.flash('success', 'Your details have been successfully updated');
                })
                .catch((err) => {
                    req.flash('errors', err.errors);
                    req.flash('data', post);
                })
                .finally(() => {
                    res.redirect('/profile');
                });
        }
    };

    this.displayProfile = function(req, res) {
        var username = req.params[0];

        User.findOne({username: username})
            .then((user) => {
                if(!user) {
                    res.status(404).redirect('/');
                    return;
                }
                res.render('auth/profile', {
                    title: 'Profile of ' + user.username,
                    user: user
                });
            });
    };
}

module.exports = new AuthHandler();