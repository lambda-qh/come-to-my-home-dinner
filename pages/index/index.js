// 首页：菜品列表 + 热度标签 + 榜单排序 + 标签分组筛选
const store = require('../../utils/store.js');
const hot = require('../../utils/hot-tags.js');

Page({
  data: {
    dishes: [],
    display: [],
    sortType: 'default',
    groupTags: [],
    activeGroup: 'all',
    stats: { dishCount: 0 }
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const list = store.getDishes();
    const stats = store.getStats();
    const dishes = list.map((d) => {
      const item = Object.assign({}, d);
      item.tags = hot.buildTags(d, list).slice(0, 1);
      item.customTags = d.customTags || [];
      return item;
    });
    // 收集所有分组标签（去重）
    const tagSet = [];
    dishes.forEach((d) => {
      (d.customTags || []).forEach((t) => {
        if (tagSet.indexOf(t) === -1) tagSet.push(t);
      });
    });
    this.setData({ dishes, stats, groupTags: tagSet });
    this.applySort(this.data.sortType);
  },

  onSort(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ sortType: type });
    this.applySort(type);
  },

  onGroup(e) {
    const g = e.currentTarget.dataset.group;
    this.setData({ activeGroup: g });
    this.applySort(this.data.sortType);
  },

  applySort(type) {
    // 先按分组过滤，再排序
    let arr = this.data.dishes.slice();
    if (this.data.activeGroup !== 'all') {
      arr = arr.filter((d) => (d.customTags || []).indexOf(this.data.activeGroup) > -1);
    }
    if (type === 'score') {
      arr = hot.sortByScore(arr);
    } else if (type === 'hot') {
      arr = hot.sortByOrders(arr);
    }
    this.setData({ display: arr });
  },

  goDetail(e) {
    wx.navigateTo({ url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id });
  },

  goAdd() {
    wx.navigateTo({ url: '/pages/edit/edit' });
  }
});
