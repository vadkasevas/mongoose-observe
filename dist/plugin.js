"use strict";var _interopRequireDefault3 = require("@babel/runtime/helpers/interopRequireDefault");var _interopRequireDefault2 = _interopRequireDefault3(require("@babel/runtime/helpers/interopRequireDefault"));Object.defineProperty(exports, "__esModule", { value: true });var _asyncToGenerator2 = require("@babel/runtime/helpers/asyncToGenerator");var _asyncToGenerator = (0, _interopRequireDefault2["default"])(_asyncToGenerator2)["default"];exports["default"] =
































































observeChangesPlugin;var _regenerator = require("@babel/runtime/regenerator");var _regeneratorRuntime = (0, _interopRequireDefault2["default"])(_regenerator)["default"];var _ObserveLogs = require("./ObserveLogs");var ObserveLogs = (0, _interopRequireDefault2["default"])(_ObserveLogs)["default"];var _ObserveCursor = require("./ObserveCursor");var ObserveCursor = (0, _interopRequireDefault2["default"])(_ObserveCursor)["default"];var _mongoose = require("mongoose");var Query = _mongoose.Query;var _ejson = require("ejson");var EJSON = (0, _interopRequireDefault2["default"])(_ejson)["default"];var _emitter = require("./emitter");var emitter = (0, _interopRequireDefault2["default"])(_emitter)["default"];var _ObserveCursorDeep = require("./ObserveCursorDeep");var ObserveCursorDeep = (0, _interopRequireDefault2["default"])(_ObserveCursorDeep)["default"];var mongoose = require('mongoose');var moduleMongoose = require.cache[require.resolve('mongoose')];var bson = moduleMongoose.require('bson');var mongodb = moduleMongoose.require('mongodb');var isReady = false;emitter.on('ready', function () {isReady = true;});emitter.on('notready', function () {isReady = false;});function waitReady() {return _waitReady.apply(this, arguments);}function _waitReady() {_waitReady = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee5() {return _regeneratorRuntime.wrap(function _callee5$(_context5) {while (1) switch (_context5.prev = _context5.next) {case 0:if (!isReady) {_context5.next = 2;break;}return _context5.abrupt("return", Promise.resolve());case 2:return _context5.abrupt("return", new Promise(function (resolve) {emitter.once('ready', resolve);}));case 3:case "end":return _context5.stop();}}, _callee5);}));return _waitReady.apply(this, arguments);}var BsonObjectId = bson.ObjectID;var MongodbObjectId = mongodb.ObjectId; /**
 * @returns {ObserveCursor}
 * */Query.prototype.observeChanges = function (handlers, options) {return new ObserveCursor(this, options).observeChanges(handlers);}; /**
 * @returns {ObserveCursor}
 * */Query.prototype.observeDeepChanges = function (handlers, options) {return new ObserveCursorDeep(this, options).observeChanges(handlers);};mongoose.ObjectId.prototype.toJSONValue = BsonObjectId.prototype.toJSONValue = MongodbObjectId.prototype.toJSONValue = function () {return this.toString();};MongodbObjectId.prototype.typeName = mongoose.ObjectId.prototype.typeName = BsonObjectId.prototype.typeName = function () {return 'ObjectID';};EJSON.addType('ObjectID', function fromJSONValue(json) {return json;});function collectionName(ctx) {var result = null;if (ctx instanceof mongoose.Model) {result = ctx.collection.name;} else if (ctx instanceof mongoose.Query) {result = ctx.mongooseCollection.name;}return result;}function observeChangesPlugin(schema, options) {/*schema.pre('save',function(){
      //console.log(this);
      return Promise.resolve();
  });*/schema.post('save', /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {var rawDoc;return _regeneratorRuntime.wrap(function _callee$(_context) {while (1) switch (_context.prev = _context.next) {case 0:_context.next = 2;return waitReady();case 2:rawDoc = this.toObject({ getters: true });
              rawDoc = EJSON.clone(rawDoc);
              new ObserveLogs({
                type: 'save',
                collectionName: collectionName(this),
                arguments: [rawDoc],
                state: {
                  isNew: this.isNew
                },
                date: new Date()
              }).save();case 5:case "end":return _context.stop();}}, _callee, this);}))
  );

  schema.post(/^remove|Remove/, { query: true, document: true }, /*#__PURE__*/function () {var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(result) {var condition;return _regeneratorRuntime.wrap(function _callee2$(_context2) {while (1) switch (_context2.prev = _context2.next) {case 0:_context2.next = 2;return (
              waitReady());case 2:
            //let rawDoc = this.toObject({ getters: false });
            //rawDoc = EJSON.clone(rawDoc);
            condition = null;
            if (result instanceof mongoose.Model) {
              condition = EJSON.clone({ _id: result._id });
            } else if (this instanceof mongoose.Query && result.deletedCount > 0) {
              condition = EJSON.clone(this._conditions);
            }

            if (condition) {
              new ObserveLogs({
                type: 'remove',
                collectionName: collectionName(this),
                arguments: [condition],
                state: {},
                date: new Date()
              }).save();
            }case 5:case "end":return _context2.stop();}}, _callee2, this);}));return function (_x) {return _ref2.apply(this, arguments);};}()
  );

  schema.post(/^update|Update/, { query: true, document: true }, /*#__PURE__*/function () {var _ref3 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3(result) {var condition;return _regeneratorRuntime.wrap(function _callee3$(_context3) {while (1) switch (_context3.prev = _context3.next) {case 0:_context3.next = 2;return (

              waitReady());case 2:
            condition = null;
            if (result instanceof mongoose.Model) {
              condition = EJSON.clone({ _id: result._id });
            } else if (this instanceof mongoose.Query && result.nModified > 0) {
              condition = EJSON.clone(this._conditions);
            }
            if (condition) {
              new ObserveLogs({
                type: 'update',
                collectionName: collectionName(this),
                arguments: [condition],
                state: {},
                date: new Date()
              }).save();
            }case 5:case "end":return _context3.stop();}}, _callee3, this);}));return function (_x2) {return _ref3.apply(this, arguments);};}()
  );

  schema.post(/^delete|Delete/, { query: true, document: true }, /*#__PURE__*/function () {var _ref4 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee4(result) {var condition;return _regeneratorRuntime.wrap(function _callee4$(_context4) {while (1) switch (_context4.prev = _context4.next) {case 0:_context4.next = 2;return (

              waitReady());case 2:
            condition = null;
            if (result instanceof mongoose.Model) {
              condition = EJSON.clone({ _id: result._id });
            } else if (this instanceof mongoose.Query && result.deletedCount > 0) {
              condition = EJSON.clone(this._conditions);
            }

            if (condition) {
              new ObserveLogs({
                type: 'remove',
                collectionName: collectionName(this),
                arguments: [condition],
                state: {},
                date: new Date()
              }).save();
            }case 5:case "end":return _context4.stop();}}, _callee4, this);}));return function (_x3) {return _ref4.apply(this, arguments);};}()
  );


}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJvYnNlcnZlQ2hhbmdlc1BsdWdpbiIsIl9yZWdlbmVyYXRvciIsInJlcXVpcmUiLCJfcmVnZW5lcmF0b3JSdW50aW1lIiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdDIiLCJfT2JzZXJ2ZUxvZ3MiLCJPYnNlcnZlTG9ncyIsIl9PYnNlcnZlQ3Vyc29yIiwiT2JzZXJ2ZUN1cnNvciIsIl9tb25nb29zZSIsIlF1ZXJ5IiwiX2Vqc29uIiwiRUpTT04iLCJfZW1pdHRlciIsImVtaXR0ZXIiLCJfT2JzZXJ2ZUN1cnNvckRlZXAiLCJPYnNlcnZlQ3Vyc29yRGVlcCIsIm1vbmdvb3NlIiwibW9kdWxlTW9uZ29vc2UiLCJjYWNoZSIsInJlc29sdmUiLCJic29uIiwibW9uZ29kYiIsImlzUmVhZHkiLCJvbiIsIndhaXRSZWFkeSIsIl93YWl0UmVhZHkiLCJhcHBseSIsImFyZ3VtZW50cyIsIl9hc3luY1RvR2VuZXJhdG9yIiwibWFyayIsIl9jYWxsZWU1Iiwid3JhcCIsIl9jYWxsZWU1JCIsIl9jb250ZXh0NSIsInByZXYiLCJuZXh0IiwiYWJydXB0IiwiUHJvbWlzZSIsIm9uY2UiLCJzdG9wIiwiQnNvbk9iamVjdElkIiwiT2JqZWN0SUQiLCJNb25nb2RiT2JqZWN0SWQiLCJPYmplY3RJZCIsInByb3RvdHlwZSIsIm9ic2VydmVDaGFuZ2VzIiwiaGFuZGxlcnMiLCJvcHRpb25zIiwib2JzZXJ2ZURlZXBDaGFuZ2VzIiwidG9KU09OVmFsdWUiLCJ0b1N0cmluZyIsInR5cGVOYW1lIiwiYWRkVHlwZSIsImZyb21KU09OVmFsdWUiLCJqc29uIiwiY29sbGVjdGlvbk5hbWUiLCJjdHgiLCJyZXN1bHQiLCJNb2RlbCIsImNvbGxlY3Rpb24iLCJuYW1lIiwibW9uZ29vc2VDb2xsZWN0aW9uIiwic2NoZW1hIiwicG9zdCIsIl9jYWxsZWUiLCJyYXdEb2MiLCJfY2FsbGVlJCIsIl9jb250ZXh0IiwidG9PYmplY3QiLCJnZXR0ZXJzIiwiY2xvbmUiLCJ0eXBlIiwic3RhdGUiLCJpc05ldyIsImRhdGUiLCJEYXRlIiwic2F2ZSIsInF1ZXJ5IiwiZG9jdW1lbnQiLCJfcmVmMiIsIl9jYWxsZWUyIiwiY29uZGl0aW9uIiwiX2NhbGxlZTIkIiwiX2NvbnRleHQyIiwiX2lkIiwiZGVsZXRlZENvdW50IiwiX2NvbmRpdGlvbnMiLCJfeCIsIl9yZWYzIiwiX2NhbGxlZTMiLCJfY2FsbGVlMyQiLCJfY29udGV4dDMiLCJuTW9kaWZpZWQiLCJfeDIiLCJfcmVmNCIsIl9jYWxsZWU0IiwiX2NhbGxlZTQkIiwiX2NvbnRleHQ0IiwiX3gzIl0sInNvdXJjZXMiOlsiLi4vc3JjL3BsdWdpbi5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgT2JzZXJ2ZUxvZ3MgZnJvbSBcIi4vT2JzZXJ2ZUxvZ3NcIjtcbmltcG9ydCBPYnNlcnZlQ3Vyc29yIGZyb20gXCIuL09ic2VydmVDdXJzb3JcIjtcbmltcG9ydCB7UXVlcnl9IGZyb20gJ21vbmdvb3NlJztcbmltcG9ydCBFSlNPTiBmcm9tICdlanNvbic7XG5jb25zdCBtb25nb29zZSA9IHJlcXVpcmUoJ21vbmdvb3NlJyk7XG5pbXBvcnQgZW1pdHRlciBmcm9tIFwiLi9lbWl0dGVyXCI7XG5pbXBvcnQgT2JzZXJ2ZUN1cnNvckRlZXAgZnJvbSBcIi4vT2JzZXJ2ZUN1cnNvckRlZXBcIjtcblxuY29uc3QgbW9kdWxlTW9uZ29vc2UgPSByZXF1aXJlLmNhY2hlW3JlcXVpcmUucmVzb2x2ZSgnbW9uZ29vc2UnKV1cblxuY29uc3QgYnNvbiA9IG1vZHVsZU1vbmdvb3NlLnJlcXVpcmUoJ2Jzb24nKTtcbmNvbnN0IG1vbmdvZGIgPSBtb2R1bGVNb25nb29zZS5yZXF1aXJlKCdtb25nb2RiJyk7XG5cbmxldCBpc1JlYWR5ID0gZmFsc2U7XG5lbWl0dGVyLm9uKCdyZWFkeScsKCk9PntcbiAgICBpc1JlYWR5ID0gdHJ1ZTtcbn0pO1xuZW1pdHRlci5vbignbm90cmVhZHknLCgpPT57XG4gICAgaXNSZWFkeSA9IGZhbHNlO1xufSk7XG5cbmFzeW5jIGZ1bmN0aW9uIHdhaXRSZWFkeSgpe1xuICAgIGlmKGlzUmVhZHkpXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpPT57XG4gICAgICAgIGVtaXR0ZXIub25jZSgncmVhZHknLHJlc29sdmUpO1xuICAgIH0pO1xufVxuXG5jb25zdCBCc29uT2JqZWN0SWQgPSBic29uLk9iamVjdElEO1xuY29uc3QgTW9uZ29kYk9iamVjdElkID0gbW9uZ29kYi5PYmplY3RJZDtcblxuLyoqXG4gKiBAcmV0dXJucyB7T2JzZXJ2ZUN1cnNvcn1cbiAqICovXG5RdWVyeS5wcm90b3R5cGUub2JzZXJ2ZUNoYW5nZXMgPSBmdW5jdGlvbihoYW5kbGVycyxvcHRpb25zKXtcbiAgICByZXR1cm4gbmV3IE9ic2VydmVDdXJzb3IodGhpcyxvcHRpb25zKS5vYnNlcnZlQ2hhbmdlcyhoYW5kbGVycyk7XG59O1xuXG4vKipcbiAqIEByZXR1cm5zIHtPYnNlcnZlQ3Vyc29yfVxuICogKi9cblF1ZXJ5LnByb3RvdHlwZS5vYnNlcnZlRGVlcENoYW5nZXMgPSBmdW5jdGlvbihoYW5kbGVycyxvcHRpb25zKXtcbiAgICByZXR1cm4gbmV3IE9ic2VydmVDdXJzb3JEZWVwKHRoaXMsb3B0aW9ucykub2JzZXJ2ZUNoYW5nZXMoaGFuZGxlcnMpO1xufTtcblxubW9uZ29vc2UuT2JqZWN0SWQucHJvdG90eXBlLnRvSlNPTlZhbHVlID0gQnNvbk9iamVjdElkLnByb3RvdHlwZS50b0pTT05WYWx1ZSA9IE1vbmdvZGJPYmplY3RJZC5wcm90b3R5cGUudG9KU09OVmFsdWUgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiB0aGlzLnRvU3RyaW5nKCk7XG59O1xuTW9uZ29kYk9iamVjdElkLnByb3RvdHlwZS50eXBlTmFtZT1tb25nb29zZS5PYmplY3RJZC5wcm90b3R5cGUudHlwZU5hbWUgPUJzb25PYmplY3RJZC5wcm90b3R5cGUudHlwZU5hbWUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gJ09iamVjdElEJztcbn07XG5FSlNPTi5hZGRUeXBlKCdPYmplY3RJRCcsIGZ1bmN0aW9uIGZyb21KU09OVmFsdWUoanNvbikge1xuICAgIHJldHVybiBqc29uO1xufSk7XG5cbmZ1bmN0aW9uIGNvbGxlY3Rpb25OYW1lKGN0eCl7XG4gICAgbGV0IHJlc3VsdCA9IG51bGw7XG4gICAgaWYoY3R4IGluc3RhbmNlb2YgbW9uZ29vc2UuTW9kZWwpe1xuICAgICAgICByZXN1bHQgPSBjdHguY29sbGVjdGlvbi5uYW1lO1xuICAgIH1lbHNlIGlmKGN0eCBpbnN0YW5jZW9mIG1vbmdvb3NlLlF1ZXJ5KXtcbiAgICAgICAgcmVzdWx0ID0gY3R4Lm1vbmdvb3NlQ29sbGVjdGlvbi5uYW1lO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gb2JzZXJ2ZUNoYW5nZXNQbHVnaW4oc2NoZW1hLCBvcHRpb25zKSB7XG4gICAgLypzY2hlbWEucHJlKCdzYXZlJyxmdW5jdGlvbigpe1xuICAgICAgICAvL2NvbnNvbGUubG9nKHRoaXMpO1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfSk7Ki9cbiAgICBzY2hlbWEucG9zdCgnc2F2ZScsYXN5bmMgZnVuY3Rpb24oKXtcbiAgICAgICAgYXdhaXQgd2FpdFJlYWR5KCk7XG4gICAgICAgIGxldCByYXdEb2MgPSB0aGlzLnRvT2JqZWN0KHsgZ2V0dGVyczogdHJ1ZSB9KTtcbiAgICAgICAgcmF3RG9jID0gRUpTT04uY2xvbmUocmF3RG9jKTtcbiAgICAgICAgbmV3IE9ic2VydmVMb2dzKHtcbiAgICAgICAgICAgIHR5cGU6J3NhdmUnLFxuICAgICAgICAgICAgY29sbGVjdGlvbk5hbWU6Y29sbGVjdGlvbk5hbWUodGhpcyksXG4gICAgICAgICAgICBhcmd1bWVudHM6W3Jhd0RvY10sXG4gICAgICAgICAgICBzdGF0ZTp7XG4gICAgICAgICAgICAgICAgaXNOZXc6dGhpcy5pc05ld1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRhdGU6bmV3IERhdGUoKVxuICAgICAgICB9KS5zYXZlKCk7XG4gICAgfSk7XG5cbiAgICBzY2hlbWEucG9zdCgvXnJlbW92ZXxSZW1vdmUvLCB7IHF1ZXJ5OiB0cnVlLGRvY3VtZW50OnRydWUgIH0sYXN5bmMgZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICAgIGF3YWl0IHdhaXRSZWFkeSgpO1xuICAgICAgICAvL2xldCByYXdEb2MgPSB0aGlzLnRvT2JqZWN0KHsgZ2V0dGVyczogZmFsc2UgfSk7XG4gICAgICAgIC8vcmF3RG9jID0gRUpTT04uY2xvbmUocmF3RG9jKTtcbiAgICAgICAgbGV0IGNvbmRpdGlvbiA9IG51bGw7XG4gICAgICAgIGlmKHJlc3VsdCBpbnN0YW5jZW9mIG1vbmdvb3NlLk1vZGVsKXtcbiAgICAgICAgICAgIGNvbmRpdGlvbiA9RUpTT04uY2xvbmUoe19pZDpyZXN1bHQuX2lkfSk7XG4gICAgICAgIH1lbHNlIGlmKHRoaXMgaW5zdGFuY2VvZiBtb25nb29zZS5RdWVyeSAmJiByZXN1bHQuZGVsZXRlZENvdW50PjApe1xuICAgICAgICAgICAgY29uZGl0aW9uID0gRUpTT04uY2xvbmUodGhpcy5fY29uZGl0aW9ucyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZihjb25kaXRpb24pIHtcbiAgICAgICAgICAgIG5ldyBPYnNlcnZlTG9ncyh7XG4gICAgICAgICAgICAgICAgdHlwZTogJ3JlbW92ZScsXG4gICAgICAgICAgICAgICAgY29sbGVjdGlvbk5hbWU6Y29sbGVjdGlvbk5hbWUodGhpcyksXG4gICAgICAgICAgICAgICAgYXJndW1lbnRzOiBbY29uZGl0aW9uXSxcbiAgICAgICAgICAgICAgICBzdGF0ZToge30sXG4gICAgICAgICAgICAgICAgZGF0ZTogbmV3IERhdGUoKVxuICAgICAgICAgICAgfSkuc2F2ZSgpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBzY2hlbWEucG9zdCgvXnVwZGF0ZXxVcGRhdGUvLCB7IHF1ZXJ5OiB0cnVlLGRvY3VtZW50OnRydWUgfSxhc3luYyBmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgICAgLy9jb25zb2xlLmxvZyh7cmVzdWx0fSk7XG4gICAgICAgIGF3YWl0IHdhaXRSZWFkeSgpO1xuICAgICAgICBsZXQgY29uZGl0aW9uID0gbnVsbDtcbiAgICAgICAgaWYocmVzdWx0IGluc3RhbmNlb2YgbW9uZ29vc2UuTW9kZWwpe1xuICAgICAgICAgICAgY29uZGl0aW9uID0gRUpTT04uY2xvbmUoe19pZDpyZXN1bHQuX2lkfSk7XG4gICAgICAgIH1lbHNlIGlmKHRoaXMgaW5zdGFuY2VvZiBtb25nb29zZS5RdWVyeSAmJiByZXN1bHQubk1vZGlmaWVkPjApe1xuICAgICAgICAgICAgY29uZGl0aW9uID0gRUpTT04uY2xvbmUodGhpcy5fY29uZGl0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoY29uZGl0aW9uKSB7XG4gICAgICAgICAgICBuZXcgT2JzZXJ2ZUxvZ3Moe1xuICAgICAgICAgICAgICAgIHR5cGU6ICd1cGRhdGUnLFxuICAgICAgICAgICAgICAgIGNvbGxlY3Rpb25OYW1lOmNvbGxlY3Rpb25OYW1lKHRoaXMpLFxuICAgICAgICAgICAgICAgIGFyZ3VtZW50czogW2NvbmRpdGlvbl0sXG4gICAgICAgICAgICAgICAgc3RhdGU6IHt9LFxuICAgICAgICAgICAgICAgIGRhdGU6IG5ldyBEYXRlKClcbiAgICAgICAgICAgIH0pLnNhdmUoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgc2NoZW1hLnBvc3QoL15kZWxldGV8RGVsZXRlLywgeyBxdWVyeTogdHJ1ZSxkb2N1bWVudDp0cnVlIH0sYXN5bmMgZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICAgIC8vY29uc29sZS5sb2coe3Jlc3VsdH0pO1xuICAgICAgICBhd2FpdCB3YWl0UmVhZHkoKTtcbiAgICAgICAgbGV0IGNvbmRpdGlvbiA9IG51bGw7XG4gICAgICAgIGlmKHJlc3VsdCBpbnN0YW5jZW9mIG1vbmdvb3NlLk1vZGVsKXtcbiAgICAgICAgICAgIGNvbmRpdGlvbiA9IEVKU09OLmNsb25lKHtfaWQ6cmVzdWx0Ll9pZH0pO1xuICAgICAgICB9ZWxzZSBpZih0aGlzIGluc3RhbmNlb2YgbW9uZ29vc2UuUXVlcnkgJiYgcmVzdWx0LmRlbGV0ZWRDb3VudD4wKXtcbiAgICAgICAgICAgIGNvbmRpdGlvbiA9IEVKU09OLmNsb25lKHRoaXMuX2NvbmRpdGlvbnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoY29uZGl0aW9uKSB7XG4gICAgICAgICAgICBuZXcgT2JzZXJ2ZUxvZ3Moe1xuICAgICAgICAgICAgICAgIHR5cGU6ICdyZW1vdmUnLFxuICAgICAgICAgICAgICAgIGNvbGxlY3Rpb25OYW1lOmNvbGxlY3Rpb25OYW1lKHRoaXMpLFxuICAgICAgICAgICAgICAgIGFyZ3VtZW50czogW2NvbmRpdGlvbl0sXG4gICAgICAgICAgICAgICAgc3RhdGU6IHt9LFxuICAgICAgICAgICAgICAgIGRhdGU6IG5ldyBEYXRlKClcbiAgICAgICAgICAgIH0pLnNhdmUoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5cbn0iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBaUV3QkEsb0JBQW9CLEtBQUFDLFlBQUEsR0FBQUMsT0FBQSxtQ0FBQUMsbUJBQUEsT0FBQUMsdUJBQUEsYUFBQUgsWUFBQSxhQWpFNUMsSUFBQUksWUFBQSxHQUFBSCxPQUFBLGtCQUF3QyxJQUFqQ0ksV0FBVyxPQUFBRix1QkFBQSxhQUFBQyxZQUFBLGFBQ2xCLElBQUFFLGNBQUEsR0FBQUwsT0FBQSxvQkFBNEMsSUFBckNNLGFBQWEsT0FBQUosdUJBQUEsYUFBQUcsY0FBQSxhQUNwQixJQUFBRSxTQUFBLEdBQUFQLE9BQUEsYUFBK0IsSUFBdkJRLEtBQUssR0FBQUQsU0FBQSxDQUFMQyxLQUFLLENBQ2IsSUFBQUMsTUFBQSxHQUFBVCxPQUFBLFVBQTBCLElB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