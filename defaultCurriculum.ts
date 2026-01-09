
import { v4 as uuidv4 } from 'uuid';
import { Year, Quest, Task, AppData, ContentType, ClassGroup, Student } from './types';

const createId = () => uuidv4();

// --- 1. SHAPE SORTER (K-2 Geometry) ---
const SHAPE_SORTER_HTML = `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: 'Inter', sans-serif; background: #0f172a; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; user-select: none; }
  h1 { margin-bottom: 20px; color: #fbbf24; text-shadow: 0 4px 10px rgba(0,0,0,0.3); }
  .game-area { display: flex; gap: 40px; margin-bottom: 40px; }
  .bin { width: 120px; height: 120px; border: 4px dashed #475569; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; color: #94a3b8; transition: all 0.3s; background: rgba(255,255,255,0.05); }
  .bin.hovered { border-color: #fbbf24; background: rgba(251, 191, 36, 0.1); transform: scale(1.05); }
  .draggables { display: flex; gap: 20px; min-height: 80px; }
  .item { width: 60px; height: 60px; cursor: grab; transition: transform 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 24px; }
  .item:active { cursor: grabbing; transform: scale(1.1); }
  .circle { border-radius: 50%; background: #ef4444; }
  .square { border-radius: 8px; background: #3b82f6; }
  .triangle { clip-path: polygon(50% 0%, 0% 100%, 100% 100%); background: #22c55e; width: 60px; height: 60px; }
  .score-board { font-size: 24px; font-weight: bold; color: #cbd5e1; }
  .win-msg { position: absolute; font-size: 40px; color: #fbbf24; font-weight: 900; opacity: 0; pointer-events: none; transition: opacity 0.5s; text-shadow: 0 0 20px rgba(251,191,36,0.5); }
</style>
</head>
<body>
  <h1>Shape Sorter</h1>
  <div class="score-board">Score: <span id="score">0</span></div>
  <div class="win-msg" id="win">Great Job! 🎉</div>
  <div class="game-area">
    <div class="bin" id="bin-circle" data-type="circle">Circles</div>
    <div class="bin" id="bin-square" data-type="square">Squares</div>
    <div class="bin" id="bin-triangle" data-type="triangle">Triangles</div>
  </div>
  <div class="draggables" id="items"></div>
  <script>
    const shapes = ['circle', 'square', 'triangle'];
    let score = 0;
    let draggedItem = null;
    function init() {
        const container = document.getElementById('items');
        container.innerHTML = '';
        for(let i=0; i<6; i++) {
            const type = shapes[Math.floor(Math.random() * shapes.length)];
            const el = document.createElement('div');
            el.className = 'item ' + type;
            el.draggable = true;
            el.dataset.type = type;
            el.addEventListener('dragstart', e => { draggedItem = e.target; setTimeout(() => e.target.style.display = 'none', 0); });
            el.addEventListener('dragend', e => { setTimeout(() => e.target.style.display = 'flex', 0); draggedItem = null; });
            container.appendChild(el);
        }
    }
    document.querySelectorAll('.bin').forEach(bin => {
        bin.addEventListener('dragover', e => { e.preventDefault(); bin.classList.add('hovered'); });
        bin.addEventListener('dragleave', e => { bin.classList.remove('hovered'); });
        bin.addEventListener('drop', e => {
            bin.classList.remove('hovered');
            if(draggedItem && draggedItem.dataset.type === bin.dataset.type) {
                score += 10;
                document.getElementById('score').innerText = score;
                draggedItem.remove();
                if(document.getElementById('items').children.length === 0) {
                    document.getElementById('win').style.opacity = 1;
                    setTimeout(() => { document.getElementById('win').style.opacity = 0; init(); }, 2000);
                }
            }
        });
    });
    init();
  </script>
</body>
</html>
`;

// --- 2. FRACTION VISUALIZER (Grade 3-5) ---
const FRACTION_BUILDER_HTML = `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: 'Inter', sans-serif; background: #0f172a; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
  .container { background: #1e293b; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); text-align: center; }
  canvas { background: #0f172a; border-radius: 50%; box-shadow: 0 0 20px rgba(99,102,241,0.2); margin: 20px 0; cursor: pointer; }
  .controls { display: flex; gap: 10px; justify-content: center; align-items: center; margin-bottom: 20px; }
  button { background: #334155; border: none; color: white; width: 40px; height: 40px; border-radius: 8px; font-size: 20px; cursor: pointer; transition: background 0.2s; }
  button:hover { background: #475569; }
  .fraction { font-size: 48px; font-weight: 900; font-family: 'Courier New', monospace; color: #818cf8; }
  .label { color: #94a3b8; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
</style>
</head>
<body>
  <div class="container">
    <div class="label">Interactive Fraction Builder</div>
    <div class="controls">
      <div>
        <div class="label">Numerator</div>
        <button onclick="update(num - 1, den)">-</button>
        <span id="numVal" style="font-size: 24px; font-weight: bold; margin: 0 10px;">1</span>
        <button onclick="update(num + 1, den)">+</button>
      </div>
      <div style="width: 40px;"></div>
      <div>
        <div class="label">Denominator</div>
        <button onclick="update(num, den - 1)">-</button>
        <span id="denVal" style="font-size: 24px; font-weight: bold; margin: 0 10px;">4</span>
        <button onclick="update(num, den + 1)">+</button>
      </div>
    </div>
    <canvas id="canvas" width="300" height="300"></canvas>
    <div class="fraction" id="display">1/4</div>
  </div>
  <script>
    let num = 1; let den = 4;
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];
    function update(n, d) {
        if (d < 1) d = 1; if (d > 12) d = 12;
        if (n < 0) n = 0; if (n > d) n = d; 
        num = n; den = d;
        document.getElementById('numVal').innerText = num;
        document.getElementById('denVal').innerText = den;
        document.getElementById('display').innerText = num + '/' + den;
        draw();
    }
    function draw() {
        ctx.clearRect(0, 0, 300, 300);
        const center = 150; const radius = 140;
        const slice = (2 * Math.PI) / den;
        for(let i = 0; i < den; i++) {
            ctx.beginPath();
            ctx.moveTo(center, center);
            ctx.arc(center, center, radius, i * slice, (i + 1) * slice);
            ctx.fillStyle = i < num ? colors[i % colors.length] : '#1e293b';
            ctx.fill();
            ctx.lineWidth = 4; ctx.strokeStyle = '#0f172a'; ctx.stroke();
        }
    }
    draw();
  </script>
</body>
</html>
`;

