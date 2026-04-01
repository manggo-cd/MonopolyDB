const express = require('express');
const appService = require('./appService');

const router = express.Router();

// ----------------------------------------------------------
// API endpoints
// Modify or extend these routes based on your project's needs.
router.get('/check-db-connection', async (req, res) => {
    const isConnect = await appService.testOracleConnection();
    if (isConnect) {
        res.send('connected');
    } else {
        res.send('unable to connect');
    }
});

router.get('/demotable', async (req, res) => {
    const tableContent = await appService.fetchDemotableFromDb();
    res.json({ data: tableContent });
});

router.post("/initiate-demotable", async (req, res) => {
    const initiateResult = await appService.initiateDemotable();
    if (initiateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.post("/insert-demotable", async (req, res) => {
    const { id, name } = req.body;
    const insertResult = await appService.insertDemotable(id, name);
    if (insertResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.post("/update-name-demotable", async (req, res) => {
    const { oldName, newName } = req.body;
    const updateResult = await appService.updateNameDemotable(oldName, newName);
    if (updateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

// Query 1: Insert Player
router.post("/insert-player", async (req, res) => {
    const { name, balance, position } = req.body;

    const insertResult = await appService.insertPlayer(name, balance, position);

    if (insertResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

// Query 2: Update Player
router.post("/update-player", async (req, res) => {
    const { player_id, name, balance, position } = req.body;

    const updateResult = await appService.updatePlayer(player_id, name, balance, position);

    if (updateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

// Query 3: Delete Player
router.get('/players', async (req, res) => {
    const players = await appService.fetchPlayers();
    res.json({ data: players });
});

router.delete('/players/:id', async (req, res) => {
    const playerId = parseInt(req.params.id);
    if (isNaN(playerId)) {
        return res.status(400).json({ success: false, message: 'Invalid player ID' });
    }
    const deleted = await appService.deletePlayer(playerId);
    if (deleted) {
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false, message: 'Player not found or could not be deleted.' });
    }
});

// Query 7: group by
router.get('/players/property-stats', async (req, res) => {
    const stats = await appService.getPlayerPropertyStats();
    res.json({ data: stats });
});

// Query 8: aggregation with HAVING
router.get('/games/turns-summary', async (req, res) => {
    const turns = await appService.getGamesWithMultipleTurns();
    res.json({ data: turns });
});

// Query 4: Select Player
router.post('/players/select', async (req, res) => {
    const { conditions } = req.body;
    const players = await appService.selectPlayers(conditions);
    res.json({ success: true, data: players });
});

router.get('/count-demotable', async (req, res) => {
    const tableCount = await appService.countDemotable();
    if (tableCount >= 0) {
        res.json({
            success: true,
            count: tableCount
        });
    } else {
        res.status(500).json({
            success: false,
            count: tableCount
        });
    }
});


module.exports = router;