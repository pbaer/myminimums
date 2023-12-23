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
Object.defineProperty(exports, "__esModule", { value: true });
exports.printToday = void 0;
const sunrise_sunset_js_1 = require("sunrise-sunset-js");
const airports_1 = require("./airports");
const minimums_1 = require("./minimums");
const taf_1 = require("./taf");
const util_1 = require("./util");
const charForCode = (code) => {
    if (code === minimums_1.Code.Red) {
        return 'X'; //.red;//'\u{1F7E5}';
    }
    if (code === minimums_1.Code.Yellow) {
        return '!'; //.yellow;//'\u{1F7E8}';
    }
    if (code === minimums_1.Code.Green) {
        return '.'; //.green;//'\u{1F7E9}';
    }
    if (code === minimums_1.Code.None) {
        return '/'; //.gray;
    }
    return '?';
};
const isDaylightHour = (hour) => {
    // Hardcoded to Seattle, and add 45 min buffer to actual sunrise/sunset times
    const sunrise = new Date((0, sunrise_sunset_js_1.getSunrise)(47.6, -122.3, hour).getTime() + 0.75 * util_1.oneHourInMs);
    let sunset = new Date((0, sunrise_sunset_js_1.getSunset)(47.6, -122.3, hour).getTime() - 0.75 * util_1.oneHourInMs);
    if (sunrise.getTime() > sunset.getTime()) {
        // Sometimes this sunrise-sunset-js thing gets confused and reports the previous day's sunset
        sunset = (0, sunrise_sunset_js_1.getSunset)(47.6, -122.3, new Date(hour.getTime() + util_1.oneDayInMs));
    }
    return sunrise.getTime() < hour.getTime() && hour.getTime() < sunset.getTime();
};
const printToday = (utcOffset) => __awaiter(void 0, void 0, void 0, function* () {
    const promises = [];
    for (const airport of airports_1.airports.filter(x => x.taf)) {
        promises.push((0, taf_1.addForecastByHour)(airport));
    }
    yield Promise.all(promises);
    let output = '';
    const addLine = (line) => {
        output += `${line !== null && line !== void 0 ? line : ''}\n`;
    };
    let start = new Date(Date.now() + util_1.oneYearInMs);
    let end = new Date(Date.now() - util_1.oneYearInMs);
    for (const airport of airports_1.airports.filter(x => x.taf)) {
        if (airport.forecastStart < start) {
            start = airport.forecastStart;
        }
        if (airport.forecastEnd > end) {
            end = airport.forecastEnd;
        }
    }
    // Don't display stale data 
    start = new Date(Math.max(start.getTime(), Date.now()));
    // Don't display more than 26h of forecast
    end = new Date(Math.min(end.getTime(), start.getTime() + 26 * util_1.oneHourInMs));
    const zones = new Set();
    airports_1.airports.forEach(x => zones.add(x.zone));
    const hours = (0, util_1.eachHourOfInterval)({
        start: start,
        end: new Date(end.getTime() - util_1.oneHourInMs)
    }).filter(isDaylightHour);
    let separatorLine = '+------+';
    hours.forEach(_ => separatorLine += '------+');
    let headerLines = [];
    headerLines.push('       +');
    headerLines.push('       |');
    headerLines.push('       |');
    headerLines.push('       |');
    headerLines.push('       |');
    for (const hour of hours) {
        headerLines[0] += '------+';
        headerLines[1] += ` ${(0, util_1.toPaddedString)(hour.getUTCDate(), 2)}${(0, util_1.toPaddedString)(hour.getUTCHours(), 2)} |`;
        headerLines[2] += ` ${(0, util_1.toPaddedString)((0, util_1.localDate)(hour, utcOffset).getDate(), 2)}${(0, util_1.toPaddedString)((0, util_1.localDate)(hour, utcOffset).getHours(), 2)} |`;
        headerLines[3] += `  ${isDaylightHour(hour) ? '**' : '  '}  |`;
        headerLines[4] += 'WGXVWC|';
    }
    headerLines.forEach(x => addLine(x));
    addLine(separatorLine);
    const printAirport = (airport) => {
        let line = `| ${airport.id}${airport.id.length === 3 ? ' ' : ''} |`;
        for (const hour of hours) {
            const f = airport.forecast && airport.forecast.find(x => x.hour.getTime() === hour.getTime());
            if (f) {
                line += `${charForCode(f.minimums.wind[1])}${charForCode(f.minimums.gustFactor[1])}${charForCode(f.minimums.crosswind[1])}${charForCode(f.minimums.visibility[1])}${charForCode(f.minimums.weather[1])}${charForCode(f.minimums.ceiling[1])}|`;
            }
            else {
                line += '      |';
            }
        }
        addLine(line);
    };
    const printZoneSummary = (zone) => {
        let line = '|      |';
        for (const hour of hours) {
            let summary;
            if (isDaylightHour(hour)) {
                summary = airports_1.airports
                    .filter(x => x.zone === zone)
                    .reduce((prev, airport) => {
                    const f = airport.forecast && airport.forecast.find(x => x.hour.getTime() === hour.getTime());
                    if (f && f.minimums.overall < prev) {
                        return f.minimums.overall;
                    }
                    return prev;
                }, minimums_1.Code.None);
            }
            else {
                summary = minimums_1.Code.Red;
            }
            line += `  ${charForCode(summary)}   |`;
        }
        addLine(line);
    };
    for (const zone of zones.keys()) {
        addLine(`| ${zone}${' '.repeat(separatorLine.length - zone.length - 3)}|`);
        addLine(separatorLine);
        printZoneSummary(zone);
        addLine(separatorLine);
        for (const airport of airports_1.airports.filter(x => x.zone === zone)) {
            printAirport(airport);
        }
        addLine(separatorLine);
    }
    addLine('');
    for (const airport of airports_1.airports) {
        addLine(`${airport.name} (${airport.city}, ${airport.zone} Zone)`);
        addLine(airport.forecastRaw);
        addLine();
    }
    return output;
});
exports.printToday = printToday;
