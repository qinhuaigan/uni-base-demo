import Vue from 'vue'
import App from './App'

import './css/style.css'

// 此处为演示vuex使用，非uView的功能部分
import store from '@/store'

Vue.config.productionTip = false


// 配置项
const config = process.env.ENV_PATH ? require(process.env.ENV_PATH) : require('./env/dev.js')
Vue.prototype.serverPath = config.serverPath // 请求路径
Vue.prototype.serverFilePath = config.serverFilePath // 文件路径
Vue.prototype.appName = config.name // 应用名称
Vue.prototype.tenantId = config.tenantId // 租户 id
Vue.prototype.appVersion = config.appVersion // 小程序版本
Vue.prototype.logo = config.logo // 小程序 logo
Vue.prototype.$isIphoneX = false

Vue.prototype.$request = function(method, url, data, isJSON, hideLoading, showErrMsg) {
  // showErrMsg：不显示 "失败原因"，将 "错误信息" 通过 resolve 函数返回，接收数据时，需注意所传参数
  return new Promise((resolve) => {
    if (!hideLoading) {
      uni.showLoading({
        title: '请稍后...'
      })
    }

    const token = uni.getStorageSync('token')
    url = url.indexOf('http') === 0 ? url : `${Vue.prototype.serverPath}${url}?token=${token}`
    uni.request({
      url,
      method,
      data,
      header: {
        'Content-Type': isJSON ? '' : 'application/x-www-form-urlencoded',
        'tenantId': Vue.prototype.tenantId
      },
      success: (res) => {
        uni.hideLoading()
        if (res.data.code === 0) {
          resolve(res.data)
        } else {
          if (showErrMsg) {
            resolve({
              result: false,
              msg: res.data.msg
            })
          } else {
            resolve(false)
            if (this.$refs && this.$refs.uNotify) {
              this.$refs.uNotify.show({
                type: 'error',
                top: 0,
                message: res.data.msg,
                icon: 'error-circle'
              });
            }
          }
        }
      },
      fail: (err) => {
        uni.hideLoading()
        resolve(false)
      }
    })
  })
}

Vue.prototype.autoLogin = () => { // 小程序自动登录
  uni.login({
    success: async (res) => {
      const result = await Vue.prototype.$request('post', '/userinfo/auth/loginByWeChat', {
        code: res.code
      })
      if (result) {
        if (!result.data.haveOpenid) {
          uni.showToast({
            title: '账号未绑定',
            icon: 'error'
          })
          return
        }
        uni.setStorageSync("token", result.data.token);
        await Vue.prototype.getUser()
      } else {
        uni.removeStorageSync('token')
        uni.showToast({
          title: result.msg,
          icon: 'error'
        })
      }
    },
    fail: (e) => {

    }
  })
}

// 拼接文件完整地址
Vue.prototype.getFilePath = (path) => {
  return `${Vue.prototype.serverFilePath}${path}`
}

//秒数转化为时分秒
Vue.prototype.formatSeconds = (times) => {
  // const nowTime = new Date(); // 返回当前时间总毫秒数
  // const inputTime = new Date(time); // 返回用户输入的时间的毫秒数
  times = typeof times === 'string' ? parseFloat(times) : times
  times = times / 1000; // 返回剩余时间总的秒数

  let d = parseInt(times / 60 / 60 / 24); // 剩余天数
  // d = d < 10 ? '0' + d : d;
  let h = parseInt(times / 60 / 60 % 24); // 剩余小时数
  // h = h < 10 ? '0' + h : h;
  let m = parseInt(times / 60 % 60); // 剩余分钟数
  let s = parseInt(times % 60); // 剩余的秒
  // s = s < 10 ? '0' + s : s;
  // return "剩余" + d + '天' + h + '时' + m + '分' + s + '秒';
  return `${d ? d + '天' : ''}${h ? h + '时' : ''}${m ? m + '分' : ''}${s}秒`
}

/**
 * 将 m 转换成对应的单位（km）
 * @param {Object} size
 */
