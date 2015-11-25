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

var _createDecoratedClass = (function () { function defineProperties(target, descriptors, initializers) { for (var i = 0; i < descriptors.length; i++) { var descriptor = descriptors[i]; var decorators = descriptor.decorators; var key = descriptor.key; delete descriptor.key; delete descriptor.decorators; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor || descriptor.initializer) descriptor.writable = true; if (decorators) { for (var f = 0; f < decorators.length; f++) { var decorator = decorators[f]; if (typeof decorator === 'function') { descriptor = decorator(target, key, descriptor) || descriptor; } else { throw new TypeError('The decorator for method ' + descriptor.key + ' is of the invalid type ' + typeof decorator); } } if (descriptor.initializer !== undefined) { initializers[key] = descriptor; continue; } } Object.defineProperty(target, key, descriptor); } } return function (Constructor, protoProps, staticProps, protoInitializers, staticInitializers) { if (protoProps) defineProperties(Constructor.prototype, protoProps, protoInitializers); if (staticProps) defineProperties(Constructor, staticProps, staticInitializers); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _nuclideAnalytics = require('nuclide-analytics');

var _getWordTextAndRange2 = require('./get-word-text-and-range');

var _getWordTextAndRange3 = _interopRequireDefault(_getWordTextAndRange2);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

/**
 * Construct this object to enable Hyperclick in a text editor.
 * Call `dispose` to disable the feature.
 */
'use babel';

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
    var component = this._textEditorView.component;

    (0, _assert2['default'])(component);
    component.linesComponent.getDomNode().addEventListener('mousedown', this._onMouseDown);

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
    this._loadingTracker = null;
  }

  _createDecoratedClass(HyperclickForTextEditor, [{
    key: '_confirmSuggestion',
    value: function _confirmSuggestion(suggestion) {
      if (Array.isArray(suggestion.callback) && suggestion.callback.length > 0) {
        this._hyperclick.showSuggestionList(this._textEditor, suggestion);
      } else {
        (0, _assert2['default'])(typeof suggestion.callback === 'function');
        suggestion.callback();
      }
    }
  }, {
    key: '_onMouseMove',
    value: function _onMouseMove(event) {
      if (this._isLoading()) {
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

      var _getWordTextAndRange = (0, _getWordTextAndRange3['default'])(this._textEditor, this._getMousePositionAsBufferPosition());

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
        // Prevent the <meta-click> event from adding another cursor.
        event.stopPropagation();
      }

      this._clearSuggestion();
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

      if (this._lastSuggestionAtMouse != null) {
        var range = this._lastSuggestionAtMouse.range;

        (0, _assert2['default'])(range, 'Hyperclick result must have a valid Range');
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

      this._loadingTracker = (0, _nuclideAnalytics.startTracking)('hyperclick-loading');

      try {
        this._lastPosition = position;
        this._lastSuggestionAtMousePromise = this._hyperclick.getSuggestion(this._textEditor, position);
        this._lastSuggestionAtMouse = yield this._lastSuggestionAtMousePromise;
        if (this._isDestroyed) {
          return;
        }
        if (this._lastSuggestionAtMouse && this._isMouseAtLastSuggestion()) {
          // Add the hyperclick markers if there's a new suggestion and it's under the mouse.
          this._updateNavigationMarkers(this._lastSuggestionAtMouse.range);
        } else {
          // Remove all the markers if we've finished loading and there's no suggestion.
          this._updateNavigationMarkers(null);
        }
        if (this._loadingTracker != null) {
          this._loadingTracker.onSuccess();
        }
      } catch (e) {
        if (this._loadingTracker != null) {
          this._loadingTracker.onError(e);
        }
      } finally {
        this._doneLoading();
      }
    })
  }, {
    key: '_getMousePositionAsBufferPosition',
    value: function _getMousePositionAsBufferPosition() {
      var component = this._textEditorView.component;

      (0, _assert2['default'])(component);
      (0, _assert2['default'])(this._lastMouseEvent);
      var screenPosition = component.screenPositionForMouseEvent(this._lastMouseEvent);
      return this._textEditor.bufferPositionForScreenPosition(screenPosition);
    }
  }, {
    key: '_isMouseAtLastSuggestion',
    value: function _isMouseAtLastSuggestion() {
      if (!this._lastSuggestionAtMouse) {
        return false;
      }
      var range = this._lastSuggestionAtMouse.range;

      (0, _assert2['default'])(range, 'Hyperclick result must have a valid Range');
      return this._isPositionInRange(this._getMousePositionAsBufferPosition(), range);
    }
  }, {
    key: '_isMouseAtLastWordRange',
    value: function _isMouseAtLastWordRange() {
      var lastWordRange = this._lastWordRange;
      if (lastWordRange == null) {
        return false;
      }
      return this._isPositionInRange(this._getMousePositionAsBufferPosition(), lastWordRange);
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
      this._doneLoading();
      this._lastSuggestionAtMousePromise = null;
      this._lastSuggestionAtMouse = null;
      this._updateNavigationMarkers(null);
    }
  }, {
    key: '_confirmSuggestionAtCursor',
    decorators: [(0, _nuclideAnalytics.trackTiming)('hyperclick:confirm-cursor')],
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
    value: function _updateNavigationMarkers(range) {
      var _this2 = this;

      if (this._navigationMarkers) {
        this._navigationMarkers.forEach(function (marker) {
          return marker.destroy();
        });
        this._navigationMarkers = null;
      }

      // Only change the cursor to a pointer if there is a suggestion ready.
      if (range == null) {
        this._textEditorView.classList.remove('hyperclick');
        return;
      }

      this._textEditorView.classList.add('hyperclick');
      var ranges = Array.isArray(range) ? range : [range];
      this._navigationMarkers = ranges.map(function (markerRange) {
        var marker = _this2._textEditor.markBufferRange(markerRange, { invalidate: 'never' });
        _this2._textEditor.decorateMarker(marker, { type: 'highlight', 'class': 'hyperclick' });
        return marker;
      });
    }

    /**
     * Returns whether an event should be handled by hyperclick or not.
     */
  }, {
    key: '_isHyperclickEvent',
    value: function _isHyperclickEvent(event) {
      // If the user is pressing either the meta/ctrl key or the alt key.
      return process.platform === 'darwin' ? event.metaKey : event.ctrlKey;
    }
  }, {
    key: '_isLoading',
    value: function _isLoading() {
      return this._loadingTracker != null;
    }
  }, {
    key: '_doneLoading',
    value: function _doneLoading() {
      this._loadingTracker = null;
      this._textEditorView.classList.remove('hyperclick-loading');
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

exports['default'] = HyperclickForTextEditor;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBwZmw1Mm5wdWJsaXNoX3BhY2thZ2VzL2FwbS9oeXBlcmNsaWNrL2xpYi9IeXBlcmNsaWNrRm9yVGV4dEVkaXRvci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztnQ0FnQnlDLG1CQUFtQjs7b0NBQzVCLDJCQUEyQjs7OztzQkFDckMsUUFBUTs7Ozs7Ozs7QUFsQjlCLFdBQVcsQ0FBQzs7SUF3QlMsdUJBQXVCO0FBa0IvQixXQWxCUSx1QkFBdUIsQ0FrQjlCLFVBQTJCLEVBQUUsVUFBc0IsRUFBRTs7OzBCQWxCOUMsdUJBQXVCOztBQW1CeEMsUUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7QUFDOUIsUUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQzs7QUFFdEQsUUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7O0FBRTlCLFFBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDO0FBQzVCLFFBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDOzs7QUFHMUIsUUFBSSxDQUFDLDZCQUE2QixHQUFHLElBQUksQ0FBQzs7QUFFMUMsUUFBSSxDQUFDLHNCQUFzQixHQUFHLElBQUksQ0FBQztBQUNuQyxRQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDOztBQUUvQixRQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQzs7QUFFM0IsUUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNqRCxRQUFJLENBQUMsZUFBZSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDdEUsUUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsWUFBWSxD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alNrQix1QkFBdUI7OztxQkFBdkIsdUJBQXVCIiwiZmlsZSI6Ii92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBwZmw1Mm5wdWJsaXNoX3BhY2thZ2VzL2FwbS9oeXBlcmNsaWNrL2xpYi9IeXBlcmNsaWNrRm9yVGV4dEVkaXRvci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbmltcG9ydCB0eXBlIHtIeXBlcmNsaWNrU3VnZ2VzdGlvbn0gZnJvbSAnaHlwZXJjbGljay1pbnRlcmZhY2VzJztcblxuaW1wb3J0IHR5cGUgSHlwZXJjbGljayBmcm9tICcuL0h5cGVyY2xpY2snO1xuaW1wb3J0IHR5cGUge1RpbWluZ1RyYWNrZXJ9IGZyb20gJ251Y2xpZGUtYW5hbHl0aWNzJztcblxuaW1wb3J0IHt0cmFja1RpbWluZywgc3RhcnRUcmFja2luZ30gZnJvbSAnbnVjbGlkZS1hbmFseXRpY3MnO1xuaW1wb3J0IGdldFdvcmRUZXh0QW5kUmFuZ2UgZnJvbSAnLi9nZXQtd29yZC10ZXh0LWFuZC1yYW5nZSc7XG5pbXBvcnQgaW52YXJpYW50IGZyb20gJ2Fzc2VydCc7XG5cbi8qKlxuICogQ29uc3RydWN0IHRoaXMgb2JqZWN0IHRvIGVuYWJsZSBIeXBlcmNsaWNrIGluIGEgdGV4dCBlZGl0b3IuXG4gKiBDYWxsIGBkaXNwb3NlYCB0byBkaXNhYmxlIHRoZSBmZWF0dXJlLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBIeXBlcmNsaWNrRm9yVGV4dEVkaXRvciB7XG4gIF90ZXh0RWRpdG9yOiBhdG9tJFRleHRFZGl0b3I7XG4gIF90ZXh0RWRpdG9yVmlldzogYXRvbSRUZXh0RWRpdG9yRWxlbWVudDtcbiAgX2h5cGVyY2xpY2s6IEh5cGVyY2xpY2s7XG4gIF9sYXN0TW91c2VFdmVudDogP01vdXNlRXZlbnQ7XG4gIF9sYXN0UG9zaXRpb246ID9hdG9tJFBvaW50O1xuICBfbGFzdFN1Z2dlc3Rpb25BdE1vdXNlUHJvbWlzZTogP1Byb21pc2U8SHlwZXJjbGlja1N1Z2dlc3Rpb24+O1xuICBfbGFzdFN1Z2dlc3Rpb25BdE1vdXNlOiA/SHlwZXJjbGlja1N1Z2dlc3Rpb247XG4gIF9uYXZpZ2F0aW9uTWFya2VyczogP0FycmF5PGF0b20kTWFya2VyPjtcbiAgX2xhc3RXb3JkUmFuZ2U6ID9hdG9tJFJhbmdlO1xuICBfb25Nb3VzZU1vdmU6IChldmVudDogTW91c2VFdmVudCkgPT4gdm9pZDtcbiAgX29uTW91c2VEb3duOiAoZXZlbnQ6IE1vdXNlRXZlbnQpID0+IHZvaWQ7XG4gIF9vbktleURvd246IChldmVudDogU3ludGhldGljS2V5Ym9hcmRFdmVudCkgPT4gdm9pZDtcbiAgX29uS2V5VXA6IChldmVudDogU3ludGhldGljS2V5Ym9hcmRFdmVudCkgPT4gdm9pZDtcbiAgX2NvbW1hbmRTdWJzY3JpcHRpb246IGF0b20kRGlzcG9zYWJsZTtcbiAgX2lzRGVzdHJveWVkOiBib29sZWFuO1xuICBfbG9hZGluZ1RyYWNrZXI6ID9UaW1pbmdUcmFja2VyO1xuXG4gIGNvbnN0cnVjdG9yKHRleHRFZGl0b3I6IGF0b20kVGV4dEVkaXRvciwgaHlwZXJjbGljazogSHlwZXJjbGljaykge1xuICAgIHRoaXMuX3RleHRFZGl0b3IgPSB0ZXh0RWRpdG9yO1xuICAgIHRoaXMuX3RleHRFZGl0b3JWaWV3ID0gYXRvbS52aWV3cy5nZXRWaWV3KHRleHRFZGl0b3IpO1xuXG4gICAgdGhpcy5faHlwZXJjbGljayA9IGh5cGVyY2xpY2s7XG5cbiAgICB0aGlzLl9sYXN0TW91c2VFdmVudCA9IG51bGw7XG4gICAgdGhpcy5fbGFzdFBvc2l0aW9uID0gbnVsbDtcbiAgICAvLyBXZSBzdG9yZSB0aGUgb3JpZ2luYWwgcHJvbWlzZSB0aGF0IHdlIHVzZSB0byByZXRyaWV2ZSB0aGUgbGFzdCBzdWdnZXN0aW9uXG4gICAgLy8gc28gY2FsbGVycyBjYW4gYWxzbyBhd2FpdCBpdCB0byBrbm93IHdoZW4gaXQncyBhdmFpbGFibGUuXG4gICAgdGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlUHJvbWlzZSA9IG51bGw7XG4gICAgLy8gV2Ugc3RvcmUgdGhlIGxhc3Qgc3VnZ2VzdGlvbiBzaW5jZSB3ZSBtdXN0IGF3YWl0IGl0IGltbWVkaWF0ZWx5IGFueXdheS5cbiAgICB0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2UgPSBudWxsO1xuICAgIHRoaXMuX25hdmlnYXRpb25NYXJrZXJzID0gbnVsbDtcblxuICAgIHRoaXMuX2xhc3RXb3JkUmFuZ2UgPSBudWxsO1xuXG4gICAgdGhpcy5fb25Nb3VzZU1vdmUgPSB0aGlzLl9vbk1vdXNlTW92ZS5iaW5kKHRoaXMpO1xuICAgIHRoaXMuX3RleHRFZGl0b3JWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMuX29uTW91c2VNb3ZlKTtcbiAgICB0aGlzLl9vbk1vdXNlRG93biA9IHRoaXMuX29uTW91c2VEb3duLmJpbmQodGhpcyk7XG4gICAgY29uc3Qge2NvbXBvbmVudH0gPSB0aGlzLl90ZXh0RWRpdG9yVmlldztcbiAgICBpbnZhcmlhbnQoY29tcG9uZW50KTtcbiAgICBjb21wb25lbnQubGluZXNDb21wb25lbnQuZ2V0RG9tTm9kZSgpLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuX29uTW91c2VEb3duKTtcblxuICAgIHRoaXMuX29uS2V5RG93biA9IHRoaXMuX29uS2V5RG93bi5iaW5kKHRoaXMpO1xuICAgIHRoaXMuX3RleHRFZGl0b3JWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLl9vbktleURvd24pO1xuICAgIHRoaXMuX29uS2V5VXAgPSB0aGlzLl9vbktleVVwLmJpbmQodGhpcyk7XG4gICAgdGhpcy5fdGV4dEVkaXRvclZpZXcuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLl9vbktleVVwKTtcblxuICAgIHRoaXMuX2NvbW1hbmRTdWJzY3JpcHRpb24gPSBhdG9tLmNvbW1hbmRzLmFkZCh0aGlzLl90ZXh0RWRpdG9yVmlldywge1xuICAgICAgJ2h5cGVyY2xpY2s6Y29uZmlybS1jdXJzb3InOiAoKSA9PiB0aGlzLl9jb25maXJtU3VnZ2VzdGlvbkF0Q3Vyc29yKCksXG4gICAgfSk7XG5cbiAgICB0aGlzLl9pc0Rlc3Ryb3llZCA9IGZhbHNlO1xuICAgIHRoaXMuX2xvYWRpbmdUcmFja2VyID0gbnVsbDtcbiAgfVxuXG4gIF9jb25maXJtU3VnZ2VzdGlvbihzdWdnZXN0aW9uOiBIeXBlcmNsaWNrU3VnZ2VzdGlvbik6IHZvaWQge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHN1Z2dlc3Rpb24uY2FsbGJhY2spICYmIHN1Z2dlc3Rpb24uY2FsbGJhY2subGVuZ3RoID4gMCkge1xuICAgICAgdGhpcy5faHlwZXJjbGljay5zaG93U3VnZ2VzdGlvbkxpc3QodGhpcy5fdGV4dEVkaXRvciwgc3VnZ2VzdGlvbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGludmFyaWFudCh0eXBlb2Ygc3VnZ2VzdGlvbi5jYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJyk7XG4gICAgICBzdWdnZXN0aW9uLmNhbGxiYWNrKCk7XG4gICAgfVxuICB9XG5cbiAgX29uTW91c2VNb3ZlKGV2ZW50OiBNb3VzZUV2ZW50KTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2lzTG9hZGluZygpKSB7XG4gICAgICAvLyBTaG93IHRoZSBsb2FkaW5nIGN1cnNvci5cbiAgICAgIHRoaXMuX3RleHRFZGl0b3JWaWV3LmNsYXNzTGlzdC5hZGQoJ2h5cGVyY2xpY2stbG9hZGluZycpO1xuICAgIH1cblxuICAgIC8vIFdlIHNhdmUgdGhlIGxhc3QgYE1vdXNlRXZlbnRgIHNvIHRoZSB1c2VyIGNhbiB0cmlnZ2VyIEh5cGVyY2xpY2sgYnlcbiAgICAvLyBwcmVzc2luZyB0aGUga2V5IHdpdGhvdXQgbW92aW5nIHRoZSBtb3VzZSBhZ2Fpbi4gV2Ugb25seSBzYXZlIHRoZVxuICAgIC8vIHJlbGV2YW50IHByb3BlcnRpZXMgdG8gcHJldmVudCByZXRhaW5pbmcgYSByZWZlcmVuY2UgdG8gdGhlIGV2ZW50LlxuICAgIHRoaXMuX2xhc3RNb3VzZUV2ZW50ID0gKHtcbiAgICAgIGNsaWVudFg6IGV2ZW50LmNsaWVudFgsXG4gICAgICBjbGllbnRZOiBldmVudC5jbGllbnRZLFxuICAgIH06IGFueSk7XG5cblxuICAgIC8vIERvbid0IGZldGNoIHN1Z2dlc3Rpb25zIGlmIHRoZSBtb3VzZSBpcyBzdGlsbCBpbiB0aGUgc2FtZSAnd29yZCcsIHdoZXJlXG4gICAgLy8gJ3dvcmQnIGlzIGEgd2hpdGVzcGFjZS1kZWxpbWl0ZWQgZ3JvdXAgb2YgY2hhcmFjdGVycy5cbiAgICAvL1xuICAgIC8vIElmIHRoZSBsYXN0IHN1Z2dlc3Rpb24gaGFkIG11bHRpcGxlIHJhbmdlcywgd2UgaGF2ZSBubyBjaG9pY2UgYnV0IHRvXG4gICAgLy8gZmV0Y2ggc3VnZ2VzdGlvbnMgYmVjYXVzZSB0aGUgbmV3IHdvcmQgbWlnaHQgYmUgYmV0d2VlbiB0aG9zZSByYW5nZXMuXG4gICAgLy8gVGhpcyBzaG91bGQgYmUgb2sgYmVjYXVzZSBpdCB3aWxsIHJldXNlIHRoYXQgbGFzdCBzdWdnZXN0aW9uIHVudGlsIHRoZVxuICAgIC8vIG1vdXNlIG1vdmVzIG9mZiBvZiBpdC5cbiAgICBjb25zdCBsYXN0U3VnZ2VzdGlvbklzTm90TXVsdGlSYW5nZSA9ICF0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2UgfHxcbiAgICAgICAgIUFycmF5LmlzQXJyYXkodGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlLnJhbmdlKTtcbiAgICBpZiAodGhpcy5faXNNb3VzZUF0TGFzdFdvcmRSYW5nZSgpICYmIGxhc3RTdWdnZXN0aW9uSXNOb3RNdWx0aVJhbmdlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHtyYW5nZX0gPSBnZXRXb3JkVGV4dEFuZFJhbmdlKHRoaXMuX3RleHRFZGl0b3IsIHRoaXMuX2dldE1vdXNlUG9zaXRpb25Bc0J1ZmZlclBvc2l0aW9uKCkpO1xuICAgIHRoaXMuX2xhc3RXb3JkUmFuZ2UgPSByYW5nZTtcblxuICAgIGlmICh0aGlzLl9pc0h5cGVyY2xpY2tFdmVudChldmVudCkpIHtcbiAgICAgIC8vIENsZWFyIHRoZSBzdWdnZXN0aW9uIGlmIHRoZSBtb3VzZSBtb3ZlZCBvdXQgb2YgdGhlIHJhbmdlLlxuICAgICAgaWYgKCF0aGlzLl9pc01vdXNlQXRMYXN0U3VnZ2VzdGlvbigpKSB7XG4gICAgICAgIHRoaXMuX2NsZWFyU3VnZ2VzdGlvbigpO1xuICAgICAgfVxuICAgICAgdGhpcy5fc2V0U3VnZ2VzdGlvbkZvckxhc3RNb3VzZUV2ZW50KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2NsZWFyU3VnZ2VzdGlvbigpO1xuICAgIH1cbiAgfVxuXG4gIF9vbk1vdXNlRG93bihldmVudDogTW91c2VFdmVudCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5faXNIeXBlcmNsaWNrRXZlbnQoZXZlbnQpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZSkge1xuICAgICAgdGhpcy5fY29uZmlybVN1Z2dlc3Rpb24odGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlKTtcbiAgICAgIC8vIFByZXZlbnQgdGhlIDxtZXRhLWNsaWNrPiBldmVudCBmcm9tIGFkZGluZyBhbm90aGVyIGN1cnNvci5cbiAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH1cblxuICAgIHRoaXMuX2NsZWFyU3VnZ2VzdGlvbigpO1xuICB9XG5cbiAgX29uS2V5RG93bihldmVudDogU3ludGhldGljS2V5Ym9hcmRFdmVudCk6IHZvaWQge1xuICAgIC8vIFNob3cgdGhlIHN1Z2dlc3Rpb24gYXQgdGhlIGxhc3Qga25vd24gbW91c2UgcG9zaXRpb24uXG4gICAgaWYgKHRoaXMuX2lzSHlwZXJjbGlja0V2ZW50KGV2ZW50KSkge1xuICAgICAgdGhpcy5fc2V0U3VnZ2VzdGlvbkZvckxhc3RNb3VzZUV2ZW50KCk7XG4gICAgfVxuICB9XG5cbiAgX29uS2V5VXAoZXZlbnQ6IFN5bnRoZXRpY0tleWJvYXJkRXZlbnQpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuX2lzSHlwZXJjbGlja0V2ZW50KGV2ZW50KSkge1xuICAgICAgdGhpcy5fY2xlYXJTdWdnZXN0aW9uKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBgUHJvbWlzZWAgdGhhdCdzIHJlc29sdmVkIHdoZW4gdGhlIGxhdGVzdCBzdWdnZXN0aW9uJ3MgYXZhaWxhYmxlLlxuICAgKi9cbiAgZ2V0U3VnZ2VzdGlvbkF0TW91c2UoKTogUHJvbWlzZTw/SHlwZXJjbGlja1N1Z2dlc3Rpb24+IHtcbiAgICByZXR1cm4gdGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlUHJvbWlzZSB8fCBQcm9taXNlLnJlc29sdmUobnVsbCk7XG4gIH1cblxuICBhc3luYyBfc2V0U3VnZ2VzdGlvbkZvckxhc3RNb3VzZUV2ZW50KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy5fbGFzdE1vdXNlRXZlbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwb3NpdGlvbiA9IHRoaXMuX2dldE1vdXNlUG9zaXRpb25Bc0J1ZmZlclBvc2l0aW9uKCk7XG5cbiAgICBpZiAodGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlICE9IG51bGwpIHtcbiAgICAgIGNvbnN0IHtyYW5nZX0gPSB0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2U7XG4gICAgICBpbnZhcmlhbnQocmFuZ2UsICdIeXBlcmNsaWNrIHJlc3VsdCBtdXN0IGhhdmUgYSB2YWxpZCBSYW5nZScpO1xuICAgICAgaWYgKHRoaXMuX2lzUG9zaXRpb25JblJhbmdlKHBvc2l0aW9uLCByYW5nZSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyB0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2Ugd2lsbCBvbmx5IGJlIHNldCBpZiBoeXBlcmNsaWNrIHJldHVybmVkIGEgcHJvbWlzZSB0aGF0XG4gICAgLy8gcmVzb2x2ZWQgdG8gYSBub24tbnVsbCB2YWx1ZS4gU28sIGluIG9yZGVyIHRvIG5vdCBhc2sgaHlwZXJjbGljayBmb3IgdGhlIHNhbWUgdGhpbmdcbiAgICAvLyBhZ2FpbiBhbmQgYWdhaW4gd2hpY2ggd2lsbCBiZSBhbnl3YXkgbnVsbCwgd2UgY2hlY2sgaWYgdGhlIG1vdXNlIHBvc2l0aW9uIGhhcyBjaGFuZ2VkLlxuICAgIGlmICh0aGlzLl9sYXN0UG9zaXRpb24gJiYgcG9zaXRpb24uY29tcGFyZSh0aGlzLl9sYXN0UG9zaXRpb24pID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fbG9hZGluZ1RyYWNrZXIgPSBzdGFydFRyYWNraW5nKCdoeXBlcmNsaWNrLWxvYWRpbmcnKTtcblxuICAgIHRyeSB7XG4gICAgICB0aGlzLl9sYXN0UG9zaXRpb24gPSBwb3NpdGlvbjtcbiAgICAgIHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZVByb21pc2UgPVxuICAgICAgICAgIHRoaXMuX2h5cGVyY2xpY2suZ2V0U3VnZ2VzdGlvbih0aGlzLl90ZXh0RWRpdG9yLCBwb3NpdGlvbik7XG4gICAgICB0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2UgPSBhd2FpdCB0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2VQcm9taXNlO1xuICAgICAgaWYgKHRoaXMuX2lzRGVzdHJveWVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2UgJiYgdGhpcy5faXNNb3VzZUF0TGFzdFN1Z2dlc3Rpb24oKSkge1xuICAgICAgICAvLyBBZGQgdGhlIGh5cGVyY2xpY2sgbWFya2VycyBpZiB0aGVyZSdzIGEgbmV3IHN1Z2dlc3Rpb24gYW5kIGl0J3MgdW5kZXIgdGhlIG1vdXNlLlxuICAgICAgICB0aGlzLl91cGRhdGVOYXZpZ2F0aW9uTWFya2Vycyh0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2UucmFuZ2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gUmVtb3ZlIGFsbCB0aGUgbWFya2VycyBpZiB3ZSd2ZSBmaW5pc2hlZCBsb2FkaW5nIGFuZCB0aGVyZSdzIG5vIHN1Z2dlc3Rpb24uXG4gICAgICAgIHRoaXMuX3VwZGF0ZU5hdmlnYXRpb25NYXJrZXJzKG51bGwpO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX2xvYWRpbmdUcmFja2VyICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy5fbG9hZGluZ1RyYWNrZXIub25TdWNjZXNzKCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKHRoaXMuX2xvYWRpbmdUcmFja2VyICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy5fbG9hZGluZ1RyYWNrZXIub25FcnJvcihlKTtcbiAgICAgIH1cbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5fZG9uZUxvYWRpbmcoKTtcbiAgICB9XG4gIH1cblxuICBfZ2V0TW91c2VQb3NpdGlvbkFzQnVmZmVyUG9zaXRpb24oKTogYXRvbSRQb2ludCB7XG4gICAgY29uc3Qge2NvbXBvbmVudH0gPSB0aGlzLl90ZXh0RWRpdG9yVmlldztcbiAgICBpbnZhcmlhbnQoY29tcG9uZW50KTtcbiAgICBpbnZhcmlhbnQodGhpcy5fbGFzdE1vdXNlRXZlbnQpO1xuICAgIGNvbnN0IHNjcmVlblBvc2l0aW9uID0gY29tcG9uZW50LnNjcmVlblBvc2l0aW9uRm9yTW91c2VFdmVudCh0aGlzLl9sYXN0TW91c2VFdmVudCk7XG4gICAgcmV0dXJuIHRoaXMuX3RleHRFZGl0b3IuYnVmZmVyUG9zaXRpb25Gb3JTY3JlZW5Qb3NpdGlvbihzY3JlZW5Qb3NpdGlvbik7XG4gIH1cblxuICBfaXNNb3VzZUF0TGFzdFN1Z2dlc3Rpb24oKTogYm9vbGVhbiB7XG4gICAgaWYgKCF0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2UpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3Qge3JhbmdlfSA9IHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZTtcbiAgICBpbnZhcmlhbnQocmFuZ2UsICdIeXBlcmNsaWNrIHJlc3VsdCBtdXN0IGhhdmUgYSB2YWxpZCBSYW5nZScpO1xuICAgIHJldHVybiB0aGlzLl9pc1Bvc2l0aW9uSW5SYW5nZSh0aGlzLl9nZXRNb3VzZVBvc2l0aW9uQXNCdWZmZXJQb3NpdGlvbigpLCByYW5nZSk7XG4gIH1cblxuICBfaXNNb3VzZUF0TGFzdFdvcmRSYW5nZSgpOiBib29sZWFuIHtcbiAgICBjb25zdCBsYXN0V29yZFJhbmdlID0gdGhpcy5fbGFzdFdvcmRSYW5nZTtcbiAgICBpZiAobGFzdFdvcmRSYW5nZSA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9pc1Bvc2l0aW9uSW5SYW5nZSh0aGlzLl9nZXRNb3VzZVBvc2l0aW9uQXNCdWZmZXJQb3NpdGlvbigpLCBsYXN0V29yZFJhbmdlKTtcbiAgfVxuXG4gIF9pc1Bvc2l0aW9uSW5SYW5nZShwb3NpdGlvbjogYXRvbSRQb2ludCwgcmFuZ2U6IGF0b20kUmFuZ2UgfCBBcnJheTxhdG9tJFJhbmdlPik6IGJvb2xlYW4ge1xuICAgIHJldHVybiAoQXJyYXkuaXNBcnJheShyYW5nZSlcbiAgICAgICAgPyByYW5nZS5zb21lKHIgPT4gci5jb250YWluc1BvaW50KHBvc2l0aW9uKSlcbiAgICAgICAgOiByYW5nZS5jb250YWluc1BvaW50KHBvc2l0aW9uKSk7XG4gIH1cblxuICBfY2xlYXJTdWdnZXN0aW9uKCk6IHZvaWQge1xuICAgIHRoaXMuX2RvbmVMb2FkaW5nKCk7XG4gICAgdGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlUHJvbWlzZSA9IG51bGw7XG4gICAgdGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlID0gbnVsbDtcbiAgICB0aGlzLl91cGRhdGVOYXZpZ2F0aW9uTWFya2VycyhudWxsKTtcbiAgfVxuXG4gIEB0cmFja1RpbWluZygnaHlwZXJjbGljazpjb25maXJtLWN1cnNvcicpXG4gIGFzeW5jIF9jb25maXJtU3VnZ2VzdGlvbkF0Q3Vyc29yKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHN1Z2dlc3Rpb24gPSBhd2FpdCB0aGlzLl9oeXBlcmNsaWNrLmdldFN1Z2dlc3Rpb24oXG4gICAgICAgIHRoaXMuX3RleHRFZGl0b3IsXG4gICAgICAgIHRoaXMuX3RleHRFZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKSk7XG4gICAgaWYgKHN1Z2dlc3Rpb24pIHtcbiAgICAgIHRoaXMuX2NvbmZpcm1TdWdnZXN0aW9uKHN1Z2dlc3Rpb24pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgbWFya2VycyBmb3IgdGhlIGdpdmVuIHJhbmdlKHMpLCBvciBjbGVhcnMgdGhlbSBpZiBgcmFuZ2VzYCBpcyBudWxsLlxuICAgKi9cbiAgX3VwZGF0ZU5hdmlnYXRpb25NYXJrZXJzKHJhbmdlOiA/IChhdG9tJFJhbmdlIHwgQXJyYXk8YXRvbSRSYW5nZT4pKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX25hdmlnYXRpb25NYXJrZXJzKSB7XG4gICAgICB0aGlzLl9uYXZpZ2F0aW9uTWFya2Vycy5mb3JFYWNoKG1hcmtlciA9PiBtYXJrZXIuZGVzdHJveSgpKTtcbiAgICAgIHRoaXMuX25hdmlnYXRpb25NYXJrZXJzID0gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBPbmx5IGNoYW5nZSB0aGUgY3Vyc29yIHRvIGEgcG9pbnRlciBpZiB0aGVyZSBpcyBhIHN1Z2dlc3Rpb24gcmVhZHkuXG4gICAgaWYgKHJhbmdlID09IG51bGwpIHtcbiAgICAgIHRoaXMuX3RleHRFZGl0b3JWaWV3LmNsYXNzTGlzdC5yZW1vdmUoJ2h5cGVyY2xpY2snKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl90ZXh0RWRpdG9yVmlldy5jbGFzc0xpc3QuYWRkKCdoeXBlcmNsaWNrJyk7XG4gICAgY29uc3QgcmFuZ2VzID0gQXJyYXkuaXNBcnJheShyYW5nZSkgPyByYW5nZSA6IFtyYW5nZV07XG4gICAgdGhpcy5fbmF2aWdhdGlvbk1hcmtlcnMgPSByYW5nZXMubWFwKG1hcmtlclJhbmdlID0+IHtcbiAgICAgIGNvbnN0IG1hcmtlciA9IHRoaXMuX3RleHRFZGl0b3IubWFya0J1ZmZlclJhbmdlKG1hcmtlclJhbmdlLCB7aW52YWxpZGF0ZTogJ25ldmVyJ30pO1xuICAgICAgdGhpcy5fdGV4dEVkaXRvci5kZWNvcmF0ZU1hcmtlcihcbiAgICAgICAgbWFya2VyLFxuICAgICAgICB7dHlwZTogJ2hpZ2hsaWdodCcsIGNsYXNzOiAnaHlwZXJjbGljayd9LFxuICAgICAgKTtcbiAgICAgIHJldHVybiBtYXJrZXI7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB3aGV0aGVyIGFuIGV2ZW50IHNob3VsZCBiZSBoYW5kbGVkIGJ5IGh5cGVyY2xpY2sgb3Igbm90LlxuICAgKi9cbiAgX2lzSHlwZXJjbGlja0V2ZW50KGV2ZW50OiBTeW50aGV0aWNLZXlib2FyZEV2ZW50IHwgTW91c2VFdmVudCk6IGJvb2xlYW4ge1xuICAgIC8vIElmIHRoZSB1c2VyIGlzIHByZXNzaW5nIGVpdGhlciB0aGUgbWV0YS9jdHJsIGtleSBvciB0aGUgYWx0IGtleS5cbiAgICByZXR1cm4gcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2RhcndpbicgPyBldmVudC5tZXRhS2V5IDogZXZlbnQuY3RybEtleTtcbiAgfVxuXG4gIF9pc0xvYWRpbmcoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2xvYWRpbmdUcmFja2VyICE9IG51bGw7XG4gIH1cblxuICBfZG9uZUxvYWRpbmcoKTogdm9pZCB7XG4gICAgdGhpcy5fbG9hZGluZ1RyYWNrZXIgPSBudWxsO1xuICAgIHRoaXMuX3RleHRFZGl0b3JWaWV3LmNsYXNzTGlzdC5yZW1vdmUoJ2h5cGVyY2xpY2stbG9hZGluZycpO1xuICB9XG5cbiAgZGlzcG9zZSgpIHtcbiAgICB0aGlzLl9pc0Rlc3Ryb3llZCA9IHRydWU7XG4gICAgdGhpcy5fY2xlYXJTdWdnZXN0aW9uKCk7XG4gICAgdGhpcy5fdGV4dEVkaXRvclZpZXcucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5fb25Nb3VzZU1vdmUpO1xuICAgIHRoaXMuX3RleHRFZGl0b3JWaWV3LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuX29uTW91c2VEb3duKTtcbiAgICB0aGlzLl90ZXh0RWRpdG9yVmlldy5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5fb25LZXlEb3duKTtcbiAgICB0aGlzLl90ZXh0RWRpdG9yVmlldy5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXl1cCcsIHRoaXMuX29uS2V5VXApO1xuICAgIHRoaXMuX2NvbW1hbmRTdWJzY3JpcHRpb24uZGlzcG9zZSgpO1xuICB9XG59XG4iXX0=
