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

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
'use babel';

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy93MS9fMm1jNm0wNTBxbjIzMm5wc2Y5ejNoZnNoNThfamgvVC90bXBKbjRvcUdwdWJsaXNoX3BhY2thZ2VzL2FwbS9oeXBlcmNsaWNrL2xpYi9IeXBlcmNsaWNrLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztJQXlCZSxxQkFBcUIscUJBQXBDLFdBQXFDLEdBQXFDLEVBQWdCO0FBQ3hGLE9BQUssSUFBSSxFQUFFLElBQUksR0FBRyxFQUFFO0FBQ2xCLFFBQUksTUFBTSxHQUFHLE9BQU8sRUFBRSxLQUFLLFVBQVUsSUFBRyxNQUFNLEVBQUUsRUFBRSxDQUFBLEdBQUcsSUFBSSxDQUFDO0FBQzFELFFBQUksTUFBTSxFQUFFO0FBQ1YsYUFBTyxNQUFNLENBQUM7S0FDZjtHQUNGO0NBQ0Y7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFoQ0QsV0FBVyxDQUFDOztBQWVaLElBQUksdUJBQXVCLEdBQUcsT0FBTyxDQUFDLDJCQUEyQixDQUFDLENBQUM7QUFDbkUsSUFBSSxjQUFjLEdBQUcsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUM7QUFDakQsSUFBSSxxQkFBcUIsR0FBRyxPQUFPLENBQUMseUJBQXlCLENBQUMsQ0FBQztBQUMvRCxJQUFJLG1CQUFtQixHQUFHLE9BQU8sQ0FBQywyQkFBMkIsQ0FBQyxDQUFDOztlQUM1QixPQUFPLENBQUMsb0JBQW9CLENBQUM7O0lBQTNELDBCQUEwQixZQUExQiwwQkFBMEI7O0lBQzFCLE1BQU0sR0FBSSxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxLQUFLLENBQTFDLE1BQU07O0lBa0JMLFVBQVU7QUFPSCxXQVBQLFVBQVUsR0FPQTswQkFQVixVQUFVOztBQVFaLFFBQUksQ0FBQyxrQkFBa0IsR0FBRyxFQUFFLENBQUM7O0FBRTdCLFFBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxjQUFjLEVBQUUsQ0FBQztBQUM1QyxRQUFJLENBQUMsK0JBQStCLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxl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Z0MsRUFBUTtBQUNqRixVQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUM7S0FDbkQ7OztTQTFHRyxVQUFVOzs7QUE2R2hCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsVUFBVSxDQUFDIiwiZmlsZSI6Ii92YXIvZm9sZGVycy93MS9fMm1jNm0wNTBxbjIzMm5wc2Y5ejNoZnNoNThfamgvVC90bXBKbjRvcUdwdWJsaXNoX3BhY2thZ2VzL2FwbS9oeXBlcmNsaWNrL2xpYi9IeXBlcmNsaWNrLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cbmltcG9ydCB0eXBlIHtcbiAgSHlwZXJjbGlja1Byb3ZpZGVyLFxuICBIeXBlcmNsaWNrU3VnZ2VzdGlvbixcbn0gZnJvbSAnLi90eXBlcyc7XG5cbnZhciBIeXBlcmNsaWNrRm9yVGV4dEVkaXRvciA9IHJlcXVpcmUoJy4vSHlwZXJjbGlja0ZvclRleHRFZGl0b3InKTtcbnZhciBTdWdnZXN0aW9uTGlzdCA9IHJlcXVpcmUoJy4vU3VnZ2VzdGlvbkxpc3QnKTtcbnZhciBTdWdnZXN0aW9uTGlzdEVsZW1lbnQgPSByZXF1aXJlKCcuL1N1Z2dlc3Rpb25MaXN0RWxlbWVudCcpO1xudmFyIGdldFdvcmRUZXh0QW5kUmFuZ2UgPSByZXF1aXJlKCcuL2dldC13b3JkLXRleHQtYW5kLXJhbmdlJyk7XG52YXIge2RlZmF1bHRXb3JkUmVnRXhwRm9yRWRpdG9yfSA9IHJlcXVpcmUoJy4vaHlwZXJjbGljay11dGlscycpO1xudmFyIHtyZW1vdmV9ID0gcmVxdWlyZSgnbnVjbGlkZS1jb21tb25zJykuYXJyYXk7XG5cbi8qKlxuICogQ2FsbHMgdGhlIGdpdmVuIGZ1bmN0aW9ucyBhbmQgcmV0dXJucyB0aGUgZmlyc3Qgbm9uLW51bGwgcmV0dXJuIHZhbHVlLlxuICovXG5hc3luYyBmdW5jdGlvbiBmaW5kVHJ1dGh5UmV0dXJuVmFsdWUoZm5zOiBBcnJheTx2b2lkIHwgKCkgPT4gUHJvbWlzZTxhbnk+Pik6IFByb21pc2U8YW55PiB7XG4gIGZvciAodmFyIGZuIG9mIGZucykge1xuICAgIHZhciByZXN1bHQgPSB0eXBlb2YgZm4gPT09ICdmdW5jdGlvbicgPyBhd2FpdCBmbigpIDogbnVsbDtcbiAgICBpZiAocmVzdWx0KSB7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENvbnN0cnVjdCB0aGlzIG9iamVjdCB0byBlbmFibGUgSHlwZXJjbGljayBpbiB0aGUgQXRvbSB3b3Jrc3BhY2UuXG4gKiBDYWxsIGBkaXNwb3NlYCB0byBkaXNhYmxlIHRoZSBmZWF0dXJlLlxuICovXG5jbGFzcyBIeXBlcmNsaWNrIHtcbiAgX2NvbnN1bWVkUHJvdmlkZXJzOiBBcnJheTxIeXBlcmNsaWNrUHJvdmlkZXI+O1xuICBfc3VnZ2VzdGlvbkxpc3Q6IFN1Z2dlc3Rpb25MaXN0O1xuICBfc3VnZ2VzdGlvbkxpc3RWaWV3U3Vic2NyaXB0aW9uOiBhdG9tJERpc3Bvc2FibGU7XG4gIF9oeXBlcmNsaWNrRm9yVGV4dEVkaXRvcnM6IFNldDxIeXBlcmNsaWNrRm9yVGV4dEVkaXRvcj47XG4gIF90ZXh0RWRpdG9yU3Vic2NyaXB0aW9uOiBhdG9tJERpc3Bvc2FibGU7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5fY29uc3VtZWRQcm92aWRlcnMgPSBbXTtcblxuICAgIHRoaXMuX3N1Z2dlc3Rpb25MaXN0ID0gbmV3IFN1Z2dlc3Rpb25MaXN0KCk7XG4gICAgdGhpcy5fc3VnZ2VzdGlvbkxpc3RWaWV3U3Vic2NyaXB0aW9uID0gYXRvbS52aWV3cy5hZGRWaWV3UHJvdmlkZXIoXG4gICAgICAgIFN1Z2dlc3Rpb25MaXN0LFxuICAgICAgICBtb2RlbCA9PiBuZXcgU3VnZ2VzdGlvbkxpc3RFbGVtZW50KCkuaW5pdGlhbGl6ZShtb2RlbCkpO1xuXG4gICAgdGhpcy5faHlwZXJjbGlja0ZvclRleHRFZGl0b3JzID0gbmV3IFNldCgpO1xuICAgIHRoaXMuX3RleHRFZGl0b3JTdWJzY3JpcHRpb24gPSBhdG9tLndvcmtzcGFjZS5vYnNlcnZlVGV4dEVkaXRvcnMoXG4gICAgICB0aGlzLm9ic2VydmVUZXh0RWRpdG9yLmJpbmQodGhpcykpO1xuICB9XG5cbiAgb2JzZXJ2ZVRleHRFZGl0b3IodGV4dEVkaXRvcjogVGV4dEVkaXRvcikge1xuICAgIHZhciBoeXBlcmNsaWNrRm9yVGV4dEVkaXRvciA9IG5ldyBIeXBlcmNsaWNrRm9yVGV4dEVkaXRvcih0ZXh0RWRpdG9yLCB0aGlzKTtcbiAgICB0aGlzLl9oeXBlcmNsaWNrRm9yVGV4dEVkaXRvcnMuYWRkKGh5cGVyY2xpY2tGb3JUZXh0RWRpdG9yKTtcbiAgICB0ZXh0RWRpdG9yLm9uRGlkRGVzdHJveSgoKSA9PiB7XG4gICAgICBoeXBlcmNsaWNrRm9yVGV4dEVkaXRvci5kaXNwb3NlKCk7XG4gICAgICB0aGlzLl9oeXBlcmNsaWNrRm9yVGV4dEVkaXRvcnMuZGVsZXRlKGh5cGVyY2xpY2tGb3JUZXh0RWRpdG9yKTtcbiAgICB9KTtcbiAgfVxuXG4gIGRpc3Bvc2UoKSB7XG4gICAgaWYgKHRoaXMuX3N1Z2dlc3Rpb25MaXN0Vmlld1N1YnNjcmlwdGlvbikge1xuICAgICAgdGhpcy5fc3VnZ2VzdGlvbkxpc3RWaWV3U3Vic2NyaXB0aW9uLmRpc3Bvc2UoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuX3RleHRFZGl0b3JTdWJzY3JpcHRpb24pIHtcbiAgICAgIHRoaXMuX3RleHRFZGl0b3JTdWJzY3JpcHRpb24uZGlzcG9zZSgpO1xuICAgIH1cbiAgICB0aGlzLl9oeXBlcmNsaWNrRm9yVGV4dEVkaXRvcnMuZm9yRWFjaChoeXBlcmNsaWNrID0+IGh5cGVyY2xpY2suZGlzcG9zZSgpKTtcbiAgICB0aGlzLl9oeXBlcmNsaWNrRm9yVGV4dEVkaXRvcnMuY2xlYXIoKTtcbiAgfVxuXG4gIF9hcHBseVRvQWxsPFQ+KGl0ZW06IFQgfCBBcnJheTxUPiwgZjogKHg6IFQpID0+IHZvaWQpOiB2b2lkIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShpdGVtKSkge1xuICAgICAgaXRlbS5mb3JFYWNoKHggPT4gZih4KSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGYoaXRlbSk7XG4gICAgfVxuICB9XG5cbiAgY29uc3VtZVByb3ZpZGVyKHByb3ZpZGVyOiBIeXBlcmNsaWNrUHJvdmlkZXIgfCBBcnJheTxIeXBlcmNsaWNrUHJvdmlkZXI+KTogdm9pZCB7XG4gICAgdGhpcy5fYXBwbHlUb0FsbChwcm92aWRlciwgc2luZ2xlUHJvdmlkZXIgPT4gdGhpcy5fY29uc3VtZVNpbmdsZVByb3ZpZGVyKHNpbmdsZVByb3ZpZGVyKSk7XG4gIH1cblxuICByZW1vdmVQcm92aWRlcihwcm92aWRlcjogSHlwZXJjbGlja1Byb3ZpZGVyIHwgQXJyYXk8SHlwZXJjbGlja1Byb3ZpZGVyPik6IHZvaWQge1xuICAgIHRoaXMuX2FwcGx5VG9BbGwocHJvdmlkZXIsIHNpbmdsZVByb3ZpZGVyID0+IHRoaXMuX3JlbW92ZVNpbmdsZVByb3ZpZGVyKHNpbmdsZVByb3ZpZGVyKSk7XG4gIH1cblxuICBfY29uc3VtZVNpbmdsZVByb3ZpZGVyKHByb3ZpZGVyOiBIeXBlcmNsaWNrUHJvdmlkZXIpOiB2b2lkIHtcbiAgICB2YXIgcHJpb3JpdHkgPSBwcm92aWRlci5wcmlvcml0eSB8fCAwO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLl9jb25zdW1lZFByb3ZpZGVycy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgdmFyIGl0ZW0gPSB0aGlzLl9jb25zdW1lZFByb3ZpZGVyc1tpXTtcbiAgICAgIGlmIChwcm92aWRlciA9PT0gaXRlbSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHZhciBpdGVtUHJpb3JpdHkgPSBpdGVtLnByaW9yaXR5IHx8IDA7XG4gICAgICBpZiAocHJpb3JpdHkgPiBpdGVtUHJpb3JpdHkpIHtcbiAgICAgICAgdGhpcy5fY29uc3VtZWRQcm92aWRlcnMuc3BsaWNlKGksIDAsIHByb3ZpZGVyKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIElmIHdlIG1hZGUgaXQgYWxsIHRoZSB3YXkgdGhyb3VnaCB0aGUgbG9vcCwgcHJvdmlkZXIgbXVzdCBiZSBsb3dlclxuICAgIC8vIHByaW9yaXR5IHRoYW4gYWxsIG9mIHRoZSBleGlzdGluZyBwcm92aWRlcnMsIHNvIGFkZCBpdCB0byB0aGUgZW5kLlxuICAgIHRoaXMuX2NvbnN1bWVkUHJvdmlkZXJzLnB1c2gocHJvdmlkZXIpO1xuICB9XG5cbiAgX3JlbW92ZVNpbmdsZVByb3ZpZGVyKHByb3ZpZGVyOiBIeXBlcmNsaWNrUHJvdmlkZXIpOiB2b2lkIHtcbiAgICByZW1vdmUodGhpcy5fY29uc3VtZWRQcm92aWRlcnMsIHByb3ZpZGVyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBmaXJzdCBzdWdnZXN0aW9uIGZyb20gdGhlIGNvbnN1bWVkIHByb3ZpZGVycy5cbiAgICovXG4gIGdldFN1Z2dlc3Rpb24odGV4dEVkaXRvcjogVGV4dEVkaXRvciwgcG9zaXRpb246IGF0b20kUG9pbnQpOiBQcm9taXNlIHtcbiAgICAvLyBHZXQgdGhlIGRlZmF1bHQgd29yZCBSZWdFeHAgZm9yIHRoaXMgZWRpdG9yLlxuICAgIHZhciBkZWZhdWx0V29yZFJlZ0V4cCA9IGRlZmF1bHRXb3JkUmVnRXhwRm9yRWRpdG9yKHRleHRFZGl0b3IpO1xuXG4gICAgcmV0dXJuIGZpbmRUcnV0aHlSZXR1cm5WYWx1ZSh0aGlzLl9jb25zdW1lZFByb3ZpZGVycy5tYXAoKHByb3ZpZGVyOiBIeXBlcmNsaWNrUHJvdmlkZXIpID0+IHtcbiAgICAgIGlmIChwcm92aWRlci5nZXRTdWdnZXN0aW9uKSB7XG4gICAgICAgIHZhciBnZXRTdWdnZXN0aW9uID0gcHJvdmlkZXIuZ2V0U3VnZ2VzdGlvbi5iaW5kKHByb3ZpZGVyKTtcbiAgICAgICAgcmV0dXJuICgpID0+IGdldFN1Z2dlc3Rpb24odGV4dEVkaXRvciwgcG9zaXRpb24pO1xuICAgICAgfSBlbHNlIGlmIChwcm92aWRlci5nZXRTdWdnZXN0aW9uRm9yV29yZCkge1xuICAgICAgICB2YXIgZ2V0U3VnZ2VzdGlvbkZvcldvcmQgPSBwcm92aWRlci5nZXRTdWdnZXN0aW9uRm9yV29yZC5iaW5kKHByb3ZpZGVyKTtcbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICB2YXIgd29yZFJlZ0V4cCA9IHByb3ZpZGVyLndvcmRSZWdFeHAgfHwgZGVmYXVsdFdvcmRSZWdFeHA7XG4gICAgICAgICAgdmFyIHt0ZXh0LCByYW5nZX0gPSBnZXRXb3JkVGV4dEFuZFJhbmdlKHRleHRFZGl0b3IsIHBvc2l0aW9uLCB3b3JkUmVnRXhwKTtcbiAgICAgICAgICByZXR1cm4gZ2V0U3VnZ2VzdGlvbkZvcldvcmQodGV4dEVkaXRvciwgdGV4dCwgcmFuZ2UpO1xuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0h5cGVyY2xpY2sgbXVzdCBoYXZlIGVpdGhlciBgZ2V0U3VnZ2VzdGlvbmAgb3IgYGdldFN1Z2dlc3Rpb25Gb3JXb3JkYCcpO1xuICAgIH0pKTtcbiAgfVxuXG4gIHNob3dTdWdnZXN0aW9uTGlzdCh0ZXh0RWRpdG9yOiBUZXh0RWRpdG9yLCBzdWdnZXN0aW9uOiBIeXBlcmNsaWNrU3VnZ2VzdGlvbik6IHZvaWQge1xuICAgIHRoaXMuX3N1Z2dlc3Rpb25MaXN0LnNob3codGV4dEVkaXRvciwgc3VnZ2VzdGlvbik7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBIeXBlcmNsaWNrO1xuIl19
