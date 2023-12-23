"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyMinimums = exports.Code = void 0;
exports.Code = {
    Red: 0,
    Yellow: 1,
    Green: 2,
    None: 3
};
const personalMinimums = {
    wind: [12, 15],
    gustFactor: [2, 4],
    crosswind: [4, 5],
    ceilingLocal: [3000, 2000],
    ceilingCrossCountry: [4000, 3000],
    visibilityLocal: [7, 5],
    visibilityCrossCountry: [9, 8]
};
const getWindMinimumsCode = (wind, airport) => {
    const windKts = wind.gust ? wind.gust : wind.speed;
    if (!airport.runwaysTrue) {
        return [windKts, exports.Code.None];
    }
    if (windKts < personalMinimums.wind[0]) {
        return [windKts, exports.Code.Green];
    }
    if (windKts <= personalMinimums.wind[1]) {
        return [windKts, exports.Code.Yellow];
    }
    return [windKts, exports.Code.Red];
};
const getGustFactorMinimumsCode = (wind, airport) => {
    const gustFactor = wind.gust ? (wind.gust - wind.speed) : 0;
    if (!airport.runwaysTrue) {
        return [gustFactor, exports.Code.None];
    }
    if (gustFactor < personalMinimums.gustFactor[0]) {
        return [gustFactor, exports.Code.Green];
    }
    if (gustFactor <= personalMinimums.gustFactor[1]) {
        return [gustFactor, exports.Code.Yellow];
    }
    return [gustFactor, exports.Code.Red];
};
const getCrosswindMinimumsCode = (wind, airport) => {
    if (!airport.runwaysTrue) {
        return [0, exports.Code.None];
    }
    const windKts = wind.gust ? wind.gust : wind.speed;
    const calculateCrosswind = (windKts, windDegrees, runwaysTrue) => {
        if (windDegrees === undefined) {
            return windKts;
        }
        return Math.round(Math.sin(Math.PI * Math.abs(windDegrees - runwaysTrue) / 180) * windKts);
    };
    let crosswindMinimums = airport.runwaysTrue.map(runwaysTrue => {
        const crosswind = calculateCrosswind(windKts, wind.degrees, runwaysTrue);
        if (crosswind < personalMinimums.crosswind[0]) {
            return [crosswind, exports.Code.Green];
        }
        if (crosswind <= personalMinimums.crosswind[1]) {
            return [crosswind, exports.Code.Yellow];
        }
        return [crosswind, exports.Code.Red];
    });
    return crosswindMinimums.reduce((prev, curr) => {
        return curr[0] < prev[0] ? curr : prev;
    }, [1000, exports.Code.Red]);
};
const getVisibilityMinimumsCode = (visibility, airport) => {
    const marginalVisibility = airport.local ? personalMinimums.visibilityLocal[0] : personalMinimums.visibilityCrossCountry[0];
    const minimumVisibility = airport.local ? personalMinimums.visibilityLocal[1] : personalMinimums.visibilityCrossCountry[1];
    if (visibility.value > marginalVisibility) {
        return [visibility.value, exports.Code.Green];
    }
    if (visibility.value >= minimumVisibility) {
        return [visibility.value, exports.Code.Yellow];
    }
    return [visibility.value, exports.Code.Red];
};
const getWeatherMinimumsCode = (weather) => {
    // Any "weather" (precip, haze, fog, etc.) is no-go
    if (weather.length > 0) {
        return [weather, exports.Code.Red];
    }
    return [weather, exports.Code.Green];
};
const getCeilingMinimumsCode = (clouds, airport) => {
    const calculateCeiling = (clouds) => {
        // Ceiling is defined here as Scattered or worse
        const isCeilingQuantity = (quantity) => ["SCT", "BKN", "OVC", "VV"].includes(quantity);
        return clouds.reduce((prev, curr) => {
            return isCeilingQuantity(curr.quantity) && curr.height < prev ? curr.height : prev;
        }, 100000);
    };
    const ceiling = calculateCeiling(clouds);
    const marginalCeiling = airport.local ? personalMinimums.ceilingLocal[0] : personalMinimums.ceilingCrossCountry[0];
    const minimumCeiling = airport.local ? personalMinimums.ceilingLocal[1] : personalMinimums.ceilingCrossCountry[1];
    if (ceiling > marginalCeiling) {
        return [ceiling, exports.Code.Green];
    }
    if (ceiling >= minimumCeiling) {
        return [ceiling, exports.Code.Yellow];
    }
    return [ceiling, exports.Code.Red];
};
const applyMinimums = (hour, airport) => {
    hour.minimums = {
        wind: getWindMinimumsCode(hour.wind, airport),
        gustFactor: getGustFactorMinimumsCode(hour.wind, airport),
        crosswind: getCrosswindMinimumsCode(hour.wind, airport),
        visibility: getVisibilityMinimumsCode(hour.visibility, airport),
        weather: getWeatherMinimumsCode(hour.weather),
        ceiling: getCeilingMinimumsCode(hour.clouds, airport)
    };
    hour.minimums.overall = [
        hour.minimums.wind,
        hour.minimums.gustFactor,
        hour.minimums.crosswind,
        hour.minimums.visibility,
        hour.minimums.weather,
        hour.minimums.ceiling
    ].reduce((prev, curr) => {
        if (prev === exports.Code.Yellow && curr[1] === exports.Code.Yellow) {
            // Only allow one yellow item
            return exports.Code.Red;
        }
        return curr[1] < prev ? curr[1] : prev;
    }, exports.Code.Green);
};
exports.applyMinimums = applyMinimums;
