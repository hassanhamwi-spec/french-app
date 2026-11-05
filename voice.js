/* voice.js — French sound.
   1) Better voice: Piper (neural voice, runs inside the phone, works offline once downloaded).
   2) Fallback: the phone's own French text-to-speech.
   Also: recording the child's voice + an ESTIMATED pronunciation score. */
(function () {
  'use strict';

  var VOICE_CACHE = 'fr-voice-v1';
  var TTS_CACHE = 'fr-tts-v1';
  var MODEL_NAME = 'fr_FR-siwis-medium';
  var HF_BASE = 'https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/siwis/medium/';
  var PACK = [
    { f: 'voice/ort.wasm.min.js', mb: 0.14, local: true },
    { f: 'voice/ort-wasm-simd.wasm', mb: 10.6, local: true },
    { f: 'voice/piper_phonemize.js', mb: 0.12, local: true },
    { f: 'voice/piper_phonemize.wasm', mb: 0.6, local: true },
    { f: 'voice/piper_phonemize.data', mb: 18.1, local: true },
    { f: 'voice/' + MODEL_NAME + '.onnx.json', mb: 0.01, hf: HF_BASE + MODEL_NAME + '.onnx.json' },
    { f: 'voice/' + MODEL_NAME + '.onnx', mb: 63, hf: HF_BASE + MODEL_NAME + '.onnx' }
  ];

  var Voice = { PACK: PACK, MODEL_NAME: MODEL_NAME };
  var state = { piper: 'unknown', err: '' };   // unknown | none | ready | loading | failed
  var cur = null;                               // current <audio>

  /* ---------- phone's own voice (fallback) ---------- */
  var sysVoices = [];
  function refreshVoices() {
    if (!('speechSynthesis' in window)) return;
    sysVoices = window.speechSynthesis.getVoices() || [];
  }
  function lang(v) { return (v.lang || '').toLowerCase().replace('_', '-'); }
  Voice.systemVoices = function () { return sysVoices.filter(function (v) { return lang(v).indexOf('fr') === 0; }); };
  Voice.bestSystemVoice = function () {
    var f = Voice.systemVoices();
    if (!f.length) return null;
    var fr = f.filter(function (v) { return lang(v) === 'fr-fr'; });
    var pool = fr.length ? fr : f;
    var local = pool.filter(function (v) { return v.localService; });
    return local[0] || pool[0];
  };
  function speakSystem(text, slow) {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = 'fr-FR';
      var v = Voice.bestSystemVoice();
      if (v) u.voice = v;
      u.rate = slow ? 0.5 : 0.85;
      window.speechSynthesis.speak(u);
    } catch (e) { /* ignore */ }
  }
  if ('speechSynthesis' in window) {
    refreshVoices();
    window.speechSynthesis.onvoiceschanged = refreshVoices;
  }

  /* ---------- Piper pack management ---------- */
  function hasCaches() { return typeof caches !== 'undefined' && /^https?:$/.test(location.protocol); }

  Voice.packStatus = function () {
    if (!hasCaches()) { state.piper = 'none'; return Promise.resolve('none'); }
    return caches.open(VOICE_CACHE).then(function (c) {
      return Promise.all(PACK.map(function (p) { return c.match(p.f); }));
    }).then(function (all) {
      var ok = all.every(function (r) { return !!r; });
      if (ok && state.piper !== 'loading' && state.piper !== 'failed') state.piper = 'ready';
      if (!ok) state.piper = 'none';
      return ok ? 'ready' : 'none';
    }).catch(function () { state.piper = 'none'; return 'none'; });
  };
  Voice.state = function () { return state; };

  function fetchWithProgress(url, onBytes) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      var reader = r.body && r.body.getReader ? r.body.getReader() : null;
      if (!reader) return r.blob().then(function (b) { onBytes(b.size); return b; });
      var chunks = [];
      function pump() {
        return reader.read().then(function (x) {
          if (x.done) return new Blob(chunks, { type: r.headers.get('Content-Type') || 'application/octet-stream' });
          chunks.push(x.value); onBytes(x.value.length);
          return pump();
        });
      }
      return pump();
    });
  }

  // progress callback gets {done, total, file}
  Voice.downloadPack = function (onProgress) {
    if (!hasCaches()) return Promise.reject(new Error('يحتاج التطبيق يكون مفتوح من رابط (HTTPS)'));
    var total = PACK.reduce(function (s, p) { return s + p.mb; }, 0) * 1048576;
    var done = 0;
    var cache;
    return caches.open(VOICE_CACHE).then(function (c) {
      cache = c;
      var chain = Promise.resolve();
      PACK.forEach(function (p) {
        chain = chain.then(function () {
          return cache.match(p.f).then(function (hit) {
            if (hit) { done += p.mb * 1048576; return; }
            var tried = false;
            function go(url) {
              return fetchWithProgress(url, function (n) {
                done += n;
                if (onProgress) onProgress({ done: Math.min(done, total), total: total, file: p.f });
              }).then(function (blob) {
                if (/\.html?$/.test(p.f) || (blob.type || '').indexOf('text/html') === 0) throw new Error('bad type');
                return cache.put(p.f, new Response(blob, { headers: { 'Content-Type': blob.type || 'application/octet-stream' } }));
              });
            }
            return go(p.f).catch(function (e) {
              if (p.hf && !tried) { tried = true; return go(p.hf); }
              throw e;
            });
          });
        });
      });
      return chain;
    }).then(function () { state.piper = 'ready'; return true; });
  };

  Voice.removePack = function () {
    state.piper = 'none'; session = null; cfg = null; ortReady = null;
    return hasCaches() ? caches.delete(VOICE_CACHE).then(function () { return caches.delete(TTS_CACHE); }) : Promise.resolve();
  };

  /* ---------- Piper engine ---------- */
  var ortReady = null, session = null, cfg = null, phonemizeReady = null;
  var lock = Promise.resolve();

  function loadScript(src) {
    return caches.open(VOICE_CACHE).then(function (c) { return c.match(src); }).then(function (r) {
      return r ? r.blob() : fetch(src).then(function (x) { return x.blob(); });
    }).then(function (b) {
      return new Promise(function (res, rej) {
        var s = document.createElement('script');
        s.src = URL.createObjectURL(b);
        s.onload = function () { res(); };
        s.onerror = function () { rej(new Error('script ' + src)); };
        document.head.appendChild(s);
      });
    });
  }
  function cachedBuffer(path) {
    return caches.open(VOICE_CACHE).then(function (c) { return c.match(path); }).then(function (r) {
      if (!r) throw new Error('missing ' + path);
      return r.arrayBuffer();
    });
  }
  function cachedUrl(path) {
    return caches.open(VOICE_CACHE).then(function (c) { return c.match(path); }).then(function (r) {
      if (r) return r.blob();
      return fetch(path).then(function (x) { if (!x.ok) throw new Error('missing ' + path); return x.blob(); });
    }).then(function (b) { return URL.createObjectURL(b); });
  }

  function initPiper() {
    if (ortReady) return ortReady;
    state.piper = 'loading';
    ortReady = Promise.all([loadScript('voice/ort.wasm.min.js'), loadScript('voice/piper_phonemize.js')]).then(function () {
      var ort = window.ort;
      ort.env.wasm.numThreads = 1;
      ort.env.wasm.simd = true;
      ort.env.wasm.proxy = false;
      return Promise.all([cachedUrl('voice/ort-wasm-simd.wasm'), cachedBuffer('voice/' + MODEL_NAME + '.onnx.json'), cachedBuffer('voice/' + MODEL_NAME + '.onnx')]);
    }).then(function (x) {
      var ort = window.ort;
      ort.env.wasm.wasmPaths = { 'ort-wasm-simd.wasm': x[0] };
      cfg = JSON.parse(new TextDecoder().decode(x[1]));
      return ort.InferenceSession.create(x[2], { executionProviders: ['wasm'] });
    }).then(function (s) {
      session = s; state.piper = 'ready'; return true;
    }).catch(function (e) {
      state.piper = 'failed'; state.err = String(e && e.message || e); ortReady = null; throw e;
    });
    return ortReady;
  }

  var urlCache = {};
  function phonemize(text) {
    return Promise.all([cachedUrl('voice/piper_phonemize.wasm'), cachedUrl('voice/piper_phonemize.data')]).then(function (u) {
      return new Promise(function (resolve, reject) {
        var lines = [];
        var t = setTimeout(function () { reject(new Error('phonemize timeout')); }, 30000);
        window.createPiperPhonemize({
          print: function (l) {
            lines.push(l);
            try { var o = JSON.parse(l); if (o && o.phoneme_ids) { clearTimeout(t); resolve(o.phoneme_ids); } } catch (e) { /* not json */ }
          },
          printErr: function () { /* warnings */ },
          locateFile: function (f) { return f.endsWith('.wasm') ? u[0] : (f.endsWith('.data') ? u[1] : f); }
        }).then(function (m) {
          m.callMain(['-l', cfg.espeak.voice, '--input', JSON.stringify([{ text: text.trim() }]), '--espeak_data', '/espeak-ng-data']);
        }).catch(reject);
      });
    });
  }

  function wav(float32, rate) {
    var n = float32.length, buf = new DataView(new ArrayBuffer(44 + n * 2));
    function str(o, s) { for (var i = 0; i < s.length; i++) buf.setUint8(o + i, s.charCodeAt(i)); }
    str(0, 'RIFF'); buf.setUint32(4, 36 + n * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
    buf.setUint32(16, 16, true); buf.setUint16(20, 1, true); buf.setUint16(22, 1, true);
    buf.setUint32(24, rate, true); buf.setUint32(28, rate * 2, true); buf.setUint16(32, 2, true); buf.setUint16(34, 16, true);
    str(36, 'data'); buf.setUint32(40, n * 2, true);
    for (var i = 0; i < n; i++) {
      var s = Math.max(-1, Math.min(1, float32[i]));
      buf.setInt16(44 + i * 2, s < 0 ? s * 32768 : s * 32767, true);
    }
    return new Blob([buf.buffer], { type: 'audio/wav' });
  }

  function synth(text, slow) {
    return initPiper().then(function () { return phonemize(text); }).then(function (ids) {
      var ort = window.ort;
      var scale = [cfg.inference.noise_scale, cfg.inference.length_scale * (slow ? 1.7 : 1.05), cfg.inference.noise_w];
      var feeds = {
        input: new ort.Tensor('int64', BigInt64Array.from(ids.map(function (i) { return BigInt(i); })), [1, ids.length]),
        input_lengths: new ort.Tensor('int64', BigInt64Array.from([BigInt(ids.length)]), [1]),
        scales: new ort.Tensor('float32', Float32Array.from(scale), [3])
      };
      if (cfg.speaker_id_map && Object.keys(cfg.speaker_id_map).length) {
        feeds.sid = new ort.Tensor('int64', BigInt64Array.from([BigInt(0)]), [1]);
      }
      return session.run(feeds);
    }).then(function (out) {
      return wav(out.output.data, cfg.audio.sample_rate);
    });
  }

  function ttsKey(text, slow) { return '/_tts/' + MODEL_NAME + '/' + (slow ? 's' : 'n') + '/' + encodeURIComponent(text); }

  // get audio blob for a text (from saved cache or freshly made)
  Voice.getAudio = function (text, slow) {
    var key = ttsKey(text, slow);
    var run = lock.then(function () {
      return caches.open(TTS_CACHE).then(function (c) {
        return c.match(key).then(function (hit) {
          if (hit) return hit.blob();
          return synth(text, slow).then(function (b) {
            return c.put(key, new Response(b, { headers: { 'Content-Type': 'audio/wav' } })).then(function () { return b; });
          });
        });
      });
    });
    lock = run.catch(function () { /* keep chain alive */ });
    return run;
  };

  function playBlob(b) {
    return new Promise(function (res) {
      try { if (cur) { cur.pause(); } } catch (e) { /* ignore */ }
      var a = new Audio(URL.createObjectURL(b));
      cur = a;
      a.onended = function () { res(); };
      a.onerror = function () { res(); };
      var p = a.play();
      if (p && p.catch) p.catch(function () { res(); });
    });
  }

  Voice.playBlob = playBlob;

  Voice.speak = function (text, slow) {
    try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
    if (state.piper === 'ready' && hasCaches()) {
      return Voice.getAudio(text, !!slow).then(playBlob).catch(function () {
        state.piper = 'failed';
        speakSystem(text, slow);
      });
    }
    speakSystem(text, slow);
    return Promise.resolve();
  };

  // make the sounds of a list of words ahead of time (low priority, one by one)
  var prewarmId = 0;
  Voice.prewarm = function (texts, onStep) {
    if (state.piper !== 'ready') return;
    var id = ++prewarmId;
    var i = 0;
    (function next() {
      if (id !== prewarmId || i >= texts.length) return;
      var t = texts[i++];
      Voice.getAudio(t, false).then(function () { return Voice.getAudio(t, true); }).then(function () {
        if (onStep) onStep(i, texts.length);
        setTimeout(next, 60);
      }).catch(function () { /* stop quietly */ });
    })();
  };
  Voice.stopPrewarm = function () { prewarmId++; };

  // diagnostic: loads the phonemizer (no voice model needed) and converts a French word to sound codes
  Voice.selfTest = function (text) {
    return loadScript('voice/piper_phonemize.js').then(function () {
      if (!cfg) cfg = { espeak: { voice: 'fr' } };
      return phonemize(text || 'bonjour');
    }).then(function (ids) { cfg = (session ? cfg : null); return ids; });
  };

  Voice.init = function () { return Voice.packStatus().then(function (s) { return s; }); };

  /* ---------- recording the child's voice + estimated score ---------- */
  var Pron = {};
  Pron.canRecord = function () {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  };
  Pron.startRec = function () {
    return navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      var rec = new MediaRecorder(stream);
      var chunks = [];
      rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      rec.start();
      return {
        stop: function () {
          return new Promise(function (res) {
            rec.onstop = function () {
              stream.getTracks().forEach(function (t) { t.stop(); });
              res(new Blob(chunks, { type: rec.mimeType || 'audio/webm' }));
            };
            try { rec.stop(); } catch (e) { res(null); }
          });
        }
      };
    });
  };
  Pron.sttSupported = function () { return !!(window.SpeechRecognition || window.webkitSpeechRecognition); };
  // online-only (the phone's recognizer sends the voice to Google); only used if turned on in settings
  Pron.listen = function () {
    return new Promise(function (resolve, reject) {
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) { reject(new Error('unsupported')); return; }
      var r = new SR();
      r.lang = 'fr-FR'; r.maxAlternatives = 5; r.interimResults = false; r.continuous = false;
      var got = false;
      r.onresult = function (e) {
        got = true;
        var alts = [];
        for (var i = 0; i < e.results[0].length; i++) alts.push(e.results[0][i].transcript);
        resolve(alts);
      };
      r.onerror = function (e) { reject(new Error(e.error || 'error')); };
      r.onend = function () { if (!got) resolve([]); };
      try { r.start(); } catch (e) { reject(e); }
    });
  };
  function norm(s) {
    return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function lev(a, b) {
    var m = a.length, n = b.length, d = [], i, j;
    for (i = 0; i <= m; i++) { d[i] = [i]; }
    for (j = 1; j <= n; j++) d[0][j] = j;
    for (i = 1; i <= m; i++) for (j = 1; j <= n; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    return d[m][n];
  }
  // 0..100 — a rough estimate only
  Pron.score = function (target, alts) {
    var t = norm(target);
    if (!t) return 0;
    var best = 0;
    (alts || []).forEach(function (a) {
      var x = norm(a);
      var sc = Math.round((1 - lev(t, x) / Math.max(t.length, x.length, 1)) * 100);
      if (sc > best) best = sc;
    });
    return best;
  };
  Pron.norm = norm;
  Pron.lev = lev;

  window.Voice = Voice;
  window.Pron = Pron;
})();
