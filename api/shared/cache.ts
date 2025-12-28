import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { oneHourInMs } from './util';

const isCacheCurrent = (data) => {
    if (!data || !(data.timestamp > 0) || Date.now() - data.timestamp > oneHourInMs/2) {
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
    return data?.value;
}

export const putCachedData = (dataId, data) => {
    const cacheEntry = {
        value: data,
        timestamp: Date.now()
    };
    if (process.env.DEPLOYMENT_ENV === 'dev') {
        if (!existsSync('./cache')) {
            mkdirSync('./cache');
        }
        writeFileSync(`./cache/${dataId}.json`, JSON.stringify(cacheEntry, undefined, ' '));
    }
}
