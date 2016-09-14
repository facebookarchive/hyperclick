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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hc3VhcmV6L0Rvd25sb2Fkcy9oeXBlcmNsaWNrL2xpYi9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7b0JBa0J5QixNQUFNOzswQkFDUixjQUFjOzs7O0FBbkJyQyxXQUFXLENBQUM7O3FCQWdCTCxTQUFTOzs7OztrQkFGZCxrQkFBa0I7Ozs7OztrQkFDbEIsb0JBQW9COzs7O0FBTXRCLElBQUksVUFBdUIsR0FBRyxJQUFJLENBQUM7O0FBRTVCLFNBQVMsUUFBUSxHQUFHO0FBQ3pCLFlBQVUsR0FBRyw2QkFBZ0IsQ0FBQztDQUMvQjs7QUFFTSxTQUFTLFVBQVUsR0FBRztBQUMzQixNQUFJLFVBQVUsSUFBSSxJQUFJLEVBQUU7QUFDdEIsY0FBVSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ3JCLGNBQVUsR0FBRyxJQUFJLENBQUM7R0FDbkI7Q0FDRjs7QUFFTSxTQUFTLGVBQWUsQ0FDN0IsUUFBd0QsRUFDM0M7QUFDYixNQUFJLFVBQVUsSUFBSSxJQUFJLEVBQUU7QUFDdEIsY0FBVSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNyQyxXQUFPLHFCQUFlLFlBQU07QUFDMUIsVUFBSSxVQUFVLElBQUksSUFBSSxFQUFFO0FBQ3RCLGtCQUFVLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDO09BQ3JDO0tBQ0YsQ0FBQyxDQUFDO0dBQ0o7Q0FDRjs7Ozs7Ozs7QUFPTSxTQUFTLGlCQUFpQixHQUEwQztBQUN6RSxTQUFPLFVBQUMsVUFBVSxFQUFzQjtBQUN0QyxRQUFJLFVBQVUsSUFBSSxJQUFJLEVBQUU7QUFDdEIsZ0JBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsQ0FBQztLQUMxQztHQUNGLENBQUM7Q0FDSCIsImZpbGUiOiIvVXNlcnMvYXN1YXJlei9Eb3dubG9hZHMvaHlwZXJjbGljay9saWIvbWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbmltcG9ydCB0eXBlIHtIeXBlcmNsaWNrUHJvdmlkZXJ9IGZyb20gJy4vdHlwZXMnO1xuXG5leHBvcnQgdHlwZSB7XG4gIEh5cGVyY2xpY2tQcm92aWRlcixcbiAgSHlwZXJjbGlja1N1Z2dlc3Rpb24sXG59IGZyb20gJy4vdHlwZXMnO1xuXG5pbXBvcnQge0Rpc3Bvc2FibGV9IGZyb20gJ2F0b20nO1xuaW1wb3J0IEh5cGVyY2xpY2sgZnJvbSAnLi9IeXBlcmNsaWNrJztcblxubGV0IGh5cGVyY2xpY2s6ID9IeXBlcmNsaWNrID0gbnVsbDtcblxuZXhwb3J0IGZ1bmN0aW9uIGFjdGl2YXRlKCkge1xuICBoeXBlcmNsaWNrID0gbmV3IEh5cGVyY2xpY2soKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlYWN0aXZhdGUoKSB7XG4gIGlmIChoeXBlcmNsaWNrICE9IG51bGwpIHtcbiAgICBoeXBlcmNsaWNrLmRpc3Bvc2UoKTtcbiAgICBoeXBlcmNsaWNrID0gbnVsbDtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY29uc3VtZVByb3ZpZGVyKFxuICBwcm92aWRlcjogSHlwZXJjbGlja1Byb3ZpZGVyIHwgQXJyYXk8SHlwZXJjbGlja1Byb3ZpZGVyPixcbik6ID9EaXNwb3NhYmxlIHtcbiAgaWYgKGh5cGVyY2xpY2sgIT0gbnVsbCkge1xuICAgIGh5cGVyY2xpY2suY29uc3VtZVByb3ZpZGVyKHByb3ZpZGVyKTtcbiAgICByZXR1cm4gbmV3IERpc3Bvc2FibGUoKCkgPT4ge1xuICAgICAgaWYgKGh5cGVyY2xpY2sgIT0gbnVsbCkge1xuICAgICAgICBoeXBlcmNsaWNrLnJlbW92ZVByb3ZpZGVyKHByb3ZpZGVyKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuXG4vKipcbiAqIEEgVGV4dEVkaXRvciB3aG9zZSBjcmVhdGlvbiBpcyBhbm5vdW5jZWQgdmlhIGF0b20ud29ya3NwYWNlLm9ic2VydmVUZXh0RWRpdG9ycygpIHdpbGwgYmVcbiAqIG9ic2VydmVkIGJ5IGRlZmF1bHQgYnkgaHlwZXJjbGljay4gSG93ZXZlciwgaWYgYSBUZXh0RWRpdG9yIGlzIGNyZWF0ZWQgdmlhIHNvbWUgb3RoZXIgbWVhbnMsXG4gKiAoc3VjaCBhcyBhIGJ1aWxkaW5nIGJsb2NrIGZvciBhIHBpZWNlIG9mIFVJKSwgdGhlbiBpdCBtdXN0IGJlIG9ic2VydmVkIGV4cGxpY2l0bHkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBvYnNlcnZlVGV4dEVkaXRvcigpOiAodGV4dEVkaXRvcjogYXRvbSRUZXh0RWRpdG9yKSA9PiB2b2lkIHtcbiAgcmV0dXJuICh0ZXh0RWRpdG9yOiBhdG9tJFRleHRFZGl0b3IpID0+IHtcbiAgICBpZiAoaHlwZXJjbGljayAhPSBudWxsKSB7XG4gICAgICBoeXBlcmNsaWNrLm9ic2VydmVUZXh0RWRpdG9yKHRleHRFZGl0b3IpO1xuICAgIH1cbiAgfTtcbn1cbiJdfQ==