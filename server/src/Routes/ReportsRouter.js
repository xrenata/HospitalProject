const express = require('express');
const router = express.Router();
const engine = require('../Controllers/ReportEngine');
const { GeneratedReport, Staff } = require('../Modules/Database/models');
const { can } = require('../Modules/Functions/access');

const parseDay = (value, endOfDay) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    if (endOfDay) d.setHours(23, 59, 59, 999); else d.setHours(0, 0, 0, 0);

    return d;
};

// Templates the signed-in user may run (each needs the permission of the data it reads)
router.get('/templates', (req, res) => {
    res.json({ success: true, data: engine.templates().map((t) => ({ ...t, allowed: can(req.access, t.needs) })) });
});

// Run a template; add { save: true } to keep the result in the history
router.post('/run', async (req, res) => {
    try {
        const { template, startDate, endDate, lang = 'en', save = false } = req.body || {};
        const def = engine.templates().find((t) => t.id === template);
        if (!def) return res.status(400).json({ success: false, error: 'Unknown report template' });
        if (!can(req.access, def.needs)) return res.status(403).json({ success: false, error: 'Insufficient permissions', required: def.needs });

        const to = parseDay(endDate || new Date(), true);
        const from = parseDay(startDate || new Date(Date.now() - 29 * 86400000), false);
        if (!from || !to || from > to) return res.status(400).json({ success: false, error: 'Invalid date range' });
        if (to - from > 800 * 86400000) return res.status(400).json({ success: false, error: 'The period is too long (max ~2 years)' });

        const result = await engine.run(template, { from, to, lang });
        let id = null;
        if (save) {
            const me = await Staff.findById(req.user.id).select('name').lean();
            const doc = await GeneratedReport.create({ template, from, to, lang, generatedBy: req.user.id, generatedByName: me?.name, result });
            id = doc._id;
        }

        res.json({ success: true, data: { ...result, id } });
    } catch (error) {
        console.error('Report error:', error);
        res.status(500).json({ success: false, error: 'Could not generate the report' });
    }
});

// History
router.get('/history', async (req, res) => {
    try {
        const rows = await GeneratedReport.find().select('-result').sort({ createdAt: -1 }).limit(100).lean();
        const visible = rows.filter((r) => {
            const def = engine.templates().find((t) => t.id === r.template);

            return def && can(req.access, def.needs);
        });

        res.json({ success: true, data: visible });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Could not load the history' });
    }
});

router.get('/history/:id', async (req, res) => {
    try {
        const doc = await GeneratedReport.findById(req.params.id).lean();
        if (!doc) return res.status(404).json({ success: false, error: 'Report not found' });
        const def = engine.templates().find((t) => t.id === doc.template);
        if (!def || !can(req.access, def.needs)) return res.status(403).json({ success: false, error: 'Insufficient permissions' });

        res.json({ success: true, data: { ...doc.result, id: doc._id } });
    } catch (error) {
        res.status(404).json({ success: false, error: 'Report not found' });
    }
});

router.delete('/history/:id', async (req, res) => {
    try {
        if (!can(req.access, 'reports.delete')) return res.status(403).json({ success: false, error: 'Insufficient permissions', required: 'reports.delete' });
        await GeneratedReport.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Could not delete the report' });
    }
});

module.exports = router;
