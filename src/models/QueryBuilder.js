export class QueryBuilder {

  constructor(repository) {
    this.repository = repository;
    this.search = repository.search();
    this.page = 0;
    this.pageSize = 10;
  }

  // Set the page size
  limit(size) {
    this.pageSize = size;
    return this;
  }

  // Set the current page
  page(number) {
    this.page = number;
    return this;
  }

  // Execute the query and return paginated results
  async paginate(page = 1, pageSize = 10) {
    this.page = page - 1; // Redis-OM uses zero-based indexing
    this.pageSize = pageSize;
    const results = await this.search.return.page(this.page, this.pageSize);
    const total = await this.search.return.count();

    return {
      data: results,
      currentPage: page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  // Add a where clause
  where(field, operator, value) {
    if (operator === '=') {
      this.search.where(field).equals(value);
    } else if (operator === '>') {
      this.search.where(field).gt(value);
    } else if (operator === '>=') {
      this.search.where(field).gte(value);
    } else if (operator === '<') {
      this.search.where(field).lt(value);
    } else if (operator === '<=') {
      this.search.where(field).lte(value);
    } else if (operator === '!=') {
      this.search.where(field).not.equalTo(value);
    } else if (operator === 'between') {
      this.search.where(field).between(value[0], value[1]);
    }
    return this;
  }

  // Add an AND condition
  andWhere(field, operator, value) {
    return this.where(field, operator, value);
  }

  // Add an OR condition
  orWhere(field, operator, value) {
    // Redis-OM doesn't natively support OR conditions, so this is a placeholder
    // You can implement OR logic using multiple searches and combining results
    throw new Error('OR conditions are not supported in this implementation');
  }

  // Full-text search
  whereText(field, text) {
    this.search.where(field).matches(text);
    return this;
  }

  // Geographical search
  whereLocation(field, longitude, latitude, radius, unit = 'miles') {
    this.search.where(field).inRadius(circle => circle
      .longitude(longitude)
      .latitude(latitude)
      .radius(radius)
      .miles
    );
    return this;
  }

  // Order by a field
  orderBy(field, direction = 'asc') {
    this.search.sortBy(field, direction === 'asc' ? 'ASC' : 'DESC');
    return this;
  }

  // Limit the number of results
  limit(count) {
    this.search.return.page(0, count);
    return this;
  }

  // Execute the query and return results
  async get() {
    return await this.search.return.all();
  }

  // Execute the query and return the first result
  async first() {
    const results = await this.search.return.first();
    return results;
  }
}