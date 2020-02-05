"use strict";var _interopRequireDefault3 = require("@babel/runtime/helpers/interopRequireDefault");var _interopRequireDefault2 = _interopRequireDefault3(require("@babel/runtime/helpers/interopRequireDefault"));Object.defineProperty(exports, "__esModule", { value: true });var _regenerator = require("@babel/runtime/regenerator");var _regeneratorRuntime = (0, _interopRequireDefault2["default"])(_regenerator)["default"];var _asyncToGenerator2 = require("@babel/runtime/helpers/asyncToGenerator");var _asyncToGenerator = (0, _interopRequireDefault2["default"])(_asyncToGenerator2)["default"];exports["default"] =












































observeChangesPlugin;var _ObserveLogs = require("./ObserveLogs");var ObserveLogs = (0, _interopRequireDefault2["default"])(_ObserveLogs)["default"];var _ObserveCursor = require("./ObserveCursor");var ObserveCursor = (0, _interopRequireDefault2["default"])(_ObserveCursor)["default"];var _mongoose = require("mongoose");var Query = _mongoose.Query;var _ejson = require("ejson");var EJSON = (0, _interopRequireDefault2["default"])(_ejson)["default"];var _emitter = require("./emitter");var emitter = (0, _interopRequireDefault2["default"])(_emitter)["default"];var mongoose = require('mongoose');var moduleMongoose = require.cache[require.resolve('mongoose')];var bson = moduleMongoose.require('bson');var mongodb = moduleMongoose.require('mongodb');var isReady = false;emitter.on('ready', function () {isReady = true;});emitter.on('notready', function () {isReady = false;});function waitReady() {return _waitReady.apply(this, arguments);}function _waitReady() {_waitReady = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee5() {return _regeneratorRuntime.wrap(function _callee5$(_context5) {while (1) {switch (_context5.prev = _context5.next) {case 0:if (!isReady) {_context5.next = 2;break;}return _context5.abrupt("return", Promise.resolve());case 2:return _context5.abrupt("return", new Promise(function (resolve) {emitter.once('ready', resolve);}));case 3:case "end":return _context5.stop();}}}, _callee5);}));return _waitReady.apply(this, arguments);}var BsonObjectId = bson.ObjectID;var MongodbObjectId = mongodb.ObjectId;Query.prototype.observeChanges = function (handlers, options) {return new ObserveCursor(this, options).observeChanges(handlers);};mongoose.ObjectId.prototype.toJSONValue = BsonObjectId.prototype.toJSONValue = MongodbObjectId.prototype.toJSONValue = function () {return this.toString();};MongodbObjectId.prototype.typeName = mongoose.ObjectId.prototype.typeName = BsonObjectId.prototype.typeName = function () {return 'ObjectID';};EJSON.addType('ObjectID', function fromJSONValue(json) {return json;});function observeChangesPlugin(schema, options) {
  schema.pre('save', function () {
    //console.log(this);
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

  schema.post(/^update/, { query: true, document: true }, /*#__PURE__*/function () {var _ref3 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3(result) {return _regeneratorRuntime.wrap(function _callee3$(_context3) {while (1) {switch (_context3.prev = _context3.next) {case 0:_context3.next = 2;return (

                waitReady());case 2:
              if (result.nModified > 0) {
                new ObserveLogs({
                  type: 'update',
                  collectionName: this.mongooseCollection.name,
                  arguments: [EJSON.clone(this._conditions)],
                  state: {},
                  date: new Date() }).
                save();
              }case 3:case "end":return _context3.stop();}}}, _callee3, this);}));return function (_x2) {return _ref3.apply(this, arguments);};}());


  schema.post(/^delete/, { query: true, document: true }, /*#__PURE__*/function () {var _ref4 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee4(result) {return _regeneratorRuntime.wrap(function _callee4$(_context4) {while (1) {switch (_context4.prev = _context4.next) {case 0:_context4.next = 2;return (

                waitReady());case 2:
              if (result.deletedCount > 0) {
                new ObserveLogs({
                  type: 'remove',
                  collectionName: this.mongooseCollection.name,
                  arguments: [EJSON.clone(this._conditions)],
                  state: {},
                  date: new Date() }).
                save();
              }case 3:case "end":return _context4.stop();}}}, _callee4, this);}));return function (_x3) {return _ref4.apply(this, arguments);};}());



}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9wbHVnaW4uanMiXSwibmFtZXMiOlsib2JzZXJ2ZUNoYW5nZXNQbHVnaW4iLCJPYnNlcnZlTG9ncyIsIk9ic2VydmVDdXJzb3IiLCJRdWVyeSIsIkVKU09OIiwiZW1pdHRlciIsIm1vbmdvb3NlIiwicmVxdWlyZSIsIm1vZHVsZU1vbmdvb3NlIiwiY2FjaGUiLCJyZXNvbHZlIiwiYnNvbiIsIm1vbmdvZGIiLCJpc1JlYWR5Iiwib24iLCJ3YWl0UmVhZHkiLCJQcm9taXNlIiwib25jZSIsIkJzb25PYmplY3RJZCIsIk9iamVjdElEIiwiTW9uZ29kYk9iamVjdElkIiwiT2JqZWN0SWQiLCJwcm90b3R5cGUiLCJvYnNlcnZlQ2hhbmdlcyIsImhhbmRsZXJzIiwib3B0aW9ucyIsInRvSlNPTlZhbHVlIiwidG9TdHJpbmciLCJ0eXBlTmFtZSIsImFkZFR5cGUiLCJmcm9tSlNPTlZhbHVlIiwianNvbiIsInNjaGVtYSIsInByZSIsInBvc3QiLCJyYXdEb2MiLCJ0b09iamVjdCIsImdldHRlcnMiLCJjbG9uZSIsInR5cGUiLCJjb2xsZWN0aW9uTmFtZSIsImNvbGxlY3Rpb24iLCJuYW1lIiwiYXJndW1lbnRzIiwic3RhdGUiLCJpc05ldyIsImRhdGUiLCJEYXRlIiwic2F2ZSIsInF1ZXJ5IiwiZG9jdW1lbnQiLCJyZXN1bHQiLCJtb25nb29zZUNvbGxlY3Rpb24iLCJfY29uZGl0aW9ucyIsIm5Nb2RpZmllZCIsImRlbGV0ZWRDb3VudCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBNkN3QkEsb0IsQ0E3Q3hCLDRDLElBQU9DLFcsb0VBQ1AsZ0QsSUFBT0MsYSxzRUFDUCxvQyxJQUFRQyxLLGFBQUFBLEssQ0FDUiw4QixJQUFPQyxLLDhEQUVQLG9DLElBQU9DLE8sZ0VBRFAsSUFBTUMsUUFBUSxHQUFHQyxPQUFPLENBQUMsVUFBRCxDQUF4QixDQUdBLElBQU1DLGNBQWMsR0FBR0QsT0FBTyxD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QUFjQWhCLEVBQUFBLE1BQU0sQ0FBQ0UsSUFBUCxDQUFZLFNBQVosRUFBdUIsRUFBRWUsS0FBSyxFQUFFLElBQVQsRUFBY0MsUUFBUSxFQUFDLElBQXZCLEVBQXZCLGlHQUFxRCxrQkFBZUMsTUFBZjs7QUFFM0NwQyxnQkFBQUEsU0FBUyxFQUZrQztBQUdqRCxrQkFBR29DLE1BQU0sQ0FBQ0ksWUFBUCxHQUFvQixDQUF2QixFQUEwQjtBQUN0QixvQkFBSXRELFdBQUosQ0FBZ0I7QUFDWnNDLGtCQUFBQSxJQUFJLEVBQUUsUUFETTtBQUVaQyxrQkFBQUEsY0FBYyxFQUFFLEtBQUtZLGtCQUFMLENBQXdCVixJQUY1QjtBQUdaQyxrQkFBQUEsU0FBUyxFQUFFLENBQUN2QyxLQUFLLENBQUNrQyxLQUFOLENBQVksS0FBS2UsV0FBakIsQ0FBRCxDQUhDO0FBSVpULGtCQUFBQSxLQUFLLEVBQUUsRUFKSztBQUtaRSxrQkFBQUEsSUFBSSxFQUFFLElBQUlDLElBQUosRUFMTSxFQUFoQjtBQU1HQyxnQkFBQUEsSUFOSDtBQU9ILGVBWGdELGdFQUFyRDs7OztBQWVIIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IE9ic2VydmVMb2dzIGZyb20gXCIuL09ic2VydmVMb2dzXCI7XG5pbXBvcnQgT2JzZXJ2ZUN1cnNvciBmcm9tIFwiLi9PYnNlcnZlQ3Vyc29yXCI7XG5pbXBvcnQge1F1ZXJ5fSBmcm9tICdtb25nb29zZSc7XG5pbXBvcnQgRUpTT04gZnJvbSAnZWpzb24nO1xuY29uc3QgbW9uZ29vc2UgPSByZXF1aXJlKCdtb25nb29zZScpO1xuaW1wb3J0IGVtaXR0ZXIgZnJvbSBcIi4vZW1pdHRlclwiO1xuXG5jb25zdCBtb2R1bGVNb25nb29zZSA9IHJlcXVpcmUuY2FjaGVbcmVxdWlyZS5yZXNvbHZlKCdtb25nb29zZScpXVxuXG5jb25zdCBic29uID0gbW9kdWxlTW9uZ29vc2UucmVxdWlyZSgnYnNvbicpO1xuY29uc3QgbW9uZ29kYiA9IG1vZHVsZU1vbmdvb3NlLnJlcXVpcmUoJ21vbmdvZGInKTtcblxubGV0IGlzUmVhZHkgPSBmYWxzZTtcbmVtaXR0ZXIub24oJ3JlYWR5JywoKT0+e1xuICAgIGlzUmVhZHkgPSB0cnVlO1xufSk7XG5lbWl0dGVyLm9uKCdub3RyZWFkeScsKCk9PntcbiAgICBpc1JlYWR5ID0gZmFsc2U7XG59KTtcblxuYXN5bmMgZnVuY3Rpb24gd2FpdFJlYWR5KCl7XG4gICAgaWYoaXNSZWFkeSlcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSk9PntcbiAgICAgICAgZW1pdHRlci5vbmNlKCdyZWFkeScscmVzb2x2ZSk7XG4gICAgfSk7XG59XG5cbmNvbnN0IEJzb25PYmplY3RJZCA9IGJzb24uT2JqZWN0SUQ7XG5jb25zdCBNb25nb2RiT2JqZWN0SWQgPSBtb25nb2RiLk9iamVjdElkO1xuXG5RdWVyeS5wcm90b3R5cGUub2JzZXJ2ZUNoYW5nZXMgPSBmdW5jdGlvbihoYW5kbGVycyxvcHRpb25zKXtcbiAgICByZXR1cm4gbmV3IE9ic2VydmVDdXJzb3IodGhpcyxvcHRpb25zKS5vYnNlcnZlQ2hhbmdlcyhoYW5kbGVycyk7XG59O1xuXG5tb25nb29zZS5PYmplY3RJZC5wcm90b3R5cGUudG9KU09OVmFsdWUgPSBCc29uT2JqZWN0SWQucHJvdG90eXBlLnRvSlNPTlZhbHVlID0gTW9uZ29kYk9iamVjdElkLnByb3RvdHlwZS50b0pTT05WYWx1ZSA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIHRoaXMudG9TdHJpbmcoKTtcbn07XG5Nb25nb2RiT2JqZWN0SWQucHJvdG90eXBlLnR5cGVOYW1lPW1vbmdvb3NlLk9iamVjdElkLnByb3RvdHlwZS50eXBlTmFtZSA9QnNvbk9iamVjdElkLnByb3RvdHlwZS50eXBlTmFtZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAnT2JqZWN0SUQnO1xufTtcbkVKU09OLmFkZFR5cGUoJ09iamVjdElEJywgZnVuY3Rpb24gZnJvbUpTT05WYWx1ZShqc29uKSB7XG4gICAgcmV0dXJuIGpzb247XG59KTtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gb2JzZXJ2ZUNoYW5nZXNQbHVnaW4oc2NoZW1hLCBvcHRpb25zKSB7XG4gICAgc2NoZW1hLnByZSgnc2F2ZScsZnVuY3Rpb24oKXtcbiAgICAgICAgLy9jb25zb2xlLmxvZyh0aGlzKTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH0pO1xuICAgIHNjaGVtYS5wb3N0KCdzYXZlJyxhc3luYyBmdW5jdGlvbigpe1xuICAgICAgICBhd2FpdCB3YWl0UmVhZHkoKTtcbiAgICAgICAgbGV0IHJhd0RvYyA9IHRoaXMudG9PYmplY3QoeyBnZXR0ZXJzOiBmYWxzZSB9KTtcbiAgICAgICAgcmF3RG9jID0gRUpTT04uY2xvbmUocmF3RG9jKTtcbiAgICAgICAgbmV3IE9ic2VydmVMb2dzKHtcbiAgICAgICAgICAgIHR5cGU6J3NhdmUnLFxuICAgICAgICAgICAgY29sbGVjdGlvbk5hbWU6dGhpcy5jb2xsZWN0aW9uLm5hbWUsXG4gICAgICAgICAgICBhcmd1bWVudHM6W3Jhd0RvY10sXG4gICAgICAgICAgICBzdGF0ZTp7XG4gICAgICAgICAgICAgICAgaXNOZXc6dGhpcy5pc05ld1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRhdGU6bmV3IERhdGUoKVxuICAgICAgICB9KS5zYXZlKCk7XG4gICAgfSk7XG5cbiAgICBzY2hlbWEucG9zdCgncmVtb3ZlJywgeyBxdWVyeTogdHJ1ZSxkb2N1bWVudDp0cnVlICB9LGFzeW5jIGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgICBhd2FpdCB3YWl0UmVhZHkoKTtcbiAgICAgICAgLy9sZXQgcmF3RG9jID0gdGhpcy50b09iamVjdCh7IGdldHRlcnM6IGZhbHNlIH0pO1xuICAgICAgICAvL3Jhd0RvYyA9IEVKU09OLmNsb25lKHJhd0RvYyk7XG4gICAgICAgIC8vaWYocmVzdWx0LmRlbGV0ZWRDb3VudD4wKSB7XG4gICAgICAgICAgICBuZXcgT2JzZXJ2ZUxvZ3Moe1xuICAgICAgICAgICAgICAgIHR5cGU6ICdyZW1vdmUnLFxuICAgICAgICAgICAgICAgIGNvbGxlY3Rpb25OYW1lOiB0aGlzLm1vbmdvb3NlQ29sbGVjdGlvbi5uYW1lLFxuICAgICAgICAgICAgICAgIGFyZ3VtZW50czogW0VKU09OLmNsb25lKHRoaXMuX2NvbmRpdGlvbnMpXSxcbiAgICAgICAgICAgICAgICBzdGF0ZToge30sXG4gICAgICAgICAgICAgICAgZGF0ZTogbmV3IERhdGUoKVxuICAgICAgICAgICAgfSkuc2F2ZSgpO1xuICAgICAgICAvL31cbiAgICB9KTtcblxuICAgIHNjaGVtYS5wb3N0KC9edXBkYXRlLywgeyBxdWVyeTogdHJ1ZSxkb2N1bWVudDp0cnVlIH0sYXN5bmMgZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICAgIC8vY29uc29sZS5sb2coe3Jlc3VsdH0pO1xuICAgICAgICBhd2FpdCB3YWl0UmVhZHkoKTtcbiAgICAgICAgaWYocmVzdWx0Lm5Nb2RpZmllZD4wKSB7XG4gICAgICAgICAgICBuZXcgT2JzZXJ2ZUxvZ3Moe1xuICAgICAgICAgICAgICAgIHR5cGU6ICd1cGRhdGUnLFxuICAgICAgICAgICAgICAgIGNvbGxlY3Rpb25OYW1lOiB0aGlzLm1vbmdvb3NlQ29sbGVjdGlvbi5uYW1lLFxuICAgICAgICAgICAgICAgIGFyZ3VtZW50czogW0VKU09OLmNsb25lKHRoaXMuX2NvbmRpdGlvbnMpXSxcbiAgICAgICAgICAgICAgICBzdGF0ZToge30sXG4gICAgICAgICAgICAgICAgZGF0ZTogbmV3IERhdGUoKVxuICAgICAgICAgICAgfSkuc2F2ZSgpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBzY2hlbWEucG9zdCgvXmRlbGV0ZS8sIHsgcXVlcnk6IHRydWUsZG9jdW1lbnQ6dHJ1ZSB9LGFzeW5jIGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgICAvL2NvbnNvbGUubG9nKHtyZXN1bHR9KTtcbiAgICAgICAgYXdhaXQgd2FpdFJlYWR5KCk7XG4gICAgICAgIGlmKHJlc3VsdC5kZWxldGVkQ291bnQ+MCkge1xuICAgICAgICAgICAgbmV3IE9ic2VydmVMb2dzKHtcbiAgICAgICAgICAgICAgICB0eXBlOiAncmVtb3ZlJyxcbiAgICAgICAgICAgICAgICBjb2xsZWN0aW9uTmFtZTogdGhpcy5tb25nb29zZUNvbGxlY3Rpb24ubmFtZSxcbiAgICAgICAgICAgICAgICBhcmd1bWVudHM6IFtFSlNPTi5jbG9uZSh0aGlzLl9jb25kaXRpb25zKV0sXG4gICAgICAgICAgICAgICAgc3RhdGU6IHt9LFxuICAgICAgICAgICAgICAgIGRhdGU6IG5ldyBEYXRlKClcbiAgICAgICAgICAgIH0pLnNhdmUoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5cbn0iXX0=