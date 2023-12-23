"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wxCam = exports.wxVis = exports.wxDiscussion = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const cache_1 = require("./cache");
const wxDiscussion = () => __awaiter(void 0, void 0, void 0, function* () {
    let wxdisc = (0, cache_1.getCachedData)('wxdisc');
    if (!wxdisc) {
        const response = yield (0, node_fetch_1.default)('https://a.atmos.washington.edu/data/disc_report.html');
        const text = yield response.text();
        const start = 'Area Forecast Discussion\nNational Weather Service Seattle WA';
        const startIndex = text.indexOf(start);
        const end = '$$';
        const endIndex = text.indexOf(end, startIndex);
        wxdisc = {
            text: text.substring(startIndex, endIndex)
        };
        (0, cache_1.putCachedData)('wxdisc', wxdisc);
    }
    let text = wxdisc.text.replace(/(?<!\n)\n(?!\n)/g, ' '); // Remove all newlines, except for those that start a new paragraph (two consecutive newlines)
    return text;
});
exports.wxDiscussion = wxDiscussion;
const wxVis = () => __awaiter(void 0, void 0, void 0, function* () {
    let wxvis = (0, cache_1.getCachedData)('wxvis');
    if (!wxvis) {
        const response = yield (0, node_fetch_1.default)('https://a.atmos.washington.edu/~ovens/wxloop.cgi?vis1km_fog+1');
        const text = yield response.text();
        const start = 'listArray[1]="/images/vis1km_fog/';
        const startIndex = text.indexOf(start) + start.length;
        const end = '";';
        const endIndex = text.indexOf(end, startIndex);
        wxvis = {
            url: 'https://a.atmos.washington.edu/images/vis1km_fog/' + text.substring(startIndex, endIndex)
        };
        (0, cache_1.putCachedData)('wxvis', wxvis);
    }
    return wxvis.url;
});
exports.wxVis = wxVis;
const wxCam = () => __awaiter(void 0, void 0, void 0, function* () {
    let wxcam = (0, cache_1.getCachedData)('wxcam');
    if (!wxcam) {
        const response = yield (0, node_fetch_1.default)('http://www.harveyfield.com/WebcamImageHandler.ashx');
        const arrayBuffer = yield response.arrayBuffer();
        const imageBuffer = Buffer.from(arrayBuffer);
        wxcam = {
            image: imageBuffer.toString('base64')
        };
        (0, cache_1.putCachedData)('wxcam', wxcam);
    }
    return Buffer.from(wxcam.image, 'base64');
});
exports.wxCam = wxCam;
