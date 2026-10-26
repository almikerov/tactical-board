/* Controls for the free field view: rotate, zoom, shift, reset and the user's own saved views. */
(() => {
  'use strict';
  if (!window.FreeField) return;
  const field = window.FreeField;
  const app = () => window.TacticalLocal;
  const storageKey = 'tactical-board-free-field-views';
  const escape = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const icon = path => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;
  const icons = {
    left: 'M7 4v4h7a5 5 0 0 1 0 10H8M7 8l3-3M7 8l3 3',
    right: 'M17 4v4h-7a5 5 0 0 0 0 10h6M17 8l-3-3M17 8l-3 3',
    in: 'M12 5v14M5 12h14',
    out: 'M5 12h14',
    up: 'M12 19V5M6 11l6-6 6 6',
    down: 'M12 5v14M6 13l6 6 6-6',
    west: 'M19 12H5M11 6l-6 6 6 6',
    east: 'M5 12h14M13 6l6 6-6 6',
    reset: 'M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4',
    views: 'M5 4h14v16l-7-5-7 5z',
  };
  const buttons = [
    ['rotate', -15, 'left', 'Повернуть поле влево (Shift — на 1°)'],
    ['rotate', 15, 'right', 'Повернуть поле вправо (Shift — на 1°)'],
    ['zoom', 1.1, 'in', 'Увеличить поле'],
    ['zoom', 1 / 1.1, 'out', 'Уменьшить поле'],
    ['move', '0,-1', 'up', 'Сдвинуть поле вверх (Shift — точнее)'],
    ['move', '0,1', 'down', 'Сдвинуть поле вниз (Shift — точнее)'],
    ['move', '-1,0', 'west', 'Сдвинуть поле влево (Shift — точнее)'],
    ['move', '1,0', 'east', 'Сдвинуть поле вправо (Shift — точнее)'],
    ['reset', '', 'reset', 'Сбросить вид поля'],
    ['views', '', 'views', 'Мои варианты поля'],
  ];

  function presets() {
    try {
      const list = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return Array.isArray(list) ? list.filter(p => p && typeof p.name === 'string' && p.view) : [];
    } catch (e) { return []; }
  }
  function storePresets(list) { localStorage.setItem(storageKey, JSON.stringify(list)); }

  let frame = 0;
  function redraw() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => { try { app().layout.resize(); } catch (e) {} });
  }
  // Every change made here is remembered with the scheme, like a moved player.
  function apply(view) {
    field.set(view);
    try { app().pages.currentPageObject._storeInLocalStorage(); } catch (e) {}
  }
  function describe(view) { return `${Math.round(view.rotation)}° · ${Math.round(view.scale * 100)}%`; }

  function act(button, fine) {
    const view = field.get(), value = button.dataset.value;
    if (button.dataset.free === 'rotate') apply({...view, rotation: view.rotation + (fine ? Math.sign(value) : Number(value))});
    else if (button.dataset.free === 'zoom') apply({...view, scale: view.scale * (fine ? Math.pow(Number(value), .25) : Number(value))});
    else if (button.dataset.free === 'move') {
      const [dx, dy] = value.split(',').map(Number), step = fine ? .01 : .05;
      apply({...view, x: view.x + dx * step, y: view.y + dy * step});
    } else if (button.dataset.free === 'reset') apply(field.defaults);
    else if (button.dataset.free === 'views') showViews();
  }

  function showViews() {
    const list = presets(), view = field.get();
    const items = list.length ? list.map((p, i) => `
      <div class="free-field-preset">
        <button type="button" data-free-apply="${i}" title="Применить">${escape(p.name)}<small>${describe(field.normalize(p.view))}</small></button>
        <button type="button" class="local-delete" data-free-delete="${i}" title="Удалить вариант">Удалить</button>
      </div>`).join('') : '<p><small>Сохранённых вариантов пока нет.</small></p>';
    app().ui.showModalWindow({content: `
      <div class="local-panel free-field-panel">
        <h2>Мои варианты поля</h2>
        <p>Сейчас: ${describe(view)}</p>
        <div class="free-field-presets">${items}</div>
        <label for="free_field_preset_name">Сохранить текущий вид как</label>
        <input id="free_field_preset_name" maxlength="80" placeholder="Например: Атака справа" autocomplete="off">
        <button type="button" data-free-save>Сохранить вариант</button>
      </div>`});
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-free]');
    if (button) { act(button, event.shiftKey); return; }
    const applyButton = event.target.closest('[data-free-apply]');
    if (applyButton) {
      const preset = presets()[applyButton.dataset.freeApply];
      if (preset) { apply(preset.view); app().ui.closeModalWindow(); }
      return;
    }
    const remove = event.target.closest('[data-free-delete]');
    if (remove) {
      // A second click confirms, so one stray tap cannot lose a saved view.
      if (remove.dataset.confirm !== '1') { remove.dataset.confirm = '1'; remove.textContent = 'Точно удалить?'; return; }
      const list = presets();
      list.splice(Number(remove.dataset.freeDelete), 1);
      storePresets(list);
      showViews();
      return;
    }
    if (event.target.closest('[data-free-save]')) {
      const input = document.getElementById('free_field_preset_name'), name = input.value.trim();
      if (!name) { input.focus(); app().ui.notification('Введите название варианта', 'error'); return; }
      const list = presets().filter(p => p.name !== name);
      list.push({name, view: field.get()});
      storePresets(list);
      app().ui.notification('Вариант «' + name + '» сохранён', 'success');
      showViews();
    }
  });

  window.addEventListener('free-field-change', () => {
    redraw();
    const pad = document.getElementById('free_field_controls');
    if (pad) pad.title = 'Вид поля: ' + describe(field.get());
  });

  function mount() {
    const panel = document.getElementById('side_buttons_panel');
    if (!panel || document.getElementById('free_field_controls')) return;
    const pad = document.createElement('div');
    pad.id = 'free_field_controls';
    pad.className = 'free-field-controls';
    pad.innerHTML = buttons.map(([action, value, name, title]) =>
      `<button type="button" data-free="${action}" data-value="${value}" title="${title}">${icon(icons[name])}</button>`).join('');
    panel.appendChild(pad);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
