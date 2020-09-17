const { GraphQLString, GraphQLFloat, GraphQLID, GraphQLNonNull, GraphQLList } = require('graphql')
const { GraphQLDateTime } = require('graphql-iso-date');
const shortid = require('shortid');

const EventModel = require('../../models/event-model');

const { addTags } = require('../mutations/tag-mutation');
const { findCity } = require('../queries/city-query');
const { findCategory } = require('../queries/category-query');

const EventType = require('../types/event-type');

const { isValidId, inlineArgs, jsTrim, isValidUrl } = require('../../utils/validation-utill');
const TranslateInputType = require('../inputs/translate-input-type');
const CoordsInputType = require('../inputs/coords-input-type');

const createEvent = {
  type: EventType,
  args: {
    date: { type: new GraphQLNonNull(GraphQLDateTime) },
    url: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: new GraphQLNonNull(TranslateInputType) },
    description: { type: new GraphQLNonNull(TranslateInputType) },
    place: { type: new GraphQLNonNull(TranslateInputType) },
    coords: { type: CoordsInputType },
    tags: { type: new GraphQLList(GraphQLString) },
    // images: { type: new GraphQLList(GraphQLString) },
    category: { type: new GraphQLNonNull(GraphQLString) },
    city: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: async function (_, { city, category, tags, ...args }) {
    let saveEvent;
    if (isValidUrl(args.url)) {
      args.url += "-" + shortid.generate();

      const cityModel = await findCity(city);
      if (!cityModel) {
        console.error("Create event! City not found:", city);
        return;
      }

      const categoryModel = await findCategory(category);
      if (!categoryModel) {
        console.error("Create event! Category not found:", category);
        return;
      }

      tags = await addTags(tags);

      saveEvent = await (new EventModel({
        city_id: cityModel._id,
        category_id: categoryModel._id,
        tags_id: tags,
        images_id: [],
        ...jsTrim(args, { name: true, url: true })
      })).save();
    }
    if (!saveEvent) {
      console.error("Create:", args);
    }
    return saveEvent;
  }
}

const updateEvent = {
  type: EventType,
  args: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    date: { type: GraphQLDateTime },

    url: { type: TranslateInputType },
    name: { type: TranslateInputType },
    description: { type: TranslateInputType },
    place: { type: TranslateInputType },
    coords: { type: CoordsInputType },

    tags: { type: new GraphQLList(GraphQLString) },

    city: { type: GraphQLString },
    category: { type: GraphQLString },
  },
  resolve: async function (_, { id, city, category, tags, ...args }) {
    let updateEventInfo;
    if (isValidId(id)) {
      if (tags && tags.length) {
        tags = await addTags(tags);
      }

      if (city) {
        let cityModel = await findCity(city);
        if (cityModel) {
          args = Object.assign({}, args, { city_id: cityModel._id.toString() });
        }
      }

      if (category) {
        let categoryModel = await findCity(category);
        if (categoryModel) {
          args = Object.assign({}, args, { category_id: categoryModel._id.toString() });
        }
      }
      if (!isValidUrl(args.url)) {
        args.url = "";
      } else {
        args.url += "-" + shortid.generate();
      }

      updateEventInfo = await EventModel.findOneAndUpdate({ _id: id }, { $set: inlineArgs(jsTrim(args, { name: true, url: true })) }, { new: true });
    }

    if (!updateEventInfo) {
      console.warn('Update:', id, args);
    }
    return updateEventInfo;
  }
}

const deleteEvents = {
  type: GraphQLFloat,
  args: {
    ids: { type: new GraphQLList(GraphQLID) }
  },
  resolve: async function (_, { ids }) {
    if (ids) {
      ids = ids.filter(id => isValidId(id));
      if (ids.length) {
        let deleteInfo = await EventModel.remove({ _id: { $in: ids } });
        return deleteInfo.deletedCount;
      }
    }
    return 0;
  }
}

module.exports = { graphql: { createEvent, updateEvent, deleteEvents } }