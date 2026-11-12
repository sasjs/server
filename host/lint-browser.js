(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/asyncForEach.js
  var require_asyncForEach = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/asyncForEach.js"(exports) {
      "use strict";
      var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
        function adopt(value) {
          return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
          });
        }
        return new (P || (P = Promise))(function(resolve, reject) {
          function fulfilled(value) {
            try {
              step(generator.next(value));
            } catch (e) {
              reject(e);
            }
          }
          function rejected(value) {
            try {
              step(generator["throw"](value));
            } catch (e) {
              reject(e);
            }
          }
          function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
          }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.asyncForEach = asyncForEach;
      function asyncForEach(array, callback) {
        return __awaiter(this, void 0, void 0, function* () {
          for (let index = 0; index < array.length; index++) {
            yield callback(array[index], index, array);
          }
        });
      }
    }
  });

  // ../../../../../tmp/sasjs-lint-pENlXV/path.js
  var require_path = __commonJS({
    "../../../../../tmp/sasjs-lint-pENlXV/path.js"(exports, module) {
      var SEP = String.fromCharCode(92);
      var clean = (value) => String(value).split(SEP).join("/").replace(/\/+/g, "/");
      var strip = (value) => clean(value).replace(/\/+$/, "");
      var basename = (value) => strip(value).split("/").pop() || "";
      var extname = (value) => {
        const base = basename(value);
        const dot = base.lastIndexOf(".");
        return dot > 0 ? base.slice(dot) : "";
      };
      var dirname = (value) => {
        const parts = clean(value).split("/");
        parts.pop();
        return parts.join("/") || ".";
      };
      var join = (...parts) => clean(parts.filter(Boolean).join("/"));
      module.exports = {
        sep: "/",
        delimiter: ":",
        basename,
        extname,
        dirname,
        join,
        resolve: (...parts) => clean(parts.filter(Boolean).join("/")),
        relative: (from, to) => clean(to).replace(clean(from) + "/", ""),
        isAbsolute: (value) => String(value).startsWith("/"),
        normalize: clean,
        parse: (value) => ({
          root: "",
          dir: dirname(value),
          base: basename(value),
          ext: extname(value),
          name: basename(value).slice(0, basename(value).length - extname(value).length)
        })
      };
    }
  });

  // ../../../../../tmp/sasjs-lint-pENlXV/os.js
  var require_os = __commonJS({
    "../../../../../tmp/sasjs-lint-pENlXV/os.js"(exports, module) {
      module.exports = {
        homedir: () => "/",
        platform: () => "browser",
        tmpdir: () => "/tmp",
        EOL: "\n"
      };
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/types/Diagnostic.js
  var require_Diagnostic = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/types/Diagnostic.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/types/FormatResult.js
  var require_FormatResult = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/types/FormatResult.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/types/LintRule.js
  var require_LintRule = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/types/LintRule.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/types/LintRuleType.js
  var require_LintRuleType = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/types/LintRuleType.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.LintRuleType = void 0;
      var LintRuleType;
      (function(LintRuleType2) {
        LintRuleType2[LintRuleType2["Line"] = 0] = "Line";
        LintRuleType2[LintRuleType2["File"] = 1] = "File";
        LintRuleType2[LintRuleType2["Path"] = 2] = "Path";
      })(LintRuleType || (exports.LintRuleType = LintRuleType = {}));
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/types/Severity.js
  var require_Severity = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/types/Severity.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Severity = void 0;
      var Severity;
      (function(Severity2) {
        Severity2[Severity2["Info"] = 0] = "Info";
        Severity2[Severity2["Warning"] = 1] = "Warning";
        Severity2[Severity2["Error"] = 2] = "Error";
      })(Severity || (exports.Severity = Severity = {}));
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/types/Macro.js
  var require_Macro = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/types/Macro.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/types/index.js
  var require_types = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/types/index.js"(exports) {
      "use strict";
      var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = { enumerable: true, get: function() {
            return m[k];
          } };
        }
        Object.defineProperty(o, k2, desc);
      }) : (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        o[k2] = m[k];
      }));
      var __exportStar = exports && exports.__exportStar || function(m, exports2) {
        for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      __exportStar(require_Diagnostic(), exports);
      __exportStar(require_FormatResult(), exports);
      __exportStar(require_LintConfig(), exports);
      __exportStar(require_LintRule(), exports);
      __exportStar(require_LintRuleType(), exports);
      __exportStar(require_Severity(), exports);
      __exportStar(require_Macro(), exports);
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/types/LineEndings.js
  var require_LineEndings = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/types/LineEndings.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.LineEndings = void 0;
      var LineEndings;
      (function(LineEndings2) {
        LineEndings2["LF"] = "lf";
        LineEndings2["CRLF"] = "crlf";
        LineEndings2["OFF"] = "off";
      })(LineEndings || (exports.LineEndings = LineEndings = {}));
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/splitLines.js
  var require_splitLines = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/splitLines.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.splitLines = void 0;
      var splitLines = (text) => text ? text.split(/\r\n|\n/) : [];
      exports.splitLines = splitLines;
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/getPosition.js
  var require_getPosition = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/getPosition.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.getPosition = void 0;
      var splitLines_1 = require_splitLines();
      var getPosition = (text, index) => {
        if (index <= 0)
          return { lineNumber: 1, columnNumber: 1 };
        const lines = (0, splitLines_1.splitLines)(text.slice(0, index));
        return {
          lineNumber: lines.length,
          columnNumber: lines[lines.length - 1].length + 1
        };
      };
      exports.getPosition = getPosition;
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/getSeverity.js
  var require_getSeverity = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/getSeverity.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.getSeverity = void 0;
      var getSeverity = (config, rule, fallback) => {
        var _a, _b;
        return (_b = (_a = config === null || config === void 0 ? void 0 : config.severityLevel[rule]) !== null && _a !== void 0 ? _a : config === null || config === void 0 ? void 0 : config.defaultSeverity) !== null && _b !== void 0 ? _b : fallback;
      };
      exports.getSeverity = getSeverity;
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/file/hasDoxygenHeader.js
  var require_hasDoxygenHeader = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/file/hasDoxygenHeader.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.hasDoxygenHeader = void 0;
      var types_1 = require_types();
      var LineEndings_1 = require_LineEndings();
      var LintRuleType_1 = require_LintRuleType();
      var Severity_1 = require_Severity();
      var getLintConfig_1 = require_getLintConfig();
      var getPosition_1 = require_getPosition();
      var getSeverity_1 = require_getSeverity();
      var name = "hasDoxygenHeader";
      var description = "Enforce a Doxygen header at the start of each file, in the /** ... **/ form.";
      var message = "File missing Doxygen header";
      var messageForSingleAsterisk = "File not following Doxygen header style, use double asterisks";
      var messageForSingleAsteriskClose = "File not following Doxygen header style, close with double asterisks";
      var messageForCloseNotOnOwnLine = "File not following Doxygen header style, close with the marker on a line of its own";
      var messageForUnclosedHeader = "File not following Doxygen header style, header is never closed";
      var CLOSE = "*/";
      var findHeaderClose = (value, start) => {
        const close = value.indexOf(CLOSE, start + 2);
        if (close === -1)
          return { kind: "none" };
        if (value.slice(start + 2, close).includes("/*"))
          return null;
        if (value[close - 1] !== "*")
          return { kind: "single", index: close };
        const lineStart = value.lastIndexOf("\n", close - 1) + 1;
        const lineEnd = value.indexOf("\n", close);
        const before = value.slice(lineStart, close - 1);
        const after = value.slice(close + 2, lineEnd === -1 ? value.length : lineEnd);
        return before.trim() === "" && after.trim() === "" ? { kind: "own-line", index: close } : { kind: "inline", index: close };
      };
      var diagnose = (value, config) => {
        var _a;
        const severity = (0, getSeverity_1.getSeverity)(config, name, Severity_1.Severity.Warning);
        try {
          const start = value.search(/\S/);
          if (value.trimStart().startsWith("/**")) {
            const close = findHeaderClose(value, start);
            if (close === null || close.kind === "own-line")
              return null;
            if (close.kind === "none") {
              const { lineNumber: lineNumber2, columnNumber: columnNumber2 } = (0, getPosition_1.getPosition)(value, start);
              return {
                message: messageForUnclosedHeader,
                lineNumber: lineNumber2,
                startColumnNumber: columnNumber2,
                endColumnNumber: columnNumber2 + 3,
                severity,
                close: null
              };
            }
            const { lineNumber, columnNumber } = (0, getPosition_1.getPosition)(value, close.index);
            const inline = close.kind === "inline";
            return {
              message: inline ? messageForCloseNotOnOwnLine : messageForSingleAsteriskClose,
              lineNumber,
              startColumnNumber: columnNumber,
              endColumnNumber: columnNumber + (inline ? 2 : 1),
              severity,
              close: close.index
            };
          }
          const hasFileHeaderWithSingleAsterisk = value.trimStart().startsWith("/*");
          if (hasFileHeaderWithSingleAsterisk)
            return {
              message: messageForSingleAsterisk,
              lineNumber: ((_a = value.split("/*")[0].match(/\r\n|\n/g)) !== null && _a !== void 0 ? _a : []).length + 1,
              startColumnNumber: 1,
              endColumnNumber: 1,
              severity,
              close: null
            };
          return {
            message,
            lineNumber: 1,
            startColumnNumber: 1,
            endColumnNumber: 1,
            severity,
            close: null
          };
        } catch (e) {
          return {
            message,
            lineNumber: 1,
            startColumnNumber: 1,
            endColumnNumber: 1,
            severity,
            close: null
          };
        }
      };
      var test = (value, config) => {
        const diagnosis = diagnose(value, config);
        if (!diagnosis)
          return [];
        return [
          {
            message: diagnosis.message,
            lineNumber: diagnosis.lineNumber,
            startColumnNumber: diagnosis.startColumnNumber,
            endColumnNumber: diagnosis.endColumnNumber,
            severity: diagnosis.severity
          }
        ];
      };
      var expandClose = (value, close, start) => {
        const lineEnding = value.includes("\r\n") ? "\r\n" : "\n";
        if (close <= start + 2) {
          return `${value.slice(0, start)}/**${lineEnding}**/${value.slice(close + 2)}`;
        }
        const markerStart = close - 1;
        const head = value.slice(0, markerStart).replace(/[ \t]+$/, "");
        const lineEnd = value.indexOf("\n", close);
        const after = value.slice(close + 2, lineEnd === -1 ? value.length : lineEnd);
        if (after.trim() === "")
          return `${head}${lineEnding}${value.slice(markerStart)}`;
        const rest = value.slice(lineEnd === -1 ? value.length : lineEnd);
        return `${head}${lineEnding}${value.slice(markerStart, close + 2)}${lineEnding}${after.trimStart()}${rest}`;
      };
      var repair = (value, diagnosis, config) => {
        if (diagnosis.message == messageForSingleAsterisk)
          return value.replace("/*", "/**");
        if (diagnosis.message == messageForSingleAsteriskClose)
          return `${value.slice(0, diagnosis.close)}*${value.slice(diagnosis.close)}`;
        if (diagnosis.message == messageForCloseNotOnOwnLine)
          return expandClose(value, diagnosis.close, value.search(/\S/));
        if (diagnosis.message == messageForUnclosedHeader)
          return value;
        const cfg = config || new types_1.LintConfig(getLintConfig_1.DefaultLintConfiguration);
        const lineEndingConfig = (cfg === null || cfg === void 0 ? void 0 : cfg.lineEndings) || LineEndings_1.LineEndings.LF;
        const lineEnding = lineEndingConfig === LineEndings_1.LineEndings.LF ? "\n" : "\r\n";
        return `${cfg === null || cfg === void 0 ? void 0 : cfg.defaultHeader.replace(/{lineEnding}/g, lineEnding)}${lineEnding}${value}`;
      };
      var fix = (value, config) => {
        let repaired = value;
        for (let step = 0; step < 3; step++) {
          const diagnosis = diagnose(repaired, config);
          if (!diagnosis)
            return repaired;
          const next = repair(repaired, diagnosis, config);
          if (next === repaired)
            return repaired;
          repaired = next;
        }
        return repaired;
      };
      exports.hasDoxygenHeader = {
        type: LintRuleType_1.LintRuleType.File,
        name,
        description,
        message,
        test,
        fix
      };
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/escapeRegExp.js
  var require_escapeRegExp = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/escapeRegExp.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.escapeRegExp = void 0;
      var escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      exports.escapeRegExp = escapeRegExp;
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/getColumnNumber.js
  var require_getColumnNumber = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/getColumnNumber.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.getColumnNumber = void 0;
      var escapeRegExp_1 = require_escapeRegExp();
      var getColumnNumber = (line, text, caseInsensitive = false) => {
        const lastLine = line.split("\n").pop();
        const index = caseInsensitive ? lastLine.search(new RegExp((0, escapeRegExp_1.escapeRegExp)(text), "i")) : lastLine.indexOf(text);
        if (index < 0) {
          throw new Error(`String '${text}' was not found in line '${line}'`);
        }
        return index + 1;
      };
      exports.getColumnNumber = getColumnNumber;
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/trimComments.js
  var require_trimComments = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/trimComments.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.trimComments = void 0;
      var trimComments = (statement, commentStarted = false, trimEnd = false, quoteStarted = "") => {
        const text = statement || "";
        let result = "";
        let quote = quoteStarted;
        let inComment = commentStarted;
        for (let index = 0; index < text.length; index++) {
          const character = text[index];
          if (inComment) {
            if (character === "*" && text[index + 1] === "/") {
              inComment = false;
              index++;
            }
            continue;
          }
          if (quote) {
            result += character;
            if (character === quote)
              quote = "";
            continue;
          }
          if (character === "'" || character === '"') {
            quote = character;
            result += character;
            continue;
          }
          if (character === "/" && text[index + 1] === "*") {
            inComment = true;
            index++;
            continue;
          }
          result += character;
        }
        return {
          statement: trimEnd ? result.trimEnd() : result.trim(),
          commentStarted: inComment,
          quoteStarted: quote
        };
      };
      exports.trimComments = trimComments;
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/parseMacros.js
  var require_parseMacros = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/parseMacros.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.parseMacros = void 0;
      var trimComments_1 = require_trimComments();
      var splitLines_1 = require_splitLines();
      var macroStatement = /^%macro\b/i;
      var mendStatement = /^%mend\b/i;
      var declarationName = /^%macro\b\s*([^\s(;/]*)/i;
      var mendName = /^%mend\b\s*([^\s;]*)/i;
      var getName = (statement, pattern) => {
        const match = pattern.exec(statement);
        return match ? match[1].trim() : "";
      };
      var parseMacros = (text, config) => {
        const lines = (0, splitLines_1.splitLines)(text);
        const macros = [];
        let isCommentStarted = false;
        let isQuoteStarted = "";
        let macroStack = [];
        let isReadingMacroDefinition = false;
        let isStatementContinues = true;
        let tempMacroDeclaration = "";
        let tempMacroDeclarationLines = [];
        let tempStartLineNumbers = [];
        lines.forEach((line, lineIndex) => {
          const stateBeforeLine = isCommentStarted;
          const { statement: trimmedLine, commentStarted: stateAfterLine, quoteStarted: quoteAfterLine } = (0, trimComments_1.trimComments)(line, stateBeforeLine, false, isQuoteStarted);
          isCommentStarted = stateAfterLine;
          isQuoteStarted = quoteAfterLine;
          isStatementContinues = !trimmedLine.endsWith(";");
          const statements = trimmedLine.split(";");
          if (isReadingMacroDefinition) {
            statements.forEach((statement, statementIndex) => {
              if (/&[^\s]{1,5}$/.test(statement)) {
                const next = statements[statementIndex];
                const updatedStatement = `${statement};${statements[statementIndex + 1]}`;
                statements.splice(statementIndex, 1, updatedStatement);
                statements.splice(statementIndex + 1, 1);
              }
            });
          }
          statements.forEach((statement, statementIndex) => {
            const trimmedStatement = statement.trim();
            if (isReadingMacroDefinition) {
              tempMacroDeclaration = tempMacroDeclaration + (trimmedStatement ? " " + trimmedStatement : "");
              tempMacroDeclarationLines.push(line);
              tempStartLineNumbers.push(lineIndex + 1);
              if (!Object.is(statements.length - 1, statementIndex)) {
                isReadingMacroDefinition = false;
                const name = getName(tempMacroDeclaration, declarationName);
                macroStack.push({
                  name,
                  startLineNumbers: tempStartLineNumbers,
                  endLineNumber: null,
                  parentMacro: macroStack.length ? macroStack[macroStack.length - 1].name : "",
                  hasMacroNameInMend: false,
                  mismatchedMendMacroName: "",
                  declarationLines: tempMacroDeclarationLines,
                  terminationLine: "",
                  declaration: tempMacroDeclaration,
                  termination: ""
                });
              }
            }
            if (macroStatement.test(trimmedStatement)) {
              const startLineNumber = lineIndex + 1;
              if (isStatementContinues && Object.is(statements.length - 1, statementIndex)) {
                tempMacroDeclaration = trimmedStatement;
                tempMacroDeclarationLines = [line];
                tempStartLineNumbers = [startLineNumber];
                isReadingMacroDefinition = true;
                return;
              }
              const name = getName(trimmedStatement, declarationName);
              macroStack.push({
                name,
                startLineNumbers: [startLineNumber],
                endLineNumber: null,
                parentMacro: macroStack.length ? macroStack[macroStack.length - 1].name : "",
                hasMacroNameInMend: false,
                mismatchedMendMacroName: "",
                declarationLines: [line],
                terminationLine: "",
                declaration: trimmedStatement,
                termination: ""
              });
            } else if (mendStatement.test(trimmedStatement)) {
              if (macroStack.length) {
                const macro = macroStack.pop();
                const mendMacroName = getName(trimmedStatement, mendName);
                macro.endLineNumber = lineIndex + 1;
                macro.hasMacroNameInMend = mendMacroName.toLowerCase() === macro.name.toLowerCase();
                macro.mismatchedMendMacroName = macro.hasMacroNameInMend ? "" : mendMacroName;
                macro.terminationLine = line;
                macro.termination = trimmedStatement;
                macros.push(macro);
              } else {
                macros.push({
                  name: "",
                  startLineNumbers: [],
                  endLineNumber: lineIndex + 1,
                  parentMacro: "",
                  hasMacroNameInMend: false,
                  mismatchedMendMacroName: "",
                  declarationLines: [],
                  terminationLine: line,
                  declaration: "",
                  termination: trimmedStatement
                });
              }
            }
          });
        });
        macros.push(...macroStack);
        return macros;
      };
      exports.parseMacros = parseMacros;
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/file/hasMacroNameInMend.js
  var require_hasMacroNameInMend = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/file/hasMacroNameInMend.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.hasMacroNameInMend = void 0;
      var LintRuleType_1 = require_LintRuleType();
      var Severity_1 = require_Severity();
      var getColumnNumber_1 = require_getColumnNumber();
      var LineEndings_1 = require_LineEndings();
      var parseMacros_1 = require_parseMacros();
      var splitLines_1 = require_splitLines();
      var getSeverity_1 = require_getSeverity();
      var name = "hasMacroNameInMend";
      var description = "Enforces the presence of the macro name in each %mend statement.";
      var message = "%mend statement has missing or incorrect macro name";
      var test = (value, config) => {
        const lines = (0, splitLines_1.splitLines)(value);
        const macros = (0, parseMacros_1.parseMacros)(value, config);
        const severity = (0, getSeverity_1.getSeverity)(config, name, Severity_1.Severity.Warning);
        const diagnostics = [];
        macros.forEach((macro) => {
          if (macro.startLineNumbers.length === 0 && macro.endLineNumber !== null) {
            const endLine = lines[macro.endLineNumber - 1];
            diagnostics.push({
              message: `%mend statement is redundant`,
              lineNumber: macro.endLineNumber,
              startColumnNumber: (0, getColumnNumber_1.getColumnNumber)(endLine, "%mend", true),
              endColumnNumber: (0, getColumnNumber_1.getColumnNumber)(endLine, "%mend", true) + macro.termination.length - 1,
              severity
            });
          } else if (macro.endLineNumber === null && macro.startLineNumbers.length !== 0) {
            diagnostics.push({
              message: `Missing %mend statement for macro - ${macro.name}`,
              lineNumber: macro.startLineNumbers[0],
              startColumnNumber: 1,
              endColumnNumber: 1,
              severity
            });
          } else if (macro.mismatchedMendMacroName) {
            const endLine = lines[macro.endLineNumber - 1];
            diagnostics.push({
              message: `%mend statement has mismatched macro name, it should be '${macro.name}'`,
              lineNumber: macro.endLineNumber,
              startColumnNumber: (0, getColumnNumber_1.getColumnNumber)(endLine, macro.mismatchedMendMacroName),
              endColumnNumber: (0, getColumnNumber_1.getColumnNumber)(endLine, macro.mismatchedMendMacroName) + macro.mismatchedMendMacroName.length - 1,
              severity
            });
          } else if (!macro.hasMacroNameInMend) {
            const endLine = lines[macro.endLineNumber - 1];
            diagnostics.push({
              message: `%mend statement is missing macro name - ${macro.name}`,
              lineNumber: macro.endLineNumber,
              startColumnNumber: (0, getColumnNumber_1.getColumnNumber)(endLine, "%mend", true),
              // The span covers the keyword itself, so it ends on its last character
              // whatever its length - `%mend` is five characters, not seven.
              endColumnNumber: (0, getColumnNumber_1.getColumnNumber)(endLine, "%mend", true) + "%mend".length - 1,
              severity
            });
          }
        });
        return diagnostics;
      };
      var fix = (value, config) => {
        const lineEnding = (config === null || config === void 0 ? void 0 : config.lineEndings) === LineEndings_1.LineEndings.CRLF ? "\r\n" : "\n";
        const lines = (0, splitLines_1.splitLines)(value);
        const macros = (0, parseMacros_1.parseMacros)(value, config);
        macros.forEach((macro) => {
          if (macro.startLineNumbers.length === 0 && macro.endLineNumber !== null) {
            const endLine = lines[macro.endLineNumber - 1];
            const startColumnNumber = (0, getColumnNumber_1.getColumnNumber)(endLine, "%mend", true);
            const endColumnNumber = (0, getColumnNumber_1.getColumnNumber)(endLine, "%mend", true) + macro.termination.length - 1;
            const beforeStatement = endLine.slice(0, startColumnNumber - 1);
            const trailing = endLine.slice(endColumnNumber).match(/^\s*;?/)[0].length;
            const afterStatement = endLine.slice(endColumnNumber + trailing);
            lines[macro.endLineNumber - 1] = beforeStatement + afterStatement;
          } else if (macro.endLineNumber === null && macro.startLineNumbers.length !== 0) {
          } else if (macro.mismatchedMendMacroName) {
            const endLine = lines[macro.endLineNumber - 1];
            const startColumnNumber = (0, getColumnNumber_1.getColumnNumber)(endLine, macro.mismatchedMendMacroName);
            const endColumnNumber = (0, getColumnNumber_1.getColumnNumber)(endLine, macro.mismatchedMendMacroName) + macro.mismatchedMendMacroName.length - 1;
            const beforeMacroName = endLine.slice(0, startColumnNumber - 1);
            const afterMacroName = endLine.slice(endColumnNumber);
            lines[macro.endLineNumber - 1] = beforeMacroName + macro.name + afterMacroName;
          } else if (!macro.hasMacroNameInMend) {
            const endLine = lines[macro.endLineNumber - 1];
            const startColumnNumber = (0, getColumnNumber_1.getColumnNumber)(endLine, "%mend", true);
            const keyword = endLine.slice(startColumnNumber - 1, startColumnNumber - 1 + "%mend".length);
            const endColumnNumber = startColumnNumber + keyword.length - 1;
            const beforeStatement = endLine.slice(0, startColumnNumber - 1);
            const afterStatement = endLine.slice(endColumnNumber);
            lines[macro.endLineNumber - 1] = beforeStatement + `${keyword} ${macro.name}` + afterStatement;
          }
        });
        const formattedText = lines.join(lineEnding);
        return formattedText;
      };
      exports.hasMacroNameInMend = {
        type: LintRuleType_1.LintRuleType.File,
        name,
        description,
        message,
        test,
        fix
      };
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/file/hasMacroParentheses.js
  var require_hasMacroParentheses = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/file/hasMacroParentheses.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.hasMacroParentheses = void 0;
      var LintRuleType_1 = require_LintRuleType();
      var Severity_1 = require_Severity();
      var getColumnNumber_1 = require_getColumnNumber();
      var parseMacros_1 = require_parseMacros();
      var utils_1 = require_utils();
      var getSeverity_1 = require_getSeverity();
      var name = "hasMacroParentheses";
      var description = "Enforces the presence of parentheses in macro definitions.";
      var message = "Macro definition missing parentheses";
      var parameterlessDeclaration = (macroName) => new RegExp(`(%macro\\s+${(0, utils_1.escapeRegExp)(macroName)})((?:\\s*/\\*.*?\\*/)?\\s*;)`, "i");
      var nameLine = (macro) => macro.declarationLines.findIndex((declarationLine) => declarationLine.includes(macro.name));
      var lineStarts = (text) => {
        const starts = [0];
        for (let index = 0; index < text.length; index++) {
          if (text[index] === "\n")
            starts.push(index + 1);
        }
        return starts;
      };
      var test = (value, config) => {
        const diagnostics = [];
        const macros = (0, parseMacros_1.parseMacros)(value, config);
        const severity = (0, getSeverity_1.getSeverity)(config, name, Severity_1.Severity.Warning);
        macros.forEach((macro) => {
          if (!macro.name) {
            diagnostics.push({
              message: "Macro definition missing name",
              lineNumber: macro.startLineNumbers[0],
              startColumnNumber: (0, getColumnNumber_1.getColumnNumber)(macro.declarationLines[0], "%macro", true),
              // The span ends on the declaration's last character, the convention the
              // other macro rules use.
              endColumnNumber: (0, getColumnNumber_1.getColumnNumber)(macro.declarationLines[0], "%macro", true) + macro.declaration.length - 1,
              severity
            });
          } else if (!macro.declarationLines.find((dl) => dl.includes("("))) {
            const macroNameLineIndex = nameLine(macro);
            diagnostics.push({
              message,
              lineNumber: macro.startLineNumbers[macroNameLineIndex],
              startColumnNumber: (0, getColumnNumber_1.getColumnNumber)(macro.declarationLines[macroNameLineIndex], macro.name),
              endColumnNumber: (0, getColumnNumber_1.getColumnNumber)(macro.declarationLines[macroNameLineIndex], macro.name) + macro.name.length - 1,
              severity
            });
          }
        });
        return diagnostics;
      };
      var fix = (value, config) => {
        if (!value)
          return value;
        const declarations = (0, parseMacros_1.parseMacros)(value, config).filter((macro) => !!macro.name).map((macro) => ({ macro, index: nameLine(macro) })).filter(({ index }) => index !== -1);
        return declarations.reduce((text, { macro, index }) => {
          const lineNumber = macro.startLineNumbers[index];
          const starts = lineStarts(text);
          const start = starts[lineNumber - 1];
          const end = lineNumber < starts.length ? starts[lineNumber] : text.length;
          const line = text.slice(start, end);
          const pattern = parameterlessDeclaration(macro.name);
          if (!pattern.test(line))
            return text;
          return text.slice(0, start) + line.replace(pattern, "$1()$2") + text.slice(end);
        }, value);
      };
      exports.hasMacroParentheses = {
        type: LintRuleType_1.LintRuleType.File,
        name,
        description,
        message,
        test,
        fix
      };
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/file/lineEndings.js
  var require_lineEndings = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/file/lineEndings.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.lineEndings = void 0;
      var LineEndings_1 = require_LineEndings();
      var LintRuleType_1 = require_LintRuleType();
      var Severity_1 = require_Severity();
      var getSeverity_1 = require_getSeverity();
      var name = "lineEndings";
      var description = "Ensures every line, including the last, ends with the configured line ending.";
      var message = "Incorrect line ending - {actual} instead of {expected}";
      var missingMessage = "File does not end with a {expected} line ending";
      var test = (value, config) => {
        const lineEndingConfig = (config === null || config === void 0 ? void 0 : config.lineEndings) || LineEndings_1.LineEndings.LF;
        const expectedLineEnding = lineEndingConfig === LineEndings_1.LineEndings.LF ? "{lf}" : "{crlf}";
        const incorrectLineEnding = expectedLineEnding === "{lf}" ? "{crlf}" : "{lf}";
        const lines = value.replace(/\r\n/g, "{crlf}").replace(/\n/g, "{lf}").split(new RegExp(`(?<=${expectedLineEnding})`));
        const diagnostics = [];
        const severity = (0, getSeverity_1.getSeverity)(config, name, Severity_1.Severity.Warning);
        let indexOffset = 0;
        lines.forEach((line, index) => {
          if (line.endsWith(incorrectLineEnding)) {
            diagnostics.push({
              message: message.replace("{expected}", expectedLineEnding === "{lf}" ? "LF" : "CRLF").replace("{actual}", incorrectLineEnding === "{lf}" ? "LF" : "CRLF"),
              lineNumber: index + 1 + indexOffset,
              startColumnNumber: line.indexOf(incorrectLineEnding) + 1,
              endColumnNumber: line.indexOf(incorrectLineEnding) + (incorrectLineEnding === "{crlf}" ? 2 : 1),
              severity
            });
          } else {
            const splitLine = line.split(new RegExp(`(?<=${incorrectLineEnding})`));
            if (splitLine.length > 1) {
              indexOffset += splitLine.length - 1;
            }
            splitLine.forEach((l, i) => {
              if (l.endsWith(incorrectLineEnding)) {
                diagnostics.push({
                  message: message.replace("{expected}", expectedLineEnding === "{lf}" ? "LF" : "CRLF").replace("{actual}", incorrectLineEnding === "{lf}" ? "LF" : "CRLF"),
                  lineNumber: index + i + 1,
                  startColumnNumber: l.indexOf(incorrectLineEnding) + 1,
                  endColumnNumber: l.indexOf(incorrectLineEnding) + (incorrectLineEnding === "{crlf}" ? 2 : 1),
                  severity
                });
              }
            });
          }
        });
        if (value.length > 0 && !value.endsWith("\n")) {
          const lastLines = value.split(/\r\n|\n/);
          const lastLine = lastLines[lastLines.length - 1];
          diagnostics.push({
            message: missingMessage.replace("{expected}", expectedLineEnding === "{lf}" ? "LF" : "CRLF"),
            lineNumber: lastLines.length,
            startColumnNumber: lastLine.length + 1,
            endColumnNumber: lastLine.length + 1,
            severity
          });
        }
        return diagnostics;
      };
      var fix = (value, config) => {
        const lineEndingConfig = (config === null || config === void 0 ? void 0 : config.lineEndings) || LineEndings_1.LineEndings.LF;
        const converted = value.replace(/\r\n/g, "{crlf}").replace(/\n/g, "{lf}").replace(/{crlf}/g, lineEndingConfig === LineEndings_1.LineEndings.LF ? "\n" : "\r\n").replace(/{lf}/g, lineEndingConfig === LineEndings_1.LineEndings.LF ? "\n" : "\r\n");
        const expectedCharacter = lineEndingConfig === LineEndings_1.LineEndings.LF ? "\n" : "\r\n";
        if (converted.length === 0 || converted.endsWith(expectedCharacter)) {
          return converted;
        }
        return converted + expectedCharacter;
      };
      exports.lineEndings = {
        type: LintRuleType_1.LintRuleType.File,
        name,
        description,
        message,
        test,
        fix
      };
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/file/minMacroNameLength.js
  var require_minMacroNameLength = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/file/minMacroNameLength.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.minMacroNameLength = void 0;
      var types_1 = require_types();
      var LintRuleType_1 = require_LintRuleType();
      var Severity_1 = require_Severity();
      var utils_1 = require_utils();
      var getColumnNumber_1 = require_getColumnNumber();
      var parseMacros_1 = require_parseMacros();
      var splitLines_1 = require_splitLines();
      var getSeverity_1 = require_getSeverity();
      var name = "minMacroNameLength";
      var description = "Ensure a macro name is long enough not to collide with another language.";
      var message = `Macro name '{macro}' is shorter than {length} characters`;
      var commentSpans = (line) => {
        const spans = [];
        let inString = false;
        let start = -1;
        for (let index = 0; index < line.length; index++) {
          const char = line[index];
          if (char === "'") {
            inString = !inString;
          } else if (!inString && char === "/" && line[index + 1] === "*") {
            start = index;
            index++;
          } else if (!inString && char === "*" && line[index + 1] === "/" && start > -1) {
            spans.push([start, index + 2]);
            start = -1;
            index++;
          }
        }
        if (start > -1)
          spans.push([start, line.length]);
        return spans;
      };
      var inComment = (line, index) => {
        const spans = commentSpans(line);
        return spans.some(([start, end]) => index > start && index < end);
      };
      var test = (value, config) => {
        var _a;
        const severity = (0, getSeverity_1.getSeverity)(config, name, Severity_1.Severity.Warning);
        const minimum = (_a = config === null || config === void 0 ? void 0 : config.minMacroNameLength) !== null && _a !== void 0 ? _a : 3;
        if (minimum < 2)
          return [];
        const lines = (0, splitLines_1.splitLines)(value);
        const cfg = config || new types_1.LintConfig();
        const dataSections = (0, utils_1.getDataSectionsDetail)(value, cfg);
        const seen = /* @__PURE__ */ new Map();
        return (0, parseMacros_1.parseMacros)(value, cfg).filter((macro) => {
          var _a2;
          return macro.name && ((_a2 = macro.startLineNumbers) === null || _a2 === void 0 ? void 0 : _a2.length);
        }).filter((macro) => macro.name.length < minimum).filter((macro) => !(0, utils_1.checkIsDataLine)(dataSections, macro.startLineNumbers[0] - 1)).map((macro) => {
          var _a2;
          const lineNumber = macro.startLineNumbers[0];
          const line = lines[lineNumber - 1] || "";
          const key = `${lineNumber}:${macro.name.toLowerCase()}`;
          const occurrence = (_a2 = seen.get(key)) !== null && _a2 !== void 0 ? _a2 : 0;
          seen.set(key, occurrence + 1);
          const matches = [
            ...line.matchAll(new RegExp(`%macro\\s+${(0, utils_1.escapeRegExp)(macro.name)}\\b`, "gi"))
          ].filter((match) => !inComment(line, match.index));
          const declaration = matches[occurrence];
          const startColumnNumber = declaration ? declaration.index + 1 : (0, getColumnNumber_1.getColumnNumber)(line, "%macro", true);
          return {
            message: message.replace("{macro}", macro.name).replace("{length}", String(minimum)),
            lineNumber,
            startColumnNumber,
            // When the name is on a later line than `%macro`, the diagnostic
            // covers the keyword itself rather than the rest of the line.
            endColumnNumber: declaration ? startColumnNumber + declaration[0].length - 1 : startColumnNumber + "%macro".length - 1,
            severity
          };
        });
      };
      exports.minMacroNameLength = {
        type: LintRuleType_1.LintRuleType.File,
        name,
        description,
        message,
        test
      };
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/parseMacroCalls.js
  var require_parseMacroCalls = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/parseMacroCalls.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.parseMacroCalls = void 0;
      var macroNameStart = /^%([a-z_][a-z0-9_]*)/i;
      var dataSectionStart = /^(datalines4?|cards4?|parmcards4?)\s*;/i;
      var maskingFunctionStart = /^%(nrstr|str)\s*\(/i;
      var embeddedLanguageProc = /^proc\s+(lua|groovy)\b/i;
      var embeddedLanguageEnd = /^endsubmit\s*;/i;
      var embeddedLanguageEndSearch = /endsubmit/i;
      var findNameTokens = (text, from, to) => {
        const tokens = [];
        let index = from;
        while (index < to) {
          if (text[index] === "%") {
            if (text[index + 1] === "(" || text[index + 1] === ")") {
              index += 2;
              continue;
            }
            const macroName = macroNameStart.exec(text.slice(index, to));
            if (macroName) {
              const after = text.slice(index + macroName[0].length, to);
              const isLabel = after.startsWith(":");
              if (!isLabel) {
                tokens.push({
                  name: macroName[1],
                  offset: index,
                  hasParen: /^\s*\(/.test(after)
                });
              }
              index += macroName[0].length;
              continue;
            }
          }
          index++;
        }
        return tokens;
      };
      var parseMacroCalls = (text, config, options) => {
        const calls = [];
        if (!text)
          return calls;
        const length = text.length;
        let index = 0;
        let lineNumber = 1;
        let columnNumber = 1;
        let atStatementStart = true;
        let inDoubleQuote = false;
        const advanceTo = (target) => {
          const limit = Math.min(target, length);
          while (index < limit) {
            if (text[index] === "\n") {
              lineNumber++;
              columnNumber = 1;
            } else {
              columnNumber++;
            }
            index++;
          }
        };
        while (index < length) {
          const char = text[index];
          if (char === "\n") {
            lineNumber++;
            columnNumber = 1;
            inDoubleQuote = false;
            index++;
            continue;
          }
          if (char === "\r" || char === " " || char === "	") {
            columnNumber++;
            index++;
            continue;
          }
          if (char === "'") {
            if (inDoubleQuote) {
              columnNumber++;
              index++;
              continue;
            }
            let end = index + 1;
            while (end < length) {
              if (text[end] === "'") {
                end++;
                break;
              }
              if (text[end] === "\n")
                break;
              end++;
            }
            findNameTokens(text, index + 1, end).forEach((token) => {
              advanceTo(token.offset);
              calls.push({
                name: token.name,
                lineNumber,
                startColumnNumber: columnNumber,
                endColumnNumber: columnNumber + 1 + token.name.length,
                quoted: true,
                hasParen: token.hasParen
              });
            });
            advanceTo(end);
            continue;
          }
          if (char === '"') {
            inDoubleQuote = !inDoubleQuote;
            columnNumber++;
            index++;
            continue;
          }
          if (!inDoubleQuote) {
            if (char === ";") {
              atStatementStart = true;
              columnNumber++;
              index++;
              continue;
            }
            if (char === "/" && text[index + 1] === "*") {
              let end = index + 2;
              while (end < length && !(text[end] === "*" && text[end + 1] === "/")) {
                end++;
              }
              advanceTo(Math.min(end + 2, length));
              continue;
            }
          }
          if (char === "%") {
            if (text[index + 1] === "*") {
              let end = index + 2;
              while (end < length && text[end] !== ";")
                end++;
              advanceTo(Math.min(end + 1, length));
              continue;
            }
            const maskingFunction = maskingFunctionStart.exec(text.slice(index));
            if (maskingFunction) {
              let depth = 0;
              let end = index + maskingFunction[0].length - 1;
              while (end < length) {
                if (text[end] === "%" && (text[end + 1] === "(" || text[end + 1] === ")")) {
                  end += 2;
                  continue;
                }
                if (text[end] === "(")
                  depth++;
                else if (text[end] === ")") {
                  depth--;
                  if (depth === 0) {
                    end++;
                    break;
                  }
                }
                end++;
              }
              if (options === null || options === void 0 ? void 0 : options.includeMasked) {
                const argumentStart = index + maskingFunction[0].length;
                advanceTo(argumentStart);
                findNameTokens(text, argumentStart, end).forEach((token) => {
                  advanceTo(token.offset);
                  calls.push({
                    name: token.name,
                    lineNumber,
                    startColumnNumber: columnNumber,
                    endColumnNumber: columnNumber + 1 + token.name.length
                  });
                });
              }
              advanceTo(end);
              atStatementStart = false;
              continue;
            }
            const macroName = macroNameStart.exec(text.slice(index));
            if (macroName) {
              if (text[index + macroName[0].length] !== ":") {
                calls.push({
                  name: macroName[1],
                  lineNumber,
                  startColumnNumber: columnNumber,
                  endColumnNumber: columnNumber + 1 + macroName[1].length
                });
              }
              advanceTo(index + macroName[0].length);
              atStatementStart = false;
              continue;
            }
          }
          if (atStatementStart && !inDoubleQuote) {
            const embeddedProcStart = embeddedLanguageProc.exec(text.slice(index));
            if (embeddedProcStart && embeddedLanguageEndSearch.test(text.slice(index))) {
              const afterProc = index + embeddedProcStart[0].length;
              const offset = text.slice(afterProc).search(embeddedLanguageEndSearch);
              const endSubmit = embeddedLanguageEnd.exec(text.slice(afterProc + offset));
              advanceTo(endSubmit ? afterProc + offset + endSubmit[0].length : length);
              atStatementStart = true;
              continue;
            }
            const dataSection = dataSectionStart.exec(text.slice(index));
            if (dataSection) {
              const terminator = /4/.test(dataSection[1]) ? ";;;;" : ";";
              let lineStart = index + dataSection[0].length;
              let end = length;
              while (lineStart <= length) {
                const lineEnd = text.indexOf("\n", lineStart);
                const actualEnd = lineEnd === -1 ? length : lineEnd;
                if (text.slice(lineStart, actualEnd).trim() === terminator) {
                  end = actualEnd;
                  break;
                }
                if (lineEnd === -1)
                  break;
                lineStart = lineEnd + 1;
              }
              advanceTo(end);
              atStatementStart = true;
              continue;
            }
            if (char === "*") {
              let end = index + 1;
              while (end < length && text[end] !== ";")
                end++;
              advanceTo(end + 1);
              atStatementStart = true;
              continue;
            }
          }
          atStatementStart = false;
          columnNumber++;
          index++;
        }
        return calls;
      };
      exports.parseMacroCalls = parseMacroCalls;
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/file/noMacroIfInOpenCode.js
  var require_noMacroIfInOpenCode = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/file/noMacroIfInOpenCode.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.noMacroIfInOpenCode = void 0;
      var types_1 = require_types();
      var LintRuleType_1 = require_LintRuleType();
      var Severity_1 = require_Severity();
      var parseMacroCalls_1 = require_parseMacroCalls();
      var parseMacros_1 = require_parseMacros();
      var getSeverity_1 = require_getSeverity();
      var name = "noMacroIfInOpenCode";
      var description = "Reports %if used in open code, which requires SAS 9.4M5.";
      var message = `Macro %if used in open code - open-code %if requires SAS 9.4M5; move the block inside a %macro definition`;
      var getMacroSpans = (value, config) => (0, parseMacros_1.parseMacros)(value, config).filter((macro) => macro.startLineNumbers.length > 0).map((macro) => {
        var _a;
        return {
          firstLine: macro.startLineNumbers[0],
          // A definition with no `%mend` keeps reading to the end of the file, so
          // nothing after its declaration is open code - SAS reads it as the macro
          // body, and reporting it as open code would point at a fix that is not
          // the one the file needs.
          lastLine: (_a = macro.endLineNumber) !== null && _a !== void 0 ? _a : Number.POSITIVE_INFINITY
        };
      });
      var isInMacro = (spans, lineNumber) => spans.some((span) => lineNumber >= span.firstLine && lineNumber <= span.lastLine);
      var test = (value, config) => {
        if (!value)
          return [];
        const cfg = config || new types_1.LintConfig();
        const severity = (0, getSeverity_1.getSeverity)(cfg, name, Severity_1.Severity.Warning);
        const spans = getMacroSpans(value, cfg);
        return (0, parseMacroCalls_1.parseMacroCalls)(value, cfg).filter((call) => call.name.toLowerCase() === "if" && !call.quoted).filter((call) => !isInMacro(spans, call.lineNumber)).map((call) => ({
          message,
          lineNumber: call.lineNumber,
          startColumnNumber: call.startColumnNumber,
          endColumnNumber: call.endColumnNumber,
          severity
        }));
      };
      exports.noMacroIfInOpenCode = {
        type: LintRuleType_1.LintRuleType.File,
        name,
        description,
        message,
        test
      };
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/getIndex.js
  var require_getIndex = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/getIndex.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.getIndex = void 0;
      var splitLines_1 = require_splitLines();
      var getIndex = (text, lineNumber, columnNumber) => {
        if (lineNumber <= 1)
          return Math.max(columnNumber - 1, 0);
        const lines = (0, splitLines_1.splitLines)(text);
        let index = 0;
        for (let line = 1; line < lineNumber && line <= lines.length; line++) {
          const terminator = text.startsWith("\r\n", index + lines[line - 1].length) ? 2 : 1;
          index += lines[line - 1].length + terminator;
        }
        return Math.min(index + Math.max(columnNumber - 1, 0), text.length);
      };
      exports.getIndex = getIndex;
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/sasMacros.generated.js
  var require_sasMacros_generated = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/sasMacros.generated.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.sasMacros = void 0;
      exports.sasMacros = [
        "abort",
        "armconv",
        "armend",
        "armgtid",
        "arminit",
        "armjoin",
        "armproc",
        "armstop",
        "armstrt",
        "armupdt",
        "bquote",
        "by",
        "cmpres",
        "colormac",
        "compstor",
        "copy",
        "datatyp",
        "dequote",
        "display",
        "do",
        "dqload",
        "dqputloc",
        "dqunload",
        "else",
        "end",
        "eval",
        "global",
        "goto",
        "helpclr",
        "if",
        "inc",
        "include",
        "index",
        "indexc",
        "indexw",
        "input",
        "kcmpres",
        "kindex",
        "kleft",
        "klength",
        "klowcase",
        "kscan",
        "ksubstr",
        "ktrim",
        "kupcase",
        "kverify",
        "left",
        "length",
        "let",
        "list",
        "local",
        "lowcase",
        "macro",
        "mend",
        "nrbquote",
        "nrquote",
        "nrstr",
        "perfend",
        "perfinit",
        "perfstop",
        "perfstrt",
        "put",
        "qbquote",
        "qcmpres",
        "qdequote",
        "qindex",
        "qindexc",
        "qindexw",
        "qkcmpres",
        "qkleft",
        "qklowcas",
        "qklowcase",
        "qkscan",
        "qksubstr",
        "qktrim",
        "qkupcase",
        "qleft",
        "qlowcase",
        "qscan",
        "qsubstr",
        "qsysfunc",
        "qtrim",
        "quote",
        "qupcase",
        "return",
        "run",
        "scan",
        "str",
        "substr",
        "superq",
        "symdel",
        "symexist",
        "symglobl",
        "symlocal",
        "syscall",
        "sysevalf",
        "sysexec",
        "sysfunc",
        "sysget",
        "syslput",
        "sysmacdelete",
        "sysmacexec",
        "sysmacexist",
        "sysmexecdepth",
        "sysmexecname",
        "sysmstoreclear",
        "sysprod",
        "sysrc",
        "sysrput",
        "then",
        "to",
        "tplot",
        "translate",
        "tranwrd",
        "trim",
        "trimn",
        "unquote",
        "until",
        "upcase",
        "validchs",
        "verify",
        "while",
        "window"
      ];
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/sasMacros.js
  var require_sasMacros = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/sasMacros.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.isSasMacro = exports.sasMacros = void 0;
      var sasMacros_generated_1 = require_sasMacros_generated();
      exports.sasMacros = new Set(sasMacros_generated_1.sasMacros);
      var isSasMacro = (name) => exports.sasMacros.has(name.toLowerCase());
      exports.isSasMacro = isSasMacro;
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/parseMacroCallArguments.js
  var require_parseMacroCallArguments = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/parseMacroCallArguments.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.parseMacroCallArguments = exports.hasMaskedName = void 0;
      var getIndex_1 = require_getIndex();
      var maskingFunction = /%(nrstr|str|bquote|quote|superq|qsysfunc|qcmpres|qleft|qlowcase|qscan|qsubstr|qtrim|qupcase|qverify)\s*\(/iy;
      var keywordParameter = /^\s*(?:&+[a-z_][a-z0-9_.]*|[a-z_][a-z0-9_]*)\s*=/i;
      var leadingComment = /^(?:\s*\/\*[\s\S]*?\*\/)*\s*/;
      var skipMasked = (text, openParen) => {
        let depth = 1;
        let index = openParen + 1;
        while (index < text.length && depth) {
          if (text[index] === "%" && (text[index + 1] === "(" || text[index + 1] === ")")) {
            index += 2;
            continue;
          }
          if (text[index] === "(")
            depth++;
          if (text[index] === ")")
            depth--;
          index++;
        }
        return index;
      };
      var hasMaskedName = (parameter) => {
        const start = parameter.length - parameter.trimStart().length;
        maskingFunction.lastIndex = start;
        if (!maskingFunction.test(parameter))
          return false;
        const end = skipMasked(parameter, maskingFunction.lastIndex - 1);
        return /^\s*=/.test(parameter.slice(end));
      };
      exports.hasMaskedName = hasMaskedName;
      var parseMacroCallArguments = (text, call) => {
        if (!text)
          return null;
        let openParen = (0, getIndex_1.getIndex)(text, call.lineNumber, call.endColumnNumber);
        while (openParen < text.length && /\s/.test(text[openParen]))
          openParen++;
        if (text[openParen] !== "(")
          return null;
        const parameters = [];
        let depth = 0;
        let quote = null;
        let inComment = false;
        let parameterStart = openParen + 1;
        let index = openParen + 1;
        const closeParameter = (end) => {
          const parameter = text.slice(parameterStart, end);
          parameters.push({
            text: parameter,
            isKeyword: keywordParameter.test(parameter.replace(leadingComment, "")),
            start: parameterStart,
            end
          });
        };
        while (index < text.length) {
          const char = text[index];
          if (inComment) {
            if (text.startsWith("*/", index)) {
              inComment = false;
              index += 2;
              continue;
            }
            index++;
            continue;
          }
          if (quote) {
            if (char === quote)
              quote = null;
            index++;
            continue;
          }
          maskingFunction.lastIndex = index;
          if (maskingFunction.test(text)) {
            index = skipMasked(text, maskingFunction.lastIndex - 1);
            continue;
          }
          if (text.startsWith("/*", index)) {
            inComment = true;
            index += 2;
            continue;
          }
          if (char === "'" || char === '"') {
            quote = char;
            index++;
            continue;
          }
          if (char === "(") {
            depth++;
            index++;
            continue;
          }
          if (char === ")") {
            if (depth) {
              depth--;
              index++;
              continue;
            }
            closeParameter(index);
            const lineEnd = text.indexOf("\n", index);
            const afterClose = text.slice(index + 1, lineEnd === -1 ? text.length : lineEnd);
            return {
              openParen,
              closeParen: index,
              unclosed: null,
              parameters,
              afterClose
            };
          }
          if (char === "," && !depth) {
            closeParameter(index);
            parameterStart = index + 1;
            index++;
            continue;
          }
          index++;
        }
        return {
          openParen,
          closeParen: -1,
          unclosed: inComment ? "comment" : quote ? "quote" : "parenthesis",
          parameters,
          afterClose: ""
        };
      };
      exports.parseMacroCallArguments = parseMacroCallArguments;
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/file/noMalformedMacroCalls.js
  var require_noMalformedMacroCalls = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/file/noMalformedMacroCalls.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.noMalformedMacroCalls = void 0;
      var LintRuleType_1 = require_LintRuleType();
      var Severity_1 = require_Severity();
      var getIndex_1 = require_getIndex();
      var getPosition_1 = require_getPosition();
      var getSeverity_1 = require_getSeverity();
      var sasMacros_1 = require_sasMacros();
      var parseMacroCallArguments_1 = require_parseMacroCallArguments();
      var parseMacroCalls_1 = require_parseMacroCalls();
      var name = "noMalformedMacroCalls";
      var message = "Macro call arguments: {reason}";
      var description = "Reports macro calls whose argument list does not parse as written: a call that never closes, or text spilled after a keyword parameter.";
      var reasons = {
        quote: "unclosed quote - the rest of the file is read as part of the value; quote it with %str()",
        parenthesis: "unclosed parenthesis - the call never closes; quote the value with %str()",
        comment: "unterminated comment - the rest of the call is read as a comment",
        spill: '"%s" is not a name=value parameter and follows one - a comma inside a value? quote it with %str()',
        empty: "an empty parameter follows a comma - remove it; the engine reads it as a positional parameter",
        quotedName: 'a parameter name cannot be quoted - the engine answers "Invalid macro parameter name"; drop the quotes',
        maskedName: "a parameter name cannot be masked - the engine reads it as a positional parameter; drop the %str() and name the parameter directly"
      };
      var quotedParameterName = /^\s*(['"])[^'"]*\1\s*=/;
      var test = (value, config) => {
        const diagnostics = [];
        const severity = (0, getSeverity_1.getSeverity)(config, name, Severity_1.Severity.Warning);
        const at = (start, end, reason) => {
          const from = (0, getPosition_1.getPosition)(value, start);
          const to = (0, getPosition_1.getPosition)(value, end);
          return {
            message: message.replace("{reason}", reason),
            lineNumber: from.lineNumber,
            startColumnNumber: from.columnNumber,
            endColumnNumber: to.columnNumber,
            severity
          };
        };
        (0, parseMacroCalls_1.parseMacroCalls)(value, config).filter((call) => !call.quoted && !(0, sasMacros_1.isSasMacro)(call.name)).forEach((call) => {
          const args = (0, parseMacroCallArguments_1.parseMacroCallArguments)(value, call);
          if (!args)
            return;
          const callStart = (0, getIndex_1.getIndex)(value, call.lineNumber, call.startColumnNumber);
          if (args.unclosed) {
            diagnostics.push(at(callStart, callStart + call.name.length + 1, reasons[args.unclosed]));
            return;
          }
          const firstKeyword = args.parameters.findIndex((parameter) => parameter.isKeyword);
          if (firstKeyword === -1)
            return;
          const stray = args.parameters.slice(firstKeyword + 1).find((parameter) => !parameter.isKeyword);
          if (stray) {
            const visible = stray.text.replace(/\/\*[\s\S]*?\*\//g, " ").trim().replace(/\s+/g, " ");
            const textStart = stray.start + (stray.text.length - stray.text.trimStart().length);
            const textEnd = stray.end - (stray.text.length - stray.text.trimEnd().length);
            if ((0, parseMacroCallArguments_1.hasMaskedName)(stray.text)) {
              diagnostics.push(at(textStart, textEnd, reasons.maskedName));
              return;
            }
            if (quotedParameterName.test(stray.text)) {
              diagnostics.push(at(textStart, textEnd, reasons.quotedName));
              return;
            }
            if (!visible) {
              diagnostics.push(at(Math.max(stray.start - 1, 0), stray.start, reasons.empty));
              return;
            }
            diagnostics.push(at(textStart, textEnd, reasons.spill.replace("%s", visible)));
          }
        });
        return diagnostics;
      };
      exports.noMalformedMacroCalls = {
        type: LintRuleType_1.LintRuleType.File,
        name,
        description,
        message,
        test
      };
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/file/noNestedCommentsInHeader.js
  var require_noNestedCommentsInHeader = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/file/noNestedCommentsInHeader.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.noNestedCommentsInHeader = void 0;
      var LintRuleType_1 = require_LintRuleType();
      var Severity_1 = require_Severity();
      var getPosition_1 = require_getPosition();
      var getSeverity_1 = require_getSeverity();
      var name = "noNestedCommentsInHeader";
      var description = "Disallow a close marker inside the Doxygen header. SAS block comments do not nest and end at the first close marker, so anything after one in the header is compiled as SAS. The header end is identified by its `**/` terminator standing alone on its line, so a project that closes headers with a plain close marker is not inspected.";
      var message = "Doxygen header contains a nested block comment";
      var messageForTerminator = "Doxygen header contains /*/, which SAS reads as a comment terminator";
      var messageForText = "Doxygen header contains a close marker as text";
      var CLOSE = "*/";
      var TERMINATOR = "**/";
      var LATER_HEADER = /^[ \t]*\/\*\*/m;
      var ownTerminator = (value, close) => {
        let candidate = value.indexOf(TERMINATOR, close - 1);
        while (candidate !== -1) {
          const lineStart = value.lastIndexOf("\n", candidate - 1) + 1;
          const lineLeading = !value.slice(lineStart, candidate).trim();
          if (LATER_HEADER.test(value.slice(close + 2, candidate)))
            return null;
          if (lineLeading)
            return candidate;
          candidate = value.indexOf(TERMINATOR, candidate + 1);
        }
        return null;
      };
      var test = (value, config) => {
        const severity = (0, getSeverity_1.getSeverity)(config, name, Severity_1.Severity.Warning);
        if (!value)
          return [];
        const start = value.search(/\S/);
        if (start === -1 || !value.startsWith("/**", start))
          return [];
        const close = value.indexOf(CLOSE, start + 2);
        if (close === -1)
          return [];
        const terminator = ownTerminator(value, close);
        if (terminator === null || terminator === close - 1)
          return [];
        const nestedComment = value.indexOf("/*", start + 2);
        const nested = nestedComment !== -1 && nestedComment < close ? nestedComment : null;
        const literalSequence = nested !== null && nested === close - 1;
        const reported = nested !== null && nested !== void 0 ? nested : close;
        const { lineNumber, columnNumber } = (0, getPosition_1.getPosition)(value, reported);
        return [
          {
            message: literalSequence ? messageForTerminator : nested === null ? messageForText : message,
            lineNumber,
            startColumnNumber: columnNumber,
            endColumnNumber: columnNumber + 1,
            severity
          }
        ];
      };
      exports.noNestedCommentsInHeader = {
        type: LintRuleType_1.LintRuleType.File,
        name,
        description,
        message,
        test
      };
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/file/noNestedMacros.js
  var require_noNestedMacros = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/file/noNestedMacros.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.noNestedMacros = void 0;
      var LintRuleType_1 = require_LintRuleType();
      var Severity_1 = require_Severity();
      var getColumnNumber_1 = require_getColumnNumber();
      var parseMacros_1 = require_parseMacros();
      var splitLines_1 = require_splitLines();
      var getSeverity_1 = require_getSeverity();
      var name = "noNestedMacros";
      var description = "Enfoces the absence of nested macro definitions.";
      var message = `Macro definition for '{macro}' present in macro '{parent}'`;
      var test = (value, config) => {
        const lines = (0, splitLines_1.splitLines)(value);
        const diagnostics = [];
        const macros = (0, parseMacros_1.parseMacros)(value, config);
        const severity = (0, getSeverity_1.getSeverity)(config, name, Severity_1.Severity.Warning);
        macros.filter((m) => !!m.parentMacro).forEach((macro) => {
          diagnostics.push({
            message: message.replace("{macro}", macro.name).replace("{parent}", macro.parentMacro),
            lineNumber: macro.startLineNumbers[0],
            startColumnNumber: (0, getColumnNumber_1.getColumnNumber)(lines[macro.startLineNumbers[0] - 1], "%macro", true),
            endColumnNumber: (0, getColumnNumber_1.getColumnNumber)(lines[macro.startLineNumbers[0] - 1], "%macro", true) + lines[macro.startLineNumbers[0] - 1].trim().length - 1,
            severity
          });
        });
        return diagnostics;
      };
      exports.noNestedMacros = {
        type: LintRuleType_1.LintRuleType.File,
        name,
        description,
        message,
        test
      };
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/file/noXcmd.js
  var require_noXcmd = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/file/noXcmd.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.noXcmd = void 0;
      var LintRuleType_1 = require_LintRuleType();
      var Severity_1 = require_Severity();
      var utils_1 = require_utils();
      var getSeverity_1 = require_getSeverity();
      var name = "noXcmd";
      var description = "Disallow OS commands, which need XCMD: the x statement, call system, %sysexec, %sysfunc(system(...)), options xcmd, a pipe fileref and systask command. `options noxcmd;` is the hardening and is not reported.";
      var message = "OS command requires XCMD";
      var maskNonCode = (text) => {
        const characters = text.split("");
        const statementStarts = [];
        let statementStarted = false;
        let inBlockComment = false;
        let inCommentStatement = false;
        let quote = "";
        let index = 0;
        const blank = (position) => {
          if (text[position] !== "\n")
            characters[position] = " ";
        };
        while (index < text.length) {
          const character = text[index];
          const next = text[index + 1];
          if (inBlockComment) {
            if (character === "*" && next === "/") {
              blank(index);
              blank(index + 1);
              inBlockComment = false;
              index += 2;
              continue;
            }
            blank(index);
            index++;
            continue;
          }
          if (inCommentStatement) {
            if (character === ";") {
              inCommentStatement = false;
              statementStarted = false;
              index++;
              continue;
            }
            blank(index);
            index++;
            continue;
          }
          if (quote) {
            if (character === quote) {
              if (next === quote) {
                characters[index] = "_";
                characters[index + 1] = "_";
                index += 2;
                continue;
              }
              quote = "";
              index++;
              continue;
            }
            if (character !== "\n")
              characters[index] = "_";
            index++;
            continue;
          }
          if (character === "/" && next === "*") {
            blank(index);
            blank(index + 1);
            inBlockComment = true;
            index += 2;
            continue;
          }
          if (!statementStarted && character === "%" && next === "*") {
            blank(index);
            blank(index + 1);
            inCommentStatement = true;
            index += 2;
            continue;
          }
          if (!statementStarted && character === "*") {
            blank(index);
            inCommentStatement = true;
            index++;
            continue;
          }
          if (character === "'" || character === '"') {
            quote = character;
            statementStarted = true;
            index++;
            continue;
          }
          if (character === ";") {
            statementStarted = false;
            index++;
            continue;
          }
          if (!/\s/.test(character)) {
            if (!statementStarted)
              statementStarts.push(index);
            statementStarted = true;
          }
          index++;
        }
        return { code: characters.join(""), statementStarts };
      };
      var getLineStarts = (text) => {
        const starts = [0];
        for (let index = 0; index < text.length; index++) {
          if (text[index] === "\n")
            starts.push(index + 1);
        }
        return starts;
      };
      var blankDatalines = (text) => {
        var _a;
        const { code: codeOnly } = maskNonCode(text);
        const statement = /(?:^|;)[ \t]*(datalines|cards|parmcards)(4)?[ \t]*;/gim;
        const characters = text.split("");
        const lineStarts = getLineStarts(text);
        let match;
        while (match = statement.exec(codeOnly)) {
          const terminator = match[2] ? /^;;;;/ : /^;/;
          const from = match.index + match[0].length;
          const end = lineStarts.findIndex((start, index) => {
            if (start < from)
              return false;
            return terminator.test(text.slice(start, lineStarts[index + 1]));
          });
          if (end === -1)
            continue;
          const to = (_a = lineStarts[end + 1]) !== null && _a !== void 0 ? _a : text.length;
          for (let index = from; index < to; index++) {
            if (characters[index] !== "\n")
              characters[index] = " ";
          }
        }
        return characters.join("");
      };
      var getTokens = (code, from, to) => {
        const tokens = [];
        let index = from;
        while (index < to) {
          if (/\s/.test(code[index])) {
            index++;
            continue;
          }
          const start = index;
          while (index < to && !/\s/.test(code[index]))
            index++;
          tokens.push({
            value: code.slice(start, index).replace(/;$/, ""),
            index: start
          });
        }
        return tokens;
      };
      var xStatement = {
        label: "x statement",
        find: (code, statementStarts) => {
          const found = [];
          statementStarts.forEach((start) => {
            if (!/^x[ \t]+(?![-+=,;)])\S/i.test(code.slice(start)))
              return;
            found.push({ index: start, length: 1 });
          });
          return found;
        }
      };
      var callSystem = {
        label: "call system",
        find: (code) => {
          const regex = /\bcall\s+system\s*\(/gi;
          const found = [];
          let match;
          while (match = regex.exec(code)) {
            found.push({ index: match.index, length: match[0].length });
          }
          return found;
        }
      };
      var sysExec = {
        label: "%sysexec",
        find: (code) => {
          const regex = /%sysexec\b/gi;
          const found = [];
          let match;
          while (match = regex.exec(code)) {
            found.push({ index: match.index, length: match[0].length });
          }
          return found;
        }
      };
      var sysFuncSystem = {
        label: "%sysfunc(system(...))",
        find: (code) => {
          const regex = /%sysfunc\s*\(\s*system\s*\(/gi;
          const found = [];
          let match;
          while (match = regex.exec(code)) {
            found.push({ index: match.index, length: match[0].length });
          }
          return found;
        }
      };
      var DATASET_KEYWORDS = [
        "set",
        "merge",
        "update",
        "modify",
        "data",
        "out",
        "in",
        "base"
      ];
      var isDatasetReference = (code, index) => {
        var _a, _b;
        const before = code.slice(0, index).trimEnd();
        const lastCharacter = before[before.length - 1];
        if (lastCharacter === ".")
          return true;
        const prefix = lastCharacter === "=" ? before.slice(0, -1).trimEnd() : before;
        const keyword = (_b = (_a = /([A-Za-z_][A-Za-z0-9_]*)$/.exec(prefix)) === null || _a === void 0 ? void 0 : _a[1]) !== null && _b !== void 0 ? _b : "";
        return DATASET_KEYWORDS.includes(keyword.toLowerCase());
      };
      var systemFunction = {
        label: "system(...)",
        find: (code) => {
          const regex = /\bsystem\s*\(/gi;
          const found = [];
          let match;
          while (match = regex.exec(code)) {
            if (code[match.index - 1] === "%")
              continue;
            const before = code.slice(Math.max(0, match.index - 20), match.index);
            if (/%(macro|mend)\s+$/i.test(before))
              continue;
            if (isDatasetReference(code, match.index))
              continue;
            found.push({ index: match.index, length: match[0].length });
          }
          return found;
        }
      };
      var sysTaskCommand = {
        label: "systask command",
        find: (code) => {
          const regex = /\bsystask\s+command\b/gi;
          const found = [];
          let match;
          while (match = regex.exec(code)) {
            found.push({ index: match.index, length: match[0].length });
          }
          return found;
        }
      };
      var optionsXcmd = {
        label: "options xcmd",
        find: (code) => {
          const regex = /(?:^|;)[ \t]*options\b([^;]*)/gim;
          const found = [];
          let match;
          while (match = regex.exec(code)) {
            const to = match.index + match[0].length;
            const from = to - match[1].length;
            getTokens(code, from, to).filter((token) => token.value.toLowerCase() === "xcmd").forEach((token) => found.push({ index: token.index, length: token.value.length }));
          }
          return found;
        }
      };
      var pipeFileref = {
        label: "pipe",
        find: (code) => {
          const regex = /(?:^|;)[ \t]*(filename|infile)\b([^;]*)/gim;
          const found = [];
          let match;
          while (match = regex.exec(code)) {
            const keyword = match[1].toLowerCase();
            const to = match.index + match[0].length;
            const tokens = getTokens(code, to - match[2].length, to);
            if (keyword === "filename") {
              const pipe2 = tokens.slice(1).find((token) => token.value.toLowerCase() === "pipe");
              if (pipe2)
                found.push({ index: pipe2.index, length: pipe2.value.length });
              continue;
            }
            const path = tokens.findIndex((token) => /["']$/.test(token.value) || /^[&%]/.test(token.value));
            if (path === -1)
              continue;
            const pipe = tokens.slice(path + 1).find((token) => token.value.toLowerCase() === "pipe");
            if (pipe)
              found.push({ index: pipe.index, length: pipe.value.length });
          }
          return found;
        }
      };
      var constructs = [
        xStatement,
        callSystem,
        sysExec,
        sysFuncSystem,
        systemFunction,
        sysTaskCommand,
        optionsXcmd,
        pipeFileref
      ];
      var removeNested = (findings) => {
        const kept = [];
        return findings.sort((a, b) => a.index - b.index || b.length - a.length).filter((finding) => {
          const end = finding.index + finding.length;
          if (kept.some((span) => finding.index >= span.index && end <= span.index + span.length))
            return false;
          kept.push(finding);
          return true;
        });
      };
      var test = (value, config) => {
        if (!value)
          return [];
        const severity = (0, getSeverity_1.getSeverity)(config, name, Severity_1.Severity.Warning);
        const { code, statementStarts } = maskNonCode(blankDatalines(value));
        const findings = [];
        constructs.forEach((construct) => {
          construct.find(code, statementStarts).forEach((found) => findings.push(Object.assign(Object.assign({}, found), { label: construct.label })));
        });
        return removeNested(findings).sort((a, b) => a.index - b.index || a.length - b.length).map((finding) => {
          const { lineNumber, columnNumber } = (0, utils_1.getPosition)(code, finding.index);
          const lineEnd = code.indexOf("\n", finding.index);
          const spanEnd = lineEnd === -1 || lineEnd >= finding.index + finding.length ? finding.index + finding.length - 1 : lineEnd - 1;
          const trimmedEnd = code[spanEnd] === "\r" ? spanEnd - 1 : spanEnd;
          return {
            message: `${message}: ${finding.label}`,
            lineNumber,
            startColumnNumber: columnNumber,
            endColumnNumber: (0, utils_1.getPosition)(code, trimmedEnd).columnNumber,
            severity
          };
        });
      };
      exports.noXcmd = {
        type: LintRuleType_1.LintRuleType.File,
        name,
        description,
        message,
        test
      };
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/splitText.js
  var require_splitText = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/splitText.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.splitText = void 0;
      var LineEndings_1 = require_LineEndings();
      var splitText = (text, config) => {
        if (!text)
          return [];
        const expectedLineEndings = config.lineEndings === LineEndings_1.LineEndings.LF ? "\n" : "\r\n";
        const incorrectLineEndings = expectedLineEndings === "\n" ? "\r\n" : "\n";
        text = text.replace(new RegExp(incorrectLineEndings, "g"), expectedLineEndings);
        return text.replace(/\r/g, "").split(/\n/);
      };
      exports.splitText = splitText;
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/getHeaderLinesCount.js
  var require_getHeaderLinesCount = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/getHeaderLinesCount.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.getHeaderLinesCount = void 0;
      var splitText_1 = require_splitText();
      var getHeaderLinesCount = (text, config) => {
        let count = 0;
        if (text.trimStart().startsWith("/*")) {
          const lines = (0, splitText_1.splitText)(text, config);
          for (const line of lines) {
            count++;
            if (line.match(/\*\//)) {
              break;
            }
          }
        }
        return count;
      };
      exports.getHeaderLinesCount = getHeaderLinesCount;
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/headerMacros.js
  var require_headerMacros = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/headerMacros.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.removeMacrosFromHeader = exports.repairHeaderList = exports.addMacrosToHeader = exports.getHeaderMacros = void 0;
      var types_1 = require_types();
      var LineEndings_1 = require_LineEndings();
      var getHeaderLinesCount_1 = require_getHeaderLinesCount();
      var splitText_1 = require_splitText();
      var sasMacrosHeader = /<h4>\s*SAS Macros\s*<\/h4>/i;
      var headerTag = "</h4>";
      var listItem = /^(\s*@\s*)(\w+)(\s+)(\S+)(.*)$/;
      var lineTag = /^\s*@\s*(\w+)(?:\s|$)/;
      var entryTags = /* @__PURE__ */ new Set(["li", "il", "l1", "1i"]);
      var getLineTag = (line) => {
        const match = lineTag.exec(line);
        return match ? match[1].toLowerCase() : null;
      };
      var parseListItem = (text, offset = 0) => {
        const match = listItem.exec(text);
        if (!match)
          return null;
        const [, prefix, tag, gap, payload, tail] = match;
        if (!entryTags.has(tag.toLowerCase()))
          return null;
        if (tail.trim() !== "")
          return null;
        const normalised = payload.replace(/\\/g, "/");
        const fileName = normalised.split("/").pop() || "";
        const name = fileName.replace(/\.sas$/i, "");
        if (!name)
          return null;
        const fileOffset = normalised.lastIndexOf("/") + 1;
        const column = offset + prefix.length + tag.length + gap.length + fileOffset + 1;
        return { name, payload, column };
      };
      var readSectionList = (lines, sectionIndex, limit) => {
        const entries = [];
        const malformed = [];
        let end = sectionIndex + 1;
        let index = sectionIndex + 1;
        while (index < limit && index < lines.length) {
          const line = lines[index];
          if (line.trim() === "") {
            let next = index;
            while (next < limit && next < lines.length && lines[next].trim() === "") {
              next++;
            }
            const tag = next < limit && next < lines.length ? getLineTag(lines[next]) : null;
            if (tag && entryTags.has(tag)) {
              index = next;
              continue;
            }
            break;
          }
          const parsed = parseListItem(line);
          if (!parsed) {
            const tag = getLineTag(line);
            if (!tag || !entryTags.has(tag))
              break;
            malformed.push(index);
            index++;
            continue;
          }
          entries.push({
            name: parsed.name,
            payload: parsed.payload,
            lineNumber: index + 1,
            column: parsed.column
          });
          index++;
          end = index;
        }
        return { entries, end, malformed };
      };
      var getHeaderMacros = (text, config) => {
        if (!text)
          return [];
        const cfg = config || new types_1.LintConfig();
        const headerLinesCount = (0, getHeaderLinesCount_1.getHeaderLinesCount)(text, cfg);
        if (!headerLinesCount)
          return [];
        const lines = (0, splitText_1.splitText)(text, cfg);
        const macros = [];
        for (let index = 0; index < headerLinesCount && index < lines.length; index++) {
          const line = lines[index];
          if (!sasMacrosHeader.test(line))
            continue;
          const tagEnd = line.indexOf(headerTag) + headerTag.length;
          const trailing = parseListItem(line.slice(tagEnd), tagEnd);
          if (trailing) {
            macros.push({
              name: trailing.name,
              lineNumber: index + 1,
              startColumnNumber: trailing.column,
              endColumnNumber: trailing.column + trailing.name.length
            });
          }
          readSectionList(lines, index, headerLinesCount).entries.forEach((entry) => {
            macros.push({
              name: entry.name,
              lineNumber: entry.lineNumber,
              startColumnNumber: entry.column,
              endColumnNumber: entry.column + entry.name.length
            });
          });
        }
        return macros;
      };
      exports.getHeaderMacros = getHeaderMacros;
      var getHeaderIndent = (lines, headerLinesCount) => {
        for (let index = 1; index < headerLinesCount && index < lines.length; index++) {
          const match = /^(\s+)\S/.exec(lines[index]);
          if (match)
            return match[1];
        }
        return "  ";
      };
      var withSectionSpacing = (lines, sectionIndex, listEnd) => {
        const result = [...lines];
        if (listEnd < result.length && result[listEnd].trim() !== "") {
          result.splice(listEnd, 0, "");
        }
        if (sectionIndex > 0 && result[sectionIndex - 1].trim() !== "") {
          result.splice(sectionIndex, 0, "");
        }
        return result;
      };
      var findSasMacrosSection = (lines, headerLinesCount) => {
        let sectionIndex = -1;
        for (let index = 0; index < headerLinesCount && index < lines.length; index++) {
          if (sasMacrosHeader.test(lines[index])) {
            sectionIndex = index;
            break;
          }
        }
        if (sectionIndex === -1)
          return null;
        if (sectionIndex === headerLinesCount - 1)
          return null;
        const tagEnd = lines[sectionIndex].indexOf(headerTag) + headerTag.length;
        if (parseListItem(lines[sectionIndex].slice(tagEnd)))
          return null;
        const { entries, end, malformed } = readSectionList(lines, sectionIndex, headerLinesCount);
        if (malformed.length)
          return null;
        return { sectionIndex, entries, end };
      };
      var formatEntry = (entry, indent) => `${indent}@li ${entry.payload}`;
      var addMacrosToHeader = (text, config, macros) => {
        if (!text || !macros.length)
          return text;
        const headerLinesCount = (0, getHeaderLinesCount_1.getHeaderLinesCount)(text, config);
        if (!headerLinesCount)
          return text;
        const lines = (0, splitText_1.splitText)(text, config);
        const lineEnding = config.lineEndings === LineEndings_1.LineEndings.CRLF ? "\r\n" : "\n";
        const headerEndIndex = headerLinesCount - 1;
        const section = findSasMacrosSection(lines, headerLinesCount);
        if (!section) {
          const hasSection = lines.slice(0, headerLinesCount).some((line) => sasMacrosHeader.test(line));
          if (hasSection || headerEndIndex === 0)
            return text;
          const indent2 = getHeaderIndent(lines, headerLinesCount);
          const sectionLines = [
            `${indent2}<h4> SAS Macros </h4>`,
            ...macros.map((macro) => `${indent2}@li ${macro}.sas`)
          ];
          const result2 = [
            ...lines.slice(0, headerEndIndex),
            ...sectionLines,
            ...lines.slice(headerEndIndex)
          ];
          return withSectionSpacing(result2, headerEndIndex, headerEndIndex + sectionLines.length).join(lineEnding);
        }
        const { sectionIndex, entries, end } = section;
        const indent = lines[sectionIndex].match(/^\s*/)[0];
        const byName = /* @__PURE__ */ new Map();
        entries.forEach((entry) => {
          const key = entry.name.toLowerCase();
          if (!byName.has(key))
            byName.set(key, { name: entry.name, payload: entry.payload });
        });
        macros.forEach((macro) => {
          const key = macro.toLowerCase();
          if (byName.has(key))
            return;
          byName.set(key, { name: macro, payload: `${macro}.sas` });
        });
        const sortedLines = [...byName.values()].sort((a, b) => compareMacroNames(a.name, b.name)).map((entry) => `${indent}@li ${entry.payload}`);
        const result = [
          ...lines.slice(0, sectionIndex + 1),
          ...sortedLines,
          ...lines.slice(end)
        ];
        return withSectionSpacing(result, sectionIndex, sectionIndex + 1 + sortedLines.length).join(lineEnding);
      };
      exports.addMacrosToHeader = addMacrosToHeader;
      var repairHeaderList = (text, config) => {
        if (!text)
          return text;
        const headerLinesCount = (0, getHeaderLinesCount_1.getHeaderLinesCount)(text, config);
        if (!headerLinesCount)
          return text;
        const lines = (0, splitText_1.splitText)(text, config);
        const section = findSasMacrosSection(lines, headerLinesCount);
        if (!section)
          return text;
        const { sectionIndex, entries } = section;
        const indent = lines[sectionIndex].match(/^\s*/)[0];
        const lineEnding = config.lineEndings === LineEndings_1.LineEndings.CRLF ? "\r\n" : "\n";
        const repaired = [...lines];
        let changed = false;
        entries.forEach((entry) => {
          const index = entry.lineNumber - 1;
          const formatted = formatEntry(entry, indent);
          if (lines[index] === formatted)
            return;
          repaired[index] = formatted;
          changed = true;
        });
        return changed ? repaired.join(lineEnding) : text;
      };
      exports.repairHeaderList = repairHeaderList;
      var removeMacrosFromHeader = (text, config, macros) => {
        if (!text || !macros.length)
          return text;
        const headerLinesCount = (0, getHeaderLinesCount_1.getHeaderLinesCount)(text, config);
        if (!headerLinesCount)
          return text;
        const lines = (0, splitText_1.splitText)(text, config);
        const lineEnding = config.lineEndings === LineEndings_1.LineEndings.CRLF ? "\r\n" : "\n";
        const section = findSasMacrosSection(lines, headerLinesCount);
        if (!section)
          return text;
        const { sectionIndex, entries, end } = section;
        const indent = lines[sectionIndex].match(/^\s*/)[0];
        const remove = new Set(macros.map((macro) => macro.toLowerCase()));
        const kept = [];
        const seen = /* @__PURE__ */ new Set();
        let changed = false;
        entries.forEach((entry) => {
          const key = entry.name.toLowerCase();
          if (remove.has(key)) {
            changed = true;
            return;
          }
          if (seen.has(key)) {
            changed = true;
            return;
          }
          seen.add(key);
          kept.push(formatEntry(entry, indent));
        });
        if (!changed)
          return text;
        const result = [
          ...lines.slice(0, sectionIndex + 1),
          ...kept,
          ...lines.slice(end)
        ];
        return withSectionSpacing(result, sectionIndex, sectionIndex + 1 + kept.length).join(lineEnding);
      };
      exports.removeMacrosFromHeader = removeMacrosFromHeader;
      var compareMacroNames = (a, b) => a.toLowerCase().localeCompare(b.toLowerCase());
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/isDoxygenHeader.js
  var require_isDoxygenHeader = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/isDoxygenHeader.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.isDoxygenHeader = void 0;
      var doxygenHeaderClose = "**/";
      var isDoxygenHeader = (text) => {
        if (!text)
          return false;
        const lines = text.split(/\r\n|\n/);
        let first = -1;
        for (let index = 0; index < lines.length; index++) {
          if (lines[index].trim() !== "") {
            first = index;
            break;
          }
        }
        if (first === -1)
          return false;
        const opener = lines[first].trimStart();
        if (!opener.startsWith("/**"))
          return false;
        if (opener.includes("*/"))
          return false;
        for (let index = first + 1; index < lines.length; index++) {
          const line = lines[index];
          if (line.trim() === doxygenHeaderClose)
            return true;
          if (line.includes("*/"))
            return false;
        }
        return false;
      };
      exports.isDoxygenHeader = isDoxygenHeader;
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/file/noUndeclaredMacros.js
  var require_noUndeclaredMacros = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/file/noUndeclaredMacros.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.noUndeclaredMacros = void 0;
      var types_1 = require_types();
      var LintRuleType_1 = require_LintRuleType();
      var Severity_1 = require_Severity();
      var headerMacros_1 = require_headerMacros();
      var isDoxygenHeader_1 = require_isDoxygenHeader();
      var parseMacroCalls_1 = require_parseMacroCalls();
      var parseMacros_1 = require_parseMacros();
      var sasMacros_1 = require_sasMacros();
      var getSeverity_1 = require_getSeverity();
      var name = "noUndeclaredMacros";
      var description = "Enforce that every macro used in a file is declared.";
      var message = `Macro '{macro}' is not declared - add it to the <h4> SAS Macros </h4> section of the header, or list the macro in 'ignoredMacros'`;
      var getUndeclaredCalls = (value, config) => {
        if (!value)
          return [];
        if (!(0, isDoxygenHeader_1.isDoxygenHeader)(value))
          return [];
        const declared = /* @__PURE__ */ new Set();
        (0, parseMacros_1.parseMacros)(value, config).forEach((macro) => {
          if (macro.name)
            declared.add(macro.name.toLowerCase());
        });
        getTemplateDefinitions(value).forEach((macro) => {
          declared.add(macro.toLowerCase());
        });
        (0, headerMacros_1.getHeaderMacros)(value, config).forEach((macro) => {
          declared.add(macro.name.toLowerCase());
        });
        const ignored = new Set(config.ignoredMacros.map((macro) => macro.trim().toLowerCase()));
        const undeclared = [];
        const seen = /* @__PURE__ */ new Set();
        (0, parseMacroCalls_1.parseMacroCalls)(value, config).forEach((call) => {
          var _a;
          const key = call.name.toLowerCase();
          if (seen.has(key))
            return;
          seen.add(key);
          if (call.name.length < ((_a = config.minMacroNameLength) !== null && _a !== void 0 ? _a : 3))
            return;
          if (call.quoted && !call.hasParen)
            return;
          if ((0, sasMacros_1.isSasMacro)(call.name))
            return;
          if (ignored.has(key))
            return;
          if (declared.has(key))
            return;
          undeclared.push(call);
        });
        return undeclared;
      };
      var getTemplateDefinitions = (value) => [
        ...value.matchAll(/(?:^|['";\n])[ \t]*%macro\s+([a-z_][a-z0-9_]*)\s*[;(/]/gi)
      ].map((match) => match[1]);
      var test = (value, config) => {
        const cfg = config || new types_1.LintConfig();
        const severity = (0, getSeverity_1.getSeverity)(cfg, name, Severity_1.Severity.Warning);
        return getUndeclaredCalls(value, cfg).map((call) => ({
          message: message.replace("{macro}", call.name),
          lineNumber: call.lineNumber,
          startColumnNumber: call.startColumnNumber,
          endColumnNumber: call.endColumnNumber,
          severity
        }));
      };
      var fix = (value, config) => {
        const cfg = config || new types_1.LintConfig();
        const macros = getUndeclaredCalls(value, cfg).map((call) => call.name);
        if (!macros.length)
          return value;
        return (0, headerMacros_1.addMacrosToHeader)(value, cfg, macros);
      };
      exports.noUndeclaredMacros = {
        type: LintRuleType_1.LintRuleType.File,
        name,
        description,
        message,
        test,
        fix
      };
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/file/noUnusedMacros.js
  var require_noUnusedMacros = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/file/noUnusedMacros.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.noUnusedMacros = void 0;
      var types_1 = require_types();
      var LintRuleType_1 = require_LintRuleType();
      var Severity_1 = require_Severity();
      var headerMacros_1 = require_headerMacros();
      var parseMacroCalls_1 = require_parseMacroCalls();
      var getSeverity_1 = require_getSeverity();
      var name = "noUnusedMacros";
      var description = "Report macros declared in the <h4> SAS Macros </h4> section that the file does not use.";
      var message = `Macro '{macro}' is declared in the <h4> SAS Macros </h4> section but not used in the file`;
      var getUnusedMacros = (value, config) => {
        if (!value)
          return [];
        const used = new Set((0, parseMacroCalls_1.parseMacroCalls)(value, config, { includeMasked: true }).map((call) => call.name.toLowerCase()));
        const unused = [];
        const reported = /* @__PURE__ */ new Set();
        (0, headerMacros_1.getHeaderMacros)(value, config).forEach((macro) => {
          const key = macro.name.toLowerCase();
          if (reported.has(key))
            return;
          reported.add(key);
          if (used.has(key))
            return;
          unused.push(macro);
        });
        return unused;
      };
      var test = (value, config) => {
        const cfg = config || new types_1.LintConfig();
        const severity = (0, getSeverity_1.getSeverity)(cfg, name, Severity_1.Severity.Warning);
        return getUnusedMacros(value, cfg).map((macro) => ({
          message: message.replace("{macro}", macro.name),
          lineNumber: macro.lineNumber,
          startColumnNumber: macro.startColumnNumber,
          endColumnNumber: macro.endColumnNumber,
          severity
        }));
      };
      var fix = (value, config) => {
        const cfg = config || new types_1.LintConfig();
        const macros = getUnusedMacros(value, cfg).map((macro) => macro.name);
        const removed = macros.length ? (0, headerMacros_1.removeMacrosFromHeader)(value, cfg, macros) : value;
        return (0, headerMacros_1.repairHeaderList)(removed, cfg);
      };
      exports.noUnusedMacros = {
        type: LintRuleType_1.LintRuleType.File,
        name,
        description,
        message,
        test,
        fix
      };
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/parseLibnames.js
  var require_parseLibnames = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/parseLibnames.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.getUnusedLibnames = exports.parseLibnames = void 0;
      var libnameStatement = /(?:^|;)\s*libname\s+([a-z_][a-z0-9_]*)([^;]*)/gi;
      var nonAssigningOption = /^\s*(clear|list)\b/i;
      var allLibrefs = /^_all_$/i;
      var blankNonCode = (text) => {
        const chars = text.split("");
        const length = text.length;
        let index = 0;
        let atStatementStart = true;
        const blank = (from, to) => {
          for (let at = from; at < to && at < length; at++) {
            if (chars[at] !== "\n")
              chars[at] = " ";
          }
        };
        while (index < length) {
          const char = text[index];
          if (char === "\n") {
            index++;
            continue;
          }
          if (char === "'") {
            let end = index + 1;
            while (end < length) {
              if (text[end] === "'") {
                if (text[end + 1] === "'") {
                  end += 2;
                  continue;
                }
                end++;
                break;
              }
              if (text[end] === "\n")
                break;
              end++;
            }
            blank(index, end);
            index = end;
            continue;
          }
          if (char === '"') {
            let end = index + 1;
            while (end < length) {
              if (text[end] === '"') {
                if (text[end + 1] === '"') {
                  end += 2;
                  continue;
                }
                end++;
                break;
              }
              if (text[end] === "\n")
                break;
              end++;
            }
            for (let at = index; at < end; at++) {
              if (chars[at] === ";")
                chars[at] = " ";
            }
            index = end;
            continue;
          }
          if (char === "/" && text[index + 1] === "*") {
            const close = text.indexOf("*/", index + 2);
            const end = close === -1 ? length : close + 2;
            blank(index, end);
            index = end;
            continue;
          }
          if (char === "%" && text[index + 1] === "*") {
            const close = text.indexOf(";", index + 2);
            const end = close === -1 ? length : close + 1;
            blank(index, end);
            index = end;
            continue;
          }
          if (char === ";") {
            atStatementStart = true;
            index++;
            continue;
          }
          if (/\s/.test(char)) {
            index++;
            continue;
          }
          if (atStatementStart && char === "*") {
            const close = text.indexOf(";", index + 1);
            const end = close === -1 ? length : close + 1;
            blank(index, end);
            index = end;
            continue;
          }
          atStatementStart = false;
          index++;
        }
        return chars.join("");
      };
      var blankSpans = (code, spans) => {
        const chars = code.split("");
        spans.forEach(({ start, end }) => {
          for (let at = start; at < end && at < chars.length; at++) {
            if (chars[at] !== "\n")
              chars[at] = " ";
          }
        });
        return chars.join("");
      };
      var lineStarts = (text) => {
        const starts = [0];
        for (let index = 0; index < text.length; index++) {
          if (text[index] === "\n")
            starts.push(index + 1);
        }
        return starts;
      };
      var positionOf = (starts, offset) => {
        let line = 0;
        while (line + 1 < starts.length && starts[line + 1] <= offset)
          line++;
        return { lineNumber: line + 1, columnNumber: offset - starts[line] + 1 };
      };
      var isMentioned = (code, libref) => new RegExp(`(^|[^a-z0-9_])${libref}([^a-z0-9_]|$)`, "i").test(code);
      var findAssignments = (text, code) => {
        const assignments = [];
        const spans = [];
        const starts = lineStarts(text);
        const reported = /* @__PURE__ */ new Set();
        let match;
        libnameStatement.lastIndex = 0;
        while ((match = libnameStatement.exec(code)) !== null) {
          const libref = match[1];
          const options = match[2];
          if (allLibrefs.test(libref))
            continue;
          if (!options.trim() || nonAssigningOption.test(options))
            continue;
          const close = code.indexOf(";", match.index + match[0].length);
          const end = close === -1 ? code.length : close + 1;
          spans.push({ start: match.index, end });
          const key = libref.toLowerCase();
          if (reported.has(key))
            continue;
          reported.add(key);
          const offset = match.index + match[0].length - options.length - libref.length;
          const { lineNumber, columnNumber } = positionOf(starts, offset);
          assignments.push({
            libref,
            lineNumber,
            startColumnNumber: columnNumber,
            endColumnNumber: columnNumber + libref.length
          });
        }
        return { assignments, spans };
      };
      var parseLibnames = (text, config) => {
        if (!text)
          return [];
        return findAssignments(text, blankNonCode(text)).assignments;
      };
      exports.parseLibnames = parseLibnames;
      var getUnusedLibnames = (text, config) => {
        if (!text)
          return [];
        const code = blankNonCode(text);
        const { assignments, spans } = findAssignments(text, code);
        if (!assignments.length)
          return [];
        const withoutAssignments = blankSpans(code, spans);
        return assignments.filter(({ libref }) => !isMentioned(withoutAssignments, libref));
      };
      exports.getUnusedLibnames = getUnusedLibnames;
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/file/noUnusedLibnames.js
  var require_noUnusedLibnames = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/file/noUnusedLibnames.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.noUnusedLibnames = void 0;
      var types_1 = require_types();
      var LintRuleType_1 = require_LintRuleType();
      var Severity_1 = require_Severity();
      var parseLibnames_1 = require_parseLibnames();
      var getSeverity_1 = require_getSeverity();
      var name = "noUnusedLibnames";
      var description = "Report librefs that a file assigns and never uses in that file.";
      var message = `Libref '{libref}' is assigned but never used in this file - remove the LIBNAME statement, or list the libref in 'ignoredLibnames'`;
      var getUnused = (value, config) => {
        if (!value)
          return [];
        const ignored = new Set(config.ignoredLibnames.map((libref) => libref.toLowerCase()));
        return (0, parseLibnames_1.getUnusedLibnames)(value, config).filter(({ libref }) => !ignored.has(libref.toLowerCase()));
      };
      var test = (value, config) => {
        const cfg = config || new types_1.LintConfig();
        const severity = (0, getSeverity_1.getSeverity)(cfg, name, Severity_1.Severity.Warning);
        return getUnused(value, cfg).map((assignment) => ({
          message: message.replace("{libref}", assignment.libref),
          lineNumber: assignment.lineNumber,
          startColumnNumber: assignment.startColumnNumber,
          endColumnNumber: assignment.endColumnNumber,
          severity
        }));
      };
      exports.noUnusedLibnames = {
        type: LintRuleType_1.LintRuleType.File,
        name,
        description,
        message,
        test
      };
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/file/strictMacroDefinition.js
  var require_strictMacroDefinition = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/file/strictMacroDefinition.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.strictMacroDefinition = void 0;
      var types_1 = require_types();
      var LintRuleType_1 = require_LintRuleType();
      var utils_1 = require_utils();
      var parseMacros_1 = require_parseMacros();
      var getSeverity_1 = require_getSeverity();
      var name = "strictMacroDefinition";
      var description = "Enforce strictly rules of macro definition syntax.";
      var message = "Incorrent Macro Definition Syntax";
      var validOptions = [
        "CMD",
        "DES",
        "MINDELIMITER",
        "MINOPERATOR",
        "NOMINOPERATOR",
        "PARMBUFF",
        "SECURE",
        "NOSECURE",
        "STMT",
        "SOURCE",
        "SRC",
        "STORE"
      ];
      var parseParamList = (declaration) => {
        const open = declaration.indexOf("(");
        if (open === -1)
          return { list: null, params: [], listEnd: -1 };
        const params = [];
        let current = "";
        let quote = "";
        let depth = 0;
        for (let index = open + 1; index < declaration.length; index++) {
          const character = declaration[index];
          if (quote) {
            current += character;
            if (character === quote)
              quote = "";
            continue;
          }
          if (character === "'" || character === '"') {
            quote = character;
            current += character;
            continue;
          }
          if (character === "(")
            depth++;
          if (character === ")") {
            if (depth === 0) {
              params.push(current);
              return {
                list: declaration.slice(open + 1, index),
                params,
                listEnd: index
              };
            }
            depth--;
          }
          if (character === "," && depth === 0) {
            params.push(current);
            current = "";
            continue;
          }
          current += character;
        }
        return { list: null, params: [], listEnd: -1 };
      };
      var processParams = (content, macro, diagnostics, config) => {
        const declaration = macro.declaration;
        const severity = (0, getSeverity_1.getSeverity)(config, name, types_1.Severity.Warning);
        const { list: paramList, params: rawParams, listEnd } = parseParamList(declaration);
        const params = rawParams.map((param) => param.trim());
        params.forEach((param) => {
          const trimedParam = param.split("=")[0].trim();
          let paramLineNumber = 1, paramStartIndex = 1, paramEndIndex = content.length;
          if (macro.declarationLines.findIndex((dl) => dl.indexOf(trimedParam) !== -1) === -1) {
            const comment = "/\\*(.*?)\\*/";
            for (let i = 1; i < trimedParam.length; i++) {
              const paramWithComment = (0, utils_1.escapeRegExp)(trimedParam.slice(0, i)) + comment + (0, utils_1.escapeRegExp)(trimedParam.slice(i));
              const regEx = new RegExp(paramWithComment);
              const declarationLineIndex = macro.declarationLines.findIndex((dl) => !!regEx.exec(dl));
              if (declarationLineIndex !== -1) {
                const declarationLine = macro.declarationLines[declarationLineIndex];
                const partFound = regEx.exec(declarationLine)[0];
                paramLineNumber = macro.startLineNumbers[declarationLineIndex];
                paramStartIndex = declarationLine.indexOf(partFound);
                paramEndIndex = declarationLine.indexOf(partFound) + partFound.length;
                break;
              }
            }
          } else {
            const declarationLineIndex = macro.declarationLines.findIndex((dl) => dl.indexOf(trimedParam) !== -1);
            const declarationLine = macro.declarationLines[declarationLineIndex];
            paramLineNumber = macro.startLineNumbers[declarationLineIndex];
            paramStartIndex = declarationLine.indexOf(trimedParam);
            paramEndIndex = declarationLine.indexOf(trimedParam) + trimedParam.length;
          }
          if (trimedParam.includes(" ")) {
            diagnostics.push({
              message: `Param '${trimedParam}' cannot have space`,
              lineNumber: paramLineNumber,
              startColumnNumber: paramStartIndex + 1,
              endColumnNumber: paramEndIndex,
              severity
            });
          }
        });
        if (paramList === null)
          return declaration;
        return declaration.slice(listEnd + 1);
      };
      var processOptions = (_declaration, macro, diagnostics, config) => {
        var _a, _b, _c;
        let optionsPresent = (_b = (_a = _declaration.split("/")) === null || _a === void 0 ? void 0 : _a[1]) === null || _b === void 0 ? void 0 : _b.trim();
        const severity = (0, getSeverity_1.getSeverity)(config, name, types_1.Severity.Warning);
        if (optionsPresent) {
          const regex = new RegExp(/=\s*(['"])([\s\S]*?)\1/, "g");
          let result = regex.exec(optionsPresent);
          while (result) {
            optionsPresent = optionsPresent.slice(0, result.index) + optionsPresent.slice(result.index + result[0].length);
            result = regex.exec(optionsPresent);
          }
          (_c = optionsPresent.split(" ")) === null || _c === void 0 ? void 0 : _c.filter((o) => !!o).forEach((option) => {
            const trimmedOption = option.trim();
            if (!validOptions.includes(trimmedOption.toUpperCase())) {
              const declarationLineIndex = macro.declarationLines.findIndex((dl) => dl.indexOf(trimmedOption) !== -1);
              const declarationLine = macro.declarationLines[declarationLineIndex];
              diagnostics.push({
                message: `Option '${trimmedOption}' is not valid`,
                lineNumber: macro.startLineNumbers[declarationLineIndex],
                startColumnNumber: declarationLine.indexOf(trimmedOption) + 1,
                endColumnNumber: declarationLine.indexOf(trimmedOption) + trimmedOption.length,
                severity
              });
            }
          });
        }
      };
      var test = (value, config) => {
        const diagnostics = [];
        const macros = (0, parseMacros_1.parseMacros)(value, config);
        macros.forEach((macro) => {
          const _declaration = processParams(value, macro, diagnostics, config);
          processOptions(_declaration, macro, diagnostics, config);
        });
        return diagnostics;
      };
      exports.strictMacroDefinition = {
        type: LintRuleType_1.LintRuleType.File,
        name,
        description,
        message,
        test
      };
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/file/hasRequiredMacroOptions.js
  var require_hasRequiredMacroOptions = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/file/hasRequiredMacroOptions.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.hasRequiredMacroOptions = void 0;
      var types_1 = require_types();
      var LintRuleType_1 = require_LintRuleType();
      var parseMacros_1 = require_parseMacros();
      var getSeverity_1 = require_getSeverity();
      var name = "hasRequiredMacroOptions";
      var description = "Enforce required macro options";
      var message = "Macro defined without required options";
      var processOptions = (macro, diagnostics, config) => {
        var _a, _b, _c;
        const optionsPresent = (_c = (_b = (_a = macro.declaration.split("/")) === null || _a === void 0 ? void 0 : _a[1]) === null || _b === void 0 ? void 0 : _b.trim()) !== null && _c !== void 0 ? _c : "";
        const severity = (0, getSeverity_1.getSeverity)(config, name, types_1.Severity.Warning);
        config === null || config === void 0 ? void 0 : config.requiredMacroOptions.forEach((option) => {
          if (!optionsPresent.includes(option)) {
            diagnostics.push({
              message: `Macro '${macro.name}' does not contain the required option '${option}'`,
              lineNumber: macro.startLineNumbers[0],
              startColumnNumber: 0,
              endColumnNumber: 0,
              severity
            });
          }
        });
      };
      var test = (value, config) => {
        const diagnostics = [];
        const macros = (0, parseMacros_1.parseMacros)(value, config);
        macros.forEach((macro) => {
          processOptions(macro, diagnostics, config);
        });
        return diagnostics;
      };
      exports.hasRequiredMacroOptions = {
        type: LintRuleType_1.LintRuleType.File,
        name,
        description,
        message,
        test
      };
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/file/noSingleAsteriskComments.js
  var require_noSingleAsteriskComments = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/file/noSingleAsteriskComments.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.noSingleAsteriskComments = void 0;
      var LintRuleType_1 = require_LintRuleType();
      var Severity_1 = require_Severity();
      var getSeverity_1 = require_getSeverity();
      var name = "noSingleAsteriskComments";
      var description = "Disallow comment statements that begin with a single asterisk (*).";
      var message = "Line contains a single asterisk comment";
      var dataSectionStart = /^(datalines4?|cards4?|parmcards4?)\s*;/i;
      var maskingFunctionStart = /^%(nrstr|str)\s*\(/i;
      var embeddedLanguageProc = /^proc\s+(lua|groovy)\b/i;
      var embeddedLanguageEnd = /^endsubmit\s*;/i;
      var embeddedLanguageEndSearch = /endsubmit/i;
      var test = (value, config) => {
        const severity = (0, getSeverity_1.getSeverity)(config, name, Severity_1.Severity.Warning);
        const diagnostics = [];
        const length = value.length;
        let index = 0;
        let lineNumber = 1;
        let columnNumber = 1;
        let atStatementStart = true;
        let embeddedProc = false;
        const advanceTo = (target) => {
          const limit = Math.min(target, length);
          while (index < limit) {
            if (value[index] === "\n") {
              lineNumber++;
              columnNumber = 1;
            } else {
              columnNumber++;
            }
            index++;
          }
        };
        while (index < length) {
          const char = value[index];
          if (char === "\n") {
            lineNumber++;
            columnNumber = 1;
            index++;
            continue;
          }
          if (char === "\r" || char === " " || char === "	") {
            columnNumber++;
            index++;
            continue;
          }
          if (char === ";") {
            atStatementStart = true;
            columnNumber++;
            index++;
            continue;
          }
          if (char === "/" && value[index + 1] === "*") {
            let end = index + 2;
            while (end < length && !(value[end] === "*" && value[end + 1] === "/")) {
              end++;
            }
            advanceTo(Math.min(end + 2, length));
            continue;
          }
          if (char === "%" && value[index + 1] === "*") {
            let end = index + 2;
            while (end < length && value[end] !== ";")
              end++;
            advanceTo(Math.min(end + 1, length));
            continue;
          }
          const maskingFunction = maskingFunctionStart.exec(value.slice(index));
          if (maskingFunction) {
            let depth = 0;
            let end = index + maskingFunction[0].length - 1;
            while (end < length) {
              if (value[end] === "%" && (value[end + 1] === "(" || value[end + 1] === ")")) {
                end += 2;
                continue;
              }
              if (value[end] === "(")
                depth++;
              else if (value[end] === ")") {
                depth--;
                if (depth === 0) {
                  end++;
                  break;
                }
              }
              end++;
            }
            advanceTo(end);
            continue;
          }
          if (char === "'" || char === '"') {
            let end = index + 1;
            while (end < length) {
              if (value[end] === char) {
                if (value[end + 1] === char) {
                  end += 2;
                  continue;
                }
                end++;
                break;
              }
              if (value[end] === "\n")
                break;
              end++;
            }
            advanceTo(end);
            continue;
          }
          if (atStatementStart) {
            if (embeddedProc) {
              const endSubmit = embeddedLanguageEnd.exec(value.slice(index));
              if (endSubmit) {
                embeddedProc = false;
                advanceTo(index + endSubmit[0].length);
                atStatementStart = true;
                continue;
              }
              advanceTo(index + value.slice(index).search(embeddedLanguageEndSearch));
              atStatementStart = true;
              continue;
            }
            const embeddedProcStart = embeddedLanguageProc.exec(value.slice(index));
            if (embeddedProcStart && embeddedLanguageEndSearch.test(value.slice(index))) {
              embeddedProc = true;
              advanceTo(index + embeddedProcStart[0].length);
              atStatementStart = false;
              continue;
            }
            const dataSection = dataSectionStart.exec(value.slice(index));
            if (dataSection) {
              const terminator = /4/.test(dataSection[1]) ? ";;;;" : ";";
              let lineStart = index + dataSection[0].length;
              let end = length;
              while (lineStart <= length) {
                const lineEnd = value.indexOf("\n", lineStart);
                const actualEnd = lineEnd === -1 ? length : lineEnd;
                if (value.slice(lineStart, actualEnd).trim() === terminator) {
                  end = actualEnd;
                  break;
                }
                if (lineEnd === -1)
                  break;
                lineStart = lineEnd + 1;
              }
              advanceTo(end);
              atStatementStart = true;
              continue;
            }
            if (char === "*") {
              diagnostics.push({
                message,
                lineNumber,
                startColumnNumber: columnNumber,
                endColumnNumber: columnNumber,
                severity
              });
              let end = index + 1;
              while (end < length && value[end] !== ";")
                end++;
              advanceTo(end + 1);
              atStatementStart = true;
              continue;
            }
          }
          atStatementStart = false;
          columnNumber++;
          index++;
        }
        return diagnostics;
      };
      exports.noSingleAsteriskComments = {
        type: LintRuleType_1.LintRuleType.File,
        name,
        description,
        message,
        test
      };
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/file/lowerCaseMacroNames.js
  var require_lowerCaseMacroNames = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/file/lowerCaseMacroNames.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.lowerCaseMacroNames = void 0;
      var types_1 = require_types();
      var LintRuleType_1 = require_LintRuleType();
      var Severity_1 = require_Severity();
      var LineEndings_1 = require_LineEndings();
      var headerMacros_1 = require_headerMacros();
      var parseMacros_1 = require_parseMacros();
      var splitText_1 = require_splitText();
      var getSeverity_1 = require_getSeverity();
      var name = "lowerCaseMacroNames";
      var description = "Enforce lower case macro names, in the <h4> SAS Macros </h4> header and in the %macro definition.";
      var message = `Macro name '{macro}' contains uppercase characters`;
      var headerMessage = (macro) => `Macro '${macro}.sas' is declared with uppercase characters in the <h4> SAS Macros </h4> header - the declaration and the file name have to match, and only a lower case pair resolves on a case-sensitive filesystem`;
      var definitionMessage = (macro) => `Macro '${macro}' is defined with uppercase characters - rename it in the %macro statement`;
      var mendMessage = (macro) => `Macro '${macro}' is named with uppercase characters in the %mend statement`;
      var escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      var test = (value, config) => {
        if (!value)
          return [];
        const cfg = config || new types_1.LintConfig();
        const severity = (0, getSeverity_1.getSeverity)(cfg, name, Severity_1.Severity.Warning);
        const diagnostics = [];
        (0, headerMacros_1.getHeaderMacros)(value, cfg).forEach((macro) => {
          if (macro.name === macro.name.toLowerCase())
            return;
          diagnostics.push({
            message: headerMessage(macro.name),
            lineNumber: macro.lineNumber,
            startColumnNumber: macro.startColumnNumber,
            endColumnNumber: macro.endColumnNumber,
            severity
          });
        });
        const lines = (0, splitText_1.splitText)(value, cfg);
        (0, parseMacros_1.parseMacros)(value, cfg).forEach((macro) => {
          const definition = findName(lines[macro.startLineNumbers[0] - 1], "%macro");
          if (definition && definition.macro !== definition.macro.toLowerCase()) {
            diagnostics.push({
              message: definitionMessage(definition.macro),
              lineNumber: macro.startLineNumbers[0],
              startColumnNumber: definition.column,
              endColumnNumber: definition.column + definition.macro.length,
              severity
            });
          }
          if (macro.endLineNumber === null)
            return;
          const mend = findName(lines[macro.endLineNumber - 1], "%mend");
          if (mend && mend.macro !== mend.macro.toLowerCase()) {
            diagnostics.push({
              message: mendMessage(mend.macro),
              lineNumber: macro.endLineNumber,
              startColumnNumber: mend.column,
              endColumnNumber: mend.column + mend.macro.length,
              severity
            });
          }
        });
        return diagnostics;
      };
      var fix = (value, config) => {
        if (!value)
          return value;
        const cfg = config || new types_1.LintConfig();
        const lineEnding = cfg.lineEndings === LineEndings_1.LineEndings.CRLF ? "\r\n" : "\n";
        return lowerCaseDefinitions(lowerCaseHeaderEntries(value, cfg), cfg).join(lineEnding);
      };
      var lowerCaseHeaderEntries = (value, config) => {
        const lines = (0, splitText_1.splitText)(value, config);
        (0, headerMacros_1.getHeaderMacros)(value, config).forEach((macro) => {
          if (macro.name === macro.name.toLowerCase())
            return;
          const index = macro.lineNumber - 1;
          const line = lines[index];
          const start = macro.startColumnNumber - 1;
          const end = start + macro.name.length;
          lines[index] = line.slice(0, start) + line.slice(start, end).toLowerCase() + line.slice(end);
        });
        return lines;
      };
      var lowerCaseDefinitions = (lines, config) => {
        (0, parseMacros_1.parseMacros)(lines.join("\n"), config).forEach((macro) => {
          const definitionLine = macro.startLineNumbers[0];
          if (definitionLine)
            lowerCaseNameInLine(lines, definitionLine, "%macro");
          if (macro.endLineNumber)
            lowerCaseNameInLine(lines, macro.endLineNumber, "%mend");
        });
        return lines;
      };
      var lowerCaseNameInLine = (lines, lineNumber, tag) => {
        const index = lineNumber - 1;
        const line = lines[index];
        const found = findName(line, tag);
        if (!found || found.macro === found.macro.toLowerCase())
          return;
        const start = found.column - 1;
        lines[index] = line.slice(0, start) + line.slice(start, start + found.macro.length).toLowerCase() + line.slice(start + found.macro.length);
      };
      var findName = (line, tag) => {
        const match = new RegExp(`${escape(tag)}\\s+([\\w]+)`, "i").exec(line);
        if (!match)
          return null;
        const column = match.index + match[0].length - match[1].length + 1;
        return { macro: match[1], column };
      };
      exports.lowerCaseMacroNames = {
        type: LintRuleType_1.LintRuleType.File,
        name,
        description,
        message,
        test,
        fix
      };
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/file/index.js
  var require_file = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/file/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.lowerCaseMacroNames = exports.noSingleAsteriskComments = exports.hasRequiredMacroOptions = exports.strictMacroDefinition = exports.noUnusedLibnames = exports.noUnusedMacros = exports.noUndeclaredMacros = exports.noXcmd = exports.noNestedMacros = exports.noNestedCommentsInHeader = exports.noMalformedMacroCalls = exports.noMacroIfInOpenCode = exports.minMacroNameLength = exports.lineEndings = exports.hasMacroParentheses = exports.hasMacroNameInMend = exports.hasDoxygenHeader = void 0;
      var hasDoxygenHeader_1 = require_hasDoxygenHeader();
      Object.defineProperty(exports, "hasDoxygenHeader", { enumerable: true, get: function() {
        return hasDoxygenHeader_1.hasDoxygenHeader;
      } });
      var hasMacroNameInMend_1 = require_hasMacroNameInMend();
      Object.defineProperty(exports, "hasMacroNameInMend", { enumerable: true, get: function() {
        return hasMacroNameInMend_1.hasMacroNameInMend;
      } });
      var hasMacroParentheses_1 = require_hasMacroParentheses();
      Object.defineProperty(exports, "hasMacroParentheses", { enumerable: true, get: function() {
        return hasMacroParentheses_1.hasMacroParentheses;
      } });
      var lineEndings_1 = require_lineEndings();
      Object.defineProperty(exports, "lineEndings", { enumerable: true, get: function() {
        return lineEndings_1.lineEndings;
      } });
      var minMacroNameLength_1 = require_minMacroNameLength();
      Object.defineProperty(exports, "minMacroNameLength", { enumerable: true, get: function() {
        return minMacroNameLength_1.minMacroNameLength;
      } });
      var noMacroIfInOpenCode_1 = require_noMacroIfInOpenCode();
      Object.defineProperty(exports, "noMacroIfInOpenCode", { enumerable: true, get: function() {
        return noMacroIfInOpenCode_1.noMacroIfInOpenCode;
      } });
      var noMalformedMacroCalls_1 = require_noMalformedMacroCalls();
      Object.defineProperty(exports, "noMalformedMacroCalls", { enumerable: true, get: function() {
        return noMalformedMacroCalls_1.noMalformedMacroCalls;
      } });
      var noNestedCommentsInHeader_1 = require_noNestedCommentsInHeader();
      Object.defineProperty(exports, "noNestedCommentsInHeader", { enumerable: true, get: function() {
        return noNestedCommentsInHeader_1.noNestedCommentsInHeader;
      } });
      var noNestedMacros_1 = require_noNestedMacros();
      Object.defineProperty(exports, "noNestedMacros", { enumerable: true, get: function() {
        return noNestedMacros_1.noNestedMacros;
      } });
      var noXcmd_1 = require_noXcmd();
      Object.defineProperty(exports, "noXcmd", { enumerable: true, get: function() {
        return noXcmd_1.noXcmd;
      } });
      var noUndeclaredMacros_1 = require_noUndeclaredMacros();
      Object.defineProperty(exports, "noUndeclaredMacros", { enumerable: true, get: function() {
        return noUndeclaredMacros_1.noUndeclaredMacros;
      } });
      var noUnusedMacros_1 = require_noUnusedMacros();
      Object.defineProperty(exports, "noUnusedMacros", { enumerable: true, get: function() {
        return noUnusedMacros_1.noUnusedMacros;
      } });
      var noUnusedLibnames_1 = require_noUnusedLibnames();
      Object.defineProperty(exports, "noUnusedLibnames", { enumerable: true, get: function() {
        return noUnusedLibnames_1.noUnusedLibnames;
      } });
      var strictMacroDefinition_1 = require_strictMacroDefinition();
      Object.defineProperty(exports, "strictMacroDefinition", { enumerable: true, get: function() {
        return strictMacroDefinition_1.strictMacroDefinition;
      } });
      var hasRequiredMacroOptions_1 = require_hasRequiredMacroOptions();
      Object.defineProperty(exports, "hasRequiredMacroOptions", { enumerable: true, get: function() {
        return hasRequiredMacroOptions_1.hasRequiredMacroOptions;
      } });
      var noSingleAsteriskComments_1 = require_noSingleAsteriskComments();
      Object.defineProperty(exports, "noSingleAsteriskComments", { enumerable: true, get: function() {
        return noSingleAsteriskComments_1.noSingleAsteriskComments;
      } });
      var lowerCaseMacroNames_1 = require_lowerCaseMacroNames();
      Object.defineProperty(exports, "lowerCaseMacroNames", { enumerable: true, get: function() {
        return lowerCaseMacroNames_1.lowerCaseMacroNames;
      } });
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/line/noBannedStrings.js
  var require_noBannedStrings = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/line/noBannedStrings.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.noBannedStrings = void 0;
      var LintRuleType_1 = require_LintRuleType();
      var Severity_1 = require_Severity();
      var utils_1 = require_utils();
      var getSeverity_1 = require_getSeverity();
      var name = "noBannedStrings";
      var description = "Disallow configured strings, such as words that look like log messages";
      var message = "Line contains a banned string";
      var escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      var overrideLine = /^[^\w]*@sasjslint\s*\{/;
      var test = (value, lineNumber, config, options) => {
        const diagnostics = [];
        if (options === null || options === void 0 ? void 0 : options.isDataLine)
          return diagnostics;
        if (overrideLine.test(value))
          return diagnostics;
        const severity = (0, getSeverity_1.getSeverity)(config, name, Severity_1.Severity.Warning);
        const bannedStrings = (config === null || config === void 0 ? void 0 : config.bannedStrings) || utils_1.defaultBannedStrings;
        if (!bannedStrings.length)
          return diagnostics;
        const patterns = [...bannedStrings].sort((a, b) => b.length - a.length);
        const claimed = new Array(value.length).fill(false);
        for (const bannedString of patterns) {
          const regex = new RegExp(escapeRegExp(bannedString), "gi");
          let match;
          while (match = regex.exec(value)) {
            const start = match.index;
            const end = start + match[0].length;
            if (claimed.slice(start, end).some(Boolean))
              continue;
            for (let index = start; index < end; index++)
              claimed[index] = true;
            diagnostics.push({
              message: `${message}: "${match[0]}"`,
              lineNumber,
              startColumnNumber: start + 1,
              endColumnNumber: end,
              severity
            });
          }
        }
        return diagnostics.sort((a, b) => a.startColumnNumber - b.startColumnNumber);
      };
      exports.noBannedStrings = {
        type: LintRuleType_1.LintRuleType.Line,
        name,
        description,
        message,
        test
      };
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/line/noGremlins.js
  var require_noGremlins = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/line/noGremlins.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.charFromHex = exports.noGremlins = void 0;
      var LintRuleType_1 = require_LintRuleType();
      var Severity_1 = require_Severity();
      var utils_1 = require_utils();
      var getSeverity_1 = require_getSeverity();
      var name = "noGremlins";
      var description = "Disallow characters specified in gremlins array";
      var message = "Line contains a gremlin";
      var test = (value, lineNumber, config) => {
        const severity = (0, getSeverity_1.getSeverity)(config, name, Severity_1.Severity.Warning);
        const allowedGremlins = (config === null || config === void 0 ? void 0 : config.allowedGremlins) || [];
        const diagnostics = [];
        const gremlins = {};
        for (const [hexCode, gremlinConfig] of Object.entries(utils_1.gremlinCharacters)) {
          if (!allowedGremlins.includes(hexCode)) {
            gremlins[(0, exports.charFromHex)(hexCode)] = Object.assign({}, gremlinConfig, {
              hexCode
            });
          }
        }
        const regexpWithAllChars = new RegExp(Object.keys(gremlins).map((char) => `${char}+`).join("|"), "g");
        let match;
        while (match = regexpWithAllChars.exec(value)) {
          const matchedCharacter = match[0][0];
          const gremlin = gremlins[matchedCharacter];
          diagnostics.push({
            message: `${message}: ${gremlin.description}, hexCode(${gremlin.hexCode})`,
            lineNumber,
            startColumnNumber: match.index + 1,
            endColumnNumber: match.index + match[0].length,
            severity
          });
        }
        return diagnostics;
      };
      exports.noGremlins = {
        type: LintRuleType_1.LintRuleType.Line,
        name,
        description,
        message,
        test
      };
      var charFromHex = (hexCode) => String.fromCodePoint(parseInt(hexCode));
      exports.charFromHex = charFromHex;
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/line/indentationMultiple.js
  var require_indentationMultiple = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/line/indentationMultiple.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.indentationMultiple = void 0;
      var LintRuleType_1 = require_LintRuleType();
      var Severity_1 = require_Severity();
      var getSeverity_1 = require_getSeverity();
      var name = "indentationMultiple";
      var description = "Ensure indentation by a multiple of the configured number.";
      var message = "Line has incorrect indentation";
      var test = (value, lineNumber, config) => {
        if (!value.startsWith(" "))
          return [];
        const severity = (0, getSeverity_1.getSeverity)(config, name, Severity_1.Severity.Warning);
        const indentationMultiple = isNaN(config === null || config === void 0 ? void 0 : config.indentationMultiple) ? 2 : config.indentationMultiple;
        if (indentationMultiple === 0)
          return [];
        const numberOfSpaces = value.search(/\S|$/);
        if (numberOfSpaces % indentationMultiple === 0)
          return [];
        return [
          {
            message: `${message} - ${numberOfSpaces} ${numberOfSpaces === 1 ? "space" : "spaces"}`,
            lineNumber,
            startColumnNumber: 1,
            endColumnNumber: 1,
            severity
          }
        ];
      };
      exports.indentationMultiple = {
        type: LintRuleType_1.LintRuleType.Line,
        name,
        description,
        message,
        test
      };
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/line/maxLineLength.js
  var require_maxLineLength = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/line/maxLineLength.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.maxLineLength = void 0;
      var LintRuleType_1 = require_LintRuleType();
      var Severity_1 = require_Severity();
      var utils_1 = require_utils();
      var getSeverity_1 = require_getSeverity();
      var name = "maxLineLength";
      var description = "Restrict lines to the specified length.";
      var message = "Line exceeds maximum length";
      var test = (value, lineNumber, config, options) => {
        const severity = (0, getSeverity_1.getSeverity)(config, name, Severity_1.Severity.Warning);
        let maxLineLength = utils_1.DefaultLintConfiguration.maxLineLength;
        if (config) {
          if (options === null || options === void 0 ? void 0 : options.isHeaderLine) {
            maxLineLength = Math.max(config.maxLineLength, config.maxHeaderLineLength);
          } else if (options === null || options === void 0 ? void 0 : options.isDataLine) {
            maxLineLength = Math.max(config.maxLineLength, config.maxDataLineLength);
          } else {
            maxLineLength = config.maxLineLength;
          }
        }
        if (value.length <= maxLineLength)
          return [];
        return [
          {
            message: `${message} by ${value.length - maxLineLength} characters`,
            lineNumber,
            startColumnNumber: 1,
            endColumnNumber: 1,
            severity
          }
        ];
      };
      exports.maxLineLength = {
        type: LintRuleType_1.LintRuleType.Line,
        name,
        description,
        message,
        test
      };
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/line/noEncodedPasswords.js
  var require_noEncodedPasswords = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/line/noEncodedPasswords.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.noEncodedPasswords = void 0;
      var LintRuleType_1 = require_LintRuleType();
      var Severity_1 = require_Severity();
      var getSeverity_1 = require_getSeverity();
      var name = "noEncodedPasswords";
      var description = "Disallow encoded passwords in SAS code.";
      var message = "Line contains encoded password";
      var test = (value, lineNumber, config) => {
        const severity = (0, getSeverity_1.getSeverity)(config, name, Severity_1.Severity.Error);
        const regex = new RegExp(/{sas(\d{2,4}|enc)}[^;"'\s]*/, "gi");
        const matches = value.match(regex);
        if (!matches || !matches.length)
          return [];
        return matches.map((match) => ({
          message,
          lineNumber,
          startColumnNumber: value.indexOf(match) + 1,
          endColumnNumber: value.indexOf(match) + match.length,
          severity
        }));
      };
      exports.noEncodedPasswords = {
        type: LintRuleType_1.LintRuleType.Line,
        name,
        description,
        message,
        test
      };
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/line/noTabs.js
  var require_noTabs = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/line/noTabs.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.noTabs = void 0;
      var LintRuleType_1 = require_LintRuleType();
      var Severity_1 = require_Severity();
      var utils_1 = require_utils();
      var name = "noTabs";
      var alias = "noTabIndentation";
      var description = "Disallow indenting with tabs.";
      var message = "Line contains a tab character (09x)";
      var test = (value, lineNumber, config) => {
        var _a, _b, _c;
        const severity = (_c = (_b = (_a = config === null || config === void 0 ? void 0 : config.severityLevel[name]) !== null && _a !== void 0 ? _a : config === null || config === void 0 ? void 0 : config.severityLevel[alias]) !== null && _b !== void 0 ? _b : config === null || config === void 0 ? void 0 : config.defaultSeverity) !== null && _c !== void 0 ? _c : Severity_1.Severity.Warning;
        const indices = (0, utils_1.getIndicesOf)("	", value);
        return indices.map((index) => ({
          message,
          lineNumber,
          startColumnNumber: index + 1,
          endColumnNumber: index + 1,
          severity
        }));
      };
      exports.noTabs = {
        type: LintRuleType_1.LintRuleType.Line,
        name,
        description,
        message,
        test
      };
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/line/noTrailingSpaces.js
  var require_noTrailingSpaces = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/line/noTrailingSpaces.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.noTrailingSpaces = void 0;
      var LintRuleType_1 = require_LintRuleType();
      var Severity_1 = require_Severity();
      var getSeverity_1 = require_getSeverity();
      var name = "noTrailingSpaces";
      var description = "Disallow trailing spaces on lines.";
      var message = "Line contains trailing spaces";
      var test = (value, lineNumber, config) => {
        const severity = (0, getSeverity_1.getSeverity)(config, name, Severity_1.Severity.Warning);
        return value.trimEnd() === value ? [] : [
          {
            message,
            lineNumber,
            startColumnNumber: value.trimEnd().length + 1,
            endColumnNumber: value.length,
            severity
          }
        ];
      };
      var fix = (value) => value.trimEnd();
      exports.noTrailingSpaces = {
        type: LintRuleType_1.LintRuleType.Line,
        name,
        description,
        message,
        test,
        fix
      };
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/line/index.js
  var require_line = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/line/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.noTrailingSpaces = exports.noTabs = exports.noEncodedPasswords = exports.maxLineLength = exports.indentationMultiple = exports.noGremlins = exports.noBannedStrings = void 0;
      var noBannedStrings_1 = require_noBannedStrings();
      Object.defineProperty(exports, "noBannedStrings", { enumerable: true, get: function() {
        return noBannedStrings_1.noBannedStrings;
      } });
      var noGremlins_1 = require_noGremlins();
      Object.defineProperty(exports, "noGremlins", { enumerable: true, get: function() {
        return noGremlins_1.noGremlins;
      } });
      var indentationMultiple_1 = require_indentationMultiple();
      Object.defineProperty(exports, "indentationMultiple", { enumerable: true, get: function() {
        return indentationMultiple_1.indentationMultiple;
      } });
      var maxLineLength_1 = require_maxLineLength();
      Object.defineProperty(exports, "maxLineLength", { enumerable: true, get: function() {
        return maxLineLength_1.maxLineLength;
      } });
      var noEncodedPasswords_1 = require_noEncodedPasswords();
      Object.defineProperty(exports, "noEncodedPasswords", { enumerable: true, get: function() {
        return noEncodedPasswords_1.noEncodedPasswords;
      } });
      var noTabs_1 = require_noTabs();
      Object.defineProperty(exports, "noTabs", { enumerable: true, get: function() {
        return noTabs_1.noTabs;
      } });
      var noTrailingSpaces_1 = require_noTrailingSpaces();
      Object.defineProperty(exports, "noTrailingSpaces", { enumerable: true, get: function() {
        return noTrailingSpaces_1.noTrailingSpaces;
      } });
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/path/lowerCaseFileNames.js
  var require_lowerCaseFileNames = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/path/lowerCaseFileNames.js"(exports) {
      "use strict";
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.lowerCaseFileNames = void 0;
      var LintRuleType_1 = require_LintRuleType();
      var Severity_1 = require_Severity();
      var path_1 = __importDefault(require_path());
      var getSeverity_1 = require_getSeverity();
      var name = "lowerCaseFileNames";
      var description = "Enforce the use of lower case file names.";
      var message = "File name contains uppercase characters";
      var test = (value, config) => {
        const severity = (0, getSeverity_1.getSeverity)(config, name, Severity_1.Severity.Warning);
        const fileName = path_1.default.basename(value);
        if (fileName.toLocaleLowerCase() === fileName)
          return [];
        return [
          {
            message,
            lineNumber: 1,
            startColumnNumber: 1,
            endColumnNumber: 1,
            severity
          }
        ];
      };
      exports.lowerCaseFileNames = {
        type: LintRuleType_1.LintRuleType.Path,
        name,
        description,
        message,
        test
      };
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/path/noSpacesInFileNames.js
  var require_noSpacesInFileNames = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/path/noSpacesInFileNames.js"(exports) {
      "use strict";
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.noSpacesInFileNames = void 0;
      var LintRuleType_1 = require_LintRuleType();
      var Severity_1 = require_Severity();
      var path_1 = __importDefault(require_path());
      var getSeverity_1 = require_getSeverity();
      var name = "noSpacesInFileNames";
      var description = "Enforce the absence of spaces within file names.";
      var message = "File name contains spaces";
      var test = (value, config) => {
        const severity = (0, getSeverity_1.getSeverity)(config, name, Severity_1.Severity.Warning);
        const fileName = path_1.default.basename(value);
        if (fileName.includes(" ")) {
          return [
            {
              message,
              lineNumber: 1,
              startColumnNumber: 1,
              endColumnNumber: 1,
              severity
            }
          ];
        }
        return [];
      };
      exports.noSpacesInFileNames = {
        type: LintRuleType_1.LintRuleType.Path,
        name,
        description,
        message,
        test
      };
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/path/index.js
  var require_path2 = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/rules/path/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.noSpacesInFileNames = exports.lowerCaseFileNames = void 0;
      var lowerCaseFileNames_1 = require_lowerCaseFileNames();
      Object.defineProperty(exports, "lowerCaseFileNames", { enumerable: true, get: function() {
        return lowerCaseFileNames_1.lowerCaseFileNames;
      } });
      var noSpacesInFileNames_1 = require_noSpacesInFileNames();
      Object.defineProperty(exports, "noSpacesInFileNames", { enumerable: true, get: function() {
        return noSpacesInFileNames_1.noSpacesInFileNames;
      } });
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/mergeLintConfig.js
  var require_mergeLintConfig = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/mergeLintConfig.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.mergeLintConfig = void 0;
      var aliases = {
        noTabIndentation: "noTabs"
      };
      var normaliseAliases = (json) => {
        if (!isPlainObject(json))
          return json;
        const normalised = Object.assign({}, json);
        for (const [alias, canonical] of Object.entries(aliases)) {
          if (alias in normalised) {
            if (!(canonical in normalised)) {
              normalised[canonical] = normalised[alias];
            }
            delete normalised[alias];
          }
        }
        return normalised;
      };
      var mergeLintConfig = (base, override) => {
        const normalisedOverride = normaliseAliases(override);
        if (!isPlainObject(base) || !isPlainObject(normalisedOverride)) {
          return normalisedOverride;
        }
        const merged = normaliseAliases(base);
        for (const [key, value] of Object.entries(normalisedOverride)) {
          const current = merged[key];
          if (Array.isArray(current) && Array.isArray(value)) {
            merged[key] = mergeArrays(current, value);
          } else if (isPlainObject(current) && isPlainObject(value)) {
            merged[key] = Object.assign(Object.assign({}, current), value);
          } else {
            merged[key] = value;
          }
        }
        return merged;
      };
      exports.mergeLintConfig = mergeLintConfig;
      var isPlainObject = (value) => !!value && typeof value === "object" && !Array.isArray(value);
      var isPrimitiveArray = (value) => value.every((item) => item === null || typeof item !== "object");
      var mergeArrays = (base, override) => isPrimitiveArray(base) && isPrimitiveArray(override) ? [.../* @__PURE__ */ new Set([...base, ...override])] : [...base, ...override];
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/types/LintConfig.js
  var require_LintConfig = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/types/LintConfig.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.LintConfig = void 0;
      var file_1 = require_file();
      var line_1 = require_line();
      var path_1 = require_path2();
      var LineEndings_1 = require_LineEndings();
      var utils_1 = require_utils();
      var mergeLintConfig_1 = require_mergeLintConfig();
      var Severity_1 = require_Severity();
      var LintConfig = class _LintConfig {
        constructor(json) {
          this.ignoreList = [];
          this.allowedGremlins = [];
          this.lineLintRules = [];
          this.fileLintRules = [];
          this.pathLintRules = [];
          this.maxLineLength = 80;
          this.maxHeaderLineLength = 80;
          this.maxDataLineLength = 80;
          this.indentationMultiple = 2;
          this.minMacroNameLength = 3;
          this.lineEndings = LineEndings_1.LineEndings.LF;
          this.defaultHeader = (0, utils_1.getDefaultHeader)();
          this.severityLevel = {};
          this.requiredMacroOptions = [];
          this.ignoredLibnames = [];
          this.ignoredMacros = [];
          this.bannedStrings = [];
          this.source = json !== null && json !== void 0 ? json : {};
          if (json === null || json === void 0 ? void 0 : json.ignoreList) {
            if (Array.isArray(json.ignoreList)) {
              json.ignoreList.forEach((item) => {
                if (typeof item === "string")
                  this.ignoreList.push(item);
                else
                  throw new Error(`Property "ignoreList" has invalid type of values. It can contain only strings.`);
              });
            } else {
              throw new Error(`Property "ignoreList" can only be an array of strings`);
            }
          }
          if ((json === null || json === void 0 ? void 0 : json.ignoredMacros) === void 0) {
            this.ignoredMacros.push(...utils_1.defaultIgnoredMacros);
          } else if (!Array.isArray(json.ignoredMacros)) {
            throw new Error(`Property "ignoredMacros" can only be an array of strings.`);
          } else {
            json.ignoredMacros.forEach((item) => {
              if (typeof item === "string") {
                this.ignoredMacros.push(item);
              } else {
                throw new Error(`Property "ignoredMacros" has invalid type of values. It can only contain strings.`);
              }
            });
          }
          if ((json === null || json === void 0 ? void 0 : json.noTrailingSpaces) !== false) {
            this.lineLintRules.push(line_1.noTrailingSpaces);
          }
          if ((json === null || json === void 0 ? void 0 : json.noEncodedPasswords) !== false) {
            this.lineLintRules.push(line_1.noEncodedPasswords);
          }
          if ((json === null || json === void 0 ? void 0 : json.bannedStrings) === void 0) {
            this.bannedStrings.push(...utils_1.defaultBannedStrings);
          } else if (!Array.isArray(json.bannedStrings)) {
            throw new Error(`Property "bannedStrings" can only be an array of strings.`);
          } else {
            json.bannedStrings.forEach((item) => {
              if (typeof item === "string" && item.length) {
                this.bannedStrings.push(item);
              } else {
                throw new Error(`Property "bannedStrings" has invalid type of values. It can contain only non-empty strings.`);
              }
            });
          }
          if ((json === null || json === void 0 ? void 0 : json.noBannedStrings) !== false) {
            this.lineLintRules.push(line_1.noBannedStrings);
          }
          this.lineLintRules.push(line_1.noTabs);
          if ((json === null || json === void 0 ? void 0 : json.noTabs) === false || (json === null || json === void 0 ? void 0 : json.noTabIndentation) === false) {
            this.lineLintRules.pop();
          }
          if ((json === null || json === void 0 ? void 0 : json.maxLineLength) === void 0 || (json === null || json === void 0 ? void 0 : json.maxLineLength) > 0) {
            this.lineLintRules.push(line_1.maxLineLength);
            if (!isNaN(json === null || json === void 0 ? void 0 : json.maxLineLength)) {
              this.maxLineLength = json.maxLineLength;
            }
            if (!isNaN(json === null || json === void 0 ? void 0 : json.maxHeaderLineLength)) {
              this.maxHeaderLineLength = json.maxHeaderLineLength;
            }
            if (!isNaN(json === null || json === void 0 ? void 0 : json.maxDataLineLength)) {
              this.maxDataLineLength = json.maxDataLineLength;
            }
          }
          if ((json === null || json === void 0 ? void 0 : json.lineEndings) && json.lineEndings !== LineEndings_1.LineEndings.OFF) {
            if (json.lineEndings !== LineEndings_1.LineEndings.LF && json.lineEndings !== LineEndings_1.LineEndings.CRLF) {
              throw new Error(`Invalid value for lineEndings: can be ${LineEndings_1.LineEndings.LF} or ${LineEndings_1.LineEndings.CRLF}`);
            }
            this.fileLintRules.push(file_1.lineEndings);
            this.lineEndings = json.lineEndings;
          }
          this.lineLintRules.push(line_1.indentationMultiple);
          if (!isNaN(json === null || json === void 0 ? void 0 : json.indentationMultiple)) {
            this.indentationMultiple = json.indentationMultiple;
          }
          if ((json === null || json === void 0 ? void 0 : json.hasDoxygenHeader) !== false) {
            this.fileLintRules.push(file_1.hasDoxygenHeader);
          }
          if (json === null || json === void 0 ? void 0 : json.defaultHeader) {
            this.defaultHeader = json.defaultHeader;
          }
          if ((json === null || json === void 0 ? void 0 : json.noSpacesInFileNames) !== false) {
            this.pathLintRules.push(path_1.noSpacesInFileNames);
          }
          if ((json === null || json === void 0 ? void 0 : json.lowerCaseFileNames) !== false) {
            this.pathLintRules.push(path_1.lowerCaseFileNames);
          }
          if ((json === null || json === void 0 ? void 0 : json.lowerCaseMacroNames) !== false) {
            this.fileLintRules.push(file_1.lowerCaseMacroNames);
          }
          if ((json === null || json === void 0 ? void 0 : json.hasMacroNameInMend) !== false) {
            this.fileLintRules.push(file_1.hasMacroNameInMend);
          }
          if (json === null || json === void 0 ? void 0 : json.noMalformedMacroCalls) {
            this.fileLintRules.push(file_1.noMalformedMacroCalls);
          }
          if ((json === null || json === void 0 ? void 0 : json.noNestedCommentsInHeader) !== false) {
            this.fileLintRules.push(file_1.noNestedCommentsInHeader);
          }
          if ((json === null || json === void 0 ? void 0 : json.noNestedMacros) !== false) {
            this.fileLintRules.push(file_1.noNestedMacros);
          }
          if ((json === null || json === void 0 ? void 0 : json.noXcmd) !== false) {
            this.fileLintRules.push(file_1.noXcmd);
          }
          if (json === null || json === void 0 ? void 0 : json.noMacroIfInOpenCode) {
            this.fileLintRules.push(file_1.noMacroIfInOpenCode);
          }
          if ((json === null || json === void 0 ? void 0 : json.minMacroNameLength) !== void 0) {
            if (typeof (json === null || json === void 0 ? void 0 : json.minMacroNameLength) !== "number" || !Number.isInteger(json.minMacroNameLength) || json.minMacroNameLength < 1) {
              throw new Error(`Property "minMacroNameLength" must be an integer of 1 or more.`);
            }
            this.minMacroNameLength = json.minMacroNameLength;
          }
          if ((json === null || json === void 0 ? void 0 : json.minMacroNameLength) === void 0 || json.minMacroNameLength > 1) {
            this.fileLintRules.push(file_1.minMacroNameLength);
          }
          if ((json === null || json === void 0 ? void 0 : json.hasMacroParentheses) !== false) {
            this.fileLintRules.push(file_1.hasMacroParentheses);
          }
          if ((json === null || json === void 0 ? void 0 : json.strictMacroDefinition) !== false) {
            this.fileLintRules.push(file_1.strictMacroDefinition);
          }
          if (json === null || json === void 0 ? void 0 : json.hasRequiredMacroOptions) {
            this.fileLintRules.push(file_1.hasRequiredMacroOptions);
            if (json === null || json === void 0 ? void 0 : json.requiredMacroOptions) {
              if (!Array.isArray(json.requiredMacroOptions)) {
                throw new Error(`Property "requiredMacroOptions" can only be an array of strings.`);
              }
              json.requiredMacroOptions.forEach((item) => {
                if (typeof item === "string") {
                  this.requiredMacroOptions.push(item);
                } else {
                  throw new Error(`Property "requiredMacroOptions" has invalid type of values. It can only contain strings.`);
                }
              });
            }
          }
          if (json === null || json === void 0 ? void 0 : json.noSingleAsteriskComments) {
            this.fileLintRules.push(file_1.noSingleAsteriskComments);
          }
          if ((json === null || json === void 0 ? void 0 : json.noUndeclaredMacros) !== false) {
            this.fileLintRules.push(file_1.noUndeclaredMacros);
          }
          if ((json === null || json === void 0 ? void 0 : json.noUnusedMacros) !== false) {
            this.fileLintRules.push(file_1.noUnusedMacros);
          }
          if (json === null || json === void 0 ? void 0 : json.noUnusedLibnames) {
            this.fileLintRules.push(file_1.noUnusedLibnames);
            if (json === null || json === void 0 ? void 0 : json.ignoredLibnames) {
              if (!Array.isArray(json.ignoredLibnames)) {
                throw new Error(`Property "ignoredLibnames" can only be an array of strings.`);
              }
              json.ignoredLibnames.forEach((item) => {
                if (typeof item === "string") {
                  this.ignoredLibnames.push(item);
                } else {
                  throw new Error(`Property "ignoredLibnames" has invalid type of values. It can only contain strings.`);
                }
              });
            }
          }
          if ((json === null || json === void 0 ? void 0 : json.noGremlins) !== false) {
            this.lineLintRules.push(line_1.noGremlins);
            if (json === null || json === void 0 ? void 0 : json.allowedGremlins) {
              if (Array.isArray(json.allowedGremlins)) {
                json.allowedGremlins.forEach((item) => {
                  if (typeof item === "string" && /^0x[0-9a-f]{4}$/i.test(item))
                    this.allowedGremlins.push(item);
                  else
                    throw new Error(`Property "allowedGremlins" has invalid type of values. It can contain only strings of form hexcode like '["0x0080", "0x3000"]'`);
                });
              } else {
                throw new Error(`Property "allowedGremlins" can only be an array of strings of form hexcode like '["0x0080", "0x3000"]'`);
              }
            }
          }
          if (json === null || json === void 0 ? void 0 : json.severityLevel) {
            const defaultSeverity = json.severityLevel.default;
            if (defaultSeverity !== void 0) {
              if (defaultSeverity === "warn")
                this.defaultSeverity = Severity_1.Severity.Warning;
              else if (defaultSeverity === "error")
                this.defaultSeverity = Severity_1.Severity.Error;
              else
                throw new Error(`Property "severityLevel.default" can only be "warn" or "error"`);
            }
            for (const [rule, severity] of Object.entries(json.severityLevel)) {
              if (rule === "default")
                continue;
              if (severity === "warn")
                this.severityLevel[rule] = Severity_1.Severity.Warning;
              if (severity === "error")
                this.severityLevel[rule] = Severity_1.Severity.Error;
            }
          }
        }
        /**
         * Returns a new configuration with an override merged over this one, so a
         * file can adjust the rules that apply to it.
         *
         * Scalars replace, arrays are additive and objects merge key by key - see
         * `mergeLintConfig`.
         *
         * @param {object} json - the override, as read from a `@sasjslint` block.
         * @returns {LintConfig} a new configuration; this one is unchanged.
         */
        override(json) {
          const source = Object.assign({}, this.source);
          if (source.ignoredMacros === void 0) {
            source.ignoredMacros = [...this.ignoredMacros];
          }
          if (source.bannedStrings === void 0) {
            source.bannedStrings = [...this.bannedStrings];
          }
          return new _LintConfig((0, mergeLintConfig_1.mergeLintConfig)(source, json));
        }
      };
      exports.LintConfig = LintConfig;
    }
  });

  // ../../../../../tmp/sasjs-lint-pENlXV/utils-file.js
  var require_utils_file = __commonJS({
    "../../../../../tmp/sasjs-lint-pENlXV/utils-file.js"(exports, module) {
      var unavailable = (name) => async () => {
        throw new Error(name + " is not available in the browser host");
      };
      module.exports = {
        readFile: unavailable("readFile"),
        writeFile: unavailable("writeFile"),
        fileExists: async () => false,
        listFilesInFolder: async () => []
      };
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/getProjectRoot.js
  var require_getProjectRoot = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/getProjectRoot.js"(exports) {
      "use strict";
      var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
        function adopt(value) {
          return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
          });
        }
        return new (P || (P = Promise))(function(resolve, reject) {
          function fulfilled(value) {
            try {
              step(generator.next(value));
            } catch (e) {
              reject(e);
            }
          }
          function rejected(value) {
            try {
              step(generator["throw"](value));
            } catch (e) {
              reject(e);
            }
          }
          function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
          }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
      };
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.getProjectRoot = getProjectRoot;
      var path_1 = __importDefault(require_path());
      var os_1 = __importDefault(require_os());
      var file_1 = require_utils_file();
      function getProjectRoot() {
        return __awaiter(this, void 0, void 0, function* () {
          let root = "";
          let rootFound = false;
          let i = 1;
          let currentLocation = process.cwd();
          const homeDir = os_1.default.homedir();
          const maxLevels = currentLocation.split(path_1.default.sep).length;
          while (i <= maxLevels && !rootFound && currentLocation !== homeDir) {
            const isRoot = yield (0, file_1.fileExists)(path_1.default.join(currentLocation, ".sasjslint"));
            if (isRoot) {
              rootFound = true;
              root = currentLocation;
              break;
            } else {
              currentLocation = path_1.default.join(currentLocation, "..");
              i++;
            }
          }
          return root;
        });
      }
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/defaultBannedStrings.js
  var require_defaultBannedStrings = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/defaultBannedStrings.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.defaultBannedStrings = void 0;
      exports.defaultBannedStrings = ["error ", "error:", "warning ", "warning:"];
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/defaultIgnoredMacros.js
  var require_defaultIgnoredMacros = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/defaultIgnoredMacros.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.defaultIgnoredMacros = void 0;
      exports.defaultIgnoredMacros = ["webout"];
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/getLintConfig.js
  var require_getLintConfig = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/getLintConfig.js"(exports) {
      "use strict";
      var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
        function adopt(value) {
          return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
          });
        }
        return new (P || (P = Promise))(function(resolve, reject) {
          function fulfilled(value) {
            try {
              step(generator.next(value));
            } catch (e) {
              reject(e);
            }
          }
          function rejected(value) {
            try {
              step(generator["throw"](value));
            } catch (e) {
              reject(e);
            }
          }
          function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
          }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
      };
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.DefaultLintConfiguration = exports.getDefaultHeader = void 0;
      exports.getLintConfig = getLintConfig;
      var path_1 = __importDefault(require_path());
      var os_1 = __importDefault(require_os());
      var LintConfig_1 = require_LintConfig();
      var file_1 = require_utils_file();
      var getProjectRoot_1 = require_getProjectRoot();
      var LineEndings_1 = require_LineEndings();
      var defaultBannedStrings_1 = require_defaultBannedStrings();
      var defaultIgnoredMacros_1 = require_defaultIgnoredMacros();
      var getDefaultHeader = () => `/**{lineEnding}  @file{lineEnding}  @brief <Your brief here>{lineEnding}{lineEnding}  <h4> SAS Macros </h4>{lineEnding}{lineEnding}**/`;
      exports.getDefaultHeader = getDefaultHeader;
      exports.DefaultLintConfiguration = {
        allowedGremlins: [],
        bannedStrings: [...defaultBannedStrings_1.defaultBannedStrings],
        defaultHeader: (0, exports.getDefaultHeader)(),
        hasDoxygenHeader: true,
        hasMacroNameInMend: true,
        hasMacroParentheses: true,
        hasRequiredMacroOptions: false,
        ignoreList: [],
        ignoredLibnames: [],
        ignoredMacros: [...defaultIgnoredMacros_1.defaultIgnoredMacros],
        indentationMultiple: 2,
        lineEndings: LineEndings_1.LineEndings.OFF,
        lowerCaseFileNames: true,
        lowerCaseMacroNames: true,
        maxDataLineLength: 80,
        maxHeaderLineLength: 80,
        maxLineLength: 80,
        minMacroNameLength: 3,
        noBannedStrings: true,
        noEncodedPasswords: true,
        noGremlins: true,
        noMacroIfInOpenCode: false,
        noMalformedMacroCalls: false,
        noNestedCommentsInHeader: true,
        noNestedMacros: true,
        noSingleAsteriskComments: false,
        noSpacesInFileNames: true,
        noTabs: true,
        noTrailingSpaces: true,
        noUndeclaredMacros: true,
        noUnusedLibnames: false,
        noUnusedMacros: true,
        noXcmd: true,
        requiredMacroOptions: [],
        severityLevel: {},
        strictMacroDefinition: true
      };
      function getLintConfig() {
        return __awaiter(this, void 0, void 0, function* () {
          const projectRoot = yield (0, getProjectRoot_1.getProjectRoot)();
          const lintFileLocation = projectRoot || os_1.default.homedir();
          const configuration = yield (0, file_1.readFile)(path_1.default.join(lintFileLocation, ".sasjslint")).catch((_) => {
            return JSON.stringify(exports.DefaultLintConfiguration);
          });
          return new LintConfig_1.LintConfig(JSON.parse(configuration));
        });
      }
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/gremlinCharacters.js
  var require_gremlinCharacters = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/gremlinCharacters.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.gremlinCharacters = void 0;
      exports.gremlinCharacters = {
        "0x0003": {
          description: "End of Text"
        },
        "0x000b": {
          description: "Line Tabulation"
        },
        "0x007f": {
          description: "Delete"
        },
        "0x0080": {
          description: "Padding"
        },
        "0x0081": {
          description: "High Octet Preset"
        },
        "0x0082": {
          description: "Break Permitted Here"
        },
        "0x0083": {
          description: "No Break Here"
        },
        "0x0084": {
          description: "Index"
        },
        "0x0085": {
          description: "Next Line"
        },
        "0x0086": {
          description: "Start of Selected Area"
        },
        "0x0087": {
          description: "End of Selected Area"
        },
        "0x0088": {
          description: "Character Tabulation Set"
        },
        "0x0089": {
          description: "Character Tabulation with Justification"
        },
        "0x008a": {
          description: "Line Tabulation Set"
        },
        "0x008b": {
          description: "Partial Line Down"
        },
        "0x008c": {
          description: "Partial Line Backward"
        },
        "0x008d": {
          description: "Reverse Index"
        },
        "0x008e": {
          description: "Single Shift Two"
        },
        "0x008f": {
          description: "Single Shift Three"
        },
        "0x0090": {
          description: "Device Control String"
        },
        "0x0091": {
          description: "Private Use One"
        },
        "0x0092": {
          description: "Private Use Two"
        },
        "0x0093": {
          description: "Set Transmit State"
        },
        "0x0094": {
          description: "Cancel Character"
        },
        "0x0095": {
          description: "Message Waiting"
        },
        "0x0096": {
          description: "Start of Guarded Area"
        },
        "0x0097": {
          description: "End of Guarded Area"
        },
        "0x0098": {
          description: "Start of String"
        },
        "0x0099": {
          description: "Single Graphic Character Introducer"
        },
        "0x009a": {
          description: "Single Character Introducer"
        },
        "0x009b": {
          description: "Control Sequence Introducer"
        },
        "0x009c": {
          description: "String Terminator"
        },
        "0x009d": {
          description: "Operating System Command"
        },
        "0x009e": {
          description: "Privacy Message"
        },
        "0x009f": {
          description: "Application Program Command"
        },
        "0x00a0": {
          description: "non breaking space"
        },
        "0x00ad": {
          description: "Soft Hyphen"
        },
        "0x2000": {
          description: "En Quad"
        },
        "0x2001": {
          description: "Em Quad"
        },
        "0x2002": {
          description: "En Space"
        },
        "0x2003": {
          description: "Em Space"
        },
        "0x2004": {
          description: "Three-Per-Em Space"
        },
        "0x2005": {
          description: "Four-Per-Em Space"
        },
        "0x2006": {
          description: "Six-Per-Em Space"
        },
        "0x2007": {
          description: "Figure Space"
        },
        "0x2008": {
          description: "Punctuation Space"
        },
        "0x2009": {
          description: "Thin Space"
        },
        "0x200a": {
          description: "Hair Space"
        },
        "0x200b": {
          description: "Zero Width Space"
        },
        "0x200c": {
          description: "Zero Width Non-Joiner"
        },
        "0x200d": {
          description: "Zero Width Joiner"
        },
        "0x200e": {
          description: "Left-to-Right Mark"
        },
        "0x200f": {
          description: "Right-to-Left Mark"
        },
        "0x2013": {
          description: "En Dash"
        },
        "0x2014": {
          description: "Em Dash"
        },
        "0x2018": {
          description: "Left Single Quotation Mark"
        },
        "0x2019": {
          description: "Right Single Quotation Mark"
        },
        "0x201c": {
          description: "Left Double Quotation Mark"
        },
        "0x201d": {
          description: "Right Double Quotation Mark"
        },
        "0x2028": {
          description: "Line Separator"
        },
        "0x2029": {
          description: "Paragraph Separator"
        },
        "0x202a": {
          description: "Left-to-Right Embedding"
        },
        "0x202b": {
          description: "Right-to-Left Embedding"
        },
        "0x202c": {
          description: "Pop Directional Formatting"
        },
        "0x202d": {
          description: "Left-to-Right Override"
        },
        "0x202e": {
          description: "Right-to-Left Override"
        },
        "0x202f": {
          description: "Narrow No-Break Space"
        },
        "0x205f": {
          description: "Medium Mathematical Space"
        },
        "0x2060": {
          description: "Word Joiner"
        },
        "0x2061": {
          description: "Function Application"
        },
        "0x2062": {
          description: "Invisible Times"
        },
        "0x2063": {
          description: "Invisible Separator"
        },
        "0x2064": {
          description: "Invisible Plus"
        },
        "0x2066": {
          description: "Left-to-Right Isolate"
        },
        "0x2067": {
          description: "Right-to-Left Isolate"
        },
        "0x2068": {
          description: "First Strong Isolate "
        },
        "0x2069": {
          description: "Pop Directional Isolate"
        },
        "0x206a": {
          description: "Inhibit Symmetric Swapping"
        },
        "0x206b": {
          description: "Activate Symmetric Swapping"
        },
        "0x206c": {
          description: "Inhibit Arabic Form Shaping"
        },
        "0x206d": {
          description: "Activate Arabic Form Shaping"
        },
        "0x206e": {
          description: "National Digit Shapes"
        },
        "0x206f": {
          description: "Nominal Digit Shapes"
        },
        "0x2800": {
          description: "Braille Pattern Blank"
        },
        "0x3000": {
          description: "Ideographic Space"
        },
        "0x3164": {
          description: "Hangul Filler"
        },
        "0xfe00": {
          description: "Variation Selector-1"
        },
        "0xfe01": {
          description: "Variation Selector-2"
        },
        "0xfe02": {
          description: "Variation Selector-3"
        },
        "0xfe03": {
          description: "Variation Selector-4"
        },
        "0xfe04": {
          description: "Variation Selector-5"
        },
        "0xfe05": {
          description: "Variation Selector-6"
        },
        "0xfe06": {
          description: "Variation Selector-7"
        },
        "0xfe07": {
          description: "Variation Selector-8"
        },
        "0xfe08": {
          description: "Variation Selector-9"
        },
        "0xfe09": {
          description: "Variation Selector-10"
        },
        "0xfe0a": {
          description: "Variation Selector-11"
        },
        "0xfe0b": {
          description: "Variation Selector-12 "
        },
        "0xfe0c": {
          description: "Variation Selector-13"
        },
        "0xfe0d": {
          description: "Variation Selector-14"
        },
        "0xfe0e": {
          description: "Variation Selector-15"
        },
        "0xfe0f": {
          description: "Variation Selector-16"
        },
        "0xfeff": {
          description: "Zero Width No-Break Space"
        },
        "0xfffc": {
          description: "Object Replacement Character"
        }
      };
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/ignore/index.js
  var require_ignore = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/ignore/index.js"(exports, module) {
      function makeArray(subject) {
        return Array.isArray(subject) ? subject : [subject];
      }
      var UNDEFINED = void 0;
      var EMPTY = "";
      var SPACE = " ";
      var ESCAPE = "\\";
      var REGEX_LITERAL_SPECIAL = /[.*+?()[\]{}^$|\\/]/;
      var BOM = "\uFEFF";
      var REGEX_INVALID_TRAILING_BACKSLASH = /(?:[^\\]|^)\\$/;
      var REGEX_ANCHORED_GLOBSTAR = /^\/\*{2,}$/;
      var REGEX_REPLACE_LEADING_EXCAPED_EXCLAMATION = /^\\!/;
      var REGEX_REPLACE_LEADING_EXCAPED_HASH = /^\\#/;
      var REGEX_SPLITALL_CRLF = /\r?\n/g;
      var DOUBLE_SLASH = "//";
      var SLASH_CODE = 47;
      var DOT_CODE = 46;
      var SLASH = "/";
      var TMP_KEY_IGNORE = "node-ignore";
      if (typeof Symbol !== "undefined") {
        TMP_KEY_IGNORE = /* @__PURE__ */ Symbol.for("node-ignore");
      }
      var KEY_IGNORE = TMP_KEY_IGNORE;
      var define = (object, key, value) => {
        Object.defineProperty(object, key, { value });
        return value;
      };
      var RETURN_FALSE = () => false;
      var POSIX_CLASSES = {
        alnum: "0-9A-Za-z",
        alpha: "A-Za-z",
        blank: " \\t",
        cntrl: "\\x00-\\x1f\\x7f",
        digit: "0-9",
        graph: "!-.0-~",
        lower: "a-z",
        print: " -.0-~",
        punct: "!-.:-@\\[-`{-~",
        // git's `sane-ctype.h` classifies \v and \f as control, not space,
        //   unlike C's `isspace`
        space: " \\t\\n\\r",
        upper: "A-Z",
        xdigit: "0-9A-Fa-f"
      };
      var CLASS_MEMBERS_TO_ESCAPE = "\\]^-[";
      var escapeMember = (char) => CLASS_MEMBERS_TO_ESCAPE.indexOf(char) < 0 ? char : ESCAPE + char;
      var NON_SLASH = "(?!\\/)";
      var classSource = (negated, body) => {
        if (negated) {
          return `[^\\/${body}]`;
        }
        const source = `[${body}]`;
        return new RegExp(source).test("/") ? NON_SLASH + source : source;
      };
      var scanBracket = (pattern, start) => {
        const { length } = pattern;
        let index = start + 1;
        let negated = EMPTY;
        const lead = pattern[index];
        if (lead === "!" || lead === "^") {
          negated = "^";
          index++;
        }
        let body = EMPTY;
        let prev = EMPTY;
        for (; ; ) {
          const char = pattern[index];
          if (char === UNDEFINED) {
            return null;
          }
          if (char === ESCAPE) {
            const escaped = pattern[index + 1];
            if (escaped === UNDEFINED) {
              return null;
            }
            body += escapeMember(escaped);
            prev = escaped;
            index++;
          } else if (char === "-" && prev && index + 1 < length && pattern[index + 1] !== "]") {
            index++;
            let to = pattern[index];
            if (to === ESCAPE) {
              to = pattern[index += 1];
            }
            if (prev <= to) {
              body += `-${escapeMember(to)}`;
            }
            prev = EMPTY;
          } else if (char === "[" && pattern[index + 1] === ":") {
            const nameStart = index + 2;
            let end = nameStart;
            while (end < length && pattern[end] !== "]") {
              end++;
            }
            if (end === length) {
              return null;
            }
            if (end > nameStart && pattern[end - 1] === ":") {
              const name = pattern.slice(nameStart, end - 1);
              if (!Object.prototype.hasOwnProperty.call(POSIX_CLASSES, name)) {
                return null;
              }
              body += POSIX_CLASSES[name];
              prev = EMPTY;
              index = end;
            } else {
              body += escapeMember("[");
              prev = "[";
              index = nameStart - 2;
            }
          } else {
            body += escapeMember(char);
            prev = char;
          }
          index++;
          if (pattern[index] === "]") {
            return {
              end: index,
              source: classSource(negated, body)
            };
          }
        }
      };
      var NEVER_MATCH = "[]";
      var PLACEHOLDER = "\0";
      var REGEX_RESTORE_PLACEHOLDER = new RegExp(
        `${PLACEHOLDER}(\\d+)${PLACEHOLDER}`,
        "g"
      );
      var TRAILING_WILDCARD = "\uE000";
      var TRAILING_DOUBLESTAR = "\uE001";
      var isReserved = (char) => char === PLACEHOLDER || char === TRAILING_WILDCARD || char === TRAILING_DOUBLESTAR;
      var extractBrackets = (pattern) => {
        const sources = [];
        const hold = (source) => `${PLACEHOLDER}${sources.push(source) - 1}${PLACEHOLDER}`;
        const { length } = pattern;
        let out = EMPTY;
        let index = 0;
        while (index < length) {
          const char = pattern[index];
          if (char === ESCAPE) {
            const escaped = pattern[index + 1];
            if (escaped === UNDEFINED || escaped === SLASH && index + 2 === length) {
              out += hold(NEVER_MATCH);
            } else if (escaped === "*" || escaped === "[" || escaped === SPACE) {
              out += pattern.slice(index, index + 2);
            } else {
              out += hold(
                REGEX_LITERAL_SPECIAL.test(escaped) ? ESCAPE + escaped : isReserved(escaped) ? `[${escaped}]` : escaped
              );
            }
            index += 2;
          } else if (isReserved(char)) {
            out += hold(`[${char}]`);
            index++;
          } else if (char === "[") {
            const scanned = scanBracket(pattern, index);
            if (scanned === null) {
              out += hold(NEVER_MATCH);
              index = length;
            } else {
              out += hold(scanned.source);
              index = scanned.end + 1;
            }
          } else {
            out += char;
            index++;
          }
        }
        return {
          source: out,
          sources
        };
      };
      var DIRECT = null;
      var REGEX_INNER_SLASH = /\/(?!$)/;
      var REPLACERS = [
        // Replace (\ ) with ' '
        // Only a space: an escaped tab or other whitespace is already a literal by
        //   the time it reaches here, and a bare tab must be left as one, not turned
        //   into a space.
        // (\ ) -> ' '
        // (\\ ) -> '\\ '
        // (\\\ ) -> '\\ '
        [
          // A run of backslashes is taken whole, from its first one, so no match
          //   ever starts again inside it -- `(\\+?) ` did, which made a long run
          //   quadratic.
          /(\\+)( ?)/g,
          (_, run, space) => space ? run.slice(0, run.length - run.length % 2) + SPACE : run,
          ESCAPE + SPACE
        ],
        // git's wildmatch() reads a run of two or more asterisks as one globstar
        //   whenever the run fills a path segment: it starts the pattern or follows
        //   a `/`, and it ends the pattern or comes before a `/`. A run of two is
        //   already `**`; a longer one is folded into `**` here, so the steps
        //   below only ever have to know `**`.
        // `***/foo` -> `**/foo`, `a/***/b` -> `a/**/b`, `a/***` -> `a/**`
        // git also takes a run beside a literal prefix (`a***/b`) or beside an
        //   escaped slash (`***\/b`) as a globstar, and this does not; the README
        //   lists both, under "A run of asterisks".
        [
          /(^|\/)\*{3,}(?=\/|$)/g,
          (_, start) => `${start}**`,
          "*"
        ],
        // Escape metacharacters
        // which is written down by users but means special for regular expressions.
        // > There are 12 characters with special meanings:
        // > - the backslash \,
        // > - the caret ^,
        // > - the dollar sign $,
        // > - the period or dot .,
        // > - the vertical bar or pipe symbol |,
        // > - the question mark ?,
        // > - the asterisk or star *,
        // > - the plus sign +,
        // > - the opening parenthesis (,
        // > - the closing parenthesis ),
        // > - and the opening square bracket [,
        // > - the opening curly brace {,
        // > These special characters are often called "metacharacters".
        [
          /[\\$.|*+(){^]/g,
          (match) => `\\${match}`
        ],
        [
          // > a question mark (?) matches a single character
          /(?!\\)\?/g,
          () => "[^/]",
          "?"
        ],
        // leading slash
        [
          // > A leading slash matches the beginning of the pathname.
          // > For example, "/*.c" matches "cat-file.c" but not "mozilla-sha1/sha1.c".
          // A leading slash matches the beginning of the pathname
          /^\//,
          () => "^",
          SLASH
        ],
        // replace special metacharacter slash after the leading slash
        [
          /\//g,
          () => "\\/",
          SLASH
        ],
        [
          // > A leading "**" followed by a slash means match in all directories.
          // > For example, "**/foo" matches file or directory "foo" anywhere,
          // > the same as pattern "foo".
          // > "**/foo/bar" matches file or directory "bar" anywhere that is directly
          // >   under directory "foo".
          // Notice that the '*'s have been replaced as '\\*'
          /^\^*(?:\\\*\\\*\\\/)+/,
          // '**/foo' <-> 'foo'
          () => "^(?:.*\\/)?",
          "*"
        ],
        // starting
        [
          // there will be no leading '/'
          //   (which has been replaced by section "leading slash")
          // If starts with '**', adding a '^' to the regular expression also works
          DIRECT,
          (source, pattern) => {
            if (!source || source[0] === "^") {
              return source;
            }
            const anchor = !REGEX_INNER_SLASH.test(pattern) ? "(?:^|\\/)" : "^";
            return anchor + source;
          }
        ],
        // two globstars
        [
          // Use lookahead assertions so that we could match more than one `'/**'`
          /\\\/\\\*\\\*(?=\\\/|$)/g,
          // Zero, one or several directories
          // should not use '*', or it will be replaced by the next replacer
          // Check if it is not the last `'/**'`
          (_, index, str) => index + 6 < str.length ? str.slice(index + 6) === "\\/" ? "(?:\\/[^\\/]+)+" : "(?:\\/[^\\/]+)*" : `\\/${TRAILING_DOUBLESTAR}`,
          "*"
        ],
        // normal intermediate wildcards
        [
          // Never replace escaped '*'
          // ignore rule '\*' will match the path '*'
          // 'abc.*/' -> go
          // 'abc.*'  -> skip this rule,
          //    coz trailing single wildcard will be handed by [trailing wildcard]
          /(^|[^\\]+)(\\\*)+(?=.+)/g,
          // '*.js' matches '.js'
          // '*.js' doesn't match 'abc'
          (_, p1, p2) => {
            const unescaped = p2.replace(/\\\*/g, "[^\\/]*");
            return p1 + unescaped;
          },
          "*"
        ],
        // trailing wildcard, held apart from a literal star
        [
          // The step above leaves a trailing `*` alone, so a single `\*` is all that
          //   can be left at the end here, and what stands in front of it says which
          //   kind it is. A wildcard arrives as the escaper wrote it, `\*` with
          //   nothing before it; a literal arrives as the user's own escape, which
          //   the escaper doubled, and then the star's own -- `\\` and then `\*`.
          //   There is no third case: every backslash still reaching the chain is
          //   one `\*`, `\[` or `\ ` carries itself, and each is followed by its
          //   own character, so a longer run can never form. This runs while the
          //   two are still distinct, before the unescape steps below collapse the
          //   literal onto the very `\*` a wildcard leaves behind.
          /(^|[^\\])((?:\\\\)*)\\\*$/,
          (match, p1, p2) => p2 === EMPTY ? p1 + TRAILING_WILDCARD : match,
          "*"
        ],
        [
          // unescape, revert step 3 except for back slash
          // For example, if a user escape a '\\*',
          // after step 3, the result will be '\\\\\\*'
          /\\\\\\(?=[$.|*+(){^])/g,
          () => ESCAPE,
          ESCAPE + ESCAPE
        ],
        [
          // '\\\\' -> '\\'
          /\\\\/g,
          () => ESCAPE,
          ESCAPE + ESCAPE
        ],
        [
          // Every real bracket expression -- POSIX classes included -- has already
          //   been held aside by `extractBrackets`, so the only `[` left in the
          //   pattern is an escaped, literal one.
          // A backslash could only stand at the end of the range if it quoted the
          //   `]`, and `\]` is held aside long before this.
          /\\\[([^\]/]*?)($|\])/g,
          // '\\[bar]' -> '\\\\[bar]'
          (match, range, close) => `\\[${range}${close}`,
          "["
        ],
        // ending
        [
          // 'js' will not match 'js.'
          // 'ab' will not match 'abc'
          DIRECT,
          // WTF!
          // https://git-scm.com/docs/gitignore
          // changes in [2.22.1](https://git-scm.com/docs/gitignore/2.22.1)
          // which re-fixes #24, #38
          // > If there is a separator at the end of the pattern then the pattern
          // > will only match directories, otherwise the pattern can match both
          // > files and directories.
          // 'js*' will not match 'a.js'
          // 'js/' will not match 'a.js'
          // 'js' will match 'a.js' and 'a.js/'
          (source) => {
            const last = source[source.length - 1];
            if (!last || last === TRAILING_WILDCARD || last === TRAILING_DOUBLESTAR) {
              return source;
            }
            return last === SLASH ? `${source}$` : `${source}(?=$|\\/$)`;
          }
        ]
      ];
      var REGEX_REPLACE_TRAILING_WILDCARD = /(^|\\\/)?\uE000$/;
      var MODE_IGNORE = "regex";
      var MODE_CHECK_IGNORE = "checkRegex";
      var UNDERSCORE = "_";
      var replaceTrailingWildcard = (_, p1) => {
        const prefix = p1 ? `${p1}[^/]+` : "[^/]*";
        return `${prefix}(?=$|\\/$)`;
      };
      var REGEX_REPLACE_TRAILING_DOUBLESTAR = /\uE001$/;
      var replaceTrailingDoublestar = () => ".+(?=$|\\/$)";
      var WILDCARD = "[^\\/]*";
      var separatorAfter = (run, at) => {
        let separator = EMPTY;
        for (let index = at + 1; index < run.length && !run[index].wildcard; index++) {
          separator += run[index].single;
        }
        return separator;
      };
      var pinWildcards = (source) => {
        if (source.indexOf(WILDCARD) < 0) {
          return source;
        }
        const tokens = [];
        const { length } = source;
        let index = 0;
        while (index < length) {
          const char = source[index];
          if (source.startsWith(WILDCARD, index)) {
            tokens.push({ wildcard: true });
            index += WILDCARD.length;
          } else if (char === "[") {
            let end = index + 1;
            if (source[end] === "^") {
              end++;
            }
            if (source[end] === "]") {
              end++;
            }
            while (end < length && source[end] !== "]") {
              end += source[end] === ESCAPE ? 2 : 1;
            }
            end++;
            tokens.push({ single: source.slice(index, end) });
            index = end;
          } else if (char === ESCAPE) {
            tokens.push({ single: source.slice(index, index + 2) });
            index += 2;
          } else if (char === "(") {
            let depth = 0;
            let end = index;
            do {
              if (source[end] === ESCAPE) {
                end++;
              } else if (source[end] === "(") {
                depth++;
              } else if (source[end] === ")") {
                depth--;
              }
              end++;
            } while (end < length && depth > 0);
            if ("*+?".indexOf(source[end]) >= 0) {
              end++;
            }
            tokens.push({ boundary: source.slice(index, end) });
            index = end;
          } else if (char === "^" || char === "$") {
            tokens.push({ boundary: char });
            index++;
          } else {
            tokens.push({ single: char });
            index++;
          }
        }
        let out = EMPTY;
        let run = [];
        const flush = () => {
          let lastWildcard;
          run.forEach((token, at) => {
            if (token.wildcard) {
              lastWildcard = at;
            }
          });
          run.forEach((token, at) => {
            if (!token.wildcard) {
              out += token.single;
              return;
            }
            out += at === lastWildcard ? WILDCARD : `(?:(?!${separatorAfter(run, at)})[^\\/])*`;
          });
          run = [];
        };
        tokens.forEach((token) => {
          if (token.boundary === void 0) {
            run.push(token);
            return;
          }
          flush();
          out += token.boundary;
        });
        flush();
        return out;
      };
      var makeRegexPrefix = (pattern) => {
        if (REGEX_ANCHORED_GLOBSTAR.test(pattern)) {
          pattern = "**";
        }
        const { source, sources } = extractBrackets(pattern);
        const replaced = REPLACERS.reduce(
          // A pass whose matcher finds nothing hands back the very string it was
          //   given, so asking first costs a search and saves a rewrite. Ten of the
          //   fifteen passes never fire for a typical .gitignore line, and between
          //   them they were 45% of this chain.
          (prev, [matcher, replacer, required]) => {
            if (matcher === DIRECT) {
              return replacer(prev, pattern);
            }
            if (required !== UNDEFINED && prev.indexOf(required) < 0) {
              return prev;
            }
            return matcher.test(prev) ? prev.replace(matcher, replacer.bind(pattern)) : prev;
          },
          source
        );
        return sources.length ? replaced.replace(
          REGEX_RESTORE_PLACEHOLDER,
          (match, index) => sources[index]
        ) : replaced;
      };
      var checkSourceOf = (body, prefix) => {
        if (body[body.length - 1] === SLASH) {
          prefix = makeRegexPrefix(body.slice(0, -1));
        }
        const head = prefix.slice(0, -1);
        const last = prefix[prefix.length - 1];
        return last === TRAILING_WILDCARD ? `${head}$` : last === TRAILING_DOUBLESTAR ? `${head}.*$` : NEVER_MATCH;
      };
      var matchesBasename = (body) => {
        const index = body.indexOf(SLASH);
        return index < 0 || index === body.length - 1;
      };
      var basenameOf = (path) => {
        const end = path.length - 1;
        const index = path.lastIndexOf(
          SLASH,
          path[end] === SLASH ? end - 1 : end
        );
        return index < 0 ? path : path.slice(index + 1);
      };
      var parentOf = (path) => {
        if (path.charCodeAt(0) === SLASH_CODE || path.indexOf(DOUBLE_SLASH) >= 0) {
          const slices = path.split(SLASH).filter(Boolean);
          slices.pop();
          return slices.length ? slices.join(SLASH) + SLASH : EMPTY;
        }
        const end = path.length - 1;
        const cut = path.lastIndexOf(
          SLASH,
          path.charCodeAt(end) === SLASH_CODE ? end - 1 : end
        );
        return cut < 0 ? EMPTY : path.slice(0, cut + 1);
      };
      var isString = (subject) => typeof subject === "string";
      var checkPattern = (pattern) => pattern && isString(pattern) && !REGEX_INVALID_TRAILING_BACKSLASH.test(pattern);
      var splitPattern = (pattern) => pattern.split(REGEX_SPLITALL_CRLF).filter(Boolean);
      var IgnoreRule = class {
        constructor(pattern, mark, body, ignoreCase, negative, prefix) {
          this.pattern = pattern;
          this.mark = mark;
          this.negative = negative;
          define(this, "body", body);
          define(this, "ignoreCase", ignoreCase);
          define(this, "regexPrefix", prefix);
        }
        // Worked out on first use and kept behind an own property, the way `regex`
        //   caches itself in `_regex`. Deciding it in the constructor instead would
        //   add a fourth `defineProperty` to every rule ever built, which cost 4% of
        //   every compile -- including the compiles of rules that are never matched
        //   against anything.
        get _basenameOnly() {
          return define(this, "_basenameOnly", matchesBasename(this.body));
        }
        get regex() {
          const key = UNDERSCORE + MODE_IGNORE;
          if (this[key]) {
            return this[key];
          }
          return this._make(MODE_IGNORE, key);
        }
        get checkRegex() {
          const key = UNDERSCORE + MODE_CHECK_IGNORE;
          if (this[key]) {
            return this[key];
          }
          return this._make(MODE_CHECK_IGNORE, key);
        }
        _make(mode, key) {
          const str = pinWildcards(
            mode === MODE_IGNORE ? this.regexPrefix.replace(REGEX_REPLACE_TRAILING_WILDCARD, replaceTrailingWildcard).replace(REGEX_REPLACE_TRAILING_DOUBLESTAR, replaceTrailingDoublestar) : checkSourceOf(this.body, this.regexPrefix)
          );
          const regex = this.ignoreCase ? new RegExp(str, "i") : new RegExp(str);
          return define(this, key, regex);
        }
      };
      var isLineEnd = (char) => char === "\r" || char === "\n";
      var trimEnd = (body) => {
        let end = body.length;
        while (end && isLineEnd(body[end - 1])) {
          end--;
        }
        const lineEnd = end;
        while (end && body[end - 1] === SPACE) {
          end--;
        }
        if (end === lineEnd) {
          return body.slice(0, end);
        }
        let backslashes = 0;
        while (backslashes < end && body[end - backslashes - 1] === ESCAPE) {
          backslashes++;
        }
        return backslashes % 2 ? body.slice(0, end - 1) + SPACE : body.slice(0, end);
      };
      var createRule = ({
        pattern,
        mark
      }, ignoreCase) => {
        let body = pattern[0] === BOM ? pattern.slice(1) : pattern;
        if (body[0] === "#") {
          return;
        }
        let negative = false;
        if (body[0] === "!") {
          negative = true;
          body = body.slice(1);
        }
        const last = body[body.length - 1];
        if (last === SPACE || last === "\r" || last === "\n") {
          body = trimEnd(body);
        }
        if (!body) {
          return;
        }
        body = body.replace(REGEX_REPLACE_LEADING_EXCAPED_EXCLAMATION, "!").replace(REGEX_REPLACE_LEADING_EXCAPED_HASH, "#");
        const regexPrefix = makeRegexPrefix(body);
        return new IgnoreRule(
          pattern,
          mark,
          body,
          ignoreCase,
          negative,
          regexPrefix
        );
      };
      var RuleManager = class {
        constructor(ignoreCase) {
          this._ignoreCase = ignoreCase;
          this._rules = [];
          this._basenameCount = 0;
        }
        _add(pattern) {
          if (pattern && pattern[KEY_IGNORE]) {
            this._rules = this._rules.concat(pattern._rules._rules);
            this._basenameCount += pattern._rules._basenameCount;
            this._added = true;
            return;
          }
          if (isString(pattern)) {
            pattern = {
              pattern
            };
          }
          const rule = checkPattern(pattern.pattern) && createRule(pattern, this._ignoreCase);
          if (rule) {
            this._added = true;
            this._rules.push(rule);
            if (matchesBasename(rule.body)) {
              this._basenameCount++;
            }
          }
        }
        // @param {Array<string> | string | Ignore} pattern
        add(pattern) {
          this._added = false;
          makeArray(
            isString(pattern) ? splitPattern(pattern) : pattern
          ).forEach(this._add, this);
          if (this._added) {
            this._literalRules = UNDEFINED;
          }
          return this._added;
        }
        // Match the literal 'abc/' for `checkIgnore`, last rule wins. Only a rule
        //   ending in a wildcard can match it (see `checkSourceOf`), so the rest
        //   are left out once, rather than tested or compiled for every path.
        testLiteral(path) {
          const rules = this._literalRules || (this._literalRules = this._rules.filter(
            ({ body }) => body[body.length - (body[body.length - 1] === SLASH ? 2 : 1)] === "*"
          ));
          let ignored = false;
          let unignored = false;
          let matchedRule;
          for (let index = rules.length - 1; index >= 0; index--) {
            const rule = rules[index];
            if (rule.checkRegex.test(path)) {
              ignored = !rule.negative;
              unignored = rule.negative;
              matchedRule = rule.negative ? UNDEFINED : rule;
              break;
            }
          }
          const ret = {
            ignored,
            unignored
          };
          if (matchedRule) {
            ret.rule = matchedRule;
          }
          return ret;
        }
        // Test one single path without recursively checking parent directories
        //
        // - mode `string` either `MODE_IGNORE` or `MODE_CHECK_IGNORE`
        // @returns {TestResult}
        test(path, mode) {
          const rules = this._rules;
          const { length } = rules;
          const shortcut = this._basenameCount * 2 >= length;
          const basename = shortcut ? basenameOf(path) : path;
          for (let index = length - 1; index >= 0; index--) {
            const rule = rules[index];
            if (rule[mode].test(
              shortcut && rule._basenameOnly ? basename : path
            )) {
              const { negative } = rule;
              const ret = {
                ignored: !negative,
                unignored: negative
              };
              if (!negative) {
                ret.rule = rule;
              }
              return ret;
            }
          }
          return {
            ignored: false,
            unignored: false
          };
        }
      };
      var throwError = (message, Ctor) => {
        throw new Ctor(message);
      };
      var checkPath = (path, originalPath, doThrow) => {
        if (!isString(path)) {
          return doThrow(
            `path must be a string, but got \`${originalPath}\``,
            TypeError
          );
        }
        if (!path) {
          return doThrow(`path must not be empty`, TypeError);
        }
        if (checkPath.isNotRelative(path)) {
          const r = "`path.relative()`d";
          return doThrow(
            `path should be a ${r} string, but got "${originalPath}"`,
            RangeError
          );
        }
        return true;
      };
      var isNotRelative = (path) => {
        const first = path.charCodeAt(0);
        if (first === SLASH_CODE) {
          return true;
        }
        if (first !== DOT_CODE) {
          return false;
        }
        if (path.length === 1) {
          return true;
        }
        const second = path.charCodeAt(1);
        if (second === SLASH_CODE) {
          return true;
        }
        if (second !== DOT_CODE) {
          return false;
        }
        return path.length === 2 || path.charCodeAt(2) === SLASH_CODE;
      };
      checkPath.isNotRelative = isNotRelative;
      checkPath.convert = (p) => p;
      var Ignore = class {
        constructor({
          ignorecase = true,
          ignoreCase = ignorecase,
          allowRelativePaths = false
        } = {}) {
          define(this, KEY_IGNORE, true);
          this._rules = new RuleManager(ignoreCase);
          this._strictPathCheck = !allowRelativePaths;
          this._initCache();
        }
        _initCache() {
          this._ignoreCache = /* @__PURE__ */ Object.create(null);
          this._testCache = /* @__PURE__ */ Object.create(null);
        }
        add(pattern) {
          if (this._rules.add(pattern)) {
            this._initCache();
          }
          return this;
        }
        // legacy
        addPattern(pattern) {
          return this.add(pattern);
        }
        // @returns {TestResult}
        _test(originalPath, cache) {
          const path = originalPath && checkPath.convert(originalPath);
          checkPath(
            path,
            originalPath,
            this._strictPathCheck ? throwError : RETURN_FALSE
          );
          return this._t(path, cache);
        }
        checkIgnore(path) {
          if (path.charCodeAt(path.length - 1) !== SLASH_CODE) {
            return this.test(path);
          }
          const dir = this._t(path, this._testCache);
          if (dir.ignored) {
            return dir;
          }
          const literal = this._rules.testLiteral(path);
          return literal.ignored || literal.unignored ? literal : dir;
        }
        _t(path, cache) {
          if (path in cache) {
            return cache[path];
          }
          const parentPath = parentOf(path);
          const parent = parentPath ? this._t(parentPath, cache) : UNDEFINED;
          return cache[path] = parent && parent.ignored ? parent : this._rules.test(path, MODE_IGNORE);
        }
        ignores(path) {
          return this._test(path, this._ignoreCache).ignored;
        }
        createFilter() {
          return (path) => !this.ignores(path);
        }
        filter(paths) {
          return makeArray(paths).filter(this.createFilter());
        }
        // @returns {TestResult}
        test(path) {
          return this._test(path, this._testCache);
        }
      };
      var factory = (options) => new Ignore(options);
      var isPathValid = (path) => checkPath(path && checkPath.convert(path), path, RETURN_FALSE);
      var setupWindows = () => {
        const makePosix = (str) => /^\\\\\?\\/.test(str) || /["<>|\u0000-\u001F]+/u.test(str) ? str : str.replace(/\\/g, "/");
        checkPath.convert = makePosix;
        const REGEX_TEST_WINDOWS_PATH_ABSOLUTE = /^[a-z]:\//i;
        checkPath.isNotRelative = (path) => REGEX_TEST_WINDOWS_PATH_ABSOLUTE.test(path) || isNotRelative(path);
      };
      if (
        // Detect `process` so that it can run in browsers.
        typeof process !== "undefined" && process.platform === "win32"
      ) {
        setupWindows();
      }
      module.exports = factory;
      factory.default = factory;
      module.exports.isPathValid = isPathValid;
      define(module.exports, /* @__PURE__ */ Symbol.for("setupWindows"), setupWindows);
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/isIgnored.js
  var require_isIgnored = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/isIgnored.js"(exports) {
      "use strict";
      var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
        function adopt(value) {
          return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
          });
        }
        return new (P || (P = Promise))(function(resolve, reject) {
          function fulfilled(value) {
            try {
              step(generator.next(value));
            } catch (e) {
              reject(e);
            }
          }
          function rejected(value) {
            try {
              step(generator["throw"](value));
            } catch (e) {
              reject(e);
            }
          }
          function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
          }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
      };
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.isIgnored = void 0;
      var file_1 = require_utils_file();
      var path_1 = __importDefault(require_path());
      var ignore_1 = __importDefault(require_ignore());
      var _1 = require_utils();
      var isIgnored = (fPath, configuration) => __awaiter(void 0, void 0, void 0, function* () {
        const config = configuration || (yield (0, _1.getLintConfig)());
        const projectRoot = yield (0, _1.getProjectRoot)();
        const gitIgnoreFilePath = path_1.default.join(projectRoot, ".gitignore");
        const relativePath = path_1.default.relative(projectRoot, fPath);
        if (relativePath === "")
          return false;
        if (path_1.default.isAbsolute(relativePath))
          return false;
        if (relativePath === ".." || relativePath.startsWith(`..${path_1.default.sep}`))
          return false;
        let gitIgnoreFileContent = "";
        if (yield (0, file_1.fileExists)(gitIgnoreFilePath))
          gitIgnoreFileContent = yield (0, file_1.readFile)(gitIgnoreFilePath);
        return (0, ignore_1.default)().add(gitIgnoreFileContent).add(config.ignoreList).ignores(relativePath);
      });
      exports.isIgnored = isIgnored;
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/listSasFiles.js
  var require_listSasFiles = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/listSasFiles.js"(exports) {
      "use strict";
      var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
        function adopt(value) {
          return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
          });
        }
        return new (P || (P = Promise))(function(resolve, reject) {
          function fulfilled(value) {
            try {
              step(generator.next(value));
            } catch (e) {
              reject(e);
            }
          }
          function rejected(value) {
            try {
              step(generator["throw"](value));
            } catch (e) {
              reject(e);
            }
          }
          function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
          }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.listSasFiles = void 0;
      var file_1 = require_utils_file();
      var listSasFiles = (folderPath) => __awaiter(void 0, void 0, void 0, function* () {
        const files = yield (0, file_1.listFilesInFolder)(folderPath);
        return files.filter((f) => f.endsWith(".sas"));
      });
      exports.listSasFiles = listSasFiles;
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/getIndicesOf.js
  var require_getIndicesOf = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/getIndicesOf.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.getIndicesOf = void 0;
      var getIndicesOf = (searchStr, str, caseSensitive = true) => {
        const searchStrLen = searchStr.length;
        if (searchStrLen === 0) {
          return [];
        }
        let startIndex = 0, index, indices = [];
        if (!caseSensitive) {
          str = str.toLowerCase();
          searchStr = searchStr.toLowerCase();
        }
        while ((index = str.indexOf(searchStr, startIndex)) > -1) {
          indices.push(index);
          startIndex = index + searchStrLen;
        }
        return indices;
      };
      exports.getIndicesOf = getIndicesOf;
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/getDataSectionsDetail.js
  var require_getDataSectionsDetail = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/getDataSectionsDetail.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.checkIsDataLine = exports.getDataSectionsDetail = void 0;
      var splitText_1 = require_splitText();
      var getDataSectionsDetail = (text, config) => {
        const dataSections = [];
        const lines = (0, splitText_1.splitText)(text, config);
        const dataSectionStartRegex1 = new RegExp("^(datalines;)|(cards;)|(parmcards;)");
        const dataSectionEndRegex1 = new RegExp(";");
        const dataSectionStartRegex2 = new RegExp("^(datalines4;)|(cards4;)|(parmcards4;)");
        const dataSectionEndRegex2 = new RegExp(";;;;");
        let dataSectionStarted = false;
        let dataSectionStartIndex = -1;
        let dataSectionEndRegex = dataSectionEndRegex1;
        lines.forEach((line, index) => {
          if (dataSectionStarted) {
            if (dataSectionEndRegex.test(line)) {
              dataSections.push({ start: dataSectionStartIndex, end: index });
              dataSectionStarted = false;
            }
          } else {
            if (dataSectionStartRegex1.test(line)) {
              dataSectionStarted = true;
              dataSectionStartIndex = index;
              dataSectionEndRegex = dataSectionEndRegex1;
            } else if (dataSectionStartRegex2.test(line)) {
              dataSectionStarted = true;
              dataSectionStartIndex = index;
              dataSectionEndRegex = dataSectionEndRegex2;
            }
          }
        });
        return dataSections;
      };
      exports.getDataSectionsDetail = getDataSectionsDetail;
      var checkIsDataLine = (dataSections, lineIndex) => {
        for (const dataSection of dataSections) {
          if (lineIndex >= dataSection.start && lineIndex <= dataSection.end)
            return true;
        }
        return false;
      };
      exports.checkIsDataLine = checkIsDataLine;
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/parseLintOverride.js
  var require_parseLintOverride = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/parseLintOverride.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.applyLintOverride = exports.getLintOverride = void 0;
      var getHeaderLinesCount_1 = require_getHeaderLinesCount();
      var splitText_1 = require_splitText();
      var marker = /^[^\w]*@sasjslint\s*\{/m;
      var readObject = (text, start) => {
        let depth = 0;
        let inString = false;
        let escaped = false;
        for (let index = start; index < text.length; index++) {
          const char = text[index];
          if (inString) {
            if (escaped)
              escaped = false;
            else if (char === "\\")
              escaped = true;
            else if (char === '"')
              inString = false;
            continue;
          }
          if (char === '"') {
            inString = true;
          } else if (char === "{") {
            depth++;
          } else if (char === "}") {
            depth--;
            if (depth === 0)
              return text.slice(start, index + 1);
          }
        }
        return null;
      };
      var getLintOverride = (text, config) => {
        if (!text)
          return null;
        const headerLinesCount = (0, getHeaderLinesCount_1.getHeaderLinesCount)(text, config);
        if (!headerLinesCount)
          return null;
        const header = (0, splitText_1.splitText)(text, config).slice(0, headerLinesCount).join("\n");
        const match = marker.exec(header);
        if (!match)
          return null;
        const brace = match.index + match[0].length - 1;
        const body = readObject(header, brace);
        if (!body)
          return null;
        try {
          return JSON.parse(body);
        } catch (_a) {
          return null;
        }
      };
      exports.getLintOverride = getLintOverride;
      var applyLintOverride = (text, config) => {
        const override = (0, exports.getLintOverride)(text, config);
        return override ? config.override(override) : config;
      };
      exports.applyLintOverride = applyLintOverride;
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/index.js
  var require_utils = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/utils/index.js"(exports) {
      "use strict";
      var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = { enumerable: true, get: function() {
            return m[k];
          } };
        }
        Object.defineProperty(o, k2, desc);
      }) : (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        o[k2] = m[k];
      }));
      var __exportStar = exports && exports.__exportStar || function(m, exports2) {
        for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      __exportStar(require_asyncForEach(), exports);
      __exportStar(require_getLintConfig(), exports);
      __exportStar(require_getProjectRoot(), exports);
      __exportStar(require_gremlinCharacters(), exports);
      __exportStar(require_isIgnored(), exports);
      __exportStar(require_listSasFiles(), exports);
      __exportStar(require_splitText(), exports);
      __exportStar(require_getPosition(), exports);
      __exportStar(require_splitLines(), exports);
      __exportStar(require_getIndicesOf(), exports);
      __exportStar(require_getHeaderLinesCount(), exports);
      __exportStar(require_getIndex(), exports);
      __exportStar(require_isDoxygenHeader(), exports);
      __exportStar(require_getDataSectionsDetail(), exports);
      __exportStar(require_defaultBannedStrings(), exports);
      __exportStar(require_defaultIgnoredMacros(), exports);
      __exportStar(require_escapeRegExp(), exports);
      __exportStar(require_getSeverity(), exports);
      __exportStar(require_headerMacros(), exports);
      __exportStar(require_mergeLintConfig(), exports);
      __exportStar(require_parseLibnames(), exports);
      __exportStar(require_parseLintOverride(), exports);
      __exportStar(require_parseMacroCallArguments(), exports);
      __exportStar(require_parseMacroCalls(), exports);
      __exportStar(require_sasMacros(), exports);
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/format/shared.js
  var require_shared = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/format/shared.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.processLine = exports.processText = void 0;
      var LineEndings_1 = require_LineEndings();
      var splitText_1 = require_splitText();
      var processText = (text, config) => {
        const processedText = processContent(config, text);
        const lines = (0, splitText_1.splitText)(processedText, config);
        const formattedLines = lines.map((line) => {
          return (0, exports.processLine)(config, line);
        });
        const configuredLineEnding = config.lineEndings === LineEndings_1.LineEndings.LF ? "\n" : "\r\n";
        return formattedLines.join(configuredLineEnding);
      };
      exports.processText = processText;
      var processContent = (config, content) => {
        let processedContent = content;
        config.fileLintRules.filter((r) => !!r.fix).forEach((rule) => {
          processedContent = rule.fix(processedContent, config);
        });
        return processedContent;
      };
      var processLine = (config, line) => {
        let processedLine = line;
        config.lineLintRules.filter((r) => !!r.fix).forEach((rule) => {
          processedLine = rule.fix(processedLine, config);
        });
        return processedLine;
      };
      exports.processLine = processLine;
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/format/formatText.js
  var require_formatText = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/format/formatText.js"(exports) {
      "use strict";
      var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
        function adopt(value) {
          return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
          });
        }
        return new (P || (P = Promise))(function(resolve, reject) {
          function fulfilled(value) {
            try {
              step(generator.next(value));
            } catch (e) {
              reject(e);
            }
          }
          function rejected(value) {
            try {
              step(generator["throw"](value));
            } catch (e) {
              reject(e);
            }
          }
          function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
          }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.formatText = void 0;
      var utils_1 = require_utils();
      var shared_1 = require_shared();
      var formatText2 = (text, configuration) => __awaiter(void 0, void 0, void 0, function* () {
        const config = configuration || (yield (0, utils_1.getLintConfig)());
        return (0, shared_1.processText)(text, (0, utils_1.applyLintOverride)(text, config));
      });
      exports.formatText = formatText2;
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/lint/shared.js
  var require_shared2 = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/lint/shared.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.processLine = exports.processFile = exports.processText = void 0;
      var utils_1 = require_utils();
      var utils_2 = require_utils();
      var processText = (text, config) => {
        const lines = (0, utils_1.splitText)(text, config);
        const headerLinesCount = (0, utils_1.getHeaderLinesCount)(text, config);
        const dataSections = (0, utils_2.getDataSectionsDetail)(text, config);
        const diagnostics = [];
        diagnostics.push(...processContent(config, text));
        lines.forEach((line, index) => {
          const isHeaderLine = index + 1 <= headerLinesCount;
          const isDataLine = (0, utils_2.checkIsDataLine)(dataSections, index);
          diagnostics.push(...(0, exports.processLine)(config, line, index + 1, { isHeaderLine, isDataLine }));
        });
        return diagnostics;
      };
      exports.processText = processText;
      var processFile = (filePath, config) => {
        const diagnostics = [];
        config.pathLintRules.forEach((rule) => {
          diagnostics.push(...rule.test(filePath, config));
        });
        return diagnostics;
      };
      exports.processFile = processFile;
      var processContent = (config, content) => {
        const diagnostics = [];
        config.fileLintRules.forEach((rule) => {
          diagnostics.push(...rule.test(content, config));
        });
        return diagnostics;
      };
      var processLine = (config, line, lineNumber, options) => {
        const diagnostics = [];
        config.lineLintRules.forEach((rule) => {
          diagnostics.push(...rule.test(line, lineNumber, config, options));
        });
        return diagnostics;
      };
      exports.processLine = processLine;
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/lint/lintText.js
  var require_lintText = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/lint/lintText.js"(exports) {
      "use strict";
      var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
        function adopt(value) {
          return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
          });
        }
        return new (P || (P = Promise))(function(resolve, reject) {
          function fulfilled(value) {
            try {
              step(generator.next(value));
            } catch (e) {
              reject(e);
            }
          }
          function rejected(value) {
            try {
              step(generator["throw"](value));
            } catch (e) {
              reject(e);
            }
          }
          function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
          }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.lintText = void 0;
      var utils_1 = require_utils();
      var shared_1 = require_shared2();
      var lintText2 = (text, configuration) => __awaiter(void 0, void 0, void 0, function* () {
        const config = configuration || (yield (0, utils_1.getLintConfig)());
        return (0, shared_1.processText)(text, (0, utils_1.applyLintOverride)(text, config));
      });
      exports.lintText = lintText2;
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/lint/lintFile.js
  var require_lintFile = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/lint/lintFile.js"(exports) {
      "use strict";
      var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
        function adopt(value) {
          return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
          });
        }
        return new (P || (P = Promise))(function(resolve, reject) {
          function fulfilled(value) {
            try {
              step(generator.next(value));
            } catch (e) {
              reject(e);
            }
          }
          function rejected(value) {
            try {
              step(generator["throw"](value));
            } catch (e) {
              reject(e);
            }
          }
          function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
          }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.lintFile = void 0;
      var file_1 = require_utils_file();
      var utils_1 = require_utils();
      var shared_1 = require_shared2();
      var lintFile = (filePath, configuration) => __awaiter(void 0, void 0, void 0, function* () {
        if (yield (0, utils_1.isIgnored)(filePath, configuration))
          return [];
        const config = configuration || (yield (0, utils_1.getLintConfig)());
        const text = yield (0, file_1.readFile)(filePath);
        const effectiveConfig = (0, utils_1.applyLintOverride)(text, config);
        const fileDiagnostics = (0, shared_1.processFile)(filePath, effectiveConfig);
        const textDiagnostics = (0, shared_1.processText)(text, effectiveConfig);
        return [...fileDiagnostics, ...textDiagnostics];
      });
      exports.lintFile = lintFile;
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/lint/lintFolder.js
  var require_lintFolder = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/lint/lintFolder.js"(exports) {
      "use strict";
      var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
        function adopt(value) {
          return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
          });
        }
        return new (P || (P = Promise))(function(resolve, reject) {
          function fulfilled(value) {
            try {
              step(generator.next(value));
            } catch (e) {
              reject(e);
            }
          }
          function rejected(value) {
            try {
              step(generator["throw"](value));
            } catch (e) {
              reject(e);
            }
          }
          function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
          }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
      };
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.lintFolder = void 0;
      var file_1 = require_utils_file();
      var path_1 = __importDefault(require_path());
      var utils_1 = require_utils();
      var lintFile_1 = require_lintFile();
      var excludeFolders = [
        ".git",
        ".github",
        ".vscode",
        "node_modules",
        "sasjsbuild",
        "sasjsresults"
      ];
      var lintFolder = (folderPath, configuration) => __awaiter(void 0, void 0, void 0, function* () {
        const config = configuration || (yield (0, utils_1.getLintConfig)());
        let diagnostics = /* @__PURE__ */ new Map();
        if (yield (0, utils_1.isIgnored)(folderPath, config))
          return diagnostics;
        const fileNames = yield (0, utils_1.listSasFiles)(folderPath);
        yield (0, utils_1.asyncForEach)(fileNames, (fileName) => __awaiter(void 0, void 0, void 0, function* () {
          const filePath = path_1.default.join(folderPath, fileName);
          diagnostics.set(filePath, yield (0, lintFile_1.lintFile)(filePath, config));
        }));
        const subFolders = (yield (0, file_1.listSubFoldersInFolder)(folderPath)).filter((f) => !excludeFolders.includes(f));
        yield (0, utils_1.asyncForEach)(subFolders, (subFolder) => __awaiter(void 0, void 0, void 0, function* () {
          const subFolderPath = path_1.default.join(folderPath, subFolder);
          const subFolderDiagnostics = yield (0, exports.lintFolder)(subFolderPath, config);
          diagnostics = new Map([...diagnostics, ...subFolderDiagnostics]);
        }));
        return diagnostics;
      });
      exports.lintFolder = lintFolder;
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/lint/lintProject.js
  var require_lintProject = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/lint/lintProject.js"(exports) {
      "use strict";
      var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
        function adopt(value) {
          return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
          });
        }
        return new (P || (P = Promise))(function(resolve, reject) {
          function fulfilled(value) {
            try {
              step(generator.next(value));
            } catch (e) {
              reject(e);
            }
          }
          function rejected(value) {
            try {
              step(generator["throw"](value));
            } catch (e) {
              reject(e);
            }
          }
          function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
          }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.lintProject = void 0;
      var getProjectRoot_1 = require_getProjectRoot();
      var lintFolder_1 = require_lintFolder();
      var lintProject = () => __awaiter(void 0, void 0, void 0, function* () {
        const projectRoot = (yield (0, getProjectRoot_1.getProjectRoot)()) || process.currentDir;
        if (!projectRoot) {
          throw new Error("SASjs Project Root was not found.");
        }
        console.info(`Linting all .sas files under ${projectRoot}`);
        return yield (0, lintFolder_1.lintFolder)(projectRoot);
      });
      exports.lintProject = lintProject;
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/lint/index.js
  var require_lint = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/lint/index.js"(exports) {
      "use strict";
      var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = { enumerable: true, get: function() {
            return m[k];
          } };
        }
        Object.defineProperty(o, k2, desc);
      }) : (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        o[k2] = m[k];
      }));
      var __exportStar = exports && exports.__exportStar || function(m, exports2) {
        for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      __exportStar(require_lintText(), exports);
      __exportStar(require_lintFile(), exports);
      __exportStar(require_lintFolder(), exports);
      __exportStar(require_lintProject(), exports);
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/format/formatFile.js
  var require_formatFile = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/format/formatFile.js"(exports) {
      "use strict";
      var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
        function adopt(value) {
          return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
          });
        }
        return new (P || (P = Promise))(function(resolve, reject) {
          function fulfilled(value) {
            try {
              step(generator.next(value));
            } catch (e) {
              reject(e);
            }
          }
          function rejected(value) {
            try {
              step(generator["throw"](value));
            } catch (e) {
              reject(e);
            }
          }
          function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
          }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.formatFile = void 0;
      var file_1 = require_utils_file();
      var lint_1 = require_lint();
      var parseLintOverride_1 = require_parseLintOverride();
      var getLintConfig_1 = require_getLintConfig();
      var shared_1 = require_shared();
      var formatFile = (filePath, configuration) => __awaiter(void 0, void 0, void 0, function* () {
        const config = configuration || (yield (0, getLintConfig_1.getLintConfig)());
        const diagnosticsBeforeFormat = yield (0, lint_1.lintFile)(filePath, config);
        const diagnosticsCountBeforeFormat = diagnosticsBeforeFormat.length;
        const text = yield (0, file_1.readFile)(filePath);
        const formattedText = (0, shared_1.processText)(text, (0, parseLintOverride_1.applyLintOverride)(text, config));
        yield (0, file_1.createFile)(filePath, formattedText);
        const diagnosticsAfterFormat = yield (0, lint_1.lintFile)(filePath, config);
        const diagnosticsCountAfterFormat = diagnosticsAfterFormat.length;
        const fixedDiagnosticsCount = diagnosticsCountBeforeFormat - diagnosticsCountAfterFormat;
        const updatedFilePaths = [];
        if (fixedDiagnosticsCount) {
          updatedFilePaths.push(filePath);
        }
        return {
          updatedFilePaths,
          fixedDiagnosticsCount,
          unfixedDiagnostics: diagnosticsAfterFormat
        };
      });
      exports.formatFile = formatFile;
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/format/formatFolder.js
  var require_formatFolder = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/format/formatFolder.js"(exports) {
      "use strict";
      var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
        function adopt(value) {
          return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
          });
        }
        return new (P || (P = Promise))(function(resolve, reject) {
          function fulfilled(value) {
            try {
              step(generator.next(value));
            } catch (e) {
              reject(e);
            }
          }
          function rejected(value) {
            try {
              step(generator["throw"](value));
            } catch (e) {
              reject(e);
            }
          }
          function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
          }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
      };
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.formatFolder = void 0;
      var file_1 = require_utils_file();
      var path_1 = __importDefault(require_path());
      var lint_1 = require_lint();
      var asyncForEach_1 = require_asyncForEach();
      var getLintConfig_1 = require_getLintConfig();
      var listSasFiles_1 = require_listSasFiles();
      var formatFile_1 = require_formatFile();
      var excludeFolders = [
        ".git",
        ".github",
        ".vscode",
        "node_modules",
        "sasjsbuild",
        "sasjsresults"
      ];
      var formatFolder = (folderPath, configuration) => __awaiter(void 0, void 0, void 0, function* () {
        const config = configuration || (yield (0, getLintConfig_1.getLintConfig)());
        const diagnosticsBeforeFormat = yield (0, lint_1.lintFolder)(folderPath);
        const diagnosticsCountBeforeFormat = Array.from(diagnosticsBeforeFormat.values()).reduce((a, b) => a + b.length, 0);
        const fileNames = yield (0, listSasFiles_1.listSasFiles)(folderPath);
        yield (0, asyncForEach_1.asyncForEach)(fileNames, (fileName) => __awaiter(void 0, void 0, void 0, function* () {
          const filePath = path_1.default.join(folderPath, fileName);
          yield (0, formatFile_1.formatFile)(filePath);
        }));
        const subFolders = (yield (0, file_1.listSubFoldersInFolder)(folderPath)).filter((f) => !excludeFolders.includes(f));
        yield (0, asyncForEach_1.asyncForEach)(subFolders, (subFolder) => __awaiter(void 0, void 0, void 0, function* () {
          yield (0, exports.formatFolder)(path_1.default.join(folderPath, subFolder), config);
        }));
        const diagnosticsAfterFormat = yield (0, lint_1.lintFolder)(folderPath);
        const diagnosticsCountAfterFormat = Array.from(diagnosticsAfterFormat.values()).reduce((a, b) => a + b.length, 0);
        const fixedDiagnosticsCount = diagnosticsCountBeforeFormat - diagnosticsCountAfterFormat;
        const updatedFilePaths = [];
        Array.from(diagnosticsBeforeFormat.keys()).forEach((filePath) => {
          const diagnosticsBefore = diagnosticsBeforeFormat.get(filePath) || [];
          const diagnosticsAfter = diagnosticsAfterFormat.get(filePath) || [];
          if (diagnosticsBefore.length !== diagnosticsAfter.length) {
            updatedFilePaths.push(filePath);
          }
        });
        return {
          updatedFilePaths,
          fixedDiagnosticsCount,
          unfixedDiagnostics: diagnosticsAfterFormat
        };
      });
      exports.formatFolder = formatFolder;
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/format/formatProject.js
  var require_formatProject = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/format/formatProject.js"(exports) {
      "use strict";
      var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
        function adopt(value) {
          return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
          });
        }
        return new (P || (P = Promise))(function(resolve, reject) {
          function fulfilled(value) {
            try {
              step(generator.next(value));
            } catch (e) {
              reject(e);
            }
          }
          function rejected(value) {
            try {
              step(generator["throw"](value));
            } catch (e) {
              reject(e);
            }
          }
          function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
          }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.formatProject = void 0;
      var getProjectRoot_1 = require_getProjectRoot();
      var formatFolder_1 = require_formatFolder();
      var formatProject = () => __awaiter(void 0, void 0, void 0, function* () {
        const projectRoot = (yield (0, getProjectRoot_1.getProjectRoot)()) || process.currentDir;
        if (!projectRoot) {
          throw new Error("SASjs Project Root was not found.");
        }
        console.info(`Formatting all .sas files under ${projectRoot}`);
        return yield (0, formatFolder_1.formatFolder)(projectRoot);
      });
      exports.formatProject = formatProject;
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/format/index.js
  var require_format = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/format/index.js"(exports) {
      "use strict";
      var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = { enumerable: true, get: function() {
            return m[k];
          } };
        }
        Object.defineProperty(o, k2, desc);
      }) : (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        o[k2] = m[k];
      }));
      var __exportStar = exports && exports.__exportStar || function(m, exports2) {
        for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      __exportStar(require_formatText(), exports);
      __exportStar(require_formatFile(), exports);
      __exportStar(require_formatFolder(), exports);
      __exportStar(require_formatProject(), exports);
    }
  });

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/index.js
  var require_lint2 = __commonJS({
    "../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/lint/index.js"(exports) {
      "use strict";
      var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = { enumerable: true, get: function() {
            return m[k];
          } };
        }
        Object.defineProperty(o, k2, desc);
      }) : (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        o[k2] = m[k];
      }));
      var __exportStar = exports && exports.__exportStar || function(m, exports2) {
        for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      __exportStar(require_format(), exports);
      __exportStar(require_lint(), exports);
      __exportStar(require_types(), exports);
      __exportStar(require_utils(), exports);
    }
  });

  // ../../../../../tmp/sasjs-lint-pENlXV/process.js
  if (typeof globalThis.process === "undefined")
    globalThis.process = {
      env: {},
      platform: "browser",
      cwd: () => "/",
      versions: {},
      argv: [],
      version: "v0"
    };

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/api/build/esm/code/service.js
  var import_lint = __toESM(require_lint2(), 1);

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/api/build/esm/types.js
  var ApiError = class extends Error {
    constructor(status, message, body) {
      super(message);
      this.status = status;
      this.body = body;
      this.apiError = true;
      this.name = "ApiError";
    }
  };

  // ../../../.npm/_npx/da6eb9014b5e0ef4/node_modules/@sasjs/api/build/esm/code/service.js
  var codeOf = (body) => {
    const value = body.code;
    if (value === void 0)
      throw new ApiError(400, '"code" is required');
    if (typeof value !== "string")
      throw new ApiError(400, '"code" must be a string');
    if (value === "")
      throw new ApiError(400, '"code" is not allowed to be empty');
    return value;
  };
  var createCodeService = (options = {}) => {
    const requireCaller = (caller) => {
      if (!caller)
        throw new ApiError(401, "Unauthorized");
    };
    const configFor = (filePath) => options.lintConfig ? options.lintConfig(filePath) : void 0;
    return {
      async lint(caller, body) {
        requireCaller(caller);
        return (0, import_lint.lintText)(codeOf(body), configFor(body.filePath));
      },
      async format(caller, body) {
        requireCaller(caller);
        return (0, import_lint.formatText)(codeOf(body), configFor(body.filePath));
      }
    };
  };

  // ../../../../../tmp/sasjs-lint-pENlXV/entry.js
  globalThis.SASjsCode = { createCodeService };
})();
