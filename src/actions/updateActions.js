import ipc from 'ipc';
import alt from '../alt';


class updateActions {

    constructor() {
        this.generateActions(
            'mainUpdateFound',
            'daemonUpdatesFound',
            'notificationShown' // added to check if notification is already shown
        );
    }


    download(hash, type) {
        var UpdaterUtil = require('../utils/updaterUtil');
        this.dispatch();

        switch(type) {
          case 'app':
            // Download app update
            console.log(hash);
            console.log(type);
            break;
          case 'ipfs':
            // Download ipfs update
            break;
          case 'libraryd':
            // Download libraryd update
            break;
        }

    }

    install(update, type) {
        var UpdaterUtil = require('../utils/updaterUtil');
        this.dispatch();


    }

}


export
default alt.createActions(updateActions);