/* ================================================================
   Perfect Circle – Enhanced Edition
   ================================================================ */

// ─── DOM refs ───
const canvas = document.getElementById('drawCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const scoreRing = document.getElementById('scoreRing');
const canvasHint = document.getElementById('canvasHint');
const breakdownGrid = document.getElementById('breakdownGrid');
const metricRoundness = document.getElementById('metricRoundness');
const metricClosure = document.getElementById('metricClosure');
const metricConsistency = document.getElementById('metricConsistency');
const metricTime = document.getElementById('metricTime');
const bestScoreEl = document.getElementById('bestScore');
const avgScoreEl = document.getElementById('avgScore');
const totalAttemptsEl = document.getElementById('totalAttempts');
const historyChartEl = document.getElementById('historyChart');
const challengeOverlay = document.getElementById('challengeOverlay');
const confettiCanvas = document.getElementById('confettiCanvas');
const confettiCtx = confettiCanvas.getContext('2d');

// ─── State ───
let points = [];
let isDrawing = false;
let showFitCircle = false;
let drawStartTime = 0;
let challengeMode = false;
let challengeTarget = null; // { cx, cy, r }
let challengeSize = 'medium';
const STORAGE_KEY = 'perfectCircle_history';
const CIRCUMFERENCE = 2 * Math.PI * 52; // matches SVG r=52

// ─── Init ───
loadHistory();
resizeCanvas();
resizeConfetti();
window.addEventListener('resize', () => { resizeCanvas(); resizeConfetti(); });

// Button listeners
document.getElementById('clearBtn').addEventListener('click', clearCanvas);
document.getElementById('toggleBtn').addEventListener('click', toggleFitCircle);
document.getElementById('challengeBtn').addEventListener('click', () => {
    challengeOverlay.classList.add('active');
});
document.getElementById('cancelChallengeBtn').addEventListener('click', () => {
    challengeOverlay.classList.remove('active');
});
document.getElementById('startChallengeBtn').addEventListener('click', startChallenge);
document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);

// Challenge size buttons
document.querySelectorAll('.challenge-size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.challenge-size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        challengeSize = btn.dataset.size;
    });
});

// Canvas input
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseleave', stopDrawing);
canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

// ─── Canvas sizing (fills available game-panel space) ───
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const panel = document.querySelector('.game-panel');
    const availW = panel.clientWidth - 8;
    const availH = panel.clientHeight - 8;
    const size = Math.max(160, Math.floor(Math.min(availW, availH)));
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    redraw();
}

function resizeConfetti() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
}

// ─── Touch adapters ───
function handleTouchStart(e) {
    e.preventDefault();
    const t = e.touches[0];
    startDrawing({ clientX: t.clientX, clientY: t.clientY });
}
function handleTouchMove(e) {
    e.preventDefault();
    const t = e.touches[0];
    draw({ clientX: t.clientX, clientY: t.clientY });
}
function handleTouchEnd(e) {
    e.preventDefault();
    stopDrawing();
}

