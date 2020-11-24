const { GraphQLString, GraphQLID, GraphQLNonNull, GraphQLList, GraphQLFloat } = require('graphql')
const shortid = require('shortid');

const CategoryModel = require('../../models/category-model');
const CategoryType = require('../types/category-type');

const { addTags } = require('../mutations/tag-mutation');

const { isValidId, jsTrim, isValidUrl, inlineArgs } = require('../../utils/validation-utill');
const TranslateInputType = require('../inputs/translate-input-type');

const createCategory = {
  type: CategoryType,
  args: {
    url: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: new GraphQLNonNull(TranslateInputType) },
    description: { type: new GraphQLNonNull(TranslateInputType) },
    tags: { type: new GraphQLList(GraphQLString) },
    // images: { type: new GraphQLList(GraphQLString) },
  },
  resolve: async function (_, {tags, ...args}) {
    let categoryModel;
    if (isValidUrl(args.url)) {

      args.url += "-" + shortid.generate();

      tags = await addTags(tags);

      categoryModel = await (new CategoryModel({
        tags_id: tags,
        images_id: [],
        ...jsTrim(args, {name: true, url: true})
      })).save();
    }
    
    if (!categoryModel) {
      console.warn('Create category:', tags, args);
    }

    return categoryModel;
  }
}

const updateCategory = {
  type: CategoryType,
  args: {
    id: {type: GraphQLID},
    url: { type: GraphQLString },
    name: { type: TranslateInputType },
    description: { type: TranslateInputType },
    tags: { type: new GraphQLList(GraphQLString) },
    // images: { type: new GraphQLList(GraphQLString) },
  },
  resolve: async function (_, {id, tags, ...args}) {
    let updateCategoryInfo;
    if (isValidId(id)) {
      if (tags && tags.length) {
        tags = await addTags(tags);
      }

      if (!isValidUrl(args.url)) {
        args.url = "";
      } else {
        args.url += "-" + shortid.generate();
      }

      updateCategoryInfo = await CategoryModel.findOneAndUpdate({_id: id}, { $set: inlineArgs(jsTrim({tags_id: tags, ...args}, { name: true, url: true })) }, { new: true });
    }
    
    if (!updateCategoryInfo) {
      console.warn('Update category:', id, args);
    }
    return updateCategoryInfo;
  }
}

const deleteCategories = {
  type: GraphQLFloat,
  args: {
    ids: { type: new GraphQLList(GraphQLID) }
  },
  resolve: async function (_, {ids}) {
    if (ids) {
      ids = ids.filter(id => isValidId(id));
      if (ids.length) {
        let deleteInfo = await CategoryModel.deleteMany({_id: {$in: ids}});
        return deleteInfo.deletedCount;
      }
    }
    return 0;
  }
}

module.exports = { graphql: {createCategory, updateCategory, deleteCategories} }