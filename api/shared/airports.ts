export interface ICurrentWeather {
    metar: string;
    decoded: any;
};

export interface IForecastWeather {
    taf: string;
    decodedHours: any[];
};

export interface IWeather {
    current?: ICurrentWeather;
    forecast?: IForecastWeather;
};

export interface IAirport {
    id: string;
    idForMetar?: string;
    idForTaf?: string;
    runwaysTrue?: number[];
    hasMetar?: boolean;
    hasTaf?: boolean;
    local?: boolean;
    zone: string;
    name: string;
    city: string;
    weather?: IWeather;
};

export const airports: IAirport[] = [
    {
        id: 'S43',
        idForMetar: 'KPAE',
        idForTaf: 'KPAE',
        runwaysTrue: [165],
        hasMetar: true,
        hasTaf: true,
        local: true,
        zone: 'Home',
        name: 'Harvey Field',
        city: 'Snohomish'
    },
    {
        id: 'KPAE',
        runwaysTrue: [179],
        hasMetar: true,
        hasTaf: true,
        zone: 'Puget Sound',
        name: 'Paine Field',
        city: 'Everett'
    },
    {
        id: 'KPWT',
        runwaysTrue: [33],
        hasMetar: true,
        hasTaf: true,
        zone: 'Puget Sound',
        name: 'Bremerton National Airport',
        city: 'Bremerton'
    },
    {
        id: 'KBFI',
        runwaysTrue: [150],
        hasTaf: true,
        zone: 'Puget Sound',
        name: 'Boeing Field',
        city: 'Seattle'
    },
    {
        id: 'KSEA',
        hasTaf: true,
        zone: 'Puget Sound',
        name: 'Seattle-Tacoma International Airport',
        city: 'Seattle'
    },
    {
        id: 'KOLM',
        runwaysTrue: [11, 104],
        hasTaf: true,
        zone: 'Puget Sound',
        name: 'Olympia Regional Airport',
        city: 'Olympia'
    },
    {
        id: 'KCLM',
        runwaysTrue: [105],
        hasTaf: true,
        zone: 'Islands',
        name: 'William R. Fairchild International Airport',
        city: 'Port Angeles'
    },
    {
        id: 'CYYJ',
        hasTaf: true,
        zone: 'Islands',
        name: 'Victoria International Airport',
        city: 'Victoria'
    },
    {
        id: 'KBLI',
        runwaysTrue: [0],
        hasTaf: true,
        zone: 'Islands',
        name: 'Bellingham International Airport',
        city: 'Bellingham'
    },
    {
        id: 'KNUW',
        hasTaf: true,
        zone: 'Islands',
        name: 'Naval Air Station Whidbey Island',
        city: 'Oak Harbor'
    },
    {
        id: 'KHQM',
        runwaysTrue: [79],
        hasTaf: true,
        zone: 'Coast',
        name: 'Bowerman Airport',
        city: 'Hoquiam'
    },
    {
        id: 'KAST',
        runwaysTrue: [95, 154],
        hasTaf: true,
        zone: 'Coast',
        name: 'Astoria Regional Airport',
        city: 'Astoria'
    },
    {
        id: 'KPDX',
        hasTaf: true,
        zone: 'Gorge',
        name: 'Portland International Airport',
        city: 'Portland'
    },
    {
        id: 'KTTD',
        runwaysTrue: [89],
        hasTaf: true,
        zone: 'Gorge',
        name: 'Portland Troutdale Airport',
        city: 'Troutdale'
    },
    {
        id: 'KDLS',
        runwaysTrue: [88, 145],
        hasTaf: true,
        zone: 'Gorge',
        name: 'Columbia Gorge Regional Airport',
        city: 'The Dalles'
    },
    {
        id: 'KEAT',
        runwaysTrue: [135],
        hasTaf: true,
        zone: 'Eastern WA',
        name: 'Pangborn Memorial Airport',
        city: 'Wenatchee'
    },
    {
        id: 'KYKM',
        runwaysTrue: [110],
        hasTaf: true,
        zone: 'Eastern WA',
        name: 'Yakima Air Terminal',
        city: 'Yakima'
    },
    {
        id: 'KSFF',
        runwaysTrue: [54],
        hasTaf: true,
        zone: 'Eastern WA',
        name: 'Felts Field',
        city: 'Spokane'
    },
    {
        id: 'KPSC',
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
        id: 'KCLM',
        hasTaf: true,
        zone: 'Test Zone',
        name: 'Test Airport',
        city: 'Test City'
    }
];
