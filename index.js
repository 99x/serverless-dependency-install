'use strict';

const BbPromise = require('bluebird'),
    di = require('dependency-install'),
    fs = require('fs'),
    mkdirp = require('mkdirp'),
    _ = require('lodash'),
    jsonfile = require('jsonfile'),
    path = require('path');

module.exports = function(S) {

    const SCli = require(S.getServerlessPath('utils/cli')),
        SUtils = S.utils;

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
                context: 'dependency',
                contextAction: 'create',
                options: [{
                    option: 'name',
                    shortcut: 'n',
                    description: 'Creates a new dependency in shared directory.'
                }]
            });
            S.addAction(this.install.bind(this), {
                handler: 'dependencyRemove',
                description: 'Install dependencies of functions',
                context: 'dependency',
                contextAction: 'install'
            });
            S.addAction(this.attach.bind(this), {
                handler: 'dependencyAttach',
                description: 'Attach dependency to functions',
                context: 'dependency',
                contextAction: 'attach',
                options: [{
                    option: 'name',
                    shortcut: 'n',
                    description: 'Creates a new dependency in shared directory.'
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
            let _this = this,
                createDependency = function() {
                    let dependencyName = evt.options.name,
                        sharedDirPath = S.getProject().custom.shared || S.getProject().getRootPath() + "/shared",
                        dependencyPath = path.join(sharedDirPath + "/" + dependencyName),
                        indexJs = fs.readFileSync(path.dirname(__filename) + '/template/index.js');

                    if (!SUtils.dirExistsSync(dependencyPath)) {
                        mkdirp.sync(dependencyPath);
                        fs.writeFileSync(path.join(dependencyPath, 'index.js'), indexJs);
                        SCli.log("Dependency created successfully".yellow);
                    } else {
                        SCli.log("Dependency package already exists".red);
                    }
                };
            _this.evt = evt;

            return _this._prompt()
                .bind(_this)
                .then(createDependency);

        }

        install() {
            return new BbPromise(function(resolve) {
                di.init(S.getProject().custom.shared || S.getProject().getRootPath() + "/shared");
                di.install([S.getProject().getRootPath()], function() {
                    SCli.log("Dependencies installed successfully.");
                });
            });
        }

        attach(evt) {
            let _this = this;
            _this.evt = evt;
            _this.project = S.getProject();
            _this.evt.options.selectedFunctions = [];

            return _this._prompt()
                .bind(_this)
                .then(_this._captureFunctions)
                .then(_this._processFunctions);
        }

        _prompt() {

            let _this = this,
                overrides = {
                    name: _this.evt.options.name
                };

            if (!S.config.interactive) return BbPromise.resolve();

            return BbPromise
                .try(() => {
                    // If name exists, skip
                    if (_this.evt.options.name) return;

                    let prompts = {
                        properties: {
                            name: {
                                description: 'Enter the name of dependency: '.yellow,
                                message: 'Dependency name must contain only letters, numbers, hyphens, or underscores. It should not be longer than 20 characters.',
                                required: true,
                                conform: function(functionName) {
                                    return S.classes.Function.validateName(functionName);
                                }
                            }
                        }
                    };

                    return _this.cliPromptInput(prompts, overrides)
                        .then(answers => _this.evt.options.name = answers.name);
                });
        }

        _captureFunctions() {
            let _this = this,
                functions = SUtils.getFunctionsByCwd(_this.project.getAllFunctions()),
                choices = [];

            _.each(functions, function(func) {

                choices.push({
                    key: '  ',
                    value: func.getName(),
                    label: `Function - ${func.getName()}`,
                    type: 'function'
                });

            });


            return _this.cliPromptSelect('Select the functions you wish to attach the dependency:', choices, true, 'Attach')
                .then(function(items) {
                    for (let i = 0; i < items.length; i++) {
                        if (items[i].toggled) {
                            if (items[i].type === "function") _this.evt.options.selectedFunctions.push(items[i].value);
                        }
                    }

                    // Blank space for neatness in the CLI
                    console.log('');
                });
        }

        _processFunctions() {
            let _this = this;

            if (_this.evt.options.selectedFunctions && _this.evt.options.selectedFunctions.length > 0) {
                _(_this.evt.options.selectedFunctions).forEach(function(funcName) {
                    let func = _this.project.getFunction(funcName),
                        funcPackageJsonPath = path.join(func.getRootPath(), "package.json");

                    jsonfile.readFile(funcPackageJsonPath, function(err, obj) {
                        if (!obj.customDependencies) {
                            obj.customDependencies = {};
                        }
                        obj.customDependencies[_this.evt.options.name] = "local";
                        jsonfile.writeFileSync(funcPackageJsonPath, obj, {
                            spaces: 2
                        });
                    });

                });
            } else {
                return BbPromise.resolve();
            }
        }

    }

    return DependencyInstall;
};
