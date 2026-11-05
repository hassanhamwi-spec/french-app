/* store.js — everything is saved on THIS phone only (localStorage + IndexedDB). */
(function () {
  'use strict';

  function jget(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }

  var PROFILES = [
    { id: 'mom', nameAr: 'الأم', icon: '👩' },
    { id: 'son', nameAr: 'عبد الرحمن', icon: '👦' }
  ];

  var Store = { PROFILES: PROFILES };

  /* ---- profile ---- */
  Store.profile = function () {
    var p = jget('fr_profile', 'mom');
    return (p === 'son') ? 'son' : 'mom';
  };
  Store.setProfile = function (p) { jset('fr_profile', p === 'son' ? 'son' : 'mom'); };

  /* ---- progress (per profile) ---- */
  function progKey() { return 'fr_progress_v2_' + Store.profile(); }
  Store.progress = function () { return jget(progKey(), {}); };
  Store.saveProgress = function (p) { jset(progKey(), p); };
  Store.resetProgress = function () { try { localStorage.removeItem(progKey()); } catch (e) { /* ignore */ } };

  /* ---- exam history (per profile) ---- */
  function examKey() { return 'fr_exams_v1_' + Store.profile(); }
  Store.exams = function () { return jget(examKey(), []); };
  Store.addExam = function (e) {
    var a = Store.exams();
    a.unshift(e);
    jset(examKey(), a.slice(0, 40));
  };

  /* ---- pronunciation self ratings (per profile): word -> {r:0..2, t:ts} ---- */
  function pronKey() { return 'fr_pron_v1_' + Store.profile(); }
  Store.pron = function () { return jget(pronKey(), {}); };
  Store.setPron = function (word, r) {
    var p = Store.pron();
    var o = p[word] || { best: 0, n: 0 };
    o.n++; o.last = r; o.best = Math.max(o.best, r); o.t = Date.now();
    p[word] = o;
    jset(pronKey(), p);
  };


  /* ---- days practiced (per profile) ---- */
  function daysKey() { return 'fr_days_v1_' + Store.profile(); }
  function dayStr(d) { return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  Store.touchDay = function () {
    var a = jget(daysKey(), []);
    var t = dayStr(new Date());
    if (a.indexOf(t) < 0) { a.push(t); jset(daysKey(), a.slice(-90)); }
  };
  Store.streak = function () {
    var a = jget(daysKey(), []);
    var n = 0, d = new Date();
    if (a.indexOf(dayStr(d)) < 0) d.setDate(d.getDate() - 1);   // today not done yet: count from yesterday
    while (a.indexOf(dayStr(d)) >= 0) { n++; d.setDate(d.getDate() - 1); }
    return n;
  };
  Store.daysCount = function () { return jget(daysKey(), []).length; };

  /* ---- small notices (e.g. "a queued photo became a lesson") ---- */
  Store.notices = function () { return jget('fr_notices_v1', []); };
  Store.addNotice = function (n) { var a = Store.notices(); a.unshift(n); jset('fr_notices_v1', a.slice(0, 10)); };
  Store.clearNotices = function () { jset('fr_notices_v1', []); };

  /* ---- settings (API keys stay on this phone) ---- */
  var DEFAULT_MODELS = {
    gemini: ['gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-2.5-flash'],
    groq: ['meta-llama/llama-4-scout-17b-16e-instruct'],
    mistral: ['mistral-small-latest', 'pixtral-12b-latest'],
    openrouter: ['openrouter/free']
  };
  Store.DEFAULT_MODELS = DEFAULT_MODELS;
  Store.settings = function () {
    var s = jget('fr_settings_v1', {});
    s.keys = s.keys || {};
    s.models = s.models || {};
    s.onlineSTT = !!s.onlineSTT;
    s.autoVoice = (s.autoVoice !== false);
    return s;
  };
  Store.saveSettings = function (s) { jset('fr_settings_v1', s); };

  /* ---- custom lessons created from photos ---- */
  Store.customLessons = function () { return jget('fr_custom_lessons_v1', []); };
  Store.saveCustomLessons = function (a) { return jset('fr_custom_lessons_v1', a); };
  Store.addCustomLesson = function (l) {
    var a = Store.customLessons();
    a.unshift(l);
    return Store.saveCustomLessons(a);
  };
  Store.deleteCustomLesson = function (id) {
    Store.saveCustomLessons(Store.customLessons().filter(function (l) { return l.id !== id; }));
  };

  /* ---- photo queue (IndexedDB; photos taken without internet wait here) ---- */
  var dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise(function (res, rej) {
      if (!window.indexedDB) { rej(new Error('no idb')); return; }
      var r = indexedDB.open('fr_db', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('queue', { keyPath: 'id' }); };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
    return dbp;
  }
  function tx(mode, fn) {
    return db().then(function (d) {
      return new Promise(function (res, rej) {
        var t = d.transaction('queue', mode);
        var out = fn(t.objectStore('queue'));
        t.oncomplete = function () { res(out && out.result !== undefined ? out.result : undefined); };
        t.onerror = function () { rej(t.error); };
      });
    });
  }
  Store.queueAdd = function (item) { return tx('readwrite', function (s) { return s.put(item); }); };
  Store.queueAll = function () { return tx('readonly', function (s) { return s.getAll(); }); };
  Store.queueDelete = function (id) { return tx('readwrite', function (s) { return s.delete(id); }); };

  /* ---- backup code: lets the father set keys once and paste them on the mother's phone ---- */
  Store.exportSetup = function () {
    var s = Store.settings();
    var o = { v: 1, keys: s.keys, models: s.models };
    return 'FRSETUP1:' + btoa(unescape(encodeURIComponent(JSON.stringify(o))));
  };
  Store.importSetup = function (code) {
    code = String(code || '').trim();
    if (code.indexOf('FRSETUP1:') !== 0) return false;
    try {
      var o = JSON.parse(decodeURIComponent(escape(atob(code.slice(9)))));
      var s = Store.settings();
      s.keys = o.keys || {};
      s.models = o.models || {};
      Store.saveSettings(s);
      return true;
    } catch (e) { return false; }
  };

  window.Store = Store;
})();
