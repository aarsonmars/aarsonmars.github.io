// Global variables
let map;
let drawnItems;
let currentData = null;
let selectedArea = null;
// Add Nominatim geocoder service constants
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // First, add the Leaflet.draw plugin CSS
    const linkElement = document.createElement('link');
    linkElement.rel = 'stylesheet';
    linkElement.href = 'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css';
    document.head.appendChild(linkElement);

    // Load the Leaflet.draw plugin JS
    const scriptElement = document.createElement('script');
    scriptElement.src = 'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.js';
    // Initialize the map only after the draw plugin has loaded
    scriptElement.onload = function() {
        initializeMap();
        setupEventListeners();
    };
    document.body.appendChild(scriptElement);
});

// Initialize Leaflet map
function initializeMap() {
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
    
    // Handle the draw:created event
    map.on('draw:created', function(event) {
        drawnItems.clearLayers();
        const layer = event.layer;
        drawnItems.addLayer(layer);
        
        // Update the selected area
        if (layer instanceof L.Rectangle) {
            const bounds = layer.getBounds();
            selectedArea = {
                south: bounds.getSouth(),
                west: bounds.getWest(),
                north: bounds.getNorth(),
                east: bounds.getEast()
            };
            
            // Update the coordinates input
            document.getElementById('coordinates').value = `${selectedArea.south.toFixed(6)},${selectedArea.west.toFixed(6)},${selectedArea.north.toFixed(6)},${selectedArea.east.toFixed(6)}`;
            
            // Update the query editor with the new area
            updateQueryEditor();
        } else if (layer instanceof L.Polygon) {
            const bounds = layer.getBounds();
            selectedArea = {
                south: bounds.getSouth(),
                west: bounds.getWest(),
                north: bounds.getNorth(),
                east: bounds.getEast()
            };
            
            // Update the coordinates input
            document.getElementById('coordinates').value = `${selectedArea.south.toFixed(6)},${selectedArea.west.toFixed(6)},${selectedArea.north.toFixed(6)},${selectedArea.east.toFixed(6)}`;
            
            // Update the query editor with the new area
            updateQueryEditor();
        }
    });
}

// Set up event listeners for the interface elements
function setupEventListeners() {
    // Draw area button
    document.getElementById('draw-area').addEventListener('click', () => {
        // This will enable drawing mode for rectangles
        new L.Draw.Rectangle(map).enable();
    });
    
    // Use visible area button
    document.getElementById('use-visible').addEventListener('click', () => {
        const bounds = map.getBounds();
        selectedArea = {
            south: bounds.getSouth(),
            west: bounds.getWest(),
            north: bounds.getNorth(),
            east: bounds.getEast()
        };
        
        document.getElementById('coordinates').value = `${selectedArea.south.toFixed(6)},${selectedArea.west.toFixed(6)},${selectedArea.north.toFixed(6)},${selectedArea.east.toFixed(6)}`;
        
        // Clear any existing drawn items and draw a rectangle for the visible area
        drawnItems.clearLayers();
        L.rectangle([[selectedArea.south, selectedArea.west], [selectedArea.north, selectedArea.east]], {
            color: '#3388ff',
            weight: 2
        }).addTo(drawnItems);
        
        // Update the query editor with the new area
        updateQueryEditor();
    });
    
    // Add search by location name functionality
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = 'location-search';
    searchInput.placeholder = 'Search for city, province, etc.';
    
    const searchButton = document.createElement('button');
    searchButton.textContent = 'Search';
    searchButton.id = 'location-search-btn';
    
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.appendChild(searchInput);
    searchContainer.appendChild(searchButton);
    
    // Insert before the coordinates input
    const areaSelection = document.querySelector('.area-selection');
    areaSelection.insertBefore(searchContainer, document.getElementById('coordinates'));
    
    // Add style for the search container and make sidebar scrollable
    const style = document.createElement('style');
    style.textContent = `
        .search-container {
            display: flex;
            margin-bottom: 10px;
        }
        #location-search {
            flex: 1;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px 0 0 4px;
        }
        #location-search-btn {
            padding: 8px 12px;
            background-color: #3498db;
            color: white;
            border: 1px solid #3498db;
            border-radius: 0 4px 4px 0;
            cursor: pointer;
        }
        #location-search-btn:hover {
            background-color: #2980b9;
        }
        /* Make sidebar scrollable */
        .sidebar {
            max-height: 500px;
            overflow-y: auto;
            overflow-x: hidden;
        }
    `;
    document.head.appendChild(style);
    
    // Search button click event
    searchButton.addEventListener('click', () => {
        searchByLocationName();
    });
    
    // Allow pressing Enter to search
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            searchByLocationName();
        }
    });
    
    // Manually entered coordinates
    document.getElementById('coordinates').addEventListener('change', (e) => {
        const coordsText = e.target.value;
        const coords = coordsText.split(',').map(c => parseFloat(c.trim()));
        
        if (coords.length === 4 && coords.every(c => !isNaN(c))) {
            selectedArea = {
                south: coords[0],
                west: coords[1],
                north: coords[2],
                east: coords[3]
            };
            
            // Clear any existing drawn items and draw a rectangle for the entered coordinates
            drawnItems.clearLayers();
            L.rectangle([[selectedArea.south, selectedArea.west], [selectedArea.north, selectedArea.east]], {
                color: '#3388ff',
                weight: 2
            }).addTo(drawnItems);
            
            // Zoom the map to the selected area
            map.fitBounds([[selectedArea.south, selectedArea.west], [selectedArea.north, selectedArea.east]]);
            
            // Update the query editor with the new area
            updateQueryEditor();
        }
    });
    
    // Fetch data button
    document.getElementById('fetch-data').addEventListener('click', fetchOverpassData);
    
    // Download buttons
    document.querySelectorAll('.download-options button').forEach(button => {
        button.addEventListener('click', () => {
            const format = button.getAttribute('data-format');
            downloadData(format);
        });
    });

    // Option changes to update query
    document.querySelectorAll('.data-options input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', updateQueryEditor);
    });

    // Setup data option listeners
    setupDataOptionListeners();
    
    // Initialize the query editor with default options
    updateQueryEditor();

    // Setup tab switching for data views
    setupTabSwitching();

    // Setup data search functionality
    setupDataSearch();

    // Setup category collapsing functionality
    setupCategoryCollapsing();
}

