
/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require('atom');

var CompositeDisposable = _require.CompositeDisposable;
var Disposable = _require.Disposable;

var React = require('react-for-atom');

/**
 * We need to create this custom HTML element so we can hook into the view
 * registry. The overlay decoration only works through the view registry.
 */

var SuggestionListElement = (function (_HTMLElement) {
  _inherits(SuggestionListElement, _HTMLElement);

  function SuggestionListElement() {
    _classCallCheck(this, SuggestionListElement);

    _get(Object.getPrototypeOf(SuggestionListElement.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(SuggestionListElement, [{
    key: 'initialize',
    value: function initialize(model) {
      if (!model) {
        return;
      }
      this._model = model;
      return this;
    }
  }, {
    key: 'attachedCallback',
    value: function attachedCallback() {
      React.render(React.createElement(SuggestionList, { suggestionList: this._model }), this);
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      React.unmountComponentAtNode(this);
      if (this.parentNode) {
        this.parentNode.removeChild(this);
      }
    }
  }]);

  return SuggestionListElement;
})(HTMLElement);

var SuggestionList = React.createClass({
  displayName: 'SuggestionList',

  _subscriptions: undefined,

  propTypes: {
    suggestionList: React.PropTypes.object
  },

  getInitialState: function getInitialState() {
    return {
      selectedIndex: 0,
      items: []
    };
  },

  componentWillMount: function componentWillMount() {
    this._items = this.props.suggestionList.getSuggestion().callback;
    this._textEditor = this.props.suggestionList.getTextEditor();
  },

  componentDidMount: function componentDidMount() {
    var _this = this;

    this._subscriptions = new CompositeDisposable();

    var textEditorView = atom.views.getView(this._textEditor);
    this._subscriptions.add(atom.commands.add(textEditorView, {
      'core:move-up': this._moveSelectionUp,
      'core:move-down': this._moveSelectionDown,
      'core:move-to-top': this._moveSelectionToTop,
      'core:move-to-bottom': this._moveSelectionToBottom,
      'core:cancel': this._close,
      'editor:newline': this._confirm
    }));

    this._subscriptions.add(this._textEditor.onDidChange(this._close));
    this._subscriptions.add(this._textEditor.onDidChangeCursorPosition(this._close));

    // Prevent scrolling the editor when scrolling the suggestion list.
    var stopPropagation = function stopPropagation(event) {
      return event.stopPropagation();
    };
    React.findDOMNode(this.refs['scroller']).addEventListener('mousewheel', stopPropagation);
    this._subscriptions.add(new Disposable(function () {
      React.findDOMNode(_this.refs['scroller']).removeEventListener('mousewheel', stopPropagation);
    }));

    var keydown = function keydown(event) {
      // If the user presses the enter key, confirm the selection.
      if (event.keyCode === 13) {
        event.stopImmediatePropagation();
        _this._confirm();
      }
    };
    textEditorView.addEventListener('keydown', keydown);
    this._subscriptions.add(new Disposable(function () {
      textEditorView.removeEventListener('keydown', keydown);
    }));
  },

  render: function render() {
    var _this2 = this;

    var itemComponents = this._items.map(function (item, index) {
      var className = 'hyperclick-result-item';
      if (index === _this2.state.selectedIndex) {
        className += ' selected';
      }
      return React.createElement(
        'li',
        { className: className,
          key: index,
          onMouseDown: _this2._confirm,
          onMouseEnter: _this2._setSelectedIndex.bind(_this2, index) },
        item.title
      );
    });

    return React.createElement(
      'div',
      { className: 'popover-list select-list hyperclick-suggestion-list-scroller', ref: 'scroller' },
      React.createElement(
        'ol',
        { className: 'list-group', ref: 'selectionList' },
        itemComponents
      )
    );
  },

  componentDidUpdate: function componentDidUpdate(prevProps, prevState) {
    if (prevState.selectedIndex !== this.state.selectedIndex) {
      this._updateScrollPosition();
    }
  },

  componentWillUnmount: function componentWillUnmount() {
    this._subscriptions.dispose();
  },

  _confirm: function _confirm() {
    this._items[this.state.selectedIndex].callback();
    this._close();
  },

  _close: function _close() {
    this.props.suggestionList.hide();
  },

  _setSelectedIndex: function _setSelectedIndex(index) {
    this.setState({
      selectedIndex: index
    });
  },

  _moveSelectionDown: function _moveSelectionDown(event) {
    if (this.state.selectedIndex < this._items.length - 1) {
      this.setState({ selectedIndex: this.state.selectedIndex + 1 });
    } else {
      this._moveSelectionToTop();
    }
    if (event) {
      event.stopImmediatePropagation();
    }
  },

  _moveSelectionUp: function _moveSelectionUp(event) {
    if (this.state.selectedIndex > 0) {
      this.setState({ selectedIndex: this.state.selectedIndex - 1 });
    } else {
      this._moveSelectionToBottom();
    }
    if (event) {
      event.stopImmediatePropagation();
    }
  },

  _moveSelectionToBottom: function _moveSelectionToBottom(event) {
    this.setState({ selectedIndex: Math.max(this._items.length - 1, 0) });
    if (event) {
      event.stopImmediatePropagation();
    }
  },

  _moveSelectionToTop: function _moveSelectionToTop(event) {
    this.setState({ selectedIndex: 0 });
    if (event) {
      event.stopImmediatePropagation();
    }
  },

  _updateScrollPosition: function _updateScrollPosition() {
    var listNode = React.findDOMNode(this.refs['selectionList']);
    var selectedNode = listNode.getElementsByClassName('selected')[0];
    selectedNode.scrollIntoViewIfNeeded(false);
  }
});

module.exports = SuggestionListElement = document.registerElement('hyperclick-suggestion-list', { prototype: SuggestionListElement.prototype });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy93MS9fMm1jNm0wNTBxbjIzMm5wc2Y5ejNoZnNoNThfamgvVC90bXBpMzV6akdwdWJsaXNoX3BhY2thZ2VzL2FwbS9oeXBlcmNsaWNrL2xpYi9TdWdnZXN0aW9uTGlzdEVsZW1lbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7ZUFXNEIsT0FBTyxDQUFDLE1BQU0sQ0FBQzs7SUFBbEQsbUJBQW1CLFlBQW5CLG1CQUFtQjtJQUFFLFVBQVUsWUFBVixVQUFVOztBQUNwQyxJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQzs7Ozs7OztJQU1oQyxxQkFBcUI7WUFBckIscUJBQXFCOztXQUFyQixxQkFBcUI7MEJBQXJCLHFCQUFxQjs7K0JBQXJCLHFCQUFxQjs7O2VBQXJCLHFCQUFxQjs7V0FHZixvQkFBQyxLQUFhLEVBQUU7QUFDeEIsVUFBSSxDQUFDLEtBQUssRUFBRTtBQUNWLGVBQU87T0FDUjtBQUNELFVBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO0FBQ3BCLGFBQU8sSUFBSSxDQUFDO0tBQ2I7OztXQUVlLDRCQUFHO0FBQ2pCLFdBQUssQ0FBQyxNQUFNLENBQUMsb0JBQUMsY0FBYyxJQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsTUFBTSxBQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztLQUNyRTs7O1dBRU0sbUJBQUc7QUFDUixXQUFLLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDbkMsVUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFO0FBQ25CLFlBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO09BQ25DO0tBQ0Y7OztTQXBCRyxxQkFBcUI7R0FBUyxXQUFXOztBQXVCL0MsSUFBSSxjQUFjLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQzs7O0FBQ3JDLGdCQUFjLEVBQUUsU0FBUzs7QUFFekIs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QUFtQixFQUFBLDZCQUFDLEtBQUssRUFBRTtBQUN6QixRQUFJLENBQUMsUUFBUSxDQUFDLEVBQUMsYUFBYSxFQUFFLENBQUMsRUFBQyxDQUFDLENBQUM7QUFDbEMsUUFBSSxLQUFLLEVBQUU7QUFDVCxXQUFLLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztLQUNsQztHQUNGOztBQUVELHVCQUFxQixFQUFBLGlDQUFHO0FBQ3RCLFFBQUksUUFBUSxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO0FBQzdELFFBQUksWUFBWSxHQUFHLFFBQVEsQ0FBQyxzQkFBc0IsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsRSxnQkFBWSxDQUFDLHNCQUFzQixDQUFDLEtBQUssQ0FBQyxDQUFDO0dBQzVDO0NBQ0YsQ0FBQyxDQUFDOztBQUVILE1BQU0sQ0FBQyxPQUFPLEdBQUcscUJBQXFCLEdBQUcsUUFBUSxDQUFDLGVBQWUsQ0FBQyw0QkFBNEIsRUFBRSxFQUFDLFNBQVMsRUFBRSxxQkFBcUIsQ0FBQyxTQUFTLEVBQUMsQ0FBQyxDQUFDIiwiZmlsZSI6Ii92YXIvZm9sZGVycy93MS9fMm1jNm0wNTBxbjIzMm5wc2Y5ejNoZnNoNThfamgvVC90bXBpMzV6akdwdWJsaXNoX3BhY2thZ2VzL2FwbS9oeXBlcmNsaWNrL2xpYi9TdWdnZXN0aW9uTGlzdEVsZW1lbnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG52YXIge0NvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGV9ID0gcmVxdWlyZSgnYXRvbScpO1xudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QtZm9yLWF0b20nKTtcblxuLyoqXG4gKiBXZSBuZWVkIHRvIGNyZWF0ZSB0aGlzIGN1c3RvbSBIVE1MIGVsZW1lbnQgc28gd2UgY2FuIGhvb2sgaW50byB0aGUgdmlld1xuICogcmVnaXN0cnkuIFRoZSBvdmVybGF5IGRlY29yYXRpb24gb25seSB3b3JrcyB0aHJvdWdoIHRoZSB2aWV3IHJlZ2lzdHJ5LlxuICovXG5jbGFzcyBTdWdnZXN0aW9uTGlzdEVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG4gIF9tb2RlbDogT2JqZWN0O1xuXG4gIGluaXRpYWxpemUobW9kZWw6IE9iamVjdCkge1xuICAgIGlmICghbW9kZWwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5fbW9kZWwgPSBtb2RlbDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGF0dGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgUmVhY3QucmVuZGVyKDxTdWdnZXN0aW9uTGlzdCBzdWdnZXN0aW9uTGlzdD17dGhpcy5fbW9kZWx9IC8+LCB0aGlzKTtcbiAgfVxuXG4gIGRpc3Bvc2UoKSB7XG4gICAgUmVhY3QudW5tb3VudENvbXBvbmVudEF0Tm9kZSh0aGlzKTtcbiAgICBpZiAodGhpcy5wYXJlbnROb2RlKSB7XG4gICAgICB0aGlzLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcyk7XG4gICAgfVxuICB9XG59XG5cbnZhciBTdWdnZXN0aW9uTGlzdCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgX3N1YnNjcmlwdGlvbnM6IHVuZGVmaW5lZCxcblxuICBwcm9wVHlwZXM6IHtcbiAgICBzdWdnZXN0aW9uTGlzdDogUmVhY3QuUHJvcFR5cGVzLm9iamVjdCxcbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGUoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHNlbGVjdGVkSW5kZXg6IDAsXG4gICAgICBpdGVtczogW10sXG4gICAgfTtcbiAgfSxcblxuICBjb21wb25lbnRXaWxsTW91bnQoKSB7XG4gICAgdGhpcy5faXRlbXMgPSB0aGlzLnByb3BzLnN1Z2dlc3Rpb25MaXN0LmdldFN1Z2dlc3Rpb24oKS5jYWxsYmFjaztcbiAgICB0aGlzLl90ZXh0RWRpdG9yID0gdGhpcy5wcm9wcy5zdWdnZXN0aW9uTGlzdC5nZXRUZXh0RWRpdG9yKCk7XG4gIH0sXG5cbiAgY29tcG9uZW50RGlkTW91bnQoKSB7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG5cbiAgICB2YXIgdGV4dEVkaXRvclZpZXcgPSBhdG9tLnZpZXdzLmdldFZpZXcodGhpcy5fdGV4dEVkaXRvcik7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgICAgIGF0b20uY29tbWFuZHMuYWRkKHRleHRFZGl0b3JWaWV3LCB7XG4gICAgICAgICAgJ2NvcmU6bW92ZS11cCc6IHRoaXMuX21vdmVTZWxlY3Rpb25VcCxcbiAgICAgICAgICAnY29yZTptb3ZlLWRvd24nOiB0aGlzLl9tb3ZlU2VsZWN0aW9uRG93bixcbiAgICAgICAgICAnY29yZTptb3ZlLXRvLXRvcCc6IHRoaXMuX21vdmVTZWxlY3Rpb25Ub1RvcCxcbiAgICAgICAgICAnY29yZTptb3ZlLXRvLWJvdHRvbSc6IHRoaXMuX21vdmVTZWxlY3Rpb25Ub0JvdHRvbSxcbiAgICAgICAgICAnY29yZTpjYW5jZWwnOiB0aGlzLl9jbG9zZSxcbiAgICAgICAgICAnZWRpdG9yOm5ld2xpbmUnOiB0aGlzLl9jb25maXJtLFxuICAgICAgICB9KSk7XG5cbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zLmFkZCh0aGlzLl90ZXh0RWRpdG9yLm9uRGlkQ2hhbmdlKHRoaXMuX2Nsb3NlKSk7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5fdGV4dEVkaXRvci5vbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uKHRoaXMuX2Nsb3NlKSk7XG5cbiAgICAvLyBQcmV2ZW50IHNjcm9sbGluZyB0aGUgZWRpdG9yIHdoZW4gc2Nyb2xsaW5nIHRoZSBzdWdnZXN0aW9uIGxpc3QuXG4gICAgdmFyIHN0b3BQcm9wYWdhdGlvbiA9IChldmVudCkgPT4gZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgUmVhY3QuZmluZERPTU5vZGUodGhpcy5yZWZzWydzY3JvbGxlciddKS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXdoZWVsJywgc3RvcFByb3BhZ2F0aW9uKTtcbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zLmFkZChuZXcgRGlzcG9zYWJsZSgoKSA9PiB7XG4gICAgICBSZWFjdC5maW5kRE9NTm9kZSh0aGlzLnJlZnNbJ3Njcm9sbGVyJ10pLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNld2hlZWwnLCBzdG9wUHJvcGFnYXRpb24pO1xuICAgIH0pKTtcblxuICAgIHZhciBrZXlkb3duID0gKGV2ZW50OiBFdmVudCkgPT4ge1xuICAgICAgLy8gSWYgdGhlIHVzZXIgcHJlc3NlcyB0aGUgZW50ZXIga2V5LCBjb25maXJtIHRoZSBzZWxlY3Rpb24uXG4gICAgICBpZiAoZXZlbnQua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICAgIHRoaXMuX2NvbmZpcm0oKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHRleHRFZGl0b3JWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBrZXlkb3duKTtcbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zLmFkZChuZXcgRGlzcG9zYWJsZSgoKSA9PiB7XG4gICAgICB0ZXh0RWRpdG9yVmlldy5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywga2V5ZG93bik7XG4gICAgfSkpO1xuICB9LFxuXG4gIHJlbmRlcigpIHtcbiAgICB2YXIgaXRlbUNvbXBvbmVudHMgPSB0aGlzLl9pdGVtcy5tYXAoKGl0ZW0sIGluZGV4KSA9PiB7XG4gICAgICB2YXIgY2xhc3NOYW1lID0gJ2h5cGVyY2xpY2stcmVzdWx0LWl0ZW0nO1xuICAgICAgaWYgKGluZGV4ID09PSB0aGlzLnN0YXRlLnNlbGVjdGVkSW5kZXgpIHtcbiAgICAgICAgY2xhc3NOYW1lICs9ICcgc2VsZWN0ZWQnO1xuICAgICAgfVxuICAgICAgcmV0dXJuIChcbiAgICAgICAgPGxpIGNsYXNzTmFtZT17Y2xhc3NOYW1lfVxuICAgICAgICAgICAga2V5PXtpbmRleH1cbiAgICAgICAgICAgIG9uTW91c2VEb3duPXt0aGlzLl9jb25maXJtfVxuICAgICAgICAgICAgb25Nb3VzZUVudGVyPXt0aGlzLl9zZXRTZWxlY3RlZEluZGV4LmJpbmQodGhpcywgaW5kZXgpfT5cbiAgICAgICAgICB7aXRlbS50aXRsZX1cbiAgICAgICAgPC9saT5cbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJwb3BvdmVyLWxpc3Qgc2VsZWN0LWxpc3QgaHlwZXJjbGljay1zdWdnZXN0aW9uLWxpc3Qtc2Nyb2xsZXJcIiByZWY9XCJzY3JvbGxlclwiPlxuICAgICAgICA8b2wgY2xhc3NOYW1lPVwibGlzdC1ncm91cFwiIHJlZj1cInNlbGVjdGlvbkxpc3RcIj5cbiAgICAgICAgICB7aXRlbUNvbXBvbmVudHN9XG4gICAgICAgIDwvb2w+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9LFxuXG4gIGNvbXBvbmVudERpZFVwZGF0ZShwcmV2UHJvcHM6IG1peGVkLCBwcmV2U3RhdGU6IG1peGVkKSB7XG4gICAgaWYgKHByZXZTdGF0ZS5zZWxlY3RlZEluZGV4ICE9PSB0aGlzLnN0YXRlLnNlbGVjdGVkSW5kZXgpIHtcbiAgICAgIHRoaXMuX3VwZGF0ZVNjcm9sbFBvc2l0aW9uKCk7XG4gICAgfVxuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50KCkge1xuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMuZGlzcG9zZSgpO1xuICB9LFxuXG4gIF9jb25maXJtKCkge1xuICAgIHRoaXMuX2l0ZW1zW3RoaXMuc3RhdGUuc2VsZWN0ZWRJbmRleF0uY2FsbGJhY2soKTtcbiAgICB0aGlzLl9jbG9zZSgpO1xuICB9LFxuXG4gIF9jbG9zZSgpIHtcbiAgICB0aGlzLnByb3BzLnN1Z2dlc3Rpb25MaXN0LmhpZGUoKTtcbiAgfSxcblxuICBfc2V0U2VsZWN0ZWRJbmRleChpbmRleDogbnVtYmVyKSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBzZWxlY3RlZEluZGV4OiBpbmRleCxcbiAgICB9KTtcbiAgfSxcblxuICBfbW92ZVNlbGVjdGlvbkRvd24oZXZlbnQpIHtcbiAgICBpZiAodGhpcy5zdGF0ZS5zZWxlY3RlZEluZGV4IDwgdGhpcy5faXRlbXMubGVuZ3RoIC0gMSkge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7c2VsZWN0ZWRJbmRleDogdGhpcy5zdGF0ZS5zZWxlY3RlZEluZGV4ICsgMX0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9tb3ZlU2VsZWN0aW9uVG9Ub3AoKTtcbiAgICB9XG4gICAgaWYgKGV2ZW50KSB7XG4gICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICB9XG4gIH0sXG5cbiAgX21vdmVTZWxlY3Rpb25VcChldmVudCkge1xuICAgIGlmICh0aGlzLnN0YXRlLnNlbGVjdGVkSW5kZXggPiAwKSB7XG4gICAgICB0aGlzLnNldFN0YXRlKHtzZWxlY3RlZEluZGV4OiB0aGlzLnN0YXRlLnNlbGVjdGVkSW5kZXggLSAxfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX21vdmVTZWxlY3Rpb25Ub0JvdHRvbSgpO1xuICAgIH1cbiAgICBpZiAoZXZlbnQpIHtcbiAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgIH1cbiAgfSxcblxuICBfbW92ZVNlbGVjdGlvblRvQm90dG9tKGV2ZW50KSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7c2VsZWN0ZWRJbmRleDogTWF0aC5tYXgodGhpcy5faXRlbXMubGVuZ3RoIC0gMSwgMCl9KTtcbiAgICBpZiAoZXZlbnQpIHtcbiAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgIH1cbiAgfSxcblxuICBfbW92ZVNlbGVjdGlvblRvVG9wKGV2ZW50KSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7c2VsZWN0ZWRJbmRleDogMH0pO1xuICAgIGlmIChldmVudCkge1xuICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgfVxuICB9LFxuXG4gIF91cGRhdGVTY3JvbGxQb3NpdGlvbigpIHtcbiAgICB2YXIgbGlzdE5vZGUgPSBSZWFjdC5maW5kRE9NTm9kZSh0aGlzLnJlZnNbJ3NlbGVjdGlvbkxpc3QnXSk7XG4gICAgdmFyIHNlbGVjdGVkTm9kZSA9IGxpc3ROb2RlLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ3NlbGVjdGVkJylbMF07XG4gICAgc2VsZWN0ZWROb2RlLnNjcm9sbEludG9WaWV3SWZOZWVkZWQoZmFsc2UpO1xuICB9LFxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU3VnZ2VzdGlvbkxpc3RFbGVtZW50ID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KCdoeXBlcmNsaWNrLXN1Z2dlc3Rpb24tbGlzdCcsIHtwcm90b3R5cGU6IFN1Z2dlc3Rpb25MaXN0RWxlbWVudC5wcm90b3R5cGV9KTtcbiJdfQ==
