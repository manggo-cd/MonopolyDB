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
            statusElem.textContent = 'connection timed out';
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

async function fetchAndDisplayPlayers() {
    const tableElement = document.getElementById('playerTable');
    const tableBody = tableElement.querySelector('tbody');
    
    const response = await fetch('/players', {
        method: 'GET'
    });

    const responseData = await response.json();
    const players = responseData.data;

    tableBody.innerHTML = '';

    players.forEach(player => {
        const row = tableBody.insertRow();

        row.insertCell(0).textContent = player[0];
        row.insertCell(1).textContent = player[1];
        row.insertCell(2).textContent = player[2];
        row.insertCell(3).textContent = player[3];

        const actionCell = row.insertCell(4);
        const btn = document.createElement('button');
        btn.textContent = 'Delete';
        btn.addEventListener('click', () => deletePlayer(player[0], player[1]));
        actionCell.appendChild(btn);
    });
}

// Q1: insert player
async function insertPlayer(event) {
    event.preventDefault();

    const nameValue = document.querySelector('input[name="name"]').value;
    const balanceValue = document.querySelector('input[name="balance"]').value;
    const positionValue = document.querySelector('input[name="position"]').value;

    const response = await fetch('/insert-player', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: nameValue,
            balance: balanceValue,
            position: positionValue
        })
    });

    const responseData = await response.json();
    const messageElement = document.getElementById('insertResultMsg');

    if (responseData.success) {
        messageElement.textContent = "Player inserted successfully!";
        fetchAndDisplayPlayers();
    } else {
        messageElement.textContent = "Error inserting player!";
    }
}

// Q2: update player
async function updatePlayer(event) {
    event.preventDefault();

    const idValue = document.querySelector('input[name="player_id"]').value;
    const nameValue = document.querySelector('#updatePlayerForm input[name="name"]').value;
    const balanceValue = document.querySelector('#updatePlayerForm input[name="balance"]').value;
    const positionValue = document.querySelector('#updatePlayerForm input[name="position"]').value;

    const response = await fetch('/update-player', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            player_id: idValue,
            name: nameValue,
            balance: balanceValue,
            position: positionValue
        })
    });

    const responseData = await response.json();
    const messageElement = document.getElementById('updateResultMsg');

    if (responseData.success) {
        messageElement.textContent = "Player updated successfully!";
        fetchAndDisplayPlayers();
    } else {
        messageElement.textContent = "Error updating player!";
    }
}

// Q3: delete player
async function deletePlayer(playerId, playerName) {
    const msgElement = document.getElementById('deletePlayerMsg');
    if (!confirm(`Delete player "${playerName}" (ID: ${playerId})? This will also remove their game history, turns, and owned properties.`)) {
        return;
    }
    const response = await fetch(`/players/${playerId}`, { method: 'DELETE' });
    const responseData = await response.json();
    if (responseData.success) {
        msgElement.textContent = `Player "${playerName}" deleted successfully.`;
        fetchAndDisplayPlayers();
    } else {
        msgElement.textContent = responseData.message || 'Error deleting player.';
    }
}

// Q4: selection on Player
async function showAllSelectionPlayers() {
    const tableBody = document.querySelector('#selectionTable tbody');
    const msgElement = document.getElementById('selectionMsg');

    const response = await fetch('/players/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conditions: [] })
    });
    const responseData = await response.json();

    tableBody.innerHTML = '';
    if (responseData.success) {
        msgElement.textContent = 'Showing all ' + responseData.data.length + ' player(s).';
        responseData.data.forEach(player => {
            const row = tableBody.insertRow();
            row.insertCell(0).textContent = player[0];
            row.insertCell(1).textContent = player[1];
            row.insertCell(2).textContent = player[2];
            row.insertCell(3).textContent = player[3];
        });
    } else {
        msgElement.textContent = 'Error fetching players.';
    }
}

async function searchPlayers() {
    const tableBody = document.querySelector('#selectionTable tbody');
    const msgElement = document.getElementById('selectionMsg');

    const rows = document.querySelectorAll('#conditionsContainer .condition-row');
    const conditions = [];
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const connector = row.querySelector('.condition-connector').value;
        const field = row.querySelector('.condition-field').value;
        const operator = row.querySelector('.condition-op').value;
        const value = row.querySelector('.condition-value').value;

        if (value === '') {
            msgElement.textContent = 'Please fill in all condition values.';
            return;
        }

        conditions.push({ connector, field, operator, value });
    }

    const response = await fetch('/players/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conditions })
    });
    const responseData = await response.json();

    tableBody.innerHTML = '';
    if (responseData.success) {
        msgElement.textContent = 'Found ' + responseData.data.length + ' player(s).';
        responseData.data.forEach(player => {
            const row = tableBody.insertRow();
            row.insertCell(0).textContent = player[0];
            row.insertCell(1).textContent = player[1];
            row.insertCell(2).textContent = player[2];
            row.insertCell(3).textContent = player[3];
        });
    } else {
        msgElement.textContent = 'Error fetching players.';
    }
}

