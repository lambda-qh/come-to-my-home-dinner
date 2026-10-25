// 愿望海报页：Canvas 2D 绘制 + 一键转发厨子（私信给主理人）+ 保存到相册
const store = require('../../utils/store.js');
const poster = require('../../utils/poster.js');

Page({
  data: {
    dishes: [],
    hasDish: false,
    canvasReady: false,
    busy: false
  },

  onLoad(options) {
    let list = store.getDishes().filter((d) => d.wished);
    // 支持多选指定菜品：?ids=xxx,yyy
    if (options && options.ids) {
      const ids = options.ids.split(',');
      list = list.filter((d) => ids.indexOf(d.id) > -1);
    }
    list = list.slice(0, 6);
    this.setData({ dishes: list, hasDish: list.length > 0 });
  },

  onReady() {
    if (this.data.hasDish) this.drawPoster();
  },

  drawPoster() {
    const query = wx.createSelectorQuery();
    query.select('#posterCanvas').fields({ node: true, size: true }).exec((res) => {
      if (!res || !res[0] || !res[0].node) return;
      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      const info = wx.getWindowInfo();
      const dpr = info.pixelRatio || 2;
      const W = res[0].width;
      const H = res[0].height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.scale(dpr, dpr);
      poster.draw(ctx, canvas, W, H, this.data.dishes).then(() => {
        this.setData({ canvasReady: true });
      });
    });
  },

  // 生成海报临时文件
  tempPoster(cb) {
    const query = wx.createSelectorQuery();
    query.select('#posterCanvas').fields({ node: true }).exec((res) => {
      if (!res || !res[0] || !res[0].node) {
        cb && cb('');
        return;
      }
      wx.canvasToTempFilePath({
        canvas: res[0].node,
        success: (r) => cb && cb(r.tempFilePath),
        fail: () => cb && cb('')
      }, this);
    });
  },

  // 一键转发厨子：海报存入本地 + 生成点单私信 → 主理人收件箱
  sendToChef() {
    if (this.data.busy) return;
    this.setData({ busy: true });
    this.tempPoster((temp) => {
      if (!temp) {
        this.setData({ busy: false });
        wx.showToast({ title: '生成失败，请重试', icon: 'none' });
        return;
      }
      store.saveLocalImage(temp, (saved) => {
        store.addMessage({
          dishes: this.data.dishes.map((d) => d.name),
          note: '来自想吃清单的点单',
          poster: saved || ''
        });
        this.setData({ busy: false });
        wx.showToast({ title: '已转发给主理人', icon: 'success' });
      });
    });
  },

  // 保存到相册（可再转发给其他人）
  saveToAlbum() {
    if (this.data.busy) return;
    this.setData({ busy: true });
    this.tempPoster((temp) => {
      if (!temp) {
        this.setData({ busy: false });
        wx.showToast({ title: '生成失败，请重试', icon: 'none' });
        return;
      }
      wx.saveImageToPhotosAlbum({
        filePath: temp,
        success: () => {
          this.setData({ busy: false });
          wx.showToast({ title: '已保存到相册', icon: 'success' });
        },
        fail: (err) => {
          this.setData({ busy: false });
          if (err.errMsg && err.errMsg.indexOf('auth') > -1) {
            wx.showModal({
              title: '需要相册权限',
              content: '保存海报需要相册权限，请前往设置开启',
              confirmText: '去设置',
              success: (m) => {
                if (m.confirm) wx.openSetting();
              }
            });
          } else {
            wx.showToast({ title: '保存失败，请重试', icon: 'none' });
          }
        }
      });
    });
  },

  goBack() {
    wx.navigateBack();
  },

  goHome() {
    wx.switchTab({ url: '/pages/index/index' });
  }
});
