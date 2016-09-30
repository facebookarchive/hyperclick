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
    this._onContextMenu = this._onContextMenu.bind(this);
    this._textEditorView.addEventListener('contextmenu', this._onContextMenu);

    this._subscriptions.add(atom.commands.add(this._textEditorView, {
      'hyperclick:confirm-cursor': function hyperclickConfirmCursor() {
        return _this._confirmSuggestionAtCursor();
      }
    }));

    this._isDestroyed = false;
    this._isLoading = false;

    this._subscriptions.add(atom.config.observe(process.platform === 'darwin' ? 'hyperclick.darwinTriggerKeys' : process.platform === 'win32' ? 'hyperclick.win32TriggerKeys' : 'hyperclick.linuxTriggerKeys', function (newValue) {
      _this._triggerKeys = new Set(newValue.split(','));
    }));
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
    key: '_onContextMenu',
    value: function _onContextMenu(event) {
      var mouseEvent = event;
      // If the key trigger happens to cause the context menu to show up, then
      // cancel it. By this point, it's too late to know if you're at a suggestion
      // position to be more fine grained. So if your trigger keys are "ctrl+cmd",
      // then you can't use that combination to bring up the context menu.
      if (this._isHyperclickEvent(mouseEvent)) {
        event.stopPropagation();
      }
    }
  }, {
    key: '_onMouseMove',
    value: function _onMouseMove(event) {
      var mouseEvent = event;
      if (this._isLoading) {
        // Show the loading cursor.
        this._textEditorView.classList.add('hyperclick-loading');
      }

      // We save the last `MouseEvent` so the user can trigger Hyperclick by
      // pressing the key without moving the mouse again. We only save the
      // relevant properties to prevent retaining a reference to the event.
      this._lastMouseEvent = {
        clientX: mouseEvent.clientX,
        clientY: mouseEvent.clientY
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

      if (this._isHyperclickEvent(mouseEvent)) {
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
      var mouseEvent = event;
      if (!this._isHyperclickEvent(mouseEvent) || !this._isMouseAtLastSuggestion()) {
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
      var mouseEvent = event;
      // Show the suggestion at the last known mouse position.
      if (this._isHyperclickEvent(mouseEvent)) {
        this._setSuggestionForLastMouseEvent();
      }
    }
  }, {
    key: '_onKeyUp',
    value: function _onKeyUp(event) {
      var mouseEvent = event;
      if (!this._isHyperclickEvent(mouseEvent)) {
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
      return event.shiftKey === this._triggerKeys.has('shiftKey') && event.ctrlKey === this._triggerKeys.has('ctrlKey') && event.altKey === this._triggerKeys.has('altKey') && event.metaKey === this._triggerKeys.has('metaKey');
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
      this._textEditorView.removeEventListener('mousemove', this._onMouseMove);
      this._textEditorView.removeEventListener('keydown', this._onKeyDown);
      this._textEditorView.removeEventListener('keyup', this._onKeyUp);
      this._textEditorView.removeEventListener('contextmenu', this._onContextMenu);
      this._subscriptions.dispose();
    }
  }]);

  return HyperclickForTextEditor;
})();

