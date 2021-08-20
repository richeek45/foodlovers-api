// Features to manipulate the query string 
class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  // filter() {
  //   // Filtering
  //   const queryObj = { ...queryString };
  //   const excludedFields = ["page", "sort", "limit", "fields"];
  //   excludedFields.forEach((el) => delete queryObj[el]);

  //   // Advanced filtering
  //   let queryStr = JSON.stringify(queryObj);
  //   queryStr = queryStr.replace(/\b(gte|lte|gt|lt)\b/g, `$${match}`);

  //   this.query = this.query.find(JSON.parse(queryStr));
  //   return this; 
  // }

  sort() {
    // Sorting
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(this.queryString.sort);
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    // Pagination page=3&limit=10 -> 21-30
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 10;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }

}

module.exports = APIFeatures;