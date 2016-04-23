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

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _atom = require('atom');

var _hyperclickUtils = require('./hyperclick-utils');

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
    this._subscriptions = new _atom.CompositeDisposable();

    this._onMouseMove = this._onMouseMove.bind(this);
    this._textEditorView.addEventListener('mousemove', this._onMouseMove);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._setupMouseDownListener();

    this._onKeyDown = this._onKeyDown.bind(this);
    this._textEditorView.addEventListener('keydown', this._onKeyDown);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._textEditorView.addEventListener('keyup', this._onKeyUp);

    this._subscriptions.add(atom.commands.add(this._textEditorView, {
      'hyperclick:confirm-cursor': function hyperclickConfirmCursor() {
        return _this._confirmSuggestionAtCursor();
      }
    }));

    this._isDestroyed = false;
    this._isLoading = false;
  }

  _createClass(HyperclickForTextEditor, [{
    key: '_setupMouseDownListener',
    value: function _setupMouseDownListener() {
      var _this2 = this;

      var getLinesDomNode = function getLinesDomNode() {
        var component = _this2._textEditorView.component;

        (0, _assert2['default'])(component);
        return component.linesComponent.getDomNode();
      };
      var removeMouseDownListener = function removeMouseDownListener() {
        if (_this2._textEditorView.component == null) {
          return;
        }
        // $FlowFixMe (most)
        getLinesDomNode().removeEventListener('mousedown', _this2._onMouseDown);
      };
      var addMouseDownListener = function addMouseDownListener() {
        getLinesDomNode().addEventListener('mousedown', _this2._onMouseDown);
      };
      this._subscriptions.add(new _atom.Disposable(removeMouseDownListener));
      this._subscriptions.add(this._textEditorView.onDidDetach(removeMouseDownListener));
      this._subscriptions.add(this._textEditorView.onDidAttach(addMouseDownListener));
      addMouseDownListener();
    }
  }, {
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
      if (this._isLoading) {
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

      var _getWordTextAndRange = (0, _hyperclickUtils.getWordTextAndRange)(this._textEditor, this._getMousePositionAsBufferPosition());

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
      if (!this._isHyperclickEvent(event) || !this._isMouseAtLastSuggestion()) {
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

      this._isLoading = true;

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
      } catch (e) {
        console.error('Error getting Hyperclick suggestion:', e);
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
      try {
        return this._textEditor.bufferPositionForScreenPosition(screenPosition);
      } catch (error) {
        // Fix https://github.com/facebook/nuclide/issues/292
        // When navigating Atom workspace with `CMD/CTRL` down,
        // it triggers TextEditorElement's `mousemove` with invalid screen position.
        // This falls back to returning the start of the editor.
        console.error('Hyperclick: Error getting buffer position for screen position:', error);
        return new _atom.Point(0, 0);
      }
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
      var _this3 = this;

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
        var marker = _this3._textEditor.markBufferRange(markerRange, { invalidate: 'never' });
        _this3._textEditor.decorateMarker(marker, { type: 'highlight', 'class': 'hyperclick' });
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
    key: '_doneLoading',
    value: function _doneLoading() {
      this._isLoading = false;
      this._textEditorView.classList.remove('hyperclick-loading');
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this._isDestroyed = true;
      this._clearSuggestion();
      // $FlowFixMe (most)
      this._textEditorView.removeEventListener('mousemove', this._onMouseMove);
      // $FlowFixMe (most)
      this._textEditorView.removeEventListener('keydown', this._onKeyDown);
      // $FlowFixMe (most)
      this._textEditorView.removeEventListener('keyup', this._onKeyUp);
      this._subscriptions.dispose();
    }
  }]);

  return HyperclickForTextEditor;
})();

