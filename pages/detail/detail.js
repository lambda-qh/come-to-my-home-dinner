// 菜品详情页：打分（含图片）、评价、收藏想吃清单、点单记录
const store = require('../../utils/store.js');
const hot = require('../../utils/hot-tags.js');

function formatTime(t) {
  const diff = Date.now() - t;
  if (diff < 60 * 1000) return '刚刚';
  if (diff < 3600 * 1000) return Math.floor(diff / 60000) + ' 分钟前';
  if (diff < 86400 * 1000) return Math.floor(diff / 3600000) + ' 小时前';
  if (diff < 7 * 86400 * 1000) return Math.floor(diff / 86400000) + ' 天前';
  const d = new Date(t);
  return (d.getMonth() + 1) + '月' + d.getDate() + '日';
}

Page({
  data: {
    id: '',
    dish: null,
    tags: [],
    avg: 0,
    avgText: '0.0',
    myScore: 0,
    myComment: '',
    ratingImages: [],
    submitting: false
  },

  onLoad(options) {
    if (!options || !options.id) return;
    this.setData({ id: options.id });
    store.recordVisit(options.id);
  },

  onShow() {
    this.loadDish();
  },

  loadDish() {
    const dish = store.getDish(this.data.id);
    if (!dish) {
      wx.showToast({ title: '菜品不存在', icon: 'none' });
      return;
    }
    const list = store.getDishes();
    const avg = hot.avgScore(dish);
    const view = Object.assign({}, dish);
    view.ratings = (dish.ratings || []).map((r) => {
      return Object.assign({}, r, { timeText: formatTime(r.time) });
    });
    view.firstChar = Array.from(dish.name || '菜')[0];
    this.setData({
      dish: view,
      tags: hot.buildTags(dish, list).slice(0, 3),
      avg,
      avgText: avg ? avg.toFixed(1) : '0.0'
    });
  },

  onScore(e) {
    this.setData({ myScore: e.detail.value });
  },

  onComment(e) {
    this.setData({ myComment: e.detail.value });
  },

  // 评价图片：最多 4 张
  chooseRatingImage() {
    const remain = 4 - this.data.ratingImages.length;
    if (remain <= 0) {
      wx.showToast({ title: '最多上传 4 张图片', icon: 'none' });
      return;
    }
    wx.chooseMedia({
      count: remain,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const temps = res.tempFiles.map((f) => f.tempFilePath);
        let pending = temps.length;
        const saved = [];
        temps.forEach((t) => {
          store.saveLocalImage(t, (p) => {
            saved.push(p || t);
            pending -= 1;
            if (pending === 0) {
              this.setData({ ratingImages: this.data.ratingImages.concat(saved).slice(0, 4) });
            }
          });
        });
      }
    });
  },

  removeRatingImage(e) {
    const idx = e.currentTarget.dataset.index;
    const list = this.data.ratingImages.slice();
    list.splice(idx, 1);
    this.setData({ ratingImages: list });
  },

  submitRating() {
    if (!this.data.myScore) {
      wx.showToast({ title: '请先点几颗星星', icon: 'none' });
      return;
    }
    if (this.data.submitting) return;
    this.setData({ submitting: true });

    store.addRating(this.data.id, this.data.myScore, this.data.myComment, this.data.ratingImages);
    this.setData({ myScore: 0, myComment: '', ratingImages: [], submitting: false });
    wx.showToast({ title: '感谢评价', icon: 'success' });
    this.loadDish();
  },

  previewImg(e) {
    const urls = e.currentTarget.dataset.urls;
    const url = e.currentTarget.dataset.url;
    wx.previewImage({ current: url, urls: urls || [url] });
  },

  toggleWish() {
    const dish = store.toggleWish(this.data.id);
    if (!dish) return;
    this.loadDish();
    wx.showToast({ title: dish.wished ? '已加入想吃清单' : '已移出清单', icon: 'none' });
  }
});
