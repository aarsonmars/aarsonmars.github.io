// Export functionality for data downloads
import { convertToOSM, convertToCSV, overpassToGeoJSON } from './data-processor.js';

// Download data in the specified format
export function downloadData(format) {
    if (!window.currentData || !window.currentData.elements || window.currentData.elements.length === 0) {
        alert('No data available to download.');
        return;
    }
    
    let downloadData;
    let mimeType;
    let fileExtension;
    
    switch (format) {
        case 'json':
            downloadData = JSON.stringify(window.currentData, null, 2);
            mimeType = 'application/json';
            fileExtension = 'json';
            break;
            
        case 'geojson':
            overpassToGeoJSON(window.currentData).then(geoJson => {
                const blob = new Blob([JSON.stringify(geoJson, null, 2)], { type: 'application/geo+json' });
                triggerDownload(blob, 'osm-data-export.geojson');
            });
            return; // Early return as this is handled asynchronously
            
        case 'osm':
            downloadData = convertToOSM(window.currentData);
            mimeType = 'application/xml';
            fileExtension = 'osm';
            break;
            
        case 'csv':
            downloadData = convertToCSV(window.currentData);
            mimeType = 'text/csv';
            fileExtension = 'csv';
            break;
            
        default:
            alert(`Format ${format} is not supported.`);
            return;
    }
    
    // Create a download link and trigger the download
    const blob = new Blob([downloadData], { type: mimeType });
    triggerDownload(blob, `osm-data-export.${fileExtension}`);
}

// Helper function to trigger a download
function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Setup download buttons
export function setupDownloadButtons() {
    document.querySelectorAll('.download-options button').forEach(button => {
        button.addEventListener('click', () => {
            const format = button.getAttribute('data-format');
            downloadData(format);
        });
    });
}

// Initialize the module
export function init() {
    setupDownloadButtons();
}