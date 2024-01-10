import React, { useState, useEffect } from 'react';
import './Weather.css';

function Weather() {
  const [apiResponse, setApiResponse] = useState('');
  const [wxDiscussionResponse, setWxDiscussionResponse] = useState('');
  const [wxVisibleResponse, setWxVisibleResponse] = useState('');
  const [wxRadarResponse, setWxRadarResponse] = useState('');

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

  const currentTimeString = new Date().toLocaleString('en-US', { hour12: false, timeZone: 'UTC', hour: '2-digit', minute: '2-digit' }).replace(':', '') + 'Z';

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
      </div>
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
