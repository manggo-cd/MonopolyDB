/*
 * These functions below are for various webpage functionalities. 
 * Each function serves to process data on the frontend:
 *      - Before sending requests to the backend.
 *      - After receiving responses from the backend.
 * 
 * To tailor them to your specific needs,
 * adjust or expand these functions to match both your 
 *   backend endpoints 
 * and 
 *   HTML structure.
 * 
 */


// This function checks the database connection and updates its status on the frontend.
async function checkDbConnection() {
    const statusElem = document.getElementById('dbStatus');
    const loadingGifElem = document.getElementById('loadingGif');

    const response = await fetch('/check-db-connection', {
        method: "GET"
    });

    // Hide the loading GIF once the response is received.
    loadingGifElem.style.display = 'none';
    // Display the statusElem's text in the placeholder.
    statusElem.style.display = 'inline';

    response.text()
    .then((text) => {
        statusElem.textContent = text;
    })
    .catch((error) => {
        statusElem.textContent = 'connection timed out';  // Adjust error handling if required.
    });
}

// Fetches data from the demotable and displays it.
async function fetchAndDisplayUsers() {
    const tableElement = document.getElementById('demotable');
    const tableBody = tableElement.querySelector('tbody');

    const response = await fetch('/demotable', {
        method: 'GET'
    });

    const responseData = await response.json();
    const demotableContent = responseData.data;

    // Always clear old, already fetched data before new fetching process.
    if (tableBody) {
        tableBody.innerHTML = '';
    }

    demotableContent.forEach(user => {
        const row = tableBody.insertRow();
        user.forEach((field, index) => {
            const cell = row.insertCell(index);
            cell.textContent = field;
        });
    });
}

// This function resets or initializes the demotable.
async function resetDemotable() {
    const response = await fetch("/initiate-demotable", {
        method: 'POST'
    });
    const responseData = await response.json();

    if (responseData.success) {
        const messageElement = document.getElementById('resetResultMsg');
        messageElement.textContent = "demotable initiated successfully!";
        fetchTableData();
    } else {
        alert("Error initiating table!");
    }
}

// Inserts new records into the demotable.
async function insertDemotable(event) {
    event.preventDefault();

    const idValue = document.getElementById('insertId').value;
    const nameValue = document.getElementById('insertName').value;

    const response = await fetch('/insert-demotable', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: idValue,
            name: nameValue
        })
    });

    const responseData = await response.json();
    const messageElement = document.getElementById('insertResultMsg');

    if (responseData.success) {
        messageElement.textContent = "Data inserted successfully!";
        fetchTableData();
    } else {
        messageElement.textContent = "Error inserting data!";
    }
}

// Updates names in the demotable.
async function updateNameDemotable(event) {
    event.preventDefault();

    const oldNameValue = document.getElementById('updateOldName').value;
    const newNameValue = document.getElementById('updateNewName').value;

    const response = await fetch('/update-name-demotable', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            oldName: oldNameValue,
            newName: newNameValue
        })
    });

    const responseData = await response.json();
    const messageElement = document.getElementById('updateNameResultMsg');

    if (responseData.success) {
        messageElement.textContent = "Name updated successfully!";
        fetchTableData();
    } else {
        messageElement.textContent = "Error updating name!";
    }
}

// Counts rows in the demotable.
// Modify the function accordingly if using different aggregate functions or procedures.
async function countDemotable() {
    const response = await fetch("/count-demotable", {
        method: 'GET'
    });

    const responseData = await response.json();
    const messageElement = document.getElementById('countResultMsg');

    if (responseData.success) {
        const tupleCount = responseData.count;
        messageElement.textContent = `The number of tuples in demotable: ${tupleCount}`;
    } else {
        alert("Error in count demotable!");
    }
}


// --------------- Query 5: Projection ---------------

const projectionColumns = [];

function toggleProjectionColumn(checkbox) {
    const col = checkbox.value;
    if (checkbox.checked) {
        projectionColumns.push(col);
    } else {
        const idx = projectionColumns.indexOf(col);
        if (idx > -1) projectionColumns.splice(idx, 1);
    }
    renderProjectionOrder();
}

function swapProjectionColumns(from, to) {
    const temp = projectionColumns[from];
    projectionColumns[from] = projectionColumns[to];
    projectionColumns[to] = temp;
    renderProjectionOrder();
}

function renderProjectionOrder() {
    const container = document.getElementById('projectionColumnOrder');
    container.innerHTML = '';

    if (projectionColumns.length === 0) {
        container.textContent = 'No columns selected.';
        return;
    }

    projectionColumns.forEach((col, i) => {
        const item = document.createElement('div');
        item.style.display = 'inline-flex';
        item.style.alignItems = 'center';
        item.style.gap = '4px';
        item.style.marginBottom = '4px';

        const label = document.createElement('span');
        label.textContent = `${i + 1}. ${col.charAt(0).toUpperCase() + col.slice(1)}`;
        item.appendChild(label);

        if (i > 0) {
            const up = document.createElement('button');
            up.textContent = '\u25B2';
            up.type = 'button';
            up.addEventListener('click', () => swapProjectionColumns(i, i - 1));
            item.appendChild(up);
        }
        if (i < projectionColumns.length - 1) {
            const down = document.createElement('button');
            down.textContent = '\u25BC';
            down.type = 'button';
            down.addEventListener('click', () => swapProjectionColumns(i, i + 1));
            item.appendChild(down);
        }

        container.appendChild(item);
        container.appendChild(document.createTextNode('  '));
    });
}

