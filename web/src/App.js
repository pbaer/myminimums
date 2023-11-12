import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [apiResponse, setApiResponse] = useState('');

  useEffect(() => {
    fetch('/api/today')
      .then(response => response.text())
      .then(data => setApiResponse(data));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <pre>{apiResponse}</pre>
      </header>
    </div>
  );
}

export default App;