// ─── Drawing ───
function startDrawing(e) {
    isDrawing = true;
    points = [];
    drawStartTime = performance.now();
    canvasHint.classList.add('hidden');

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    points.push({ x, y });

    ctx.clearRect(0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));

    // Re-draw ghost if challenge
    if (challengeMode && challengeTarget) {
        drawGhostCircle();
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = var_primary();
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
    const drawTime = ((performance.now() - drawStartTime) / 1000).toFixed(1);

    if (points.length < 12) {
        showMessage('Draw a bigger circle!');
        setScore(0);
        updateBreakdown(null, drawTime);
        return;
    }

    if (isStraightLine(points)) {
        showMessage('Not a circle');
        setScore(0);
        updateBreakdown(null, drawTime);
        return;
    }

    // Bounding box checks
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of points) {
        minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
    }
    const w = maxX - minX, h = maxY - minY;
    const diag = Math.hypot(w, h);

    // Closure check
    const first = points[0], last = points[points.length - 1];
    const gap = Math.hypot(last.x - first.x, last.y - first.y);
    const closureRatio = 1 - Math.min(1, gap / (diag * 0.25));

    if (gap > diag * 0.35) {
        showMessage('Shape not closed');
        setScore(0);
        updateBreakdown(null, drawTime);
        return;
    }

    // Aspect ratio
    const aspect = Math.max(w, h) / (Math.min(w, h) || 1);
    if (aspect > 1.6) {
        showMessage('Not a circle');
        setScore(0);
        updateBreakdown(null, drawTime);
        return;
    }

    // Area check
    let area = 0;
    for (let i = 0; i < points.length; i++) {
        const p1 = points[i], p2 = points[(i + 1) % points.length];
        area += p1.x * p2.y - p2.x * p1.y;
    }
    area = Math.abs(area) / 2;
    if (w * h > 0 && area / (w * h) < 0.1) {
        showMessage('Not a circle');
        setScore(0);
        updateBreakdown(null, drawTime);
        return;
    }

    // Fit circle
    const fit = fitCircle(points);
    const { center, radius, perfectness } = fit;

    // Compute sub-metrics
    const roundnessScore = computeRoundness(fit);
    const closureScore = Math.round(closureRatio * 100);
    const consistencyScore = computeConsistency(points, center, radius);

    setScore(perfectness);
    updateBreakdown({ roundness: roundnessScore, closure: closureScore, consistency: consistencyScore }, drawTime);

    if (showFitCircle) drawFitCircle(center, radius);

    // Save to history
    saveAttempt(perfectness);

    // High score effects
    if (perfectness >= 90) {
        launchConfetti();
        showToast(perfectness >= 95 ? '🎯 Incredible!' : '🔥 Great circle!', 'success');
    }
}

// ─── Geometry helpers ───
function isStraightLine(pts) {
    const first = pts[0], last = pts[pts.length - 1];
    const dx = last.x - first.x, dy = last.y - first.y;
    const len = Math.hypot(dx, dy);
    if (len === 0) return false;
    let strokeLen = 0;
    for (let i = 1; i < pts.length; i++) {
        strokeLen += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    }
    if (len / strokeLen > 0.98) return true;
    let maxDist = 0;
    for (const p of pts) {
        const d = Math.abs(dy * (p.x - first.x) - dx * (p.y - first.y)) / len;
        if (d > maxDist) maxDist = d;
    }
    return maxDist / len < 0.02;
}

function fitCircle(pts) {
    let sumX = 0, sumY = 0, sumX2 = 0, sumY2 = 0, sumXY = 0;
    let sumX3 = 0, sumY3 = 0, sumX2Y = 0, sumXY2 = 0;
    const N = pts.length;
    for (const p of pts) {
        const x = p.x, y = p.y, x2 = x * x, y2 = y * y;
        sumX += x; sumY += y;
        sumX2 += x2; sumY2 += y2;
        sumXY += x * y;
        sumX3 += x2 * x; sumY3 += y2 * y;
        sumX2Y += x2 * y; sumXY2 += x * y2;
    }
    const C = N * sumX2 - sumX * sumX;
    const D = N * sumXY - sumX * sumY;
    const E = N * (sumX3 + sumXY2) - (sumX2 + sumY2) * sumX;
    const G = N * sumY2 - sumY * sumY;
    const H = N * (sumX2Y + sumY3) - (sumX2 + sumY2) * sumY;
    const denom = 2 * (C * G - D * D);
    const cx = (G * E - D * H) / denom;
    const cy = (C * H - D * E) / denom;
    const r = Math.sqrt((sumX2 + sumY2 - 2 * cx * sumX - 2 * cy * sumY) / N + cx * cx + cy * cy);

    let sumErrSq = 0;
    for (const p of pts) {
        const err = Math.hypot(p.x - cx, p.y - cy) - r;
        sumErrSq += err * err;
    }
    const stdDev = Math.sqrt(sumErrSq / N);
    const errorRatio = stdDev / r;
    let perfectness = 100 * (1 - Math.min(1, errorRatio * 3));
    perfectness = Math.max(0, Math.round(perfectness));

    return { center: { x: cx, y: cy }, radius: r, error: stdDev, perfectness };
}

