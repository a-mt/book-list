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

0. Copy `.env.example` to `.env`

1. Set up the Google Books API

    1. Create a new [Google project](https://console.developers.google.com/projectselector/apis/credentials)

    1. Activate Google Books API for this project:  
       API and services > enable APIs and services > books

    1. Generate an API key:  
       API and services > credentials > Create credentials > API key  
       Restrain the key to the Books API

    1. Update GOOGLE_BOOK_API_KEY in the `.env` file

2. Set up the Database

    * Option 1: using a local database (ie docker-compose.local):

        2. Update MONGO_URI_BASE in the `.env` file

            ```
            MONGO_URI="mongodb://mongo/book-list?retryWrites=true&w=majority"
            ```

    * Option 2: using a remote database on Mongo Atlas:

        2. Create a [MongoDB database](https://account.mongodb.com/account/login)

        2. Create an user for this database

        2. Retrieve the cluster's URL:  
           Clusters > connect > compass > connection string

        2. Update MONGO_URI_BASE in the `.env` file:  
           (remember to update the user:password@cluster)

            ```
            MONGO_URI="mongodb+srv://user:password@cluster_location.mongodb.net/book-list?retryWrites=true&w=majority"
            ```

3. Optional: set the current node version

       npm install -g n
       n 22.17.1
       cd /srv

4. Install the dependencies

       npm install

## Run

    npm start

---


## Dev notes

### Update node

    nvm install stable
    npm i npm-check-updates
    ncu -u
    npm install

### Deploy on App Engine

* Deploy

    ```
    gcloud app deploy
    ```

* Go to https://PROJECT_ID.REGION_ID.r.appspot.com/submit

    ```
    gcloud app browse
    ```

* To know how long your app has runned, check the logs:  
  https://console.cloud.google.com/logs/viewer?resource=gae_app&hl=fr

  Or to stream them to the console:

  ```
  gcloud app logs tail -s default
  ```

* Delete the older version in the "Versions" page of the Google Cloud console:  
  https://console.cloud.google.com/appengine/versions


### Import thumbnails

- Create a folder in Google Drive  
  (with whatever Google account you will log in with on importThumbnails)

    - Get the sharing link of the folder (to make the folder public)

    - Copy the ID of the folder  
        https://drive.google.com/drive/folders/DRIVE_FOLDER_ID?dmr=1&ec=wgc-drive-globalnav-goto

    - Update GOOGLE_DRIVE_FOLDER in the `.env` file

        ```
        GOOGLE_DRIVE_FOLDER="DRIVE_FOLDER_ID"
        ```

- Set up the Google Drive API
    - Activate Google Drive API  
      API and services > enable APIs and services > books

    - Create Credentials  
       API and services > credentials > Create credentials > OAuth client ID 

    - Update GOOGLE_API_CLIENT_ID and GOOGLE_API_CLIENT_SECRET in the `.env` file:

        ```
        GOOGLE_API_CLIENT_ID="CLIENT_ID"
        GOOGLE_API_CLIENT_SECRET="CLIENT_SECRET"
        ```

    - In the details of the created client ID,
      add https://yourapp/oauth2callback to the Authorized redirect URIs

    - Update GOOGLE_AUTH_REDIRECT_URL in the `.env` file:

        ```
        GOOGLE_AUTH_REDIRECT_URL="https://APP.appspot.com/oauth2callback"
        ```

- Go to https://yourapp/importThumbnails
