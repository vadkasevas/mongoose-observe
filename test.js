var mongooseDir = path.resolve(require.resolve('mongoose'),'..');
const mongoose = require('mongoose');
import path from 'path';
let filePath = path.resolve(require.resolve('mongoose'),'..');
const MongooseError = require('mongoose/lib/error/index');
const getModelsMapForPopulate = require(`${mongooseDir}/lib/helpers/populate/getModelsMapForPopulate`);
const immediate = require('mongoose/lib/helpers/immediate');
const utils = require('mongoose/lib/utils');
const isPathSelectedInclusive = require(`${mongooseDir}/lib/helpers/projection/isPathSelectedInclusive`);
const parseProjection = require(`${mongooseDir}/lib/helpers/projection/parseProjection`);
const leanPopulateMap = require(`${mongooseDir}/lib/helpers/populate/leanPopulateMap`);
const promiseOrCallback = require(`${mongooseDir}/lib/helpers/promiseOrCallback`);
const mpath = require('mpath');
const assignVals = require(`${mongooseDir}/lib/helpers/populate/assignVals`);
const SkipPopulateValue = require(`${mongooseDir}/lib/helpers/populate/SkipPopulateValue`);
const modelSymbol = require(`mongoose/lib/helpers/symbols`).modelSymbol;
const get = require(`${mongooseDir}/lib/helpers/get`);
const Document = require('mongoose/lib/document');
const _ = require('underscore');
export {
    populate,
    _execPopulateQuery,
    modelPopulate
}
/**
 * @name QueryItem
 * @extends Object
 * @property {model.Query} query
 * @property {Array<Document>} results
 * @method assign(vals:Array<Document>)
 * */

/*!
 * Populate helper
 *
 * @param {Model} model the model to use
 * @param {Document|Array} docs Either a single document or array of documents to populate.
 * @param {Object} paths
 * @param {Function} [cb(err,doc)] Optional callback, executed upon completion. Receives `err` and the `doc(s)`.
 * @return {Function}
 * @api private
 */

function modelPopulate(docs, paths, callback) {
    _checkContext(this, 'populate');

    const _this = this;

    // normalized paths
    paths = utils.populate(paths);

    // data that should persist across subPopulate calls
    const cache = {};

    callback = this.$handleCallbackError(callback);

    return promiseOrCallback(callback, cb => {
        cb = this.$wrapCallback(cb);
        _populate(_this, docs, paths, cache, cb);
    }, this.events);
}

function _populate(model, docs, paths, cache, callback) {
    const length = paths.length;
    let pending = paths.length;

    if (length === 0) {
        return callback();
    }
    let queries = {};
    _.each(paths,(path)=>{
        populate(model, docs, path, function next(err,newQueries) {
            if (err) {
                return callback(err, null);
            }
            _.each(newQueries,(queryItem)=>{
                queries[path.path] = queries[path.path] || [];
                queries[path.path].push(queryItem);
            });
            if (--pending) {
                return;
            }
            callback(null, queries);
        });
    });
}

/*!
 * Populates `docs`
 */
const excludeIdReg = /\s?-_id\s?/;
const excludeIdRegGlobal = /\s?-_id\s?/g;


