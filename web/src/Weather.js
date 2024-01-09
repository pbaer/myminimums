import React, { useState, useEffect } from 'react';
import './Weather.css';

function Weather() {
  const [apiResponse, setApiResponse] = useState('');
  const [wxDiscussionResponse, setWxDiscussionResponse] = useState('');
  const [wxVisResponse, setWxVisResponse] = useState('');

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
    fetch('/api/weather?source=wxvis')
      .then(response => response.text())
      .then(data => setWxVisResponse(data));
  }, []);

  const currentTimeString = new Date().toLocaleString('en-US', { hour12: false, timeZone: 'UTC', hour: '2-digit', minute: '2-digit' }).replace(':', '') + 'Z';

  return (
    <div className="wx">
      <header className="wx-header">
        MyMinimums {currentTimeString}
      </header>
      <img className="wx-vis" src={wxVisResponse} alt="Vis"/>
      <div className="grid-container">
        <div className="grid-item">
          <div className="wx-disc">{wxDiscussionResponse}</div>
        </div>
        <div className="grid-item">
          Harvey Field
          <img className="wx-cam" src="/api/weather?source=wxcam&airport=S43" alt="Cam"/>
          Arlington
          <img className="wx-cam" src="/api/weather?source=wxcam&airport=AWO" alt="Cam"/>
          Skagit Regional
          <img className="wx-cam" src="/api/weather?source=wxcam&airport=BVS" alt="Cam"/>
          Paine Field
          <img className="wx-cam" src="/api/weather?source=wxcam&airport=PAE" alt="Cam"/>
        </div>
      </div>
      <pre className="wx-tafs">{apiResponse}</pre>
    </div>
  );
}

export default Weather;
