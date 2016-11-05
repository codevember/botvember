'use strict'
const Twit = require('twit')
const key = require('../config/config.json')
const request = require('request')
const phantom = require('phantom')
const firebase = require('firebase')

firebase.initializeApp({
  serviceAccount: './config/database.json',
  databaseURL: 'https://codevember-f16a5.firebaseio.com/'
})
const T = new Twit({
  consumer_key: key.consumer_key,
  consumer_secret: key.consumer_secret,
  access_token: key.access_token,
  access_token_secret: key.access_token_secret
})
const db = firebase.database()
const ref = db.ref('contributions')
const filter = '#codevember'

let stream = T.stream('statuses/filter', { track: filter })
console.log(`Stream Started : ${filter}`)
stream.on('tweet', (tweet) => {
  var penData
  tweet.entities.urls[0].expanded_url && (penData = expendUrl(tweet.entities.urls[0].expanded_url))
  request(penData.penUrl, function (err, res, body) {
    err && console.warn(err)
    createDocument(body)
    favTweet(tweet.id_str)
  })
})

function expendUrl (url) {
  const reg = /(https:\/\/www\.)?codepen\.io\/([a-zA-Z0-9@:%_]*)\/(pen|full)?\/([a-zA-Z0-9@:%_]*)/gim
  var regResult = reg.exec(url)
  var data = {}
  data.user = regResult[2]
  data.pen = regResult[4]
  data.penUrl = `http://codepen.io/${data.user}/pen/${data.pen}`
  data.fullUrl = `http://codepen.io/${data.user}/full/${data.pen}`
  return data
}

function favTweet (tweetId) {
  T.post('favorites/create', { id: tweetId }, function (err, data, response) {
    err && console.log(err)
    response && console.log('Tw Fav !')
  })
}

function createDocument (content) {
  console.log(content)
  let instance = null
  phantom.create()
  .then((phantomInstance) => {
    instance = phantomInstance
    return instance.createPage()
  })
}
