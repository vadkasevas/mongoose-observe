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
        };
      }
      if (handlers.changed) {
        // eslint-disable-next-line no-unused-vars
        handlersWrapper.changed = function (id, changedFields, newDoc, oldDoc) {
          counters.changed++;
          handlers.changed.apply(self, arguments);
        };
      }
      if (handlers.removed) {
        // eslint-disable-next-line no-unused-vars
        handlersWrapper.removed = function (id, removedDoc) {
          counters.removed++;
          handlers.removed.apply(self, arguments);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9PYnNlcnZlQ3Vyc29yRGVlcC5qcyJdLCJuYW1lcyI6WyJPYnNlcnZlQ3Vyc29yIiwiRXZlbnRFbWl0dGVyIiwibW9kZWxQb3B1bGF0ZSIsIl8iLCJwb3B1bGF0ZVByb3h5IiwicXVlcnlFcXVhbHMiLCJxdWVyeTEiLCJxdWVyeTIiLCJvcCIsInNlcmlhbGl6ZWRDb25kaXRpb24xIiwiSlNPTiIsInN0cmluZ2lmeSIsIl9jb25kaXRpb25zIiwic2VyaWFsaXplZENvbmRpdGlvbjIiLCJzZXJpYWxpemVkT3B0aW9uczEiLCJvcHRpb25zIiwic2VyaWFsaXplZE9wdGlvbnMyIiwiT2JzZXJ2ZUN1cnNvckRlZXAiLCJxdWVyeSIsInJvb3RRdWVyeSIsInNldE1heExpc3RlbmVycyIsInJvb3RPYnNlcnZlciIsInBvcERhdGEiLCJoYW5kbGVycyIsImhhbmRsZXJzV3JhcHBlciIsInNlbGYiLCJjb3VudGVycyIsImFkZGVkIiwiY2hhbmdlZCIsInJlbW92ZWQiLCJpZCIsImRvYyIsImFwcGx5IiwiYXJndW1lbnRzIiwiY2hhbmdlZEZpZWxkcyIsIm5ld0RvYyIsIm9sZERvYyIsInJlbW92ZWREb2MiLCJ3YXNSZWZyZXNoZWQiLCJvbiIsImRlbGF5Iiwic3RhcnRlZCIsIkRhdGUiLCJub3ciLCJwb3B1bGF0ZWRQYXRocyIsImdldFBvcHVsYXRlZFBhdGhzIiwibW9kZWxzIiwiY2hhaW4iLCJjdXJyZW50TW9kZWxzIiwibWFwIiwibW9kZWwiLCJzZXQiLCJ2YWx1ZSIsImlzRW1wdHkiLCJwYXVzZSIsIm5ld1F1ZXJpZXMiLCJxdWVyeUl0ZW1DaGFuZ2VkIiwib2xkSXRlbSIsIm5ld0l0ZW0iLCJvYnNlcnZlciIsInN0b3AiLCJxdWVyeUl0ZW1BZGRlZCIsImRvUmVmcmVzaCIsImFzc2lnbiIsImVhY2giLCJjaGFuZ2VkUGF0aGVzIiwiX19jaGFuZ2VkUGF0aGVzIiwiZW1pdCIsIl9fY2xlYXJDaGFuZ2VkUGF0aGVzIiwicG9wdWxhdGVMb2FkZWQiLCJyZWZyZXNoU2NoZWR1bGVkIiwic2NoZWR1bGVSZWZyZXNoIiwib25jZSIsIm9ic2VydmVDaGFuZ2VzIiwib2xkUG9wUGF0aHMiLCJrZXlzIiwicG9wTmFtZSIsIm9sZEl0ZW1zIiwibmV3SXRlbXMiLCJzaXplIiwib2xkUXVlcnlJdGVtIiwiaW5kZXgiLCJuZXdRdWVyeUl0ZW0iLCJQcm9taXNlIiwiYWxsIiwiaSIsImxlbmd0aCIsInB1c2giLCJhd2FrZSIsInNwZW5kZWQiLCJyYXciLCJtb2RlbHNNYXAiLCJ2YWx1ZXMiLCJ0b09iamVjdCIsImdldHRlcnMiXSwibWFwcGluZ3MiOiJxNkNBQUEsZ0QsSUFBT0EsYTtBQUNQLGdDLElBQU9DLFk7QUFDUCxnRCxJQUFRQyxhLGtCQUFBQSxhO0FBQ1Isd0MsSUFBT0MsQztBQUNQLGdELElBQU9DLGE7O0FBRVAsU0FBU0MsV0FBVCxDQUFzQkMsTUFBdEIsRUFBOEJDLE1BQTlCLEVBQXNDO0FBQ2xDLE1BQUksQ0FBQ0QsTUFBRCxJQUFXLENBQUNDLE1BQWhCO0FBQ0ksU0FBTyxJQUFQO0FBQ0osTUFBSSxDQUFDRCxNQUFELElBQVcsQ0FBQ0MsTUFBaEI7QUFDSSxTQUFPLEtBQVA7QUFDSixNQUFJRCxNQUFNLENBQUNFLEVBQVAsS0FBY0QsTUFBTSxDQUFDQyxFQUF6QjtBQUNJLFNBQU8sS0FBUDtBQUNKLE1BQUlDLG9CQUFvQixHQUFHQyxJQUFJLENBQUNDLFNBQUwsQ0FBZ0JMLE1BQU0sQ0FBQ00sV0FBdkIsQ0FBM0I7QUFDQSxNQUFJQyxvQkFBb0IsR0FBR0gsSUFBSSxDQUFDQyxTQUFMLENBQWdCSixNQUFNLENBQUNLLFdBQXZCLENBQTNCO0FBQ0EsTUFBSUgsb0JBQW9CLEtBQUtJLG9CQUE3QjtBQUNJLFNBQU8sS0FBUDs7QUFFSixNQUFJQyxrQkFBa0IsR0FBR0osSUFBSSxDQUFDQyxTQUFMLENBQWdCTCxNQUFNLENBQUNTLE9BQXZCLENBQXpCO0FBQ0EsTUFBSUMsa0JBQWtCLEdBQUdOLElBQUksQ0FBQ0MsU0FBTCxDQUFnQkosTUFBTSxDQUFDUSxPQUF2QixDQUF6QjtBQUNBLE1BQUlELGtCQUFrQixLQUFLRSxrQkFBM0I7QUFDSSxTQUFPLEtBQVA7QUFDSixTQUFPLElBQVA7QUFDSCxDOztBQUVvQkMsaUI7QUFDakIsNkJBQWFDLEtBQWIsRUFBb0JILE9BQXBCLEVBQTZCO0FBQ3pCO0FBQ0EsVUFBS0EsT0FBTCxHQUFlQSxPQUFmO0FBQ0EsVUFBS0ksU0FBTCxHQUFpQkQsS0FBakI7QUFDQSxVQUFLRSxlQUFMLENBQXNCLENBQXRCO0FBQ0EsVUFBS0MsWUFBTCxHQUFvQixJQUFJckIsYUFBSixDQUFtQmtCLEtBQW5CLEVBQTBCSCxPQUExQixDQUFwQjtBQUNBLFVBQUtPLE9BQUwsR0FBZSxFQUFmLENBTnlCO0FBTzVCOztBQUVEOzs7OztBQUtnQkMsSUFBQUEsUSxFQUFVO0FBQ3RCLFVBQUlDLGVBQWUsR0FBRyxFQUF0QjtBQUNBLFVBQU1DLElBQUksR0FBRyxJQUFiO0FBQ0EsVUFBSUMsUUFBUSxHQUFHO0FBQ1hDLFFBQUFBLEtBQUssRUFBQyxDQURLO0FBRVhDLFFBQUFBLE9BQU8sRUFBQyxDQUZHO0FBR1hDLFFBQUFBLE9BQU8sRUFBQyxDQUhHLEVBQWY7O0FBS0EsVUFBSU4sUUFBUSxDQUFDSSxLQUFiLEVBQW9CO0FBQ2hCO0FBQ0FILFFBQUFBLGVBQWUsQ0FBQ0csS0FBaEIsR0FBd0IsVUFBVUcsRUFBVixFQUFjQyxHQUFkLEVBQW1CO0FBQ3ZDTCxVQUFBQSxRQUFRLENBQUNDLEtBQVQ7QUFDQUosVUFBQUEsUUFBUSxDQUFDSSxLQUFULENBQWVLLEtBQWYsQ0FBc0JQLElBQXRCLEVBQTRCUSxTQUE1QjtBQUNILFNBSEQ7QUFJSDtBQUNELFVBQUlWLFFBQVEsQ0FBQ0ssT0FBYixFQUFzQjtBQUNsQjtBQUNBSixRQUFBQSxlQUFlLENBQUNJLE9BQWhCLEdBQTBCLFVBQVVFLEVBQVYsRUFBY0ksYUFBZCxFQUE2QkMsTUFBN0IsRUFBcUNDLE1BQXJDLEVBQTZDO0FBQ25FVixVQUFBQSxRQUFRLENBQUNFLE9BQVQ7QUFDQUwsVUFBQUEsUUFBUSxDQUFDSyxPQUFULENBQWlCSSxLQUFqQixDQUF3QlAsSUFBeEIsRUFBOEJRLFNBQTlCO0FBQ0gsU0FIRDtBQUlIO0FBQ0QsVUFBSVYsUUFBUSxDQUFDTSxPQUFiLEVBQXNCO0FBQ2xCO0FBQ0FMLFFBQUFBLGVBQWUsQ0FBQ0ssT0FBaEIsR0FBMEIsVUFBVUMsRUFBVixFQUFjTyxVQUFkLEVBQTBCO0FBQ2hEWCxVQUFBQSxRQUFRLENBQUNHLE9BQVQ7QUFDQU4sVUFBQUEsUUFBUSxDQUFDTSxPQUFULENBQWlCRyxLQUFqQixDQUF3QlAsSUFBeEIsRUFBOEJRLFNBQTlCO0FBQ0gsU0FIRDtBQUlIOztBQUVELFVBQUlLLFlBQVksR0FBRyxLQUFuQjtBQUNBLFdBQUtqQixZQUFMLENBQWtCa0IsRUFBbEIsQ0FBc0IsU0FBdEIsZ0dBQWlDLGtCQUFPQyxLQUFQO0FBQ3pCQyxrQkFBQUEsT0FEeUIsR0FDZkMsSUFBSSxDQUFDQyxHQUFMLEVBRGU7QUFFekJDLGtCQUFBQSxjQUZ5QixHQUVSLE1BQUksQ0FBQ3pCLFNBQUwsQ0FBZTBCLGlCQUFmLEVBRlE7O0FBSXpCQyxrQkFBQUEsTUFKeUIsR0FJaEIzQyxDQUFDLENBQUM0QyxLQUFGLENBQVMsTUFBSSxDQUFDQyxhQUFMLEVBQVQ7QUFDWkMsa0JBQUFBLEdBRFksQ0FDUCxVQUFDQyxLQUFELEVBQVc7QUFDYiwyQkFBTzlDLGFBQWEsQ0FBRThDLEtBQUYsRUFBUyxFQUFDTixjQUFjLEVBQWRBLGNBQUQsRUFBaUJPLEdBQUcsRUFBRSxJQUF0QixFQUFULENBQXBCO0FBQ0gsbUJBSFk7QUFJWkMsa0JBQUFBLEtBSlksRUFKZ0I7OztBQVd6QjdCLGtCQUFBQSxRQUFRLENBQUNLLE9BQVQ7QUFDQSxtQkFBQ3pCLENBQUMsQ0FBQ2tELE9BQUYsQ0FBV1AsTUFBWCxDQURELElBQ3VCLENBQUMzQyxDQUFDLENBQUNrRCxPQUFGLENBQVdULGNBQVgsQ0FEeEI7QUFFRyxtQkFBQ04sWUFBRCxJQUFlWixRQUFRLENBQUNDLEtBQVQsR0FBZSxDQUE5QixJQUFpQ0QsUUFBUSxDQUFDRSxPQUFULEdBQWlCLENBQWxELElBQXFERixRQUFRLENBQUNHLE9BQVQsR0FBaUIsQ0FGekUsQ0FYeUI7O0FBZXpCSCxrQkFBQUEsUUFBUSxDQUFDQyxLQUFULEdBQWUsQ0FBZjtBQUNBRCxrQkFBQUEsUUFBUSxDQUFDRSxPQUFULEdBQWlCLENBQWpCO0FBQ0FGLGtCQUFBQSxRQUFRLENBQUNHLE9BQVQsR0FBaUIsQ0FBakI7QUFDQSxrQkFBQSxNQUFJLENBQUNSLFlBQUwsQ0FBa0JpQyxLQUFsQjtBQUNBLDZDQW5CeUI7QUFvQkZwRCxvQkFBQUEsYUFBYSxDQUFDOEIsS0FBZCxDQUFxQixNQUFJLENBQUNiLFNBQUwsQ0FBZStCLEtBQXBDLEVBQTJDLENBQUNKLE1BQUQsRUFBU0YsY0FBVCxDQUEzQyxDQXBCRSxVQW9CckJXLFVBcEJxQjtBQXFCbkJDLGtCQUFBQSxnQkFyQm1CLEdBcUJBLFNBQW5CQSxnQkFBbUIsQ0FBQ0MsT0FBRCxFQUFVQyxPQUFWLEVBQXNCO0FBQzNDLHdCQUFJRCxPQUFKO0FBQ0lBLG9CQUFBQSxPQUFPLENBQUNFLFFBQVIsQ0FBaUJDLElBQWpCO0FBQ0pDLG9CQUFBQSxjQUFjLENBQUVILE9BQUYsQ0FBZDtBQUNILG1CQXpCd0I7QUEwQm5CRyxrQkFBQUEsY0ExQm1CLGtHQTBCRixpQkFBT0gsT0FBUDs7Ozs7O0FBTVZJLHNCQUFBQSxTQU5VLHlJQU1WQSxTQU5VLG9CQU1HO0FBQ2xCSixnQ0FBQUEsT0FBTyxDQUFDSyxNQUFSLENBQWdCTCxPQUFPLENBQUNDLFFBQVIsQ0FBaUJYLGFBQWpCLENBQWdDLEtBQWhDLENBQWhCO0FBQ0E3QyxnQ0FBQUEsQ0FBQyxDQUFDNkQsSUFBRixDQUFRbEIsTUFBUixFQUFnQixVQUFDSSxLQUFELEVBQVc7QUFDdkIsc0NBQUllLGFBQWEsR0FBR2YsS0FBSyxDQUFDZ0IsZUFBMUI7QUFDQSxzQ0FBSSxDQUFDL0QsQ0FBQyxDQUFDa0QsT0FBRixDQUFXWSxhQUFYLENBQUwsRUFBZ0M7QUFDNUIsd0NBQUkxQyxRQUFRLENBQUNLLE9BQWIsRUFBc0I7QUFDbEJMLHNDQUFBQSxRQUFRLENBQUNLLE9BQVQsQ0FBaUJJLEtBQWpCLENBQXdCUCxJQUF4QixFQUE4QixDQUFDeUIsS0FBSyxDQUFDcEIsRUFBUCxFQUFXbUMsYUFBWCxFQUEwQmYsS0FBMUIsRUFBaUNBLEtBQWpDLENBQTlCO0FBQ0F6QixzQ0FBQUEsSUFBSSxDQUFDMEMsSUFBTCxDQUFXLFNBQVgsRUFBc0JqQixLQUFLLENBQUNwQixFQUE1QixFQUFnQ21DLGFBQWhDLEVBQStDZixLQUEvQyxFQUFzREEsS0FBdEQ7QUFDQUEsc0NBQUFBLEtBQUssQ0FBQ2tCLG9CQUFOO0FBQ0g7QUFDSjtBQUNKLGlDQVREO0FBVUgsK0JBbEJrQixDQUNuQlYsT0FBTyxDQUFDQyxRQUFSLEdBQW1CLElBQUkzRCxhQUFKLENBQW1CMEQsT0FBTyxDQUFDeEMsS0FBM0IsRUFBa0MsTUFBSSxDQUFDSCxPQUF2QyxDQUFuQixDQUNJc0QsY0FGZSxHQUVFLEtBRkYsQ0FHZkMsZ0JBSGUsR0FHSSxDQUhKLEVBS25COztBQWVJQyw4QkFBQUEsZUFwQmUsR0FvQkcsU0FBbEJBLGVBQWtCLEdBQVk7QUFDOUIsb0NBQUksQ0FBQ0QsZ0JBQUwsRUFBdUI7QUFDbkJBLGtDQUFBQSxnQkFBZ0IsR0FBRyxJQUFuQjtBQUNBWixrQ0FBQUEsT0FBTyxDQUFDQyxRQUFSLENBQWlCYSxJQUFqQixDQUF1QixTQUF2QixFQUFrQyxZQUFNO0FBQ3BDVixvQ0FBQUEsU0FBUztBQUNUUSxvQ0FBQUEsZ0JBQWdCLEdBQUcsS0FBbkI7QUFDSCxtQ0FIRDtBQUlIO0FBQ0osK0JBNUJrQjs7QUE4Qm5CWiw4QkFBQUEsT0FBTyxDQUFDQyxRQUFSLENBQWlCYyxjQUFqQixDQUFpQztBQUM3QjtBQUNBOUMsZ0NBQUFBLEtBRjZCLGlCQUV0QkcsRUFGc0IsRUFFbEJDLEdBRmtCLEVBRWI7QUFDWixzQ0FBSXNDLGNBQUosRUFBb0I7QUFDaEJFLG9DQUFBQSxlQUFlO0FBQ2xCO0FBQ0osaUNBTjRCO0FBTzdCO0FBQ0EzQyxnQ0FBQUEsT0FSNkIsbUJBUXBCRSxFQVJvQixFQVFoQkksYUFSZ0IsRUFRREMsTUFSQyxFQVFPQyxNQVJQLEVBUWU7QUFDeENtQyxrQ0FBQUEsZUFBZTtBQUNsQixpQ0FWNEI7QUFXN0I7QUFDQTFDLGdDQUFBQSxPQVo2QixtQkFZcEJDLEVBWm9CLEVBWWhCTyxVQVpnQixFQVlKO0FBQ3JCa0Msa0NBQUFBLGVBQWU7QUFDbEIsaUNBZDRCLEVBQWpDLEVBOUJtQjs7QUE4Q2JiLGdDQUFBQSxPQUFPLENBQUNDLFFBQVIsQ0FBaUJiLE1BQWpCLENBQXlCLEtBQXpCLENBOUNhO0FBK0NuQmdCLDhCQUFBQSxTQUFTO0FBQ1RPLDhCQUFBQSxjQUFjLEdBQUcsSUFBakIsQ0FoRG1CO0FBaURaWCw4QkFBQUEsT0FqRFksMkRBMUJFLG1CQTBCbkJHLGNBMUJtQjs7OztBQStFckJhLGtCQUFBQSxXQS9FcUIsR0ErRVB2RSxDQUFDLENBQUN3RSxJQUFGLENBQVEsTUFBSSxDQUFDckQsT0FBYixDQS9FTzs7QUFpRnpCbkIsa0JBQUFBLENBQUMsQ0FBQzZELElBQUYsQ0FBUVUsV0FBUixpR0FBcUIsa0JBQU9FLE9BQVA7QUFDYkMsOEJBQUFBLFFBRGEsR0FDRixNQUFJLENBQUN2RCxPQUFMLENBQWFzRCxPQUFiLENBREU7QUFFYkUsOEJBQUFBLFFBRmEsR0FFRnZCLFVBQVUsQ0FBQ3FCLE9BQUQsQ0FGUjtBQUdiLCtCQUFDRSxRQUFELElBQWEzRSxDQUFDLENBQUM0RSxJQUFGLENBQVFELFFBQVIsTUFBc0IzRSxDQUFDLENBQUM0RSxJQUFGLENBQVFGLFFBQVIsQ0FIdEI7QUFJYjFFLDhCQUFBQSxDQUFDLENBQUM2RCxJQUFGLENBQVFhLFFBQVIsRUFBa0IsVUFBQ3BCLE9BQUQsRUFBYTtBQUMzQkEsZ0NBQUFBLE9BQU8sQ0FBQ0UsUUFBUixDQUFpQkMsSUFBakI7QUFDSCwrQkFGRCxFQUphO0FBT04scUNBQU8sTUFBSSxDQUFDdEMsT0FBTCxDQUFhc0QsT0FBYixDQVBEOztBQVNqQnpFLDhCQUFBQSxDQUFDLENBQUM2RCxJQUFGLENBQVFhLFFBQVIsRUFBa0IsVUFBQ0csWUFBRCxFQUFlQyxLQUFmLEVBQXlCO0FBQ3ZDLG9DQUFJQyxZQUFZLEdBQUdKLFFBQVEsQ0FBQ0csS0FBRCxDQUEzQjtBQUNBLG9DQUFJNUUsV0FBVyxDQUFFMkUsWUFBWSxDQUFDckIsUUFBYixDQUFzQnpDLEtBQXhCLEVBQStCZ0UsWUFBWSxDQUFDaEUsS0FBNUMsQ0FBZixFQUFtRTs7QUFFbEUsaUNBRkQsTUFFTyxDQUFDO0FBQ0pzQyxrQ0FBQUEsZ0JBQWdCLENBQUV3QixZQUFGLEVBQWdCRSxZQUFoQixDQUFoQjtBQUNIO0FBQ0osK0JBUEQsRUFUaUIsMERBQXJCLHFFQWpGeUI7OztBQW9HbkJDLG9CQUFBQSxPQUFPLENBQUNDLEdBQVI7QUFDRmpGLG9CQUFBQSxDQUFDLENBQUM4QyxHQUFGLENBQU9NLFVBQVAsaUdBQW1CLGtCQUFPdUIsUUFBUCxFQUFpQkYsT0FBakI7QUFDVixnQ0FBQSxNQUFJLENBQUN0RCxPQUFMLENBQWFzRCxPQUFiLENBRFU7QUFFWCxnQ0FBQSxNQUFJLENBQUN0RCxPQUFMLENBQWFzRCxPQUFiLElBQXdCLEVBQXhCO0FBQ1NTLGdDQUFBQSxDQUhFLEdBR0UsQ0FIRixjQUdLQSxDQUFDLEdBQUdQLFFBQVEsQ0FBQ1EsTUFIbEI7QUFJSDVCLGdDQUFBQSxPQUpHLEdBSU9vQixRQUFRLENBQUNPLENBQUQsQ0FKZjtBQUtEeEIsa0NBQUFBLGNBQWMsQ0FBRUgsT0FBRixDQUxiO0FBTVAsZ0NBQUEsTUFBSSxDQUFDcEMsT0FBTCxDQUFhc0QsT0FBYixFQUFzQlcsSUFBdEIsQ0FBNEI3QixPQUE1QixFQU5PLE9BRzBCMkIsQ0FBQyxFQUgzQixxRkFBbkIseUVBREUsQ0FwR21COzs7OztBQWdIekIsa0JBQUEsTUFBSSxDQUFDaEUsWUFBTCxDQUFrQm1FLEtBQWxCLEdBaEh5Qjs7O0FBbUh6QkMsa0JBQUFBLE9Bbkh5QixHQW1IZi9DLElBQUksQ0FBQ0MsR0FBTCxLQUFjRixPQW5IQztBQW9IN0JILGtCQUFBQSxZQUFZLEdBQUcsSUFBZjtBQUNBLGtCQUFBLE1BQUksQ0FBQzZCLElBQUwsQ0FBVyxTQUFYLEVBQXNCM0IsS0FBSyxHQUFHaUQsT0FBOUIsRUFySDZCLDJEQUFqQzs7QUF1SEEsV0FBS3BFLFlBQUwsQ0FBa0JvRCxjQUFsQixDQUFrQ2pELGVBQWxDO0FBQ0EsYUFBTyxJQUFQO0FBQ0gsSzs7QUFFMkIsU0FBYmtFLEdBQWEsdUVBQVAsS0FBTztBQUN4QixhQUFPdkYsQ0FBQyxDQUFDNEMsS0FBRixDQUFTLEtBQUsxQixZQUFMLENBQWtCc0UsU0FBM0I7QUFDTkMsTUFBQUEsTUFETTtBQUVOM0MsTUFBQUEsR0FGTSxDQUVELFVBQUNDLEtBQUQsRUFBVztBQUNiLFlBQUl3QyxHQUFKLEVBQVM7QUFDTCxpQkFBT3hDLEtBQUssQ0FBQzJDLFFBQU4sQ0FBZ0IsRUFBQ0MsT0FBTyxFQUFFLEtBQVYsRUFBaEIsQ0FBUDtBQUNIO0FBQ0QsZUFBTzVDLEtBQVA7QUFDSCxPQVBNO0FBUU5FLE1BQUFBLEtBUk0sRUFBUDtBQVNILEs7O0FBRU9zQyxJQUFBQSxHLEVBQUs7QUFDVCxhQUFPLEtBQUtyRSxZQUFMLENBQWtCeUIsTUFBbEIsQ0FBMEI0QyxHQUExQixDQUFQO0FBQ0gsSzs7QUFFTztBQUNKLFdBQUtyRSxZQUFMLENBQWtCdUMsSUFBbEI7QUFDSCxLLGdDQTNMMEMzRCxZLHVCQUExQmdCLGlCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IE9ic2VydmVDdXJzb3IgZnJvbSBcIi4vT2JzZXJ2ZUN1cnNvclwiO1xuaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudHMnO1xuaW1wb3J0IHttb2RlbFBvcHVsYXRlfSBmcm9tICcuL21vbmdvb3NlVXRpbHMnO1xuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5pbXBvcnQgcG9wdWxhdGVQcm94eSBmcm9tICcuL1BvcHVsYXRlUHJveHknO1xuXG5mdW5jdGlvbiBxdWVyeUVxdWFscyAocXVlcnkxLCBxdWVyeTIpIHtcbiAgICBpZiAoIXF1ZXJ5MSAmJiAhcXVlcnkyKVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICBpZiAoIXF1ZXJ5MSB8fCAhcXVlcnkyKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgaWYgKHF1ZXJ5MS5vcCAhPT0gcXVlcnkyLm9wKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgbGV0IHNlcmlhbGl6ZWRDb25kaXRpb24xID0gSlNPTi5zdHJpbmdpZnkgKHF1ZXJ5MS5fY29uZGl0aW9ucyk7XG4gICAgbGV0IHNlcmlhbGl6ZWRDb25kaXRpb24yID0gSlNPTi5zdHJpbmdpZnkgKHF1ZXJ5Mi5fY29uZGl0aW9ucyk7XG4gICAgaWYgKHNlcmlhbGl6ZWRDb25kaXRpb24xICE9PSBzZXJpYWxpemVkQ29uZGl0aW9uMilcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgbGV0IHNlcmlhbGl6ZWRPcHRpb25zMSA9IEpTT04uc3RyaW5naWZ5IChxdWVyeTEub3B0aW9ucyk7XG4gICAgbGV0IHNlcmlhbGl6ZWRPcHRpb25zMiA9IEpTT04uc3RyaW5naWZ5IChxdWVyeTIub3B0aW9ucyk7XG4gICAgaWYgKHNlcmlhbGl6ZWRPcHRpb25zMSAhPT0gc2VyaWFsaXplZE9wdGlvbnMyKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgcmV0dXJuIHRydWU7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE9ic2VydmVDdXJzb3JEZWVwIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgICBjb25zdHJ1Y3RvciAocXVlcnksIG9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIgKCk7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgICAgIHRoaXMucm9vdFF1ZXJ5ID0gcXVlcnk7XG4gICAgICAgIHRoaXMuc2V0TWF4TGlzdGVuZXJzICgwKTtcbiAgICAgICAgdGhpcy5yb290T2JzZXJ2ZXIgPSBuZXcgT2JzZXJ2ZUN1cnNvciAocXVlcnksIG9wdGlvbnMpO1xuICAgICAgICB0aGlzLnBvcERhdGEgPSB7fTtcbiAgICB9XG5cbiAgICAvKipAcGFyYW0ge29iamVjdH0gaGFuZGxlcnNcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKGlkOlN0cmluZywgZG9jOm1vbmdvb3NlLkRvY3VtZW50KX0gaGFuZGxlcnMuYWRkZWRcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKGlkOnN0cmluZywgY2hhbmdlZEZpZWxkczpvYmplY3QsbmV3RG9jOm1vbmdvb3NlLkRvY3VtZW50LG9sZERvYzogbW9uZ29vc2UuRG9jdW1lbnQpfSBoYW5kbGVycy5jaGFuZ2VkXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbihpZDpTdHJpbmcsIHJlbW92ZWREb2M6bW9uZ29vc2UuRG9jdW1lbnQpfSBoYW5kbGVycy5yZW1vdmVkXG4gICAgICoqL1xuICAgIG9ic2VydmVDaGFuZ2VzIChoYW5kbGVycykge1xuICAgICAgICBsZXQgaGFuZGxlcnNXcmFwcGVyID0ge307XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgICAgICBsZXQgY291bnRlcnMgPSB7XG4gICAgICAgICAgICBhZGRlZDowLFxuICAgICAgICAgICAgY2hhbmdlZDowLFxuICAgICAgICAgICAgcmVtb3ZlZDowXG4gICAgICAgIH1cbiAgICAgICAgaWYgKGhhbmRsZXJzLmFkZGVkKSB7XG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgICAgICAgICAgIGhhbmRsZXJzV3JhcHBlci5hZGRlZCA9IGZ1bmN0aW9uIChpZCwgZG9jKSB7XG4gICAgICAgICAgICAgICAgY291bnRlcnMuYWRkZWQrKztcbiAgICAgICAgICAgICAgICBoYW5kbGVycy5hZGRlZC5hcHBseSAoc2VsZiwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoaGFuZGxlcnMuY2hhbmdlZCkge1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gICAgICAgICAgICBoYW5kbGVyc1dyYXBwZXIuY2hhbmdlZCA9IGZ1bmN0aW9uIChpZCwgY2hhbmdlZEZpZWxkcywgbmV3RG9jLCBvbGREb2MpIHtcbiAgICAgICAgICAgICAgICBjb3VudGVycy5jaGFuZ2VkKys7XG4gICAgICAgICAgICAgICAgaGFuZGxlcnMuY2hhbmdlZC5hcHBseSAoc2VsZiwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoaGFuZGxlcnMucmVtb3ZlZCkge1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gICAgICAgICAgICBoYW5kbGVyc1dyYXBwZXIucmVtb3ZlZCA9IGZ1bmN0aW9uIChpZCwgcmVtb3ZlZERvYykge1xuICAgICAgICAgICAgICAgIGNvdW50ZXJzLnJlbW92ZWQrKztcbiAgICAgICAgICAgICAgICBoYW5kbGVycy5yZW1vdmVkLmFwcGx5IChzZWxmLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHdhc1JlZnJlc2hlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnJvb3RPYnNlcnZlci5vbiAoJ3JlZnJlc2gnLCBhc3luYyAoZGVsYXkpID0+IHtcbiAgICAgICAgICAgIGxldCBzdGFydGVkID0gRGF0ZS5ub3cgKCk7XG4gICAgICAgICAgICBsZXQgcG9wdWxhdGVkUGF0aHMgPSB0aGlzLnJvb3RRdWVyeS5nZXRQb3B1bGF0ZWRQYXRocyAoKTtcblxuICAgICAgICAgICAgbGV0IG1vZGVscyA9IF8uY2hhaW4gKHRoaXMuY3VycmVudE1vZGVscyAoKSlcbiAgICAgICAgICAgIC5tYXAgKChtb2RlbCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBwb3B1bGF0ZVByb3h5IChtb2RlbCwge3BvcHVsYXRlZFBhdGhzLCBzZXQ6IHRydWV9KVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC52YWx1ZSAoKTtcblxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIGhhbmRsZXJzLmNoYW5nZWQgJiZcbiAgICAgICAgICAgICAgICAhXy5pc0VtcHR5IChtb2RlbHMpICYmICFfLmlzRW1wdHkgKHBvcHVsYXRlZFBhdGhzKVxuICAgICAgICAgICAgICAgICYmKCF3YXNSZWZyZXNoZWR8fGNvdW50ZXJzLmFkZGVkPjB8fGNvdW50ZXJzLmNoYW5nZWQ+MHx8Y291bnRlcnMucmVtb3ZlZD4wKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgY291bnRlcnMuYWRkZWQ9MDtcbiAgICAgICAgICAgICAgICBjb3VudGVycy5jaGFuZ2VkPTA7XG4gICAgICAgICAgICAgICAgY291bnRlcnMucmVtb3ZlZD0wO1xuICAgICAgICAgICAgICAgIHRoaXMucm9vdE9ic2VydmVyLnBhdXNlICgpO1xuICAgICAgICAgICAgICAgIC8qKkB0eXBlIEFycmF5PFF1ZXJ5SXRlbT4qL1xuICAgICAgICAgICAgICAgIGxldCBuZXdRdWVyaWVzID0gYXdhaXQgbW9kZWxQb3B1bGF0ZS5hcHBseSAodGhpcy5yb290UXVlcnkubW9kZWwsIFttb2RlbHMsIHBvcHVsYXRlZFBhdGhzXSk7XG4gICAgICAgICAgICAgICAgY29uc3QgcXVlcnlJdGVtQ2hhbmdlZCA9IChvbGRJdGVtLCBuZXdJdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvbGRJdGVtKVxuICAgICAgICAgICAgICAgICAgICAgICAgb2xkSXRlbS5vYnNlcnZlci5zdG9wICgpO1xuICAgICAgICAgICAgICAgICAgICBxdWVyeUl0ZW1BZGRlZCAobmV3SXRlbSk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBjb25zdCBxdWVyeUl0ZW1BZGRlZCA9IGFzeW5jIChuZXdJdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIG5ld0l0ZW0ub2JzZXJ2ZXIgPSBuZXcgT2JzZXJ2ZUN1cnNvciAobmV3SXRlbS5xdWVyeSwgdGhpcy5vcHRpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHBvcHVsYXRlTG9hZGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGxldCByZWZyZXNoU2NoZWR1bGVkID0gMDtcblxuICAgICAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8taW5uZXItZGVjbGFyYXRpb25zXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGRvUmVmcmVzaCAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdJdGVtLmFzc2lnbiAobmV3SXRlbS5vYnNlcnZlci5jdXJyZW50TW9kZWxzIChmYWxzZSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgXy5lYWNoIChtb2RlbHMsIChtb2RlbCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBjaGFuZ2VkUGF0aGVzID0gbW9kZWwuX19jaGFuZ2VkUGF0aGVzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghXy5pc0VtcHR5IChjaGFuZ2VkUGF0aGVzKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGFuZGxlcnMuY2hhbmdlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlcnMuY2hhbmdlZC5hcHBseSAoc2VsZiwgW21vZGVsLmlkLCBjaGFuZ2VkUGF0aGVzLCBtb2RlbCwgbW9kZWxdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZW1pdCAoJ2NoYW5nZWQnLCBtb2RlbC5pZCwgY2hhbmdlZFBhdGhlcywgbW9kZWwsIG1vZGVsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGVsLl9fY2xlYXJDaGFuZ2VkUGF0aGVzICgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBsZXQgc2NoZWR1bGVSZWZyZXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZWZyZXNoU2NoZWR1bGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVmcmVzaFNjaGVkdWxlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3SXRlbS5vYnNlcnZlci5vbmNlICgncmVmcmVzaCcsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9SZWZyZXNoICgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWZyZXNoU2NoZWR1bGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgbmV3SXRlbS5vYnNlcnZlci5vYnNlcnZlQ2hhbmdlcyAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRlZCAoaWQsIGRvYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwb3B1bGF0ZUxvYWRlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2hlZHVsZVJlZnJlc2ggKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFyc1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlZCAoaWQsIGNoYW5nZWRGaWVsZHMsIG5ld0RvYywgb2xkRG9jKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NoZWR1bGVSZWZyZXNoICgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFyc1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlZCAoaWQsIHJlbW92ZWREb2MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2hlZHVsZVJlZnJlc2ggKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBuZXdJdGVtLm9ic2VydmVyLm1vZGVscyAoZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICBkb1JlZnJlc2ggKCk7XG4gICAgICAgICAgICAgICAgICAgIHBvcHVsYXRlTG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ld0l0ZW07XG4gICAgICAgICAgICAgICAgfTtcblxuXG4gICAgICAgICAgICAgICAgbGV0IG9sZFBvcFBhdGhzID0gXy5rZXlzICh0aGlzLnBvcERhdGEpO1xuXG4gICAgICAgICAgICAgICAgXy5lYWNoIChvbGRQb3BQYXRocywgYXN5bmMgKHBvcE5hbWUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG9sZEl0ZW1zID0gdGhpcy5wb3BEYXRhW3BvcE5hbWVdO1xuICAgICAgICAgICAgICAgICAgICBsZXQgbmV3SXRlbXMgPSBuZXdRdWVyaWVzW3BvcE5hbWVdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW5ld0l0ZW1zIHx8IF8uc2l6ZSAobmV3SXRlbXMpICE9PSBfLnNpemUgKG9sZEl0ZW1zKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgXy5lYWNoIChvbGRJdGVtcywgKG9sZEl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbGRJdGVtLm9ic2VydmVyLnN0b3AgKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkZWxldGUgdGhpcy5wb3BEYXRhW3BvcE5hbWVdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIF8uZWFjaCAob2xkSXRlbXMsIChvbGRRdWVyeUl0ZW0sIGluZGV4KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgbmV3UXVlcnlJdGVtID0gbmV3SXRlbXNbaW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHF1ZXJ5RXF1YWxzIChvbGRRdWVyeUl0ZW0ub2JzZXJ2ZXIucXVlcnksIG5ld1F1ZXJ5SXRlbS5xdWVyeSkpIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHsvL9C40LfQvNC10L3QuNC70L7RgdGMXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVlcnlJdGVtQ2hhbmdlZCAob2xkUXVlcnlJdGVtLCBuZXdRdWVyeUl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGF3YWl0IFByb21pc2UuYWxsIChcbiAgICAgICAgICAgICAgICAgICAgXy5tYXAgKG5ld1F1ZXJpZXMsIGFzeW5jIChuZXdJdGVtcywgcG9wTmFtZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLnBvcERhdGFbcG9wTmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcERhdGFbcG9wTmFtZV0gPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5ld0l0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBuZXdJdGVtID0gbmV3SXRlbXNbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHF1ZXJ5SXRlbUFkZGVkIChuZXdJdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3BEYXRhW3BvcE5hbWVdLnB1c2ggKG5ld0l0ZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5yb290T2JzZXJ2ZXIuYXdha2UgKCk7XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBzcGVuZGVkID0gRGF0ZS5ub3cgKCkgLSBzdGFydGVkO1xuICAgICAgICAgICAgd2FzUmVmcmVzaGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuZW1pdCAoJ3JlZnJlc2gnLCBkZWxheSArIHNwZW5kZWQpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5yb290T2JzZXJ2ZXIub2JzZXJ2ZUNoYW5nZXMgKGhhbmRsZXJzV3JhcHBlcik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGN1cnJlbnRNb2RlbHMgKHJhdyA9IGZhbHNlKSB7XG4gICAgICAgIHJldHVybiBfLmNoYWluICh0aGlzLnJvb3RPYnNlcnZlci5tb2RlbHNNYXApXG4gICAgICAgIC52YWx1ZXMgKClcbiAgICAgICAgLm1hcCAoKG1vZGVsKSA9PiB7XG4gICAgICAgICAgICBpZiAocmF3KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1vZGVsLnRvT2JqZWN0ICh7Z2V0dGVyczogZmFsc2V9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBtb2RlbDtcbiAgICAgICAgfSlcbiAgICAgICAgLnZhbHVlICgpXG4gICAgfVxuXG4gICAgbW9kZWxzIChyYXcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucm9vdE9ic2VydmVyLm1vZGVscyAocmF3KTtcbiAgICB9XG5cbiAgICBzdG9wICgpIHtcbiAgICAgICAgdGhpcy5yb290T2JzZXJ2ZXIuc3RvcCAoKTtcbiAgICB9XG59Il19