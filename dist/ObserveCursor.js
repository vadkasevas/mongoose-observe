"use strict";var _interopRequireDefault3 = require("@babel/runtime/helpers/interopRequireDefault");var _interopRequireDefault2 = _interopRequireDefault3(require("@babel/runtime/helpers/interopRequireDefault"));Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = undefined;var _asyncToGenerator2 = require("@babel/runtime/helpers/asyncToGenerator");var _asyncToGenerator = (0, _interopRequireDefault2["default"])(_asyncToGenerator2)["default"];var _classCallCheck2 = require("@babel/runtime/helpers/classCallCheck");var _classCallCheck = (0, _interopRequireDefault2["default"])(_classCallCheck2)["default"];var _createClass2 = require("@babel/runtime/helpers/createClass");var _createClass = (0, _interopRequireDefault2["default"])(_createClass2)["default"];var _assertThisInitialized2 = require("@babel/runtime/helpers/assertThisInitialized");var _assertThisInitialized = (0, _interopRequireDefault2["default"])(_assertThisInitialized2)["default"];var _inherits2 = require("@babel/runtime/helpers/inherits");var _inherits = (0, _interopRequireDefault2["default"])(_inherits2)["default"];var _possibleConstructorReturn2 = require("@babel/runtime/helpers/possibleConstructorReturn");var _possibleConstructorReturn = (0, _interopRequireDefault2["default"])(_possibleConstructorReturn2)["default"];var _getPrototypeOf2 = require("@babel/runtime/helpers/getPrototypeOf");var _getPrototypeOf = (0, _interopRequireDefault2["default"])(_getPrototypeOf2)["default"];var _regenerator = require("@babel/runtime/regenerator");var _regeneratorRuntime = (0, _interopRequireDefault2["default"])(_regenerator)["default"];var _emitter = require("./emitter");var emitter = (0, _interopRequireDefault2["default"])(_emitter)["default"];
var _ejson = require("ejson");var EJSON = (0, _interopRequireDefault2["default"])(_ejson)["default"];
var _underscore = require("underscore");var _ = (0, _interopRequireDefault2["default"])(_underscore)["default"];
var _sift = require("sift");var sift = (0, _interopRequireDefault2["default"])(_sift)["default"];
var _queue = require("async/queue");var queue = (0, _interopRequireDefault2["default"])(_queue)["default"];
var _DiffSequence = require("./DiffSequence");var DiffSequence = (0, _interopRequireDefault2["default"])(_DiffSequence)["default"];
var _events = require("events");var EventEmitter = _events.EventEmitter;function _createSuper(Derived) {var hasNativeReflectConstruct = _isNativeReflectConstruct();return function _createSuperInternal() {var Super = _getPrototypeOf(Derived),result;if (hasNativeReflectConstruct) {var NewTarget = _getPrototypeOf(this).constructor;result = Reflect.construct(Super, arguments, NewTarget);} else {result = Super.apply(this, arguments);}return _possibleConstructorReturn(this, result);};}function _isNativeReflectConstruct() {if (typeof Reflect === "undefined" || !Reflect.construct) return false;if (Reflect.construct.sham) return false;if (typeof Proxy === "function") return true;try {Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));return true;} catch (e) {return false;}}

function delayedPromise(timeout) {
  if (timeout <= 0)
  return Promise.resolve();
  return new Promise(function (resolve) {
    setTimeout(resolve, timeout);
  });
}var


