// src/models/QueryBuilder.js
import { BaseModel } from "./BaseModel.js";

export class QueryBuilder {
  constructor(entity) {
    this.entity = entity;
    this.filters = {};
    this.selectedFields = null; // Initialize selected fields
  }

  where(field, value) {
    this.filters[field] = value;
    return this;
  }

  select(fields) {
    this.selectedFields = fields; // Store the selected fields
    return this;
  }

  async get() {
    const allRecords = await this.entity.all();
    const filteredRecords = allRecords.filter((record) =>
      Object.entries(this.filters).every(([key, value]) => record[key] === value)
    );

    // If selectedFields is set, map the records to only include those fields
    if (this.selectedFields) {
      return filteredRecords.map(record => {
        const selectedRecord = {};
        this.selectedFields.forEach(field => {
          selectedRecord[field] = record[field];
        });
        return selectedRecord;
      });
    }

    return filteredRecords; // Return all fields if none are selected
  }

  async join(relatedModel, foreignKey, conditions = {}) {
    const allRecords = await this.get(); // Get the filtered records
    const joinedData = [];

    for (const record of allRecords) {
      const relatedId = record[foreignKey];
      if (relatedId) {
        const relatedRecords = await relatedModel.all();
        const filteredRelatedRecords = relatedRecords.filter(relatedRecord => {
          // Check if the related record matches the conditions
          return Object.entries(conditions).every(([key, condition]) => {
            const [operator, value] = Array.isArray(condition) ? condition : ['=', condition];
            switch (operator) {
              case '=':
                return relatedRecord[key] === value;
              case '!=':
                return relatedRecord[key] !== value;
              case '>':
                return relatedRecord[key] > value;
              case '<':
                return relatedRecord[key] < value;
              case '>=':
                return relatedRecord[key] >= value;
              case '<=':
                return relatedRecord[key] <= value;
              default:
                return true; // If the operator is not recognized, return true (no filtering)
            }
          });
        });

        // If there are matching related records, combine them
        if (filteredRelatedRecords.length > 0) {
          filteredRelatedRecords.forEach(relatedRecord => {
            joinedData.push({ ...record, related: relatedRecord });
          });
        }
      }
    }

    return joinedData;
  }

  async pluck(field) {
    const records = await this.get();
    return records.map(record => record[field]);
  }

  async key(field) {
    const records = await this.get();
    return records.reduce((acc, record) => {
      acc[record[field]] = record; // Use the specified field as the key
      return acc;
    }, {});
  }
}