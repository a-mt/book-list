'use strict';

var Book    = require('../models/book'),
    Langs   = require('../data/langs');

var https   = require('https'),
    upload  = require('multer')({ dest: '/tmp/' }),
    fs      = require('fs');

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function BookHandler(){

    function buildQuery(req) {
        var _get    = req.query,
            q       = { _owner: req.user.id },
            filters = {};

        // Default filter
        if(typeof req.cookies.filters == "undefined") {
            req.cookies.filters = {
                isWishlist : "0",
                isRead     : "2",
                title      : "",
                author     : "",
                lang       : ""
            };
        }

        // Current filter
        ["isWishlist", "isRead", "title", "author", "lang"].forEach((k) => {
            filters[k] = (typeof _get[k] != "undefined" ? _get[k] : req.cookies.filters[k]).trim();
        });

        // Build MongoDB query
        if(filters.isWishlist != "2") {
            q.isWishlist = (filters.isWishlist == "1");
        }
        if(filters.isRead != "2") {
            q.isRead = (filters.isRead == "1");
        }
        if(filters.title) {
            q.title = new RegExp(escapeRegExp(filters.title), 'i');
        }
        if(filters.author) {
            q.authors = new RegExp(escapeRegExp(filters.author), 'i');
        }
        if(filters.lang) {
            q.lang = filters.lang;
        }

        return [q, filters];
    }

    this.index = function(req, res) {
        var books   = [],
            filters = {},
            q;

        if(!req.user) {
            res.render('index', { books, filters });
            return;
        }

        // Filters
        [q, filters] = buildQuery(req);

        // Find books
        var query = Book.find(q).populate('_owner').then(function(docs){
            books = docs;
        });

        // Render
        query.then(function(){
            res.cookie('filters', filters);
            res.render('index', { books, filters });
        });
    };

    // Lookup book with the given name with Google Book API
    this.search = function(req, res) {
        var name = req.body.name,
            lang = req.body.lang;
        if(!name) {
            res.status(400).send('Empty query');
            return;
        }

        // Query Google API
        https.get('https://www.googleapis.com/books/v1/volumes?key=' + process.env.GOOGLE_API_KEY + '&q=' + name + (lang ? '&langRestrict=' + lang : ''), function(subres){

            if(subres.statusCode != 200) {
                res.status(subres.statusCode).send(subres.statusMessage);
            } else {
                var body = '';
                subres.on('data', function(chunk) {
                    body += chunk.toString().trim();
                });
                subres.on('end', function() {
                    res.set('X-query',  name);
                    res.send(body);
                });
            }

        }).on('error', function(e) {
            res.status(500).send(e.message);
        });
    };

    // Add a book
    this.add = function(req, res) {
        res.render('book/new', {
            title: 'New Book',
            errors: req.flash('errors').pop() || {},
            data: req.flash('data').pop() || {},
            langs: Langs
        });
    };
    this.addSubmit = function(req, res) {

        function callback(data, isWishlist, isRead) {
            var book        = new Book(data);
            book._owner     = req.user.id;
            book.isRead     = isRead;
            book.isWishlist = isWishlist;

            // Save it
            book.save(function(err, obj){

                // Data validation of model failed
               if(err) {
                   var errors = err.errors || {};

                    // Render form with errors
                    req.flash('errors', errors);
                    req.flash('data', req.body);

                    res.redirect('/book/new');
                } else {
                    res.redirect('/book/edit/' + obj.id);
                }
            });
        }

        var id         = req.body.choice,
            isWishlist = (req.body.isWishlist == "1"),
            isRead     = (req.body.isRead == "1");
        if(id == 'custom') {
            callback(req.body, isWishlist, isRead);
        } else {
            https.get('https://www.googleapis.com/books/v1/volumes/' + id + '?key=' + process.env.GOOGLE_API_KEY, function(subres){

            if(subres.statusCode != 200) {
                res.status(subres.statusCode).send(subres.statusMessage);
            } else {
                var body = '';
                subres.on('data', function(chunk) {
                    body += chunk.toString().trim();
                });
                subres.on('end', function() {
                    var json = JSON.parse(body).volumeInfo;
                    var post = {
                        title      : json.title,
                        subtitle   : json.subtitle,
                        authors    : (json.authors ? json.authors.join(', ') : ''),
                        thumbnail  : json.imageLinks.thumbnail,
                        year       : json.publishedDate.substr(0,4),
                        publisher  : json.publisher,
                        pageCount  : json.pageCount,
                        category   : (json.categories ? json.categories[0] : ''),
                        isMature   : (json.maturityRating == 'MATURE'),
                        link       : json.previewLink,
                        lang       : json.language
                    };
                    callback(post, isWishlist, isRead);
                });
            }

        }).on('error', function(e) {
            res.status(500).send(e.message);
        });
        }
    };

    // Check if the GET parameter :id is a book
    // owned by the current user
    this.isBook = function(req, res, next) {
        var id = req.params.id;
        Book.findById(id, function (err, book) {

            // Not found
            if(err || !book) {
                req.flash('error', 'The required book doesn\'t exist');
                res.status(404).redirect('/');

            // Book not owned by current user
            } else if(book._owner != req.user.id) {
                res.status(403).send('Forbidden');

            } else {
                req.book = book;
                return next();
            }
        });
    };

    // Edit a book
    this.edit = function(req, res) {
        res.render('book/edit', {
            title: 'Edit Book',
            errors: req.flash('errors').pop() || {},
            data: req.flash('data').pop() || {},
            item: req.book
        });
    };
    this.editSubmit = function(req, res) {
        var post = req.body,
            book = req.book;

        // Delete book
        if(post.delete) {
            book.remove(function(){
                req.flash('success', 'The book has been successfully deleted');
                res.redirect('/');
            });

        // Update info
        } else {
            if(post.thumbnail.trim() != book.thumbnail.trim()) {
                book.tc = null;
            }
            book.title      = post.title;
            book.subtitle   = post.subtitle;
            book.authors    = post.authors;
            book.year       = post.year;
            book.publisher  = post.publisher;
            book.pageCount  = post.pageCount;
            book.category   = post.category;
            book.isMature   = (post.isMature == "1");
            book.link       = post.link;
            book.thumbnail  = post.thumbnail;
            book.isWishlist = (post.isWishlist == "1");
            book.isRead     = (post.isRead == "1");
            book.lang       = post.lang;

            book.save(function(err){

                // Data validation failed ?
                if(err) {
                    req.flash('error', err);
                    req.flash('data', post);
                } else {
                    req.flash('success', 'Your book has been successfully updated');
                }
                res.redirect('/book/edit/' + book.id);
            });
        }
    };

    // Export list of books
    this.exportJson = function(req, res) {
        var [q, ] = buildQuery(req);

        Book.find(q, '-insert -_owner -__v', function(_, docs){
            res.set('Content-Disposition', 'attachment; filename="books.json"');
            res.set('Content-type', 'application/octet-stream');
            res.json(docs);
        });
    };

    // Impport list of books
    this.importJson = function(req, res) {
        res.render('book/import', {
            title: 'Import Book List',
            errors: req.flash('errors').pop() || {}
        });
    };
    this.importJsonSubmit = function(req, res) {

        // Get the uploaded file
        upload.single('file')(req, res, function(err){
            var json = [];

            // Error uploading the file?
            if(err) {
                // pass

            // Is .json file?
            } else if(req.file.mimetype != "application/json") {
                err = 'You should upload a .json file';

            // Contains valid json?
            } else {
                var txt = fs.readFileSync(req.file.path, 'utf8');
                try {
                    json = JSON.parse(txt);
                } catch(SyntaxError) {
                    err = 'The file contains invalid JSON';
                }
            }
            if(err) {
                req.flash('error', err);
                return res.redirect('/import');
            }

            // Import books
            var errors   = [],
                stack    = [],
                nupdate  = 0;

            // Create Book object from JSON
            for(var i=0; i<json.length; i++) {
                var data = json[i];
                if(!data.title) {
                    errors.push('Book ' + i + ': "title" is missing');

                } else {
                    var _id    = data._id,
                        _owner = req.user.id,
                        u;

                    delete data._id;
                    delete data.insert;
                    data._owner = _owner;

                    if(_id) {
                        u= Book.update({_id, _owner}, data, {upsert: true})
                            .then(function(res) {
                                nupdate += res.nModified || 0;
                            });
                    } else {
                        u= Book.create(data)
                            .then(function() {
                                nupdate += 1;
                        });
                    }
                    stack.push(u);
                }
            }

            // Wait until all update are completed
            Promise.all(stack).then(function(){
                if(errors.length) {
                    req.flash('errors', errors);
                }
                req.flash('success', nupdate + (nupdate == 1 ? ' book has' : ' books have') + ' been updated');
                res.redirect('/import');
           });
        });
    };
}

module.exports = new BookHandler();
