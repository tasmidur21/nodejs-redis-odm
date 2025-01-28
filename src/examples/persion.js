import { BaseModel } from "../models/BaseModel.js";

export class Person extends BaseModel {
    static indexName = "peoples";
    static schema = [{
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        age: { type: 'number' },
        verified: { type: 'boolean' }
    },
    {
        dataStructure: 'JSON'
    }
];
}