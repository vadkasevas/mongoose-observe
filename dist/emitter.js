"use strict";var _interopRequireDefault3 = require("@babel/runtime/helpers/interopRequireDefault");var _interopRequireDefault2 = _interopRequireDefault3(require("@babel/runtime/helpers/interopRequireDefault"));Object.defineProperty(exports, "__esModule", { value: true });var _events = require("events");var EventEmitter = _events.EventEmitter;
var _ObserveLogs = require("./ObserveLogs");var ObserveLogs = (0, _interopRequireDefault2["default"])(_ObserveLogs)["default"];

var emitter = new EventEmitter().setMaxListeners(0);

var listenStarted = false;
var lastDocId = null;

function observeLogs() {
  listenStarted = false;
  new ObserveLogs({
    type: 'started',
    collectionName: null,
    arguments: null,
    date: new Date()
  }).save().then(function (result) {
    var cursor = ObserveLogs.
    find().
    tailable({ awaitdata: true }).
    cursor();

    cursor.on('data', function (doc) {
      if (!listenStarted && String(result._id) == String(doc._id)) {
        listenStarted = true;
        emitter.emit('ready');
      }
      if (listenStarted) {
        emitter.emit(doc.collectionName, doc);
        lastDocId = String(doc._id);
      } else if (lastDocId && lastDocId == String(doc._id)) {
        listenStarted = true;
        emitter.emit('ready');
      }
    });

    cursor.on('close', function () {
      console.log('closing...');
      emitter.emit('notready');
      setTimeout(observeLogs, 1000);
    });

    cursor.on('error', function (error) {
      console.error(error);
      cursor.destroy();
    });

  }, function (err) {
    setTimeout(observeLogs, 1000);
    console.error(err);
  });
}

observeLogs();exports["default"] =

