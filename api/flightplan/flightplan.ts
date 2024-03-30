import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const flightPlanSchema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": {
        "id": {
            "type": "string"
        },
        "departureTime": {
            "type": "string",
            "format": "date-time"
        },
        "aircraft": {
            "type": "string"
        },
        "aircraftType": {
            "type": "string"
        },
        "segments": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "route": {
                        "type": "array",
                        "items": {
                            "type": "string"
                        },
                        "minItems": 2
                    },
                    "altitude": {
                        "type": "number",
                        "minimum": 1,
                        "maximum": 60000
                    },
                    "remarks": {
                        "type": "string"
                    }
                },
                "required": ["route", "altitude"]
            }
        }
    },
    "required": ["departureTime", "aircraft", "aircraftType", "segments"]
};

export interface ISegment {
    route: string[];
    altitude: number;
    remarks?: string;
}

export interface IFlightPlan {
    id?: string;
    departureTime: string;
    aircraft: string;
    aircraftType: string;
    segments: ISegment[];
}

export const validateFlightPlan = (flightPlan: IFlightPlan) => {
    const ajv = new Ajv();
    addFormats(ajv);
    const validateFlightPlanSchema = ajv.compile(flightPlanSchema);
    if (!validateFlightPlanSchema(flightPlan)) {
        throw new Error(`Schema validation failed: ${validateFlightPlanSchema.errors}`);
    }
};
