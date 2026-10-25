// 热度标签引擎：根据评分 / 评价 / 点单 / 收藏 / 上新时间生成美团·点评风格的热度标签
// 返回 [{ text, type }]，type 对应 app.wxss 中的 .tag-* 配色

function avgScore(dish) {
  const ratings = dish.ratings || [];
  if (!ratings.length) return 0;
  const sum = ratings.reduce((s, r) => s + (r.score || 0), 0);
  return sum / ratings.length;
}

function visitCountInDays(dish, days) {
  const t = Date.now() - days * 24 * 60 * 60 * 1000;
  return (dish.visits || []).filter((v) => v.time >= t).length;
}

function ratingCount(dish) {
  return (dish.ratings || []).length;
}

function isNew(dish) {
  return Date.now() - (dish.createdAt || 0) <= 7 * 24 * 60 * 60 * 1000;
}

/**
 * 生成一道菜的热度标签
 * @param {Object} dish 菜品
 * @param {Array} allDishes 全部菜品（用于计算榜单排名）
 */
function buildTags(dish, allDishes) {
  const tags = [];
  const avg = avgScore(dish);
  const count = ratingCount(dish);

  // 1. 榜单推荐：按平均分排序，全榜第一
  if (count > 0) {
    const sorted = allDishes.slice().sort((a, b) => avgScore(b) - avgScore(a));
    if (sorted.length && sorted[0].id === dish.id) {
      tags.push({ text: '本店推荐 Top1', type: 'top' });
    }
  }

  // 2. 评分口碑
  if (count > 0 && avg >= 4.5 && !tags.some((t) => t.type === 'top')) {
    tags.push({ text: '好评如潮 ' + avg.toFixed(1) + ' 分', type: 'hot' });
  } else if (count > 0 && avg >= 4 && avg < 4.5) {
    tags.push({ text: '口碑不错 ' + avg.toFixed(1) + ' 分', type: 'good' });
  } else if (count > 0 && avg >= 3 && avg < 4) {
    tags.push({ text: '中规中矩 ' + avg.toFixed(1) + ' 分', type: 'order' });
  }

  // 3. 近 7 天点单热度（精简文案，避免拥挤）
  const vc7 = visitCountInDays(dish, 7);
  if (vc7 > 0) {
    tags.push({ text: '近7天 ' + vc7 + ' 人点单', type: 'order' });
  }

  // 4. 想吃人数（收藏热度）
  const wishCount = dish.wishCount || 0;
  if (wishCount > 0) {
    tags.push({ text: wishCount + ' 人想吃', type: 'wish' });
  }

  // 5. 新菜
  if (isNew(dish)) {
    tags.push({ text: '新菜尝鲜', type: 'new' });
  }

  // 6. 评价数（有评分但标签还少时补充）
  if (count > 0 && tags.length < 2) {
    tags.push({ text: count + ' 条评价', type: 'good' });
  }

  return tags;
}

// 榜单排序：评分榜 / 人气榜（近 7 天点单）
function sortByScore(list) {
  return list.slice().sort((a, b) => avgScore(b) - avgScore(a));
}

function sortByOrders(list) {
  return list.slice().sort((a, b) => visitCountInDays(b, 7) - visitCountInDays(a, 7));
}

module.exports = {
  avgScore,
  ratingCount,
  visitCountInDays,
  buildTags,
  sortByScore,
  sortByOrders
};
