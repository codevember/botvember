'use strict'
const Twit = require('twit')
const key = require('./config/config.json')
const blacklist = require('./config/blacklist.json')
const Botvember = require('./scripts/Botvember.js')

// Fetch the service account key JSON file contents
const serviceAccount = require('./config/database.json')
const bot = new Botvember(serviceAccount, 'https://codevember-f16a5.firebaseio.com/', 2017)
bot.init()

const T = new Twit({
  consumer_key: key.consumer_key,
  consumer_secret: key.consumer_secret,
  access_token: key.access_token,
  access_token_secret: key.access_token_secret
})

const filter = ['#codevember', '@codevember']

let stream = T.stream('statuses/filter', { track: filter })
console.log(`Stream Started : ${filter}`)
stream.on('tweet', (tweet) => {
  var blacklisted = false
  blacklist.users.forEach((user) => {
    if (user === tweet.user.screen_name) {
      blacklisted = true
    }
  })
  if (!tweet.retweeted && tweet.entities.urls[0] && !blacklisted) {
    bot.getCodepenData(tweet, res => {
      console.log(res)
      favTweet(tweet.id_str)
    }, err => {
      console.log(err)
    })
  }
})

function favTweet (tweetId) {
  T.post('favorites/create', { id: tweetId }, function (err, data, response) {
    err && console.log(err)
    response && console.log('Tw Fav !')
  })
}