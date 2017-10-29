'use strict'
const phantom = require('phantom')
const admin = require('firebase-admin')
class Botvember {
  constructor (serviceAccount, databaseUrl, year) {
    this.serviceAccount = serviceAccount
    this.databaseUrl = databaseUrl
    this.regex = /(https:\/\/www\.)?codepen\.io\/([a-zA-Z0-9@:%_]*)\/(pen|full)?\/([a-zA-Z0-9@:%_]*)/gim
    this.codepenAPI = 'http://codepen.io/'
    this.year = year
  }

  init () {
    admin.initializeApp({
      credential: admin.credential.cert(this.serviceAccount),
      databaseURL: this.databaseUrl
    })
    this.db = admin.database()
    this.ref = this.db.ref(`${this.year}/contributions`)
  }
  getCodepenData (tweet, res, err) {
    let penData = []
    for (var i = 0; i < tweet.entities.urls.length; i++) {
      let rawData = this.expendUrl(tweet.entities.urls[i].expanded_url)
      if (rawData) {
        penData.push(this.getPenData(rawData, tweet.user.screen_name))
        console.log('Pen Data :')
        console.log(penData)
      }
    }
    if (penData.length > 0) {
      typeof res === 'function' && res('Success')
    } else {
      typeof err === 'function' && err('Error')
    }
  }
  expendUrl (url) {
    var regResult = this.regex.exec(url)
    console.log('regResult')
    console.log(regResult)
    if (regResult != null) {
      return regResult
    } else {
      return null
    }
  }
  getPenData (penData, screenName) {
    let data = {}
    if (penData && penData.length > 3) {
      data.user = penData[2]
      data.screen_name = screenName
      data.pen = penData[4]
      data.penUrl = `${this.codepenAPI}${data.user}/pen/${data.pen}`
      data.fullUrl = `${this.codepenAPI}${data.user}/full/${data.pen}`
      data.imgUrl = `${this.codepenAPI}${data.user}/pen/${data.pen}/image/small.png`
      data.penDetails = `${this.codepenAPI}${data.user}/details/${data.pen}`
    }
    data.penDetails && this.createDocument(data)
    return data
  }
  createDocument (data) {
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
          if (year === this.year) {
            this.postDb(data)
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
  postDb (data) {
    this.existInBase(data).then(data => {
      var newContrib = this.ref.push()
      console.log(data)
      newContrib.set({
        'author': data.screen_name,
        'day': data.day,
        'slug': this.generateSlug(data),
        'image': data.imgUrl,
        'title': data.title,
        'url': data.fullUrl
      })
      console.log(`Added ${data.title} on ${data.day}, by ${data.screen_name}`)
    }, (rej) => {
      console.log(`Already in Database ${rej}`)
    }).catch((err) => {
      console.log(`Catch an Error : ${err}`)
    })
  }
  existInBase (data) {
    return new Promise((resolve, reject) => {
      this.ref.once('value').then((snapshot) => {
        snapshot.forEach(dataDb => {
          if (data.fullUrl === dataDb.val().url) {
            reject('Already in base')
          }
        })
        resolve(data)
      })
    })
  }
  generateSlug (data) {
    let slug = ''
    let day = data.day
    if (day < 10) {
      slug = '0'
    }
    slug += day + ' ' + data.title + ' ' + data.screen_name
    slug = slug.replace(/\s/g, '-').toLowerCase()
    return slug
  }
}

module.exports = Botvember
