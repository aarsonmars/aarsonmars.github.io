// Data selection interface handling
import { updateQueryEditor } from './query-builder.js';

// Module level variables
let categoriesData = null;

// Load the categories data from JSON file
async function loadCategoriesData() {
    try {
        const response = await fetch('./js/data/data-categories.json');
        if (!response.ok) {
            throw new Error(`Failed to load categories: ${response.status} ${response.statusText}`);
        }
        categoriesData = await response.json();
        return categoriesData;
    } catch (error) {
        console.error('Error loading categories data:', error);
        return [];
    }
}

// Generate HTML for data categories with subcategories
async function generateCategoriesHTML() {
    const categoriesContainer = document.querySelector('.data-categories');
    if (!categoriesContainer) {
        console.error('No container found for data categories');
        return;
    }
    
    // Clear existing content
    categoriesContainer.innerHTML = '';
    
    // Load categories if not already loaded
    if (!categoriesData) {
        categoriesData = await loadCategoriesData();
    }
    
    // Generate HTML for each category
    categoriesData.forEach((category, index) => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category';
        categoryDiv.id = `category-${category.id}`;
        
        // Create header
        const headerDiv = document.createElement('div');
        headerDiv.className = 'category-header';
        headerDiv.textContent = category.name;
        
        // Create content container
        const contentDiv = document.createElement('div');
        contentDiv.className = 'category-content';
        
        // Create options
        if (category.options && category.options.length > 0) {
            category.options.forEach(option => {
                // Check if this option has subcategories
                if (option.subcategories) {
                    // This is a parent option with subcategories
                    const subCategoryDiv = document.createElement('div');
                    subCategoryDiv.className = 'subcategory-group';
                    
                    // Create subcategory header
                    const subHeaderDiv = document.createElement('div');
                    subHeaderDiv.className = 'subcategory-header';
                    subHeaderDiv.innerHTML = '<span class="expand-icon">▶</span> ' + option.label;
                    subCategoryDiv.appendChild(subHeaderDiv);
                    
                    // Create container for subcategory options
                    const subOptionsDiv = document.createElement('div');
                    subOptionsDiv.className = 'subcategory-options';
                    
                    // Add subcategory options
                    option.subcategories.forEach(subOption => {
                        const optionDiv = createCheckboxOption(subOption.id, subOption.label, !!subOption.default);
                        
                        // Store the OSM tag in a data attribute for query building
                        if (subOption.tag) {
                            optionDiv.querySelector('input').dataset.osmTag = subOption.tag;
                        }
                        
                        subOptionsDiv.appendChild(optionDiv);
                    });
                    
                    // Add a "Select All" checkbox for this subcategory group
                    const selectAllDiv = document.createElement('div');
                    selectAllDiv.className = 'select-all-option';
                    
                    const selectAllCheckbox = document.createElement('input');
                    selectAllCheckbox.type = 'checkbox';
                    selectAllCheckbox.id = `select-all-${option.id}`;
                    
                    const selectAllLabel = document.createElement('label');
                    selectAllLabel.htmlFor = `select-all-${option.id}`;
                    selectAllLabel.textContent = 'Select All';
                    
                    selectAllDiv.appendChild(selectAllCheckbox);
                    selectAllDiv.appendChild(selectAllLabel);
                    
                    // Add event listener to "Select All" checkbox
                    selectAllCheckbox.addEventListener('change', function() {
                        const checkboxes = subOptionsDiv.querySelectorAll('input[type="checkbox"]');
                        checkboxes.forEach(checkbox => {
                            checkbox.checked = this.checked;
                        });
                        updateQueryEditor();
                    });
                    
                    // Add click event to subcategory header to toggle collapse
                    subHeaderDiv.addEventListener('click', function(e) {
                        // Don't propagate to parent category's click handler
                        e.stopPropagation();
                        subCategoryDiv.classList.toggle('collapsed');
                        // Toggle the expand/collapse icon
                        const icon = this.querySelector('.expand-icon');
                        if (icon) {
                            icon.textContent = subCategoryDiv.classList.contains('collapsed') ? '▶' : '▼';
                        }
                    });
                    
                    // Assemble the subcategory group
                    subCategoryDiv.appendChild(selectAllDiv);
                    subCategoryDiv.appendChild(subOptionsDiv);
                    contentDiv.appendChild(subCategoryDiv);
                    
                    // Default state - collapse subcategories
                    subCategoryDiv.classList.add('collapsed');
                } else {
                    // This is a standard option without subcategories
                    const optionDiv = createCheckboxOption(option.id, option.label, !!option.default);
                    contentDiv.appendChild(optionDiv);
                }
            });
        }
        
        // Assemble the category
        categoryDiv.appendChild(headerDiv);
        categoryDiv.appendChild(contentDiv);
        
        // Collapse all categories except the first one
        if (index > 0) {
            categoryDiv.classList.add('collapsed');
        }
        
        categoriesContainer.appendChild(categoryDiv);
    });
    
    // Add CSS for subcategories
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .subcategory-group {
            margin-left: 15px;
            border-left: 1px solid #ddd;
            padding-left: 10px;
            margin-bottom: 15px;
        }
        .subcategory-header {
            font-weight: 600;
            cursor: pointer;
            padding: 5px 0;
            color: #333;
        }
        .subcategory-header .expand-icon {
            margin-right: 5px;
            font-size: 12px;
            color: #666;
        }
        .subcategory-options {
            margin-left: 10px;
        }
        .subcategory-group.collapsed .subcategory-options {
            display: none;
        }
        .select-all-option {
            margin-bottom: 5px;
            font-style: italic;
        }
        .select-all-option label {
            color: #666;
        }
    `;
    document.head.appendChild(styleElement);
    
    // Setup event listeners for the new checkboxes
    setupDataOptionListeners();
}

// Helper function to create a checkbox option
function createCheckboxOption(id, label, isChecked = false) {
    const optionDiv = document.createElement('div');
    optionDiv.className = 'option';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = id;
    checkbox.checked = isChecked;
    
    const labelElement = document.createElement('label');
    labelElement.htmlFor = id;
    labelElement.textContent = label;
    
    optionDiv.appendChild(checkbox);
    optionDiv.appendChild(labelElement);
    
    return optionDiv;
}

// Setup category headers for collapsible sections
export function setupCategoryCollapsing() {
    // Add click event listener to each category header
    document.querySelectorAll('.category-header').forEach(header => {
        header.addEventListener('click', () => {
            // Toggle the collapsed class on the parent category
            const category = header.parentElement;
            category.classList.toggle('collapsed');
        });
    });
}

// Setup search functionality for data options
export function setupDataSearch() {
    const searchInput = document.getElementById('data-option-search');
    const expandAllBtn = document.getElementById('expand-all');
    const collapseAllBtn = document.getElementById('collapse-all');
    const selectNoneBtn = document.getElementById('select-none');
    
    if (!searchInput || !expandAllBtn || !collapseAllBtn || !selectNoneBtn) {
        console.warn('Some data selection UI elements were not found');
        return;
    }
    
    // Search functionality
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const options = document.querySelectorAll('.data-categories .option');
        const categories = document.querySelectorAll('.data-categories .category');
        const subcategories = document.querySelectorAll('.data-categories .subcategory-group');
        
        if (searchTerm.length === 0) {
            // Reset all visibility
            options.forEach(option => {
                option.classList.remove('filtered');
                option.classList.remove('highlight');
            });
            
            categories.forEach(category => {
                category.classList.remove('no-matches');
            });
            
            subcategories.forEach(subcategory => {
                subcategory.classList.remove('no-matches');
                // Re-collapse subcategories
                subcategory.classList.add('collapsed');
            });
            return;
        }
        
        // For each option, check if it matches the search term
        options.forEach(option => {
            const label = option.querySelector('label');
            const text = label.textContent.toLowerCase();
            
            if (text.includes(searchTerm)) {
                option.classList.remove('filtered');
                option.classList.add('highlight');
            } else {
                option.classList.add('filtered');
                option.classList.remove('highlight');
            }
        });
        
        // For each subcategory, check if any options match
        subcategories.forEach(subcategory => {
            const subcategoryOptions = subcategory.querySelectorAll('.option');
            let hasMatches = false;
            
            subcategoryOptions.forEach(option => {
                if (!option.classList.contains('filtered')) {
                    hasMatches = true;
                }
            });
            
            // Show/hide the subcategory based on whether it has matches
            if (hasMatches) {
                subcategory.classList.remove('no-matches');
                // Auto-expand subcategories with matches
                subcategory.classList.remove('collapsed');
            } else {
                subcategory.classList.add('no-matches');
            }
        });
        
        // For each category, check if any options or subcategories match
        categories.forEach(category => {
            const categoryOptions = category.querySelectorAll('.option');
            const categorySubcategories = category.querySelectorAll('.subcategory-group:not(.no-matches)');
            
            let hasMatches = false;
            
            categoryOptions.forEach(option => {
                if (!option.classList.contains('filtered')) {
                    hasMatches = true;
                }
            });
            
            // Also consider subcategories that have matches
            if (categorySubcategories.length > 0) {
                hasMatches = true;
            }
            
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
    expandAllBtn.addEventListener('click', function() {
        document.querySelectorAll('.data-categories .category, .data-categories .subcategory-group').forEach(item => {
            item.classList.remove('collapsed');
        });
    });
    
    // Collapse all categories
    collapseAllBtn.addEventListener('click', function() {
        document.querySelectorAll('.data-categories .category, .data-categories .subcategory-group').forEach(item => {
            item.classList.add('collapsed');
        });
    });
    
    // Clear all selections
    selectNoneBtn.addEventListener('click', function() {
        document.querySelectorAll('.data-categories input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Update the query
        const queryEditor = document.getElementById('query-editor');
        if (queryEditor) {
            queryEditor.dataset.customEdited = 'false';
        }
        updateQueryEditor();
    });
}

// Setup event listeners for data options
export function setupDataOptionListeners() {
    // Find all checkboxes in the data categories
    const checkboxes = document.querySelectorAll('.data-categories .option input[type="checkbox"]');
    
    if (checkboxes.length === 0) {
        console.warn('No data option checkboxes found in the document');
    } else {
        // Add event listeners to existing checkboxes
        checkboxes.forEach(checkbox => {
            // Remove existing listener to avoid duplicates
            checkbox.removeEventListener('change', updateQueryEditor);
            // Add new listener
            checkbox.addEventListener('change', updateQueryEditor);
        });
    }
}

// Get the loaded categories data
export function getCategoriesData() {
    return categoriesData;
}

// Get all selected OSM tags for query building
export function getSelectedOsmTags() {
    const selectedTags = [];
    
    // Get all checked checkboxes
    const checkedOptions = document.querySelectorAll('.data-categories input[type="checkbox"]:checked');
    
    // Check each option for OSM tags
    checkedOptions.forEach(checkbox => {
        // If it has an OSM tag data attribute, use that
        if (checkbox.dataset.osmTag) {
            selectedTags.push(checkbox.dataset.osmTag);
        }
        // Otherwise, use the identifier mapping in query-builder.js
    });
    
    return selectedTags;
}

// Initialize the module
export async function init() {
    await generateCategoriesHTML();
    setupCategoryCollapsing();
    setupDataSearch();
}