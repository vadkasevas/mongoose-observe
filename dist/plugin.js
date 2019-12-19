"use strict";var _interopRequireDefault3 = require("@babel/runtime/helpers/interopRequireDefault");var _interopRequireDefault2 = _interopRequireDefault3(require("@babel/runtime/helpers/interopRequireDefault"));Object.defineProperty(exports, "__esModule", { value: true });var _regenerator = require("@babel/runtime/regenerator");var _regeneratorRuntime = (0, _interopRequireDefault2["default"])(_regenerator)["default"];var _asyncToGenerator2 = require("@babel/runtime/helpers/asyncToGenerator");var _asyncToGenerator = (0, _interopRequireDefault2["default"])(_asyncToGenerator2)["default"];exports["default"] =












































observeChangesPlugin;var _ObserveLogs = require("./ObserveLogs");var ObserveLogs = (0, _interopRequireDefault2["default"])(_ObserveLogs)["default"];var _ObserveCursor = require("./ObserveCursor");var ObserveCursor = (0, _interopRequireDefault2["default"])(_ObserveCursor)["default"];var _mongoose = require("mongoose");var Query = _mongoose.Query;var _ejson = require("ejson");var EJSON = (0, _interopRequireDefault2["default"])(_ejson)["default"];var _emitter = require("./emitter");var emitter = (0, _interopRequireDefault2["default"])(_emitter)["default"];var mongoose = require('mongoose');var moduleMongoose = require.cache[require.resolve('mongoose')];var bson = moduleMongoose.require('bson');var mongodb = moduleMongoose.require('mongodb');var isReady = false;emitter.on('ready', function () {isReady = true;});emitter.on('notready', function () {isReady = false;});function waitReady() {return _waitReady.apply(this, arguments);}function _waitReady() {_waitReady = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee5() {return _regeneratorRuntime.wrap(function _callee5$(_context5) {while (1) {switch (_context5.prev = _context5.next) {case 0:if (!isReady) {_context5.next = 2;break;}return _context5.abrupt("return", Promise.resolve());case 2:return _context5.abrupt("return", new Promise(function (resolve) {emitter.once('ready', resolve);}));case 3:case "end":return _context5.stop();}}}, _callee5);}));return _waitReady.apply(this, arguments);}var BsonObjectId = bson.ObjectID;var MongodbObjectId = mongodb.ObjectId;Query.prototype.observeChanges = function (handlers, options) {return new ObserveCursor(this, options).observeChanges(handlers);};mongoose.ObjectId.prototype.toJSONValue = BsonObjectId.prototype.toJSONValue = MongodbObjectId.prototype.toJSONValue = function () {return this.toString();};MongodbObjectId.prototype.typeName = mongoose.ObjectId.prototype.typeName = BsonObjectId.prototype.typeName = function () {return 'ObjectID';};EJSON.addType('ObjectID', function fromJSONValue(json) {return json;});function observeChangesPlugin(schema, options) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9wbHVnaW4uanMiXSwibmFtZXMiOlsib2JzZXJ2ZUNoYW5nZXNQbHVnaW4iLCJPYnNlcnZlTG9ncyIsIk9ic2VydmVDdXJzb3IiLCJRdWVyeSIsIkVKU09OIiwiZW1pdHRlciIsIm1vbmdvb3NlIiwicmVxdWlyZSIsIm1vZHVsZU1vbmdvb3NlIiwiY2FjaGUiLCJyZXNvbHZlIiwiYnNvbiIsIm1vbmdvZGIiLCJpc1JlYWR5Iiwib24iLCJ3YWl0UmVhZHkiLCJQcm9taXNlIiwib25jZSIsIkJzb25PYmplY3RJZCIsIk9iamVjdElEIiwiTW9uZ29kYk9iamVjdElkIiwiT2JqZWN0SWQiLCJwcm90b3R5cGUiLCJvYnNlcnZlQ2hhbmdlcyIsImhhbmRsZXJzIiwib3B0aW9ucyIsInRvSlNPTlZhbHVlIiwidG9TdHJpbmciLCJ0eXBlTmFtZSIsImFkZFR5cGUiLCJmcm9tSlNPTlZhbHVlIiwianNvbiIsInNjaGVtYSIsInByZSIsImNvbnNvbGUiLCJsb2ciLCJwb3N0IiwicmF3RG9jIiwidG9PYmplY3QiLCJnZXR0ZXJzIiwiY2xvbmUiLCJ0eXBlIiwiY29sbGVjdGlvbk5hbWUiLCJjb2xsZWN0aW9uIiwibmFtZSIsImFyZ3VtZW50cyIsInN0YXRlIiwiaXNOZXciLCJkYXRlIiwiRGF0ZSIsInNhdmUiLCJxdWVyeSIsImRvY3VtZW50IiwicmVzdWx0IiwibW9uZ29vc2VDb2xsZWN0aW9uIiwiX2NvbmRpdGlvbnMiLCJuTW9kaWZpZWQiLCJkZWxldGVkQ291bnQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTZDd0JBLG9CLENBN0N4Qiw0QyxJQUFPQyxXLG9FQUNQLGdELElBQU9DLGEsc0VBQ1Asb0MsSUFBUUMsSyxhQUFBQSxLLENBQ1IsOEIsSUFBT0MsSyw4REFFUCxvQyxJQUFPQyxPLGdFQURQLElBQU1DLFFBQVEsR0FBR0MsT0FBTyxDQUFDLFVBQUQsQ0FBeEIsQ0FHQSxJQUFNQyxj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LENBSEM7QUFJWlQsa0JBQUFBLEtBQUssRUFBRSxFQUpLO0FBS1pFLGtCQUFBQSxJQUFJLEVBQUUsSUFBSUMsSUFBSixFQUxNLEVBQWhCO0FBTUdDLGdCQUFBQSxJQU5IO0FBT0gsZUFYZ0QsZ0VBQXJEOzs7QUFjQWxCLEVBQUFBLE1BQU0sQ0FBQ0ksSUFBUCxDQUFZLFNBQVosRUFBdUIsRUFBRWUsS0FBSyxFQUFFLElBQVQsRUFBY0MsUUFBUSxFQUFDLElBQXZCLEVBQXZCLGlHQUFxRCxrQkFBZUMsTUFBZjtBQUNqRG5CLGNBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLEVBQUNrQixNQUFNLEVBQU5BLE1BQUQsRUFBWixFQURpRDtBQUUzQ3RDLGdCQUFBQSxTQUFTLEVBRmtDO0FBR2pELGtCQUFHc0MsTUFBTSxDQUFDSSxZQUFQLEdBQW9CLENBQXZCLEVBQTBCO0FBQ3RCLG9CQUFJeEQsV0FBSixDQUFnQjtBQUNad0Msa0JBQUFBLElBQUksRUFBRSxRQURNO0FBRVpDLGtCQUFBQSxjQUFjLEVBQUUsS0FBS1ksa0JBQUwsQ0FBd0JWLElBRjVCO0FBR1pDLGtCQUFBQSxTQUFTLEVBQUUsQ0FBQ3pDLEtBQUssQ0FBQ29DLEtBQU4sQ0FBWSxLQUFLZSxXQUFqQixDQUFELENBSEM7QUFJWlQsa0JBQUFBLEtBQUssRUFBRSxFQUpLO0FBS1pFLGtCQUFBQSxJQUFJLEVBQUUsSUFBSUMsSUFBSixFQUxNLEVBQWhCO0FBTUdDLGdCQUFBQSxJQU5IO0FBT0gsZUFYZ0QsZ0VBQXJEOzs7O0FBZUgiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgT2JzZXJ2ZUxvZ3MgZnJvbSBcIi4vT2JzZXJ2ZUxvZ3NcIjtcbmltcG9ydCBPYnNlcnZlQ3Vyc29yIGZyb20gXCIuL09ic2VydmVDdXJzb3JcIjtcbmltcG9ydCB7UXVlcnl9IGZyb20gJ21vbmdvb3NlJztcbmltcG9ydCBFSlNPTiBmcm9tICdlanNvbic7XG5jb25zdCBtb25nb29zZSA9IHJlcXVpcmUoJ21vbmdvb3NlJyk7XG5pbXBvcnQgZW1pdHRlciBmcm9tIFwiLi9lbWl0dGVyXCI7XG5cbmNvbnN0IG1vZHVsZU1vbmdvb3NlID0gcmVxdWlyZS5jYWNoZVtyZXF1aXJlLnJlc29sdmUoJ21vbmdvb3NlJyldXG5cbmNvbnN0IGJzb24gPSBtb2R1bGVNb25nb29zZS5yZXF1aXJlKCdic29uJyk7XG5jb25zdCBtb25nb2RiID0gbW9kdWxlTW9uZ29vc2UucmVxdWlyZSgnbW9uZ29kYicpO1xuXG5sZXQgaXNSZWFkeSA9IGZhbHNlO1xuZW1pdHRlci5vbigncmVhZHknLCgpPT57XG4gICAgaXNSZWFkeSA9IHRydWU7XG59KTtcbmVtaXR0ZXIub24oJ25vdHJlYWR5JywoKT0+e1xuICAgIGlzUmVhZHkgPSBmYWxzZTtcbn0pO1xuXG5hc3luYyBmdW5jdGlvbiB3YWl0UmVhZHkoKXtcbiAgICBpZihpc1JlYWR5KVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKT0+e1xuICAgICAgICBlbWl0dGVyLm9uY2UoJ3JlYWR5JyxyZXNvbHZlKTtcbiAgICB9KTtcbn1cblxuY29uc3QgQnNvbk9iamVjdElkID0gYnNvbi5PYmplY3RJRDtcbmNvbnN0IE1vbmdvZGJPYmplY3RJZCA9IG1vbmdvZGIuT2JqZWN0SWQ7XG5cblF1ZXJ5LnByb3RvdHlwZS5vYnNlcnZlQ2hhbmdlcyA9IGZ1bmN0aW9uKGhhbmRsZXJzLG9wdGlvbnMpe1xuICAgIHJldHVybiBuZXcgT2JzZXJ2ZUN1cnNvcih0aGlzLG9wdGlvbnMpLm9ic2VydmVDaGFuZ2VzKGhhbmRsZXJzKTtcbn07XG5cbm1vbmdvb3NlLk9iamVjdElkLnByb3RvdHlwZS50b0pTT05WYWx1ZSA9IEJzb25PYmplY3RJZC5wcm90b3R5cGUudG9KU09OVmFsdWUgPSBNb25nb2RiT2JqZWN0SWQucHJvdG90eXBlLnRvSlNPTlZhbHVlID0gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gdGhpcy50b1N0cmluZygpO1xufTtcbk1vbmdvZGJPYmplY3RJZC5wcm90b3R5cGUudHlwZU5hbWU9bW9uZ29vc2UuT2JqZWN0SWQucHJvdG90eXBlLnR5cGVOYW1lID1Cc29uT2JqZWN0SWQucHJvdG90eXBlLnR5cGVOYW1lID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICdPYmplY3RJRCc7XG59O1xuRUpTT04uYWRkVHlwZSgnT2JqZWN0SUQnLCBmdW5jdGlvbiBmcm9tSlNPTlZhbHVlKGpzb24pIHtcbiAgICByZXR1cm4ganNvbjtcbn0pO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBvYnNlcnZlQ2hhbmdlc1BsdWdpbihzY2hlbWEsIG9wdGlvbnMpIHtcbiAgICBzY2hlbWEucHJlKCdzYXZlJyxmdW5jdGlvbigpe1xuICAgICAgICBjb25zb2xlLmxvZyh0aGlzKTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH0pO1xuICAgIHNjaGVtYS5wb3N0KCdzYXZlJyxhc3luYyBmdW5jdGlvbigpe1xuICAgICAgICBhd2FpdCB3YWl0UmVhZHkoKTtcbiAgICAgICAgbGV0IHJhd0RvYyA9IHRoaXMudG9PYmplY3QoeyBnZXR0ZXJzOiBmYWxzZSB9KTtcbiAgICAgICAgcmF3RG9jID0gRUpTT04uY2xvbmUocmF3RG9jKTtcbiAgICAgICAgbmV3IE9ic2VydmVMb2dzKHtcbiAgICAgICAgICAgIHR5cGU6J3NhdmUnLFxuICAgICAgICAgICAgY29sbGVjdGlvbk5hbWU6dGhpcy5jb2xsZWN0aW9uLm5hbWUsXG4gICAgICAgICAgICBhcmd1bWVudHM6W3Jhd0RvY10sXG4gICAgICAgICAgICBzdGF0ZTp7XG4gICAgICAgICAgICAgICAgaXNOZXc6dGhpcy5pc05ld1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRhdGU6bmV3IERhdGUoKVxuICAgICAgICB9KS5zYXZlKCk7XG4gICAgfSk7XG5cbiAgICBzY2hlbWEucG9zdCgncmVtb3ZlJywgeyBxdWVyeTogdHJ1ZSxkb2N1bWVudDp0cnVlICB9LGFzeW5jIGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgICBhd2FpdCB3YWl0UmVhZHkoKTtcbiAgICAgICAgLy9sZXQgcmF3RG9jID0gdGhpcy50b09iamVjdCh7IGdldHRlcnM6IGZhbHNlIH0pO1xuICAgICAgICAvL3Jhd0RvYyA9IEVKU09OLmNsb25lKHJhd0RvYyk7XG4gICAgICAgIC8vaWYocmVzdWx0LmRlbGV0ZWRDb3VudD4wKSB7XG4gICAgICAgICAgICBuZXcgT2JzZXJ2ZUxvZ3Moe1xuICAgICAgICAgICAgICAgIHR5cGU6ICdyZW1vdmUnLFxuICAgICAgICAgICAgICAgIGNvbGxlY3Rpb25OYW1lOiB0aGlzLm1vbmdvb3NlQ29sbGVjdGlvbi5uYW1lLFxuICAgICAgICAgICAgICAgIGFyZ3VtZW50czogW0VKU09OLmNsb25lKHRoaXMuX2NvbmRpdGlvbnMpXSxcbiAgICAgICAgICAgICAgICBzdGF0ZToge30sXG4gICAgICAgICAgICAgICAgZGF0ZTogbmV3IERhdGUoKVxuICAgICAgICAgICAgfSkuc2F2ZSgpO1xuICAgICAgICAvL31cbiAgICB9KTtcblxuICAgIHNjaGVtYS5wb3N0KC9edXBkYXRlLywgeyBxdWVyeTogdHJ1ZSxkb2N1bWVudDp0cnVlIH0sYXN5bmMgZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKHtyZXN1bHR9KTtcbiAgICAgICAgYXdhaXQgd2FpdFJlYWR5KCk7XG4gICAgICAgIGlmKHJlc3VsdC5uTW9kaWZpZWQ+MCkge1xuICAgICAgICAgICAgbmV3IE9ic2VydmVMb2dzKHtcbiAgICAgICAgICAgICAgICB0eXBlOiAndXBkYXRlJyxcbiAgICAgICAgICAgICAgICBjb2xsZWN0aW9uTmFtZTogdGhpcy5tb25nb29zZUNvbGxlY3Rpb24ubmFtZSxcbiAgICAgICAgICAgICAgICBhcmd1bWVudHM6IFtFSlNPTi5jbG9uZSh0aGlzLl9jb25kaXRpb25zKV0sXG4gICAgICAgICAgICAgICAgc3RhdGU6IHt9LFxuICAgICAgICAgICAgICAgIGRhdGU6IG5ldyBEYXRlKClcbiAgICAgICAgICAgIH0pLnNhdmUoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgc2NoZW1hLnBvc3QoL15kZWxldGUvLCB7IHF1ZXJ5OiB0cnVlLGRvY3VtZW50OnRydWUgfSxhc3luYyBmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgICAgY29uc29sZS5sb2coe3Jlc3VsdH0pO1xuICAgICAgICBhd2FpdCB3YWl0UmVhZHkoKTtcbiAgICAgICAgaWYocmVzdWx0LmRlbGV0ZWRDb3VudD4wKSB7XG4gICAgICAgICAgICBuZXcgT2JzZXJ2ZUxvZ3Moe1xuICAgICAgICAgICAgICAgIHR5cGU6ICdyZW1vdmUnLFxuICAgICAgICAgICAgICAgIGNvbGxlY3Rpb25OYW1lOiB0aGlzLm1vbmdvb3NlQ29sbGVjdGlvbi5uYW1lLFxuICAgICAgICAgICAgICAgIGFyZ3VtZW50czogW0VKU09OLmNsb25lKHRoaXMuX2NvbmRpdGlvbnMpXSxcbiAgICAgICAgICAgICAgICBzdGF0ZToge30sXG4gICAgICAgICAgICAgICAgZGF0ZTogbmV3IERhdGUoKVxuICAgICAgICAgICAgfSkuc2F2ZSgpO1xuICAgICAgICB9XG4gICAgfSk7XG5cblxufSJdfQ==