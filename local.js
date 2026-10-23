/* Local services around the unmodified rendering and editing model. */
(() => {
  'use strict';
  window.onFSPopupClosed = () => {};
  const app=()=>window.TacticalLocal;
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const api=async(url,init)=>{const r=await fetch(url,init);const v=await r.json();if(!r.ok)throw Error(v.error||'Ошибка сохранения');return v;};
  function project(){const a=app();return {format:'tactical-board-local',version:1,board:a.context.inputParams.board_key,page:a.pages.currentPage,data:JSON.parse(JSON.stringify(a.pages.currentPageObject))};}
  async function restoreProject(p,name){
    if(p.format!=='tactical-board-local'||p.version!==1||!p.data||!['main','animation'].includes(p.page))throw Error('Неизвестный формат проекта');
    const item=await api('/tactical-board/local/items',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...p,name:p.name||name||'Схема',description:p.description||'',categories:p.categories||[]})});
    location.href='/tactical-board/'+(p.page==='animation'?'animation/':'')+item.id;
  }
  function modal(content){
    document.getElementById('menu_panel').classList.add('hidden');document.getElementById('menu_panel_background_layer').hidden=true;
    app().ui.showModalWindow({content:'<div class="local-panel" data-allow-native-context-menu data-allow-select>'+content+'</div>'});
  }
  function download(name,content,type='application/json'){
    const url=URL.createObjectURL(content instanceof Blob?content:new Blob([content],{type}));const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
  }
  function info(){modal('<h2>Тактическая доска</h2><p>Создавайте схемы и анимации, сохраняйте их в локальную коллекцию или в файл.</p><p>Закладка над полем сохраняет отдельную копию текущей работы. Кнопка «Моя коллекция» открывает сохранённые схемы. Для переноса на другой компьютер используйте экспорт и импорт JSON.</p><button data-local="collection">Открыть коллекцию</button><button data-local="export">Экспорт проекта</button>');}
  const collectionManager=()=>app().context.collectionsManager;
  let collectionItems=[];
  async function loadCollection(){
    collectionItems=await api('/tactical-board/local/items');
    const manager=collectionManager();
    manager._userCollection={schemes:[],animations:[]};
    for(const item of collectionItems){
      const store=item.page==='animation'?'animations':'schemes';
      manager._userCollection[store].push({...item,board_key:item.board,name:escape(item.name),description:escape(item.description),categories:(item.categories||[]).map(escape)});
    }
    for(const store of manager._stores){
      const values=[...new Set(manager._userCollection[store].flatMap(i=>i.categories))].sort((a,b)=>a.localeCompare(b,'ru'));
      manager._categories[store]=new Set(values.length?['',...values]:[]);
    }
  }
  function hideMenu(){
    document.getElementById('menu_panel').classList.add('hidden');
    document.getElementById('menu_panel_background_layer').hidden=true;
  }
  async function saveForm(values={}){
    await loadCollection();hideMenu();
    const texts=app().context.texts,page=app().pages.currentPage;
    app().ui.showModalWindow({content:`
      <div data-action="show-user-collection" class="add-to-collection-my-collection-link">${texts.collection_my_collection}</div><div style="clear:both"></div>
      <div class="collection-name"><span>${texts['collection_enter_name_'+page]}:</span><div><input id="local-name" maxlength="200" autocomplete="off" value="${escape(values.name)}"></div></div>
      <div class="collection-description"><span>${texts.collection_description}:</span><div><textarea id="local-description" maxlength="2000" data-not-submit-by-enter-key="true">${escape(values.description)}</textarea></div></div>
      <div class="collection-categories"><span>${texts.collection_categories}:</span><div><input id="local-categories" data-role="collection-item-input-categories" data-not-submit-by-enter-key="true" maxlength="1000" autocomplete="off" placeholder="${escape(texts.collection_categories_example)}" value="${escape(values.categories)}"></div></div>`,
      btnOkLabel:texts.collection_add_to_collection,
      onOk:()=>{
        const values={name:document.getElementById('local-name').value.trim(),description:document.getElementById('local-description').value,categories:document.getElementById('local-categories').value};
        if(!values.name){saveForm(values).then(()=>document.getElementById('local-name').classList.add('incorrect-value'));return;}
        api('/tactical-board/local/items',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...project(),...values})})
          .then(()=>app().ui.notification('Сохранено в локальную коллекцию','success')).catch(e=>app().ui.notification(e.message,'error'));
      },onClose:()=>document.getElementById('collections_categories_input_helper')?.remove()});
    document.getElementById('local-name').focus();
  }
  async function collection(preserve=false){
    const manager=collectionManager();
    const filters=preserve?manager._filters:null;
    const active=preserve?document.querySelector('#collection_list > div > .active')?.id:null;
    await loadCollection();hideMenu();
    // Render the original collection window and retain its styles and input helpers.
    manager._showUserCollectionModalWindow();
    for(const row of document.querySelectorAll('#collection_list [data-collection-item-id]')){
      const item=collectionItems.find(i=>i.id===row.dataset.collectionItemId);
      row.querySelector('a').href='/tactical-board/'+(item.page==='animation'?'animation/':'')+encodeURIComponent(item.id);
      row.querySelector('[data-role="collection-item-input-name"]').maxLength=200;
      row.querySelector('[data-role="collection-item-input-description"]').maxLength=2000;
      const exportButton=document.createElement('button');exportButton.className='collection-json-export';exportButton.dataset.local='download-item';exportButton.dataset.id=item.id;exportButton.textContent='JSON';exportButton.title='Скачать проект JSON';
      row.querySelector('.collection-list-item-info').appendChild(exportButton);
    }
    const footer=document.createElement('div');footer.className='collection-local-footer';
    footer.innerHTML='<span>Локальная коллекция · без ограничения количества</span><button data-local="import">Импорт JSON</button>';
    document.getElementById('collection_list').appendChild(footer);
    if(filters){
      for(const store of manager._stores)if(!manager._categories[store].has(escape(filters.categories[store])))filters.categories[store]='';
      manager._filters=filters;document.getElementById('collection_list_search').value=filters.searchKeyword;
    }
    if(active)selectCollectionTab(active.replace('collection_list_header_',''));
    filterCollection();
  }
  function selectCollectionTab(store){
    for(const key of ['schemes','animations']){
      document.getElementById('collection_list_header_'+key).classList.toggle('active',key===store);
      document.getElementById('collection_list_body_'+key).hidden=key!==store;
    }
  }
  function filterCollection(){
    collectionManager()._filterCollectionItems();
    for(const body of document.querySelectorAll('#collection_list [id^="collection_list_body_"]')){
      body.querySelector('.collection-no-data-label').hidden=!!body.querySelector('[data-collection-item-id]:not([hidden])');
    }
  }
  async function editCollectionItem(row){
    const name=row.querySelector('[data-role="collection-item-input-name"]');
    if(!name.value.trim()){name.classList.add('incorrect-value');name.focus();return;}
    await api('/tactical-board/local/items/'+encodeURIComponent(row.dataset.collectionItemId),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:name.value,description:row.querySelector('[data-role="collection-item-input-description"]').value,categories:row.querySelector('[data-role="collection-item-input-categories"]').value})});
    await collection(true);
  }
  // Capture collection clicks before the original account-only event handler.
  document.addEventListener('click',async event=>{
    const list=event.target.closest('#collection_list');if(!list)return;
    if(event.target.closest('[data-local],[data-browser]'))return;
    event.stopImmediatePropagation();
    const target=event.target,manager=collectionManager(),row=target.closest('[data-collection-item-id]');
    const category=target.closest('[data-action="show-collection-category"]');
    try{
      if(category){event.preventDefault();manager._showCollectionCategory(category.dataset.collectionStore,category.dataset.collectionCategory);filterCollection();}
      else if(target.id.startsWith('collection_list_header_'))selectCollectionTab(target.id.replace('collection_list_header_',''));
      else if(target.dataset.action==='show-edit-collection-item-interface')manager._showEditCollectionItemInterface(row);
      else if(target.dataset.role==='collection-item-button-cancel')manager._hideEditCollectionItemInterface();
      else if(target.dataset.action==='remove-from-collection')manager._showDeleteCollectionInterface(row);
      else if(target.dataset.action==='confirm-deletion-from-collection'){
        await api('/tactical-board/local/items/'+encodeURIComponent(row.dataset.collectionItemId),{method:'DELETE'});await collection(true);
      }else if(target.dataset.action==='edit-collection-item')await editCollectionItem(row);
    }catch(e){app().ui.notification(e.message,'error');}
  },true);
  document.addEventListener('input',event=>{if(event.target.id==='collection_list_search'){
    collectionManager()._filters.searchKeyword=event.target.value;filterCollection();
  }});
  function importProject(){
    const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=async()=>{try{
      const file=input.files[0];if(!file)return;if(file.size>12*1024*1024)throw Error('Файл слишком большой');
      const p=JSON.parse(await file.text());
      await restoreProject(p,file.name.replace(/\.json$/i,''));
    }catch(e){app().ui.notification(e.message,'error');}};input.click();
  }
  function animationExport(){modal('<h2>Скачать анимацию</h2><p>Видео и HTML создаются в браузере. Во время записи оставьте вкладку открытой.</p><button data-local="video">Сохранить видео</button><button data-local="html">Сохранить HTML</button><button data-local="export">Сохранить проект JSON</button>');}
  function htmlAnimation(frames,duration){
    const payload=JSON.stringify({frames,duration}).replace(/</g,'\\u003c');
    return '<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Тактическая анимация</title><style>body{margin:0;background:#738554;color:#ffffce;font:16px Arial;text-align:center}img{display:block;margin:24px auto 16px;max-width:96vw;max-height:80vh}button,input{margin:8px}button{padding:8px 20px}input[type=range]{width:45vw}</style><img id="pitch" alt="Тактическая анимация"><button id="play">Пауза</button><input id="seek" type="range" min="0" max="1000" value="0" aria-label="Позиция"><label><input id="loop" type="checkbox" checked>Повторять</label><script>const data='+payload+';const picture=document.getElementById("pitch"),play=document.getElementById("play"),seek=document.getElementById("seek"),loop=document.getElementById("loop");let playing=true,time=0,previous=performance.now();function render(){let frame=data.frames[0];for(const f of data.frames){if(f.t>time)break;frame=f}picture.src=frame.src;seek.value=time/data.duration*1000}play.onclick=()=>{playing=!playing;play.textContent=playing?"Пауза":"Воспроизвести";if(time>=data.duration)time=0};seek.oninput=()=>{time=seek.value/1000*data.duration;render()};function tick(now){if(playing){time+=now-previous;if(time>=data.duration){if(loop.checked)time%=data.duration;else{time=data.duration;playing=false;play.textContent="Воспроизвести"}}render()}previous=now;requestAnimationFrame(tick)}render();requestAnimationFrame(tick);<\/script></html>';
  }
  async function video(htmlOnly=false){
    const a=app(),manager=a.pages.currentPageObject._animationManager;
    if(!manager || manager.framesCount<2){a.ui.notification('Добавьте кадр и перемещение игрока','warning');return;}
    const mime=htmlOnly?'text/html':['video/mp4;codecs=avc1.42001E','video/webm;codecs=vp9','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));
    if(!mime)throw Error('Браузер не поддерживает запись видео');
    a.ui.closeModalWindow();manager.stop();
    const repeat=manager.repeat;manager.repeat=false;manager.currentFrameIndex=1;
    const svg=document.getElementById('svg_canvas');
    const canvas=document.createElement('canvas');const ctx=canvas.getContext('2d');
    const chunks=[],frames=[];let recorder,stream,started;
    try{
      const frame=async()=>{
        const src=await a.svg.saveAsImage(svg,{type:'png',cropPoints:a.context.boardCropper.getCropPoints()});
        if(htmlOnly){frames.push({t:started?performance.now()-started:0,src});return;}
        const img=new Image();img.src=src;await img.decode();
        if(!canvas.width||!recorder){canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;}
        ctx.drawImage(img,0,0,canvas.width,canvas.height);
      };
      manager.play();if(!manager._running)return;manager.pause();
      await frame();let ended;
      if(!htmlOnly){stream=canvas.captureStream(24);recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:5000000});recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};ended=new Promise(resolve=>recorder.onstop=resolve);recorder.start();}
      started=performance.now();manager.play();
      a.ui.notification(htmlOnly?'Подготовка HTML…':'Запись видео…','success');
      const deadline=performance.now()+120000;
      while(manager._running && performance.now()<deadline){await frame();await new Promise(r=>setTimeout(r,32));}
      const duration=performance.now()-started;
      if(htmlOnly)download('tactical-board-animation.html',htmlAnimation(frames,duration),'text/html');
      else{recorder.stop();await ended;download('tactical-board.'+(mime.startsWith('video/mp4')?'mp4':'webm'),new Blob(chunks,{type:mime}));}
      a.ui.notification(htmlOnly?'HTML сохранён':'Видео сохранено','success');
    }finally{manager.stop();manager.repeat=repeat;stream?.getTracks().forEach(t=>t.stop());}
  }
  document.addEventListener('click',async event=>{
    const button=event.target.closest('[data-local],[data-action]');if(!button)return;
    const action=button.dataset.local||button.dataset.action;
    const handled=['login','user-account-details','show-pro-account-info-window','add-to-collection','show-user-collection','download-animation','collection','export','import','video','html','download-item','local-about'];
    if(!handled.includes(action))return;
    event.preventDefault();event.stopImmediatePropagation();
    if(button.disabled)return;button.disabled=true;
    try{
      if(['login','user-account-details','show-pro-account-info-window','local-about'].includes(action))info();
      else if(action==='add-to-collection')await saveForm();
      else if(['show-user-collection','collection'].includes(action))await collection();
      else if(action==='export')download('tactical-board-'+app().pages.currentPage+'.json',JSON.stringify(project(),null,2));
      else if(action==='import')importProject();
      else if(action==='download-animation')animationExport();
      else if(action==='video')await video();
      else if(action==='html')await video(true);
      else if(action==='download-item'){const item=(await api('/tactical-board/local/items')).find(i=>i.id===button.dataset.id);download(item.name+'.json',JSON.stringify({format:'tactical-board-local',version:1,...item},null,2));}
    }catch(e){app().ui.notification(e.message,'error');}finally{button.disabled=false;}
  },true);
  document.addEventListener('DOMContentLoaded',()=>{
    const button=document.createElement('button');button.type='button';button.dataset.local='collection';button.className='collection-toolbar-button';button.textContent='Моя коллекция';button.title='Открыть сохранённые схемы и анимации';document.querySelector('#top_buttons_panel > div:last-child').appendChild(button);
    const menu=document.getElementById('menu_panel');
    for(const [text,action] of [['Экспорт проекта JSON','export'],['Импорт проекта JSON','import']]){const d=document.createElement('div');d.className='menu-item';d.dataset.local=action;d.textContent=text;menu.appendChild(d);}
  });
  window.TacticalProjects={project,restoreProject,modal,escape,api};
})();
