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
exports.provideHyperclickView = provideHyperclickView;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _atom = require('atom');

var _Hyperclick = require('./Hyperclick');

var _Hyperclick2 = _interopRequireDefault(_Hyperclick);

var _SuggestionList = require('./SuggestionList');

var _SuggestionList2 = _interopRequireDefault(_SuggestionList);

var _SuggestionListElement = require('./SuggestionListElement');

var _SuggestionListElement2 = _interopRequireDefault(_SuggestionListElement);

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

function provideHyperclickView(model) {
  if (!(model instanceof _SuggestionList2['default'])) {
    return;
  }
  return new _SuggestionListElement2['default']().initialize(model);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hc3VhcmV6L3NyYy9naXRodWIvaHlwZXJjbGljay9saWIvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztvQkFrQnlCLE1BQU07OzBCQUNSLGNBQWM7Ozs7OEJBQ1Ysa0JBQWtCOzs7O3FDQUNYLHlCQUF5Qjs7OztBQXJCM0QsV0FBVyxDQUFDOztxQkFnQkwsU0FBUzs7Ozs7a0JBRmQsa0JBQWtCOzs7Ozs7a0JBQ2xCLG9CQUFvQjs7OztBQVF0QixJQUFJLFVBQXVCLEdBQUcsSUFBSSxDQUFDOztBQUU1QixTQUFTLFFBQVEsR0FBRztBQUN6QixZQUFVLEdBQUcsNkJBQWdCLENBQUM7Q0FDL0I7O0FBRU0sU0FBUyxVQUFVLEdBQUc7QUFDM0IsTUFBSSxVQUFVLElBQUksSUFBSSxFQUFFO0FBQ3RCLGNBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUNyQixjQUFVLEdBQUcsSUFBSSxDQUFDO0dBQ25CO0NBQ0Y7O0FBRU0sU0FBUyxlQUFlLENBQzdCLFFBQXdELEVBQzNDO0FBQ2IsTUFBSSxVQUFVLElBQUksSUFBSSxFQUFFO0FBQ3RCLGNBQVUsQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDckMsV0FBTyxxQkFBZSxZQUFNO0FBQzFCLFVBQUksVUFBVSxJQUFJLElBQUksRUFBRTtBQUN0QixrQkFBVSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQztPQUNyQztLQUNGLENBQUMsQ0FBQztHQUNKO0NBQ0Y7Ozs7Ozs7O0FBT00sU0FBUyxpQkFBaUIsR0FBMEM7QUFDekUsU0FBTyxVQUFDLFVBQVUsRUFBc0I7QUFDdEMsUUFBSSxVQUFVLElBQUksSUFBSSxFQUFFO0FBQ3RCLGdCQUFVLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLENBQUM7S0FDMUM7R0FDRixDQUFDO0NBQ0g7O0FBRU0sU0FBUyxxQkFBcUIsQ0FBQyxLQUFZLEVBQTBCO0FBQzFFLE1BQUksRUFBRSxLQUFLLHdDQUEwQixBQUFDLEVBQUU7QUFDdEMsV0FBTztHQUNSO0FBQ0QsU0FBTyx3Q0FBMkIsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7Q0FDdEQiLCJmaWxlIjoiL1VzZXJzL2FzdWFyZXovc3JjL2dpdGh1Yi9oeXBlcmNsaWNrL2xpYi9tYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxuaW1wb3J0IHR5cGUge0h5cGVyY2xpY2tQcm92aWRlcn0gZnJvbSAnLi90eXBlcyc7XG5cbmV4cG9ydCB0eXBlIHtcbiAgSHlwZXJjbGlja1Byb3ZpZGVyLFxuICBIeXBlcmNsaWNrU3VnZ2VzdGlvbixcbn0gZnJvbSAnLi90eXBlcyc7XG5cbmltcG9ydCB7RGlzcG9zYWJsZX0gZnJvbSAnYXRvbSc7XG5pbXBvcnQgSHlwZXJjbGljayBmcm9tICcuL0h5cGVyY2xpY2snO1xuaW1wb3J0IFN1Z2dlc3Rpb25MaXN0IGZyb20gJy4vU3VnZ2VzdGlvbkxpc3QnO1xuaW1wb3J0IFN1Z2dlc3Rpb25MaXN0RWxlbWVudCBmcm9tICcuL1N1Z2dlc3Rpb25MaXN0RWxlbWVudCc7XG5cbmxldCBoeXBlcmNsaWNrOiA/SHlwZXJjbGljayA9IG51bGw7XG5cbmV4cG9ydCBmdW5jdGlvbiBhY3RpdmF0ZSgpIHtcbiAgaHlwZXJjbGljayA9IG5ldyBIeXBlcmNsaWNrKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZWFjdGl2YXRlKCkge1xuICBpZiAoaHlwZXJjbGljayAhPSBudWxsKSB7XG4gICAgaHlwZXJjbGljay5kaXNwb3NlKCk7XG4gICAgaHlwZXJjbGljayA9IG51bGw7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbnN1bWVQcm92aWRlcihcbiAgcHJvdmlkZXI6IEh5cGVyY2xpY2tQcm92aWRlciB8IEFycmF5PEh5cGVyY2xpY2tQcm92aWRlcj4sXG4pOiA/RGlzcG9zYWJsZSB7XG4gIGlmIChoeXBlcmNsaWNrICE9IG51bGwpIHtcbiAgICBoeXBlcmNsaWNrLmNvbnN1bWVQcm92aWRlcihwcm92aWRlcik7XG4gICAgcmV0dXJuIG5ldyBEaXNwb3NhYmxlKCgpID0+IHtcbiAgICAgIGlmIChoeXBlcmNsaWNrICE9IG51bGwpIHtcbiAgICAgICAgaHlwZXJjbGljay5yZW1vdmVQcm92aWRlcihwcm92aWRlcik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBBIFRleHRFZGl0b3Igd2hvc2UgY3JlYXRpb24gaXMgYW5ub3VuY2VkIHZpYSBhdG9tLndvcmtzcGFjZS5vYnNlcnZlVGV4dEVkaXRvcnMoKSB3aWxsIGJlXG4gKiBvYnNlcnZlZCBieSBkZWZhdWx0IGJ5IGh5cGVyY2xpY2suIEhvd2V2ZXIsIGlmIGEgVGV4dEVkaXRvciBpcyBjcmVhdGVkIHZpYSBzb21lIG90aGVyIG1lYW5zLFxuICogKHN1Y2ggYXMgYSBidWlsZGluZyBibG9jayBmb3IgYSBwaWVjZSBvZiBVSSksIHRoZW4gaXQgbXVzdCBiZSBvYnNlcnZlZCBleHBsaWNpdGx5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gb2JzZXJ2ZVRleHRFZGl0b3IoKTogKHRleHRFZGl0b3I6IGF0b20kVGV4dEVkaXRvcikgPT4gdm9pZCB7XG4gIHJldHVybiAodGV4dEVkaXRvcjogYXRvbSRUZXh0RWRpdG9yKSA9PiB7XG4gICAgaWYgKGh5cGVyY2xpY2sgIT0gbnVsbCkge1xuICAgICAgaHlwZXJjbGljay5vYnNlcnZlVGV4dEVkaXRvcih0ZXh0RWRpdG9yKTtcbiAgICB9XG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwcm92aWRlSHlwZXJjbGlja1ZpZXcobW9kZWw6IG1peGVkKTogP1N1Z2dlc3Rpb25MaXN0RWxlbWVudCB7XG4gIGlmICghKG1vZGVsIGluc3RhbmNlb2YgU3VnZ2VzdGlvbkxpc3QpKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHJldHVybiBuZXcgU3VnZ2VzdGlvbkxpc3RFbGVtZW50KCkuaW5pdGlhbGl6ZShtb2RlbCk7XG59XG4iXX0=