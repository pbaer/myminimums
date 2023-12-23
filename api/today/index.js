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
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../src/index");
const wx_1 = require("../src/wx");
function default_1(context, req) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        context.log('Starting API execution for /today');
        try {
            const source = (_b = (_a = req.query) === null || _a === void 0 ? void 0 : _a.source) !== null && _b !== void 0 ? _b : '';
            if (source === 'wxdisc') {
                context.res = {
                    status: 200,
                    body: yield (0, wx_1.wxDiscussion)()
                };
            }
            else if (source === 'wxvis') {
                context.res = {
                    status: 200,
                    body: yield (0, wx_1.wxVis)()
                };
            }
            else if (source == 'wxcam') {
                context.res = {
                    status: 200,
                    headers: { 'content-type': 'image/jpeg' },
                    body: yield (0, wx_1.wxCam)(),
                    isRaw: true
                };
            }
            else {
                const utcOffset = req.query && req.query.utcOffset;
                context.res = {
                    status: 200,
                    body: yield (0, index_1.printToday)(utcOffset)
                };
            }
        }
        catch (err) {
            context.res = {
                status: 500,
                body: 'Error'
            };
            context.log(`Error: ${err}\n${err.stack}`);
        }
    });
}
exports.default = default_1;
