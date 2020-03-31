"use strict";var _interopRequireDefault3 = require("@babel/runtime/helpers/interopRequireDefault");var _interopRequireDefault2 = _interopRequireDefault3(require("@babel/runtime/helpers/interopRequireDefault"));Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = undefined;var _regenerator = require("@babel/runtime/regenerator");var _regeneratorRuntime = (0, _interopRequireDefault2["default"])(_regenerator)["default"];var _asyncToGenerator2 = require("@babel/runtime/helpers/asyncToGenerator");var _asyncToGenerator = (0, _interopRequireDefault2["default"])(_asyncToGenerator2)["default"];var _classCallCheck2 = require("@babel/runtime/helpers/classCallCheck");var _classCallCheck = (0, _interopRequireDefault2["default"])(_classCallCheck2)["default"];var _createClass2 = require("@babel/runtime/helpers/createClass");var _createClass = (0, _interopRequireDefault2["default"])(_createClass2)["default"];var _possibleConstructorReturn2 = require("@babel/runtime/helpers/possibleConstructorReturn");var _possibleConstructorReturn = (0, _interopRequireDefault2["default"])(_possibleConstructorReturn2)["default"];var _getPrototypeOf2 = require("@babel/runtime/helpers/getPrototypeOf");var _getPrototypeOf = (0, _interopRequireDefault2["default"])(_getPrototypeOf2)["default"];var _assertThisInitialized2 = require("@babel/runtime/helpers/assertThisInitialized");var _assertThisInitialized = (0, _interopRequireDefault2["default"])(_assertThisInitialized2)["default"];var _inherits2 = require("@babel/runtime/helpers/inherits");var _inherits = (0, _interopRequireDefault2["default"])(_inherits2)["default"];var _emitter = require("./emitter");var emitter = (0, _interopRequireDefault2["default"])(_emitter)["default"];
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
    _this.paused = false;

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
                });case 13:case "end":return _context.stop();}}}, _callee);}));return function (_x, _x2) {return _ref.apply(this, arguments);};}(),
    1);
    _this.options = options;
    _this.pollingIntervalMs = _.isNumber(options.pollingIntervalMs) ? options.pollingIntervalMs : 60000;
    _this.pollingThrottleMs = _.isNumber(options.pollingThrottleMs) ? options.pollingThrottleMs : 1000;return _this;
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
    }

    /**@param {object} handlers
       * @param {function(id:String, doc:mongoose.Document)} handlers.added
       * @param {function(id:string, changedFields:object,newDoc:mongoose.Document,oldDoc: mongoose.Document)} handlers.changed
       * @param {function(id:String, removedDoc:mongoose.Document)} handlers.removed
       * */ }, { key: "observeChanges", value: function observeChanges(
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
      this.once('stop', function () {
        emitter.removeListener(_this3.query.mongooseCollection.name, listener);
      });
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
    } }, { key: "currentModels", value: function currentModels()

    {var raw = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      return _.chain(this.modelsMap).
      values().
      map(function (model) {
        if (raw) {
          return model.toObject({ getters: false });
        }
        return model;
      }).
      value();
    } }, { key: "models", value: function models()

    {var _this5 = this;var raw = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      return new Promise(function (resolve) {
        var onReady = function onReady() {
          resolve(
          _this5.currentModels(raw));

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
    } }, { key: "pause", value: function pause()

    {
      this.paused = true;
      this.emit('paused');
    } }, { key: "awake", value: function awake()

    {
      if (this.paused) {
        this.paused = false;
        this.emit('awake');
      }
    } }]);return ObserveCursor;}(EventEmitter);exports["default"] = ObserveCursor;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9PYnNlcnZlQ3Vyc29yLmpzIl0sIm5hbWVzIjpbImVtaXR0ZXIiLCJFSlNPTiIsIl8iLCJzaWZ0IiwicXVldWUiLCJEaWZmU2VxdWVuY2UiLCJFdmVudEVtaXR0ZXIiLCJkZWxheWVkUHJvbWlzZSIsInRpbWVvdXQiLCJQcm9taXNlIiwicmVzb2x2ZSIsInNldFRpbWVvdXQiLCJPYnNlcnZlQ3Vyc29yIiwicXVlcnkiLCJvcHRpb25zIiwic2V0TWF4TGlzdGVuZXJzIiwiaGFuZGxlcnMiLCJtb2RlbHNNYXAiLCJsYXN0UmVmcmVzaGVkIiwic3RvcHBlZCIsIndhc1JlZnJlc2hlZCIsInBhdXNlZCIsIm9uY2UiLCJ0YXNrIiwiY2FsbGJhY2siLCJxdWVyeVN0YXJ0ZWQiLCJkZWxheSIsInJlZnJlc2hEYXRlIiwiRGF0ZSIsIm5vdyIsIkVycm9yIiwic3RhcnRlZCIsImV4ZWMiLCJlcnIiLCJyZXN1bHRzIiwibmV3QXNzb2MiLCJpbmRleEJ5IiwicmVtb3ZlZCIsInJlbW92ZWRJZHMiLCJkaWZmZXJlbmNlIiwia2V5cyIsImVhY2giLCJfaWQiLCJhcHBseSIsImVtaXQiLCJjaGFpbiIsInJlc3VsdCIsIm1vZGVsIiwiaWQiLCJvbGRNb2RlbCIsImFkZGVkIiwiY2hhbmdlZCIsIm9sZFJhdyIsInRvT2JqZWN0IiwiZ2V0dGVycyIsIm5ld1JhdyIsImVxdWFscyIsImNoYW5nZWRGaWVsZHMiLCJtYWtlQ2hhbmdlZEZpZWxkcyIsImlzRW1wdHkiLCJwb2xsaW5nSW50ZXJ2YWxNcyIsImlzTnVtYmVyIiwicG9sbGluZ1Rocm90dGxlTXMiLCJsZW5ndGgiLCJydW5uaW5nIiwiaXNGdW5jdGlvbiIsInB1c2giLCJyYXdDb25kaXRpb25zIiwiY2xvbmUiLCJfY29uZGl0aW9ucyIsInNpZnRRdWVyeSIsImxpc3RlbmVyIiwiZG9jIiwidHlwZSIsIm1vbmdvb3NlTW9kZWwiLCJmaXJzdCIsImFyZ3VtZW50cyIsInJhd01vZGVsIiwic2NoZWR1bGVSZWZyZXNoIiwiZmluZGVkIiwib24iLCJtb25nb29zZUNvbGxlY3Rpb24iLCJuYW1lIiwicmVtb3ZlTGlzdGVuZXIiLCJkb1BvbGxpbmciLCJwb2xsaW5nUXVldWUiLCJkcmFpbiIsInJhdyIsInZhbHVlcyIsIm1hcCIsInZhbHVlIiwib25SZWFkeSIsImN1cnJlbnRNb2RlbHMiXSwibWFwcGluZ3MiOiJvbURBQUEsb0MsSUFBT0EsTztBQUNQLDhCLElBQU9DLEs7QUFDUCx3QyxJQUFPQyxDO0FBQ1AsNEIsSUFBT0MsSTtBQUNQLG9DLElBQU9DLEs7QUFDUCw4QyxJQUFPQyxZO0FBQ1AsZ0MsSUFBUUMsWSxXQUFBQSxZOztBQUVSLFNBQVNDLGNBQVQsQ0FBd0JDLE9BQXhCLEVBQWdDO0FBQzVCLE1BQUdBLE9BQU8sSUFBRSxDQUFaO0FBQ0ksU0FBT0MsT0FBTyxDQUFDQyxPQUFSLEVBQVA7QUFDSixTQUFPLElBQUlELE9BQUosQ0FBWSxVQUFDQyxPQUFELEVBQVc7QUFDMUJDLElBQUFBLFVBQVUsQ0FBQ0QsT0FBRCxFQUFTRixPQUFULENBQVY7QUFDSCxHQUZNLENBQVA7QUFHSCxDOzs7QUFHb0JJLGE7QUFDakIseUJBQVlDLEtBQVosRUFBNkIsZUFBWEMsT0FBVyx1RUFBSCxFQUFHO0FBQ3pCO0FBQ0EsVUFBS0MsZUFBTCxDQUFxQixDQUFyQjtBQUNBLFVBQUtGLEtBQUwsR0FBYUEsS0FBYjtBQUNBLFVBQUtHLFFBQUwsR0FBZ0IsSUFBaEI7QUFDQSxVQUFLQyxTQUFMLEdBQWlCLEVBQWpCO0FBQ0EsVUFBS0MsYUFBTCxHQUFxQixDQUFyQjtBQUNBLFVBQUtDLE9BQUwsR0FBZSxLQUFmO0FBQ0EsVUFBS0MsWUFBTCxHQUFvQixLQUFwQjtBQUNBLFVBQUtDLE1BQUwsR0FBYyxLQUFkOztBQUVBLFVBQUtDLElBQUwsQ0FBVSxTQUFWLEVBQW9CLFlBQUk7QUFDcEIsWUFBS0YsWUFBTCxHQUFvQixJQUFwQjtBQUNILEtBRkQ7O0FBSUEsVUFBS2hCLEtBQUwsR0FBYUEsS0FBSyxnR0FBQyxpQkFBT21CLElBQVAsRUFB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QUlpRixPQUFPLEdBQUcsU0FBVkEsT0FBVSxHQUFJO0FBQ2RqRixVQUFBQSxPQUFPO0FBQ0gsVUFBQSxNQUFJLENBQUNrRixhQUFMLENBQW1CTCxHQUFuQixDQURHLENBQVA7O0FBR0gsU0FKRDtBQUtBLFlBQUcsTUFBSSxDQUFDbkUsWUFBUjtBQUNJLGVBQU91RSxPQUFPLEVBQWQsQ0FESjtBQUVJO0FBQ0EsVUFBQSxNQUFJLENBQUNyRSxJQUFMLENBQVUsU0FBVixFQUFvQnFFLE9BQXBCO0FBQ0g7QUFDSixPQVhNLENBQVA7QUFZSCxLOztBQUVLO0FBQ0YsV0FBS3hFLE9BQUwsR0FBZSxJQUFmO0FBQ0EsV0FBS3lCLElBQUwsQ0FBVSxNQUFWO0FBQ0gsSzs7QUFFTTtBQUNILFdBQUt2QixNQUFMLEdBQWMsSUFBZDtBQUNBLFdBQUt1QixJQUFMLENBQVUsUUFBVjtBQUNILEs7O0FBRU07QUFDSCxVQUFHLEtBQUt2QixNQUFSLEVBQWU7QUFDWCxhQUFLQSxNQUFMLEdBQVksS0FBWjtBQUNBLGFBQUt1QixJQUFMLENBQVUsT0FBVjtBQUNIO0FBQ0osSyw0QkF0T3NDdEMsWSx1QkFBdEJNLGEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZW1pdHRlciBmcm9tIFwiLi9lbWl0dGVyXCI7XG5pbXBvcnQgRUpTT04gZnJvbSAnZWpzb24nO1xuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5pbXBvcnQgc2lmdCBmcm9tICdzaWZ0JztcbmltcG9ydCBxdWV1ZSBmcm9tICdhc3luYy9xdWV1ZSc7XG5pbXBvcnQgRGlmZlNlcXVlbmNlIGZyb20gXCIuL0RpZmZTZXF1ZW5jZVwiO1xuaW1wb3J0IHtFdmVudEVtaXR0ZXJ9IGZyb20gJ2V2ZW50cyc7XG5cbmZ1bmN0aW9uIGRlbGF5ZWRQcm9taXNlKHRpbWVvdXQpe1xuICAgIGlmKHRpbWVvdXQ8PTApXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpPT57XG4gICAgICAgIHNldFRpbWVvdXQocmVzb2x2ZSx0aW1lb3V0KTtcbiAgICB9KTtcbn1cblxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBPYnNlcnZlQ3Vyc29yIGV4dGVuZHMgRXZlbnRFbWl0dGVye1xuICAgIGNvbnN0cnVjdG9yKHF1ZXJ5LG9wdGlvbnM9e30pe1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLnNldE1heExpc3RlbmVycygwKTtcbiAgICAgICAgdGhpcy5xdWVyeSA9IHF1ZXJ5O1xuICAgICAgICB0aGlzLmhhbmRsZXJzID0gbnVsbDtcbiAgICAgICAgdGhpcy5tb2RlbHNNYXAgPSB7fTtcbiAgICAgICAgdGhpcy5sYXN0UmVmcmVzaGVkID0gMDtcbiAgICAgICAgdGhpcy5zdG9wcGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMud2FzUmVmcmVzaGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMucGF1c2VkID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5vbmNlKCdyZWZyZXNoJywoKT0+e1xuICAgICAgICAgICAgdGhpcy53YXNSZWZyZXNoZWQgPSB0cnVlO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLnF1ZXVlID0gcXVldWUoYXN5bmMgKHRhc2ssIGNhbGxiYWNrKT0+IHtcbiAgICAgICAgICAgIHRoaXMucXVlcnlTdGFydGVkID0gZmFsc2U7XG4gICAgICAgICAgICBsZXQgZGVsYXkgPSB0YXNrLnJlZnJlc2hEYXRlLURhdGUubm93KCkgO1xuICAgICAgICAgICAgaWYoZGVsYXk+MCl7XG4gICAgICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpPT57XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgfSxkZWxheSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZih0aGlzLnBhdXNlZCl7XG4gICAgICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpPT57XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25jZSgnYXdha2UnLHJlc29sdmUpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYodGhpcy5zdG9wcGVkKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobmV3IEVycm9yKCdTdG9wcGVkJykpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5xdWVyeVN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgbGV0IHN0YXJ0ZWQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgdGhpcy5xdWVyeS5leGVjKChlcnIscmVzdWx0cyk9PntcbiAgICAgICAgICAgICAgICB0aGlzLnF1ZXJ5U3RhcnRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHRoaXMubGFzdFJlZnJlc2hlZCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZygncmVmcmVzaCBxdWVyeSBleGVjIGVuZCcpO1xuICAgICAgICAgICAgICAgIGlmKGVycilcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7Ly9UT0RPIGVycm9yIGhhbmRsZVxuICAgICAgICAgICAgICAgIC8qKkB0eXBlIG9iamVjdCovXG4gICAgICAgICAgICAgICAgbGV0IG5ld0Fzc29jID0gXy5pbmRleEJ5KHJlc3VsdHMsJ2lkJyk7XG5cbiAgICAgICAgICAgICAgICBpZih0aGlzLmhhbmRsZXJzLnJlbW92ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJlbW92ZWRJZHMgPSBfLmRpZmZlcmVuY2UoIF8ua2V5cyh0aGlzLm1vZGVsc01hcCksIF8ua2V5cyhuZXdBc3NvYykgKTtcbiAgICAgICAgICAgICAgICAgICAgXy5lYWNoKHJlbW92ZWRJZHMsKF9pZCk9PntcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlcnMucmVtb3ZlZC5hcHBseSh0aGlzLCBbX2lkLHRoaXMubW9kZWxzTWFwW19pZF1dKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgncmVtb3ZlZCcsX2lkLHRoaXMubW9kZWxzTWFwW19pZF0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXy5jaGFpbihuZXdBc3NvYylcbiAgICAgICAgICAgICAgICAuZWFjaCgocmVzdWx0KT0+e1xuICAgICAgICAgICAgICAgICAgICBsZXQgbW9kZWwgPSAgbmV3QXNzb2NbcmVzdWx0LmlkXTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG9sZE1vZGVsID0gdGhpcy5tb2RlbHNNYXBbcmVzdWx0LmlkXTtcbiAgICAgICAgICAgICAgICAgICAgaWYoIW9sZE1vZGVsJiZ0aGlzLmhhbmRsZXJzLmFkZGVkKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlcnMuYWRkZWQuYXBwbHkodGhpcywgW3Jlc3VsdC5pZCxtb2RlbF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdhZGRlZCcscmVzdWx0LmlkLG1vZGVsKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZihvbGRNb2RlbCYmdGhpcy5oYW5kbGVycy5jaGFuZ2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgb2xkUmF3ID0gb2xkTW9kZWwudG9PYmplY3QoeyBnZXR0ZXJzOiBmYWxzZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBuZXdSYXcgPSBtb2RlbC50b09iamVjdCh7IGdldHRlcnM6IGZhbHNlIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCAhRUpTT04uZXF1YWxzIChvbGRSYXcsIG5ld1JhdykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgY2hhbmdlZEZpZWxkcyA9IERpZmZTZXF1ZW5jZS5tYWtlQ2hhbmdlZEZpZWxkcyAobmV3UmF3LCBvbGRSYXcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghXy5pc0VtcHR5IChjaGFuZ2VkRmllbGRzKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZXJzLmNoYW5nZWQuYXBwbHkgKHRoaXMsIFtyZXN1bHQuaWQsIGNoYW5nZWRGaWVsZHMsIHJlc3VsdCwgb2xkTW9kZWxdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdjaGFuZ2VkJyxyZXN1bHQuaWQsIGNoYW5nZWRGaWVsZHMsIHJlc3VsdCwgb2xkTW9kZWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5tb2RlbHNNYXAgPSBuZXdBc3NvYztcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ3JlZnJlc2gnLERhdGUubm93KCktc3RhcnRlZCk7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCAxICk7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgICAgIHRoaXMucG9sbGluZ0ludGVydmFsTXMgPSBfLmlzTnVtYmVyKG9wdGlvbnMucG9sbGluZ0ludGVydmFsTXMpPyBvcHRpb25zLnBvbGxpbmdJbnRlcnZhbE1zIDogNjAwMDA7XG4gICAgICAgIHRoaXMucG9sbGluZ1Rocm90dGxlTXMgPSBfLmlzTnVtYmVyKG9wdGlvbnMucG9sbGluZ1Rocm90dGxlTXMpPyBvcHRpb25zLnBvbGxpbmdUaHJvdHRsZU1zIDogMTAwMDtcbiAgICB9XG5cbiAgICBzY2hlZHVsZVJlZnJlc2godGFzayl7XG4gICAgICAgIC8vY29uc29sZS5sb2coJ3NoZWR1bGVSZWZyZXNoIGxlbmd0aDonLHRoaXMucXVldWUubGVuZ3RoKCksJ3J1bm5pbmc6Jyx0aGlzLnF1ZXVlLnJ1bm5pbmcoKSk7XG4gICAgICAgIGlmKHRoaXMucXVldWUubGVuZ3RoKCk+MClcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZmFsc2UpO1xuICAgICAgICBpZih0aGlzLnF1ZXVlLnJ1bm5pbmcoKT4wICYmICF0aGlzLnF1ZXJ5U3RhcnRlZClcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZmFsc2UpO1xuXG4gICAgICAgIGxldCBwb2xsaW5nVGhyb3R0bGVNcyA9IHRoaXMucG9sbGluZ1Rocm90dGxlTXM7XG4gICAgICAgIGlmKF8uaXNGdW5jdGlvbihwb2xsaW5nVGhyb3R0bGVNcykpe1xuICAgICAgICAgICAgcG9sbGluZ1Rocm90dGxlTXMgPSBwb2xsaW5nVGhyb3R0bGVNcy5hcHBseSh0aGlzLFtdKTtcbiAgICAgICAgICAgIGlmKCFfLmlzTnVtYmVyKHBvbGxpbmdUaHJvdHRsZU1zKSl7XG4gICAgICAgICAgICAgICAgcG9sbGluZ1Rocm90dGxlTXMgPSAxMDAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGxldCBkZWxheSA9IHRoaXMubGFzdFJlZnJlc2hlZCA/IHBvbGxpbmdUaHJvdHRsZU1zIC0gKCBEYXRlLm5vdygpIC0gdGhpcy5sYXN0UmVmcmVzaGVkICkgOiAwO1xuICAgICAgICAvL2NvbnNvbGUubG9nKHtkZWxheX0pO1xuICAgICAgICBsZXQgcmVmcmVzaERhdGUgPSBuZXcgRGF0ZSgpO1xuICAgICAgICBpZihkZWxheT4wKXtcbiAgICAgICAgICAgIHJlZnJlc2hEYXRlID0gbmV3IERhdGUoRGF0ZS5ub3coKStkZWxheSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpPT57XG4gICAgICAgICAgICB0aGlzLnF1ZXVlLnB1c2goe3JlZnJlc2hEYXRlOnJlZnJlc2hEYXRlfSwoKT0+e1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipAcGFyYW0ge29iamVjdH0gaGFuZGxlcnNcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKGlkOlN0cmluZywgZG9jOm1vbmdvb3NlLkRvY3VtZW50KX0gaGFuZGxlcnMuYWRkZWRcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKGlkOnN0cmluZywgY2hhbmdlZEZpZWxkczpvYmplY3QsbmV3RG9jOm1vbmdvb3NlLkRvY3VtZW50LG9sZERvYzogbW9uZ29vc2UuRG9jdW1lbnQpfSBoYW5kbGVycy5jaGFuZ2VkXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbihpZDpTdHJpbmcsIHJlbW92ZWREb2M6bW9uZ29vc2UuRG9jdW1lbnQpfSBoYW5kbGVycy5yZW1vdmVkXG4gICAgICogKi9cbiAgICBvYnNlcnZlQ2hhbmdlcyhoYW5kbGVycyl7XG4gICAgICAgIHRoaXMuaGFuZGxlcnMgPSBoYW5kbGVycztcbiAgICAgICAgY29uc3QgcmF3Q29uZGl0aW9ucyA9IEVKU09OLmNsb25lKHRoaXMucXVlcnkuX2NvbmRpdGlvbnMpO1xuICAgICAgICBjb25zdCBzaWZ0UXVlcnkgPSBzaWZ0KHJhd0NvbmRpdGlvbnMpO1xuXG4gICAgICAgIGxldCBsaXN0ZW5lciA9IChkb2MpPT57XG4gICAgICAgICAgICBpZihkb2MudHlwZT09J3NhdmUnJiZ0aGlzLmhhbmRsZXJzLmFkZGVkKXtcbiAgICAgICAgICAgICAgICBsZXQgbW9uZ29vc2VNb2RlbCA9IF8uZmlyc3QoIGRvYy5hcmd1bWVudHMgKTtcbiAgICAgICAgICAgICAgICBpZihtb25nb29zZU1vZGVsKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCByYXdNb2RlbCA9IEVKU09OLmNsb25lKG1vbmdvb3NlTW9kZWwpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2lmdFF1ZXJ5KHJhd01vZGVsKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2NoZWR1bGVSZWZyZXNoKHJhd01vZGVsKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihkb2MudHlwZT09J3JlbW92ZScmJnRoaXMuaGFuZGxlcnMucmVtb3ZlZCl7XG4gICAgICAgICAgICAgICAgbGV0IGZpbmRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGxldCBzaWZ0UXVlcnkgPSBzaWZ0KCBFSlNPTi5jbG9uZShfLmZpcnN0KCBkb2MuYXJndW1lbnRzICkgKSApO1xuICAgICAgICAgICAgICAgIF8uZWFjaCh0aGlzLm1vZGVsc01hcCwocmF3TW9kZWwpPT57XG4gICAgICAgICAgICAgICAgICAgIGlmKCFmaW5kZWQgJiYgc2lmdFF1ZXJ5KHJhd01vZGVsKSl7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaW5kZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2NoZWR1bGVSZWZyZXNoKHJhd01vZGVsKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYoZG9jLnR5cGU9PSd1cGRhdGUnKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zY2hlZHVsZVJlZnJlc2goKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgZW1pdHRlci5vbih0aGlzLnF1ZXJ5Lm1vbmdvb3NlQ29sbGVjdGlvbi5uYW1lLGxpc3RlbmVyKTtcbiAgICAgICAgdGhpcy5vbmNlKCdzdG9wJywoKT0+e1xuICAgICAgICAgICAgZW1pdHRlci5yZW1vdmVMaXN0ZW5lcih0aGlzLnF1ZXJ5Lm1vbmdvb3NlQ29sbGVjdGlvbi5uYW1lLGxpc3RlbmVyKVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5zY2hlZHVsZVJlZnJlc2goKTtcbiAgICAgICAgdGhpcy5kb1BvbGxpbmcoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZG9Qb2xsaW5nKCl7XG4gICAgICAgIGxldCBwb2xsaW5nUXVldWUgPSBuZXcgcXVldWUoYXN5bmMgKHRhc2ssY2FsbGJhY2spPT57XG4gICAgICAgICAgICBpZighdGhpcy5sYXN0UmVmcmVzaGVkKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgZGVsYXllZFByb21pc2UoMTAwKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sgKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgcG9sbGluZ0ludGVydmFsTXMgPSBfLmlzRnVuY3Rpb24odGhpcy5wb2xsaW5nSW50ZXJ2YWxNcyk/dGhpcy5wb2xsaW5nSW50ZXJ2YWxNcy5hcHBseSh0aGlzKTp0aGlzLnBvbGxpbmdJbnRlcnZhbE1zO1xuICAgICAgICAgICAgaWYoIV8uaXNOdW1iZXIocG9sbGluZ0ludGVydmFsTXMpKXtcbiAgICAgICAgICAgICAgICBwb2xsaW5nSW50ZXJ2YWxNcyA9IDYwMDAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IHRpbWVvdXQgPSBwb2xsaW5nSW50ZXJ2YWxNcyAtICggRGF0ZS5ub3coKSAtIHRoaXMubGFzdFJlZnJlc2hlZCApO1xuICAgICAgICAgICAgaWYodGltZW91dD4wKXtcbiAgICAgICAgICAgICAgICBhd2FpdCBkZWxheWVkUHJvbWlzZSh0aW1lb3V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKCF0aGlzLnN0b3BwZWQpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnNjaGVkdWxlUmVmcmVzaCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgfSwxKTtcblxuICAgICAgICBwb2xsaW5nUXVldWUucHVzaChudWxsKTtcblxuICAgICAgICBwb2xsaW5nUXVldWUuZHJhaW4oKCk9PntcbiAgICAgICAgICAgIGlmKCF0aGlzLnN0b3BwZWQpIHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpPT57XG4gICAgICAgICAgICAgICAgICAgIHBvbGxpbmdRdWV1ZS5wdXNoKG51bGwpO1xuICAgICAgICAgICAgICAgIH0sMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGN1cnJlbnRNb2RlbHMocmF3PWZhbHNlKXtcbiAgICAgICAgcmV0dXJuIF8uY2hhaW4odGhpcy5tb2RlbHNNYXApXG4gICAgICAgIC52YWx1ZXMoKVxuICAgICAgICAubWFwKChtb2RlbCk9PntcbiAgICAgICAgICAgIGlmKHJhdyl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1vZGVsLnRvT2JqZWN0KHsgZ2V0dGVyczogZmFsc2UgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbW9kZWw7XG4gICAgICAgIH0pXG4gICAgICAgIC52YWx1ZSgpXG4gICAgfVxuXG4gICAgbW9kZWxzKHJhdz1mYWxzZSl7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSk9PntcbiAgICAgICAgICAgIGxldCBvblJlYWR5ID0gKCk9PntcbiAgICAgICAgICAgICAgICByZXNvbHZlKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRNb2RlbHMocmF3KVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZih0aGlzLndhc1JlZnJlc2hlZClcbiAgICAgICAgICAgICAgICByZXR1cm4gb25SZWFkeSgpO1xuICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICB0aGlzLm9uY2UoJ3JlZnJlc2gnLG9uUmVhZHkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzdG9wKCl7XG4gICAgICAgIHRoaXMuc3RvcHBlZCA9IHRydWU7XG4gICAgICAgIHRoaXMuZW1pdCgnc3RvcCcpO1xuICAgIH1cblxuICAgIHBhdXNlKCl7XG4gICAgICAgIHRoaXMucGF1c2VkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5lbWl0KCdwYXVzZWQnKTtcbiAgICB9XG5cbiAgICBhd2FrZSgpe1xuICAgICAgICBpZih0aGlzLnBhdXNlZCl7XG4gICAgICAgICAgICB0aGlzLnBhdXNlZD1mYWxzZTtcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnYXdha2UnKTtcbiAgICAgICAgfVxuICAgIH1cblxufSJdfQ==