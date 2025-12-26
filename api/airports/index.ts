import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { getAirports } from '../shared/airports';
import { addWeather } from '../shared/taf';

const airportsHttpTrigger: AzureFunction = async function (context: Context, _req: HttpRequest): Promise<void> {
    context.log('Airports API endpoint triggered');
    
    try {
        const airports = getAirports();
        
        // Fetch weather for all airports that have weather capabilities
        const weatherPromises = airports
            .filter(airport => airport.hasMetar || airport.hasTaf)
            .map(airport => addWeather(airport));
        
        await Promise.all(weatherPromises);
        
        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: airports
        };
    } catch (err: any) {
        context.res = {
            status: 500,
            body: 'Error processing request'
        };
        context.log(`Error: ${err}\n${err.stack}`);
    }
};

export default airportsHttpTrigger;
