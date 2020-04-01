"use strict";var _interopRequireDefault3 = require("@babel/runtime/helpers/interopRequireDefault");var _interopRequireDefault2 = _interopRequireDefault3(require("@babel/runtime/helpers/interopRequireDefault"));Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = undefined;var _regenerator = require("@babel/runtime/regenerator");var _regeneratorRuntime = (0, _interopRequireDefault2["default"])(_regenerator)["default"];var _asyncToGenerator2 = require("@babel/runtime/helpers/asyncToGenerator");var _asyncToGenerator = (0, _interopRequireDefault2["default"])(_asyncToGenerator2)["default"];var _classCallCheck2 = require("@babel/runtime/helpers/classCallCheck");var _classCallCheck = (0, _interopRequireDefault2["default"])(_classCallCheck2)["default"];var _createClass2 = require("@babel/runtime/helpers/createClass");var _createClass = (0, _interopRequireDefault2["default"])(_createClass2)["default"];var _possibleConstructorReturn2 = require("@babel/runtime/helpers/possibleConstructorReturn");var _possibleConstructorReturn = (0, _interopRequireDefault2["default"])(_possibleConstructorReturn2)["default"];var _getPrototypeOf2 = require("@babel/runtime/helpers/getPrototypeOf");var _getPrototypeOf = (0, _interopRequireDefault2["default"])(_getPrototypeOf2)["default"];var _inherits2 = require("@babel/runtime/helpers/inherits");var _inherits = (0, _interopRequireDefault2["default"])(_inherits2)["default"];var _ObserveCursor = require("./ObserveCursor");var ObserveCursor = (0, _interopRequireDefault2["default"])(_ObserveCursor)["default"];
var _events = require("events");var EventEmitter = (0, _interopRequireDefault2["default"])(_events)["default"];
var _mongooseUtils = require("./mongooseUtils");var modelPopulate = _mongooseUtils.modelPopulate;
var _underscore = require("underscore");var _ = (0, _interopRequireDefault2["default"])(_underscore)["default"];
var _PopulateProxy = require("./PopulateProxy");var populateProxy = (0, _interopRequireDefault2["default"])(_PopulateProxy)["default"];

function queryEquals(query1, query2) {
  if (!query1 && !query2)
  return true;
  if (!query1 || !query2)
  return false;
  if (query1.op !== query2.op)
  return false;
  var serializedCondition1 = JSON.stringify(query1._conditions);
  var serializedCondition2 = JSON.stringify(query2._conditions);
  if (serializedCondition1 !== serializedCondition2)
  return false;

  var serializedOptions1 = JSON.stringify(query1.options);
  var serializedOptions2 = JSON.stringify(query2.options);
  if (serializedOptions1 !== serializedOptions2)
  return false;
  return true;
}var

