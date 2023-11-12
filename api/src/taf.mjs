//import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { parseTAFAsForecast, getCompositeForecastForDate } from 'metar-taf-parser';
import fetch from 'node-fetch';
import { applyMinimums } from './minimums.mjs';
import { oneHourInMs, eachHourOfInterval } from './util.mjs';

const isTafCacheCurrent = (taf) => {
    if (!taf || Date.now() - taf.downloaded > oneHourInMs/2) {
        return false;
    }
    return true;
};

export const addForecastByHour = async (airport) => {
    let taf;
    /*
    const cacheFilePath = `./cache/${airport.id}.json`;
    if (existsSync(cacheFilePath)) {
        taf = JSON.parse(readFileSync(cacheFilePath, 'utf8'));
        if (!isTafCacheCurrent(taf)) {
            taf = undefined;
        }
    } 
    */
    if (!taf) {
        const response = await fetch(`https://api.metar-taf.com/taf?api_key=${process.env.METAR_TAF_API_KEY}&v=2.3&locale=en-US&id=${airport.id}`);
        const body = await response.text();
        taf = JSON.parse(body).taf;
        if (!taf) {
            throw new Error(`Failed to fetch TAF for ${airport.id}: ${body}`);
        }
        taf.downloaded = Date.now();
        /*
        if (!existsSync('./cache')) {
            mkdirSync('./cache');
        }
        writeFileSync(`./cache/${airport.id}.json`, JSON.stringify(taf, undefined, ' '));
        */
    }

    taf.starttime = new Date(taf.starttime * 1000 /* convert from UNIX time */);
    taf.endtime = new Date(taf.endtime * 1000 /* convert from UNIX time */);

    const report = parseTAFAsForecast(taf.raw, { issued: taf.starttime });

    const forecastByHour = eachHourOfInterval({
        start: report.start,
        end: new Date(report.end.getTime() - oneHourInMs),
      }).map((hour) => ({
        hour,
        ...getCompositeForecastForDate(hour, report),
      }));

    const processHour = (hour) => {
        hour.wind = hour.base.wind;
        hour.visibility = hour.base.visibility;
        hour.weather = hour.base.weatherConditions;
        hour.clouds = hour.base.clouds;
        for (const add of hour.additional || []) {
            if (add.wind) {
                hour.wind = add.wind;
            }
            if (add.visibility) {
                hour.visibility = add.visibility;
            }
            if (add.weatherConditions.length > 0) {
                hour.weather = add.weatherConditions;
            }
            if (add.clouds.length > 0) {
                hour.clouds = add.clouds;
            }
        }
        hour.base = undefined;
        hour.additional = undefined;

        if (hour.wind.unit != 'KT') {
            throw new Error('Invalid wind speed unit');
        }
        if (!hour.visibility) {
            // Treat no visibility specified as P6SM
            hour.visibility = {
                indicator: 'P',
                value: 6,
                unit: 'SM'
            };
        }
        if (hour.visibility.unit === 'm') {
            hour.visibility.value = Math.round(hour.visibility.value * 0.00062137);
            hour.visibility.unit = 'SM';
        }
        if (hour.visibility.unit != 'SM') {
            throw new Error('Invalid visibility unit');
        }
        if (hour.visibility.indicator === 'P' && hour.visibility.value >= 6) {
            hour.visibility.value = 10;
            hour.visibility.indicator = undefined;
        }
    }

    for (const hour of forecastByHour) {
        processHour(hour);
        applyMinimums(hour, airport);
    }

    airport.forecast = forecastByHour;
    airport.forecastRaw = taf.raw;
    airport.forecastStart = taf.starttime;
    airport.forecastEnd = taf.endtime;
};
