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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hc3VhcmV6L0Rlc2t0b3AvaHlwZXJjbGljay9saWIvSHlwZXJjbGljay5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7SUEyQmUscUJBQXFCLHFCQUFwQyxXQUFxQyxHQUFxQyxFQUFnQjs7QUFFeEYsT0FBSyxJQUFNLEVBQUUsSUFBSSxHQUFHLEVBQUU7QUFDcEIsUUFBTSxNQUFNLEdBQUcsT0FBTyxFQUFFLEtBQUssVUFBVSxJQUFHLE1BQU0sRUFBRSxFQUFFLENBQUEsR0FBRyxJQUFJLENBQUM7QUFDNUQsUUFBSSxNQUFNLEVBQUU7QUFDVixhQUFPLE1BQU0sQ0FBQztLQUNmO0dBQ0Y7O0NBRUY7Ozs7Ozs7Ozs7Ozs7O3VDQXBCbUMsMkJBQTJCOzs7OzhCQUNwQyxrQkFBa0I7Ozs7cUNBQ1gseUJBQXlCOzs7OytCQUlwRCxvQkFBb0I7O0FBdEIzQixXQUFXLENBQUM7O0lBMENTLFVBQVU7QUFPbEIsV0FQUSxVQUFVLEdBT2Y7MEJBUEssVUFBVTs7QUFRM0IsUUFBSSxDQUFDLGtCQUFrQixHQUFHLEVBQUUsQ0FBQzs7QUFFN0IsUUFBSSxDQUFDLGVBQWUsR0FBRyxpQ0FBb0IsQ0FBQztBQUM1QyxRQUFJLENBQUMsK0JBQStCLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxlQUFlLDhCQUU3RCxVQUFBLEtBQUs7YUFBSSx3Q0FBMkIsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDO0tBQUEsQ0FBQyxDQUFDOztBQUU1RCxRQUFJLENBQUMseUJBQXlCLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztBQUMzQyxRQUFJLENBQUMsdUJBQXVCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxrQkFBa0IsQ0FDOUQsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0dBQ3RDOzs7O2VBbEJrQixVQUFVOztXQW9CWiwyQkFBQyxVQUFzQixFQUFFOzs7QUFDeEMsVUFBTSx1QkFBdUIs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TUFBTTtBQUNMLFdBQU8sNkJBQTZCLENBQUM7R0FDdEM7Q0FDRiIsImZpbGUiOiIvVXNlcnMvYXN1YXJlei9EZXNrdG9wL2h5cGVyY2xpY2svbGliL0h5cGVyY2xpY2suanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG5pbXBvcnQgdHlwZSB7XG4gIEh5cGVyY2xpY2tTdWdnZXN0aW9uLFxuICBIeXBlcmNsaWNrUHJvdmlkZXIsXG59IGZyb20gJy4vdHlwZXMnO1xuXG5pbXBvcnQgSHlwZXJjbGlja0ZvclRleHRFZGl0b3IgZnJvbSAnLi9IeXBlcmNsaWNrRm9yVGV4dEVkaXRvcic7XG5pbXBvcnQgU3VnZ2VzdGlvbkxpc3QgZnJvbSAnLi9TdWdnZXN0aW9uTGlzdCc7XG5pbXBvcnQgU3VnZ2VzdGlvbkxpc3RFbGVtZW50IGZyb20gJy4vU3VnZ2VzdGlvbkxpc3RFbGVtZW50JztcbmltcG9ydCB7XG4gIGRlZmF1bHRXb3JkUmVnRXhwRm9yRWRpdG9yLFxuICBnZXRXb3JkVGV4dEFuZFJhbmdlLFxufSBmcm9tICcuL2h5cGVyY2xpY2stdXRpbHMnO1xuXG4vKipcbiAqIENhbGxzIHRoZSBnaXZlbiBmdW5jdGlvbnMgYW5kIHJldHVybnMgdGhlIGZpcnN0IG5vbi1udWxsIHJldHVybiB2YWx1ZS5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gZmluZFRydXRoeVJldHVyblZhbHVlKGZuczogQXJyYXk8dm9pZCB8ICgpID0+IFByb21pc2U8YW55Pj4pOiBQcm9taXNlPGFueT4ge1xuICAvKiBlc2xpbnQtZGlzYWJsZSBiYWJlbC9uby1hd2FpdC1pbi1sb29wICovXG4gIGZvciAoY29uc3QgZm4gb2YgZm5zKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gdHlwZW9mIGZuID09PSAnZnVuY3Rpb24nID8gYXdhaXQgZm4oKSA6IG51bGw7XG4gICAgaWYgKHJlc3VsdCkge1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gIH1cbiAgLyogZXNsaW50LWVuYWJsZSBiYWJlbC9uby1hd2FpdC1pbi1sb29wICovXG59XG5cbi8qKlxuICogQ29uc3RydWN0IHRoaXMgb2JqZWN0IHRvIGVuYWJsZSBIeXBlcmNsaWNrIGluIHRoZSBBdG9tIHdvcmtzcGFjZS5cbiAqIENhbGwgYGRpc3Bvc2VgIHRvIGRpc2FibGUgdGhlIGZlYXR1cmUuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEh5cGVyY2xpY2sge1xuICBfY29uc3VtZWRQcm92aWRlcnM6IEFycmF5PEh5cGVyY2xpY2tQcm92aWRlcj47XG4gIF9zdWdnZXN0aW9uTGlzdDogU3VnZ2VzdGlvbkxpc3Q7XG4gIF9zdWdnZXN0aW9uTGlzdFZpZXdTdWJzY3JpcHRpb246IElEaXNwb3NhYmxlO1xuICBfaHlwZXJjbGlja0ZvclRleHRFZGl0b3JzOiBTZXQ8SHlwZXJjbGlja0ZvclRleHRFZGl0b3I+O1xuICBfdGV4dEVkaXRvclN1YnNjcmlwdGlvbjogSURpc3Bvc2FibGU7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5fY29uc3VtZWRQcm92aWRlcnMgPSBbXTtcblxuICAgIHRoaXMuX3N1Z2dlc3Rpb25MaXN0ID0gbmV3IFN1Z2dlc3Rpb25MaXN0KCk7XG4gICAgdGhpcy5fc3VnZ2VzdGlvbkxpc3RWaWV3U3Vic2NyaXB0aW9uID0gYXRvbS52aWV3cy5hZGRWaWV3UHJvdmlkZXIoXG4gICAgICAgIFN1Z2dlc3Rpb25MaXN0LFxuICAgICAgICBtb2RlbCA9PiBuZXcgU3VnZ2VzdGlvbkxpc3RFbGVtZW50KCkuaW5pdGlhbGl6ZShtb2RlbCkpO1xuXG4gICAgdGhpcy5faHlwZXJjbGlja0ZvclRleHRFZGl0b3JzID0gbmV3IFNldCgpO1xuICAgIHRoaXMuX3RleHRFZGl0b3JTdWJzY3JpcHRpb24gPSBhdG9tLndvcmtzcGFjZS5vYnNlcnZlVGV4dEVkaXRvcnMoXG4gICAgICB0aGlzLm9ic2VydmVUZXh0RWRpdG9yLmJpbmQodGhpcykpO1xuICB9XG5cbiAgb2JzZXJ2ZVRleHRFZGl0b3IodGV4dEVkaXRvcjogVGV4dEVkaXRvcikge1xuICAgIGNvbnN0IGh5cGVyY2xpY2tGb3JUZXh0RWRpdG9yID0gbmV3IEh5cGVyY2xpY2tGb3JUZXh0RWRpdG9yKHRleHRFZGl0b3IsIHRoaXMpO1xuICAgIHRoaXMuX2h5cGVyY2xpY2tGb3JUZXh0RWRpdG9ycy5hZGQoaHlwZXJjbGlja0ZvclRleHRFZGl0b3IpO1xuICAgIHRleHRFZGl0b3Iub25EaWREZXN0cm95KCgpID0+IHtcbiAgICAgIGh5cGVyY2xpY2tGb3JUZXh0RWRpdG9yLmRpc3Bvc2UoKTtcbiAgICAgIHRoaXMuX2h5cGVyY2xpY2tGb3JUZXh0RWRpdG9ycy5kZWxldGUoaHlwZXJjbGlja0ZvclRleHRFZGl0b3IpO1xuICAgIH0pO1xuICB9XG5cbiAgZGlzcG9zZSgpIHtcbiAgICBpZiAodGhpcy5fc3VnZ2VzdGlvbkxpc3RWaWV3U3Vic2NyaXB0aW9uKSB7XG4gICAgICB0aGlzLl9zdWdnZXN0aW9uTGlzdFZpZXdTdWJzY3JpcHRpb24uZGlzcG9zZSgpO1xuICAgIH1cbiAgICBpZiAodGhpcy5fdGV4dEVkaXRvclN1YnNjcmlwdGlvbikge1xuICAgICAgdGhpcy5fdGV4dEVkaXRvclN1YnNjcmlwdGlvbi5kaXNwb3NlKCk7XG4gICAgfVxuICAgIHRoaXMuX2h5cGVyY2xpY2tGb3JUZXh0RWRpdG9ycy5mb3JFYWNoKGh5cGVyY2xpY2sgPT4gaHlwZXJjbGljay5kaXNwb3NlKCkpO1xuICAgIHRoaXMuX2h5cGVyY2xpY2tGb3JUZXh0RWRpdG9ycy5jbGVhcigpO1xuICB9XG5cbiAgX2FwcGx5VG9BbGw8VD4oaXRlbTogQXJyYXk8VD4gfCBULCBmOiAoeDogVCkgPT4gdm9pZCk6IHZvaWQge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGl0ZW0pKSB7XG4gICAgICBpdGVtLmZvckVhY2goeCA9PiBmKHgpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZihpdGVtKTtcbiAgICB9XG4gIH1cblxuICBjb25zdW1lUHJvdmlkZXIocHJvdmlkZXI6IEh5cGVyY2xpY2tQcm92aWRlciB8IEFycmF5PEh5cGVyY2xpY2tQcm92aWRlcj4pOiB2b2lkIHtcbiAgICB0aGlzLl9hcHBseVRvQWxsKHByb3ZpZGVyLCBzaW5nbGVQcm92aWRlciA9PiB0aGlzLl9jb25zdW1lU2luZ2xlUHJvdmlkZXIoc2luZ2xlUHJvdmlkZXIpKTtcbiAgfVxuXG4gIHJlbW92ZVByb3ZpZGVyKHByb3ZpZGVyOiBIeXBlcmNsaWNrUHJvdmlkZXIgfCBBcnJheTxIeXBlcmNsaWNrUHJvdmlkZXI+KTogdm9pZCB7XG4gICAgdGhpcy5fYXBwbHlUb0FsbChwcm92aWRlciwgc2luZ2xlUHJvdmlkZXIgPT4gdGhpcy5fcmVtb3ZlU2luZ2xlUHJvdmlkZXIoc2luZ2xlUHJvdmlkZXIpKTtcbiAgfVxuXG4gIF9jb25zdW1lU2luZ2xlUHJvdmlkZXIocHJvdmlkZXI6IEh5cGVyY2xpY2tQcm92aWRlcik6IHZvaWQge1xuICAgIGNvbnN0IHByaW9yaXR5ID0gcHJvdmlkZXIucHJpb3JpdHkgfHwgMDtcbiAgICBmb3IgKGxldCBpID0gMCwgbGVuID0gdGhpcy5fY29uc3VtZWRQcm92aWRlcnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLl9jb25zdW1lZFByb3ZpZGVyc1tpXTtcbiAgICAgIGlmIChwcm92aWRlciA9PT0gaXRlbSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGl0ZW1Qcmlvcml0eSA9IGl0ZW0ucHJpb3JpdHkgfHwgMDtcbiAgICAgIGlmIChwcmlvcml0eSA+IGl0ZW1Qcmlvcml0eSkge1xuICAgICAgICB0aGlzLl9jb25zdW1lZFByb3ZpZGVycy5zcGxpY2UoaSwgMCwgcHJvdmlkZXIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gSWYgd2UgbWFkZSBpdCBhbGwgdGhlIHdheSB0aHJvdWdoIHRoZSBsb29wLCBwcm92aWRlciBtdXN0IGJlIGxvd2VyXG4gICAgLy8gcHJpb3JpdHkgdGhhbiBhbGwgb2YgdGhlIGV4aXN0aW5nIHByb3ZpZGVycywgc28gYWRkIGl0IHRvIHRoZSBlbmQuXG4gICAgdGhpcy5fY29uc3VtZWRQcm92aWRlcnMucHVzaChwcm92aWRlcik7XG4gIH1cblxuICBfcmVtb3ZlU2luZ2xlUHJvdmlkZXIocHJvdmlkZXI6IEh5cGVyY2xpY2tQcm92aWRlcik6IHZvaWQge1xuICAgIGNvbnN0IGluZGV4ID0gdGhpcy5fY29uc3VtZWRQcm92aWRlcnMuaW5kZXhPZihwcm92aWRlcik7XG4gICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgIHRoaXMuX2NvbnN1bWVkUHJvdmlkZXJzLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGZpcnN0IHN1Z2dlc3Rpb24gZnJvbSB0aGUgY29uc3VtZWQgcHJvdmlkZXJzLlxuICAgKi9cbiAgZ2V0U3VnZ2VzdGlvbih0ZXh0RWRpdG9yOiBUZXh0RWRpdG9yLCBwb3NpdGlvbjogYXRvbSRQb2ludCk6IFByb21pc2Uge1xuICAgIC8vIEdldCB0aGUgZGVmYXVsdCB3b3JkIFJlZ0V4cCBmb3IgdGhpcyBlZGl0b3IuXG4gICAgY29uc3QgZGVmYXVsdFdvcmRSZWdFeHAgPSBkZWZhdWx0V29yZFJlZ0V4cEZvckVkaXRvcih0ZXh0RWRpdG9yKTtcblxuICAgIHJldHVybiBmaW5kVHJ1dGh5UmV0dXJuVmFsdWUodGhpcy5fY29uc3VtZWRQcm92aWRlcnMubWFwKChwcm92aWRlcjogSHlwZXJjbGlja1Byb3ZpZGVyKSA9PiB7XG4gICAgICBpZiAocHJvdmlkZXIuZ2V0U3VnZ2VzdGlvbikge1xuICAgICAgICBjb25zdCBnZXRTdWdnZXN0aW9uID0gcHJvdmlkZXIuZ2V0U3VnZ2VzdGlvbi5iaW5kKHByb3ZpZGVyKTtcbiAgICAgICAgcmV0dXJuICgpID0+IGdldFN1Z2dlc3Rpb24odGV4dEVkaXRvciwgcG9zaXRpb24pO1xuICAgICAgfSBlbHNlIGlmIChwcm92aWRlci5nZXRTdWdnZXN0aW9uRm9yV29yZCkge1xuICAgICAgICBjb25zdCBnZXRTdWdnZXN0aW9uRm9yV29yZCA9IHByb3ZpZGVyLmdldFN1Z2dlc3Rpb25Gb3JXb3JkLmJpbmQocHJvdmlkZXIpO1xuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgIGNvbnN0IHdvcmRSZWdFeHAgPSBwcm92aWRlci53b3JkUmVnRXhwIHx8IGRlZmF1bHRXb3JkUmVnRXhwO1xuICAgICAgICAgIGNvbnN0IHt0ZXh0LCByYW5nZX0gPSBnZXRXb3JkVGV4dEFuZFJhbmdlKHRleHRFZGl0b3IsIHBvc2l0aW9uLCB3b3JkUmVnRXhwKTtcbiAgICAgICAgICByZXR1cm4gZ2V0U3VnZ2VzdGlvbkZvcldvcmQodGV4dEVkaXRvciwgdGV4dCwgcmFuZ2UpO1xuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0h5cGVyY2xpY2sgbXVzdCBoYXZlIGVpdGhlciBgZ2V0U3VnZ2VzdGlvbmAgb3IgYGdldFN1Z2dlc3Rpb25Gb3JXb3JkYCcpO1xuICAgIH0pKTtcbiAgfVxuXG4gIHNob3dTdWdnZXN0aW9uTGlzdCh0ZXh0RWRpdG9yOiBUZXh0RWRpdG9yLCBzdWdnZXN0aW9uOiBIeXBlcmNsaWNrU3VnZ2VzdGlvbik6IHZvaWQge1xuICAgIHRoaXMuX3N1Z2dlc3Rpb25MaXN0LnNob3codGV4dEVkaXRvciwgc3VnZ2VzdGlvbik7XG4gIH1cbn1cblxuLyoqIFJldHVybnMgdGhlIHByb3ZpZGVyIG5hbWUgb3IgYSBkZWZhdWx0IHZhbHVlICovXG5mdW5jdGlvbiBnZXRQcm92aWRlck5hbWUocHJvdmlkZXI6IEh5cGVyY2xpY2tQcm92aWRlcik6IHN0cmluZyB7XG4gIGlmIChwcm92aWRlci5wcm92aWRlck5hbWUgIT0gbnVsbCkge1xuICAgIHJldHVybiBwcm92aWRlci5wcm92aWRlck5hbWU7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuICd1bm5hbWVkLWh5cGVyY2xpY2stcHJvdmlkZXInO1xuICB9XG59XG4iXX0=