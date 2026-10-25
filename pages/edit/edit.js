// 添加 / 编辑菜品页：名称、描述、标签、食材、图片
const store = require('../../utils/store.js');

const PRESET_TAGS = ['春季限定', '减脂福音', '膳食纤维宝库', '高蛋白', '下饭神器', '宴客硬菜', '一人食', '快手菜'];

Page({
  data: {
    id: '',
    name: '',
    desc: '',
    ingredientsText: '',
    image: '',
    presetTags: PRESET_TAGS,
    selectedTags: [],
    tagInput: '',
    saving: false
  },

  onLoad(options) {
    if (options && options.id) {
      const dish = store.getDish(options.id);
      if (dish) {
        this.setData({
          id: dish.id,
          name: dish.name,
          desc: dish.desc || '',
          ingredientsText: (dish.ingredients || []).join('、'),
          image: dish.image || '',
          selectedTags: dish.customTags || []
        });
        wx.setNavigationBarTitle({ title: '编辑菜品' });
      }
    }
  },

  onName(e) {
    this.setData({ name: e.detail.value });
  },

  onDesc(e) {
    this.setData({ desc: e.detail.value });
  },

  onIngredients(e) {
    this.setData({ ingredientsText: e.detail.value });
  },

  // ---- 标签 ----
  onTagInput(e) {
    this.setData({ tagInput: e.detail.value });
  },

  addTag(v) {
    const tag = (v || '').trim();
    if (!tag) return;
    if (this.data.selectedTags.indexOf(tag) > -1) {
      wx.showToast({ title: '标签已存在', icon: 'none' });
      return;
    }
    this.setData({ selectedTags: this.data.selectedTags.concat(tag) });
  },

  onPresetTag(e) {
    this.addTag(e.currentTarget.dataset.tag);
  },

  addCustomTag() {
    if (!this.data.tagInput.trim()) {
      wx.showToast({ title: '先输入标签内容', icon: 'none' });
      return;
    }
    this.addTag(this.data.tagInput);
    this.setData({ tagInput: '' });
  },

  removeTag(e) {
    const idx = e.currentTarget.dataset.index;
    const list = this.data.selectedTags.slice();
    list.splice(idx, 1);
    this.setData({ selectedTags: list });
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const temp = res.tempFiles[0].tempFilePath;
        store.saveDishImage(temp, (saved) => {
          this.setData({ image: saved || temp });
        });
      }
    });
  },

  removeImage() {
    this.setData({ image: '' });
  },

  save() {
    const name = this.data.name.trim();
    if (!name) {
      wx.showToast({ title: '请先填写菜名', icon: 'none' });
      return;
    }
    const ingredients = this.data.ingredientsText.split(/[、，,；;\s]+/).filter(Boolean);
    if (!ingredients.length) {
      wx.showToast({ title: '请填写主要食材', icon: 'none' });
      return;
    }
    if (this.data.saving) return;
    this.setData({ saving: true });

    const { id, image, desc, selectedTags } = this.data;
    if (id) {
      store.updateDish(id, { name, ingredients, image, desc, customTags: selectedTags });
    } else {
      store.addDish({ name, ingredients, image, desc, customTags: selectedTags });
    }

    wx.showToast({ title: id ? '已保存' : '已加入菜单', icon: 'success' });
    setTimeout(() => {
      wx.navigateBack();
    }, 500);
  }
});
