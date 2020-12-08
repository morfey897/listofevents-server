
const { GraphQLString, GraphQLInputObjectType } = require('graphql');
const { LANGS } = require('../../config');
const { array2Obj } = require('../../utils/array-utill');

const TranslateInputType = new GraphQLInputObjectType({
    name: 'TranslateInputType',
    description: "This is input translate type",
    fields: () => array2Obj(LANGS, {type: GraphQLString}),
});

module.exports = TranslateInputType;