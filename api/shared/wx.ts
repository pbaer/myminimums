const loadNodeFetch = require('../../shared/node-fetch-wrapper');
import { getCachedData, putCachedData } from './cache';

export const wxDisc = async () => {
    let wxdisc = getCachedData('wxdisc');
    if (!wxdisc) {
        const fetch = (await loadNodeFetch()).default;
        const response = await fetch('https://a.atmos.washington.edu/data/disc_report.html');
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
        const response = await fetch(`https://a.atmos.washington.edu/~ovens/wxloop.cgi?${imgType}+1`);
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
    const camUrls = {
        '74S': 'https://images.wsdot.wa.gov/airports/anarunwayn.jpg',
        'K0S9': 'https://images.wsdot.wa.gov/airports/porttownsendE.jpg',
        'KAWO': 'https://images.wsdot.wa.gov/airports/ArlRW11.jpg',
        'KBFI': 'https://kbfi.wasar.org/south.jpg',
        'KBLI': 'https://images.wsdot.wa.gov/airports/bham.jpg',
        'KBVS': 'http://images.wsdot.wa.gov/airports/SkagitRW29.jpg',
        'KFHR': 'https://images.wsdot.wa.gov/airports/friday2.jpg',
        'KNUW': 'https://images.wsdot.wa.gov/nw/020vc03472.jpg',
        'KOLM': 'https://images.wsdot.wa.gov/airports/OlySW.jpg',
        'KORS': 'https://images.wsdot.wa.gov/airports/OrcasSW.jpg',
        'KPAE': 'https://www.snoco.org/axis-cgi/jpg/image.cgi?resolution=800x600',
        'KPWT': 'http://images.wsdot.wa.gov/airports/bremertonRWN.jpg',
        'S43': 'http://www.harveyfield.com/WebcamImageHandler.ashx',
        'S50': 'https://images.wsdot.wa.gov/airports/auburn2.jpg',
    };
    if (!camUrls[airport]) {
        throw new Error(`No webcam URL for ${airport}`);
    }
    const cacheKey = `wxcam-${airport}`;
    let wxcam = getCachedData(cacheKey);
    if (!wxcam) {
        const fetch = (await loadNodeFetch()).default;
        const response = await fetch(camUrls[airport]);
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
        const response = await fetch(`https://aviationweather.gov/api/data/metar?ids=${airport}`);
        const body = await response.text();
        wxMetar = {
            text: body
        };
        putCachedData(cacheKey, wxMetar);
    }
    return wxMetar.text;
}
