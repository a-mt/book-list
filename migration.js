var Book = require('./app/models/book.js');

/*
var cursor = Book.find();
console.log(cursor);
while (cursor.hasNext()) {
  var doc = cursor.next();
  Book.updateOne({_id : doc._id}, {$set : {
      isWishlist : parseInt(doc.isWishlist)
  }});
}*/
/*
Book.find().then(function(docs){
    var n = docs.length,
        c = n;

    docs.forEach((doc) => {
        doc.isWishlist = parseInt(doc.isWishlist);
        doc.save((err) => {
            c--;
            if(err) {
                console.error(err);
            }
            if(c == 0) {
                console.log(`Database upgraded. (${n} documents)`);
            }
        });
    });
});
*/

Book.find().then((books) => {
    var n = books.length,
        c = n;
    
    books.forEach(function(book) {
        const updateQuery = {
            $set: {
                isWishlist: parseInt(book.isWishlist, 10),
            },
        };
        Book.updateOne({_id : book._id}, updateQuery)
            .then(() => {
                c--;
                if(c == 0) {
                    console.log(`Database upgraded. (${n} documents)`);
                }
            })
            .catch((err) => {
                console.error(err);
            });
    });
});
