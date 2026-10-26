const {app,BrowserWindow,Menu,ipcMain,safeStorage,shell}=require('electron');
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const REDIR='http://127.0.0.1:8888/callback';
const SC='user-read-playback-state user-modify-playback-state playlist-read-private playlist-read-collaborative user-library-read';
let cfg={},file;

const load=()=>{try{const b=fs.readFileSync(file);cfg=JSON.parse(safeStorage.isEncryptionAvailable()?safeStorage.decryptString(b):b.toString())}catch{cfg={}}};
const save=()=>{const s=JSON.stringify(cfg);fs.writeFileSync(file,safeStorage.isEncryptionAvailable()?safeStorage.encryptString(s):s)};

async function token(body){
  const r=await fetch('https://accounts.spotify.com/api/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:cfg.cid,...body})});
  const j=await r.json();
  if(!j.access_token)throw new Error(j.error_description||'Spotify login failed');
  cfg.at=j.access_token;cfg.exp=Date.now()+j.expires_in*1000-60000;
  if(j.refresh_token)cfg.rt=j.refresh_token;
  save();
}
const tok=async()=>{
  if(!cfg.rt)throw new Error('Not connected to Spotify');
  if(Date.now()>(cfg.exp||0))await token({grant_type:'refresh_token',refresh_token:cfg.rt});
  return cfg.at;
};

function login(){
  return new Promise((res,rej)=>{
    const v=crypto.randomBytes(48).toString('base64url');
    const ch=crypto.createHash('sha256').update(v).digest('base64url');
    let done=false;
    const srv=http.createServer(async(req,rs)=>{
      const u=new URL(req.url,REDIR);
      if(u.pathname!=='/callback'){rs.end();return}
      rs.setHeader('Content-Type','text/html; charset=utf-8');
      rs.end('<body style="font:18px system-ui;background:#111;color:#fff;display:grid;place-items:center;height:100vh;margin:0">You can close this tab and go back to Glass Player.</body>');
      if(done)return;done=true;srv.close();
      const code=u.searchParams.get('code');
      if(!code)return rej(new Error(u.searchParams.get('error')||'Login cancelled'));
      try{await token({grant_type:'authorization_code',code,redirect_uri:REDIR,code_verifier:v});res()}catch(e){rej(e)}
    });
    srv.on('error',e=>rej(new Error(e.code==='EADDRINUSE'?'Port 8888 is busy. Close the other program using it.':e.message)));
    srv.listen(8888,'127.0.0.1',()=>shell.openExternal('https://accounts.spotify.com/authorize?'+new URLSearchParams({client_id:cfg.cid,response_type:'code',redirect_uri:REDIR,scope:SC,code_challenge_method:'S256',code_challenge:ch})));
    setTimeout(()=>{if(!done){done=true;srv.close();rej(new Error('Login timed out'))}},300000);
  });
}

ipcMain.handle('cfg',()=>({cid:cfg.cid||'',hasKey:!!cfg.slkey,loggedIn:!!cfg.rt}));
ipcMain.handle('save',(_,o)=>{
  const cid=String(o.cid||'').trim();
  if(cid!==cfg.cid){delete cfg.rt;delete cfg.at;cfg.cid=cid}
  if(o.slkey)cfg.slkey=String(o.slkey).trim();
  save();
});
ipcMain.handle('login',login);
ipcMain.handle('sp',async(_,p,o={})=>{
  try{
    const r=await fetch('https://api.spotify.com/v1'+p,{...o,headers:{Authorization:'Bearer '+await tok(),'Content-Type':'application/json'}});
    const t=await r.text();let json=null;try{json=t?JSON.parse(t):null}catch{}
    return{status:r.status,json,msg:json?.error?.message,retry:r.headers.get('retry-after')};
  }catch(e){return{status:0,msg:e.message}}
});
ipcMain.handle('lyrics',async(_,id)=>{
  if(!/^[A-Za-z0-9]{22}$/.test(id)||!cfg.slkey)return{status:400};
  try{
    const r=await fetch('https://api.spicylyrics.org/v1/lyrics/'+id,{headers:{Authorization:'Bearer '+cfg.slkey}});
    return{status:r.status,json:await r.json().catch(()=>null)};
  }catch(e){return{status:0,msg:e.message}}
});
ipcMain.handle('lrclib',async(_,q)=>{
  const H={'User-Agent':'GlassPlayer/1.0'};
  try{
    let r=await fetch('https://lrclib.net/api/get?'+new URLSearchParams(q),{headers:H});
    let d=r.ok?await r.json():null;
    if(!d?.syncedLyrics){
      r=await fetch('https://lrclib.net/api/search?'+new URLSearchParams({track_name:q.track_name,artist_name:q.artist_name}),{headers:H});
      const a=r.ok?await r.json():[];d=a.find(x=>x.syncedLyrics)||d;
    }
    return d||null;
  }catch{return null}
});

app.whenReady().then(()=>{
  file=path.join(app.getPath('userData'),'settings.bin');load();
  Menu.setApplicationMenu(null);
  const w=new BrowserWindow({
    width:1180,height:760,minWidth:420,minHeight:560,backgroundColor:'#0b0c10',title:'Glass Player',
    titleBarStyle:'hidden',titleBarOverlay:{color:'rgba(0,0,0,0)',symbolColor:'#ffffff',height:44},
    webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true}
  });
  w.webContents.setWindowOpenHandler(({url})=>{if(/^https:\/\//.test(url))shell.openExternal(url);return{action:'deny'}});
  w.webContents.on('will-navigate',e=>e.preventDefault());
  w.loadFile('index.html');
});
app.on('window-all-closed',()=>app.quit());
