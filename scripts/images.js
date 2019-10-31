const Jimp = require('jimp')
const Path = require('path')

const assetsDir = Path.join(__dirname, "../assets/")

var fontBoldPath =  Path.join(__dirname, "../fonts/montserrat-bold.fnt")
var fontRegularPath =  Path.join(__dirname, "../fonts/montserrat-regular.fnt")

new Jimp(1280, 470, "#15202b", (err, image) => {
  Jimp.loadFont(fontBoldPath).then(fontBold => {
    printImage(image, fontBold, 140, 'PROMPTS')
    Jimp.loadFont(fontRegularPath).then(fontRegular => {
      printImage(image, fontRegular, 280, '#Codevember')
      var file = 'text_image.' + image.getExtension()
      image.write(Path.resolve(assetsDir, file))
    })
  })
});

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