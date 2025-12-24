const https = require('https');
const loadNodeFetch = require('../../shared/node-fetch-wrapper');
import { getCachedData, putCachedData } from './cache';
import { airports } from './airports';

const noSSLAgent = new https.Agent({ rejectUnauthorized: false });

export const wxDisc = async () => {
    let wxdisc = getCachedData('wxdisc');
    if (!wxdisc) {
        const fetch = (await loadNodeFetch()).default;
        const response = await fetch('https://a.atmos.washington.edu/data/disc_report.html', { agent: noSSLAgent }); // Something is wrong with a.atmos.washington.edu's SSL certificate
        const text = await response.text();
        const start = 'Area Forecast Discussion\nNational Weather Service Seattle WA';
        const startIndex = text.indexOf(start);
        const end = '$$';
        const endIndex = text.indexOf(end, startIndex);
        wxdisc = {
            text: text.substring(startIndex, endIndex)
        };
        putCachedData('wxdisc', wxdisc);
    }
    let text = wxdisc.text.replace(/(?<!\n)\n(?!\n)/g, ' '); // Remove all newlines, except for those that start a new paragraph (two consecutive newlines)
    return text;
};

export const wxImg = async (imgType: string) => {
    const imgTypes = {
        ir: 'ir_enhanced',
        radar: 'atx_ncr',
        visible: 'vis1km_fog',
    }
    if (!imgTypes[imgType]) {
        throw new Error(`No image type for ${imgType}`);
    }
    imgType = imgTypes[imgType];
    const cacheKey = `wximg-${imgType}`;
    let wximg = getCachedData(cacheKey);
    if (!wximg) {
        const fetch = (await loadNodeFetch()).default;
        const response = await fetch(`https://a.atmos.washington.edu/~ovens/wxloop.old.cgi?${imgType}+1`, { agent: noSSLAgent }); // Something is wrong with a.atmos.washington.edu's SSL certificate
        const text = await response.text();
        let prefix;
        if (imgType === 'atx_ncr') {
            prefix = 'images/newnexrad/ATX/NCR';
        } else {
            prefix = `images/${imgType}`;
        }
        const start = `listArray[1]="/${prefix}/`;
        const startIndex = text.indexOf(start) + start.length;
        const end = '";';
        const endIndex = text.indexOf(end, startIndex);
        wximg = {
            url: `https://a.atmos.washington.edu/${prefix}/` + text.substring(startIndex, endIndex)
        }
        putCachedData(cacheKey, wximg);
    }
    return wximg.url;
};

export const wxCam = async (airport: string) => {
    const camUrl = airports.find(x => x.id === airport)?.camUrl;
    if (!camUrl) {
        throw new Error(`No webcam URL for ${airport}`);
    }
    const cacheKey = `wxcam-${airport}`;
    let wxcam = getCachedData(cacheKey);
    if (!wxcam) {
        const fetch = (await loadNodeFetch()).default;
        const response = await fetch(camUrl);
        const arrayBuffer = await response.arrayBuffer();
        const imageBuffer = Buffer.from(arrayBuffer);
        wxcam = {
            image: imageBuffer.toString('base64')
        };
        putCachedData(cacheKey, wxcam);
    }
    return Buffer.from(wxcam.image, 'base64');
};

export const wxMetar = async (airport: string) => {
    const cacheKey = `wxmetar-${airport}`;
    let wxMetar = getCachedData(cacheKey);
    if (!wxMetar) {
        const fetch = (await loadNodeFetch()).default;
        const icao = airports.find(x => x.id === airport)?.icao ?? airport;
        const response = await fetch(`https://aviationweather.gov/api/data/metar?ids=${icao}`);
        const body = await response.text();
        wxMetar = {
            text: body ?? 'No METAR'
        };
        putCachedData(cacheKey, wxMetar);
    }
    return wxMetar.text;
}
