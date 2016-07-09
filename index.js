'use strict';

const BbPromise = require('bluebird'),
      di = require('dependency-install');

module.exports = function(S) {

    const SCli = require(S.getServerlessPath('utils/cli'));

    class DependencyInstall extends S.classes.Plugin {

        constructor() {
            super();
            this.name = 'serverless-dependency-install';
        }

        /**
         * Register Actions
         * - If you would like to register a Custom Action or overwrite a Core Serverless Action, add this function.
         * - If you would like your Action to be used programatically, include a "handler" which can be called in code.
         * - If you would like your Action to be used via the CLI, include a "description", "context", "action" and any options you would like to offer.
         * - Your custom Action can be called programatically and via CLI, as in the example provided below
         */
        registerActions() {

            S.addAction(this.create.bind(this), {
                handler: 'dependencyCreate',
                description: 'Create new custom dependency',
                context: 'di',
                contextAction: 'create',
                options: [{
                    option: 'name',
                    shortcut: 'n',
                    description: 'Creates a new dependency in libs directory.'
                }]
            });
            S.addAction(this.remove.bind(this), {
                handler: 'dependencyRemove',
                description: 'Remove a custom dependency',
                context: 'di',
                contextAction: 'remove',
                options: [{
                    option: 'name',
                    shortcut: 'n',
                    description: 'Removes a dependency in libs directory.'
                }]
            });
            S.addAction(this.install.bind(this), {
                handler: 'dependencyRemove',
                description: 'Install dependencies of functions',
                context: 'di',
                contextAction: 'install',
                options: [{
                    option: 'install',
                    shortcut: 'i',
                    description: 'Install dependencies of all functions'
                }]
            });

            return BbPromise.resolve();
        }

        /**
         * Custom Action Example
         * - Here is an example of a Custom Action.  Include this and modify it if you would like to write your own Custom Action for the Serverless Framework.
         * - Be sure to ALWAYS accept and return the "evt" object, or you will break the entire flow.
         * - The "evt" object contains Action-specific data.  You can add custom data to it, but if you change any data it will affect subsequent Actions and Hooks.
         * - You can also access other Project-specific data @ this.S Again, if you mess with data on this object, it could break everything, so make sure you know what you're doing ;)
         */
        create(evt) {
            // TODO: Implement custom dependency creation in libs
        }

        remove() {
            // TODO: Implement custom dependency removal in libs
        }

        install() {
            var paths = [S.getProject().getRootPath()];
            di.init(paths[0] + "/libs");
            di.install(paths, function() {
                SCli.log("Dependencies installed successfully.");
            });
        }

    }

    return DependencyInstall;
};
