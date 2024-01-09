const loadNodeFetch = require('../../shared/node-fetch-wrapper');
import { getCachedData, putCachedData } from './cache';

export const wxDiscussion = async () => {
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

export const wxVis = async () => {
    let wxvis = getCachedData('wxvis');
    if (!wxvis) {
        const fetch = (await loadNodeFetch()).default;
        const response = await fetch('https://a.atmos.washington.edu/~ovens/wxloop.cgi?vis1km_fog+1');
        const text = await response.text();
        const start = 'listArray[1]="/images/vis1km_fog/';
        const startIndex = text.indexOf(start) + start.length;
        const end = '";';
        const endIndex = text.indexOf(end, startIndex);
        wxvis = {
            url: 'https://a.atmos.washington.edu/images/vis1km_fog/' + text.substring(startIndex, endIndex)
        }
        putCachedData('wxvis', wxvis);
    }
    return wxvis.url;
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