importScripts('browser-storage.js');
const store=self.TacticalBrowserStorage;
const version='browser-f9f4adabe66ebec3';
// The site may live in a subfolder (GitHub Pages); every route below is relative to it.
const base=new URL(self.registration.scope).pathname;
const local=pathname=>'/'+(pathname.startsWith(base)?pathname.slice(base.length):pathname.replace(/^\//,''));
const core=[base+'templates.json',base+'texts-ru.json'];
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
self.addEventListener('install',event=>event.waitUntil((async()=>{await (await caches.open(version)).addAll(core);await self.skipWaiting();})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('browser-')&&key!==version)await caches.delete(key);await self.clients.claim();})()));
async function resource(url){
  const cache=await caches.open(version),cached=await cache.match(url);
  return cached||fetch(url);
}
async function payload(request){
  const raw=await request.text();
  if(raw.length>100*1024*1024)throw Error('Файл слишком большой');
  return (request.headers.get('content-type')||'').includes('application/json')?JSON.parse(raw||'{}'):Object.fromEntries(new URLSearchParams(raw));
}
function parameter(html,key,value){return html.replace(new RegExp("(id=['\"]input_param__"+key+"['\"][^>]*>)[^<]*"),'$1'+String(value).replaceAll('&','&amp;').replaceAll('<','&lt;'));}
async function navigate(url){
  const library=await store.read(),parts=local(url.pathname).split('/').filter(Boolean),entry=library.links[parts.at(-1)];
  const board=entry?.board||(store.views.includes(parts[1])?parts[1]:store.views[0]),page=parts.includes('animation')?'animation':entry?.page||'main';
  const templates=await (await resource(base+'templates.json')).json();
  let html=templates[board];
  for(const [key,value] of Object.entries({site_url:url.origin+base.replace(/\/$/,''),ajax_url:base+'ajax',static_url:base+'static',board_key:board,page_key:page,link_token:entry?parts.at(-1):'',conference_link_token:'',conference_websocket_address:'',login_google_url:'',login_facebook_url:'',no_tips:1,add_to_browser_history:0}))html=parameter(html,key,value);
  return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; frame-src 'none'; object-src 'none'; base-uri 'self'"}});
}
async function handle(request,url){
  const route=decodeURIComponent(local(url.pathname)),method=request.method;
  try{
    if(method!=='GET'&&request.headers.get('origin')&&request.headers.get('origin')!==url.origin)return json({error:'Foreign origin'},403);
    if(route==='/local/items'&&method==='GET')return json((await store.read()).items);
    if(route==='/local/backup'&&method==='GET')return json({format:'tactical-board-collection',version:1,created:new Date().toISOString(),items:(await store.read()).items});
    if(route.startsWith('/local/'))return json(await store.mutate(route,method,await payload(request)),method==='POST'?201:200);
    if(route.startsWith('/ajax/')){
      const action=route.split('/').at(-1);
      if(action==='texts')return json(await (await resource(base+'texts-ru.json')).json());
      if(action==='accountDetails')return json('unauthorized');
      if(action==='getTips')return json([]);
      if(action==='getStoredInfo')return json((await store.read()).links[(await payload(request)).linkToken]?.data||'not_found');
      if(action==='storeLinkData')return json(await store.mutate(route,method,await payload(request)));
      if(['abs','logError','logMovie'].includes(action))return json('success');
      return json({error:'Функция недоступна в браузерной версии'},400);
    }
    if(request.mode==='navigate')return navigate(url);
    return fetch(request);
  }catch(e){return request.mode==='navigate'?new Response('<html lang="ru"><meta charset="utf-8"><p>Не удалось открыть доску. Проверьте, что браузер разрешает хранение данных сайта, и обновите страницу.</p></html>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8'}}):json({error:e.message},400);}
}
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url),route=local(url.pathname);
  if(url.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'||route.startsWith('/local/')||route.startsWith('/ajax/'))event.respondWith(handle(event.request,url));
});
