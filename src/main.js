import remote from 'remote';
import React from 'react';
import ReactDOM from 'react-dom';
import path from 'path';
import Router from 'react-router';
import yargs from 'yargs';

import webUtil from './js/utils/webUtil';
import util from './js/utils/util';
import Settings from './js/utils/settingsUtil';
import HttpAPI from './js/utils/httpApiUtil'
import LogStore from './js/stores/logStore'
import routes from './js/routes';

var app = remote.require('app');

var AppData = path.join(app.getPath('userData'));


// Init process
LogStore.initLogs();
util.createDir(path.join(AppData, 'bin'));
webUtil.addLiveReload();
webUtil.disableGlobalBackspace();
HttpAPI.init();


// Default Route
util.createDir(path.join(AppData, 'bin'));

HttpAPI.toggle(Settings.get('HTTPAPIEnabled'), Settings.get('HTTPAPIPort'))
    .catch(function(e) {
        console.log(e);
        Settings.save('HTTPAPIEnabled', false);
    });



ReactDOM.render(<Router>{routes}</Router>, document.getElementById('app'));