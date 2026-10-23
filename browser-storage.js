/* Browser-only persistence. This file is shared by the service worker and tests. */
(() => {
  const views=['big-football','big-football-half','big-football-half-2','big-football-vertical','big-football-vertical-2','big-football-penalty','big-football-free'];
  const fail=message=>{throw Error(message);};
  const categories=value=>[...new Set((Array.isArray(value)?value:String(value||'').split(',')).map(v=>String(v).trim()).filter(Boolean))];
  function project(input){
    if(typeof input?.name!=='string'||!input.name.trim()||!views.includes(input.board)||!['main','animation'].includes(input.page)||!input.data||typeof input.data!=='object')fail('Некорректный проект');
    return {name:input.name.trim().slice(0,200),description:String(input.description||'').slice(0,2000),categories:categories(input.categories),board:input.board,page:input.page,data:input.data};
  }
  function applyMutation(library,route,method,input){
    if(route==='/local/items'&&method==='POST'){
      const item={...project(input),id:crypto.randomUUID(),created:new Date().toISOString()};
      library.items.unshift(item);library.links[item.id]={data:item.data,board:item.board,page:item.page,created:item.created};return item;
    }
    if(route.startsWith('/local/items/')){
      const id=route.slice('/local/items/'.length),index=library.items.findIndex(i=>i.id===id);
      if(index<0)fail('Схема не найдена');
      if(method==='DELETE'){library.items.splice(index,1);delete library.links[id];return {deleted:id};}
      if(method==='PATCH'){
        if(typeof input.name!=='string'||!input.name.trim())fail('Введите название');
        Object.assign(library.items[index],{name:input.name.trim().slice(0,200),description:String(input.description||'').slice(0,2000),categories:categories(input.categories),updated:new Date().toISOString()});return library.items[index];
      }
    }
    if(route==='/local/backup'&&method==='POST'){
      if(!Array.isArray(input?.items))fail('В файле нет коллекции');
      // Validate the entire backup before changing anything.
      const items=input.items.map(i=>({...project(i),id:/^[\w-]{1,100}$/.test(i.id||'')?i.id:crypto.randomUUID(),created:Number.isFinite(Date.parse(i.created))?new Date(i.created).toISOString():new Date().toISOString()}));
      let added=0;
      for(const item of items){
        if(library.items.some(i=>i.id===item.id))continue;
        library.items.push(item);library.links[item.id]={data:item.data,board:item.board,page:item.page,created:item.created};added++;
      }
      library.items.sort((a,b)=>String(b.created).localeCompare(String(a.created)));return {added,skipped:items.length-added};
    }
    if(route.startsWith('/ajax/')&&route.endsWith('/storeLinkData')){
      if(!/^[\w-]{1,100}$/.test(input.linkToken||''))fail('Некорректный идентификатор');
      const index=Number(input.dataPartIndex);if(!Number.isInteger(index)||index<0||index>100)fail('Некорректная часть проекта');
      const shorts={bf:views[0],sh:views[1],sj:views[2],sv:views[3],sb:views[4],sp:views[5]};
      const item=library.links[input.linkToken]||={parts:[],page:input.store==='animation'?'animation':'main',board:shorts[route.split('/').at(-2)]||views[0],created:new Date().toISOString()};
      item.parts[index]=input.dataPart;try{item.data=JSON.parse(item.parts.join(''));}catch{}
      return {token:input.linkToken};
    }
    fail('Операция не поддерживается');
  }
  let database;
  function open(){
    return database||=new Promise((resolve,reject)=>{
      const request=indexedDB.open('tactical-board-collection',1);
      request.onupgradeneeded=()=>request.result.createObjectStore('library');
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(Error('Браузер не разрешил хранение коллекции'));
    });
  }
  async function access(change){
    const db=await open();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction('library',change?'readwrite':'readonly'),store=tx.objectStore('library');
      const request=store.get('current');let result,error;
      request.onsuccess=()=>{
        try{
          const library=request.result||{items:[],links:{}};
          if(change){result=change(library);store.put(library,'current');}else result=library;
        }catch(e){error=e;tx.abort();}
      };
      tx.oncomplete=()=>resolve(result);
      tx.onabort=tx.onerror=()=>reject(error||Error('Не удалось сохранить коллекцию. Проверьте свободное место в браузере.'));
    });
  }
  self.TacticalBrowserStorage={views,project,applyMutation,read:()=>access(),mutate:(route,method,input)=>access(library=>applyMutation(library,route,method,input))};
})();
