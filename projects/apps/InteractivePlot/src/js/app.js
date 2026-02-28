/**
 * Halifax Traffic Collision Explorer
 * Better storytelling with performance optimizations
 */

const state = {
    data: null,
    map: null,
    layers: { heat: null, points: null, circle: null },
    filters: { years: [] }, // Empty = all years selected
    story: 'trends',
    settings: { radius: 1500, showHeat: false, showPoints: true }
};

// 2025 data is incomplete (Jan-Sep only) - exclude from trend calculations
const INCOMPLETE_YEAR = 2025;

// Initialize
async function init() {
    try {
        await loadData();
        initMap();
        initControls();
        updateAnalysis();
        hideLoading();
    } catch (error) {
        console.error('Init failed:', error);
        document.querySelector('.loading-text').textContent = 'Failed to load data';
    }
}

async function loadData() {
    const response = await fetch('src/data.json');
    state.data = await response.json();
    
    // Sanitize string fields - convert 'nan' to 'Unknown'
    state.data.collisions.forEach(c => {
        if (!c.weather || c.weather === 'nan') c.weather = 'Unknown';
        if (!c.road || c.road === 'nan') c.road = 'Unknown';
        if (!c.light || c.light === 'nan') c.light = 'Unknown';
    });
    
    // Exclude 2025 by default (incomplete data)
    state.filters.years = state.data.meta.years.filter(y => y !== INCOMPLETE_YEAR);
    
    generateYearButtons();
}

function generateYearButtons() {
    const container = document.getElementById('yearSelector');
    const years = state.data.meta.years;
    
    let html = '';
    years.forEach(year => {
        const isIncomplete = year === INCOMPLETE_YEAR;
        const isActive = state.filters.years.includes(year);
        const label = isIncomplete ? `${year}*` : year;
        html += `<button class="year-btn ${isActive ? 'active' : ''}" data-year="${year}" title="${isIncomplete ? 'Partial data (Jan-Sep)' : 'Full year data'}">${label}</button>`;
    });
    
    container.innerHTML = html;
    container.querySelectorAll('.year-btn').forEach(btn => {
        btn.addEventListener('click', () => toggleYear(parseInt(btn.dataset.year)));
    });
}

function toggleYear(year) {
    const idx = state.filters.years.indexOf(year);
    if (idx === -1) {
        state.filters.years.push(year);
    } else {
        state.filters.years.splice(idx, 1);
    }
    
    document.querySelectorAll('.year-btn').forEach(btn => {
        const btnYear = parseInt(btn.dataset.year);
        const isActive = state.filters.years.length === 0 || state.filters.years.includes(btnYear);
        btn.classList.toggle('active', isActive);
    });
    
    updateLayers();
    updateAnalysis();
}

function initMap() {
    // Center on Halifax Peninsula
    const peninsulaCenter = { lat: 44.65, lon: -63.58 };
    
    state.map = L.map('map', {
        zoomControl: false,
        attributionControl: false,
        preferCanvas: true
    }).setView([peninsulaCenter.lat, peninsulaCenter.lon], 13);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
    }).addTo(state.map);
    
    L.control.zoom({ position: 'bottomleft' }).addTo(state.map);
    
    // Create geographic circle that scales with map
    updateGeographicCircle();
    updateStatsPosition();
    updateHeatLayer();
    updatePointsLayer();
    
    state.map.on('moveend zoomend', () => {
        updateGeographicCircle();
        updateStatsPosition();
        updateAnalysis();
    });
    state.map.on('move', throttle(() => {
        updateGeographicCircle();
        updateStatsPosition();
    }, 50)); // Fast update for smooth circle movement
    state.map.on('zoom', throttle(() => {
        updateStatsPosition();
    }, 50));
}

function updateGeographicCircle() {
    if (!state.map) return;
    
    const center = state.map.getCenter();
    
    // Update existing circle or create new one
    if (state.layers.circle) {
        state.layers.circle.setLatLng(center);
        state.layers.circle.setRadius(state.settings.radius);
    } else {
        // Create new circle with real geographic radius
        state.layers.circle = L.circle([center.lat, center.lng], {
            radius: state.settings.radius, // in meters
            color: '#00BCD4',
            weight: 2,
            opacity: 0.8,
            fill: true,
            fillColor: '#00BCD4',
            fillOpacity: 0.08
        }).addTo(state.map);
    }
}

