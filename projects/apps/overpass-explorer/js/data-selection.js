// Data selection interface handling
import { updateQueryEditor } from './query-builder.js';

function updateSubcategoryState(subcategoryElement) {
    if (!subcategoryElement) return;
    const headerCheckbox = subcategoryElement.querySelector('.subcategory-checkbox');
    if (!headerCheckbox) return;
    const optionCheckboxes = subcategoryElement.querySelectorAll('.option input[type="checkbox"]');
    if (optionCheckboxes.length === 0) {
        headerCheckbox.checked = false;
        headerCheckbox.indeterminate = false;
        return;
    }
    const checkedCount = Array.from(optionCheckboxes).filter(cb => cb.checked).length;
    headerCheckbox.checked = checkedCount === optionCheckboxes.length;
    headerCheckbox.indeterminate = checkedCount > 0 && checkedCount < optionCheckboxes.length;
}

function updateCategoryState(categoryElement) {
    if (!categoryElement) return;
    const categoryCheckbox = categoryElement.querySelector('.category-checkbox');
    if (!categoryCheckbox) return;
    const optionCheckboxes = categoryElement.querySelectorAll('.option input[type="checkbox"]');
    if (optionCheckboxes.length === 0) {
        categoryCheckbox.checked = false;
        categoryCheckbox.indeterminate = false;
        return;
    }
    const checkedCount = Array.from(optionCheckboxes).filter(cb => cb.checked).length;
    categoryCheckbox.checked = checkedCount === optionCheckboxes.length;
    categoryCheckbox.indeterminate = checkedCount > 0 && checkedCount < optionCheckboxes.length;
}

function updateHierarchyStatesFromOption(optionCheckbox) {
    if (!optionCheckbox) return;
    const subcategory = optionCheckbox.closest('.subcategory-group');
    if (subcategory) {
        updateSubcategoryState(subcategory);
    }
    const category = optionCheckbox.closest('.category');
    if (category) {
        updateCategoryState(category);
    }
}

function handleCategoryCheckboxChange(event) {
    const category = event.target.closest('.category');
    if (!category) return;
    const isChecked = event.target.checked;
    category.querySelectorAll('.subcategory-checkbox').forEach(cb => {
        cb.checked = isChecked;
        cb.indeterminate = false;
    });
    category.querySelectorAll('.option input[type="checkbox"]').forEach(cb => {
        cb.checked = isChecked;
    });
    category.querySelectorAll('.subcategory-group').forEach(updateSubcategoryState);
    updateCategoryState(category);
    updateQueryEditor();
}

function handleSubcategoryCheckboxChange(event) {
    const subcategory = event.target.closest('.subcategory-group');
    if (!subcategory) return;
    const isChecked = event.target.checked;
    subcategory.querySelectorAll('.option input[type="checkbox"]').forEach(cb => {
        cb.checked = isChecked;
    });
    updateSubcategoryState(subcategory);
    const category = event.target.closest('.category');
    if (category) {
        updateCategoryState(category);
    }
    updateQueryEditor();
}

function onOptionCheckboxChange(event) {
    updateHierarchyStatesFromOption(event.target);
    updateQueryEditor();
}

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

        const headerDiv = document.createElement('div');
        headerDiv.className = 'category-header';

    const categoryCheckbox = document.createElement('input');
    categoryCheckbox.type = 'checkbox';
    categoryCheckbox.className = 'category-checkbox';
    categoryCheckbox.id = `category-checkbox-${category.id}`;
    categoryCheckbox.setAttribute('aria-label', `Select all ${category.name}`);
    headerDiv.appendChild(categoryCheckbox);

    const categoryLabel = document.createElement('span');
    categoryLabel.className = 'category-name';
    categoryLabel.textContent = category.name;
    categoryLabel.setAttribute('role', 'button');
    categoryLabel.tabIndex = 0;
    categoryLabel.setAttribute('aria-expanded', 'true');
    headerDiv.appendChild(categoryLabel);

        const expandIcon = document.createElement('span');
        expandIcon.className = 'expand-icon';
        expandIcon.textContent = '▼';
        headerDiv.appendChild(expandIcon);

        categoryCheckbox.addEventListener('change', handleCategoryCheckboxChange);

        const contentDiv = document.createElement('div');
        contentDiv.className = 'category-content';

        if (category.options && category.options.length > 0) {
            const subcategoryGroups = category.options.filter(option => Array.isArray(option.subcategories) && option.subcategories.length > 0);
            const directOptions = category.options.filter(option => !option.subcategories || option.subcategories.length === 0);
            const shouldFlattenSingleGroup = subcategoryGroups.length === 1 && directOptions.length === 0;

            if (shouldFlattenSingleGroup) {
                categoryDiv.classList.add('single-subcategory');
                const [singleGroup] = subcategoryGroups;
                const subOptionsDiv = document.createElement('div');
                subOptionsDiv.className = 'subcategory-options single-group';

                singleGroup.subcategories.forEach(subOption => {
                    const optionDiv = createCheckboxOption(subOption.id, subOption.label, !!subOption.default);
                    if (subOption.tag) {
                        optionDiv.querySelector('input').dataset.osmTag = subOption.tag;
                    }
                    subOptionsDiv.appendChild(optionDiv);
                });

                contentDiv.appendChild(subOptionsDiv);
            } else {
                category.options.forEach(option => {
                    if (option.subcategories && option.subcategories.length > 0) {
                        const subCategoryDiv = document.createElement('div');
                        subCategoryDiv.className = 'subcategory-group';

                        const subHeaderDiv = document.createElement('div');
                        subHeaderDiv.className = 'subcategory-header';

                        const subCheckbox = document.createElement('input');
                        subCheckbox.type = 'checkbox';
                        subCheckbox.className = 'subcategory-checkbox';
                        subCheckbox.id = `subcategory-checkbox-${option.id}`;
                        subCheckbox.setAttribute('aria-label', `Select all ${option.label}`);
                        subHeaderDiv.appendChild(subCheckbox);

                        const subLabel = document.createElement('span');
                        subLabel.className = 'subcategory-name';
                        subLabel.textContent = option.label;
                        subLabel.setAttribute('role', 'button');
                        subLabel.tabIndex = 0;
                        subLabel.setAttribute('aria-expanded', 'true');
                        subHeaderDiv.appendChild(subLabel);

                        const subExpandIcon = document.createElement('span');
                        subExpandIcon.className = 'expand-icon';
                        subExpandIcon.textContent = '▼';
                        subHeaderDiv.appendChild(subExpandIcon);

                        subCheckbox.addEventListener('change', handleSubcategoryCheckboxChange);

                        const subOptionsDiv = document.createElement('div');
                        subOptionsDiv.className = 'subcategory-options';

                        option.subcategories.forEach(subOption => {
                            const optionDiv = createCheckboxOption(subOption.id, subOption.label, !!subOption.default);
                            if (subOption.tag) {
                                optionDiv.querySelector('input').dataset.osmTag = subOption.tag;
                            }
                            subOptionsDiv.appendChild(optionDiv);
                        });

                        subCategoryDiv.appendChild(subHeaderDiv);
                        subCategoryDiv.appendChild(subOptionsDiv);
                        contentDiv.appendChild(subCategoryDiv);

                        setSubcategoryExpandedState(subCategoryDiv, false);
                    } else {
                        const optionDiv = createCheckboxOption(option.id, option.label, !!option.default);
                        if (option.tag) {
                            optionDiv.querySelector('input').dataset.osmTag = option.tag;
                        }
                        contentDiv.appendChild(optionDiv);
                    }
                });
            }
        }

        categoryDiv.appendChild(headerDiv);
        categoryDiv.appendChild(contentDiv);

        setCategoryExpandedState(categoryDiv, index === 0);

        categoriesContainer.appendChild(categoryDiv);
    });

    setupDataOptionListeners();
    categoriesContainer.querySelectorAll('.subcategory-group').forEach(updateSubcategoryState);
    categoriesContainer.querySelectorAll('.category').forEach(updateCategoryState);
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

