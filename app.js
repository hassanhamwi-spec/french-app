(function () {
  'use strict';

  var APP_VERSION = '2.6';
  var BUILTIN = window.APP_DATA.lessons;
  var Store = window.Store, Voice = window.Voice, Pron = window.Pron, AI = window.AI;
  var app = document.getElementById('app');

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // Arabic text that contains French/Latin words: isolate the Latin runs so the order never gets scrambled.
  function ar(s) {
    return esc(s).replace(/([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9'’\-]*(?:[ .…]+[A-Za-zÀ-ÿ0-9'’\-]+)*)/g, '<bdi dir="ltr">$1</bdi>');
  }
  function lessons() { return BUILTIN.concat(Store.customLessons()); }
  function byId(id) {
    var a = lessons();
    for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i];
    return null;
  }
  function wordsOf(l) { return (l.words || []).concat(l.instr || []); }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function $(id) { return document.getElementById(id); }
  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3200);
  }
  function mb(n) { return (n / 1048576).toFixed(0); }
  function freeHours() { var h = new Date().getHours(); return h >= 0 && h < 10; }

  /* ---------- progress ---------- */
  var prog = Store.progress();
  function reloadProg() { prog = Store.progress(); }
  function record(word, ok) {
    var r = prog[word.fr] || { box: 0, ok: 0, bad: 0 };
    if (ok) { r.ok++; r.box = Math.min(4, r.box + 1); } else { r.bad++; r.box = 0; }
    prog[word.fr] = r;
    Store.saveProgress(prog);
    Store.touchDay();
  }
  function isMastered(w) { var r = prog[w.fr]; return !!(r && r.box >= 3); }
  function isWeak(w) { var r = prog[w.fr]; return !!(r && r.bad > 0 && r.box <= 1); }

  /* ---------- sound ---------- */
  function speak(text, slow) { Voice.speak(text, slow); }
  function speakBtns(say) {
    var s = esc(say);
    return '<div class="btns">' +
      '<button class="spk" data-say="' + s + '">🔊 اسمعي</button>' +
      '<button class="spk slow" data-say="' + s + '" data-slow="1">🐢 بطيء</button>' +
      '</div>';
  }
  function wordCard(w, opts) {
    opts = opts || {};
    var h = '<div class="word"><div class="fr">' + esc(w.fr) + '</div>' +
      '<div class="p">' + esc(w.p) + '</div>' +
      '<div class="m">' + ar(w.m) + '</div>';
    if (w.ex) {
      h += '<div class="ex"><button class="spk-mini spk" data-say="' + esc(w.ex) + '" aria-label="اسمعي الجملة">🔊</button>' +
        '<span class="exfr">' + esc(w.ex) + '</span>' + (w.exAr ? '<span class="exar">' + ar(w.exAr) + '</span>' : '') + '</div>';
    }
    h += speakBtns(w.say);
    if (opts.rec !== false) {
      h += '<button class="rec" data-w="' + esc(w.fr) + '" data-say="' + esc(w.say) + '">🎤 جرّبي تقوليها</button><div class="pron-out"></div>';
    }
    return h + '</div>';
  }

  /* ---------- home ---------- */
  var installEvt = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installEvt = e; var b = $('install'); if (b) b.hidden = false; });

  function profileChips() {
    var cur = Store.profile();
    var h = '<div class="profiles" role="group" aria-label="مين عم يتعلّم؟">';
    Store.PROFILES.forEach(function (p) {
      h += '<button class="pchip' + (p.id === cur ? ' on' : '') + '" data-profile="' + p.id + '">' + p.icon + ' ' + esc(p.nameAr) + '</button>';
    });
    return h + '</div>';
  }

  function homeView() {
    var cur = Store.profile();
    var h = '<header class="top"><h1>فرنسي بسهولة</h1><p>' +
      (cur === 'son' ? 'يلا يا عبد الرحمن، نتعلّم سوا' : 'تعلّمي الدرس أول، وبعدين علّميه لابنك') + '</p></header>';
    h += profileChips();
    var notes = Store.notices();
    if (notes.length) {
      h += '<div class="box ok-box"><h3>🎉 جاهز</h3>';
      notes.forEach(function (n) { h += '<div><a href="#/lesson/' + esc(n.id) + '">' + ar(n.t) + '</a></div>'; });
      h += '<button class="mini" id="clearnotes">تمام</button></div>';
    }
    h += '<a class="big b1" href="#/lessons">📖 دروسي</a>' +
      '<a class="big b4" href="#/scan">📸 صوّري درس جديد</a>' +
      '<a class="big b3" href="#/practice">✏️ تمارين</a>' +
      '<a class="big b2" href="#/exam">📝 امتحان قصير</a>' +
      '<a class="big b5" href="#/progress">📊 التقدّم</a>';
    h += '<div id="voicebanner"></div>';
    h += '<button class="big b6" id="install" hidden>📲 ثبّتي التطبيق على الموبايل</button>';
    h += '<div class="foot"><a href="#/lesson/instr">🗣️ كلمات التعليمات</a> · <a href="#/setup">🔧 الإعدادات</a></div>';
    h += '<div class="note ver">النسخة ' + APP_VERSION + '</div>';
    return h;
  }

  function afterHome() {
    var vb = $('voicebanner');
    if (!vb) return;
    Voice.packStatus().then(function (s) {
      if (!vb.isConnected) return;
      if (s !== 'ready' && /^https?:$/.test(location.protocol)) {
        vb.innerHTML = '<a class="card" style="--c:#7c4dff" href="#/setup"><div class="row"><span class="ic">🎧</span><div><div class="t">صوت فرنسي أوضح</div>' +
          '<div class="s">حمّليه مرة وحدة (حوالي 92 ميغا)، وبيشتغل بعدها بدون إنترنت</div></div></div></a>';
      }
    });
    var ib = $('install');
    if (ib && installEvt) ib.hidden = false;
  }

  /* ---------- lessons ---------- */
  function lessonsView() {
    var h = '<a class="back" href="#/">⬅ الرئيسية</a><h2>دروسي</h2>';
    lessons().forEach(function (l) {
      var m = wordsOf(l).filter(isMastered).length;
      h += '<a class="card" style="--c:' + l.color + '" href="#/lesson/' + l.id + '">' +
        '<div class="row"><span class="ic">' + l.icon + '</span><div>' +
        '<div class="t">' + ar(l.titleAr) + '</div>' +
        '<div class="s">' + esc(l.book) + ' · ' + wordsOf(l).length + ' كلمة · ' + m + ' متقنة</div>' +
        '</div></div></a>';
    });
    h += '<a class="card" style="--c:#8e24aa" href="#/scan"><div class="row"><span class="ic">📸</span><div><div class="t">صوّري درس جديد</div><div class="s">صورة من الكتاب بتصير درس كامل</div></div></div></a>';
    return h;
  }

  function lessonView(id) {
    var l = byId(id);
    if (!l) return lessonsView();
    var h = '<a class="back" href="#/lessons">⬅ دروسي</a>';
    h += '<div class="lhead" style="--c:' + l.color + '"><h2>' + l.icon + ' ' + ar(l.titleAr) + '</h2>' +
      '<div class="fr">' + esc(l.titleFr) + '</div></div>';
    h += '<div class="box" style="--c:' + l.color + '"><h3>عن الدرس</h3>' + ar(l.intro) + '</div>';
    h += '<div class="box" style="--c:' + l.color + '"><h3>كيف تعلّميه (خطوات)</h3><ol>';
    l.script.forEach(function (s) { h += '<li>' + ar(s) + '</li>'; });
    h += '</ol></div>';
    if (l.sounds) {
      h += '<div class="box" style="--c:' + l.color + '"><h3>الأصوات</h3><div class="chips">';
      l.sounds.forEach(function (s) {
        h += '<button class="chip spk-chip spk" data-say="' + esc(s.say) + '"><b>' + esc(s.fr) + '</b> = ' + esc(s.p) + ' 🔊</button>';
      });
      h += '</div></div>';
    }
    h += '<h3>الكلمات</h3>';
    l.words.forEach(function (w) { h += wordCard(w); });
    if (l.instr && l.instr.length) {
      h += '<h3>كلمات التعليمات بهالصفحة</h3>';
      l.instr.forEach(function (w) { h += wordCard(w); });
    }
    if (l.keys && l.keys.length) {
      h += '<details class="keys"><summary>✅ الأجوبة النموذجية (جرّبي مع ابنك قبل ما تفتحيها)</summary>';
      if (l.ai) h += '<p class="note">مولّدة بالذكاء الاصطناعي — راجعيها مع الكتاب.</p>';
      l.keys.forEach(function (k) {
        h += '<p class="q">' + esc(k.q) + '</p><p>' + ar(k.a) + '</p>';
      });
      h += '</details>';
    }
    h += '<a class="go" href="#/quiz/' + l.id + '">✏️ تمرين على هالدرس</a>';
    h += '<a class="go alt" href="#/exam/' + l.id + '">📝 امتحان على هالدرس</a>';
    if (l.custom) {
      h += '<div class="note">درس من الكاميرا' + (l.ai ? ' (حضّره ' + esc(l.ai) + ')' : '') + ' — الذكاء الاصطناعي ممكن يغلط، راجعي الكلمات مع الكتاب.</div>' +
        '<button class="danger" data-del="' + esc(l.id) + '">🗑️ احذفي هالدرس</button>';
    }
    return h;
  }

  function afterLesson(id) {
    var l = byId(id);
    if (l && l.words) Voice.prewarm(wordsOf(l).map(function (w) { return w.say; }));
  }

  /* ---------- pronunciation practice ---------- */
  var recorder = null, recBtn = null, lastRec = {};
  function verdict(sc) {
    if (sc >= 80) return { e: '😊', t: 'قريب كتير من الصوت الأصلي!', r: 2 };
    if (sc >= 50) return { e: '🙂', t: 'تقريباً، جرّبي مرة تانية ببطء.', r: 1 };
    return { e: '🔁', t: 'سمعي الصوت الأصلي وعيدي.', r: 0 };
  }
  function outOf(btn) { return btn.parentNode.querySelector('.pron-out'); }
  function ratingBtns(w) {
    return '<div class="rate"><span>كيف كان؟</span>' +
      '<button class="rt" data-w="' + esc(w) + '" data-r="2">😊 تمام</button>' +
      '<button class="rt" data-w="' + esc(w) + '" data-r="1">🙂 تقريباً</button>' +
      '<button class="rt" data-w="' + esc(w) + '" data-r="0">🔁 بدي أعيد</button></div>';
  }
  function onRecClick(btn) {
    var w = btn.getAttribute('data-w'), say = btn.getAttribute('data-say');
    var out = outOf(btn);
    var S = Store.settings();
    if (recorder) {   // second tap = stop
      var r = recorder; recorder = null;
      var b0 = recBtn; recBtn = null;
      b0.classList.remove('live'); b0.textContent = '🎤 جرّبي تقوليها';
      r.stop().then(function (blob) {
        if (!blob || !blob.size) { out.textContent = 'ما سمعت شي، جرّبي مرة تانية.'; return; }
        if (lastRec[w]) URL.revokeObjectURL(lastRec[w]);
        lastRec[w] = URL.createObjectURL(blob);
        out.innerHTML = '<div class="btns"><button class="spk play-mine" data-w="' + esc(w) + '">▶ صوتك</button>' +
          '<button class="spk slow" data-say="' + esc(say) + '">🔊 الأصلي</button></div>' + ratingBtns(w) +
          '<div class="note">قارني بين الصوتين وقيّمي بنفسك. التقييم من عندك، مو تصحيح آلي.</div>';
      });
      return;
    }
    out.textContent = '';
    if (S.onlineSTT && Pron.sttSupported()) {
      btn.textContent = '🎙️ احكي هلأ...'; btn.classList.add('live');
      AI.online().then(function (on) {
        if (!on) throw new Error('offline');
        return Pron.listen();
      }).then(function (alts) {
        btn.classList.remove('live'); btn.textContent = '🎤 جرّبي تقوليها';
        if (!alts.length) { out.textContent = 'ما سمعت شي، جرّبي مرة تانية.'; return; }
        var sc = Pron.score(say, alts), v = verdict(sc);
        Store.setPron(w, v.r);
        out.innerHTML = '<div class="verdict">' + v.e + ' ' + v.t + '</div><div class="note">سمعت: <bdi dir="ltr">' + esc(alts[0]) + '</bdi> — تقدير تقريبي ' + sc + '%</div>';
      }).catch(function () {
        btn.classList.remove('live'); btn.textContent = '🎤 جرّبي تقوليها';
        out.textContent = 'ما اشتغل التعرّف الآلي هلأ (بدو إنترنت وإذن المايكروفون). جرّبي تسجيل صوتك من الإعدادات بوضع بدون إنترنت.';
      });
      return;
    }
    if (!Pron.canRecord()) { out.textContent = 'هالمتصفح ما بيدعم التسجيل. افتحي التطبيق من Chrome.'; return; }
    Pron.startRec().then(function (r) {
      recorder = r; recBtn = btn;
      btn.classList.add('live'); btn.textContent = '⏹ وقّفي التسجيل';
    }).catch(function () {
      out.textContent = 'بدنا إذن المايكروفون. اضغطي «سماح» لما يسألك المتصفح.';
    });
  }

  /* ---------- scan (photo → lesson) ---------- */
  var scanState = { busy: false, preview: null, msg: '', lesson: null, thumb: null, img: null };

  function scanView() {
    var hasKeys = AI.hasKeys();
    var h = '<a class="back" href="#/">⬅ الرئيسية</a><h2>📸 درس جديد من الكتاب</h2>';
    if (!hasKeys) {
      h += '<div class="box"><h3>بدها إعداد مرة وحدة</h3>هالميزة بتحتاج مفتاح ذكاء اصطناعي مجاني بيجهّزه أبو إبراهيم من الإعدادات. التطبيق كله بيشتغل عادي بدونها.' +
        '<a class="go" href="#/setup">🔧 فتح الإعدادات</a></div>';
      return h;
    }
    h += '<div class="box">صوّري صفحة من الكتاب: بتصير درس فيه الكلمات والنطق والمعاني وتمارين.<br>إذا ما في إنترنت هلأ، بتنحفظ الصورة وبتتحوّل لحالها أول ما يرجع النت.</div>';
    h += '<label class="go cam">📷 صوّري الصفحة<input type="file" id="shot" accept="image/*" capture="environment" hidden></label>';
    h += '<label class="go alt cam">🖼️ اختاري صورة من الموبايل<input type="file" id="pick" accept="image/*" hidden></label>';
    h += '<div id="scanout">' + scanOut() + '</div>';
    h += '<div id="queuebox"></div>';
    return h;
  }
  function scanOut() {
    var s = scanState, h = '';
    if (s.preview) h += '<img class="prev" alt="الصفحة المصوّرة" src="' + s.preview + '">';
    if (s.busy) h += '<div class="box busy"><div class="spin"></div>' + esc(s.msg || 'عم بحضّر الدرس...') + '</div>';
    else if (s.msg) h += '<div class="box">' + ar(s.msg) + '</div>';
    if (s.lesson && !s.busy) {
      var l = s.lesson;
      h += '<div class="box" style="--c:' + l.color + '"><h3>' + ar(l.titleAr) + '</h3>' + ar(l.intro) +
        '<div class="note">' + l.words.length + ' كلمة' + (l.exercises.length ? ' · ' + l.exercises.length + ' أسئلة' : '') + ' · حضّره ' + esc(l.ai) + '</div></div>';
      h += '<button class="go" id="savelesson">💾 احفظي الدرس</button><button class="danger" id="dropscan">إلغاء</button>';
    }
    return h;
  }
  function refreshScan() { var o = $('scanout'); if (o) o.innerHTML = scanOut(); }
  function humanTried(tried) {
    var t = (tried || []).join(' ');
    if (/429/.test(t)) return 'الحصة المجانية خلصت مؤقتاً. رح نجرّب تاني لاحقاً.';
    if (/401|403|API key|invalid/i.test(t)) return 'في مفتاح مو صحيح. تأكّدي من الإعدادات.';
    return 'ما قدرنا نحضّر الدرس هلأ.';
  }

  function onPhoto(file) {
    if (!file || scanState.busy) return;
    scanState = { busy: true, preview: null, msg: 'عم بصغّر الصورة...', lesson: null };
    refreshScan();
    var img, thumb;
    AI.shrink(file, 1600, 0.82).then(function (d) {
      img = d; scanState.preview = d;
      return AI.shrink(file, 360, 0.6);
    }).then(function (t) {
      thumb = t; scanState.img = img; scanState.thumb = t;
      scanState.msg = 'عم فحص الإنترنت...'; refreshScan();
      return AI.online();
    }).then(function (on) {
      if (!on) return queuePhoto('ما في إنترنت هلأ');
      return runAI(img, thumb);
    }).catch(function () {
      scanState.busy = false; scanState.msg = 'ما قدرت فتح الصورة. جرّبي صورة تانية.'; refreshScan();
    });
  }
  function queuePhoto(why) {
    var id = 'q' + Date.now().toString(36);
    return Store.queueAdd({ id: id, ts: Date.now(), img: scanState.img, thumb: scanState.thumb }).then(function () {
      scanState.busy = false; scanState.lesson = null;
      scanState.msg = why + '. انحفظت الصورة، وبتتحوّل لدرس أول ما يرجع النت وتفتحي التطبيق. 👍';
      refreshScan(); showQueue();
    }).catch(function () {
      scanState.busy = false; scanState.msg = 'ما قدرت أحفظ الصورة (الذاكرة ممتلئة؟).'; refreshScan();
    });
  }
  function runAI(img, thumb) {
    scanState.msg = 'عم بحضّر الدرس...'; refreshScan();
    return AI.lessonFromPhoto(img, function (name) { scanState.msg = 'عم بحضّر الدرس (' + name + ')...'; refreshScan(); }).then(function (r) {
      r.lesson.thumb = thumb;
      scanState.busy = false; scanState.lesson = r.lesson; scanState.msg = '';
      refreshScan();
    }).catch(function (e) {
      if (e && e.message === 'no keys') {
        scanState.busy = false; scanState.msg = 'ما في مفتاح ذكاء اصطناعي. اطلبي من أبو إبراهيم يضيفه من الإعدادات.'; refreshScan(); return;
      }
      return queuePhoto(humanTried(e && e.tried));
    });
  }
  function showQueue() {
    var qb = $('queuebox'); if (!qb) return;
    Store.queueAll().then(function (a) {
      if (!a || !a.length || !qb.isConnected) { if (qb) qb.innerHTML = ''; return; }
      qb.innerHTML = '<div class="box"><h3>⏳ صور بالانتظار (' + a.length + ')</h3>' +
        '<button class="spk" id="retryq">جرّبي هلأ</button> <button class="danger" id="dropq">امسحيها</button></div>';
    }).catch(function () { /* no idb */ });
  }
  var qBusy = false;
  function processQueue(silent) {
    if (qBusy || !AI.hasKeys()) return Promise.resolve(0);
    qBusy = true;
    return Store.queueAll().then(function (items) {
      if (!items || !items.length) return 0;
      return AI.online().then(function (on) {
        if (!on) return 0;
        var made = 0, chain = Promise.resolve();
        items.forEach(function (it) {
          chain = chain.then(function () {
            return AI.lessonFromPhoto(it.img).then(function (r) {
              r.lesson.thumb = it.thumb;
              Store.addCustomLesson(r.lesson);
              Store.addNotice({ id: r.lesson.id, t: 'درس جديد: ' + r.lesson.titleAr });
              made++;
              return Store.queueDelete(it.id);
            }).catch(function () { /* stays in the queue for next time */ });
          });
        });
        return chain.then(function () { return made; });
      });
    }).then(function (n) {
      qBusy = false;
      if (n && !silent) toast('جهز ' + n + ' درس من الصور المحفوظة 🎉');
      return n;
    }).catch(function () { qBusy = false; return 0; });
  }

  /* ---------- practice ---------- */
  function allWords() {
    var seen = {}, out = [];
    lessons().forEach(function (l) {
      wordsOf(l).forEach(function (w) { if (!seen[w.fr]) { seen[w.fr] = 1; out.push(w); } });
    });
    return out;
  }
  function practiceView() {
    var weak = allWords().filter(isWeak).length;
    var h = '<a class="back" href="#/">⬅ الرئيسية</a><h2>تمارين</h2>';
    h += '<a class="card" style="--c:#26a69a" href="#/quiz/all"><div class="row"><span class="ic">🎲</span><div><div class="t">كل الدروس (مختلط)</div><div class="s">8 أسئلة من كل الكلمات</div></div></div></a>';
    if (weak > 0) {
      h += '<a class="card" style="--c:#e53935" href="#/quiz/weak"><div class="row"><span class="ic">🔁</span><div><div class="t">الكلمات اللي بدها مراجعة</div><div class="s">' + weak + ' كلمة</div></div></div></a>';
    }
    lessons().forEach(function (l) {
      h += '<a class="card" style="--c:' + l.color + '" href="#/quiz/' + l.id + '"><div class="row"><span class="ic">' + l.icon + '</span><div><div class="t">' + ar(l.titleAr) + '</div><div class="s">' + esc(l.book) + '</div></div></div></a>';
    });
    return h;
  }

  /* ---------- exam ---------- */
  function examMenu() {
    var h = '<a class="back" href="#/">⬅ الرئيسية</a><h2>📝 امتحان قصير</h2><div class="box">10 أسئلة، والنتيجة بتنحفظ بصفحة التقدّم.</div>';
    h += '<a class="card" style="--c:#5e35b1" href="#/exam/all"><div class="row"><span class="ic">🎓</span><div><div class="t">امتحان شامل</div><div class="s">من كل الدروس</div></div></div></a>';
    lessons().forEach(function (l) {
      h += '<a class="card" style="--c:' + l.color + '" href="#/exam/' + l.id + '"><div class="row"><span class="ic">' + l.icon + '</span><div><div class="t">' + ar(l.titleAr) + '</div><div class="s">' + esc(l.book) + '</div></div></div></a>';
    });
    return h;
  }

  /* ---------- quiz engine ---------- */
  var Q = null;
  function poolFor(id) {
    if (id === 'all') return allWords();
    if (id === 'weak') return allWords().filter(isWeak);
    var l = byId(id);
    return l ? wordsOf(l) : [];
  }
  function pickDistractors(pool, correct, key, n) {
    var seen = {}; seen[correct[key]] = 1;
    var out = [];
    shuffle(pool.slice()).forEach(function (w) {
      if (out.length < n && !seen[w[key]]) { seen[w[key]] = 1; out.push(w); }
    });
    return out;
  }
  function makeQuiz(id, exam) {
    var pool = poolFor(id);
    var everything = allWords();
    if (pool.length < 3) pool = everything;
    var N = exam ? 10 : 8;
    var picks = shuffle(pool.slice()).slice(0, N);
    var types = ['listen-m', 'm-fr', 'listen-fr'];
    var qs = picks.map(function (w, i) {
      var type = types[i % 3];
      if (id === 'ch' && typeof w.ch === 'boolean' && i % 2 === 0) type = 'chyn';
      var q = { type: type, w: w };
      if (type !== 'chyn') {
        var key = (type === 'listen-m') ? 'm' : 'fr';
        var base = pool.length >= 3 ? pool : everything;
        var opts = pickDistractors(base, w, key, 2);
        if (opts.length < 2) opts = pickDistractors(everything, w, key, 2);
        q.options = shuffle([w].concat(opts));
      }
      return q;
    });
    // lesson-specific questions made by the AI replace a few of the plain ones
    var exs = [];
    if (id === 'all') lessons().forEach(function (l) { (l.exercises || []).forEach(function (e) { exs.push(e); }); });
    else { var L = byId(id); if (L && L.exercises) exs = L.exercises.slice(); }
    shuffle(exs).slice(0, exam ? 4 : 2).forEach(function (e, k) {
      var at = qs.length - 1 - k * 2;
      if (at >= 0) qs[at] = { type: 'ex', ex: e };
    });
    var L2 = byId(id);
    var title = id === 'all' ? 'كل الدروس' : (id === 'weak' ? 'مراجعة' : (L2 ? L2.titleAr : ''));
    return { id: id, title: title, exam: !!exam, qs: qs, i: 0, score: 0, wrong: [], answered: false };
  }
  function quizView(id, exam) {
    Q = makeQuiz(id, exam);
    if (!Q.qs.length) return '<a class="back" href="#/practice">⬅ تمارين</a><div class="box">ما في كلمات للتمرين.</div>';
    return renderQuestion();
  }
  function renderQuestion() {
    var q = Q.qs[Q.i];
    var pct = Math.round((Q.i / Q.qs.length) * 100);
    var h = '<div class="qhead"><a class="x" href="' + (Q.exam ? '#/exam' : '#/practice') + '">✖</a><div class="bar"><i style="width:' + pct + '%"></i></div><span>' + (Q.i + 1) + '/' + Q.qs.length + '</span></div>';
    h += '<div class="qbox">';
    if (q.type === 'listen-m') h += '<div class="lab">اسمعي الكلمة، شو معناها؟</div>' + speakBtns(q.w.say);
    else if (q.type === 'listen-fr') h += '<div class="lab">اسمعي الكلمة، أي وحدة هي؟</div>' + speakBtns(q.w.say);
    else if (q.type === 'm-fr') h += '<div class="lab">شو بالفرنسي؟</div><div class="big-ar">' + ar(q.w.m) + '</div>';
    else if (q.type === 'ex') h += '<div class="lab">اختاري الجواب الصحيح</div><div class="big-ar sm">' + ar(q.ex.q) + '</div>';
    else h += '<div class="lab">هل بتسمعي صوت «ش» (ch) بالكلمة؟</div><div class="big-fr">' + esc(q.w.fr) + '</div>' + speakBtns(q.w.say);
    h += '</div><div class="opts">';
    if (q.type === 'chyn') {
      h += '<button class="opt" data-i="1">✅ فيها ch</button><button class="opt" data-i="0">❌ ما فيها ch</button>';
    } else if (q.type === 'ex') {
      q.ex.choices.forEach(function (c, idx) { h += '<button class="opt" data-i="' + idx + '">' + ar(c) + '</button>'; });
    } else {
      q.options.forEach(function (o, idx) {
        var isFr = q.type !== 'listen-m';
        h += '<button class="opt' + (isFr ? ' fr' : '') + '" data-i="' + idx + '">' + (isFr ? esc(o.fr) : ar(o.m)) + '</button>';
      });
    }
    h += '</div><div class="fb" id="fb"></div><button class="go" id="next" hidden>التالي ⬅</button>';
    Q.answered = false;
    return h;
  }
  function answer(btn) {
    if (!Q || Q.answered) return;
    var q = Q.qs[Q.i];
    var ok, correctLabel, correctIdx;
    var opts = app.querySelectorAll('.opt');
    var chosenIdx = parseInt(btn.getAttribute('data-i'), 10);
    if (q.type === 'chyn') {
      correctIdx = q.w.ch ? 1 : 0; ok = chosenIdx === correctIdx;
      correctLabel = q.w.ch ? 'فيها ch' : 'ما فيها ch';
    } else if (q.type === 'ex') {
      correctIdx = q.ex.a; ok = chosenIdx === correctIdx; correctLabel = q.ex.choices[correctIdx];
    } else {
      ok = (q.options[chosenIdx] === q.w);
      correctLabel = (q.type === 'listen-m') ? q.w.m : q.w.fr;
      for (var z = 0; z < q.options.length; z++) if (q.options[z] === q.w) correctIdx = z;
    }
    for (var k = 0; k < opts.length; k++) {
      if (parseInt(opts[k].getAttribute('data-i'), 10) === correctIdx) opts[k].classList.add('ok');
      opts[k].disabled = true;
    }
    if (!ok) btn.classList.add('bad');
    Q.answered = true;
    if (q.w) { record(q.w, ok); if (!ok) Q.wrong.push(q.w); } else Store.touchDay();
    if (ok) Q.score++;
    var fb = $('fb');
    fb.className = 'fb ' + (ok ? 'ok' : 'bad');
    fb.textContent = ok ? '✅ برافو!' : '❌ الجواب: ' + correctLabel;
    var nx = $('next');
    nx.hidden = false;
    nx.textContent = (Q.i + 1 >= Q.qs.length) ? 'شوفي النتيجة ⬅' : 'التالي ⬅';
    if (q.w) setTimeout(function () { speak(q.w.say, false); }, 350);
  }
  function nextQuestion() {
    if (!Q) return;
    Q.i++;
    if (Q.i >= Q.qs.length) {
      Q.done = true;
      if (Q.exam) Store.addExam({ ts: Date.now(), id: Q.id, title: Q.title, score: Q.score, total: Q.qs.length });
      app.innerHTML = resultView(); window.scrollTo(0, 0); return;
    }
    app.innerHTML = renderQuestion();
    window.scrollTo(0, 0);
    var q = Q.qs[Q.i];
    if (q.type === 'listen-m' || q.type === 'listen-fr') setTimeout(function () { speak(q.w.say, false); }, 200);
  }
  function resultView() {
    var total = Q.qs.length;
    var ratio = Q.score / total;
    var stars = ratio >= 0.9 ? '⭐⭐⭐' : (ratio >= 0.6 ? '⭐⭐' : '⭐');
    var msg = ratio >= 0.9 ? 'ممتاز!' : (ratio >= 0.6 ? 'حلو كتير، كمّلوا!' : 'ولا يهمك، نعيد ونتحسّن.');
    var h = '<div class="res"><div class="stars">' + stars + '</div>' +
      '<div class="score">' + Q.score + ' من ' + total + '</div><p>' + msg + '</p>' + (Q.exam ? '<p class="note">انحفظت النتيجة بصفحة التقدّم.</p>' : '') + '</div>';
    if (Q.wrong.length) {
      h += '<div class="box"><h3>كلمات بدها إعادة</h3>';
      var seen = {};
      Q.wrong.forEach(function (w) {
        if (seen[w.fr]) return; seen[w.fr] = 1;
        h += wordCard(w, { rec: false });
      });
      h += '</div>';
    }
    h += '<a class="go" href="#/' + (Q.exam ? 'exam/' : 'quiz/') + Q.id + '" id="again">🔁 مرة تانية</a><a class="back" href="#/' + (Q.exam ? 'exam' : 'practice') + '">⬅ رجوع</a>';
    return h;
  }

  /* ---------- progress ---------- */
  function progressView() {
    var cur = Store.profile();
    var curP = Store.PROFILES.filter(function (p) { return p.id === cur; })[0];
    var h = '<a class="back" href="#/">⬅ الرئيسية</a><h2>📊 التقدّم</h2>' + profileChips();
    var all = allWords();
    var mastered = all.filter(isMastered).length;
    var weak = all.filter(isWeak).length;
    h += '<div class="stats"><div><b>' + mastered + '</b><span>كلمة متقنة</span></div><div><b>' + Store.streak() + '</b><span>يوم متتالي</span></div><div><b>' + Store.daysCount() + '</b><span>يوم تعلّم</span></div></div>';
    h += '<div class="box"><h3>الدروس (' + esc(curP.nameAr) + ')</h3>';
    lessons().forEach(function (l) {
      var ws = wordsOf(l), m = ws.filter(isMastered).length;
      var pct = ws.length ? Math.round(m / ws.length * 100) : 0;
      h += '<div class="prow"><div class="ptitle">' + l.icon + ' ' + ar(l.titleAr) + '</div><div class="bar"><i style="width:' + pct + '%"></i></div><div class="pnum">' + m + '/' + ws.length + '</div></div>';
    });
    h += '</div>';
    var pr = Store.pron(), pk = Object.keys(pr);
    if (pk.length) {
      var good = pk.filter(function (k) { return pr[k].best >= 2; }).length;
      h += '<div class="box"><h3>🎤 النطق</h3>جرّبتي تنطقي ' + pk.length + ' كلمة، و' + good + ' منها طلعت «تمام».<div class="note">التقييم تقريبي أو من عندك.</div></div>';
    }
    var weakList = all.filter(isWeak).slice(0, 12);
    if (weakList.length) {
      h += '<div class="box"><h3>🔁 بدها مراجعة (' + weak + ')</h3>';
      weakList.forEach(function (w) {
        h += '<div class="wrow"><button class="spk-mini spk" data-say="' + esc(w.say) + '">🔊</button><b dir="ltr">' + esc(w.fr) + '</b><span>' + ar(w.m) + '</span></div>';
      });
      h += '<a class="go" href="#/quiz/weak">🔁 مراجعة هالكلمات</a></div>';
    }
    var ex = Store.exams();
    h += '<div class="box"><h3>📝 الامتحانات</h3>';
    if (!ex.length) h += 'ما في امتحانات لهلأ.';
    ex.slice(0, 8).forEach(function (e) {
      var d = new Date(e.ts);
      h += '<div class="wrow"><b>' + e.score + '/' + e.total + '</b><span>' + ar(e.title) + '</span><span class="note">' + d.getDate() + '/' + (d.getMonth() + 1) + '</span></div>';
    });
    h += '</div>';
    return h;
  }

  /* ---------- settings ---------- */
  var LINKS = {
    gemini: { n: 'Gemini (الأفضل للصور)', u: 'https://aistudio.google.com/apikey', how: 'بحساب Google: Create API key.' },
    groq: { n: 'Groq (سريع)', u: 'https://console.groq.com/keys', how: 'سجّل بحساب، ثم Create API Key.' },
    mistral: { n: 'Mistral', u: 'https://console.mistral.ai/api-keys', how: 'بدو تأكيد رقم هاتف، والخطة المجانية بتسمح لهم يستعملوا البيانات للتدريب.' },
    openrouter: { n: 'OpenRouter', u: 'https://openrouter.ai/keys', how: 'سجّل ثم Create Key. نماذجه المجانية محدودة باليوم.' }
  };
  function setupView() {
    var S = Store.settings();
    var h = '<a class="back" href="#/">⬅ الرئيسية</a><h2>🔧 الإعدادات</h2>';

    h += '<div class="box"><h3>🎧 الصوت الفرنسي</h3><div id="voicebox">...</div></div>';

    h += '<div class="box"><h3>🤖 الذكاء الاصطناعي (لأبو إبراهيم)</h3>' +
      '<div class="note">اختياري. بيحوّل صورة الدرس لدرس كامل. المفاتيح بتنحفظ على هالموبايل بس. يفضّل تجهيز مفتاح واحد على الأقل (Gemini)، والباقي احتياط.</div>';
    AI.ORDER.forEach(function (p) {
      var L = LINKS[p];
      h += '<div class="kbox"><label>' + esc(L.n) + '</label>' +
        '<input class="kin" type="password" dir="ltr" autocomplete="off" spellcheck="false" data-p="' + p + '" value="' + esc(S.keys[p] || '') + '" placeholder="API key">' +
        '<div class="btns"><button class="spk ktest" data-p="' + p + '">فحص</button>' +
        '<a class="spk slow klink" href="' + L.u + '" target="_blank" rel="noopener">جيب مفتاح</a></div>' +
        '<div class="note">' + esc(L.how) + '</div><div class="kstat" id="ks-' + p + '"></div></div>';
    });
    h += '<button class="go" id="savekeys">💾 حفظ المفاتيح</button>';
    h += '<details class="keys"><summary>نقل الإعداد لموبايل تاني</summary>' +
      '<div class="note">انسخ الرمز من هون والصقه بنفس الصفحة على موبايل الأم. الرمز فيه مفاتيحك، لا تشاركه مع حدا.</div>' +
      '<button class="spk" id="expcode">إظهار الرمز</button><textarea id="codebox" dir="ltr" rows="3" placeholder="FRSETUP1:..."></textarea>' +
      '<button class="spk slow" id="impcode">استيراد رمز</button></details></div>';

    h += '<div class="box"><h3>🎤 فحص النطق</h3>' +
      '<label class="tog"><input type="checkbox" id="stt"' + (S.onlineSTT ? ' checked' : '') + '> استعمال التعرّف الآلي بالإنترنت (بيرسل صوت الولد لـ Google)</label>' +
      '<div class="note">مطفي افتراضياً. وهو مطفي، بيتسجّل الصوت على الموبايل بس وبتقيّمي بنفسك. التقييم الآلي تقدير تقريبي وممكن يغلط.</div></div>';

    h += '<div class="box"><h3>🔊 الصوت الأساسي للموبايل</h3><div id="sysvoice"></div>' +
      '<ol><li>إعدادات الموبايل ← النظام ← اللغة وطرق الإدخال ← الإخراج الصوتي.</li><li>محرك Google ← تثبيت بيانات الصوت ← French (France).</li></ol>' +
      '<div class="note">أسماء القوائم بتختلف حسب الموبايل.</div></div>';

    h += '<div class="box"><h3>التقدّم</h3>التقدّم محفوظ على هالموبايل بس (لكل واحد: الأم وعبد الرحمن).' +
      '<br><button class="danger" id="reset">مسح تقدّم ' + (Store.profile() === 'son' ? 'عبد الرحمن' : 'الأم') + '</button></div>';
    h += '<div class="box"><h3>🔄 تحديث التطبيق</h3>النسخة الحالية: <b>' + APP_VERSION + '</b><div class="note" id="updinfo"></div>' +
      '<button class="spk" id="forceupd">فحص وتحديث هلأ</button>' +
      '<div class="note">بيحدّث ملفات التطبيق بس. المفاتيح والتقدّم والصوت المحمّل بتضل محفوظة.</div></div>';
    h += '<div class="note ver">النسخة ' + APP_VERSION + '</div>';
    return h;
  }

  function sysVoiceHtml() {
    var f = Voice.systemVoices(), best = Voice.bestSystemVoice();
    var h = '';
    if (!('speechSynthesis' in window)) h = 'هالمتصفح ما بيدعم الصوت.';
    else {
      h = 'عدد الأصوات الفرنسية بالموبايل: <b>' + f.length + '</b>';
      if (best) h += '<br>المستعمل: <b style="direction:ltr;unicode-bidi:isolate">' + esc(best.name) + '</b>';
    }
    return h;
  }

  function renderVoiceBox() {
    var box = $('voicebox'); if (!box) return;
    var sv = $('sysvoice'); if (sv) sv.innerHTML = sysVoiceHtml();
    if (!/^https?:$/.test(location.protocol)) {
      box.innerHTML = 'الصوت الأوضح بيشتغل بس لما يكون التطبيق مفتوح من رابط (HTTPS). هلأ عم يستعمل صوت الموبايل.' + testBtns();
      return;
    }
    Voice.packStatus().then(function (s) {
      if (!box.isConnected) return;
      if (s === 'ready') {
        var st = Voice.state();
        box.innerHTML = '✅ الصوت الأوضح محمّل وبيشتغل بدون إنترنت.' + (st.piper === 'failed' ? '<div class="note bad">صار خطأ بالتشغيل، عم يستعمل صوت الموبايل: ' + esc(st.err) + '</div>' : '') +
          testBtns() + '<button class="mini" id="rmpack">حذف الصوت المحمّل</button>';
      } else {
        var tot = Voice.PACK.reduce(function (a, p) { return a + p.mb; }, 0);
        box.innerHTML = 'بتحمّلي صوت فرنسي عصبي واضح (حوالي ' + Math.round(tot) + ' ميغا، مرة وحدة). ' +
          (freeHours() ? '<div class="note okc">✅ هلأ ضمن ساعات الإنترنت المجاني.</div>' : '<div class="note bad">⚠️ هلأ خارج ساعات الإنترنت المجاني (12 ليلاً – 10 صباحاً). الأحسن تحمّلي بالواي فاي بهالوقت.</div>') +
          '<button class="go" id="getpack">⬇️ حمّلي الصوت</button><div class="bar" id="pbar" hidden><i></i></div><div class="note" id="ptxt"></div>' + testBtns();
      }
    });
  }
  function testBtns() {
    return '<div class="btns"><button class="spk" data-say="Bonjour ! Je m\'appelle Abdul Rahman. J\'aime le français.">🔊 جرّبي الصوت</button>' +
      '<button class="spk slow" data-say="Bonjour ! Je m\'appelle Abdul Rahman. J\'aime le français." data-slow="1">🐢 بطيء</button></div>';
  }

  function readKeys() {
    var S = Store.settings();
    var ins = app.querySelectorAll('.kin');
    for (var i = 0; i < ins.length; i++) S.keys[ins[i].getAttribute('data-p')] = ins[i].value.trim();
    return S;
  }

  /* ---------- router ---------- */
  function route() {
    var parts = location.hash.replace(/^#\/?/, '').split('/');
    var v = parts[0] || 'home';
    var arg = parts[1] || '';
    var html;
    if (v !== 'lesson') Voice.stopPrewarm();
    if (v === 'lessons') html = lessonsView();
    else if (v === 'lesson') html = lessonView(arg);
    else if (v === 'practice') html = practiceView();
    else if (v === 'quiz') html = quizView(arg, false);
    else if (v === 'exam') html = arg ? quizView(arg, true) : examMenu();
    else if (v === 'progress') html = progressView();
    else if (v === 'scan') html = scanView();
    else if (v === 'setup') html = setupView();
    else html = homeView();
    if (v !== 'quiz' && !(v === 'exam' && arg)) Q = null;
    recorder = null;
    app.innerHTML = html;
    window.scrollTo(0, 0);
    if (v === 'home') afterHome();
    else if (v === 'lesson') afterLesson(arg);
    else if (v === 'setup') renderVoiceBox();
    else if (v === 'scan') showQueue();
    if (Q && Q.qs.length && (v === 'quiz' || (v === 'exam' && arg))) {
      var q = Q.qs[Q.i];
      if (q.type === 'listen-m' || q.type === 'listen-fr') setTimeout(function () { speak(q.w.say, false); }, 250);
    }
  }

  /* ---------- events ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t.closest) return;
    var c;
    if ((c = t.closest('.spk')) && c.hasAttribute('data-say')) { speak(c.getAttribute('data-say'), c.getAttribute('data-slow') === '1'); return; }
    if ((c = t.closest('.play-mine'))) { var u = lastRec[c.getAttribute('data-w')]; if (u) { var a = new Audio(u); a.play(); } return; }
    if ((c = t.closest('.rt'))) {
      Store.setPron(c.getAttribute('data-w'), parseInt(c.getAttribute('data-r'), 10));
      c.parentNode.innerHTML = '<div class="verdict">' + ['🔁 عيدي لحتى تصير أحسن', '🙂 حلو، كمّلي', '😊 برافو!'][parseInt(c.getAttribute('data-r'), 10)] + '</div>';
      return;
    }
    if ((c = t.closest('.rec'))) { onRecClick(c); return; }
    if ((c = t.closest('.opt'))) { answer(c); return; }
    if (t.closest('#next')) { nextQuestion(); return; }
    if (t.closest('#again')) { e.preventDefault(); route(); return; }
    if ((c = t.closest('.pchip'))) { Store.setProfile(c.getAttribute('data-profile')); reloadProg(); route(); return; }
    if (t.closest('#clearnotes')) { Store.clearNotices(); route(); return; }
    if (t.closest('#install')) { if (installEvt) { installEvt.prompt(); installEvt = null; } return; }
    if ((c = t.closest('[data-del]'))) {
      if (window.confirm('تحذفي هالدرس؟')) { Store.deleteCustomLesson(c.getAttribute('data-del')); location.hash = '#/lessons'; }
      return;
    }
    if (t.closest('#savelesson')) {
      if (scanState.lesson) {
        var ok = Store.addCustomLesson(scanState.lesson);
        if (!ok) { toast('الذاكرة ممتلئة، احذفي دروس قديمة'); return; }
        var id = scanState.lesson.id;
        scanState = { busy: false, preview: null, msg: '', lesson: null };
        location.hash = '#/lesson/' + id;
      }
      return;
    }
    if (t.closest('#dropscan')) { scanState = { busy: false, preview: null, msg: '', lesson: null }; refreshScan(); return; }
    if (t.closest('#retryq')) { toast('عم جرّب...'); processQueue(false).then(function () { showQueue(); }); return; }
    if (t.closest('#dropq')) {
      if (window.confirm('تمسحي الصور اللي بالانتظار؟')) Store.queueAll().then(function (a) { return Promise.all(a.map(function (x) { return Store.queueDelete(x.id); })); }).then(showQueue);
      return;
    }
    if (t.closest('#reset')) {
      if (window.confirm('تمسحي التقدّم المحفوظ؟')) { Store.resetProgress(); reloadProg(); Q = null; route(); }
      return;
    }
    if (t.closest('#savekeys')) { Store.saveSettings(readKeys()); toast('انحفظت المفاتيح ✅'); return; }
    if ((c = t.closest('.ktest'))) {
      var p = c.getAttribute('data-p');
      Store.saveSettings(readKeys());
      var ks = $('ks-' + p); ks.textContent = 'عم فحص...'; ks.className = 'kstat';
      AI.testKey(p).then(function (r) {
        if (r === 'busy') { ks.textContent = '⚠️ المفتاح تمام، بس الخدمة مشغولة هلأ. جرّب بعد شوي.'; ks.className = 'kstat'; }
        else { ks.textContent = '✅ شغّال'; ks.className = 'kstat okc'; }
      }).catch(function (er) {
        ks.textContent = '❌ ' + String(er.message || er).slice(0, 120); ks.className = 'kstat bad';
      });
      return;
    }
    if (t.closest('#forceupd')) {
      var inf = $('updinfo'); inf.textContent = 'عم فحص...';
      if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) { inf.textContent = 'التحديث بيشتغل بس من الرابط.'; return; }
      // drop ONLY the app-files cache and the service worker; keys, progress, voice and lessons stay
      caches.keys().then(function (ks) {
        return Promise.all(ks.filter(function (k) { return k.indexOf('fr-app-') === 0; }).map(function (k) { return caches.delete(k); }));
      }).then(function () { return navigator.serviceWorker.getRegistrations(); }).then(function (rs) {
        return Promise.all(rs.map(function (r) { return r.unregister(); }));
      }).then(function () { inf.textContent = 'تمام، عم أعيد التحميل...'; setTimeout(function () { location.reload(); }, 600); })
        .catch(function () { inf.textContent = 'ما زبط، سكّري التبويبات وافتحيه من جديد.'; });
      return;
    }
    if (t.closest('#expcode')) { $('codebox').value = Store.exportSetup(); return; }
    if (t.closest('#impcode')) {
      var ir = Store.importSetup($('codebox').value);
      if (ir.ok) { toast('تم الاستيراد ✅ (' + ir.n + ' مفاتيح)'); route(); }
      else { var cb = $('codebox'); cb.insertAdjacentHTML('afterend', '<div class="note bad" id="imperr"></div>'); var ie = document.querySelectorAll('#imperr'); for (var q = 0; q < ie.length - 1; q++) ie[q].remove(); $('imperr').textContent = ir.why; }
      return;
    }
    if (t.closest('#getpack')) {
      var bar = $('pbar'), txt = $('ptxt'), btn = $('getpack');
      if (!freeHours() && !window.confirm('هلأ خارج الإنترنت المجاني. التحميل حوالي 92 ميغا من باقتك. تكمّلي؟')) return;
      btn.disabled = true; bar.hidden = false;
      Voice.downloadPack(function (p) {
        bar.firstChild.style.width = Math.round(p.done / p.total * 100) + '%';
        txt.textContent = mb(p.done) + ' / ' + mb(p.total) + ' ميغا';
      }).then(function () { toast('✅ نزل الصوت'); renderVoiceBox(); }).catch(function (er) {
        btn.disabled = false; txt.className = 'note bad'; txt.textContent = 'ما نزل: ' + String(er.message || er).slice(0, 100) + ' — جرّبي مرة تانية.';
      });
      return;
    }
    if (t.closest('#rmpack')) { if (window.confirm('تحذفي الصوت المحمّل؟')) Voice.removePack().then(renderVoiceBox); return; }
  });
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.id === 'shot' || t.id === 'pick') { onPhoto(t.files && t.files[0]); t.value = ''; }
    if (t.id === 'stt') { var S = Store.settings(); S.onlineSTT = !!t.checked; Store.saveSettings(S); }
  });
  window.addEventListener('hashchange', route);

  Voice.init();
  route();
  // photos taken without internet become lessons by themselves
  setTimeout(function () { processQueue(true).then(function (n) { if (n && (location.hash === '' || location.hash === '#/')) route(); }); }, 1500);

  /* ---------- offline support + safe updates ---------- */
  var waitingSW = null;
  function showUpdate() {
    if ($('updbar')) return;
    var d = document.createElement('div');
    d.id = 'updbar'; d.className = 'updbar';
    d.innerHTML = '<span>🔄 في نسخة جديدة من التطبيق</span><button id="updnow">حدّثي هلأ</button>';
    document.body.appendChild(d);
  }
  document.addEventListener('click', function (e) {
    if (e.target && e.target.id === 'updnow' && waitingSW) { waitingSW.postMessage('SKIP_WAITING'); e.target.textContent = '...'; }
  });
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    var reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (reloading || !waitingSW) return;   // first install is not an update
      reloading = true; location.reload();
    });
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(function (reg) {
        function watch(r) { if (r.waiting && navigator.serviceWorker.controller) { waitingSW = r.waiting; showUpdate(); } }
        watch(reg);
        reg.addEventListener('updatefound', function () {
          var nw = reg.installing;
          if (nw) nw.addEventListener('statechange', function () { if (nw.state === 'installed' && navigator.serviceWorker.controller) { waitingSW = nw; showUpdate(); } });
        });
        reg.update().catch(function () { /* offline */ });
      }).catch(function () { /* silent */ });
      if (navigator.storage && navigator.storage.persist) { navigator.storage.persist().catch(function () {}); }
    });
  }
})();
