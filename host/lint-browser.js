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
  var __copyProps = (to2, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to2, key) && key !== except)
          __defProp(to2, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to2;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/asyncForEach.js
  var require_asyncForEach = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/asyncForEach.js"(exports) {
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

  // ../../../../../tmp/sasjs-lint-2sYn5U/path.js
  var require_path = __commonJS({
    "../../../../../tmp/sasjs-lint-2sYn5U/path.js"(exports, module) {
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
      var join3 = (...parts) => clean(parts.filter(Boolean).join("/"));
      module.exports = {
        sep: "/",
        delimiter: ":",
        basename,
        extname,
        dirname,
        join: join3,
        resolve: (...parts) => clean(parts.filter(Boolean).join("/")),
        relative: (from, to2) => clean(to2).replace(clean(from) + "/", ""),
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

  // ../../../../../tmp/sasjs-lint-2sYn5U/os.js
  var require_os = __commonJS({
    "../../../../../tmp/sasjs-lint-2sYn5U/os.js"(exports, module) {
      module.exports = {
        homedir: () => "/",
        platform: () => "browser",
        tmpdir: () => "/tmp",
        EOL: "\n"
      };
    }
  });

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/types/Diagnostic.js
  var require_Diagnostic = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/types/Diagnostic.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
    }
  });

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/types/FormatResult.js
  var require_FormatResult = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/types/FormatResult.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
    }
  });

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/types/FormatOptions.js
  var require_FormatOptions = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/types/FormatOptions.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
    }
  });

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/types/KeywordCase.js
  var require_KeywordCase = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/types/KeywordCase.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.KEYWORD_CASES = void 0;
      exports.KEYWORD_CASES = ["upper", "lower", "preserve"];
    }
  });

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/types/LintRule.js
  var require_LintRule = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/types/LintRule.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
    }
  });

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/types/LintRuleType.js
  var require_LintRuleType = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/types/LintRuleType.js"(exports) {
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/types/Severity.js
  var require_Severity = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/types/Severity.js"(exports) {
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/types/Macro.js
  var require_Macro = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/types/Macro.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
    }
  });

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/types/index.js
  var require_types = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/types/index.js"(exports) {
      "use strict";
      var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k2, k22) {
        if (k22 === void 0) k22 = k2;
        var desc = Object.getOwnPropertyDescriptor(m, k2);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = { enumerable: true, get: function() {
            return m[k2];
          } };
        }
        Object.defineProperty(o, k22, desc);
      }) : (function(o, m, k2, k22) {
        if (k22 === void 0) k22 = k2;
        o[k22] = m[k2];
      }));
      var __exportStar = exports && exports.__exportStar || function(m, exports2) {
        for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      __exportStar(require_Diagnostic(), exports);
      __exportStar(require_FormatResult(), exports);
      __exportStar(require_FormatOptions(), exports);
      __exportStar(require_KeywordCase(), exports);
      __exportStar(require_LintConfig(), exports);
      __exportStar(require_LintRule(), exports);
      __exportStar(require_LintRuleType(), exports);
      __exportStar(require_Severity(), exports);
      __exportStar(require_Macro(), exports);
    }
  });

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/types/LineEndings.js
  var require_LineEndings = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/types/LineEndings.js"(exports) {
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/splitLines.js
  var require_splitLines = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/splitLines.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.splitLines = void 0;
      var splitLines = (text) => text ? text.split(/\r\n|\n/) : [];
      exports.splitLines = splitLines;
    }
  });

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/getPosition.js
  var require_getPosition = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/getPosition.js"(exports) {
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/getSeverity.js
  var require_getSeverity = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/getSeverity.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.getSeverity = void 0;
      var getSeverity = (config, rule, fallback) => {
        var _a4, _b;
        return (_b = (_a4 = config === null || config === void 0 ? void 0 : config.severityLevel[rule]) !== null && _a4 !== void 0 ? _a4 : config === null || config === void 0 ? void 0 : config.defaultSeverity) !== null && _b !== void 0 ? _b : fallback;
      };
      exports.getSeverity = getSeverity;
    }
  });

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/file/hasDoxygenHeader.js
  var require_hasDoxygenHeader = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/file/hasDoxygenHeader.js"(exports) {
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
        var _a4;
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
              lineNumber: ((_a4 = value.split("/*")[0].match(/\r\n|\n/g)) !== null && _a4 !== void 0 ? _a4 : []).length + 1,
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/escapeRegExp.js
  var require_escapeRegExp = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/escapeRegExp.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.escapeRegExp = void 0;
      var escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      exports.escapeRegExp = escapeRegExp;
    }
  });

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/getColumnNumber.js
  var require_getColumnNumber = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/getColumnNumber.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.getColumnNumber = void 0;
      var escapeRegExp_1 = require_escapeRegExp();
      var getColumnNumber = (line3, text, caseInsensitive = false) => {
        const lastLine = line3.split("\n").pop();
        const index = caseInsensitive ? lastLine.search(new RegExp((0, escapeRegExp_1.escapeRegExp)(text), "i")) : lastLine.indexOf(text);
        if (index < 0) {
          throw new Error(`String '${text}' was not found in line '${line3}'`);
        }
        return index + 1;
      };
      exports.getColumnNumber = getColumnNumber;
    }
  });

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/maskingFunction.js
  var require_maskingFunction = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/maskingFunction.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.maskedArgumentEnd = exports.maskingFunctionStart = exports.argumentTextFunctionNames = exports.quotingFunctionNames = exports.callScannerMaskingFunctionStart = exports.maskingFunctionNames = exports.dataMaskingFunctionNames = void 0;
      exports.dataMaskingFunctionNames = "(?:nr)?(?:str|bquote|superq|quote)";
      exports.maskingFunctionNames = `(?:${exports.dataMaskingFunctionNames}|(?:nr)?unquote)`;
      exports.callScannerMaskingFunctionStart = new RegExp(`^%(?:${exports.dataMaskingFunctionNames}|nrunquote)\\s*\\(`, "i");
      exports.quotingFunctionNames = "qsysfunc|qcmpres|qleft|qlowcase|qscan|qsubstr|qtrim|qupcase|qverify";
      exports.argumentTextFunctionNames = `${exports.maskingFunctionNames}|${exports.quotingFunctionNames}`;
      exports.maskingFunctionStart = new RegExp(`^%${exports.maskingFunctionNames}\\s*\\(`, "i");
      var maskedArgumentEnd = (text, start) => {
        let depth = 1;
        for (let index = start; index < text.length; index++) {
          if (text[index] === "%" && (text[index + 1] === "(" || text[index + 1] === ")")) {
            index++;
            continue;
          }
          if (text[index] === "(")
            depth++;
          else if (text[index] === ")") {
            depth--;
            if (depth === 0)
              return index + 1;
          }
        }
        return text.length;
      };
      exports.maskedArgumentEnd = maskedArgumentEnd;
    }
  });

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/trimComments.js
  var require_trimComments = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/trimComments.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.trimComments = void 0;
      var maskingFunction_1 = require_maskingFunction();
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
          if (character === "%" && quote !== "'") {
            const maskingFunction = maskingFunction_1.maskingFunctionStart.exec(text.slice(index));
            if (maskingFunction) {
              const end = (0, maskingFunction_1.maskedArgumentEnd)(text, index + maskingFunction[0].length);
              result += text.slice(index, end);
              index = end - 1;
              continue;
            }
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/parseMacros.js
  var require_parseMacros = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/parseMacros.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.parseMacros = void 0;
      var trimComments_1 = require_trimComments();
      var splitLines_1 = require_splitLines();
      var maskingFunction_1 = require_maskingFunction();
      var macroStatement = /^%macro\b/i;
      var mendStatement = /^%mend\b/i;
      var declarationName = /^%macro\b\s*([^\s(;/]*)/i;
      var mendName = /^%mend\b\s*([^\s;]*)/i;
      var getName = (statement, pattern) => {
        const match = pattern.exec(statement);
        return match ? match[1].trim() : "";
      };
      var splitAtMend = (statement, quoteBefore) => {
        let quote = quoteBefore;
        for (let at3 = 0; at3 < statement.length; at3++) {
          const character = statement[at3];
          if (character === "%" && quote !== "'") {
            const mask = maskingFunction_1.maskingFunctionStart.exec(statement.slice(at3));
            if (mask) {
              at3 = (0, maskingFunction_1.maskedArgumentEnd)(statement, at3 + mask[0].length) - 1;
              continue;
            }
          }
          if (quote) {
            if (character === quote)
              quote = "";
            continue;
          }
          if (character === "'" || character === '"') {
            quote = character;
            continue;
          }
          if (at3 > 0 && /^%mend\b/i.test(statement.slice(at3))) {
            return [statement.slice(0, at3), ...splitAtMend(statement.slice(at3), "")];
          }
        }
        return [statement];
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
        lines.forEach((line3, lineIndex) => {
          const stateBeforeLine = isCommentStarted;
          const quoteBeforeLine = isQuoteStarted;
          const { statement: trimmedLine, commentStarted: stateAfterLine, quoteStarted: quoteAfterLine } = (0, trimComments_1.trimComments)(line3, stateBeforeLine, false, isQuoteStarted);
          isCommentStarted = stateAfterLine;
          isQuoteStarted = quoteAfterLine;
          isStatementContinues = !trimmedLine.endsWith(";");
          let quoteBeforeStatement = quoteBeforeLine;
          const statements = trimmedLine.split(";").flatMap((statement) => {
            const split = splitAtMend(statement, quoteBeforeStatement);
            quoteBeforeStatement = (0, trimComments_1.trimComments)(statement, false, false, quoteBeforeStatement).quoteStarted;
            return split;
          });
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
              tempMacroDeclarationLines.push(line3);
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
                tempMacroDeclarationLines = [line3];
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
                declarationLines: [line3],
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
                macro.terminationLine = line3;
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
                  terminationLine: line3,
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/file/hasMacroNameInMend.js
  var require_hasMacroNameInMend = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/file/hasMacroNameInMend.js"(exports) {
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/getIndex.js
  var require_getIndex = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/getIndex.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.getIndex = void 0;
      var splitLines_1 = require_splitLines();
      var getIndex = (text, lineNumber, columnNumber) => {
        if (lineNumber <= 1)
          return Math.max(columnNumber - 1, 0);
        const lines = (0, splitLines_1.splitLines)(text);
        let index = 0;
        for (let line3 = 1; line3 < lineNumber && line3 <= lines.length; line3++) {
          const terminator = text.startsWith("\r\n", index + lines[line3 - 1].length) ? 2 : 1;
          index += lines[line3 - 1].length + terminator;
        }
        return Math.min(index + Math.max(columnNumber - 1, 0), text.length);
      };
      exports.getIndex = getIndex;
    }
  });

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/file/hasMacroParentheses.js
  var require_hasMacroParentheses = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/file/hasMacroParentheses.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.hasMacroParentheses = void 0;
      var LintRuleType_1 = require_LintRuleType();
      var Severity_1 = require_Severity();
      var getColumnNumber_1 = require_getColumnNumber();
      var getIndex_1 = require_getIndex();
      var parseMacros_1 = require_parseMacros();
      var utils_1 = require_utils();
      var getSeverity_1 = require_getSeverity();
      var name = "hasMacroParentheses";
      var description = "Enforces the presence of parentheses in macro definitions.";
      var message = "Macro definition missing parentheses";
      var parameterlessDeclaration = (macroName) => new RegExp(`(%macro\\s+${(0, utils_1.escapeRegExp)(macroName)})((?:\\s*/\\*.*?\\*/)?\\s*;)`, "i");
      var nameLine = (macro) => macro.declarationLines.findIndex((declarationLine) => declarationLine.includes(macro.name));
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
          const start = (0, getIndex_1.getIndex)(text, lineNumber, 1);
          const end = (0, getIndex_1.getIndex)(text, lineNumber + 1, 1);
          const line3 = text.slice(start, end);
          const pattern = parameterlessDeclaration(macro.name);
          if (!pattern.test(line3))
            return text;
          return text.slice(0, start) + line3.replace(pattern, "$1()$2") + text.slice(end);
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/file/lineEndings.js
  var require_lineEndings = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/file/lineEndings.js"(exports) {
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
        lines.forEach((line3, index) => {
          if (line3.endsWith(incorrectLineEnding)) {
            diagnostics.push({
              message: message.replace("{expected}", expectedLineEnding === "{lf}" ? "LF" : "CRLF").replace("{actual}", incorrectLineEnding === "{lf}" ? "LF" : "CRLF"),
              lineNumber: index + 1 + indexOffset,
              startColumnNumber: line3.indexOf(incorrectLineEnding) + 1,
              endColumnNumber: line3.indexOf(incorrectLineEnding) + (incorrectLineEnding === "{crlf}" ? 2 : 1),
              severity
            });
          } else {
            const splitLine = line3.split(new RegExp(`(?<=${incorrectLineEnding})`));
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/file/minMacroNameLength.js
  var require_minMacroNameLength = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/file/minMacroNameLength.js"(exports) {
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
      var commentSpans = (line3) => {
        const spans = [];
        let inString = false;
        let start = -1;
        for (let index = 0; index < line3.length; index++) {
          const char = line3[index];
          if (char === "'") {
            inString = !inString;
          } else if (!inString && char === "/" && line3[index + 1] === "*") {
            start = index;
            index++;
          } else if (!inString && char === "*" && line3[index + 1] === "/" && start > -1) {
            spans.push([start, index + 2]);
            start = -1;
            index++;
          }
        }
        if (start > -1)
          spans.push([start, line3.length]);
        return spans;
      };
      var inComment = (line3, index) => {
        const spans = commentSpans(line3);
        return spans.some(([start, end]) => index > start && index < end);
      };
      var test = (value, config) => {
        var _a4;
        const severity = (0, getSeverity_1.getSeverity)(config, name, Severity_1.Severity.Warning);
        const minimum = (_a4 = config === null || config === void 0 ? void 0 : config.minMacroNameLength) !== null && _a4 !== void 0 ? _a4 : 3;
        if (minimum < 2)
          return [];
        const lines = (0, splitLines_1.splitLines)(value);
        const cfg = config || new types_1.LintConfig();
        const dataSections = (0, utils_1.getDataSectionsDetail)(value, cfg);
        const seen = /* @__PURE__ */ new Map();
        return (0, parseMacros_1.parseMacros)(value, cfg).filter((macro) => {
          var _a5;
          return macro.name && ((_a5 = macro.startLineNumbers) === null || _a5 === void 0 ? void 0 : _a5.length);
        }).filter((macro) => macro.name.length < minimum).filter((macro) => !(0, utils_1.checkIsDataLine)(dataSections, macro.startLineNumbers[0] - 1)).map((macro) => {
          var _a5;
          const lineNumber = macro.startLineNumbers[0];
          const line3 = lines[lineNumber - 1] || "";
          const key = `${lineNumber}:${macro.name.toLowerCase()}`;
          const occurrence = (_a5 = seen.get(key)) !== null && _a5 !== void 0 ? _a5 : 0;
          seen.set(key, occurrence + 1);
          const matches = [
            ...line3.matchAll(new RegExp(`%macro\\s+${(0, utils_1.escapeRegExp)(macro.name)}\\b`, "gi"))
          ].filter((match) => !inComment(line3, match.index));
          const declaration = matches[occurrence];
          const startColumnNumber = declaration ? declaration.index + 1 : (0, getColumnNumber_1.getColumnNumber)(line3, "%macro", true);
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/parseMacroCalls.js
  var require_parseMacroCalls = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/parseMacroCalls.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.parseMacroCalls = void 0;
      var maskingFunction_1 = require_maskingFunction();
      var macroNameStart = /^%([a-z_][a-z0-9_]*)/i;
      var dataSectionStart = /^(datalines4?|cards4?|parmcards4?)\s*;/i;
      var embeddedLanguageProc = /^proc\s+(lua|groovy)\b/i;
      var embeddedLanguageEnd = /^endsubmit\s*;/i;
      var embeddedLanguageEndSearch = /endsubmit/i;
      var findNameTokens = (text, from, to2) => {
        const tokens = [];
        let index = from;
        while (index < to2) {
          if (text[index] === "%") {
            if (text[index + 1] === "(" || text[index + 1] === ")") {
              index += 2;
              continue;
            }
            const macroName = macroNameStart.exec(text.slice(index, to2));
            if (macroName) {
              const after = text.slice(index + macroName[0].length, to2);
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
            const maskingFunction = maskingFunction_1.callScannerMaskingFunctionStart.exec(text.slice(index));
            if (maskingFunction) {
              const end = (0, maskingFunction_1.maskedArgumentEnd)(text, index + maskingFunction[0].length);
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/file/noMacroIfInOpenCode.js
  var require_noMacroIfInOpenCode = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/file/noMacroIfInOpenCode.js"(exports) {
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
        var _a4;
        return {
          firstLine: macro.startLineNumbers[0],
          // A definition with no `%mend` keeps reading to the end of the file, so
          // nothing after its declaration is open code - SAS reads it as the macro
          // body, and reporting it as open code would point at a fix that is not
          // the one the file needs.
          lastLine: (_a4 = macro.endLineNumber) !== null && _a4 !== void 0 ? _a4 : Number.POSITIVE_INFINITY
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/sasMacros.generated.js
  var require_sasMacros_generated = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/sasMacros.generated.js"(exports) {
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/sasMacros.js
  var require_sasMacros = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/sasMacros.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.isSasMacro = exports.sasMacros = void 0;
      var sasMacros_generated_1 = require_sasMacros_generated();
      exports.sasMacros = new Set(sasMacros_generated_1.sasMacros);
      var isSasMacro = (name) => exports.sasMacros.has(name.toLowerCase());
      exports.isSasMacro = isSasMacro;
    }
  });

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/parseMacroCallArguments.js
  var require_parseMacroCallArguments = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/parseMacroCallArguments.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.parseMacroCallArguments = exports.hasMaskedName = void 0;
      var getIndex_1 = require_getIndex();
      var maskingFunction_1 = require_maskingFunction();
      var maskingFunction = new RegExp(`%(?:${maskingFunction_1.argumentTextFunctionNames})\\s*\\(`, "iy");
      var keywordParameter = /^\s*(?:&+[a-z_][a-z0-9_.]*|[a-z_][a-z0-9_]*)\s*=/i;
      var leadingComment = /^(?:\s*\/\*[\s\S]*?\*\/)*\s*/;
      var skipMasked = (text, openParen) => (0, maskingFunction_1.maskedArgumentEnd)(text, openParen + 1);
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/file/noMalformedMacroCalls.js
  var require_noMalformedMacroCalls = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/file/noMalformedMacroCalls.js"(exports) {
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
        const at3 = (start, end, reason) => {
          const from = (0, getPosition_1.getPosition)(value, start);
          const to2 = (0, getPosition_1.getPosition)(value, end);
          return {
            message: message.replace("{reason}", reason),
            lineNumber: from.lineNumber,
            startColumnNumber: from.columnNumber,
            endColumnNumber: to2.columnNumber,
            severity
          };
        };
        (0, parseMacroCalls_1.parseMacroCalls)(value, config).filter((call) => !call.quoted && !(0, sasMacros_1.isSasMacro)(call.name)).forEach((call) => {
          const args = (0, parseMacroCallArguments_1.parseMacroCallArguments)(value, call);
          if (!args)
            return;
          const callStart = (0, getIndex_1.getIndex)(value, call.lineNumber, call.startColumnNumber);
          if (args.unclosed) {
            diagnostics.push(at3(callStart, callStart + call.name.length + 1, reasons[args.unclosed]));
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
              diagnostics.push(at3(textStart, textEnd, reasons.maskedName));
              return;
            }
            if (quotedParameterName.test(stray.text)) {
              diagnostics.push(at3(textStart, textEnd, reasons.quotedName));
              return;
            }
            if (!visible) {
              diagnostics.push(at3(Math.max(stray.start - 1, 0), stray.start, reasons.empty));
              return;
            }
            diagnostics.push(at3(textStart, textEnd, reasons.spill.replace("%s", visible)));
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/file/noNestedCommentsInHeader.js
  var require_noNestedCommentsInHeader = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/file/noNestedCommentsInHeader.js"(exports) {
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/file/noNestedMacros.js
  var require_noNestedMacros = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/file/noNestedMacros.js"(exports) {
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/file/noXcmd.js
  var require_noXcmd = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/file/noXcmd.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.noXcmd = void 0;
      var LintRuleType_1 = require_LintRuleType();
      var Severity_1 = require_Severity();
      var utils_1 = require_utils();
      var getSeverity_1 = require_getSeverity();
      var maskingFunction_1 = require_maskingFunction();
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
        let maskedEnd = -1;
        let index = 0;
        const blank = (position) => {
          if (text[position] !== "\n")
            characters[position] = " ";
        };
        while (index < text.length) {
          const character = text[index];
          const next = text[index + 1];
          if (index < maskedEnd) {
            if (quote) {
              if (character !== "\n")
                characters[index] = "_";
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
            continue;
          }
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
          if (character === "%" && quote !== "'") {
            const maskingFunction = maskingFunction_1.maskingFunctionStart.exec(text.slice(index));
            if (maskingFunction) {
              maskedEnd = (0, maskingFunction_1.maskedArgumentEnd)(text, index + maskingFunction[0].length);
              index += maskingFunction[0].length;
              continue;
            }
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
        var _a4;
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
          const to2 = (_a4 = lineStarts[end + 1]) !== null && _a4 !== void 0 ? _a4 : text.length;
          for (let index = from; index < to2; index++) {
            if (characters[index] !== "\n")
              characters[index] = " ";
          }
        }
        return characters.join("");
      };
      var getTokens = (code, from, to2) => {
        const tokens = [];
        let index = from;
        while (index < to2) {
          if (/\s/.test(code[index])) {
            index++;
            continue;
          }
          const start = index;
          while (index < to2 && !/\s/.test(code[index]))
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
        var _a4, _b;
        const before = code.slice(0, index).trimEnd();
        const lastCharacter = before[before.length - 1];
        if (lastCharacter === ".")
          return true;
        const prefix = lastCharacter === "=" ? before.slice(0, -1).trimEnd() : before;
        const keyword = (_b = (_a4 = /([A-Za-z_][A-Za-z0-9_]*)$/.exec(prefix)) === null || _a4 === void 0 ? void 0 : _a4[1]) !== null && _b !== void 0 ? _b : "";
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
            const to2 = match.index + match[0].length;
            const from = to2 - match[1].length;
            getTokens(code, from, to2).filter((token) => token.value.toLowerCase() === "xcmd").forEach((token) => found.push({ index: token.index, length: token.value.length }));
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
            const to2 = match.index + match[0].length;
            const tokens = getTokens(code, to2 - match[2].length, to2);
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
        return findings.sort((a, b2) => a.index - b2.index || b2.length - a.length).filter((finding) => {
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
        return removeNested(findings).sort((a, b2) => a.index - b2.index || a.length - b2.length).map((finding) => {
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/splitText.js
  var require_splitText = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/splitText.js"(exports) {
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/getHeaderLinesCount.js
  var require_getHeaderLinesCount = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/getHeaderLinesCount.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.getHeaderLinesCount = void 0;
      var splitText_1 = require_splitText();
      var getHeaderLinesCount = (text, config) => {
        let count = 0;
        if (text.trimStart().startsWith("/*")) {
          const lines = (0, splitText_1.splitText)(text, config);
          for (const line3 of lines) {
            count++;
            if (line3.match(/\*\//)) {
              break;
            }
          }
        }
        return count;
      };
      exports.getHeaderLinesCount = getHeaderLinesCount;
    }
  });

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/headerMacros.js
  var require_headerMacros = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/headerMacros.js"(exports) {
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
      var getLineTag = (line3) => {
        const match = lineTag.exec(line3);
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
          const line3 = lines[index];
          if (line3.trim() === "") {
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
          const parsed = parseListItem(line3);
          if (!parsed) {
            const tag = getLineTag(line3);
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
          const line3 = lines[index];
          if (!sasMacrosHeader.test(line3))
            continue;
          const tagEnd = line3.indexOf(headerTag) + headerTag.length;
          const trailing = parseListItem(line3.slice(tagEnd), tagEnd);
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
      var formatEntry = (entry, indent3) => `${indent3}@li ${entry.payload}`;
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
          const hasSection = lines.slice(0, headerLinesCount).some((line3) => sasMacrosHeader.test(line3));
          if (hasSection || headerEndIndex === 0)
            return text;
          const indent4 = getHeaderIndent(lines, headerLinesCount);
          const sectionLines = [
            `${indent4}<h4> SAS Macros </h4>`,
            ...macros.map((macro) => `${indent4}@li ${macro}.sas`)
          ];
          const result2 = [
            ...lines.slice(0, headerEndIndex),
            ...sectionLines,
            ...lines.slice(headerEndIndex)
          ];
          return withSectionSpacing(result2, headerEndIndex, headerEndIndex + sectionLines.length).join(lineEnding);
        }
        const { sectionIndex, entries, end } = section;
        const indent3 = lines[sectionIndex].match(/^\s*/)[0];
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
        const sortedLines = [...byName.values()].sort((a, b2) => compareMacroNames(a.name, b2.name)).map((entry) => `${indent3}@li ${entry.payload}`);
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
        const indent3 = lines[sectionIndex].match(/^\s*/)[0];
        const lineEnding = config.lineEndings === LineEndings_1.LineEndings.CRLF ? "\r\n" : "\n";
        const repaired = [...lines];
        let changed = false;
        entries.forEach((entry) => {
          const index = entry.lineNumber - 1;
          const formatted = formatEntry(entry, indent3);
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
        const indent3 = lines[sectionIndex].match(/^\s*/)[0];
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
          kept.push(formatEntry(entry, indent3));
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
      var compareMacroNames = (a, b2) => a.toLowerCase().localeCompare(b2.toLowerCase());
    }
  });

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/isDoxygenHeader.js
  var require_isDoxygenHeader = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/isDoxygenHeader.js"(exports) {
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
          const line3 = lines[index];
          if (line3.trim() === doxygenHeaderClose)
            return true;
          if (line3.includes("*/"))
            return false;
        }
        return false;
      };
      exports.isDoxygenHeader = isDoxygenHeader;
    }
  });

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/file/noUndeclaredMacros.js
  var require_noUndeclaredMacros = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/file/noUndeclaredMacros.js"(exports) {
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
          var _a4;
          const key = call.name.toLowerCase();
          if (seen.has(key))
            return;
          seen.add(key);
          if (call.name.length < ((_a4 = config.minMacroNameLength) !== null && _a4 !== void 0 ? _a4 : 3))
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/file/noUnusedMacros.js
  var require_noUnusedMacros = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/file/noUnusedMacros.js"(exports) {
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/parseLibnames.js
  var require_parseLibnames = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/parseLibnames.js"(exports) {
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
        const blank = (from, to2) => {
          for (let at3 = from; at3 < to2 && at3 < length; at3++) {
            if (chars[at3] !== "\n")
              chars[at3] = " ";
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
            for (let at3 = index; at3 < end; at3++) {
              if (chars[at3] === ";")
                chars[at3] = " ";
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
          for (let at3 = start; at3 < end && at3 < chars.length; at3++) {
            if (chars[at3] !== "\n")
              chars[at3] = " ";
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
        let line3 = 0;
        while (line3 + 1 < starts.length && starts[line3 + 1] <= offset)
          line3++;
        return { lineNumber: line3 + 1, columnNumber: offset - starts[line3] + 1 };
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/file/noUnusedLibnames.js
  var require_noUnusedLibnames = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/file/noUnusedLibnames.js"(exports) {
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/file/strictMacroDefinition.js
  var require_strictMacroDefinition = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/file/strictMacroDefinition.js"(exports) {
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
        var _a4, _b, _c;
        let optionsPresent = (_b = (_a4 = _declaration.split("/")) === null || _a4 === void 0 ? void 0 : _a4[1]) === null || _b === void 0 ? void 0 : _b.trim();
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/file/hasRequiredMacroOptions.js
  var require_hasRequiredMacroOptions = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/file/hasRequiredMacroOptions.js"(exports) {
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
        var _a4, _b, _c;
        const optionsPresent = (_c = (_b = (_a4 = macro.declaration.split("/")) === null || _a4 === void 0 ? void 0 : _a4[1]) === null || _b === void 0 ? void 0 : _b.trim()) !== null && _c !== void 0 ? _c : "";
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/file/noSingleAsteriskComments.js
  var require_noSingleAsteriskComments = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/file/noSingleAsteriskComments.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.noSingleAsteriskComments = void 0;
      var LintRuleType_1 = require_LintRuleType();
      var Severity_1 = require_Severity();
      var getSeverity_1 = require_getSeverity();
      var maskingFunction_1 = require_maskingFunction();
      var name = "noSingleAsteriskComments";
      var description = "Disallow comment statements that begin with a single asterisk (*).";
      var message = "Line contains a single asterisk comment";
      var dataSectionStart = /^(datalines4?|cards4?|parmcards4?)\s*;/i;
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
          const maskingFunction = maskingFunction_1.maskingFunctionStart.exec(value.slice(index));
          if (maskingFunction) {
            advanceTo((0, maskingFunction_1.maskedArgumentEnd)(value, index + maskingFunction[0].length));
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/file/lowerCaseMacroNames.js
  var require_lowerCaseMacroNames = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/file/lowerCaseMacroNames.js"(exports) {
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
          const line3 = lines[index];
          const start = macro.startColumnNumber - 1;
          const end = start + macro.name.length;
          lines[index] = line3.slice(0, start) + line3.slice(start, end).toLowerCase() + line3.slice(end);
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
        const line3 = lines[index];
        const found = findName(line3, tag);
        if (!found || found.macro === found.macro.toLowerCase())
          return;
        const start = found.column - 1;
        lines[index] = line3.slice(0, start) + line3.slice(start, start + found.macro.length).toLowerCase() + line3.slice(start + found.macro.length);
      };
      var findName = (line3, tag) => {
        const match = new RegExp(`${escape(tag)}\\s+([\\w]+)`, "i").exec(line3);
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/file/index.js
  var require_file = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/file/index.js"(exports) {
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/line/noBannedStrings.js
  var require_noBannedStrings = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/line/noBannedStrings.js"(exports) {
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
        const patterns = [...bannedStrings].sort((a, b2) => b2.length - a.length);
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
        return diagnostics.sort((a, b2) => a.startColumnNumber - b2.startColumnNumber);
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/line/noGremlins.js
  var require_noGremlins = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/line/noGremlins.js"(exports) {
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/line/indentationMultiple.js
  var require_indentationMultiple = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/line/indentationMultiple.js"(exports) {
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/line/maxLineLength.js
  var require_maxLineLength = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/line/maxLineLength.js"(exports) {
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/line/noEncodedPasswords.js
  var require_noEncodedPasswords = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/line/noEncodedPasswords.js"(exports) {
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/line/noTabs.js
  var require_noTabs = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/line/noTabs.js"(exports) {
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
        var _a4, _b, _c;
        const severity = (_c = (_b = (_a4 = config === null || config === void 0 ? void 0 : config.severityLevel[name]) !== null && _a4 !== void 0 ? _a4 : config === null || config === void 0 ? void 0 : config.severityLevel[alias]) !== null && _b !== void 0 ? _b : config === null || config === void 0 ? void 0 : config.defaultSeverity) !== null && _c !== void 0 ? _c : Severity_1.Severity.Warning;
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/line/noTrailingSpaces.js
  var require_noTrailingSpaces = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/line/noTrailingSpaces.js"(exports) {
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/line/index.js
  var require_line = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/line/index.js"(exports) {
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/path/lowerCaseFileNames.js
  var require_lowerCaseFileNames = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/path/lowerCaseFileNames.js"(exports) {
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/path/noSpacesInFileNames.js
  var require_noSpacesInFileNames = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/path/noSpacesInFileNames.js"(exports) {
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/path/index.js
  var require_path2 = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/rules/path/index.js"(exports) {
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/mergeLintConfig.js
  var require_mergeLintConfig = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/mergeLintConfig.js"(exports) {
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/types/LintConfig.js
  var require_LintConfig = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/types/LintConfig.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.LintConfig = void 0;
      var file_1 = require_file();
      var line_1 = require_line();
      var path_1 = require_path2();
      var LineEndings_1 = require_LineEndings();
      var KeywordCase_1 = require_KeywordCase();
      var utils_1 = require_utils();
      var mergeLintConfig_1 = require_mergeLintConfig();
      var Severity_1 = require_Severity();
      var LintConfig2 = class _LintConfig {
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
          this.keywordCase = "preserve";
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
          if ((json === null || json === void 0 ? void 0 : json.keywordCase) !== void 0) {
            const value = json.keywordCase;
            if (!KeywordCase_1.KEYWORD_CASES.includes(value)) {
              throw new Error(`Property "keywordCase" can only be "upper", "lower" or "preserve".`);
            }
            this.keywordCase = value;
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
      exports.LintConfig = LintConfig2;
    }
  });

  // ../../../../../tmp/sasjs-lint-2sYn5U/utils-file.js
  var require_utils_file = __commonJS({
    "../../../../../tmp/sasjs-lint-2sYn5U/utils-file.js"(exports, module) {
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/getProjectRoot.js
  var require_getProjectRoot = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/getProjectRoot.js"(exports) {
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/defaultBannedStrings.js
  var require_defaultBannedStrings = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/defaultBannedStrings.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.defaultBannedStrings = void 0;
      exports.defaultBannedStrings = ["error ", "error:", "warning ", "warning:"];
    }
  });

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/defaultIgnoredMacros.js
  var require_defaultIgnoredMacros = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/defaultIgnoredMacros.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.defaultIgnoredMacros = void 0;
      exports.defaultIgnoredMacros = ["webout"];
    }
  });

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/getLintConfig.js
  var require_getLintConfig = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/getLintConfig.js"(exports) {
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
      exports.parseLintConfig = exports.lintSchemaUrl = exports.DefaultLintConfiguration = exports.getDefaultHeader = void 0;
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
        keywordCase: "preserve",
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
          const lintFilePath = path_1.default.join(lintFileLocation, ".sasjslint");
          const configuration = yield (0, file_1.readFile)(lintFilePath).catch((_) => null);
          if (configuration === null) {
            return new LintConfig_1.LintConfig(exports.DefaultLintConfiguration);
          }
          return new LintConfig_1.LintConfig((0, exports.parseLintConfig)(configuration, lintFilePath));
        });
      }
      exports.lintSchemaUrl = "https://raw.githubusercontent.com/sasjs/lint/main/sasjslint-schema.json";
      var parseLintConfig = (configuration, filePath) => {
        try {
          return JSON.parse(configuration);
        } catch (error) {
          const reason = error instanceof Error ? error.message : String(error);
          throw new Error(`${filePath} is not valid JSON (${reason}).
The file is read as strict JSON, so it cannot carry comments. Every setting, its type and its default are documented in the schema: ` + exports.lintSchemaUrl);
        }
      };
      exports.parseLintConfig = parseLintConfig;
    }
  });

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/gremlinCharacters.js
  var require_gremlinCharacters = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/gremlinCharacters.js"(exports) {
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/ignore/index.js
  var require_ignore = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/ignore/index.js"(exports, module) {
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
            let to2 = pattern[index];
            if (to2 === ESCAPE) {
              to2 = pattern[index += 1];
            }
            if (prev <= to2) {
              body += `-${escapeMember(to2)}`;
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
      var separatorAfter = (run, at3) => {
        let separator = EMPTY;
        for (let index = at3 + 1; index < run.length && !run[index].wildcard; index++) {
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
          run.forEach((token, at3) => {
            if (token.wildcard) {
              lastWildcard = at3;
            }
          });
          run.forEach((token, at3) => {
            if (!token.wildcard) {
              out += token.single;
              return;
            }
            out += at3 === lastWildcard ? WILDCARD : `(?:(?!${separatorAfter(run, at3)})[^\\/])*`;
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
        _test(originalPath, cache2) {
          const path = originalPath && checkPath.convert(originalPath);
          checkPath(
            path,
            originalPath,
            this._strictPathCheck ? throwError : RETURN_FALSE
          );
          return this._t(path, cache2);
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
        _t(path, cache2) {
          if (path in cache2) {
            return cache2[path];
          }
          const parentPath = parentOf(path);
          const parent = parentPath ? this._t(parentPath, cache2) : UNDEFINED;
          return cache2[path] = parent && parent.ignored ? parent : this._rules.test(path, MODE_IGNORE);
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/isIgnored.js
  var require_isIgnored = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/isIgnored.js"(exports) {
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/listSasFiles.js
  var require_listSasFiles = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/listSasFiles.js"(exports) {
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/getIndicesOf.js
  var require_getIndicesOf = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/getIndicesOf.js"(exports) {
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/scanLine.js
  var require_scanLine = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/scanLine.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.scanLine = exports.noScan = exports.cleanState = void 0;
      var maskingFunction_1 = require_maskingFunction();
      var cleanState = () => ({
        quote: "",
        inComment: false,
        maskedDepth: 0
      });
      exports.cleanState = cleanState;
      var maskStart = new RegExp(`%${maskingFunction_1.maskingFunctionNames}\\s*\\(|%q?sysfunc\\s*\\(`, "iy");
      var noScan = () => ({
        positions: [],
        code: "",
        hasComment: false,
        comments: [],
        endState: (0, exports.cleanState)()
      });
      exports.noScan = noScan;
      var scanLine = (line3, state) => {
        const positions = [];
        const code = new Array(line3.length).fill(" ");
        const comments = [];
        let { quote, inComment, maskedDepth } = state;
        let hasComment = inComment;
        let commentStart = inComment ? 0 : -1;
        for (let index = 0; index < line3.length; index++) {
          const character = line3[index];
          if (inComment) {
            if (character === "*" && line3[index + 1] === "/") {
              inComment = false;
              comments.push({ start: commentStart, end: index });
              index++;
              continue;
            }
            continue;
          }
          if (maskedDepth) {
            if (character === "(")
              maskedDepth++;
            else if (character === ")")
              maskedDepth--;
            continue;
          }
          if (quote) {
            if (character === quote)
              quote = "";
            continue;
          }
          if (character === "'" || character === '"') {
            quote = character;
            continue;
          }
          if (character === "/" && line3[index + 1] === "*") {
            inComment = true;
            hasComment = true;
            commentStart = index;
            index++;
            continue;
          }
          maskStart.lastIndex = index;
          if (maskStart.test(line3)) {
            maskedDepth = 1;
            index = maskStart.lastIndex - 1;
            continue;
          }
          if (character === " ")
            positions.push(index);
          code[index] = character;
        }
        if (inComment)
          comments.push({ start: commentStart, end: line3.length });
        return {
          positions,
          code: code.join(""),
          hasComment,
          comments,
          endState: { quote, inComment, maskedDepth }
        };
      };
      exports.scanLine = scanLine;
    }
  });

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/getDataSectionsDetail.js
  var require_getDataSectionsDetail = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/getDataSectionsDetail.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.checkIsDataLine = exports.getDataSectionsDetail = void 0;
      var scanLine_1 = require_scanLine();
      var splitText_1 = require_splitText();
      var getDataSectionsDetail = (text, config) => {
        const dataSections = [];
        const lines = (0, splitText_1.splitText)(text, config);
        const opener = /(?:^|;)\s*(datalines|cards|parmcards)(4?);/i;
        const dataSectionEndRegex1 = new RegExp(";");
        const dataSectionEndRegex2 = new RegExp(";;;;");
        let state = (0, scanLine_1.cleanState)();
        let dataSectionStarted = false;
        let dataSectionStartIndex = -1;
        let dataSectionEndRegex = dataSectionEndRegex1;
        lines.forEach((line3, index) => {
          if (dataSectionStarted) {
            if (dataSectionEndRegex.test(line3)) {
              dataSections.push({ start: dataSectionStartIndex, end: index });
              dataSectionStarted = false;
              state = (0, scanLine_1.cleanState)();
            }
            return;
          }
          const scanned = (0, scanLine_1.scanLine)(line3, state);
          state = scanned.endState;
          const match = opener.exec(scanned.code);
          if (match) {
            dataSectionStarted = true;
            dataSectionStartIndex = index;
            dataSectionEndRegex = match[2] ? dataSectionEndRegex2 : dataSectionEndRegex1;
            state = (0, scanLine_1.cleanState)();
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/parseLintOverride.js
  var require_parseLintOverride = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/parseLintOverride.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.applyLintOverride = exports.getLintOverride = exports.startsDirective = void 0;
      var getHeaderLinesCount_1 = require_getHeaderLinesCount();
      var splitText_1 = require_splitText();
      var DIRECTIVE = "^[^\\w]*@sasjslint[ \\t]*\\{";
      var marker = new RegExp(DIRECTIVE, "m");
      var lineMarker = new RegExp(DIRECTIVE);
      var startsDirective = (line3) => lineMarker.test(line3);
      exports.startsDirective = startsDirective;
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
        } catch (_a4) {
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/index.js
  var require_utils = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/utils/index.js"(exports) {
      "use strict";
      var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k2, k22) {
        if (k22 === void 0) k22 = k2;
        var desc = Object.getOwnPropertyDescriptor(m, k2);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = { enumerable: true, get: function() {
            return m[k2];
          } };
        }
        Object.defineProperty(o, k22, desc);
      }) : (function(o, m, k2, k22) {
        if (k22 === void 0) k22 = k2;
        o[k22] = m[k2];
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/format/longLines.js
  var require_longLines = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/format/longLines.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.breakAwareState = exports.indentationMultipleOf = exports.continuationIndentFor = exports.firstNonSpace = exports.putTextStart = exports.breakAwareStatement = exports.macroComment = exports.macroDeclaration = void 0;
      exports.macroDeclaration = /^\s*%(?:macro|mend)\b/i;
      exports.macroComment = /^\s*%\*/;
      exports.breakAwareStatement = /^\s*%?(?:&?[\w.]*\.)?(?:put|putlog|window|display)\b|\b(?:then|else)\s+%?put\b|^\s*%let\b/i;
      var putTextStart = (line3) => {
        const match = exports.breakAwareStatement.exec(line3);
        if (!match)
          return (0, exports.firstNonSpace)(line3, 0);
        const afterKeyword = match.index + match[0].length;
        if (/^\s*%let\b/i.test(line3)) {
          const equals = line3.indexOf("=", afterKeyword);
          if (equals > -1)
            return equals + 1;
        }
        return afterKeyword;
      };
      exports.putTextStart = putTextStart;
      var firstNonSpace = (line3, from) => {
        const rest = line3.slice(from);
        return from + rest.length - rest.trimStart().length;
      };
      exports.firstNonSpace = firstNonSpace;
      var continuationIndentFor = (indent3, multiple) => indent3 + " ".repeat(multiple - indent3.length % multiple);
      exports.continuationIndentFor = continuationIndentFor;
      var indentationMultipleOf = (configuration) => configuration.indentationMultiple > 0 ? configuration.indentationMultiple : 2;
      exports.indentationMultipleOf = indentationMultipleOf;
      var breakAwareState = (code, open) => {
        const statements = code.split(";");
        const at3 = statements.findIndex((statement) => exports.breakAwareStatement.test(statement));
        return {
          line: open || at3 > -1,
          open: open ? statements.length === 1 : at3 > -1 && at3 === statements.length - 1
        };
      };
      exports.breakAwareState = breakAwareState;
    }
  });

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/format/rewrapText.js
  var require_rewrapText = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/format/rewrapText.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.rewrapText = exports.splitWithTerminators = void 0;
      var LineEndings_1 = require_LineEndings();
      var getDataSectionsDetail_1 = require_getDataSectionsDetail();
      var scanLine_1 = require_scanLine();
      var longLines_1 = require_longLines();
      var leadingKeyword = /(?:^|[\s(;,=]|%)%?(?:let|global|local|then|else|do|to|by)$/i;
      var lastPositionAtMost = (positions, maximum, lastIndex, firstIndex = 0) => {
        let low = firstIndex;
        let high = lastIndex;
        let found = -1;
        while (low <= high) {
          const middle = low + high >> 1;
          if (positions[middle] <= maximum) {
            found = middle;
            low = middle + 1;
          } else {
            high = middle - 1;
          }
        }
        return found;
      };
      var lastBreakBefore = (line3, positions, maximum, start) => {
        const last = lastPositionAtMost(positions, maximum, positions.length - 1);
        let fallback = -1;
        for (let index = last; index >= 0; index--) {
          const position = positions[index];
          if (position <= start)
            break;
          if (!leadingKeyword.test(line3.slice(0, position).trimEnd()))
            return position;
          if (fallback < 0)
            fallback = position;
        }
        return fallback;
      };
      var statementBoundaries = (code, positions) => positions.filter((position) => code.slice(0, position).trimEnd().endsWith(";"));
      var firstPositionAtLeast = (positions, minimum) => {
        let low = 0;
        let high = positions.length - 1;
        let found = -1;
        while (low <= high) {
          const middle = low + high >> 1;
          if (positions[middle] >= minimum) {
            found = middle;
            high = middle - 1;
          } else {
            low = middle + 1;
          }
        }
        return found;
      };
      var splitMacroDeclaration = (line3, code, limit, multiple) => {
        const opening = /^\s*%macro\s+[\w.]+\s*\(/i.exec(code);
        if (!opening)
          return null;
        const open = opening[0].length - 1;
        let depth = 0;
        let close = -1;
        for (let index = open; index < code.length; index++) {
          if (code[index] === "(")
            depth++;
          else if (code[index] === ")" && --depth === 0) {
            close = index;
            break;
          }
        }
        if (close < 0)
          return null;
        const inside = code.slice(open + 1, close);
        const commas = [];
        depth = 0;
        for (let index = 0; index < inside.length; index++) {
          if (inside[index] === "(")
            depth++;
          else if (inside[index] === ")")
            depth--;
          else if (inside[index] === "," && depth === 0)
            commas.push(index + open + 1);
        }
        if (!commas.length)
          return null;
        const indent3 = /^\s*/.exec(line3)[0];
        const continuationIndent = (0, longLines_1.continuationIndentFor)(indent3, multiple);
        const parameters = [];
        let from = open + 1;
        commas.forEach((comma) => {
          parameters.push(line3.slice(from, comma));
          from = comma + 1;
        });
        parameters.push(line3.slice(from, close));
        const tail = line3.slice(close);
        const pieces = [];
        let current = line3.slice(0, open + 1) + parameters[0];
        for (const parameter of parameters.slice(1)) {
          const candidate = current + "," + parameter;
          if (candidate.length <= limit)
            current = candidate;
          else {
            pieces.push(current);
            current = continuationIndent + "," + parameter;
          }
          if (current.length > limit)
            return null;
        }
        if (current.length + tail.length <= limit) {
          pieces.push(current + tail);
        } else {
          pieces.push(current);
          pieces.push(continuationIndent + tail);
        }
        return pieces.length > 1 && pieces.every((piece) => piece.length <= limit) ? pieces : null;
      };
      var splitWithTrim = (line3, limit, multiple, positions, from, boundaries) => {
        const indent3 = /^\s*/.exec(line3)[0];
        const continuationIndent = (0, longLines_1.continuationIndentFor)(indent3, multiple);
        const opening = "%trim(";
        const pieces = [];
        let prefix = "";
        let start = (0, longLines_1.firstNonSpace)(line3, 0);
        let textFrom = from;
        for (; ; ) {
          const tail = line3.slice(start);
          if (prefix.length + tail.length <= limit) {
            pieces.push((pieces.length ? prefix : "") + tail);
            return pieces.length > 1 ? pieces : null;
          }
          const boundaryFrom = pieces.length ? start : 0;
          const boundary = boundaries.filter((position) => position > start && prefix.length + position - boundaryFrom <= limit);
          if (boundary.length) {
            const at4 = boundary[boundary.length - 1];
            pieces.push(pieces.length ? prefix + line3.slice(start, at4) : line3.slice(0, at4));
            start = at4 + 1;
            textFrom = start;
            prefix = continuationIndent;
            continue;
          }
          const pieceFrom = pieces.length ? start : 0;
          const maximum = pieceFrom + limit - prefix.length - opening.length;
          const firstIndex = firstPositionAtLeast(positions, textFrom);
          if (firstIndex < 0)
            return null;
          const cut = lastPositionAtMost(positions, maximum, positions.length - 1, firstIndex);
          const at3 = cut >= 0 ? positions[cut] : -1;
          if (at3 < 0)
            return null;
          pieces.push((pieces.length ? prefix + line3.slice(start, at3) : line3.slice(0, at3)) + opening);
          start = at3 + 1;
          textFrom = start;
          prefix = continuationIndent + ") ";
        }
      };
      var wrapLine = (line3, limit, multiple, positions, boundaries) => {
        const indent3 = /^\s*/.exec(line3)[0];
        const continuationIndent = (0, longLines_1.continuationIndentFor)(indent3, multiple);
        const continuationWidth = continuationIndent.length;
        const lines = [];
        let start = (0, longLines_1.firstNonSpace)(line3, 0);
        let first = true;
        while (line3.length - start + (first ? start : continuationWidth) > limit) {
          const maximum = first ? limit : start + limit - continuationWidth;
          const boundary = lastBreakBefore(line3, boundaries, maximum, start);
          const cut = boundary >= 0 ? boundary : lastBreakBefore(line3, positions, maximum, start);
          if (cut < 0)
            return null;
          lines.push(first ? line3.slice(0, cut).trimEnd() : continuationIndent + line3.slice(start, cut).trimEnd());
          start = (0, longLines_1.firstNonSpace)(line3, cut);
          first = false;
        }
        lines.push(first ? line3 : continuationIndent + line3.slice(start));
        return lines;
      };
      var splitWithTerminators = (text) => {
        var _a4;
        const parts = text.split(/(\r\n|\n)/);
        const lines = [];
        for (let index = 0; index < parts.length; index += 2) {
          lines.push({ line: parts[index], ending: (_a4 = parts[index + 1]) !== null && _a4 !== void 0 ? _a4 : "" });
        }
        return lines;
      };
      exports.splitWithTerminators = splitWithTerminators;
      var rewrapText = (text, configuration) => {
        if (!text)
          return text;
        if (!configuration.lineLintRules.some((rule) => rule.name === "maxLineLength"))
          return text;
        const entries = (0, exports.splitWithTerminators)(text);
        const dataSections = (0, getDataSectionsDetail_1.getDataSectionsDetail)(text, configuration);
        const multiple = (0, longLines_1.indentationMultipleOf)(configuration);
        const defaultEnding = configuration.lineEndings === LineEndings_1.LineEndings.CRLF ? "\r\n" : "\n";
        const result = [];
        let state = (0, scanLine_1.cleanState)();
        let breakAwareOpen = false;
        let changed = false;
        entries.forEach(({ line: line3, ending }, index) => {
          const isData = (0, getDataSectionsDetail_1.checkIsDataLine)(dataSections, index);
          const scanned = isData ? (0, scanLine_1.noScan)() : (0, scanLine_1.scanLine)(line3, state);
          state = scanned.endState;
          const breakAware = isData ? { line: false, open: false } : (0, longLines_1.breakAwareState)(scanned.code, breakAwareOpen);
          breakAwareOpen = breakAware.open;
          const boundaries = statementBoundaries(scanned.code, scanned.positions);
          const fits2 = line3.trimEnd().length <= configuration.maxLineLength;
          const wrapped = isData || longLines_1.macroComment.test(line3) || fits2 ? null : longLines_1.macroDeclaration.test(line3) ? splitMacroDeclaration(line3, scanned.code, configuration.maxLineLength, multiple) : breakAware.line && !scanned.hasComment ? splitWithTrim(line3, configuration.maxLineLength, multiple, scanned.positions, (0, longLines_1.putTextStart)(line3), boundaries) : scanned.hasComment ? null : wrapLine(line3, configuration.maxLineLength, multiple, scanned.positions, boundaries);
          if (!wrapped) {
            result.push(line3 + ending);
            return;
          }
          changed = true;
          const breakEnding = ending || defaultEnding;
          wrapped.forEach((piece, pieceIndex) => {
            result.push(piece + (pieceIndex === wrapped.length - 1 ? ending : breakEnding));
          });
        });
        return changed ? result.join("") : text;
      };
      exports.rewrapText = rewrapText;
    }
  });

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/format/adjustLineLength.js
  var require_adjustLineLength = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/format/adjustLineLength.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.lineEndingOf = exports.adjustLineLength = void 0;
      var LineEndings_1 = require_LineEndings();
      var getDataSectionsDetail_1 = require_getDataSectionsDetail();
      var getHeaderLinesCount_1 = require_getHeaderLinesCount();
      var parseLintOverride_1 = require_parseLintOverride();
      var scanLine_1 = require_scanLine();
      var longLines_1 = require_longLines();
      var rewrapText_1 = require_rewrapText();
      var directiveRange = (lines, headerLinesCount) => {
        for (let start = 0; start < headerLinesCount; start++) {
          if (!(0, parseLintOverride_1.startsDirective)(lines[start]))
            continue;
          let depth = 0;
          let opened = false;
          let inString = false;
          let escaped = false;
          for (let index = start; index < headerLinesCount; index++) {
            const line3 = lines[index];
            for (let at3 = 0; at3 < line3.length; at3++) {
              const char = line3[at3];
              if (inString) {
                if (escaped)
                  escaped = false;
                else if (char === "\\")
                  escaped = true;
                else if (char === '"')
                  inString = false;
                continue;
              }
              if (char === '"')
                inString = true;
              else if (char === "{") {
                depth++;
                opened = true;
              } else if (char === "}" && opened && --depth === 0)
                return { start, end: index, trailing: line3.slice(at3 + 1) };
            }
          }
          return { start, end: null };
        }
        return null;
      };
      var adjustLineLength = (text, configuration) => {
        if (!text)
          return text;
        if (!configuration.lineLintRules.some((rule) => rule.name === "maxLineLength"))
          return text;
        const headerLinesCount = (0, getHeaderLinesCount_1.getHeaderLinesCount)(text, configuration);
        if (!headerLinesCount)
          return text;
        const entries = (0, rewrapText_1.splitWithTerminators)(text);
        const lines = entries.map((entry) => entry.line);
        const dataSections = (0, getDataSectionsDetail_1.getDataSectionsDetail)(text, configuration);
        const headerLimit = Math.max(configuration.maxLineLength, configuration.maxHeaderLineLength);
        const dataLimit = Math.max(configuration.maxLineLength, configuration.maxDataLineLength);
        const needed = {
          maxLineLength: 0,
          maxHeaderLineLength: 0,
          maxDataLineLength: 0
        };
        let state = (0, scanLine_1.cleanState)();
        let breakAwareOpen = false;
        lines.forEach((line3, index) => {
          const isHeader = index < headerLinesCount;
          const isData = (0, getDataSectionsDetail_1.checkIsDataLine)(dataSections, index);
          const scanned = isData ? (0, scanLine_1.noScan)() : (0, scanLine_1.scanLine)(line3, state);
          state = scanned.endState;
          const breakAware = isData ? { line: false, open: false } : (0, longLines_1.breakAwareState)(scanned.code, breakAwareOpen);
          breakAwareOpen = breakAware.open;
          const limit = isData ? dataLimit : isHeader ? headerLimit : configuration.maxLineLength;
          if (line3.length <= limit)
            return;
          if (breakAware.line || longLines_1.macroComment.test(line3) || longLines_1.macroDeclaration.test(line3))
            return;
          const codeEnd = scanned.code.trimEnd().length;
          if (!isHeader && !isData && scanned.hasComment && codeEnd <= limit)
            return;
          const key = isData ? "maxDataLineLength" : isHeader ? "maxHeaderLineLength" : "maxLineLength";
          needed[key] = Math.max(needed[key], line3.length);
        });
        const raised = Object.keys(needed).filter((key) => needed[key] > configuration[key]);
        if (!raised.length)
          return text;
        const override = (0, parseLintOverride_1.getLintOverride)(text, configuration);
        const range = directiveRange(lines, headerLinesCount);
        if (range && (range.end === null || !override))
          return text;
        const merged = Object.assign({}, override !== null && override !== void 0 ? override : {});
        raised.forEach((key) => {
          var _a4;
          merged[key] = Math.max((_a4 = merged[key]) !== null && _a4 !== void 0 ? _a4 : 0, needed[key]);
        });
        const json = "{" + Object.keys(merged).map((key) => `"${key}": ${JSON.stringify(merged[key])}`).join(", ") + "}";
        if (range && range.end !== null) {
          const indent4 = /^\s*/.exec(lines[range.start])[0] || "  ";
          const out2 = lines.slice(0, range.start).map((line3, index) => line3 + entries[index].ending);
          out2.push(`${indent4}@sasjslint ${json}${range.trailing}${entries[range.start].ending}`);
          lines.slice(range.end + 1).forEach((line3, index) => {
            out2.push(line3 + entries[range.end + 1 + index].ending);
          });
          return out2.join("");
        }
        const closingIndex = headerLinesCount - 1;
        const closing = lines[closingIndex];
        if (!/^\s*[*]{2}\/\s*$/.test(closing))
          return text;
        const previous = lines[closingIndex - 1];
        const indent3 = /^\s*/.exec(previous)[0] || "  ";
        const ending = entries[closingIndex].ending || (0, exports.lineEndingOf)(configuration);
        const separator = previous.trim() === "" ? [] : [""];
        const inserted = [...separator, `${indent3}@sasjslint ${json}`];
        const out = lines.slice(0, closingIndex).map((line3, index) => line3 + entries[index].ending);
        inserted.forEach((line3) => out.push(line3 + ending));
        lines.slice(closingIndex).forEach((line3, index) => {
          out.push(line3 + entries[closingIndex + index].ending);
        });
        return out.join("");
      };
      exports.adjustLineLength = adjustLineLength;
      var lineEndingOf = (configuration) => configuration.lineEndings === LineEndings_1.LineEndings.CRLF ? "\r\n" : "\n";
      exports.lineEndingOf = lineEndingOf;
    }
  });

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/format/headerLayout.js
  var require_headerLayout = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/format/headerLayout.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.headerLayout = void 0;
      var getHeaderLinesCount_1 = require_getHeaderLinesCount();
      var longLines_1 = require_longLines();
      var rewrapText_1 = require_rewrapText();
      var closingMarker = /^\s*\*+\/\s*$/;
      var openingMarker = /^\s*\/\*\*/;
      var indentWidth = (line3, unit) => {
        let width = 0;
        for (const character of line3) {
          if (character === " ")
            width += 1;
          else if (character === "	")
            width += unit;
          else
            break;
        }
        return width;
      };
      var headerLayout = (text, configuration) => {
        if (!text)
          return text;
        const headerLinesCount = (0, getHeaderLinesCount_1.getHeaderLinesCount)(text, configuration);
        if (!headerLinesCount)
          return text;
        const entries = (0, rewrapText_1.splitWithTerminators)(text);
        if (!openingMarker.test(entries[0].line))
          return text;
        const unit = (0, longLines_1.indentationMultipleOf)(configuration);
        const bodyLines = entries.slice(0, headerLinesCount).map((entry) => entry.line).filter((line3) => line3.trim() && !openingMarker.test(line3) && !closingMarker.test(line3));
        const originalTags = bodyLines.filter((line3) => /^\s*(?:\*+\s*)?@/.test(line3));
        const starred = originalTags.length > 0 && originalTags.every((line3) => /^\s*\*+\s*@/.test(line3));
        const marker = starred ? /^(\s*)\*+(?=\s|@|$)\s?/ : /^(\s*)\*+(?=\s*@)\s?/;
        const bodyOf = (line3) => line3.replace(marker, "$1");
        const converted = bodyLines.map(bodyOf);
        const tagLines = converted.filter((line3) => /^\s*@/.test(line3));
        const bodyIndent = tagLines.length ? Math.min(...tagLines.map((line3) => indentWidth(line3, unit))) : indentWidth(converted.length ? converted[0] : "", unit);
        const shift = " ".repeat(Math.max(0, unit - bodyIndent));
        const laidOut = entries.map((entry, index) => {
          if (index >= headerLinesCount)
            return entry.line + entry.ending;
          const line3 = entry.line;
          if (!line3.trim() || openingMarker.test(line3))
            return line3 + entry.ending;
          if (closingMarker.test(line3))
            return "**/" + entry.ending;
          const body = bodyOf(line3).trimEnd();
          return (body.trim() ? shift + body : "") + entry.ending;
        });
        return laidOut.join("");
      };
      exports.headerLayout = headerLayout;
    }
  });

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/format/reflowComments.js
  var require_reflowComments = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/format/reflowComments.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.reflowComments = void 0;
      var LineEndings_1 = require_LineEndings();
      var getDataSectionsDetail_1 = require_getDataSectionsDetail();
      var getHeaderLinesCount_1 = require_getHeaderLinesCount();
      var parseLintOverride_1 = require_parseLintOverride();
      var scanLine_1 = require_scanLine();
      var longLines_1 = require_longLines();
      var rewrapText_1 = require_rewrapText();
      var startsParagraph = /^(?:@|<|[-*+]\s|\d+[.)]\s|\||#|%|`)/i;
      var lineOriented = /^(?:@li\b|@sasjslint\b|<|[-*+]\s|\d+[.)]\s|\||#|%|`)/i;
      var codeTag = /@(?:example|code|verbatim)\b/i;
      var otherTag = /^\s*@(?!example|code|verbatim)\w/i;
      var macrosHeading = /<h4>\s*SAS Macros\s*<\/h4>/i;
      var indentOf = (text) => /^\s*/.exec(text)[0].length;
      var directiveLineIndices = (read) => {
        const reserved = /* @__PURE__ */ new Set();
        read.forEach((line3, start) => {
          if (reserved.has(start) || !(0, parseLintOverride_1.startsDirective)(line3.content))
            return;
          let depth = 0;
          let opened = false;
          let inString = false;
          let escaped = false;
          let closed = false;
          let end = start;
          for (let index = start; index < read.length && !closed; index++) {
            for (const char of read[index].content) {
              if (inString) {
                if (escaped)
                  escaped = false;
                else if (char === "\\")
                  escaped = true;
                else if (char === '"')
                  inString = false;
                continue;
              }
              if (char === '"')
                inString = true;
              else if (char === "{") {
                depth++;
                opened = true;
              } else if (char === "}" && opened && --depth === 0) {
                end = index;
                closed = true;
                break;
              }
            }
          }
          const last = closed ? end : read.length - 1;
          for (let index = start; index <= last; index++)
            reserved.add(index);
        });
        return reserved;
      };
      var wrapWords = (content, limit, lead, continuationIndent, trail) => {
        const words = content.split(/\s+/).filter(Boolean);
        const lines = [];
        let line3 = lead;
        let empty = true;
        for (const word of words) {
          const candidate = empty ? lead + word : line3 + " " + word;
          if (empty || candidate.length <= limit) {
            line3 = candidate;
            empty = false;
            continue;
          }
          lines.push(line3);
          line3 = continuationIndent + word;
        }
        lines.push(line3);
        while (lines[lines.length - 1].length + trail.length > limit) {
          const last = lines[lines.length - 1];
          const cut = last.lastIndexOf(" ");
          if (cut < 1 || !last.slice(0, cut).trim())
            return null;
          lines[lines.length - 1] = last.slice(0, cut);
          lines.push(continuationIndent + last.slice(cut + 1));
        }
        lines[lines.length - 1] += trail;
        return lines.every((wrapped) => wrapped.length <= limit) ? lines : null;
      };
      var collectBlocks = (lines, configuration) => {
        const blocks = [];
        const dataSections = (0, getDataSectionsDetail_1.getDataSectionsDetail)(lines.join("\n"), configuration);
        let state = (0, scanLine_1.cleanState)();
        let index = 0;
        while (index < lines.length) {
          if ((0, getDataSectionsDetail_1.checkIsDataLine)(dataSections, index)) {
            state = (0, scanLine_1.cleanState)();
            index++;
            continue;
          }
          const scanned = (0, scanLine_1.scanLine)(lines[index], state);
          state = scanned.endState;
          const span = scanned.comments[0];
          const opensHere = !!span && scanned.comments.length === 1 && lines[index].slice(0, span.start).trim() === "";
          if (!opensHere) {
            index++;
            continue;
          }
          if (span.end < lines[index].length) {
            if (lines[index].slice(span.end + 2).trim() === "") {
              blocks.push({ open: index, close: index });
            }
            index++;
            continue;
          }
          let close = index;
          let closed = false;
          let usable = true;
          while (usable && !closed && close < lines.length - 1) {
            close++;
            if ((0, getDataSectionsDetail_1.checkIsDataLine)(dataSections, close)) {
              usable = false;
              break;
            }
            const next = (0, scanLine_1.scanLine)(lines[close], state);
            state = next.endState;
            if (next.code.trim() !== "") {
              usable = false;
              break;
            }
            const closing = next.comments[0];
            if (closing && closing.end < lines[close].length) {
              closed = true;
              usable = lines[close].slice(closing.end + 2).trim() === "";
            }
          }
          if (usable && closed)
            blocks.push({ open: index, close });
          index = close + 1;
        }
        return blocks;
      };
      var readBlock = (lines, block, multiple) => {
        const openLine = lines[block.open];
        const marker = openLine.indexOf("/*");
        const afterMarker = marker + 2 + (openLine[marker + 2] === "*" ? 1 : 0);
        const openRest = openLine.slice(afterMarker);
        const openLead = afterMarker + indentOf(openRest);
        const closer = block.open === block.close ? openLine.indexOf("*/") : -1;
        const openBody = openLine.slice(openLead, closer > -1 ? closer : void 0);
        const openContent = openBody.trimEnd();
        const read = [
          {
            raw: openLine,
            lead: openLine.slice(0, openLead),
            content: openContent,
            trail: openBody.slice(openContent.length) + (closer > -1 ? openLine.slice(closer) : ""),
            indent: indentOf(openLine)
          }
        ];
        const body = [];
        for (let index = block.open + 1; index <= block.close; index++) {
          const line3 = lines[index];
          const whitespace = /^\s*/.exec(line3)[0];
          const close = index === block.close ? line3.indexOf("*/") : -1;
          body.push({
            line: line3,
            whitespace,
            text: line3.slice(whitespace.length, close > -1 ? close : void 0),
            close,
            indent: whitespace.length
          });
        }
        const firstBody = body.find((entry) => entry.text.trim() !== "");
        const decorated = firstBody !== void 0 && firstBody.indent > 0 && /^\*[ \t]/.test(firstBody.text);
        for (const entry of body) {
          const marker2 = decorated ? /^\*(?:[ \t]+|$)/.exec(entry.text) : null;
          const marked = marker2 ? marker2[0] : "";
          const content = entry.text.slice(marked.length).trimEnd();
          read.push({
            raw: entry.line,
            lead: entry.whitespace + marked,
            content,
            trail: entry.text.slice(marked.length + content.length) + (entry.close > -1 ? entry.line.slice(entry.close) : ""),
            indent: entry.indent
          });
        }
        const below = read[1];
        const contentIndent = below !== void 0 && below.content !== "" ? below.lead : " ".repeat(indentOf(openLine) + (multiple - indentOf(openLine) % multiple));
        const contentIndentWidth = below !== void 0 && below.content !== "" ? below.indent : contentIndent.length;
        return { read, contentIndent, contentIndentWidth };
      };
      var reflowComments = (text, configuration) => {
        if (!text)
          return text;
        if (!configuration.lineLintRules.some((rule) => rule.name === "maxLineLength"))
          return text;
        const entries = (0, rewrapText_1.splitWithTerminators)(text);
        const lines = entries.map((entry) => entry.line);
        const headerLinesCount = (0, getHeaderLinesCount_1.getHeaderLinesCount)(text, configuration);
        const multiple = (0, longLines_1.indentationMultipleOf)(configuration);
        const headerLimit = Math.max(configuration.maxLineLength, configuration.maxHeaderLineLength);
        const defaultEnding = configuration.lineEndings === LineEndings_1.LineEndings.CRLF ? "\r\n" : "\n";
        const output = [];
        let cursor2 = 0;
        const emitTo = (index) => {
          while (cursor2 < index && cursor2 < lines.length) {
            output.push(lines[cursor2] + entries[cursor2].ending);
            cursor2++;
          }
        };
        for (const block of collectBlocks(lines, configuration)) {
          const { read, contentIndent, contentIndentWidth } = readBlock(lines, block, multiple);
          const limit = block.open < headerLinesCount ? headerLimit : configuration.maxLineLength;
          emitTo(block.open);
          const emitted = [];
          let paragraph = [];
          let paragraphIndent = -1;
          let paragraphLead = "";
          const flush = () => {
            if (!paragraph.length)
              return;
            const last = paragraph[paragraph.length - 1];
            const overlong = !lineOriented.test(paragraph[0].content) && paragraph.some((line3) => line3.lead.length + line3.content.length + line3.trail.length > limit);
            const content = paragraph.map((line3) => line3.content).join(" ");
            const wrapped = overlong ? wrapWords(content, limit, paragraph[0].lead, paragraphLead, last.trail) : null;
            if (wrapped)
              emitted.push(...wrapped);
            else
              emitted.push(...paragraph.map((line3) => line3.raw));
            paragraph = [];
            paragraphIndent = -1;
            paragraphLead = "";
          };
          let inMacrosSection = false;
          let inCodeSection = false;
          const directiveLines = directiveLineIndices(read);
          read.forEach((line3, index) => {
            if (inMacrosSection) {
              const endsSection = line3.content !== "" && startsParagraph.test(line3.content) && !/^@li\b/i.test(line3.content);
              if (!endsSection) {
                flush();
                emitted.push(line3.raw);
                return;
              }
              inMacrosSection = false;
            }
            if (inCodeSection) {
              if (line3.content !== "" && otherTag.test(line3.content))
                inCodeSection = false;
              else {
                flush();
                emitted.push(line3.raw);
                return;
              }
            }
            if (codeTag.test(line3.content)) {
              flush();
              emitted.push(line3.raw);
              inCodeSection = true;
              return;
            }
            if (macrosHeading.test(line3.content)) {
              flush();
              emitted.push(line3.raw);
              inMacrosSection = true;
              return;
            }
            if (directiveLines.has(index)) {
              flush();
              emitted.push(line3.raw);
              return;
            }
            if (line3.content === "") {
              flush();
              emitted.push(line3.raw);
              return;
            }
            if (paragraph.length) {
              const continues = index > 0 && line3.indent === paragraphIndent && !startsParagraph.test(line3.content);
              if (!continues)
                flush();
            }
            if (!paragraph.length) {
              paragraphIndent = index === 0 ? contentIndentWidth : line3.indent;
              paragraphLead = index === 0 ? contentIndent : line3.lead;
            }
            paragraph.push(line3);
          });
          flush();
          const blockEnding = entries[block.close].ending || defaultEnding;
          emitted.forEach((line3, index) => {
            const ending = index === emitted.length - 1 ? entries[block.close].ending : blockEnding;
            output.push(line3 + ending);
          });
          cursor2 = block.close + 1;
        }
        emitTo(lines.length);
        const result = output.join("");
        return result === text ? text : result;
      };
      exports.reflowComments = reflowComments;
    }
  });

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/format/splitTrailingComments.js
  var require_splitTrailingComments = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/format/splitTrailingComments.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.splitTrailingComments = void 0;
      var getDataSectionsDetail_1 = require_getDataSectionsDetail();
      var scanLine_1 = require_scanLine();
      var adjustLineLength_1 = require_adjustLineLength();
      var rewrapText_1 = require_rewrapText();
      var splitTrailingComments = (text, configuration) => {
        if (!text)
          return text;
        if (!configuration.lineLintRules.some((rule) => rule.name === "maxLineLength"))
          return text;
        const entries = (0, rewrapText_1.splitWithTerminators)(text);
        const dataSections = (0, getDataSectionsDetail_1.getDataSectionsDetail)(text, configuration);
        const output = [];
        let state = (0, scanLine_1.cleanState)();
        let changed = false;
        entries.forEach(({ line: line3, ending }, index) => {
          const isData = (0, getDataSectionsDetail_1.checkIsDataLine)(dataSections, index);
          const scanned = isData ? (0, scanLine_1.noScan)() : (0, scanLine_1.scanLine)(line3, state);
          state = scanned.endState;
          const span = scanned.comments[0];
          const code = span ? line3.slice(0, span.start) : "";
          const splits = !isData && !!span && line3.length > configuration.maxLineLength && code.trim() !== "";
          if (!splits) {
            output.push(line3 + ending);
            return;
          }
          changed = true;
          const indent3 = /^\s*/.exec(line3)[0];
          const breakEnding = ending || (0, adjustLineLength_1.lineEndingOf)(configuration);
          output.push(code.trimEnd() + breakEnding);
          output.push(indent3 + line3.slice(span.start) + ending);
        });
        return changed ? output.join("") : text;
      };
      exports.splitTrailingComments = splitTrailingComments;
    }
  });

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/format/shared.js
  var require_shared = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/format/shared.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.processLine = exports.processText = void 0;
      var parseLintOverride_1 = require_parseLintOverride();
      var splitText_1 = require_splitText();
      var adjustLineLength_1 = require_adjustLineLength();
      var headerLayout_1 = require_headerLayout();
      var reflowComments_1 = require_reflowComments();
      var rewrapText_1 = require_rewrapText();
      var splitTrailingComments_1 = require_splitTrailingComments();
      var maxPasses = 3;
      var processText = (text, config) => {
        let current = text;
        let effective = (0, parseLintOverride_1.applyLintOverride)(current, config);
        for (let pass = 0; pass < maxPasses; pass++) {
          const next = processOnce(current, effective);
          if (next === current)
            break;
          current = next;
          effective = (0, parseLintOverride_1.applyLintOverride)(current, config);
        }
        return current;
      };
      exports.processText = processText;
      var processOnce = (text, config) => {
        const laid = (0, headerLayout_1.headerLayout)(text, config);
        const rewrapped = (0, rewrapText_1.rewrapText)((0, splitTrailingComments_1.splitTrailingComments)(processContent(config, laid), config), config);
        const processedText = (0, adjustLineLength_1.adjustLineLength)((0, reflowComments_1.reflowComments)(rewrapped, config), config);
        const lines = (0, splitText_1.splitText)(processedText, config);
        const formattedLines = lines.map((line3) => {
          return (0, exports.processLine)(config, line3);
        });
        return formattedLines.join((0, adjustLineLength_1.lineEndingOf)(config));
      };
      var processContent = (config, content) => {
        let processedContent = content;
        config.fileLintRules.filter((r) => !!r.fix).forEach((rule) => {
          processedContent = rule.fix(processedContent, config);
        });
        return processedContent;
      };
      var processLine = (config, line3) => {
        let processedLine = line3;
        config.lineLintRules.filter((r) => !!r.fix).forEach((rule) => {
          processedLine = rule.fix(processedLine, config);
        });
        return processedLine;
      };
      exports.processLine = processLine;
    }
  });

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/format/formatText.js
  var require_formatText = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/format/formatText.js"(exports) {
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
      var formatText3 = (text_1, configuration_1, ...args_1) => __awaiter(void 0, [text_1, configuration_1, ...args_1], void 0, function* (text, configuration, options = {}) {
        const config = (0, utils_1.applyLintOverride)(text, configuration || (yield (0, utils_1.getLintConfig)()));
        const formatted = options.reprint ? yield options.reprint(text, { keywordCase: config.keywordCase }) : text;
        return (0, shared_1.processText)(formatted, config);
      });
      exports.formatText = formatText3;
    }
  });

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/lint/shared.js
  var require_shared2 = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/lint/shared.js"(exports) {
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
        lines.forEach((line3, index) => {
          const isHeaderLine = index + 1 <= headerLinesCount;
          const isDataLine = (0, utils_2.checkIsDataLine)(dataSections, index);
          diagnostics.push(...(0, exports.processLine)(config, line3, index + 1, { isHeaderLine, isDataLine }));
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
      var processLine = (config, line3, lineNumber, options) => {
        const diagnostics = [];
        config.lineLintRules.forEach((rule) => {
          diagnostics.push(...rule.test(line3, lineNumber, config, options));
        });
        return diagnostics;
      };
      exports.processLine = processLine;
    }
  });

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/lint/lintText.js
  var require_lintText = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/lint/lintText.js"(exports) {
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/lint/lintFile.js
  var require_lintFile = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/lint/lintFile.js"(exports) {
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/lint/lintFolder.js
  var require_lintFolder = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/lint/lintFolder.js"(exports) {
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/lint/lintProject.js
  var require_lintProject = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/lint/lintProject.js"(exports) {
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/lint/index.js
  var require_lint = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/lint/index.js"(exports) {
      "use strict";
      var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k2, k22) {
        if (k22 === void 0) k22 = k2;
        var desc = Object.getOwnPropertyDescriptor(m, k2);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = { enumerable: true, get: function() {
            return m[k2];
          } };
        }
        Object.defineProperty(o, k22, desc);
      }) : (function(o, m, k2, k22) {
        if (k22 === void 0) k22 = k2;
        o[k22] = m[k2];
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/format/formatFile.js
  var require_formatFile = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/format/formatFile.js"(exports) {
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
      var getLintConfig_1 = require_getLintConfig();
      var formatText_1 = require_formatText();
      var formatFile = (filePath_1, configuration_1, ...args_1) => __awaiter(void 0, [filePath_1, configuration_1, ...args_1], void 0, function* (filePath, configuration, options = {}) {
        const config = configuration || (yield (0, getLintConfig_1.getLintConfig)());
        const diagnosticsBeforeFormat = yield (0, lint_1.lintFile)(filePath, config);
        const diagnosticsCountBeforeFormat = diagnosticsBeforeFormat.length;
        const text = yield (0, file_1.readFile)(filePath);
        const formattedText = yield (0, formatText_1.formatText)(text, config, options);
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/format/formatFolder.js
  var require_formatFolder = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/format/formatFolder.js"(exports) {
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
      var describeFailure = (where, error) => `${where}: ${error instanceof Error ? error.message : String(error)}`;
      var excludeFolders = [
        ".git",
        ".github",
        ".vscode",
        "node_modules",
        "sasjsbuild",
        "sasjsresults"
      ];
      var formatFolder = (folderPath_1, configuration_1, ...args_1) => __awaiter(void 0, [folderPath_1, configuration_1, ...args_1], void 0, function* (folderPath, configuration, options = {}) {
        const config = configuration || (yield (0, getLintConfig_1.getLintConfig)());
        const diagnosticsBeforeFormat = yield (0, lint_1.lintFolder)(folderPath, config);
        const diagnosticsCountBeforeFormat = Array.from(diagnosticsBeforeFormat.values()).reduce((a, b2) => a + b2.length, 0);
        const fileNames = yield (0, listSasFiles_1.listSasFiles)(folderPath);
        const failures = [];
        yield (0, asyncForEach_1.asyncForEach)(fileNames, (fileName) => __awaiter(void 0, void 0, void 0, function* () {
          const filePath = path_1.default.join(folderPath, fileName);
          try {
            yield (0, formatFile_1.formatFile)(filePath, config, options);
          } catch (error) {
            failures.push(describeFailure(filePath, error));
          }
        }));
        const subFolders = (yield (0, file_1.listSubFoldersInFolder)(folderPath)).filter((f) => !excludeFolders.includes(f));
        yield (0, asyncForEach_1.asyncForEach)(subFolders, (subFolder) => __awaiter(void 0, void 0, void 0, function* () {
          try {
            yield (0, exports.formatFolder)(path_1.default.join(folderPath, subFolder), config, options);
          } catch (error) {
            failures.push(describeFailure(path_1.default.join(folderPath, subFolder), error));
          }
        }));
        const diagnosticsAfterFormat = yield (0, lint_1.lintFolder)(folderPath, config);
        const diagnosticsCountAfterFormat = Array.from(diagnosticsAfterFormat.values()).reduce((a, b2) => a + b2.length, 0);
        const fixedDiagnosticsCount = diagnosticsCountBeforeFormat - diagnosticsCountAfterFormat;
        const updatedFilePaths = [];
        Array.from(diagnosticsBeforeFormat.keys()).forEach((filePath) => {
          const diagnosticsBefore = diagnosticsBeforeFormat.get(filePath);
          const diagnosticsAfter = diagnosticsAfterFormat.get(filePath);
          if (diagnosticsBefore.length !== diagnosticsAfter.length) {
            updatedFilePaths.push(filePath);
          }
        });
        if (failures.length) {
          throw new Error(`Could not format ${failures.length} file(s). Everything else was formatted.
` + failures.map((failure) => `  ${failure}`).join("\n"));
        }
        return {
          updatedFilePaths,
          fixedDiagnosticsCount,
          unfixedDiagnostics: diagnosticsAfterFormat
        };
      });
      exports.formatFolder = formatFolder;
    }
  });

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/format/formatProject.js
  var require_formatProject = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/format/formatProject.js"(exports) {
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
      var formatProject = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (options = {}) {
        const projectRoot = (yield (0, getProjectRoot_1.getProjectRoot)()) || process.currentDir;
        if (!projectRoot) {
          throw new Error("SASjs Project Root was not found.");
        }
        console.info(`Formatting all .sas files under ${projectRoot}`);
        return yield (0, formatFolder_1.formatFolder)(projectRoot, void 0, options);
      });
      exports.formatProject = formatProject;
    }
  });

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/format/index.js
  var require_format = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/format/index.js"(exports) {
      "use strict";
      var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k2, k22) {
        if (k22 === void 0) k22 = k2;
        var desc = Object.getOwnPropertyDescriptor(m, k2);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = { enumerable: true, get: function() {
            return m[k2];
          } };
        }
        Object.defineProperty(o, k22, desc);
      }) : (function(o, m, k2, k22) {
        if (k22 === void 0) k22 = k2;
        o[k22] = m[k2];
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

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/index.js
  var require_lint2 = __commonJS({
    "../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/lint/index.js"(exports) {
      "use strict";
      var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k2, k22) {
        if (k22 === void 0) k22 = k2;
        var desc = Object.getOwnPropertyDescriptor(m, k2);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = { enumerable: true, get: function() {
            return m[k2];
          } };
        }
        Object.defineProperty(o, k22, desc);
      }) : (function(o, m, k2, k22) {
        if (k22 === void 0) k22 = k2;
        o[k22] = m[k2];
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

  // ../../../../../tmp/sasjs-lint-2sYn5U/process.js
  if (typeof globalThis.process === "undefined")
    globalThis.process = {
      env: {},
      platform: "browser",
      cwd: () => "/",
      versions: {},
      argv: [],
      version: "v0"
    };

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/api/build/esm/code/service.js
  var import_lint = __toESM(require_lint2(), 1);

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/api/build/esm/types.js
  var ApiError = class extends Error {
    constructor(status, message, body) {
      super(message);
      this.status = status;
      this.body = body;
      this.apiError = true;
      this.name = "ApiError";
    }
  };

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/api/build/esm/code/service.js
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
    const configFor = async (filePath) => options.lintConfig ? await options.lintConfig(filePath) : void 0;
    return {
      async lint(caller, body) {
        requireCaller(caller);
        return (0, import_lint.lintText)(codeOf(body), await configFor(body.filePath));
      },
      async format(caller, body) {
        requireCaller(caller);
        return (0, import_lint.formatText)(codeOf(body), await configFor(body.filePath), {
          reprint: body.layout === false ? void 0 : options.reprint
        });
      }
    };
  };

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/api/build/esm/code/index.js
  var import_lint2 = __toESM(require_lint2(), 1);

  // ../../../.npm/_npx/0196409010f82194/node_modules/@sasjs/sas-language/dist/format.browser.bundle.js
  var __defProp2 = Object.defineProperty;
  var __typeError = (msg) => {
    throw TypeError(msg);
  };
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
  var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
  var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
  var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
  var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
  var documentFrom = (text) => {
    const lines = text.split(/\r\n|\r|\n/);
    const starts = [];
    const lengths = [];
    let offset = 0;
    for (const line3 of lines) {
      starts.push(offset);
      lengths.push(line3.length);
      offset += line3.length;
      const rest = text.slice(offset);
      const lineBreak = /^(?:\r\n|\r|\n)/.exec(rest);
      if (lineBreak) offset += lineBreak[0].length;
    }
    const offsetAt = ({ line: line3, character }) => {
      if (line3 >= starts.length) return text.length;
      return Math.min(starts[line3] + character, starts[line3] + lengths[line3]);
    };
    return {
      lineCount: lines.length,
      offsetAt,
      getText: (range) => text.slice(offsetAt(range.start), offsetAt(range.end))
    };
  };
  var applyEdits = (text, edits) => {
    if (!edits.length) return text;
    const document = documentFrom(text);
    const ordered = edits.map((edit) => ({
      start: document.offsetAt(edit.range.start),
      end: document.offsetAt(edit.range.end),
      newText: edit.newText
    })).sort((a, b2) => b2.start - a.start || b2.end - a.end);
    return ordered.reduce(
      (result, edit) => result.slice(0, edit.start) + edit.newText + result.slice(edit.end),
      text
    );
  };
  var Ru = Object.defineProperty;
  var yt = (t, e) => {
    for (var r in e) Ru(t, r, { get: e[r], enumerable: true });
  };
  var Su = {};
  yt(Su, { __debug: () => $i, check: () => Vi, doc: () => ar, format: () => Pu, formatWithCursor: () => Ou, getSupportInfo: () => Wi, util: () => fr, version: () => gu });
  var X = (t, e) => (r, n, ...u) => r | 1 && n == null ? void 0 : (e.call(n) ?? n[t]).apply(n, u);
  var vu = String.prototype.replaceAll ?? function(t, e) {
    return t.global ? this.replace(t, e) : this.split(t).join(e);
  };
  var Lu = X("replaceAll", function() {
    if (typeof this == "string") return vu;
  });
  var ne = Lu;
  var Ne = class {
    diff(e, r, n = {}) {
      let u;
      typeof n == "function" ? (u = n, n = {}) : "callback" in n && (u = n.callback);
      let o = this.castInput(e, n), i = this.castInput(r, n), D = this.removeEmpty(this.tokenize(o, n)), s = this.removeEmpty(this.tokenize(i, n));
      return this.diffWithOptionsObj(D, s, n, u);
    }
    diffWithOptionsObj(e, r, n, u) {
      var o;
      let i = (C) => {
        if (C = this.postProcess(C, n), u) {
          setTimeout(function() {
            u(C);
          }, 0);
          return;
        } else return C;
      }, D = r.length, s = e.length, a = 1, c = D + s;
      n.maxEditLength != null && (c = Math.min(c, n.maxEditLength));
      let p = (o = n.timeout) !== null && o !== void 0 ? o : 1 / 0, l = Date.now() + p, m = [{ oldPos: -1, lastComponent: void 0 }], f = this.extractCommon(m[0], r, e, 0, n);
      if (m[0].oldPos + 1 >= s && f + 1 >= D) return i(this.buildValues(m[0].lastComponent, r, e));
      let F = -1 / 0, d = 1 / 0, E = () => {
        for (let C = Math.max(F, -a); C <= Math.min(d, a); C += 2) {
          let h, _ = m[C - 1], P = m[C + 1];
          _ && (m[C - 1] = void 0);
          let A = false;
          if (P) {
            let J = P.oldPos - C;
            A = P && 0 <= J && J < D;
          }
          let B = _ && _.oldPos + 1 < s;
          if (!A && !B) {
            m[C] = void 0;
            continue;
          }
          if (!B || A && _.oldPos < P.oldPos ? h = this.addToPath(P, true, false, 0, n) : h = this.addToPath(_, false, true, 1, n), f = this.extractCommon(h, r, e, C, n), h.oldPos + 1 >= s && f + 1 >= D) return i(this.buildValues(h.lastComponent, r, e)) || true;
          m[C] = h, h.oldPos + 1 >= s && (d = Math.min(d, C - 1)), f + 1 >= D && (F = Math.max(F, C + 1));
        }
        a++;
      };
      if (u) (function C() {
        setTimeout(function() {
          if (a > c || Date.now() > l) return u(void 0);
          E() || C();
        }, 0);
      })();
      else for (; a <= c && Date.now() <= l; ) {
        let C = E();
        if (C) return C;
      }
    }
    addToPath(e, r, n, u, o) {
      let i = e.lastComponent;
      return i && !o.oneChangePerToken && i.added === r && i.removed === n ? { oldPos: e.oldPos + u, lastComponent: { count: i.count + 1, added: r, removed: n, previousComponent: i.previousComponent } } : { oldPos: e.oldPos + u, lastComponent: { count: 1, added: r, removed: n, previousComponent: i } };
    }
    extractCommon(e, r, n, u, o) {
      let i = r.length, D = n.length, s = e.oldPos, a = s - u, c = 0;
      for (; a + 1 < i && s + 1 < D && this.equals(n[s + 1], r[a + 1], o); ) a++, s++, c++, o.oneChangePerToken && (e.lastComponent = { count: 1, previousComponent: e.lastComponent, added: false, removed: false });
      return c && !o.oneChangePerToken && (e.lastComponent = { count: c, previousComponent: e.lastComponent, added: false, removed: false }), e.oldPos = s, a;
    }
    equals(e, r, n) {
      return n.comparator ? n.comparator(e, r) : e === r || !!n.ignoreCase && e.toLowerCase() === r.toLowerCase();
    }
    removeEmpty(e) {
      let r = [];
      for (let n = 0; n < e.length; n++) e[n] && r.push(e[n]);
      return r;
    }
    castInput(e, r) {
      return e;
    }
    tokenize(e, r) {
      return Array.from(e);
    }
    join(e) {
      return e.join("");
    }
    postProcess(e, r) {
      return e;
    }
    get useLongestToken() {
      return false;
    }
    buildValues(e, r, n) {
      let u = [], o;
      for (; e; ) u.push(e), o = e.previousComponent, delete e.previousComponent, e = o;
      u.reverse();
      let i = u.length, D = 0, s = 0, a = 0;
      for (; D < i; D++) {
        let c = u[D];
        if (c.removed) c.value = this.join(n.slice(a, a + c.count)), a += c.count;
        else {
          if (!c.added && this.useLongestToken) {
            let p = r.slice(s, s + c.count);
            p = p.map(function(l, m) {
              let f = n[a + m];
              return f.length > l.length ? f : l;
            }), c.value = this.join(p);
          } else c.value = this.join(r.slice(s, s + c.count));
          s += c.count, c.added || (a += c.count);
        }
      }
      return u;
    }
  };
  var At = class extends Ne {
    tokenize(e) {
      return e.slice();
    }
    join(e) {
      return e;
    }
    removeEmpty(e) {
      return e;
    }
  };
  var pr = new At();
  function xt(t, e, r) {
    return pr.diff(t, e, r);
  }
  var Mu = () => {
  };
  var k = Mu;
  var dr = "cr";
  var Fr = "crlf";
  var Yu = "lf";
  var ju = Yu;
  var Bt = "\r";
  var Er = `\r
`;
  var ze = `
`;
  var Uu = ze;
  function Cr(t) {
    let e = t.indexOf(Bt);
    return e !== -1 ? t.charAt(e + 1) === ze ? Fr : dr : ju;
  }
  function we(t) {
    return t === dr ? Bt : t === Fr ? Er : Uu;
  }
  var Vu = /* @__PURE__ */ new Map([[ze, /\n/g], [Bt, /\r/g], [Er, /\r\n/g]]);
  function Tt(t, e) {
    let r = Vu.get(e);
    return t.match(r)?.length ?? 0;
  }
  var Wu = /\r\n?/g;
  function hr(t) {
    return ne(0, t, Wu, ze);
  }
  var ue = /* @__PURE__ */ Symbol.for("comments");
  function $u(t) {
    return this[t < 0 ? this.length + t : t];
  }
  var zu = X("at", function() {
    if (Array.isArray(this) || typeof this == "string") return $u;
  });
  var y = zu;
  var G = "string";
  var U = "array";
  var V = "cursor";
  var I = "indent";
  var R = "align";
  var v = "trim";
  var x = "group";
  var S = "fill";
  var T = "if-break";
  var L = "indent-if-break";
  var M = "line-suffix";
  var Y = "line-suffix-boundary";
  var g = "line";
  var b = "label";
  var N = "break-parent";
  var Ge = /* @__PURE__ */ new Set([V, I, R, v, x, S, T, L, M, Y, g, b, N]);
  function gr(t) {
    let e = t.length;
    for (; e > 0 && (t[e - 1] === "\r" || t[e - 1] === `
`); ) e--;
    return e < t.length ? t.slice(0, e) : t;
  }
  function Fe(t, e, r) {
    if (!t.has(e)) {
      let n = r(e);
      t.set(e, n);
    }
    return t.get(e);
  }
  function Gu(t) {
    if (typeof t == "string") return G;
    if (Array.isArray(t)) return U;
    if (!t) return;
    let { type: e } = t;
    if (Ge.has(e)) return e;
  }
  var q = Gu;
  var Ku = (t) => new Intl.ListFormat("en-US", { type: "disjunction" }).format(t);
  function Hu(t) {
    let e = t === null ? "null" : typeof t;
    if (e !== "string" && e !== "object") return `Unexpected doc '${e}', 
Expected it to be 'string' or 'object'.`;
    if (q(t)) throw new Error("doc is valid.");
    let r = Object.prototype.toString.call(t);
    if (r !== "[object Object]") return `Unexpected doc '${r}'.`;
    let n = Ku([...Ge].map((u) => `'${u}'`));
    return `Unexpected doc.type '${t.type}'.
Expected it to be ${n}.`;
  }
  var Nt = class extends Error {
    constructor(e) {
      super(Hu(e));
      __publicField(this, "name", "InvalidDocError");
      this.doc = e;
    }
  };
  var Z = Nt;
  var _r = {};
  function Ju(t, e, r, n) {
    let u = [t];
    for (; u.length > 0; ) {
      let o = u.pop();
      if (o === _r) {
        r(u.pop());
        continue;
      }
      r && u.push(o, _r);
      let i = q(o);
      if (!i) throw new Z(o);
      if (e?.(o) !== false) switch (i) {
        case U:
        case S: {
          let D = i === U ? o : o.parts;
          for (let s = D.length, a = s - 1; a >= 0; --a) u.push(D[a]);
          break;
        }
        case T:
          u.push(o.flatContents, o.breakContents);
          break;
        case x:
          if (n && o.expandedStates) for (let D = o.expandedStates.length, s = D - 1; s >= 0; --s) u.push(o.expandedStates[s]);
          else u.push(o.contents);
          break;
        case R:
        case I:
        case L:
        case b:
        case M:
          u.push(o.contents);
          break;
        case G:
        case V:
        case v:
        case Y:
        case g:
        case N:
          break;
        default:
          throw new Z(o);
      }
    }
  }
  var Oe = Ju;
  function Se(t, e) {
    if (typeof t == "string") return e(t);
    let r = /* @__PURE__ */ new Map();
    return n(t);
    function n(o) {
      return Fe(r, o, u);
    }
    function u(o) {
      switch (q(o)) {
        case U:
          return e(o.map(n));
        case S:
          return e({ ...o, parts: o.parts.map(n) });
        case T:
          return e({ ...o, breakContents: n(o.breakContents), flatContents: n(o.flatContents) });
        case x: {
          let { expandedStates: i, contents: D } = o;
          return i ? (i = i.map(n), D = i[0]) : D = n(D), e({ ...o, contents: D, expandedStates: i });
        }
        case R:
        case I:
        case L:
        case b:
        case M:
          return e({ ...o, contents: n(o.contents) });
        case G:
        case V:
        case v:
        case Y:
        case g:
        case N:
          return e(o);
        default:
          throw new Z(o);
      }
    }
  }
  function Ke(t, e, r) {
    let n = r, u = false;
    function o(i) {
      if (u) return false;
      let D = e(i);
      D !== void 0 && (u = true, n = D);
    }
    return Oe(t, o), n;
  }
  function qu(t) {
    if (t.type === x && t.break || t.type === g && t.hard || t.type === N) return true;
  }
  function xr(t) {
    return Ke(t, qu, false);
  }
  function yr(t) {
    if (t.length > 0) {
      let e = y(0, t, -1);
      !e.expandedStates && !e.break && (e.break = "propagated");
    }
    return null;
  }
  function Br(t) {
    let e = /* @__PURE__ */ new Set(), r = [];
    function n(o) {
      if (o.type === N && yr(r), o.type === x) {
        if (r.push(o), e.has(o)) return false;
        e.add(o);
      }
    }
    function u(o) {
      o.type === x && r.pop().break && yr(r);
    }
    Oe(t, n, u, true);
  }
  function Xu(t) {
    return t.type === g && !t.hard ? t.soft ? "" : " " : t.type === T ? t.flatContents : t;
  }
  function Tr(t) {
    return Se(t, Xu);
  }
  function Ar(t) {
    for (t = [...t]; t.length >= 2 && y(0, t, -2).type === g && y(0, t, -1).type === N; ) t.length -= 2;
    if (t.length > 0) {
      let e = Pe(y(0, t, -1));
      t[t.length - 1] = e;
    }
    return t;
  }
  function Pe(t) {
    switch (q(t)) {
      case I:
      case L:
      case x:
      case M:
      case b: {
        let e = Pe(t.contents);
        return { ...t, contents: e };
      }
      case T:
        return { ...t, breakContents: Pe(t.breakContents), flatContents: Pe(t.flatContents) };
      case S:
        return { ...t, parts: Ar(t.parts) };
      case U:
        return Ar(t);
      case G:
        return gr(t);
      case R:
      case V:
      case v:
      case Y:
      case g:
      case N:
        break;
      default:
        throw new Z(t);
    }
    return t;
  }
  function He(t) {
    return Pe(Zu(t));
  }
  function Qu(t) {
    switch (q(t)) {
      case S: {
        let { parts: e } = t;
        if (e.every((r) => r === "")) return "";
        if (e.length === 1) return e[0];
        break;
      }
      case x:
        if (!t.contents && !t.id && !t.break && !t.expandedStates) return "";
        if (t.contents.type === x && t.contents.id === t.id && t.contents.break === t.break && t.contents.expandedStates === t.expandedStates) return t.contents;
        break;
      case R:
      case I:
      case L:
      case M:
        if (!t.contents) return "";
        break;
      case T:
        if (!t.flatContents && !t.breakContents) return "";
        break;
      case U: {
        let e = [];
        for (let r of t) {
          if (!r) continue;
          let [n, ...u] = Array.isArray(r) ? r : [r];
          typeof n == "string" && typeof y(0, e, -1) == "string" ? e[e.length - 1] += n : e.push(n), e.push(...u);
        }
        return e.length === 0 ? "" : e.length === 1 ? e[0] : e;
      }
      case G:
      case V:
      case v:
      case Y:
      case g:
      case b:
      case N:
        break;
      default:
        throw new Z(t);
    }
    return t;
  }
  function Zu(t) {
    return Se(t, (e) => Qu(e));
  }
  function Nr(t, e = Je) {
    return Se(t, (r) => typeof r == "string" ? be(e, r.split(`
`)) : r);
  }
  function eo(t) {
    if (t.type === g) return true;
  }
  function wr(t) {
    return Ke(t, eo, false);
  }
  function Ee(t, e) {
    return t.type === b ? { ...t, contents: e(t.contents) } : e(t);
  }
  var w = k;
  var qe = k;
  var Or = k;
  var Pr = k;
  function oe(t) {
    return w(t), { type: I, contents: t };
  }
  function De(t, e) {
    return Pr(t), w(e), { type: R, contents: e, n: t };
  }
  function Sr(t) {
    return De(Number.NEGATIVE_INFINITY, t);
  }
  function Xe(t) {
    return De({ type: "root" }, t);
  }
  function br(t) {
    return De(-1, t);
  }
  function Qe(t, e, r) {
    w(t);
    let n = t;
    if (e > 0) {
      for (let u = 0; u < Math.floor(e / r); ++u) n = oe(n);
      n = De(e % r, n), n = De(Number.NEGATIVE_INFINITY, n);
    }
    return n;
  }
  var ae = { type: N };
  var ee = { type: V };
  function kr(t) {
    return Or(t), { type: S, parts: t };
  }
  function wt(t, e = {}) {
    return w(t), qe(e.expandedStates, true), { type: x, id: e.id, contents: t, break: !!e.shouldBreak, expandedStates: e.expandedStates };
  }
  function Ir(t, e) {
    return wt(t[0], { ...e, expandedStates: t });
  }
  function Rr(t, e = "", r = {}) {
    return w(t), e !== "" && w(e), { type: T, breakContents: t, flatContents: e, groupId: r.groupId };
  }
  function vr(t, e) {
    return w(t), { type: L, contents: t, groupId: e.groupId, negate: e.negate };
  }
  function be(t, e) {
    w(t), qe(e);
    let r = [];
    for (let n = 0; n < e.length; n++) n !== 0 && r.push(t), r.push(e[n]);
    return r;
  }
  function Lr(t, e) {
    return w(e), t ? { type: b, label: t, contents: e } : e;
  }
  var Ze = { type: g };
  var Mr = { type: g, soft: true };
  var ke = { type: g, hard: true };
  var W = [ke, ae];
  var Ot = { type: g, hard: true, literal: true };
  var Je = [Ot, ae];
  function Ie(t) {
    return w(t), { type: M, contents: t };
  }
  var Yr = { type: Y };
  var jr = { type: v };
  function te(t) {
    if (!t) return "";
    if (Array.isArray(t)) {
      let e = [];
      for (let r of t) if (Array.isArray(r)) e.push(...te(r));
      else {
        let n = te(r);
        n !== "" && e.push(n);
      }
      return e;
    }
    return t.type === T ? { ...t, breakContents: te(t.breakContents), flatContents: te(t.flatContents) } : t.type === x ? { ...t, contents: te(t.contents), expandedStates: t.expandedStates?.map(te) } : t.type === S ? { type: "fill", parts: t.parts.map(te) } : t.contents ? { ...t, contents: te(t.contents) } : t;
  }
  function Ur(t) {
    let e = /* @__PURE__ */ Object.create(null), r = /* @__PURE__ */ new Set();
    return n(te(t));
    function n(o, i, D) {
      if (typeof o == "string") return JSON.stringify(o);
      if (Array.isArray(o)) {
        let s = o.map(n).filter(Boolean);
        return s.length === 1 ? s[0] : `[${s.join(", ")}]`;
      }
      if (o.type === g) {
        let s = D?.[i + 1]?.type === N;
        return o.literal ? s ? "literalline" : "literallineWithoutBreakParent" : o.hard ? s ? "hardline" : "hardlineWithoutBreakParent" : o.soft ? "softline" : "line";
      }
      if (o.type === N) return D?.[i - 1]?.type === g && D[i - 1].hard ? void 0 : "breakParent";
      if (o.type === v) return "trim";
      if (o.type === I) return "indent(" + n(o.contents) + ")";
      if (o.type === R) return o.n === Number.NEGATIVE_INFINITY ? "dedentToRoot(" + n(o.contents) + ")" : o.n < 0 ? "dedent(" + n(o.contents) + ")" : o.n.type === "root" ? "markAsRoot(" + n(o.contents) + ")" : "align(" + JSON.stringify(o.n) + ", " + n(o.contents) + ")";
      if (o.type === T) return "ifBreak(" + n(o.breakContents) + (o.flatContents ? ", " + n(o.flatContents) : "") + (o.groupId ? (o.flatContents ? "" : ', ""') + `, { groupId: ${u(o.groupId)} }` : "") + ")";
      if (o.type === L) {
        let s = [];
        o.negate && s.push("negate: true"), o.groupId && s.push(`groupId: ${u(o.groupId)}`);
        let a = s.length > 0 ? `, { ${s.join(", ")} }` : "";
        return `indentIfBreak(${n(o.contents)}${a})`;
      }
      if (o.type === x) {
        let s = [];
        o.break && o.break !== "propagated" && s.push("shouldBreak: true"), o.id && s.push(`id: ${u(o.id)}`);
        let a = s.length > 0 ? `, { ${s.join(", ")} }` : "";
        return o.expandedStates ? `conditionalGroup([${o.expandedStates.map((c) => n(c)).join(",")}]${a})` : `group(${n(o.contents)}${a})`;
      }
      if (o.type === S) return `fill([${o.parts.map((s) => n(s)).join(", ")}])`;
      if (o.type === M) return "lineSuffix(" + n(o.contents) + ")";
      if (o.type === Y) return "lineSuffixBoundary";
      if (o.type === b) return `label(${JSON.stringify(o.label)}, ${n(o.contents)})`;
      if (o.type === V) return "cursor";
      throw new Error("Unknown doc type " + o.type);
    }
    function u(o) {
      if (typeof o != "symbol") return JSON.stringify(String(o));
      if (o in e) return e[o];
      let i = o.description || "symbol";
      for (let D = 0; ; D++) {
        let s = i + (D > 0 ? ` #${D}` : "");
        if (!r.has(s)) return r.add(s), e[o] = `Symbol.for(${JSON.stringify(s)})`;
      }
    }
  }
  var Vr = () => /[#*0-9]\uFE0F?\u20E3|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26AA\u26B0\u26B1\u26BD\u26BE\u26C4\u26C8\u26CF\u26D1\u26E9\u26F0-\u26F5\u26F7\u26F8\u26FA\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2757\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B55\u3030\u303D\u3297\u3299]\uFE0F?|[\u261D\u270C\u270D](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\u270A\u270B](?:\uD83C[\uDFFB-\uDFFF])?|[\u23E9-\u23EC\u23F0\u23F3\u25FD\u2693\u26A1\u26AB\u26C5\u26CE\u26D4\u26EA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2795-\u2797\u27B0\u27BF\u2B50]|\u26D3\uFE0F?(?:\u200D\uD83D\uDCA5)?|\u26F9(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\u2764\uFE0F?(?:\u200D(?:\uD83D\uDD25|\uD83E\uDE79))?|\uD83C(?:[\uDC04\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]\uFE0F?|[\uDF85\uDFC2\uDFC7](?:\uD83C[\uDFFB-\uDFFF])?|[\uDFC4\uDFCA](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDFCB\uDFCC](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF43\uDF45-\uDF4A\uDF4C-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uDDE6\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF]|\uDDE7\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF]|\uDDE8\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF7\uDDFA-\uDDFF]|\uDDE9\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF]|\uDDEA\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA]|\uDDEB\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7]|\uDDEC\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE]|\uDDED\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA]|\uDDEE\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9]|\uDDEF\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5]|\uDDF0\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF]|\uDDF1\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE]|\uDDF2\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF]|\uDDF3\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF]|\uDDF4\uD83C\uDDF2|\uDDF5\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE]|\uDDF6\uD83C\uDDE6|\uDDF7\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC]|\uDDF8\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF]|\uDDF9\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF]|\uDDFA\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF]|\uDDFB\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA]|\uDDFC\uD83C[\uDDEB\uDDF8]|\uDDFD\uD83C\uDDF0|\uDDFE\uD83C[\uDDEA\uDDF9]|\uDDFF\uD83C[\uDDE6\uDDF2\uDDFC]|\uDF44(?:\u200D\uD83D\uDFEB)?|\uDF4B(?:\u200D\uD83D\uDFE9)?|\uDFC3(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDFF3\uFE0F?(?:\u200D(?:\u26A7\uFE0F?|\uD83C\uDF08))?|\uDFF4(?:\u200D\u2620\uFE0F?|\uDB40\uDC67\uDB40\uDC62\uDB40(?:\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDC73\uDB40\uDC63\uDB40\uDC74|\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F)?)|\uD83D(?:[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3]\uFE0F?|[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC](?:\uD83C[\uDFFB-\uDFFF])?|[\uDC6E-\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4\uDEB5](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD74\uDD90](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC25\uDC27-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE41\uDE43\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED8\uDEDC-\uDEDF\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB\uDFF0]|\uDC08(?:\u200D\u2B1B)?|\uDC15(?:\u200D\uD83E\uDDBA)?|\uDC26(?:\u200D(?:\u2B1B|\uD83D\uDD25))?|\uDC3B(?:\u200D\u2744\uFE0F?)?|\uDC41\uFE0F?(?:\u200D\uD83D\uDDE8\uFE0F?)?|\uDC68(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDC68\uDC69]\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?))?|\uDC69(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?[\uDC68\uDC69]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?|\uDC69\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?))|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFC-\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFD-\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFD\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFE]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFE])))?))?|\uDD75(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDE2E(?:\u200D\uD83D\uDCA8)?|\uDE35(?:\u200D\uD83D\uDCAB)?|\uDE36(?:\u200D\uD83C\uDF2B\uFE0F?)?|\uDE42(?:\u200D[\u2194\u2195]\uFE0F?)?|\uDEB6(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?)|\uD83E(?:[\uDD0C\uDD0F\uDD18-\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5\uDEC3-\uDEC5\uDEF0\uDEF2-\uDEF8](?:\uD83C[\uDFFB-\uDFFF])?|[\uDD26\uDD35\uDD37-\uDD39\uDD3C-\uDD3E\uDDB8\uDDB9\uDDCD\uDDCF\uDDD4\uDDD6-\uDDDD](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDDDE\uDDDF](?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD0D\uDD0E\uDD10-\uDD17\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCC\uDDD0\uDDE0-\uDDFF\uDE70-\uDE7C\uDE80-\uDE8A\uDE8E-\uDEC2\uDEC6\uDEC8\uDECD-\uDEDC\uDEDF-\uDEEA\uDEEF]|\uDDCE(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDDD1(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1|\uDDD1\u200D\uD83E\uDDD2(?:\u200D\uD83E\uDDD2)?|\uDDD2(?:\u200D\uD83E\uDDD2)?))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE])))?))?|\uDEF1(?:\uD83C(?:\uDFFB(?:\u200D\uD83E\uDEF2\uD83C[\uDFFC-\uDFFF])?|\uDFFC(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFD-\uDFFF])?|\uDFFD(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])?|\uDFFE(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFD\uDFFF])?|\uDFFF(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFE])?))?)/g;
  var Wr = 12288;
  var $r = 65510;
  var zr = [12288, 12288, 65281, 65376, 65504, 65510];
  var Gr = 4352;
  var Kr = 262141;
  var Pt = [4352, 4447, 8986, 8987, 9001, 9002, 9193, 9196, 9200, 9200, 9203, 9203, 9725, 9726, 9748, 9749, 9776, 9783, 9800, 9811, 9855, 9855, 9866, 9871, 9875, 9875, 9889, 9889, 9898, 9899, 9917, 9918, 9924, 9925, 9934, 9934, 9940, 9940, 9962, 9962, 9970, 9971, 9973, 9973, 9978, 9978, 9981, 9981, 9989, 9989, 9994, 9995, 10024, 10024, 10060, 10060, 10062, 10062, 10067, 10069, 10071, 10071, 10133, 10135, 10160, 10160, 10175, 10175, 11035, 11036, 11088, 11088, 11093, 11093, 11904, 11929, 11931, 12019, 12032, 12245, 12272, 12287, 12289, 12350, 12353, 12438, 12441, 12543, 12549, 12591, 12593, 12686, 12688, 12773, 12783, 12830, 12832, 12871, 12880, 42124, 42128, 42182, 43360, 43388, 44032, 55203, 63744, 64255, 65040, 65049, 65072, 65106, 65108, 65126, 65128, 65131, 94176, 94180, 94192, 94198, 94208, 101589, 101631, 101662, 101760, 101874, 110576, 110579, 110581, 110587, 110589, 110590, 110592, 110882, 110898, 110898, 110928, 110930, 110933, 110933, 110948, 110951, 110960, 111355, 119552, 119638, 119648, 119670, 126980, 126980, 127183, 127183, 127374, 127374, 127377, 127386, 127488, 127490, 127504, 127547, 127552, 127560, 127568, 127569, 127584, 127589, 127744, 127776, 127789, 127797, 127799, 127868, 127870, 127891, 127904, 127946, 127951, 127955, 127968, 127984, 127988, 127988, 127992, 128062, 128064, 128064, 128066, 128252, 128255, 128317, 128331, 128334, 128336, 128359, 128378, 128378, 128405, 128406, 128420, 128420, 128507, 128591, 128640, 128709, 128716, 128716, 128720, 128722, 128725, 128728, 128732, 128735, 128747, 128748, 128756, 128764, 128992, 129003, 129008, 129008, 129292, 129338, 129340, 129349, 129351, 129535, 129648, 129660, 129664, 129674, 129678, 129734, 129736, 129736, 129741, 129756, 129759, 129770, 129775, 129784, 131072, 196605, 196608, 262141];
  var St = (t, e) => {
    let r = 0, n = Math.floor(t.length / 2) - 1;
    for (; r <= n; ) {
      let u = Math.floor((r + n) / 2), o = u * 2;
      if (e < t[o]) n = u - 1;
      else if (e > t[o + 1]) r = u + 1;
      else return true;
    }
    return false;
  };
  var Hr = 19968;
  var [to, ro] = no(Pt);
  function no(t) {
    let e = t[0], r = t[1];
    for (let n = 0; n < t.length; n += 2) {
      let u = t[n], o = t[n + 1];
      if (Hr >= u && Hr <= o) return [u, o];
      o - u > r - e && (e = u, r = o);
    }
    return [e, r];
  }
  var bt = (t) => t < Wr || t > $r ? false : St(zr, t);
  var kt = (t) => t >= to && t <= ro ? true : t < Gr || t > Kr ? false : St(Pt, t);
  var uo = /^(?:[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u2600-\u2604\u260E\u2611\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26B0\u26B1\u26C8\u26CF\u26D1\u26D3\u26E9\u26F0\u26F1\u26F4\u26F7\u26F8\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2763\u2764\u27A1\u2934\u2935\u2B05-\u2B07]|\uD83C[\uDD70\uDD71\uDD7E\uDD7F\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF3\uDFF5\uDFF7]|\uD83D[\uDC3F\uDC41\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3])$/;
  var Jr = (t) => uo.test(t);
  var oo = /[^\x20-\x7F]/;
  function io(t) {
    if (!t) return 0;
    if (!oo.test(t)) return t.length;
    let e = 0;
    t = t.replace(Vr(), (r) => (e += Jr(r) ? 1 : 2, ""));
    for (let r of t) {
      let n = r.codePointAt(0);
      n <= 31 || n >= 127 && n <= 159 || n >= 768 && n <= 879 || n >= 65024 && n <= 65039 || (e += bt(n) || kt(n) ? 2 : 1);
    }
    return e;
  }
  var Re = io;
  var so = { type: 0 };
  var Do = { type: 1 };
  var It = { value: "", length: 0, queue: [], get root() {
    return It;
  } };
  function qr(t, e, r) {
    let n = e.type === 1 ? t.queue.slice(0, -1) : [...t.queue, e], u = "", o = 0, i = 0, D = 0;
    for (let f of n) switch (f.type) {
      case 0:
        c(), r.useTabs ? s(1) : a(r.tabWidth);
        break;
      case 3: {
        let { string: F } = f;
        c(), u += F, o += F.length;
        break;
      }
      case 2: {
        let { width: F } = f;
        i += 1, D += F;
        break;
      }
      default:
        throw new Error(`Unexpected indent comment '${f.type}'.`);
    }
    return l(), { ...t, value: u, length: o, queue: n };
    function s(f) {
      u += "	".repeat(f), o += r.tabWidth * f;
    }
    function a(f) {
      u += " ".repeat(f), o += f;
    }
    function c() {
      r.useTabs ? p() : l();
    }
    function p() {
      i > 0 && s(i), m();
    }
    function l() {
      D > 0 && a(D), m();
    }
    function m() {
      i = 0, D = 0;
    }
  }
  function Xr(t, e, r) {
    if (!e) return t;
    if (e.type === "root") return { ...t, root: t };
    if (e === Number.NEGATIVE_INFINITY) return t.root;
    let n;
    return typeof e == "number" ? e < 0 ? n = Do : n = { type: 2, width: e } : n = { type: 3, string: e }, qr(t, n, r);
  }
  function Qr(t, e) {
    return qr(t, so, e);
  }
  function ao(t) {
    let e = 0;
    for (let r = t.length - 1; r >= 0; r--) {
      let n = t[r];
      if (n === " " || n === "	") e++;
      else break;
    }
    return e;
  }
  function et(t) {
    let e = ao(t);
    return { text: e === 0 ? t : t.slice(0, t.length - e), count: e };
  }
  var _t;
  var _e;
  var _n;
  var _u;
  var _r2;
  var _Rt_instances;
  var o_fn;
  var _a;
  var Rt = (_a = class {
    constructor() {
      __privateAdd(this, _Rt_instances);
      __privateAdd(this, _t, []);
      __privateAdd(this, _e, "");
      __privateAdd(this, _n, 0);
      __privateAdd(this, _u, []);
      __privateAdd(this, _r2, []);
    }
    markPosition() {
      if (__privateGet(this, _u).length + __privateGet(this, _r2).length >= 2) throw new Error("There are too many 'cursor' in doc.");
      __privateGet(this, _r2).push(__privateGet(this, _n) + __privateGet(this, _e).length);
    }
    write(e) {
      __privateSet(this, _e, __privateGet(this, _e) + e);
    }
    trim() {
      let { text: e, count: r } = et(__privateGet(this, _e));
      return __privateSet(this, _e, e), __privateMethod(this, _Rt_instances, o_fn).call(this), r;
    }
    finish() {
      return __privateMethod(this, _Rt_instances, o_fn).call(this), { text: __privateGet(this, _t).join(""), positions: __privateGet(this, _u) };
    }
  }, _t = /* @__PURE__ */ new WeakMap(), _e = /* @__PURE__ */ new WeakMap(), _n = /* @__PURE__ */ new WeakMap(), _u = /* @__PURE__ */ new WeakMap(), _r2 = /* @__PURE__ */ new WeakMap(), _Rt_instances = /* @__PURE__ */ new WeakSet(), o_fn = function() {
    let e = __privateGet(this, _e);
    e !== "" && (__privateGet(this, _t).push(e), __privateSet(this, _n, __privateGet(this, _n) + e.length), __privateSet(this, _e, ""));
    for (let r of __privateGet(this, _r2)) __privateGet(this, _u).push(Math.min(r, __privateGet(this, _n)));
    __privateGet(this, _r2).length = 0;
  }, _a);
  var Zr = Rt;
  var K = /* @__PURE__ */ Symbol("MODE_BREAK");
  var Q = /* @__PURE__ */ Symbol("MODE_FLAT");
  var vt = /* @__PURE__ */ Symbol("DOC_FILL_PRINTED_LENGTH");
  function tt(t, e, r, n, u, o) {
    if (r === Number.POSITIVE_INFINITY) return true;
    let i = e.length, D = false, s = [t], a = "";
    for (; r >= 0; ) {
      if (s.length === 0) {
        if (i === 0) return true;
        s.push(e[--i]);
        continue;
      }
      let { mode: c, doc: p } = s.pop(), l = q(p);
      switch (l) {
        case G:
          p && (D && (a += " ", r -= 1, D = false), a += p, r -= Re(p));
          break;
        case U:
        case S: {
          let m = l === U ? p : p.parts, f = p[vt] ?? 0;
          for (let F = m.length - 1; F >= f; F--) s.push({ mode: c, doc: m[F] });
          break;
        }
        case I:
        case R:
        case L:
        case b:
          s.push({ mode: c, doc: p.contents });
          break;
        case v: {
          let { text: m, count: f } = et(a);
          a = m, r += f;
          break;
        }
        case x: {
          if (o && p.break) return false;
          let m = p.break ? K : c, f = p.expandedStates && m === K ? y(0, p.expandedStates, -1) : p.contents;
          s.push({ mode: m, doc: f });
          break;
        }
        case T: {
          let f = (p.groupId ? u[p.groupId] || Q : c) === K ? p.breakContents : p.flatContents;
          f && s.push({ mode: c, doc: f });
          break;
        }
        case g:
          if (c === K || p.hard) return true;
          p.soft || (D = true);
          break;
        case M:
          n = true;
          break;
        case Y:
          if (n) return false;
          break;
      }
    }
    return false;
  }
  function Ce(t, e) {
    let r = /* @__PURE__ */ Object.create(null), n = e.printWidth, u = we(e.endOfLine), o = 0, i = [{ indent: It, mode: K, doc: t }], D = false, s = [], a = new Zr();
    for (Br(t); i.length > 0; ) {
      let { indent: f, mode: F, doc: d } = i.pop();
      switch (q(d)) {
        case G: {
          let E = u !== `
` ? ne(0, d, `
`, u) : d;
          E && (a.write(E), i.length > 0 && (o += Re(E)));
          break;
        }
        case U:
          for (let E = d.length - 1; E >= 0; E--) i.push({ indent: f, mode: F, doc: d[E] });
          break;
        case V:
          a.markPosition();
          break;
        case I:
          i.push({ indent: Qr(f, e), mode: F, doc: d.contents });
          break;
        case R:
          i.push({ indent: Xr(f, d.n, e), mode: F, doc: d.contents });
          break;
        case v:
          o -= a.trim();
          break;
        case x: {
          let E = (function() {
            if (F === Q && !D) return { indent: f, mode: d.break ? K : Q, doc: d.contents };
            D = false;
            let h = n - o, _ = s.length > 0, P = { indent: f, mode: Q, doc: d.contents };
            if (!d.break && tt(P, i, h, _, r)) return P;
            if (!d.expandedStates) return { indent: f, mode: K, doc: d.contents };
            if (!d.break) for (let A = 1; A < d.expandedStates.length - 1; A++) {
              let B = { indent: f, mode: Q, doc: d.expandedStates[A] };
              if (tt(B, i, h, _, r)) return B;
            }
            return { indent: f, mode: K, doc: y(0, d.expandedStates, -1) };
          })();
          i.push(E), d.id && (r[d.id] = E.mode);
          break;
        }
        case S: {
          let E = n - o, C = d[vt] ?? 0, { parts: h } = d, _ = h.length - C;
          if (_ === 0) break;
          let P = h[C + 0], A = h[C + 1], B = { indent: f, mode: Q, doc: P }, J = { indent: f, mode: K, doc: P }, $e = tt(B, [], E, s.length > 0, r, true);
          if (_ === 1) {
            $e ? i.push(B) : i.push(J);
            break;
          }
          let lr = { indent: f, mode: Q, doc: A }, _t2 = { indent: f, mode: K, doc: A };
          if (_ === 2) {
            $e ? i.push(lr, B) : i.push(_t2, J);
            break;
          }
          let bu = h[C + 2], ku = { indent: f, mode: F, doc: { ...d, [vt]: C + 2 } }, Iu = tt({ indent: f, mode: Q, doc: [P, A, bu] }, [], E, s.length > 0, r, true);
          i.push(ku), Iu ? i.push(lr, B) : $e ? i.push(_t2, B) : i.push(_t2, J);
          break;
        }
        case T:
        case L: {
          let E = d.groupId ? r[d.groupId] : F;
          if (E === K) {
            let C = d.type === T ? d.breakContents : d.negate ? d.contents : oe(d.contents);
            C && i.push({ indent: f, mode: F, doc: C });
          }
          if (E === Q) {
            let C = d.type === T ? d.flatContents : d.negate ? oe(d.contents) : d.contents;
            C && i.push({ indent: f, mode: F, doc: C });
          }
          break;
        }
        case M:
          s.push({ indent: f, mode: F, doc: d.contents });
          break;
        case Y:
          s.length > 0 && i.push({ indent: f, mode: F, doc: ke });
          break;
        case g:
          switch (F) {
            case Q:
              if (!d.hard) {
                d.soft || (a.write(" "), o += 1);
                break;
              }
              D = true;
            case K:
              if (s.length > 0) {
                i.push({ indent: f, mode: F, doc: d }, ...s.reverse()), s.length = 0;
                break;
              }
              d.literal ? (a.write(u), o = 0, f.root && (f.root.value && a.write(f.root.value), o = f.root.length)) : (a.trim(), a.write(u + f.value), o = f.length);
              break;
          }
          break;
        case b:
          i.push({ indent: f, mode: F, doc: d.contents });
          break;
        case N:
          break;
        default:
          throw new Z(d);
      }
      i.length === 0 && s.length > 0 && (i.push(...s.reverse()), s.length = 0);
    }
    let { text: c, positions: p } = a.finish();
    if (p.length !== 2) return { formatted: c };
    let [l, m] = p;
    return { formatted: c, cursorNodeStart: l, cursorNodeText: c.slice(l, m) };
  }
  function co(t, e, r = 0) {
    let n = 0;
    for (let u = r; u < t.length; ++u) t[u] === "	" ? n = n + e - n % e : n++;
    return n;
  }
  var he = co;
  var _Lt_instances;
  var t_fn;
  var e_fn;
  var _a2;
  var Lt = (_a2 = class {
    constructor(e) {
      __privateAdd(this, _Lt_instances);
      this.stack = [e];
    }
    get key() {
      let { stack: e, siblings: r } = this;
      return y(0, e, r === null ? -2 : -4) ?? null;
    }
    get index() {
      return this.siblings === null ? null : y(0, this.stack, -2);
    }
    get node() {
      return y(0, this.stack, -1);
    }
    get parent() {
      return this.getNode(1);
    }
    get grandparent() {
      return this.getNode(2);
    }
    get isInArray() {
      return this.siblings !== null;
    }
    get siblings() {
      let { stack: e } = this, r = y(0, e, -3);
      return Array.isArray(r) ? r : null;
    }
    get next() {
      let { siblings: e } = this;
      return e === null ? null : e[this.index + 1];
    }
    get previous() {
      let { siblings: e } = this;
      return e === null ? null : e[this.index - 1];
    }
    get isFirst() {
      return this.index === 0;
    }
    get isLast() {
      let { siblings: e, index: r } = this;
      return e !== null && r === e.length - 1;
    }
    get isRoot() {
      return this.stack.length === 1;
    }
    get root() {
      return this.stack[0];
    }
    get ancestors() {
      return [...__privateMethod(this, _Lt_instances, e_fn).call(this)];
    }
    getName() {
      let { stack: e } = this, { length: r } = e;
      return r > 1 ? y(0, e, -2) : null;
    }
    getValue() {
      return y(0, this.stack, -1);
    }
    getNode(e = 0) {
      let r = __privateMethod(this, _Lt_instances, t_fn).call(this, e);
      return r === -1 ? null : this.stack[r];
    }
    getParentNode(e = 0) {
      return this.getNode(e + 1);
    }
    call(e, ...r) {
      let { stack: n } = this, { length: u } = n, o = y(0, n, -1);
      for (let i of r) o = o?.[i], n.push(i, o);
      try {
        return e(this);
      } finally {
        n.length = u;
      }
    }
    callParent(e, r = 0) {
      let n = __privateMethod(this, _Lt_instances, t_fn).call(this, r + 1), u = this.stack.splice(n + 1);
      try {
        return e(this);
      } finally {
        this.stack.push(...u);
      }
    }
    each(e, ...r) {
      let { stack: n } = this, { length: u } = n, o = y(0, n, -1);
      for (let i of r) o = o[i], n.push(i, o);
      try {
        for (let i = 0; i < o.length; ++i) n.push(i, o[i]), e(this, i, o), n.length -= 2;
      } finally {
        n.length = u;
      }
    }
    map(e, ...r) {
      let n = [];
      return this.each((u, o, i) => {
        n[o] = e(u, o, i);
      }, ...r), n;
    }
    match(...e) {
      let r = this.stack.length - 1, n = null, u = this.stack[r--];
      for (let o of e) {
        if (u === void 0) return false;
        let i = null;
        if (typeof n == "number" && (i = n, n = this.stack[r--], u = this.stack[r--]), o && !o(u, n, i)) return false;
        n = this.stack[r--], u = this.stack[r--];
      }
      return true;
    }
    findAncestor(e) {
      for (let r of __privateMethod(this, _Lt_instances, e_fn).call(this)) if (e(r)) return r;
    }
    hasAncestor(e) {
      for (let r of __privateMethod(this, _Lt_instances, e_fn).call(this)) if (e(r)) return true;
      return false;
    }
  }, _Lt_instances = /* @__PURE__ */ new WeakSet(), t_fn = function(e) {
    let { stack: r } = this;
    for (let n = r.length - 1; n >= 0; n -= 2) if (!Array.isArray(r[n]) && --e < 0) return n;
    return -1;
  }, e_fn = function* () {
    let { stack: e } = this;
    for (let r = e.length - 3; r >= 0; r -= 2) {
      let n = e[r];
      Array.isArray(n) || (yield n);
    }
  }, _a2);
  var en = Lt;
  function fo(t) {
    return Array.isArray(t) && t.length > 0;
  }
  var rt = fo;
  function lo(t) {
    return t !== null && typeof t == "object";
  }
  var ge = lo;
  function _e2(t) {
    return (e, r, n) => {
      if (r === false) return false;
      let u = !!n?.backwards, { length: o } = e, i = r;
      for (; i >= 0 && i < o; ) {
        let D = e.charAt(i);
        if (t instanceof RegExp) {
          if (!t.test(D)) return i;
        } else if (!t.includes(D)) return i;
        u ? i-- : i++;
      }
      return i === -1 || i === o ? i : false;
    };
  }
  var tn = _e2(/\s/);
  var j = _e2(" 	");
  var nt = _e2(",; 	");
  var ut = _e2(/[^\n\r]/);
  var rn = (t) => t === `
` || t === "\r" || t === "\u2028" || t === "\u2029";
  function po(t, e, r) {
    if (e === false) return false;
    let n = !!r?.backwards, u = t.charAt(e);
    if (n) {
      if (t.charAt(e - 1) === "\r" && u === `
`) return e - 2;
      if (rn(u)) return e - 1;
    } else {
      if (u === "\r" && t.charAt(e + 1) === `
`) return e + 2;
      if (rn(u)) return e + 1;
    }
    return e;
  }
  var $ = po;
  function mo(t, e, r = {}) {
    let n = j(t, r.backwards ? e - 1 : e, r), u = $(t, n, r);
    return n !== u;
  }
  var H = mo;
  function* ye(t, e) {
    let { getVisitorKeys: r, filter: n = () => true } = e, u = (o) => ge(o) && n(o);
    for (let o of r(t)) {
      let i = t[o];
      if (Array.isArray(i)) for (let D of i) u(D) && (yield D);
      else u(i) && (yield i);
    }
  }
  function* nn(t, e) {
    let r = [t];
    for (let n = 0; n < r.length; n++) {
      let u = r[n];
      for (let o of ye(u, e)) yield o, r.push(o);
    }
  }
  function un(t, e) {
    return ye(t, e).next().done;
  }
  function Fo(t, e, r) {
    let { filter: n } = r;
    if (!n) return [];
    let u, o = (r.getChildren?.(t, r) ?? [...ye(t, { getVisitorKeys: r.getVisitorKeys })]).flatMap((s) => (u ?? (u = [t, ...e]), n(s, u) ? [s] : on(s, u, r))), { locStart: i, locEnd: D } = r;
    return o.sort((s, a) => i(s) - i(a) || D(s) - D(a)), o;
  }
  function on(t, e, r) {
    return Fe(r.cache, t, (n) => Fo(n, e, r));
  }
  var ot = on;
  function Eo(t) {
    let e = t.type || t.kind || "(unknown type)", r = String(t.name || t.id && (typeof t.id == "object" ? t.id.name : t.id) || t.key && (typeof t.key == "object" ? t.key.name : t.key) || t.value && (typeof t.value == "object" ? "" : String(t.value)) || t.operator || "");
    return r.length > 20 && (r = r.slice(0, 19) + "\u2026"), e + (r ? " " + r : "");
  }
  function Mt(t, e) {
    (t.comments ?? (t.comments = [])).push(e), e.printed = false, e.nodeDescription = Eo(t);
  }
  function ce(t, e) {
    e.leading = true, e.trailing = false, Mt(t, e);
  }
  function re(t, e, r) {
    e.leading = false, e.trailing = false, r && (e.marker = r), Mt(t, e);
  }
  function fe(t, e) {
    e.leading = false, e.trailing = true, Mt(t, e);
  }
  var Ut = /* @__PURE__ */ new WeakMap();
  function Dn(t, e, r, n, u = []) {
    let { locStart: o, locEnd: i } = r, D = o(e), s = i(e), a = ot(t, u, { cache: Ut, locStart: o, locEnd: i, getVisitorKeys: r.getVisitorKeys, filter: r.printer.canAttachComment, getChildren: r.printer.getCommentChildNodes }), c, p, l = 0, m = a.length;
    for (; l < m; ) {
      let f = l + m >> 1, F = a[f], d = o(F), E = i(F);
      if (d <= D && s <= E) return Dn(F, e, r, F, [F, ...u]);
      if (E <= D) {
        c = F, l = f + 1;
        continue;
      }
      if (s <= d) {
        p = F, m = f;
        continue;
      }
      throw new Error("Comment location overlaps with node location");
    }
    if (n?.type === "TemplateLiteral") {
      let { quasis: f } = n, F = jt(f, e, r);
      c && jt(f, c, r) !== F && (c = null), p && jt(f, p, r) !== F && (p = null);
    }
    return { enclosingNode: n, precedingNode: c, followingNode: p };
  }
  var Yt = () => false;
  function an(t, e) {
    let { comments: r } = t;
    if (delete t.comments, !rt(r) || !e.printer.canAttachComment) return;
    let n = [], { printer: { features: { experimental_avoidAstMutation: u }, handleComments: o = {} }, originalText: i } = e, { ownLine: D = Yt, endOfLine: s = Yt, remaining: a = Yt } = o, c = r.map((l, m) => ({ ...Dn(t, l, e), comment: l, text: i, options: e, ast: t, isLastComment: r.length - 1 === m, placement: void 0 })), p = !u;
    for (let [l, m] of c.entries()) {
      let { comment: f, precedingNode: F, enclosingNode: d, followingNode: E, text: C, options: h, ast: _, isLastComment: P } = m, A = Co(C, h, c, l) ? "ownLine" : ho(C, h, c, l) ? "endOfLine" : "remaining", B;
      if (u ? (m.placement = A, B = [m]) : B = [f, C, h, _, P], p && (f.enclosingNode = d, f.precedingNode = F, f.followingNode = E), f.placement = A, A === "ownLine") D(...B) || (E ? ce(E, f) : F ? fe(F, f) : d ? re(d, f) : re(_, f));
      else if (A === "endOfLine") s(...B) || (F ? fe(F, f) : E ? ce(E, f) : d ? re(d, f) : re(_, f));
      else if (!a(...B)) if (F && E) {
        let J = n.length;
        J > 0 && n[J - 1].followingNode !== E && sn(n, h), n.push(m);
      } else F ? fe(F, f) : E ? ce(E, f) : d ? re(d, f) : re(_, f);
    }
    if (sn(n, e), p) for (let l of r) delete l.precedingNode, delete l.enclosingNode, delete l.followingNode;
  }
  var cn = (t) => !/[\S\n\u2028\u2029]/.test(t);
  function Co(t, e, r, n) {
    let { comment: u, precedingNode: o } = r[n], { locStart: i, locEnd: D } = e, s = i(u);
    if (o) for (let a = n - 1; a >= 0; a--) {
      let { comment: c, precedingNode: p } = r[a];
      if (p !== o || !cn(t.slice(D(c), s))) break;
      s = i(c);
    }
    return H(t, s, { backwards: true });
  }
  function ho(t, e, r, n) {
    let { comment: u, followingNode: o } = r[n], { locStart: i, locEnd: D } = e, s = D(u);
    if (o) for (let a = n + 1; a < r.length; a++) {
      let { comment: c, followingNode: p } = r[a];
      if (p !== o || !cn(t.slice(s, i(c)))) break;
      s = D(c);
    }
    return H(t, s);
  }
  function sn(t, e) {
    let r = t.length;
    if (r === 0) return;
    let { precedingNode: n, followingNode: u } = t[0], o = e.locStart(u), i;
    for (i = r; i > 0; --i) {
      let { comment: D, precedingNode: s, followingNode: a } = t[i - 1];
      k(s, n), k(a, u);
      let c = e.originalText.slice(e.locEnd(D), o);
      if (e.printer.isGap?.(c, e) ?? /^[\s(]*$/.test(c)) o = e.locStart(D);
      else break;
    }
    for (let [D, { comment: s }] of t.entries()) D < i ? fe(n, s) : ce(u, s);
    for (let D of [n, u]) D.comments && D.comments.length > 1 && D.comments.sort((s, a) => e.locStart(s) - e.locStart(a));
    t.length = 0;
  }
  function jt(t, e, r) {
    let n = r.locStart(e) - 1;
    for (let u = 1; u < t.length; ++u) if (n < r.locStart(t[u])) return u - 1;
    return 0;
  }
  function go(t, e) {
    let r = e - 1;
    r = j(t, r, { backwards: true }), r = $(t, r, { backwards: true }), r = j(t, r, { backwards: true });
    let n = $(t, r, { backwards: true });
    return r !== n;
  }
  var ve = go;
  var fn = () => true;
  function ln(t, e) {
    let r = t.node;
    return r.printed = true, e.printer.printComment(t, e);
  }
  function _o(t, e) {
    let r = t.node, n = [ln(t, e)], { printer: u, originalText: o, locStart: i, locEnd: D } = e;
    if (u.isBlockComment?.(r)) {
      let c = " ";
      H(o, D(r)) && (H(o, i(r), { backwards: true }) ? c = W : c = Ze), n.push(c);
    } else n.push(W);
    let a = $(o, j(o, D(r)));
    return a !== false && H(o, a) && n.push(W), n;
  }
  function yo(t, e, r) {
    let n = t.node, u = ln(t, e), { printer: o, originalText: i, locStart: D } = e, s = o.isBlockComment?.(n);
    if (r?.hasLineSuffix && !r?.isBlock || H(i, D(n), { backwards: true })) {
      let a = ve(i, D(n));
      return { doc: Ie([W, a ? W : "", u]), isBlock: s, hasLineSuffix: true };
    }
    return !s || r?.hasLineSuffix ? { doc: [Ie([" ", u]), ae], isBlock: s, hasLineSuffix: true } : { doc: [" ", u], isBlock: s, hasLineSuffix: false };
  }
  function Ao(t, e, r) {
    let n = e[/* @__PURE__ */ Symbol.for("printedComments")], u = r?.filter ?? fn, o = new Set(t.node?.comments?.filter((i) => !n?.has(i) && i.leading && u(i)));
    return o.size === 0 ? "" : t.map(({ node: i }) => o.has(i) ? _o(t, e) : "", "comments").filter(Boolean);
  }
  function xo(t, e, r) {
    let n = t.node?.comments, u = new Set(n?.filter((c) => c.trailing)), o = e[/* @__PURE__ */ Symbol.for("printedComments")], i = r?.filter ?? fn, D = new Set(n?.filter((c) => u.has(c) && !o?.has(c) && i(c)));
    if (D.size === 0) return "";
    let s = [], a;
    return t.each(({ node: c }) => {
      u.has(c) && (a = yo(t, e, a), D.has(c) && s.push(a.doc));
    }, "comments"), s;
  }
  function pn(t, e, r, n) {
    let u = Ao(t, r, n), o = xo(t, r, n);
    return u || o ? Ee(e, (i) => [u, i, o]) : e;
  }
  function mn(t) {
    let { [ue]: e, [/* @__PURE__ */ Symbol.for("printedComments")]: r } = t;
    for (let n of e) {
      if (!n.printed && !r.has(n)) throw new Error('Comment "' + n.value.trim() + '" was not printed. Please report this error!');
      delete n.printed;
    }
  }
  var dn = () => k;
  var Le = class extends Error {
    constructor() {
      super(...arguments);
      __publicField(this, "name", "ConfigError");
    }
  };
  var Me = class extends Error {
    constructor() {
      super(...arguments);
      __publicField(this, "name", "UndefinedParserError");
    }
  };
  var Bo = Object.hasOwn ?? Function.prototype.call.bind(Object.prototype.hasOwnProperty);
  var le = Bo;
  var Fn = { checkIgnorePragma: { category: "Special", type: "boolean", default: false, description: "Check whether the file's first docblock comment contains '@noprettier' or '@noformat' to determine if it should be formatted.", cliCategory: "Other" }, cursorOffset: { category: "Special", type: "int", default: -1, range: { start: -1, end: 1 / 0, step: 1 }, description: "Print (to stderr) where a cursor at the given position would move to after formatting.", cliCategory: "Editor" }, endOfLine: { category: "Global", type: "choice", default: "lf", description: "Which end of line characters to apply.", choices: [{ value: "lf", description: "Line Feed only (\\n), common on Linux and macOS as well as inside git repos" }, { value: "crlf", description: "Carriage Return + Line Feed characters (\\r\\n), common on Windows" }, { value: "cr", description: "Carriage Return character only (\\r), used very rarely" }, { value: "auto", description: `Maintain existing
(mixed values within one file are normalised by looking at what's used after the first line)` }] }, filepath: { category: "Special", type: "path", description: "Specify the input filepath. This will be used to do parser inference.", cliName: "stdin-filepath", cliCategory: "Other", cliDescription: "Path to the file to pretend that stdin comes from." }, insertPragma: { category: "Special", type: "boolean", default: false, description: "Insert @format pragma into file's first docblock comment.", cliCategory: "Other" }, parser: { category: "Global", type: "choice", default: void 0, description: "Which parser to use.", exception: (t) => typeof t == "string" || typeof t == "function", choices: [{ value: "flow", description: "Flow" }, { value: "babel", description: "JavaScript" }, { value: "babel-flow", description: "Flow" }, { value: "babel-ts", description: "TypeScript" }, { value: "typescript", description: "TypeScript" }, { value: "acorn", description: "JavaScript" }, { value: "espree", description: "JavaScript" }, { value: "meriyah", description: "JavaScript" }, { value: "css", description: "CSS" }, { value: "less", description: "Less" }, { value: "scss", description: "SCSS" }, { value: "json", description: "JSON" }, { value: "json5", description: "JSON5" }, { value: "jsonc", description: "JSON with Comments" }, { value: "json-stringify", description: "JSON.stringify" }, { value: "graphql", description: "GraphQL" }, { value: "markdown", description: "Markdown" }, { value: "mdx", description: "MDX" }, { value: "vue", description: "Vue" }, { value: "yaml", description: "YAML" }, { value: "glimmer", description: "Ember / Handlebars" }, { value: "html", description: "HTML" }, { value: "angular", description: "Angular" }, { value: "lwc", description: "Lightning Web Components" }, { value: "mjml", description: "MJML" }] }, plugins: { type: "path", array: true, default: [{ value: [] }], category: "Global", description: "Add a plugin. Multiple plugins can be passed as separate `--plugin`s.", exception: (t) => typeof t == "string" || typeof t == "object", cliName: "plugin", cliCategory: "Config" }, printWidth: { category: "Global", type: "int", default: 80, description: "The line length where Prettier will try wrap.", range: { start: 0, end: 1 / 0, step: 1 } }, rangeEnd: { category: "Special", type: "int", default: 1 / 0, range: { start: 0, end: 1 / 0, step: 1 }, description: `Format code ending at a given character offset (exclusive).
The range will extend forwards to the end of the selected statement.`, cliCategory: "Editor" }, rangeStart: { category: "Special", type: "int", default: 0, range: { start: 0, end: 1 / 0, step: 1 }, description: `Format code starting at a given character offset.
The range will extend backwards to the start of the first line containing the selected statement.`, cliCategory: "Editor" }, requirePragma: { category: "Special", type: "boolean", default: false, description: "Require either '@prettier' or '@format' to be present in the file's first docblock comment in order for it to be formatted.", cliCategory: "Other" }, tabWidth: { type: "int", category: "Global", default: 2, description: "Number of spaces per indentation level.", range: { start: 0, end: 1 / 0, step: 1 } }, useTabs: { category: "Global", type: "boolean", default: false, description: "Indent with tabs instead of spaces." }, embeddedLanguageFormatting: { category: "Global", type: "choice", default: "auto", description: "Control how Prettier formats quoted code embedded in the file.", choices: [{ value: "auto", description: "Format embedded code if Prettier can automatically identify it." }, { value: "off", description: "Never automatically format embedded code." }] } };
  function it({ plugins: t = [], showDeprecated: e = false } = {}) {
    let r = t.flatMap((u) => u.languages ?? []), n = [];
    for (let u of No(Object.assign({}, ...t.map(({ options: o }) => o), Fn))) !e && u.deprecated || (Array.isArray(u.choices) && (e || (u.choices = u.choices.filter((o) => !o.deprecated)), u.name === "parser" && (u.choices = [...u.choices, ...To(u.choices, r, t)])), u.pluginDefaults = Object.fromEntries(t.filter((o) => o.defaultOptions?.[u.name] !== void 0).map((o) => [o.name, o.defaultOptions[u.name]])), n.push(u));
    return { languages: r, options: n };
  }
  function* To(t, e, r) {
    let n = new Set(t.map((u) => u.value));
    for (let u of e) if (u.parsers) {
      for (let o of u.parsers) if (!n.has(o)) {
        n.add(o);
        let i = r.find((s) => s.parsers && le(s.parsers, o)), D = u.name;
        i?.name && (D += ` (plugin: ${i.name})`), yield { value: o, description: D };
      }
    }
  }
  function No(t) {
    let e = [];
    for (let [r, n] of Object.entries(t)) {
      let u = { name: r, ...n };
      Array.isArray(u.default) && (u.default = y(0, u.default, -1).value), e.push(u);
    }
    return e;
  }
  var wo = Array.prototype.toReversed ?? function() {
    return [...this].reverse();
  };
  var Oo = X("toReversed", function() {
    if (Array.isArray(this)) return wo;
  });
  var En = Oo;
  function Po() {
    let t = globalThis, e = t.process?.platform;
    if (typeof e == "string") return e.startsWith("win");
    let r = t.Deno?.build?.os;
    return typeof r == "string" ? r === "windows" : t.navigator?.platform?.startsWith("Win") ?? false;
  }
  var So = Po();
  function Cn(t) {
    if (t = t instanceof URL ? t : new URL(t), t.protocol !== "file:") throw new TypeError(`URL must be a file URL: received "${t.protocol}"`);
    return t;
  }
  function bo(t) {
    return t = Cn(t), decodeURIComponent(t.pathname.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"));
  }
  function ko(t) {
    t = Cn(t);
    let e = decodeURIComponent(t.pathname.replace(/\//g, "\\").replace(/%(?![0-9A-Fa-f]{2})/g, "%25")).replace(/^\\*([A-Za-z]:)(\\|$)/, "$1\\");
    return t.hostname !== "" && (e = `\\\\${t.hostname}${e}`), e;
  }
  function Vt(t) {
    return So ? ko(t) : bo(t);
  }
  var hn = (t) => String(t).split(/[/\\]/).pop();
  var gn = (t) => String(t).startsWith("file:");
  function _n2(t, e) {
    if (!e) return;
    let r = hn(e).toLowerCase();
    return t.find(({ filenames: n }) => n?.some((u) => u.toLowerCase() === r)) ?? t.find(({ extensions: n }) => n?.some((u) => r.endsWith(u)));
  }
  function Io(t, e) {
    if (e) return t.find(({ name: r }) => r.toLowerCase() === e) ?? t.find(({ aliases: r }) => r?.includes(e)) ?? t.find(({ extensions: r }) => r?.includes(`.${e}`));
  }
  var Ro = void 0;
  function yn(t, e) {
    if (e) {
      if (gn(e)) try {
        e = Vt(e);
      } catch {
        return;
      }
      if (typeof e == "string") return t.find(({ isSupported: r }) => r?.({ filepath: e }));
    }
  }
  function vo(t, e) {
    let r = En(0, t.plugins).flatMap((u) => u.languages ?? []);
    return (Io(r, e.language) ?? _n2(r, e.physicalFile) ?? _n2(r, e.file) ?? yn(r, e.physicalFile) ?? yn(r, e.file) ?? Ro?.(r, e.physicalFile))?.parsers[0];
  }
  var st = vo;
  var ie = { key: (t) => /^[$_a-zA-Z][$_a-zA-Z0-9]*$/.test(t) ? t : JSON.stringify(t), value(t) {
    if (t === null || typeof t != "object") return JSON.stringify(t);
    if (Array.isArray(t)) return `[${t.map((r) => ie.value(r)).join(", ")}]`;
    let e = Object.keys(t);
    return e.length === 0 ? "{}" : `{ ${e.map((r) => `${ie.key(r)}: ${ie.value(t[r])}`).join(", ")} }`;
  }, pair: ({ key: t, value: e }) => ie.value({ [t]: e }) };
  var An = new Proxy(String, { get: () => An });
  var z = An;
  var xn = (t, e, { descriptor: r }) => {
    let n = [`${z.yellow(typeof t == "string" ? r.key(t) : r.pair(t))} is deprecated`];
    return e && n.push(`we now treat it as ${z.blue(typeof e == "string" ? r.key(e) : r.pair(e))}`), n.join("; ") + ".";
  };
  var Dt = /* @__PURE__ */ Symbol.for("vnopts.VALUE_NOT_EXIST");
  var Ae = /* @__PURE__ */ Symbol.for("vnopts.VALUE_UNCHANGED");
  var Bn = " ".repeat(2);
  var Nn = (t, e, r) => {
    let { text: n, list: u } = r.normalizeExpectedResult(r.schemas[t].expected(r)), o = [];
    return n && o.push(Tn(t, e, n, r.descriptor)), u && o.push([Tn(t, e, u.title, r.descriptor)].concat(u.values.map((i) => wn(i, r.loggerPrintWidth))).join(`
`)), On(o, r.loggerPrintWidth);
  };
  function Tn(t, e, r, n) {
    return [`Invalid ${z.red(n.key(t))} value.`, `Expected ${z.blue(r)},`, `but received ${e === Dt ? z.gray("nothing") : z.red(n.value(e))}.`].join(" ");
  }
  function wn({ text: t, list: e }, r) {
    let n = [];
    return t && n.push(`- ${z.blue(t)}`), e && n.push([`- ${z.blue(e.title)}:`].concat(e.values.map((u) => wn(u, r - Bn.length).replace(/^|\n/g, `$&${Bn}`))).join(`
`)), On(n, r);
  }
  function On(t, e) {
    if (t.length === 1) return t[0];
    let [r, n] = t, [u, o] = t.map((i) => i.split(`
`, 1)[0].length);
    return u > e && u > o ? n : r;
  }
  var xe = [];
  var Wt = [];
  function at(t, e, r) {
    if (t === e) return 0;
    let n = r?.maxDistance, u = t;
    t.length > e.length && (t = e, e = u);
    let o = t.length, i = e.length;
    for (; o > 0 && t.charCodeAt(~-o) === e.charCodeAt(~-i); ) o--, i--;
    let D = 0;
    for (; D < o && t.charCodeAt(D) === e.charCodeAt(D); ) D++;
    if (o -= D, i -= D, n !== void 0 && i - o > n) return n;
    if (o === 0) return n !== void 0 && i > n ? n : i;
    let s, a, c, p, l = 0, m = 0;
    for (; l < o; ) Wt[l] = t.charCodeAt(D + l), xe[l] = ++l;
    for (; m < i; ) {
      for (s = e.charCodeAt(D + m), c = m++, a = m, l = 0; l < o; l++) p = s === Wt[l] ? c : c + 1, c = xe[l], a = xe[l] = c > a ? p > a ? a + 1 : p : p > c ? c + 1 : p;
      if (n !== void 0) {
        let f = a;
        for (l = 0; l < o; l++) xe[l] < f && (f = xe[l]);
        if (f > n) return n;
      }
    }
    return xe.length = o, Wt.length = o, n !== void 0 && a > n ? n : a;
  }
  function Pn(t, e, r) {
    if (!Array.isArray(e) || e.length === 0) return;
    let n = r?.maxDistance, u = t.length;
    for (let s of e) if (s === t) return s;
    if (n === 0) return;
    let o, i = Number.POSITIVE_INFINITY, D = /* @__PURE__ */ new Set();
    for (let s of e) {
      if (D.has(s)) continue;
      D.add(s);
      let a = Math.abs(s.length - u);
      if (a >= i || n !== void 0 && a > n) continue;
      let c = Number.isFinite(i) ? n === void 0 ? i : Math.min(i, n) : n, p = c === void 0 ? at(t, s) : at(t, s, { maxDistance: c });
      if (n !== void 0 && p > n) continue;
      let l = p;
      if (c !== void 0 && p === c && c === n && (l = at(t, s)), l < i && (i = l, o = s, i === 0)) break;
    }
    if (!(n !== void 0 && i > n)) return o;
  }
  var ct = (t, e, { descriptor: r, logger: n, schemas: u }) => {
    let o = [`Ignored unknown option ${z.yellow(r.pair({ key: t, value: e }))}.`], i = Pn(t, Object.keys(u), { maxDistance: 3 });
    i && o.push(`Did you mean ${z.blue(r.key(i))}?`), n.warn(o.join(" "));
  };
  var Lo = ["default", "expected", "validate", "deprecated", "forward", "redirect", "overlap", "preprocess", "postprocess"];
  function Mo(t, e) {
    let r = new t(e), n = Object.create(r);
    for (let u of Lo) u in e && (n[u] = Yo(e[u], r, O.prototype[u].length));
    return n;
  }
  var O = class {
    static create(e) {
      return Mo(this, e);
    }
    constructor(e) {
      this.name = e.name;
    }
    default(e) {
    }
    expected(e) {
      return "nothing";
    }
    validate(e, r) {
      return false;
    }
    deprecated(e, r) {
      return false;
    }
    forward(e, r) {
    }
    redirect(e, r) {
    }
    overlap(e, r, n) {
      return e;
    }
    preprocess(e, r) {
      return e;
    }
    postprocess(e, r) {
      return Ae;
    }
  };
  function Yo(t, e, r) {
    return typeof t == "function" ? (...n) => t(...n.slice(0, r - 1), e, ...n.slice(r - 1)) : () => t;
  }
  var ft = class extends O {
    constructor(e) {
      super(e), this._sourceName = e.sourceName;
    }
    expected(e) {
      return e.schemas[this._sourceName].expected(e);
    }
    validate(e, r) {
      return r.schemas[this._sourceName].validate(e, r);
    }
    redirect(e, r) {
      return this._sourceName;
    }
  };
  var lt = class extends O {
    expected() {
      return "anything";
    }
    validate() {
      return true;
    }
  };
  var pt = class extends O {
    constructor({ valueSchema: e, name: r = e.name, ...n }) {
      super({ ...n, name: r }), this._valueSchema = e;
    }
    expected(e) {
      let { text: r, list: n } = e.normalizeExpectedResult(this._valueSchema.expected(e));
      return { text: r && `an array of ${r}`, list: n && { title: "an array of the following values", values: [{ list: n }] } };
    }
    validate(e, r) {
      if (!Array.isArray(e)) return false;
      let n = [];
      for (let u of e) {
        let o = r.normalizeValidateResult(this._valueSchema.validate(u, r), u);
        o !== true && n.push(o.value);
      }
      return n.length === 0 ? true : { value: n };
    }
    deprecated(e, r) {
      let n = [];
      for (let u of e) {
        let o = r.normalizeDeprecatedResult(this._valueSchema.deprecated(u, r), u);
        o !== false && n.push(...o.map(({ value: i }) => ({ value: [i] })));
      }
      return n;
    }
    forward(e, r) {
      let n = [];
      for (let u of e) {
        let o = r.normalizeForwardResult(this._valueSchema.forward(u, r), u);
        n.push(...o.map(Sn));
      }
      return n;
    }
    redirect(e, r) {
      let n = [], u = [];
      for (let o of e) {
        let i = r.normalizeRedirectResult(this._valueSchema.redirect(o, r), o);
        "remain" in i && n.push(i.remain), u.push(...i.redirect.map(Sn));
      }
      return n.length === 0 ? { redirect: u } : { redirect: u, remain: n };
    }
    overlap(e, r) {
      return e.concat(r);
    }
  };
  function Sn({ from: t, to: e }) {
    return { from: [t], to: e };
  }
  var mt = class extends O {
    expected() {
      return "true or false";
    }
    validate(e) {
      return typeof e == "boolean";
    }
  };
  function kn(t, e) {
    let r = /* @__PURE__ */ Object.create(null);
    for (let n of t) {
      let u = n[e];
      if (r[u]) throw new Error(`Duplicate ${e} ${JSON.stringify(u)}`);
      r[u] = n;
    }
    return r;
  }
  function In(t, e) {
    let r = /* @__PURE__ */ new Map();
    for (let n of t) {
      let u = n[e];
      if (r.has(u)) throw new Error(`Duplicate ${e} ${JSON.stringify(u)}`);
      r.set(u, n);
    }
    return r;
  }
  function Rn() {
    let t = /* @__PURE__ */ Object.create(null);
    return (e) => {
      let r = JSON.stringify(e);
      return t[r] ? true : (t[r] = true, false);
    };
  }
  function vn(t, e) {
    let r = [], n = [];
    for (let u of t) e(u) ? r.push(u) : n.push(u);
    return [r, n];
  }
  function Ln(t) {
    return t === Math.floor(t);
  }
  function Mn(t, e) {
    if (t === e) return 0;
    let r = typeof t, n = typeof e, u = ["undefined", "object", "boolean", "number", "string"];
    return r !== n ? u.indexOf(r) - u.indexOf(n) : r !== "string" ? Number(t) - Number(e) : t.localeCompare(e);
  }
  function Yn(t) {
    return (...e) => {
      let r = t(...e);
      return typeof r == "string" ? new Error(r) : r;
    };
  }
  function $t(t) {
    return t === void 0 ? {} : t;
  }
  function zt(t) {
    if (typeof t == "string") return { text: t };
    let { text: e, list: r } = t;
    return jo((e || r) !== void 0, "Unexpected `expected` result, there should be at least one field."), r ? { text: e, list: { title: r.title, values: r.values.map(zt) } } : { text: e };
  }
  function Gt(t, e) {
    return t === true ? true : t === false ? { value: e } : t;
  }
  function Kt(t, e, r = false) {
    return t === false ? false : t === true ? r ? true : [{ value: e }] : "value" in t ? [t] : t.length === 0 ? false : t;
  }
  function bn(t, e) {
    return typeof t == "string" || "key" in t ? { from: e, to: t } : "from" in t ? { from: t.from, to: t.to } : { from: e, to: t.to };
  }
  function dt(t, e) {
    return t === void 0 ? [] : Array.isArray(t) ? t.map((r) => bn(r, e)) : [bn(t, e)];
  }
  function Ht(t, e) {
    let r = dt(typeof t == "object" && "redirect" in t ? t.redirect : t, e);
    return r.length === 0 ? { remain: e, redirect: r } : typeof t == "object" && "remain" in t ? { remain: t.remain, redirect: r } : { redirect: r };
  }
  function jo(t, e) {
    if (!t) throw new Error(e);
  }
  var Ft = class extends O {
    constructor(e) {
      super(e), this._choices = In(e.choices.map((r) => r && typeof r == "object" ? r : { value: r }), "value");
    }
    expected({ descriptor: e }) {
      let r = Array.from(this._choices.keys()).map((i) => this._choices.get(i)).filter(({ hidden: i }) => !i).map((i) => i.value).sort(Mn).map(e.value), n = r.slice(0, -2), u = r.slice(-2);
      return { text: n.concat(u.join(" or ")).join(", "), list: { title: "one of the following values", values: r } };
    }
    validate(e) {
      return this._choices.has(e);
    }
    deprecated(e) {
      let r = this._choices.get(e);
      return r && r.deprecated ? { value: e } : false;
    }
    forward(e) {
      let r = this._choices.get(e);
      return r ? r.forward : void 0;
    }
    redirect(e) {
      let r = this._choices.get(e);
      return r ? r.redirect : void 0;
    }
  };
  var Et = class extends O {
    expected() {
      return "a number";
    }
    validate(e, r) {
      return typeof e == "number";
    }
  };
  var Ct = class extends Et {
    expected() {
      return "an integer";
    }
    validate(e, r) {
      return r.normalizeValidateResult(super.validate(e, r), e) === true && Ln(e);
    }
  };
  var Ye = class extends O {
    expected() {
      return "a string";
    }
    validate(e) {
      return typeof e == "string";
    }
  };
  var jn = ie;
  var Un = ct;
  var Vn = Nn;
  var Wn = xn;
  var ht = class {
    constructor(e, r) {
      let { logger: n = console, loggerPrintWidth: u = 80, descriptor: o = jn, unknown: i = Un, invalid: D = Vn, deprecated: s = Wn, missing: a = () => false, required: c = () => false, preprocess: p = (m) => m, postprocess: l = () => Ae } = r || {};
      this._utils = { descriptor: o, logger: n || { warn: () => {
      } }, loggerPrintWidth: u, schemas: kn(e, "name"), normalizeDefaultResult: $t, normalizeExpectedResult: zt, normalizeDeprecatedResult: Kt, normalizeForwardResult: dt, normalizeRedirectResult: Ht, normalizeValidateResult: Gt }, this._unknownHandler = i, this._invalidHandler = Yn(D), this._deprecatedHandler = s, this._identifyMissing = (m, f) => !(m in f) || a(m, f), this._identifyRequired = c, this._preprocess = p, this._postprocess = l, this.cleanHistory();
    }
    cleanHistory() {
      this._hasDeprecationWarned = Rn();
    }
    normalize(e) {
      let r = {}, u = [this._preprocess(e, this._utils)], o = () => {
        for (; u.length !== 0; ) {
          let i = u.shift(), D = this._applyNormalization(i, r);
          u.push(...D);
        }
      };
      o();
      for (let i of Object.keys(this._utils.schemas)) {
        let D = this._utils.schemas[i];
        if (!(i in r)) {
          let s = $t(D.default(this._utils));
          "value" in s && u.push({ [i]: s.value });
        }
      }
      o();
      for (let i of Object.keys(this._utils.schemas)) {
        if (!(i in r)) continue;
        let D = this._utils.schemas[i], s = r[i], a = D.postprocess(s, this._utils);
        a !== Ae && (this._applyValidation(a, i, D), r[i] = a);
      }
      return this._applyPostprocess(r), this._applyRequiredCheck(r), r;
    }
    _applyNormalization(e, r) {
      let n = [], { knownKeys: u, unknownKeys: o } = this._partitionOptionKeys(e);
      for (let i of u) {
        let D = this._utils.schemas[i], s = D.preprocess(e[i], this._utils);
        this._applyValidation(s, i, D);
        let a = ({ from: m, to: f }) => {
          n.push(typeof f == "string" ? { [f]: m } : { [f.key]: f.value });
        }, c = ({ value: m, redirectTo: f }) => {
          let F = Kt(D.deprecated(m, this._utils), s, true);
          if (F !== false) if (F === true) this._hasDeprecationWarned(i) || this._utils.logger.warn(this._deprecatedHandler(i, f, this._utils));
          else for (let { value: d } of F) {
            let E = { key: i, value: d };
            if (!this._hasDeprecationWarned(E)) {
              let C = typeof f == "string" ? { key: f, value: d } : f;
              this._utils.logger.warn(this._deprecatedHandler(E, C, this._utils));
            }
          }
        };
        dt(D.forward(s, this._utils), s).forEach(a);
        let l = Ht(D.redirect(s, this._utils), s);
        if (l.redirect.forEach(a), "remain" in l) {
          let m = l.remain;
          r[i] = i in r ? D.overlap(r[i], m, this._utils) : m, c({ value: m });
        }
        for (let { from: m, to: f } of l.redirect) c({ value: m, redirectTo: f });
      }
      for (let i of o) {
        let D = e[i];
        this._applyUnknownHandler(i, D, r, (s, a) => {
          n.push({ [s]: a });
        });
      }
      return n;
    }
    _applyRequiredCheck(e) {
      for (let r of Object.keys(this._utils.schemas)) if (this._identifyMissing(r, e) && this._identifyRequired(r)) throw this._invalidHandler(r, Dt, this._utils);
    }
    _partitionOptionKeys(e) {
      let [r, n] = vn(Object.keys(e).filter((u) => !this._identifyMissing(u, e)), (u) => u in this._utils.schemas);
      return { knownKeys: r, unknownKeys: n };
    }
    _applyValidation(e, r, n) {
      let u = Gt(n.validate(e, this._utils), e);
      if (u !== true) throw this._invalidHandler(r, u.value, this._utils);
    }
    _applyUnknownHandler(e, r, n, u) {
      let o = this._unknownHandler(e, r, this._utils);
      if (o) for (let i of Object.keys(o)) {
        if (this._identifyMissing(i, o)) continue;
        let D = o[i];
        i in this._utils.schemas ? u(i, D) : n[i] = D;
      }
    }
    _applyPostprocess(e) {
      let r = this._postprocess(e, this._utils);
      if (r !== Ae) {
        if (r.delete) for (let n of r.delete) delete e[n];
        if (r.override) {
          let { knownKeys: n, unknownKeys: u } = this._partitionOptionKeys(r.override);
          for (let o of n) {
            let i = r.override[o];
            this._applyValidation(i, o, this._utils.schemas[o]), e[o] = i;
          }
          for (let o of u) {
            let i = r.override[o];
            this._applyUnknownHandler(o, i, e, (D, s) => {
              let a = this._utils.schemas[D];
              this._applyValidation(s, D, a), e[D] = s;
            });
          }
        }
      }
    }
  };
  var Jt;
  function Uo(t, e, { logger: r = false, isCLI: n = false, passThrough: u = false, FlagSchema: o, descriptor: i } = {}) {
    if (n) {
      if (!o) throw new Error("'FlagSchema' option is required.");
      if (!i) throw new Error("'descriptor' option is required.");
    } else i = ie;
    let D = u ? Array.isArray(u) ? (l, m) => u.includes(l) ? { [l]: m } : void 0 : (l, m) => ({ [l]: m }) : (l, m, f) => {
      let { _: F, ...d } = f.schemas;
      return ct(l, m, { ...f, schemas: d });
    }, s = Vo(e, { isCLI: n, FlagSchema: o }), a = new ht(s, { logger: r, unknown: D, descriptor: i }), c = r !== false;
    c && Jt && (a._hasDeprecationWarned = Jt);
    let p = a.normalize(t);
    return c && (Jt = a._hasDeprecationWarned), p;
  }
  function Vo(t, { isCLI: e, FlagSchema: r }) {
    let n = [];
    e && n.push(lt.create({ name: "_" }));
    for (let u of t) n.push(Wo(u, { isCLI: e, optionInfos: t, FlagSchema: r })), u.alias && e && n.push(ft.create({ name: u.alias, sourceName: u.name }));
    return n;
  }
  function Wo(t, { isCLI: e, optionInfos: r, FlagSchema: n }) {
    let { name: u } = t, o = { name: u }, i, D = {};
    switch (t.type) {
      case "int":
        i = Ct, e && (o.preprocess = Number);
        break;
      case "string":
        i = Ye;
        break;
      case "choice":
        i = Ft, o.choices = t.choices.map((s) => s?.redirect ? { ...s, redirect: { to: { key: t.name, value: s.redirect } } } : s);
        break;
      case "boolean":
        i = mt;
        break;
      case "flag":
        i = n, o.flags = r.flatMap((s) => [s.alias, s.description && s.name, s.oppositeDescription && `no-${s.name}`].filter(Boolean));
        break;
      case "path":
        i = Ye;
        break;
      default:
        throw new Error(`Unexpected type ${t.type}`);
    }
    if (t.exception ? o.validate = (s, a, c) => t.exception(s) || a.validate(s, c) : o.validate = (s, a, c) => s === void 0 || a.validate(s, c), t.redirect && (D.redirect = (s) => s ? { to: typeof t.redirect == "string" ? t.redirect : { key: t.redirect.option, value: t.redirect.value } } : void 0), t.deprecated && (D.deprecated = true), e && !t.array) {
      let s = o.preprocess || ((a) => a);
      o.preprocess = (a, c, p) => c.preprocess(s(Array.isArray(a) ? y(0, a, -1) : a), p);
    }
    return t.array ? pt.create({ ...e ? { preprocess: (s) => Array.isArray(s) ? s : [s] } : {}, ...D, valueSchema: i.create(o) }) : i.create({ ...o, ...D });
  }
  var $n = Uo;
  var $o = Array.prototype.findLast ?? function(t) {
    for (let e = this.length - 1; e >= 0; e--) {
      let r = this[e];
      if (t(r, e, this)) return r;
    }
  };
  var zo = X("findLast", function() {
    if (Array.isArray(this)) return $o;
  });
  var qt = zo;
  var zn = /* @__PURE__ */ Symbol.for("PRETTIER_IS_FRONT_MATTER");
  var Xt = [];
  function Go(t) {
    return !!t?.[zn];
  }
  var pe = Go;
  var Gn = /* @__PURE__ */ new Set(["yaml", "toml"]);
  var je = ({ node: t }) => pe(t) && Gn.has(t.language);
  async function Qt(t, e, r, n) {
    let { node: u } = r, { language: o } = u;
    if (!Gn.has(o)) return;
    let i = u.value.trim(), D;
    if (i) {
      let s = o === "yaml" ? o : st(n, { language: o });
      if (!s) return;
      D = i ? await t(i, { parser: s }) : "";
    } else D = i;
    return Xe([u.startDelimiter, u.explicitLanguage ?? "", W, D, D ? W : "", u.endDelimiter]);
  }
  function Ko(t, e) {
    return je({ node: t }) && (delete e.end, delete e.raw, delete e.value), e;
  }
  var Zt = Ko;
  function Ho({ node: t }) {
    return t.raw;
  }
  var er = Ho;
  var Kn = /* @__PURE__ */ new Set(["tokens", "comments", "parent", "enclosingNode", "precedingNode", "followingNode"]);
  var Jo = (t) => Object.keys(t).filter((e) => !Kn.has(e));
  function qo(t, e) {
    let r = t ? (n) => t(n, Kn) : Jo;
    return e ? new Proxy(r, { apply: (n, u, o) => pe(o[0]) ? Xt : Reflect.apply(n, u, o) }) : r;
  }
  var tr = qo;
  function rr(t, e) {
    if (!e) throw new Error("parserName is required.");
    let r = qt(0, t, (u) => u.parsers && le(u.parsers, e));
    if (r) return r;
    let n = `Couldn't resolve parser "${e}".`;
    throw n += " Plugins must be explicitly added to the standalone bundle.", new Le(n);
  }
  function Hn(t, e) {
    if (!e) throw new Error("astFormat is required.");
    let r = qt(0, t, (u) => u.printers && le(u.printers, e));
    if (r) return r;
    let n = `Couldn't find plugin for AST format "${e}".`;
    throw n += " Plugins must be explicitly added to the standalone bundle.", new Le(n);
  }
  function Ue({ plugins: t, parser: e }) {
    let r = rr(t, e);
    return nr(r, e);
  }
  function nr(t, e) {
    let r = t.parsers[e];
    return typeof r == "function" ? r() : r;
  }
  async function Jn(t, e) {
    let r = t.printers[e], n = typeof r == "function" ? await r() : r;
    return Zo(n);
  }
  function Xo(t) {
    let { features: e, getVisitorKeys: r, embed: n, massageAstNode: u, print: o, ...i } = t;
    e = ni(e);
    let D = e.experimental_frontMatterSupport;
    r = tr(r, D.massageAstNode || D.embed || D.print);
    let s = u;
    u && D.massageAstNode && (s = new Proxy(u, { apply(l, m, f) {
      return Zt(...f), Reflect.apply(l, m, f);
    } }));
    let a = n;
    if (n) {
      let l;
      a = new Proxy(n, { get(m, f, F) {
        return f === "getVisitorKeys" ? (l ?? (l = n.getVisitorKeys ? tr(n.getVisitorKeys, D.massageAstNode || D.embed) : r), l) : Reflect.get(m, f, F);
      }, apply: (m, f, F) => D.embed && je(...F) ? Qt : Reflect.apply(m, f, F) });
    }
    let c = o;
    return D.print && (c = new Proxy(o, { apply(l, m, f) {
      let [F] = f;
      return pe(F.node) ? er(F) : Reflect.apply(l, m, f);
    } })), { features: e, getVisitorKeys: r, embed: a, massageAstNode: s, print: c, ...i };
  }
  var Qo = /* @__PURE__ */ new WeakMap();
  function Zo(t) {
    return Fe(Qo, t, Xo);
  }
  var ei = ["clean", "embed", "print"];
  var ti = Object.fromEntries(ei.map((t) => [t, false]));
  function ri(t) {
    return { ...ti, ...t };
  }
  function ni(t) {
    return { experimental_avoidAstMutation: false, ...t, experimental_frontMatterSupport: ri(t?.experimental_frontMatterSupport) };
  }
  var qn = { astFormat: "estree", printer: {}, originalText: void 0, locStart: null, locEnd: null, getVisitorKeys: null };
  async function ui(t, e = {}) {
    let r = { ...t };
    if (!r.parser) {
      if (!r.filepath) throw new Me("No parser and no file path given, couldn't infer a parser.");
      if (r.parser = st(r, { physicalFile: r.filepath }), !r.parser) throw new Me(`No parser could be inferred for file "${r.filepath}".`);
    }
    let n = it({ plugins: t.plugins, showDeprecated: true }).options, u = { ...qn, ...Object.fromEntries(n.filter((p) => p.default !== void 0).map((p) => [p.name, p.default])) }, o = rr(r.plugins, r.parser), i = await nr(o, r.parser);
    r.astFormat = i.astFormat, r.locEnd = i.locEnd, r.locStart = i.locStart;
    let D = o.printers?.[i.astFormat] ? o : Hn(r.plugins, i.astFormat), s = await Jn(D, i.astFormat);
    r.printer = s, r.getVisitorKeys = s.getVisitorKeys;
    let a = D.defaultOptions ? Object.fromEntries(Object.entries(D.defaultOptions).filter(([, p]) => p !== void 0)) : {}, c = { ...u, ...a };
    for (let [p, l] of Object.entries(c)) r[p] ?? (r[p] = l);
    return r.parser === "json" && (r.trailingComma = "none"), $n(r, n, { passThrough: Object.keys(qn), ...e });
  }
  var se = ui;
  var Xn = /\r\n|[\n\r\u2028\u2029]/;
  function oi(t, e, r, n) {
    let u = { column: null, line: -1, ...t.start }, o = { ...u, ...t.end }, { linesAbove: i = 2, linesBelow: D = 3 } = r || {}, s = u.line - n, a = u.column, c = o.line - n, p = o.column, l = Math.max(s - (i + 1), 0), m = Math.min(e.length, c + D);
    s === -1 && (l = 0), c === -1 && (m = e.length);
    let f = c - s, F = {};
    if (f) for (let d = 0; d <= f; d++) {
      let E = d + s;
      if (a == null) F[E] = true;
      else if (d === 0) {
        let C = e[E - 1].length;
        F[E] = [a, C - a];
      } else if (d === f) F[E] = [0, p];
      else {
        let C = e[E - 1].length;
        F[E] = [0, C];
      }
    }
    else if (a === p) a != null ? F[s] = [a, 0] : F[s] = true;
    else {
      let d = a ?? 0, E = p ?? d;
      F[s] = [d, E - d];
    }
    return { start: l, end: m, markerLines: F };
  }
  function Qn(t, e, r = {}, n) {
    let { defs: u, highlight: o } = n || { defs: { gutter: String, marker: String, message: String, reset: String }, highlight: String }, i = (r.startLine || 1) - 1, D = t.split(Xn), { start: s, end: a, markerLines: c } = oi(e, D, r, i), p = e.start && typeof e.start.column == "number", l = String(a + i).length, f = o(t).split(Xn, a).slice(s, a).map((F, d) => {
      let E = s + 1 + d, h = ` ${` ${E + i}`.slice(-l)} |`, _ = c[E], P = !c[E + 1];
      if (_) {
        let A = "";
        if (Array.isArray(_)) {
          let B = F.slice(0, _[0]).replace(/[^\t]/g, " "), J = _[1] || 1;
          A = [`
 `, u.gutter(h.replace(/\d/g, " ")), " ", B, u.marker("^").repeat(J)].join(""), P && r.message && (A += " " + u.message(r.message));
        }
        return [u.marker(">"), u.gutter(h), F.length > 0 ? ` ${F}` : "", A].join("");
      } else return ` ${u.gutter(h)}${F.length > 0 ? ` ${F}` : ""}`;
    }).join(`
`);
    return r.message && !p && (f = `${" ".repeat(l + 1)}${r.message}
${f}`), u.reset(f);
  }
  function Zn(t, e, r = {}) {
    return Qn(t, e, r);
  }
  async function ii(t, e) {
    let r = await Ue(e), n = r.preprocess ? await r.preprocess(t, e) : t;
    e.originalText = n;
    let u;
    try {
      u = await r.parse(n, e, e);
    } catch (o) {
      si(o, t);
    }
    return { text: n, ast: u };
  }
  function si(t, e) {
    let { loc: r } = t;
    if (r) {
      let { start: n, end: u } = r;
      n && (n = { line: n.line, column: n.column - 1 }), u && (u = { line: u.line, column: u.column - 1 });
      let o = Zn(e, { start: n, end: u }, { highlightCode: true });
      t.message += `
` + o, t.codeFrame = o;
    }
    throw t;
  }
  var me = ii;
  async function eu(t, e, r, n, u) {
    if (r.embeddedLanguageFormatting !== "auto") return;
    let { printer: o } = r, { embed: i } = o;
    if (!i) return;
    if (i.length > 2) throw new Error("printer.embed has too many parameters. The API changed in Prettier v3. Please update your plugin. See https://prettier.io/docs/plugins#optional-embed");
    let { hasPrettierIgnore: D } = o, { getVisitorKeys: s } = i, a = [];
    l();
    let c = t.stack;
    for (let { print: m, node: f, pathStack: F } of a) try {
      t.stack = F;
      let d = await m(p, e, t, r);
      d && u.set(f, d);
    } catch (d) {
      if (globalThis.PRETTIER_DEBUG) throw d;
    }
    t.stack = c;
    function p(m, f) {
      return Di(m, f, r, n);
    }
    function l() {
      let { node: m } = t;
      if (m === null || typeof m != "object" || D?.(t)) return;
      for (let F of s(m)) Array.isArray(m[F]) ? t.each(l, F) : t.call(l, F);
      let f = i(t, r);
      if (f) {
        if (typeof f == "function") {
          a.push({ print: f, node: m, pathStack: [...t.stack] });
          return;
        }
        u.set(m, f);
      }
    }
  }
  async function Di(t, e, r, n) {
    let u = await se({ ...r, ...e, parentParser: r.parser, originalText: t, cursorOffset: void 0, rangeStart: void 0, rangeEnd: void 0 }, { passThrough: true }), { ast: o } = await me(t, u), i = await n(o, u);
    return He(i);
  }
  function ai(t, e, r, n) {
    let { originalText: u, [ue]: o, locStart: i, locEnd: D, [/* @__PURE__ */ Symbol.for("printedComments")]: s } = e, { node: a } = t, c = i(a), p = D(a);
    for (let m of o) i(m) >= c && D(m) <= p && s.add(m);
    let { printPrettierIgnored: l } = e.printer;
    return l ? l(t, e, r, n) : u.slice(c, p);
  }
  var tu = ai;
  async function Ve(t, e) {
    ({ ast: t } = await ur(t, e));
    let r = /* @__PURE__ */ new Map(), n = new en(t), u = dn(e), o = /* @__PURE__ */ new Map();
    await eu(n, D, e, Ve, o);
    let i = await ru(n, e, D, void 0, o);
    if (mn(e), e.cursorOffset >= 0) {
      if (e.nodeAfterCursor && !e.nodeBeforeCursor) return [ee, i];
      if (e.nodeBeforeCursor && !e.nodeAfterCursor) return [i, ee];
    }
    return i;
    function D(a, c) {
      return a === void 0 || a === n ? s(c) : Array.isArray(a) ? n.call(() => s(c), ...a) : n.call(() => s(c), a);
    }
    function s(a) {
      u(n);
      let c = n.node;
      if (c == null) return "";
      let p = ge(c) && a === void 0;
      if (p && r.has(c)) return r.get(c);
      let l = ru(n, e, D, a, o);
      return p && r.set(c, l), l;
    }
  }
  function ru(t, e, r, n, u) {
    let { node: o } = t, { printer: i } = e, D;
    switch (i.hasPrettierIgnore?.(t) ? D = tu(t, e, r, n) : u.has(o) ? D = u.get(o) : D = i.print(t, e, r, n), o) {
      case e.cursorNode:
        D = Ee(D, (s) => [ee, s, ee]);
        break;
      case e.nodeBeforeCursor:
        D = Ee(D, (s) => [s, ee]);
        break;
      case e.nodeAfterCursor:
        D = Ee(D, (s) => [ee, s]);
        break;
    }
    return i.printComment && rt(o.comments) && !i.willPrintOwnComments?.(t, e) && (D = pn(t, D, e)), D;
  }
  async function ur(t, e) {
    let r = t.comments ?? [];
    e[ue] = r, e[/* @__PURE__ */ Symbol.for("printedComments")] = /* @__PURE__ */ new Set(), an(t, e);
    let { printer: { preprocess: n } } = e;
    return t = n ? await n(t, e) : t, { ast: t, comments: r };
  }
  function ci(t, e) {
    let { cursorOffset: r, locStart: n, locEnd: u, getVisitorKeys: o } = e, i = (m) => n(m) <= r && u(m) >= r, D = t, s = [t];
    for (let m of nn(t, { getVisitorKeys: o, filter: i })) s.push(m), D = m;
    if (un(D, { getVisitorKeys: o })) return { cursorNode: D };
    let a, c, p = -1, l = Number.POSITIVE_INFINITY;
    for (; s.length > 0 && (a === void 0 || c === void 0); ) {
      D = s.pop();
      let m = a !== void 0, f = c !== void 0;
      for (let F of ye(D, { getVisitorKeys: o })) {
        if (!m) {
          let d = u(F);
          d <= r && d > p && (a = F, p = d);
        }
        if (!f) {
          let d = n(F);
          d >= r && d < l && (c = F, l = d);
        }
      }
    }
    return { nodeBeforeCursor: a, nodeAfterCursor: c };
  }
  var or = ci;
  function fi(t, e) {
    let { printer: r } = e, n = r.massageAstNode;
    if (!n) return t;
    let { getVisitorKeys: u } = r, { ignoredProperties: o } = n;
    return i(t);
    function i(D, s) {
      if (!ge(D)) return D;
      if (Array.isArray(D)) return D.map((l) => i(l, s)).filter(Boolean);
      let a = {}, c = new Set(u(D));
      for (let l in D) !le(D, l) || o?.has(l) || (c.has(l) ? a[l] = i(D[l], D) : a[l] = D[l]);
      let p = n(D, a, s);
      if (p !== null) return p ?? a;
    }
  }
  var nu = fi;
  var li = Array.prototype.findLastIndex ?? function(t) {
    for (let e = this.length - 1; e >= 0; e--) {
      let r = this[e];
      if (t(r, e, this)) return e;
    }
    return -1;
  };
  var pi = X("findLastIndex", function() {
    if (Array.isArray(this)) return li;
  });
  var uu = pi;
  function mi(t, e) {
    return e = new Set(e), t.find((r) => su.has(r.type) && e.has(r));
  }
  function ou(t) {
    let e = uu(0, t, (r) => r.type !== "Program" && r.type !== "File");
    return e === -1 ? t : t.slice(0, e + 1);
  }
  function di(t, e, { locStart: r, locEnd: n }) {
    let [u, ...o] = t, [i, ...D] = e;
    if (u === i) return [u, i];
    let s = r(u);
    for (let c of ou(D)) if (r(c) >= s) i = c;
    else break;
    let a = n(i);
    for (let c of ou(o)) {
      if (n(c) <= a) u = c;
      else break;
      if (u === i) break;
    }
    return [u, i];
  }
  function ir(t, e, r, n, u = [], o, i) {
    let { locStart: D, locEnd: s } = i, a = D(t), c = s(t);
    if (e > c || e < a || o === "rangeEnd" && e === a || o === "rangeStart" && e === c) return;
    let p = [t, ...u], l = ot(t, p, { cache: Ut, locStart: D, locEnd: s, getVisitorKeys: r.getVisitorKeys, filter: r.printer.canAttachComment, getChildren: r.printer.getCommentChildNodes });
    for (let m of l) {
      let f = ir(m, e, r, n, p, o, i);
      if (f) return f;
    }
    if (n(t, u[0])) return p;
  }
  function Fi(t, e) {
    return e !== "DeclareExportDeclaration" && t !== "TypeParameterDeclaration" && (t === "Directive" || t === "TypeAlias" || t === "TSExportAssignment" || t.startsWith("Declare") || t.startsWith("TSDeclare") || t.endsWith("Statement") || t.endsWith("Declaration"));
  }
  var su = /* @__PURE__ */ new Set(["JsonRoot", "ObjectExpression", "ArrayExpression", "StringLiteral", "NumericLiteral", "BooleanLiteral", "NullLiteral", "UnaryExpression", "TemplateLiteral"]);
  var Ei = /* @__PURE__ */ new Set(["OperationDefinition", "FragmentDefinition", "VariableDefinition", "TypeExtensionDefinition", "ObjectTypeDefinition", "FieldDefinition", "DirectiveDefinition", "EnumTypeDefinition", "EnumValueDefinition", "InputValueDefinition", "InputObjectTypeDefinition", "SchemaDefinition", "OperationTypeDefinition", "InterfaceTypeDefinition", "UnionTypeDefinition", "ScalarTypeDefinition"]);
  function iu(t, e, r) {
    if (!e) return false;
    switch (t.parser) {
      case "flow":
      case "hermes":
      case "babel":
      case "babel-flow":
      case "babel-ts":
      case "typescript":
      case "acorn":
      case "espree":
      case "meriyah":
      case "oxc":
      case "oxc-ts":
      case "yuku":
      case "yuku-ts":
      case "__babel_estree":
        return Fi(e.type, r?.type);
      case "json":
      case "json5":
      case "jsonc":
      case "json-stringify":
        return su.has(e.type);
      case "graphql":
        return Ei.has(e.kind);
      case "vue":
        return e.tag !== "root";
    }
    return false;
  }
  function Du(t, e, r) {
    let { rangeStart: n, rangeEnd: u } = e;
    k(u > n);
    let o = t.slice(n, u).search(/\S/), i = o === -1;
    if (!i) for (n += o; u > n && !/\S/.test(t[u - 1]); --u) ;
    let D = e.printer.features?.experimental_locForRangeFormat ?? e, s = ir(r, n, e, (f, F) => iu(e, f, F), [], "rangeStart", D);
    if (!s) return;
    let a = i ? s : ir(r, u, e, (f) => iu(e, f), [], "rangeEnd", D);
    if (!a) return;
    let c, p;
    if (r.type === "JsonRoot") {
      let f = mi(s, a);
      c = f, p = f;
    } else [c, p] = di(s, a, e);
    let { locStart: l, locEnd: m } = D;
    return [Math.min(l(c), l(p)), Math.max(m(c), m(p))];
  }
  var lu = "\uFEFF";
  var au = /* @__PURE__ */ Symbol("cursor");
  async function pu(t, e, r = 0) {
    if (!t || t.trim().length === 0) return { formatted: "", cursorOffset: -1, comments: [] };
    let { ast: n, text: u } = await me(t, e);
    e.cursorOffset >= 0 && (e = { ...e, ...or(n, e) });
    let o = await Ve(n, e, r);
    r > 0 && (o = Qe([W, o], r, e.tabWidth));
    let i = Ce(o, e);
    if (r > 0) {
      let s = i.formatted.trim();
      i.cursorNodeStart !== void 0 && (i.cursorNodeStart -= i.formatted.indexOf(s), i.cursorNodeStart < 0 && (i.cursorNodeStart = 0, i.cursorNodeText = i.cursorNodeText.trimStart()), i.cursorNodeStart + i.cursorNodeText.length > s.length && (i.cursorNodeText = i.cursorNodeText.trimEnd())), i.formatted = s + we(e.endOfLine);
    }
    let D = e[ue];
    if (e.cursorOffset >= 0) {
      let s, a, c, p;
      if ((e.cursorNode || e.nodeBeforeCursor || e.nodeAfterCursor) && i.cursorNodeText) if (c = i.cursorNodeStart, p = i.cursorNodeText, e.cursorNode) s = e.locStart(e.cursorNode), a = u.slice(s, e.locEnd(e.cursorNode));
      else {
        if (!e.nodeBeforeCursor && !e.nodeAfterCursor) throw new Error("Cursor location must contain at least one of cursorNode, nodeBeforeCursor, nodeAfterCursor");
        s = e.nodeBeforeCursor ? e.locEnd(e.nodeBeforeCursor) : 0;
        let E = e.nodeAfterCursor ? e.locStart(e.nodeAfterCursor) : u.length;
        a = u.slice(s, E);
      }
      else s = 0, a = u, c = 0, p = i.formatted;
      let l = e.cursorOffset - s;
      if (a === p) return { formatted: i.formatted, cursorOffset: c + l, comments: D };
      let m = a.split("");
      m.splice(l, 0, au);
      let f = p.split(""), F = xt(m, f), d = c;
      for (let E of F) if (E.removed) {
        if (E.value.includes(au)) break;
      } else d += E.count;
      return { formatted: i.formatted, cursorOffset: d, comments: D };
    }
    return { formatted: i.formatted, cursorOffset: -1, comments: D };
  }
  async function Ci(t, e) {
    let { ast: r, text: n } = await me(t, e), [u, o] = Du(n, e, r) ?? [0, 0], i = n.slice(u, o), D = Math.min(u, n.lastIndexOf(`
`, u) + 1), s = n.slice(D, u).match(/^\s*/)[0], a = he(s, e.tabWidth), c = await pu(i, { ...e, rangeStart: 0, rangeEnd: Number.POSITIVE_INFINITY, cursorOffset: e.cursorOffset > u && e.cursorOffset <= o ? e.cursorOffset - u : -1, endOfLine: "lf" }, a), p = c.formatted.trimEnd(), { cursorOffset: l } = e;
    l > o ? l += p.length - i.length : c.cursorOffset >= 0 && (l = c.cursorOffset + u);
    let m = n.slice(0, u) + p + n.slice(o);
    if (e.endOfLine !== "lf") {
      let f = we(e.endOfLine);
      l >= 0 && f === `\r
` && (l += Tt(m.slice(0, l), `
`)), m = ne(0, m, `
`, f);
    }
    return { formatted: m, cursorOffset: l, comments: c.comments };
  }
  function sr(t, e, r) {
    return typeof e != "number" || Number.isNaN(e) || e < 0 || e > t.length ? r : e;
  }
  function cu(t, e) {
    let { cursorOffset: r, rangeStart: n, rangeEnd: u } = e;
    return r = sr(t, r, -1), n = sr(t, n, 0), u = sr(t, u, t.length), { ...e, cursorOffset: r, rangeStart: n, rangeEnd: u };
  }
  function mu(t, e) {
    let { cursorOffset: r, rangeStart: n, rangeEnd: u, endOfLine: o } = cu(t, e), i = t.charAt(0) === lu;
    if (i && (t = t.slice(1), r--, n--, u--), o === "auto" && (o = Cr(t)), t.includes("\r")) {
      let D = (s) => Tt(t.slice(0, Math.max(s, 0)), `\r
`);
      r -= D(r), n -= D(n), u -= D(u), t = hr(t);
    }
    return { hasBOM: i, text: t, options: cu(t, { ...e, cursorOffset: r, rangeStart: n, rangeEnd: u, endOfLine: o }) };
  }
  async function fu(t, e) {
    let r = await Ue(e);
    return !r.hasPragma || r.hasPragma(t);
  }
  async function hi(t, e) {
    return (await Ue(e)).hasIgnorePragma?.(t);
  }
  async function Dr(t, e) {
    let { hasBOM: r, text: n, options: u } = mu(t, await se(e));
    if (u.rangeStart >= u.rangeEnd && n !== "" || u.requirePragma && !await fu(n, u) || u.checkIgnorePragma && await hi(n, u)) return { formatted: t, cursorOffset: e.cursorOffset, comments: [] };
    let o;
    return u.rangeStart > 0 || u.rangeEnd < n.length ? o = await Ci(n, u) : (!u.requirePragma && u.insertPragma && u.printer.insertPragma && !await fu(n, u) && (n = u.printer.insertPragma(n)), o = await pu(n, u)), r && (o.formatted = lu + o.formatted, o.cursorOffset >= 0 && o.cursorOffset++), o;
  }
  async function du(t, e, r) {
    let { text: n, options: u } = mu(t, await se(e)), o = await me(n, u);
    return r && (r.preprocessForPrint && (o.ast = await ur(o.ast, u)), r.massage && (o.ast = nu(o.ast, u))), o;
  }
  async function Fu(t, e) {
    e = await se(e);
    let r = await Ve(t, e);
    return Ce(r, e);
  }
  async function Eu(t, e) {
    let r = Ur(t), { formatted: n } = await Dr(r, { ...e, parser: "__js_expression" });
    return n;
  }
  async function Cu(t, e) {
    e = await se(e);
    let { ast: r } = await me(t, e);
    return e.cursorOffset >= 0 && (e = { ...e, ...or(r, e) }), Ve(r, e);
  }
  async function hu(t, e) {
    return Ce(t, await se(e));
  }
  var ar = {};
  yt(ar, { builders: () => _i, printer: () => yi, utils: () => Ai });
  var _i = { join: be, line: Ze, softline: Mr, hardline: W, literalline: Je, group: wt, conditionalGroup: Ir, fill: kr, lineSuffix: Ie, lineSuffixBoundary: Yr, cursor: ee, breakParent: ae, ifBreak: Rr, trim: jr, indent: oe, indentIfBreak: vr, align: De, addAlignmentToDoc: Qe, markAsRoot: Xe, dedentToRoot: Sr, dedent: br, hardlineWithoutBreakParent: ke, literallineWithoutBreakParent: Ot, label: Lr, concat: (t) => t };
  var yi = { printDocToString: Ce };
  var Ai = { willBreak: xr, traverseDoc: Oe, findInDoc: Ke, mapDoc: Se, removeLines: Tr, stripTrailingHardline: He, replaceEndOfLine: Nr, canBreak: wr };
  var gu = "3.9.9";
  var fr = {};
  yt(fr, { addDanglingComment: () => re, addLeadingComment: () => ce, addTrailingComment: () => fe, getAlignmentSize: () => he, getIndentSize: () => _u2, getMaxContinuousCount: () => yu, getNextNonSpaceNonCommentCharacter: () => Au, getNextNonSpaceNonCommentCharacterIndex: () => vi, getPreferredQuote: () => Tu, getStringWidth: () => Re, hasNewline: () => H, hasNewlineInRange: () => Nu, hasSpaces: () => wu, isNextLineEmpty: () => Ui, isNextLineEmptyAfterIndex: () => gt, isPreviousLineEmpty: () => Mi, makeString: () => ji, skip: () => _e2, skipEverythingButNewLine: () => ut, skipInlineComment: () => Be, skipNewline: () => $, skipSpaces: () => j, skipToLineEnd: () => nt, skipTrailingComment: () => Te, skipWhitespace: () => tn });
  function xi(t, e) {
    if (e === false) return false;
    if (t.charAt(e) === "/" && t.charAt(e + 1) === "*") {
      for (let r = e + 2; r < t.length; ++r) if (t.charAt(r) === "*" && t.charAt(r + 1) === "/") return r + 2;
    }
    return e;
  }
  var Be = xi;
  function Bi(t, e) {
    return e === false ? false : t.charAt(e) === "/" && t.charAt(e + 1) === "/" ? ut(t, e) : e;
  }
  var Te = Bi;
  function Ti(t, e) {
    let r = null, n = e;
    for (; n !== r; ) r = n, n = j(t, n), n = Be(t, n), n = Te(t, n), n = $(t, n);
    return n;
  }
  var We = Ti;
  function Ni(t, e) {
    let r = null, n = e;
    for (; n !== r; ) r = n, n = nt(t, n), n = Be(t, n), n = j(t, n);
    return n = Te(t, n), n = $(t, n), n !== false && H(t, n);
  }
  var gt = Ni;
  function wi(t, e) {
    let r = t.lastIndexOf(`
`);
    return r === -1 ? 0 : he(t.slice(r + 1).match(/^[\t ]*/)[0], e);
  }
  var _u2 = wi;
  function cr(t) {
    if (typeof t != "string") throw new TypeError("Expected a string");
    return t.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
  }
  function Oi(t, e) {
    let r = t.matchAll(new RegExp(`(?:${cr(e)})+`, "g"));
    return r.reduce || (r = [...r]), r.reduce((n, [u]) => Math.max(n, u.length), 0) / e.length;
  }
  var yu = Oi;
  function Pi(t, e) {
    let r = We(t, e);
    return r === false ? "" : t.charAt(r);
  }
  var Au = Pi;
  var xu = Object.freeze({ character: "'", codePoint: 39 });
  var Bu = Object.freeze({ character: '"', codePoint: 34 });
  var Si = Object.freeze({ preferred: xu, alternate: Bu });
  var bi = Object.freeze({ preferred: Bu, alternate: xu });
  function Tu(t, e) {
    let { preferred: r, alternate: n } = e === true || e === "'" ? Si : bi, { length: u } = t, o = 0, i = 0;
    for (let D = 0; D < u; D++) {
      let s = t.charCodeAt(D);
      s === r.codePoint ? o++ : s === n.codePoint && i++;
    }
    return (o > i ? n : r).character;
  }
  function ki(t, e, r) {
    for (let n = e; n < r; ++n) if (t.charAt(n) === `
`) return true;
    return false;
  }
  var Nu = ki;
  function Ii(t, e, r = {}) {
    return j(t, r.backwards ? e - 1 : e, r) !== e;
  }
  var wu = Ii;
  function Ri(t, e, r) {
    return We(t, r(e));
  }
  function vi(t, e) {
    return arguments.length === 2 || typeof e == "number" ? We(t, e) : Ri(...arguments);
  }
  function Li(t, e, r) {
    return ve(t, r(e));
  }
  function Mi(t, e) {
    return arguments.length === 2 || typeof e == "number" ? ve(t, e) : Li(...arguments);
  }
  function Yi(t, e, r) {
    return gt(t, r(e));
  }
  function ji(t, e, r) {
    let n = e === '"' ? "'" : '"', o = ne(0, t, /\\(.)|(["'])/gs, (i, D, s) => D === n ? D : s === e ? "\\" + s : s || (r && /^[^\n\r"'0-7\\bfnrt-vx\u2028\u2029]$/.test(D) ? D : "\\" + D));
    return e + o + e;
  }
  function Ui(t, e) {
    return arguments.length === 2 || typeof e == "number" ? gt(t, e) : Yi(...arguments);
  }
  function de(t, e = 1) {
    return async (...r) => {
      let n = r[e] ?? {}, u = n.plugins ?? [];
      return r[e] = { ...n, plugins: Array.isArray(u) ? u : Object.values(u) }, await t(...r);
    };
  }
  var Ou = de(Dr);
  async function Pu(t, e) {
    let { formatted: r } = await Ou(t, { ...e, cursorOffset: -1 });
    return r;
  }
  async function Vi(t, e) {
    return await Pu(t, e) === t;
  }
  var Wi = de(it, 0);
  var $i = { parse: de(du), formatAST: de(Fu), formatDoc: de(Eu), printToDoc: de(Cu), printDocToString: de(hu) };
  var ResLoader = {
    get: (_url, _callback, _async) => {
      throw new Error(
        'SAS language data is missing: the browser loader was called before formatText() installed it. Call formatText() from "@sasjs/sas-language/format" in a browser rather than importing the core directly.'
      );
    },
    getBundle: (_locale) => ""
  };
  function isSamePosition(pos1, pos2) {
    return pos1.line === pos2.line && pos1.column === pos2.column;
  }
  function arrayToMap(arr) {
    const map = {};
    for (const key of arr) {
      map[key] = 1;
    }
    return map;
  }
  var locale = typeof process !== "undefined" && process.env.VSCODE_NLS_CONFIG ? JSON.parse(process.env.VSCODE_NLS_CONFIG).locale : globalThis.navigator?.language ?? "en";
  var isCustomRegionStartComment = (commmentText) => {
    return /^\s*[%/]?\*\s*region\b/i.test(commmentText ?? "");
  };
  var isCustomRegionEndComment = (commmentText) => {
    return /^\s*[%/]?\*\s*endregion\b/i.test(commmentText ?? "");
  };
  var getBaseUrl = () => "../..";
  var db = {
    procOpts: {},
    procStmts: {},
    kwPool: {},
    stmts: {},
    functions: {},
    sasColors: []
  };
  var ID_HELP = "_$help";
  var ID_TYPE = "_$type";
  var ID_OPTS = "_$options";
  var ID_OPTS_REQ = "_$optionsReq";
  var ID_VALS = "_$values";
  var ID_STMTS = "_$stms";
  var ID_HAS_OPT_DELIMITER = "_$hasOptDelimiter";
  var ID_SUB_OPTS = "_$subOpts";
  var ID_KEYWORDS = "_$keywords";
  var ID_ALIAS = "_$alias";
  var ID_ATTR = "_$attr";
  var ID_SYNTAX = "_$syntax";
  var ID_ARGUMENTS = "_$arguments";
  var ID_SUPPORT_SITE = "_$supportSite";
  var stmtTable = arrayToMap([
    "ABORT",
    "ARRAY",
    "ATTRIB",
    "AXIS",
    "ENDRSUBMIT",
    "FILE",
    "FILENAME",
    "FOOTNOTE",
    "FORMAT",
    "GOPTIONS",
    "INFILE",
    "INFORMAT",
    "KILLTASK",
    "LEGEND",
    "LIBNAME",
    "LISTTASK",
    "LOCK",
    "NOTE",
    "ODS",
    "OPTIONS",
    "PATTERN",
    "RDISPLAY",
    "RGET",
    "RSUBMIT",
    "RUN",
    "SIGNOFF",
    "SIGNON",
    "SYMBOL",
    "SYSTASK",
    "TITLE",
    "CAS",
    "CASLIB",
    "WAITFOR",
    "WHERE",
    "DATA-SET",
    "DATA-STEP"
  ]);
  var procTable = arrayToMap([
    "MACRO",
    "ODS",
    "DATA",
    "STATGRAPH",
    "DEFINE_TAGSET",
    "DEFINE_EVENT"
  ]);
  var libService;
  function _uniq(arr) {
    const a = [], o = {}, len = arr.length;
    if (len < 2) {
      return arr;
    }
    for (let i = 0; i < len; i++) {
      const v2 = arr[i];
      if (!o[v2]) {
        a.push(v2);
        o[v2] = true;
      }
    }
    return a;
  }
  function _notify(cb, data) {
    if (cb) {
      setTimeout(function() {
        cb(data);
      }, 0);
    }
    return data;
  }
  function _obj(root, ...other) {
    let i = 0, obj = root;
    for (; obj && (other[i] !== void 0 || other[i + 1] !== void 0); i++) {
      obj = obj[other[i]];
    }
    return obj;
  }
  function _removeEqu(name) {
    return name.replace("=", "");
  }
  function _cleanName(name) {
    const matched = /^\((.*)\)$/.exec(name);
    if (matched) {
      return matched[1];
    } else {
      return name.replace(/(\(.*\))|=/g, "");
    }
  }
  function _resolveAliasFromPubs(alias, item) {
    const cloneItem = JSON.parse(JSON.stringify(item));
    cloneItem.name = alias;
    const index = cloneItem.aliases.indexOf(alias);
    cloneItem.aliases.splice(index, 1, item.name);
    return cloneItem;
  }
  function _resolveAlias(name, pool) {
    return pool.split("|").filter(function(item) {
      return item && _removeEqu(item) !== name;
    });
  }
  function _stmtOptSupportSite(context, stmtName, optName) {
    let supportSite = _procStmtObj(context, stmtName)[ID_SUPPORT_SITE];
    if (supportSite) {
      const optionSite = _procStmtObj(context, stmtName, optName)[ID_SUPPORT_SITE];
      if (optionSite && optionSite.docsetTargetFile) {
        return optionSite;
      }
      supportSite = Object.assign({}, supportSite);
      supportSite.supportSiteTargetFile = supportSite.docsetTargetFile;
      supportSite.supportSiteTargetFragment = optionSite;
    }
    return supportSite;
  }
  function _procOptSupportSite(procName, optName) {
    let supportSite = _procOptObj(procName)[ID_SUPPORT_SITE];
    if (supportSite) {
      supportSite = Object.assign({}, supportSite);
      supportSite.supportSiteTargetFragment = _procOptObj(
        procName,
        _removeEqu(optName)
      )[ID_SUPPORT_SITE];
    }
    return supportSite;
  }
  function _procStmtOptSupportSite(procName, stmtName, optName) {
    let supportSite = _procOptObj(procName)[ID_SUPPORT_SITE];
    if (supportSite) {
      supportSite = Object.assign({}, supportSite);
      supportSite.supportSiteTargetFile = _procStmtObj(procName, stmtName)[ID_SUPPORT_SITE];
      supportSite.supportSiteTargetFragment = _procStmtObj(
        procName,
        stmtName,
        optName
      )[ID_SUPPORT_SITE];
    }
    return supportSite;
  }
  function _procOptObj(procName, optName, valName, subOptName) {
    if (optName) {
      optName = _removeEqu(optName);
    }
    if (subOptName) {
      subOptName = _removeEqu(subOptName);
    }
    return _obj(db.procOpts, procName, optName, valName, subOptName);
  }
  function _procStmtObj(procName, stmtName, optName, valName, subOptName) {
    if (optName) {
      optName = _cleanName(optName);
    }
    if (subOptName) {
      subOptName = _removeEqu(subOptName);
    }
    return _obj(db.procStmts, procName, stmtName, optName, valName, subOptName);
  }
  function _keywordObj(type, name) {
    return _obj(db.kwPool, type, name);
  }
  function _stmtObj(stmtName, optName, valName, subOptName) {
    if (optName) {
      optName = _removeEqu(optName);
    }
    return _obj(db.stmts, stmtName, optName, valName, subOptName);
  }
  function _funcObj(funcName, context) {
    return _obj(db.functions, context, funcName);
  }
  var Type2File = {
    formats: "SASFormats.json",
    informats: "SASInformats.json",
    "macro-func": "SASMacroFunctions.json",
    "macro-stmt": "SASMacroStatements.json",
    "macro-def-opt": "MacroDefinitionOptions.json",
    "ods-tagsets": "ODS_Tagsets.json",
    "auto-var": "SASAutoVariables.json",
    "autocall-macro": "SASAutocallMacros.json",
    "arm-macro": "SASARMMacros.json",
    "call-routines": "SASCallRoutines.json",
    "hash-pack-method": "HashPackageMethods.json",
    "stat-kw": "StatisticsKeywords.json",
    "style-loc": "StyleLocations.json",
    "style-att": "StyleAttributes.json",
    "style-ele": "StyleElements.json",
    func: "SASFunctions.json",
    "ds-stmt": "SASDataStepStatements.json",
    "ds-option": "SASDataSetOptions.json",
    "gbl-stmt": "SASGlobalStatements.json",
    "gbl-proc-stmt": "SASGlobalProcedureStatements.json",
    proc: "SASProcedures.json",
    "datastep-option": "SASDataStepOptions.json",
    "datastep-option2": "SASDataStepOptions2.json",
    sql: "SQLKeywords.json"
  };
  function _resolveURL(type) {
    let url = getBaseUrl() + "/data/";
    if (Type2File[type]) {
      url += Type2File[type];
    } else {
      return null;
    }
    return url;
  }
  function _getSubOptKeywords(obj, data) {
    const keywords = data.split("|");
    if (!obj[ID_KEYWORDS]) {
      obj[ID_KEYWORDS] = [];
    }
    const list = obj[ID_KEYWORDS];
    keywords.forEach(function(item) {
      item = typeof item === "string" ? item.trim() : item !== null ? String(item).trim() : "";
      if (item === "") {
        return;
      }
      obj[_removeEqu(item)] = true;
      list.push(item);
    });
    return obj;
  }
  function _getHelp(data) {
    return data ? data["#cdata"] : "";
  }
  function _iterateValues(values, tooltips, cb) {
    let i = 1, j2 = 0, name = "@Value" + i, names;
    while (values[name]) {
      names = values[name].split("|");
      for (j2 = 0; j2 < names.length; j2++) {
        cb(j2, names[j2], tooltips ? tooltips["@ToolTip" + i] : void 0);
      }
      i++;
      name = "@Value" + i;
    }
  }
  function _iterateKeywords(keywords, cb) {
    const count = keywords.length;
    for (let i = 0; i < count; i++) {
      if (!keywords[i]["Name"]) {
        continue;
      }
      const names = keywords[i].Name.split("|");
      for (let j2 = 0; j2 < names.length; j2++) {
        cb(i, names[j2], keywords[i]);
      }
    }
  }
  function _tryToLoad(config) {
    if (!config.needToLoad()) {
      return _notify(config.userCb, config.getData());
    } else {
      const async = !!config.userCb;
      if (async) {
        config.load(function() {
          config.userCb?.(config.getData());
        });
      } else {
        config.load();
        return config.getData();
      }
    }
  }
  function _setColors(values) {
    _iterateValues(values, null, function(i, name, tooltip) {
      db.sasColors.push(name);
    });
  }
  function _loadColors(cb) {
    const url = getBaseUrl() + "/data/SASColorValues.json";
    ResLoader.get(
      url,
      function(data) {
        if (data && data.Color) {
          _setColors(data.Color.Values);
          if (cb) {
            cb();
          }
        }
      },
      !!cb
    );
  }
  function _sasColorsLoaded() {
    return db.sasColors.length > 0;
  }
  function _tryToLoadColors(userCb) {
    return _tryToLoad({
      userCb,
      getData: function() {
        return db.sasColors;
      },
      needToLoad: function() {
        return !_sasColorsLoaded();
      },
      load: function(cb) {
        _loadColors(cb);
      }
    });
  }
  function _getFunctionHelp(funcName, context, userCb) {
    return _tryToLoadFunctionsFromPubs(context, userCb, function() {
      let data = _funcObj(funcName, context);
      if (data) {
        data = {
          key: funcName,
          data: data[ID_HELP],
          syntax: data[ID_SYNTAX],
          arguments: data[ID_ARGUMENTS],
          supportSite: data[ID_SUPPORT_SITE]
        };
      }
      return data;
    });
  }
  function _setFunctionsFromPubs(data, context) {
    if (!db.functions[context]) {
      db.functions[context] = {};
    }
    const list = [];
    data.forEach(function(fun) {
      list.push(fun.name);
      db.functions[context][fun.name] = {};
      db.functions[context][fun.name][ID_HELP] = fun.description;
      db.functions[context][fun.name][ID_SYNTAX] = fun.syntax && fun.syntax.help;
      db.functions[context][fun.name][ID_ARGUMENTS] = fun.syntax && fun.syntax.arguments;
      db.functions[context][fun.name][ID_SUPPORT_SITE] = fun.supportSiteInformation;
    });
    db.functions[context][ID_KEYWORDS] = list;
  }
  function _loadFunctionsFromPubs(context, cb) {
    const url = getBaseUrl() + "/pubsdata/Functions/en/" + context + ".json";
    ResLoader.get(
      url,
      function(data) {
        if (data && data.length) {
          _setFunctionsFromPubs(data, context);
          if (cb) {
            cb();
          }
        }
      },
      !!cb
    );
  }
  function _FunctionsLoadedFromPubs(context) {
    return db.functions[context];
  }
  function _tryToLoadFunctionsFromPubs(context, userCb, getDataFunc) {
    return _tryToLoad({
      userCb,
      getData: getDataFunc,
      needToLoad: function() {
        return !_FunctionsLoadedFromPubs(context);
      },
      load: function(cb) {
        _loadFunctionsFromPubs(context, cb);
      }
    });
  }
  function _loadProceduresFromPubs(cb) {
    const url = getBaseUrl() + "/pubsdata/procedures.json";
    ResLoader.get(
      url,
      function(data) {
        if (data && data.length) {
          if (db.kwPool["proc"] === void 0) {
            db.kwPool.proc = {};
          }
          data.forEach(function(item) {
            db.kwPool["proc"][item] = {};
          });
          db.kwPool["proc"][ID_KEYWORDS] = data;
          if (cb) {
            cb();
          }
        }
      },
      !!cb
    );
  }
  function _tryToLoadProceduresFromPubs(userCb, getDataFunc) {
    return _tryToLoad({
      userCb,
      getData: getDataFunc,
      needToLoad: function() {
        return !_keywordLoaded("proc");
      },
      load: function(cb) {
        _loadProceduresFromPubs(cb);
      }
    });
  }
  function _setStatementOptionValueHelp(stmtName, optName, valName, help) {
    if (db.stmts[stmtName][optName][valName] === void 0) {
      db.stmts[stmtName][optName][valName] = {};
    }
    db.stmts[stmtName][optName][valName][ID_HELP] = help;
  }
  function _setStatementOptionValues(stmtName, optName, values, tooltips) {
    const list = [];
    _iterateValues(
      values,
      tooltips,
      function(i, name, tooltip) {
        list.push(name);
        if (tooltips) {
          _setStatementOptionValueHelp(
            stmtName,
            optName,
            name.toUpperCase(),
            tooltip
          );
        }
      }
    );
    db.stmts[stmtName][optName][ID_VALS] = list;
  }
  function _setStatementOptionHelp(stmtName, optName, data) {
    db.stmts[stmtName][optName][ID_HELP] = _getHelp(data);
  }
  function _setStatementOptionType(stmtName, optName, data) {
    db.stmts[stmtName][optName][ID_TYPE] = data;
  }
  function _setStatementOptionAlias(stmtName, optName, data) {
    db.stmts[stmtName][optName][ID_ALIAS] = _resolveAlias(optName, data);
  }
  function _setStatementSubOptions(stmtName, optName, data) {
    const list = db.stmts[stmtName][optName][ID_SUB_OPTS] || {};
    _getSubOptKeywords(list, data);
    db.stmts[stmtName][optName][ID_SUB_OPTS] = list;
  }
  function _setStatementOption(stmtName, optName, data) {
    optName = _removeEqu(optName);
    if (db.stmts[stmtName][optName] === void 0) {
      db.stmts[stmtName][optName] = {};
    }
    _setStatementOptionHelp(stmtName, optName, data.Help);
    _setStatementOptionType(stmtName, optName, data.Type);
    _setStatementOptionAlias(stmtName, optName, data.Name);
    if (data.Values) {
      _setStatementOptionValues(stmtName, optName, data.Values, data.ToolTips);
    }
    if (data.SubOptionsKeywords) {
      _setStatementSubOptions(stmtName, optName, data.SubOptionsKeywords);
    }
  }
  function _setStatementOptions(stmtName, keywords) {
    const list = [];
    if (db.stmts[stmtName] === void 0) {
      db.stmts[stmtName] = {};
    }
    _iterateKeywords(keywords, function(i, name, data) {
      list.push(name);
      _setStatementOption(stmtName, name, data);
    });
    db.stmts[stmtName][ID_OPTS] = list;
  }
  function _loadStatementOptions(stmtName, cb) {
    let url = getBaseUrl() + "/data/";
    if (stmtName === "DATA-SET") {
      url += "SASDataSetOptions";
    } else if (stmtName === "DATA-STEP") {
      url += "SASDataStepOptions";
    } else {
      url += "Statements/" + stmtName.toUpperCase();
    }
    url += ".json";
    ResLoader.get(
      url,
      function(data) {
        if (data && data.Keywords) {
          _setStatementOptions(stmtName, data.Keywords.Keyword);
          if (cb) {
            cb();
          }
        }
      },
      !!cb
    );
  }
  function _statementLoaded(stmtName) {
    return db.stmts[stmtName];
  }
  function _tryToLoadStatementOptions(stmtName, userCb, getDataFunc) {
    return _tryToLoad({
      userCb,
      getData: getDataFunc,
      needToLoad: function() {
        return stmtTable[stmtName] && !_statementLoaded(stmtName);
      },
      load: function(cb) {
        _loadStatementOptions(stmtName, cb);
      }
    });
  }
  function _getStatementHelp(context, stmtName, userCb) {
    return _tryToLoadStatementsFromPubs(context, userCb, function() {
      let data = _procStmtObj(context, stmtName);
      if (data) {
        data = {
          key: stmtName,
          data: data[ID_HELP],
          alias: data[ID_ALIAS],
          syntax: data[ID_SYNTAX],
          supportSite: data[ID_SUPPORT_SITE]
        };
      }
      return data;
    });
  }
  function _setStatementsFromPubs(data, context) {
    if (!db.procStmts[context]) {
      db.procStmts[context] = {};
    }
    const list = [];
    data.forEach(function(stmt) {
      const stmtName = stmt.name;
      list.push(stmtName);
      if (db.procStmts[context][stmtName] === void 0) {
        db.procStmts[context][stmtName] = {};
        db.procStmts[context][stmtName][ID_HAS_OPT_DELIMITER] = false;
      }
      db.procStmts[context][stmtName][ID_HELP] = stmt.description;
      db.procStmts[context][stmtName][ID_SYNTAX] = stmt.help;
      db.procStmts[context][stmtName][ID_SUPPORT_SITE] = stmt.supportSiteInformation;
      db.procStmts[context][stmtName][ID_ALIAS] = stmt.aliases;
      const opts = stmt.arguments;
      if (opts && opts.length) {
        _setProcedureStatementOptionsFromPubs(context, stmtName, opts);
      }
      if (stmt.aliases) {
        stmt.aliases.forEach(function(alias) {
          list.push(alias);
          db.procStmts[context][alias] = JSON.parse(
            JSON.stringify(db.procStmts[context][stmtName])
          );
          db.procStmts[context][alias][ID_ALIAS] = _resolveAliasFromPubs(
            alias,
            stmt
          ).aliases;
        });
      }
    });
    db.procStmts[context][ID_STMTS] = list;
  }
  function _loadStatementsFromPubs(context, cb) {
    const url = getBaseUrl() + "/pubsdata/Statements/en/" + context + ".json";
    ResLoader.get(
      url,
      function(data) {
        if (data && data.length) {
          _setStatementsFromPubs(data, context);
          if (cb) {
            cb();
          }
        }
      },
      !!cb
    );
  }
  function _StatementsLoadedFromPubs(context) {
    return db.procStmts[context];
  }
  function _tryToLoadStatementsFromPubs(context, userCb, getDataFunc) {
    return _tryToLoad({
      userCb,
      getData: getDataFunc,
      needToLoad: function() {
        return !_StatementsLoadedFromPubs(context);
      },
      load: function(cb) {
        _loadStatementsFromPubs(context, cb);
      }
    });
  }
  function _setKeywordHelp(type, name, data) {
    db.kwPool[type][name][ID_HELP] = _getHelp(data);
  }
  function _setKeywordAlias(type, name, data) {
    db.kwPool[type][name][ID_ALIAS] = _resolveAlias(name, data);
  }
  function _setKeywordAttr(type, name, data) {
    db.kwPool[type][name][ID_ATTR] = data;
  }
  function _setKeyword(type, name, data) {
    if (db.kwPool[type][name] === void 0) {
      db.kwPool[type][name] = {};
    }
    _setKeywordHelp(type, name, data.Help);
    _setKeywordAlias(type, name, data.Name);
    _setKeywordAttr(type, name, data.Attributes);
  }
  function _setKeywords(type, keywords) {
    const list = [];
    if (db.kwPool[type] === void 0) {
      db.kwPool[type] = {};
    }
    _iterateKeywords(keywords, function(i, name, data) {
      list.push(name);
      _setKeyword(type, _removeEqu(name).toUpperCase(), data);
    });
    db.kwPool[type][ID_KEYWORDS] = list;
  }
  function _loadKeywords(type, cb) {
    const url = _resolveURL(type);
    ResLoader.get(
      url,
      function(data) {
        if (data && data.Keywords) {
          _setKeywords(type, data.Keywords.Keyword);
          if (cb) {
            cb();
          }
        }
      },
      !!cb
    );
  }
  function _keywordLoaded(type) {
    return db.kwPool[type];
  }
  function _tryToLoadKeywords(type, userCb, getDataFunc) {
    return _tryToLoad({
      userCb,
      getData: getDataFunc,
      needToLoad: function() {
        return !_keywordLoaded(type);
      },
      load: function(cb) {
        _loadKeywords(type, cb);
      }
    });
  }
  function _getKeywords(type, userCb) {
    return _tryToLoadKeywords(type, userCb, function() {
      let data = _keywordObj(type);
      if (data) {
        data = data[ID_KEYWORDS];
      }
      return data;
    });
  }
  function _getKeywordHelp(name, type, userCb) {
    return _tryToLoadKeywords(type, userCb, function() {
      let data = _keywordObj(type, _removeEqu(name).toUpperCase());
      if (data) {
        data = { key: name, data: data[ID_HELP], alias: data[ID_ALIAS] };
      }
      return data;
    });
  }
  function _loadProcedureFromPubs(procName, cb) {
    const url = getBaseUrl() + "/pubsdata/Procedures/en/" + procName + ".json";
    ResLoader.get(
      url,
      function(data) {
        if (data && data.statements) {
          _setProcedureFromPubs(
            procName,
            data.statements,
            data.supportSiteInformation
          );
          if (data.interactive) {
            _setKeywordAttr("proc", data.name, "InteractivePROC");
          }
          if (cb) {
            cb();
          }
        }
      },
      !!cb
    );
  }
  function _loadProcedure(procName, cb) {
    if (procTable[procName]) {
      const url = getBaseUrl() + "/data/Procedures/" + procName + ".json";
      return ResLoader.get(
        url,
        function(data) {
          if (data && data.Procedure) {
            _setProcedure(procName, data.Procedure);
            if (cb) {
              cb();
            }
          }
        },
        !!cb
      );
    }
    return _loadProcedureFromPubs(procName, cb);
  }
  function _procedureLoaded(procName) {
    return db.procStmts[procName];
  }
  function _tryToLoadProcedure(procName, userCb, getDataFunc) {
    return _tryToLoad({
      userCb,
      getData: getDataFunc,
      needToLoad: function() {
        const procs = _tryToLoadProceduresFromPubs(null, function() {
          return _keywordObj("proc");
        });
        return procs && (procs[procName] || procTable[procName]) && !_procedureLoaded(procName);
      },
      load: function(cb) {
        _loadProcedure(procName, cb);
      }
    });
  }
  function _setProcedureFromPubs(procName, data, supportSite) {
    if (db.procOpts[procName] === void 0) {
      db.procOpts[procName] = {};
    }
    if (db.procStmts[procName] === void 0) {
      db.procStmts[procName] = {};
    }
    if (data[0]) {
      if (supportSite) {
        db.procOpts[procName][ID_SUPPORT_SITE] = {
          ...supportSite,
          supportSiteTargetFile: data[0].supportSiteTargetFile
        };
      }
      _setProcedureHelpFromPubs(procName, data[0]);
      const opts = data[0].arguments;
      if (opts && opts.length) {
        _setProcedureOptionsFromPubs(procName, opts);
      }
    }
    data.splice(0, 1);
    if (data.length) {
      _setProcedureStatementsFromPubs(procName, data);
    }
  }
  function _setProcedure(procName, data) {
    if (db.procOpts[procName] === void 0) {
      db.procOpts[procName] = {};
    }
    if (db.procStmts[procName] === void 0) {
      db.procStmts[procName] = {};
    }
    _setProcedureHelp(procName, data.ProcedureHelp);
    if (data.ProcedureOptions) {
      let opts = data.ProcedureOptions;
      if (!(opts instanceof Array)) {
        opts = [opts];
      }
      opts.forEach(function(item) {
        _setProcedureOptions(procName, item.ProcedureOption);
      });
    }
    if (data.ProcedureStatements) {
      let stmts = data.ProcedureStatements;
      if (!(stmts instanceof Array)) {
        stmts = [stmts];
      }
      stmts.forEach(function(item) {
        if (item) {
          _setProcedureStatements(procName, item.ProcedureStatement);
        }
      });
    }
  }
  function _setProcedureHelpFromPubs(procName, data) {
    db.procOpts[procName][ID_HELP] = data.description;
    db.procOpts[procName][ID_SYNTAX] = data.help;
  }
  function _setProcedureHelp(procName, data) {
    db.procOpts[procName][ID_HELP] = _getHelp(data);
  }
  function _setProcedureOptionHelpFromPubs(procName, optName, data) {
    db.procOpts[procName][optName][ID_HELP] = data.description;
    db.procOpts[procName][optName][ID_SYNTAX] = data.help;
    db.procOpts[procName][optName][ID_SUPPORT_SITE] = data.supportSiteTargetFragment;
  }
  function _setProcedureOptionHelp(procName, optName, data) {
    db.procOpts[procName][optName][ID_HELP] = _getHelp(data);
  }
  function _setProcedureOptionType(procName, optName, data) {
    db.procOpts[procName][optName][ID_TYPE] = data;
  }
  function _setProcedureOptionAliasFromPubs(procName, optName, data) {
    db.procOpts[procName][optName][ID_ALIAS] = data;
  }
  function _setProcedureOptionAlias(procName, optName, data) {
    db.procOpts[procName][optName][ID_ALIAS] = _resolveAlias(optName, data);
  }
  function _setProcedureOptionSubOptKeywordsFromPubs(procName, optName, data) {
    const list = db.procOpts[procName][optName][ID_SUB_OPTS] || {};
    if (!list[ID_KEYWORDS]) {
      list[ID_KEYWORDS] = [];
    }
    data.forEach(function(arg) {
      if (arg.placeholder) {
        return;
      }
      const name = arg.name;
      const key = _removeEqu(name);
      list[ID_KEYWORDS].push(name);
      list[key] = true;
      if (db.procOpts[procName][optName][key] === void 0) {
        db.procOpts[procName][optName][key] = {};
      }
      if (arg.description) {
        db.procOpts[procName][optName][key][ID_HELP] = arg.description;
      }
      if (arg.help) {
        db.procOpts[procName][optName][key][ID_SYNTAX] = arg.help;
      }
      if (arg.aliases) {
        db.procOpts[procName][optName][key][ID_ALIAS] = arg.aliases;
      }
    });
    db.procOpts[procName][optName][ID_SUB_OPTS] = list;
  }
  function _setProcedureOptionSubOptKeywords(procName, optName, data) {
    const list = db.procOpts[procName][optName][ID_SUB_OPTS] || {};
    _getSubOptKeywords(list, data);
    db.procOpts[procName][optName][ID_SUB_OPTS] = list;
  }
  function _setProcedureOptionValueHelp(procName, optName, valName, data) {
    db.procOpts[procName][optName][valName][ID_HELP] = data;
  }
  function _setProcedureOptionValueFromPubs(procName, optName, val) {
    const name = val.name.toUpperCase();
    if (db.procOpts[procName][optName][name] === void 0) {
      db.procOpts[procName][optName][name] = {};
    }
    db.procOpts[procName][optName][name][ID_ALIAS] = val.aliases;
    if (val.description) {
      _setProcedureOptionValueHelp(procName, optName, name, val.description);
    }
    if (val.help) {
      db.procOpts[procName][optName][name][ID_SYNTAX] = val.help;
    }
  }
  function _setProcedureOptionValuesFromPubs(procName, optName, values) {
    const list = [];
    values.forEach(function(val) {
      if (val.placeholder || val.type !== "standalone") {
        return;
      }
      const name = val.name;
      list.push(name);
      _setProcedureOptionValueFromPubs(procName, optName, val);
      if (val.aliases && val.aliases.length) {
        val.aliases.forEach(function(alias) {
          list.push(alias);
          _setProcedureOptionValueFromPubs(
            procName,
            optName,
            _resolveAliasFromPubs(alias, val)
          );
        });
      }
    });
    db.procOpts[procName][optName][ID_VALS] = list;
  }
  function _setProcedureOptionValues(procName, optName, values, tooltips) {
    const list = [];
    _iterateValues(
      values,
      tooltips,
      function(i, name, tooltip) {
        list.push(name);
        if (db.procOpts[procName][optName][name] === void 0) {
          db.procOpts[procName][optName][name] = {};
        }
        if (tooltip) {
          _setProcedureOptionValueHelp(procName, optName, name, tooltip);
        }
      }
    );
    db.procOpts[procName][optName][ID_VALS] = list;
  }
  function _setProcedureOptionFromPubs(procName, data) {
    const optName = _removeEqu(data.name).toUpperCase();
    if (db.procOpts[procName][optName] === void 0) {
      db.procOpts[procName][optName] = {};
    }
    _setProcedureOptionHelpFromPubs(procName, optName, data);
    _setProcedureOptionType(procName, optName, data.type);
    _setProcedureOptionAliasFromPubs(procName, optName, data.aliases);
    const args = data.arguments;
    if (args && args.length) {
      _setProcedureOptionValuesFromPubs(procName, optName, args);
      _setProcedureOptionSubOptKeywordsFromPubs(procName, optName, args);
    }
  }
  function _setProcedureOption(procName, optName, data) {
    optName = _removeEqu(optName);
    if (db.procOpts[procName][optName] === void 0) {
      db.procOpts[procName][optName] = {};
    }
    _setProcedureOptionHelp(procName, optName, data.ProcedureOptionHelp);
    _setProcedureOptionType(procName, optName, data.ProcedureOptionType);
    _setProcedureOptionAlias(procName, optName, data.ProcedureOptionName);
    if (data.SubOptionsKeywords) {
      _setProcedureOptionSubOptKeywords(
        procName,
        optName,
        data.SubOptionsKeywords
      );
    }
    if (data.ProcedureOptionValues) {
      _setProcedureOptionValues(
        procName,
        optName,
        data.ProcedureOptionValues,
        data.ProcedureOptionToolTips
      );
    }
  }
  function _setProcedureOptionsFromPubs(procName, data) {
    const keywords = [];
    data.forEach(function(item) {
      if (!item.placeholder) {
        _setProcedureOptionFromPubs(procName, item);
        keywords.push(item.name);
        if (item.aliases && item.aliases.length) {
          item.aliases.forEach(function(alias) {
            _setProcedureOptionFromPubs(
              procName,
              _resolveAliasFromPubs(alias, item)
            );
            keywords.push(alias);
          });
        }
      }
    });
    db.procOpts[procName][ID_OPTS] = keywords;
  }
  function _setProcedureOptions(procName, data) {
    if (data) {
      let keywords = [];
      if (!(data instanceof Array)) {
        data = [data];
      }
      for (let i = 0; i < data.length; i++) {
        if (!data[i]["ProcedureOptionName"]) {
          continue;
        }
        const names = data[i]["ProcedureOptionName"].split("|");
        if (names[names.length - 1] === "") {
          names.pop();
        }
        for (let j2 = 0; j2 < names.length; j2++) {
          _setProcedureOption(procName, names[j2], data[i]);
        }
        keywords = keywords.concat(names);
      }
      db.procOpts[procName][ID_OPTS] = keywords;
    }
  }
  function _setProcedureStatementHelpFromPubs(procName, stmtName, data) {
    db.procStmts[procName][stmtName][ID_HELP] = data.description;
    db.procStmts[procName][stmtName][ID_SYNTAX] = data.help;
    db.procStmts[procName][stmtName][ID_SUPPORT_SITE] = data.supportSiteTargetFile;
  }
  function _setProcedureStatementHelp(procName, stmtName, data) {
    db.procStmts[procName][stmtName][ID_HELP] = _getHelp(data);
  }
  function _setProcedureStatementAliasFromPubs(procName, stmtName, data) {
    db.procStmts[procName][stmtName][ID_ALIAS] = data;
  }
  function _setProcedureStatementAlias(procName, stmtName, data) {
    db.procStmts[procName][stmtName][ID_ALIAS] = _resolveAlias(stmtName, data);
  }
  function _setProcedureStatementOptionFromPubs(procName, stmtName, data) {
    const optName = _cleanName(data.name).toUpperCase();
    if (db.procStmts[procName][stmtName][optName] === void 0) {
      db.procStmts[procName][stmtName][optName] = {};
    }
    _setProcedureStatementOptionHelpFromPubs(procName, stmtName, optName, data);
    _setProcedureStatementOptionType(procName, stmtName, optName, data.type);
    _setProcedureStatementOptionAliasFromPubs(
      procName,
      stmtName,
      optName,
      data.aliases
    );
    const args = data.arguments;
    if (args && args.length) {
      _setProcedureStatementOptionValuesFromPubs(
        procName,
        stmtName,
        optName,
        args
      );
      _setProcedureStatementSubOptKeywordsFromPubs(
        procName,
        stmtName,
        optName,
        args
      );
    }
  }
  function _setProcedureStatementOption(procName, stmtName, optName, data) {
    optName = _cleanName(optName);
    if (db.procStmts[procName][stmtName][optName] === void 0) {
      db.procStmts[procName][stmtName][optName] = {};
    }
    _setProcedureStatementOptionHelp(
      procName,
      stmtName,
      optName,
      data.StatementOptionHelp
    );
    _setProcedureStatementOptionType(
      procName,
      stmtName,
      optName,
      data.StatementOptionType
    );
    _setProcedureStatementOptionAlias(
      procName,
      stmtName,
      optName,
      data.StatementOptionName
    );
    if (data.SubOptionsKeywords) {
      _setProcedureStatementSubOptKeywords(
        procName,
        stmtName,
        optName,
        data.SubOptionsKeywords
      );
    }
    if (data.StatementOptionValues) {
      _setProcedureStatementOptionValues(
        procName,
        stmtName,
        optName,
        data.StatementOptionValues,
        data.StatementOptionToolTips
      );
    }
  }
  function _setProcedureStatementOptionHelpFromPubs(procName, stmtName, optName, data) {
    db.procStmts[procName][stmtName][optName][ID_HELP] = data.description;
    db.procStmts[procName][stmtName][optName][ID_SYNTAX] = data.help;
    db.procStmts[procName][stmtName][optName][ID_SUPPORT_SITE] = data.supportSiteTargetFragment || data.supportSiteInformation;
  }
  function _setProcedureStatementOptionHelp(procName, stmtName, optName, data) {
    db.procStmts[procName][stmtName][optName][ID_HELP] = _getHelp(data);
  }
  function _setProcedureStatementOptionType(procName, stmtName, optName, data) {
    db.procStmts[procName][stmtName][optName][ID_TYPE] = data;
  }
  function _setProcedureStatementOptionAliasFromPubs(procName, stmtName, optName, data) {
    db.procStmts[procName][stmtName][optName][ID_ALIAS] = data;
  }
  function _setProcedureStatementOptionAlias(procName, stmtName, optName, data) {
    db.procStmts[procName][stmtName][optName][ID_ALIAS] = _resolveAlias(
      optName,
      data
    );
  }
  function _setProcedureStatementSubOptKeywordFromPubs(procName, stmtName, optName, subOptName, arg) {
    const key = _removeEqu(subOptName);
    if (db.procStmts[procName][stmtName][optName][key] === void 0) {
      db.procStmts[procName][stmtName][optName][key] = {};
    }
    if (arg.description) {
      db.procStmts[procName][stmtName][optName][key][ID_HELP] = arg.description;
    }
    if (arg.help) {
      db.procStmts[procName][stmtName][optName][key][ID_SYNTAX] = arg.help;
    }
    if (arg.aliases) {
      db.procStmts[procName][stmtName][optName][key][ID_ALIAS] = arg.aliases;
    }
  }
  function _setProcedureStatementSubOptKeywordsFromPubs(procName, stmtName, optName, data) {
    const list = db.procStmts[procName][stmtName][optName][ID_SUB_OPTS] || {};
    if (!list[ID_KEYWORDS]) {
      list[ID_KEYWORDS] = [];
    }
    data.forEach(function(arg) {
      if (arg.placeholder) {
        return;
      }
      const name = arg.name;
      list[ID_KEYWORDS].push(name);
      list[_removeEqu(name)] = true;
      _setProcedureStatementSubOptKeywordFromPubs(
        procName,
        stmtName,
        optName,
        name,
        arg
      );
      if (arg.aliases) {
        arg.aliases.forEach(function(alias) {
          list[ID_KEYWORDS].push(alias);
          list[_removeEqu(alias)] = true;
          _setProcedureStatementSubOptKeywordFromPubs(
            procName,
            stmtName,
            optName,
            alias,
            _resolveAliasFromPubs(alias, arg)
          );
        });
      }
    });
    db.procStmts[procName][stmtName][optName][ID_SUB_OPTS] = list;
  }
  function _setProcedureStatementSubOptKeywords(procName, stmtName, optName, data) {
    const list = db.procStmts[procName][stmtName][optName][ID_SUB_OPTS] || {};
    _getSubOptKeywords(list, data);
    db.procStmts[procName][stmtName][optName][ID_SUB_OPTS] = list;
  }
  function _setProcedureStatementOptionValueHelp(procName, stmtName, optName, valName, data) {
    db.procStmts[procName][stmtName][optName][valName][ID_HELP] = data;
  }
  function _setProcedureStatementOptionValueFromPubs(procName, stmtName, optName, val) {
    const name = val.name.toUpperCase();
    if (db.procStmts[procName][stmtName][optName][name] === void 0) {
      db.procStmts[procName][stmtName][optName][name] = {};
    }
    db.procStmts[procName][stmtName][optName][name][ID_ALIAS] = val.aliases;
    if (val.description) {
      _setProcedureStatementOptionValueHelp(
        procName,
        stmtName,
        optName,
        name,
        val.description
      );
    }
    if (val.help) {
      db.procStmts[procName][stmtName][optName][name][ID_SYNTAX] = val.help;
    }
  }
  function _setProcedureStatementOptionValuesFromPubs(procName, stmtName, optName, values) {
    const list = [];
    values.forEach(function(val) {
      if (val.placeholder || val.type !== "standalone") {
        return;
      }
      const name = val.name;
      list.push(name);
      _setProcedureStatementOptionValueFromPubs(procName, stmtName, optName, val);
      if (val.aliases && val.aliases.length) {
        val.aliases.forEach(function(alias) {
          list.push(alias);
          _setProcedureStatementOptionValueFromPubs(
            procName,
            stmtName,
            optName,
            _resolveAliasFromPubs(alias, val)
          );
        });
      }
    });
    db.procStmts[procName][stmtName][optName][ID_VALS] = list;
  }
  function _setProcedureStatementOptionValues(procName, stmtName, optName, values, tooltips) {
    const list = [];
    _iterateValues(
      values,
      tooltips,
      function(i, name, tooltip) {
        list.push(name);
        if (db.procStmts[procName][stmtName][optName][name] === void 0) {
          db.procStmts[procName][stmtName][optName][name] = {};
        }
        if (tooltips) {
          _setProcedureStatementOptionValueHelp(
            procName,
            stmtName,
            optName,
            name,
            tooltip
          );
        }
      }
    );
    db.procStmts[procName][stmtName][optName][ID_VALS] = list;
  }
  function _setProcedureStatementOptionsFromPubs(procName, stmtName, data) {
    let keywords = [], keywordsReq = [];
    data.forEach(function(item) {
      if (!item.placeholder) {
        _setProcedureStatementOptionFromPubs(procName, stmtName, item);
        if (item.followsDelimiter) {
          keywords.push(item.name);
        } else {
          keywordsReq.push(item.name);
        }
        if (item.aliases && item.aliases.length) {
          item.aliases.forEach(function(alias) {
            _setProcedureStatementOptionFromPubs(
              procName,
              stmtName,
              _resolveAliasFromPubs(alias, item)
            );
            if (item.followsDelimiter) {
              keywords.push(alias);
            } else {
              keywordsReq.push(alias);
            }
          });
        }
      }
    });
    if (keywords.length > 0) {
      db.procStmts[procName][stmtName][ID_HAS_OPT_DELIMITER] = true;
    } else {
      keywords = keywordsReq;
      keywordsReq = [];
    }
    db.procStmts[procName][stmtName][ID_OPTS] = keywords;
    db.procStmts[procName][stmtName][ID_OPTS_REQ] = keywordsReq;
  }
  function _setProcedureStatementOptions(procName, stmtName, data) {
    if (data) {
      let keywords = [];
      if (!(data instanceof Array)) {
        data = [data];
      }
      for (let i = 0; i < data.length; i++) {
        let names = data[i]["StatementOptionName"];
        if (!names) {
          continue;
        }
        names = names.split("|");
        if (names[names.length - 1] === "") {
          names.pop();
        }
        for (let j2 = 0; j2 < names.length; j2++) {
          _setProcedureStatementOption(procName, stmtName, names[j2], data[i]);
        }
        keywords = keywords.concat(names);
      }
      db.procStmts[procName][stmtName][ID_OPTS] = keywords;
    }
  }
  function _setProcedureStatementFromPubs(procName, stmtName, data) {
    if (db.procStmts[procName][stmtName] === void 0) {
      db.procStmts[procName][stmtName] = {};
      db.procStmts[procName][stmtName][ID_HAS_OPT_DELIMITER] = false;
    }
    _setProcedureStatementHelpFromPubs(procName, stmtName, data);
    _setProcedureStatementAliasFromPubs(procName, stmtName, data.aliases);
    const opts = data.arguments;
    if (opts && opts.length) {
      _setProcedureStatementOptionsFromPubs(procName, stmtName, opts);
    }
  }
  function _setProcedureStatement(procName, stmtName, data) {
    if (db.procStmts[procName][stmtName] === void 0) {
      db.procStmts[procName][stmtName] = {};
    }
    _setProcedureStatementHelp(procName, stmtName, data.StatementHelp);
    _setProcedureStatementAlias(procName, stmtName, data.StatementName);
    if (data.StatementOptions) {
      _setProcedureStatementOptions(
        procName,
        stmtName,
        data.StatementOptions.StatementOption
      );
    }
  }
  function _setProcedureStatementsFromPubs(procName, data) {
    const keywords = [];
    data.forEach(function(item) {
      const stmtName = _removeEqu(item.name.toUpperCase());
      _setProcedureStatementFromPubs(procName, stmtName, item);
      if (item.aliases) {
        item.aliases.forEach((alias) => {
          keywords.push(alias);
          db.procStmts[procName][alias] = Object.assign(
            {},
            db.procStmts[procName][stmtName]
          );
          db.procStmts[procName][alias][ID_ALIAS] = _resolveAliasFromPubs(
            alias,
            item
          ).aliases;
        });
      }
      keywords.push(item.name);
    });
    db.procStmts[procName][ID_STMTS] = keywords;
  }
  function _setProcedureStatements(procName, data) {
    if (data) {
      let keywords = [];
      if (!(data instanceof Array)) {
        data = [data];
      }
      for (let i = 0; i < data.length; i++) {
        let names = data[i]["StatementName"];
        if (!names) {
          continue;
        }
        names = names.split("|");
        if (names[names.length - 1] === "") {
          names.pop();
        }
        for (let j2 = 0; j2 < names.length; j2++) {
          _setProcedureStatement(
            procName,
            _removeEqu(names[j2].toUpperCase()),
            data[i]
          );
        }
        keywords = keywords.concat(names);
      }
      db.procStmts[procName][ID_STMTS] = keywords;
    }
  }
  function _loadProcedureImmediately(procName) {
    if (_procOptObj(procName)) {
      return;
    }
    _tryToLoadProcedure(procName, null, function() {
      return _procOptObj(procName);
    });
  }
  function _loadKeywordsImmediately(type) {
    if (_keywordObj(type)) {
      return;
    }
    _tryToLoadKeywords(type, null, function() {
      return _keywordObj(type);
    });
  }
  function _tryToLoadStatementOptionsImmediately(stmtName) {
    if (_stmtObj(stmtName)) {
      return;
    }
    _tryToLoadStatementOptions(stmtName, null, function() {
      return _stmtObj(stmtName);
    });
  }
  var SyntaxDataProvider = class {
    // private functions
    _handleOptionValues(data, cb) {
      if (this.isColorType(data.type)) {
        data.values = this.getSasColors();
        _notify(cb, data);
      } else if (this.isDataSetType(data.type)) {
        this.getLibraryList(cb, data.type);
      } else {
        _notify(cb, data);
      }
      return data;
    }
    /* ************************************************************************
     * PUBLIC INTERFACES
     * ************************************************************************/
    setLibService(fn2) {
      libService = fn2;
    }
    /*
     *  If cb is valid, the call will work in asynchronous mode;
     *  if cb is invalid, the call will work in synchronous mode.
     */
    getProcedures(cb) {
      return _tryToLoadProceduresFromPubs(cb, function() {
        let data = _keywordObj("proc");
        if (data) {
          data = data[ID_KEYWORDS];
        }
        return data;
      });
    }
    getProcedureHelp(procName, cb) {
      procName = procName.toUpperCase();
      return _tryToLoadProcedure(procName, cb, function() {
        let data = _procOptObj(procName);
        if (data) {
          data = {
            data: data[ID_HELP],
            key: procName,
            syntax: data[ID_SYNTAX],
            supportSite: data[ID_SUPPORT_SITE]
          };
        }
        return data;
      });
    }
    getProcedureOptions(procName, cb) {
      procName = procName.toUpperCase();
      return _tryToLoadProcedure(procName, cb, function() {
        let data = _procOptObj(procName);
        if (data) {
          data = data[ID_OPTS];
        }
        return data;
      });
    }
    getProcedureOptionHelp(procName, optName, cb) {
      procName = procName.toUpperCase();
      optName = optName.toUpperCase();
      return _tryToLoadProcedure(procName, cb, function() {
        let data = _procOptObj(procName, _removeEqu(optName));
        if (data) {
          data = {
            data: data[ID_HELP],
            key: optName,
            alias: data[ID_ALIAS],
            syntax: data[ID_SYNTAX],
            supportSite: _procOptSupportSite(procName, optName)
          };
        }
        return data;
      });
    }
    getProcedureOptionType(procName, optName) {
      procName = procName.toUpperCase();
      optName = optName.toUpperCase();
      return _tryToLoadProcedure(procName, null, function() {
        let data = _procOptObj(procName, _removeEqu(optName));
        if (data) {
          data = data[ID_TYPE];
        }
        return data;
      });
    }
    getProcedureOptionValueHelp(procName, optName, valName, cb) {
      return _tryToLoadProcedure(procName, cb, function() {
        procName = procName.toUpperCase();
        optName = optName.toUpperCase();
        valName = valName.toUpperCase();
        let data = _procOptObj(procName, optName, valName);
        if (data) {
          data = {
            key: valName,
            data: data[ID_HELP],
            alias: data[ID_ALIAS],
            syntax: data[ID_SYNTAX],
            supportSite: _procOptSupportSite(procName, optName)
          };
        }
        return data;
      });
    }
    getProcedureOptionValues(procName, optName, cb) {
      let ret = _tryToLoadProcedure(procName, null, () => {
        procName = procName.toUpperCase();
        optName = optName.toUpperCase();
        let data = _procOptObj(procName, optName);
        if (data) {
          const type = this.getProcedureOptionType(procName, optName);
          data = { type, values: data[ID_VALS] };
        }
        return data;
      });
      if (ret) {
        ret = this._handleOptionValues(ret, cb);
      }
      return ret;
    }
    getProcedureSubOptions(procName, optName, cb) {
      return _tryToLoadProcedure(procName, cb, function() {
        procName = procName.toUpperCase();
        optName = optName.toUpperCase();
        let data = _procOptObj(procName, optName, ID_SUB_OPTS);
        data = data ? data[ID_KEYWORDS] : [];
        return data;
      });
    }
    getProcedureSubOptionHelp(procName, optName, subOptName, cb) {
      return _tryToLoadProcedure(procName, cb, function() {
        procName = procName.toUpperCase();
        optName = optName.toUpperCase();
        subOptName = subOptName.toUpperCase();
        let data = _procOptObj(procName, optName, subOptName);
        if (data) {
          data = {
            key: subOptName,
            data: data[ID_HELP],
            alias: data[ID_ALIAS],
            syntax: data[ID_SYNTAX],
            supportSite: _procOptSupportSite(procName, optName)
          };
        }
        return data;
      });
    }
    getProcedureStatements(procName, noGlobal, cb) {
      procName = procName.toUpperCase();
      return _tryToLoadProcedure(procName, cb, () => {
        let data = _procStmtObj(procName);
        if (data) {
          data = data[ID_STMTS];
        }
        if (!data) {
          data = [];
        }
        if (!noGlobal) {
          const gps = this.getGlobalProcedureStatements();
          if (gps) {
            data = data.concat(gps);
            data = _uniq(data);
          }
        }
        return data.length > 0 ? data : null;
      });
    }
    getProcedureStatementHelp(procName, stmtName, cb) {
      procName = procName.toUpperCase();
      stmtName = stmtName.toUpperCase();
      return _tryToLoadProcedure(procName, cb, () => {
        let data = _procStmtObj(procName, stmtName);
        if (data) {
          let supportSite = _procOptObj(procName)[ID_SUPPORT_SITE];
          if (supportSite) {
            supportSite = Object.assign({}, supportSite);
            supportSite.supportSiteTargetFile = data[ID_SUPPORT_SITE];
          }
          data = {
            key: stmtName,
            data: data[ID_HELP],
            alias: data[ID_ALIAS],
            syntax: data[ID_SYNTAX],
            supportSite
          };
        } else {
          data = this.getKeywordHelp(stmtName, null, "gbl-proc-stmt");
          if (data) {
            data.isGlobal = true;
          }
        }
        return data;
      });
    }
    getProcedureStatementOptions(procName, stmtName, cb, req) {
      procName = procName.toUpperCase();
      stmtName = stmtName.toUpperCase();
      return _tryToLoadProcedure(procName, cb, () => {
        let data = _procStmtObj(procName, stmtName);
        if (data) {
          data = req ? data[ID_OPTS_REQ] : data[ID_OPTS];
        } else {
          data = this.getStatementOptions("global", stmtName, void 0, req);
        }
        return data;
      });
    }
    getProcedureStatementOptionHelp(procName, stmtName, optName, cb) {
      procName = procName.toUpperCase();
      stmtName = stmtName.toUpperCase();
      optName = optName.toUpperCase();
      return _tryToLoadProcedure(procName, cb, () => {
        let data = _procStmtObj(procName, stmtName, optName);
        if (data) {
          data = {
            key: optName,
            data: data[ID_HELP],
            alias: data[ID_ALIAS],
            syntax: data[ID_SYNTAX],
            supportSite: _procStmtOptSupportSite(procName, stmtName, optName)
          };
        } else {
          data = this.getStatementOptionHelp("global", stmtName, optName);
        }
        return data;
      });
    }
    getProcedureStatementOptionType(procName, stmtName, optName) {
      procName = procName.toUpperCase();
      stmtName = stmtName.toUpperCase();
      optName = optName.toUpperCase();
      return _tryToLoadProcedure(procName, null, () => {
        let data = _procStmtObj(procName, stmtName, optName);
        if (data) {
          data = data[ID_TYPE];
        } else {
          data = this.getStatementOptionType(stmtName, optName);
        }
        return data;
      });
    }
    getProcedureStatementSubOptions(procName, stmtName, optName, cb) {
      procName = procName.toUpperCase();
      stmtName = stmtName.toUpperCase();
      optName = optName.toUpperCase();
      return _tryToLoadProcedure(procName, cb, () => {
        const stmtOpt = _procStmtObj(procName, stmtName, optName);
        let data;
        if (stmtOpt) {
          data = stmtOpt[ID_SUB_OPTS];
          data = data ? data[ID_KEYWORDS] : [];
        } else {
          data = this.getStatementSubOptions("global", stmtName, optName);
        }
        return data;
      });
    }
    getProcedureStatementSubOptionHelp(procName, stmtName, optName, subOptName, cb) {
      procName = procName.toUpperCase();
      stmtName = stmtName.toUpperCase();
      optName = optName && optName.toUpperCase();
      subOptName = subOptName && subOptName.toUpperCase();
      return _tryToLoadProcedure(procName, cb, () => {
        let data = _procStmtObj(procName, stmtName, optName, subOptName);
        if (data) {
          data = {
            key: subOptName,
            data: data[ID_HELP],
            alias: data[ID_ALIAS],
            syntax: data[ID_SYNTAX],
            supportSite: _procStmtOptSupportSite(procName, stmtName, optName)
          };
        } else {
          data = this.getStatementSubOptionHelp(
            "global",
            stmtName,
            optName,
            subOptName
          );
        }
        return data;
      });
    }
    getProcedureStatementOptionValueHelp(procName, stmtName, optName, valName, cb) {
      procName = procName.toUpperCase();
      stmtName = stmtName.toUpperCase();
      optName = optName && optName.toUpperCase();
      return _tryToLoadProcedure(procName, cb, () => {
        let data = _procStmtObj(procName, stmtName, optName, valName);
        if (data) {
          data = {
            key: valName,
            data: data[ID_HELP],
            alias: data[ID_ALIAS],
            syntax: data[ID_SYNTAX],
            supportSite: _procStmtOptSupportSite(procName, stmtName, optName)
          };
        } else {
          data = this.getStatementOptionValueHelp(
            "global",
            stmtName,
            optName,
            valName
          );
        }
        return data;
      });
    }
    getProcedureStatementOptionValues(procName, stmtName, optName, cb) {
      if (!optName) {
        cb(void 0);
        return null;
      }
      stmtName = stmtName.toUpperCase();
      procName = procName.toUpperCase();
      optName = optName.toUpperCase();
      let ret = _tryToLoadProcedure(procName, null, () => {
        let data = _procStmtObj(procName, stmtName, optName);
        if (data) {
          const type = this.getProcedureStatementOptionType(
            procName,
            stmtName,
            optName
          );
          data = { type, values: data[ID_VALS] };
        } else {
          data = this.getStatementOptionValues("global", stmtName, optName);
        }
        return data;
      });
      if (ret) {
        ret = this._handleOptionValues(ret, cb);
      } else {
        _notify(cb, ret);
      }
      return ret;
    }
    addUserDefinedAbbr(abbr) {
    }
    getUserDefinedAbbr() {
    }
    getFilenameOrLibnameOptions() {
    }
    // access Statements/*.xml, mainly global statements or global procedure statements
    getStatementOptions(context, stmtName, cb, req) {
      stmtName = stmtName.toUpperCase();
      return _tryToLoadStatementsFromPubs(context, cb, function() {
        let data = _procStmtObj(context, stmtName);
        if (data) {
          data = req ? data[ID_OPTS_REQ] : data[ID_OPTS];
        }
        return data;
      });
    }
    // access Statements/*.xml, mainly global statements or global procedure statements
    getStatementOptionHelp(context, stmtName, optName, cb) {
      return _tryToLoadStatementsFromPubs(context, cb, function() {
        stmtName = stmtName.toUpperCase();
        optName = optName && optName.toUpperCase();
        let data = _procStmtObj(context, stmtName, optName);
        if (data) {
          data = {
            key: optName,
            data: data[ID_HELP],
            alias: data[ID_ALIAS],
            syntax: data[ID_SYNTAX],
            supportSite: _stmtOptSupportSite(context, stmtName, optName)
          };
        }
        return data;
      });
    }
    getStatementOptionValueHelp(context, stmtName, optName, valName, cb) {
      return _tryToLoadStatementsFromPubs(context, cb, function() {
        stmtName = stmtName.toUpperCase();
        optName = optName && optName.toUpperCase();
        valName = valName && valName.toUpperCase();
        let data = _procStmtObj(context, stmtName, optName, valName);
        if (data) {
          data = {
            key: valName,
            data: data[ID_HELP],
            alias: data[ID_ALIAS],
            syntax: data[ID_SYNTAX],
            supportSite: _stmtOptSupportSite(context, stmtName, optName)
          };
        }
        return data;
      });
    }
    // old data is still used by some places
    _getStatementOptionValueHelp(stmtName, optName, valName, cb) {
      return _tryToLoadStatementOptions(stmtName, cb, function() {
        stmtName = stmtName.toUpperCase();
        optName = optName && optName.toUpperCase();
        valName = valName.toUpperCase();
        let data = _stmtObj(stmtName, optName, valName);
        if (data) {
          data = { key: valName, data: data[ID_HELP] };
        }
        return data;
      });
    }
    getStatementOptionType(stmtName, optName, cb) {
      return _tryToLoadStatementOptions(stmtName, cb, function() {
        stmtName = stmtName.toUpperCase();
        optName = optName.toUpperCase();
        let data = _stmtObj(stmtName, optName);
        if (data) {
          data = data[ID_TYPE];
        }
        return data;
      });
    }
    getStatementOptionValues(context, stmtName, optName, cb) {
      let ret = _tryToLoadStatementsFromPubs(context, null, function() {
        stmtName = stmtName.toUpperCase();
        optName = optName && optName.toUpperCase();
        let data = _procStmtObj(context, stmtName, optName);
        if (data) {
          data = { type: data[ID_TYPE], values: data[ID_VALS] };
        }
        return data;
      });
      if (ret) {
        ret = this._handleOptionValues(ret, cb);
      } else {
        _notify(cb, ret);
      }
      return ret;
    }
    // old data is still used by some places
    _getStatementOptionValues(stmtName, optName, cb) {
      let ret = _tryToLoadStatementOptions(stmtName, null, () => {
        stmtName = stmtName.toUpperCase();
        optName = optName && optName.toUpperCase();
        let data = _stmtObj(stmtName, optName);
        if (data) {
          const type = this.getStatementOptionType(stmtName, optName);
          data = { type, values: data[ID_VALS] };
        }
        return data;
      });
      if (ret) {
        ret = this._handleOptionValues(ret, cb);
      }
      return ret;
    }
    getStatementSubOptions(context, stmtName, optName, cb) {
      return _tryToLoadStatementsFromPubs(context, cb, function() {
        stmtName = stmtName.toUpperCase();
        optName = optName && optName.toUpperCase();
        let data = _procStmtObj(context, stmtName, optName, ID_SUB_OPTS);
        if (data) {
          data = data[ID_KEYWORDS];
        } else {
          data = [];
        }
        return data;
      });
    }
    getStatementSubOptionHelp(context, stmtName, optName, subOptName, cb) {
      return _tryToLoadStatementsFromPubs(context, cb, function() {
        stmtName = stmtName.toUpperCase();
        optName = optName && optName.toUpperCase();
        let data = _procStmtObj(context, stmtName, optName, subOptName);
        if (data) {
          data = {
            key: subOptName,
            data: data[ID_HELP],
            alias: data[ID_ALIAS],
            syntax: data[ID_SYNTAX],
            supportSite: _stmtOptSupportSite(context, stmtName, optName)
          };
        }
        return data;
      });
    }
    getDataStepOptions(cb) {
      return _getKeywords("datastep-option", cb);
    }
    getDataStepOptionHelp(optName, cb, type) {
      return _getKeywordHelp(optName, type, cb);
    }
    getDataStepOptionValueHelp(optName, valName, cb) {
      this.getStatementOptionValueHelp("datastep", "DATA", optName, valName, cb);
    }
    getDataStepOptionValues(optName, cb) {
      this.getStatementOptionValues("datastep", "DATA", optName, cb);
    }
    getDataSetOptionValueHelp(optName, valName, cb) {
      this._getStatementOptionValueHelp("DATA-SET", optName, valName, cb);
    }
    getDataSetOptionValues(optName, cb) {
      this._getStatementOptionValues("DATA-SET", optName, cb);
    }
    // get all keyword's help, not only global statement, or global procedure statement
    getKeywordHelp(name, cb, type) {
      if (type === "func") {
        const data2 = _getFunctionHelp(name, "base");
        return _notify(cb, data2);
      }
      if (type === "macro-func") {
        const data2 = _getFunctionHelp(name, "macro");
        return _notify(cb, data2);
      }
      if (type === "gbl-proc-stmt") {
        const data2 = _getStatementHelp("global", name);
        return _notify(cb, data2);
      }
      if (type === "gbl-stmt") {
        let data2 = _getStatementHelp("standalone", name);
        if (!data2) {
          data2 = _getStatementHelp("global", name);
        }
        return _notify(cb, data2);
      }
      if (type === "ds-stmt") {
        const data2 = _getStatementHelp("datastep", name);
        return _notify(cb, data2);
      }
      if (type === "macro-stmt") {
        let data2 = _getStatementHelp("macro", name);
        if (!data2) {
          data2 = _getStatementHelp("global", name);
        }
        return _notify(cb, data2);
      }
      let data = _getKeywordHelp(name, type, null);
      if (!data) {
        if (type === "datastep-option") {
          data = _getKeywordHelp(name, "datastep-option2", null);
        } else if (type === "ds-stmt") {
          data = _getKeywordHelp(name, "gbl-stmt", null);
        } else if (type === "macro-stmt") {
          data = _getKeywordHelp(name, "arm-macro", null);
        }
      }
      return _notify(cb, data);
    }
    // the name parameter can be the name of call routines or functions
    getContextPrompt(name, cb) {
    }
    getSasColors(cb) {
      return _tryToLoadColors(cb);
    }
    //ODS tagsets
    getODSTagsets(cb) {
      return _getKeywords(
        /*'ODSTagsets'*/
        "ods-tagsets",
        cb
      );
    }
    //Style
    getStyleAttributes(cb) {
      return _getKeywords(
        /*'styleAttributes'*/
        "style-att",
        cb
      );
    }
    getStyleElements(cb) {
      return _getKeywords(
        /*'styleElements'*/
        "style-ele",
        cb
      );
    }
    getStyleLocations(cb) {
      return _getKeywords(
        /*'styleLocations'*/
        "style-loc",
        cb
      );
    }
    // macro
    getARMMacros(cb) {
      return _getKeywords(
        /*'ARMMacros'*/
        "arm-macro",
        cb
      );
    }
    getAutocallMacros(cb) {
      return _getKeywords(
        /*'autocallMacros'*/
        "autocall-macro",
        cb
      );
    }
    getAutoVariables(cb) {
      return _getKeywords(
        /*'autoVariables'*/
        "auto-var",
        cb
      );
    }
    getMacroDefinitionOptions(cb) {
      return _getKeywords("macro-def-opt", cb);
    }
    getGlobalStatements(cb) {
      const globalProcStatements = this.getGlobalProcedureStatements();
      return _tryToLoadStatementsFromPubs("standalone", cb, function() {
        const data = _procStmtObj("standalone");
        return data[ID_STMTS].concat(globalProcStatements);
      });
    }
    getGlobalProcedureStatements(cb) {
      return _tryToLoadStatementsFromPubs("global", cb, function() {
        const data = _procStmtObj("global");
        return data[ID_STMTS];
      });
    }
    getMacroStatements(cb) {
      return _tryToLoadStatementsFromPubs("macro", cb, function() {
        const data = _procStmtObj("macro");
        return data[ID_STMTS];
      });
    }
    getFunctions(cb) {
      return _tryToLoadFunctionsFromPubs("base", cb, function() {
        const data = db.functions["base"][ID_KEYWORDS];
        return data;
      });
    }
    getCallRoutines(cb) {
      return _getKeywords(
        /*'callRoutines'*/
        "call-routines",
        cb
      );
    }
    getMacroFunctions(cb) {
      return _tryToLoadFunctionsFromPubs("macro", cb, function() {
        const data = db.functions["macro"][ID_KEYWORDS];
        return data;
      });
    }
    getHashPackageMethods(cb) {
      return _getKeywords(
        /*'hashPackageMethods'*/
        "hash-pack-method",
        cb
      );
    }
    getFormats(cb) {
      return _getKeywords("formats", cb);
    }
    getInformats(cb) {
      return _getKeywords("informats", cb);
    }
    getStatisticsKeywords(cb) {
      return _getKeywords(
        /*'statisticsKeywords'*/
        "stat-kw",
        cb
      );
    }
    getDSStatements(cb) {
      const globalProcStatements = this.getGlobalProcedureStatements();
      return _tryToLoadStatementsFromPubs("datastep", cb, function() {
        const data = _procStmtObj("datastep");
        return data[ID_STMTS].concat(globalProcStatements);
      });
    }
    getDSOptions(cb) {
      return _getKeywords(
        /*'datasetOptions'*/
        "ds-option",
        cb
      );
    }
    getDSOptionHelp(optName, cb) {
      return _getKeywordHelp(optName, "ds-option", cb);
    }
    getDS2Keywords() {
    }
    getDS2Functions() {
    }
    getLibraryList(cb, type) {
      if (typeof libService === "function") {
        libService(null, function(data) {
          _notify(cb, { values: data, type });
        });
      } else {
        _notify(cb, { values: [], type });
      }
    }
    getDataSetNames(libId, cb) {
      if (libId && typeof libService === "function") {
        libService(libId, function(data) {
          if (data && data.length !== 0) {
            _notify(cb, data);
            return;
          }
          _notify(cb, null);
        });
      } else {
        _notify(cb, null);
      }
    }
    getDocumentVariables() {
    }
    getMacroDefinitions() {
    }
    getMacroVariables() {
    }
    hasOptionDelimiter(procName, stmtName) {
      let obj, ret = false;
      const help = this.getProcedureStatementHelp(procName, stmtName);
      if (help) {
        if (help.isGlobal) {
          obj = _procStmtObj("global", stmtName);
        } else {
          obj = _procStmtObj(procName, stmtName);
        }
        if (obj[ID_HAS_OPT_DELIMITER] === void 0) {
          obj[ID_HAS_OPT_DELIMITER] = /Syntax:(.|\n)*\/(.|\n)*;/i.test(
            help.data
          );
        }
        ret = obj[ID_HAS_OPT_DELIMITER];
      }
      return ret;
    }
    isProcedureOptionKeyword(procName, optName, valName) {
      _loadProcedureImmediately(procName);
      return !!_procOptObj(procName, optName, valName);
    }
    isProcedureSubOptKeyword(procName, optName, subOptName) {
      _loadProcedureImmediately(procName);
      return !!_procOptObj(procName, optName, ID_SUB_OPTS, subOptName);
    }
    isProcedureStatementKeyword(procName, stmtName, optName, valName) {
      _loadProcedureImmediately(procName);
      let ret = _procStmtObj(procName, stmtName, optName, valName);
      if (stmtName && !ret) {
        ret = this.isStatementKeyword("global", stmtName, optName, valName);
        if (!ret && (procName === "" || procName === "DATA")) {
          const type = procName === "DATA" ? "datastep" : "standalone";
          ret = this.isStatementKeyword(type, stmtName, optName, valName);
        }
      }
      return !!ret;
    }
    isProcedureStatementSubOptKeyword(procName, stmtName, optName, subOptName) {
      _loadProcedureImmediately(procName);
      return !!_procStmtObj(procName, stmtName, optName, ID_SUB_OPTS, subOptName) || !!_stmtObj(stmtName, optName, ID_SUB_OPTS, subOptName);
    }
    isStatementKeyword(context, stmtName, optName, valName) {
      return !!_tryToLoadStatementsFromPubs(context, null, function() {
        return !!_procStmtObj(context, stmtName, optName, valName);
      });
    }
    _isStatementKeyword(stmtName, optName, valName) {
      _tryToLoadStatementOptionsImmediately(stmtName);
      let ret = !!_stmtObj(stmtName, optName, valName);
      if (!ret && !optName) {
        const type = "gbl-stmt";
        _loadKeywordsImmediately(type);
        ret = !!_keywordObj(type, stmtName);
      }
      return ret;
    }
    isStatementSubOptKeyword(stmtName, optName, subOptName) {
      _tryToLoadStatementOptionsImmediately(stmtName);
      return !!_stmtObj(stmtName, optName, ID_SUB_OPTS, subOptName);
    }
    isDatasetKeyword(name) {
      const type = "ds-option";
      _loadKeywordsImmediately(type);
      return !!_keywordObj(type, name);
    }
    isSasFunction(name) {
      return _tryToLoadFunctionsFromPubs("base", null, function() {
        return db.functions["base"][ID_KEYWORDS].indexOf(name) !== -1;
      });
    }
    isDataSetType(type) {
      return /\bDV\b/.test(type) || type.toLowerCase() === "dataset";
    }
    isColorType(type) {
      return /\bC\b/.test(type) || type.toLowerCase() === "color";
    }
    isInteractiveProc(name) {
      _tryToLoadProceduresFromPubs(null, function() {
      });
      const data = _keywordObj("proc", name);
      return data && data[ID_ATTR] === "InteractivePROC";
    }
  };
  var macroKwMap = void 0;
  var wordReg = /[^`~!@#%^&*()\-=+[{\]}\\|;:'",.<>/?\s]/;
  var DAYS = {
    JAN: 31,
    FEB: 29,
    MAR: 31,
    APR: 30,
    MAY: 31,
    JUN: 30,
    JUL: 31,
    AUG: 31,
    SEP: 30,
    OCT: 31,
    NOV: 30,
    DEC: 31
  };
  var DATE_DDMMMYY_YYQ_REG = /^\d{2}(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(\d{2}|\d{4})|\d{2}q[1234]\b/i;
  function checkQuote(current, isHead, text) {
    if (current === -1 && isHead) {
      return 0;
    } else if (current === 0 && text !== "(") {
      return -1;
    } else if (current >= 0) {
      if (text === "(") {
        return current + 1;
      } else if (text === ")") {
        if (--current === 0) {
          current = -1;
        }
      }
    }
    return current;
  }
  var _Lexer = class _Lexer2 {
    constructor(model) {
      this.model = model;
      this.start = { line: 0, column: 0 };
      this.curr = { line: 0, column: 0 };
      this.quoting = -1;
      this.bquoting = -1;
      this.ignoreFormat = false;
      this.syntaxDb = new SyntaxDataProvider();
      this.context = {
        embeddedLangState: 0
        /* NONE */
      };
      if (!macroKwMap) {
        const macroStmts = this.syntaxDb.getMacroStatements()?.map((name) => name.slice(1));
        const macroFuncs = this.syntaxDb.getMacroFunctions()?.map((name) => name.slice(1));
        macroKwMap = arrayToMap(macroStmts?.concat(macroFuncs ?? []) ?? []);
      }
    }
    //'**','<>','><','^=','\u00AC=','~=','>=','<=','||','=:','>:','<:',  //len 2
    //'^=:','\u00AC=:','~=:','>=:','<=:'   //len 3
    _readToken() {
      const token = this.getNext_();
      if (!token) {
        this.context.embeddedLangState = 0;
        return void 0;
      }
      if (_Lexer2.isLiteral[token.type]) {
        token.text = this.getText(token);
      } else {
        token.text = this.getWord(token).toUpperCase();
      }
      if (_Lexer2.isComment[token.type] === void 0) {
        this.quoting = checkQuote(
          this.quoting,
          !!_Lexer2.isQuoting[token.text],
          token.text
        );
        this.bquoting = checkQuote(
          this.bquoting,
          !!_Lexer2.isBQuoting[token.text],
          token.text
        );
        if (this.quoting === -1 && this.bquoting === -1) {
          if (!this.ignoreFormat && token.text === "%PUT") {
            this.ignoreFormat = true;
          } else if (this.ignoreFormat && token.text === ";") {
            this.ignoreFormat = false;
          }
        }
      }
      return token;
    }
    getNext() {
      let token;
      SWITCH: switch (this.context.embeddedLangState) {
        case 0: {
          token = this._readToken();
          if (!token) {
            break SWITCH;
          }
          if (this.context.lastNoncommentToken?.type === "text" && this.context.lastNoncommentToken.text === "PROC") {
            if (token.type === "text" && token.text === "PYTHON") {
              this.context.embeddedLangState = 1;
            } else if (token.type === "text" && token.text === "R") {
              this.context.embeddedLangState = 7;
            } else if (token.type === "text" && token.text === "LUA") {
              this.context.embeddedLangState = 4;
            }
          }
          break SWITCH;
        }
        case 1: {
          token = this._readToken();
          if (!token) {
            break SWITCH;
          }
          if (token.type === "text" && ["SUBMIT", "INTERACTIVE", "I"].includes(token.text)) {
            this.context.embeddedLangState = 2;
          }
          break SWITCH;
        }
        case 4: {
          token = this._readToken();
          if (!token) {
            break SWITCH;
          }
          if (token.type === "text" && ["SUBMIT", "INTERACTIVE", "I"].includes(token.text)) {
            this.context.embeddedLangState = 5;
          }
          break SWITCH;
        }
        case 7: {
          token = this._readToken();
          if (!token) {
            break SWITCH;
          }
          if (token.type === "text" && ["SUBMIT", "INTERACTIVE", "I"].includes(token.text)) {
            this.context.embeddedLangState = 8;
          }
          break SWITCH;
        }
        case 2: {
          token = this._readToken();
          if (!token) {
            break SWITCH;
          }
          if (token.type === "sep" && token.text === ";") {
            this.context.embeddedLangState = 3;
          }
          break SWITCH;
        }
        case 3: {
          let multiLineStrState = false;
          for (let line3 = this.curr.line; line3 < this.model.getLineCount(); line3++) {
            const lineContent = this._readEmbeddedCodeLine(this.curr, line3);
            let pos = 0;
            let match;
            do {
              if (match) {
                pos += match.index + match[0].length;
              }
              if (multiLineStrState) {
                match = /'''|"""/.exec(lineContent.substring(pos));
                if (match && match[0] === multiLineStrState) {
                  multiLineStrState = false;
                }
              } else {
                const stringReg = /'''|"""|("[^"]*?("|$))|('[^']*?('|$))/;
                const commentReg = /#.*$/;
                const secReg = /(\b((endsubmit|endinteractive)(\s+|\/\*.*?\*\/)*;|(data|proc|%macro)\b[^'";]*;))/;
                match = new RegExp(
                  `${stringReg.source}|${commentReg.source}|${secReg.source}`,
                  "im"
                ).exec(lineContent.substring(pos));
                if (match) {
                  const matchedText = match[0];
                  if (matchedText === "'''" || matchedText === '"""') {
                    multiLineStrState = matchedText;
                  } else if (matchedText.startsWith("'") || matchedText.startsWith('"') || matchedText.startsWith("#")) {
                  } else {
                    token = this._foundEmbeddedCodeToken(this.curr, {
                      line: line3,
                      column: pos + match.index
                    });
                    break SWITCH;
                  }
                }
              }
            } while (match);
          }
          token = this._foundEmbeddedCodeToken(this.curr);
          break SWITCH;
        }
        case 8: {
          token = this._readToken();
          if (!token) {
            break SWITCH;
          }
          if (token.type === "sep" && token.text === ";") {
            this.context.embeddedLangState = 9;
          }
          break SWITCH;
        }
        case 9: {
          for (let line3 = this.curr.line; line3 < this.model.getLineCount(); line3++) {
            const lineContent = this._readEmbeddedCodeLine(this.curr, line3);
            let pos = 0;
            let match;
            do {
              if (match) {
                pos += match.index + match[0].length;
              }
              const stringReg = /("[^"]*?("|$))|('[^']*?('|$))/;
              const commentReg = /#.*$/;
              const secReg = /(\b((endsubmit|endinteractive)(\s+|\/\*.*?\*\/)*;|(data|proc|%macro)\b[^'";]*;))/;
              match = new RegExp(
                `${stringReg.source}|${commentReg.source}|${secReg.source}`,
                "im"
              ).exec(lineContent.substring(pos));
              if (match) {
                const matchedText = match[0];
                if (!/^('|"|#)/.test(matchedText)) {
                  token = this._foundEmbeddedCodeToken(this.curr, {
                    line: line3,
                    column: pos + match.index
                  });
                  break SWITCH;
                }
              }
            } while (match);
          }
          token = this._foundEmbeddedCodeToken(this.curr);
          break SWITCH;
        }
        case 5: {
          token = this._readToken();
          if (!token) {
            break SWITCH;
          }
          if (token.type === "sep" && token.text === ";") {
            this.context.embeddedLangState = 6;
          }
          break SWITCH;
        }
        case 6: {
          let multiLineStrState = false;
          for (let line3 = this.curr.line; line3 < this.model.getLineCount(); line3++) {
            const lineContent = this._readEmbeddedCodeLine(this.curr, line3);
            let pos = 0;
            let match;
            do {
              if (match) {
                pos += match.index + match[0].length;
              }
              if (multiLineStrState) {
                match = /\]\]|--\]\]|\*\//.exec(lineContent.substring(pos));
                if (match) {
                  if (multiLineStrState === "[[" && match[0] === "]]") {
                    multiLineStrState = false;
                  } else if (multiLineStrState === "--[[" && (match[0] === "--]]" || match[0] === "]]")) {
                    multiLineStrState = false;
                  } else if (multiLineStrState === "/*" && match[0] === "*/") {
                    multiLineStrState = false;
                  }
                }
              } else {
                const stringReg = /("[^"]*("|$))|('[^']*('|$))|\[\[/;
                const commentReg = /--[^[].*$|--\[\[|\/\*/;
                const secReg = /(\b((endsubmit|endinteractive)(\s+|\/\*.*?\*\/)*;|(data|proc|%macro)\b[^'";]*;))/;
                const reg = new RegExp(
                  `${stringReg.source}|${commentReg.source}|${secReg.source}`,
                  "im"
                );
                match = reg.exec(lineContent.substring(pos));
                if (match) {
                  const matchedText = match[0];
                  if (matchedText.startsWith("[[")) {
                    multiLineStrState = "[[";
                  } else if (matchedText.startsWith("--[[")) {
                    multiLineStrState = "--[[";
                  } else if (matchedText.startsWith("/*")) {
                    multiLineStrState = "/*";
                  } else if (matchedText.startsWith("'") || matchedText.startsWith('"') || matchedText.startsWith("--")) {
                  } else {
                    token = this._foundEmbeddedCodeToken(this.curr, {
                      line: line3,
                      column: pos + match.index
                    });
                    break SWITCH;
                  }
                }
              }
            } while (match);
          }
          token = this._foundEmbeddedCodeToken(this.curr);
          break SWITCH;
        }
      }
      if (token) {
        if (_Lexer2.isComment[token.type] === void 0) {
          this.context.lastNoncommentToken = {
            ...token,
            start: { ...token.start },
            end: { ...token.end }
          };
        }
      }
      return token;
    }
    _readEmbeddedCodeLine(startPos, curLine) {
      let lineContent = this.model.getLine(curLine);
      if (curLine === startPos.line) {
        lineContent = " ".repeat(startPos.column) + lineContent.slice(startPos.column);
      }
      return lineContent;
    }
    _foundEmbeddedCodeToken(startPos, endPos) {
      const start = { ...startPos };
      let end;
      if (endPos) {
        end = { ...endPos };
      } else {
        const lastLine = this.model.getLineCount() - 1;
        end = {
          line: lastLine,
          column: this.model.getColumnCount(lastLine)
        };
      }
      const token = {
        type: "embedded-code",
        start,
        end,
        text: this.model.getText({ start, end }).trim()
      };
      this.curr = { ...token.end };
      this.context.embeddedLangState = 0;
      return token;
    }
    /**
     * @returns {object}
     * type: 'sep', 'comment', 'keyword', 'date', 'time', 'dt', 'normaltext',
     *       'numeric', 'string',
     *       'macro-sec', 'macro-keyword', 'macro-text', 'macro-def',
     * start: start position
     * end: end position
     *
     */
    getNext_() {
      let j2 = 0, type, i, text, qm, ch, len;
      const totalLines = this.model.getLineCount();
      while (this.curr.line < totalLines) {
        this.start.line = this.curr.line;
        this.start.column = this.curr.column;
        i = this.curr.column;
        text = this.model.getLine(this.curr.line);
        len = text.length;
        switch (text[i]) {
          case "/":
            i++;
            if (i < len && text[i] === "*") {
              i++;
              for (; ; ) {
                j2 = text.indexOf("*/", i);
                if (j2 >= 0) {
                  this.curr.column = j2 + 2;
                  break;
                }
                this.curr.line++;
                if (this.curr.line >= totalLines) {
                  this.curr.line--;
                  this.curr.column = text.length;
                  break;
                } else {
                  this.curr.column = 0;
                  i = 0;
                  text = this.model.getLine(this.curr.line);
                }
              }
              return {
                type: "comment",
                start: this.start,
                end: this.curr
              };
            } else {
              this.curr.column = i;
              return {
                type: "sep",
                start: this.start,
                end: this.curr
              };
            }
          case "%":
            i++;
            if (i < len && /[A-Za-z_]/.test(text[i])) {
              i++;
              while (i < len && /[\w_]/.test(text[i])) {
                i++;
              }
              this.curr.column = i;
              type = "text";
              if (this.isMacroKeyword(
                text.substr(this.start.column + 1, i - this.start.column - 1)
              )) {
                type = "macro-keyword";
              } else {
                type = "macro-ref";
              }
              return {
                type,
                //SasLexer.TOKEN_TYPES.MKEYWORD,
                start: this.start,
                end: this.curr
              };
            } else if (i < len && text[i] === "*") {
              for (; ; ) {
                i++;
                if (i >= len) {
                  this.curr.line++;
                  i = 0;
                  if (this.curr.line < totalLines) {
                    text = this.model.getLine(this.curr.line);
                    len = text.length;
                  } else {
                    this.curr.line--;
                    this.curr.column = text.length;
                    break;
                  }
                }
                if (text[i] === ";") {
                  this.curr.column = i + 1;
                  break;
                }
              }
              return {
                type: "macro-comment",
                start: this.start,
                end: this.curr
              };
            } else if (this.quoting > 0 && i < len && (text[i] === "'" || text[i] === '"' || text[i] === "(" || text[i] === ")" || text[i] === "%")) {
              this.curr.column++;
            }
            this.curr.column++;
            return {
              type: "sep",
              start: this.start,
              end: this.curr
            };
          case '"':
          case "'":
            if (this.bquoting > 0) {
              this.curr.column++;
              break;
            }
            qm = text[i];
            type = "string";
            i++;
            while (this.curr.line < totalLines) {
              if (i < len) {
                if (qm === text[i]) {
                  i++;
                  if (this.quoting > 0 && text[i - 2] === "%") {
                  } else if (qm === text[i]) {
                    i++;
                  } else {
                    if (i < len) {
                      switch (text[i]) {
                        case "d":
                        case "D":
                          type = "date";
                          i++;
                          if (i < len && (text[i] === "t" || text[i] === "T")) {
                            type = "dt";
                            i++;
                          }
                          break;
                        case "t":
                        case "T":
                          type = "time";
                          i++;
                          break;
                        case "b":
                        case "B":
                          type = "bitmask";
                          i++;
                          break;
                        //bit mask
                        case "n":
                        case "N":
                          type = "namelit";
                          i++;
                          break;
                        //name literal
                        case "x":
                        case "X":
                          type = "hex";
                          i++;
                          break;
                      }
                    }
                    this.curr.column = i;
                    return {
                      type,
                      start: this.start,
                      end: this.curr
                    };
                  }
                } else {
                  i++;
                }
              } else {
                this.curr.line++;
                if (this.curr.line >= totalLines) {
                  this.curr.line--;
                  this.curr.column = i;
                  return {
                    type,
                    start: this.start,
                    end: this.curr
                  };
                }
                i = 0;
                text = this.model.getLine(this.curr.line);
                len = text.length;
              }
            }
            break;
          case "	":
          /*
          this.curr.column++;
          return {
            type: SasLexer.TOKEN_TYPES.WORD,
            start: this.start,
            end: this.curr
          };*/
          // eslint-disable-next-line no-fallthrough
          case " ":
          //space
          case "\xA0":
            this.curr.column++;
            break;
          case ".":
            this.curr.column = this.readNum(i, 10);
            if (this.curr.column === i) {
              this.curr.column++;
              type = "sep";
            } else {
              type = "numeric";
            }
            return {
              type,
              start: this.start,
              end: this.curr
            };
          //break;
          case "$":
            this.curr.column++;
            type = "sep";
            i++;
            if (i < len) {
              ch = text[i];
              if (/[a-zA-Z_0-9]/.test(ch)) {
                i++;
                while (i < len && /[\w_]/.test(text[i])) {
                  i++;
                }
                if (i < len && text[i] === ".") {
                  this.curr.column = this.readNum(i, 10);
                  if (this.curr.column === i) {
                    this.curr.column++;
                  }
                  type = "format";
                }
              }
            }
            return {
              type,
              start: this.start,
              end: this.curr
            };
          //break;
          case "*":
            if (this.context.lastNoncommentToken !== null && this.getWord(this.context.lastNoncommentToken) !== ";") {
              i++;
              this.curr.column = i;
              return {
                type: "sep",
                start: this.start,
                end: this.curr
              };
            }
            while (
              /*(this.curr.line < totalLines) &&*/
              text[i] !== ";"
            ) {
              i++;
              if (i >= len) {
                this.curr.line++;
                if (this.curr.line >= totalLines) {
                  i--;
                  this.curr.line--;
                  break;
                }
                i = 0;
                text = this.model.getLine(this.curr.line);
                len = text.length;
              }
            }
            this.curr.column = i + 1;
            return {
              type: "comment",
              start: this.start,
              end: this.curr
            };
          //break;
          case "\n":
          case "\r":
          case "\u2028":
          case "\u2029":
          case void 0:
            this.curr.line++;
            this.curr.column = 0;
            i = 0;
            break;
          //return null;
          default: {
            type = "text";
            ch = text[i];
            if (wordReg.test(ch) && !/\d/.test(ch)) {
              i++;
              while (i < len && wordReg.test(text[i])) {
                i++;
              }
              if (this.quoting === -1 && this.bquoting === -1 && !this.ignoreFormat && text[i] === ".") {
                this.curr.column = this.readNum(i, 10);
                if (this.curr.column === i) {
                  this.curr.column++;
                }
                i++;
                if (this.curr.column > i || // has digital after .
                i < len && wordReg.test(text[i]) === false || //format like abc.#
                this.curr.column === i && i === len) {
                  return {
                    type: "format",
                    start: this.start,
                    end: this.curr
                  };
                } else {
                  while (i < len && wordReg.test(text[i])) {
                    i++;
                  }
                }
              }
              this.curr.column = i;
              return {
                type,
                start: this.start,
                end: this.curr
              };
            } else if (ch <= "9" && ch >= "0") {
              i++;
              type = "numeric";
              DATE_DDMMMYY_YYQ_REG.lastIndex = 0;
              text = this.model.getLine(this.curr.line);
              let matched = DATE_DDMMMYY_YYQ_REG.exec(
                text.substring(this.curr.column)
              );
              if (matched) {
                const q2 = matched[0][2];
                if (q2 !== "q" && q2 !== "Q") {
                  const day = parseInt(matched[0].substr(0, 2));
                  if (day < 1 || day > DAYS[matched[1].toUpperCase()]) {
                    matched = null;
                  }
                }
              }
              if (ch === "+" || ch === "-") {
                if (text[i] <= "9" && text[i] >= "0") {
                  i = this.readNum(i);
                } else {
                  this.curr.column = i;
                  return {
                    type: "sep",
                    start: this.start,
                    end: this.curr
                  };
                }
              } else if (matched) {
                i = matched[0].length + this.curr.column;
                type = "date";
              } else {
                i = this.readNum(this.curr.column);
              }
              this.curr.column = i;
              return {
                type,
                start: this.start,
                end: this.curr
              };
            } else {
              if (ch !== ";" || this.quoting < 1 && this.bquoting < 1) {
                type = "sep";
                const matches = _Lexer2.longBiOprs.exec(
                  text.substring(this.curr.column)
                );
                if (matches) {
                  this.curr.column += matches[0].length;
                } else {
                  this.curr.column++;
                }
              } else {
                this.curr.column++;
              }
              return {
                type,
                start: this.start,
                end: this.curr
              };
            }
          }
        }
      }
    }
    end() {
      if (this.curr.line < this.model.getLineCount()) {
        return false;
      }
      return true;
    }
    reset() {
      this.curr.line = 0;
      this.curr.column = 0;
    }
    startFrom(line3, col) {
      this.curr.line = line3;
      this.curr.column = col;
      this.context.lastNoncommentToken = null;
      this.context.embeddedLangState = 0;
      this.quoting = -1;
      this.bquoting = -1;
      this.ignoreFormat = false;
    }
    readNum(col, radix) {
      const text = this.model.getLine(this.curr.line);
      let end = col, reg = /^\b0?[0-9a-fA-F]+[xX]\b|^(?!0\d)\d+(\.\d{1,})(E([-+])?(\d+)?)?|^\d+\.|^(?!0\d)\d+(\.\d{1,})?(E([-+])?(\d+)?)?|^\d+\.?\d*|\.\d+/gi;
      if (radix === 10) {
        reg = /^\d+\.?\d*|^\.\d+/;
      }
      const matched = reg.exec(text.substring(col));
      if (matched) {
        end = matched[0].length + col;
      }
      return end;
    }
    isMacroKeyword(word) {
      return macroKwMap?.[word.toUpperCase()] ? true : false;
    }
    getWord(token) {
      if (token) {
        return this.model.getLine(token.end.line).substr(token.start.column, token.end.column - token.start.column);
      }
      return "";
    }
    getText(token) {
      return this.model.getText(token);
    }
  };
  _Lexer.TOKEN_TYPES = {
    SEP: "sep",
    KEYWORD: "keyword",
    SKEYWORD: "sec-keyword",
    PROCNAME: "proc-name",
    COMMENT: "comment",
    MKEYWORD: "macro-keyword",
    MCOMMENT: "macro-comment",
    MREF: "macro-ref",
    MSKEYWORD: "macro-sec-keyword",
    MKEYWORDPARAM: "macro-keyword-param",
    CARDSDATA: "cards-data",
    STR: "string",
    DATE: "date",
    TIME: "time",
    DT: "dt",
    BM: "bitmask",
    NL: "namelit",
    HEX: "hex",
    NUM: "numeric",
    WORD: "text",
    FORMAT: "format",
    BLANK: "blank"
  };
  _Lexer.notSyntaxToken = arrayToMap([
    "comment",
    "macro-comment",
    "blank"
  ]);
  _Lexer.isComment = arrayToMap(["comment", "macro-comment"]);
  _Lexer.isLiteral = arrayToMap([
    "string",
    "date",
    "time",
    "dt",
    "bitmask",
    "namelit",
    "hex",
    "numeric",
    "cards-data"
  ]);
  _Lexer.isWord = arrayToMap([
    "keyword",
    "sec-keyword",
    "macro-sec-keyword",
    "macro-ref",
    "macro-keyword",
    "text"
  ]);
  _Lexer.isConst = arrayToMap([
    "string",
    "date",
    "time",
    "dt",
    "bitmask",
    "namelit",
    "hex",
    "numeric",
    "format"
  ]);
  _Lexer.isCards = arrayToMap([
    "CARDS",
    "LINES",
    "DATALINES",
    "DATALINES4",
    "CARDS4",
    "LINES4"
  ]);
  _Lexer.isCards4 = arrayToMap(["DATALINES4", "CARDS4", "LINES4"]);
  _Lexer.isParmcards = arrayToMap(["PARMCARDS", "PARMCARDS4"]);
  _Lexer.isParmcards4 = arrayToMap(["PARMCARDS4"]);
  _Lexer.isQuoting = arrayToMap([
    "%STR",
    "%NRSTR",
    "%QUOTE",
    "%NRQUOTE"
  ]);
  _Lexer.isBQuoting = arrayToMap(["%SUPERQ", "%BQUOTE", "%NRBQUOTE"]);
  _Lexer.isBinaryOpr = arrayToMap([
    "**",
    "+",
    "-",
    "*",
    "/",
    //arithmetic operators
    "&",
    "|",
    "!",
    "\xA6",
    "AND",
    "OR",
    //'\u00AC','\u00B0','~','NOT',//boolean operators
    "||",
    //contatenation operators
    "<>",
    "><",
    //min and max operators
    "=",
    "EQ",
    "^=",
    "\xAC=",
    "~=",
    "NE",
    ">",
    "GT",
    "<",
    "LT",
    ">=",
    "GE",
    "<=",
    "LE",
    "=:",
    ">:",
    "<:",
    "^=:",
    "\xAC=:",
    "~=:",
    ">=:",
    "<=:"
    //,//comparison
    //'IN' // disable this for HTMLCOMMONS-3847 (height=0.75in ctext=red)
  ]);
  _Lexer.isUnaryOpr = arrayToMap([
    "\xAC",
    "\xB0",
    "~",
    "NOT",
    "+",
    "-"
  ]);
  _Lexer.longBiOprs = /^(\^=:|\u00AC=:|~=:|>=:|<=:|\*\*|<>|\^=|\u00AC=|~=|>=|<=|\|\||=:|>:|<:)/;
  var Lexer = _Lexer;
  var FoldingBlock = class {
    constructor(...arg) {
      if (arguments.length === 1) {
        this.startLine = arguments[0].startLine;
        this.startCol = arguments[0].startCol;
        this.endLine = arguments[0].endLine;
        this.endCol = arguments[0].endCol;
        this.type = arguments[0].type;
        this.name = arguments[0].name;
        this.endFoldingLine = arguments[0].endFoldingLine;
        this.endFoldingCol = arguments[0].endFoldingCol;
        this.outerBlock = arguments[0].outerBlock;
        this.innerBlocks = [...arguments[0].innerBlocks];
      } else if (arguments.length >= 4) {
        this.startLine = arguments[0];
        this.startCol = arguments[1];
        this.endLine = arguments[2];
        this.endCol = arguments[3];
        this.type = arguments[4];
        this.name = arguments[5] ? arguments[5] : "";
        this.innerBlocks = [];
        this.endFoldingLine = -1;
        this.endFoldingCol = -1;
      } else {
        this.startLine = -1;
        this.startCol = -1;
        this.endLine = -1;
        this.endCol = -1;
        this.type = -1;
        this.name = "";
        this.endFoldingLine = -1;
        this.endFoldingCol = -1;
        this.innerBlocks = [];
      }
    }
  };
  var TknBlock = FoldingBlock;
  var stmtAlias = {
    OPTION: "OPTIONS",
    GOPTION: "GOPTIONS"
  };
  var regComment = /(\/\*[\s\S]*?\*\/)|(^\s*\*[\s\S]*?;)|(;\s*\*[\s\S]*?;)|(%\*[\s\S]*?;)/i;
  var regConst = /('|")([\s\S]*?)(\1)/i;
  var regMacro = /%macro\b(?!.+%mend;)/i;
  var regCardsStart = /(^\s*|;\s*)(data)(;|[\s]+[^;]*;)/i;
  var regCards = /(;[\s]*)(cards|lines|datalines)(;|[\s]+[^;]*;)/i;
  var regCards4 = /(;[\s]*)(cards4|lines4|datalines4)(;|[\s]+[^;]*;)/i;
  var regParmcardsStart = /(^\s*|;\s*)(proc)(\s*\/\*[\s\S]+\*\/\s*|\s+)(explode)(;|[\s]+[^;]*;)/i;
  var regParmcards = /(;[\s]*)(parmcards)(;|[\s]+[^;]*;)/i;
  var regParmcards4 = /(;[\s]*)(parmcards4)(;|[\s]+[^;]*;)/i;
  var regCardsEnd = /([^;]*;)/im;
  var regCards4End = /(\n^;;;;)/im;
  var cards = {
    start: regCardsStart,
    cards: regCards,
    end: regCardsEnd
  };
  var cards4 = {
    start: regCardsStart,
    cards: regCards4,
    end: regCards4End
  };
  var parmcards = {
    start: regParmcardsStart,
    cards: regParmcards,
    end: regCardsEnd
  };
  var parmcards4 = {
    start: regParmcardsStart,
    cards: regParmcards4,
    end: regCards4End
  };
  var _LexerEx = class _LexerEx2 {
    constructor(model) {
      this.model = model;
      this.sections = [];
      this.tailSections = [];
      this.tokens = [];
      this.tknBlks = [];
      this.tailTknBlks = [];
      this.changedLineCount = 0;
      this.changedColCount = 0;
      this.OptionCheckers_ = {
        "proc-def": {
          getOptionType: function(optName) {
            return this.syntaxDb.getProcedureOptionType(this.curr.name, optName);
          },
          checkSubOption: function(optName, subOptName) {
            return this.syntaxDb.isProcedureSubOptKeyword(
              this.curr.name,
              optName,
              subOptName
            );
          },
          checkOption: function(optName) {
            return this.syntaxDb.isProcedureOptionKeyword(this.curr.name, optName);
          }
        },
        "proc-stmt": {
          getOptionType: function(optName) {
            return this.syntaxDb.getProcedureStatementOptionType(
              this.curr.procName,
              this.curr.name,
              optName
            );
          },
          checkSubOption: function(optName, subOptName, pos) {
            return this.handleLongStmtSubOptionName_(
              this.curr.procName,
              this.curr.name,
              optName,
              subOptName,
              pos
            ).isKeyword || this.handleLongStmtOptionName_(
              this.curr.procName,
              this.curr.name,
              subOptName,
              pos
            ).isKeyword || (_LexerEx2.stmtWithDatasetOption_[this.curr.procName + "/" + this.curr.name] ? this.syntaxDb.isDatasetKeyword(subOptName) : false);
          },
          checkOption: function(optName) {
            const obj = this.handleLongStmtOptionName_(
              this.curr.procName,
              this.curr.name,
              optName
            );
            return obj.isKeyword;
          }
        },
        "data-def": {
          getOptionType: function(optName) {
            return "";
          },
          checkSubOption: function(optName, subOptName) {
            return this.syntaxDb.isDatasetKeyword(subOptName);
          },
          checkOption: function(optName) {
            return this.syntaxDb.isProcedureOptionKeyword("DATA", optName);
          }
        },
        "data-stmt": {
          getOptionType: function(optName) {
            return this.syntaxDb.getProcedureStatementOptionType(
              "DATA",
              this.curr.name,
              optName
            );
          },
          checkSubOption: function(optName, subOptName) {
            let isKeyword = this.syntaxDb.isProcedureStatementSubOptKeyword(
              "DATA",
              this.curr.name,
              optName,
              subOptName
            );
            if (!isKeyword) {
              if (_LexerEx2.stmtWithDatasetOption_["DATA/" + this.curr.name]) {
                isKeyword = this.syntaxDb.isDatasetKeyword(subOptName);
              }
            }
            return isKeyword;
          },
          checkOption: function(optName) {
            return this.syntaxDb.isProcedureStatementKeyword(
              "DATA",
              this.curr.name,
              optName
            );
          }
        },
        "macro-def": {
          getOptionType: function(optName) {
            return this.syntaxDb.getProcedureOptionType("MACRO", optName);
          },
          checkSubOption: function(optName, subOptName) {
            return this.syntaxDb.isProcedureSubOptKeyword(
              "MACRO",
              optName,
              subOptName
            );
          },
          checkOption: function(optName) {
            return this.syntaxDb.isProcedureOptionKeyword("MACRO", optName);
          }
        },
        "macro-stmt": {
          getOptionType: function(optName) {
            return this.syntaxDb.getProcedureStatementOptionType(
              "MACRO",
              this.curr.name,
              optName
            );
          },
          checkSubOption: function(optName, subOptName) {
            return this.syntaxDb.isProcedureStatementSubOptKeyword(
              "MACRO",
              this.curr.name,
              optName,
              subOptName
            );
          },
          checkOption: function(optName) {
            return this.syntaxDb.isProcedureStatementKeyword(
              "MACRO",
              this.curr.name,
              optName
            );
          }
        },
        "gbl-stmt": {
          getOptionType: function(optName) {
            return this.syntaxDb.getStatementOptionType(
              this._cleanKeyword(this.curr.name),
              optName
            );
          },
          checkSubOption: function(optName, subOptName) {
            return this.syntaxDb.isStatementSubOptKeyword(
              this._cleanKeyword(this.curr.name),
              optName,
              subOptName
            );
          },
          checkOption: function(optName) {
            const isGlobal = this.syntaxDb.isStatementKeyword(
              "global",
              this._cleanKeyword(this.curr.name),
              optName
            );
            if (!isGlobal) {
              return this.syntaxDb.isStatementKeyword(
                "standalone",
                this._cleanKeyword(this.curr.name),
                optName
              );
            }
            return isGlobal;
          }
        },
        "sg-def": {
          // statgraph
          getOptionType: function(optName) {
            return this.syntaxDb.getProcedureStatementOptionType(
              "TEMPLATE",
              "BEGINGRAPH",
              optName
            );
          },
          checkSubOption: function(optName, subOptName) {
            return this.syntaxDb.isProcedureStatementSubOptKeyword(
              "TEMPLATE",
              "BEGINGRAPH",
              optName,
              subOptName
            );
          },
          checkOption: function(optName) {
            return this.syntaxDb.isProcedureStatementKeyword(
              "TEMPLATE",
              "BEGINGRAPH",
              optName
            );
          }
        },
        "sg-stmt": {
          getOptionType: function(optName) {
            return this.syntaxDb.getProcedureStatementOptionType(
              "STATGRAPH",
              this.curr.name,
              optName
            );
          },
          checkSubOption: function(optName, subOptName) {
            return this.syntaxDb.isProcedureStatementSubOptKeyword(
              "STATGRAPH",
              this.curr.name,
              optName,
              subOptName
            );
          },
          checkOption: function(optName) {
            return this.syntaxDb.isProcedureStatementKeyword(
              "STATGRAPH",
              this.curr.name,
              optName
            );
          }
        },
        "dt-def": {
          // dt = define tagset
          getOptionType: function(optName) {
            return this.syntaxDb.getProcedureStatementOptionType(
              "TEMPLATE",
              "DEFINE TAGSET",
              optName
            );
          },
          checkSubOption: function(optName, subOptName) {
            return this.syntaxDb.isProcedureStatementSubOptKeyword(
              "TEMPLATE",
              this.curr.name,
              optName,
              subOptName
            );
          },
          checkOption: function(optName) {
            return this.syntaxDb.isProcedureStatementKeyword(
              "TEMPLATE",
              "DEFINE TAGSET",
              optName
            );
          }
        },
        "dt-stmt": {
          getOptionType: function(optName) {
            return this.syntaxDb.getProcedureStatementOptionType(
              "DEFINE_TAGSET",
              this.curr.name,
              optName
            );
          },
          checkSubOption: function(optName, subOptName) {
            return this.syntaxDb.isProcedureStatementSubOptKeyword(
              "DEFINE_TAGSET",
              this.curr.name,
              optName,
              subOptName
            );
          },
          checkOption: function(optName) {
            return this.syntaxDb.isProcedureStatementKeyword(
              "DEFINE_TAGSET",
              this.curr.name,
              optName
            );
          }
        },
        "de-def": {
          // de = define event
          getOptionType: function(optName) {
            return this.syntaxDb.getProcedureStatementOptionType(
              "TEMPLATE",
              "DEFINE EVENT",
              optName
            );
          },
          checkSubOption: function(optName, subOptName) {
            return this.syntaxDb.isProcedureStatementSubOptKeyword(
              "TEMPLATE",
              "DEFINE EVENT",
              optName,
              subOptName
            );
          },
          checkOption: function(optName) {
            return this.syntaxDb.isProcedureStatementKeyword(
              "TEMPLATE",
              "DEFINE EVENT",
              optName
            );
          }
        },
        "de-stmt": {
          getOptionType: function(optName) {
            return this.syntaxDb.getProcedureStatementOptionType(
              "DEFINE_EVENT",
              this.curr.name,
              optName
            );
          },
          checkSubOption: function(optName, subOptName) {
            return this.syntaxDb.isProcedureStatementSubOptKeyword(
              "DEFINE_EVENT",
              this.curr.name,
              optName,
              subOptName
            );
          },
          checkOption: function(optName) {
            return this.syntaxDb.isProcedureStatementKeyword(
              "DEFINE_EVENT",
              this.curr.name,
              optName
            );
          }
        }
      };
      this.sectionEndStmts_ = {
        RUN: 1,
        "RUN CANCEL": 1,
        QUIT: 1
      };
      this.specialStmts_ = {
        "DATASETS/IC CREATE": 1,
        "TRANSREG/MODEL": 1
        //HTMLCOMMONS-3829
      };
      this.DS2_ = {
        DS2: 1,
        HPDS2: 1
      };
      this.lexer = new Lexer(model);
      this.expr = new Expression(this);
      this.syntaxDb = new SyntaxDataProvider();
      this.SEC_TYPE = _LexerEx2.SEC_TYPE;
      this.PARSING_STATE = {
        IN_GBL: 0,
        IN_MACRO: 1,
        IN_PROC: 2,
        IN_DATA: 3
      };
      this.isTokenWithScopeMarks = {
        comment: 1,
        "macro-comment": 1,
        string: 1,
        date: 1,
        time: 1,
        dt: 1,
        bitmask: 1,
        namelit: 1,
        hex: 1
      };
      this.CARDS_STATE = {
        IN_NULL: 0,
        IN_CMD: 1,
        IN_DATA: 2,
        IN_DATA_WAITING: 3
      };
      this.cardsState = this.CARDS_STATE.IN_NULL;
      this.startLineForCardsData = 0;
      this.stack = null;
      this.curr = null;
      this.lookAheadTokens = [];
      this.sectionCache = [];
      this.lastToken = null;
      this.sections = [];
      this.currSection = new FoldingBlock();
    }
    // The definition of return value is same to getBlockPos1_
    // FIXID S1178400
    getBlockPos2_(blocks, currentIdx, line3, col) {
      let i = currentIdx, block = blocks[i];
      const pos = { line: line3, column: col };
      if (!block || this._isBetween(pos, this._startPos(block), this._endPos(block), true)) {
        return currentIdx;
      }
      if (this._isBefore(pos, this._startPos(block))) {
        do {
          i--;
          block = blocks[i];
        } while (block && !this._isBetween(pos, this._startPos(block), this._endPos(block), true));
        return block ? i : -1;
      } else {
        do {
          i++;
          block = blocks[i];
        } while (block && !this._isBetween(pos, this._startPos(block), this._endPos(block), true));
        return block ? i : -1;
      }
    }
    _startPos(block) {
      return { line: block.startLine, column: block.startCol };
    }
    _endPos(block) {
      return { line: block.endLine, column: block.endCol };
    }
    _setStart(block, pos) {
      block.startLine = pos.line;
      block.startCol = pos.column;
    }
    _setEnd(block, pos) {
      block.endLine = pos.line;
      block.endCol = pos.column;
    }
    _sectionEndPos(block) {
      return { line: block.endFoldingLine, column: block.endFoldingCol };
    }
    _setSectionEnd(block, pos) {
      block.endFoldingLine = pos.line;
      block.endFoldingCol = pos.column;
    }
    _getNextValidTknBlkIdx(startIndex) {
      let i = startIndex, section;
      const max = this.sections.length - 1;
      while (i <= max) {
        section = this.sections[i];
        if (section && section.specialBlks) {
          return section.specialBlks[0];
        }
        i++;
      }
      return -1;
    }
    _checkCards4(regExp, text) {
      let cards2 = null;
      const start = regExp.start.exec(text);
      if (start) {
        text = text.substring(start.index + start[0].length);
        cards2 = regExp.cards.exec(text);
      }
      return cards2;
    }
    _saveRemoveDataLines(regExp, text) {
      let done;
      function _removeDataLines(text2) {
        let start, cards2, end, len;
        const parts = [];
        done = true;
        for (; ; ) {
          start = regExp.start.exec(text2);
          if (start) {
            len = start.index + start[0].length;
            parts.push(text2.substring(0, len));
            text2 = ";" + text2.substring(len);
            cards2 = regExp.cards.exec(text2);
            if (cards2) {
              parts.push(text2.substring(0, cards2.index + 1));
              text2 = text2.substring(cards2.index + cards2[0].length);
              end = regExp.end.exec(text2);
              if (end) {
                text2 = text2.substring(end.index + end[0].length);
                if (parts.length > 400) {
                  done = false;
                  break;
                }
              } else {
                parts.push(cards2[0]);
                break;
              }
            } else {
              parts.push(text2.substring(1));
              break;
            }
          } else {
            parts.push(text2);
            break;
          }
        }
        return parts.join("");
      }
      do {
        text = _removeDataLines(text);
      } while (!done);
      return text;
    }
    _remove(reg, text, replacement) {
      const parts = [];
      for (; ; ) {
        const matched = reg.exec(text);
        if (matched) {
          parts.push(text.substring(0, matched.index));
          if (replacement) {
            parts.push(replacement);
          }
          text = text.substring(matched.index + matched[0].length);
        } else {
          parts.push(text);
          break;
        }
      }
      return parts.join("");
    }
    _removeComment(text) {
      return this._remove(regComment, text);
    }
    _removeConst(text) {
      return this._remove(regConst, text, "x");
    }
    _isBlank(text) {
      return /^\s*$/.test(text);
    }
    _isTailDestroyed(change, block) {
      const oldRange = change.oldRange;
      if (!this._isBefore(oldRange.end, this._endPos(block)) || block.type !== _LexerEx2.SEC_TYPE.GBL && block.explicitEnd && this._isBefore(block.explicitEndStmt.start, oldRange.end)) {
        return true;
      }
      return false;
    }
    _isCollapsedPartially(block) {
      return block && block.collapsed && block.endLine !== block.endFoldingLine;
    }
    _isBetween(pos, start, end, inclusive) {
      return this._isBefore(start, pos, inclusive) && this._isBefore(pos, end, inclusive);
    }
    _isBefore(pos1, pos2, inclusive) {
      if (pos1.line < pos2.line) {
        return true;
      } else if (pos1.line === pos2.line) {
        if (inclusive) {
          return pos1.column <= pos2.column;
        } else {
          return pos1.column < pos2.column;
        }
      } else {
        return false;
      }
    }
    _getBlkIndex(startSectionIdx, containerName, blocks) {
      let i = startSectionIdx, section = this.sections[i], blockIdxs = null;
      while (section && !section[containerName]) {
        i++;
        section = this.sections[i];
      }
      if (section) {
        blockIdxs = section[containerName];
      }
      return blockIdxs ? blockIdxs[0] : blocks.length;
    }
    _handleSpecialBlocks(change, parseRange, getBlkIndex, blocks) {
      if (this.sections.length <= 0 || parseRange.removedBlocks.count <= 0) {
        return;
      }
      const startIdx = getBlkIndex(parseRange.removedBlocks.start);
      const endIdx = getBlkIndex(parseRange.removedBlocks.end + 1);
      const unchangedBlocks = blocks;
      blocks = unchangedBlocks.splice(0, startIdx);
      if (unchangedBlocks.length > 0 && endIdx > startIdx) {
        unchangedBlocks.splice(0, endIdx - startIdx);
        this._adjustBlocksCoord(unchangedBlocks, change, parseRange);
      }
      return { blocks, unchangedBlocks };
    }
    _getTknBlkIndex(startSectionIdx) {
      return this._getBlkIndex(startSectionIdx, "specialBlks", this.tknBlks);
    }
    _adjustPosCoord(change, pos) {
      if (pos.line === change.oldRange.end.line) {
        let index = -1, col;
        const addedCount = change.text.length, len1 = change.oldRange.start.column, len2 = pos.column - change.oldRange.end.column;
        index = change.text.lastIndexOf("\n");
        if (index >= 0) {
          col = change.text[change.text.length - 1] === "\n" ? len2 : addedCount - index - 1 + len2;
        } else {
          col = len1 + addedCount + len2;
        }
        pos.column = col;
      }
      pos.line += change.newRange.end.line - change.newRange.start.line - change.oldRange.end.line + change.oldRange.start.line;
    }
    _adjustBlocksCoord(blocks, change, parseRange) {
      const len = blocks.length;
      let i, pos;
      this.changedLineCount = change.newRange.end.line - change.newRange.start.line - change.oldRange.end.line + change.oldRange.start.line;
      for (i = 0; i < len; i++) {
        if (blocks[i].startLine > parseRange.endLine && this.changedLineCount === 0) {
          break;
        }
        pos = this._startPos(blocks[i]);
        this._adjustPosCoord(change, pos);
        this._setStart(blocks[i], pos);
        pos = this._endPos(blocks[i]);
        this._adjustPosCoord(change, pos);
        this._setEnd(blocks[i], pos);
        const isSection = arrayToMap([
          _LexerEx2.SEC_TYPE.DATA,
          _LexerEx2.SEC_TYPE.PROC,
          _LexerEx2.SEC_TYPE.MACRO
        ]);
        if (isSection[blocks[i].type]) {
          pos = this._sectionEndPos(blocks[i]);
          this._adjustPosCoord(change, pos);
          this._setSectionEnd(blocks[i], pos);
        }
      }
    }
    _isHeadDestroyed(change, block) {
      const oldRange = change.oldRange, blank = this._isBlank(change.text + change.removedText);
      if (this._isBefore(oldRange.start, this._startPos(block)) && !blank) {
        return true;
      } else if (oldRange.start.line === block.startLine) {
        const offset = oldRange.start.column - block.startCol;
        if (change.text === "=") {
          const text = this.model.getLine(block.startLine).slice(block.startCol, oldRange.start.column);
          return /(PROC|PROCEDURE|DATA)\s*/i.test(this._removeComment(text));
        }
        if (offset === 0 && blank) {
          return false;
        } else if (offset <= block.name.length) {
          return true;
        }
      }
      return false;
    }
    _cleanKeyword(keyword) {
      if (/^(TITLE|FOOTNOTE|AXIS|LEGEND|PATTERN|SYMBOL)\d{0,}$/.test(keyword)) {
        const results = keyword.match(
          /(^(TITLE|FOOTNOTE|AXIS|LEGEND|PATTERN|SYMBOL)|\d{0,}$)/g
        ), nbr = parseInt(results[1], 10);
        let isKeyword = false;
        switch (results[0]) {
          case "TITLE":
          case "FOOTNOTE":
            isKeyword = nbr < 11 && nbr > 0;
            break;
          case "AXIS":
          case "LEGEND":
            isKeyword = nbr < 100 && nbr > 0;
            break;
          case "PATTERN":
          case "SYMBOL":
            isKeyword = nbr < 256 && nbr > 0;
            break;
        }
        if (isKeyword) {
          keyword = results[0];
        }
      } else {
        const alias = stmtAlias[keyword];
        if (alias) {
          keyword = alias;
        }
      }
      return keyword;
    }
    adjustFoldingEnd_(prevBlock, currBlock) {
      if (prevBlock.endLine > prevBlock.startLine && prevBlock.endLine === currBlock.startLine) {
        prevBlock.endFoldingLine = prevBlock.endLine - 1;
        prevBlock.endFoldingCol = this.model.getColumnCount(
          prevBlock.endFoldingLine
        );
      } else {
        prevBlock.endFoldingLine = prevBlock.endLine;
        prevBlock.endFoldingCol = prevBlock.endCol;
      }
    }
    _pushRootBlock(block) {
      const stack = [block];
      while (stack.length > 0) {
        const curBlock = stack.pop();
        for (let i = curBlock.innerBlocks.length - 1; i >= 0; i--) {
          const innerBlock = curBlock.innerBlocks[i];
          stack.push(innerBlock);
        }
      }
      this._adjustBlockTreeFoldingEnd(block);
      if (this.sections.length) {
        this.adjustFoldingEnd_(this.sections[this.sections.length - 1], block);
      }
      this.sections.push(block);
      this.tokens = [];
    }
    _adjustBlockTreeFoldingEnd(rootBlock) {
      for (let i = 1; i < rootBlock.innerBlocks.length; i++) {
        this.adjustFoldingEnd_(
          rootBlock.innerBlocks[i - 1],
          rootBlock.innerBlocks[i]
        );
      }
      for (let i = 0; i < rootBlock.innerBlocks.length; i++) {
        this._adjustBlockTreeFoldingEnd(rootBlock.innerBlocks[i]);
      }
    }
    //TODO: IMPROVE
    _changeCardsDataToken(token) {
      this.tokens.pop();
      this.tokens.push(token);
      return token;
    }
    _clonePos(pos) {
      return { line: pos.line, column: pos.column };
    }
    startFoldingBlock_(type, pos, name) {
      const newBlock = new FoldingBlock();
      newBlock.startLine = pos.line;
      newBlock.startCol = pos.column;
      newBlock.type = type;
      newBlock.name = name;
      newBlock.specialBlks = null;
      if (!this.currSection) {
        this.currSection = newBlock;
      } else {
        this.currSection.innerBlocks.push(newBlock);
        newBlock.outerBlock = this.currSection;
        this.currSection = newBlock;
      }
    }
    endFoldingBlock_(type, pos, explicitEnd, start, name) {
      if (!this.currSection) {
        return;
      }
      if (pos.line >= this.currSection.startLine) {
        this.currSection.endLine = pos.line;
        this.currSection.endCol = pos.column;
        this.trimBlock_(this.currSection);
        this.sectionCache[this.currSection.startLine] = null;
        this.currSection.endFoldingLine = this.currSection.endLine;
        this.currSection.endFoldingCol = this.currSection.endCol;
        if (!this.currSection.outerBlock) {
          this.currSection.explicitEnd = explicitEnd;
          if (explicitEnd) {
            this.currSection.explicitEndStmt = {};
            this.currSection.explicitEndStmt.start = start?.start;
            this.currSection.explicitEndStmt.name = name;
          }
          if (this.currSection.specialBlks) {
            this.currSection.specialBlks = this.currSection.specialBlks;
            this.currSection.specialBlks = null;
          }
          this._pushRootBlock(this.currSection);
        }
      }
      this.currSection = this.currSection.outerBlock;
    }
    hasFoldingBlock_() {
      return !!this.currSection;
    }
    getLastNormalFoldingBlockInLine_(currentIdx, line3, blocks) {
      let i = currentIdx, block = blocks[i], idx = currentIdx;
      while (block && (block.startLine === line3 || block.endLine === line3)) {
        if (block.type !== this.SEC_TYPE.GBL) {
          idx = i;
        } else idx = -1;
        i++;
        block = blocks[i];
      }
      if (idx < 0) {
        i = currentIdx - 1;
        block = blocks[i];
        while (block && (block.startLine === line3 || block.endLine === line3)) {
          if (block.type !== this.SEC_TYPE.GBL) {
            idx = i;
            break;
          } else idx = -1;
          i--;
          block = blocks[i];
        }
      }
      return blocks[idx] ?? null;
    }
    getFoldingBlock_(blocks, line3, col, strict) {
      const idx = this.getBlockPos_(blocks, line3, col);
      let block = blocks[idx];
      let found = false;
      if (strict) {
        found = !!block;
      } else if (block && block.startLine <= line3 && block.endLine >= line3) {
        block = this.getLastNormalFoldingBlockInLine_(idx, line3, blocks);
        found = !!block;
      } else if (col) {
        block = blocks[blocks.length - 1];
        if (block && !this._isBefore({ line: line3, column: col }, this._endPos(block)) && !block.explicitEnd) {
          found = true;
        }
      }
      if (found) {
        if (block.innerBlocks.length > 0) {
          return this.getFoldingBlock_(block.innerBlocks, line3, col, strict) ?? block;
        } else {
          return block;
        }
      } else {
        return null;
      }
    }
    getFoldingBlock(line3, col, strict, ignoreCustomBlock, ignoreGlobalBlock) {
      let block = null;
      if (col === void 0) {
        if (!this.sectionCache[line3]) {
          const section = this.getFoldingBlock_(this.sections, line3);
          if (section && line3 <= section.endFoldingLine) {
            this.sectionCache[line3] = section;
          } else {
            this.sectionCache[line3] = null;
          }
        }
        block = this.sectionCache[line3];
      } else {
        block = this.getFoldingBlock_(this.sections, line3, col, strict);
      }
      while (ignoreCustomBlock && block?.type === this.SEC_TYPE.CUSTOM || ignoreGlobalBlock && block?.type === this.SEC_TYPE.GBL) {
        block = block.outerBlock ?? null;
      }
      return block;
    }
    getBlockPos_(blocks, line3, col) {
      let idx = this.getBlockPos1_(blocks, line3);
      if (col || col === 0) {
        idx = this.getBlockPos2_(blocks, idx, line3, col);
      }
      return idx;
    }
    //SUPPORT CODE FOLDING
    //we define global statments as a kind of block, so the return will always be the first form.
    //
    getBlockPos1_(blocks, line3) {
      const len = blocks.length, flags = {};
      let m = Math.floor(len / 2), l = 0, r = len - 1;
      if (len) {
        for (; ; ) {
          flags[m] = true;
          if (line3 <= blocks[m].endLine) {
            if (line3 >= blocks[m].startLine) {
              return m;
            } else {
              r = m;
              m = Math.floor((l + r) / 2);
            }
          } else {
            l = m;
            m = Math.ceil((l + r) / 2);
          }
          if (flags[m]) {
            if (line3 >= blocks[m].endLine) {
              return m + 1;
            } else {
              return m;
            }
          }
        }
      }
      return 0;
    }
    resetFoldingBlockCache_() {
      this.sections = [];
    }
    tryEndFoldingBlock_(pos, untilType, lastPos) {
      if (!lastPos) {
        lastPos = pos;
      }
      if (this.hasFoldingBlock_()) {
        let secType = this.SEC_TYPE.PROC;
        if (this.curr.state === this.PARSING_STATE.IN_DATA) {
          secType = this.SEC_TYPE.DATA;
        } else if (this.curr.state === this.PARSING_STATE.IN_MACRO) {
          secType = this.SEC_TYPE.MACRO;
        } else if (this.curr.state === this.PARSING_STATE.IN_GBL) {
          secType = this.SEC_TYPE.GBL;
        }
        let stop = false;
        while (this.currSection && !stop) {
          if (untilType && this.currSection.type === untilType) {
            stop = true;
          }
          this.endFoldingBlock_(secType, stop ? lastPos : pos);
        }
      }
    }
    tryStop_(token) {
      let len = this.tailSections.length;
      this.tryToAddTknBlock_(token);
      if (token && len && !this._isBefore(token.start, this._startPos(this.tailSections[0]))) {
        if (this.hasFoldingBlock_()) {
          if (this.currSection?.type === this.SEC_TYPE.MACRO) {
            this.tailSections.splice(0, 1);
            return;
          }
          this.tryEndFoldingBlock_(this.lastToken.end);
        }
        let blkIdx = this.tknBlks.length;
        let sectionIdx = this.sections.length;
        let i, j2 = 0;
        this.tailSections.forEach((section) => {
          if (section.specialBlks) {
            i = 0;
            len = section.specialBlks.length;
            for (; i < len; i++) {
              section.specialBlks[i] = blkIdx;
              if (this.tailTknBlks[j2]) {
                this.tailTknBlks[j2].sectionIdx = sectionIdx;
              }
              j2++;
              blkIdx++;
            }
          }
          sectionIdx++;
        });
        if (this.sections.length && this.tailSections.length) {
          this.adjustFoldingEnd_(
            this.sections[this.sections.length - 1],
            this.tailSections[0]
          );
        }
        this.sections = this.sections.concat(this.tailSections);
        this.tknBlks = this.tknBlks.concat(this.tailTknBlks);
        this.lastToken = null;
        throw {
          changedLineCount: this.changedLineCount,
          changedColCount: this.changedColCount,
          type: "skip-syntax-parsing",
          token
        };
      }
      if (token) this.tokens.push(token);
    }
    printBlocks() {
      for (let i = 0; i < this.sections.length; i++) {
      }
    }
    normalizeStart_(block) {
      if (block.startCol !== 0 && block.startCol === this.model.getColumnCount(block.startLine) && block.startLine + 1 < this.model.getLineCount()) {
        block.startLine++;
        block.startCol = 0;
      }
    }
    normalizeEnd_(block) {
      if (block.endCol <= 0 && block.endLine > 0 && this.model.getColumnCount(block.endCol) > 0) {
        block.endLine--;
        block.endCol = this.model.getColumnCount(block.endLine);
      }
    }
    normalizeBlock_(block) {
      this.normalizeStart_(block);
      this.normalizeEnd_(block);
    }
    trimBlock_(block) {
      const lastToken = this.getLastToken_(block);
      if (lastToken) {
        block.endLine = lastToken.end.line;
        block.endCol = lastToken.end.column;
      }
      this.normalizeBlock_(block);
    }
    getLastToken_(block) {
      let i = this.tokens.length - 1;
      while (this.tokens[i] && (this.tokens[i].start.line > block.endLine || this.tokens[i].start.line === block.endLine && this.tokens[i].start.column >= block.endCol)) {
        i--;
      }
      while (i >= 0 && /^\s*$/g.test(this.lexer.getText(this.tokens[i]))) {
        i--;
      }
      if (i >= 0) {
        return this.tokens[i];
      }
      return null;
    }
    getChange_(blocks, origPos) {
      const idx = this.getBlockPos_(blocks, origPos.line, origPos.column);
      let blockIdx = idx, block = {
        startLine: 0,
        startCol: 0,
        endLine: 0,
        endCol: 0
      };
      if (blocks[idx]) {
        block = blocks[idx];
      } else if (blocks.length > 0 && idx >= blocks.length) {
        blockIdx = blocks.length - 1;
        block = blocks[blockIdx];
        if (block.explicitEnd) {
          block = {
            startLine: block.endLine,
            startCol: block.endCol,
            endLine: this.model.getLineCount() - 1,
            endCol: 0
          };
          block.endCol = this.model.getColumnCount(block.endLine);
          if (this._isBefore(this._endPos(block), this._startPos(block))) {
            block.endLine = block.startLine;
            block.endCol = block.startCol;
          }
          blockIdx++;
        }
      }
      return {
        startLine: block.startLine,
        startCol: block.startCol,
        endLine: block.endLine,
        endCol: block.endCol,
        blockIdx
      };
    }
    _getParseRange(blocks, change) {
      const oldRange = change.oldRange, changeStart = this.getChange_(blocks, oldRange.start), removedBlocks = {};
      let range = changeStart, changeEnd;
      if (oldRange.start.line === oldRange.end.line && oldRange.start.column === oldRange.end.column) {
        changeStart.removedBlocks = {
          start: changeStart.blockIdx,
          end: changeStart.blockIdx
        };
      } else {
        changeEnd = this.getChange_(blocks, oldRange.end);
        if (changeEnd.startLine > changeStart.startLine && changeEnd.endLine < changeStart.endLine) {
          changeStart.removedBlocks = {
            start: changeStart.blockIdx,
            end: changeStart.blockIdx
          };
        } else {
          let startLine, startCol, endLine, endCol;
          if (changeEnd.startLine > changeStart.startLine) {
            startLine = changeStart.startLine;
            startCol = changeStart.startCol;
          } else if (changeStart.startLine === changeEnd.startLine) {
            startLine = changeStart.startLine;
            startCol = changeStart.startCol > changeEnd.startCol ? changeEnd.startCol : changeStart.startCol;
          } else {
            startLine = changeEnd.startLine;
            startCol = changeEnd.startCol;
          }
          if (changeStart.endLine > changeEnd.endLine) {
            endLine = changeStart.endLine;
            endCol = changeStart.endCol;
          } else if (changeStart.endLine === changeEnd.endLine) {
            endLine = changeStart.endLine;
            endCol = changeStart.endCol > changeEnd.endCol ? changeStart.endCol : changeEnd.endCol;
          } else {
            endLine = changeEnd.endLine;
            endCol = changeEnd.endCol;
          }
          removedBlocks.start = changeStart.blockIdx;
          removedBlocks.end = changeEnd.blockIdx;
          range = {
            startLine,
            startCol,
            endLine,
            endCol,
            removedBlocks
          };
        }
      }
      return range;
    }
    //API
    getParseRange(change) {
      return this.getParseRangeBySections_(change);
    }
    getParseRangeBySections_(change) {
      const blocks = this.sections;
      const range = this._getParseRange(blocks, change);
      let currBlock = blocks[range.removedBlocks.start - 1], prevBlock = null;
      if (currBlock) {
        range.startLine = currBlock.endLine;
        range.startCol = currBlock.endCol;
      } else {
        range.startLine = 0;
        range.startCol = 0;
      }
      currBlock = blocks[range.removedBlocks.start];
      if (currBlock) {
        prevBlock = blocks[range.removedBlocks.start - 1];
        if (prevBlock && (this._isHeadDestroyed(change, currBlock) && !prevBlock.explicitEnd || this._isCollapsedPartially(prevBlock))) {
          range.startLine = prevBlock.startLine;
          range.startCol = prevBlock.startCol;
          range.removedBlocks.start--;
        } else if (!this._isBefore(change.oldRange.start, this._endPos(currBlock)) && currBlock.explicitEnd) {
          range.removedBlocks.start++;
          range.startLine = currBlock.endLine;
          range.startCol = currBlock.endCol;
        }
      }
      const sectionToChange = this._checkSpecialChange(change, range);
      if (sectionToChange >= 0) {
        if (sectionToChange === this.sections.length) {
          range.endLine = this.model.getLineCount() - 1;
          range.endCol = this.model.getColumnCount(range.endLine);
          range.removedBlocks.end = blocks.length - 1;
        } else if (sectionToChange > range.removedBlocks.end) {
          range.endLine = this.sections[sectionToChange].endLine;
          range.endCol = this.sections[sectionToChange].endCol;
          range.removedBlocks.end = sectionToChange;
        }
      } else {
        let nextBlockIdx = range.removedBlocks.end, nextBlock = null;
        currBlock = blocks[nextBlockIdx];
        if (currBlock && this._isTailDestroyed(change, currBlock)) {
          do {
            nextBlockIdx++;
            nextBlock = blocks[nextBlockIdx];
          } while (nextBlock && nextBlock.type === this.SEC_TYPE.GBL);
          if (nextBlock) {
            nextBlockIdx--;
            if (nextBlockIdx === range.removedBlocks.end) {
              nextBlockIdx++;
            }
            nextBlock = blocks[nextBlockIdx];
            range.endLine = nextBlock.endLine;
            range.endCol = nextBlock.endCol;
          } else {
            range.endLine = this.model.getLineCount() - 1;
            range.endCol = this.model.getColumnCount(range.endLine);
          }
          range.removedBlocks.end = nextBlockIdx;
        }
      }
      if (range.removedBlocks.end >= blocks.length) {
        range.removedBlocks.end = blocks.length - 1;
      }
      if (range.removedBlocks.start >= 0 && range.removedBlocks.start < blocks.length) {
        range.removedBlocks.count = range.removedBlocks.end - range.removedBlocks.start + 1;
      } else {
        range.removedBlocks.count = 0;
      }
      if (blocks.length > 0 && range.removedBlocks.count > 0) {
        range.removedBlocks.blocks = [];
        for (let i = range.removedBlocks.start; i >= 0 && i <= range.removedBlocks.end; i++) {
          range.removedBlocks.blocks.push(blocks[i]);
        }
      }
      return range;
    }
    trimRange_(range) {
      if (range.endLine > this.model.getLineCount()) {
        range.endLine = this.model.getLineCount() - 1;
        if (range.endLine < 0) {
          range.endCol = 0;
        }
      }
      while (range.endCol <= 0) {
        range.endLine--;
        if (range.endLine < 0) {
          range.endLine = 0;
          range.endCol = 0;
          break;
        } else {
          range.endCol = this.model.getColumnCount(range.endLine);
        }
      }
    }
    start_(change) {
      const parseRange = this.getParseRangeBySections_(change);
      this._handleTokens(change, parseRange);
      this._handleSections(change, parseRange);
      this.stack = [{ parse: this.readProg_, state: this.PARSING_STATE.IN_GBL }];
      this.curr = null;
      this.currSection = void 0;
      this.sectionCache.splice(
        parseRange.startLine,
        this.sectionCache.length - parseRange.startLine
      );
      this.lexer.startFrom(parseRange.startLine, parseRange.startCol);
      return parseRange;
    }
    _handleSections(change, parseRange) {
      this.tailSections = this.sections;
      this.sections = this.tailSections.splice(0, parseRange.removedBlocks.start);
      if (parseRange.removedBlocks !== void 0) {
        this.tailSections.splice(0, parseRange.removedBlocks.count);
      }
      this.changedColCount = 0;
      if (this.tailSections.length) {
        const oldCol = this.tailSections[0].startCol;
        this._adjustBlocksCoord(this.tailSections, change, parseRange);
        this.changedColCount = this.tailSections[0].startCol - oldCol;
      }
    }
    // _handleStmts(
    //   change: any,
    //   parseRange: {
    //     startLine: number;
    //     startCol: number;
    //     endLine: number;
    //     endCol: number;
    //     blockIdx: number;
    //   }
    // ) {
    //   var parseRange = this._getParseRange(stmts, change);
    //   //sas.log.info("changed statement:" + parseRange);
    // }
    _docEndPos() {
      const line3 = this.model.getLineCount() - 1;
      return { line: line3, column: this.model.getColumnCount(line3) };
    }
    _getParseText(change, parseRange) {
      const startSection = this.sections[parseRange.removedBlocks.start], endSection = this.sections[parseRange.removedBlocks.end], tmpBlks = [];
      let start, end, tmpBlk, nextSection;
      if (!startSection) {
        return change.text;
      }
      const prevSection = this.sections[parseRange.removedBlocks.start - 1];
      if (prevSection) {
        start = this._endPos(prevSection);
      } else {
        start = { line: 0, column: 0 };
      }
      if (change.type === "textChanged") {
        nextSection = this.sections[parseRange.removedBlocks.end + 1];
        if (nextSection) {
          tmpBlk = new FoldingBlock(nextSection);
          tmpBlks.push(tmpBlk);
          this._adjustBlocksCoord(tmpBlks, change, parseRange);
          end = this._startPos(tmpBlk);
        } else {
          end = this._docEndPos();
        }
        return this.model.getText({ start, end });
      } else {
        const part1 = this.model.getText({
          start,
          end: change.oldRange.start
        });
        end = endSection ? this._endPos(endSection) : this._docEndPos();
        const part2 = this.model.getText({
          start: change.oldRange.end,
          end
        });
        return part1 + change.text + part2;
      }
    }
    _getNextComment(startIndex) {
      let i = this._getNextValidTknBlkIdx(startIndex);
      while (this.tknBlks[i] && this.tknBlks[i].blockComment !== true) {
        i++;
      }
      return this.tknBlks[i];
    }
    _getNextCards4(startIndex) {
      let i = this._getNextValidTknBlkIdx(startIndex);
      while (this.tknBlks[i] && !Lexer.isCards4[this.tknBlks[i].name] && !Lexer.isParmcards4[this.tknBlks[i].name]) {
        i++;
      }
      return this.tknBlks[i];
    }
    _checkSpecialChange(change, parseRange) {
      const regQuotesStart = /['"]/gim, regBlockCommentStart = /\/\*/gim;
      let text = this._getParseText(change, parseRange), nextBlockComment = null, nextBlockCards4 = null, sectionToChange = -1;
      text = this._removeComment(text);
      text = this._removeConst(text);
      text = this._saveRemoveDataLines(cards, text);
      text = this._saveRemoveDataLines(cards4, text);
      text = this._saveRemoveDataLines(parmcards, text);
      text = this._saveRemoveDataLines(parmcards4, text);
      text = text.replace(/\n/g, " ");
      change = regBlockCommentStart.test(text);
      if (change) {
        nextBlockComment = this._getNextComment(parseRange.removedBlocks.end + 1);
        if (nextBlockComment) {
          text += " /**/";
          sectionToChange = nextBlockComment.sectionIdx;
          text = this._removeComment(text);
          regBlockCommentStart.lastIndex = 0;
          change = regBlockCommentStart.test(text);
        }
        if (change) {
          return this.sections.length;
        }
      }
      change = regQuotesStart.test(text);
      if (change) {
        return this.sections.length;
      }
      change = regMacro.test(text);
      if (change) {
        return this.sections.length;
      }
      if (text.lastIndexOf("*") > 0) {
        sectionToChange = parseRange.removedBlocks.end + 1;
        if (sectionToChange > this.sections.length) {
          return this.sections.length;
        }
      }
      if (sectionToChange > 0) {
        return sectionToChange;
      }
      change = this._checkCards4(cards4, text);
      if (change) {
        if (parseRange.removedBlocks) {
          nextBlockCards4 = this._getNextCards4(parseRange.removedBlocks.end + 1);
          if (nextBlockCards4) {
            text += " \n;;;;\n";
            sectionToChange = nextBlockCards4.sectionIdx;
            text = this._saveRemoveDataLines(cards4, text);
            change = this._checkCards4(cards4, text);
          }
        }
        if (change) {
          return this.sections.length;
        }
      }
      change = this._checkCards4(parmcards4, text);
      if (change) {
        if (parseRange.removedBlocks) {
          nextBlockCards4 = this._getNextCards4(parseRange.removedBlocks.end + 1);
          if (nextBlockCards4) {
            text += " \n;;;;\n";
            sectionToChange = nextBlockCards4.sectionIdx;
            text = this._saveRemoveDataLines(parmcards4, text);
            change = this._checkCards4(parmcards4, text);
          }
        }
        if (change) {
          return this.sections.length;
        }
      }
      if (sectionToChange > 0) {
        return sectionToChange;
      }
      return -1;
    }
    _handleTokens(change, parseRange) {
      const ret = this._handleSpecialBlocks(
        change,
        parseRange,
        this._getTknBlkIndex,
        this.tknBlks
      );
      if (ret) {
        this.tknBlks = ret.blocks;
        this.tailTknBlks = ret.unchangedBlocks;
      }
    }
    //adjustTokenType_(token){//FIX S0891785 : Not all procs color code
    setKeyword_(token, isKeyword) {
      if (token.type === "text") {
        if (isKeyword) {
          token.type = Lexer.TOKEN_TYPES.KEYWORD;
          token.notCheckKeyword = true;
        }
      }
      return token;
    }
    addTknBlock_(block) {
      if (!this.currSection) {
        return;
      }
      if (!this.currSection.specialBlks) {
        this.currSection.specialBlks = [];
      }
      this.currSection.specialBlks.push(this.tknBlks.length);
      this.tknBlks.push(block);
    }
    tryToAddTknBlock_(token) {
      if (token && this.isTokenWithScopeMarks[token.type]) {
        const block = new TknBlock(
          token.start.line,
          token.start.column,
          token.end.line,
          token.end.column,
          token.type,
          this.lexer.getText(token)
        );
        block.sectionIdx = this.sections.length;
        block.blockComment = this.model.getLine(token.start.line)[token.start.column] === "/" ? true : false;
        this.addTknBlock_(block);
      }
    }
    tryToAddCardsBlock_(token) {
      if (token && token.type === Lexer.TOKEN_TYPES.CARDSDATA) {
        const block = new TknBlock(
          token.start.line,
          token.start.column,
          token.end.line,
          token.end.column,
          token.type,
          this.curr.name
        );
        block.sectionIdx = this.sections.length;
        this.addTknBlock_(block);
      }
    }
    /*this.tryToAddStmtBlock_ = function(token) {
            if (!token) {
                if (!isStmtStart) {
                    this.endStmtBlock_();
                }
                return;
            }
            if (isStmtStart) {
                currStmt.startLine = token.start.line;
                currStmt.startCol = token.start.column;
                isStmtStart = false;
            }
            //TODO: Not always do this
            currStmt.endLine = token.end.line;
            currStmt.endCol = token.end.column;
            if (this.isTokenWithScopeMarks[token.type]) {
                if (!currStmt.specialBlks) {
                    currStmt.specialBlks = [];
                }
                currStmt.specialBlks.push(token);
            }
    
            if (token.text ===";") {
                this.endStmtBlock_();
            }
        };
        this.endStmtBlock_ = function() {
            isStmtStart = true;
            stmts.push(new StmtBlock(currStmt));
            currStmt.endLine = -1;
        };*/
    /*
     * public method definitions
     */
    start(change) {
      this.lookAheadTokens = [];
      return this.start_(change);
    }
    end() {
      return this.lexer.end() && this.lookAheadTokens.length === 0;
    }
    reset() {
      this.resetFoldingBlockCache_();
      return this.lexer.reset();
    }
    getNext() {
      this.curr = this.stack[this.stack.length - 1];
      const token = this.curr.parse.apply(this);
      this.curr = this.stack[this.stack.length - 1];
      this.tryToAddCardsBlock_(token);
      if (!token || this.end()) {
        const line3 = this.model.getLineCount() - 1, col = line3 >= 0 ? this.model.getColumnCount(line3) : 0;
        this.tryEndFoldingBlock_({ line: line3, column: col });
      }
      this.lastToken = token;
      return token;
    }
    /*
     * private method definitions
     */
    getNext_() {
      let ret = null;
      if (this.lookAheadTokens.length > 0) {
        ret = this.lookAheadTokens.shift();
      } else {
        const token = this.lexer.getNext();
        ret = token ? {
          type: token.type,
          text: token.text,
          start: Object.assign({}, token.start),
          end: Object.assign({}, token.end)
        } : token;
      }
      this.tryStop_(ret);
      return ret;
    }
    cacheToken_(token) {
      let cache2;
      if (token) {
        cache2 = {
          type: token.type,
          text: token.text,
          start: Object.assign({}, token.start),
          end: Object.assign({}, token.end)
        };
        this.lookAheadTokens.push(cache2);
      }
      return cache2;
    }
    prefetch0_(pos) {
      let next = null;
      if (this.lookAheadTokens.length >= pos) {
        next = this.lookAheadTokens[pos - 1];
      } else {
        const len = pos - this.lookAheadTokens.length;
        for (let i = 0; i < len; i++) {
          next = this.cacheToken_(this.lexer.getNext());
        }
      }
      return next;
    }
    prefetch_(it2) {
      let next = null;
      do {
        next = this.prefetch0_(it2.pos);
        it2.pos++;
      } while (next && Lexer.isComment[next.type]);
      return next;
    }
    isNextTokenColon_() {
      const nextToken = this.prefetch0_(1);
      if (nextToken) {
        if (nextToken.text === ":") {
          return true;
        }
      }
      return false;
    }
    getWord_(token) {
      return this.lexer.getWord(token).toUpperCase();
    }
    isLabel_(token) {
      const next = this.prefetch_({ pos: 1 });
      return (
        /*SasLexer.isWord[token.type] && */
        next && next.text === ":"
      );
    }
    isAssignment_(token) {
      if (token.text === "PROC" || token.text === "PROCEDURE" || token.text === "DATA" || token.text === "RUN" || token.text === "QUIT") {
        const next = this.prefetch_({ pos: 1 });
        return next && next.text === "=";
      }
      return false;
    }
    isCustomBlockStart_(token) {
      if (token && isCustomRegionStartComment(token.text)) {
        return true;
      }
      return false;
    }
    isCustomBlockEnd_(token) {
      if (token && isCustomRegionEndComment(token.text)) {
        return true;
      }
      return false;
    }
    readProg_() {
      let word = "", gbl = true, isLabel, isAssignment;
      const token = this.getNext_();
      if (!token) return null;
      if (Lexer.isWord[token.type]) {
        isLabel = this.isLabel_(token);
        isAssignment = this.isAssignment_(token);
        if (!isLabel && !isAssignment) {
          word = token.text;
          switch (word) {
            case "PROC":
            case "PROCEDURE": {
              this.startFoldingBlock_(this.SEC_TYPE.PROC, token.start, word);
              token.type = Lexer.TOKEN_TYPES.SKEYWORD;
              const procName = this.handleProcName_();
              this.stack.push({
                parse: this.readProc_,
                state: this.PARSING_STATE.IN_PROC,
                name: procName
              });
              this.stack.push({
                parse: this.readProcDef_,
                state: this.PARSING_STATE.IN_PROC,
                name: procName
              });
              gbl = false;
              break;
            }
            case "%MACRO":
              this.startFoldingBlock_(this.SEC_TYPE.MACRO, token.start, word);
              token.type = Lexer.TOKEN_TYPES.MSKEYWORD;
              this.stack.push({
                parse: this.readMacro_,
                state: this.PARSING_STATE.IN_MACRO
              });
              this.stack.push({
                parse: this.readMacroDef_,
                state: this.PARSING_STATE.IN_MACRO
              });
              gbl = false;
              break;
            case "DATA":
              this.startFoldingBlock_(this.SEC_TYPE.DATA, token.start, word);
              token.type = Lexer.TOKEN_TYPES.SKEYWORD;
              this.stack.push({
                parse: this.readData_,
                state: this.PARSING_STATE.IN_DATA
              });
              this.stack.push({
                parse: this.readDataDef_,
                state: this.PARSING_STATE.IN_DATA
              });
              gbl = false;
              break;
          }
        }
      }
      if (gbl) {
        if (Lexer.isComment[token.type]) {
          if (this.isCustomBlockStart_(token)) {
            this.startFoldingBlock_(
              this.SEC_TYPE.CUSTOM,
              token.start,
              token.text
            );
          } else if (this.isCustomBlockEnd_(token)) {
            this.tryEndFoldingBlock_(token.end, this.SEC_TYPE.CUSTOM);
          }
        } else if (!this.hasFoldingBlock_()) {
          this.startFoldingBlock_(this.SEC_TYPE.GBL, token.start, word);
        }
        this.stack.push({
          parse: this.readGbl_,
          state: this.PARSING_STATE.IN_GBL
        });
        if (isLabel) {
          this.stack.push({
            parse: this.readLabel_,
            state: this.PARSING_STATE.IN_GBL
          });
        } else if (token.type === Lexer.TOKEN_TYPES.MREF) {
          this.handleMref_(this.PARSING_STATE.IN_GBL);
        } else if (!Lexer.isComment[token.type] && token.text !== ";") {
          const validName = this._cleanKeyword(word);
          const state = {
            parse: this.readGblStmt_,
            state: this.PARSING_STATE.IN_GBL,
            name: validName
          };
          this.stack.push(state);
          if (!isAssignment && Lexer.isWord[token.type] && !this.tryToHandleSectionEnd_(token)) {
            const obj = this.handleLongStmtName_("", validName);
            state.name = obj.stmtName;
            this.setKeyword_(token, obj.isKeyword);
            state.hasSlashOptionDelimiter = this.syntaxDb.hasOptionDelimiter(
              "",
              obj.stmtName
            );
          }
        }
      }
      return token;
    }
    handleProcName_() {
      const token = this.prefetch_({ pos: 1 });
      let name = "";
      if (token) {
        name = token.text;
        token.type = Lexer.TOKEN_TYPES.PROCNAME;
        token.notCheckKeyword = true;
      }
      return name;
    }
    readProcDef_() {
      return this.handleStatement_(this.OptionCheckers_["proc-def"]);
    }
    readDataDef_() {
      return this.handleStatement_(this.OptionCheckers_["data-def"]);
    }
    readMacroDef_() {
      const token = this.handleStatement_(this.OptionCheckers_["macro-def"]);
      if (token && token.text === "(") {
        this.stack.push({
          parse: this.readMacroParams_,
          state: this.PARSING_STATE.IN_MACRO
        });
      }
      return token;
    }
    // Handler for macro definition parameter lists. Processes tokens inside %macro name(...) until ')'.
    readMacroParams_() {
      const token = this.getNext_();
      if (!token) return token;
      if (token.text === ")") {
        this.stack.pop();
      } else if (Lexer.isWord[token.type]) {
        const next = this.prefetch_({ pos: 1 });
        if (next && next.text === "=") {
          token.type = Lexer.TOKEN_TYPES.MKEYWORDPARAM;
        }
      }
      return token;
    }
    handleODSStmt_(token) {
      let isKeyword = false;
      const currName = token.text, procName = "ODS", stmtName = procName;
      if (this.curr.fullName === void 0) {
        const obj = this.handleLongStmtName_(procName, stmtName + " " + currName);
        if (obj.stmtNameLen === 1 && !obj.isKeyword) {
          this.curr.fullName = stmtName;
          isKeyword = this.syntaxDb._isStatementKeyword(stmtName, currName);
        } else {
          this.curr.fullName = obj.stmtName;
          isKeyword = obj.isKeyword;
        }
      } else {
        if (this.curr.fullName === this.curr.name) {
          isKeyword = this.syntaxDb._isStatementKeyword(stmtName, currName);
        } else {
          isKeyword = this.syntaxDb.isProcedureStatementKeyword(
            procName,
            this.curr.fullName,
            currName
          );
        }
      }
      this.setKeyword_(token, isKeyword);
      return isKeyword;
    }
    handleLongStmtName_(procName, startWord) {
      const name1 = startWord, it2 = { pos: 1 }, next1 = this.prefetch_(it2);
      let isKeyword = false, name2 = null, name3 = null, name4 = null, next2, next3, stmtNameLen = 1, fullStmtName = name1;
      if (next1 && Lexer.isWord[next1.type]) {
        name2 = name1 + " " + next1.text;
        next2 = this.prefetch_(it2);
        if (next2 && Lexer.isWord[next2.type]) {
          name3 = name2 + " " + next2.text;
          next3 = this.prefetch_(it2);
          if (next3 && Lexer.isWord[next3.type]) {
            name4 = name3 + " " + next3.text;
          }
        }
      }
      if (name4) {
        isKeyword = this.syntaxDb.isProcedureStatementKeyword(procName, name4);
        if (isKeyword) {
          stmtNameLen = 4;
          fullStmtName = name4;
          this.setKeyword_(next1, true);
          this.setKeyword_(next2, true);
          this.setKeyword_(next3, true);
        }
      }
      if (!isKeyword && name3) {
        isKeyword = this.syntaxDb.isProcedureStatementKeyword(procName, name3);
        if (isKeyword) {
          stmtNameLen = 3;
          fullStmtName = name3;
          this.setKeyword_(next1, true);
          this.setKeyword_(next2, true);
        }
      }
      if (!isKeyword && name2) {
        isKeyword = this.syntaxDb.isProcedureStatementKeyword(procName, name2);
        if (isKeyword) {
          stmtNameLen = 2;
          fullStmtName = name2;
          this.setKeyword_(next1, true);
        }
      }
      if (!isKeyword) {
        isKeyword = this.syntaxDb.isProcedureStatementKeyword(procName, name1);
      }
      return {
        isKeyword,
        stmtName: fullStmtName,
        stmtNameLen
      };
    }
    handleLongStmtOptionName_(procName, stmtName, startWord, pos) {
      const context = {
        procName,
        stmtName,
        startWord,
        pos,
        checkKeyword: function(context2, name) {
          return this.syntaxDb.isProcedureStatementKeyword(
            context2.procName,
            context2.stmtName,
            name
          );
        }
      };
      return this.handleLongOptionName_(context);
    }
    handleLongStmtSubOptionName_(procName, stmtName, optName, startWord, pos) {
      const context = {
        procName,
        stmtName,
        optName,
        startWord,
        pos,
        checkKeyword: function(context2, name) {
          return this.syntaxDb.isProcedureStatementSubOptKeyword(
            context2.procName,
            context2.stmtName,
            context2.optName,
            name
          );
        }
      };
      return this.handleLongOptionName_(context);
    }
    // The pos is the offest of startWord from the current token in the state machine
    handleLongOptionName_(context) {
      let isKeyword = false, name1 = context.startWord, name2 = null, next, nameLen = 1, fullName = name1, it2 = { pos: 1 };
      if (context.pos) {
        it2.pos = context.pos + 1;
      }
      next = this.prefetch_(it2);
      if (next && Lexer.isWord[next.type]) {
        name2 = name1 + " " + next.text;
      }
      if (name2) {
        isKeyword = context.checkKeyword.call(this, context, name2);
        if (isKeyword) {
          nameLen = 2;
          this.setKeyword_(next, true);
          fullName = name2;
        }
      }
      if (!isKeyword) {
        isKeyword = context.checkKeyword.call(this, context, name1);
      }
      return {
        isKeyword,
        name: fullName,
        nameLen
      };
    }
    tryToHandleSectionEnd_(token) {
      let ret = false;
      if (this.sectionEndStmts_[token.text]) {
        token.type = "sec-keyword";
        const next = this.prefetch_({ pos: 1 });
        if (next && next.text === "CANCEL") {
          next.type = Lexer.TOKEN_TYPES.SKEYWORD;
        }
        ret = true;
      }
      return ret;
    }
    tryToHandleExpr_(token, optChecker) {
      if (this.curr.exprTokenCount) {
        token.notCheckKeyword = true;
        this.curr.exprTokenIndex++;
        if (this.curr.exprTokenIndex > this.curr.exprTokenCount) {
          this.curr.exprTokenCount = 0;
          token.notCheckKeyword = false;
        }
      }
      if (!this.curr.exprTokenCount) {
        let needToHandleExpr = false, startPos = 0;
        if (Lexer.isWord[token.type]) {
          const next = this.prefetch_({ pos: 1 }), exprBeg = { "=": 1, "(": 1 };
          if (next && exprBeg[next.text]) {
            if (next.text === "=") {
              startPos = 1;
            }
            needToHandleExpr = true;
          }
          if (next && next.text === "(") {
            if (this.syntaxDb.isSasFunction(token.text)) {
              this.setKeyword_(token, true);
            }
          }
        } else if (token.text === "=") {
          needToHandleExpr = true;
        }
        if (needToHandleExpr) {
          const self = this;
          const ret = this.expr.parse(
            this.curr.hasSlashOptionDelimiter,
            startPos,
            function(subOptToken, pos) {
              const type = optChecker.getOptionType.call(self, token.text) || "";
              let isKeyword;
              if (self.syntaxDb.isDataSetType(type)) {
                isKeyword = self.syntaxDb.isDatasetKeyword(subOptToken.text);
              } else {
                isKeyword = optChecker.checkSubOption.call(
                  self,
                  token.text,
                  subOptToken.text,
                  pos
                );
              }
              self.setKeyword_(subOptToken, isKeyword);
            }
          );
          this.curr.exprTokenCount = ret.pos;
          this.curr.exprTokenIndex = 0;
        }
      }
    }
    readGblStmt_() {
      return this.handleStatement_(this.OptionCheckers_["gbl-stmt"]);
    }
    readProcStmt_() {
      const token = this.handleStatement_(this.OptionCheckers_["proc-stmt"]);
      if (token && Lexer.isWord[token.type] && this.specialStmts_[this.curr.procName + "/" + this.curr.name]) {
        let isKeyword = false;
        if (this.curr.optNameLen !== void 0 && this.curr.optNameLen > 1) {
          isKeyword = true;
          this.curr.optNameLen--;
        } else {
          const obj = this.handleLongStmtOptionName_(
            this.curr.procName,
            this.curr.name,
            token.text
          );
          this.curr.optNameLen = obj.nameLen;
          isKeyword = obj.isKeyword;
        }
        this.setKeyword_(token, isKeyword);
      }
      return token;
    }
    readDataStmt_() {
      return this.handleStatement_(this.OptionCheckers_["data-stmt"]);
    }
    readMacroStmt_() {
      return this.handleStatement_(this.OptionCheckers_["macro-stmt"]);
    }
    popSMTo_(level) {
      let deep = this.stack.length - level;
      while (deep > 0) {
        this.stack.pop();
        deep--;
      }
    }
    handleBlock_(fn2) {
      let word = "";
      const token = this.getNext_();
      if (!token) return null;
      if (Lexer.isWord[token.type]) {
        if (this.isLabel_()) {
          this.stack.push({
            parse: this.readLabel_,
            state: this.PARSING_STATE.IN_PROC
          });
        } else if (this.isAssignment_(token)) {
          fn2.call(this, token);
        } else {
          word = token.text;
          switch (word) {
            case "RUN":
            case "QUIT":
              token.type = Lexer.TOKEN_TYPES.SKEYWORD;
              this.popSMTo_(2);
              this.stack.push({
                parse: this.readEnd_,
                state: this.PARSING_STATE.IN_PROC,
                start: token,
                name: word
              });
              break;
            case "PROC":
            case "PROCEDURE": {
              if (this.currSection?.type === this.SEC_TYPE.CUSTOM) {
                this.tryPromoteCustomBlock_();
              } else {
                this.endFoldingBlock_(this.SEC_TYPE.PROC, this.lastToken.end);
              }
              this.startFoldingBlock_(this.SEC_TYPE.PROC, token.start, word);
              token.type = Lexer.TOKEN_TYPES.SKEYWORD;
              this.popSMTo_(1);
              const procName = this.handleProcName_();
              this.stack.push({
                parse: this.readProc_,
                state: this.PARSING_STATE.IN_PROC,
                name: procName
              });
              this.stack.push({
                parse: this.readProcDef_,
                state: this.PARSING_STATE.IN_PROC,
                name: procName
              });
              break;
            }
            case "DATA":
              if (this.currSection?.type === this.SEC_TYPE.CUSTOM) {
                this.tryPromoteCustomBlock_();
              } else {
                this.endFoldingBlock_(this.SEC_TYPE.PROC, this.lastToken.end);
              }
              this.startFoldingBlock_(this.SEC_TYPE.DATA, token.start, word);
              token.type = Lexer.TOKEN_TYPES.SKEYWORD;
              this.popSMTo_(1);
              this.stack.push({
                parse: this.readData_,
                state: this.PARSING_STATE.IN_DATA
              });
              this.stack.push({
                parse: this.readDataDef_,
                state: this.PARSING_STATE.IN_DATA
              });
              break;
            case "%MACRO":
              if (this.currSection?.type === this.SEC_TYPE.CUSTOM) {
                this.tryPromoteCustomBlock_();
              } else {
                this.endFoldingBlock_(this.SEC_TYPE.PROC, this.lastToken.end);
              }
              this.startFoldingBlock_(this.SEC_TYPE.MACRO, token.start, word);
              token.type = Lexer.TOKEN_TYPES.MSKEYWORD;
              this.popSMTo_(1);
              this.stack.push({
                parse: this.readMacro_,
                state: this.PARSING_STATE.IN_MACRO
              });
              this.stack.push({
                parse: this.readMacroDef_,
                state: this.PARSING_STATE.IN_MACRO
              });
              break;
            default:
              fn2.call(this, token);
          }
        }
      }
      return token;
    }
    /*
        OptionInforVisitor {
            getOptionType: function(optName){},
            checkSubOption: function(optName, subOptName){}
        }
      */
    handleStatement_(optChecker) {
      const token = this.getNext_();
      if (token) {
        this.tryToHandleExpr_(token, optChecker);
        if (token.text === ";") {
          this.stack.pop();
        } else if (Lexer.isWord[token.type] && !token.notCheckKeyword) {
          if (this.curr.name === "ODS") {
            this.handleODSStmt_(token);
          } else {
            if (optChecker.checkOption) {
              this.setKeyword_(
                token,
                optChecker.checkOption.call(this, token.text)
              );
            }
          }
        }
      }
      return token;
    }
    handleEnd_() {
      const token = this.getNext_();
      if (token && token.text === ";") {
        this.stack.pop();
        this.stack.pop();
      }
      return token;
    }
    handleMref_(state) {
      const next = this.prefetch_({ pos: 1 });
      if (next && next.text === "(") {
        this.stack.push({ parse: this.readMRef_, state });
      }
    }
    readLabel_() {
      const token = this.getNext_();
      if (token && token.text === ":") {
        this.stack.pop();
      }
      return token;
    }
    readMRef_() {
      const token = this.getNext_();
      if (token && token.text === ")") {
        this.stack.pop();
      } else {
        if (token && Lexer.isWord[token.type]) {
          const next2 = this.prefetch_({ pos: 1 });
          if (next2 && next2.text === "=") {
            token.type = Lexer.TOKEN_TYPES.MKEYWORDPARAM;
          }
        }
        const next = this.prefetch_({ pos: 1 });
        if (next && next.text === "(") {
          this.stack.push(this.curr);
        }
      }
      return token;
    }
    readComment_() {
    }
    readStatGraph_() {
      return this.handleBlock_(function(token) {
        if (token.text === "ENDGRAPH") {
          this.setKeyword_(token, true);
          this.stack.push({
            parse: this.readStatGraphEnd_,
            state: this.PARSING_STATE.IN_PROC,
            start: token,
            name: token.text
          });
        } else {
          const state = {
            parse: this.readStatGraphStmt_,
            state: this.PARSING_STATE.IN_PROC,
            name: token.text
          };
          this.stack.push(state);
          let next = null, isKeyword = this.syntaxDb.isProcedureStatementKeyword(
            "STATGRAPH",
            this._cleanKeyword(token.text)
          );
          if (!isKeyword) {
            next = this.prefetch_({ pos: 1 });
            if (next) {
              const word = token.text + " " + next.text;
              isKeyword = this.syntaxDb.isProcedureStatementKeyword(
                "STATGRAPH",
                word
              );
              if (isKeyword) {
                state.name = word;
                this.setKeyword_(next, true);
              }
            }
          }
          this.setKeyword_(token, isKeyword);
        }
      });
    }
    readStatGraphDef_() {
      return this.handleStatement_(this.OptionCheckers_["sg-def"]);
    }
    readStatGraphStmt_() {
      return this.handleStatement_(this.OptionCheckers_["sg-stmt"]);
    }
    readStatGraphEnd_() {
      return this.handleEnd_();
    }
    readDefineTagset_() {
      return this.handleBlock_(function(token) {
        let word = token.text;
        if (token.text === "END") {
          this.setKeyword_(token, true);
          this.stack.push({
            parse: this.readDefineTagsetEnd_,
            state: this.PARSING_STATE.IN_PROC,
            start: token,
            name: word
          });
        } else {
          let generalTagsetStmt = true;
          const next = this.prefetch_({ pos: 1 });
          if (next) {
            const fullName = word + " " + next.text;
            if (fullName === "DEFINE EVENT") {
              this.stack.push({
                parse: this.readDefineEvent_,
                state: this.PARSING_STATE.IN_PROC,
                name: fullName
              });
              this.stack.push({
                parse: this.readDefineEventDef_,
                state: this.PARSING_STATE.IN_PROC,
                name: fullName
              });
              generalTagsetStmt = false;
              this.setKeyword_(next, true);
              this.setKeyword_(token, true);
            }
          }
          if (generalTagsetStmt) {
            const state = {
              parse: this.readDefineTagsetStmt_,
              state: this.PARSING_STATE.IN_PROC,
              name: word
            };
            this.stack.push(state);
            let isKeyword = this.syntaxDb.isProcedureStatementKeyword(
              "DEFINE_TAGSET",
              this._cleanKeyword(word)
            );
            if (!isKeyword) {
              if (next) {
                word += " " + next.text;
                isKeyword = this.syntaxDb.isProcedureStatementKeyword(
                  "DEFINE_TAGSET",
                  word
                );
                if (isKeyword) {
                  state.name = word;
                  this.setKeyword_(next, true);
                }
              }
            }
            this.setKeyword_(token, isKeyword);
          }
        }
      });
    }
    readDefineTagsetDef_() {
      return this.handleStatement_(this.OptionCheckers_["dt-def"]);
    }
    readDefineTagsetStmt_() {
      return this.handleStatement_(this.OptionCheckers_["dt-stmt"]);
    }
    readDefineTagsetEnd_() {
      return this.handleEnd_();
    }
    readDefineEvent_() {
      return this.handleBlock_(function(token) {
        let word = token.text;
        if (word === "END") {
          this.setKeyword_(token, true);
          this.stack.push({
            parse: this.readDefineEventEnd_,
            state: this.PARSING_STATE.IN_PROC,
            start: token,
            name: word
          });
        } else {
          const state = {
            parse: this.readDefineEventStmt_,
            state: this.PARSING_STATE.IN_PROC,
            name: word
          };
          this.stack.push(state);
          let next = null, isKeyword = this.syntaxDb.isProcedureStatementKeyword(
            "DEFINE_EVENT",
            this._cleanKeyword(word)
          );
          if (!isKeyword) {
            next = this.prefetch_({ pos: 1 });
            if (next) {
              word += " " + next.text;
              isKeyword = this.syntaxDb.isProcedureStatementKeyword(
                "DEFINE_EVENT",
                word
              );
              if (isKeyword) {
                this.setKeyword_(next, true);
                state.name = word;
              }
            }
          }
          this.setKeyword_(token, isKeyword);
        }
      });
    }
    readDefineEventDef_() {
      return this.handleStatement_(this.OptionCheckers_["de-def"]);
    }
    readDefineEventStmt_() {
      return this.handleStatement_(this.OptionCheckers_["de-stmt"]);
    }
    readDefineEventEnd_() {
      return this.handleEnd_();
    }
    readSubmitOrInteractiveBlock_() {
      const token = this.getNext_();
      const next = this.prefetch_({ pos: 1 });
      const next2 = this.prefetch_({ pos: 2 });
      const next3 = this.prefetch_({ pos: 3 });
      if (!token) {
        return void 0;
      }
      if (next && next2 && next3 && token.end.line <= next.start.line && next.type === "embedded-code" && ["ENDSUBMIT", "ENDINTERACTIVE"].includes(next2.text) && next3.type === "sep" && next3.text === ";") {
        this.stack.push({
          parse: this.handleEnd_,
          state: this.PARSING_STATE.IN_PROC
        });
        this.setKeyword_(next2, true);
      } else if (next && ["DATA", "PROC", "%MACRO"].includes(next.text)) {
        this.stack.pop();
      }
      return token;
    }
    readProc_() {
      let word = "";
      const token = this.getNext_(), procName = this.curr.name || "";
      if (!token) return;
      if (Lexer.isWord[token.type]) {
        if (this.isLabel_()) {
          this.stack.push({
            parse: this.readLabel_,
            state: this.PARSING_STATE.IN_PROC
          });
        } else if (this.isAssignment_(token)) {
          const validName = this._cleanKeyword(word);
          this.stack.push({
            parse: this.readProcStmt_,
            state: this.PARSING_STATE.IN_PROC,
            name: validName,
            procName
          });
        } else {
          word = token.text;
          switch (word) {
            case (this.syntaxDb.isInteractiveProc(procName) ? "QUIT" : "RUN"):
            case "QUIT":
              token.type = Lexer.TOKEN_TYPES.SKEYWORD;
              this.stack.push({
                parse: this.readEnd_,
                state: this.PARSING_STATE.IN_PROC,
                start: token,
                name: word
              });
              break;
            case "%MEND":
              token.type = Lexer.TOKEN_TYPES.MSKEYWORD;
              if (this.stack.length > 2 && this.stack[this.stack.length - 2].state === this.PARSING_STATE.IN_MACRO) {
                this.stack.pop();
                this.stack.push({
                  parse: this.readMend_,
                  state: this.PARSING_STATE.IN_MACRO,
                  start: token,
                  name: word
                });
              }
              break;
            case "PROC":
            case "PROCEDURE": {
              if (this.currSection?.type === this.SEC_TYPE.CUSTOM) {
                this.tryPromoteCustomBlock_();
              } else {
                this.endFoldingBlock_(this.SEC_TYPE.PROC, this.lastToken.end);
              }
              this.startFoldingBlock_(this.SEC_TYPE.PROC, token.start, word);
              token.type = Lexer.TOKEN_TYPES.SKEYWORD;
              this.stack.pop();
              const procName2 = this.handleProcName_();
              this.stack.push({
                parse: this.readProc_,
                state: this.PARSING_STATE.IN_PROC,
                name: procName2
              });
              this.stack.push({
                parse: this.readProcDef_,
                state: this.PARSING_STATE.IN_PROC,
                name: procName2
              });
              break;
            }
            case "%MACRO":
              if (this.currSection?.type === this.SEC_TYPE.CUSTOM) {
                this.tryPromoteCustomBlock_();
              } else {
                this.endFoldingBlock_(this.SEC_TYPE.PROC, this.lastToken.end);
              }
              this.startFoldingBlock_(this.SEC_TYPE.MACRO, token.start, word);
              token.type = Lexer.TOKEN_TYPES.MSKEYWORD;
              this.stack.pop();
              this.stack.push({
                parse: this.readMacro_,
                state: this.PARSING_STATE.IN_MACRO
              });
              this.stack.push({
                parse: this.readMacroDef_,
                state: this.PARSING_STATE.IN_MACRO
              });
              break;
            case "DATA":
              if (!this.DS2_[procName]) {
                if (this.currSection?.type === this.SEC_TYPE.CUSTOM) {
                  this.tryPromoteCustomBlock_();
                } else {
                  this.endFoldingBlock_(this.SEC_TYPE.PROC, this.lastToken.end);
                }
                this.startFoldingBlock_(this.SEC_TYPE.DATA, token.start, word);
                token.type = Lexer.TOKEN_TYPES.SKEYWORD;
                this.stack.pop();
                this.stack.push({
                  parse: this.readData_,
                  state: this.PARSING_STATE.IN_DATA
                });
                this.stack.push({
                  parse: this.readDataDef_,
                  state: this.PARSING_STATE.IN_DATA
                });
                break;
              }
            // not break
            default: {
              this.tryToHandleSectionEnd_(token);
              let generalProcStmt = true;
              if (procName === "TEMPLATE") {
                if (word === "BEGINGRAPH") {
                  this.stack.push({
                    parse: this.readStatGraph_,
                    state: this.PARSING_STATE.IN_PROC
                  });
                  this.stack.push({
                    parse: this.readStatGraphDef_,
                    state: this.PARSING_STATE.IN_PROC
                  });
                  this.setKeyword_(token, true);
                  generalProcStmt = false;
                } else {
                  const next = this.prefetch_({ pos: 1 });
                  if (next && next.text === "TAGSET" && word === "DEFINE") {
                    this.stack.push({
                      parse: this.readDefineTagset_,
                      state: this.PARSING_STATE.IN_PROC
                    });
                    this.stack.push({
                      parse: this.readDefineTagsetDef_,
                      state: this.PARSING_STATE.IN_PROC
                    });
                    this.setKeyword_(next, true);
                    this.setKeyword_(token, true);
                    generalProcStmt = false;
                  }
                }
              } else if (procName === "EXPLODE") {
                if (Lexer.isParmcards[word]) {
                  this.cardsState = this.CARDS_STATE.IN_CMD;
                  this.stack.push({
                    parse: this.readCards_,
                    state: this.PARSING_STATE.IN_DATA,
                    name: word,
                    token
                  });
                  this.setKeyword_(token, true);
                  generalProcStmt = false;
                }
              } else if (procName === "LUA" || procName === "PYTHON" || procName === "R") {
                if (["SUBMIT", "INTERACTIVE", "I"].includes(word)) {
                  const next = this.prefetch_({ pos: 1 });
                  if (next && next.text === ";" && next.type === "sep") {
                    this.stack.push({
                      parse: this.readSubmitOrInteractiveBlock_,
                      state: this.PARSING_STATE.IN_PROC
                    });
                    this.setKeyword_(token, true);
                    generalProcStmt = false;
                  }
                }
              } else if (token.type === Lexer.TOKEN_TYPES.MREF) {
                this.handleMref_(this.PARSING_STATE.IN_PROC);
                generalProcStmt = false;
              }
              if (generalProcStmt) {
                const validName = this._cleanKeyword(word);
                const state = {
                  parse: this.readProcStmt_,
                  state: this.PARSING_STATE.IN_PROC,
                  name: validName,
                  procName
                };
                this.stack.push(state);
                const obj = this.handleLongStmtName_(procName, validName);
                state.name = obj.stmtName;
                this.setKeyword_(token, obj.isKeyword);
                state.hasSlashOptionDelimiter = this.syntaxDb.hasOptionDelimiter(
                  procName,
                  obj.stmtName
                );
              }
            }
          }
        }
      } else if (Lexer.isComment[token.type]) {
        if (this.isCustomBlockStart_(token)) {
          this.startFoldingBlock_(this.SEC_TYPE.CUSTOM, token.start, token.text);
        } else if (this.isCustomBlockEnd_(token)) {
          if (this.searchBlockUpwardOfType_(this.currSection, this.SEC_TYPE.CUSTOM)) {
            this.tryEndFoldingBlock_(
              token.start,
              this.SEC_TYPE.CUSTOM,
              token.end
            );
          }
        }
      }
      return token;
    }
    hasRunCancelFollowed_() {
      let next1, next2, ret = false;
      const it2 = { pos: 1 };
      do {
        next1 = this.prefetch_(it2);
      } while (next1 && next1.text !== ";");
      if (next1) {
        next1 = this.prefetch_(it2);
        next2 = this.prefetch_(it2);
        if (next1 && next2) {
          if (Lexer.isWord[next1.type] && next2.text === ":") {
            next1 = this.prefetch_(it2);
            next2 = this.prefetch_(it2);
          }
          if (next1 && next2 && next1.text === "RUN" && next2.text === "CANCEL") {
            ret = true;
          }
        }
      }
      return ret;
    }
    /*
     *              readData_
     *  %MACRO, PROC  ----> pop + push
     *           DATA ----> ignore
     */
    readData_() {
      let word = "";
      const token = this.getNext_();
      if (!token) return;
      if (Lexer.isWord[token.type]) {
        if (this.isLabel_()) {
          this.stack.push({
            parse: this.readLabel_,
            state: this.PARSING_STATE.IN_DATA
          });
        } else if (this.isAssignment_(token)) {
          const validName = this._cleanKeyword(word);
          this.stack.push({
            parse: this.readDataStmt_,
            state: this.PARSING_STATE.IN_DATA,
            name: validName
          });
        } else {
          word = token.text;
          switch (word) {
            case "%MEND":
              token.type = Lexer.TOKEN_TYPES.MSKEYWORD;
              if (this.stack.length > 2 && this.stack[this.stack.length - 2].state === this.PARSING_STATE.IN_MACRO) {
                this.stack.pop();
                this.stack.push({
                  parse: this.readMend_,
                  state: this.PARSING_STATE.IN_MACRO,
                  start: token,
                  name: word
                });
              }
              break;
            case "DATA":
              if (this.currSection?.type === this.SEC_TYPE.CUSTOM) {
                this.tryPromoteCustomBlock_();
              } else {
                this.endFoldingBlock_(this.SEC_TYPE.DATA, this.lastToken.end);
              }
              this.startFoldingBlock_(this.SEC_TYPE.DATA, token.start, word);
              token.type = Lexer.TOKEN_TYPES.SKEYWORD;
              this.stack.push({
                parse: this.readDataDef_,
                state: this.PARSING_STATE.IN_DATA
              });
              break;
            case "PROC":
            case "PROCEDURE": {
              if (this.currSection?.type === this.SEC_TYPE.CUSTOM) {
                this.tryPromoteCustomBlock_();
              } else {
                this.endFoldingBlock_(this.SEC_TYPE.DATA, this.lastToken.end);
              }
              this.startFoldingBlock_(this.SEC_TYPE.PROC, token.start, word);
              token.type = Lexer.TOKEN_TYPES.SKEYWORD;
              this.stack.pop();
              const procName = this.handleProcName_();
              this.stack.push({
                parse: this.readProc_,
                state: this.PARSING_STATE.IN_PROC,
                name: procName
              });
              this.stack.push({
                parse: this.readProcDef_,
                state: this.PARSING_STATE.IN_PROC,
                name: procName
              });
              break;
            }
            case "%MACRO":
              if (this.currSection?.type === this.SEC_TYPE.CUSTOM) {
                this.tryPromoteCustomBlock_();
              } else {
                this.endFoldingBlock_(this.SEC_TYPE.DATA, this.lastToken.end);
              }
              this.startFoldingBlock_(this.SEC_TYPE.MACRO, token.start, word);
              token.type = Lexer.TOKEN_TYPES.MSKEYWORD;
              this.stack.pop();
              this.stack.push({
                parse: this.readMacro_,
                state: this.PARSING_STATE.IN_MACRO
              });
              this.stack.push({
                parse: this.readMacroDef_,
                state: this.PARSING_STATE.IN_MACRO
              });
              break;
            case "RUN":
            case "QUIT":
              token.type = Lexer.TOKEN_TYPES.SKEYWORD;
              if (!this.hasRunCancelFollowed_()) {
                this.tryToHandleSectionEnd_(token);
                this.stack.push({
                  parse: this.readEnd_,
                  state: this.PARSING_STATE.IN_DATA,
                  start: token,
                  name: word
                });
                break;
              }
            // attention: not break here
            default:
              if (Lexer.isCards[word]) {
                this.cardsState = this.CARDS_STATE.IN_CMD;
                this.stack.push({
                  parse: this.readCards_,
                  state: this.PARSING_STATE.IN_DATA,
                  name: word,
                  token
                });
                this.setKeyword_(
                  token,
                  this.syntaxDb.isProcedureStatementKeyword("DATA", word)
                );
              } else if (token.type === Lexer.TOKEN_TYPES.MREF) {
                this.handleMref_(this.PARSING_STATE.IN_DATA);
              } else {
                const validName = this._cleanKeyword(word);
                const state = {
                  parse: this.readDataStmt_,
                  state: this.PARSING_STATE.IN_DATA,
                  name: validName
                };
                this.stack.push(state);
                if (!this.tryToHandleSectionEnd_(token)) {
                  const obj = this.handleLongStmtName_("DATA", validName);
                  state.name = obj.stmtName;
                  this.setKeyword_(token, obj.isKeyword);
                  state.hasSlashOptionDelimiter = this.syntaxDb.hasOptionDelimiter("DATA", obj.stmtName);
                }
              }
          }
        }
      } else if (Lexer.isComment[token.type]) {
        if (this.isCustomBlockStart_(token)) {
          this.startFoldingBlock_(this.SEC_TYPE.CUSTOM, token.start, token.text);
        } else if (this.isCustomBlockEnd_(token)) {
          if (this.searchBlockUpwardOfType_(this.currSection, this.SEC_TYPE.CUSTOM)) {
            this.tryEndFoldingBlock_(
              token.start,
              this.SEC_TYPE.CUSTOM,
              token.end
            );
          }
        }
      }
      return token;
    }
    searchBlockUpwardOfType_(startBlock, type) {
      let cur = startBlock;
      while (cur) {
        if (cur.type === type) {
          return cur;
        } else {
          cur = cur.outerBlock;
        }
      }
      return null;
    }
    searchLastConsecutiveBlockUpwardOfType_(startBlock) {
      if (!startBlock) {
        return null;
      }
      let cur = startBlock;
      while (cur.outerBlock && cur.outerBlock.type === cur.type) {
        cur = cur.outerBlock;
      }
      return cur;
    }
    tryPromoteCustomBlock_() {
      const curSec = this.currSection;
      const outermostCustomBlock = this.searchLastConsecutiveBlockUpwardOfType_(this.currSection);
      if ([this.SEC_TYPE.DATA, this.SEC_TYPE.PROC].includes(
        outermostCustomBlock?.outerBlock?.type
      )) {
        const nearestNonCustomBlock = outermostCustomBlock.outerBlock;
        if (nearestNonCustomBlock) {
          const pos = nearestNonCustomBlock?.innerBlocks.indexOf(outermostCustomBlock);
          nearestNonCustomBlock?.innerBlocks.splice(pos, 1);
          this.currSection = nearestNonCustomBlock;
          this.endFoldingBlock_(nearestNonCustomBlock.type, {
            line: outermostCustomBlock.startLine,
            column: outermostCustomBlock.startCol
          });
          nearestNonCustomBlock.outerBlock?.innerBlocks.push(
            outermostCustomBlock
          );
          outermostCustomBlock.outerBlock = nearestNonCustomBlock.outerBlock;
          this.currSection = curSec;
        }
      }
    }
    /*
     *            readMacro_
     *  PROC, DATA %MACRO -----> ignore
     */
    readMacro_() {
      let word = "";
      const token = this.getNext_();
      if (!token) return;
      if (Lexer.isWord[token.type]) {
        if (this.isLabel_()) {
          this.stack.push({
            parse: this.readLabel_,
            state: this.PARSING_STATE.IN_MACRO
          });
        } else if (this.isAssignment_(token)) {
          const validName = this._cleanKeyword(word);
          this.stack.push({
            parse: this.readMacroStmt_,
            state: this.PARSING_STATE.IN_MACRO,
            name: validName
          });
        } else {
          word = token.text;
          switch (word) {
            case "%MEND":
              token.type = Lexer.TOKEN_TYPES.MSKEYWORD;
              this.stack.push({
                parse: this.readMend_,
                state: this.PARSING_STATE.IN_MACRO,
                start: token,
                name: word
              });
              break;
            case "%MACRO":
              this.startFoldingBlock_(this.SEC_TYPE.MACRO, token.start, word);
              token.type = Lexer.TOKEN_TYPES.MSKEYWORD;
              this.stack.push({
                parse: this.readMacro_,
                state: this.PARSING_STATE.IN_MACRO
              });
              this.stack.push({
                parse: this.readMacroDef_,
                state: this.PARSING_STATE.IN_MACRO
              });
              break;
            case "PROC":
            case "PROCEDURE": {
              this.startFoldingBlock_(this.SEC_TYPE.PROC, token.start, word);
              token.type = Lexer.TOKEN_TYPES.SKEYWORD;
              const procName = this.handleProcName_();
              this.stack.push({
                parse: this.readProc_,
                state: this.PARSING_STATE.IN_PROC,
                name: procName
              });
              this.stack.push({
                parse: this.readProcDef_,
                state: this.PARSING_STATE.IN_PROC,
                name: procName
              });
              break;
            }
            case "DATA":
              this.startFoldingBlock_(this.SEC_TYPE.DATA, token.start, word);
              token.type = Lexer.TOKEN_TYPES.SKEYWORD;
              this.stack.push({
                parse: this.readData_,
                state: this.PARSING_STATE.IN_DATA
              });
              this.stack.push({
                parse: this.readDataDef_,
                state: this.PARSING_STATE.IN_DATA
              });
              break;
            default:
              if (token.type === Lexer.TOKEN_TYPES.MREF) {
                this.handleMref_(this.PARSING_STATE.IN_MACRO);
              } else {
                const validName = this._cleanKeyword(word);
                const state = {
                  parse: this.readMacroStmt_,
                  state: this.PARSING_STATE.IN_MACRO,
                  name: validName
                };
                this.stack.push(state);
                const obj = this.handleLongStmtName_("MACRO", validName);
                state.name = obj.stmtName;
                this.setKeyword_(token, obj.isKeyword);
                state.hasSlashOptionDelimiter = this.syntaxDb.hasOptionDelimiter(
                  "DATA",
                  obj.stmtName
                );
              }
          }
        }
      } else if (Lexer.isComment[token.type]) {
        if (this.isCustomBlockStart_(token)) {
          this.startFoldingBlock_(this.SEC_TYPE.CUSTOM, token.start, token.text);
        } else if (this.isCustomBlockEnd_(token)) {
          if (this.searchBlockUpwardOfType_(this.currSection, this.SEC_TYPE.CUSTOM)) {
            this.tryEndFoldingBlock_(
              token.start,
              this.SEC_TYPE.CUSTOM,
              token.end
            );
          }
        }
      }
      return token;
    }
    readGbl_() {
      let word = "";
      const token = this.getNext_();
      if (!token) return;
      if (Lexer.isWord[token.type]) {
        if (this.isLabel_()) {
          this.stack.push({
            parse: this.readLabel_,
            state: this.PARSING_STATE.IN_GBL
          });
        } else if (this.isAssignment_(token)) {
          const validName = this._cleanKeyword(word);
          this.stack.push({
            parse: this.readGblStmt_,
            state: this.PARSING_STATE.IN_GBL,
            name: validName
          });
        } else {
          word = token.text;
          if (word === "PROC" || word === "PROCEDURE") {
            if (this.currSection?.type !== this.SEC_TYPE.CUSTOM) {
              this.endFoldingBlock_(this.SEC_TYPE.GBL, this.lastToken.end);
            }
            this.startFoldingBlock_(this.SEC_TYPE.PROC, token.start, word);
            token.type = Lexer.TOKEN_TYPES.SKEYWORD;
            this.stack.pop();
            const procName = this.handleProcName_();
            this.stack.push({
              parse: this.readProc_,
              state: this.PARSING_STATE.IN_PROC,
              name: procName
            });
            this.stack.push({
              parse: this.readProcDef_,
              state: this.PARSING_STATE.IN_PROC,
              name: procName
            });
          } else if (word === "%MACRO") {
            if (this.currSection?.type !== this.SEC_TYPE.CUSTOM) {
              this.endFoldingBlock_(this.SEC_TYPE.GBL, this.lastToken.end);
            }
            this.startFoldingBlock_(this.SEC_TYPE.MACRO, token.start, word);
            token.type = Lexer.TOKEN_TYPES.MSKEYWORD;
            this.stack.pop();
            this.stack.push({
              parse: this.readMacro_,
              state: this.PARSING_STATE.IN_MACRO
            });
            this.stack.push({
              parse: this.readMacroDef_,
              state: this.PARSING_STATE.IN_MACRO
            });
          } else if (word === "DATA") {
            if (this.currSection?.type !== this.SEC_TYPE.CUSTOM) {
              this.endFoldingBlock_(this.SEC_TYPE.GBL, this.lastToken.end);
            }
            this.startFoldingBlock_(this.SEC_TYPE.DATA, token.start, word);
            token.type = Lexer.TOKEN_TYPES.SKEYWORD;
            this.stack.pop();
            this.stack.push({
              parse: this.readData_,
              state: this.PARSING_STATE.IN_DATA
            });
            this.stack.push({
              parse: this.readDataDef_,
              state: this.PARSING_STATE.IN_DATA
            });
          } else if (token.type === Lexer.TOKEN_TYPES.MREF) {
            this.handleMref_(this.PARSING_STATE.IN_GBL);
          } else {
            if (!this.hasFoldingBlock_()) {
              this.startFoldingBlock_(this.SEC_TYPE.GBL, token.start, word);
            }
            const validName = this._cleanKeyword(word);
            const state = {
              parse: this.readGblStmt_,
              state: this.PARSING_STATE.IN_GBL,
              name: validName
            };
            this.stack.push(state);
            if (!this.tryToHandleSectionEnd_(token)) {
              const obj = this.handleLongStmtName_("", validName);
              state.name = obj.stmtName;
              this.setKeyword_(token, obj.isKeyword);
              state.hasSlashOptionDelimiter = this.syntaxDb.hasOptionDelimiter(
                "",
                obj.stmtName
              );
            }
          }
        }
      } else if (Lexer.isComment[token.type]) {
        if (this.isCustomBlockStart_(token)) {
          if (this.currSection?.type !== this.SEC_TYPE.CUSTOM) {
            this.endFoldingBlock_(this.SEC_TYPE.GBL, this.lastToken.end);
          }
          this.startFoldingBlock_(this.SEC_TYPE.CUSTOM, token.start, token.text);
        } else if (this.isCustomBlockEnd_(token)) {
          this.tryEndFoldingBlock_(token.end, this.SEC_TYPE.CUSTOM);
        }
      }
      return token;
    }
    readCards_() {
      let word = "", totalLines, line3, text, token = null;
      const endExp = Lexer.isCards4[this.curr.name] || Lexer.isParmcards4[this.curr.name] ? /^;;;;/ : /;/;
      if (this.cardsState === this.CARDS_STATE.IN_CMD) {
        token = this.getNext_();
        if (token && token.type === Lexer.TOKEN_TYPES.SEP) {
          word = token.text;
          if (word === ";") {
            this.startLineForCardsData = token.end.line + 1;
            this.cardsState = this.CARDS_STATE.IN_DATA_WAITING;
          }
        }
      } else if (this.cardsState === this.CARDS_STATE.IN_DATA_WAITING) {
        token = this.getNext_();
        if (token && token.start.line >= this.startLineForCardsData) {
          this.cardsState = this.CARDS_STATE.IN_DATA;
          this.startLineForCardsData = token.start.line;
          totalLines = this.model.getLineCount();
          line3 = token.start.line;
          text = "";
          do {
            text = this.model.getLine(line3);
            if (endExp.test(text)) {
              break;
            } else {
              line3++;
            }
          } while (line3 < totalLines);
          line3--;
          this.lexer.start.line = this.startLineForCardsData;
          this.lexer.start.column = 0;
          this.lexer.curr.line = line3;
          this.lexer.curr.column = this.model.getLine(line3).length;
          return this._changeCardsDataToken({
            type: Lexer.TOKEN_TYPES.CARDSDATA,
            start: this._clonePos(this.lexer.start),
            end: this._clonePos(this.lexer.curr)
          });
        }
      } else if (this.cardsState === this.CARDS_STATE.IN_DATA) {
        token = this.getNext_();
        if (token && token.text === ";") {
          this.cardsState = this.CARDS_STATE.IN_NULL;
          this.stack.pop();
        }
      } else {
      }
      return token;
    }
    readEnd_() {
      const token = this.getNext_();
      if (token && token.text === ";") {
        if (this.curr.state === this.PARSING_STATE.IN_PROC || this.curr.state === this.PARSING_STATE.IN_DATA) {
          this.stack.pop();
          this.stack.pop();
          this.endFoldingBlock_(
            this.curr.state === this.PARSING_STATE.IN_PROC ? this.SEC_TYPE.PROC : this.SEC_TYPE.DATA,
            token.end,
            true,
            this.curr.start,
            this.curr.name
          );
        }
      }
      return token;
    }
    readMend_() {
      const token = this.getNext_();
      if (token && token.text === ";") {
        if (this.curr.state === this.PARSING_STATE.IN_MACRO) {
          this.stack.pop();
          this.stack.pop();
          this.tryEndFoldingBlock_(
            this.curr.start.start,
            this.SEC_TYPE.MACRO,
            token.end
          );
        }
      }
      return token;
    }
  };
  _LexerEx.SEC_TYPE = {
    DATA: 0,
    PROC: 1,
    MACRO: 2,
    GBL: 3,
    CUSTOM: 4
  };
  _LexerEx.stmtWithDatasetOption_ = arrayToMap([
    //special
    "DATA/SET",
    "DATA/MERGE",
    "DATA/MODIFY",
    "DATA/UPDATE",
    //These are in IF statement, not SET statement. The syntax files are strange.
    //'CALIS/SET','COMPUTAB/SET','DSTRANS/SET','GENMOD/SET','GLIMMIX/SET','HPNLIN/SET','HPNLMOD/SET','IML/SET','MSMC/SET',
    //'MODEL/SET','NLIN/SET','NLMIXED/SET','OPTMODEL/SET','PHREG/SET','TCALIS/SET',
    "DOCUMENT/IMPORT",
    "JSON/EXPORT",
    "SERVER/ALLOCATE SASFILE"
    //'EXPORT','FSBROWSE','FSEDIT','FSLETTER','FSVIEW','HPSUMMARY','SUMMARY'// define option will be handled correctly as options, ignored here.
  ]);
  var LexerEx = _LexerEx;
  var Expression = class {
    constructor(parser) {
      const isScopeBeginMark = arrayToMap(["[", "{", "("]);
      function _copyContext(src, dst) {
        dst.pos = src.pos;
      }
      function _cloneContext(src) {
        return {
          pos: src.pos
        };
      }
      function _next0(context) {
        context.pos++;
        let token = parser.prefetch0_(context.pos);
        if (!token) {
          const end = parser._docEndPos();
          token = {
            type: "text",
            text: "",
            start: end,
            end
          };
        }
        return token;
      }
      function _next(context) {
        let token;
        do {
          token = _next0(context);
        } while (Lexer.isComment[token.type]);
        return token;
      }
      function _tryGetOpr(context) {
        const tmpContext = _cloneContext(context), token = _next(tmpContext);
        return { token, context: tmpContext };
      }
      function _expr(context, ends, optionNameCandidate) {
        let text, ret;
        const tmpContext = _cloneContext(context), token = _next(tmpContext);
        if (ends && ends[token.text]) {
          return;
        } else if (isScopeBeginMark[token.text]) {
          _argList(context, ends);
        } else if (Lexer.isUnaryOpr[token.text]) {
          _copyContext(tmpContext, context);
          _expr(context, ends);
        } else {
          _copyContext(tmpContext, context);
          if (optionNameCandidate && Lexer.isWord[token.type]) {
            context.onMeetTarget(token, context.pos);
          }
        }
        for (; ; ) {
          ret = _tryGetOpr(context);
          text = ret.token.text;
          if (Lexer.isBinaryOpr[text]) {
            if (text === "=" && optionNameCandidate && Lexer.isWord[token.type] && (token.type === "text" || token.type === Lexer.TOKEN_TYPES.MREF)) {
              token.type = Lexer.TOKEN_TYPES.MKEYWORDPARAM;
            }
            _copyContext(ret.context, context);
            if (Lexer.isWord[ret.token.type]) {
              context.onMeetTarget(ret.token, context.pos);
            }
            _expr(context, ends);
          } else if (isScopeBeginMark[text]) {
            if (Lexer.isWord[token.type] && text === "(") {
              if (parser.syntaxDb.isSasFunction(token.text)) {
                parser.setKeyword_(token, true);
              }
            }
            _argList(context, ends);
          } else {
            return;
          }
        }
      }
      function _argList(context, ends) {
        let token = _next(context), tmpContext = null, exit = false;
        const marks = { "(": ")", "[": "]", "{": "}" }, lmark = token.text, rmark = marks[lmark];
        ends = { ";": 1 };
        ends[rmark] = 1;
        let lastArgToken = null;
        do {
          lastArgToken = null;
          const origOnMeetTarget = context.onMeetTarget;
          context.onMeetTarget = function(tok, pos) {
            lastArgToken = tok;
            origOnMeetTarget(tok, pos);
          };
          _expr(context, ends, true);
          context.onMeetTarget = origOnMeetTarget;
          tmpContext = _cloneContext(context);
          token = _next(tmpContext);
          switch (token.text) {
            case "":
            case ";":
              exit = true;
              break;
            case rmark:
              _copyContext(tmpContext, context);
              exit = true;
              break;
            case "=":
              if (lastArgToken && (lastArgToken.type === "text" || lastArgToken.type === Lexer.TOKEN_TYPES.MREF)) {
                lastArgToken.type = Lexer.TOKEN_TYPES.MKEYWORDPARAM;
              }
              _copyContext(tmpContext, context);
              _expr(context, ends);
              break;
            case ",":
              _copyContext(tmpContext, context);
              break;
          }
        } while (!exit);
      }
      this.parse = function(ignoreDivision, startPos, onMeetTarget) {
        const context = {
          pos: startPos,
          onMeetTarget
        }, ret = { pos: 0 };
        try {
          if (ignoreDivision === void 0) {
            ignoreDivision = true;
          }
          ignoreDivision ? delete Lexer.isBinaryOpr["/"] : Lexer.isBinaryOpr["/"] = 1;
          _expr(context, { ";": 1 });
          ret.pos = context.pos;
          Lexer.isBinaryOpr["/"] = 1;
        } catch (e) {
        }
        return ret;
      };
    }
  };
  var isComment = (token) => token.type === "comment" || token.type === "macro-comment";
  var isAtBlockEnd = (block, token) => block && block.endLine === token.end.line && block.endCol === token.end.column;
  var removePrevStatement = (parent) => {
    if (parent.children.length <= 1) {
      return;
    }
    let prevStatement = parent.children[parent.children.length - 2];
    if (prevStatement.type === "statement") {
      parent.children.splice(-2, 1);
      return;
    }
    while (prevStatement.type === "region") {
      parent = prevStatement;
      prevStatement = prevStatement.children[prevStatement.children.length - 1];
    }
    parent.children.pop();
  };
  var getBlockParent = (parents) => {
    let index = parents.length - 1;
    while (index >= 0 && !parents[index].block) {
      index--;
    }
    return parents[index];
  };
  var hasParent = (parents, block) => {
    const parentBlock = getBlockParent(parents)?.block;
    if (!parentBlock) {
      return false;
    }
    while (block.outerBlock) {
      if (block.outerBlock === parentBlock) {
        return true;
      }
      block = block.outerBlock;
    }
    return false;
  };
  var isStartingRegion = (parents, currentStatement) => {
    if (/^%?do$/i.test(currentStatement.children[0].text)) {
      return true;
    }
    if (/^(%?if|%?else|when)$/i.test(currentStatement.children[0].text) && currentStatement.children.length > 1) {
      for (let i = 1; i < currentStatement.children.length - 1; i++) {
        if (/^%?do$/i.test(currentStatement.children[i].text)) {
          return true;
        }
      }
    }
    const parent = getBlockParent(parents);
    if (!parent || !parent.block) {
      return false;
    }
    const map = {
      data: /^select$/i,
      ds2: /^(select|method|data|package|thread)$/i,
      template: /^(define|begingraph|layout)$/i
    };
    const block = parent.block;
    let procName = "";
    if (block.name === "PROC") {
      const firstToken = parent.children[0].children[1];
      if (firstToken && "text" in firstToken) {
        procName = firstToken.text;
      }
    }
    const regexp = map[(procName || block.name).toLowerCase()];
    if (regexp && regexp.test(currentStatement.children[0].text)) {
      return true;
    }
    return false;
  };
  var preserveProcs = (current, region, token, model) => {
    const lastStatement = region.children.length >= 2 && region.children[region.children.length - 1].children;
    if (current === -1 && region.block?.name === "PROC" && lastStatement && region.children[0].children.length > 0 && lastStatement.length > 1 && "text" in region.children[0].children[1] && /^(python|lua|r)$/i.test(region.children[0].children[1].text) && "text" in lastStatement[0] && /^(submit|interactive|i)$/i.test(lastStatement[0].text)) {
      current = 0;
    }
    if (current === 0 && /^(endsubmit|endinteractive)$/i.test(token.text)) {
      return 1;
    } else if (current === 1 && token.type === "sep" && token.text === ";") {
      current = 2;
      const start = "start" in region.children[1].children[0] && region.children[1].children[0].start;
      const end = token.end;
      if (start) {
        region.children = [
          region.children[0],
          {
            type: "statement",
            name: "",
            children: [
              {
                type: "raw-data",
                text: model.getText({ start, end }),
                start,
                end
              }
            ]
          }
        ];
      }
    } else if (current === 2) {
      current = -1;
    }
    return current;
  };
  var preserveCustomRegion = (current, statement, model, syntaxProvider) => {
    const token = statement.children[statement.children.length - 1];
    if (current === -1) {
      if (isComment(token) && /\*\s*region\s+format-ignore\b/.test(token.text)) {
        const block = syntaxProvider.getFoldingBlock(
          token.start.line,
          token.start.column,
          true,
          false,
          true
        );
        if (block && block.type === LexerEx.SEC_TYPE.CUSTOM && block.startLine === token.start.line && block.startCol === token.start.column) {
          current = 0;
          const start = token.start;
          const end = { line: block.endLine, column: block.endCol };
          statement.children.pop();
          statement.children.push({
            type: "raw-data",
            text: model.getText({ start, end }),
            start,
            end
          });
        }
      }
    } else if (current === 0) {
      statement.children.pop();
      if (statement && statement.children.length > 0 && isSamePosition(
        token.end,
        statement.children[statement.children.length - 1].end
      )) {
        current = 1;
      }
    } else if (current === 1) {
      return -1;
    }
    return current;
  };
  var preserveQuoting = (current, statement, model) => {
    const token = statement.children[statement.children.length - 1];
    if (isComment(token)) {
      return current;
    }
    if (current === -1 && (Lexer.isQuoting[token.text.toUpperCase()] || Lexer.isBQuoting[token.text.toUpperCase()])) {
      return 0;
    } else if (current === 0 && token.text !== "(") {
      return -1;
    } else if (current >= 0) {
      statement.children.pop();
      if (token.text === "(") {
        if (++current === 1) {
          statement.children.push(token);
        }
      } else if (token.text === ")") {
        if (--current === 0) {
          const preToken = statement.children[statement.children.length - 1];
          const start = preToken.start;
          const end = token.end;
          statement.children.pop();
          statement.children.push({
            type: "text",
            text: model.getText({ start, end }),
            start,
            end
          });
          return -1;
        }
      }
    }
    return current;
  };
  var getParser = (model, tokens, syntaxProvider) => () => {
    const root = {
      type: "program",
      children: []
    };
    const parents = [];
    let region = void 0;
    let currentStatement = void 0;
    let prevStatement = void 0;
    let quoting = -1;
    let preserveProc = -1;
    let preserveCustom = -1;
    for (let i = 0; i < tokens.length; i++) {
      const node = tokens[i];
      let parent = parents.length ? parents[parents.length - 1] : root;
      if (region && region.block) {
        preserveProc = preserveProcs(preserveProc, region, node, model);
        if (preserveProc === 0 && i === tokens.length - 1) {
          const fakeNode = { ...node, text: ";", type: "sep" };
          if (node.text.endsWith("\n\n")) {
            fakeNode.end = { line: node.end.line - 1, column: 0 };
          }
          preserveProc = preserveProcs(1, region, fakeNode, model);
        }
        if (preserveProc >= 0) {
          continue;
        }
      }
      if (node.type === "embedded-code") {
        continue;
      }
      if (node.type === "sec-keyword" || node.type === "macro-sec-keyword") {
        const block = syntaxProvider.getFoldingBlock(
          node.start.line,
          node.start.column,
          true,
          true,
          true
        );
        if (block && block.startLine === node.start.line && block.startCol === node.start.column) {
          if (region && hasParent([...parents, region], block)) {
            parents.push(region);
            parent = region;
          }
          region = {
            type: "region",
            block,
            children: []
          };
          parent.children.push(region);
          if (currentStatement) {
            prevStatement = currentStatement;
            currentStatement = void 0;
          }
        }
      }
      if (currentStatement && currentStatement.children.length && /^%mend$/i.test(node.text)) {
        prevStatement = currentStatement;
        currentStatement = void 0;
      }
      if (!currentStatement) {
        currentStatement = {
          type: "statement",
          name: node.text,
          children: []
        };
        if (region) {
          if (region.children.length === 0 && prevStatement) {
            const prevToken = prevStatement.children[prevStatement.children.length - 1];
            if (prevStatement.children.length === 1 && isComment(prevToken)) {
              currentStatement.leadingComment = prevToken;
              removePrevStatement(parent);
            }
          }
          region.children.push(currentStatement);
        } else {
          parent.children.push(currentStatement);
        }
      }
      currentStatement.children.push(node);
      preserveCustom = preserveCustomRegion(
        preserveCustom,
        currentStatement,
        model,
        syntaxProvider
      );
      if (preserveCustom >= 0) {
        if (preserveCustom === 1) {
          prevStatement = currentStatement;
          currentStatement = void 0;
        }
        continue;
      }
      quoting = preserveQuoting(quoting, currentStatement, model);
      if (quoting >= 0) {
        continue;
      }
      if (node.type === "sep" && node.text === ";" && currentStatement.children.length === 2 && /^(datalines|cards|lines|parmcards)4?$/i.test(currentStatement.name)) {
        const four = /4$/i.test(currentStatement.name);
        const firstToken = currentStatement.children[0];
        const start = "start" in firstToken && firstToken.start ? { line: firstToken.start.line, column: 0 } : node.start;
        let line3 = node.end.line + 1;
        let sectionEnd;
        while (line3 < model.getLineCount()) {
          const content = model.getLine(line3).replace(/\r?\n$/, "");
          const ends = four ? /^;{4,}$/.test(content.trim()) : content.startsWith(";");
          if (ends) {
            sectionEnd = { line: line3, column: content.length };
            break;
          }
          line3++;
        }
        if (start && sectionEnd) {
          while (i + 1 < tokens.length && tokens[i + 1].start.line <= sectionEnd.line) {
            i++;
          }
          currentStatement.children = [
            {
              type: "raw-data",
              text: model.getText({ start, end: sectionEnd }),
              start,
              end: sectionEnd
            }
          ];
          const afterSection = tokens[i + 1];
          const afterStartsRegion = !!afterSection && (afterSection.type === "sec-keyword" || afterSection.type === "macro-sec-keyword") && (() => {
            const block = syntaxProvider.getFoldingBlock(
              afterSection.start.line,
              afterSection.start.column,
              true,
              true,
              true
            );
            return !!block && block.startLine === afterSection.start.line && block.startCol === afterSection.start.column;
          })();
          if (afterSection && !afterStartsRegion && afterSection.start.line - sectionEnd.line > 1) {
            currentStatement.children.push({
              type: "raw-data",
              text: "\n",
              start: sectionEnd,
              end: afterSection.start
            });
          }
          prevStatement = currentStatement;
          currentStatement = void 0;
          continue;
        }
      }
      const callTokens = currentStatement.children;
      const first = callTokens.findIndex((token) => !isComment(token));
      const open = callTokens.findIndex((token, index) => index > first && !isComment(token));
      let callDepth = 0;
      let completeMacroCall = false;
      if (first >= 0 && callTokens[first].type === "macro-ref" && open >= 0 && callTokens[open].type === "sep" && callTokens[open].text === "(" && node.type === "sep" && node.text === ")") {
        for (let j2 = open; j2 < callTokens.length; j2++) {
          const token = callTokens[j2];
          if (token.type !== "sep") continue;
          if (token.text === "(") callDepth++;
          if (token.text === ")") callDepth--;
          if (callDepth === 0) {
            completeMacroCall = j2 === callTokens.length - 1;
            break;
          }
        }
      }
      const nextNonComment = completeMacroCall ? tokens.slice(i + 1).find((token) => !isComment(token)) : void 0;
      const standaloneMacroCall = completeMacroCall && (!nextNonComment || nextNonComment.start.line > node.end.line && nextNonComment.type !== "sep");
      if (node.type === "sep" && node.text === ";" || standaloneMacroCall) {
        if (currentStatement.children[0].type === "cards-data" && /(cards|lines|datalines|parmcards)4/i.test(
          (region && prevStatement?.name) ?? ""
        ) && currentStatement.children.length < 5) {
          continue;
        }
        if (isStartingRegion(
          region ? [...parents, region] : parents,
          currentStatement
        )) {
          if (region) {
            region.children.pop();
            parents.push(region);
            parent = region;
          } else {
            parent.children.pop();
          }
          region = {
            type: "region",
            children: [currentStatement]
          };
          parent.children.push(region);
        } else if (region && !region.block && currentStatement.children.length > 1 && /^(%?end|enddata|endpackage|endthread|endgraph|endlayout)$/i.test(
          currentStatement.children[currentStatement.children.length - 2].text
        )) {
          parent.children.push(region.children.pop());
          region = parents.pop();
        } else if (region && isAtBlockEnd(region.block, node)) {
          if (/^(run|quit|%mend)\b/i.test(currentStatement.children[0].text)) {
            parent.children.push(region.children.pop());
          }
          region = parents.pop();
        }
        if (i < tokens.length - 1) {
          const nextToken = tokens[i + 1];
          if (isComment(nextToken) && nextToken.end.line === node.end.line) {
            currentStatement.children.push(nextToken);
            ++i;
          }
          const lineGap = nextToken.start.line - node.end.line;
          const hasCardsData = currentStatement.children.some(
            (token) => token.type === "cards-data"
          );
          const minGapToPreserve = hasCardsData ? 2 : 1;
          if (lineGap > minGapToPreserve) {
            currentStatement.children.push({
              type: "raw-data",
              text: "\n",
              start: node.end,
              end: nextToken.start
            });
          }
        }
        prevStatement = currentStatement;
        currentStatement = void 0;
      } else if (currentStatement.children.length === 1 && isComment(node)) {
        const afterComment = tokens[i + 1];
        if (afterComment && afterComment.start.line - node.end.line > 1) {
          currentStatement.blankLineAfter = true;
        }
        prevStatement = currentStatement;
        currentStatement = void 0;
        if (isAtBlockEnd(region?.block, node)) {
          region = parents.pop();
        }
      } else if (currentStatement.children.length === 2 && node.type === "sep" && node.text === ":" && currentStatement.children[0].type === "text") {
        currentStatement.children[0] = {
          ...currentStatement.children[0],
          type: "raw-data"
        };
        prevStatement = currentStatement;
        currentStatement = void 0;
      }
    }
    return root;
  };
  var __defProp22 = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp22(target, name, { get: all[name], enumerable: true });
  };
  var public_exports = {};
  __export(public_exports, {
    builders: () => builders,
    printer: () => printer,
    utils: () => utils
  });
  var OPTIONAL_OBJECT = 1;
  var createMethodShim = (methodName, getImplementation) => (flags, object, ...arguments_) => {
    if (flags | OPTIONAL_OBJECT && (object === void 0 || object === null)) {
      return;
    }
    const implementation = getImplementation.call(object) ?? object[methodName];
    return implementation.apply(object, arguments_);
  };
  function stringOrArrayAt(index) {
    return this[index < 0 ? this.length + index : index];
  }
  var at2 = /* @__PURE__ */ createMethodShim("at", function() {
    if (Array.isArray(this) || typeof this === "string") {
      return stringOrArrayAt;
    }
  });
  var method_at_default = at2;
  var noop = () => {
  };
  var noop_default = noop;
  var DOC_TYPE_STRING = (
    /** @type {const} */
    "string"
  );
  var DOC_TYPE_ARRAY = (
    /** @type {const} */
    "array"
  );
  var DOC_TYPE_CURSOR = (
    /** @type {const} */
    "cursor"
  );
  var DOC_TYPE_INDENT = (
    /** @type {const} */
    "indent"
  );
  var DOC_TYPE_ALIGN = (
    /** @type {const} */
    "align"
  );
  var DOC_TYPE_TRIM = (
    /** @type {const} */
    "trim"
  );
  var DOC_TYPE_GROUP = (
    /** @type {const} */
    "group"
  );
  var DOC_TYPE_FILL = (
    /** @type {const} */
    "fill"
  );
  var DOC_TYPE_IF_BREAK = (
    /** @type {const} */
    "if-break"
  );
  var DOC_TYPE_INDENT_IF_BREAK = (
    /** @type {const} */
    "indent-if-break"
  );
  var DOC_TYPE_LINE_SUFFIX = (
    /** @type {const} */
    "line-suffix"
  );
  var DOC_TYPE_LINE_SUFFIX_BOUNDARY = (
    /** @type {const} */
    "line-suffix-boundary"
  );
  var DOC_TYPE_LINE = (
    /** @type {const} */
    "line"
  );
  var DOC_TYPE_LABEL = (
    /** @type {const} */
    "label"
  );
  var DOC_TYPE_BREAK_PARENT = (
    /** @type {const} */
    "break-parent"
  );
  var VALID_OBJECT_DOC_TYPES = /* @__PURE__ */ new Set([
    DOC_TYPE_CURSOR,
    DOC_TYPE_INDENT,
    DOC_TYPE_ALIGN,
    DOC_TYPE_TRIM,
    DOC_TYPE_GROUP,
    DOC_TYPE_FILL,
    DOC_TYPE_IF_BREAK,
    DOC_TYPE_INDENT_IF_BREAK,
    DOC_TYPE_LINE_SUFFIX,
    DOC_TYPE_LINE_SUFFIX_BOUNDARY,
    DOC_TYPE_LINE,
    DOC_TYPE_LABEL,
    DOC_TYPE_BREAK_PARENT
  ]);
  function trimNewlinesEnd(string) {
    let end = string.length;
    while (end > 0 && (string[end - 1] === "\r" || string[end - 1] === "\n")) {
      end--;
    }
    return end < string.length ? string.slice(0, end) : string;
  }
  function getOrInsertComputed(map, key, callback) {
    if (!map.has(key)) {
      const value = callback(key);
      map.set(key, value);
    }
    return map.get(key);
  }
  function getDocType(doc) {
    if (typeof doc === "string") {
      return DOC_TYPE_STRING;
    }
    if (Array.isArray(doc)) {
      return DOC_TYPE_ARRAY;
    }
    if (!doc) {
      return;
    }
    const { type } = doc;
    if (VALID_OBJECT_DOC_TYPES.has(type)) {
      return type;
    }
  }
  var get_doc_type_default = getDocType;
  var disjunctionListFormat = (list) => new Intl.ListFormat("en-US", { type: "disjunction" }).format(list);
  function getDocErrorMessage(doc) {
    const type = doc === null ? "null" : typeof doc;
    if (type !== "string" && type !== "object") {
      return `Unexpected doc '${type}', 
Expected it to be 'string' or 'object'.`;
    }
    if (get_doc_type_default(doc)) {
      throw new Error("doc is valid.");
    }
    const objectType = Object.prototype.toString.call(doc);
    if (objectType !== "[object Object]") {
      return `Unexpected doc '${objectType}'.`;
    }
    const EXPECTED_TYPE_VALUES = disjunctionListFormat(
      [...VALID_OBJECT_DOC_TYPES].map((type2) => `'${type2}'`)
    );
    return `Unexpected doc.type '${doc.type}'.
Expected it to be ${EXPECTED_TYPE_VALUES}.`;
  }
  var InvalidDocError = class extends Error {
    constructor(doc) {
      super(getDocErrorMessage(doc));
      __publicField(this, "name", "InvalidDocError");
      this.doc = doc;
    }
  };
  var invalid_doc_error_default = InvalidDocError;
  var traverseDocOnExitStackMarker = {};
  function traverseDoc(doc, onEnter, onExit, shouldTraverseConditionalGroups) {
    const docsStack = [doc];
    while (docsStack.length > 0) {
      const doc2 = docsStack.pop();
      if (doc2 === traverseDocOnExitStackMarker) {
        onExit(docsStack.pop());
        continue;
      }
      if (onExit) {
        docsStack.push(doc2, traverseDocOnExitStackMarker);
      }
      const docType = get_doc_type_default(doc2);
      if (!docType) {
        throw new invalid_doc_error_default(doc2);
      }
      if (onEnter?.(doc2) === false) {
        continue;
      }
      switch (docType) {
        case DOC_TYPE_ARRAY:
        case DOC_TYPE_FILL: {
          const parts = docType === DOC_TYPE_ARRAY ? doc2 : doc2.parts;
          for (let ic = parts.length, i = ic - 1; i >= 0; --i) {
            docsStack.push(parts[i]);
          }
          break;
        }
        case DOC_TYPE_IF_BREAK:
          docsStack.push(doc2.flatContents, doc2.breakContents);
          break;
        case DOC_TYPE_GROUP:
          if (shouldTraverseConditionalGroups && doc2.expandedStates) {
            for (let ic = doc2.expandedStates.length, i = ic - 1; i >= 0; --i) {
              docsStack.push(doc2.expandedStates[i]);
            }
          } else {
            docsStack.push(doc2.contents);
          }
          break;
        case DOC_TYPE_ALIGN:
        case DOC_TYPE_INDENT:
        case DOC_TYPE_INDENT_IF_BREAK:
        case DOC_TYPE_LABEL:
        case DOC_TYPE_LINE_SUFFIX:
          docsStack.push(doc2.contents);
          break;
        case DOC_TYPE_STRING:
        case DOC_TYPE_CURSOR:
        case DOC_TYPE_TRIM:
        case DOC_TYPE_LINE_SUFFIX_BOUNDARY:
        case DOC_TYPE_LINE:
        case DOC_TYPE_BREAK_PARENT:
          break;
        default:
          throw new invalid_doc_error_default(doc2);
      }
    }
  }
  var traverse_doc_default = traverseDoc;
  function mapDoc(doc, cb) {
    if (typeof doc === "string") {
      return cb(doc);
    }
    const mapped = /* @__PURE__ */ new Map();
    return rec(doc);
    function rec(doc2) {
      return getOrInsertComputed(mapped, doc2, process2);
    }
    function process2(doc2) {
      switch (get_doc_type_default(doc2)) {
        case DOC_TYPE_ARRAY:
          return cb(doc2.map(rec));
        case DOC_TYPE_FILL:
          return cb({
            ...doc2,
            parts: doc2.parts.map(rec)
          });
        case DOC_TYPE_IF_BREAK:
          return cb({
            ...doc2,
            breakContents: rec(doc2.breakContents),
            flatContents: rec(doc2.flatContents)
          });
        case DOC_TYPE_GROUP: {
          let {
            expandedStates,
            contents
          } = doc2;
          if (expandedStates) {
            expandedStates = expandedStates.map(rec);
            contents = expandedStates[0];
          } else {
            contents = rec(contents);
          }
          return cb({
            ...doc2,
            contents,
            expandedStates
          });
        }
        case DOC_TYPE_ALIGN:
        case DOC_TYPE_INDENT:
        case DOC_TYPE_INDENT_IF_BREAK:
        case DOC_TYPE_LABEL:
        case DOC_TYPE_LINE_SUFFIX:
          return cb({
            ...doc2,
            contents: rec(doc2.contents)
          });
        case DOC_TYPE_STRING:
        case DOC_TYPE_CURSOR:
        case DOC_TYPE_TRIM:
        case DOC_TYPE_LINE_SUFFIX_BOUNDARY:
        case DOC_TYPE_LINE:
        case DOC_TYPE_BREAK_PARENT:
          return cb(doc2);
        default:
          throw new invalid_doc_error_default(doc2);
      }
    }
  }
  function findInDoc(doc, fn2, defaultValue) {
    let result = defaultValue;
    let shouldSkipFurtherProcessing = false;
    function findInDocOnEnterFn(doc2) {
      if (shouldSkipFurtherProcessing) {
        return false;
      }
      const maybeResult = fn2(doc2);
      if (maybeResult !== void 0) {
        shouldSkipFurtherProcessing = true;
        result = maybeResult;
      }
    }
    traverse_doc_default(doc, findInDocOnEnterFn);
    return result;
  }
  function willBreakFn(doc) {
    if (doc.type === DOC_TYPE_GROUP && doc.break) {
      return true;
    }
    if (doc.type === DOC_TYPE_LINE && doc.hard) {
      return true;
    }
    if (doc.type === DOC_TYPE_BREAK_PARENT) {
      return true;
    }
  }
  function willBreak(doc) {
    return findInDoc(doc, willBreakFn, false);
  }
  function breakParentGroup(groupStack) {
    if (groupStack.length > 0) {
      const parentGroup = method_at_default(
        /* OPTIONAL_OBJECT: false */
        0,
        groupStack,
        -1
      );
      if (!parentGroup.expandedStates && !parentGroup.break) {
        parentGroup.break = "propagated";
      }
    }
    return null;
  }
  function propagateBreaks(doc) {
    const alreadyVisitedSet = /* @__PURE__ */ new Set();
    const groupStack = [];
    function propagateBreaksOnEnterFn(doc2) {
      if (doc2.type === DOC_TYPE_BREAK_PARENT) {
        breakParentGroup(groupStack);
      }
      if (doc2.type === DOC_TYPE_GROUP) {
        groupStack.push(doc2);
        if (alreadyVisitedSet.has(doc2)) {
          return false;
        }
        alreadyVisitedSet.add(doc2);
      }
    }
    function propagateBreaksOnExitFn(doc2) {
      if (doc2.type === DOC_TYPE_GROUP) {
        const group2 = groupStack.pop();
        if (group2.break) {
          breakParentGroup(groupStack);
        }
      }
    }
    traverse_doc_default(
      doc,
      propagateBreaksOnEnterFn,
      propagateBreaksOnExitFn,
      /* shouldTraverseConditionalGroups */
      true
    );
  }
  function removeLinesFn(doc) {
    if (doc.type === DOC_TYPE_LINE && !doc.hard) {
      return doc.soft ? "" : " ";
    }
    if (doc.type === DOC_TYPE_IF_BREAK) {
      return doc.flatContents;
    }
    return doc;
  }
  function removeLines(doc) {
    return mapDoc(doc, removeLinesFn);
  }
  function stripTrailingHardlineFromParts(parts) {
    parts = [...parts];
    while (parts.length >= 2 && method_at_default(
      /* OPTIONAL_OBJECT: false */
      0,
      parts,
      -2
    ).type === DOC_TYPE_LINE && method_at_default(
      /* OPTIONAL_OBJECT: false */
      0,
      parts,
      -1
    ).type === DOC_TYPE_BREAK_PARENT) {
      parts.length -= 2;
    }
    if (parts.length > 0) {
      const lastPart = stripTrailingHardlineFromDoc(method_at_default(
        /* OPTIONAL_OBJECT: false */
        0,
        parts,
        -1
      ));
      parts[parts.length - 1] = lastPart;
    }
    return parts;
  }
  function stripTrailingHardlineFromDoc(doc) {
    switch (get_doc_type_default(doc)) {
      case DOC_TYPE_INDENT:
      case DOC_TYPE_INDENT_IF_BREAK:
      case DOC_TYPE_GROUP:
      case DOC_TYPE_LINE_SUFFIX:
      case DOC_TYPE_LABEL: {
        const contents = stripTrailingHardlineFromDoc(doc.contents);
        return {
          ...doc,
          contents
        };
      }
      case DOC_TYPE_IF_BREAK:
        return {
          ...doc,
          breakContents: stripTrailingHardlineFromDoc(doc.breakContents),
          flatContents: stripTrailingHardlineFromDoc(doc.flatContents)
        };
      case DOC_TYPE_FILL:
        return {
          ...doc,
          parts: stripTrailingHardlineFromParts(doc.parts)
        };
      case DOC_TYPE_ARRAY:
        return stripTrailingHardlineFromParts(doc);
      case DOC_TYPE_STRING:
        return trimNewlinesEnd(doc);
      case DOC_TYPE_ALIGN:
      case DOC_TYPE_CURSOR:
      case DOC_TYPE_TRIM:
      case DOC_TYPE_LINE_SUFFIX_BOUNDARY:
      case DOC_TYPE_LINE:
      case DOC_TYPE_BREAK_PARENT:
        break;
      default:
        throw new invalid_doc_error_default(doc);
    }
    return doc;
  }
  function stripTrailingHardline(doc) {
    return stripTrailingHardlineFromDoc(cleanDoc(doc));
  }
  function cleanDocFn(doc) {
    switch (get_doc_type_default(doc)) {
      case DOC_TYPE_FILL: {
        const {
          parts
        } = doc;
        if (parts.every((part) => part === "")) {
          return "";
        }
        if (parts.length === 1) {
          return parts[0];
        }
        break;
      }
      case DOC_TYPE_GROUP:
        if (!doc.contents && !doc.id && !doc.break && !doc.expandedStates) {
          return "";
        }
        if (doc.contents.type === DOC_TYPE_GROUP && doc.contents.id === doc.id && doc.contents.break === doc.break && doc.contents.expandedStates === doc.expandedStates) {
          return doc.contents;
        }
        break;
      case DOC_TYPE_ALIGN:
      case DOC_TYPE_INDENT:
      case DOC_TYPE_INDENT_IF_BREAK:
      case DOC_TYPE_LINE_SUFFIX:
        if (!doc.contents) {
          return "";
        }
        break;
      case DOC_TYPE_IF_BREAK:
        if (!doc.flatContents && !doc.breakContents) {
          return "";
        }
        break;
      case DOC_TYPE_ARRAY: {
        const parts = [];
        for (const part of doc) {
          if (!part) {
            continue;
          }
          const [currentPart, ...restParts] = Array.isArray(part) ? part : [part];
          if (typeof currentPart === "string" && typeof method_at_default(
            /* OPTIONAL_OBJECT: false */
            0,
            parts,
            -1
          ) === "string") {
            parts[parts.length - 1] += currentPart;
          } else {
            parts.push(currentPart);
          }
          parts.push(...restParts);
        }
        if (parts.length === 0) {
          return "";
        }
        if (parts.length === 1) {
          return parts[0];
        }
        return parts;
      }
      case DOC_TYPE_STRING:
      case DOC_TYPE_CURSOR:
      case DOC_TYPE_TRIM:
      case DOC_TYPE_LINE_SUFFIX_BOUNDARY:
      case DOC_TYPE_LINE:
      case DOC_TYPE_LABEL:
      case DOC_TYPE_BREAK_PARENT:
        break;
      default:
        throw new invalid_doc_error_default(doc);
    }
    return doc;
  }
  function cleanDoc(doc) {
    return mapDoc(doc, (currentDoc) => cleanDocFn(currentDoc));
  }
  function replaceEndOfLine(doc, replacement = literalline) {
    return mapDoc(doc, (currentDoc) => typeof currentDoc === "string" ? join(replacement, currentDoc.split("\n")) : currentDoc);
  }
  function canBreakFn(doc) {
    if (doc.type === DOC_TYPE_LINE) {
      return true;
    }
  }
  function canBreak(doc) {
    return findInDoc(doc, canBreakFn, false);
  }
  var assertDoc = true ? noop_default : (
    /**
    @param {Doc} doc
    */
    (function(doc) {
      traverse_doc_default(doc, (doc2) => {
        if (typeof doc2 === "string" || checked.has(doc2)) {
          return false;
        }
        checked.add(doc2);
      });
    })
  );
  var assertDocArray = true ? noop_default : (
    /**
    @param {readonly Doc[]} docs
    @param {boolean} [optional = false]
    */
    (function(docs, optional = false) {
      if (optional && !docs) {
        return;
      }
      if (!Array.isArray(docs)) {
        throw new TypeError("Unexpected doc array.");
      }
      for (const doc of docs) {
        assertDoc(doc);
      }
    })
  );
  var assertDocFillParts = true ? noop_default : (
    /**
    @param {readonly Doc[]} parts
    */
    (function(parts) {
      assertDocArray(parts);
      if (parts.length > 1 && isEmptyDoc(method_at_default(
        /* OPTIONAL_OBJECT: false */
        0,
        parts,
        -1
      ))) {
        parts = parts.slice(0, -1);
      }
      for (const [i, doc] of parts.entries()) {
        if (i % 2 === 1 && !isValidSeparator(doc)) {
          const type = get_doc_type_default(doc);
          throw new Error(`Unexpected non-line-break doc at ${i}. Doc type is ${type}.`);
        }
      }
    })
  );
  var assertAlignType = true ? noop_default : function(alignType) {
    if (!(typeof alignType === "number" || typeof alignType === "string" || alignType?.type === "root")) {
      throw new TypeError(`Invalid alignType '${alignType}'.`);
    }
  };
  function indent(contents) {
    assertDoc(contents);
    return { type: DOC_TYPE_INDENT, contents };
  }
  function align(alignType, contents) {
    assertAlignType(alignType);
    assertDoc(contents);
    return { type: DOC_TYPE_ALIGN, contents, n: alignType };
  }
  function dedentToRoot(contents) {
    return align(Number.NEGATIVE_INFINITY, contents);
  }
  function markAsRoot(contents) {
    return align({ type: "root" }, contents);
  }
  function dedent(contents) {
    return align(-1, contents);
  }
  function addAlignmentToDoc(doc, size, tabWidth) {
    assertDoc(doc);
    let aligned = doc;
    if (size > 0) {
      for (let level = 0; level < Math.floor(size / tabWidth); ++level) {
        aligned = indent(aligned);
      }
      aligned = align(size % tabWidth, aligned);
      aligned = align(Number.NEGATIVE_INFINITY, aligned);
    }
    return aligned;
  }
  var breakParent = { type: DOC_TYPE_BREAK_PARENT };
  var cursor = { type: DOC_TYPE_CURSOR };
  function fill(parts) {
    assertDocFillParts(parts);
    return { type: DOC_TYPE_FILL, parts };
  }
  function group(contents, options = {}) {
    assertDoc(contents);
    assertDocArray(
      options.expandedStates,
      /* optional */
      true
    );
    return {
      type: DOC_TYPE_GROUP,
      id: options.id,
      contents,
      break: Boolean(options.shouldBreak),
      expandedStates: options.expandedStates
    };
  }
  function conditionalGroup(states, options) {
    return group(states[0], { ...options, expandedStates: states });
  }
  function ifBreak(breakContents, flatContents = "", options = {}) {
    assertDoc(breakContents);
    if (flatContents !== "") {
      assertDoc(flatContents);
    }
    return {
      type: DOC_TYPE_IF_BREAK,
      breakContents,
      flatContents,
      groupId: options.groupId
    };
  }
  function indentIfBreak(contents, options) {
    assertDoc(contents);
    return {
      type: DOC_TYPE_INDENT_IF_BREAK,
      contents,
      groupId: options.groupId,
      negate: options.negate
    };
  }
  function join(separator, docs) {
    assertDoc(separator);
    assertDocArray(docs);
    const parts = [];
    for (let i = 0; i < docs.length; i++) {
      if (i !== 0) {
        parts.push(separator);
      }
      parts.push(docs[i]);
    }
    return parts;
  }
  function label(label2, contents) {
    assertDoc(contents);
    return label2 ? { type: DOC_TYPE_LABEL, label: label2, contents } : contents;
  }
  var line = { type: DOC_TYPE_LINE };
  var softline = { type: DOC_TYPE_LINE, soft: true };
  var hardlineWithoutBreakParent = { type: DOC_TYPE_LINE, hard: true };
  var hardline = [hardlineWithoutBreakParent, breakParent];
  var literallineWithoutBreakParent = {
    type: DOC_TYPE_LINE,
    hard: true,
    literal: true
  };
  var literalline = [literallineWithoutBreakParent, breakParent];
  function lineSuffix(contents) {
    assertDoc(contents);
    return { type: DOC_TYPE_LINE_SUFFIX, contents };
  }
  var lineSuffixBoundary = { type: DOC_TYPE_LINE_SUFFIX_BOUNDARY };
  var trim = { type: DOC_TYPE_TRIM };
  var stringReplaceAll = String.prototype.replaceAll ?? function(pattern, replacement) {
    if (pattern.global) {
      return this.replace(pattern, replacement);
    }
    return this.split(pattern).join(replacement);
  };
  var replaceAll = /* @__PURE__ */ createMethodShim("replaceAll", function() {
    if (typeof this === "string") {
      return stringReplaceAll;
    }
  });
  var method_replace_all_default = replaceAll;
  var OPTION_CR = "cr";
  var OPTION_CRLF = "crlf";
  var CHARACTER_CR = "\r";
  var CHARACTER_CRLF = "\r\n";
  var CHARACTER_LF = "\n";
  var DEFAULT_EOL = CHARACTER_LF;
  function convertEndOfLineOptionToCharacter(endOfLineOption) {
    return endOfLineOption === OPTION_CR ? CHARACTER_CR : endOfLineOption === OPTION_CRLF ? CHARACTER_CRLF : DEFAULT_EOL;
  }
  var emoji_regex_default = () => {
    return /[#*0-9]\uFE0F?\u20E3|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26AA\u26B0\u26B1\u26BD\u26BE\u26C4\u26C8\u26CF\u26D1\u26E9\u26F0-\u26F5\u26F7\u26F8\u26FA\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2757\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B55\u3030\u303D\u3297\u3299]\uFE0F?|[\u261D\u270C\u270D](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\u270A\u270B](?:\uD83C[\uDFFB-\uDFFF])?|[\u23E9-\u23EC\u23F0\u23F3\u25FD\u2693\u26A1\u26AB\u26C5\u26CE\u26D4\u26EA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2795-\u2797\u27B0\u27BF\u2B50]|\u26D3\uFE0F?(?:\u200D\uD83D\uDCA5)?|\u26F9(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\u2764\uFE0F?(?:\u200D(?:\uD83D\uDD25|\uD83E\uDE79))?|\uD83C(?:[\uDC04\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]\uFE0F?|[\uDF85\uDFC2\uDFC7](?:\uD83C[\uDFFB-\uDFFF])?|[\uDFC4\uDFCA](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDFCB\uDFCC](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF43\uDF45-\uDF4A\uDF4C-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uDDE6\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF]|\uDDE7\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF]|\uDDE8\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF7\uDDFA-\uDDFF]|\uDDE9\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF]|\uDDEA\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA]|\uDDEB\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7]|\uDDEC\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE]|\uDDED\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA]|\uDDEE\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9]|\uDDEF\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5]|\uDDF0\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF]|\uDDF1\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE]|\uDDF2\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF]|\uDDF3\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF]|\uDDF4\uD83C\uDDF2|\uDDF5\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE]|\uDDF6\uD83C\uDDE6|\uDDF7\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC]|\uDDF8\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF]|\uDDF9\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF]|\uDDFA\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF]|\uDDFB\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA]|\uDDFC\uD83C[\uDDEB\uDDF8]|\uDDFD\uD83C\uDDF0|\uDDFE\uD83C[\uDDEA\uDDF9]|\uDDFF\uD83C[\uDDE6\uDDF2\uDDFC]|\uDF44(?:\u200D\uD83D\uDFEB)?|\uDF4B(?:\u200D\uD83D\uDFE9)?|\uDFC3(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDFF3\uFE0F?(?:\u200D(?:\u26A7\uFE0F?|\uD83C\uDF08))?|\uDFF4(?:\u200D\u2620\uFE0F?|\uDB40\uDC67\uDB40\uDC62\uDB40(?:\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDC73\uDB40\uDC63\uDB40\uDC74|\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F)?)|\uD83D(?:[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3]\uFE0F?|[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC](?:\uD83C[\uDFFB-\uDFFF])?|[\uDC6E-\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4\uDEB5](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD74\uDD90](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC25\uDC27-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE41\uDE43\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED8\uDEDC-\uDEDF\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB\uDFF0]|\uDC08(?:\u200D\u2B1B)?|\uDC15(?:\u200D\uD83E\uDDBA)?|\uDC26(?:\u200D(?:\u2B1B|\uD83D\uDD25))?|\uDC3B(?:\u200D\u2744\uFE0F?)?|\uDC41\uFE0F?(?:\u200D\uD83D\uDDE8\uFE0F?)?|\uDC68(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDC68\uDC69]\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?))?|\uDC69(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?[\uDC68\uDC69]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?|\uDC69\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?))|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFC-\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFD-\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFD\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFE]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFE])))?))?|\uDD75(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDE2E(?:\u200D\uD83D\uDCA8)?|\uDE35(?:\u200D\uD83D\uDCAB)?|\uDE36(?:\u200D\uD83C\uDF2B\uFE0F?)?|\uDE42(?:\u200D[\u2194\u2195]\uFE0F?)?|\uDEB6(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?)|\uD83E(?:[\uDD0C\uDD0F\uDD18-\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5\uDEC3-\uDEC5\uDEF0\uDEF2-\uDEF8](?:\uD83C[\uDFFB-\uDFFF])?|[\uDD26\uDD35\uDD37-\uDD39\uDD3C-\uDD3E\uDDB8\uDDB9\uDDCD\uDDCF\uDDD4\uDDD6-\uDDDD](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDDDE\uDDDF](?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD0D\uDD0E\uDD10-\uDD17\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCC\uDDD0\uDDE0-\uDDFF\uDE70-\uDE7C\uDE80-\uDE8A\uDE8E-\uDEC2\uDEC6\uDEC8\uDECD-\uDEDC\uDEDF-\uDEEA\uDEEF]|\uDDCE(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDDD1(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1|\uDDD1\u200D\uD83E\uDDD2(?:\u200D\uD83E\uDDD2)?|\uDDD2(?:\u200D\uD83E\uDDD2)?))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE])))?))?|\uDEF1(?:\uD83C(?:\uDFFB(?:\u200D\uD83E\uDEF2\uD83C[\uDFFC-\uDFFF])?|\uDFFC(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFD-\uDFFF])?|\uDFFD(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])?|\uDFFE(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFD\uDFFF])?|\uDFFF(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFE])?))?)/g;
  };
  var fullwidthMinimalCodePoint = 12288;
  var fullwidthMaximumCodePoint = 65510;
  var fullwidthRanges = [12288, 12288, 65281, 65376, 65504, 65510];
  var wideMinimalCodePoint = 4352;
  var wideMaximumCodePoint = 262141;
  var wideRanges = [4352, 4447, 8986, 8987, 9001, 9002, 9193, 9196, 9200, 9200, 9203, 9203, 9725, 9726, 9748, 9749, 9776, 9783, 9800, 9811, 9855, 9855, 9866, 9871, 9875, 9875, 9889, 9889, 9898, 9899, 9917, 9918, 9924, 9925, 9934, 9934, 9940, 9940, 9962, 9962, 9970, 9971, 9973, 9973, 9978, 9978, 9981, 9981, 9989, 9989, 9994, 9995, 10024, 10024, 10060, 10060, 10062, 10062, 10067, 10069, 10071, 10071, 10133, 10135, 10160, 10160, 10175, 10175, 11035, 11036, 11088, 11088, 11093, 11093, 11904, 11929, 11931, 12019, 12032, 12245, 12272, 12287, 12289, 12350, 12353, 12438, 12441, 12543, 12549, 12591, 12593, 12686, 12688, 12773, 12783, 12830, 12832, 12871, 12880, 42124, 42128, 42182, 43360, 43388, 44032, 55203, 63744, 64255, 65040, 65049, 65072, 65106, 65108, 65126, 65128, 65131, 94176, 94180, 94192, 94198, 94208, 101589, 101631, 101662, 101760, 101874, 110576, 110579, 110581, 110587, 110589, 110590, 110592, 110882, 110898, 110898, 110928, 110930, 110933, 110933, 110948, 110951, 110960, 111355, 119552, 119638, 119648, 119670, 126980, 126980, 127183, 127183, 127374, 127374, 127377, 127386, 127488, 127490, 127504, 127547, 127552, 127560, 127568, 127569, 127584, 127589, 127744, 127776, 127789, 127797, 127799, 127868, 127870, 127891, 127904, 127946, 127951, 127955, 127968, 127984, 127988, 127988, 127992, 128062, 128064, 128064, 128066, 128252, 128255, 128317, 128331, 128334, 128336, 128359, 128378, 128378, 128405, 128406, 128420, 128420, 128507, 128591, 128640, 128709, 128716, 128716, 128720, 128722, 128725, 128728, 128732, 128735, 128747, 128748, 128756, 128764, 128992, 129003, 129008, 129008, 129292, 129338, 129340, 129349, 129351, 129535, 129648, 129660, 129664, 129674, 129678, 129734, 129736, 129736, 129741, 129756, 129759, 129770, 129775, 129784, 131072, 196605, 196608, 262141];
  var isInRange = (ranges, codePoint) => {
    let low = 0;
    let high = Math.floor(ranges.length / 2) - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const i = mid * 2;
      if (codePoint < ranges[i]) {
        high = mid - 1;
      } else if (codePoint > ranges[i + 1]) {
        low = mid + 1;
      } else {
        return true;
      }
    }
    return false;
  };
  var commonCjkCodePoint = 19968;
  var [wideFastPathStart, wideFastPathEnd] = /* @__PURE__ */ findWideFastPathRange(wideRanges);
  function findWideFastPathRange(ranges) {
    let fastPathStart = ranges[0];
    let fastPathEnd = ranges[1];
    for (let index = 0; index < ranges.length; index += 2) {
      const start = ranges[index];
      const end = ranges[index + 1];
      if (commonCjkCodePoint >= start && commonCjkCodePoint <= end) {
        return [start, end];
      }
      if (end - start > fastPathEnd - fastPathStart) {
        fastPathStart = start;
        fastPathEnd = end;
      }
    }
    return [fastPathStart, fastPathEnd];
  }
  var isFullWidth = (codePoint) => {
    if (codePoint < fullwidthMinimalCodePoint || codePoint > fullwidthMaximumCodePoint) {
      return false;
    }
    return isInRange(fullwidthRanges, codePoint);
  };
  var isWide = (codePoint) => {
    if (codePoint >= wideFastPathStart && codePoint <= wideFastPathEnd) {
      return true;
    }
    if (codePoint < wideMinimalCodePoint || codePoint > wideMaximumCodePoint) {
      return false;
    }
    return isInRange(wideRanges, codePoint);
  };
  var narrowEmojiRegexp = /^(?:[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u2600-\u2604\u260E\u2611\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26B0\u26B1\u26C8\u26CF\u26D1\u26D3\u26E9\u26F0\u26F1\u26F4\u26F7\u26F8\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2763\u2764\u27A1\u2934\u2935\u2B05-\u2B07]|\uD83C[\uDD70\uDD71\uDD7E\uDD7F\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF3\uDFF5\uDFF7]|\uD83D[\uDC3F\uDC41\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3])$/;
  var isNarrowEmojiCharacter = (character) => narrowEmojiRegexp.test(character);
  var notAsciiRegex = /[^\x20-\x7F]/;
  function getStringWidth(text) {
    if (!text) {
      return 0;
    }
    if (!notAsciiRegex.test(text)) {
      return text.length;
    }
    let width = 0;
    text = text.replace(emoji_regex_default(), (character) => {
      width += isNarrowEmojiCharacter(character) ? 1 : 2;
      return "";
    });
    for (const character of text) {
      const codePoint = character.codePointAt(0);
      if (codePoint <= 31 || codePoint >= 127 && codePoint <= 159) {
        continue;
      }
      if (codePoint >= 768 && codePoint <= 879) {
        continue;
      }
      if (codePoint >= 65024 && codePoint <= 65039) {
        continue;
      }
      width += isFullWidth(codePoint) || isWide(codePoint) ? 2 : 1;
    }
    return width;
  }
  var get_string_width_default = getStringWidth;
  var INDENT_COMMAND_TYPE_INDENT = 0;
  var INDENT_COMMAND_TYPE_DEDENT = 1;
  var INDENT_COMMAND_TYPE_WIDTH = 2;
  var INDENT_COMMAND_TYPE_STRING = 3;
  var INDENT_COMMAND_INDENT = { type: INDENT_COMMAND_TYPE_INDENT };
  var INDENT_COMMAND_DEDENT = { type: INDENT_COMMAND_TYPE_DEDENT };
  var ROOT_INDENT = {
    value: "",
    length: 0,
    queue: [],
    get root() {
      return ROOT_INDENT;
    }
  };
  function generateIndent(indent22, command, options) {
    const queue2 = command.type === INDENT_COMMAND_TYPE_DEDENT ? indent22.queue.slice(0, -1) : [...indent22.queue, command];
    let value = "";
    let length = 0;
    let lastTabs = 0;
    let lastSpaces = 0;
    for (const command2 of queue2) {
      switch (command2.type) {
        case INDENT_COMMAND_TYPE_INDENT:
          flush();
          if (options.useTabs) {
            addTabs(1);
          } else {
            addSpaces(options.tabWidth);
          }
          break;
        case INDENT_COMMAND_TYPE_STRING: {
          const { string } = command2;
          flush();
          value += string;
          length += string.length;
          break;
        }
        case INDENT_COMMAND_TYPE_WIDTH: {
          const { width } = command2;
          lastTabs += 1;
          lastSpaces += width;
          break;
        }
        default:
          throw new Error(`Unexpected indent comment '${command2.type}'.`);
      }
    }
    flushSpaces();
    return { ...indent22, value, length, queue: queue2 };
    function addTabs(count) {
      value += "	".repeat(count);
      length += options.tabWidth * count;
    }
    function addSpaces(count) {
      value += " ".repeat(count);
      length += count;
    }
    function flush() {
      if (options.useTabs) {
        flushTabs();
      } else {
        flushSpaces();
      }
    }
    function flushTabs() {
      if (lastTabs > 0) {
        addTabs(lastTabs);
      }
      resetLast();
    }
    function flushSpaces() {
      if (lastSpaces > 0) {
        addSpaces(lastSpaces);
      }
      resetLast();
    }
    function resetLast() {
      lastTabs = 0;
      lastSpaces = 0;
    }
  }
  function makeAlign(indent22, indentOptions, options) {
    if (!indentOptions) {
      return indent22;
    }
    if (indentOptions.type === "root") {
      return { ...indent22, root: indent22 };
    }
    if (indentOptions === Number.NEGATIVE_INFINITY) {
      return indent22.root;
    }
    let command;
    if (typeof indentOptions === "number") {
      if (indentOptions < 0) {
        command = INDENT_COMMAND_DEDENT;
      } else {
        command = { type: INDENT_COMMAND_TYPE_WIDTH, width: indentOptions };
      }
    } else {
      command = { type: INDENT_COMMAND_TYPE_STRING, string: indentOptions };
    }
    return generateIndent(indent22, command, options);
  }
  function makeIndent(indent22, options) {
    return generateIndent(indent22, INDENT_COMMAND_INDENT, options);
  }
  function getTrailingIndentionLength(text) {
    let length = 0;
    for (let index = text.length - 1; index >= 0; index--) {
      const character = text[index];
      if (character === " " || character === "	") {
        length++;
      } else {
        break;
      }
    }
    return length;
  }
  function trimIndentation(text) {
    const length = getTrailingIndentionLength(text);
    const trimmed = length === 0 ? text : text.slice(0, text.length - length);
    return { text: trimmed, count: length };
  }
  var _settledTexts;
  var _unsettledText;
  var _settledTextLength;
  var _settledPositions;
  var _unsettledPositions;
  var _printResult_instances;
  var settle_fn;
  var _a3;
  var printResult = (_a3 = class {
    constructor() {
      __privateAdd(this, _printResult_instances);
      __privateAdd(this, _settledTexts, []);
      __privateAdd(this, _unsettledText, "");
      __privateAdd(this, _settledTextLength, 0);
      __privateAdd(this, _settledPositions, []);
      __privateAdd(this, _unsettledPositions, []);
    }
    markPosition() {
      if (__privateGet(this, _settledPositions).length + __privateGet(this, _unsettledPositions).length >= 2) {
        throw new Error("There are too many 'cursor' in doc.");
      }
      __privateGet(this, _unsettledPositions).push(
        __privateGet(this, _settledTextLength) + __privateGet(this, _unsettledText).length
      );
    }
    /**
    @param {string} text
    */
    write(text) {
      __privateSet(this, _unsettledText, __privateGet(this, _unsettledText) + text);
    }
    trim() {
      const { text: trimmed, count } = trimIndentation(__privateGet(this, _unsettledText));
      __privateSet(this, _unsettledText, trimmed);
      __privateMethod(this, _printResult_instances, settle_fn).call(this);
      return count;
    }
    finish() {
      __privateMethod(this, _printResult_instances, settle_fn).call(this);
      return {
        text: __privateGet(this, _settledTexts).join(""),
        positions: __privateGet(this, _settledPositions)
      };
    }
  }, _settledTexts = /* @__PURE__ */ new WeakMap(), _unsettledText = /* @__PURE__ */ new WeakMap(), _settledTextLength = /* @__PURE__ */ new WeakMap(), _settledPositions = /* @__PURE__ */ new WeakMap(), _unsettledPositions = /* @__PURE__ */ new WeakMap(), _printResult_instances = /* @__PURE__ */ new WeakSet(), settle_fn = function() {
    const text = __privateGet(this, _unsettledText);
    if (text !== "") {
      __privateGet(this, _settledTexts).push(text);
      __privateSet(this, _settledTextLength, __privateGet(this, _settledTextLength) + text.length);
      __privateSet(this, _unsettledText, "");
    }
    for (const position of __privateGet(this, _unsettledPositions)) {
      __privateGet(this, _settledPositions).push(Math.min(position, __privateGet(this, _settledTextLength)));
    }
    __privateGet(this, _unsettledPositions).length = 0;
  }, _a3);
  var print_result_default = printResult;
  var MODE_BREAK = /* @__PURE__ */ Symbol("MODE_BREAK");
  var MODE_FLAT = /* @__PURE__ */ Symbol("MODE_FLAT");
  var DOC_FILL_PRINTED_LENGTH = /* @__PURE__ */ Symbol("DOC_FILL_PRINTED_LENGTH");
  function fits(next, restCommands, remainingWidth, hasLineSuffix, groupModeMap, mustBeFlat) {
    if (remainingWidth === Number.POSITIVE_INFINITY) {
      return true;
    }
    let restCommandsIndex = restCommands.length;
    let hasPendingSpace = false;
    const commands = [next];
    let output = "";
    while (remainingWidth >= 0) {
      if (commands.length === 0) {
        if (restCommandsIndex === 0) {
          return true;
        }
        commands.push(restCommands[--restCommandsIndex]);
        continue;
      }
      const {
        mode,
        doc
      } = commands.pop();
      const docType = get_doc_type_default(doc);
      switch (docType) {
        case DOC_TYPE_STRING:
          if (doc) {
            if (hasPendingSpace) {
              output += " ";
              remainingWidth -= 1;
              hasPendingSpace = false;
            }
            output += doc;
            remainingWidth -= get_string_width_default(doc);
          }
          break;
        case DOC_TYPE_ARRAY:
        case DOC_TYPE_FILL: {
          const parts = docType === DOC_TYPE_ARRAY ? doc : doc.parts;
          const end = doc[DOC_FILL_PRINTED_LENGTH] ?? 0;
          for (let index = parts.length - 1; index >= end; index--) {
            commands.push({
              mode,
              doc: parts[index]
            });
          }
          break;
        }
        case DOC_TYPE_INDENT:
        case DOC_TYPE_ALIGN:
        case DOC_TYPE_INDENT_IF_BREAK:
        case DOC_TYPE_LABEL:
          commands.push({
            mode,
            doc: doc.contents
          });
          break;
        case DOC_TYPE_TRIM: {
          const {
            text,
            count
          } = trimIndentation(output);
          output = text;
          remainingWidth += count;
          break;
        }
        case DOC_TYPE_GROUP: {
          if (mustBeFlat && doc.break) {
            return false;
          }
          const groupMode = doc.break ? MODE_BREAK : mode;
          const contents = doc.expandedStates && groupMode === MODE_BREAK ? method_at_default(
            /* OPTIONAL_OBJECT: false */
            0,
            doc.expandedStates,
            -1
          ) : doc.contents;
          commands.push({
            mode: groupMode,
            doc: contents
          });
          break;
        }
        case DOC_TYPE_IF_BREAK: {
          const groupMode = doc.groupId ? groupModeMap[doc.groupId] || MODE_FLAT : mode;
          const contents = groupMode === MODE_BREAK ? doc.breakContents : doc.flatContents;
          if (contents) {
            commands.push({
              mode,
              doc: contents
            });
          }
          break;
        }
        case DOC_TYPE_LINE:
          if (mode === MODE_BREAK || doc.hard) {
            return true;
          }
          if (!doc.soft) {
            hasPendingSpace = true;
          }
          break;
        case DOC_TYPE_LINE_SUFFIX:
          hasLineSuffix = true;
          break;
        case DOC_TYPE_LINE_SUFFIX_BOUNDARY:
          if (hasLineSuffix) {
            return false;
          }
          break;
      }
    }
    return false;
  }
  function printDocToString(doc, options) {
    const groupModeMap = /* @__PURE__ */ Object.create(null);
    const width = options.printWidth;
    const newLine = convertEndOfLineOptionToCharacter(options.endOfLine);
    let position = 0;
    const commands = [{
      indent: ROOT_INDENT,
      mode: MODE_BREAK,
      doc
    }];
    let shouldRemeasure = false;
    const lineSuffix2 = [];
    const result = new print_result_default();
    propagateBreaks(doc);
    while (commands.length > 0) {
      const {
        indent: indent22,
        mode,
        doc: doc2
      } = commands.pop();
      switch (get_doc_type_default(doc2)) {
        case DOC_TYPE_STRING: {
          const formatted2 = newLine !== "\n" ? method_replace_all_default(
            /* OPTIONAL_OBJECT: false */
            0,
            doc2,
            "\n",
            newLine
          ) : doc2;
          if (formatted2) {
            result.write(formatted2);
            if (commands.length > 0) {
              position += get_string_width_default(formatted2);
            }
          }
          break;
        }
        case DOC_TYPE_ARRAY:
          for (let index = doc2.length - 1; index >= 0; index--) {
            commands.push({
              indent: indent22,
              mode,
              doc: doc2[index]
            });
          }
          break;
        case DOC_TYPE_CURSOR:
          result.markPosition();
          break;
        case DOC_TYPE_INDENT:
          commands.push({
            indent: makeIndent(indent22, options),
            mode,
            doc: doc2.contents
          });
          break;
        case DOC_TYPE_ALIGN:
          commands.push({
            indent: makeAlign(indent22, doc2.n, options),
            mode,
            doc: doc2.contents
          });
          break;
        case DOC_TYPE_TRIM:
          position -= result.trim();
          break;
        case DOC_TYPE_GROUP: {
          const command = (function printGroup() {
            if (mode === MODE_FLAT && !shouldRemeasure) {
              return {
                indent: indent22,
                mode: doc2.break ? MODE_BREAK : MODE_FLAT,
                doc: doc2.contents
              };
            }
            shouldRemeasure = false;
            const remainingWidth = width - position;
            const hasLineSuffix = lineSuffix2.length > 0;
            const flatCommand = {
              indent: indent22,
              mode: MODE_FLAT,
              doc: doc2.contents
            };
            if (!doc2.break && fits(flatCommand, commands, remainingWidth, hasLineSuffix, groupModeMap)) {
              return flatCommand;
            }
            if (!doc2.expandedStates) {
              return {
                indent: indent22,
                mode: MODE_BREAK,
                doc: doc2.contents
              };
            }
            if (!doc2.break) {
              for (let index = 1; index < doc2.expandedStates.length - 1; index++) {
                const flatCommand2 = {
                  indent: indent22,
                  mode: MODE_FLAT,
                  doc: doc2.expandedStates[index]
                };
                if (fits(flatCommand2, commands, remainingWidth, hasLineSuffix, groupModeMap)) {
                  return flatCommand2;
                }
              }
            }
            return {
              indent: indent22,
              mode: MODE_BREAK,
              doc: method_at_default(
                /* OPTIONAL_OBJECT: false */
                0,
                doc2.expandedStates,
                -1
              )
            };
          })();
          commands.push(command);
          if (doc2.id) {
            groupModeMap[doc2.id] = command.mode;
          }
          break;
        }
        // Fills each line with as much code as possible before moving to a new
        // line with the same indentation.
        //
        // Expects doc.parts to be an array of alternating content and
        // whitespace. The whitespace contains the linebreaks.
        //
        // For example:
        //   ["I", line, "love", line, "monkeys"]
        // or
        //   [{ type: group, ... }, softline, { type: group, ... }]
        //
        // It uses this parts structure to handle three main layout cases:
        // * The first two content items fit on the same line without
        //   breaking
        //   -> output the first content item and the whitespace "flat".
        // * Only the first content item fits on the line without breaking
        //   -> output the first content item "flat" and the whitespace with
        //   "break".
        // * Neither content item fits on the line without breaking
        //   -> output the first content item and the whitespace with "break".
        case DOC_TYPE_FILL: {
          const remainingWidth = width - position;
          const offset = doc2[DOC_FILL_PRINTED_LENGTH] ?? 0;
          const {
            parts
          } = doc2;
          const length = parts.length - offset;
          if (length === 0) {
            break;
          }
          const content = parts[offset + 0];
          const whitespace = parts[offset + 1];
          const contentFlatCommand = {
            indent: indent22,
            mode: MODE_FLAT,
            doc: content
          };
          const contentBreakCommand = {
            indent: indent22,
            mode: MODE_BREAK,
            doc: content
          };
          const contentFits = fits(contentFlatCommand, [], remainingWidth, lineSuffix2.length > 0, groupModeMap, true);
          if (length === 1) {
            if (contentFits) {
              commands.push(contentFlatCommand);
            } else {
              commands.push(contentBreakCommand);
            }
            break;
          }
          const whitespaceFlatCommand = {
            indent: indent22,
            mode: MODE_FLAT,
            doc: whitespace
          };
          const whitespaceBreakCommand = {
            indent: indent22,
            mode: MODE_BREAK,
            doc: whitespace
          };
          if (length === 2) {
            if (contentFits) {
              commands.push(whitespaceFlatCommand, contentFlatCommand);
            } else {
              commands.push(whitespaceBreakCommand, contentBreakCommand);
            }
            break;
          }
          const secondContent = parts[offset + 2];
          const remainingCommand = {
            indent: indent22,
            mode,
            doc: {
              ...doc2,
              [DOC_FILL_PRINTED_LENGTH]: offset + 2
            }
          };
          const firstAndSecondContentFlatCommand = {
            indent: indent22,
            mode: MODE_FLAT,
            doc: [content, whitespace, secondContent]
          };
          const firstAndSecondContentFits = fits(firstAndSecondContentFlatCommand, [], remainingWidth, lineSuffix2.length > 0, groupModeMap, true);
          commands.push(remainingCommand);
          if (firstAndSecondContentFits) {
            commands.push(whitespaceFlatCommand, contentFlatCommand);
          } else if (contentFits) {
            commands.push(whitespaceBreakCommand, contentFlatCommand);
          } else {
            commands.push(whitespaceBreakCommand, contentBreakCommand);
          }
          break;
        }
        case DOC_TYPE_IF_BREAK:
        case DOC_TYPE_INDENT_IF_BREAK: {
          const groupMode = doc2.groupId ? groupModeMap[doc2.groupId] : mode;
          if (groupMode === MODE_BREAK) {
            const breakContents = doc2.type === DOC_TYPE_IF_BREAK ? doc2.breakContents : doc2.negate ? doc2.contents : indent(doc2.contents);
            if (breakContents) {
              commands.push({
                indent: indent22,
                mode,
                doc: breakContents
              });
            }
          }
          if (groupMode === MODE_FLAT) {
            const flatContents = doc2.type === DOC_TYPE_IF_BREAK ? doc2.flatContents : doc2.negate ? indent(doc2.contents) : doc2.contents;
            if (flatContents) {
              commands.push({
                indent: indent22,
                mode,
                doc: flatContents
              });
            }
          }
          break;
        }
        case DOC_TYPE_LINE_SUFFIX:
          lineSuffix2.push({
            indent: indent22,
            mode,
            doc: doc2.contents
          });
          break;
        case DOC_TYPE_LINE_SUFFIX_BOUNDARY:
          if (lineSuffix2.length > 0) {
            commands.push({
              indent: indent22,
              mode,
              doc: hardlineWithoutBreakParent
            });
          }
          break;
        case DOC_TYPE_LINE:
          switch (mode) {
            case MODE_FLAT:
              if (!doc2.hard) {
                if (!doc2.soft) {
                  result.write(" ");
                  position += 1;
                }
                break;
              }
              shouldRemeasure = true;
            // fallthrough
            case MODE_BREAK:
              if (lineSuffix2.length > 0) {
                commands.push({
                  indent: indent22,
                  mode,
                  doc: doc2
                }, ...lineSuffix2.reverse());
                lineSuffix2.length = 0;
                break;
              }
              if (doc2.literal) {
                result.write(newLine);
                position = 0;
                if (indent22.root) {
                  if (indent22.root.value) {
                    result.write(indent22.root.value);
                  }
                  position = indent22.root.length;
                }
              } else {
                result.trim();
                result.write(newLine + indent22.value);
                position = indent22.length;
              }
              break;
          }
          break;
        case DOC_TYPE_LABEL:
          commands.push({
            indent: indent22,
            mode,
            doc: doc2.contents
          });
          break;
        case DOC_TYPE_BREAK_PARENT:
          break;
        default:
          throw new invalid_doc_error_default(doc2);
      }
      if (commands.length === 0 && lineSuffix2.length > 0) {
        commands.push(...lineSuffix2.reverse());
        lineSuffix2.length = 0;
      }
    }
    const {
      text: formatted,
      positions: cursorPositions
    } = result.finish();
    if (cursorPositions.length !== 2) {
      return {
        formatted
      };
    }
    const [cursorNodeStart, cursorNodeEnd] = cursorPositions;
    return {
      formatted,
      cursorNodeStart,
      cursorNodeText: formatted.slice(cursorNodeStart, cursorNodeEnd)
    };
  }
  var builders = {
    join,
    line,
    softline,
    hardline,
    literalline,
    group,
    conditionalGroup,
    fill,
    lineSuffix,
    lineSuffixBoundary,
    cursor,
    breakParent,
    ifBreak,
    trim,
    indent,
    indentIfBreak,
    align,
    addAlignmentToDoc,
    markAsRoot,
    dedentToRoot,
    dedent,
    hardlineWithoutBreakParent,
    literallineWithoutBreakParent,
    label,
    // TODO: Remove this in v4
    concat: (parts) => parts
  };
  var printer = { printDocToString };
  var utils = {
    willBreak,
    traverseDoc: traverse_doc_default,
    findInDoc,
    mapDoc,
    removeLines,
    stripTrailingHardline,
    replaceEndOfLine,
    canBreak
  };
  var {
    fill: fill2,
    hardline: hardline2,
    indent: indent2,
    join: join2,
    line: line2,
    literalline: literalline2,
    markAsRoot: markAsRoot2,
    softline: softline2
  } = builders;
  var isRootAlign = (doc) => typeof doc === "object" && "type" in doc && doc.type === "align" && typeof doc.n === "object" && doc.n.type === "root";
  var isEqualsSign = (token) => token.type === "sep" && token.text === "=";
  var startsWithLineBreak = (doc) => {
    while (Array.isArray(doc)) {
      doc = doc[0];
    }
    return typeof doc === "object" && "type" in doc && doc.type === "line";
  };
  var print = (path, options, print3) => {
    const { node } = path;
    if ("children" in node && node.children?.length) {
      if (node.type === "statement") {
        return printStatement(node);
      }
      const children = removeRedundantLineBreaks(
        path.map(print3, "children").filter((doc) => doc !== "")
      );
      if (node.type === "region") {
        const region = printRegion(children);
        return !(path.isFirst || path.index === 1 && path.parent?.type === "region") && node.block ? [hardline2, ...region] : region;
      }
      children[children.length - 1] = utils.stripTrailingHardline(
        children[children.length - 1]
      );
      return [...join2(line2, children), literalline2];
    }
    return "text" in node ? node.text : "";
  };
  var printRegion = (children) => {
    const [first, ...others] = children;
    return [
      first,
      indent2(
        others.reduce(
          (pre, doc) => [...pre, isRootAlign(doc) ? literalline2 : line2, doc],
          []
        )
      )
    ];
  };
  var printStatement = (node) => {
    const [first, ...others] = node.children;
    const statement = first.type === "cards-data" || first.type === "raw-data" ? markAsRoot2(node.children.map((token) => token.text)) : fill2(
      // Note: `fill` requires elements with odd indices must be line breaks
      // Refers to https://github.com/prettier/prettier/blob/main/commands.md#fill
      others.reduce(
        (pre, token, index) => {
          const preToken = index === 0 ? first : others[index - 1];
          if (typeof pre[pre.length - 1] === "string" && isSamePosition(token.start, preToken.end)) {
            pre[pre.length - 1] += token.text;
            return pre;
          }
          return [
            ...pre,
            indent2(
              isEqualsSign(token) || isEqualsSign(preToken) && index + 1 < others.length && !isEqualsSign(others[index + 1]) ? (
                // trim whitespace around equals sign
                softline2
              ) : line2
            ),
            token.text
          ];
        },
        [isComment(first) ? printComment(first) : first.text]
      )
    );
    if (!node.leadingComment) {
      return node.blankLineAfter ? [statement, hardline2] : statement;
    }
    const commentGap = first && "start" in first && first.start ? first.start.line - node.leadingComment.end.line : 0;
    return [
      printComment(node.leadingComment),
      hardline2,
      ...commentGap > 1 ? [hardline2] : [],
      statement,
      ...node.blankLineAfter ? [hardline2] : []
    ];
  };
  var printComment = (token) => {
    const text = token.text.split("\n");
    if (text.length === 0 || !token.text.startsWith("/*")) {
      return token.text;
    }
    const indentOf = (line3) => /^[ \t]*/.exec(line3)[0].length;
    const base = token.start ? token.start.column : 0;
    return join2(
      hardline2,
      text.map((line3, index) => {
        if (line3.trim() === "") {
          return "";
        }
        const dedented = (index === 0 ? line3 : line3.slice(Math.min(base, indentOf(line3)))).trimEnd();
        return /^\*+\/$/.test(dedented) ? dedented : dedented.replace(/^\*/, " *");
      })
    );
  };
  var removeRedundantLineBreaks = (docs) => docs.map(
    (doc, index) => index < docs.length - 1 && startsWithLineBreak(docs[index + 1]) ? utils.stripTrailingHardline(doc) : doc
  );
  var getSasPlugin = (model, tokens, syntaxProvider) => ({
    languages: [
      {
        name: "sas",
        parsers: ["sas"],
        extensions: [".sas"],
        vscodeLanguageIds: ["sas"]
      }
    ],
    parsers: {
      sas: {
        parse: getParser(model, tokens, syntaxProvider),
        astFormat: "sas-ast",
        locStart: () => 0,
        locEnd: () => 0
      }
    },
    printers: {
      "sas-ast": {
        print
      }
    }
  });
  var Formatter = class {
    constructor(model, syntaxProvider) {
      this.model = model;
      this.syntaxProvider = syntaxProvider;
      this.tokens = [];
      this.syntaxProvider.setTokenCallback(this.tokens.push.bind(this.tokens));
    }
    async format(options) {
      const formattedText = await Pu("text", {
        parser: "sas",
        plugins: [getSasPlugin(this.model, this.tokens, this.syntaxProvider)],
        ...options
      });
      return [
        {
          range: {
            start: { line: 0, character: 0 },
            end: { line: this.model.getLineCount(), character: 0 }
          },
          newText: formattedText
        }
      ];
    }
  };
  var Model = class {
    constructor(doc) {
      this.doc = doc;
    }
    getLine(line3) {
      return this.doc.getText({
        start: { line: line3, character: 0 },
        end: { line: line3 + 1, character: 0 }
      });
    }
    getLineCount() {
      return this.doc.lineCount;
    }
    getText(range) {
      return this.doc.getText({
        start: {
          line: range.start.line,
          character: range.start.column
        },
        end: {
          line: range.end.line,
          character: range.end.column
        }
      });
    }
    getColumnCount(line3) {
      return this.doc.offsetAt({ line: line3 + 1, character: 0 }) - this.doc.offsetAt({ line: line3, character: 0 });
    }
  };
  var SyntaxProvider = class {
    constructor(model) {
      this.model = model;
      this.parsingQueue = [];
      this.parsingState = 2;
      this.syntaxTable = [];
      this.lastToken = null;
      this.currTokenIndex = 0;
      this.parsedRange = {};
      this.tailUnchangedSyntaxTable = [];
      this.removedSyntaxTable = [];
      this._multilineComments = [];
      this.blockComment = { start: "/*", end: "*/" };
      this.lexer = new LexerEx(model);
    }
    // private functions
    _push(change) {
      this.parsingQueue.push(change);
    }
    _startParse(change) {
      let startLine = 0;
      this.currTokenIndex = 0;
      this.lastToken = null;
      this._multilineComments = [];
      this.parsingState = 1;
      this.parsedRange = this.lexer.start(change);
      startLine = this.parsedRange.endLine + 1;
      this.tailUnchangedSyntaxTable = this.syntaxTable.splice(
        startLine,
        this.syntaxTable.length - startLine
      );
      this.removedSyntaxTable = this.syntaxTable.splice(
        this.parsedRange.startLine,
        startLine - this.parsedRange.startLine
      );
      const syntaxLine = [];
      let i = 0;
      const tmpSyntaxLine = this.removedSyntaxTable[0];
      if (this.parsedRange.startCol > 0 && tmpSyntaxLine) {
        while (tmpSyntaxLine[i] && tmpSyntaxLine[i].start < this.parsedRange.startCol) {
          syntaxLine.push(tmpSyntaxLine[i]);
          i++;
        }
        tmpSyntaxLine.splice(0, i);
        let endCol = this.parsedRange.startCol;
        if (tmpSyntaxLine.length) {
          endCol = tmpSyntaxLine[0].start;
        }
        const tmp = syntaxLine[syntaxLine.length - 1];
        this.lastToken = {
          start: { line: this.parsedRange.startLine, column: tmp.start },
          end: { line: this.parsedRange.startLine, column: endCol },
          type: tmp.style
        };
        this.currTokenIndex = syntaxLine.length;
        this.syntaxTable[this.parsedRange.startLine] = syntaxLine;
      }
      i = 0;
      if (this.parsedRange.startLine === this.parsedRange.endLine && tmpSyntaxLine) {
        while (tmpSyntaxLine[i] && tmpSyntaxLine[i].start < this.parsedRange.endCol) {
          i++;
        }
        tmpSyntaxLine.splice(0, i);
      }
      this._parse(change);
    }
    _endParse(change) {
      this.parsingState = 2;
      this._schedule();
    }
    _schedule() {
      if (this.parsingState === 2 && this.parsingQueue.length) {
        const change = this.parsingQueue.shift();
        this._startParse(change);
      }
    }
    _parse(change) {
      let token = null;
      try {
        for (; ; ) {
          token = this.lexer.getNext();
          this._addItem(token);
          if (!token || this.lexer.end()) {
            this._endParse(change);
            break;
          }
        }
      } catch (e) {
        if (e && e.changedLineCount !== void 0) {
          if (this.lastToken) {
            token = this.lastToken;
          } else if (this.syntaxTable.length === 0) {
            token = {
              type: "text",
              start: { line: 0, column: 0 },
              end: { line: 0, column: 0 }
            };
          } else {
          }
          let tailPart, validPos = 0;
          const len = this.removedSyntaxTable.length, line3 = e.token.start.line;
          if (len >= 1 && line3 === this.parsedRange.endLine + e.changedLineCount) {
            tailPart = this.removedSyntaxTable[len - 1];
            tailPart.forEach(function(item) {
              item.start += e.changedColCount;
              if (item.start < e.token.start.column) {
                validPos++;
              }
            });
            tailPart.splice(0, validPos);
            if (this.syntaxTable[line3]) {
              this._tryToAddBlank(line3, this.syntaxTable[line3], tailPart);
              this.syntaxTable[line3] = this.syntaxTable[line3].concat(tailPart);
            }
          }
          this.syntaxTable = this.syntaxTable.concat(
            this.tailUnchangedSyntaxTable
          );
          this._endParse(change);
        } else {
          throw e;
        }
      }
    }
    _tryToAddBlank(line3, syntax, added) {
      if (syntax.length) {
        const token = syntax[syntax.length - 1];
        if (added.length) {
          const text = this.model.getLine(line3).substring(token.start, added[0].start);
          const matches = /\s+$/.exec(text);
          if (matches) {
            syntax.push({
              start: token.start + text.length - matches[0].length,
              state: null,
              style: "text"
            });
          }
        }
      }
    }
    _addEndMarkForSkippedLines(token, endLine) {
      let line3 = 0, column = 0, syntaxLine = null;
      if (token.end.line !== endLine) {
        line3 = token.end.line;
        column = token.end.column;
        do {
          syntaxLine = this.syntaxTable[line3] = this.syntaxTable[line3] || [];
          if (this.currTokenIndex < syntaxLine.length) {
            syntaxLine.splice(
              this.currTokenIndex,
              syntaxLine.length - this.currTokenIndex
            );
          }
          syntaxLine.push({ start: column, state: 0, style: "text" });
          line3++;
          column = 0;
        } while (line3 < endLine);
        this.currTokenIndex = 0;
        this.lastToken = null;
      }
    }
    _addItem(token) {
      let line3 = 0, syntaxLine = null, addRange = false, addStartTag = true;
      if (this.lastToken) {
        this._addEndMarkForSkippedLines(
          this.lastToken,
          token ? token.start.line : this.model.getLineCount()
        );
      }
      if (!token) {
        return;
      }
      line3 = token.start.line;
      if (this.lastToken === null && token.start.column > 0 || this.lastToken && this.lastToken.end.column !== token.start.column && this.lastToken.end.line === token.start.line) {
        syntaxLine = this.syntaxTable[line3] = this.syntaxTable[line3] || [];
        if (this.currTokenIndex < syntaxLine.length) {
          syntaxLine.splice(
            this.currTokenIndex,
            syntaxLine.length - this.currTokenIndex
          );
        }
        syntaxLine.push({
          start: this.lastToken ? this.lastToken.end.column : 0,
          state: null,
          style: "text"
        });
        this.currTokenIndex++;
      }
      if (token.end.line !== token.start.line) {
        addRange = true;
      }
      do {
        syntaxLine = this.syntaxTable[line3] = this.syntaxTable[line3] || [];
        if (this.currTokenIndex < syntaxLine.length) {
          syntaxLine.splice(
            this.currTokenIndex,
            syntaxLine.length - this.currTokenIndex
          );
        }
        syntaxLine.push({
          start: line3 === token.start.line ? token.start.column : 0,
          state: addStartTag ? addRange ? { line: token.end.line, col: token.end.column } : 1 : null,
          style: token.type
        });
        this.currTokenIndex++;
        addRange = false;
        addStartTag = false;
        if (line3 < token.end.line) {
          syntaxLine.push({
            start: this.model.getLine(line3).length,
            state: 0,
            style: "text"
          });
          this.currTokenIndex = 0;
        }
        line3++;
      } while (line3 <= token.end.line);
      this.lastToken = {
        type: token.type,
        start: { line: token.start.line, column: token.start.column },
        end: { line: token.end.line, column: token.end.column }
      };
      if (this._tokenCallback) {
        this._tokenCallback({
          text: this.model.getText(token),
          type: token.type,
          start: { line: token.start.line, column: token.start.column },
          end: { line: token.end.line, column: token.end.column }
        });
      }
      if ((token.type === "comment" || token.type === "macro-comment") && token.end.line > token.start.line) {
        this._multilineComments.push({
          startLine: token.start.line,
          endLine: token.end.line
        });
      }
    }
    // public functions
    getSyntax(line3) {
      return this.syntaxTable[line3] ? this.syntaxTable[line3] : [];
    }
    getParseRange(change) {
      return this.lexer.getParseRange(change);
    }
    getFoldingBlock(line3, col, strict, ignoreCustomBlock, ignoreGlobalBlock) {
      return this.lexer.getFoldingBlock(
        line3,
        col,
        strict,
        ignoreCustomBlock,
        ignoreGlobalBlock
      );
    }
    add(change) {
      this._push(change);
      this._schedule();
    }
    type(line3, col) {
      const syntax = this.getSyntax(line3), len = syntax.length;
      for (let i = 1; i < len; i++) {
        if (syntax[i].start >= col) {
          if (syntax[i - 1].start <= col) {
            return syntax[i - 1].style;
          } else {
            return "text";
          }
        }
      }
      return syntax && syntax.length === 2 && syntax[0].start === 0 && syntax[1].state === 0 ? syntax[0].style : "text";
    }
    setTokenCallback(cb) {
      this._tokenCallback = cb;
    }
    getSymbolName(block) {
      const line3 = block.startLine;
      const tokens = this.getSyntax(line3);
      const keywordToken = tokens.find((token) => token.start > block.startCol);
      const startCol = keywordToken ? keywordToken.start : block.startCol + block.name.length;
      const lineText = this.model.getLine(line3).substring(startCol).trimStart();
      const match = /^([^\s;()]+)/.exec(lineText);
      if (match && match[1]) {
        const fullName = block.name === "PROC" ? match[1].toUpperCase() : match[1];
        return `${block.name} ${fullName}`;
      }
      return block.name;
    }
    getMultilineComments() {
      return this._multilineComments;
    }
  };
  var KEYWORD_STYLES = /* @__PURE__ */ new Set([
    "keyword",
    "sec-keyword",
    "proc-name",
    "macro-keyword",
    "macro-sec-keyword"
  ]);
  var applyKeywordCase = (text, keywordCase) => {
    const transform = (word) => keywordCase === "upper" ? word.toUpperCase() : word.toLowerCase();
    const model = new Model(documentFrom(text));
    const syntaxProvider = new SyntaxProvider(model);
    const lastLine = model.getLineCount() - 1;
    syntaxProvider.add({
      text: "",
      removedText: "",
      oldRange: { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } },
      newRange: {
        start: { line: 0, column: 0 },
        end: { line: lastLine, column: model.getColumnCount(lastLine) }
      }
    });
    return text.split("\n").map((line3, index) => {
      const tokens = syntaxProvider.getSyntax(index) ?? [];
      let result = line3;
      for (let at3 = tokens.length - 1; at3 >= 0; at3--) {
        const token = tokens[at3];
        if (!KEYWORD_STYLES.has(token.style)) continue;
        const end = at3 === tokens.length - 1 ? line3.length : tokens[at3 + 1].start;
        const word = line3.slice(token.start, end);
        if (!/[A-Za-z]/.test(word)) continue;
        result = result.slice(0, token.start) + transform(word) + result.slice(end);
      }
      return result;
    }).join("\n");
  };
  var defaultDataRoot = "/sas-language/";
  var MissingData = class extends Error {
    constructor(path) {
      super(
        `SAS language data is missing: ${path} has not been fetched. Serve the package's pubsdata and data folders under the data root, or pass \`dataRoot\` to formatText().`
      );
      this.name = "MissingData";
      this.path = path;
    }
  };
  var CORE = [
    "pubsdata/procedures.json",
    "pubsdata/Statements/en/datastep.json",
    "pubsdata/Statements/en/macro.json",
    "pubsdata/Statements/en/global.json",
    "pubsdata/Statements/en/standalone.json",
    "pubsdata/Functions/en/base.json",
    "pubsdata/Functions/en/macro.json"
  ];
  var cache = /* @__PURE__ */ new Map();
  var bundles = /* @__PURE__ */ new Map();
  var defaultMaxFetches = 40;
  var defaultFetchTimeoutMs = 3e4;
  var relative = (url) => url.replace(/^(\.\.[/\\])+/, "");
  var rootFor = (dataRoot2) => {
    const root = dataRoot2?.trim() ? dataRoot2 : defaultDataRoot;
    return root.endsWith("/") ? root : `${root}/`;
  };
  var bounded = async (url, timeoutMs, read) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await read(await fetch(url, { signal: controller.signal }));
    } catch (error) {
      if (error?.name === "AbortError") {
        throw new Error(
          `SAS language data could not be read: ${url} did not answer within ${timeoutMs / 1e3}s. Raise \`fetchTimeoutMs\` if the host is slow, or check that the data root is answering.`
        );
      }
      if (error?.name === "SyntaxError" || error instanceof TypeError) {
        const wrapped = new Error(
          `SAS language data could not be read: ${url}: ${error?.message ?? error}`
        );
        wrapped.cause = error;
        throw wrapped;
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  };
  var fetchInto = async (root, path, timeoutMs) => {
    const url = `${root}${path}`;
    if (cache.has(url)) return;
    const fetched = await bounded(
      url,
      timeoutMs,
      async (response) => response.ok ? { ok: true, data: await response.json() } : { ok: false, status: response.status }
    );
    if (!fetched.ok) {
      throw new Error(
        `SAS language data is missing: ${url} answered ${fetched.status}. Serve the package's pubsdata and data folders under the data root, or pass \`dataRoot\` to formatText().`
      );
    }
    const { data } = fetched;
    cache.set(url, data);
  };
  var loaderInstalled = false;
  var dataRoot = defaultDataRoot;
  var installLoader = () => {
    if (loaderInstalled) return;
    ResLoader.get = (url, callback) => {
      const path = relative(url);
      const key = `${dataRoot}${path}`;
      if (!cache.has(key)) throw new MissingData(path);
      callback(cache.get(key));
    };
    ResLoader.getBundle = (locale2) => bundles.get(locale2) ?? "";
    loaderInstalled = true;
  };
  var print2 = async (text, options) => {
    const model = new Model(documentFrom(text));
    const syntaxProvider = new SyntaxProvider(model);
    const formatter = new Formatter(model, syntaxProvider);
    const lastLine = model.getLineCount() - 1;
    syntaxProvider.add({
      text: "",
      removedText: "",
      oldRange: { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } },
      newRange: {
        start: { line: 0, column: 0 },
        end: { line: lastLine, column: model.getColumnCount(lastLine) }
      }
    });
    const edits = await formatter.format({
      tabWidth: options.tabWidth,
      useTabs: options.useTabs
    });
    const formatted = applyEdits(text, edits);
    return options.keywordCase === "preserve" ? formatted : applyKeywordCase(formatted, options.keywordCase);
  };
  var queue = Promise.resolve();
  var formatText2 = (text, options = {}) => {
    const run = queue.then(() => formatNow(text, options));
    queue = run.then(
      () => void 0,
      () => void 0
    );
    return run;
  };
  var formatNow = async (text, options) => {
    const root = rootFor(options.dataRoot);
    const previous = dataRoot;
    const timeoutMs = options.fetchTimeoutMs ?? defaultFetchTimeoutMs;
    const budget = options.maxFetches ?? defaultMaxFetches;
    installLoader();
    dataRoot = root;
    try {
      await Promise.all(CORE.map((path) => fetchInto(root, path, timeoutMs)));
      const layout = {
        tabWidth: options.tabWidth ?? 2,
        useTabs: options.useTabs ?? false,
        keywordCase: options.keywordCase ?? "preserve"
      };
      for (let attempt = 0; attempt <= budget; attempt++) {
        try {
          return await print2(text, layout);
        } catch (error) {
          if (!(error instanceof MissingData)) throw error;
          if (attempt === budget) break;
          await fetchInto(root, error.path, timeoutMs);
        }
      }
    } finally {
      if (dataRoot === root) dataRoot = previous;
    }
    throw new Error(
      `SAS language data is missing: formatting asked for more than ${budget} file(s). Check that the data root serves the whole pubsdata and data tree.`
    );
  };

  // ../../../../../tmp/sasjs-lint-2sYn5U/entry.js
  globalThis.SASjsCode = { createCodeService, LintConfig: import_lint2.LintConfig, formatText: formatText2, dataPath: "sas-language/0.7.3/" };
})();
