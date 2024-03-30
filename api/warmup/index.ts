import { AzureFunction, Context, HttpRequest } from "@azure/functions"

const warmupHttpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('Processing warmup request');
    context.res = {
        body: "Warmup completed"
    };
};

export default warmupHttpTrigger;
