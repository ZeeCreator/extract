async function embedRoute(request, reply) {
  const { url } = request.query;

  if (!url) {
    return reply.type('text/html').send(`<html><body><h2>Missing ?url= parameter</h2></body></html>`);
  }

  const apiUrl = `/api/extract?url=${encodeURIComponent(url)}`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <title>ZeroExtract Embed</title>
  <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; overflow: hidden; }
    #v { width: 100%; height: 100vh; display: block; object-fit: contain; background: #000; }
    #load { position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:#000; z-index:10; transition:opacity .4s; }
    #load.hide { opacity:0; pointer-events:none; }
    .sp { width:36px; height:36px; border-radius:50%; border:3px solid rgba(255,255,255,.08); border-top-color:#1db0ef; animation:s .8s linear infinite; }
    @keyframes s { to { transform:rotate(360deg); } }
    #play { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); width:64px; height:64px; background:rgba(29,176,239,.85); border:none; border-radius:50%; cursor:pointer; opacity:0; transition:opacity .3s; z-index:5; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); }
    #play sv { width:28px; height:28px; fill:#fff; margin-left:3px; }
    #play.show { opacity:1; }
    #ctrls { position:fixed; bottom:0; left:0; right:0; background:linear-gradient(transparent,rgba(0,0,0,.85)); padding:40px 12px 10px; opacity:0; transition:opacity .3s; z-index:6; }
    #ctrls.show { opacity:1; }
    #bar { width:100%; height:4px; background:rgba(255,255,255,.1); border-radius:3px; cursor:pointer; position:relative; margin-bottom:8px; }
    #fill { position:absolute; top:0; left:0; height:100%; background:linear-gradient(90deg,#1db0ef,#7c3aed); border-radius:3px; transition:width .05s linear; }
    #buf { position:absolute; top:0; left:0; height:100%; background:rgba(255,255,255,.08); border-radius:3px; }
    .rw { display:flex; align-items:center; justify-content:space-between; }
    .l,.r { display:flex; align-items:center; gap:4px; }
    .btn { background:none; border:none; color:#fff; cursor:pointer; width:34px; height:34px; border-radius:8px; display:flex; align-items:center; justify-content:center; }
    .btn:hover { background:rgba(255,255,255,.08); }
    .btn svg { width:18px; height:18px; fill:#fff; }
    #t { font-size:11px; color:rgba(255,255,255,.6); font-variant-numeric:tabular-nums; user-select:none; }
    #q { background:rgba(255,255,255,.06); color:#fff; border:1px solid rgba(255,255,255,.08); padding:2px 8px; border-radius:5px; font-size:10px; cursor:pointer; outline:none; display:none; }
    #q option { background:#1a1a1a; }
  </style>
</head>
<body>
  <div id="load"><div class="sp"></div></div>
  <button id="play"><svg viewBox="0 0 24 24" width="28" height="28" fill="#fff"><path d="M8 5v14l11-7z"/></svg></button>
  <video id="v" preload="auto" playsinline></video>
  <div id="ctrls">
    <div id="bar"><div id="buf"></div><div id="fill"></div></div>
    <div class="rw">
      <div class="l">
        <button class="btn" id="pb"><svg viewBox="0 0 24 24" id="pi"><path d="M8 5v14l11-7z"/></svg><svg viewBox="0 0 24 24" id="pai" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg></button>
        <span id="t">0:00 / 0:00</span>
      </div>
      <div class="r">
        <select id="q"></select>
        <button class="btn" id="fs"><svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg></button>
      </div>
    </div>
  </div>

  <script>
    var V=document.getElementById('v'), L=document.getElementById('load'), P=document.getElementById('play'), C=document.getElementById('ctrls');
    var PB=document.getElementById('pb'), PI=document.getElementById('pi'), PAI=document.getElementById('pai');
    var BA=document.getElementById('bar'), FI=document.getElementById('fill'), BU=document.getElementById('buf');
    var TI=document.getElementById('t'), QS=document.getElementById('q'), FS=document.getElementById('fs');
    var hls, streams=[], headers={}, hideTimer, seeking=false;

    function fmt(t){if(t==null||isNaN(t))return'0:00';var h=Math.floor(t/3600),m=Math.floor((t%3600)/60),s=Math.floor(t%60);return h?h+':'+(m<10?'0':'')+m+':'+(s<10?'0':'')+s:m+':'+(s<10?'0':'')+s;}
    function sc(){C.classList.add('show');clearTimeout(hideTimer);}
    function hc(){if(!V.paused)C.classList.remove('show');}
    function sr(){sc();hideTimer=setTimeout(hc,2500);}

    async function init(){
      try{
        var r=await fetch('${apiUrl}'),d=await r.json();
        if(!d.success)return;
        headers=d.headers||{};streams=d.streams||[];
        if(!streams.length)return;
        if(streams.length>1){QS.style.display='';streams.forEach(function(s,i){var o=document.createElement('option');o.value=i;o.textContent=s.quality||'auto';QS.appendChild(o);});}
        loadStream(streams[0].file);
      }catch(e){}
    }

    function loadStream(url){
      if(hls){hls.destroy();hls=null;}
      L.classList.remove('hide');
      var p=window.location.origin+'/proxy?url='+encodeURIComponent(url);
      if(headers.Referer)p+='&referer='+encodeURIComponent(headers.Referer);
      if(headers.Origin)p+='&origin='+encodeURIComponent(headers.Origin);
      if(Hls.isSupported()){
        hls=new Hls();hls.loadSource(p);hls.attachMedia(V);
        hls.on(Hls.Events.MANIFEST_PARSED,function(){L.classList.add('hide');V.play().catch(function(){});});
      }else if(V.canPlayType('application/vnd.apple.mpegurl')){
        L.classList.add('hide');V.src=p;V.play().catch(function(){});
      }
    }

    QS.onchange=function(){var i=this.value;if(streams[i])loadStream(streams[i].file);};

    V.onplay=function(){PI.style.display='none';PAI.style.display='';P.classList.remove('show');L.classList.add('hide');sr();};
    V.onpause=function(){PI.style.display='';PAI.style.display='none';if(V.currentTime>0)P.classList.add('show');sc();clearTimeout(hideTimer);};
    V.onclick=function(){V.paused?V.play():V.pause();};
    V.ondurationchange=function(){updT();};
    V.ontimeupdate=function(){if(!seeking&&V.duration){FI.style.width=(V.currentTime/V.duration*100)+'%';updT();}};
    V.onprogress=function(){if(V.buffered.length)BU.style.width=(V.buffered.end(V.buffered.length-1)/V.duration*100)+'%';};
    var waitTimer;
    V.onwaiting=function(){if(V.currentTime>0){waitTimer=setTimeout(function(){L.classList.remove('hide');},1200);}else{L.classList.remove('hide');}};
    V.onplaying=function(){clearTimeout(waitTimer);L.classList.add('hide');};
    V.oncanplay=function(){L.classList.add('hide');};
    V.onloadedmetadata=function(){updT();};

    function updT(){TI.textContent=fmt(V.currentTime)+' / '+fmt(V.duration);}

    PB.onclick=function(){V.paused?V.play():V.pause();};
    P.onclick=function(){V.play();};

    document.onmousemove=function(){sr();};
    document.onmouseleave=function(){hc();};

    BA.onclick=function(e){var r=this.getBoundingClientRect();V.currentTime=((e.clientX-r.left)/r.width)*V.duration;};
    BA.onmousedown=function(){seeking=true;};
    BA.onmouseup=function(){seeking=false;};
    BA.onmouseleave=function(){seeking=false;};
    BA.onmousemove=function(e){if(seeking){var p=Math.max(0,Math.min(1,(e.clientX-this.getBoundingClientRect().left)/this.getBoundingClientRect().width));FI.style.width=(p*100)+'%';}};

    FS.onclick=function(){if(!document.fullscreenElement){document.documentElement.requestFullscreen().catch(function(){})}else document.exitFullscreen();};

    document.onkeydown=function(e){switch(e.code){case'Space':e.preventDefault();V.paused?V.play():V.pause();break;case'ArrowLeft':V.currentTime=Math.max(0,V.currentTime-10);break;case'ArrowRight':V.currentTime=Math.min(V.duration||0,V.currentTime+10);break;case'KeyF':FS.click();break;}};
    V.addEventListener('contextmenu',function(e){e.preventDefault();});

    init();
  </script>
</body>
</html>`;

  return reply.type('text/html').send(html);
}

module.exports = embedRoute;
