"use strict";var _interopRequireDefault3 = require("@babel/runtime/helpers/interopRequireDefault");var _interopRequireDefault2 = _interopRequireDefault3(require("@babel/runtime/helpers/interopRequireDefault"));Object.defineProperty(exports, "__esModule", { value: true });var _regenerator = require("@babel/runtime/regenerator");var _regeneratorRuntime = (0, _interopRequireDefault2["default"])(_regenerator)["default"];var _asyncToGenerator2 = require("@babel/runtime/helpers/asyncToGenerator");var _asyncToGenerator = (0, _interopRequireDefault2["default"])(_asyncToGenerator2)["default"];var _classCallCheck2 = require("@babel/runtime/helpers/classCallCheck");var _classCallCheck = (0, _interopRequireDefault2["default"])(_classCallCheck2)["default"];var _createClass2 = require("@babel/runtime/helpers/createClass");var _createClass = (0, _interopRequireDefault2["default"])(_createClass2)["default"];var _possibleConstructorReturn2 = require("@babel/runtime/helpers/possibleConstructorReturn");var _possibleConstructorReturn = (0, _interopRequireDefault2["default"])(_possibleConstructorReturn2)["default"];var _getPrototypeOf2 = require("@babel/runtime/helpers/getPrototypeOf");var _getPrototypeOf = (0, _interopRequireDefault2["default"])(_getPrototypeOf2)["default"];var _assertThisInitialized2 = require("@babel/runtime/helpers/assertThisInitialized");var _assertThisInitialized = (0, _interopRequireDefault2["default"])(_assertThisInitialized2)["default"];var _inherits2 = require("@babel/runtime/helpers/inherits");var _inherits = (0, _interopRequireDefault2["default"])(_inherits2)["default"];var _emitter = require("./emitter");var emitter = (0, _interopRequireDefault2["default"])(_emitter)["default"];
var _ejson = require("ejson");var EJSON = (0, _interopRequireDefault2["default"])(_ejson)["default"];
var _underscore = require("underscore");var _ = (0, _interopRequireDefault2["default"])(_underscore)["default"];
var _sift = require("sift");var sift = (0, _interopRequireDefault2["default"])(_sift)["default"];
var _queue = require("async/queue");var queue = (0, _interopRequireDefault2["default"])(_queue)["default"];
var _DiffSequence = require("./DiffSequence");var DiffSequence = (0, _interopRequireDefault2["default"])(_DiffSequence)["default"];


