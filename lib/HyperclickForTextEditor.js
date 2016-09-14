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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hc3VhcmV6L0Rvd25sb2Fkcy9oeXBlcmNsaWNrL2xpYi9IeXBlcmNsaWNrRm9yVGV4dEVkaXRvci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztvQkFjcUQsTUFBTTs7K0JBQ3pCLG9CQUFvQjs7c0JBQ2hDLFFBQVE7Ozs7Ozs7O0FBaEI5QixXQUFXLENBQUM7O0lBc0JTLHVCQUF1QjtBQWtCL0IsV0FsQlEsdUJBQXVCLENBa0I5QixVQUEyQixFQUFFLFVBQXNCLEVBQUU7OzswQkFsQjlDLHVCQUF1Qjs7QUFtQnhDLFFBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDO0FBQzlCLFFBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7O0FBRXRELFFBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDOztBQUU5QixRQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQztBQUM1QixRQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQzs7O0FBRzFCLFFBQUksQ0FBQyw2QkFBNkIsR0FBRyxJQUFJLENBQUM7O0FBRTFDLFFBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLENBQUM7QUFDbkMsUUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQzs7QUFFL0IsUUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7QUFDM0IsUUFBSSxDQUFDLGNBQWMsR0FBRywrQkFBeUIsQ0FBQzs7QUFFaEQsUUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNqRCxRQUFJLENBQUMsZUFBZSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDdEUsUUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENB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QUMsVUFBVSxHQUFHLEtBQUssQ0FBQztBQUN4QixVQUFJLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsb0JBQW9CLENBQUMsQ0FBQztLQUM3RDs7O1dBRU0sbUJBQUc7QUFDUixVQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztBQUN6QixVQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQzs7QUFFeEIsVUFBSSxDQUFDLGVBQWUsQ0FBQyxtQkFBbUIsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDOztBQUV6RSxVQUFJLENBQUMsZUFBZSxDQUFDLG1CQUFtQixDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7O0FBRXJFLFVBQUksQ0FBQyxlQUFlLENBQUMsbUJBQW1CLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNqRSxVQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxDQUFDO0tBQy9COzs7U0F2VGtCLHVCQUF1Qjs7O3FCQUF2Qix1QkFBdUIiLCJmaWxlIjoiL1VzZXJzL2FzdWFyZXovRG93bmxvYWRzL2h5cGVyY2xpY2svbGliL0h5cGVyY2xpY2tGb3JUZXh0RWRpdG9yLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxuaW1wb3J0IHR5cGUge0h5cGVyY2xpY2tTdWdnZXN0aW9ufSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB0eXBlIEh5cGVyY2xpY2sgZnJvbSAnLi9IeXBlcmNsaWNrJztcblxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBQb2ludH0gZnJvbSAnYXRvbSc7XG5pbXBvcnQge2dldFdvcmRUZXh0QW5kUmFuZ2V9IGZyb20gJy4vaHlwZXJjbGljay11dGlscyc7XG5pbXBvcnQgaW52YXJpYW50IGZyb20gJ2Fzc2VydCc7XG5cbi8qKlxuICogQ29uc3RydWN0IHRoaXMgb2JqZWN0IHRvIGVuYWJsZSBIeXBlcmNsaWNrIGluIGEgdGV4dCBlZGl0b3IuXG4gKiBDYWxsIGBkaXNwb3NlYCB0byBkaXNhYmxlIHRoZSBmZWF0dXJlLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBIeXBlcmNsaWNrRm9yVGV4dEVkaXRvciB7XG4gIF90ZXh0RWRpdG9yOiBhdG9tJFRleHRFZGl0b3I7XG4gIF90ZXh0RWRpdG9yVmlldzogYXRvbSRUZXh0RWRpdG9yRWxlbWVudDtcbiAgX2h5cGVyY2xpY2s6IEh5cGVyY2xpY2s7XG4gIF9sYXN0TW91c2VFdmVudDogP01vdXNlRXZlbnQ7XG4gIF9sYXN0UG9zaXRpb246ID9hdG9tJFBvaW50O1xuICBfbGFzdFN1Z2dlc3Rpb25BdE1vdXNlUHJvbWlzZTogP1Byb21pc2U8SHlwZXJjbGlja1N1Z2dlc3Rpb24+O1xuICBfbGFzdFN1Z2dlc3Rpb25BdE1vdXNlOiA/SHlwZXJjbGlja1N1Z2dlc3Rpb247XG4gIF9uYXZpZ2F0aW9uTWFya2VyczogP0FycmF5PGF0b20kTWFya2VyPjtcbiAgX2xhc3RXb3JkUmFuZ2U6ID9hdG9tJFJhbmdlO1xuICBfb25Nb3VzZU1vdmU6IChldmVudDogTW91c2VFdmVudCkgPT4gdm9pZDtcbiAgX29uTW91c2VEb3duOiAoZXZlbnQ6IE1vdXNlRXZlbnQpID0+IHZvaWQ7XG4gIF9vbktleURvd246IChldmVudDogU3ludGhldGljS2V5Ym9hcmRFdmVudCkgPT4gdm9pZDtcbiAgX29uS2V5VXA6IChldmVudDogU3ludGhldGljS2V5Ym9hcmRFdmVudCkgPT4gdm9pZDtcbiAgX3N1YnNjcmlwdGlvbnM6IGF0b20kQ29tcG9zaXRlRGlzcG9zYWJsZTtcbiAgX2lzRGVzdHJveWVkOiBib29sZWFuO1xuICBfaXNMb2FkaW5nOiBib29sZWFuO1xuXG4gIGNvbnN0cnVjdG9yKHRleHRFZGl0b3I6IGF0b20kVGV4dEVkaXRvciwgaHlwZXJjbGljazogSHlwZXJjbGljaykge1xuICAgIHRoaXMuX3RleHRFZGl0b3IgPSB0ZXh0RWRpdG9yO1xuICAgIHRoaXMuX3RleHRFZGl0b3JWaWV3ID0gYXRvbS52aWV3cy5nZXRWaWV3KHRleHRFZGl0b3IpO1xuXG4gICAgdGhpcy5faHlwZXJjbGljayA9IGh5cGVyY2xpY2s7XG5cbiAgICB0aGlzLl9sYXN0TW91c2VFdmVudCA9IG51bGw7XG4gICAgdGhpcy5fbGFzdFBvc2l0aW9uID0gbnVsbDtcbiAgICAvLyBXZSBzdG9yZSB0aGUgb3JpZ2luYWwgcHJvbWlzZSB0aGF0IHdlIHVzZSB0byByZXRyaWV2ZSB0aGUgbGFzdCBzdWdnZXN0aW9uXG4gICAgLy8gc28gY2FsbGVycyBjYW4gYWxzbyBhd2FpdCBpdCB0byBrbm93IHdoZW4gaXQncyBhdmFpbGFibGUuXG4gICAgdGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlUHJvbWlzZSA9IG51bGw7XG4gICAgLy8gV2Ugc3RvcmUgdGhlIGxhc3Qgc3VnZ2VzdGlvbiBzaW5jZSB3ZSBtdXN0IGF3YWl0IGl0IGltbWVkaWF0ZWx5IGFueXdheS5cbiAgICB0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2UgPSBudWxsO1xuICAgIHRoaXMuX25hdmlnYXRpb25NYXJrZXJzID0gbnVsbDtcblxuICAgIHRoaXMuX2xhc3RXb3JkUmFuZ2UgPSBudWxsO1xuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuXG4gICAgdGhpcy5fb25Nb3VzZU1vdmUgPSB0aGlzLl9vbk1vdXNlTW92ZS5iaW5kKHRoaXMpO1xuICAgIHRoaXMuX3RleHRFZGl0b3JWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMuX29uTW91c2VNb3ZlKTtcbiAgICB0aGlzLl9vbk1vdXNlRG93biA9IHRoaXMuX29uTW91c2VEb3duLmJpbmQodGhpcyk7XG4gICAgdGhpcy5fc2V0dXBNb3VzZURvd25MaXN0ZW5lcigpO1xuXG4gICAgdGhpcy5fb25LZXlEb3duID0gdGhpcy5fb25LZXlEb3duLmJpbmQodGhpcyk7XG4gICAgdGhpcy5fdGV4dEVkaXRvclZpZXcuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuX29uS2V5RG93bik7XG4gICAgdGhpcy5fb25LZXlVcCA9IHRoaXMuX29uS2V5VXAuYmluZCh0aGlzKTtcbiAgICB0aGlzLl90ZXh0RWRpdG9yVmlldy5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIHRoaXMuX29uS2V5VXApO1xuXG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb21tYW5kcy5hZGQodGhpcy5fdGV4dEVkaXRvclZpZXcsIHtcbiAgICAgICdoeXBlcmNsaWNrOmNvbmZpcm0tY3Vyc29yJzogKCkgPT4gdGhpcy5fY29uZmlybVN1Z2dlc3Rpb25BdEN1cnNvcigpLFxuICAgIH0pKTtcblxuICAgIHRoaXMuX2lzRGVzdHJveWVkID0gZmFsc2U7XG4gICAgdGhpcy5faXNMb2FkaW5nID0gZmFsc2U7XG4gIH1cblxuICBfc2V0dXBNb3VzZURvd25MaXN0ZW5lcigpOiB2b2lkIHtcbiAgICBjb25zdCBnZXRMaW5lc0RvbU5vZGUgPSAoKTogSFRNTEVsZW1lbnQgPT4ge1xuICAgICAgY29uc3Qge2NvbXBvbmVudH0gPSB0aGlzLl90ZXh0RWRpdG9yVmlldztcbiAgICAgIGludmFyaWFudChjb21wb25lbnQpO1xuICAgICAgcmV0dXJuIGNvbXBvbmVudC5saW5lc0NvbXBvbmVudC5nZXREb21Ob2RlKCk7XG4gICAgfTtcbiAgICBjb25zdCByZW1vdmVNb3VzZURvd25MaXN0ZW5lciA9ICgpID0+IHtcbiAgICAgIGlmICh0aGlzLl90ZXh0RWRpdG9yVmlldy5jb21wb25lbnQgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICAvLyAkRmxvd0ZpeE1lIChtb3N0KVxuICAgICAgZ2V0TGluZXNEb21Ob2RlKCkucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fb25Nb3VzZURvd24pO1xuICAgIH07XG4gICAgY29uc3QgYWRkTW91c2VEb3duTGlzdGVuZXIgPSAoKSA9PiB7XG4gICAgICBnZXRMaW5lc0RvbU5vZGUoKS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLl9vbk1vdXNlRG93bik7XG4gICAgfTtcbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zLmFkZChuZXcgRGlzcG9zYWJsZShyZW1vdmVNb3VzZURvd25MaXN0ZW5lcikpO1xuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMuYWRkKHRoaXMuX3RleHRFZGl0b3JWaWV3Lm9uRGlkRGV0YWNoKHJlbW92ZU1vdXNlRG93bkxpc3RlbmVyKSk7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5fdGV4dEVkaXRvclZpZXcub25EaWRBdHRhY2goYWRkTW91c2VEb3duTGlzdGVuZXIpKTtcbiAgICBhZGRNb3VzZURvd25MaXN0ZW5lcigpO1xuICB9XG5cbiAgX2NvbmZpcm1TdWdnZXN0aW9uKHN1Z2dlc3Rpb246IEh5cGVyY2xpY2tTdWdnZXN0aW9uKTogdm9pZCB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoc3VnZ2VzdGlvbi5jYWxsYmFjaykgJiYgc3VnZ2VzdGlvbi5jYWxsYmFjay5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLl9oeXBlcmNsaWNrLnNob3dTdWdnZXN0aW9uTGlzdCh0aGlzLl90ZXh0RWRpdG9yLCBzdWdnZXN0aW9uKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaW52YXJpYW50KHR5cGVvZiBzdWdnZXN0aW9uLmNhbGxiYWNrID09PSAnZnVuY3Rpb24nKTtcbiAgICAgIHN1Z2dlc3Rpb24uY2FsbGJhY2soKTtcbiAgICB9XG4gIH1cblxuICBfb25Nb3VzZU1vdmUoZXZlbnQ6IE1vdXNlRXZlbnQpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5faXNMb2FkaW5nKSB7XG4gICAgICAvLyBTaG93IHRoZSBsb2FkaW5nIGN1cnNvci5cbiAgICAgIHRoaXMuX3RleHRFZGl0b3JWaWV3LmNsYXNzTGlzdC5hZGQoJ2h5cGVyY2xpY2stbG9hZGluZycpO1xuICAgIH1cblxuICAgIC8vIFdlIHNhdmUgdGhlIGxhc3QgYE1vdXNlRXZlbnRgIHNvIHRoZSB1c2VyIGNhbiB0cmlnZ2VyIEh5cGVyY2xpY2sgYnlcbiAgICAvLyBwcmVzc2luZyB0aGUga2V5IHdpdGhvdXQgbW92aW5nIHRoZSBtb3VzZSBhZ2Fpbi4gV2Ugb25seSBzYXZlIHRoZVxuICAgIC8vIHJlbGV2YW50IHByb3BlcnRpZXMgdG8gcHJldmVudCByZXRhaW5pbmcgYSByZWZlcmVuY2UgdG8gdGhlIGV2ZW50LlxuICAgIHRoaXMuX2xhc3RNb3VzZUV2ZW50ID0gKHtcbiAgICAgIGNsaWVudFg6IGV2ZW50LmNsaWVudFgsXG4gICAgICBjbGllbnRZOiBldmVudC5jbGllbnRZLFxuICAgIH06IGFueSk7XG5cblxuICAgIC8vIERvbid0IGZldGNoIHN1Z2dlc3Rpb25zIGlmIHRoZSBtb3VzZSBpcyBzdGlsbCBpbiB0aGUgc2FtZSAnd29yZCcsIHdoZXJlXG4gICAgLy8gJ3dvcmQnIGlzIGEgd2hpdGVzcGFjZS1kZWxpbWl0ZWQgZ3JvdXAgb2YgY2hhcmFjdGVycy5cbiAgICAvL1xuICAgIC8vIElmIHRoZSBsYXN0IHN1Z2dlc3Rpb24gaGFkIG11bHRpcGxlIHJhbmdlcywgd2UgaGF2ZSBubyBjaG9pY2UgYnV0IHRvXG4gICAgLy8gZmV0Y2ggc3VnZ2VzdGlvbnMgYmVjYXVzZSB0aGUgbmV3IHdvcmQgbWlnaHQgYmUgYmV0d2VlbiB0aG9zZSByYW5nZXMuXG4gICAgLy8gVGhpcyBzaG91bGQgYmUgb2sgYmVjYXVzZSBpdCB3aWxsIHJldXNlIHRoYXQgbGFzdCBzdWdnZXN0aW9uIHVudGlsIHRoZVxuICAgIC8vIG1vdXNlIG1vdmVzIG9mZiBvZiBpdC5cbiAgICBjb25zdCBsYXN0U3VnZ2VzdGlvbklzTm90TXVsdGlSYW5nZSA9ICF0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2UgfHxcbiAgICAgICAgIUFycmF5LmlzQXJyYXkodGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlLnJhbmdlKTtcbiAgICBpZiAodGhpcy5faXNNb3VzZUF0TGFzdFdvcmRSYW5nZSgpICYmIGxhc3RTdWdnZXN0aW9uSXNOb3RNdWx0aVJhbmdlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHtyYW5nZX0gPSBnZXRXb3JkVGV4dEFuZFJhbmdlKHRoaXMuX3RleHRFZGl0b3IsIHRoaXMuX2dldE1vdXNlUG9zaXRpb25Bc0J1ZmZlclBvc2l0aW9uKCkpO1xuICAgIHRoaXMuX2xhc3RXb3JkUmFuZ2UgPSByYW5nZTtcblxuICAgIGlmICh0aGlzLl9pc0h5cGVyY2xpY2tFdmVudChldmVudCkpIHtcbiAgICAgIC8vIENsZWFyIHRoZSBzdWdnZXN0aW9uIGlmIHRoZSBtb3VzZSBtb3ZlZCBvdXQgb2YgdGhlIHJhbmdlLlxuICAgICAgaWYgKCF0aGlzLl9pc01vdXNlQXRMYXN0U3VnZ2VzdGlvbigpKSB7XG4gICAgICAgIHRoaXMuX2NsZWFyU3VnZ2VzdGlvbigpO1xuICAgICAgfVxuICAgICAgdGhpcy5fc2V0U3VnZ2VzdGlvbkZvckxhc3RNb3VzZUV2ZW50KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2NsZWFyU3VnZ2VzdGlvbigpO1xuICAgIH1cbiAgfVxuXG4gIF9vbk1vdXNlRG93bihldmVudDogTW91c2VFdmVudCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5faXNIeXBlcmNsaWNrRXZlbnQoZXZlbnQpIHx8ICF0aGlzLl9pc01vdXNlQXRMYXN0U3VnZ2VzdGlvbigpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZSkge1xuICAgICAgdGhpcy5fY29uZmlybVN1Z2dlc3Rpb24odGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlKTtcbiAgICAgIC8vIFByZXZlbnQgdGhlIDxtZXRhLWNsaWNrPiBldmVudCBmcm9tIGFkZGluZyBhbm90aGVyIGN1cnNvci5cbiAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH1cblxuICAgIHRoaXMuX2NsZWFyU3VnZ2VzdGlvbigpO1xuICB9XG5cbiAgX29uS2V5RG93bihldmVudDogU3ludGhldGljS2V5Ym9hcmRFdmVudCk6IHZvaWQge1xuICAgIC8vIFNob3cgdGhlIHN1Z2dlc3Rpb24gYXQgdGhlIGxhc3Qga25vd24gbW91c2UgcG9zaXRpb24uXG4gICAgaWYgKHRoaXMuX2lzSHlwZXJjbGlja0V2ZW50KGV2ZW50KSkge1xuICAgICAgdGhpcy5fc2V0U3VnZ2VzdGlvbkZvckxhc3RNb3VzZUV2ZW50KCk7XG4gICAgfVxuICB9XG5cbiAgX29uS2V5VXAoZXZlbnQ6IFN5bnRoZXRpY0tleWJvYXJkRXZlbnQpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuX2lzSHlwZXJjbGlja0V2ZW50KGV2ZW50KSkge1xuICAgICAgdGhpcy5fY2xlYXJTdWdnZXN0aW9uKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBgUHJvbWlzZWAgdGhhdCdzIHJlc29sdmVkIHdoZW4gdGhlIGxhdGVzdCBzdWdnZXN0aW9uJ3MgYXZhaWxhYmxlLlxuICAgKi9cbiAgZ2V0U3VnZ2VzdGlvbkF0TW91c2UoKTogUHJvbWlzZTw/SHlwZXJjbGlja1N1Z2dlc3Rpb24+IHtcbiAgICByZXR1cm4gdGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlUHJvbWlzZSB8fCBQcm9taXNlLnJlc29sdmUobnVsbCk7XG4gIH1cblxuICBhc3luYyBfc2V0U3VnZ2VzdGlvbkZvckxhc3RNb3VzZUV2ZW50KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy5fbGFzdE1vdXNlRXZlbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwb3NpdGlvbiA9IHRoaXMuX2dldE1vdXNlUG9zaXRpb25Bc0J1ZmZlclBvc2l0aW9uKCk7XG5cbiAgICBpZiAodGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlICE9IG51bGwpIHtcbiAgICAgIGNvbnN0IHtyYW5nZX0gPSB0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2U7XG4gICAgICBpbnZhcmlhbnQocmFuZ2UsICdIeXBlcmNsaWNrIHJlc3VsdCBtdXN0IGhhdmUgYSB2YWxpZCBSYW5nZScpO1xuICAgICAgaWYgKHRoaXMuX2lzUG9zaXRpb25JblJhbmdlKHBvc2l0aW9uLCByYW5nZSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyB0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2Ugd2lsbCBvbmx5IGJlIHNldCBpZiBoeXBlcmNsaWNrIHJldHVybmVkIGEgcHJvbWlzZSB0aGF0XG4gICAgLy8gcmVzb2x2ZWQgdG8gYSBub24tbnVsbCB2YWx1ZS4gU28sIGluIG9yZGVyIHRvIG5vdCBhc2sgaHlwZXJjbGljayBmb3IgdGhlIHNhbWUgdGhpbmdcbiAgICAvLyBhZ2FpbiBhbmQgYWdhaW4gd2hpY2ggd2lsbCBiZSBhbnl3YXkgbnVsbCwgd2UgY2hlY2sgaWYgdGhlIG1vdXNlIHBvc2l0aW9uIGhhcyBjaGFuZ2VkLlxuICAgIGlmICh0aGlzLl9sYXN0UG9zaXRpb24gJiYgcG9zaXRpb24uY29tcGFyZSh0aGlzLl9sYXN0UG9zaXRpb24pID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5faXNMb2FkaW5nID0gdHJ1ZTtcblxuICAgIHRyeSB7XG4gICAgICB0aGlzLl9sYXN0UG9zaXRpb24gPSBwb3NpdGlvbjtcbiAgICAgIHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZVByb21pc2UgPVxuICAgICAgICAgIHRoaXMuX2h5cGVyY2xpY2suZ2V0U3VnZ2VzdGlvbih0aGlzLl90ZXh0RWRpdG9yLCBwb3NpdGlvbik7XG4gICAgICB0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2UgPSBhd2FpdCB0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2VQcm9taXNlO1xuICAgICAgaWYgKHRoaXMuX2lzRGVzdHJveWVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2UgJiYgdGhpcy5faXNNb3VzZUF0TGFzdFN1Z2dlc3Rpb24oKSkge1xuICAgICAgICAvLyBBZGQgdGhlIGh5cGVyY2xpY2sgbWFya2VycyBpZiB0aGVyZSdzIGEgbmV3IHN1Z2dlc3Rpb24gYW5kIGl0J3MgdW5kZXIgdGhlIG1vdXNlLlxuICAgICAgICB0aGlzLl91cGRhdGVOYXZpZ2F0aW9uTWFya2Vycyh0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2UucmFuZ2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gUmVtb3ZlIGFsbCB0aGUgbWFya2VycyBpZiB3ZSd2ZSBmaW5pc2hlZCBsb2FkaW5nIGFuZCB0aGVyZSdzIG5vIHN1Z2dlc3Rpb24uXG4gICAgICAgIHRoaXMuX3VwZGF0ZU5hdmlnYXRpb25NYXJrZXJzKG51bGwpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGdldHRpbmcgSHlwZXJjbGljayBzdWdnZXN0aW9uOicsIGUpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLl9kb25lTG9hZGluZygpO1xuICAgIH1cbiAgfVxuXG4gIF9nZXRNb3VzZVBvc2l0aW9uQXNCdWZmZXJQb3NpdGlvbigpOiBhdG9tJFBvaW50IHtcbiAgICBjb25zdCB7Y29tcG9uZW50fSA9IHRoaXMuX3RleHRFZGl0b3JWaWV3O1xuICAgIGludmFyaWFudChjb21wb25lbnQpO1xuICAgIGludmFyaWFudCh0aGlzLl9sYXN0TW91c2VFdmVudCk7XG4gICAgY29uc3Qgc2NyZWVuUG9zaXRpb24gPSBjb21wb25lbnQuc2NyZWVuUG9zaXRpb25Gb3JNb3VzZUV2ZW50KHRoaXMuX2xhc3RNb3VzZUV2ZW50KTtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIHRoaXMuX3RleHRFZGl0b3IuYnVmZmVyUG9zaXRpb25Gb3JTY3JlZW5Qb3NpdGlvbihzY3JlZW5Qb3NpdGlvbik7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIC8vIEZpeCBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svbnVjbGlkZS9pc3N1ZXMvMjkyXG4gICAgICAvLyBXaGVuIG5hdmlnYXRpbmcgQXRvbSB3b3Jrc3BhY2Ugd2l0aCBgQ01EL0NUUkxgIGRvd24sXG4gICAgICAvLyBpdCB0cmlnZ2VycyBUZXh0RWRpdG9yRWxlbWVudCdzIGBtb3VzZW1vdmVgIHdpdGggaW52YWxpZCBzY3JlZW4gcG9zaXRpb24uXG4gICAgICAvLyBUaGlzIGZhbGxzIGJhY2sgdG8gcmV0dXJuaW5nIHRoZSBzdGFydCBvZiB0aGUgZWRpdG9yLlxuICAgICAgY29uc29sZS5lcnJvcignSHlwZXJjbGljazogRXJyb3IgZ2V0dGluZyBidWZmZXIgcG9zaXRpb24gZm9yIHNjcmVlbiBwb3NpdGlvbjonLCBlcnJvcik7XG4gICAgICByZXR1cm4gbmV3IFBvaW50KDAsIDApO1xuICAgIH1cbiAgfVxuXG4gIF9pc01vdXNlQXRMYXN0U3VnZ2VzdGlvbigpOiBib29sZWFuIHtcbiAgICBpZiAoIXRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCB7cmFuZ2V9ID0gdGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlO1xuICAgIGludmFyaWFudChyYW5nZSwgJ0h5cGVyY2xpY2sgcmVzdWx0IG11c3QgaGF2ZSBhIHZhbGlkIFJhbmdlJyk7XG4gICAgcmV0dXJuIHRoaXMuX2lzUG9zaXRpb25JblJhbmdlKHRoaXMuX2dldE1vdXNlUG9zaXRpb25Bc0J1ZmZlclBvc2l0aW9uKCksIHJhbmdlKTtcbiAgfVxuXG4gIF9pc01vdXNlQXRMYXN0V29yZFJhbmdlKCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGxhc3RXb3JkUmFuZ2UgPSB0aGlzLl9sYXN0V29yZFJhbmdlO1xuICAgIGlmIChsYXN0V29yZFJhbmdlID09IG51bGwpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2lzUG9zaXRpb25JblJhbmdlKHRoaXMuX2dldE1vdXNlUG9zaXRpb25Bc0J1ZmZlclBvc2l0aW9uKCksIGxhc3RXb3JkUmFuZ2UpO1xuICB9XG5cbiAgX2lzUG9zaXRpb25JblJhbmdlKHBvc2l0aW9uOiBhdG9tJFBvaW50LCByYW5nZTogYXRvbSRSYW5nZSB8IEFycmF5PGF0b20kUmFuZ2U+KTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIChBcnJheS5pc0FycmF5KHJhbmdlKVxuICAgICAgICA/IHJhbmdlLnNvbWUociA9PiByLmNvbnRhaW5zUG9pbnQocG9zaXRpb24pKVxuICAgICAgICA6IHJhbmdlLmNvbnRhaW5zUG9pbnQocG9zaXRpb24pKTtcbiAgfVxuXG4gIF9jbGVhclN1Z2dlc3Rpb24oKTogdm9pZCB7XG4gICAgdGhpcy5fZG9uZUxvYWRpbmcoKTtcbiAgICB0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2VQcm9taXNlID0gbnVsbDtcbiAgICB0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2UgPSBudWxsO1xuICAgIHRoaXMuX3VwZGF0ZU5hdmlnYXRpb25NYXJrZXJzKG51bGwpO1xuICB9XG5cbiAgYXN5bmMgX2NvbmZpcm1TdWdnZXN0aW9uQXRDdXJzb3IoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgc3VnZ2VzdGlvbiA9IGF3YWl0IHRoaXMuX2h5cGVyY2xpY2suZ2V0U3VnZ2VzdGlvbihcbiAgICAgICAgdGhpcy5fdGV4dEVkaXRvcixcbiAgICAgICAgdGhpcy5fdGV4dEVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpKTtcbiAgICBpZiAoc3VnZ2VzdGlvbikge1xuICAgICAgdGhpcy5fY29uZmlybVN1Z2dlc3Rpb24oc3VnZ2VzdGlvbik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBtYXJrZXJzIGZvciB0aGUgZ2l2ZW4gcmFuZ2UocyksIG9yIGNsZWFycyB0aGVtIGlmIGByYW5nZXNgIGlzIG51bGwuXG4gICAqL1xuICBfdXBkYXRlTmF2aWdhdGlvbk1hcmtlcnMocmFuZ2U6ID8gKGF0b20kUmFuZ2UgfCBBcnJheTxhdG9tJFJhbmdlPikpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fbmF2aWdhdGlvbk1hcmtlcnMpIHtcbiAgICAgIHRoaXMuX25hdmlnYXRpb25NYXJrZXJzLmZvckVhY2gobWFya2VyID0+IG1hcmtlci5kZXN0cm95KCkpO1xuICAgICAgdGhpcy5fbmF2aWdhdGlvbk1hcmtlcnMgPSBudWxsO1xuICAgIH1cblxuICAgIC8vIE9ubHkgY2hhbmdlIHRoZSBjdXJzb3IgdG8gYSBwb2ludGVyIGlmIHRoZXJlIGlzIGEgc3VnZ2VzdGlvbiByZWFkeS5cbiAgICBpZiAocmFuZ2UgPT0gbnVsbCkge1xuICAgICAgdGhpcy5fdGV4dEVkaXRvclZpZXcuY2xhc3NMaXN0LnJlbW92ZSgnaHlwZXJjbGljaycpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX3RleHRFZGl0b3JWaWV3LmNsYXNzTGlzdC5hZGQoJ2h5cGVyY2xpY2snKTtcbiAgICBjb25zdCByYW5nZXMgPSBBcnJheS5pc0FycmF5KHJhbmdlKSA/IHJhbmdlIDogW3JhbmdlXTtcbiAgICB0aGlzLl9uYXZpZ2F0aW9uTWFya2VycyA9IHJhbmdlcy5tYXAobWFya2VyUmFuZ2UgPT4ge1xuICAgICAgY29uc3QgbWFya2VyID0gdGhpcy5fdGV4dEVkaXRvci5tYXJrQnVmZmVyUmFuZ2UobWFya2VyUmFuZ2UsIHtpbnZhbGlkYXRlOiAnbmV2ZXInfSk7XG4gICAgICB0aGlzLl90ZXh0RWRpdG9yLmRlY29yYXRlTWFya2VyKFxuICAgICAgICBtYXJrZXIsXG4gICAgICAgIHt0eXBlOiAnaGlnaGxpZ2h0JywgY2xhc3M6ICdoeXBlcmNsaWNrJ30sXG4gICAgICApO1xuICAgICAgcmV0dXJuIG1hcmtlcjtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHdoZXRoZXIgYW4gZXZlbnQgc2hvdWxkIGJlIGhhbmRsZWQgYnkgaHlwZXJjbGljayBvciBub3QuXG4gICAqL1xuICBfaXNIeXBlcmNsaWNrRXZlbnQoZXZlbnQ6IFN5bnRoZXRpY0tleWJvYXJkRXZlbnQgfCBNb3VzZUV2ZW50KTogYm9vbGVhbiB7XG4gICAgLy8gSWYgdGhlIHVzZXIgaXMgcHJlc3NpbmcgZWl0aGVyIHRoZSBtZXRhL2N0cmwga2V5IG9yIHRoZSBhbHQga2V5LlxuICAgIHJldHVybiBwcm9jZXNzLnBsYXRmb3JtID09PSAnZGFyd2luJyA/IGV2ZW50Lm1ldGFLZXkgOiBldmVudC5jdHJsS2V5O1xuICB9XG5cbiAgX2RvbmVMb2FkaW5nKCk6IHZvaWQge1xuICAgIHRoaXMuX2lzTG9hZGluZyA9IGZhbHNlO1xuICAgIHRoaXMuX3RleHRFZGl0b3JWaWV3LmNsYXNzTGlzdC5yZW1vdmUoJ2h5cGVyY2xpY2stbG9hZGluZycpO1xuICB9XG5cbiAgZGlzcG9zZSgpIHtcbiAgICB0aGlzLl9pc0Rlc3Ryb3llZCA9IHRydWU7XG4gICAgdGhpcy5fY2xlYXJTdWdnZXN0aW9uKCk7XG4gICAgLy8gJEZsb3dGaXhNZSAobW9zdClcbiAgICB0aGlzLl90ZXh0RWRpdG9yVmlldy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLl9vbk1vdXNlTW92ZSk7XG4gICAgLy8gJEZsb3dGaXhNZSAobW9zdClcbiAgICB0aGlzLl90ZXh0RWRpdG9yVmlldy5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5fb25LZXlEb3duKTtcbiAgICAvLyAkRmxvd0ZpeE1lIChtb3N0KVxuICAgIHRoaXMuX3RleHRFZGl0b3JWaWV3LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdGhpcy5fb25LZXlVcCk7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5kaXNwb3NlKCk7XG4gIH1cbn1cbiJdfQ==