// --- 3. EQUATION BALANCE SCALE (Grade 6-9) ---
const BALANCE_SCALE_HTML = `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: 'Inter', sans-serif; background: #0f172a; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
  canvas { background: #1e293b; border-radius: 12px; border: 1px solid #334155; margin-bottom: 20px; }
  .controls { display: flex; gap: 20px; }
  .control-group { background: #0f172a; padding: 15px; border-radius: 12px; border: 1px solid #334155; text-align: center; }
  h2 { margin: 0 0 10px 0; font-size: 16px; color: #94a3b8; }
  button { background: #3b82f6; border: none; color: white; width: 30px; height: 30px; border-radius: 4px; cursor: pointer; font-weight: bold; }
  button.red { background: #ef4444; }
  span { font-size: 20px; font-weight: bold; margin: 0 10px; width: 30px; display: inline-block; }
  .eq-display { font-size: 24px; font-weight: bold; color: #fbbf24; margin-bottom: 20px; font-family: monospace; }
</style>
</head>
<body>
  <div class="eq-display" id="eq">2x + 1 = 5</div>
  <canvas id="c" width="600" height="300"></canvas>
  <div class="controls">
    <div class="control-group">
      <h2>Left Side (x)</h2>
      <button class="red" onclick="update(leftX-1, leftC, rightC)">-</button>
      <span id="lx">2</span>
      <button onclick="update(leftX+1, leftC, rightC)">+</button>
    </div>
    <div class="control-group">
      <h2>Left Side (1)</h2>
      <button class="red" onclick="update(leftX, leftC-1, rightC)">-</button>
      <span id="lc">1</span>
      <button onclick="update(leftX, leftC+1, rightC)">+</button>
    </div>
    <div class="control-group">
      <h2>Right Side (1)</h2>
      <button class="red" onclick="update(leftX, leftC, rightC-1)">-</button>
      <span id="rc">5</span>
      <button onclick="update(leftX, leftC, rightC+1)">+</button>
    </div>
  </div>
  <script>
    const cvs = document.getElementById('c');
    const ctx = cvs.getContext('2d');
    let leftX = 2; let leftC = 1; let rightC = 5;
    const X_WEIGHT = 2; // Secret weight of X for simulation

    function update(lx, lc, rc) {
        if(lx < 0) lx = 0; if(lc < 0) lc = 0; if(rc < 0) rc = 0;
        leftX = lx; leftC = lc; rightC = rc;
        document.getElementById('lx').innerText = leftX;
        document.getElementById('lc').innerText = leftC;
        document.getElementById('rc').innerText = rightC;
        document.getElementById('eq').innerText = \`\${leftX}x + \${leftC} = \${rightC}\`;
        draw();
    }

    function draw() {
        ctx.clearRect(0,0,600,300);
        const totalLeft = (leftX * X_WEIGHT) + leftC;
        const totalRight = rightC;
        
        let tilt = (totalRight - totalLeft) * 2; 
        if(tilt > 20) tilt = 20; if(tilt < -20) tilt = -20;
        
        const cx = 300; const cy = 250;
        
        // Draw Base
        ctx.fillStyle = '#475569';
        ctx.beginPath(); ctx.moveTo(280, 300); ctx.lineTo(320, 300); ctx.lineTo(300, 200); ctx.fill();
        
        // Save for rotation
        ctx.save();
        ctx.translate(300, 200);
        ctx.rotate(tilt * Math.PI / 180);
        
        // Draw Beam
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-200, -5, 400, 10);
        
        // Draw Plates
        ctx.fillStyle = '#64748b';
        ctx.fillRect(-220, -5, 40, 5); // L
        ctx.fillRect(180, -5, 40, 5); // R
        
        // Draw Left Items
        let y = -5;
        for(let i=0; i<leftX; i++) {
            ctx.fillStyle = '#6366f1';
            ctx.fillRect(-210, y-30, 20, 30);
            ctx.strokeStyle='white'; ctx.strokeRect(-210, y-30, 20, 30);
            ctx.fillStyle='white'; ctx.font='12px sans-serif'; ctx.fillText('x', -204, y-10);
            y -= 32;
        }
        for(let i=0; i<leftC; i++) {
            ctx.fillStyle = '#10b981';
            ctx.fillRect(-210, y-20, 20, 20);
            ctx.strokeStyle='white'; ctx.strokeRect(-210, y-20, 20, 20);
            ctx.fillStyle='white'; ctx.font='10px sans-serif'; ctx.fillText('1', -204, y-5);
            y -= 22;
        }
        
        // Draw Right Items
        y = -5;
        for(let i=0; i<rightC; i++) {
            ctx.fillStyle = '#10b981';
            ctx.fillRect(190, y-20, 20, 20);
            ctx.strokeStyle='white'; ctx.strokeRect(190, y-20, 20, 20);
            ctx.fillStyle='white'; ctx.font='10px sans-serif'; ctx.fillText('1', 196, y-5);
            y -= 22;
        }

        ctx.restore();
        
        // Status
        ctx.font = 'bold 16px sans-serif';
        ctx.fillStyle = totalLeft === totalRight ? '#4ade80' : '#f87171';
        ctx.fillText(totalLeft === totalRight ? 'BALANCED' : 'UNBALANCED', 260, 50);
    }
    draw();
  </script>
</body>
</html>
`;

