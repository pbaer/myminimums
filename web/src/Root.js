import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import FlightPlan from './FlightPlan';
import Weather from './Weather';

const Root = () => {
    return (
        <Router>
            <Routes>
                <Route path="/flightplan" element={<FlightPlan />} />
                <Route path="/weather" element={<Weather />} />
                <Route path="/" element={<Weather />} />
            </Routes>
        </Router>
    );
}

export default Root;