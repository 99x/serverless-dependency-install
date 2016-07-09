serverless-dependency-install
=============================
[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)
[![npm version](https://badge.fury.io/js/serverless-dependency-install.svg)](https://badge.fury.io/js/serverless-dependency-install)
[![license](https://img.shields.io/npm/l/serverless-dependency-install.svg)](https://www.npmjs.com/package/serverless-dependency-install)

## This Plugin Requires
* Serverless V0.5 or newer

## Features
* Executes npm install for all the package.json files inside serverless project directory with a single command.
* This plugin also allows to define local shared dependencies in package.json.  

## Install Plugin
`npm install --save serverless-dependency-install`

Then in `s-project.json` add following entry to the plugins array: `serverless-dependency-install`
e.g `"plugins": ["serverless-dependency-install"]`

## Using the Plugin
1) Install all the dependencies
`sls dependency install`

2) Create a new local shared dependency.
`sls dynamodb create -n <dependency-name>`
This creates the template code for local shared dependency, inside the directory with the name `shared`, in project root.

### More on local shared dependencies
What if you need to share code, but don't wish to publish packages in NPM Registry? You can use the local shared dependencies.

1. Create a directory(e.g 'local_shared_dependencies') in your codebase to store each local dependency(library) code. Create directories for each of the dependencies with a index.js inside, as shown below.
    ```
    __/local_shared_dependencies
        |__dependency-a
            |__index.js
        |__dependency-b
            |__index.js   
            |__package.json // Optional if you have other npm dependencies
    ```
    
    You can create a dependency-a by executing
    ```
    sls dependency create -n dependency-a
    ```
    
2. In `s-project.json` add `local_shared_dependencies` text to override default directory `shared`
    ```json
    "custom": {
      "shared": "local_shared_dependencies"
    }
    ```

3. Open a package.json file in your code base which depends on a local shared dependency (lets say 'dependency-a' and 'dependency-b') and include the section 'customDependencies', as shown below.
    ```json
    {
        "dependencies": {},
        "dependencies": {
            "dependency-a" : "local",
            "dependency-b" : "local"
        }
    }
    ```
    
3. To install local shared dependencies as well as npm dependencies use the same command
    ```javascript
    sls dependency install
    ```
    
## License
  [MIT](LICENSE)
