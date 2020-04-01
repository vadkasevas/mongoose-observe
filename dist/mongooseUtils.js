"use strict";var _interopRequireDefault3 = require("@babel/runtime/helpers/interopRequireDefault");var _interopRequireDefault2 = _interopRequireDefault3(require("@babel/runtime/helpers/interopRequireDefault"));Object.defineProperty(exports, "__esModule", { value: true });exports.modelPopulate = exports._execPopulateQuery = exports.populate = undefined;var _defineProperty2 = require("@babel/runtime/helpers/defineProperty");var _defineProperty = (0, _interopRequireDefault2["default"])(_defineProperty2)["default"];var _path = require("path");var path = (0, _interopRequireDefault2["default"])(_path)["default"];
var mongooseDir = path.resolve(require.resolve('mongoose'), '..');
var MongooseError = require('mongoose/lib/error/index');
var getModelsMapForPopulate = require("".concat(mongooseDir, "/lib/helpers/populate/getModelsMapForPopulate"));
var immediate = require('mongoose/lib/helpers/immediate');
var utils = require('mongoose/lib/utils');
var isPathSelectedInclusive = require("".concat(mongooseDir, "/lib/helpers/projection/isPathSelectedInclusive"));
var parseProjection = require("".concat(mongooseDir, "/lib/helpers/projection/parseProjection"));
var leanPopulateMap = require("".concat(mongooseDir, "/lib/helpers/populate/leanPopulateMap"));
var promiseOrCallback = require("".concat(mongooseDir, "/lib/helpers/promiseOrCallback"));
var mpath = require('mpath');
var assignVals = require("".concat(mongooseDir, "/lib/helpers/populate/assignVals"));
var SkipPopulateValue = require("".concat(mongooseDir, "/lib/helpers/populate/SkipPopulateValue"));
var modelSymbol = require("mongoose/lib/helpers/symbols").modelSymbol;
var get = require("".concat(mongooseDir, "/lib/helpers/get"));
var Document = require('mongoose/lib/document');
var _ = require('underscore');exports.

populate = populate;exports.
_execPopulateQuery = _execPopulateQuery;exports.
modelPopulate = modelPopulate;

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

function modelPopulate(docs, paths, callback) {var _this2 = this;
  _checkContext(this, 'populate');

  var _this = this;

  // normalized paths
  paths = utils.populate(paths);

  // data that should persist across subPopulate calls
  var cache = {};

  callback = this.$handleCallbackError(callback);

  return promiseOrCallback(callback, function (cb) {
    cb = _this2.$wrapCallback(cb);
    _populate(_this, docs, paths, cache, cb);
  }, this.events);
}

