// 读取 manifest.json ，修改后重新写入
const {
  log
} = require('console')
const fs = require('fs')
const package_json = require('./package.json')
const manifestPath = `${__dirname}/manifest.json`
const pagePath = `${__dirname}/pages.json`
const scssPath = `${__dirname}/uni.scss`
let Manifest = fs.readFileSync(manifestPath, {
  encoding: 'utf-8'
})
let Pagejson = fs.readFileSync(pagePath, {
  encoding: 'utf-8'
})
let Scss = fs.readFileSync(scssPath, {
  encoding: 'utf-8'
})

function replaceManifest(path, value) { // 修改 manifest.json 的配置
  const arr = path.split('.')
  const len = arr.length
  const lastItem = arr[len - 1]

  let i = 0
  let ManifestArr = Manifest.split(/\n/)

  for (let index = 0; index < ManifestArr.length; index++) {
    const item = ManifestArr[index]
    if (new RegExp(`"${arr[i]}"`).test(item)) ++i;
    if (i === len) {
      const hasComma = /,/.test(item)
      ManifestArr[index] = item.replace(new RegExp(`"${lastItem}"[\\s\\S]*:[\\s\\S]*`), `"${lastItem}": ${value}${hasComma ? ',' : ''}`)
      break;
    }
  }

  Manifest = ManifestArr.join('\n')
}

function replacePagejson(path, value) { // 修改 pages.json 的配置
  const arr = path.split('.')
  const len = arr.length
  const lastItem = arr[len - 1]

  let i = 0
  let PagejsonArr = Pagejson.split(/\n/)

  for (let index = 0; index < PagejsonArr.length; index++) {
    const item = PagejsonArr[index]
    if (new RegExp(`"${arr[i]}"`).test(item)) ++i;
    if (i === len) {
      const hasComma = /,/.test(item)
      PagejsonArr[index] = item.replace(new RegExp(`"${lastItem}"[\\s\\S]*:[\\s\\S]*`), `"${lastItem}": ${value}${hasComma ? ',' : ''}`)
      break;
    }
  }

  Pagejson = PagejsonArr.join('\n')
}

function replaceScssPath(path, value) { // 修改 uni.scss.json 的配置
  const arr = path.split('.')
  const len = arr.length
  const lastItem = arr[len - 1]

  let i = 0
  let ScssArr = Scss.split(/\n/)
  for (let index = 0; index < ScssArr.length; index++) {
    const item = ScssArr[index]
    const hasComma = /,/.test(item)
    const reg = new RegExp(`${lastItem}[\\s\\S]*:[\\s\\S]*`)
    ScssArr[index] = item.replace(reg, `${lastItem}: ${value};`)
  }

  Scss = ScssArr.join('\n')
}
// 使用
const path = package_json['uni-app']['scripts'][process.env.UNI_SCRIPT]['env']['ENV_PATH'] // 配置文件路径
const config = require(path) // 读取配置信息
replaceManifest('mp-weixin.appid', `"${config.appId}"`) // 更新 appid
replacePagejson('globalStyle.navigationBarTitleText', `"${config.name}"`) // 更新 pages.json
replaceScssPath('base-img-url', `'${config.serverFilePath}'`)

// 更新 manifest.json
fs.writeFileSync(manifestPath, Manifest, {
  "flag": "w"
})

// 更新 pages.json
fs.writeFileSync(pagePath, Pagejson, {
  "flag": "w"
})

// 更新 uni.scss
fs.writeFileSync(scssPath, Scss, {
  "flag": "w"
})

module.exports = {
  // ...
}