// Search for a location by name using Nominatim geocoding service
function searchByLocationName() {
    const searchInput = document.getElementById('location-search');
    const locationName = searchInput.value.trim();
    
    if (!locationName) {
        alert('Please enter a location name');
        return;
    }
    
    // Show loading indicator
    searchInput.disabled = true;
    document.getElementById('location-search-btn').textContent = 'Searching...';
    
    const params = new URLSearchParams({
        q: locationName,
        format: 'json',
        limit: 1,
        polygon_geojson: 1
    });
    
    fetch(`${NOMINATIM_URL}?${params.toString()}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.length === 0) {
                alert('Location not found. Please try a different search term.');
                return;
            }
            
            const result = data[0];
            
            // Set the selected area based on the bounding box
            selectedArea = {
                south: parseFloat(result.boundingbox[0]),
                west: parseFloat(result.boundingbox[2]),
                north: parseFloat(result.boundingbox[1]),
                east: parseFloat(result.boundingbox[3])
            };
            
            // Update the coordinates input
            document.getElementById('coordinates').value = `${selectedArea.south.toFixed(6)},${selectedArea.west.toFixed(6)},${selectedArea.north.toFixed(6)},${selectedArea.east.toFixed(6)}`;
            
            // Clear any existing drawn items and draw a rectangle for the found area
            drawnItems.clearLayers();
            L.rectangle([[selectedArea.south, selectedArea.west], [selectedArea.north, selectedArea.east]], {
                color: '#3388ff',
                weight: 2
            }).addTo(drawnItems);
            
            // Zoom the map to the selected area
            map.fitBounds([[selectedArea.south, selectedArea.west], [selectedArea.north, selectedArea.east]]);
            
            // Add a marker at the location's center point
            L.marker([result.lat, result.lon]).addTo(drawnItems)
                .bindPopup(`<b>${result.display_name}</b>`).openPopup();
                
            // Update the query editor with the new area
            updateQueryEditor();
        })
        .catch(error => {
            console.error('Error searching location:', error);
            alert('Error searching for location. Please try again.');
        })
        .finally(() => {
            // Reset the search input state
            searchInput.disabled = false;
            document.getElementById('location-search-btn').textContent = 'Search';
        });
}

// Update the query editor based on selected options
function updateQueryEditor() {
    const queryEditor = document.getElementById('query-editor');
    if (!queryEditor) {
        console.error('Query editor element not found');
        return;
    }
    
    // Don't update if the user has made custom edits and the function isn't being called directly
    if (queryEditor.dataset.customEdited === 'true' && !updateQueryEditor.forceUpdate) {
        return;
    }
    
    // Throttle the updates to improve performance
    if (updateQueryEditor.isUpdating) {
        clearTimeout(updateQueryEditor.updateTimer);
    }
    
    updateQueryEditor.isUpdating = true;
    updateQueryEditor.updateTimer = setTimeout(() => {
        let query = '[out:json][timeout:25];\n\n';

        // Ensure selectedArea is set
        if (!selectedArea) {
            console.log('No area selected yet');
            queryEditor.value = query + '// Please select an area first';
            updateQueryEditor.isUpdating = false;
            return;
        }

        const bbox = `(${selectedArea.south},${selectedArea.west},${selectedArea.north},${selectedArea.east})`;

        // Start collecting query elements
        query += '// Collect all elements in this query\n';
        query += '(\n';

        // Add individual data types to the query
        let hasElements = false;
        
        // List of all supported data options with their respective queries
        const dataOptions = [
            {
                id: 'highways',
                label: 'Highways/Roads',
                query: `  // Highways and Roads\n  way["highway"]${bbox};\n`
            },
            {
                id: 'buildings',
                label: 'Buildings',
                query: `  // Buildings\n  way["building"]${bbox};\n  relation["building"]${bbox};\n`
            },
            {
                id: 'shops',
                label: 'Shops',
                query: `  // Shops\n  node["shop"]${bbox};\n  way["shop"]${bbox};\n  relation["shop"]${bbox};\n`
            },
            {
                id: 'amenities',
                label: 'Amenities',
                query: `  // Amenities\n  node["amenity"]${bbox};\n  way["amenity"]${bbox};\n  relation["amenity"]${bbox};\n`
            },
            {
                id: 'parks',
                label: 'Parks & Green Areas',
                query: `  // Parks & Green Areas\n  way["leisure"="park"]${bbox};\n  relation["leisure"="park"]${bbox};\n  way["landuse"="recreation_ground"]${bbox};\n`
            },
            {
                id: 'public-transport',
                label: 'Public Transport',
                query: `  // Public Transport\n  node["public_transport"]${bbox};\n  way["public_transport"]${bbox};\n  relation["public_transport"]${bbox};\n  node["highway"="bus_stop"]${bbox};\n  node["railway"="station"]${bbox};\n`
            },
            {
                id: 'water',
                label: 'Water Features',
                query: `  // Water Features\n  way["natural"="water"]${bbox};\n  relation["natural"="water"]${bbox};\n  way["waterway"]${bbox};\n`
            },
            {
                id: 'boundaries',
                label: 'Boundaries/Admin',
                query: `  // Boundaries\n  relation["boundary"="administrative"]${bbox};\n  way["boundary"="administrative"]${bbox};\n`
            },
            {
                id: 'tourism',
                label: 'Tourism',
                query: `  // Tourism\n  node["tourism"]${bbox};\n  way["tourism"]${bbox};\n  relation["tourism"]${bbox};\n`
            },
            {
                id: 'historic',
                label: 'Historic',
                query: `  // Historic\n  node["historic"]${bbox};\n  way["historic"]${bbox};\n  relation["historic"]${bbox};\n`
            },
            {
                id: 'landuse',
                label: 'Land Use',
                query: `  // Land Use\n  way["landuse"]${bbox};\n  relation["landuse"]${bbox};\n`
            },
            {
                id: 'natural',
                label: 'Natural Features',
                query: `  // Natural Features\n  node["natural"]${bbox};\n  way["natural"]${bbox};\n  relation["natural"]${bbox};\n`
            },
            {
                id: 'emergency',
                label: 'Emergency Services',
                query: `  // Emergency Services\n  node["emergency"]${bbox};\n  way["emergency"]${bbox};\n  node["amenity"="police"]${bbox};\n  node["amenity"="fire_station"]${bbox};\n  node["amenity"="hospital"]${bbox};\n`
            },
            {
                id: 'power',
                label: 'Power Infrastructure',
                query: `  // Power Infrastructure\n  node["power"]${bbox};\n  way["power"]${bbox};\n  relation["power"]${bbox};\n`
            },
            {
                id: 'leisure',
                label: 'Leisure Facilities',
                query: `  // Leisure Facilities\n  node["leisure"]${bbox};\n  way["leisure"]${bbox};\n  relation["leisure"]${bbox};\n`
            },
            {
                id: 'man_made',
                label: 'Man-made Structures',
                query: `  // Man-made Structures\n  node["man_made"]${bbox};\n  way["man_made"]${bbox};\n  relation["man_made"]${bbox};\n`
            },
            {
                id: 'office',
                label: 'Offices',
                query: `  // Offices\n  node["office"]${bbox};\n  way["office"]${bbox};\n  relation["office"]${bbox};\n`
            },
            {
                id: 'aeroway',
                label: 'Aviation Features',
                query: `  // Aviation Features\n  node["aeroway"]${bbox};\n  way["aeroway"]${bbox};\n  relation["aeroway"]${bbox};\n`
            },
            {
                id: 'healthcare',
                label: 'Healthcare Facilities',
                query: `  // Healthcare Facilities\n  node["healthcare"]${bbox};\n  way["healthcare"]${bbox};\n  relation["healthcare"]${bbox};\n  node["amenity"="hospital"]${bbox};\n  node["amenity"="clinic"]${bbox};\n  node["amenity"="doctors"]${bbox};\n`
            },
            {
                id: 'military',
                label: 'Military',
                query: `  // Military\n  node["military"]${bbox};\n  way["military"]${bbox};\n  relation["military"]${bbox};\n`
            },
            {
                id: 'sport',
                label: 'Sport Facilities',
                query: `  // Sport Facilities\n  node["sport"]${bbox};\n  way["sport"]${bbox};\n  relation["sport"]${bbox};\n  node["leisure"="sports_centre"]${bbox};\n  way["leisure"="sports_centre"]${bbox};\n`
            },
            {
                id: 'railway',
                label: 'Railways',
                query: `  // Railways\n  way["railway"]${bbox};\n  node["railway"="station"]${bbox};\n  node["railway"="halt"]${bbox};\n  node["railway"="tram_stop"]${bbox};\n`
            },
            {
                id: 'barrier',
                label: 'Barriers',
                query: `  // Barriers\n  node["barrier"]${bbox};\n  way["barrier"]${bbox};\n`
            }
        ];

        // Add query parts for all checked options
        for (const option of dataOptions) {
            const checkbox = document.getElementById(option.id);
            if (checkbox && checkbox.checked) {
                query += option.query;
                hasElements = true;
            }
        }

        // If nothing was selected, default to highways
        if (!hasElements) {
            query += `  // Default query for highways\n  way["highway"]${bbox};\n`;
        }

        // Close the collection and output results
        query += ');\n\n';
        query += '// Output the results\n';
        query += 'out body;\n';
        query += '>;   // Get all nodes for ways and relations\n';
        query += 'out skel qt;';

        queryEditor.value = query;
        updateQueryEditor.isUpdating = false;
    }, 100); // Debounce time
}

