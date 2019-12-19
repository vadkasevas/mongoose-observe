"use strict";var _interopRequireDefault3 = require("@babel/runtime/helpers/interopRequireDefault");var _interopRequireDefault2 = _interopRequireDefault3(require("@babel/runtime/helpers/interopRequireDefault"));Object.defineProperty(exports, "__esModule", { value: true });var _regenerator = require("@babel/runtime/regenerator");var _regeneratorRuntime = (0, _interopRequireDefault2["default"])(_regenerator)["default"];var _asyncToGenerator2 = require("@babel/runtime/helpers/asyncToGenerator");var _asyncToGenerator = (0, _interopRequireDefault2["default"])(_asyncToGenerator2)["default"];var _classCallCheck2 = require("@babel/runtime/helpers/classCallCheck");var _classCallCheck = (0, _interopRequireDefault2["default"])(_classCallCheck2)["default"];var _createClass2 = require("@babel/runtime/helpers/createClass");var _createClass = (0, _interopRequireDefault2["default"])(_createClass2)["default"];var _possibleConstructorReturn2 = require("@babel/runtime/helpers/possibleConstructorReturn");var _possibleConstructorReturn = (0, _interopRequireDefault2["default"])(_possibleConstructorReturn2)["default"];var _getPrototypeOf2 = require("@babel/runtime/helpers/getPrototypeOf");var _getPrototypeOf = (0, _interopRequireDefault2["default"])(_getPrototypeOf2)["default"];var _assertThisInitialized2 = require("@babel/runtime/helpers/assertThisInitialized");var _assertThisInitialized = (0, _interopRequireDefault2["default"])(_assertThisInitialized2)["default"];var _inherits2 = require("@babel/runtime/helpers/inherits");var _inherits = (0, _interopRequireDefault2["default"])(_inherits2)["default"];var _emitter = require("./emitter");var emitter = (0, _interopRequireDefault2["default"])(_emitter)["default"];
var _ejson = require("ejson");var EJSON = (0, _interopRequireDefault2["default"])(_ejson)["default"];
var _underscore = require("underscore");var _ = (0, _interopRequireDefault2["default"])(_underscore)["default"];
var _sift = require("sift");var sift = (0, _interopRequireDefault2["default"])(_sift)["default"];
var _queue = require("async/queue");var queue = (0, _interopRequireDefault2["default"])(_queue)["default"];
var _DiffSequence = require("./DiffSequence");var DiffSequence = (0, _interopRequireDefault2["default"])(_DiffSequence)["default"];
var _events = require("events");var EventEmitter = _events.EventEmitter;

function delayedPromise(timeout) {
  if (timeout <= 0)
  return Promise.resolve();
  return new Promise(function (resolve) {
    setTimeout(resolve, timeout);
  });
}var

