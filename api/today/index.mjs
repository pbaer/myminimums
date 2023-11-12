import { printToday } from '../src/index.mjs';

export default async function (context, req) {
    context.log('Starting execution');
    try {
        const utcOffset = req.query && req.query.utcOffset;
        context.res = {
            status: 200,
            body: await printToday(utcOffset)
        };    
    } catch (err) {
        context.res = {
            status: 500,
            body: 'Error'
        };
        context.log(`Error: ${err}`);
    }
}
