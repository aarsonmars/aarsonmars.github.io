// Canvas setup
const canvas = document.getElementById('drawCanvas');
const ctx = canvas.getContext('2d');
const statsDiv = document.getElementById('stats');
const scoreDiv = document.getElementById('score');
let showFitCircle = false;
let points = [];

// Event listeners for buttons
document.getElementById('clearBtn').addEventListener('click', clearCanvas);
document.getElementById('toggleBtn').addEventListener('click', toggleFitCircle);

// Make canvas responsive
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    let size;
    if (window.innerWidth < 600) {
        const horizontalPadding = 20; // matches .container padding
        size = window.innerWidth - horizontalPadding * 2;
    } else {
        const container = document.querySelector('.canvas-container');
        size = container.clientWidth; // fill full container width on web/desktop
    }

    // CSS display size
    canvas.style.width  = size + 'px';
    canvas.style.height = size + 'px';

    // actual pixel buffer
    canvas.width  = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    redraw();
}

// Initialize and handle resize
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Drawing state
let isDrawing = false;

// Mouse event handlers
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseleave', stopDrawing);

// Touch event handlers
canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchmove', handleTouchMove);
canvas.addEventListener('touchend', handleTouchEnd);

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

function handleTouchEnd(e) {
    e.preventDefault();
    const mouseEvent = new MouseEvent('mouseup', {});
    canvas.dispatchEvent(mouseEvent);
}

function startDrawing(e) {
    isDrawing = true;
    points = [];
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    points.push({ x, y });
    
    // Start new path
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
}

function draw(e) {
    if (!isDrawing) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    points.push({ x, y });
    
    ctx.lineTo(x, y);
    ctx.stroke();
}

function stopDrawing() {
    if (!isDrawing) return;
    isDrawing = false;

    if (points.length > 10) {
        // detect straight line by endpoint/length ratio
        if (isStraightLine(points)) {
            statsDiv.innerHTML = "Not a circle";
            scoreDiv.textContent = "0%";
            return;
        }
        // check if shape is closed (endpoints close enough)
        const first = points[0], last = points[points.length - 1];
        const dx = last.x - first.x, dy = last.y - first.y;
        const dist = Math.hypot(dx, dy);
        // bounding-box diagonal
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const p of points) {
            minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
        }
        const diag = Math.hypot(maxX - minX, maxY - minY);
        // require endpoints within 25% of diagonal
        if (dist > diag * 0.25) {
            statsDiv.innerHTML = "Shape not closed";
            scoreDiv.textContent = "0%";
            return;
        }
        // fit circle
        const { center, radius, error, perfectness } = fitCircle(points);
        displayStats(center, radius, error, perfectness);
        if (showFitCircle) {
            drawFitCircle(center, radius);
        }
    } else {
        statsDiv.innerHTML = "Draw a bigger circle!";
        scoreDiv.textContent = "0%";
    }
}

// detect nearly straight strokes
function isStraightLine(points) {
    const first = points[0], last = points[points.length - 1];
    const dx = last.x - first.x, dy = last.y - first.y;
    const len = Math.hypot(dx, dy);
    if (len === 0) return false;
    // detect straight by comparing direct vs stroke length
    let strokeLen = 0;
    for (let i = 1; i < points.length; i++) {
        const pdx = points[i].x - points[i - 1].x;
        const pdy = points[i].y - points[i - 1].y;
        strokeLen += Math.hypot(pdx, pdy);
    }
    if (len / strokeLen > 0.98) return true;
    // existing deviation check
    let maxDist = 0;
    for (const p of points) {
        const distLine = Math.abs(dy * (p.x - first.x) - dx * (p.y - first.y)) / len;
        if (distLine > maxDist) maxDist = distLine;
    }
    return maxDist / len < 0.02;
}

function fitCircle(points) {
    // Algebraic least‑squares (Kasa) circle fit
    let sumX=0, sumY=0, sumX2=0, sumY2=0, sumXY=0, sumX3=0, sumY3=0, sumX2Y=0, sumXY2=0;
    const N = points.length;
    for (const p of points) {
        const x = p.x, y = p.y;
        const x2 = x*x, y2 = y*y;
        sumX += x; sumY += y;
        sumX2 += x2; sumY2 += y2;
        sumXY += x*y;
        sumX3 += x2*x; sumY3 += y2*y;
        sumX2Y += x2*y; sumXY2 += x*y2;
    }
    const C = N*sumX2 - sumX*sumX;
    const D = N*sumXY - sumX*sumY;
    const E = N*(sumX3 + sumXY2) - (sumX2 + sumY2)*sumX;
    const G = N*sumY2 - sumY*sumY;
    const H = N*(sumX2Y + sumY3) - (sumX2 + sumY2)*sumY;
    const denom = 2*(C*G - D*D);
    const centerX = (G*E - D*H) / denom;
    const centerY = (C*H - D*E) / denom;
    const radius = Math.sqrt((sumX2 + sumY2 - 2*centerX*sumX - 2*centerY*sumY)/N + centerX*centerX + centerY*centerY);

    // compute deviation and perfectness
    let sumErrorSq = 0;
    for (const p of points) {
        const d = Math.hypot(p.x - centerX, p.y - centerY);
        const err = d - radius;
        sumErrorSq += err*err;
    }
    const stdDev = Math.sqrt(sumErrorSq/N);
    const errorRatio = stdDev / radius;
    let perfectness = 100 * (1 - Math.min(1, errorRatio*3));
    perfectness = Math.max(0, Math.round(perfectness));

    return {
        center: { x: centerX, y: centerY },
        radius,
        error: stdDev,
        perfectness
    };
}

function displayStats(center, radius, error, perfectness) {
    statsDiv.innerHTML = `
        Center: (${center.x.toFixed(0)}, ${center.y.toFixed(0)}) <br>
        Radius: ${radius.toFixed(1)} <br>
        Error: ${error.toFixed(2)}
    `;
    scoreDiv.textContent = `${perfectness}%`;
    
    // Change color based on score
    const scoreContainer = document.querySelector('.score-display');
    if (perfectness > 80) {
        scoreContainer.style.backgroundColor = '#4CAF50'; // Green
    } else if (perfectness > 60) {
        scoreContainer.style.backgroundColor = '#FFC107'; // Yellow
    } else {
        scoreContainer.style.backgroundColor = '#F44336'; // Red
    }
}

function drawFitCircle(center, radius) {
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    points = [];
    statsDiv.innerHTML = "";
    scoreDiv.textContent = "0%";
    document.querySelector('.score-display').style.backgroundColor = '#4CAF50';
}

function toggleFitCircle() {
    showFitCircle = !showFitCircle;
    redraw();
}

function redraw() {
    if (points.length <= 1) return;
    
    // Redraw user's drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
    
    // Redraw fit circle if enabled
    if (showFitCircle && points.length > 10) {
        const { center, radius } = fitCircle(points);
        drawFitCircle(center, radius);
    }
}