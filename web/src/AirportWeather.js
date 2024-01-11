import React, { useState, useEffect } from 'react';
import './AirportWeather.css';

const removeRemarks = (metar) => {
    return metar.replace(/\s+RMK\s+.*/, '');
};

export function AirportWeather({ airport }) {
    const [metar, setMetar] = useState('');

    useEffect(() => {
      fetch(`/api/weather?source=wxmetar&airport=${airport.id}`)
        .then(response => response.text())
        .then(data => setMetar(data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="airport">
            <div className="name">{airport.name}</div>
            <div className="metar">{removeRemarks(metar)}</div>
            <img className="cam" src={`/api/weather?source=wxcam&airport=${airport.id}`} alt="Cam"/>
        </div>
    );
}
