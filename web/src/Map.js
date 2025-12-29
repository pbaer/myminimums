import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, Tooltip, Marker, Circle, Rectangle, useMap, useMapEvents, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Map.css';

const { BaseLayer } = LayersControl;

// Fix for default marker icons in Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper function to check if URL is a YouTube URL and extract video ID
function getYouTubeVideoId(url) {
    if (!url) return null;
    
    // Match various YouTube URL formats
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?\/\s]+)/,
        /youtube\.com\/watch\?.*v=([^&?\/\s]+)/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    
    return null;
}

// Helper function to calculate airport bounding box with margin
function calculateAirportBounds(airport, marginMiles = 2) {
    // Convert margin from miles to degrees (approximate)
    // 1 degree latitude ≈ 69 miles
    const marginDegrees = marginMiles / 69;
    
    let minLat = airport.lat;
    let maxLat = airport.lat;
    let minLon = airport.lon;
    let maxLon = airport.lon;
    
    // Expand bounds to include all runway ends
    if (airport.runways && airport.runways.length > 0) {
        airport.runways.forEach(runway => {
            runway.ends.forEach(end => {
                minLat = Math.min(minLat, end.lat);
                maxLat = Math.max(maxLat, end.lat);
                minLon = Math.min(minLon, end.lon);
                maxLon = Math.max(maxLon, end.lon);
            });
        });
    }
    
    // Add margin
    minLat -= marginDegrees;
    maxLat += marginDegrees;
    minLon -= marginDegrees / Math.cos(airport.lat * Math.PI / 180); // Account for longitude compression
    maxLon += marginDegrees / Math.cos(airport.lat * Math.PI / 180);
    
    return [[minLat, minLon], [maxLat, maxLon]];
}

// Helper function to get flight category from weather data
function getFlightCategory(airport) {
    if (!airport.weather || !airport.weather.current || !airport.weather.current.decodedMetar) {
        return { color: '#808080', name: 'UNKNOWN' }; // Gray for unknown
    }
    
    const metar = airport.weather.current.decodedMetar;
    
    // Check if decodedMetar is an empty object
    if (Object.keys(metar).length === 0) {
        return { color: '#808080', name: 'UNKNOWN' }; // Gray for empty METAR
    }
    
    // Get ceiling (lowest BKN or OVC layer)
    let ceilingFeet = null;
    if (metar.clouds && metar.clouds.length > 0) {
        const ceilingLayer = metar.clouds.find(
            cloud => cloud.quantity === 'BKN' || cloud.quantity === 'OVC'
        );
        if (ceilingLayer) {
            ceilingFeet = ceilingLayer.height;
        }
    }
    
    // Get visibility in statute miles
    let visibilitySM = null;
    if (metar.visibility) {
        if (metar.visibility.unit === 'SM') {
            visibilitySM = metar.visibility.value;
        } else if (metar.visibility.unit === 'm') {
            // Convert meters to statute miles
            visibilitySM = metar.visibility.value / 1609.34;
        }
    }
    
    // Determine category based on ceiling and visibility
    // LIFR: ceiling < 500 OR visibility < 1
    if ((ceilingFeet !== null && ceilingFeet < 500) || (visibilitySM !== null && visibilitySM < 1)) {
        return { color: '#800080', name: 'LIFR' }; // Purple
    }
    
    // IFR: ceiling 500-1000 OR visibility 1-3
    if ((ceilingFeet !== null && ceilingFeet >= 500 && ceilingFeet < 1000) || 
        (visibilitySM !== null && visibilitySM >= 1 && visibilitySM < 3)) {
        return { color: '#FF0000', name: 'IFR' }; // Red
    }
    
    // MVFR: ceiling 1000-3000 OR visibility 3-5
    if ((ceilingFeet !== null && ceilingFeet >= 1000 && ceilingFeet < 3000) || 
        (visibilitySM !== null && visibilitySM >= 3 && visibilitySM < 5)) {
        return { color: '#0000FF', name: 'MVFR' }; // Blue
    }
    
    // VFR: otherwise (ceiling >= 3000 AND visibility >= 5, or no ceiling/unlimited visibility)
    return { color: '#00A500', name: 'VFR' }; // Green
}
function calculateRunwayPolygon(end1, end2, widthFeet) {
    // Convert width from feet to degrees
    // 1 degree latitude ≈ 364,000 feet
    const widthDegrees = widthFeet / 364000;
    
    // Calculate average latitude for the runway
    const avgLat = (end1.lat + end2.lat) / 2;
    const latRad = avgLat * Math.PI / 180;
    
    // Account for longitude compression at this latitude
    const lonScale = Math.cos(latRad);
    
    // Get the vector from end1 to end2, scaled for true distances
    const deltaLat = end2.lat - end1.lat;
    const deltaLon = (end2.lon - end1.lon) * lonScale;
    
    // Calculate the length of the runway vector
    const runwayLength = Math.sqrt(deltaLat * deltaLat + deltaLon * deltaLon);
    
    // Normalize the runway vector
    const normLat = deltaLat / runwayLength;
    const normLon = deltaLon / runwayLength;
    
    // Get perpendicular vector (rotate 90 degrees counterclockwise)
    // If vector is (x, y), perpendicular is (-y, x)
    const perpLat = -normLon;
    const perpLon = normLat;
    
    // Calculate half-width offsets
    const halfWidthLat = perpLat * (widthDegrees / 2);
    const halfWidthLon = (perpLon * (widthDegrees / 2)) / lonScale; // Unscale longitude
    
    // Calculate the 4 corners of the runway in proper order
    const corner1 = [end1.lat + halfWidthLat, end1.lon + halfWidthLon];
    const corner2 = [end2.lat + halfWidthLat, end2.lon + halfWidthLon];
    const corner3 = [end2.lat - halfWidthLat, end2.lon - halfWidthLon];
    const corner4 = [end1.lat - halfWidthLat, end1.lon - halfWidthLon];
    
    return [corner1, corner2, corner3, corner4];
}

