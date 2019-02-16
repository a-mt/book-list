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
4. Install the dependencies

       npm install

## Run

    npm start