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

      this._hyperclickLoading = true;

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
      return event.metaKey !== event.altKey;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy93MS9fMm1jNm0wNTBxbjIzMm5wc2Y5ejNoZnNoNThfamgvVC90bXBKbjRvcUdwdWJsaXNoX3BhY2thZ2VzL2FwbS9oeXBlcmNsaWNrL2xpYi9IeXBlcmNsaWNrRm9yVGV4dEVkaXRvci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUFBLFdBQVcsQ0FBQzs7QUFnQlosSUFBSSxtQkFBbUIsR0FBRyxPQUFPLENBQUMsMkJBQTJCLENBQUMsQ0FBQzs7Ozs7OztJQU16RCx1QkFBdUI7QUFpQmhCLFdBakJQLHVCQUF1QixDQWlCZixVQUFzQixFQUFFLFVBQXNCLEVBQUU7OzswQkFqQnhELHVCQUF1Qjs7QUFrQnpCLFFBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDO0FBQzlCLFFBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7O0FBRXRELFFBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDOztBQUU5QixRQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQzs7O0FBRzVCLFFBQUksQ0FBQyw2QkFBNkIsR0FBRyxJQUFJLENBQUM7O0FBRTFDLFFBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLENBQUM7QUFDbkMsUUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQzs7QUFFL0IsUUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7O0FBRTNCLFFBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDakQsUUFBSSxDQUFDLGVBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQ3RFLFFBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDakQsUUFBSSxD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LFVBQUksQ0FBQyxvQkFBb0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQztLQUNyQzs7O1NBNVBHLHVCQUF1Qjs7O0FBK1A3QixNQUFNLENBQUMsT0FBTyxHQUFHLHVCQUF1QixDQUFDIiwiZmlsZSI6Ii92YXIvZm9sZGVycy93MS9fMm1jNm0wNTBxbjIzMm5wc2Y5ejNoZnNoNThfamgvVC90bXBKbjRvcUdwdWJsaXNoX3BhY2thZ2VzL2FwbS9oeXBlcmNsaWNrL2xpYi9IeXBlcmNsaWNrRm9yVGV4dEVkaXRvci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5pbXBvcnQgdHlwZSB7XG4gIEh5cGVyY2xpY2tTdWdnZXN0aW9uLFxufSBmcm9tICcuL3R5cGVzJztcblxuaW1wb3J0IHR5cGUgSHlwZXJjbGljayBmcm9tICcuL0h5cGVyY2xpY2snO1xuXG52YXIgZ2V0V29yZFRleHRBbmRSYW5nZSA9IHJlcXVpcmUoJy4vZ2V0LXdvcmQtdGV4dC1hbmQtcmFuZ2UnKTtcblxuLyoqXG4gKiBDb25zdHJ1Y3QgdGhpcyBvYmplY3QgdG8gZW5hYmxlIEh5cGVyY2xpY2sgaW4gYSB0ZXh0IGVkaXRvci5cbiAqIENhbGwgYGRpc3Bvc2VgIHRvIGRpc2FibGUgdGhlIGZlYXR1cmUuXG4gKi9cbmNsYXNzIEh5cGVyY2xpY2tGb3JUZXh0RWRpdG9yIHtcbiAgX3RleHRFZGl0b3I6IFRleHRFZGl0b3I7XG4gIF90ZXh0RWRpdG9yVmlldzogSFRNTEVsZW1lbnQ7XG4gIF9oeXBlcmNsaWNrOiBIeXBlcmNsaWNrO1xuICBfbGFzdE1vdXNlRXZlbnQ6ID9TeW50aGV0aWNNb3VzZUV2ZW50O1xuICBfbGFzdFN1Z2dlc3Rpb25BdE1vdXNlUHJvbWlzZTogP1Byb21pc2U8SHlwZXJjbGlja1N1Z2dlc3Rpb24+O1xuICBfbGFzdFN1Z2dlc3Rpb25BdE1vdXNlOiA/SHlwZXJjbGlja1N1Z2dlc3Rpb247XG4gIF9uYXZpZ2F0aW9uTWFya2VyczogP0FycmF5PGF0b20kTWFya2VyPjtcbiAgX2xhc3RXb3JkUmFuZ2U6ID9hdG9tJFJhbmdlO1xuICBfb25Nb3VzZU1vdmU6IChldmVudDogU3ludGhldGljTW91c2VFdmVudCkgPT4gdm9pZDtcbiAgX29uTW91c2VEb3duOiAoZXZlbnQ6IFN5bnRoZXRpY01vdXNlRXZlbnQpID0+IHZvaWQ7XG4gIF9vbktleURvd246IChldmVudDogU3ludGhldGljS2V5Ym9hcmRFdmVudCkgPT4gdm9pZDtcbiAgX29uS2V5VXA6IChldmVudDogU3ludGhldGljS2V5Ym9hcmRFdmVudCkgPT4gdm9pZDtcbiAgX2NvbW1hbmRTdWJzY3JpcHRpb246IGF0b20kRGlzcG9zYWJsZTtcbiAgX2lzRGVzdHJveWVkOiBib29sZWFuO1xuICBfaHlwZXJjbGlja0xvYWRpbmc6IGJvb2xlYW47XG5cbiAgY29uc3RydWN0b3IodGV4dEVkaXRvcjogVGV4dEVkaXRvciwgaHlwZXJjbGljazogSHlwZXJjbGljaykge1xuICAgIHRoaXMuX3RleHRFZGl0b3IgPSB0ZXh0RWRpdG9yO1xuICAgIHRoaXMuX3RleHRFZGl0b3JWaWV3ID0gYXRvbS52aWV3cy5nZXRWaWV3KHRleHRFZGl0b3IpO1xuXG4gICAgdGhpcy5faHlwZXJjbGljayA9IGh5cGVyY2xpY2s7XG5cbiAgICB0aGlzLl9sYXN0TW91c2VFdmVudCA9IG51bGw7XG4gICAgLy8gV2Ugc3RvcmUgdGhlIG9yaWdpbmFsIHByb21pc2UgdGhhdCB3ZSB1c2UgdG8gcmV0cmlldmUgdGhlIGxhc3Qgc3VnZ2VzdGlvblxuICAgIC8vIHNvIGNhbGxlcnMgY2FuIGFsc28gYXdhaXQgaXQgdG8ga25vdyB3aGVuIGl0J3MgYXZhaWxhYmxlLlxuICAgIHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZVByb21pc2UgPSBudWxsO1xuICAgIC8vIFdlIHN0b3JlIHRoZSBsYXN0IHN1Z2dlc3Rpb24gc2luY2Ugd2UgbXVzdCBhd2FpdCBpdCBpbW1lZGlhdGVseSBhbnl3YXkuXG4gICAgdGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlID0gbnVsbDtcbiAgICB0aGlzLl9uYXZpZ2F0aW9uTWFya2VycyA9IG51bGw7XG5cbiAgICB0aGlzLl9sYXN0V29yZFJhbmdlID0gbnVsbDtcblxuICAgIHRoaXMuX29uTW91c2VNb3ZlID0gdGhpcy5fb25Nb3VzZU1vdmUuYmluZCh0aGlzKTtcbiAgICB0aGlzLl90ZXh0RWRpdG9yVmlldy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLl9vbk1vdXNlTW92ZSk7XG4gICAgdGhpcy5fb25Nb3VzZURvd24gPSB0aGlzLl9vbk1vdXNlRG93bi5iaW5kKHRoaXMpO1xuICAgIHRoaXMuX3RleHRFZGl0b3JWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuX29uTW91c2VEb3duKTtcblxuICAgIHRoaXMuX29uS2V5RG93biA9IHRoaXMuX29uS2V5RG93bi5iaW5kKHRoaXMpO1xuICAgIHRoaXMuX3RleHRFZGl0b3JWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLl9vbktleURvd24pO1xuICAgIHRoaXMuX29uS2V5VXAgPSB0aGlzLl9vbktleVVwLmJpbmQodGhpcyk7XG4gICAgdGhpcy5fdGV4dEVkaXRvclZpZXcuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLl9vbktleVVwKTtcblxuICAgIHRoaXMuX2NvbW1hbmRTdWJzY3JpcHRpb24gPSBhdG9tLmNvbW1hbmRzLmFkZCh0aGlzLl90ZXh0RWRpdG9yVmlldywge1xuICAgICAgJ2h5cGVyY2xpY2s6Y29uZmlybS1jdXJzb3InOiAoKSA9PiB0aGlzLl9jb25maXJtU3VnZ2VzdGlvbkF0Q3Vyc29yKCksXG4gICAgfSk7XG5cbiAgICB0aGlzLl9pc0Rlc3Ryb3llZCA9IGZhbHNlO1xuICAgIHRoaXMuX2h5cGVyY2xpY2tMb2FkaW5nID0gZmFsc2U7XG4gIH1cblxuICBfY29uZmlybVN1Z2dlc3Rpb24oc3VnZ2VzdGlvbjogSHlwZXJjbGlja1N1Z2dlc3Rpb24pOiB2b2lkIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShzdWdnZXN0aW9uLmNhbGxiYWNrKSAmJiBzdWdnZXN0aW9uLmNhbGxiYWNrLmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMuX2h5cGVyY2xpY2suc2hvd1N1Z2dlc3Rpb25MaXN0KHRoaXMuX3RleHRFZGl0b3IsIHN1Z2dlc3Rpb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdWdnZXN0aW9uLmNhbGxiYWNrKCk7XG4gICAgfVxuICB9XG5cbiAgX29uTW91c2VNb3ZlKGV2ZW50OiBTeW50aGV0aWNNb3VzZUV2ZW50KTogP1Byb21pc2Uge1xuICAgIGlmICh0aGlzLl9oeXBlcmNsaWNrTG9hZGluZykge1xuICAgICAgLy8gU2hvdyB0aGUgbG9hZGluZyBjdXJzb3IuXG4gICAgICB0aGlzLl90ZXh0RWRpdG9yVmlldy5jbGFzc0xpc3QuYWRkKCdoeXBlcmNsaWNrLWxvYWRpbmcnKTtcbiAgICB9XG5cbiAgICAvLyBXZSBzYXZlIHRoZSBsYXN0IGBNb3VzZUV2ZW50YCBzbyB0aGUgdXNlciBjYW4gdHJpZ2dlciBIeXBlcmNsaWNrIGJ5XG4gICAgLy8gcHJlc3NpbmcgdGhlIGtleSB3aXRob3V0IG1vdmluZyB0aGUgbW91c2UgYWdhaW4uIFdlIG9ubHkgc2F2ZSB0aGVcbiAgICAvLyByZWxldmFudCBwcm9wZXJ0aWVzIHRvIHByZXZlbnQgcmV0YWluaW5nIGEgcmVmZXJlbmNlIHRvIHRoZSBldmVudC5cbiAgICB0aGlzLl9sYXN0TW91c2VFdmVudCA9IHtcbiAgICAgIGNsaWVudFg6IGV2ZW50LmNsaWVudFgsXG4gICAgICBjbGllbnRZOiBldmVudC5jbGllbnRZLFxuICAgIH07XG5cbiAgICAvLyBEb24ndCBmZXRjaCBzdWdnZXN0aW9ucyBpZiB0aGUgbW91c2UgaXMgc3RpbGwgaW4gdGhlIHNhbWUgJ3dvcmQnLCB3aGVyZVxuICAgIC8vICd3b3JkJyBpcyBhIHdoaXRlc3BhY2UtZGVsaW1pdGVkIGdyb3VwIG9mIGNoYXJhY3RlcnMuXG4gICAgLy9cbiAgICAvLyBJZiB0aGUgbGFzdCBzdWdnZXN0aW9uIGhhZCBtdWx0aXBsZSByYW5nZXMsIHdlIGhhdmUgbm8gY2hvaWNlIGJ1dCB0b1xuICAgIC8vIGZldGNoIHN1Z2dlc3Rpb25zIGJlY2F1c2UgdGhlIG5ldyB3b3JkIG1pZ2h0IGJlIGJldHdlZW4gdGhvc2UgcmFuZ2VzLlxuICAgIC8vIFRoaXMgc2hvdWxkIGJlIG9rIGJlY2F1c2UgaXQgd2lsbCByZXVzZSB0aGF0IGxhc3Qgc3VnZ2VzdGlvbiB1bnRpbCB0aGVcbiAgICAvLyBtb3VzZSBtb3ZlcyBvZmYgb2YgaXQuXG4gICAgdmFyIGxhc3RTdWdnZXN0aW9uSXNOb3RNdWx0aVJhbmdlID0gIXRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZSB8fFxuICAgICAgICAhQXJyYXkuaXNBcnJheSh0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2UucmFuZ2UpO1xuICAgIGlmICh0aGlzLl9pc01vdXNlQXRMYXN0V29yZFJhbmdlKCkgJiYgbGFzdFN1Z2dlc3Rpb25Jc05vdE11bHRpUmFuZ2UpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHtyYW5nZX0gPSBnZXRXb3JkVGV4dEFuZFJhbmdlKHRoaXMuX3RleHRFZGl0b3IsIHRoaXMuX2dldE1vdXNlUG9zaXRpb25Bc0J1ZmZlclBvc2l0aW9uKCkpO1xuICAgIHRoaXMuX2xhc3RXb3JkUmFuZ2UgPSByYW5nZTtcblxuICAgIGlmICh0aGlzLl9pc0h5cGVyY2xpY2tFdmVudChldmVudCkpIHtcbiAgICAgIC8vIENsZWFyIHRoZSBzdWdnZXN0aW9uIGlmIHRoZSBtb3VzZSBtb3ZlZCBvdXQgb2YgdGhlIHJhbmdlLlxuICAgICAgaWYgKCF0aGlzLl9pc01vdXNlQXRMYXN0U3VnZ2VzdGlvbigpKSB7XG4gICAgICAgIHRoaXMuX2NsZWFyU3VnZ2VzdGlvbigpO1xuICAgICAgfVxuICAgICAgdGhpcy5fc2V0U3VnZ2VzdGlvbkZvckxhc3RNb3VzZUV2ZW50KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2NsZWFyU3VnZ2VzdGlvbigpO1xuICAgIH1cbiAgfVxuXG4gIF9vbk1vdXNlRG93bihldmVudDogU3ludGhldGljTW91c2VFdmVudCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5faXNIeXBlcmNsaWNrRXZlbnQoZXZlbnQpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZSkge1xuICAgICAgdGhpcy5fY29uZmlybVN1Z2dlc3Rpb24odGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlKTtcbiAgICB9XG5cbiAgICB0aGlzLl9jbGVhclN1Z2dlc3Rpb24oKTtcbiAgICAvLyBQcmV2ZW50IHRoZSA8bWV0YS1jbGljaz4gZXZlbnQgZnJvbSBhZGRpbmcgYW5vdGhlciBjdXJzb3IuXG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIH1cblxuICBfb25LZXlEb3duKGV2ZW50OiBTeW50aGV0aWNLZXlib2FyZEV2ZW50KTogdm9pZCB7XG4gICAgLy8gU2hvdyB0aGUgc3VnZ2VzdGlvbiBhdCB0aGUgbGFzdCBrbm93biBtb3VzZSBwb3NpdGlvbi5cbiAgICBpZiAodGhpcy5faXNIeXBlcmNsaWNrRXZlbnQoZXZlbnQpKSB7XG4gICAgICB0aGlzLl9zZXRTdWdnZXN0aW9uRm9yTGFzdE1vdXNlRXZlbnQoKTtcbiAgICB9XG4gIH1cblxuICBfb25LZXlVcChldmVudDogU3ludGhldGljS2V5Ym9hcmRFdmVudCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5faXNIeXBlcmNsaWNrRXZlbnQoZXZlbnQpKSB7XG4gICAgICB0aGlzLl9jbGVhclN1Z2dlc3Rpb24oKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGBQcm9taXNlYCB0aGF0J3MgcmVzb2x2ZWQgd2hlbiB0aGUgbGF0ZXN0IHN1Z2dlc3Rpb24ncyBhdmFpbGFibGUuXG4gICAqL1xuICBnZXRTdWdnZXN0aW9uQXRNb3VzZSgpOiBQcm9taXNlPD9IeXBlcmNsaWNrU3VnZ2VzdGlvbj4ge1xuICAgIHJldHVybiB0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2VQcm9taXNlIHx8IFByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgfVxuXG4gIGFzeW5jIF9zZXRTdWdnZXN0aW9uRm9yTGFzdE1vdXNlRXZlbnQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLl9sYXN0TW91c2VFdmVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBwb3NpdGlvbiA9IHRoaXMuX2dldE1vdXNlUG9zaXRpb25Bc0J1ZmZlclBvc2l0aW9uKCk7XG5cbiAgICBpZiAodGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlKSB7XG4gICAgICB2YXIge3JhbmdlfSA9IHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZTtcbiAgICAgIGlmICh0aGlzLl9pc1Bvc2l0aW9uSW5SYW5nZShwb3NpdGlvbiwgcmFuZ2UpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl9oeXBlcmNsaWNrTG9hZGluZyA9IHRydWU7XG5cbiAgICB0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2VQcm9taXNlID0gdGhpcy5faHlwZXJjbGljay5nZXRTdWdnZXN0aW9uKHRoaXMuX3RleHRFZGl0b3IsIHBvc2l0aW9uKTtcbiAgICB0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2UgPSBhd2FpdCB0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2VQcm9taXNlO1xuICAgIGlmICh0aGlzLl9pc0Rlc3Ryb3llZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlICYmIHRoaXMuX2lzTW91c2VBdExhc3RTdWdnZXN0aW9uKCkpIHtcbiAgICAgIC8vIEFkZCB0aGUgaHlwZXJjbGljayBtYXJrZXJzIGlmIHRoZXJlJ3MgYSBuZXcgc3VnZ2VzdGlvbiBhbmQgaXQncyB1bmRlciB0aGUgbW91c2UuXG4gICAgICB0aGlzLl91cGRhdGVOYXZpZ2F0aW9uTWFya2Vycyh0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2UucmFuZ2UsIC8qIGxvYWRpbmcgKi8gZmFsc2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBSZW1vdmUgYWxsIHRoZSBtYXJrZXJzIGlmIHdlJ3ZlIGZpbmlzaGVkIGxvYWRpbmcgYW5kIHRoZXJlJ3Mgbm8gc3VnZ2VzdGlvbi5cbiAgICAgIHRoaXMuX3VwZGF0ZU5hdmlnYXRpb25NYXJrZXJzKG51bGwpO1xuICAgIH1cblxuICAgIHRoaXMuX2h5cGVyY2xpY2tMb2FkaW5nID0gZmFsc2U7XG4gICAgdGhpcy5fdGV4dEVkaXRvclZpZXcuY2xhc3NMaXN0LnJlbW92ZSgnaHlwZXJjbGljay1sb2FkaW5nJyk7XG4gIH1cblxuICBfZ2V0TW91c2VQb3NpdGlvbkFzQnVmZmVyUG9zaXRpb24oKTogYXRvbSRQb2ludCB7XG4gICAgdmFyIHNjcmVlblBvc2l0aW9uID0gdGhpcy5fdGV4dEVkaXRvclZpZXcuY29tcG9uZW50LnNjcmVlblBvc2l0aW9uRm9yTW91c2VFdmVudCh0aGlzLl9sYXN0TW91c2VFdmVudCk7XG4gICAgcmV0dXJuIHRoaXMuX3RleHRFZGl0b3IuYnVmZmVyUG9zaXRpb25Gb3JTY3JlZW5Qb3NpdGlvbihzY3JlZW5Qb3NpdGlvbik7XG4gIH1cblxuICBfaXNNb3VzZUF0TGFzdFN1Z2dlc3Rpb24oKTogYm9vbGVhbiB7XG4gICAgaWYgKCF0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2UpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2lzUG9zaXRpb25JblJhbmdlKHRoaXMuX2dldE1vdXNlUG9zaXRpb25Bc0J1ZmZlclBvc2l0aW9uKCksIHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZS5yYW5nZSk7XG4gIH1cblxuICBfaXNNb3VzZUF0TGFzdFdvcmRSYW5nZSgpOiBib29sZWFuIHtcbiAgICBpZiAoIXRoaXMuX2xhc3RXb3JkUmFuZ2UpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2lzUG9zaXRpb25JblJhbmdlKHRoaXMuX2dldE1vdXNlUG9zaXRpb25Bc0J1ZmZlclBvc2l0aW9uKCksIHRoaXMuX2xhc3RXb3JkUmFuZ2UpO1xuICB9XG5cbiAgX2lzUG9zaXRpb25JblJhbmdlKHBvc2l0aW9uOiBhdG9tJFBvaW50LCByYW5nZTogYXRvbSRSYW5nZSB8IEFycmF5PGF0b20kUmFuZ2U+KTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIChBcnJheS5pc0FycmF5KHJhbmdlKVxuICAgICAgICA/IHJhbmdlLnNvbWUociA9PiByLmNvbnRhaW5zUG9pbnQocG9zaXRpb24pKVxuICAgICAgICA6IHJhbmdlLmNvbnRhaW5zUG9pbnQocG9zaXRpb24pKTtcbiAgfVxuXG4gIF9jbGVhclN1Z2dlc3Rpb24oKTogdm9pZCB7XG4gICAgdGhpcy5faHlwZXJjbGlja0xvYWRpbmcgPSBmYWxzZTtcbiAgICB0aGlzLl90ZXh0RWRpdG9yVmlldy5jbGFzc0xpc3QucmVtb3ZlKCdoeXBlcmNsaWNrLWxvYWRpbmcnKTtcbiAgICB0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2VQcm9taXNlID0gbnVsbDtcbiAgICB0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2UgPSBudWxsO1xuICAgIHRoaXMuX3VwZGF0ZU5hdmlnYXRpb25NYXJrZXJzKG51bGwpO1xuICB9XG5cbiAgYXN5bmMgX2NvbmZpcm1TdWdnZXN0aW9uQXRDdXJzb3IoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdmFyIHN1Z2dlc3Rpb24gPSBhd2FpdCB0aGlzLl9oeXBlcmNsaWNrLmdldFN1Z2dlc3Rpb24oXG4gICAgICAgIHRoaXMuX3RleHRFZGl0b3IsXG4gICAgICAgIHRoaXMuX3RleHRFZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKSk7XG4gICAgaWYgKHN1Z2dlc3Rpb24pIHtcbiAgICAgIHRoaXMuX2NvbmZpcm1TdWdnZXN0aW9uKHN1Z2dlc3Rpb24pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgbWFya2VycyBmb3IgdGhlIGdpdmVuIHJhbmdlKHMpLCBvciBjbGVhcnMgdGhlbSBpZiBgcmFuZ2VzYCBpcyBudWxsLlxuICAgKi9cbiAgX3VwZGF0ZU5hdmlnYXRpb25NYXJrZXJzKHJhbmdlOiA/KFJhbmdlIHwgQXJyYXk8UmFuZ2U+KSwgbG9hZGluZz86IGJvb2xlYW4pOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fbmF2aWdhdGlvbk1hcmtlcnMpIHtcbiAgICAgIHRoaXMuX25hdmlnYXRpb25NYXJrZXJzLmZvckVhY2gobWFya2VyID0+IG1hcmtlci5kZXN0cm95KCkpO1xuICAgICAgdGhpcy5fbmF2aWdhdGlvbk1hcmtlcnMgPSBudWxsO1xuICAgIH1cblxuICAgIC8vIE9ubHkgY2hhbmdlIHRoZSBjdXJzb3IgdG8gYSBwb2ludGVyIGlmIHRoZXJlIGlzIGEgc3VnZ2VzdGlvbiByZWFkeS5cbiAgICBpZiAocmFuZ2UgJiYgIWxvYWRpbmcpIHtcbiAgICAgIHRoaXMuX3RleHRFZGl0b3JWaWV3LmNsYXNzTGlzdC5hZGQoJ2h5cGVyY2xpY2snKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fdGV4dEVkaXRvclZpZXcuY2xhc3NMaXN0LnJlbW92ZSgnaHlwZXJjbGljaycpO1xuICAgIH1cblxuICAgIGlmIChyYW5nZSkge1xuICAgICAgdmFyIHJhbmdlcyA9IEFycmF5LmlzQXJyYXkocmFuZ2UpID8gcmFuZ2UgOiBbcmFuZ2VdO1xuICAgICAgdGhpcy5fbmF2aWdhdGlvbk1hcmtlcnMgPSByYW5nZXMubWFwKG1hcmtlclJhbmdlID0+IHtcbiAgICAgICAgdmFyIG1hcmtlciA9IHRoaXMuX3RleHRFZGl0b3IubWFya0J1ZmZlclJhbmdlKG1hcmtlclJhbmdlLCB7aW52YWxpZGF0ZTogJ25ldmVyJ30pO1xuICAgICAgICB0aGlzLl90ZXh0RWRpdG9yLmRlY29yYXRlTWFya2VyKFxuICAgICAgICAgICAgbWFya2VyLFxuICAgICAgICAgICAge3R5cGU6ICdoaWdobGlnaHQnLCBjbGFzczogJ2h5cGVyY2xpY2snfSk7XG4gICAgICAgIHJldHVybiBtYXJrZXI7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB3aGV0aGVyIGFuIGV2ZW50IHNob3VsZCBiZSBoYW5kbGVkIGJ5IGh5cGVyY2xpY2sgb3Igbm90LlxuICAgKi9cbiAgX2lzSHlwZXJjbGlja0V2ZW50KGV2ZW50OiBTeW50aGV0aWNLZXlib2FyZEV2ZW50IHwgU3ludGhldGljTW91c2VFdmVudCk6IGJvb2xlYW4ge1xuICAgIC8vIElmIHRoZSB1c2VyIGlzIHByZXNzaW5nIGVpdGhlciB0aGUgbWV0YSBrZXkgb3IgdGhlIGFsdCBrZXkuXG4gICAgcmV0dXJuIGV2ZW50Lm1ldGFLZXkgIT09IGV2ZW50LmFsdEtleTtcbiAgfVxuXG4gIGRpc3Bvc2UoKSB7XG4gICAgdGhpcy5faXNEZXN0cm95ZWQgPSB0cnVlO1xuICAgIHRoaXMuX2NsZWFyU3VnZ2VzdGlvbigpO1xuICAgIHRoaXMuX3RleHRFZGl0b3JWaWV3LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMuX29uTW91c2VNb3ZlKTtcbiAgICB0aGlzLl90ZXh0RWRpdG9yVmlldy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLl9vbk1vdXNlRG93bik7XG4gICAgdGhpcy5fdGV4dEVkaXRvclZpZXcucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuX29uS2V5RG93bik7XG4gICAgdGhpcy5fdGV4dEVkaXRvclZpZXcucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLl9vbktleVVwKTtcbiAgICB0aGlzLl9jb21tYW5kU3Vic2NyaXB0aW9uLmRpc3Bvc2UoKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEh5cGVyY2xpY2tGb3JUZXh0RWRpdG9yO1xuIl19
