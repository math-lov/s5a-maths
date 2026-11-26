/* Inequality diagrams: exact endpoint data, quadratic graphs, progressive SVG
 * animations, sign-flip & algebraic step cues, multi-part navigation and
 * reversible steps.
 * Reuses the site's cg-split layout. Each frame is rebuilt synchronously as a
 * pure function of (spec, at) so rapid Next/Back/Restart/Part-jump cannot leave
 * an obsolete range, timer or answer on screen.
 */
(function (global) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var COLOURS = {
    ink: '#30303b',
    muted: '#666671',
    grid: '#ece9e2',
    given: '#e2660a',
    givenText: '#a94300',
    claim: '#4f46e5',
    claimDark: '#3730a3'
  };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function svg(tag, attrs, text) {
    var n = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text != null) n.textContent = text;
    return n;
  }

  function bi(host, zh, en) {
    var pair = el('span', 'bi');
    pair.appendChild(el('span', 'l-zh', zh));
    pair.appendChild(el('span', 'l-en', en));
    host.appendChild(pair);
    return pair;
  }

  function setButton(btn, zh, en, arrow, side) {
    btn.replaceChildren();
    var arw = arrow ? el('span', 'arw', arrow) : null;
    if (arw) arw.setAttribute('aria-hidden', 'true');
    if (arw && side === 'start') btn.appendChild(arw);
    bi(btn, zh, en);
    if (arw && side !== 'start') btn.appendChild(arw);
  }

  function button(cls, zh, en, arrow, side) {
    var b = el('button', 'btn btn-sm ' + cls);
    b.type = 'button';
    setButton(b, zh, en, arrow, side);
    return b;
  }

  function fmt(x) {
    if (Math.abs(x) < 1e-9) return '0';
    return Number.isInteger(x) ? String(x) : String(+x.toFixed(3));
  }

  function renderTexNode(node, texSrc, displayMode) {
    node.setAttribute('data-tex', texSrc);
    node.setAttribute('data-display', displayMode ? '1' : '0');
    if (global.katex) {
      try {
        global.katex.render(texSrc, node, {
          displayMode: !!displayMode,
          throwOnError: false,
          strict: false
        });
        return;
      } catch (e) { /* fall back to source text */ }
    }
    node.textContent = texSrc;
  }

  function renderInlineMath(host, text) {
    var s = String(text || '');
    var re = /\$([^$]+)\$/g;
    var last = 0, m;
    while ((m = re.exec(s)) !== null) {
      if (m.index > last) host.appendChild(document.createTextNode(s.slice(last, m.index)));
      var span = el('span', 'iq-inline-math');
      renderTexNode(span, m[1], false);
      host.appendChild(span);
      last = re.lastIndex;
    }
    if (last < s.length) host.appendChild(document.createTextNode(s.slice(last)));
  }

  function isSignFlipStep(state) {
    if (!state) return false;
    if (state.flip) return true;
    return /negative.*reverse|reverse.*sign|除以負數|乘以負數|負數.*轉向/i.test((state.en || '') + ' ' + (state.zh || ''));
  }

  function stepCue(state, at) {
    var txt = ((state && state.en) || '') + ' ' + ((state && state.zh) || '');
    if (/expand and clear denominators|展開並消去分母/i.test(txt)) {
      return { zh: '第 ' + at + ' 步 · 展開並消分母', en: 'Step ' + at + ' · Clear denominators' };
    }
    if (/common multiple|denominator|分母/i.test(txt)) {
      return { zh: '第 ' + at + ' 步 · 兩邊同乘公倍數', en: 'Step ' + at + ' · Multiply by LCD' };
    }
    if (/move variable|移項/i.test(txt)) {
      return { zh: '第 ' + at + ' 步 · 移項分組', en: 'Step ' + at + ' · Move terms' };
    }
    if (/combine like terms|化簡兩邊同類項/i.test(txt)) {
      return { zh: '第 ' + at + ' 步 · 合併同類項', en: 'Step ' + at + ' · Combine like terms' };
    }
    if (/divide both sides by the positive|兩邊同除以正數/i.test(txt)) {
      return { zh: '第 ' + at + ' 步 · 兩邊同除（不轉向）', en: 'Step ' + at + ' · Divide (keep sign)' };
    }
    if (/factorise|因式分解/i.test(txt)) {
      return { zh: '第 ' + at + ' 步 · 因式分解', en: 'Step ' + at + ' · Factorise' };
    }
    if (/quadratic formula|二次公式/i.test(txt)) {
      return { zh: '第 ' + at + ' 步 · 代入二次公式', en: 'Step ' + at + ' · Quadratic formula' };
    }
    if (/equal to 0|set y = 0|等於 0|y = 0/i.test(txt)) {
      return { zh: '第 ' + at + ' 步 · 令算式等於 0', en: 'Step ' + at + ' · Set equal to 0' };
    }
    if (/expand|collect|展開|未知數/i.test(txt)) {
      return { zh: '第 ' + at + ' 步 · 移項整理', en: 'Step ' + at + ' · Collect terms' };
    }
    if (/rearrange.*zero|整理成零/i.test(txt)) {
      return { zh: '第 ' + at + ' 步 · 化為與 0 比較', en: 'Step ' + at + ' · Rearrange to 0' };
    }
    if (/discriminant|判別式|\\Delta/i.test(txt)) {
      return { zh: '第 ' + at + ' 步 · 計算判別式', en: 'Step ' + at + ' · Discriminant' };
    }
    if (/integer|integral|整數|count|triangle|greatest|least|max|min|最大|最小/i.test(txt)) {
      return { zh: '第 ' + at + ' 步 · 核對整數／極值', en: 'Step ' + at + ' · Integer check' };
    }
    if (/substitute|代入|vertex|頂點|y-intercept|截距/i.test(txt)) {
      return { zh: '第 ' + at + ' 步 · 求常數', en: 'Step ' + at + ' · Solve parameter' };
    }
    if (/let |設|side length|area|面積|perimeter|周界|sum|product/i.test(txt)) {
      return { zh: '第 ' + at + ' 步 · 依題意列式', en: 'Step ' + at + ' · Set up inequality' };
    }
    return { zh: '第 ' + at + ' 步 · 代數推演', en: 'Step ' + at + ' · Algebraic step' };
  }

  function niceTickStep(span, targetTicks) {
    if (!span || span <= 0) return 1;
    var raw = span / (targetTicks || 6);
    var mag = Math.pow(10, Math.floor(Math.log10(raw)));
    var mult = [1, 2, 5, 10].find(function (n) { return n * mag >= raw; }) || 10;
    return mult * mag;
  }

  function placeLabels(items, minGap, minX, maxX) {
    var out = items.map(function (it) {
      return { x: it.x, lx: Math.max(minX, Math.min(maxX, it.x)), text: it.text, colour: it.colour };
    }).sort(function (a, b) { return a.x - b.x; });
    for (var pass = 0; pass < 8; pass++) {
      var moved = false;
      for (var i = 0; i < out.length - 1; i++) {
        var gap = out[i + 1].lx - out[i].lx;
        if (gap < minGap) {
          var push = (minGap - gap) / 2;
          out[i].lx -= push;
          out[i + 1].lx += push;
          moved = true;
        }
      }
      if (out.length) {
        if (out[0].lx < minX) {
          var shiftR = minX - out[0].lx;
          for (var j = 0; j < out.length; j++) {
            out[j].lx += shiftR;
            if (j + 1 < out.length && out[j + 1].lx - out[j].lx >= minGap) break;
          }
        }
        var last = out.length - 1;
        if (out[last].lx > maxX) {
          var shiftL = out[last].lx - maxX;
          for (var k = last; k >= 0; k--) {
            out[k].lx -= shiftL;
            if (k - 1 >= 0 && out[k].lx - out[k - 1].lx >= minGap) break;
          }
        }
      }
      if (!moved) break;
    }
    return out;
  }

  function jsonKey(v) {
    try { return JSON.stringify(v || null); } catch (e) { return ''; }
  }

  function foldView(spec, frameCount) {
    var v = Object.assign({}, spec.initial || {});
    var steps = spec.steps || [];
    for (var f = 0; f < frameCount; f++) {
      Object.assign(v, (steps[f] && steps[f].view) || {});
    }
    return v;
  }

  function draw(stage, spec, view, prevView, state, at, totalSteps) {
    stage.replaceChildren();
    view = view || {};
    var hasPrev = prevView != null;
    prevView = prevView || {};

    var plot = Object.prototype.hasOwnProperty.call(view, 'plot') ? view.plot : spec.plot;
    var prevPlot = hasPrev
      ? (Object.prototype.hasOwnProperty.call(prevView, 'plot') ? prevView.plot : spec.plot)
      : plot;

    var lanes = (spec.givenLanes || []).concat(view.lanes || []);
    var prevLanes = hasPrev ? (spec.givenLanes || []).concat(prevView.lanes || []) : lanes;
    var variable = view.variable || spec.variable || 'x';

    var showRoots = Boolean(plot && (view.roots || plot.givenRoots));
    var prevShowRoots = Boolean(prevPlot && (prevView.roots || prevPlot.givenRoots));
    var shade = (plot && view.shade) || [];
    var prevShade = (prevPlot && prevView.shade) || [];
    var levels = (plot && view.levels) || [];
    var prevLevels = (prevPlot && prevView.levels) || [];

    var plotIsNew = hasPrev && Boolean(plot) && (!prevPlot || jsonKey(plot.coeff) !== jsonKey(prevPlot.coeff));
    var rootsAreNew = hasPrev && showRoots && !prevShowRoots;
    var shadeIsNew = hasPrev && shade.length > 0 && jsonKey(shade) !== jsonKey(prevShade);
    var levelsAreNew = hasPrev && levels.length > 0 && jsonKey(levels) !== jsonKey(prevLevels);

    var laneNewFlags = lanes.map(function (row, idx) {
      if (!hasPrev) return false;
      if (idx >= prevLanes.length) return true;
      return jsonKey(row.intervals) !== jsonKey(prevLanes[idx].intervals) ||
        row.colour !== prevLanes[idx].colour;
    });
    var anyLaneNew = laneNewFlags.some(Boolean) || (hasPrev && lanes.length !== prevLanes.length);
    var visualChanged = plotIsNew || rootsAreNew || shadeIsNew || levelsAreNew || anyLaneNew;

    var isFlip = isSignFlipStep(state);
    var isFinal = at > 0 && at === totalSteps;
    var showAlgCue = at > 0 && !isFlip && !visualChanged;
    var showIntroCue = at === 0 && !plot && !lanes.length;
    var hasBanner = isFlip || showAlgCue || showIntroCue;

    var boundaryKeys = {};
    function recordKey(value, label) {
      if (value != null && /^[αβγδεζηθ]$/.test(label || '')) boundaryKeys[label] = value;
    }
    lanes.forEach(function (row) {
      (row.intervals || []).forEach(function (iv) {
        recordKey(iv.lo, iv.loLabel);
        recordKey(iv.hi, iv.hiLabel);
      });
    });
    if (showRoots) (plot.roots || []).forEach(function (r) { recordKey(r.x, r.label); });
    var boundaryNames = Object.keys(boundaryKeys);
    var keyRows = Math.ceil(boundaryNames.length / 2);

    var bannerHeight = hasBanner ? 38 : 0;
    var plotBlockHeight = plot ? 288 : 0;
    var lanesBlockHeight = lanes.length ? (30 + lanes.length * 76 + 18) : (plot ? 14 : 112);
    var height = Math.max(196, bannerHeight + plotBlockHeight + lanesBlockHeight + keyRows * 24 + 8);
    stage.setAttribute('viewBox', '0 0 420 ' + height);
    stage.appendChild(svg('title', {}, (spec.label || {}).en || 'Inequality diagram'));

    var domain = view.domain || spec.domain || [-6, 6];
    var left = 48, right = 386, dx = domain[1] - domain[0];
    function px(x) { return left + (x - domain[0]) / dx * (right - left); }

    function line(x1, y1, x2, y2, colour, width, cls, extra) {
      var attrs = { x1: x1, y1: y1, x2: x2, y2: y2, stroke: colour, 'stroke-width': width || 1.4 };
      if (cls) attrs.class = cls;
      if (extra) Object.keys(extra).forEach(function (k) { attrs[k] = extra[k]; });
      var node = svg('line', attrs);
      stage.appendChild(node);
      return node;
    }

    function text(x, y, t, colour, size, anchor, cls) {
      var attrs = {
        x: x,
        y: y,
        fill: colour === COLOURS.given ? COLOURS.givenText : (colour || COLOURS.ink),
        'font-size': size || 15,
        'text-anchor': anchor || 'middle',
        'font-family': 'Georgia, Times New Roman, serif'
      };
      if (cls) attrs.class = cls;
      var node = svg('text', attrs, t);
      stage.appendChild(node);
      return node;
    }

    function arrowH(x, y, direction, colour, cls) {
      var attrs = {
        d: 'M' + (x - direction * 7) + ' ' + (y - 4) + 'L' + x + ' ' + y + 'L' + (x - direction * 7) + ' ' + (y + 4),
        fill: 'none',
        stroke: colour,
        'stroke-width': 2,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      };
      if (cls) attrs.class = cls;
      stage.appendChild(svg('path', attrs));
    }

    function arrowUp(x, y, colour) {
      stage.appendChild(svg('path', {
        d: 'M' + (x - 4) + ' ' + (y + 7) + 'L' + x + ' ' + y + 'L' + (x + 4) + ' ' + (y + 7),
        fill: 'none',
        stroke: colour,
        'stroke-width': 1.8,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      }));
    }

    function drawBanner(yTop, kind, prefix, zhText, enText) {
      var g = svg('g', { class: 'iq-callout iq-callout-' + kind + (kind === 'flip' ? ' iq-anim-pop' : ' iq-anim-fade') });
      g.appendChild(svg('rect', {
        x: 16, y: yTop, width: 388, height: 28, rx: 14,
        class: 'iq-callout-bg'
      }));
      var t = svg('text', {
        x: 210, y: yTop + 18, 'text-anchor': 'middle', 'font-size': 12,
        class: 'iq-callout-txt'
      });
      if (prefix) t.appendChild(svg('tspan', {}, prefix + ' '));
      t.appendChild(svg('tspan', { class: 'l-zh' }, zhText));
      t.appendChild(svg('tspan', { class: 'iq-bi-sep' }, ' · '));
      t.appendChild(svg('tspan', { class: 'l-en' }, enText));
      g.appendChild(t);
      stage.appendChild(g);
    }

    var offset = 0;
    if (hasBanner) {
      if (isFlip) {
        drawBanner(8, 'flip', '⇄', '負數乘除 · 轉向', 'Negative ×/÷ · Sign flipped');
      } else if (showAlgCue) {
        var cue = stepCue(state, at);
        drawBanner(8, 'alg', '', cue.zh, cue.en);
      } else if (showIntroCue) {
        drawBanner(8, 'intro', '', '先看題目 · 按下一步', 'Study question · Press Next');
      }
      offset = bannerHeight;
    }

    var plotAxisY = null;
    if (plot) {
      var coeff = plot.coeff;
      var f = function (x) { return coeff[0] * x * x + coeff[1] * x + coeff[2]; };
      var yrange = plot.yRange || [-10, 10];
      var top = offset + 32, bottom = offset + 240;
      function py(y) { return bottom - (y - yrange[0]) / (yrange[1] - yrange[0]) * (bottom - top); }
      var axis = Math.max(top, Math.min(bottom, py(0)));
      var yaxis = Math.max(left, Math.min(right, px(0)));
      plotAxisY = axis;

      // Grid & ticks
      if (plot.scale !== false) {
        var xTick = niceTickStep(dx, 6);
        for (var tx = Math.ceil(domain[0] / xTick) * xTick; tx < domain[1]; tx += xTick) {
          if (Math.abs(tx) < 1e-8) continue;
          if (showRoots && (plot.roots || []).some(function (r) { return Math.abs(px(tx) - px(r.x)) < 24; })) continue;
          line(px(tx), top, px(tx), bottom, COLOURS.grid, 0.8);
          line(px(tx), axis - 3, px(tx), axis + 3, COLOURS.muted, 1);
          text(px(tx), axis + 17, fmt(tx), COLOURS.muted, 11.5);
        }
        var ySpan = yrange[1] - yrange[0];
        var yTick = niceTickStep(ySpan, 5);
        for (var ty = Math.ceil(yrange[0] / yTick) * yTick; ty < yrange[1]; ty += yTick) {
          if (Math.abs(ty) < 1e-8) continue;
          var pyT = py(ty);
          if (pyT < top + 14 || pyT > bottom - 10) continue;
          if (plot.yGiven != null && Math.abs(pyT - py(plot.yGiven)) < 18) continue;
          if (levels.some(function (lv) { return Math.abs(pyT - py(lv)) < 18; })) continue;
          line(left, pyT, right, pyT, COLOURS.grid, 0.8);
          line(yaxis - 3, pyT, yaxis + 3, pyT, COLOURS.muted, 1);
          var yLblX = yaxis > left + 36 ? yaxis - 7 : yaxis + 7;
          var yLblAnchor = yaxis > left + 36 ? 'end' : 'start';
          text(yLblX, pyT + 4, fmt(ty), COLOURS.muted, 11, yLblAnchor);
        }
      }

      // Axes & arrows
      line(left, axis, right, axis, COLOURS.muted, 1.5);
      arrowH(right, axis, 1, COLOURS.muted);
      line(yaxis, top, yaxis, bottom, COLOURS.muted, 1.5);
      arrowUp(yaxis, top, COLOURS.muted);
      text(right + 12, axis + 5, variable, COLOURS.ink, 15, 'start');
      text(yaxis, top - 11, 'y', COLOURS.ink, 15);
      var ox = yaxis > left + 18 ? yaxis - 11 : yaxis + 12;
      var oy = axis < bottom - 18 ? axis + 15 : axis - 8;
      text(ox, oy, 'O', COLOURS.muted, 13);

      // Horizontal reference levels (e.g. y = k)
      levels.forEach(function (level) {
        if (level < yrange[0] || level > yrange[1]) return;
        var ly = py(level);
        line(left, ly, right, ly, COLOURS.given, 1.6,
          'iq-level' + (levelsAreNew ? ' iq-anim-draw' : ''),
          { 'stroke-dasharray': '5 4', pathLength: '100' });
        text(left + 6, ly - 7, 'y = ' + fmt(level), COLOURS.given, 13.5, 'start');
      });

      // Given y-intercept marker
      if (plot.yGiven != null && plot.yGiven >= yrange[0] && plot.yGiven <= yrange[1]) {
        stage.appendChild(svg('circle', { cx: yaxis, cy: py(plot.yGiven), r: 3.5, fill: COLOURS.given }));
        text(yaxis + 9, py(plot.yGiven) - 7, fmt(plot.yGiven), COLOURS.given, 13.5, 'start');
      }

      // High-precision sample points including exact roots, vertex and shade bounds
      var xs = [];
      var sample = 280;
      for (var i = 0; i <= sample; i++) xs.push(domain[0] + dx * i / sample);
      var vertexX = -coeff[1] / (2 * coeff[0]);
      if (vertexX > domain[0] && vertexX < domain[1]) xs.push(vertexX);
      (plot.roots || []).forEach(function (r) {
        if (r.x >= domain[0] && r.x <= domain[1]) xs.push(r.x);
      });
      shade.forEach(function (iv) {
        if (iv.lo != null && iv.lo >= domain[0] && iv.lo <= domain[1]) xs.push(iv.lo);
        if (iv.hi != null && iv.hi >= domain[0] && iv.hi <= domain[1]) xs.push(iv.hi);
      });
      xs.sort(function (a, b) { return a - b; });
      // Deduplicate near-identical x values
      var uniqX = [];
      for (var u = 0; u < xs.length; u++) {
        if (!uniqX.length || xs[u] - uniqX[uniqX.length - 1] > 1e-9) uniqX.push(xs[u]);
      }

      function inShade(x) {
        return shade.some(function (iv) {
          if (iv.lo != null && iv.hi != null && Math.abs(iv.lo - iv.hi) < 1e-9) return false;
          var okLo = iv.lo == null || x >= iv.lo - 1e-9;
          var okHi = iv.hi == null || x <= iv.hi + 1e-9;
          return okLo && okHi;
        });
      }

      var curvePath = '';
      var highlightSegs = [];
      var activePts = [];
      for (var k = 0; k < uniqX.length; k++) {
        var xv = uniqX[k], yv = f(xv);
        var visible = yv >= yrange[0] && yv <= yrange[1];
        if (visible) {
          var sx = px(xv), sy = py(yv);
          var pos = sx.toFixed(2) + ' ' + sy.toFixed(2);
          curvePath += (curvePath && curvePath.slice(-1) !== '|' ? 'L' : 'M') + pos;
          if (inShade(xv)) {
            activePts.push([sx, sy]);
          } else if (activePts.length) {
            if (activePts.length >= 2) highlightSegs.push(activePts);
            activePts = [];
          }
        } else {
          if (curvePath && curvePath.slice(-1) !== '|') curvePath += '|';
          if (activePts.length) {
            if (activePts.length >= 2) highlightSegs.push(activePts);
            activePts = [];
          }
        }
      }
      if (activePts.length >= 2) highlightSegs.push(activePts);

      // Soft shaded area between curve & x-axis + thick curve highlight ribbon
      highlightSegs.forEach(function (pts) {
        var dCurve = pts.map(function (p, idx) {
          return (idx ? 'L' : 'M') + p[0].toFixed(2) + ' ' + p[1].toFixed(2);
        }).join('');
        var dArea = dCurve + 'L' + pts[pts.length - 1][0].toFixed(2) + ' ' + axis.toFixed(2) +
          'L' + pts[0][0].toFixed(2) + ' ' + axis.toFixed(2) + 'Z';
        stage.appendChild(svg('path', {
          d: dArea,
          class: 'iq-shade-area' + (shadeIsNew ? ' iq-anim-fade' : ''),
          fill: COLOURS.claim,
          opacity: 0.13
        }));
        stage.appendChild(svg('path', {
          d: dCurve,
          class: 'iq-highlight' + (shadeIsNew ? ' iq-anim-draw' : ''),
          fill: 'none',
          stroke: COLOURS.claim,
          'stroke-width': 7.5,
          'stroke-linecap': 'round',
          opacity: 0.36,
          pathLength: '100'
        }));
      });

      // Main parabola curve
      if (curvePath) {
        stage.appendChild(svg('path', {
          d: curvePath.replace(/\|/g, ''),
          class: 'iq-curve' + (plotIsNew ? ' iq-anim-draw' : ''),
          fill: 'none',
          stroke: COLOURS.ink,
          'stroke-width': 2.1,
          'stroke-linecap': 'round',
          pathLength: '100'
        }));
      }

      // Singleton tangent solution highlight (e.g. (x - 2)^2 <= 0 => x = 2)
      shade.forEach(function (iv) {
        if (iv.lo != null && iv.hi != null && Math.abs(iv.lo - iv.hi) < 1e-9) {
          var sx = px(iv.lo);
          var gPt = svg('g', { class: 'iq-highlight-point' + (shadeIsNew ? ' iq-anim-pop' : '') });
          gPt.appendChild(svg('circle', { cx: sx, cy: axis, r: 10.5, fill: COLOURS.claim, opacity: 0.24 }));
          gPt.appendChild(svg('circle', { cx: sx, cy: axis, r: 5.2, fill: COLOURS.claim, stroke: '#fdfcfb', 'stroke-width': 2 }));
          stage.appendChild(gPt);
        }
      });

      // Roots with collision-avoided labels
      if (showRoots && (plot.roots || []).length) {
        var rootLabels = [];
        (plot.roots || []).forEach(function (r) {
          var rx = px(r.x);
          stage.appendChild(svg('circle', {
            cx: rx, cy: axis, r: 3.8,
            fill: COLOURS.ink,
            stroke: '#fdfcfb',
            'stroke-width': 1.2,
            class: 'iq-root-dot' + (rootsAreNew ? ' iq-anim-pop' : '')
          }));
          rootLabels.push({ x: rx, text: r.label || fmt(r.x), colour: COLOURS.ink });
        });
        placeLabels(rootLabels, 34, left - 4, right + 4).forEach(function (rl) {
          if (Math.abs(rl.lx - rl.x) > 3) {
            line(rl.x, axis + 5, rl.lx, axis + 12, COLOURS.muted, 0.9, 'iq-leader');
          }
          text(rl.lx, axis + 25, rl.text, rl.colour, 14.5, 'middle', rootsAreNew ? 'iq-anim-fade' : '');
        });
      }

      if (plot.label) {
        var lblSize = plot.label.length > 26 ? 13.5 : 15;
        text(210, offset + 276, plot.label, COLOURS.ink, lblSize);
      }
      offset += plotBlockHeight;
    }

    // Vertical dashed projection drop-lines:
    // 1) Parabola roots -> active lane below
    if (plot && showRoots && lanes.length) {
      var targetLaneY = offset + 38 + (lanes.length - 1) * 76;
      var rootXs = (plot.roots || []).map(function (r) { return r.x; });
      var seenDrop = {};
      lanes.forEach(function (row, idx) {
        (row.intervals || []).forEach(function (iv) {
          ['lo', 'hi'].forEach(function (k) {
            var val = iv[k];
            if (val == null) return;
            var matched = rootXs.some(function (rx) { return Math.abs(rx - val) < 1e-4; });
            if (!matched) return;
            var key = Math.round(px(val));
            if (seenDrop[key]) return;
            seenDrop[key] = true;
            line(px(val), plotAxisY + 4, px(val), targetLaneY, COLOURS.claim, 1.1,
              'iq-drop-line' + (laneNewFlags[idx] ? ' iq-anim-draw' : ''),
              { 'stroke-dasharray': '4 4', opacity: 0.4, pathLength: '100' });
          });
        });
      });
    }

    // 2) Compound lanes -> combined intersection/union lane
    if (lanes.length >= 2) {
      var lastRow = lanes[lanes.length - 1];
      var isCombined = lastRow.label === '∩' || lastRow.label === '∪' ||
        (lastRow.colour === 'claim' && lanes.slice(0, -1).every(function (r) { return r.colour === 'given'; }));
      if (isCombined) {
        var topY = offset + 38;
        var botY = offset + 38 + (lanes.length - 1) * 76;
        var dropVals = [];
        var srcRows = lastRow.intervals.length ? [lastRow] : lanes.slice(0, -1);
        srcRows.forEach(function (row) {
          (row.intervals || []).forEach(function (iv) {
            if (iv.lo != null && iv.lo >= domain[0] && iv.lo <= domain[1]) dropVals.push(iv.lo);
            if (iv.hi != null && iv.hi >= domain[0] && iv.hi <= domain[1]) dropVals.push(iv.hi);
          });
        });
        var seenComp = {};
        dropVals.forEach(function (val) {
          var key = Math.round(px(val));
          if (seenComp[key]) return;
          seenComp[key] = true;
          line(px(val), topY, px(val), botY, COLOURS.claim, 1.1,
            'iq-drop-line' + (laneNewFlags[lanes.length - 1] ? ' iq-anim-draw' : ''),
            { 'stroke-dasharray': '4 4', opacity: 0.36, pathLength: '100' });
        });
      }
    }

    // Empty neutral axis when there is no plot and no lanes yet
    if (!lanes.length && !plot) {
      var neutralY = offset + 54;
      line(left, neutralY, right, neutralY, COLOURS.muted, 1.5);
      arrowH(left, neutralY, -1, COLOURS.muted);
      arrowH(right, neutralY, 1, COLOURS.muted);
      if (0 >= domain[0] && 0 <= domain[1]) {
        line(px(0), neutralY - 4, px(0), neutralY + 4, COLOURS.muted, 1.2);
        text(px(0), neutralY + 23, '0', COLOURS.muted, 14);
      }
      text(right + 12, neutralY + 5, variable, COLOURS.ink, 15, 'start');
    }

    // Number-line lanes
    lanes.forEach(function (row, index) {
      var y = offset + 38 + index * 76;
      var colour = COLOURS[row.colour || 'claim'] || COLOURS.claim;
      var isNew = laneNewFlags[index];
      var glowFinal = isFinal && row.colour !== 'given';

      text(23, y + 5, row.label || '', colour, 16.5);
      line(left, y, right, y, COLOURS.muted, 1.4);
      arrowH(left, y, -1, COLOURS.muted);
      arrowH(right, y, 1, COLOURS.muted);
      text(right + 12, y + 5, variable, COLOURS.ink, 15, 'start');

      var labels = [];
      if (!(row.intervals || []).length) {
        text(216, y - 14, '∅', colour, 22, 'middle', 'iq-empty-set' + (isNew ? ' iq-anim-pop' : ''));
      }

      (row.intervals || []).forEach(function (interval) {
        var a = interval.lo == null ? domain[0] : Math.max(domain[0], interval.lo);
        var b = interval.hi == null ? domain[1] : Math.min(domain[1], interval.hi);
        if (b < domain[0] || a > domain[1] || b < a) return;

        // Draw thick interval/ray bar
        var barCls = 'iq-interval' + (isNew ? ' iq-anim-draw' : '') + (glowFinal ? ' iq-final-glow' : '');
        if (Math.abs(px(b) - px(a)) > 0.5) {
          line(px(a), y, px(b), y, colour, 4.2, barCls, { 'stroke-linecap': 'round', pathLength: '100' });
        }

        // Draw open/closed endpoints or arrows
        [['lo', a, interval.loClosed, -1], ['hi', b, interval.hiClosed, 1]].forEach(function (edge) {
          var key = edge[0], real = interval[key], x = px(edge[1]);
          if (real == null || real < domain[0] || real > domain[1]) {
            arrowH(x, y, edge[3], colour, isNew ? 'iq-anim-fade' : '');
            return;
          }
          if (key === 'hi' && interval.lo === interval.hi) return;
          stage.appendChild(svg('circle', {
            cx: x, cy: y, r: 5.2,
            class: 'iq-endpoint' + (isNew ? ' iq-anim-pop' : ''),
            'data-value': real,
            'data-closed': !!edge[2],
            stroke: colour,
            'stroke-width': 2.1,
            fill: edge[2] ? colour : '#fdfcfb'
          }));
          var labelText = interval[key + 'Label'] || fmt(real);
          if (!labels.some(function (l) { return Math.abs(l.x - x) < 0.5; })) {
            labels.push({ x: x, text: labelText, colour: colour });
          }
        });
      });

      // Subtle origin 0 reference tick if inside domain and clear of endpoints
      if (0 >= domain[0] && 0 <= domain[1]) {
        var zeroX = px(0);
        if (!labels.some(function (l) { return Math.abs(l.x - zeroX) < 24; })) {
          line(zeroX, y - 4, zeroX, y + 4, COLOURS.muted, 1.1);
          text(zeroX, y + 23, '0', COLOURS.muted, 11.5);
        }
      }

      // Collision-avoided endpoint labels
      placeLabels(labels, 34, left - 4, right + 4).forEach(function (l) {
        if (Math.abs(l.lx - l.x) > 3) {
          line(l.x, y + 7, l.lx, y + 13, l.colour, 0.9, 'iq-leader');
        }
        text(l.lx, y + 26, l.text, l.colour, 14.5, 'middle', isNew ? 'iq-anim-fade' : '');
      });
    });

    for (var keyRow = 0; keyRow < keyRows; keyRow++) {
      text(210, height - (keyRows - keyRow - 1) * 24 - 10,
        boundaryNames.slice(keyRow * 2, keyRow * 2 + 2).map(function (k) {
          return k + ' ≈ ' + fmt(boundaryKeys[k]);
        }).join('     '),
        COLOURS.muted, 13.5);
    }
  }

  function mount(host, original, opts) {
    opts = opts || {};
    var choices = original.cases || [original], chosen = 0, at = 0;
    var outer = el('div', 'iq-host');
    host.appendChild(outer);

    if (original.cases) {
      var picker = el('div', 'iq-cases');
      picker.setAttribute('role', 'group');
      picker.setAttribute('aria-label', 'Choose an example / 選擇例子');
      choices.forEach(function (c, i) {
        var b = button('iq-case', c.name.zh, c.name.en);
        b.onclick = function () { stopAuto(); chosen = i; at = 0; render(); };
        picker.appendChild(b);
      });
      outer.appendChild(picker);
    }

    // Optional multi-part jump bar (for questions with (a), (b), (c)...)
    var partBar = el('div', 'iq-parts');
    partBar.setAttribute('role', 'group');
    partBar.setAttribute('aria-label', 'Jump to part / 跳至小題');
    outer.appendChild(partBar);

    var wrap = el('div', 'cg cg-split iq-player');
    var stage = svg('svg', { class: 'cg-svg iq-svg', role: 'img' });
    wrap.appendChild(stage);

    var detail = el('div', 'cg-detail');
    detail.setAttribute('aria-live', 'polite');
    detail.setAttribute('aria-atomic', 'true');
    var progress = el('div', 'cg-progress');
    var say = el('div', 'cg-say');
    detail.appendChild(progress);
    detail.appendChild(say);
    wrap.appendChild(detail);

    var nav = el('div', 'cg-navigation');
    var autoRow = el('div', 'cg-autorow');
    var autoBtn = button('cg-auto', '自動播放', 'Auto play', '▶', 'end');
    autoBtn.setAttribute('aria-pressed', 'false');
    autoRow.appendChild(autoBtn);
    nav.appendChild(autoRow);

    var row = el('div', 'cg-row');
    nav.appendChild(row);
    var back = button('cg-back', '上一步', 'Back', '←', 'start');
    var next = button('cg-next btn-primary', '下一步', 'Next step', '→', 'end');
    var restart = button('cg-restart', '重播', 'Restart');
    row.appendChild(back);
    row.appendChild(next);
    row.appendChild(restart);
    wrap.appendChild(nav);
    outer.appendChild(wrap);

    var autoTimer = null;
    function stopAuto() {
      if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
      autoBtn.setAttribute('aria-pressed', 'false');
      setButton(autoBtn, '自動播放', 'Auto play', '▶', 'end');
    }

    function stepPartsFor(spec) {
      var steps = spec.steps || [];
      if (!original.cases && Array.isArray(opts.stepParts) && opts.stepParts.length === steps.length) {
        return opts.stepParts;
      }
      return steps.map(function (st) { return (st && st.part) || ''; });
    }

    function partGroups(partsList) {
      var groups = [], seen = {};
      partsList.forEach(function (p, idx) {
        if (p && !seen[p]) {
          seen[p] = true;
          groups.push({ label: p, firstStep: idx + 1 });
        }
      });
      return groups.length >= 2 ? groups : [];
    }

    function render() {
      var spec = choices[chosen], steps = spec.steps || [], state = at ? steps[at - 1] : null;
      var partsList = stepPartsFor(spec);
      var groups = partGroups(partsList);
      var activePart = at > 0 ? (partsList[at - 1] || '') : '';

      wrap.dataset.step = at;
      wrap.dataset.case = chosen;

      // Update part-jump bar
      partBar.replaceChildren();
      if (groups.length) {
        partBar.style.display = '';
        var lbl = el('span', 'iq-parts-lbl');
        bi(lbl, '小題：', 'Part:');
        partBar.appendChild(lbl);
        groups.forEach(function (g) {
          var pb = el('button', 'btn btn-sm iq-part', g.label);
          pb.type = 'button';
          pb.setAttribute('aria-pressed', String(activePart === g.label));
          pb.onclick = function () { stopAuto(); at = g.firstStep; render(); };
          partBar.appendChild(pb);
        });
      } else {
        partBar.style.display = 'none';
      }

      var prevView = at > 0 ? foldView(spec, at - 1) : null;
      var view = foldView(spec, at);
      draw(stage, spec, view, prevView, state, at, steps.length);

      // Progress header + visual meter
      progress.replaceChildren();
      var progHead = el('div', 'iq-prog-head');
      var partSuffix = activePart ? ' · ' + activePart : '';
      bi(progHead,
        at ? '第 ' + at + ' / ' + steps.length + ' 步' + partSuffix : '先看題目 · 共 ' + steps.length + ' 步',
        at ? 'Step ' + at + ' of ' + steps.length + partSuffix : 'Study the question · ' + steps.length + ' steps');
      progress.appendChild(progHead);

      var meter = el('div', 'iq-meter');
      meter.setAttribute('aria-hidden', 'true');
      var fill = el('div', 'iq-meter-fill');
      fill.style.width = (steps.length ? Math.round(at / steps.length * 100) : 0) + '%';
      meter.appendChild(fill);
      progress.appendChild(meter);

      // Step captions & math equations
      say.replaceChildren();
      ['zh', 'en'].forEach(function (lang) {
        var n = el('div', 'cg-' + lang);
        var caption = state ? state[lang] : (spec.intro || {})[lang] || '';
        if (!state) {
          var introLine = el('div', 'iq-intro-line');
          renderInlineMath(introLine, caption);
          n.appendChild(introLine);
        } else {
          var cleanCaption = caption.replace(/\$[^$]*\$/g, '').replace(/[：:]\s*[。.]*$/, '').trim();
          n.appendChild(el('div', '', cleanCaption));
          (state.mathLines || []).forEach(function (formula) {
            var f = el('div', 'cg-equation');
            f.dataset.formula = formula;
            renderTexNode(f, '\\displaystyle ' + formula, false);
            n.appendChild(f);
          });
        }
        say.appendChild(n);
      });

      var reason = el('div', 'cg-ref', state ? state.ref || '' : '');
      say.appendChild(reason);

      if (original.cases) {
        Array.prototype.forEach.call(outer.querySelectorAll('.iq-case'), function (b, i) {
          b.setAttribute('aria-pressed', String(i === chosen));
        });
      }

      back.disabled = restart.disabled = at === 0;
      next.disabled = at === steps.length;
      if (at === steps.length) {
        setButton(next, '完成', 'Done');
        stopAuto();
      } else {
        setButton(next, '下一步', 'Next step', '→', 'end');
      }
    }

    autoBtn.onclick = function () {
      if (autoTimer) { stopAuto(); return; }
      var steps = choices[chosen].steps || [];
      if (!steps.length) return;
      if (at >= steps.length) { at = 0; render(); }
      autoBtn.setAttribute('aria-pressed', 'true');
      setButton(autoBtn, '暫停', 'Pause', '⏸', 'end');
      autoTimer = setInterval(function () {
        var curSteps = choices[chosen].steps || [];
        if (at >= curSteps.length) { stopAuto(); return; }
        at++;
        render();
      }, 4800);
    };

    back.onclick = function () { stopAuto(); if (at) { at--; render(); } };
    next.onclick = function () { stopAuto(); if (at < (choices[chosen].steps || []).length) { at++; render(); } };
    restart.onclick = function () { stopAuto(); at = 0; render(); };

    render();
    return wrap;
  }

  global.S5A_INEQUALITIES = { mount: mount };
  if (global.S5A_DEMO) global.S5A_DEMO.types.inequality = function (host, opts) { return mount(host, opts); };
})(window);
