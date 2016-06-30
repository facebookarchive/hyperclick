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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

'use babel';

var SuggestionList = (function () {
  function SuggestionList() {
    _classCallCheck(this, SuggestionList);
  }

  _createClass(SuggestionList, [{
    key: 'show',
    value: function show(textEditor, suggestion) {
      if (!textEditor || !suggestion) {
        return;
      }

      this._textEditor = textEditor;
      this._suggestion = suggestion;

      this.hide();

      var range = suggestion.range;

      (0, _assert2['default'])(range);

      var _ref = Array.isArray(range) ? range[0] : range;

      var position = _ref.start;

      this._suggestionMarker = textEditor.markBufferPosition(position);
      if (this._suggestionMarker) {
        this._overlayDecoration = textEditor.decorateMarker(this._suggestionMarker, {
          type: 'overlay',
          item: this
        });
      }
    }
  }, {
    key: 'hide',
    value: function hide() {
      // $FlowFixMe method override not working with `this`.
      atom.views.getView(this).dispose();
      if (this._suggestionMarker) {
        this._suggestionMarker.destroy();
      } else if (this._overlayDecoration) {
        this._overlayDecoration.destroy();
      }
      this._suggestionMarker = undefined;
      this._overlayDecoration = undefined;
    }
  }, {
    key: 'getTextEditor',
    value: function getTextEditor() {
      return this._textEditor;
    }
  }, {
    key: 'getSuggestion',
    value: function getSuggestion() {
      return this._suggestion;
    }
  }]);

  return SuggestionList;
})();