function populate(model, docs, options, callback) {
    // normalize single / multiple docs passed
    if (!Array.isArray(docs)) {
        docs = [docs];
    }

    if (docs.length === 0 || docs.every(utils.isNullOrUndefined)) {
        return callback();
    }

    const modelsMap = getModelsMapForPopulate(model, docs, options);

    if (modelsMap instanceof MongooseError) {
        return immediate(function() {
            callback(modelsMap);
        });
    }

    const len = modelsMap.length;
    let vals = [];
    let queries = [];

    function flatten(item) {
        // no need to include undefined values in our query
        return undefined !== item;
    }

    let _remaining = len;
    let hasOne = false;
    const params = [];
    for (let i = 0; i < len; ++i) {
        const mod = modelsMap[i];
        let select = mod.options.select;
        const match = _formatMatch(mod.match);

        let ids = utils.array.flatten(mod.ids, flatten);
        ids = utils.array.unique(ids);

        const assignmentOpts = {};
        assignmentOpts.sort = get(mod, 'options.options.sort', void 0);
        assignmentOpts.excludeId = excludeIdReg.test(select) || (select && select._id === 0);

        if (ids.length === 0 || ids.every(utils.isNullOrUndefined)) {
            // Ensure that we set populate virtuals to 0 or empty array even
            // if we don't actually execute a query because they don't have
            // a value by default. See gh-7731, gh-8230
            --_remaining;
            if (mod.count || mod.isVirtual) {
                _assign(model, [], mod, assignmentOpts);
            }
            continue;
        }

        hasOne = true;
        if (mod.foreignField.size === 1) {
            const foreignField = Array.from(mod.foreignField)[0];
            const foreignSchemaType = mod.model.schema.path(foreignField);
            if (foreignField !== '_id' || !match['_id']) {
                ids = _filterInvalidIds(ids, foreignSchemaType, mod.options.skipInvalidIds);
                match[foreignField] = { $in: ids };
            }
        } else {
            const $or = [];
            if (Array.isArray(match.$or)) {
                match.$and = [{ $or: match.$or }, { $or: $or }];
                delete match.$or;
            } else {
                match.$or = $or;
            }
            for (const foreignField of mod.foreignField) {
                if (foreignField !== '_id' || !match['_id']) {
                    const foreignSchemaType = mod.model.schema.path(foreignField);
                    ids = _filterInvalidIds(ids, foreignSchemaType, mod.options.skipInvalidIds);
                    $or.push({ [foreignField]: { $in: ids } });
                }
            }
        }

        if (assignmentOpts.excludeId) {
            // override the exclusion from the query so we can use the _id
            // for document matching during assignment. we'll delete the
            // _id back off before returning the result.
            if (typeof select === 'string') {
                select = select.replace(excludeIdRegGlobal, ' ');
            } else {
                // preserve original select conditions by copying
                select = utils.object.shallowCopy(select);
                delete select._id;
            }
        }

        if (mod.options.options && mod.options.options.limit != null) {
            assignmentOpts.originalLimit = mod.options.options.limit;
        } else if (mod.options.limit != null) {
            assignmentOpts.originalLimit = mod.options.limit;
        }

        params.push([mod, match, select, assignmentOpts, _next]);
    }

    if (!hasOne) {
        return callback();
    }

    for (const arr of params) {
        _execPopulateQuery.apply(null, arr);
    }

    /**@param {Error} err
     * @param {QueryItem} queryItem
     **/
    function _next(err, queryItem) {
        if (err != null) {
            return callback(err, null);
        }
        if(queryItem) {
            queries.push (queryItem);
            queryItem.assign = function(newVals=vals){
                for (const arr of params) {
                    const mod = arr[0];
                    const assignmentOpts = arr[3];
                    _assign(model, newVals, mod, assignmentOpts);
                }
            }
        }
        vals = vals.concat(queryItem.results);
        if (--_remaining === 0) {
            _done();
        }
    }

    function _done() {
        /*for (const arr of params) {
            const mod = arr[0];
            const assignmentOpts = arr[3];
            _assign(model, vals, mod, assignmentOpts);
        }*/
        callback(null,queries);
    }
}

/*!
 * ignore
 */

function _execPopulateQuery(mod, match, select, assignmentOpts, callback) {
    const subPopulate = utils.clone(mod.options.populate);

    const queryOptions = Object.assign({
        skip: mod.options.skip,
        limit: mod.options.limit,
        perDocumentLimit: mod.options.perDocumentLimit
    }, mod.options.options);

    if (mod.count) {
        delete queryOptions.skip;
    }

    if (queryOptions.perDocumentLimit != null) {
        queryOptions.limit = queryOptions.perDocumentLimit;
        delete queryOptions.perDocumentLimit;
    } else if (queryOptions.limit != null) {
        queryOptions.limit = queryOptions.limit * mod.ids.length;
    }

    const query = mod.model.find(match, select, queryOptions);
    // If we're doing virtual populate and projection is inclusive and foreign
    // field is not selected, automatically select it because mongoose needs it.
    // If projection is exclusive and client explicitly unselected the foreign
    // field, that's the client's fault.
    for (const foreignField of mod.foreignField) {
        if (foreignField !== '_id' && query.selectedInclusively() &&
            !isPathSelectedInclusive(query._fields, foreignField)) {
            query.select(foreignField);
        }
    }

    // If using count, still need the `foreignField` so we can match counts
    // to documents, otherwise we would need a separate `count()` for every doc.
    if (mod.count) {
        for (const foreignField of mod.foreignField) {
            query.select(foreignField);
        }
    }

    // If we need to sub-populate, call populate recursively
    if (subPopulate) {
        query.populate(subPopulate);
    }
    //callback(null,query);

    query.exec((err,qResults)=>{
        if(err)
            return callback(err);
        return callback(null,{
            mod,
            assignmentOpts,
            query:query,
            results:qResults,
            assign(vals){
                return _assign(mod.model, vals, mod, assignmentOpts);
            }
        });
    });
}

/*!
 * Make sure `this` is a model
 */

