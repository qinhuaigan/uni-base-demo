import App from './App'

// #ifndef VUE3
import Vue from 'vue'
import store from '@/store'

import uView from "uview-ui";
Vue.use(uView);

import './css/style.css'

Vue.config.productionTip = false

// 配置项
Vue.prototype.serverPath = config.serverPath // 请求路径
Vue.prototype.serverFilePath = config.serverFilePath // 文件路径
Vue.prototype.appName = config.name // 应用名称

Vue.prototype.$request = function(method, url, data, isJSON, hideLoading) {
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
        'Content-Type': isJSON ? '' : 'application/x-www-form-urlencoded'
      },
      success: (res) => {
        uni.hideLoading()
        if (res.data.code === 0) {
          resolve(res.data)
        } else {
          resolve(false)
          this.$refs.uNotify.show({
            type: 'error',
            top: 0,
            message: res.data.msg,
            icon: 'error-circle'
          });
        }
      },
      fail: (err) => {
        uni.hideLoading()
        resolve(false)
      }
    })
  })
}

App.mpType = 'app'
const app = new Vue({
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import {
  createSSRApp
} from 'vue'
export function createApp() {
  const app = createSSRApp(App)
  return {
    store,
    app
  }
}
// #endif