function updateHeatLayer() {
    const collisions = getFilteredCollisions();
    
    if (state.layers.heat) state.map.removeLayer(state.layers.heat);
    
    const heatData = collisions.map(c => [c.lat, c.lon, 0.5]);
    state.layers.heat = L.heatLayer(heatData, {
        radius: 18, blur: 12, maxZoom: 16,
        gradient: { 0.2: '#0D47A1', 0.4: '#00BCD4', 0.6: '#FFEB3B', 0.8: '#FF9800', 1.0: '#F44336' }
    });
    
    if (state.settings.showHeat) state.layers.heat.addTo(state.map);
}

// PERFORMANCE: Sample points instead of rendering all
function updatePointsLayer() {
    if (state.layers.points) state.map.removeLayer(state.layers.points);
    if (!state.settings.showPoints) return;
    
    const collisions = getFilteredCollisions();
    const maxPoints = 1500;
    const sampleRate = Math.max(1, Math.floor(collisions.length / maxPoints));
    const sampled = collisions.filter((_, i) => i % sampleRate === 0);
    
    state.layers.points = L.layerGroup();
    
    sampled.forEach(c => {
        const color = c.sev === 2 ? '#E53935' : c.sev === 1 ? '#FB8C00' : 
                     c.ped ? '#8E24AA' : c.bike ? '#43A047' : c.imp ? '#D81B60' : '#00BCD4';
        
        L.circleMarker([c.lat, c.lon], {
            radius: c.sev === 2 ? 6 : 3,
            color: color, fillColor: color, fillOpacity: 0.7,
            weight: c.sev === 2 ? 2 : 0
        }).addTo(state.layers.points);
    });
    
    state.layers.points.addTo(state.map);
    
    if (sampled.length < collisions.length) {
        showToast(`Showing ${sampled.length.toLocaleString()} of ${collisions.length.toLocaleString()} points`);
    }
}

function updateLayers() {
    updateHeatLayer();
    if (state.settings.showPoints) updatePointsLayer();
}

function getFilteredCollisions() {
    let collisions = state.data.collisions;
    if (state.filters.years.length > 0) {
        collisions = collisions.filter(c => state.filters.years.includes(c.year));
    }
    return collisions;
}

function getCollisionsInArea() {
    const center = state.map.getCenter();
    return getFilteredCollisions().filter(c => {
        return getDistance(center.lat, center.lng, c.lat, c.lon) <= state.settings.radius;
    });
}

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function updateAnalysis() {
    const collisions = getCollisionsInArea();
    const stats = calculateStats(collisions);
    updateCircleStats(stats);
    updateStoryPanel(collisions, stats);
}

function calculateStats(collisions) {
    const stats = {
        total: collisions.length,
        fatal: collisions.filter(c => c.sev === 2).length,
        injury: collisions.filter(c => c.sev === 1).length,
        pedestrian: collisions.filter(c => c.ped).length,
        bicycle: collisions.filter(c => c.bike).length,
        impaired: collisions.filter(c => c.imp).length,
        byMonth: new Array(12).fill(0),
        byHour: new Array(24).fill(0),
        byYear: {},
        bySeason: { winter: 0, spring: 0, summer: 0, fall: 0 },
        byWeather: {},
        byDay: new Array(7).fill(0),
        byRoad: {},
        byLight: {}
    };
    
    collisions.forEach(c => {
        stats.byMonth[c.month]++;
        stats.byHour[c.hour]++;
        stats.byYear[c.year] = (stats.byYear[c.year] || 0) + 1;
        stats.byWeather[c.weather] = (stats.byWeather[c.weather] || 0) + 1;
        stats.byDay[c.dow]++;
        const road = c.road || 'Unknown';
        const light = c.light || 'Unknown';
        stats.byRoad[road] = (stats.byRoad[road] || 0) + 1;
        stats.byLight[light] = (stats.byLight[light] || 0) + 1;
        
        if (c.month >= 2 && c.month <= 4) stats.bySeason.spring++;
        else if (c.month >= 5 && c.month <= 7) stats.bySeason.summer++;
        else if (c.month >= 8 && c.month <= 10) stats.bySeason.fall++;
        else stats.bySeason.winter++;
    });
    
    return stats;
}

