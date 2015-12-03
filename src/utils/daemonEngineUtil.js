import Promise from 'bluebird';
import child_process from 'child_process';
import DecompressZip from 'decompress-zip';
import fs from 'fs';
import fsExtra from 'fs-extra';
import child from 'child';
import path from 'path';
import ps from 'xps';
import ipfsAPI from 'ipfs-api';
import chmod from 'chmod';
import _ from 'lodash';
import {
    app, dialog
}
from 'remote';
import DaemonActions from '../actions/daemonEngineActions';
import DaemonStore from '../stores/daemonEngineStore';

const killPID = pid => {
    return new Promise((resolve, reject) => {
        ps.kill(pid).fork(
            error => {
                reject(error);
            }, () => {
                resolve(true);
            }
        );
    });
}

const copy = (input, output) => {
    return new Promise((resolve, reject) => {
        fsExtra.copy(input, output, err => {
            if (err)
                return reject(err)
            resolve();
        })
    });
}

const exec = (execPath, args = [], options = {}) => {
    return new Promise((resolve, reject) => {
        child_process.exec(execPath + ' ' + args.join(' '), options, (error, stdout, stderr) => {
            if (error) {
                console.error(stderr);
                return reject(stderr)
            }
            console.log(stdout);
            resolve(stdout);
        });
    });
}

const generateAPI = daemon => {
    switch (daemon) {
        case 'ipfs':
            return ipfsAPI('/ip4/127.0.0.1/tcp/5001');
            break;
        case 'florincoind':
            return false;
            break;
        case 'libraryd':
            return false;
            break;
    }
}

const extractZIP = (sourcePath, targetPath) => {
    let files = [];
    return new Promise((resolve, reject) => {
        new DecompressZip(sourcePath)
            .on('error', reject)
            .on('extract', log => {
                files.forEach(file => {
                    chmod(path.join(targetPath, file.path), {
                        read: true,
                        write: true,
                        execute: true
                    });
                });
                resolve();
            })
            .extract({
                path: targetPath,
                filter: entry => {
                    return files.push({
                        path: entry.path,
                        mode: entry.mode.toString(8)
                    });
                }
            });
    });
}

const checkStartedOkay = (daemon, out) => {
    switch (daemon) {
        case 'ipfs':
            var okay = ['Daemon is ready'];
            break;
        case 'florincoind':
            break;
        case 'libraryd':
            break;
    }
    return new RegExp(okay.join('|')).test(out);
}

const checkStartedFail = (daemon, out) => {
    switch (daemon) {
        case 'ipfs':
            var fail = ['no ipfs repo found', 'repo.lock": has non-zero size', 'ipfs daemon is running'];
            break;
        case 'florincoind':
            break;
        case 'libraryd':
            break;
    }
    return new RegExp(fail.join('|')).test(out);
}

const fileExists = filePath => {
    try {
        return fs.statSync(filePath).isFile();
    } catch (err) {
        return false;
    }
}

const checkInstalledOkay = (daemon, out) => {
    switch (daemon) {
        case 'ipfs':
            var okay = ['ipfs configuration file already exists', 'to get started, enter:', 'generating 2048-bit RSA keypair...done'];
            break;
        case 'florincoind':
            break;
        case 'libraryd':
            break;
    }
    return new RegExp(okay.join('|')).test(out);
}

const loadFlorincoinConf = () => {
    return new Promise((resolve, reject) => {

        let confFile = path.join(app.getPath('appData'), 'Florincoin', 'Florincoin.conf');

        let auth = [
            'rpcuser=user',
            'rpcpassword=password'
        ];

        let conf = [
            'rpcallowip=127.0.0.1',
            'rpcport=18322',
            'rpcallowip=127.0.0.1',
            'rpcallowip=192.168.*.*',
            'server=1',
            'daemon=1',
            'txindex=1'
        ];

        let nodes = [
            '54.209.141.153',
            '192.241.171.45',
            '146.185.148.114',
            '54.164.167.95',
            '198.27.69.59',
            '37.187.27.4'
        ];

        if (fileExists(confFile)) {
            let oldConf = fs.readFileSync(confFile, 'utf8');
            DaemonActions.enabling({
                id: 'florincoind',
                code: 3,
                task: 'Waiting for User Input...',
                percent: 60
            });
            dialog.showMessageBox({
                noLink: true,
                type: 'question',
                title: 'Alexandria Librarian: Information',
                message: 'Pre-Exsisting Florincoin config detected!',
                detail: 'Florincoin daemon requires new entrys to be added to your configuration file, would you like Librarian to automatically add them? (old configuration will be backed up).',
                buttons: ['Yes', 'No']
            }, code => {
                if (code === 1) {
                    DaemonActions.enabling({
                        id: 'florincoind',
                        code: 8,
                        error: 'Installation Aborted'
                    });
                    reject();
                } else {
                    copy(confFile, path.join(app.getPath('appData'), 'Florincoin', 'Florincoin.conf.backup'))
                        .then(() => {
                            fs.unlink(confFile, () => {
                                nodes.forEach(node => {
                                    conf.push('addnode=' + node);
                                });

                                fs.writeFile(confFile, conf.join('\n'), (err, data) => {
                                    if (err) return reject(err);
                                    resolve();
                                });
                            });
                        })
                        .catch(() => {
                            DaemonActions.enabling({
                                id: 'florincoind',
                                code: 8,
                                error: 'Problem backing up pre-exsisting configuration; Installation Aborted'
                            });
                            reject();
                        })
                }
            });
        } else {
            nodes.forEach(node => {
                conf.push('addnode=' + node);
            });

            console.log(conf.join('\n'))

        }

    });
}



