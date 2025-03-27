// Query building logic
import { getSelectedOsmTags } from './data-selection.js';

// Map option IDs to Overpass query filters
const optionToQueryMap = {
    // Highways/roads
    'highway_all': '["highway"]',
    'highway_motorway': '["highway"="motorway"]',
    'highway_trunk': '["highway"="trunk"]',
    'highway_primary': '["highway"="primary"]',
    'highway_secondary': '["highway"="secondary"]',
    'highway_residential': '["highway"="residential"]',
    
    // Public transport
    'public_transport_all': '["public_transport"]|["railway"="station"]|["railway"="tram_stop"]|["highway"="bus_stop"]|["aeroway"="aerodrome"]|["amenity"="ferry_terminal"]',
    
    // Buildings
    'building_all': '["building"]',
    
    // Shops
    'shop_all': '["shop"]',
    
    // Amenities
    'amenity_all': '["amenity"]',
    
    // Leisure features
    'leisure_all': '["leisure"]',
    'leisure_park': '["leisure"="park"]',
    
    // Natural features
    'natural_all': '["natural"]',
    'natural_water': '["natural"="water"]',
    
    // Boundaries
    'boundary_administrative': '["boundary"="administrative"]',
    
    // Land use
    'landuse_all': '["landuse"]',
    
    // Tourism
    'tourism_all': '["tourism"]',
    'historic': '["historic"]'
};

// Generate Overpass QL query from selected options
export function buildOverpassQuery(boundingBox) {
    const checkedOptions = document.querySelectorAll('.data-categories input[type="checkbox"]:checked');
    
    if (!checkedOptions.length) {
        return '[out:json][timeout:30];\n// No data categories selected\n';
    }
    
    // Query header
    let query = '[out:json][timeout:30];\n';
    
    // Add bounding box if provided
    if (boundingBox && boundingBox.length === 4) {
        // Format: south,west,north,east
        query += `// Bounding box: ${boundingBox.join(',')}\n`;
        
        // Add the bounding box area to every query element
        const bbox = `(${boundingBox[0]},${boundingBox[1]},${boundingBox[2]},${boundingBox[3]})`;
        
        // Start the union block for all selected data types
        query += '(\n';
        
        // Get all selected checkboxes that aren't "select all" buttons
        const selectedBoxes = Array.from(checkedOptions)
            .filter(checkbox => !checkbox.id.startsWith('select-all-'));
        
        // Process direct tag filters from data attributes
        const tagFilters = new Set();
        
        // Process each selected checkbox
        selectedBoxes.forEach(checkbox => {
            // If it has an OSM tag data attribute, use that
            if (checkbox.dataset.osmTag) {
                // Ensure proper formatting of the tag
                let osmTag = checkbox.dataset.osmTag;
                if (osmTag.includes('=') && !osmTag.includes('="')) {
                    // Add quotes around the value if missing
                    osmTag = osmTag.replace(/=([^"'][^\s]*)/, '="$1"');
                }
                tagFilters.add(osmTag);
            } 
            // Otherwise use the mapping
            else if (optionToQueryMap[checkbox.id]) {
                tagFilters.add(optionToQueryMap[checkbox.id]);
            }
        });
        
        // Add each tag filter to the query
        tagFilters.forEach(tagFilter => {
            // Check if this is a complex filter with logical OR
            if (tagFilter.includes('|')) {
                // Split the OR conditions
                const orConditions = tagFilter.split('|');
                
                // Process each OR condition
                orConditions.forEach(condition => {
                    addConditionToQuery(condition, bbox);
                });
            } else {
                // Standard filter
                addConditionToQuery(tagFilter, bbox);
            }
        });
        
        // Close the union block
        query += ');\n';
    } else {
        query += '// No bounding box specified. Please provide coordinates.\n';
    }
    
    // Add output statements
    query += '// Convert ways to polygons where possible (closed ways)\n';
    query += 'out body;\n';
    query += '>;  // Get all nodes for ways\n';
    query += 'out skel qt; // Output all nodes involved in ways/relations\n';
    
    return query;
    
    // Helper function to add a condition to the query with bounding box
    function addConditionToQuery(condition, bbox) {
        // Handle tags with logical operations like 'and'
        if (condition.includes(' and ')) {
            // Split into individual conditions
            const conditions = condition.split(' and ');
            let nodeCondition = 'node';
            let wayCondition = 'way';
            let relationCondition = 'relation';
            
            conditions.forEach(cond => {
                nodeCondition += cond;
                wayCondition += cond;
                relationCondition += cond;
            });
            
            // Add the bounding box to each
            query += `  ${nodeCondition}${bbox};\n`;
            query += `  ${wayCondition}${bbox};\n`;
            query += `  ${relationCondition}${bbox};\n`;
        } else {
            // Make sure the condition is properly formatted with brackets
            if (!condition.startsWith('[') && condition.includes('=')) {
                condition = `[${condition.replace(/^\[|\]$/g, '')}]`;
            }
            
            // Ensure there's a space between element type and tag filter
            query += `  node${condition}${bbox};\n`;
            query += `  way${condition}${bbox};\n`;
            query += `  relation${condition}${bbox};\n`;
        }
    }
}

// Update the query editor with the current query
export function updateQueryEditor() {
    const queryEditor = document.getElementById('query-editor');
    
    if (!queryEditor) {
        console.error('Query editor not found');
        return;
    }
    
    // Skip rebuilding if user has manually edited the query
    if (queryEditor.dataset.customEdited === 'true') {
        return;
    }
    
    // Get bounding box
    const coordinatesInput = document.getElementById('coordinates');
    let boundingBox = null;
    
    if (coordinatesInput && coordinatesInput.value) {
        boundingBox = coordinatesInput.value.split(',').map(parseFloat);
    }
    
    // Update query
    queryEditor.value = buildOverpassQuery(boundingBox);
}

// Setup monitoring for custom edits to the query
export function setupQueryEditorMonitoring() {
    const queryEditor = document.getElementById('query-editor');
    
    if (!queryEditor) {
        console.error('Query editor not found');
        return;
    }
    
    // Set initial state
    queryEditor.dataset.customEdited = 'false';
    
    // Monitor input changes
    queryEditor.addEventListener('input', function() {
        queryEditor.dataset.customEdited = 'true';
    });
}

// Initialize the module
export function init() {
    setupQueryEditorMonitoring();
    // Initial query building
    updateQueryEditor();
}