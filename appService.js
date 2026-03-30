const oracledb = require('oracledb');
const loadEnvFile = require('./utils/envUtil');

const envVariables = loadEnvFile('./.env');

// Database configuration setup. Ensure your .env file has the required database credentials.
const dbConfig = {
    user: envVariables.ORACLE_USER,
    password: envVariables.ORACLE_PASS,
    connectString: `${envVariables.ORACLE_HOST}:${envVariables.ORACLE_PORT}/${envVariables.ORACLE_DBNAME}`,
    poolMin: 1,
    poolMax: 3,
    poolIncrement: 1,
    poolTimeout: 60
};

// initialize connection pool
async function initializeConnectionPool() {
    try {
        await oracledb.createPool(dbConfig);
        console.log('Connection pool started');
    } catch (err) {
        console.error('Initialization error: ' + err.message);
    }
}

async function closePoolAndExit() {
    console.log('\nTerminating');
    try {
        await oracledb.getPool().close(10); // 10 seconds grace period for connections to finish
        console.log('Pool closed');
        process.exit(0);
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}

initializeConnectionPool();

process
    .once('SIGTERM', closePoolAndExit)
    .once('SIGINT', closePoolAndExit);


// ----------------------------------------------------------
// Wrapper to manage OracleDB actions, simplifying connection handling.
async function withOracleDB(action) {
    let connection;
    try {
        connection = await oracledb.getConnection(); // Gets a connection from the default pool 
        return await action(connection);
    } catch (err) {
        console.error(err);
        throw err;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
}


// ----------------------------------------------------------
// Core functions for database operations
// Modify these functions, especially the SQL queries, based on your project's requirements and design.
async function testOracleConnection() {
    return await withOracleDB(async (connection) => {
        return true;
    }).catch(() => {
        return false;
    });
}

async function fetchDemotableFromDb() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute('SELECT * FROM DEMOTABLE');
        return result.rows;
    }).catch(() => {
        return [];
    });
}

async function initiateDemotable() {
    return await withOracleDB(async (connection) => {
        try {
            await connection.execute(`DROP TABLE DEMOTABLE`);
        } catch(err) {
            console.log('Table might not exist, proceeding to create...');
        }

        const result = await connection.execute(`
            CREATE TABLE DEMOTABLE (
                id NUMBER PRIMARY KEY,
                name VARCHAR2(20)
            )
        `);
        return true;
    }).catch(() => {
        return false;
    });
}

async function insertDemotable(id, name) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `INSERT INTO DEMOTABLE (id, name) VALUES (:id, :name)`,
            [id, name],
            { autoCommit: true }
        );

        return result.rowsAffected && result.rowsAffected > 0;
    }).catch(() => {
        return false;
    });
}

async function updateNameDemotable(oldName, newName) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `UPDATE DEMOTABLE SET name=:newName where name=:oldName`,
            [newName, oldName],
            { autoCommit: true }
        );

        return result.rowsAffected && result.rowsAffected > 0;
    }).catch(() => {
        return false;
    });
}

async function countDemotable() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute('SELECT Count(*) FROM DEMOTABLE');
        return result.rows[0][0];
    }).catch(() => {
        return -1;
    });
}


// --------------- Query 5: Projection on Board_Position ---------------

async function projectBoardPositions(columns) {
    return await withOracleDB(async (connection) => {
        const allowed = ['position', 'name', 'icon'];
        const safe = columns.filter(c => allowed.includes(c));
        if (safe.length === 0) return { columns: [], rows: [] };

        const query = `SELECT ${safe.join(', ')} FROM Board_Position ORDER BY position`;
        const result = await connection.execute(query);
        return { columns: safe, rows: result.rows };
    }).catch(() => {
        return { columns: [], rows: [] };
    });
}


// --------------- Query 6: Join (Player + Owns + Property + ColourRent) ---------------

async function fetchColours() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            'SELECT colour FROM ColourRent ORDER BY colour'
        );
        return result.rows;
    }).catch(() => {
        return [];
    });
}

async function fetchPlayerPropertiesByColour(colour) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `SELECT p.name, pr.property_id, pr.colour, pr.cost, cr.rent
             FROM Player p
             JOIN Owns o ON p.player_id = o.player_id
             JOIN Property pr ON o.property_id = pr.property_id
             JOIN ColourRent cr ON pr.colour = cr.colour
             WHERE cr.colour = :colour
             ORDER BY p.name, pr.property_id`,
            [colour]
        );
        return result.rows;
    }).catch(() => {
        return [];
    });
}


// --------------- Query 9: Nested Aggregation with GROUP BY ---------------

async function fetchGameWithHighestAvgRoll() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `SELECT t.game_id, ROUND(AVG(t.dice_roll), 2) AS avg_roll
             FROM Turn t
             GROUP BY t.game_id
             HAVING AVG(t.dice_roll) >= ALL (
                 SELECT AVG(t2.dice_roll)
                 FROM Turn t2
                 GROUP BY t2.game_id
             )`
        );
        return result.rows;
    }).catch(() => {
        return [];
    });
}


// --------------- Query 10: Division ---------------

async function fetchPlayersOwningAllColours() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `SELECT p.player_id, p.name
             FROM Player p
             WHERE NOT EXISTS (
                 SELECT cr.colour
                 FROM ColourRent cr
                 WHERE cr.colour IN (SELECT colour FROM Property)
                 MINUS
                 SELECT pr.colour
                 FROM Owns o
                 JOIN Property pr ON o.property_id = pr.property_id
                 WHERE o.player_id = p.player_id
             )`
        );
        return result.rows;
    }).catch(() => {
        return [];
    });
}


module.exports = {
    testOracleConnection,
    fetchDemotableFromDb,
    initiateDemotable,
    insertDemotable,
    updateNameDemotable,
    countDemotable,
    projectBoardPositions,
    fetchColours,
    fetchPlayerPropertiesByColour,
    fetchGameWithHighestAvgRoll,
    fetchPlayersOwningAllColours
};