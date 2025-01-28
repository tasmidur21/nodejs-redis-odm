import { BaseModel } from "../models/BaseModel.js";

export class Company extends BaseModel {
    static indexName = "companies";
    static schema = {
        name: { type: 'string' },
        industry: { type: 'string' }
    };
}