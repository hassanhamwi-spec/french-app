/* ai.js — OPTIONAL bonus. The app works fully without it.
   When there is internet and at least one free API key, a lesson photo is turned into a lesson.
   Providers are tried one after another (fallback chain); the user never sees the switching. */
(function () {
  'use strict';

  var AI = {};
  var ORDER = ['gemini', 'mistral', 'openrouter', 'groq'];
  var NAMES = { gemini: 'Gemini', mistral: 'Mistral', openrouter: 'OpenRouter', groq: 'Groq' };
  AI.ORDER = ORDER; AI.NAMES = NAMES;

  AI.hasKeys = function () {
    var k = window.Store.settings().keys;
    return ORDER.some(function (p) { return k[p] && k[p].length > 8; });
  };

  /* real internet check (navigator.onLine lies): a tiny request with a timeout */
  AI.online = function () {
    return new Promise(function (res) {
      var done = false;
      var t = setTimeout(function () { if (!done) { done = true; res(false); } }, 4000);
      var url = /^https?:/.test(location.protocol) ? 'manifest.webmanifest?ping=' + Date.now() : 'https://generativelanguage.googleapis.com/?ping=' + Date.now();
      fetch(url, { cache: 'no-store', mode: /^https?:/.test(location.protocol) ? 'same-origin' : 'no-cors' })
        .then(function () { if (!done) { done = true; clearTimeout(t); res(navigator.onLine !== false); } })
        .catch(function () { if (!done) { done = true; clearTimeout(t); res(false); } });
    });
  };

  var PROMPT =
    'You help a Lebanese Arabic-speaking mother (she does NOT know French) teach her 8-year-old son, Lebanese grade 2, from a photo of his textbook page (French language, or another subject taught in French).\n' +
    'Return ONLY one JSON object (no markdown, no comments) with exactly these keys:\n' +
    '{"titleAr": short Arabic title (Arabic words only, no Latin letters),\n' +
    ' "titleFr": the French title as on the page,\n' +
    ' "intro": 1-2 sentences in warm Lebanese Arabic: what this page is about,\n' +
    ' "script": 4 short steps in Lebanese Arabic telling the mother how to teach this page,\n' +
    ' "words": [ up to 25 important French words or short phrases from the page: {"fr": French text exactly as on the page, "say": the text to pronounce (same as fr unless it contains blanks or symbols), "p": how to pronounce it written in ARABIC LETTERS (approximate, careful with French sounds: u, r, ch, j, on/an/in/ou, silent letters), "m": the Arabic meaning, "ex": one very short French example sentence using it, "exAr": its Arabic translation} ],\n' +
    ' "instr": [ the instruction words in the exercises (like Relie, Entoure, Complète): {"fr","say","p","m"} ],\n' +
    ' "exercises": [ up to 6 multiple-choice questions to test the child from this page: {"q": the question in Arabic (French words allowed inside), "choices": [3 short answers], "a": index of the correct choice starting at 0} ],\n' +
    ' "keys": [ answers to the page exercises ONLY if you are sure: {"q","a"} ; otherwise an empty list ] }\n' +
    'Rules: be accurate; do not invent words that are not related to the page; Arabic meanings must be simple and child-friendly; if the image is unreadable return {"error":"unreadable"}.';

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function withTimeout(promise, ms) {
    return new Promise(function (res, rej) {
      var t = setTimeout(function () { rej(new Error('timeout')); }, ms);
      promise.then(function (v) { clearTimeout(t); res(v); }, function (e) { clearTimeout(t); rej(e); });
    });
  }
  function parseDataUrl(u) {
    var m = /^data:([^;]+);base64,(.*)$/.exec(u);
    return { mime: m[1], b64: m[2] };
  }
  function httpErr(r, body) {
    var e = new Error('HTTP ' + r.status + ' ' + String(body || '').slice(0, 160));
    e.status = r.status;
    return e;
  }

  /* ---- providers: each returns raw text ---- */
  function callGemini(key, model, img) {
    var d = parseDataUrl(img);
    var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent';
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: PROMPT }, { inline_data: { mime_type: d.mime, data: d.b64 } }] }],
        generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
      })
    }).then(function (r) {
      return r.text().then(function (t) {
        if (!r.ok) throw httpErr(r, t);
        var j = JSON.parse(t);
        var c = j.candidates && j.candidates[0];
        var parts = c && c.content && c.content.parts;
        if (!parts) throw new Error('empty');
        return parts.map(function (p) { return p.text || ''; }).join('');
      });
    });
  }
  function callOpenAIStyle(url, key, model, img, extraHeaders, jsonMode) {
    var h = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key };
    Object.keys(extraHeaders || {}).forEach(function (k) { h[k] = extraHeaders[k]; });
    var body = {
      model: model, temperature: 0.2,
      messages: [{ role: 'user', content: [{ type: 'text', text: PROMPT }, { type: 'image_url', image_url: { url: img } }] }]
    };
    if (jsonMode) body.response_format = { type: 'json_object' };
    return fetch(url, { method: 'POST', headers: h, body: JSON.stringify(body) }).then(function (r) {
      return r.text().then(function (t) {
        if (!r.ok) throw httpErr(r, t);
        var j = JSON.parse(t);
        var m = j.choices && j.choices[0] && j.choices[0].message;
        if (!m || !m.content) throw new Error('empty');
        return typeof m.content === 'string' ? m.content : m.content.map(function (x) { return x.text || ''; }).join('');
      });
    });
  }
  var CALLERS = {
    gemini: function (key, model, img) { return callGemini(key, model, img); },
    mistral: function (key, model, img) { return callOpenAIStyle('https://api.mistral.ai/v1/chat/completions', key, model, img, {}, true); },
    openrouter: function (key, model, img) { return callOpenAIStyle('https://openrouter.ai/api/v1/chat/completions', key, model, img, { 'X-Title': 'French app' }, false); },
    groq: function (key, model, img) { return callOpenAIStyle('https://api.groq.com/openai/v1/chat/completions', key, model, img, {}, true); }
  };

  /* ---- reading the answer safely ---- */
  function extractJson(text) {
    var s = String(text).replace(/```json|```/gi, '').trim();
    var a = s.indexOf('{'), b = s.lastIndexOf('}');
    if (a < 0 || b <= a) throw new Error('no json');
    return JSON.parse(s.slice(a, b + 1));
  }
  function str(x, max) { return (typeof x === 'string') ? x.trim().slice(0, max || 200) : ''; }
  function cleanWord(w) {
    if (!w || typeof w !== 'object') return null;
    var fr = str(w.fr, 80);
    if (!fr) return null;
    var o = { fr: fr, say: str(w.say, 80) || fr, p: str(w.p, 80), m: str(w.m, 120) };
    if (!o.p || !o.m) return null;
    var ex = str(w.ex, 140), exAr = str(w.exAr, 160);
    if (ex) { o.ex = ex; o.exAr = exAr; }
    return o;
  }
  function sanitize(j, provider) {
    if (!j || j.error) throw new Error(j && j.error ? j.error : 'bad');
    var words = (Array.isArray(j.words) ? j.words : []).map(cleanWord).filter(Boolean).slice(0, 30);
    var instr = (Array.isArray(j.instr) ? j.instr : []).map(cleanWord).filter(Boolean).slice(0, 20);
    if (words.length < 2) throw new Error('few words');
    var exs = [];
    (Array.isArray(j.exercises) ? j.exercises : []).slice(0, 8).forEach(function (e) {
      if (!e || !Array.isArray(e.choices) || e.choices.length < 2) return;
      var ch = e.choices.map(function (c) { return str(c, 80); }).filter(Boolean).slice(0, 4);
      var a = parseInt(e.a, 10);
      if (ch.length < 2 || isNaN(a) || a < 0 || a >= ch.length) return;
      var q = str(e.q, 200);
      if (q) exs.push({ q: q, choices: ch, a: a });
    });
    var keys = [];
    (Array.isArray(j.keys) ? j.keys : []).slice(0, 20).forEach(function (k) {
      if (k && str(k.q, 200) && str(k.a, 300)) keys.push({ q: str(k.q, 200), a: str(k.a, 300) });
    });
    var script = (Array.isArray(j.script) ? j.script : []).map(function (s) { return str(s, 240); }).filter(Boolean).slice(0, 6);
    var colors = ['#5c6bc0', '#00897b', '#ef6c00', '#ad1457', '#6d4c41', '#039be5'];
    var id = 'u' + Date.now().toString(36);
    return {
      id: id, custom: true, ai: provider, ts: Date.now(),
      book: 'من الكاميرا', icon: '📸', color: colors[Math.floor(Math.random() * colors.length)],
      titleAr: str(j.titleAr, 80) || 'درس جديد',
      titleFr: str(j.titleFr, 100),
      intro: str(j.intro, 400) || 'درس جديد من كتاب عبد الرحمن.',
      script: script.length ? script : ['اقري الكلمات بصوت عالي مع التطبيق.', 'خلي ابنك يعيدها وراكي.', 'جرّبوا التمرين مع بعض.'],
      words: words, instr: instr, exercises: exs, keys: keys
    };
  }

  /* ---- the fallback chain ---- */
  // Returns {lesson, provider, tried:[...]} or throws Error with .tried
  AI.lessonFromPhoto = function (imageDataUrl, onStatus) {
    var S = window.Store.settings();
    var tried = [];
    var chain = Promise.resolve(null);
    ORDER.forEach(function (p) {
      var key = S.keys[p];
      if (!key || key.length < 8) return;
      var models = (S.models[p] && S.models[p].length) ? S.models[p] : window.Store.DEFAULT_MODELS[p];
      models.forEach(function (model) {
        chain = chain.then(function (found) {
          if (found) return found;
          if (onStatus) onStatus(NAMES[p]);
          return withTimeout(CALLERS[p](key, model, imageDataUrl), 60000).then(function (text) {
            return { lesson: sanitize(extractJson(text), NAMES[p]), provider: NAMES[p], model: model };
          }).catch(function (e) {
            tried.push(NAMES[p] + ': ' + String(e && e.message || e).slice(0, 120));
            // rate limit → wait a moment, then move on to the next one
            if (e && (e.status === 429 || e.status === 503)) return sleep(800).then(function () { return null; });
            return null;
          });
        });
      });
    });
    return chain.then(function (found) {
      if (found) { found.tried = tried; return found; }
      var err = new Error(tried.length ? 'all failed' : 'no keys');
      err.tried = tried;
      throw err;
    });
  };

  /* ---- shrink a photo before sending (saves data + quota) ---- */
  AI.shrink = function (file, maxSide, quality) {
    maxSide = maxSide || 1600; quality = quality || 0.82;
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight;
        var k = Math.min(1, maxSide / Math.max(w, h));
        var c = document.createElement('canvas');
        c.width = Math.round(w * k); c.height = Math.round(h * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        res(c.toDataURL('image/jpeg', quality));
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('image')); };
      img.src = url;
    });
  };

  /* lets the settings page test a single key quickly.
     Resolves 'ok' (works), 'busy' (key is fine, the service is overloaded / out of free quota right now).
     Rejects when the key itself looks wrong. Tries every model of that provider before giving up. */
  AI.testKey = function (p) {
    var S = window.Store.settings();
    var key = S.keys[p];
    if (!key) return Promise.reject(new Error('no key'));
    var models = (S.models[p] && S.models[p].length) ? S.models[p] : window.Store.DEFAULT_MODELS[p];
    var tiny = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    var oldPrompt = PROMPT; PROMPT = 'Reply with {"ok":true}';
    var busy = false, lastErr = null;
    var chain = Promise.resolve(null);
    models.forEach(function (m) {
      chain = chain.then(function (done) {
        if (done) return done;
        return withTimeout(CALLERS[p](key, m, tiny), 30000).then(function () { return 'ok'; }, function (e) {
          if (e && (e.status === 429 || e.status === 503 || e.message === 'timeout')) busy = true; else lastErr = e;
          return null;
        });
      });
    });
    return chain.then(function (r) {
      PROMPT = oldPrompt;
      if (r) return r;
      if (busy) return 'busy';
      throw lastErr || new Error('failed');
    });
  };

  window.AI = AI;
})();
