const mongoose = require('mongoose')

const eventSchema = mongoose.Schema({
  id: Number,
  type: String,
  title: String,
  images: Array,
  agent: Object,
  agencyReference: String,
  availableFrom: String,
  adress: String,
  country: String,
  coords: String,
  floor: Number,
  livingSq: Number,
  rooms: Number,
  area: Number,
  desc: String,
  price: Number | String,
  currency: String,
  yearBuilt: Number,
  yearRenovated: Number,
  created: String,
  modified: String,
  source: String,
})

module.exports = mongoose.model('homeCollection', eventSchema)
