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
                  var assocModels = _.indexBy(results, 'id');

                  /**@type object*/
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
                      _this.handlers.added.apply(_assertThisInitialized(_this), [result._id, result, assocModels[_id]]);
                    }
                    if (oldModel && _this.handlers.changed && !EJSON.equals(oldModel, rawResult)) {
                      var changedFields = DiffSequence.makeChangedFields(rawResult, oldModel);
                      if (!_.isEmpty(changedFields)) {
                        _this.handlers.changed.apply(_assertThisInitialized(_this), [result._id, changedFields, result, assocModels[_id]]);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9PYnNlcnZlQ3Vyc29yLmpzIl0sIm5hbWVzIjpbImVtaXR0ZXIiLCJFSlNPTiIsIl8iLCJzaWZ0IiwicXVldWUiLCJEaWZmU2VxdWVuY2UiLCJFdmVudEVtaXR0ZXIiLCJkZWxheWVkUHJvbWlzZSIsInRpbWVvdXQiLCJQcm9taXNlIiwicmVzb2x2ZSIsInNldFRpbWVvdXQiLCJPYnNlcnZlQ3Vyc29yIiwicXVlcnkiLCJvcHRpb25zIiwic2V0TWF4TGlzdGVuZXJzIiwiaGFuZGxlcnMiLCJtb2RlbHNNYXAiLCJsYXN0UmVmcmVzaGVkIiwic3RvcHBlZCIsIndhc1JlZnJlc2hlZCIsIm9uY2UiLCJ0YXNrIiwiY2FsbGJhY2siLCJxdWVyeVN0YXJ0ZWQiLCJkZWxheSIsInJlZnJlc2hEYXRlIiwiRGF0ZSIsIm5vdyIsInN0YXJ0ZWQiLCJleGVjIiwiZXJyIiwicmVzdWx0cyIsImNvbnNvbGUiLCJsb2ciLCJhc3NvY01vZGVscyIsImluZGV4QnkiLCJuZXdBc3NvYyIsImNoYWluIiwibWFwT2JqZWN0IiwiZG9jIiwiaWQiLCJyYXdEb2MiLCJ0b09iamVjdCIsImdldHRlcnMiLCJfaWQiLCJ2YWx1ZSIsInJlbW92ZWQiLCJyZW1vdmVkSWRzIiwiZGlmZmVyZW5jZSIsImtleXMiLCJlYWNoIiwiYXBwbHkiLCJyZXN1bHQiLCJyYXdSZXN1bHQiLCJTdHJpbmciLCJpc1N0cmluZyIsIm9sZE1vZGVsIiwiYWRkZWQiLCJjaGFuZ2VkIiwiZXF1YWxzIiwiY2hhbmdlZEZpZWxkcyIsIm1ha2VDaGFuZ2VkRmllbGRzIiwiaXNFbXB0eSIsImVtaXQiLCJwb2xsaW5nSW50ZXJ2YWxNcyIsInBvbGxpbmdUaHJvdHRsZU1zIiwibGVuZ3RoIiwicnVubmluZyIsImlzRnVuY3Rpb24iLCJpc051bWJlciIsInB1c2giLCJyYXdDb25kaXRpb25zIiwiY2xvbmUiLCJfY29uZGl0aW9ucyIsInNpZnRRdWVyeSIsImxpc3RlbmVyIiwidHlwZSIsIm1vbmdvb3NlTW9kZWwiLCJmaXJzdCIsImFyZ3VtZW50cyIsInJhd01vZGVsIiwic2NoZWR1bGVSZWZyZXNoIiwiZmluZGVkIiwib24iLCJtb25nb29zZUNvbGxlY3Rpb24iLCJuYW1lIiwiZG9Qb2xsaW5nIiwicG9sbGluZ1F1ZXVlIiwiZHJhaW4iLCJvblJlYWR5IiwidmFsdWVzIl0sIm1hcHBpbmdzIjoicWtEQUFBLG9DLElBQU9BLE87QUFDUCw4QixJQUFPQyxLO0FBQ1Asd0MsSUFBT0MsQztBQUNQLDRCLElBQU9DLEk7QUFDUCxvQyxJQUFPQyxLO0FBQ1AsOEMsSUFBT0MsWTtBQUNQLGdDLElBQVFDLFksV0FBQUEsWTs7QUFFUixTQUFTQyxjQUFULENBQXdCQyxPQUF4QixFQUFnQztBQUM1QixNQUFHQSxPQUFPLElBQUUsQ0FBWjtBQUNJLFNBQU9DLE9BQU8sQ0FBQ0MsT0FBUixFQUFQO0FBQ0osU0FBTyxJQUFJRCxPQUFKLENBQVksVUFBQ0MsT0FBRCxFQUFXO0FBQzFCQyxJQUFBQSxVQUFVLENBQUNELE9BQUQsRUFBU0YsT0FBVCxDQUFWO0FBQ0gsR0FGTSxDQUFQO0FBR0gsQzs7QUFFS0ksYTtBQUNGLHlCQUFZQyxLQUFaLEVBQTZCLGVBQVhDLE9BQVcsdUVBQUgsRUFBRztBQUN6QjtBQUNBLFVBQUtDLGVBQUwsQ0FBcUIsQ0FBckI7QUFDQSxVQUFLRixLQUFMLEdBQWFBLEtBQWI7QUFDQSxVQUFLRyxRQUFMLEdBQWdCLElBQWhCO0FBQ0EsVUFBS0MsU0FBTCxHQUFpQixFQUFqQjtBQUNBLFVBQUtDLGFBQUwsR0FBcUIsQ0FBckI7QUFDQSxVQUFLQyxPQUFMLEdBQWUsS0FBZjtBQUNBLFVBQUtDLFlBQUwsR0FBb0IsS0FBcEI7QUFDQSxVQUFLQyxJQUFMLENBQVUsU0FBVixFQUFvQixZQUFJO0FBQ3BCLFlBQUtELFlBQUwsR0FBb0IsSUFBcEI7QUFDSCxLQUZEOztBQUlBLFVBQUtoQixLQUFMLEdBQWFBLEtBQUssZ0dBQUMsaUJBQU9rQixJQUFQLEVBQWFDLFFBQWI7QUFDZixzQkFBS0MsWUFBTCxHQUFvQixLQUFw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QUFrQixJQUFsQjs7QUFFQWlCLE1BQUFBLFlBQVksQ0FBQ0MsS0FBYixDQUFtQixZQUFJO0FBQ25CLFlBQUcsQ0FBQyxNQUFJLENBQUN0RSxPQUFULEVBQWtCO0FBQ2RSLFVBQUFBLFVBQVUsQ0FBQyxZQUFJO0FBQ1g2RSxZQUFBQSxZQUFZLENBQUNqQixJQUFiLENBQWtCLElBQWxCO0FBQ0gsV0FGUyxFQUVSLENBRlEsQ0FBVjtBQUdIO0FBQ0osT0FORDtBQU9ILEs7O0FBRU87QUFDSixhQUFPLElBQUk5RCxPQUFKLENBQVksVUFBQ0MsT0FBRCxFQUFXO0FBQzFCLFlBQUlnRixPQUFPLEdBQUcsU0FBVkEsT0FBVSxHQUFJO0FBQ2RoRixVQUFBQSxPQUFPLENBQUNSLENBQUMsQ0FBQ3lGLE1BQUYsQ0FBUyxNQUFJLENBQUMxRSxTQUFkLENBQUQsQ0FBUDtBQUNILFNBRkQ7QUFHQSxZQUFHLE1BQUksQ0FBQ0csWUFBUjtBQUNJLGVBQU9zRSxPQUFPLEVBQWQsQ0FESjtBQUVJO0FBQ0EsVUFBQSxNQUFJLENBQUNyRSxJQUFMLENBQVUsU0FBVixFQUFvQnFFLE9BQXBCO0FBQ0g7QUFDSixPQVRNLENBQVA7QUFVSCxLOztBQUVLO0FBQ0YsV0FBS3ZFLE9BQUwsR0FBZSxJQUFmO0FBQ0EsV0FBSzZDLElBQUwsQ0FBVSxNQUFWO0FBQ0gsSyw0QkFuTXVCMUQsWTs7OztBQXVNYk0sYSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBlbWl0dGVyIGZyb20gXCIuL2VtaXR0ZXJcIjtcbmltcG9ydCBFSlNPTiBmcm9tICdlanNvbic7XG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmltcG9ydCBzaWZ0IGZyb20gJ3NpZnQnO1xuaW1wb3J0IHF1ZXVlIGZyb20gJ2FzeW5jL3F1ZXVlJztcbmltcG9ydCBEaWZmU2VxdWVuY2UgZnJvbSBcIi4vRGlmZlNlcXVlbmNlXCI7XG5pbXBvcnQge0V2ZW50RW1pdHRlcn0gZnJvbSAnZXZlbnRzJztcblxuZnVuY3Rpb24gZGVsYXllZFByb21pc2UodGltZW91dCl7XG4gICAgaWYodGltZW91dDw9MClcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSk9PntcbiAgICAgICAgc2V0VGltZW91dChyZXNvbHZlLHRpbWVvdXQpO1xuICAgIH0pO1xufVxuXG5jbGFzcyBPYnNlcnZlQ3Vyc29yIGV4dGVuZHMgRXZlbnRFbWl0dGVye1xuICAgIGNvbnN0cnVjdG9yKHF1ZXJ5LG9wdGlvbnM9e30pe1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLnNldE1heExpc3RlbmVycygwKTtcbiAgICAgICAgdGhpcy5xdWVyeSA9IHF1ZXJ5O1xuICAgICAgICB0aGlzLmhhbmRsZXJzID0gbnVsbDtcbiAgICAgICAgdGhpcy5tb2RlbHNNYXAgPSB7fTtcbiAgICAgICAgdGhpcy5sYXN0UmVmcmVzaGVkID0gMDtcbiAgICAgICAgdGhpcy5zdG9wcGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMud2FzUmVmcmVzaGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMub25jZSgncmVmcmVzaCcsKCk9PntcbiAgICAgICAgICAgIHRoaXMud2FzUmVmcmVzaGVkID0gdHJ1ZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5xdWV1ZSA9IHF1ZXVlKGFzeW5jICh0YXNrLCBjYWxsYmFjayk9PiB7XG4gICAgICAgICAgICB0aGlzLnF1ZXJ5U3RhcnRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgbGV0IGRlbGF5ID0gdGFzay5yZWZyZXNoRGF0ZS1EYXRlLm5vdygpIDtcbiAgICAgICAgICAgIGlmKGRlbGF5PjApe1xuICAgICAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKT0+e1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgIH0sZGVsYXkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnF1ZXJ5U3RhcnRlZCA9IHRydWU7XG4gICAgICAgICAgICBsZXQgc3RhcnRlZCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICB0aGlzLnF1ZXJ5LmV4ZWMoKGVycixyZXN1bHRzKT0+e1xuICAgICAgICAgICAgICAgIHRoaXMucXVlcnlTdGFydGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdGhpcy5sYXN0UmVmcmVzaGVkID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygncmVmcmVzaCBxdWVyeSBleGVjIGVuZCcpO1xuICAgICAgICAgICAgICAgIGlmKGVycilcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7Ly9UT0RPIGVycm9yIGhhbmRsZVxuICAgICAgICAgICAgICAgIGxldCBhc3NvY01vZGVscyA9IF8uaW5kZXhCeShyZXN1bHRzLCdpZCcpO1xuXG4gICAgICAgICAgICAgICAgLyoqQHR5cGUgb2JqZWN0Ki9cbiAgICAgICAgICAgICAgICBsZXQgbmV3QXNzb2MgPSBfLmNoYWluKHJlc3VsdHMpXG4gICAgICAgICAgICAgICAgLmluZGV4QnkoJ2lkJylcbiAgICAgICAgICAgICAgICAubWFwT2JqZWN0KChkb2MsaWQpPT57XG4gICAgICAgICAgICAgICAgICAgIGxldCByYXdEb2MgPSAgZG9jLnRvT2JqZWN0KHsgZ2V0dGVyczogZmFsc2UgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJhd0RvYy5faWQgPSBpZDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJhd0RvYztcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC52YWx1ZSgpO1xuXG4gICAgICAgICAgICAgICAgaWYodGhpcy5oYW5kbGVycy5yZW1vdmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCByZW1vdmVkSWRzID0gXy5kaWZmZXJlbmNlKCBfLmtleXModGhpcy5tb2RlbHNNYXApLCBfLmtleXMobmV3QXNzb2MpICk7XG4gICAgICAgICAgICAgICAgICAgIF8uZWFjaChyZW1vdmVkSWRzLChfaWQpPT57XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZXJzLnJlbW92ZWQuYXBwbHkodGhpcywgW19pZCx0aGlzLm1vZGVsc01hcFtfaWRdXSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIF8uY2hhaW4obmV3QXNzb2MpXG4gICAgICAgICAgICAgICAgLmVhY2goKHJlc3VsdCk9PntcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJhd1Jlc3VsdCA9ICBuZXdBc3NvY1tTdHJpbmcocmVzdWx0Ll9pZCldO1xuICAgICAgICAgICAgICAgICAgICBsZXQgX2lkID0gXy5pc1N0cmluZyhyZXN1bHQuX2lkKT9yZXN1bHQuX2lkOlN0cmluZyhyZXN1bHQuX2lkKTtcbiAgICAgICAgICAgICAgICAgICAgbmV3QXNzb2NbX2lkXSA9IHJhd1Jlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG9sZE1vZGVsID0gdGhpcy5tb2RlbHNNYXBbX2lkXTtcbiAgICAgICAgICAgICAgICAgICAgaWYoIW9sZE1vZGVsJiZ0aGlzLmhhbmRsZXJzLmFkZGVkKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlcnMuYWRkZWQuYXBwbHkodGhpcywgW3Jlc3VsdC5faWQscmVzdWx0LGFzc29jTW9kZWxzW19pZF1dKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiggb2xkTW9kZWwgJiYgdGhpcy5oYW5kbGVycy5jaGFuZ2VkICYmICFFSlNPTi5lcXVhbHMob2xkTW9kZWwsIHJhd1Jlc3VsdCkpe1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGNoYW5nZWRGaWVsZHMgPSBEaWZmU2VxdWVuY2UubWFrZUNoYW5nZWRGaWVsZHMocmF3UmVzdWx0LCBvbGRNb2RlbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiggIV8uaXNFbXB0eShjaGFuZ2VkRmllbGRzKSAgKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZXJzLmNoYW5nZWQuYXBwbHkodGhpcywgW3Jlc3VsdC5faWQsY2hhbmdlZEZpZWxkcyxyZXN1bHQsYXNzb2NNb2RlbHNbX2lkXV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLm1vZGVsc01hcCA9IG5ld0Fzc29jO1xuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgncmVmcmVzaCcsRGF0ZS5ub3coKS1zdGFydGVkKTtcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfSk7XG5cblxuICAgICAgICB9LDEgKTtcblxuICAgICAgICB0aGlzLnBvbGxpbmdJbnRlcnZhbE1zID0gb3B0aW9ucy5wb2xsaW5nSW50ZXJ2YWxNcyB8fCA2MDAwMDtcbiAgICAgICAgdGhpcy5wb2xsaW5nVGhyb3R0bGVNcyA9IG9wdGlvbnMucG9sbGluZ1Rocm90dGxlTXMgfHwgMTAwMDtcbiAgICB9XG5cbiAgICBzY2hlZHVsZVJlZnJlc2godGFzayl7XG4gICAgICAgIC8vY29uc29sZS5sb2coJ3NoZWR1bGVSZWZyZXNoIGxlbmd0aDonLHRoaXMucXVldWUubGVuZ3RoKCksJ3J1bm5pbmc6Jyx0aGlzLnF1ZXVlLnJ1bm5pbmcoKSk7XG4gICAgICAgIGlmKHRoaXMucXVldWUubGVuZ3RoKCk+MClcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZmFsc2UpO1xuICAgICAgICBpZih0aGlzLnF1ZXVlLnJ1bm5pbmcoKT4wICYmICF0aGlzLnF1ZXJ5U3RhcnRlZClcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZmFsc2UpO1xuXG4gICAgICAgIGxldCBwb2xsaW5nVGhyb3R0bGVNcyA9IHRoaXMucG9sbGluZ1Rocm90dGxlTXM7XG4gICAgICAgIGlmKF8uaXNGdW5jdGlvbihwb2xsaW5nVGhyb3R0bGVNcykpe1xuICAgICAgICAgICAgcG9sbGluZ1Rocm90dGxlTXMgPSBwb2xsaW5nVGhyb3R0bGVNcy5hcHBseSh0aGlzLFtdKTtcbiAgICAgICAgICAgIGlmKCFfLmlzTnVtYmVyKHBvbGxpbmdUaHJvdHRsZU1zKSl7XG4gICAgICAgICAgICAgICAgcG9sbGluZ1Rocm90dGxlTXMgPSAxMDAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGxldCBkZWxheSA9IHRoaXMubGFzdFJlZnJlc2hlZCA/IHBvbGxpbmdUaHJvdHRsZU1zIC0gKCBEYXRlLm5vdygpIC0gdGhpcy5sYXN0UmVmcmVzaGVkICkgOiAwO1xuICAgICAgICAvL2NvbnNvbGUubG9nKHtkZWxheX0pO1xuICAgICAgICBsZXQgcmVmcmVzaERhdGUgPSBuZXcgRGF0ZSgpO1xuICAgICAgICBpZihkZWxheT4wKXtcbiAgICAgICAgICAgIHJlZnJlc2hEYXRlID0gbmV3IERhdGUoRGF0ZS5ub3coKStkZWxheSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpPT57XG4gICAgICAgICAgICB0aGlzLnF1ZXVlLnB1c2goe3JlZnJlc2hEYXRlOnJlZnJlc2hEYXRlfSwoKT0+e1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBvYnNlcnZlQ2hhbmdlcyhoYW5kbGVycyl7XG4gICAgICAgIHRoaXMuaGFuZGxlcnMgPSBoYW5kbGVycztcbiAgICAgICAgY29uc3QgcmF3Q29uZGl0aW9ucyA9IEVKU09OLmNsb25lKHRoaXMucXVlcnkuX2NvbmRpdGlvbnMpO1xuICAgICAgICBjb25zdCBzaWZ0UXVlcnkgPSBzaWZ0KHJhd0NvbmRpdGlvbnMpO1xuXG4gICAgICAgIGxldCBsaXN0ZW5lciA9IChkb2MpPT57XG4gICAgICAgICAgICBpZihkb2MudHlwZT09J3NhdmUnJiZ0aGlzLmhhbmRsZXJzLmFkZGVkKXtcbiAgICAgICAgICAgICAgICBsZXQgbW9uZ29vc2VNb2RlbCA9IF8uZmlyc3QoIGRvYy5hcmd1bWVudHMgKTtcbiAgICAgICAgICAgICAgICBpZihtb25nb29zZU1vZGVsKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCByYXdNb2RlbCA9IEVKU09OLmNsb25lKG1vbmdvb3NlTW9kZWwpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2lmdFF1ZXJ5KHJhd01vZGVsKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2NoZWR1bGVSZWZyZXNoKHJhd01vZGVsKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihkb2MudHlwZT09J3JlbW92ZScmJnRoaXMuaGFuZGxlcnMucmVtb3ZlZCl7XG4gICAgICAgICAgICAgICAgbGV0IGZpbmRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGxldCBzaWZ0UXVlcnkgPSBzaWZ0KCBFSlNPTi5jbG9uZShfLmZpcnN0KCBkb2MuYXJndW1lbnRzICkgKSApO1xuICAgICAgICAgICAgICAgIF8uZWFjaCh0aGlzLm1vZGVsc01hcCwocmF3TW9kZWwpPT57XG4gICAgICAgICAgICAgICAgICAgIGlmKCFmaW5kZWQgJiYgc2lmdFF1ZXJ5KHJhd01vZGVsKSl7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaW5kZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2NoZWR1bGVSZWZyZXNoKHJhd01vZGVsKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYoZG9jLnR5cGU9PSd1cGRhdGUnKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zY2hlZHVsZVJlZnJlc2goKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgZW1pdHRlci5vbih0aGlzLnF1ZXJ5Lm1vbmdvb3NlQ29sbGVjdGlvbi5uYW1lLGxpc3RlbmVyKTtcblxuICAgICAgICB0aGlzLnNjaGVkdWxlUmVmcmVzaCgpO1xuICAgICAgICB0aGlzLmRvUG9sbGluZygpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBkb1BvbGxpbmcoKXtcbiAgICAgICAgbGV0IHBvbGxpbmdRdWV1ZSA9IG5ldyBxdWV1ZShhc3luYyAodGFzayxjYWxsYmFjayk9PntcbiAgICAgICAgICAgIGlmKCF0aGlzLmxhc3RSZWZyZXNoZWQpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBkZWxheWVkUHJvbWlzZSgxMDApO1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayAoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBwb2xsaW5nSW50ZXJ2YWxNcyA9IF8uaXNGdW5jdGlvbih0aGlzLnBvbGxpbmdJbnRlcnZhbE1zKT90aGlzLnBvbGxpbmdJbnRlcnZhbE1zLmFwcGx5KHRoaXMpOnRoaXMucG9sbGluZ0ludGVydmFsTXM7XG4gICAgICAgICAgICBpZighXy5pc051bWJlcihwb2xsaW5nSW50ZXJ2YWxNcykpe1xuICAgICAgICAgICAgICAgIHBvbGxpbmdJbnRlcnZhbE1zID0gNjAwMDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgdGltZW91dCA9IHBvbGxpbmdJbnRlcnZhbE1zIC0gKCBEYXRlLm5vdygpIC0gdGhpcy5sYXN0UmVmcmVzaGVkICk7XG4gICAgICAgICAgICBpZih0aW1lb3V0PjApe1xuICAgICAgICAgICAgICAgIGF3YWl0IGRlbGF5ZWRQcm9taXNlKHRpbWVvdXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoIXRoaXMuc3RvcHBlZCkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2NoZWR1bGVSZWZyZXNoKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9LDEpO1xuXG4gICAgICAgIHBvbGxpbmdRdWV1ZS5wdXNoKG51bGwpO1xuXG4gICAgICAgIHBvbGxpbmdRdWV1ZS5kcmFpbigoKT0+e1xuICAgICAgICAgICAgaWYoIXRoaXMuc3RvcHBlZCkge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCk9PntcbiAgICAgICAgICAgICAgICAgICAgcG9sbGluZ1F1ZXVlLnB1c2gobnVsbCk7XG4gICAgICAgICAgICAgICAgfSwwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgbW9kZWxzKCl7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSk9PntcbiAgICAgICAgICAgIGxldCBvblJlYWR5ID0gKCk9PntcbiAgICAgICAgICAgICAgICByZXNvbHZlKF8udmFsdWVzKHRoaXMubW9kZWxzTWFwKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZih0aGlzLndhc1JlZnJlc2hlZClcbiAgICAgICAgICAgICAgICByZXR1cm4gb25SZWFkeSgpO1xuICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICB0aGlzLm9uY2UoJ3JlZnJlc2gnLG9uUmVhZHkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzdG9wKCl7XG4gICAgICAgIHRoaXMuc3RvcHBlZCA9IHRydWU7XG4gICAgICAgIHRoaXMuZW1pdCgnc3RvcCcpO1xuICAgIH1cblxufVxuXG5leHBvcnQgZGVmYXVsdCBPYnNlcnZlQ3Vyc29yOyJdfQ==