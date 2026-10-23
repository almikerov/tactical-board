(() => {
  async function backup(){
    const data=await window.TacticalProjects.api('/tactical-board/local/backup');
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    const filename='tactical-board-collection-'+new Date().toISOString().slice(0,10)+'.json';
    window.TacticalProjects.modal('<h2>Резервная копия коллекции</h2><p>Схем и анимаций: '+data.items.length+'. Скачайте JSON, чтобы перенести их в другой браузер или сохранить копию.</p><a class="local-link" href="'+url+'" download="'+filename+'">Скачать резервную копию JSON</a>');
    setTimeout(()=>URL.revokeObjectURL(url),10*60000);
  }
  function importCollection(){
    const input=document.createElement('input');input.type='file';input.accept='.json,application/json';
    input.onchange=async()=>{
      try{
        const file=input.files[0];if(!file)return;if(file.size>100*1024*1024)throw Error('Файл больше 100 МБ');
        const data=JSON.parse(await file.text());
        if(!Array.isArray(data.items))throw Error('Выберите резервную копию коллекции или прежний data/library.json');
        const result=await window.TacticalProjects.api('/tactical-board/local/backup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
        window.TacticalLocal.ui.closeModalWindow();window.TacticalLocal.ui.notification('Импортировано схем: '+result.added+'. Уже были в коллекции: '+result.skipped,'success');
      }catch(e){window.TacticalLocal.ui.notification(e.message,'error');}
    };input.click();
  }
  document.addEventListener('click',async event=>{
    const button=event.target.closest('[data-browser]');if(!button)return;
    event.preventDefault();event.stopImmediatePropagation();
    try{if(button.dataset.browser==='backup')await backup();else if(button.dataset.browser==='restore')importCollection();}
    catch(e){window.TacticalLocal.ui.notification(e.message,'error');}
  },true);
  const observer=new MutationObserver(()=>{
    const footer=document.querySelector('.collection-local-footer');
    if(footer&&!footer.dataset.browserReady){
      footer.dataset.browserReady='true';
      footer.querySelector('span').textContent='Личная коллекция в этом браузере';
      footer.insertAdjacentHTML('beforeend','<button data-browser="backup">Резервная копия</button><button data-browser="restore">Импорт коллекции</button>');
    }
  });
  document.addEventListener('DOMContentLoaded',()=>{
    navigator.serviceWorker.getRegistration().then(registration=>registration?.update()).catch(()=>{});
    observer.observe(document.getElementById('modal_window'),{childList:true,subtree:true});
    const menu=document.getElementById('menu_panel');
    menu.insertAdjacentHTML('beforeend','<div class="menu-item" data-browser="backup">Скачать всю коллекцию</div><div class="menu-item" data-browser="restore">Импорт коллекции / library.json</div>');
  });
})();