function calculateCSI(stats) {
    // Collision Severity Index: PDO×1 + Injury×3 + Fatal×12
    const pdo = stats.total - stats.injury - stats.fatal;
    return (pdo * 1) + (stats.injury * 3) + (stats.fatal * 12);
}

function updateCircleStats(stats) {
    document.getElementById('statTotal').textContent = stats.total.toLocaleString();
    document.getElementById('statFatal').textContent = stats.fatal;
    document.getElementById('statInjury').textContent = stats.injury;
    
    const csi = calculateCSI(stats);
    document.getElementById('statCSI').textContent = csi.toLocaleString();
}

function updateStoryPanel(collisions, stats) {
    const container = document.getElementById('storyContent');
    
    switch(state.story) {
        case 'trends': renderTrendsStory(container, stats); break;
        case 'seasonal': renderSeasonalStory(container, stats); break;
        case 'time': renderTimeStory(container, stats); break;
        case 'safety': renderSafetyStory(container, stats); break;
        case 'vulnerable': renderVulnerableStory(container, collisions, stats); break;
    }
}

// STORY 1: Year-over-Year Trends
function renderTrendsStory(container, stats) {
    const years = Object.keys(stats.byYear).sort();
    const counts = years.map(y => stats.byYear[y]);
    
    // Exclude incomplete year (2025) from trend calculation
    const completeYears = years.filter(y => parseInt(y) !== INCOMPLETE_YEAR);
    
    let trend = 'stable', trendIcon = '→', trendColor = '#7D8590';
    let trendNote = '';
    
    if (completeYears.length >= 2) {
        const recent = stats.byYear[completeYears[completeYears.length - 1]] || 0;
        const previous = stats.byYear[completeYears[completeYears.length - 2]] || 1;
        const change = ((recent - previous) / previous * 100).toFixed(1);
        
        if (change > 5) { trend = `+${change}%`; trendIcon = '↑'; trendColor = '#E53935'; }
        else if (change < -5) { trend = `${change}%`; trendIcon = '↓'; trendColor = '#43A047'; }
        else { trend = `${change}%`; }
        
        trendNote = `${completeYears[completeYears.length - 2]} → ${completeYears[completeYears.length - 1]}`;
    }
    
    container.innerHTML = `
        <div class="story-insight">
            <div class="insight-icon" style="background: ${trendColor}20; color: ${trendColor}">${trendIcon}</div>
            <div class="insight-text">
                <div class="insight-title">Year-over-Year Change ${trendNote ? `(${trendNote})` : ''}</div>
                <div class="insight-value" style="color: ${trendColor}">${trend}</div>
            </div>
        </div>
        ${years.includes(String(INCOMPLETE_YEAR)) ? `<div class="data-note">⚠️ ${INCOMPLETE_YEAR} data is partial (Jan-Sep)</div>` : ''}
        <div class="chart-box"><div id="trendChart"></div></div>
        <div class="story-detail">
            <div class="detail-title">Yearly Breakdown</div>
            ${years.map(y => `
                <div class="detail-row">
                    <span>${y}${parseInt(y) === INCOMPLETE_YEAR ? '*' : ''}</span>
                    <div class="mini-bar"><div class="mini-fill" style="width: ${(stats.byYear[y] / Math.max(...counts, 1)) * 100}%"></div></div>
                    <span class="detail-value">${stats.byYear[y]}</span>
                </div>
            `).join('')}
        </div>
    `;
    
    if (years.length > 0) {
        Plotly.react('trendChart', [{
            type: 'scatter', x: years, y: counts,
            mode: 'lines+markers',
            line: { color: '#00BCD4', width: 3, shape: 'spline' },
            marker: { size: 8, color: '#00BCD4' },
            fill: 'tozeroy', fillcolor: 'rgba(0, 188, 212, 0.1)'
        }], chartLayout(), chartConfig());
    }
}

