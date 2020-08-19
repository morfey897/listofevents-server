const { GraphQLString, GraphQLID, GraphQLNonNull } = require('graphql')

const CategoryModel = require('../../models/category-model');
const CategoryType = require('../types/category-type');

const { isValidId } = require('../../utils/validation-utill');

const createCategory = {
  type: CategoryType,
  args: {
    ru: { type: new GraphQLNonNull(GraphQLString) },
    en: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: async function (_, args) {
    Object.keys(args).forEach(name => {
      args[name] = (args[name] || "").trim();
    });

    let categoryModel = await (new CategoryModel(args)).save();
    return categoryModel;
  }
}

const updateCategory = {
  type: CategoryType,
  args: {
    id: {type: GraphQLID},
    ru: { type: GraphQLString },
    en: { type: GraphQLString }
  },
  resolve: async function (_, {id, ...args}) {
    let updateCategoryInfo;
    if (isValidId(id)) {
      Object.keys(args).forEach(name => {
        let value = (args[name] || "").trim();
        if (!value) {
          delete args[name];
        } else {
          args[name] = value;
        }
      });
  
      updateCategoryInfo = await CategoryModel.findByIdAndUpdate(id, args, { new: true });
    }
    
    if (!updateCategoryInfo) {
      console.warn('Update category:', id, args);
    }
    return updateCategoryInfo;
  }
}

const deleteCategory = {
  type: CategoryType,
  args: {
    id: { type: GraphQLID }
  },
  resolve: async function (_, {id}) {
    let deleteCategory;
    if (isValidId(id)) {
      deleteCategory = await CategoryModel.findByIdAndRemove(id);
    }
    if (!deleteCategory) {
      console.error("Delete category:", id);
    }
    return deleteCategory;
  }
}

module.exports = { createCategory, updateCategory, deleteCategory }