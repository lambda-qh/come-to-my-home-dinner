// 想吃清单页：单条移除、多选生成愿望海报
const store = require('../../utils/store.js');
const hot = require('../../utils/hot-tags.js');

Page({
  data: {
    dishes: [],
    selectMode: false,
    selectedIds: []
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const all = store.getDishes();
    const list = all.filter((d) => d.wished);
    const dishes = list.map((d) => {
      const item = Object.assign({}, d);
      item.tags = hot.buildTags(d, all).slice(0, 1);
      return item;
    });
    this.setData({ dishes });
  },

  // 卡片点击：多选模式切换选中，否则进详情
  onCardTap(e) {
    const id = e.currentTarget.dataset.id;
    if (this.data.selectMode) {
      this.toggleSelect(id);
    } else {
      wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
    }
  },

  handleSelect(e) {
    if (this.data.selectMode) {
      this.toggleSelect(e.detail.id);
    }
  },

  toggleSelect(id) {
    const ids = this.data.selectedIds.slice();
    const idx = ids.indexOf(id);
    if (idx > -1) {
      ids.splice(idx, 1);
    } else {
      ids.push(id);
    }
    this.setData({ selectedIds: ids });
  },

  // 单条移除
  onRemove(e) {
    const id = e.detail.id;
    wx.showModal({
      title: '移出清单',
      content: '确定把这道菜移出想吃清单吗？',
      confirmText: '移出',
      confirmColor: '#3D3929',
      success: (res) => {
        if (res.confirm) {
          store.toggleWish(id);
          this.refresh();
          wx.showToast({ title: '已移出', icon: 'none' });
        }
      }
    });
  },

  // 多选模式切换
  onSelectMode() {
    this.setData({
      selectMode: !this.data.selectMode,
      selectedIds: []
    });
  },

  goPoster() {
    if (this.data.selectMode) {
      if (!this.data.selectedIds.length) {
        wx.showToast({ title: '请先勾选想吃的菜', icon: 'none' });
        return;
      }
      wx.navigateTo({ url: '/pages/poster/poster?ids=' + this.data.selectedIds.join(',') });
    } else {
      if (!this.data.dishes.length) {
        wx.showToast({ title: '清单还是空的哦', icon: 'none' });
        return;
      }
      wx.navigateTo({ url: '/pages/poster/poster' });
    }
  }
});
