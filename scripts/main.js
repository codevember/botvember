'use strict'
const Twit = require('twit')
const key = require('../config/config.json')
const phantom = require('phantom')
const firebase = require('firebase')
const blacklist = require('../config/blacklist.json')

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
  var blacklisted = false
  blacklist.users.forEach((user) => {
    if (user === tweet.user.screen_name) {
      blacklisted = true
    }
  })
  if (!tweet.retweeted && tweet.entities.urls[0] && !blacklisted) {
    var penData
    tweet.entities.urls[0].expanded_url && (penData = expendUrl(tweet.entities.urls[0].expanded_url))
    if (penData) {
      penData.screen_name = tweet.user.screen_name
      penData.penDetails && createDocument(penData)
      favTweet(tweet.id_str)
    }
  }
})

function expendUrl (url) {
  const reg = /(https:\/\/www\.)?codepen\.io\/([a-zA-Z0-9@:%_]*)\/(pen|full)?\/([a-zA-Z0-9@:%_]*)/gim
  var regResult = reg.exec(url)
  var data = {}
  if (regResult !== null) {
    data.user = regResult[2]
    data.pen = regResult[4]
  } else {
    return null
  }
  data.penUrl = `http://codepen.io/${data.user}/pen/${data.pen}`
  data.fullUrl = `http://codepen.io/${data.user}/full/${data.pen}`
  data.imgUrl = `http://codepen.io/${data.user}/pen/${data.pen}/image/small.png`
  data.penDetails = `http://codepen.io/${data.user}/details/${data.pen}`
  return data
}

function favTweet (tweetId) {
  T.post('favorites/create', { id: tweetId }, function (err, data, response) {
    err && console.log(err)
    response && console.log('Tw Fav !')
  })
}

function createDocument (data) {
  let phInstance = null
  let phPage = null
  phantom.create()
    .then(instance => {
      phInstance = instance
      return instance.createPage()
    })
    .then(page => {
      phPage = page
      return page.open(data.penDetails)
    })
    .then(status => {
      console.log(status)
      return phPage.property('content')
    })
    .then(generated => {
      phPage.evaluate(function () {
        return [
          document.getElementsByClassName('pen-title-link')[0].innerHTML.trim(),
          document.querySelector('time').innerHTML
        ]
      }).then(html => {
        data.title = html[0]
        data.date = html[1].trim().split(/\s* \s*/)
        data.date[1] = data.date[1].slice(0, -1)
        data.day = parseInt(data.date[1], 10)
        var year = parseInt(data.date[2], 10)
        if (year === 2016) {
          postDb(data)
          phInstance.exit()
        } else {
          phInstance.exit()
        }
      })
    })
    .catch(error => {
      console.log(error)
      phInstance.exit()
    })
}
function postDb (data) {
  new Promise((resolve, reject) => {
    ref.once('value').then((snapshot) => {
      snapshot.forEach((dataDb) => {
        if (data.fullUrl === dataDb.val().url) {
          reject()
        }
      })
      resolve(data)
    })
  }).then((data) => {
    var newContrib = ref.push()
    newContrib.set({
      'author': data.screen_name,
      'day': data.day,
      'slug': generateSlug(data),
      'image': data.imgUrl,
      'title': data.title,
      'url': data.fullUrl
    })
    console.log(`Added ${data.title}`)
  }, (rej) => {
    console.log(`Already in Database ${rej}`)
  }).catch((err) => {
    console.log(`Catch an Error : ${err}`)
  })
}
function generateSlug (data) {
  let slug = ''
  let day = data.day
  if (day < 10) {
    slug = '0'
  }
  slug += day + ' ' + data.title + ' ' + data.screen_name
  slug = slug.replace(/\s/g, '-').toLowerCase()
  return slug
}
