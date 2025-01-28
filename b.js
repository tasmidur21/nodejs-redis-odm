import { createClient } from 'redis';
import { Repository, Schema } from 'redis-om';

// Define the schema
const albumSchema = new Schema('album', {
  artist: { type: 'string' },
  title: { type: 'text',sortable:true },
  year: { type: 'number',sortable:true },
});

// Create a Redis client
const redis = createClient({
    username: 'default',
    password: 'WYSIJglmDWd9qKd5Gjs7FrcI9M1g25w3',
    socket: {
        host: 'redis-13498.c305.ap-south-1-1.ec2.redns.redis-cloud.com',
        port: 13498
    }
});
redis.on('error', (err) => console.log('Redis Client Error', err));
await redis.connect();

// Create the repository
const albumRepository = new Repository(albumSchema, redis);

// Create the index (if it doesn't exist)
await albumRepository.createIndex();

// Example usage of the QueryBuilder
class QueryBuilder {
  constructor(repository) {
    this.repository = repository;
    this.query = repository.search();
  }

  where(field) {
    this.currentField = field;
    return this;
  }

  equals(value) {
    this.query = this.query.where(this.currentField).equals(value);
    return this;
  }

  matches(value) {
    this.query = this.query.where(this.currentField).matches(value);
    return this;
  }

  greaterThan(value) {
    this.query = this.query.where(this.currentField).is.greaterThan(value);
    return this;
  }

  and(field) {
    this.currentField = field;
    return this;
  }

  or(callback) {
    const subQuery = new QueryBuilder(this.repository);
    callback(subQuery);
    this.query = this.query.or(subQuery.query);
    return this;
  }

  async all() {
    return await this.query.return.all();
  }

  async first() {
    return await this.query.return.first();
  }

  async count() {
    return await this.query.return.count();
  }

  async page(offset, count) {
    return await this.query.return.page(offset, count);
  }

  sortBy(field, direction = 'ASC') {
    if (direction.toUpperCase() === 'ASC') {
      this.query = this.query.sortAscending(field);
    } else {
      this.query = this.query.sortDescending(field);
    }
    return this;
  }
}

// Example usage
const queryBuilder = new QueryBuilder(albumRepository);

// Save an album
const album = {
  artist: 'Mushroomhead',
  title: 'The Righteous & The Butterfly',
  year: 2014,
};
await albumRepository.save(album);

// Perform a query
const albums = await queryBuilder
  .where('artist').equals('Mushroomhead')
  .and('title').matches('butterfly')
  .and('year').greaterThan(2000)
  .all();

console.log(albums);

// Sort albums by year
const albumsByYear = await queryBuilder
  .where('artist').equals('Mushroomhead')
  .sortBy('year', 'ASC')
  .all();

console.log(albumsByYear);

// Sort albums by title in descending order
const albumsByTitle = await queryBuilder
  .where('artist').equals('Mushroomhead')
  .sortBy('title', 'DESC')
  .all();

console.log(albumsByTitle);

// Complex query with OR condition
const complexQuery = await queryBuilder
  .where('title').matches('butterfly')
  .or(qb => qb
    .where('artist').equals('Mushroomhead')
    .and('year').greaterThan(1990)
  )
  .all();

console.log(complexQuery);