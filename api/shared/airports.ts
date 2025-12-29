import * as fs from 'fs';
import * as path from 'path';
import * as geomagnetism from 'geomagnetism';
import { 
    IOpenWeatherCurrent, 
    IOpenWeatherHourly, 
    IOpenWeatherDaily, 
    IOpenWeatherAlert 
} from './openweather-types';

export interface ICurrentWeather {
    metar?: string;
    decodedMetar?: any;
    openWeather?: IOpenWeatherCurrent;
};

export interface IForecastWeather {
    taf?: string;
    decodedTafHours?: any[];
    openWeatherHourly?: IOpenWeatherHourly[];
    openWeatherDaily?: IOpenWeatherDaily[];
    openWeatherAlerts?: IOpenWeatherAlert[];
};

export interface IWeather {
    lastUpdate: number;
    current?: ICurrentWeather;
    forecast?: IForecastWeather;
};

export interface IRunwayEnd {
    id: string;
    lat: number;
    lon: number;
    headingMagnetic: number;
    headingTrue: number;
}

export interface IRunway {
    id: string;
    ends: [IRunwayEnd, IRunwayEnd];
    lengthFeet: number;
    widthFeet: number;
    surface: string;
}

// These are the fields that we specify manually for each airport of interest
export interface IAirportMetadata {
    id: string;
    zone: string;
    local?: boolean;
    hasMetar?: boolean;
    hasTaf?: boolean;
    camUrl?: string;
    icaoOverride?: string;
    nameOverride?: string;
    cityOverride?: string;
    latOverride?: number;
    lonOverride?: number;
    elevationOverride?: number;
}

// The remaining fields are loaded from the FAA database files and weather APIs
export interface IAirport extends IAirportMetadata {
    icao?: string;
    name: string;
    city: string;
    lat: number;
    lon: number;
    elevation: number;
    variation: number;
    runways: IRunway[];
    weather?: IWeather;
};

function parseRunwayId(runwayId: string): { rwy1: number; rwy2: number; rwy1Str: string; rwy2Str: string } | null {
    const parts = runwayId.split('/');
    if (parts.length !== 2) {
        return null;
    }
    
    const rwy1Match = parts[0].match(/^(\d+)/);
    const rwy2Match = parts[1].match(/^(\d+)/);
    
    if (!rwy1Match || !rwy2Match) {
        return null;
    }
    
    return {
        rwy1: parseInt(rwy1Match[1]),
        rwy2: parseInt(rwy2Match[1]),
        rwy1Str: parts[0],
        rwy2Str: parts[1]
    };
}

function calculateTrueBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    const lonDiffRad = (lon2 - lon1) * Math.PI / 180;
    
    const x = Math.sin(lonDiffRad) * Math.cos(lat2Rad);
    const y = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(lonDiffRad);
    
    const bearingRad = Math.atan2(x, y);
    let bearingDeg = bearingRad * 180 / Math.PI;
    
    // Normalize to 0-360
    bearingDeg = (bearingDeg + 360) % 360;
    
    return bearingDeg;
}

function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    
    return result;
}

let airports: IAirport[] | undefined = undefined;

