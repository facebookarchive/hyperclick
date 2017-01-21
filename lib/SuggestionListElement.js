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

/* eslint-env browser */

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _atom = require('atom');

var _reactForAtom = require('react-for-atom');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

/**
 * We need to create this custom HTML element so we can hook into the view
 * registry. The overlay decoration only works through the view registry.
 */
'use babel';

var SuggestionListElement = (function (_HTMLElement) {
  _inherits(SuggestionListElement, _HTMLElement);

  function SuggestionListElement() {
    _classCallCheck(this, SuggestionListElement);

    _get(Object.getPrototypeOf(SuggestionListElement.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(SuggestionListElement, [{
    key: 'initialize',
    value: function initialize(model) {
      this._model = model;
      return this;
    }
  }, {
    key: 'attachedCallback',
    value: function attachedCallback() {
      _reactForAtom.ReactDOM.render(_reactForAtom.React.createElement(SuggestionList, { suggestionList: this._model }), this);
    }
  }, {
    key: 'detachedCallback',
    value: function detachedCallback() {
      _reactForAtom.ReactDOM.unmountComponentAtNode(this);
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      if (this.parentNode) {
        this.parentNode.removeChild(this);
      }
    }
  }]);

  return SuggestionListElement;
})(HTMLElement);

var SuggestionList = (function (_React$Component) {
  _inherits(SuggestionList, _React$Component);

  function SuggestionList(props) {
    _classCallCheck(this, SuggestionList);

    _get(Object.getPrototypeOf(SuggestionList.prototype), 'constructor', this).call(this, props);
    this.state = {
      selectedIndex: 0
    };
    this._subscriptions = new _atom.CompositeDisposable();
    this._boundConfirm = this._confirm.bind(this);
  }

  _createClass(SuggestionList, [{
    key: 'componentWillMount',
    value: function componentWillMount() {
      var suggestionList = this.props.suggestionList;

      var suggestion = suggestionList.getSuggestion();
      // TODO(nmote): This is assuming `suggestion.callback` is always an Array, which is not true
      //   according to hyperclick/lib/types. It can also be a function.
      (0, _assert2['default'])(suggestion != null && Array.isArray(suggestion.callback));
      this._items = suggestion.callback;
      this._textEditor = suggestionList.getTextEditor();
    }
  }, {
    key: 'componentDidMount',
    value: function componentDidMount() {
      var _this = this;

      var textEditor = this._textEditor;
      (0, _assert2['default'])(textEditor);
      var textEditorView = atom.views.getView(textEditor);
      var boundClose = this._close.bind(this);
      this._subscriptions.add(atom.commands.add(textEditorView, {
        'core:move-up': this._moveSelectionUp.bind(this),
        'core:move-down': this._moveSelectionDown.bind(this),
        'core:move-to-top': this._moveSelectionToTop.bind(this),
        'core:move-to-bottom': this._moveSelectionToBottom.bind(this),
        'core:cancel': boundClose,
        'editor:newline': this._boundConfirm
      }));

      this._subscriptions.add(textEditor.onDidChange(boundClose));
      this._subscriptions.add(textEditor.onDidChangeCursorPosition(boundClose));

      // Prevent scrolling the editor when scrolling the suggestion list.
      var stopPropagation = function stopPropagation(event) {
        return event.stopPropagation();
      };
      _reactForAtom.ReactDOM.findDOMNode(this.refs.scroller).addEventListener('mousewheel', stopPropagation);
      this._subscriptions.add(new _atom.Disposable(function () {
        _reactForAtom.ReactDOM.findDOMNode(_this.refs.scroller).removeEventListener('mousewheel', stopPropagation);
      }));

      var keydown = function keydown(event) {
        // If the user presses the enter key, confirm the selection.
        if (event.keyCode === 13) {
          event.stopImmediatePropagation();
          _this._confirm();
        }
      };
      textEditorView.addEventListener('keydown', keydown);
      this._subscriptions.add(new _atom.Disposable(function () {
        textEditorView.removeEventListener('keydown', keydown);
      }));
    }
  }, {
    key: 'render',
    value: function render() {
      var _this2 = this;

      var itemComponents = this._items.map(function (item, index) {
        var className = 'hyperclick-result-item';
        if (index === _this2.state.selectedIndex) {
          className += ' selected';
        }
        return _reactForAtom.React.createElement(
          'li',
          { className: className,
            key: index,
            onMouseDown: _this2._boundConfirm,
            onMouseEnter: _this2._setSelectedIndex.bind(_this2, index) },
          item.title,
          _reactForAtom.React.createElement(
            'span',
            { className: 'right-label' },
            item.rightLabel
          )
        );
      });

      return _reactForAtom.React.createElement(
        'div',
        { className: 'popover-list select-list hyperclick-suggestion-list-scroller', ref: 'scroller' },
        _reactForAtom.React.createElement(
          'ol',
          { className: 'list-group', ref: 'selectionList' },
          itemComponents
        )
      );
    }
  }, {
    key: 'componentDidUpdate',
    value: function componentDidUpdate(prevProps, prevState) {
      if (prevState.selectedIndex !== this.state.selectedIndex) {
        this._updateScrollPosition();
      }
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      this._subscriptions.dispose();
    }
  }, {
    key: '_confirm',
    value: function _confirm() {
      this._items[this.state.selectedIndex].callback();
      this._close();
    }
  }, {
    key: '_close',
    value: function _close() {
      this.props.suggestionList.hide();
    }
  }, {
    key: '_setSelectedIndex',
    value: function _setSelectedIndex(index) {
      this.setState({
        selectedIndex: index
      });
    }
  }, {
    key: '_moveSelectionDown',
    value: function _moveSelectionDown(event) {
      if (this.state.selectedIndex < this._items.length - 1) {
        this.setState({ selectedIndex: this.state.selectedIndex + 1 });
      } else {
        this._moveSelectionToTop();
      }
      if (event) {
        event.stopImmediatePropagation();
      }
    }
  }, {
    key: '_moveSelectionUp',
    value: function _moveSelectionUp(event) {
      if (this.state.selectedIndex > 0) {
        this.setState({ selectedIndex: this.state.selectedIndex - 1 });
      } else {
        this._moveSelectionToBottom();
      }
      if (event) {
        event.stopImmediatePropagation();
      }
    }
  }, {
    key: '_moveSelectionToBottom',
    value: function _moveSelectionToBottom(event) {
      this.setState({ selectedIndex: Math.max(this._items.length - 1, 0) });
      if (event) {
        event.stopImmediatePropagation();
      }
    }
  }, {
    key: '_moveSelectionToTop',
    value: function _moveSelectionToTop(event) {
      this.setState({ selectedIndex: 0 });
      if (event) {
        event.stopImmediatePropagation();
      }
    }
  }, {
    key: '_updateScrollPosition',
    value: function _updateScrollPosition() {
      var listNode = _reactForAtom.ReactDOM.findDOMNode(this.refs.selectionList);
      var selectedNode = listNode.getElementsByClassName('selected')[0];
      selectedNode.scrollIntoViewIfNeeded(false);
    }
  }]);

  return SuggestionList;
})(_reactForAtom.React.Component);

exports['default'] = document.registerElement('hyperclick-suggestion-list', {
  prototype: SuggestionListElement.prototype
});
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hc3VhcmV6L3NyYy9naXRodWIvaHlwZXJjbGljay9saWIvU3VnZ2VzdGlvbkxpc3RFbGVtZW50LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztvQkFlOEMsTUFBTTs7NEJBQ3RCLGdCQUFnQjs7c0JBQ3hCLFFBQVE7Ozs7Ozs7O0FBakI5QixXQUFXLENBQUM7O0lBdUJOLHFCQUFxQjtZQUFyQixxQkFBcUI7O1dBQXJCLHFCQUFxQjswQkFBckIscUJBQXFCOzsrQkFBckIscUJBQXFCOzs7ZUFBckIscUJBQXFCOztXQUdmLG9CQUFDLEtBQXlCLEVBQUU7QUFDcEMsVUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7QUFDcEIsYUFBTyxJQUFJLENBQUM7S0FDYjs7O1dBRWUsNEJBQVU7QUFDeEIsNkJBQVMsTUFBTSxDQUFDLGtDQUFDLGNBQWMsSUFBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLE1BQU0sQUFBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDeEU7OztXQUVlLDRCQUFVO0FBQ3hCLDZCQUFTLHNCQUFzQixDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ3ZDOzs7V0FFTSxtQkFBRztBQUNSLFVBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtBQUNuQixZQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztPQUNuQztLQUNGOzs7U0FwQkcscUJBQXFCO0dBQVMsV0FBVzs7SUErQnpDLGNBQWM7WUFBZCxjQUFjOztBQVNQLFdBVFAsY0FBYyxDQVNOLEtBQVksRUFBRTswQkFUdEIsY0FBYzs7QUFVaEIsK0JBVkUsY0FBYyw2Q0FVVixLQUFLLEVBQUU7QUFDYixRQUFJLENBQUMsS0FBSyxHQUFHO0FBQ1gsbUJBQWEsRUFBRSxDQUFDO0tBQ2pCLENBQUM7QUFDRixRQUFJLENBQUMsY0FBYyxHQUFHLCtCQUF5QixDQUFDO0FBQ2hELFFBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxD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S0FBSyxFQUFFO0FBQ1QsYUFBSyxDQUFDLHdCQUF3QixFQUFFLENBQUM7T0FDbEM7S0FDRjs7O1dBRWtCLDZCQUFDLEtBQUssRUFBRTtBQUN6QixVQUFJLENBQUMsUUFBUSxDQUFDLEVBQUMsYUFBYSxFQUFFLENBQUMsRUFBQyxDQUFDLENBQUM7QUFDbEMsVUFBSSxLQUFLLEVBQUU7QUFDVCxhQUFLLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztPQUNsQztLQUNGOzs7V0FFb0IsaUNBQUc7QUFDdEIsVUFBTSxRQUFRLEdBQUcsdUJBQVMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDL0QsVUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLHNCQUFzQixDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3BFLGtCQUFZLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDNUM7OztTQTlKRyxjQUFjO0dBQVMsb0JBQU0sU0FBUzs7cUJBaUs3QixRQUFRLENBQUMsZUFBZSxDQUFDLDRCQUE0QixFQUFFO0FBQ3BFLFdBQVMsRUFBRSxxQkFBcUIsQ0FBQyxTQUFTO0NBQzNDLENBQUMiLCJmaWxlIjoiL1VzZXJzL2FzdWFyZXovc3JjL2dpdGh1Yi9oeXBlcmNsaWNrL2xpYi9TdWdnZXN0aW9uTGlzdEVsZW1lbnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG4vKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cblxuaW1wb3J0IHR5cGUgU3VnZ2VzdGlvbkxpc3RUeXBlIGZyb20gJy4vU3VnZ2VzdGlvbkxpc3QnO1xuXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGV9IGZyb20gJ2F0b20nO1xuaW1wb3J0IHtSZWFjdCwgUmVhY3RET019IGZyb20gJ3JlYWN0LWZvci1hdG9tJztcbmltcG9ydCBpbnZhcmlhbnQgZnJvbSAnYXNzZXJ0JztcblxuLyoqXG4gKiBXZSBuZWVkIHRvIGNyZWF0ZSB0aGlzIGN1c3RvbSBIVE1MIGVsZW1lbnQgc28gd2UgY2FuIGhvb2sgaW50byB0aGUgdmlld1xuICogcmVnaXN0cnkuIFRoZSBvdmVybGF5IGRlY29yYXRpb24gb25seSB3b3JrcyB0aHJvdWdoIHRoZSB2aWV3IHJlZ2lzdHJ5LlxuICovXG5jbGFzcyBTdWdnZXN0aW9uTGlzdEVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG4gIF9tb2RlbDogU3VnZ2VzdGlvbkxpc3RUeXBlO1xuXG4gIGluaXRpYWxpemUobW9kZWw6IFN1Z2dlc3Rpb25MaXN0VHlwZSkge1xuICAgIHRoaXMuX21vZGVsID0gbW9kZWw7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBhdHRhY2hlZENhbGxiYWNrKCk6IG1peGVkIHtcbiAgICBSZWFjdERPTS5yZW5kZXIoPFN1Z2dlc3Rpb25MaXN0IHN1Z2dlc3Rpb25MaXN0PXt0aGlzLl9tb2RlbH0gLz4sIHRoaXMpO1xuICB9XG5cbiAgZGV0YWNoZWRDYWxsYmFjaygpOiBtaXhlZCB7XG4gICAgUmVhY3RET00udW5tb3VudENvbXBvbmVudEF0Tm9kZSh0aGlzKTtcbiAgfVxuXG4gIGRpc3Bvc2UoKSB7XG4gICAgaWYgKHRoaXMucGFyZW50Tm9kZSkge1xuICAgICAgdGhpcy5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMpO1xuICAgIH1cbiAgfVxufVxuXG50eXBlIFByb3BzID0ge1xuICBzdWdnZXN0aW9uTGlzdDogU3VnZ2VzdGlvbkxpc3RUeXBlLFxufTtcblxudHlwZSBTdGF0ZSA9IHtcbiAgc2VsZWN0ZWRJbmRleDogbnVtYmVyLFxufTtcblxuY2xhc3MgU3VnZ2VzdGlvbkxpc3QgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBwcm9wczogUHJvcHM7XG4gIHN0YXRlOiBTdGF0ZTtcblxuICBfaXRlbXM6IEFycmF5PHtyaWdodExhYmVsPzogc3RyaW5nLCB0aXRsZTogc3RyaW5nLCBjYWxsYmFjazogKCkgPT4gbWl4ZWR9PjtcbiAgX3RleHRFZGl0b3I6ID9hdG9tJFRleHRFZGl0b3I7XG4gIF9zdWJzY3JpcHRpb25zOiBhdG9tJENvbXBvc2l0ZURpc3Bvc2FibGU7XG4gIF9ib3VuZENvbmZpcm06ICgpID0+IHZvaWQ7XG5cbiAgY29uc3RydWN0b3IocHJvcHM6IFByb3BzKSB7XG4gICAgc3VwZXIocHJvcHMpO1xuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICBzZWxlY3RlZEluZGV4OiAwLFxuICAgIH07XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgdGhpcy5fYm91bmRDb25maXJtID0gdGhpcy5fY29uZmlybS5iaW5kKHRoaXMpO1xuICB9XG5cbiAgY29tcG9uZW50V2lsbE1vdW50KCkge1xuICAgIGNvbnN0IHtzdWdnZXN0aW9uTGlzdH0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHN1Z2dlc3Rpb24gPSBzdWdnZXN0aW9uTGlzdC5nZXRTdWdnZXN0aW9uKCk7XG4gICAgLy8gVE9ETyhubW90ZSk6IFRoaXMgaXMgYXNzdW1pbmcgYHN1Z2dlc3Rpb24uY2FsbGJhY2tgIGlzIGFsd2F5cyBhbiBBcnJheSwgd2hpY2ggaXMgbm90IHRydWVcbiAgICAvLyAgIGFjY29yZGluZyB0byBoeXBlcmNsaWNrL2xpYi90eXBlcy4gSXQgY2FuIGFsc28gYmUgYSBmdW5jdGlvbi5cbiAgICBpbnZhcmlhbnQoc3VnZ2VzdGlvbiAhPSBudWxsICYmIEFycmF5LmlzQXJyYXkoc3VnZ2VzdGlvbi5jYWxsYmFjaykpO1xuICAgIHRoaXMuX2l0ZW1zID0gc3VnZ2VzdGlvbi5jYWxsYmFjaztcbiAgICB0aGlzLl90ZXh0RWRpdG9yID0gc3VnZ2VzdGlvbkxpc3QuZ2V0VGV4dEVkaXRvcigpO1xuICB9XG5cbiAgY29tcG9uZW50RGlkTW91bnQoKSB7XG4gICAgY29uc3QgdGV4dEVkaXRvciA9IHRoaXMuX3RleHRFZGl0b3I7XG4gICAgaW52YXJpYW50KHRleHRFZGl0b3IpO1xuICAgIGNvbnN0IHRleHRFZGl0b3JWaWV3ID0gYXRvbS52aWV3cy5nZXRWaWV3KHRleHRFZGl0b3IpO1xuICAgIGNvbnN0IGJvdW5kQ2xvc2UgPSB0aGlzLl9jbG9zZS5iaW5kKHRoaXMpO1xuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgICBhdG9tLmNvbW1hbmRzLmFkZCh0ZXh0RWRpdG9yVmlldywge1xuICAgICAgICAgICdjb3JlOm1vdmUtdXAnOiB0aGlzLl9tb3ZlU2VsZWN0aW9uVXAuYmluZCh0aGlzKSxcbiAgICAgICAgICAnY29yZTptb3ZlLWRvd24nOiB0aGlzLl9tb3ZlU2VsZWN0aW9uRG93bi5iaW5kKHRoaXMpLFxuICAgICAgICAgICdjb3JlOm1vdmUtdG8tdG9wJzogdGhpcy5fbW92ZVNlbGVjdGlvblRvVG9wLmJpbmQodGhpcyksXG4gICAgICAgICAgJ2NvcmU6bW92ZS10by1ib3R0b20nOiB0aGlzLl9tb3ZlU2VsZWN0aW9uVG9Cb3R0b20uYmluZCh0aGlzKSxcbiAgICAgICAgICAnY29yZTpjYW5jZWwnOiBib3VuZENsb3NlLFxuICAgICAgICAgICdlZGl0b3I6bmV3bGluZSc6IHRoaXMuX2JvdW5kQ29uZmlybSxcbiAgICAgICAgfSkpO1xuXG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5hZGQodGV4dEVkaXRvci5vbkRpZENoYW5nZShib3VuZENsb3NlKSk7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5hZGQodGV4dEVkaXRvci5vbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uKGJvdW5kQ2xvc2UpKTtcblxuICAgIC8vIFByZXZlbnQgc2Nyb2xsaW5nIHRoZSBlZGl0b3Igd2hlbiBzY3JvbGxpbmcgdGhlIHN1Z2dlc3Rpb24gbGlzdC5cbiAgICBjb25zdCBzdG9wUHJvcGFnYXRpb24gPSBldmVudCA9PiBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICBSZWFjdERPTS5maW5kRE9NTm9kZSh0aGlzLnJlZnMuc2Nyb2xsZXIpLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNld2hlZWwnLCBzdG9wUHJvcGFnYXRpb24pO1xuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMuYWRkKG5ldyBEaXNwb3NhYmxlKCgpID0+IHtcbiAgICAgIFJlYWN0RE9NLmZpbmRET01Ob2RlKHRoaXMucmVmcy5zY3JvbGxlcilcbiAgICAgICAgLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNld2hlZWwnLCBzdG9wUHJvcGFnYXRpb24pO1xuICAgIH0pKTtcblxuICAgIGNvbnN0IGtleWRvd24gPSAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpID0+IHtcbiAgICAgIC8vIElmIHRoZSB1c2VyIHByZXNzZXMgdGhlIGVudGVyIGtleSwgY29uZmlybSB0aGUgc2VsZWN0aW9uLlxuICAgICAgaWYgKGV2ZW50LmtleUNvZGUgPT09IDEzKSB7XG4gICAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgICAgICB0aGlzLl9jb25maXJtKCk7XG4gICAgICB9XG4gICAgfTtcbiAgICB0ZXh0RWRpdG9yVmlldy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywga2V5ZG93bik7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5hZGQobmV3IERpc3Bvc2FibGUoKCkgPT4ge1xuICAgICAgdGV4dEVkaXRvclZpZXcucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGtleWRvd24pO1xuICAgIH0pKTtcbiAgfVxuXG4gIHJlbmRlcigpIHtcbiAgICBjb25zdCBpdGVtQ29tcG9uZW50cyA9IHRoaXMuX2l0ZW1zLm1hcCgoaXRlbSwgaW5kZXgpID0+IHtcbiAgICAgIGxldCBjbGFzc05hbWUgPSAnaHlwZXJjbGljay1yZXN1bHQtaXRlbSc7XG4gICAgICBpZiAoaW5kZXggPT09IHRoaXMuc3RhdGUuc2VsZWN0ZWRJbmRleCkge1xuICAgICAgICBjbGFzc05hbWUgKz0gJyBzZWxlY3RlZCc7XG4gICAgICB9XG4gICAgICByZXR1cm4gKFxuICAgICAgICA8bGkgY2xhc3NOYW1lPXtjbGFzc05hbWV9XG4gICAgICAgICAgICBrZXk9e2luZGV4fVxuICAgICAgICAgICAgb25Nb3VzZURvd249e3RoaXMuX2JvdW5kQ29uZmlybX1cbiAgICAgICAgICAgIG9uTW91c2VFbnRlcj17dGhpcy5fc2V0U2VsZWN0ZWRJbmRleC5iaW5kKHRoaXMsIGluZGV4KX0+XG4gICAgICAgICAgICB7aXRlbS50aXRsZX1cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInJpZ2h0LWxhYmVsXCI+e2l0ZW0ucmlnaHRMYWJlbH08L3NwYW4+XG4gICAgICAgIDwvbGk+XG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwicG9wb3Zlci1saXN0IHNlbGVjdC1saXN0IGh5cGVyY2xpY2stc3VnZ2VzdGlvbi1saXN0LXNjcm9sbGVyXCIgcmVmPVwic2Nyb2xsZXJcIj5cbiAgICAgICAgPG9sIGNsYXNzTmFtZT1cImxpc3QtZ3JvdXBcIiByZWY9XCJzZWxlY3Rpb25MaXN0XCI+XG4gICAgICAgICAge2l0ZW1Db21wb25lbnRzfVxuICAgICAgICA8L29sPlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfVxuXG4gIGNvbXBvbmVudERpZFVwZGF0ZShwcmV2UHJvcHM6IE9iamVjdCwgcHJldlN0YXRlOiBPYmplY3QpIHtcbiAgICBpZiAocHJldlN0YXRlLnNlbGVjdGVkSW5kZXggIT09IHRoaXMuc3RhdGUuc2VsZWN0ZWRJbmRleCkge1xuICAgICAgdGhpcy5fdXBkYXRlU2Nyb2xsUG9zaXRpb24oKTtcbiAgICB9XG4gIH1cblxuICBjb21wb25lbnRXaWxsVW5tb3VudCgpIHtcbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKTtcbiAgfVxuXG4gIF9jb25maXJtKCkge1xuICAgIHRoaXMuX2l0ZW1zW3RoaXMuc3RhdGUuc2VsZWN0ZWRJbmRleF0uY2FsbGJhY2soKTtcbiAgICB0aGlzLl9jbG9zZSgpO1xuICB9XG5cbiAgX2Nsb3NlKCkge1xuICAgIHRoaXMucHJvcHMuc3VnZ2VzdGlvbkxpc3QuaGlkZSgpO1xuICB9XG5cbiAgX3NldFNlbGVjdGVkSW5kZXgoaW5kZXg6IG51bWJlcikge1xuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgc2VsZWN0ZWRJbmRleDogaW5kZXgsXG4gICAgfSk7XG4gIH1cblxuICBfbW92ZVNlbGVjdGlvbkRvd24oZXZlbnQpIHtcbiAgICBpZiAodGhpcy5zdGF0ZS5zZWxlY3RlZEluZGV4IDwgdGhpcy5faXRlbXMubGVuZ3RoIC0gMSkge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7c2VsZWN0ZWRJbmRleDogdGhpcy5zdGF0ZS5zZWxlY3RlZEluZGV4ICsgMX0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9tb3ZlU2VsZWN0aW9uVG9Ub3AoKTtcbiAgICB9XG4gICAgaWYgKGV2ZW50KSB7XG4gICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICB9XG4gIH1cblxuICBfbW92ZVNlbGVjdGlvblVwKGV2ZW50KSB7XG4gICAgaWYgKHRoaXMuc3RhdGUuc2VsZWN0ZWRJbmRleCA+IDApIHtcbiAgICAgIHRoaXMuc2V0U3RhdGUoe3NlbGVjdGVkSW5kZXg6IHRoaXMuc3RhdGUuc2VsZWN0ZWRJbmRleCAtIDF9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fbW92ZVNlbGVjdGlvblRvQm90dG9tKCk7XG4gICAgfVxuICAgIGlmIChldmVudCkge1xuICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgfVxuICB9XG5cbiAgX21vdmVTZWxlY3Rpb25Ub0JvdHRvbShldmVudCkge1xuICAgIHRoaXMuc2V0U3RhdGUoe3NlbGVjdGVkSW5kZXg6IE1hdGgubWF4KHRoaXMuX2l0ZW1zLmxlbmd0aCAtIDEsIDApfSk7XG4gICAgaWYgKGV2ZW50KSB7XG4gICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICB9XG4gIH1cblxuICBfbW92ZVNlbGVjdGlvblRvVG9wKGV2ZW50KSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7c2VsZWN0ZWRJbmRleDogMH0pO1xuICAgIGlmIChldmVudCkge1xuICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgfVxuICB9XG5cbiAgX3VwZGF0ZVNjcm9sbFBvc2l0aW9uKCkge1xuICAgIGNvbnN0IGxpc3ROb2RlID0gUmVhY3RET00uZmluZERPTU5vZGUodGhpcy5yZWZzLnNlbGVjdGlvbkxpc3QpO1xuICAgIGNvbnN0IHNlbGVjdGVkTm9kZSA9IGxpc3ROb2RlLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ3NlbGVjdGVkJylbMF07XG4gICAgc2VsZWN0ZWROb2RlLnNjcm9sbEludG9WaWV3SWZOZWVkZWQoZmFsc2UpO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudCgnaHlwZXJjbGljay1zdWdnZXN0aW9uLWxpc3QnLCB7XG4gIHByb3RvdHlwZTogU3VnZ2VzdGlvbkxpc3RFbGVtZW50LnByb3RvdHlwZSxcbn0pO1xuIl19