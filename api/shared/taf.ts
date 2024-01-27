const loadMetarTafParser = require('../../shared/metar-taf-parser-wrapper');
const loadNodeFetch = require('../../shared/node-fetch-wrapper');
import { IAirport, ICurrentWeather, IForecastWeather } from './airports';
import { applyMinimums } from './minimums';
import { oneHourInMs, eachHourOfInterval, oneDayInMs } from './util';
import { getCachedData, putCachedData } from './cache';

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
};

export const addWeather = async (airport: IAirport) => {
    const fetch = (await loadNodeFetch()).default;
    const metarTafParser = await loadMetarTafParser();

    let current: ICurrentWeather | undefined = undefined;
    if (airport.hasMetar) {
        const metarCacheKey = `wxmetar-${airport.id}`;
        current = getCachedData(metarCacheKey);
        if (!current) {
            const response = await fetch(`https://aviationweather.gov/api/data/metar?ids=${airport.idForMetar ?? airport.id}`);
            const metar = await response.text();
            if (!metar) {
                throw new Error(`No METAR for ${airport.id}`);
            }
            metar.replace(/CLR/g, 'SKC'); // Workaround for bug in metar-taf-parser that doesn't recognize CLR

            current = {
                metar,
                decoded: metarTafParser.parseMetar(metar)
            };

            putCachedData(metarCacheKey, current);
        }
    }

    let forecast: IForecastWeather | undefined = undefined;
    if (airport.hasTaf) {
        const tafCacheKey = `wxtaf-${airport.id}`;
        forecast = getCachedData(tafCacheKey);
        if (!forecast) {
            const response = await fetch(`https://aviationweather.gov/api/data/taf?ids=${airport.idForTaf ?? airport.id}`);
            const taf = await response.text();
            if (!taf) {
                throw new Error(`No TAF for ${airport.id}`);
            }

            // For simplicity assume the TAF was issued 12h ago, doesn't need to be precise, just before the valid period
            const issuedPrecise = new Date(Date.now() - oneDayInMs/2);

            // For mysterious reasons the parser doesn't like the precise time, so round down to the hour
            const issued = new Date(issuedPrecise.getFullYear(), issuedPrecise.getMonth(), issuedPrecise.getDate(), issuedPrecise.getHours());

            const decodedTaf = metarTafParser.parseTAFAsForecast(taf, { issued });
            const decodedHours = eachHourOfInterval({
                start: decodedTaf.start,
                end: new Date(decodedTaf.end.getTime() - oneHourInMs),
            }).map((date) => ({
                dateISO: date.toISOString(),
                ...metarTafParser.getCompositeForecastForDate(date, decodedTaf)
            }));

            for (const hour of decodedHours) {
                processHour(hour);
                applyMinimums(hour, airport);
            }

            forecast = {
                taf,
                decodedHours
            };

            putCachedData(tafCacheKey, forecast);
        }
    }

    airport.weather = {
        current,
        forecast,
    };
};
