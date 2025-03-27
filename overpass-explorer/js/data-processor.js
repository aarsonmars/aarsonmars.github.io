// Data processing and conversion functions
import { escapeXML, escapeCSV } from './utils.js';

// Optimize conversion for large datasets
export async function overpassToGeoJSON(overpassData) {
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

// Convert Overpass data to OSM XML format
export function convertToOSM(data) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<osm version="0.6" generator="OpenStreetMap Data Explorer">\n';
    
    if (window.selectedArea) {
        xml += `  <bounds minlat="${window.selectedArea.south}" minlon="${window.selectedArea.west}" maxlat="${window.selectedArea.north}" maxlon="${window.selectedArea.east}"/>\n`;
    }
    
    for (const element of data.elements) {
        if (element.type === 'node') {
            xml += `  <node id="${element.id}" lat="${element.lat}" lon="${element.lon}"`;
            
            if (!element.tags || Object.keys(element.tags).length === 0) {
                xml += '/>\n';
            } else {
                xml += '>\n';
                for (const key in element.tags) {
                    xml += `    <tag k="${escapeXML(key)}" v="${escapeXML(element.tags[key])}"/>\n`;
                }
                xml += '  </node>\n';
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
            
            xml += '  </way>\n';
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
            
            xml += '  </relation>\n';
        }
    }
    
    xml += '</osm>';
    return xml;
}

// Convert Overpass data to CSV format
export function convertToCSV(data) {
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

// Make the overpassToGeoJSON function available globally (needed for map.js)
window.overpassToGeoJSON = overpassToGeoJSON;