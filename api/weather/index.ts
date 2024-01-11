import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { printToday } from '../shared/index';
import { wxDisc, wxImg, wxCam, wxMetar } from '../shared/wx';

const weatherHttpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('Starting API execution for ' + req.url);
    try {
        const source = req.query?.source ?? '';
        if (source === 'wxdisc') {
            context.res = {
                status: 200,
                body: await wxDisc()
            };
        } else if (source === 'wximg') {
            context.res = {
                status: 200,
                body: await wxImg(req.query?.type)
            };
        } else if (source == 'wxcam') {
            context.res = {
                status: 200,
                headers: { 'content-type': 'image/jpeg' },
                body: await wxCam(req.query?.airport),
                isRaw: true
            };
        } else if (source == 'wxmetar') {
            context.res = {
                status: 200,
                body: await wxMetar(req.query?.airport)
            };
        } else {
            const utcOffset = req.query && req.query.utcOffset;
            context.res = {
                status: 200,
                body: await printToday(utcOffset)
            };
        }
    } catch (err: any) {
        context.res = {
            status: 500,
            body: 'Error'
        };
        context.log(`Error: ${err}\n${err.stack}`);
    }
};

export default weatherHttpTrigger;
