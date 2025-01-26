// src/models/BaseModel.js
import { redisClient } from "../utils/redisClient.js";
import { QueryBuilder } from "./QueryBuilder.js";

export class BaseModel {
  static entityName = "base"; // Override in subclasses
  static softDeletes = false;

  constructor(data) {
    Object.assign(this, data);
    this.id = this.id || `${Date.now()}`; // Ensure id is set
    this.createdAt = this.createdAt || new Date(); // Initialize createdAt
    this.updatedAt = this.updatedAt || new Date(); // Initialize updatedAt
    this.deletedAt = null; // Initialize deletedAt
  }

  static getKey(id) {
    return `${this.entityName}:${id}`;
  }

  // --- CRUD Operations ---

  static async create(data) {
    const id = data.id || `${Date.now()}`;
    const now = new Date();
    const modelData = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    await redisClient.set(this.getKey(id), JSON.stringify(modelData));
    return new this(modelData);
  }

  static async find(id) {
    const data = await redisClient.get(this.getKey(id));
    if (!data) return null;
    return new this(JSON.parse(data));
  }

  static async findOrFail(id) {
    const record = await this.find(id);
    if (!record) {
      throw new Error(`Record with id ${id} not found`);
    }
    return record;
  }

  static async firstOrFail() {
    const allRecords = await this.all();
    if (allRecords.length === 0) {
      throw new Error("No records found");
    }
    return allRecords[0];
  }

  static async findByIdAndDelete(id) {
    const record = await this.findOrFail(id);
    await redisClient.del(this.getKey(id));
    return record;
  }

  static async all() {
    const keys = await redisClient.keys(`${this.entityName}:*`);
    const results = [];
    for (const key of keys) {
      const data = await redisClient.get(key);
      if (data) {
        results.push(new this(JSON.parse(data)));
      }
    }
    return results;
  }

  static async paginate(page = 1, limit = 10) {
    const allRecords = await this.all();
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResults = allRecords.slice(startIndex, endIndex);
    return {
      total: allRecords.length,
      page,
      limit,
      data: paginatedResults,
    };
  }

  async save() {
    const now = new Date();
    this.updatedAt = now;
    if (!this.id) this.id = `${Date.now()}`;
    await redisClient.set(BaseModel.getKey(this.id), JSON.stringify(this));
  }

  async delete() {
    if (BaseModel.softDeletes) {
      this.deletedAt = new Date();
      await this.save();
    } else {
      await redisClient.del(BaseModel.getKey(this.id));
    }
  }

  // --- Query Method ---
  
  static query() {
    return new QueryBuilder(this);
  }

  // --- Join Methods ---

  static async join(relatedModel, foreignKey) {
    const allRecords = await this.all();
    const joinedData = [];

    for (const record of allRecords) {
      const relatedId = record[foreignKey];
      if (relatedId) {
        const relatedRecord = await relatedModel.find(relatedId);
        if (relatedRecord) {
          joinedData.push({ ...record, related: relatedRecord });
        }
      }
    }

    return joinedData;
  }

  static async leftJoin(relatedModel, foreignKey) {
    const allRecords = await this.all();
    const joinedData = [];

    for (const record of allRecords) {
      const relatedId = record[foreignKey];
      const relatedRecord = relatedId ? await relatedModel.find(relatedId) : null;
      joinedData.push({ ...record, related: relatedRecord });
    }

    return joinedData;
  }

  static async rightJoin(relatedModel, foreignKey) {
    const allRelatedRecords = await relatedModel.all();
    const joinedData = [];

    for (const relatedRecord of allRelatedRecords) {
      const relatedId = relatedRecord.id; // Assuming the related model has an 'id' field
      const record = await this.find(relatedId);
      joinedData.push({ ...record, related: relatedRecord });
    }

    return joinedData;
  }

  // --- Relationship Methods ---

  async hasOne(relatedEntity, foreignKey) {
    const relatedId = await redisClient.get(`${BaseModel.getKey(this.id)}:${foreignKey}`);
    if (!relatedId) return null;
    return relatedEntity.find(relatedId);
  }

  async belongsTo(relatedEntity, foreignKey) {
    const parentId = this[foreignKey];
    if (!parentId) return null;
    return relatedEntity.find(parentId);
  }

  async hasMany(relatedEntity, foreignKey) {
    const relatedIds = await redisClient.smembers(`${BaseModel.getKey(this.id)}:${foreignKey}`);
    const results = [];
    for (const id of relatedIds) {
      const related = await relatedEntity.find(id);
      if (related) results.push(related);
    }
    return results;
  }

  async addRelation(foreignKey, relatedId) {
    const key = `${BaseModel.getKey(this.id)}:${foreignKey}`;
    await redisClient.sadd(key, relatedId);
  }

  async removeRelation(foreignKey, relatedId) {
    const key = `${BaseModel.getKey(this.id)}:${foreignKey}`;
    await redisClient.srem(key, relatedId);
  }
}