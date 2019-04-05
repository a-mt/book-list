var express  = require('express'),
    app      = express(),
    fs       = require('fs'),
    {google} = require('googleapis'),
    http     = require('http'),
    https    = require('https'),
    Book     = require('./app/models/book');

//+--------------------------------------------------------
require('dotenv').load(); // load .env variables

// Connect DB
var mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useCreateIndex: true
});
mongoose.Promise = global.Promise;

//+--------------------------------------------------------
// Handle Google Drive Auth

/* Google Drive onyl supports OAuth 2.0
 * https://developers.google.com/drive/api/v2/about-auth
 */
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_API_CLIENT_ID,
  process.env.GOOGLE_API_CLIENT_SECRET,
  process.env.GOOGLE_AUTH_REDIRECT_URL
);
google.options({auth: oauth2Client});

var scopes = [
    'https://www.googleapis.com/auth/drive'
];
var credentialsPath = ".credentials.json";

app.get('/', function(req, res){

    // If the user already authorized the app: continue
    if (fs.existsSync(credentialsPath)) {
        fs.readFile(credentialsPath, 'utf8', function(err, data){
            if(err){
                console.log(err);
            } else {
                var tokens = JSON.parse(data);
                oauth2Client.credentials = tokens;
                run(res);
            }
        });

    // If not: open Google authorization page
    } else {
        const authorizeUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes.join(' '),
        });
        res.redirect(authorizeUrl);
    }
});

app.get('/oauth2callback', function(req, res){
    var code = req.query.code;

    oauth2Client.getToken(code).then(({tokens}) => {
        oauth2Client.credentials = tokens;

        fs.writeFile(credentialsPath, JSON.stringify(tokens), 'utf8', function(err) {
            if(err) {
                console.log(err);
            }
            res.json(tokens);
        });
    });
});

//+--------------------------------------------------------
// Import thumbnails
async function run(res) {

    /*Book.find({ tc: true }, function(_, docs){
        res.json(docs);
    });
    return;*/

    const drive = google.drive({ version: 'v3' });

    // Prepare async answer
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.flushHeaders();
    res.write('<pre>');

    var count   = 0,
        errors  = 0,
        running = 0,
        ended   = false;

    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

    /**
     * Called after each document is updated
     * Send partial response to client until we reached the last document
     */
    function feedback(){
        running--;
        res.write('.');

        if(ended && !running) {
            res.write('</pre>');
            res.write('<br>' + count + ' thumbnail(s) imported');
            if(errors) {
                res.write('<br>Something went wrong. Check the console.');
            }
            res.end();
        }
    }

    /**
     * Called for each document which needs to upload a thumbnail
     */
    async function importThumbnail(doc) {
        running++;
        sleep(120); // just to avoid sending to many requests at once

        var url = doc.thumbnail;

        // Get thumbnail
        (url.indexOf('https://') == 0 ? https : http).get(url, file => {

            // Feed input stream to Google Drive API upload
            drive.files.create({
                resource: {
                    'name': doc._id + '.png',
                    parents: [ process.env.GOOGLE_DRIVE_FOLDER ]
                },
                media: {
                    mimeType: 'image/png',
                    body: file
                },
                fields: 'id'

            // When it's done
            }, function(err, subres) {
                if(err) {
                    console.log("Err uploading document", err);
                    errors++;
                    feedback();

                } else {
                    // View: https://drive.google.com/file/d/FILE_ID/view
                    // Raw : https://drive.google.com/uc?export=view&id=FILE_ID
                    var id = subres.data.id,
                        url = "https://drive.google.com/uc?export=view&id=" + id;

                    // Set the new url of the thumbnail
                    updateDocument(doc, url);
                }
            });
        });
    }

    /**
     * Called after the thumbnail has been uploaded to Google Drive
     */
    function updateDocument(doc, newUrl) {
        Book.updateOne({ _id: doc._id }, { $set: {
            thumbnail: newUrl,
            tc       : true

        }}, function(err){
            if(err) {
                console.log("Err saving document", err);
                errors++;
                feedback();
            } else {
                console.log(doc._id, doc.title, newUrl);
                count++;
                feedback();
            }
        });
    }

    function sleep(ms){
        return new Promise(resolve => { setTimeout(resolve, ms) });
    }

    // Loop books
    var n = 0;

    Book.find({ tc: null }, 'title thumbnail')
        //.limit(30)
        .stream()
        .on('data', function(doc){
            if(!doc.thumbnail || errors) {
                return;
            }
            n++;
            importThumbnail(doc);
        })
        .on('error', function(err){
            console.log(err);
        })
        .on('end', function(){
            ended = true;
            if(!n) {
                res.write('</pre> Up to date');
                res.end();
            }
        });
}

// Start server
var port = 8081;
app.listen(port, function(){
   console.log('The server is listening on port ' + port);
});