export const getAirports = (): IAirport[] => {
    if (airports) {
        return airports;
    }

    const airportsToLoad: IAirportMetadata[] = [
        { id: 'S43', zone: 'Home', local: true, camUrl: 'http://www.harveyfield.com/WebcamImageHandler.ashx' },
        
        // Puget Sound
        { id: 'PAE', zone: 'Puget Sound', hasMetar: true, hasTaf: true, camUrl: 'https://www.snoco.org/axis-cgi/jpg/image.cgi?resolution=800x600' },
        { id: 'AWO', zone: 'Puget Sound', hasMetar: true, camUrl: 'https://images.wsdot.wa.gov/airports/ArlRW11.jpg' },
        { id: '0S9', zone: 'Puget Sound', hasMetar: true, camUrl: 'https://images.wsdot.wa.gov/airports/PortTownsendW.jpg', icaoOverride: 'K0S9' },
        { id: 'PWT', zone: 'Puget Sound', hasMetar: true, hasTaf: true, camUrl: 'http://images.wsdot.wa.gov/airports/bremertonRWN.jpg' },
        { id: 'BFI', zone: 'Puget Sound', hasMetar: true, hasTaf: true, camUrl: 'https://kbfi.wasar.org/south.jpg' },
        { id: 'S88', zone: 'Puget Sound', camUrl: 'https://images.wsdot.wa.gov/airports/skywest.jpg' },
        { id: 'SEA', zone: 'Puget Sound', hasMetar: true, hasTaf: true, camUrl: 'https://cdn.tegna-media.com/king/weather/seatac.jpg' },
        { id: 'RNT', zone: 'Puget Sound', hasMetar: true, camUrl: 'https://images.wsdot.wa.gov/airports/renton.jpg' },
        { id: 'TIW', zone: 'Puget Sound', hasMetar: true },
        { id: 'PLU', zone: 'Puget Sound', hasMetar: true },
        { id: 'S50', zone: 'Puget Sound', camUrl: 'https://images.wsdot.wa.gov/airports/auburn2.jpg' },
        { id: 'OLM', zone: 'Puget Sound', hasMetar: true, hasTaf: true, camUrl: 'https://images.wsdot.wa.gov/airports/OlySouthR.jpg' },
        { id: 'SHN', zone: 'Puget Sound', hasMetar: true, camUrl: 'https://www.youtube.com/embed/lxWi_B3Rnss?si=obTvGTBXu6sB5-H7' },
        { id: 'TCM', zone: 'Puget Sound', hasMetar: true, hasTaf: true, icaoOverride: 'KTCM', latOverride: 47.079167, lonOverride: -122.580833, elevationOverride: 301 },
        { id: '21W', zone: 'Puget Sound' },

        // Islands
        { id: 'CLM', zone: 'Islands', hasMetar: true, hasTaf: true, camUrl: 'https://www.youtube.com/embed/pOgt56-SOJQ?si=n_kBk3pqYcAcbSnB' },
        { id: 'W28', zone: 'Islands', camUrl: 'https://w28webcam.blob.core.windows.net/cameras/south-snapshot.png' },
        { id: 'BLI', zone: 'Islands', hasMetar: true, hasTaf: true, camUrl: 'https://images.wsdot.wa.gov/airports/bham.jpg' },
        { id: '3W5', zone: 'Islands', camUrl: 'https://images.wsdot.wa.gov/airports/concrete3.jpg' },
        { id: '1S2', zone: 'Islands' },
        { id: 'BVS', zone: 'Islands', hasMetar: true, camUrl: 'http://images.wsdot.wa.gov/airports/SkagitRW29.jpg' },
        { id: '74S', zone: 'Islands', camUrl: 'https://images.wsdot.wa.gov/airports/anarunwayn.jpg' },
        { id: 'ORS', zone: 'Islands', hasMetar: true, camUrl: 'https://images.wsdot.wa.gov/airports/OrcasSW.jpg' },
        { id: 'S31', zone: 'Islands', camUrl: 'https://images.wsdot.wa.gov/airports/lopezn.jpg' },
        { id: 'RHR', zone: 'Islands', camUrl: 'https://images.weatherstem.com/skycamera/sanjuan/rocheharbor/runway/snapshot.jpg', nameOverride: 'ROCHE HARBOR', cityOverride: 'SAN JUAN ISLAND', latOverride: 48.612333, lonOverride: -123.138500, elevationOverride: 100 },
        { id: 'FHR', zone: 'Islands', hasMetar: true, camUrl: 'https://images.wsdot.wa.gov/airports/friday2.jpg' },
        { id: 'NUW', zone: 'Islands', hasMetar: true, hasTaf: true, camUrl: 'https://images.wsdot.wa.gov/nw/020vc03472.jpg', icaoOverride: 'KNUW', nameOverride: 'WHIDBEY ISLAND NAS', cityOverride: 'OAK HARBOR', latOverride: 48.3511, lonOverride: -122.6561, elevationOverride: 20 },
        
        // Coast
        { id: 'HQM', zone: 'Coast', hasMetar: true, hasTaf: true },
        { id: 'UIL', zone: 'Coast' },
        { id: 'AST', zone: 'Coast', hasMetar: true, hasTaf: true },
        
        // Portland Area
        { id: 'PDX', zone: 'Portland Area', hasMetar: true, hasTaf: true },
        { id: 'TTD', zone: 'Portland Area', hasMetar: true, hasTaf: true },
        { id: 'HIO', zone: 'Portland Area', hasMetar: true, hasTaf: true },
        { id: 'UAO', zone: 'Portland Area', hasMetar: true, hasTaf: true },
        { id: 'SPB', zone: 'Portland Area', hasMetar: true },
        { id: 'SLE', zone: 'Portland Area', hasMetar: true, hasTaf: true },
        { id: 'CLS', zone: 'Portland Area', hasMetar: true, camUrl: 'https://images.wsdot.wa.gov/airports/chehalis9.jpg' },
        { id: 'KLS', zone: 'Portland Area', hasMetar: true, camUrl: 'https://images.wsdot.wa.gov/airports/kelsosw.jpg' },
        { id: 'TDO', zone: 'Portland Area', camUrl: 'https://images.wsdot.wa.gov/airports/ToledoSouthEast.jpg' },
        { id: '55S', zone: 'Portland Area', camUrl: 'https://images.wsdot.wa.gov/airports/packwood5.jpg' },
        { id: 'W27', zone: 'Portland Area', camUrl: 'https://images.wsdot.wa.gov/airports/WoodlandS.jpg' },
        { id: 'TMK', zone: 'Portland Area', hasMetar: true },
        
        // Gorge
        { id: 'DLS', zone: 'Gorge', hasMetar: true, hasTaf: true },
        { id: 'PDT', zone: 'Gorge', hasMetar: true, hasTaf: true },
        
        // Eastern WA
        { id: 'ESW', zone: 'Eastern WA', camUrl: 'https://images.wsdot.wa.gov/airports/EastonE.jpg' },
        { id: 'S52', zone: 'Eastern WA', camUrl: 'http://images.wsdot.wa.gov/airports/MethowN.jpg' },
        { id: 'EAT', zone: 'Eastern WA', hasMetar: true, hasTaf: true, camUrl: 'https://cam.pangbornairport.com/webcam/pawebcam.jpg' },
        { id: 'YKM', zone: 'Eastern WA', hasMetar: true, hasTaf: true, camUrl: 'https://flyykm.com/apps/webcam/' },
        { id: 'ELN', zone: 'Eastern WA', hasMetar: true },
        { id: 'SFF', zone: 'Eastern WA', hasMetar: true, hasTaf: true, camUrl: 'http://www.northwestvoiceover.com/felts/image.jpg' },
        { id: 'PSC', zone: 'Eastern WA', hasMetar: true, hasTaf: true },
        { id: 'MWH', zone: 'Eastern WA', hasMetar: true, hasTaf: true, camUrl:'https://images.wsdot.wa.gov/airports/mosesnorth.jpg' },
        { id: 'EPH', zone: 'Eastern WA', hasMetar: true },
        { id: 'PUW', zone: 'Eastern WA', hasMetar: true, hasTaf: true, camUrl: 'https://images.wsdot.wa.gov/airports/pullmanne.jpg' },
        { id: 'ALW', zone: 'Eastern WA', hasMetar: true, hasTaf: true, camUrl: 'https://images.wsdot.wa.gov/airports/walla4.jpg' },
        { id: 'RLD', zone: 'Eastern WA', hasMetar: true, camUrl: 'https://images.wsdot.wa.gov/airports/rich1.jpg' },
        { id: 'OMK', zone: 'Eastern WA', hasMetar: true }
    ];

    // Read airports CSV
    const airportsPath = path.join(__dirname, 'data', 'airports.csv');
    const airportsData = fs.readFileSync(airportsPath, 'utf-8');
    const airportLines = airportsData.split('\n').filter(line => line.trim());
    const airportHeaders = parseCsvLine(airportLines[0]);
    
    // Create a map of airports by ID
    const airportsMap = new Map<string, any>();
    for (let i = 1; i < airportLines.length; i++) {
        const values = parseCsvLine(airportLines[i]);
        const row: any = {};
        airportHeaders.forEach((header, index) => {
            row[header] = values[index];
        });
        airportsMap.set(row.ARPT_ID, row);
    }
    
    // Read runways CSV
    const runwaysPath = path.join(__dirname, 'data', 'runways.csv');
    const runwaysData = fs.readFileSync(runwaysPath, 'utf-8');
    const runwayLines = runwaysData.split('\n').filter(line => line.trim());
    const runwayHeaders = parseCsvLine(runwayLines[0]);
    
    // Group runways by airport ID
    const runwaysByAirport = new Map<string, any[]>();
    for (let i = 1; i < runwayLines.length; i++) {
        const values = parseCsvLine(runwayLines[i]);
        const row: any = {};
        runwayHeaders.forEach((header, index) => {
            row[header] = values[index];
        });
        
        const arptId = row.ARPT_ID;
        if (!runwaysByAirport.has(arptId)) {
            runwaysByAirport.set(arptId, []);
        }
        runwaysByAirport.get(arptId)!.push(row);
    }
    
    // Build the airports array
    airports = [];
    
    for (const metadata of airportsToLoad) {
        const airportData = airportsMap.get(metadata.id);
        if (!airportData) {
            // Airport not found in CSV, use override fields
            const airport: IAirport = {
                ...metadata,
                icao: metadata.icaoOverride!,
                name: metadata.nameOverride!,
                city: metadata.cityOverride!,
                lat: metadata.latOverride!,
                lon: metadata.lonOverride!,
                elevation: metadata.elevationOverride!,
                variation: 0,
                runways: []
            };
            airports.push(airport);
            continue;
        }
        
        const runwayData = runwaysByAirport.get(metadata.id) || [];
        
        const lat = metadata.latOverride ?? parseFloat(airportData.LAT_DECIMAL);
        const lon = metadata.lonOverride ?? parseFloat(airportData.LONG_DECIMAL);
        const elevation = metadata.elevationOverride ?? (parseFloat(airportData.ELEV) || 0);

        // Calculate magnetic variation using geomagnetism package
        const elevationMeters = elevation * 0.3048;
        const geoMagResult = geomagnetism.model().point([lat, lon, elevationMeters]);
        const variation = geoMagResult.decl; // Declination in degrees (positive = east, negative = west)
        
        // Build runways
        const runways: IRunway[] = [];
        const processedRunways = new Set<string>();
        
        for (const rwyData of runwayData) {
            const runwayId = rwyData.RWY_ID;
            
            // Skip if we've already processed this runway
            if (processedRunways.has(runwayId)) {
                continue;
            }
            processedRunways.add(runwayId);
            
            const parsed = parseRunwayId(runwayId);
            if (!parsed) {
                continue;
            }
            
            const { rwy1, rwy2, rwy1Str, rwy2Str } = parsed;
            
            // Parse coordinates
            const lat1 = parseFloat(rwyData.LAT1_DECIMAL);
            const lon1 = parseFloat(rwyData.LONG1_DECIMAL);
            const lat2 = parseFloat(rwyData.LAT2_DECIMAL);
            const lon2 = parseFloat(rwyData.LONG2_DECIMAL);
            
            if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
                continue;
            }
            
            // Calculate true bearings
            const trueBearing1to2 = calculateTrueBearing(lat1, lon1, lat2, lon2);
            const trueBearing2to1 = calculateTrueBearing(lat2, lon2, lat1, lon1);
            
            // Convert true bearings to magnetic headings
            let magHeading1to2 = trueBearing1to2 - variation;
            let magHeading2to1 = trueBearing2to1 - variation;
            
            // Normalize to 0-360
            if (magHeading1to2 < 0) magHeading1to2 += 360;
            if (magHeading1to2 >= 360) magHeading1to2 -= 360;
            if (magHeading2to1 < 0) magHeading2to1 += 360;
            if (magHeading2to1 >= 360) magHeading2to1 -= 360;
            
            // Determine which lat/long corresponds to which runway end by comparing
            // the magnetic heading to the runway designators
            const designator1Heading = rwy1 * 10 === 0 ? 360 : rwy1 * 10;
            const designator2Heading = rwy2 * 10 === 0 ? 360 : rwy2 * 10;
            
            // Calculate angular differences (accounting for 360/0 wraparound)
            const diff1to2vsRwy1 = Math.min(
                Math.abs(magHeading1to2 - designator1Heading),
                360 - Math.abs(magHeading1to2 - designator1Heading)
            );
            const diff1to2vsRwy2 = Math.min(
                Math.abs(magHeading1to2 - designator2Heading),
                360 - Math.abs(magHeading1to2 - designator2Heading)
            );
            
            // If heading from point1 to point2 matches rwy1 better, then point1 is the rwy1 end
            // Otherwise point1 is the rwy2 end
            let end1: IRunwayEnd, end2: IRunwayEnd;
            
            if (diff1to2vsRwy1 < diff1to2vsRwy2) {
                // Point 1 is the rwy1 end (heading from it toward point2 matches rwy1)
                end1 = {
                    id: rwy1Str,
                    lat: lat1,
                    lon: lon1,
                    headingMagnetic: Math.round(magHeading1to2),
                    headingTrue: Math.round(trueBearing1to2)
                };
                end2 = {
                    id: rwy2Str,
                    lat: lat2,
                    lon: lon2,
                    headingMagnetic: Math.round(magHeading2to1),
                    headingTrue: Math.round(trueBearing2to1)
                };
            } else {
                // Point 1 is the rwy2 end (heading from it toward point2 matches rwy2)
                end1 = {
                    id: rwy2Str,
                    lat: lat1,
                    lon: lon1,
                    headingMagnetic: Math.round(magHeading1to2),
                    headingTrue: Math.round(trueBearing1to2)
                };
                end2 = {
                    id: rwy1Str,
                    lat: lat2,
                    lon: lon2,
                    headingMagnetic: Math.round(magHeading2to1),
                    headingTrue: Math.round(trueBearing2to1)
                };
            }
            
            runways.push({
                id: runwayId,
                ends: [end1, end2],
                lengthFeet: parseFloat(rwyData.RWY_LEN) || 0,
                widthFeet: parseFloat(rwyData.RWY_WIDTH) || 0,
                surface: rwyData.SURFACE_TYPE_CODE || 'UNKNOWN'
            });
        }
        
        const airport: IAirport = {
            ...metadata,
            icao: metadata.icaoOverride ?? airportData.ICAO_ID,
            name: metadata.nameOverride ?? airportData.ARPT_NAME,
            city: metadata.cityOverride ?? airportData.CITY,
            lat,
            lon,
            elevation,
            variation,
            runways
        };
        
        airports.push(airport);
    }
    
    return airports;
}
