
/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy93MS9fMm1jNm0wNTBxbjIzMm5wc2Y5ejNoZnNoNThfamgvVC90bXBpMzV6akdwdWJsaXNoX3BhY2thZ2VzL2FwbS9oeXBlcmNsaWNrL2xpYi9TdWdnZXN0aW9uTGlzdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7Ozs7O0lBV04sY0FBYztXQUFkLGNBQWM7MEJBQWQsY0FBYzs7O2VBQWQsY0FBYzs7V0FNZCxjQUFDLFVBQXNCLEVBQUUsVUFBZ0MsRUFBUTtBQUNuRSxVQUFJLENBQUMsVUFBVSxJQUFJLENBQUMsVUFBVSxFQUFFO0FBQzlCLGVBQU87T0FDUjs7QUFFRCxVQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQztBQUM5QixVQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQzs7QUFFOUIsVUFBSSxDQUFDLElBQUksRUFBRSxDQUFDOztpQkFFWSxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxLQUFLOztVQUFwRixRQUFRLFFBQWYsS0FBSzs7QUFDVixVQUFJLENBQUMsaUJBQWlCLEdBQUcsVUFBVSxDQUFDLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ2pFLFVBQUksSUFBSSxDQUFDLGlCQUFpQixFQUFFO0FBQzFCLFlBQUksQ0FBQyxrQkFBa0IsR0FBRyxVQUFVLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRTtBQUMxRSxjQUFJLEVBQUUsU0FBUztBQUNmLGNBQUksRUFBRSxJQUFJO1NBQ1gsQ0FBQyxDQUFDO09BQ0o7S0FDRjs7O1dBRUcsZ0JBQUc7QUFDTCxVQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUNuQyxVQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRTtBQUMxQixZQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxFQUFFLENBQUM7T0FDbEMsTUFBTSxJQUFJLElBQUksQ0FBQyxrQkFBa0IsRUFBRTtBQUNsQyxZQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxFQUFFLENBQUM7T0FDbkM7QUFDRCxVQUFJLENBQUMsaUJBQWlCLEdBQUcsU0FBUyxDQUFDO0FBQ25DLFVBQUksQ0FBQyxrQkFBa0IsR0FBRyxTQUFTLENBQUM7S0FDckM7OztXQUVZLHlCQUFnQjtBQUMzQixhQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7S0FDekI7OztXQUVZLHlCQUEwQjtBQUNyQyxhQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7S0FDekI7OztTQTNDRyxjQUFjOzs7QUE4Q3BCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsY0FBYyxDQUFDIiwiZmlsZSI6Ii92YXIvZm9sZGVycy93MS9fMm1jNm0wNTBxbjIzMm5wc2Y5ejNoZnNoNThfamgvVC90bXBpMzV6akdwdWJsaXNoX3BhY2thZ2VzL2FwbS9oeXBlcmNsaWNrL2xpYi9TdWdnZXN0aW9uTGlzdC5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbmNsYXNzIFN1Z2dlc3Rpb25MaXN0IHtcbiAgX3RleHRFZGl0b3I6IFRleHRFZGl0b3I7XG4gIF9zdWdnZXN0aW9uOiBIeXBlcmNsaWNrU3VnZ2VzdGlvbjtcbiAgX3N1Z2dlc3Rpb25NYXJrZXI6ID9hdG9tJE1hcmtlcjtcbiAgX292ZXJsYXlEZWNvcmF0aW9uOiA/YXRvbSREZWNvcmF0aW9uO1xuXG4gIHNob3codGV4dEVkaXRvcjogVGV4dEVkaXRvciwgc3VnZ2VzdGlvbjogSHlwZXJjbGlja1N1Z2dlc3Rpb24pOiB2b2lkIHtcbiAgICBpZiAoIXRleHRFZGl0b3IgfHwgIXN1Z2dlc3Rpb24pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl90ZXh0RWRpdG9yID0gdGV4dEVkaXRvcjtcbiAgICB0aGlzLl9zdWdnZXN0aW9uID0gc3VnZ2VzdGlvbjtcblxuICAgIHRoaXMuaGlkZSgpO1xuXG4gICAgdmFyIHtzdGFydDogcG9zaXRpb259ID0gQXJyYXkuaXNBcnJheShzdWdnZXN0aW9uLnJhbmdlKSA/IHN1Z2dlc3Rpb24ucmFuZ2VbMF0gOiBzdWdnZXN0aW9uLnJhbmdlO1xuICAgIHRoaXMuX3N1Z2dlc3Rpb25NYXJrZXIgPSB0ZXh0RWRpdG9yLm1hcmtCdWZmZXJQb3NpdGlvbihwb3NpdGlvbik7XG4gICAgaWYgKHRoaXMuX3N1Z2dlc3Rpb25NYXJrZXIpIHtcbiAgICAgIHRoaXMuX292ZXJsYXlEZWNvcmF0aW9uID0gdGV4dEVkaXRvci5kZWNvcmF0ZU1hcmtlcih0aGlzLl9zdWdnZXN0aW9uTWFya2VyLCB7XG4gICAgICAgIHR5cGU6ICdvdmVybGF5JyxcbiAgICAgICAgaXRlbTogdGhpcyxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGhpZGUoKSB7XG4gICAgYXRvbS52aWV3cy5nZXRWaWV3KHRoaXMpLmRpc3Bvc2UoKTtcbiAgICBpZiAodGhpcy5fc3VnZ2VzdGlvbk1hcmtlcikge1xuICAgICAgdGhpcy5fc3VnZ2VzdGlvbk1hcmtlci5kZXN0cm95KCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLl9vdmVybGF5RGVjb3JhdGlvbikge1xuICAgICAgdGhpcy5fb3ZlcmxheURlY29yYXRpb24uZGVzdHJveSgpO1xuICAgIH1cbiAgICB0aGlzLl9zdWdnZXN0aW9uTWFya2VyID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX292ZXJsYXlEZWNvcmF0aW9uID0gdW5kZWZpbmVkO1xuICB9XG5cbiAgZ2V0VGV4dEVkaXRvcigpOiA/VGV4dEVkaXRvciB7XG4gICAgcmV0dXJuIHRoaXMuX3RleHRFZGl0b3I7XG4gIH1cblxuICBnZXRTdWdnZXN0aW9uKCk6ID9IeXBlcmNsaWNrU3VnZ2VzdGlvbiB7XG4gICAgcmV0dXJuIHRoaXMuX3N1Z2dlc3Rpb247XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTdWdnZXN0aW9uTGlzdDtcbiJdfQ==
