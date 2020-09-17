const { GraphQLList, GraphQLID } = require('graphql');
const { isValidId } = require('../../utils/validation-utill');

const ImageModel = require('../../models/image-model');
const ImageType = require('../types/image-type');
const FilterType = require('../types/filter-type');
const PaginateType = require('../types/paginate-type');

const MAX_SIZE = 100;

const getImage = {
  type: ImageType,
  args: {
    id: { type: GraphQLID }
  },
  description: "Single image by ID",
  resolve: async function (_, { id }) {
    let one = null;
    if (isValidId(id)) {
      one = await ImageModel.findById(id);
    }
    if (!one) {
      console.warn("NotFound:", id);
    }
    return one;
  }
}

const getImages = {
  type: new GraphQLList(ImageType),
  description: "List of all images",
  args: {
    filter: { type: FilterType },
    paginate: { type: PaginateType },
  },
  resolve: async function (_, args) {
    const { filter, paginate } = args || {};

    const filterFields = filter && filter.fields || [];
    const filterToken = filter && filter.token || "";
    if (filterToken && !filterFields.length) {
      filterFields.push("url");
    }

    let list = await ImageModel.find(
      filterToken ? { $or: filterFields.map((f) => ({ [f]: { $regex: filter.token, $options: "i" } })) } : {},
    )
      .skip(paginate && paginate.offset || 0)
      .limit(paginate && Math.min(paginate.limit || MAX_SIZE, MAX_SIZE));
    return list;
  }
}

module.exports = {
  graphql: {
    getImage,
    getImages,
  }
};