ObserveCursorDeep = /*#__PURE__*/function (_EventEmitter) {_inherits(ObserveCursorDeep, _EventEmitter);
  function ObserveCursorDeep(query, options) {var _this;_classCallCheck(this, ObserveCursorDeep);
    _this = _possibleConstructorReturn(this, _getPrototypeOf(ObserveCursorDeep).call(this));
    _this.options = options;
    _this.rootQuery = query;
    _this.setMaxListeners(0);
    _this.rootObserver = new ObserveCursor(query, options);
    _this.popData = {};return _this;
  }

  /**@param {object} handlers
     * @param {function(id:String, doc:mongoose.Document)} handlers.added
     * @param {function(id:string, changedFields:object,newDoc:mongoose.Document,oldDoc: mongoose.Document)} handlers.changed
     * @param {function(id:String, removedDoc:mongoose.Document)} handlers.removed
     **/_createClass(ObserveCursorDeep, [{ key: "observeChanges", value: function observeChanges(
    handlers) {var _this2 = this;
      var handlersWrapper = {};
      var self = this;
      var counters = {
        added: 0,
        changed: 0,
        removed: 0 };

      if (handlers.added) {
        // eslint-disable-next-line no-unused-vars
        handlersWrapper.added = function (id, doc) {
          counters.added++;
          handlers.added.apply(self, arguments);
          self.emit('added', id, doc);
        };
      }
      if (handlers.changed) {
        // eslint-disable-next-line no-unused-vars
        handlersWrapper.changed = function (id, changedFields, newDoc, oldDoc) {
          counters.changed++;
          handlers.changed.apply(self, arguments);
          self.emit('changed', id, changedFields, newDoc, oldDoc);
        };
      }
      if (handlers.removed) {
        // eslint-disable-next-line no-unused-vars
        handlersWrapper.removed = function (id, removedDoc) {
          counters.removed++;
          handlers.removed.apply(self, arguments);
          self.emit('removed', id, removedDoc);
        };
      }

      var wasRefreshed = false;
      this.rootObserver.on('refresh', /*#__PURE__*/function () {var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee4(delay) {var started, populatedPaths, models, newQueries, queryItemChanged, queryItemAdded, oldPopPaths, spended;return _regeneratorRuntime.wrap(function _callee4$(_context4) {while (1) {switch (_context4.prev = _context4.next) {case 0:
                  started = Date.now();
                  populatedPaths = _this2.rootQuery.getPopulatedPaths();

                  models = _.chain(_this2.currentModels()).
                  map(function (model) {
                    return populateProxy(model, { populatedPaths: populatedPaths, set: true });
                  }).
                  value();if (!(


                  handlers.changed &&
                  !_.isEmpty(models) && !_.isEmpty(populatedPaths) && (
                  !wasRefreshed || counters.added > 0 || counters.changed > 0 || counters.removed > 0))) {_context4.next = 18;break;}

                  counters.added = 0;
                  counters.changed = 0;
                  counters.removed = 0;
                  _this2.rootObserver.pause();
                  /**@type Array<QueryItem>*/_context4.next = 10;return (
                    modelPopulate.apply(_this2.rootQuery.model, [models, populatedPaths]));case 10:newQueries = _context4.sent;
                  queryItemChanged = function queryItemChanged(oldItem, newItem) {
                    if (oldItem)
                    oldItem.observer.stop();
                    queryItemAdded(newItem);
                  };
                  queryItemAdded = /*#__PURE__*/function () {var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(newItem) {var populateLoaded, refreshScheduled,





                      doRefresh, scheduleRefresh;return _regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:doRefresh = function _ref3() {
                                newItem.assign(newItem.observer.currentModels(false));
                                _.each(models, function (model) {
                                  var changedPathes = model.__changedPathes;
                                  if (!_.isEmpty(changedPathes)) {
                                    if (handlers.changed) {
                                      handlers.changed.apply(self, [model.id, changedPathes, model, model]);
                                      self.emit('changed', model.id, changedPathes, model, model);
                                      model.__clearChangedPathes();
                                    }
                                  }
                                });
                              };newItem.observer = new ObserveCursor(newItem.query, _this2.options);populateLoaded = false;refreshScheduled = 0; // eslint-disable-next-line no-inner-declarations

                              scheduleRefresh = function scheduleRefresh() {
                                if (!refreshScheduled) {
                                  refreshScheduled = true;
                                  newItem.observer.once('refresh', function () {
                                    doRefresh();
                                    refreshScheduled = false;
                                  });
                                }
                              };

                              newItem.observer.observeChanges({
                                // eslint-disable-next-line no-unused-vars
                                added: function added(id, doc) {
                                  if (populateLoaded) {
                                    scheduleRefresh();
                                  }
                                },
                                // eslint-disable-next-line no-unused-vars
                                changed: function changed(id, changedFields, newDoc, oldDoc) {
                                  scheduleRefresh();
                                },
                                // eslint-disable-next-line no-unused-vars
                                removed: function removed(id, removedDoc) {
                                  scheduleRefresh();
                                } });_context.next = 8;return (

                                newItem.observer.models(false));case 8:
                              doRefresh();
                              populateLoaded = true;return _context.abrupt("return",
                              newItem);case 11:case "end":return _context.stop();}}}, _callee);}));return function queryItemAdded(_x2) {return _ref2.apply(this, arguments);};}();



                  oldPopPaths = _.keys(_this2.popData);

                  _.each(oldPopPaths, /*#__PURE__*/function () {var _ref4 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(popName) {var oldItems, newItems;return _regeneratorRuntime.wrap(function _callee2$(_context2) {while (1) {switch (_context2.prev = _context2.next) {case 0:
                              oldItems = _this2.popData[popName];
                              newItems = newQueries[popName];if (!(
                              !newItems || _.size(newItems) !== _.size(oldItems))) {_context2.next = 5;break;}
                              _.each(oldItems, function (oldItem) {
                                oldItem.observer.stop();
                              });return _context2.abrupt("return",
                              delete _this2.popData[popName]);case 5:

                              _.each(oldItems, function (oldQueryItem, index) {
                                var newQueryItem = newItems[index];
                                if (queryEquals(oldQueryItem.observer.query, newQueryItem.query)) {

                                } else {//изменилось
                                  queryItemChanged(oldQueryItem, newQueryItem);
                                }
                              });case 6:case "end":return _context2.stop();}}}, _callee2);}));return function (_x3) {return _ref4.apply(this, arguments);};}());_context4.next = 17;return (


                    Promise.all(
                    _.map(newQueries, /*#__PURE__*/function () {var _ref5 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3(newItems, popName) {var i, newItem;return _regeneratorRuntime.wrap(function _callee3$(_context3) {while (1) {switch (_context3.prev = _context3.next) {case 0:if (
                                _this2.popData[popName]) {_context3.next = 11;break;}
                                _this2.popData[popName] = [];
                                i = 0;case 3:if (!(i < newItems.length)) {_context3.next = 11;break;}
                                newItem = newItems[i];_context3.next = 7;return (
                                  queryItemAdded(newItem));case 7:
                                _this2.popData[popName].push(newItem);case 8:i++;_context3.next = 3;break;case 11:case "end":return _context3.stop();}}}, _callee3);}));return function (_x4, _x5) {return _ref5.apply(this, arguments);};}())));case 17:




                  _this2.rootObserver.awake();case 18:


                  spended = Date.now() - started;
                  wasRefreshed = true;
                  _this2.emit('refresh', delay + spended);case 21:case "end":return _context4.stop();}}}, _callee4);}));return function (_x) {return _ref.apply(this, arguments);};}());

      this.rootObserver.observeChanges(handlersWrapper);
      return this;
    } }, { key: "currentModels", value: function currentModels()

    {var raw = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      return _.chain(this.rootObserver.modelsMap).
      values().
      map(function (model) {
        if (raw) {
          return model.toObject({ getters: false });
        }
        return model;
      }).
      value();
    } }, { key: "models", value: function models(

    raw) {
      return this.rootObserver.models(raw);
    } }, { key: "stop", value: function stop()

    {
      this.rootObserver.stop();
    } }]);return ObserveCursorDeep;}(EventEmitter);exports["default"] = ObserveCursorDeep;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9PYnNlcnZlQ3Vyc29yRGVlcC5qcyJdLCJuYW1lcyI6WyJPYnNlcnZlQ3Vyc29yIiwiRXZlbnRFbWl0dGVyIiwibW9kZWxQb3B1bGF0ZSIsIl8iLCJwb3B1bGF0ZVByb3h5IiwicXVlcnlFcXVhbHMiLCJxdWVyeTEiLCJxdWVyeTIiLCJvcCIsInNlcmlhbGl6ZWRDb25kaXRpb24xIiwiSlNPTiIsInN0cmluZ2lmeSIsIl9jb25kaXRpb25zIiwic2VyaWFsaXplZENvbmRpdGlvbjIiLCJzZXJpYWxpemVkT3B0aW9uczEiLCJvcHRpb25zIiwic2VyaWFsaXplZE9wdGlvbnMyIiwiT2JzZXJ2ZUN1cnNvckRlZXAiLCJxdWVyeSIsInJvb3RRdWVyeSIsInNldE1heExpc3RlbmVycyIsInJvb3RPYnNlcnZlciIsInBvcERhdGEiLCJoYW5kbGVycyIsImhhbmRsZXJzV3JhcHBlciIsInNlbGYiLCJjb3VudGVycyIsImFkZGVkIiwiY2hhbmdlZCIsInJlbW92ZWQiLCJpZCIsImRvYyIsImFwcGx5IiwiYXJndW1lbnRzIiwiZW1pdCIsImNoYW5nZWRGaWVsZHMiLCJuZXdEb2MiLCJvbGREb2MiLCJyZW1vdmVkRG9jIiwid2FzUmVmcmVzaGVkIiwib24iLCJkZWxheSIsInN0YXJ0ZWQiLCJEYXRlIiwibm93IiwicG9wdWxhdGVkUGF0aHMiLCJnZXRQb3B1bGF0ZWRQYXRocyIsIm1vZGVscyIsImNoYWluIiwiY3VycmVudE1vZGVscyIsIm1hcCIsIm1vZGVsIiwic2V0IiwidmFsdWUiLCJpc0VtcHR5IiwicGF1c2UiLCJuZXdRdWVyaWVzIiwicXVlcnlJdGVtQ2hhbmdlZCIsIm9sZEl0ZW0iLCJuZXdJdGVtIiwib2JzZXJ2ZXIiLCJzdG9wIiwicXVlcnlJdGVtQWRkZWQiLCJkb1JlZnJlc2giLCJhc3NpZ24iLCJlYWNoIiwiY2hhbmdlZFBhdGhlcyIsIl9fY2hhbmdlZFBhdGhlcyIsIl9fY2xlYXJDaGFuZ2VkUGF0aGVzIiwicG9wdWxhdGVMb2FkZWQiLCJyZWZyZXNoU2NoZWR1bGVkIiwic2NoZWR1bGVSZWZyZXNoIiwib25jZSIsIm9ic2VydmVDaGFuZ2VzIiwib2xkUG9wUGF0aHMiLCJrZXlzIiwicG9wTmFtZSIsIm9sZEl0ZW1zIiwibmV3SXRlbXMiLCJzaXplIiwib2xkUXVlcnlJdGVtIiwiaW5kZXgiLCJuZXdRdWVyeUl0ZW0iLCJQcm9taXNlIiwiYWxsIiwiaSIsImxlbmd0aCIsInB1c2giLCJhd2FrZSIsInNwZW5kZWQiLCJyYXciLCJtb2RlbHNNYXAiLCJ2YWx1ZXMiLCJ0b09iamVjdCIsImdldHRlcnMiXSwibWFwcGluZ3MiOiJxNkNBQUEsZ0QsSUFBT0EsYTtBQUNQLGdDLElBQU9DLFk7QUFDUCxnRCxJQUFRQyxhLGtCQUFBQSxhO0FBQ1Isd0MsSUFBT0MsQztBQUNQLGdELElBQU9DLGE7O0FBRVAsU0FBU0MsV0FBVCxDQUFzQkMsTUFBdEIsRUFBOEJDLE1BQTlCLEVBQXNDO0FBQ2xDLE1BQUksQ0FBQ0QsTUFBRCxJQUFXLENBQUNDLE1BQWhCO0FBQ0ksU0FBTyxJQUFQO0FBQ0osTUFBSSxDQUFDRCxNQUFELElBQVcsQ0FBQ0MsTUFBaEI7QUFDSSxTQUFPLEtBQVA7QUFDSixNQUFJRCxNQUFNLENBQUNFLEVBQVAsS0FBY0QsTUFBTSxDQUFDQyxFQUF6QjtBQUNJLFNBQU8sS0FBUDtBQUNKLE1BQUlDLG9CQUFvQixHQUFHQyxJQUFJLENBQUNDLFNBQUwsQ0FBZ0JMLE1BQU0sQ0FBQ00sV0FBdkIsQ0FBM0I7QUFDQSxNQUFJQyxvQkFBb0IsR0FBR0gsSUFBSSxDQUFDQyxTQUFMLENBQWdCSixNQUFNLENBQUNLLFdBQXZCLENBQTNCO0FBQ0EsTUFBSUgsb0JBQW9CLEtBQUtJLG9CQUE3QjtBQUNJLFNBQU8sS0FBUDs7QUFFSixNQUFJQyxrQkFBa0IsR0FBR0osSUFBSSxDQUFDQyxTQUFMLENBQWdCTCxNQUFNLENBQUNTLE9BQXZCLENBQXpCO0FBQ0EsTUFBSUMsa0JBQWtCLEdBQUdOLElBQUksQ0FBQ0MsU0FBTCxDQUFnQkosTUFBTSxDQUFDUSxP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c0JXLElBQXRCLENBQTRCNUIsT0FBNUIsRUFOTyxPQUcwQjBCLENBQUMsRUFIM0IscUZBQW5CLHlFQURFLENBcEdtQjs7Ozs7QUFnSHpCLGtCQUFBLE1BQUksQ0FBQ2hFLFlBQUwsQ0FBa0JtRSxLQUFsQixHQWhIeUI7OztBQW1IekJDLGtCQUFBQSxPQW5IeUIsR0FtSGY5QyxJQUFJLENBQUNDLEdBQUwsS0FBY0YsT0FuSEM7QUFvSDdCSCxrQkFBQUEsWUFBWSxHQUFHLElBQWY7QUFDQSxrQkFBQSxNQUFJLENBQUNMLElBQUwsQ0FBVyxTQUFYLEVBQXNCTyxLQUFLLEdBQUdnRCxPQUE5QixFQXJINkIsMkRBQWpDOztBQXVIQSxXQUFLcEUsWUFBTCxDQUFrQm9ELGNBQWxCLENBQWtDakQsZUFBbEM7QUFDQSxhQUFPLElBQVA7QUFDSCxLOztBQUUyQixTQUFia0UsR0FBYSx1RUFBUCxLQUFPO0FBQ3hCLGFBQU92RixDQUFDLENBQUM2QyxLQUFGLENBQVMsS0FBSzNCLFlBQUwsQ0FBa0JzRSxTQUEzQjtBQUNOQyxNQUFBQSxNQURNO0FBRU4xQyxNQUFBQSxHQUZNLENBRUQsVUFBQ0MsS0FBRCxFQUFXO0FBQ2IsWUFBSXVDLEdBQUosRUFBUztBQUNMLGlCQUFPdkMsS0FBSyxDQUFDMEMsUUFBTixDQUFnQixFQUFDQyxPQUFPLEVBQUUsS0FBVixFQUFoQixDQUFQO0FBQ0g7QUFDRCxlQUFPM0MsS0FBUDtBQUNILE9BUE07QUFRTkUsTUFBQUEsS0FSTSxFQUFQO0FBU0gsSzs7QUFFT3FDLElBQUFBLEcsRUFBSztBQUNULGFBQU8sS0FBS3JFLFlBQUwsQ0FBa0IwQixNQUFsQixDQUEwQjJDLEdBQTFCLENBQVA7QUFDSCxLOztBQUVPO0FBQ0osV0FBS3JFLFlBQUwsQ0FBa0J3QyxJQUFsQjtBQUNILEssZ0NBOUwwQzVELFksdUJBQTFCZ0IsaUIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgT2JzZXJ2ZUN1cnNvciBmcm9tIFwiLi9PYnNlcnZlQ3Vyc29yXCI7XG5pbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50cyc7XG5pbXBvcnQge21vZGVsUG9wdWxhdGV9IGZyb20gJy4vbW9uZ29vc2VVdGlscyc7XG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmltcG9ydCBwb3B1bGF0ZVByb3h5IGZyb20gJy4vUG9wdWxhdGVQcm94eSc7XG5cbmZ1bmN0aW9uIHF1ZXJ5RXF1YWxzIChxdWVyeTEsIHF1ZXJ5Mikge1xuICAgIGlmICghcXVlcnkxICYmICFxdWVyeTIpXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIGlmICghcXVlcnkxIHx8ICFxdWVyeTIpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICBpZiAocXVlcnkxLm9wICE9PSBxdWVyeTIub3ApXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICBsZXQgc2VyaWFsaXplZENvbmRpdGlvbjEgPSBKU09OLnN0cmluZ2lmeSAocXVlcnkxLl9jb25kaXRpb25zKTtcbiAgICBsZXQgc2VyaWFsaXplZENvbmRpdGlvbjIgPSBKU09OLnN0cmluZ2lmeSAocXVlcnkyLl9jb25kaXRpb25zKTtcbiAgICBpZiAoc2VyaWFsaXplZENvbmRpdGlvbjEgIT09IHNlcmlhbGl6ZWRDb25kaXRpb24yKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICBsZXQgc2VyaWFsaXplZE9wdGlvbnMxID0gSlNPTi5zdHJpbmdpZnkgKHF1ZXJ5MS5vcHRpb25zKTtcbiAgICBsZXQgc2VyaWFsaXplZE9wdGlvbnMyID0gSlNPTi5zdHJpbmdpZnkgKHF1ZXJ5Mi5vcHRpb25zKTtcbiAgICBpZiAoc2VyaWFsaXplZE9wdGlvbnMxICE9PSBzZXJpYWxpemVkT3B0aW9uczIpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgT2JzZXJ2ZUN1cnNvckRlZXAgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICAgIGNvbnN0cnVjdG9yIChxdWVyeSwgb3B0aW9ucykge1xuICAgICAgICBzdXBlciAoKTtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICAgICAgdGhpcy5yb290UXVlcnkgPSBxdWVyeTtcbiAgICAgICAgdGhpcy5zZXRNYXhMaXN0ZW5lcnMgKDApO1xuICAgICAgICB0aGlzLnJvb3RPYnNlcnZlciA9IG5ldyBPYnNlcnZlQ3Vyc29yIChxdWVyeSwgb3B0aW9ucyk7XG4gICAgICAgIHRoaXMucG9wRGF0YSA9IHt9O1xuICAgIH1cblxuICAgIC8qKkBwYXJhbSB7b2JqZWN0fSBoYW5kbGVyc1xuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oaWQ6U3RyaW5nLCBkb2M6bW9uZ29vc2UuRG9jdW1lbnQpfSBoYW5kbGVycy5hZGRlZFxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oaWQ6c3RyaW5nLCBjaGFuZ2VkRmllbGRzOm9iamVjdCxuZXdEb2M6bW9uZ29vc2UuRG9jdW1lbnQsb2xkRG9jOiBtb25nb29zZS5Eb2N1bWVudCl9IGhhbmRsZXJzLmNoYW5nZWRcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKGlkOlN0cmluZywgcmVtb3ZlZERvYzptb25nb29zZS5Eb2N1bWVudCl9IGhhbmRsZXJzLnJlbW92ZWRcbiAgICAgKiovXG4gICAgb2JzZXJ2ZUNoYW5nZXMgKGhhbmRsZXJzKSB7XG4gICAgICAgIGxldCBoYW5kbGVyc1dyYXBwZXIgPSB7fTtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgICAgIGxldCBjb3VudGVycyA9IHtcbiAgICAgICAgICAgIGFkZGVkOjAsXG4gICAgICAgICAgICBjaGFuZ2VkOjAsXG4gICAgICAgICAgICByZW1vdmVkOjBcbiAgICAgICAgfVxuICAgICAgICBpZiAoaGFuZGxlcnMuYWRkZWQpIHtcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFyc1xuICAgICAgICAgICAgaGFuZGxlcnNXcmFwcGVyLmFkZGVkID0gZnVuY3Rpb24gKGlkLCBkb2MpIHtcbiAgICAgICAgICAgICAgICBjb3VudGVycy5hZGRlZCsrO1xuICAgICAgICAgICAgICAgIGhhbmRsZXJzLmFkZGVkLmFwcGx5IChzZWxmLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgIHNlbGYuZW1pdCgnYWRkZWQnLGlkLGRvYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGhhbmRsZXJzLmNoYW5nZWQpIHtcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFyc1xuICAgICAgICAgICAgaGFuZGxlcnNXcmFwcGVyLmNoYW5nZWQgPSBmdW5jdGlvbiAoaWQsIGNoYW5nZWRGaWVsZHMsIG5ld0RvYywgb2xkRG9jKSB7XG4gICAgICAgICAgICAgICAgY291bnRlcnMuY2hhbmdlZCsrO1xuICAgICAgICAgICAgICAgIGhhbmRsZXJzLmNoYW5nZWQuYXBwbHkgKHNlbGYsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgc2VsZi5lbWl0KCdjaGFuZ2VkJyxpZCwgY2hhbmdlZEZpZWxkcywgbmV3RG9jLCBvbGREb2MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChoYW5kbGVycy5yZW1vdmVkKSB7XG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgICAgICAgICAgIGhhbmRsZXJzV3JhcHBlci5yZW1vdmVkID0gZnVuY3Rpb24gKGlkLCByZW1vdmVkRG9jKSB7XG4gICAgICAgICAgICAgICAgY291bnRlcnMucmVtb3ZlZCsrO1xuICAgICAgICAgICAgICAgIGhhbmRsZXJzLnJlbW92ZWQuYXBwbHkgKHNlbGYsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgc2VsZi5lbWl0KCdyZW1vdmVkJyxpZCwgcmVtb3ZlZERvYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgd2FzUmVmcmVzaGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMucm9vdE9ic2VydmVyLm9uICgncmVmcmVzaCcsIGFzeW5jIChkZWxheSkgPT4ge1xuICAgICAgICAgICAgbGV0IHN0YXJ0ZWQgPSBEYXRlLm5vdyAoKTtcbiAgICAgICAgICAgIGxldCBwb3B1bGF0ZWRQYXRocyA9IHRoaXMucm9vdFF1ZXJ5LmdldFBvcHVsYXRlZFBhdGhzICgpO1xuXG4gICAgICAgICAgICBsZXQgbW9kZWxzID0gXy5jaGFpbiAodGhpcy5jdXJyZW50TW9kZWxzICgpKVxuICAgICAgICAgICAgLm1hcCAoKG1vZGVsKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBvcHVsYXRlUHJveHkgKG1vZGVsLCB7cG9wdWxhdGVkUGF0aHMsIHNldDogdHJ1ZX0pXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnZhbHVlICgpO1xuXG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgaGFuZGxlcnMuY2hhbmdlZCAmJlxuICAgICAgICAgICAgICAgICFfLmlzRW1wdHkgKG1vZGVscykgJiYgIV8uaXNFbXB0eSAocG9wdWxhdGVkUGF0aHMpXG4gICAgICAgICAgICAgICAgJiYoIXdhc1JlZnJlc2hlZHx8Y291bnRlcnMuYWRkZWQ+MHx8Y291bnRlcnMuY2hhbmdlZD4wfHxjb3VudGVycy5yZW1vdmVkPjApXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBjb3VudGVycy5hZGRlZD0wO1xuICAgICAgICAgICAgICAgIGNvdW50ZXJzLmNoYW5nZWQ9MDtcbiAgICAgICAgICAgICAgICBjb3VudGVycy5yZW1vdmVkPTA7XG4gICAgICAgICAgICAgICAgdGhpcy5yb290T2JzZXJ2ZXIucGF1c2UgKCk7XG4gICAgICAgICAgICAgICAgLyoqQHR5cGUgQXJyYXk8UXVlcnlJdGVtPiovXG4gICAgICAgICAgICAgICAgbGV0IG5ld1F1ZXJpZXMgPSBhd2FpdCBtb2RlbFBvcHVsYXRlLmFwcGx5ICh0aGlzLnJvb3RRdWVyeS5tb2RlbCwgW21vZGVscywgcG9wdWxhdGVkUGF0aHNdKTtcbiAgICAgICAgICAgICAgICBjb25zdCBxdWVyeUl0ZW1DaGFuZ2VkID0gKG9sZEl0ZW0sIG5ld0l0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9sZEl0ZW0pXG4gICAgICAgICAgICAgICAgICAgICAgICBvbGRJdGVtLm9ic2VydmVyLnN0b3AgKCk7XG4gICAgICAgICAgICAgICAgICAgIHF1ZXJ5SXRlbUFkZGVkIChuZXdJdGVtKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGNvbnN0IHF1ZXJ5SXRlbUFkZGVkID0gYXN5bmMgKG5ld0l0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbmV3SXRlbS5vYnNlcnZlciA9IG5ldyBPYnNlcnZlQ3Vyc29yIChuZXdJdGVtLnF1ZXJ5LCB0aGlzLm9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgcG9wdWxhdGVMb2FkZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJlZnJlc2hTY2hlZHVsZWQgPSAwO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1pbm5lci1kZWNsYXJhdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gZG9SZWZyZXNoICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0l0ZW0uYXNzaWduIChuZXdJdGVtLm9ic2VydmVyLmN1cnJlbnRNb2RlbHMgKGZhbHNlKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBfLmVhY2ggKG1vZGVscywgKG1vZGVsKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGNoYW5nZWRQYXRoZXMgPSBtb2RlbC5fX2NoYW5nZWRQYXRoZXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFfLmlzRW1wdHkgKGNoYW5nZWRQYXRoZXMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoYW5kbGVycy5jaGFuZ2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVycy5jaGFuZ2VkLmFwcGx5IChzZWxmLCBbbW9kZWwuaWQsIGNoYW5nZWRQYXRoZXMsIG1vZGVsLCBtb2RlbF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5lbWl0ICgnY2hhbmdlZCcsIG1vZGVsLmlkLCBjaGFuZ2VkUGF0aGVzLCBtb2RlbCwgbW9kZWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kZWwuX19jbGVhckNoYW5nZWRQYXRoZXMgKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGxldCBzY2hlZHVsZVJlZnJlc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlZnJlc2hTY2hlZHVsZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWZyZXNoU2NoZWR1bGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdJdGVtLm9ic2VydmVyLm9uY2UgKCdyZWZyZXNoJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb1JlZnJlc2ggKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZnJlc2hTY2hlZHVsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICBuZXdJdGVtLm9ic2VydmVyLm9ic2VydmVDaGFuZ2VzICh7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZGVkIChpZCwgZG9jKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBvcHVsYXRlTG9hZGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjaGVkdWxlUmVmcmVzaCAoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2VkIChpZCwgY2hhbmdlZEZpZWxkcywgbmV3RG9jLCBvbGREb2MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2hlZHVsZVJlZnJlc2ggKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVkIChpZCwgcmVtb3ZlZERvYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjaGVkdWxlUmVmcmVzaCAoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IG5ld0l0ZW0ub2JzZXJ2ZXIubW9kZWxzIChmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIGRvUmVmcmVzaCAoKTtcbiAgICAgICAgICAgICAgICAgICAgcG9wdWxhdGVMb2FkZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3SXRlbTtcbiAgICAgICAgICAgICAgICB9O1xuXG5cbiAgICAgICAgICAgICAgICBsZXQgb2xkUG9wUGF0aHMgPSBfLmtleXMgKHRoaXMucG9wRGF0YSk7XG5cbiAgICAgICAgICAgICAgICBfLmVhY2ggKG9sZFBvcFBhdGhzLCBhc3luYyAocG9wTmFtZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBsZXQgb2xkSXRlbXMgPSB0aGlzLnBvcERhdGFbcG9wTmFtZV07XG4gICAgICAgICAgICAgICAgICAgIGxldCBuZXdJdGVtcyA9IG5ld1F1ZXJpZXNbcG9wTmFtZV07XG4gICAgICAgICAgICAgICAgICAgIGlmICghbmV3SXRlbXMgfHwgXy5zaXplIChuZXdJdGVtcykgIT09IF8uc2l6ZSAob2xkSXRlbXMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfLmVhY2ggKG9sZEl0ZW1zLCAob2xkSXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9sZEl0ZW0ub2JzZXJ2ZXIuc3RvcCAoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRlbGV0ZSB0aGlzLnBvcERhdGFbcG9wTmFtZV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXy5lYWNoIChvbGRJdGVtcywgKG9sZFF1ZXJ5SXRlbSwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBuZXdRdWVyeUl0ZW0gPSBuZXdJdGVtc1tpbmRleF07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocXVlcnlFcXVhbHMgKG9sZFF1ZXJ5SXRlbS5vYnNlcnZlci5xdWVyeSwgbmV3UXVlcnlJdGVtLnF1ZXJ5KSkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Ugey8v0LjQt9C80LXQvdC40LvQvtGB0YxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWVyeUl0ZW1DaGFuZ2VkIChvbGRRdWVyeUl0ZW0sIG5ld1F1ZXJ5SXRlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwgKFxuICAgICAgICAgICAgICAgICAgICBfLm1hcCAobmV3UXVlcmllcywgYXN5bmMgKG5ld0l0ZW1zLCBwb3BOYW1lKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMucG9wRGF0YVtwb3BOYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucG9wRGF0YVtwb3BOYW1lXSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbmV3SXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG5ld0l0ZW0gPSBuZXdJdGVtc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgcXVlcnlJdGVtQWRkZWQgKG5ld0l0ZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcERhdGFbcG9wTmFtZV0ucHVzaCAobmV3SXRlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnJvb3RPYnNlcnZlci5hd2FrZSAoKTtcblxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IHNwZW5kZWQgPSBEYXRlLm5vdyAoKSAtIHN0YXJ0ZWQ7XG4gICAgICAgICAgICB3YXNSZWZyZXNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5lbWl0ICgncmVmcmVzaCcsIGRlbGF5ICsgc3BlbmRlZCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnJvb3RPYnNlcnZlci5vYnNlcnZlQ2hhbmdlcyAoaGFuZGxlcnNXcmFwcGVyKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgY3VycmVudE1vZGVscyAocmF3ID0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuIF8uY2hhaW4gKHRoaXMucm9vdE9ic2VydmVyLm1vZGVsc01hcClcbiAgICAgICAgLnZhbHVlcyAoKVxuICAgICAgICAubWFwICgobW9kZWwpID0+IHtcbiAgICAgICAgICAgIGlmIChyYXcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbW9kZWwudG9PYmplY3QgKHtnZXR0ZXJzOiBmYWxzZX0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG1vZGVsO1xuICAgICAgICB9KVxuICAgICAgICAudmFsdWUgKClcbiAgICB9XG5cbiAgICBtb2RlbHMgKHJhdykge1xuICAgICAgICByZXR1cm4gdGhpcy5yb290T2JzZXJ2ZXIubW9kZWxzIChyYXcpO1xuICAgIH1cblxuICAgIHN0b3AgKCkge1xuICAgICAgICB0aGlzLnJvb3RPYnNlcnZlci5zdG9wICgpO1xuICAgIH1cbn0iXX0=