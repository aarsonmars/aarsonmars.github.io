// UI setup and general event handling
import { enableDrawing, useVisibleArea, drawRectangleForSelectedArea, zoomToBounds, addMarker, displayDataOnMap } from './map.js';
import { updateQueryEditor, init as initQueryBuilder } from './query-builder.js';
import { init as initDataSelection } from './data-selection.js';
import { init as initExport } from './export.js';
import { init as initDataDisplay } from './data-display.js';
import { displayDataInTable, displayDataInJsonView } from './data-display.js';
import { parseCoordinates } from './utils.js';

// Nominatim geocoder service constants
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

// Setup event listeners for the interface elements
export function setupEventListeners() {
    // Draw area button
    document.getElementById('draw-area').addEventListener('click', () => {
        enableDrawing();
    });
    
    // Use visible area button
    document.getElementById('use-visible').addEventListener('click', () => {
        useVisibleArea();
    });
    
    // Add search by location name functionality
    setupLocationSearch();
    
    // Manually entered coordinates
    document.getElementById('coordinates').addEventListener('change', (e) => {
        const coordsText = e.target.value;
        const selectedArea = parseCoordinates(coordsText);
        
        if (selectedArea) {
            window.selectedArea = selectedArea;
            
            // Clear any existing drawn items and draw a rectangle for the entered coordinates
            drawRectangleForSelectedArea();
            
            // Zoom the map to the selected area
            zoomToBounds([
                [selectedArea.south, selectedArea.west], 
                [selectedArea.north, selectedArea.east]
            ]);
            
            // Update the query editor with the new area
            updateQueryEditor();
        }
    });
    
    // Fetch data button
    document.getElementById('fetch-data').addEventListener('click', fetchOverpassData);
    
    // Initialize the query editor with default options
    updateQueryEditor();
    
    // Initialize modules
    initQueryBuilder();
    initDataSelection();
    initExport();
    initDataDisplay();
}

// Setup location search functionality
function setupLocationSearch() {
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
            window.selectedArea = {
                south: parseFloat(result.boundingbox[0]),
                west: parseFloat(result.boundingbox[2]),
                north: parseFloat(result.boundingbox[1]),
                east: parseFloat(result.boundingbox[3])
            };
            
            // Update the coordinates input
            document.getElementById('coordinates').value = `${window.selectedArea.south.toFixed(6)},${window.selectedArea.west.toFixed(6)},${window.selectedArea.north.toFixed(6)},${window.selectedArea.east.toFixed(6)}`;
            
            // Clear any existing drawn items and draw a rectangle for the found area
            drawRectangleForSelectedArea();
            
            // Zoom the map to the selected area
            zoomToBounds([
                [window.selectedArea.south, window.selectedArea.west], 
                [window.selectedArea.north, window.selectedArea.east]
            ]);
            
            // Add a marker at the location's center point
            addMarker(result.lat, result.lon, `<b>${result.display_name}</b>`).openPopup();
                
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

// Fetch Overpass API data
async function fetchOverpassData() {
    const dataDisplay = document.querySelector('.data-display');
    const dataPreview = document.getElementById('data-preview-content');
    
    // Check if an area is selected
    if (!window.selectedArea) {
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
        window.currentData = data;

        // Display the data
        displayDataInJsonView(data);

        // Add data to the map
        displayDataOnMap(data);
    } catch (error) {
        clearTimeout(timeoutId);
        console.error('Error fetching data:', error);
        dataPreview.textContent = `Error fetching data: ${error.message}`;
    }
}

// Add toggle functionality for expandable categories
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.category-header').forEach(header => {
        header.addEventListener('click', () => {
            const category = header.parentElement;
            category.classList.toggle('collapsed');
        });
    });

    document.querySelectorAll('.subcategory-header').forEach(header => {
        header.addEventListener('click', (event) => {
            // Prevent checkbox clicks from triggering the toggle
            if (event.target.tagName.toLowerCase() === 'input') return;

            const subcategory = header.parentElement;
            subcategory.classList.toggle('collapsed');
        });
    });

    // Add functionality for 'Select All' checkboxes
    document.querySelectorAll('.subcategory-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const subcategory = checkbox.closest('.subcategory');
            const subOptions = subcategory.querySelectorAll('.subcategory-options input[type="checkbox"]');

            subOptions.forEach(option => {
                option.checked = checkbox.checked;
            });
        });
    });
});