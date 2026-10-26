/* Defaults for a new field: the board view and pitch colors that "clear the board" starts from. */
(() => {
  'use strict';
  const app = window.TacticalLocal;
  if (!app) return;
  const storageKey = 'tactical-board.new-field-defaults.v1';
  const pendingKey = 'tactical-board.new-field-pending';
  const views = ['big-football', 'big-football-half', 'big-football-half-2', 'big-football-vertical', 'big-football-vertical-2', 'big-football-penalty', 'big-football-free'];
  const valid = value => typeof value === 'string' && /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(value);
  const params = () => app.context.inputParams;
  // Shared schemes and conferences carry their own look, so defaults never touch them.
  const ownBoard = () => !params().link_token && !params().conference_link_token;

  function normalize(value) {
    if (!value || !views.includes(value.view)) return null;
    return {view: value.view, background: valid(value.background) ? value.background : null, markings: valid(value.markings) ? value.markings : null};
  }
  function get() {
    try { return normalize(JSON.parse(localStorage.getItem(storageKey))); } catch (e) { return null; }
  }
  function set(value) {
    const defaults = normalize(value);
    try {
      if (defaults) localStorage.setItem(storageKey, JSON.stringify(defaults)); else localStorage.removeItem(storageKey);
    } catch (e) { app.ui.notification('Браузер запретил сохранить настройки нового поля.', 'warning'); }
    return defaults;
  }
  function current() {
    const config = app.context.boardConfig;
    const markings = valid(config.customMarkingsColor) && config.customMarkingsColor.toLowerCase() !== config.strokeColor.toLowerCase() ? config.customMarkingsColor : null;
    return {view: params().board_key, background: valid(config.customSportBgColor) ? config.customSportBgColor : null, markings};
  }
  function applyColors(defaults) {
    app.context.boardConfig.customSportBgColor = defaults.background || false;
    app.context.boardConfig.customMarkingsColor = defaults.markings || false;
    app.layout.resize();
  }

  // Clearing the board is how a new field starts: it opens in the default view with the default colors.
  const reset = app.pages.reset;
  app.pages.reset = function () {
    const result = reset.apply(this, arguments), defaults = get();
    if (!defaults || params().conference_link_token) return result;
    if (defaults.view !== params().board_key) {
      try { sessionStorage.setItem(pendingKey, app.pages.currentPage); } catch (e) {}
      location.href = params().site_url + '/ru/' + defaults.view + (app.pages.currentPage === 'animation' ? '/animation' : '');
    } else applyColors(defaults);
    return result;
  };

  const init = app.layout._initApplication;
  app.layout._initApplication = async function () {
    const result = await init.apply(this, arguments), defaults = get();
    let pending = null;
    try { pending = sessionStorage.getItem(pendingKey); sessionStorage.removeItem(pendingKey); } catch (e) {}
    // The view picked here may still hold an older scheme; the new field starts empty.
    if (pending && pending === app.pages.currentPage && ownBoard()) reset.call(app.pages);
    if (defaults && ownBoard()) applyColors(defaults);
    return result;
  };

  const viewClass = view => 'board-view-' + (view === 'big-football' ? 'big-football-horizontal' : view);
  function colorRow(label, color, action) {
    return `<div>
        <div>${label}:</div>
        ${color ? `<div class="color" style="background-color: ${color};"></div>` : `<div class="label-default">${app.context.texts.default}</div>`}
        <div class="button-set" data-new-field="${action}">${app.context.texts.change_color}</div>
      </div>`;
  }
  function show() {
    const defaults = get(), shown = defaults || current();
    app.ui.showModalWindow({content: `
      <div class="new-field-window">
        <div class="sport-markings-background-colors-window">
          <div class="header">Настройки нового поля</div>
          <p class="new-field-hint">${defaults ? 'Кнопка «Очистить доску полностью» начинает новое поле с этим видом и цветами.' : 'Пока не заданы: очистка доски оставляет текущий вид и цвета. Выберите вид или цвет, чтобы задать их.'}</p>
        </div>
        <div class="select-board-view">
          <div>Вид поля</div>
          <div>${views.map(view => `<a class="${viewClass(view)}${defaults && view === shown.view ? ' new-field-selected' : ''}" data-new-field-view="${view}"><div></div></a>`).join('')}</div>
        </div>
        <div class="sport-markings-background-colors-window">
          ${colorRow(app.context.texts.field_background.toLowerCase(), shown.background, 'background')}
          ${colorRow(app.context.texts.field_markings.toLowerCase(), shown.markings, 'markings')}
          <div>
            <div class="button-set" data-new-field="take-current">Взять с текущего поля</div>
            ${defaults ? '<div class="button-reset" data-new-field="forget">Не задавать</div>' : ''}
          </div>
        </div>
      </div>`, top: '3rem', onOk: () => {}, btnOkLabel: app.context.texts.close});
  }
  function hideMenu() {
    document.getElementById('menu_panel').classList.add('hidden');
    document.getElementById('menu_panel_background_layer').hidden = true;
  }
  function chooseColor(key) {
    const defaults = get() || current();
    app.ui.chooseColor({removeColorButtonText: app.context.texts.reset_set_to_defaults, onColorChoose: value => {
      set({...defaults, [key]: valid(value) ? value : null});
      show();
    }});
  }

  document.addEventListener('click', event => {
    const target = event.target.closest('[data-new-field],[data-new-field-view]');
    if (!target) return;
    event.preventDefault();
    const action = target.dataset.newField;
    if (target.dataset.newFieldView) { set({...(get() || current()), view: target.dataset.newFieldView}); show(); }
    else if (action === 'settings') { hideMenu(); show(); }
    else if (action === 'background' || action === 'markings') chooseColor(action);
    else if (action === 'take-current') { set(current()); app.ui.notification('Новое поле будет как текущее', 'success'); show(); }
    else if (action === 'forget') { set(null); show(); }
  });

  document.addEventListener('DOMContentLoaded', () => {
    const anchor = document.querySelector('#menu_panel [data-action="choose-board-background-color"]');
    if (!anchor) return;
    const item = document.createElement('div');
    item.className = 'menu-item';
    item.dataset.newField = 'settings';
    item.textContent = 'Настройки нового поля';
    anchor.after(item);
  });

  window.TacticalNewField = {get, set, show};
})();
