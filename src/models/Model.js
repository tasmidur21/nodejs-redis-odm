export class Model{
    static schema = {}; // To be overridden by child classes
    static repository = null; // To be initialized by child classes
  
    static plugins = [];
  
    // Register a plugin
    static use(plugin) {
      this.plugins.push(plugin);
      plugin(this);
    }
  
    // Initialize plugins
    static async initialize() {
      if (!this.repository) {
        this.repository = client.fetchRepository(new Schema(this, this.schema));
        await this.repository.createIndex();
      }
  
      // Apply plugins
      this.plugins.forEach(plugin => plugin(this));
    }
  
    // Set a key-value pair in Redis
    static async setKey(key, value) {
      await client.set(key, JSON.stringify(value));
    }
  
    // Get a value by key from Redis
    static async getKey(key) {
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    }
  
    // Delete a key from Redis
    static async deleteKey(key) {
      await client.del(key);
    }
  
    // Create and save a new entity
    static async create(data) {
      await this.initialize();
      return await this.repository.createAndSave(data);
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
  
    // Get a query builder instance
    static query() {
      return new QueryBuilder(this.repository);
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