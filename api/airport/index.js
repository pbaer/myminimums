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
function default_1(context, req) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        context.log('Starting API execution for /airport');
        try {
            const id = (_b = (_a = req.query) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : '';
            context.res = {
                status: 200,
                body: `Info for ${id}`
            };
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
