# MyMinimums

## Setup

* `npm install -g azurite`
* Make a temp folder
* In the web folder: `npm install`
* In the api folder: `npm install`

## Run Locally

* In the temp folder: `azurite --location .\azurite --debug azurite-debug.log`
* In the api folder: `npm start` and `npm run watch` in separate terminals
* In the web folder: `npm start`

Use Azure Storage Explorer to inspect local blob storage.

For debugging, ensure Azure Functions Core Tools are installed: https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local