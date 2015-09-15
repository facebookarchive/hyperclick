
/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var hyperclick = null;

var _require = require('atom');

var Disposable = _require.Disposable;

module.exports = {
  activate: function activate() {
    var Hyperclick = require('./Hyperclick');
    hyperclick = new Hyperclick();
  },

  deactivate: function deactivate() {
    if (hyperclick) {
      hyperclick.dispose();
      hyperclick = null;
    }
  },

  consumeProvider: function consumeProvider(provider) {
    if (hyperclick) {
      hyperclick.consumeProvider(provider);
      return new Disposable(function () {
        if (hyperclick) {
          hyperclick.removeProvider(provider);
        }
      });
    }
  },

  /**
   * A TextEditor whose creation is announced via atom.workspace.observeTextEditors() will be
   * observed by default by hyperclick. However, if a TextEditor is created via some other means,
   * (such as a building block for a piece of UI), then it must be observed explicitly.
   */
  observeTextEditor: function observeTextEditor() {
    return function (textEditor) {
      if (hyperclick) {
        hyperclick.observeTextEditor(textEditor);
      }
    };
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy93MS9fMm1jNm0wNTBxbjIzMm5wc2Y5ejNoZnNoNThfamgvVC90bXBpMzV6akdwdWJsaXNoX3BhY2thZ2VzL2FwbS9oeXBlcmNsaWNrL2xpYi9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7Ozs7Ozs7OztBQVdaLElBQUksVUFBdUIsR0FBRyxJQUFJLENBQUM7O2VBQ2hCLE9BQU8sQ0FBQyxNQUFNLENBQUM7O0lBQTdCLFVBQVUsWUFBVixVQUFVOztBQUVmLE1BQU0sQ0FBQyxPQUFPLEdBQUc7QUFDZixVQUFRLEVBQUEsb0JBQUc7QUFDVCxRQUFJLFVBQVUsR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7QUFDekMsY0FBVSxHQUFHLElBQUksVUFBVSxFQUFFLENBQUM7R0FDL0I7O0FBRUQsWUFBVSxFQUFBLHNCQUFHO0FBQ1gsUUFBSSxVQUFVLEVBQUU7QUFDZCxnQkFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ3JCLGdCQUFVLEdBQUcsSUFBSSxDQUFDO0tBQ25CO0dBQ0Y7O0FBRUQsaUJBQWUsRUFBQSx5QkFBQyxRQUF3RCxFQUFlO0FBQ3JGLFFBQUksVUFBVSxFQUFFO0FBQ2QsZ0JBQVUsQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDckMsYUFBTyxJQUFJLFVBQVUsQ0FBQyxZQUFNO0FBQzFCLFlBQUksVUFBVSxFQUFFO0FBQ2Qsb0JBQVUsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDckM7T0FDRixDQUFDLENBQUM7S0FDSjtHQUNGOzs7Ozs7O0FBT0QsbUJBQWlCLEVBQUEsNkJBQXFDO0FBQ3BELFdBQU8sVUFBQyxVQUFVLEVBQWlCO0FBQ2pDLFVBQUksVUFBVSxFQUFFO0FBQ2Qsa0JBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsQ0FBQztPQUMxQztLQUNGLENBQUM7R0FDSDtDQUNGLENBQUMiLCJmaWxlIjoiL3Zhci9mb2xkZXJzL3cxL18ybWM2bTA1MHFuMjMybnBzZjl6M2hmc2g1OF9qaC9UL3RtcGkzNXpqR3B1Ymxpc2hfcGFja2FnZXMvYXBtL2h5cGVyY2xpY2svbGliL21haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG52YXIgaHlwZXJjbGljazogP0h5cGVyY2xpY2sgPSBudWxsO1xudmFyIHtEaXNwb3NhYmxlfSA9IHJlcXVpcmUoJ2F0b20nKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFjdGl2YXRlKCkge1xuICAgIHZhciBIeXBlcmNsaWNrID0gcmVxdWlyZSgnLi9IeXBlcmNsaWNrJyk7XG4gICAgaHlwZXJjbGljayA9IG5ldyBIeXBlcmNsaWNrKCk7XG4gIH0sXG5cbiAgZGVhY3RpdmF0ZSgpIHtcbiAgICBpZiAoaHlwZXJjbGljaykge1xuICAgICAgaHlwZXJjbGljay5kaXNwb3NlKCk7XG4gICAgICBoeXBlcmNsaWNrID0gbnVsbDtcbiAgICB9XG4gIH0sXG5cbiAgY29uc3VtZVByb3ZpZGVyKHByb3ZpZGVyOiBIeXBlcmNsaWNrUHJvdmlkZXIgfCBBcnJheTxIeXBlcmNsaWNrUHJvdmlkZXI+KTogP0Rpc3Bvc2FibGUge1xuICAgIGlmIChoeXBlcmNsaWNrKSB7XG4gICAgICBoeXBlcmNsaWNrLmNvbnN1bWVQcm92aWRlcihwcm92aWRlcik7XG4gICAgICByZXR1cm4gbmV3IERpc3Bvc2FibGUoKCkgPT4ge1xuICAgICAgICBpZiAoaHlwZXJjbGljaykge1xuICAgICAgICAgIGh5cGVyY2xpY2sucmVtb3ZlUHJvdmlkZXIocHJvdmlkZXIpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIEEgVGV4dEVkaXRvciB3aG9zZSBjcmVhdGlvbiBpcyBhbm5vdW5jZWQgdmlhIGF0b20ud29ya3NwYWNlLm9ic2VydmVUZXh0RWRpdG9ycygpIHdpbGwgYmVcbiAgICogb2JzZXJ2ZWQgYnkgZGVmYXVsdCBieSBoeXBlcmNsaWNrLiBIb3dldmVyLCBpZiBhIFRleHRFZGl0b3IgaXMgY3JlYXRlZCB2aWEgc29tZSBvdGhlciBtZWFucyxcbiAgICogKHN1Y2ggYXMgYSBidWlsZGluZyBibG9jayBmb3IgYSBwaWVjZSBvZiBVSSksIHRoZW4gaXQgbXVzdCBiZSBvYnNlcnZlZCBleHBsaWNpdGx5LlxuICAgKi9cbiAgb2JzZXJ2ZVRleHRFZGl0b3IoKTogKHRleHRFZGl0b3I6IFRleHRFZGl0b3IpID0+IHZvaWQge1xuICAgIHJldHVybiAodGV4dEVkaXRvcjogVGV4dEVkaXRvcikgPT4ge1xuICAgICAgaWYgKGh5cGVyY2xpY2spIHtcbiAgICAgICAgaHlwZXJjbGljay5vYnNlcnZlVGV4dEVkaXRvcih0ZXh0RWRpdG9yKTtcbiAgICAgIH1cbiAgICB9O1xuICB9LFxufTtcbiJdfQ==
