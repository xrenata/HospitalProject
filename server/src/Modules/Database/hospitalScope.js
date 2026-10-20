const { AsyncLocalStorage } = require('async_hooks');
const mongoose = require('mongoose');

/**
 * Multi-hospital support without touching every controller.
 *
 * Every request runs inside a context ({ hospitalId, all }). This plugin gives each collection a `hospitalId`
 * and makes reads, updates, deletes and aggregations look only at the current hospital, and new documents
 * carry it automatically. Documents without a hospitalId (data created before hospitals existed, or by scripts)
 * belong to the default hospital.
 *
 *   - schema.options.noHospital   collection is shared by all hospitals (roles, audit log, hospitals themselves)
 *   - schema.options.hospitalMulti  a person can belong to several hospitals (staff.hospitalIds)
 *   - query option { allHospitals: true }  deliberately look across hospitals
 */

const als = new AsyncLocalStorage();
let defaultHospitalId = null;

const setDefaultHospital = (id) => { defaultHospitalId = id ? String(id) : null; };
const getDefaultHospital = () => defaultHospitalId;
const current = () => als.getStore() || null;
const run = (ctx, fn) => als.run(ctx, fn);

const oid = (v) => (v && mongoose.isValidObjectId(v) ? new mongoose.Types.ObjectId(String(v)) : null);

/** The filter that limits a query to one hospital. */
const filterFor = (hospitalId, multi) => {
    const id = oid(hospitalId);
    if (!id) return null;
    const isDefault = String(hospitalId) === defaultHospitalId;
    const ors = [{ hospitalId: id }];
    if (multi) ors.push({ hospitalIds: id });
    if (isDefault) ors.push({ hospitalId: { $exists: false } }, { hospitalId: null });

    return ors.length === 1 ? ors[0] : { $or: ors };
};

const QUERY_OPS = [
    'find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete', 'findOneAndReplace', 'countDocuments',
    'updateOne', 'updateMany', 'deleteOne', 'deleteMany', 'distinct',
];

const plugin = (schema) => {
    if (schema.options.noHospital) return;
    const multi = Boolean(schema.options.hospitalMulti);

    schema.add({ hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', index: true } });
    if (multi) schema.add({ hospitalIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' }] });

    const scopeQuery = function scopeQuery() {
        const ctx = als.getStore();
        if (!ctx || ctx.all || this.getOptions().allHospitals) return;
        const filter = filterFor(ctx.hospitalId, multi);
        if (filter) this.and([filter]);
    };
    QUERY_OPS.forEach((op) => schema.pre(op, scopeQuery));

    schema.pre('aggregate', function scopeAggregate() {
        const ctx = als.getStore();
        if (!ctx || ctx.all || this.options?.allHospitals) return;
        const filter = filterFor(ctx.hospitalId, multi);
        if (!filter) return;
        const pipeline = this.pipeline();
        const first = pipeline[0] || {};
        // $geoNear / $search / $vectorSearch must stay first
        const at = first.$geoNear || first.$search || first.$vectorSearch ? 1 : 0;
        pipeline.splice(at, 0, { $match: filter });
    });

    schema.pre('save', function stamp(next) {
        const ctx = als.getStore();
        if (this.isNew && !this.hospitalId) {
            const id = ctx?.hospitalId || (ctx?.all ? defaultHospitalId : null);
            if (id) this.hospitalId = id;
        }
        next();
    });

    schema.pre('insertMany', function stampMany(next, docs) {
        const ctx = als.getStore();
        const id = ctx?.hospitalId || (ctx?.all ? defaultHospitalId : null);
        if (id && Array.isArray(docs)) docs.forEach((d) => { if (d && !d.hospitalId) d.hospitalId = id; });
        next();
    });
};

/** Give every existing document a hospital (the default one) so nothing is left unassigned. */
const backfill = async () => {
    if (!defaultHospitalId) return;
    for (const name of mongoose.modelNames()) {
        const model = mongoose.model(name);
        if (model.schema.options.noHospital) continue;
        await model.collection.updateMany(
            { $or: [{ hospitalId: { $exists: false } }, { hospitalId: null }] },
            { $set: { hospitalId: new mongoose.Types.ObjectId(defaultHospitalId) } },
        );
    }
};

module.exports = { plugin, run, current, setDefaultHospital, getDefaultHospital, backfill, filterFor, oid };
