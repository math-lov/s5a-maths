/* Inequality diagrams: exact endpoint data, quadratic graphs and reversible steps.
 * Reuses the site's cg-split layout. Each frame is rebuilt synchronously so rapid
 * Next/Back/Restart cannot leave an obsolete range or answer on screen.
 */
(function (global) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var COLOURS = { ink: '#30303b', muted: '#666671', given: '#e2660a', claim: '#4f46e5' };
  function el(tag, cls, text) {
    var n = document.createElement(tag); if (cls) n.className = cls;
    if (text != null) n.textContent = text; return n;
  }
  function svg(tag, attrs, text) {
    var n = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text != null) n.textContent = text; return n;
  }
  function bi(host, zh, en) {
    host.appendChild(el('span', 'l-zh', zh)); host.appendChild(el('span', 'l-en', en));
  }
  function button(cls, zh, en) {
    var b = el('button', 'btn btn-sm ' + cls); b.type = 'button'; bi(b, zh, en); return b;
  }
  function fmt(x) { return Number.isInteger(x) ? String(x) : String(+x.toFixed(3)); }
  function draw(stage, spec, view) {
    stage.replaceChildren();
    view = view || {}; var plot = Object.prototype.hasOwnProperty.call(view, 'plot') ? view.plot : spec.plot;
    var lanes = (spec.givenLanes || []).concat(view.lanes || []), variable = view.variable || spec.variable || 'x', height = plot ? 390 + Math.max(0, lanes.length - 1) * 70 : Math.max(190, 85 + lanes.length * 76);
    var boundaryKeys = {};
    function key(value, label) { if (value != null && /^[αβγδεζηθ]$/.test(label || '')) boundaryKeys[label] = value; }
    lanes.forEach(function(row) { row.intervals.forEach(function(i) { key(i.lo,i.loLabel); key(i.hi,i.hiLabel); }); });
    if (plot && (view.roots || plot.givenRoots)) (plot.roots || []).forEach(function(r) { key(r.x,r.label); });
    var boundaryNames = Object.keys(boundaryKeys), keyRows = Math.ceil(boundaryNames.length / 2);
    height += keyRows * 24;
    stage.setAttribute('viewBox', '0 0 420 ' + height);
    stage.appendChild(svg('title', {}, (spec.label || {}).en || 'Inequality diagram'));
    var domain = view.domain || spec.domain || [-6, 6];
    var left = 46, right = 388, dx = domain[1] - domain[0];
    function px(x) { return left + (x - domain[0]) / dx * (right - left); }
    function line(x1, y1, x2, y2, colour, width, cls) {
      stage.appendChild(svg('line', { x1: x1, y1: y1, x2: x2, y2: y2, stroke: colour, 'stroke-width': width || 1.4, class: cls || '' }));
    }
    function text(x, y, t, colour, size, anchor) {
      stage.appendChild(svg('text', { x: x, y: y, fill: colour === COLOURS.given ? '#a94300' : (colour || COLOURS.ink), 'font-size': size || 16, 'text-anchor': anchor || 'middle', 'font-family': 'Georgia, Times New Roman, serif' }, t));
    }
    function arrow(x, y, direction, colour) {
      stage.appendChild(svg('path', { d: 'M' + (x - direction * 7) + ' ' + (y - 4) + 'L' + x + ' ' + y + 'L' + (x - direction * 7) + ' ' + (y + 4), fill: 'none', stroke: colour, 'stroke-width': 2 }));
    }
    var offset = 0;
    if (plot) {
      var coeff = plot.coeff, f = function (x) { return coeff[0] * x * x + coeff[1] * x + coeff[2]; };
      var yrange = plot.yRange || [-10, 10], top = 35, bottom = 245;
      function py(y) { return bottom - (y - yrange[0]) / (yrange[1] - yrange[0]) * (bottom - top); }
      var axis = Math.max(top, Math.min(bottom, py(0))), yaxis = Math.max(left, Math.min(right, px(0)));
      line(left, axis, right, axis, COLOURS.muted); arrow(right, axis, 1, COLOURS.muted);
      line(yaxis, top, yaxis, bottom, COLOURS.muted); text(right + 9, axis + 5, variable); text(yaxis, top - 12, 'y');
      text(yaxis - 12, axis - 8, 'O', COLOURS.muted, 14);
      if (plot.scale !== false) {
        var rawTick = dx / 6, magnitude = Math.pow(10, Math.floor(Math.log10(rawTick)));
        var tick = [1,2,5,10].find(function(n) { return n*magnitude >= rawTick; }) * magnitude;
        for (var t = Math.ceil(domain[0] / tick) * tick; t < domain[1]; t += tick) {
          if (Math.abs(t) < 1e-8 || ((view.roots || plot.givenRoots) && (plot.roots || []).some(function(r) {return Math.abs(px(t)-px(r.x))<23;}))) continue;
          line(px(t), top, px(t), bottom, '#e5e5eb', .7);
          text(px(t), axis + 19, fmt(t), COLOURS.muted, 12);
        }
      }
      (view.levels || []).forEach(function (level) {
        if (level < yrange[0] || level > yrange[1]) return;
        var levelLine = svg('line', {x1:left,y1:py(level),x2:right,y2:py(level),stroke:COLOURS.given,'stroke-dasharray':'5 4'});
        stage.appendChild(levelLine); text(left + 5, py(level) - 7, 'y = ' + level, COLOURS.given, 14, 'start');
      });
      if (plot.yGiven != null) {
        stage.appendChild(svg('circle', {cx:yaxis,cy:py(plot.yGiven),r:3,fill:COLOURS.given}));
        text(yaxis + 8, py(plot.yGiven) - 8, String(plot.yGiven), COLOURS.given, 14, 'start');
      }
      var path = '', highlights = [], active = '', sample = 320;
      function selected(x) {
        return (view.shade || []).some(function (i) { return (i.lo == null || x > i.lo) && (i.hi == null || x < i.hi); });
      }
      for (var i = 0; i <= sample; i++) {
        var x = domain[0] + dx * i / sample, y = f(x), visible = y >= yrange[0] && y <= yrange[1];
        if (visible) {
          var pos = px(x).toFixed(2) + ' ' + py(y).toFixed(2);
          path += (path && path.slice(-1) !== '|' ? 'L' : 'M') + pos;
          if (selected(x)) active += (active ? 'L' : 'M') + pos;
          else if (active) { highlights.push(active); active = ''; }
        } else {
          if (path && path.slice(-1) !== '|') path += '|';
          if (active) { highlights.push(active); active = ''; }
        }
      }
      if (active) highlights.push(active);
      highlights.forEach(function (d) { stage.appendChild(svg('path', { d: d, class: 'iq-highlight', fill: 'none', stroke: COLOURS.claim, 'stroke-width': 8, opacity: .32 })); });
      stage.appendChild(svg('path', { d: path.replace(/\|/g, ''), class: 'iq-curve', fill: 'none', stroke: COLOURS.ink, 'stroke-width': 2 }));
      if (view.roots || plot.givenRoots) (plot.roots || []).forEach(function (r) {
        stage.appendChild(svg('circle', { cx: px(r.x), cy: axis, r: 3, fill: COLOURS.ink }));
        text(px(r.x), axis + 24, r.label || fmt(r.x), COLOURS.ink, 15);
      });
      if (plot.label) text(210, 284, plot.label, COLOURS.ink, 16);
      offset = 292;
    }
    if (!lanes.length) {
      line(left, offset + 55, right, offset + 55, COLOURS.muted);
      arrow(left, offset + 55, -1, COLOURS.muted); arrow(right, offset + 55, 1, COLOURS.muted);
      if (0 >= domain[0] && 0 <= domain[1]) text(px(0), offset + 80, '0', COLOURS.muted, 15);
      text(right + 9, offset + 60, variable);
    }
    lanes.forEach(function (row, index) {
      var y = offset + 42 + index * 76, colour = COLOURS[row.colour || 'claim'] || COLOURS.claim;
      text(24, y + 5, row.label || '', colour, 17); line(left, y, right, y, COLOURS.muted);
      arrow(left, y, -1, COLOURS.muted); arrow(right, y, 1, COLOURS.muted);
      text(right + 10, y + 5, variable);
      if (!row.intervals.length) text(216, y - 14, '∅', colour, 23);
      var labels = [];
      row.intervals.forEach(function (interval) {
        var a = interval.lo == null ? domain[0] : Math.max(domain[0], interval.lo);
        var b = interval.hi == null ? domain[1] : Math.min(domain[1], interval.hi);
        if (b < domain[0] || a > domain[1] || b < a) return;
        line(px(a), y, px(b), y, colour, 4, 'iq-interval');
        [['lo', a, interval.loClosed, -1], ['hi', b, interval.hiClosed, 1]].forEach(function (edge) {
          var key = edge[0], real = interval[key], x = px(edge[1]);
          if (real == null || real < domain[0] || real > domain[1]) { arrow(x, y, edge[3], colour); return; }
          if (key === 'hi' && interval.lo === interval.hi) return;
          stage.appendChild(svg('circle', { cx: x, cy: y, r: 5, class: 'iq-endpoint', 'data-value': real,
            'data-closed': !!edge[2], stroke: colour, 'stroke-width': 2, fill: edge[2] ? colour : '#fdfcfb' }));
          var label = interval[key + 'Label'] || fmt(real);
          if (!labels.some(function (l) { return l.x === x; })) labels.push({ x: x, text: label });
        });
      });
      labels.forEach(function (l) { text(l.x, y + 26, l.text, colour, 15); });
    });
    for (var keyRow=0; keyRow<keyRows; keyRow++) {
      text(210, height - (keyRows-keyRow-1)*24 - 12, boundaryNames.slice(keyRow*2,keyRow*2+2).map(function(k) {return k+' ≈ '+fmt(boundaryKeys[k]);}).join('     '), COLOURS.muted, 14);
    }
  }
  function mount(host, original) {
    var choices = original.cases || [original], chosen = 0, at = 0;
    var outer = el('div', 'iq-host'); host.appendChild(outer);
    if (original.cases) {
      var picker = el('div', 'iq-cases'); picker.setAttribute('role', 'group'); picker.setAttribute('aria-label', 'Choose an example / 選擇例子');
      choices.forEach(function (c, i) {
        var b = button('iq-case', c.name.zh, c.name.en);
        b.onclick = function () { chosen = i; at = 0; render(); }; picker.appendChild(b);
      }); outer.appendChild(picker);
    }
    var wrap = el('div', 'cg cg-split iq-player'), stage = svg('svg', { class: 'cg-svg iq-svg', role: 'img' });
    wrap.appendChild(stage); var detail = el('div', 'cg-detail'); detail.setAttribute('aria-live', 'polite'); detail.setAttribute('aria-atomic', 'true');
    var progress = el('div', 'cg-progress'), say = el('div', 'cg-say'); detail.appendChild(progress); detail.appendChild(say); wrap.appendChild(detail);
    var nav = el('div', 'cg-navigation'), row = el('div', 'cg-row'); nav.appendChild(row);
    var back = button('cg-back', '← 上一步', 'Back'), next = button('cg-next btn-primary', '下一步 →', 'Next step'), restart = button('cg-restart', '重播', 'Restart');
    row.appendChild(back); row.appendChild(next); row.appendChild(restart); wrap.appendChild(nav); outer.appendChild(wrap);
    function render() {
      var spec = choices[chosen], steps = spec.steps || [], state = at ? steps[at - 1] : null;
      wrap.dataset.step = at; wrap.dataset.case = chosen;
      var view = Object.assign({}, spec.initial || {});
      for (var frame = 0; frame < at; frame++) Object.assign(view, steps[frame].view || {});
      draw(stage, spec, view);
      progress.replaceChildren(); bi(progress, at ? '第 ' + at + ' / ' + steps.length + ' 步' : '先看題目 · 共 ' + steps.length + ' 步', at ? 'Step ' + at + ' of ' + steps.length : 'Study the question · ' + steps.length + ' steps');
      say.replaceChildren();
      ['zh', 'en'].forEach(function (lang) {
        var n = el('div', 'cg-' + lang), caption = state ? state[lang] : (spec.intro || {})[lang] || '';
        n.appendChild(el('div', '', caption.replace(/\$[^$]*\$/g, '').replace(/[：:]\s*[。.]*$/, '')));
        if (state) (state.mathLines || []).forEach(function (formula) {
          var f = el('div', 'cg-equation'); f.dataset.formula = formula;
          if (global.katex) global.katex.render('\\displaystyle ' + formula, f, { throwOnError: false, strict: false }); else f.textContent = formula;
          n.appendChild(f);
        }); say.appendChild(n);
      });
      var reason = el('div', 'cg-ref', state ? state.ref || '' : ''); say.appendChild(reason);
      if (original.cases) Array.prototype.forEach.call(outer.querySelectorAll('.iq-case'), function (b, i) { b.setAttribute('aria-pressed', String(i === chosen)); });
      back.disabled = restart.disabled = at === 0; next.disabled = at === steps.length;
      next.replaceChildren(); bi(next, at === steps.length ? '完成' : '下一步 →', at === steps.length ? 'Done' : 'Next step');
    }
    back.onclick = function () { if (at) { at--; render(); } };
    next.onclick = function () { if (at < choices[chosen].steps.length) { at++; render(); } };
    restart.onclick = function () { at = 0; render(); }; render(); return wrap;
  }
  global.S5A_INEQUALITIES = { mount: mount };
  if (global.S5A_DEMO) global.S5A_DEMO.types.inequality = function (host, opts) { return mount(host, opts); };
})(window);
