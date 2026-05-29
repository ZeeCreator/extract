async function playerRoute(request, reply) {
  const { url } = request.query;

  if (!url) {
    return reply.type('text/html').send(`<html><body><h2>Missing ?url= parameter</h2><p>Usage: /player?url=https://nekowish.my.id/e/EXAMPLE</p></body></html>`);
  }

  const apiUrl = `/api/extract?url=${encodeURIComponent(url)}`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <title>ZeroExtract Player</title>
  <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    :root { --accent: #1db0ef; --accent2: #7c3aed; --bg: #0c0c0f; --surface: #141418; --border: #252530; }
    body { background: var(--bg); color: #eee; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-height: 100vh; display: flex; justify-content: center; overflow-x: hidden; -webkit-font-smoothing: antialiased; }
    .app { width: 100%; max-width: 1060px; padding: 24px 20px 40px; }

    .top-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 8px; }
    .logo { display: flex; align-items: center; gap: 10px; }
    .logo-icon { width: 30px; height: 30px; background: linear-gradient(135deg, var(--accent), var(--accent2)); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: #fff; }
    .logo-text { font-size: 15px; font-weight: 600; letter-spacing: 0.3px; }
    .logo-text span { color: var(--accent); }
    .top-tag { background: rgba(29,176,239,0.12); color: var(--accent); padding: 4px 14px; border-radius: 20px; font-size: 11px; border: 1px solid rgba(29,176,239,0.2); }

    .card { background: var(--surface); border-radius: 16px; border: 1px solid var(--border); overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5); position: relative; }

    .player-wrap { position: relative; background: #000; cursor: pointer; }
    .player-wrap video { width: 100%; display: block; max-height: 75vh; }
    .player-wrap:fullscreen, .player-wrap:-webkit-full-screen { width: 100vw; height: 100vh; background: #000; }
    .player-wrap:fullscreen video, .player-wrap:-webkit-full-screen video { max-height: 100vh; height: 100%; }
    .player-wrap::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.3)); }

    .center-play-btn { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%) scale(0.8); width: 72px; height: 72px; background: rgba(29,176,239,0.9); border: none; border-radius: 50%; cursor: pointer; opacity: 0; transition: all 0.35s cubic-bezier(0.34,1.56,0.64,1); display: flex; align-items: center; justify-content: center; z-index: 5; backdrop-filter: blur(4px); box-shadow: 0 8px 32px rgba(29,176,239,0.3); }
    .center-play-btn.visible { opacity: 1; transform: translate(-50%,-50%) scale(1); }
    .center-play-btn:hover { transform: translate(-50%,-50%) scale(1.06); background: var(--accent); }
    .center-play-btn svg { width: 30px; height: 30px; fill: #fff; margin-left: 4px; }

    .loading-overlay { position: absolute; inset: 0; background: #000; display: flex; align-items: center; justify-content: center; z-index: 4; transition: opacity 0.5s; }
    .loading-overlay.hidden { opacity: 0; pointer-events: none; }
    .spinner { width: 44px; height: 44px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.05); border-top-color: var(--accent); animation: spin 0.9s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-overlay .sub { position: absolute; bottom: 40px; color: rgba(255,255,255,0.3); font-size: 12px; letter-spacing: 1px; text-transform: uppercase; }

    .controls { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.92)); padding: 56px 16px 14px; opacity: 0; transition: opacity 0.35s; z-index: 6; }
    .controls.active, .player-wrap:hover .controls { opacity: 1; }

    .progress-area { width: 100%; margin-bottom: 10px; position: relative; }
    .progress-track { width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 4px; cursor: pointer; position: relative; transition: height 0.15s; }
    .progress-track:hover { height: 8px; }
    .progress-buffered { position: absolute; top: 0; left: 0; height: 100%; background: rgba(255,255,255,0.1); border-radius: 4px; transition: width 0.2s; }
    .progress-fill { position: absolute; top: 0; left: 0; height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent2)); border-radius: 4px; transition: width 0.05s linear; }
    .progress-thumb { position: absolute; top: 50%; width: 16px; height: 16px; background: #fff; border-radius: 50%; transform: translate(-50%,-50%) scale(0); transition: transform 0.15s; box-shadow: 0 2px 8px rgba(0,0,0,0.4); }
    .progress-track:hover .progress-thumb { transform: translate(-50%,-50%) scale(1); }
    .progress-hover { position: absolute; bottom: 100%; left: 0; transform: translateX(-50%); background: rgba(0,0,0,0.85); color: #fff; font-size: 11px; padding: 4px 8px; border-radius: 4px; white-space: nowrap; opacity: 0; pointer-events: none; margin-bottom: 8px; }
    .progress-track:hover .progress-hover { opacity: 1; }

    .controls-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .ctrl-group { display: flex; align-items: center; gap: 4px; }
    .ctrl-btn { background: none; border: none; color: #fff; cursor: pointer; width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; transition: background 0.15s; }
    .ctrl-btn:hover { background: rgba(255,255,255,0.08); }
    .ctrl-btn svg { width: 20px; height: 20px; fill: #fff; }

    .time-display { font-size: 12px; color: rgba(255,255,255,0.7); font-variant-numeric: tabular-nums; letter-spacing: 0.2px; user-select: none; }
    .time-sep { color: rgba(255,255,255,0.3); margin: 0 2px; }

    .vol-wrap { display: flex; align-items: center; gap: 6px; }
    .vol-slider { width: 0; overflow: hidden; transition: width 0.25s ease; }
    .vol-wrap:hover .vol-slider { width: 72px; }
    .vol-slider input { width: 72px; height: 4px; -webkit-appearance: none; background: rgba(255,255,255,0.15); border-radius: 3px; outline: none; }
    .vol-slider input::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%; background: #fff; cursor: pointer; }

    .qsel { background: rgba(255,255,255,0.06); color: #fff; border: 1px solid rgba(255,255,255,0.08); padding: 4px 10px; border-radius: 6px; font-size: 11px; cursor: pointer; outline: none; appearance: none; -webkit-appearance: none; }
    .qsel option { background: #1a1a1a; color: #fff; }

    .info-footer { display: flex; gap: 24px; margin-top: 16px; padding: 0 4px; flex-wrap: wrap; }
    .info-item { font-size: 12px; color: rgba(255,255,255,0.35); }
    .info-item strong { color: rgba(255,255,255,0.6); font-weight: 500; margin-right: 4px; }
    .info-item span { color: rgba(255,255,255,0.5); }

    .err-box { background: rgba(255,50,50,0.08); border: 1px solid rgba(255,50,50,0.2); border-radius: 10px; padding: 16px 20px; margin-top: 16px; color: #f55; font-size: 13px; display: none; }

    .pip-btn { display: none; }
    @supports (picture-in-picture) { .pip-btn { display: flex; } }

    @media (max-width: 640px) {
      .app { padding: 12px 10px 24px; }
      .top-bar { margin-bottom: 12px; }
      .logo-text { font-size: 13px; }
      .player-wrap video { max-height: 50vh; }
      .controls { padding: 40px 10px 10px; }
      .ctrl-btn { width: 34px; height: 34px; }
      .ctrl-btn svg { width: 18px; height: 18px; }
      .vol-wrap { display: none; }
      .qsel { font-size: 10px; padding: 3px 8px; }
      .info-footer { gap: 12px; font-size: 11px; }
      .center-play-btn { width: 56px; height: 56px; }
      .center-play-btn svg { width: 24px; height: 24px; }
    }
  </style>
</head>
<body>
  <div class="app">
    <div class="top-bar">
      <div class="logo">
        <div class="logo-icon">Z</div>
        <div class="logo-text">Zero<span>Extract</span> Player</div>
      </div>
      <span class="top-tag" id="providerTag">Loading...</span>
    </div>

    <div class="card">
      <div class="player-wrap" id="playerWrap">
        <video id="video" preload="auto" playsinline></video>

        <div class="loading-overlay" id="loadingOverlay">
          <div style="text-align:center">
            <div class="spinner"></div>
            <div class="sub">Loading Stream</div>
          </div>
        </div>

        <button class="center-play-btn" id="centerPlay">
          <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </button>

        <div class="controls active" id="controls">
          <div class="progress-area">
            <div class="progress-track" id="progressTrack">
              <div class="progress-buffered" id="bufferBar"></div>
              <div class="progress-fill" id="progressFill"></div>
              <div class="progress-thumb" id="progressThumb"></div>
              <div class="progress-hover" id="progressHover">0:00</div>
            </div>
          </div>
          <div class="controls-row">
            <div class="ctrl-group">
              <button class="ctrl-btn" id="playBtn">
                <svg id="playIcon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                <svg id="pauseIcon" viewBox="0 0 24 24" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              </button>
              <div class="vol-wrap">
                <button class="ctrl-btn" id="muteBtn">
                  <svg id="volHi" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                  <svg id="volMid" viewBox="0 0 24 24" style="display:none"><path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/></svg>
                  <svg id="volOff" viewBox="0 0 24 24" style="display:none"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                </svg></svg></svg></svg></svg></svg></svg></svg></svg></svg></svg></svg></svg></svg></svg></svg></svg></svg></svg></svg></svg></svg></svg>
              </button>
              <div class="vol-slider">
                <input type="range" id="volRange" min="0" max="1" step="0.05" value="1">
              </div>
            </div>
            <span class="time-display" id="timeCurrent">0:00</span>
            <span class="time-sep">/</span>
            <span class="time-display" id="timeDuration">0:00</span>
          </div>
          <div class="ctrl-group">
            <button class="ctrl-btn pip-btn" id="pipBtn" title="Picture in Picture">
              <svg viewBox="0 0 24 24"><path d="M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z"/></svg>
            </button>
            <select class="qsel" id="qsel" style="display:none"></select>
            <button class="ctrl-btn" id="fsBtn" title="Fullscreen">
              <svg id="fsIcon" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="info-footer">
      <div class="info-item"><strong>Provider</strong> <span id="infoProvider">-</span></div>
      <div class="info-item"><strong>Quality</strong> <span id="infoQuality">-</span></div>
      <div class="info-item"><strong>Resolution</strong> <span id="infoRes">-</span></div>
      <div class="info-item"><strong>Volume</strong> <span id="infoVol">100%</span></div>
    </div>

    <div class="err-box" id="errBox"></div>
  </div>

  <script>
    var apiUrl = '${apiUrl}';
    var V = document.getElementById('video');
    var PW = document.getElementById('playerWrap');
    var CO = document.getElementById('controls');
    var LO = document.getElementById('loadingOverlay');
    var CP = document.getElementById('centerPlay');
    var PB = document.getElementById('playBtn');
    var PI = document.getElementById('playIcon');
    var PAI = document.getElementById('pauseIcon');
    var TR = document.getElementById('progressTrack');
    var BF = document.getElementById('bufferBar');
    var PF = document.getElementById('progressFill');
    var PT = document.getElementById('progressThumb');
    var PH = document.getElementById('progressHover');
    var TC = document.getElementById('timeCurrent');
    var TD = document.getElementById('timeDuration');
    var MB = document.getElementById('muteBtn');
    var VH = document.getElementById('volHi');
    var VM = document.getElementById('volMid');
    var VO = document.getElementById('volOff');
    var VR = document.getElementById('volRange');
    var FS = document.getElementById('fsBtn');
    var FI = document.getElementById('fsIcon');
    var QS = document.getElementById('qsel');
    var PIP = document.getElementById('pipBtn');
    var IP = document.getElementById('infoProvider');
    var IQ = document.getElementById('infoQuality');
    var IR = document.getElementById('infoRes');
    var IV = document.getElementById('infoVol');
    var EB = document.getElementById('errBox');
    var PTAG = document.getElementById('providerTag');

    var hls, streams = [], headers = {}, seeking = false, hideTimer;

    function fmt(t) { if (t==null||isNaN(t)) return '0:00'; var h=Math.floor(t/3600), m=Math.floor((t%3600)/60), s=Math.floor(t%60); return h?h+':'+(m<10?'0':'')+m+':'+(s<10?'0':'')+s:m+':'+(s<10?'0':'')+s; }

    function err(m) { EB.textContent = m; EB.style.display = 'block'; }

    function showCtrls() { CO.classList.add('active'); clearTimeout(hideTimer); }
    function hideCtrls() { if (!V.paused) CO.classList.remove('active'); }
    function ctrlReset() { showCtrls(); hideTimer = setTimeout(hideCtrls, 3000); }

    function loadStream(url) {
      if (hls) { hls.destroy(); hls = null; }
      LO.classList.remove('hidden');
      var p = window.location.origin + '/proxy?url=' + encodeURIComponent(url);
      if (headers.Referer) p += '&referer=' + encodeURIComponent(headers.Referer);
      if (headers.Origin) p += '&origin=' + encodeURIComponent(headers.Origin);

      if (Hls.isSupported()) {
        hls = new Hls();
        hls.loadSource(p);
        hls.attachMedia(V);
        hls.on(Hls.Events.MANIFEST_PARSED, function() { LO.classList.add('hidden'); V.play().catch(function(){}); });
        hls.on(Hls.Events.LEVEL_SWITCHED, function(e,d) {
          var l = hls.levels[d.level];
          if (l) IR.textContent = l.width+'x'+l.height;
        });
        hls.on(Hls.Events.ERROR, function(e,d) { if (d.fatal) err('HLS: '+d.details); });
      } else if (V.canPlayType('application/vnd.apple.mpegurl')) {
        V.src = p; V.play().catch(function(){});
      } else { err('HLS not supported'); }
    }

    async function init() {
      try {
        var r = await fetch(apiUrl), d = await r.json();
        if (!d.success) { err(d.error||'Failed'); LO.classList.add('hidden'); return; }
        headers = d.headers || {};
        PTAG.textContent = d.provider || '?';
        IP.textContent = d.provider || '-';
        streams = d.streams || [];
        if (!streams.length) { err('No streams'); LO.classList.add('hidden'); return; }
        if (streams.length > 1) {
          QS.style.display = '';
          streams.forEach(function(s,i) { var o=document.createElement('option'); o.value=i; o.textContent=s.quality||'auto'; QS.appendChild(o); });
        }
        IQ.textContent = streams[0].quality||'auto';
        loadStream(streams[0].file);
      } catch(e) { err('Load failed'); LO.classList.add('hidden'); }
    }

    QS.onchange = function() {
      var s = streams[this.value];
      if (s) { IQ.textContent = s.quality||'auto'; loadStream(s.file); }
    };

    V.onplay = function() { PI.style.display='none'; PAI.style.display=''; CP.classList.remove('visible'); LO.classList.add('hidden'); ctrlReset(); };
    V.onpause = function() { PI.style.display=''; PAI.style.display='none'; if(V.currentTime>0) CP.classList.add('visible'); showCtrls(); clearTimeout(hideTimer); };
    V.onclick = function() { V.paused ? V.play() : V.pause(); };
    V.onseeking = function() { seeking = true; };

    V.ontimeupdate = function() {
      if (!seeking && V.duration) {
        var p = V.currentTime / V.duration * 100;
        PF.style.width = p + '%';
        PT.style.left = p + '%';
        TC.textContent = fmt(V.currentTime);
      }
    };
    V.ondurationchange = function() { TD.textContent = fmt(V.duration); };

    V.onprogress = function() {
      if (V.buffered.length) {
        var e = V.buffered.end(V.buffered.length-1);
        BF.style.width = (e / V.duration * 100) + '%';
      }
    };
    V.onloadedmetadata = function() { TD.textContent = fmt(V.duration); };
    var waitTimer;
    V.onwaiting = function() { if (V.currentTime > 0) { waitTimer = setTimeout(function(){ LO.classList.remove('hidden'); }, 1200); } else { LO.classList.remove('hidden'); } };
    V.onplaying = function() { clearTimeout(waitTimer); LO.classList.add('hidden'); };
    V.oncanplay = function() { LO.classList.add('hidden'); };
    V.onerror = function() { LO.classList.add('hidden'); err('Video load error'); };
    V.onvolumechange = function() { updateVol(); };

    PB.onclick = function() { V.paused ? V.play() : V.pause(); };
    CP.onclick = function() { V.play(); };

    PW.onmouseenter = showCtrls;
    PW.onmouseleave = function() { if (!V.paused) hideCtrls(); };
    PW.onmousemove = ctrlReset;

    TR.onclick = function(e) {
      var r = this.getBoundingClientRect();
      V.currentTime = ((e.clientX - r.left) / r.width) * V.duration;
    };
    TR.onmousedown = function(e) { seeking = true; };
    TR.onmouseup = function() { seeking = false; };
    TR.onmouseleave = function() { seeking = false; PH.style.opacity = 0; };
    TR.onmousemove = function(e) {
      var r = this.getBoundingClientRect(), p = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      PH.textContent = fmt(p * V.duration);
      PH.style.left = (p * 100) + '%';
      PH.style.opacity = 1;
      if (seeking) {
        PF.style.width = (p * 100) + '%';
        PT.style.left = (p * 100) + '%';
        TC.textContent = fmt(p * V.duration);
      }
    };

    MB.onclick = function() { V.muted = !V.muted; };

    function updateVol() {
      VR.value = V.muted ? 0 : V.volume;
      IV.textContent = Math.round((V.muted ? 0 : V.volume) * 100) + '%';
      VH.style.display = 'none'; VM.style.display = 'none'; VO.style.display = 'none';
      if (V.muted || V.volume === 0) VO.style.display = '';
      else if (V.volume < 0.5) VM.style.display = '';
      else VH.style.display = '';
    }
    VR.oninput = function() { V.volume = parseFloat(this.value); V.muted = false; };

    FS.onclick = function() {
      if (!document.fullscreenElement) { PW.requestFullscreen().catch(function(){}); }
      else { document.exitFullscreen(); }
    };
    document.onfullscreenchange = function() {
      FI.innerHTML = document.fullscreenElement
        ? '<path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>'
        : '<path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>';
    };

    PIP.onclick = function() {
      if (document.pictureInPictureElement) document.exitPictureInPicture();
      else V.requestPictureInPicture().catch(function(){});
    };

    document.onkeydown = function(e) {
      var tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      switch (e.code) {
        case 'Space': e.preventDefault(); V.paused ? V.play() : V.pause(); break;
        case 'ArrowLeft': V.currentTime = Math.max(0, V.currentTime - 10); break;
        case 'ArrowRight': V.currentTime = Math.min(V.duration||0, V.currentTime + 10); break;
        case 'ArrowUp': V.volume = Math.min(1, V.volume + 0.1); V.muted = false; updateVol(); break;
        case 'ArrowDown': V.volume = Math.max(0, V.volume - 0.1); updateVol(); break;
        case 'KeyF': FS.click(); break;
        case 'KeyM': MB.click(); break;
        case 'KeyP': PIP.click(); break;
      }
    };

    V.addEventListener('contextmenu', function(e) { e.preventDefault(); });

    init();
  </script>
</body>
</html>`;

  return reply.type('text/html').send(html);
}

module.exports = playerRoute;
