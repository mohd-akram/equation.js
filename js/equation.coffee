root = exports ? this

class Equation
  @shortcuts:
    '[': '(', ']': ')', "'": '*', ';': '+', '`': "'", 'up': '^(', 'down': '_'

  @symbolregex:
    '===': '≡', '~~': '≈', '!=': '≠', '=/=': '≠'
    '>=': '≥', '!<': '≮', '!>': '≯'
    '<-': '←', '->': '→', '<==': '⇐', '==>': '⇒'
    '\\+/-': '±', '\\*': '×'
    '\\^\\^': '\u0302'

  @symbol2regex: '<=': '≤'

  @letterregex:
    'Alpha': 'Α', 'alpha': 'α', 'Beta': 'Β', 'beta': 'β'
    'Gamma': 'Γ', 'gamma': 'γ', 'Delta': 'Δ', 'delta': 'δ'
    'Epsilon': 'Ε', 'epsilon': 'ε', 'Zeta': 'Ζ', 'zeta': 'ζ', 'Eta': 'Η'
    'Theta': 'Θ', 'theta': 'θ', 'Iota': 'Ι', 'iota': 'ι'
    'Kappa': 'Κ', 'kappa': 'κ', 'Lambda': 'Λ', 'lambda': 'λ'
    'Mu': 'Μ', 'mu': 'μ', 'Nu': 'Ν', 'nu': 'ν', 'Xi': 'Ξ', 'xi': 'ξ'
    'Omicron': 'Ο', 'omicron': 'ο', 'Pi': 'Π', 'pi': 'π'
    'Rho': 'Ρ', 'rho': 'ρ', 'Sigma': '∑', 'sigma': 'σ', 'Tau': 'Τ', 'tau': 'τ'
    'Upsilon': 'Υ', 'upsilon': 'υ', 'Phi': 'Φ', 'phi': 'φ'
    'Chi': 'Χ', 'chi': 'χ', 'Psi': 'Ψ', 'Omega': 'Ω', 'omega': 'ω', 'inf': '∞'

  @letter2regex: 'eta': 'η', 'psi': 'ψ', 'del': '∇'

  @opregex: 'lim': '\\lim', 'sqrt': '√', 'int': '∫', 'sum': '∑'

  @specialops: ['^', '_', '/', '√', '∫', '∑']

  @functions: ['exp', 'log', 'ln', 'sinc']

  @trigfunctions: ['sin', 'cos', 'tan', 'csc', 'sec', 'cot']

  do =>
    for func in Equation.trigfunctions
      @functions.push func
      @functions.push "a#{func}"
      @functions.push "#{func}h"
      @functions.push "a#{func}h"

  @funcops: Object.keys(Equation.opregex).concat(@functions)

  @filters: [
    '\\$', '\\{', '\\}'
    'bo', 'it', 'bi', 'sc', 'fr', 'ov'
    'table', 'text', 'html'
    ',', ':', ';'
  ]

  constructor: (@inputBox, @equationBox, @resizeText=false, @callback=null) ->
    @fontSize = parseFloat @equationBox.style.fontSize
    @message = @equationBox.innerHTML

    # Initialize key buffer and timeout. Used for exponent/power shortcut.
    @keys = []
    @powerTimeout = setTimeout((->), 0)

    @enable()

  findAndReplace: (string, object) ->
    for i, j of object
      regex = new RegExp(i, 'g')
      string = string.replace(regex, j)
    return string

  findAllIndexes: (source, find) ->
    result = []
    for i in [0...source.length - 1]
      if source[i...i + find.length] is find
        result.push(i)

    return result

  findBracket: (string, startPos, opening=false) ->
    count = 0
    if opening
      range = [startPos..0]
    else
      range = [startPos...string.length]

    for i in range
      if string[i] is '('
        count += 1
      if string[i] is ')'
        count -= 1

      if count is 0
        return i

  parseMatrices: (string) ->
    s = string
    for c, idx in s by -1
      if s[idx...idx + 2] is '(('
        bracketEnd = @findBracket(s, idx)
        innerBracketStart = @findBracket(s, bracketEnd - 1, true)
        if s[innerBracketStart - 1] is ',' or innerBracketStart is idx + 1
          rows = []
          rowStart = idx + 1
          while true
            rowEnd = @findBracket(s, rowStart)
            rows.push(s[rowStart + 1...rowEnd])
            if s[rowEnd + 1] is ','
              rowStart = rowEnd + 2
            else
              break
          table = "(\\table #{rows.join ';'})"
          s = s[...idx] + table + s[bracketEnd + 1...]
    return s

  parseOverbars: (string) ->
    s = string
    for c, idx in s by -1
      if s[idx...idx + 2] is '^_' and idx > 0
        # Remove the overbar operator
        s = s[...idx] + s[idx + 2...]

        if s[idx - 1] is ')'
          bracketEnd = idx - 1
          bracketStart = @findBracket(s, bracketEnd, true)
          if not bracketStart?
            continue
        else
          bracketEnd = idx + 1
          bracketStart = idx - 1

          # Place start bracket appropriately if number precedes operator
          bracketStart -= 1 while (bracketStart - 1 >= 0 and
                                   not isNaN(Number s[bracketStart - 1...idx]))

          s = "#{s[...bracketStart]}(#{
                 s[bracketStart...bracketEnd - 1]})#{
                 s[bracketEnd - 1...]}"

        s = @changeBrackets(s, bracketStart, bracketEnd, '\\ov')

    return s

  parseFunction: (string, func) ->
    indexes = @findAllIndexes(string, func)
    for i in indexes.reverse()
      # Workaround for asin, asinh, etc.
      if string[i - 1] is 'a' and func[...3] in Equation.trigfunctions
        continue

      startPos = i + func.length
      if string[startPos] is '('
        endPos = @findBracket(string, startPos)
        # Wrap function
        if endPos
          string = "#{@removeSlashes string[...i]}{\\#{
            @removeSlashes string[i..endPos]}}#{string[endPos + 1...]}"
        else
          string = "#{@removeSlashes string[...i]}{\\#{
            @removeSlashes string[i...]}"

    return string

  parseOperator: (string, op) ->
    indexes = @findAllIndexes(string, op)
    for i in indexes.reverse()
      startPos = i + op.length
      if string[startPos] is '('
        endPos = @findBracket(string, startPos)
        if endPos
          hasPower = string[endPos + 1] is '^'
          # Limit underscript adjustment
          if op is 'lim'
            string = @changeBrackets(string, startPos, endPos, '↙')

          # Functions with overscript and underscript
          else if op in ['∫', '∑']
            args = string[startPos + 1...endPos]
            argsList = args.split ','

            if argsList.length is 2
              [under, over] =  argsList
              string = @changeBrackets(string, startPos, endPos,
                                     '↙', "#{@removeSlashes under}}↖{#{over}")

          # Change parentheses except for binary operators raised to a power
          else if not (op in ['/', '^'] and hasPower)
            string = @changeBrackets(string, startPos, endPos)
            # Wrap square root if followed by a power
            if op is '√' and hasPower
              string = "#{@removeSlashes string[...i]}{#{
                @removeSlashes string[i..endPos]}}#{string[endPos + 1...]}"

    return string

  removeSlashes: (string) -> string.replace(/[\s`\\]+$/, '')

  changeBrackets: (string, startPos, endPos, prefix='', middle='') ->
    if not middle
      middle = string[startPos + 1...endPos]

    prev = @removeSlashes "#{string[...startPos]}#{prefix}"
    middle = @removeSlashes middle

    return "#{prev}{#{middle}}#{string[endPos + 1...]}"

  insertAtCursor: (field, value, del=0) ->
    # If IE
    if document.selection
      field.focus()
      sel = document.selection.createRange()
      if del
        sel.moveStart('character', -del)
      sel.text = value
      field.focus()

    else if (field.selectionStart or field.selectionStart is 0)
      startPos = field.selectionStart - del
      endPos = field.selectionEnd
      scrollTop = field.scrollTop

      field.value = "#{field.value[...startPos]}#{value}#{
        field.value[endPos...field.value.length]}"

      field.focus()
      field.selectionStart = startPos + value.length
      field.selectionEnd = startPos + value.length
      field.scrollTop = scrollTop

    else
      field.value += value
      field.focus()

    @updateMath()

  updateBox: ->
    if @keys
      length = @keys.length
      startIdx = 0
      if length > 1
        char = @keys[length - 1]
        for i in [length - 1..0] by -1
          if @keys[i] isnt char
            startIdx = i + 1
            break

        power = length - startIdx
        if power > 1
          @insertAtCursor(@inputBox, "#{char}^#{power}", power)

    @keys = []

  updateMath: ->
    # Get value and remove trailing backslashes
    value = @removeSlashes @inputBox.value

    # Remove macros and special characters
    for f in Equation.filters
      regex = new RegExp("[\\s`\\\\]*#{f}", 'g')
      value = value.replace(regex, f)

    # Display symbols, Greek letters and functions properly
    value = @findAndReplace(value, Equation.symbolregex)
    value = @findAndReplace(value, Equation.symbol2regex)
    value = @findAndReplace(value, Equation.letterregex)
    value = @findAndReplace(value, Equation.letter2regex)
    value = @findAndReplace(value, Equation.opregex)

    # Allow d/dx without parentheses
    regex = new RegExp('/(d|∂)(x|y|z|t)', 'g')
    value = value.replace(regex, '/{$1$2}')

    # Parse functions
    for func in Equation.functions
      value = @parseFunction(value, func)

    value = @parseOperator(value, 'lim')

    # Remove whitespace except after escaped tokens
    tokens = value.split /\s/
    for token, i in tokens
      tokens[i] = "#{token} " if token[0] is '\\'
    value = tokens.join ''

    if value
      # Parse special operators
      for op in Equation.specialops
        value = @parseOperator(value, op)

      # Remove parentheses before division sign
      indexes = @findAllIndexes(value, '/')
      for j in indexes
        if value[j - 1] is ')'
          endPos = j - 1
          startPos = @findBracket(value, endPos, true)
          if startPos?
            value = @changeBrackets(value, startPos, endPos)

      value = @parseOverbars(value)
      value = @parseMatrices(value)

      # Escape string
      value = value.replace(/&/g, '&amp;')
                   .replace(/>/g, '&gt;')
                   .replace(/</g, '&lt;')
                   .replace(/"/g, '&quot;')

      if @resizeText
        # Resize to fit
        if value.length > 160
          size = @fontSize - 1.2

        else if value.length > 80
          size = @fontSize - 0.8

        else if value.length > 40
          size = @fontSize - 0.4

        else
          size = @fontSize

        @equationBox.style.fontSize = "#{size}em"

      @equationBox.innerHTML = "$$#{value}$$"
      M.parseMath @equationBox

    else
      @equationBox.innerHTML = @message
      @equationBox.style.fontSize = "#{@fontSize}em"

    @callback(@inputBox.value) if @callback

  keyDownHandler: (e) =>
    switch e.keyCode
      when 38 then key = 'up'
      when 40 then key = 'down'

    if key?
      e.preventDefault()
      e.stopPropagation()
      @insertAtCursor(@inputBox, Equation.shortcuts[key])

    # Update the equation box immediately instead of waiting for keyup
    setTimeout((=> @updateMath()), 0)

  keyPressHandler: (e) =>
    key = String.fromCharCode e.which

    if /[A-Za-z]/.test(key) and not (e.altKey or e.ctrlKey or e.metaKey)
      clearTimeout(@powerTimeout)
      @powerTimeout = setTimeout((=> @updateBox()), 300)
      @keys.push key

    else if key of Equation.shortcuts or key is '}'
      e.preventDefault()
      e.stopPropagation()

      # Close all brackets
      if key is '}'
        startPos = @inputBox.selectionStart
        value = @inputBox.value[...startPos]

        bracketsNo = 0
        for i in value
          if i is '('
            bracketsNo += 1
          if i is ')'
            bracketsNo -= 1

        if bracketsNo > 0
          @insertAtCursor(@inputBox, new Array(bracketsNo + 1).join(')'))

      else
        @insertAtCursor(@inputBox, Equation.shortcuts[key])

  keyUpHandler: (e) =>
    # Add bracket after functions
    if 65 <= e.keyCode <= 90 and @needBracket()
      @insertAtCursor(@inputBox, '(')

  searchHandler: =>
    if not @inputBox.value
      @equationBox.innerHTML = @message

  enableShortcuts: ->
    @inputBox.addEventListener('keydown', @keyDownHandler, false)
    @inputBox.addEventListener('keypress', @keyPressHandler, false)
    @inputBox.addEventListener('keyup', @keyUpHandler, false)

  disableShortcuts: ->
    @inputBox.removeEventListener('keydown', @keyDownHandler, false)
    @inputBox.removeEventListener('keypress', @keyPressHandler, false)
    @inputBox.removeEventListener('keyup', @keyUpHandler, false)

  enable: ->
    @enableShortcuts()
    @inputBox.addEventListener('search', @searchHandler, false)
    @updateMath()

  disable: ->
    @disableShortcuts()
    @inputBox.removeEventListener('search', @searchHandler, false)
    @equationBox.innerHTML = @message

  needBracket: ->
    startPos = @inputBox.selectionStart
    for f in Equation.funcops
      string = @inputBox.value[startPos - (f.length)...startPos]
      if string is f
        return true

root.Equation = Equation