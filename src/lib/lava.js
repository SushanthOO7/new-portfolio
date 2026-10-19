/** Two routes share their source and sink; horizontal and vertical launch tangents. */
export function getLavaRoutes(width, height, side) {
  const r = 14;
  const flip = side === 'left';
  const x = value => flip ? width - value : value;
  return {
    horizontal: `M${x(r)} 1H${x(width - r)}Q${x(width - 1)} 1 ${x(width - 1)} ${r}V${height - r}Q${x(width - 1)} ${height - 1} ${x(width - r)} ${height - 1}`,
    vertical: `M${x(r)} 1Q${x(1)} 1 ${x(1)} ${r}V${height - r}Q${x(1)} ${height - 1} ${x(r)} ${height - 1}H${x(width - r)}`,
  };
}

/** Matching cubic topology keeps the layered, attached tips smooth as they gently swell. */
export function getMoltenShape(heat, extension, inset = 0) {
  const w = .28 + heat * (3.8 - inset * 1.5);
  const minor = .4 + heat * (11 - inset * 3);
  const bottom = 50 + extension - inset * heat * 1.5;
  return `M83 0C82 18 84 30 ${83 - w} 39C${81 - w} 47 75 ${50 - w} 65 ${50 - w}C50 ${50 - w * .4} 38 50 25 50C40 ${50 + w * .4} 49 ${50 + w} 54 ${50 + w}C58 ${50 + w} 55 ${50 + minor} 58 ${50 + minor}C62 ${50 + minor} 60 ${50 + heat + w} 65 ${50 + heat + w}C71 ${50 + heat + w} 68 ${bottom} 74 ${bottom}C${79 - inset} ${bottom} ${81 - inset} ${bottom - heat * 5} ${78 - inset} ${bottom - heat * 9}C${76 + inset} ${50 + heat * 4 + w} 82 ${48 + w} ${84 + w * .5} 39C${86 + w * .3} 26 84 13 83 0Z`;
}