function addCondition() {
    const container = document.getElementById('conditionsContainer');

    const row = document.createElement('div');
    row.className = 'condition-row';

    const connector = document.createElement('select');
    connector.className = 'condition-connector';
    connector.innerHTML = '<option value="AND">AND</option><option value="OR">OR</option>';

    const fieldSelect = document.createElement('select');
    fieldSelect.className = 'condition-field';
    fieldSelect.innerHTML = `
        <option value="player_id">Player ID</option>
        <option value="name">Name</option>
        <option value="balance">Balance</option>
        <option value="position">Board Position</option>
    `;

    const opSelect = document.createElement('select');
    opSelect.className = 'condition-op';
    opSelect.innerHTML = `
        <option value="=">=</option>
        <option value="!=">!=</option>
        <option value="<"><</option>
        <option value=">">></option>
        <option value="<="><=</option>
        <option value=">=">>=</option>
    `;

    const valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.className = 'condition-value';
    valueInput.placeholder = 'value';

    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => row.remove());

    row.appendChild(connector);
    row.appendChild(fieldSelect);
    row.appendChild(opSelect);
    row.appendChild(valueInput);
    row.appendChild(removeBtn);

    container.appendChild(row);
}

function hideSelectionPlayers() {
    document.querySelector('#selectionTable tbody').innerHTML = '';
    document.getElementById('selectionMsg').textContent = '';
}

// Q5: projection
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

// Q6: join
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

// Q7: group by
async function fetchAndDisplayPropertyStats() {
    const tableBody = document.querySelector('#propertyStatsTable tbody');

    const response = await fetch('/players/property-stats', {
        method: 'GET'
    });
    const responseData = await response.json();

    tableBody.innerHTML = '';
    responseData.data.forEach(row => {
        const tr = tableBody.insertRow();
        tr.insertCell(0).textContent = row[0];
        tr.insertCell(1).textContent = row[1];
        tr.insertCell(2).textContent = row[2];
        tr.insertCell(3).textContent = row[3];
    });
}

function hidePropertyStats() {
    document.querySelector('#propertyStatsTable tbody').innerHTML = '';
}

// Q8: aggregation with HAVING
async function fetchAndDisplayTurnSummary() {
    const tableBody = document.querySelector('#turnSummaryTable tbody');

    const response = await fetch('/games/turns-summary', {
        method: 'GET'
    });
    const responseData = await response.json();

    tableBody.innerHTML = '';
    responseData.data.forEach(row => {
        const tr = tableBody.insertRow();
        tr.insertCell(0).textContent = row[0];
        tr.insertCell(1).textContent = row[1];
        tr.insertCell(2).textContent = row[2];
    });
}

function hideTurnSummary() {
    document.querySelector('#turnSummaryTable tbody').innerHTML = '';
}

// Q9: nested aggregation
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

// Q10: division
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

window.onload = function () {
    checkDbConnection();

    if (document.getElementById('demotable')) fetchTableData();
    if (document.getElementById('playerTable')) fetchAndDisplayPlayers();
    if (document.getElementById('colourSelect')) loadColourOptions();
    if (document.getElementById('projectionColumnOrder')) renderProjectionOrder();

    document.getElementById("resetDemotable")?.addEventListener("click", resetDemotable);
    document.getElementById("insertDemotable")?.addEventListener("submit", insertDemotable);
    document.getElementById("updataNameDemotable")?.addEventListener("submit", updateNameDemotable);
    document.getElementById("countDemotable")?.addEventListener("click", countDemotable);

    document.getElementById("playerForm")?.addEventListener("submit", insertPlayer);
    document.getElementById("updatePlayerForm")?.addEventListener("submit", updatePlayer);

    document.getElementById("showAllPlayersBtn")?.addEventListener("click", showAllSelectionPlayers);
    document.getElementById("hideAllPlayersBtn")?.addEventListener("click", hideSelectionPlayers);
    document.getElementById("addConditionBtn")?.addEventListener("click", addCondition);
    document.getElementById("searchPlayersBtn")?.addEventListener("click", searchPlayers);

    document.getElementById("projectionViewBtn")?.addEventListener("click", fetchBoardPositions);
    document.getElementById("joinSearchBtn")?.addEventListener("click", fetchPlayerProperties);

    document.getElementById("showPropertyStatsBtn")?.addEventListener("click", fetchAndDisplayPropertyStats);
    document.getElementById("hidePropertyStatsBtn")?.addEventListener("click", hidePropertyStats);
    document.getElementById("showTurnSummaryBtn")?.addEventListener("click", fetchAndDisplayTurnSummary);
    document.getElementById("hideTurnSummaryBtn")?.addEventListener("click", hideTurnSummary);

    document.getElementById("nestedAggBtn")?.addEventListener("click", fetchHighestAvgRoll);
    document.getElementById("divisionBtn")?.addEventListener("click", fetchPlayersAllColours);
};

function fetchTableData() {
    fetchAndDisplayUsers();
}