exports['default'] = HyperclickForTextEditor;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hc3VhcmV6L0Rlc2t0b3AvaHlwZXJjbGljay9saWIvSHlwZXJjbGlja0ZvclRleHRFZGl0b3IuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7b0JBY3FELE1BQU07OytCQUN6QixvQkFBb0I7O3NCQUNoQyxRQUFROzs7Ozs7OztBQWhCOUIsV0FBVyxDQUFDOztJQXNCUyx1QkFBdUI7QUFrQi9CLFdBbEJRLHVCQUF1QixDQWtCOUIsVUFBMkIsRUFBRSxVQUFzQixFQUFFOzs7MEJBbEI5Qyx1QkFBdUI7O0FBbUJ4QyxRQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQztBQUM5QixRQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDOztBQUV0RCxRQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQzs7QUFFOUIsUUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7QUFDNUIsUUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUM7OztBQUcxQixRQUFJLENBQUMsNkJBQTZCLEdBQUcsSUFBSSxDQUFDOztBQUUxQyxRQUFJLENBQUMsc0JBQXNCLEdBQUcsSUFBSSxDQUFDO0FBQ25DLFFBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUM7O0FBRS9CLFFBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDO0FBQzNCLFFBQUksQ0FBQyxjQUFjLEdBQUcsK0JBQXlCLENBQUM7O0FBRWhELFFBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDakQsUUFBSSxDQUFDLGVBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQ3RFLFFBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFD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LFVBQVUsR0FBRyxLQUFLLENBQUM7QUFDeEIsVUFBSSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLENBQUM7S0FDN0Q7OztXQUVNLG1CQUFHO0FBQ1IsVUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7QUFDekIsVUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7O0FBRXhCLFVBQUksQ0FBQyxlQUFlLENBQUMsbUJBQW1CLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQzs7QUFFekUsVUFBSSxDQUFDLGVBQWUsQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDOztBQUVyRSxVQUFJLENBQUMsZUFBZSxDQUFDLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDakUsVUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztLQUMvQjs7O1NBdlRrQix1QkFBdUI7OztxQkFBdkIsdUJBQXVCIiwiZmlsZSI6Ii9Vc2Vycy9hc3VhcmV6L0Rlc2t0b3AvaHlwZXJjbGljay9saWIvSHlwZXJjbGlja0ZvclRleHRFZGl0b3IuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG5pbXBvcnQgdHlwZSB7SHlwZXJjbGlja1N1Z2dlc3Rpb259IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHR5cGUgSHlwZXJjbGljayBmcm9tICcuL0h5cGVyY2xpY2snO1xuXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUsIFBvaW50fSBmcm9tICdhdG9tJztcbmltcG9ydCB7Z2V0V29yZFRleHRBbmRSYW5nZX0gZnJvbSAnLi9oeXBlcmNsaWNrLXV0aWxzJztcbmltcG9ydCBpbnZhcmlhbnQgZnJvbSAnYXNzZXJ0JztcblxuLyoqXG4gKiBDb25zdHJ1Y3QgdGhpcyBvYmplY3QgdG8gZW5hYmxlIEh5cGVyY2xpY2sgaW4gYSB0ZXh0IGVkaXRvci5cbiAqIENhbGwgYGRpc3Bvc2VgIHRvIGRpc2FibGUgdGhlIGZlYXR1cmUuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEh5cGVyY2xpY2tGb3JUZXh0RWRpdG9yIHtcbiAgX3RleHRFZGl0b3I6IGF0b20kVGV4dEVkaXRvcjtcbiAgX3RleHRFZGl0b3JWaWV3OiBhdG9tJFRleHRFZGl0b3JFbGVtZW50O1xuICBfaHlwZXJjbGljazogSHlwZXJjbGljaztcbiAgX2xhc3RNb3VzZUV2ZW50OiA/TW91c2VFdmVudDtcbiAgX2xhc3RQb3NpdGlvbjogP2F0b20kUG9pbnQ7XG4gIF9sYXN0U3VnZ2VzdGlvbkF0TW91c2VQcm9taXNlOiA/UHJvbWlzZTxIeXBlcmNsaWNrU3VnZ2VzdGlvbj47XG4gIF9sYXN0U3VnZ2VzdGlvbkF0TW91c2U6ID9IeXBlcmNsaWNrU3VnZ2VzdGlvbjtcbiAgX25hdmlnYXRpb25NYXJrZXJzOiA/QXJyYXk8YXRvbSRNYXJrZXI+O1xuICBfbGFzdFdvcmRSYW5nZTogP2F0b20kUmFuZ2U7XG4gIF9vbk1vdXNlTW92ZTogKGV2ZW50OiBNb3VzZUV2ZW50KSA9PiB2b2lkO1xuICBfb25Nb3VzZURvd246IChldmVudDogTW91c2VFdmVudCkgPT4gdm9pZDtcbiAgX29uS2V5RG93bjogKGV2ZW50OiBTeW50aGV0aWNLZXlib2FyZEV2ZW50KSA9PiB2b2lkO1xuICBfb25LZXlVcDogKGV2ZW50OiBTeW50aGV0aWNLZXlib2FyZEV2ZW50KSA9PiB2b2lkO1xuICBfc3Vic2NyaXB0aW9uczogYXRvbSRDb21wb3NpdGVEaXNwb3NhYmxlO1xuICBfaXNEZXN0cm95ZWQ6IGJvb2xlYW47XG4gIF9pc0xvYWRpbmc6IGJvb2xlYW47XG5cbiAgY29uc3RydWN0b3IodGV4dEVkaXRvcjogYXRvbSRUZXh0RWRpdG9yLCBoeXBlcmNsaWNrOiBIeXBlcmNsaWNrKSB7XG4gICAgdGhpcy5fdGV4dEVkaXRvciA9IHRleHRFZGl0b3I7XG4gICAgdGhpcy5fdGV4dEVkaXRvclZpZXcgPSBhdG9tLnZpZXdzLmdldFZpZXcodGV4dEVkaXRvcik7XG5cbiAgICB0aGlzLl9oeXBlcmNsaWNrID0gaHlwZXJjbGljaztcblxuICAgIHRoaXMuX2xhc3RNb3VzZUV2ZW50ID0gbnVsbDtcbiAgICB0aGlzLl9sYXN0UG9zaXRpb24gPSBudWxsO1xuICAgIC8vIFdlIHN0b3JlIHRoZSBvcmlnaW5hbCBwcm9taXNlIHRoYXQgd2UgdXNlIHRvIHJldHJpZXZlIHRoZSBsYXN0IHN1Z2dlc3Rpb25cbiAgICAvLyBzbyBjYWxsZXJzIGNhbiBhbHNvIGF3YWl0IGl0IHRvIGtub3cgd2hlbiBpdCdzIGF2YWlsYWJsZS5cbiAgICB0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2VQcm9taXNlID0gbnVsbDtcbiAgICAvLyBXZSBzdG9yZSB0aGUgbGFzdCBzdWdnZXN0aW9uIHNpbmNlIHdlIG11c3QgYXdhaXQgaXQgaW1tZWRpYXRlbHkgYW55d2F5LlxuICAgIHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZSA9IG51bGw7XG4gICAgdGhpcy5fbmF2aWdhdGlvbk1hcmtlcnMgPSBudWxsO1xuXG4gICAgdGhpcy5fbGFzdFdvcmRSYW5nZSA9IG51bGw7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG5cbiAgICB0aGlzLl9vbk1vdXNlTW92ZSA9IHRoaXMuX29uTW91c2VNb3ZlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5fdGV4dEVkaXRvclZpZXcuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5fb25Nb3VzZU1vdmUpO1xuICAgIHRoaXMuX29uTW91c2VEb3duID0gdGhpcy5fb25Nb3VzZURvd24uYmluZCh0aGlzKTtcbiAgICB0aGlzLl9zZXR1cE1vdXNlRG93bkxpc3RlbmVyKCk7XG5cbiAgICB0aGlzLl9vbktleURvd24gPSB0aGlzLl9vbktleURvd24uYmluZCh0aGlzKTtcbiAgICB0aGlzLl90ZXh0RWRpdG9yVmlldy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5fb25LZXlEb3duKTtcbiAgICB0aGlzLl9vbktleVVwID0gdGhpcy5fb25LZXlVcC5iaW5kKHRoaXMpO1xuICAgIHRoaXMuX3RleHRFZGl0b3JWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdGhpcy5fb25LZXlVcCk7XG5cbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbW1hbmRzLmFkZCh0aGlzLl90ZXh0RWRpdG9yVmlldywge1xuICAgICAgJ2h5cGVyY2xpY2s6Y29uZmlybS1jdXJzb3InOiAoKSA9PiB0aGlzLl9jb25maXJtU3VnZ2VzdGlvbkF0Q3Vyc29yKCksXG4gICAgfSkpO1xuXG4gICAgdGhpcy5faXNEZXN0cm95ZWQgPSBmYWxzZTtcbiAgICB0aGlzLl9pc0xvYWRpbmcgPSBmYWxzZTtcbiAgfVxuXG4gIF9zZXR1cE1vdXNlRG93bkxpc3RlbmVyKCk6IHZvaWQge1xuICAgIGNvbnN0IGdldExpbmVzRG9tTm9kZSA9ICgpOiBIVE1MRWxlbWVudCA9PiB7XG4gICAgICBjb25zdCB7Y29tcG9uZW50fSA9IHRoaXMuX3RleHRFZGl0b3JWaWV3O1xuICAgICAgaW52YXJpYW50KGNvbXBvbmVudCk7XG4gICAgICByZXR1cm4gY29tcG9uZW50LmxpbmVzQ29tcG9uZW50LmdldERvbU5vZGUoKTtcbiAgICB9O1xuICAgIGNvbnN0IHJlbW92ZU1vdXNlRG93bkxpc3RlbmVyID0gKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuX3RleHRFZGl0b3JWaWV3LmNvbXBvbmVudCA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIC8vICRGbG93Rml4TWUgKG1vc3QpXG4gICAgICBnZXRMaW5lc0RvbU5vZGUoKS5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLl9vbk1vdXNlRG93bik7XG4gICAgfTtcbiAgICBjb25zdCBhZGRNb3VzZURvd25MaXN0ZW5lciA9ICgpID0+IHtcbiAgICAgIGdldExpbmVzRG9tTm9kZSgpLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuX29uTW91c2VEb3duKTtcbiAgICB9O1xuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMuYWRkKG5ldyBEaXNwb3NhYmxlKHJlbW92ZU1vdXNlRG93bkxpc3RlbmVyKSk7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5fdGV4dEVkaXRvclZpZXcub25EaWREZXRhY2gocmVtb3ZlTW91c2VEb3duTGlzdGVuZXIpKTtcbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zLmFkZCh0aGlzLl90ZXh0RWRpdG9yVmlldy5vbkRpZEF0dGFjaChhZGRNb3VzZURvd25MaXN0ZW5lcikpO1xuICAgIGFkZE1vdXNlRG93bkxpc3RlbmVyKCk7XG4gIH1cblxuICBfY29uZmlybVN1Z2dlc3Rpb24oc3VnZ2VzdGlvbjogSHlwZXJjbGlja1N1Z2dlc3Rpb24pOiB2b2lkIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShzdWdnZXN0aW9uLmNhbGxiYWNrKSAmJiBzdWdnZXN0aW9uLmNhbGxiYWNrLmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMuX2h5cGVyY2xpY2suc2hvd1N1Z2dlc3Rpb25MaXN0KHRoaXMuX3RleHRFZGl0b3IsIHN1Z2dlc3Rpb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICBpbnZhcmlhbnQodHlwZW9mIHN1Z2dlc3Rpb24uY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpO1xuICAgICAgc3VnZ2VzdGlvbi5jYWxsYmFjaygpO1xuICAgIH1cbiAgfVxuXG4gIF9vbk1vdXNlTW92ZShldmVudDogTW91c2VFdmVudCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9pc0xvYWRpbmcpIHtcbiAgICAgIC8vIFNob3cgdGhlIGxvYWRpbmcgY3Vyc29yLlxuICAgICAgdGhpcy5fdGV4dEVkaXRvclZpZXcuY2xhc3NMaXN0LmFkZCgnaHlwZXJjbGljay1sb2FkaW5nJyk7XG4gICAgfVxuXG4gICAgLy8gV2Ugc2F2ZSB0aGUgbGFzdCBgTW91c2VFdmVudGAgc28gdGhlIHVzZXIgY2FuIHRyaWdnZXIgSHlwZXJjbGljayBieVxuICAgIC8vIHByZXNzaW5nIHRoZSBrZXkgd2l0aG91dCBtb3ZpbmcgdGhlIG1vdXNlIGFnYWluLiBXZSBvbmx5IHNhdmUgdGhlXG4gICAgLy8gcmVsZXZhbnQgcHJvcGVydGllcyB0byBwcmV2ZW50IHJldGFpbmluZyBhIHJlZmVyZW5jZSB0byB0aGUgZXZlbnQuXG4gICAgdGhpcy5fbGFzdE1vdXNlRXZlbnQgPSAoe1xuICAgICAgY2xpZW50WDogZXZlbnQuY2xpZW50WCxcbiAgICAgIGNsaWVudFk6IGV2ZW50LmNsaWVudFksXG4gICAgfTogYW55KTtcblxuXG4gICAgLy8gRG9uJ3QgZmV0Y2ggc3VnZ2VzdGlvbnMgaWYgdGhlIG1vdXNlIGlzIHN0aWxsIGluIHRoZSBzYW1lICd3b3JkJywgd2hlcmVcbiAgICAvLyAnd29yZCcgaXMgYSB3aGl0ZXNwYWNlLWRlbGltaXRlZCBncm91cCBvZiBjaGFyYWN0ZXJzLlxuICAgIC8vXG4gICAgLy8gSWYgdGhlIGxhc3Qgc3VnZ2VzdGlvbiBoYWQgbXVsdGlwbGUgcmFuZ2VzLCB3ZSBoYXZlIG5vIGNob2ljZSBidXQgdG9cbiAgICAvLyBmZXRjaCBzdWdnZXN0aW9ucyBiZWNhdXNlIHRoZSBuZXcgd29yZCBtaWdodCBiZSBiZXR3ZWVuIHRob3NlIHJhbmdlcy5cbiAgICAvLyBUaGlzIHNob3VsZCBiZSBvayBiZWNhdXNlIGl0IHdpbGwgcmV1c2UgdGhhdCBsYXN0IHN1Z2dlc3Rpb24gdW50aWwgdGhlXG4gICAgLy8gbW91c2UgbW92ZXMgb2ZmIG9mIGl0LlxuICAgIGNvbnN0IGxhc3RTdWdnZXN0aW9uSXNOb3RNdWx0aVJhbmdlID0gIXRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZSB8fFxuICAgICAgICAhQXJyYXkuaXNBcnJheSh0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2UucmFuZ2UpO1xuICAgIGlmICh0aGlzLl9pc01vdXNlQXRMYXN0V29yZFJhbmdlKCkgJiYgbGFzdFN1Z2dlc3Rpb25Jc05vdE11bHRpUmFuZ2UpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qge3JhbmdlfSA9IGdldFdvcmRUZXh0QW5kUmFuZ2UodGhpcy5fdGV4dEVkaXRvciwgdGhpcy5fZ2V0TW91c2VQb3NpdGlvbkFzQnVmZmVyUG9zaXRpb24oKSk7XG4gICAgdGhpcy5fbGFzdFdvcmRSYW5nZSA9IHJhbmdlO1xuXG4gICAgaWYgKHRoaXMuX2lzSHlwZXJjbGlja0V2ZW50KGV2ZW50KSkge1xuICAgICAgLy8gQ2xlYXIgdGhlIHN1Z2dlc3Rpb24gaWYgdGhlIG1vdXNlIG1vdmVkIG91dCBvZiB0aGUgcmFuZ2UuXG4gICAgICBpZiAoIXRoaXMuX2lzTW91c2VBdExhc3RTdWdnZXN0aW9uKCkpIHtcbiAgICAgICAgdGhpcy5fY2xlYXJTdWdnZXN0aW9uKCk7XG4gICAgICB9XG4gICAgICB0aGlzLl9zZXRTdWdnZXN0aW9uRm9yTGFzdE1vdXNlRXZlbnQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fY2xlYXJTdWdnZXN0aW9uKCk7XG4gICAgfVxuICB9XG5cbiAgX29uTW91c2VEb3duKGV2ZW50OiBNb3VzZUV2ZW50KTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLl9pc0h5cGVyY2xpY2tFdmVudChldmVudCkgfHwgIXRoaXMuX2lzTW91c2VBdExhc3RTdWdnZXN0aW9uKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlKSB7XG4gICAgICB0aGlzLl9jb25maXJtU3VnZ2VzdGlvbih0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2UpO1xuICAgICAgLy8gUHJldmVudCB0aGUgPG1ldGEtY2xpY2s+IGV2ZW50IGZyb20gYWRkaW5nIGFub3RoZXIgY3Vyc29yLlxuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfVxuXG4gICAgdGhpcy5fY2xlYXJTdWdnZXN0aW9uKCk7XG4gIH1cblxuICBfb25LZXlEb3duKGV2ZW50OiBTeW50aGV0aWNLZXlib2FyZEV2ZW50KTogdm9pZCB7XG4gICAgLy8gU2hvdyB0aGUgc3VnZ2VzdGlvbiBhdCB0aGUgbGFzdCBrbm93biBtb3VzZSBwb3NpdGlvbi5cbiAgICBpZiAodGhpcy5faXNIeXBlcmNsaWNrRXZlbnQoZXZlbnQpKSB7XG4gICAgICB0aGlzLl9zZXRTdWdnZXN0aW9uRm9yTGFzdE1vdXNlRXZlbnQoKTtcbiAgICB9XG4gIH1cblxuICBfb25LZXlVcChldmVudDogU3ludGhldGljS2V5Ym9hcmRFdmVudCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5faXNIeXBlcmNsaWNrRXZlbnQoZXZlbnQpKSB7XG4gICAgICB0aGlzLl9jbGVhclN1Z2dlc3Rpb24oKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGBQcm9taXNlYCB0aGF0J3MgcmVzb2x2ZWQgd2hlbiB0aGUgbGF0ZXN0IHN1Z2dlc3Rpb24ncyBhdmFpbGFibGUuXG4gICAqL1xuICBnZXRTdWdnZXN0aW9uQXRNb3VzZSgpOiBQcm9taXNlPD9IeXBlcmNsaWNrU3VnZ2VzdGlvbj4ge1xuICAgIHJldHVybiB0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2VQcm9taXNlIHx8IFByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgfVxuXG4gIGFzeW5jIF9zZXRTdWdnZXN0aW9uRm9yTGFzdE1vdXNlRXZlbnQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLl9sYXN0TW91c2VFdmVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHBvc2l0aW9uID0gdGhpcy5fZ2V0TW91c2VQb3NpdGlvbkFzQnVmZmVyUG9zaXRpb24oKTtcblxuICAgIGlmICh0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2UgIT0gbnVsbCkge1xuICAgICAgY29uc3Qge3JhbmdlfSA9IHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZTtcbiAgICAgIGludmFyaWFudChyYW5nZSwgJ0h5cGVyY2xpY2sgcmVzdWx0IG11c3QgaGF2ZSBhIHZhbGlkIFJhbmdlJyk7XG4gICAgICBpZiAodGhpcy5faXNQb3NpdGlvbkluUmFuZ2UocG9zaXRpb24sIHJhbmdlKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIC8vIHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZSB3aWxsIG9ubHkgYmUgc2V0IGlmIGh5cGVyY2xpY2sgcmV0dXJuZWQgYSBwcm9taXNlIHRoYXRcbiAgICAvLyByZXNvbHZlZCB0byBhIG5vbi1udWxsIHZhbHVlLiBTbywgaW4gb3JkZXIgdG8gbm90IGFzayBoeXBlcmNsaWNrIGZvciB0aGUgc2FtZSB0aGluZ1xuICAgIC8vIGFnYWluIGFuZCBhZ2FpbiB3aGljaCB3aWxsIGJlIGFueXdheSBudWxsLCB3ZSBjaGVjayBpZiB0aGUgbW91c2UgcG9zaXRpb24gaGFzIGNoYW5nZWQuXG4gICAgaWYgKHRoaXMuX2xhc3RQb3NpdGlvbiAmJiBwb3NpdGlvbi5jb21wYXJlKHRoaXMuX2xhc3RQb3NpdGlvbikgPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9pc0xvYWRpbmcgPSB0cnVlO1xuXG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuX2xhc3RQb3NpdGlvbiA9IHBvc2l0aW9uO1xuICAgICAgdGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlUHJvbWlzZSA9XG4gICAgICAgICAgdGhpcy5faHlwZXJjbGljay5nZXRTdWdnZXN0aW9uKHRoaXMuX3RleHRFZGl0b3IsIHBvc2l0aW9uKTtcbiAgICAgIHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZSA9IGF3YWl0IHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZVByb21pc2U7XG4gICAgICBpZiAodGhpcy5faXNEZXN0cm95ZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZSAmJiB0aGlzLl9pc01vdXNlQXRMYXN0U3VnZ2VzdGlvbigpKSB7XG4gICAgICAgIC8vIEFkZCB0aGUgaHlwZXJjbGljayBtYXJrZXJzIGlmIHRoZXJlJ3MgYSBuZXcgc3VnZ2VzdGlvbiBhbmQgaXQncyB1bmRlciB0aGUgbW91c2UuXG4gICAgICAgIHRoaXMuX3VwZGF0ZU5hdmlnYXRpb25NYXJrZXJzKHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZS5yYW5nZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBSZW1vdmUgYWxsIHRoZSBtYXJrZXJzIGlmIHdlJ3ZlIGZpbmlzaGVkIGxvYWRpbmcgYW5kIHRoZXJlJ3Mgbm8gc3VnZ2VzdGlvbi5cbiAgICAgICAgdGhpcy5fdXBkYXRlTmF2aWdhdGlvbk1hcmtlcnMobnVsbCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZ2V0dGluZyBIeXBlcmNsaWNrIHN1Z2dlc3Rpb246JywgZSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMuX2RvbmVMb2FkaW5nKCk7XG4gICAgfVxuICB9XG5cbiAgX2dldE1vdXNlUG9zaXRpb25Bc0J1ZmZlclBvc2l0aW9uKCk6IGF0b20kUG9pbnQge1xuICAgIGNvbnN0IHtjb21wb25lbnR9ID0gdGhpcy5fdGV4dEVkaXRvclZpZXc7XG4gICAgaW52YXJpYW50KGNvbXBvbmVudCk7XG4gICAgaW52YXJpYW50KHRoaXMuX2xhc3RNb3VzZUV2ZW50KTtcbiAgICBjb25zdCBzY3JlZW5Qb3NpdGlvbiA9IGNvbXBvbmVudC5zY3JlZW5Qb3NpdGlvbkZvck1vdXNlRXZlbnQodGhpcy5fbGFzdE1vdXNlRXZlbnQpO1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gdGhpcy5fdGV4dEVkaXRvci5idWZmZXJQb3NpdGlvbkZvclNjcmVlblBvc2l0aW9uKHNjcmVlblBvc2l0aW9uKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgLy8gRml4IGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9udWNsaWRlL2lzc3Vlcy8yOTJcbiAgICAgIC8vIFdoZW4gbmF2aWdhdGluZyBBdG9tIHdvcmtzcGFjZSB3aXRoIGBDTUQvQ1RSTGAgZG93bixcbiAgICAgIC8vIGl0IHRyaWdnZXJzIFRleHRFZGl0b3JFbGVtZW50J3MgYG1vdXNlbW92ZWAgd2l0aCBpbnZhbGlkIHNjcmVlbiBwb3NpdGlvbi5cbiAgICAgIC8vIFRoaXMgZmFsbHMgYmFjayB0byByZXR1cm5pbmcgdGhlIHN0YXJ0IG9mIHRoZSBlZGl0b3IuXG4gICAgICBjb25zb2xlLmVycm9yKCdIeXBlcmNsaWNrOiBFcnJvciBnZXR0aW5nIGJ1ZmZlciBwb3NpdGlvbiBmb3Igc2NyZWVuIHBvc2l0aW9uOicsIGVycm9yKTtcbiAgICAgIHJldHVybiBuZXcgUG9pbnQoMCwgMCk7XG4gICAgfVxuICB9XG5cbiAgX2lzTW91c2VBdExhc3RTdWdnZXN0aW9uKCk6IGJvb2xlYW4ge1xuICAgIGlmICghdGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGNvbnN0IHtyYW5nZX0gPSB0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2U7XG4gICAgaW52YXJpYW50KHJhbmdlLCAnSHlwZXJjbGljayByZXN1bHQgbXVzdCBoYXZlIGEgdmFsaWQgUmFuZ2UnKTtcbiAgICByZXR1cm4gdGhpcy5faXNQb3NpdGlvbkluUmFuZ2UodGhpcy5fZ2V0TW91c2VQb3NpdGlvbkFzQnVmZmVyUG9zaXRpb24oKSwgcmFuZ2UpO1xuICB9XG5cbiAgX2lzTW91c2VBdExhc3RXb3JkUmFuZ2UoKTogYm9vbGVhbiB7XG4gICAgY29uc3QgbGFzdFdvcmRSYW5nZSA9IHRoaXMuX2xhc3RXb3JkUmFuZ2U7XG4gICAgaWYgKGxhc3RXb3JkUmFuZ2UgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5faXNQb3NpdGlvbkluUmFuZ2UodGhpcy5fZ2V0TW91c2VQb3NpdGlvbkFzQnVmZmVyUG9zaXRpb24oKSwgbGFzdFdvcmRSYW5nZSk7XG4gIH1cblxuICBfaXNQb3NpdGlvbkluUmFuZ2UocG9zaXRpb246IGF0b20kUG9pbnQsIHJhbmdlOiBhdG9tJFJhbmdlIHwgQXJyYXk8YXRvbSRSYW5nZT4pOiBib29sZWFuIHtcbiAgICByZXR1cm4gKEFycmF5LmlzQXJyYXkocmFuZ2UpXG4gICAgICAgID8gcmFuZ2Uuc29tZShyID0+IHIuY29udGFpbnNQb2ludChwb3NpdGlvbikpXG4gICAgICAgIDogcmFuZ2UuY29udGFpbnNQb2ludChwb3NpdGlvbikpO1xuICB9XG5cbiAgX2NsZWFyU3VnZ2VzdGlvbigpOiB2b2lkIHtcbiAgICB0aGlzLl9kb25lTG9hZGluZygpO1xuICAgIHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZVByb21pc2UgPSBudWxsO1xuICAgIHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZSA9IG51bGw7XG4gICAgdGhpcy5fdXBkYXRlTmF2aWdhdGlvbk1hcmtlcnMobnVsbCk7XG4gIH1cblxuICBhc3luYyBfY29uZmlybVN1Z2dlc3Rpb25BdEN1cnNvcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBzdWdnZXN0aW9uID0gYXdhaXQgdGhpcy5faHlwZXJjbGljay5nZXRTdWdnZXN0aW9uKFxuICAgICAgICB0aGlzLl90ZXh0RWRpdG9yLFxuICAgICAgICB0aGlzLl90ZXh0RWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkpO1xuICAgIGlmIChzdWdnZXN0aW9uKSB7XG4gICAgICB0aGlzLl9jb25maXJtU3VnZ2VzdGlvbihzdWdnZXN0aW9uKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkIG1hcmtlcnMgZm9yIHRoZSBnaXZlbiByYW5nZShzKSwgb3IgY2xlYXJzIHRoZW0gaWYgYHJhbmdlc2AgaXMgbnVsbC5cbiAgICovXG4gIF91cGRhdGVOYXZpZ2F0aW9uTWFya2VycyhyYW5nZTogPyAoYXRvbSRSYW5nZSB8IEFycmF5PGF0b20kUmFuZ2U+KSk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9uYXZpZ2F0aW9uTWFya2Vycykge1xuICAgICAgdGhpcy5fbmF2aWdhdGlvbk1hcmtlcnMuZm9yRWFjaChtYXJrZXIgPT4gbWFya2VyLmRlc3Ryb3koKSk7XG4gICAgICB0aGlzLl9uYXZpZ2F0aW9uTWFya2VycyA9IG51bGw7XG4gICAgfVxuXG4gICAgLy8gT25seSBjaGFuZ2UgdGhlIGN1cnNvciB0byBhIHBvaW50ZXIgaWYgdGhlcmUgaXMgYSBzdWdnZXN0aW9uIHJlYWR5LlxuICAgIGlmIChyYW5nZSA9PSBudWxsKSB7XG4gICAgICB0aGlzLl90ZXh0RWRpdG9yVmlldy5jbGFzc0xpc3QucmVtb3ZlKCdoeXBlcmNsaWNrJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fdGV4dEVkaXRvclZpZXcuY2xhc3NMaXN0LmFkZCgnaHlwZXJjbGljaycpO1xuICAgIGNvbnN0IHJhbmdlcyA9IEFycmF5LmlzQXJyYXkocmFuZ2UpID8gcmFuZ2UgOiBbcmFuZ2VdO1xuICAgIHRoaXMuX25hdmlnYXRpb25NYXJrZXJzID0gcmFuZ2VzLm1hcChtYXJrZXJSYW5nZSA9PiB7XG4gICAgICBjb25zdCBtYXJrZXIgPSB0aGlzLl90ZXh0RWRpdG9yLm1hcmtCdWZmZXJSYW5nZShtYXJrZXJSYW5nZSwge2ludmFsaWRhdGU6ICduZXZlcid9KTtcbiAgICAgIHRoaXMuX3RleHRFZGl0b3IuZGVjb3JhdGVNYXJrZXIoXG4gICAgICAgIG1hcmtlcixcbiAgICAgICAge3R5cGU6ICdoaWdobGlnaHQnLCBjbGFzczogJ2h5cGVyY2xpY2snfSxcbiAgICAgICk7XG4gICAgICByZXR1cm4gbWFya2VyO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgd2hldGhlciBhbiBldmVudCBzaG91bGQgYmUgaGFuZGxlZCBieSBoeXBlcmNsaWNrIG9yIG5vdC5cbiAgICovXG4gIF9pc0h5cGVyY2xpY2tFdmVudChldmVudDogU3ludGhldGljS2V5Ym9hcmRFdmVudCB8IE1vdXNlRXZlbnQpOiBib29sZWFuIHtcbiAgICAvLyBJZiB0aGUgdXNlciBpcyBwcmVzc2luZyBlaXRoZXIgdGhlIG1ldGEvY3RybCBrZXkgb3IgdGhlIGFsdCBrZXkuXG4gICAgcmV0dXJuIHByb2Nlc3MucGxhdGZvcm0gPT09ICdkYXJ3aW4nID8gZXZlbnQubWV0YUtleSA6IGV2ZW50LmN0cmxLZXk7XG4gIH1cblxuICBfZG9uZUxvYWRpbmcoKTogdm9pZCB7XG4gICAgdGhpcy5faXNMb2FkaW5nID0gZmFsc2U7XG4gICAgdGhpcy5fdGV4dEVkaXRvclZpZXcuY2xhc3NMaXN0LnJlbW92ZSgnaHlwZXJjbGljay1sb2FkaW5nJyk7XG4gIH1cblxuICBkaXNwb3NlKCkge1xuICAgIHRoaXMuX2lzRGVzdHJveWVkID0gdHJ1ZTtcbiAgICB0aGlzLl9jbGVhclN1Z2dlc3Rpb24oKTtcbiAgICAvLyAkRmxvd0ZpeE1lIChtb3N0KVxuICAgIHRoaXMuX3RleHRFZGl0b3JWaWV3LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMuX29uTW91c2VNb3ZlKTtcbiAgICAvLyAkRmxvd0ZpeE1lIChtb3N0KVxuICAgIHRoaXMuX3RleHRFZGl0b3JWaWV3LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLl9vbktleURvd24pO1xuICAgIC8vICRGbG93Rml4TWUgKG1vc3QpXG4gICAgdGhpcy5fdGV4dEVkaXRvclZpZXcucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLl9vbktleVVwKTtcbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKTtcbiAgfVxufVxuIl19