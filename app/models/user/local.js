'use strict';

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema,
    bcrypt   = require('bcrypt');

var SALT_WORK_FACTOR = 10;

var LocalUser = new Schema({
    provider: { type: String, default: 'local' },
    username: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        required: [true, 'The field "username" is required']
    },
    password: {
        type: String,
        trim: true,
        minlength: [3, 'The password must be at least 3 characters long'],
        required: [true, 'The field "password" is required']
    },
    email: {
        type: String,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
        required: true
    },
    lang: {
        type: String,
        required: true,
        default: "en"
    }
}, { collection: 'users' });

// Hash the password
LocalUser.pre('save', function(next) {
    var user = this;
    if (!user.isModified('password')) {
        return next();
    }

    // Generate salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) return next(err);

        // Hash the password
        bcrypt.hash(user.password, salt, function(err, hash) {
            if (err) return next(err);

            user.password = hash;
            next();
        });
    });
});

// Check password match
LocalUser.methods.verifyPassword = function(password, cb) {
  bcrypt.compare(password, this.password, function(err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

module.exports = mongoose.model('LocalUser', LocalUser);