const {contextBridge,ipcRenderer:i}=require('electron');
contextBridge.exposeInMainWorld('api',{
  cfg:()=>i.invoke('cfg'),
  save:o=>i.invoke('save',o),
  login:()=>i.invoke('login'),
  sp:(p,o)=>i.invoke('sp',p,o),
  lyrics:id=>i.invoke('lyrics',id),
  lrclib:q=>i.invoke('lrclib',q)
});