Vue.prototype.getDistance = size => {
  if (!size) {
    return ''
  }
  var num = 1000 // m
  if (size < num) {
    return Math.ceil(size) + 'm'
  } else {
    return (size / num).toFixed(2) + 'km'
  } // km
}

Vue.prototype.$getUserPosition = function() {
  return new Promise((resolve) => {
    uni.authorize({
      scope: 'scope.userLocation',
      success: () => {
        // getLocation() 由于微信官方频率限制（30s内只能调用一次），故使用缓存优先
        let positionInfo = uni.getStorageSync('positionInfo')
        positionInfo = positionInfo ? JSON.parse(positionInfo) : null
        const now = new Date().getTime() // 当前时间
        if (positionInfo && now <= positionInfo.time) {
          // 缓存的信息信息未超过 30s，使用缓存的信息
          resolve(positionInfo.data)
          return
        }

        uni.getLocation({
          isHighAccuracy: true, // 开启地图精准定位
          type: 'gcj02', // 地图类型写这个
          success: (res) => {
            // 缓存位置信息
            uni.setStorageSync('positionInfo', JSON.stringify({
              time: new Date().getTime() + 40 * 1000, // 缓存 40s
              data: res
            }))
            resolve(res)
          },
          fail: (err) => {
            if (this.$refs && this.$refs.uNotify) {
              this.$refs.uNotify.show({
                type: 'warning',
                message: '定位失败，请检查网络或GPS状态'
              })
            }
            resolve(false)
          }
        })
      },
      fail: (err) => {
        if (this.$refs && this.$refs.uNotify) {
          this.$refs.uNotify.show({
            type: 'warning',
            message: '定位失败，请点击右上角，开启授权设置'
          })
        }
        resolve(false)
      }
    })
  })
}

Vue.prototype.formatDate = function(value, type) {
  // 日期格式过滤器
  if (!value) {
    return null
  }
  value = typeof value === 'string' ? value.replace(/\-/g, '/') : value
  const date = new Date(value)
  let fmt = type || 'yyyy/MM/dd HH:mm:ss'
  var obj = {
    y: date.getFullYear(), // 年份，注意必须用getFullYear
    M: date.getMonth() + 1, // 月份，注意是从0-11
    d: date.getDate(), // 日期
    q: Math.floor((date.getMonth() + 3) / 3), // 季度
    w: date.getDay(), // 星期，注意是0-6
    H: date.getHours(), // 24小时制
    h: date.getHours() % 12 === 0 ? 12 : date.getHours() % 12, // 12小时制
    m: date.getMinutes(), // 分钟
    s: date.getSeconds(), // 秒
    S: date.getMilliseconds() // 毫秒
  }
  var week = ['天', '一', '二', '三', '四', '五', '六']
  for (var i in obj) {
    fmt = fmt.replace(new RegExp(i + '+', 'g'), function(m) {
      var val = obj[i] + ''
      if (i === 'w') return (m.length > 2 ? '星期' : '周') + week[val]
      for (var j = 0, len = val.length; j < m.length - len; j++) val = '0' + val
      return m.length === 1 ? val : val.substring(val.length - m.length)
    })
  }
  return fmt
}

/**
 * @description: 控制input框只能输入数字  小数点后两位
 */
Vue.prototype.clearNum1 = function(value, type) {

}



Vue.prototype.getUser = function() {
  return new Promise(async (resolve) => {
    const token = uni.getStorageSync("token");
    if (!token) {
      resolve(false)
      return
    }
    const result = await this.$request('get', '/userinfo/account/getUserByToken')
    if (result) {
      this.setStoreData('userInfo', result.data)
      if (!result.data.phone) {
        uni.showModal({
          title: '温馨提示',
          content: '为了你的账号安全，请先绑定手机号',
          showCancel: true,
          confirmText: '去绑定',
          success: (response) => {
            if (response.confirm) {
              // 用户点击确定
              uni.navigateTo({
                url: '/pages/my/bindPhone'
              })
            } else if (response.cancel) {
              // 用户点击取消
            } 
          },
          fail: () => {}
        })
      }
    }
  })
}

App.mpType = 'app'

const app = new Vue({
  store,
  ...App
})
app.$mount()
