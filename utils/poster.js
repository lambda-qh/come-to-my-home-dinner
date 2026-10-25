// 愿望海报绘制（Canvas 2D，逻辑坐标 375 x 750）
// 食客视角："我想吃这些 / 求投喂"，性冷淡风：米白底、炭黑字、细边框、低饱和点缀

const C = {
  bg: '#F6F5F2',
  card: '#FFFFFF',
  ink: '#232323',
  gray: '#8F8F8F',
  lightGray: '#A5A5A5',
  line: '#E4E2DC',
  faint: '#EFEDE9'
};

function loadImage(canvas, src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = canvas.createImage();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function clipText(text, max) {
  const s = String(text || '');
  return s.length > max ? s.slice(0, max) + '…' : s;
}

// 逐字绘制（实现字距，性冷淡风排版的关键）
function drawSpacedText(ctx, text, x, y, spacing) {
  const chars = Array.from(String(text || ''));
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((s, w) => s + w, 0) + spacing * (chars.length - 1);
  let cx = x - total / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], cx + widths[i] / 2, y);
    cx += widths[i] + spacing;
  }
}

/**
 * 绘制海报
 * @param {Object} ctx canvas 2d 上下文（已按 dpr 缩放）
 * @param {Object} canvas canvas 节点（用于 createImage）
 * @param {Number} W 逻辑宽度
 * @param {Number} H 逻辑高度
 * @param {Array} dishes 心愿菜品列表（最多 6 道，每项含 name/image/tags）
 * @returns {Promise}
 */