function _checkContext(ctx, fnName) {
    // Check context, because it is easy to mistakenly type
    // `new Model.discriminator()` and get an incomprehensible error
    if (ctx == null || ctx === global) {
        throw new MongooseError('`Model.' + fnName + '()` cannot run without a ' +
            'model as `this`. Make sure you are calling `MyModel.' + fnName + '()` ' +
            'where `MyModel` is a Mongoose model.');
    } else if (ctx[modelSymbol] == null) {
        throw new MongooseError('`Model.' + fnName + '()` cannot run without a ' +
            'model as `this`. Make sure you are not calling ' +
            '`new Model.' + fnName + '()`');
    }
}

/*!
 * Format `mod.match` given that it may be an array that we need to $or if
 * the client has multiple docs with match functions
 */

function _formatMatch(match) {
    if (Array.isArray(match)) {
        if (match.length > 1) {
            return { $or: [].concat(match.map(m => Object.assign({}, m))) };
        }
        return Object.assign({}, match[0]);
    }
    return Object.assign({}, match);
}

function _assign(model, vals, mod, assignmentOpts) {
    const options = mod.options;
    const isVirtual = mod.isVirtual;
    const justOne = mod.justOne;
    let _val;
    const lean = get(options, 'options.lean', false);
    const projection = parseProjection(get(options, 'select', null), true) ||
        parseProjection(get(options, 'options.select', null), true);
    const len = vals.length;
    const rawOrder = {};
    const rawDocs = {};
    let key;
    let val;

    // Clone because `assignRawDocsToIdStructure` will mutate the array
    const allIds = utils.clone(mod.allIds);

    // optimization:
    // record the document positions as returned by
    // the query result.
    for (let i = 0; i < len; i++) {
        val = vals[i];
        if (val == null) {
            continue;
        }
        for (const foreignField of mod.foreignField) {
            _val = utils.getValue(foreignField, val);
            if (Array.isArray(_val)) {
                _val = utils.array.flatten(_val);
                const _valLength = _val.length;
                for (let j = 0; j < _valLength; ++j) {
                    let __val = _val[j];
                    if (__val instanceof Document) {
                        __val = __val._id;
                    }
                    key = String(__val);
                    if (rawDocs[key]) {
                        if (Array.isArray(rawDocs[key])) {
                            rawDocs[key].push(val);
                            rawOrder[key].push(i);
                        } else {
                            rawDocs[key] = [rawDocs[key], val];
                            rawOrder[key] = [rawOrder[key], i];
                        }
                    } else {
                        if (isVirtual && !justOne) {
                            rawDocs[key] = [val];
                            rawOrder[key] = [i];
                        } else {
                            rawDocs[key] = val;
                            rawOrder[key] = i;
                        }
                    }
                }
            } else {
                if (_val instanceof Document) {
                    _val = _val._id;
                }
                key = String(_val);
                if (rawDocs[key]) {
                    if (Array.isArray(rawDocs[key])) {
                        rawDocs[key].push(val);
                        rawOrder[key].push(i);
                    } else {
                        rawDocs[key] = [rawDocs[key], val];
                        rawOrder[key] = [rawOrder[key], i];
                    }
                } else {
                    rawDocs[key] = val;
                    rawOrder[key] = i;
                }
            }
            // flag each as result of population
            if (lean) {
                leanPopulateMap.set(val, mod.model);
            } else {
                val.$__.wasPopulated = true;
            }

            // gh-8460: if user used `-foreignField`, assume this means they
            // want the foreign field unset even if it isn't excluded in the query.
            if (projection != null && projection.hasOwnProperty('-' + foreignField)) {
                if (val.$__ != null) {
                    val.set(foreignField, void 0);
                } else {
                    mpath.unset(foreignField, val);
                }
            }
        }
    }

    assignVals({
        originalModel: model,
        // If virtual, make sure to not mutate original field
        rawIds: mod.isVirtual ? allIds : mod.allIds,
        allIds: allIds,
        foreignField: mod.foreignField,
        rawDocs: rawDocs,
        rawOrder: rawOrder,
        docs: mod.docs,
        path: options.path,
        options: assignmentOpts,
        justOne: mod.justOne,
        isVirtual: mod.isVirtual,
        allOptions: mod,
        lean: lean,
        virtual: mod.virtual,
        count: mod.count,
        match: mod.match
    });
}

/*!
 * Optionally filter out invalid ids that don't conform to foreign field's schema
 * to avoid cast errors (gh-7706)
 */

function _filterInvalidIds(ids, foreignSchemaType, skipInvalidIds) {
    ids = ids.filter(v => !(v instanceof SkipPopulateValue));
    if (!skipInvalidIds) {
        return ids;
    }
    return ids.filter(id => {
        try {
            foreignSchemaType.cast(id);
            return true;
        } catch (err) {
            return false;
        }
    });
}