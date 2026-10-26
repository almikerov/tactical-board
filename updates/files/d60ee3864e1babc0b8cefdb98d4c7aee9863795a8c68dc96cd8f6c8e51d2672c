var BoardMarkup;(()=>{"use strict";var t={};(()=>{t.d=($,e)=>{for(var n in e)t.o(e,n)&&!t.o($,n)&&Object.defineProperty($,n,{enumerable:!0,get:e[n]})}})(),(()=>{t.o=(t,$)=>Object.prototype.hasOwnProperty.call(t,$)})(),(()=>{t.r=t=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})}})();var $={};function e(t){let{width:$,height:e,color:n="#fff",bgColor:r=!1,siteName:o="",hideMarkup:l=!1}=t,a=Math.round(.00125*$);a%2!=0&&a--,a<=0&&(a=2);let i=r||"#72A653",s='<line data-allow-custom-colors="true" />';const c=.07175*$;let d=.0697096*$,k=.10666*e;s+=`\n\t\t<path index="10" d="\n\t\t\t\tM${d} ${k} H${$-d} V${e-k} H${d} V${k}\n\t\t\t"\n\t\t\tfill="${r||"#5E9D44"}" stroke="none"/>\n\t`;let f=0;for(s+='\n\t\t<path index="20" d="\n\t';;){let t=d+c*f;f++;let n=d+c*f;if(t>$-d)break;if(n>$-d&&(n=$-d),s+=`\n\t\t\tM${t} ${k} H${n} V${e-k} H${t} V${k}\n\t\t`,f++,f>50)break}return s+=`\n\t\t"\n\t\tfill="${i}" stroke="none" stroke-linecap="square" />\t\t\n\t`,s+=`\n\t\t<path index="30" d="\n\t\t\t\tM${.0697096*$} ${.10666*e} H${$-.0697096*$} V${e-.10666*e} H${.0697096*$} V${.10666*e}\n\t\t\t"\n\t\t\tfill="none" stroke="${n}" stroke-linecap="square" stroke-width="${1.5555*a}"/>\n\t`,l||(s+=`\n\t\t\t<g data-role="board-markup">\n\t\t\t\t<path d="\n\t\t\t\t\t\tM${.0697096*$} ${.23866*e} H${.2084848*$} V${e-.23866*e} H${.0697096*$}\n\t\t\t\t\t\tM${.0697096*$} ${.37514*e} H${.11876096*$} V${e-.37514*e} H${.0697096*$}\n\t\t\t\t\t\tM${.2093576*$} ${.40395*e} A ${.078552*$} ${.078552*$} 0 0 1 ${.2093576*$} ${e-.40395*e}\n\t\t\t\t\t\t\n\t\t\t\t\t\tM${$/2} ${.10666*e} V${e-.10666*e}\n\n\t\t\t\t\t\tM${$-.2084848*$} ${.23866*e} H${$-.0697096*$} V${e-.23866*e} H${$-.2084848*$} V${.23866*e}\n\t\t\t\t\t\tM${$-.11876096*$} ${.37514*e} H${$-.0697096*$} V${e-.37514*e} H${$-.11876096*$} V${.37514*e}\n\t\t\t\t\t\tM${$-.2093576*$} ${.40395*e} A ${.078552*$} ${.078552*$} 0 0 0 ${$-.2093576*$} ${e-.40395*e}\n\n\t\t\t\t\t\tM${$/2} ${e/2} Z\n\t\t\t\t\t"\n\t\t\t\t\tfill="none" stroke="${n}" stroke-linecap="square" stroke-width="${a}"/>\n\t\t\t\t<path d="\n\t\t\t\t\t\tM${.0697096*$} ${.44219*e} H${.0591*$} V${e-.44219*e} H${.0697096*$}\n\t\t\t\t\t\tM${$-.0697096*$} ${.44219*e} H${$-.0591*$} V${e-.44219*e} H${$-.0697096*$}\n\t\t\t\t\t"\n\t\t\t\t\tfill="url(#grid_3)" stroke="${n}" stroke-linecap="square" stroke-width="${a}"/>\n\n\t\t\t\t<circle cx="${.16039352*$}" cy="${e/2}" r="${.0028276*$}" fill="${n}" stroke="none"/>\n\n\t\t\t\t<circle cx="${$/2}" cy="${e/2}" r="${.08317784*$}" fill="none" stroke="${n}" stroke-width="${a}"/>\n\t\t\t\t<circle cx="${$/2}" cy="${e/2}" r="${.0028276*$}" fill="${n}" stroke="none"/>\n\n\t\t\t\t<circle cx="${$-.16039352*$}" cy="${e/2}" r="${.0028276*$}" fill="${n}" stroke="none"/>\n\t\t\t\t\n\t\t\t\t<text class="markup-sitename-label" opacity=".15" x="${.757476*$}" y="${.8659*e}" stroke="none" fill="${n}" font-size="${.0175*$}">${o}</text>\n\t\t\t</g>\n\t\t`),s}t.r($),t.d($,{get:()=>e}),BoardMarkup=$})();
/* Free field: the full pitch under a user-controlled camera (rotation, zoom and shift). */
(() => {
  const pitch = BoardMarkup.get;
  const defaults = Object.freeze({rotation: 0, scale: 1, x: 0, y: 0});
  const limit = (value, min, max, fallback) => Number.isFinite(Number(value)) ? Math.min(max, Math.max(min, Number(value))) : fallback;
  const round = value => Math.round(value * 1e4) / 1e4;
  const normalize = view => ({
    rotation: round(((limit(view?.rotation, -1e6, 1e6, 0) % 360) + 360) % 360),
    scale: round(limit(view?.scale, .25, 6, 1)),
    x: round(limit(view?.x, -2, 2, 0)),
    y: round(limit(view?.y, -2, 2, 0)),
  });
  let view = {...defaults};
  // Shifts are fractions of the board, so a saved view looks the same at any board or export size.
  const transform = (width, height) => {
    const cx = width / 2, cy = height / 2;
    return `translate(${cx + view.x * width} ${cy + view.y * height}) rotate(${view.rotation}) scale(${view.scale}) translate(${-cx} ${-cy})`;
  };
  // The clip lives in the container's turned space, so its rectangle carries the inverse camera.
  const inverse = (width, height) => {
    const cx = width / 2, cy = height / 2;
    return `translate(${cx} ${cy}) scale(${1 / view.scale}) rotate(${-view.rotation}) translate(${-cx - view.x * width} ${-cy - view.y * height})`;
  };
  function clip(container, width, height) {
    const svg = container.ownerSVGElement, ns = 'http://www.w3.org/2000/svg';
    if (!svg) return;
    let rect = svg.querySelector('#free_field_clip > rect');
    if (!rect) {
      const path = document.createElementNS(ns, 'clipPath');
      path.id = 'free_field_clip';
      rect = path.appendChild(document.createElementNS(ns, 'rect'));
      (svg.querySelector('defs') || svg).appendChild(path);
    }
    for (const [name, value] of Object.entries({x: 0, y: 0, width, height, transform: inverse(width, height)})) rect.setAttribute(name, value);
    container.setAttribute('clip-path', 'url(#free_field_clip)');
  }
  BoardMarkup = {
    get(options) {
      // The editor flattens the markup into separate elements, so the camera goes on their container.
      const container = typeof document !== 'undefined' && document.getElementById('board_svg_markup');
      if (container) {
        container.setAttribute('transform', transform(options.width, options.height));
        clip(container, options.width, options.height);
      }
      return pitch(options);
    },
  };
  window.FreeField = {
    defaults,
    normalize,
    transform,
    get: () => ({...view}),
    set(next) {
      view = normalize(next || defaults);
      window.dispatchEvent(new CustomEvent('free-field-change', {detail: {...view}}));
      return {...view};
    },
  };
})();