// STORY 2: Seasonal Patterns
function renderSeasonalStory(container, stats) {
    const seasons = ['winter', 'spring', 'summer', 'fall'];
    const names = { winter: '❄️ Winter', spring: '🌸 Spring', summer: '☀️ Summer', fall: '🍂 Fall' };
    const colors = { winter: '#42A5F5', spring: '#66BB6A', summer: '#FFC107', fall: '#FF7043' };
    
    const maxSeason = seasons.reduce((a, b) => stats.bySeason[a] > stats.bySeason[b] ? a : b);
    const total = Object.values(stats.bySeason).reduce((a, b) => a + b, 0) || 1;
    
    container.innerHTML = `
        <div class="story-insight">
            <div class="insight-icon" style="background: ${colors[maxSeason]}20; color: ${colors[maxSeason]}">${names[maxSeason].split(' ')[0]}</div>
            <div class="insight-text">
                <div class="insight-title">Highest Risk Season</div>
                <div class="insight-value">${names[maxSeason].split(' ')[1]} (${stats.bySeason[maxSeason]})</div>
            </div>
        </div>
        <div class="chart-box"><div id="seasonChart"></div></div>
        <div class="story-detail">
            <div class="detail-title">Monthly Distribution</div>
            <div id="monthChart" style="height: 80px;"></div>
        </div>
        <div class="story-detail">
            ${seasons.map(s => `
                <div class="detail-row">
                    <span>${names[s]}</span>
                    <span class="detail-value" style="color: ${colors[s]}">${stats.bySeason[s]} <small>(${((stats.bySeason[s]/total)*100).toFixed(0)}%)</small></span>
                </div>
            `).join('')}
        </div>
    `;
    
    Plotly.react('seasonChart', [{
        type: 'pie', values: seasons.map(s => stats.bySeason[s]), labels: seasons.map(s => names[s].split(' ')[1]),
        hole: 0.6, marker: { colors: seasons.map(s => colors[s]) },
        textinfo: 'percent', textposition: 'outside', textfont: { size: 11, color: '#E6EDF3' }, sort: false
    }], { ...chartLayout(), margin: { t: 30, r: 50, b: 30, l: 50 } }, chartConfig());
    
    const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
    const monthColors = stats.byMonth.map((_, i) => i >= 2 && i <= 4 ? '#66BB6A' : i >= 5 && i <= 7 ? '#FFC107' : i >= 8 && i <= 10 ? '#FF7043' : '#42A5F5');
    
    Plotly.react('monthChart', [{
        type: 'bar', x: months, y: stats.byMonth, marker: { color: monthColors }
    }], { ...chartLayout(), margin: { t: 5, r: 5, b: 20, l: 25 }, yaxis: { showticklabels: false } }, chartConfig());
}

// STORY 3: Time Patterns
function renderTimeStory(container, stats) {
    const peakHour = stats.byHour.indexOf(Math.max(...stats.byHour));
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const peakDay = stats.byDay.indexOf(Math.max(...stats.byDay));
    
    const morningRush = stats.byHour.slice(7, 10).reduce((a, b) => a + b, 0);
    const eveningRush = stats.byHour.slice(16, 19).reduce((a, b) => a + b, 0);
    const nightTime = [...stats.byHour.slice(22), ...stats.byHour.slice(0, 6)].reduce((a, b) => a + b, 0);
    const total = stats.total || 1;
    
    container.innerHTML = `
        <div class="story-insight">
            <div class="insight-icon" style="background: rgba(255, 193, 7, 0.2); color: #FFC107">🕐</div>
            <div class="insight-text">
                <div class="insight-title">Peak Hour</div>
                <div class="insight-value">${peakHour}:00 - ${peakHour + 1}:00</div>
            </div>
        </div>
        <div class="chart-box"><div id="hourChart"></div></div>
        <div class="story-detail">
            <div class="detail-title">Time Periods</div>
            <div class="detail-row"><span>🌅 Morning Rush (7-10)</span><span class="detail-value">${morningRush} <small>(${((morningRush/total)*100).toFixed(0)}%)</small></span></div>
            <div class="detail-row"><span>🌆 Evening Rush (16-19)</span><span class="detail-value">${eveningRush} <small>(${((eveningRush/total)*100).toFixed(0)}%)</small></span></div>
            <div class="detail-row"><span>🌙 Night (22-6)</span><span class="detail-value">${nightTime} <small>(${((nightTime/total)*100).toFixed(0)}%)</small></span></div>
        </div>
        <div class="story-detail">
            <div class="detail-title">Day of Week</div>
            <div class="day-grid">
                ${days.map((d, i) => `<div class="day-cell ${i === peakDay ? 'peak' : ''}" style="--intensity: ${stats.byDay[i] / Math.max(...stats.byDay, 1)}"><div class="day-name">${d}</div><div class="day-value">${stats.byDay[i]}</div></div>`).join('')}
            </div>
        </div>
    `;
    
    const hourColors = stats.byHour.map((_, i) => i >= 7 && i < 10 ? '#FF9800' : i >= 16 && i < 19 ? '#FF5722' : i >= 22 || i < 6 ? '#3F51B5' : '#00BCD4');
    Plotly.react('hourChart', [{ type: 'bar', x: Array.from({length: 24}, (_, i) => i), y: stats.byHour, marker: { color: hourColors } }], { ...chartLayout(), xaxis: { tickvals: [0, 6, 12, 18, 23], ticktext: ['0', '6', '12', '18', '23'] } }, chartConfig());
}

