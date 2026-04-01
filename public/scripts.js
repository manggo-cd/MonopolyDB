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


// Query 4: selection on Player
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

// search players with whatever conditions the user added
async function searchPlayers() {
    const tableBody = document.querySelector('#selectionTable tbody');
    const msgElement = document.getElementById('selectionMsg');

    //grab all the condition rows
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

// adds a condition row when user clicks + Add Condition
function addCondition() {
    const container = document.getElementById('conditionsContainer');

    const row = document.createElement('div');
    row.className = 'condition-row';

    // AND or OR
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

// Query 7: group by - show property stats per player
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

// Query 3: delete player
async function fetchAndDisplayPlayers() {
    const tableBody = document.querySelector('#playerTable tbody');
    const response = await fetch('/players', {
        method: 'GET'
    });
    const responseData = await response.json();

    tableBody.innerHTML = '';
    responseData.data.forEach(player => {
        const [player_id, name, balance, position] = player;
        const row = tableBody.insertRow();
        row.insertCell(0).textContent = player_id;
        row.insertCell(1).textContent = name;
        row.insertCell(2).textContent = balance;
        row.insertCell(3).textContent = position;
        const actionCell = row.insertCell(4);
        const btn = document.createElement('button');
        btn.textContent = 'Delete';
        btn.addEventListener('click', () => deletePlayer(player_id, name));
        actionCell.appendChild(btn);
    });
}

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

// ---------------------------------------------------------------
// Initializes the webpage functionalities.
// Add or remove event listeners based on the desired functionalities.
window.onload = function () {
    checkDbConnection();
    fetchTableData();
    fetchAndDisplayPlayers();
    document.getElementById("resetDemotable").addEventListener("click", resetDemotable);
    document.getElementById("insertDemotable").addEventListener("submit", insertDemotable);
    document.getElementById("updataNameDemotable").addEventListener("submit", updateNameDemotable);
    document.getElementById("countDemotable").addEventListener("click", countDemotable);
    document.getElementById("showAllPlayersBtn").addEventListener("click", showAllSelectionPlayers);
    document.getElementById("hideAllPlayersBtn").addEventListener("click", hideSelectionPlayers);
    document.getElementById("addConditionBtn").addEventListener("click", addCondition);
    document.getElementById("searchPlayersBtn").addEventListener("click", searchPlayers);
    document.getElementById("showPropertyStatsBtn").addEventListener("click", fetchAndDisplayPropertyStats);
    document.getElementById("hidePropertyStatsBtn").addEventListener("click", hidePropertyStats);
};

// General function to refresh the displayed table data. 
// You can invoke this after any table-modifying operation to keep consistency.
function fetchTableData() {
    fetchAndDisplayUsers();
}
