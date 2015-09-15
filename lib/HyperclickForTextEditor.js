var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

'use babel';

var getWordTextAndRange = require('./get-word-text-and-range');

/**
 * Construct this object to enable Hyperclick in a text editor.
 * Call `dispose` to disable the feature.
 */

var HyperclickForTextEditor = (function () {
  function HyperclickForTextEditor(textEditor, hyperclick) {
    var _this = this;

    _classCallCheck(this, HyperclickForTextEditor);

    this._textEditor = textEditor;
    this._textEditorView = atom.views.getView(textEditor);

    this._hyperclick = hyperclick;

    this._lastMouseEvent = null;
    this._lastPosition = null;
    // We store the original promise that we use to retrieve the last suggestion
    // so callers can also await it to know when it's available.
    this._lastSuggestionAtMousePromise = null;
    // We store the last suggestion since we must await it immediately anyway.
    this._lastSuggestionAtMouse = null;
    this._navigationMarkers = null;

    this._lastWordRange = null;

    this._onMouseMove = this._onMouseMove.bind(this);
    this._textEditorView.addEventListener('mousemove', this._onMouseMove);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._textEditorView.addEventListener('mousedown', this._onMouseDown);

    this._onKeyDown = this._onKeyDown.bind(this);
    this._textEditorView.addEventListener('keydown', this._onKeyDown);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._textEditorView.addEventListener('keyup', this._onKeyUp);

    this._commandSubscription = atom.commands.add(this._textEditorView, {
      'hyperclick:confirm-cursor': function hyperclickConfirmCursor() {
        return _this._confirmSuggestionAtCursor();
      }
    });

    this._isDestroyed = false;
    this._hyperclickLoading = false;
  }

  _createClass(HyperclickForTextEditor, [{
    key: '_confirmSuggestion',
    value: function _confirmSuggestion(suggestion) {
      if (Array.isArray(suggestion.callback) && suggestion.callback.length > 0) {
        this._hyperclick.showSuggestionList(this._textEditor, suggestion);
      } else {
        suggestion.callback();
      }
    }
  }, {
    key: '_onMouseMove',
    value: function _onMouseMove(event) {
      if (this._hyperclickLoading) {
        // Show the loading cursor.
        this._textEditorView.classList.add('hyperclick-loading');
      }

      // We save the last `MouseEvent` so the user can trigger Hyperclick by
      // pressing the key without moving the mouse again. We only save the
      // relevant properties to prevent retaining a reference to the event.
      this._lastMouseEvent = {
        clientX: event.clientX,
        clientY: event.clientY
      };

      // Don't fetch suggestions if the mouse is still in the same 'word', where
      // 'word' is a whitespace-delimited group of characters.
      //
      // If the last suggestion had multiple ranges, we have no choice but to
      // fetch suggestions because the new word might be between those ranges.
      // This should be ok because it will reuse that last suggestion until the
      // mouse moves off of it.
      var lastSuggestionIsNotMultiRange = !this._lastSuggestionAtMouse || !Array.isArray(this._lastSuggestionAtMouse.range);
      if (this._isMouseAtLastWordRange() && lastSuggestionIsNotMultiRange) {
        return;
      }

      var _getWordTextAndRange = getWordTextAndRange(this._textEditor, this._getMousePositionAsBufferPosition());

      var range = _getWordTextAndRange.range;

      this._lastWordRange = range;

      if (this._isHyperclickEvent(event)) {
        // Clear the suggestion if the mouse moved out of the range.
        if (!this._isMouseAtLastSuggestion()) {
          this._clearSuggestion();
        }
        this._setSuggestionForLastMouseEvent();
      } else {
        this._clearSuggestion();
      }
    }
  }, {
    key: '_onMouseDown',
    value: function _onMouseDown(event) {
      if (!this._isHyperclickEvent(event)) {
        return;
      }

      if (this._lastSuggestionAtMouse) {
        this._confirmSuggestion(this._lastSuggestionAtMouse);
      }

      this._clearSuggestion();
      // Prevent the <meta-click> event from adding another cursor.
      event.stopPropagation();
    }
  }, {
    key: '_onKeyDown',
    value: function _onKeyDown(event) {
      // Show the suggestion at the last known mouse position.
      if (this._isHyperclickEvent(event)) {
        this._setSuggestionForLastMouseEvent();
      }
    }
  }, {
    key: '_onKeyUp',
    value: function _onKeyUp(event) {
      if (!this._isHyperclickEvent(event)) {
        this._clearSuggestion();
      }
    }

    /**
     * Returns a `Promise` that's resolved when the latest suggestion's available.
     */
  }, {
    key: 'getSuggestionAtMouse',
    value: function getSuggestionAtMouse() {
      return this._lastSuggestionAtMousePromise || Promise.resolve(null);
    }
  }, {
    key: '_setSuggestionForLastMouseEvent',
    value: _asyncToGenerator(function* () {
      if (!this._lastMouseEvent) {
        return;
      }

      var position = this._getMousePositionAsBufferPosition();

      if (this._lastSuggestionAtMouse) {
        var range = this._lastSuggestionAtMouse.range;

        if (this._isPositionInRange(position, range)) {
          return;
        }
      }
      // this._lastSuggestionAtMouse will only be set if hyperclick returned a promise that
      // resolved to a non-null value. So, in order to not ask hyperclick for the same thing
      // again and again which will be anyway null, we check if the mouse position has changed.
      if (this._lastPosition && position.compare(this._lastPosition) === 0) {
        return;
      }

      this._hyperclickLoading = true;

      this._lastPosition = position;
      this._lastSuggestionAtMousePromise = this._hyperclick.getSuggestion(this._textEditor, position);
      this._lastSuggestionAtMouse = yield this._lastSuggestionAtMousePromise;
      if (this._isDestroyed) {
        return;
      }
      if (this._lastSuggestionAtMouse && this._isMouseAtLastSuggestion()) {
        // Add the hyperclick markers if there's a new suggestion and it's under the mouse.
        this._updateNavigationMarkers(this._lastSuggestionAtMouse.range, /* loading */false);
      } else {
        // Remove all the markers if we've finished loading and there's no suggestion.
        this._updateNavigationMarkers(null);
      }

      this._hyperclickLoading = false;
      this._textEditorView.classList.remove('hyperclick-loading');
    })
  }, {
    key: '_getMousePositionAsBufferPosition',
    value: function _getMousePositionAsBufferPosition() {
      var screenPosition = this._textEditorView.component.screenPositionForMouseEvent(this._lastMouseEvent);
      return this._textEditor.bufferPositionForScreenPosition(screenPosition);
    }
  }, {
    key: '_isMouseAtLastSuggestion',
    value: function _isMouseAtLastSuggestion() {
      if (!this._lastSuggestionAtMouse) {
        return false;
      }
      return this._isPositionInRange(this._getMousePositionAsBufferPosition(), this._lastSuggestionAtMouse.range);
    }
  }, {
    key: '_isMouseAtLastWordRange',
    value: function _isMouseAtLastWordRange() {
      if (!this._lastWordRange) {
        return false;
      }
      return this._isPositionInRange(this._getMousePositionAsBufferPosition(), this._lastWordRange);
    }
  }, {
    key: '_isPositionInRange',
    value: function _isPositionInRange(position, range) {
      return Array.isArray(range) ? range.some(function (r) {
        return r.containsPoint(position);
      }) : range.containsPoint(position);
    }
  }, {
    key: '_clearSuggestion',
    value: function _clearSuggestion() {
      this._hyperclickLoading = false;
      this._textEditorView.classList.remove('hyperclick-loading');
      this._lastSuggestionAtMousePromise = null;
      this._lastSuggestionAtMouse = null;
      this._updateNavigationMarkers(null);
    }
  }, {
    key: '_confirmSuggestionAtCursor',
    value: _asyncToGenerator(function* () {
      var suggestion = yield this._hyperclick.getSuggestion(this._textEditor, this._textEditor.getCursorBufferPosition());
      if (suggestion) {
        this._confirmSuggestion(suggestion);
      }
    })

    /**
     * Add markers for the given range(s), or clears them if `ranges` is null.
     */
  }, {
    key: '_updateNavigationMarkers',
    value: function _updateNavigationMarkers(range, loading) {
      var _this2 = this;

      if (this._navigationMarkers) {
        this._navigationMarkers.forEach(function (marker) {
          return marker.destroy();
        });
        this._navigationMarkers = null;
      }

      // Only change the cursor to a pointer if there is a suggestion ready.
      if (range && !loading) {
        this._textEditorView.classList.add('hyperclick');
      } else {
        this._textEditorView.classList.remove('hyperclick');
      }

      if (range) {
        var ranges = Array.isArray(range) ? range : [range];
        this._navigationMarkers = ranges.map(function (markerRange) {
          var marker = _this2._textEditor.markBufferRange(markerRange, { invalidate: 'never' });
          _this2._textEditor.decorateMarker(marker, { type: 'highlight', 'class': 'hyperclick' });
          return marker;
        });
      }
    }

    /**
     * Returns whether an event should be handled by hyperclick or not.
     */
  }, {
    key: '_isHyperclickEvent',
    value: function _isHyperclickEvent(event) {
      // If the user is pressing either the meta key or the alt key.
      return process.platform === 'darwin' ? event.metaKey : event.ctrlKey;
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this._isDestroyed = true;
      this._clearSuggestion();
      this._textEditorView.removeEventListener('mousemove', this._onMouseMove);
      this._textEditorView.removeEventListener('mousedown', this._onMouseDown);
      this._textEditorView.removeEventListener('keydown', this._onKeyDown);
      this._textEditorView.removeEventListener('keyup', this._onKeyUp);
      this._commandSubscription.dispose();
    }
  }]);

  return HyperclickForTextEditor;
})();