// Track query editor changes to detect custom edits
document.getElementById('query-editor').addEventListener('input', function() {
    this.dataset.customEdited = 'true';
});

// Button to reset to auto-generated query
const resetQueryButton = document.createElement('button');
resetQueryButton.textContent = 'Reset Query';
resetQueryButton.className = 'secondary-btn';
resetQueryButton.style.marginTop = '10px';
resetQueryButton.addEventListener('click', function() {
    const queryEditor = document.getElementById('query-editor');
    queryEditor.dataset.customEdited = 'false';
    updateQueryEditor.forceUpdate = true;
    updateQueryEditor();
    updateQueryEditor.forceUpdate = false;
});

// Add the reset button after the query editor
document.querySelector('.custom-query').appendChild(resetQueryButton);

// Initialize the update flags
updateQueryEditor.isUpdating = false;
updateQueryEditor.updateTimer = null;
updateQueryEditor.forceUpdate = false;

// Setup event listeners for data options
function setupDataOptionListeners() {
    // Find all checkboxes in the data categories
    const checkboxes = document.querySelectorAll('.data-categories input[type="checkbox"]');
    
    if (checkboxes.length === 0) {
        console.warn('No data option checkboxes found in the document');
    } else {
        // Add event listeners to existing checkboxes
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                updateQueryEditor();
            });
        });
    }
}

