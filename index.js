const mongoose = require('mongoose')
const homes = require('./models/homeSchema')
const agents = require('./models/agentSchema')
const axios = require('axios')

// const res = require('./dev-data/homeGates')

let link = 'https://api.homegate.ch/search/listings'

mongoose
  .connect(
    'mongodb+srv://tondeMoon:T2bSJN7zck4qWy9@cluster0.k1gks.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => {
    console.log('mongo connected')
  })
  .catch((err) => {
    console.log('mongo not connected')
  })
;(async () => {
  const query = {
    offerType: 'BUY',
    categories: [
      'APARTMENT',
      'MAISONETTE',
      'DUPLEX',
      'ATTIC_FLAT',
      'ROOF_FLAT',
      'STUDIO',
      'SINGLE_ROOM',
      'TERRACE_FLAT',
      'BACHELOR_FLAT',
      'LOFT',
      'ATTIC',
      'HOUSE',
      'ROW_HOUSE',
      'BIFAMILIAR_HOUSE',
      'TERRACE_HOUSE',
      'VILLA',
      'FARM_HOUSE',
      'CAVE_HOUSE',
      'CASTLE',
      'GRANNY_FLAT',
      'CHALET',
      'RUSTICO',
      'SINGLE_HOUSE',
      'HOBBY_ROOM',
      'CELLAR_COMPARTMENT',
      'ATTIC_COMPARTMENT',
      'FURNISHED_FLAT',
    ],
    location: {
      geoTags: ['geo-city-verbier'],
    },
  }

  let arrLength = await axios.post(link, {
    query: query,
    sortBy: 'dateCreated',
    sortDirection: 'desc',
    from: 0,
    size: 100,
    trackTotalHits: 1000,
  })

  const diff = Math.ceil((arrLength.data.total - 100) / 100)

  let res = []
  for (let i = 0, j = 0; i <= diff, j <= arrLength.data.total; i++, j = j + 100) {
    const oneRes = await axios.post(link, {
      query: query,
      sortBy: 'dateCreated',
      sortDirection: 'desc',
      from: j,
      size: 100,
      trackTotalHits: 1000,
    })
    res.push(oneRes.data.results)
  }

  console.log(res.flat())

  res = res.flat()

  const agentsBase = await res.map((item) => ({
    companyId: item?.listing?.lister?.id,
    companyName: item?.listing?.lister?.legalName || '',
    city: item?.listing?.lister?.address?.locality || '',
    street: item?.listing?.lister?.address?.street || '',
    gender: '',
    businessPhone: item?.listing?.lister?.phone || '',
    fullName: item?.listing?.lister?.contacts?.inquiry?.givenName || '',
    mobilePhone: item?.listing?.lister?.mobile || '',
    logoImage: item.listing.lister.logoUrl || '',
    website: item?.listing?.lister?.website?.value || '',
  }))

  const agentsNoDuplicate = agentsBase.filter((v, i, a) => a.findIndex((t) => t.companyId === v.companyId) === i)

  const coll = await agents.find()

  const dataStructured = await res.map((item) => ({
    id: item.id,
    title: item?.listing?.localization?.de?.text?.title || '',
    type: item.listing.categories[0],
    images: item?.listing?.localization?.de?.attachments,
    agent: coll.filter((el) => el.companyId === item?.listing?.lister?.id)[0],
    agencyReference: item?.listing?.lister?.id || '',
    agencyObjectWebPage:
      item.listing.localization.de.urls && item.listing.localization.de.urls[0]
        ? item.listing.localization.de.urls[0].value
        : '',
    availableFrom: '',
    adress: item?.listing?.address?.street || '',
    country: `${item.listing.address.locality},${item.listing.address.region || ''}`,
    coords: `${item?.listing?.address?.geoCoordinates?.latitude},${item?.listing?.address?.geoCoordinates?.longitude}`,
    floor: item.listing?.characteristics?.floor || '',
    livingSq: item.listing.characteristics.livingSpace || '',
    rooms: item.listing.characteristics.numberOfRooms || '',
    desc: item?.listing?.localization?.de?.text?.description || '',
    price: item?.listing?.prices?.buy?.price || '',
    currency: item.listing.prices.currency,
    yearBuilt: item.listing?.characteristics?.yearBuilt || '',
    yearRenovated: item.listing?.characteristics?.yearLastRenovated || '',
    created: item.listing.meta.createdAt,
    modified: item.listing.meta.updatedAt,
    source: 'Homegate',
  }))

  // agents
  //   .insertMany(agentsNoDuplicate)
  //   .then(() => {
  //     console.log('agents saved')
  //   })
  //   .catch((err) => {
  //     console.log('agents not saved', err)
  //   })

  homes
    .insertMany(dataStructured)
    .then(() => {
      console.log('saved')
    })
    .catch((err) => {
      console.log('not saved', err)
    })
})()
