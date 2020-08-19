const { GraphQLString, GraphQLFloat, GraphQLID, GraphQLInputObjectType, GraphQLNonNull } = require('graphql')
const { GraphQLDateTime } = require('graphql-iso-date');

const EventModel = require('../../models/event-model');
const CountryModel = require('../../models/country-model');
const CityModel = require('../../models/city-model');
const CategoryModel = require('../../models/category-model');

const EventType = require('../types/event-type');

const { isValidId } = require('../../utils/validation-utill');

const getEss = async (CoreModel, value) => {
  let model;
  if (isValidId(value)) {
    model = await CoreModel.findById(value);
  } else {
    model = await CoreModel.find({$or:[{ru: {$regex: value, $options: "i"}}, {en: {$regex: value, $options: "i"}}]});
  }
  return model;
} 

const PlaceType = new GraphQLInputObjectType({
  name: "PlaceInputType",
  description: "place with geo position",
  fields: () => ({
    name: { type: new GraphQLNonNull(GraphQLString) },
    lat: { type: GraphQLFloat },
    lon: { type: GraphQLFloat },
  })
});

const createEvent = {
  type: EventType,
  args: {
    date: { type: new GraphQLNonNull(GraphQLDateTime) },
    country: { type: new GraphQLNonNull(GraphQLString) },
    city: { type: new GraphQLNonNull(GraphQLString) },
    category: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString },
    place: { type: new GraphQLNonNull(PlaceType) },
  },
  resolve: async function (_, {country, city, category, description, ...args}) {
    const countryModel = await getEss(CountryModel, country);
    if (!countryModel) {
      console.error("Create event! Country not found:", country);
      return;
    }

    const cityModel = await getEss(CityModel, city);
    if (!cityModel) {
      console.error("Create event! City not found:", country);
      return;
    }

    const categoryModel = await getEss(CategoryModel, category);
    if (!categoryModel) {
      console.error("Create event! Category not found:", category);
      return;
    }

    console.log(countryModel);
    const event = new EventModel({
      country_id: countryModel._id,
      city_id: cityModel._id,
      category_id: categoryModel._id,
      description: description || "",
      ...args
    });
    
    const saveEvent = await event.save();
    if (!saveEvent) {
      console.error("Create:", args);
    }
    return saveEvent;
  }
}

const updateEvent = {
  type: EventType,
  args: {
    id: {type: new GraphQLNonNull(GraphQLString)},
    date: { type: GraphQLDateTime },
    country: { type: GraphQLString },
    city: { type: GraphQLString },
    category: { type: GraphQLString },
    description: { type: GraphQLString },
    place: { type: PlaceType },
  },
  resolve: async function (_, {id, ...args}) {
    let updateEventInfo;
    if (isValidId(id)) {
      Object.keys(args).forEach(name => {
        let value = args[name];
        if (value === undefined || value === null) {
          delete args[name];
        }
      });
  
      updateEventInfo = await EventModel.findByIdAndUpdate(id, args, { new: true });
    }
    
    if (!updateEventInfo) {
      console.warn('Update:', id, args);
    }
    return updateEventInfo;
  }
}

const deleteEvent = {
  type: EventType,
  args: {
    id: { type: GraphQLID }
  },
  resolve: async function (_, {id}) {
    let deleteEvent;
    if (isValidId(id)) {
      deleteEvent = await EventModel.findByIdAndRemove(id);
    }
    if (!deleteEvent) {
      console.error("Delete:", id);
    }
    return deleteEvent;
  }
}

module.exports = { createEvent, updateEvent, deleteEvent }