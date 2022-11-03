class RentalFilterFeature {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }
  destinationFilter() {
    //excluding sort filter from the query
    
    const queryObj = { ...this.queryString };
    const excludedFields = ['sort', 'page', 'limit'];
    excludedFields.forEach((el) => delete queryObj[el]);
    
    if(this.queryString.search && this.queryString.search!==''){
      queryObj['$or'] = [
        { destination: { $regex: `.*${this.queryString.search}.*`, $options: "i" } },
        { subDestination: { $regex: `.*${this.queryString.search}.*`, $options: "i" } },
        { rentalName: { $regex: `.*${this.queryString.search}.*`, $options: "i" } }
      ]
    }
    //adding $ infront on gte and lte which is not included in query params
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

    this.query = this.query.select(
      'rentalName destination subDestination noOfPeopleAccomodate price thumbnailImages avgReview'
    );

    return this;
  }

  async searchFilter () {
    //excluding sort filter from the query
    const queryObj = { ...this.queryString };
    const excludedFields = ['data', 'sort', 'page', 'limit'];
    excludedFields.forEach((el) => delete queryObj[el]);


    //adding $ infront on gte and lte which is not included in query params
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 24;

    const skip = (page - 1) * limit;

    // const queryData = this.queryString.data
    this.query = await this.query.find({
      $or: [
        { destination: { $regex: `.*${this.queryString.data}.*`, $options: "i" } },
        { subDestination: { $regex: `.*${this.queryString.data}.*`, $options: "i" } },
        { rentalName: { $regex: `.*${this.queryString.data}.*`, $options: "i" } }
      ],
    }).select(
      'rentalName destination subDestination noOfPeopleAccomodate price thumbnailImages avgReview'
    ).sort(this.queryString.sort).skip(skip).limit(limit);

    return this;
  }

  sort() {
    this.query = this.query.sort(this.queryString.sort);
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 24;

    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = RentalFilterFeature;