function setCategoryExpandedState(categoryElement, expanded) {
    if (!categoryElement) return;
    categoryElement.classList.toggle('collapsed', !expanded);
    const header = categoryElement.querySelector('.category-header');
    if (header) {
        const icon = header.querySelector('.expand-icon');
        if (icon) {
            icon.textContent = expanded ? '▼' : '▶';
        }
        const toggleButton = header.querySelector('.category-name');
        if (toggleButton) {
            toggleButton.setAttribute('aria-expanded', expanded.toString());
        }
    }
}

function setSubcategoryExpandedState(subcategoryElement, expanded) {
    if (!subcategoryElement) return;
    subcategoryElement.classList.toggle('collapsed', !expanded);
    const header = subcategoryElement.querySelector('.subcategory-header');
    if (header) {
        const icon = header.querySelector('.expand-icon');
        if (icon) {
            icon.textContent = expanded ? '▼' : '▶';
        }
        const toggleButton = header.querySelector('.subcategory-name');
        if (toggleButton) {
            toggleButton.setAttribute('aria-expanded', expanded.toString());
        }
    }
}

// Setup category headers for collapsible sections
export function setupCategoryCollapsing() {
    document.querySelectorAll('.category-header').forEach(header => {
        if (header.dataset.collapseAttached === 'true') {
            return;
        }
        header.dataset.collapseAttached = 'true';
        header.addEventListener('click', event => {
            if (event.target.closest('input')) {
                return;
            }
            const category = header.parentElement;
            const shouldExpand = category.classList.contains('collapsed');
            setCategoryExpandedState(category, shouldExpand);
        });

        const toggleButton = header.querySelector('.category-name');
        if (toggleButton && toggleButton.dataset.keyAttached !== 'true') {
            toggleButton.dataset.keyAttached = 'true';
            toggleButton.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    header.click();
                }
            });
        }
    });

    document.querySelectorAll('.subcategory-header').forEach(header => {
        if (header.dataset.collapseAttached === 'true') {
            return;
        }
        header.dataset.collapseAttached = 'true';
        header.addEventListener('click', event => {
            if (event.target.closest('input')) {
                return;
            }
            const subcategory = header.parentElement;
            const shouldExpand = subcategory.classList.contains('collapsed');
            setSubcategoryExpandedState(subcategory, shouldExpand);
        });

        const toggleButton = header.querySelector('.subcategory-name');
        if (toggleButton && toggleButton.dataset.keyAttached !== 'true') {
            toggleButton.dataset.keyAttached = 'true';
            toggleButton.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    header.click();
                }
            });
        }
    });
}

// Setup search functionality for data options
export function setupDataSearch() {
    const searchInput = document.getElementById('data-option-search');
    
    if (!searchInput) {
        console.warn('Data option search input was not found');
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
                setSubcategoryExpandedState(subcategory, false);
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
                setSubcategoryExpandedState(subcategory, true);
            } else {
                subcategory.classList.add('no-matches');
                setSubcategoryExpandedState(subcategory, false);
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
                setCategoryExpandedState(category, true);
            } else {
                category.classList.add('no-matches');
            }
        });
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
            checkbox.removeEventListener('change', onOptionCheckboxChange);
            checkbox.addEventListener('change', onOptionCheckboxChange);
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