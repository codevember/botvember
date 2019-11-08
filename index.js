'use strict'
const Twit = require('twit')
const fs = require('fs')
const key = require('./config/config.json')
const blacklist = require('./config/blacklist.json')
//const promptImage = require('./scripts/images.js')
//const prompts = require('./scripts/prompts_2019.js')

/*** Bot no longer fetch & save pen ***/
// const Botvember = require('./scripts/Botvember.js')
// Fetch the service account key JSON file contents
// const serviceAccount = require('./config/database.json')
// const bot = new Botvember(serviceAccount, 'https://codevember-f16a5.firebaseio.com/', 2017)
// bot.init()

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
  console.log('🛎 ️ New Tw: ' +  tweet.user.screen_name)
  var blacklisted = blacklist.users.indexOf(tweet.user.screen_name)
  if (!tweet.retweeted && blacklisted == -1) favTweet(tweet)
})

function favTweet (tweet) {
  setTimeout(() => {
    T.post('favorites/create', { id: tweet.id_str }, function (err, data, response) {
      if (err) console.log('❌  Erreur fav ' + tweet.user.screen_name + err)
      else console.log('❤️ ️ Tw Fav : ' +  tweet.user.screen_name)
    })
  }, 1000 * 20)
}


function postImageTweet (path) {
  var b64content = fs.readFileSync(path, { encoding: 'base64' })
  T.post('media/upload', { media_data: b64content }, function (err, data, response) {
    var altText = "Small flowers in a planter on a sunny balcony, blossoming."
    var meta_params = { media_id: mediaIdStr, alt_text: { text: altText } }
    T.post('media/metadata/create', meta_params, function (err, data, response) {
      if (!err) {
        // now we can reference the media and post a tweet (media will attach to the tweet)
        var params = { status: 'loving life #nofilter', media_ids: [mediaIdStr] }
        T.post('statuses/update', params, function (err, data, response) {
          console.log(data)
        })
      }
    })
  })
}
function promptsOfTheDay () {

}