module.exports = HyperclickForTextEditor;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy93MS9fMm1jNm0wNTBxbjIzMm5wc2Y5ejNoZnNoNThfamgvVC90bXBpMzV6akdwdWJsaXNoX3BhY2thZ2VzL2FwbS9oeXBlcmNsaWNrL2xpYi9IeXBlcmNsaWNrRm9yVGV4dEVkaXRvci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUFBLFdBQVcsQ0FBQzs7QUFhWixJQUFJLG1CQUFtQixHQUFHLE9BQU8sQ0FBQywyQkFBMkIsQ0FBQyxDQUFDOzs7Ozs7O0lBTXpELHVCQUF1QjtBQWtCaEIsV0FsQlAsdUJBQXVCLENBa0JmLFVBQXNCLEVBQUUsVUFBc0IsRUFBRTs7OzBCQWxCeEQsdUJBQXVCOztBQW1CekIsUUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7QUFDOUIsUUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQzs7QUFFdEQsUUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7O0FBRTlCLFFBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDO0FBQzVCLFFBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDOzs7QUFHMUIsUUFBSSxDQUFDLDZCQUE2QixHQUFHLElBQUksQ0FBQzs7QUFFMUMsUUFBSSxDQUFDLHNCQUFzQixHQUFHLElBQUksQ0FBQztBQUNuQyxRQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDOztBQUUvQixRQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQzs7QUFFM0IsUUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNqRCxRQUFJLENBQUMsZUFBZSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDdEUsUUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLElB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ZSxDQUFDLG1CQUFtQixDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDekUsVUFBSSxDQUFDLGVBQWUsQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ3JFLFVBQUksQ0FBQyxlQUFlLENBQUMsbUJBQW1CLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNqRSxVQUFJLENBQUMsb0JBQW9CLENBQUMsT0FBTyxFQUFFLENBQUM7S0FDckM7OztTQXJRRyx1QkFBdUI7OztBQXdRN0IsTUFBTSxDQUFDLE9BQU8sR0FBRyx1QkFBdUIsQ0FBQyIsImZpbGUiOiIvdmFyL2ZvbGRlcnMvdzEvXzJtYzZtMDUwcW4yMzJucHNmOXozaGZzaDU4X2poL1QvdG1waTM1empHcHVibGlzaF9wYWNrYWdlcy9hcG0vaHlwZXJjbGljay9saWIvSHlwZXJjbGlja0ZvclRleHRFZGl0b3IuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG5pbXBvcnQgdHlwZSBIeXBlcmNsaWNrIGZyb20gJy4vSHlwZXJjbGljayc7XG5cbnZhciBnZXRXb3JkVGV4dEFuZFJhbmdlID0gcmVxdWlyZSgnLi9nZXQtd29yZC10ZXh0LWFuZC1yYW5nZScpO1xuXG4vKipcbiAqIENvbnN0cnVjdCB0aGlzIG9iamVjdCB0byBlbmFibGUgSHlwZXJjbGljayBpbiBhIHRleHQgZWRpdG9yLlxuICogQ2FsbCBgZGlzcG9zZWAgdG8gZGlzYWJsZSB0aGUgZmVhdHVyZS5cbiAqL1xuY2xhc3MgSHlwZXJjbGlja0ZvclRleHRFZGl0b3Ige1xuICBfdGV4dEVkaXRvcjogVGV4dEVkaXRvcjtcbiAgX3RleHRFZGl0b3JWaWV3OiBIVE1MRWxlbWVudDtcbiAgX2h5cGVyY2xpY2s6IEh5cGVyY2xpY2s7XG4gIF9sYXN0TW91c2VFdmVudDogP1N5bnRoZXRpY01vdXNlRXZlbnQ7XG4gIF9sYXN0UG9zaXRpb246ID9hdG9tJFBvaW50O1xuICBfbGFzdFN1Z2dlc3Rpb25BdE1vdXNlUHJvbWlzZTogP1Byb21pc2U8SHlwZXJjbGlja1N1Z2dlc3Rpb24+O1xuICBfbGFzdFN1Z2dlc3Rpb25BdE1vdXNlOiA/SHlwZXJjbGlja1N1Z2dlc3Rpb247XG4gIF9uYXZpZ2F0aW9uTWFya2VyczogP0FycmF5PGF0b20kTWFya2VyPjtcbiAgX2xhc3RXb3JkUmFuZ2U6ID9hdG9tJFJhbmdlO1xuICBfb25Nb3VzZU1vdmU6IChldmVudDogU3ludGhldGljTW91c2VFdmVudCkgPT4gdm9pZDtcbiAgX29uTW91c2VEb3duOiAoZXZlbnQ6IFN5bnRoZXRpY01vdXNlRXZlbnQpID0+IHZvaWQ7XG4gIF9vbktleURvd246IChldmVudDogU3ludGhldGljS2V5Ym9hcmRFdmVudCkgPT4gdm9pZDtcbiAgX29uS2V5VXA6IChldmVudDogU3ludGhldGljS2V5Ym9hcmRFdmVudCkgPT4gdm9pZDtcbiAgX2NvbW1hbmRTdWJzY3JpcHRpb246IGF0b20kRGlzcG9zYWJsZTtcbiAgX2lzRGVzdHJveWVkOiBib29sZWFuO1xuICBfaHlwZXJjbGlja0xvYWRpbmc6IGJvb2xlYW47XG5cbiAgY29uc3RydWN0b3IodGV4dEVkaXRvcjogVGV4dEVkaXRvciwgaHlwZXJjbGljazogSHlwZXJjbGljaykge1xuICAgIHRoaXMuX3RleHRFZGl0b3IgPSB0ZXh0RWRpdG9yO1xuICAgIHRoaXMuX3RleHRFZGl0b3JWaWV3ID0gYXRvbS52aWV3cy5nZXRWaWV3KHRleHRFZGl0b3IpO1xuXG4gICAgdGhpcy5faHlwZXJjbGljayA9IGh5cGVyY2xpY2s7XG5cbiAgICB0aGlzLl9sYXN0TW91c2VFdmVudCA9IG51bGw7XG4gICAgdGhpcy5fbGFzdFBvc2l0aW9uID0gbnVsbDtcbiAgICAvLyBXZSBzdG9yZSB0aGUgb3JpZ2luYWwgcHJvbWlzZSB0aGF0IHdlIHVzZSB0byByZXRyaWV2ZSB0aGUgbGFzdCBzdWdnZXN0aW9uXG4gICAgLy8gc28gY2FsbGVycyBjYW4gYWxzbyBhd2FpdCBpdCB0byBrbm93IHdoZW4gaXQncyBhdmFpbGFibGUuXG4gICAgdGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlUHJvbWlzZSA9IG51bGw7XG4gICAgLy8gV2Ugc3RvcmUgdGhlIGxhc3Qgc3VnZ2VzdGlvbiBzaW5jZSB3ZSBtdXN0IGF3YWl0IGl0IGltbWVkaWF0ZWx5IGFueXdheS5cbiAgICB0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2UgPSBudWxsO1xuICAgIHRoaXMuX25hdmlnYXRpb25NYXJrZXJzID0gbnVsbDtcblxuICAgIHRoaXMuX2xhc3RXb3JkUmFuZ2UgPSBudWxsO1xuXG4gICAgdGhpcy5fb25Nb3VzZU1vdmUgPSB0aGlzLl9vbk1vdXNlTW92ZS5iaW5kKHRoaXMpO1xuICAgIHRoaXMuX3RleHRFZGl0b3JWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMuX29uTW91c2VNb3ZlKTtcbiAgICB0aGlzLl9vbk1vdXNlRG93biA9IHRoaXMuX29uTW91c2VEb3duLmJpbmQodGhpcyk7XG4gICAgdGhpcy5fdGV4dEVkaXRvclZpZXcuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fb25Nb3VzZURvd24pO1xuXG4gICAgdGhpcy5fb25LZXlEb3duID0gdGhpcy5fb25LZXlEb3duLmJpbmQodGhpcyk7XG4gICAgdGhpcy5fdGV4dEVkaXRvclZpZXcuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuX29uS2V5RG93bik7XG4gICAgdGhpcy5fb25LZXlVcCA9IHRoaXMuX29uS2V5VXAuYmluZCh0aGlzKTtcbiAgICB0aGlzLl90ZXh0RWRpdG9yVmlldy5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIHRoaXMuX29uS2V5VXApO1xuXG4gICAgdGhpcy5fY29tbWFuZFN1YnNjcmlwdGlvbiA9IGF0b20uY29tbWFuZHMuYWRkKHRoaXMuX3RleHRFZGl0b3JWaWV3LCB7XG4gICAgICAnaHlwZXJjbGljazpjb25maXJtLWN1cnNvcic6ICgpID0+IHRoaXMuX2NvbmZpcm1TdWdnZXN0aW9uQXRDdXJzb3IoKSxcbiAgICB9KTtcblxuICAgIHRoaXMuX2lzRGVzdHJveWVkID0gZmFsc2U7XG4gICAgdGhpcy5faHlwZXJjbGlja0xvYWRpbmcgPSBmYWxzZTtcbiAgfVxuXG4gIF9jb25maXJtU3VnZ2VzdGlvbihzdWdnZXN0aW9uOiBIeXBlcmNsaWNrU3VnZ2VzdGlvbik6IHZvaWQge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHN1Z2dlc3Rpb24uY2FsbGJhY2spICYmIHN1Z2dlc3Rpb24uY2FsbGJhY2subGVuZ3RoID4gMCkge1xuICAgICAgdGhpcy5faHlwZXJjbGljay5zaG93U3VnZ2VzdGlvbkxpc3QodGhpcy5fdGV4dEVkaXRvciwgc3VnZ2VzdGlvbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN1Z2dlc3Rpb24uY2FsbGJhY2soKTtcbiAgICB9XG4gIH1cblxuICBfb25Nb3VzZU1vdmUoZXZlbnQ6IFN5bnRoZXRpY01vdXNlRXZlbnQpOiA/UHJvbWlzZSB7XG4gICAgaWYgKHRoaXMuX2h5cGVyY2xpY2tMb2FkaW5nKSB7XG4gICAgICAvLyBTaG93IHRoZSBsb2FkaW5nIGN1cnNvci5cbiAgICAgIHRoaXMuX3RleHRFZGl0b3JWaWV3LmNsYXNzTGlzdC5hZGQoJ2h5cGVyY2xpY2stbG9hZGluZycpO1xuICAgIH1cblxuICAgIC8vIFdlIHNhdmUgdGhlIGxhc3QgYE1vdXNlRXZlbnRgIHNvIHRoZSB1c2VyIGNhbiB0cmlnZ2VyIEh5cGVyY2xpY2sgYnlcbiAgICAvLyBwcmVzc2luZyB0aGUga2V5IHdpdGhvdXQgbW92aW5nIHRoZSBtb3VzZSBhZ2Fpbi4gV2Ugb25seSBzYXZlIHRoZVxuICAgIC8vIHJlbGV2YW50IHByb3BlcnRpZXMgdG8gcHJldmVudCByZXRhaW5pbmcgYSByZWZlcmVuY2UgdG8gdGhlIGV2ZW50LlxuICAgIHRoaXMuX2xhc3RNb3VzZUV2ZW50ID0ge1xuICAgICAgY2xpZW50WDogZXZlbnQuY2xpZW50WCxcbiAgICAgIGNsaWVudFk6IGV2ZW50LmNsaWVudFksXG4gICAgfTtcblxuICAgIC8vIERvbid0IGZldGNoIHN1Z2dlc3Rpb25zIGlmIHRoZSBtb3VzZSBpcyBzdGlsbCBpbiB0aGUgc2FtZSAnd29yZCcsIHdoZXJlXG4gICAgLy8gJ3dvcmQnIGlzIGEgd2hpdGVzcGFjZS1kZWxpbWl0ZWQgZ3JvdXAgb2YgY2hhcmFjdGVycy5cbiAgICAvL1xuICAgIC8vIElmIHRoZSBsYXN0IHN1Z2dlc3Rpb24gaGFkIG11bHRpcGxlIHJhbmdlcywgd2UgaGF2ZSBubyBjaG9pY2UgYnV0IHRvXG4gICAgLy8gZmV0Y2ggc3VnZ2VzdGlvbnMgYmVjYXVzZSB0aGUgbmV3IHdvcmQgbWlnaHQgYmUgYmV0d2VlbiB0aG9zZSByYW5nZXMuXG4gICAgLy8gVGhpcyBzaG91bGQgYmUgb2sgYmVjYXVzZSBpdCB3aWxsIHJldXNlIHRoYXQgbGFzdCBzdWdnZXN0aW9uIHVudGlsIHRoZVxuICAgIC8vIG1vdXNlIG1vdmVzIG9mZiBvZiBpdC5cbiAgICB2YXIgbGFzdFN1Z2dlc3Rpb25Jc05vdE11bHRpUmFuZ2UgPSAhdGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlIHx8XG4gICAgICAgICFBcnJheS5pc0FycmF5KHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZS5yYW5nZSk7XG4gICAgaWYgKHRoaXMuX2lzTW91c2VBdExhc3RXb3JkUmFuZ2UoKSAmJiBsYXN0U3VnZ2VzdGlvbklzTm90TXVsdGlSYW5nZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIge3JhbmdlfSA9IGdldFdvcmRUZXh0QW5kUmFuZ2UodGhpcy5fdGV4dEVkaXRvciwgdGhpcy5fZ2V0TW91c2VQb3NpdGlvbkFzQnVmZmVyUG9zaXRpb24oKSk7XG4gICAgdGhpcy5fbGFzdFdvcmRSYW5nZSA9IHJhbmdlO1xuXG4gICAgaWYgKHRoaXMuX2lzSHlwZXJjbGlja0V2ZW50KGV2ZW50KSkge1xuICAgICAgLy8gQ2xlYXIgdGhlIHN1Z2dlc3Rpb24gaWYgdGhlIG1vdXNlIG1vdmVkIG91dCBvZiB0aGUgcmFuZ2UuXG4gICAgICBpZiAoIXRoaXMuX2lzTW91c2VBdExhc3RTdWdnZXN0aW9uKCkpIHtcbiAgICAgICAgdGhpcy5fY2xlYXJTdWdnZXN0aW9uKCk7XG4gICAgICB9XG4gICAgICB0aGlzLl9zZXRTdWdnZXN0aW9uRm9yTGFzdE1vdXNlRXZlbnQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fY2xlYXJTdWdnZXN0aW9uKCk7XG4gICAgfVxuICB9XG5cbiAgX29uTW91c2VEb3duKGV2ZW50OiBTeW50aGV0aWNNb3VzZUV2ZW50KTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLl9pc0h5cGVyY2xpY2tFdmVudChldmVudCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlKSB7XG4gICAgICB0aGlzLl9jb25maXJtU3VnZ2VzdGlvbih0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2UpO1xuICAgIH1cblxuICAgIHRoaXMuX2NsZWFyU3VnZ2VzdGlvbigpO1xuICAgIC8vIFByZXZlbnQgdGhlIDxtZXRhLWNsaWNrPiBldmVudCBmcm9tIGFkZGluZyBhbm90aGVyIGN1cnNvci5cbiAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgfVxuXG4gIF9vbktleURvd24oZXZlbnQ6IFN5bnRoZXRpY0tleWJvYXJkRXZlbnQpOiB2b2lkIHtcbiAgICAvLyBTaG93IHRoZSBzdWdnZXN0aW9uIGF0IHRoZSBsYXN0IGtub3duIG1vdXNlIHBvc2l0aW9uLlxuICAgIGlmICh0aGlzLl9pc0h5cGVyY2xpY2tFdmVudChldmVudCkpIHtcbiAgICAgIHRoaXMuX3NldFN1Z2dlc3Rpb25Gb3JMYXN0TW91c2VFdmVudCgpO1xuICAgIH1cbiAgfVxuXG4gIF9vbktleVVwKGV2ZW50OiBTeW50aGV0aWNLZXlib2FyZEV2ZW50KTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLl9pc0h5cGVyY2xpY2tFdmVudChldmVudCkpIHtcbiAgICAgIHRoaXMuX2NsZWFyU3VnZ2VzdGlvbigpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgYFByb21pc2VgIHRoYXQncyByZXNvbHZlZCB3aGVuIHRoZSBsYXRlc3Qgc3VnZ2VzdGlvbidzIGF2YWlsYWJsZS5cbiAgICovXG4gIGdldFN1Z2dlc3Rpb25BdE1vdXNlKCk6IFByb21pc2U8P0h5cGVyY2xpY2tTdWdnZXN0aW9uPiB7XG4gICAgcmV0dXJuIHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZVByb21pc2UgfHwgUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuICB9XG5cbiAgYXN5bmMgX3NldFN1Z2dlc3Rpb25Gb3JMYXN0TW91c2VFdmVudCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIXRoaXMuX2xhc3RNb3VzZUV2ZW50KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIHBvc2l0aW9uID0gdGhpcy5fZ2V0TW91c2VQb3NpdGlvbkFzQnVmZmVyUG9zaXRpb24oKTtcblxuICAgIGlmICh0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2UpIHtcbiAgICAgIHZhciB7cmFuZ2V9ID0gdGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlO1xuICAgICAgaWYgKHRoaXMuX2lzUG9zaXRpb25JblJhbmdlKHBvc2l0aW9uLCByYW5nZSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyB0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2Ugd2lsbCBvbmx5IGJlIHNldCBpZiBoeXBlcmNsaWNrIHJldHVybmVkIGEgcHJvbWlzZSB0aGF0XG4gICAgLy8gcmVzb2x2ZWQgdG8gYSBub24tbnVsbCB2YWx1ZS4gU28sIGluIG9yZGVyIHRvIG5vdCBhc2sgaHlwZXJjbGljayBmb3IgdGhlIHNhbWUgdGhpbmdcbiAgICAvLyBhZ2FpbiBhbmQgYWdhaW4gd2hpY2ggd2lsbCBiZSBhbnl3YXkgbnVsbCwgd2UgY2hlY2sgaWYgdGhlIG1vdXNlIHBvc2l0aW9uIGhhcyBjaGFuZ2VkLlxuICAgIGlmICh0aGlzLl9sYXN0UG9zaXRpb24gJiYgcG9zaXRpb24uY29tcGFyZSh0aGlzLl9sYXN0UG9zaXRpb24pID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5faHlwZXJjbGlja0xvYWRpbmcgPSB0cnVlO1xuXG4gICAgdGhpcy5fbGFzdFBvc2l0aW9uID0gcG9zaXRpb247XG4gICAgdGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlUHJvbWlzZSA9IHRoaXMuX2h5cGVyY2xpY2suZ2V0U3VnZ2VzdGlvbih0aGlzLl90ZXh0RWRpdG9yLCBwb3NpdGlvbik7XG4gICAgdGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlID0gYXdhaXQgdGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlUHJvbWlzZTtcbiAgICBpZiAodGhpcy5faXNEZXN0cm95ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZSAmJiB0aGlzLl9pc01vdXNlQXRMYXN0U3VnZ2VzdGlvbigpKSB7XG4gICAgICAvLyBBZGQgdGhlIGh5cGVyY2xpY2sgbWFya2VycyBpZiB0aGVyZSdzIGEgbmV3IHN1Z2dlc3Rpb24gYW5kIGl0J3MgdW5kZXIgdGhlIG1vdXNlLlxuICAgICAgdGhpcy5fdXBkYXRlTmF2aWdhdGlvbk1hcmtlcnModGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlLnJhbmdlLCAvKiBsb2FkaW5nICovIGZhbHNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gUmVtb3ZlIGFsbCB0aGUgbWFya2VycyBpZiB3ZSd2ZSBmaW5pc2hlZCBsb2FkaW5nIGFuZCB0aGVyZSdzIG5vIHN1Z2dlc3Rpb24uXG4gICAgICB0aGlzLl91cGRhdGVOYXZpZ2F0aW9uTWFya2VycyhudWxsKTtcbiAgICB9XG5cbiAgICB0aGlzLl9oeXBlcmNsaWNrTG9hZGluZyA9IGZhbHNlO1xuICAgIHRoaXMuX3RleHRFZGl0b3JWaWV3LmNsYXNzTGlzdC5yZW1vdmUoJ2h5cGVyY2xpY2stbG9hZGluZycpO1xuICB9XG5cbiAgX2dldE1vdXNlUG9zaXRpb25Bc0J1ZmZlclBvc2l0aW9uKCk6IGF0b20kUG9pbnQge1xuICAgIHZhciBzY3JlZW5Qb3NpdGlvbiA9IHRoaXMuX3RleHRFZGl0b3JWaWV3LmNvbXBvbmVudC5zY3JlZW5Qb3NpdGlvbkZvck1vdXNlRXZlbnQodGhpcy5fbGFzdE1vdXNlRXZlbnQpO1xuICAgIHJldHVybiB0aGlzLl90ZXh0RWRpdG9yLmJ1ZmZlclBvc2l0aW9uRm9yU2NyZWVuUG9zaXRpb24oc2NyZWVuUG9zaXRpb24pO1xuICB9XG5cbiAgX2lzTW91c2VBdExhc3RTdWdnZXN0aW9uKCk6IGJvb2xlYW4ge1xuICAgIGlmICghdGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9pc1Bvc2l0aW9uSW5SYW5nZSh0aGlzLl9nZXRNb3VzZVBvc2l0aW9uQXNCdWZmZXJQb3NpdGlvbigpLCB0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2UucmFuZ2UpO1xuICB9XG5cbiAgX2lzTW91c2VBdExhc3RXb3JkUmFuZ2UoKTogYm9vbGVhbiB7XG4gICAgaWYgKCF0aGlzLl9sYXN0V29yZFJhbmdlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9pc1Bvc2l0aW9uSW5SYW5nZSh0aGlzLl9nZXRNb3VzZVBvc2l0aW9uQXNCdWZmZXJQb3NpdGlvbigpLCB0aGlzLl9sYXN0V29yZFJhbmdlKTtcbiAgfVxuXG4gIF9pc1Bvc2l0aW9uSW5SYW5nZShwb3NpdGlvbjogYXRvbSRQb2ludCwgcmFuZ2U6IGF0b20kUmFuZ2UgfCBBcnJheTxhdG9tJFJhbmdlPik6IGJvb2xlYW4ge1xuICAgIHJldHVybiAoQXJyYXkuaXNBcnJheShyYW5nZSlcbiAgICAgICAgPyByYW5nZS5zb21lKHIgPT4gci5jb250YWluc1BvaW50KHBvc2l0aW9uKSlcbiAgICAgICAgOiByYW5nZS5jb250YWluc1BvaW50KHBvc2l0aW9uKSk7XG4gIH1cblxuICBfY2xlYXJTdWdnZXN0aW9uKCk6IHZvaWQge1xuICAgIHRoaXMuX2h5cGVyY2xpY2tMb2FkaW5nID0gZmFsc2U7XG4gICAgdGhpcy5fdGV4dEVkaXRvclZpZXcuY2xhc3NMaXN0LnJlbW92ZSgnaHlwZXJjbGljay1sb2FkaW5nJyk7XG4gICAgdGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlUHJvbWlzZSA9IG51bGw7XG4gICAgdGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlID0gbnVsbDtcbiAgICB0aGlzLl91cGRhdGVOYXZpZ2F0aW9uTWFya2VycyhudWxsKTtcbiAgfVxuXG4gIGFzeW5jIF9jb25maXJtU3VnZ2VzdGlvbkF0Q3Vyc29yKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHZhciBzdWdnZXN0aW9uID0gYXdhaXQgdGhpcy5faHlwZXJjbGljay5nZXRTdWdnZXN0aW9uKFxuICAgICAgICB0aGlzLl90ZXh0RWRpdG9yLFxuICAgICAgICB0aGlzLl90ZXh0RWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkpO1xuICAgIGlmIChzdWdnZXN0aW9uKSB7XG4gICAgICB0aGlzLl9jb25maXJtU3VnZ2VzdGlvbihzdWdnZXN0aW9uKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkIG1hcmtlcnMgZm9yIHRoZSBnaXZlbiByYW5nZShzKSwgb3IgY2xlYXJzIHRoZW0gaWYgYHJhbmdlc2AgaXMgbnVsbC5cbiAgICovXG4gIF91cGRhdGVOYXZpZ2F0aW9uTWFya2VycyhyYW5nZTogPyhSYW5nZSB8IEFycmF5PFJhbmdlPiksIGxvYWRpbmc/OiBib29sZWFuKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX25hdmlnYXRpb25NYXJrZXJzKSB7XG4gICAgICB0aGlzLl9uYXZpZ2F0aW9uTWFya2Vycy5mb3JFYWNoKG1hcmtlciA9PiBtYXJrZXIuZGVzdHJveSgpKTtcbiAgICAgIHRoaXMuX25hdmlnYXRpb25NYXJrZXJzID0gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBPbmx5IGNoYW5nZSB0aGUgY3Vyc29yIHRvIGEgcG9pbnRlciBpZiB0aGVyZSBpcyBhIHN1Z2dlc3Rpb24gcmVhZHkuXG4gICAgaWYgKHJhbmdlICYmICFsb2FkaW5nKSB7XG4gICAgICB0aGlzLl90ZXh0RWRpdG9yVmlldy5jbGFzc0xpc3QuYWRkKCdoeXBlcmNsaWNrJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3RleHRFZGl0b3JWaWV3LmNsYXNzTGlzdC5yZW1vdmUoJ2h5cGVyY2xpY2snKTtcbiAgICB9XG5cbiAgICBpZiAocmFuZ2UpIHtcbiAgICAgIHZhciByYW5nZXMgPSBBcnJheS5pc0FycmF5KHJhbmdlKSA/IHJhbmdlIDogW3JhbmdlXTtcbiAgICAgIHRoaXMuX25hdmlnYXRpb25NYXJrZXJzID0gcmFuZ2VzLm1hcChtYXJrZXJSYW5nZSA9PiB7XG4gICAgICAgIHZhciBtYXJrZXIgPSB0aGlzLl90ZXh0RWRpdG9yLm1hcmtCdWZmZXJSYW5nZShtYXJrZXJSYW5nZSwge2ludmFsaWRhdGU6ICduZXZlcid9KTtcbiAgICAgICAgdGhpcy5fdGV4dEVkaXRvci5kZWNvcmF0ZU1hcmtlcihcbiAgICAgICAgICAgIG1hcmtlcixcbiAgICAgICAgICAgIHt0eXBlOiAnaGlnaGxpZ2h0JywgY2xhc3M6ICdoeXBlcmNsaWNrJ30pO1xuICAgICAgICByZXR1cm4gbWFya2VyO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgd2hldGhlciBhbiBldmVudCBzaG91bGQgYmUgaGFuZGxlZCBieSBoeXBlcmNsaWNrIG9yIG5vdC5cbiAgICovXG4gIF9pc0h5cGVyY2xpY2tFdmVudChldmVudDogU3ludGhldGljS2V5Ym9hcmRFdmVudCB8IFN5bnRoZXRpY01vdXNlRXZlbnQpOiBib29sZWFuIHtcbiAgICAvLyBJZiB0aGUgdXNlciBpcyBwcmVzc2luZyBlaXRoZXIgdGhlIG1ldGEga2V5IG9yIHRoZSBhbHQga2V5LlxuICAgIHJldHVybiBwcm9jZXNzLnBsYXRmb3JtID09PSAnZGFyd2luJyA/IGV2ZW50Lm1ldGFLZXkgOiBldmVudC5jdHJsS2V5O1xuICB9XG5cbiAgZGlzcG9zZSgpIHtcbiAgICB0aGlzLl9pc0Rlc3Ryb3llZCA9IHRydWU7XG4gICAgdGhpcy5fY2xlYXJTdWdnZXN0aW9uKCk7XG4gICAgdGhpcy5fdGV4dEVkaXRvclZpZXcucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5fb25Nb3VzZU1vdmUpO1xuICAgIHRoaXMuX3RleHRFZGl0b3JWaWV3LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuX29uTW91c2VEb3duKTtcbiAgICB0aGlzLl90ZXh0RWRpdG9yVmlldy5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5fb25LZXlEb3duKTtcbiAgICB0aGlzLl90ZXh0RWRpdG9yVmlldy5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXl1cCcsIHRoaXMuX29uS2V5VXApO1xuICAgIHRoaXMuX2NvbW1hbmRTdWJzY3JpcHRpb24uZGlzcG9zZSgpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gSHlwZXJjbGlja0ZvclRleHRFZGl0b3I7XG4iXX0=
