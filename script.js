document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const itemsContainer = document.getElementById('itemsContainer');
    const itemNameInput = document.getElementById('itemName');
    const createToggleBtn = document.getElementById('createToggle');
    const createCounterBtn = document.getElementById('createCounter');

    // Load items from localStorage
    function loadItems() {
        const savedData = localStorage.getItem('counterToggleAppData');
        if (savedData) {
            try {
                return JSON.parse(savedData);
            } catch (e) {
                console.error("Error parsing saved data:", e);
                return [];
            }
        }
        return [];
    }

    // Save items to localStorage
    function saveItems(items) {
        localStorage.setItem('counterToggleAppData', JSON.stringify(items));
    }

    // Initialize with loaded items
    let items = loadItems();

    // Render all items
    function renderAllItems() {
        itemsContainer.innerHTML = '';
        
        // First render all toggles
        items.filter(item => item.type === 'toggle').forEach(toggle => {
            renderToggle(toggle);
        });
        
        // Then render standalone counters
        items.filter(item => item.type === 'counter' && !item.parentId).forEach(counter => {
            renderCounter(counter);
        });
    }

    // Render a toggle with its counters
    function renderToggle(toggle) {
        const toggleElement = document.createElement('div');
        toggleElement.className = 'item toggle';
        toggleElement.dataset.id = toggle.id;
        
        toggleElement.innerHTML = `
            <div class="item-header">
                <div class="toggle-header">
                    <button class="toggle-collapse-btn">${toggle.collapsed ? '▶' : '▼'}</button>
                    <span class="item-name">${toggle.name}</span>
                </div>
                <div class="item-actions">
                    <button class="delete-btn">Delete</button>
                </div>
            </div>
            <div class="toggle-content" style="${toggle.collapsed ? 'display:none' : ''}">
                ${toggle.counters ? toggle.counters.map(counter => `
                    <div class="item counter" data-id="${counter.id}">
                        <div class="item-header">
                            <span class="item-name">${counter.name}</span>
                            <div class="item-actions">
                                <button class="delete-btn">Delete</button>
                            </div>
                        </div>
                        <div class="counter-controls">
                            <button class="counter-btn decrement">-</button>
                            <span class="counter-value">${counter.value}</span>
                            <button class="counter-btn increment">+</button>
                        </div>
                    </div>
                `).join('') : ''}
            </div>
            <button class="add-counter-btn">Add Counter</button>
        `;
        
        const toggleContent = toggleElement.querySelector('.toggle-content');
        const toggleCollapseBtn = toggleElement.querySelector('.toggle-collapse-btn');
        const addCounterBtn = toggleElement.querySelector('.add-counter-btn');
        
        // Toggle collapse/expand
        toggleCollapseBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggle.collapsed = !toggle.collapsed;
            toggleContent.style.display = toggle.collapsed ? 'none' : '';
            toggleCollapseBtn.textContent = toggle.collapsed ? '▶' : '▼';
            saveItems(items);
        });
        
        // Double-click to rename toggle
        const nameElement = toggleElement.querySelector('.item-name');
        nameElement.addEventListener('dblclick', function() {
            renameItem(nameElement, toggle);
        });
        
        // Delete toggle
        toggleElement.querySelector('.delete-btn').addEventListener('click', function() {
            if (confirm('Are you sure you want to delete this toggle and all its counters?')) {
                // Remove all child counters from main items array
                items = items.filter(item => 
                    !(item.parentId === toggle.id) && item.id !== toggle.id
                );
                saveItems(items);
                renderAllItems();
            }
        });
        
        // Add counter to toggle
        addCounterBtn.addEventListener('click', function() {
            const counterName = prompt('Enter counter name:');
            if (counterName) {
                const newCounter = {
                    id: Date.now().toString(),
                    type: 'counter',
                    name: counterName,
                    value: 0,
                    parentId: toggle.id
                };
                
                // Add to main items array
                items.push(newCounter);
                
                // Add to toggle's counters array if it exists
                if (!toggle.counters) {
                    toggle.counters = [];
                }
                toggle.counters.push(newCounter);
                
                saveItems(items);
                renderAllItems();
            }
        });
        
        // Setup event listeners for counters inside toggle
        if (toggle.counters) {
            toggleElement.querySelectorAll('.counter').forEach(counterElement => {
                setupCounterEvents(counterElement);
            });
        }
        
        itemsContainer.appendChild(toggleElement);
    }
    
    // Render a standalone counter
    function renderCounter(counter) {
        const counterElement = document.createElement('div');
        counterElement.className = 'item counter';
        counterElement.dataset.id = counter.id;
        
        counterElement.innerHTML = `
            <div class="item-header">
                <span class="item-name">${counter.name}</span>
                <div class="item-actions">
                    <button class="delete-btn">Delete</button>
                </div>
            </div>
            <div class="counter-controls">
                <button class="counter-btn decrement">-</button>
                <span class="counter-value">${counter.value}</span>
                <button class="counter-btn increment">+</button>
            </div>
        `;
        
        setupCounterEvents(counterElement);
        itemsContainer.appendChild(counterElement);
    }
    
    // Setup event listeners for a counter
    function setupCounterEvents(counterElement) {
        const counterId = counterElement.dataset.id;
        const counter = items.find(item => item.id === counterId);
        if (!counter) return;
        
        // Counter controls
        const valueElement = counterElement.querySelector('.counter-value');
        const decrementBtn = counterElement.querySelector('.decrement');
        const incrementBtn = counterElement.querySelector('.increment');
        
        decrementBtn.addEventListener('click', function() {
            counter.value--;
            valueElement.textContent = counter.value;
            saveItems(items);
        });
        
        incrementBtn.addEventListener('click', function() {
            counter.value++;
            valueElement.textContent = counter.value;
            saveItems(items);
        });
        
        // Double-click to rename counter
        const nameElement = counterElement.querySelector('.item-name');
        nameElement.addEventListener('dblclick', function() {
            renameItem(nameElement, counter);
        });
        
        // Delete counter
        counterElement.querySelector('.delete-btn').addEventListener('click', function() {
            if (confirm('Are you sure you want to delete this counter?')) {
                // If it's inside a toggle, remove from parent's counters
                if (counter.parentId) {
                    const parentToggle = items.find(item => item.id === counter.parentId);
                    if (parentToggle && parentToggle.counters) {
                        parentToggle.counters = parentToggle.counters.filter(c => c.id !== counter.id);
                    }
                }
                // Remove from main items array
                items = items.filter(item => item.id !== counter.id);
                saveItems(items);
                renderAllItems();
            }
        });
    }
    
    // Rename an item (toggle or counter)
    function renameItem(nameElement, item) {
        const currentName = nameElement.textContent;
        nameElement.innerHTML = `<input type="text" class="edit-input" value="${currentName}">`;
        const input = nameElement.querySelector('input');
        input.focus();
        
        const finishEditing = function() {
            item.name = input.value;
            nameElement.textContent = item.name;
            saveItems(items);
        };
        
        input.addEventListener('blur', finishEditing);
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                finishEditing();
            }
        });
    }
    
    // Create new toggle
    createToggleBtn.addEventListener('click', function() {
        const name = itemNameInput.value.trim();
        if (name) {
            items.push({
                id: Date.now().toString(),
                type: 'toggle',
                name,
                collapsed: false,
                counters: []
            });
            saveItems(items);
            renderAllItems();
            itemNameInput.value = '';
        }
    });
    
    // Create new standalone counter
    createCounterBtn.addEventListener('click', function() {
        const name = itemNameInput.value.trim();
        if (name) {
            items.push({
                id: Date.now().toString(),
                type: 'counter',
                name,
                value: 0
            });
            saveItems(items);
            renderAllItems();
            itemNameInput.value = '';
        }
    });
    
    // Initial render
    renderAllItems();
});