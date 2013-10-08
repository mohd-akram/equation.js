// Generated by CoffeeScript 1.6.3
(function() {
  var Equation, root,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  root = typeof exports !== "undefined" && exports !== null ? exports : this;

  Equation = (function() {
    var _this = this;

    Equation.shortcuts = {
      '[': '(',
      ']': ')',
      "'": '*',
      ';': '+',
      '`': "'",
      'up': '^(',
      'down': '_'
    };

    Equation.lettersregex = {
      'Alpha': 'Α',
      'alpha': 'α',
      'Beta': 'Β',
      'beta': 'β',
      'Gamma': 'Γ',
      'gamma': 'γ',
      'Delta': 'Δ',
      'delta': 'δ',
      'Epsilon': 'Ε',
      'epsilon': 'ε',
      'Zeta': 'Ζ',
      'zeta': 'ζ',
      'Eta': 'Η',
      'Theta': 'Θ',
      'theta': 'θ',
      'Iota': 'Ι',
      'iota': 'ι',
      'Kappa': 'Κ',
      'kappa': 'κ',
      'Lambda': 'Λ',
      'lambda': 'λ',
      'Mu': 'Μ',
      'mu': 'μ',
      'Nu': 'Ν',
      'nu': 'ν',
      'Xi': 'Ξ',
      'xi': 'ξ',
      'Omicron': 'Ο',
      'omicron': 'ο',
      'Pi': 'Π',
      'pi': 'π',
      'Rho': 'Ρ',
      'rho': 'ρ',
      'Sigma': '∑',
      'sigma': 'σ',
      'Tau': 'Τ',
      'tau': 'τ',
      'Upsilon': 'Υ',
      'upsilon': 'υ',
      'Phi': 'Φ',
      'phi': 'φ',
      'Chi': 'Χ',
      'chi': 'χ',
      'Psi': 'Ψ',
      'Omega': 'Ω',
      'omega': 'ω',
      'inf': '∞'
    };

    Equation.letters2regex = {
      'eta': 'η',
      'psi': 'ψ',
      'del': '∇'
    };

    Equation.funcregex = {
      'exp': '\\exp',
      'log': '\\log',
      'lim': '\\lim',
      'sqrt': '√',
      'int': '∫',
      'sum': '∑'
    };

    Equation.trigfunctions = ['sin', 'cos', 'tan'];

    Equation.functions = Object.keys(Equation.funcregex).concat(Equation.trigfunctions);

    Equation.miscregex = {
      '===': '≡',
      '<-': '←',
      '->': '→',
      '<==': '⇐',
      '==>': '⇒',
      '<=': '≤',
      '>=': '≥',
      '!=': '≠',
      '!<': '≮',
      '!>': '≯',
      '\\+/-': '±',
      '\\*': '×'
    };

    Equation.deltavars = ['x', 'y', 't'];

    Equation.filters = ['\\$', '\\{', '\\}', '\\\\bo', '\\\\it', '\\\\bi', '\\\\sc', '\\\\fr', '\\\\ov', '\\\\table', '\\\\text', '\\\\html'];

    Equation.trigregex = {};

    (function() {
      var i, _i, _len, _ref, _results;
      _ref = Equation.trigfunctions;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        i = _ref[_i];
        _results.push(Equation.trigregex["(arc)?" + i + "(h)?"] = "\\$1" + i + "$2");
      }
      return _results;
    })();

    function Equation(inputBox, equationBox, resizeText, callback) {
      this.inputBox = inputBox;
      this.equationBox = equationBox;
      this.resizeText = resizeText != null ? resizeText : false;
      this.callback = callback != null ? callback : null;
      this.searchHandler = __bind(this.searchHandler, this);
      this.keyUpHandler = __bind(this.keyUpHandler, this);
      this.keyPressHandler = __bind(this.keyPressHandler, this);
      this.keyDownHandler = __bind(this.keyDownHandler, this);
      this.fontSize = parseFloat(this.equationBox.style.fontSize);
      this.message = this.equationBox.innerHTML;
      this.keys = [];
      this.powerTimeout = setTimeout((function() {}), 0);
      this.enable();
    }

    Equation.prototype.findAndReplace = function(string, object) {
      var i, j, regex;
      for (i in object) {
        j = object[i];
        regex = new RegExp(i, "g");
        string = string.replace(regex, j);
      }
      return string;
    };

    Equation.prototype.findAllIndexes = function(source, find) {
      var i, result, _i, _ref;
      result = [];
      for (i = _i = 0, _ref = source.length - 1; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        if (source.slice(i, i + find.length) === find) {
          result.push(i);
        }
      }
      return result;
    };

    Equation.prototype.findBracket = function(string, startPos, opening) {
      var count, i, range, _i, _j, _k, _len, _ref, _results, _results1;
      if (opening == null) {
        opening = false;
      }
      count = 0;
      if (opening) {
        range = (function() {
          _results = [];
          for (var _i = startPos; startPos <= -1 ? _i < -1 : _i > -1; startPos <= -1 ? _i++ : _i--){ _results.push(_i); }
          return _results;
        }).apply(this);
      } else {
        range = (function() {
          _results1 = [];
          for (var _j = startPos, _ref = string.length; startPos <= _ref ? _j < _ref : _j > _ref; startPos <= _ref ? _j++ : _j--){ _results1.push(_j); }
          return _results1;
        }).apply(this);
      }
      for (_k = 0, _len = range.length; _k < _len; _k++) {
        i = range[_k];
        if (string[i] === '(') {
          count += 1;
        }
        if (string[i] === ')') {
          count -= 1;
        }
        if (count === 0) {
          return i;
        }
      }
    };

    Equation.prototype.parseMatrices = function(string) {
      var bracketEnd, c, idx, innerBracketStart, rowEnd, rowStart, rows, s, table, _i;
      s = string;
      for (idx = _i = s.length - 1; _i >= 0; idx = _i += -1) {
        c = s[idx];
        if (s.slice(idx, idx + 2) === '((') {
          bracketEnd = this.findBracket(s, idx);
          innerBracketStart = this.findBracket(s, bracketEnd - 1, true);
          if (s[innerBracketStart - 1] === ',' || innerBracketStart === idx + 1) {
            rows = [];
            rowStart = idx + 1;
            while (true) {
              rowEnd = this.findBracket(s, rowStart);
              rows.push(s.slice(rowStart + 1, rowEnd));
              if (s[rowEnd + 1] === ',') {
                rowStart = rowEnd + 2;
              } else {
                break;
              }
            }
            table = "(\\table " + (rows.join(';')) + ")";
            s = s.slice(0, idx) + table + s.slice(bracketEnd + 1);
          }
        }
      }
      return s;
    };

    Equation.prototype.changeBrackets = function(string, startPos, endPos, prefix, middle) {
      if (prefix == null) {
        prefix = '';
      }
      if (middle == null) {
        middle = '';
      }
      if (!middle) {
        middle = string.slice(startPos + 1, endPos);
      }
      string = "" + string.slice(0, startPos) + prefix + "{" + middle + "}" + string.slice(endPos + 1);
      return string;
    };

    Equation.prototype.insertAtCursor = function(field, value, del) {
      var endPos, scrollTop, sel, startPos;
      if (del == null) {
        del = 0;
      }
      if (document.selection) {
        field.focus();
        sel = document.selection.createRange();
        if (del) {
          sel.moveStart('character', -del);
        }
        sel.text = value;
        field.focus();
      } else if (field.selectionStart || field.selectionStart === 0) {
        startPos = field.selectionStart - del;
        endPos = field.selectionEnd;
        scrollTop = field.scrollTop;
        field.value = "" + field.value.slice(0, startPos) + value + field.value.slice(endPos, field.value.length);
        field.focus();
        field.selectionStart = startPos + value.length;
        field.selectionEnd = startPos + value.length;
        field.scrollTop = scrollTop;
      } else {
        field.value += value;
        field.focus();
      }
      return this.updateMath();
    };

    Equation.prototype.updateBox = function() {
      var char, i, length, power, startIdx, _i, _ref;
      if (this.keys) {
        length = this.keys.length;
        startIdx = 0;
        if (length > 1) {
          char = this.keys[length - 1];
          for (i = _i = _ref = length - 1; _i > -1; i = _i += -1) {
            if (this.keys[i] !== char) {
              startIdx = i + 1;
              break;
            }
          }
          power = length - startIdx;
          if (power > 1) {
            this.insertAtCursor(this.inputBox, "" + char + "^" + power, power);
          }
        }
      }
      return this.keys = [];
    };

    Equation.prototype.updateMath = function() {
      var args, argsList, d, endPos, f, func, hasPower, i, indexes, j, over, regex, size, startPos, under, v, value, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _m, _n, _ref, _ref1, _ref2, _ref3, _ref4;
      value = this.inputBox.value;
      _ref = Equation.deltavars;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        v = _ref[_i];
        _ref1 = ['d', 'delta'];
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          d = _ref1[_j];
          value = value.replace("/" + d + v, "/(" + d + v + ")");
        }
      }
      _ref2 = Equation.filters;
      for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
        f = _ref2[_k];
        regex = new RegExp("\\\\*" + f, 'g');
        value = value.replace(regex, "" + f);
      }
      value = value.replace(/\s/g, '').replace(/\\+$/, '');
      value = this.parseMatrices(value);
      if (value) {
        _ref3 = ['^', '_', '/', 'sqrt', 'lim', 'int', 'sum'];
        for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
          func = _ref3[_l];
          indexes = this.findAllIndexes(value, func);
          _ref4 = indexes.reverse();
          for (_m = 0, _len4 = _ref4.length; _m < _len4; _m++) {
            i = _ref4[_m];
            startPos = i + func.length;
            if (value[startPos] === '(') {
              endPos = this.findBracket(value, startPos);
              if (endPos) {
                hasPower = value[endPos + 1] === '^';
                if (func === 'lim') {
                  value = this.changeBrackets(value, startPos, endPos, '↙');
                } else if (func === 'int' || func === 'sum') {
                  args = value.slice(startPos + 1, endPos);
                  argsList = args.split(',');
                  if (argsList.length === 2) {
                    under = argsList[0], over = argsList[1];
                    value = this.changeBrackets(value, startPos, endPos, '↙', "" + under + "}↖{" + over);
                  }
                } else if (!(func === '/' && hasPower)) {
                  value = this.changeBrackets(value, startPos, endPos);
                  if (func === 'sqrt' && hasPower) {
                    value = "" + value.slice(0, i) + "{" + value.slice(i, endPos) + "}" + value.slice(endPos);
                  }
                }
              }
            }
          }
        }
        indexes = this.findAllIndexes(value, '/');
        for (_n = 0, _len5 = indexes.length; _n < _len5; _n++) {
          j = indexes[_n];
          if (value[j - 1] === ')') {
            endPos = j - 1;
            startPos = this.findBracket(value, endPos, true);
            if (startPos != null) {
              value = this.changeBrackets(value, startPos, endPos);
            }
          }
        }
        value = this.findAndReplace(value, Equation.funcregex);
        value = this.findAndReplace(value, Equation.lettersregex);
        value = this.findAndReplace(value, Equation.letters2regex);
        value = this.findAndReplace(value, Equation.miscregex);
        value = this.findAndReplace(value, Equation.trigregex);
        value = value.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
        if (this.resizeText) {
          if (value.length > 160) {
            size = this.fontSize - 1.2;
          } else if (value.length > 80) {
            size = this.fontSize - 0.8;
          } else if (value.length > 40) {
            size = this.fontSize - 0.4;
          } else {
            size = this.fontSize;
          }
          this.equationBox.style.fontSize = "" + size + "em";
        }
        this.equationBox.innerHTML = "$$" + value + "$$";
        M.parseMath(this.equationBox);
      } else {
        this.equationBox.innerHTML = this.message;
        this.equationBox.style.fontSize = "" + this.fontSize + "em";
      }
      if (this.callback) {
        return this.callback(this.inputBox.value);
      }
    };

    Equation.prototype.keyDownHandler = function(e) {
      var key,
        _this = this;
      switch (e.keyCode) {
        case 38:
          key = 'up';
          break;
        case 40:
          key = 'down';
      }
      if (key != null) {
        e.preventDefault();
        e.stopPropagation();
        this.insertAtCursor(this.inputBox, Equation.shortcuts[key]);
      }
      return setTimeout((function() {
        return _this.updateMath();
      }), 0);
    };

    Equation.prototype.keyPressHandler = function(e) {
      var bracketsNo, i, key, startPos, value, _i, _len,
        _this = this;
      key = String.fromCharCode(e.which);
      if (/[A-Za-z]/.test(key) && !(e.altKey || e.ctrlKey || e.metaKey)) {
        clearTimeout(this.powerTimeout);
        this.powerTimeout = setTimeout((function() {
          return _this.updateBox();
        }), 300);
        return this.keys.push(key);
      } else if (key in Equation.shortcuts || key === '}') {
        e.preventDefault();
        e.stopPropagation();
        if (key === '}') {
          startPos = this.inputBox.selectionStart;
          value = this.inputBox.value.slice(0, startPos);
          bracketsNo = 0;
          for (_i = 0, _len = value.length; _i < _len; _i++) {
            i = value[_i];
            if (i === '(') {
              bracketsNo += 1;
            }
            if (i === ')') {
              bracketsNo -= 1;
            }
          }
          if (bracketsNo > 0) {
            return this.insertAtCursor(this.inputBox, new Array(bracketsNo + 1).join(')'));
          }
        } else {
          return this.insertAtCursor(this.inputBox, Equation.shortcuts[key]);
        }
      }
    };

    Equation.prototype.keyUpHandler = function(e) {
      var _ref;
      if ((65 <= (_ref = e.keyCode) && _ref <= 90) && this.needBracket()) {
        return this.insertAtCursor(this.inputBox, '(');
      }
    };

    Equation.prototype.searchHandler = function() {
      if (!this.inputBox.value) {
        return this.equationBox.innerHTML = this.message;
      }
    };

    Equation.prototype.enableShortcuts = function() {
      this.inputBox.addEventListener('keydown', this.keyDownHandler, false);
      this.inputBox.addEventListener('keypress', this.keyPressHandler, false);
      return this.inputBox.addEventListener('keyup', this.keyUpHandler, false);
    };

    Equation.prototype.disableShortcuts = function() {
      this.inputBox.removeEventListener('keydown', this.keyDownHandler, false);
      this.inputBox.removeEventListener('keypress', this.keyPressHandler, false);
      return this.inputBox.removeEventListener('keyup', this.keyUpHandler, false);
    };

    Equation.prototype.enable = function() {
      this.enableShortcuts();
      this.inputBox.addEventListener('search', this.searchHandler, false);
      return this.updateMath();
    };

    Equation.prototype.disable = function() {
      this.disableShortcuts();
      this.inputBox.removeEventListener('search', this.searchHandler, false);
      return this.equationBox.innerHTML = this.message;
    };

    Equation.prototype.needBracket = function() {
      var f, startPos, string, _i, _j, _len, _len1, _ref, _ref1;
      startPos = this.inputBox.selectionStart;
      _ref = Equation.trigfunctions;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        f = _ref[_i];
        string = this.inputBox.value.slice(startPos - (f.length + 1), startPos);
        if (string === ("" + f + "h")) {
          return true;
        }
      }
      _ref1 = Equation.functions;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        f = _ref1[_j];
        string = this.inputBox.value.slice(startPos - f.length, startPos);
        if (string === f) {
          return true;
        }
      }
    };

    return Equation;

  }).call(this);

  root.Equation = Equation;

}).call(this);

/*
//@ sourceMappingURL=equations.map
*/