async function fetchBoardPositions() {
    const msgEl = document.getElementById('projectionMsg');
    const thead = document.querySelector('#projectionResult thead tr');
    const tbody = document.querySelector('#projectionResult tbody');
    msgEl.textContent = '';
    thead.innerHTML = '';
    tbody.innerHTML = '';

    if (projectionColumns.length === 0) {
        msgEl.textContent = 'Please select at least one column.';
        return;
    }

    const params = projectionColumns.map(c => `columns=${encodeURIComponent(c)}`).join('&');
    const response = await fetch(`/board-positions?${params}`);
    const body = await response.json();

    if (!body.success) {
        msgEl.textContent = body.message || 'Failed to load board positions.';
        return;
    }

    if (body.data.rows.length === 0) {
        msgEl.textContent = 'No results found.';
        return;
    }

    body.data.columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col.charAt(0).toUpperCase() + col.slice(1);
        thead.appendChild(th);
    });

    body.data.rows.forEach(row => {
        const tr = tbody.insertRow();
        row.forEach((val, idx) => {
            tr.insertCell(idx).textContent = val !== null ? val : '';
        });
    });
}


// --------------- Query 6: Join ---------------

async function loadColourOptions() {
    const select = document.getElementById('colourSelect');
    const response = await fetch('/colours');
    const body = await response.json();
    body.data.forEach(row => {
        const option = document.createElement('option');
        option.value = row[0];
        option.textContent = row[0];
        select.appendChild(option);
    });
}

async function fetchPlayerProperties() {
    const colour = document.getElementById('colourSelect').value;
    const msgEl = document.getElementById('joinMsg');
    const tbody = document.querySelector('#joinResult tbody');
    msgEl.textContent = '';
    tbody.innerHTML = '';

    if (!colour) {
        msgEl.textContent = 'Please select a colour.';
        return;
    }

    const response = await fetch(`/player-properties?colour=${encodeURIComponent(colour)}`);
    const body = await response.json();

    if (!body.success) {
        msgEl.textContent = body.message || 'Failed to load property data.';
        return;
    }

    if (body.data.length === 0) {
        msgEl.textContent = 'No properties found for this colour.';
        return;
    }

    body.data.forEach(row => {
        const tr = tbody.insertRow();
        row.forEach((val, idx) => {
            tr.insertCell(idx).textContent = val;
        });
    });
}


// --------------- Query 9: Nested Aggregation ---------------

async function fetchHighestAvgRoll() {
    const msgEl = document.getElementById('nestedAggMsg');
    const tbody = document.querySelector('#nestedAggResult tbody');
    msgEl.textContent = '';
    tbody.innerHTML = '';

    const response = await fetch('/highest-avg-roll');
    const body = await response.json();

    if (!body.success || body.data.length === 0) {
        msgEl.textContent = 'No turn data available.';
        return;
    }

    body.data.forEach(row => {
        const tr = tbody.insertRow();
        tr.insertCell(0).textContent = row[0];
        tr.insertCell(1).textContent = row[1];
    });
}


// --------------- Query 10: Division ---------------

async function fetchPlayersAllColours() {
    const msgEl = document.getElementById('divisionMsg');
    const tbody = document.querySelector('#divisionResult tbody');
    msgEl.textContent = '';
    tbody.innerHTML = '';

    const response = await fetch('/players-all-colours');
    const body = await response.json();

    if (!body.success || body.data.length === 0) {
        msgEl.textContent = 'No player owns properties in every colour group.';
        return;
    }

    body.data.forEach(row => {
        const tr = tbody.insertRow();
        tr.insertCell(0).textContent = row[0];
        tr.insertCell(1).textContent = row[1];
    });
}


// ---------------------------------------------------------------

window.onload = function() {
    checkDbConnection();
    fetchTableData();
    loadColourOptions();
    renderProjectionOrder();
    document.getElementById("resetDemotable").addEventListener("click", resetDemotable);
    document.getElementById("insertDemotable").addEventListener("submit", insertDemotable);
    document.getElementById("updataNameDemotable").addEventListener("submit", updateNameDemotable);
    document.getElementById("countDemotable").addEventListener("click", countDemotable);
    document.getElementById("projectionViewBtn").addEventListener("click", fetchBoardPositions);
    document.getElementById("joinSearchBtn").addEventListener("click", fetchPlayerProperties);
    document.getElementById("nestedAggBtn").addEventListener("click", fetchHighestAvgRoll);
    document.getElementById("divisionBtn").addEventListener("click", fetchPlayersAllColours);
};

function fetchTableData() {
    fetchAndDisplayUsers();
}
