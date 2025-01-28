import { Schema, Repository, EntityId } from 'redis-om';
import client from '../utils/client.js';
import { QueryBuilder } from './QueryBuilder.js';

export class BaseModel {
  static schema = {}; // To be overridden by child classes
  static repository = null; // To be initialized by child classes
  static dataStructure="JSON"
  static indexName = "base";

  // Initialize plugins
  static async initialize() {
    if (!this.repository) {
      this.repository = new Repository(new Schema(this.indexName,...this.schema), client);
    }
  }
  // Create and save a new entity
  static async create(data) {
    await this.initialize();
    const response=await this.repository.save(data);
    return{
      id:response[EntityId],
      ...JSON.parse(JSON.stringify(response))
    }
  }

   // Get a query builder instance
   static query() {
    return new QueryBuilder(this.repository);
  }

  // Find an entity by ID
  static async find(id) {
    await this.initialize();
    return await this.repository.fetch(id);
  }

  // Update an entity
  static async update(id, data) {
    await this.initialize();
    const entity = await this.repository.fetch(id);
    Object.assign(entity, data);
    return await this.repository.save(entity);
  }

  // Delete an entity
  static async delete(id) {
    await this.initialize();
    return await this.repository.remove(id);
  }

  // Get all entities
  static async all() {
    await this.initialize();
    return await this.repository.search().return.all();
  }

  // Define a one-to-one relationship
  hasOne(RelatedModel, foreignKey) {
    return {
      get: async () => {
        const relatedId = this[foreignKey];
        return relatedId ? await RelatedModel.find(relatedId) : null;
      },
      set: async (relatedEntity) => {
        this[foreignKey] = relatedEntity.entityId;
        await this.repository.save(this);
      }
    };
  }

  // Define a one-to-many relationship
  hasMany(RelatedModel, foreignKey) {
    return {
      get: async () => {
        return await RelatedModel.query()
          .where(foreignKey, '=', this.entityId)
          .get();
      },
      add: async (relatedEntity) => {
        relatedEntity[foreignKey] = this.entityId;
        await RelatedModel.update(relatedEntity.entityId, relatedEntity);
      }
    };
  }

  // Define the inverse of a relationship
  belongsTo(RelatedModel, foreignKey) {
    return {
      get: async () => {
        const relatedId = this[foreignKey];
        return relatedId ? await RelatedModel.find(relatedId) : null;
      },
      set: async (relatedEntity) => {
        this[foreignKey] = relatedEntity.entityId;
        await this.repository.save(this);
      }
    };
  }

}