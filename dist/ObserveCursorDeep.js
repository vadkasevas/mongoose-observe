"use strict";var _interopRequireDefault3 = require("@babel/runtime/helpers/interopRequireDefault");var _interopRequireDefault2 = _interopRequireDefault3(require("@babel/runtime/helpers/interopRequireDefault"));Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = undefined;var _asyncToGenerator2 = require("@babel/runtime/helpers/asyncToGenerator");var _asyncToGenerator = (0, _interopRequireDefault2["default"])(_asyncToGenerator2)["default"];var _classCallCheck2 = require("@babel/runtime/helpers/classCallCheck");var _classCallCheck = (0, _interopRequireDefault2["default"])(_classCallCheck2)["default"];var _createClass2 = require("@babel/runtime/helpers/createClass");var _createClass = (0, _interopRequireDefault2["default"])(_createClass2)["default"];var _inherits2 = require("@babel/runtime/helpers/inherits");var _inherits = (0, _interopRequireDefault2["default"])(_inherits2)["default"];var _possibleConstructorReturn2 = require("@babel/runtime/helpers/possibleConstructorReturn");var _possibleConstructorReturn = (0, _interopRequireDefault2["default"])(_possibleConstructorReturn2)["default"];var _getPrototypeOf2 = require("@babel/runtime/helpers/getPrototypeOf");var _getPrototypeOf = (0, _interopRequireDefault2["default"])(_getPrototypeOf2)["default"];var _regenerator = require("@babel/runtime/regenerator");var _regeneratorRuntime = (0, _interopRequireDefault2["default"])(_regenerator)["default"];var _ObserveCursor = require("./ObserveCursor");var ObserveCursor = (0, _interopRequireDefault2["default"])(_ObserveCursor)["default"];
var _events = require("events");var EventEmitter = (0, _interopRequireDefault2["default"])(_events)["default"];
var _mongooseUtils = require("./mongooseUtils");var modelPopulate = _mongooseUtils.modelPopulate;
var _underscore = require("underscore");var _ = (0, _interopRequireDefault2["default"])(_underscore)["default"];
var _PopulateProxy = require("./PopulateProxy");var populateProxy = (0, _interopRequireDefault2["default"])(_PopulateProxy)["default"];function _createSuper(Derived) {var hasNativeReflectConstruct = _isNativeReflectConstruct();return function _createSuperInternal() {var Super = _getPrototypeOf(Derived),result;if (hasNativeReflectConstruct) {var NewTarget = _getPrototypeOf(this).constructor;result = Reflect.construct(Super, arguments, NewTarget);} else {result = Super.apply(this, arguments);}return _possibleConstructorReturn(this, result);};}function _isNativeReflectConstruct() {if (typeof Reflect === "undefined" || !Reflect.construct) return false;if (Reflect.construct.sham) return false;if (typeof Proxy === "function") return true;try {Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));return true;} catch (e) {return false;}}

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

