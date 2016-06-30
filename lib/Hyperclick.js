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

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

/**
 * Calls the given functions and returns the first non-null return value.
 */

var findTruthyReturnValue = _asyncToGenerator(function* (fns) {
  /* eslint-disable babel/no-await-in-loop */
  for (var fn of fns) {
    var result = typeof fn === 'function' ? (yield fn()) : null;
    if (result) {
      return result;
    }
  }
  /* eslint-enable babel/no-await-in-loop */
}

/**
 * Construct this object to enable Hyperclick in the Atom workspace.
 * Call `dispose` to disable the feature.
 */
);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

var _HyperclickForTextEditor = require('./HyperclickForTextEditor');

var _HyperclickForTextEditor2 = _interopRequireDefault(_HyperclickForTextEditor);

var _SuggestionList = require('./SuggestionList');

var _SuggestionList2 = _interopRequireDefault(_SuggestionList);

var _SuggestionListElement = require('./SuggestionListElement');

var _SuggestionListElement2 = _interopRequireDefault(_SuggestionListElement);

var _hyperclickUtils = require('./hyperclick-utils');

'use babel';

var Hyperclick = (function () {
  function Hyperclick() {
    _classCallCheck(this, Hyperclick);

    this._consumedProviders = [];

    this._suggestionList = new _SuggestionList2['default']();
    this._suggestionListViewSubscription = atom.views.addViewProvider(_SuggestionList2['default'], function (model) {
      return new _SuggestionListElement2['default']().initialize(model);
    });

    this._hyperclickForTextEditors = new Set();
    this._textEditorSubscription = atom.workspace.observeTextEditors(this.observeTextEditor.bind(this));
  }

  /** Returns the provider name or a default value */

  _createClass(Hyperclick, [{
    key: 'observeTextEditor',
    value: function observeTextEditor(textEditor) {
      var _this = this;

      var hyperclickForTextEditor = new _HyperclickForTextEditor2['default'](textEditor, this);
      this._hyperclickForTextEditors.add(hyperclickForTextEditor);
      textEditor.onDidDestroy(function () {
        hyperclickForTextEditor.dispose();
        _this._hyperclickForTextEditors['delete'](hyperclickForTextEditor);
      });
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      if (this._suggestionListViewSubscription) {
        this._suggestionListViewSubscription.dispose();
      }
      if (this._textEditorSubscription) {
        this._textEditorSubscription.dispose();
      }
      this._hyperclickForTextEditors.forEach(function (hyperclick) {
        return hyperclick.dispose();
      });
      this._hyperclickForTextEditors.clear();
    }
  }, {
    key: '_applyToAll',
    value: function _applyToAll(item, f) {
      if (Array.isArray(item)) {
        item.forEach(function (x) {
          return f(x);
        });
      } else {
        f(item);
      }
    }
  }, {
    key: 'consumeProvider',
    value: function consumeProvider(provider) {
      var _this2 = this;

      this._applyToAll(provider, function (singleProvider) {
        return _this2._consumeSingleProvider(singleProvider);
      });
    }
  }, {
    key: 'removeProvider',
    value: function removeProvider(provider) {
      var _this3 = this;

      this._applyToAll(provider, function (singleProvider) {
        return _this3._removeSingleProvider(singleProvider);
      });
    }
  }, {
    key: '_consumeSingleProvider',
    value: function _consumeSingleProvider(provider) {
      var priority = provider.priority || 0;
      for (var i = 0, len = this._consumedProviders.length; i < len; i++) {
        var item = this._consumedProviders[i];
        if (provider === item) {
          return;
        }

        var itemPriority = item.priority || 0;
        if (priority > itemPriority) {
          this._consumedProviders.splice(i, 0, provider);
          return;
        }
      }

      // If we made it all the way through the loop, provider must be lower
      // priority than all of the existing providers, so add it to the end.
      this._consumedProviders.push(provider);
    }
  }, {
    key: '_removeSingleProvider',
    value: function _removeSingleProvider(provider) {
      var index = this._consumedProviders.indexOf(provider);
      if (index >= 0) {
        this._consumedProviders.splice(index, 1);
      }
    }

    /**
     * Returns the first suggestion from the consumed providers.
     */
  }, {
    key: 'getSuggestion',
    value: function getSuggestion(textEditor, position) {
      // Get the default word RegExp for this editor.
      var defaultWordRegExp = (0, _hyperclickUtils.defaultWordRegExpForEditor)(textEditor);

      return findTruthyReturnValue(this._consumedProviders.map(function (provider) {
        if (provider.getSuggestion) {
          var _ret = (function () {
            var getSuggestion = provider.getSuggestion.bind(provider);
            return {
              v: function () {
                return getSuggestion(textEditor, position);
              }
            };
          })();

          if (typeof _ret === 'object') return _ret.v;
        } else if (provider.getSuggestionForWord) {
          var _ret2 = (function () {
            var getSuggestionForWord = provider.getSuggestionForWord.bind(provider);
            return {
              v: function () {
                var wordRegExp = provider.wordRegExp || defaultWordRegExp;

                var _getWordTextAndRange = (0, _hyperclickUtils.getWordTextAndRange)(textEditor, position, wordRegExp);

                var text = _getWordTextAndRange.text;
                var range = _getWordTextAndRange.range;

                return getSuggestionForWord(textEditor, text, range);
              }
            };
          })();

          if (typeof _ret2 === 'object') return _ret2.v;
        }

        throw new Error('Hyperclick must have either `getSuggestion` or `getSuggestionForWord`');
      }));
    }
  }, {
    key: 'showSuggestionList',
    value: function showSuggestionList(textEditor, suggestion) {
      this._suggestionList.show(textEditor, suggestion);
    }
  }]);

  return Hyperclick;
})();