// Also update the fetchOverpassData function to handle the {{bbox}} replacements
async function fetchOverpassData() {
    const dataDisplay = document.querySelector('.data-display');
    const dataPreview = document.getElementById('data-preview-content');
    const dataCount = document.getElementById('data-count');
    
    // Check if an area is selected
    if (!selectedArea) {
        alert('Please select an area first.');
        return;
    }
    
    // Get the query from the editor
    let query = document.getElementById('query-editor').value.trim();

    // Validate the query
    if (!query || query === '[out:json][timeout:25];') {
        alert('The query is empty or invalid. Please ensure you have selected data types and an area.');
        return;
    }

    // Debug: Log the final query being sent
    console.log('Final Overpass Query:', query);

    // Show loading state
    dataPreview.textContent = 'Loading data...';
    dataDisplay.style.display = 'block';

    // Create a timeout for the request
    const timeoutId = setTimeout(() => {
        dataPreview.textContent = 'Request is taking longer than expected. Please wait or try a smaller area/fewer data types...';
    }, 10000); // 10 seconds timeout

    // Create the Overpass API URL
    const overpassUrl = 'https://overpass-api.de/api/interpreter';

    // Make the API call
    try {
        const response = await fetch(overpassUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'data=' + encodeURIComponent(query)
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Overpass API error (${response.status}): ${text}`);
        }

        const data = await response.json();
        currentData = data;

        // Display the data count
        dataCount.textContent = data.elements.length;

        // Preview the data (limited to first 10 elements)
        const preview = JSON.stringify(data.elements.slice(0, 10), null, 2);
        dataPreview.textContent = preview + (data.elements.length > 10 ? '\n\n[...]' : '');

        // Add data to the map
        displayDataOnMap(data);
    } catch (error) {
        clearTimeout(timeoutId);
        console.error('Error fetching data:', error);
        dataPreview.textContent = `Error fetching data: ${error.message}`;
    }
}

// Display the fetched data on the map
function displayDataOnMap(data) {
    // Use requestAnimationFrame for better UI responsiveness
    requestAnimationFrame(() => {
        // Clear previous data layers (but keep the drawn items)
        map.eachLayer(layer => {
            if (layer !== drawnItems && !(layer instanceof L.TileLayer)) {
                map.removeLayer(layer);
            }
        });
        
        // Create GeoJSON from the Overpass data
        const geoJsonData = overpassToGeoJSON(data);
        
        // Limit features to a reasonable number to prevent browser freeze
        const MAX_FEATURES = 1000;
        if (geoJsonData.features.length > MAX_FEATURES) {
            console.warn(`Too many features (${geoJsonData.features.length}), limiting to ${MAX_FEATURES} to prevent browser freeze`);
            geoJsonData.features = geoJsonData.features.slice(0, MAX_FEATURES);
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
    });
    
    // Update table view if it's the active view
    if (document.getElementById('table-view-tab').classList.contains('active')) {
        displayDataInTable(data);
    }
}

// Optimize conversion for large datasets
async function overpassToGeoJSON(overpassData) {
    // Create a node map first to avoid repeated lookups
    const nodeMap = {};
    
    // Process in chunks for better responsiveness with large datasets
    const chunkSize = 1000;
    let elementIndex = 0;
    
    while (elementIndex < overpassData.elements.length) {
        const chunk = overpassData.elements.slice(elementIndex, elementIndex + chunkSize);
        
        // Create node map for this chunk
        chunk.forEach(el => {
            if (el.type === 'node') {
                nodeMap[el.id] = [el.lon, el.lat];
            }
        });
        
        elementIndex += chunkSize;
    }
    
    const features = [];
    elementIndex = 0;
    
    while (elementIndex < overpassData.elements.length) {
        const chunk = overpassData.elements.slice(elementIndex, elementIndex + chunkSize);
        
        // Process chunk to create features
        for (const element of chunk) {
            let feature = null;
            
            if (element.type === 'node') {
                feature = {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [element.lon, element.lat]
                    },
                    properties: {
                        id: `node/${element.id}`,
                        tags: element.tags || {}
                    }
                };
            } else if (element.type === 'way' && element.nodes) {
                // Use the precreated node map for better performance
                const coordinates = [];
                
                // Get coordinates for this way
                for (const nodeId of element.nodes) {
                    if (nodeMap[nodeId]) {
                        coordinates.push(nodeMap[nodeId]);
                    }
                }
                
                if (coordinates.length > 0) {
                    const isPolygon = element.nodes[0] === element.nodes[element.nodes.length - 1] && 
                                      element.tags && 
                                      (element.tags.building || element.tags.landuse || element.tags.leisure || 
                                       element.tags.natural || element.tags.amenity);
                    
                    feature = {
                        type: 'Feature',
                        geometry: {
                            type: isPolygon ? 'Polygon' : 'LineString',
                            coordinates: isPolygon ? [coordinates] : coordinates
                        },
                        properties: {
                            id: `way/${element.id}`,
                            tags: element.tags || {}
                        }
                    };
                }
            }
            
            if (feature) {
                features.push(feature);
            }
        }
        
        elementIndex += chunkSize;
        // Allow UI updates between chunks
        if (elementIndex < overpassData.elements.length) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }
    
    return {
        type: 'FeatureCollection',
        features: features
    };
}

// Convert data to OSM XML format
function convertToOSM(data) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<osm version="0.6" generator="OpenStreetMap Data Explorer">\n';
    
    if (selectedArea) {
        xml += `  <bounds minlat="${selectedArea.south}" minlon="${selectedArea.west}" maxlat="${selectedArea.north}" maxlon="${selectedArea.east}"/>\n`;
    }
    
    for (const element of data.elements) {
        if (element.type === 'node') {
            xml += `  <node id="${element.id}" lat="${element.lat}" lon="${element.lon}"`;
            
            if (!element.tags || Object.keys(element.tags).length === 0) {
                xml += '/>\n';
            } else {
                xml += `>\n`;
                for (const key in element.tags) {
                    xml += `    <tag k="${escapeXML(key)}" v="${escapeXML(element.tags[key])}"/>\n`;
                }
                xml += `  </node>\n`;
            }
        } else if (element.type === 'way') {
            xml += `  <way id="${element.id}">\n`;
            
            if (element.nodes) {
                for (const nodeId of element.nodes) {
                    xml += `    <nd ref="${nodeId}"/>\n`;
                }
            }
            
            if (element.tags) {
                for (const key in element.tags) {
                    xml += `    <tag k="${escapeXML(key)}" v="${escapeXML(element.tags[key])}"/>\n`;
                }
            }
            
            xml += `  </way>\n`;
        } else if (element.type === 'relation') {
            xml += `  <relation id="${element.id}">\n`;
            
            if (element.members) {
                for (const member of element.members) {
                    xml += `    <member type="${member.type}" ref="${member.ref}" role="${escapeXML(member.role || '')}"/>\n`;
                }
            }
            
            if (element.tags) {
                for (const key in element.tags) {
                    xml += `    <tag k="${escapeXML(key)}" v="${escapeXML(element.tags[key])}"/>\n`;
                }
            }
            
            xml += `  </relation>\n`;
        }
    }
    
    xml += '</osm>';
    return xml;
}

// Download data in the specified format
function downloadData(format) {
    if (!currentData || !currentData.elements || currentData.elements.length === 0) {
        alert('No data available to download.');
        return;
    }
    
    let downloadData;
    let mimeType;
    let fileExtension;
    
    switch (format) {
        case 'json':
            downloadData = JSON.stringify(currentData, null, 2);
            mimeType = 'application/json';
            fileExtension = 'json';
            break;
            
        case 'geojson':
            downloadData = JSON.stringify(overpassToGeoJSON(currentData), null, 2);
            mimeType = 'application/geo+json';
            fileExtension = 'geojson';
            break;
            
        case 'osm':
            downloadData = convertToOSM(currentData);
            mimeType = 'application/xml';
            fileExtension = 'osm';
            break;
            
        case 'csv':
            downloadData = convertToCSV(currentData);
            mimeType = 'text/csv';
            fileExtension = 'csv';
            break;
            
        default:
            alert(`Format ${format} is not supported.`);
            return;
    }
    
    // Create a download link and trigger the download
    const blob = new Blob([downloadData], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = `osm-data-export.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Convert data to CSV format
function convertToCSV(data) {
    // Collect all possible tag keys
    const tagKeys = new Set();
    
    for (const element of data.elements) {
        if (element.tags) {
            for (const key in element.tags) {
                tagKeys.add(key);
            }
        }
    }
    
    const sortedTagKeys = Array.from(tagKeys).sort();
    
    // Create header row
    let csv = ['id', 'type', 'lat', 'lon', ...sortedTagKeys].join(',') + '\n';
    
    // Add data rows
    for (const element of data.elements) {
        const row = [
            element.id,
            element.type,
            element.lat || '',
            element.lon || ''
        ];
        
        // Add tag values
        for (const key of sortedTagKeys) {
            const value = element.tags && element.tags[key] ? escapeCSV(element.tags[key]) : '';
            row.push(value);
        }
        
        csv += row.join(',') + '\n';
    }
    
    return csv;
}

// Escape special characters for XML
function escapeXML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// Escape special characters for CSV
function escapeCSV(str) {
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

// Ensure the map container exists and is styled
document.addEventListener('DOMContentLoaded', () => {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.error('Map container (#map) is missing.');
        return;
    }
    mapContainer.style.height = '500px'; // Ensure the map has a height
});

// Display data in tabular format with common tags as columns
function displayDataInTable(data) {
    const tableBody = document.querySelector('#data-table tbody');
    const tableHead = document.querySelector('#data-table thead tr');
    
    // Clear existing table content
    tableBody.innerHTML = '';
    
    // Reset headers (keep only the basic columns)
    tableHead.innerHTML = `
        <th>ID</th>
        <th>Type</th>
    `;
    
    // Show loading message
    const loadingRow = document.createElement('tr');
    const loadingCell = document.createElement('td');
    loadingCell.colSpan = 3;
    loadingCell.textContent = 'Analyzing data and building table...';
    loadingRow.appendChild(loadingCell);
    tableBody.appendChild(loadingRow);
    
    // Extract common tags to use as columns (first pass)
    setTimeout(() => {
        // Find common tag keys across elements (limited to top 8 for readability)
        const tagCounts = {};
        const MAX_TAG_COLUMNS = 8;
        
        data.elements.forEach(element => {
            if (element.tags) {
                Object.keys(element.tags).forEach(key => {
                    tagCounts[key] = (tagCounts[key] || 0) + 1;
                });
            }
        });
        
        // Sort tag keys by frequency and limit to MAX_TAG_COLUMNS
        const commonTags = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, MAX_TAG_COLUMNS)
            .map(entry => entry[0]);
            
        // Add common tag columns to header
        commonTags.forEach(tag => {
            const th = document.createElement('th');
            th.textContent = tag;
            th.title = `${tagCounts[tag]} elements have this tag`;
            tableHead.appendChild(th);
        });
        
        // Add "Other Tags" column for remaining tags
        const otherTagsHeader = document.createElement('th');
        otherTagsHeader.textContent = 'Other Tags';
        tableHead.appendChild(otherTagsHeader);
            
        // Clear loading message
        tableBody.innerHTML = '';
        
        // Process data in batches for better performance
        const batchSize = 50;
        let currentIndex = 0;
        
        function processNextBatch() {
            if (currentIndex >= data.elements.length) {
                return; // All processed
            }
            
            const fragment = document.createDocumentFragment();
            const endIndex = Math.min(currentIndex + batchSize, data.elements.length);
            
            for (let i = currentIndex; i < endIndex; i++) {
                const element = data.elements[i];
                const row = document.createElement('tr');
                
                // ID cell
                const idCell = document.createElement('td');
                idCell.textContent = `${element.type}/${element.id}`;
                row.appendChild(idCell);
                
                // Type cell
                const typeCell = document.createElement('td');
                typeCell.textContent = element.type;
                row.appendChild(typeCell);
                
                // Add cells for common tags
                commonTags.forEach(tagKey => {
                    const tagCell = document.createElement('td');
                    if (element.tags && element.tags[tagKey]) {
                        tagCell.textContent = element.tags[tagKey];
                        // Add class for styling based on tag type
                        tagCell.classList.add('tag-value');
                    } else {
                        tagCell.textContent = '-';
                        tagCell.classList.add('empty-tag');
                    }
                    row.appendChild(tagCell);
                });
                
                // Other tags cell
                const otherTagsCell = document.createElement('td');
                
                if (element.tags) {
                    const otherTagKeys = Object.keys(element.tags)
                        .filter(key => !commonTags.includes(key));
                    
                    if (otherTagKeys.length > 0) {
                        const tagsList = document.createElement('ul');
                        tagsList.className = 'tag-list';
                        
                        otherTagKeys.forEach(key => {
                            const tagItem = document.createElement('li');
                            const keySpan = document.createElement('span');
                            keySpan.className = 'tag-key';
                            keySpan.textContent = key + ': ';
                            tagItem.appendChild(keySpan);
                            tagItem.appendChild(document.createTextNode(element.tags[key]));
                            tagsList.appendChild(tagItem);
                        });
                        
                        otherTagsCell.appendChild(tagsList);
                    } else {
                        otherTagsCell.textContent = '-';
                        otherTagsCell.classList.add('empty-tag');
                    }
                } else {
                    otherTagsCell.textContent = 'No tags';
                    otherTagsCell.classList.add('empty-tag');
                }
                
                row.appendChild(otherTagsCell);
                fragment.appendChild(row);
            }
            
            tableBody.appendChild(fragment);
            currentIndex = endIndex;
            
            if (currentIndex < data.elements.length) {
                setTimeout(processNextBatch, 0);
            }
        }
        
        processNextBatch();
    }, 0);
}

// Setup tab switching functionality
function setupTabSwitching() {
    const jsonTab = document.getElementById('json-view-tab');
    const tableTab = document.getElementById('table-view-tab');
    const jsonView = document.getElementById('json-view');
    const tableView = document.getElementById('table-view');
    
    jsonTab.addEventListener('click', () => {
        jsonTab.classList.add('active');
        tableTab.classList.remove('active');
        jsonView.classList.add('active');
        tableView.classList.remove('active');
    });
    
    tableTab.addEventListener('click', () => {
        tableTab.classList.add('active');
        jsonTab.classList.remove('active');
        tableView.classList.add('active');
        jsonView.classList.remove('active');
        
        // If we have data and the table is empty, populate it
        if (currentData && currentData.elements && 
            document.querySelector('#data-table tbody').children.length === 0) {
            displayDataInTable(currentData);
        }
    });
}

// Setup search functionality for data options
function setupDataSearch() {
    const searchInput = document.getElementById('data-option-search');
    const expandAllBtn = document.getElementById('expand-all');
    const collapseAllBtn = document.getElementById('collapse-all');
    const selectNoneBtn = document.getElementById('select-none');
    
    if (!searchInput) {
        return;
    }

    // Search functionality
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const options = document.querySelectorAll('.data-categories .option');
        const categories = document.querySelectorAll('.data-categories .category');
        
        if (searchTerm.length === 0) {
            // Reset all visibility
            options.forEach(option => {
                option.classList.remove('filtered');
                option.classList.remove('highlight');
            });
            
            categories.forEach(category => {
                category.classList.remove('no-matches');
            });
            return;
        }
        
        // For each category, check if any options match
        categories.forEach(category => {
            const categoryOptions = category.querySelectorAll('.option');
            let hasMatches = false;
            
            categoryOptions.forEach(option => {
                const label = option.querySelector('label');
                const text = label.textContent.toLowerCase();
                
                if (text.includes(searchTerm)) {
                    option.classList.remove('filtered');
                    option.classList.add('highlight');
                    hasMatches = true;
                } else {
                    option.classList.add('filtered');
                    option.classList.remove('highlight');
                }
            });
            
            // Show/hide the category based on whether it has matches
            if (hasMatches) {
                category.classList.remove('no-matches');
                // Auto-expand categories with matches
                category.classList.remove('collapsed');
            } else {
                category.classList.add('no-matches');
            }
        });
    });
    
    // Expand all categories
    if (expandAllBtn) {
        expandAllBtn.addEventListener('click', () => {
            document.querySelectorAll('.category').forEach(category => {
                category.classList.remove('collapsed');
                const icon = category.querySelector('.expand-icon');
                if (icon) icon.textContent = '▼';
            });
            document.querySelectorAll('.subcategory').forEach(subcategory => {
                subcategory.classList.remove('collapsed');
                const icon = subcategory.querySelector('.expand-icon');
                if (icon) icon.textContent = '▼';
            });
        });
    }
    
    if (collapseAllBtn) {
        collapseAllBtn.addEventListener('click', () => {
            document.querySelectorAll('.category').forEach(category => {
                category.classList.add('collapsed');
                const icon = category.querySelector('.expand-icon');
                if (icon) icon.textContent = '▶';
            });
            document.querySelectorAll('.subcategory').forEach(subcategory => {
                subcategory.classList.add('collapsed');
                const icon = subcategory.querySelector('.expand-icon');
                if (icon) icon.textContent = '▶';
            });
        });
    }

    if (selectNoneBtn) {
        selectNoneBtn.addEventListener('click', () => {
            document.querySelectorAll('.data-categories input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = false;
            });
        });
    }
    document.querySelectorAll('.category-header').forEach(header => {
        header.addEventListener('click', () => {
            // Toggle the collapsed class on the parent category
            const category = header.parentElement;
            category.classList.toggle('collapsed');
        });
        
        // Default state - collapse all categories except the first one
        if (header.parentElement !== document.querySelector('.category')) {
            header.parentElement.classList.add('collapsed');
        }
    });
}
