/**
 * TypeScript interfaces for OpenWeatherMap One Call API 3.0
 * Documentation: https://openweathermap.org/api/one-call-3
 */

export interface IOpenWeatherCondition {
    id: number;
    main: string;
    description: string;
    icon: string;
}

export interface IOpenWeatherRain {
    '1h'?: number; // Precipitation in mm/h
}

export interface IOpenWeatherSnow {
    '1h'?: number; // Precipitation in mm/h
}

export interface IOpenWeatherCurrent {
    dt: number; // Unix timestamp, UTC
    sunrise?: number; // Unix timestamp, UTC
    sunset?: number; // Unix timestamp, UTC
    temp: number; // Temperature (Kelvin default, Celsius with units=metric, Fahrenheit with units=imperial)
    feels_like: number; // Feels-like temperature
    pressure: number; // Atmospheric pressure on sea level, hPa
    humidity: number; // Humidity, %
    dew_point: number; // Dew point temperature
    uvi: number; // UV index
    clouds: number; // Cloudiness, %
    visibility: number; // Visibility in meters (max 10000)
    wind_speed: number; // Wind speed (m/s default, mph with units=imperial)
    wind_deg: number; // Wind direction, degrees (meteorological)
    wind_gust?: number; // Wind gust
    rain?: IOpenWeatherRain;
    snow?: IOpenWeatherSnow;
    weather: IOpenWeatherCondition[];
}

export interface IOpenWeatherHourly {
    dt: number; // Unix timestamp, UTC
    temp: number; // Temperature
    feels_like: number; // Feels-like temperature
    pressure: number; // Atmospheric pressure on sea level, hPa
    humidity: number; // Humidity, %
    dew_point: number; // Dew point temperature
    uvi: number; // UV index
    clouds: number; // Cloudiness, %
    visibility: number; // Visibility in meters (max 10000)
    wind_speed: number; // Wind speed
    wind_deg: number; // Wind direction, degrees (meteorological)
    wind_gust?: number; // Wind gust
    pop: number; // Probability of precipitation (0-1, where 0=0%, 1=100%)
    rain?: IOpenWeatherRain;
    snow?: IOpenWeatherSnow;
    weather: IOpenWeatherCondition[];
}

export interface IOpenWeatherTemp {
    morn: number;
    day: number;
    eve: number;
    night: number;
    min: number;
    max: number;
}

export interface IOpenWeatherFeelsLike {
    morn: number;
    day: number;
    eve: number;
    night: number;
}

export interface IOpenWeatherDaily {
    dt: number; // Unix timestamp, UTC
    sunrise?: number; // Unix timestamp, UTC
    sunset?: number; // Unix timestamp, UTC
    moonrise: number; // Unix timestamp, UTC
    moonset: number; // Unix timestamp, UTC
    moon_phase: number; // Moon phase (0 and 1 are 'new moon', 0.25 is 'first quarter', 0.5 is 'full moon', 0.75 is 'last quarter')
    summary?: string; // Human-readable weather summary
    temp: IOpenWeatherTemp;
    feels_like: IOpenWeatherFeelsLike;
    pressure: number; // Atmospheric pressure on sea level, hPa
    humidity: number; // Humidity, %
    dew_point: number; // Dew point temperature
    wind_speed: number; // Wind speed
    wind_deg: number; // Wind direction, degrees (meteorological)
    wind_gust?: number; // Wind gust
    clouds: number; // Cloudiness, %
    uvi: number; // Maximum UV index for the day
    pop: number; // Probability of precipitation (0-1)
    rain?: number; // Precipitation volume, mm
    snow?: number; // Snow volume, mm
    weather: IOpenWeatherCondition[];
}

export interface IOpenWeatherAlert {
    sender_name: string; // Name of the alert source
    event: string; // Alert event name
    start: number; // Unix timestamp, UTC
    end: number; // Unix timestamp, UTC
    description: string; // Description of the alert
    tags: string[]; // Type of severe weather
}
