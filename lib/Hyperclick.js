
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

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

var HyperclickForTextEditor = require('./HyperclickForTextEditor');
var SuggestionList = require('./SuggestionList');
var SuggestionListElement = require('./SuggestionListElement');
var getWordTextAndRange = require('./get-word-text-and-range');

var _require = require('./hyperclick-utils');

var defaultWordRegExpForEditor = _require.defaultWordRegExpForEditor;

var remove = require('nuclide-commons').array.remove;

var Hyperclick = (function () {
  function Hyperclick() {
    _classCallCheck(this, Hyperclick);

    this._consumedProviders = [];

    this._suggestionList = new SuggestionList();
    this._suggestionListViewSubscription = atom.views.addViewProvider(SuggestionList, function (model) {
      return new SuggestionListElement().initialize(model);
    });

    this._hyperclickForTextEditors = new Set();
    this._textEditorSubscription = atom.workspace.observeTextEditors(this.observeTextEditor.bind(this));
  }

  _createClass(Hyperclick, [{
    key: 'observeTextEditor',
    value: function observeTextEditor(textEditor) {
      var _this = this;

      var hyperclickForTextEditor = new HyperclickForTextEditor(textEditor, this);
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
      remove(this._consumedProviders, provider);
    }

    /**
     * Returns the first suggestion from the consumed providers.
     */
  }, {
    key: 'getSuggestion',
    value: function getSuggestion(textEditor, position) {
      // Get the default word RegExp for this editor.
      var defaultWordRegExp = defaultWordRegExpForEditor(textEditor);

      return findTruthyReturnValue(this._consumedProviders.map(function (provider) {
        if (provider.getSuggestion) {
          var getSuggestion = provider.getSuggestion.bind(provider);
          return function () {
            return getSuggestion(textEditor, position);
          };
        } else if (provider.getSuggestionForWord) {
          var getSuggestionForWord = provider.getSuggestionForWord.bind(provider);
          return function () {
            var wordRegExp = provider.wordRegExp || defaultWordRegExp;

            var _getWordTextAndRange = getWordTextAndRange(textEditor, position, wordRegExp);

            var text = _getWordTextAndRange.text;
            var range = _getWordTextAndRange.range;

            return getSuggestionForWord(textEditor, text, range);
          };
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

module.exports = Hyperclick;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy93MS9fMm1jNm0wNTBxbjIzMm5wc2Y5ejNoZnNoNThfamgvVC90bXBpMzV6akdwdWJsaXNoX3BhY2thZ2VzL2FwbS9oeXBlcmNsaWNrL2xpYi9IeXBlcmNsaWNrLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7OztJQXFCRyxxQkFBcUIscUJBQXBDLFdBQXFDLEdBQXFDLEVBQWdCO0FBQ3hGLE9BQUssSUFBSSxFQUFFLElBQUksR0FBRyxFQUFFO0FBQ2xCLFFBQUksTUFBTSxHQUFHLE9BQU8sRUFBRSxLQUFLLFVBQVUsSUFBRyxNQUFNLEVBQUUsRUFBRSxDQUFBLEdBQUcsSUFBSSxDQUFDO0FBQzFELFFBQUksTUFBTSxFQUFFO0FBQ1YsYUFBTyxNQUFNLENBQUM7S0FDZjtHQUNGO0NBQ0Y7Ozs7Ozs7Ozs7OztBQWpCRCxJQUFJLHVCQUF1QixHQUFHLE9BQU8sQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO0FBQ25FLElBQUksY0FBYyxHQUFHLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0FBQ2pELElBQUkscUJBQXFCLEdBQUcsT0FBTyxDQUFDLHlCQUF5QixDQUFDLENBQUM7QUFDL0QsSUFBSSxtQkFBbUIsR0FBRyxPQUFPLENBQUMsMkJBQTJCLENBQUMsQ0FBQzs7ZUFDNUIsT0FBTyxDQUFDLG9CQUFvQixDQUFDOztJQUEzRCwwQkFBMEIsWUFBMUIsMEJBQTBCOztJQUMxQixNQUFNLEdBQUksT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUMsS0FBSyxDQUExQyxNQUFNOztJQWtCTCxVQUFVO0FBT0gsV0FQUCxVQUFVLEdBT0E7MEJBUFYsVUFBVTs7QUFRWixRQUFJLENBQUMsa0JBQWtCLEdBQUcsRUFBRSxDQUFDOztBQUU3QixRQUFJLENBQUMsZUFBZSxHQUFHLElBQUksY0FBYyxFQUFFLENBQUM7QUFDNUMsUUFBSSxDQUFDLCtCQUErQixHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMs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QWdDLEVBQVE7QUFDakYsVUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0tBQ25EOzs7U0ExR0csVUFBVTs7O0FBNkdoQixNQUFNLENBQUMsT0FBTyxHQUFHLFVBQVUsQ0FBQyIsImZpbGUiOiIvdmFyL2ZvbGRlcnMvdzEvXzJtYzZtMDUwcW4yMzJucHNmOXozaGZzaDU4X2poL1QvdG1waTM1empHcHVibGlzaF9wYWNrYWdlcy9hcG0vaHlwZXJjbGljay9saWIvSHlwZXJjbGljay5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbnZhciBIeXBlcmNsaWNrRm9yVGV4dEVkaXRvciA9IHJlcXVpcmUoJy4vSHlwZXJjbGlja0ZvclRleHRFZGl0b3InKTtcbnZhciBTdWdnZXN0aW9uTGlzdCA9IHJlcXVpcmUoJy4vU3VnZ2VzdGlvbkxpc3QnKTtcbnZhciBTdWdnZXN0aW9uTGlzdEVsZW1lbnQgPSByZXF1aXJlKCcuL1N1Z2dlc3Rpb25MaXN0RWxlbWVudCcpO1xudmFyIGdldFdvcmRUZXh0QW5kUmFuZ2UgPSByZXF1aXJlKCcuL2dldC13b3JkLXRleHQtYW5kLXJhbmdlJyk7XG52YXIge2RlZmF1bHRXb3JkUmVnRXhwRm9yRWRpdG9yfSA9IHJlcXVpcmUoJy4vaHlwZXJjbGljay11dGlscycpO1xudmFyIHtyZW1vdmV9ID0gcmVxdWlyZSgnbnVjbGlkZS1jb21tb25zJykuYXJyYXk7XG5cbi8qKlxuICogQ2FsbHMgdGhlIGdpdmVuIGZ1bmN0aW9ucyBhbmQgcmV0dXJucyB0aGUgZmlyc3Qgbm9uLW51bGwgcmV0dXJuIHZhbHVlLlxuICovXG5hc3luYyBmdW5jdGlvbiBmaW5kVHJ1dGh5UmV0dXJuVmFsdWUoZm5zOiBBcnJheTx2b2lkIHwgKCkgPT4gUHJvbWlzZTxhbnk+Pik6IFByb21pc2U8YW55PiB7XG4gIGZvciAodmFyIGZuIG9mIGZucykge1xuICAgIHZhciByZXN1bHQgPSB0eXBlb2YgZm4gPT09ICdmdW5jdGlvbicgPyBhd2FpdCBmbigpIDogbnVsbDtcbiAgICBpZiAocmVzdWx0KSB7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENvbnN0cnVjdCB0aGlzIG9iamVjdCB0byBlbmFibGUgSHlwZXJjbGljayBpbiB0aGUgQXRvbSB3b3Jrc3BhY2UuXG4gKiBDYWxsIGBkaXNwb3NlYCB0byBkaXNhYmxlIHRoZSBmZWF0dXJlLlxuICovXG5jbGFzcyBIeXBlcmNsaWNrIHtcbiAgX2NvbnN1bWVkUHJvdmlkZXJzOiBBcnJheTxIeXBlcmNsaWNrUHJvdmlkZXI+O1xuICBfc3VnZ2VzdGlvbkxpc3Q6IFN1Z2dlc3Rpb25MaXN0O1xuICBfc3VnZ2VzdGlvbkxpc3RWaWV3U3Vic2NyaXB0aW9uOiBhdG9tJERpc3Bvc2FibGU7XG4gIF9oeXBlcmNsaWNrRm9yVGV4dEVkaXRvcnM6IFNldDxIeXBlcmNsaWNrRm9yVGV4dEVkaXRvcj47XG4gIF90ZXh0RWRpdG9yU3Vic2NyaXB0aW9uOiBhdG9tJERpc3Bvc2FibGU7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5fY29uc3VtZWRQcm92aWRlcnMgPSBbXTtcblxuICAgIHRoaXMuX3N1Z2dlc3Rpb25MaXN0ID0gbmV3IFN1Z2dlc3Rpb25MaXN0KCk7XG4gICAgdGhpcy5fc3VnZ2VzdGlvbkxpc3RWaWV3U3Vic2NyaXB0aW9uID0gYXRvbS52aWV3cy5hZGRWaWV3UHJvdmlkZXIoXG4gICAgICAgIFN1Z2dlc3Rpb25MaXN0LFxuICAgICAgICBtb2RlbCA9PiBuZXcgU3VnZ2VzdGlvbkxpc3RFbGVtZW50KCkuaW5pdGlhbGl6ZShtb2RlbCkpO1xuXG4gICAgdGhpcy5faHlwZXJjbGlja0ZvclRleHRFZGl0b3JzID0gbmV3IFNldCgpO1xuICAgIHRoaXMuX3RleHRFZGl0b3JTdWJzY3JpcHRpb24gPSBhdG9tLndvcmtzcGFjZS5vYnNlcnZlVGV4dEVkaXRvcnMoXG4gICAgICB0aGlzLm9ic2VydmVUZXh0RWRpdG9yLmJpbmQodGhpcykpO1xuICB9XG5cbiAgb2JzZXJ2ZVRleHRFZGl0b3IodGV4dEVkaXRvcjogVGV4dEVkaXRvcikge1xuICAgIHZhciBoeXBlcmNsaWNrRm9yVGV4dEVkaXRvciA9IG5ldyBIeXBlcmNsaWNrRm9yVGV4dEVkaXRvcih0ZXh0RWRpdG9yLCB0aGlzKTtcbiAgICB0aGlzLl9oeXBlcmNsaWNrRm9yVGV4dEVkaXRvcnMuYWRkKGh5cGVyY2xpY2tGb3JUZXh0RWRpdG9yKTtcbiAgICB0ZXh0RWRpdG9yLm9uRGlkRGVzdHJveSgoKSA9PiB7XG4gICAgICBoeXBlcmNsaWNrRm9yVGV4dEVkaXRvci5kaXNwb3NlKCk7XG4gICAgICB0aGlzLl9oeXBlcmNsaWNrRm9yVGV4dEVkaXRvcnMuZGVsZXRlKGh5cGVyY2xpY2tGb3JUZXh0RWRpdG9yKTtcbiAgICB9KTtcbiAgfVxuXG4gIGRpc3Bvc2UoKSB7XG4gICAgaWYgKHRoaXMuX3N1Z2dlc3Rpb25MaXN0Vmlld1N1YnNjcmlwdGlvbikge1xuICAgICAgdGhpcy5fc3VnZ2VzdGlvbkxpc3RWaWV3U3Vic2NyaXB0aW9uLmRpc3Bvc2UoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuX3RleHRFZGl0b3JTdWJzY3JpcHRpb24pIHtcbiAgICAgIHRoaXMuX3RleHRFZGl0b3JTdWJzY3JpcHRpb24uZGlzcG9zZSgpO1xuICAgIH1cbiAgICB0aGlzLl9oeXBlcmNsaWNrRm9yVGV4dEVkaXRvcnMuZm9yRWFjaChoeXBlcmNsaWNrID0+IGh5cGVyY2xpY2suZGlzcG9zZSgpKTtcbiAgICB0aGlzLl9oeXBlcmNsaWNrRm9yVGV4dEVkaXRvcnMuY2xlYXIoKTtcbiAgfVxuXG4gIF9hcHBseVRvQWxsPFQ+KGl0ZW06IFQgfCBBcnJheTxUPiwgZjogKHg6IFQpID0+IHZvaWQpOiB2b2lkIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShpdGVtKSkge1xuICAgICAgaXRlbS5mb3JFYWNoKHggPT4gZih4KSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGYoaXRlbSk7XG4gICAgfVxuICB9XG5cbiAgY29uc3VtZVByb3ZpZGVyKHByb3ZpZGVyOiBIeXBlcmNsaWNrUHJvdmlkZXIgfCBBcnJheTxIeXBlcmNsaWNrUHJvdmlkZXI+KTogdm9pZCB7XG4gICAgdGhpcy5fYXBwbHlUb0FsbChwcm92aWRlciwgc2luZ2xlUHJvdmlkZXIgPT4gdGhpcy5fY29uc3VtZVNpbmdsZVByb3ZpZGVyKHNpbmdsZVByb3ZpZGVyKSk7XG4gIH1cblxuICByZW1vdmVQcm92aWRlcihwcm92aWRlcjogSHlwZXJjbGlja1Byb3ZpZGVyIHwgQXJyYXk8SHlwZXJjbGlja1Byb3ZpZGVyPik6IHZvaWQge1xuICAgIHRoaXMuX2FwcGx5VG9BbGwocHJvdmlkZXIsIHNpbmdsZVByb3ZpZGVyID0+IHRoaXMuX3JlbW92ZVNpbmdsZVByb3ZpZGVyKHNpbmdsZVByb3ZpZGVyKSk7XG4gIH1cblxuICBfY29uc3VtZVNpbmdsZVByb3ZpZGVyKHByb3ZpZGVyOiBIeXBlcmNsaWNrUHJvdmlkZXIpOiB2b2lkIHtcbiAgICB2YXIgcHJpb3JpdHkgPSBwcm92aWRlci5wcmlvcml0eSB8fCAwO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLl9jb25zdW1lZFByb3ZpZGVycy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgdmFyIGl0ZW0gPSB0aGlzLl9jb25zdW1lZFByb3ZpZGVyc1tpXTtcbiAgICAgIGlmIChwcm92aWRlciA9PT0gaXRlbSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHZhciBpdGVtUHJpb3JpdHkgPSBpdGVtLnByaW9yaXR5IHx8IDA7XG4gICAgICBpZiAocHJpb3JpdHkgPiBpdGVtUHJpb3JpdHkpIHtcbiAgICAgICAgdGhpcy5fY29uc3VtZWRQcm92aWRlcnMuc3BsaWNlKGksIDAsIHByb3ZpZGVyKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIElmIHdlIG1hZGUgaXQgYWxsIHRoZSB3YXkgdGhyb3VnaCB0aGUgbG9vcCwgcHJvdmlkZXIgbXVzdCBiZSBsb3dlclxuICAgIC8vIHByaW9yaXR5IHRoYW4gYWxsIG9mIHRoZSBleGlzdGluZyBwcm92aWRlcnMsIHNvIGFkZCBpdCB0byB0aGUgZW5kLlxuICAgIHRoaXMuX2NvbnN1bWVkUHJvdmlkZXJzLnB1c2gocHJvdmlkZXIpO1xuICB9XG5cbiAgX3JlbW92ZVNpbmdsZVByb3ZpZGVyKHByb3ZpZGVyOiBIeXBlcmNsaWNrUHJvdmlkZXIpOiB2b2lkIHtcbiAgICByZW1vdmUodGhpcy5fY29uc3VtZWRQcm92aWRlcnMsIHByb3ZpZGVyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBmaXJzdCBzdWdnZXN0aW9uIGZyb20gdGhlIGNvbnN1bWVkIHByb3ZpZGVycy5cbiAgICovXG4gIGdldFN1Z2dlc3Rpb24odGV4dEVkaXRvcjogVGV4dEVkaXRvciwgcG9zaXRpb246IGF0b20kUG9pbnQpOiBQcm9taXNlIHtcbiAgICAvLyBHZXQgdGhlIGRlZmF1bHQgd29yZCBSZWdFeHAgZm9yIHRoaXMgZWRpdG9yLlxuICAgIHZhciBkZWZhdWx0V29yZFJlZ0V4cCA9IGRlZmF1bHRXb3JkUmVnRXhwRm9yRWRpdG9yKHRleHRFZGl0b3IpO1xuXG4gICAgcmV0dXJuIGZpbmRUcnV0aHlSZXR1cm5WYWx1ZSh0aGlzLl9jb25zdW1lZFByb3ZpZGVycy5tYXAoKHByb3ZpZGVyOiBIeXBlcmNsaWNrUHJvdmlkZXIpID0+IHtcbiAgICAgIGlmIChwcm92aWRlci5nZXRTdWdnZXN0aW9uKSB7XG4gICAgICAgIHZhciBnZXRTdWdnZXN0aW9uID0gcHJvdmlkZXIuZ2V0U3VnZ2VzdGlvbi5iaW5kKHByb3ZpZGVyKTtcbiAgICAgICAgcmV0dXJuICgpID0+IGdldFN1Z2dlc3Rpb24odGV4dEVkaXRvciwgcG9zaXRpb24pO1xuICAgICAgfSBlbHNlIGlmIChwcm92aWRlci5nZXRTdWdnZXN0aW9uRm9yV29yZCkge1xuICAgICAgICB2YXIgZ2V0U3VnZ2VzdGlvbkZvcldvcmQgPSBwcm92aWRlci5nZXRTdWdnZXN0aW9uRm9yV29yZC5iaW5kKHByb3ZpZGVyKTtcbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICB2YXIgd29yZFJlZ0V4cCA9IHByb3ZpZGVyLndvcmRSZWdFeHAgfHwgZGVmYXVsdFdvcmRSZWdFeHA7XG4gICAgICAgICAgdmFyIHt0ZXh0LCByYW5nZX0gPSBnZXRXb3JkVGV4dEFuZFJhbmdlKHRleHRFZGl0b3IsIHBvc2l0aW9uLCB3b3JkUmVnRXhwKTtcbiAgICAgICAgICByZXR1cm4gZ2V0U3VnZ2VzdGlvbkZvcldvcmQodGV4dEVkaXRvciwgdGV4dCwgcmFuZ2UpO1xuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0h5cGVyY2xpY2sgbXVzdCBoYXZlIGVpdGhlciBgZ2V0U3VnZ2VzdGlvbmAgb3IgYGdldFN1Z2dlc3Rpb25Gb3JXb3JkYCcpO1xuICAgIH0pKTtcbiAgfVxuXG4gIHNob3dTdWdnZXN0aW9uTGlzdCh0ZXh0RWRpdG9yOiBUZXh0RWRpdG9yLCBzdWdnZXN0aW9uOiBIeXBlcmNsaWNrU3VnZ2VzdGlvbik6IHZvaWQge1xuICAgIHRoaXMuX3N1Z2dlc3Rpb25MaXN0LnNob3codGV4dEVkaXRvciwgc3VnZ2VzdGlvbik7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBIeXBlcmNsaWNrO1xuIl19
