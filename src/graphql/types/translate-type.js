
const { GraphQLObjectType, GraphQLString } = require('graphql');
const { LANGS } = require('../../config');
const { array2Obj } = require('../../utils/array-utill');

const TranslateType = new GraphQLObjectType({
    name: 'TranslateType',
    description: "This is translate type",
    fields: () => array2Obj(LANGS, {type: GraphQLString}),
});

module.exports = TranslateType;