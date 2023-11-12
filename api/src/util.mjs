export const oneHourInMs = 60 * 60 * 1000;
export const oneDayInMs = 24 * oneHourInMs;
export const oneYearInMs = 365 * oneDayInMs;

export const toPaddedString = (number, length) => {
    return String(number).padStart(length, '0');
};

export const eachHourOfInterval = (config) => {
    const start = config.start;
    const end = config.end;

    start.setMinutes(0, 0, 0);
    let curr = new Date(start);
    let result = [];
    while (curr.getTime() < end.getTime()) {
        result.push(curr);
        curr = new Date(curr.getTime() + oneHourInMs);
    }
    return result;
};

export const localDate = (date, utcOffset) => {
    return utcOffset ? new Date(date.getTime() + utcOffset * oneHourInMs) : date;
}
