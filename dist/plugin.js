"use strict";var _interopRequireDefault3 = require("@babel/runtime/helpers/interopRequireDefault");var _interopRequireDefault2 = _interopRequireDefault3(require("@babel/runtime/helpers/interopRequireDefault"));Object.defineProperty(exports, "__esModule", { value: true });var _regenerator = require("@babel/runtime/regenerator");var _regeneratorRuntime = (0, _interopRequireDefault2["default"])(_regenerator)["default"];var _asyncToGenerator2 = require("@babel/runtime/helpers/asyncToGenerator");var _asyncToGenerator = (0, _interopRequireDefault2["default"])(_asyncToGenerator2)["default"];exports["default"] =







































observeChangesPlugin;var _ObserveLogs = require("./ObserveLogs");var ObserveLogs = (0, _interopRequireDefault2["default"])(_ObserveLogs)["default"];var _ObserveCursor = require("./ObserveCursor");var ObserveCursor = (0, _interopRequireDefault2["default"])(_ObserveCursor)["default"];var _mongoose = require("mongoose");var Query = _mongoose.Query;var mongoose = (0, _interopRequireDefault2["default"])(_mongoose)["default"];var _ejson = require("ejson");var EJSON = (0, _interopRequireDefault2["default"])(_ejson)["default"];var _emitter = require("./emitter");var emitter = (0, _interopRequireDefault2["default"])(_emitter)["default"];var isReady = false;emitter.on('ready', function () {isReady = true;});emitter.on('notready', function () {isReady = false;});function waitReady() {return _waitReady.apply(this, arguments);}function _waitReady() {_waitReady = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee5() {return _regeneratorRuntime.wrap(function _callee5$(_context5) {while (1) {switch (_context5.prev = _context5.next) {case 0:if (!isReady) {_context5.next = 2;break;}return _context5.abrupt("return", Promise.resolve());case 2:return _context5.abrupt("return", new Promise(function (resolve) {emitter.once('ready', resolve);}));case 3:case "end":return _context5.stop();}}}, _callee5);}));return _waitReady.apply(this, arguments);}var BsonObjectId = require('bson').ObjectID;var MongodbObjectId = require('mongodb').ObjectId;Query.prototype.observeChanges = function (handlers, options) {return new ObserveCursor(this, options).observeChanges(handlers);};mongoose.ObjectId.prototype.toJSONValue = BsonObjectId.prototype.toJSONValue = MongodbObjectId.prototype.toJSONValue = function () {return this.toString();};MongodbObjectId.prototype.typeName = mongoose.ObjectId.prototype.typeName = BsonObjectId.prototype.typeName = function () {return 'ObjectID';};EJSON.addType('ObjectID', function fromJSONValue(json) {return json;});function observeChangesPlugin(schema, options) {
  schema.pre('save', function () {
    console.log(this);
    return Promise.resolve();
  });
  schema.post('save', /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {var rawDoc;return _regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:_context.next = 2;return (
              waitReady());case 2:
            rawDoc = this.toObject({ getters: false });
            rawDoc = EJSON.clone(rawDoc);
            new ObserveLogs({
              type: 'save',
              collectionName: this.collection.name,
              arguments: [rawDoc],
              state: {
                isNew: this.isNew },

              date: new Date() }).
            save();case 5:case "end":return _context.stop();}}}, _callee, this);})));


  schema.post('remove', { query: true, document: true }, /*#__PURE__*/function () {var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(result) {return _regeneratorRuntime.wrap(function _callee2$(_context2) {while (1) {switch (_context2.prev = _context2.next) {case 0:_context2.next = 2;return (
                waitReady());case 2:
              //let rawDoc = this.toObject({ getters: false });
              //rawDoc = EJSON.clone(rawDoc);
              //if(result.deletedCount>0) {
              new ObserveLogs({
                type: 'remove',
                collectionName: this.mongooseCollection.name,
                arguments: [EJSON.clone(this._conditions)],
                state: {},
                date: new Date() }).
              save();
              //}
            case 3:case "end":return _context2.stop();}}}, _callee2, this);}));return function (_x) {return _ref2.apply(this, arguments);};}());

  schema.post(/^update/, { query: true, document: true }, /*#__PURE__*/function () {var _ref3 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3(result) {return _regeneratorRuntime.wrap(function _callee3$(_context3) {while (1) {switch (_context3.prev = _context3.next) {case 0:
              console.log({ result: result });_context3.next = 3;return (
                waitReady());case 3:
              if (result.nModified > 0) {
                new ObserveLogs({
                  type: 'update',
                  collectionName: this.mongooseCollection.name,
                  arguments: [EJSON.clone(this._conditions)],
                  state: {},
                  date: new Date() }).
                save();
              }case 4:case "end":return _context3.stop();}}}, _callee3, this);}));return function (_x2) {return _ref3.apply(this, arguments);};}());


  schema.post(/^delete/, { query: true, document: true }, /*#__PURE__*/function () {var _ref4 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee4(result) {return _regeneratorRuntime.wrap(function _callee4$(_context4) {while (1) {switch (_context4.prev = _context4.next) {case 0:
              console.log({ result: result });_context4.next = 3;return (
                waitReady());case 3:
              if (result.deletedCount > 0) {
                new ObserveLogs({
                  type: 'remove',
                  collectionName: this.mongooseCollection.name,
                  arguments: [EJSON.clone(this._conditions)],
                  state: {},
                  date: new Date() }).
                save();
              }case 4:case "end":return _context4.stop();}}}, _callee4, this);}));return function (_x3) {return _ref4.apply(this, arguments);};}());



}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9wbHVnaW4uanMiXSwibmFtZXMiOlsib2JzZXJ2ZUNoYW5nZXNQbHVnaW4iLCJPYnNlcnZlTG9ncyIsIk9ic2VydmVDdXJzb3IiLCJRdWVyeSIsIm1vbmdvb3NlIiwiRUpTT04iLCJlbWl0dGVyIiwiaXNSZWFkeSIsIm9uIiwid2FpdFJlYWR5IiwiUHJvbWlzZSIsInJlc29sdmUiLCJvbmNlIiwiQnNvbk9iamVjdElkIiwicmVxdWlyZSIsIk9iamVjdElEIiwiTW9uZ29kYk9iamVjdElkIiwiT2JqZWN0SWQiLCJwcm90b3R5cGUiLCJvYnNlcnZlQ2hhbmdlcyIsImhhbmRsZXJzIiwib3B0aW9ucyIsInRvSlNPTlZhbHVlIiwidG9TdHJpbmciLCJ0eXBlTmFtZSIsImFkZFR5cGUiLCJmcm9tSlNPTlZhbHVlIiwianNvbiIsInNjaGVtYSIsInByZSIsImNvbnNvbGUiLCJsb2ciLCJwb3N0IiwicmF3RG9jIiwidG9PYmplY3QiLCJnZXR0ZXJzIiwiY2xvbmUiLCJ0eXBlIiwiY29sbGVjdGlvbk5hbWUiLCJjb2xsZWN0aW9uIiwibmFtZSIsImFyZ3VtZW50cyIsInN0YXRlIiwiaXNOZXciLCJkYXRlIiwiRGF0ZSIsInNhdmUiLCJxdWVyeSIsImRvY3VtZW50IiwicmVzdWx0IiwibW9uZ29vc2VDb2xsZWN0aW9uIiwiX2NvbmRpdGlvbnMiLCJuTW9kaWZpZWQiLCJkZWxldGVkQ291bnQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF3Q3dCQSxvQixDQXhDeEIsNEMsSUFBT0MsVyxvRUFDUCxnRCxJQUFPQyxhLHNFQUNQLG9DLElBQVFDLEssYUFBQUEsSyxLQUVEQyxRLGlFQURQLDhCLElBQU9DLEssOERBRVAsb0MsSUFBT0MsTyxnRUFFUCxJQUFJQyxPQUFPLEdBQUcsS0FBZCxDQUNBRCxPQUFPLENBQUNFLEVBQVIsQ0FBVyxPQUFYLEVBQW1CLFlBQUksQ0FDbkJELE9BQU8sR0FBRyxJQUFWLENB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QUFPLENBQUNDLEdBQVIsQ0FBWSxFQUFDa0IsTUFBTSxFQUFOQSxNQUFELEVBQVosRUFEaUQ7QUFFM0N4QyxnQkFBQUEsU0FBUyxFQUZrQztBQUdqRCxrQkFBR3dDLE1BQU0sQ0FBQ0ksWUFBUCxHQUFvQixDQUF2QixFQUEwQjtBQUN0QixvQkFBSXBELFdBQUosQ0FBZ0I7QUFDWm9DLGtCQUFBQSxJQUFJLEVBQUUsUUFETTtBQUVaQyxrQkFBQUEsY0FBYyxFQUFFLEtBQUtZLGtCQUFMLENBQXdCVixJQUY1QjtBQUdaQyxrQkFBQUEsU0FBUyxFQUFFLENBQUNwQyxLQUFLLENBQUMrQixLQUFOLENBQVksS0FBS2UsV0FBakIsQ0FBRCxDQUhDO0FBSVpULGtCQUFBQSxLQUFLLEVBQUUsRUFKSztBQUtaRSxrQkFBQUEsSUFBSSxFQUFFLElBQUlDLElBQUosRUFMTSxFQUFoQjtBQU1HQyxnQkFBQUEsSUFOSDtBQU9ILGVBWGdELGdFQUFyRDs7OztBQWVIIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IE9ic2VydmVMb2dzIGZyb20gXCIuL09ic2VydmVMb2dzXCI7XG5pbXBvcnQgT2JzZXJ2ZUN1cnNvciBmcm9tIFwiLi9PYnNlcnZlQ3Vyc29yXCI7XG5pbXBvcnQge1F1ZXJ5fSBmcm9tICdtb25nb29zZSc7XG5pbXBvcnQgRUpTT04gZnJvbSAnZWpzb24nO1xuaW1wb3J0IG1vbmdvb3NlIGZyb20gJ21vbmdvb3NlJztcbmltcG9ydCBlbWl0dGVyIGZyb20gXCIuL2VtaXR0ZXJcIjtcblxubGV0IGlzUmVhZHkgPSBmYWxzZTtcbmVtaXR0ZXIub24oJ3JlYWR5JywoKT0+e1xuICAgIGlzUmVhZHkgPSB0cnVlO1xufSk7XG5lbWl0dGVyLm9uKCdub3RyZWFkeScsKCk9PntcbiAgICBpc1JlYWR5ID0gZmFsc2U7XG59KTtcblxuYXN5bmMgZnVuY3Rpb24gd2FpdFJlYWR5KCl7XG4gICAgaWYoaXNSZWFkeSlcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSk9PntcbiAgICAgICAgZW1pdHRlci5vbmNlKCdyZWFkeScscmVzb2x2ZSk7XG4gICAgfSk7XG59XG5cbmNvbnN0IEJzb25PYmplY3RJZCA9IHJlcXVpcmUoJ2Jzb24nKS5PYmplY3RJRDtcbmNvbnN0IE1vbmdvZGJPYmplY3RJZCA9IHJlcXVpcmUoJ21vbmdvZGInKS5PYmplY3RJZDtcblxuUXVlcnkucHJvdG90eXBlLm9ic2VydmVDaGFuZ2VzID0gZnVuY3Rpb24oaGFuZGxlcnMsb3B0aW9ucyl7XG4gICAgcmV0dXJuIG5ldyBPYnNlcnZlQ3Vyc29yKHRoaXMsb3B0aW9ucykub2JzZXJ2ZUNoYW5nZXMoaGFuZGxlcnMpO1xufTtcblxubW9uZ29vc2UuT2JqZWN0SWQucHJvdG90eXBlLnRvSlNPTlZhbHVlID0gQnNvbk9iamVjdElkLnByb3RvdHlwZS50b0pTT05WYWx1ZSA9IE1vbmdvZGJPYmplY3RJZC5wcm90b3R5cGUudG9KU09OVmFsdWUgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiB0aGlzLnRvU3RyaW5nKCk7XG59O1xuTW9uZ29kYk9iamVjdElkLnByb3RvdHlwZS50eXBlTmFtZT1tb25nb29zZS5PYmplY3RJZC5wcm90b3R5cGUudHlwZU5hbWUgPUJzb25PYmplY3RJZC5wcm90b3R5cGUudHlwZU5hbWUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gJ09iamVjdElEJztcbn07XG5FSlNPTi5hZGRUeXBlKCdPYmplY3RJRCcsIGZ1bmN0aW9uIGZyb21KU09OVmFsdWUoanNvbikge1xuICAgIHJldHVybiBqc29uO1xufSk7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIG9ic2VydmVDaGFuZ2VzUGx1Z2luKHNjaGVtYSwgb3B0aW9ucykge1xuICAgIHNjaGVtYS5wcmUoJ3NhdmUnLGZ1bmN0aW9uKCl7XG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMpO1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfSk7XG4gICAgc2NoZW1hLnBvc3QoJ3NhdmUnLGFzeW5jIGZ1bmN0aW9uKCl7XG4gICAgICAgIGF3YWl0IHdhaXRSZWFkeSgpO1xuICAgICAgICBsZXQgcmF3RG9jID0gdGhpcy50b09iamVjdCh7IGdldHRlcnM6IGZhbHNlIH0pO1xuICAgICAgICByYXdEb2MgPSBFSlNPTi5jbG9uZShyYXdEb2MpO1xuICAgICAgICBuZXcgT2JzZXJ2ZUxvZ3Moe1xuICAgICAgICAgICAgdHlwZTonc2F2ZScsXG4gICAgICAgICAgICBjb2xsZWN0aW9uTmFtZTp0aGlzLmNvbGxlY3Rpb24ubmFtZSxcbiAgICAgICAgICAgIGFyZ3VtZW50czpbcmF3RG9jXSxcbiAgICAgICAgICAgIHN0YXRlOntcbiAgICAgICAgICAgICAgICBpc05ldzp0aGlzLmlzTmV3XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGF0ZTpuZXcgRGF0ZSgpXG4gICAgICAgIH0pLnNhdmUoKTtcbiAgICB9KTtcblxuICAgIHNjaGVtYS5wb3N0KCdyZW1vdmUnLCB7IHF1ZXJ5OiB0cnVlLGRvY3VtZW50OnRydWUgIH0sYXN5bmMgZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICAgIGF3YWl0IHdhaXRSZWFkeSgpO1xuICAgICAgICAvL2xldCByYXdEb2MgPSB0aGlzLnRvT2JqZWN0KHsgZ2V0dGVyczogZmFsc2UgfSk7XG4gICAgICAgIC8vcmF3RG9jID0gRUpTT04uY2xvbmUocmF3RG9jKTtcbiAgICAgICAgLy9pZihyZXN1bHQuZGVsZXRlZENvdW50PjApIHtcbiAgICAgICAgICAgIG5ldyBPYnNlcnZlTG9ncyh7XG4gICAgICAgICAgICAgICAgdHlwZTogJ3JlbW92ZScsXG4gICAgICAgICAgICAgICAgY29sbGVjdGlvbk5hbWU6IHRoaXMubW9uZ29vc2VDb2xsZWN0aW9uLm5hbWUsXG4gICAgICAgICAgICAgICAgYXJndW1lbnRzOiBbRUpTT04uY2xvbmUodGhpcy5fY29uZGl0aW9ucyldLFxuICAgICAgICAgICAgICAgIHN0YXRlOiB7fSxcbiAgICAgICAgICAgICAgICBkYXRlOiBuZXcgRGF0ZSgpXG4gICAgICAgICAgICB9KS5zYXZlKCk7XG4gICAgICAgIC8vfVxuICAgIH0pO1xuXG4gICAgc2NoZW1hLnBvc3QoL151cGRhdGUvLCB7IHF1ZXJ5OiB0cnVlLGRvY3VtZW50OnRydWUgfSxhc3luYyBmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgICAgY29uc29sZS5sb2coe3Jlc3VsdH0pO1xuICAgICAgICBhd2FpdCB3YWl0UmVhZHkoKTtcbiAgICAgICAgaWYocmVzdWx0Lm5Nb2RpZmllZD4wKSB7XG4gICAgICAgICAgICBuZXcgT2JzZXJ2ZUxvZ3Moe1xuICAgICAgICAgICAgICAgIHR5cGU6ICd1cGRhdGUnLFxuICAgICAgICAgICAgICAgIGNvbGxlY3Rpb25OYW1lOiB0aGlzLm1vbmdvb3NlQ29sbGVjdGlvbi5uYW1lLFxuICAgICAgICAgICAgICAgIGFyZ3VtZW50czogW0VKU09OLmNsb25lKHRoaXMuX2NvbmRpdGlvbnMpXSxcbiAgICAgICAgICAgICAgICBzdGF0ZToge30sXG4gICAgICAgICAgICAgICAgZGF0ZTogbmV3IERhdGUoKVxuICAgICAgICAgICAgfSkuc2F2ZSgpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBzY2hlbWEucG9zdCgvXmRlbGV0ZS8sIHsgcXVlcnk6IHRydWUsZG9jdW1lbnQ6dHJ1ZSB9LGFzeW5jIGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgICBjb25zb2xlLmxvZyh7cmVzdWx0fSk7XG4gICAgICAgIGF3YWl0IHdhaXRSZWFkeSgpO1xuICAgICAgICBpZihyZXN1bHQuZGVsZXRlZENvdW50PjApIHtcbiAgICAgICAgICAgIG5ldyBPYnNlcnZlTG9ncyh7XG4gICAgICAgICAgICAgICAgdHlwZTogJ3JlbW92ZScsXG4gICAgICAgICAgICAgICAgY29sbGVjdGlvbk5hbWU6IHRoaXMubW9uZ29vc2VDb2xsZWN0aW9uLm5hbWUsXG4gICAgICAgICAgICAgICAgYXJndW1lbnRzOiBbRUpTT04uY2xvbmUodGhpcy5fY29uZGl0aW9ucyldLFxuICAgICAgICAgICAgICAgIHN0YXRlOiB7fSxcbiAgICAgICAgICAgICAgICBkYXRlOiBuZXcgRGF0ZSgpXG4gICAgICAgICAgICB9KS5zYXZlKCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuXG59Il19