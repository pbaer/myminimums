"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.putCachedData = exports.getCachedData = void 0;
const fs_1 = require("fs");
const util_1 = require("./util");
const isCacheCurrent = (data) => {
    if (!data || Date.now() - data.downloaded > util_1.oneHourInMs / 2) {
        return false;
    }
    return true;
};
const getCachedData = (dataId) => {
    let data;
    const cacheFilePath = `./cache/${dataId}.json`;
    if (process.env.DEPLOYMENT_ENV === 'dev' && (0, fs_1.existsSync)(cacheFilePath)) {
        data = JSON.parse((0, fs_1.readFileSync)(cacheFilePath, 'utf8'));
        if (!isCacheCurrent(data)) {
            data = undefined;
        }
    }
    return data;
};
exports.getCachedData = getCachedData;
const putCachedData = (dataId, data) => {
    data.downloaded = Date.now();
    if (process.env.DEPLOYMENT_ENV === 'dev') {
        if (!(0, fs_1.existsSync)('./cache')) {
            (0, fs_1.mkdirSync)('./cache');
        }
        (0, fs_1.writeFileSync)(`./cache/${dataId}.json`, JSON.stringify(data, undefined, ' '));
    }
};
exports.putCachedData = putCachedData;
