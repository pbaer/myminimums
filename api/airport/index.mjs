export default async function (context, req) {
    context.log('Starting API execution for /airport');
    try {
        const id = req.query?.id ?? '';
        context.res = {
            status: 200,
            body: `Info for ${id}`
        };
    } catch (err) {
        context.res = {
            status: 500,
            body: 'Error'
        };
        context.log(`Error: ${err}\n${err.stack}`);
    }
}