// --- 4. PROBABILITY LAB (Grade 7-12) ---
const PROBABILITY_LAB_HTML = `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: 'Inter', sans-serif; background: #0f172a; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
  .dashboard { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; width: 600px; }
  .card { background: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid #334155; text-align: center; }
  h2 { color: #94a3b8; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-top: 0; }
  .visual { height: 100px; display: flex; align-items: center; justify-content: center; font-size: 64px; margin: 10px 0; }
  button { background: #3b82f6; border: none; color: white; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 10px; width: 100%; }
  button:hover { background: #2563eb; }
  .bar-container { height: 150px; display: flex; align-items: flex-end; justify-content: space-around; gap: 4px; padding-top: 20px; }
  .bar { background: #6366f1; width: 100%; transition: height 0.3s; position: relative; border-radius: 4px 4px 0 0; }
  .bar-label { position: absolute; bottom: -20px; left: 0; right: 0; font-size: 10px; color: #94a3b8; }
  .bar-val { position: absolute; top: -15px; left: 0; right: 0; font-size: 10px; color: #fff; font-weight: bold; }
</style>
</head>
<body>
  <div class="dashboard">
    <div class="card">
      <h2>Coin Flipper</h2>
      <div class="visual" id="coin">🪙</div>
      <div style="display:flex; gap:10px;">
        <button onclick="flip(1)">Flip 1x</button>
        <button onclick="flip(100)">Flip 100x</button>
      </div>
    </div>
    <div class="card">
      <h2>Heads vs Tails</h2>
      <div class="bar-container" id="coinChart">
         <div class="bar" style="height: 0%"><span class="bar-val">0</span><span class="bar-label">H</span></div>
         <div class="bar" style="height: 0%"><span class="bar-val">0</span><span class="bar-label">T</span></div>
      </div>
    </div>
    
    <div class="card">
      <h2>Dice Roller</h2>
      <div class="visual" id="dice">🎲</div>
      <div style="display:flex; gap:10px;">
        <button onclick="roll(1)">Roll 1x</button>
        <button onclick="roll(100)">Roll 100x</button>
      </div>
    </div>
    <div class="card">
      <h2>Distribution (1-6)</h2>
      <div class="bar-container" id="diceChart">
         <!-- Bars generated by JS -->
      </div>
    </div>
  </div>

  <script>
    let heads = 0; let tails = 0;
    let diceCounts = [0,0,0,0,0,0];
    
    // Init Dice Chart
    const dChart = document.getElementById('diceChart');
    for(let i=0; i<6; i++) {
        const d = document.createElement('div');
        d.className = 'bar';
        d.innerHTML = \`<span class="bar-val">0</span><span class="bar-label">\${i+1}</span>\`;
        dChart.appendChild(d);
    }

    function flip(n) {
        for(let i=0; i<n; i++) {
            if(Math.random() > 0.5) heads++; else tails++;
        }
        document.getElementById('coin').innerText = Math.random() > 0.5 ? '🦅' : '👤';
        updateCoinChart();
    }

    function roll(n) {
        for(let i=0; i<n; i++) {
            const res = Math.floor(Math.random() * 6);
            diceCounts[res]++;
        }
        document.getElementById('dice').innerText = ['⚀','⚁','⚂','⚃','⚄','⚅'][Math.floor(Math.random()*6)];
        updateDiceChart();
    }

    function updateCoinChart() {
        const total = heads + tails || 1;
        const bars = document.getElementById('coinChart').children;
        bars[0].style.height = (heads/total * 100) + '%';
        bars[0].querySelector('.bar-val').innerText = heads;
        bars[1].style.height = (tails/total * 100) + '%';
        bars[1].querySelector('.bar-val').innerText = tails;
    }

    function updateDiceChart() {
        const total = diceCounts.reduce((a,b)=>a+b,0) || 1;
        const bars = dChart.children;
        const max = Math.max(...diceCounts) || 1; // Normalize by max for visibility
        for(let i=0; i<6; i++) {
            bars[i].style.height = (diceCounts[i]/max * 100) + '%';
            bars[i].querySelector('.bar-val').innerText = diceCounts[i];
        }
    }
  </script>
</body>
</html>
`;

// --- 5. QUADRATIC EXPLORER (High School) ---
const QUADRATIC_HTML = `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: 'Inter', sans-serif; background: #0f172a; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
  .wrapper { display: flex; gap: 20px; flex-wrap: wrap; justify-content: center; }
  .controls { background: #1e293b; padding: 20px; border-radius: 12px; width: 300px; }
  canvas { background: #020617; border-radius: 12px; border: 1px solid #334155; }
  .slider-group { margin-bottom: 20px; }
  label { display: flex; justify-content: space-between; font-weight: bold; color: #94a3b8; margin-bottom: 5px; }
  input[type=range] { width: 100%; accent-color: #6366f1; }
  .equation { font-size: 24px; font-weight: bold; color: #cbd5e1; text-align: center; padding: 10px; background: #0f172a; border-radius: 8px; margin-top: 20px; border: 1px solid #334155; font-family: 'Courier New', monospace; }
  span.val { color: #818cf8; }
</style>
</head>
<body>
  <h2 style="margin-bottom: 20px;">Quadratic Explorer</h2>
  <div class="wrapper">
    <canvas id="graph" width="400" height="400"></canvas>
    <div class="controls">
      <div class="slider-group">
        <label>a (Stretch): <span id="aVal" class="val">1</span></label>
        <input type="range" min="-5" max="5" step="0.1" value="1" oninput="update()">
      </div>
      <div class="slider-group">
        <label>h (Horizontal): <span id="hVal" class="val">0</span></label>
        <input type="range" min="-5" max="5" step="0.1" value="0" oninput="update()">
      </div>
      <div class="slider-group">
        <label>k (Vertical): <span id="kVal" class="val">0</span></label>
        <input type="range" min="-5" max="5" step="0.1" value="0" oninput="update()">
      </div>
      <div class="equation" id="eq">y = x²</div>
    </div>
  </div>
  <script>
    const cvs = document.getElementById('graph'); const ctx = cvs.getContext('2d'); const inputs = document.querySelectorAll('input');
    function update() {
        const a = parseFloat(inputs[0].value); const h = parseFloat(inputs[1].value); const k = parseFloat(inputs[2].value);
        document.getElementById('aVal').innerText = a; document.getElementById('hVal').innerText = h; document.getElementById('kVal').innerText = k;
        let eq = 'y = '; if (a !== 1) eq += a;
        if (h > 0) eq += '(x - ' + h + ')²'; else if (h < 0) eq += '(x + ' + Math.abs(h) + ')²'; else eq += 'x²';
        if (k > 0) eq += ' + ' + k; else if (k < 0) eq += ' - ' + Math.abs(k);
        document.getElementById('eq').innerText = eq;
        draw(a, h, k);
    }
    function draw(a, h, k) {
        ctx.clearRect(0,0,400,400);
        ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1; ctx.beginPath();
        for(let i=0; i<=400; i+=40) { ctx.moveTo(i, 0); ctx.lineTo(i, 400); ctx.moveTo(0, i); ctx.lineTo(400, i); } ctx.stroke();
        ctx.strokeStyle = '#475569'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(200, 0); ctx.lineTo(200, 400); ctx.moveTo(0, 200); ctx.lineTo(400, 200); ctx.stroke();
        ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 3; ctx.beginPath();
        const scale = 40; 
        for(let px=0; px<=400; px++) {
            const x = (px - 200) / scale; const y = a * Math.pow((x - h), 2) + k; const py = 200 - (y * scale);
            if(px===0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        } ctx.stroke();
    }
    update();
  </script>
</body>
</html>
`;

