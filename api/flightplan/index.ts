import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { v4 as uuidv4 } from 'uuid';
import BlobStorage from "../shared/blob-storage";
import { validateFlightPlan } from "./flightplan";

const makeBlobKey = (id: string) => `${id}.json`;

const flightPlanHttpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const blobStorage = new BlobStorage(process.env.BLOB_STORAGE_CONNECTION!, 'flightplans');

    switch (req.method) {
        case "POST":
            {
                let flightPlanString: string;
                try {
                    const flightPlan = req.body;
                    validateFlightPlan(flightPlan);
                    flightPlan.id = uuidv4();
                    flightPlanString = JSON.stringify(flightPlan, null, 2);
                    blobStorage.writeBlob(makeBlobKey(flightPlan.id), flightPlanString);
                } catch(err) {
                    context.res = {
                        status: 400,
                        body: `Invalid flight plan: ${err}`,
                    };
                    return;
                }
                context.res = {
                    status: 201,
                    body: flightPlanString,
                };
            }
            break;
        case "PUT":
            {
                let flightPlanBlobKeys: string[];
                try {
                    flightPlanBlobKeys = await blobStorage.listBlobs();
                } catch(err) {
                    context.res = {
                        status: 500,
                        body: `Error listing flight plans`,
                    };
                    return;
                }
                if (!flightPlanBlobKeys.includes(makeBlobKey(context.bindingData.id))) {
                    context.res = {
                        status: 404,
                        body: `Unknown flight plan ${context.bindingData.id}`,
                    };
                    return;
                }
                let flightPlanString: string;
                try {
                    const flightPlan = req.body;
                    validateFlightPlan(flightPlan);
                    flightPlan.id = context.bindingData.id;
                    flightPlanString = JSON.stringify(flightPlan, null, 2);
                    blobStorage.writeBlob(makeBlobKey(flightPlan.id), flightPlanString);
                } catch(err) {
                    context.res = {
                        status: 400,
                        body: `Invalid flight plan: ${err}`,
                    };
                    return;
                }
                context.res = {
                    status: 200,
                    body: flightPlanString,
                };
            }
            break;
        case "GET":
            {
                if (context.bindingData.id) {
                    let flightPlanString: string;
                    try {
                        flightPlanString = await blobStorage.readBlob(makeBlobKey(context.bindingData.id));
                    } catch(err) {
                        context.res = {
                            status: 404,
                            body: `Unknown flight plan ${context.bindingData.id}`,
                        };
                        return;
                    }
                    context.res = {
                        status: 200,
                        body: flightPlanString
                    };
                } else {
                    let flightPlanBlobKeys: string[];
                    try {
                        flightPlanBlobKeys = await blobStorage.listBlobs();
                    } catch(err) {
                        context.res = {
                            status: 500,
                            body: `Error listing flight plans`,
                        };
                        return;
                    }
                    let flightPlans: string[] = [];
                    for (let flightPlanBlobKey of flightPlanBlobKeys) {
                        try {
                            flightPlans.push(await blobStorage.readBlob(flightPlanBlobKey));
                        } catch(err) {
                            context.res = {
                                status: 500,
                                body: `Error reading flight plan ${flightPlanBlobKey}`,
                            };
                            return;
                        }
                    }
                    context.res = {
                        status: 200,
                        body: `[${flightPlans.join(',\n')}]`
                    };
                }
            }
            break;
        default:
            context.res = {
                status: 400,
                body: "Invalid HTTP method",
            };
            break;
    }
};

export default flightPlanHttpTrigger;