ObserveCursor = /*#__PURE__*/function (_EventEmitter) {_inherits(ObserveCursor, _EventEmitter);var _super = _createSuper(ObserveCursor);
  function ObserveCursor(query) {var _this;var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};_classCallCheck(this, ObserveCursor);
    _this = _super.call(this);
    _this.setMaxListeners(0);
    _this.query = query;
    _this.handlers = null;
    _this.modelsMap = {};
    _this.lastRefreshed = 0;
    _this.stopped = false;
    _this.wasRefreshed = false;
    _this.paused = false;

    _this.once('refresh', function () {
      _this.wasRefreshed = true;
    });

    _this.queue = queue( /*#__PURE__*/function () {var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(task, callback) {var delay, started;return _regeneratorRuntime.wrap(function _callee$(_context) {while (1) switch (_context.prev = _context.next) {case 0:
              _this.queryStarted = false;
              delay = task.refreshDate - Date.now();if (!(
              delay > 0)) {_context.next = 5;break;}_context.next = 5;return (
                new Promise(function (resolve) {
                  setTimeout(function () {
                    resolve();
                  }, delay);
                }));case 5:if (!

              _this.paused) {_context.next = 8;break;}_context.next = 8;return (
                new Promise(function (resolve) {
                  _this.once('awake', resolve);
                }));case 8:if (!

              _this.stopped) {_context.next = 10;break;}return _context.abrupt("return",
              callback(new Error('Stopped')));case 10:

              _this.queryStarted = true;
              started = Date.now();
              _this.query.exec(function (err, results) {
                _this.queryStarted = false;
                _this.lastRefreshed = Date.now();
                //console.log('refresh query exec end');
                if (err)
                return callback(); //TODO error handle
                /**@type object*/
                var newAssoc = _.indexBy(results, 'id');

                if (_this.handlers.removed) {
                  var removedIds = _.difference(_.keys(_this.modelsMap), _.keys(newAssoc));
                  _.each(removedIds, function (_id) {
                    _this.handlers.removed.apply(_assertThisInitialized(_this), [_id, _this.modelsMap[_id]]);
                    _this.emit('removed', _id, _this.modelsMap[_id]);
                  });
                }
                _.chain(newAssoc).
                each(function (result) {
                  var model = newAssoc[result.id];
                  var oldModel = _this.modelsMap[result.id];
                  if (!oldModel && _this.handlers.added) {
                    _this.handlers.added.apply(_assertThisInitialized(_this), [result.id, model]);
                    _this.emit('added', result.id, model);
                  }
                  if (oldModel && _this.handlers.changed) {
                    var oldRaw = oldModel.toObject({ getters: false });
                    var newRaw = model.toObject({ getters: false });
                    if (!EJSON.equals(oldRaw, newRaw)) {
                      var changedFields = DiffSequence.makeChangedFields(newRaw, oldRaw);
                      if (!_.isEmpty(changedFields)) {
                        _this.handlers.changed.apply(_assertThisInitialized(_this), [result.id, changedFields, result, oldModel]);
                        _this.emit('changed', result.id, changedFields, result, oldModel);
                      }
                    }
                  }
                });

                _this.modelsMap = newAssoc;
                _this.emit('refresh', Date.now() - started);
                callback();
              });case 13:case "end":return _context.stop();}}, _callee);}));return function (_x, _x2) {return _ref.apply(this, arguments);};}(),
    1);
    _this.options = options;
    _this.pollingIntervalMs = _.isNumber(options.pollingIntervalMs) ? options.pollingIntervalMs : 60000;
    _this.pollingThrottleMs = _.isNumber(options.pollingThrottleMs) ? options.pollingThrottleMs : 1000;return _this;
  }_createClass(ObserveCursor, [{ key: "scheduleRefresh", value:

    function scheduleRefresh(task) {var _this2 = this;
      //console.log('sheduleRefresh length:',this.queue.length(),'running:',this.queue.running());
      if (this.queue.length() > 0)
      return Promise.resolve(false);
      if (this.queue.running() > 0 && !this.queryStarted)
      return Promise.resolve(false);

      var pollingThrottleMs = this.pollingThrottleMs;
      if (_.isFunction(pollingThrottleMs)) {
        pollingThrottleMs = pollingThrottleMs.apply(this, []);
        if (!_.isNumber(pollingThrottleMs)) {
          pollingThrottleMs = 1000;
        }
      }
      var delay = this.lastRefreshed ? pollingThrottleMs - (Date.now() - this.lastRefreshed) : 0;
      //console.log({delay});
      var refreshDate = new Date();
      if (delay > 0) {
        refreshDate = new Date(Date.now() + delay);
      }

      return new Promise(function (resolve) {
        _this2.queue.push({ refreshDate: refreshDate }, function () {
          resolve();
        });
      });
    }

    /**@param {object} handlers
     * @param {function(id:String, doc:mongoose.Document)} handlers.added
     * @param {function(id:string, changedFields:object,newDoc:mongoose.Document,oldDoc: mongoose.Document)} handlers.changed
     * @param {function(id:String, removedDoc:mongoose.Document)} handlers.removed
     * */ }, { key: "observeChanges", value:
    function observeChanges(handlers) {var _this3 = this;
      this.handlers = handlers;
      var rawConditions = EJSON.clone(this.query._conditions);
      var siftQuery = sift(rawConditions);

      var listener = function listener(doc) {
        if (doc.type == 'save' && _this3.handlers.added) {
          var mongooseModel = _.first(doc.arguments);
          if (mongooseModel) {
            var rawModel = EJSON.clone(mongooseModel);
            if (siftQuery(rawModel)) {
              return _this3.scheduleRefresh(rawModel);
            }
          }
          return;
        }
        if (doc.type == 'remove' && _this3.handlers.removed) {
          var finded = false;
          var _siftQuery = sift(EJSON.clone(_.first(doc.arguments)));
          _.each(_this3.modelsMap, function (rawModel) {
            if (!finded && _siftQuery(rawModel)) {
              finded = true;
              return _this3.scheduleRefresh(rawModel);
            }
          });
          return;
        }

        if (doc.type == 'update') {
          return _this3.scheduleRefresh();
        }
      };
      emitter.on(this.query.mongooseCollection.name, listener);
      this.once('stop', function () {
        emitter.removeListener(_this3.query.mongooseCollection.name, listener);
      });
      this.scheduleRefresh();
      this.doPolling();
      return this;
    } }, { key: "doPolling", value:

    function doPolling() {var _this4 = this;
      var pollingQueue = new queue( /*#__PURE__*/function () {var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(task, callback) {var pollingIntervalMs, timeout;return _regeneratorRuntime.wrap(function _callee2$(_context2) {while (1) switch (_context2.prev = _context2.next) {case 0:if (
                _this4.lastRefreshed) {_context2.next = 4;break;}_context2.next = 3;return (
                  delayedPromise(100));case 3:return _context2.abrupt("return",
                callback());case 4:

                pollingIntervalMs = _.isFunction(_this4.pollingIntervalMs) ? _this4.pollingIntervalMs.apply(_this4) : _this4.pollingIntervalMs;
                if (!_.isNumber(pollingIntervalMs)) {
                  pollingIntervalMs = 60000;
                }
                timeout = pollingIntervalMs - (Date.now() - _this4.lastRefreshed);if (!(
                timeout > 0)) {_context2.next = 10;break;}_context2.next = 10;return (
                  delayedPromise(timeout));case 10:if (

                _this4.stopped) {_context2.next = 13;break;}_context2.next = 13;return (
                  _this4.scheduleRefresh());case 13:

                callback();case 14:case "end":return _context2.stop();}}, _callee2);}));return function (_x3, _x4) {return _ref2.apply(this, arguments);};}(),
      1);

      pollingQueue.push(null);

      pollingQueue.drain(function () {
        if (!_this4.stopped) {
          setTimeout(function () {
            pollingQueue.push(null);
          }, 0);
        }
      });
    } }, { key: "currentModels", value:

    function currentModels() {var raw = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      return _.chain(this.modelsMap).
      values().
      map(function (model) {
        if (raw) {
          return model.toObject({ getters: false });
        }
        return model;
      }).
      value();
    } }, { key: "models", value:

    function models() {var _this5 = this;var raw = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      return new Promise(function (resolve) {
        var onReady = function onReady() {
          resolve(
            _this5.currentModels(raw)
          );
        };
        if (_this5.wasRefreshed)
        return onReady();else
        {
          _this5.once('refresh', onReady);
        }
      });
    } }, { key: "stop", value:

    function stop() {
      this.stopped = true;
      this.emit('stop');
    } }, { key: "pause", value:

    function pause() {
      this.paused = true;
      this.emit('paused');
    } }, { key: "awake", value:

    function awake() {
      if (this.paused) {
        this.paused = false;
        this.emit('awake');
      }
    } }]);return ObserveCursor;}(EventEmitter);exports["default"] = ObserveCursor;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfZW1pdHRlciIsInJlcXVpcmUiLCJlbWl0dGVyIiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdDIiLCJfZWpzb24iLCJFSlNPTiIsIl91bmRlcnNjb3JlIiwiXyIsIl9zaWZ0Iiwic2lmdCIsIl9xdWV1ZSIsInF1ZXVlIiwiX0RpZmZTZXF1ZW5jZSIsIkRpZmZTZXF1ZW5jZSIsIl9ldmVudHMiLCJFdmVudEVtaXR0ZXIiLCJfY3JlYXRlU3VwZXIiLCJEZXJpdmVkIiwiaGFzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCIsIl9pc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QiLCJfY3JlYXRlU3VwZXJJbnRlcm5hbCIsIlN1cGVyIiwiX2dldFByb3RvdHlwZU9mIiwicmVzdWx0IiwiTmV3VGFyZ2V0IiwiY29uc3RydWN0b3IiLCJSZWZsZWN0IiwiY29uc3RydWN0IiwiYXJndW1lbnRzIiwiYXBwbHkiLCJfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybiIsInNoYW0iLCJQcm94eSIsIkJvb2xlYW4iLCJwcm90b3R5cGUiLCJ2YWx1ZU9mIiwiY2FsbCIsImUiLCJkZWxheWVkUHJvbWlzZSIsInRpbWVvdXQiLCJQcm9taXNlIiwicmVzb2x2ZSIsInNldFRpbWVvdXQiLCJPYnNlcnZlQ3Vyc29yIiwiX0V2ZW50RW1pdHRlciIsIl9pbmhlcml0cyIsIl9zdXBlciIsInF1ZXJ5IiwiX3RoaXMiLCJvcHRpb25zIiwibGVuZ3RoIiwidW5kZWZpbmVkIiwiX2NsYXNzQ2FsbENoZWNrIiwic2V0TWF4TGlzdGVuZXJzIiwiaGFuZGxlcnMiLCJtb2RlbHNNYXAiLCJsYXN0UmVmcmVzaGVkIiwic3RvcHBlZCIsIndhc1JlZnJlc2hlZCIsInBhdXNlZCIsIm9uY2UiLCJfcmVmIiwiX2FzeW5jVG9HZW5lcmF0b3IiLCJfcmVnZW5lcmF0b3JSdW50aW1lIiwibWFyayIsIl9jYWxsZWUiLCJ0YXNrIiwiY2FsbGJhY2siLCJkZWxheSIsInN0YXJ0ZWQiLCJ3cmFwIiwiX2NhbGxlZSQiLCJfY29udGV4dCIsInByZXYiLCJuZXh0IiwicXVlcnlTdGFydGVkIiwicmVmcmVzaERhdGUiLCJEYXRlIiwibm93IiwiYWJydXB0IiwiRXJyb3IiLCJleGVjIiwiZXJyIiwicmVzdWx0cyIsIm5ld0Fzc29jIiwiaW5kZXhCeSIsInJlbW92ZWQiLCJyZW1vdmVkSWRzIiwiZGlmZmVyZW5jZSIsImtleXMiLCJlYWNoIiwiX2lkIiwiX2Fzc2VydFRoaXNJbml0aWFsaXplZCIsImVtaXQiLCJjaGFpbiIsIm1vZGVsIiwiaWQiLCJvbGRNb2RlbCIsImFkZGVkIiwiY2hhbmdlZCIsIm9sZFJhdyIsInRvT2JqZWN0IiwiZ2V0dGVycyIsIm5ld1JhdyIsImVxdWFscyIsImNoYW5nZWRGaWVsZHMiLCJtYWtlQ2hhbmdlZEZpZWxkcyIsImlzRW1wdHkiLCJzdG9wIiwiX3giLCJfeDIiLCJwb2xsaW5nSW50ZXJ2YWxNcyIsImlzTnVtYmVyIiwicG9sbGluZ1Rocm90dGxlTXMiLCJfY3JlYXRlQ2xhc3MiLCJrZXkiLCJ2YWx1ZSIsInNjaGVkdWxlUmVmcmVzaCIsIl90aGlzMiIsInJ1bm5pbmciLCJpc0Z1bmN0aW9uIiwicHVzaCIsIm9ic2VydmVDaGFuZ2VzIiwiX3RoaXMzIiwicmF3Q29uZGl0aW9ucyIsImNsb25lIiwiX2NvbmRpdGlvbnMiLCJzaWZ0UXVlcnkiLCJsaXN0ZW5lciIsImRvYyIsInR5cGUiLCJtb25nb29zZU1vZGVsIiwiZmlyc3QiLCJyYXdNb2RlbCIsImZpbmRlZCIsIm9uIiwibW9uZ29vc2VDb2xsZWN0aW9uIiwibmFtZSIsInJlbW92ZUxpc3RlbmVyIiwiZG9Qb2xsaW5nIiwiX3RoaXM0IiwicG9sbGluZ1F1ZXVlIiwiX3JlZjIiLCJfY2FsbGVlMiIsIl9jYWxsZWUyJCIsIl9jb250ZXh0MiIsIl94MyIsIl94NCIsImRyYWluIiwiY3VycmVudE1vZGVscyIsInJhdyIsInZhbHVlcyIsIm1hcCIsIm1vZGVscyIsIl90aGlzNSIsIm9uUmVhZHkiLCJwYXVzZSIsImF3YWtlIiwiZXhwb3J0cyJdLCJzb3VyY2VzIjpbIi4uL3NyYy9PYnNlcnZlQ3Vyc29yLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBlbWl0dGVyIGZyb20gXCIuL2VtaXR0ZXJcIjtcbmltcG9ydCBFSlNPTiBmcm9tICdlanNvbic7XG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmltcG9ydCBzaWZ0IGZyb20gJ3NpZnQnO1xuaW1wb3J0IHF1ZXVlIGZyb20gJ2FzeW5jL3F1ZXVlJztcbmltcG9ydCBEaWZmU2VxdWVuY2UgZnJvbSBcIi4vRGlmZlNlcXVlbmNlXCI7XG5pbXBvcnQge0V2ZW50RW1pdHRlcn0gZnJvbSAnZXZlbnRzJztcblxuZnVuY3Rpb24gZGVsYXllZFByb21pc2UodGltZW91dCl7XG4gICAgaWYodGltZW91dDw9MClcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSk9PntcbiAgICAgICAgc2V0VGltZW91dChyZXNvbHZlLHRpbWVvdXQpO1xuICAgIH0pO1xufVxuXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE9ic2VydmVDdXJzb3IgZXh0ZW5kcyBFdmVudEVtaXR0ZXJ7XG4gICAgY29uc3RydWN0b3IocXVlcnksb3B0aW9ucz17fSl7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuc2V0TWF4TGlzdGVuZXJzKDApO1xuICAgICAgICB0aGlzLnF1ZXJ5ID0gcXVlcnk7XG4gICAgICAgIHRoaXMuaGFuZGxlcnMgPSBudWxsO1xuICAgICAgICB0aGlzLm1vZGVsc01hcCA9IHt9O1xuICAgICAgICB0aGlzLmxhc3RSZWZyZXNoZWQgPSAwO1xuICAgICAgICB0aGlzLnN0b3BwZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy53YXNSZWZyZXNoZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5wYXVzZWQgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLm9uY2UoJ3JlZnJlc2gnLCgpPT57XG4gICAgICAgICAgICB0aGlzLndhc1JlZnJlc2hlZCA9IHRydWU7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMucXVldWUgPSBxdWV1ZShhc3luYyAodGFzaywgY2FsbGJhY2spPT4ge1xuICAgICAgICAgICAgdGhpcy5xdWVyeVN0YXJ0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIGxldCBkZWxheSA9IHRhc2sucmVmcmVzaERhdGUtRGF0ZS5ub3coKSA7XG4gICAgICAgICAgICBpZihkZWxheT4wKXtcbiAgICAgICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSk9PntcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9LGRlbGF5KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKHRoaXMucGF1c2VkKXtcbiAgICAgICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSk9PntcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbmNlKCdhd2FrZScscmVzb2x2ZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZih0aGlzLnN0b3BwZWQpe1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhuZXcgRXJyb3IoJ1N0b3BwZWQnKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnF1ZXJ5U3RhcnRlZCA9IHRydWU7XG4gICAgICAgICAgICBsZXQgc3RhcnRlZCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICB0aGlzLnF1ZXJ5LmV4ZWMoKGVycixyZXN1bHRzKT0+e1xuICAgICAgICAgICAgICAgIHRoaXMucXVlcnlTdGFydGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdGhpcy5sYXN0UmVmcmVzaGVkID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdyZWZyZXNoIHF1ZXJ5IGV4ZWMgZW5kJyk7XG4gICAgICAgICAgICAgICAgaWYoZXJyKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soKTsvL1RPRE8gZXJyb3IgaGFuZGxlXG4gICAgICAgICAgICAgICAgLyoqQHR5cGUgb2JqZWN0Ki9cbiAgICAgICAgICAgICAgICBsZXQgbmV3QXNzb2MgPSBfLmluZGV4QnkocmVzdWx0cywnaWQnKTtcblxuICAgICAgICAgICAgICAgIGlmKHRoaXMuaGFuZGxlcnMucmVtb3ZlZCkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgcmVtb3ZlZElkcyA9IF8uZGlmZmVyZW5jZSggXy5rZXlzKHRoaXMubW9kZWxzTWFwKSwgXy5rZXlzKG5ld0Fzc29jKSApO1xuICAgICAgICAgICAgICAgICAgICBfLmVhY2gocmVtb3ZlZElkcywoX2lkKT0+e1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVycy5yZW1vdmVkLmFwcGx5KHRoaXMsIFtfaWQsdGhpcy5tb2RlbHNNYXBbX2lkXV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdyZW1vdmVkJyxfaWQsdGhpcy5tb2RlbHNNYXBbX2lkXSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBfLmNoYWluKG5ld0Fzc29jKVxuICAgICAgICAgICAgICAgIC5lYWNoKChyZXN1bHQpPT57XG4gICAgICAgICAgICAgICAgICAgIGxldCBtb2RlbCA9ICBuZXdBc3NvY1tyZXN1bHQuaWRdO1xuICAgICAgICAgICAgICAgICAgICBsZXQgb2xkTW9kZWwgPSB0aGlzLm1vZGVsc01hcFtyZXN1bHQuaWRdO1xuICAgICAgICAgICAgICAgICAgICBpZighb2xkTW9kZWwmJnRoaXMuaGFuZGxlcnMuYWRkZWQpe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVycy5hZGRlZC5hcHBseSh0aGlzLCBbcmVzdWx0LmlkLG1vZGVsXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ2FkZGVkJyxyZXN1bHQuaWQsbW9kZWwpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmKG9sZE1vZGVsJiZ0aGlzLmhhbmRsZXJzLmNoYW5nZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBvbGRSYXcgPSBvbGRNb2RlbC50b09iamVjdCh7IGdldHRlcnM6IGZhbHNlIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG5ld1JhdyA9IG1vZGVsLnRvT2JqZWN0KHsgZ2V0dGVyczogZmFsc2UgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoICFFSlNPTi5lcXVhbHMgKG9sZFJhdywgbmV3UmF3KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBjaGFuZ2VkRmllbGRzID0gRGlmZlNlcXVlbmNlLm1ha2VDaGFuZ2VkRmllbGRzIChuZXdSYXcsIG9sZFJhdyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFfLmlzRW1wdHkgKGNoYW5nZWRGaWVsZHMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlcnMuY2hhbmdlZC5hcHBseSAodGhpcywgW3Jlc3VsdC5pZCwgY2hhbmdlZEZpZWxkcywgcmVzdWx0LCBvbGRNb2RlbF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ2NoYW5nZWQnLHJlc3VsdC5pZCwgY2hhbmdlZEZpZWxkcywgcmVzdWx0LCBvbGRNb2RlbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLm1vZGVsc01hcCA9IG5ld0Fzc29jO1xuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgncmVmcmVzaCcsRGF0ZS5ub3coKS1zdGFydGVkKTtcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIDEgKTtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICAgICAgdGhpcy5wb2xsaW5nSW50ZXJ2YWxNcyA9IF8uaXNOdW1iZXIob3B0aW9ucy5wb2xsaW5nSW50ZXJ2YWxNcyk/IG9wdGlvbnMucG9sbGluZ0ludGVydmFsTXMgOiA2MDAwMDtcbiAgICAgICAgdGhpcy5wb2xsaW5nVGhyb3R0bGVNcyA9IF8uaXNOdW1iZXIob3B0aW9ucy5wb2xsaW5nVGhyb3R0bGVNcyk/IG9wdGlvbnMucG9sbGluZ1Rocm90dGxlTXMgOiAxMDAwO1xuICAgIH1cblxuICAgIHNjaGVkdWxlUmVmcmVzaCh0YXNrKXtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnc2hlZHVsZVJlZnJlc2ggbGVuZ3RoOicsdGhpcy5xdWV1ZS5sZW5ndGgoKSwncnVubmluZzonLHRoaXMucXVldWUucnVubmluZygpKTtcbiAgICAgICAgaWYodGhpcy5xdWV1ZS5sZW5ndGgoKT4wKVxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShmYWxzZSk7XG4gICAgICAgIGlmKHRoaXMucXVldWUucnVubmluZygpPjAgJiYgIXRoaXMucXVlcnlTdGFydGVkKVxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShmYWxzZSk7XG5cbiAgICAgICAgbGV0IHBvbGxpbmdUaHJvdHRsZU1zID0gdGhpcy5wb2xsaW5nVGhyb3R0bGVNcztcbiAgICAgICAgaWYoXy5pc0Z1bmN0aW9uKHBvbGxpbmdUaHJvdHRsZU1zKSl7XG4gICAgICAgICAgICBwb2xsaW5nVGhyb3R0bGVNcyA9IHBvbGxpbmdUaHJvdHRsZU1zLmFwcGx5KHRoaXMsW10pO1xuICAgICAgICAgICAgaWYoIV8uaXNOdW1iZXIocG9sbGluZ1Rocm90dGxlTXMpKXtcbiAgICAgICAgICAgICAgICBwb2xsaW5nVGhyb3R0bGVNcyA9IDEwMDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGRlbGF5ID0gdGhpcy5sYXN0UmVmcmVzaGVkID8gcG9sbGluZ1Rocm90dGxlTXMgLSAoIERhdGUubm93KCkgLSB0aGlzLmxhc3RSZWZyZXNoZWQgKSA6IDA7XG4gICAgICAgIC8vY29uc29sZS5sb2coe2RlbGF5fSk7XG4gICAgICAgIGxldCByZWZyZXNoRGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgICAgIGlmKGRlbGF5PjApe1xuICAgICAgICAgICAgcmVmcmVzaERhdGUgPSBuZXcgRGF0ZShEYXRlLm5vdygpK2RlbGF5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSk9PntcbiAgICAgICAgICAgIHRoaXMucXVldWUucHVzaCh7cmVmcmVzaERhdGU6cmVmcmVzaERhdGV9LCgpPT57XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKkBwYXJhbSB7b2JqZWN0fSBoYW5kbGVyc1xuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oaWQ6U3RyaW5nLCBkb2M6bW9uZ29vc2UuRG9jdW1lbnQpfSBoYW5kbGVycy5hZGRlZFxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oaWQ6c3RyaW5nLCBjaGFuZ2VkRmllbGRzOm9iamVjdCxuZXdEb2M6bW9uZ29vc2UuRG9jdW1lbnQsb2xkRG9jOiBtb25nb29zZS5Eb2N1bWVudCl9IGhhbmRsZXJzLmNoYW5nZWRcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKGlkOlN0cmluZywgcmVtb3ZlZERvYzptb25nb29zZS5Eb2N1bWVudCl9IGhhbmRsZXJzLnJlbW92ZWRcbiAgICAgKiAqL1xuICAgIG9ic2VydmVDaGFuZ2VzKGhhbmRsZXJzKXtcbiAgICAgICAgdGhpcy5oYW5kbGVycyA9IGhhbmRsZXJzO1xuICAgICAgICBjb25zdCByYXdDb25kaXRpb25zID0gRUpTT04uY2xvbmUodGhpcy5xdWVyeS5fY29uZGl0aW9ucyk7XG4gICAgICAgIGNvbnN0IHNpZnRRdWVyeSA9IHNpZnQocmF3Q29uZGl0aW9ucyk7XG5cbiAgICAgICAgbGV0IGxpc3RlbmVyID0gKGRvYyk9PntcbiAgICAgICAgICAgIGlmKGRvYy50eXBlPT0nc2F2ZScmJnRoaXMuaGFuZGxlcnMuYWRkZWQpe1xuICAgICAgICAgICAgICAgIGxldCBtb25nb29zZU1vZGVsID0gXy5maXJzdCggZG9jLmFyZ3VtZW50cyApO1xuICAgICAgICAgICAgICAgIGlmKG1vbmdvb3NlTW9kZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJhd01vZGVsID0gRUpTT04uY2xvbmUobW9uZ29vc2VNb2RlbCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzaWZ0UXVlcnkocmF3TW9kZWwpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zY2hlZHVsZVJlZnJlc2gocmF3TW9kZWwpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGRvYy50eXBlPT0ncmVtb3ZlJyYmdGhpcy5oYW5kbGVycy5yZW1vdmVkKXtcbiAgICAgICAgICAgICAgICBsZXQgZmluZGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgbGV0IHNpZnRRdWVyeSA9IHNpZnQoIEVKU09OLmNsb25lKF8uZmlyc3QoIGRvYy5hcmd1bWVudHMgKSApICk7XG4gICAgICAgICAgICAgICAgXy5lYWNoKHRoaXMubW9kZWxzTWFwLChyYXdNb2RlbCk9PntcbiAgICAgICAgICAgICAgICAgICAgaWYoIWZpbmRlZCAmJiBzaWZ0UXVlcnkocmF3TW9kZWwpKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbmRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zY2hlZHVsZVJlZnJlc2gocmF3TW9kZWwpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZihkb2MudHlwZT09J3VwZGF0ZScpe1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNjaGVkdWxlUmVmcmVzaCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBlbWl0dGVyLm9uKHRoaXMucXVlcnkubW9uZ29vc2VDb2xsZWN0aW9uLm5hbWUsbGlzdGVuZXIpO1xuICAgICAgICB0aGlzLm9uY2UoJ3N0b3AnLCgpPT57XG4gICAgICAgICAgICBlbWl0dGVyLnJlbW92ZUxpc3RlbmVyKHRoaXMucXVlcnkubW9uZ29vc2VDb2xsZWN0aW9uLm5hbWUsbGlzdGVuZXIpXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnNjaGVkdWxlUmVmcmVzaCgpO1xuICAgICAgICB0aGlzLmRvUG9sbGluZygpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBkb1BvbGxpbmcoKXtcbiAgICAgICAgbGV0IHBvbGxpbmdRdWV1ZSA9IG5ldyBxdWV1ZShhc3luYyAodGFzayxjYWxsYmFjayk9PntcbiAgICAgICAgICAgIGlmKCF0aGlzLmxhc3RSZWZyZXNoZWQpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBkZWxheWVkUHJvbWlzZSgxMDApO1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayAoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBwb2xsaW5nSW50ZXJ2YWxNcyA9IF8uaXNGdW5jdGlvbih0aGlzLnBvbGxpbmdJbnRlcnZhbE1zKT90aGlzLnBvbGxpbmdJbnRlcnZhbE1zLmFwcGx5KHRoaXMpOnRoaXMucG9sbGluZ0ludGVydmFsTXM7XG4gICAgICAgICAgICBpZighXy5pc051bWJlcihwb2xsaW5nSW50ZXJ2YWxNcykpe1xuICAgICAgICAgICAgICAgIHBvbGxpbmdJbnRlcnZhbE1zID0gNjAwMDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgdGltZW91dCA9IHBvbGxpbmdJbnRlcnZhbE1zIC0gKCBEYXRlLm5vdygpIC0gdGhpcy5sYXN0UmVmcmVzaGVkICk7XG4gICAgICAgICAgICBpZih0aW1lb3V0PjApe1xuICAgICAgICAgICAgICAgIGF3YWl0IGRlbGF5ZWRQcm9taXNlKHRpbWVvdXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoIXRoaXMuc3RvcHBlZCkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2NoZWR1bGVSZWZyZXNoKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9LDEpO1xuXG4gICAgICAgIHBvbGxpbmdRdWV1ZS5wdXNoKG51bGwpO1xuXG4gICAgICAgIHBvbGxpbmdRdWV1ZS5kcmFpbigoKT0+e1xuICAgICAgICAgICAgaWYoIXRoaXMuc3RvcHBlZCkge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCk9PntcbiAgICAgICAgICAgICAgICAgICAgcG9sbGluZ1F1ZXVlLnB1c2gobnVsbCk7XG4gICAgICAgICAgICAgICAgfSwwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgY3VycmVudE1vZGVscyhyYXc9ZmFsc2Upe1xuICAgICAgICByZXR1cm4gXy5jaGFpbih0aGlzLm1vZGVsc01hcClcbiAgICAgICAgLnZhbHVlcygpXG4gICAgICAgIC5tYXAoKG1vZGVsKT0+e1xuICAgICAgICAgICAgaWYocmF3KXtcbiAgICAgICAgICAgICAgICByZXR1cm4gbW9kZWwudG9PYmplY3QoeyBnZXR0ZXJzOiBmYWxzZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBtb2RlbDtcbiAgICAgICAgfSlcbiAgICAgICAgLnZhbHVlKClcbiAgICB9XG5cbiAgICBtb2RlbHMocmF3PWZhbHNlKXtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKT0+e1xuICAgICAgICAgICAgbGV0IG9uUmVhZHkgPSAoKT0+e1xuICAgICAgICAgICAgICAgIHJlc29sdmUoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudE1vZGVscyhyYXcpXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKHRoaXMud2FzUmVmcmVzaGVkKVxuICAgICAgICAgICAgICAgIHJldHVybiBvblJlYWR5KCk7XG4gICAgICAgICAgICBlbHNle1xuICAgICAgICAgICAgICAgIHRoaXMub25jZSgncmVmcmVzaCcsb25SZWFkeSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHN0b3AoKXtcbiAgICAgICAgdGhpcy5zdG9wcGVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5lbWl0KCdzdG9wJyk7XG4gICAgfVxuXG4gICAgcGF1c2UoKXtcbiAgICAgICAgdGhpcy5wYXVzZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLmVtaXQoJ3BhdXNlZCcpO1xuICAgIH1cblxuICAgIGF3YWtlKCl7XG4gICAgICAgIGlmKHRoaXMucGF1c2VkKXtcbiAgICAgICAgICAgIHRoaXMucGF1c2VkPWZhbHNlO1xuICAgICAgICAgICAgdGhpcy5lbWl0KCdhd2FrZScpO1xuICAgICAgICB9XG4gICAgfVxuXG59Il0sIm1hcHBpbmdzIjoib21EQUFBLElBQUFBLFFBQUEsR0FBQUMsT0FBQSxjQUFnQyxJQUF6QkMsT0FBTyxPQUFBQyx1QkFBQSxhQUFBSCxRQUFBO0FBQ2QsSUFBQUksTUFBQSxHQUFBSCxPQUFBLFVBQTBCLElBQW5CSSxLQUFLLE9BQUFGLHVCQUFBLGFBQUFDLE1BQUE7QUFDWixJQUFBRSxXQUFBLEdBQUFMLE9BQUEsZUFBMkIsSUFB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