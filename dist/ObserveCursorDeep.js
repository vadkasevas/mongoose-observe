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

    {var _this3 = this;
      this.rootObserver.stop();
      var oldPopPaths = _.keys(this.popData);
      _.each(oldPopPaths, /*#__PURE__*/function () {var _ref6 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee5(popName) {var oldItems;return _regeneratorRuntime.wrap(function _callee5$(_context5) {while (1) {switch (_context5.prev = _context5.next) {case 0:
                  oldItems = _this3.popData[popName];
                  _.each(oldItems, function (oldItem) {
                    oldItem.observer.stop();
                  });case 2:case "end":return _context5.stop();}}}, _callee5);}));return function (_x6) {return _ref6.apply(this, arguments);};}());

      this.popData = {};
    } }]);return ObserveCursorDeep;}(EventEmitter);exports["default"] = ObserveCursorDeep;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9PYnNlcnZlQ3Vyc29yRGVlcC5qcyJdLCJuYW1lcyI6WyJPYnNlcnZlQ3Vyc29yIiwiRXZlbnRFbWl0dGVyIiwibW9kZWxQb3B1bGF0ZSIsIl8iLCJwb3B1bGF0ZVByb3h5IiwicXVlcnlFcXVhbHMiLCJxdWVyeTEiLCJxdWVyeTIiLCJvcCIsInNlcmlhbGl6ZWRDb25kaXRpb24xIiwiSlNPTiIsInN0cmluZ2lmeSIsIl9jb25kaXRpb25zIiwic2VyaWFsaXplZENvbmRpdGlvbjIiLCJzZXJpYWxpemVkT3B0aW9uczEiLCJvcHRpb25zIiwic2VyaWFsaXplZE9wdGlvbnMyIiwiT2JzZXJ2ZUN1cnNvckRlZXAiLCJxdWVyeSIsInJvb3RRdWVyeSIsInNldE1heExpc3RlbmVycyIsInJvb3RPYnNlcnZlciIsInBvcERhdGEiLCJoYW5kbGVycyIsImhhbmRsZXJzV3JhcHBlciIsInNlbGYiLCJjb3VudGVycyIsImFkZGVkIiwiY2hhbmdlZCIsInJlbW92ZWQiLCJpZCIsImRvYyIsImFwcGx5IiwiYXJndW1lbnRzIiwiZW1pdCIsImNoYW5nZWRGaWVsZHMiLCJuZXdEb2MiLCJvbGREb2MiLCJyZW1vdmVkRG9jIiwid2FzUmVmcmVzaGVkIiwib24iLCJkZWxheSIsInN0YXJ0ZWQiLCJEYXRlIiwibm93IiwicG9wdWxhdGVkUGF0aHMiLCJnZXRQb3B1bGF0ZWRQYXRocyIsIm1vZGVscyIsImNoYWluIiwiY3VycmVudE1vZGVscyIsIm1hcCIsIm1vZGVsIiwic2V0IiwidmFsdWUiLCJpc0VtcHR5IiwicGF1c2UiLCJuZXdRdWVyaWVzIiwicXVlcnlJdGVtQ2hhbmdlZCIsIm9sZEl0ZW0iLCJuZXdJdGVtIiwib2JzZXJ2ZXIiLCJzdG9wIiwicXVlcnlJdGVtQWRkZWQiLCJkb1JlZnJlc2giLCJhc3NpZ24iLCJlYWNoIiwiY2hhbmdlZFBhdGhlcyIsIl9fY2hhbmdlZFBhdGhlcyIsIl9fY2xlYXJDaGFuZ2VkUGF0aGVzIiwicG9wdWxhdGVMb2FkZWQiLCJyZWZyZXNoU2NoZWR1bGVkIiwic2NoZWR1bGVSZWZyZXNoIiwib25jZSIsIm9ic2VydmVDaGFuZ2VzIiwib2xkUG9wUGF0aHMiLCJrZXlzIiwicG9wTmFtZSIsIm9sZEl0ZW1zIiwibmV3SXRlbXMiLCJzaXplIiwib2xkUXVlcnlJdGVtIiwiaW5kZXgiLCJuZXdRdWVyeUl0ZW0iLCJQcm9taXNlIiwiYWxsIiwiaSIsImxlbmd0aCIsInB1c2giLCJhd2FrZSIsInNwZW5kZWQiLCJyYXciLCJtb2RlbHNNYXAiLCJ2YWx1ZXMiLCJ0b09iamVjdCIsImdldHRlcnMiXSwibWFwcGluZ3MiOiJxNkNBQUEsZ0QsSUFBT0EsYTtBQUNQLGdDLElBQU9DLFk7QUFDUCxnRCxJQUFRQyxhLGtCQUFBQSxhO0FBQ1Isd0MsSUFBT0MsQztBQUNQLGdELElBQU9DLGE7O0FBRVAsU0FBU0MsV0FBVCxDQUFzQkMsTUFBdEIsRUFBOEJDLE1BQTlCLEVBQXNDO0FBQ2xDLE1BQUksQ0FBQ0QsTUFBRCxJQUFXLENBQUNDLE1BQWhCO0FBQ0ksU0FBTyxJQUFQO0FBQ0osTUFBSSxDQUFDRCxNQUFELElBQVcsQ0FBQ0MsTUFBaEI7QUFDSSxTQUFPLEtBQVA7QUFDSixNQUFJRCxNQUFNLENBQUNFLEVBQVAsS0FBY0QsTUFBTSxDQUFDQyxFQUF6QjtBQUNJLFNBQU8sS0FBUDtBQUNKLE1BQUlDLG9CQUFvQixHQUFHQyxJQUFJLENBQUNDLFNBQUwsQ0FBZ0JMLE1BQU0sQ0FBQ00sV0FBdkIsQ0FBM0I7QUFDQSxNQUFJQyxvQkFBb0IsR0FBR0gsSUFBSSxDQUFDQyxTQUFMLENBQWdCSixNQUFNLENBQUNLLFdBQXZCLENBQTNCO0FBQ0EsTUFBSUgsb0JBQW9CLEtBQUtJLG9CQUE3QjtBQUNJLFNBQU8sS0FBUDs7QUFFSixNQUFJQyxrQkFBa0IsR0FBR0osSUFBSSxDQUFDQyxTQUFMLENBQWdCTCxNQUFNLENBQUNTLE9BQXZCLENBQXpCO0FBQ0EsTUFBSUMsa0JBQWtCLEdBQUdOLElBQUksQ0FBQ0MsU0FBTCxDQUFnQkosTUFBTSxDQUFDUSxPQUF2QixDQUF6QjtBQUNBLE1BQUlELGtCQUFrQixLQUFLRSxrQkFBM0I7QUFDSSxTQUFPLEtBQVA7QUFDSixTQUFPLElBQVA7QUFDSCxDOztBQUVvQkMsaUI7QUFDakIsNkJBQWFDLEtBQWIsRUFBb0JILE9BQXBCLEVBQTZCO0FBQ3pCO0FBQ0EsVUFBS0EsT0FBTCxHQUFlQSxPQUFmO0FBQ0EsVUFBS0ksU0FBTCxHQUFpQkQsS0FBakI7QUFDQSxVQUFLRSxlQUFMLENBQXNCLENBQXRCO0FBQ0EsVUFBS0MsWUFBTCxHQUFvQixJQUFJckIsYUFBSixDQUFtQmtCLEtBQW5CLEVBQTBCSCxPQUExQixDQUFwQjtBQUNBLFVBQUtPLE9BQUwsR0FBZSxFQUFmLENBTnlCO0FBTzVCOztBQUVEOzs7OztBQUtnQkMsSUFBQUEsUSxFQUFVO0FBQ3RCLFVBQUlDLGVBQWUsR0FBRyxFQUF0QjtBQUNBLFVBQU1DLElBQUksR0FBRyxJQUFiO0FBQ0EsVUFBSUMsUUFBUSxHQUFHO0FBQ1hDLFFBQUFBLEtBQUssRUFBQyxDQURLO0FBRVhDLFFBQUFBLE9BQU8sRUFBQyxDQUZHO0FBR1hDLFFBQUFBLE9BQU8sRUFBQyxDQUhHLEVBQWY7O0FBS0EsVUFBSU4sUUFBUSxDQUFDSSxLQUFiLEVBQW9CO0FBQ2hCO0FBQ0FILFFBQUFBLGVBQWUsQ0FBQ0csS0FBaEIsR0FBd0IsVUFBVUcsRUFBVixFQUFjQyxHQUFkLEVBQW1CO0FBQ3ZDTCxVQUFBQSxRQUFRLENBQUNDLEtBQVQ7QUFDQUosVUFBQUEsUUFBUSxDQUFDSSxLQUFULENBQWVLLEtBQWYsQ0FBc0JQLElBQXRCLEVBQTRCUSxTQUE1QjtBQUNBUixVQUFBQSxJQUFJLENBQUNTLElBQUwsQ0FBVSxPQUFWLEVBQWtCSixFQUFsQixFQUFxQkMsR0FBckI7QUFDSCxTQUpEO0FBS0g7QUFDRCxVQUFJUixRQUFRLENBQUNLLE9BQWIsRUFBc0I7QUFDbEI7QUFDQUosUUFBQUEsZUFBZSxDQUFDSSxPQUFoQixHQUEwQixVQUFVRSxFQUFWLEVBQWNLLGFBQWQsRUFBNkJDLE1BQTdCLEVBQXFDQyxNQUFyQyxFQUE2QztBQUNuRVgsVUFBQUEsUUFBUSxDQUFDRSxPQUFUO0FBQ0FMLFVBQUFBLFFBQVEsQ0FBQ0ssT0FBVCxDQUFpQkksS0FBakIsQ0FBd0JQLElBQXhCLEVBQThCUSxTQUE5QjtBQUNBUixVQUFBQSxJQUFJLENBQUNTLElBQUwsQ0FBVSxTQUFWLEVBQW9CSixFQUFwQixFQUF3QkssYUFBeEIsRUFBdUNDLE1BQXZDLEVBQStDQyxNQUEvQztBQUNILFNBSkQ7QUFLSDtBQUNELFVBQUlkLFFBQVEsQ0FBQ00sT0FBYixFQUFzQjtBQUNsQjtBQUNBTCxRQUFBQSxlQUFlLENBQUNLLE9BQWhCLEdBQTBCLFVBQVVDLEVBQVYsRUFBY1EsVUFBZCxFQUEwQjtBQUNoRFosVUFBQUEsUUFBUSxDQUFDRyxPQUFUO0FBQ0FOLFVBQUFBLFFBQVEsQ0FBQ00sT0FBVCxDQUFpQkcsS0FBakIsQ0FBd0JQLElBQXhCLEVBQThCUSxTQUE5QjtBQUNBUixVQUFBQSxJQUFJLENBQUNTLElBQUwsQ0FBVSxTQUFWLEVBQW9CSixFQUFwQixFQUF3QlEsVUFBeEI7QUFDSCxTQUpEO0FBS0g7O0FBRUQsVUFBSUMsWUFBWSxHQUFHLEtBQW5CO0FBQ0EsV0FBS2xCLFlBQUwsQ0FBa0JtQixFQUFsQixDQUFzQixTQUF0QixnR0FBaUMsa0JBQU9DLEtBQVA7QUFDekJDLGtCQUFBQSxPQUR5QixHQUNmQyxJQUFJLENBQUNDLEdBQUwsRUFEZTtBQUV6QkMsa0JBQUFBLGNBRnlCLEdBRVIsTUFBSSxDQUFDMUIsU0FBTCxDQUFlMkIsaUJBQWYsRUFGUTs7QUFJekJDLGtCQUFBQSxNQUp5QixHQUloQjVDLENBQUMsQ0FBQzZDLEtBQUYsQ0FBUyxNQUFJLENBQUNDLGFBQUwsRUFBVDtBQUNaQyxrQkFBQUEsR0FEWSxDQUNQLFVBQUNDLEtBQUQsRUFBVztBQUNiLDJCQUFPL0MsYUFBYSxDQUFFK0MsS0FBRixFQUFTLEVBQUNOLGNBQWMsRUFBZEEsY0FBRCxFQUFpQk8sR0FBRyxFQUFFLElBQXRCLEVBQVQsQ0FBcEI7QUFDSCxtQkFIWTtBQUlaQyxrQkFBQUEsS0FKWSxFQUpnQjs7O0FBV3pCOUIsa0JBQUFBLFFBQVEsQ0FBQ0ssT0FBVDtBQUNBLG1CQUFDekIsQ0FBQyxDQUFDbUQsT0FBRixDQUFXUCxNQUFYLENBREQsSUFDdUIsQ0FBQzVDLENBQUMsQ0FBQ21ELE9BQUYsQ0FBV1QsY0FBWCxDQUR4QjtBQUVHLG1CQUFDTixZQUFELElBQWViLFFBQVEsQ0FBQ0MsS0FBVCxHQUFlLENBQTlCLElBQWlDRCxRQUFRLENBQUNFLE9BQVQsR0FBaUIsQ0FBbEQsSUFBcURGLFFBQVEsQ0FBQ0csT0FBVCxHQUFpQixDQUZ6RSxDQVh5Qjs7QUFlekJILGtCQUFBQSxRQUFRLENBQUNDLEtBQVQsR0FBZSxDQUFmO0FBQ0FELGtCQUFBQSxRQUFRLENBQUNFLE9BQVQsR0FBaUIsQ0FBakI7QUFDQUYsa0JBQUFBLFFBQVEsQ0FBQ0csT0FBVCxHQUFpQixDQUFqQjtBQUNBLGtCQUFBLE1BQUksQ0FBQ1IsWUFBTCxDQUFrQmtDLEtBQWxCO0FBQ0EsNkNBbkJ5QjtBQW9CRnJELG9CQUFBQSxhQUFhLENBQUM4QixLQUFkLENBQXFCLE1BQUksQ0FBQ2IsU0FBTCxDQUFlZ0MsS0FBcEMsRUFBMkMsQ0FBQ0osTUFBRCxFQUFTRixjQUFULENBQTNDLENBcEJFLFVBb0JyQlcsVUFwQnFCO0FBcUJuQkMsa0JBQUFBLGdCQXJCbUIsR0FxQkEsU0FBbkJBLGdCQUFtQixDQUFDQyxPQUFELEVBQVVDLE9BQVYsRUFBc0I7QUFDM0Msd0JBQUlELE9BQUo7QUFDSUEsb0JBQUFBLE9BQU8sQ0FBQ0UsUUFBUixDQUFpQkMsSUFBakI7QUFDSkMsb0JBQUFBLGNBQWMsQ0FBRUgsT0FBRixDQUFkO0FBQ0gsbUJBekJ3QjtBQTBCbkJHLGtCQUFBQSxjQTFCbUIsa0dBMEJGLGlCQUFPSCxPQUFQOzs7Ozs7QUFNVkksc0JBQUFBLFNBTlUseUlBTVZBLFNBTlUsb0JBTUc7QUFDbEJKLGdDQUFBQSxPQUFPLENBQUNLLE1BQVIsQ0FBZ0JMLE9BQU8sQ0FBQ0MsUUFBUixDQUFpQlgsYUFBakIsQ0FBZ0MsS0FBaEMsQ0FBaEI7QUFDQTlDLGdDQUFBQSxDQUFDLENBQUM4RCxJQUFGLENBQVFsQixNQUFSLEVBQWdCLFVBQUNJLEtBQUQsRUFBVztBQUN2QixzQ0FBSWUsYUFBYSxHQUFHZixLQUFLLENBQUNnQixlQUExQjtBQUNBLHNDQUFJLENBQUNoRSxDQUFDLENBQUNtRCxPQUFGLENBQVdZLGFBQVgsQ0FBTCxFQUFnQztBQUM1Qix3Q0FBSTNDLFFBQVEsQ0FBQ0ssT0FBYixFQUFzQjtBQUNsQkwsc0NBQUFBLFFBQVEsQ0FBQ0ssT0FBVCxDQUFpQkksS0FBakIsQ0FBd0JQLElBQXhCLEVBQThCLENBQUMwQixLQUFLLENBQUNyQixFQUFQLEVBQVdvQyxhQUFYLEVBQTBCZixLQUExQixFQUFpQ0EsS0FBakMsQ0FBOUI7QUFDQTFCLHNDQUFBQSxJQUFJLENBQUNTLElBQUwsQ0FBVyxTQUFYLEVBQXNCaUIsS0FBSyxDQUFDckIsRUFBNUIsRUFBZ0NvQyxhQUFoQyxFQUErQ2YsS0FBL0MsRUFBc0RBLEtBQXREO0FBQ0FBLHNDQUFBQSxLQUFLLENBQUNpQixvQkFBTjtBQUNIO0FBQ0o7QUFDSixpQ0FURDtBQVVILCtCQWxCa0IsQ0FDbkJULE9BQU8sQ0FBQ0MsUUFBUixHQUFtQixJQUFJNUQsYUFBSixDQUFtQjJELE9BQU8sQ0FBQ3pDLEtBQTNCLEVBQWtDLE1BQUksQ0FBQ0gsT0FBdkMsQ0FBbkIsQ0FDSXNELGNBRmUsR0FFRSxLQUZGLENBR2ZDLGdCQUhlLEdBR0ksQ0FISixFQUtuQjs7QUFlSUMsOEJBQUFBLGVBcEJlLEdBb0JHLFNBQWxCQSxlQUFrQixHQUFZO0FBQzlCLG9DQUFJLENBQUNELGdCQUFMLEVBQXVCO0FBQ25CQSxrQ0FBQUEsZ0JBQWdCLEdBQUcsSUFBbkI7QUFDQVgsa0NBQUFBLE9BQU8sQ0FBQ0MsUUFBUixDQUFpQlksSUFBakIsQ0FBdUIsU0FBdkIsRUFBa0MsWUFBTTtBQUNwQ1Qsb0NBQUFBLFNBQVM7QUFDVE8sb0NBQUFBLGdCQUFnQixHQUFHLEtBQW5CO0FBQ0gsbUNBSEQ7QUFJSDtBQUNKLCtCQTVCa0I7O0FBOEJuQlgsOEJBQUFBLE9BQU8sQ0FBQ0MsUUFBUixDQUFpQmEsY0FBakIsQ0FBaUM7QUFDN0I7QUFDQTlDLGdDQUFBQSxLQUY2QixpQkFFdEJHLEVBRnNCLEVBRWxCQyxHQUZrQixFQUViO0FBQ1osc0NBQUlzQyxjQUFKLEVBQW9CO0FBQ2hCRSxvQ0FBQUEsZUFBZTtBQUNsQjtBQUNKLGlDQU40QjtBQU83QjtBQUNBM0MsZ0NBQUFBLE9BUjZCLG1CQVFwQkUsRUFSb0IsRUFRaEJLLGFBUmdCLEVBUURDLE1BUkMsRUFRT0MsTUFSUCxFQVFlO0FBQ3hDa0Msa0NBQUFBLGVBQWU7QUFDbEIsaUNBVjRCO0FBVzdCO0FBQ0ExQyxnQ0FBQUEsT0FaNkIsbUJBWXBCQyxFQVpvQixFQVloQlEsVUFaZ0IsRUFZSjtBQUNyQmlDLGtDQUFBQSxlQUFlO0FBQ2xCLGlDQWQ0QixFQUFqQyxFQTlCbUI7O0FBOENiWixnQ0FBQUEsT0FBTyxDQUFDQyxRQUFSLENBQWlCYixNQUFqQixDQUF5QixLQUF6QixDQTlDYTtBQStDbkJnQiw4QkFBQUEsU0FBUztBQUNUTSw4QkFBQUEsY0FBYyxHQUFHLElBQWpCLENBaERtQjtBQWlEWlYsOEJBQUFBLE9BakRZLDJEQTFCRSxtQkEwQm5CRyxjQTFCbUI7Ozs7QUErRXJCWSxrQkFBQUEsV0EvRXFCLEdBK0VQdkUsQ0FBQyxDQUFDd0UsSUFBRixDQUFRLE1BQUksQ0FBQ3JELE9BQWIsQ0EvRU87O0FBaUZ6Qm5CLGtCQUFBQSxDQUFDLENBQUM4RCxJQUFGLENBQVFTLFdBQVIsaUdBQXFCLGtCQUFPRSxPQUFQO0FBQ2JDLDhCQUFBQSxRQURhLEdBQ0YsTUFBSSxDQUFDdkQsT0FBTCxDQUFhc0QsT0FBYixDQURFO0FBRWJFLDhCQUFBQSxRQUZhLEdBRUZ0QixVQUFVLENBQUNvQixPQUFELENBRlI7QUFHYiwrQkFBQ0UsUUFBRCxJQUFhM0UsQ0FBQyxDQUFDNEUsSUFBRixDQUFRRCxRQUFSLE1BQXNCM0UsQ0FBQyxDQUFDNEUsSUFBRixDQUFRRixRQUFSLENBSHRCO0FBSWIxRSw4QkFBQUEsQ0FBQyxDQUFDOEQsSUFBRixDQUFRWSxRQUFSLEVBQWtCLFVBQUNuQixPQUFELEVBQWE7QUFDM0JBLGdDQUFBQSxPQUFPLENBQUNFLFFBQVIsQ0FBaUJDLElBQWpCO0FBQ0gsK0JBRkQsRUFKYTtBQU9OLHFDQUFPLE1BQUksQ0FBQ3ZDLE9BQUwsQ0FBYXNELE9BQWIsQ0FQRDs7QUFTakJ6RSw4QkFBQUEsQ0FBQyxDQUFDOEQsSUFBRixDQUFRWSxRQUFSLEVBQWtCLFVBQUNHLFlBQUQsRUFBZUMsS0FBZixFQUF5QjtBQUN2QyxvQ0FBSUMsWUFBWSxHQUFHSixRQUFRLENBQUNHLEtBQUQsQ0FBM0I7QUFDQSxvQ0FBSTVFLFdBQVcsQ0FBRTJFLFlBQVksQ0FBQ3BCLFFBQWIsQ0FBc0IxQyxLQUF4QixFQUErQmdFLFlBQVksQ0FBQ2hFLEtBQTVDLENBQWYsRUFBbUU7O0FBRWxFLGlDQUZELE1BRU8sQ0FBQztBQUNKdUMsa0NBQUFBLGdCQUFnQixDQUFFdUIsWUFBRixFQUFnQkUsWUFBaEIsQ0FBaEI7QUFDSDtBQUNKLCtCQVBELEVBVGlCLDBEQUFyQixxRUFqRnlCOzs7QUFvR25CQyxvQkFBQUEsT0FBTyxDQUFDQyxHQUFSO0FBQ0ZqRixvQkFBQUEsQ0FBQyxDQUFDK0MsR0FBRixDQUFPTSxVQUFQLGlHQUFtQixrQkFBT3NCLFFBQVAsRUFBaUJGLE9BQWpCO0FBQ1YsZ0NBQUEsTUFBSSxDQUFDdEQsT0FBTCxDQUFhc0QsT0FBYixDQURVO0FBRVgsZ0NBQUEsTUFBSSxDQUFDdEQsT0FBTCxDQUFhc0QsT0FBYixJQUF3QixFQUF4QjtBQUNTUyxnQ0FBQUEsQ0FIRSxHQUdFLENBSEYsY0FHS0EsQ0FBQyxHQUFHUCxRQUFRLENBQUNRLE1BSGxCO0FBSUgzQixnQ0FBQUEsT0FKRyxHQUlPbUIsUUFBUSxDQUFDTyxDQUFELENBSmY7QUFLRHZCLGtDQUFBQSxjQUFjLENBQUVILE9BQUYsQ0FMYjtBQU1QLGdDQUFBLE1BQUksQ0FBQ3JDLE9BQUwsQ0FBYXNELE9BQWIsRUFBc0JXLElBQXRCLENBQTRCNUIsT0FBNUIsRUFOTyxPQUcwQjBCLENBQUMsRUFIM0IscUZBQW5CLHlFQURFLENBcEdtQjs7Ozs7QUFnSHpCLGtCQUFBLE1BQUksQ0FBQ2hFLFlBQUwsQ0FBa0JtRSxLQUFsQixHQWhIeUI7OztBQW1IekJDLGtCQUFBQSxPQW5IeUIsR0FtSGY5QyxJQUFJLENBQUNDLEdBQUwsS0FBY0YsT0FuSEM7QUFvSDdCSCxrQkFBQUEsWUFBWSxHQUFHLElBQWY7QUFDQSxrQkFBQSxNQUFJLENBQUNMLElBQUwsQ0FBVyxTQUFYLEVBQXNCTyxLQUFLLEdBQUdnRCxPQUE5QixFQXJINkIsMkRBQWpDOztBQXVIQSxXQUFLcEUsWUFBTCxDQUFrQm9ELGNBQWxCLENBQWtDakQsZUFBbEM7QUFDQSxhQUFPLElBQVA7QUFDSCxLOztBQUUyQixTQUFia0UsR0FBYSx1RUFBUCxLQUFPO0FBQ3hCLGFBQU92RixDQUFDLENBQUM2QyxLQUFGLENBQVMsS0FBSzNCLFlBQUwsQ0FBa0JzRSxTQUEzQjtBQUNOQyxNQUFBQSxNQURNO0FBRU4xQyxNQUFBQSxHQUZNLENBRUQsVUFBQ0MsS0FBRCxFQUFXO0FBQ2IsWUFBSXVDLEdBQUosRUFBUztBQUNMLGlCQUFPdkMsS0FBSyxDQUFDMEMsUUFBTixDQUFnQixFQUFDQyxPQUFPLEVBQUUsS0FBVixFQUFoQixDQUFQO0FBQ0g7QUFDRCxlQUFPM0MsS0FBUDtBQUNILE9BUE07QUFRTkUsTUFBQUEsS0FSTSxFQUFQO0FBU0gsSzs7QUFFT3FDLElBQUFBLEcsRUFBSztBQUNULGFBQU8sS0FBS3JFLFlBQUwsQ0FBa0IwQixNQUFsQixDQUEwQjJDLEdBQTFCLENBQVA7QUFDSCxLOztBQUVPO0FBQ0osV0FBS3JFLFlBQUwsQ0FBa0J3QyxJQUFsQjtBQUNBLFVBQUlhLFdBQVcsR0FBR3ZFLENBQUMsQ0FBQ3dFLElBQUYsQ0FBUSxLQUFLckQsT0FBYixDQUFsQjtBQUNBbkIsTUFBQUEsQ0FBQyxDQUFDOEQsSUFBRixDQUFRUyxXQUFSLGlHQUFxQixrQkFBT0UsT0FBUDtBQUNiQyxrQkFBQUEsUUFEYSxHQUNGLE1BQUksQ0FBQ3ZELE9BQUwsQ0FBYXNELE9BQWIsQ0FERTtBQUVqQnpFLGtCQUFBQSxDQUFDLENBQUM4RCxJQUFGLENBQVFZLFFBQVIsRUFBa0IsVUFBQ25CLE9BQUQsRUFBYTtBQUMzQkEsb0JBQUFBLE9BQU8sQ0FBQ0UsUUFBUixDQUFpQkMsSUFBakI7QUFDSCxtQkFGRCxFQUZpQiwwREFBckI7O0FBTUEsV0FBS3ZDLE9BQUwsR0FBZSxFQUFmO0FBQ0gsSyxnQ0F0TTBDckIsWSx1QkFBMUJnQixpQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBPYnNlcnZlQ3Vyc29yIGZyb20gXCIuL09ic2VydmVDdXJzb3JcIjtcbmltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSAnZXZlbnRzJztcbmltcG9ydCB7bW9kZWxQb3B1bGF0ZX0gZnJvbSAnLi9tb25nb29zZVV0aWxzJztcbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuaW1wb3J0IHBvcHVsYXRlUHJveHkgZnJvbSAnLi9Qb3B1bGF0ZVByb3h5JztcblxuZnVuY3Rpb24gcXVlcnlFcXVhbHMgKHF1ZXJ5MSwgcXVlcnkyKSB7XG4gICAgaWYgKCFxdWVyeTEgJiYgIXF1ZXJ5MilcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgaWYgKCFxdWVyeTEgfHwgIXF1ZXJ5MilcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChxdWVyeTEub3AgIT09IHF1ZXJ5Mi5vcClcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGxldCBzZXJpYWxpemVkQ29uZGl0aW9uMSA9IEpTT04uc3RyaW5naWZ5IChxdWVyeTEuX2NvbmRpdGlvbnMpO1xuICAgIGxldCBzZXJpYWxpemVkQ29uZGl0aW9uMiA9IEpTT04uc3RyaW5naWZ5IChxdWVyeTIuX2NvbmRpdGlvbnMpO1xuICAgIGlmIChzZXJpYWxpemVkQ29uZGl0aW9uMSAhPT0gc2VyaWFsaXplZENvbmRpdGlvbjIpXG4gICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgIGxldCBzZXJpYWxpemVkT3B0aW9uczEgPSBKU09OLnN0cmluZ2lmeSAocXVlcnkxLm9wdGlvbnMpO1xuICAgIGxldCBzZXJpYWxpemVkT3B0aW9uczIgPSBKU09OLnN0cmluZ2lmeSAocXVlcnkyLm9wdGlvbnMpO1xuICAgIGlmIChzZXJpYWxpemVkT3B0aW9uczEgIT09IHNlcmlhbGl6ZWRPcHRpb25zMilcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiB0cnVlO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBPYnNlcnZlQ3Vyc29yRGVlcCBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gICAgY29uc3RydWN0b3IgKHF1ZXJ5LCBvcHRpb25zKSB7XG4gICAgICAgIHN1cGVyICgpO1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgICAgICB0aGlzLnJvb3RRdWVyeSA9IHF1ZXJ5O1xuICAgICAgICB0aGlzLnNldE1heExpc3RlbmVycyAoMCk7XG4gICAgICAgIHRoaXMucm9vdE9ic2VydmVyID0gbmV3IE9ic2VydmVDdXJzb3IgKHF1ZXJ5LCBvcHRpb25zKTtcbiAgICAgICAgdGhpcy5wb3BEYXRhID0ge307XG4gICAgfVxuXG4gICAgLyoqQHBhcmFtIHtvYmplY3R9IGhhbmRsZXJzXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbihpZDpTdHJpbmcsIGRvYzptb25nb29zZS5Eb2N1bWVudCl9IGhhbmRsZXJzLmFkZGVkXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbihpZDpzdHJpbmcsIGNoYW5nZWRGaWVsZHM6b2JqZWN0LG5ld0RvYzptb25nb29zZS5Eb2N1bWVudCxvbGREb2M6IG1vbmdvb3NlLkRvY3VtZW50KX0gaGFuZGxlcnMuY2hhbmdlZFxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oaWQ6U3RyaW5nLCByZW1vdmVkRG9jOm1vbmdvb3NlLkRvY3VtZW50KX0gaGFuZGxlcnMucmVtb3ZlZFxuICAgICAqKi9cbiAgICBvYnNlcnZlQ2hhbmdlcyAoaGFuZGxlcnMpIHtcbiAgICAgICAgbGV0IGhhbmRsZXJzV3JhcHBlciA9IHt9O1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICAgICAgbGV0IGNvdW50ZXJzID0ge1xuICAgICAgICAgICAgYWRkZWQ6MCxcbiAgICAgICAgICAgIGNoYW5nZWQ6MCxcbiAgICAgICAgICAgIHJlbW92ZWQ6MFxuICAgICAgICB9XG4gICAgICAgIGlmIChoYW5kbGVycy5hZGRlZCkge1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gICAgICAgICAgICBoYW5kbGVyc1dyYXBwZXIuYWRkZWQgPSBmdW5jdGlvbiAoaWQsIGRvYykge1xuICAgICAgICAgICAgICAgIGNvdW50ZXJzLmFkZGVkKys7XG4gICAgICAgICAgICAgICAgaGFuZGxlcnMuYWRkZWQuYXBwbHkgKHNlbGYsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgc2VsZi5lbWl0KCdhZGRlZCcsaWQsZG9jKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoaGFuZGxlcnMuY2hhbmdlZCkge1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gICAgICAgICAgICBoYW5kbGVyc1dyYXBwZXIuY2hhbmdlZCA9IGZ1bmN0aW9uIChpZCwgY2hhbmdlZEZpZWxkcywgbmV3RG9jLCBvbGREb2MpIHtcbiAgICAgICAgICAgICAgICBjb3VudGVycy5jaGFuZ2VkKys7XG4gICAgICAgICAgICAgICAgaGFuZGxlcnMuY2hhbmdlZC5hcHBseSAoc2VsZiwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICBzZWxmLmVtaXQoJ2NoYW5nZWQnLGlkLCBjaGFuZ2VkRmllbGRzLCBuZXdEb2MsIG9sZERvYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGhhbmRsZXJzLnJlbW92ZWQpIHtcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFyc1xuICAgICAgICAgICAgaGFuZGxlcnNXcmFwcGVyLnJlbW92ZWQgPSBmdW5jdGlvbiAoaWQsIHJlbW92ZWREb2MpIHtcbiAgICAgICAgICAgICAgICBjb3VudGVycy5yZW1vdmVkKys7XG4gICAgICAgICAgICAgICAgaGFuZGxlcnMucmVtb3ZlZC5hcHBseSAoc2VsZiwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICBzZWxmLmVtaXQoJ3JlbW92ZWQnLGlkLCByZW1vdmVkRG9jKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGxldCB3YXNSZWZyZXNoZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5yb290T2JzZXJ2ZXIub24gKCdyZWZyZXNoJywgYXN5bmMgKGRlbGF5KSA9PiB7XG4gICAgICAgICAgICBsZXQgc3RhcnRlZCA9IERhdGUubm93ICgpO1xuICAgICAgICAgICAgbGV0IHBvcHVsYXRlZFBhdGhzID0gdGhpcy5yb290UXVlcnkuZ2V0UG9wdWxhdGVkUGF0aHMgKCk7XG5cbiAgICAgICAgICAgIGxldCBtb2RlbHMgPSBfLmNoYWluICh0aGlzLmN1cnJlbnRNb2RlbHMgKCkpXG4gICAgICAgICAgICAubWFwICgobW9kZWwpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcG9wdWxhdGVQcm94eSAobW9kZWwsIHtwb3B1bGF0ZWRQYXRocywgc2V0OiB0cnVlfSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudmFsdWUgKCk7XG5cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICBoYW5kbGVycy5jaGFuZ2VkICYmXG4gICAgICAgICAgICAgICAgIV8uaXNFbXB0eSAobW9kZWxzKSAmJiAhXy5pc0VtcHR5IChwb3B1bGF0ZWRQYXRocylcbiAgICAgICAgICAgICAgICAmJighd2FzUmVmcmVzaGVkfHxjb3VudGVycy5hZGRlZD4wfHxjb3VudGVycy5jaGFuZ2VkPjB8fGNvdW50ZXJzLnJlbW92ZWQ+MClcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIGNvdW50ZXJzLmFkZGVkPTA7XG4gICAgICAgICAgICAgICAgY291bnRlcnMuY2hhbmdlZD0wO1xuICAgICAgICAgICAgICAgIGNvdW50ZXJzLnJlbW92ZWQ9MDtcbiAgICAgICAgICAgICAgICB0aGlzLnJvb3RPYnNlcnZlci5wYXVzZSAoKTtcbiAgICAgICAgICAgICAgICAvKipAdHlwZSBBcnJheTxRdWVyeUl0ZW0+Ki9cbiAgICAgICAgICAgICAgICBsZXQgbmV3UXVlcmllcyA9IGF3YWl0IG1vZGVsUG9wdWxhdGUuYXBwbHkgKHRoaXMucm9vdFF1ZXJ5Lm1vZGVsLCBbbW9kZWxzLCBwb3B1bGF0ZWRQYXRoc10pO1xuICAgICAgICAgICAgICAgIGNvbnN0IHF1ZXJ5SXRlbUNoYW5nZWQgPSAob2xkSXRlbSwgbmV3SXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAob2xkSXRlbSlcbiAgICAgICAgICAgICAgICAgICAgICAgIG9sZEl0ZW0ub2JzZXJ2ZXIuc3RvcCAoKTtcbiAgICAgICAgICAgICAgICAgICAgcXVlcnlJdGVtQWRkZWQgKG5ld0l0ZW0pO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgY29uc3QgcXVlcnlJdGVtQWRkZWQgPSBhc3luYyAobmV3SXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBuZXdJdGVtLm9ic2VydmVyID0gbmV3IE9ic2VydmVDdXJzb3IgKG5ld0l0ZW0ucXVlcnksIHRoaXMub3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgIGxldCBwb3B1bGF0ZUxvYWRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBsZXQgcmVmcmVzaFNjaGVkdWxlZCA9IDA7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWlubmVyLWRlY2xhcmF0aW9uc1xuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBkb1JlZnJlc2ggKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3SXRlbS5hc3NpZ24gKG5ld0l0ZW0ub2JzZXJ2ZXIuY3VycmVudE1vZGVscyAoZmFsc2UpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIF8uZWFjaCAobW9kZWxzLCAobW9kZWwpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgY2hhbmdlZFBhdGhlcyA9IG1vZGVsLl9fY2hhbmdlZFBhdGhlcztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIV8uaXNFbXB0eSAoY2hhbmdlZFBhdGhlcykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhhbmRsZXJzLmNoYW5nZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZXJzLmNoYW5nZWQuYXBwbHkgKHNlbGYsIFttb2RlbC5pZCwgY2hhbmdlZFBhdGhlcywgbW9kZWwsIG1vZGVsXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmVtaXQgKCdjaGFuZ2VkJywgbW9kZWwuaWQsIGNoYW5nZWRQYXRoZXMsIG1vZGVsLCBtb2RlbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RlbC5fX2NsZWFyQ2hhbmdlZFBhdGhlcyAoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgbGV0IHNjaGVkdWxlUmVmcmVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmVmcmVzaFNjaGVkdWxlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZnJlc2hTY2hlZHVsZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0l0ZW0ub2JzZXJ2ZXIub25jZSAoJ3JlZnJlc2gnLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvUmVmcmVzaCAoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVmcmVzaFNjaGVkdWxlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgIG5ld0l0ZW0ub2JzZXJ2ZXIub2JzZXJ2ZUNoYW5nZXMgKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFyc1xuICAgICAgICAgICAgICAgICAgICAgICAgYWRkZWQgKGlkLCBkb2MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocG9wdWxhdGVMb2FkZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NoZWR1bGVSZWZyZXNoICgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZWQgKGlkLCBjaGFuZ2VkRmllbGRzLCBuZXdEb2MsIG9sZERvYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjaGVkdWxlUmVmcmVzaCAoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZWQgKGlkLCByZW1vdmVkRG9jKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NoZWR1bGVSZWZyZXNoICgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgbmV3SXRlbS5vYnNlcnZlci5tb2RlbHMgKGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgZG9SZWZyZXNoICgpO1xuICAgICAgICAgICAgICAgICAgICBwb3B1bGF0ZUxvYWRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXdJdGVtO1xuICAgICAgICAgICAgICAgIH07XG5cblxuICAgICAgICAgICAgICAgIGxldCBvbGRQb3BQYXRocyA9IF8ua2V5cyAodGhpcy5wb3BEYXRhKTtcblxuICAgICAgICAgICAgICAgIF8uZWFjaCAob2xkUG9wUGF0aHMsIGFzeW5jIChwb3BOYW1lKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBvbGRJdGVtcyA9IHRoaXMucG9wRGF0YVtwb3BOYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG5ld0l0ZW1zID0gbmV3UXVlcmllc1twb3BOYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFuZXdJdGVtcyB8fCBfLnNpemUgKG5ld0l0ZW1zKSAhPT0gXy5zaXplIChvbGRJdGVtcykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF8uZWFjaCAob2xkSXRlbXMsIChvbGRJdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2xkSXRlbS5vYnNlcnZlci5zdG9wICgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGVsZXRlIHRoaXMucG9wRGF0YVtwb3BOYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBfLmVhY2ggKG9sZEl0ZW1zLCAob2xkUXVlcnlJdGVtLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG5ld1F1ZXJ5SXRlbSA9IG5ld0l0ZW1zW2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChxdWVyeUVxdWFscyAob2xkUXVlcnlJdGVtLm9ic2VydmVyLnF1ZXJ5LCBuZXdRdWVyeUl0ZW0ucXVlcnkpKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7Ly/QuNC30LzQtdC90LjQu9C+0YHRjFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXJ5SXRlbUNoYW5nZWQgKG9sZFF1ZXJ5SXRlbSwgbmV3UXVlcnlJdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBhd2FpdCBQcm9taXNlLmFsbCAoXG4gICAgICAgICAgICAgICAgICAgIF8ubWFwIChuZXdRdWVyaWVzLCBhc3luYyAobmV3SXRlbXMsIHBvcE5hbWUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5wb3BEYXRhW3BvcE5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3BEYXRhW3BvcE5hbWVdID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuZXdJdGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbmV3SXRlbSA9IG5ld0l0ZW1zW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBxdWVyeUl0ZW1BZGRlZCAobmV3SXRlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucG9wRGF0YVtwb3BOYW1lXS5wdXNoIChuZXdJdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgICAgICAgIHRoaXMucm9vdE9ic2VydmVyLmF3YWtlICgpO1xuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgc3BlbmRlZCA9IERhdGUubm93ICgpIC0gc3RhcnRlZDtcbiAgICAgICAgICAgIHdhc1JlZnJlc2hlZCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmVtaXQgKCdyZWZyZXNoJywgZGVsYXkgKyBzcGVuZGVkKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMucm9vdE9ic2VydmVyLm9ic2VydmVDaGFuZ2VzIChoYW5kbGVyc1dyYXBwZXIpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBjdXJyZW50TW9kZWxzIChyYXcgPSBmYWxzZSkge1xuICAgICAgICByZXR1cm4gXy5jaGFpbiAodGhpcy5yb290T2JzZXJ2ZXIubW9kZWxzTWFwKVxuICAgICAgICAudmFsdWVzICgpXG4gICAgICAgIC5tYXAgKChtb2RlbCkgPT4ge1xuICAgICAgICAgICAgaWYgKHJhdykge1xuICAgICAgICAgICAgICAgIHJldHVybiBtb2RlbC50b09iamVjdCAoe2dldHRlcnM6IGZhbHNlfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbW9kZWw7XG4gICAgICAgIH0pXG4gICAgICAgIC52YWx1ZSAoKVxuICAgIH1cblxuICAgIG1vZGVscyAocmF3KSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJvb3RPYnNlcnZlci5tb2RlbHMgKHJhdyk7XG4gICAgfVxuXG4gICAgc3RvcCAoKSB7XG4gICAgICAgIHRoaXMucm9vdE9ic2VydmVyLnN0b3AgKCk7XG4gICAgICAgIGxldCBvbGRQb3BQYXRocyA9IF8ua2V5cyAodGhpcy5wb3BEYXRhKTtcbiAgICAgICAgXy5lYWNoIChvbGRQb3BQYXRocywgYXN5bmMgKHBvcE5hbWUpID0+IHtcbiAgICAgICAgICAgIGxldCBvbGRJdGVtcyA9IHRoaXMucG9wRGF0YVtwb3BOYW1lXTtcbiAgICAgICAgICAgIF8uZWFjaCAob2xkSXRlbXMsIChvbGRJdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgb2xkSXRlbS5vYnNlcnZlci5zdG9wICgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnBvcERhdGEgPSB7fTtcbiAgICB9XG5cbn0iXX0=