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
    res.json({data: tableContent});
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


// Q5: projection

router.get('/board-positions', async (req, res) => {
    const columns = req.query.columns;
    if (!columns) {
        return res.status(400).json({ success: false, message: 'No columns selected.' });
    }
    const colArray = Array.isArray(columns) ? columns : [columns];
    const result = await appService.projectBoardPositions(colArray);
    res.json({ success: true, data: result });
});


// Q6: join

router.get('/colours', async (req, res) => {
    const colours = await appService.fetchColours();
    res.json({ data: colours });
});

router.get('/player-properties', async (req, res) => {
    const { colour } = req.query;
    if (!colour) {
        return res.status(400).json({ success: false, message: 'Colour is required.' });
    }
    const rows = await appService.fetchPlayerPropertiesByColour(colour);
    res.json({ success: true, data: rows });
});


// Q9: nested aggregation

router.get('/highest-avg-roll', async (req, res) => {
    const rows = await appService.fetchGameWithHighestAvgRoll();
    res.json({ success: true, data: rows });
});


// Q10: division

router.get('/players-all-colours', async (req, res) => {
    const rows = await appService.fetchPlayersOwningAllColours();
    res.json({ success: true, data: rows });
});


module.exports = router;