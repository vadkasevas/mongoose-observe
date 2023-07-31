"use strict";var _interopRequireDefault3 = require("@babel/runtime/helpers/interopRequireDefault");var _interopRequireDefault2 = _interopRequireDefault3(require("@babel/runtime/helpers/interopRequireDefault"));Object.defineProperty(exports, "__esModule", { value: true });exports.modelPopulate = exports._execPopulateQuery = exports.populate = undefined;var _defineProperty2 = require("@babel/runtime/helpers/defineProperty");var _defineProperty = (0, _interopRequireDefault2["default"])(_defineProperty2)["default"];function _createForOfIteratorHelper(o, allowArrayLike) {var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];if (!it) {if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {if (it) o = it;var i = 0;var F = function F() {};return { s: F, n: function n() {if (i >= o.length) return { done: true };return { done: false, value: o[i++] };}, e: function e(_e) {throw _e;}, f: F };}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");}var normalCompletion = true,didErr = false,err;return { s: function s() {it = it.call(o);}, n: function n() {var step = it.next();normalCompletion = step.done;return step;}, e: function e(_e2) {didErr = true;err = _e2;}, f: function f() {try {if (!normalCompletion && it["return"] != null) it["return"]();} finally {if (didErr) throw err;}} };}function _unsupportedIterableToArray(o, minLen) {if (!o) return;if (typeof o === "string") return _arrayLikeToArray(o, minLen);var n = Object.prototype.toString.call(o).slice(8, -1);if (n === "Object" && o.constructor) n = o.constructor.name;if (n === "Map" || n === "Set") return Array.from(o);if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);}function _arrayLikeToArray(arr, len) {if (len == null || len > arr.length) len = arr.length;for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];return arr2;}var path = require('path');
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
      }var _iterator = _createForOfIteratorHelper(
          mod.foreignField),_step;try {for (_iterator.s(); !(_step = _iterator.n()).done;) {var _foreignField = _step.value;
          if (_foreignField !== '_id' || !match['_id']) {
            var _foreignSchemaType = mod.model.schema.path(_foreignField);
            ids = _filterInvalidIds(ids, _foreignSchemaType, mod.options.skipInvalidIds);
            $or.push(_defineProperty({}, _foreignField, { $in: ids }));
          }
        }} catch (err) {_iterator.e(err);} finally {_iterator.f();}
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
      queryItem.assign = function () {var newVals = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : vals;var _iterator2 = _createForOfIteratorHelper(
            params),_step2;try {for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {var _arr = _step2.value;
            var _mod = _arr[0];
            var _assignmentOpts = _arr[3];
            _assign(model, newVals, _mod, _assignmentOpts);
          }} catch (err) {_iterator2.e(err);} finally {_iterator2.f();}
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

  var query = mod.model.find(match, select, queryOptions);
  // If we're doing virtual populate and projection is inclusive and foreign
  // field is not selected, automatically select it because mongoose needs it.
  // If projection is exclusive and client explicitly unselected the foreign
  // field, that's the client's fault.
  var _iterator3 = _createForOfIteratorHelper(mod.foreignField),_step3;try {for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {var _foreignField2 = _step3.value;
      if (_foreignField2 !== '_id' && query.selectedInclusively() &&
      !isPathSelectedInclusive(query._fields, _foreignField2)) {
        query.select(_foreignField2);
      }
    }

    // If using count, still need the `foreignField` so we can match counts
    // to documents, otherwise we would need a separate `count()` for every doc.
  } catch (err) {_iterator3.e(err);} finally {_iterator3.f();}if (mod.count) {var _iterator4 = _createForOfIteratorHelper(
        mod.foreignField),_step4;try {for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {var foreignField = _step4.value;
        query.select(foreignField);
      }} catch (err) {_iterator4.e(err);} finally {_iterator4.f();}
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
    }var _iterator5 = _createForOfIteratorHelper(
        mod.foreignField),_step5;try {for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {var foreignField = _step5.value;
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
      }} catch (err) {_iterator5.e(err);} finally {_iterator5.f();}
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJwYXRoIiwicmVxdWlyZSIsIm1vbmdvb3NlRGlyIiwicmVzb2x2ZSIsIk1vbmdvb3NlRXJyb3IiLCJnZXRNb2RlbHNNYXBGb3JQb3B1bGF0ZSIsImNvbmNhdCIsImltbWVkaWF0ZSIsInV0aWxzIiwiaXNQYXRoU2VsZWN0ZWRJbmNsdXNpdmUiLCJwYXJzZVByb2plY3Rpb24iLCJsZWFuUG9wdWxhdGVNYXAiLCJwcm9taXNlT3JDYWxsYmFjayIsIm1wYXRoIiwiYXNzaWduVmFscyIsIlNraXBQb3B1bGF0ZVZhbHVlIiwibW9kZWxTeW1ib2wiLCJnZXQiLCJEb2N1bWVudCIsIl8iLCJleHBvcnRzIiwicG9wdWxhdGUiLCJfZXhlY1BvcHVsYXRlUXVlcnkiLCJtb2RlbFBvcHVsYXRlIiwiZG9jcyIsInBhdGhzIiwiY2FsbGJhY2siLCJfdGhpczIiLCJfY2hlY2tDb250ZXh0IiwiX3RoaXMiLCJjYWNoZSIsIiRoYW5kbGVDYWxsYmFja0Vycm9yIiwiY2IiLCIkd3JhcENhbGxiYWNrIiwiX3BvcHVsYXRlIiwiZXZlbnRzIiwibW9kZWwiLCJsZW5ndGgiLCJwZW5kaW5nIiwicXVlcmllcyIsImVhY2giLCJuZXh0IiwiZXJyIiwibmV3UXVlcmllcyIsInF1ZXJ5SXRlbSIsInB1c2giLCJleGNsdWRlSWRSZWciLCJleGNsdWRlSWRSZWdHbG9iYWwiLCJvcHRpb25zIiwiQXJyYXkiLCJpc0FycmF5IiwiZXZlcnkiLCJpc051bGxPclVuZGVmaW5lZCIsIm1vZGVsc01hcCIsImxlbiIsInZhbHMiLCJmbGF0dGVuIiwiaXRlbSIsInVuZGVmaW5lZCIsIl9yZW1haW5pbmciLCJoYXNPbmUiLCJwYXJhbXMiLCJpIiwibW9kIiwic2VsZWN0IiwibWF0Y2giLCJfZm9ybWF0TWF0Y2giLCJpZHMiLCJhcnJheSIsInVuaXF1ZSIsImFzc2lnbm1lbnRPcHRzIiwic29ydCIsImV4Y2x1ZGVJZCIsInRlc3QiLCJfaWQiLCJjb3VudCIsImlzVmlydHVhbCIsIl9hc3NpZ24iLCJmb3JlaWduRmllbGQiLCJzaXplIiwiZnJvbSIsImZvcmVpZ25TY2hlbWFUeXBlIiwic2NoZW1hIiwiX2ZpbHRlckludmFsaWRJZHMiLCJza2lwSW52YWxpZElkcyIsIiRpbiIsIiRvciIsIiRhbmQiLCJfaXRlcmF0b3IiLCJfY3JlYXRlRm9yT2ZJdGVyYXRvckhlbHBlciIsIl9zdGVwIiwicyIsIm4iLCJkb25lIiwidmFsdWUiLCJfZGVmaW5lUHJvcGVydHkiLCJlIiwiZiIsInJlcGxhY2UiLCJvYmplY3QiLCJzaGFsbG93Q29weSIsImxpbWl0Iiwib3JpZ2luYWxMaW1pdCIsIl9uZXh0IiwiX2kiLCJfcGFyYW1zIiwiYXJyIiwiYXBwbHkiLCJhc3NpZ24iLCJuZXdWYWxzIiwiYXJndW1lbnRzIiwiX2l0ZXJhdG9yMiIsIl9zdGVwMiIsInJlc3VsdHMiLCJfZG9uZSIsInN1YlBvcHVsYXRlIiwiY2xvbmUiLCJxdWVyeU9wdGlvbnMiLCJPYmplY3QiLCJza2lwIiwicGVyRG9jdW1lbnRMaW1pdCIsInF1ZXJ5IiwiZmluZCIsIl9pdGVyYXRvcjMiLCJfc3RlcDMiLCJzZWxlY3RlZEluY2x1c2l2ZWx5IiwiX2ZpZWxkcyIsIl9pdGVyYXRvcjQiLCJfc3RlcDQiLCJleGVjIiwicVJlc3VsdHMiLCJjdHgiLCJmbk5hbWUiLCJnbG9iYWwiLCJtYXAiLCJtIiwianVzdE9uZSIsIl92YWwiLCJsZWFuIiwicHJvamVjdGlvbiIsInJhd09yZGVyIiwicmF3RG9jcyIsImtleSIsInZhbCIsImFsbElkcyIsIl9pdGVyYXRvcjUiLCJfc3RlcDUiLCJnZXRWYWx1ZSIsIl92YWxMZW5ndGgiLCJqIiwiX192YWwiLCJTdHJpbmciLCJzZXQiLCIkX18iLCJ3YXNQb3B1bGF0ZWQiLCJoYXNPd25Qcm9wZXJ0eSIsInVuc2V0Iiwib3JpZ2luYWxNb2RlbCIsInJhd0lkcyIsImFsbE9wdGlvbnMiLCJ2aXJ0dWFsIiwiZmlsdGVyIiwidiIsImlkIiwiY2FzdCJdLCJzb3VyY2VzIjpbIi4uL3NyYy9tb25nb29zZVV0aWxzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHBhdGggPSByZXF1aXJlKCAncGF0aCcgKTtcbnZhciBtb25nb29zZURpciA9IHBhdGgucmVzb2x2ZShyZXF1aXJlLnJlc29sdmUoJ21vbmdvb3NlJyksJy4uJyk7XG5jb25zdCBNb25nb29zZUVycm9yID0gcmVxdWlyZSgnbW9uZ29vc2UvbGliL2Vycm9yL2luZGV4Jyk7XG5jb25zdCBnZXRNb2RlbHNNYXBGb3JQb3B1bGF0ZSA9IHJlcXVpcmUoYCR7bW9uZ29vc2VEaXJ9L2xpYi9oZWxwZXJzL3BvcHVsYXRlL2dldE1vZGVsc01hcEZvclBvcHVsYXRlYCk7XG5jb25zdCBpbW1lZGlhdGUgPSByZXF1aXJlKCdtb25nb29zZS9saWIvaGVscGVycy9pbW1lZGlhdGUnKTtcbmNvbnN0IHV0aWxzID0gcmVxdWlyZSgnbW9uZ29vc2UvbGliL3V0aWxzJyk7XG5jb25zdCBpc1BhdGhTZWxlY3RlZEluY2x1c2l2ZSA9IHJlcXVpcmUoYCR7bW9uZ29vc2VEaXJ9L2xpYi9oZWxwZXJzL3Byb2plY3Rpb24vaXNQYXRoU2VsZWN0ZWRJbmNsdXNpdmVgKTtcbmNvbnN0IHBhcnNlUHJvamVjdGlvbiA9IHJlcXVpcmUoYCR7bW9uZ29vc2VEaXJ9L2xpYi9oZWxwZXJzL3Byb2plY3Rpb24vcGFyc2VQcm9qZWN0aW9uYCk7XG5jb25zdCBsZWFuUG9wdWxhdGVNYXAgPSByZXF1aXJlKGAke21vbmdvb3NlRGlyfS9saWIvaGVscGVycy9wb3B1bGF0ZS9sZWFuUG9wdWxhdGVNYXBgKTtcbmNvbnN0IHByb21pc2VPckNhbGxiYWNrID0gcmVxdWlyZShgJHttb25nb29zZURpcn0vbGliL2hlbHBlcnMvcHJvbWlzZU9yQ2FsbGJhY2tgKTtcbmNvbnN0IG1wYXRoID0gcmVxdWlyZSgnbXBhdGgnKTtcbmNvbnN0IGFzc2lnblZhbHMgPSByZXF1aXJlKGAke21vbmdvb3NlRGlyfS9saWIvaGVscGVycy9wb3B1bGF0ZS9hc3NpZ25WYWxzYCk7XG5jb25zdCBTa2lwUG9wdWxhdGVWYWx1ZSA9IHJlcXVpcmUoYCR7bW9uZ29vc2VEaXJ9L2xpYi9oZWxwZXJzL3BvcHVsYXRlL1NraXBQb3B1bGF0ZVZhbHVlYCk7XG5jb25zdCBtb2RlbFN5bWJvbCA9IHJlcXVpcmUoYG1vbmdvb3NlL2xpYi9oZWxwZXJzL3N5bWJvbHNgKS5tb2RlbFN5bWJvbDtcbmNvbnN0IGdldCA9IHJlcXVpcmUoYCR7bW9uZ29vc2VEaXJ9L2xpYi9oZWxwZXJzL2dldGApO1xuY29uc3QgRG9jdW1lbnQgPSByZXF1aXJlKCdtb25nb29zZS9saWIvZG9jdW1lbnQnKTtcbmNvbnN0IF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlJyk7XG5leHBvcnQge1xuICAgIHBvcHVsYXRlLFxuICAgIF9leGVjUG9wdWxhdGVRdWVyeSxcbiAgICBtb2RlbFBvcHVsYXRlXG59XG4vKipcbiAqIEBuYW1lIFF1ZXJ5SXRlbVxuICogQGV4dGVuZHMgT2JqZWN0XG4gKiBAcHJvcGVydHkge21vZGVsLlF1ZXJ5fSBxdWVyeVxuICogQHByb3BlcnR5IHtBcnJheTxEb2N1bWVudD59IHJlc3VsdHNcbiAqIEBtZXRob2QgYXNzaWduKHZhbHM6QXJyYXk8RG9jdW1lbnQ+KVxuICogKi9cblxuLyohXG4gKiBQb3B1bGF0ZSBoZWxwZXJcbiAqXG4gKiBAcGFyYW0ge01vZGVsfSBtb2RlbCB0aGUgbW9kZWwgdG8gdXNlXG4gKiBAcGFyYW0ge0RvY3VtZW50fEFycmF5fSBkb2NzIEVpdGhlciBhIHNpbmdsZSBkb2N1bWVudCBvciBhcnJheSBvZiBkb2N1bWVudHMgdG8gcG9wdWxhdGUuXG4gKiBAcGFyYW0ge09iamVjdH0gcGF0aHNcbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtjYihlcnIsZG9jKV0gT3B0aW9uYWwgY2FsbGJhY2ssIGV4ZWN1dGVkIHVwb24gY29tcGxldGlvbi4gUmVjZWl2ZXMgYGVycmAgYW5kIHRoZSBgZG9jKHMpYC5cbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gbW9kZWxQb3B1bGF0ZShkb2NzLCBwYXRocywgY2FsbGJhY2spIHtcbiAgICBfY2hlY2tDb250ZXh0KHRoaXMsICdwb3B1bGF0ZScpO1xuXG4gICAgY29uc3QgX3RoaXMgPSB0aGlzO1xuXG4gICAgLy8gbm9ybWFsaXplZCBwYXRoc1xuICAgIHBhdGhzID0gdXRpbHMucG9wdWxhdGUocGF0aHMpO1xuXG4gICAgLy8gZGF0YSB0aGF0IHNob3VsZCBwZXJzaXN0IGFjcm9zcyBzdWJQb3B1bGF0ZSBjYWxsc1xuICAgIGNvbnN0IGNhY2hlID0ge307XG5cbiAgICBjYWxsYmFjayA9IHRoaXMuJGhhbmRsZUNhbGxiYWNrRXJyb3IoY2FsbGJhY2spO1xuXG4gICAgcmV0dXJuIHByb21pc2VPckNhbGxiYWNrKGNhbGxiYWNrLCBjYiA9PiB7XG4gICAgICAgIGNiID0gdGhpcy4kd3JhcENhbGxiYWNrKGNiKTtcbiAgICAgICAgX3BvcHVsYXRlKF90aGlzLCBkb2NzLCBwYXRocywgY2FjaGUsIGNiKTtcbiAgICB9LCB0aGlzLmV2ZW50cyk7XG59XG5cbmZ1bmN0aW9uIF9wb3B1bGF0ZShtb2RlbCwgZG9jcywgcGF0aHMsIGNhY2hlLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IGxlbmd0aCA9IHBhdGhzLmxlbmd0aDtcbiAgICBsZXQgcGVuZGluZyA9IHBhdGhzLmxlbmd0aDtcblxuICAgIGlmIChsZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgfVxuICAgIGxldCBxdWVyaWVzID0ge307XG4gICAgXy5lYWNoKHBhdGhzLChwYXRoKT0+e1xuICAgICAgICBwb3B1bGF0ZShtb2RlbCwgZG9jcywgcGF0aCwgZnVuY3Rpb24gbmV4dChlcnIsbmV3UXVlcmllcykge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIsIG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXy5lYWNoKG5ld1F1ZXJpZXMsKHF1ZXJ5SXRlbSk9PntcbiAgICAgICAgICAgICAgICBxdWVyaWVzW3BhdGgucGF0aF0gPSBxdWVyaWVzW3BhdGgucGF0aF0gfHwgW107XG4gICAgICAgICAgICAgICAgcXVlcmllc1twYXRoLnBhdGhdLnB1c2gocXVlcnlJdGVtKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKC0tcGVuZGluZykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHF1ZXJpZXMpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuLyohXG4gKiBQb3B1bGF0ZXMgYGRvY3NgXG4gKi9cbmNvbnN0IGV4Y2x1ZGVJZFJlZyA9IC9cXHM/LV9pZFxccz8vO1xuY29uc3QgZXhjbHVkZUlkUmVnR2xvYmFsID0gL1xccz8tX2lkXFxzPy9nO1xuXG5cbmZ1bmN0aW9uIHBvcHVsYXRlKG1vZGVsLCBkb2NzLCBvcHRpb25zLCBjYWxsYmFjaykge1xuICAgIC8vIG5vcm1hbGl6ZSBzaW5nbGUgLyBtdWx0aXBsZSBkb2NzIHBhc3NlZFxuICAgIGlmICghQXJyYXkuaXNBcnJheShkb2NzKSkge1xuICAgICAgICBkb2NzID0gW2RvY3NdO1xuICAgIH1cblxuICAgIGlmIChkb2NzLmxlbmd0aCA9PT0gMCB8fCBkb2NzLmV2ZXJ5KHV0aWxzLmlzTnVsbE9yVW5kZWZpbmVkKSkge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICB9XG5cbiAgICBjb25zdCBtb2RlbHNNYXAgPSBnZXRNb2RlbHNNYXBGb3JQb3B1bGF0ZShtb2RlbCwgZG9jcywgb3B0aW9ucyk7XG5cbiAgICBpZiAobW9kZWxzTWFwIGluc3RhbmNlb2YgTW9uZ29vc2VFcnJvcikge1xuICAgICAgICByZXR1cm4gaW1tZWRpYXRlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2FsbGJhY2sobW9kZWxzTWFwKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgbGVuID0gbW9kZWxzTWFwLmxlbmd0aDtcbiAgICBsZXQgdmFscyA9IFtdO1xuICAgIGxldCBxdWVyaWVzID0gW107XG5cbiAgICBmdW5jdGlvbiBmbGF0dGVuKGl0ZW0pIHtcbiAgICAgICAgLy8gbm8gbmVlZCB0byBpbmNsdWRlIHVuZGVmaW5lZCB2YWx1ZXMgaW4gb3VyIHF1ZXJ5XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQgIT09IGl0ZW07XG4gICAgfVxuXG4gICAgbGV0IF9yZW1haW5pbmcgPSBsZW47XG4gICAgbGV0IGhhc09uZSA9IGZhbHNlO1xuICAgIGNvbnN0IHBhcmFtcyA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgICAgY29uc3QgbW9kID0gbW9kZWxzTWFwW2ldO1xuICAgICAgICBsZXQgc2VsZWN0ID0gbW9kLm9wdGlvbnMuc2VsZWN0O1xuICAgICAgICBjb25zdCBtYXRjaCA9IF9mb3JtYXRNYXRjaChtb2QubWF0Y2gpO1xuXG4gICAgICAgIGxldCBpZHMgPSB1dGlscy5hcnJheS5mbGF0dGVuKG1vZC5pZHMsIGZsYXR0ZW4pO1xuICAgICAgICBpZHMgPSB1dGlscy5hcnJheS51bmlxdWUoaWRzKTtcblxuICAgICAgICBjb25zdCBhc3NpZ25tZW50T3B0cyA9IHt9O1xuICAgICAgICBhc3NpZ25tZW50T3B0cy5zb3J0ID0gZ2V0KG1vZCwgJ29wdGlvbnMub3B0aW9ucy5zb3J0Jywgdm9pZCAwKTtcbiAgICAgICAgYXNzaWdubWVudE9wdHMuZXhjbHVkZUlkID0gZXhjbHVkZUlkUmVnLnRlc3Qoc2VsZWN0KSB8fCAoc2VsZWN0ICYmIHNlbGVjdC5faWQgPT09IDApO1xuXG4gICAgICAgIGlmIChpZHMubGVuZ3RoID09PSAwIHx8IGlkcy5ldmVyeSh1dGlscy5pc051bGxPclVuZGVmaW5lZCkpIHtcbiAgICAgICAgICAgIC8vIEVuc3VyZSB0aGF0IHdlIHNldCBwb3B1bGF0ZSB2aXJ0dWFscyB0byAwIG9yIGVtcHR5IGFycmF5IGV2ZW5cbiAgICAgICAgICAgIC8vIGlmIHdlIGRvbid0IGFjdHVhbGx5IGV4ZWN1dGUgYSBxdWVyeSBiZWNhdXNlIHRoZXkgZG9uJ3QgaGF2ZVxuICAgICAgICAgICAgLy8gYSB2YWx1ZSBieSBkZWZhdWx0LiBTZWUgZ2gtNzczMSwgZ2gtODIzMFxuICAgICAgICAgICAgLS1fcmVtYWluaW5nO1xuICAgICAgICAgICAgaWYgKG1vZC5jb3VudCB8fCBtb2QuaXNWaXJ0dWFsKSB7XG4gICAgICAgICAgICAgICAgX2Fzc2lnbihtb2RlbCwgW10sIG1vZCwgYXNzaWdubWVudE9wdHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBoYXNPbmUgPSB0cnVlO1xuICAgICAgICBpZiAobW9kLmZvcmVpZ25GaWVsZC5zaXplID09PSAxKSB7XG4gICAgICAgICAgICBjb25zdCBmb3JlaWduRmllbGQgPSBBcnJheS5mcm9tKG1vZC5mb3JlaWduRmllbGQpWzBdO1xuICAgICAgICAgICAgY29uc3QgZm9yZWlnblNjaGVtYVR5cGUgPSBtb2QubW9kZWwuc2NoZW1hLnBhdGgoZm9yZWlnbkZpZWxkKTtcbiAgICAgICAgICAgIGlmIChmb3JlaWduRmllbGQgIT09ICdfaWQnIHx8ICFtYXRjaFsnX2lkJ10pIHtcbiAgICAgICAgICAgICAgICBpZHMgPSBfZmlsdGVySW52YWxpZElkcyhpZHMsIGZvcmVpZ25TY2hlbWFUeXBlLCBtb2Qub3B0aW9ucy5za2lwSW52YWxpZElkcyk7XG4gICAgICAgICAgICAgICAgbWF0Y2hbZm9yZWlnbkZpZWxkXSA9IHsgJGluOiBpZHMgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0ICRvciA9IFtdO1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkobWF0Y2guJG9yKSkge1xuICAgICAgICAgICAgICAgIG1hdGNoLiRhbmQgPSBbeyAkb3I6IG1hdGNoLiRvciB9LCB7ICRvcjogJG9yIH1dO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBtYXRjaC4kb3I7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1hdGNoLiRvciA9ICRvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoY29uc3QgZm9yZWlnbkZpZWxkIG9mIG1vZC5mb3JlaWduRmllbGQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZm9yZWlnbkZpZWxkICE9PSAnX2lkJyB8fCAhbWF0Y2hbJ19pZCddKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvcmVpZ25TY2hlbWFUeXBlID0gbW9kLm1vZGVsLnNjaGVtYS5wYXRoKGZvcmVpZ25GaWVsZCk7XG4gICAgICAgICAgICAgICAgICAgIGlkcyA9IF9maWx0ZXJJbnZhbGlkSWRzKGlkcywgZm9yZWlnblNjaGVtYVR5cGUsIG1vZC5vcHRpb25zLnNraXBJbnZhbGlkSWRzKTtcbiAgICAgICAgICAgICAgICAgICAgJG9yLnB1c2goeyBbZm9yZWlnbkZpZWxkXTogeyAkaW46IGlkcyB9IH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhc3NpZ25tZW50T3B0cy5leGNsdWRlSWQpIHtcbiAgICAgICAgICAgIC8vIG92ZXJyaWRlIHRoZSBleGNsdXNpb24gZnJvbSB0aGUgcXVlcnkgc28gd2UgY2FuIHVzZSB0aGUgX2lkXG4gICAgICAgICAgICAvLyBmb3IgZG9jdW1lbnQgbWF0Y2hpbmcgZHVyaW5nIGFzc2lnbm1lbnQuIHdlJ2xsIGRlbGV0ZSB0aGVcbiAgICAgICAgICAgIC8vIF9pZCBiYWNrIG9mZiBiZWZvcmUgcmV0dXJuaW5nIHRoZSByZXN1bHQuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHNlbGVjdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBzZWxlY3QgPSBzZWxlY3QucmVwbGFjZShleGNsdWRlSWRSZWdHbG9iYWwsICcgJyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIHByZXNlcnZlIG9yaWdpbmFsIHNlbGVjdCBjb25kaXRpb25zIGJ5IGNvcHlpbmdcbiAgICAgICAgICAgICAgICBzZWxlY3QgPSB1dGlscy5vYmplY3Quc2hhbGxvd0NvcHkoc2VsZWN0KTtcbiAgICAgICAgICAgICAgICBkZWxldGUgc2VsZWN0Ll9pZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChtb2Qub3B0aW9ucy5vcHRpb25zICYmIG1vZC5vcHRpb25zLm9wdGlvbnMubGltaXQgIT0gbnVsbCkge1xuICAgICAgICAgICAgYXNzaWdubWVudE9wdHMub3JpZ2luYWxMaW1pdCA9IG1vZC5vcHRpb25zLm9wdGlvbnMubGltaXQ7XG4gICAgICAgIH0gZWxzZSBpZiAobW9kLm9wdGlvbnMubGltaXQgIT0gbnVsbCkge1xuICAgICAgICAgICAgYXNzaWdubWVudE9wdHMub3JpZ2luYWxMaW1pdCA9IG1vZC5vcHRpb25zLmxpbWl0O1xuICAgICAgICB9XG5cbiAgICAgICAgcGFyYW1zLnB1c2goW21vZCwgbWF0Y2gsIHNlbGVjdCwgYXNzaWdubWVudE9wdHMsIF9uZXh0XSk7XG4gICAgfVxuXG4gICAgaWYgKCFoYXNPbmUpIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBhcnIgb2YgcGFyYW1zKSB7XG4gICAgICAgIF9leGVjUG9wdWxhdGVRdWVyeS5hcHBseShudWxsLCBhcnIpO1xuICAgIH1cblxuICAgIC8qKkBwYXJhbSB7RXJyb3J9IGVyclxuICAgICAqIEBwYXJhbSB7UXVlcnlJdGVtfSBxdWVyeUl0ZW1cbiAgICAgKiovXG4gICAgZnVuY3Rpb24gX25leHQoZXJyLCBxdWVyeUl0ZW0pIHtcbiAgICAgICAgaWYgKGVyciAhPSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyLCBudWxsKTtcbiAgICAgICAgfVxuICAgICAgICBpZihxdWVyeUl0ZW0pIHtcbiAgICAgICAgICAgIHF1ZXJpZXMucHVzaCAocXVlcnlJdGVtKTtcbiAgICAgICAgICAgIHF1ZXJ5SXRlbS5hc3NpZ24gPSBmdW5jdGlvbihuZXdWYWxzPXZhbHMpe1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgYXJyIG9mIHBhcmFtcykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtb2QgPSBhcnJbMF07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFzc2lnbm1lbnRPcHRzID0gYXJyWzNdO1xuICAgICAgICAgICAgICAgICAgICBfYXNzaWduKG1vZGVsLCBuZXdWYWxzLCBtb2QsIGFzc2lnbm1lbnRPcHRzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFscyA9IHZhbHMuY29uY2F0KHF1ZXJ5SXRlbS5yZXN1bHRzKTtcbiAgICAgICAgaWYgKC0tX3JlbWFpbmluZyA9PT0gMCkge1xuICAgICAgICAgICAgX2RvbmUoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9kb25lKCkge1xuICAgICAgICAvKmZvciAoY29uc3QgYXJyIG9mIHBhcmFtcykge1xuICAgICAgICAgICAgY29uc3QgbW9kID0gYXJyWzBdO1xuICAgICAgICAgICAgY29uc3QgYXNzaWdubWVudE9wdHMgPSBhcnJbM107XG4gICAgICAgICAgICBfYXNzaWduKG1vZGVsLCB2YWxzLCBtb2QsIGFzc2lnbm1lbnRPcHRzKTtcbiAgICAgICAgfSovXG4gICAgICAgIGNhbGxiYWNrKG51bGwscXVlcmllcyk7XG4gICAgfVxufVxuXG4vKiFcbiAqIGlnbm9yZVxuICovXG5cbmZ1bmN0aW9uIF9leGVjUG9wdWxhdGVRdWVyeShtb2QsIG1hdGNoLCBzZWxlY3QsIGFzc2lnbm1lbnRPcHRzLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IHN1YlBvcHVsYXRlID0gdXRpbHMuY2xvbmUobW9kLm9wdGlvbnMucG9wdWxhdGUpO1xuXG4gICAgY29uc3QgcXVlcnlPcHRpb25zID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICAgIHNraXA6IG1vZC5vcHRpb25zLnNraXAsXG4gICAgICAgIGxpbWl0OiBtb2Qub3B0aW9ucy5saW1pdCxcbiAgICAgICAgcGVyRG9jdW1lbnRMaW1pdDogbW9kLm9wdGlvbnMucGVyRG9jdW1lbnRMaW1pdFxuICAgIH0sIG1vZC5vcHRpb25zLm9wdGlvbnMpO1xuXG4gICAgaWYgKG1vZC5jb3VudCkge1xuICAgICAgICBkZWxldGUgcXVlcnlPcHRpb25zLnNraXA7XG4gICAgfVxuXG4gICAgaWYgKHF1ZXJ5T3B0aW9ucy5wZXJEb2N1bWVudExpbWl0ICE9IG51bGwpIHtcbiAgICAgICAgcXVlcnlPcHRpb25zLmxpbWl0ID0gcXVlcnlPcHRpb25zLnBlckRvY3VtZW50TGltaXQ7XG4gICAgICAgIGRlbGV0ZSBxdWVyeU9wdGlvbnMucGVyRG9jdW1lbnRMaW1pdDtcbiAgICB9IGVsc2UgaWYgKHF1ZXJ5T3B0aW9ucy5saW1pdCAhPSBudWxsKSB7XG4gICAgICAgIHF1ZXJ5T3B0aW9ucy5saW1pdCA9IHF1ZXJ5T3B0aW9ucy5saW1pdCAqIG1vZC5pZHMubGVuZ3RoO1xuICAgIH1cblxuICAgIGNvbnN0IHF1ZXJ5ID0gbW9kLm1vZGVsLmZpbmQobWF0Y2gsIHNlbGVjdCwgcXVlcnlPcHRpb25zKTtcbiAgICAvLyBJZiB3ZSdyZSBkb2luZyB2aXJ0dWFsIHBvcHVsYXRlIGFuZCBwcm9qZWN0aW9uIGlzIGluY2x1c2l2ZSBhbmQgZm9yZWlnblxuICAgIC8vIGZpZWxkIGlzIG5vdCBzZWxlY3RlZCwgYXV0b21hdGljYWxseSBzZWxlY3QgaXQgYmVjYXVzZSBtb25nb29zZSBuZWVkcyBpdC5cbiAgICAvLyBJZiBwcm9qZWN0aW9uIGlzIGV4Y2x1c2l2ZSBhbmQgY2xpZW50IGV4cGxpY2l0bHkgdW5zZWxlY3RlZCB0aGUgZm9yZWlnblxuICAgIC8vIGZpZWxkLCB0aGF0J3MgdGhlIGNsaWVudCdzIGZhdWx0LlxuICAgIGZvciAoY29uc3QgZm9yZWlnbkZpZWxkIG9mIG1vZC5mb3JlaWduRmllbGQpIHtcbiAgICAgICAgaWYgKGZvcmVpZ25GaWVsZCAhPT0gJ19pZCcgJiYgcXVlcnkuc2VsZWN0ZWRJbmNsdXNpdmVseSgpICYmXG4gICAgICAgICAgICAhaXNQYXRoU2VsZWN0ZWRJbmNsdXNpdmUocXVlcnkuX2ZpZWxkcywgZm9yZWlnbkZpZWxkKSkge1xuICAgICAgICAgICAgcXVlcnkuc2VsZWN0KGZvcmVpZ25GaWVsZCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJZiB1c2luZyBjb3VudCwgc3RpbGwgbmVlZCB0aGUgYGZvcmVpZ25GaWVsZGAgc28gd2UgY2FuIG1hdGNoIGNvdW50c1xuICAgIC8vIHRvIGRvY3VtZW50cywgb3RoZXJ3aXNlIHdlIHdvdWxkIG5lZWQgYSBzZXBhcmF0ZSBgY291bnQoKWAgZm9yIGV2ZXJ5IGRvYy5cbiAgICBpZiAobW9kLmNvdW50KSB7XG4gICAgICAgIGZvciAoY29uc3QgZm9yZWlnbkZpZWxkIG9mIG1vZC5mb3JlaWduRmllbGQpIHtcbiAgICAgICAgICAgIHF1ZXJ5LnNlbGVjdChmb3JlaWduRmllbGQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gSWYgd2UgbmVlZCB0byBzdWItcG9wdWxhdGUsIGNhbGwgcG9wdWxhdGUgcmVjdXJzaXZlbHlcbiAgICBpZiAoc3ViUG9wdWxhdGUpIHtcbiAgICAgICAgcXVlcnkucG9wdWxhdGUoc3ViUG9wdWxhdGUpO1xuICAgIH1cbiAgICAvL2NhbGxiYWNrKG51bGwscXVlcnkpO1xuXG4gICAgcXVlcnkuZXhlYygoZXJyLHFSZXN1bHRzKT0+e1xuICAgICAgICBpZihlcnIpXG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwse1xuICAgICAgICAgICAgbW9kLFxuICAgICAgICAgICAgYXNzaWdubWVudE9wdHMsXG4gICAgICAgICAgICBxdWVyeTpxdWVyeSxcbiAgICAgICAgICAgIHJlc3VsdHM6cVJlc3VsdHMsXG4gICAgICAgICAgICBhc3NpZ24odmFscyl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9hc3NpZ24obW9kLm1vZGVsLCB2YWxzLCBtb2QsIGFzc2lnbm1lbnRPcHRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cbi8qIVxuICogTWFrZSBzdXJlIGB0aGlzYCBpcyBhIG1vZGVsXG4gKi9cblxuZnVuY3Rpb24gX2NoZWNrQ29udGV4dChjdHgsIGZuTmFtZSkge1xuICAgIC8vIENoZWNrIGNvbnRleHQsIGJlY2F1c2UgaXQgaXMgZWFzeSB0byBtaXN0YWtlbmx5IHR5cGVcbiAgICAvLyBgbmV3IE1vZGVsLmRpc2NyaW1pbmF0b3IoKWAgYW5kIGdldCBhbiBpbmNvbXByZWhlbnNpYmxlIGVycm9yXG4gICAgaWYgKGN0eCA9PSBudWxsIHx8IGN0eCA9PT0gZ2xvYmFsKSB7XG4gICAgICAgIHRocm93IG5ldyBNb25nb29zZUVycm9yKCdgTW9kZWwuJyArIGZuTmFtZSArICcoKWAgY2Fubm90IHJ1biB3aXRob3V0IGEgJyArXG4gICAgICAgICAgICAnbW9kZWwgYXMgYHRoaXNgLiBNYWtlIHN1cmUgeW91IGFyZSBjYWxsaW5nIGBNeU1vZGVsLicgKyBmbk5hbWUgKyAnKClgICcgK1xuICAgICAgICAgICAgJ3doZXJlIGBNeU1vZGVsYCBpcyBhIE1vbmdvb3NlIG1vZGVsLicpO1xuICAgIH0gZWxzZSBpZiAoY3R4W21vZGVsU3ltYm9sXSA9PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBNb25nb29zZUVycm9yKCdgTW9kZWwuJyArIGZuTmFtZSArICcoKWAgY2Fubm90IHJ1biB3aXRob3V0IGEgJyArXG4gICAgICAgICAgICAnbW9kZWwgYXMgYHRoaXNgLiBNYWtlIHN1cmUgeW91IGFyZSBub3QgY2FsbGluZyAnICtcbiAgICAgICAgICAgICdgbmV3IE1vZGVsLicgKyBmbk5hbWUgKyAnKClgJyk7XG4gICAgfVxufVxuXG4vKiFcbiAqIEZvcm1hdCBgbW9kLm1hdGNoYCBnaXZlbiB0aGF0IGl0IG1heSBiZSBhbiBhcnJheSB0aGF0IHdlIG5lZWQgdG8gJG9yIGlmXG4gKiB0aGUgY2xpZW50IGhhcyBtdWx0aXBsZSBkb2NzIHdpdGggbWF0Y2ggZnVuY3Rpb25zXG4gKi9cblxuZnVuY3Rpb24gX2Zvcm1hdE1hdGNoKG1hdGNoKSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkobWF0Y2gpKSB7XG4gICAgICAgIGlmIChtYXRjaC5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICByZXR1cm4geyAkb3I6IFtdLmNvbmNhdChtYXRjaC5tYXAobSA9PiBPYmplY3QuYXNzaWduKHt9LCBtKSkpIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIG1hdGNoWzBdKTtcbiAgICB9XG4gICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIG1hdGNoKTtcbn1cblxuZnVuY3Rpb24gX2Fzc2lnbihtb2RlbCwgdmFscywgbW9kLCBhc3NpZ25tZW50T3B0cykge1xuICAgIGNvbnN0IG9wdGlvbnMgPSBtb2Qub3B0aW9ucztcbiAgICBjb25zdCBpc1ZpcnR1YWwgPSBtb2QuaXNWaXJ0dWFsO1xuICAgIGNvbnN0IGp1c3RPbmUgPSBtb2QuanVzdE9uZTtcbiAgICBsZXQgX3ZhbDtcbiAgICBjb25zdCBsZWFuID0gZ2V0KG9wdGlvbnMsICdvcHRpb25zLmxlYW4nLCBmYWxzZSk7XG4gICAgY29uc3QgcHJvamVjdGlvbiA9IHBhcnNlUHJvamVjdGlvbihnZXQob3B0aW9ucywgJ3NlbGVjdCcsIG51bGwpLCB0cnVlKSB8fFxuICAgICAgICBwYXJzZVByb2plY3Rpb24oZ2V0KG9wdGlvbnMsICdvcHRpb25zLnNlbGVjdCcsIG51bGwpLCB0cnVlKTtcbiAgICBjb25zdCBsZW4gPSB2YWxzLmxlbmd0aDtcbiAgICBjb25zdCByYXdPcmRlciA9IHt9O1xuICAgIGNvbnN0IHJhd0RvY3MgPSB7fTtcbiAgICBsZXQga2V5O1xuICAgIGxldCB2YWw7XG5cbiAgICAvLyBDbG9uZSBiZWNhdXNlIGBhc3NpZ25SYXdEb2NzVG9JZFN0cnVjdHVyZWAgd2lsbCBtdXRhdGUgdGhlIGFycmF5XG4gICAgY29uc3QgYWxsSWRzID0gdXRpbHMuY2xvbmUobW9kLmFsbElkcyk7XG5cbiAgICAvLyBvcHRpbWl6YXRpb246XG4gICAgLy8gcmVjb3JkIHRoZSBkb2N1bWVudCBwb3NpdGlvbnMgYXMgcmV0dXJuZWQgYnlcbiAgICAvLyB0aGUgcXVlcnkgcmVzdWx0LlxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgdmFsID0gdmFsc1tpXTtcbiAgICAgICAgaWYgKHZhbCA9PSBudWxsKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGNvbnN0IGZvcmVpZ25GaWVsZCBvZiBtb2QuZm9yZWlnbkZpZWxkKSB7XG4gICAgICAgICAgICBfdmFsID0gdXRpbHMuZ2V0VmFsdWUoZm9yZWlnbkZpZWxkLCB2YWwpO1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoX3ZhbCkpIHtcbiAgICAgICAgICAgICAgICBfdmFsID0gdXRpbHMuYXJyYXkuZmxhdHRlbihfdmFsKTtcbiAgICAgICAgICAgICAgICBjb25zdCBfdmFsTGVuZ3RoID0gX3ZhbC5sZW5ndGg7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBfdmFsTGVuZ3RoOyArK2opIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IF9fdmFsID0gX3ZhbFtqXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKF9fdmFsIGluc3RhbmNlb2YgRG9jdW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9fdmFsID0gX192YWwuX2lkO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGtleSA9IFN0cmluZyhfX3ZhbCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyYXdEb2NzW2tleV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHJhd0RvY3Nba2V5XSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByYXdEb2NzW2tleV0ucHVzaCh2YWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhd09yZGVyW2tleV0ucHVzaChpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmF3RG9jc1trZXldID0gW3Jhd0RvY3Nba2V5XSwgdmFsXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByYXdPcmRlcltrZXldID0gW3Jhd09yZGVyW2tleV0sIGldO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzVmlydHVhbCAmJiAhanVzdE9uZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhd0RvY3Nba2V5XSA9IFt2YWxdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhd09yZGVyW2tleV0gPSBbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhd0RvY3Nba2V5XSA9IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByYXdPcmRlcltrZXldID0gaTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKF92YWwgaW5zdGFuY2VvZiBEb2N1bWVudCkge1xuICAgICAgICAgICAgICAgICAgICBfdmFsID0gX3ZhbC5faWQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGtleSA9IFN0cmluZyhfdmFsKTtcbiAgICAgICAgICAgICAgICBpZiAocmF3RG9jc1trZXldKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHJhd0RvY3Nba2V5XSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJhd0RvY3Nba2V5XS5wdXNoKHZhbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByYXdPcmRlcltrZXldLnB1c2goaSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByYXdEb2NzW2tleV0gPSBbcmF3RG9jc1trZXldLCB2YWxdO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmF3T3JkZXJba2V5XSA9IFtyYXdPcmRlcltrZXldLCBpXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJhd0RvY3Nba2V5XSA9IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgcmF3T3JkZXJba2V5XSA9IGk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gZmxhZyBlYWNoIGFzIHJlc3VsdCBvZiBwb3B1bGF0aW9uXG4gICAgICAgICAgICBpZiAobGVhbikge1xuICAgICAgICAgICAgICAgIGxlYW5Qb3B1bGF0ZU1hcC5zZXQodmFsLCBtb2QubW9kZWwpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YWwuJF9fLndhc1BvcHVsYXRlZCA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGdoLTg0NjA6IGlmIHVzZXIgdXNlZCBgLWZvcmVpZ25GaWVsZGAsIGFzc3VtZSB0aGlzIG1lYW5zIHRoZXlcbiAgICAgICAgICAgIC8vIHdhbnQgdGhlIGZvcmVpZ24gZmllbGQgdW5zZXQgZXZlbiBpZiBpdCBpc24ndCBleGNsdWRlZCBpbiB0aGUgcXVlcnkuXG4gICAgICAgICAgICBpZiAocHJvamVjdGlvbiAhPSBudWxsICYmIHByb2plY3Rpb24uaGFzT3duUHJvcGVydHkoJy0nICsgZm9yZWlnbkZpZWxkKSkge1xuICAgICAgICAgICAgICAgIGlmICh2YWwuJF9fICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsLnNldChmb3JlaWduRmllbGQsIHZvaWQgMCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbXBhdGgudW5zZXQoZm9yZWlnbkZpZWxkLCB2YWwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzc2lnblZhbHMoe1xuICAgICAgICBvcmlnaW5hbE1vZGVsOiBtb2RlbCxcbiAgICAgICAgLy8gSWYgdmlydHVhbCwgbWFrZSBzdXJlIHRvIG5vdCBtdXRhdGUgb3JpZ2luYWwgZmllbGRcbiAgICAgICAgcmF3SWRzOiBtb2QuaXNWaXJ0dWFsID8gYWxsSWRzIDogbW9kLmFsbElkcyxcbiAgICAgICAgYWxsSWRzOiBhbGxJZHMsXG4gICAgICAgIGZvcmVpZ25GaWVsZDogbW9kLmZvcmVpZ25GaWVsZCxcbiAgICAgICAgcmF3RG9jczogcmF3RG9jcyxcbiAgICAgICAgcmF3T3JkZXI6IHJhd09yZGVyLFxuICAgICAgICBkb2NzOiBtb2QuZG9jcyxcbiAgICAgICAgcGF0aDogb3B0aW9ucy5wYXRoLFxuICAgICAgICBvcHRpb25zOiBhc3NpZ25tZW50T3B0cyxcbiAgICAgICAganVzdE9uZTogbW9kLmp1c3RPbmUsXG4gICAgICAgIGlzVmlydHVhbDogbW9kLmlzVmlydHVhbCxcbiAgICAgICAgYWxsT3B0aW9uczogbW9kLFxuICAgICAgICBsZWFuOiBsZWFuLFxuICAgICAgICB2aXJ0dWFsOiBtb2QudmlydHVhbCxcbiAgICAgICAgY291bnQ6IG1vZC5jb3VudCxcbiAgICAgICAgbWF0Y2g6IG1vZC5tYXRjaFxuICAgIH0pO1xufVxuXG4vKiFcbiAqIE9wdGlvbmFsbHkgZmlsdGVyIG91dCBpbnZhbGlkIGlkcyB0aGF0IGRvbid0IGNvbmZvcm0gdG8gZm9yZWlnbiBmaWVsZCdzIHNjaGVtYVxuICogdG8gYXZvaWQgY2FzdCBlcnJvcnMgKGdoLTc3MDYpXG4gKi9cblxuZnVuY3Rpb24gX2ZpbHRlckludmFsaWRJZHMoaWRzLCBmb3JlaWduU2NoZW1hVHlwZSwgc2tpcEludmFsaWRJZHMpIHtcbiAgICBpZHMgPSBpZHMuZmlsdGVyKHYgPT4gISh2IGluc3RhbmNlb2YgU2tpcFBvcHVsYXRlVmFsdWUpKTtcbiAgICBpZiAoIXNraXBJbnZhbGlkSWRzKSB7XG4gICAgICAgIHJldHVybiBpZHM7XG4gICAgfVxuICAgIHJldHVybiBpZHMuZmlsdGVyKGlkID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGZvcmVpZ25TY2hlbWFUeXBlLmNhc3QoaWQpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfSk7XG59Il0sIm1hcHBpbmdzIjoic2hFQUFBLElBQU1BLElBQUksR0FBR0MsT0FBTyxDQUFFLE1BQU8sQ0FBQztBQUM5QixJQUFJQyxXQUFXLEdBQUdGLElBQUksQ0FBQ0csT0FBTyxDQUFDRixPQUFPLENBQUNFLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBQyxJQUFJLENBQUM7QUFDaEUsSUFBTUMsYUFBYSxHQUFHSCxPQUFPLENBQUMsMEJBQTBCLENBQUM7QUFDekQsSUFBTUksdUJBQXVCLEdBQUdKLE9BQU8sSUFBQUssTUFBQSxDQUFJSixXQUFXLGtEQUErQyxDQUFDO0FBQ3RHLElBQU1LLFNBQVMsR0FBR04sT0FBTyxDQUFDLGdDQUFnQyxDQUFDO0FBQzNELElBQU1PLEtBQUssR0FBR1AsT0FBTyxDQUFDLG9CQUFvQixDQUFDO0FBQzNDLElBQU1RLHVCQUF1QixHQUFHUixPQUFPLElBQUFLLE1BQUEsQ0FBSUosV0FBVyxvREFBaUQsQ0FBQztBQUN4RyxJ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