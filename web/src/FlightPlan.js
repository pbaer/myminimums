import React from 'react';
import { AirportDiagram, convertFromFAALat, convertFromFAALon } from './AirportDiagram';

const airport = {
    latitude: convertFromFAALat('48-9-38.7'),
    longitude: convertFromFAALon('122-9-32.5'),
    elevation: 141.8,
    runways: [
        { eastId: '11', westId: '29', lengthInFeet: 3498, widthInFeet: 75, orientationInTrueDegrees: 127, eastLatitude: convertFromFAALat('48-9-42.038'), eastLongitude: convertFromFAALon('122-10-7.6399'), eastPattern: 'right', westPattern: 'left' },
        { eastId: '16', westId: '34', lengthInFeet: 5332, widthInFeet: 100, orientationInTrueDegrees: 179, eastLatitude: convertFromFAALat('48-10-9.6429'), eastLongitude: convertFromFAALon('122-9-23.4968'), eastPattern: 'right', westPattern: 'left' },
        { eastId: '2', westId: '20', lengthInFeet: 4379, widthInFeet: 100, orientationInTrueDegrees: 20, eastLatitude: convertFromFAALat('48-9-7.4429'), eastLongitude: convertFromFAALon('122-9-10.4968'), eastPattern: 'left', westPattern: 'left' },
        { eastId: '32', westId: '14', lengthInFeet: 2332, widthInFeet: 150, orientationInTrueDegrees: 320, eastLatitude: convertFromFAALat('48-9-50.4429'), eastLongitude: convertFromFAALon('122-9-50.4968'), eastPattern: 'right', westPattern: 'right' },
        { eastId: '21', westId: '3', lengthInFeet: 2672, widthInFeet: 36, orientationInTrueDegrees: 211, eastLatitude: convertFromFAALat('48-9-40.4429'), eastLongitude: convertFromFAALon('122-9-50.4968'), eastPattern: 'left', westPattern: 'right' },
    ]
}

const FlightPlan = () => {
    return (
        <div>
            <h1>Airport Information</h1>
            <AirportDiagram airport={airport} />
        </div>
    );
}

export default FlightPlan;
