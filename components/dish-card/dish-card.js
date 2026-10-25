// 菜品卡片组件：图/首字占位、名称、食材、热度标签、评分
// 支持：removable（右上移除按钮）、selectMode/selected（多选勾选）
const hot = require('../../utils/hot-tags.js');

Component({
  properties: {
    dish: { type: Object, value: {} },
    tags: { type: Array, value: [] },
    removable: { type: Boolean, value: false },
    selectMode: { type: Boolean, value: false },
    selected: { type: Boolean, value: false }
  },
  data: {
    avg: 0,
    avgText: '—',
    count: 0,
    firstChar: '菜',
    customTags: [],
    desc: ''
  },
  observers: {
    dish(dish) {
      if (!dish || !dish.id) return;
      const avg = hot.avgScore(dish);
      this.setData({
        avg,
        avgText: avg ? avg.toFixed(1) : '—',
        count: hot.ratingCount(dish),
        firstChar: Array.from(dish.name || '菜')[0],
        customTags: dish.customTags || [],
        desc: dish.desc || ''
      });
    }
  },
  methods: {
    onRemove() {
      this.triggerEvent('remove', { id: this.data.dish.id });
    },
    onSelect() {
      this.triggerEvent('select', { id: this.data.dish.id });
    }
  }
});