function draw(ctx, canvas, W, H, dishes) {
  const list = dishes.slice(0, 6);

  // 背景
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // 克制几何装饰：右上细线圆 + 左下小圆点
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(W - 34, 46, 22, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = C.line;
  ctx.beginPath();
  ctx.arc(28, H * 0.62, 4, 0, Math.PI * 2);
  ctx.fill();

  // 顶部品牌小字
  ctx.fillStyle = C.gray;
  ctx.font = '11px sans-serif';
  drawSpacedText(ctx, '来 我 家 吃 饭 吧', W / 2, 84, 3);

  // 主标题：食客视角
  ctx.fillStyle = C.ink;
  ctx.font = '300 40px sans-serif';
  drawSpacedText(ctx, '我想吃这些', W / 2, 158, 6);

  // 副标题：已在主理人私房菜单语境下点单
  ctx.fillStyle = C.gray;
  ctx.font = '13px sans-serif';
  drawSpacedText(ctx, '想吃清单 · 请主厨安排', W / 2, 192, 1);

  // 日期
  const d = new Date();
  ctx.fillStyle = C.lightGray;
  ctx.font = '11px sans-serif';
  drawSpacedText(ctx, (d.getMonth() + 1) + '月' + d.getDate() + '日 · 想吃清单已更新', W / 2, 216, 1);

  // 分隔细线
  ctx.strokeStyle = C.line;
  ctx.beginPath();
  ctx.moveTo(28, 238);
  ctx.lineTo(W - 28, 238);
  ctx.stroke();

  // 菜品网格：2 列，白卡 + 细边框
  const colW = 160;
  const cardH = 156;
  const gap = 12;
  const startX = (W - colW * 2 - gap) / 2;
  const startY = 262;

  return Promise.all(
    list.map((dish, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = startX + col * (colW + gap);
      const y = startY + row * (cardH + 16);
      return loadImage(canvas, dish.image).then((img) => {
        // 卡片底
        ctx.fillStyle = C.card;
        roundRect(ctx, x, y, colW, cardH, 8);
        ctx.fill();
        ctx.strokeStyle = C.line;
        ctx.lineWidth = 1;
        ctx.stroke();

        // 图区（内边距 8）
        const ix = x + 8;
        const iy = y + 8;
        const iw = colW - 16;
        const ih = 100;
        ctx.save();
        roundRect(ctx, ix, iy, iw, ih, 6);
        ctx.clip();
        if (img) {
          const sw = img.width;
          const sh = img.height;
          const scale = Math.max(iw / sw, ih / sh);
          ctx.drawImage(img, ix - (sw * scale - iw) / 2, iy - (sh * scale - ih) / 2, sw * scale, sh * scale);
        } else {
          ctx.fillStyle = C.faint;
          ctx.fillRect(ix, iy, iw, ih);
          ctx.fillStyle = C.lightGray;
          ctx.font = '300 34px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(Array.from(dish.name || '菜')[0], ix + iw / 2, iy + ih / 2 + 6);
        }
        ctx.restore();

        // 菜名
        ctx.fillStyle = C.ink;
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(clipText(dish.name, 8), x + colW / 2, y + 130);

        // 首个热度标签（克制灰字）
        const tag = dish.tags && dish.tags.length ? dish.tags[0] : null;
        if (tag) {
          ctx.fillStyle = C.gray;
          ctx.font = '11px sans-serif';
          ctx.fillText(clipText(tag.text, 10), x + colW / 2, y + 148);
        }
      });
    })
  ).then(() => {
    // 底部横幅（白卡细边框，点单语境）
    const bw = 300;
    const bh = 44;
    const bx = (W - bw) / 2;
    const by = H - 92;
    ctx.fillStyle = C.card;
    roundRect(ctx, bx, by, bw, bh, 22);
    ctx.fill();
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = C.ink;
    ctx.font = '15px sans-serif';
    drawSpacedText(ctx, '请主厨安排 ✦', W / 2, by + 29, 1);

    // 底部署名
    ctx.fillStyle = C.lightGray;
    ctx.font = '10px sans-serif';
    drawSpacedText(ctx, '· 来 我 家 吃 饭 吧 ·', W / 2, H - 16, 2);
    return true;
  });
}

// ---------- 饭局邀请海报 ----------
function formatMonthDay(dateStr) {
  if (!dateStr) return '时间待定';
  const parts = String(dateStr).split('-');
  if (parts.length < 3) return dateStr;
  return parseInt(parts[1], 10) + '月' + parseInt(parts[2], 10) + '日';
}

/**
 * 绘制饭局邀请海报（逻辑坐标 375 x 750）
 */
function drawFeast(ctx, canvas, W, H, feast) {
  // 背景
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // 克制装饰
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(W - 34, 46, 22, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = C.line;
  ctx.beginPath();
  ctx.arc(28, H * 0.62, 4, 0, Math.PI * 2);
  ctx.fill();

  // 品牌小字
  ctx.fillStyle = C.gray;
  ctx.font = '11px sans-serif';
  drawSpacedText(ctx, '来 我 家 吃 饭 吧', W / 2, 84, 3);

  // 主标题：饭局名
  ctx.fillStyle = C.ink;
  ctx.font = '300 34px sans-serif';
  drawSpacedText(ctx, clipText(feast.title || '周末饭局', 9), W / 2, 186, 4);

  // 副标题
  ctx.fillStyle = C.gray;
  ctx.font = '13px sans-serif';
  drawSpacedText(ctx, '一场关于好吃的聚会', W / 2, 220, 1);

  // 分隔细线
  ctx.strokeStyle = C.line;
  ctx.beginPath();
  ctx.moveTo(28, 250);
  ctx.lineTo(W - 28, 250);
  ctx.stroke();

  // 日期大卡
  const dayText = formatMonthDay(feast.date);
  const cy = 330;
  ctx.fillStyle = C.card;
  roundRect(ctx, 37.5, cy - 70, 300, 140, 24);
  ctx.fill();
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = C.ink;
  ctx.font = '300 44px sans-serif';
  drawSpacedText(ctx, dayText, W / 2, cy + 6, 2);
  ctx.fillStyle = C.lightGray;
  ctx.font = '11px sans-serif';
  drawSpacedText(ctx, '等 你 来', W / 2, cy + 42, 3);

  // 说明
  const note = feast.note || '';
  ctx.fillStyle = C.gray;
  ctx.font = '13px sans-serif';
  if (note) {
    drawSpacedText(ctx, clipText(note, 20), W / 2, cy + 96, 1);
  }

  // 底部横幅
  const bw = 300;
  const bh = 44;
  const bx = (W - bw) / 2;
  const by = H - 92;
  ctx.fillStyle = C.card;
  roundRect(ctx, bx, by, bw, bh, 22);
  ctx.fill();
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = C.ink;
  ctx.font = '15px sans-serif';
  drawSpacedText(ctx, '欢迎点单 · 私信主理人 ✦', W / 2, by + 29, 1);

  // 底部署名
  ctx.fillStyle = C.lightGray;
  ctx.font = '10px sans-serif';
  drawSpacedText(ctx, '· 来 我 家 吃 饭 吧 ·', W / 2, H - 16, 2);
  return Promise.resolve(true);
}

module.exports = {
  draw,
  drawFeast
};
