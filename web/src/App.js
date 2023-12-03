import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [apiResponse, setApiResponse] = useState('');
  const [wxDiscussionResponse, setWxDiscussionResponse] = useState('');
  const [wxVisResponse, setWxVisResponse] = useState('');

  useEffect(() => {
    fetch('/api/today')
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
    <div className="App">
      <header className="App-header">
        MyMinimums {currentTimeString}
      </header>
      <img className="Wx-Vis" src={wxVisResponse}/>
      <div className="Wx-Disc">{wxDiscussionResponse}</div>
      <pre className="Tafs">{apiResponse}</pre>
    </div>
  );
}

export default App;
