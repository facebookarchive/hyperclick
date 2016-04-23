Object.defineProperty(exports, '__esModule', {
  value: true
});

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

exports.activate = activate;
exports.deactivate = deactivate;
exports.consumeProvider = consumeProvider;
exports.observeTextEditor = observeTextEditor;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _atom = require('atom');

var _Hyperclick = require('./Hyperclick');

var _Hyperclick2 = _interopRequireDefault(_Hyperclick);

'use babel';

var _types = require('./types');

Object.defineProperty(exports, 'HyperclickProvider', {
  enumerable: true,
  get: function get() {
    return _types.HyperclickProvider;
  }
});
Object.defineProperty(exports, 'HyperclickSuggestion', {
  enumerable: true,
  get: function get() {
    return _types.HyperclickSuggestion;
  }
});

var hyperclick = null;

function activate() {
  hyperclick = new _Hyperclick2['default']();
}

function deactivate() {
  if (hyperclick != null) {
    hyperclick.dispose();
    hyperclick = null;
  }
}

function consumeProvider(provider) {
  if (hyperclick != null) {
    hyperclick.consumeProvider(provider);
    return new _atom.Disposable(function () {
      if (hyperclick != null) {
        hyperclick.removeProvider(provider);
      }
    });
  }
}

/**
 * A TextEditor whose creation is announced via atom.workspace.observeTextEditors() will be
 * observed by default by hyperclick. However, if a TextEditor is created via some other means,
 * (such as a building block for a piece of UI), then it must be observed explicitly.
 */

function observeTextEditor() {
  return function (textEditor) {
    if (hyperclick != null) {
      hyperclick.observeTextEditor(textEditor);
    }
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hc3VhcmV6L0Rlc2t0b3AvaHlwZXJjbGljay9saWIvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O29CQWtCeUIsTUFBTTs7MEJBQ1IsY0FBYzs7OztBQW5CckMsV0FBVyxDQUFDOztxQkFnQkwsU0FBUzs7Ozs7a0JBRmQsa0JBQWtCOzs7Ozs7a0JBQ2xCLG9CQUFvQjs7OztBQU10QixJQUFJLFVBQXVCLEdBQUcsSUFBSSxDQUFDOztBQUU1QixTQUFTLFFBQVEsR0FBRztBQUN6QixZQUFVLEdBQUcsNkJBQWdCLENBQUM7Q0FDL0I7O0FBRU0sU0FBUyxVQUFVLEdBQUc7QUFDM0IsTUFBSSxVQUFVLElBQUksSUFBSSxFQUFFO0FBQ3RCLGNBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUNyQixjQUFVLEdBQUcsSUFBSSxDQUFDO0dBQ25CO0NBQ0Y7O0FBRU0sU0FBUyxlQUFlLENBQzdCLFFBQXdELEVBQzNDO0FBQ2IsTUFBSSxVQUFVLElBQUksSUFBSSxFQUFFO0FBQ3RCLGNBQVUsQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDckMsV0FBTyxxQkFBZSxZQUFNO0FBQzFCLFVBQUksVUFBVSxJQUFJLElBQUksRUFBRTtBQUN0QixrQkFBVSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQztPQUNyQztLQUNGLENBQUMsQ0FBQztHQUNKO0NBQ0Y7Ozs7Ozs7O0FBT00sU0FBUyxpQkFBaUIsR0FBMEM7QUFDekUsU0FBTyxVQUFDLFVBQVUsRUFBc0I7QUFDdEMsUUFBSSxVQUFVLElBQUksSUFBSSxFQUFFO0FBQ3RCLGdCQUFVLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLENBQUM7S0FDMUM7R0FDRixDQUFDO0NBQ0giLCJmaWxlIjoiL1VzZXJzL2FzdWFyZXovRGVza3RvcC9oeXBlcmNsaWNrL2xpYi9tYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxuaW1wb3J0IHR5cGUge0h5cGVyY2xpY2tQcm92aWRlcn0gZnJvbSAnLi90eXBlcyc7XG5cbmV4cG9ydCB0eXBlIHtcbiAgSHlwZXJjbGlja1Byb3ZpZGVyLFxuICBIeXBlcmNsaWNrU3VnZ2VzdGlvbixcbn0gZnJvbSAnLi90eXBlcyc7XG5cbmltcG9ydCB7RGlzcG9zYWJsZX0gZnJvbSAnYXRvbSc7XG5pbXBvcnQgSHlwZXJjbGljayBmcm9tICcuL0h5cGVyY2xpY2snO1xuXG5sZXQgaHlwZXJjbGljazogP0h5cGVyY2xpY2sgPSBudWxsO1xuXG5leHBvcnQgZnVuY3Rpb24gYWN0aXZhdGUoKSB7XG4gIGh5cGVyY2xpY2sgPSBuZXcgSHlwZXJjbGljaygpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVhY3RpdmF0ZSgpIHtcbiAgaWYgKGh5cGVyY2xpY2sgIT0gbnVsbCkge1xuICAgIGh5cGVyY2xpY2suZGlzcG9zZSgpO1xuICAgIGh5cGVyY2xpY2sgPSBudWxsO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb25zdW1lUHJvdmlkZXIoXG4gIHByb3ZpZGVyOiBIeXBlcmNsaWNrUHJvdmlkZXIgfCBBcnJheTxIeXBlcmNsaWNrUHJvdmlkZXI+LFxuKTogP0Rpc3Bvc2FibGUge1xuICBpZiAoaHlwZXJjbGljayAhPSBudWxsKSB7XG4gICAgaHlwZXJjbGljay5jb25zdW1lUHJvdmlkZXIocHJvdmlkZXIpO1xuICAgIHJldHVybiBuZXcgRGlzcG9zYWJsZSgoKSA9PiB7XG4gICAgICBpZiAoaHlwZXJjbGljayAhPSBudWxsKSB7XG4gICAgICAgIGh5cGVyY2xpY2sucmVtb3ZlUHJvdmlkZXIocHJvdmlkZXIpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogQSBUZXh0RWRpdG9yIHdob3NlIGNyZWF0aW9uIGlzIGFubm91bmNlZCB2aWEgYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZVRleHRFZGl0b3JzKCkgd2lsbCBiZVxuICogb2JzZXJ2ZWQgYnkgZGVmYXVsdCBieSBoeXBlcmNsaWNrLiBIb3dldmVyLCBpZiBhIFRleHRFZGl0b3IgaXMgY3JlYXRlZCB2aWEgc29tZSBvdGhlciBtZWFucyxcbiAqIChzdWNoIGFzIGEgYnVpbGRpbmcgYmxvY2sgZm9yIGEgcGllY2Ugb2YgVUkpLCB0aGVuIGl0IG11c3QgYmUgb2JzZXJ2ZWQgZXhwbGljaXRseS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG9ic2VydmVUZXh0RWRpdG9yKCk6ICh0ZXh0RWRpdG9yOiBhdG9tJFRleHRFZGl0b3IpID0+IHZvaWQge1xuICByZXR1cm4gKHRleHRFZGl0b3I6IGF0b20kVGV4dEVkaXRvcikgPT4ge1xuICAgIGlmIChoeXBlcmNsaWNrICE9IG51bGwpIHtcbiAgICAgIGh5cGVyY2xpY2sub2JzZXJ2ZVRleHRFZGl0b3IodGV4dEVkaXRvcik7XG4gICAgfVxuICB9O1xufVxuIl19