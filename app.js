// 来我家吃饭吧 - 私房菜单小程序
const store = require('./utils/store.js');

App({
  onLaunch() {
    // 首次启动时写入内置示例菜品（含预置评分/评价/点单数据，便于体验热度标签）
    store.ensureSeed();
  },
  globalData: {
    brandName: '来我家吃饭吧',
    brandSlogan: '请查收我的私房菜单'
  }
});
