import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [apiResponse, setApiResponse] = useState('');
  const [wxDiscussionResponse, setWxDiscussionResponse] = useState('');

  useEffect(() => {
    fetch('/api/today')
      .then(response => response.text())
      .then(data => setApiResponse(data));
  }, []);

  useEffect(() => {
    fetch('/api/today?source=wxdisc')
      .then(response => response.text())
      .then(data => setWxDiscussionResponse(data.split('\n\n').map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        MyMinimums
      </header>
      <div className="Wx-Disc">{wxDiscussionResponse}</div>
      <pre>{apiResponse}</pre>
    </div>
  );
}

export default App;
