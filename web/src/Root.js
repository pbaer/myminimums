import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import FlightPlan from './FlightPlan';
import Weather from './Weather';
import Map from './Map';

const Root = () => {
    const [isWarmedUp, setIsWarmedUp] = useState(false);

    useEffect(() => {
        fetch('/api/warmup')
        .then(response => {
            if (response.ok) {
                setIsWarmedUp(true);
            }
        });
    }, []);

    return (
        <Router>
            <Routes>
                {isWarmedUp && (
                    <>
                        <Route path="/flightplan" element={<FlightPlan />} />
                        <Route path="/weather" element={<Weather />} />
                        <Route path="/map" element={<Map />} />
                        <Route path="/" element={<Weather />} />
                    </>
                )}
            </Routes>
        </Router>
    );
}

export default Root;