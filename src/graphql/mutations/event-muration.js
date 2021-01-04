const { GraphQLString, GraphQLFloat, GraphQLID, GraphQLNonNull, GraphQLList, GraphQLInputObjectType, GraphQLError, GraphQLInt } = require('graphql')
const { GraphQLDateTime } = require('graphql-iso-date');
const { GraphQLUpload } = require('graphql-upload');
const shortid = require('shortid');

const EventModel = require('../../models/event-model');
const ImageModel = require('../../models/image-model');
const CategoryModel = require('../../models/category-model');
const CityModel = require('../../models/city-model');

const EventType = require('../types/event-type');

const { isValidId, inlineArgs, jsTrim, isValidUrl, jsSanitize, isValidTag } = require('../../utils/validation-utill');
const TranslateInputType = require('../inputs/translate-input-type');
const CoordsInputType = require('../inputs/coords-input-type');

const { ROLES } = require('../../config');
const { ERRORCODES } = require('../../errors');
const { uploadFileAWS } = require('../../utils/upload-utill');

const CityInputType = new GraphQLInputObjectType({
  name: 'CityInputType',
  description: "This is input city type",
  fields: () => ({
    _id: { type: GraphQLString },
    name: { type: TranslateInputType },
    description: { type: TranslateInputType },
    place_id: { type: GraphQLString },
  })
});


const createEvent = {
  type: EventType,
  args: {
    date: { type: new GraphQLNonNull(GraphQLDateTime) },
    duration: { type: new GraphQLNonNull(GraphQLInt) },
    url: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: new GraphQLNonNull(TranslateInputType) },
    description: { type: new GraphQLNonNull(TranslateInputType) },
    location: { type: new GraphQLNonNull(TranslateInputType) },
    tags: { type: new GraphQLList(GraphQLString) },
    category_id: { type: new GraphQLNonNull(GraphQLString) },
    city: { type: new GraphQLNonNull(CityInputType) },
    images: { type: new GraphQLList(GraphQLUpload) },
  },
  resolve: async function (_, body, context) {
    let { url, city, category_id, tags, description, location, date, time, duration, name, images } = body;

    const { user } = context;

    let error = null;
    let success = null;

    if (!user || (user.role & ROLES.moderator) !== ROLES.moderator) {
      error = new GraphQLError(ERRORCODES.ERROR_ACCESS_DENIED);
    } if (!isValidUrl(url)) {
      error = new GraphQLError(ERRORCODES.ERROR_INCORRECT_URL);
    } else {
      //Check category
      let categoryModel = null;
      if (isValidId(category_id)) {
        categoryModel = await CategoryModel.findOne({ _id: category_id });
      }
      if (!categoryModel) {
        error = new GraphQLError(ERRORCODES.ERROR_CATEGORY_NOT_EXIST);
      } else {

        let cityModel = null;
        if (isValidId(city._id)) {
          cityModel = await CityModel.findOne({ _id: city._id });
        } else {
          cityModel = await CityModel.findOne({ place_id: city.place_id });
          if (!cityModel) {
            cityModel = await (new CityModel({
              place_id: city.place_id,
              ...jsTrim({ name: city.name, description: city.description }),
            })).save();
          } else {
            cityModel = await CityModel.findOneAndUpdate({ _id: cityModel._id }, { $set: inlineArgs(jsTrim({ name: city.name, description: city.description })) }, { new: true });
          }
        }
        if (!cityModel) {
          error = new GraphQLError(ERRORCODES.ERROR_CITY_NOT_EXIST);
        } else {
          url += "-" + shortid.generate();

          const fileResults = await Promise.allSettled(images.map(uploadFileAWS));

          let filesComplete = [];
          fileResults.forEach(({ value }) => {
            if (value) {
              filesComplete.push((new ImageModel({
                url: value.path
              })).save());
            }
          });

          let imagesData = await Promise.allSettled(filesComplete);
          success = await (new EventModel({
            images_id: imagesData.filter(({ status }) => status == 'fulfilled').map(({ value: { _id } }) => _id),
            tags: (tags || []).map(tag => jsTrim(tag)).filter(tag => isValidTag(tag)),
            description: jsSanitize(description),
            created_at: Date.now(),
            updated_at: Date.now(),
            date,
            time,
            duration,
            city_id: cityModel._id,
            category_id: categoryModel._id,
            author_id: user.id,
            ...jsTrim({ url, name, location }),
          })).save();
        }
      }
    }

    if (!success) {
      throw (error || new GraphQLError(ERRORCODES.ERROR_WRONG));
    }

    return success;
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
      // if (tags && tags.length) {
      //   tags = await addTags(tags);
      // }

      // if (city) {
      //   let cityModel = await findCity(city);
      //   if (cityModel) {
      //     args = Object.assign({}, args, { city_id: cityModel._id.toString() });
      //   }
      // }

      // if (category) {
      //   let categoryModel = await findCity(category);
      //   if (categoryModel) {
      //     args = Object.assign({}, args, { category_id: categoryModel._id.toString() });
      //   }
      // }
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
  resolve: async function (_, body, context) {
    let { ids } = body;
    const { user } = context;
    ids = ids && ids.filter(id => isValidId(id)) || [];
    if (ids.length) {
      if (user && (user.role & ROLES.admin) === ROLES.admin) {
        let deleteInfo = await EventModel.deleteMany({ _id: { $in: ids } });
        return deleteInfo.deletedCount;
      } else if (user) {
        let deleteInfo = await EventModel.deleteMany({ $and: [{ _id: { $in: ids } }, { author_id: user.id }] });
        return deleteInfo.deletedCount;
      } else {
        throw new GraphQLError(ERRORCODES.ERROR_ACCESS_DENIED);
      }
    }
    return 0;
  }
}

module.exports = { graphql: { createEvent, updateEvent, deleteEvents } }