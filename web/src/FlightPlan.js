import React from 'react';

function convertFromFAALatLon(faaLatLon) {
    const parts = faaLatLon.split('-');
    let degrees = parseFloat(parts[0]);
    let minutes = parseFloat(parts[1]) / 60;
    let seconds = parseFloat(parts[2]) / 3600;
    return degrees + minutes + seconds;
}

function convertFromFAALat(faaLat) {
    return convertFromFAALatLon(faaLat);
}

function convertFromFAALon(faaLon) {
    return convertFromFAALatLon(faaLon) * -1;
}

function degreesToFeet(degrees, latitude = 0) {
    const milesPerDegree = Math.cos(latitude * Math.PI / 180) * 69;
    return degrees * milesPerDegree * 5280;
}

function feetToDegrees(feet, latitude = 0) {
    const milesPerDegree = Math.cos(latitude * Math.PI / 180) * 69;
    return (feet / 5280) / milesPerDegree ;
}

const airport = {
    latitude: convertFromFAALat('48-9-38.7'),
    longitude: convertFromFAALon('122-9-32.5'),
    elevation: 141.8,
    runways: [
        { baseId: '11', reciprocalId: '29', lengthInFeet: 3498, widthInFeet: 75, orientationInTrueDegrees: 127, baseLatitude: convertFromFAALat('48-9-42.038'), baseLongitude: convertFromFAALon('122-10-7.6399') },
        { baseId: '16', reciprocalId: '34', lengthInFeet: 5332, widthInFeet: 100, orientationInTrueDegrees: 179, baseLatitude: convertFromFAALat('48-10-9.6429'), baseLongitude: convertFromFAALon('122-9-23.4968') },
        { baseId: '2', reciprocalId: '20', lengthInFeet: 4379, widthInFeet: 100, orientationInTrueDegrees: 20, baseLatitude: convertFromFAALat('48-9-7.4429'), baseLongitude: convertFromFAALon('122-9-10.4968') },
        { baseId: '32', reciprocalId: '14', lengthInFeet: 2332, widthInFeet: 150, orientationInTrueDegrees: 320, baseLatitude: convertFromFAALat('48-9-50.4429'), baseLongitude: convertFromFAALon('122-9-50.4968') },
        { baseId: '21', reciprocalId: '3', lengthInFeet: 2672, widthInFeet: 36, orientationInTrueDegrees: 211, baseLatitude: convertFromFAALat('48-9-40.4429'), baseLongitude: convertFromFAALon('122-9-50.4968') },
    ]
}
const RunwayDiagram = ({ airport }) => {
    const maxRunwayLengthInFeet = Math.max(...airport.runways.map(r => r.lengthInFeet));
    const viewBoxSizeInFeet = maxRunwayLengthInFeet * 1.4;
    const scale = 1;

    const renderRunway = (runway) => {
        const { lengthInFeet, widthInFeet, orientationInTrueDegrees, baseLatitude, baseLongitude, baseId, reciprocalId } = runway;

        const baseX = degreesToFeet(baseLongitude - airport.longitude, airport.latitude);
        const baseY = -degreesToFeet(baseLatitude - airport.latitude);

        const baseLabelX = baseX;
        const baseLabelY = baseY + 190;

        const reciprocalLabelX = baseX;
        const reciprocalLabelY = baseY - lengthInFeet - 10;

        const dimensionsLabelX = baseX - (widthInFeet / 2 + 50) * (orientationInTrueDegrees < 180 ? 1 : -1);
        const dimensionsLabelY = baseY - lengthInFeet / 2;

        const roundedLengthInFeet = Math.round((lengthInFeet - 30) / 100) * 100; // Conservative rounding to nearest 100 feet (round down unless within 20 feet of next 100)

        const runwayTransform = `rotate(${orientationInTrueDegrees}, ${baseX}, ${baseY})`;

        return (
            <g transform={runwayTransform}>
                <rect
                    key={runway.baseId}
                    x={baseX - (widthInFeet / 2)}
                    y={baseY - lengthInFeet}
                    width={widthInFeet}
                    height={lengthInFeet}
                    fill="grey"
                />
                <text
                    x={baseLabelX}
                    y={baseLabelY}
                    textAnchor="middle"
                    fill="black"
                    fontSize="180pt"
                    fontWeight="bold"
                >
                    {baseId}
                </text>
                <text
                    x={reciprocalLabelX}
                    y={reciprocalLabelY}
                    textAnchor="middle"
                    fill="black"
                    fontSize="180pt"
                    fontWeight="bold"
                    transform={`rotate(180, ${reciprocalLabelX}, ${reciprocalLabelY - 90})`}
                >
                    {reciprocalId}
                </text>
                <text
                    x={dimensionsLabelX}
                    y={dimensionsLabelY}
                    textAnchor="middle"
                    fill="black"
                    fontSize="160pt"
                    transform={`rotate(${orientationInTrueDegrees < 180 ? 270 : 90}, ${dimensionsLabelX}, ${dimensionsLabelY})`}
                >
                    {`${roundedLengthInFeet} x ${widthInFeet}`}
                </text>
            </g>
        );
    };

    const renderAirportCenter = () => {
        const x = 0;
        const y = 0;
        return (
            <circle
                cx={x}
                cy={y}
                r={20}
                fill="red"
            />
        );
    }

    return (
        <svg width="900px" height="900px" viewBox={`${-viewBoxSizeInFeet/2} ${-viewBoxSizeInFeet/2} ${viewBoxSizeInFeet} ${viewBoxSizeInFeet}`} style={{ border: '1px solid black' }}>
            {airport.runways.map(renderRunway)}
            {renderAirportCenter()}
        </svg>
    );
};


const FlightPlan = () => {
    return (
        <div>
            <h1>Flight Plan Page</h1>
            <RunwayDiagram airport={airport} />
        </div>
    );
}

export default FlightPlan;