var _events = require("events");var EventEmitter = _events.EventEmitter;var _require = require('set-interval-async/dynamic'),setIntervalAsync = _require.setIntervalAsync;var _require2 = require('set-interval-async'),clearIntervalAsync = _require2.clearIntervalAsync;

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9PYnNlcnZlQ3Vyc29yLmpzIl0sIm5hbWVzIjpbImVtaXR0ZXIiLCJFSlNPTiIsIl8iLCJzaWZ0IiwicXVldWUiLCJEaWZmU2VxdWVuY2UiLCJFdmVudEVtaXR0ZXIiLCJyZXF1aXJlIiwic2V0SW50ZXJ2YWxBc3luYyIsImNsZWFySW50ZXJ2YWxBc3luYyIsImRlbGF5ZWRQcm9taXNlIiwidGltZW91dCIsIlByb21pc2UiLCJyZXNvbHZlIiwic2V0VGltZW91dCIsIk9ic2VydmVDdXJzb3IiLCJxdWVyeSIsIm9wdGlvbnMiLCJzZXRNYXhMaXN0ZW5lcnMiLCJoYW5kbGVycyIsIm1vZGVsc01hcCIsImxhc3RSZWZyZXNoZWQiLCJzdG9wcGVkIiwid2FzUmVmcmVzaGVkIiwib25jZSIsInRhc2siLCJjYWxsYmFjayIsInF1ZXJ5U3RhcnRlZCIsImRlbGF5IiwicmVmcmVzaERhdGUiLCJEYXRlIiwibm93Iiwic3RhcnRlZCIsImV4ZWMiLCJlcnIiLCJyZXN1bHRzIiwiY29uc29sZSIsImxvZyIsIm5ld0Fzc29jIiwiY2hhaW4iLCJpbmRleEJ5IiwibWFwT2JqZWN0IiwiZG9jIiwiaWQiLCJyYXdEb2MiLCJ0b09iamVjdCIsImdldHRlcnMiLCJfaWQiLCJ2YWx1ZSIsInJlbW92ZWQiLCJyZW1vdmVkSWRzIiwiZGlmZmVyZW5jZSIsImtleXMiLCJlYWNoIiwiYXBwbHkiLCJyZXN1bHQiLCJyYXdSZXN1bHQiLCJTdHJpbmciLCJpc1N0cmluZyIsIm9sZE1vZGVsIiwiYWRkZWQiLCJjaGFuZ2VkIiwiZXF1YWxzIiwiY2hhbmdlZEZpZWxkcyIsIm1ha2VDaGFuZ2VkRmllbGRzIiwiaXNFbXB0eSIsImVtaXQiLCJwb2xsaW5nSW50ZXJ2YWxNcyIsInBvbGxpbmdUaHJvdHRsZU1zIiwibGVuZ3RoIiwicnVubmluZyIsImlzRnVuY3Rpb24iLCJpc051bWJlciIsInB1c2giLCJyYXdDb25kaXRpb25zIiwiY2xvbmUiLCJfY29uZGl0aW9ucyIsInNpZnRRdWVyeSIsImxpc3RlbmVyIiwidHlwZSIsIm1vbmdvb3NlTW9kZWwiLCJmaXJzdCIsImFyZ3VtZW50cyIsInJhd01vZGVsIiwic2NoZWR1bGVSZWZyZXNoIiwiZmluZGVkIiwib24iLCJtb25nb29zZUNvbGxlY3Rpb24iLCJuYW1lIiwiZG9Qb2xsaW5nIiwicG9sbGluZ1F1ZXVlIiwiZHJhaW4iLCJvblJlYWR5IiwidmFsdWVzIl0sIm1hcHBpbmdzIjoicWtEQUFBLG9DLElBQU9BLE87QUFDUCw4QixJQUFPQyxLO0FBQ1Asd0MsSUFBT0MsQztBQUNQLDRCLElBQU9DLEk7QUFDUCxvQyxJQUFPQyxLO0FBQ1AsOEMsSUFBT0MsWTs7O0FBR1AsZ0MsSUFBUUMsWSxXQUFBQSxZLGdCQUZxQkMsT0FBTyxDQUFDLDRCQUFELEMsQ0FBNUJDLGdCLFlBQUFBLGdCLGlCQUN1QkQsT0FBTyxDQUFDLG9CQUFELEMsQ0FBOUJFLGtCLGFBQUFBLGtCOztBQUdSLFNBQVNDLGNBQVQsQ0FBd0JDLE9BQXhCLEVBQWdDO0FBQzVCLE1BQUdBLE9BQU8sSUFBRSxDQUFaO0FBQ0ksU0FBT0MsT0FBTyxDQUFDQyxPQUFSLEVBQVA7QUFDSixTQUFPLElBQUlELE9BQUosQ0FBWSxVQUFDQyxPQUFELEVBQVc7QUFDMUJDLElBQUFBLFVBQVUsQ0FBQ0QsT0FBRCxFQUFTRixPQUFULENBQVY7QUFDSCxHQUZNLENBQVA7QUFHSCxDOztBQUVLSSxhO0FBQ0YseUJBQVlDLEtBQVosRUFBNkIsZUFBWEMsT0FBVyx1RUFBSCxFQUFHO0FBQ3pCO0FBQ0EsVUFBS0MsZUFBTCxDQUFxQixDQUFyQjtBQUNBLFVBQUtGLEtBQUwsR0FBYUEsS0FBYjtBQUNBLFVBQUtHLFFBQUwsR0FBZ0IsSUFBaEI7QUFDQSxVQUFLQyxTQUFMLEdBQWlCLEVBQWpCO0FBQ0EsVUFBS0MsYUFBTCxHQUFxQixDQUFyQjtBQUNBLFVBQUtDLE9BQUwsR0FBZSxLQUFmO0FBQ0EsVUFBS0MsWUFBTCxHQUFvQixLQUFwQjtBQUNBLFVBQUtDLElBQUwsQ0FBVSxTQUFWLEVBQW9CLFlB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QWxCOztBQUVBaUIsTUFBQUEsWUFBWSxDQUFDQyxLQUFiLENBQW1CLFlBQUk7QUFDbkIsWUFBRyxDQUFDLE1BQUksQ0FBQ3JFLE9BQVQsRUFBa0I7QUFDZFIsVUFBQUEsVUFBVSxDQUFDLFlBQUk7QUFDWDRFLFlBQUFBLFlBQVksQ0FBQ2pCLElBQWIsQ0FBa0IsSUFBbEI7QUFDSCxXQUZTLEVBRVIsQ0FGUSxDQUFWO0FBR0g7QUFDSixPQU5EO0FBT0gsSzs7QUFFTztBQUNKLGFBQU8sSUFBSTdELE9BQUosQ0FBWSxVQUFDQyxPQUFELEVBQVc7QUFDMUIsWUFBSStFLE9BQU8sR0FBRyxTQUFWQSxPQUFVLEdBQUk7QUFDZC9FLFVBQUFBLE9BQU8sQ0FBQ1gsQ0FBQyxDQUFDMkYsTUFBRixDQUFTLE1BQUksQ0FBQ3pFLFNBQWQsQ0FBRCxDQUFQO0FBQ0gsU0FGRDtBQUdBLFlBQUcsTUFBSSxDQUFDRyxZQUFSO0FBQ0ksZUFBT3FFLE9BQU8sRUFBZCxDQURKO0FBRUk7QUFDQSxVQUFBLE1BQUksQ0FBQ3BFLElBQUwsQ0FBVSxTQUFWLEVBQW9Cb0UsT0FBcEI7QUFDSDtBQUNKLE9BVE0sQ0FBUDtBQVVILEs7O0FBRUs7QUFDRixXQUFLdEUsT0FBTCxHQUFlLElBQWY7QUFDQSxXQUFLNEMsSUFBTCxDQUFVLE1BQVY7QUFDSCxLLDRCQWhNdUI1RCxZOzs7O0FBb01iUyxhIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGVtaXR0ZXIgZnJvbSBcIi4vZW1pdHRlclwiO1xuaW1wb3J0IEVKU09OIGZyb20gJ2Vqc29uJztcbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuaW1wb3J0IHNpZnQgZnJvbSAnc2lmdCc7XG5pbXBvcnQgcXVldWUgZnJvbSAnYXN5bmMvcXVldWUnO1xuaW1wb3J0IERpZmZTZXF1ZW5jZSBmcm9tIFwiLi9EaWZmU2VxdWVuY2VcIjtcbmNvbnN0IHsgc2V0SW50ZXJ2YWxBc3luYyB9ID0gcmVxdWlyZSgnc2V0LWludGVydmFsLWFzeW5jL2R5bmFtaWMnKVxuY29uc3QgeyBjbGVhckludGVydmFsQXN5bmMgfSA9IHJlcXVpcmUoJ3NldC1pbnRlcnZhbC1hc3luYycpXG5pbXBvcnQge0V2ZW50RW1pdHRlcn0gZnJvbSAnZXZlbnRzJztcblxuZnVuY3Rpb24gZGVsYXllZFByb21pc2UodGltZW91dCl7XG4gICAgaWYodGltZW91dDw9MClcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSk9PntcbiAgICAgICAgc2V0VGltZW91dChyZXNvbHZlLHRpbWVvdXQpO1xuICAgIH0pO1xufVxuXG5jbGFzcyBPYnNlcnZlQ3Vyc29yIGV4dGVuZHMgRXZlbnRFbWl0dGVye1xuICAgIGNvbnN0cnVjdG9yKHF1ZXJ5LG9wdGlvbnM9e30pe1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLnNldE1heExpc3RlbmVycygwKTtcbiAgICAgICAgdGhpcy5xdWVyeSA9IHF1ZXJ5O1xuICAgICAgICB0aGlzLmhhbmRsZXJzID0gbnVsbDtcbiAgICAgICAgdGhpcy5tb2RlbHNNYXAgPSB7fTtcbiAgICAgICAgdGhpcy5sYXN0UmVmcmVzaGVkID0gMDtcbiAgICAgICAgdGhpcy5zdG9wcGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMud2FzUmVmcmVzaGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMub25jZSgncmVmcmVzaCcsKCk9PntcbiAgICAgICAgICAgIHRoaXMud2FzUmVmcmVzaGVkID0gdHJ1ZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5xdWV1ZSA9IHF1ZXVlKGFzeW5jICh0YXNrLCBjYWxsYmFjayk9PiB7XG4gICAgICAgICAgICB0aGlzLnF1ZXJ5U3RhcnRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgbGV0IGRlbGF5ID0gdGFzay5yZWZyZXNoRGF0ZS1EYXRlLm5vdygpIDtcbiAgICAgICAgICAgIGlmKGRlbGF5PjApe1xuICAgICAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKT0+e1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgIH0sZGVsYXkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnF1ZXJ5U3RhcnRlZCA9IHRydWU7XG4gICAgICAgICAgICBsZXQgc3RhcnRlZCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICB0aGlzLnF1ZXJ5LmV4ZWMoKGVycixyZXN1bHRzKT0+e1xuICAgICAgICAgICAgICAgIHRoaXMucXVlcnlTdGFydGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdGhpcy5sYXN0UmVmcmVzaGVkID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygncmVmcmVzaCBxdWVyeSBleGVjIGVuZCcpO1xuICAgICAgICAgICAgICAgIGlmKGVycilcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7Ly9UT0RPIGVycm9yIGhhbmRsZVxuICAgICAgICAgICAgICAgIGxldCBuZXdBc3NvYyA9IF8uY2hhaW4ocmVzdWx0cylcbiAgICAgICAgICAgICAgICAuaW5kZXhCeSgnaWQnKVxuICAgICAgICAgICAgICAgIC5tYXBPYmplY3QoKGRvYyxpZCk9PntcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJhd0RvYyA9ICBkb2MudG9PYmplY3QoeyBnZXR0ZXJzOiBmYWxzZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmF3RG9jLl9pZCA9IGlkO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmF3RG9jO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnZhbHVlKCk7XG5cbiAgICAgICAgICAgICAgICBpZih0aGlzLmhhbmRsZXJzLnJlbW92ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJlbW92ZWRJZHMgPSBfLmRpZmZlcmVuY2UoIF8ua2V5cyh0aGlzLm1vZGVsc01hcCksIF8ua2V5cyhuZXdBc3NvYykgKTtcbiAgICAgICAgICAgICAgICAgICAgXy5lYWNoKHJlbW92ZWRJZHMsKF9pZCk9PntcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlcnMucmVtb3ZlZC5hcHBseSh0aGlzLCBbX2lkLHRoaXMubW9kZWxzTWFwW19pZF1dKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgXy5jaGFpbihuZXdBc3NvYylcbiAgICAgICAgICAgICAgICAuZWFjaCgocmVzdWx0KT0+e1xuICAgICAgICAgICAgICAgICAgICBsZXQgcmF3UmVzdWx0ID0gIG5ld0Fzc29jW1N0cmluZyhyZXN1bHQuX2lkKV07XG4gICAgICAgICAgICAgICAgICAgIGxldCBfaWQgPSBfLmlzU3RyaW5nKHJlc3VsdC5faWQpP3Jlc3VsdC5faWQ6U3RyaW5nKHJlc3VsdC5faWQpO1xuICAgICAgICAgICAgICAgICAgICBuZXdBc3NvY1tfaWRdID0gcmF3UmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICBsZXQgb2xkTW9kZWwgPSB0aGlzLm1vZGVsc01hcFtfaWRdO1xuICAgICAgICAgICAgICAgICAgICBpZighb2xkTW9kZWwmJnRoaXMuaGFuZGxlcnMuYWRkZWQpe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVycy5hZGRlZC5hcHBseSh0aGlzLCBbcmVzdWx0Ll9pZCxyZXN1bHRdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiggb2xkTW9kZWwgJiYgdGhpcy5oYW5kbGVycy5jaGFuZ2VkICYmICFFSlNPTi5lcXVhbHMob2xkTW9kZWwsIHJhd1Jlc3VsdCkpe1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGNoYW5nZWRGaWVsZHMgPSBEaWZmU2VxdWVuY2UubWFrZUNoYW5nZWRGaWVsZHMocmF3UmVzdWx0LCBvbGRNb2RlbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiggIV8uaXNFbXB0eShjaGFuZ2VkRmllbGRzKSAgKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZXJzLmNoYW5nZWQuYXBwbHkodGhpcywgW3Jlc3VsdC5faWQsY2hhbmdlZEZpZWxkcyxyZXN1bHRdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5tb2RlbHNNYXAgPSBuZXdBc3NvYztcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ3JlZnJlc2gnLERhdGUubm93KCktc3RhcnRlZCk7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH0pO1xuXG5cbiAgICAgICAgfSwxICk7XG5cbiAgICAgICAgdGhpcy5wb2xsaW5nSW50ZXJ2YWxNcyA9IG9wdGlvbnMucG9sbGluZ0ludGVydmFsTXMgfHwgNjAwMDA7XG4gICAgICAgIHRoaXMucG9sbGluZ1Rocm90dGxlTXMgPSBvcHRpb25zLnBvbGxpbmdUaHJvdHRsZU1zIHx8IDEwMDA7XG4gICAgfVxuXG4gICAgc2NoZWR1bGVSZWZyZXNoKHRhc2spe1xuICAgICAgICAvL2NvbnNvbGUubG9nKCdzaGVkdWxlUmVmcmVzaCBsZW5ndGg6Jyx0aGlzLnF1ZXVlLmxlbmd0aCgpLCdydW5uaW5nOicsdGhpcy5xdWV1ZS5ydW5uaW5nKCkpO1xuICAgICAgICBpZih0aGlzLnF1ZXVlLmxlbmd0aCgpPjApXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGZhbHNlKTtcbiAgICAgICAgaWYodGhpcy5xdWV1ZS5ydW5uaW5nKCk+MCAmJiAhdGhpcy5xdWVyeVN0YXJ0ZWQpXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGZhbHNlKTtcblxuICAgICAgICBsZXQgcG9sbGluZ1Rocm90dGxlTXMgPSB0aGlzLnBvbGxpbmdUaHJvdHRsZU1zO1xuICAgICAgICBpZihfLmlzRnVuY3Rpb24ocG9sbGluZ1Rocm90dGxlTXMpKXtcbiAgICAgICAgICAgIHBvbGxpbmdUaHJvdHRsZU1zID0gcG9sbGluZ1Rocm90dGxlTXMuYXBwbHkodGhpcyxbXSk7XG4gICAgICAgICAgICBpZighXy5pc051bWJlcihwb2xsaW5nVGhyb3R0bGVNcykpe1xuICAgICAgICAgICAgICAgIHBvbGxpbmdUaHJvdHRsZU1zID0gMTAwMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsZXQgZGVsYXkgPSB0aGlzLmxhc3RSZWZyZXNoZWQgPyBwb2xsaW5nVGhyb3R0bGVNcyAtICggRGF0ZS5ub3coKSAtIHRoaXMubGFzdFJlZnJlc2hlZCApIDogMDtcbiAgICAgICAgLy9jb25zb2xlLmxvZyh7ZGVsYXl9KTtcbiAgICAgICAgbGV0IHJlZnJlc2hEYXRlID0gbmV3IERhdGUoKTtcbiAgICAgICAgaWYoZGVsYXk+MCl7XG4gICAgICAgICAgICByZWZyZXNoRGF0ZSA9IG5ldyBEYXRlKERhdGUubm93KCkrZGVsYXkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKT0+e1xuICAgICAgICAgICAgdGhpcy5xdWV1ZS5wdXNoKHtyZWZyZXNoRGF0ZTpyZWZyZXNoRGF0ZX0sKCk9PntcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgb2JzZXJ2ZUNoYW5nZXMoaGFuZGxlcnMpe1xuICAgICAgICB0aGlzLmhhbmRsZXJzID0gaGFuZGxlcnM7XG4gICAgICAgIGNvbnN0IHJhd0NvbmRpdGlvbnMgPSBFSlNPTi5jbG9uZSh0aGlzLnF1ZXJ5Ll9jb25kaXRpb25zKTtcbiAgICAgICAgY29uc3Qgc2lmdFF1ZXJ5ID0gc2lmdChyYXdDb25kaXRpb25zKTtcblxuICAgICAgICBsZXQgbGlzdGVuZXIgPSAoZG9jKT0+e1xuICAgICAgICAgICAgaWYoZG9jLnR5cGU9PSdzYXZlJyYmdGhpcy5oYW5kbGVycy5hZGRlZCl7XG4gICAgICAgICAgICAgICAgbGV0IG1vbmdvb3NlTW9kZWwgPSBfLmZpcnN0KCBkb2MuYXJndW1lbnRzICk7XG4gICAgICAgICAgICAgICAgaWYobW9uZ29vc2VNb2RlbCkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgcmF3TW9kZWwgPSBFSlNPTi5jbG9uZShtb25nb29zZU1vZGVsKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNpZnRRdWVyeShyYXdNb2RlbCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNjaGVkdWxlUmVmcmVzaChyYXdNb2RlbCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoZG9jLnR5cGU9PSdyZW1vdmUnJiZ0aGlzLmhhbmRsZXJzLnJlbW92ZWQpe1xuICAgICAgICAgICAgICAgIGxldCBmaW5kZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBsZXQgc2lmdFF1ZXJ5ID0gc2lmdCggRUpTT04uY2xvbmUoXy5maXJzdCggZG9jLmFyZ3VtZW50cyApICkgKTtcbiAgICAgICAgICAgICAgICBfLmVhY2godGhpcy5tb2RlbHNNYXAsKHJhd01vZGVsKT0+e1xuICAgICAgICAgICAgICAgICAgICBpZighZmluZGVkICYmIHNpZnRRdWVyeShyYXdNb2RlbCkpe1xuICAgICAgICAgICAgICAgICAgICAgICAgZmluZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNjaGVkdWxlUmVmcmVzaChyYXdNb2RlbCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKGRvYy50eXBlPT0ndXBkYXRlJyl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2NoZWR1bGVSZWZyZXNoKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGVtaXR0ZXIub24odGhpcy5xdWVyeS5tb25nb29zZUNvbGxlY3Rpb24ubmFtZSxsaXN0ZW5lcik7XG5cbiAgICAgICAgdGhpcy5zY2hlZHVsZVJlZnJlc2goKTtcbiAgICAgICAgdGhpcy5kb1BvbGxpbmcoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZG9Qb2xsaW5nKCl7XG4gICAgICAgIGxldCBwb2xsaW5nUXVldWUgPSBuZXcgcXVldWUoYXN5bmMgKHRhc2ssY2FsbGJhY2spPT57XG4gICAgICAgICAgICBpZighdGhpcy5sYXN0UmVmcmVzaGVkKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgZGVsYXllZFByb21pc2UoMTAwKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sgKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgcG9sbGluZ0ludGVydmFsTXMgPSBfLmlzRnVuY3Rpb24odGhpcy5wb2xsaW5nSW50ZXJ2YWxNcyk/dGhpcy5wb2xsaW5nSW50ZXJ2YWxNcy5hcHBseSh0aGlzKTp0aGlzLnBvbGxpbmdJbnRlcnZhbE1zO1xuICAgICAgICAgICAgaWYoIV8uaXNOdW1iZXIocG9sbGluZ0ludGVydmFsTXMpKXtcbiAgICAgICAgICAgICAgICBwb2xsaW5nSW50ZXJ2YWxNcyA9IDYwMDAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IHRpbWVvdXQgPSBwb2xsaW5nSW50ZXJ2YWxNcyAtICggRGF0ZS5ub3coKSAtIHRoaXMubGFzdFJlZnJlc2hlZCApO1xuICAgICAgICAgICAgaWYodGltZW91dD4wKXtcbiAgICAgICAgICAgICAgICBhd2FpdCBkZWxheWVkUHJvbWlzZSh0aW1lb3V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKCF0aGlzLnN0b3BwZWQpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnNjaGVkdWxlUmVmcmVzaCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgfSwxKTtcblxuICAgICAgICBwb2xsaW5nUXVldWUucHVzaChudWxsKTtcblxuICAgICAgICBwb2xsaW5nUXVldWUuZHJhaW4oKCk9PntcbiAgICAgICAgICAgIGlmKCF0aGlzLnN0b3BwZWQpIHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpPT57XG4gICAgICAgICAgICAgICAgICAgIHBvbGxpbmdRdWV1ZS5wdXNoKG51bGwpO1xuICAgICAgICAgICAgICAgIH0sMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIG1vZGVscygpe1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpPT57XG4gICAgICAgICAgICBsZXQgb25SZWFkeSA9ICgpPT57XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShfLnZhbHVlcyh0aGlzLm1vZGVsc01hcCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYodGhpcy53YXNSZWZyZXNoZWQpXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9uUmVhZHkoKTtcbiAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgdGhpcy5vbmNlKCdyZWZyZXNoJyxvblJlYWR5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc3RvcCgpe1xuICAgICAgICB0aGlzLnN0b3BwZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLmVtaXQoJ3N0b3AnKTtcbiAgICB9XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgT2JzZXJ2ZUN1cnNvcjsiXX0=