ObserveCursor = /*#__PURE__*/function (_EventEmitter) {_inherits(ObserveCursor, _EventEmitter);
  function ObserveCursor(query) {var _this;var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};_classCallCheck(this, ObserveCursor);
    _this = _possibleConstructorReturn(this, _getPrototypeOf(ObserveCursor).call(this));
    _this.setMaxListeners(0);
    _this.query = query;
    _this.handlers = null;
    _this.modelsMap = {};
    _this.lastRefreshed = 0;
    _this.stopped = false;
    _this.wasRefreshed = false;
    _this.once('refresh', function () {
      _this.wasRefreshed = true;
    });

    _this.queue = queue( /*#__PURE__*/function () {var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(task, callback) {var delay, started;return _regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:
                _this.queryStarted = false;
                delay = task.refreshDate - Date.now();if (!(
                delay > 0)) {_context.next = 5;break;}_context.next = 5;return (
                  new Promise(function (resolve) {
                    setTimeout(function () {
                      resolve();
                    }, delay);
                  }));case 5:


                _this.queryStarted = true;
                started = Date.now();
                _this.query.exec(function (err, results) {
                  _this.queryStarted = false;
                  _this.lastRefreshed = Date.now();
                  console.log('refresh query exec end');
                  if (err)
                  return callback(); //TODO error handle
                  var newAssoc = _.chain(results).
                  indexBy('id').
                  mapObject(function (doc, id) {
                    var rawDoc = doc.toObject({ getters: false });
                    rawDoc._id = id;
                    return rawDoc;
                  }).
                  value();

                  if (_this.handlers.removed) {
                    var removedIds = _.difference(_.keys(_this.modelsMap), _.keys(newAssoc));
                    _.each(removedIds, function (_id) {
                      _this.handlers.removed.apply(_assertThisInitialized(_this), [_id, _this.modelsMap[_id]]);
                    });
                  }

                  _.chain(newAssoc).
                  each(function (result) {
                    var rawResult = newAssoc[String(result._id)];
                    var _id = _.isString(result._id) ? result._id : String(result._id);
                    newAssoc[_id] = rawResult;
                    var oldModel = _this.modelsMap[_id];
                    if (!oldModel && _this.handlers.added) {
                      _this.handlers.added.apply(_assertThisInitialized(_this), [result._id, result]);
                    }
                    if (oldModel && _this.handlers.changed && !EJSON.equals(oldModel, rawResult)) {
                      var changedFields = DiffSequence.makeChangedFields(rawResult, oldModel);
                      if (!_.isEmpty(changedFields)) {
                        _this.handlers.changed.apply(_assertThisInitialized(_this), [result._id, changedFields, result]);
                      }
                    }
                  });

                  _this.modelsMap = newAssoc;
                  _this.emit('refresh', Date.now() - started);
                  callback();
                });case 8:case "end":return _context.stop();}}}, _callee);}));return function (_x, _x2) {return _ref.apply(this, arguments);};}(),


    1);

    _this.pollingIntervalMs = options.pollingIntervalMs || 60000;
    _this.pollingThrottleMs = options.pollingThrottleMs || 1000;return _this;
  }_createClass(ObserveCursor, [{ key: "scheduleRefresh", value: function scheduleRefresh(

    task) {var _this2 = this;
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
    } }, { key: "observeChanges", value: function observeChanges(

    handlers) {var _this3 = this;
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

      this.scheduleRefresh();
      this.doPolling();
      return this;
    } }, { key: "doPolling", value: function doPolling()

    {var _this4 = this;
      var pollingQueue = new queue( /*#__PURE__*/function () {var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(task, callback) {var pollingIntervalMs, timeout;return _regeneratorRuntime.wrap(function _callee2$(_context2) {while (1) {switch (_context2.prev = _context2.next) {case 0:if (
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

                  callback();case 14:case "end":return _context2.stop();}}}, _callee2);}));return function (_x3, _x4) {return _ref2.apply(this, arguments);};}(),
      1);

      pollingQueue.push(null);

      pollingQueue.drain(function () {
        if (!_this4.stopped) {
          setTimeout(function () {
            pollingQueue.push(null);
          }, 0);
        }
      });
    } }, { key: "models", value: function models()

    {var _this5 = this;
      return new Promise(function (resolve) {
        var onReady = function onReady() {
          resolve(_.values(_this5.modelsMap));
        };
        if (_this5.wasRefreshed)
        return onReady();else
        {
          _this5.once('refresh', onReady);
        }
      });
    } }, { key: "stop", value: function stop()

    {
      this.stopped = true;
      this.emit('stop');
    } }]);return ObserveCursor;}(EventEmitter);exports["default"] =



