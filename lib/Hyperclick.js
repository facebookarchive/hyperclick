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
  for (var fn of fns) {
    // eslint-disable-next-line babel/no-await-in-loop
    var result = typeof fn === 'function' ? (yield fn()) : null;
    if (result) {
      return result;
    }
  }
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

var _hyperclickUtils = require('./hyperclick-utils');

'use babel';

var Hyperclick = (function () {
  function Hyperclick() {
    var _this = this;

    _classCallCheck(this, Hyperclick);

    this._consumedProviders = [];
    this._suggestionList = new _SuggestionList2['default']();
    this._hyperclickForTextEditors = new Set();
    this._textEditorSubscription = atom.workspace.observeTextEditors(function (item) {
      if (!atom.workspace.isTextEditor(item)) {
        return;
      }
      // When restoring Atom state on load, Atom mangles our remote URIs by
      // removing one of the '/'s. These TextBuffers/TextEditors live for a
      // short time and are destroyed during Nuclide startup.
      var uri = item.getPath();
      var isBrokenDeserializedUri = uri != null && uri.match(/nuclide:[\\/][^/]/) != null;
      if (isBrokenDeserializedUri) {
        return;
      }
      return _this.observeTextEditor(item);
    });
  }

  /** Returns the provider name or a default value */

  _createClass(Hyperclick, [{
    key: 'observeTextEditor',
    value: function observeTextEditor(textEditor) {
      var _this2 = this;

      var hyperclickForTextEditor = new _HyperclickForTextEditor2['default'](textEditor, this);
      this._hyperclickForTextEditors.add(hyperclickForTextEditor);
      textEditor.onDidDestroy(function () {
        hyperclickForTextEditor.dispose();
        _this2._hyperclickForTextEditors['delete'](hyperclickForTextEditor);
      });
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this._suggestionList.hide();
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
      var _this3 = this;

      this._applyToAll(provider, function (singleProvider) {
        return _this3._consumeSingleProvider(singleProvider);
      });
    }
  }, {
    key: 'removeProvider',
    value: function removeProvider(provider) {
      var _this4 = this;

      this._applyToAll(provider, function (singleProvider) {
        return _this4._removeSingleProvider(singleProvider);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hc3VhcmV6L3NyYy9naXRodWIvaHlwZXJjbGljay9saWIvSHlwZXJjbGljay5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7SUEwQmUscUJBQXFCLHFCQUFwQyxXQUFxQyxHQUFxQyxFQUFnQjtBQUN4RixPQUFLLElBQU0sRUFBRSxJQUFJLEdBQUcsRUFBRTs7QUFFcEIsUUFBTSxNQUFNLEdBQUcsT0FBTyxFQUFFLEtBQUssVUFBVSxJQUFHLE1BQU0sRUFBRSxFQUFFLENBQUEsR0FBRyxJQUFJLENBQUM7QUFDNUQsUUFBSSxNQUFNLEVBQUU7QUFDVixhQUFPLE1BQU0sQ0FBQztLQUNmO0dBQ0Y7Q0FDRjs7Ozs7Ozs7Ozs7Ozs7dUNBbEJtQywyQkFBMkI7Ozs7OEJBQ3BDLGtCQUFrQjs7OzsrQkFJdEMsb0JBQW9COztBQXJCM0IsV0FBVyxDQUFDOztJQXdDUyxVQUFVO0FBTWxCLFdBTlEsVUFBVSxHQU1mOzs7MEJBTkssVUFBVTs7QUFPM0IsUUFBSSxDQUFDLGtCQUFrQixHQUFHLEVBQUUsQ0FBQztBQUM3QixRQUFJLENBQUMsZUFBZSxHQUFHLGlDQUFvQixDQUFDO0FBQzVDLFFBQUksQ0FBQyx5QkFBeUIsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO0FBQzNDLFFBQUksQ0FBQyx1QkFBdUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGtCQUFrQixDQUFDLFVBQUEsSUFBSSxFQUFJO0FBQ3ZFLFVBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUN0QyxlQUFPO09BQ1I7Ozs7QUFJRCxVQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDM0IsVUFBTSx1QkFBdUIsR0FDM0IsR0FBRyxJQUFJLElBQUksSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLG1CQUFtQixDQUFDLElBQUksSUFBSSxDQUFDO0FBQ3hELFVBQUksdUJBQXVCLEVBQUU7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ZUFBZSxDQUFDLFFBQTRCLEVBQVU7QUFDN0QsTUFBSSxRQUFRLENBQUMsWUFBWSxJQUFJLElBQUksRUFBRTtBQUNqQyxXQUFPLFFBQVEsQ0FBQyxZQUFZLENBQUM7R0FDOUIsTUFBTTtBQUNMLFdBQU8sNkJBQTZCLENBQUM7R0FDdEM7Q0FDRiIsImZpbGUiOiIvVXNlcnMvYXN1YXJlei9zcmMvZ2l0aHViL2h5cGVyY2xpY2svbGliL0h5cGVyY2xpY2suanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG5pbXBvcnQgdHlwZSB7XG4gIEh5cGVyY2xpY2tTdWdnZXN0aW9uLFxuICBIeXBlcmNsaWNrUHJvdmlkZXIsXG59IGZyb20gJy4vdHlwZXMnO1xuXG5pbXBvcnQgSHlwZXJjbGlja0ZvclRleHRFZGl0b3IgZnJvbSAnLi9IeXBlcmNsaWNrRm9yVGV4dEVkaXRvcic7XG5pbXBvcnQgU3VnZ2VzdGlvbkxpc3QgZnJvbSAnLi9TdWdnZXN0aW9uTGlzdCc7XG5pbXBvcnQge1xuICBkZWZhdWx0V29yZFJlZ0V4cEZvckVkaXRvcixcbiAgZ2V0V29yZFRleHRBbmRSYW5nZSxcbn0gZnJvbSAnLi9oeXBlcmNsaWNrLXV0aWxzJztcblxuLyoqXG4gKiBDYWxscyB0aGUgZ2l2ZW4gZnVuY3Rpb25zIGFuZCByZXR1cm5zIHRoZSBmaXJzdCBub24tbnVsbCByZXR1cm4gdmFsdWUuXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGZpbmRUcnV0aHlSZXR1cm5WYWx1ZShmbnM6IEFycmF5PHZvaWQgfCAoKSA9PiBQcm9taXNlPGFueT4+KTogUHJvbWlzZTxhbnk+IHtcbiAgZm9yIChjb25zdCBmbiBvZiBmbnMpIHtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgYmFiZWwvbm8tYXdhaXQtaW4tbG9vcFxuICAgIGNvbnN0IHJlc3VsdCA9IHR5cGVvZiBmbiA9PT0gJ2Z1bmN0aW9uJyA/IGF3YWl0IGZuKCkgOiBudWxsO1xuICAgIGlmIChyZXN1bHQpIHtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQ29uc3RydWN0IHRoaXMgb2JqZWN0IHRvIGVuYWJsZSBIeXBlcmNsaWNrIGluIHRoZSBBdG9tIHdvcmtzcGFjZS5cbiAqIENhbGwgYGRpc3Bvc2VgIHRvIGRpc2FibGUgdGhlIGZlYXR1cmUuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEh5cGVyY2xpY2sge1xuICBfY29uc3VtZWRQcm92aWRlcnM6IEFycmF5PEh5cGVyY2xpY2tQcm92aWRlcj47XG4gIF9zdWdnZXN0aW9uTGlzdDogU3VnZ2VzdGlvbkxpc3Q7XG4gIF9oeXBlcmNsaWNrRm9yVGV4dEVkaXRvcnM6IFNldDxIeXBlcmNsaWNrRm9yVGV4dEVkaXRvcj47XG4gIF90ZXh0RWRpdG9yU3Vic2NyaXB0aW9uOiBJRGlzcG9zYWJsZTtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9jb25zdW1lZFByb3ZpZGVycyA9IFtdO1xuICAgIHRoaXMuX3N1Z2dlc3Rpb25MaXN0ID0gbmV3IFN1Z2dlc3Rpb25MaXN0KCk7XG4gICAgdGhpcy5faHlwZXJjbGlja0ZvclRleHRFZGl0b3JzID0gbmV3IFNldCgpO1xuICAgIHRoaXMuX3RleHRFZGl0b3JTdWJzY3JpcHRpb24gPSBhdG9tLndvcmtzcGFjZS5vYnNlcnZlVGV4dEVkaXRvcnMoaXRlbSA9PiB7XG4gICAgICBpZiAoIWF0b20ud29ya3NwYWNlLmlzVGV4dEVkaXRvcihpdGVtKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICAvLyBXaGVuIHJlc3RvcmluZyBBdG9tIHN0YXRlIG9uIGxvYWQsIEF0b20gbWFuZ2xlcyBvdXIgcmVtb3RlIFVSSXMgYnlcbiAgICAgIC8vIHJlbW92aW5nIG9uZSBvZiB0aGUgJy8ncy4gVGhlc2UgVGV4dEJ1ZmZlcnMvVGV4dEVkaXRvcnMgbGl2ZSBmb3IgYVxuICAgICAgLy8gc2hvcnQgdGltZSBhbmQgYXJlIGRlc3Ryb3llZCBkdXJpbmcgTnVjbGlkZSBzdGFydHVwLlxuICAgICAgY29uc3QgdXJpID0gaXRlbS5nZXRQYXRoKCk7XG4gICAgICBjb25zdCBpc0Jyb2tlbkRlc2VyaWFsaXplZFVyaSA9XG4gICAgICAgIHVyaSAhPSBudWxsICYmIHVyaS5tYXRjaCgvbnVjbGlkZTpbXFxcXC9dW14vXS8pICE9IG51bGw7XG4gICAgICBpZiAoaXNCcm9rZW5EZXNlcmlhbGl6ZWRVcmkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMub2JzZXJ2ZVRleHRFZGl0b3IoaXRlbSk7XG4gICAgfSk7XG4gIH1cblxuICBvYnNlcnZlVGV4dEVkaXRvcih0ZXh0RWRpdG9yOiBUZXh0RWRpdG9yKSB7XG4gICAgY29uc3QgaHlwZXJjbGlja0ZvclRleHRFZGl0b3IgPSBuZXcgSHlwZXJjbGlja0ZvclRleHRFZGl0b3IodGV4dEVkaXRvciwgdGhpcyk7XG4gICAgdGhpcy5faHlwZXJjbGlja0ZvclRleHRFZGl0b3JzLmFkZChoeXBlcmNsaWNrRm9yVGV4dEVkaXRvcik7XG4gICAgdGV4dEVkaXRvci5vbkRpZERlc3Ryb3koKCkgPT4ge1xuICAgICAgaHlwZXJjbGlja0ZvclRleHRFZGl0b3IuZGlzcG9zZSgpO1xuICAgICAgdGhpcy5faHlwZXJjbGlja0ZvclRleHRFZGl0b3JzLmRlbGV0ZShoeXBlcmNsaWNrRm9yVGV4dEVkaXRvcik7XG4gICAgfSk7XG4gIH1cblxuICBkaXNwb3NlKCkge1xuICAgIHRoaXMuX3N1Z2dlc3Rpb25MaXN0LmhpZGUoKTtcbiAgICBpZiAodGhpcy5fdGV4dEVkaXRvclN1YnNjcmlwdGlvbikge1xuICAgICAgdGhpcy5fdGV4dEVkaXRvclN1YnNjcmlwdGlvbi5kaXNwb3NlKCk7XG4gICAgfVxuICAgIHRoaXMuX2h5cGVyY2xpY2tGb3JUZXh0RWRpdG9ycy5mb3JFYWNoKGh5cGVyY2xpY2sgPT4gaHlwZXJjbGljay5kaXNwb3NlKCkpO1xuICAgIHRoaXMuX2h5cGVyY2xpY2tGb3JUZXh0RWRpdG9ycy5jbGVhcigpO1xuICB9XG5cbiAgX2FwcGx5VG9BbGw8VD4oaXRlbTogQXJyYXk8VD4gfCBULCBmOiAoeDogVCkgPT4gdm9pZCk6IHZvaWQge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGl0ZW0pKSB7XG4gICAgICBpdGVtLmZvckVhY2goeCA9PiBmKHgpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZihpdGVtKTtcbiAgICB9XG4gIH1cblxuICBjb25zdW1lUHJvdmlkZXIocHJvdmlkZXI6IEh5cGVyY2xpY2tQcm92aWRlciB8IEFycmF5PEh5cGVyY2xpY2tQcm92aWRlcj4pOiB2b2lkIHtcbiAgICB0aGlzLl9hcHBseVRvQWxsKHByb3ZpZGVyLCBzaW5nbGVQcm92aWRlciA9PiB0aGlzLl9jb25zdW1lU2luZ2xlUHJvdmlkZXIoc2luZ2xlUHJvdmlkZXIpKTtcbiAgfVxuXG4gIHJlbW92ZVByb3ZpZGVyKHByb3ZpZGVyOiBIeXBlcmNsaWNrUHJvdmlkZXIgfCBBcnJheTxIeXBlcmNsaWNrUHJvdmlkZXI+KTogdm9pZCB7XG4gICAgdGhpcy5fYXBwbHlUb0FsbChwcm92aWRlciwgc2luZ2xlUHJvdmlkZXIgPT4gdGhpcy5fcmVtb3ZlU2luZ2xlUHJvdmlkZXIoc2luZ2xlUHJvdmlkZXIpKTtcbiAgfVxuXG4gIF9jb25zdW1lU2luZ2xlUHJvdmlkZXIocHJvdmlkZXI6IEh5cGVyY2xpY2tQcm92aWRlcik6IHZvaWQge1xuICAgIGNvbnN0IHByaW9yaXR5ID0gcHJvdmlkZXIucHJpb3JpdHkgfHwgMDtcbiAgICBmb3IgKGxldCBpID0gMCwgbGVuID0gdGhpcy5fY29uc3VtZWRQcm92aWRlcnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLl9jb25zdW1lZFByb3ZpZGVyc1tpXTtcbiAgICAgIGlmIChwcm92aWRlciA9PT0gaXRlbSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGl0ZW1Qcmlvcml0eSA9IGl0ZW0ucHJpb3JpdHkgfHwgMDtcbiAgICAgIGlmIChwcmlvcml0eSA+IGl0ZW1Qcmlvcml0eSkge1xuICAgICAgICB0aGlzLl9jb25zdW1lZFByb3ZpZGVycy5zcGxpY2UoaSwgMCwgcHJvdmlkZXIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gSWYgd2UgbWFkZSBpdCBhbGwgdGhlIHdheSB0aHJvdWdoIHRoZSBsb29wLCBwcm92aWRlciBtdXN0IGJlIGxvd2VyXG4gICAgLy8gcHJpb3JpdHkgdGhhbiBhbGwgb2YgdGhlIGV4aXN0aW5nIHByb3ZpZGVycywgc28gYWRkIGl0IHRvIHRoZSBlbmQuXG4gICAgdGhpcy5fY29uc3VtZWRQcm92aWRlcnMucHVzaChwcm92aWRlcik7XG4gIH1cblxuICBfcmVtb3ZlU2luZ2xlUHJvdmlkZXIocHJvdmlkZXI6IEh5cGVyY2xpY2tQcm92aWRlcik6IHZvaWQge1xuICAgIGNvbnN0IGluZGV4ID0gdGhpcy5fY29uc3VtZWRQcm92aWRlcnMuaW5kZXhPZihwcm92aWRlcik7XG4gICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgIHRoaXMuX2NvbnN1bWVkUHJvdmlkZXJzLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGZpcnN0IHN1Z2dlc3Rpb24gZnJvbSB0aGUgY29uc3VtZWQgcHJvdmlkZXJzLlxuICAgKi9cbiAgZ2V0U3VnZ2VzdGlvbih0ZXh0RWRpdG9yOiBUZXh0RWRpdG9yLCBwb3NpdGlvbjogYXRvbSRQb2ludCk6IFByb21pc2U8YW55PiB7XG4gICAgLy8gR2V0IHRoZSBkZWZhdWx0IHdvcmQgUmVnRXhwIGZvciB0aGlzIGVkaXRvci5cbiAgICBjb25zdCBkZWZhdWx0V29yZFJlZ0V4cCA9IGRlZmF1bHRXb3JkUmVnRXhwRm9yRWRpdG9yKHRleHRFZGl0b3IpO1xuXG4gICAgcmV0dXJuIGZpbmRUcnV0aHlSZXR1cm5WYWx1ZSh0aGlzLl9jb25zdW1lZFByb3ZpZGVycy5tYXAoKHByb3ZpZGVyOiBIeXBlcmNsaWNrUHJvdmlkZXIpID0+IHtcbiAgICAgIGlmIChwcm92aWRlci5nZXRTdWdnZXN0aW9uKSB7XG4gICAgICAgIGNvbnN0IGdldFN1Z2dlc3Rpb24gPSBwcm92aWRlci5nZXRTdWdnZXN0aW9uLmJpbmQocHJvdmlkZXIpO1xuICAgICAgICByZXR1cm4gKCkgPT4gZ2V0U3VnZ2VzdGlvbih0ZXh0RWRpdG9yLCBwb3NpdGlvbik7XG4gICAgICB9IGVsc2UgaWYgKHByb3ZpZGVyLmdldFN1Z2dlc3Rpb25Gb3JXb3JkKSB7XG4gICAgICAgIGNvbnN0IGdldFN1Z2dlc3Rpb25Gb3JXb3JkID0gcHJvdmlkZXIuZ2V0U3VnZ2VzdGlvbkZvcldvcmQuYmluZChwcm92aWRlcik7XG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgY29uc3Qgd29yZFJlZ0V4cCA9IHByb3ZpZGVyLndvcmRSZWdFeHAgfHwgZGVmYXVsdFdvcmRSZWdFeHA7XG4gICAgICAgICAgY29uc3Qge3RleHQsIHJhbmdlfSA9IGdldFdvcmRUZXh0QW5kUmFuZ2UodGV4dEVkaXRvciwgcG9zaXRpb24sIHdvcmRSZWdFeHApO1xuICAgICAgICAgIHJldHVybiBnZXRTdWdnZXN0aW9uRm9yV29yZCh0ZXh0RWRpdG9yLCB0ZXh0LCByYW5nZSk7XG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIHRocm93IG5ldyBFcnJvcignSHlwZXJjbGljayBtdXN0IGhhdmUgZWl0aGVyIGBnZXRTdWdnZXN0aW9uYCBvciBgZ2V0U3VnZ2VzdGlvbkZvcldvcmRgJyk7XG4gICAgfSkpO1xuICB9XG5cbiAgc2hvd1N1Z2dlc3Rpb25MaXN0KHRleHRFZGl0b3I6IFRleHRFZGl0b3IsIHN1Z2dlc3Rpb246IEh5cGVyY2xpY2tTdWdnZXN0aW9uKTogdm9pZCB7XG4gICAgdGhpcy5fc3VnZ2VzdGlvbkxpc3Quc2hvdyh0ZXh0RWRpdG9yLCBzdWdnZXN0aW9uKTtcbiAgfVxufVxuXG4vKiogUmV0dXJucyB0aGUgcHJvdmlkZXIgbmFtZSBvciBhIGRlZmF1bHQgdmFsdWUgKi9cbmZ1bmN0aW9uIGdldFByb3ZpZGVyTmFtZShwcm92aWRlcjogSHlwZXJjbGlja1Byb3ZpZGVyKTogc3RyaW5nIHtcbiAgaWYgKHByb3ZpZGVyLnByb3ZpZGVyTmFtZSAhPSBudWxsKSB7XG4gICAgcmV0dXJuIHByb3ZpZGVyLnByb3ZpZGVyTmFtZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gJ3VubmFtZWQtaHlwZXJjbGljay1wcm92aWRlcic7XG4gIH1cbn1cbiJdfQ==