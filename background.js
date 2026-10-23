/* Account-free equivalent of the editor's board background preference. */
(() => {
  const key='tactical-board.background-color.v1';
  const valid=value=>typeof value==='string'&&/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(value);
  let color=null;
  try{const stored=localStorage.getItem(key);if(valid(stored))color=stored;}catch{}
  function set(value){
    if(value!==null&&value!==false&&value!==''&&!valid(value))throw Error('Введите цвет в формате #RRGGBB.');
    color=value||null;
    try{if(color)localStorage.setItem(key,color);else localStorage.removeItem(key);}catch{
      globalThis.TacticalLocal?.ui.notification('Цвет применён, но браузер запретил его сохранение.','warning');
    }
    globalThis.TacticalLocal?.layout.resize();
  }
  globalThis.TacticalBackground={
    get:fallback=>color||fallback,
    set,
    choose(){
      const ui=globalThis.TacticalLocal.ui;
      ui.chooseColor({removeColorButtonText:color?'Вернуть стандартный цвет':false,onColorChoose:value=>{
        try{set(value);}catch(error){ui.notification(error.message,'error');}
      }});
    }
  };
})();
