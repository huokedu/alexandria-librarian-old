import React from 'react/addons';
import Router from 'react-router';
import utils from '../utils/util';
import fs from 'fs';
import path from 'path';


var About = React.createClass({
    mixins: [Router.Navigation],

    getInitialState: function() {
        return {
            contributors: {},
            lisence: '',
            version: ''
        }
    },
    componentDidMount: function() {
        this.getContributors();
        this.getLisence();
    },
    getLisence: function() {
        var self = this;
        fs.readFile(path.normalize(path.join(__dirname, '../../', 'LICENSE.md')), function(err, data) {
            if (err) return console.log(err);
            self.setState({
                lisence: data
            });
        })
    },
    getContributors: function() {

    },

    openGithub: function(e) {
        var username = e.target.getAttribute('data-github');
        utils.openUrl('https://github.com/' + username)
    },

    render: function() {
        var Contributors = [{
            name: 'Luigi Poole',
            email: 'luigipoole@outlook.com',
            github: 'luigiplr'
        }, {
            name: 'Niv Sardi',
            email: 'xaiki@debian.org',
            github: 'Xaiki'
        }, {
            name: 'Devon Read',
            email: 'devon@blocktech.com',
            github: 'DevonJames'
        }, {
            name: 'Avery Dodd',
            email: 'averyhvdodd@gmail.com',
            github: 'AveryDodd'
        }];
        var version = 'v0.5.2 α';



        return (
            <div className="content-scroller" id="content">
                <section>
                    <h1 className="title">About</h1>
                    <p className="about" >This is a prototype developer build, and is not representative of the final product.</p>
                    <br/>
                <p className="about" >ΛLΞXΛNDRIΛ Librarian, {this.state.version} </p>
                </section>
                <section>
                    <h1 className="title">Contributors</h1>
                        {Contributors.map(function(Contributor, i) {
                            return (
                                        <p className="Contributor">{Contributor.name} {'<' + Contributor.email + '>'} <i data-github={Contributor.github}  onClick={this.openGithub} className="ion-social-github" /></p>
                                    );
                        }, this)}             
                 </section>
                <section>
                    <h1 className="title">License</h1>
                    <textarea className="License"  value={this.state.lisence} readOnly />
                </section>
            </div>
        );
    }
});

module.exports = About;