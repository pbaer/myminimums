const loadMetarTafParser = require('../../shared/metar-taf-parser-wrapper');
const loadNodeFetch = require('../../shared/node-fetch-wrapper');
import { IAirport, ICurrentWeather, IForecastWeather } from './airports';
import { IOpenWeatherCurrent, IOpenWeatherHourly, IOpenWeatherDaily, IOpenWeatherAlert } from './openweather-types';
import { applyMinimums } from './minimums';
import { oneHourInMs, eachHourOfInterval, oneDayInMs } from './util';
import { getCachedData, putCachedData } from './cache';

interface IOpenWeatherResponse {
    lat: number;
    lon: number;
    timezone: string;
    timezone_offset: number;
    current?: IOpenWeatherCurrent;
    hourly?: IOpenWeatherHourly[];
    daily?: IOpenWeatherDaily[];
    alerts?: IOpenWeatherAlert[];
}

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

    // Don't update if we have data and it is fresh within the last 15 minutes
    if (airport.weather?.lastUpdate && Date.now() - airport.weather.lastUpdate < oneHourInMs/4) {
        return;
    }

    const weatherCacheKey = `wx-${airport.id}`;
    let weather = getCachedData(weatherCacheKey);
    if (!weather) {
        weather = {
            lastUpdate: Date.now(),
            current: {},
            forecast: {}
        };

        if (airport.hasMetar) {
            try {
                const response = await fetch(`https://aviationweather.gov/api/data/metar?ids=${airport.icao ?? airport.id}`);
                const metar = await response.text();
                if (!metar) {
                    throw new Error('Empty response');
                } else if (metar.toLowerCase().includes('error')) {
                    throw new Error(metar);
                } else {
                    metar.replace(/CLR/g, 'SKC'); // Workaround for bug in metar-taf-parser that doesn't recognize CLR

                    weather.current.metar = metar;
                    weather.current.decodedMetar = metarTafParser.parseMetar(metar);
                }
            } catch (err) {
                weather.current.metar = `NO METAR AVAILABLE (${err})`;
                weather.current.decodedMetar = {};
            }
        }

        if (airport.hasTaf) {
            try {
                const response = await fetch(`https://aviationweather.gov/api/data/taf?ids=${airport.icao ?? airport.id}`);
                const taf = await response.text();
                if (!taf) {
                    throw new Error('Empty response');
                } else if (taf.toLowerCase().includes('error')) {
                    throw new Error(taf);
                } else {
                    // For simplicity assume the TAF was issued 12h ago, doesn't need to be precise, just before the valid period
                    const issuedPrecise = new Date(Date.now() - oneDayInMs/2);

                    // For mysterious reasons the parser doesn't like the precise time, so round down to the hour
                    const issued = new Date(issuedPrecise.getFullYear(), issuedPrecise.getMonth(), issuedPrecise.getDate(), issuedPrecise.getHours());

                    const decodedTaf = metarTafParser.parseTAFAsForecast(taf, { issued });
                    const decodedTafHours = eachHourOfInterval({
                        start: decodedTaf.start,
                        end: new Date(decodedTaf.end.getTime() - oneHourInMs),
                    }).map((date) => ({
                        dateISO: date.toISOString(),
                        ...metarTafParser.getCompositeForecastForDate(date, decodedTaf)
                    }));

                    for (const hour of decodedTafHours) {
                        processHour(hour);
                        applyMinimums(hour, airport);
                    }

                    weather.forecast.taf = taf;
                    weather.forecast.decodedTafHours = decodedTafHours;
                }
            } catch (err) {
                weather.forecast.taf = `NO TAF AVAILABLE (${err})`;
                weather.forecast.decodedTafHours = [];
            }
        }

        // Fetch OpenWeatherMap One Call API 3.0 data
        const apiKey = process.env.OPENWEATHERMAP_API_KEY;
        if (apiKey && airport.lat && airport.lon) {
            try {
                // Exclude minutely weather as requested
                const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${airport.lat}&lon=${airport.lon}&exclude=minutely&units=imperial&appid=${apiKey}`;
                const response = await fetch(url);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data: IOpenWeatherResponse = await response.json();
                
                // Store current weather
                if (data.current) {
                    weather.current.openWeather = data.current;
                }
                
                // Store hourly forecast
                if (data.hourly) {
                    weather.forecast.openWeatherHourly = data.hourly;
                }
                
                // Store daily forecast
                if (data.daily) {
                    weather.forecast.openWeatherDaily = data.daily;
                }
                
                // Store weather alerts
                if (data.alerts) {
                    weather.forecast.openWeatherAlerts = data.alerts;
                }
            } catch (err) {
                // Log error but don't fail the entire weather fetch
                console.error(`Failed to fetch OpenWeather data for ${airport.id}:`, err);
            }
        }

        putCachedData(weatherCacheKey, weather);
    }

    airport.weather = weather;
};
