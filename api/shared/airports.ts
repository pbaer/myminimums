export interface ICurrentWeather {
    metar: string;
    decodedMetar: any;
};

export interface IForecastWeather {
    taf: string;
    decodedTafHours: any[];
};

export interface IWeather {
    current?: ICurrentWeather;
    forecast?: IForecastWeather;
};

export interface IAirport {
    id: string;
    icao?: string;
    runwaysTrue?: number[];
    hasMetar?: boolean;
    hasTaf?: boolean;
    local?: boolean;
    zone: string;
    name: string;
    city: string;
    weather?: IWeather;
    camUrl?: string;
};

export const airports: IAirport[] = [
    {
        id: 'S43',
        icao: 'KPAE',
        runwaysTrue: [165],
        hasMetar: true,
        hasTaf: true,
        local: true,
        zone: 'Home',
        name: 'Harvey Field',
        city: 'Snohomish',
        camUrl: 'http://www.harveyfield.com/WebcamImageHandler.ashx'
    },
    {
        id: 'PAE',
        icao: 'KPAE',
        runwaysTrue: [179],
        hasMetar: true,
        hasTaf: true,
        zone: 'Puget Sound',
        name: 'Paine Field',
        city: 'Everett',
        camUrl: 'https://www.snoco.org/axis-cgi/jpg/image.cgi?resolution=800x600'
    },
    {
        id: 'AWO',
        icao: 'KAWO',
        zone: 'Puget Sound',
        name: 'Arlington Municipal Airport',
        city: 'Arlington',
        camUrl: 'https://images.wsdot.wa.gov/airports/ArlRW11.jpg'
    },
    {
        id: '0S9',
        icao: 'K0S9',
        zone: 'Puget Sound',
        name: 'Jefferson County International Airport',
        city: 'Port Townsend',
        camUrl: 'https://images.wsdot.wa.gov/airports/PortTownsendW.jpg'
    },
    {
        id: 'PWT',
        icao: 'KPWT',
        runwaysTrue: [33],
        hasMetar: true,
        hasTaf: true,
        zone: 'Puget Sound',
        name: 'Bremerton National Airport',
        city: 'Bremerton',
        camUrl: 'http://images.wsdot.wa.gov/airports/bremertonRWN.jpg'
    },
    {
        id: 'BFI',
        icao: 'KBFI',
        runwaysTrue: [150],
        hasTaf: true,
        zone: 'Puget Sound',
        name: 'Boeing Field',
        city: 'Seattle',
        camUrl: 'https://kbfi.wasar.org/south.jpg'
    },
    {
        id: 'SEA',
        icao: 'KSEA',
        hasTaf: true,
        zone: 'Puget Sound',
        name: 'Seattle-Tacoma International Airport',
        city: 'Seattle'
    },
    {
        id: 'S50',
        zone: 'Puget Sound',
        name: 'Auburn Municipal Airport',
        city: 'Auburn',
        camUrl: 'https://images.wsdot.wa.gov/airports/auburn2.jpg'
    },
    {
        id: 'OLM',
        icao: 'KOLM',
        runwaysTrue: [11, 104],
        hasTaf: true,
        zone: 'Puget Sound',
        name: 'Olympia Regional Airport',
        city: 'Olympia',
        camUrl: 'https://images.wsdot.wa.gov/airports/OlySouthR.jpg'
    },
    {
        id: 'CLM',
        icao: 'KCLM',
        runwaysTrue: [105],
        hasTaf: true,
        zone: 'Islands',
        name: 'William R. Fairchild International Airport',
        city: 'Port Angeles'
    },
    {
        id: 'BLI',
        icao: 'KBLI',
        runwaysTrue: [0],
        hasTaf: true,
        zone: 'Islands',
        name: 'Bellingham International Airport',
        city: 'Bellingham',
        camUrl: 'https://images.wsdot.wa.gov/airports/bham.jpg'
    },
    {
        id: 'BVS',
        icao: 'KBVS',
        zone: 'Islands',
        name: 'Skagit Regional Airport',
        city: 'Burlington/Mount Vernon',
        camUrl: 'http://images.wsdot.wa.gov/airports/SkagitRW29.jpg'
    },
    {
        id: '74S',
        zone: 'Islands',
        name: 'Anacortes Airport',
        city: 'Anacortes',
        camUrl: 'https://images.wsdot.wa.gov/airports/anarunwayn.jpg'
    },
    {
        id: 'ORS',
        icao: 'KORS',
        zone: 'Islands',
        name: 'Orcas Island Airport',
        city: 'Orcas Island',
        camUrl: 'https://images.wsdot.wa.gov/airports/OrcasSW.jpg'
    },
    {
        id: 'FHR',
        icao: 'KFHR',
        zone: 'Islands',
        name: 'Friday Harbor Airport',
        city: 'Friday Harbor',
        camUrl: 'https://images.wsdot.wa.gov/airports/friday2.jpg'
    },
    {
        id: 'NUW',
        icao: 'KNUW',
        hasTaf: true,
        zone: 'Islands',
        name: 'Naval Air Station Whidbey Island',
        city: 'Oak Harbor',
        camUrl: 'https://images.wsdot.wa.gov/nw/020vc03472.jpg'
    },
    {
        id: 'HQM',
        icao: 'KHQM',
        runwaysTrue: [79],
        hasTaf: true,
        zone: 'Coast',
        name: 'Bowerman Airport',
        city: 'Hoquiam'
    },
    {
        id: 'AST',
        icao: 'KAST',
        runwaysTrue: [95, 154],
        hasTaf: true,
        zone: 'Coast',
        name: 'Astoria Regional Airport',
        city: 'Astoria'
    },
    {
        id: 'PDX',
        icao: 'KPDX',
        hasTaf: true,
        zone: 'Gorge',
        name: 'Portland International Airport',
        city: 'Portland'
    },
    {
        id: 'TTD',
        icao: 'KTTD',
        runwaysTrue: [89],
        hasTaf: true,
        zone: 'Gorge',
        name: 'Portland Troutdale Airport',
        city: 'Troutdale'
    },
    {
        id: 'DLS',
        icao: 'KDLS',
        runwaysTrue: [88, 145],
        hasTaf: true,
        zone: 'Gorge',
        name: 'Columbia Gorge Regional Airport',
        city: 'The Dalles'
    },
    {
        id: 'EAT',
        icao: 'KEAT',
        runwaysTrue: [135],
        hasTaf: true,
        zone: 'Eastern WA',
        name: 'Pangborn Memorial Airport',
        city: 'Wenatchee'
    },
    {
        id: 'YKM',
        icao: 'KYKM',
        runwaysTrue: [110],
        hasTaf: true,
        zone: 'Eastern WA',
        name: 'Yakima Air Terminal',
        city: 'Yakima'
    },
    {
        id: 'SFF',
        icao: 'KSFF',
        runwaysTrue: [54],
        hasTaf: true,
        zone: 'Eastern WA',
        name: 'Felts Field',
        city: 'Spokane'
    },
    {
        id: 'PSC',
        icao: 'KPSC',
        runwaysTrue: [45, 135],
        hasTaf: true,
        zone: 'Eastern WA',
        name: 'Tri-Cities Airport',
        city: 'Pasco'
    }
];

// For testing
export const airportsXXX: IAirport[] = [
    {
        id: 'CLM',
        icao: 'KCLM',
        hasTaf: true,
        zone: 'Test Zone',
        name: 'Test Airport',
        city: 'Test City'
    }
];
