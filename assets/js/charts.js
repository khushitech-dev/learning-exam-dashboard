/* ============================================================
   PERSONAL LEARNING DASHBOARD - CANVAS CHARTS
   Lightweight, dependency-free charts
   ============================================================ */

function setupCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return { ctx, width: rect.width, height: rect.height };
}

function getCSS(varName, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return v || fallback;
}

/* ---------- Bar chart ---------- */
function drawBarChart(canvas, labels, values, opts = {}) {
  const { ctx, width, height } = setupCanvas(canvas);
  const paddingLeft = opts.padLeft != null ? opts.padLeft : 40;
  const paddingBottom = opts.padBottom != null ? opts.padBottom : 30;
  const paddingTop = 20;
  const paddingRight = 10;
  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;
  const max = Math.max(100, ...values);
  const barGap = 8;
  const barW = Math.max(8, (chartW / values.length) - barGap);
  const color = getCSS('--primary', '#6366f1');
  const gridColor = getCSS('--border', '#e5e7eb');
  const textColor = getCSS('--muted', '#6b7280');

  ctx.clearRect(0, 0, width, height);
  ctx.font = '10px Inter, sans-serif';
  ctx.fillStyle = textColor;

  // gridlines
  for (let i = 0; i <= 4; i++) {
    const y = paddingTop + chartH - (chartH * i / 4);
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, y);
    ctx.lineTo(width - paddingRight, y);
    ctx.stroke();
    ctx.fillText(String(Math.round(max * i / 4)).replace('.0',''), 4, y + 3);
  }

  values.forEach((v, i) => {
    const x = paddingLeft + i * (barW + barGap) + barGap / 2;
    const h = (v / max) * chartH;
    const y = paddingTop + chartH - h;
    const grad = ctx.createLinearGradient(0, y, 0, paddingTop + chartH);
    grad.addColorStop(0, color);
    grad.addColorStop(1, color + (opts.fade ? '55' : '88'));
    ctx.fillStyle = grad;
    if (opts.round) {
      const r = Math.min(6, barW / 2, h);
      roundRect(ctx, x, y, barW, h, r);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, barW, h);
    }
    // label
    if (opts.valueLabels) {
      ctx.fillStyle = textColor;
      ctx.fillText(String(v) + (opts.suffix || '%'), x, y - 4);
    }
    if (labels[i]) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillText(shortLabel(labels[i], barW), x + barW / 2, height - 10);
      ctx.restore();
    }
  });
}

/* ---------- Donut chart ---------- */
function drawDonut(canvas, segments, opts = {}) {
  const { ctx, width, height } = setupCanvas(canvas);
  const size = Math.min(width, height);
  const cx = width / 2, cy = height / 2;
  const radius = (size / 2) - 8;
  const innerRadius = radius * (opts.innerRatio != null ? opts.innerRatio : 0.62);
  const total = segments.reduce((a, b) => a + b.value, 0) || 1;
  let start = -Math.PI / 2;
  const gap = 0.02;

  ctx.clearRect(0, 0, width, height);

  segments.forEach(seg => {
    const frac = seg.value / total;
    const sweep = frac * Math.PI * 2 - (frac > 0.01 ? gap : 0);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, start, start + sweep);
    ctx.arc(cx, cy, innerRadius, start + sweep, start, true);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();
    start += frac * Math.PI * 2;
  });

  if (opts.centerText != null) {
    ctx.fillStyle = getCSS('--text', '#111827');
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(opts.centerText, cx, cy - 8);
    if (opts.centerSub) {
      ctx.fillStyle = getCSS('--muted', '#6b7280');
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(opts.centerSub, cx, cy + 12);
    }
  }
}

/* ---------- Line chart (weekly progress) ---------- */
function drawLineChart(canvas, labels, values, opts = {}) {
  const { ctx, width, height } = setupCanvas(canvas);
  const padL = 35, padB = 25, padT = 20, padR = 10;
  const cw = width - padL - padR, ch = height - padT - padB;
  const max = Math.max(100, ...values);
  const color = getCSS('--primary', '#6366f1');
  const gridColor = getCSS('--border', '#e5e7eb');

  ctx.clearRect(0, 0, width, height);

  for (let i = 0; i <= 4; i++) {
    const y = padT + ch - (ch * i / 4);
    ctx.strokeStyle = gridColor;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(width - padR, y); ctx.stroke();
  }

  if (values.length === 0) return;
  ctx.font = '10px Inter';
  ctx.fillStyle = getCSS('--muted', '#6b7280');
  values.forEach((v, i) => ctx.fillText(String(Math.round(v)), 4, padT + ch - (ch * v / max) + 3));

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  values.forEach((v, i) => {
    const x = padL + (i / Math.max(1, values.length - 1)) * cw;
    const y = padT + ch - (ch * v / max);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // point dots
  ctx.fillStyle = color;
  values.forEach((v, i) => {
    const x = padL + (i / Math.max(1, values.length - 1)) * cw;
    const y = padT + ch - (ch * v / max);
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
  });

  // labels
  ctx.fillStyle = getCSS('--muted', '#6b7280');
  ctx.textAlign = 'center';
  labels.forEach((l, i) => {
    const x = padL + (i / Math.max(1, values.length - 1)) * cw;
    ctx.fillText(shortLabel(l, 60), x, height - 8);
  });
}

/* ---------- Horizontal bar (weak topics) ---------- */
function drawHBar(canvas, labels, values, colors, opts = {}) {
  const { ctx, width, height } = setupCanvas(canvas);
  ctx.clearRect(0, 0, width, height);
  const padT = 8;
  const labelW = opts.labelW != null ? opts.labelW : 110;
  const padB = 4;
  const rowH = (height - padT - padB) / Math.max(1, values.length);
  const barX = 10 + labelW;
  const barW = width - barX - 10;

  ctx.font = '11px Inter';
  ctx.textAlign = 'left';

  values.forEach((v, i) => {
    const y = padT + i * rowH;
    const pct = v / 100;
    const color = colors[i] || getCSS('--primary', '#6366f1');

    ctx.fillStyle = getCSS('--border', '#e5e7eb');
    ctx.fillRect(barX, y + rowH * 0.2, barW, rowH * 0.6);

    ctx.fillStyle = color;
    ctx.fillRect(barX, y + rowH * 0.2, barW * pct, rowH * 0.6);

    ctx.fillStyle = getCSS('--text', '#111827');
    ctx.fillText(shortLabel(opts.showLabels ? opts.showLabels[i] : labels[i], labelW), 10, y + rowH * 0.65);

    ctx.fillStyle = getCSS('--muted', '#6b7280');
    ctx.textAlign = 'right';
    ctx.fillText(String(v) + '%', width - 10, y + rowH * 0.65);
    ctx.textAlign = 'left';
  });
}

/* ---------- helpers ---------- */
function shortLabel(s, maxPx) {
  if (!s) return '';
  const maxChars = Math.max(4, Math.floor(maxPx / 6.5) - 2);
  return s.length > maxChars ? s.slice(0, maxChars) + '…' : s;
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

window.ChartLib = { drawBarChart, drawDonut, drawLineChart, drawHBar, roundRect };