exports['default'] = HyperclickForTextEditor;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hc3VhcmV6L0Rvd25sb2Fkcy9oeXBlcmNsaWNrL2xpYi9IeXBlcmNsaWNrRm9yVGV4dEVkaXRvci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztvQkFjcUQsTUFBTTs7K0JBQ3pCLG9CQUFvQjs7c0JBQ2hDLFFBQVE7Ozs7Ozs7O0FBaEI5QixXQUFXLENBQUM7O0lBc0JTLHVCQUF1QjtBQW1CL0IsV0FuQlEsdUJBQXVCLENBbUI5QixVQUEyQixFQUFFLFVBQXNCLEVBQUU7OzswQkFuQjlDLHVCQUF1Qjs7QUFvQnhDLFFBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDO0FBQzlCLFFBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7O0FBRXRELFFBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDOztBQUU5QixRQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQztBQUM1QixRQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQzs7O0FBRzFCLFFBQUksQ0FBQyw2QkFBNkIsR0FBRyxJQUFJLENBQUM7O0FBRTFDLFFBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLENBQUM7QUFDbkMsUUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQzs7QUFFL0IsUUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7QUFDM0IsUUFBSSxDQUFDLGNBQWMsR0FBRywrQkFBeUIsQ0FBQzs7QUFFaEQsUUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNqRCxRQUFJLENBQUMsZUFBZSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDdEUsUUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENB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RVcsd0JBQVM7QUFDbkIsVUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7QUFDeEIsVUFBSSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLENBQUM7S0FDN0Q7OztXQUVNLG1CQUFHO0FBQ1IsVUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7QUFDekIsVUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7QUFDeEIsVUFBSSxDQUFDLGVBQWUsQ0FBQyxtQkFBbUIsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQ3pFLFVBQUksQ0FBQyxlQUFlLENBQUMsbUJBQW1CLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNyRSxVQUFJLENBQUMsZUFBZSxDQUFDLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDakUsVUFBSSxDQUFDLGVBQWUsQ0FBQyxtQkFBbUIsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQzdFLFVBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLENBQUM7S0FDL0I7OztTQXJWa0IsdUJBQXVCOzs7cUJBQXZCLHVCQUF1QiIsImZpbGUiOiIvVXNlcnMvYXN1YXJlei9Eb3dubG9hZHMvaHlwZXJjbGljay9saWIvSHlwZXJjbGlja0ZvclRleHRFZGl0b3IuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG5pbXBvcnQgdHlwZSB7SHlwZXJjbGlja1N1Z2dlc3Rpb259IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHR5cGUgSHlwZXJjbGljayBmcm9tICcuL0h5cGVyY2xpY2snO1xuXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUsIFBvaW50fSBmcm9tICdhdG9tJztcbmltcG9ydCB7Z2V0V29yZFRleHRBbmRSYW5nZX0gZnJvbSAnLi9oeXBlcmNsaWNrLXV0aWxzJztcbmltcG9ydCBpbnZhcmlhbnQgZnJvbSAnYXNzZXJ0JztcblxuLyoqXG4gKiBDb25zdHJ1Y3QgdGhpcyBvYmplY3QgdG8gZW5hYmxlIEh5cGVyY2xpY2sgaW4gYSB0ZXh0IGVkaXRvci5cbiAqIENhbGwgYGRpc3Bvc2VgIHRvIGRpc2FibGUgdGhlIGZlYXR1cmUuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEh5cGVyY2xpY2tGb3JUZXh0RWRpdG9yIHtcbiAgX3RleHRFZGl0b3I6IGF0b20kVGV4dEVkaXRvcjtcbiAgX3RleHRFZGl0b3JWaWV3OiBhdG9tJFRleHRFZGl0b3JFbGVtZW50O1xuICBfaHlwZXJjbGljazogSHlwZXJjbGljaztcbiAgX2xhc3RNb3VzZUV2ZW50OiA/TW91c2VFdmVudDtcbiAgX2xhc3RQb3NpdGlvbjogP2F0b20kUG9pbnQ7XG4gIF9sYXN0U3VnZ2VzdGlvbkF0TW91c2VQcm9taXNlOiA/UHJvbWlzZTxIeXBlcmNsaWNrU3VnZ2VzdGlvbj47XG4gIF9sYXN0U3VnZ2VzdGlvbkF0TW91c2U6ID9IeXBlcmNsaWNrU3VnZ2VzdGlvbjtcbiAgX25hdmlnYXRpb25NYXJrZXJzOiA/QXJyYXk8YXRvbSRNYXJrZXI+O1xuICBfbGFzdFdvcmRSYW5nZTogP2F0b20kUmFuZ2U7XG4gIF9vbk1vdXNlTW92ZTogKGV2ZW50OiBFdmVudCkgPT4gdm9pZDtcbiAgX29uTW91c2VEb3duOiAoZXZlbnQ6IEV2ZW50KSA9PiB2b2lkO1xuICBfb25LZXlEb3duOiAoZXZlbnQ6IEV2ZW50KSA9PiB2b2lkO1xuICBfb25LZXlVcDogKGV2ZW50OiBFdmVudCkgPT4gdm9pZDtcbiAgX3N1YnNjcmlwdGlvbnM6IGF0b20kQ29tcG9zaXRlRGlzcG9zYWJsZTtcbiAgX2lzRGVzdHJveWVkOiBib29sZWFuO1xuICBfaXNMb2FkaW5nOiBib29sZWFuO1xuICBfdHJpZ2dlcktleXM6IFNldDwnc2hpZnRLZXknIHwgJ2N0cmxLZXknIHwgJ2FsdEtleScgfCAnbWV0YUtleSc+O1xuXG4gIGNvbnN0cnVjdG9yKHRleHRFZGl0b3I6IGF0b20kVGV4dEVkaXRvciwgaHlwZXJjbGljazogSHlwZXJjbGljaykge1xuICAgIHRoaXMuX3RleHRFZGl0b3IgPSB0ZXh0RWRpdG9yO1xuICAgIHRoaXMuX3RleHRFZGl0b3JWaWV3ID0gYXRvbS52aWV3cy5nZXRWaWV3KHRleHRFZGl0b3IpO1xuXG4gICAgdGhpcy5faHlwZXJjbGljayA9IGh5cGVyY2xpY2s7XG5cbiAgICB0aGlzLl9sYXN0TW91c2VFdmVudCA9IG51bGw7XG4gICAgdGhpcy5fbGFzdFBvc2l0aW9uID0gbnVsbDtcbiAgICAvLyBXZSBzdG9yZSB0aGUgb3JpZ2luYWwgcHJvbWlzZSB0aGF0IHdlIHVzZSB0byByZXRyaWV2ZSB0aGUgbGFzdCBzdWdnZXN0aW9uXG4gICAgLy8gc28gY2FsbGVycyBjYW4gYWxzbyBhd2FpdCBpdCB0byBrbm93IHdoZW4gaXQncyBhdmFpbGFibGUuXG4gICAgdGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlUHJvbWlzZSA9IG51bGw7XG4gICAgLy8gV2Ugc3RvcmUgdGhlIGxhc3Qgc3VnZ2VzdGlvbiBzaW5jZSB3ZSBtdXN0IGF3YWl0IGl0IGltbWVkaWF0ZWx5IGFueXdheS5cbiAgICB0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2UgPSBudWxsO1xuICAgIHRoaXMuX25hdmlnYXRpb25NYXJrZXJzID0gbnVsbDtcblxuICAgIHRoaXMuX2xhc3RXb3JkUmFuZ2UgPSBudWxsO1xuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuXG4gICAgdGhpcy5fb25Nb3VzZU1vdmUgPSB0aGlzLl9vbk1vdXNlTW92ZS5iaW5kKHRoaXMpO1xuICAgIHRoaXMuX3RleHRFZGl0b3JWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMuX29uTW91c2VNb3ZlKTtcbiAgICB0aGlzLl9vbk1vdXNlRG93biA9IHRoaXMuX29uTW91c2VEb3duLmJpbmQodGhpcyk7XG4gICAgdGhpcy5fc2V0dXBNb3VzZURvd25MaXN0ZW5lcigpO1xuXG4gICAgdGhpcy5fb25LZXlEb3duID0gdGhpcy5fb25LZXlEb3duLmJpbmQodGhpcyk7XG4gICAgdGhpcy5fdGV4dEVkaXRvclZpZXcuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuX29uS2V5RG93bik7XG4gICAgdGhpcy5fb25LZXlVcCA9IHRoaXMuX29uS2V5VXAuYmluZCh0aGlzKTtcbiAgICB0aGlzLl90ZXh0RWRpdG9yVmlldy5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIHRoaXMuX29uS2V5VXApO1xuICAgICh0aGlzOiBhbnkpLl9vbkNvbnRleHRNZW51ID0gdGhpcy5fb25Db250ZXh0TWVudS5iaW5kKHRoaXMpO1xuICAgIHRoaXMuX3RleHRFZGl0b3JWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ2NvbnRleHRtZW51JywgdGhpcy5fb25Db250ZXh0TWVudSk7XG5cbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbW1hbmRzLmFkZCh0aGlzLl90ZXh0RWRpdG9yVmlldywge1xuICAgICAgJ2h5cGVyY2xpY2s6Y29uZmlybS1jdXJzb3InOiAoKSA9PiB0aGlzLl9jb25maXJtU3VnZ2VzdGlvbkF0Q3Vyc29yKCksXG4gICAgfSkpO1xuXG4gICAgdGhpcy5faXNEZXN0cm95ZWQgPSBmYWxzZTtcbiAgICB0aGlzLl9pc0xvYWRpbmcgPSBmYWxzZTtcblxuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgYXRvbS5jb25maWcub2JzZXJ2ZShcbiAgICAgICAgcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2RhcndpbicgPyAnaHlwZXJjbGljay5kYXJ3aW5UcmlnZ2VyS2V5cycgOlxuICAgICAgICAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJyA/ICdoeXBlcmNsaWNrLndpbjMyVHJpZ2dlcktleXMnIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnaHlwZXJjbGljay5saW51eFRyaWdnZXJLZXlzJyksXG4gICAgICAgIChuZXdWYWx1ZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgdGhpcy5fdHJpZ2dlcktleXMgPSBuZXcgU2V0KG5ld1ZhbHVlLnNwbGl0KCcsJykpO1xuICAgICAgICB9LFxuICAgICAgKSxcbiAgICApO1xuICB9XG5cbiAgX3NldHVwTW91c2VEb3duTGlzdGVuZXIoKTogdm9pZCB7XG4gICAgY29uc3QgZ2V0TGluZXNEb21Ob2RlID0gKCk6IEhUTUxFbGVtZW50ID0+IHtcbiAgICAgIGNvbnN0IHtjb21wb25lbnR9ID0gdGhpcy5fdGV4dEVkaXRvclZpZXc7XG4gICAgICBpbnZhcmlhbnQoY29tcG9uZW50KTtcbiAgICAgIHJldHVybiBjb21wb25lbnQubGluZXNDb21wb25lbnQuZ2V0RG9tTm9kZSgpO1xuICAgIH07XG4gICAgY29uc3QgcmVtb3ZlTW91c2VEb3duTGlzdGVuZXIgPSAoKSA9PiB7XG4gICAgICBpZiAodGhpcy5fdGV4dEVkaXRvclZpZXcuY29tcG9uZW50ID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZ2V0TGluZXNEb21Ob2RlKCkucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fb25Nb3VzZURvd24pO1xuICAgIH07XG4gICAgY29uc3QgYWRkTW91c2VEb3duTGlzdGVuZXIgPSAoKSA9PiB7XG4gICAgICBnZXRMaW5lc0RvbU5vZGUoKS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLl9vbk1vdXNlRG93bik7XG4gICAgfTtcbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zLmFkZChuZXcgRGlzcG9zYWJsZShyZW1vdmVNb3VzZURvd25MaXN0ZW5lcikpO1xuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMuYWRkKHRoaXMuX3RleHRFZGl0b3JWaWV3Lm9uRGlkRGV0YWNoKHJlbW92ZU1vdXNlRG93bkxpc3RlbmVyKSk7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5fdGV4dEVkaXRvclZpZXcub25EaWRBdHRhY2goYWRkTW91c2VEb3duTGlzdGVuZXIpKTtcbiAgICBhZGRNb3VzZURvd25MaXN0ZW5lcigpO1xuICB9XG5cbiAgX2NvbmZpcm1TdWdnZXN0aW9uKHN1Z2dlc3Rpb246IEh5cGVyY2xpY2tTdWdnZXN0aW9uKTogdm9pZCB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoc3VnZ2VzdGlvbi5jYWxsYmFjaykgJiYgc3VnZ2VzdGlvbi5jYWxsYmFjay5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLl9oeXBlcmNsaWNrLnNob3dTdWdnZXN0aW9uTGlzdCh0aGlzLl90ZXh0RWRpdG9yLCBzdWdnZXN0aW9uKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaW52YXJpYW50KHR5cGVvZiBzdWdnZXN0aW9uLmNhbGxiYWNrID09PSAnZnVuY3Rpb24nKTtcbiAgICAgIHN1Z2dlc3Rpb24uY2FsbGJhY2soKTtcbiAgICB9XG4gIH1cblxuICBfb25Db250ZXh0TWVudShldmVudDogRXZlbnQpOiB2b2lkIHtcbiAgICBjb25zdCBtb3VzZUV2ZW50OiBNb3VzZUV2ZW50ID0gKGV2ZW50OiBhbnkpO1xuICAgIC8vIElmIHRoZSBrZXkgdHJpZ2dlciBoYXBwZW5zIHRvIGNhdXNlIHRoZSBjb250ZXh0IG1lbnUgdG8gc2hvdyB1cCwgdGhlblxuICAgIC8vIGNhbmNlbCBpdC4gQnkgdGhpcyBwb2ludCwgaXQncyB0b28gbGF0ZSB0byBrbm93IGlmIHlvdSdyZSBhdCBhIHN1Z2dlc3Rpb25cbiAgICAvLyBwb3NpdGlvbiB0byBiZSBtb3JlIGZpbmUgZ3JhaW5lZC4gU28gaWYgeW91ciB0cmlnZ2VyIGtleXMgYXJlIFwiY3RybCtjbWRcIixcbiAgICAvLyB0aGVuIHlvdSBjYW4ndCB1c2UgdGhhdCBjb21iaW5hdGlvbiB0byBicmluZyB1cCB0aGUgY29udGV4dCBtZW51LlxuICAgIGlmICh0aGlzLl9pc0h5cGVyY2xpY2tFdmVudChtb3VzZUV2ZW50KSkge1xuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfVxuICB9XG5cbiAgX29uTW91c2VNb3ZlKGV2ZW50OiBFdmVudCk6IHZvaWQge1xuICAgIGNvbnN0IG1vdXNlRXZlbnQ6IE1vdXNlRXZlbnQgPSAoZXZlbnQ6IGFueSk7XG4gICAgaWYgKHRoaXMuX2lzTG9hZGluZykge1xuICAgICAgLy8gU2hvdyB0aGUgbG9hZGluZyBjdXJzb3IuXG4gICAgICB0aGlzLl90ZXh0RWRpdG9yVmlldy5jbGFzc0xpc3QuYWRkKCdoeXBlcmNsaWNrLWxvYWRpbmcnKTtcbiAgICB9XG5cbiAgICAvLyBXZSBzYXZlIHRoZSBsYXN0IGBNb3VzZUV2ZW50YCBzbyB0aGUgdXNlciBjYW4gdHJpZ2dlciBIeXBlcmNsaWNrIGJ5XG4gICAgLy8gcHJlc3NpbmcgdGhlIGtleSB3aXRob3V0IG1vdmluZyB0aGUgbW91c2UgYWdhaW4uIFdlIG9ubHkgc2F2ZSB0aGVcbiAgICAvLyByZWxldmFudCBwcm9wZXJ0aWVzIHRvIHByZXZlbnQgcmV0YWluaW5nIGEgcmVmZXJlbmNlIHRvIHRoZSBldmVudC5cbiAgICB0aGlzLl9sYXN0TW91c2VFdmVudCA9ICh7XG4gICAgICBjbGllbnRYOiBtb3VzZUV2ZW50LmNsaWVudFgsXG4gICAgICBjbGllbnRZOiBtb3VzZUV2ZW50LmNsaWVudFksXG4gICAgfTogYW55KTtcblxuXG4gICAgLy8gRG9uJ3QgZmV0Y2ggc3VnZ2VzdGlvbnMgaWYgdGhlIG1vdXNlIGlzIHN0aWxsIGluIHRoZSBzYW1lICd3b3JkJywgd2hlcmVcbiAgICAvLyAnd29yZCcgaXMgYSB3aGl0ZXNwYWNlLWRlbGltaXRlZCBncm91cCBvZiBjaGFyYWN0ZXJzLlxuICAgIC8vXG4gICAgLy8gSWYgdGhlIGxhc3Qgc3VnZ2VzdGlvbiBoYWQgbXVsdGlwbGUgcmFuZ2VzLCB3ZSBoYXZlIG5vIGNob2ljZSBidXQgdG9cbiAgICAvLyBmZXRjaCBzdWdnZXN0aW9ucyBiZWNhdXNlIHRoZSBuZXcgd29yZCBtaWdodCBiZSBiZXR3ZWVuIHRob3NlIHJhbmdlcy5cbiAgICAvLyBUaGlzIHNob3VsZCBiZSBvayBiZWNhdXNlIGl0IHdpbGwgcmV1c2UgdGhhdCBsYXN0IHN1Z2dlc3Rpb24gdW50aWwgdGhlXG4gICAgLy8gbW91c2UgbW92ZXMgb2ZmIG9mIGl0LlxuICAgIGNvbnN0IGxhc3RTdWdnZXN0aW9uSXNOb3RNdWx0aVJhbmdlID0gIXRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZSB8fFxuICAgICAgICAhQXJyYXkuaXNBcnJheSh0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2UucmFuZ2UpO1xuICAgIGlmICh0aGlzLl9pc01vdXNlQXRMYXN0V29yZFJhbmdlKCkgJiYgbGFzdFN1Z2dlc3Rpb25Jc05vdE11bHRpUmFuZ2UpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qge3JhbmdlfSA9IGdldFdvcmRUZXh0QW5kUmFuZ2UodGhpcy5fdGV4dEVkaXRvciwgdGhpcy5fZ2V0TW91c2VQb3NpdGlvbkFzQnVmZmVyUG9zaXRpb24oKSk7XG4gICAgdGhpcy5fbGFzdFdvcmRSYW5nZSA9IHJhbmdlO1xuXG4gICAgaWYgKHRoaXMuX2lzSHlwZXJjbGlja0V2ZW50KG1vdXNlRXZlbnQpKSB7XG4gICAgICAvLyBDbGVhciB0aGUgc3VnZ2VzdGlvbiBpZiB0aGUgbW91c2UgbW92ZWQgb3V0IG9mIHRoZSByYW5nZS5cbiAgICAgIGlmICghdGhpcy5faXNNb3VzZUF0TGFzdFN1Z2dlc3Rpb24oKSkge1xuICAgICAgICB0aGlzLl9jbGVhclN1Z2dlc3Rpb24oKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX3NldFN1Z2dlc3Rpb25Gb3JMYXN0TW91c2VFdmVudCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9jbGVhclN1Z2dlc3Rpb24oKTtcbiAgICB9XG4gIH1cblxuICBfb25Nb3VzZURvd24oZXZlbnQ6IEV2ZW50KTogdm9pZCB7XG4gICAgY29uc3QgbW91c2VFdmVudDogTW91c2VFdmVudCA9IChldmVudDogYW55KTtcbiAgICBpZiAoIXRoaXMuX2lzSHlwZXJjbGlja0V2ZW50KG1vdXNlRXZlbnQpIHx8ICF0aGlzLl9pc01vdXNlQXRMYXN0U3VnZ2VzdGlvbigpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZSkge1xuICAgICAgdGhpcy5fY29uZmlybVN1Z2dlc3Rpb24odGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlKTtcbiAgICAgIC8vIFByZXZlbnQgdGhlIDxtZXRhLWNsaWNrPiBldmVudCBmcm9tIGFkZGluZyBhbm90aGVyIGN1cnNvci5cbiAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH1cblxuICAgIHRoaXMuX2NsZWFyU3VnZ2VzdGlvbigpO1xuICB9XG5cbiAgX29uS2V5RG93bihldmVudDogRXZlbnQpOiB2b2lkIHtcbiAgICBjb25zdCBtb3VzZUV2ZW50OiBNb3VzZUV2ZW50ID0gKGV2ZW50OiBhbnkpO1xuICAgIC8vIFNob3cgdGhlIHN1Z2dlc3Rpb24gYXQgdGhlIGxhc3Qga25vd24gbW91c2UgcG9zaXRpb24uXG4gICAgaWYgKHRoaXMuX2lzSHlwZXJjbGlja0V2ZW50KG1vdXNlRXZlbnQpKSB7XG4gICAgICB0aGlzLl9zZXRTdWdnZXN0aW9uRm9yTGFzdE1vdXNlRXZlbnQoKTtcbiAgICB9XG4gIH1cblxuICBfb25LZXlVcChldmVudDogRXZlbnQpOiB2b2lkIHtcbiAgICBjb25zdCBtb3VzZUV2ZW50OiBNb3VzZUV2ZW50ID0gKGV2ZW50OiBhbnkpO1xuICAgIGlmICghdGhpcy5faXNIeXBlcmNsaWNrRXZlbnQobW91c2VFdmVudCkpIHtcbiAgICAgIHRoaXMuX2NsZWFyU3VnZ2VzdGlvbigpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgYFByb21pc2VgIHRoYXQncyByZXNvbHZlZCB3aGVuIHRoZSBsYXRlc3Qgc3VnZ2VzdGlvbidzIGF2YWlsYWJsZS5cbiAgICovXG4gIGdldFN1Z2dlc3Rpb25BdE1vdXNlKCk6IFByb21pc2U8P0h5cGVyY2xpY2tTdWdnZXN0aW9uPiB7XG4gICAgcmV0dXJuIHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZVByb21pc2UgfHwgUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuICB9XG5cbiAgYXN5bmMgX3NldFN1Z2dlc3Rpb25Gb3JMYXN0TW91c2VFdmVudCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIXRoaXMuX2xhc3RNb3VzZUV2ZW50KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcG9zaXRpb24gPSB0aGlzLl9nZXRNb3VzZVBvc2l0aW9uQXNCdWZmZXJQb3NpdGlvbigpO1xuXG4gICAgaWYgKHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZSAhPSBudWxsKSB7XG4gICAgICBjb25zdCB7cmFuZ2V9ID0gdGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlO1xuICAgICAgaW52YXJpYW50KHJhbmdlLCAnSHlwZXJjbGljayByZXN1bHQgbXVzdCBoYXZlIGEgdmFsaWQgUmFuZ2UnKTtcbiAgICAgIGlmICh0aGlzLl9pc1Bvc2l0aW9uSW5SYW5nZShwb3NpdGlvbiwgcmFuZ2UpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gdGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlIHdpbGwgb25seSBiZSBzZXQgaWYgaHlwZXJjbGljayByZXR1cm5lZCBhIHByb21pc2UgdGhhdFxuICAgIC8vIHJlc29sdmVkIHRvIGEgbm9uLW51bGwgdmFsdWUuIFNvLCBpbiBvcmRlciB0byBub3QgYXNrIGh5cGVyY2xpY2sgZm9yIHRoZSBzYW1lIHRoaW5nXG4gICAgLy8gYWdhaW4gYW5kIGFnYWluIHdoaWNoIHdpbGwgYmUgYW55d2F5IG51bGwsIHdlIGNoZWNrIGlmIHRoZSBtb3VzZSBwb3NpdGlvbiBoYXMgY2hhbmdlZC5cbiAgICBpZiAodGhpcy5fbGFzdFBvc2l0aW9uICYmIHBvc2l0aW9uLmNvbXBhcmUodGhpcy5fbGFzdFBvc2l0aW9uKSA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX2lzTG9hZGluZyA9IHRydWU7XG5cbiAgICB0cnkge1xuICAgICAgdGhpcy5fbGFzdFBvc2l0aW9uID0gcG9zaXRpb247XG4gICAgICB0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2VQcm9taXNlID1cbiAgICAgICAgICB0aGlzLl9oeXBlcmNsaWNrLmdldFN1Z2dlc3Rpb24odGhpcy5fdGV4dEVkaXRvciwgcG9zaXRpb24pO1xuICAgICAgdGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlID0gYXdhaXQgdGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlUHJvbWlzZTtcbiAgICAgIGlmICh0aGlzLl9pc0Rlc3Ryb3llZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlICYmIHRoaXMuX2lzTW91c2VBdExhc3RTdWdnZXN0aW9uKCkpIHtcbiAgICAgICAgLy8gQWRkIHRoZSBoeXBlcmNsaWNrIG1hcmtlcnMgaWYgdGhlcmUncyBhIG5ldyBzdWdnZXN0aW9uIGFuZCBpdCdzIHVuZGVyIHRoZSBtb3VzZS5cbiAgICAgICAgdGhpcy5fdXBkYXRlTmF2aWdhdGlvbk1hcmtlcnModGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlLnJhbmdlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFJlbW92ZSBhbGwgdGhlIG1hcmtlcnMgaWYgd2UndmUgZmluaXNoZWQgbG9hZGluZyBhbmQgdGhlcmUncyBubyBzdWdnZXN0aW9uLlxuICAgICAgICB0aGlzLl91cGRhdGVOYXZpZ2F0aW9uTWFya2VycyhudWxsKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBnZXR0aW5nIEh5cGVyY2xpY2sgc3VnZ2VzdGlvbjonLCBlKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5fZG9uZUxvYWRpbmcoKTtcbiAgICB9XG4gIH1cblxuICBfZ2V0TW91c2VQb3NpdGlvbkFzQnVmZmVyUG9zaXRpb24oKTogYXRvbSRQb2ludCB7XG4gICAgY29uc3Qge2NvbXBvbmVudH0gPSB0aGlzLl90ZXh0RWRpdG9yVmlldztcbiAgICBpbnZhcmlhbnQoY29tcG9uZW50KTtcbiAgICBpbnZhcmlhbnQodGhpcy5fbGFzdE1vdXNlRXZlbnQpO1xuICAgIGNvbnN0IHNjcmVlblBvc2l0aW9uID0gY29tcG9uZW50LnNjcmVlblBvc2l0aW9uRm9yTW91c2VFdmVudCh0aGlzLl9sYXN0TW91c2VFdmVudCk7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiB0aGlzLl90ZXh0RWRpdG9yLmJ1ZmZlclBvc2l0aW9uRm9yU2NyZWVuUG9zaXRpb24oc2NyZWVuUG9zaXRpb24pO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAvLyBGaXggaHR0cHM6Ly9naXRodWIuY29tL2ZhY2Vib29rL251Y2xpZGUvaXNzdWVzLzI5MlxuICAgICAgLy8gV2hlbiBuYXZpZ2F0aW5nIEF0b20gd29ya3NwYWNlIHdpdGggYENNRC9DVFJMYCBkb3duLFxuICAgICAgLy8gaXQgdHJpZ2dlcnMgVGV4dEVkaXRvckVsZW1lbnQncyBgbW91c2Vtb3ZlYCB3aXRoIGludmFsaWQgc2NyZWVuIHBvc2l0aW9uLlxuICAgICAgLy8gVGhpcyBmYWxscyBiYWNrIHRvIHJldHVybmluZyB0aGUgc3RhcnQgb2YgdGhlIGVkaXRvci5cbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0h5cGVyY2xpY2s6IEVycm9yIGdldHRpbmcgYnVmZmVyIHBvc2l0aW9uIGZvciBzY3JlZW4gcG9zaXRpb246JywgZXJyb3IpO1xuICAgICAgcmV0dXJuIG5ldyBQb2ludCgwLCAwKTtcbiAgICB9XG4gIH1cblxuICBfaXNNb3VzZUF0TGFzdFN1Z2dlc3Rpb24oKTogYm9vbGVhbiB7XG4gICAgaWYgKCF0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2UpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3Qge3JhbmdlfSA9IHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZTtcbiAgICBpbnZhcmlhbnQocmFuZ2UsICdIeXBlcmNsaWNrIHJlc3VsdCBtdXN0IGhhdmUgYSB2YWxpZCBSYW5nZScpO1xuICAgIHJldHVybiB0aGlzLl9pc1Bvc2l0aW9uSW5SYW5nZSh0aGlzLl9nZXRNb3VzZVBvc2l0aW9uQXNCdWZmZXJQb3NpdGlvbigpLCByYW5nZSk7XG4gIH1cblxuICBfaXNNb3VzZUF0TGFzdFdvcmRSYW5nZSgpOiBib29sZWFuIHtcbiAgICBjb25zdCBsYXN0V29yZFJhbmdlID0gdGhpcy5fbGFzdFdvcmRSYW5nZTtcbiAgICBpZiAobGFzdFdvcmRSYW5nZSA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9pc1Bvc2l0aW9uSW5SYW5nZSh0aGlzLl9nZXRNb3VzZVBvc2l0aW9uQXNCdWZmZXJQb3NpdGlvbigpLCBsYXN0V29yZFJhbmdlKTtcbiAgfVxuXG4gIF9pc1Bvc2l0aW9uSW5SYW5nZShwb3NpdGlvbjogYXRvbSRQb2ludCwgcmFuZ2U6IGF0b20kUmFuZ2UgfCBBcnJheTxhdG9tJFJhbmdlPik6IGJvb2xlYW4ge1xuICAgIHJldHVybiAoQXJyYXkuaXNBcnJheShyYW5nZSlcbiAgICAgICAgPyByYW5nZS5zb21lKHIgPT4gci5jb250YWluc1BvaW50KHBvc2l0aW9uKSlcbiAgICAgICAgOiByYW5nZS5jb250YWluc1BvaW50KHBvc2l0aW9uKSk7XG4gIH1cblxuICBfY2xlYXJTdWdnZXN0aW9uKCk6IHZvaWQge1xuICAgIHRoaXMuX2RvbmVMb2FkaW5nKCk7XG4gICAgdGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlUHJvbWlzZSA9IG51bGw7XG4gICAgdGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlID0gbnVsbDtcbiAgICB0aGlzLl91cGRhdGVOYXZpZ2F0aW9uTWFya2VycyhudWxsKTtcbiAgfVxuXG4gIGFzeW5jIF9jb25maXJtU3VnZ2VzdGlvbkF0Q3Vyc29yKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHN1Z2dlc3Rpb24gPSBhd2FpdCB0aGlzLl9oeXBlcmNsaWNrLmdldFN1Z2dlc3Rpb24oXG4gICAgICAgIHRoaXMuX3RleHRFZGl0b3IsXG4gICAgICAgIHRoaXMuX3RleHRFZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKSk7XG4gICAgaWYgKHN1Z2dlc3Rpb24pIHtcbiAgICAgIHRoaXMuX2NvbmZpcm1TdWdnZXN0aW9uKHN1Z2dlc3Rpb24pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgbWFya2VycyBmb3IgdGhlIGdpdmVuIHJhbmdlKHMpLCBvciBjbGVhcnMgdGhlbSBpZiBgcmFuZ2VzYCBpcyBudWxsLlxuICAgKi9cbiAgX3VwZGF0ZU5hdmlnYXRpb25NYXJrZXJzKHJhbmdlOiA/IChhdG9tJFJhbmdlIHwgQXJyYXk8YXRvbSRSYW5nZT4pKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX25hdmlnYXRpb25NYXJrZXJzKSB7XG4gICAgICB0aGlzLl9uYXZpZ2F0aW9uTWFya2Vycy5mb3JFYWNoKG1hcmtlciA9PiBtYXJrZXIuZGVzdHJveSgpKTtcbiAgICAgIHRoaXMuX25hdmlnYXRpb25NYXJrZXJzID0gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBPbmx5IGNoYW5nZSB0aGUgY3Vyc29yIHRvIGEgcG9pbnRlciBpZiB0aGVyZSBpcyBhIHN1Z2dlc3Rpb24gcmVhZHkuXG4gICAgaWYgKHJhbmdlID09IG51bGwpIHtcbiAgICAgIHRoaXMuX3RleHRFZGl0b3JWaWV3LmNsYXNzTGlzdC5yZW1vdmUoJ2h5cGVyY2xpY2snKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl90ZXh0RWRpdG9yVmlldy5jbGFzc0xpc3QuYWRkKCdoeXBlcmNsaWNrJyk7XG4gICAgY29uc3QgcmFuZ2VzID0gQXJyYXkuaXNBcnJheShyYW5nZSkgPyByYW5nZSA6IFtyYW5nZV07XG4gICAgdGhpcy5fbmF2aWdhdGlvbk1hcmtlcnMgPSByYW5nZXMubWFwKG1hcmtlclJhbmdlID0+IHtcbiAgICAgIGNvbnN0IG1hcmtlciA9IHRoaXMuX3RleHRFZGl0b3IubWFya0J1ZmZlclJhbmdlKG1hcmtlclJhbmdlLCB7aW52YWxpZGF0ZTogJ25ldmVyJ30pO1xuICAgICAgdGhpcy5fdGV4dEVkaXRvci5kZWNvcmF0ZU1hcmtlcihcbiAgICAgICAgbWFya2VyLFxuICAgICAgICB7dHlwZTogJ2hpZ2hsaWdodCcsIGNsYXNzOiAnaHlwZXJjbGljayd9LFxuICAgICAgKTtcbiAgICAgIHJldHVybiBtYXJrZXI7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB3aGV0aGVyIGFuIGV2ZW50IHNob3VsZCBiZSBoYW5kbGVkIGJ5IGh5cGVyY2xpY2sgb3Igbm90LlxuICAgKi9cbiAgX2lzSHlwZXJjbGlja0V2ZW50KGV2ZW50OiBTeW50aGV0aWNLZXlib2FyZEV2ZW50IHwgTW91c2VFdmVudCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAoXG4gICAgICBldmVudC5zaGlmdEtleSA9PT0gdGhpcy5fdHJpZ2dlcktleXMuaGFzKCdzaGlmdEtleScpICYmXG4gICAgICBldmVudC5jdHJsS2V5ID09PSB0aGlzLl90cmlnZ2VyS2V5cy5oYXMoJ2N0cmxLZXknKSAmJlxuICAgICAgZXZlbnQuYWx0S2V5ID09PSB0aGlzLl90cmlnZ2VyS2V5cy5oYXMoJ2FsdEtleScpICYmXG4gICAgICBldmVudC5tZXRhS2V5ID09PSB0aGlzLl90cmlnZ2VyS2V5cy5oYXMoJ21ldGFLZXknKVxuICAgICk7XG4gIH1cblxuICBfZG9uZUxvYWRpbmcoKTogdm9pZCB7XG4gICAgdGhpcy5faXNMb2FkaW5nID0gZmFsc2U7XG4gICAgdGhpcy5fdGV4dEVkaXRvclZpZXcuY2xhc3NMaXN0LnJlbW92ZSgnaHlwZXJjbGljay1sb2FkaW5nJyk7XG4gIH1cblxuICBkaXNwb3NlKCkge1xuICAgIHRoaXMuX2lzRGVzdHJveWVkID0gdHJ1ZTtcbiAgICB0aGlzLl9jbGVhclN1Z2dlc3Rpb24oKTtcbiAgICB0aGlzLl90ZXh0RWRpdG9yVmlldy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLl9vbk1vdXNlTW92ZSk7XG4gICAgdGhpcy5fdGV4dEVkaXRvclZpZXcucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuX29uS2V5RG93bik7XG4gICAgdGhpcy5fdGV4dEVkaXRvclZpZXcucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLl9vbktleVVwKTtcbiAgICB0aGlzLl90ZXh0RWRpdG9yVmlldy5yZW1vdmVFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIHRoaXMuX29uQ29udGV4dE1lbnUpO1xuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMuZGlzcG9zZSgpO1xuICB9XG59XG4iXX0=