// 星级评分组件：只读展示 / 可点选打分
Component({
  properties: {
    // 当前分值 0-5（整数）
    value: { type: Number, value: 0 },
    // 只读模式
    readonly: { type: Boolean, value: true },
    // 星星字号（rpx）
    size: { type: Number, value: 32 }
  },
  data: {
    stars: [1, 2, 3, 4, 5]
  },
  methods: {
    onTap(e) {
      if (this.data.readonly) return;
      const v = Number(e.currentTarget.dataset.v);
      this.triggerEvent('change', { value: v });
    }
  }
});