exports['default'] = Hyperclick;
function getProviderName(provider) {
  if (provider.providerName != null) {
    return provider.providerName;
  } else {
    return 'unnamed-hyperclick-provider';
  }
}
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hc3VhcmV6L0Rvd25sb2Fkcy9oeXBlcmNsaWNrL2xpYi9IeXBlcmNsaWNrLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQTJCZSxxQkFBcUIscUJBQXBDLFdBQXFDLEdBQXFDLEVBQWdCOztBQUV4RixPQUFLLElBQU0sRUFBRSxJQUFJLEdBQUcsRUFBRTtBQUNwQixRQUFNLE1BQU0sR0FBRyxPQUFPLEVBQUUsS0FBSyxVQUFVLElBQUcsTUFBTSxFQUFFLEVBQUUsQ0FBQSxHQUFHLElBQUksQ0FBQztBQUM1RCxRQUFJLE1BQU0sRUFBRTtBQUNWLGFBQU8sTUFBTSxDQUFDO0tBQ2Y7R0FDRjs7Q0FFRjs7Ozs7Ozs7Ozs7Ozs7dUNBcEJtQywyQkFBMkI7Ozs7OEJBQ3BDLGtCQUFrQjs7OztxQ0FDWCx5QkFBeUI7Ozs7K0JBSXBELG9CQUFvQjs7QUF0QjNCLFdBQVcsQ0FBQzs7SUEwQ1MsVUFBVTtBQU9sQixXQVBRLFVBQVUsR0FPZjswQkFQSyxVQUFVOztBQVEzQixRQUFJLENBQUMsa0JBQWtCLEdBQUcsRUFBRSxDQUFDOztBQUU3QixRQUFJLENBQUMsZUFBZSxHQUFHLGlDQUFvQixDQUFDO0FBQzVDLFFBQUksQ0FBQywrQkFBK0IsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsOEJBRTdELFVBQUEsS0FBSzthQUFJLHdDQUEyQixDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUM7S0FBQSxDQUFDLENBQUM7O0FBRTVELFFBQUksQ0FBQyx5QkFBeUIsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO0FBQzNDLFFBQUksQ0FBQyx1QkFBdUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGtCQUFrQixDQUM5RCxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7R0FDdEM7Ozs7ZUFsQmtCLFVBQVU7O1dBb0JaLDJCQUFDLFVBQXNCLEVBQUU7OztBQUN4QyxVQUFNLHVCQUF1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QixNQUFNO0FBQ0wsV0FBTyw2QkFBNkIsQ0FBQztHQUN0QztDQUNGIiwiZmlsZSI6Ii9Vc2Vycy9hc3VhcmV6L0Rvd25sb2Fkcy9oeXBlcmNsaWNrL2xpYi9IeXBlcmNsaWNrLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxuaW1wb3J0IHR5cGUge1xuICBIeXBlcmNsaWNrU3VnZ2VzdGlvbixcbiAgSHlwZXJjbGlja1Byb3ZpZGVyLFxufSBmcm9tICcuL3R5cGVzJztcblxuaW1wb3J0IEh5cGVyY2xpY2tGb3JUZXh0RWRpdG9yIGZyb20gJy4vSHlwZXJjbGlja0ZvclRleHRFZGl0b3InO1xuaW1wb3J0IFN1Z2dlc3Rpb25MaXN0IGZyb20gJy4vU3VnZ2VzdGlvbkxpc3QnO1xuaW1wb3J0IFN1Z2dlc3Rpb25MaXN0RWxlbWVudCBmcm9tICcuL1N1Z2dlc3Rpb25MaXN0RWxlbWVudCc7XG5pbXBvcnQge1xuICBkZWZhdWx0V29yZFJlZ0V4cEZvckVkaXRvcixcbiAgZ2V0V29yZFRleHRBbmRSYW5nZSxcbn0gZnJvbSAnLi9oeXBlcmNsaWNrLXV0aWxzJztcblxuLyoqXG4gKiBDYWxscyB0aGUgZ2l2ZW4gZnVuY3Rpb25zIGFuZCByZXR1cm5zIHRoZSBmaXJzdCBub24tbnVsbCByZXR1cm4gdmFsdWUuXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGZpbmRUcnV0aHlSZXR1cm5WYWx1ZShmbnM6IEFycmF5PHZvaWQgfCAoKSA9PiBQcm9taXNlPGFueT4+KTogUHJvbWlzZTxhbnk+IHtcbiAgLyogZXNsaW50LWRpc2FibGUgYmFiZWwvbm8tYXdhaXQtaW4tbG9vcCAqL1xuICBmb3IgKGNvbnN0IGZuIG9mIGZucykge1xuICAgIGNvbnN0IHJlc3VsdCA9IHR5cGVvZiBmbiA9PT0gJ2Z1bmN0aW9uJyA/IGF3YWl0IGZuKCkgOiBudWxsO1xuICAgIGlmIChyZXN1bHQpIHtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICB9XG4gIC8qIGVzbGludC1lbmFibGUgYmFiZWwvbm8tYXdhaXQtaW4tbG9vcCAqL1xufVxuXG4vKipcbiAqIENvbnN0cnVjdCB0aGlzIG9iamVjdCB0byBlbmFibGUgSHlwZXJjbGljayBpbiB0aGUgQXRvbSB3b3Jrc3BhY2UuXG4gKiBDYWxsIGBkaXNwb3NlYCB0byBkaXNhYmxlIHRoZSBmZWF0dXJlLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBIeXBlcmNsaWNrIHtcbiAgX2NvbnN1bWVkUHJvdmlkZXJzOiBBcnJheTxIeXBlcmNsaWNrUHJvdmlkZXI+O1xuICBfc3VnZ2VzdGlvbkxpc3Q6IFN1Z2dlc3Rpb25MaXN0O1xuICBfc3VnZ2VzdGlvbkxpc3RWaWV3U3Vic2NyaXB0aW9uOiBJRGlzcG9zYWJsZTtcbiAgX2h5cGVyY2xpY2tGb3JUZXh0RWRpdG9yczogU2V0PEh5cGVyY2xpY2tGb3JUZXh0RWRpdG9yPjtcbiAgX3RleHRFZGl0b3JTdWJzY3JpcHRpb246IElEaXNwb3NhYmxlO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuX2NvbnN1bWVkUHJvdmlkZXJzID0gW107XG5cbiAgICB0aGlzLl9zdWdnZXN0aW9uTGlzdCA9IG5ldyBTdWdnZXN0aW9uTGlzdCgpO1xuICAgIHRoaXMuX3N1Z2dlc3Rpb25MaXN0Vmlld1N1YnNjcmlwdGlvbiA9IGF0b20udmlld3MuYWRkVmlld1Byb3ZpZGVyKFxuICAgICAgICBTdWdnZXN0aW9uTGlzdCxcbiAgICAgICAgbW9kZWwgPT4gbmV3IFN1Z2dlc3Rpb25MaXN0RWxlbWVudCgpLmluaXRpYWxpemUobW9kZWwpKTtcblxuICAgIHRoaXMuX2h5cGVyY2xpY2tGb3JUZXh0RWRpdG9ycyA9IG5ldyBTZXQoKTtcbiAgICB0aGlzLl90ZXh0RWRpdG9yU3Vic2NyaXB0aW9uID0gYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZVRleHRFZGl0b3JzKFxuICAgICAgdGhpcy5vYnNlcnZlVGV4dEVkaXRvci5iaW5kKHRoaXMpKTtcbiAgfVxuXG4gIG9ic2VydmVUZXh0RWRpdG9yKHRleHRFZGl0b3I6IFRleHRFZGl0b3IpIHtcbiAgICBjb25zdCBoeXBlcmNsaWNrRm9yVGV4dEVkaXRvciA9IG5ldyBIeXBlcmNsaWNrRm9yVGV4dEVkaXRvcih0ZXh0RWRpdG9yLCB0aGlzKTtcbiAgICB0aGlzLl9oeXBlcmNsaWNrRm9yVGV4dEVkaXRvcnMuYWRkKGh5cGVyY2xpY2tGb3JUZXh0RWRpdG9yKTtcbiAgICB0ZXh0RWRpdG9yLm9uRGlkRGVzdHJveSgoKSA9PiB7XG4gICAgICBoeXBlcmNsaWNrRm9yVGV4dEVkaXRvci5kaXNwb3NlKCk7XG4gICAgICB0aGlzLl9oeXBlcmNsaWNrRm9yVGV4dEVkaXRvcnMuZGVsZXRlKGh5cGVyY2xpY2tGb3JUZXh0RWRpdG9yKTtcbiAgICB9KTtcbiAgfVxuXG4gIGRpc3Bvc2UoKSB7XG4gICAgaWYgKHRoaXMuX3N1Z2dlc3Rpb25MaXN0Vmlld1N1YnNjcmlwdGlvbikge1xuICAgICAgdGhpcy5fc3VnZ2VzdGlvbkxpc3RWaWV3U3Vic2NyaXB0aW9uLmRpc3Bvc2UoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuX3RleHRFZGl0b3JTdWJzY3JpcHRpb24pIHtcbiAgICAgIHRoaXMuX3RleHRFZGl0b3JTdWJzY3JpcHRpb24uZGlzcG9zZSgpO1xuICAgIH1cbiAgICB0aGlzLl9oeXBlcmNsaWNrRm9yVGV4dEVkaXRvcnMuZm9yRWFjaChoeXBlcmNsaWNrID0+IGh5cGVyY2xpY2suZGlzcG9zZSgpKTtcbiAgICB0aGlzLl9oeXBlcmNsaWNrRm9yVGV4dEVkaXRvcnMuY2xlYXIoKTtcbiAgfVxuXG4gIF9hcHBseVRvQWxsPFQ+KGl0ZW06IEFycmF5PFQ+IHwgVCwgZjogKHg6IFQpID0+IHZvaWQpOiB2b2lkIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShpdGVtKSkge1xuICAgICAgaXRlbS5mb3JFYWNoKHggPT4gZih4KSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGYoaXRlbSk7XG4gICAgfVxuICB9XG5cbiAgY29uc3VtZVByb3ZpZGVyKHByb3ZpZGVyOiBIeXBlcmNsaWNrUHJvdmlkZXIgfCBBcnJheTxIeXBlcmNsaWNrUHJvdmlkZXI+KTogdm9pZCB7XG4gICAgdGhpcy5fYXBwbHlUb0FsbChwcm92aWRlciwgc2luZ2xlUHJvdmlkZXIgPT4gdGhpcy5fY29uc3VtZVNpbmdsZVByb3ZpZGVyKHNpbmdsZVByb3ZpZGVyKSk7XG4gIH1cblxuICByZW1vdmVQcm92aWRlcihwcm92aWRlcjogSHlwZXJjbGlja1Byb3ZpZGVyIHwgQXJyYXk8SHlwZXJjbGlja1Byb3ZpZGVyPik6IHZvaWQge1xuICAgIHRoaXMuX2FwcGx5VG9BbGwocHJvdmlkZXIsIHNpbmdsZVByb3ZpZGVyID0+IHRoaXMuX3JlbW92ZVNpbmdsZVByb3ZpZGVyKHNpbmdsZVByb3ZpZGVyKSk7XG4gIH1cblxuICBfY29uc3VtZVNpbmdsZVByb3ZpZGVyKHByb3ZpZGVyOiBIeXBlcmNsaWNrUHJvdmlkZXIpOiB2b2lkIHtcbiAgICBjb25zdCBwcmlvcml0eSA9IHByb3ZpZGVyLnByaW9yaXR5IHx8IDA7XG4gICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHRoaXMuX2NvbnN1bWVkUHJvdmlkZXJzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBjb25zdCBpdGVtID0gdGhpcy5fY29uc3VtZWRQcm92aWRlcnNbaV07XG4gICAgICBpZiAocHJvdmlkZXIgPT09IGl0ZW0pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBpdGVtUHJpb3JpdHkgPSBpdGVtLnByaW9yaXR5IHx8IDA7XG4gICAgICBpZiAocHJpb3JpdHkgPiBpdGVtUHJpb3JpdHkpIHtcbiAgICAgICAgdGhpcy5fY29uc3VtZWRQcm92aWRlcnMuc3BsaWNlKGksIDAsIHByb3ZpZGVyKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIElmIHdlIG1hZGUgaXQgYWxsIHRoZSB3YXkgdGhyb3VnaCB0aGUgbG9vcCwgcHJvdmlkZXIgbXVzdCBiZSBsb3dlclxuICAgIC8vIHByaW9yaXR5IHRoYW4gYWxsIG9mIHRoZSBleGlzdGluZyBwcm92aWRlcnMsIHNvIGFkZCBpdCB0byB0aGUgZW5kLlxuICAgIHRoaXMuX2NvbnN1bWVkUHJvdmlkZXJzLnB1c2gocHJvdmlkZXIpO1xuICB9XG5cbiAgX3JlbW92ZVNpbmdsZVByb3ZpZGVyKHByb3ZpZGVyOiBIeXBlcmNsaWNrUHJvdmlkZXIpOiB2b2lkIHtcbiAgICBjb25zdCBpbmRleCA9IHRoaXMuX2NvbnN1bWVkUHJvdmlkZXJzLmluZGV4T2YocHJvdmlkZXIpO1xuICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICB0aGlzLl9jb25zdW1lZFByb3ZpZGVycy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBmaXJzdCBzdWdnZXN0aW9uIGZyb20gdGhlIGNvbnN1bWVkIHByb3ZpZGVycy5cbiAgICovXG4gIGdldFN1Z2dlc3Rpb24odGV4dEVkaXRvcjogVGV4dEVkaXRvciwgcG9zaXRpb246IGF0b20kUG9pbnQpOiBQcm9taXNlIHtcbiAgICAvLyBHZXQgdGhlIGRlZmF1bHQgd29yZCBSZWdFeHAgZm9yIHRoaXMgZWRpdG9yLlxuICAgIGNvbnN0IGRlZmF1bHRXb3JkUmVnRXhwID0gZGVmYXVsdFdvcmRSZWdFeHBGb3JFZGl0b3IodGV4dEVkaXRvcik7XG5cbiAgICByZXR1cm4gZmluZFRydXRoeVJldHVyblZhbHVlKHRoaXMuX2NvbnN1bWVkUHJvdmlkZXJzLm1hcCgocHJvdmlkZXI6IEh5cGVyY2xpY2tQcm92aWRlcikgPT4ge1xuICAgICAgaWYgKHByb3ZpZGVyLmdldFN1Z2dlc3Rpb24pIHtcbiAgICAgICAgY29uc3QgZ2V0U3VnZ2VzdGlvbiA9IHByb3ZpZGVyLmdldFN1Z2dlc3Rpb24uYmluZChwcm92aWRlcik7XG4gICAgICAgIHJldHVybiAoKSA9PiBnZXRTdWdnZXN0aW9uKHRleHRFZGl0b3IsIHBvc2l0aW9uKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvdmlkZXIuZ2V0U3VnZ2VzdGlvbkZvcldvcmQpIHtcbiAgICAgICAgY29uc3QgZ2V0U3VnZ2VzdGlvbkZvcldvcmQgPSBwcm92aWRlci5nZXRTdWdnZXN0aW9uRm9yV29yZC5iaW5kKHByb3ZpZGVyKTtcbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICBjb25zdCB3b3JkUmVnRXhwID0gcHJvdmlkZXIud29yZFJlZ0V4cCB8fCBkZWZhdWx0V29yZFJlZ0V4cDtcbiAgICAgICAgICBjb25zdCB7dGV4dCwgcmFuZ2V9ID0gZ2V0V29yZFRleHRBbmRSYW5nZSh0ZXh0RWRpdG9yLCBwb3NpdGlvbiwgd29yZFJlZ0V4cCk7XG4gICAgICAgICAgcmV0dXJuIGdldFN1Z2dlc3Rpb25Gb3JXb3JkKHRleHRFZGl0b3IsIHRleHQsIHJhbmdlKTtcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdIeXBlcmNsaWNrIG11c3QgaGF2ZSBlaXRoZXIgYGdldFN1Z2dlc3Rpb25gIG9yIGBnZXRTdWdnZXN0aW9uRm9yV29yZGAnKTtcbiAgICB9KSk7XG4gIH1cblxuICBzaG93U3VnZ2VzdGlvbkxpc3QodGV4dEVkaXRvcjogVGV4dEVkaXRvciwgc3VnZ2VzdGlvbjogSHlwZXJjbGlja1N1Z2dlc3Rpb24pOiB2b2lkIHtcbiAgICB0aGlzLl9zdWdnZXN0aW9uTGlzdC5zaG93KHRleHRFZGl0b3IsIHN1Z2dlc3Rpb24pO1xuICB9XG59XG5cbi8qKiBSZXR1cm5zIHRoZSBwcm92aWRlciBuYW1lIG9yIGEgZGVmYXVsdCB2YWx1ZSAqL1xuZnVuY3Rpb24gZ2V0UHJvdmlkZXJOYW1lKHByb3ZpZGVyOiBIeXBlcmNsaWNrUHJvdmlkZXIpOiBzdHJpbmcge1xuICBpZiAocHJvdmlkZXIucHJvdmlkZXJOYW1lICE9IG51bGwpIHtcbiAgICByZXR1cm4gcHJvdmlkZXIucHJvdmlkZXJOYW1lO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAndW5uYW1lZC1oeXBlcmNsaWNrLXByb3ZpZGVyJztcbiAgfVxufVxuIl19