function computeRoundness(fit) {
    // How circular vs elliptical the shape is (aspect of bounding box vs ideal)
    const { center, radius } = fit;
    let minR = Infinity, maxR = -Infinity;
    for (const p of points) {
        const d = Math.hypot(p.x - center.x, p.y - center.y);
        minR = Math.min(minR, d);
        maxR = Math.max(maxR, d);
    }
    const ratio = minR / (maxR || 1);
    return Math.round(ratio * 100);
}

function computeConsistency(pts, center, radius) {
    // How evenly spaced the points are angularly
    const angles = pts.map(p => Math.atan2(p.y - center.y, p.x - center.x));
    const sorted = [...angles].sort((a, b) => a - b);
    const gaps = [];
    for (let i = 1; i < sorted.length; i++) gaps.push(sorted[i] - sorted[i - 1]);
    gaps.push((2 * Math.PI) - (sorted[sorted.length - 1] - sorted[0]));
    const idealGap = (2 * Math.PI) / gaps.length;
    let sumDevSq = 0;
    for (const g of gaps) sumDevSq += (g - idealGap) ** 2;
    const cv = Math.sqrt(sumDevSq / gaps.length) / idealGap;
    return Math.round(Math.max(0, 100 * (1 - Math.min(1, cv * 2))));
}

// ─── UI updates ───
function setScore(pct) {
    scoreEl.textContent = pct;
    const offset = CIRCUMFERENCE * (1 - pct / 100);
    scoreRing.style.strokeDashoffset = offset;

    // Color by score
    let color;
    if (pct >= 80) color = '#10b981';
    else if (pct >= 60) color = '#f59e0b';
    else color = '#ef4444';
    scoreRing.style.stroke = color;

    // Pulse animation
    const badge = document.getElementById('scoreBadge');
    badge.classList.remove('score-pulse');
    void badge.offsetWidth; // reflow
    if (pct > 0) badge.classList.add('score-pulse');
}

function updateBreakdown(metrics, time) {
    if (metrics) {
        metricRoundness.textContent = metrics.roundness + '%';
        metricClosure.textContent = metrics.closure + '%';
        metricConsistency.textContent = metrics.consistency + '%';
        metricRoundness.style.color = scoreColor(metrics.roundness);
        metricClosure.style.color = scoreColor(metrics.closure);
        metricConsistency.style.color = scoreColor(metrics.consistency);
    } else {
        metricRoundness.textContent = '—';
        metricClosure.textContent = '—';
        metricConsistency.textContent = '—';
        metricRoundness.style.color = '';
        metricClosure.style.color = '';
        metricConsistency.style.color = '';
    }
    metricTime.textContent = time + 's';
}

function scoreColor(v) {
    if (v >= 80) return '#10b981';
    if (v >= 60) return '#f59e0b';
    return '#ef4444';
}

function showMessage(msg) {
    // Brief toast for errors
    showToast(msg, '');
}

function var_primary() {
    return getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim() || '#4a9eff';
}