// Component to handle map clicks
function MapClickHandler({ onMapClick }) {
    useMapEvents({
        click: onMapClick
    });
    return null;
}

// Component to track map zoom level
function ZoomHandler({ onZoomChange }) {
    const map = useMap();
    
    useEffect(() => {
        const handleZoom = () => {
            onZoomChange(map.getZoom());
        };
        
        map.on('zoomend', handleZoom);
        // Set initial zoom
        onZoomChange(map.getZoom());
        
        return () => {
            map.off('zoomend', handleZoom);
        };
    }, [map, onZoomChange]);
    
    return null;
}

// Component to auto-fit map bounds to all airports
function FitBounds({ airports }) {
    const map = useMap();
    
    useEffect(() => {
        if (airports.length > 0) {
            const bounds = L.latLngBounds(
                airports.map(a => [a.lat, a.lon])
            );
            map.fitBounds(bounds, { padding: [20, 20] });
        }
    }, [airports, map]);
    
    return null;
}

// Component to render weather information
function WeatherInfo({ weather }) {
    if (!weather) {
        return <div className="weather-info">No weather data available</div>;
    }
    
    return (
        <div className="weather-info">
            {weather.current && (
                <div className="current-weather-section">
                    <h4>Current Weather</h4>
                    
                    {weather.current.metar && (
                        <div className="metar-subsection">
                            <h5>METAR</h5>
                            <div className="metar-raw">{weather.current.metar}</div>
                            {weather.current.decodedMetar && (
                                <div className="metar-decoded">
                                    <div className="weather-item">
                                        <strong>Time:</strong> {weather.current.decodedMetar.day && weather.current.decodedMetar.hour !== undefined ? 
                                            `${String(weather.current.decodedMetar.day).padStart(2, '0')}${String(weather.current.decodedMetar.hour).padStart(2, '0')}${String(weather.current.decodedMetar.minute || 0).padStart(2, '0')}Z` : 'N/A'}
                                    </div>
                                    {weather.current.decodedMetar.flight_category && (
                                        <div className="weather-item">
                                            <strong>Flight Category:</strong> {weather.current.decodedMetar.flight_category}
                                        </div>
                                    )}
                                    {weather.current.decodedMetar.wind && (
                                        <div className="weather-item">
                                            <strong>Wind:</strong> {weather.current.decodedMetar.wind.degrees || weather.current.decodedMetar.wind.direction || 'VRB'}° 
                                            @ {weather.current.decodedMetar.wind.speed || weather.current.decodedMetar.wind.speed_kts || 0}kt
                                            {(weather.current.decodedMetar.wind.gust || weather.current.decodedMetar.wind.gust_kts) && ` G${weather.current.decodedMetar.wind.gust || weather.current.decodedMetar.wind.gust_kts}kt`}
                                        </div>
                                    )}
                                    {weather.current.decodedMetar.visibility && (
                                        <div className="weather-item">
                                            <strong>Visibility:</strong> {weather.current.decodedMetar.visibility.value}{weather.current.decodedMetar.visibility.unit || 'SM'}
                                        </div>
                                    )}
                                    {weather.current.decodedMetar.clouds && weather.current.decodedMetar.clouds.length > 0 && (() => {
                                        // Find ceiling (lowest BKN or OVC layer)
                                        const ceilingLayer = weather.current.decodedMetar.clouds.find(
                                            cloud => cloud.quantity === 'BKN' || cloud.quantity === 'OVC'
                                        );
                                        const ceilingAlt = ceilingLayer ? ceilingLayer.height : null;
                                        
                                        // Sort clouds highest to lowest
                                        const sortedClouds = [...weather.current.decodedMetar.clouds].sort((a, b) => b.height - a.height);
                                        
                                        return (
                                            <div className="weather-item">
                                                <strong>Clouds:</strong>
                                                <ul>
                                                    {sortedClouds.map((cloud, idx) => {
                                                        const isCeilingOrHigher = ceilingAlt !== null && cloud.height >= ceilingAlt;
                                                        const isCeiling = cloud === ceilingLayer;
                                                        
                                                        return (
                                                            <li key={idx} style={{ fontWeight: isCeilingOrHigher ? 'bold' : 'normal' }}>
                                                                {cloud.quantity} @ {cloud.height}ft
                                                                {isCeiling && ' (ceiling)'}
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        );
                                    })()}
                                    {weather.current.decodedMetar.weatherConditions && weather.current.decodedMetar.weatherConditions.length > 0 && (
                                        <div className="weather-item">
                                            <strong>Weather:</strong> {weather.current.decodedMetar.weatherConditions.map(wc => 
                                                `${wc.intensity || ''}${wc.phenomenons.join(' ')}`
                                            ).join(', ')}
                                        </div>
                                    )}
                                    {weather.current.decodedMetar.temperature !== undefined && (
                                        <div className="weather-item">
                                            <strong>Temperature:</strong> {weather.current.decodedMetar.temperature}°C 
                                            ({(weather.current.decodedMetar.temperature * 9/5 + 32).toFixed(1)}°F)
                                        </div>
                                    )}
                                    {weather.current.decodedMetar.dewPoint !== undefined && (
                                        <div className="weather-item">
                                            <strong>Dewpoint:</strong> {weather.current.decodedMetar.dewPoint}°C 
                                            ({(weather.current.decodedMetar.dewPoint * 9/5 + 32).toFixed(1)}°F)
                                        </div>
                                    )}
                                    {weather.current.decodedMetar.altimeter && (
                                        <div className="weather-item">
                                            <strong>Altimeter:</strong> {weather.current.decodedMetar.altimeter.value}"
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {weather.current.openWeather && (
                        <div className="openweather-current-subsection">
                            <h5>OpenWeather Current</h5>
                            <div className="openweather-decoded">
                                <div className="weather-item">
                                    <strong>Time:</strong> {new Date(weather.current.openWeather.dt * 1000).toLocaleString()}
                                </div>
                                {weather.current.openWeather.weather && weather.current.openWeather.weather.length > 0 && (
                                    <div className="weather-item">
                                        <strong>Conditions:</strong> {weather.current.openWeather.weather[0].description}
                                        <img 
                                            src={`https://openweathermap.org/img/wn/${weather.current.openWeather.weather[0].icon}@2x.png`}
                                            alt={weather.current.openWeather.weather[0].description}
                                            style={{ width: '50px', height: '50px', verticalAlign: 'middle', marginLeft: '10px' }}
                                        />
                                    </div>
                                )}
                                <div className="weather-item">
                                    <strong>Temperature:</strong> {weather.current.openWeather.temp.toFixed(1)}°F
                                    (feels like {weather.current.openWeather.feels_like.toFixed(1)}°F)
                                </div>
                                <div className="weather-item">
                                    <strong>Wind:</strong> {weather.current.openWeather.wind_deg}° @ {weather.current.openWeather.wind_speed.toFixed(1)} mph
                                    {weather.current.openWeather.wind_gust && ` G${weather.current.openWeather.wind_gust.toFixed(1)} mph`}
                                </div>
                                <div className="weather-item">
                                    <strong>Visibility:</strong> {(weather.current.openWeather.visibility / 1609.34).toFixed(1)} mi
                                </div>
                                <div className="weather-item">
                                    <strong>Clouds:</strong> {weather.current.openWeather.clouds}%
                                </div>
                                <div className="weather-item">
                                    <strong>Humidity:</strong> {weather.current.openWeather.humidity}%
                                </div>
                                <div className="weather-item">
                                    <strong>Pressure:</strong> {weather.current.openWeather.pressure} hPa
                                </div>
                                <div className="weather-item">
                                    <strong>Dewpoint:</strong> {weather.current.openWeather.dew_point.toFixed(1)}°F
                                </div>
                                <div className="weather-item">
                                    <strong>UV Index:</strong> {weather.current.openWeather.uvi}
                                </div>
                                {weather.current.openWeather.rain && weather.current.openWeather.rain['1h'] && (
                                    <div className="weather-item">
                                        <strong>Rain (1h):</strong> {weather.current.openWeather.rain['1h']} mm
                                    </div>
                                )}
                                {weather.current.openWeather.snow && weather.current.openWeather.snow['1h'] && (
                                    <div className="weather-item">
                                        <strong>Snow (1h):</strong> {weather.current.openWeather.snow['1h']} mm
                                    </div>
                                )}
                                {weather.current.openWeather.sunrise && (
                                    <div className="weather-item">
                                        <strong>Sunrise:</strong> {new Date(weather.current.openWeather.sunrise * 1000).toLocaleTimeString()}
                                    </div>
                                )}
                                {weather.current.openWeather.sunset && (
                                    <div className="weather-item">
                                        <strong>Sunset:</strong> {new Date(weather.current.openWeather.sunset * 1000).toLocaleTimeString()}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            {weather.forecast && (
                <div className="forecast-section">
                    <h4>Forecast</h4>
                    
                    {weather.forecast.taf && (
                        <div className="taf-subsection">
                            <h5>TAF</h5>
                            <div className="taf-raw">{weather.forecast.taf}</div>
                        </div>
                    )}
                    
                    {weather.forecast.openWeatherHourly && weather.forecast.openWeatherHourly.length > 0 && (
                        <div className="openweather-hourly-subsection">
                            <h5>OpenWeather Hourly Forecast (Next 48 Hours)</h5>
                            <div className="hourly-forecast-grid">
                                {weather.forecast.openWeatherHourly.slice(0, 12).map((hour, idx) => (
                                    <div key={idx} className="hourly-item">
                                        <div className="hourly-time">
                                            {new Date(hour.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        {hour.weather && hour.weather.length > 0 && (
                                            <img 
                                                src={`https://openweathermap.org/img/wn/${hour.weather[0].icon}.png`}
                                                alt={hour.weather[0].description}
                                                title={hour.weather[0].description}
                                                style={{ width: '40px', height: '40px' }}
                                            />
                                        )}
                                        <div className="hourly-temp">{hour.temp.toFixed(0)}°F</div>
                                        <div className="hourly-wind">{hour.wind_deg}° {hour.wind_speed.toFixed(0)}mph</div>
                                        <div className="hourly-pop">PoP: {(hour.pop * 100).toFixed(0)}%</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {weather.forecast.openWeatherDaily && weather.forecast.openWeatherDaily.length > 0 && (
                        <div className="openweather-daily-subsection">
                            <h5>OpenWeather Daily Forecast (Next 8 Days)</h5>
                            <div className="daily-forecast-list">
                                {weather.forecast.openWeatherDaily.map((day, idx) => (
                                    <div key={idx} className="daily-item">
                                        <div className="daily-date">
                                            <strong>{new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</strong>
                                        </div>
                                        {day.weather && day.weather.length > 0 && (
                                            <div className="daily-conditions">
                                                <img 
                                                    src={`https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`}
                                                    alt={day.weather[0].description}
                                                    style={{ width: '50px', height: '50px', verticalAlign: 'middle' }}
                                                />
                                                <span>{day.weather[0].description}</span>
                                            </div>
                                        )}
                                        {day.summary && (
                                            <div className="daily-summary">{day.summary}</div>
                                        )}
                                        <div className="daily-temps">
                                            <strong>High:</strong> {day.temp.max.toFixed(0)}°F | 
                                            <strong> Low:</strong> {day.temp.min.toFixed(0)}°F
                                        </div>
                                        <div className="daily-details">
                                            Wind: {day.wind_deg}° @ {day.wind_speed.toFixed(1)} mph
                                            {day.wind_gust && ` G${day.wind_gust.toFixed(1)}`}
                                        </div>
                                        <div className="daily-details">
                                            Humidity: {day.humidity}% | Clouds: {day.clouds}%
                                        </div>
                                        <div className="daily-details">
                                            PoP: {(day.pop * 100).toFixed(0)}% | UV Index: {day.uvi}
                                        </div>
                                        {day.rain && (
                                            <div className="daily-details">
                                                Rain: {day.rain} mm
                                            </div>
                                        )}
                                        {day.snow && (
                                            <div className="daily-details">
                                                Snow: {day.snow} mm
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {weather.forecast.openWeatherAlerts && weather.forecast.openWeatherAlerts.length > 0 && (
                        <div className="openweather-alerts-subsection">
                            <h5>Weather Alerts</h5>
                            {weather.forecast.openWeatherAlerts.map((alert, idx) => (
                                <div key={idx} className="alert-item" style={{ 
                                    backgroundColor: '#fff3cd', 
                                    border: '1px solid #ffc107',
                                    borderRadius: '4px',
                                    padding: '10px',
                                    marginBottom: '10px'
                                }}>
                                    <div className="alert-header">
                                        <strong>{alert.event}</strong>
                                    </div>
                                    <div className="alert-sender">
                                        Source: {alert.sender_name}
                                    </div>
                                    <div className="alert-time">
                                        {new Date(alert.start * 1000).toLocaleString()} - {new Date(alert.end * 1000).toLocaleString()}
                                    </div>
                                    <div className="alert-description">
                                        {alert.description}
                                    </div>
                                    {alert.tags && alert.tags.length > 0 && (
                                        <div className="alert-tags">
                                            Tags: {alert.tags.join(', ')}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            
            {weather.lastUpdate && (
                <div className="weather-update">
                    Last updated: {new Date(weather.lastUpdate).toLocaleString()}
                </div>
            )}
        </div>
    );
}

// Component to render airport side panel
function AirportSidePanel({ airport, isPinned, sidePaneWidth }) {
    const chartId = `sv_${airport.id}`;
    const chartWidth = sidePaneWidth - 40; // Account for padding, same as camera
    const chartHeight = Math.min(chartWidth * 0.75, 450); // Maintain aspect ratio
    
    useEffect(() => {
        // Clear any existing chart
        const chartDiv = document.getElementById(chartId);
        if (chartDiv) {
            chartDiv.innerHTML = '';
        }
        
        // Load SkyVector chart
        const script = document.createElement('script');
        script.src = `https://skyvector.com/api/lchart?ll=${airport.lat},${airport.lon}&s=3&c=${chartId}&i=301`;
        script.type = 'text/javascript';
        script.async = true;
        document.body.appendChild(script);
        
        return () => {
            // Cleanup script on unmount
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, [airport.id, airport.lat, airport.lon, chartId, chartWidth]);
    
    return (
        <div className="airport-side-panel">
            <h3>{airport.id} - {airport.name}</h3>
            
            <div className="skyvector-section">
                <h4>Sectional Chart</h4>
                <div 
                    id={chartId} 
                    style={{ 
                        width: `${chartWidth}px`, 
                        height: `${chartHeight}px`,
                        margin: '10px 0',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                    }}
                ></div>
            </div>
            
            {airport.camUrl && (
                <div className="camera-section">
                    <h4>Camera View</h4>
                    {(() => {
                        const videoId = getYouTubeVideoId(airport.camUrl);
                        if (videoId) {
                            // Render YouTube embed with autoplay
                            return (
                                <iframe 
                                    width="100%" 
                                    height="315" 
                                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`}
                                    title="YouTube video player" 
                                    frameBorder="0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                    referrerPolicy="strict-origin-when-cross-origin" 
                                    allowFullScreen
                                    style={{ borderRadius: '4px' }}
                                ></iframe>
                            );
                        } else {
                            // Render regular image
                            return (
                                <img 
                                    src={`/api/weather?source=wxcam&airport=${airport.id}`} 
                                    alt={`${airport.id} camera`}
                                    className="camera-image"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            );
                        }
                    })()}
                </div>
            )}
            
            <div className="airport-details">
                <div className="detail-item">
                    <strong>City:</strong> {airport.city}
                </div>
                <div className="detail-item">
                    <strong>Zone:</strong> {airport.zone}
                </div>
                {airport.icao && (
                    <div className="detail-item">
                        <strong>ICAO:</strong> {airport.icao}
                    </div>
                )}
                <div className="detail-item">
                    <strong>Coordinates:</strong> {airport.lat.toFixed(6)}°, {airport.lon.toFixed(6)}°
                </div>
                <div className="detail-item">
                    <strong>Elevation:</strong> {airport.elevation} ft
                </div>
                <div className="detail-item">
                    <strong>Mag Variation:</strong> {airport.variation.toFixed(2)}° {airport.variation >= 0 ? 'E' : 'W'}
                </div>
            </div>
            
            {airport.runways && airport.runways.length > 0 && (
                <div className="runways-info">
                    <h4>Runways</h4>
                    {airport.runways.map((runway) => (
                        <div key={runway.id} className="runway-item">
                            <strong>{runway.id}</strong>: {runway.lengthFeet}' x {runway.widthFeet}' ({runway.surface})
                            <div className="runway-ends">
                                {runway.ends.map((end) => (
                                    <div key={end.id} className="runway-end">
                                        RWY {end.id}: {end.headingMagnetic}° mag ({end.headingTrue}° true)
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <WeatherInfo weather={airport.weather} />
        </div>
    );
}

function Map() {
    const [airports, setAirports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAirport, setSelectedAirport] = useState(null);
    const [hoveredAirport, setHoveredAirport] = useState(null);
    const [isPinned, setIsPinned] = useState(false);
    const [debugMode, setDebugMode] = useState(false);
    const [sidePaneWidth, setSidePaneWidth] = useState(400);
    const [isResizing, setIsResizing] = useState(false);
    const [currentZoom, setCurrentZoom] = useState(9);
    
    // Constants for ID box positioning based on zoom
    // Below threshold: box center aligns with circle center (obscures circle)
    // At/above threshold: box center aligns with top of circle (sits above circle)
    const ZOOM_POSITION_THRESHOLD = 10;  // Snap point between center and top alignment
    
    useEffect(() => {
        console.log('Fetching airports...');
        fetch('/api/airports')
            .then(response => {
                console.log('Response received:', response.ok);
                if (!response.ok) {
                    throw new Error('Failed to fetch airport data');
                }
                return response.json();
            })
            .then(data => {
                console.log('Airports loaded:', data.length);
                setAirports(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error loading airports:', err);
                setError(err.message);
                setLoading(false);
            });
    }, []);
    
    const handleAirportClick = (airport) => {
        if (isPinned && selectedAirport?.id === airport.id) {
            // Clicking on the same pinned airport unpins it
            setIsPinned(false);
            setSelectedAirport(null);
        } else {
            // Clicking on any airport (when unpinned or different airport) pins it
            setSelectedAirport(airport);
            setIsPinned(true);
        }
    };
    
    const handleAirportHover = (airport) => {
        if (!isPinned) {
            setSelectedAirport(airport);
        }
        // When pinned, do nothing on hover
    };
    
    const handleMapClick = () => {
        setIsPinned(false);
        setSelectedAirport(null); // Clear selection when unpinning
    };
    
    const startResize = (e) => {
        setIsResizing(true);
        e.preventDefault();
    };
    
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isResizing) {
                const newWidth = window.innerWidth - e.clientX;
                if (newWidth >= 400 && newWidth <= 800) {
                    setSidePaneWidth(newWidth);
                }
            }
        };
        
        const handleMouseUp = () => {
            setIsResizing(false);
        };
        
        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);
    
    const displayedAirport = selectedAirport;
    
    console.log('Render - loading:', loading, 'error:', error, 'airports:', airports.length);
    
    if (loading) {
        return <div className="map-loading">Loading airport data...</div>;
    }
    
    if (error) {
        return <div className="map-error">Error: {error}</div>;
    }
    
    return (
        <div className="map-container">
            <div className="map-wrapper">
                <div className="debug-toggle">
                    <label>
                        <input 
                            type="checkbox" 
                            checked={debugMode} 
                            onChange={(e) => setDebugMode(e.target.checked)}
                        />
                        Debug Mode
                    </label>
                    {debugMode && (
                        <div style={{ marginTop: '5px', fontSize: '12px', color: '#333' }}>
                            Zoom Level: {currentZoom}
                        </div>
                    )}
                </div>
                
                <MapContainer
                    center={[47.9, -122.2]}
                    zoom={9}
                    style={{ height: '100vh', width: '100%' }}
                >
                    <MapClickHandler onMapClick={handleMapClick} />
                    <ZoomHandler onZoomChange={setCurrentZoom} />
                    
                    <LayersControl position="topright">
                    <BaseLayer name="OpenStreetMap">
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                    </BaseLayer>
                    
                    <BaseLayer name="Satellite (Esri)">
                        <TileLayer
                            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                            maxZoom={19}
                        />
                    </BaseLayer>
                    
                    <BaseLayer name="Topographic">
                        <TileLayer
                            attribution='&copy; <a href="https://opentopomap.org">OpenTopoMap</a> contributors'
                            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                            maxZoom={17}
                        />
                    </BaseLayer>
                    
                    <BaseLayer checked name="Light (CartoDB)">
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                            maxZoom={19}
                        />
                    </BaseLayer>
                    
                    <BaseLayer name="Dark (CartoDB)">
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            maxZoom={19}
                        />
                    </BaseLayer>
                </LayersControl>
                

                {airports.map((airport) => (
                    <React.Fragment key={airport.id}>
                        {/* Airport bounding box for hover detection */}
                        <Rectangle
                            bounds={calculateAirportBounds(airport, 2)}
                            pathOptions={{
                                color: debugMode ? '#ff0000' : 'transparent',
                                fillColor: 'transparent',
                                fillOpacity: 0,
                                weight: debugMode ? 2 : 0
                            }}
                            eventHandlers={{
                                click: (e) => {
                                    L.DomEvent.stopPropagation(e);
                                    handleAirportClick(airport);
                                },
                                mouseover: () => handleAirportHover(airport),
                                mouseout: () => {
                                    if (!isPinned) {
                                        setSelectedAirport(null);
                                    }
                                }
                            }}
                        />
                        
                        {/* 2-mile radius circle showing flight category */}
                        {(() => {
                            const borderWidth = selectedAirport?.id === airport.id ? 4 : 2;
                            return (
                        <Circle
                            center={[airport.lat, airport.lon]}
                            radius={2 * 1609.34} // 2 miles in meters
                            pathOptions={{
                                color: getFlightCategory(airport).color,
                                fillColor: getFlightCategory(airport).color,
                                fillOpacity: 0.2,
                                weight: borderWidth
                            }}
                            eventHandlers={{
                                click: (e) => {
                                    L.DomEvent.stopPropagation(e);
                                    handleAirportClick(airport);
                                },
                                mouseover: () => handleAirportHover(airport),
                                mouseout: () => {
                                    if (!isPinned) {
                                        setSelectedAirport(null);
                                    }
                                }
                            }}
                        />
                            );
                        })()}
                        
                        {/* Airport ID label */}
                        {(() => {
                            const borderWidth = selectedAirport?.id === airport.id ? 4 : 2;
                            const category = getFlightCategory(airport);
                            // Background colors that match circle appearance at 0.2 opacity over white
                            const backgroundColors = {
                                '#00A500': '#CCFFCC', // VFR green
                                '#0000FF': '#CCCCFF', // MVFR blue
                                '#FF0000': '#FFCCCC', // IFR red
                                '#800080': '#E6CCE6', // LIFR purple
                                '#808080': '#E6E6E6'  // UNKNOWN gray
                            };
                            const backgroundColor = backgroundColors[category.color] || 'white';
                            const isPinnedAirport = isPinned && selectedAirport?.id === airport.id;
                            const pinIcon = isPinnedAirport 
                                ? `<div style="
                                    position: absolute;
                                    top: -7px;
                                    left: -7px;
                                    width: 14px;
                                    height: 14px;
                                    background: #555;
                                    border: 1.5px solid #DDD;
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-size: 8px;
                                    color: #DDD;
                                    box-shadow: 0 1px 2px rgba(0,0,0,0.2);
                                ">◆</div>`
                                : '';
                            return (
                        <Marker
                            position={(() => {
                                // Snap between center and top alignment based on zoom threshold
                                const verticalOffset = currentZoom >= ZOOM_POSITION_THRESHOLD ? 2.0 : 0;
                                return [airport.lat + (verticalOffset / 69), airport.lon];
                            })()}
                            icon={L.divIcon({
                                className: 'airport-label',
                                html: `<div style="
                                    position: relative;
                                    font-size: 13px; 
                                    font-weight: ${selectedAirport?.id === airport.id ? 'bold' : 'normal'}; 
                                    color: #000; 
                                    background: ${backgroundColor}; 
                                    border: ${borderWidth}px solid ${category.color}; 
                                    padding: 3px 8px; 
                                    white-space: nowrap;
                                    text-align: center;
                                    border-radius: 3px;
                                    display: inline-block;
                                    line-height: 1;
                                    box-sizing: border-box;
                                    transform: translate(-50%, -50%);
                                ">${pinIcon}${airport.id}</div>`,
                                iconSize: [0, 0],
                                iconAnchor: [0, 0]
                            })}
                            eventHandlers={{
                                click: (e) => {
                                    L.DomEvent.stopPropagation(e);
                                    handleAirportClick(airport);
                                },
                                mouseover: () => handleAirportHover(airport),
                                mouseout: () => {
                                    if (!isPinned) {
                                        setSelectedAirport(null);
                                    }
                                }
                            }}
                        />
                            );
                        })()}
                        
                        {/* Runway polygons */}
                        {airport.runways && airport.runways.map((runway) => {
                            if (runway.ends.length === 2) {
                                const polygonCoords = calculateRunwayPolygon(
                                    runway.ends[0],
                                    runway.ends[1],
                                    runway.widthFeet
                                );
                                
                                return (
                                    <Polygon
                                        key={runway.id}
                                        positions={polygonCoords}
                                        pathOptions={{
                                            color: '#333',
                                            fillColor: '#666',
                                            fillOpacity: 0.6,
                                            weight: 2
                                        }}
                                        interactive={false}
                                    />
                                );
                            }
                            return null;
                        })}
                    </React.Fragment>
                ))}
            </MapContainer>
            </div>
            
            <div className="side-pane" style={{ width: `${sidePaneWidth}px` }}>
                <div 
                    className="resize-handle" 
                    onMouseDown={startResize}
                ></div>
                {displayedAirport ? (
                    <AirportSidePanel airport={displayedAirport} isPinned={isPinned} sidePaneWidth={sidePaneWidth} />
                ) : (
                    <div className="side-pane-empty">
                        <p>Hover over an airport to view details</p>
                        <p className="hint">Click to pin the information</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Map;
