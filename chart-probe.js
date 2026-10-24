// Choose an actual sampled point, rather than interpolating a new result.
export function nearestSample(rows, x) {
  if (!rows.length) return -1;
  let nearest = 0;
  for (let i = 1; i < rows.length; i++) {
    if (Math.abs(rows[i].x - x) < Math.abs(rows[nearest].x - x)) nearest = i;
  }
  return nearest;
}

export function createChartProbe(canvas, redraw, options={}) {
  const tooltip = document.createElement('div');
  tooltip.className = 'chart-tooltip';
  tooltip.id = canvas.id + '-readout';
  tooltip.hidden = true;
  tooltip.setAttribute('role', 'tooltip');
  canvas.parentElement.append(tooltip);
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-describedby', tooltip.id);
  canvas.setAttribute('aria-description', 'Hover or touch to inspect samples. Use Left and Right arrow keys, Home and End to choose points. P pins the reading; Enter applies pitch on the sweep. Escape dismisses the readout.');
  let pointer = null, index = null, count = 0, current=null, lastReading=null, pinned=null;
  const hide = () => { pointer = null; index = null; tooltip.hidden = true; redraw(); };
  const move = event => {
    const rect = canvas.getBoundingClientRect();
    pointer = (event.clientX - rect.left) * canvas.clientWidth / rect.width;
    index = null;
    redraw();
  };
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerdown', move);
  canvas.addEventListener('click',()=>{if(current)options.onPick?.(current);});
  canvas.addEventListener('pointerleave', event => { if (event.pointerType !== 'touch') hide(); });
  canvas.addEventListener('pointercancel', hide);
  canvas.addEventListener('blur', hide);
  document.addEventListener('pointerdown', event => { if (event.target !== canvas) hide(); });
  canvas.addEventListener('keydown', event => {
    if (event.key === 'Escape') { pinned=null;hide(); return; }
    if(event.key==='p'||event.key==='P'){pinned=pinned?null:current&&{...current};redraw();return;}
    if(event.key==='Enter'&&current){options.onPick?.(current);return;}
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    pointer = null;
    index = event.key === 'Home' ? 0 : event.key === 'End' ? count - 1 :
      Math.max(0, Math.min(count - 1, (index ?? 0) + (event.key === 'ArrowRight' ? 1 : -1)));
    redraw();
  });
  const paint = (context, rows, {left, right, top, bottom, xp, yp}) => {
    count = rows.length;
    if ((!count || (pointer === null && index === null) ||
        (pointer !== null && (pointer < left || pointer > right))) && !pinned) {
      tooltip.hidden = true;current=null;
      return;
    }
    const x = rows[0].x + (pointer - left) / (right - left) * (rows.at(-1).x - rows[0].x);
    const selected = pointer === null ? Math.min(index, count - 1) : nearestSample(rows, x);
    const row = pinned || rows[selected];if(!row)return;current=row;lastReading=row;const px = Math.max(left,Math.min(right,xp(row.x)));
    context.setLineDash([3, 3]);
    context.strokeStyle = '#758e80';
    context.lineWidth = 1;
    context.beginPath();context.moveTo(px, top);context.lineTo(px, bottom);context.stroke();
    context.setLineDash([]);
    for (const [key, color] of [['lift', '#287d73'], ['drag', '#a9542c']]) {
      context.beginPath();context.arc(px, yp(row[key]), 4, 0, Math.PI * 2);
      context.fillStyle = color;context.fill();
      context.strokeStyle = '#fff';context.lineWidth = 1.5;context.stroke();
    }
    const value = n => Math.abs(n) >= 10000 ? n.toExponential(3) : n.toFixed(3);
    tooltip.replaceChildren();
    for (const [label, text] of [
      [(canvas.dataset.kind||canvas.id) === 'history' ? 'Time' : 'Pitch', row.x.toFixed(1) + ((canvas.dataset.kind||canvas.id) === 'history' ? ' s' : '°')],
      [pinned?'Lift (pinned)':'Lift', value(row.lift) + ' N'], ['Drag', value(row.drag) + ' N']
    ]) {
      const line = document.createElement('div');
      const name = document.createElement('span');name.textContent = label;
      const reading = document.createElement('strong');reading.textContent = text;
      line.append(name, reading);tooltip.append(line);
    }
    tooltip.hidden = false;
    const card = canvas.parentElement;
    const preferred = canvas.offsetLeft + px + 12;
    const width = tooltip.offsetWidth;
    tooltip.style.left = Math.max(4, Math.min(card.clientWidth - width - 4,
      preferred + width > card.clientWidth ? canvas.offsetLeft + px - width - 12 : preferred)) + 'px';
  };
  paint.pin=()=>{pinned=lastReading?{...lastReading}:null;redraw();return !!pinned;};
  paint.clearPin=()=>{pinned=null;hide();};
  return paint;
}
