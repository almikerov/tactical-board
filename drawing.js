/* Line thickness for drawn lines and figures, and any emoji as a player's icon. The bundle only calls in here. */
(() => {
  'use strict';
  const app = window.TacticalLocal;
  if (!app) return;
  const svg = 'http://www.w3.org/2000/svg';

  // Thickness is a multiplier of the line the board always drew; px is the sample in the context menu.
  const widths = [
    {value: .5, title: 'Тонкая', px: 1},
    {value: 1, title: 'Обычная', px: 2},
    {value: 1.5, title: 'Потолще', px: 3},
    {value: 2, title: 'Толстая', px: 4},
    {value: 3, title: 'Очень толстая', px: 6},
    {value: 4, title: 'Самая толстая', px: 8}
  ];
  const stroked = new Set(['pencil', 'line', 'polyline', 'double-line', 'wavy-line', 'polygon', 'area', 'rectangle', 'ellipse']);
  const icon = width => 'stroke-width-' + String(width).replace('.', '-');
  // Goals, cones, texts and other objects keep the board's own lines.
  const strokeWidthFor = (shape, width) => stroked.has(shape) ? width : undefined;

  function setStrokeWidth(shape, width) {
    shape._parameters.strokeWidth = width;
    shape.refresh();
    shape._addShadowContainer();
    shape._events.shapeChanged();
  }

  // The toolbar choice is for the next lines; a drawn one changes from its right-click menu.
  function addWidthButton(page) {
    const lineEnd = document.getElementById(`${page}_shapes_manager_line_end_style`);
    if (!lineEnd || document.getElementById(`${page}_shapes_manager_stroke_width`)) return;
    const button = document.createElement('div');
    button.id = `${page}_shapes_manager_stroke_width`;
    button.dataset.elementPage = page;
    lineEnd.after(button);
  }
  function activateWidthButton(page) {
    const button = document.getElementById(`${page}_shapes_manager_stroke_width`);
    if (!button || button.UIDropdownButtonsObject) return;
    new app.ui.DropdownButtons(button, {icon: icon(1), title: 'Толщина линии', items: widths.map(width => ({value: width.value, icon: icon(width.value), title: width.title}))});
    button.addEventListener('select', event => {
      const board = app.pages._pages[page] || app.pages.currentPageObject;
      board._shapesManager.set({strokeWidth: +event.detail.value});
    });
  }
  const init = app.layout._initApplication;
  app.layout._initApplication = async function () {
    // In place before the start, so each page shows only its own button.
    ['main', 'animation'].forEach(addWidthButton);
    const result = await init.apply(this, arguments);
    // Built after the start, when the board knows whether the screen is touchable.
    ['main', 'animation'].forEach(activateWidthButton);
    return result;
  };

  function widthPicker(shape) {
    const picker = document.createElement('div'), current = shape._parameters.strokeWidth || 1;
    picker.className = 'stroke-width-picker';
    picker.innerHTML = widths.map(width => `<div data-width="${width.value}" title="${width.title}"${width.value === current ? ' class="selected"' : ''}><i style="height:${width.px}px"></i></div>`).join('');
    picker.addEventListener('click', event => {
      const item = event.target.closest('[data-width]');
      if (!item) return;
      setStrokeWidth(shape, +item.dataset.width);
      for (const other of picker.children) other.classList.toggle('selected', other === item);
    });
    return picker;
  }
  const showContextMenu = app.ui.showContextMenu;
  app.ui.showContextMenu = function (options) {
    const target = options && options.event && options.event.currentTarget, shape = target && target.ShapeObject;
    if (shape && stroked.has(shape._shapeKey) && Array.isArray(options.items)) options = {...options, items: [{role: 'element', element: widthPicker(shape)}, ...options.items]};
    return showContextMenu.call(this, options);
  };

  // Flags, keycaps, and pictographs with skin tones, tags and joined parts such as 🏃‍♀️.
  const emojiPattern = /(?:\p{Regional_Indicator}{2}|[#*0-9]️?⃣|\p{Extended_Pictographic}[︎️]?\p{Emoji_Modifier}?[\u{E0020}-\u{E007F}]*(?:‍\p{Extended_Pictographic}[︎️]?\p{Emoji_Modifier}?)*)/u;
  // The first emoji in a text; a symbol such as ☀ that is drawn as a letter by default is asked for in color.
  function cleanEmoji(text) {
    const match = String(text || '').match(emojiPattern);
    if (!match || match[0].length > 32) return null;
    const emoji = match[0];
    return [...emoji].length === 1 && !/\p{Emoji_Presentation}/u.test(emoji) ? emoji + '️' : emoji;
  }
  const emojiOf = view => typeof view === 'string' && view.startsWith('emoji:') ? cleanEmoji(view.slice(6)) : null;
  const emojiFont = 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif';

  // A player view "emoji:⚽" draws the emoji; the number sits on a small badge in the team color.
  function figureClass(Figure) {
    return class extends Figure {
      constructor(options, view, emoji) {
        super(options);
        this._figureView = view;
        this._figureShapeType = 'circle';
        this._emoji = emoji;
        this._numberFontsizeToButtonWidthCoeff = .36;
        this._nameFontsizeToButtonWidthCoeff = .536;
        this._namePositionCoefficientY = .82;
        this._numberPositionCoefficientY = .53;
        this._elementParts = ['selection', 'emoji', 'shape', 'name', 'number', 'border'];
      }
      getEmojiContainer() {
        const text = document.createElementNS(svg, 'text');
        text.id = `${this._elementContainerID}_emoji`;
        text.classList.add('svg-player-emoji');
        text.setAttribute('data-context-menu-target', true);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'central');
        text.setAttribute('x', 0);
        text.setAttribute('y', 0);
        // Inline, because a saved picture keeps no classes.
        text.style.fontFamily = emojiFont;
        text.textContent = this._emoji;
        return text;
      }
      _setSize() {
        const size = this.size, parts = this._elementContainers, center = size * .4;
        parts.emoji.setAttribute('font-size', Math.round(size * 1.2));
        for (const part of [parts.shape, parts.border]) {
          part.setAttribute('cx', center);
          part.setAttribute('cy', center);
          part.setAttribute('r', size * .27);
        }
        parts.number.setAttribute('x', center);
        this._setBorderWidth();
        this._watchNumber();
      }
      // The player gives the border the width of a whole circle's; the badge is small.
      _setColor() { this._setBorderWidth(); }
      _setBorderWidth() { this._elementContainers.border.setAttribute('stroke-width', Math.max(1, Math.round(this.size / 25))); }
      // Without a number the emoji stands alone; the badge comes back with the number.
      _watchNumber() {
        const {number, shape, border} = this._elementContainers;
        if (this._watchedNumber === number) return;
        this._watchedNumber = number;
        const toggle = () => { for (const part of [shape, border]) part.toggleAttribute('hidden', !number.textContent.trim()); };
        toggle();
        new MutationObserver(toggle).observe(number, {childList: true, characterData: true, subtree: true});
      }
      // Only the emoji turns; the number stays upright.
      _processRotate(angle) { this._elementContainers.emoji.setAttribute('transform', `rotate(${angle || 0})`); }
      _cancelRotation() { this._elementContainers.emoji.setAttribute('transform', 'rotate(0)'); }
    };
  }
  let EmojiFigure = null;
  // Called by the bundle for every player view it does not know; anything but an emoji stays a circle.
  function emojiFigure(view, Figure, options) {
    const emoji = emojiOf(view);
    if (!emoji) return null;
    EmojiFigure = EmojiFigure || figureClass(Figure);
    return new EmojiFigure(options, view, emoji);
  }

  const recentKey = 'tactical-board.recent-emoji';
  const groups = [
    ['Футбол', '⚽ 🥅 🏃 🏃‍♀️ 🧍 🤾 ⛹️ 🤸 🧤 👟 🎽 🏆 🥇 🎯 🚩 🏁'],
    ['Люди', '🙂 😎 🤩 😤 😡 🥶 🤕 😴 🧑 👦 👧 🧔 👮 🧑‍🏫 🦸 🥷'],
    ['Животные', '🦁 🐯 🐺 🦊 🐻 🐂 🐎 🦅 🐉 🦈 🐝 🐓'],
    ['Знаки', '⭐ 🔥 ⚡ ❤️ 💪 🛡️ 👑 🎩 ❌ ⭕ ✅ ❗ ❓ 🔴 🔵 🟡 🟢 ⚪ ⚫']
  ];
  function recentEmoji() {
    try {
      const list = JSON.parse(localStorage.getItem(recentKey));
      return Array.isArray(list) ? list.map(item => cleanEmoji(item)).filter(Boolean).slice(0, 16) : [];
    } catch (e) { return []; }
  }
  function remember(emoji) {
    try { localStorage.setItem(recentKey, JSON.stringify([emoji, ...recentEmoji().filter(item => item !== emoji)].slice(0, 16))); } catch (e) {}
  }
  const escape = text => String(text).replace(/[&<>"]/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'})[char]);
  function chooseEmoji(current, onChoose) {
    const pick = emoji => { remember(emoji); onChoose(emoji); };
    const list = (title, items) => `<h3>${title}</h3><div class="emoji-list">${items.map(emoji =>
      `<button type="button" data-emoji="${escape(emoji)}" data-not-submit-by-enter-key="1"${emoji === current ? ' class="emoji-current"' : ''}>${escape(emoji)}</button>`).join('')}</div>`;
    const recent = recentEmoji();
    app.ui.showModalWindow({content: `
      <div class="emoji-window">
        <div class="emoji-title">Эмодзи вместо значка игрока</div>
        <input type="text" data-role="emoji-input" value="${escape(current || '')}" placeholder="Вставьте или наберите эмодзи" autocomplete="off" spellcheck="false">
        <p class="emoji-hint">Подойдёт любой эмодзи. Все эмодзи открываются клавишами Win + . (точка) на Windows и Ctrl + Cmd + Пробел на Mac.
          Номер игрока показывается в кружке цвета команды; если номер стереть, останется только эмодзи.</p>
        ${recent.length ? list('Недавние', recent) : ''}
        ${groups.map(([title, items]) => list(title, items.split(' '))).join('')}
      </div>`, top: '2rem', btnOkLabel: 'Готово',
    onOk: () => {
      const input = document.querySelector('#modal_window [data-role="emoji-input"]'), text = input ? input.value.trim() : '';
      if (!text) return;
      const emoji = cleanEmoji(text);
      if (emoji) pick(emoji);
      else app.ui.notification('В этом тексте нет эмодзи. Выберите его из списка или вставьте.', 'warning');
    },
    onOpen: () => {
      const box = document.querySelector('#modal_window .emoji-window');
      box.addEventListener('click', event => {
        const button = event.target.closest('[data-emoji]');
        if (!button) return;
        app.ui.closeModalWindow();
        pick(button.dataset.emoji);
      });
      // A phone would open its keyboard over the list.
      if (!document.isTouchable) box.querySelector('[data-role="emoji-input"]').select();
    }});
  }

  // The context menu of a player offers an emoji next to the circle, shirt, triangle and square.
  const ViewPicker = app.ui.PlayerViewPicker;
  app.ui.PlayerViewPicker = function (options) {
    const current = emojiOf(options.defaultValue);
    // The original picker would look forever for a view it does not draw itself.
    ViewPicker.call(this, current ? {...options, defaultValue: options.options[0]} : options);
    const picker = this.elementContainer;
    if (current) for (const item of picker.querySelectorAll('.selected')) { item.classList.remove('selected'); delete item.dataset.selected; }
    const button = document.createElement('div');
    button.className = current ? 'emoji selected' : 'emoji';
    button.dataset.role = 'player-view-picker-emoji';
    button.title = current ? 'Другой эмодзи' : 'Эмодзи вместо значка';
    button.textContent = current || '🙂';
    button.addEventListener('click', () => {
      app.ui.hideContextMenu();
      chooseEmoji(current, emoji => options.onSelect && options.onSelect('emoji:' + emoji));
    });
    picker.appendChild(button);
  };

  window.TacticalDrawing = {widths, strokeWidthFor, setStrokeWidth, cleanEmoji, emojiOf, emojiFigure};
})();
