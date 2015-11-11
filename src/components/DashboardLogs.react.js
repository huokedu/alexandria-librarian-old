import React from 'react';
import ReactDOM from 'react-dom';
import LogStore from '../stores/logStore';

export
default React.createClass({
    getInitialState() {
        return {
            logs: []
        };
    },
    componentDidMount() {
        this.update();
        this.scrollToBottom();
        LogStore.on(LogStore.SERVER_LOGS_EVENT, this.update);
    },
    componentDidUpdate() {
        this.scrollToBottom();
    },
    componentWillUnmount() {
        LogStore.removeListener(LogStore.SERVER_LOGS_EVENT, this.update);
    },
    scrollToBottom() {
        var textarea = ReactDOM.findDOMNode(this.refs.logsTextarea);
        textarea.scrollTop = textarea.scrollHeight;
    },
    update() {
        if (this.isMounted()) {
            this.setState({
                logs: LogStore.logs()
            });
        }
    },
    handleCopyClipboard() {

        require('remote')
            .require('clipboard')
            .writeText(this.state.logs.join("\n"));

        require('remote')
            .require('dialog')
            .showMessageBox({
                type: 'info',
                title: 'Log Copied',
                buttons: ['OK'],
                message: 'Your log file has been copied successfully.'
            });
    },
    handleExportLogs() {
        var args = {
            title: 'Select path for log file',
            filters: [{
                name: 'Log files',
                extensions: ['log']
            }]
        };
        var dialog = require('remote').require('dialog');
        dialog.showSaveDialog(args, function(filename) {
            require('fs')
                .writeFile(filename, this.state.logs.join("\n"), function(err) {
                    if (err) {
                        dialog.showErrorBox('Unable to save log path', 'Looks like we can\'t save the log file. Try again with another path.')
                    } else {
                        dialog.showMessageBox({
                            type: 'info',
                            title: 'Log saved !',
                            buttons: ['OK'],
                            message: 'Your log file has been saved successfully.'
                        });
                    }
                }.bind(this));
        }.bind(this));
    },
    render() {
        var logs = this.state.logs.join('\n');
        return (
            <section>
                <h1 className="title">Console output</h1>
                <textarea ref="logsTextarea" className="logs" name="description" value={logs} readOnly />
                <button className="left" type="submit" onClick={this.handleExportLogs}><p>Export</p></button>
                <button className="left" type="submit" onClick={this.handleCopyClipboard}><p>Copy to clipboard</p></button>
            </section>
        );
    }
});