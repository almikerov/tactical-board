/* Board background around the pitch: this field's own color, otherwise the default kept by defaults.js. */
(() => {
  const valid=value=>typeof value==='string'&&/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(value);
  let color=null;
  function set(value){
    if(value!==null&&value!==false&&value!==''&&value!==undefined&&!valid(value))throw Error('Введите цвет в формате #RRGGBB.');
    color=value||null;
    globalThis.TacticalLocal?.layout.resize();
  }
  globalThis.TacticalBackground={
    get:fallback=>color||globalThis.TacticalDefaults?.get().board||fallback,
    current:()=>color,
    set,
    // The old menu entry now leads to the shared colors window.
    choose(){globalThis.TacticalDefaults?.show();}
  };
})();