// --- 6. UNIT CIRCLE (Trig) ---
const UNIT_CIRCLE_HTML = `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: 'Inter', sans-serif; background: #0f172a; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
  canvas { background: #1e293b; border-radius: 50%; border: 4px solid #334155; cursor: crosshair; box-shadow: 0 0 50px rgba(99,102,241,0.2); }
  .info { position: absolute; top: 20px; left: 20px; background: rgba(15,23,42,0.9); padding: 20px; border-radius: 12px; border: 1px solid #334155; pointer-events: none; }
  h1 { margin: 0 0 10px 0; font-size: 18px; color: #a5b4fc; }
  .stat { font-family: monospace; font-size: 16px; margin: 5px 0; }
  .sin { color: #f43f5e; } .cos { color: #3b82f6; }
</style>
</head>
<body>
  <div class="info"><h1>Unit Circle</h1><div class="stat">Angle: <span id="deg">0</span>°</div><div class="stat">Rad: <span id="rad">0</span>π</div><div class="stat cos">Cos(x): <span id="cos">1.00</span></div><div class="stat sin">Sin(y): <span id="sin">0.00</span></div></div>
  <canvas id="c" width="500" height="500"></canvas>
  <script>
    const cvs = document.getElementById('c'); const ctx = cvs.getContext('2d'); const cx = 250, cy = 250, r = 200;
    function draw(angle) {
        ctx.clearRect(0,0,500,500);
        ctx.strokeStyle = '#475569'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, 500); ctx.moveTo(0, cy); ctx.lineTo(500, cy); ctx.stroke();
        ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
        const x = cx + Math.cos(angle) * r; const y = cy - Math.sin(angle) * r;
        ctx.strokeStyle = 'white'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke();
        ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, cy); ctx.stroke();
        ctx.strokeStyle = '#f43f5e'; ctx.beginPath(); ctx.moveTo(x, cy); ctx.lineTo(x, y); ctx.stroke();
        ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI*2); ctx.fill();
        let deg = Math.round((angle * 180 / Math.PI)); if(deg < 0) deg += 360;
        document.getElementById('deg').innerText = deg; document.getElementById('rad').innerText = (deg/180).toFixed(2);
        document.getElementById('cos').innerText = Math.cos(angle).toFixed(3); document.getElementById('sin').innerText = Math.sin(angle).toFixed(3);
    }
    cvs.addEventListener('mousemove', e => {
        const rect = cvs.getBoundingClientRect(); const mx = e.clientX - rect.left - cx; const my = e.clientY - rect.top - cy;
        let angle = Math.atan2(-my, mx); if (angle < 0) angle += Math.PI * 2; draw(angle);
    });
    draw(Math.PI / 4);
  </script>
</body>
</html>
`;

const getXpByType = (type: ContentType): number => {
    switch (type) {
        case 'Project': return 150;
        case 'Game': return 100;
        case 'Lesson': return 50;
        case 'Practice': return 25;
        default: return 10;
    }
};

const createLesson = (input: string | { title: string, type: ContentType, html?: string }): Task => {
  const isObject = typeof input !== 'string';
  const title = isObject ? input.title : input;
  const type: ContentType = isObject ? input.type : 'Lesson';
  const htmlContent = isObject ? input.html : undefined;

  return {
    id: createId(),
    title,
    description: `Master the concepts of ${title}.`,
    xp: getXpByType(type),
    isCompleted: false,
    type,
    resources: [],
    htmlContent
  };
};

const createUnit = (yearId: string, title: string, lessonsInput: (string | { title: string, type: ContentType, html?: string })[], category: string = 'Math'): Quest => {
  const tasks = lessonsInput.map(createLesson);
  
  // Scaffolding: Ensure content variety
  if (typeof lessonsInput[0] === 'string') {
      tasks.forEach((task, index) => {
          if (index % 5 === 4) {
              task.type = 'Project';
              task.title = `${task.title} (Mini-Project)`;
              task.xp = 150;
          } else if (index % 3 === 2) {
              task.type = 'Game';
              task.title = `${task.title} (Activity)`;
              task.xp = 100;
          } else {
              task.type = 'Lesson';
              task.xp = 50;
          }
      });
  }

  const totalXp = tasks.reduce((sum, t) => sum + t.xp, 0);

  return {
    id: createId(),
    title,
    description: `Comprehensive module covering ${title}.`,
    category,
    difficulty: 'Intermediate',
    totalXp,
    earnedXp: 0,
    tasks,
    createdAt: new Date().toISOString(),
    status: 'active',
    yearId
  };
};

