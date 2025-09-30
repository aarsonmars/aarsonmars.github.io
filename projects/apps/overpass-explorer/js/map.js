// Map initialization and interaction
import { updateQueryEditor } from './query-builder.js';

// Module level variables
let map;
let drawnItems;

function renderAreaSummary(area) {
    const summaryElement = document.getElementById('area-summary');
    if (!summaryElement) {
        return;
    }

    const clearButton = document.getElementById('clear-selection');

    if (!area) {
        summaryElement.textContent = 'No area selected';
        summaryElement.classList.remove('has-selection');
        summaryElement.removeAttribute('title');
        if (clearButton) {
            clearButton.disabled = true;
        }
        return;
    }

    const short = (value) => value.toFixed(3);
    const precise = `${area.south.toFixed(6)},${area.west.toFixed(6)},${area.north.toFixed(6)},${area.east.toFixed(6)}`;

    summaryElement.textContent = `${short(area.south)}, ${short(area.west)} → ${short(area.north)}, ${short(area.east)}`;
    summaryElement.classList.add('has-selection');
    summaryElement.title = precise;
    if (clearButton) {
        clearButton.disabled = false;
    }
}

// Initialize Leaflet map
export function initializeMap() {
    // Create the map centered on Halifax, Canada
    map = L.map('map').setView([44.6488, -63.5752], 12);
    
    // Add the OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Initialize the FeatureGroup to store drawn items
    drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    
    // Add draw controls to enable drawing on the map
    const drawControl = new L.Control.Draw({
        draw: {
            polygon: true,
            polyline: false,
            circle: false,
            marker: false,
            circlemarker: false,
            rectangle: {
                shapeOptions: {
                    color: '#3388ff'
                }
            }
        },
        edit: {
            featureGroup: drawnItems,
            remove: true
        }
    });
    
    map.addControl(drawControl);
    renderAreaSummary(window.selectedArea);
    
    // Handle the draw:created event
    map.on('draw:created', function(event) {
        drawnItems.clearLayers();
        const layer = event.layer;
        drawnItems.addLayer(layer);
        
        // Update the selected area
        if (layer instanceof L.Rectangle) {
            const bounds = layer.getBounds();
            window.selectedArea = {
                south: bounds.getSouth(),
                west: bounds.getWest(),
                north: bounds.getNorth(),
                east: bounds.getEast()
            };
            
            // Update the coordinates input
            document.getElementById('coordinates').value = `${window.selectedArea.south.toFixed(6)},${window.selectedArea.west.toFixed(6)},${window.selectedArea.north.toFixed(6)},${window.selectedArea.east.toFixed(6)}`;
            
            // Update the query editor with the new area
            updateQueryEditor();
            renderAreaSummary(window.selectedArea);
        } else if (layer instanceof L.Polygon) {
            const bounds = layer.getBounds();
            window.selectedArea = {
                south: bounds.getSouth(),
                west: bounds.getWest(),
                north: bounds.getNorth(),
                east: bounds.getEast()
            };
            
            // Update the coordinates input
            document.getElementById('coordinates').value = `${window.selectedArea.south.toFixed(6)},${window.selectedArea.west.toFixed(6)},${window.selectedArea.north.toFixed(6)},${window.selectedArea.east.toFixed(6)}`;
            
            // Update the query editor with the new area
            updateQueryEditor();
            renderAreaSummary(window.selectedArea);
        }
    });
}

// Draw a rectangle on the map for the selected area
export function drawRectangleForSelectedArea() {
    if (!window.selectedArea) {
        renderAreaSummary(null);
        return;
    }
    
    drawnItems.clearLayers();
    L.rectangle([
        [window.selectedArea.south, window.selectedArea.west], 
        [window.selectedArea.north, window.selectedArea.east]
    ], {
        color: '#3388ff',
        weight: 2
    }).addTo(drawnItems);

    renderAreaSummary(window.selectedArea);
}

// Enable drawing mode for rectangles
export function enableDrawing() {
    new L.Draw.Rectangle(map).enable();
}