emitter;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfZXZlbnRzIiwicmVxdWlyZSIsIkV2ZW50RW1pdHRlciIsIl9PYnNlcnZlTG9ncyIsIk9ic2VydmVMb2dzIiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdDIiLCJlbWl0dGVyIiwic2V0TWF4TGlzdGVuZXJzIiwibGlzdGVuU3RhcnRlZCIsImxhc3REb2NJZCIsIm9ic2VydmVMb2dzIiwidHlwZSIsImNvbGxlY3Rpb25OYW1lIiwiYXJndW1lbnRzIiwiZGF0ZSIsIkRhdGUiLCJzYXZlIiwidGhlbiIsInJlc3VsdCIsImN1cnNvciIsImZpbmQiLCJ0YWlsYWJsZSIsImF3YWl0ZGF0YSIsIm9uIiwiZG9jIiwiU3RyaW5nIiwiX2lkIiwiZW1pdCIsImNvbnNvbGUiLCJsb2ciLCJzZXRUaW1lb3V0IiwiZXJyb3IiLCJkZXN0cm95IiwiZXJyIiwiZXhwb3J0cyJdLCJzb3VyY2VzIjpbIi4uL3NyYy9lbWl0dGVyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7RXZlbnRFbWl0dGVyfSBmcm9tICdldmVudHMnO1xuaW1wb3J0IE9ic2VydmVMb2dzIGZyb20gXCIuL09ic2VydmVMb2dzXCI7XG5cbmNvbnN0IGVtaXR0ZXIgPSBuZXcgRXZlbnRFbWl0dGVyKCkuc2V0TWF4TGlzdGVuZXJzKDApO1xuXG5sZXQgbGlzdGVuU3RhcnRlZCA9IGZhbHNlO1xubGV0IGxhc3REb2NJZCA9IG51bGw7XG5cbmZ1bmN0aW9uIG9ic2VydmVMb2dzKCl7XG4gICAgbGlzdGVuU3RhcnRlZCA9IGZhbHNlO1xuICAgIG5ldyBPYnNlcnZlTG9ncyh7XG4gICAgICAgIHR5cGU6J3N0YXJ0ZWQnLFxuICAgICAgICBjb2xsZWN0aW9uTmFtZTpudWxsLFxuICAgICAgICBhcmd1bWVudHM6bnVsbCxcbiAgICAgICAgZGF0ZTpuZXcgRGF0ZSgpXG4gICAgfSkuc2F2ZSgpLnRoZW4oKHJlc3VsdCk9PntcbiAgICAgICAgY29uc3QgY3Vyc29yID0gT2JzZXJ2ZUxvZ3NcbiAgICAgICAgLmZpbmQoKVxuICAgICAgICAudGFpbGFibGUoeyBhd2FpdGRhdGEgOiB0cnVlIH0pXG4gICAgICAgIC5jdXJzb3IoKTtcblxuICAgICAgICBjdXJzb3Iub24oJ2RhdGEnLCAoZG9jKSA9PiB7XG4gICAgICAgICAgICBpZighbGlzdGVuU3RhcnRlZCAmJiBTdHJpbmcocmVzdWx0Ll9pZCkgPT0gU3RyaW5nKGRvYy5faWQpICkge1xuICAgICAgICAgICAgICAgIGxpc3RlblN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGVtaXR0ZXIuZW1pdCgncmVhZHknKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGxpc3RlblN0YXJ0ZWQpe1xuICAgICAgICAgICAgICAgIGVtaXR0ZXIuZW1pdChkb2MuY29sbGVjdGlvbk5hbWUsIGRvYyk7XG4gICAgICAgICAgICAgICAgbGFzdERvY0lkID0gU3RyaW5nKGRvYy5faWQpO1xuICAgICAgICAgICAgfWVsc2UgaWYobGFzdERvY0lkICYmIGxhc3REb2NJZCA9PSBTdHJpbmcoZG9jLl9pZCkpe1xuICAgICAgICAgICAgICAgIGxpc3RlblN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGVtaXR0ZXIuZW1pdCgncmVhZHknKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgY3Vyc29yLm9uKCdjbG9zZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2Nsb3NpbmcuLi4nKTtcbiAgICAgICAgICAgIGVtaXR0ZXIuZW1pdCgnbm90cmVhZHknKTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQob2JzZXJ2ZUxvZ3MsMTAwMCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGN1cnNvci5vbignZXJyb3InLCBlcnJvciA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIGN1cnNvci5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgfSwoZXJyKT0+e1xuICAgICAgICBzZXRUaW1lb3V0KG9ic2VydmVMb2dzLDEwMDApO1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgfSk7XG59XG5cbm9ic2VydmVMb2dzKCk7XG5cbmV4cG9ydCBkZWZhdWx0IGVtaXR0ZXI7Il0sIm1hcHBpbmdzIjoiZ1JBQUEsSUFBQUEsT0FBQSxHQUFBQyxPQUFBLFdBQW9DLElBQTVCQyxZQUFZLEdBQUFGLE9BQUEsQ0FBWkUsWUFBWTtBQUNwQixJQUFBQyxZQUFBLEdBQUFGLE9BQUEsa0JBQXdDLElBQWpDRyxXQUFXLE9BQUFDLHVCQUFBLGFBQUFGLFlBQUE7O0FBRWxCLElBQU1HLE9BQU8sR0FBRyxJQUFJSixZQUFZLENBQUMsQ0FBQyxDQUFDSyxlQUFlLENBQUMsQ0FBQyxDQUFDOztBQUVyRCxJQUFJQyxhQUFhLEdBQUcsS0FBSztBQUN6QixJQUFJQyxTQUFTLEdBQUcsSUFBSTs7QUFFcEIsU0FBU0MsV0FBV0EsQ0FBQSxFQUFFO0VBQ2xCRixhQUFhLEdBQUcsS0FBSztFQUNyQixJQUFJSixXQUFXLENBQUM7SUFDWk8sSUFBSSxFQUFDLFNBQVM7SUFDZEMsY0FBYyxFQUFDLElBQUk7SUFDbkJDLFNBQVMsRUFBQyxJQUFJO0lBQ2RDLElBQUksRUFBQyxJQUFJQyxJQUFJLENBQUM7RUFDbEIsQ0FBQyxDQUFDLENBQUNDLElBQUksQ0FBQyxDQUFDLENBQUNDLElBQUksQ0FBQyxVQUFDQyxNQUFNLEVBQUc7SUFDckIsSUFBTUMsTUFBTSxHQUFHZixXQUFXO0lBQ3pCZ0IsSUFBSSxDQUFDLENBQUM7SUFDTkMsUUFBUSxDQUFDLEVBQUVDLFNBQVMsRUFBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQzlCSCxNQUFNLENBQUMsQ0FBQzs7SUFFVEEsTUFBTSxDQUFDSSxFQUFFLENBQUMsTUFBTSxFQUFFLFVBQUNDLEdBQUcsRUFBSztNQUN2QixJQUFHLENBQUNoQixhQUFhLElBQUlpQixNQUFNLENBQUNQLE1BQU0sQ0FBQ1EsR0FBRyxDQUFDLElBQUlELE1BQU0sQ0FBQ0QsR0FBRyxDQUFDRSxHQUFHLENBQUMsRUFBRztRQUN6RGxCLGFBQWEsR0FBRyxJQUFJO1FBQ3BCRixPQUFPLENBQUNxQixJQUFJLENBQUMsT0FBTyxDQUFDO01BQ3pCO01BQ0EsSUFBR25CLGFBQWEsRUFBQztRQUNiRixPQUFPLENBQUNxQixJQUFJLENBQUNILEdBQUcsQ0FBQ1osY0FBYyxFQUFFWSxHQUFHLENBQUM7UUFDckNmLFNBQVMsR0FBR2dCLE1BQU0sQ0FBQ0QsR0FBRyxDQUFDRSxHQUFHLENBQUM7TUFDL0IsQ0FBQyxNQUFLLElBQUdqQixTQUFTLElBQUlBLFNBQVMsSUFBSWdCLE1BQU0sQ0FBQ0QsR0FBRyxDQUFDRSxHQUFHLENBQUMsRUFBQztRQUMvQ2xCLGFBQWEsR0FBRyxJQUFJO1FBQ3BCRixPQUFPLENBQUNxQixJQUFJLENBQUMsT0FBTyxDQUFDO01BQ3pCO0lBQ0osQ0FBQyxDQUFDOztJQUVGUixNQUFNLENBQUNJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsWUFBVztNQUMxQkssT0FBTyxDQUFDQyxHQUFHLENBQUMsWUFBWSxDQUFDO01BQ3pCdkIsT0FBTyxDQUFDcUIsSUFBSSxDQUFDLFVBQVUsQ0FBQztNQUN4QkcsVUFBVSxDQUFDcEIsV0FBVyxFQUFDLElBQUksQ0FBQztJQUNoQyxDQUFDLENBQUM7O0lBRUZTLE1BQU0sQ0FBQ0ksRUFBRSxDQUFDLE9BQU8sRUFBRSxVQUFBUSxLQUFLLEVBQUk7TUFDeEJILE9BQU8sQ0FBQ0csS0FBSyxDQUFDQSxLQUFLLENBQUM7TUFDcEJaLE1BQU0sQ0FBQ2EsT0FBTyxDQUFDLENBQUM7SUFDcEIsQ0FBQyxDQUFDOztFQUVOLENBQUMsRUFBQyxVQUFDQyxHQUFHLEVBQUc7SUFDTEgsVUFBVSxDQUFDcEIsV0FBVyxFQUFDLElBQUksQ0FBQztJQUM1QmtCLE9BQU8sQ0FBQ0csS0FBSyxDQUFDRSxHQUFHLENBQUM7RUFDdEIsQ0FBQyxDQUFDO0FBQ047O0FBRUF2QixXQUFXLENBQUMsQ0FBQyxDQUFDd0IsT0FBQTs7QUFFQzVCLE9BQU8ifQ==