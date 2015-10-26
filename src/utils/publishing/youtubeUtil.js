import Promise from 'bluebird';
import remote from 'remote';
import path from 'path';
import electronGoogleOauth from 'electron-google-oauth';



module.exports = {
    getAuthorization: function(creds) {
        const googleOauth = electronGoogleOauth(remote.require('browser-window'), {
            'use-content-size': true,
            center: true,
            'standard-window': true,
            'auto-hide-menu-bar': true
        });

        var OAuthCreds = require(path.join(__dirname, '../../../', 'OAuth.json'));

        return new Promise((resolve, reject) => {


            // retrieve access token and refresh token 
            const result = googleOauth.getAccessToken(
                ['https://www.googleapis.com/auth/youtube.force-ssl'],
                OAuthCreds.googleClientID,
                OAuthCreds.googleClientSecret
            );
            console.dir(result);

        });
    },
    download: function() {
        return new Promise((resolve, reject) => {

        });
    },
    getAll: function() {

    },
    info: function(url, creds) {
        return new Promise((resolve, reject) => {

        });
    }
}