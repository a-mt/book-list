var bookHandler       = require(process.cwd() + '/app/controllers/book.js'),
    thumbnailsHandler = require(process.cwd() + '/app/controllers/importThumbnails.js');

module.exports = function(app) {

    // Login / logout
    require('./auth')(app);

    // Homepage
    app.get('/', bookHandler.index);
    app.get('/books/:userid', bookHandler.index);

    // Add book
    app.post('/book/search', bookHandler.search);

    app.route('/book/new')
       .get(global.isLoggedIn, bookHandler.add)
       .post(global.isLoggedIn, bookHandler.addSubmit);

    // Edit book
    app.route('/book/edit/:id')
       .get(global.isLoggedIn, bookHandler.isBook, bookHandler.edit)
       .post(global.isLoggedIn, bookHandler.isBook, bookHandler.editSubmit);

    // Import/export JSON
    app.get('/export', bookHandler.exportJson);
    app.get('/export/:userid', bookHandler.exportJson);

    app.route('/import')
       .get(global.isLoggedIn, bookHandler.importJson)
       .post(global.isLoggedIn, bookHandler.importJsonSubmit);

    // Import thumbnails
    app.get('/importThumbnails', thumbnailsHandler.importThumbnails);
    app.get('/oauth2callback', thumbnailsHandler.oauth2callback);
};