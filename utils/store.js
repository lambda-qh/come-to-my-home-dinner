// 数据层：菜品增删改查、打分评价（含图片）、收藏、点单记录、点单私信、饭局
// 数据保存在微信本地缓存（wx.Storage），单机个人使用
const DISHES_KEY = 'lwj_dishes_v1';
const SEEDED_KEY = 'lwj_seeded_v1';
const MESSAGES_KEY = 'lwj_messages_v1';
const FEASTS_KEY = 'lwj_feasts_v1';

function uid(prefix) {
  return (prefix || 'd') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function daysAgo(n) {
  return Date.now() - n * 24 * 60 * 60 * 1000;
}

// ---------- 内置示例菜品（含预置评分/评价/点单数据，方便直接体验热度标签） ----------
function buildSeed() {
  const mkVisits = (list) => list.map((d) => ({ time: daysAgo(d) }));
  return [
    {
      id: 'seed_fanqie',
      name: '番茄炒蛋',
      ingredients: ['番茄', '鸡蛋', '小葱'],
      image: '',
      desc: '酸甜开胃，拌饭一绝',
      customTags: ['下饭神器'],
      createdAt: daysAgo(28),
      ratings: [
        { id: 'r1', score: 5, comment: '酸甜刚好，拌米饭一绝！', time: daysAgo(9), images: [] },
        { id: 'r2', score: 5, comment: '妈妈的味道，光盘行动', time: daysAgo(6), images: [] },
        { id: 'r3', score: 4, comment: '鸡蛋嫩滑，番茄多汁', time: daysAgo(2), images: [] }
      ],
      visits: mkVisits([1, 1, 2, 3, 4, 5, 6]),
      wished: true,
      wishCount: 6
    },
    {
      id: 'seed_jichi',
      name: '可乐鸡翅',
      ingredients: ['鸡翅中', '可乐', '生抽', '姜片'],
      image: '',
      desc: '甜咸交织，一人食光',
      customTags: ['下饭神器'],
      createdAt: daysAgo(25),
      ratings: [
        { id: 'r4', score: 5, comment: '甜咸刚好，一个人能干一盆', time: daysAgo(8), images: [] },
        { id: 'r5', score: 5, comment: '色泽诱人，锁汁入味', time: daysAgo(3), images: [] }
      ],
      visits: mkVisits([1, 2, 3, 5, 6]),
      wished: true,
      wishCount: 5
    },
    {
      id: 'seed_hongshao',
      name: '红烧肉',
      ingredients: ['五花肉', '冰糖', '生抽', '老抽', '料酒'],
      image: '',
      desc: '肥而不腻，入口即化',
      customTags: ['硬菜', '下饭神器'],
      createdAt: daysAgo(20),
      ratings: [
        { id: 'r6', score: 5, comment: '肥而不腻，入口即化', time: daysAgo(7), images: [] },
        { id: 'r7', score: 4, comment: '下饭神器，就是有点费米饭', time: daysAgo(4), images: [] },
        { id: 'r8', score: 4, comment: '炖得再软烂一点就完美了', time: daysAgo(1), images: [] }
      ],
      visits: mkVisits([2, 3, 5]),
      wished: false,
      wishCount: 3
    },
    {
      id: 'seed_luyu',
      name: '清蒸鲈鱼',
      ingredients: ['鲈鱼', '姜丝', '蒸鱼豉油', '葱段'],
      image: '',
      desc: '时令鲜味，蒸出嫩滑',
      customTags: ['宴客硬菜'],
      createdAt: daysAgo(15),
      ratings: [
        { id: 'r9', score: 5, comment: '鲜掉眉毛，宴客必备', time: daysAgo(5), images: [] },
        { id: 'r10', score: 4, comment: '肉质细嫩，火候刚好', time: daysAgo(2), images: [] }
      ],
      visits: mkVisits([1, 4, 6]),
      wished: false,
      wishCount: 2
    },
    {
      id: 'seed_tudou',
      name: '酸辣土豆丝',
      ingredients: ['土豆', '干辣椒', '香醋', '花椒'],
      image: '',
      desc: '酸辣脆爽，开胃第一',
      customTags: ['减脂福音'],
      createdAt: daysAgo(12),
      ratings: [
        { id: 'r11', score: 4, comment: '脆爽酸辣，开胃第一名', time: daysAgo(6), images: [] },
        { id: 'r12', score: 4, comment: '醋香浓郁，锅气十足', time: daysAgo(3), images: [] },
        { id: 'r13', score: 5, comment: '越吃越上头', time: daysAgo(1), images: [] }
      ],
      visits: mkVisits([2, 5]),
      wished: false,
      wishCount: 1
    },
    {
      id: 'seed_xilan',
      name: '蒜蓉西兰花',
      ingredients: ['西兰花', '蒜末', '蚝油'],
      image: '',
      desc: '清爽脆绿，营养满分',
      customTags: ['膳食纤维宝库', '减脂福音'],
      createdAt: daysAgo(8),
      ratings: [
        { id: 'r14', score: 4, comment: '清爽解腻，蒜香很足', time: daysAgo(4), images: [] },
        { id: 'r15', score: 5, comment: '脆绿好看，营养满分', time: daysAgo(1), images: [] }
      ],
      visits: mkVisits([3, 6]),
      wished: false,
      wishCount: 0
    }
  ];
}

// ---------- 菜品基础读写 ----------
function ensureSeed() {
  const seeded = wx.getStorageSync(SEEDED_KEY);
  if (!seeded) {
    wx.setStorageSync(DISHES_KEY, buildSeed());
    wx.setStorageSync(SEEDED_KEY, true);
  }
  return wx.getStorageSync(DISHES_KEY) || [];
}

function getDishes() {
  return wx.getStorageSync(DISHES_KEY) || [];
}

function saveDishes(list) {
  wx.setStorageSync(DISHES_KEY, list);
}

function getDish(id) {
  return getDishes().find((d) => d.id === id) || null;
}

// ---------- 菜品增删改 ----------
function addDish({ name, ingredients, image, customTags, desc }) {
  const list = getDishes();
  const dish = {
    id: uid('dish'),
    name: (name || '').trim(),
    ingredients: (ingredients || []).map((s) => s.trim()).filter(Boolean),
    image: image || '',
    customTags: (customTags || []).map((s) => s.trim()).filter(Boolean),
    desc: (desc || '').trim(),
    createdAt: Date.now(),
    ratings: [],
    visits: [],
    wished: false,
    wishCount: 0
  };
  list.unshift(dish);
  saveDishes(list);
  return dish;
}

function updateDish(id, patch) {
  const list = getDishes();
  const idx = list.findIndex((d) => d.id === id);
  if (idx < 0) return null;
  const dish = list[idx];
  if (typeof patch.name === 'string') dish.name = patch.name.trim();
  if (Array.isArray(patch.ingredients)) dish.ingredients = patch.ingredients.map((s) => s.trim()).filter(Boolean);
  if (typeof patch.image === 'string') dish.image = patch.image;
  if (Array.isArray(patch.customTags)) dish.customTags = patch.customTags.map((s) => s.trim()).filter(Boolean);
  if (typeof patch.desc === 'string') dish.desc = patch.desc.trim();
  saveDishes(list);
  return dish;
}

function removeDish(id) {
  saveDishes(getDishes().filter((d) => d.id !== id));
}

// ---------- 打分与评价（支持图片，最多 4 张） ----------
function addRating(dishId, score, comment, images) {
  const list = getDishes();
  const dish = list.find((d) => d.id === dishId);
  if (!dish) return null;
  dish.ratings = dish.ratings || [];
  dish.ratings.unshift({
    id: uid('r'),
    score: Math.max(1, Math.min(5, Math.round(score))),
    comment: (comment || '').trim(),
    images: (images || []).slice(0, 4),
    time: Date.now()
  });
  saveDishes(list);
  return dish;
}

// ---------- 收藏想吃清单 ----------
function toggleWish(dishId) {
  const list = getDishes();
  const dish = list.find((d) => d.id === dishId);
  if (!dish) return null;
  dish.wished = !dish.wished;
  if (dish.wished && (!dish.wishCount || dish.wishCount < 1)) dish.wishCount = 1;
  saveDishes(list);
  return dish;
}

// ---------- 点单记录（打开详情页记一次，用于热度标签） ----------
function recordVisit(dishId) {
  const list = getDishes();
  const dish = list.find((d) => d.id === dishId);
  if (!dish) return;
  dish.visits = dish.visits || [];
  dish.visits.push({ time: Date.now() });
  if (dish.visits.length > 200) dish.visits = dish.visits.slice(-200);
  saveDishes(list);
}

// ---------- 统计 ----------
function getStats() {
  const list = getDishes();
  const sevenAgo = daysAgo(7);
  let totalRatings = 0;
  let totalVisits7d = 0;
  let wishCount = 0;
  list.forEach((d) => {
    totalRatings += (d.ratings || []).length;
    totalVisits7d += (d.visits || []).filter((v) => v.time >= sevenAgo).length;
    if (d.wished) wishCount += 1;
  });
  return { dishCount: list.length, totalRatings, totalVisits7d, wishCount };
}

// ---------- 点单私信（转发厨子 → 主理人收件箱） ----------
function getMessages() {
  return wx.getStorageSync(MESSAGES_KEY) || [];
}

function addMessage({ dishes, note, poster }) {
  const list = getMessages();
  const msg = {
    id: uid('msg'),
    dishes: dishes || [],
    note: note || '',
    poster: poster || '',
    time: Date.now(),
    read: false
  };
  list.unshift(msg);
  wx.setStorageSync(MESSAGES_KEY, list);
  return msg;
}

function markMessageRead(id) {
  const list = getMessages();
  const m = list.find((x) => x.id === id);
  if (m) {
    m.read = true;
    wx.setStorageSync(MESSAGES_KEY, list);
  }
}

function removeMessage(id) {
  wx.setStorageSync(MESSAGES_KEY, getMessages().filter((x) => x.id !== id));
}

function getUnreadCount() {
  return getMessages().filter((m) => !m.read).length;
}

// ---------- 饭局 ----------
function getFeasts() {
  return wx.getStorageSync(FEASTS_KEY) || [];
}

function addFeast({ title, date, note, poster }) {
  const list = getFeasts();
  const feast = {
    id: uid('feast'),
    title: (title || '').trim(),
    date: date || '',
    note: (note || '').trim(),
    poster: poster || '',
    createdAt: Date.now()
  };
  list.unshift(feast);
  wx.setStorageSync(FEASTS_KEY, list);
  return feast;
}

function updateFeastPoster(id, poster) {
  const list = getFeasts();
  const f = list.find((x) => x.id === id);
  if (f) {
    f.poster = poster;
    wx.setStorageSync(FEASTS_KEY, list);
  }
}

function removeFeast(id) {
  wx.setStorageSync(FEASTS_KEY, getFeasts().filter((x) => x.id !== id));
}

// ---------- 数据管理 ----------
function resetSeed() {
  wx.setStorageSync(DISHES_KEY, buildSeed());
  wx.setStorageSync(SEEDED_KEY, true);
}

function clearAll() {
  wx.removeStorageSync(DISHES_KEY);
  wx.removeStorageSync(MESSAGES_KEY);
  wx.removeStorageSync(FEASTS_KEY);
  wx.setStorageSync(SEEDED_KEY, true);
}

// ---------- 图片持久化：临时文件 → 本地用户目录 ----------
function saveLocalImage(tempFilePath, cb) {
  if (!tempFilePath) {
    cb && cb('');
    return;
  }
  const fs = wx.getFileSystemManager();
  const extMatch = /\.(\w+)$/.exec(tempFilePath);
  const ext = extMatch ? extMatch[1] : 'jpg';
  const dest = wx.env.USER_DATA_PATH + '/img_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) + '.' + ext;
  fs.copyFile({
    srcPath: tempFilePath,
    destPath: dest,
    success: () => cb && cb(dest),
    fail: () => cb && cb(tempFilePath)
  });
}

function saveDishImage(tempFilePath, cb) {
  saveLocalImage(tempFilePath, cb);
}

module.exports = {
  ensureSeed,
  getDishes,
  getDish,
  addDish,
  updateDish,
  removeDish,
  addRating,
  toggleWish,
  recordVisit,
  getStats,
  getMessages,
  addMessage,
  markMessageRead,
  removeMessage,
  getUnreadCount,
  getFeasts,
  addFeast,
  updateFeastPoster,
  removeFeast,
  resetSeed,
  clearAll,
  saveLocalImage,
  saveDishImage
};