// STORY 4: Safety Analysis  
function renderSafetyStory(container, stats) {
    const total = stats.total || 1;
    const fatalRate = ((stats.fatal / total) * 100).toFixed(2);
    const csi = calculateCSI(stats);
    const weatherSorted = Object.entries(stats.byWeather).sort((a, b) => b[1] - a[1]).slice(0, 4);
    
    // Road configuration - shorten labels for display
    const roadLabels = {
        'Non-intersection': 'Mid-block',
        'Intersection - two or more public roads': 'Intersection',
        'Intersection - private road or access': 'Private Access',
        'Traffic circle or roundabout': 'Roundabout',
        'Express lane of a freeway': 'Freeway',
        'Bridge, overpass or viaduct': 'Bridge',
        'Passing lane': 'Passing Lane',
        'Tunnel or underpass': 'Tunnel',
        'Rail level crossing': 'Rail Crossing',
        'Light rail transit crossing': 'LRT Crossing',
        'Ramp': 'Ramp',
        'Unknown': 'Unknown'
    };
    const roadSorted = Object.entries(stats.byRoad)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([k, v]) => [roadLabels[k] || k, v]);
    
    // Light conditions
    const lightSorted = Object.entries(stats.byLight).sort((a, b) => b[1] - a[1]);
    const lightColors = { 'Daylight': '#FFC107', 'Darkness': '#3F51B5', 'Dusk': '#FF7043', 'Dawn': '#AB47BC', 'Unknown': '#7D8590' };
    
    container.innerHTML = `
        <div class="story-insight ${stats.fatal > 0 ? 'danger' : ''}">
            <div class="insight-icon" style="background: rgba(229, 57, 53, 0.2); color: #E53935">⚠️</div>
            <div class="insight-text">
                <div class="insight-title">Severity Index (CSI)</div>
                <div class="insight-value" style="color: #E53935">${csi.toLocaleString()}</div>
            </div>
        </div>
        <div class="csi-formula">CSI = PDO×1 + Injury×3 + Fatal×12</div>
        <div class="safety-grid">
            <div class="safety-card"><div class="safety-value" style="color: #E53935">${stats.fatal}</div><div class="safety-label">Fatal</div></div>
            <div class="safety-card"><div class="safety-value" style="color: #FB8C00">${stats.injury}</div><div class="safety-label">Injuries</div></div>
            <div class="safety-card"><div class="safety-value" style="color: #8E24AA">${stats.pedestrian}</div><div class="safety-label">Pedestrian</div></div>
            <div class="safety-card"><div class="safety-value" style="color: #D81B60">${stats.impaired}</div><div class="safety-label">Impaired</div></div>
        </div>
        <div class="chart-box"><div id="severityChart"></div></div>
        <div class="story-detail">
            <div class="detail-title">Road Configuration</div>
            ${roadSorted.map(([r, count]) => {
                const pct = ((count / total) * 100).toFixed(0);
                return `<div class="detail-row"><span>${r}</span><div class="mini-bar"><div class="mini-fill" style="width: ${(count / roadSorted[0][1]) * 100}%"></div></div><span class="detail-value">${count} <small>(${pct}%)</small></span></div>`;
            }).join('')}
        </div>
        <div class="story-detail">
            <div class="detail-title">Light Conditions</div>
            <div id="lightChart" style="height: 80px;"></div>
        </div>
        <div class="story-detail">
            <div class="detail-title">Weather Conditions</div>
            ${weatherSorted.map(([w, count]) => `<div class="detail-row"><span>${w}</span><span class="detail-value">${count}</span></div>`).join('')}
        </div>
    `;
    
    const noInjury = stats.total - stats.fatal - stats.injury;
    Plotly.react('severityChart', [{
        type: 'pie', values: [noInjury, stats.injury, stats.fatal], labels: ['No Injury', 'Injury', 'Fatal'],
        hole: 0.65, marker: { colors: ['#43A047', '#FB8C00', '#E53935'] },
        textinfo: 'percent', textposition: 'outside', textfont: { size: 11, color: '#E6EDF3' }, sort: false
    }], { ...chartLayout(), margin: { t: 25, r: 40, b: 25, l: 40 } }, chartConfig());
    
    // Light condition bar chart
    if (lightSorted.length > 0) {
        Plotly.react('lightChart', [{
            type: 'bar',
            x: lightSorted.map(([l]) => l),
            y: lightSorted.map(([, v]) => v),
            marker: { color: lightSorted.map(([l]) => lightColors[l] || '#7D8590') }
        }], { ...chartLayout(), margin: { t: 5, r: 5, b: 25, l: 30 }, yaxis: { showticklabels: false } }, chartConfig());
    }
}

