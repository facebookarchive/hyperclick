var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

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

      var _ref = Array.isArray(suggestion.range) ? suggestion.range[0] : suggestion.range;

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

module.exports = SuggestionList;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9oeXBlcmNsaWNrL2xpYi9TdWdnZXN0aW9uTGlzdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSxXQUFXLENBQUM7O0lBY04sY0FBYztXQUFkLGNBQWM7MEJBQWQsY0FBYzs7O2VBQWQsY0FBYzs7V0FNZCxjQUFDLFVBQXNCLEVBQUUsVUFBZ0MsRUFBUTtBQUNuRSxVQUFJLENBQUMsVUFBVSxJQUFJLENBQUMsVUFBVSxFQUFFO0FBQzlCLGVBQU87T0FDUjs7QUFFRCxVQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQztBQUM5QixVQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQzs7QUFFOUIsVUFBSSxDQUFDLElBQUksRUFBRSxDQUFDOztpQkFFWSxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxLQUFLOztVQUFwRixRQUFRLFFBQWYsS0FBSzs7QUFDVixVQUFJLENBQUMsaUJBQWlCLEdBQUcsVUFBVSxDQUFDLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ2pFLFVBQUksSUFBSSxDQUFDLGlCQUFpQixFQUFFO0FBQzFCLFlBQUksQ0FBQyxrQkFBa0IsR0FBRyxVQUFVLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRTtBQUMxRSxjQUFJLEVBQUUsU0FBUztBQUNmLGNBQUksRUFBRSxJQUFJO1NBQ1gsQ0FBQyxDQUFDO09BQ0o7S0FDRjs7O1dBRUcsZ0JBQUc7QUFDTCxVQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUNuQyxVQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRTtBQUMxQixZQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxFQUFFLENBQUM7T0FDbEMsTUFBTSxJQUFJLElBQUksQ0FBQyxrQkFBa0IsRUFBRTtBQUNsQyxZQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxFQUFFLENBQUM7T0FDbkM7QUFDRCxVQUFJLENBQUMsaUJBQWlCLEdBQUcsU0FBUyxDQUFDO0FBQ25DLFVBQUksQ0FBQyxrQkFBa0IsR0FBRyxTQUFTLENBQUM7S0FDckM7OztXQUVZLHlCQUFnQjtBQUMzQixhQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7S0FDekI7OztXQUVZLHlCQUEwQjtBQUNyQyxhQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7S0FDekI7OztTQTNDRyxjQUFjOzs7QUE4Q3BCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsY0FBYyxDQUFDIiwiZmlsZSI6Ii92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9oeXBlcmNsaWNrL2xpYi9TdWdnZXN0aW9uTGlzdC5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5pbXBvcnQgdHlwZSB7XG4gIEh5cGVyY2xpY2tTdWdnZXN0aW9uLFxufSBmcm9tICcuL3R5cGVzJztcblxuY2xhc3MgU3VnZ2VzdGlvbkxpc3Qge1xuICBfdGV4dEVkaXRvcjogVGV4dEVkaXRvcjtcbiAgX3N1Z2dlc3Rpb246IEh5cGVyY2xpY2tTdWdnZXN0aW9uO1xuICBfc3VnZ2VzdGlvbk1hcmtlcjogP2F0b20kTWFya2VyO1xuICBfb3ZlcmxheURlY29yYXRpb246ID9hdG9tJERlY29yYXRpb247XG5cbiAgc2hvdyh0ZXh0RWRpdG9yOiBUZXh0RWRpdG9yLCBzdWdnZXN0aW9uOiBIeXBlcmNsaWNrU3VnZ2VzdGlvbik6IHZvaWQge1xuICAgIGlmICghdGV4dEVkaXRvciB8fCAhc3VnZ2VzdGlvbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX3RleHRFZGl0b3IgPSB0ZXh0RWRpdG9yO1xuICAgIHRoaXMuX3N1Z2dlc3Rpb24gPSBzdWdnZXN0aW9uO1xuXG4gICAgdGhpcy5oaWRlKCk7XG5cbiAgICB2YXIge3N0YXJ0OiBwb3NpdGlvbn0gPSBBcnJheS5pc0FycmF5KHN1Z2dlc3Rpb24ucmFuZ2UpID8gc3VnZ2VzdGlvbi5yYW5nZVswXSA6IHN1Z2dlc3Rpb24ucmFuZ2U7XG4gICAgdGhpcy5fc3VnZ2VzdGlvbk1hcmtlciA9IHRleHRFZGl0b3IubWFya0J1ZmZlclBvc2l0aW9uKHBvc2l0aW9uKTtcbiAgICBpZiAodGhpcy5fc3VnZ2VzdGlvbk1hcmtlcikge1xuICAgICAgdGhpcy5fb3ZlcmxheURlY29yYXRpb24gPSB0ZXh0RWRpdG9yLmRlY29yYXRlTWFya2VyKHRoaXMuX3N1Z2dlc3Rpb25NYXJrZXIsIHtcbiAgICAgICAgdHlwZTogJ292ZXJsYXknLFxuICAgICAgICBpdGVtOiB0aGlzLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgaGlkZSgpIHtcbiAgICBhdG9tLnZpZXdzLmdldFZpZXcodGhpcykuZGlzcG9zZSgpO1xuICAgIGlmICh0aGlzLl9zdWdnZXN0aW9uTWFya2VyKSB7XG4gICAgICB0aGlzLl9zdWdnZXN0aW9uTWFya2VyLmRlc3Ryb3koKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuX292ZXJsYXlEZWNvcmF0aW9uKSB7XG4gICAgICB0aGlzLl9vdmVybGF5RGVjb3JhdGlvbi5kZXN0cm95KCk7XG4gICAgfVxuICAgIHRoaXMuX3N1Z2dlc3Rpb25NYXJrZXIgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fb3ZlcmxheURlY29yYXRpb24gPSB1bmRlZmluZWQ7XG4gIH1cblxuICBnZXRUZXh0RWRpdG9yKCk6ID9UZXh0RWRpdG9yIHtcbiAgICByZXR1cm4gdGhpcy5fdGV4dEVkaXRvcjtcbiAgfVxuXG4gIGdldFN1Z2dlc3Rpb24oKTogP0h5cGVyY2xpY2tTdWdnZXN0aW9uIHtcbiAgICByZXR1cm4gdGhpcy5fc3VnZ2VzdGlvbjtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFN1Z2dlc3Rpb25MaXN0O1xuIl19
