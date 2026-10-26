/* Close-up of one penalty area, in the editor's native SVG markup format. */
var BoardMarkup = {
  get({width, height, color = '#fff', bgColor = false, hideMarkup = false}) {
    const scale = width * .92 / 68;
    const left = width * .04, right = width * .96, center = width / 2;
    const goalY = height * .13, bottom = height * .94;
    const line = Math.max(2, width * .0018);
    const x = meters => center + meters * scale;
    const y = meters => goalY + meters * scale;
    let svg = '<line data-allow-custom-colors="true" />';
    svg += `<path index="10" d="M${left} ${goalY} H${right} V${bottom} H${left} Z" fill="${bgColor || '#5E9D44'}" stroke="none"/>`;
    for (let start = goalY; start < bottom; start += 10 * scale) {
      svg += `<path index="20" d="M${left} ${start} H${right} V${Math.min(start + 5 * scale, bottom)} H${left} Z" fill="${bgColor || '#72A653'}" stroke="none"/>`;
    }
    // Both corners and touchlines are visible; the lower edge is a camera cut.
    svg += `<polyline points="${left},${bottom} ${left},${goalY} ${right},${goalY} ${right},${bottom}" fill="none" stroke="${color}" stroke-width="${line}"/>`;
    if (hideMarkup) return svg;
    const arcHalfWidth = Math.sqrt(9.15 ** 2 - 5.5 ** 2);
    const visibleDepth = (bottom - goalY) / scale;
    const circleEdgeDepth = Math.min(visibleDepth, 52.5);
    const circleHalfWidth = Math.sqrt(Math.max(0, 9.15 ** 2 - (52.5 - circleEdgeDepth) ** 2));
    const centerCircleEdge = visibleDepth > 43.35
      ? `<path data-penalty-part="center-circle-edge" d="M${x(-circleHalfWidth)} ${y(circleEdgeDepth)} A${9.15 * scale} ${9.15 * scale} 0 0 1 ${x(circleHalfWidth)} ${y(circleEdgeDepth)}" fill="none" stroke="${color}" stroke-width="${line}"/>`
      : '';
    svg += `<g data-role="board-markup">
      <path d="M${x(-20.16)} ${goalY} V${y(16.5)} H${x(20.16)} V${goalY}
        M${x(-9.16)} ${goalY} V${y(5.5)} H${x(9.16)} V${goalY}"
        fill="none" stroke="${color}" stroke-width="${line}"/>
      <path d="M${x(-arcHalfWidth)} ${y(16.5)} A${9.15 * scale} ${9.15 * scale} 0 0 0 ${x(arcHalfWidth)} ${y(16.5)}"
        fill="none" stroke="${color}" stroke-width="${line}"/>
      <path d="M${x(-3.66)} ${goalY} V${y(-2)} H${x(3.66)} V${goalY}"
        fill="url(#grid_4)" stroke="${color}" stroke-width="${line}"/>
      <circle cx="${center}" cy="${y(11)}" r="${Math.max(2, .16 * scale)}" fill="${color}" stroke="none"/>
      <path data-penalty-part="corner-arcs" d="M${left + scale} ${goalY} A${scale} ${scale} 0 0 1 ${left} ${y(1)}
        M${right - scale} ${goalY} A${scale} ${scale} 0 0 0 ${right} ${y(1)}"
        fill="none" stroke="${color}" stroke-width="${line}"/>
      ${centerCircleEdge}
    </g>`;
    return svg;
  }
};
