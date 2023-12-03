import fetch from 'node-fetch';
import { getCachedData, putCachedData } from './cache.mjs';

export const wxDiscussion = async () => {
    let wxdisc = getCachedData('wxdisc');
    if (!wxdisc) {
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
