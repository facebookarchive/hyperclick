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
    this._onMouseDown = this._onMouseDown.bind(this);
    this._setupMouseListeners();

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
      _this._triggerKeys = new Set();
      if (typeof newValue === 'string') {
        newValue.split(',').forEach(function (value) {
          if (value === 'shiftKey' || value === 'ctrlKey' || value === 'altKey' || value === 'metaKey') {
            _this._triggerKeys.add(value);
          };
        });
      }
    }));
  }

  _createClass(HyperclickForTextEditor, [{
    key: '_setupMouseListeners',
    value: function _setupMouseListeners() {
      var _this2 = this;

      var getLinesDomNode = function getLinesDomNode() {
        var component = _this2._textEditorView.component;

        (0, _assert2['default'])(component);
        return component.linesComponent.getDomNode();
      };
      var removeMouseListeners = function removeMouseListeners() {
        if (_this2._textEditorView.component == null) {
          return;
        }
        getLinesDomNode().removeEventListener('mousedown', _this2._onMouseDown);
        getLinesDomNode().removeEventListener('mousemove', _this2._onMouseMove);
      };
      var addMouseListeners = function addMouseListeners() {
        getLinesDomNode().addEventListener('mousedown', _this2._onMouseDown);
        getLinesDomNode().addEventListener('mousemove', _this2._onMouseMove);
      };
      this._subscriptions.add(new _atom.Disposable(removeMouseListeners));
      this._subscriptions.add(this._textEditorView.onDidDetach(removeMouseListeners));
      this._subscriptions.add(this._textEditorView.onDidAttach(addMouseListeners));
      addMouseListeners();
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
        var lastSuggestionAtMouse = this._lastSuggestionAtMouse;
        // Move the cursor to the click location to force a navigation-stack push.
        var newCursorPosition = this._getMousePositionAsBufferPosition();
        this._textEditor.setCursorBufferPosition(newCursorPosition);

        this._confirmSuggestion(lastSuggestionAtMouse);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hc3VhcmV6L3NyYy9naXRodWIvaHlwZXJjbGljay9saWIvSHlwZXJjbGlja0ZvclRleHRFZGl0b3IuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7b0JBY3FELE1BQU07OytCQUN6QixvQkFBb0I7O3NCQUNoQyxRQUFROzs7Ozs7OztBQWhCOUIsV0FBVyxDQUFDOztJQXNCUyx1QkFBdUI7QUFtQi9CLFdBbkJRLHVCQUF1QixDQW1COUIsVUFBMkIsRUFBRSxVQUFzQixFQUFFOzs7MEJBbkI5Qyx1QkFBdUI7O0FBb0J4QyxRQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQztBQUM5QixRQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDOztBQUV0RCxRQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQzs7QUFFOUIsUUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7QUFDNUIsUUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUM7OztBQUcxQixRQUFJLENBQUMsNkJBQTZCLEdBQUcsSUFBSSxDQUFDOztBQUUxQyxRQUFJLENBQUMsc0JBQXNCLEdBQUcsSUFBSSxDQUFDO0FBQ25DLFFBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUM7O0FBRS9CLFFBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDO0FBQzNCLFFBQUksQ0FBQyxjQUFjLEdBQUcsK0JBQXlCLENBQUM7O0FBRWhELFFBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDakQsUUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNqRCxRQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQzs7QUFFNUIsUUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM3QyxRQUFJLENBQUMsZUFBZSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDbEUsUUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN6QyxRQUFJLENBQUMsZUFBZSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDOUQsQUFBQyxRQUFJLENBQU8sY0FBYyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzVELFFBQUksQ0FBQyxlQUFlLENBQUMsZ0JBQWdCLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQzs7QUFFMUUsUUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRTtBQUM5RCxpQ0FBMkIsRUFBRTtlQUFNLE1BQUssMEJBQTBCLEVBQUU7T0FBQTtLQUNyRSxDQUFDLENBQUMsQ0FBQzs7QUFFSixRQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztBQUMxQixRQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQzs7QUFFeEIsUUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQ3JCLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUNqQixPQUFPLENBQUMsUUFBUSxLQUFLLFFBQVEsR0FBRyw4QkFBOEIsR0FDN0QsT0FBTyxDQUFDLFFBQVEsS0FBSyxPQUFPLEdBQUcsNkJBQTZCLEdBQzdCLDZCQUE2QixBQUFDLEVBQzlELFVBQUMsUUFBUSxFQUFZO0FBQ25CLFlBQUssWUFBWSxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7QUFDOUIsVUFBSSxPQUFPLFFBQVEsS0FBSyxRQUFRLEVBQUU7QUFDaEMsZ0JBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQUEsS0FBSyxFQUFJO0FBQ25DLGNBQ0UsS0FBSyxLQUFLLFVBQVUsSUFDcEIsS0FBSyxLQUFLLFNBQVMsSUFDbkIsS0FBSyxLQUFLLFFBQVEsSUFDbEIsS0FBSyxLQUFLLFNBQVMsRUFDbkI7QUFDQSxrQkFBSyxZQUFZLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1dBQzlCLENBQUM7U0FDSCxDQUFDLENBQUM7T0FDSjtLQUNGLENBQ0YsQ0FDRixDQUFDO0dBQ0g7O2VBN0VrQix1QkFBdUI7O1dBK0V0QixnQ0FBUzs7O0FBQzNCLFVBQU0sZUFBZSxHQUFHLFNBQWxCLGVBQWUsR0FBc0I7WUFDbEMsU0FBUyxHQUFJLE9BQUssZUFBZSxDQUFqQyxTQUFTOztBQUNoQixpQ0FBVSxTQUFTLENBQUMsQ0FBQztBQUNyQixlQUFPLFNBQVMsQ0FBQyxjQUFjLENBQUMsVUFBVSxFQUFFLENBQUM7T0FDOUMsQ0FBQztBQUNGLFVBQU0sb0JBQW9CLEdBQUcsU0FBdkIsb0JBQW9CLEdBQVM7QUFDakMsWUFBSSxPQUFLLGVBQWUsQ0FBQyxTQUFTLElBQUksSUFBSSxFQUFFO0FBQzFDLGlCQUFPO1NBQ1I7QUFDRCx1QkFBZSxFQUFFLENBQUMsbUJBQW1CLENBQUMsV0FBVyxFQUFFLE9BQUssWUFBWSxDQUFDLENBQUM7QUFDdEUsdUJBQWUsRUFBRSxDQUFDLG1CQUFtQixDQUFDLFdBQVcsRUFBRSxPQUFLLFlBQVksQ0FBQyxDQUFDO09BQ3ZFLENBQUM7QUFDRixVQUFNLGlCQUFpQixHQUFHLFNBQXBCLGlCQUFpQixHQUFTO0FBQzlCLHVCQUFlLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsT0FBSyxZQUFZLENBQUMsQ0FBQztBQUNuRSx1QkFBZSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLE9BQUssWUFBWSxDQUFDLENBQUM7T0FDcEUsQ0FBQztBQUNGLFVBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLHFCQUFlLG9CQUFvQixDQUFDLENBQUMsQ0FBQztBQUM5RCxVQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7QUFDaEYsVUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO0FBQzdFLHVCQUFpQixFQUFFLENBQUM7S0FDckI7OztXQUVpQiw0QkFBQyxVQUFnQyxFQUFRO0FBQ3pELFVBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLElBQUksVUFBVSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO0FBQ3hFLFlBQUksQ0FBQyxXQUFXLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxVQUFVLENBQUMsQ0FBQztPQUNuRSxNQUFNO0FBQ0wsaUNBQVUsT0FBTyxVQUFVLENBQUMsUUFBUSxLQUFLLFVBQVUsQ0FBQyxDQUFDO0FBQ3JELGtCQUFVLENBQUMsUUFBUSxFQUFFLENBQUM7T0FDdkI7S0FDRjs7O1dBRWEsd0JBQUMsS0FBWSxFQUFRO0FBQ2pDLFVBQU0sVUFBc0IsR0FBSSxLQUFLLEFBQU0sQ0FBQzs7Ozs7QUFLNUMsVUFBSSxJQUFJLENBQUMsa0JBQWtCLENBQUMsVUFBVSxDQUFDLEVBQUU7QUFDdkMsYUFBSyxDQUFDLGVBQWUsRUFBRSxDQUFDO09BQ3pCO0tBQ0Y7OztXQUVXLHNCQUFDLEtBQVksRUFBUTtBQUMvQixVQUFNLFVBQXNCLEdBQUksS0FBSyxBQUFNLENBQUM7QUFDNUMsVUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFOztBQUVuQixZQUFJLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsQ0FBQztPQUMxRDs7Ozs7QUFLRCxVQUFJLENBQUMsZUFBZSxHQUFJO0FBQ3RCLGVBQU8sRUFBRSxVQUFVLENBQUMsT0FBTztBQUMzQixlQUFPLEVBQUUsVUFBVSxDQUFDLE9BQU87T0FDNUIsQUFBTSxDQUFDOzs7Ozs7Ozs7QUFVUixVQUFNLDZCQUE2QixHQUFHLENBQUMsSUFBSSxDQUFDLHNCQUFzQixJQUM5RCxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3RELFVBQUksSUFBSSxDQUFDLHVCQUF1QixFQUFFLElBQUksNkJBQTZCLEVBQUU7QUFDbkUsZUFBTztPQUNSOztpQ0FDZSwwQ0FBb0IsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsaUNBQWlDLEVBQUUsQ0FBQzs7VUFBeEYsS0FBSyx3QkFBTCxLQUFLOztBQUNaLFVBQUksQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDOztBQUU1QixVQUFJLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsRUFBRTs7QUFFdkMsWUFBSSxDQUFDLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxFQUFFO0FBQ3BDLGNBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1NBQ3pCO0FBQ0QsWUFBSSxDQUFDLCtCQUErQixFQUFFLENBQUM7T0FDeEMsTUFBTTtBQUNMLFlBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO09BQ3pCO0tBQ0Y7OztXQUVXLHNCQUFDLEtBQVksRUFBUTtBQUMvQixVQUFNLFVBQXNCLEdBQUksS0FBSyxBQUFNLENBQUM7QUFDNUMsVUFBSSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxFQUFFO0FBQzVFLGVBQU87T0FDUjs7QUFFRCxVQUFJLElBQUksQ0FBQyxzQkFBc0IsRUFBRTtBQUMvQixZQUFNLHFCQUFxQixHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQzs7QUFFMUQsWUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsaUNBQWlDLEVBQUUsQ0FBQztBQUNuRSxZQUFJLENBQUMsV0FBVyxDQUFDLHVCQUF1QixDQUFDLGlCQUFpQixDQUFDLENBQUM7O0FBRTVELFlBQUksQ0FBQyxrQkFBa0IsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDOztBQUUvQyxhQUFLLENBQUMsZUFBZSxFQUFFLENBQUM7T0FDekI7O0FBRUQsVUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7S0FDekI7OztXQUVTLG9CQUFDLEtBQVksRUFBUTtBQUM3QixVQUFNLFVBQXNCLEdBQUksS0FBSyxBQUFNLENBQUM7O0FBRTVDLFVBQUksSUFBSSxDQUFDLGtCQUFrQixDQUFDLFVBQVUsQ0FBQyxFQUFFO0FBQ3ZDLFlBQUksQ0FBQywrQkFBK0IsRUFBRSxDQUFDO09BQ3hDO0tBQ0Y7OztXQUVPLGtCQUFDLEtBQVksRUFBUTtBQUMzQixVQUFNLFVBQXNCLEdBQUksS0FBSyxBQUFNLENBQUM7QUFDNUMsVUFBSSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsRUFBRTtBQUN4QyxZQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztPQUN6QjtLQUNGOzs7Ozs7O1dBS21CLGdDQUFtQztBQUNyRCxhQUFPLElBQUksQ0FBQyw2QkFBNkIsSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ3BFOzs7NkJBRW9DLGFBQWtCO0FBQ3JELFVBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFO0FBQ3pCLGVBQU87T0FDUjs7QUFFRCxVQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsaUNBQWlDLEVBQUUsQ0FBQzs7QUFFMUQsVUFBSSxJQUFJLENBQUMsc0JBQXNCLElBQUksSUFBSSxFQUFFO1lBQ2hDLEtBQUssR0FBSSxJQUFJLENBQUMsc0JBQXNCLENBQXBDLEtBQUs7O0FBQ1osaUNBQVUsS0FBSyxFQUFFLDJDQUEyQyxDQUFDLENBQUM7QUFDOUQsWUFBSSxJQUFJLENBQUMsa0JBQWtCLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxFQUFFO0FBQzVDLGlCQUFPO1NBQ1I7T0FDRjs7OztBQUlELFVBQUksSUFBSSxDQUFDLGFBQWEsSUFBSSxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDcEUsZUFBTztPQUNSOztBQUVELFVBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDOztBQUV2QixVQUFJO0FBQ0YsWUFBSSxDQUFDLGFBQWEsR0FBRyxRQUFRLENBQUM7QUFDOUIsWUFBSSxDQUFDLDZCQUE2QixHQUM5QixJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQy9ELFlBQUksQ0FBQyxzQkFBc0IsR0FBRyxNQUFNLElBQUksQ0FBQyw2QkFBNkIsQ0FBQztBQUN2RSxZQUFJLElBQUksQ0FBQyxZQUFZLEVBQUU7QUFDckIsaUJBQU87U0FDUjtBQUNELFlBQUksSUFBSSxDQUFDLHNCQUFzQixJQUFJLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxFQUFFOztBQUVsRSxjQUFJLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ2xFLE1BQU07O0FBRUwsY0FBSSxDQUFDLHdCQUF3QixDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3JDO09BQ0YsQ0FBQyxPQUFPLENBQUMsRUFBRTtBQUNWLGVBQU8sQ0FBQyxLQUFLLENBQUMsc0NBQXNDLEVBQUUsQ0FBQyxDQUFDLENBQUM7T0FDMUQsU0FBUztBQUNSLFlBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztPQUNyQjtLQUNGOzs7V0FFZ0MsNkNBQWU7VUFDdkMsU0FBUyxHQUFJLElBQUksQ0FBQyxlQUFlLENBQWpDLFNBQVM7O0FBQ2hCLCtCQUFVLFNBQVMsQ0FBQyxDQUFDO0FBQ3JCLCtCQUFVLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztBQUNoQyxVQUFNLGNBQWMsR0FBRyxTQUFTLENBQUMsMkJBQTJCLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO0FBQ25GLFVBQUk7QUFDRixlQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsK0JBQStCLENBQUMsY0FBYyxDQUFDLENBQUM7T0FDekUsQ0FBQyxPQUFPLEtBQUssRUFBRTs7Ozs7QUFLZCxlQUFPLENBQUMsS0FBSyxDQUFDLGdFQUFnRSxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ3ZGLGVBQU8sZ0JBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO09BQ3hCO0tBQ0Y7OztXQUV1QixvQ0FBWTtBQUNsQyxVQUFJLENBQUMsSUFBSSxDQUFDLHNCQUFzQixFQUFFO0FBQ2hDLGVBQU8sS0FBSyxDQUFDO09BQ2Q7VUFDTSxLQUFLLEdBQUksSUFBSSxDQUFDLHNCQUFzQixDQUFwQyxLQUFLOztBQUNaLCtCQUFVLEtBQUssRUFBRSwyQ0FBMkMsQ0FBQyxDQUFDO0FBQzlELGFBQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxpQ0FBaUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQ2pGOzs7V0FFc0IsbUNBQVk7QUFDakMsVUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQztBQUMxQyxVQUFJLGFBQWEsSUFBSSxJQUFJLEVBQUU7QUFDekIsZUFBTyxLQUFLLENBQUM7T0FDZDtBQUNELGFBQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxpQ0FBaUMsRUFBRSxFQUFFLGFBQWEsQ0FBQyxDQUFDO0tBQ3pGOzs7V0FFaUIsNEJBQUMsUUFBb0IsRUFBRSxLQUFxQyxFQUFXO0FBQ3ZGLGFBQVEsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FDdEIsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFBLENBQUM7ZUFBSSxDQUFDLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQztPQUFBLENBQUMsR0FDMUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBRTtLQUN0Qzs7O1dBRWUsNEJBQVM7QUFDdkIsVUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO0FBQ3BCLFVBQUksQ0FBQyw2QkFBNkIsR0FBRyxJQUFJLENBQUM7QUFDMUMsVUFBSSxDQUFDLHNCQUFzQixHQUFHLElBQUksQ0FBQztBQUNuQyxVQUFJLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDckM7Ozs2QkFFK0IsYUFBa0I7QUFDaEQsVUFBTSxVQUFVLEdBQUcsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FDbkQsSUFBSSxDQUFDLFdBQVcsRUFDaEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyx1QkFBdUIsRUFBRSxDQUFDLENBQUM7QUFDaEQsVUFBSSxVQUFVLEVBQUU7QUFDZCxZQUFJLENBQUMsa0JBQWtCLENBQUMsVUFBVSxDQUFDLENBQUM7T0FDckM7S0FDRjs7Ozs7OztXQUt1QixrQ0FBQyxLQUF5QyxFQUFROzs7QUFDeEUsVUFBSSxJQUFJLENBQUMsa0JBQWtCLEVBQUU7QUFDM0IsWUFBSSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxVQUFBLE1BQU07aUJBQUksTUFBTSxDQUFDLE9BQU8sRUFBRTtTQUFBLENBQUMsQ0FBQztBQUM1RCxZQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDO09BQ2hDOzs7QUFHRCxVQUFJLEtBQUssSUFBSSxJQUFJLEVBQUU7QUFDakIsWUFBSSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQ3BELGVBQU87T0FDUjs7QUFFRCxVQUFJLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDakQsVUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxLQUFLLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN0RCxVQUFJLENBQUMsa0JBQWtCLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxVQUFBLFdBQVcsRUFBSTtBQUNsRCxZQUFNLE1BQU0sR0FBRyxPQUFLLFdBQVcsQ0FBQyxlQUFlLENBQUMsV0FBVyxFQUFFLEVBQUMsVUFBVSxFQUFFLE9BQU8sRUFBQyxDQUFDLENBQUM7QUFDcEYsZUFBSyxXQUFXLENBQUMsY0FBYyxDQUM3QixNQUFNLEVBQ04sRUFBQyxJQUFJLEVBQUUsV0FBVyxFQUFFLFNBQU8sWUFBWSxFQUFDLENBQ3pDLENBQUM7QUFDRixlQUFPLE1BQU0sQ0FBQztPQUNmLENBQUMsQ0FBQztLQUNKOzs7Ozs7O1dBS2lCLDRCQUFDLEtBQTBDLEVBQVc7QUFDdEUsYUFDRSxLQUFLLENBQUMsUUFBUSxLQUFLLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUNwRCxLQUFLLENBQUMsT0FBTyxLQUFLLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUNsRCxLQUFLLENBQUMsTUFBTSxLQUFLLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUNoRCxLQUFLLENBQUMsT0FBTyxLQUFLLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUNsRDtLQUNIOzs7V0FFVyx3QkFBUztBQUNuQixVQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztBQUN4QixVQUFJLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsb0JBQW9CLENBQUMsQ0FBQztLQUM3RDs7O1dBRU0sbUJBQUc7QUFDUixVQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztBQUN6QixVQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztBQUN4QixVQUFJLENBQUMsZUFBZSxDQUFDLG1CQUFtQixDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDckUsVUFBSSxDQUFDLGVBQWUsQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ2pFLFVBQUksQ0FBQyxlQUFlLENBQUMsbUJBQW1CLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUM3RSxVQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxDQUFDO0tBQy9COzs7U0F0V2tCLHVCQUF1Qjs7O3FCQUF2Qix1QkFBdUIiLCJmaWxlIjoiL1VzZXJzL2FzdWFyZXovc3JjL2dpdGh1Yi9oeXBlcmNsaWNrL2xpYi9IeXBlcmNsaWNrRm9yVGV4dEVkaXRvci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbmltcG9ydCB0eXBlIHtIeXBlcmNsaWNrU3VnZ2VzdGlvbn0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgdHlwZSBIeXBlcmNsaWNrIGZyb20gJy4vSHlwZXJjbGljayc7XG5cbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSwgUG9pbnR9IGZyb20gJ2F0b20nO1xuaW1wb3J0IHtnZXRXb3JkVGV4dEFuZFJhbmdlfSBmcm9tICcuL2h5cGVyY2xpY2stdXRpbHMnO1xuaW1wb3J0IGludmFyaWFudCBmcm9tICdhc3NlcnQnO1xuXG4vKipcbiAqIENvbnN0cnVjdCB0aGlzIG9iamVjdCB0byBlbmFibGUgSHlwZXJjbGljayBpbiBhIHRleHQgZWRpdG9yLlxuICogQ2FsbCBgZGlzcG9zZWAgdG8gZGlzYWJsZSB0aGUgZmVhdHVyZS5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSHlwZXJjbGlja0ZvclRleHRFZGl0b3Ige1xuICBfdGV4dEVkaXRvcjogYXRvbSRUZXh0RWRpdG9yO1xuICBfdGV4dEVkaXRvclZpZXc6IGF0b20kVGV4dEVkaXRvckVsZW1lbnQ7XG4gIF9oeXBlcmNsaWNrOiBIeXBlcmNsaWNrO1xuICBfbGFzdE1vdXNlRXZlbnQ6ID9Nb3VzZUV2ZW50O1xuICBfbGFzdFBvc2l0aW9uOiA/YXRvbSRQb2ludDtcbiAgX2xhc3RTdWdnZXN0aW9uQXRNb3VzZVByb21pc2U6ID9Qcm9taXNlPEh5cGVyY2xpY2tTdWdnZXN0aW9uPjtcbiAgX2xhc3RTdWdnZXN0aW9uQXRNb3VzZTogP0h5cGVyY2xpY2tTdWdnZXN0aW9uO1xuICBfbmF2aWdhdGlvbk1hcmtlcnM6ID9BcnJheTxhdG9tJE1hcmtlcj47XG4gIF9sYXN0V29yZFJhbmdlOiA/YXRvbSRSYW5nZTtcbiAgX29uTW91c2VNb3ZlOiAoZXZlbnQ6IEV2ZW50KSA9PiB2b2lkO1xuICBfb25Nb3VzZURvd246IChldmVudDogRXZlbnQpID0+IHZvaWQ7XG4gIF9vbktleURvd246IChldmVudDogRXZlbnQpID0+IHZvaWQ7XG4gIF9vbktleVVwOiAoZXZlbnQ6IEV2ZW50KSA9PiB2b2lkO1xuICBfc3Vic2NyaXB0aW9uczogYXRvbSRDb21wb3NpdGVEaXNwb3NhYmxlO1xuICBfaXNEZXN0cm95ZWQ6IGJvb2xlYW47XG4gIF9pc0xvYWRpbmc6IGJvb2xlYW47XG4gIF90cmlnZ2VyS2V5czogU2V0PCdzaGlmdEtleScgfCAnY3RybEtleScgfCAnYWx0S2V5JyB8ICdtZXRhS2V5Jz47XG5cbiAgY29uc3RydWN0b3IodGV4dEVkaXRvcjogYXRvbSRUZXh0RWRpdG9yLCBoeXBlcmNsaWNrOiBIeXBlcmNsaWNrKSB7XG4gICAgdGhpcy5fdGV4dEVkaXRvciA9IHRleHRFZGl0b3I7XG4gICAgdGhpcy5fdGV4dEVkaXRvclZpZXcgPSBhdG9tLnZpZXdzLmdldFZpZXcodGV4dEVkaXRvcik7XG5cbiAgICB0aGlzLl9oeXBlcmNsaWNrID0gaHlwZXJjbGljaztcblxuICAgIHRoaXMuX2xhc3RNb3VzZUV2ZW50ID0gbnVsbDtcbiAgICB0aGlzLl9sYXN0UG9zaXRpb24gPSBudWxsO1xuICAgIC8vIFdlIHN0b3JlIHRoZSBvcmlnaW5hbCBwcm9taXNlIHRoYXQgd2UgdXNlIHRvIHJldHJpZXZlIHRoZSBsYXN0IHN1Z2dlc3Rpb25cbiAgICAvLyBzbyBjYWxsZXJzIGNhbiBhbHNvIGF3YWl0IGl0IHRvIGtub3cgd2hlbiBpdCdzIGF2YWlsYWJsZS5cbiAgICB0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2VQcm9taXNlID0gbnVsbDtcbiAgICAvLyBXZSBzdG9yZSB0aGUgbGFzdCBzdWdnZXN0aW9uIHNpbmNlIHdlIG11c3QgYXdhaXQgaXQgaW1tZWRpYXRlbHkgYW55d2F5LlxuICAgIHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZSA9IG51bGw7XG4gICAgdGhpcy5fbmF2aWdhdGlvbk1hcmtlcnMgPSBudWxsO1xuXG4gICAgdGhpcy5fbGFzdFdvcmRSYW5nZSA9IG51bGw7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG5cbiAgICB0aGlzLl9vbk1vdXNlTW92ZSA9IHRoaXMuX29uTW91c2VNb3ZlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5fb25Nb3VzZURvd24gPSB0aGlzLl9vbk1vdXNlRG93bi5iaW5kKHRoaXMpO1xuICAgIHRoaXMuX3NldHVwTW91c2VMaXN0ZW5lcnMoKTtcblxuICAgIHRoaXMuX29uS2V5RG93biA9IHRoaXMuX29uS2V5RG93bi5iaW5kKHRoaXMpO1xuICAgIHRoaXMuX3RleHRFZGl0b3JWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLl9vbktleURvd24pO1xuICAgIHRoaXMuX29uS2V5VXAgPSB0aGlzLl9vbktleVVwLmJpbmQodGhpcyk7XG4gICAgdGhpcy5fdGV4dEVkaXRvclZpZXcuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLl9vbktleVVwKTtcbiAgICAodGhpczogYW55KS5fb25Db250ZXh0TWVudSA9IHRoaXMuX29uQ29udGV4dE1lbnUuYmluZCh0aGlzKTtcbiAgICB0aGlzLl90ZXh0RWRpdG9yVmlldy5hZGRFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIHRoaXMuX29uQ29udGV4dE1lbnUpO1xuXG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb21tYW5kcy5hZGQodGhpcy5fdGV4dEVkaXRvclZpZXcsIHtcbiAgICAgICdoeXBlcmNsaWNrOmNvbmZpcm0tY3Vyc29yJzogKCkgPT4gdGhpcy5fY29uZmlybVN1Z2dlc3Rpb25BdEN1cnNvcigpLFxuICAgIH0pKTtcblxuICAgIHRoaXMuX2lzRGVzdHJveWVkID0gZmFsc2U7XG4gICAgdGhpcy5faXNMb2FkaW5nID0gZmFsc2U7XG5cbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zLmFkZChcbiAgICAgIGF0b20uY29uZmlnLm9ic2VydmUoXG4gICAgICAgIHByb2Nlc3MucGxhdGZvcm0gPT09ICdkYXJ3aW4nID8gJ2h5cGVyY2xpY2suZGFyd2luVHJpZ2dlcktleXMnIDpcbiAgICAgICAgKHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMicgPyAnaHlwZXJjbGljay53aW4zMlRyaWdnZXJLZXlzJyA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2h5cGVyY2xpY2subGludXhUcmlnZ2VyS2V5cycpLFxuICAgICAgICAobmV3VmFsdWU6IG1peGVkKSA9PiB7XG4gICAgICAgICAgdGhpcy5fdHJpZ2dlcktleXMgPSBuZXcgU2V0KCk7XG4gICAgICAgICAgaWYgKHR5cGVvZiBuZXdWYWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIG5ld1ZhbHVlLnNwbGl0KCcsJykuZm9yRWFjaCh2YWx1ZSA9PiB7XG4gICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICB2YWx1ZSA9PT0gJ3NoaWZ0S2V5JyB8fFxuICAgICAgICAgICAgICAgIHZhbHVlID09PSAnY3RybEtleScgfHxcbiAgICAgICAgICAgICAgICB2YWx1ZSA9PT0gJ2FsdEtleScgfHxcbiAgICAgICAgICAgICAgICB2YWx1ZSA9PT0gJ21ldGFLZXknXG4gICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3RyaWdnZXJLZXlzLmFkZCh2YWx1ZSk7XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICApLFxuICAgICk7XG4gIH1cblxuICBfc2V0dXBNb3VzZUxpc3RlbmVycygpOiB2b2lkIHtcbiAgICBjb25zdCBnZXRMaW5lc0RvbU5vZGUgPSAoKTogSFRNTEVsZW1lbnQgPT4ge1xuICAgICAgY29uc3Qge2NvbXBvbmVudH0gPSB0aGlzLl90ZXh0RWRpdG9yVmlldztcbiAgICAgIGludmFyaWFudChjb21wb25lbnQpO1xuICAgICAgcmV0dXJuIGNvbXBvbmVudC5saW5lc0NvbXBvbmVudC5nZXREb21Ob2RlKCk7XG4gICAgfTtcbiAgICBjb25zdCByZW1vdmVNb3VzZUxpc3RlbmVycyA9ICgpID0+IHtcbiAgICAgIGlmICh0aGlzLl90ZXh0RWRpdG9yVmlldy5jb21wb25lbnQgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBnZXRMaW5lc0RvbU5vZGUoKS5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLl9vbk1vdXNlRG93bik7XG4gICAgICBnZXRMaW5lc0RvbU5vZGUoKS5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLl9vbk1vdXNlTW92ZSk7XG4gICAgfTtcbiAgICBjb25zdCBhZGRNb3VzZUxpc3RlbmVycyA9ICgpID0+IHtcbiAgICAgIGdldExpbmVzRG9tTm9kZSgpLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuX29uTW91c2VEb3duKTtcbiAgICAgIGdldExpbmVzRG9tTm9kZSgpLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMuX29uTW91c2VNb3ZlKTtcbiAgICB9O1xuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMuYWRkKG5ldyBEaXNwb3NhYmxlKHJlbW92ZU1vdXNlTGlzdGVuZXJzKSk7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5fdGV4dEVkaXRvclZpZXcub25EaWREZXRhY2gocmVtb3ZlTW91c2VMaXN0ZW5lcnMpKTtcbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zLmFkZCh0aGlzLl90ZXh0RWRpdG9yVmlldy5vbkRpZEF0dGFjaChhZGRNb3VzZUxpc3RlbmVycykpO1xuICAgIGFkZE1vdXNlTGlzdGVuZXJzKCk7XG4gIH1cblxuICBfY29uZmlybVN1Z2dlc3Rpb24oc3VnZ2VzdGlvbjogSHlwZXJjbGlja1N1Z2dlc3Rpb24pOiB2b2lkIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShzdWdnZXN0aW9uLmNhbGxiYWNrKSAmJiBzdWdnZXN0aW9uLmNhbGxiYWNrLmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMuX2h5cGVyY2xpY2suc2hvd1N1Z2dlc3Rpb25MaXN0KHRoaXMuX3RleHRFZGl0b3IsIHN1Z2dlc3Rpb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICBpbnZhcmlhbnQodHlwZW9mIHN1Z2dlc3Rpb24uY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpO1xuICAgICAgc3VnZ2VzdGlvbi5jYWxsYmFjaygpO1xuICAgIH1cbiAgfVxuXG4gIF9vbkNvbnRleHRNZW51KGV2ZW50OiBFdmVudCk6IHZvaWQge1xuICAgIGNvbnN0IG1vdXNlRXZlbnQ6IE1vdXNlRXZlbnQgPSAoZXZlbnQ6IGFueSk7XG4gICAgLy8gSWYgdGhlIGtleSB0cmlnZ2VyIGhhcHBlbnMgdG8gY2F1c2UgdGhlIGNvbnRleHQgbWVudSB0byBzaG93IHVwLCB0aGVuXG4gICAgLy8gY2FuY2VsIGl0LiBCeSB0aGlzIHBvaW50LCBpdCdzIHRvbyBsYXRlIHRvIGtub3cgaWYgeW91J3JlIGF0IGEgc3VnZ2VzdGlvblxuICAgIC8vIHBvc2l0aW9uIHRvIGJlIG1vcmUgZmluZSBncmFpbmVkLiBTbyBpZiB5b3VyIHRyaWdnZXIga2V5cyBhcmUgXCJjdHJsK2NtZFwiLFxuICAgIC8vIHRoZW4geW91IGNhbid0IHVzZSB0aGF0IGNvbWJpbmF0aW9uIHRvIGJyaW5nIHVwIHRoZSBjb250ZXh0IG1lbnUuXG4gICAgaWYgKHRoaXMuX2lzSHlwZXJjbGlja0V2ZW50KG1vdXNlRXZlbnQpKSB7XG4gICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9XG4gIH1cblxuICBfb25Nb3VzZU1vdmUoZXZlbnQ6IEV2ZW50KTogdm9pZCB7XG4gICAgY29uc3QgbW91c2VFdmVudDogTW91c2VFdmVudCA9IChldmVudDogYW55KTtcbiAgICBpZiAodGhpcy5faXNMb2FkaW5nKSB7XG4gICAgICAvLyBTaG93IHRoZSBsb2FkaW5nIGN1cnNvci5cbiAgICAgIHRoaXMuX3RleHRFZGl0b3JWaWV3LmNsYXNzTGlzdC5hZGQoJ2h5cGVyY2xpY2stbG9hZGluZycpO1xuICAgIH1cblxuICAgIC8vIFdlIHNhdmUgdGhlIGxhc3QgYE1vdXNlRXZlbnRgIHNvIHRoZSB1c2VyIGNhbiB0cmlnZ2VyIEh5cGVyY2xpY2sgYnlcbiAgICAvLyBwcmVzc2luZyB0aGUga2V5IHdpdGhvdXQgbW92aW5nIHRoZSBtb3VzZSBhZ2Fpbi4gV2Ugb25seSBzYXZlIHRoZVxuICAgIC8vIHJlbGV2YW50IHByb3BlcnRpZXMgdG8gcHJldmVudCByZXRhaW5pbmcgYSByZWZlcmVuY2UgdG8gdGhlIGV2ZW50LlxuICAgIHRoaXMuX2xhc3RNb3VzZUV2ZW50ID0gKHtcbiAgICAgIGNsaWVudFg6IG1vdXNlRXZlbnQuY2xpZW50WCxcbiAgICAgIGNsaWVudFk6IG1vdXNlRXZlbnQuY2xpZW50WSxcbiAgICB9OiBhbnkpO1xuXG5cbiAgICAvLyBEb24ndCBmZXRjaCBzdWdnZXN0aW9ucyBpZiB0aGUgbW91c2UgaXMgc3RpbGwgaW4gdGhlIHNhbWUgJ3dvcmQnLCB3aGVyZVxuICAgIC8vICd3b3JkJyBpcyBhIHdoaXRlc3BhY2UtZGVsaW1pdGVkIGdyb3VwIG9mIGNoYXJhY3RlcnMuXG4gICAgLy9cbiAgICAvLyBJZiB0aGUgbGFzdCBzdWdnZXN0aW9uIGhhZCBtdWx0aXBsZSByYW5nZXMsIHdlIGhhdmUgbm8gY2hvaWNlIGJ1dCB0b1xuICAgIC8vIGZldGNoIHN1Z2dlc3Rpb25zIGJlY2F1c2UgdGhlIG5ldyB3b3JkIG1pZ2h0IGJlIGJldHdlZW4gdGhvc2UgcmFuZ2VzLlxuICAgIC8vIFRoaXMgc2hvdWxkIGJlIG9rIGJlY2F1c2UgaXQgd2lsbCByZXVzZSB0aGF0IGxhc3Qgc3VnZ2VzdGlvbiB1bnRpbCB0aGVcbiAgICAvLyBtb3VzZSBtb3ZlcyBvZmYgb2YgaXQuXG4gICAgY29uc3QgbGFzdFN1Z2dlc3Rpb25Jc05vdE11bHRpUmFuZ2UgPSAhdGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlIHx8XG4gICAgICAgICFBcnJheS5pc0FycmF5KHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZS5yYW5nZSk7XG4gICAgaWYgKHRoaXMuX2lzTW91c2VBdExhc3RXb3JkUmFuZ2UoKSAmJiBsYXN0U3VnZ2VzdGlvbklzTm90TXVsdGlSYW5nZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCB7cmFuZ2V9ID0gZ2V0V29yZFRleHRBbmRSYW5nZSh0aGlzLl90ZXh0RWRpdG9yLCB0aGlzLl9nZXRNb3VzZVBvc2l0aW9uQXNCdWZmZXJQb3NpdGlvbigpKTtcbiAgICB0aGlzLl9sYXN0V29yZFJhbmdlID0gcmFuZ2U7XG5cbiAgICBpZiAodGhpcy5faXNIeXBlcmNsaWNrRXZlbnQobW91c2VFdmVudCkpIHtcbiAgICAgIC8vIENsZWFyIHRoZSBzdWdnZXN0aW9uIGlmIHRoZSBtb3VzZSBtb3ZlZCBvdXQgb2YgdGhlIHJhbmdlLlxuICAgICAgaWYgKCF0aGlzLl9pc01vdXNlQXRMYXN0U3VnZ2VzdGlvbigpKSB7XG4gICAgICAgIHRoaXMuX2NsZWFyU3VnZ2VzdGlvbigpO1xuICAgICAgfVxuICAgICAgdGhpcy5fc2V0U3VnZ2VzdGlvbkZvckxhc3RNb3VzZUV2ZW50KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2NsZWFyU3VnZ2VzdGlvbigpO1xuICAgIH1cbiAgfVxuXG4gIF9vbk1vdXNlRG93bihldmVudDogRXZlbnQpOiB2b2lkIHtcbiAgICBjb25zdCBtb3VzZUV2ZW50OiBNb3VzZUV2ZW50ID0gKGV2ZW50OiBhbnkpO1xuICAgIGlmICghdGhpcy5faXNIeXBlcmNsaWNrRXZlbnQobW91c2VFdmVudCkgfHwgIXRoaXMuX2lzTW91c2VBdExhc3RTdWdnZXN0aW9uKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlKSB7XG4gICAgICBjb25zdCBsYXN0U3VnZ2VzdGlvbkF0TW91c2UgPSB0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2U7XG4gICAgICAvLyBNb3ZlIHRoZSBjdXJzb3IgdG8gdGhlIGNsaWNrIGxvY2F0aW9uIHRvIGZvcmNlIGEgbmF2aWdhdGlvbi1zdGFjayBwdXNoLlxuICAgICAgY29uc3QgbmV3Q3Vyc29yUG9zaXRpb24gPSB0aGlzLl9nZXRNb3VzZVBvc2l0aW9uQXNCdWZmZXJQb3NpdGlvbigpO1xuICAgICAgdGhpcy5fdGV4dEVkaXRvci5zZXRDdXJzb3JCdWZmZXJQb3NpdGlvbihuZXdDdXJzb3JQb3NpdGlvbik7XG5cbiAgICAgIHRoaXMuX2NvbmZpcm1TdWdnZXN0aW9uKGxhc3RTdWdnZXN0aW9uQXRNb3VzZSk7XG4gICAgICAvLyBQcmV2ZW50IHRoZSA8bWV0YS1jbGljaz4gZXZlbnQgZnJvbSBhZGRpbmcgYW5vdGhlciBjdXJzb3IuXG4gICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9XG5cbiAgICB0aGlzLl9jbGVhclN1Z2dlc3Rpb24oKTtcbiAgfVxuXG4gIF9vbktleURvd24oZXZlbnQ6IEV2ZW50KTogdm9pZCB7XG4gICAgY29uc3QgbW91c2VFdmVudDogTW91c2VFdmVudCA9IChldmVudDogYW55KTtcbiAgICAvLyBTaG93IHRoZSBzdWdnZXN0aW9uIGF0IHRoZSBsYXN0IGtub3duIG1vdXNlIHBvc2l0aW9uLlxuICAgIGlmICh0aGlzLl9pc0h5cGVyY2xpY2tFdmVudChtb3VzZUV2ZW50KSkge1xuICAgICAgdGhpcy5fc2V0U3VnZ2VzdGlvbkZvckxhc3RNb3VzZUV2ZW50KCk7XG4gICAgfVxuICB9XG5cbiAgX29uS2V5VXAoZXZlbnQ6IEV2ZW50KTogdm9pZCB7XG4gICAgY29uc3QgbW91c2VFdmVudDogTW91c2VFdmVudCA9IChldmVudDogYW55KTtcbiAgICBpZiAoIXRoaXMuX2lzSHlwZXJjbGlja0V2ZW50KG1vdXNlRXZlbnQpKSB7XG4gICAgICB0aGlzLl9jbGVhclN1Z2dlc3Rpb24oKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGBQcm9taXNlYCB0aGF0J3MgcmVzb2x2ZWQgd2hlbiB0aGUgbGF0ZXN0IHN1Z2dlc3Rpb24ncyBhdmFpbGFibGUuXG4gICAqL1xuICBnZXRTdWdnZXN0aW9uQXRNb3VzZSgpOiBQcm9taXNlPD9IeXBlcmNsaWNrU3VnZ2VzdGlvbj4ge1xuICAgIHJldHVybiB0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2VQcm9taXNlIHx8IFByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgfVxuXG4gIGFzeW5jIF9zZXRTdWdnZXN0aW9uRm9yTGFzdE1vdXNlRXZlbnQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLl9sYXN0TW91c2VFdmVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHBvc2l0aW9uID0gdGhpcy5fZ2V0TW91c2VQb3NpdGlvbkFzQnVmZmVyUG9zaXRpb24oKTtcblxuICAgIGlmICh0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2UgIT0gbnVsbCkge1xuICAgICAgY29uc3Qge3JhbmdlfSA9IHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZTtcbiAgICAgIGludmFyaWFudChyYW5nZSwgJ0h5cGVyY2xpY2sgcmVzdWx0IG11c3QgaGF2ZSBhIHZhbGlkIFJhbmdlJyk7XG4gICAgICBpZiAodGhpcy5faXNQb3NpdGlvbkluUmFuZ2UocG9zaXRpb24sIHJhbmdlKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIC8vIHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZSB3aWxsIG9ubHkgYmUgc2V0IGlmIGh5cGVyY2xpY2sgcmV0dXJuZWQgYSBwcm9taXNlIHRoYXRcbiAgICAvLyByZXNvbHZlZCB0byBhIG5vbi1udWxsIHZhbHVlLiBTbywgaW4gb3JkZXIgdG8gbm90IGFzayBoeXBlcmNsaWNrIGZvciB0aGUgc2FtZSB0aGluZ1xuICAgIC8vIGFnYWluIGFuZCBhZ2FpbiB3aGljaCB3aWxsIGJlIGFueXdheSBudWxsLCB3ZSBjaGVjayBpZiB0aGUgbW91c2UgcG9zaXRpb24gaGFzIGNoYW5nZWQuXG4gICAgaWYgKHRoaXMuX2xhc3RQb3NpdGlvbiAmJiBwb3NpdGlvbi5jb21wYXJlKHRoaXMuX2xhc3RQb3NpdGlvbikgPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9pc0xvYWRpbmcgPSB0cnVlO1xuXG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuX2xhc3RQb3NpdGlvbiA9IHBvc2l0aW9uO1xuICAgICAgdGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlUHJvbWlzZSA9XG4gICAgICAgICAgdGhpcy5faHlwZXJjbGljay5nZXRTdWdnZXN0aW9uKHRoaXMuX3RleHRFZGl0b3IsIHBvc2l0aW9uKTtcbiAgICAgIHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZSA9IGF3YWl0IHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZVByb21pc2U7XG4gICAgICBpZiAodGhpcy5faXNEZXN0cm95ZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZSAmJiB0aGlzLl9pc01vdXNlQXRMYXN0U3VnZ2VzdGlvbigpKSB7XG4gICAgICAgIC8vIEFkZCB0aGUgaHlwZXJjbGljayBtYXJrZXJzIGlmIHRoZXJlJ3MgYSBuZXcgc3VnZ2VzdGlvbiBhbmQgaXQncyB1bmRlciB0aGUgbW91c2UuXG4gICAgICAgIHRoaXMuX3VwZGF0ZU5hdmlnYXRpb25NYXJrZXJzKHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZS5yYW5nZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBSZW1vdmUgYWxsIHRoZSBtYXJrZXJzIGlmIHdlJ3ZlIGZpbmlzaGVkIGxvYWRpbmcgYW5kIHRoZXJlJ3Mgbm8gc3VnZ2VzdGlvbi5cbiAgICAgICAgdGhpcy5fdXBkYXRlTmF2aWdhdGlvbk1hcmtlcnMobnVsbCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZ2V0dGluZyBIeXBlcmNsaWNrIHN1Z2dlc3Rpb246JywgZSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMuX2RvbmVMb2FkaW5nKCk7XG4gICAgfVxuICB9XG5cbiAgX2dldE1vdXNlUG9zaXRpb25Bc0J1ZmZlclBvc2l0aW9uKCk6IGF0b20kUG9pbnQge1xuICAgIGNvbnN0IHtjb21wb25lbnR9ID0gdGhpcy5fdGV4dEVkaXRvclZpZXc7XG4gICAgaW52YXJpYW50KGNvbXBvbmVudCk7XG4gICAgaW52YXJpYW50KHRoaXMuX2xhc3RNb3VzZUV2ZW50KTtcbiAgICBjb25zdCBzY3JlZW5Qb3NpdGlvbiA9IGNvbXBvbmVudC5zY3JlZW5Qb3NpdGlvbkZvck1vdXNlRXZlbnQodGhpcy5fbGFzdE1vdXNlRXZlbnQpO1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gdGhpcy5fdGV4dEVkaXRvci5idWZmZXJQb3NpdGlvbkZvclNjcmVlblBvc2l0aW9uKHNjcmVlblBvc2l0aW9uKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgLy8gRml4IGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9udWNsaWRlL2lzc3Vlcy8yOTJcbiAgICAgIC8vIFdoZW4gbmF2aWdhdGluZyBBdG9tIHdvcmtzcGFjZSB3aXRoIGBDTUQvQ1RSTGAgZG93bixcbiAgICAgIC8vIGl0IHRyaWdnZXJzIFRleHRFZGl0b3JFbGVtZW50J3MgYG1vdXNlbW92ZWAgd2l0aCBpbnZhbGlkIHNjcmVlbiBwb3NpdGlvbi5cbiAgICAgIC8vIFRoaXMgZmFsbHMgYmFjayB0byByZXR1cm5pbmcgdGhlIHN0YXJ0IG9mIHRoZSBlZGl0b3IuXG4gICAgICBjb25zb2xlLmVycm9yKCdIeXBlcmNsaWNrOiBFcnJvciBnZXR0aW5nIGJ1ZmZlciBwb3NpdGlvbiBmb3Igc2NyZWVuIHBvc2l0aW9uOicsIGVycm9yKTtcbiAgICAgIHJldHVybiBuZXcgUG9pbnQoMCwgMCk7XG4gICAgfVxuICB9XG5cbiAgX2lzTW91c2VBdExhc3RTdWdnZXN0aW9uKCk6IGJvb2xlYW4ge1xuICAgIGlmICghdGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGNvbnN0IHtyYW5nZX0gPSB0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2U7XG4gICAgaW52YXJpYW50KHJhbmdlLCAnSHlwZXJjbGljayByZXN1bHQgbXVzdCBoYXZlIGEgdmFsaWQgUmFuZ2UnKTtcbiAgICByZXR1cm4gdGhpcy5faXNQb3NpdGlvbkluUmFuZ2UodGhpcy5fZ2V0TW91c2VQb3NpdGlvbkFzQnVmZmVyUG9zaXRpb24oKSwgcmFuZ2UpO1xuICB9XG5cbiAgX2lzTW91c2VBdExhc3RXb3JkUmFuZ2UoKTogYm9vbGVhbiB7XG4gICAgY29uc3QgbGFzdFdvcmRSYW5nZSA9IHRoaXMuX2xhc3RXb3JkUmFuZ2U7XG4gICAgaWYgKGxhc3RXb3JkUmFuZ2UgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5faXNQb3NpdGlvbkluUmFuZ2UodGhpcy5fZ2V0TW91c2VQb3NpdGlvbkFzQnVmZmVyUG9zaXRpb24oKSwgbGFzdFdvcmRSYW5nZSk7XG4gIH1cblxuICBfaXNQb3NpdGlvbkluUmFuZ2UocG9zaXRpb246IGF0b20kUG9pbnQsIHJhbmdlOiBhdG9tJFJhbmdlIHwgQXJyYXk8YXRvbSRSYW5nZT4pOiBib29sZWFuIHtcbiAgICByZXR1cm4gKEFycmF5LmlzQXJyYXkocmFuZ2UpXG4gICAgICAgID8gcmFuZ2Uuc29tZShyID0+IHIuY29udGFpbnNQb2ludChwb3NpdGlvbikpXG4gICAgICAgIDogcmFuZ2UuY29udGFpbnNQb2ludChwb3NpdGlvbikpO1xuICB9XG5cbiAgX2NsZWFyU3VnZ2VzdGlvbigpOiB2b2lkIHtcbiAgICB0aGlzLl9kb25lTG9hZGluZygpO1xuICAgIHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZVByb21pc2UgPSBudWxsO1xuICAgIHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZSA9IG51bGw7XG4gICAgdGhpcy5fdXBkYXRlTmF2aWdhdGlvbk1hcmtlcnMobnVsbCk7XG4gIH1cblxuICBhc3luYyBfY29uZmlybVN1Z2dlc3Rpb25BdEN1cnNvcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBzdWdnZXN0aW9uID0gYXdhaXQgdGhpcy5faHlwZXJjbGljay5nZXRTdWdnZXN0aW9uKFxuICAgICAgICB0aGlzLl90ZXh0RWRpdG9yLFxuICAgICAgICB0aGlzLl90ZXh0RWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkpO1xuICAgIGlmIChzdWdnZXN0aW9uKSB7XG4gICAgICB0aGlzLl9jb25maXJtU3VnZ2VzdGlvbihzdWdnZXN0aW9uKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkIG1hcmtlcnMgZm9yIHRoZSBnaXZlbiByYW5nZShzKSwgb3IgY2xlYXJzIHRoZW0gaWYgYHJhbmdlc2AgaXMgbnVsbC5cbiAgICovXG4gIF91cGRhdGVOYXZpZ2F0aW9uTWFya2VycyhyYW5nZTogPyAoYXRvbSRSYW5nZSB8IEFycmF5PGF0b20kUmFuZ2U+KSk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9uYXZpZ2F0aW9uTWFya2Vycykge1xuICAgICAgdGhpcy5fbmF2aWdhdGlvbk1hcmtlcnMuZm9yRWFjaChtYXJrZXIgPT4gbWFya2VyLmRlc3Ryb3koKSk7XG4gICAgICB0aGlzLl9uYXZpZ2F0aW9uTWFya2VycyA9IG51bGw7XG4gICAgfVxuXG4gICAgLy8gT25seSBjaGFuZ2UgdGhlIGN1cnNvciB0byBhIHBvaW50ZXIgaWYgdGhlcmUgaXMgYSBzdWdnZXN0aW9uIHJlYWR5LlxuICAgIGlmIChyYW5nZSA9PSBudWxsKSB7XG4gICAgICB0aGlzLl90ZXh0RWRpdG9yVmlldy5jbGFzc0xpc3QucmVtb3ZlKCdoeXBlcmNsaWNrJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fdGV4dEVkaXRvclZpZXcuY2xhc3NMaXN0LmFkZCgnaHlwZXJjbGljaycpO1xuICAgIGNvbnN0IHJhbmdlcyA9IEFycmF5LmlzQXJyYXkocmFuZ2UpID8gcmFuZ2UgOiBbcmFuZ2VdO1xuICAgIHRoaXMuX25hdmlnYXRpb25NYXJrZXJzID0gcmFuZ2VzLm1hcChtYXJrZXJSYW5nZSA9PiB7XG4gICAgICBjb25zdCBtYXJrZXIgPSB0aGlzLl90ZXh0RWRpdG9yLm1hcmtCdWZmZXJSYW5nZShtYXJrZXJSYW5nZSwge2ludmFsaWRhdGU6ICduZXZlcid9KTtcbiAgICAgIHRoaXMuX3RleHRFZGl0b3IuZGVjb3JhdGVNYXJrZXIoXG4gICAgICAgIG1hcmtlcixcbiAgICAgICAge3R5cGU6ICdoaWdobGlnaHQnLCBjbGFzczogJ2h5cGVyY2xpY2snfSxcbiAgICAgICk7XG4gICAgICByZXR1cm4gbWFya2VyO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgd2hldGhlciBhbiBldmVudCBzaG91bGQgYmUgaGFuZGxlZCBieSBoeXBlcmNsaWNrIG9yIG5vdC5cbiAgICovXG4gIF9pc0h5cGVyY2xpY2tFdmVudChldmVudDogU3ludGhldGljS2V5Ym9hcmRFdmVudCB8IE1vdXNlRXZlbnQpOiBib29sZWFuIHtcbiAgICByZXR1cm4gKFxuICAgICAgZXZlbnQuc2hpZnRLZXkgPT09IHRoaXMuX3RyaWdnZXJLZXlzLmhhcygnc2hpZnRLZXknKSAmJlxuICAgICAgZXZlbnQuY3RybEtleSA9PT0gdGhpcy5fdHJpZ2dlcktleXMuaGFzKCdjdHJsS2V5JykgJiZcbiAgICAgIGV2ZW50LmFsdEtleSA9PT0gdGhpcy5fdHJpZ2dlcktleXMuaGFzKCdhbHRLZXknKSAmJlxuICAgICAgZXZlbnQubWV0YUtleSA9PT0gdGhpcy5fdHJpZ2dlcktleXMuaGFzKCdtZXRhS2V5JylcbiAgICApO1xuICB9XG5cbiAgX2RvbmVMb2FkaW5nKCk6IHZvaWQge1xuICAgIHRoaXMuX2lzTG9hZGluZyA9IGZhbHNlO1xuICAgIHRoaXMuX3RleHRFZGl0b3JWaWV3LmNsYXNzTGlzdC5yZW1vdmUoJ2h5cGVyY2xpY2stbG9hZGluZycpO1xuICB9XG5cbiAgZGlzcG9zZSgpIHtcbiAgICB0aGlzLl9pc0Rlc3Ryb3llZCA9IHRydWU7XG4gICAgdGhpcy5fY2xlYXJTdWdnZXN0aW9uKCk7XG4gICAgdGhpcy5fdGV4dEVkaXRvclZpZXcucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuX29uS2V5RG93bik7XG4gICAgdGhpcy5fdGV4dEVkaXRvclZpZXcucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLl9vbktleVVwKTtcbiAgICB0aGlzLl90ZXh0RWRpdG9yVmlldy5yZW1vdmVFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIHRoaXMuX29uQ29udGV4dE1lbnUpO1xuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMuZGlzcG9zZSgpO1xuICB9XG59XG4iXX0=