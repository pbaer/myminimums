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
        visible: 'vis1km_fog',
        radar: 'atx_ncr',
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
        AWO: 'https://images.wsdot.wa.gov/airports/ArlRW11.jpg',
        BVS: 'http://images.wsdot.wa.gov/airports/SkagitRW29.jpg',
        PAE: 'https://www.snoco.org/axis-cgi/jpg/image.cgi?resolution=800x600',
        S43: 'http://www.harveyfield.com/WebcamImageHandler.ashx',
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
