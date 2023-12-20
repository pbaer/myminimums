import React, { useState, useEffect } from 'react';
import './Weather.css';

function Weather() {
  const [apiResponse, setApiResponse] = useState('');
  const [wxDiscussionResponse, setWxDiscussionResponse] = useState('');
  const [wxVisResponse, setWxVisResponse] = useState('');

  useEffect(() => {
    fetch('/api/today?utcOffset=-8')
      .then(response => response.text())
      .then(data => setApiResponse(data));
  }, []);

  useEffect(() => {
    fetch('/api/today?source=wxdisc')
      .then(response => response.text())
      .then(data => setWxDiscussionResponse(data.split('\n\n').map((paragraph, index) => {
        return paragraph ? (
          <p key={index}>{paragraph}</p>
        ) : undefined;
      })));
  }, []);

  useEffect(() => {
    fetch('/api/today?source=wxvis')
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
      <div className="wx-disc">{wxDiscussionResponse}</div>
      <img className="wx-cam" src="/api/today?source=wxcam" alt="Cam"/>
      <pre className="wx-tafs">{apiResponse}</pre>
    </div>
  );
}

export default Weather;
