# Book list

Features:
* List the books you own
* Mark as read
* Create a wishlist

Use cases:
* As an authenticated user, you can
  * View the books you own
  * Add a book you own, using Google Books API
  * Add a book you wish to have
  * Mark as read

## Install

1. Create a new [Google project](https://console.developers.google.com/projectselector/apis/credentials),
   generate an API key, and activate Google Books API for this project
2. Create a [MongoDB database](http://mlab.com/), and create an user for this database
3. Copy `.env.example` to `.env` and update the variables in it
4. Set the current node version

       npm install -g n
       n 16.20.2
       cd /srv

5. Install the dependencies

       npm install

## Run

    npm start

## Dev notes

### Import thumbnails

- Create an app
    - Activate Google Drive API
    - Create Credentials: OAuth client ID
    - In OAuth consent screen, add the current host
    - In the details of the created client ID,
      add https://yourapp:8081/oauth2callback to the Authorized redirect URIs
    - Update the .env file

- Create a folder in Google Drive
    - Get the sharing link of the folder (to make the folder public)
    - Copy the ID of the folder
    - Update the .env file

- Start webserver via node importThumbnails.js
- Go to https://yourapp:8081

### Update node

    nvm install stable
    npm i npm-check-updates
    ncu -u
    npm install
