"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addForecastByHour = void 0;
const metar_taf_parser_1 = require("metar-taf-parser");
const node_fetch_1 = __importDefault(require("node-fetch"));
const minimums_1 = require("./minimums");
const util_1 = require("./util");
const cache_1 = require("./cache");
const addForecastByHour = (airport) => __awaiter(void 0, void 0, void 0, function* () {
    let taf = (0, cache_1.getCachedData)(airport.id);
    if (!taf) {
        const response = yield (0, node_fetch_1.default)(`https://api.metar-taf.com/taf?api_key=${process.env.METAR_TAF_API_KEY}&v=2.3&locale=en-US&id=${airport.id}`);
        const body = yield response.text();
        taf = JSON.parse(body).taf;
        if (!taf) {
            throw new Error(`Failed to fetch TAF for ${airport.id}: ${body}`);
        }
        (0, cache_1.putCachedData)(airport.id, taf);
    }
    taf.starttime = new Date(taf.starttime * 1000 /* convert from UNIX time */);
    taf.endtime = new Date(taf.endtime * 1000 /* convert from UNIX time */);
    const report = (0, metar_taf_parser_1.parseTAFAsForecast)(taf.raw, { issued: taf.starttime });
    const forecastByHour = (0, util_1.eachHourOfInterval)({
        start: report.start,
        end: new Date(report.end.getTime() - util_1.oneHourInMs),
    }).map((hour) => (Object.assign({ hour }, (0, metar_taf_parser_1.getCompositeForecastForDate)(hour, report))));
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
    };
    for (const hour of forecastByHour) {
        processHour(hour);
        (0, minimums_1.applyMinimums)(hour, airport);
    }
    airport.forecast = forecastByHour;
    airport.forecastRaw = taf.raw;
    airport.forecastStart = taf.starttime;
    airport.forecastEnd = taf.endtime;
});
exports.addForecastByHour = addForecastByHour;
