import { createClient } from 'redis';
import { Repository, Schema } from 'redis-om'

const albumSchema = new Schema('album', {
  artist: { type: 'string' },
  title: { type: 'text' },
  year: { type: 'number' },
  genres: { type: 'string[]' },
  songDurations: { type: 'number[]' },
  outOfPublication: { type: 'boolean' }
})

const studioSchema = new Schema('studio', {
  name: { type: 'string' },
  city: { type: 'string' },
  state: { type: 'string' },
  location: { type: 'point' },
  established: { type: 'date' }
})


const client = createClient({
    username: 'default',
    password: 'WYSIJglmDWd9qKd5Gjs7FrcI9M1g25w3',
    socket: {
        host: 'redis-13498.c305.ap-south-1-1.ec2.redns.redis-cloud.com',
        port: 13498
    }
});
// const client=createClient({
//     url:`redis://localhost:8001`
// });
client.on('error', err => console.log('Redis Client Error', err));

await client.connect();

//https://chat.deepseek.com/a/chat/s/f5b3c9e3-4f42-4bb8-9822-9732b911204c


const albumRepository = new Repository(albumSchema, client)
const studioRepository = new Repository(studioSchema, client)

let album = {
    artist: "Mushroomhead",
    title: "The Righteous & The Butterfly",
    year: 2014,
    genres: [ 'metal' ],
    songDurations: [ 204, 290, 196, 210, 211, 105, 244, 245, 209, 252, 259, 200, 215, 219 ],
    outOfPublication: true
  }
  
  album = await albumRepository.save(album)
  albumList = await albumRepository.search().return.all();

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
  
  // Usage example
  
  const queryBuilder = new QueryBuilder(albumRepository);
  
  const albums = await queryBuilder
    .where('artist').equals('Mushroomhead')
    .and('title').matches('butterfly')
    .and('year').greaterThan(2000)
    .all();
  
  console.log(albums);
  
  const albumsByYear = await queryBuilder
    .where('artist').equals('Mushroomhead')
    .sortBy('year', 'ASC')
    .all();
  
  console.log(albumsByYear);
  
  const albumsByTitle = await queryBuilder
    .where('artist').equals('Mushroomhead')
    .sortBy('title', 'DESC')
    .all();
  
  console.log(albumsByTitle);
  
  const complexQuery = await queryBuilder
    .where('title').matches('butterfly')
    .or(qb => qb
      .where('artist').equals('Mushroomhead')
      .and('year').greaterThan(1990)
    )
    .all();
  
  console.log(complexQuery);
//   https://github.com/redis/redis-om-node?tab=readme-ov-file
  