ObserveCursorDeep = /*#__PURE__*/function (_EventEmitter) {_inherits(ObserveCursorDeep, _EventEmitter);var _super = _createSuper(ObserveCursorDeep);
  function ObserveCursorDeep(query, options) {var _this;_classCallCheck(this, ObserveCursorDeep);
    _this = _super.call(this);
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
   **/_createClass(ObserveCursorDeep, [{ key: "observeChanges", value:
    function observeChanges(handlers) {var _this2 = this;
      var handlersWrapper = {};
      var self = this;
      var counters = {
        added: 0,
        changed: 0,
        removed: 0
      };
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
      this.rootObserver.on('refresh', /*#__PURE__*/function () {var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee4(delay) {var started, populatedPaths, models, newQueries, queryItemChanged, queryItemAdded, oldPopPaths, spended;return _regeneratorRuntime.wrap(function _callee4$(_context4) {while (1) switch (_context4.prev = _context4.next) {case 0:
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





                      doRefresh, scheduleRefresh;return _regeneratorRuntime.wrap(function _callee$(_context) {while (1) switch (_context.prev = _context.next) {case 0:doRefresh = function _doRefresh() {
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
                            }
                          });_context.next = 8;return (
                            newItem.observer.models(false));case 8:
                          doRefresh();
                          populateLoaded = true;return _context.abrupt("return",
                          newItem);case 11:case "end":return _context.stop();}}, _callee);}));return function queryItemAdded(_x2) {return _ref2.apply(this, arguments);};}();



                oldPopPaths = _.keys(_this2.popData);

                _.each(oldPopPaths, /*#__PURE__*/function () {var _ref3 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(popName) {var oldItems, newItems;return _regeneratorRuntime.wrap(function _callee2$(_context2) {while (1) switch (_context2.prev = _context2.next) {case 0:
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
                          });case 6:case "end":return _context2.stop();}}, _callee2);}));return function (_x3) {return _ref3.apply(this, arguments);};}()
                );_context4.next = 17;return (

                  Promise.all(
                    _.map(newQueries, /*#__PURE__*/function () {var _ref4 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3(newItems, popName) {var i, newItem;return _regeneratorRuntime.wrap(function _callee3$(_context3) {while (1) switch (_context3.prev = _context3.next) {case 0:if (
                              _this2.popData[popName]) {_context3.next = 11;break;}
                              _this2.popData[popName] = [];
                              i = 0;case 3:if (!(i < newItems.length)) {_context3.next = 11;break;}
                              newItem = newItems[i];_context3.next = 7;return (
                                queryItemAdded(newItem));case 7:
                              _this2.popData[popName].push(newItem);case 8:i++;_context3.next = 3;break;case 11:case "end":return _context3.stop();}}, _callee3);}));return function (_x4, _x5) {return _ref4.apply(this, arguments);};}()


                    )));case 17:

                _this2.rootObserver.awake();case 18:


                spended = Date.now() - started;
                wasRefreshed = true;
                _this2.emit('refresh', delay + spended);case 21:case "end":return _context4.stop();}}, _callee4);}));return function (_x) {return _ref.apply(this, arguments);};}()
      );
      this.rootObserver.observeChanges(handlersWrapper);
      return this;
    } }, { key: "currentModels", value:

    function currentModels() {var raw = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      return _.chain(this.rootObserver.modelsMap).
      values().
      map(function (model) {
        if (raw) {
          return model.toObject({ getters: false });
        }
        return model;
      }).
      value();
    } }, { key: "models", value:

    function models(raw) {
      return this.rootObserver.models(raw);
    } }, { key: "stop", value:

    function stop() {var _this3 = this;
      this.rootObserver.stop();
      var oldPopPaths = _.keys(this.popData);
      _.each(oldPopPaths, /*#__PURE__*/function () {var _ref5 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee5(popName) {var oldItems;return _regeneratorRuntime.wrap(function _callee5$(_context5) {while (1) switch (_context5.prev = _context5.next) {case 0:
                oldItems = _this3.popData[popName];
                _.each(oldItems, function (oldItem) {
                  oldItem.observer.stop();
                });case 2:case "end":return _context5.stop();}}, _callee5);}));return function (_x6) {return _ref5.apply(this, arguments);};}()
      );
      this.popData = {};
    } }]);return ObserveCursorDeep;}(EventEmitter);exports["default"] = ObserveCursorDeep;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfT2JzZXJ2ZUN1cnNvciIsInJlcXVpcmUiLCJPYnNlcnZlQ3Vyc29yIiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdDIiLCJfZXZlbnRzIiwiRXZlbnRFbWl0dGVyIiwiX21vbmdvb3NlVXRpbHMiLCJtb2RlbFBvcHVsYXRlIiwiX3VuZGVyc2NvcmUiLCJfIiwiX1BvcHVsYXRlUHJveHkiLCJwb3B1bGF0ZVByb3h5IiwiX2NyZWF0ZVN1cGVyIiwiRGVyaXZlZCIsImhhc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QiLCJfaXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0IiwiX2NyZWF0ZVN1cGVySW50ZXJuYWwiLCJTdXBlciIsIl9nZXRQcm90b3R5cGVPZiIsInJlc3VsdCIsIk5ld1RhcmdldCIsImNvbnN0cnVjdG9yIiwiUmVmbGVjdCIsImNvbnN0cnVjdCIsImFyZ3VtZW50cyIsImFwcGx5IiwiX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4iLCJzaGFtIiwiUHJveHkiLCJCb29sZWFuIiwicHJvdG90eXBlIiwidmFsdWVPZiIsImNhbGwiLCJlIiwicXVlcnlFcXVhbHMiLCJxdWVyeTEiLCJxdWVyeTIiLCJvcCIsInNlcmlhbGl6ZWRDb25kaXRpb24xIiwiSlNPTiIsInN0cmluZ2lmeSIsIl9jb25kaXRpb25zIiwic2VyaWFsaXplZENvbmRpdGlvbjIiLCJzZXJpYWxpemVkT3B0aW9uczEiLCJvcHRpb25zIiwic2VyaWFsaXplZE9wdGlvbnMyIiwiT2JzZXJ2ZUN1cnNvckRlZXAiLCJfRXZlbnRFbWl0dGVyIiwiX2luaGVyaXRzIiwiX3N1cGVyIiwicXVlcnkiLCJfdGhpcyIsIl9jbGFzc0NhbGxDaGVjayIsInJvb3RRdWVyeSIsInNldE1heExpc3RlbmVycyIsInJvb3RPYnNlcnZlciIsInBvcERhdGEiLCJfY3JlYXRlQ2xhc3MiLCJrZXkiLCJ2YWx1ZSIsIm9ic2VydmVDaGFuZ2VzIiwiaGFuZGxlcnMiLCJfdGhpczIiLCJoYW5kbGVyc1dyYXBwZXIiLCJzZWxmIiwiY291bnRlcnMiLCJhZGRlZCIsImNoYW5nZWQiLCJyZW1vdmVkIiwiaWQiLCJkb2MiLCJlbWl0IiwiY2hhbmdlZEZpZWxkcyIsIm5ld0RvYyIsIm9sZERvYyIsInJlbW92ZWREb2MiLCJ3YXNSZWZyZXNoZWQiLCJvbiIsIl9yZWYiLCJfYXN5bmNUb0dlbmVyYXRvciIsIl9yZWdlbmVyYXRvclJ1bnRpbWUiLCJtYXJrIiwiX2NhbGxlZTQiLCJkZWxheSIsInN0YXJ0ZWQiLCJwb3B1bGF0ZWRQYXRocyIsIm1vZGVscyIsIm5ld1F1ZXJpZXMiLCJxdWVyeUl0ZW1DaGFuZ2VkIiwicXVlcnlJdGVtQWRkZWQiLCJvbGRQb3BQYXRocyIsInNwZW5kZWQiLCJ3cmFwIiwiX2NhbGxlZTQkIiwiX2NvbnRleHQ0IiwicHJldiIsIm5leHQiLCJEYXRlIiwibm93IiwiZ2V0UG9wdWxhdGVkUGF0aHMiLCJjaGFpbiIsImN1cnJlbnRNb2RlbHMiLCJtYXAiLCJtb2RlbCIsInNldCIsImlzRW1wdHkiLCJwYXVzZSIsInNlbnQiLCJvbGRJdGVtIiwibmV3SXRlbSIsIm9ic2VydmVyIiwic3RvcCIsIl9yZWYyIiwiX2NhbGxlZSIsInBvcHVsYXRlTG9hZGVkIiwicmVmcmVzaFNjaGVkdWxlZCIsImRvUmVmcmVzaCIsInNjaGVkdWxlUmVmcmVzaCIsIl9jYWxsZWUkIiwiX2NvbnRleHQiLCJfZG9SZWZyZXNoIiwiYXNzaWduIiwiZWFjaCIsImNoYW5nZWRQYXRoZXMiLCJfX2NoYW5nZWRQYXRoZXMiLCJfX2NsZWFyQ2hhbmdlZFBhdGhlcyIsIm9uY2UiLCJhYnJ1cHQiLCJfeDIiLCJrZXlzIiwiX3JlZjMiLCJfY2FsbGVlMiIsInBvcE5hbWUiLCJvbGRJdGVtcyIsIm5ld0l0ZW1zIiwiX2NhbGxlZTIkIiwiX2NvbnRleHQyIiwic2l6ZSIsIm9sZFF1ZXJ5SXRlbSIsImluZGV4IiwibmV3UXVlcnlJdGVtIiwiX3gzIiwiUHJvbWlzZSIsImFsbCIsIl9yZWY0IiwiX2NhbGxlZTMiLCJpIiwiX2NhbGxlZTMkIiwiX2NvbnRleHQzIiwibGVuZ3RoIiwicHVzaCIsIl94NCIsIl94NSIsImF3YWtlIiwiX3giLCJyYXciLCJ1bmRlZmluZWQiLCJtb2RlbHNNYXAiLCJ2YWx1ZXMiLCJ0b09iamVjdCIsImdldHRlcnMiLCJfdGhpczMiLCJfcmVmNSIsIl9jYWxsZWU1IiwiX2NhbGxlZTUkIiwiX2NvbnRleHQ1IiwiX3g2IiwiZXhwb3J0cyJdLCJzb3VyY2VzIjpbIi4uL3NyYy9PYnNlcnZlQ3Vyc29yRGVlcC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgT2JzZXJ2ZUN1cnNvciBmcm9tIFwiLi9PYnNlcnZlQ3Vyc29yXCI7XG5pbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50cyc7XG5pbXBvcnQge21vZGVsUG9wdWxhdGV9IGZyb20gJy4vbW9uZ29vc2VVdGlscyc7XG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmltcG9ydCBwb3B1bGF0ZVByb3h5IGZyb20gJy4vUG9wdWxhdGVQcm94eSc7XG5cbmZ1bmN0aW9uIHF1ZXJ5RXF1YWxzIChxdWVyeTEsIHF1ZXJ5Mikge1xuICAgIGlmICghcXVlcnkxICYmICFxdWVyeTIpXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIGlmICghcXVlcnkxIHx8ICFxdWVyeTIpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICBpZiAocXVlcnkxLm9wICE9PSBxdWVyeTIub3ApXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICBsZXQgc2VyaWFsaXplZENvbmRpdGlvbjEgPSBKU09OLnN0cmluZ2lmeSAocXVlcnkxLl9jb25kaXRpb25zKTtcbiAgICBsZXQgc2VyaWFsaXplZENvbmRpdGlvbjIgPSBKU09OLnN0cmluZ2lmeSAocXVlcnkyLl9jb25kaXRpb25zKTtcbiAgICBpZiAoc2VyaWFsaXplZENvbmRpdGlvbjEgIT09IHNlcmlhbGl6ZWRDb25kaXRpb24yKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICBsZXQgc2VyaWFsaXplZE9wdGlvbnMxID0gSlNPTi5zdHJpbmdpZnkgKHF1ZXJ5MS5vcHRpb25zKTtcbiAgICBsZXQgc2VyaWFsaXplZE9wdGlvbnMyID0gSlNPTi5zdHJpbmdpZnkgKHF1ZXJ5Mi5vcHRpb25zKTtcbiAgICBpZiAoc2VyaWFsaXplZE9wdGlvbnMxICE9PSBzZXJpYWxpemVkT3B0aW9uczIpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgT2JzZXJ2ZUN1cnNvckRlZXAgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICAgIGNvbnN0cnVjdG9yIChxdWVyeSwgb3B0aW9ucykge1xuICAgICAgICBzdXBlciAoKTtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICAgICAgdGhpcy5yb290UXVlcnkgPSBxdWVyeTtcbiAgICAgICAgdGhpcy5zZXRNYXhMaXN0ZW5lcnMgKDApO1xuICAgICAgICB0aGlzLnJvb3RPYnNlcnZlciA9IG5ldyBPYnNlcnZlQ3Vyc29yIChxdWVyeSwgb3B0aW9ucyk7XG4gICAgICAgIHRoaXMucG9wRGF0YSA9IHt9O1xuICAgIH1cblxuICAgIC8qKkBwYXJhbSB7b2JqZWN0fSBoYW5kbGVyc1xuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oaWQ6U3RyaW5nLCBkb2M6bW9uZ29vc2UuRG9jdW1lbnQpfSBoYW5kbGVycy5hZGRlZFxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oaWQ6c3RyaW5nLCBjaGFuZ2VkRmllbGRzOm9iamVjdCxuZXdEb2M6bW9uZ29vc2UuRG9jdW1lbnQsb2xkRG9jOiBtb25nb29zZS5Eb2N1bWVudCl9IGhhbmRsZXJzLmNoYW5nZWRcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKGlkOlN0cmluZywgcmVtb3ZlZERvYzptb25nb29zZS5Eb2N1bWVudCl9IGhhbmRsZXJzLnJlbW92ZWRcbiAgICAgKiovXG4gICAgb2JzZXJ2ZUNoYW5nZXMgKGhhbmRsZXJzKSB7XG4gICAgICAgIGxldCBoYW5kbGVyc1dyYXBwZXIgPSB7fTtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgICAgIGxldCBjb3VudGVycyA9IHtcbiAgICAgICAgICAgIGFkZGVkOjAsXG4gICAgICAgICAgICBjaGFuZ2VkOjAsXG4gICAgICAgICAgICByZW1vdmVkOjBcbiAgICAgICAgfVxuICAgICAgICBpZiAoaGFuZGxlcnMuYWRkZWQpIHtcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFyc1xuICAgICAgICAgICAgaGFuZGxlcnNXcmFwcGVyLmFkZGVkID0gZnVuY3Rpb24gKGlkLCBkb2MpIHtcbiAgICAgICAgICAgICAgICBjb3VudGVycy5hZGRlZCsrO1xuICAgICAgICAgICAgICAgIGhhbmRsZXJzLmFkZGVkLmFwcGx5IChzZWxmLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgIHNlbGYuZW1pdCgnYWRkZWQnLGlkLGRvYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGhhbmRsZXJzLmNoYW5nZWQpIHtcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFyc1xuICAgICAgICAgICAgaGFuZGxlcnNXcmFwcGVyLmNoYW5nZWQgPSBmdW5jdGlvbiAoaWQsIGNoYW5nZWRGaWVsZHMsIG5ld0RvYywgb2xkRG9jKSB7XG4gICAgICAgICAgICAgICAgY291bnRlcnMuY2hhbmdlZCsrO1xuICAgICAgICAgICAgICAgIGhhbmRsZXJzLmNoYW5nZWQuYXBwbHkgKHNlbGYsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgc2VsZi5lbWl0KCdjaGFuZ2VkJyxpZCwgY2hhbmdlZEZpZWxkcywgbmV3RG9jLCBvbGREb2MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChoYW5kbGVycy5yZW1vdmVkKSB7XG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgICAgICAgICAgIGhhbmRsZXJzV3JhcHBlci5yZW1vdmVkID0gZnVuY3Rpb24gKGlkLCByZW1vdmVkRG9jKSB7XG4gICAgICAgICAgICAgICAgY291bnRlcnMucmVtb3ZlZCsrO1xuICAgICAgICAgICAgICAgIGhhbmRsZXJzLnJlbW92ZWQuYXBwbHkgKHNlbGYsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgc2VsZi5lbWl0KCdyZW1vdmVkJyxpZCwgcmVtb3ZlZERvYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgd2FzUmVmcmVzaGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMucm9vdE9ic2VydmVyLm9uICgncmVmcmVzaCcsIGFzeW5jIChkZWxheSkgPT4ge1xuICAgICAgICAgICAgbGV0IHN0YXJ0ZWQgPSBEYXRlLm5vdyAoKTtcbiAgICAgICAgICAgIGxldCBwb3B1bGF0ZWRQYXRocyA9IHRoaXMucm9vdFF1ZXJ5LmdldFBvcHVsYXRlZFBhdGhzICgpO1xuXG4gICAgICAgICAgICBsZXQgbW9kZWxzID0gXy5jaGFpbiAodGhpcy5jdXJyZW50TW9kZWxzICgpKVxuICAgICAgICAgICAgLm1hcCAoKG1vZGVsKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBvcHVsYXRlUHJveHkgKG1vZGVsLCB7cG9wdWxhdGVkUGF0aHMsIHNldDogdHJ1ZX0pXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnZhbHVlICgpO1xuXG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgaGFuZGxlcnMuY2hhbmdlZCAmJlxuICAgICAgICAgICAgICAgICFfLmlzRW1wdHkgKG1vZGVscykgJiYgIV8uaXNFbXB0eSAocG9wdWxhdGVkUGF0aHMpXG4gICAgICAgICAgICAgICAgJiYoIXdhc1JlZnJlc2hlZHx8Y291bnRlcnMuYWRkZWQ+MHx8Y291bnRlcnMuY2hhbmdlZD4wfHxjb3VudGVycy5yZW1vdmVkPjApXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBjb3VudGVycy5hZGRlZD0wO1xuICAgICAgICAgICAgICAgIGNvdW50ZXJzLmNoYW5nZWQ9MDtcbiAgICAgICAgICAgICAgICBjb3VudGVycy5yZW1vdmVkPTA7XG4gICAgICAgICAgICAgICAgdGhpcy5yb290T2JzZXJ2ZXIucGF1c2UgKCk7XG4gICAgICAgICAgICAgICAgLyoqQHR5cGUgQXJyYXk8UXVlcnlJdGVtPiovXG4gICAgICAgICAgICAgICAgbGV0IG5ld1F1ZXJpZXMgPSBhd2FpdCBtb2RlbFBvcHVsYXRlLmFwcGx5ICh0aGlzLnJvb3RRdWVyeS5tb2RlbCwgW21vZGVscywgcG9wdWxhdGVkUGF0aHNdKTtcbiAgICAgICAgICAgICAgICBjb25zdCBxdWVyeUl0ZW1DaGFuZ2VkID0gKG9sZEl0ZW0sIG5ld0l0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9sZEl0ZW0pXG4gICAgICAgICAgICAgICAgICAgICAgICBvbGRJdGVtLm9ic2VydmVyLnN0b3AgKCk7XG4gICAgICAgICAgICAgICAgICAgIHF1ZXJ5SXRlbUFkZGVkIChuZXdJdGVtKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGNvbnN0IHF1ZXJ5SXRlbUFkZGVkID0gYXN5bmMgKG5ld0l0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbmV3SXRlbS5vYnNlcnZlciA9IG5ldyBPYnNlcnZlQ3Vyc29yIChuZXdJdGVtLnF1ZXJ5LCB0aGlzLm9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgcG9wdWxhdGVMb2FkZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJlZnJlc2hTY2hlZHVsZWQgPSAwO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1pbm5lci1kZWNsYXJhdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gZG9SZWZyZXNoICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0l0ZW0uYXNzaWduIChuZXdJdGVtLm9ic2VydmVyLmN1cnJlbnRNb2RlbHMgKGZhbHNlKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBfLmVhY2ggKG1vZGVscywgKG1vZGVsKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGNoYW5nZWRQYXRoZXMgPSBtb2RlbC5fX2NoYW5nZWRQYXRoZXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFfLmlzRW1wdHkgKGNoYW5nZWRQYXRoZXMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoYW5kbGVycy5jaGFuZ2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVycy5jaGFuZ2VkLmFwcGx5IChzZWxmLCBbbW9kZWwuaWQsIGNoYW5nZWRQYXRoZXMsIG1vZGVsLCBtb2RlbF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5lbWl0ICgnY2hhbmdlZCcsIG1vZGVsLmlkLCBjaGFuZ2VkUGF0aGVzLCBtb2RlbCwgbW9kZWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kZWwuX19jbGVhckNoYW5nZWRQYXRoZXMgKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGxldCBzY2hlZHVsZVJlZnJlc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlZnJlc2hTY2hlZHVsZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWZyZXNoU2NoZWR1bGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdJdGVtLm9ic2VydmVyLm9uY2UgKCdyZWZyZXNoJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb1JlZnJlc2ggKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZnJlc2hTY2hlZHVsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICBuZXdJdGVtLm9ic2VydmVyLm9ic2VydmVDaGFuZ2VzICh7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZGVkIChpZCwgZG9jKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBvcHVsYXRlTG9hZGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjaGVkdWxlUmVmcmVzaCAoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2VkIChpZCwgY2hhbmdlZEZpZWxkcywgbmV3RG9jLCBvbGREb2MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2hlZHVsZVJlZnJlc2ggKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVkIChpZCwgcmVtb3ZlZERvYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjaGVkdWxlUmVmcmVzaCAoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IG5ld0l0ZW0ub2JzZXJ2ZXIubW9kZWxzIChmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIGRvUmVmcmVzaCAoKTtcbiAgICAgICAgICAgICAgICAgICAgcG9wdWxhdGVMb2FkZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3SXRlbTtcbiAgICAgICAgICAgICAgICB9O1xuXG5cbiAgICAgICAgICAgICAgICBsZXQgb2xkUG9wUGF0aHMgPSBfLmtleXMgKHRoaXMucG9wRGF0YSk7XG5cbiAgICAgICAgICAgICAgICBfLmVhY2ggKG9sZFBvcFBhdGhzLCBhc3luYyAocG9wTmFtZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBsZXQgb2xkSXRlbXMgPSB0aGlzLnBvcERhdGFbcG9wTmFtZV07XG4gICAgICAgICAgICAgICAgICAgIGxldCBuZXdJdGVtcyA9IG5ld1F1ZXJpZXNbcG9wTmFtZV07XG4gICAgICAgICAgICAgICAgICAgIGlmICghbmV3SXRlbXMgfHwgXy5zaXplIChuZXdJdGVtcykgIT09IF8uc2l6ZSAob2xkSXRlbXMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfLmVhY2ggKG9sZEl0ZW1zLCAob2xkSXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9sZEl0ZW0ub2JzZXJ2ZXIuc3RvcCAoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRlbGV0ZSB0aGlzLnBvcERhdGFbcG9wTmFtZV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXy5lYWNoIChvbGRJdGVtcywgKG9sZFF1ZXJ5SXRlbSwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBuZXdRdWVyeUl0ZW0gPSBuZXdJdGVtc1tpbmRleF07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocXVlcnlFcXVhbHMgKG9sZFF1ZXJ5SXRlbS5vYnNlcnZlci5xdWVyeSwgbmV3UXVlcnlJdGVtLnF1ZXJ5KSkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Ugey8v0LjQt9C80LXQvdC40LvQvtGB0YxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWVyeUl0ZW1DaGFuZ2VkIChvbGRRdWVyeUl0ZW0sIG5ld1F1ZXJ5SXRlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwgKFxuICAgICAgICAgICAgICAgICAgICBfLm1hcCAobmV3UXVlcmllcywgYXN5bmMgKG5ld0l0ZW1zLCBwb3BOYW1lKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMucG9wRGF0YVtwb3BOYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucG9wRGF0YVtwb3BOYW1lXSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbmV3SXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG5ld0l0ZW0gPSBuZXdJdGVtc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgcXVlcnlJdGVtQWRkZWQgKG5ld0l0ZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcERhdGFbcG9wTmFtZV0ucHVzaCAobmV3SXRlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnJvb3RPYnNlcnZlci5hd2FrZSAoKTtcblxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IHNwZW5kZWQgPSBEYXRlLm5vdyAoKSAtIHN0YXJ0ZWQ7XG4gICAgICAgICAgICB3YXNSZWZyZXNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5lbWl0ICgncmVmcmVzaCcsIGRlbGF5ICsgc3BlbmRlZCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnJvb3RPYnNlcnZlci5vYnNlcnZlQ2hhbmdlcyAoaGFuZGxlcnNXcmFwcGVyKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgY3VycmVudE1vZGVscyAocmF3ID0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuIF8uY2hhaW4gKHRoaXMucm9vdE9ic2VydmVyLm1vZGVsc01hcClcbiAgICAgICAgLnZhbHVlcyAoKVxuICAgICAgICAubWFwICgobW9kZWwpID0+IHtcbiAgICAgICAgICAgIGlmIChyYXcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbW9kZWwudG9PYmplY3QgKHtnZXR0ZXJzOiBmYWxzZX0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG1vZGVsO1xuICAgICAgICB9KVxuICAgICAgICAudmFsdWUgKClcbiAgICB9XG5cbiAgICBtb2RlbHMgKHJhdykge1xuICAgICAgICByZXR1cm4gdGhpcy5yb290T2JzZXJ2ZXIubW9kZWxzIChyYXcpO1xuICAgIH1cblxuICAgIHN0b3AgKCkge1xuICAgICAgICB0aGlzLnJvb3RPYnNlcnZlci5zdG9wICgpO1xuICAgICAgICBsZXQgb2xkUG9wUGF0aHMgPSBfLmtleXMgKHRoaXMucG9wRGF0YSk7XG4gICAgICAgIF8uZWFjaCAob2xkUG9wUGF0aHMsIGFzeW5jIChwb3BOYW1lKSA9PiB7XG4gICAgICAgICAgICBsZXQgb2xkSXRlbXMgPSB0aGlzLnBvcERhdGFbcG9wTmFtZV07XG4gICAgICAgICAgICBfLmVhY2ggKG9sZEl0ZW1zLCAob2xkSXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgIG9sZEl0ZW0ub2JzZXJ2ZXIuc3RvcCAoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5wb3BEYXRhID0ge307XG4gICAgfVxuXG59Il0sIm1hcHBpbmdzIjoicTZDQUFBLElBQUFBLGNBQUEsR0FBQUMsT0FBQSxvQkFBNEMsSUFBckNDLGFBQWEsT0FBQUMsdUJBQUEsYUFBQUgsY0FBQTtBQUNwQixJQUFBSSxPQUFBLEdBQUFILE9BQUEsV0FBa0MsSUFBM0JJLFlBQVksT0FBQUYsdUJBQUEsYUFBQUMsT0FBQTtBQUNuQixJQUFBRSxjQUFBLEdBQUFMLE9BQUEsb0JBQThDLElBQXRDTSxhQUFhLEdBQUFELGNBQUEsQ0FBYkMsYUFBYTtBQUNyQixJQUFBQyxXQUFBLEdBQUFQLE9BQUEsZUFBMkIsSUFBcEJRLENBQUMsT0FBQU4sdUJBQUEsYUFBQUssV0FBQTtBQUNSLElBQUFFLGNBQUEsR0FBQVQsT0FBQSxvQkFBNEMsSUFBckNVLGFBQWEsT0FBQVIsdUJBQUEsYUFBQU8sY0FBQSxzQkFBQUUsYUFBQUMsT0FBQSxPQUFBQyx5QkFBQSxHQUFBQyx5QkFBQSxtQkFBQUMscUJBQUEsT0FBQUMsS0FBQSxHQUFBQyxlQUFBLENBQUFMLE9BQUEsRUFBQU0sTUFBQSxLQUFBTCx5QkFBQSxPQUFBTSxTQUFBLEdBQUFGLGVBQUEsT0FBQUcsV0FBQSxDQUFBRixNQUFBLEdBQUFHLE9BQUEsQ0FBQUMsU0FBQSxDQUFBTixLQUFBLEVBQUFPLFNBQUEsRUFBQUosU0FBQSxVQUFBRCxNQUFBLEdBQUFGLEtBQUEsQ0FBQVEsS0FBQSxPQUFBRCxTQUFBLFVBQUFFLDBCQUFBLE9BQUFQLE1BQUEsY0FBQUosMEJBQUEsY0FBQU8sT0FBQSxxQkFBQUEsT0FBQSxDQUFBQyxTQUFBLG1CQUFBRCxPQUFBLENBQUFDLFNBQUEsQ0FBQUksSUFBQSwwQkFBQUMsS0FBQSxrQ0FBQUMsT0FBQSxDQUFBQyxTQUFBLENBQUFDLE9BQUEsQ0FBQUMsSUFBQSxDQUFBVixPQUFBLENBQUFDLFNBQUEsQ0FBQU0sT0FBQSw0Q0FBQUksQ0FBQTs7QUFFcEIsU0FBU0MsV0FBV0EsQ0FBRUMsTUFBTSxFQUFFQyxNQUFNLEVBQUU7RUFDbEMsSUFBSSxDQUFDRCxNQUFNLElBQUksQ0FBQ0MsTUFBTTtFQUNsQixPQUFPLElBQUk7RUFDZixJQUFJLENBQUNELE1BQU0sSUFBSSxDQUFDQyxNQUFNO0VBQ2xCLE9BQU8sS0FBSztFQUNoQixJQUFJRCxNQUFNLENBQUNFLEVBQUUsS0FBS0QsTUFBTSxDQUFDQyxFQUFFO0VBQ3ZCLE9BQU8sS0FBSztFQUNoQixJQUFJQyxvQkFBb0IsR0FBR0MsSUFBSSxDQUFDQyxTQUFTLENBQUVMLE1BQU0sQ0FBQ00sV0FBVyxDQUFDO0VBQzlELElBQUlDLG9CQUFvQixHQUFHSCxJQUFJLENBQUNDLFNBQVMsQ0FBRUosTUFBTSxDQUFDSyxXQUFXLENBQUM7RUFDOUQsSUFBSUgsb0JBQW9CLEtBQUtJLG9CQUFvQjtFQUM3QyxPQUFPLEtBQUs7O0VBRWhCLElBQUlDLGtCQUFrQixHQUFHSixJQUFJLENBQUNDLFNBQVMsQ0FBRUwsTUFBTSxDQUFDUyxPQUFPLENBQUM7RUFDeEQsSUFBSUMsa0JBQWtCLEdBQUdOLElBQUksQ0FBQ0MsU0FBUyxDQUFFSixNQUFNLENBQUNRLE9BQU8sQ0FBQztFQUN4RCxJQUFJRCxrQkFBa0IsS0FBS0Usa0JBQWtCO0VBQ3pDLE9BQU8sS0FBSztFQUNoQixPQUFPLElBQUk7QUFDZixDQUFDOztBQUVvQkMsaUJBQWlCLDBCQUFBQyxhQUFBLEdBQUFDLFNBQUEsQ0FBQUYsaUJBQUEsRUFBQUMsYUFBQSxNQUFBRSxNQUFBLEdBQUFyQyxZQUFBLENBQUFrQyxpQkFBQTtFQUNsQyxTQUFBQSxrQkFBYUksS0FBSyxFQUFFTixPQUFPLEVBQUUsS0FBQU8sS0FBQSxDQUFBQyxlQUFBLE9BQUFOLGlCQUFBO0lBQ3pCSyxLQUFBLEdBQUFGLE1BQUEsQ0FBQWpCLElBQUE7SUFDQW1CLEtBQUEsQ0FBS1AsT0FBTyxHQUFHQSxPQUFPO0lBQ3RCTyxLQUFBLENBQUtFLFNBQVMsR0FBR0gsS0FBSztJQUN0QkMsS0FBQSxDQUFLRyxlQUFlLENBQUUsQ0FBQyxDQUFDO0lBQ3hCSCxLQUFBLENBQUtJLFlBQVksR0FBRyxJQUFJckQsYUFBYSxDQUFFZ0QsS0FBSyxFQUFFTixPQUFPLENBQUM7SUFDdERPLEtBQUEsQ0FBS0ssT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLE9BQUFMLEtBQUE7RUFDdEI7O0VBRUE7QUFDSjtBQUNBO0FBQ0E7QUFDQSxNQUpJTSxZQUFBLENBQUFYLGlCQUFBLEtBQUFZLEdBQUEsb0JBQUFDLEtBQUE7SUFLQSxTQUFBQyxlQUFnQkMsUUFBUSxFQUFFLEtBQUFDLE1BQUE7TUFDdEIsSUFBSUMsZUFBZSxHQUFHLENBQUMsQ0FBQztNQUN4QixJQUFNQyxJQUFJLEdBQUcsSUFBSTtNQUNqQixJQUFJQyxRQUFRLEdBQUc7UUFDWEMsS0FBSyxFQUFDLENBQUM7UUFDUEMsT0FBTyxFQUFDLENBQUM7UUFDVEMsT0FBTyxFQUFDO01BQ1osQ0FBQztNQUNELElBQUlQLFFBQVEsQ0FBQ0ssS0FBSyxFQUFFO1FBQ2hCO1FBQ0FILGVBQWUsQ0FBQ0csS0FBSyxHQUFHLFVBQVVHLEVBQUUsRUFBRUMsR0FBRyxFQUFFO1VBQ3ZDTCxRQUFRLENBQUNDLEtBQUssRUFBRTtVQUNoQkwsUUFBUSxDQUFDSyxLQUFLLENBQUN6QyxLQUFLLENBQUV1QyxJQUFJLEVBQUV4QyxTQUFTLENBQUM7VUFDdEN3QyxJQUFJLENBQUNPLElBQUksQ0FBQyxPQUFPLEVBQUNGLEVBQUUsRUFBQ0MsR0FBRyxDQUFDO1FBQzdCLENBQUM7TUFDTDtNQUNBLElBQUlULFFBQVEsQ0FBQ00sT0FBTyxFQUFFO1FBQ2xCO1FBQ0FKLGVBQWUsQ0FBQ0ksT0FBTyxHQUFHLFVBQVVFLEVBQUUsRUFBRUcsYUFBYSxFQUFFQyxNQUFNLEVBQUVDLE1BQU0sRUFBRTtVQUNuRVQsUUFBUSxDQUFDRSxPQUFPLEVBQUU7VUFDbEJOLFFBQVEsQ0FBQ00sT0FBTyxDQUFDMUMsS0FBSyxDQUFFdUMsSUFBSSxFQUFFeEMsU0FBUyxDQUFDO1VBQ3hDd0MsSUFBSSxDQUFDTyxJQUFJLENBQUMsU0FBUyxFQUFDRixFQUFFLEVBQUVHLGFBQWEsRUFBRUMsTUFBTSxFQUFFQyxNQUFNLENBQUM7UUFDMUQsQ0FBQztNQUNMO01BQ0EsSUFBSWIsUUFBUSxDQUFDTyxPQUFPLEVBQUU7UUFDbEI7UUFDQUwsZUFBZSxDQUFDSyxPQUFPLEdBQUcsVUFBVUMsRUFBRSxFQUFFTSxVQUFVLEVBQUU7VUFDaERWLFFBQVEsQ0FBQ0csT0FBTyxFQUFFO1VBQ2xCUCxRQUFRLENBQUNPLE9BQU8sQ0FBQzNDLEtBQUssQ0FBRXVDLElBQUksRUFBRXhDLFNBQVMsQ0FBQztVQUN4Q3dDLElBQUksQ0FBQ08sSUFBSSxDQUFDLFNBQVMsRUFBQ0YsRUFBRSxFQUFFTSxVQUFVLENBQUM7UUFDdkMsQ0FBQztNQUNMOztNQUVBLElBQUlDLFlBQVksR0FBRyxLQUFLO01BQ3hCLElBQUksQ0FBQ3JCLFlBQVksQ0FBQ3NCLEVBQUUsQ0FBRSxTQUFTLGdDQUFBQyxJQUFBLEdBQUFDLGlCQUFBLGVBQUFDLG1CQUFBLENBQUFDLElBQUEsQ0FBRSxTQUFBQyxTQUFPQyxLQUFLLE9BQUFDLE9BQUEsRUFBQUMsY0FBQSxFQUFBQyxNQUFBLEVBQUFDLFVBQUEsRUFBQUMsZ0JBQUEsRUFBQUMsY0FBQSxFQUFBQyxXQUFBLEVBQUFDLE9BQUEsUUFBQVgsbUJBQUEsQ0FBQVksSUFBQSxVQUFBQyxVQUFBQyxTQUFBLHFCQUFBQSxTQUFBLENBQUFDLElBQUEsR0FBQUQsU0FBQSxDQUFBRSxJQUFBO2dCQUNyQ1osT0FBTyxHQUFHYSxJQUFJLENBQUNDLEdBQUcsQ0FBRSxDQUFDO2dCQUNyQmIsY0FBYyxHQUFHdkIsTUFBSSxDQUFDVCxTQUFTLENBQUM4QyxpQkFBaUIsQ0FBRSxDQUFDOztnQkFFcERiLE1BQU0sR0FBRzdFLENBQUMsQ0FBQzJGLEtBQUssQ0FBRXRDLE1BQUksQ0FBQ3VDLGFBQWEsQ0FBRSxDQUFDLENBQUM7Z0JBQzNDQyxHQUFHLENBQUUsVUFBQ0MsS0FBSyxFQUFLO2tCQUNiLE9BQU81RixhQUFhLENBQUU0RixLQUFLLEVBQUUsRUFBQ2xCLGNBQWMsRUFBZEEsY0FBYyxFQUFFbUIsR0FBRyxFQUFFLElBQUksRUFBQyxDQUFDO2dCQUM3RCxDQUFDLENBQUM7Z0JBQ0Q3QyxLQUFLLENBQUUsQ0FBQzs7O2dCQUdMRSxRQUFRLENBQUNNLE9BQU87Z0JBQ2hCLENBQUMxRCxDQUFDLENBQUNnRyxPQUFPLENBQUVuQixNQUFNLENBQUMsSUFBSSxDQUFDN0UsQ0FBQyxDQUFDZ0csT0FBTyxDQUFFcEIsY0FBYyxDQUFDO2dCQUMvQyxDQUFDVCxZQUFZLElBQUVYLFFBQVEsQ0FBQ0MsS0FBSyxHQUFDLENBQUMsSUFBRUQsUUFBUSxDQUFDRSxPQUFPLEdBQUMsQ0FBQyxJQUFFRixRQUFRLENBQUNHLE9BQU8sR0FBQyxDQUFDLENBQUMsSUFBQTBCLFNBQUEsQ0FBQUUsSUFBQTs7Z0JBRTNFL0IsUUFBUSxDQUFDQyxLQUFLLEdBQUMsQ0FBQztnQkFDaEJELFFBQVEsQ0FBQ0UsT0FBTyxHQUFDLENBQUM7Z0JBQ2xCRixRQUFRLENBQUNHLE9BQU8sR0FBQyxDQUFDO2dCQUNsQk4sTUFBSSxDQUFDUCxZQUFZLENBQUNtRCxLQUFLLENBQUUsQ0FBQztnQkFDMUIsMkJBQUFaLFNBQUEsQ0FBQUUsSUFBQTtrQkFDdUJ6RixhQUFhLENBQUNrQixLQUFLLENBQUVxQyxNQUFJLENBQUNULFNBQVMsQ0FBQ2tELEtBQUssRUFBRSxDQUFDakIsTUFBTSxFQUFFRCxjQUFjLENBQUMsQ0FBQyxVQUF2RkUsVUFBVSxHQUFBTyxTQUFBLENBQUFhLElBQUE7Z0JBQ1JuQixnQkFBZ0IsR0FBRyxTQUFuQkEsZ0JBQWdCQSxDQUFJb0IsT0FBTyxFQUFFQyxPQUFPLEVBQUs7a0JBQzNDLElBQUlELE9BQU87a0JBQ1BBLE9BQU8sQ0FBQ0UsUUFBUSxDQUFDQyxJQUFJLENBQUUsQ0FBQztrQkFDNUJ0QixjQUFjLENBQUVvQixPQUFPLENBQUM7Z0JBQzVCLENBQUM7Z0JBQ0twQixjQUFjLGlDQUFBdUIsS0FBQSxHQUFBakMsaUJBQUEsZUFBQUMsbUJBQUEsQ0FBQUMsSUFBQSxDQUFHLFNBQUFnQyxRQUFPSixPQUFPLE9BQUFLLGNBQUEsRUFBQUMsZ0JBQUE7Ozs7OztzQkFNeEJDLFNBQVMsRUFBQUMsZUFBQSxRQUFBckMsbUJBQUEsQ0FBQVksSUFBQSxVQUFBMEIsU0FBQUMsUUFBQSxxQkFBQUEsUUFBQSxDQUFBeEIsSUFBQSxHQUFBd0IsUUFBQSxDQUFBdkIsSUFBQSxVQUFUb0IsU0FBUyxZQUFBSSxXQUFBLEVBQUk7NEJBQ2xCWCxPQUFPLENBQUNZLE1BQU0sQ0FBRVosT0FBTyxDQUFDQyxRQUFRLENBQUNULGFBQWEsQ0FBRSxLQUFLLENBQUMsQ0FBQzs0QkFDdkQ1RixDQUFDLENBQUNpSCxJQUFJLENBQUVwQyxNQUFNLEVBQUUsVUFBQ2lCLEtBQUssRUFBSzs4QkFDdkIsSUFBSW9CLGFBQWEsR0FBR3BCLEtBQUssQ0FBQ3FCLGVBQWU7OEJBQ3pDLElBQUksQ0FBQ25ILENBQUMsQ0FBQ2dHLE9BQU8sQ0FBRWtCLGFBQWEsQ0FBQyxFQUFFO2dDQUM1QixJQUFJOUQsUUFBUSxDQUFDTSxPQUFPLEVBQUU7a0NBQ2xCTixRQUFRLENBQUNNLE9BQU8sQ0FBQzFDLEtBQUssQ0FBRXVDLElBQUksRUFBRSxDQUFDdUMsS0FBSyxDQUFDbEMsRUFBRSxFQUFFc0QsYUFBYSxFQUFFcEIsS0FBSyxFQUFFQSxLQUFLLENBQUMsQ0FBQztrQ0FDdEV2QyxJQUFJLENBQUNPLElBQUksQ0FBRSxTQUFTLEVBQUVnQyxLQUFLLENBQUNsQyxFQUFFLEVBQUVzRCxhQUFhLEVBQUVwQixLQUFLLEVBQUVBLEtBQUssQ0FBQztrQ0FDNURBLEtBQUssQ0FBQ3NCLG9CQUFvQixDQUFFLENBQUM7Z0NBQ2pDOzhCQUNKOzRCQUNKLENBQUMsQ0FBQzswQkFDTixDQUFDLENBakJEaEIsT0FBTyxDQUFDQyxRQUFRLEdBQUcsSUFBSTVHLGFBQWEsQ0FBRTJHLE9BQU8sQ0FBQzNELEtBQUssRUFBRVksTUFBSSxDQUFDbEIsT0FBTyxDQUFDLENBQzlEc0UsY0FBYyxHQUFHLEtBQUssQ0FDdEJDLGdCQUFnQixHQUFHLENBQUMsRUFFeEI7OzBCQWVJRSxlQUFlLEdBQUcsU0FBbEJBLGVBQWVBLENBQUEsRUFBZTs0QkFDOUIsSUFBSSxDQUFDRixnQkFBZ0IsRUFBRTs4QkFDbkJBLGdCQUFnQixHQUFHLElBQUk7OEJBQ3ZCTixPQUFPLENBQUNDLFFBQVEsQ0FBQ2dCLElBQUksQ0FBRSxTQUFTLEVBQUUsWUFBTTtnQ0FDcENWLFNBQVMsQ0FBRSxDQUFDO2dDQUNaRCxnQkFBZ0IsR0FBRyxLQUFLOzhCQUM1QixDQUFDLENBQUM7NEJBQ047MEJBQ0osQ0FBQzs7MEJBRUROLE9BQU8sQ0FBQ0MsUUFBUSxDQUFDbEQsY0FBYyxDQUFFOzRCQUM3Qjs0QkFDQU0sS0FBSyxXQUFBQSxNQUFFRyxFQUFFLEVBQUVDLEdBQUcsRUFBRTs4QkFDWixJQUFJNEMsY0FBYyxFQUFFO2dDQUNoQkcsZUFBZSxDQUFFLENBQUM7OEJBQ3RCOzRCQUNKLENBQUM7NEJBQ0Q7NEJBQ0FsRCxPQUFPLFdBQUFBLFFBQUVFLEVBQUUsRUFBRUcsYUFBYSxFQUFFQyxNQUFNLEVBQUVDLE1BQU0sRUFBRTs4QkFDeEMyQyxlQUFlLENBQUUsQ0FBQzs0QkFDdEIsQ0FBQzs0QkFDRDs0QkFDQWpELE9BQU8sV0FBQUEsUUFBRUMsRUFBRSxFQUFFTSxVQUFVLEVBQUU7OEJBQ3JCMEMsZUFBZSxDQUFFLENBQUM7NEJBQ3RCOzBCQUNKLENBQUMsQ0FBQyxDQUFDRSxRQUFBLENBQUF2QixJQUFBOzRCQUNHYSxPQUFPLENBQUNDLFFBQVEsQ0FBQ3hCLE1BQU0sQ0FBRSxLQUFLLENBQUM7MEJBQ3JDOEIsU0FBUyxDQUFFLENBQUM7MEJBQ1pGLGNBQWMsR0FBRyxJQUFJLENBQUMsT0FBQUssUUFBQSxDQUFBUSxNQUFBOzBCQUNmbEIsT0FBTyw0QkFBQVUsUUFBQSxDQUFBUixJQUFBLE9BQUFFLE9BQUEsR0FDakIsbUJBbERLeEIsY0FBY0EsQ0FBQXVDLEdBQUEsVUFBQWhCLEtBQUEsQ0FBQXZGLEtBQUEsT0FBQUQsU0FBQTs7OztnQkFxRGhCa0UsV0FBVyxHQUFHakYsQ0FBQyxDQUFDd0gsSUFBSSxDQUFFbkUsTUFBSSxDQUFDTixPQUFPLENBQUM7O2dCQUV2Qy9DLENBQUMsQ0FBQ2lILElBQUksQ0FBRWhDLFdBQVcsZ0NBQUF3QyxLQUFBLEdBQUFuRCxpQkFBQSxlQUFBQyxtQkFBQSxDQUFBQyxJQUFBLENBQUUsU0FBQWtELFNBQU9DLE9BQU8sT0FBQUMsUUFBQSxFQUFBQyxRQUFBLFFBQUF0RCxtQkFBQSxDQUFBWSxJQUFBLFVBQUEyQyxVQUFBQyxTQUFBLHFCQUFBQSxTQUFBLENBQUF6QyxJQUFBLEdBQUF5QyxTQUFBLENBQUF4QyxJQUFBOzBCQUMzQnFDLFFBQVEsR0FBR3ZFLE1BQUksQ0FBQ04sT0FBTyxDQUFDNEUsT0FBTyxDQUFDOzBCQUNoQ0UsUUFBUSxHQUFHL0MsVUFBVSxDQUFDNkMsT0FBTyxDQUFDOzBCQUM5QixDQUFDRSxRQUFRLElBQUk3SCxDQUFDLENBQUNnSSxJQUFJLENBQUVILFFBQVEsQ0FBQyxLQUFLN0gsQ0FBQyxDQUFDZ0ksSUFBSSxDQUFFSixRQUFRLENBQUMsSUFBQUcsU0FBQSxDQUFBeEMsSUFBQTswQkFDcER2RixDQUFDLENBQUNpSCxJQUFJLENBQUVXLFFBQVEsRUFBRSxVQUFDekIsT0FBTyxFQUFLOzRCQUMzQkEsT0FBTyxDQUFDRSxRQUFRLENBQUNDLElBQUksQ0FBRSxDQUFDOzBCQUM1QixDQUFDLENBQUMsQ0FBQyxPQUFBeUIsU0FBQSxDQUFBVCxNQUFBOzBCQUNJLE9BQU9qRSxNQUFJLENBQUNOLE9BQU8sQ0FBQzRFLE9BQU8sQ0FBQzs7MEJBRXZDM0gsQ0FBQyxDQUFDaUgsSUFBSSxDQUFFVyxRQUFRLEVBQUUsVUFBQ0ssWUFBWSxFQUFFQyxLQUFLLEVBQUs7NEJBQ3ZDLElBQUlDLFlBQVksR0FBR04sUUFBUSxDQUFDSyxLQUFLLENBQUM7NEJBQ2xDLElBQUl6RyxXQUFXLENBQUV3RyxZQUFZLENBQUM1QixRQUFRLENBQUM1RCxLQUFLLEVBQUUwRixZQUFZLENBQUMxRixLQUFLLENBQUMsRUFBRTs7NEJBRW5FLENBQUMsTUFBTSxDQUFDOzhCQUNKc0MsZ0JBQWdCLENBQUVrRCxZQUFZLEVBQUVFLFlBQVksQ0FBQzs0QkFDakQ7MEJBQ0osQ0FBQyxDQUFDLENBQUMseUJBQUFKLFNBQUEsQ0FBQXpCLElBQUEsT0FBQW9CLFFBQUEsR0FDTixvQkFBQVUsR0FBQSxVQUFBWCxLQUFBLENBQUF6RyxLQUFBLE9BQUFELFNBQUE7Z0JBQUEsQ0FBQyxDQUFDc0UsU0FBQSxDQUFBRSxJQUFBOztrQkFFRzhDLE9BQU8sQ0FBQ0MsR0FBRztvQkFDYnRJLENBQUMsQ0FBQzZGLEdBQUcsQ0FBRWYsVUFBVSxnQ0FBQXlELEtBQUEsR0FBQWpFLGlCQUFBLGVBQUFDLG1CQUFBLENBQUFDLElBQUEsQ0FBRSxTQUFBZ0UsU0FBT1gsUUFBUSxFQUFFRixPQUFPLE9BQUFjLENBQUEsRUFBQXJDLE9BQUEsUUFBQTdCLG1CQUFBLENBQUFZLElBQUEsVUFBQXVELFVBQUFDLFNBQUEscUJBQUFBLFNBQUEsQ0FBQXJELElBQUEsR0FBQXFELFNBQUEsQ0FBQXBELElBQUE7OEJBQ2xDbEMsTUFBSSxDQUFDTixPQUFPLENBQUM0RSxPQUFPLENBQUMsR0FBQWdCLFNBQUEsQ0FBQXBELElBQUE7OEJBQ3RCbEMsTUFBSSxDQUFDTixPQUFPLENBQUM0RSxPQUFPLENBQUMsR0FBRyxFQUFFOzhCQUNqQmMsQ0FBQyxHQUFHLENBQUMsY0FBRUEsQ0FBQyxHQUFHWixRQUFRLENBQUNlLE1BQU0sSUFBQUQsU0FBQSxDQUFBcEQsSUFBQTs4QkFDM0JhLE9BQU8sR0FBR3lCLFFBQVEsQ0FBQ1ksQ0FBQyxDQUFDLENBQUFFLFNBQUEsQ0FBQXBELElBQUE7Z0NBQ25CUCxjQUFjLENBQUVvQixPQUFPLENBQUM7OEJBQzlCL0MsTUFBSSxDQUFDTixPQUFPLENBQUM0RSxPQUFPLENBQUMsQ0FBQ2tCLElBQUksQ0FBRXpDLE9BQU8sQ0FBQyxDQUFDLE9BSEpxQyxDQUFDLEVBQUUsQ0FBQUUsU0FBQSxDQUFBcEQsSUFBQSxxQ0FBQW9ELFNBQUEsQ0FBQXJDLElBQUEsT0FBQWtDLFFBQUEsR0FNL0Msb0JBQUFNLEdBQUEsRUFBQUMsR0FBQSxVQUFBUixLQUFBLENBQUF2SCxLQUFBLE9BQUFELFNBQUE7OztvQkFBQSxDQUFDLENBQUM7O2dCQUVQc0MsTUFBSSxDQUFDUCxZQUFZLENBQUNrRyxLQUFLLENBQUUsQ0FBQyxDQUFDOzs7Z0JBRzNCOUQsT0FBTyxHQUFHTSxJQUFJLENBQUNDLEdBQUcsQ0FBRSxDQUFDLEdBQUdkLE9BQU87Z0JBQ25DUixZQUFZLEdBQUcsSUFBSTtnQkFDbkJkLE1BQUksQ0FBQ1MsSUFBSSxDQUFFLFNBQVMsRUFBRVksS0FBSyxHQUFHUSxPQUFPLENBQUMsQ0FBQywwQkFBQUcsU0FBQSxDQUFBaUIsSUFBQSxPQUFBN0IsUUFBQSxHQUMxQyxvQkFBQXdFLEVBQUEsVUFBQTVFLElBQUEsQ0FBQXJELEtBQUEsT0FBQUQsU0FBQTtNQUFBLENBQUM7TUFDRixJQUFJLENBQUMrQixZQUFZLENBQUNLLGNBQWMsQ0FBRUcsZUFBZSxDQUFDO01BQ2xELE9BQU8sSUFBSTtJQUNmLENBQUMsTUFBQUwsR0FBQSxtQkFBQUMsS0FBQTs7SUFFRCxTQUFBMEMsY0FBQSxFQUE0QixLQUFic0QsR0FBRyxHQUFBbkksU0FBQSxDQUFBNkgsTUFBQSxRQUFBN0gsU0FBQSxRQUFBb0ksU0FBQSxHQUFBcEksU0FBQSxNQUFHLEtBQUs7TUFDdEIsT0FBT2YsQ0FBQyxDQUFDMkYsS0FBSyxDQUFFLElBQUksQ0FBQzdDLFlBQVksQ0FBQ3NHLFNBQVMsQ0FBQztNQUMzQ0MsTUFBTSxDQUFFLENBQUM7TUFDVHhELEdBQUcsQ0FBRSxVQUFDQyxLQUFLLEVBQUs7UUFDYixJQUFJb0QsR0FBRyxFQUFFO1VBQ0wsT0FBT3BELEtBQUssQ0FBQ3dELFFBQVEsQ0FBRSxFQUFDQyxPQUFPLEVBQUUsS0FBSyxFQUFDLENBQUM7UUFDNUM7UUFDQSxPQUFPekQsS0FBSztNQUNoQixDQUFDLENBQUM7TUFDRDVDLEtBQUssQ0FBRSxDQUFDO0lBQ2IsQ0FBQyxNQUFBRCxHQUFBLFlBQUFDLEtBQUE7O0lBRUQsU0FBQTJCLE9BQVFxRSxHQUFHLEVBQUU7TUFDVCxPQUFPLElBQUksQ0FBQ3BHLFlBQVksQ0FBQytCLE1BQU0sQ0FBRXFFLEdBQUcsQ0FBQztJQUN6QyxDQUFDLE1BQUFqRyxHQUFBLFVBQUFDLEtBQUE7O0lBRUQsU0FBQW9ELEtBQUEsRUFBUSxLQUFBa0QsTUFBQTtNQUNKLElBQUksQ0FBQzFHLFlBQVksQ0FBQ3dELElBQUksQ0FBRSxDQUFDO01BQ3pCLElBQUlyQixXQUFXLEdBQUdqRixDQUFDLENBQUN3SCxJQUFJLENBQUUsSUFBSSxDQUFDekUsT0FBTyxDQUFDO01BQ3ZDL0MsQ0FBQyxDQUFDaUgsSUFBSSxDQUFFaEMsV0FBVyxnQ0FBQXdFLEtBQUEsR0FBQW5GLGlCQUFBLGVBQUFDLG1CQUFBLENBQUFDLElBQUEsQ0FBRSxTQUFBa0YsU0FBTy9CLE9BQU8sT0FBQUMsUUFBQSxRQUFBckQsbUJBQUEsQ0FBQVksSUFBQSxVQUFBd0UsVUFBQUMsU0FBQSxxQkFBQUEsU0FBQSxDQUFBdEUsSUFBQSxHQUFBc0UsU0FBQSxDQUFBckUsSUFBQTtnQkFDM0JxQyxRQUFRLEdBQUc0QixNQUFJLENBQUN6RyxPQUFPLENBQUM0RSxPQUFPLENBQUM7Z0JBQ3BDM0gsQ0FBQyxDQUFDaUgsSUFBSSxDQUFFVyxRQUFRLEVBQUUsVUFBQ3pCLE9BQU8sRUFBSztrQkFDM0JBLE9BQU8sQ0FBQ0UsUUFBUSxDQUFDQyxJQUFJLENBQUUsQ0FBQztnQkFDNUIsQ0FBQyxDQUFDLENBQUMseUJBQUFzRCxTQUFBLENBQUF0RCxJQUFBLE9BQUFvRCxRQUFBLEdBQ04sb0JBQUFHLEdBQUEsVUFBQUosS0FBQSxDQUFBekksS0FBQSxPQUFBRCxTQUFBO01BQUEsQ0FBQztNQUNGLElBQUksQ0FBQ2dDLE9BQU8sR0FBRyxDQUFDLENBQUM7SUFDckIsQ0FBQyxZQUFBVixpQkFBQSxHQXRNMEN6QyxZQUFZLEVBQUFrSyxPQUFBLGNBQXRDekgsaUJBQWlCIn0=