// STORY 5: Vulnerable Road Users
function renderVulnerableStory(container, collisions, stats) {
    const total = stats.total || 1;
    const pedCollisions = collisions.filter(c => c.ped);
    const bikeCollisions = collisions.filter(c => c.bike);
    const vuln = pedCollisions.length + bikeCollisions.length;
    
    // Severity comparison
    const pedFatal = pedCollisions.filter(c => c.sev === 2).length;
    const pedInjury = pedCollisions.filter(c => c.sev === 1).length;
    const bikeFatal = bikeCollisions.filter(c => c.sev === 2).length;
    const bikeInjury = bikeCollisions.filter(c => c.sev === 1).length;
    const pedSeverityRate = pedCollisions.length > 0 ? (((pedFatal + pedInjury) / pedCollisions.length) * 100).toFixed(1) : '0.0';
    const bikeSeverityRate = bikeCollisions.length > 0 ? (((bikeFatal + bikeInjury) / bikeCollisions.length) * 100).toFixed(1) : '0.0';
    const overallSeverityRate = total > 0 ? (((stats.fatal + stats.injury) / total) * 100).toFixed(1) : '0.0';
    
    // Hourly distribution for vulnerable users
    const pedByHour = new Array(24).fill(0);
    const bikeByHour = new Array(24).fill(0);
    pedCollisions.forEach(c => pedByHour[c.hour]++);
    bikeCollisions.forEach(c => bikeByHour[c.hour]++);
    
    // Seasonal patterns
    const pedBySeason = { winter: 0, spring: 0, summer: 0, fall: 0 };
    const bikeBySeason = { winter: 0, spring: 0, summer: 0, fall: 0 };
    pedCollisions.forEach(c => {
        if (c.month >= 2 && c.month <= 4) pedBySeason.spring++;
        else if (c.month >= 5 && c.month <= 7) pedBySeason.summer++;
        else if (c.month >= 8 && c.month <= 10) pedBySeason.fall++;
        else pedBySeason.winter++;
    });
    bikeCollisions.forEach(c => {
        if (c.month >= 2 && c.month <= 4) bikeBySeason.spring++;
        else if (c.month >= 5 && c.month <= 7) bikeBySeason.summer++;
        else if (c.month >= 8 && c.month <= 10) bikeBySeason.fall++;
        else bikeBySeason.winter++;
    });
    
    // Light condition analysis for vulnerable users
    const pedByLight = {};
    const bikeByLight = {};
    pedCollisions.forEach(c => { const l = c.light || 'Unknown'; pedByLight[l] = (pedByLight[l] || 0) + 1; });
    bikeCollisions.forEach(c => { const l = c.light || 'Unknown'; bikeByLight[l] = (bikeByLight[l] || 0) + 1; });
    const darkPed = (pedByLight['Darkness'] || 0) + (pedByLight['Dusk'] || 0) + (pedByLight['Dawn'] || 0);
    const darkBike = (bikeByLight['Darkness'] || 0) + (bikeByLight['Dusk'] || 0) + (bikeByLight['Dawn'] || 0);
    const darkPedPct = pedCollisions.length > 0 ? ((darkPed / pedCollisions.length) * 100).toFixed(0) : '0';
    const darkBikePct = bikeCollisions.length > 0 ? ((darkBike / bikeCollisions.length) * 100).toFixed(0) : '0';
    
    container.innerHTML = `
        <div class="story-insight">
            <div class="insight-icon" style="background: rgba(142, 36, 170, 0.2); color: #8E24AA">🚶</div>
            <div class="insight-text">
                <div class="insight-title">Vulnerable Road Users</div>
                <div class="insight-value" style="color: #8E24AA">${vuln} <small style="font-size:12px;color:var(--text-muted)">(${((vuln/total)*100).toFixed(1)}% of all)</small></div>
            </div>
        </div>
        <div class="vuln-grid">
            <div class="vuln-card ped">
                <div class="vuln-icon">🚶</div>
                <div class="vuln-count">${stats.pedestrian}</div>
                <div class="vuln-label">Pedestrians</div>
                <div class="vuln-detail">${pedFatal} fatal · ${pedInjury} injury</div>
                <div class="vuln-severity">Severity rate: <strong>${pedSeverityRate}%</strong></div>
            </div>
            <div class="vuln-card bike">
                <div class="vuln-icon">🚲</div>
                <div class="vuln-count">${stats.bicycle}</div>
                <div class="vuln-label">Cyclists</div>
                <div class="vuln-detail">${bikeFatal} fatal · ${bikeInjury} injury</div>
                <div class="vuln-severity">Severity rate: <strong>${bikeSeverityRate}%</strong></div>
            </div>
        </div>
        <div class="severity-compare">
            <div class="detail-title">Injury Rate Comparison</div>
            <div class="compare-bar-row"><span>All collisions</span><div class="compare-bar"><div class="compare-fill" style="width:${overallSeverityRate}%; background: var(--primary)"></div></div><span>${overallSeverityRate}%</span></div>
            <div class="compare-bar-row"><span>Pedestrians</span><div class="compare-bar"><div class="compare-fill" style="width:${pedSeverityRate}%; background: #8E24AA"></div></div><span>${pedSeverityRate}%</span></div>
            <div class="compare-bar-row"><span>Cyclists</span><div class="compare-bar"><div class="compare-fill" style="width:${bikeSeverityRate}%; background: #43A047"></div></div><span>${bikeSeverityRate}%</span></div>
        </div>
        <div class="chart-box"><div id="vulnHourChart"></div></div>
        <div class="story-detail">
            <div class="detail-title">Seasonal Exposure</div>
            <div class="season-compare">
                ${['winter', 'spring', 'summer', 'fall'].map(s => {
                    const icons = { winter: '❄️', spring: '🌸', summer: '☀️', fall: '🍂' };
                    return `<div class="season-col">
                        <div class="season-icon">${icons[s]}</div>
                        <div class="season-vals">
                            <span style="color:#8E24AA">${pedBySeason[s]}</span>
                            <span style="color:#43A047">${bikeBySeason[s]}</span>
                        </div>
                    </div>`;
                }).join('')}
            </div>
            <div class="season-legend"><span class="legend-dot" style="background:#8E24AA"></span>Ped <span class="legend-dot" style="background:#43A047; margin-left:8px"></span>Bike</div>
        </div>
        <div class="story-detail">
            <div class="detail-title">Low-Light Collisions</div>
            <div class="detail-row"><span>🚶 Pedestrians in dark/dusk/dawn</span><span class="detail-value" style="color:#8E24AA">${darkPed} <small>(${darkPedPct}%)</small></span></div>
            <div class="detail-row"><span>🚲 Cyclists in dark/dusk/dawn</span><span class="detail-value" style="color:#43A047">${darkBike} <small>(${darkBikePct}%)</small></span></div>
        </div>
    `;
    
    // Hourly chart with pedestrian and cyclist overlaid
    Plotly.react('vulnHourChart', [
        { type: 'bar', name: 'Pedestrian', x: Array.from({length: 24}, (_, i) => i), y: pedByHour, marker: { color: 'rgba(142, 36, 170, 0.7)' } },
        { type: 'bar', name: 'Cyclist', x: Array.from({length: 24}, (_, i) => i), y: bikeByHour, marker: { color: 'rgba(67, 160, 71, 0.7)' } }
    ], {
        ...chartLayout(),
        barmode: 'stack',
        showlegend: true,
        legend: { x: 0, y: 1.15, orientation: 'h', font: { size: 10, color: '#7D8590' } },
        xaxis: { tickvals: [0, 6, 12, 18, 23], ticktext: ['0', '6', '12', '18', '23'], color: '#7D8590', gridcolor: 'rgba(255,255,255,0.05)' }
    }, chartConfig());
}

