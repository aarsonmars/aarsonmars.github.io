# OpenStreetMap Data Explorer

This web application allows you to explore and download OpenStreetMap data using the Overpass API. You can select specific areas of interest, choose what data to include (roads, buildings, etc.), and download the data in various formats.

## Features

- Interactive map selection: Draw an area, use the visible map area, or enter coordinates manually
- Choose specific data categories to include in your query:
  - Highways/Roads
  - Shops
  - Amenities
  - Buildings
  - Parks & Green Areas
  - Public Transport
- Real-time preview of the fetched data
- Download data in multiple formats:
  - OSM XML
  - GeoJSON
  - CSV
  - JSON
- Custom Overpass query editor for advanced users

## How to Use

1. **Select an Area**
   - Click "Draw on Map" and draw a rectangle or polygon on the map
   - Or click "Use Visible Area" to use the current map view
   - Or manually enter coordinates in the format: south,west,north,east

2. **Choose Data to Include**
   - Check the categories you're interested in
   - The query will be automatically updated in the query editor
   - Advanced users can modify the query directly

3. **Fetch Data**
   - Click the "Fetch Data" button to retrieve information from OpenStreetMap
   - The data will be displayed on the map and a preview will be shown below

4. **Download Data**
   - Choose your preferred format: OSM XML, GeoJSON, CSV, or JSON
   - Click the corresponding button to download the file

## Running the Application

Simply open the `index.html` file in a web browser. The application uses CDN-hosted libraries so no installation is required.

## Dependencies

- Leaflet.js for the interactive map
- Leaflet.draw for the drawing tools
- The Overpass API for fetching OpenStreetMap data

## Notes

- Large queries may take some time to process
- The Overpass API has usage limits, so avoid fetching very large areas at once
- Some complex features like multipolygons may not be perfectly represented in all export formats
```