// ─── Drawing helpers ───
function drawFitCircle(center, radius) {
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(97, 218, 251, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawGhostCircle() {
    if (!challengeTarget) return;
    const { cx, cy, r } = challengeTarget;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(97, 218, 251, 0.18)';
    ctx.lineWidth = 24;
    ctx.stroke();
    // Inner guide
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(97, 218, 251, 0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
}

function clearCanvas() {
    const sz = parseInt(canvas.style.width);
    ctx.clearRect(0, 0, sz, sz);
    points = [];
    setScore(0);
    updateBreakdown(null, '0.0');
    canvasHint.classList.remove('hidden');
    challengeMode = false;
    challengeTarget = null;
}

function toggleFitCircle() {
    showFitCircle = !showFitCircle;
    document.getElementById('toggleBtn').classList.toggle('active', showFitCircle);
    redraw();
}

function redraw() {
    const sz = parseInt(canvas.style.width);
    ctx.clearRect(0, 0, sz, sz);

    if (challengeMode && challengeTarget) drawGhostCircle();

    if (points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = var_primary();

    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();

    if (showFitCircle && points.length > 10) {
        const { center, radius } = fitCircle(points);
        drawFitCircle(center, radius);
    }
}

// ─── Challenge Mode ───
function startChallenge() {
    challengeOverlay.classList.remove('active');
    challengeMode = true;
    const sz = parseInt(canvas.style.width);
    const center = sz / 2;
    const sizes = { small: 0.2, medium: 0.32, large: 0.42 };
    const r = sz * (sizes[challengeSize] || 0.32);
    challengeTarget = { cx: center, cy: center, r };
    clearCanvas();
    challengeMode = true;
    challengeTarget = { cx: center, cy: center, r };
    canvasHint.classList.add('hidden');
    drawGhostCircle();
    showToast('Trace the ghost circle!', '');
}

// ─── History / Local Storage ───
function getHistory() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch { return []; }
}

function saveAttempt(score) {
    const history = getHistory();
    const isRecord = history.length === 0 || score > Math.max(...history.map(h => h.s));
    history.push({ s: score, t: Date.now() });
    // Keep last 50
    if (history.length > 50) history.splice(0, history.length - 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    renderHistory(history);
    if (isRecord && score > 0) {
        showToast('🏆 New personal best!', 'record');
    }
}

function loadHistory() {
    renderHistory(getHistory());
}

function clearHistory() {
    localStorage.removeItem(STORAGE_KEY);
    renderHistory([]);
    showToast('History cleared', '');
}

function renderHistory(history) {
    if (history.length === 0) {
        bestScoreEl.textContent = '—';
        avgScoreEl.textContent = '—';
        totalAttemptsEl.textContent = '0';
        historyChartEl.innerHTML = '<span style="color:var(--text-muted);font-size:0.75rem;">No attempts yet</span>';
        return;
    }
    const scores = history.map(h => h.s);
    bestScoreEl.textContent = Math.max(...scores) + '%';
    avgScoreEl.textContent = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) + '%';
    totalAttemptsEl.textContent = scores.length;

    // Render bar chart (last 20)
    const recent = scores.slice(-20);
    historyChartEl.innerHTML = '';
    const max = Math.max(...recent, 1);
    recent.forEach(s => {
        const bar = document.createElement('div');
        bar.className = 'history-bar';
        const h = Math.max(4, (s / 100) * 44);
        bar.style.height = h + 'px';
        bar.style.background = scoreColor(s);
        bar.dataset.score = s + '%';
        historyChartEl.appendChild(bar);
    });
}

// ─── Toast Notifications ───
let toastTimer = null;
function showToast(message, type) {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.className = 'toast' + (type ? ' ' + type : '');
    void toast.offsetWidth;
    toast.classList.add('show');
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

// ─── Confetti ───
let confettiParticles = [];
let confettiAnimId = null;

function launchConfetti() {
    confettiParticles = [];
    const colors = ['#4a9eff', '#61dafb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    for (let i = 0; i < 100; i++) {
        confettiParticles.push({
            x: confettiCanvas.width / 2 + (Math.random() - 0.5) * 200,
            y: confettiCanvas.height / 2,
            vx: (Math.random() - 0.5) * 14,
            vy: -Math.random() * 12 - 4,
            w: Math.random() * 8 + 4,
            h: Math.random() * 6 + 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 12,
            life: 1,
        });
    }
    if (confettiAnimId) cancelAnimationFrame(confettiAnimId);
    animateConfetti();
}

function animateConfetti() {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    let alive = false;
    for (const p of confettiParticles) {
        if (p.life <= 0) continue;
        alive = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3;
        p.rotation += p.rotSpeed;
        p.life -= 0.012;
        confettiCtx.save();
        confettiCtx.translate(p.x, p.y);
        confettiCtx.rotate((p.rotation * Math.PI) / 180);
        confettiCtx.globalAlpha = Math.max(0, p.life);
        confettiCtx.fillStyle = p.color;
        confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        confettiCtx.restore();
    }
    if (alive) {
        confettiAnimId = requestAnimationFrame(animateConfetti);
    } else {
        confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        confettiAnimId = null;
    }
}