/* Background track paths. */
window.__BGM_DATA = {
  menu: "assets/music/menu.mp3",
  easy: "assets/music/easy.mp3",
  normal: "assets/music/normal.mp3",
  hard: "assets/music/hard.mp3",
  extreme: "assets/music/extreme.mp3",
  drift: "assets/music/drift.mp3"
};

(function(){
'use strict';

/* ============================================================
   0. helpers
   ============================================================ */
var $ = function(s, r){ return (r || document).querySelector(s); };
var $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
var clamp = function(v, a, b){ return Math.max(a, Math.min(b, v)); };
var pad2 = function(n){ return (n < 10 ? '0' : '') + n; };
var randInt = function(n){ return Math.floor(Math.random() * n); };
var rgba = function(hex, a){
  var h = String(hex).replace('#', '');
  if(h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  var n = parseInt(h, 16);
  return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
};

var timers = [];
function later(ms, fn){
  var id = setTimeout(function(){
    timers = timers.filter(function(t){ return t !== id; });
    fn();
  }, ms);
  timers.push(id);
  return id;
}
function clearTimers(){
  timers.forEach(clearTimeout);
  timers = [];
}

var reduceMotion = false;
try {
  reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
} catch(e){}

var finePointer = false;
try {
  finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
} catch(e){}

/* ============================================================
   1. data
   ============================================================ */
var MODES = {
  easy:    { id:'easy',    name:'EASY',    cols:5,  rows:5,  tries:7, accent:'#39FF88', dim:'#17633D', glow:'rgba(57,255,136,.55)' },
  normal:  { id:'normal',  name:'NORMAL',  cols:7,  rows:7,  tries:6, accent:'#38BDF8', dim:'#175A78', glow:'rgba(56,189,248,.55)' },
  hard:    { id:'hard',    name:'HARD',    cols:9,  rows:9,  tries:5, accent:'#FF4D6D', dim:'#7E293D', glow:'rgba(255,77,109,.55)' },
  extreme: { id:'extreme', name:'EXTREME', cols:11, rows:11, tries:4, accent:'#C084FC', dim:'#5D3B82', glow:'rgba(192,132,252,.55)' },
  drift:   { id:'drift',   name:'DRIFT',   cols:13, rows:13, tries:10, time:90, accent:'#E7E3F2', dim:'#5A5668', glow:'rgba(231,227,242,.55)', drift:true }
};
var MODE_ORDER = ['easy','normal','hard','extreme'];
var DRIFT_ID = 'drift';
var DRIFT_UNLOCK_TRIES = 4;

/* ---------- i18n ---------- */
var I18N = {
  en: {
    build: 'DEDUCTION PROTOCOL <span class="hl">// 01</span>',
    tagline: 'TRIANGULATE THE SIGNAL. <span class="hl">FIND THE CELL.</span>',
    hint: 'CLICK TO SAMPLE &nbsp;•&nbsp; <span class="hl">DISTANCE = |DX| + |DY|</span>',
    keys: 'ARROWS MOVE &nbsp;•&nbsp; ENTER GUESS &nbsp;•&nbsp; M SFX &nbsp;•&nbsp; B BGM &nbsp;•&nbsp; R RESTART',
    howto: 'HOW TO PLAY',
    credits: 'CREDITS',
    audioBtn: 'AUDIO',
    audioTitle: 'AUDIO',
    audioEyebrow: 'SOUND MIXER',
    sfxVolLabel: 'SFX volume',
    bgmVolLabel: 'BGM volume',
    sfxOn: 'SFX ON',
    sfxOff: 'SFX OFF',
    bgmOn: 'BGM ON',
    bgmOff: 'BGM OFF',
    sfx: 'SFX',
    bgm: 'BGM',
    triesLeft: 'TRIES LEFT',
    best: 'BEST',
    logTitle: 'DISTANCE LOG',
    newest: 'NEWEST ↑',
    logFoot: 'D = <span class="hl">|DX| + |DY|</span>',
    restart: 'RESTART',
    modes: 'MODES',
    emptyLog: 'NO SAMPLES RECORDED',
    close: 'CLOSE',
    newBest: 'NEW BEST',
    playAgain: 'PLAY AGAIN',
    changeMode: 'CHANGE MODE',
    tryAgain: 'TRY AGAIN',
    target: 'TARGET',
    winEyebrow: 'SIGNAL CONFIRMED',
    winTitle: 'TARGET FOUND',
    loseEyebrow: 'ATTEMPTS DEPLETED',
    loseTitle: 'SIGNAL LOST',
    winSub: '<span class="hl">{u}</span> TRIES USED  ·  BEST <span class="hl-w">{b}</span>',
    loseSub: 'TARGET <span class="hl-c">{c}</span>',
    grid: 'GRID',
    tries: 'TRIES',
    'mode.easy': 'EASY',
    'mode.normal': 'NORMAL',
    'mode.hard': 'HARD',
    'mode.extreme': 'EXTREME',
    'mode.drift': 'DRIFT',
    driftLocked: 'SIGNAL LOCKED',
    driftEyebrow: 'THE LATTICE IS BREAKING',
    driftEyebrowRetry: 'THE DRIFTER RETURNS',
    driftTitle: 'DRIFT',
    driftRule: 'IT MOVES EVERY 5–10 SECONDS',
    driftUnlocked: 'SIGNAL UNLOCKED',
    driftStory:
      'Before the first map, there was the Lattice.\n' +
      'A cage of numbers, raised to hold the thing that would not die.\n' +
      'They called it the Drifter.\n' +
      'It has no body. Only a distance.\n\n' +
      'Last night, the ninth seal broke.\n' +
      'Every 5 to 10 seconds, it tears itself to another cell.\n\n' +
      'The old kingdom is going dark, one city at a time.\n' +
      'You are the last hunter of the Lattice.\n' +
      'Read the distances. Corner the ghost.\n' +
      'You have 90 seconds and 10 samples.\n' +
      'Do not let it leave the grid.',
    driftSkip: 'CLICK TO SKIP',
    driftBegin: 'CLICK TO BEGIN',
    driftHow: 'The Drifter moves every 5 to 10 seconds. Every reading updates. For the first three rounds it never comes within one step of a probe. You have 90 seconds and 10 tries. Press Enter to begin.',
    driftSoon: 'The Drifter is about to move.',
    timeLabel: 'TIME',
    driftLabel: 'DRIFT',
    secondsLeft: '{s} seconds remaining',
    winSubDrift: '<span class="hl">{u}</span> TRIES USED  ·  <span class="hl-w">{s}</span>s LEFT  ·  BEST <span class="hl-w">{b}</span>',
    driftWinEyebrow: 'THE LATTICE HOLDS',
    driftWinTitle: 'DRIFTER CAUGHT',
    timeEyebrow: 'TIME EXPIRED',
    timeTitle: 'THE DRIFTER ESCAPED',
    timeSub: 'THE GHOST WAS AT <span class="hl-c">{c}</span>',
    triesEyebrow: 'TRIES EXPIRED',
    triesTitle: 'THE DRIFTER ESCAPED',
    driftLoseSub: 'THE GHOST WAS AT <span class="hl-c">{c}</span>',
    sampleHint: 'SAMPLE {c} — TAP AGAIN TO GUESS',
    ariaUnrevealed: 'Row {y}, column {x}, unrevealed',
    ariaRevealed: 'Row {y}, column {x}, distance {d}, {t}',
    tempTarget: 'target',
    tempHot: 'very close',
    tempWarm: 'warm',
    tempCool: 'cool',
    tempCold: 'cold',
    annReveal: '{c} revealed. Distance {d}. {n} tries remaining.',
    annRepeat: 'Cell {c} already revealed. Distance {d}.',
    annDrift: 'Signal drift. The target moved; all readings updated.',
    annWin: 'Target found. {c}.'
  },
  zh: {
    build: '推理解碼協議 <span class="hl">// 01</span>',
    tagline: '三角定位訊號。 <span class="hl">找出目標格。</span>',
    hint: '點擊取樣 &nbsp;•&nbsp; <span class="hl">距離 = |DX| + |DY|</span>',
    keys: '方向鍵移動 &nbsp;•&nbsp; ENTER 猜測 &nbsp;•&nbsp; M 音效 &nbsp;•&nbsp; B 音樂 &nbsp;•&nbsp; R 重來',
    howto: '玩法說明',
    credits: '製作名單',
    audioBtn: '音訊',
    audioTitle: '音訊',
    audioEyebrow: '混音設定',
    sfxVolLabel: '音效音量',
    bgmVolLabel: '音樂音量',
    sfxOn: '音效開',
    sfxOff: '音效關',
    bgmOn: '音樂開',
    bgmOff: '音樂關',
    sfx: '音效',
    bgm: '音樂',
    triesLeft: '剩餘次數',
    best: '最佳',
    logTitle: '距離紀錄',
    newest: '最新 ↑',
    logFoot: 'D = <span class="hl">|DX| + |DY|</span>',
    restart: '重來',
    modes: '模式',
    emptyLog: '尚無取樣紀錄',
    close: '關閉',
    newBest: '最佳紀錄',
    playAgain: '再玩一次',
    changeMode: '切換模式',
    tryAgain: '再試一次',
    target: '目標',
    winEyebrow: '訊號確認',
    winTitle: '找到目標',
    loseEyebrow: '次數用盡',
    loseTitle: '訊號遺失',
    winSub: '使用 <span class="hl">{u}</span> 次  ·  最佳 <span class="hl-w">{b}</span>',
    loseSub: '目標 <span class="hl-c">{c}</span>',
    grid: '格',
    tries: '次',
    'mode.easy': '簡單',
    'mode.normal': '普通',
    'mode.hard': '困難',
    'mode.extreme': '極限',
    'mode.drift': '漂移',
    driftLocked: '訊號未解鎖',
    driftEyebrow: '方格牢籠正在崩解',
    driftEyebrowRetry: '漂移者歸來',
    driftTitle: '漂移',
    driftRule: '每隔 5–10 秒移動',
    driftUnlocked: '訊號解鎖',
    driftStory:
      '在第一張地圖之前，方格牢籠就已存在。\n' +
      '那是以數字砌成的囚籠，用來困住不願死去的東西。\n' +
      '他們叫它「漂移者」。\n' +
      '它沒有形體，只有一段距離。\n\n' +
      '昨夜，第九道封印裂開了。\n' +
      '每隔 5 到 10 秒，它就會撕開空間，滑到另一格。\n\n' +
      '古老的王國正一座座陷入黑暗。\n' +
      '你是方格牢籠最後的獵人。\n' +
      '讀出距離。困住鬼魂。\n' +
      '你有 90 秒和 10 次取樣。\n' +
      '別讓它離開方格。',
    driftSkip: '點擊跳過',
    driftBegin: '點擊開始',
    driftHow: '漂移者每隔 5 到 10 秒移動一次。每次移動，所有讀數都會更新。前三次猜測期間，牠不會靠近你的探測位置一步之內。你有 90 秒和 10 次機會。按 Enter 開始。',
    driftSoon: '漂移者即將移動。',
    timeLabel: '時間',
    driftLabel: '漂移',
    secondsLeft: '剩餘 {s} 秒',
    winSubDrift: '使用 <span class="hl">{u}</span> 次  ·  剩餘 <span class="hl-w">{s}</span> 秒  ·  最佳 <span class="hl-w">{b}</span>',
    driftWinEyebrow: '方格牢籠穩固',
    driftWinTitle: '鬼魂已困',
    timeEyebrow: '時間耗盡',
    timeTitle: '漂移者逃脫',
    timeSub: '鬼魂最後在 <span class="hl-c">{c}</span>',
    triesEyebrow: '次數耗盡',
    triesTitle: '漂移者逃脫',
    driftLoseSub: '鬼魂最後在 <span class="hl-c">{c}</span>',
    sampleHint: '取樣 {c} — 再點一次確認',
    ariaUnrevealed: '第 {y} 列，第 {x} 欄，未取樣',
    ariaRevealed: '第 {y} 列，第 {x} 欄，距離 {d}，{t}',
    tempTarget: '目標',
    tempHot: '非常接近',
    tempWarm: '接近',
    tempCool: '偏遠',
    tempCold: '很遠',
    annReveal: '{c} 已取樣。距離 {d}。剩餘 {n} 次。',
    annRepeat: '格子 {c} 已取樣，距離 {d}。',
    annDrift: '訊號漂移。目標已移動，所有讀數已更新。',
    annWin: '找到目標 {c}。'
  }
};

var lang = 'en';

function t(key){
  var table = I18N[lang] || I18N.en;
  return table[key] != null ? table[key] : (I18N.en[key] != null ? I18N.en[key] : key);
}
function fmt(str, vars){
  return String(str).replace(/\{(\w+)\}/g, function(m, k){
    return vars && vars[k] != null ? vars[k] : m;
  });
}
function modeLabel(m){
  return t('mode.' + m.id) + ' // ' + m.cols + '×' + m.rows;
}

/* 5x7 bitmap font, each row a 5-bit mask (bit 4 = leftmost) */
var FONT = {
  'A':[14,17,17,31,17,17,17], 'B':[30,17,17,30,17,17,30],
  'C':[14,17,16,16,16,17,14], 'D':[30,25,17,17,17,25,30],
  'E':[31,16,16,30,16,16,31], 'F':[31,16,16,30,16,16,16],
  'G':[14,17,16,23,17,17,14], 'H':[17,17,17,31,17,17,17],
  'I':[31,4,4,4,4,4,31],      'J':[7,2,2,2,2,18,12],
  'K':[17,18,20,24,20,18,17], 'L':[16,16,16,16,16,16,31],
  'M':[17,27,21,21,17,17,17], 'N':[17,25,21,19,17,17,17],
  'O':[14,17,17,17,17,17,14], 'P':[30,17,17,30,16,16,16],
  'Q':[14,17,17,17,21,18,13], 'R':[30,17,17,30,20,18,17],
  'S':[15,16,16,14,1,1,30],   'T':[31,4,4,4,4,4,4],
  'U':[17,17,17,17,17,17,14], 'V':[17,17,17,17,17,10,4],
  'W':[17,17,17,21,21,27,17], 'X':[17,17,10,4,10,17,17],
  'Y':[17,17,10,4,4,4,4],     'Z':[31,1,2,4,8,16,31],
  '0':[14,19,21,21,21,25,14], '1':[4,12,4,4,4,4,14],
  '2':[14,17,1,6,8,16,31],    '3':[30,1,1,14,1,1,30],
  '4':[2,6,10,18,31,2,2],     '5':[31,16,30,1,1,17,14],
  '6':[6,8,16,30,17,17,14],   '7':[31,1,2,4,8,8,8],
  '8':[14,17,17,14,17,17,14], '9':[14,17,17,15,1,2,12],
  ' ':[0,0,0,0,0,0,0],        '-':[0,0,0,31,0,0,0],
  '.':[0,0,0,0,0,12,12],      '/':[1,1,2,4,8,16,16],
  ':':[0,12,12,0,12,12,0],    '|':[4,4,4,4,4,4,4],
  '×':[0,17,10,4,10,17,0],    '!':[4,4,4,4,4,0,4]
};

function wordSVG(str){
  var chars = String(str).toUpperCase().split('');
  var w = chars.length * 6 - 1;
  var rects = '';
  chars.forEach(function(ch, i){
    var g = FONT[ch] || FONT[' '];
    for(var ry = 0; ry < 7; ry++){
      var row = g[ry];
      for(var cx = 0; cx < 5; cx++){
        if(row & (1 << (4 - cx))){
          rects += '<rect x="' + (i * 6 + cx) + '" y="' + ry + '" width="1" height="1"/>';
        }
      }
    }
  });
  return '<svg viewBox="0 0 ' + w + ' 7" shape-rendering="crispEdges" fill="currentColor" focusable="false" aria-hidden="true">' + rects + '</svg>';
}

function digitsSVG(str){
  var chars = String(str).split('');
  var w = chars.length * 6 - 1;
  var rects = '';
  chars.forEach(function(ch, i){
    var g = FONT[ch] || FONT['0'];
    for(var ry = 0; ry < 7; ry++){
      var row = g[ry];
      for(var cx = 0; cx < 5; cx++){
        if(row & (1 << (4 - cx))){
          rects += '<rect x="' + (i * 6 + cx) + '" y="' + ry + '" width="1" height="1"/>';
        }
      }
    }
  });
  return '<svg viewBox="0 0 ' + w + ' 7" shape-rendering="crispEdges" focusable="false" aria-hidden="true">' + rects + '</svg>';
}

/* ============================================================
   2. heat model
   ============================================================ */
function heatFor(d, cols, rows){
  if(d === 0) return 'var(--accent)';
  var r = d / (cols + rows - 2);
  if(r <= .12) return '#FFB020';
  if(r <= .25) return '#FF7849';
  if(r <= .40) return '#FF4D6D';
  if(r <= .55) return '#D946EF';
  if(r <= .70) return '#8B5CF6';
  if(r <= .85) return '#4D7CFE';
  return '#38BDF8';
}
function heatBand(d, cols, rows){
  if(d === 0) return 'win';
  var r = d / (cols + rows - 2);
  if(r <= .15) return 'hot';
  if(r <= .40) return 'warm';
  if(r <= .70) return 'cool';
  return 'cold';
}
function tempLabel(d, cols, rows){
  var b = heatBand(d, cols, rows);
  if(b === 'win') return t('tempTarget');
  if(b === 'hot') return t('tempHot');
  if(b === 'warm') return t('tempWarm');
  if(b === 'cool') return t('tempCool');
  return t('tempCold');
}

/* ============================================================
   3. storage
   ============================================================ */
var store = (function(){
  var mem = {};
  var ok = false;
  try {
    localStorage.setItem('gridlock.__probe', '1');
    localStorage.removeItem('gridlock.__probe');
    ok = true;
  } catch(e){ ok = false; }

  return {
    get: function(k, d){
      if(ok){
        try {
          var v = localStorage.getItem('gridlock.' + k);
          return v === null ? d : JSON.parse(v);
        } catch(e){}
      }
      return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : d;
    },
    set: function(k, v){
      mem[k] = v;
      if(!ok) return;
      try { localStorage.setItem('gridlock.' + k, JSON.stringify(v)); } catch(e){}
    }
  };
})();

lang = String(store.get('lang', 'en')) === 'zh' ? 'zh' : 'en';

/* ============================================================
   4. audio engine
   ============================================================ */
var Sfx = (function(){
  var ctx = null, master = null, comp = null, sfxBus = null, uiBus = null, noiseBuf = null;
  var muted = !!store.get('mute', false);
  var vol = clamp(store.get('sfxVol', 100) / 100, 0, 1);
  var voices = 0;

  function level(){ return muted ? 0 : .55 * vol; }

  function init(){
    if(ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return null;
    try { ctx = new AC({ latencyHint: 'interactive' }); } catch(e){ ctx = new AC(); }

    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.knee.value = 12; comp.ratio.value = 4;
    comp.attack.value = .003; comp.release.value = .18;

    master = ctx.createGain();
    master.gain.value = level();

    sfxBus = ctx.createGain(); sfxBus.gain.value = .8;
    uiBus  = ctx.createGain(); uiBus.gain.value = .55;

    sfxBus.connect(comp); uiBus.connect(comp);
    comp.connect(master); master.connect(ctx.destination);

    var len = Math.floor(ctx.sampleRate);
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    var data = noiseBuf.getChannelData(0);
    for(var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return ctx;
  }

  function unlock(){
    if(!init()) return;
    if(ctx.state === 'suspended'){ ctx.resume().catch(function(){}); }
  }

  function tone(o){
    if(!ctx || muted || voices > 16) return;
    var t0 = ctx.currentTime + (o.delay || 0) / 1000;
    var dur = Math.max(.02, (o.dur || 80) / 1000);
    var atk = Math.min(dur * .5, (o.attack == null ? 3 : o.attack) / 1000);
    var hold = Math.min((o.hold || 0) / 1000, Math.max(0, dur - atk - .015));
    var peak = o.gain == null ? .05 : o.gain;
    var f0 = Math.max(1, o.f0);
    var f1 = o.f1 == null ? null : Math.max(1, o.f1);

    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(f0, t0);
    if(f1 !== null){
      try { osc.frequency.exponentialRampToValueAtTime(f1, t0 + Math.max(.005, (o.sweep || o.dur || 80) / 1000)); }
      catch(e){ osc.frequency.setValueAtTime(f1, t0 + dur); }
    }

    var head = osc;
    if(o.filter){
      var bq = ctx.createBiquadFilter();
      bq.type = o.filter.type || 'lowpass';
      bq.frequency.value = o.filter.freq || 1200;
      bq.Q.value = o.filter.q == null ? 1 : o.filter.q;
      head.connect(bq); head = bq;
    }
    head.connect(g);
    g.connect(o.bus || sfxBus);

    g.gain.setValueAtTime(.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + atk);
    if(hold > 0) g.gain.setValueAtTime(peak, t0 + atk + hold);
    g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);

    osc.start(t0);
    osc.stop(t0 + dur + .03);
    voices++;
    osc.onended = function(){
      voices = Math.max(0, voices - 1);
      try { osc.disconnect(); g.disconnect(); } catch(e){}
    };
  }

  function noise(o){
    if(!ctx || muted || !noiseBuf || voices > 16) return;
    var t0 = ctx.currentTime + (o.delay || 0) / 1000;
    var dur = Math.max(.015, (o.dur || 40) / 1000);
    var atk = Math.min(dur * .5, (o.attack == null ? 1 : o.attack) / 1000);
    var peak = o.gain == null ? .01 : o.gain;

    var src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    var bq = ctx.createBiquadFilter();
    bq.type = (o.filter && o.filter.type) || 'highpass';
    bq.frequency.value = (o.filter && o.filter.freq) || 1200;
    bq.Q.value = (o.filter && o.filter.q == null) ? 1 : o.filter.q;
    var g = ctx.createGain();

    src.connect(bq); bq.connect(g); g.connect(o.bus || sfxBus);
    g.gain.setValueAtTime(.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + atk);
    g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);

    src.start(t0, Math.random() * .5);
    src.stop(t0 + dur + .02);
    voices++;
    src.onended = function(){
      voices = Math.max(0, voices - 1);
      try { src.disconnect(); bq.disconnect(); g.disconnect(); } catch(e){}
    };
  }

  var hoverAt = 0;
  function hover(){
    if(!finePointer) return;
    var now = Date.now();
    if(now - hoverAt < 45) return;
    hoverAt = now;
    tone({ type:'square', f0:1100, f1:900, dur:24, gain:.018, attack:2, bus:uiBus });
  }

  return {
    unlock: unlock,
    isMuted: function(){ return muted; },
    setMuted: function(m){
      muted = !!m;
      store.set('mute', muted);
      if(ctx && master){
        var t = ctx.currentTime;
        master.gain.cancelScheduledValues(t);
        master.gain.setValueAtTime(master.gain.value, t);
        master.gain.linearRampToValueAtTime(level(), t + .03);
      }
    },
    getVolume: function(){ return vol; },
    setVolume: function(v){
      vol = clamp(v, 0, 1);
      store.set('sfxVol', Math.round(vol * 100));
      if(ctx && master){
        var t = ctx.currentTime;
        master.gain.cancelScheduledValues(t);
        master.gain.setValueAtTime(master.gain.value, t);
        master.gain.linearRampToValueAtTime(level(), t + .03);
      }
    },
    toggle: function(){
      var next = !muted;
      if(!next) unlock();
      this.setMuted(next);
      if(!next){
        tone({ type:'square', f0:440, f1:880, dur:70, gain:.035, attack:2, bus:uiBus });
      }
      return next;
    },
    suspend: function(){ if(ctx && ctx.state === 'running') ctx.suspend().catch(function(){}); },
    resume: function(){ if(ctx && ctx.state === 'suspended' && !muted) ctx.resume().catch(function(){}); },

    press: function(){
      tone({ type:'square', f0:240, f1:160, dur:45, gain:.055, attack:2, bus:sfxBus });
      noise({ dur:12, gain:.012, filter:{ type:'highpass', freq:1200 } });
    },
    hover: hover,
    reveal: function(band){
      if(band === 'hot'){
        tone({ type:'square', f0:660, f1:1320, dur:110, gain:.06, attack:3, hold:55 });
        tone({ type:'triangle', f0:1320, f1:1760, dur:100, gain:.018, attack:3, delay:10 });
        noise({ dur:20, gain:.008, filter:{ type:'highpass', freq:3500 } });
      } else if(band === 'warm'){
        tone({ type:'square', f0:520, f1:780, dur:115, gain:.058, attack:3, hold:50 });
        tone({ type:'triangle', f0:1040, dur:80, gain:.014, attack:3, delay:30 });
      } else if(band === 'cool'){
        tone({ type:'square', f0:390, f1:440, dur:105, gain:.056, attack:3, hold:45 });
        noise({ dur:15, gain:.006, filter:{ type:'lowpass', freq:1800 } });
      } else {
        tone({ type:'triangle', f0:260, f1:190, dur:135, gain:.06, attack:4, hold:50 });
        tone({ type:'square', f0:130, dur:120, gain:.015, attack:4 });
        noise({ dur:25, gain:.008, filter:{ type:'lowpass', freq:900 } });
      }
    },
    invalid: function(){
      tone({ type:'square', f0:110, f1:95, dur:32, gain:.045, attack:2, bus:uiBus });
      tone({ type:'square', f0:110, f1:95, dur:32, gain:.045, attack:2, delay:66, bus:uiBus });
    },
    select: function(){
      tone({ type:'square', f0:440, f1:520, dur:38, gain:.025, attack:2, bus:uiBus });
    },
    drift: function(){
      tone({ type:'triangle', f0:740, f1:370, dur:140, gain:.022, attack:2, bus:uiBus });
      tone({ type:'square', f0:185, dur:80, gain:.012, attack:2, delay:25, bus:uiBus });
    },
    driftSoon: function(){
      tone({ type:'square', f0:880, dur:44, gain:.018, attack:2, bus:uiBus });
      tone({ type:'square', f0:660, dur:62, gain:.014, attack:2, delay:70, bus:uiBus });
    },
    type: function(){
      tone({ type:'square', f0:1380, f1:1230, dur:13, gain:.005, attack:1, bus:uiBus });
    },
    storyLine: function(){
      tone({ type:'triangle', f0:210, f1:150, dur:110, gain:.008, attack:2, bus:uiBus });
    },
    storyOpen: function(){
      noise({ dur:260, gain:.009, filter:{ type:'bandpass', freq:880, q:.7 } });
      tone({ type:'triangle', f0:98, f1:73, dur:320, gain:.012, attack:4, bus:uiBus });
    },
    modeSelect: function(){
      tone({ type:'square', f0:330, dur:55, gain:.045, attack:2, bus:uiBus });
      tone({ type:'square', f0:660, dur:85, gain:.045, attack:2, delay:55, bus:uiBus });
    },
    unlockLevel: function(){
      tone({ type:'triangle', f0:523.25, dur:110, gain:.022, attack:2, bus:uiBus });
      tone({ type:'triangle', f0:783.99, dur:150, gain:.021, attack:2, delay:90, bus:uiBus });
      tone({ type:'square', f0:1046.5, dur:220, gain:.018, attack:3, delay:200, bus:uiBus });
      tone({ type:'triangle', f0:1567.98, dur:360, gain:.014, attack:4, delay:300, bus:uiBus });
      noise({ dur:90, gain:.008, delay:300, filter:{ type:'bandpass', freq:2800, q:.9 } });
    },
    restart: function(){
      tone({ type:'triangle', f0:330, f1:220, dur:60, gain:.035, attack:2, bus:uiBus });
      tone({ type:'square', f0:440, dur:60, gain:.025, attack:2, delay:70, bus:uiBus });
    },
    win: function(){
      var arp = [[0,523.25,100],[90,659.25,100],[180,783.99,110],[270,1046.5,150]];
      arp.forEach(function(n){
        tone({ type:'square', f0:n[1], dur:n[2], gain:.052, attack:3, hold:n[2] * .55 });
        tone({ type:'triangle', f0:n[1] * 2, dur:n[2] * .8, gain:.014, attack:3, delay:n[0] });
      });
      [1046.5, 1318.51, 1567.98].forEach(function(f){
        tone({ type:'square', f0:f, dur:480, gain:.028, attack:5, hold:260, delay:420 });
      });
      tone({ type:'triangle', f0:2093, dur:400, gain:.016, attack:5, hold:200, delay:420 });
      noise({ dur:80, gain:.012, delay:420, filter:{ type:'bandpass', freq:2500, q:.8 } });
    },
    lose: function(){
      var notes = [[0,440],[130,329.63],[260,261.63]];
      notes.forEach(function(n){
        tone({ type:'square', f0:n[1], dur:110, gain:.042, attack:4, hold:55, delay:n[0] });
      });
      tone({
        type:'sawtooth', f0:220, f1:55, dur:500, gain:.048, attack:5, hold:60,
        delay:390, filter:{ type:'lowpass', freq:1100, q:1 }
      });
      noise({ dur:180, gain:.010, delay:390, filter:{ type:'bandpass', freq:700, q:.9 } });
    },
    best: function(){
      tone({ type:'triangle', f0:2093, dur:65, gain:.018, attack:2, bus:uiBus });
      tone({ type:'triangle', f0:2637, dur:65, gain:.018, attack:2, delay:55, bus:uiBus });
    }
  };
})();

/* ============================================================
   4b. background music
   ============================================================ */
var Bgm = (function(){
  var el = null;
  var ctx = null, gain = null, source = null;
  var muted = !!store.get('bgmMute', false);
  var vol = clamp(store.get('bgmVol', 100) / 100, 0, 1);
  var current = null;
  var ducked = false;

  /* Route the media element through a GainNode. iOS ignores writes to
     HTMLMediaElement.volume, so the mixer slider only works this way. */
  function audio(){
    if(el) return el;
    el = new Audio();
    el.loop = true;
    el.preload = 'auto';
    el.volume = 1;

    var AC = window.AudioContext || window.webkitAudioContext;
    /* A file:// media element can be treated as cross-origin by some
       browsers, which makes MediaElementSource output silence. Keep the
       plain element volume there; HTTP(S) pages use the gain graph. */
    if(AC && window.location.protocol !== 'file:'){
      try {
        ctx = new AC({ latencyHint: 'interactive' });
        source = ctx.createMediaElementSource(el);
        gain = ctx.createGain();
        gain.gain.value = targetVol();
        source.connect(gain);
        gain.connect(ctx.destination);
      } catch(e){
        ctx = null; gain = null; source = null;
        try { el.volume = targetVol(); } catch(err){}
      }
    }
    return el;
  }

  function targetVol(){
    if(muted) return 0;
    var base = .6 * vol;
    return ducked ? base * .33 : base;
  }

  function unlock(){
    if(ctx && ctx.state === 'suspended') ctx.resume().catch(function(){});
  }

  function apply(){
    if(gain && ctx){
      var t = ctx.currentTime;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.linearRampToValueAtTime(targetVol(), t + .04);
      return;
    }
    if(el){
      try { el.volume = targetVol(); } catch(e){}
    }
  }

  function play(track){
    var data = window.__BGM_DATA && window.__BGM_DATA[track];
    if(!data) return;
    var a = audio();
    unlock();
    if(current !== track){
      current = track;
      try { a.src = data; a.load(); } catch(e){}
    }
    apply();
    if(muted) return;
    var p = a.play();
    if(p && p.catch) p.catch(function(){});
  }

  function setMuted(m){
    muted = !!m;
    store.set('bgmMute', muted);
    apply();
    var a = audio();
    if(muted){
      a.pause();
    } else if(current){
      unlock();
      var p = a.play();
      if(p && p.catch) p.catch(function(){});
    }
  }

  return {
    play: play,
    isMuted: function(){ return muted; },
    setMuted: setMuted,
    toggle: function(){ setMuted(!muted); return !muted; },
    getVolume: function(){ return vol; },
    setVolume: function(v){ vol = clamp(v, 0, 1); store.set('bgmVol', Math.round(vol * 100)); apply(); },
    duck: function(on){ ducked = !!on; apply(); },
    pause: function(){ if(el) el.pause(); },
    resume: function(){
      if(el && !muted && current){
        unlock();
        var p = el.play();
        if(p && p.catch) p.catch(function(){});
      }
    }
  };
})();

/* ============================================================
   5. VFX engine (canvas)
   ============================================================ */
var FX = (function(){
  var canvas = $('#fx');
  var c2 = canvas.getContext('2d');
  var W = 0, H = 0, dpr = 1;
  var parts = [], rings = [];
  var running = false, lastT = 0;

  function resize(){
    var r = canvas.getBoundingClientRect();
    if(r.width < 1) return;
    W = r.width; H = r.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    c2.setTransform(dpr, 0, 0, dpr, 0, 0);
    c2.imageSmoothingEnabled = false;
  }

  function kick(){
    if(running) return;
    running = true;
    lastT = performance.now();
    requestAnimationFrame(frame);
  }

  function drawStepRing(cx, cy, rad, cut){
    var x0 = cx - rad, y0 = cy - rad, x1 = cx + rad, y1 = cy + rad;
    var h = Math.min(cut, rad * .45);
    var hh = h / 2;
    c2.beginPath();
    c2.moveTo(x0 + h, y0);
    c2.lineTo(x1 - h, y0);
    c2.lineTo(x1 - h, y0 + hh);
    c2.lineTo(x1 - hh, y0 + hh);
    c2.lineTo(x1 - hh, y0 + h);
    c2.lineTo(x1, y0 + h);
    c2.lineTo(x1, y1 - h);
    c2.lineTo(x1 - hh, y1 - h);
    c2.lineTo(x1 - hh, y1 - hh);
    c2.lineTo(x1 - h, y1 - hh);
    c2.lineTo(x1 - h, y1);
    c2.lineTo(x0 + h, y1);
    c2.lineTo(x0 + h, y1 - hh);
    c2.lineTo(x0 + hh, y1 - hh);
    c2.lineTo(x0 + hh, y1 - h);
    c2.lineTo(x0, y1 - h);
    c2.lineTo(x0, y0 + h);
    c2.lineTo(x0 + hh, y0 + h);
    c2.lineTo(x0 + hh, y0 + hh);
    c2.lineTo(x0 + h, y0 + hh);
    c2.closePath();
    c2.stroke();
  }

  function frame(t){
    var dt = Math.min(33, t - lastT) || 16;
    lastT = t;
    c2.clearRect(0, 0, W, H);

    var i, p, r;
    for(i = rings.length - 1; i >= 0; i--){
      r = rings[i];
      r.t += dt;
      var k = clamp(r.t / r.dur, 0, 1);
      var ease = 1 - Math.pow(1 - k, 3);
      var rad = r.r0 + (r.r1 - r.r0) * ease;
      var alpha = k < .3 ? (k / .3) : (1 - (k - .3) / .7);
      c2.save();
      c2.globalCompositeOperation = 'lighter';
      c2.strokeStyle = r.color;
      c2.shadowColor = r.color;
      c2.shadowBlur = 14;

      c2.globalAlpha = Math.max(0, alpha) * .6 * (r.alpha || 1);
      c2.lineWidth = r.width * 2.6;
      drawStepRing(r.x, r.y, rad, Math.max(3, rad * .18));

      c2.globalAlpha = Math.max(0, alpha) * (r.alpha || 1);
      c2.lineWidth = r.width;
      drawStepRing(r.x, r.y, rad, Math.max(3, rad * .18));
      c2.restore();
      if(k >= 1) rings.splice(i, 1);
    }

    for(i = parts.length - 1; i >= 0; i--){
      p = parts[i];
      p.t += dt;
      var life = p.t / p.life;
      if(life >= 1){ parts.splice(i, 1); continue; }
      if(p.drag) p.vx *= Math.pow(.985, dt / 16.67);
      p.vy += p.g * (dt / 1000);
      p.x += p.vx * (dt / 1000);
      p.y += p.vy * (dt / 1000);
      var a = p.fadeFrom ? Math.min(1, (1 - life) / p.fadeFrom) : (1 - life);
      var alpha = Math.max(0, Math.min(a, .95));
      var sz = Math.max(1, Math.round(p.size));
      var px = Math.round(p.x), py = Math.round(p.y);
      c2.save();
      c2.globalCompositeOperation = p.add ? 'lighter' : 'source-over';
      c2.fillStyle = p.color;
      if(p.add){
        c2.globalAlpha = alpha * .45;
        c2.fillRect(px - sz, py - sz, sz * 2, sz * 2);
      }
      c2.globalAlpha = alpha;
      c2.fillRect(px - (sz >> 1), py - (sz >> 1), sz, sz);
      c2.restore();
    }

    if(parts.length || rings.length){
      requestAnimationFrame(frame);
    } else {
      running = false;
      c2.clearRect(0, 0, W, H);
    }
  }

  function spawnBurst(r, band, color){
    if(reduceMotion) return;
    var mobile = W < 420;
    var cfg = {
      cold: { n: mobile ? 3 : 6,  minS: 1.6, maxS: 2.2, life: [180,260], spd: [20,45],   g: 40,  add: false },
      cool: { n: mobile ? 5 : 9,  minS: 2,   maxS: 3.2, life: [220,340], spd: [35,70],   g: 80,  add: true  },
      warm: { n: mobile ? 6 : 12, minS: 2,   maxS: 3.8, life: [280,440], spd: [50,95],   g: 90,  add: true  },
      hot:  { n: mobile ? 9 : 18, minS: 2,   maxS: 4.5, life: [300,480], spd: [60,120],  g: 100, add: true  },
      win:  { n: mobile ? 34 : 72, minS: 2,  maxS: 7,   life: [650,1050], spd: [90,250], g: 260, add: true  }
    }[band] || null;
    if(!cfg) return;

    for(var i = 0; i < cfg.n; i++){
      var ang = band === 'win'
        ? Math.random() * Math.PI * 2
        : Math.random() * Math.PI * 2;
      var sp = cfg.spd[0] + Math.random() * (cfg.spd[1] - cfg.spd[0]);
      var vx = Math.cos(ang) * sp;
      var vy = Math.sin(ang) * sp;
      if(band === 'win' && i % 10 < 3) vy = -Math.abs(vy);
      if(band === 'cold') vy = Math.abs(vy) * .6 + 12;

      var pal = band === 'win'
        ? [color, '#FFFFFF', '#FFB020']
        : [color, band === 'hot' ? '#FFB020' : color, '#FFFFFF'];

      parts.push({
        x: r.cx, y: r.cy,
        vx: vx, vy: vy,
        g: cfg.g,
        drag: true,
        size: cfg.minS + Math.random() * (cfg.maxS - cfg.minS),
        life: cfg.life[0] + Math.random() * (cfg.life[1] - cfg.life[0]),
        t: 0,
        color: pal[Math.floor(Math.random() * pal.length)],
        add: cfg.add,
        fadeFrom: band === 'win' ? .35 : 0
      });
    }
    kick();
  }

  function spawnRings(r, color, count, big, band){
    if(reduceMotion) return;
    var base = r.w;
    for(var i = 0; i < count; i++){
      rings.push({
        x: r.cx, y: r.cy,
        r0: base * (big ? .2 : .18),
        r1: base * (big ? 1.7 : .9),
        t: -i * 90,
        dur: big ? 600 : (band === 'hot' ? 380 : 320),
        color: color,
        width: big ? (5 - i) : 3,
        alpha: big ? 1 : .95
      });
    }
    kick();
  }

  function shatter(r, color){
    if(reduceMotion) return;
    var frags = W < 420 ? 10 : 18;
    for(var i = 0; i < frags; i++){
      var col = i % 3 === 0 ? '#FFFFFF' : color;
      parts.push({
        x: r.x + Math.random() * r.w,
        y: r.y + Math.random() * r.h,
        vx: -150 + Math.random() * 300,
        vy: -180 + Math.random() * 140,
        g: 500,
        drag: false,
        size: 3 + Math.random() * 4,
        life: 400 + Math.random() * 300,
        t: 0,
        color: col,
        add: false
      });
    }
    kick();
  }

  function clearAll(){
    parts.length = 0;
    rings.length = 0;
    c2.clearRect(0, 0, W, H);
    running = false;
  }

  window.addEventListener('resize', resize);
  return {
    resize: resize,
    burst: spawnBurst,
    rings: spawnRings,
    shatter: shatter,
    clearAll: clearAll
  };
})();

/* ============================================================
   6. DOM refs
   ============================================================ */
var screenMenu = $('#screen-menu');
var screenGame = $('#screen-game');
var game = screenGame;
var grid = $('#grid');
var stage = $('#boardStage');
var boardFrame = $('#boardFrame');
var boardShell = $('#boardShell');
var triesNum = $('#triesNum');
var pipsEl = $('#pips');
var bestNum = $('#bestNum');
var logList = $('#logList');
var modeChip = $('#modeChip');
var precisionHint = $('#precisionHint');
var live = $('#live');
var overlay = $('#overlay');
var ovEyebrow = $('#ovEyebrow');
var ovTitle = $('#ovTitle');
var ovSub = $('#ovSub');
var ovBest = $('#ovBest');
var ovPrimary = $('#ovPrimary');
var ovSecondary = $('#ovSecondary');
var infoOverlay = $('#infoOverlay');
var infoEyebrow = $('#infoEyebrow');
var infoTitle = $('#infoTitle');
var infoBody = $('#infoBody');
var infoClose = $('#infoClose');
var audioOverlay = $('#audioOverlay');
var audioClose = $('#audioClose');
var sfxVolEl = $('#sfxVol');
var bgmVolEl = $('#bgmVol');
var sfxValEl = $('#sfxVal');
var bgmValEl = $('#bgmVal');
var bossVeil = $('#bossVeil');
var bossEyebrow = $('#bossEyebrow');
var bossStory = $('#bossStory');
var bossStoryText = $('#bossStoryText');
var bossCursor = $('#bossCursor');
var bossSkip = $('#bossSkip');
var driftMeter = $('#driftMeter');
var driftTimeTrack = $('#driftTimeTrack');
var driftSignalTrack = $('#driftSignalTrack');
var driftTimeEl = $('#driftTime');
var driftWarnEl = $('#driftWarn');

/* ============================================================
   7. state
   ============================================================ */
var state = {
  mode: MODES.easy,
  cols: 5,
  rows: 5,
  tries: 7,
  triesLeft: 7,
  target: { x: 0, y: 0 },
  revealed: {},
  history: [],
  phase: 'menu',
  lock: false,
  buffered: null,
  selected: null,
  cellPx: 40,
  driftUnlockPending: false
};
var cells = [];

var DRIFT_MOVE_MIN = 5;
var DRIFT_MOVE_MAX = 10;
var DRIFT_SAFE_ROUNDS = 3;
var DRIFT_TIME_SEGS = 30;
var driftClock = {
  running: false,
  paused: false,
  deadline: 0,
  lastMoveAt: 0,
  nextMoveAt: 0,
  timeLeft: 0,
  resultTimeLeft: 0,
  signalCells: 0,
  pausedAt: 0,
  pauses: {},
  token: 0,
  warned: false
};
var driftStory = {
  active: false,
  typing: false,
  paused: false,
  text: '',
  i: 0,
  token: 0
};

/* ============================================================
   8. screen + menu
   ============================================================ */
function showScreen(name){
  screenMenu.classList.toggle('active', name === 'menu');
  screenGame.classList.toggle('active', name === 'game');
  if(name === 'menu'){
    stopDriftClock();
    stopDriftStory();
    clearTimers();
    FX.clearAll();
    if(bossVeil){ bossVeil.hidden = true; bossVeil.classList.remove('run'); }
    buildMenu();
    Bgm.play('menu');
    if(state.driftUnlockPending) later(320, playDriftUnlock);
  }
}

/* ============================================================
   8b. drift clock + story
   ============================================================ */
function driftMoveDelay(){
  return (DRIFT_MOVE_MIN + randInt(DRIFT_MOVE_MAX - DRIFT_MOVE_MIN + 1)) * 1000;
}

function buildDriftMeter(){
  if(!driftTimeTrack || driftTimeTrack.childElementCount) return;
  for(var i = 0; i < DRIFT_TIME_SEGS; i++){
    var s = document.createElement('i');
    s.className = 'drift-seg';
    driftTimeTrack.appendChild(s);
  }
}

function buildDriftSignal(seconds){
  var total = Math.max(1, Math.min(10, Math.ceil(seconds)));
  if(driftClock.signalCells === total && driftSignalTrack.childElementCount === total) return;
  driftClock.signalCells = total;
  driftSignalTrack.innerHTML = '';
  for(var i = 0; i < total; i++){
    var s = document.createElement('i');
    s.className = 'drift-seg';
    driftSignalTrack.appendChild(s);
  }
}

function setDriftSegments(track, on){
  if(!track) return;
  var segs = track.children;
  for(var i = 0; i < segs.length; i++){
    segs[i].className = 'drift-seg ' + (i < on ? 'on' : 'off');
  }
}

function renderDriftClock(ms){
  if(!driftTimeEl || !driftTimeTrack) return;
  var sec = Math.max(0, Math.ceil(ms / 1000));
  driftTimeEl.textContent = pad2(sec);
  var per = MODES[DRIFT_ID].time / DRIFT_TIME_SEGS;
  setDriftSegments(driftTimeTrack, Math.ceil(sec / per));
  driftMeter.classList.toggle('danger', sec <= 15);
  driftTimeTrack.setAttribute('aria-valuenow', String(sec));
  driftTimeTrack.setAttribute('aria-valuetext', fmt(t('secondsLeft'), { s: sec }));
}

function renderDriftSignal(now){
  if(!driftSignalTrack) return;
  var total = driftSignalTrack.childElementCount;
  if(!total) return;
  var span = Math.max(1, driftClock.nextMoveAt - driftClock.lastMoveAt);
  var remain = Math.max(0, driftClock.nextMoveAt - now);
  var frac = Math.max(0, Math.min(1, 1 - remain / span));
  setDriftSegments(driftSignalTrack, Math.ceil(frac * total));
  var incoming = remain <= 3000;
  driftSignalTrack.classList.toggle('danger', incoming);
  driftMeter.classList.toggle('incoming', incoming);
  driftWarnEl.classList.toggle('danger', incoming);
  driftWarnEl.textContent = remain > 0 ? String(Math.ceil(remain / 1000)) : '';
}

function driftTick(token){
  if(token !== driftClock.token) return;
  if(!driftClock.running || driftClock.paused) return;
  if(state.phase !== 'play' || state.mode.id !== DRIFT_ID) return;
  if(!screenGame.classList.contains('active')) return;

  var now = Date.now();
  var left = driftClock.deadline - now;
  driftClock.timeLeft = Math.max(0, left);
  renderDriftClock(driftClock.timeLeft);
  renderDriftSignal(now);

  if(left <= 0){
    loseByTime();
    return;
  }

  if(!driftClock.warned && driftClock.nextMoveAt - now <= 3000){
    driftClock.warned = true;
    Sfx.driftSoon();
    announce(t('driftSoon'));
  }

  if(now >= driftClock.nextMoveAt && !state.lock){
    moveDriftGhost(now);
  }

  later(100, function(){ driftTick(token); });
}

function moveDriftGhost(now){
  if(state.phase !== 'play' || state.mode.id !== DRIFT_ID) return;
  driftTeleport();
  refreshDriftReadings();
  driftClock.lastMoveAt = now;
  var nextDelay = driftMoveDelay();
  driftClock.nextMoveAt = now + nextDelay;
  driftClock.warned = false;
  buildDriftSignal(nextDelay / 1000);
  renderDriftSignal(now);
  Sfx.drift();
  announce(t('annDrift'));
  driftMeter.classList.remove('moved');
  void driftMeter.offsetWidth;
  driftMeter.classList.add('moved');
  later(520, function(){ driftMeter.classList.remove('moved'); });
}

function startDriftClock(){
  buildDriftMeter();
  driftClock.running = true;
  driftClock.paused = false;
  driftClock.token++;
  var now = Date.now();
  var firstDelay = driftMoveDelay();
  driftClock.deadline = now + MODES[DRIFT_ID].time * 1000;
  driftClock.lastMoveAt = now;
  driftClock.nextMoveAt = now + firstDelay;
  driftClock.timeLeft = MODES[DRIFT_ID].time * 1000;
  driftClock.resultTimeLeft = 0;
  driftClock.pausedAt = 0;
  driftClock.pauses = {};
  driftClock.warned = false;
  driftMeter.hidden = false;
  driftMeter.classList.remove('danger', 'incoming', 'moved');
  buildDriftSignal(firstDelay / 1000);
  renderDriftClock(driftClock.timeLeft);
  renderDriftSignal(now);
  driftTick(driftClock.token);
}

function pauseDriftClock(reason){
  if(!driftClock.running) return;
  driftClock.pauses[reason || 'ui'] = true;
  if(driftClock.paused) return;
  driftClock.paused = true;
  driftClock.pausedAt = Date.now();
  driftClock.token++;
}

function resumeDriftClock(reason){
  if(!driftClock.running) return;
  if(reason) delete driftClock.pauses[reason];
  for(var k in driftClock.pauses){
    if(driftClock.pauses[k]) return;
  }
  if(!driftClock.paused) return;
  var now = Date.now();
  var delta = now - driftClock.pausedAt;
  driftClock.deadline += delta;
  driftClock.nextMoveAt += delta;
  driftClock.pausedAt = 0;
  driftClock.paused = false;
  driftClock.token++;
  driftTick(driftClock.token);
}

function stopDriftClock(){
  driftClock.running = false;
  driftClock.paused = false;
  driftClock.pauses = {};
  driftClock.token++;
  driftClock.pausedAt = 0;
  if(driftMeter){
    driftMeter.hidden = true;
    driftMeter.classList.remove('danger', 'incoming', 'moved');
  }
  if(driftWarnEl) driftWarnEl.textContent = '';
}

function loseByTime(){
  if(state.phase !== 'play' || state.mode.id !== DRIFT_ID) return;
  driftClock.timeLeft = 0;
  stopDriftClock();
  state.phase = 'lose';
  state.lock = true;
  later(40, function(){ Sfx.lose(); });
  if(!reduceMotion){
    glitchBoard();
    shakeBoard(220);
  }
  later(180, function(){ markTarget(); });
  later(700, function(){ finishLose('time'); });
}

function completeDriftStory(){
  driftStory.typing = false;
  if(bossStoryText) bossStoryText.textContent = driftStory.text;
  if(bossCursor) bossCursor.hidden = true;
  if(bossSkip){
    bossSkip.textContent = t('driftBegin');
    bossSkip.classList.add('ready');
  }
}

function startDriftIntro(m){
  var seen = !!store.get('driftStorySeen', false);
  driftStory.active = true;
  driftStory.typing = false;
  driftStory.paused = false;
  driftStory.text = seen ? '' : t('driftStory');
  driftStory.i = 0;
  driftStory.token++;

  bossEyebrow.textContent = t(seen ? 'driftEyebrowRetry' : 'driftEyebrow');
  bossStory.hidden = seen;
  bossStoryText.textContent = '';
  bossCursor.hidden = true;
  bossSkip.textContent = t(seen ? 'driftBegin' : 'driftSkip');
  bossSkip.classList.toggle('ready', seen);

  bossVeil.hidden = false;
  bossVeil.classList.remove('run', 'closing');
  bossVeil.classList.add('story');
  void bossVeil.offsetWidth;

  if(!seen){
    Sfx.storyOpen();
    if(reduceMotion){
      completeDriftStory();
    } else {
      driftStory.typing = true;
      bossCursor.hidden = false;
      driftStoryTick(driftStory.token);
    }
  } else {
    completeDriftStory();
  }

  announce(t('driftHow'));
}

function driftStoryTick(token){
  if(token !== driftStory.token) return;
  if(!driftStory.active || driftStory.paused || !driftStory.typing) return;
  if(document.hidden){
    driftStory.paused = true;
    return;
  }
  if(driftStory.i >= driftStory.text.length){
    completeDriftStory();
    return;
  }

  var ch = driftStory.text.charAt(driftStory.i++);
  bossStoryText.textContent += ch;

  if(ch === '\n'){
    Sfx.storyLine();
  } else if(ch !== ' ' && driftStory.i % 2 === 0){
    Sfx.type();
  }

  later(ch === '\n' ? 140 : 22, function(){ driftStoryTick(token); });
}

function skipOrBeginDriftStory(){
  if(!driftStory.active) return;
  Sfx.select();
  if(driftStory.typing){
    completeDriftStory();
    return;
  }
  beginDriftRun();
}

function beginDriftRun(){
  if(state.phase !== 'intro' || !state.mode.drift) return;
  driftStory.active = false;
  driftStory.typing = false;
  driftStory.token++;
  store.set('driftStorySeen', true);

  bossVeil.classList.add('closing');
  bossVeil.classList.remove('story');

  later(430, function(){
    bossVeil.hidden = true;
    bossVeil.classList.remove('closing');
    if(state.phase !== 'intro' || !state.mode.drift) return;
    state.phase = 'play';
    state.lock = false;
    startDriftClock();
  });
}

function stopDriftStory(){
  driftStory.active = false;
  driftStory.typing = false;
  driftStory.token++;
  if(bossVeil){
    bossVeil.classList.remove('story', 'closing', 'run');
    bossVeil.hidden = true;
  }
}

function driftReady(){
  return MODE_ORDER.every(function(id){
    var best = store.get('best.' + id, null);
    return best != null && best <= DRIFT_UNLOCK_TRIES;
  });
}

function buildDriftCard(wrap){
  var m = MODES[DRIFT_ID];
  var unlocked = !!store.get('driftUnlocked', false);
  var locked = !unlocked || state.driftUnlockPending;
  var b = document.createElement('button');
  b.type = 'button';
  b.className = 'mode-card clip-lg mode-card-hidden mode-card-drift ' + (locked ? 'is-locked' : 'is-unlocked');
  b.setAttribute('data-mode', DRIFT_ID);
  b.style.setProperty('--card-accent', locked ? 'var(--line-strong)' : m.accent);
  b.style.setProperty('--card-glow', locked ? 'rgba(0,0,0,0)' : m.glow);
  b.style.setProperty('--card-fire', locked ? 'rgba(0,0,0,0)' : rgba(m.accent, .95));

  if(locked){
    b.setAttribute('aria-disabled', 'true');
    b.innerHTML =
      '<span class="mc-top"><span class="mc-name">???</span>' +
      '<span class="mc-idx">??</span></span>' +
      '<span class="mc-meta"><span>???</span><span>???</span></span>' +
      '<span class="mc-best">' + t('best') + ' <b>???</b></span>';
    b.addEventListener('click', function(){
      Sfx.unlock();
      Sfx.invalid();
      b.classList.remove('deny');
      void b.offsetWidth;
      b.classList.add('deny');
      announce(t('driftLocked'));
    });
  } else {
    var best = bestFor(DRIFT_ID, m.tries);
    b.innerHTML =
      '<span class="mc-top"><span class="mc-name">' + t('mode.' + DRIFT_ID) + '</span>' +
      '<span class="mc-idx">05</span></span>' +
      '<span class="mc-meta"><span>' + m.cols + ' × ' + m.rows + ' ' + t('grid') + '</span>' +
      '<span>' + m.tries + ' ' + t('tries') + ' · ' + m.time + 's</span></span>' +
      '<span class="mc-best">' + t('best') + ' <b>' + (best == null ? '—' : pad2(best)) + '</b></span>';
    b.addEventListener('click', function(){
      Sfx.unlock(); Sfx.modeSelect();
      startGame(DRIFT_ID);
    });
  }
  wrap.appendChild(b);
}

function playDriftUnlock(){
  var card = $('.mode-card-drift');
  if(!card){ state.driftUnlockPending = false; return; }
  if(reduceMotion){
    state.driftUnlockPending = false;
    store.set('driftUnlockSeen', true);
    buildMenu();
    return;
  }
  card.classList.add('unlocking');
  Sfx.unlockLevel();
  later(900, function(){
    state.driftUnlockPending = false;
    buildMenu();
    var c = $('.mode-card-drift');
    if(c) c.classList.add('just-unlocked');
    store.set('driftUnlockSeen', true);
    later(1000, function(){
      var x = $('.mode-card-drift');
      if(x) x.classList.remove('just-unlocked');
    });
  });
}

function buildMenu(){
  var logo = $('#logo');
  logo.innerHTML = wordSVG('GRIDLOCK');

  var wrap = $('#modeGrid');
  wrap.innerHTML = '';
  MODE_ORDER.forEach(function(id, i){
    var m = MODES[id];
    var best = bestFor(id, m.tries);
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'mode-card clip-lg mode-card-' + id;
    b.setAttribute('data-mode', id);
    b.style.setProperty('--card-accent', m.accent);
    b.style.setProperty('--card-glow', m.glow);
    b.style.setProperty('--card-fire', rgba(m.accent, .95));
    b.innerHTML =
      '<span class="mc-top"><span class="mc-name">' + t('mode.' + id) + '</span>' +
      '<span class="mc-idx">' + pad2(i + 1) + '</span></span>' +
      '<span class="mc-meta"><span>' + m.cols + ' × ' + m.rows + ' ' + t('grid') + '</span>' +
      '<span>' + m.tries + ' ' + t('tries') + '</span></span>' +
      '<span class="mc-best">' + t('best') + ' <b>' + (best == null ? '—' : pad2(best)) + '</b></span>';
    b.addEventListener('click', function(){
      Sfx.unlock(); Sfx.modeSelect();
      startGame(id);
    });
    wrap.appendChild(b);
  });
  buildDriftCard(wrap);
}

function refreshMenuBests(){
  MODE_ORDER.forEach(function(id){
    var card = $('.mode-card-' + id);
    if(!card) return;
    var best = bestFor(id, MODES[id].tries);
    var el = card.querySelector('.mc-best b');
    if(el) el.textContent = best == null ? '—' : pad2(best);
  });

  var driftCard = $('.mode-card-drift');
  if(driftCard && !driftCard.classList.contains('is-locked')){
    var driftBest = bestFor(DRIFT_ID, MODES[DRIFT_ID].tries);
    var driftEl = driftCard.querySelector('.mc-best b');
    if(driftEl) driftEl.textContent = driftBest == null ? '—' : pad2(driftBest);
  }
}

function refreshCellLabels(){
  cells.forEach(function(c){
    var x = +c.getAttribute('data-x');
    var y = +c.getAttribute('data-y');
    var d = state.revealed[key(x, y)];
    if(d === undefined){
      c.setAttribute('aria-label', fmt(t('ariaUnrevealed'), { y: y + 1, x: colLetter(x) }));
    } else {
      c.setAttribute('aria-label', fmt(t('ariaRevealed'), {
        y: y + 1, x: colLetter(x), d: d, t: tempLabel(d, state.cols, state.rows)
      }));
    }
  });
}

function applyLang(){
  document.documentElement.lang = (lang === 'zh') ? 'zh-Hant' : 'en';

  $$('[data-i18n]').forEach(function(el){
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  $$('[data-i18n-html]').forEach(function(el){
    el.innerHTML = t(el.getAttribute('data-i18n-html'));
  });
  $$('[data-i18n-aria]').forEach(function(el){
    el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
  });

  buildMenu();
  paintToggles();
  paintLangButtons();

  if(state.phase !== 'menu' && cells.length){
    modeChip.textContent = modeLabel(state.mode);
    refreshCellLabels();
    if(!logList.querySelector('.log-item')) renderLogEmpty();
  }
}

function toggleLang(){
  lang = (lang === 'zh') ? 'en' : 'zh';
  store.set('lang', lang);
  Sfx.unlock();
  Sfx.select();
  applyLang();
}

/* ============================================================
   9. game setup
   ============================================================ */
function key(x, y){ return x + ',' + y; }
function colLetter(x){ return String.fromCharCode(65 + x); }
function coordLabel(x, y){ return colLetter(x) + (y + 1); }

function startGame(modeId){
  if(modeId === DRIFT_ID && !store.get('driftUnlocked', false)) return;

  clearTimers();
  stopDriftClock();
  stopDriftStory();
  FX.clearAll();
  if(driftMeter) driftMeter.hidden = true;

  var m = MODES[modeId] || MODES.easy;
  state.mode = m;
  state.cols = m.cols;
  state.rows = m.rows;
  state.tries = m.tries;
  state.triesLeft = m.tries;
  state.target = { x: randInt(m.cols), y: randInt(m.rows) };
  state.revealed = {};
  state.history = [];
  state.phase = m.drift ? 'intro' : 'play';
  state.lock = !!m.drift;
  state.buffered = null;
  state.selected = null;

  game.style.setProperty('--accent', m.accent);
  game.style.setProperty('--accent-dim', m.dim);
  game.style.setProperty('--accent-glow', m.glow);
  game.style.setProperty('--accent-fire', rgba(m.accent, .95));
  document.body.style.setProperty('--accent', m.accent);
  document.body.style.setProperty('--accent-dim', m.dim);
  document.body.style.setProperty('--accent-glow', m.glow);
  document.body.style.setProperty('--accent-fire', rgba(m.accent, .95));

  modeChip.textContent = modeLabel(m);
  modeChip.style.color = m.accent;
  modeChip.style.boxShadow = 'inset 0 0 0 2px ' + m.dim;

  buildGrid();
  renderTries(false);
  renderBest();
  renderLogEmpty();
  hidePrecisionHint();

  boardFrame.classList.remove('shake', 'glitch');
  showScreen('game');
  Bgm.play(m.id);

  measureGrid();
  FX.resize();

  grid.classList.remove('enter');
  void grid.offsetWidth;
  grid.classList.add('enter');
  later(700, function(){ grid.classList.remove('enter'); });

  if(m.drift){
    startDriftIntro(m);
  }
}

function buildGrid(){
  grid.innerHTML = '';
  grid.style.setProperty('--cols', state.cols);
  cells = [];

  var maxD = state.cols + state.rows - 2;
  var maxDigits = String(maxD).length;

  for(var y = 0; y < state.rows; y++){
    for(var x = 0; x < state.cols; x++){
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'cell';
      b.setAttribute('data-x', x);
      b.setAttribute('data-y', y);
      b.setAttribute('aria-label', fmt(t('ariaUnrevealed'), { y: y + 1, x: colLetter(x) }));
      b.innerHTML = '<span class="num" data-len="' + maxDigits + '"></span>';
      b.style.setProperty('--d', Math.min(180, (x + y) * 6) + 'ms');
      b.tabIndex = (x === 0 && y === 0) ? 0 : -1;

      b.addEventListener('click', onCellClick);
      b.addEventListener('pointerdown', onCellDown);
      b.addEventListener('pointerup', onCellUp);
      b.addEventListener('pointerleave', onCellUp);
      b.addEventListener('pointerover', onCellOver);

      grid.appendChild(b);
      cells.push(b);
    }
  }
  measureGrid();
}

var measureRO = null;
function measureGrid(){
  var w = grid.getBoundingClientRect().width;
  if(w < 1) return;
  var gap = parseFloat(getComputedStyle(grid).gap) || 3;
  var cell = (w - gap * (state.cols - 1)) / state.cols;
  state.cellPx = cell;
  grid.style.setProperty('--cellpx', cell + 'px');
}
if(typeof ResizeObserver !== 'undefined'){
  measureRO = new ResizeObserver(function(){ measureGrid(); });
  measureRO.observe(grid);
  var fxRO = new ResizeObserver(function(){ FX.resize(); });
  fxRO.observe(stage);
}

function cellAt(x, y){
  return cells[y * state.cols + x] || null;
}

function cellRect(btn){
  var r = btn.getBoundingClientRect();
  var s = stage.getBoundingClientRect();
  return {
    x: r.left - s.left,
    y: r.top - s.top,
    w: r.width,
    h: r.height,
    cx: r.left - s.left + r.width / 2,
    cy: r.top - s.top + r.height / 2
  };
}

/* ============================================================
   10. hud
   ============================================================ */
function renderTries(pulse){
  triesNum.textContent = String(state.triesLeft);
  triesNum.classList.toggle('warn', state.triesLeft <= 3 && state.triesLeft > 1);
  triesNum.classList.toggle('danger', state.triesLeft <= 1);

  if(pulse){
    triesNum.classList.remove('tick', 'boom');
    void triesNum.offsetWidth;
    triesNum.classList.add(state.triesLeft <= 1 ? 'boom' : 'tick');
  }

  pipsEl.innerHTML = '';
  for(var i = 0; i < state.tries; i++){
    var p = document.createElement('span');
    p.className = 'pip ' + (i < state.triesLeft ? 'on' : 'spent');
    pipsEl.appendChild(p);
  }
}

function bestFor(id, tries){
  var b = store.get('best.' + id, null);
  return (b != null && b <= tries) ? b : null;
}

function renderBest(){
  var b = bestFor(state.mode.id, state.tries);
  bestNum.textContent = b == null ? '—' : pad2(b);
}

function renderLogEmpty(){
  logList.innerHTML = '<li class="log-empty">' + t('emptyLog') + '</li>';
}

function addLog(d, x, y, isWin){
  var empty = logList.querySelector('.log-empty');
  if(empty) empty.remove();

  var li = document.createElement('li');
  li.className = 'log-item' + (isWin ? ' win' : '');
  li.setAttribute('data-guess', String(state.history.length));
  li.style.setProperty('--heat', heatFor(d, state.cols, state.rows));
  li.innerHTML =
    '<span class="li-idx">' + pad2(state.history.length) + '</span>' +
    '<span class="li-coord">' + coordLabel(x, y) + '</span>' +
    '<span class="li-d"><i>D=</i><b>' + pad2(d) + '</b></span>';
  logList.prepend(li);
  logList.scrollTop = 0;
}

function announce(text){
  live.textContent = '';
  later(30, function(){ live.textContent = text; });
}

/* ============================================================
   11. interaction
   ============================================================ */
function onCellDown(e){
  var b = e.currentTarget;
  if(state.phase !== 'play') return;
  Sfx.unlock();
  b.classList.add('pressing');
}

function onCellUp(e){
  e.currentTarget.classList.remove('pressing');
}

function onCellOver(e){
  if(!finePointer) return;
  if(state.phase !== 'play') return;
  var b = e.currentTarget;
  if(!b.classList.contains('revealed')) Sfx.hover();
}

function onCellClick(e){
  var b = e.currentTarget;
  var x = +b.getAttribute('data-x');
  var y = +b.getAttribute('data-y');
  Sfx.unlock();
  activate(x, y, b);
}

function needsPrecision(){
  return !finePointer && state.cellPx < 28;
}

function activate(x, y, b){
  if(state.phase !== 'play') return;

  if(needsPrecision()){
    if(!state.selected || state.selected.x !== x || state.selected.y !== y){
      setSelected(x, y);
      Sfx.select();
      showPrecisionHint(x, y);
      return;
    }
    setSelected(null);
    hidePrecisionHint();
  }

  guess(x, y);
}

function setSelected(x, y){
  cells.forEach(function(c){ c.classList.remove('selected'); });
  state.selected = { x: x, y: y };
  var b = cellAt(x, y);
  if(b) b.classList.add('selected');
}

function showPrecisionHint(x, y){
  precisionHint.hidden = false;
  precisionHint.textContent = fmt(t('sampleHint'), { c: coordLabel(x, y) });
}
function hidePrecisionHint(){
  precisionHint.hidden = true;
  precisionHint.textContent = '';
}

function guess(x, y){
  if(state.phase !== 'play') return;

  var k = key(x, y);
  if(state.revealed[k] !== undefined){
    reject(x, y);
    return;
  }

  if(state.lock){
    if(state.buffered && state.buffered.x === x && state.buffered.y === y) return;
    state.buffered = { x: x, y: y };
    var qb = cellAt(x, y);
    if(qb) qb.classList.add('queued');
    return;
  }

  commitGuess(x, y);
}

function reject(x, y){
  var b = cellAt(x, y);
  Sfx.invalid();
  if(!b) return;
  b.classList.remove('reject');
  void b.offsetWidth;
  b.classList.add('reject');
  later(200, function(){ b.classList.remove('reject'); });

  var d = state.revealed[key(x, y)];
  announce(fmt(t('annRepeat'), { c: coordLabel(x, y), d: d }));
}

/* ============================================================
   12. guess resolution
   ============================================================ */
function driftTeleport(){
  var guarded = state.history.length < DRIFT_SAFE_ROUNDS;
  var blocked = {};
  Object.keys(state.revealed).forEach(function(k){
    var p = k.split(',');
    var gx = +p[0], gy = +p[1];
    blocked[key(gx, gy)] = 1;
    if(!guarded) return;
    for(var oy = -1; oy <= 1; oy++){
      for(var ox = -1; ox <= 1; ox++){
        var nx = gx + ox, ny = gy + oy;
        if(nx >= 0 && nx < state.cols && ny >= 0 && ny < state.rows){
          blocked[key(nx, ny)] = 1;
        }
      }
    }
  });

  var options = [];
  for(var y = 0; y < state.rows; y++){
    for(var x = 0; x < state.cols; x++){
      if(blocked[key(x, y)]) continue;
      if(x === state.target.x && y === state.target.y) continue;
      options.push({ x: x, y: y });
    }
  }

  if(!options.length){
    for(var fy = 0; fy < state.rows; fy++){
      for(var fx = 0; fx < state.cols; fx++){
        if(state.revealed[key(fx, fy)] !== undefined) continue;
        if(fx === state.target.x && fy === state.target.y) continue;
        options.push({ x: fx, y: fy });
      }
    }
  }

  if(options.length){
    var changed = options.filter(function(p){
      var ks = Object.keys(state.revealed);
      for(var i = 0; i < ks.length; i++){
        var parts = ks[i].split(',');
        var gx = +parts[0], gy = +parts[1];
        if(Math.abs(p.x - gx) + Math.abs(p.y - gy) === state.revealed[ks[i]]) return false;
      }
      return true;
    });
    if(changed.length) options = changed;
  }

  var pick = options.length ? options[randInt(options.length)] : null;
  if(pick){
    state.target = { x: pick.x, y: pick.y };
  }
}

function updateDriftCell(btn, d){
  btn.style.setProperty('--heat', heatFor(d, state.cols, state.rows));

  var num = btn.querySelector('.num');
  if(num){
    num.setAttribute('data-len', String(d).length);
    num.innerHTML = digitsSVG(String(d));
    num.classList.remove('pop');
    void num.offsetWidth;
    num.classList.add('pop');
  }

  btn.classList.remove('drifted');
  void btn.offsetWidth;
  btn.classList.add('drifted');
}

function refreshDriftReadings(){
  state.history.forEach(function(h, i){
    var nd = Math.abs(h.x - state.target.x) + Math.abs(h.y - state.target.y);
    h.d = nd;
    state.revealed[key(h.x, h.y)] = nd;

    var btn = cellAt(h.x, h.y);
    if(btn) updateDriftCell(btn, nd);

    var li = logList.querySelector('.log-item[data-guess="' + (i + 1) + '"]');
    if(li){
      li.style.setProperty('--heat', heatFor(nd, state.cols, state.rows));
      var b = li.querySelector('.li-d b');
      if(b) b.textContent = pad2(nd);
      li.classList.remove('drifted');
      void li.offsetWidth;
      li.classList.add('drifted');
    }
  });

  refreshCellLabels();
}

function commitGuess(x, y){
  var m = state.mode;
  var k = key(x, y);
  var d = Math.abs(x - state.target.x) + Math.abs(y - state.target.y);

  state.lock = true;
  state.triesLeft = Math.max(0, state.triesLeft - 1);
  state.revealed[k] = d;
  state.history.push({ x: x, y: y, d: d });

  var btn = cellAt(x, y);
  renderTries(true);
  Sfx.press();
  if(btn){
    btn.classList.add('pressing');
    later(60, function(){ btn.classList.remove('pressing'); });
  }
  setSelected(null);
  hidePrecisionHint();

  if(d === 0){
    resolveWin(btn, x, y);
    return;
  }

  resolveDistance(btn, x, y, d);

  if(state.triesLeft <= 0){
    if(m.drift) stopDriftClock();
    state.phase = 'lose';
    later(120, function(){
      if(!reduceMotion){
        glitchBoard();
        shakeBoard(220);
      }
      Sfx.lose();
    });
    later(160, function(){
      if(btn) FX.shatter(cellRect(btn), heatFor(d, state.cols, state.rows));
    });
    later(480, function(){ markTarget(); });
    later(860, function(){ finishLose('tries'); });
  }
}

function resolveDistance(btn, x, y, d, lockDelay){
  var heat = heatFor(d, state.cols, state.rows);
  var band = heatBand(d, state.cols, state.rows);

  later(40, function(){ Sfx.reveal(band); });

  later(50, function(){
    if(btn) paintCell(btn, x, y, d, false);

    addLog(d, x, y, false);

    if(btn){
      var r = cellRect(btn);
      FX.rings(r, heat, band === 'hot' ? 2 : 1, false, band);
      FX.burst(r, band, heat);
      if(band === 'hot' && !reduceMotion){
        btn.classList.add('pulse');
        later(760, function(){ btn.classList.remove('pulse'); });
      }
    }
    announce(fmt(t('annReveal'), { c: coordLabel(x, y), d: d, n: state.triesLeft }));
  });

  later(lockDelay || 220, releaseLock);
}

function releaseLock(){
  state.lock = false;
  if(state.phase !== 'play') return;
  var b = state.buffered;
  state.buffered = null;
  if(!b){
    var q = grid.querySelector('.cell.queued');
    if(q) q.classList.remove('queued');
    return;
  }
  var qb = cellAt(b.x, b.y);
  if(qb) qb.classList.remove('queued');
  if(state.revealed[key(b.x, b.y)] === undefined) commitGuess(b.x, b.y);
}

function paintCell(btn, x, y, d, isWin){
  var heat = isWin ? 'var(--accent)' : heatFor(d, state.cols, state.rows);
  btn.style.setProperty('--heat', heat);
  btn.classList.add('revealed');
  if(isWin) btn.classList.add('win');

  cells.forEach(function(c){ c.classList.remove('latest'); });
  btn.classList.add('latest');

  var num = btn.querySelector('.num');
  if(num){
    num.setAttribute('data-len', String(d).length);
    num.innerHTML = digitsSVG(String(d));
    num.classList.remove('pop');
    void num.offsetWidth;
    num.classList.add('pop');
  }

  btn.setAttribute('aria-label',
    fmt(t('ariaRevealed'), {
      y: y + 1, x: colLetter(x), d: d,
      t: tempLabel(d, state.cols, state.rows)
    }));
}

/* ============================================================
   13. win / lose
   ============================================================ */
function resolveWin(btn, x, y){
  state.phase = 'win';

  if(state.mode.drift){
    driftClock.timeLeft = Math.max(0, driftClock.deadline - Date.now());
    driftClock.resultTimeLeft = Math.ceil(driftClock.timeLeft / 1000);
    stopDriftClock();
  }

  later(40, function(){ Sfx.win(); });

  later(60, function(){
    if(btn){
      paintCell(btn, x, y, 0, true);
      var r = cellRect(btn);
      FX.rings(r, state.mode.accent, 3, true);
      FX.burst(r, 'win', state.mode.accent);
    }
    addLog(0, x, y, true);
  });

  later(100, function(){
    if(!reduceMotion){
      shakeBoard(160);
      illuminationWave();
    }
  });

  later(700, function(){ finishWin(); });

  announce(fmt(t('annWin'), { c: coordLabel(x, y) }));
}

function illuminationWave(){
  if(reduceMotion) return;
  var t = state.target;
  cells.forEach(function(c){
    var x = +c.getAttribute('data-x');
    var y = +c.getAttribute('data-y');
    var dist = Math.abs(x - t.x) + Math.abs(y - t.y);
    c.style.setProperty('--lit-delay', Math.min(240, dist * 12) + 'ms');
    c.classList.add('lit');
  });
  later(900, function(){
    cells.forEach(function(c){ c.classList.remove('lit'); });
  });
}

function markTarget(){
  var b = cellAt(state.target.x, state.target.y);
  if(!b) return;
  b.classList.add('target');
  var r = cellRect(b);
  FX.rings(r, '#FF4D6D', 2, false, 'cool');
}

function finishWin(){
  var m = state.mode;
  var used = m.tries - state.triesLeft;
  var prev = store.get('best.' + m.id, null);
  var isBest = (prev == null || used < prev);
  if(isBest) store.set('best.' + m.id, used);

  if(m.id !== DRIFT_ID && driftReady() && !store.get('driftUnlocked', false)){
    store.set('driftUnlocked', true);
    store.set('driftUnlockSeen', false);
    state.driftUnlockPending = true;
  }

  renderBest();
  refreshMenuBests();

  showResult('win', {
    used: used,
    best: store.get('best.' + m.id, null),
    isBest: isBest,
    timeLeft: driftClock.resultTimeLeft
  });

  if(isBest) later(160, function(){ Sfx.best(); });
}

function finishLose(reason){
  showResult('lose', { reason: reason || 'tries' });
}

function showResult(kind, data){
  overlay.classList.toggle('lose', kind === 'lose');
  overlay.hidden = false;
  overlay.setAttribute('aria-hidden', 'false');
  void overlay.offsetWidth;
  overlay.classList.add('show');
  Bgm.duck(true);

  if(kind === 'win'){
    var driftWin = state.mode.drift;
    ovEyebrow.textContent = t(driftWin ? 'driftWinEyebrow' : 'winEyebrow');
    ovTitle.textContent = t(driftWin ? 'driftWinTitle' : 'winTitle');
    ovSub.innerHTML = driftWin
      ? fmt(t('winSubDrift'), { u: data.used, s: data.timeLeft || 0, b: pad2(data.best) })
      : fmt(t('winSub'), { u: data.used, b: pad2(data.best) });
    ovBest.hidden = !data.isBest;
    ovPrimary.textContent = t('playAgain');
  } else {
    var driftLose = state.mode.drift;
    var reason = data.reason || 'tries';
    var c = coordLabel(state.target.x, state.target.y);
    if(driftLose && reason === 'time'){
      ovEyebrow.textContent = t('timeEyebrow');
      ovTitle.textContent = t('timeTitle');
      ovSub.innerHTML = fmt(t('timeSub'), { c: c });
    } else if(driftLose){
      ovEyebrow.textContent = t('triesEyebrow');
      ovTitle.textContent = t('triesTitle');
      ovSub.innerHTML = fmt(t('driftLoseSub'), { c: c });
    } else {
      ovEyebrow.textContent = t('loseEyebrow');
      ovTitle.textContent = t('loseTitle');
      ovSub.innerHTML = fmt(t('loseSub'), { c: c });
    }
    ovBest.hidden = true;
    ovPrimary.textContent = t('tryAgain');
  }
  ovSecondary.textContent = t('changeMode');

  later(60, function(){ ovPrimary.focus(); });
}

function closeResult(){
  overlay.classList.remove('show');
  overlay.hidden = true;
  overlay.setAttribute('aria-hidden', 'true');
  Bgm.duck(false);
}

/* ============================================================
   14. board effects
   ============================================================ */
function shakeBoard(ms){
  if(reduceMotion) return;
  boardFrame.classList.remove('shake');
  void boardFrame.offsetWidth;
  boardFrame.classList.add('shake');
  later(ms + 20, function(){ boardFrame.classList.remove('shake'); });
}

function glitchBoard(){
  if(reduceMotion) return;
  boardFrame.classList.remove('glitch');
  void boardFrame.offsetWidth;
  boardFrame.classList.add('glitch');
  later(180, function(){ boardFrame.classList.remove('glitch'); });
}

/* ============================================================
   15. keyboard
   ============================================================ */
function focusCell(x, y){
  x = clamp(x, 0, state.cols - 1);
  y = clamp(y, 0, state.rows - 1);
  var b = cellAt(x, y);
  if(!b) return;
  cells.forEach(function(c){ c.tabIndex = -1; });
  b.tabIndex = 0;
  b.focus();
}

grid.addEventListener('keydown', function(e){
  var b = e.target.closest ? e.target.closest('.cell') : null;
  if(!b) return;
  var x = +b.getAttribute('data-x');
  var y = +b.getAttribute('data-y');

  var moves = {
    ArrowLeft: [-1, 0], ArrowRight: [1, 0],
    ArrowUp: [0, -1], ArrowDown: [0, 1]
  };

  if(moves[e.key]){
    e.preventDefault();
    focusCell(x + moves[e.key][0], y + moves[e.key][1]);
  } else if(e.key === 'Home'){
    e.preventDefault();
    focusCell(e.ctrlKey ? 0 : 0, e.ctrlKey ? 0 : y);
  } else if(e.key === 'End'){
    e.preventDefault();
    focusCell(e.ctrlKey ? state.cols - 1 : state.cols - 1, e.ctrlKey ? state.rows - 1 : y);
  } else if(e.key === 'Enter' || e.key === ' '){
    e.preventDefault();
    activate(x, y, b);
  }
});

document.addEventListener('keydown', function(e){
  if(state.phase === 'intro' && state.mode.drift &&
    (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape')){
    e.preventDefault();
    skipOrBeginDriftStory();
    return;
  }
  if(e.key === 'm' || e.key === 'M'){
    if(e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    toggleSound();
  }
  if(e.key === 'b' || e.key === 'B'){
    if(e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    toggleBgm();
  }
  if(e.key === 'r' || e.key === 'R'){
    if(e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if(state.phase === 'play' && screenGame.classList.contains('active')){
      Sfx.restart();
      startGame(state.mode.id);
    }
  }
  if(e.key === 'Escape'){
    if(!infoOverlay.hidden) closeInfo();
    if(!audioOverlay.hidden) closeAudio();
  }
  if(e.key === 'Tab' && !overlay.hidden){
    trapFocus(e, overlay);
  }
  if(e.key === 'Tab' && !infoOverlay.hidden){
    trapFocus(e, infoOverlay);
  }
  if(e.key === 'Tab' && !audioOverlay.hidden){
    trapFocus(e, audioOverlay);
  }
});

function trapFocus(e, root){
  var f = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', root)
    .filter(function(el){ return !el.disabled && el.offsetParent !== null; });
  if(!f.length) return;
  var first = f[0], last = f[f.length - 1];
  if(e.shiftKey && document.activeElement === first){
    e.preventDefault(); last.focus();
  } else if(!e.shiftKey && document.activeElement === last){
    e.preventDefault(); first.focus();
  }
}

/* ============================================================
   16. sound toggle
   ============================================================ */
function paintToggles(){
  var sfxMuted = Sfx.isMuted();
  $$('.sfx-toggle').forEach(function(b){
    b.textContent = sfxMuted ? t('sfxOff') : t('sfxOn');
    b.setAttribute('aria-pressed', String(!sfxMuted));
    b.style.color = sfxMuted ? 'var(--faint)' : '';
  });
  var bgmMuted = Bgm.isMuted();
  $$('.bgm-toggle').forEach(function(b){
    b.textContent = bgmMuted ? t('bgmOff') : t('bgmOn');
    b.setAttribute('aria-pressed', String(!bgmMuted));
    b.style.color = bgmMuted ? 'var(--faint)' : '';
  });
}

function paintLangButtons(){
  $$('.lang-btn').forEach(function(b){
    $$('span[data-lang]', b).forEach(function(s){
      s.classList.toggle('lang-on', s.getAttribute('data-lang') === lang);
    });
    b.setAttribute('aria-label', lang === 'zh' ? '切換語言' : 'Switch language');
  });
}

function toggleSound(){
  Sfx.unlock();
  Sfx.toggle();
  paintToggles();
}

function toggleBgm(){
  Bgm.toggle();
  paintToggles();
}

/* ============================================================
   17. info dialogs
   ============================================================ */
function miniGridHTML(){
  var out = '<div class="mini-grid" aria-hidden="true">';
  for(var y = 0; y < 5; y++){
    for(var x = 0; x < 5; x++){
      var d = Math.abs(x - 2) + Math.abs(y - 2);
      out += '<span class="mini-cell' + (d === 0 ? ' t' : '') + '">' +
             (d === 0 ? '★' : d) + '</span>';
    }
  }
  return out + '</div>';
}

var INFO = {
  en: {
    how: {
      eyebrow: 'FIELD MANUAL',
      title: 'HOW TO PLAY',
      html:
        '<p>One cell hides the target. Click a cell to take a <strong class="hl">sample</strong>. ' +
        'The number you get back is the <strong class="hl">Manhattan distance</strong> — the fewest ' +
        'up/down and left/right steps from that cell to the target.</p>' +
        '<p>This sample grid shows every distance to the centre cell:</p>' +
        '{{GRID}}' +
        '<h3>READ THE NUMBERS</h3>' +
        '<p>A <b class="hl-g">0</b> means you hit it. <b class="hl-b">1</b> means the target is ' +
        'directly adjacent. <b class="hl-c">4</b> could be four steps away in any direction — ' +
        'combine two samples and you can pin it down exactly.</p>' +
        '<h3>RUN OUT OF TRIES AND IT IS OVER</h3>' +
        '<p>Each mode gives you a different grid and a different number of samples. ' +
        'Your <b class="hl-w">best result</b> (fewest tries used) is saved per mode.</p>' +
        '<h3>CONTROLS</h3>' +
        '<p><kbd>ARROWS</kbd> move  ·  <kbd>ENTER</kbd> guess  ·  ' +
        '<kbd>M</kbd> SFX  ·  <kbd>B</kbd> BGM  ·  <kbd>R</kbd> restart</p>' +
        '<p>On a small phone grid, tap once to select a cell and <b class="hl">tap again</b> to confirm — ' +
        'so you never waste a sample by accident.</p>'
    },
    credits: {
      eyebrow: 'COLOPHON',
      title: 'CREDITS',
      html:
        '<p><strong class="hl">GRIDLOCK</strong> — a pixel-neon deduction game.</p>' +
        '<p class="credits-line">DESIGN &amp; CODE · HTML + CSS + JS<br>' +
        'UI / MOTION / VFX CONSULTATION · <b class="hl-p">Kimi K3.1 Pro</b><br>' +
        'TYPE · Silkscreen · Ark Pixel 12px (OFL) · Noto Sans TC<br>' +
        'AUDIO · synthesized SFX · streamed music from assets/music<br>' +
        'PIXELS · 5×7 bitmap glyphs drawn as inline SVG</p>' +
        '<p>No images, no frameworks, no build step. <b class="hl">Works offline.</b></p>'
    }
  },
  zh: {
    how: {
      eyebrow: '操作手冊',
      title: '玩法說明',
      html:
        '<p>其中一格藏著目標。點擊格子進行 <strong class="hl">取樣</strong>，' +
        '回傳的數字就是 <strong class="hl">曼哈頓距離</strong> —— ' +
        '從該格走到目標最少需要幾步（上下加左右）。</p>' +
        '<p>這張範例格顯示每一格到中心格的距離：</p>' +
        '{{GRID}}' +
        '<h3>讀懂數字</h3>' +
        '<p><b class="hl-g">0</b> 代表正中目標。<b class="hl-b">1</b> 代表目標就在隔壁。' +
        '<b class="hl-c">4</b> 代表四個方向加起來共四步 —— 結合兩次取樣就能精準鎖定。</p>' +
        '<h3>次數用完就結束</h3>' +
        '<p>每個模式有不同的格數與取樣次數。每個模式的 <b class="hl-w">最佳成績</b>' +
        '（用最少次數）都會自動保存。</p>' +
        '<h3>操作</h3>' +
        '<p><kbd>方向鍵</kbd> 移動  ·  <kbd>ENTER</kbd> 猜測  ·  <kbd>M</kbd> 音效  ·  <kbd>B</kbd> 音樂  ·  <kbd>R</kbd> 重來</p>' +
        '<p>在手機的小格子上，先點一次選取格子，再 <b class="hl">點第二次</b> 確認 —— ' +
        '避免不小心浪費一次取樣。</p>'
    },
    credits: {
      eyebrow: '製作資訊',
      title: '製作名單',
      html:
        '<p><strong class="hl">GRIDLOCK</strong> —— 像素霓虹推理遊戲。</p>' +
        '<p class="credits-line">設計與程式 · HTML + CSS + JS<br>' +
        'UI／動態／特效顧問 · <b class="hl-p">Kimi K3.1 Pro</b><br>' +
        '字體 · Silkscreen · Ark Pixel · Noto Sans TC<br>' +
        '音效 · Web Audio 即時合成 · 音樂串流自 assets/music<br>' +
        '像素 · 5×7 點陣字形，以內嵌 SVG 繪製</p>' +
        '<p>沒有圖片、沒有框架、不需建置。<b class="hl">離線也能玩。</b></p>'
    }
  }
};

function openInfo(kind){
  var pack = INFO[lang] || INFO.en;
  var info = pack[kind] || INFO.en[kind];
  if(!info) return;
  Sfx.unlock();
  Sfx.select();
  infoEyebrow.textContent = info.eyebrow;
  infoTitle.textContent = info.title;
  infoBody.innerHTML = info.html.replace('{{GRID}}', miniGridHTML());
  infoOverlay.hidden = false;
  void infoOverlay.offsetWidth;
  infoOverlay.classList.add('show');
  later(40, function(){ infoClose.focus({ preventScroll: true }); });
}

function closeInfo(){
  infoOverlay.classList.remove('show');
  infoOverlay.hidden = true;
}

/* ============================================================
   17b. audio mixer
   ============================================================ */
function syncFill(el){
  var v = parseInt(el.value, 10) || 0;
  el.style.setProperty('--fill', v + '%');
  var out = (el.id === 'sfxVol') ? sfxValEl : bgmValEl;
  if(out) out.textContent = v + '%';
}

function paintMixer(){
  if(!sfxVolEl || !bgmVolEl) return;
  sfxVolEl.value = Math.round(Sfx.getVolume() * 100);
  bgmVolEl.value = Math.round(Bgm.getVolume() * 100);
  syncFill(sfxVolEl);
  syncFill(bgmVolEl);
  paintToggles();
}

function openAudio(){
  paintMixer();
  audioOverlay.hidden = false;
  void audioOverlay.offsetWidth;
  audioOverlay.classList.add('show');
  pauseDriftClock('audio');
  later(40, function(){ audioClose.focus({ preventScroll: true }); });
}

function closeAudio(){
  audioOverlay.classList.remove('show');
  audioOverlay.hidden = true;
  resumeDriftClock('audio');
}

/* ============================================================
   18. events
   ============================================================ */
$$('.sfx-toggle').forEach(function(b){
  b.addEventListener('click', toggleSound);
});
$$('.bgm-toggle').forEach(function(b){
  b.addEventListener('click', toggleBgm);
});

$$('.lang-btn').forEach(function(b){
  b.addEventListener('click', toggleLang);
});

$$('.audio-btn').forEach(function(b){
  b.addEventListener('click', function(){
    Sfx.unlock();
    Sfx.select();
    openAudio();
  });
});

audioClose.addEventListener('click', closeAudio);
audioOverlay.addEventListener('click', function(e){
  if(e.target === audioOverlay) closeAudio();
});

sfxVolEl.addEventListener('input', function(){
  Sfx.setVolume((parseInt(this.value, 10) || 0) / 100);
  syncFill(this);
});
bgmVolEl.addEventListener('input', function(){
  Bgm.setVolume((parseInt(this.value, 10) || 0) / 100);
  syncFill(this);
});

$('#howBtn').addEventListener('click', function(){ openInfo('how'); });
$('#creditsBtn').addEventListener('click', function(){ openInfo('credits'); });
infoClose.addEventListener('click', closeInfo);
infoOverlay.addEventListener('click', function(e){
  if(e.target === infoOverlay) closeInfo();
});

bossVeil.addEventListener('click', function(){
  if(driftStory.active) skipOrBeginDriftStory();
});

$('#restartBtn').addEventListener('click', function(){
  if(state.phase === 'menu') return;
  Sfx.unlock();
  Sfx.restart();
  closeResult();
  startGame(state.mode.id);
});

$('#modesBtn').addEventListener('click', function(){
  Sfx.unlock();
  Sfx.select();
  closeResult();
  state.phase = 'menu';
  refreshMenuBests();
  showScreen('menu');
});

ovPrimary.addEventListener('click', function(){
  Sfx.select();
  closeResult();
  startGame(state.mode.id);
});

ovSecondary.addEventListener('click', function(){
  Sfx.select();
  closeResult();
  state.phase = 'menu';
  refreshMenuBests();
  showScreen('menu');
});

/* audio unlock on first gesture anywhere */
document.addEventListener('pointerdown', function once(){
  Sfx.unlock();
  Bgm.play(state.phase === 'menu' ? 'menu' : state.mode.id);
  document.removeEventListener('pointerdown', once);
}, { passive: true });
document.addEventListener('keydown', function once(){
  Sfx.unlock();
  Bgm.play(state.phase === 'menu' ? 'menu' : state.mode.id);
  document.removeEventListener('keydown', once);
});

document.addEventListener('visibilitychange', function(){
  if(document.hidden){
    Sfx.suspend();
    Bgm.pause();
    if(driftStory.active && driftStory.typing) driftStory.paused = true;
    pauseDriftClock('hidden');
  } else {
    Sfx.resume();
    Bgm.resume();
    if(driftStory.active && driftStory.paused && driftStory.typing){
      driftStory.paused = false;
      driftStoryTick(driftStory.token);
    }
    resumeDriftClock('hidden');
  }
});

window.addEventListener('resize', function(){
  measureGrid();
  FX.resize();
});

/* ============================================================
   19. boot
   ============================================================ */
if(!store.get('driftUnlocked', false) && driftReady()){
  store.set('driftUnlocked', true);
  store.set('driftUnlockSeen', false);
}
if(store.get('driftUnlocked', false) && !store.get('driftUnlockSeen', false)){
  state.driftUnlockPending = true;
}
applyLang();
renderLogEmpty();
buildDriftMeter();
paintMixer();
FX.resize();
measureGrid();
if(state.driftUnlockPending) later(500, playDriftUnlock);
setTimeout(function(){ FX.resize(); measureGrid(); }, 60);

})();
