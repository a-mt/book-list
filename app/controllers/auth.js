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
        user.save(function(err){

            // Data validation of model failed
           if(err) {
               var errors = err.errors || {};

               // Err duplicate
                if (err.name === 'MongoError' && err.code === 11000) {
                    errors.username = {
                        message: 'User already exists'
                    };
                }
                // Render form with errors
                req.flash('errors', errors);
                req.flash('data', req.body);

                res.redirect('/signup');
            } else {
                req.login(user, function () {
                    res.redirect('/profile');
                });
            }
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
                user.save(function(err){

                    // Data validation failed ?
                    if(err) {
                        req.flash('errors', {
                            newpassword: err.errors.password
                        });
                        req.flash('data', post);
                    } else {
                        req.flash('success', 'Your password has been successfully updated');
                    }
                    res.redirect('/profile');
                });
            });
        } else {
            user.lang     = post.lang;
            user.email    = post.email;

            user.save(function(err, data){

                // Data validation failed ?
                if(err) {
                    req.flash('errors', err.errors);
                    req.flash('data', post);
                } else {
                    req.flash('success', 'Your details have been successfully updated');
                }
                res.redirect('/profile');
            });
        }
    };

    this.displayProfile = function(req, res) {
        var username = req.params[0];
        User.findOne({
            username: username
        }, function(err, user){
            if(err) {
                throw new err;
            }
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