export const getStandardCurriculum = (): AppData => {
  const years: Year[] = [];
  const quests: Quest[] = [];
  const classes: ClassGroup[] = [];
  const students: Student[] = [];

  const addYear = (title: string, units: { title: string, lessons: (string | { title: string, type: ContentType, html?: string })[] }[]) => {
    const yearId = createId();
    years.push({ id: yearId, title });
    units.forEach(u => {
      quests.push(createUnit(yearId, u.title, u.lessons));
    });
    return yearId;
  };

  // --- KINDERGARTEN (Reveal Math) ---
  const kId = addYear("Kindergarten", [
    { title: "Unit 1: Math Is...", lessons: ["Math in Our World", "Patterns in Nature", "Logic & Reasoning"] },
    { title: "Unit 2: Numbers 0-5", lessons: ["Count 0-5", {title: "Shape Sorting", type: 'Game', html: SHAPE_SORTER_HTML}, "Write 0-5", "Compare Numbers", "One More/One Less"] },
    { title: "Unit 3: Numbers 6-10", lessons: ["Count 6-10", "Write 6-10", "Compare Numbers 6-10", "Ordinal Numbers"] },
    { title: "Unit 4: Sort and Classify", lessons: ["Sort by Color", "Sort by Shape", "Sort by Size", "Count Groups"] },
    { title: "Unit 5: Compose/Decompose to 10", lessons: ["Make 5", "Make 10", "Number Bonds", "Part-Part-Whole"] },
    { title: "Unit 6: Numbers 11-19", lessons: ["Count 11-19", "Tens and Ones Intro", "Write 11-19"] },
    { title: "Unit 7: Measurement", lessons: ["Compare Length", "Compare Height", "Compare Weight", "Capacity"] },
    { title: "Unit 8: 2D Shapes", lessons: ["Circles and Triangles", {title: "Shape Hunt", type: 'Game', html: SHAPE_SORTER_HTML}, "Squares and Rectangles", "Hexagons"] },
    { title: "Unit 9: 3D Shapes", lessons: ["Spheres and Cubes", "Cones and Cylinders", "Positional Words"] },
    { title: "Unit 10: Addition", lessons: ["Putting Together", "Plus Sign", "Addition Stories"] },
    { title: "Unit 11: Subtraction", lessons: ["Taking Away", "Minus Sign", "Subtraction Stories"] },
    { title: "Unit 12: Count to 100", lessons: ["Count by 1s", "Count by 10s", "Hundred Chart Intro"] },
  ]);

  // --- GRADE 1 (Reveal Math) ---
  const g1Id = addYear("Grade 1", [
    { title: "Unit 1: Math Is...", lessons: ["Math Thinking", "Problem Solving", "Patterns"] },
    { title: "Unit 2: Number Concepts", lessons: ["Count to 120", "Tens and Ones", "Compare Numbers", "Read/Write Numbers"] },
    { title: "Unit 3: Addition Facts", lessons: ["Count On", "Doubles", "Doubles Plus One", "Make a 10"] },
    { title: "Unit 4: Subtraction Facts", lessons: ["Count Back", "Related Facts", "Think Addition", "Missing Addends"] },
    { title: "Unit 5: Geometry", lessons: ["2D Shapes Attributes", "3D Shapes", {title: "Shape Sorter", type: 'Game', html: SHAPE_SORTER_HTML}, "Halves and Fourths"] },
    { title: "Unit 6: Place Value", lessons: ["Understand Tens", "Expanded Form", "Compare 2-Digit Numbers"] },
    { title: "Unit 7: Measurement", lessons: ["Order Length", "Measure with Tiles", "Measure with Ruler"] },
    { title: "Unit 8: Data", lessons: ["Tally Charts", "Picture Graphs", "Bar Graphs"] },
    { title: "Unit 9: 2-Digit Addition", lessons: ["Add Tens", "Count On by Tens", "Add 2-Digit and 1-Digit"] },
    { title: "Unit 10: 2-Digit Subtraction", lessons: ["Subtract Tens", "Mental Math", "Subtracting on Number Line"] },
    { title: "Unit 11: Money", lessons: ["Pennies and Nickels", "Dimes and Quarters", "Counting Coins"] },
    { title: "Unit 12: Time", lessons: ["Hour Hand", "Minute Hand", "Time to the Hour", "Time to Half Hour"] },
  ]);

  // --- GRADE 2 (Reveal Math) ---
  const g2Id = addYear("Grade 2", [
    { title: "Unit 1: Math Is...", lessons: ["Math Models", "Precision", "Logic"] },
    { title: "Unit 2: Place Value", lessons: ["Hundreds", "Expanded Form", "Read/Write to 1,000", "Compare Numbers"] },
    { title: "Unit 3: Basic Facts", lessons: ["Fluency Strategies", "Even and Odd Numbers", "Arrays"] },
    { title: "Unit 4: 2-Digit Addition", lessons: ["Partial Sums", "Regrouping Ones", "Add 3 Numbers"] },
    { title: "Unit 5: 2-Digit Subtraction", lessons: ["Regrouping Tens", "Subtract from 2-Digit", "Word Problems"] },
    { title: "Unit 6: 3-Digit Addition", lessons: ["Mental Math", "Regrouping Hundreds", "Add 3-Digit Numbers"] },
    { title: "Unit 7: 3-Digit Subtraction", lessons: ["Subtract 3-Digit", "Regrouping across Zeros", "Problem Solving"] },
    { title: "Unit 8: Money", lessons: ["Dollar Bills", "Counting Mixed Coins", "Making Change"] },
    { title: "Unit 9: Time", lessons: ["Time to 5 Mins", "AM vs PM", "Elapsed Time Intro"] },
    { title: "Unit 10: Measurement", lessons: ["Inches and Feet", "Centimeters and Meters", "Measuring Tools"] },
    { title: "Unit 11: Data", lessons: ["Line Plots", "Bar Graphs", "Pictographs"] },
    { title: "Unit 12: Geometry", lessons: ["Polygons", "Angles", "Partition Rectangles", "Cubes"] },
  ]);

  // --- GRADE 3 (Reveal Math) ---
  const g3Id = addYear("Grade 3", [
    { title: "Unit 1: Math Is...", lessons: ["Math Practices", "Visualizing Math"] },
    { title: "Unit 2: Intro to Multiplication", lessons: ["Equal Groups", "Arrays", "Repeated Addition"] },
    { title: "Unit 3: Intro to Division", lessons: ["Partitioning", "Repeated Subtraction", "Relating to Mult"] },
    { title: "Unit 4: Multiplication Facts", lessons: ["Factors 2, 5, 10", "Factors 3, 4, 6", "Factors 7, 8, 9"] },
    { title: "Unit 5: Properties", lessons: ["Commutative Property", "Associative Property", "Distributive Property"] },
    { title: "Unit 6: Fractions", lessons: ["Unit Fractions", {title: "Fraction Builder", type: 'Game', html: FRACTION_BUILDER_HTML}, "Fractions on Number Line", "Equivalent Fractions", "Comparing Fractions"] },
    { title: "Unit 7: Measurement", lessons: ["Time to Minute", "Elapsed Time", "Liquid Volume", "Mass"] },
    { title: "Unit 8: Area", lessons: ["Square Units", "Area of Rectangles", "Distributive Property Area"] },
    { title: "Unit 9: Perimeter", lessons: ["Perimeter of Polygons", "Unknown Side Lengths", "Area vs Perimeter"] },
    { title: "Unit 10: Geometry", lessons: ["Quadrilaterals", "Shared Attributes", "Partition Shapes"] },
    { title: "Unit 11: Addition/Subtraction", lessons: ["Rounding", "Estimation", "Add/Sub to 1,000"] },
    { title: "Unit 12: Data", lessons: ["Scaled Bar Graphs", "Scaled Picture Graphs", "Line Plots"] },
  ]);

  // --- GRADE 4 (Reveal Math) ---
  const g4Id = addYear("Grade 4", [
    { title: "Unit 1: Math Is...", lessons: ["Math Arguments", "Modeling"] },
    { title: "Unit 2: Generalize Place Value", lessons: ["Place Value to 1M", "Read/Write Multi-Digit", "Compare/Order", "Rounding"] },
    { title: "Unit 3: Add/Sub Multi-Digit", lessons: ["Standard Algorithm Addition", "Standard Algorithm Subtraction", "Tape Diagrams"] },
    { title: "Unit 4: Multiply by 1-Digit", lessons: ["Multiplicative Comparison", "Area Models", "Partial Products", "Standard Algorithm"] },
    { title: "Unit 5: Multiply by 2-Digit", lessons: ["Estimating Products", "Area Models 2-Digit", "Partial Products"] },
    { title: "Unit 6: Division", lessons: ["Remainders", "Long Division", "Partial Quotients", "Word Problems"] },
    { title: "Unit 7: Factors & Multiples", lessons: ["Factor Pairs", "Prime vs Composite", "Multiples"] },
    { title: "Unit 8: Fraction Equivalence", lessons: ["Equivalent Fractions", "Simplifying", {title: "Fraction Visualizer", type: 'Game', html: FRACTION_BUILDER_HTML}, "Common Denominators"] },
    { title: "Unit 9: Fraction Ops (+/-)", lessons: ["Add Like Denominators", "Subtract Like Denominators", "Mixed Numbers"] },
    { title: "Unit 10: Fraction Ops (x)", lessons: ["Mult Fraction by Whole", "Word Problems"] },
    { title: "Unit 11: Decimals", lessons: ["Tenths and Hundredths", "Decimals as Fractions", "Compare Decimals"] },
    { title: "Unit 12: Geometry", lessons: ["Points/Lines/Rays", "Angles", "Parallel/Perpendicular", "Symmetry"] },
    { title: "Unit 13: Measurement", lessons: ["Convert Customary", "Convert Metric", "Area/Perimeter Formulas"] },
    { title: "Unit 14: Algebra", lessons: ["Patterns", "Multi-Step Problems"] },
  ]);

  // --- GRADE 5 (Reveal Math) ---
  const g5Id = addYear("Grade 5", [
    { title: "Unit 1: Math Is...", lessons: ["Math Structures", "Patterns"] },
    { title: "Unit 2: Volume", lessons: ["Unit Cubes", "Volume Formula", "Composite Figures"] },
    { title: "Unit 3: Place Value", lessons: ["Powers of 10", "Read/Write Decimals", "Rounding Decimals"] },
    { title: "Unit 4: Add/Sub Decimals", lessons: ["Estimate Sums/Diffs", "Models", "Standard Algorithm"] },
    { title: "Unit 5: Multiply Multi-Digit", lessons: ["Standard Algorithm", "Estimate Products"] },
    { title: "Unit 6: Multiply Decimals", lessons: ["Models", "Placement of Decimal Point", "Properties"] },
    { title: "Unit 7: Divide Whole Numbers", lessons: ["2-Digit Divisors", "Partial Quotients", "Interpret Remainders"] },
    { title: "Unit 8: Divide Decimals", lessons: ["Divide by Whole Number", "Divide by Decimal", "Patterns"] },
    { title: "Unit 9: Add/Sub Fractions", lessons: ["Unlike Denominators", {title: "Fraction Lab", type: 'Game', html: FRACTION_BUILDER_HTML}, "Mixed Numbers", "Renaming"] },
    { title: "Unit 10: Multiply Fractions", lessons: ["Fraction x Whole", "Fraction x Fraction", "Area Tiling"] },
    { title: "Unit 11: Divide Fractions", lessons: ["Unit Fraction / Whole", "Whole / Unit Fraction", "Word Problems"] },
    { title: "Unit 12: Measurement", lessons: ["Convert Units", "Line Plots", "Measurement Data"] },
    { title: "Unit 13: Geometry", lessons: ["Classify Polygons", "Hierarchy of Shapes", "Triangles"] },
    { title: "Unit 14: Coordinate Plane", lessons: ["Plotting Points", "Real World Problems", "Patterns/Graphing"] },
  ]);

  // --- GRADE 6 (Reveal Math Course 1) ---
  const g6Id = addYear("Grade 6 (Course 1)", [
    { title: "Unit 1: Math Is...", lessons: ["Thinking Like a Mathematician", "Problem Solving Strategies"] },
    { title: "Unit 2: Area & Surface Area", lessons: ["Area of Parallelograms", "Area of Triangles", "Polygons", "Nets", "Surface Area"] },
    { title: "Unit 3: Ratios & Rates", lessons: ["Intro to Ratios", "Equivalent Ratios", "Ratio Tables", "Unit Rates"] },
    { title: "Unit 4: Percents", lessons: ["Understanding Percent", "Fractions/Decimals/Percents", "Percent of a Number"] },
    { title: "Unit 5: Fraction Operations", lessons: ["Dividing Fractions", {title: "Visualizing Division", type: 'Game', html: FRACTION_BUILDER_HTML}, "Dividing Mixed Numbers", "Word Problems"] },
    { title: "Unit 6: Decimal Operations", lessons: ["Add/Sub Decimals", "Multiply Decimals", "Divide Decimals"] },
    { title: "Unit 7: Integers & Rational #s", lessons: ["Integers", "Rational Numbers", "Absolute Value", "Coordinate Plane"] },
    { title: "Unit 8: Intro to Algebra", lessons: ["Powers/Exponents", "Order of Operations", "Variables", "Distributive Property"] },
    { title: "Unit 9: Equations & Inequalities", lessons: ["One-Step Addition Eq", {title: "Equation Balance", type: 'Game', html: BALANCE_SCALE_HTML}, "One-Step Multiplication Eq", "Inequalities"] },
    { title: "Unit 10: Relationships", lessons: ["Independent/Dependent Variables", "Tables and Graphs", "Writing Equations"] },
    { title: "Unit 11: Volume", lessons: ["Volume of Prisms", "Fractional Edge Lengths"] },
    { title: "Unit 12: Statistical Measures", lessons: ["Statistical Questions", "Mean", "Median", "Mode", "Range"] },
    { title: "Unit 13: Statistical Displays", lessons: ["Dot Plots", "Histograms", "Box Plots"] },
  ]);

  // --- GRADE 7 (Reveal Math Course 2) ---
  const g7Id = addYear("Grade 7 (Course 2)", [
    { title: "Unit 1: Proportional Relationships", lessons: ["Unit Rates", "Proportionality", "Constant of Proportionality", "Graphs"] },
    { title: "Unit 2: Percent Problems", lessons: ["Percent Increase/Decrease", "Markups/Discounts", "Simple Interest"] },
    { title: "Unit 3: Integer Operations", lessons: ["Add/Sub Integers", "Mult/Div Integers", "Order of Operations"] },
    { title: "Unit 4: Rational Number Ops", lessons: ["Add/Sub Rationals", "Mult/Div Rationals", "Complex Fractions"] },
    { title: "Unit 5: Expressions", lessons: ["Simplify Expressions", "Expand/Factor Linear Expressions"] },
    { title: "Unit 6: Equations & Inequalities", lessons: ["Two-Step Equations", "Multi-Step Equations", "Solving Inequalities"] },
    { title: "Unit 7: Geometry", lessons: ["Scale Drawings", "Triangles", "Angle Relationships"] },
    { title: "Unit 8: Circles", lessons: ["Circumference", "Area of Circles", "Composite Figures"] },
    { title: "Unit 9: 3D Geometry", lessons: ["Surface Area of Prisms", "Volume of Prisms/Pyramids", "Slicing Solids"] },
    { title: "Unit 10: Probability", lessons: ["Probability Scale", "Theoretical Probability", {title: "Simulation Lab", type: 'Game', html: PROBABILITY_LAB_HTML}, "Compound Events"] },
    { title: "Unit 11: Sampling", lessons: ["Populations/Samples", "Random Sampling", "Inferences"] },
    { title: "Unit 12: Comparing Populations", lessons: ["Comparing Centers", "Comparing Variability", "Visual Overlap"] },
  ]);

  // --- GRADE 8 (Reveal Math Course 3) ---
  const g8Id = addYear("Grade 8 (Course 3)", [
    { title: "Unit 1: Exponents", lessons: ["Integer Exponents", "Properties", "Scientific Notation"] },
    { title: "Unit 2: Real Numbers", lessons: ["Roots", "Irrational Numbers", "Approximating Roots"] },
    { title: "Unit 3: Equations", lessons: ["Variables on Both Sides", {title: "Balance Scale Pro", type: 'Game', html: BALANCE_SCALE_HTML}, "Multi-Step Equations", "No/Infinite Solutions"] },
    { title: "Unit 4: Linear Relationships", lessons: ["Slope", "Y-Intercept", "Slope-Intercept Form", {title: "Slope Simulator", type: 'Game', html: QUADRATIC_HTML}] },
    { title: "Unit 5: Functions", lessons: ["Intro to Functions", "Linear vs Nonlinear", "Graphing Functions"] },
    { title: "Unit 6: Systems", lessons: ["Graphing Systems", "Substitution", "Elimination", "Word Problems"] },
    { title: "Unit 7: Triangles", lessons: ["Triangle Angle Sum", "Exterior Angles", "Pythagorean Theorem", "Distance Formula"] },
    { title: "Unit 8: Transformations", lessons: ["Translations", "Reflections", "Rotations", "Dilations"] },
    { title: "Unit 9: Congruence/Similarity", lessons: ["Congruence", "Similarity", "Transversals"] },
    { title: "Unit 10: Volume", lessons: ["Cylinders", "Cones", "Spheres"] },
    { title: "Unit 11: Scatter Plots", lessons: ["Bivariate Data", "Line of Best Fit", "Two-Way Tables"] },
  ]);

  // --- HIGH SCHOOL (Traditional) ---

  const alg1Id = addYear("Algebra I", [
      { title: "Unit 1: Equations", lessons: ["Solving Multi-Step", {title: "Eq Solver", type: 'Game', html: BALANCE_SCALE_HTML}, "Literal Equations", "Inequalities"] },
      { title: "Unit 2: Linear Functions", lessons: ["Slope-Intercept Form", "Standard Form", "Parallel/Perpendicular"] },
      { title: "Unit 3: Systems", lessons: ["Graphing Systems", "Substitution", "Elimination"] },
      { title: "Unit 4: Quadratics (Graphing)", lessons: ["Graphing Parabolas", {title: "Quadratic Explorer", type: 'Game', html: QUADRATIC_HTML}, "Vertex Form", "Transformations"] },
      { title: "Unit 5: Quadratics (Solving)", lessons: ["Factoring", "Completing the Square", "Quadratic Formula"] },
      { title: "Unit 6: Exponentials", lessons: ["Exponent Properties", "Growth & Decay", "Geometric Sequences"] },
      { title: "Unit 7: Polynomials", lessons: ["Add/Sub Polynomials", "Multiplying Polynomials", "Special Products"] },
      { title: "Unit 8: Data Analysis", lessons: ["Box Plots", "Histograms", "Standard Deviation", "Correlation"] },
  ]);

  const geomId = addYear("Geometry", [
      { title: "Unit 1: Foundations", lessons: ["Points/Lines/Planes", "Midpoint/Distance", "Angle Pairs"] },
      { title: "Unit 2: Reasoning", lessons: ["Inductive/Deductive", "Conditional Statements", "Proofs"] },
      { title: "Unit 3: Triangles", lessons: ["Congruence (SSS, SAS)", "Bisectors", "Inequalities in Triangles"] },
      { title: "Unit 4: Polygons", lessons: ["Parallelograms", "Trapezoids", "Kites", "Polygon Sum Thm"] },
      { title: "Unit 5: Circles", lessons: ["Tangents", "Arcs/Chords", {title: "Circle Theorems Sim", type: 'Game', html: UNIT_CIRCLE_HTML}, "Sector Area"] },
      { title: "Unit 6: Similarity", lessons: ["Dilations", "Similar Triangles", "Proportional Parts"] },
      { title: "Unit 7: Trig", lessons: ["SOH CAH TOA", "Special Right Triangles", "Angles of Elevation"] },
      { title: "Unit 8: Solids", lessons: ["Prisms", "Cylinders", "Pyramids", "Cones", "Spheres"] },
  ]);

  const alg2Id = addYear("Algebra II", [
      { title: "Unit 1: Functions", lessons: ["Domain/Range", "Piecewise Functions", "Absolute Value"] },
      { title: "Unit 2: Quadratics", lessons: ["Complex Numbers", "Completing the Square", "Systems"] },
      { title: "Unit 3: Polynomials", lessons: ["Operations", "Synthetic Division", "End Behavior", "Fundamental Theorem"] },
      { title: "Unit 4: Radicals", lessons: ["Roots", "Rational Exponents", "Inverses", "Radical Equations"] },
      { title: "Unit 5: Trig", lessons: ["Unit Circle", {title: "Interactive Unit Circle", type: 'Game', html: UNIT_CIRCLE_HTML}, "Graphing Sine/Cosine", "Identities"] },
      { title: "Unit 6: Exponentials", lessons: ["Logarithms", "Properties of Logs", "Solving Log Eq", "Natural Base e"] },
      { title: "Unit 7: Rational Funcs", lessons: ["Inverse Variation", "Graphing Rationals", "Operations"] },
      { title: "Unit 8: Probability", lessons: ["Permutations", "Combinations", "Normal Distribution"] },
  ]);

  const preCalcId = addYear("Pre-Calculus", [
    { title: "Unit 1: Functions", lessons: ["Composite Functions", "Inverse Functions", "Transformations"] },
    { title: "Unit 2: Trig", lessons: ["Law of Sines/Cosines", "Vectors", "Parametric Eq"] },
    { title: "Unit 3: Conics", lessons: ["Parabolas", "Ellipses", "Hyperbolas"] },
    { title: "Unit 4: Matrices", lessons: ["Operations", "Determinants", "Cramer's Rule"] },
    { title: "Unit 5: Polar", lessons: ["Polar Coordinates", "Polar Equations", "Complex Plane"] },
    { title: "Unit 6: Sequences", lessons: ["Arithmetic", "Geometric", "Induction", "Binomial Thm"] },
    { title: "Unit 7: Limits", lessons: ["Intro to Limits", "Evaluating Limits", "Tangent Lines"] },
  ]);

  const calcId = addYear("Calculus", [
    { title: "Unit 1: Limits", lessons: ["Graphical Limits", "Algebraic Limits", "Continuity", "Infinite Limits"] },
    { title: "Unit 2: Derivatives", lessons: ["Power Rule", "Product/Quotient Rules", "Chain Rule", "Implicit Differentiation"] },
    { title: "Unit 3: Applications", lessons: ["Related Rates", "Extrema", "Optimization", "MVT"] },
    { title: "Unit 4: Integration", lessons: ["Riemann Sums", "Definite Integrals", "FTC", "U-Substitution"] },
    { title: "Unit 5: Diff Eq", lessons: ["Slope Fields", "Separable Equations", "Growth/Decay"] },
    { title: "Unit 6: Area/Volume", lessons: ["Area Between Curves", "Disk Method", "Washer Method"] },
  ]);

  // --- MOCK CLASS DATA ---
  const yearsList = [
    { id: kId, label: 'Kindergarten' }, { id: g3Id, label: '3rd Grade' }, { id: g6Id, label: '6th Grade' }, { id: alg1Id, label: 'Algebra I' }
  ];

  yearsList.forEach(y => {
      const clsId = createId();
      // Generate 2 random students per demo class
      const newStudents: Student[] = Array.from({length: 2}).map((_, i) => ({
          id: createId(),
          name: `Student ${i+1} (${y.label})`,
          email: `student${i}_${y.label.replace(/\s/g,'')}@school.edu`.toLowerCase(),
          xp: Math.floor(Math.random() * 2000),
          level: Math.floor(Math.random() * 3) + 1,
          streak: Math.floor(Math.random() * 5),
          completedTasks: Math.floor(Math.random() * 10),
          lastActive: new Date().toISOString(),
          status: 'active'
      }));
      
      students.push(...newStudents);
      classes.push({
          id: clsId,
          title: `${y.label} - Section A`,
          yearId: y.id,
          studentIds: newStudents.map(s => s.id)
      });
  });

  return {
    quests,
    years,
    classes,
    students,
    stats: {
        level: 1,
        currentXp: 0,
        nextLevelXp: 100,
        totalQuestsCompleted: 0,
        streakDays: 0,
        earnedBadges: [],
        dailyHistory: []
    }
  };
};