function chartLayout() {
    return {
        paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
        font: { color: '#7D8590', size: 10 },
        margin: { t: 10, r: 10, b: 30, l: 35 },
        xaxis: { color: '#7D8590', gridcolor: 'rgba(255,255,255,0.05)' },
        yaxis: { color: '#7D8590', gridcolor: 'rgba(255,255,255,0.05)' },
        showlegend: false
    };
}

function chartConfig() {
    return { displayModeBar: false, responsive: true };
}

function initControls() {
    document.querySelectorAll('.story-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            state.story = tab.dataset.story;
            document.querySelectorAll('.story-tab').forEach(t => t.classList.toggle('active', t === tab));
            
            // Update panel header
            const headers = {
                trends: '📈 COLLISION TRENDS',
                seasonal: '🌡️ SEASONAL PATTERNS',
                time: '⏰ TIME ANALYSIS',
                safety: '⚠️ SAFETY REPORT',
                vulnerable: '🚶 VULNERABLE USERS'
            };
            document.getElementById('panelHeader').textContent = headers[state.story];
            
            updateAnalysis();
        });
    });
    
    const slider = document.getElementById('radiusSlider');
    slider.addEventListener('input', () => {
        state.settings.radius = parseInt(slider.value);
        document.getElementById('radiusValue').textContent = (state.settings.radius / 1000).toFixed(1) + ' km';
        updateGeographicCircle();
        updateStatsPosition();
        updateAnalysis();
    });
    
    document.getElementById('heatBtn').addEventListener('click', function() {
        state.settings.showHeat = !state.settings.showHeat;
        this.classList.toggle('active', state.settings.showHeat);
        if (state.settings.showHeat) state.layers.heat.addTo(state.map);
        else if (state.layers.heat) state.map.removeLayer(state.layers.heat);
    });
    
    document.getElementById('pointsBtn').addEventListener('click', function() {
        state.settings.showPoints = !state.settings.showPoints;
        this.classList.toggle('active', state.settings.showPoints);
        updatePointsLayer();
    });
    
    // Set initial button states
    document.getElementById('heatBtn').classList.toggle('active', state.settings.showHeat);
    document.getElementById('pointsBtn').classList.toggle('active', state.settings.showPoints);
}

