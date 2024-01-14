import React, { useState, useEffect } from 'react';
import { AirportWeather } from './AirportWeather';
import './Weather.css';

function Weather() {
  const [apiResponse, setApiResponse] = useState('');
  const [wxDiscussionResponse, setWxDiscussionResponse] = useState('');
  const [wxVisibleResponse, setWxVisibleResponse] = useState('');
  const [wxRadarResponse, setWxRadarResponse] = useState('');
  const [wxIRResponse, setWxIRResponse] = useState('');

  useEffect(() => {
    fetch('/api/weather?utcOffset=-8')
      .then(response => response.text())
      .then(data => setApiResponse(data));
  }, []);

  useEffect(() => {
    fetch('/api/weather?source=wxdisc')
      .then(response => response.text())
      .then(data => setWxDiscussionResponse(data.split('\n\n').map((paragraph, index) => {
        return paragraph ? (
          <p key={index}>{paragraph}</p>
        ) : undefined;
      })));
  }, []);

  useEffect(() => {
    fetch('/api/weather?source=wximg&type=visible')
      .then(response => response.text())
      .then(data => setWxVisibleResponse(data));
  }, []);

  useEffect(() => {
    fetch('/api/weather?source=wximg&type=radar')
      .then(response => response.text())
      .then(data => setWxRadarResponse(data));
  }, []);

  useEffect(() => {
    fetch('/api/weather?source=wximg&type=ir')
      .then(response => response.text())
      .then(data => setWxIRResponse(data));
  }, []);

  const currentTimeString = new Date().toLocaleString('en-US', { hour12: false, timeZone: 'UTC', hour: '2-digit', minute: '2-digit' }).replace(':', '') + 'Z';

  const airports = {
    pugetSound: [
      { id: 'S43', name: 'Harvey Field' },
      { id: 'KPAE', name: 'Paine Field' },
      { id: 'KAWO', name: 'Arlington Municipal' },
      { id: 'K0S9', name: 'Jefferson County International' },
      { id: 'KBFI', name: 'Boeing Field' },
      { id: 'KPWT', name: 'Bremerton National' },
      { id: 'KOLM', name: 'Olympia Regional' }
    ],
    islands: [
      { id: 'KBVS', name: 'Skagit Regional' },
      { id: 'KBLI', name: 'Bellingham International' },
      { id: 'KNUW', name: 'Whidbey Island Naval Air Station' },
      { id: 'KORS', name: 'Orcas Island' },
      { id: 'KFHR', name: 'Friday Harbor' },
    ]
  };

  return (
    <div className="wx">
      <header className="wx-header">
        MyMinimums {currentTimeString}
      </header>
      <div className="grid-container">
        <div className="grid-item">
          <img className="wx-img" src={wxVisibleResponse} alt="Imagery"/>
        </div>
        <div className="grid-item">
          <img className="wx-img" src={wxRadarResponse} alt="Imagery"/>
        </div>
        <div className="grid-item">
          <img className="wx-img" src={wxIRResponse} alt="Imagery"/>
        </div>
      </div>
      <div className="grid-container">
        <div className="grid-item">
          <div className="wx-disc">{wxDiscussionResponse}</div>
        </div>
        <div className="grid-item">
          {airports.pugetSound.map((airport) => (
            <AirportWeather airport={airport} />
          ))}
        </div>
        <div className="grid-item">
          {airports.islands.map((airport) => (
            <AirportWeather airport={airport} />
          ))}
        </div>
      </div>
      <pre className="wx-tafs">{apiResponse}</pre>
    </div>
  );
}

export default Weather;
