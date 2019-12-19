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
                  map(function (doc) {
                    return EJSON.clone(doc.toObject({ getters: false }));
                  }).
                  indexBy('_id').
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9PYnNlcnZlQ3Vyc29yLmpzIl0sIm5hbWVzIjpbImVtaXR0ZXIiLCJFSlNPTiIsIl8iLCJzaWZ0IiwicXVldWUiLCJEaWZmU2VxdWVuY2UiLCJFdmVudEVtaXR0ZXIiLCJkZWxheWVkUHJvbWlzZSIsInRpbWVvdXQiLCJQcm9taXNlIiwicmVzb2x2ZSIsInNldFRpbWVvdXQiLCJPYnNlcnZlQ3Vyc29yIiwicXVlcnkiLCJvcHRpb25zIiwic2V0TWF4TGlzdGVuZXJzIiwiaGFuZGxlcnMiLCJtb2RlbHNNYXAiLCJsYXN0UmVmcmVzaGVkIiwic3RvcHBlZCIsIndhc1JlZnJlc2hlZCIsIm9uY2UiLCJ0YXNrIiwiY2FsbGJhY2siLCJxdWVyeVN0YXJ0ZWQiLCJkZWxheSIsInJlZnJlc2hEYXRlIiwiRGF0ZSIsIm5vdyIsInN0YXJ0ZWQiLCJleGVjIiwiZXJyIiwicmVzdWx0cyIsImNvbnNvbGUiLCJsb2ciLCJuZXdBc3NvYyIsImNoYWluIiwibWFwIiwiZG9jIiwiY2xvbmUiLCJ0b09iamVjdCIsImdldHRlcnMiLCJpbmRleEJ5IiwidmFsdWUiLCJyZW1vdmVkIiwicmVtb3ZlZElkcyIsImRpZmZlcmVuY2UiLCJrZXlzIiwiZWFjaCIsIl9pZCIsImFwcGx5IiwicmVzdWx0IiwicmF3UmVzdWx0IiwiU3RyaW5nIiwiaXNTdHJpbmciLCJvbGRNb2RlbCIsImFkZGVkIiwiY2hhbmdlZCIsImVxdWFscyIsImNoYW5nZWRGaWVsZHMiLCJtYWtlQ2hhbmdlZEZpZWxkcyIsImlzRW1wdHkiLCJlbWl0IiwicG9sbGluZ0ludGVydmFsTXMiLCJwb2xsaW5nVGhyb3R0bGVNcyIsImxlbmd0aCIsInJ1bm5pbmciLCJpc0Z1bmN0aW9uIiwiaXNOdW1iZXIiLCJwdXNoIiwicmF3Q29uZGl0aW9ucyIsIl9jb25kaXRpb25zIiwic2lmdFF1ZXJ5IiwibGlzdGVuZXIiLCJ0eXBlIiwibW9uZ29vc2VNb2RlbCIsImZpcnN0IiwiYXJndW1lbnRzIiwicmF3TW9kZWwiLCJzY2hlZHVsZVJlZnJlc2giLCJmaW5kZWQiLCJvbiIsIm1vbmdvb3NlQ29sbGVjdGlvbiIsIm5hbWUiLCJkb1BvbGxpbmciLCJwb2xsaW5nUXVldWUiLCJkcmFpbiIsIm9uUmVhZHkiLCJ2YWx1ZXMiXSwibWFwcGluZ3MiOiJxa0RBQUEsb0MsSUFBT0EsTztBQUNQLDhCLElBQU9DLEs7QUFDUCx3QyxJQUFPQyxDO0FBQ1AsNEIsSUFBT0MsSTtBQUNQLG9DLElBQU9DLEs7QUFDUCw4QyxJQUFPQyxZO0FBQ1AsZ0MsSUFBUUMsWSxXQUFBQSxZOztBQUVSLFNBQVNDLGNBQVQsQ0FBd0JDLE9BQXhCLEVBQWdDO0FBQzVCLE1BQUdBLE9BQU8sSUFBRSxDQUFaO0FBQ0ksU0FBT0MsT0FBTyxDQUFDQyxPQUFSLEVBQVA7QUFDSixTQUFPLElBQUlELE9BQUosQ0FBWSxVQUFDQyxPQUFELEVBQVc7QUFDMUJDLElBQUFBLFVBQVUsQ0FBQ0QsT0FBRCxFQUFTRixPQUFULENBQVY7QUFDSCxHQUZNLENBQVA7QUFHSCxDOztBQUVLSSxhO0FBQ0YseUJBQVlDLEtBQVosRUFBNkIsZUFBWEMsT0FBVyx1RUFBSCxFQUFHO0FBQ3pCO0FBQ0EsVUFBS0MsZUFBTCxDQUFxQixDQUFyQjtBQUNBLFVBQUtGLEtBQUwsR0FBYUEsS0FBYjtBQUNBLFVBQUtHLFFBQUwsR0FBZ0IsSUFBaEI7QUFDQSxVQUFLQyxTQUFMLEdBQWlCLEVBQWpCO0FBQ0EsVUFBS0MsYUFBTCxHQUFxQixDQUFyQjtBQUNBLFVBQUtDLE9BQUwsR0FBZSxLQUFmO0FBQ0EsVUFBS0MsWUFBTCxHQUFvQixLQUFwQjtBQUNBLFVBQUtDLElBQUwsQ0FBVSxTQUFWLEVBQW9CLFlBQUk7QUFDcEIsWUFBS0QsWUFBTCxHQUFvQixJQUFwQjtBQUNILEtBRkQ7O0FBSUEsVUFBS2hCLEtBQUwsR0FBYUEsS0FBSyxnR0FBQyxpQkFBT2tCLElBQVAsRUFBYUMsUUFBYjtBQUNmLHNCQUFLQyxZQUFMLEdBQW9CLEtBQXBCO0FBQ0lDLGdCQUFBQSxLQUZXLEdBRUhILElBQUksQ0FBQ0ksV0FBTCxHQUFpQkMsSUFBSSxDQUFDQyxHQUFMLEVBRmQ7QUFHWkgsZ0JBQUFBLEtBQUssR0FBQyxDQUhNO0FBSUwsc0JBQUloQixPQUFKLENBQVksVUFBQ0MsT0FBRCxFQUFXO0FBQ3pCQyxvQkFBQUEsVUFBVSxDQUFDLFlBQVU7QUFDakJELHNCQUFBQSxPQUFPO0FBQ1YscUJBRlMsRUFFUmUsS0FGUSxDQUFWO0FBR0gsbUJBSkssQ0FKSzs7O0FBV2Ysc0JBQUtELFlBQUwsR0FBb0IsSUFBcEI7QUFDSUssZ0JBQUFBLE9BWlcsR0FZREYsSUFBSSxDQUFDQyxHQUFMLEVBWkM7QUFhZixzQkFBS2YsS0FBTCxDQUFXaUIsSUFBWCxDQUFnQixVQUFDQyxHQUFELEVBQUtDLE9BQUwsRUFBZTtBQUMzQix3QkFBS1IsWUFBTCxHQUFvQixLQUFwQjtBQUNBLHdCQUFLTixhQUFMLEdBQXFCUyxJQUFJLENBQUNDLEdBQUwsRUFBckI7QUFDQUssa0JBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLHdCQUFaO0FBQ0Esc0JBQUdILEdBQUg7QUFDSSx5QkFBT1IsUUFBUSxFQUFmLENBTHVCLENBS0w7QUFDdEIsc0JBQUlZLFFBQVEsR0FBR2pDLENBQUMsQ0FBQ2tDLEtBQUYsQ0FBUUosT0FBUjtBQUNWSyxrQkFBQUEsR0FEVSxDQUNOLFVBQUNDLEdBQUQsRUFBTztBQUNSLDJCQUFPckMsS0FBSyxDQUFDc0MsS0FBTixDQUFhRCxHQUFHLENBQUNFLFFBQUosQ0FBYSxFQUFFQyxPQUFPLEVBQUUsS0FBWCxFQUFiLENBQWIsQ0FBUDtBQUNILG1CQUhVO0FBSVZDLGtCQUFBQSxPQUpVLENBSUYsS0FKRTtBQUtWQyxrQkFBQUEsS0FMVSxFQUFmOztBQU9BLHNCQUFHLE1BQUszQixRQUFMLENBQWM0QixPQUFqQixFQUEwQjtBQUN0Qix3QkFBSUMsVUFBVSxHQUFHM0MsQ0FBQyxDQUFDNEMsVUFBRixDQUFjNUMsQ0FBQyxDQUFDNkMsSUFBRixDQUFPLE1BQUs5QixTQUFaLENBQWQsRUFBc0NmLENBQUMsQ0FBQzZDLElBQUYsQ0FBT1osUUFBUCxDQUF0QyxDQUFqQjtBQUNBakMsb0JBQUFBLENBQUMsQ0FBQzhDLElBQUYsQ0FBT0gsVUFBUCxFQUFrQixVQUFDSSxHQUFELEVBQU87QUFDckIsNEJBQUtqQyxRQUFMLENBQWM0QixPQUFkLENBQXNCTSxLQUF0QixnQ0FBa0MsQ0FBQ0QsR0FBRCxFQUFLLE1BQUtoQyxTQUFMLENBQWVnQyxHQUFmLENBQUwsQ0FBbEM7QUFDSCxxQkFGRDtBQUdIOztBQUVEL0Msa0JBQUFBLENBQUMsQ0FBQ2tDLEtBQUYsQ0FBUUQsUUFBUjtBQUNLYSxrQkFBQUEsSUFETCxDQUNVLFVBQUNHLE1BQUQsRUFBVTtBQUNaLHdCQUFJQyxTQUFTLEdBQUlqQixRQUFRLENBQUNrQixNQUFNLENBQUNGLE1BQU0sQ0FBQ0YsR0FBUixDQUFQLENBQXpCO0FBQ0Esd0JBQUlBLEdBQUcsR0FBRy9DLENBQUMsQ0FBQ29ELFFBQUYsQ0FBV0gsTUFBTSxDQUFDRixHQUFsQixJQUF1QkUsTUFBTSxDQUFDRixHQUE5QixHQUFrQ0ksTUFBTSxDQUFDRixNQUFNLENBQUNGLEdBQVIsQ0FBbEQ7QUFDQWQsb0JBQUFBLFFBQVEsQ0FBQ2MsR0FBRCxDQUFSLEdBQWdCRyxTQUFoQjtBQUNBLHdCQUFJRyxRQUFRLEdBQUcsTUFBS3RDLFNBQUwsQ0FBZWdDLEdBQWYsQ0FBZjtBQUNBLHdCQUFHLENBQUNNLFFBQUQsSUFBVyxNQUFLdkMsUUFBTCxDQUFjd0MsS0FBNUIsRUFBa0M7QUFDOUIsNEJBQUt4QyxRQUFMLENBQWN3QyxLQUFkLENBQW9CTixLQUFwQixnQ0FBZ0MsQ0FBQ0MsTUFBTSxDQUFDRixHQUFSLEVBQVlFLE1BQVosQ0FBaEM7QUFDSDtBQUNELHdCQUFJSSxRQUFRLElBQUksTUFBS3ZDLFFBQUwsQ0FBY3lDLE9BQTFCLElBQXFDLENBQUN4RCxLQUFLLENBQUN5RCxNQUFOLENBQWFILFFBQWIsRUFBdUJILFNBQXZCLENBQTFDLEVBQTRFO0FBQ3hFLDBCQUFJTyxhQUFhLEdBQUd0RCxZQUFZLENBQUN1RCxpQkFBYixDQUErQlIsU0FBL0IsRUFBMENHLFFBQTFDLENBQXBCO0FBQ0EsMEJBQUksQ0FBQ3JELENBQUMsQ0FBQzJELE9BQUYsQ0FBVUYsYUFBVixDQUFMLEVBQWdDO0FBQzVCLDhCQUFLM0MsUUFBTCxDQUFjeUMsT0FBZCxDQUFzQlAsS0FBdEIsZ0NBQWtDLENBQUNDLE1BQU0sQ0FBQ0YsR0FBUixFQUFZVSxhQUFaLEVBQTBCUixNQUExQixDQUFsQztBQUNIO0FBQ0o7QUFDSixtQkFmTDs7QUFpQkEsd0JBQUtsQyxTQUFMLEdBQWlCa0IsUUFBakI7QUFDQSx3QkFBSzJCLElBQUwsQ0FBVSxTQUFWLEVBQW9CbkMsSUFBSSxDQUFDQyxHQUFMLEtBQVdDLE9BQS9CO0FBQ0FOLGtCQUFBQSxRQUFRO0FBQ1gsaUJBeENELEVBYmUsd0RBQUQ7OztBQXdEaEIsS0F4RGdCLENBQWxCOztBQTBEQSxVQUFLd0MsaUJBQUwsR0FBeUJqRCxPQUFPLENBQUNpRCxpQkFBUixJQUE2QixLQUF0RDtBQUNBLFVBQUtDLGlCQUFMLEdBQXlCbEQsT0FBTyxDQUFDa0QsaUJBQVIsSUFBNkIsSUFBdEQsQ0F4RXlCO0FBeUU1QixHOztBQUVlMUMsSUFBQUEsSSxFQUFLO0FBQ2pCO0FBQ0EsVUFBRyxLQUFLbEIsS0FBTCxDQUFXNkQsTUFBWCxLQUFvQixDQUF2QjtBQUNJLGFBQU94RCxPQUFPLENBQUNDLE9BQVIsQ0FBZ0IsS0FBaEIsQ0FBUDtBQUNKLFVBQUcsS0FBS04sS0FBTCxDQUFXOEQsT0FBWCxLQUFxQixDQUFyQixJQUEwQixDQUFDLEtBQUsxQyxZQUFuQztBQUNJLGFBQU9mLE9BQU8sQ0FBQ0MsT0FBUixDQUFnQixLQUFoQixDQUFQOztBQUVKLFVBQUlzRCxpQkFBaUIsR0FBRyxLQUFLQSxpQkFBN0I7QUFDQSxVQUFHOUQsQ0FBQyxDQUFDaUUsVUFBRixDQUFhSCxpQkFBYixDQUFILEVBQW1DO0FBQy9CQSxRQUFBQSxpQkFBaUIsR0FBR0EsaUJBQWlCLENBQUNkLEtBQWxCLENBQXdCLElBQXhCLEVBQTZCLEVBQTdCLENBQXBCO0FBQ0EsWUFBRyxDQUFDaEQsQ0FBQyxDQUFDa0UsUUFBRixDQUFXSixpQkFBWCxDQUFKLEVBQWtDO0FBQzlCQSxVQUFBQSxpQkFBaUIsR0FBRyxJQUFwQjtBQUNIO0FBQ0o7QUFDRCxVQUFJdkMsS0FBSyxHQUFHLEtBQUtQLGFBQUwsR0FBcUI4QyxpQkFBaUIsSUFBS3JDLElBQUksQ0FBQ0MsR0FBTCxLQUFhLEtBQUtWLGFBQXZCLENBQXRDLEdBQStFLENBQTNGO0FBQ0E7QUFDQSxVQUFJUSxXQUFXLEdBQUcsSUFBSUMsSUFBSixFQUFsQjtBQUNBLFVBQUdGLEtBQUssR0FBQyxDQUFULEVBQVc7QUFDUEMsUUFBQUEsV0FBVyxHQUFHLElBQUlDLElBQUosQ0FBU0EsSUFBSSxDQUFDQyxHQUFMLEtBQVdILEtBQXBCLENBQWQ7QUFDSDs7QUFFRCxhQUFPLElBQUloQixPQUFKLENBQVksVUFBQ0MsT0FBRCxFQUFXO0FBQzFCLFFBQUEsTUFBSSxDQUFDTixLQUFMLENBQVdpRSxJQUFYLENBQWdCLEVBQUMzQyxXQUFXLEVBQUNBLFdBQWIsRUFBaEIsRUFBMEMsWUFBSTtBQUMxQ2hCLFVBQUFBLE9BQU87QUFDVixTQUZEO0FBR0gsT0FKTSxDQUFQO0FBS0gsSzs7QUFFY00sSUFBQUEsUSxFQUFTO0FBQ3BCLFdBQUtBLFFBQUwsR0FBZ0JBLFFBQWhCO0FBQ0EsVUFBTXNELGFBQWEsR0FBR3JFLEtBQUssQ0FBQ3NDLEtBQU4sQ0FBWSxLQUFLMUIsS0FBTCxDQUFXMEQsV0FBdkIsQ0FBdEI7QUFDQSxVQUFNQyxTQUFTLEdBQUdyRSxJQUFJLENBQUNtRSxhQUFELENBQXRCOztBQUVBLFVBQUlHLFFBQVEsR0FBRyxTQUFYQSxRQUFXLENBQUNuQyxHQUFELEVBQU87QUFDbEIsWUFBR0EsR0FBRyxDQUFDb0MsSUFBSixJQUFVLE1BQVYsSUFBa0IsTUFBSSxDQUFDMUQsUUFBTCxDQUFjd0MsS0FBbkMsRUFBeUM7QUFDckMsY0FBSW1CLGFBQWEsR0FBR3pFLENBQUMsQ0FBQzBFLEtBQUYsQ0FBU3RDLEdBQUcsQ0FBQ3VDLFNBQWIsQ0FBcEI7QUFDQSxjQUFHRixhQUFILEVBQWtCO0FBQ2QsZ0JBQUlHLFFBQVEsR0FBRzdFLEtBQUssQ0FBQ3NDLEtBQU4sQ0FBWW9DLGFBQVosQ0FBZjtBQUNBLGdCQUFJSCxTQUFTLENBQUNNLFFBQUQsQ0FBYixFQUF5QjtBQUNyQixxQkFBTyxNQUFJLENBQUNDLGVBQUwsQ0FBcUJELFFBQXJCLENBQVA7QUFDSDtBQUNKO0FBQ0Q7QUFDSDtBQUNELFlBQUd4QyxHQUFHLENBQUNvQyxJQUFKLElBQVUsUUFBVixJQUFvQixNQUFJLENBQUMxRCxRQUFMLENBQWM0QixPQUFyQyxFQUE2QztBQUN6QyxjQUFJb0MsTUFBTSxHQUFHLEtBQWI7QUFDQSxjQUFJUixVQUFTLEdBQUdyRSxJQUFJLENBQUVGLEtBQUssQ0FBQ3NDLEtBQU4sQ0FBWXJDLENBQUMsQ0FBQzBFLEtBQUYsQ0FBU3RDLEdBQUcsQ0FBQ3VDLFNBQWIsQ0FBWixDQUFGLENBQXBCO0FBQ0EzRSxVQUFBQSxDQUFDLENBQUM4QyxJQUFGLENBQU8sTUFBSSxDQUFDL0IsU0FBWixFQUFzQixVQUFDNkQsUUFBRCxFQUFZO0FBQzlCLGdCQUFHLENBQUNFLE1BQUQsSUFBV1IsVUFBUyxDQUFDTSxRQUFELENBQXZCLEVBQWtDO0FBQzlCRSxjQUFBQSxNQUFNLEdBQUcsSUFBVDtBQUNBLHFCQUFPLE1BQUksQ0FBQ0QsZUFBTCxDQUFxQkQsUUFBckIsQ0FBUDtBQUNIO0FBQ0osV0FMRDtBQU1BO0FBQ0g7O0FBRUQsWUFBR3hDLEdBQUcsQ0FBQ29DLElBQUosSUFBVSxRQUFiLEVBQXNCO0FBQ2xCLGlCQUFPLE1BQUksQ0FBQ0ssZUFBTCxFQUFQO0FBQ0g7QUFDSixPQTFCRDtBQTJCQS9FLE1BQUFBLE9BQU8sQ0FBQ2lGLEVBQVIsQ0FBVyxLQUFLcEUsS0FBTCxDQUFXcUUsa0JBQVgsQ0FBOEJDLElBQXpDLEVBQThDVixRQUE5Qzs7QUFFQSxXQUFLTSxlQUFMO0FBQ0EsV0FBS0ssU0FBTDtBQUNBLGFBQU8sSUFBUDtBQUNILEs7O0FBRVU7QUFDUCxVQUFJQyxZQUFZLEdBQUcsSUFBSWpGLEtBQUosaUdBQVUsa0JBQU9rQixJQUFQLEVBQVlDLFFBQVo7QUFDckIsa0JBQUEsTUFBSSxDQUFDTCxhQURnQjtBQUVmWCxvQkFBQUEsY0FBYyxDQUFDLEdBQUQsQ0FGQztBQUdkZ0Isa0JBQUFBLFFBQVEsRUFITTs7QUFLckJ3QyxrQkFBQUEsaUJBTHFCLEdBS0Q3RCxDQUFDLENBQUNpRSxVQUFGLENBQWEsTUFBSSxDQUFDSixpQkFBbEIsSUFBcUMsTUFBSSxDQUFDQSxpQkFBTCxDQUF1QmIsS0FBdkIsQ0FBNkIsTUFBN0IsQ0FBckMsR0FBd0UsTUFBSSxDQUFDYSxpQkFMNUU7QUFNekIsc0JBQUcsQ0FBQzdELENBQUMsQ0FBQ2tFLFFBQUYsQ0FBV0wsaUJBQVgsQ0FBSixFQUFrQztBQUM5QkEsb0JBQUFBLGlCQUFpQixHQUFHLEtBQXBCO0FBQ0g7QUFDR3ZELGtCQUFBQSxPQVRxQixHQVNYdUQsaUJBQWlCLElBQUtwQyxJQUFJLENBQUNDLEdBQUwsS0FBYSxNQUFJLENBQUNWLGFBQXZCLENBVE47QUFVdEJWLGtCQUFBQSxPQUFPLEdBQUMsQ0FWYztBQVdmRCxvQkFBQUEsY0FBYyxDQUFDQyxPQUFELENBWEM7O0FBYXJCLGtCQUFBLE1BQUksQ0FBQ1csT0FiZ0I7QUFjZixvQkFBQSxNQUFJLENBQUM0RCxlQUFMLEVBZGU7O0FBZ0J6QnhELGtCQUFBQSxRQUFRLEdBaEJpQiwyREFBVjtBQWlCakIsT0FqQmlCLENBQW5COztBQW1CQThELE1BQUFBLFlBQVksQ0FBQ2hCLElBQWIsQ0FBa0IsSUFBbEI7O0FBRUFnQixNQUFBQSxZQUFZLENBQUNDLEtBQWIsQ0FBbUIsWUFBSTtBQUNuQixZQUFHLENBQUMsTUFBSSxDQUFDbkUsT0FBVCxFQUFrQjtBQUNkUixVQUFBQSxVQUFVLENBQUMsWUFBSTtBQUNYMEUsWUFBQUEsWUFBWSxDQUFDaEIsSUFBYixDQUFrQixJQUFsQjtBQUNILFdBRlMsRUFFUixDQUZRLENBQVY7QUFHSDtBQUNKLE9BTkQ7QUFPSCxLOztBQUVPO0FBQ0osYUFBTyxJQUFJNUQsT0FBSixDQUFZLFVBQUNDLE9BQUQsRUFBVztBQUMxQixZQUFJNkUsT0FBTyxHQUFHLFNBQVZBLE9BQVUsR0FBSTtBQUNkN0UsVUFBQUEsT0FBTyxDQUFDUixDQUFDLENBQUNzRixNQUFGLENBQVMsTUFBSSxDQUFDdkUsU0FBZCxDQUFELENBQVA7QUFDSCxTQUZEO0FBR0EsWUFBRyxNQUFJLENBQUNHLFlBQVI7QUFDSSxlQUFPbUUsT0FBTyxFQUFkLENBREo7QUFFSTtBQUNBLFVBQUEsTUFBSSxDQUFDbEUsSUFBTCxDQUFVLFNBQVYsRUFBb0JrRSxPQUFwQjtBQUNIO0FBQ0osT0FUTSxDQUFQO0FBVUgsSzs7QUFFSztBQUNGLFdBQUtwRSxPQUFMLEdBQWUsSUFBZjtBQUNBLFdBQUsyQyxJQUFMLENBQVUsTUFBVjtBQUNILEssNEJBOUx1QnhELFk7Ozs7QUFrTWJNLGEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZW1pdHRlciBmcm9tIFwiLi9lbWl0dGVyXCI7XG5pbXBvcnQgRUpTT04gZnJvbSAnZWpzb24nO1xuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5pbXBvcnQgc2lmdCBmcm9tICdzaWZ0JztcbmltcG9ydCBxdWV1ZSBmcm9tICdhc3luYy9xdWV1ZSc7XG5pbXBvcnQgRGlmZlNlcXVlbmNlIGZyb20gXCIuL0RpZmZTZXF1ZW5jZVwiO1xuaW1wb3J0IHtFdmVudEVtaXR0ZXJ9IGZyb20gJ2V2ZW50cyc7XG5cbmZ1bmN0aW9uIGRlbGF5ZWRQcm9taXNlKHRpbWVvdXQpe1xuICAgIGlmKHRpbWVvdXQ8PTApXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpPT57XG4gICAgICAgIHNldFRpbWVvdXQocmVzb2x2ZSx0aW1lb3V0KTtcbiAgICB9KTtcbn1cblxuY2xhc3MgT2JzZXJ2ZUN1cnNvciBleHRlbmRzIEV2ZW50RW1pdHRlcntcbiAgICBjb25zdHJ1Y3RvcihxdWVyeSxvcHRpb25zPXt9KXtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5zZXRNYXhMaXN0ZW5lcnMoMCk7XG4gICAgICAgIHRoaXMucXVlcnkgPSBxdWVyeTtcbiAgICAgICAgdGhpcy5oYW5kbGVycyA9IG51bGw7XG4gICAgICAgIHRoaXMubW9kZWxzTWFwID0ge307XG4gICAgICAgIHRoaXMubGFzdFJlZnJlc2hlZCA9IDA7XG4gICAgICAgIHRoaXMuc3RvcHBlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLndhc1JlZnJlc2hlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLm9uY2UoJ3JlZnJlc2gnLCgpPT57XG4gICAgICAgICAgICB0aGlzLndhc1JlZnJlc2hlZCA9IHRydWU7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMucXVldWUgPSBxdWV1ZShhc3luYyAodGFzaywgY2FsbGJhY2spPT4ge1xuICAgICAgICAgICAgdGhpcy5xdWVyeVN0YXJ0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIGxldCBkZWxheSA9IHRhc2sucmVmcmVzaERhdGUtRGF0ZS5ub3coKSA7XG4gICAgICAgICAgICBpZihkZWxheT4wKXtcbiAgICAgICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSk9PntcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9LGRlbGF5KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5xdWVyeVN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgbGV0IHN0YXJ0ZWQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgdGhpcy5xdWVyeS5leGVjKChlcnIscmVzdWx0cyk9PntcbiAgICAgICAgICAgICAgICB0aGlzLnF1ZXJ5U3RhcnRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHRoaXMubGFzdFJlZnJlc2hlZCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3JlZnJlc2ggcXVlcnkgZXhlYyBlbmQnKTtcbiAgICAgICAgICAgICAgICBpZihlcnIpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpOy8vVE9ETyBlcnJvciBoYW5kbGVcbiAgICAgICAgICAgICAgICBsZXQgbmV3QXNzb2MgPSBfLmNoYWluKHJlc3VsdHMpXG4gICAgICAgICAgICAgICAgICAgIC5tYXAoKGRvYyk9PntcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBFSlNPTi5jbG9uZSggZG9jLnRvT2JqZWN0KHsgZ2V0dGVyczogZmFsc2UgfSkgKTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLmluZGV4QnkoJ19pZCcpXG4gICAgICAgICAgICAgICAgICAgIC52YWx1ZSgpO1xuXG4gICAgICAgICAgICAgICAgaWYodGhpcy5oYW5kbGVycy5yZW1vdmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCByZW1vdmVkSWRzID0gXy5kaWZmZXJlbmNlKCBfLmtleXModGhpcy5tb2RlbHNNYXApLCBfLmtleXMobmV3QXNzb2MpICk7XG4gICAgICAgICAgICAgICAgICAgIF8uZWFjaChyZW1vdmVkSWRzLChfaWQpPT57XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZXJzLnJlbW92ZWQuYXBwbHkodGhpcywgW19pZCx0aGlzLm1vZGVsc01hcFtfaWRdXSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIF8uY2hhaW4obmV3QXNzb2MpXG4gICAgICAgICAgICAgICAgICAgIC5lYWNoKChyZXN1bHQpPT57XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgcmF3UmVzdWx0ID0gIG5ld0Fzc29jW1N0cmluZyhyZXN1bHQuX2lkKV07XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgX2lkID0gXy5pc1N0cmluZyhyZXN1bHQuX2lkKT9yZXN1bHQuX2lkOlN0cmluZyhyZXN1bHQuX2lkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0Fzc29jW19pZF0gPSByYXdSZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgb2xkTW9kZWwgPSB0aGlzLm1vZGVsc01hcFtfaWRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYoIW9sZE1vZGVsJiZ0aGlzLmhhbmRsZXJzLmFkZGVkKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZXJzLmFkZGVkLmFwcGx5KHRoaXMsIFtyZXN1bHQuX2lkLHJlc3VsdF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoIG9sZE1vZGVsICYmIHRoaXMuaGFuZGxlcnMuY2hhbmdlZCAmJiAhRUpTT04uZXF1YWxzKG9sZE1vZGVsLCByYXdSZXN1bHQpKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgY2hhbmdlZEZpZWxkcyA9IERpZmZTZXF1ZW5jZS5tYWtlQ2hhbmdlZEZpZWxkcyhyYXdSZXN1bHQsIG9sZE1vZGVsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiggIV8uaXNFbXB0eShjaGFuZ2VkRmllbGRzKSAgKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVycy5jaGFuZ2VkLmFwcGx5KHRoaXMsIFtyZXN1bHQuX2lkLGNoYW5nZWRGaWVsZHMscmVzdWx0XSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIHRoaXMubW9kZWxzTWFwID0gbmV3QXNzb2M7XG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdyZWZyZXNoJyxEYXRlLm5vdygpLXN0YXJ0ZWQpO1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICB9KTtcblxuXG4gICAgICAgIH0sMSApO1xuXG4gICAgICAgIHRoaXMucG9sbGluZ0ludGVydmFsTXMgPSBvcHRpb25zLnBvbGxpbmdJbnRlcnZhbE1zIHx8IDYwMDAwO1xuICAgICAgICB0aGlzLnBvbGxpbmdUaHJvdHRsZU1zID0gb3B0aW9ucy5wb2xsaW5nVGhyb3R0bGVNcyB8fCAxMDAwO1xuICAgIH1cblxuICAgIHNjaGVkdWxlUmVmcmVzaCh0YXNrKXtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnc2hlZHVsZVJlZnJlc2ggbGVuZ3RoOicsdGhpcy5xdWV1ZS5sZW5ndGgoKSwncnVubmluZzonLHRoaXMucXVldWUucnVubmluZygpKTtcbiAgICAgICAgaWYodGhpcy5xdWV1ZS5sZW5ndGgoKT4wKVxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShmYWxzZSk7XG4gICAgICAgIGlmKHRoaXMucXVldWUucnVubmluZygpPjAgJiYgIXRoaXMucXVlcnlTdGFydGVkKVxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShmYWxzZSk7XG5cbiAgICAgICAgbGV0IHBvbGxpbmdUaHJvdHRsZU1zID0gdGhpcy5wb2xsaW5nVGhyb3R0bGVNcztcbiAgICAgICAgaWYoXy5pc0Z1bmN0aW9uKHBvbGxpbmdUaHJvdHRsZU1zKSl7XG4gICAgICAgICAgICBwb2xsaW5nVGhyb3R0bGVNcyA9IHBvbGxpbmdUaHJvdHRsZU1zLmFwcGx5KHRoaXMsW10pO1xuICAgICAgICAgICAgaWYoIV8uaXNOdW1iZXIocG9sbGluZ1Rocm90dGxlTXMpKXtcbiAgICAgICAgICAgICAgICBwb2xsaW5nVGhyb3R0bGVNcyA9IDEwMDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGRlbGF5ID0gdGhpcy5sYXN0UmVmcmVzaGVkID8gcG9sbGluZ1Rocm90dGxlTXMgLSAoIERhdGUubm93KCkgLSB0aGlzLmxhc3RSZWZyZXNoZWQgKSA6IDA7XG4gICAgICAgIC8vY29uc29sZS5sb2coe2RlbGF5fSk7XG4gICAgICAgIGxldCByZWZyZXNoRGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgICAgIGlmKGRlbGF5PjApe1xuICAgICAgICAgICAgcmVmcmVzaERhdGUgPSBuZXcgRGF0ZShEYXRlLm5vdygpK2RlbGF5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSk9PntcbiAgICAgICAgICAgIHRoaXMucXVldWUucHVzaCh7cmVmcmVzaERhdGU6cmVmcmVzaERhdGV9LCgpPT57XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIG9ic2VydmVDaGFuZ2VzKGhhbmRsZXJzKXtcbiAgICAgICAgdGhpcy5oYW5kbGVycyA9IGhhbmRsZXJzO1xuICAgICAgICBjb25zdCByYXdDb25kaXRpb25zID0gRUpTT04uY2xvbmUodGhpcy5xdWVyeS5fY29uZGl0aW9ucyk7XG4gICAgICAgIGNvbnN0IHNpZnRRdWVyeSA9IHNpZnQocmF3Q29uZGl0aW9ucyk7XG5cbiAgICAgICAgbGV0IGxpc3RlbmVyID0gKGRvYyk9PntcbiAgICAgICAgICAgIGlmKGRvYy50eXBlPT0nc2F2ZScmJnRoaXMuaGFuZGxlcnMuYWRkZWQpe1xuICAgICAgICAgICAgICAgIGxldCBtb25nb29zZU1vZGVsID0gXy5maXJzdCggZG9jLmFyZ3VtZW50cyApO1xuICAgICAgICAgICAgICAgIGlmKG1vbmdvb3NlTW9kZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJhd01vZGVsID0gRUpTT04uY2xvbmUobW9uZ29vc2VNb2RlbCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzaWZ0UXVlcnkocmF3TW9kZWwpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zY2hlZHVsZVJlZnJlc2gocmF3TW9kZWwpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGRvYy50eXBlPT0ncmVtb3ZlJyYmdGhpcy5oYW5kbGVycy5yZW1vdmVkKXtcbiAgICAgICAgICAgICAgICBsZXQgZmluZGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgbGV0IHNpZnRRdWVyeSA9IHNpZnQoIEVKU09OLmNsb25lKF8uZmlyc3QoIGRvYy5hcmd1bWVudHMgKSApICk7XG4gICAgICAgICAgICAgICAgXy5lYWNoKHRoaXMubW9kZWxzTWFwLChyYXdNb2RlbCk9PntcbiAgICAgICAgICAgICAgICAgICAgaWYoIWZpbmRlZCAmJiBzaWZ0UXVlcnkocmF3TW9kZWwpKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbmRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zY2hlZHVsZVJlZnJlc2gocmF3TW9kZWwpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZihkb2MudHlwZT09J3VwZGF0ZScpe1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNjaGVkdWxlUmVmcmVzaCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBlbWl0dGVyLm9uKHRoaXMucXVlcnkubW9uZ29vc2VDb2xsZWN0aW9uLm5hbWUsbGlzdGVuZXIpO1xuXG4gICAgICAgIHRoaXMuc2NoZWR1bGVSZWZyZXNoKCk7XG4gICAgICAgIHRoaXMuZG9Qb2xsaW5nKCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGRvUG9sbGluZygpe1xuICAgICAgICBsZXQgcG9sbGluZ1F1ZXVlID0gbmV3IHF1ZXVlKGFzeW5jICh0YXNrLGNhbGxiYWNrKT0+e1xuICAgICAgICAgICAgaWYoIXRoaXMubGFzdFJlZnJlc2hlZCkge1xuICAgICAgICAgICAgICAgIGF3YWl0IGRlbGF5ZWRQcm9taXNlKDEwMCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrICgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IHBvbGxpbmdJbnRlcnZhbE1zID0gXy5pc0Z1bmN0aW9uKHRoaXMucG9sbGluZ0ludGVydmFsTXMpP3RoaXMucG9sbGluZ0ludGVydmFsTXMuYXBwbHkodGhpcyk6dGhpcy5wb2xsaW5nSW50ZXJ2YWxNcztcbiAgICAgICAgICAgIGlmKCFfLmlzTnVtYmVyKHBvbGxpbmdJbnRlcnZhbE1zKSl7XG4gICAgICAgICAgICAgICAgcG9sbGluZ0ludGVydmFsTXMgPSA2MDAwMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCB0aW1lb3V0ID0gcG9sbGluZ0ludGVydmFsTXMgLSAoIERhdGUubm93KCkgLSB0aGlzLmxhc3RSZWZyZXNoZWQgKTtcbiAgICAgICAgICAgIGlmKHRpbWVvdXQ+MCl7XG4gICAgICAgICAgICAgICAgYXdhaXQgZGVsYXllZFByb21pc2UodGltZW91dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZighdGhpcy5zdG9wcGVkKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zY2hlZHVsZVJlZnJlc2goKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIH0sMSk7XG5cbiAgICAgICAgcG9sbGluZ1F1ZXVlLnB1c2gobnVsbCk7XG5cbiAgICAgICAgcG9sbGluZ1F1ZXVlLmRyYWluKCgpPT57XG4gICAgICAgICAgICBpZighdGhpcy5zdG9wcGVkKSB7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKT0+e1xuICAgICAgICAgICAgICAgICAgICBwb2xsaW5nUXVldWUucHVzaChudWxsKTtcbiAgICAgICAgICAgICAgICB9LDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBtb2RlbHMoKXtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKT0+e1xuICAgICAgICAgICAgbGV0IG9uUmVhZHkgPSAoKT0+e1xuICAgICAgICAgICAgICAgIHJlc29sdmUoXy52YWx1ZXModGhpcy5tb2RlbHNNYXApKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKHRoaXMud2FzUmVmcmVzaGVkKVxuICAgICAgICAgICAgICAgIHJldHVybiBvblJlYWR5KCk7XG4gICAgICAgICAgICBlbHNle1xuICAgICAgICAgICAgICAgIHRoaXMub25jZSgncmVmcmVzaCcsb25SZWFkeSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHN0b3AoKXtcbiAgICAgICAgdGhpcy5zdG9wcGVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5lbWl0KCdzdG9wJyk7XG4gICAgfVxuXG59XG5cbmV4cG9ydCBkZWZhdWx0IE9ic2VydmVDdXJzb3I7Il19