function _populate(model, docs, paths, cache, callback) {
  var length = paths.length;
  var pending = paths.length;

  if (length === 0) {
    return callback();
  }
  var queries = {};
  _.each(paths, function (path) {
    populate(model, docs, path, function next(err, newQueries) {
      if (err) {
        return callback(err, null);
      }
      _.each(newQueries, function (queryItem) {
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
var excludeIdReg = /\s?-_id\s?/;
var excludeIdRegGlobal = /\s?-_id\s?/g;


function populate(model, docs, options, callback) {
  // normalize single / multiple docs passed
  if (!Array.isArray(docs)) {
    docs = [docs];
  }

  if (docs.length === 0 || docs.every(utils.isNullOrUndefined)) {
    return callback();
  }

  var modelsMap = getModelsMapForPopulate(model, docs, options);

  if (modelsMap instanceof MongooseError) {
    return immediate(function () {
      callback(modelsMap);
    });
  }

  var len = modelsMap.length;
  var vals = [];
  var queries = [];

  function flatten(item) {
    // no need to include undefined values in our query
    return undefined !== item;
  }

  var _remaining = len;
  var hasOne = false;
  var params = [];
  for (var i = 0; i < len; ++i) {
    var mod = modelsMap[i];
    var select = mod.options.select;
    var match = _formatMatch(mod.match);

    var ids = utils.array.flatten(mod.ids, flatten);
    ids = utils.array.unique(ids);

    var assignmentOpts = {};
    assignmentOpts.sort = get(mod, 'options.options.sort', void 0);
    assignmentOpts.excludeId = excludeIdReg.test(select) || select && select._id === 0;

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
      var foreignField = Array.from(mod.foreignField)[0];
      var foreignSchemaType = mod.model.schema.path(foreignField);
      if (foreignField !== '_id' || !match['_id']) {
        ids = _filterInvalidIds(ids, foreignSchemaType, mod.options.skipInvalidIds);
        match[foreignField] = { $in: ids };
      }
    } else {
      var $or = [];
      if (Array.isArray(match.$or)) {
        match.$and = [{ $or: match.$or }, { $or: $or }];
        delete match.$or;
      } else {
        match.$or = $or;
      }var _iteratorNormalCompletion = true;var _didIteratorError = false;var _iteratorError = undefined;try {
        for (var _iterator = mod.foreignField[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {var _foreignField = _step.value;
          if (_foreignField !== '_id' || !match['_id']) {
            var _foreignSchemaType = mod.model.schema.path(_foreignField);
            ids = _filterInvalidIds(ids, _foreignSchemaType, mod.options.skipInvalidIds);
            $or.push(_defineProperty({}, _foreignField, { $in: ids }));
          }
        }} catch (err) {_didIteratorError = true;_iteratorError = err;} finally {try {if (!_iteratorNormalCompletion && _iterator["return"] != null) {_iterator["return"]();}} finally {if (_didIteratorError) {throw _iteratorError;}}}
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

  for (var _i = 0, _params = params; _i < _params.length; _i++) {var arr = _params[_i];
    _execPopulateQuery.apply(null, arr);
  }

  /**@param {Error} err
     * @param {QueryItem} queryItem
     **/
  function _next(err, queryItem) {
    if (err != null) {
      return callback(err, null);
    }
    if (queryItem) {
      queries.push(queryItem);
      queryItem.assign = function () {var newVals = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : vals;var _iteratorNormalCompletion2 = true;var _didIteratorError2 = false;var _iteratorError2 = undefined;try {
          for (var _iterator2 = params[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {var arr = _step2.value;
            var _mod = arr[0];
            var _assignmentOpts = arr[3];
            _assign(model, newVals, _mod, _assignmentOpts);
          }} catch (err) {_didIteratorError2 = true;_iteratorError2 = err;} finally {try {if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {_iterator2["return"]();}} finally {if (_didIteratorError2) {throw _iteratorError2;}}}
      };
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
    callback(null, queries);
  }
}

/*!
   * ignore
   */

function _execPopulateQuery(mod, match, select, assignmentOpts, callback) {
  var subPopulate = utils.clone(mod.options.populate);

  var queryOptions = Object.assign({
    skip: mod.options.skip,
    limit: mod.options.limit,
    perDocumentLimit: mod.options.perDocumentLimit },
  mod.options.options);

  if (mod.count) {
    delete queryOptions.skip;
  }

  if (queryOptions.perDocumentLimit != null) {
    queryOptions.limit = queryOptions.perDocumentLimit;
    delete queryOptions.perDocumentLimit;
  } else if (queryOptions.limit != null) {
    queryOptions.limit = queryOptions.limit * mod.ids.length;
  }

  var query = mod.model.find(match, select, queryOptions);
  // If we're doing virtual populate and projection is inclusive and foreign
  // field is not selected, automatically select it because mongoose needs it.
  // If projection is exclusive and client explicitly unselected the foreign
  // field, that's the client's fault.
  var _iteratorNormalCompletion3 = true;var _didIteratorError3 = false;var _iteratorError3 = undefined;try {for (var _iterator3 = mod.foreignField[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {var _foreignField2 = _step3.value;
      if (_foreignField2 !== '_id' && query.selectedInclusively() &&
      !isPathSelectedInclusive(query._fields, _foreignField2)) {
        query.select(_foreignField2);
      }
    }

    // If using count, still need the `foreignField` so we can match counts
    // to documents, otherwise we would need a separate `count()` for every doc.
  } catch (err) {_didIteratorError3 = true;_iteratorError3 = err;} finally {try {if (!_iteratorNormalCompletion3 && _iterator3["return"] != null) {_iterator3["return"]();}} finally {if (_didIteratorError3) {throw _iteratorError3;}}}if (mod.count) {var _iteratorNormalCompletion4 = true;var _didIteratorError4 = false;var _iteratorError4 = undefined;try {
      for (var _iterator4 = mod.foreignField[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {var foreignField = _step4.value;
        query.select(foreignField);
      }} catch (err) {_didIteratorError4 = true;_iteratorError4 = err;} finally {try {if (!_iteratorNormalCompletion4 && _iterator4["return"] != null) {_iterator4["return"]();}} finally {if (_didIteratorError4) {throw _iteratorError4;}}}
  }

  // If we need to sub-populate, call populate recursively
  if (subPopulate) {
    query.populate(subPopulate);
  }
  //callback(null,query);

  query.exec(function (err, qResults) {
    if (err)
    return callback(err);
    return callback(null, {
      mod: mod,
      assignmentOpts: assignmentOpts,
      query: query,
      results: qResults,
      assign: function assign(vals) {
        return _assign(mod.model, vals, mod, assignmentOpts);
      } });

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
      return { $or: [].concat(match.map(function (m) {return Object.assign({}, m);})) };
    }
    return Object.assign({}, match[0]);
  }
  return Object.assign({}, match);
}

function _assign(model, vals, mod, assignmentOpts) {
  var options = mod.options;
  var isVirtual = mod.isVirtual;
  var justOne = mod.justOne;
  var _val;
  var lean = get(options, 'options.lean', false);
  var projection = parseProjection(get(options, 'select', null), true) ||
  parseProjection(get(options, 'options.select', null), true);
  var len = vals.length;
  var rawOrder = {};
  var rawDocs = {};
  var key;
  var val;

  // Clone because `assignRawDocsToIdStructure` will mutate the array
  var allIds = utils.clone(mod.allIds);

  // optimization:
  // record the document positions as returned by
  // the query result.
  for (var i = 0; i < len; i++) {
    val = vals[i];
    if (val == null) {
      continue;
    }var _iteratorNormalCompletion5 = true;var _didIteratorError5 = false;var _iteratorError5 = undefined;try {
      for (var _iterator5 = mod.foreignField[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {var foreignField = _step5.value;
        _val = utils.getValue(foreignField, val);
        if (Array.isArray(_val)) {
          _val = utils.array.flatten(_val);
          var _valLength = _val.length;
          for (var j = 0; j < _valLength; ++j) {
            var __val = _val[j];
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
      }} catch (err) {_didIteratorError5 = true;_iteratorError5 = err;} finally {try {if (!_iteratorNormalCompletion5 && _iterator5["return"] != null) {_iterator5["return"]();}} finally {if (_didIteratorError5) {throw _iteratorError5;}}}
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
    match: mod.match });

}

/*!
   * Optionally filter out invalid ids that don't conform to foreign field's schema
   * to avoid cast errors (gh-7706)
   */

function _filterInvalidIds(ids, foreignSchemaType, skipInvalidIds) {
  ids = ids.filter(function (v) {return !(v instanceof SkipPopulateValue);});
  if (!skipInvalidIds) {
    return ids;
  }
  return ids.filter(function (id) {
    try {
      foreignSchemaType.cast(id);
      return true;
    } catch (err) {
      return false;
    }
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9tb25nb29zZVV0aWxzLmpzIl0sIm5hbWVzIjpbInBhdGgiLCJtb25nb29zZURpciIsInJlc29sdmUiLCJyZXF1aXJlIiwiTW9uZ29vc2VFcnJvciIsImdldE1vZGVsc01hcEZvclBvcHVsYXRlIiwiaW1tZWRpYXRlIiwidXRpbHMiLCJpc1BhdGhTZWxlY3RlZEluY2x1c2l2ZSIsInBhcnNlUHJvamVjdGlvbiIsImxlYW5Qb3B1bGF0ZU1hcCIsInByb21pc2VPckNhbGxiYWNrIiwibXBhdGgiLCJhc3NpZ25WYWxzIiwiU2tpcFBvcHVsYXRlVmFsdWUiLCJtb2RlbFN5bWJvbCIsImdldCIsIkRvY3VtZW50IiwiXyIsInBvcHVsYXRlIiwiX2V4ZWNQb3B1bGF0ZVF1ZXJ5IiwibW9kZWxQb3B1bGF0ZSIsImRvY3MiLCJwYXRocyIsImNhbGxiYWNrIiwiX2NoZWNrQ29udGV4dCIsIl90aGlzIiwiY2FjaGUiLCIkaGFuZGxlQ2FsbGJhY2tFcnJvciIsImNiIiwiJHdyYXBDYWxsYmFjayIsIl9wb3B1bGF0ZSIsImV2ZW50cyIsIm1vZGVsIiwibGVuZ3RoIiwicGVuZGluZyIsInF1ZXJpZXMiLCJlYWNoIiwibmV4dCIsImVyciIsIm5ld1F1ZXJpZXMiLCJxdWVyeUl0ZW0iLCJwdXNoIiwiZXhjbHVkZUlkUmVnIiwiZXhjbHVkZUlkUmVnR2xvYmFsIiwib3B0aW9ucyIsIkFycmF5IiwiaXNBcnJheSIsImV2ZXJ5IiwiaXNOdWxsT3JVbmRlZmluZWQiLCJtb2RlbHNNYXAiLCJsZW4iLCJ2YWxzIiwiZmxhdHRlbiIsIml0ZW0iLCJ1bmRlZmluZWQiLCJfcmVtYWluaW5nIiwiaGFzT25lIiwicGFyYW1zIiwiaSIsIm1vZCIsInNlbGVjdCIsIm1hdGNoIiwiX2Zvcm1hdE1hdGNoIiwiaWRzIiwiYXJyYXkiLCJ1bmlxdWUiLCJhc3NpZ25tZW50T3B0cyIsInNvcnQiLCJleGNsdWRlSWQiLCJ0ZXN0IiwiX2lkIiwiY291bnQiLCJpc1ZpcnR1YWwiLCJfYXNzaWduIiwiZm9yZWlnbkZpZWxkIiwic2l6ZSIsImZyb20iLCJmb3JlaWduU2NoZW1hVHlwZSIsInNjaGVtYSIsIl9maWx0ZXJJbnZhbGlkSWRzIiwic2tpcEludmFsaWRJZHMiLCIkaW4iLCIkb3IiLCIkYW5kIiwicmVwbGFjZSIsIm9iamVjdCIsInNoYWxsb3dDb3B5IiwibGltaXQiLCJvcmlnaW5hbExpbWl0IiwiX25leHQiLCJhcnIiLCJhcHBseSIsImFzc2lnbiIsIm5ld1ZhbHMiLCJjb25jYXQiLCJyZXN1bHRzIiwiX2RvbmUiLCJzdWJQb3B1bGF0ZSIsImNsb25lIiwicXVlcnlPcHRpb25zIiwiT2JqZWN0Iiwic2tpcCIsInBlckRvY3VtZW50TGltaXQiLCJxdWVyeSIsImZpbmQiLCJzZWxlY3RlZEluY2x1c2l2ZWx5IiwiX2ZpZWxkcyIsImV4ZWMiLCJxUmVzdWx0cyIsImN0eCIsImZuTmFtZSIsImdsb2JhbCIsIm1hcCIsIm0iLCJqdXN0T25lIiwiX3ZhbCIsImxlYW4iLCJwcm9qZWN0aW9uIiwicmF3T3JkZXIiLCJyYXdEb2NzIiwia2V5IiwidmFsIiwiYWxsSWRzIiwiZ2V0VmFsdWUiLCJfdmFsTGVuZ3RoIiwiaiIsIl9fdmFsIiwiU3RyaW5nIiwic2V0IiwiJF9fIiwid2FzUG9wdWxhdGVkIiwiaGFzT3duUHJvcGVydHkiLCJ1bnNldCIsIm9yaWdpbmFsTW9kZWwiLCJyYXdJZHMiLCJhbGxPcHRpb25zIiwidmlydHVhbCIsImZpbHRlciIsInYiLCJpZCIsImNhc3QiXSwibWFwcGluZ3MiOiJxZ0JBQUEsNEIsSUFBT0EsSTtBQUNQLElBQUlDLFdBQVcsR0FBR0QsSUFBSSxDQUFDRSxPQUFMLENBQWFDLE9BQU8sQ0FBQ0QsT0FBUixDQUFnQixVQUFoQixDQUFiLEVBQXlDLElBQXpDLENBQWxCO0FBQ0EsSUFBTUUsYUFBYSxHQUFHRCxPQUFPLENBQUMsMEJBQUQsQ0FBN0I7QUFDQSxJQUFNRSx1QkFBdUIsR0FBR0YsT0FBTyxXQUFJRixXQUFKLG1EQUF2QztBQUNBLElBQU1LLFNBQVMsR0FBR0gs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LGFBQU8sS0FBUDtBQUNIO0FBQ0osR0FQTSxDQUFQO0FBUUgiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbnZhciBtb25nb29zZURpciA9IHBhdGgucmVzb2x2ZShyZXF1aXJlLnJlc29sdmUoJ21vbmdvb3NlJyksJy4uJyk7XG5jb25zdCBNb25nb29zZUVycm9yID0gcmVxdWlyZSgnbW9uZ29vc2UvbGliL2Vycm9yL2luZGV4Jyk7XG5jb25zdCBnZXRNb2RlbHNNYXBGb3JQb3B1bGF0ZSA9IHJlcXVpcmUoYCR7bW9uZ29vc2VEaXJ9L2xpYi9oZWxwZXJzL3BvcHVsYXRlL2dldE1vZGVsc01hcEZvclBvcHVsYXRlYCk7XG5jb25zdCBpbW1lZGlhdGUgPSByZXF1aXJlKCdtb25nb29zZS9saWIvaGVscGVycy9pbW1lZGlhdGUnKTtcbmNvbnN0IHV0aWxzID0gcmVxdWlyZSgnbW9uZ29vc2UvbGliL3V0aWxzJyk7XG5jb25zdCBpc1BhdGhTZWxlY3RlZEluY2x1c2l2ZSA9IHJlcXVpcmUoYCR7bW9uZ29vc2VEaXJ9L2xpYi9oZWxwZXJzL3Byb2plY3Rpb24vaXNQYXRoU2VsZWN0ZWRJbmNsdXNpdmVgKTtcbmNvbnN0IHBhcnNlUHJvamVjdGlvbiA9IHJlcXVpcmUoYCR7bW9uZ29vc2VEaXJ9L2xpYi9oZWxwZXJzL3Byb2plY3Rpb24vcGFyc2VQcm9qZWN0aW9uYCk7XG5jb25zdCBsZWFuUG9wdWxhdGVNYXAgPSByZXF1aXJlKGAke21vbmdvb3NlRGlyfS9saWIvaGVscGVycy9wb3B1bGF0ZS9sZWFuUG9wdWxhdGVNYXBgKTtcbmNvbnN0IHByb21pc2VPckNhbGxiYWNrID0gcmVxdWlyZShgJHttb25nb29zZURpcn0vbGliL2hlbHBlcnMvcHJvbWlzZU9yQ2FsbGJhY2tgKTtcbmNvbnN0IG1wYXRoID0gcmVxdWlyZSgnbXBhdGgnKTtcbmNvbnN0IGFzc2lnblZhbHMgPSByZXF1aXJlKGAke21vbmdvb3NlRGlyfS9saWIvaGVscGVycy9wb3B1bGF0ZS9hc3NpZ25WYWxzYCk7XG5jb25zdCBTa2lwUG9wdWxhdGVWYWx1ZSA9IHJlcXVpcmUoYCR7bW9uZ29vc2VEaXJ9L2xpYi9oZWxwZXJzL3BvcHVsYXRlL1NraXBQb3B1bGF0ZVZhbHVlYCk7XG5jb25zdCBtb2RlbFN5bWJvbCA9IHJlcXVpcmUoYG1vbmdvb3NlL2xpYi9oZWxwZXJzL3N5bWJvbHNgKS5tb2RlbFN5bWJvbDtcbmNvbnN0IGdldCA9IHJlcXVpcmUoYCR7bW9uZ29vc2VEaXJ9L2xpYi9oZWxwZXJzL2dldGApO1xuY29uc3QgRG9jdW1lbnQgPSByZXF1aXJlKCdtb25nb29zZS9saWIvZG9jdW1lbnQnKTtcbmNvbnN0IF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlJyk7XG5leHBvcnQge1xuICAgIHBvcHVsYXRlLFxuICAgIF9leGVjUG9wdWxhdGVRdWVyeSxcbiAgICBtb2RlbFBvcHVsYXRlXG59XG4vKipcbiAqIEBuYW1lIFF1ZXJ5SXRlbVxuICogQGV4dGVuZHMgT2JqZWN0XG4gKiBAcHJvcGVydHkge21vZGVsLlF1ZXJ5fSBxdWVyeVxuICogQHByb3BlcnR5IHtBcnJheTxEb2N1bWVudD59IHJlc3VsdHNcbiAqIEBtZXRob2QgYXNzaWduKHZhbHM6QXJyYXk8RG9jdW1lbnQ+KVxuICogKi9cblxuLyohXG4gKiBQb3B1bGF0ZSBoZWxwZXJcbiAqXG4gKiBAcGFyYW0ge01vZGVsfSBtb2RlbCB0aGUgbW9kZWwgdG8gdXNlXG4gKiBAcGFyYW0ge0RvY3VtZW50fEFycmF5fSBkb2NzIEVpdGhlciBhIHNpbmdsZSBkb2N1bWVudCBvciBhcnJheSBvZiBkb2N1bWVudHMgdG8gcG9wdWxhdGUuXG4gKiBAcGFyYW0ge09iamVjdH0gcGF0aHNcbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtjYihlcnIsZG9jKV0gT3B0aW9uYWwgY2FsbGJhY2ssIGV4ZWN1dGVkIHVwb24gY29tcGxldGlvbi4gUmVjZWl2ZXMgYGVycmAgYW5kIHRoZSBgZG9jKHMpYC5cbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gbW9kZWxQb3B1bGF0ZShkb2NzLCBwYXRocywgY2FsbGJhY2spIHtcbiAgICBfY2hlY2tDb250ZXh0KHRoaXMsICdwb3B1bGF0ZScpO1xuXG4gICAgY29uc3QgX3RoaXMgPSB0aGlzO1xuXG4gICAgLy8gbm9ybWFsaXplZCBwYXRoc1xuICAgIHBhdGhzID0gdXRpbHMucG9wdWxhdGUocGF0aHMpO1xuXG4gICAgLy8gZGF0YSB0aGF0IHNob3VsZCBwZXJzaXN0IGFjcm9zcyBzdWJQb3B1bGF0ZSBjYWxsc1xuICAgIGNvbnN0IGNhY2hlID0ge307XG5cbiAgICBjYWxsYmFjayA9IHRoaXMuJGhhbmRsZUNhbGxiYWNrRXJyb3IoY2FsbGJhY2spO1xuXG4gICAgcmV0dXJuIHByb21pc2VPckNhbGxiYWNrKGNhbGxiYWNrLCBjYiA9PiB7XG4gICAgICAgIGNiID0gdGhpcy4kd3JhcENhbGxiYWNrKGNiKTtcbiAgICAgICAgX3BvcHVsYXRlKF90aGlzLCBkb2NzLCBwYXRocywgY2FjaGUsIGNiKTtcbiAgICB9LCB0aGlzLmV2ZW50cyk7XG59XG5cbmZ1bmN0aW9uIF9wb3B1bGF0ZShtb2RlbCwgZG9jcywgcGF0aHMsIGNhY2hlLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IGxlbmd0aCA9IHBhdGhzLmxlbmd0aDtcbiAgICBsZXQgcGVuZGluZyA9IHBhdGhzLmxlbmd0aDtcblxuICAgIGlmIChsZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgfVxuICAgIGxldCBxdWVyaWVzID0ge307XG4gICAgXy5lYWNoKHBhdGhzLChwYXRoKT0+e1xuICAgICAgICBwb3B1bGF0ZShtb2RlbCwgZG9jcywgcGF0aCwgZnVuY3Rpb24gbmV4dChlcnIsbmV3UXVlcmllcykge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIsIG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXy5lYWNoKG5ld1F1ZXJpZXMsKHF1ZXJ5SXRlbSk9PntcbiAgICAgICAgICAgICAgICBxdWVyaWVzW3BhdGgucGF0aF0gPSBxdWVyaWVzW3BhdGgucGF0aF0gfHwgW107XG4gICAgICAgICAgICAgICAgcXVlcmllc1twYXRoLnBhdGhdLnB1c2gocXVlcnlJdGVtKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKC0tcGVuZGluZykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHF1ZXJpZXMpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuLyohXG4gKiBQb3B1bGF0ZXMgYGRvY3NgXG4gKi9cbmNvbnN0IGV4Y2x1ZGVJZFJlZyA9IC9cXHM/LV9pZFxccz8vO1xuY29uc3QgZXhjbHVkZUlkUmVnR2xvYmFsID0gL1xccz8tX2lkXFxzPy9nO1xuXG5cbmZ1bmN0aW9uIHBvcHVsYXRlKG1vZGVsLCBkb2NzLCBvcHRpb25zLCBjYWxsYmFjaykge1xuICAgIC8vIG5vcm1hbGl6ZSBzaW5nbGUgLyBtdWx0aXBsZSBkb2NzIHBhc3NlZFxuICAgIGlmICghQXJyYXkuaXNBcnJheShkb2NzKSkge1xuICAgICAgICBkb2NzID0gW2RvY3NdO1xuICAgIH1cblxuICAgIGlmIChkb2NzLmxlbmd0aCA9PT0gMCB8fCBkb2NzLmV2ZXJ5KHV0aWxzLmlzTnVsbE9yVW5kZWZpbmVkKSkge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICB9XG5cbiAgICBjb25zdCBtb2RlbHNNYXAgPSBnZXRNb2RlbHNNYXBGb3JQb3B1bGF0ZShtb2RlbCwgZG9jcywgb3B0aW9ucyk7XG5cbiAgICBpZiAobW9kZWxzTWFwIGluc3RhbmNlb2YgTW9uZ29vc2VFcnJvcikge1xuICAgICAgICByZXR1cm4gaW1tZWRpYXRlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2FsbGJhY2sobW9kZWxzTWFwKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgbGVuID0gbW9kZWxzTWFwLmxlbmd0aDtcbiAgICBsZXQgdmFscyA9IFtdO1xuICAgIGxldCBxdWVyaWVzID0gW107XG5cbiAgICBmdW5jdGlvbiBmbGF0dGVuKGl0ZW0pIHtcbiAgICAgICAgLy8gbm8gbmVlZCB0byBpbmNsdWRlIHVuZGVmaW5lZCB2YWx1ZXMgaW4gb3VyIHF1ZXJ5XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQgIT09IGl0ZW07XG4gICAgfVxuXG4gICAgbGV0IF9yZW1haW5pbmcgPSBsZW47XG4gICAgbGV0IGhhc09uZSA9IGZhbHNlO1xuICAgIGNvbnN0IHBhcmFtcyA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgICAgY29uc3QgbW9kID0gbW9kZWxzTWFwW2ldO1xuICAgICAgICBsZXQgc2VsZWN0ID0gbW9kLm9wdGlvbnMuc2VsZWN0O1xuICAgICAgICBjb25zdCBtYXRjaCA9IF9mb3JtYXRNYXRjaChtb2QubWF0Y2gpO1xuXG4gICAgICAgIGxldCBpZHMgPSB1dGlscy5hcnJheS5mbGF0dGVuKG1vZC5pZHMsIGZsYXR0ZW4pO1xuICAgICAgICBpZHMgPSB1dGlscy5hcnJheS51bmlxdWUoaWRzKTtcblxuICAgICAgICBjb25zdCBhc3NpZ25tZW50T3B0cyA9IHt9O1xuICAgICAgICBhc3NpZ25tZW50T3B0cy5zb3J0ID0gZ2V0KG1vZCwgJ29wdGlvbnMub3B0aW9ucy5zb3J0Jywgdm9pZCAwKTtcbiAgICAgICAgYXNzaWdubWVudE9wdHMuZXhjbHVkZUlkID0gZXhjbHVkZUlkUmVnLnRlc3Qoc2VsZWN0KSB8fCAoc2VsZWN0ICYmIHNlbGVjdC5faWQgPT09IDApO1xuXG4gICAgICAgIGlmIChpZHMubGVuZ3RoID09PSAwIHx8IGlkcy5ldmVyeSh1dGlscy5pc051bGxPclVuZGVmaW5lZCkpIHtcbiAgICAgICAgICAgIC8vIEVuc3VyZSB0aGF0IHdlIHNldCBwb3B1bGF0ZSB2aXJ0dWFscyB0byAwIG9yIGVtcHR5IGFycmF5IGV2ZW5cbiAgICAgICAgICAgIC8vIGlmIHdlIGRvbid0IGFjdHVhbGx5IGV4ZWN1dGUgYSBxdWVyeSBiZWNhdXNlIHRoZXkgZG9uJ3QgaGF2ZVxuICAgICAgICAgICAgLy8gYSB2YWx1ZSBieSBkZWZhdWx0LiBTZWUgZ2gtNzczMSwgZ2gtODIzMFxuICAgICAgICAgICAgLS1fcmVtYWluaW5nO1xuICAgICAgICAgICAgaWYgKG1vZC5jb3VudCB8fCBtb2QuaXNWaXJ0dWFsKSB7XG4gICAgICAgICAgICAgICAgX2Fzc2lnbihtb2RlbCwgW10sIG1vZCwgYXNzaWdubWVudE9wdHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBoYXNPbmUgPSB0cnVlO1xuICAgICAgICBpZiAobW9kLmZvcmVpZ25GaWVsZC5zaXplID09PSAxKSB7XG4gICAgICAgICAgICBjb25zdCBmb3JlaWduRmllbGQgPSBBcnJheS5mcm9tKG1vZC5mb3JlaWduRmllbGQpWzBdO1xuICAgICAgICAgICAgY29uc3QgZm9yZWlnblNjaGVtYVR5cGUgPSBtb2QubW9kZWwuc2NoZW1hLnBhdGgoZm9yZWlnbkZpZWxkKTtcbiAgICAgICAgICAgIGlmIChmb3JlaWduRmllbGQgIT09ICdfaWQnIHx8ICFtYXRjaFsnX2lkJ10pIHtcbiAgICAgICAgICAgICAgICBpZHMgPSBfZmlsdGVySW52YWxpZElkcyhpZHMsIGZvcmVpZ25TY2hlbWFUeXBlLCBtb2Qub3B0aW9ucy5za2lwSW52YWxpZElkcyk7XG4gICAgICAgICAgICAgICAgbWF0Y2hbZm9yZWlnbkZpZWxkXSA9IHsgJGluOiBpZHMgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0ICRvciA9IFtdO1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkobWF0Y2guJG9yKSkge1xuICAgICAgICAgICAgICAgIG1hdGNoLiRhbmQgPSBbeyAkb3I6IG1hdGNoLiRvciB9LCB7ICRvcjogJG9yIH1dO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBtYXRjaC4kb3I7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1hdGNoLiRvciA9ICRvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoY29uc3QgZm9yZWlnbkZpZWxkIG9mIG1vZC5mb3JlaWduRmllbGQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZm9yZWlnbkZpZWxkICE9PSAnX2lkJyB8fCAhbWF0Y2hbJ19pZCddKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvcmVpZ25TY2hlbWFUeXBlID0gbW9kLm1vZGVsLnNjaGVtYS5wYXRoKGZvcmVpZ25GaWVsZCk7XG4gICAgICAgICAgICAgICAgICAgIGlkcyA9IF9maWx0ZXJJbnZhbGlkSWRzKGlkcywgZm9yZWlnblNjaGVtYVR5cGUsIG1vZC5vcHRpb25zLnNraXBJbnZhbGlkSWRzKTtcbiAgICAgICAgICAgICAgICAgICAgJG9yLnB1c2goeyBbZm9yZWlnbkZpZWxkXTogeyAkaW46IGlkcyB9IH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhc3NpZ25tZW50T3B0cy5leGNsdWRlSWQpIHtcbiAgICAgICAgICAgIC8vIG92ZXJyaWRlIHRoZSBleGNsdXNpb24gZnJvbSB0aGUgcXVlcnkgc28gd2UgY2FuIHVzZSB0aGUgX2lkXG4gICAgICAgICAgICAvLyBmb3IgZG9jdW1lbnQgbWF0Y2hpbmcgZHVyaW5nIGFzc2lnbm1lbnQuIHdlJ2xsIGRlbGV0ZSB0aGVcbiAgICAgICAgICAgIC8vIF9pZCBiYWNrIG9mZiBiZWZvcmUgcmV0dXJuaW5nIHRoZSByZXN1bHQuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHNlbGVjdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBzZWxlY3QgPSBzZWxlY3QucmVwbGFjZShleGNsdWRlSWRSZWdHbG9iYWwsICcgJyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIHByZXNlcnZlIG9yaWdpbmFsIHNlbGVjdCBjb25kaXRpb25zIGJ5IGNvcHlpbmdcbiAgICAgICAgICAgICAgICBzZWxlY3QgPSB1dGlscy5vYmplY3Quc2hhbGxvd0NvcHkoc2VsZWN0KTtcbiAgICAgICAgICAgICAgICBkZWxldGUgc2VsZWN0Ll9pZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChtb2Qub3B0aW9ucy5vcHRpb25zICYmIG1vZC5vcHRpb25zLm9wdGlvbnMubGltaXQgIT0gbnVsbCkge1xuICAgICAgICAgICAgYXNzaWdubWVudE9wdHMub3JpZ2luYWxMaW1pdCA9IG1vZC5vcHRpb25zLm9wdGlvbnMubGltaXQ7XG4gICAgICAgIH0gZWxzZSBpZiAobW9kLm9wdGlvbnMubGltaXQgIT0gbnVsbCkge1xuICAgICAgICAgICAgYXNzaWdubWVudE9wdHMub3JpZ2luYWxMaW1pdCA9IG1vZC5vcHRpb25zLmxpbWl0O1xuICAgICAgICB9XG5cbiAgICAgICAgcGFyYW1zLnB1c2goW21vZCwgbWF0Y2gsIHNlbGVjdCwgYXNzaWdubWVudE9wdHMsIF9uZXh0XSk7XG4gICAgfVxuXG4gICAgaWYgKCFoYXNPbmUpIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBhcnIgb2YgcGFyYW1zKSB7XG4gICAgICAgIF9leGVjUG9wdWxhdGVRdWVyeS5hcHBseShudWxsLCBhcnIpO1xuICAgIH1cblxuICAgIC8qKkBwYXJhbSB7RXJyb3J9IGVyclxuICAgICAqIEBwYXJhbSB7UXVlcnlJdGVtfSBxdWVyeUl0ZW1cbiAgICAgKiovXG4gICAgZnVuY3Rpb24gX25leHQoZXJyLCBxdWVyeUl0ZW0pIHtcbiAgICAgICAgaWYgKGVyciAhPSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyLCBudWxsKTtcbiAgICAgICAgfVxuICAgICAgICBpZihxdWVyeUl0ZW0pIHtcbiAgICAgICAgICAgIHF1ZXJpZXMucHVzaCAocXVlcnlJdGVtKTtcbiAgICAgICAgICAgIHF1ZXJ5SXRlbS5hc3NpZ24gPSBmdW5jdGlvbihuZXdWYWxzPXZhbHMpe1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgYXJyIG9mIHBhcmFtcykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtb2QgPSBhcnJbMF07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFzc2lnbm1lbnRPcHRzID0gYXJyWzNdO1xuICAgICAgICAgICAgICAgICAgICBfYXNzaWduKG1vZGVsLCBuZXdWYWxzLCBtb2QsIGFzc2lnbm1lbnRPcHRzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFscyA9IHZhbHMuY29uY2F0KHF1ZXJ5SXRlbS5yZXN1bHRzKTtcbiAgICAgICAgaWYgKC0tX3JlbWFpbmluZyA9PT0gMCkge1xuICAgICAgICAgICAgX2RvbmUoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9kb25lKCkge1xuICAgICAgICAvKmZvciAoY29uc3QgYXJyIG9mIHBhcmFtcykge1xuICAgICAgICAgICAgY29uc3QgbW9kID0gYXJyWzBdO1xuICAgICAgICAgICAgY29uc3QgYXNzaWdubWVudE9wdHMgPSBhcnJbM107XG4gICAgICAgICAgICBfYXNzaWduKG1vZGVsLCB2YWxzLCBtb2QsIGFzc2lnbm1lbnRPcHRzKTtcbiAgICAgICAgfSovXG4gICAgICAgIGNhbGxiYWNrKG51bGwscXVlcmllcyk7XG4gICAgfVxufVxuXG4vKiFcbiAqIGlnbm9yZVxuICovXG5cbmZ1bmN0aW9uIF9leGVjUG9wdWxhdGVRdWVyeShtb2QsIG1hdGNoLCBzZWxlY3QsIGFzc2lnbm1lbnRPcHRzLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IHN1YlBvcHVsYXRlID0gdXRpbHMuY2xvbmUobW9kLm9wdGlvbnMucG9wdWxhdGUpO1xuXG4gICAgY29uc3QgcXVlcnlPcHRpb25zID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICAgIHNraXA6IG1vZC5vcHRpb25zLnNraXAsXG4gICAgICAgIGxpbWl0OiBtb2Qub3B0aW9ucy5saW1pdCxcbiAgICAgICAgcGVyRG9jdW1lbnRMaW1pdDogbW9kLm9wdGlvbnMucGVyRG9jdW1lbnRMaW1pdFxuICAgIH0sIG1vZC5vcHRpb25zLm9wdGlvbnMpO1xuXG4gICAgaWYgKG1vZC5jb3VudCkge1xuICAgICAgICBkZWxldGUgcXVlcnlPcHRpb25zLnNraXA7XG4gICAgfVxuXG4gICAgaWYgKHF1ZXJ5T3B0aW9ucy5wZXJEb2N1bWVudExpbWl0ICE9IG51bGwpIHtcbiAgICAgICAgcXVlcnlPcHRpb25zLmxpbWl0ID0gcXVlcnlPcHRpb25zLnBlckRvY3VtZW50TGltaXQ7XG4gICAgICAgIGRlbGV0ZSBxdWVyeU9wdGlvbnMucGVyRG9jdW1lbnRMaW1pdDtcbiAgICB9IGVsc2UgaWYgKHF1ZXJ5T3B0aW9ucy5saW1pdCAhPSBudWxsKSB7XG4gICAgICAgIHF1ZXJ5T3B0aW9ucy5saW1pdCA9IHF1ZXJ5T3B0aW9ucy5saW1pdCAqIG1vZC5pZHMubGVuZ3RoO1xuICAgIH1cblxuICAgIGNvbnN0IHF1ZXJ5ID0gbW9kLm1vZGVsLmZpbmQobWF0Y2gsIHNlbGVjdCwgcXVlcnlPcHRpb25zKTtcbiAgICAvLyBJZiB3ZSdyZSBkb2luZyB2aXJ0dWFsIHBvcHVsYXRlIGFuZCBwcm9qZWN0aW9uIGlzIGluY2x1c2l2ZSBhbmQgZm9yZWlnblxuICAgIC8vIGZpZWxkIGlzIG5vdCBzZWxlY3RlZCwgYXV0b21hdGljYWxseSBzZWxlY3QgaXQgYmVjYXVzZSBtb25nb29zZSBuZWVkcyBpdC5cbiAgICAvLyBJZiBwcm9qZWN0aW9uIGlzIGV4Y2x1c2l2ZSBhbmQgY2xpZW50IGV4cGxpY2l0bHkgdW5zZWxlY3RlZCB0aGUgZm9yZWlnblxuICAgIC8vIGZpZWxkLCB0aGF0J3MgdGhlIGNsaWVudCdzIGZhdWx0LlxuICAgIGZvciAoY29uc3QgZm9yZWlnbkZpZWxkIG9mIG1vZC5mb3JlaWduRmllbGQpIHtcbiAgICAgICAgaWYgKGZvcmVpZ25GaWVsZCAhPT0gJ19pZCcgJiYgcXVlcnkuc2VsZWN0ZWRJbmNsdXNpdmVseSgpICYmXG4gICAgICAgICAgICAhaXNQYXRoU2VsZWN0ZWRJbmNsdXNpdmUocXVlcnkuX2ZpZWxkcywgZm9yZWlnbkZpZWxkKSkge1xuICAgICAgICAgICAgcXVlcnkuc2VsZWN0KGZvcmVpZ25GaWVsZCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJZiB1c2luZyBjb3VudCwgc3RpbGwgbmVlZCB0aGUgYGZvcmVpZ25GaWVsZGAgc28gd2UgY2FuIG1hdGNoIGNvdW50c1xuICAgIC8vIHRvIGRvY3VtZW50cywgb3RoZXJ3aXNlIHdlIHdvdWxkIG5lZWQgYSBzZXBhcmF0ZSBgY291bnQoKWAgZm9yIGV2ZXJ5IGRvYy5cbiAgICBpZiAobW9kLmNvdW50KSB7XG4gICAgICAgIGZvciAoY29uc3QgZm9yZWlnbkZpZWxkIG9mIG1vZC5mb3JlaWduRmllbGQpIHtcbiAgICAgICAgICAgIHF1ZXJ5LnNlbGVjdChmb3JlaWduRmllbGQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gSWYgd2UgbmVlZCB0byBzdWItcG9wdWxhdGUsIGNhbGwgcG9wdWxhdGUgcmVjdXJzaXZlbHlcbiAgICBpZiAoc3ViUG9wdWxhdGUpIHtcbiAgICAgICAgcXVlcnkucG9wdWxhdGUoc3ViUG9wdWxhdGUpO1xuICAgIH1cbiAgICAvL2NhbGxiYWNrKG51bGwscXVlcnkpO1xuXG4gICAgcXVlcnkuZXhlYygoZXJyLHFSZXN1bHRzKT0+e1xuICAgICAgICBpZihlcnIpXG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwse1xuICAgICAgICAgICAgbW9kLFxuICAgICAgICAgICAgYXNzaWdubWVudE9wdHMsXG4gICAgICAgICAgICBxdWVyeTpxdWVyeSxcbiAgICAgICAgICAgIHJlc3VsdHM6cVJlc3VsdHMsXG4gICAgICAgICAgICBhc3NpZ24odmFscyl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9hc3NpZ24obW9kLm1vZGVsLCB2YWxzLCBtb2QsIGFzc2lnbm1lbnRPcHRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cbi8qIVxuICogTWFrZSBzdXJlIGB0aGlzYCBpcyBhIG1vZGVsXG4gKi9cblxuZnVuY3Rpb24gX2NoZWNrQ29udGV4dChjdHgsIGZuTmFtZSkge1xuICAgIC8vIENoZWNrIGNvbnRleHQsIGJlY2F1c2UgaXQgaXMgZWFzeSB0byBtaXN0YWtlbmx5IHR5cGVcbiAgICAvLyBgbmV3IE1vZGVsLmRpc2NyaW1pbmF0b3IoKWAgYW5kIGdldCBhbiBpbmNvbXByZWhlbnNpYmxlIGVycm9yXG4gICAgaWYgKGN0eCA9PSBudWxsIHx8IGN0eCA9PT0gZ2xvYmFsKSB7XG4gICAgICAgIHRocm93IG5ldyBNb25nb29zZUVycm9yKCdgTW9kZWwuJyArIGZuTmFtZSArICcoKWAgY2Fubm90IHJ1biB3aXRob3V0IGEgJyArXG4gICAgICAgICAgICAnbW9kZWwgYXMgYHRoaXNgLiBNYWtlIHN1cmUgeW91IGFyZSBjYWxsaW5nIGBNeU1vZGVsLicgKyBmbk5hbWUgKyAnKClgICcgK1xuICAgICAgICAgICAgJ3doZXJlIGBNeU1vZGVsYCBpcyBhIE1vbmdvb3NlIG1vZGVsLicpO1xuICAgIH0gZWxzZSBpZiAoY3R4W21vZGVsU3ltYm9sXSA9PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBNb25nb29zZUVycm9yKCdgTW9kZWwuJyArIGZuTmFtZSArICcoKWAgY2Fubm90IHJ1biB3aXRob3V0IGEgJyArXG4gICAgICAgICAgICAnbW9kZWwgYXMgYHRoaXNgLiBNYWtlIHN1cmUgeW91IGFyZSBub3QgY2FsbGluZyAnICtcbiAgICAgICAgICAgICdgbmV3IE1vZGVsLicgKyBmbk5hbWUgKyAnKClgJyk7XG4gICAgfVxufVxuXG4vKiFcbiAqIEZvcm1hdCBgbW9kLm1hdGNoYCBnaXZlbiB0aGF0IGl0IG1heSBiZSBhbiBhcnJheSB0aGF0IHdlIG5lZWQgdG8gJG9yIGlmXG4gKiB0aGUgY2xpZW50IGhhcyBtdWx0aXBsZSBkb2NzIHdpdGggbWF0Y2ggZnVuY3Rpb25zXG4gKi9cblxuZnVuY3Rpb24gX2Zvcm1hdE1hdGNoKG1hdGNoKSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkobWF0Y2gpKSB7XG4gICAgICAgIGlmIChtYXRjaC5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICByZXR1cm4geyAkb3I6IFtdLmNvbmNhdChtYXRjaC5tYXAobSA9PiBPYmplY3QuYXNzaWduKHt9LCBtKSkpIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIG1hdGNoWzBdKTtcbiAgICB9XG4gICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIG1hdGNoKTtcbn1cblxuZnVuY3Rpb24gX2Fzc2lnbihtb2RlbCwgdmFscywgbW9kLCBhc3NpZ25tZW50T3B0cykge1xuICAgIGNvbnN0IG9wdGlvbnMgPSBtb2Qub3B0aW9ucztcbiAgICBjb25zdCBpc1ZpcnR1YWwgPSBtb2QuaXNWaXJ0dWFsO1xuICAgIGNvbnN0IGp1c3RPbmUgPSBtb2QuanVzdE9uZTtcbiAgICBsZXQgX3ZhbDtcbiAgICBjb25zdCBsZWFuID0gZ2V0KG9wdGlvbnMsICdvcHRpb25zLmxlYW4nLCBmYWxzZSk7XG4gICAgY29uc3QgcHJvamVjdGlvbiA9IHBhcnNlUHJvamVjdGlvbihnZXQob3B0aW9ucywgJ3NlbGVjdCcsIG51bGwpLCB0cnVlKSB8fFxuICAgICAgICBwYXJzZVByb2plY3Rpb24oZ2V0KG9wdGlvbnMsICdvcHRpb25zLnNlbGVjdCcsIG51bGwpLCB0cnVlKTtcbiAgICBjb25zdCBsZW4gPSB2YWxzLmxlbmd0aDtcbiAgICBjb25zdCByYXdPcmRlciA9IHt9O1xuICAgIGNvbnN0IHJhd0RvY3MgPSB7fTtcbiAgICBsZXQga2V5O1xuICAgIGxldCB2YWw7XG5cbiAgICAvLyBDbG9uZSBiZWNhdXNlIGBhc3NpZ25SYXdEb2NzVG9JZFN0cnVjdHVyZWAgd2lsbCBtdXRhdGUgdGhlIGFycmF5XG4gICAgY29uc3QgYWxsSWRzID0gdXRpbHMuY2xvbmUobW9kLmFsbElkcyk7XG5cbiAgICAvLyBvcHRpbWl6YXRpb246XG4gICAgLy8gcmVjb3JkIHRoZSBkb2N1bWVudCBwb3NpdGlvbnMgYXMgcmV0dXJuZWQgYnlcbiAgICAvLyB0aGUgcXVlcnkgcmVzdWx0LlxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgdmFsID0gdmFsc1tpXTtcbiAgICAgICAgaWYgKHZhbCA9PSBudWxsKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGNvbnN0IGZvcmVpZ25GaWVsZCBvZiBtb2QuZm9yZWlnbkZpZWxkKSB7XG4gICAgICAgICAgICBfdmFsID0gdXRpbHMuZ2V0VmFsdWUoZm9yZWlnbkZpZWxkLCB2YWwpO1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoX3ZhbCkpIHtcbiAgICAgICAgICAgICAgICBfdmFsID0gdXRpbHMuYXJyYXkuZmxhdHRlbihfdmFsKTtcbiAgICAgICAgICAgICAgICBjb25zdCBfdmFsTGVuZ3RoID0gX3ZhbC5sZW5ndGg7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBfdmFsTGVuZ3RoOyArK2opIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IF9fdmFsID0gX3ZhbFtqXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKF9fdmFsIGluc3RhbmNlb2YgRG9jdW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9fdmFsID0gX192YWwuX2lkO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGtleSA9IFN0cmluZyhfX3ZhbCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyYXdEb2NzW2tleV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHJhd0RvY3Nba2V5XSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByYXdEb2NzW2tleV0ucHVzaCh2YWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhd09yZGVyW2tleV0ucHVzaChpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmF3RG9jc1trZXldID0gW3Jhd0RvY3Nba2V5XSwgdmFsXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByYXdPcmRlcltrZXldID0gW3Jhd09yZGVyW2tleV0sIGldO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzVmlydHVhbCAmJiAhanVzdE9uZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhd0RvY3Nba2V5XSA9IFt2YWxdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhd09yZGVyW2tleV0gPSBbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhd0RvY3Nba2V5XSA9IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByYXdPcmRlcltrZXldID0gaTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKF92YWwgaW5zdGFuY2VvZiBEb2N1bWVudCkge1xuICAgICAgICAgICAgICAgICAgICBfdmFsID0gX3ZhbC5faWQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGtleSA9IFN0cmluZyhfdmFsKTtcbiAgICAgICAgICAgICAgICBpZiAocmF3RG9jc1trZXldKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHJhd0RvY3Nba2V5XSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJhd0RvY3Nba2V5XS5wdXNoKHZhbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByYXdPcmRlcltrZXldLnB1c2goaSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByYXdEb2NzW2tleV0gPSBbcmF3RG9jc1trZXldLCB2YWxdO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmF3T3JkZXJba2V5XSA9IFtyYXdPcmRlcltrZXldLCBpXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJhd0RvY3Nba2V5XSA9IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgcmF3T3JkZXJba2V5XSA9IGk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gZmxhZyBlYWNoIGFzIHJlc3VsdCBvZiBwb3B1bGF0aW9uXG4gICAgICAgICAgICBpZiAobGVhbikge1xuICAgICAgICAgICAgICAgIGxlYW5Qb3B1bGF0ZU1hcC5zZXQodmFsLCBtb2QubW9kZWwpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YWwuJF9fLndhc1BvcHVsYXRlZCA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGdoLTg0NjA6IGlmIHVzZXIgdXNlZCBgLWZvcmVpZ25GaWVsZGAsIGFzc3VtZSB0aGlzIG1lYW5zIHRoZXlcbiAgICAgICAgICAgIC8vIHdhbnQgdGhlIGZvcmVpZ24gZmllbGQgdW5zZXQgZXZlbiBpZiBpdCBpc24ndCBleGNsdWRlZCBpbiB0aGUgcXVlcnkuXG4gICAgICAgICAgICBpZiAocHJvamVjdGlvbiAhPSBudWxsICYmIHByb2plY3Rpb24uaGFzT3duUHJvcGVydHkoJy0nICsgZm9yZWlnbkZpZWxkKSkge1xuICAgICAgICAgICAgICAgIGlmICh2YWwuJF9fICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsLnNldChmb3JlaWduRmllbGQsIHZvaWQgMCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbXBhdGgudW5zZXQoZm9yZWlnbkZpZWxkLCB2YWwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzc2lnblZhbHMoe1xuICAgICAgICBvcmlnaW5hbE1vZGVsOiBtb2RlbCxcbiAgICAgICAgLy8gSWYgdmlydHVhbCwgbWFrZSBzdXJlIHRvIG5vdCBtdXRhdGUgb3JpZ2luYWwgZmllbGRcbiAgICAgICAgcmF3SWRzOiBtb2QuaXNWaXJ0dWFsID8gYWxsSWRzIDogbW9kLmFsbElkcyxcbiAgICAgICAgYWxsSWRzOiBhbGxJZHMsXG4gICAgICAgIGZvcmVpZ25GaWVsZDogbW9kLmZvcmVpZ25GaWVsZCxcbiAgICAgICAgcmF3RG9jczogcmF3RG9jcyxcbiAgICAgICAgcmF3T3JkZXI6IHJhd09yZGVyLFxuICAgICAgICBkb2NzOiBtb2QuZG9jcyxcbiAgICAgICAgcGF0aDogb3B0aW9ucy5wYXRoLFxuICAgICAgICBvcHRpb25zOiBhc3NpZ25tZW50T3B0cyxcbiAgICAgICAganVzdE9uZTogbW9kLmp1c3RPbmUsXG4gICAgICAgIGlzVmlydHVhbDogbW9kLmlzVmlydHVhbCxcbiAgICAgICAgYWxsT3B0aW9uczogbW9kLFxuICAgICAgICBsZWFuOiBsZWFuLFxuICAgICAgICB2aXJ0dWFsOiBtb2QudmlydHVhbCxcbiAgICAgICAgY291bnQ6IG1vZC5jb3VudCxcbiAgICAgICAgbWF0Y2g6IG1vZC5tYXRjaFxuICAgIH0pO1xufVxuXG4vKiFcbiAqIE9wdGlvbmFsbHkgZmlsdGVyIG91dCBpbnZhbGlkIGlkcyB0aGF0IGRvbid0IGNvbmZvcm0gdG8gZm9yZWlnbiBmaWVsZCdzIHNjaGVtYVxuICogdG8gYXZvaWQgY2FzdCBlcnJvcnMgKGdoLTc3MDYpXG4gKi9cblxuZnVuY3Rpb24gX2ZpbHRlckludmFsaWRJZHMoaWRzLCBmb3JlaWduU2NoZW1hVHlwZSwgc2tpcEludmFsaWRJZHMpIHtcbiAgICBpZHMgPSBpZHMuZmlsdGVyKHYgPT4gISh2IGluc3RhbmNlb2YgU2tpcFBvcHVsYXRlVmFsdWUpKTtcbiAgICBpZiAoIXNraXBJbnZhbGlkSWRzKSB7XG4gICAgICAgIHJldHVybiBpZHM7XG4gICAgfVxuICAgIHJldHVybiBpZHMuZmlsdGVyKGlkID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGZvcmVpZ25TY2hlbWFUeXBlLmNhc3QoaWQpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfSk7XG59Il19