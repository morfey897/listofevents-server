const Event = require("../../models/event")

module.exports = {
  events: () => {
      return Event.find()
              .then(articles => {
                return articles
              })
              .catch(error => {
                console.log(error);
                throw error;
              });
  },

  createEvent: (args) => {
    
    const event = new Event({
      date: args.eventInput.date,
      country: args.eventInput.country,
      city: args.eventInput.city,
      category: args.eventInput.category,
      event: args.eventInput.event,
      location: {
        name: args.eventInput.location.name,
        lat: args.eventInput.location.lat,
        lon: args.eventInput.location.lon,
      }
    })

    // save new event using model which will save in MongoDB
    return event.save().then(result => {
        console.log(result)
        return result
    }).catch(error => {
        console.log(error);
        throw error;
    })
  },
}