function convertFromFAALatLon(faaLatLon) {
    const parts = faaLatLon.split('-');
    let degrees = parseFloat(parts[0]);
    let minutes = parseFloat(parts[1]) / 60;
    let seconds = parseFloat(parts[2]) / 3600;
    return degrees + minutes + seconds;
}

export function convertFromFAALat(faaLat) {
    return convertFromFAALatLon(faaLat);
}

export function convertFromFAALon(faaLon) {
    return convertFromFAALatLon(faaLon) * -1;
}

function degreesToFeet(degrees, latitude = 0) {
    const milesPerDegree = Math.cos(latitude * Math.PI / 180) * 69;
    return degrees * milesPerDegree * 5280;
}

export const AirportDiagram = ({ airport }) => {
    const maxRunwayLengthInFeet = Math.max(...airport.runways.map(r => r.lengthInFeet));
    const viewBoxSizeInFeet = maxRunwayLengthInFeet * 1.6;

    const renderRunway = (runway) => {
        const { lengthInFeet, widthInFeet, orientationInTrueDegrees, eastLatitude, eastLongitude, eastId, westId } = runway;

        const eastX = degreesToFeet(eastLongitude - airport.longitude, airport.latitude);
        const eastY = -degreesToFeet(eastLatitude - airport.latitude);

        const runwayLabelOffset = 10;
        const runwayLabelHeight = 180;
        const dimensionsLabelHeight = 160;
        const tpaLabelHeight = 120;
        const patternBaseOffset = 700;
        const patternDownwindOffset = 1800;

        // Conservative rounding to nearest 100 feet (round down unless within 20 feet of next 100)
        const roundedLengthInFeet = Math.round((lengthInFeet - 30) / 100) * 100;

        // Conservative rounding to nearest 50 feet (round up unless within 20 feet of previous 50)
        const roundedTpaInFeet = Math.round((airport.elevation + 1000 + 5) / 50) * 50;

        const eastLabelX = eastX;
        const eastLabelY = eastY + runwayLabelHeight + runwayLabelOffset;

        const westLabelX = eastX;
        const westLabelY = eastY - lengthInFeet - runwayLabelOffset;

        const dimensionsLabelX = eastX - (widthInFeet / 2 + 50) * (orientationInTrueDegrees < 180 ? 1 : -1);
        const dimensionsLabelY = eastY - lengthInFeet / 2;

        const patternStartY = eastY - lengthInFeet/2;

        const eastPatternEndY = eastY + runwayLabelHeight + runwayLabelOffset + 20;
        const eastPatternStartX = eastX + patternDownwindOffset * (runway.eastPattern === 'right' ? 1 : -1);
        const eastPatternPoints = [
            `${eastX},${eastPatternEndY}`,
            `${eastX},${eastPatternEndY + patternBaseOffset}`,
            `${eastPatternStartX},${eastPatternEndY + patternBaseOffset}`,
            `${eastPatternStartX},${patternStartY}`,
        ];

        const westPatternEndY = eastY - lengthInFeet - runwayLabelHeight - runwayLabelOffset - 20;
        const westPatternStartX = eastX + patternDownwindOffset * (runway.westPattern === 'right' ? -1 : 1);
        const westPatternPoints = [
            `${eastX},${westPatternEndY}`,
            `${eastX},${westPatternEndY - patternBaseOffset}`,
            `${westPatternStartX},${westPatternEndY - patternBaseOffset}`,
            `${westPatternStartX},${patternStartY}`,
        ];

        const runwaySvg = (
            <g>
                <rect
                    key={runway.eastId}
                    x={eastX - (widthInFeet / 2)}
                    y={eastY - lengthInFeet}
                    width={widthInFeet}
                    height={lengthInFeet}
                    fill="grey"
                />
                <text
                    x={dimensionsLabelX}
                    y={dimensionsLabelY}
                    textAnchor="middle"
                    fill="black"
                    fontSize={`${dimensionsLabelHeight}pt`}
                    transform={`rotate(${orientationInTrueDegrees < 180 ? 270 : 90}, ${dimensionsLabelX}, ${dimensionsLabelY})`}
                >
                    {`${roundedLengthInFeet} x ${widthInFeet}`}
                </text>
            </g>
        );

        const patternSvg = (patternPoints) => {
            return (
                <polyline
                    points={patternPoints.join(' ')}
                    fill="none"
                    stroke="blue"
                    strokeWidth={30}
                    strokeDasharray="70 70"
                />
            );
        }

        const tpaLabelSvg = (patternStartX) => {
            return (
                <g transform={`rotate(${orientationInTrueDegrees < 180 ? 270 : 90}, ${patternStartX}, ${patternStartY})`}>
                    <rect
                        x={patternStartX - 300}
                        y={patternStartY - 150}
                        width={600}
                        height={300}
                        fill="white"
                        stroke="blue"
                        strokeWidth={30}
                    />
                    <text
                        x={patternStartX}
                        y={patternStartY + tpaLabelHeight/2}
                        textAnchor="middle"
                        fill="black"
                        fontSize={`${tpaLabelHeight}pt`}
                        fontWeight="bold"
                    >
                        {roundedTpaInFeet}
                    </text>
                </g>
            );
        }

        const runwayLabelSvg = (labelX, labelY, label, rotate) => {
            return (
                <text
                    x={labelX}
                    y={labelY}
                    textAnchor="middle"
                    fill="black"
                    fontSize={`${runwayLabelHeight}pt`}
                    fontWeight="bold"
                    transform={rotate ? `rotate(${rotate}, ${labelX}, ${labelY - runwayLabelHeight/2})` : undefined}
                >
                    {label}
                </text>
            );
        }

        return (
            <g transform={`rotate(${orientationInTrueDegrees}, ${eastX}, ${eastY})`}>
                {runwaySvg}
                {patternSvg(eastPatternPoints)}
                {patternSvg(westPatternPoints)}
                {tpaLabelSvg(eastPatternStartX)}
                {eastPatternStartX !== westPatternStartX ? tpaLabelSvg(westPatternStartX) : ''}
                {runwayLabelSvg(eastLabelX, eastLabelY, eastId)}
                {runwayLabelSvg(westLabelX, westLabelY, westId, 180)}
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
