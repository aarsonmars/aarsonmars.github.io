// Data display handling (JSON and Table views)

// Display data in tabular format with common tags as columns
export function displayDataInTable(data) {
    const tableBody = document.querySelector('#data-table tbody');
    const tableHead = document.querySelector('#data-table thead tr');
    
    // Clear existing table content
    tableBody.innerHTML = '';
    tableHead.innerHTML = '';

    const idHeader = document.createElement('th');
    idHeader.textContent = 'ID';
    tableHead.appendChild(idHeader);

    const typeHeader = document.createElement('th');
    typeHeader.textContent = 'Type';
    tableHead.appendChild(typeHeader);

    if (!data || !data.elements || data.elements.length === 0) {
    const tagsHeader = document.createElement('th');
    tagsHeader.textContent = 'Tags';
    tableHead.appendChild(tagsHeader);

    const emptyRow = document.createElement('tr');
    const emptyCell = document.createElement('td');
    emptyCell.colSpan = tableHead.children.length;
        emptyCell.className = 'empty-state';
        emptyCell.textContent = 'No results yet. Fetch data to populate the table.';
        emptyRow.appendChild(emptyCell);
        tableBody.appendChild(emptyRow);
        return;
    }
    
    // Show loading message
    const loadingRow = document.createElement('tr');
    const loadingCell = document.createElement('td');
    loadingCell.colSpan = tableHead.children.length || 3;
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

// Setup tab switching functionality between JSON and Table view
export function setupTabSwitching() {
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
        if (window.currentData && window.currentData.elements && 
            document.querySelector('#data-table tbody').children.length === 0) {
            displayDataInTable(window.currentData);
        }
    });
}

// Display data in the JSON view
export function displayDataInJsonView(data) {
    const dataPreview = document.getElementById('data-preview-content');
    const dataCount = document.getElementById('data-count');
    
    // Display the data count
    dataCount.textContent = data.elements.length;
    
    // Preview the data (limited to first 10 elements)
    const preview = JSON.stringify(data.elements.slice(0, 10), null, 2);
    dataPreview.textContent = preview + (data.elements.length > 10 ? '\n\n[...]' : '');
}

// Initialize the module
export function init() {
    setupTabSwitching();
}