ObserveCursor;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9PYnNlcnZlQ3Vyc29yLmpzIl0sIm5hbWVzIjpbImVtaXR0ZXIiLCJFSlNPTiIsIl8iLCJzaWZ0IiwicXVldWUiLCJEaWZmU2VxdWVuY2UiLCJFdmVudEVtaXR0ZXIiLCJkZWxheWVkUHJvbWlzZSIsInRpbWVvdXQiLCJQcm9taXNlIiwicmVzb2x2ZSIsInNldFRpbWVvdXQiLCJPYnNlcnZlQ3Vyc29yIiwicXVlcnkiLCJvcHRpb25zIiwic2V0TWF4TGlzdGVuZXJzIiwiaGFuZGxlcnMiLCJtb2RlbHNNYXAiLCJsYXN0UmVmcmVzaGVkIiwic3RvcHBlZCIsIndhc1JlZnJlc2hlZCIsIm9uY2UiLCJ0YXNrIiwiY2FsbGJhY2siLCJxdWVyeVN0YXJ0ZWQiLCJkZWxheSIsInJlZnJlc2hEYXRlIiwiRGF0ZSIsIm5vdyIsInN0YXJ0ZWQiLCJleGVjIiwiZXJyIiwicmVzdWx0cyIsImNvbnNvbGUiLCJsb2ciLCJuZXdBc3NvYyIsImNoYWluIiwiaW5kZXhCeSIsIm1hcE9iamVjdCIsImRvYyIsImlkIiwicmF3RG9jIiwidG9PYmplY3QiLCJnZXR0ZXJzIiwiX2lkIiwidmFsdWUiLCJyZW1vdmVkIiwicmVtb3ZlZElkcyIsImRpZmZlcmVuY2UiLCJrZXlzIiwiZWFjaCIsImFwcGx5IiwicmVzdWx0IiwicmF3UmVzdWx0IiwiU3RyaW5nIiwiaXNTdHJpbmciLCJvbGRNb2RlbCIsImFkZGVkIiwiY2hhbmdlZCIsImVxdWFscyIsImNoYW5nZWRGaWVsZHMiLCJtYWtlQ2hhbmdlZEZpZWxkcyIsImlzRW1wdHkiLCJlbWl0IiwicG9sbGluZ0ludGVydmFsTXMiLCJwb2xsaW5nVGhyb3R0bGVNcyIsImxlbmd0aCIsInJ1bm5pbmciLCJpc0Z1bmN0aW9uIiwiaXNOdW1iZXIiLCJwdXNoIiwicmF3Q29uZGl0aW9ucyIsImNsb25lIiwiX2NvbmRpdGlvbnMiLCJzaWZ0UXVlcnkiLCJsaXN0ZW5lciIsInR5cGUiLCJtb25nb29zZU1vZGVsIiwiZmlyc3QiLCJhcmd1bWVudHMiLCJyYXdNb2RlbCIsInNjaGVkdWxlUmVmcmVzaCIsImZpbmRlZCIsIm9uIiwibW9uZ29vc2VDb2xsZWN0aW9uIiwibmFtZSIsImRvUG9sbGluZyIsInBvbGxpbmdRdWV1ZSIsImRyYWluIiwib25SZWFkeSIsInZhbHVlcyJdLCJtYXBwaW5ncyI6InFrREFBQSxvQyxJQUFPQSxPO0FBQ1AsOEIsSUFBT0MsSztBQUNQLHdDLElBQU9DLEM7QUFDUCw0QixJQUFPQyxJO0FBQ1Asb0MsSUFBT0MsSztBQUNQLDhDLElBQU9DLFk7QUFDUCxnQyxJQUFRQyxZLFdBQUFBLFk7O0FBRVIsU0FBU0MsY0FBVCxDQUF3QkMsT0FBeEIsRUFBZ0M7QUFDNUIsTUFBR0EsT0FBTyxJQUFFLENBQVo7QUFDSSxTQUFPQyxPQUFPLENBQUNDLE9BQVIsRUFBUDtBQUNKLFNBQU8sSUFBSUQsT0FBSixDQUFZLFVBQUNDLE9BQUQsRUFBVztBQUMxQkMsSUFBQUEsVUFBVSxDQUFDRCxPQUFELEVBQVNGLE9BQVQsQ0FBVjtBQUNILEdBRk0sQ0FBUDtBQUdILEM7O0FBRUtJLGE7QUFDRix5QkFBWUMsS0FBWixFQUE2QixlQUFYQyxPQUFXLHVFQUFILEVBQUc7QUFDekI7QUFDQSxVQUFLQyxlQUFMLENBQXFCLENBQXJCO0FBQ0EsVUFBS0YsS0FBTCxHQUFhQSxLQUFiO0FBQ0EsVUFBS0csUUFBTCxHQUFnQixJQUFoQjtBQUNBLFVBQUtDLFNBQUwsR0FBaUIsRUFBakI7QUFDQSxVQUFLQyxhQUFMLEdBQXFCLENBQXJCO0FBQ0EsVUFBS0MsT0FBTCxHQUFlLEtBQWY7QUFDQSxVQUFLQyxZQUFMLEdBQW9CLEtBQXBCO0FBQ0EsVUFBS0MsSUFBTCxDQUFVLFNBQVYsRUFBb0IsWUFBSTtBQUNwQixZQUFLRCxZQUFMLEdBQW9CLElBQXBCO0FBQ0gsS0FGRDs7QUFJQSxVQUFLaEIsS0FBTCxHQUFhQSxLQUFLLGdHQUFDLGlCQUFPa0IsSUFBUCxFQUFhQyxRQUFiO0FBQ2Ysc0JBQUtDLFlBQUwsR0FBb0IsS0FBcEI7QUFDSUMsZ0JBQUFB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QWtCLElBQWxCO0FBQ0gsV0FGUyxFQUVSLENBRlEsQ0FBVjtBQUdIO0FBQ0osT0FORDtBQU9ILEs7O0FBRU87QUFDSixhQUFPLElBQUk3RCxPQUFKLENBQVksVUFBQ0MsT0FBRCxFQUFXO0FBQzFCLFlBQUkrRSxPQUFPLEdBQUcsU0FBVkEsT0FBVSxHQUFJO0FBQ2QvRSxVQUFBQSxPQUFPLENBQUNSLENBQUMsQ0FBQ3dGLE1BQUYsQ0FBUyxNQUFJLENBQUN6RSxTQUFkLENBQUQsQ0FBUDtBQUNILFNBRkQ7QUFHQSxZQUFHLE1BQUksQ0FBQ0csWUFBUjtBQUNJLGVBQU9xRSxPQUFPLEVBQWQsQ0FESjtBQUVJO0FBQ0EsVUFBQSxNQUFJLENBQUNwRSxJQUFMLENBQVUsU0FBVixFQUFvQm9FLE9BQXBCO0FBQ0g7QUFDSixPQVRNLENBQVA7QUFVSCxLOztBQUVLO0FBQ0YsV0FBS3RFLE9BQUwsR0FBZSxJQUFmO0FBQ0EsV0FBSzRDLElBQUwsQ0FBVSxNQUFWO0FBQ0gsSyw0QkFoTXVCekQsWTs7OztBQW9NYk0sYSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBlbWl0dGVyIGZyb20gXCIuL2VtaXR0ZXJcIjtcbmltcG9ydCBFSlNPTiBmcm9tICdlanNvbic7XG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmltcG9ydCBzaWZ0IGZyb20gJ3NpZnQnO1xuaW1wb3J0IHF1ZXVlIGZyb20gJ2FzeW5jL3F1ZXVlJztcbmltcG9ydCBEaWZmU2VxdWVuY2UgZnJvbSBcIi4vRGlmZlNlcXVlbmNlXCI7XG5pbXBvcnQge0V2ZW50RW1pdHRlcn0gZnJvbSAnZXZlbnRzJztcblxuZnVuY3Rpb24gZGVsYXllZFByb21pc2UodGltZW91dCl7XG4gICAgaWYodGltZW91dDw9MClcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSk9PntcbiAgICAgICAgc2V0VGltZW91dChyZXNvbHZlLHRpbWVvdXQpO1xuICAgIH0pO1xufVxuXG5jbGFzcyBPYnNlcnZlQ3Vyc29yIGV4dGVuZHMgRXZlbnRFbWl0dGVye1xuICAgIGNvbnN0cnVjdG9yKHF1ZXJ5LG9wdGlvbnM9e30pe1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLnNldE1heExpc3RlbmVycygwKTtcbiAgICAgICAgdGhpcy5xdWVyeSA9IHF1ZXJ5O1xuICAgICAgICB0aGlzLmhhbmRsZXJzID0gbnVsbDtcbiAgICAgICAgdGhpcy5tb2RlbHNNYXAgPSB7fTtcbiAgICAgICAgdGhpcy5sYXN0UmVmcmVzaGVkID0gMDtcbiAgICAgICAgdGhpcy5zdG9wcGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMud2FzUmVmcmVzaGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMub25jZSgncmVmcmVzaCcsKCk9PntcbiAgICAgICAgICAgIHRoaXMud2FzUmVmcmVzaGVkID0gdHJ1ZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5xdWV1ZSA9IHF1ZXVlKGFzeW5jICh0YXNrLCBjYWxsYmFjayk9PiB7XG4gICAgICAgICAgICB0aGlzLnF1ZXJ5U3RhcnRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgbGV0IGRlbGF5ID0gdGFzay5yZWZyZXNoRGF0ZS1EYXRlLm5vdygpIDtcbiAgICAgICAgICAgIGlmKGRlbGF5PjApe1xuICAgICAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKT0+e1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgIH0sZGVsYXkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnF1ZXJ5U3RhcnRlZCA9IHRydWU7XG4gICAgICAgICAgICBsZXQgc3RhcnRlZCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICB0aGlzLnF1ZXJ5LmV4ZWMoKGVycixyZXN1bHRzKT0+e1xuICAgICAgICAgICAgICAgIHRoaXMucXVlcnlTdGFydGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdGhpcy5sYXN0UmVmcmVzaGVkID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygncmVmcmVzaCBxdWVyeSBleGVjIGVuZCcpO1xuICAgICAgICAgICAgICAgIGlmKGVycilcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7Ly9UT0RPIGVycm9yIGhhbmRsZVxuICAgICAgICAgICAgICAgIGxldCBuZXdBc3NvYyA9IF8uY2hhaW4ocmVzdWx0cylcbiAgICAgICAgICAgICAgICAuaW5kZXhCeSgnaWQnKVxuICAgICAgICAgICAgICAgIC5tYXBPYmplY3QoKGRvYyxpZCk9PntcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJhd0RvYyA9ICBkb2MudG9PYmplY3QoeyBnZXR0ZXJzOiBmYWxzZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmF3RG9jLl9pZCA9IGlkO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmF3RG9jO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnZhbHVlKCk7XG5cbiAgICAgICAgICAgICAgICBpZih0aGlzLmhhbmRsZXJzLnJlbW92ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJlbW92ZWRJZHMgPSBfLmRpZmZlcmVuY2UoIF8ua2V5cyh0aGlzLm1vZGVsc01hcCksIF8ua2V5cyhuZXdBc3NvYykgKTtcbiAgICAgICAgICAgICAgICAgICAgXy5lYWNoKHJlbW92ZWRJZHMsKF9pZCk9PntcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlcnMucmVtb3ZlZC5hcHBseSh0aGlzLCBbX2lkLHRoaXMubW9kZWxzTWFwW19pZF1dKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgXy5jaGFpbihuZXdBc3NvYylcbiAgICAgICAgICAgICAgICAuZWFjaCgocmVzdWx0KT0+e1xuICAgICAgICAgICAgICAgICAgICBsZXQgcmF3UmVzdWx0ID0gIG5ld0Fzc29jW1N0cmluZyhyZXN1bHQuX2lkKV07XG4gICAgICAgICAgICAgICAgICAgIGxldCBfaWQgPSBfLmlzU3RyaW5nKHJlc3VsdC5faWQpP3Jlc3VsdC5faWQ6U3RyaW5nKHJlc3VsdC5faWQpO1xuICAgICAgICAgICAgICAgICAgICBuZXdBc3NvY1tfaWRdID0gcmF3UmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICBsZXQgb2xkTW9kZWwgPSB0aGlzLm1vZGVsc01hcFtfaWRdO1xuICAgICAgICAgICAgICAgICAgICBpZighb2xkTW9kZWwmJnRoaXMuaGFuZGxlcnMuYWRkZWQpe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVycy5hZGRlZC5hcHBseSh0aGlzLCBbcmVzdWx0Ll9pZCxyZXN1bHRdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiggb2xkTW9kZWwgJiYgdGhpcy5oYW5kbGVycy5jaGFuZ2VkICYmICFFSlNPTi5lcXVhbHMob2xkTW9kZWwsIHJhd1Jlc3VsdCkpe1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGNoYW5nZWRGaWVsZHMgPSBEaWZmU2VxdWVuY2UubWFrZUNoYW5nZWRGaWVsZHMocmF3UmVzdWx0LCBvbGRNb2RlbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiggIV8uaXNFbXB0eShjaGFuZ2VkRmllbGRzKSAgKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZXJzLmNoYW5nZWQuYXBwbHkodGhpcywgW3Jlc3VsdC5faWQsY2hhbmdlZEZpZWxkcyxyZXN1bHRdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5tb2RlbHNNYXAgPSBuZXdBc3NvYztcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ3JlZnJlc2gnLERhdGUubm93KCktc3RhcnRlZCk7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH0pO1xuXG5cbiAgICAgICAgfSwxICk7XG5cbiAgICAgICAgdGhpcy5wb2xsaW5nSW50ZXJ2YWxNcyA9IG9wdGlvbnMucG9sbGluZ0ludGVydmFsTXMgfHwgNjAwMDA7XG4gICAgICAgIHRoaXMucG9sbGluZ1Rocm90dGxlTXMgPSBvcHRpb25zLnBvbGxpbmdUaHJvdHRsZU1zIHx8IDEwMDA7XG4gICAgfVxuXG4gICAgc2NoZWR1bGVSZWZyZXNoKHRhc2spe1xuICAgICAgICAvL2NvbnNvbGUubG9nKCdzaGVkdWxlUmVmcmVzaCBsZW5ndGg6Jyx0aGlzLnF1ZXVlLmxlbmd0aCgpLCdydW5uaW5nOicsdGhpcy5xdWV1ZS5ydW5uaW5nKCkpO1xuICAgICAgICBpZih0aGlzLnF1ZXVlLmxlbmd0aCgpPjApXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGZhbHNlKTtcbiAgICAgICAgaWYodGhpcy5xdWV1ZS5ydW5uaW5nKCk+MCAmJiAhdGhpcy5xdWVyeVN0YXJ0ZWQpXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGZhbHNlKTtcblxuICAgICAgICBsZXQgcG9sbGluZ1Rocm90dGxlTXMgPSB0aGlzLnBvbGxpbmdUaHJvdHRsZU1zO1xuICAgICAgICBpZihfLmlzRnVuY3Rpb24ocG9sbGluZ1Rocm90dGxlTXMpKXtcbiAgICAgICAgICAgIHBvbGxpbmdUaHJvdHRsZU1zID0gcG9sbGluZ1Rocm90dGxlTXMuYXBwbHkodGhpcyxbXSk7XG4gICAgICAgICAgICBpZighXy5pc051bWJlcihwb2xsaW5nVGhyb3R0bGVNcykpe1xuICAgICAgICAgICAgICAgIHBvbGxpbmdUaHJvdHRsZU1zID0gMTAwMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsZXQgZGVsYXkgPSB0aGlzLmxhc3RSZWZyZXNoZWQgPyBwb2xsaW5nVGhyb3R0bGVNcyAtICggRGF0ZS5ub3coKSAtIHRoaXMubGFzdFJlZnJlc2hlZCApIDogMDtcbiAgICAgICAgLy9jb25zb2xlLmxvZyh7ZGVsYXl9KTtcbiAgICAgICAgbGV0IHJlZnJlc2hEYXRlID0gbmV3IERhdGUoKTtcbiAgICAgICAgaWYoZGVsYXk+MCl7XG4gICAgICAgICAgICByZWZyZXNoRGF0ZSA9IG5ldyBEYXRlKERhdGUubm93KCkrZGVsYXkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKT0+e1xuICAgICAgICAgICAgdGhpcy5xdWV1ZS5wdXNoKHtyZWZyZXNoRGF0ZTpyZWZyZXNoRGF0ZX0sKCk9PntcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgb2JzZXJ2ZUNoYW5nZXMoaGFuZGxlcnMpe1xuICAgICAgICB0aGlzLmhhbmRsZXJzID0gaGFuZGxlcnM7XG4gICAgICAgIGNvbnN0IHJhd0NvbmRpdGlvbnMgPSBFSlNPTi5jbG9uZSh0aGlzLnF1ZXJ5Ll9jb25kaXRpb25zKTtcbiAgICAgICAgY29uc3Qgc2lmdFF1ZXJ5ID0gc2lmdChyYXdDb25kaXRpb25zKTtcblxuICAgICAgICBsZXQgbGlzdGVuZXIgPSAoZG9jKT0+e1xuICAgICAgICAgICAgaWYoZG9jLnR5cGU9PSdzYXZlJyYmdGhpcy5oYW5kbGVycy5hZGRlZCl7XG4gICAgICAgICAgICAgICAgbGV0IG1vbmdvb3NlTW9kZWwgPSBfLmZpcnN0KCBkb2MuYXJndW1lbnRzICk7XG4gICAgICAgICAgICAgICAgaWYobW9uZ29vc2VNb2RlbCkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgcmF3TW9kZWwgPSBFSlNPTi5jbG9uZShtb25nb29zZU1vZGVsKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNpZnRRdWVyeShyYXdNb2RlbCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNjaGVkdWxlUmVmcmVzaChyYXdNb2RlbCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoZG9jLnR5cGU9PSdyZW1vdmUnJiZ0aGlzLmhhbmRsZXJzLnJlbW92ZWQpe1xuICAgICAgICAgICAgICAgIGxldCBmaW5kZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBsZXQgc2lmdFF1ZXJ5ID0gc2lmdCggRUpTT04uY2xvbmUoXy5maXJzdCggZG9jLmFyZ3VtZW50cyApICkgKTtcbiAgICAgICAgICAgICAgICBfLmVhY2godGhpcy5tb2RlbHNNYXAsKHJhd01vZGVsKT0+e1xuICAgICAgICAgICAgICAgICAgICBpZighZmluZGVkICYmIHNpZnRRdWVyeShyYXdNb2RlbCkpe1xuICAgICAgICAgICAgICAgICAgICAgICAgZmluZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNjaGVkdWxlUmVmcmVzaChyYXdNb2RlbCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKGRvYy50eXBlPT0ndXBkYXRlJyl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2NoZWR1bGVSZWZyZXNoKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGVtaXR0ZXIub24odGhpcy5xdWVyeS5tb25nb29zZUNvbGxlY3Rpb24ubmFtZSxsaXN0ZW5lcik7XG5cbiAgICAgICAgdGhpcy5zY2hlZHVsZVJlZnJlc2goKTtcbiAgICAgICAgdGhpcy5kb1BvbGxpbmcoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZG9Qb2xsaW5nKCl7XG4gICAgICAgIGxldCBwb2xsaW5nUXVldWUgPSBuZXcgcXVldWUoYXN5bmMgKHRhc2ssY2FsbGJhY2spPT57XG4gICAgICAgICAgICBpZighdGhpcy5sYXN0UmVmcmVzaGVkKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgZGVsYXllZFByb21pc2UoMTAwKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sgKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgcG9sbGluZ0ludGVydmFsTXMgPSBfLmlzRnVuY3Rpb24odGhpcy5wb2xsaW5nSW50ZXJ2YWxNcyk/dGhpcy5wb2xsaW5nSW50ZXJ2YWxNcy5hcHBseSh0aGlzKTp0aGlzLnBvbGxpbmdJbnRlcnZhbE1zO1xuICAgICAgICAgICAgaWYoIV8uaXNOdW1iZXIocG9sbGluZ0ludGVydmFsTXMpKXtcbiAgICAgICAgICAgICAgICBwb2xsaW5nSW50ZXJ2YWxNcyA9IDYwMDAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IHRpbWVvdXQgPSBwb2xsaW5nSW50ZXJ2YWxNcyAtICggRGF0ZS5ub3coKSAtIHRoaXMubGFzdFJlZnJlc2hlZCApO1xuICAgICAgICAgICAgaWYodGltZW91dD4wKXtcbiAgICAgICAgICAgICAgICBhd2FpdCBkZWxheWVkUHJvbWlzZSh0aW1lb3V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKCF0aGlzLnN0b3BwZWQpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnNjaGVkdWxlUmVmcmVzaCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgfSwxKTtcblxuICAgICAgICBwb2xsaW5nUXVldWUucHVzaChudWxsKTtcblxuICAgICAgICBwb2xsaW5nUXVldWUuZHJhaW4oKCk9PntcbiAgICAgICAgICAgIGlmKCF0aGlzLnN0b3BwZWQpIHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpPT57XG4gICAgICAgICAgICAgICAgICAgIHBvbGxpbmdRdWV1ZS5wdXNoKG51bGwpO1xuICAgICAgICAgICAgICAgIH0sMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIG1vZGVscygpe1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpPT57XG4gICAgICAgICAgICBsZXQgb25SZWFkeSA9ICgpPT57XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShfLnZhbHVlcyh0aGlzLm1vZGVsc01hcCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYodGhpcy53YXNSZWZyZXNoZWQpXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9uUmVhZHkoKTtcbiAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgdGhpcy5vbmNlKCdyZWZyZXNoJyxvblJlYWR5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc3RvcCgpe1xuICAgICAgICB0aGlzLnN0b3BwZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLmVtaXQoJ3N0b3AnKTtcbiAgICB9XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgT2JzZXJ2ZUN1cnNvcjsiXX0=