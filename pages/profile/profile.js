// 管理后台（仅主理人可见）：菜品数据（编辑/删除）、点单私信收件箱、饭局管理
const store = require('../../utils/store.js');
const hot = require('../../utils/hot-tags.js');
const poster = require('../../utils/poster.js');

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
    tab: 'data',
    stats: { dishCount: 0, totalRatings: 0, wishCount: 0, totalVisits7d: 0 },
    rows: [],
    messages: [],
    unreadCount: 0,
    feasts: [],
    feastTitle: '',
    feastDate: '',
    feastNote: '',
    feastBusy: false
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    this.refreshStats();
    this.refreshRows();
    this.refreshMessages();
    this.refreshFeasts();
  },

  refreshStats() {
    this.setData({ stats: store.getStats() });
  },

  refreshRows() {
    const list = store.getDishes();
    const rows = list.map((d) => {
      const avg = hot.avgScore(d);
      return {
        id: d.id,
        name: d.name,
        firstChar: Array.from(d.name || '菜')[0],
        image: d.image || '',
        tags: d.customTags || [],
        avg,
        avgText: avg ? avg.toFixed(1) : '—',
        ratingCount: hot.ratingCount(d),
        wishCount: d.wishCount || 0,
        visit7d: hot.visitCountInDays(d, 7)
      };
    });
    this.setData({ rows });
  },

  refreshMessages() {
    const list = store.getMessages();
    const messages = list.map((m) => {
      return Object.assign({}, m, { timeText: formatTime(m.time) });
    });
    this.setData({ messages, unreadCount: store.getUnreadCount() });
  },

  refreshFeasts() {
    this.setData({ feasts: store.getFeasts() });
  },

  onTab(e) {
    this.setData({ tab: e.currentTarget.dataset.tab });
  },

  // ---- 菜品数据 ----
  goDetail(e) {
    wx.navigateTo({ url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id });
  },

  goEdit(e) {
    wx.navigateTo({ url: '/pages/edit/edit?id=' + e.currentTarget.dataset.id });
  },

  goAdd() {
    wx.navigateTo({ url: '/pages/edit/edit' });
  },

  onDeleteDish(e) {
    const id = e.currentTarget.dataset.id;
    const dish = store.getDish(id);
    wx.showModal({
      title: '删除菜品',
      content: '确定删除「' + (dish ? dish.name : '这道菜') + '」吗？相关评分与评价将一并删除。',
      confirmText: '删除',
      confirmColor: '#B3564A',
      success: (res) => {
        if (res.confirm) {
          store.removeDish(id);
          this.refresh();
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  },

  // ---- 点单私信 ----
  previewMessage(e) {
    const id = e.currentTarget.dataset.id;
    const m = this.data.messages.find((x) => x.id === id);
    if (!m) return;
    if (!m.read) store.markMessageRead(id);
    this.refreshMessages();
    if (m.poster) {
      wx.previewImage({ urls: [m.poster] });
    }
  },

  removeMessage(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除私信',
      content: '确定删除这条点单消息吗？',
      confirmText: '删除',
      confirmColor: '#B3564A',
      success: (res) => {
        if (res.confirm) {
          store.removeMessage(id);
          this.refreshMessages();
          wx.showToast({ title: '已删除', icon: 'none' });
        }
      }
    });
  },

  // ---- 饭局 ----
  onFeastTitle(e) {
    this.setData({ feastTitle: e.detail.value });
  },

  onFeastDate(e) {
    this.setData({ feastDate: e.detail.value });
  },

  onFeastNote(e) {
    this.setData({ feastNote: e.detail.value });
  },

  createFeast() {
    const title = this.data.feastTitle.trim();
    if (!title) {
      wx.showToast({ title: '请填写饭局名称', icon: 'none' });
      return;
    }
    store.addFeast({ title, date: this.data.feastDate, note: this.data.feastNote });
    this.setData({ feastTitle: '', feastDate: '', feastNote: '' });
    this.refreshFeasts();
    wx.showToast({ title: '饭局已创建', icon: 'success' });
  },

  // 生成饭局海报（隐藏 canvas 绘制）并保存相册
  genFeastPoster(e) {
    const id = e.currentTarget.dataset.id;
    const feast = store.getFeasts().find((f) => f.id === id);
    if (!feast || this.data.feastBusy) return;
    this.setData({ feastBusy: true });
    const query = wx.createSelectorQuery();
    query.select('#feastCanvas').fields({ node: true, size: true }).exec((res) => {
      if (!res || !res[0] || !res[0].node) {
        this.setData({ feastBusy: false });
        return;
      }
      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      const info = wx.getWindowInfo();
      const dpr = info.pixelRatio || 2;
      const W = res[0].width;
      const H = res[0].height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.scale(dpr, dpr);
      poster.drawFeast(ctx, canvas, W, H, feast).then(() => {
        wx.canvasToTempFilePath({
          canvas,
          success: (r) => {
            store.saveLocalImage(r.tempFilePath, (saved) => {
              store.updateFeastPoster(id, saved || '');
              this.refreshFeasts();
              wx.saveImageToPhotosAlbum({
                filePath: r.tempFilePath,
                success: () => {
                  this.setData({ feastBusy: false });
                  wx.showToast({ title: '海报已保存到相册', icon: 'success' });
                },
                fail: () => {
                  this.setData({ feastBusy: false });
                  wx.showToast({ title: '海报已生成', icon: 'none' });
                }
              });
            });
          },
          fail: () => {
            this.setData({ feastBusy: false });
            wx.showToast({ title: '生成失败，请重试', icon: 'none' });
          }
        }, this);
      });
    });
  },

  previewFeastPoster(e) {
    const id = e.currentTarget.dataset.id;
    const feast = this.data.feasts.find((f) => f.id === id);
    if (feast && feast.poster) {
      wx.previewImage({ urls: [feast.poster] });
    }
  },

  removeFeast(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除饭局',
      content: '确定删除这场饭局吗？',
      confirmText: '删除',
      confirmColor: '#B3564A',
      success: (res) => {
        if (res.confirm) {
          store.removeFeast(id);
          this.refreshFeasts();
          wx.showToast({ title: '已删除', icon: 'none' });
        }
      }
    });
  },

  // ---- 数据管理 ----
  resetSeed() {
    wx.showModal({
      title: '重置示例数据',
      content: '将恢复为内置示例菜品，你添加和评价的数据会被覆盖（私信与饭局保留）。',
      confirmText: '重置',
      confirmColor: '#3D3929',
      success: (res) => {
        if (res.confirm) {
          store.resetSeed();
          this.refresh();
          wx.showToast({ title: '已重置', icon: 'success' });
        }
      }
    });
  },

  clearAll() {
    wx.showModal({
      title: '清空全部数据',
      content: '将删除所有菜品、评价、私信与饭局记录，且不可恢复。',
      confirmText: '清空',
      confirmColor: '#B3564A',
      success: (res) => {
        if (res.confirm) {
          store.clearAll();
          this.refresh();
          wx.showToast({ title: '已清空', icon: 'success' });
        }
      }
    });
  }
});