module.exports = {

    binDir: path.join(process.cwd(), 'resources/bin'),
    installDir: path.join(app.getPath('userData'), 'bin'),

    enable(daemon) {
        DaemonActions.enabling({
            id: daemon.id,
            code: 4
        });
        let installPath = path.join(this.installDir, this.getExecName(daemon.id));
        let daemonObj = this.generate({
            exec: installPath,
            id: daemon.id
        }, daemon.args);
        try {
            daemonObj.start(pid => {
                DaemonActions.enabled({
                    daemon: daemonObj,
                    id: daemon.id,
                    pid: pid
                });
            });
        } catch (e) {
            console.error(e);
            DaemonActions.enabling({
                id: daemon.id,
                code: 8,
                error: 'Initialization Error'
            });
        }
    },

    disable(daemon) {
        if (DaemonStore.getState().enabled[daemon].daemon)
            DaemonStore.getState().enabled[daemon].daemon.stop(DaemonActions.disabled.bind(this, daemon));
    },

    install(daemon, unzip = false) {
        return new Promise((resolve, reject) => {
            DaemonActions.enabling({
                id: daemon.id,
                code: 2
            });
            if (!unzip) {
                let execName = this.getExecName(daemon.id)
                let installPath = path.join(this.installDir, execName);
                let sourcePath = path.join(this.binDir, execName);

                copy(sourcePath, installPath)
                    .then(() => {
                        return new Promise(resolve => {
                            chmod(installPath, {
                                read: true,
                                write: true,
                                execute: true
                            });
                            resolve();
                        });
                    })
                    .then(this.checkConfig.bind(this, daemon))
                    .then(opts => {
                        let execCMD = (process.platform === 'win32') ? installPath : "'" + installPath + "'";
                        exec(execCMD, daemon.args, {
                            cwd: this.installDir
                        })
                            .then(output => {
                                if (checkInstalledOkay(daemon.id, output)) {
                                    DaemonActions.enabling({
                                        id: daemon.id,
                                        code: 3
                                    });
                                    resolve();
                                } else {
                                    DaemonActions.enabling({
                                        id: daemon.id,
                                        code: 8,
                                        error: 'Installation Error'
                                    });
                                    reject();
                                }
                            })
                            .catch(output => {
                                if (checkInstalledOkay(daemon.id, output)) {
                                    DaemonActions.enabling({
                                        id: daemon.id,
                                        code: 3
                                    });
                                    resolve();
                                } else {
                                    DaemonActions.enabling({
                                        id: daemon.id,
                                        code: 8,
                                        error: 'Installation Error'
                                    });
                                    reject();
                                }
                            });
                    })
                    .catch(reject);

            } else {
                extractZIP(this.getExecName(daemon.id, true), this.installDir)
                    .then(this.checkConfig.bind(this, daemon))
                    .then(() => {



                    })
                    .catch(reject);

            }


        });
    },
    generate(daemon, args, autoRestart = false, detached = false) {
        return child({
            command: daemon.exec,
            args: args,
            options: {
                detached: detached
            },
            autoRestart: autoRestart,
            restartTimeout: 200,
            cbRestart: data => {
                if (data)
                    console.log(daemon.id + ':', 'restarting with PID:', data.toString());
            },
            cbStdout: data => {
                if (data) {
                    console.log(daemon.id + ':', data.toString());

                    if (checkStartedOkay(daemon.id, data.toString())) {
                        DaemonActions.enabling({
                            id: daemon.id,
                            code: 7
                        });
                        let api = generateAPI(daemon.id);
                        if (api)
                            DaemonActions.update({
                                id: daemon.id,
                                key: 'api',
                                api: api
                            });
                    }
                }
            },
            cbStderr: data => {
                if (data) {
                    console.error(daemon.id + ':', data.toString());

                    if (checkStartedFail(daemon.id, data.toString())) {
                        DaemonActions.enabling({
                            id: daemon.id,
                            code: 8,
                            error: 'Initialization Error'
                        });
                    }
                }
            },
            cbClose: exitCode => {
                if (exitCode) {
                    console.log(daemon.id + ':', 'exiting with code:', exitCode.toString());
                }
            },
        });
    },


    checkInstalled(daemon) {

        DaemonActions.enabling({
            id: daemon,
            code: 1
        });
        let daemonPath = path.join(this.installDir, this.getExecName(daemon))
        console.log(daemonPath);

        return new Promise((resolve) => {
            fs.stat(daemonPath, (err, status) => {
                if (err) return resolve(false);
                resolve(status);
            });
        });
    },

    shutdown(daemon) {
        return new Promise((resolve, reject) => {
            if (daemon.daemon)
                daemon.daemon.stop(resolve);
            else
                return killPID(daemon.pid)
        });
    },

    checkRunning(daemon) {
        return new Promise((resolve, reject) => {
            ps.list().fork(
                error => {
                    reject(error);
                },
                list => {
                    resolve(_.filter(list, value => {
                        if (value.name === daemon) return value;
                    })[0]);
                }
            );
        });
    },

    checkConfig(daemon) {
        switch (daemon.id) {
            case 'ipfs':
                return true;
                break;
            case 'florincoind':
                return loadFlorincoinConf();
                break;
            case 'libraryd':
                return true;
                break;
        }
    },

    getExecName(daemon, extract = false) {
        switch (daemon) {
            case 'ipfs':
                return (process.platform === 'win32') ? 'ipfs.exe' : 'ipfs';
                break;
            case 'florincoind':
                if (extract)
                    return 'florincoind.zip'
                else
                    return (process.platform === 'win32') ? 'florincoind.exe' : 'florincoind';
                break;
            case 'libraryd':
                return (process.platform === 'win32') ? 'libraryd.exe' : 'libraryd';
                break;

        }
    }
}