exports['default'] = SuggestionList;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hc3VhcmV6L0Rvd25sb2Fkcy9oeXBlcmNsaWNrL2xpYi9TdWdnZXN0aW9uTGlzdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7c0JBYXNCLFFBQVE7Ozs7QUFiOUIsV0FBVyxDQUFDOztJQWVTLGNBQWM7V0FBZCxjQUFjOzBCQUFkLGNBQWM7OztlQUFkLGNBQWM7O1dBTTdCLGNBQUMsVUFBMkIsRUFBRSxVQUFnQyxFQUFRO0FBQ3hFLFVBQUksQ0FBQyxVQUFVLElBQUksQ0FBQyxVQUFVLEVBQUU7QUFDOUIsZUFBTztPQUNSOztBQUVELFVBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDO0FBQzlCLFVBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDOztBQUU5QixVQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7O1VBRUwsS0FBSyxHQUFJLFVBQVUsQ0FBbkIsS0FBSzs7QUFDWiwrQkFBVSxLQUFLLENBQUMsQ0FBQzs7aUJBQ1MsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSzs7VUFBbkQsUUFBUSxRQUFmLEtBQUs7O0FBQ1osVUFBSSxDQUFDLGlCQUFpQixHQUFHLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNqRSxVQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRTtBQUMxQixZQUFJLENBQUMsa0JBQWtCLEdBQUcsVUFBVSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUU7QUFDMUUsY0FBSSxFQUFFLFNBQVM7QUFDZixjQUFJLEVBQUUsSUFBSTtTQUNYLENBQUMsQ0FBQztPQUNKO0tBQ0Y7OztXQUVHLGdCQUFHOztBQUVMLFVBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ25DLFVBQUksSUFBSSxDQUFDLGlCQUFpQixFQUFFO0FBQzFCLFlBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQztPQUNsQyxNQUFNLElBQUksSUFBSSxDQUFDLGtCQUFrQixFQUFFO0FBQ2xDLFlBQUksQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQztPQUNuQztBQUNELFVBQUksQ0FBQyxpQkFBaUIsR0FBRyxTQUFTLENBQUM7QUFDbkMsVUFBSSxDQUFDLGtCQUFrQixHQUFHLFNBQVMsQ0FBQztLQUNyQzs7O1dBRVkseUJBQWdCO0FBQzNCLGFBQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztLQUN6Qjs7O1dBRVkseUJBQTBCO0FBQ3JDLGFBQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztLQUN6Qjs7O1NBOUNrQixjQUFjOzs7cUJBQWQsY0FBYyIsImZpbGUiOiIvVXNlcnMvYXN1YXJlei9Eb3dubG9hZHMvaHlwZXJjbGljay9saWIvU3VnZ2VzdGlvbkxpc3QuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG5pbXBvcnQgdHlwZSB7SHlwZXJjbGlja1N1Z2dlc3Rpb259IGZyb20gJy4vdHlwZXMnO1xuXG5pbXBvcnQgaW52YXJpYW50IGZyb20gJ2Fzc2VydCc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFN1Z2dlc3Rpb25MaXN0IHtcbiAgX3RleHRFZGl0b3I6IGF0b20kVGV4dEVkaXRvcjtcbiAgX3N1Z2dlc3Rpb246IEh5cGVyY2xpY2tTdWdnZXN0aW9uO1xuICBfc3VnZ2VzdGlvbk1hcmtlcjogP2F0b20kTWFya2VyO1xuICBfb3ZlcmxheURlY29yYXRpb246ID9hdG9tJERlY29yYXRpb247XG5cbiAgc2hvdyh0ZXh0RWRpdG9yOiBhdG9tJFRleHRFZGl0b3IsIHN1Z2dlc3Rpb246IEh5cGVyY2xpY2tTdWdnZXN0aW9uKTogdm9pZCB7XG4gICAgaWYgKCF0ZXh0RWRpdG9yIHx8ICFzdWdnZXN0aW9uKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fdGV4dEVkaXRvciA9IHRleHRFZGl0b3I7XG4gICAgdGhpcy5fc3VnZ2VzdGlvbiA9IHN1Z2dlc3Rpb247XG5cbiAgICB0aGlzLmhpZGUoKTtcblxuICAgIGNvbnN0IHtyYW5nZX0gPSBzdWdnZXN0aW9uO1xuICAgIGludmFyaWFudChyYW5nZSk7XG4gICAgY29uc3Qge3N0YXJ0OiBwb3NpdGlvbn0gPSBBcnJheS5pc0FycmF5KHJhbmdlKSA/IHJhbmdlWzBdIDogcmFuZ2U7XG4gICAgdGhpcy5fc3VnZ2VzdGlvbk1hcmtlciA9IHRleHRFZGl0b3IubWFya0J1ZmZlclBvc2l0aW9uKHBvc2l0aW9uKTtcbiAgICBpZiAodGhpcy5fc3VnZ2VzdGlvbk1hcmtlcikge1xuICAgICAgdGhpcy5fb3ZlcmxheURlY29yYXRpb24gPSB0ZXh0RWRpdG9yLmRlY29yYXRlTWFya2VyKHRoaXMuX3N1Z2dlc3Rpb25NYXJrZXIsIHtcbiAgICAgICAgdHlwZTogJ292ZXJsYXknLFxuICAgICAgICBpdGVtOiB0aGlzLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgaGlkZSgpIHtcbiAgICAvLyAkRmxvd0ZpeE1lIG1ldGhvZCBvdmVycmlkZSBub3Qgd29ya2luZyB3aXRoIGB0aGlzYC5cbiAgICBhdG9tLnZpZXdzLmdldFZpZXcodGhpcykuZGlzcG9zZSgpO1xuICAgIGlmICh0aGlzLl9zdWdnZXN0aW9uTWFya2VyKSB7XG4gICAgICB0aGlzLl9zdWdnZXN0aW9uTWFya2VyLmRlc3Ryb3koKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuX292ZXJsYXlEZWNvcmF0aW9uKSB7XG4gICAgICB0aGlzLl9vdmVybGF5RGVjb3JhdGlvbi5kZXN0cm95KCk7XG4gICAgfVxuICAgIHRoaXMuX3N1Z2dlc3Rpb25NYXJrZXIgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fb3ZlcmxheURlY29yYXRpb24gPSB1bmRlZmluZWQ7XG4gIH1cblxuICBnZXRUZXh0RWRpdG9yKCk6ID9UZXh0RWRpdG9yIHtcbiAgICByZXR1cm4gdGhpcy5fdGV4dEVkaXRvcjtcbiAgfVxuXG4gIGdldFN1Z2dlc3Rpb24oKTogP0h5cGVyY2xpY2tTdWdnZXN0aW9uIHtcbiAgICByZXR1cm4gdGhpcy5fc3VnZ2VzdGlvbjtcbiAgfVxufVxuIl19