function updateStatsPosition() {
    if (!state.map) return;
    
    // Calculate the actual circle radius in screen pixels
    const center = state.map.getCenter();
    const centerPoint = state.map.latLngToContainerPoint(center);
    
    // Create a point at the edge of the circle (north direction)
    const edgePoint = state.map.latLngToContainerPoint([
        center.lat + (state.settings.radius / 111000), // 111km per degree latitude
        center.lng
    ]);
    
    // Calculate radius in pixels
    const radiusPixels = Math.abs(centerPoint.y - edgePoint.y);
    
    // Position stats on the circumference (radius + small padding)
    // Account for box dimensions to align edges with circle
    const padding = 15;
    const topBottomOffset = radiusPixels + padding;
    const leftRightOffset = radiusPixels + padding + 20; // Extra space for wider boxes
    
    document.querySelector('.stat-item.top').style.transform = `translateX(-50%) translateY(-${topBottomOffset}px)`;
    document.querySelector('.stat-item.bottom').style.transform = `translateX(-50%) translateY(${topBottomOffset}px)`;
    document.querySelector('.stat-item.left').style.transform = `translateY(-50%) translateX(-${leftRightOffset}px)`;
    document.querySelector('.stat-item.right').style.transform = `translateY(-50%) translateX(${leftRightOffset}px)`;
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        if (!inThrottle) {
            func.apply(this, arguments);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

function hideLoading() {
    const loading = document.getElementById('loading');
    loading.style.opacity = '0';
    setTimeout(() => loading.style.display = 'none', 300);
}

document.addEventListener('DOMContentLoaded', init);
