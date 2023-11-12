import pkg from 'colors';
const { colors } = pkg;
import { getSunrise, getSunset } from 'sunrise-sunset-js';
import { airports } from './airports.mjs';
import { Code } from './minimums.mjs';
import { addForecastByHour } from './taf.mjs';
import { oneHourInMs, oneDayInMs, oneYearInMs, toPaddedString, eachHourOfInterval, localDate } from './util.mjs';

const charForCode = (code) => {
    if (code === Code.Red) {
        return 'X'//.red;//'\u{1F7E5}';
    }
    if (code === Code.Yellow) {
        return '!'//.yellow;//'\u{1F7E8}';
    }
    if (code === Code.Green) {
        return '.'//.green;//'\u{1F7E9}';
    }
    if (code === Code.None) {
        return '/'//.gray;
    }
    return '?';
}

const isDaylightHour = (hour) => {
    // Hardcoded to Seattle, and add 45 min buffer to actual sunrise/sunset times
    const sunrise = new Date(getSunrise(47.6, -122.3, hour).getTime() + 0.75 * oneHourInMs);
    let sunset = new Date(getSunset(47.6, -122.3, hour).getTime() - 0.75 * oneHourInMs);
    if (sunrise.getTime() > sunset.getTime()) {
        // Sometimes this sunrise-sunset-js thing gets confused and reports the previous day's sunset
        sunset = getSunset(47.6, -122.3, new Date(hour.getTime() + oneDayInMs));
    }
    return sunrise.getTime() < hour.getTime() && hour.getTime() < sunset.getTime();
};

export const printToday = async (utcOffset) => {
    const promises = [];
    for (const airport of airports.filter(x => x.taf)) {
        promises.push(addForecastByHour(airport));
    }
    await Promise.all(promises);

    let output = '';
    const addLine = (line) => {
        output += `${line}\n`;
    };

    let start = new Date(Date.now() + oneYearInMs);
    let end = new Date(Date.now() - oneYearInMs);

    for (const airport of airports.filter(x => x.taf)) {
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
    end = new Date(Math.min(end.getTime(), start.getTime() + 26 * oneHourInMs));

    const zones = new Set();
    airports.forEach(x => zones.add(x.zone));

    const hours = eachHourOfInterval({
        start: start,
        end: new Date(end.getTime() - oneHourInMs)
    });

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
        headerLines[1] += ` ${toPaddedString(hour.getUTCDate(), 2)}${toPaddedString(hour.getUTCHours(), 2)} |`;
        headerLines[2] += ` ${toPaddedString(localDate(hour, utcOffset).getDate(), 2)}${toPaddedString(localDate(hour, utcOffset).getHours(), 2)} |`;
        headerLines[3] += `  ${isDaylightHour(hour) ? '**' : '  '}  |`;
        headerLines[4] += 'WGXVWC|';
    }
    headerLines.forEach(x => addLine(x));
    addLine(separatorLine);

    const printAirport = (airport) => {
        let line = `| ${airport.id}${airport.id.length === 3 ? ' ': ''} |`;
        for (const hour of hours) {
            const f = airport.forecast && airport.forecast.find(x => x.hour.getTime() === hour.getTime());
            if (f) {
                line += `${charForCode(f.minimums.wind[1])}${charForCode(f.minimums.gustFactor[1])}${charForCode(f.minimums.crosswind[1])}${charForCode(f.minimums.visibility[1])}${charForCode(f.minimums.weather[1])}${charForCode(f.minimums.ceiling[1])}|`;
            } else {
                line += '      |';
            }
        }
        addLine(line);
    }

    const printZoneSummary = (zone) => {
        let line = '|      |';
        for (const hour of hours) {
            let summary;
            if (isDaylightHour(hour)) {
                summary = airports
                .filter(x => x.zone === zone)
                .reduce((prev, airport) => {
                    const f = airport.forecast && airport.forecast.find(x => x.hour.getTime() === hour.getTime());
                    if (f && f.minimums.overall < prev) {
                        return f.minimums.overall;
                    }
                    return prev;
                }, Code.None);
            } else {
                summary = Code.Red;
            }
            line += `  ${charForCode(summary)}   |`;
        }
        addLine(line);
    }

    for (const zone of zones.keys()) {
        addLine(`| ${zone}${' '.repeat(separatorLine.length - zone.length - 3)}|`);
        addLine(separatorLine);
        printZoneSummary(zone);
        addLine(separatorLine);
        for (const airport of airports.filter(x => x.zone === zone)) {
            printAirport(airport);
        }    
        addLine(separatorLine);
    }

    addLine('');
    for (const airport of airports.filter(x => x.local)) {
        addLine(airport.forecastRaw);
    }

    return output;
};
