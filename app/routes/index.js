var bookHandler = require(process.cwd() + '/app/controllers/book.js');

module.exports = function(app) {

    // Login / logout
    require('./auth')(app);

    // Homepage
    app.get('/', bookHandler.index);

    // Add book
    app.post('/book/search', bookHandler.search);

    app.route('/book/new')
       .get(global.isLoggedIn, bookHandler.add)
       .post(global.isLoggedIn, bookHandler.addSubmit);

    // Edit book
    app.route('/book/edit/:id')
       .get(global.isLoggedIn, bookHandler.isBook, bookHandler.edit)
       .post(global.isLoggedIn, bookHandler.isBook, bookHandler.editSubmit);

    // Import/export JSon
    app.get('/export', global.isLoggedIn, bookHandler.exportJson);

    app.route('/import')
       .get(global.isLoggedIn, bookHandler.importJson)
       .post(global.isLoggedIn, bookHandler.importJsonSubmit);
};