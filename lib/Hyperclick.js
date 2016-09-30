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
      this._suggestionList.hide();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hc3VhcmV6L0Rvd25sb2Fkcy9oeXBlcmNsaWNrL2xpYi9IeXBlcmNsaWNrLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQTJCZSxxQkFBcUIscUJBQXBDLFdBQXFDLEdBQXFDLEVBQWdCO0FBQ3hGLE9BQUssSUFBTSxFQUFFLElBQUksR0FBRyxFQUFFOztBQUVwQixRQUFNLE1BQU0sR0FBRyxPQUFPLEVBQUUsS0FBSyxVQUFVLElBQUcsTUFBTSxFQUFFLEVBQUUsQ0FBQSxHQUFHLElBQUksQ0FBQztBQUM1RCxRQUFJLE1BQU0sRUFBRTtBQUNWLGFBQU8sTUFBTSxDQUFDO0tBQ2Y7R0FDRjtDQUNGOzs7Ozs7Ozs7Ozs7Ozt1Q0FuQm1DLDJCQUEyQjs7Ozs4QkFDcEMsa0JBQWtCOzs7O3FDQUNYLHlCQUF5Qjs7OzsrQkFJcEQsb0JBQW9COztBQXRCM0IsV0FBVyxDQUFDOztJQXlDUyxVQUFVO0FBT2xCLFdBUFEsVUFBVSxHQU9mOzBCQVBLLFVBQVU7O0FBUTNCLFFBQUksQ0FBQyxrQkFBa0IsR0FBRyxFQUFFLENBQUM7O0FBRTdCLFFBQUksQ0FBQyxlQUFlLEdBQUcsaUNBQW9CLENBQUM7QUFDNUMsUUFBSSxDQUFDLCtCQUErQixHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsZUFBZSw4QkFFN0QsVUFBQSxLQUFLO2FBQUksd0NBQTJCLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQztLQUFBLENBQUMsQ0FBQzs7QUFFNUQsUUFBSSxDQUFDLHlCQUF5QixHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7QUFDM0MsUUFBSSxDQUFDLHVCQUF1QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsa0JBQWtCLENBQzlELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztHQUN0Qzs7OztlQWxCa0IsVUFBVTs7V0FvQlosMkJBQUMsVUFBc0IsRUFBRTs7O0FBQ3hDLFVBQU0sdUJBQXVC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LEVBQUU7QUFDakMsV0FBTyxRQUFRLENBQUMsWUFBWSxDQUFDO0dBQzlCLE1BQU07QUFDTCxXQUFPLDZCQUE2QixDQUFDO0dBQ3RDO0NBQ0YiLCJmaWxlIjoiL1VzZXJzL2FzdWFyZXovRG93bmxvYWRzL2h5cGVyY2xpY2svbGliL0h5cGVyY2xpY2suanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG5pbXBvcnQgdHlwZSB7XG4gIEh5cGVyY2xpY2tTdWdnZXN0aW9uLFxuICBIeXBlcmNsaWNrUHJvdmlkZXIsXG59IGZyb20gJy4vdHlwZXMnO1xuXG5pbXBvcnQgSHlwZXJjbGlja0ZvclRleHRFZGl0b3IgZnJvbSAnLi9IeXBlcmNsaWNrRm9yVGV4dEVkaXRvcic7XG5pbXBvcnQgU3VnZ2VzdGlvbkxpc3QgZnJvbSAnLi9TdWdnZXN0aW9uTGlzdCc7XG5pbXBvcnQgU3VnZ2VzdGlvbkxpc3RFbGVtZW50IGZyb20gJy4vU3VnZ2VzdGlvbkxpc3RFbGVtZW50JztcbmltcG9ydCB7XG4gIGRlZmF1bHRXb3JkUmVnRXhwRm9yRWRpdG9yLFxuICBnZXRXb3JkVGV4dEFuZFJhbmdlLFxufSBmcm9tICcuL2h5cGVyY2xpY2stdXRpbHMnO1xuXG4vKipcbiAqIENhbGxzIHRoZSBnaXZlbiBmdW5jdGlvbnMgYW5kIHJldHVybnMgdGhlIGZpcnN0IG5vbi1udWxsIHJldHVybiB2YWx1ZS5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gZmluZFRydXRoeVJldHVyblZhbHVlKGZuczogQXJyYXk8dm9pZCB8ICgpID0+IFByb21pc2U8YW55Pj4pOiBQcm9taXNlPGFueT4ge1xuICBmb3IgKGNvbnN0IGZuIG9mIGZucykge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBiYWJlbC9uby1hd2FpdC1pbi1sb29wXG4gICAgY29uc3QgcmVzdWx0ID0gdHlwZW9mIGZuID09PSAnZnVuY3Rpb24nID8gYXdhaXQgZm4oKSA6IG51bGw7XG4gICAgaWYgKHJlc3VsdCkge1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBDb25zdHJ1Y3QgdGhpcyBvYmplY3QgdG8gZW5hYmxlIEh5cGVyY2xpY2sgaW4gdGhlIEF0b20gd29ya3NwYWNlLlxuICogQ2FsbCBgZGlzcG9zZWAgdG8gZGlzYWJsZSB0aGUgZmVhdHVyZS5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSHlwZXJjbGljayB7XG4gIF9jb25zdW1lZFByb3ZpZGVyczogQXJyYXk8SHlwZXJjbGlja1Byb3ZpZGVyPjtcbiAgX3N1Z2dlc3Rpb25MaXN0OiBTdWdnZXN0aW9uTGlzdDtcbiAgX3N1Z2dlc3Rpb25MaXN0Vmlld1N1YnNjcmlwdGlvbjogSURpc3Bvc2FibGU7XG4gIF9oeXBlcmNsaWNrRm9yVGV4dEVkaXRvcnM6IFNldDxIeXBlcmNsaWNrRm9yVGV4dEVkaXRvcj47XG4gIF90ZXh0RWRpdG9yU3Vic2NyaXB0aW9uOiBJRGlzcG9zYWJsZTtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9jb25zdW1lZFByb3ZpZGVycyA9IFtdO1xuXG4gICAgdGhpcy5fc3VnZ2VzdGlvbkxpc3QgPSBuZXcgU3VnZ2VzdGlvbkxpc3QoKTtcbiAgICB0aGlzLl9zdWdnZXN0aW9uTGlzdFZpZXdTdWJzY3JpcHRpb24gPSBhdG9tLnZpZXdzLmFkZFZpZXdQcm92aWRlcihcbiAgICAgICAgU3VnZ2VzdGlvbkxpc3QsXG4gICAgICAgIG1vZGVsID0+IG5ldyBTdWdnZXN0aW9uTGlzdEVsZW1lbnQoKS5pbml0aWFsaXplKG1vZGVsKSk7XG5cbiAgICB0aGlzLl9oeXBlcmNsaWNrRm9yVGV4dEVkaXRvcnMgPSBuZXcgU2V0KCk7XG4gICAgdGhpcy5fdGV4dEVkaXRvclN1YnNjcmlwdGlvbiA9IGF0b20ud29ya3NwYWNlLm9ic2VydmVUZXh0RWRpdG9ycyhcbiAgICAgIHRoaXMub2JzZXJ2ZVRleHRFZGl0b3IuYmluZCh0aGlzKSk7XG4gIH1cblxuICBvYnNlcnZlVGV4dEVkaXRvcih0ZXh0RWRpdG9yOiBUZXh0RWRpdG9yKSB7XG4gICAgY29uc3QgaHlwZXJjbGlja0ZvclRleHRFZGl0b3IgPSBuZXcgSHlwZXJjbGlja0ZvclRleHRFZGl0b3IodGV4dEVkaXRvciwgdGhpcyk7XG4gICAgdGhpcy5faHlwZXJjbGlja0ZvclRleHRFZGl0b3JzLmFkZChoeXBlcmNsaWNrRm9yVGV4dEVkaXRvcik7XG4gICAgdGV4dEVkaXRvci5vbkRpZERlc3Ryb3koKCkgPT4ge1xuICAgICAgaHlwZXJjbGlja0ZvclRleHRFZGl0b3IuZGlzcG9zZSgpO1xuICAgICAgdGhpcy5faHlwZXJjbGlja0ZvclRleHRFZGl0b3JzLmRlbGV0ZShoeXBlcmNsaWNrRm9yVGV4dEVkaXRvcik7XG4gICAgfSk7XG4gIH1cblxuICBkaXNwb3NlKCkge1xuICAgIHRoaXMuX3N1Z2dlc3Rpb25MaXN0LmhpZGUoKTtcbiAgICBpZiAodGhpcy5fc3VnZ2VzdGlvbkxpc3RWaWV3U3Vic2NyaXB0aW9uKSB7XG4gICAgICB0aGlzLl9zdWdnZXN0aW9uTGlzdFZpZXdTdWJzY3JpcHRpb24uZGlzcG9zZSgpO1xuICAgIH1cbiAgICBpZiAodGhpcy5fdGV4dEVkaXRvclN1YnNjcmlwdGlvbikge1xuICAgICAgdGhpcy5fdGV4dEVkaXRvclN1YnNjcmlwdGlvbi5kaXNwb3NlKCk7XG4gICAgfVxuICAgIHRoaXMuX2h5cGVyY2xpY2tGb3JUZXh0RWRpdG9ycy5mb3JFYWNoKGh5cGVyY2xpY2sgPT4gaHlwZXJjbGljay5kaXNwb3NlKCkpO1xuICAgIHRoaXMuX2h5cGVyY2xpY2tGb3JUZXh0RWRpdG9ycy5jbGVhcigpO1xuICB9XG5cbiAgX2FwcGx5VG9BbGw8VD4oaXRlbTogQXJyYXk8VD4gfCBULCBmOiAoeDogVCkgPT4gdm9pZCk6IHZvaWQge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGl0ZW0pKSB7XG4gICAgICBpdGVtLmZvckVhY2goeCA9PiBmKHgpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZihpdGVtKTtcbiAgICB9XG4gIH1cblxuICBjb25zdW1lUHJvdmlkZXIocHJvdmlkZXI6IEh5cGVyY2xpY2tQcm92aWRlciB8IEFycmF5PEh5cGVyY2xpY2tQcm92aWRlcj4pOiB2b2lkIHtcbiAgICB0aGlzLl9hcHBseVRvQWxsKHByb3ZpZGVyLCBzaW5nbGVQcm92aWRlciA9PiB0aGlzLl9jb25zdW1lU2luZ2xlUHJvdmlkZXIoc2luZ2xlUHJvdmlkZXIpKTtcbiAgfVxuXG4gIHJlbW92ZVByb3ZpZGVyKHByb3ZpZGVyOiBIeXBlcmNsaWNrUHJvdmlkZXIgfCBBcnJheTxIeXBlcmNsaWNrUHJvdmlkZXI+KTogdm9pZCB7XG4gICAgdGhpcy5fYXBwbHlUb0FsbChwcm92aWRlciwgc2luZ2xlUHJvdmlkZXIgPT4gdGhpcy5fcmVtb3ZlU2luZ2xlUHJvdmlkZXIoc2luZ2xlUHJvdmlkZXIpKTtcbiAgfVxuXG4gIF9jb25zdW1lU2luZ2xlUHJvdmlkZXIocHJvdmlkZXI6IEh5cGVyY2xpY2tQcm92aWRlcik6IHZvaWQge1xuICAgIGNvbnN0IHByaW9yaXR5ID0gcHJvdmlkZXIucHJpb3JpdHkgfHwgMDtcbiAgICBmb3IgKGxldCBpID0gMCwgbGVuID0gdGhpcy5fY29uc3VtZWRQcm92aWRlcnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLl9jb25zdW1lZFByb3ZpZGVyc1tpXTtcbiAgICAgIGlmIChwcm92aWRlciA9PT0gaXRlbSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGl0ZW1Qcmlvcml0eSA9IGl0ZW0ucHJpb3JpdHkgfHwgMDtcbiAgICAgIGlmIChwcmlvcml0eSA+IGl0ZW1Qcmlvcml0eSkge1xuICAgICAgICB0aGlzLl9jb25zdW1lZFByb3ZpZGVycy5zcGxpY2UoaSwgMCwgcHJvdmlkZXIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gSWYgd2UgbWFkZSBpdCBhbGwgdGhlIHdheSB0aHJvdWdoIHRoZSBsb29wLCBwcm92aWRlciBtdXN0IGJlIGxvd2VyXG4gICAgLy8gcHJpb3JpdHkgdGhhbiBhbGwgb2YgdGhlIGV4aXN0aW5nIHByb3ZpZGVycywgc28gYWRkIGl0IHRvIHRoZSBlbmQuXG4gICAgdGhpcy5fY29uc3VtZWRQcm92aWRlcnMucHVzaChwcm92aWRlcik7XG4gIH1cblxuICBfcmVtb3ZlU2luZ2xlUHJvdmlkZXIocHJvdmlkZXI6IEh5cGVyY2xpY2tQcm92aWRlcik6IHZvaWQge1xuICAgIGNvbnN0IGluZGV4ID0gdGhpcy5fY29uc3VtZWRQcm92aWRlcnMuaW5kZXhPZihwcm92aWRlcik7XG4gICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgIHRoaXMuX2NvbnN1bWVkUHJvdmlkZXJzLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGZpcnN0IHN1Z2dlc3Rpb24gZnJvbSB0aGUgY29uc3VtZWQgcHJvdmlkZXJzLlxuICAgKi9cbiAgZ2V0U3VnZ2VzdGlvbih0ZXh0RWRpdG9yOiBUZXh0RWRpdG9yLCBwb3NpdGlvbjogYXRvbSRQb2ludCk6IFByb21pc2U8YW55PiB7XG4gICAgLy8gR2V0IHRoZSBkZWZhdWx0IHdvcmQgUmVnRXhwIGZvciB0aGlzIGVkaXRvci5cbiAgICBjb25zdCBkZWZhdWx0V29yZFJlZ0V4cCA9IGRlZmF1bHRXb3JkUmVnRXhwRm9yRWRpdG9yKHRleHRFZGl0b3IpO1xuXG4gICAgcmV0dXJuIGZpbmRUcnV0aHlSZXR1cm5WYWx1ZSh0aGlzLl9jb25zdW1lZFByb3ZpZGVycy5tYXAoKHByb3ZpZGVyOiBIeXBlcmNsaWNrUHJvdmlkZXIpID0+IHtcbiAgICAgIGlmIChwcm92aWRlci5nZXRTdWdnZXN0aW9uKSB7XG4gICAgICAgIGNvbnN0IGdldFN1Z2dlc3Rpb24gPSBwcm92aWRlci5nZXRTdWdnZXN0aW9uLmJpbmQocHJvdmlkZXIpO1xuICAgICAgICByZXR1cm4gKCkgPT4gZ2V0U3VnZ2VzdGlvbih0ZXh0RWRpdG9yLCBwb3NpdGlvbik7XG4gICAgICB9IGVsc2UgaWYgKHByb3ZpZGVyLmdldFN1Z2dlc3Rpb25Gb3JXb3JkKSB7XG4gICAgICAgIGNvbnN0IGdldFN1Z2dlc3Rpb25Gb3JXb3JkID0gcHJvdmlkZXIuZ2V0U3VnZ2VzdGlvbkZvcldvcmQuYmluZChwcm92aWRlcik7XG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgY29uc3Qgd29yZFJlZ0V4cCA9IHByb3ZpZGVyLndvcmRSZWdFeHAgfHwgZGVmYXVsdFdvcmRSZWdFeHA7XG4gICAgICAgICAgY29uc3Qge3RleHQsIHJhbmdlfSA9IGdldFdvcmRUZXh0QW5kUmFuZ2UodGV4dEVkaXRvciwgcG9zaXRpb24sIHdvcmRSZWdFeHApO1xuICAgICAgICAgIHJldHVybiBnZXRTdWdnZXN0aW9uRm9yV29yZCh0ZXh0RWRpdG9yLCB0ZXh0LCByYW5nZSk7XG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIHRocm93IG5ldyBFcnJvcignSHlwZXJjbGljayBtdXN0IGhhdmUgZWl0aGVyIGBnZXRTdWdnZXN0aW9uYCBvciBgZ2V0U3VnZ2VzdGlvbkZvcldvcmRgJyk7XG4gICAgfSkpO1xuICB9XG5cbiAgc2hvd1N1Z2dlc3Rpb25MaXN0KHRleHRFZGl0b3I6IFRleHRFZGl0b3IsIHN1Z2dlc3Rpb246IEh5cGVyY2xpY2tTdWdnZXN0aW9uKTogdm9pZCB7XG4gICAgdGhpcy5fc3VnZ2VzdGlvbkxpc3Quc2hvdyh0ZXh0RWRpdG9yLCBzdWdnZXN0aW9uKTtcbiAgfVxufVxuXG4vKiogUmV0dXJucyB0aGUgcHJvdmlkZXIgbmFtZSBvciBhIGRlZmF1bHQgdmFsdWUgKi9cbmZ1bmN0aW9uIGdldFByb3ZpZGVyTmFtZShwcm92aWRlcjogSHlwZXJjbGlja1Byb3ZpZGVyKTogc3RyaW5nIHtcbiAgaWYgKHByb3ZpZGVyLnByb3ZpZGVyTmFtZSAhPSBudWxsKSB7XG4gICAgcmV0dXJuIHByb3ZpZGVyLnByb3ZpZGVyTmFtZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gJ3VubmFtZWQtaHlwZXJjbGljay1wcm92aWRlcic7XG4gIH1cbn1cbiJdfQ==