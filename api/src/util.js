"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.localDate = exports.eachHourOfInterval = exports.toPaddedString = exports.oneYearInMs = exports.oneDayInMs = exports.oneHourInMs = void 0;
exports.oneHourInMs = 60 * 60 * 1000;
exports.oneDayInMs = 24 * exports.oneHourInMs;
exports.oneYearInMs = 365 * exports.oneDayInMs;
const toPaddedString = (number, length) => {
    return String(number).padStart(length, '0');
};
exports.toPaddedString = toPaddedString;
const eachHourOfInterval = (config) => {
    const start = config.start;
    const end = config.end;
    start.setMinutes(0, 0, 0);
    let curr = new Date(start);
    let result = [];
    while (curr.getTime() < end.getTime()) {
        result.push(curr);
        curr = new Date(curr.getTime() + exports.oneHourInMs);
    }
    return result;
};
exports.eachHourOfInterval = eachHourOfInterval;
const localDate = (date, utcOffset) => {
    return utcOffset ? new Date(date.getTime() + utcOffset * exports.oneHourInMs) : date;
};
exports.localDate = localDate;
