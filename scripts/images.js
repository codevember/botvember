const Jimp = require('jimp')
const Path = require('path')
const prompt = require('./prompts_2019.js')
const assetsDir = Path.join(__dirname, "../assets/")

var fontBoldPath =  Path.join(__dirname, "../fonts/montserrat-bold.fnt")
var fontRegularPath =  Path.join(__dirname, "../fonts/montserrat-regular.fnt")

function promptImage (prompt = "", day = 0, callback) {
  new Jimp(1280, 470, "#15202b", (err, image) => {

        prompt = prompt.charAt(0).toUpperCase() + prompt.slice(1)
    Jimp.loadFont(fontBoldPath).then(fontBold => {
      printImage(image, fontBold, 140, prompt)
      Jimp.loadFont(fontRegularPath).then(fontRegular => {
        printImage(image, fontRegular, 280, '#Codevember')
        var file = day + '_' + prompt + '_image.' + image.getExtension()
        var imagePath = Path.resolve(assetsDir, file)
        image.write(imagePath, function () { 
          typeof callback === 'function' && callback()
        })
      })
    })
  })
}

function getCenter (image, textW) {
  var layoutCenter = 1280 / 2 
  var textCenter = textW / 2 
  return layoutCenter - textCenter
}
function printImage (image, font, y, prompts) {
  var textWidth = Jimp.measureText(font, prompts)
  var x = getCenter(1280, textWidth)
  image.print(font, x, y, prompts)
}
for (var i = 0; i < prompt.length; i++) {
  promptImage(prompt[i].prompt, i + 1, console.log('generated : ', i));
}
