'use strict';

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var Book = new Schema({
    _owner: { type: String, ref: 'LocalUser', required: true },
    title: {
        type: String,
        trim: true,
        required: [true, 'The field "title" is required']
    },
    thumbnail: String,              // volumeInfo.imageLinks.thumbnail
    subtitle: String,               // volumeInfo.subtitle
    authors: String,                // volumeInfo.authors
    year: String,                   // volumeInfo.publishedDate.substr(0,4)
    publisher: String,              // volumeInfo.publisher
    category: String,               // volumeInfo.categories
    pageCount: Number,              // volumeInfo.pageCount
    isMature: Boolean,              // volumeInfo.maturityRating == MATURE
    link: String,                   // volumeInfo.previewLink
    isRead: Boolean,
    isWishlist: Boolean,
    insert: { type: Date, default: Date.now },
});

Book.index({ _owner: 1, isWishlist: 1, isRead: 1 });
module.exports = mongoose.model('Book', Book);