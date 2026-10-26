/* Field colors in one window behind the palette button: this field's colors and the defaults a new field starts from. */
(() => {
  'use strict';
  const app = window.TacticalLocal;
  if (!app) return;
  const storageKey = 'tactical-board.defaults.v2';
  const legacyKey = 'tactical-board.new-field-defaults.v1';
  const pendingKey = 'tactical-board.new-field-pending';
  const views = ['big-football', 'big-football-half', 'big-football-half-2', 'big-football-vertical', 'big-football-vertical-2', 'big-football-penalty', 'big-football-free'];
  // Out of the box the board is printer-friendly: white background and field, black markings.
  const builtIn = {view: 'big-football', board: '#ffffff', field: '#ffffff', markings: '#000000'};
  const labels = {board: 'фон доски', field: 'газон', markings: 'разметка'};
  const valid = value => typeof value === 'string' && /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(value);
  const params = () => app.context.inputParams;
  // Shared schemes and conferences carry their own look, so defaults never recolor them.
  const ownBoard = () => !params().link_token && !params().conference_link_token;

  function normalize(value) {
    const result = {...builtIn};
    if (value && views.includes(value.view)) result.view = value.view;
    for (const key of ['board', 'field', 'markings']) if (value && valid(value[key])) result[key] = value[key];
    return result;
  }
  function stored() {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey));
      if (value) return value;
      // Version 1.4 kept only the view and the field colors.
      const legacy = JSON.parse(localStorage.getItem(legacyKey));
      return legacy && {view: legacy.view, field: legacy.background, markings: legacy.markings};
    } catch (e) { return null; }
  }
  const get = () => normalize(stored());
  function set(value) {
    const defaults = normalize(value);
    try { localStorage.setItem(storageKey, JSON.stringify(defaults)); localStorage.removeItem(legacyKey); }
    catch (e) { app.ui.notification('Браузер запретил сохранить значения по умолчанию.', 'warning'); }
    return defaults;
  }

  // Colors of the open field; null means the board's original look.
  function current() {
    const config = app.context.boardConfig;
    const markings = valid(config.customMarkingsColor) && config.customMarkingsColor.toLowerCase() !== config.strokeColor.toLowerCase() ? config.customMarkingsColor : null;
    return {view: params().board_key, board: window.TacticalBackground.current(), field: valid(config.customSportBgColor) ? config.customSportBgColor : null, markings};
  }
  function paint(colors) {
    const config = app.context.boardConfig;
    if ('field' in colors) config.customSportBgColor = colors.field || false;
    if ('markings' in colors) config.customMarkingsColor = colors.markings || false;
    if ('board' in colors) window.TacticalBackground.set(colors.board);
    app.layout.resize();
  }
  const paintDefaults = defaults => paint({field: defaults.field, markings: defaults.markings, board: null});

  // Clearing the board is how a new field starts: it opens in the default view with the default colors.
  const reset = app.pages.reset;
  app.pages.reset = function () {
    const result = reset.apply(this, arguments), defaults = get();
    if (params().conference_link_token) return result;
    if (defaults.view !== params().board_key || params().link_token) {
      try { sessionStorage.setItem(pendingKey, app.pages.currentPage); } catch (e) {}
      location.href = params().site_url + '/ru/' + defaults.view + (app.pages.currentPage === 'animation' ? '/animation' : '');
    } else paintDefaults(defaults);
    return result;
  };

  const init = app.layout._initApplication;
  app.layout._initApplication = async function () {
    const result = await init.apply(this, arguments);
    let pending = null;
    try { pending = sessionStorage.getItem(pendingKey); sessionStorage.removeItem(pendingKey); } catch (e) {}
    // The view picked here may still hold an older scheme; the new field starts empty.
    if (pending && pending === app.pages.currentPage && ownBoard()) reset.call(app.pages);
    if (ownBoard()) paintDefaults(get());
    return result;
  };

  const viewClass = view => 'board-view-' + (view === 'big-football' ? 'big-football-horizontal' : view);
  function row(scope, key, color) {
    return `<div class="colors-row">
        <span>${labels[key]}</span>
        ${color ? `<i class="colors-swatch" style="background-color: ${color}"></i>` : '<em>исходный</em>'}
        <button type="button" data-colors="${scope}:${key}">Изменить</button>
      </div>`;
  }
  function show() {
    const defaults = get(), now = current();
    const thisField = {...now, board: now.board || defaults.board};
    app.ui.showModalWindow({content: `
      <div class="colors-window">
        <div class="colors-title">Цвета</div>
        <div class="colors-columns">
          <section>
            <h3>Это поле</h3>
            ${['board', 'field', 'markings'].map(key => row('current', key, thisField[key])).join('')}
            <div class="colors-actions"><button type="button" data-colors="current-defaults">Как по умолчанию</button></div>
          </section>
          <section>
            <h3>Значения по умолчанию</h3>
            <p class="colors-hint">С ними открывается доска и начинается новое поле — кнопкой «Очистить доску полностью».</p>
            ${['board', 'field', 'markings'].map(key => row('default', key, defaults[key])).join('')}
            <div class="colors-row"><span>вид поля</span></div>
            <div class="select-board-view colors-views"><div></div><div>${views.map(view => `<a class="${viewClass(view)}${view === defaults.view ? ' colors-selected' : ''}" data-colors-view="${view}" title="Новое поле в этом виде"><div></div></a>`).join('')}</div></div>
            <div class="colors-actions">
              <button type="button" data-colors="take-current">Взять с этого поля</button>
              <button type="button" data-colors="built-in">Стандартные</button>
            </div>
          </section>
        </div>
      </div>`, top: '2rem', onOk: () => {}, btnOkLabel: app.context.texts.close});
  }
  function chooseColor(scope, key) {
    const reset = scope === 'current' ? 'Как по умолчанию' : 'Стандартный';
    app.ui.chooseColor({removeColorButtonText: reset, onColorChoose: value => {
      const color = valid(value) ? value : null;
      if (scope === 'current') paint({[key]: color || (key === 'board' ? null : get()[key])});
      else set({...get(), [key]: color || builtIn[key]});
      show();
    }});
  }

  // The palette button next to the board opens this window instead of the original two-color one.
  document.addEventListener('click', event => {
    const palette = event.target.closest('[data-action="choose-sport-markings-background-colors"]');
    if (palette) { event.preventDefault(); event.stopImmediatePropagation(); show(); return; }
    const target = event.target.closest('[data-colors],[data-colors-view]');
    if (!target) return;
    event.preventDefault();
    const action = target.dataset.colors;
    if (target.dataset.colorsView) set({...get(), view: target.dataset.colorsView});
    else if (action === 'current-defaults') paintDefaults(get());
    else if (action === 'take-current') {
      const now = current(), defaults = get();
      set({view: now.view, board: now.board || defaults.board, field: now.field || defaults.field, markings: now.markings || defaults.markings});
      app.ui.notification('Новое поле будет как это', 'success');
    } else if (action === 'built-in') set(builtIn);
    else { const [scope, key] = action.split(':'); chooseColor(scope, key); return; }
    show();
  }, true);

  document.addEventListener('DOMContentLoaded', () => {
    for (const button of document.querySelectorAll('[data-action="choose-sport-markings-background-colors"]')) button.title = 'Цвета и значения по умолчанию';
  });

  window.TacticalDefaults = {get, set, show, builtIn};
})();
