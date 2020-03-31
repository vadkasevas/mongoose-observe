"use strict";var _interopRequireDefault3 = require("@babel/runtime/helpers/interopRequireDefault");var _interopRequireDefault2 = _interopRequireDefault3(require("@babel/runtime/helpers/interopRequireDefault"));Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = undefined;var _regenerator = require("@babel/runtime/regenerator");var _regeneratorRuntime = (0, _interopRequireDefault2["default"])(_regenerator)["default"];var _asyncToGenerator2 = require("@babel/runtime/helpers/asyncToGenerator");var _asyncToGenerator = (0, _interopRequireDefault2["default"])(_asyncToGenerator2)["default"];var _classCallCheck2 = require("@babel/runtime/helpers/classCallCheck");var _classCallCheck = (0, _interopRequireDefault2["default"])(_classCallCheck2)["default"];var _createClass2 = require("@babel/runtime/helpers/createClass");var _createClass = (0, _interopRequireDefault2["default"])(_createClass2)["default"];var _possibleConstructorReturn2 = require("@babel/runtime/helpers/possibleConstructorReturn");var _possibleConstructorReturn = (0, _interopRequireDefault2["default"])(_possibleConstructorReturn2)["default"];var _getPrototypeOf2 = require("@babel/runtime/helpers/getPrototypeOf");var _getPrototypeOf = (0, _interopRequireDefault2["default"])(_getPrototypeOf2)["default"];var _inherits2 = require("@babel/runtime/helpers/inherits");var _inherits = (0, _interopRequireDefault2["default"])(_inherits2)["default"];var _ObserveCursor = require("./ObserveCursor");var ObserveCursor = (0, _interopRequireDefault2["default"])(_ObserveCursor)["default"];
var _events = require("events");var EventEmitter = (0, _interopRequireDefault2["default"])(_events)["default"];
var _test = require("./../test");var modelPopulate = _test.modelPopulate;
var _underscore = require("underscore");var _ = (0, _interopRequireDefault2["default"])(_underscore)["default"];
var _MainModel = require("../test/models/MainModel");var MainModels = (0, _interopRequireDefault2["default"])(_MainModel)["default"];
var _test2 = require("../test");var _populate = _test2._populate;
var _PopulateProxy = require("../src/PopulateProxy");var populateProxy = (0, _interopRequireDefault2["default"])(_PopulateProxy)["default"];

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9PYnNlcnZlQ3Vyc29yRGVlcC5qcyJdLCJuYW1lcyI6WyJPYnNlcnZlQ3Vyc29yIiwiRXZlbnRFbWl0dGVyIiwibW9kZWxQb3B1bGF0ZSIsIl8iLCJNYWluTW9kZWxzIiwiX3BvcHVsYXRlIiwicG9wdWxhdGVQcm94eSIsInF1ZXJ5RXF1YWxzIiwicXVlcnkxIiwicXVlcnkyIiwib3AiLCJzZXJpYWxpemVkQ29uZGl0aW9uMSIsIkpTT04iLCJzdHJpbmdpZnkiLCJfY29uZGl0aW9ucyIsInNlcmlhbGl6ZWRDb25kaXRpb24yIiwic2VyaWFsaXplZE9wdGlvbnMxIiwib3B0aW9ucyIsInNlcmlhbGl6ZWRPcHRpb25zMiIsIk9ic2VydmVDdXJzb3JEZWVwIiwicXVlcnkiLCJyb290UXVlcnkiLCJzZXRNYXhMaXN0ZW5lcnMiLCJyb290T2JzZXJ2ZXIiLCJwb3BEYXRhIiwiaGFuZGxlcnMiLCJoYW5kbGVyc1dyYXBwZXIiLCJzZWxmIiwiY291bnRlcnMiLCJhZGRlZCIsImNoYW5nZWQiLCJyZW1vdmVkIiwiaWQiLCJkb2MiLCJhcHBseSIsImFyZ3VtZW50cyIsImNoYW5nZWRGaWVsZHMiLCJuZXdEb2MiLCJvbGREb2MiLCJyZW1vdmVkRG9jIiwid2FzUmVmcmVzaGVkIiwib24iLCJkZWxheSIsInN0YXJ0ZWQiLCJEYXRlIiwibm93IiwicG9wdWxhdGVkUGF0aHMiLCJnZXRQb3B1bGF0ZWRQYXRocyIsIm1vZGVscyIsImNoYWluIiwiY3VycmVudE1vZGVscyIsIm1hcCIsIm1vZGVsIiwic2V0IiwidmFsdWUiLCJpc0VtcHR5IiwicGF1c2UiLCJuZXdRdWVyaWVzIiwicXVlcnlJdGVtQ2hhbmdlZCIsIm9sZEl0ZW0iLCJuZXdJdGVtIiwib2JzZXJ2ZXIiLCJzdG9wIiwicXVlcnlJdGVtQWRkZWQiLCJkb1JlZnJlc2giLCJhc3NpZ24iLCJlYWNoIiwiY2hhbmdlZFBhdGhlcyIsIl9fY2hhbmdlZFBhdGhlcyIsImVtaXQiLCJfX2NsZWFyQ2hhbmdlZFBhdGhlcyIsInBvcHVsYXRlTG9hZGVkIiwicmVmcmVzaFNjaGVkdWxlZCIsInNjaGVkdWxlUmVmcmVzaCIsIm9uY2UiLCJvYnNlcnZlQ2hhbmdlcyIsIm9sZFBvcFBhdGhzIiwia2V5cyIsInBvcE5hbWUiLCJvbGRJdGVtcyIsIm5ld0l0ZW1zIiwic2l6ZSIsIm9sZFF1ZXJ5SXRlbSIsImluZGV4IiwibmV3UXVlcnlJdGVtIiwiUHJvbWlzZSIsImFsbCIsImkiLCJsZW5ndGgiLCJwdXNoIiwiYXdha2UiLCJzcGVuZGVkIiwicmF3IiwibW9kZWxzTWFwIiwidmFsdWVzIiwidG9PYmplY3QiLCJnZXR0ZXJzIl0sIm1hcHBpbmdzIjoicTZDQUFBLGdELElBQU9BLGE7QUFDUCxnQyxJQUFPQyxZO0FBQ1AsaUMsSUFBUUMsYSxTQUFBQSxhO0FBQ1Isd0MsSUFBT0MsQztBQUNQLHFELElBQU9DLFU7QUFDUCxnQyxJQUFRQyxTLFVBQUFBLFM7QUFDUixxRCxJQUFPQyxhOztBQUVQLFNBQVNDLFdBQVQsQ0FBc0JDLE1BQXRCLEVBQThCQyxNQUE5QixFQUFzQztBQUNsQyxNQUFJLENBQUNELE1BQUQsSUFBVyxDQUFDQyxNQUFoQjtBQUNJLFNBQU8sSUFBUDtBQUNKLE1BQUksQ0FBQ0QsTUFBRCxJQUFXLENBQUNDLE1BQWhCO0FBQ0ksU0FBTyxLQUFQO0FBQ0osTUFBSUQsTUFBTSxDQUFDRSxFQUFQLEtBQWNELE1BQU0sQ0FBQ0MsRUFBekI7QUFDSSxTQUFPLEtBQVA7QUFDSixNQUFJQyxvQkFBb0IsR0FBR0MsSUFBSSxDQUFDQyxTQUFMLENBQWdCTCxNQUFNLENBQUNNLFdBQXZCLENBQTNCO0FBQ0EsTUFBSUMsb0JBQW9CLEdBQUdILElBQUksQ0FBQ0MsU0FBTCxDQUFnQkosTUFBTSxDQUFDSyxXQUF2QixDQUEzQjtBQUNBLE1BQUlILG9CQUFvQixLQUFLSSxvQkFBN0I7QUFDSSxTQUFPLEtBQVA7O0FBRUosTUFBSUMsa0JBQWtCLEdBQUdKLElBQUksQ0FBQ0MsU0FBTCxDQUFnQkwsTUFBTSxDQUFDUyxPQUF2QixD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QUFtSDdCSCxrQkFBQUEsWUFBWSxHQUFHLElBQWY7QUFDQSxrQkFBQSxNQUFJLENBQUM2QixJQUFMLENBQVcsU0FBWCxFQUFzQjNCLEtBQUssR0FBR2lELE9BQTlCLEVBcEg2QiwyREFBakM7O0FBc0hBLFdBQUtwRSxZQUFMLENBQWtCb0QsY0FBbEIsQ0FBa0NqRCxlQUFsQztBQUNBLGFBQU8sSUFBUDtBQUNILEs7O0FBRTJCLFNBQWJrRSxHQUFhLHVFQUFQLEtBQU87QUFDeEIsYUFBT3pGLENBQUMsQ0FBQzhDLEtBQUYsQ0FBUyxLQUFLMUIsWUFBTCxDQUFrQnNFLFNBQTNCO0FBQ05DLE1BQUFBLE1BRE07QUFFTjNDLE1BQUFBLEdBRk0sQ0FFRCxVQUFDQyxLQUFELEVBQVc7QUFDYixZQUFJd0MsR0FBSixFQUFTO0FBQ0wsaUJBQU94QyxLQUFLLENBQUMyQyxRQUFOLENBQWdCLEVBQUNDLE9BQU8sRUFBRSxLQUFWLEVBQWhCLENBQVA7QUFDSDtBQUNELGVBQU81QyxLQUFQO0FBQ0gsT0FQTTtBQVFORSxNQUFBQSxLQVJNLEVBQVA7QUFTSCxLOztBQUVPc0MsSUFBQUEsRyxFQUFLO0FBQ1QsYUFBTyxLQUFLckUsWUFBTCxDQUFrQnlCLE1BQWxCLENBQTBCNEMsR0FBMUIsQ0FBUDtBQUNILEs7O0FBRU87QUFDSixXQUFLckUsWUFBTCxDQUFrQnVDLElBQWxCO0FBQ0gsSyxnQ0ExTDBDN0QsWSx1QkFBMUJrQixpQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBPYnNlcnZlQ3Vyc29yIGZyb20gXCIuL09ic2VydmVDdXJzb3JcIjtcbmltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSAnZXZlbnRzJztcbmltcG9ydCB7bW9kZWxQb3B1bGF0ZX0gZnJvbSAnLi8uLi90ZXN0JztcbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuaW1wb3J0IE1haW5Nb2RlbHMgZnJvbSBcIi4uL3Rlc3QvbW9kZWxzL01haW5Nb2RlbFwiO1xuaW1wb3J0IHtfcG9wdWxhdGV9IGZyb20gJy4uL3Rlc3QnO1xuaW1wb3J0IHBvcHVsYXRlUHJveHkgZnJvbSAnLi4vc3JjL1BvcHVsYXRlUHJveHknO1xuXG5mdW5jdGlvbiBxdWVyeUVxdWFscyAocXVlcnkxLCBxdWVyeTIpIHtcbiAgICBpZiAoIXF1ZXJ5MSAmJiAhcXVlcnkyKVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICBpZiAoIXF1ZXJ5MSB8fCAhcXVlcnkyKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgaWYgKHF1ZXJ5MS5vcCAhPT0gcXVlcnkyLm9wKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgbGV0IHNlcmlhbGl6ZWRDb25kaXRpb24xID0gSlNPTi5zdHJpbmdpZnkgKHF1ZXJ5MS5fY29uZGl0aW9ucyk7XG4gICAgbGV0IHNlcmlhbGl6ZWRDb25kaXRpb24yID0gSlNPTi5zdHJpbmdpZnkgKHF1ZXJ5Mi5fY29uZGl0aW9ucyk7XG4gICAgaWYgKHNlcmlhbGl6ZWRDb25kaXRpb24xICE9PSBzZXJpYWxpemVkQ29uZGl0aW9uMilcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgbGV0IHNlcmlhbGl6ZWRPcHRpb25zMSA9IEpTT04uc3RyaW5naWZ5IChxdWVyeTEub3B0aW9ucyk7XG4gICAgbGV0IHNlcmlhbGl6ZWRPcHRpb25zMiA9IEpTT04uc3RyaW5naWZ5IChxdWVyeTIub3B0aW9ucyk7XG4gICAgaWYgKHNlcmlhbGl6ZWRPcHRpb25zMSAhPT0gc2VyaWFsaXplZE9wdGlvbnMyKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgcmV0dXJuIHRydWU7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE9ic2VydmVDdXJzb3JEZWVwIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgICBjb25zdHJ1Y3RvciAocXVlcnksIG9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIgKCk7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgICAgIHRoaXMucm9vdFF1ZXJ5ID0gcXVlcnk7XG4gICAgICAgIHRoaXMuc2V0TWF4TGlzdGVuZXJzICgwKTtcbiAgICAgICAgdGhpcy5yb290T2JzZXJ2ZXIgPSBuZXcgT2JzZXJ2ZUN1cnNvciAocXVlcnksIG9wdGlvbnMpO1xuICAgICAgICB0aGlzLnBvcERhdGEgPSB7fTtcbiAgICB9XG5cbiAgICAvKipAcGFyYW0ge29iamVjdH0gaGFuZGxlcnNcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKGlkOlN0cmluZywgZG9jOm1vbmdvb3NlLkRvY3VtZW50KX0gaGFuZGxlcnMuYWRkZWRcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKGlkOnN0cmluZywgY2hhbmdlZEZpZWxkczpvYmplY3QsbmV3RG9jOm1vbmdvb3NlLkRvY3VtZW50LG9sZERvYzogbW9uZ29vc2UuRG9jdW1lbnQpfSBoYW5kbGVycy5jaGFuZ2VkXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbihpZDpTdHJpbmcsIHJlbW92ZWREb2M6bW9uZ29vc2UuRG9jdW1lbnQpfSBoYW5kbGVycy5yZW1vdmVkXG4gICAgICoqL1xuICAgIG9ic2VydmVDaGFuZ2VzIChoYW5kbGVycykge1xuICAgICAgICBsZXQgaGFuZGxlcnNXcmFwcGVyID0ge307XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgICAgICBsZXQgY291bnRlcnMgPSB7XG4gICAgICAgICAgICBhZGRlZDowLFxuICAgICAgICAgICAgY2hhbmdlZDowLFxuICAgICAgICAgICAgcmVtb3ZlZDowXG4gICAgICAgIH1cbiAgICAgICAgaWYgKGhhbmRsZXJzLmFkZGVkKSB7XG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgICAgICAgICAgIGhhbmRsZXJzV3JhcHBlci5hZGRlZCA9IGZ1bmN0aW9uIChpZCwgZG9jKSB7XG4gICAgICAgICAgICAgICAgY291bnRlcnMuYWRkZWQrKztcbiAgICAgICAgICAgICAgICBoYW5kbGVycy5hZGRlZC5hcHBseSAoc2VsZiwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoaGFuZGxlcnMuY2hhbmdlZCkge1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gICAgICAgICAgICBoYW5kbGVyc1dyYXBwZXIuY2hhbmdlZCA9IGZ1bmN0aW9uIChpZCwgY2hhbmdlZEZpZWxkcywgbmV3RG9jLCBvbGREb2MpIHtcbiAgICAgICAgICAgICAgICBjb3VudGVycy5jaGFuZ2VkKys7XG4gICAgICAgICAgICAgICAgaGFuZGxlcnMuY2hhbmdlZC5hcHBseSAoc2VsZiwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoaGFuZGxlcnMucmVtb3ZlZCkge1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gICAgICAgICAgICBoYW5kbGVyc1dyYXBwZXIucmVtb3ZlZCA9IGZ1bmN0aW9uIChpZCwgcmVtb3ZlZERvYykge1xuICAgICAgICAgICAgICAgIGNvdW50ZXJzLnJlbW92ZWQrKztcbiAgICAgICAgICAgICAgICBoYW5kbGVycy5yZW1vdmVkLmFwcGx5IChzZWxmLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHdhc1JlZnJlc2hlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnJvb3RPYnNlcnZlci5vbiAoJ3JlZnJlc2gnLCBhc3luYyAoZGVsYXkpID0+IHtcbiAgICAgICAgICAgIGxldCBzdGFydGVkID0gRGF0ZS5ub3cgKCk7XG4gICAgICAgICAgICBsZXQgcG9wdWxhdGVkUGF0aHMgPSB0aGlzLnJvb3RRdWVyeS5nZXRQb3B1bGF0ZWRQYXRocyAoKTtcblxuICAgICAgICAgICAgbGV0IG1vZGVscyA9IF8uY2hhaW4gKHRoaXMuY3VycmVudE1vZGVscyAoKSlcbiAgICAgICAgICAgIC5tYXAgKChtb2RlbCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBwb3B1bGF0ZVByb3h5IChtb2RlbCwge3BvcHVsYXRlZFBhdGhzLCBzZXQ6IHRydWV9KVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC52YWx1ZSAoKTtcblxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICFfLmlzRW1wdHkgKG1vZGVscykgJiYgIV8uaXNFbXB0eSAocG9wdWxhdGVkUGF0aHMpXG4gICAgICAgICAgICAgICAgJiYoIXdhc1JlZnJlc2hlZHx8Y291bnRlcnMuYWRkZWQ+MHx8Y291bnRlcnMuY2hhbmdlZD4wfHxjb3VudGVycy5yZW1vdmVkPjApXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBjb3VudGVycy5hZGRlZD0wO1xuICAgICAgICAgICAgICAgIGNvdW50ZXJzLmNoYW5nZWQ9MDtcbiAgICAgICAgICAgICAgICBjb3VudGVycy5yZW1vdmVkPTA7XG4gICAgICAgICAgICAgICAgdGhpcy5yb290T2JzZXJ2ZXIucGF1c2UgKCk7XG4gICAgICAgICAgICAgICAgLyoqQHR5cGUgQXJyYXk8UXVlcnlJdGVtPiovXG4gICAgICAgICAgICAgICAgbGV0IG5ld1F1ZXJpZXMgPSBhd2FpdCBtb2RlbFBvcHVsYXRlLmFwcGx5ICh0aGlzLnJvb3RRdWVyeS5tb2RlbCwgW21vZGVscywgcG9wdWxhdGVkUGF0aHNdKTtcbiAgICAgICAgICAgICAgICBjb25zdCBxdWVyeUl0ZW1DaGFuZ2VkID0gKG9sZEl0ZW0sIG5ld0l0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9sZEl0ZW0pXG4gICAgICAgICAgICAgICAgICAgICAgICBvbGRJdGVtLm9ic2VydmVyLnN0b3AgKCk7XG4gICAgICAgICAgICAgICAgICAgIHF1ZXJ5SXRlbUFkZGVkIChuZXdJdGVtKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGNvbnN0IHF1ZXJ5SXRlbUFkZGVkID0gYXN5bmMgKG5ld0l0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbmV3SXRlbS5vYnNlcnZlciA9IG5ldyBPYnNlcnZlQ3Vyc29yIChuZXdJdGVtLnF1ZXJ5LCB0aGlzLm9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgcG9wdWxhdGVMb2FkZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJlZnJlc2hTY2hlZHVsZWQgPSAwO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1pbm5lci1kZWNsYXJhdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gZG9SZWZyZXNoICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0l0ZW0uYXNzaWduIChuZXdJdGVtLm9ic2VydmVyLmN1cnJlbnRNb2RlbHMgKGZhbHNlKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBfLmVhY2ggKG1vZGVscywgKG1vZGVsKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGNoYW5nZWRQYXRoZXMgPSBtb2RlbC5fX2NoYW5nZWRQYXRoZXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFfLmlzRW1wdHkgKGNoYW5nZWRQYXRoZXMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoYW5kbGVycy5jaGFuZ2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVycy5jaGFuZ2VkLmFwcGx5IChzZWxmLCBbbW9kZWwuaWQsIGNoYW5nZWRQYXRoZXMsIG1vZGVsLCBtb2RlbF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5lbWl0ICgnY2hhbmdlZCcsIG1vZGVsLmlkLCBjaGFuZ2VkUGF0aGVzLCBtb2RlbCwgbW9kZWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kZWwuX19jbGVhckNoYW5nZWRQYXRoZXMgKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGxldCBzY2hlZHVsZVJlZnJlc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlZnJlc2hTY2hlZHVsZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWZyZXNoU2NoZWR1bGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdJdGVtLm9ic2VydmVyLm9uY2UgKCdyZWZyZXNoJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb1JlZnJlc2ggKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZnJlc2hTY2hlZHVsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICBuZXdJdGVtLm9ic2VydmVyLm9ic2VydmVDaGFuZ2VzICh7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZGVkIChpZCwgZG9jKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBvcHVsYXRlTG9hZGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjaGVkdWxlUmVmcmVzaCAoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2VkIChpZCwgY2hhbmdlZEZpZWxkcywgbmV3RG9jLCBvbGREb2MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2hlZHVsZVJlZnJlc2ggKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVkIChpZCwgcmVtb3ZlZERvYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjaGVkdWxlUmVmcmVzaCAoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IG5ld0l0ZW0ub2JzZXJ2ZXIubW9kZWxzIChmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIGRvUmVmcmVzaCAoKTtcbiAgICAgICAgICAgICAgICAgICAgcG9wdWxhdGVMb2FkZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3SXRlbTtcbiAgICAgICAgICAgICAgICB9O1xuXG5cbiAgICAgICAgICAgICAgICBsZXQgb2xkUG9wUGF0aHMgPSBfLmtleXMgKHRoaXMucG9wRGF0YSk7XG5cbiAgICAgICAgICAgICAgICBfLmVhY2ggKG9sZFBvcFBhdGhzLCBhc3luYyAocG9wTmFtZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBsZXQgb2xkSXRlbXMgPSB0aGlzLnBvcERhdGFbcG9wTmFtZV07XG4gICAgICAgICAgICAgICAgICAgIGxldCBuZXdJdGVtcyA9IG5ld1F1ZXJpZXNbcG9wTmFtZV07XG4gICAgICAgICAgICAgICAgICAgIGlmICghbmV3SXRlbXMgfHwgXy5zaXplIChuZXdJdGVtcykgIT09IF8uc2l6ZSAob2xkSXRlbXMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfLmVhY2ggKG9sZEl0ZW1zLCAob2xkSXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9sZEl0ZW0ub2JzZXJ2ZXIuc3RvcCAoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRlbGV0ZSB0aGlzLnBvcERhdGFbcG9wTmFtZV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXy5lYWNoIChvbGRJdGVtcywgKG9sZFF1ZXJ5SXRlbSwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBuZXdRdWVyeUl0ZW0gPSBuZXdJdGVtc1tpbmRleF07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocXVlcnlFcXVhbHMgKG9sZFF1ZXJ5SXRlbS5vYnNlcnZlci5xdWVyeSwgbmV3UXVlcnlJdGVtLnF1ZXJ5KSkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Ugey8v0LjQt9C80LXQvdC40LvQvtGB0YxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWVyeUl0ZW1DaGFuZ2VkIChvbGRRdWVyeUl0ZW0sIG5ld1F1ZXJ5SXRlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwgKFxuICAgICAgICAgICAgICAgICAgICBfLm1hcCAobmV3UXVlcmllcywgYXN5bmMgKG5ld0l0ZW1zLCBwb3BOYW1lKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMucG9wRGF0YVtwb3BOYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucG9wRGF0YVtwb3BOYW1lXSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbmV3SXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG5ld0l0ZW0gPSBuZXdJdGVtc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgcXVlcnlJdGVtQWRkZWQgKG5ld0l0ZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcERhdGFbcG9wTmFtZV0ucHVzaCAobmV3SXRlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnJvb3RPYnNlcnZlci5hd2FrZSAoKTtcblxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IHNwZW5kZWQgPSBEYXRlLm5vdyAoKSAtIHN0YXJ0ZWQ7XG4gICAgICAgICAgICB3YXNSZWZyZXNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5lbWl0ICgncmVmcmVzaCcsIGRlbGF5ICsgc3BlbmRlZCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnJvb3RPYnNlcnZlci5vYnNlcnZlQ2hhbmdlcyAoaGFuZGxlcnNXcmFwcGVyKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgY3VycmVudE1vZGVscyAocmF3ID0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuIF8uY2hhaW4gKHRoaXMucm9vdE9ic2VydmVyLm1vZGVsc01hcClcbiAgICAgICAgLnZhbHVlcyAoKVxuICAgICAgICAubWFwICgobW9kZWwpID0+IHtcbiAgICAgICAgICAgIGlmIChyYXcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbW9kZWwudG9PYmplY3QgKHtnZXR0ZXJzOiBmYWxzZX0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG1vZGVsO1xuICAgICAgICB9KVxuICAgICAgICAudmFsdWUgKClcbiAgICB9XG5cbiAgICBtb2RlbHMgKHJhdykge1xuICAgICAgICByZXR1cm4gdGhpcy5yb290T2JzZXJ2ZXIubW9kZWxzIChyYXcpO1xuICAgIH1cblxuICAgIHN0b3AgKCkge1xuICAgICAgICB0aGlzLnJvb3RPYnNlcnZlci5zdG9wICgpO1xuICAgIH1cbn0iXX0=