(async()=>{
  try{
    if(!('serviceWorker' in navigator))throw Error('Обновите браузер, чтобы открыть тактическую доску.');
    // The editor is served by our browser worker so saves never reach a public API.
    const controlled=new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));
    // The worker sits next to this script, so the site works from the domain root or a subfolder.
    const script=document.currentScript?.src||new URL('/boot.js',location.href).href;
    await navigator.serviceWorker.register(new URL('sw.js',script),{scope:new URL('./',script).pathname,updateViaCache:'none'});
    await navigator.serviceWorker.ready;
    if(!navigator.serviceWorker.controller)await controlled;
    location.reload();
  }catch(e){document.getElementById('status').textContent=e.message;document.getElementById('retry').hidden=false;}
})();
