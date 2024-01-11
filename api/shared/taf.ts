const loadMetarTafParser = require('../../shared/metar-taf-parser-wrapper');
const loadNodeFetch = require('../../shared/node-fetch-wrapper');
import { applyMinimums } from './minimums';
import { oneHourInMs, eachHourOfInterval } from './util';
import { getCachedData, putCachedData } from './cache';

export const addForecastByHour = async (airport) => {
    const metarTafParser = await loadMetarTafParser();
    const fetch = (await loadNodeFetch()).default;

    let taf = getCachedData(airport.id);
    if (!taf) {
        const response = await fetch(`https://api.metar-taf.com/taf?api_key=${process.env.METAR_TAF_API_KEY}&v=2.3&locale=en-US&id=${airport.id.length === 3 ? 'K' : ''}${airport.id}`);
        const body = await response.text();
        taf = JSON.parse(body).taf;
        if (!taf) {
            throw new Error(`Failed to fetch TAF for ${airport.id}: ${body}`);
        }
        putCachedData(airport.id, taf);
    }

    taf.starttime = new Date(taf.starttime * 1000 /* convert from UNIX time */);
    taf.endtime = new Date(taf.endtime * 1000 /* convert from UNIX time */);

    const report = metarTafParser.parseTAFAsForecast(taf.raw, { issued: taf.starttime });

    const forecastByHour = eachHourOfInterval({
        start: report.start,
        end: new Date(report.end.getTime() - oneHourInMs),
      }).map((hour) => ({
        hour,
        ...metarTafParser.getCompositeForecastForDate(hour, report),
      }));

    const processHour = (hour) => {
        hour.wind = hour.prevailing.wind;
        hour.visibility = hour.prevailing.visibility;
        hour.weather = hour.prevailing.weatherConditions;
        hour.clouds = hour.prevailing.clouds;
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
        hour.prevailing = undefined;
        hour.supplemental = undefined;

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
