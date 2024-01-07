import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { oneHourInMs } from './util';

const isCacheCurrent = (data) => {
    if (!data || Date.now() - data.downloaded > oneHourInMs/2) {
        return false;
    }
    return true;
};

export const getCachedData = (dataId) => {
    let data;
    const cacheFilePath = `./cache/${dataId}.json`;
    if (process.env.DEPLOYMENT_ENV === 'dev' && existsSync(cacheFilePath)) {
        data = JSON.parse(readFileSync(cacheFilePath, 'utf8'));
        if (!isCacheCurrent(data)) {
            data = undefined;
        }
    }
    return data;
}

export const putCachedData = (dataId, data) => {
    data.downloaded = Date.now();
    if (process.env.DEPLOYMENT_ENV === 'dev') {
        if (!existsSync('./cache')) {
            mkdirSync('./cache');
        }
        writeFileSync(`./cache/${dataId}.json`, JSON.stringify(data, undefined, ' '));
    }
}