// Use the current visible map area
export function useVisibleArea() {
    const bounds = map.getBounds();
    window.selectedArea = {
        south: bounds.getSouth(),
        west: bounds.getWest(),
        north: bounds.getNorth(),
        east: bounds.getEast()
    };
    
    document.getElementById('coordinates').value = `${window.selectedArea.south.toFixed(6)},${window.selectedArea.west.toFixed(6)},${window.selectedArea.north.toFixed(6)},${window.selectedArea.east.toFixed(6)}`;
    
    // Clear any existing drawn items and draw a rectangle for the visible area
    drawRectangleForSelectedArea();
    
    // Update the query editor with the new area
    updateQueryEditor();
}

// Zoom to a specific bounding box
export function zoomToBounds(bounds) {
    map.fitBounds(bounds);
}

// Add data to the map
export function displayDataOnMap(data) {
    // Use requestAnimationFrame for better UI responsiveness
    requestAnimationFrame(() => {
        // Clear previous data layers (but keep the drawn items)
        map.eachLayer(layer => {
            if (layer !== drawnItems && !(layer instanceof L.TileLayer)) {
                map.removeLayer(layer);
            }
        });

        if (typeof window.overpassToGeoJSON !== 'function') {
            console.error('overpassToGeoJSON is not available on window');
            return;
        }

        window.overpassToGeoJSON(data)
            .then(geoJsonData => {
                if (!geoJsonData || !Array.isArray(geoJsonData.features)) {
                    console.warn('No features returned from Overpass conversion');
                    return;
                }

                // Limit features to a reasonable number to prevent browser freeze
                const MAX_FEATURES = 1000;
                if (geoJsonData.features.length > MAX_FEATURES) {
                    console.warn(`Too many features (${geoJsonData.features.length}), limiting to ${MAX_FEATURES} to prevent browser freeze`);
                    geoJsonData.features = geoJsonData.features.slice(0, MAX_FEATURES);
                }

                if (geoJsonData.features.length === 0) {
                    console.info('No features to display on the map');
                    return;
                }

                // Add GeoJSON to the map with optimized settings
                L.geoJSON(geoJsonData, {
                    style: function (feature) {
                        return { color: '#ff7800', weight: 1.5, opacity: 0.8 }; // Less heavy style
                    },
                    pointToLayer: function (feature, latlng) {
                        return L.circleMarker(latlng, {
                            radius: 4, // Smaller radius
                            fillColor: '#ff7800',
                            color: '#000',
                            weight: 1,
                            opacity: 0.7,
                            fillOpacity: 0.6
                        });
                    },
                    onEachFeature: function (feature, layer) {
                        // Only add popup on click instead of binding immediately
                        layer.on('click', function() {
                            if (feature.properties) {
                                let popupContent = '<div class="popup-content">';
                                popupContent += `<h4>${feature.properties.id}</h4>`;

                                for (const key in feature.properties.tags) {
                                    popupContent += `<strong>${key}:</strong> ${feature.properties.tags[key]}<br>`;
                                }

                                popupContent += '</div>';
                                layer.bindPopup(popupContent).openPopup();
                            }
                        });
                    }
                }).addTo(map);
            })
            .catch(error => {
                console.error('Error converting Overpass data to GeoJSON:', error);
            });
    });
}

// Add a marker to the map
export function addMarker(lat, lon, popupContent) {
    return L.marker([lat, lon]).addTo(drawnItems)
        .bindPopup(popupContent);
}

// Get the map instance (for other modules that might need it)
export function getMap() {
    return map;
}

// Get the drawn items layer (for other modules that might need it)
export function getDrawnItems() {
    return drawnItems;
}

export function clearSelection() {
    if (drawnItems) {
        drawnItems.clearLayers();
    }

    window.selectedArea = null;

    const coordinatesInput = document.getElementById('coordinates');
    if (coordinatesInput) {
        coordinatesInput.value = '';
    }

    renderAreaSummary(null);
    updateQueryEditor();
}