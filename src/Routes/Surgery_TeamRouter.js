const express = require('express');
const router = express.Router();
const {
    getAllSurgeryTeams,
    getSurgeryTeam,
    createSurgeryTeam,
    updateSurgeryTeam,
    deleteSurgeryTeam
} = require('../Controllers/Surgery_Team');

router.get('/surgery-team', getAllSurgeryTeams);
router.get('/surgery-team/:surgery_team_id', getSurgeryTeam);
router.post('/surgery-team', createSurgeryTeam);
router.put('/surgery-team/:surgery_team_id', updateSurgeryTeam);
router.delete('/surgery-team/:surgery_team_id', deleteSurgeryTeam);

module.exports = router;
