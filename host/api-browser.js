/* @sasjs/api 0.28.0 - the SASjs Server API, for a service worker. https://github.com/sasjs/api */
"use strict";
var SASjsApi = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/index.ts
  var index_exports = {};
  __export(index_exports, {
    ADMIN_CORPUS: () => ADMIN_CORPUS,
    ADMIN_SIGNED_IN: () => ADMIN_SIGNED_IN,
    ALWAYS_VISIBLE_ROUTES: () => ALWAYS_VISIBLE_ROUTES,
    APP_MANIFEST: () => APP_MANIFEST,
    APP_STREAM_INDEX: () => APP_STREAM_INDEX,
    AUTH_CONFIG_CORPUS: () => AUTH_CONFIG_CORPUS,
    ApiError: () => ApiError,
    BROWSER_INFO: () => BROWSER_INFO,
    BUNDLE_NAME: () => BUNDLE_NAME,
    CODE_CORPUS: () => CODE_CORPUS,
    CODE_DEBUG: () => CODE_DEBUG,
    DEFAULT_APP_PATH: () => DEFAULT_APP_PATH,
    DEFAULT_GRANTABLE_ROUTES: () => DEFAULT_GRANTABLE_ROUTES,
    DEFAULT_IDENTITY: () => DEFAULT_IDENTITY,
    DEFAULT_LOG_LINES: () => DEFAULT_LOG_LINES,
    DEFAULT_SESSIONS: () => DEFAULT_SESSIONS,
    DEPLOY_CORPUS: () => DEPLOY_CORPUS,
    DEPLOY_LIMITS: () => DEPLOY_LIMITS,
    DEPLOY_PAYLOAD_BYTES: () => DEPLOY_PAYLOAD_BYTES,
    DEPLOY_SUCCESS: () => DEPLOY_SUCCESS,
    DIRECTORY_CORPUS: () => DIRECTORY_CORPUS,
    DOCUMENTED_RUN_TIMES: () => DOCUMENTED_RUN_TIMES,
    DRIVE_CORPUS: () => DRIVE_CORPUS,
    HANDLED_ROUTES: () => HANDLED_ROUTES,
    HOME_CORPUS: () => HOME_CORPUS,
    IDENTITY_CORPUS: () => IDENTITY_CORPUS,
    IDENTITY_FORMAT: () => IDENTITY_FORMAT,
    INFO_CORPUS: () => INFO_CORPUS,
    MAX_LOG_LINES: () => MAX_LOG_LINES,
    MemoryAppStreamStore: () => MemoryAppStreamStore,
    MemoryDriveStore: () => MemoryDriveStore,
    MemoryIdentityStore: () => MemoryIdentityStore,
    MemorySessionHost: () => MemorySessionHost,
    MemorySessionRunner: () => MemorySessionRunner,
    NO_SUCH_APP: () => NO_SUCH_APP,
    NO_WEB_BUILD: () => NO_WEB_BUILD,
    OVERLAY: () => OVERLAY,
    PROVIDER_MANAGED: () => PROVIDER_MANAGED,
    RECORD_CORPUS: () => RECORD_CORPUS,
    ROUTES: () => ROUTES,
    RUNTIME_CORPUS: () => RUNTIME_CORPUS,
    SESSION_CORPUS: () => SESSION_CORPUS,
    STATIC_AUTHORIZED_ROUTES: () => STATIC_AUTHORIZED_ROUTES,
    TAG_CAPABILITIES: () => TAG_CAPABILITIES,
    TOP_LEVEL_ROUTES: () => TOP_LEVEL_ROUTES,
    appSummary: () => appSummary,
    basename: () => basename,
    cacheControlFor: () => cacheControlFor,
    checkDeployTree: () => checkDeployTree,
    checkLogFileName: () => checkLogFileName,
    checkPublishRequest: () => checkPublishRequest,
    contentTypeFor: () => contentTypeFor,
    createAdminService: () => createAdminService,
    createAppStreamService: () => createAppStreamService,
    createAppStreamWebService: () => createAppStreamWebService,
    createAuthConfigService: () => createAuthConfigService,
    createDirectoryService: () => createDirectoryService,
    createDriveAppStreamStore: () => createDriveAppStreamStore,
    createDriveService: () => createDriveService,
    createHomeService: () => createHomeService,
    createIdentityService: () => createIdentityService,
    createInfoService: () => createInfoService,
    createRecordService: () => createRecordService,
    createRuntimeService: () => createRuntimeService,
    createSessionService: () => createSessionService,
    decodeBase64: () => decodeBase64,
    defaultAppName: () => defaultAppName,
    deployTree: () => deployTree,
    dirname: () => dirname,
    dispatch: () => dispatch,
    escapeHtml: () => escapeHtml,
    findRoute: () => findRoute,
    hasBlockedExtension: () => hasBlockedExtension,
    isApiError: () => isApiError,
    isAppId: () => isAppId,
    isDeployTree: () => isDeployTree,
    isRoot: () => isRoot,
    isRouteGranted: () => isRouteGranted,
    logLines: () => logLines,
    measureDeployTree: () => measureDeployTree,
    newAppId: () => newAppId,
    normaliseAppLoc: () => normaliseAppLoc,
    normaliseAuthConfig: () => normaliseAuthConfig,
    normaliseDiagnostics: () => normaliseDiagnostics,
    normaliseDrivePath: () => normaliseDrivePath,
    normaliseInfo: () => normaliseInfo,
    normaliseLogFiles: () => normaliseLogFiles,
    parseAppManifest: () => parseAppManifest,
    parseIdentity: () => parseIdentity,
    publishRequestFor: () => publishRequestFor,
    routeById: () => routeById,
    runCase: () => runCase,
    sanitiseDisplayName: () => sanitiseDisplayName,
    servicesFor: () => servicesFor,
    splitAppBundle: () => splitAppBundle,
    topLevelRouteFor: () => topLevelRouteFor,
    withBundleVersion: () => withBundleVersion
  });

  // src/types.ts
  var ApiError = class extends Error {
    constructor(status, message, body) {
      super(message);
      this.status = status;
      this.body = body;
      /** Told apart by marker rather than `instanceof` - see `isApiError`. */
      this.apiError = true;
      this.name = "ApiError";
    }
  };
  var isApiError = (value) => !!value && value.apiError === true;

  // src/drive/paths.ts
  var BLOCKED_EXTENSION = /\.(exe|sh|htaccess)$/i;
  var hasBlockedExtension = (path) => BLOCKED_EXTENSION.test(path);
  var normaliseDrivePath = (input) => {
    const given2 = typeof input === "string" ? input : "";
    const segments = [];
    for (const segment of given2.replace(/\\/g, "/").split("/")) {
      if (!segment || segment === ".") continue;
      if (segment === "..") {
        if (!segments.length) return null;
        segments.pop();
        continue;
      }
      segments.push(segment);
    }
    return "/" + segments.join("/");
  };
  var dirname = (path) => {
    const cut = path.lastIndexOf("/");
    return cut <= 0 ? "/" : path.slice(0, cut);
  };
  var basename = (path) => path.slice(path.lastIndexOf("/") + 1);
  var isRoot = (path) => path === "/";
  var checkFilePath = (input) => {
    const path = normaliseDrivePath(input);
    if (path === null) return { reason: "outside" };
    if (hasBlockedExtension(path)) return { reason: "extension" };
    return { path };
  };

  // src/drive/deploy.ts
  var DEPLOY_LIMITS = {
    entries: 1e4,
    totalBytes: 100 * 1024 * 1024,
    fileBytes: 20 * 1024 * 1024
  };
  var DEPLOY_PAYLOAD_BYTES = 140 * 1024 * 1024;
  var DEPLOY_SUCCESS = {
    status: "success",
    message: "Files deployed successfully to @sasjs/server."
  };
  var MAX_DEPTH = 32;
  var BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var base64Body = (value) => value.replace(/[^A-Za-z0-9+/]/g, "");
  var base64Length = (value) => Math.floor(base64Body(value).length * 3 / 4);
  var decodeBase64 = (value) => {
    const body = base64Body(value);
    const bytes3 = new Uint8Array(Math.floor(body.length * 3 / 4));
    let buffer = 0;
    let bits = 0;
    let at = 0;
    for (const char of body) {
      buffer = buffer << 6 | BASE64_ALPHABET.indexOf(char);
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        bytes3[at++] = buffer >> bits & 255;
      }
    }
    return bytes3.subarray(0, at);
  };
  var utf8Length = (value) => {
    let bytes3 = 0;
    for (let at = 0; at < value.length; at++) {
      const code = value.charCodeAt(at);
      if (code < 128) bytes3 += 1;
      else if (code < 2048) bytes3 += 2;
      else if (code >= 55296 && code <= 56319 && at + 1 < value.length) {
        bytes3 += 4;
        at++;
      } else bytes3 += 3;
    }
    return bytes3;
  };
  var memberName = (member) => member.type === "service" ? `${member.name}.sas` : member.name;
  var memberBytes = (member) => member.type === "file" && member.encoding === "base64" ? base64Length(member.code) : utf8Length(member.code);
  var MEGABYTE = 1024 * 1024;
  var describeSize = (bytes3) => bytes3 < MEGABYTE ? `${bytes3} bytes` : `${Math.ceil(bytes3 / MEGABYTE * 10) / 10} MB`;
  var describeLimit = (bytes3) => bytes3 < MEGABYTE ? `${bytes3} bytes` : `${Math.round(bytes3 / MEGABYTE * 10) / 10} MB`;
  var emptyWalk = () => ({
    entries: 0,
    totalBytes: 0,
    largest: { path: "", bytes: 0 }
  });
  var isSafeSegment = (name) => name !== "" && name !== "." && name !== ".." && !/[/\\]/.test(name) && // a Windows drive or a NUL byte is never a segment either
  !/[\0]/.test(name);
  var walk = (members, parentPath, acc, depth = 1) => {
    for (const member of members) {
      const name = memberName(member);
      const memberPath = parentPath ? `${parentPath}/${name}` : name;
      if (!isSafeSegment(name) && !acc.nameRefusal)
        acc.nameRefusal = {
          code: 400,
          status: "failure",
          message: `Invalid member name: '${name}'. Member names must be single path segments (no '/', '\\', '..').`
        };
      acc.entries++;
      if (member.type === "folder") {
        if (depth + 1 > MAX_DEPTH) {
          if (!acc.tooDeep) acc.tooDeep = depth + 1;
          continue;
        }
        walk(member.members, memberPath, acc, depth + 1);
        continue;
      }
      const bytes3 = memberBytes(member);
      acc.totalBytes += bytes3;
      if (bytes3 > acc.largest.bytes) acc.largest = { path: memberPath, bytes: bytes3 };
    }
  };
  var measureDeployTree = (members) => {
    const acc = emptyWalk();
    walk(members, "", acc);
    return {
      entries: acc.entries,
      totalBytes: acc.totalBytes,
      largest: acc.largest
    };
  };
  var checkDeployTree = (members, limits = DEPLOY_LIMITS) => {
    const measured = emptyWalk();
    walk(members, "", measured);
    if (measured.nameRefusal) return measured.nameRefusal;
    if (measured.tooDeep)
      return {
        code: 413,
        status: "failure",
        message: `The file tree is nested too deeply: ${measured.tooDeep} levels (maximum ${MAX_DEPTH}).`
      };
    if (measured.entries > limits.entries)
      return {
        code: 413,
        status: "failure",
        message: `The file tree exceeds the deploy limit: ${measured.entries} entries (maximum ${limits.entries}).`
      };
    if (measured.totalBytes > limits.totalBytes)
      return {
        code: 413,
        status: "failure",
        message: `The file tree exceeds the deploy limit: ${describeSize(measured.totalBytes)} (maximum ${describeLimit(limits.totalBytes)}).`
      };
    if (measured.largest.bytes > limits.fileBytes)
      return {
        code: 413,
        status: "failure",
        message: `A file in the tree exceeds the deploy limit: ${measured.largest.path} is ${describeSize(measured.largest.bytes)} (maximum ${describeLimit(limits.fileBytes)} per file).`
      };
    return null;
  };
  var isDeployTree = (value) => {
    if (!value || typeof value !== "object") return false;
    const members = value.members;
    return Array.isArray(members) && members.every(isDeployMember);
  };
  var isDeployMember = (value) => {
    if (!value || typeof value !== "object") return false;
    const member = value;
    if (typeof member.name !== "string") return false;
    if (member.type === "folder")
      return Array.isArray(member.members) && member.members.every(isDeployMember);
    if (member.type === "service") return typeof member.code === "string";
    if (member.type === "file")
      return typeof member.code === "string" && (member.encoding === void 0 || member.encoding === "utf8" || member.encoding === "base64");
    return false;
  };
  var deployTree = async (store, appLoc, tree, options = {}) => {
    const limits = options.limits ?? DEPLOY_LIMITS;
    if (!isDeployTree(tree))
      throw new ApiError(400, "Provided not supported data format.", {
        status: "failure",
        message: "Provided not supported data format."
      });
    const root = normaliseDrivePath(appLoc);
    if (root === null)
      throw new ApiError(400, "appLoc cannot be outside drive.", {
        status: "failure",
        message: "appLoc cannot be outside drive."
      });
    const refusal = checkDeployTree(tree.members, limits);
    if (refusal)
      throw new ApiError(refusal.code, refusal.message, {
        status: refusal.status,
        message: refusal.message
      });
    try {
      if (options.replace && await store.exists(root)) await store.remove(root);
      await store.mkdirp(root);
      await writeMembers(store, tree.members, root);
    } catch {
      throw new ApiError(500, "Deployment failed!", {
        status: "failure",
        message: "Deployment failed!"
      });
    }
  };
  var writeMembers = async (store, members, parentPath) => {
    for (const member of members) {
      const path = `${parentPath}/${memberName(member)}`;
      if (member.type === "folder") {
        await store.mkdirp(path);
        await writeMembers(store, member.members, path);
        continue;
      }
      await store.write(
        path,
        member.type === "file" && member.encoding === "base64" ? decodeBase64(member.code) : member.code
      );
    }
  };

  // src/drive/service.ts
  var filePath = (input, outside) => {
    const checked = checkFilePath(input);
    if ("reason" in checked) {
      throw checked.reason === "extension" ? new ApiError(400, "Invalid file extension") : new ApiError(400, outside);
    }
    if (isRoot(checked.path)) throw new ApiError(400, outside);
    return checked.path;
  };
  var folderPath = (input, outside) => {
    const path = normaliseDrivePath(input);
    if (path === null) throw new ApiError(400, outside);
    return path;
  };
  var createDriveService = (store) => {
    const treeOf = async (path) => {
      const listing = await store.list(path);
      const children = [];
      for (const folder of listing.folders) {
        children.push(
          await treeOf(path === "/" ? "/" + folder : path + "/" + folder)
        );
      }
      for (const file of listing.files) {
        const relativePath = path === "/" ? "/" + file : path + "/" + file;
        const stat = await store.stat(relativePath);
        children.push({
          name: file,
          relativePath,
          isFolder: false,
          ...stat.modified ? { modified: stat.modified } : {},
          ...stat.created ? { created: stat.created } : {},
          children: []
        });
      }
      return {
        name: path === "/" ? "files" : basename(path),
        relativePath: path,
        isFolder: true,
        children
      };
    };
    return {
      async list(given2) {
        const path = folderPath(
          given2 === void 0 ? "" : given2,
          "Can't get folder outside drive."
        );
        if (!await store.exists(path))
          throw new ApiError(404, `Folder doesn't exist.`);
        const stat = await store.stat(path);
        if (!stat.directory) throw new ApiError(400, "Not a Folder.");
        const listing = await store.list(path);
        return {
          files: [...listing.files].sort(),
          folders: [...listing.folders].sort()
        };
      },
      async read(given2) {
        const path = filePath(given2, "Can't get file outside drive.");
        if (!await store.exists(path))
          throw new ApiError(404, `File doesn't exist.`);
        const contents = await store.read(path);
        return { contents, binary: typeof contents !== "string" };
      },
      async save(given2, contents) {
        const path = filePath(given2, "Can't put file outside drive.");
        if (await store.exists(path))
          throw new ApiError(409, "File already exists.");
        await store.mkdirp(dirname(path));
        await store.write(path, contents);
        return { status: "success" };
      },
      async update(given2, contents) {
        const path = filePath(given2, "Can't modify file outside drive.");
        if (!await store.exists(path))
          throw new ApiError(404, `File doesn't exist.`);
        await store.write(path, contents);
        return { status: "success" };
      },
      async remove(given2) {
        const path = filePath(given2, "Can't delete file outside drive.");
        if (!await store.exists(path))
          throw new ApiError(404, `File doesn't exist.`);
        await store.remove(path);
        return { status: "success" };
      },
      async mkdir(given2) {
        const path = folderPath(given2, "Can't put folder outside drive.");
        if (isRoot(path))
          throw new ApiError(400, "Can't put folder outside drive.");
        if (await store.exists(path))
          throw new ApiError(409, "Folder already exists.");
        await store.mkdirp(path);
        return { status: "success" };
      },
      async rmdir(given2) {
        const path = folderPath(given2, "Can't delete folder outside drive.");
        if (isRoot(path))
          throw new ApiError(400, "Can't delete folder outside drive.");
        if (!await store.exists(path) || !(await store.stat(path)).directory)
          throw new ApiError(404, `Folder doesn't exist.`);
        await store.remove(path);
        return { status: "success" };
      },
      async rename(oldPath, newPath) {
        const from = folderPath(oldPath, "Old path can't be outside of drive.");
        const to = folderPath(newPath, "New path can't be outside of drive.");
        if (isRoot(from) || isRoot(to))
          throw new ApiError(400, "New path can't be outside of drive.");
        if (await store.exists(from)) {
          const stat = await store.stat(from);
          if (stat.directory && (to === from || to.startsWith(from + "/")))
            throw new ApiError(
              400,
              "New path can't be inside the folder being moved."
            );
          if (await store.exists(to))
            throw new ApiError(
              409,
              stat.directory ? "Folder with new name already exists." : "File with new name already exists."
            );
          if (!stat.directory && hasBlockedExtension(to))
            throw new ApiError(400, "Invalid file extension");
          await store.move(from, to);
          return { status: "success" };
        }
        throw new ApiError(404, "No file/folder found for provided path.");
      },
      async tree(given2) {
        const path = folderPath(
          given2 === void 0 ? "" : given2,
          "Can't get folder outside drive."
        );
        if (!await store.exists(path))
          throw new ApiError(404, `Folder doesn't exist.`);
        const stat = await store.stat(path);
        if (!stat.directory) throw new ApiError(400, "Not a Folder.");
        return { status: "success", tree: await treeOf(path) };
      },
      async deploy(appLoc, tree, options) {
        await deployTree(store, appLoc, tree, options);
        return { status: "success" };
      }
    };
  };

  // src/drive/memory-store.ts
  var MemoryDriveStore = class {
    constructor(seed = {}) {
      this.files = /* @__PURE__ */ new Map();
      this.folders = /* @__PURE__ */ new Set(["/"]);
      /**
       * When each entry was first written and last written, ISO strings.
       *
       * A Map has no clock of its own, so the store keeps one: a seeded drive is
       * created when the store is, and a write moves `modified` while `created`
       * stays. A host with real file metadata reports its own instead.
       */
      this.times = /* @__PURE__ */ new Map();
      for (const [path, contents] of Object.entries(seed)) {
        this.putSync(path, contents);
      }
    }
    /** Everything on the drive, for a snapshot or an assertion. */
    dump() {
      const out = {};
      for (const [path, contents] of this.files) out[path] = contents;
      return out;
    }
    putSync(path, contents) {
      this.mkdirpSync(dirname(path));
      this.files.set(
        path,
        typeof contents === "string" ? contents : contents.slice()
      );
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const existing = this.times.get(path);
      this.times.set(path, {
        created: existing?.created ?? now,
        modified: now
      });
    }
    mkdirpSync(path) {
      const parts = path.split("/").filter(Boolean);
      let acc = "";
      for (const part of parts) {
        acc += "/" + part;
        this.folders.add(acc);
      }
    }
    children(path) {
      const prefix = path === "/" ? "/" : path + "/";
      const files = [];
      const folders = [];
      for (const candidate of this.files.keys()) {
        if (!candidate.startsWith(prefix)) continue;
        const rest = candidate.slice(prefix.length);
        if (rest && !rest.includes("/")) files.push(rest);
      }
      for (const candidate of this.folders) {
        if (!candidate.startsWith(prefix)) continue;
        const rest = candidate.slice(prefix.length);
        if (rest && !rest.includes("/")) folders.push(rest);
      }
      return { files: files.sort(), folders: folders.sort() };
    }
    async read(path) {
      const contents = this.files.get(path);
      if (contents === void 0) throw new ApiError(404, `File doesn't exist.`);
      return contents;
    }
    async write(path, contents) {
      this.putSync(path, contents);
    }
    async exists(path) {
      return this.files.has(path) || this.folders.has(path);
    }
    async stat(path) {
      if (this.folders.has(path) && !this.files.has(path))
        return { directory: true, size: 0 };
      const contents = this.files.get(path);
      if (contents === void 0) throw new ApiError(404, `File doesn't exist.`);
      const times = this.times.get(path);
      return {
        directory: false,
        size: typeof contents === "string" ? contents.length : contents.length,
        ...times ? { modified: times.modified, created: times.created } : {}
      };
    }
    async list(path) {
      return this.children(path);
    }
    async mkdirp(path) {
      this.mkdirpSync(path);
    }
    async remove(path) {
      if (this.files.delete(path)) return;
      const prefix = path === "/" ? "/" : path + "/";
      for (const candidate of [...this.files.keys()]) {
        if (candidate.startsWith(prefix)) this.files.delete(candidate);
      }
      for (const candidate of [...this.folders]) {
        if (candidate === path || candidate.startsWith(prefix))
          this.folders.delete(candidate);
      }
    }
    async move(from, to) {
      const contents = this.files.get(from);
      if (contents !== void 0) {
        const copy = typeof contents === "string" ? contents : contents.slice();
        this.files.delete(from);
        this.mkdirpSync(dirname(to));
        this.files.set(to, copy);
        return;
      }
      const prefix = from + "/";
      const moves = [];
      for (const [candidate, value] of this.files) {
        if (candidate.startsWith(prefix))
          moves.push([candidate, to + candidate.slice(from.length), value]);
      }
      for (const [source] of moves) this.files.delete(source);
      for (const [, destination, value] of moves) {
        this.mkdirpSync(dirname(destination));
        this.files.set(destination, value);
      }
      for (const candidate of [...this.folders]) {
        if (candidate === from || candidate.startsWith(prefix)) {
          this.folders.delete(candidate);
          this.folders.add(to + candidate.slice(from.length));
        }
      }
      this.mkdirpSync(to);
    }
  };

  // src/routes/generated.ts
  var GENERATED_ROUTES = [
    {
      id: "GET /",
      method: "GET",
      path: "/",
      tag: "Web",
      summary: "Serve the web interface",
      params: [],
      requestBodies: [],
      responses: [
        {
          status: 200,
          description: "Ok"
        }
      ]
    },
    {
      id: "GET /SASjsApi/admin/diagnostics",
      method: "GET",
      path: "/SASjsApi/admin/diagnostics",
      tag: "Admin",
      summary: "Diagnostics: version, uptime, memory, disk usage",
      params: [],
      requestBodies: [],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 401,
          description: "Unauthorized, or an administrator account is required. The mount point in routes/api/index.ts applies both checks before this handler runs."
        },
        {
          status: 500,
          description: "The diagnostics could not be read"
        }
      ]
    },
    {
      id: "GET /SASjsApi/admin/logs",
      method: "GET",
      path: "/SASjsApi/admin/logs",
      tag: "Admin",
      summary: "List the server's log files",
      params: [],
      requestBodies: [],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 401,
          description: "Unauthorized, or an administrator account is required. The mount point in routes/api/index.ts applies both checks before this handler runs."
        },
        {
          status: 500,
          description: "The log folder could not be listed"
        }
      ]
    },
    {
      id: "GET /SASjsApi/admin/logs/{fileName}",
      method: "GET",
      path: "/SASjsApi/admin/logs/{fileName}",
      tag: "Admin",
      summary: "Read the tail of a log file",
      params: [
        {
          name: "fileName",
          in: "path",
          required: true,
          type: "string"
        },
        {
          name: "lines",
          in: "query",
          required: false,
          type: "number"
        }
      ],
      requestBodies: [],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 400,
          description: "Invalid log file name."
        },
        {
          status: 401,
          description: "Unauthorized, or an administrator account is required. The mount point in routes/api/index.ts applies both checks before this handler runs."
        },
        {
          status: 404,
          description: "Log file not found."
        },
        {
          status: 500,
          description: "The log file could not be read"
        }
      ]
    },
    {
      id: "POST /SASjsApi/auth/logout",
      method: "POST",
      path: "/SASjsApi/auth/logout",
      tag: "Auth",
      summary: "Revoke the current tokens",
      params: [],
      requestBodies: [],
      responses: [
        {
          status: 204,
          description: "No content"
        },
        {
          status: 401,
          description: "No valid access token was supplied"
        }
      ]
    },
    {
      id: "POST /SASjsApi/auth/refresh",
      method: "POST",
      path: "/SASjsApi/auth/refresh",
      tag: "Auth",
      summary: "Refresh the access and refresh tokens",
      params: [],
      requestBodies: [],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 401,
          description: "The refresh token is missing, invalid or expired, or the client id is unknown"
        }
      ]
    },
    {
      id: "POST /SASjsApi/auth/token",
      method: "POST",
      path: "/SASjsApi/auth/token",
      tag: "Auth",
      summary: "Exchange an authorization code for tokens",
      params: [
        {
          name: "clientId",
          in: "body",
          required: true,
          type: "string"
        },
        {
          name: "code",
          in: "body",
          required: true,
          type: "string"
        }
      ],
      requestBodies: ["application/json"],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 400,
          description: "The request body is missing `clientId` or `code`"
        },
        {
          status: 401,
          description: "The authorization code is invalid, expired, already used, or was issued for another client, or the client id is unknown. This route is unauthenticated, so an unknown client id is a `401` here where `POST /SASLogon/authorize` (which requires a session) answers `403`"
        }
      ]
    },
    {
      id: "PATCH /SASjsApi/auth/updatePassword",
      method: "PATCH",
      path: "/SASjsApi/auth/updatePassword",
      tag: "Auth",
      summary: "Change the current user's password",
      params: [
        {
          name: "currentPassword",
          in: "body",
          required: true,
          type: "string"
        },
        {
          name: "newPassword",
          in: "body",
          required: true,
          type: "string"
        }
      ],
      requestBodies: ["application/json"],
      responses: [
        {
          status: 204,
          description: "No content"
        },
        {
          status: 400,
          description: "The request body is missing `currentPassword` or `newPassword`"
        },
        {
          status: 401,
          description: "No valid access token was supplied"
        },
        {
          status: 403,
          description: "The current password is incorrect"
        },
        {
          status: 404,
          description: "The authenticated user no longer exists"
        },
        {
          status: 405,
          description: "The account authenticates through an external provider, which holds its password"
        }
      ]
    },
    {
      id: "GET /SASjsApi/authConfig",
      method: "GET",
      path: "/SASjsApi/authConfig",
      tag: "Auth Config",
      summary: "Get the configured authentication providers",
      params: [],
      requestBodies: [],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 401,
          description: "Unauthorized, or an administrator account is required. The mount point in routes/api/index.ts applies both checks before this handler runs."
        },
        {
          status: 403,
          description: "Not Allowed while in Desktop Mode."
        },
        {
          status: 500,
          description: "The provider configuration could not be read"
        }
      ]
    },
    {
      id: "POST /SASjsApi/authConfig/synchroniseWithLDAP",
      method: "POST",
      path: "/SASjsApi/authConfig/synchroniseWithLDAP",
      tag: "Auth Config",
      summary: "Import users and groups from LDAP",
      params: [],
      requestBodies: [],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 401,
          description: "Unauthorized, or an administrator account is required. The mount point in routes/api/index.ts applies both checks before this handler runs."
        },
        {
          status: 403,
          description: "Not Allowed while in Desktop Mode."
        },
        {
          status: 500,
          description: "The directory could not be synchronised"
        }
      ]
    },
    {
      id: "GET /SASjsApi/client",
      method: "GET",
      path: "/SASjsApi/client",
      tag: "Client",
      summary: "List all clients",
      params: [],
      requestBodies: [],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 401,
          description: "Admin account required"
        }
      ]
    },
    {
      id: "POST /SASjsApi/client",
      method: "POST",
      path: "/SASjsApi/client",
      tag: "Client",
      summary: "Create a client",
      params: [
        {
          name: "clientId",
          in: "body",
          required: true,
          type: "string"
        },
        {
          name: "clientSecret",
          in: "body",
          required: true,
          type: "string"
        },
        {
          name: "accessTokenExpiration",
          in: "body",
          required: false,
          type: "number"
        },
        {
          name: "refreshTokenExpiration",
          in: "body",
          required: false,
          type: "number"
        }
      ],
      requestBodies: ["application/json"],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 401,
          description: "Admin account required"
        },
        {
          status: 403,
          description: "Client ID already exists."
        }
      ]
    },
    {
      id: "POST /SASjsApi/code/execute",
      method: "POST",
      path: "/SASjsApi/code/execute",
      tag: "Code",
      summary: "Execute code and return its output",
      params: [
        {
          name: "code",
          in: "body",
          required: true,
          type: "string"
        },
        {
          name: "runTime",
          in: "body",
          required: true,
          type: "RunTimeType"
        }
      ],
      requestBodies: ["application/json"],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 400,
          description: "Invalid request: the payload is invalid, or the program could not be run"
        },
        {
          status: 401,
          description: "Unauthorized"
        }
      ]
    },
    {
      id: "POST /SASjsApi/code/format",
      method: "POST",
      path: "/SASjsApi/code/format",
      tag: "Code",
      summary: "Format SAS code and return the formatted text",
      params: [
        {
          name: "code",
          in: "body",
          required: true,
          type: "string"
        },
        {
          name: "filePath",
          in: "body",
          required: false,
          type: "string"
        }
      ],
      requestBodies: ["application/json"],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 400,
          description: '"code" is required / "code" must be a string / "code" is not allowed to be empty'
        },
        {
          status: 401,
          description: "Unauthorized"
        }
      ]
    },
    {
      id: "POST /SASjsApi/code/lint",
      method: "POST",
      path: "/SASjsApi/code/lint",
      tag: "Code",
      summary: "Lint SAS code and return the diagnostics",
      params: [
        {
          name: "code",
          in: "body",
          required: true,
          type: "string"
        },
        {
          name: "filePath",
          in: "body",
          required: false,
          type: "string"
        }
      ],
      requestBodies: ["application/json"],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 400,
          description: '"code" is required / "code" must be a string / "code" is not allowed to be empty'
        },
        {
          status: 401,
          description: "Unauthorized"
        }
      ]
    },
    {
      id: "POST /SASjsApi/code/trigger",
      method: "POST",
      path: "/SASjsApi/code/trigger",
      tag: "Code",
      summary: "Trigger code and return a session ID",
      params: [
        {
          name: "code",
          in: "body",
          required: true,
          type: "string"
        },
        {
          name: "runTime",
          in: "body",
          required: true,
          type: "RunTimeType"
        },
        {
          name: "expiresAfterMins",
          in: "body",
          required: false,
          type: "number"
        }
      ],
      requestBodies: ["application/json"],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 400,
          description: "Invalid request: the payload is invalid, or the program could not be run"
        },
        {
          status: 401,
          description: "Unauthorized"
        }
      ]
    },
    {
      id: "DELETE /SASjsApi/drive/deploy",
      method: "DELETE",
      path: "/SASjsApi/drive/deploy",
      tag: "Drive",
      summary: "Remove an app",
      params: [
        {
          name: "id",
          in: "body",
          required: true,
          type: "string"
        }
      ],
      requestBodies: ["application/json"],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 400,
          description: "Invalid Format"
        },
        {
          status: 404,
          description: "No app is published with that id"
        }
      ]
    },
    {
      id: "POST /SASjsApi/drive/deploy",
      method: "POST",
      path: "/SASjsApi/drive/deploy",
      tag: "Drive",
      summary: "Deploy a file tree to SASjs Drive",
      params: [
        {
          name: "appLoc",
          in: "body",
          required: true,
          type: "string"
        },
        {
          name: "streamWebFolder",
          in: "body",
          required: false,
          type: "string"
        },
        {
          name: "streamServiceName",
          in: "body",
          required: false,
          type: "string"
        },
        {
          name: "streamLogo",
          in: "body",
          required: false,
          type: "string"
        },
        {
          name: "replace",
          in: "body",
          required: false,
          type: "boolean"
        },
        {
          name: "fileTree",
          in: "body",
          required: true,
          type: "FileTree"
        }
      ],
      requestBodies: ["application/json"],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 400,
          description: "Invalid Format"
        },
        {
          status: 413,
          description: "File tree exceeds the deploy limit"
        },
        {
          status: 500,
          description: "Execution Error"
        }
      ]
    },
    {
      id: "POST /SASjsApi/drive/deploy/upload",
      method: "POST",
      path: "/SASjsApi/drive/deploy/upload",
      tag: "Drive",
      summary: "Deploy an uploaded file to SASjs Drive",
      params: [
        {
          name: "appLoc",
          in: "query",
          required: false,
          type: "string"
        },
        {
          name: "streamWebFolder",
          in: "query",
          required: false,
          type: "string"
        },
        {
          name: "streamServiceName",
          in: "query",
          required: false,
          type: "string"
        },
        {
          name: "streamLogo",
          in: "query",
          required: false,
          type: "string"
        },
        {
          name: "replace",
          in: "query",
          required: false,
          type: "boolean"
        },
        {
          name: "file",
          in: "formData",
          required: true,
          type: "string"
        }
      ],
      requestBodies: ["multipart/form-data"],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 400,
          description: "Invalid Format"
        },
        {
          status: 413,
          description: "File tree exceeds the deploy limit"
        },
        {
          status: 500,
          description: "Execution Error"
        }
      ]
    },
    {
      id: "DELETE /SASjsApi/drive/file",
      method: "DELETE",
      path: "/SASjsApi/drive/file",
      tag: "Drive",
      summary: "Delete a file from SASjs Drive",
      params: [
        {
          name: "_filePath",
          in: "query",
          required: true,
          type: "string"
        }
      ],
      requestBodies: [],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 400,
          description: "Can't delete file outside drive"
        },
        {
          status: 404,
          description: "File doesn't exist"
        }
      ]
    },
    {
      id: "GET /SASjsApi/drive/file",
      method: "GET",
      path: "/SASjsApi/drive/file",
      tag: "Drive",
      summary: "Get a file from SASjs Drive",
      params: [
        {
          name: "_filePath",
          in: "query",
          required: true,
          type: "string"
        }
      ],
      requestBodies: [],
      responses: [
        {
          status: 200,
          description: "The contents of the file"
        },
        {
          status: 400,
          description: "Can't get file outside drive"
        },
        {
          status: 404,
          description: "File doesn't exist"
        }
      ]
    },
    {
      id: "PATCH /SASjsApi/drive/file",
      method: "PATCH",
      path: "/SASjsApi/drive/file",
      tag: "Drive",
      summary: "Replace a file in SASjs Drive",
      params: [
        {
          name: "_filePath",
          in: "query",
          required: false,
          type: "string"
        },
        {
          name: "file",
          in: "formData",
          required: true,
          type: "string"
        },
        {
          name: "filePath",
          in: "formData",
          required: false,
          type: "string"
        }
      ],
      requestBodies: ["multipart/form-data"],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 400,
          description: "Can't modify file outside drive"
        },
        {
          status: 404,
          description: "File doesn't exist"
        }
      ]
    },
    {
      id: "POST /SASjsApi/drive/file",
      method: "POST",
      path: "/SASjsApi/drive/file",
      tag: "Drive",
      summary: "Create a file in SASjs Drive",
      params: [
        {
          name: "_filePath",
          in: "query",
          required: false,
          type: "string"
        },
        {
          name: "file",
          in: "formData",
          required: true,
          type: "string"
        },
        {
          name: "filePath",
          in: "formData",
          required: false,
          type: "string"
        }
      ],
      requestBodies: ["multipart/form-data"],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 400,
          description: "Can't put file outside drive"
        },
        {
          status: 409,
          description: "File already exists"
        }
      ]
    },
    {
      id: "GET /SASjsApi/drive/filetree",
      method: "GET",
      path: "/SASjsApi/drive/filetree",
      tag: "Drive",
      summary: "Get the SASjs Drive file tree, or one folder of it",
      params: [
        {
          name: "_folderPath",
          in: "query",
          required: false,
          type: "string"
        }
      ],
      requestBodies: [],
      responses: [
        {
          status: 200,
          description: "Ok"
        }
      ]
    },
    {
      id: "DELETE /SASjsApi/drive/folder",
      method: "DELETE",
      path: "/SASjsApi/drive/folder",
      tag: "Drive",
      summary: "Delete a folder from SASjs Drive",
      params: [
        {
          name: "_folderPath",
          in: "query",
          required: true,
          type: "string"
        }
      ],
      requestBodies: [],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 400,
          description: "Can't delete folder outside drive"
        },
        {
          status: 404,
          description: "Folder doesn't exist"
        }
      ]
    },
    {
      id: "GET /SASjsApi/drive/folder",
      method: "GET",
      path: "/SASjsApi/drive/folder",
      tag: "Drive",
      summary: "List a folder in SASjs Drive",
      params: [
        {
          name: "_folderPath",
          in: "query",
          required: false,
          type: "string"
        }
      ],
      requestBodies: [],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 400,
          description: "Can't get folder outside drive"
        },
        {
          status: 404,
          description: "Folder doesn't exist"
        }
      ]
    },
    {
      id: "POST /SASjsApi/drive/folder",
      method: "POST",
      path: "/SASjsApi/drive/folder",
      tag: "Drive",
      summary: "Create a folder in SASjs Drive",
      params: [
        {
          name: "folderPath",
          in: "body",
          required: true,
          type: "string"
        }
      ],
      requestBodies: ["application/json"],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 400,
          description: "Can't put folder outside drive"
        },
        {
          status: 409,
          description: "Folder already exists. The body is that message as plain text."
        }
      ]
    },
    {
      id: "POST /SASjsApi/drive/rename",
      method: "POST",
      path: "/SASjsApi/drive/rename",
      tag: "Drive",
      summary: "Rename or move a file or folder in SASjs Drive",
      params: [
        {
          name: "oldPath",
          in: "body",
          required: true,
          type: "string"
        },
        {
          name: "newPath",
          in: "body",
          required: true,
          type: "string"
        }
      ],
      requestBodies: ["application/json"],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 400,
          description: "Can't rename outside drive"
        },
        {
          status: 404,
          description: "No file/folder found for provided path"
        },
        {
          status: 409,
          description: "Something already exists at the new path. The body is that message as plain text."
        }
      ]
    },
    {
      id: "GET /SASjsApi/group",
      method: "GET",
      path: "/SASjsApi/group",
      tag: "Group",
      summary: "List all groups",
      params: [],
      requestBodies: [],
      responses: [
        {
          status: 200,
          description: "Ok"
        }
      ]
    },
    {
      id: "POST /SASjsApi/group",
      method: "POST",
      path: "/SASjsApi/group",
      tag: "Group",
      summary: "Create a group",
      params: [
        {
          name: "name",
          in: "body",
          required: true,
          type: "string"
        },
        {
          name: "description",
          in: "body",
          required: true,
          type: "string"
        },
        {
          name: "isActive",
          in: "body",
          required: false,
          type: "boolean"
        }
      ],
      requestBodies: ["application/json"],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 401,
          description: "Admin account required"
        },
        {
          status: 409,
          description: "Group name already exists."
        }
      ]
    },
    {
      id: "DELETE /SASjsApi/group/{groupUid}/{userUid}",
      method: "DELETE",
      path: "/SASjsApi/group/{groupUid}/{userUid}",
      tag: "Group",
      summary: "Remove a user from a group",
      params: [
        {
          name: "groupUid",
          in: "path",
          required: true,
          type: "string"
        },
        {
          name: "userUid",
          in: "path",
          required: true,
          type: "string"
        }
      ],
      requestBodies: [],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 400,
          description: "Can't add/remove user to 'public' group."
        },
        {
          status: 401,
          description: "Admin account required"
        },
        {
          status: 404,
          description: "Group not found. / User not found."
        },
        {
          status: 405,
          description: "Can't add/remove user to group created by external auth provider."
        }
      ]
    },
    {
      id: "POST /SASjsApi/group/{groupUid}/{userUid}",
      method: "POST",
      path: "/SASjsApi/group/{groupUid}/{userUid}",
      tag: "Group",
      summary: "Add a user to a group",
      params: [
        {
          name: "groupUid",
          in: "path",
          required: true,
          type: "string"
        },
        {
          name: "userUid",
          in: "path",
          required: true,
          type: "string"
        }
      ],
      requestBodies: [],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 400,
          description: "Can't add/remove user to 'public' group."
        },
        {
          status: 401,
          description: "Admin account required"
        },
        {
          status: 404,
          description: "Group not found. / User not found."
        },
        {
          status: 405,
          description: "Can't add/remove user to group created by external auth provider."
        }
      ]
    },
    {
      id: "DELETE /SASjsApi/group/{uid}",
      method: "DELETE",
      path: "/SASjsApi/group/{uid}",
      tag: "Group",
      summary: "Delete a group",
      params: [
        {
          name: "uid",
          in: "path",
          required: true,
          type: "string"
        }
      ],
      requestBodies: [],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 401,
          description: "Admin account required"
        },
        {
          status: 404,
          description: "Group not found."
        }
      ]
    },
    {
      id: "GET /SASjsApi/group/{uid}",
      method: "GET",
      path: "/SASjsApi/group/{uid}",
      tag: "Group",
      summary: "Get a group by id",
      params: [
        {
          name: "uid",
          in: "path",
          required: true,
          type: "string"
        }
      ],
      requestBodies: [],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 404,
          description: "Group not found."
        }
      ]
    },
    {
      id: "GET /SASjsApi/group/by/groupname/{name}",
      method: "GET",
      path: "/SASjsApi/group/by/groupname/{name}",
      tag: "Group",
      summary: "Get a group by name",
      params: [
        {
          name: "name",
          in: "path",
          required: true,
          type: "string"
        }
      ],
      requestBodies: [],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 404,
          description: "Group not found."
        }
      ]
    },
    {
      id: "GET /SASjsApi/info",
      method: "GET",
      path: "/SASjsApi/info",
      tag: "Info",
      summary: "Get public server information",
      params: [],
      requestBodies: [],
      responses: [
        {
          status: 200,
          description: "Ok"
        }
      ]
    },
    {
      id: "GET /SASjsApi/info/authorizedRoutes",
      method: "GET",
      path: "/SASjsApi/info/authorizedRoutes",
      tag: "Info",
      summary: "List the routes that accept permissions",
      params: [],
      requestBodies: [],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 401,
          description: "Administrator access is required"
        }
      ]
    },
    {
      id: "GET /SASjsApi/info/myAuthorizedRoutes",
      method: "GET",
      path: "/SASjsApi/info/myAuthorizedRoutes",
      tag: "Info",
      summary: "List the routes this caller may use",
      params: [],
      requestBodies: [],
      responses: [
        {
          status: 200,
          description: "Ok"
        }
      ]
    },
    {
      id: "GET /SASjsApi/permission",
      method: "GET",
      path: "/SASjsApi/permission",
      tag: "Permission",
      summary: "List the permission rules for the current user",
      params: [],
      requestBodies: [],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 401,
          description: "Admin account required, or no grant on the route"
        },
        {
          status: 404,
          description: "User not found."
        }
      ]
    },
    {
      id: "POST /SASjsApi/permission",
      method: "POST",
      path: "/SASjsApi/permission",
      tag: "Permission",
      summary: "Create a permission rule",
      params: [
        {
          name: "path",
          in: "body",
          required: true,
          type: "string"
        },
        {
          name: "type",
          in: "body",
          required: true,
          type: "PermissionType"
        },
        {
          name: "setting",
          in: "body",
          required: true,
          type: "PermissionSettingForRoute"
        },
        {
          name: "principalType",
          in: "body",
          required: true,
          type: "PrincipalType"
        },
        {
          name: "principalId",
          in: "body",
          required: true,
          type: "string"
        }
      ],
      requestBodies: ["application/json"],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 400,
          description: "Can not add permission for admin user. / Invalid principal type. Valid types are user or group."
        },
        {
          status: 401,
          description: "Admin account required"
        },
        {
          status: 404,
          description: "User not found. / Group not found."
        },
        {
          status: 409,
          description: "Permission already exists with provided Path, Type and User. / Permission already exists with provided Path, Type and Group."
        }
      ]
    },
    {
      id: "DELETE /SASjsApi/permission/{uid}",
      method: "DELETE",
      path: "/SASjsApi/permission/{uid}",
      tag: "Permission",
      summary: "Delete a permission rule",
      params: [
        {
          name: "uid",
          in: "path",
          required: true,
          type: "string"
        }
      ],
      requestBodies: [],
      responses: [
        {
          status: 200,
          description: "Permission Deleted!"
        },
        {
          status: 401,
          description: "Admin account required"
        },
        {
          status: 404,
          description: "Permission not found."
        }
      ]
    },
    {
      id: "PATCH /SASjsApi/permission/{uid}",
      method: "PATCH",
      path: "/SASjsApi/permission/{uid}",
      tag: "Permission",
      summary: "Update a permission rule",
      params: [
        {
          name: "uid",
          in: "path",
          required: true,
          type: "string"
        },
        {
          name: "setting",
          in: "body",
          required: true,
          type: "PermissionSettingForRoute"
        }
      ],
      requestBodies: ["application/json"],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 401,
          description: "Admin account required"
        },
        {
          status: 404,
          description: "Permission not found."
        }
      ]
    },
    {
      id: "GET /SASjsApi/session",
      method: "GET",
      path: "/SASjsApi/session",
      tag: "Session",
      summary: "Get the current session",
      params: [],
      requestBodies: [],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 401,
          description: "No valid access token or session was supplied"
        }
      ]
    },
    {
      id: "GET /SASjsApi/session/{sessionId}",
      method: "GET",
      path: "/SASjsApi/session/{sessionId}",
      tag: "Session",
      summary: "Get a triggered session",
      params: [
        {
          name: "sessionId",
          in: "path",
          required: true,
          type: "string"
        }
      ],
      requestBodies: [],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 401,
          description: "No valid access token or session was supplied"
        },
        {
          status: 404,
          description: "Session with the given ID was not found."
        }
      ]
    },
    {
      id: "GET /SASjsApi/session/{sessionId}/log",
      method: "GET",
      path: "/SASjsApi/session/{sessionId}/log",
      tag: "Session",
      summary: "Get the log of a triggered session",
      params: [
        {
          name: "sessionId",
          in: "path",
          required: true,
          type: "string"
        }
      ],
      requestBodies: [],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 401,
          description: "No valid access token or session was supplied"
        },
        {
          status: 404,
          description: "Session with the given ID was not found."
        }
      ]
    },
    {
      id: "GET /SASjsApi/session/{sessionId}/output",
      method: "GET",
      path: "/SASjsApi/session/{sessionId}/output",
      tag: "Session",
      summary: "Get the output of a triggered session",
      params: [
        {
          name: "sessionId",
          in: "path",
          required: true,
          type: "string"
        }
      ],
      requestBodies: [],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 401,
          description: "No valid access token or session was supplied"
        },
        {
          status: 404,
          description: "Session with the given ID was not found."
        }
      ]
    },
    {
      id: "GET /SASjsApi/session/{sessionId}/state",
      method: "GET",
      path: "/SASjsApi/session/{sessionId}/state",
      tag: "Session",
      summary: "Get the state of a session",
      params: [
        {
          name: "sessionId",
          in: "path",
          required: true,
          type: "string"
        }
      ],
      requestBodies: [],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 401,
          description: "No valid access token or session was supplied"
        },
        {
          status: 404,
          description: "Session with the given ID was not found."
        }
      ]
    },
    {
      id: "GET /SASjsApi/stp/execute",
      method: "GET",
      path: "/SASjsApi/stp/execute",
      tag: "STP",
      summary: "Execute a stored program",
      params: [
        {
          name: "_program",
          in: "query",
          required: true,
          type: "string"
        },
        {
          name: "_debug",
          in: "query",
          required: false,
          type: "number"
        }
      ],
      requestBodies: [],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 400,
          description: "Invalid request: the query parameters are invalid, or the program could not be run"
        },
        {
          status: 401,
          description: "Unauthorized"
        }
      ]
    },
    {
      id: "POST /SASjsApi/stp/execute",
      method: "POST",
      path: "/SASjsApi/stp/execute",
      tag: "STP",
      summary: "Execute a stored program",
      params: [
        {
          name: "_program",
          in: "query",
          required: false,
          type: "string"
        },
        {
          name: "_program",
          in: "body",
          required: false,
          type: "string"
        }
      ],
      requestBodies: ["application/json"],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 400,
          description: "Invalid request: the payload is invalid, or the program could not be run"
        },
        {
          status: 401,
          description: "Unauthorized"
        }
      ]
    },
    {
      id: "POST /SASjsApi/stp/trigger",
      method: "POST",
      path: "/SASjsApi/stp/trigger",
      tag: "STP",
      summary: "Trigger a stored program and return a session ID",
      params: [
        {
          name: "_program",
          in: "query",
          required: true,
          type: "string"
        },
        {
          name: "_debug",
          in: "query",
          required: false,
          type: "number"
        },
        {
          name: "expiresAfterMins",
          in: "query",
          required: false,
          type: "number"
        }
      ],
      requestBodies: [],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 400,
          description: "Invalid request: the payload is invalid, or the program could not be run"
        },
        {
          status: 401,
          description: "Unauthorized"
        }
      ]
    },
    {
      id: "GET /SASjsApi/user",
      method: "GET",
      path: "/SASjsApi/user",
      tag: "User",
      summary: "List all users",
      params: [],
      requestBodies: [],
      responses: [
        {
          status: 200,
          description: "Ok"
        }
      ]
    },
    {
      id: "POST /SASjsApi/user",
      method: "POST",
      path: "/SASjsApi/user",
      tag: "User",
      summary: "Create a user",
      params: [
        {
          name: "displayName",
          in: "body",
          required: true,
          type: "string"
        },
        {
          name: "username",
          in: "body",
          required: true,
          type: "string"
        },
        {
          name: "password",
          in: "body",
          required: true,
          type: "string"
        },
        {
          name: "isAdmin",
          in: "body",
          required: false,
          type: "boolean"
        },
        {
          name: "isActive",
          in: "body",
          required: false,
          type: "boolean"
        },
        {
          name: "autoExec",
          in: "body",
          required: false,
          type: "string"
        }
      ],
      requestBodies: ["application/json"],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 401,
          description: "Admin account required"
        },
        {
          status: 409,
          description: "Username already exists."
        }
      ]
    },
    {
      id: "DELETE /SASjsApi/user/{uid}",
      method: "DELETE",
      path: "/SASjsApi/user/{uid}",
      tag: "User",
      summary: "Delete a user by id",
      params: [
        {
          name: "uid",
          in: "path",
          required: true,
          type: "string"
        },
        {
          name: "password",
          in: "body",
          required: false,
          type: "string"
        }
      ],
      requestBodies: ["application/json"],
      responses: [
        {
          status: 200,
          description: "Account Deleted!"
        },
        {
          status: 401,
          description: "Admin account required, or invalid password"
        },
        {
          status: 404,
          description: "User is not found."
        }
      ]
    },
    {
      id: "GET /SASjsApi/user/{uid}",
      method: "GET",
      path: "/SASjsApi/user/{uid}",
      tag: "User",
      summary: "Get a user by id",
      params: [
        {
          name: "uid",
          in: "path",
          required: true,
          type: "string"
        }
      ],
      requestBodies: [],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 401,
          description: "Unauthorized"
        },
        {
          status: 404,
          description: "User is not found."
        }
      ]
    },
    {
      id: "PATCH /SASjsApi/user/{uid}",
      method: "PATCH",
      path: "/SASjsApi/user/{uid}",
      tag: "User",
      summary: "Update a user by id",
      params: [
        {
          name: "uid",
          in: "path",
          required: true,
          type: "string"
        },
        {
          name: "displayName",
          in: "body",
          required: true,
          type: "string"
        },
        {
          name: "username",
          in: "body",
          required: true,
          type: "string"
        },
        {
          name: "password",
          in: "body",
          required: true,
          type: "string"
        },
        {
          name: "isAdmin",
          in: "body",
          required: false,
          type: "boolean"
        },
        {
          name: "isActive",
          in: "body",
          required: false,
          type: "boolean"
        },
        {
          name: "autoExec",
          in: "body",
          required: false,
          type: "string"
        }
      ],
      requestBodies: ["application/json"],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 401,
          description: "Admin account required"
        },
        {
          status: 404,
          description: "Unable to find user with <id>"
        },
        {
          status: 405,
          description: "Can not update username of user that is created by an external auth provider. / Can not update display name of user that is created by an external auth provider."
        },
        {
          status: 409,
          description: "Username already exists."
        }
      ]
    },
    {
      id: "DELETE /SASjsApi/user/by/username/{username}",
      method: "DELETE",
      path: "/SASjsApi/user/by/username/{username}",
      tag: "User",
      summary: "Delete a user by username",
      params: [
        {
          name: "username",
          in: "path",
          required: true,
          type: "string"
        },
        {
          name: "password",
          in: "body",
          required: false,
          type: "string"
        }
      ],
      requestBodies: ["application/json"],
      responses: [
        {
          status: 200,
          description: "Account Deleted!"
        },
        {
          status: 401,
          description: "Admin account required, or invalid password"
        },
        {
          status: 404,
          description: "User is not found."
        }
      ]
    },
    {
      id: "GET /SASjsApi/user/by/username/{username}",
      method: "GET",
      path: "/SASjsApi/user/by/username/{username}",
      tag: "User",
      summary: "Get a user by username",
      params: [
        {
          name: "username",
          in: "path",
          required: true,
          type: "string"
        }
      ],
      requestBodies: [],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 401,
          description: "Unauthorized"
        },
        {
          status: 404,
          description: "User is not found."
        }
      ]
    },
    {
      id: "PATCH /SASjsApi/user/by/username/{username}",
      method: "PATCH",
      path: "/SASjsApi/user/by/username/{username}",
      tag: "User",
      summary: "Update a user by username",
      params: [
        {
          name: "username",
          in: "path",
          required: true,
          type: "string"
        },
        {
          name: "displayName",
          in: "body",
          required: true,
          type: "string"
        },
        {
          name: "username",
          in: "body",
          required: true,
          type: "string"
        },
        {
          name: "password",
          in: "body",
          required: true,
          type: "string"
        },
        {
          name: "isAdmin",
          in: "body",
          required: false,
          type: "boolean"
        },
        {
          name: "isActive",
          in: "body",
          required: false,
          type: "boolean"
        },
        {
          name: "autoExec",
          in: "body",
          required: false,
          type: "string"
        }
      ],
      requestBodies: ["application/json"],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 401,
          description: "Admin account required"
        },
        {
          status: 404,
          description: "Unable to find user with <username>"
        },
        {
          status: 405,
          description: "Can not update username of user that is created by an external auth provider. / Can not update display name of user that is created by an external auth provider."
        },
        {
          status: 409,
          description: "Username already exists."
        }
      ]
    },
    {
      id: "POST /SASLogon/authorize",
      method: "POST",
      path: "/SASLogon/authorize",
      tag: "Web",
      summary: "Issue an authorization code",
      params: [
        {
          name: "clientId",
          in: "body",
          required: true,
          type: "string"
        }
      ],
      requestBodies: ["application/json"],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 400,
          description: "The request body is missing `clientId`, or the CSRF token is missing or invalid"
        },
        {
          status: 401,
          description: "No signed-in session"
        },
        {
          status: 403,
          description: "The client id is unknown. This route runs under a signed-in session, so the caller is authenticated and an unknown client is refused as forbidden; the unauthenticated `POST /SASjsApi/auth/token` answers `401` for the same condition"
        }
      ]
    },
    {
      id: "POST /SASLogon/login",
      method: "POST",
      path: "/SASLogon/login",
      tag: "Web",
      summary: "Sign in with a username and password",
      params: [
        {
          name: "username",
          in: "body",
          required: true,
          type: "string"
        },
        {
          name: "password",
          in: "body",
          required: true,
          type: "string"
        }
      ],
      requestBodies: ["application/json"],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 400,
          description: "The request body is missing `username` or `password`"
        },
        {
          status: 401,
          description: "The credentials are not valid, or password sign-in is disabled for local accounts"
        },
        {
          status: 429,
          description: "Too many failed attempts for this account"
        },
        {
          status: 500,
          description: "An unexpected error occurred while signing in"
        }
      ]
    },
    {
      id: "GET /SASLogon/logout",
      method: "GET",
      path: "/SASLogon/logout",
      tag: "Web",
      summary: "Sign out",
      params: [],
      requestBodies: [],
      responses: [
        {
          status: 200,
          description: "Ok"
        },
        {
          status: 500,
          description: "The session store failed to replace the session"
        }
      ]
    }
  ];

  // src/routes/overlay.ts
  var TAG_CAPABILITIES = {
    Drive: ["storage"],
    STP: ["runtime", "storage"],
    Code: ["runtime"],
    Session: ["runtime"],
    Info: [],
    Admin: ["storage"],
    Auth: ["identity"],
    "Auth Config": ["identity"],
    User: ["identity"],
    Group: ["identity"],
    Permission: ["identity"],
    Client: ["identity"],
    Web: ["identity"]
  };
  var success = { status: "success" };
  var user = {
    uid: "",
    username: "",
    displayName: "",
    isAdmin: false,
    needsToUpdatePassword: false
  };
  var OVERLAY = {
    // Web - the sign-in pages the identity service answers, and the shell itself.
    // The page is the host's file; the stamping rule that keeps a cached shell
    // from pinning an old bundle is the package's.
    "GET /": {
      implemented: true,
      // public: the shell is what an unauthenticated browser asks for first
      capabilities: []
      // No body annotation: this status carries two, and neither is a value a
      // client keys on. The usual answer is the host's own page, stamped with its
      // bundle token (its bytes are the host's, so the corpus pins the transform
      // rather than the page); the fallback is NO_WEB_BUILD, which is a constant
      // here rather than a literal copied into this table.
    },
    "POST /SASLogon/login": {
      implemented: true,
      // The lockout and the provider failure are answered before the package is
      // consulted (routes/web/web.ts in sasjs/server).
      hostResponses: [429, 500],
      responses: { 200: { loggedIn: true, user } }
    },
    "POST /SASLogon/authorize": {
      implemented: true,
      responses: { 200: { code: "" } }
    },
    "GET /SASLogon/logout": {
      implemented: true,
      hostResponses: [500],
      responses: { 200: "OK!" }
    },
    // Admin - the host's own process and files, over the reports it supplies.
    // The administrator check is the host's mount point (sasjs/server puts
    // authenticateAccessToken and verifyAdmin in front of all three), so its 401
    // - and the 500 a genuine failure answers - are host-only statuses.
    "GET /SASjsApi/admin/diagnostics": {
      implemented: true,
      hostResponses: [401, 500],
      responses: {
        200: {
          build: { version: "", gitHash: "", buildDate: null },
          server: {
            mode: "desktop",
            uptimeSeconds: 0,
            startedAt: "",
            pid: 0,
            nodeVersion: "",
            platform: "",
            arch: "",
            cpuCount: 0,
            cpuModel: "",
            loadAverage: [],
            runTimes: [],
            sasjsRoot: ""
          },
          memory: {
            rssBytes: 0,
            heapTotalBytes: 0,
            heapUsedBytes: 0,
            externalBytes: 0,
            systemTotalBytes: 0,
            systemFreeBytes: 0
          },
          filesystem: null,
          folders: [],
          logs: {
            folder: "",
            fileCount: 0,
            totalBytes: 0,
            newestFile: null,
            newestModified: null
          }
        }
      }
    },
    "GET /SASjsApi/admin/logs": {
      implemented: true,
      hostResponses: [401, 500],
      responses: { 200: { files: [] } }
    },
    "GET /SASjsApi/admin/logs/{fileName}": {
      implemented: true,
      // 400 and 404 are the name rule's, and this package answers them before the
      // host is asked for anything
      hostResponses: [401, 500],
      responses: {
        200: {
          fileName: "",
          lines: 0,
          bytesRead: 0,
          truncated: false,
          content: ""
        },
        400: "Invalid log file name.",
        404: "Log file not found."
      }
    },
    // Auth - the token flow, plus a password change the identity store cannot write
    "POST /SASjsApi/auth/token": {
      implemented: true,
      responses: { 200: { accessToken: "", refreshToken: "" } }
    },
    "POST /SASjsApi/auth/refresh": {
      implemented: true,
      responses: { 200: { accessToken: "", refreshToken: "" } }
    },
    "POST /SASjsApi/auth/logout": { implemented: true },
    "PATCH /SASjsApi/auth/updatePassword": {
      implemented: true,
      // As with the permission list: the document's 404 is a caller whose record
      // has gone, which a host's store can see and this package cannot.
      hostResponses: [404]
    },
    // Auth Config - the providers a host was started with, and an LDAP import.
    // Both are administrator routes at the host's mount point, so 401 and the
    // host's own 500 are host-only statuses; the package answers the body, and
    // refuses a secret that a host tries to hand it.
    "GET /SASjsApi/authConfig": {
      implemented: true,
      hostResponses: [401, 403, 500],
      responses: {
        200: {
          ldap: {
            LDAP_URL: "",
            LDAP_BIND_DN: "",
            LDAP_USERS_BASE_DN: "",
            LDAP_GROUPS_BASE_DN: "",
            LDAP_BIND_PASSWORD_SET: true
          }
        }
      }
    },
    "POST /SASjsApi/authConfig/synchroniseWithLDAP": {
      implemented: true,
      hostResponses: [401, 403, 500],
      responses: { 200: { userCount: 0, groupCount: 0 } }
    },
    // Client - the OAuth clients the identity store already holds for sign-in
    "GET /SASjsApi/client": { implemented: true },
    "POST /SASjsApi/client": { implemented: true },
    // Code - the editor's three calls, and the runtime one
    //
    // The runtime routes are carried over a `SessionRunner` port: the document's
    // `RunTimeType` is validated here, the id, the record and the refusals are
    // decided here, and performing the work is the host's. The response body is
    // the program's own output - the log included when `_debug` asks for it - so
    // there is no body to annotate.
    "POST /SASjsApi/code/execute": { implemented: true },
    "POST /SASjsApi/code/trigger": {
      implemented: true,
      // `pid` is the host's, and a run time without a local process omits it
      responses: { 200: { sessionId: "" } }
    },
    "POST /SASjsApi/code/lint": {
      implemented: true,
      capabilities: ["identity"]
    },
    "POST /SASjsApi/code/format": {
      implemented: true,
      capabilities: ["identity"]
    },
    // Drive - the file and folder rules, and the three deploy routes
    // The body is the file itself, so there is nothing to annotate
    "GET /SASjsApi/drive/file": { implemented: true },
    "POST /SASjsApi/drive/file": {
      implemented: true,
      responses: { 200: success, 409: "File already exists." }
    },
    "PATCH /SASjsApi/drive/file": {
      implemented: true,
      responses: { 200: success, 404: `File doesn't exist.` }
    },
    "DELETE /SASjsApi/drive/file": {
      implemented: true,
      responses: { 200: success, 404: `File doesn't exist.` }
    },
    "GET /SASjsApi/drive/folder": {
      implemented: true,
      responses: { 200: { files: [], folders: [] } }
    },
    "POST /SASjsApi/drive/folder": {
      implemented: true,
      responses: { 200: success, 409: "Folder already exists." }
    },
    "DELETE /SASjsApi/drive/folder": {
      implemented: true,
      responses: { 200: success, 404: `Folder doesn't exist.` }
    },
    "POST /SASjsApi/drive/rename": {
      implemented: true,
      responses: {
        200: success,
        409: "File with new name already exists.",
        404: "No file/folder found for provided path."
      }
    },
    "GET /SASjsApi/drive/filetree": {
      implemented: true,
      responses: { 200: { status: "success", tree: {} } }
    },
    // The deploy routes answer an ENVELOPE, unlike the file routes above: their
    // `400` is `{status:'failure', message}` rather than the message as text, and
    // `413` is the cap refusing the tree before anything is written.
    // `"appLoc" is required` and `"fileTree" is required` are the other `400` this
    // route sends - a missing body property, worded by the table's own
    // validation - so the body annotated here is the substantial one.
    "POST /SASjsApi/drive/deploy": {
      implemented: true,
      responses: {
        200: DEPLOY_SUCCESS,
        400: {
          status: "failure",
          message: "Provided not supported data format."
        },
        413: "The file tree exceeds the deploy limit.",
        500: { status: "failure", message: "Deployment failed!" }
      }
    },
    "POST /SASjsApi/drive/deploy/upload": { implemented: true },
    // `404` is an id the index does not hold - the id is the app, and its label and
    // folder are not handles - and the drive's content is deliberately left alone.
    "DELETE /SASjsApi/drive/deploy": { implemented: true },
    // Group - members and the groups themselves
    "GET /SASjsApi/group": { implemented: true },
    "GET /SASjsApi/group/{uid}": { implemented: true },
    "GET /SASjsApi/group/by/groupname/{name}": { implemented: true },
    "POST /SASjsApi/group": { implemented: true },
    "POST /SASjsApi/group/{groupUid}/{userUid}": { implemented: true },
    "DELETE /SASjsApi/group/{groupUid}/{userUid}": { implemented: true },
    "DELETE /SASjsApi/group/{uid}": { implemented: true },
    // Info - what the host is, and what this caller may use
    "GET /SASjsApi/info": {
      implemented: true,
      // The values are the host's; the shape is the document's, and the service
      // refuses a configuration that adds a property it does not state (the
      // browser build used to answer `whiteList` and `protocol`) or omits one it
      // requires (`httpPort`, `httpsPort`, `localLoginEnabled`).
      responses: {
        200: {
          mode: "server",
          cors: "disable",
          httpPort: 5e3,
          httpsPort: 443,
          runTimes: ["sas", "js"],
          authProviders: [],
          localLoginEnabled: true,
          version: "v3.2.2 (4a26a3d)"
        }
      }
    },
    "GET /SASjsApi/info/authorizedRoutes": {
      implemented: true,
      capabilities: ["identity"]
    },
    "GET /SASjsApi/info/myAuthorizedRoutes": {
      implemented: true,
      capabilities: ["identity"]
    },
    // Permission - the rules the inventory above is derived from
    "GET /SASjsApi/permission": {
      implemented: true,
      // The document states 404 for a caller whose record has gone - a token that
      // outlived its account. Here a token stops resolving when the account does,
      // so this package answers 401 before it gets that far; the host's own store
      // is what can still see the difference.
      hostResponses: [404]
    },
    "POST /SASjsApi/permission": { implemented: true },
    "PATCH /SASjsApi/permission/{uid}": { implemented: true },
    "DELETE /SASjsApi/permission/{uid}": { implemented: true },
    // Session - the caller's own session, then the record behind a triggered one
    "GET /SASjsApi/session": {
      implemented: true,
      responses: { 200: user }
    },
    // The port takes the owner as a uid and falls back to a username, which is
    // what sasjs/server records today - a host hands its sessions through as they
    // are, and the comparison tries the identifier first.
    "GET /SASjsApi/session/{sessionId}": { implemented: true },
    "GET /SASjsApi/session/{sessionId}/log": { implemented: true },
    "GET /SASjsApi/session/{sessionId}/output": { implemented: true },
    "GET /SASjsApi/session/{sessionId}/state": { implemented: true },
    // STP - a stored program, on the runtime port
    "GET /SASjsApi/stp/execute": { implemented: true },
    "POST /SASjsApi/stp/execute": { implemented: true },
    "POST /SASjsApi/stp/trigger": {
      implemented: true,
      responses: { 200: { sessionId: "" } }
    },
    // User - the accounts the identity store already holds for sign-in
    // Reading accounts is open to any authenticated caller, which is what
    // sasjs/server's routes do (`authenticateAccessToken` only): the document once
    // said `Admin account required` here, and sasjs/server#551 corrected it to
    // `Unauthorized` because that is the refusal a caller actually receives. The
    // breadth is the server's behaviour, copied deliberately - the auto-exec code
    // is the one field withheld from anyone but an administrator or the account
    // itself.
    "GET /SASjsApi/user": { implemented: true },
    "GET /SASjsApi/user/{uid}": { implemented: true },
    "GET /SASjsApi/user/by/username/{username}": { implemented: true },
    "POST /SASjsApi/user": { implemented: true },
    "PATCH /SASjsApi/user/{uid}": { implemented: true },
    "PATCH /SASjsApi/user/by/username/{username}": { implemented: true },
    // The document also marks `password` optional on these deletes, while the
    // server's schema requires it for anyone who is not an administrator, and for
    // an account deleting itself. A host should treat a passwordless delete from a
    // non-admin as the refusal it is; this package answers 401 `Invalid password.`
    // where the server's schema answers 400 `"password" is required`.
    "DELETE /SASjsApi/user/{uid}": { implemented: true },
    "DELETE /SASjsApi/user/by/username/{username}": { implemented: true }
  };

  // src/routes/index.ts
  var merge = (generated) => {
    const overlay = OVERLAY[generated.id];
    if (!overlay)
      throw new Error(
        `src/routes/overlay.ts has no entry for ${generated.id}. Every operation states whether this package implements it and, when it does not, the reason it does not: add \`{ implemented: false, reason: '...' }\` until a handler exists.`
      );
    const documented = new Map(
      generated.responses.map((r) => [r.status, r.description])
    );
    for (const status of Object.keys(overlay.responses || {}).map(Number)) {
      if (!documented.has(status)) {
        throw new Error(
          `src/routes/overlay.ts annotates status ${status} for ${generated.id}, which the OpenAPI document does not state. Correct the document in sasjs/server and re-vendor spec/swagger.yaml, or drop the annotation.`
        );
      }
    }
    const responses = [...documented.keys()].sort((a, b) => a - b).map((status) => {
      const body = overlay.responses ? overlay.responses[status] : void 0;
      return {
        status,
        description: documented.get(status) || "",
        ...body === void 0 ? {} : { body }
      };
    });
    for (const status of overlay.hostResponses || [])
      if (!documented.has(status))
        throw new Error(
          `src/routes/overlay.ts marks status ${status} of ${generated.id} as host-only, and the OpenAPI document does not state it. Correct the document in sasjs/server and re-vendor spec/swagger.yaml, or drop the annotation.`
        );
    return {
      ...generated,
      responses,
      hostResponses: overlay.hostResponses || [],
      capabilities: overlay.capabilities || TAG_CAPABILITIES[generated.tag] || [],
      implemented: overlay.implemented,
      ...overlay.implemented ? {} : { reason: overlay.reason }
    };
  };
  var ROUTES = GENERATED_ROUTES.map(merge);
  var known = new Set(ROUTES.map((route) => route.id));
  for (const id of Object.keys(OVERLAY))
    if (!known.has(id))
      throw new Error(
        `src/routes/overlay.ts names an operation the OpenAPI document does not have: ${id}. Remove the entry or refresh spec/swagger.yaml.`
      );
  var byId = new Map(ROUTES.map((route) => [route.id, route]));
  var routeById = (id) => byId.get(id);
  var escape = (segment) => segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  var compiled = ROUTES.filter((route) => route.path.includes("{")).map(
    (route) => {
      const keys = [];
      const pattern = route.path.split("/").map((segment) => {
        if (segment.startsWith("{") && segment.endsWith("}")) {
          keys.push(segment.slice(1, -1));
          return "([^/]+)";
        }
        return escape(segment);
      }).join("/");
      return { route, keys, regex: new RegExp("^" + pattern + "/?$", "i") };
    }
  );
  var exact = /* @__PURE__ */ new Map();
  for (const route of ROUTES)
    if (!route.path.includes("{"))
      exact.set(route.method + " " + route.path.toLowerCase(), route);
  var findRoute = (method, path) => {
    const verb = method.toUpperCase();
    const clean = path.split("?")[0].replace(/\/+$/, "") || "/";
    const hit = exact.get(verb + " " + clean.toLowerCase());
    if (hit) return { route: hit, params: {} };
    for (const candidate of compiled) {
      if (candidate.route.method !== verb) continue;
      const match = candidate.regex.exec(clean);
      if (!match) continue;
      const params = {};
      candidate.keys.forEach((key, index) => {
        try {
          params[key] = decodeURIComponent(match[index + 1]);
        } catch {
          params[key] = match[index + 1];
        }
      });
      return { route: candidate.route, params };
    }
    return void 0;
  };

  // src/appstream/identity.ts
  var normaliseAppLoc = (appLoc) => {
    if (typeof appLoc !== "string" || appLoc === "")
      throw new Error(
        `App location must be a non-empty string, got ${JSON.stringify(appLoc)}.`
      );
    const normalised = normaliseDrivePath(appLoc);
    if (normalised === null)
      throw new ApiError(400, "appLoc cannot be outside drive.");
    return normalised;
  };
  var newAppId = () => {
    const webCrypto = globalThis.crypto;
    if (typeof webCrypto?.randomUUID === "function") return webCrypto.randomUUID();
    if (typeof webCrypto?.getRandomValues !== "function")
      throw new Error("No cryptographic source of randomness is available.");
    const bytes3 = new Uint8Array(16);
    webCrypto.getRandomValues(bytes3);
    bytes3[6] = bytes3[6] & 15 | 64;
    bytes3[8] = bytes3[8] & 63 | 128;
    const hex = Array.from(bytes3).map((byte) => byte.toString(16).padStart(2, "0")).join("");
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20)
    ].join("-");
  };
  var APP_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  var isAppId = (value) => typeof value === "string" && APP_ID.test(value);

  // src/appstream/service.ts
  var appSummary = (entry) => ({
    id: entry.id,
    name: entry.name,
    url: `/app/${entry.id}/`
  });
  var webFolderOf = (value) => {
    if (typeof value !== "string" || value === "")
      throw new ApiError(400, '"streamWebFolder" is required');
    if (value === "." || value === ".." || /[\\/]/.test(value))
      throw new ApiError(400, "streamWebFolder must be a single path segment.");
    return value;
  };
  var defaultAppName = (appLoc) => {
    const segment = appLoc.split("/").filter(Boolean).pop();
    return segment ? segment : "app";
  };
  var sameAppLoc = (left, right) => {
    try {
      return normaliseAppLoc(left) === normaliseAppLoc(right);
    } catch (_) {
      return false;
    }
  };
  var appLocOf = (value) => {
    try {
      return normaliseAppLoc(value);
    } catch (error) {
      throw new ApiError(400, error.message);
    }
  };
  var hasStreamFolder = (tree, streamWebFolder) => {
    const members = tree?.members;
    if (!Array.isArray(members)) return false;
    const isFolder = (member, name) => {
      const entry = member;
      return entry?.type === "folder" && entry?.name === name;
    };
    const services = members.find((member) => isFolder(member, "services"));
    const children = services?.members;
    return Array.isArray(children) && children.some((member) => isFolder(member, streamWebFolder));
  };
  var checkPublishRequest = (request, tree, options = {}) => {
    const appLoc = appLocOf(request.appLoc);
    if (appLoc === "/")
      throw new ApiError(400, "An app cannot be published at the drive root.");
    const logo = logoOf(request.logo);
    const frameAncestors = frameAncestorsOf(request.frameAncestors);
    const streamWebFolder = webFolderOf(request.streamWebFolder);
    if (tree !== void 0 && !hasStreamFolder(tree, streamWebFolder))
      throw new ApiError(
        400,
        `The deployed tree has no "services/${streamWebFolder}" folder, so nothing would be published at ${appLoc}. Deploy the web assets under services/${streamWebFolder}, or ${options.folderFromManifest ? "correct the folder sasjs.app.json names." : "omit streamWebFolder."}`
      );
    return {
      appLoc,
      streamWebFolder,
      ...request.name === void 0 ? {} : { name: nameOf(request.name, appLoc) },
      ...logo === void 0 ? {} : { logo },
      ...frameAncestors === void 0 ? {} : { frameAncestors },
      ...request.publishedAt === void 0 ? {} : { publishedAt: request.publishedAt }
    };
  };
  var nameOf = (value, appLoc) => {
    if (value === void 0) return defaultAppName(appLoc);
    if (typeof value !== "string" || value.trim() === "")
      throw new ApiError(400, '"name" must be a non-empty string');
    return value.trim();
  };
  var logoOf = (value) => {
    if (value === void 0) return void 0;
    if (typeof value !== "string" || value === "")
      throw new ApiError(400, '"logo" must be a non-empty string');
    return value;
  };
  var frameAncestorsOf = (value) => {
    if (value === void 0) return void 0;
    const list = Array.isArray(value) ? value : [value];
    if (list.length === 0 || list.some((source) => typeof source !== "string" || source === ""))
      throw new ApiError(
        400,
        '"frameAncestors" must be a string or a non-empty list of strings'
      );
    return [...list];
  };
  var createAppStreamService = (store) => {
    let queue = Promise.resolve();
    const mutate = (work) => {
      const run = queue.then(work, work);
      queue = run.catch(() => void 0);
      return run;
    };
    const readable = (allow) => store.read().then(
      (entries) => entries.filter((entry) => allow ? allow(entry) : true).map((entry) => ({ ...entry })).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
    );
    return {
      list: readable,
      async get(id) {
        const entry = (await store.read()).find(
          (candidate) => candidate.id === id
        );
        if (!entry) throw new ApiError(404, "No app is published with that id.");
        return { ...entry };
      },
      async forAppLoc(appLoc) {
        let normalised;
        try {
          normalised = normaliseAppLoc(appLoc);
        } catch (_) {
          return void 0;
        }
        const entry = (await store.read()).find(
          (candidate) => sameAppLoc(candidate.appLoc, normalised)
        );
        return entry ? { ...entry } : void 0;
      },
      publish(request) {
        return mutate(async () => {
          const checked = checkPublishRequest(request);
          const appLoc = checked.appLoc;
          const streamWebFolder = checked.streamWebFolder;
          const entries = await store.read();
          const existing = entries.find(
            (entry2) => sameAppLoc(entry2.appLoc, appLoc)
          );
          const logo = checked.logo;
          const frameAncestors = checked.frameAncestors;
          const entry = {
            id: existing ? existing.id : newAppId(),
            // the label is the one field a redeploy inherits: everything else is
            // what this publish states
            name: nameOf(checked.name ?? existing?.name, appLoc),
            appLoc,
            streamWebFolder,
            ...logo === void 0 ? {} : { logo },
            ...frameAncestors === void 0 ? {} : { frameAncestors },
            publishedAt: checked.publishedAt ?? (/* @__PURE__ */ new Date()).toISOString()
          };
          await store.write([
            ...entries.filter(
              (candidate) => !sameAppLoc(candidate.appLoc, appLoc)
            ),
            entry
          ]);
          return { ...entry };
        });
      },
      unpublish(id) {
        return mutate(async () => {
          const entries = await store.read();
          const index = entries.findIndex((entry) => entry.id === id);
          if (index === -1)
            throw new ApiError(404, "No app is published with that id.");
          const [removed] = entries.splice(index, 1);
          await store.write(entries);
          return { ...removed };
        });
      }
    };
  };
  var MemoryAppStreamStore = class {
    constructor(entries = []) {
      this.entries = entries.map((entry) => ({ ...entry }));
    }
    async read() {
      return this.entries.map((entry) => ({ ...entry }));
    }
    async write(entries) {
      this.entries = entries.map((entry) => ({ ...entry }));
    }
  };

  // src/appstream/bundle.ts
  var APP_MANIFEST = "sasjs.app.json";
  var isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
  var text = (value, field) => {
    if (value === void 0) return void 0;
    if (typeof value !== "string" || value.trim() === "")
      throw new ApiError(
        400,
        `"${field}" must be a non-empty string in ${APP_MANIFEST}.`
      );
    return value.trim();
  };
  var parseAppManifest = (value) => {
    if (!isObject(value))
      throw new ApiError(400, `${APP_MANIFEST} must be an object.`);
    const streamWebFolder = text(value.streamWebFolder, "streamWebFolder");
    if (streamWebFolder === void 0)
      throw new ApiError(
        400,
        `${APP_MANIFEST} must state "streamWebFolder": the folder under services/ holding the compiled app.`
      );
    const name = text(value.name, "name");
    const logo = text(value.logo, "logo");
    const frameAncestors = value.frameAncestors;
    if (frameAncestors !== void 0 && (typeof frameAncestors !== "string" || frameAncestors === "") && !(Array.isArray(frameAncestors) && frameAncestors.length > 0 && frameAncestors.every(
      (source) => typeof source === "string" && source !== ""
    )))
      throw new ApiError(
        400,
        `"frameAncestors" in ${APP_MANIFEST} must be a string or a non-empty list of strings.`
      );
    return {
      ...name === void 0 ? {} : { name },
      streamWebFolder,
      ...logo === void 0 ? {} : { logo },
      ...frameAncestors === void 0 ? {} : { frameAncestors }
    };
  };
  var splitAppBundle = (tree) => {
    if (!isObject(tree) || !Array.isArray(tree.members))
      return { tree };
    const members = tree.members;
    const at = members.findIndex(
      (member2) => isObject(member2) && member2.type === "file" && member2.name === APP_MANIFEST
    );
    if (at === -1) return { tree };
    const member = members[at];
    if (typeof member.code !== "string")
      throw new ApiError(400, `${APP_MANIFEST} carries no text.`);
    let parsed;
    try {
      parsed = JSON.parse(member.code);
    } catch (error) {
      throw new ApiError(
        400,
        `${APP_MANIFEST} is not valid JSON: ${error.message}`
      );
    }
    return {
      tree: {
        ...tree,
        members: members.filter((_, index) => index !== at)
      },
      manifest: parseAppManifest(parsed)
    };
  };
  var publishRequestFor = (deploy, manifest) => {
    const streamWebFolder = deploy.streamWebFolder ?? manifest?.streamWebFolder;
    if (streamWebFolder === void 0) return void 0;
    const name = deploy.streamServiceName ?? manifest?.name;
    const logo = deploy.streamLogo ?? manifest?.logo;
    return {
      appLoc: deploy.appLoc,
      streamWebFolder,
      ...name === void 0 ? {} : { name },
      ...logo === void 0 ? {} : { logo },
      ...manifest?.frameAncestors === void 0 ? {} : { frameAncestors: manifest.frameAncestors }
    };
  };

  // src/host/dispatch.ts
  var SECONDS_IN_A_DAY = 86400;
  var RUN_ROUTES = [
    "GET /SASjsApi/stp/execute",
    "POST /SASjsApi/stp/execute",
    "POST /SASjsApi/stp/trigger",
    "POST /SASjsApi/code/execute",
    "POST /SASjsApi/code/trigger"
  ];
  var given = (value) => typeof value === "string" && value !== "" ? value : void 0;
  var replaceOf = (value) => {
    if (value === void 0 || value === "") return void 0;
    if (typeof value === "boolean") return value;
    const text2 = String(value).trim().toLowerCase();
    if (text2 === "true") return true;
    if (text2 === "false") return false;
    throw new ApiError(400, '"replace" must be true or false.');
  };
  var validate = (route, request) => {
    for (const param of route.params) {
      if (!param.required || param.in === "formData" || param.in === "header")
        continue;
      if (param.in === "path") continue;
      const given2 = param.in === "query" ? request.query?.[param.name] : request.body?.[param.name];
      if (given2 === void 0)
        throw new ApiError(400, `"${param.name}" is required`);
      if (given2 === "")
        throw new ApiError(400, `"${param.name}" is not allowed to be empty`);
    }
  };
  var targetPath = (request) => {
    const fromQuery = request.query?._filePath;
    const fromBody = request.body?.filePath;
    const path = fromQuery !== void 0 ? String(fromQuery) : fromBody;
    if (path === void 0) throw new ApiError(400, '"_filePath" is required');
    return path;
  };
  var dispatch = async (services, routeId, request = {}) => {
    const route = routeById(routeId);
    if (!route) throw new ApiError(404, `No such operation: ${routeId}`);
    const { drive, identity, records, code } = services;
    const identityScoped = ["User", "Group", "Permission", "Client"].includes(route.tag) || routeId === "PATCH /SASjsApi/auth/updatePassword";
    const runtimeScoped = RUN_ROUTES.includes(routeId);
    if (identityScoped && records || runtimeScoped && services.runtime) {
      const subject = request.subject ?? (identity ? await identity.authenticate(request.token) : void 0);
      if (!subject) {
        if (!identity)
          throw new ApiError(
            501,
            `This host has no identity service, so it cannot answer ${routeId}.`
          );
        throw new ApiError(401, "Unauthorized");
      }
    }
    validate(route, request);
    const query = request.query || {};
    const body = request.body || {};
    const params = request.params || {};
    const sessionRequired = () => {
      if (!services.session)
        throw new ApiError(
          501,
          `This host has no session service, so it cannot answer ${routeId}.`
        );
      return services.session;
    };
    const runtimeRequired = () => {
      if (!services.runtime)
        throw new ApiError(
          501,
          `This host has no runtime service, so it cannot answer ${routeId}.`
        );
      return services.runtime;
    };
    const uploaded = () => {
      const files = request.files || (request.file ? [request.file] : []);
      if (!files.length) return void 0;
      return files.reduce((byName, file) => {
        byName[file.name] = file.contents;
        return byName;
      }, {});
    };
    const artifact = (output) => ({
      status: 200,
      contents: output.contents
    });
    const required = () => {
      if (!records)
        throw new ApiError(
          501,
          `This host has no record service, so it cannot answer ${routeId}.`
        );
      return records;
    };
    const caller = async () => {
      if (request.subject) return request.subject;
      return identity?.authenticate(request.token);
    };
    if (routeId.startsWith("POST /SASjsApi/auth/") || routeId.startsWith("POST /SASLogon/") || routeId === "GET /SASLogon/logout" || routeId === "GET /SASjsApi/session") {
      if (!identity)
        throw new ApiError(
          501,
          `This host has no identity service, so it cannot answer ${routeId}.`
        );
      switch (routeId) {
        case "POST /SASjsApi/auth/token":
          return {
            status: 200,
            body: await identity.token({
              clientId: String(body.clientId ?? ""),
              code: body.code
            })
          };
        case "POST /SASjsApi/auth/refresh":
          return { status: 200, body: await identity.refresh(request.token) };
        case "POST /SASjsApi/auth/logout":
          await identity.logout(await caller());
          return { status: 204 };
        case "POST /SASLogon/login":
          return {
            status: 200,
            body: await identity.login({
              username: String(body.username ?? ""),
              password: String(body.password ?? "")
            })
          };
        case "POST /SASLogon/authorize":
          return {
            status: 200,
            body: {
              code: await identity.authorize(
                await caller(),
                String(body.clientId ?? "")
              )
            }
          };
        case "GET /SASLogon/logout":
          return { status: 200, contents: await identity.logoutSession() };
        case "GET /SASjsApi/session":
          return { status: 200, body: await identity.session(await caller()) };
      }
    }
    switch (routeId) {
      // The shell is a body, not JSON: an HTML page served with the content type
      // the document states, as it came from the host (stamped, if it references
      // a bundle).
      case "GET /": {
        if (!services.home)
          throw new ApiError(
            501,
            `This host has no home service, so it cannot answer ${routeId}.`
          );
        return { status: 200, contents: await services.home.home() };
      }
      // The one answer a host states rather than derives: public, pre-auth, and
      // read by the login screen before anything else.
      case "GET /SASjsApi/info": {
        if (!services.info)
          throw new ApiError(
            501,
            `This host has no info service, so it cannot answer ${routeId}.`
          );
        return { status: 200, body: await services.info.info() };
      }
      // ------------------------------------------------- a host's own reports
      //
      // The administrator middleware is the host's (sasjs/server mounts
      // authenticateAccessToken and verifyAdmin ahead of all of these), which is
      // why their 401 is marked host-only in the overlay. The package answers a
      // body, and for a log tail the refusals that belong to the name rule.
      case "GET /SASjsApi/admin/diagnostics": {
        if (!services.admin)
          throw new ApiError(
            501,
            `This host has no admin service, so it cannot answer ${routeId}.`
          );
        return { status: 200, body: await services.admin.diagnostics() };
      }
      case "GET /SASjsApi/admin/logs": {
        if (!services.admin)
          throw new ApiError(
            501,
            `This host has no admin service, so it cannot answer ${routeId}.`
          );
        return { status: 200, body: { files: await services.admin.logs() } };
      }
      case "GET /SASjsApi/admin/logs/{fileName}": {
        if (!services.admin)
          throw new ApiError(
            501,
            `This host has no admin service, so it cannot answer ${routeId}.`
          );
        return {
          status: 200,
          body: await services.admin.logTail(
            String(params.fileName ?? ""),
            query.lines
          )
        };
      }
      case "GET /SASjsApi/authConfig": {
        if (!services.authConfig)
          throw new ApiError(
            501,
            `This host has no auth-config service, so it cannot answer ${routeId}.`
          );
        return { status: 200, body: await services.authConfig.authConfig() };
      }
      case "POST /SASjsApi/authConfig/synchroniseWithLDAP": {
        if (!services.directory)
          throw new ApiError(
            501,
            `This host has no directory service, so it cannot answer ${routeId}.`
          );
        return { status: 200, body: await services.directory.synchronise() };
      }
      case "GET /SASjsApi/drive/file": {
        const file = await drive.read(String(query._filePath || ""));
        return { status: 200, contents: file.contents };
      }
      case "POST /SASjsApi/drive/file":
      case "PATCH /SASjsApi/drive/file": {
        if (!request.file) throw new ApiError(400, '"file" is not present.');
        const path = targetPath(request);
        const result = routeId === "PATCH /SASjsApi/drive/file" ? await drive.update(path, request.file.contents) : await drive.save(path, request.file.contents);
        return { status: 200, body: result };
      }
      case "DELETE /SASjsApi/drive/file":
        return {
          status: 200,
          body: await drive.remove(String(query._filePath || ""))
        };
      case "GET /SASjsApi/drive/folder":
        return { status: 200, body: await drive.list(query._folderPath) };
      case "POST /SASjsApi/drive/folder":
        return {
          status: 200,
          body: await drive.mkdir(String(request.body?.folderPath || ""))
        };
      case "DELETE /SASjsApi/drive/folder":
        return {
          status: 200,
          body: await drive.rmdir(String(query._folderPath || ""))
        };
      case "POST /SASjsApi/drive/rename":
        return {
          status: 200,
          body: await drive.rename(
            String(request.body?.oldPath || ""),
            String(request.body?.newPath || "")
          )
        };
      // The archive is the host's transport - multer and a zip library on a
      // server, `DecompressionStream` in a worker - and it hands this the same tree
      // `POST /deploy` takes. The deploy cap is measured on that tree, after
      // expansion, which is why the two share this path rather than reading bytes.
      case "POST /SASjsApi/drive/deploy/upload":
      case "POST /SASjsApi/drive/deploy": {
        const bundle = splitAppBundle(body.fileTree);
        const isUpload = routeId === "POST /SASjsApi/drive/deploy/upload";
        const setting = (name) => isUpload ? given(query[name]) ?? body?.[name] : body?.[name];
        const appLoc = String(setting("appLoc") ?? "");
        const requested = services.appStream ? publishRequestFor(
          {
            appLoc,
            streamWebFolder: given(setting("streamWebFolder")),
            streamServiceName: given(setting("streamServiceName")),
            streamLogo: given(setting("streamLogo"))
          },
          bundle.manifest
        ) : void 0;
        const folderFromManifest = requested?.streamWebFolder !== void 0 && given(setting("streamWebFolder")) === void 0 && bundle.manifest?.streamWebFolder !== void 0;
        const publish = requested === void 0 ? void 0 : checkPublishRequest(requested, bundle.tree, { folderFromManifest });
        const replace = replaceOf(setting("replace")) ?? isUpload;
        await drive.deploy(appLoc, bundle.tree, { replace });
        if (publish === void 0 || !services.appStream)
          return { status: 200, body: DEPLOY_SUCCESS };
        const entry = await services.appStream.publish(publish);
        return {
          status: 200,
          body: { ...DEPLOY_SUCCESS, app: appSummary(entry) }
        };
      }
      case "DELETE /SASjsApi/drive/deploy": {
        if (!services.appStream)
          throw new ApiError(
            501,
            `This host has no app stream, so it cannot answer ${routeId}.`
          );
        const removed = await services.appStream.unpublish(String(body.id ?? ""));
        return {
          status: 200,
          body: { status: "success", app: appSummary(removed) }
        };
      }
      case "GET /SASjsApi/drive/filetree":
        return { status: 200, body: await drive.tree(query._folderPath) };
      // ------------------------------------------------------------- run times
      //
      // A stored program is named by a drive path and a code buffer travels in the
      // body; either way the package decides everything about the request and the
      // host's runner does the work.
      case "GET /SASjsApi/stp/execute": {
        const output = await runtimeRequired().execute(await caller(), {
          source: "program",
          program: query._program,
          vars: { ...query },
          files: uploaded()
        });
        return artifact(output);
      }
      case "POST /SASjsApi/stp/execute": {
        const output = await runtimeRequired().execute(await caller(), {
          source: "program",
          program: query._program || body._program,
          vars: { ...query, ...body },
          files: uploaded()
        });
        return artifact(output);
      }
      case "POST /SASjsApi/stp/trigger":
        return {
          status: 200,
          body: await runtimeRequired().trigger(await caller(), {
            source: "program",
            program: query._program,
            vars: { ...query },
            expiresAfterMins: query.expiresAfterMins
          })
        };
      case "POST /SASjsApi/code/execute": {
        const output = await runtimeRequired().execute(await caller(), {
          source: "code",
          code: body.code,
          runTime: body.runTime,
          vars: { ...query, ...body },
          files: uploaded()
        });
        return artifact(output);
      }
      case "POST /SASjsApi/code/trigger":
        return {
          status: 200,
          body: await runtimeRequired().trigger(await caller(), {
            source: "code",
            code: body.code,
            runTime: body.runTime,
            vars: { ...query, ...body },
            expiresAfterMins: body.expiresAfterMins
          })
        };
      // ------------------------------------------------------------- sessions
      case "GET /SASjsApi/session/{sessionId}": {
        return {
          status: 200,
          body: await sessionRequired().summary(
            await caller(),
            String(params.sessionId ?? "")
          )
        };
      }
      case "GET /SASjsApi/session/{sessionId}/log": {
        return {
          status: 200,
          contents: await sessionRequired().log(
            await caller(),
            String(params.sessionId ?? "")
          )
        };
      }
      case "GET /SASjsApi/session/{sessionId}/output": {
        const artifact2 = await sessionRequired().output(
          await caller(),
          String(params.sessionId ?? "")
        );
        return { status: 200, contents: artifact2.contents };
      }
      case "GET /SASjsApi/session/{sessionId}/state": {
        return {
          status: 200,
          body: await sessionRequired().state(
            await caller(),
            String(params.sessionId ?? "")
          )
        };
      }
      // ------------------------------------------------------------- records
      //
      // The administration routes: users, groups, permission rules, clients and the
      // caller's own password. Each handler resolves the caller and passes it on;
      // the admin gate and the wording live in the service.
      case "GET /SASjsApi/user":
        return { status: 200, body: await required().listUsers(await caller()) };
      case "GET /SASjsApi/user/{uid}":
        return {
          status: 200,
          body: await required().getUser(await caller(), {
            uid: String(params.uid ?? "")
          })
        };
      case "GET /SASjsApi/user/by/username/{username}":
        return {
          status: 200,
          body: await required().getUser(await caller(), {
            username: String(params.username ?? "")
          })
        };
      case "POST /SASjsApi/user":
        return {
          status: 200,
          body: await required().createUser(await caller(), {
            username: String(body.username ?? ""),
            displayName: String(body.displayName ?? ""),
            password: String(body.password ?? ""),
            isAdmin: body.isAdmin,
            isActive: body.isActive,
            autoExec: body.autoExec
          })
        };
      case "PATCH /SASjsApi/user/{uid}":
        return {
          status: 200,
          body: await required().updateUser(
            await caller(),
            { uid: String(params.uid ?? "") },
            body
          )
        };
      case "PATCH /SASjsApi/user/by/username/{username}":
        return {
          status: 200,
          body: await required().updateUser(
            await caller(),
            { username: String(params.username ?? "") },
            body
          )
        };
      case "DELETE /SASjsApi/user/{uid}":
        return {
          status: 200,
          body: await required().deleteUser(
            await caller(),
            { uid: String(params.uid ?? "") },
            { password: body.password }
          )
        };
      case "DELETE /SASjsApi/user/by/username/{username}":
        return {
          status: 200,
          body: await required().deleteUser(
            await caller(),
            { username: String(params.username ?? "") },
            { password: body.password }
          )
        };
      case "POST /SASjsApi/code/lint":
        if (!code)
          throw new ApiError(
            501,
            `This host has no code service, so it cannot answer ${routeId}.`
          );
        return {
          status: 200,
          body: await code.lint(await caller(), {
            code: body.code,
            filePath: body.filePath
          })
        };
      case "POST /SASjsApi/code/format":
        if (!code)
          throw new ApiError(
            501,
            `This host has no code service, so it cannot answer ${routeId}.`
          );
        return {
          status: 200,
          body: await code.format(await caller(), {
            code: body.code,
            filePath: body.filePath
          })
        };
      case "GET /SASjsApi/info/authorizedRoutes":
        return {
          status: 200,
          body: await required().listAuthorizedRoutes(await caller())
        };
      case "GET /SASjsApi/info/myAuthorizedRoutes":
        return {
          status: 200,
          body: await required().myAuthorizedRoutes(await caller())
        };
      case "GET /SASjsApi/group":
        return { status: 200, body: await required().listGroups(await caller()) };
      case "GET /SASjsApi/group/{uid}":
        return {
          status: 200,
          body: await required().getGroup(await caller(), {
            uid: String(params.uid ?? "")
          })
        };
      case "GET /SASjsApi/group/by/groupname/{name}":
        return {
          status: 200,
          body: await required().getGroup(await caller(), {
            name: String(params.name ?? "")
          })
        };
      case "POST /SASjsApi/group":
        return {
          status: 200,
          body: await required().createGroup(await caller(), {
            name: String(body.name ?? ""),
            description: String(body.description ?? ""),
            isActive: body.isActive
          })
        };
      case "POST /SASjsApi/group/{groupUid}/{userUid}":
        return {
          status: 200,
          body: await required().addUserToGroup(
            await caller(),
            String(params.groupUid ?? ""),
            String(params.userUid ?? "")
          )
        };
      case "DELETE /SASjsApi/group/{groupUid}/{userUid}":
        return {
          status: 200,
          body: await required().removeUserFromGroup(
            await caller(),
            String(params.groupUid ?? ""),
            String(params.userUid ?? "")
          )
        };
      case "DELETE /SASjsApi/group/{uid}":
        await required().deleteGroup(await caller(), String(params.uid ?? ""));
        return { status: 200 };
      case "GET /SASjsApi/permission":
        return {
          status: 200,
          body: await required().listPermissions(await caller())
        };
      case "POST /SASjsApi/permission":
        return {
          status: 200,
          body: await required().createPermission(await caller(), {
            path: String(body.path ?? ""),
            type: String(body.type ?? ""),
            setting: String(body.setting ?? ""),
            principalType: String(body.principalType ?? ""),
            principalId: String(body.principalId ?? "")
          })
        };
      case "PATCH /SASjsApi/permission/{uid}":
        return {
          status: 200,
          body: await required().updatePermission(
            await caller(),
            String(params.uid ?? ""),
            { setting: String(body.setting ?? "") }
          )
        };
      case "DELETE /SASjsApi/permission/{uid}":
        return {
          status: 200,
          body: await required().deletePermission(
            await caller(),
            String(params.uid ?? "")
          )
        };
      case "GET /SASjsApi/client":
        return { status: 200, body: await required().listClients(await caller()) };
      case "POST /SASjsApi/client":
        return {
          status: 200,
          // An omitted lifetime is the schema's default, not NaN: the server's
          // Client model declares 86400 and 2592000, and a NaN lifetime would make
          // every token the client buys expire on arrival.
          body: await required().createClient(await caller(), {
            clientId: String(body.clientId ?? ""),
            clientSecret: String(body.clientSecret ?? ""),
            accessTokenExpiration: body.accessTokenExpiration === void 0 ? SECONDS_IN_A_DAY : Number(body.accessTokenExpiration),
            refreshTokenExpiration: body.refreshTokenExpiration === void 0 ? SECONDS_IN_A_DAY * 30 : Number(body.refreshTokenExpiration)
          })
        };
      case "PATCH /SASjsApi/auth/updatePassword":
        await required().updatePassword(await caller(), {
          currentPassword: String(body.currentPassword ?? ""),
          newPassword: String(body.newPassword ?? "")
        });
        return { status: 204 };
      default:
        throw noHandler(routeId);
    }
  };
  var noHandler = (routeId) => {
    const reason = routeById(routeId)?.reason;
    return new ApiError(
      501,
      `This package has no handler for ${routeId}.${reason ? ` ${reason}` : ""}`
    );
  };
  var HANDLED_ROUTES = [
    "GET /",
    "GET /SASjsApi/info",
    "GET /SASjsApi/admin/diagnostics",
    "GET /SASjsApi/admin/logs",
    "GET /SASjsApi/admin/logs/{fileName}",
    "GET /SASjsApi/authConfig",
    "POST /SASjsApi/authConfig/synchroniseWithLDAP",
    "POST /SASjsApi/drive/deploy/upload",
    "DELETE /SASjsApi/drive/deploy",
    "GET /SASjsApi/stp/execute",
    "POST /SASjsApi/stp/execute",
    "POST /SASjsApi/stp/trigger",
    "POST /SASjsApi/code/execute",
    "POST /SASjsApi/code/trigger",
    "GET /SASjsApi/session/{sessionId}",
    "GET /SASjsApi/session/{sessionId}/log",
    "GET /SASjsApi/session/{sessionId}/output",
    "GET /SASjsApi/session/{sessionId}/state",
    "POST /SASjsApi/code/lint",
    "POST /SASjsApi/code/format",
    "GET /SASjsApi/info/authorizedRoutes",
    "GET /SASjsApi/info/myAuthorizedRoutes",
    "GET /SASjsApi/drive/file",
    "POST /SASjsApi/drive/file",
    "PATCH /SASjsApi/drive/file",
    "DELETE /SASjsApi/drive/file",
    "GET /SASjsApi/drive/folder",
    "POST /SASjsApi/drive/folder",
    "DELETE /SASjsApi/drive/folder",
    "POST /SASjsApi/drive/rename",
    "GET /SASjsApi/drive/filetree",
    "POST /SASjsApi/drive/deploy",
    "POST /SASjsApi/auth/token",
    "POST /SASjsApi/auth/refresh",
    "POST /SASjsApi/auth/logout",
    "POST /SASLogon/login",
    "POST /SASLogon/authorize",
    "GET /SASLogon/logout",
    "GET /SASjsApi/session",
    "GET /SASjsApi/user",
    "GET /SASjsApi/user/{uid}",
    "GET /SASjsApi/user/by/username/{username}",
    "POST /SASjsApi/user",
    "PATCH /SASjsApi/user/{uid}",
    "PATCH /SASjsApi/user/by/username/{username}",
    "DELETE /SASjsApi/user/{uid}",
    "DELETE /SASjsApi/user/by/username/{username}",
    "GET /SASjsApi/group",
    "GET /SASjsApi/group/{uid}",
    "GET /SASjsApi/group/by/groupname/{name}",
    "POST /SASjsApi/group",
    "POST /SASjsApi/group/{groupUid}/{userUid}",
    "DELETE /SASjsApi/group/{groupUid}/{userUid}",
    "DELETE /SASjsApi/group/{uid}",
    "GET /SASjsApi/permission",
    "POST /SASjsApi/permission",
    "PATCH /SASjsApi/permission/{uid}",
    "DELETE /SASjsApi/permission/{uid}",
    "GET /SASjsApi/client",
    "POST /SASjsApi/client",
    "PATCH /SASjsApi/auth/updatePassword"
  ];

  // src/identity/routeAccess.ts
  var TOP_LEVEL_ROUTES = ["/AppStream", "/SASjsApi"];
  var ALWAYS_VISIBLE_ROUTES = ["/AppStream"];
  var STATIC_AUTHORIZED_ROUTES = [
    "/SASjsApi/code/execute",
    "/SASjsApi/stp/execute",
    "/SASjsApi/drive/deploy",
    "/SASjsApi/drive/deploy/upload",
    "/SASjsApi/drive/file",
    "/SASjsApi/drive/folder",
    "/SASjsApi/drive/fileTree",
    "/SASjsApi/drive/rename"
  ];
  var DEFAULT_GRANTABLE_ROUTES = [
    ...TOP_LEVEL_ROUTES,
    ...STATIC_AUTHORIZED_ROUTES
  ];
  var topLevelRouteFor = (routePath) => TOP_LEVEL_ROUTES.find(
    (route) => routePath.toLowerCase().startsWith(route.toLowerCase())
  ) ?? routePath;
  var settingOn = (rules, path) => rules.find((rule) => rule.path === path)?.setting;
  var GRANT = "Grant";
  var DENY = "Deny";
  var isRouteGranted = (rules, path, topLevelRoute = topLevelRouteFor(path)) => {
    const userSetting = settingOn(rules.user, path) ?? settingOn(rules.user, topLevelRoute);
    if (userSetting) return userSetting === GRANT;
    const onPath = rules.group.filter((rule) => rule.path === path);
    if (onPath.some((rule) => rule.setting === GRANT)) return true;
    if (onPath.some((rule) => rule.setting === DENY)) return false;
    return rules.group.some(
      (rule) => rule.path === topLevelRoute && rule.setting === GRANT
    );
  };

  // src/identity/service.ts
  var unauthorized = () => new ApiError(401, "Unauthorized");
  var liveSubject = async (store, subject) => {
    const user3 = await store.userById(subject.userId);
    if (!user3 || !user3.isActive) throw unauthorized();
    return subject;
  };
  var createIdentityService = (store) => ({
    async authenticate(token) {
      if (token === void 0) return void 0;
      const subject = await store.readAccess(token);
      if (!subject) return void 0;
      const user3 = await store.userById(subject.userId);
      return user3 && user3.isActive ? subject : void 0;
    },
    async login({ username, password }) {
      const user3 = await store.userByName(username);
      if (!user3) throw new ApiError(401, "Username is not found.");
      if (!await store.passwordMatches(user3, password))
        throw new ApiError(401, "Invalid Password.");
      if (!user3.isActive) throw new ApiError(401, "This account is not active.");
      return {
        loggedIn: true,
        user: {
          uid: user3.uid,
          username: user3.username,
          displayName: user3.displayName,
          isAdmin: user3.isAdmin,
          needsToUpdatePassword: user3.needsToUpdatePassword
        }
      };
    },
    async authorize(subject, clientId) {
      if (!subject) throw unauthorized();
      if (!await store.client(clientId))
        throw new ApiError(403, "Invalid clientId.");
      const named = await liveSubject(store, subject);
      return store.issueCode({ userId: named.userId, clientId });
    },
    async token({ clientId, code }) {
      const subject = await store.readCode(code);
      if (!subject || subject.clientId !== clientId)
        throw new ApiError(401, "Invalid Auth Code");
      const client = await store.client(clientId);
      if (!client) throw new ApiError(401, "Invalid clientId.");
      const named = await liveSubject(store, subject);
      if (!await store.claimCode(code))
        throw new ApiError(401, "Invalid Auth Code");
      const existing = await store.pairFor(named);
      if (existing) return existing;
      const pair = await store.issue(named, client);
      await store.savePair(named, pair);
      return pair;
    },
    async refresh(token) {
      const subject = token === void 0 ? void 0 : await store.readRefresh(token);
      if (!subject) throw unauthorized();
      const client = await store.client(subject.clientId);
      if (!client) throw new ApiError(401, "Invalid clientId.");
      const named = await liveSubject(store, subject);
      const pair = await store.issue(named, client);
      await store.savePair(named, pair);
      return pair;
    },
    async logout(subject) {
      if (!subject) throw unauthorized();
      await store.deletePair(subject);
    },
    async logoutSession() {
      return "OK!";
    },
    async session(subject) {
      if (!subject) throw unauthorized();
      const user3 = await store.userById(subject.userId);
      if (!user3 || !user3.isActive) throw unauthorized();
      return asSession(user3);
    }
  });
  var asSession = (user3) => ({
    uid: user3.uid,
    username: user3.username,
    displayName: user3.displayName,
    isAdmin: user3.isAdmin,
    needsToUpdatePassword: user3.needsToUpdatePassword
  });

  // src/identity/records.ts
  var ALL_USERS_GROUP = "all-users";
  var PUBLIC_GROUP = "public";
  var unauthorized2 = () => new ApiError(401, "Unauthorized");
  var requireCaller = async (store, caller) => {
    if (!caller) throw unauthorized2();
    const user3 = await store.userById(caller.userId);
    if (!user3 || !user3.isActive) throw unauthorized2();
    return user3;
  };
  var requireAdmin = async (store, caller) => {
    const user3 = await requireCaller(store, caller);
    if (!user3.isAdmin) throw new ApiError(401, "Admin account required");
    return user3;
  };
  var requireSelfOrAdmin = async (store, caller, target) => {
    const user3 = await requireCaller(store, caller);
    if (!user3.isAdmin && user3.uid !== target?.uid)
      throw new ApiError(401, "Admin account required");
    return user3;
  };
  var MAX_DISPLAY_NAME_LENGTH = 100;
  var sanitiseDisplayName = (value) => String(value ?? "").replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, MAX_DISPLAY_NAME_LENGTH);
  var asUser = (user3) => ({
    uid: user3.uid,
    username: user3.username,
    displayName: user3.displayName,
    isAdmin: user3.isAdmin
  });
  var asGroup = (group) => ({
    uid: group.uid,
    name: group.name,
    description: group.description
  });
  var createRecordService = (store, options = {}) => {
    const grantableRoutes = options.grantableRoutes || DEFAULT_GRANTABLE_ROUTES;
    const groupDetails = async (group) => {
      const members = [];
      for (const uid of group.users) {
        const user3 = await store.userById(uid);
        if (user3) members.push(asUser(user3));
      }
      return { ...asGroup(group), isActive: group.isActive, users: members };
    };
    const userDetails = async (user3, withAutoExec) => {
      const groups = [];
      for (const uid of user3.groups) {
        const group = await store.groupById(uid);
        if (group) groups.push(asGroup(group));
      }
      const details = {
        ...asUser(user3),
        isActive: user3.isActive,
        needsToUpdatePassword: user3.needsToUpdatePassword,
        groups
      };
      if (withAutoExec) details.autoExec = user3.autoExec ?? "";
      return details;
    };
    const findBy = async (by) => by.uid !== void 0 ? store.userById(by.uid) : store.userByName(by.username ?? "");
    const permissionDetails = async (permission) => ({
      uid: permission.uid,
      path: permission.path,
      type: permission.type,
      setting: permission.setting,
      ...permission.user ? { user: permission.user } : {},
      ...permission.group ? { group: permission.group } : {}
    });
    return {
      async listUsers(caller) {
        await requireCaller(store, caller);
        const users = await store.users();
        return users.map(asUser);
      },
      async getUser(caller, by) {
        const reader = await requireCaller(store, caller);
        const user3 = await findBy(by);
        if (!user3) throw new ApiError(404, "User is not found.");
        const withAutoExec = reader.isAdmin || reader.uid === user3.uid;
        return userDetails(user3, withAutoExec);
      },
      async createUser(caller, body) {
        await requireAdmin(store, caller);
        if (await store.userByName(body.username))
          throw new ApiError(409, "Username already exists.");
        const created = await store.createUser({
          username: body.username,
          displayName: sanitiseDisplayName(body.displayName),
          isAdmin: body.isAdmin === true,
          isActive: body.isActive !== false,
          autoExec: body.autoExec
        });
        await store.setPassword(created.uid, body.password);
        const allUsers = await store.groupByName(ALL_USERS_GROUP);
        if (allUsers) await store.addToGroup(allUsers.uid, created.uid);
        const stored = await store.userById(created.uid);
        return userDetails(stored ?? created, true);
      },
      async updateUser(caller, by, body) {
        const current = await findBy(by);
        await requireSelfOrAdmin(store, caller, current);
        const change = {};
        const displayName = sanitiseDisplayName(body.displayName);
        if (body.username && body.username !== current?.username && current?.authProvider)
          throw new ApiError(
            405,
            "Can not update username of user that is created by an external auth provider."
          );
        if (displayName && displayName !== current?.displayName && current?.authProvider)
          throw new ApiError(
            405,
            "Can not update display name of user that is created by an external auth provider."
          );
        if (body.username) {
          const holder = await store.userByName(body.username);
          if (holder && holder.uid !== current?.uid)
            throw new ApiError(409, "Username already exists.");
          change.username = body.username;
        }
        if (displayName) change.displayName = displayName;
        if (body.isAdmin !== void 0) change.isAdmin = body.isAdmin;
        if (body.isActive !== void 0) change.isActive = body.isActive;
        if (body.autoExec !== void 0) change.autoExec = body.autoExec;
        const updated = current ? await store.updateUser(current.uid, change) : void 0;
        if (!updated)
          throw new ApiError(
            404,
            `Unable to find user with ${by.uid || by.username}`
          );
        if (body.password) await store.setPassword(updated.uid, body.password);
        const stored = await store.userById(updated.uid);
        return userDetails(stored ?? updated, true);
      },
      async deleteUser(caller, by, body) {
        const current = await findBy(by);
        const actor = await requireSelfOrAdmin(store, caller, current);
        if (!current) throw new ApiError(404, "User is not found.");
        if (!actor.isAdmin) {
          if (!await store.passwordMatches(current, body.password ?? ""))
            throw new ApiError(401, "Invalid password.");
        }
        await store.deleteUser(current.uid);
        return "Account Deleted!";
      },
      async listGroups(caller) {
        await requireCaller(store, caller);
        const groups = await store.groups();
        return groups.map(asGroup);
      },
      async getGroup(caller, by) {
        await requireCaller(store, caller);
        const group = by.uid !== void 0 ? await store.groupById(by.uid) : await store.groupByName(by.name ?? "");
        if (!group) throw new ApiError(404, "Group not found.");
        return groupDetails(group);
      },
      async createGroup(caller, body) {
        await requireAdmin(store, caller);
        if (await store.groupByName(body.name))
          throw new ApiError(409, "Group name already exists.");
        const created = await store.createGroup({
          name: body.name,
          description: body.description,
          isActive: body.isActive !== false
        });
        return groupDetails(created);
      },
      async deleteGroup(caller, uid) {
        await requireAdmin(store, caller);
        if (!await store.groupById(uid))
          throw new ApiError(404, "Group not found.");
        await store.deleteGroup(uid);
      },
      async addUserToGroup(caller, groupUid, userUid) {
        await requireAdmin(store, caller);
        const group = await store.groupById(groupUid);
        if (!group) throw new ApiError(404, "Group not found.");
        if (group.name === PUBLIC_GROUP)
          throw new ApiError(
            400,
            `Can't add/remove user to '${PUBLIC_GROUP}' group.`
          );
        if (group.authProvider)
          throw new ApiError(
            405,
            "Can't add/remove user to group created by external auth provider."
          );
        const user3 = await store.userById(userUid);
        if (!user3) throw new ApiError(404, "User not found.");
        if (user3.authProvider)
          throw new ApiError(
            405,
            "Can't add/remove user to group created by external auth provider."
          );
        const updated = await store.addToGroup(groupUid, userUid);
        if (!updated) throw new ApiError(400, "Unable to update group.");
        return groupDetails(updated);
      },
      async removeUserFromGroup(caller, groupUid, userUid) {
        await requireAdmin(store, caller);
        const group = await store.groupById(groupUid);
        if (!group) throw new ApiError(404, "Group not found.");
        if (group.name === PUBLIC_GROUP)
          throw new ApiError(
            400,
            `Can't add/remove user to '${PUBLIC_GROUP}' group.`
          );
        if (group.authProvider)
          throw new ApiError(
            405,
            "Can't add/remove user to group created by external auth provider."
          );
        const user3 = await store.userById(userUid);
        if (!user3) throw new ApiError(404, "User not found.");
        if (user3.authProvider)
          throw new ApiError(
            405,
            "Can't add/remove user to group created by external auth provider."
          );
        const updated = await store.removeFromGroup(groupUid, userUid);
        if (!updated) throw new ApiError(400, "Unable to update group.");
        return groupDetails(updated);
      },
      async listAuthorizedRoutes(caller) {
        const reader = await requireCaller(store, caller);
        if (!reader.isAdmin) throw new ApiError(401, "Admin account required");
        return { paths: [...grantableRoutes] };
      },
      async myAuthorizedRoutes(caller) {
        const reader = await requireCaller(store, caller);
        if (reader.isAdmin) return { paths: [...grantableRoutes] };
        const rules = await store.permissions();
        const mine = {
          user: rules.filter((rule) => rule.user === reader.uid).map((rule) => ({ path: rule.path, setting: rule.setting })),
          group: rules.filter(
            (rule) => rule.group !== void 0 && reader.groups.includes(rule.group)
          ).map((rule) => ({ path: rule.path, setting: rule.setting }))
        };
        const publicGroup = (await store.groups()).find(
          (group) => group.name === "public"
        );
        const publicGrants = publicGroup ? rules.filter(
          (rule) => rule.group === publicGroup.uid && rule.setting === "Grant"
        ).map((rule) => rule.path) : [];
        return {
          paths: grantableRoutes.filter(
            (path) => ALWAYS_VISIBLE_ROUTES.includes(path) || publicGrants.includes(path) || isRouteGranted(mine, path, topLevelRouteFor(path))
          )
        };
      },
      async listPermissions(caller) {
        const reader = await requireCaller(store, caller);
        const rules = await store.permissions();
        const visible = reader.isAdmin ? rules : rules.filter(
          (rule) => rule.user === reader.uid || rule.group !== void 0 && reader.groups.includes(rule.group)
        );
        const out = [];
        for (const rule of visible) out.push(await permissionDetails(rule));
        return out;
      },
      async createPermission(caller, body) {
        await requireAdmin(store, caller);
        if (body.principalType === "user") {
          const user3 = await store.userById(body.principalId);
          if (!user3) throw new ApiError(404, "User not found.");
          if (user3.isAdmin)
            throw new ApiError(400, "Can not add permission for admin user.");
          const exists = (await store.permissions()).some(
            (rule) => rule.path === body.path && rule.type === body.type && rule.user === body.principalId
          );
          if (exists)
            throw new ApiError(
              409,
              "Permission already exists with provided Path, Type and User."
            );
          const created = await store.createPermission({
            path: body.path,
            type: body.type,
            setting: body.setting,
            user: body.principalId
          });
          return permissionDetails(created);
        }
        if (body.principalType === "group") {
          const group = await store.groupById(body.principalId);
          if (!group) throw new ApiError(404, "Group not found.");
          const exists = (await store.permissions()).some(
            (rule) => rule.path === body.path && rule.type === body.type && rule.group === body.principalId
          );
          if (exists)
            throw new ApiError(
              409,
              "Permission already exists with provided Path, Type and Group."
            );
          const created = await store.createPermission({
            path: body.path,
            type: body.type,
            setting: body.setting,
            group: body.principalId
          });
          return permissionDetails(created);
        }
        throw new ApiError(
          400,
          "Invalid principal type. Valid types are user or group."
        );
      },
      async updatePermission(caller, uid, body) {
        await requireAdmin(store, caller);
        const updated = await store.setPermissionSetting(uid, body.setting);
        if (!updated) throw new ApiError(404, "Permission not found.");
        return permissionDetails(updated);
      },
      async deletePermission(caller, uid) {
        await requireAdmin(store, caller);
        if (!await store.permissionById(uid))
          throw new ApiError(404, "Permission not found.");
        await store.deletePermission(uid);
        return "Permission Deleted!";
      },
      async listClients(caller) {
        await requireAdmin(store, caller);
        return store.clients();
      },
      async createClient(caller, body) {
        await requireAdmin(store, caller);
        if (await store.client(body.clientId))
          throw new ApiError(403, "Error: Client ID already exists.");
        return store.createClient({
          clientId: body.clientId,
          clientSecret: body.clientSecret,
          accessTokenExpiration: body.accessTokenExpiration,
          refreshTokenExpiration: body.refreshTokenExpiration
        });
      },
      async updatePassword(caller, body) {
        const reader = await requireCaller(store, caller);
        if (reader.authProvider)
          throw new ApiError(
            405,
            "Can not update password of user that is created by an external auth provider."
          );
        if (!await store.passwordMatches(reader, body.currentPassword))
          throw new ApiError(403, "Invalid current password!");
        await store.setPassword(reader.uid, body.newPassword);
        await store.updateUser(reader.uid, { needsToUpdatePassword: false });
      }
    };
  };

  // src/corpus/code.ts
  var CODE_CORPUS = [
    {
      id: "code-lint-missing-header",
      route: "POST /SASjsApi/code/lint",
      description: "answers the diagnostics for a buffer, without touching a file",
      request: {
        // the routes are permissioned; the runner resolves the fixture's admin
        subject: { userId: "user-admin", clientId: "web_app" },
        body: { code: "data _null_;\n  x = 1;\nrun;\n" }
      },
      expect: {
        status: 200,
        body: [
          {
            message: "File missing Doxygen header",
            lineNumber: 1,
            startColumnNumber: 1,
            endColumnNumber: 1,
            severity: 1
          }
        ]
      }
    },
    {
      id: "code-lint-unauthenticated",
      route: "POST /SASjsApi/code/lint",
      description: "refuses a caller with no token",
      request: { body: { code: "data _null_; run;" } },
      expect: { status: 401, error: "Unauthorized" }
    },
    {
      id: "code-lint-non-string",
      route: "POST /SASjsApi/code/lint",
      description: "refuses a code value that is not a string, rather than coercing it",
      request: {
        subject: { userId: "user-admin", clientId: "web_app" },
        body: { code: 123 }
      },
      expect: { status: 400, error: '"code" must be a string' }
    },
    {
      id: "code-lint-empty",
      route: "POST /SASjsApi/code/lint",
      description: "refuses an empty buffer, which is not the same as a missing one",
      request: {
        subject: { userId: "user-admin", clientId: "web_app" },
        body: { code: "" }
      },
      expect: { status: 400, error: '"code" is not allowed to be empty' }
    },
    {
      id: "code-format-unauthenticated",
      route: "POST /SASjsApi/code/format",
      description: "refuses a caller with no token",
      request: { body: { code: "data _null_; run;" } },
      expect: { status: 401, error: "Unauthorized" }
    },
    {
      id: "code-format-non-string",
      route: "POST /SASjsApi/code/format",
      description: "refuses a code value that is not a string",
      request: {
        subject: { userId: "user-admin", clientId: "web_app" },
        body: { code: 123 }
      },
      expect: { status: 400, error: '"code" must be a string' }
    },
    {
      id: "code-format-adds-the-header",
      route: "POST /SASjsApi/code/format",
      description: "answers the formatted buffer, header block included",
      request: {
        // the routes are permissioned; the runner resolves the fixture's admin
        subject: { userId: "user-admin", clientId: "web_app" },
        body: { code: "data _null_;\n  x = 1;\nrun;\n" }
      },
      expect: {
        status: 200,
        body: "/**\n  @file\n  @brief <Your brief here>\n\n  <h4> SAS Macros </h4>\n\n**/\ndata _null_;\n  x = 1;\nrun;\n"
      }
    }
  ];

  // src/corpus/info.ts
  var INFO_CORPUS = [
    {
      id: "info-answers-the-documented-shape",
      route: "GET /SASjsApi/info",
      description: "answers the host configuration in the shape the document states, and no property it forbids",
      request: {},
      expect: {
        status: 200,
        shape: {
          required: [
            "mode",
            "cors",
            "httpPort",
            "httpsPort",
            "runTimes",
            "authProviders",
            "localLoginEnabled",
            "version"
          ],
          // present only while oidc is a configured provider
          optional: ["oidcProviderName"]
        }
      }
    }
  ];

  // src/corpus/admin.ts
  var CORPUS_LOG = {
    name: "20260101000000.log",
    sizeBytes: 118,
    modified: "2026-01-01T00:00:00.000Z"
  };
  var CORPUS_LOG_TAIL = {
    fileName: CORPUS_LOG.name,
    lines: 1,
    bytesRead: 118,
    truncated: false,
    content: "GET /SASjsApi/info HTTP/1.1 200 118"
  };
  var CORPUS_DIAGNOSTICS = {
    build: { version: "v4.16.2", gitHash: "cda6114", buildDate: null },
    server: {
      mode: "desktop",
      uptimeSeconds: 3600,
      startedAt: "2026-01-01T00:00:00.000Z",
      pid: 4242,
      nodeVersion: "v22.11.0",
      platform: "linux 5.14.0",
      arch: "x64",
      cpuCount: 8,
      cpuModel: "Intel(R) Xeon(R) CPU",
      loadAverage: [0.08, 0.11, 0.15],
      runTimes: ["js"],
      sasjsRoot: "/sasjs_root"
    },
    memory: {
      rssBytes: 1,
      heapTotalBytes: 2,
      heapUsedBytes: 3,
      externalBytes: 4,
      systemTotalBytes: 5,
      systemFreeBytes: 6
    },
    filesystem: null,
    folders: [],
    logs: {
      folder: "/sasjs_root/logs",
      fileCount: 1,
      totalBytes: 118,
      newestFile: CORPUS_LOG.name,
      newestModified: CORPUS_LOG.modified
    }
  };
  var ADMIN_CORPUS = [
    {
      id: "admin-diagnostics-answers-the-report",
      route: "GET /SASjsApi/admin/diagnostics",
      description: "answers the host diagnostics report field for field",
      request: {},
      expect: { status: 200, body: CORPUS_DIAGNOSTICS }
    },
    {
      id: "admin-logs-lists-the-files",
      route: "GET /SASjsApi/admin/logs",
      description: "answers the log files the host holds, newest first",
      request: {},
      expect: { status: 200, body: { files: [CORPUS_LOG] } }
    },
    {
      id: "admin-log-tail-answers-the-tail",
      route: "GET /SASjsApi/admin/logs/{fileName}",
      description: "answers the tail of a log the folder holds",
      request: { params: { fileName: CORPUS_LOG.name } },
      expect: { status: 200, body: CORPUS_LOG_TAIL }
    },
    {
      id: "admin-log-tail-refuses-a-traversal",
      route: "GET /SASjsApi/admin/logs/{fileName}",
      description: "refuses a name that could resolve outside the log folder, before the host is asked",
      request: { params: { fileName: "../20260101000000.log" } },
      expect: { status: 400, error: "Invalid log file name." }
    },
    {
      id: "admin-log-tail-answers-404",
      route: "GET /SASjsApi/admin/logs/{fileName}",
      description: "answers 404 for a name the folder does not hold",
      request: { params: { fileName: "20250101000000.log" } },
      expect: { status: 404, error: "Log file not found." }
    }
  ];

  // src/corpus/authconfig.ts
  var CORPUS_AUTH_CONFIG = {
    ldap: {
      url: "ldaps://directory.example:636",
      bindDn: "cn=admin,dc=example",
      usersBaseDn: "ou=users,dc=example",
      groupsBaseDn: "ou=groups,dc=example",
      bindPasswordSet: true
    }
  };
  var CORPUS_AUTH_CONFIG_BODY = {
    ldap: {
      LDAP_URL: "ldaps://directory.example:636",
      LDAP_BIND_DN: "cn=admin,dc=example",
      LDAP_USERS_BASE_DN: "ou=users,dc=example",
      LDAP_GROUPS_BASE_DN: "ou=groups,dc=example",
      LDAP_BIND_PASSWORD_SET: true
    }
  };
  var AUTH_CONFIG_CORPUS = [
    {
      id: "authconfig-answers-the-enabled-provider",
      route: "GET /SASjsApi/authConfig",
      description: "answers the enabled provider with the secret reported as a boolean, never as a value",
      request: {},
      expect: { status: 200, body: CORPUS_AUTH_CONFIG_BODY }
    }
  ];

  // src/corpus/directory.ts
  var CORPUS_DIRECTORY = {
    users: async () => [{ username: "alice", displayName: "Alice" }],
    groups: async () => [{ name: "analysts" }]
  };
  var DIRECTORY_CORPUS = [
    {
      id: "directory-imports-the-missing-accounts",
      route: "POST /SASjsApi/authConfig/synchroniseWithLDAP",
      description: "imports the users and groups the store does not hold, and counts them",
      request: {},
      expect: { status: 200, body: { userCount: 1, groupCount: 1 } }
    }
  ];

  // src/corpus/home.ts
  var CORPUS_WEB_PAGE = {
    version: "4a26a3d1b2c3",
    html: [
      "<!doctype html>",
      "<html>",
      "<head>",
      '  <script src="./index.bundle.js"></script>',
      '  <script src="./vendor.js?v=keepme"></script>',
      '  <link rel="stylesheet" href="./index.bundle.css" />',
      // a name that merely begins with the bundle's: stamped by an `includes`
      // match, left alone here - see BUNDLE_REFERENCE
      '  <link rel="stylesheet" href="./index.bundle.js.css" />',
      "</head>",
      "<body>",
      "  <p>The page loads index.bundle.js from the folder beside it.</p>",
      '  <div id="root"></div>',
      "</body>",
      "</html>"
    ].join("\n")
  };
  var CORPUS_WEB_BODY = CORPUS_WEB_PAGE.html.replace(
    './index.bundle.js"',
    `./index.bundle.js?v=${CORPUS_WEB_PAGE.version}"`
  );
  var HOME_CORPUS = [
    {
      id: "home-answers-the-stamped-shell",
      route: "GET /",
      description: "answers the shell with its bundle reference stamped, leaving prose and an already-versioned reference alone",
      request: {},
      expect: { status: 200, contents: CORPUS_WEB_BODY }
    }
  ];

  // src/home/service.ts
  var BUNDLE_NAME = "index.bundle.js";
  var NO_WEB_BUILD = "<html><head></head><body>Web Build is not present</body></html>";
  var FILE_ATTRIBUTE = /(\s(?:src|href)=)("[^"]*"|'[^']*'|[^\s>]+)/g;
  var BUNDLE_REFERENCE = new RegExp(
    `(^|/)${BUNDLE_NAME.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`
  );
  var withBundleVersion = (html2, version) => html2.replace(FILE_ATTRIBUTE, (match, attribute, value) => {
    const quote = value[0] === '"' || value[0] === "'" ? value[0] : "";
    const target = quote ? value.slice(1, -1) : value;
    if (!BUNDLE_REFERENCE.test(target) || target.includes("?")) return match;
    return `${attribute}${quote}${target}?v=${version}${quote}`;
  });
  var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
  var pageOf = (page) => {
    if (!page || typeof page !== "object")
      throw new Error("The web page is not an object.");
    if (!isNonEmptyString(page.html))
      throw new Error(
        "The web page states no html, so there is nothing to serve. Answer `undefined` from the port when the host has no build."
      );
    if (!isNonEmptyString(page.version) || !/^[A-Za-z0-9._-]+$/.test(page.version))
      throw new Error(
        `The web page states version as ${JSON.stringify(page.version)}; it is the bundle's cache token, so it may contain only letters, digits, ".", "_" and "-" - anything else, a quote above all, would end the attribute it is written into.`
      );
    return withBundleVersion(page.html, page.version);
  };
  var createHomeService = (page) => ({
    async home() {
      const found = await page();
      return found === void 0 ? NO_WEB_BUILD : pageOf(found);
    }
  });

  // src/info/service.ts
  var BROWSER_INFO = {
    mode: "desktop",
    cors: "disable",
    httpPort: null,
    httpsPort: null,
    runTimes: ["js"],
    authProviders: [],
    localLoginEnabled: false,
    version: "dev"
  };
  var FIELDS = [
    "mode",
    "cors",
    "httpPort",
    "httpsPort",
    "runTimes",
    "authProviders",
    "oidcProviderName",
    "localLoginEnabled",
    "version"
  ];
  var REQUIRED_FIELDS = FIELDS.filter((field) => field !== "oidcProviderName");
  var MODES = ["server", "desktop"];
  var CORS_VALUES = ["enable", "disable"];
  var isNonEmptyString2 = (value) => typeof value === "string" && value.length > 0;
  var portOf = (value, name) => {
    if (value === null || value === void 0) return null;
    if (typeof value !== "number" || !Number.isInteger(value))
      throw new Error(
        `The info configuration states ${name} as ${JSON.stringify(value)}; a port is an integer, or null when the listener is disabled.`
      );
    if (value < 1 || value > 65535)
      throw new Error(
        `The info configuration states ${name} as ${value}; a port is between 1 and 65535, or null when the listener is disabled.`
      );
    return value;
  };
  var namesOf = (value, name) => {
    if (!Array.isArray(value))
      throw new Error(
        `The info configuration states ${name} as ${JSON.stringify(value)}; the document states an array of strings.`
      );
    for (const entry of value)
      if (!isNonEmptyString2(entry))
        throw new Error(
          `The info configuration states ${name} with an entry that is not a name: ${JSON.stringify(entry)}.`
        );
    return [...new Set(value)];
  };
  var normaliseInfo = (config) => {
    if (!config || typeof config !== "object")
      throw new Error("The info configuration is not an object.");
    for (const key of Object.keys(config))
      if (!FIELDS.includes(key))
        throw new Error(
          `The info configuration carries \`${key}\`, which the document's InfoResponse does not state. Remove it: this route is public, so anything else a host puts here is served to an anonymous caller.`
        );
    for (const key of REQUIRED_FIELDS)
      if (!Object.prototype.hasOwnProperty.call(config, key))
        throw new Error(
          `The info configuration does not state \`${key}\`, which the document requires. A client validating the response refuses an answer that omits it.`
        );
    const mode = config.mode;
    if (!MODES.includes(mode))
      throw new Error(
        `The info configuration states mode as ${JSON.stringify(mode)}; the document states the ModeType enum - ${MODES.map((value) => `\`${value}\``).join(" or ")}.`
      );
    const cors = config.cors;
    if (!CORS_VALUES.includes(cors))
      throw new Error(
        `The info configuration states cors as ${JSON.stringify(cors)}; the document states the CorsType enum - ${CORS_VALUES.map((value) => `\`${value}\``).join(" or ")}.`
      );
    const version = config.version;
    if (!isNonEmptyString2(version) || version.trim() === "")
      throw new Error(
        `The info configuration states version as ${JSON.stringify(version)}; the document states the release that produced the build, such as \`v3.2.2 (4a26a3d)\`.`
      );
    const authProviders = namesOf(config.authProviders, "authProviders");
    const runTimes = namesOf(config.runTimes, "runTimes");
    const rawName = config.oidcProviderName;
    if (rawName !== void 0 && !isNonEmptyString2(rawName))
      throw new Error(
        `The info configuration states oidcProviderName as ${JSON.stringify(rawName)}; the document states the sign-on button's label, or omits it.`
      );
    if (typeof config.localLoginEnabled !== "boolean")
      throw new Error(
        `The info configuration states localLoginEnabled as ${JSON.stringify(config.localLoginEnabled)}; the document states a boolean.`
      );
    const oidcProviderName = rawName !== void 0 && authProviders.includes("oidc") ? rawName : void 0;
    return {
      mode,
      cors,
      httpPort: portOf(config.httpPort, "httpPort"),
      httpsPort: portOf(config.httpsPort, "httpsPort"),
      runTimes,
      authProviders,
      ...oidcProviderName === void 0 ? {} : { oidcProviderName },
      localLoginEnabled: config.localLoginEnabled,
      version
    };
  };
  var createInfoService = (config) => {
    const read = () => typeof config === "function" ? config() : config;
    return {
      async info() {
        return normaliseInfo(read());
      }
    };
  };

  // src/authconfig/service.ts
  var LDAP_FIELDS = [
    "url",
    "bindDn",
    "usersBaseDn",
    "groupsBaseDn",
    "bindPasswordSet"
  ];
  var OIDC_FIELDS = [
    "providerName",
    "issuerUrl",
    "clientId",
    "redirectUri",
    "scope",
    "signingAlg",
    "usernameClaim",
    "jitProvision",
    "clientSecretSet"
  ];
  var SECRET = /(password|secret|passwd|token)/i;
  var checkProvider = (name, block, fields, booleans) => {
    if (!block || typeof block !== "object")
      throw new Error(
        `The auth configuration states \`${name}\` as ${JSON.stringify(block)}; a provider is an object, or absent when it is not enabled.`
      );
    for (const key of Object.keys(block)) {
      if (!fields.includes(key))
        throw new Error(
          SECRET.test(key) ? `The auth configuration states \`${name}.${key}\`, which looks like a secret. Secrets are never echoed by this route: pass \`${key}Set: true\` instead, so the answer carries whether one is configured and not the value.` : `The auth configuration carries \`${name}.${key}\`, which the document's example does not state. Remove it, or add it to the provider's fields here and to the document.`
        );
    }
    for (const key of fields) {
      if (!(key in block))
        throw new Error(
          `The auth configuration does not state \`${name}.${key}\`, which the administration interface reads. State the empty string when the host has no value for it.`
        );
      const value = block[key];
      if (booleans.includes(key)) {
        if (typeof value !== "boolean")
          throw new Error(
            `The auth configuration states \`${name}.${key}\` as ${JSON.stringify(value)}; it says whether the secret is configured, so it is a boolean.`
          );
      } else if (typeof value !== "string")
        throw new Error(
          `The auth configuration states \`${name}.${key}\` as ${JSON.stringify(value)}; the document states a string.`
        );
    }
  };
  var normaliseAuthConfig = (config) => {
    if (!config || typeof config !== "object")
      throw new Error("The auth configuration is not an object.");
    for (const key of Object.keys(config))
      if (key !== "ldap" && key !== "oidc")
        throw new Error(
          SECRET.test(key) ? `The auth configuration states \`${key}\` at the top level, which looks like a secret. Secrets are never echoed by this route; put the provider under \`ldap\` or \`oidc\` and report whether the secret is set.` : `The auth configuration carries \`${key}\`, which is not a provider this API has. The document states \`ldap\` and \`oidc\`.`
        );
    const answer = {};
    if (config.ldap !== void 0) {
      checkProvider("ldap", config.ldap, LDAP_FIELDS, ["bindPasswordSet"]);
      answer.ldap = {
        LDAP_URL: config.ldap.url,
        LDAP_BIND_DN: config.ldap.bindDn,
        LDAP_USERS_BASE_DN: config.ldap.usersBaseDn,
        LDAP_GROUPS_BASE_DN: config.ldap.groupsBaseDn,
        LDAP_BIND_PASSWORD_SET: config.ldap.bindPasswordSet
      };
    }
    if (config.oidc !== void 0) {
      checkProvider("oidc", config.oidc, OIDC_FIELDS, ["clientSecretSet"]);
      answer.oidc = {
        OIDC_PROVIDER_NAME: config.oidc.providerName,
        OIDC_ISSUER_URL: config.oidc.issuerUrl,
        OIDC_CLIENT_ID: config.oidc.clientId,
        OIDC_REDIRECT_URI: config.oidc.redirectUri,
        OIDC_SCOPE: config.oidc.scope,
        OIDC_SIGNING_ALG: config.oidc.signingAlg,
        OIDC_USERNAME_CLAIM: config.oidc.usernameClaim,
        OIDC_JIT_PROVISION: config.oidc.jitProvision,
        OIDC_CLIENT_SECRET_SET: config.oidc.clientSecretSet
      };
    }
    return answer;
  };
  var createAuthConfigService = (config) => {
    const read = () => typeof config === "function" ? config() : config;
    return {
      async authConfig() {
        return normaliseAuthConfig(read());
      }
    };
  };

  // src/admin/service.ts
  var DEFAULT_LOG_LINES = 200;
  var MAX_LOG_LINES = 5e3;
  var isObject2 = (value) => !!value && typeof value === "object" && !Array.isArray(value);
  var isNumber = (value) => typeof value === "number" && Number.isFinite(value);
  var isString = (value) => typeof value === "string";
  var requireString = (holder, key, where) => {
    if (!isString(holder[key]))
      throw new Error(
        `The ${where} report states \`${key}\` as ${JSON.stringify(holder[key])}; the document states a string, and a client that renders it would print the value as it stands.`
      );
  };
  var requireNumber = (holder, key, where) => {
    if (!isNumber(holder[key]))
      throw new Error(
        `The ${where} report states \`${key}\` as ${JSON.stringify(holder[key])}; the document states a number, and a client that renders it would print NaN.`
      );
  };
  var requireObject = (holder, key, where) => {
    const value = holder[key];
    if (!isObject2(value))
      throw new Error(
        `The ${where} report states \`${key}\` as ${JSON.stringify(value)}; the document states an object.`
      );
    return value;
  };
  var normaliseDiagnostics = (report) => {
    if (!isObject2(report))
      throw new Error("The diagnostics report is not an object.");
    const build = requireObject(
      report,
      "build",
      "diagnostics"
    );
    requireString(build, "version", "diagnostics build");
    requireString(build, "gitHash", "diagnostics build");
    if (!(build.buildDate === null || isString(build.buildDate)))
      throw new Error(
        `The diagnostics build states \`buildDate\` as ${JSON.stringify(build.buildDate)}; the document states an ISO timestamp or null.`
      );
    const server = requireObject(
      report,
      "server",
      "diagnostics"
    );
    requireString(server, "mode", "diagnostics server");
    requireString(server, "startedAt", "diagnostics server");
    requireString(server, "nodeVersion", "diagnostics server");
    requireString(server, "platform", "diagnostics server");
    requireString(server, "arch", "diagnostics server");
    requireString(server, "cpuModel", "diagnostics server");
    requireString(server, "sasjsRoot", "diagnostics server");
    requireNumber(server, "uptimeSeconds", "diagnostics server");
    requireNumber(server, "pid", "diagnostics server");
    requireNumber(server, "cpuCount", "diagnostics server");
    if (!Array.isArray(server.loadAverage) || !server.loadAverage.every(isNumber))
      throw new Error(
        "The diagnostics server report states `loadAverage` as something other than an array of numbers."
      );
    if (!Array.isArray(server.runTimes) || !server.runTimes.every(isString))
      throw new Error(
        "The diagnostics server report states `runTimes` as something other than an array of strings."
      );
    const memory = requireObject(
      report,
      "memory",
      "diagnostics"
    );
    for (const key of [
      "rssBytes",
      "heapTotalBytes",
      "heapUsedBytes",
      "externalBytes",
      "systemTotalBytes",
      "systemFreeBytes"
    ])
      requireNumber(memory, key, "diagnostics memory");
    const filesystem = report.filesystem;
    if (filesystem !== null) {
      if (!isObject2(filesystem))
        throw new Error(
          `The diagnostics report states \`filesystem\` as ${JSON.stringify(filesystem)}; the document states an object or null.`
        );
      requireString(
        filesystem,
        "path",
        "diagnostics filesystem"
      );
      for (const key of ["totalBytes", "freeBytes", "usedBytes", "usedPercent"])
        requireNumber(
          filesystem,
          key,
          "diagnostics filesystem"
        );
    }
    if (!Array.isArray(report.folders))
      throw new Error(
        "The diagnostics report states `folders` as something other than an array."
      );
    for (const folder of report.folders) {
      if (!isObject2(folder))
        throw new Error(
          "The diagnostics report carries a folder that is not an object."
        );
      const entry = folder;
      requireString(entry, "label", "diagnostics folder");
      requireString(entry, "path", "diagnostics folder");
      requireNumber(entry, "bytes", "diagnostics folder");
      requireNumber(entry, "files", "diagnostics folder");
      if (typeof entry.exists !== "boolean" || typeof entry.truncated !== "boolean")
        throw new Error(
          "The diagnostics folder report states `exists` or `truncated` as something other than a boolean."
        );
    }
    const logs = requireObject(
      report,
      "logs",
      "diagnostics"
    );
    requireString(logs, "folder", "diagnostics logs");
    requireNumber(logs, "fileCount", "diagnostics logs");
    requireNumber(logs, "totalBytes", "diagnostics logs");
    for (const key of ["newestFile", "newestModified"])
      if (!(logs[key] === null || isString(logs[key])))
        throw new Error(
          `The diagnostics logs summary states \`${key}\` as ${JSON.stringify(logs[key])}; the document states a string or null.`
        );
    return report;
  };
  var normaliseLogFiles = (files) => {
    if (!Array.isArray(files))
      throw new Error("The log report is not an array of files.");
    return files.map((file) => {
      if (!isObject2(file))
        throw new Error("The log report carries an entry that is not an object.");
      const entry = file;
      requireString(entry, "name", "logs");
      requireString(entry, "modified", "logs");
      requireNumber(entry, "sizeBytes", "logs");
      return file;
    });
  };
  var checkLogFileName = (fileName) => {
    if (!fileName || fileName.includes("/") || fileName.includes("\\") || fileName.split(/[\\/]/).pop() !== fileName || !fileName.toLowerCase().endsWith(".log"))
      throw new ApiError(400, "Invalid log file name.");
    return fileName;
  };
  var logLines = (lines) => {
    if (lines === void 0 || lines === null || lines === "")
      return DEFAULT_LOG_LINES;
    const wanted = Number(lines);
    if (!Number.isFinite(wanted)) return DEFAULT_LOG_LINES;
    return Math.min(Math.max(Math.trunc(wanted), 1), MAX_LOG_LINES);
  };
  var normaliseLogTail = (tail) => {
    if (!isObject2(tail)) throw new Error("The log tail report is not an object.");
    const entry = tail;
    requireString(entry, "fileName", "log tail");
    requireString(entry, "content", "log tail");
    requireNumber(entry, "lines", "log tail");
    requireNumber(entry, "bytesRead", "log tail");
    if (typeof entry.truncated !== "boolean")
      throw new Error(
        "The log tail report states `truncated` as something other than a boolean."
      );
    return tail;
  };
  var createAdminService = (reports) => ({
    async diagnostics() {
      return normaliseDiagnostics(await reports.diagnostics());
    },
    async logs() {
      return normaliseLogFiles(await reports.logs());
    },
    async logTail(fileName, lines) {
      const name = checkLogFileName(fileName);
      const tail = await reports.logTail(name, logLines(lines));
      if (tail === void 0) throw new ApiError(404, "Log file not found.");
      return normaliseLogTail(tail);
    }
  });

  // src/directory/service.ts
  var isNonEmptyString3 = (value) => typeof value === "string" && value.length > 0;
  var usersOf = (users) => {
    if (!Array.isArray(users))
      throw new Error("The directory answer has no users array.");
    const seen = /* @__PURE__ */ new Set();
    for (const user3 of users) {
      if (!isNonEmptyString3(user3?.username) || !isNonEmptyString3(user3?.displayName))
        throw new Error(
          `The directory answer carries a user without a username or displayName: ${JSON.stringify(user3)}. Both are what the API keys an account on, so the import cannot guess them.`
        );
      if (seen.has(user3.username))
        throw new Error(
          `The directory answer names ${user3.username} twice. A directory that returns one account twice is a filter problem, and importing it would hide that.`
        );
      seen.add(user3.username);
    }
    return users;
  };
  var groupsOf = (groups) => {
    if (!Array.isArray(groups))
      throw new Error("The directory answer has no groups array.");
    const seen = /* @__PURE__ */ new Set();
    for (const group of groups) {
      if (!isNonEmptyString3(group?.name))
        throw new Error(
          `The directory answer carries a group without a name: ${JSON.stringify(group)}.`
        );
      if (seen.has(group.name))
        throw new Error(
          `The directory answer names the group ${group.name} twice, which would apply its members twice.`
        );
      seen.add(group.name);
    }
    return groups;
  };
  var createDirectoryService = (store, source, options = {}) => {
    const provider = options.provider || "ldap";
    return {
      async synchronise() {
        const directoryUsers = usersOf(await source.users());
        const directoryGroups = groupsOf(await source.groups());
        const existingUsers = await store.users();
        const existingGroups = await store.groups();
        const userByName = new Map(
          existingUsers.map((user3) => [user3.username, user3])
        );
        const groupByName = new Map(
          existingGroups.map((group) => [group.name, group])
        );
        const imported = [];
        for (const user3 of directoryUsers) {
          if (userByName.has(user3.username)) continue;
          const created = await store.createUser({
            username: user3.username,
            displayName: user3.displayName,
            isAdmin: false,
            isActive: true,
            authProvider: provider
          });
          userByName.set(created.username, created);
          imported.push(created);
        }
        const importedGroups = [];
        for (const group of directoryGroups) {
          if (groupByName.has(group.name)) continue;
          const created = await store.createGroup({
            name: group.name,
            description: "",
            isActive: true,
            authProvider: provider
          });
          groupByName.set(created.name, created);
          importedGroups.push(created);
        }
        const membersOf = /* @__PURE__ */ new Map();
        const note = (groupName, username) => {
          const members = membersOf.get(groupName) || /* @__PURE__ */ new Set();
          members.add(username);
          membersOf.set(groupName, members);
        };
        for (const group of directoryGroups)
          for (const member of group.members || []) note(group.name, member);
        for (const user3 of directoryUsers)
          for (const groupName of user3.groups || [])
            note(groupName, user3.username);
        for (const group of importedGroups)
          for (const username of membersOf.get(group.name) || []) {
            const user3 = userByName.get(username);
            if (user3) await store.addToGroup(group.uid, user3.uid);
          }
        return { userCount: imported.length, groupCount: importedGroups.length };
      }
    };
  };

  // src/identity/fixture.ts
  var IDENTITY_FORMAT = 1;
  var SECONDS_IN_A_DAY2 = 86400;
  var DEFAULT_IDENTITY = {
    format: IDENTITY_FORMAT,
    users: [
      {
        uid: "user-admin",
        username: "sasjsadmin",
        displayName: "Demo Admin",
        // long enough to pass the API's own password rule (six characters), so a
        // demo can sign in against a real server as well as a mock
        password: "Orion123",
        isAdmin: true,
        isActive: true,
        needsToUpdatePassword: false
      },
      {
        uid: "user-restricted",
        username: "sasjsuser",
        displayName: "Demo User",
        password: "Orion123",
        isAdmin: false,
        isActive: true,
        needsToUpdatePassword: false
      }
    ],
    groups: [
      {
        uid: "group-data-controller",
        name: "DCGroup",
        description: "Data Controller users",
        isActive: true,
        users: ["sasjsuser"]
      },
      {
        uid: "group-admins",
        name: "Admins",
        description: "Everything the API offers",
        isActive: true,
        users: ["sasjsadmin"]
      }
    ],
    permissions: [
      {
        uid: "rule-routes",
        path: "/SASjsApi/drive/file",
        type: "Route",
        setting: "Grant",
        group: "group-data-controller"
      },
      {
        uid: "rule-execute",
        path: "/SASjsApi/stp/execute",
        type: "Route",
        setting: "Grant",
        group: "group-data-controller"
      },
      {
        uid: "rule-code",
        path: "/SASjsApi/code/execute",
        type: "Route",
        setting: "Deny",
        user: "user-restricted"
      }
    ],
    clients: [
      {
        clientId: "web_app",
        clientSecret: "web_app",
        accessTokenExpiration: SECONDS_IN_A_DAY2,
        refreshTokenExpiration: SECONDS_IN_A_DAY2 * 30
      },
      {
        clientId: "sasjs",
        clientSecret: "sasjs",
        accessTokenExpiration: 3600,
        refreshTokenExpiration: SECONDS_IN_A_DAY2
      }
    ]
  };
  var parseIdentity = (raw) => {
    const fixture = raw;
    if (!fixture || typeof fixture !== "object")
      throw new Error("The identity fixture is not an object.");
    if (fixture.format !== IDENTITY_FORMAT)
      throw new Error(
        `The identity fixture states format ${String(fixture.format)}, and this build reads format ${IDENTITY_FORMAT}. Rebuild the site, or replace mock-identity.json with one this version wrote.`
      );
    for (const key of ["users", "groups", "permissions", "clients"])
      if (!Array.isArray(fixture[key]))
        throw new Error(`The identity fixture has no \`${key}\` array.`);
    for (const token of fixture.tokens || [])
      if (!token.accessToken || !token.refreshToken)
        throw new Error(
          `The identity fixture declares a half pair for ${token.username}/${token.clientId}: a seeded token needs both an accessToken and a refreshToken, because a token only authenticates while the subject's pair holds it.`
        );
    if (!fixture.users.some((user3) => user3.isAdmin))
      throw new Error(
        "The identity fixture declares no administrator: a demo with nobody able to administer it cannot exercise the admin routes."
      );
    return fixture;
  };

  // src/identity/memory-store.ts
  var keyOf = (subject) => `${subject.userId}|${subject.clientId}`;
  var randomHex = (bytes3) => {
    const source = globalThis.crypto;
    if (!source)
      throw new ApiError(
        500,
        "This host has no Web Crypto (`globalThis.crypto`), so it cannot mint an unguessable identity string."
      );
    const buffer = new Uint8Array(bytes3);
    source.getRandomValues(buffer);
    return Array.from(buffer, (byte) => byte.toString(16).padStart(2, "0")).join(
      ""
    );
  };
  var CODE_LIFETIME_SECONDS = 30;
  var live = (issued, now) => issued && (issued.expiresAt === void 0 || issued.expiresAt > now) ? issued.subject : void 0;
  var MemoryIdentityStore = class {
    constructor(fixture = DEFAULT_IDENTITY) {
      this.userList = [];
      this.passwords = /* @__PURE__ */ new Map();
      this.groupList = /* @__PURE__ */ new Map();
      this.permissionList = /* @__PURE__ */ new Map();
      this.clientRecords = /* @__PURE__ */ new Map();
      this.clientMap = /* @__PURE__ */ new Map();
      this.pairs = /* @__PURE__ */ new Map();
      this.access = /* @__PURE__ */ new Map();
      this.refresh = /* @__PURE__ */ new Map();
      this.codes = /* @__PURE__ */ new Map();
      this.claimed = /* @__PURE__ */ new Set();
      if (fixture.format !== IDENTITY_FORMAT)
        throw new ApiError(
          500,
          `The identity fixture states format ${String(fixture.format)}; this store reads ${IDENTITY_FORMAT}.`
        );
      for (const user3 of fixture.users) {
        this.userList.push({
          uid: user3.uid,
          username: user3.username,
          displayName: user3.displayName,
          isAdmin: user3.isAdmin,
          isActive: user3.isActive,
          needsToUpdatePassword: user3.needsToUpdatePassword,
          authProvider: user3.authProvider,
          autoExec: user3.autoExec
        });
        if (user3.password !== void 0)
          this.passwords.set(user3.uid, user3.password);
      }
      for (const client of fixture.clients) {
        this.clientMap.set(client.clientId, {
          clientId: client.clientId,
          accessTokenExpiration: client.accessTokenExpiration,
          refreshTokenExpiration: client.refreshTokenExpiration
        });
        this.clientRecords.set(client.clientId, {
          clientId: client.clientId,
          clientSecret: client.clientSecret,
          accessTokenExpiration: client.accessTokenExpiration,
          refreshTokenExpiration: client.refreshTokenExpiration
        });
      }
      for (const group of fixture.groups) {
        const uid = group.uid;
        this.groupList.set(uid, {
          uid,
          name: group.name,
          description: group.description,
          isActive: group.isActive,
          authProvider: group.authProvider,
          users: group.users.map(
            (username) => this.userList.find((user3) => user3.username === username)?.uid
          ).filter((member) => member !== void 0)
        });
      }
      for (const permission of fixture.permissions) {
        this.permissionList.set(permission.uid, {
          uid: permission.uid,
          path: permission.path,
          type: permission.type,
          setting: permission.setting,
          user: permission.user ? this.userList.find((user3) => user3.uid === permission.user)?.uid : void 0,
          group: permission.group ? this.groupList.get(permission.group)?.uid : void 0
        });
      }
      for (const token of fixture.tokens || []) {
        const user3 = this.userList.find(
          (candidate) => candidate.username === token.username
        );
        if (!user3) continue;
        const subject = { userId: user3.uid, clientId: token.clientId };
        if (token.accessToken) this.access.set(token.accessToken, { subject });
        if (token.refreshToken) this.refresh.set(token.refreshToken, { subject });
        if (token.accessToken && token.refreshToken)
          this.pairs.set(keyOf(subject), {
            accessToken: token.accessToken,
            refreshToken: token.refreshToken
          });
      }
      for (const code of fixture.codes || []) {
        const user3 = this.userList.find(
          (candidate) => candidate.username === code.username
        );
        if (!user3) continue;
        this.codes.set(code.code, {
          subject: { userId: user3.uid, clientId: code.clientId }
        });
      }
    }
    async userByName(username) {
      const user3 = this.userList.find(
        (candidate) => candidate.username === username
      );
      return user3 ? this.recordOf(user3) : void 0;
    }
    async userById(uid) {
      const user3 = this.userList.find((candidate) => candidate.uid === uid);
      return user3 ? this.recordOf(user3) : void 0;
    }
    /** A fixture holds the password in clear, so the check is an equality. */
    async passwordMatches(user3, password) {
      return this.passwords.get(user3.uid) === password;
    }
    async client(clientId) {
      return this.clientMap.get(clientId);
    }
    async issue(subject, client) {
      const issuedAt = Date.now();
      const pair = {
        accessToken: `access-${randomHex(16)}`,
        refreshToken: `refresh-${randomHex(16)}`
      };
      this.access.set(pair.accessToken, {
        subject,
        expiresAt: issuedAt + client.accessTokenExpiration * 1e3
      });
      this.refresh.set(pair.refreshToken, {
        subject,
        expiresAt: issuedAt + client.refreshTokenExpiration * 1e3
      });
      return pair;
    }
    /**
     * A token names its subject only while that subject's CURRENT pair holds it.
     * The server verifies a token against the pair saved for the user and client,
     * so a logged-out or rotated token stops working there too; without the same
     * check here, the browser host would honour a token the server had revoked.
     */
    async readAccess(token) {
      return this.current(token, this.access, "accessToken");
    }
    async readRefresh(token) {
      return this.current(token, this.refresh, "refreshToken");
    }
    current(token, issued, kind) {
      const entry = issued.get(token);
      if (!entry) return void 0;
      const subject = live(entry, Date.now());
      if (!subject) return void 0;
      const pair = this.pairs.get(keyOf(subject));
      return pair && pair[kind] === token ? subject : void 0;
    }
    /**
     * The subject's saved pair, while both of its tokens are still live.
     *
     * An exchange hands a saved pair back rather than rotating a second tab's
     * tokens. That is only an answer if the pair can still be used: a saved pair
     * whose access token has aged out would sign the caller in and then refuse
     * every request it makes, so an aged-out pair is reported as absent and the
     * exchange mints a fresh one. `live()` reads the issue-time expiry, which a
     * seeded token does not carry - a seeded pair therefore never ages out here.
     */
    async pairFor(subject) {
      const pair = this.pairs.get(keyOf(subject));
      if (!pair) return void 0;
      const now = Date.now();
      const access = this.access.get(pair.accessToken);
      const refresh = this.refresh.get(pair.refreshToken);
      return live(access, now) && live(refresh, now) ? pair : void 0;
    }
    async savePair(subject, pair) {
      this.pairs.set(keyOf(subject), pair);
    }
    async deletePair(subject) {
      this.pairs.delete(keyOf(subject));
    }
    async issueCode(subject) {
      const code = `code-${randomHex(16)}`;
      this.codes.set(code, {
        subject,
        expiresAt: Date.now() + CODE_LIFETIME_SECONDS * 1e3
      });
      return code;
    }
    async readCode(code) {
      return live(this.codes.get(code), Date.now());
    }
    async claimCode(code) {
      if (this.claimed.has(code) || !this.codes.has(code)) return false;
      this.claimed.add(code);
      return true;
    }
    // ---------------------------------------------------------------- records
    async users() {
      return this.userList.map((user3) => this.recordOf(user3));
    }
    /** A user as the administration routes report one: groups derived, not stored. */
    recordOf(user3) {
      return {
        ...user3,
        groups: [...this.groupList.values()].filter((group) => group.users.includes(user3.uid)).map((group) => group.uid)
      };
    }
    async createUser(input) {
      const user3 = {
        uid: `user-${randomHex(6)}`,
        username: input.username,
        displayName: input.displayName,
        isAdmin: input.isAdmin,
        isActive: input.isActive,
        needsToUpdatePassword: false,
        autoExec: input.autoExec,
        authProvider: input.authProvider
      };
      this.userList.push(user3);
      return this.recordOf(user3);
    }
    async updateUser(uid, change) {
      const user3 = this.userList.find((candidate) => candidate.uid === uid);
      if (!user3) return void 0;
      if (change.username !== void 0) user3.username = change.username;
      if (change.displayName !== void 0) user3.displayName = change.displayName;
      if (change.isAdmin !== void 0) user3.isAdmin = change.isAdmin;
      if (change.isActive !== void 0) user3.isActive = change.isActive;
      if (change.needsToUpdatePassword !== void 0)
        user3.needsToUpdatePassword = change.needsToUpdatePassword;
      if (change.autoExec !== void 0) user3.autoExec = change.autoExec;
      return this.recordOf(user3);
    }
    async deleteUser(uid) {
      const index = this.userList.findIndex((user3) => user3.uid === uid);
      if (index === -1) return;
      this.userList.splice(index, 1);
      this.passwords.delete(uid);
      for (const group of this.groupList.values())
        group.users = group.users.filter((member) => member !== uid);
      for (const [key, permission] of this.permissionList)
        if (permission.user === uid) this.permissionList.delete(key);
      for (const key of this.pairs.keys())
        if (key.startsWith(`${uid}|`)) this.pairs.delete(key);
    }
    async setPassword(uid, password) {
      this.passwords.set(uid, password);
    }
    async groups() {
      return [...this.groupList.values()];
    }
    async groupById(uid) {
      return this.groupList.get(uid);
    }
    async groupByName(name) {
      return [...this.groupList.values()].find((group) => group.name === name);
    }
    async createGroup(input) {
      const group = {
        uid: `group-${randomHex(6)}`,
        name: input.name,
        description: input.description,
        isActive: input.isActive,
        users: [],
        ...input.authProvider === void 0 ? {} : { authProvider: input.authProvider }
      };
      this.groupList.set(group.uid, group);
      return group;
    }
    async deleteGroup(uid) {
      this.groupList.delete(uid);
      for (const [key, permission] of this.permissionList)
        if (permission.group === uid) this.permissionList.delete(key);
    }
    async addToGroup(groupUid, userUid) {
      const group = this.groupList.get(groupUid);
      if (!group) return void 0;
      if (!group.users.includes(userUid)) group.users.push(userUid);
      return group;
    }
    async removeFromGroup(groupUid, userUid) {
      const group = this.groupList.get(groupUid);
      if (!group) return void 0;
      group.users = group.users.filter((member) => member !== userUid);
      return group;
    }
    async permissions() {
      return [...this.permissionList.values()];
    }
    async permissionById(uid) {
      return this.permissionList.get(uid);
    }
    async createPermission(input) {
      const permission = {
        uid: `rule-${randomHex(6)}`,
        path: input.path,
        type: input.type,
        setting: input.setting,
        user: input.user,
        group: input.group
      };
      this.permissionList.set(permission.uid, permission);
      return permission;
    }
    async setPermissionSetting(uid, setting) {
      const permission = this.permissionList.get(uid);
      if (!permission) return void 0;
      permission.setting = setting;
      return permission;
    }
    async deletePermission(uid) {
      this.permissionList.delete(uid);
    }
    async clients() {
      return [...this.clientRecords.values()];
    }
    async createClient(input) {
      this.clientRecords.set(input.clientId, input);
      this.clientMap.set(input.clientId, {
        clientId: input.clientId,
        accessTokenExpiration: input.accessTokenExpiration,
        refreshTokenExpiration: input.refreshTokenExpiration
      });
      return input;
    }
    /**
     * The fixture this store would be seeded from now.
     *
     * A host that persists the store - the browser build keeps it beside the
     * drive - writes this object and seeds the next boot from it, so the file a
     * person reads and the object the store speaks are the same shape. Passwords
     * are carried because a seed needs them to sign in: the administration
     * records deliberately leave them out, and a snapshot that did too would be a
     * fixture no one could log into.
     *
     * Tokens and authorization codes are absent on purpose. They are credentials
     * with a lifetime, minted per session; a persisted one would authenticate a
     * caller after the pair it names had been rotated or revoked, which is the
     * failure a token store exists to prevent.
     *
     * An account with no local password - one a directory imported, or one
     * created and never given a password - is stated without one. Writing an
     * empty string would seed an account the equality check signs in with `''`,
     * while an absent password refuses every attempt, which is what this store
     * itself answers for that account.
     */
    snapshot() {
      return {
        format: IDENTITY_FORMAT,
        users: this.userList.map((user3) => {
          const password = this.passwords.get(user3.uid);
          return {
            ...user3,
            ...password === void 0 ? {} : { password }
          };
        }),
        groups: [...this.groupList.values()].map((group) => ({
          ...group,
          // the store holds members as uids; the fixture states them by username,
          // which is what the constructor resolves back - writing uids here would
          // seed a group whose membership matches no account
          users: group.users.map(
            (uid) => this.userList.find((user3) => user3.uid === uid)?.username
          ).filter((username) => username !== void 0)
        })),
        permissions: [...this.permissionList.values()].map((permission) => ({
          ...permission
        })),
        clients: [...this.clientRecords.values()].map((client) => ({ ...client }))
      };
    }
  };

  // src/corpus/drive.ts
  var success2 = { status: "success" };
  var bytes = (...values) => Uint8Array.from(values);
  var manyMembers = (count) => Array.from({ length: count }, (_, at) => ({
    name: `f${at}.txt`,
    type: "file",
    code: ""
  }));
  var DRIVE_CORPUS = [
    {
      id: "create-file",
      route: "POST /SASjsApi/drive/file",
      description: "creates a file the drive did not have",
      request: {
        query: { _filePath: "/data/users.csv" },
        file: { name: "users.csv", contents: "id,name\n1,Ann\n" }
      },
      expect: { status: 200, body: success2 }
    },
    {
      id: "create-file-at-form-path",
      route: "POST /SASjsApi/drive/file",
      description: "takes the destination from the form field when the query has none",
      request: {
        file: { name: "x.csv", contents: "x" },
        body: { filePath: "/data/from-form.csv" }
      },
      expect: { status: 200, body: success2 }
    },
    {
      id: "create-file-over-existing",
      route: "POST /SASjsApi/drive/file",
      description: "refuses a create over a file that exists, as 409",
      seed: { "/data/exists.csv": "a" },
      request: {
        query: { _filePath: "/data/exists.csv" },
        file: { name: "x", contents: "b" }
      },
      expect: { status: 409, error: "File already exists." }
    },
    {
      id: "create-file-blocked-extension",
      route: "POST /SASjsApi/drive/file",
      description: "refuses a refused extension before touching the drive",
      request: {
        query: { _filePath: "/data/run.sh" },
        file: { name: "run.sh", contents: "x" }
      },
      expect: { status: 400, error: "Invalid file extension" }
    },
    {
      id: "create-file-outside-drive",
      route: "POST /SASjsApi/drive/file",
      description: "refuses a path that climbs out of the drive",
      request: {
        query: { _filePath: "/../escape.csv" },
        file: { name: "x", contents: "x" }
      },
      expect: { status: 400, error: "Can't put file outside drive." }
    },
    {
      id: "create-file-without-payload",
      route: "POST /SASjsApi/drive/file",
      description: "answers for a missing file with the server wording",
      request: { query: { _filePath: "/data/x.csv" } },
      expect: { status: 400, error: '"file" is not present.' }
    },
    {
      id: "create-file-without-destination",
      route: "POST /SASjsApi/drive/file",
      description: "answers for a missing destination with the validation wording",
      request: { file: { name: "x", contents: "x" } },
      expect: { status: 400, error: '"_filePath" is required' }
    },
    {
      id: "replace-file",
      route: "PATCH /SASjsApi/drive/file",
      description: "replaces the contents of a file that exists",
      seed: { "/data/keep.csv": "old" },
      request: {
        query: { _filePath: "/data/keep.csv" },
        file: { name: "keep.csv", contents: "new" }
      },
      expect: { status: 200, body: success2 }
    },
    {
      id: "replace-file-missing",
      route: "PATCH /SASjsApi/drive/file",
      description: "refuses a replace of a file that is not there, as 404",
      request: {
        query: { _filePath: "/data/missing.csv" },
        file: { name: "x", contents: "x" }
      },
      expect: { status: 404, error: `File doesn't exist.` }
    },
    {
      id: "replace-file-outside-drive",
      route: "PATCH /SASjsApi/drive/file",
      description: "refuses a replace of a path that climbs out of the drive",
      request: {
        query: { _filePath: "/../escape.csv" },
        file: { name: "x", contents: "x" }
      },
      expect: { status: 400, error: "Can't modify file outside drive." }
    },
    {
      id: "read-file",
      route: "GET /SASjsApi/drive/file",
      description: "answers with the file contents",
      seed: { "/data/keep.csv": "a,b\n1,2\n" },
      request: { query: { _filePath: "/data/keep.csv" } },
      expect: { status: 200, contents: "a,b\n1,2\n" }
    },
    {
      id: "read-file-missing",
      route: "GET /SASjsApi/drive/file",
      description: "refuses a read of a file that is not there",
      request: { query: { _filePath: "/data/missing.csv" } },
      expect: { status: 404, error: `File doesn't exist.` }
    },
    {
      id: "read-file-outside-drive",
      route: "GET /SASjsApi/drive/file",
      description: "refuses a read of a path that climbs out of the drive",
      request: { query: { _filePath: "/../escape.csv" } },
      expect: { status: 400, error: "Can't get file outside drive." }
    },
    {
      id: "delete-file",
      route: "DELETE /SASjsApi/drive/file",
      description: "deletes a file that exists",
      seed: { "/data/keep.csv": "a" },
      request: { query: { _filePath: "/data/keep.csv" } },
      expect: { status: 200, body: success2 }
    },
    {
      id: "delete-file-missing",
      route: "DELETE /SASjsApi/drive/file",
      description: "refuses a delete of a file that is not there",
      request: { query: { _filePath: "/data/missing.csv" } },
      expect: { status: 404, error: `File doesn't exist.` }
    },
    {
      id: "delete-file-outside-drive",
      route: "DELETE /SASjsApi/drive/file",
      description: "refuses a delete of a path that climbs out of the drive",
      request: { query: { _filePath: "/../escape.csv" } },
      expect: { status: 400, error: "Can't delete file outside drive." }
    },
    {
      id: "list-folder",
      route: "GET /SASjsApi/drive/folder",
      description: "lists the files and folders of a folder",
      seed: { "/data/a.csv": "a", "/data/reports/b.csv": "b" },
      request: { query: { _folderPath: "/data" } },
      expect: { status: 200, body: { files: ["a.csv"], folders: ["reports"] } }
    },
    {
      id: "list-folder-missing",
      route: "GET /SASjsApi/drive/folder",
      description: "refuses a listing of a folder that is not there",
      request: { query: { _folderPath: "/nope" } },
      expect: { status: 404, error: `Folder doesn't exist.` }
    },
    {
      id: "list-folder-outside-drive",
      route: "GET /SASjsApi/drive/folder",
      description: "refuses a listing of a path that climbs out of the drive",
      request: { query: { _folderPath: "/../escape" } },
      expect: { status: 400, error: "Can't get folder outside drive." }
    },
    {
      id: "delete-folder-without-path",
      route: "DELETE /SASjsApi/drive/folder",
      description: "answers for a missing folder path, because the table marks it required",
      request: {},
      expect: { status: 400, error: '"_folderPath" is required' }
    },
    {
      id: "create-folder-without-path",
      route: "POST /SASjsApi/drive/folder",
      description: "answers for a missing folder path in the body",
      request: { body: {} },
      expect: { status: 400, error: '"folderPath" is required' }
    },
    {
      id: "create-folder",
      route: "POST /SASjsApi/drive/folder",
      description: "creates a folder",
      request: { body: { folderPath: "/data/reports" } },
      expect: { status: 200, body: success2 }
    },
    {
      id: "create-folder-existing",
      route: "POST /SASjsApi/drive/folder",
      description: "refuses a folder that already exists, as 409",
      seed: { "/data/reports/a.csv": "a" },
      request: { body: { folderPath: "/data/reports" } },
      expect: { status: 409, error: "Folder already exists." }
    },
    {
      id: "delete-folder",
      route: "DELETE /SASjsApi/drive/folder",
      description: "deletes a folder with everything under it",
      seed: { "/data/reports/a.csv": "a", "/data/reports/nested/b.csv": "b" },
      request: { query: { _folderPath: "/data/reports" } },
      expect: { status: 200, body: success2 }
    },
    {
      id: "delete-folder-missing",
      route: "DELETE /SASjsApi/drive/folder",
      description: "refuses a delete of a folder that is not there",
      request: { query: { _folderPath: "/nope" } },
      expect: { status: 404, error: `Folder doesn't exist.` }
    },
    {
      id: "rename-file",
      route: "POST /SASjsApi/drive/rename",
      description: "moves a file to a new path",
      seed: { "/data/old.csv": "r" },
      request: { body: { oldPath: "/data/old.csv", newPath: "/data/new.csv" } },
      expect: { status: 200, body: success2 }
    },
    {
      id: "rename-onto-existing",
      route: "POST /SASjsApi/drive/rename",
      description: "refuses a move onto something that exists",
      seed: { "/data/a.csv": "a", "/data/b.csv": "b" },
      request: { body: { oldPath: "/data/a.csv", newPath: "/data/b.csv" } },
      expect: { status: 409, error: "File with new name already exists." }
    },
    {
      id: "rename-missing",
      route: "POST /SASjsApi/drive/rename",
      description: "refuses a move of something that is not there",
      request: { body: { oldPath: "/data/nope.csv", newPath: "/data/x.csv" } },
      expect: { status: 404, error: "No file/folder found for provided path." }
    },
    {
      id: "rename-file-to-blocked-extension",
      route: "POST /SASjsApi/drive/rename",
      description: "refuses a rename that would produce a name the file routes refuse",
      seed: { "/data/report.csv": "a,b" },
      request: {
        body: { oldPath: "/data/report.csv", newPath: "/data/report.sh" }
      },
      expect: { status: 400, error: "Invalid file extension" }
    },
    {
      id: "rename-folder-to-dotted-name",
      route: "POST /SASjsApi/drive/rename",
      description: "renames a folder whose new name carries a blocked suffix",
      seed: { "/data/reports/a.csv": "a" },
      request: {
        body: { oldPath: "/data/reports", newPath: "/data/reports.sh" }
      },
      expect: { status: 200, body: { status: "success" } }
    },
    {
      id: "rename-folder-into-itself",
      route: "POST /SASjsApi/drive/rename",
      description: "refuses a folder moved inside itself, which the server loses at the filesystem",
      seed: { "/data/reports/a.csv": "a" },
      request: {
        body: { oldPath: "/data/reports", newPath: "/data/reports/nested" }
      },
      expect: {
        status: 400,
        error: "New path can't be inside the folder being moved."
      }
    },
    {
      id: "tree",
      route: "GET /SASjsApi/drive/filetree",
      description: "answers with the drive tree",
      seed: { "/data/a.csv": "a" },
      request: { query: { _folderPath: "/data" } },
      expect: {
        status: 200,
        // Partial, because a file's `created` and `modified` are the host's
        // clock rather than the contract: the shape is asserted, the timestamps
        // are whatever the host that ran the case says they are.
        partial: {
          status: "success",
          tree: {
            name: "data",
            relativePath: "/data",
            isFolder: true,
            children: [
              {
                name: "a.csv",
                relativePath: "/data/a.csv",
                isFolder: false,
                children: []
              }
            ]
          }
        }
      }
    },
    {
      id: "deploy-tree",
      route: "POST /SASjsApi/drive/deploy",
      description: "writes a whole tree under the appLoc it names",
      request: {
        body: {
          appLoc: "/Public/apps/demo",
          fileTree: {
            members: [
              {
                name: "services",
                type: "folder",
                members: [{ name: "run", type: "service", code: "%put hi;" }]
              },
              { name: "index.html", type: "file", code: "PGgxPkhlbGxvPC9oMT4=" }
            ]
          }
        }
      },
      expect: {
        status: 200,
        body: {
          status: "success",
          message: "Files deployed successfully to @sasjs/server."
        }
      }
    },
    {
      id: "deploy-refused-by-entry-count",
      route: "POST /SASjsApi/drive/deploy",
      description: "refuses a tree over the entry cap, naming the figure and the cap",
      request: {
        body: {
          appLoc: "/Public/apps/many",
          fileTree: { members: manyMembers(10001) }
        }
      },
      expect: {
        status: 413,
        body: {
          status: "failure",
          message: "The file tree exceeds the deploy limit: 10001 entries (maximum 10000)."
        },
        error: "The file tree exceeds the deploy limit: 10001 entries (maximum 10000)."
      }
    },
    {
      id: "deploy-refused-by-name",
      route: "POST /SASjsApi/drive/deploy",
      description: "refuses a member name that would escape the deployment root",
      request: {
        body: {
          appLoc: "/Public/apps/hostile",
          fileTree: {
            members: [{ name: "../escape", type: "service", code: "%put hi;" }]
          }
        }
      },
      expect: {
        status: 400,
        body: {
          status: "failure",
          message: "Invalid member name: '../escape.sas'. Member names must be single path segments (no '/', '\\', '..')."
        },
        error: "Invalid member name: '../escape.sas'. Member names must be single path segments (no '/', '\\', '..')."
      }
    },
    {
      id: "deploy-refused-by-shape",
      route: "POST /SASjsApi/drive/deploy",
      description: "refuses a fileTree that is not a tree, in the routes own envelope",
      request: { body: { appLoc: "/Public/apps/bad", fileTree: { members: 1 } } },
      expect: {
        status: 400,
        body: {
          status: "failure",
          message: "Provided not supported data format."
        },
        error: "Provided not supported data format."
      }
    },
    {
      id: "deploy-refused-by-store",
      route: "POST /SASjsApi/drive/deploy",
      description: "answers the routes 500 when the drive refuses the write",
      unwritable: true,
      request: {
        body: {
          appLoc: "/Public/apps/demo",
          fileTree: {
            members: [{ name: "run", type: "service", code: "%put hi;" }]
          }
        }
      },
      expect: {
        status: 500,
        body: { status: "failure", message: "Deployment failed!" },
        error: "Deployment failed!"
      }
    },
    {
      id: "deploy-refused-outside-drive",
      route: "POST /SASjsApi/drive/deploy",
      description: "refuses an appLoc that resolves outside the drive",
      request: {
        body: { appLoc: "/../outside", fileTree: { members: [] } }
      },
      expect: {
        status: 400,
        body: { status: "failure", message: "appLoc cannot be outside drive." },
        error: "appLoc cannot be outside drive."
      }
    },
    {
      id: "bytes-round-trip",
      route: "GET /SASjsApi/drive/file",
      description: "keeps a byte file as bytes",
      seed: { "/data/pack.zip": bytes(80, 75, 3, 4) },
      request: { query: { _filePath: "/data/pack.zip" } },
      expect: { status: 200, contents: bytes(80, 75, 3, 4) }
    }
  ];

  // src/corpus/identity.ts
  var SIGNED_IN = {
    ...DEFAULT_IDENTITY,
    tokens: [
      {
        username: "sasjsuser",
        clientId: "web_app",
        accessToken: "seed-access",
        refreshToken: "seed-refresh"
      },
      {
        username: "sasjsadmin",
        clientId: "removed_client",
        accessToken: "seed-access-orphan",
        refreshToken: "seed-refresh-orphan"
      }
    ],
    codes: [
      { code: "seed-code", username: "sasjsuser", clientId: "web_app" },
      {
        code: "seed-orphan-code",
        username: "sasjsuser",
        clientId: "removed_client"
      },
      // the same shape with a pair already issued: the exchange must still refuse,
      // rather than handing back tokens that belong to a client that is gone
      {
        code: "seed-orphan-pair-code",
        username: "sasjsadmin",
        clientId: "removed_client"
      }
    ]
  };
  var DEACTIVATED = {
    ...SIGNED_IN,
    users: SIGNED_IN.users.map(
      (user3) => user3.username === "sasjsuser" ? { ...user3, isActive: false } : user3
    )
  };
  var user2 = {
    username: "sasjsuser",
    displayName: "Demo User",
    isAdmin: false,
    needsToUpdatePassword: false
  };
  var IDENTITY_CORPUS = [
    {
      id: "login",
      route: "POST /SASLogon/login",
      description: "signs a seeded user in",
      request: { body: { username: "sasjsadmin", password: "Orion123" } },
      expect: {
        status: 200,
        partial: {
          loggedIn: true,
          user: {
            username: "sasjsadmin",
            displayName: "Demo Admin",
            isAdmin: true,
            needsToUpdatePassword: false
          }
        }
      }
    },
    {
      id: "login-missing-username",
      route: "POST /SASLogon/login",
      description: "refuses a sign-in with no username as 400, naming the field",
      request: { body: { password: "Orion123" } },
      expect: { status: 400, error: '"username" is required' }
    },
    {
      id: "login-deactivated",
      route: "POST /SASLogon/login",
      description: "refuses a deactivated account, naming it",
      identity: DEACTIVATED,
      request: { body: { username: "sasjsuser", password: "Orion123" } },
      expect: { status: 401, error: "This account is not active." }
    },
    {
      id: "login-wrong-password",
      route: "POST /SASLogon/login",
      description: "refuses a wrong password as 401, naming it",
      request: { body: { username: "sasjsadmin", password: "wrong123" } },
      expect: { status: 401, error: "Invalid Password." }
    },
    {
      id: "login-unknown-user",
      route: "POST /SASLogon/login",
      description: "refuses an unknown username as 401, naming it",
      request: { body: { username: "nobody", password: "Orion123" } },
      expect: { status: 401, error: "Username is not found." }
    },
    {
      id: "authorize",
      route: "POST /SASLogon/authorize",
      description: "issues a code to a signed-in caller",
      identity: SIGNED_IN,
      request: {
        token: "seed-access",
        body: { clientId: "web_app" }
      },
      expect: { status: 200, keys: ["code"] }
    },
    {
      id: "authorize-missing-client",
      route: "POST /SASLogon/authorize",
      description: "refuses an authorize with no clientId as 400, naming the field",
      identity: SIGNED_IN,
      request: { token: "seed-access", body: {} },
      expect: { status: 400, error: '"clientId" is required' }
    },
    {
      id: "authorize-without-session",
      route: "POST /SASLogon/authorize",
      description: "refuses with 401 when no caller is signed in",
      request: { body: { clientId: "web_app" } },
      expect: { status: 401, error: "Unauthorized" }
    },
    {
      id: "authorize-unknown-client",
      route: "POST /SASLogon/authorize",
      description: "refuses an unknown client with 403",
      identity: SIGNED_IN,
      request: { token: "seed-access", body: { clientId: "nope" } },
      expect: { status: 403, error: "Invalid clientId." }
    },
    {
      id: "exchange-code",
      route: "POST /SASjsApi/auth/token",
      description: "exchanges a code for a token pair",
      identity: SIGNED_IN,
      request: { body: { clientId: "web_app", code: "seed-code" } },
      expect: { status: 200, keys: ["accessToken", "refreshToken"] }
    },
    {
      id: "exchange-missing-client",
      route: "POST /SASjsApi/auth/token",
      description: "refuses an exchange with no clientId as 400, naming the field",
      identity: SIGNED_IN,
      request: { body: { code: "seed-code" } },
      expect: { status: 400, error: '"clientId" is required' }
    },
    {
      id: "exchange-code-unknown",
      route: "POST /SASjsApi/auth/token",
      description: "refuses a code the host never issued",
      request: { body: { clientId: "web_app", code: "not-a-code" } },
      expect: { status: 401, error: "Invalid Auth Code" }
    },
    {
      id: "exchange-code-other-client",
      route: "POST /SASjsApi/auth/token",
      description: "refuses a code presented for another client, as a bad code",
      identity: SIGNED_IN,
      request: { body: { clientId: "sasjs", code: "seed-code" } },
      expect: { status: 401, error: "Invalid Auth Code" }
    },
    {
      id: "exchange-code-client-gone",
      route: "POST /SASjsApi/auth/token",
      description: "refuses a valid code whose client no longer exists",
      identity: SIGNED_IN,
      request: { body: { clientId: "removed_client", code: "seed-orphan-code" } },
      expect: { status: 401, error: "Invalid clientId." }
    },
    {
      id: "exchange-code-client-gone-with-pair",
      route: "POST /SASjsApi/auth/token",
      description: "refuses an exchange whose client is gone even when a pair was issued before it was deleted",
      identity: SIGNED_IN,
      request: {
        body: { clientId: "removed_client", code: "seed-orphan-pair-code" }
      },
      expect: { status: 401, error: "Invalid clientId." }
    },
    {
      id: "exchange-code-deactivated",
      route: "POST /SASjsApi/auth/token",
      description: "refuses an exchange for an account that has been deactivated",
      identity: DEACTIVATED,
      request: { body: { clientId: "web_app", code: "seed-code" } },
      expect: { status: 401, error: "Unauthorized" }
    },
    {
      id: "refresh",
      route: "POST /SASjsApi/auth/refresh",
      description: "mints a new pair from a refresh token",
      identity: SIGNED_IN,
      request: { token: "seed-refresh" },
      expect: { status: 200, keys: ["accessToken", "refreshToken"] }
    },
    {
      id: "refresh-invalid",
      route: "POST /SASjsApi/auth/refresh",
      description: "refuses a refresh token it did not issue",
      request: { token: "not-a-token" },
      expect: { status: 401, error: "Unauthorized" }
    },
    {
      id: "refresh-without-token",
      route: "POST /SASjsApi/auth/refresh",
      description: "refuses a refresh with no token at all",
      request: {},
      expect: { status: 401, error: "Unauthorized" }
    },
    {
      id: "refresh-client-gone",
      route: "POST /SASjsApi/auth/refresh",
      description: "refuses a refresh whose client no longer exists",
      identity: SIGNED_IN,
      request: { token: "seed-refresh-orphan" },
      expect: { status: 401, error: "Invalid clientId." }
    },
    {
      id: "refresh-deactivated",
      route: "POST /SASjsApi/auth/refresh",
      description: "refuses a refresh for an account that has been deactivated, as the server does on every request",
      identity: DEACTIVATED,
      request: { token: "seed-refresh" },
      expect: { status: 401, error: "Unauthorized" }
    },
    {
      id: "logout",
      route: "POST /SASjsApi/auth/logout",
      description: "revokes the caller pair and answers 204",
      identity: SIGNED_IN,
      request: { token: "seed-access" },
      expect: { status: 204 }
    },
    {
      id: "logout-without-token",
      route: "POST /SASjsApi/auth/logout",
      description: "refuses a logout with no valid token",
      request: {},
      expect: { status: 401, error: "Unauthorized" }
    },
    {
      id: "session",
      route: "GET /SASjsApi/session",
      description: "reports the caller the token names",
      identity: SIGNED_IN,
      request: { token: "seed-access" },
      expect: { status: 200, partial: user2 }
    },
    {
      id: "session-deactivated",
      route: "GET /SASjsApi/session",
      description: "stops resolving a token whose account has been deactivated",
      identity: DEACTIVATED,
      request: { token: "seed-access" },
      expect: { status: 401, error: "Unauthorized" }
    },
    {
      id: "session-without-token",
      route: "GET /SASjsApi/session",
      description: "refuses the session read with no caller",
      request: {},
      expect: { status: 401, error: "Unauthorized" }
    },
    {
      id: "sign-out",
      route: "GET /SASLogon/logout",
      description: "answers the body the browser sign-out returns",
      request: {},
      expect: { status: 200, contents: "OK!" }
    }
  ];

  // src/corpus/deploy.ts
  var SUBJECT = { userId: "user-admin", clientId: "web_app" };
  var manyMembers2 = (count) => Array.from({ length: count }, (_, at) => ({
    name: `file-${at}.txt`,
    type: "file",
    code: ""
  }));
  var DEPLOY_CORPUS = [
    {
      id: "deploy-unpublish",
      route: "DELETE /SASjsApi/drive/deploy",
      description: "removes the app the id names, and says what went",
      request: {
        subject: SUBJECT,
        body: { id: "6f1c1c1e-6a1e-4c4a-9d1a-1b2c3d4e5f60" }
      },
      expect: {
        status: 200,
        partial: {
          status: "success",
          app: { id: "6f1c1c1e-6a1e-4c4a-9d1a-1b2c3d4e5f60", name: "myApp" }
        }
      }
    },
    {
      id: "deploy-unpublish-no-id",
      route: "DELETE /SASjsApi/drive/deploy",
      description: "refuses a body that does not say which app to remove",
      request: { subject: SUBJECT, body: {} },
      expect: { status: 400, error: '"id" is required' }
    },
    {
      id: "deploy-unpublish-unknown-id",
      route: "DELETE /SASjsApi/drive/deploy",
      description: "answers 404 for an id the index does not hold",
      request: {
        subject: SUBJECT,
        body: { id: "11111111-1111-4111-8111-111111111111" }
      },
      expect: { status: 404, error: "No app is published with that id." }
    },
    // ------------------------------------------- the uploaded-archive route
    // The archive is expanded by the host, so what arrives here is the same tree
    // `POST /deploy` takes - which is why every answer below matches its twin. The
    // folder and the stream are stated in the QUERY, where the document puts them on
    // this route: the body is the archive. A host that receives an archive builds it
    // from the tree below; the tree is what the archive has to expand to.
    {
      id: "upload-tree",
      route: "POST /SASjsApi/drive/deploy/upload",
      description: "writes the tree an uploaded archive expanded to",
      request: {
        subject: SUBJECT,
        query: { appLoc: "/Public/apps/uploaded" },
        body: {
          fileTree: {
            members: [
              {
                name: "index.html",
                type: "file",
                code: "PGgxPkhlbGxvPC9oMT4=",
                encoding: "base64"
              }
            ]
          }
        }
      },
      expect: {
        status: 200,
        body: {
          status: "success",
          message: "Files deployed successfully to @sasjs/server."
        }
      }
    },
    {
      id: "upload-query-fields",
      route: "POST /SASjsApi/drive/deploy/upload",
      description: "takes the folder and the stream from the query, where the document states them",
      request: {
        subject: SUBJECT,
        query: { appLoc: "/Public/apps/from-query", streamWebFolder: "web" },
        body: {
          fileTree: {
            members: [
              {
                name: "services",
                type: "folder",
                members: [
                  {
                    name: "web",
                    type: "folder",
                    members: [
                      { name: "index.html", type: "file", code: "<h1>Hello</h1>" }
                    ]
                  }
                ]
              }
            ]
          }
        }
      },
      expect: {
        status: 200,
        partial: {
          status: "success",
          app: { name: "from-query" }
        }
      }
    },
    {
      id: "deploy-refuses-a-tree-without-its-web-folder",
      route: "POST /SASjsApi/drive/deploy",
      description: "refuses a stream the tree does not carry, rather than indexing an app that would answer 404",
      request: {
        subject: SUBJECT,
        body: {
          appLoc: "/Public/apps/no-web",
          streamWebFolder: "web",
          fileTree: {
            members: [
              { name: "index.html", type: "file", code: "<h1>Hello</h1>" }
            ]
          }
        }
      },
      expect: {
        status: 400,
        error: 'The deployed tree has no "services/web" folder, so nothing would be published at /Public/apps/no-web. Deploy the web assets under services/web, or omit streamWebFolder.'
      }
    },
    {
      id: "upload-text-file",
      route: "POST /SASjsApi/drive/deploy/upload",
      description: "writes a file member as its own text when no encoding is stated",
      request: {
        subject: SUBJECT,
        query: { appLoc: "/Public/apps/text" },
        body: {
          fileTree: {
            members: [
              { name: "index.html", type: "file", code: "<h1>Hello</h1>" }
            ]
          }
        }
      },
      expect: {
        status: 200,
        body: {
          status: "success",
          message: "Files deployed successfully to @sasjs/server."
        }
      }
    },
    {
      id: "upload-refused-by-shape",
      route: "POST /SASjsApi/drive/deploy/upload",
      description: "refuses an expansion that is not a tree",
      // no archive expands to this: only a host handed an expansion can send it
      transport: "expansion",
      request: {
        subject: SUBJECT,
        query: { appLoc: "/Public/apps/bad" },
        body: { fileTree: { members: 1 } }
      },
      expect: {
        status: 400,
        body: {
          status: "failure",
          message: "Provided not supported data format."
        },
        error: "Provided not supported data format."
      }
    },
    {
      id: "upload-refused-by-entry-count",
      route: "POST /SASjsApi/drive/deploy/upload",
      description: "applies the deploy cap to the expanded tree, not the bytes",
      request: {
        subject: SUBJECT,
        query: { appLoc: "/Public/apps/many" },
        body: {
          fileTree: { members: manyMembers2(10001) }
        }
      },
      expect: {
        status: 413,
        body: {
          status: "failure",
          message: "The file tree exceeds the deploy limit: 10001 entries (maximum 10000)."
        },
        error: "The file tree exceeds the deploy limit: 10001 entries (maximum 10000)."
      }
    },
    // ------------------------------------------- a bundle that is an app
    // One deploy writes the tree and indexes the app, from the manifest at the
    // root of the archive. The id is minted, so the case pins what can be pinned:
    // the app exists, under the label the manifest states.
    {
      id: "deploy-publishes-an-app",
      route: "POST /SASjsApi/drive/deploy",
      description: "indexes a bundle as an app from the manifest it carries, in one request",
      request: {
        subject: SUBJECT,
        body: {
          appLoc: "/Public/apps/mario",
          fileTree: {
            members: [
              {
                name: "sasjs.app.json",
                type: "file",
                code: JSON.stringify({
                  name: "Mario",
                  streamWebFolder: "web",
                  logo: "logo.png"
                })
              },
              {
                name: "services",
                type: "folder",
                members: [
                  {
                    name: "web",
                    type: "folder",
                    members: [
                      { name: "index.html", type: "file", code: "<h1>Mario</h1>" }
                    ]
                  },
                  { name: "run", type: "service", code: "%put hi;" }
                ]
              }
            ]
          }
        }
      },
      expect: {
        status: 200,
        partial: {
          status: "success",
          app: { name: "Mario" }
        }
      }
    },
    {
      id: "deploy-refuses-a-bad-manifest",
      route: "POST /SASjsApi/drive/deploy",
      description: "refuses a bundle whose manifest is not JSON",
      request: {
        subject: SUBJECT,
        body: {
          appLoc: "/Public/apps/bad-manifest",
          fileTree: {
            members: [{ name: "sasjs.app.json", type: "file", code: "{not json" }]
          }
        }
      },
      expect: {
        status: 400
      }
    },
    {
      id: "upload-refused-by-store",
      route: "POST /SASjsApi/drive/deploy/upload",
      description: "answers the routes 500 when the drive refuses the write",
      unwritable: true,
      request: {
        subject: SUBJECT,
        query: { appLoc: "/Public/apps/demo" },
        body: {
          fileTree: {
            members: [{ name: "run", type: "service", code: "%put hi;" }]
          }
        }
      },
      expect: {
        status: 500,
        body: { status: "failure", message: "Deployment failed!" },
        error: "Deployment failed!"
      }
    },
    {
      id: "upload-replaces-the-folder",
      route: "POST /SASjsApi/drive/deploy/upload",
      description: "an archive upload is the folder's whole contents, so a file it drops is gone",
      seed: {
        "/Public/apps/replaced/services/web/old.html": "<h1>old</h1>"
      },
      request: {
        subject: SUBJECT,
        query: { appLoc: "/Public/apps/replaced", streamWebFolder: "web" },
        body: {
          fileTree: {
            members: [
              {
                name: "services",
                type: "folder",
                members: [
                  {
                    name: "web",
                    type: "folder",
                    members: [
                      { name: "index.html", type: "file", code: "<h1>new</h1>" }
                    ]
                  }
                ]
              }
            ]
          }
        }
      },
      expect: {
        status: 200,
        partial: { status: "success", app: { name: "replaced" } }
      },
      expectDrive: {
        present: ["/Public/apps/replaced/services/web/index.html"],
        missing: ["/Public/apps/replaced/services/web/old.html"]
      }
    },
    {
      id: "deploy-keeps-what-is-there",
      route: "POST /SASjsApi/drive/deploy",
      description: "the JSON route writes over what is there unless it is told to replace",
      seed: {
        "/Public/apps/kept/old.html": "<h1>old</h1>"
      },
      request: {
        subject: SUBJECT,
        body: {
          appLoc: "/Public/apps/kept",
          fileTree: {
            members: [{ name: "a.html", type: "file", code: "<h1>a</h1>" }]
          }
        }
      },
      expect: { status: 200 },
      expectDrive: {
        present: ["/Public/apps/kept/a.html", "/Public/apps/kept/old.html"]
      }
    }
  ];

  // src/corpus/session.ts
  var ADMIN = { userId: "user-admin", clientId: "web_app" };
  var RESTRICTED = { userId: "user-restricted", clientId: "web_app" };
  var notFound = (id) => `Session with ID '${id}' was not found.`;
  var UNAUTHORIZED = "Unauthorized";
  var SESSION_CORPUS = [
    // ---------------------------------------------------------------- summary
    {
      id: "session-summary-own",
      route: "GET /SASjsApi/session/{sessionId}",
      description: "answers the owner the summary of their own session",
      request: { subject: ADMIN, params: { sessionId: "sess-admin" } },
      expect: {
        status: 200,
        body: {
          sessionId: "sess-admin",
          state: "completed",
          pid: 4242,
          creationTimeStamp: "2026-11-07T09:00:00.000Z",
          deathTimeStamp: "2026-11-07T09:00:04.000Z",
          expiresAfterMins: { mins: 60, used: false }
        }
      }
    },
    {
      id: "session-summary-as-admin",
      route: "GET /SASjsApi/session/{sessionId}",
      description: "answers an administrator another account's session",
      request: { subject: ADMIN, params: { sessionId: "sess-restricted" } },
      // both stamps: the document requires them, and this host stamps a session's
      // death time at creation rather than at completion - a running session
      // answers with the moment it is due to be destroyed
      expect: {
        status: 200,
        body: {
          sessionId: "sess-restricted",
          state: "running",
          pid: 4243,
          creationTimeStamp: "2026-11-07T09:05:00.000Z",
          deathTimeStamp: "2026-11-07T09:20:00.000Z"
        }
      }
    },
    {
      id: "session-summary-unauthenticated",
      route: "GET /SASjsApi/session/{sessionId}",
      description: "refuses a caller with no token",
      request: { params: { sessionId: "sess-admin" } },
      expect: { status: 401, error: UNAUTHORIZED }
    },
    {
      id: "session-summary-foreign",
      route: "GET /SASjsApi/session/{sessionId}",
      description: "answers 404 for another account's session, not 403",
      request: { subject: RESTRICTED, params: { sessionId: "sess-admin" } },
      expect: { status: 404, error: notFound("sess-admin") }
    },
    {
      id: "session-summary-unknown",
      route: "GET /SASjsApi/session/{sessionId}",
      description: "answers the same 404 for a session that does not exist",
      request: { subject: ADMIN, params: { sessionId: "sess-nope" } },
      expect: { status: 404, error: notFound("sess-nope") }
    },
    // -------------------------------------------------------------------- log
    {
      id: "session-log-own",
      route: "GET /SASjsApi/session/{sessionId}/log",
      description: "answers the log this session wrote",
      request: { subject: ADMIN, params: { sessionId: "sess-admin" } },
      expect: {
        status: 200,
        contents: "NOTE: session started\nNOTE: session completed\n"
      }
    },
    {
      id: "session-log-nothing-written",
      route: "GET /SASjsApi/session/{sessionId}/log",
      description: "answers an empty body for a session that has written nothing",
      request: { subject: ADMIN, params: { sessionId: "sess-silent" } },
      expect: { status: 200, contents: "" }
    },
    {
      id: "session-log-unauthenticated",
      route: "GET /SASjsApi/session/{sessionId}/log",
      description: "refuses a caller with no token",
      request: { params: { sessionId: "sess-admin" } },
      expect: { status: 401, error: UNAUTHORIZED }
    },
    {
      id: "session-log-foreign",
      route: "GET /SASjsApi/session/{sessionId}/log",
      description: "will not read another account's log",
      request: { subject: RESTRICTED, params: { sessionId: "sess-admin" } },
      expect: { status: 404, error: notFound("sess-admin") }
    },
    // ----------------------------------------------------------------- output
    {
      id: "session-output-own",
      route: "GET /SASjsApi/session/{sessionId}/output",
      description: "answers the webout this session produced",
      request: { subject: ADMIN, params: { sessionId: "sess-admin" } },
      expect: { status: 200, contents: "<html><body>42</body></html>" }
    },
    {
      id: "session-output-unauthenticated",
      route: "GET /SASjsApi/session/{sessionId}/output",
      description: "refuses a caller with no token",
      request: { params: { sessionId: "sess-admin" } },
      expect: { status: 401, error: UNAUTHORIZED }
    },
    {
      id: "session-output-foreign",
      route: "GET /SASjsApi/session/{sessionId}/output",
      description: "will not read another account's webout",
      request: { subject: RESTRICTED, params: { sessionId: "sess-admin" } },
      expect: { status: 404, error: notFound("sess-admin") }
    },
    // ------------------------------------------------------------------ state
    {
      id: "session-state-own",
      route: "GET /SASjsApi/session/{sessionId}/state",
      description: "answers the run time's state for this session",
      request: { subject: RESTRICTED, params: { sessionId: "sess-restricted" } },
      // the state alone: the document's SessionStateResponse permits no other
      // property, and `sasjs/server` answers exactly this object
      expect: { status: 200, body: { state: "running" } }
    },
    {
      id: "session-state-unauthenticated",
      route: "GET /SASjsApi/session/{sessionId}/state",
      description: "refuses a caller with no token",
      request: { params: { sessionId: "sess-restricted" } },
      expect: { status: 401, error: UNAUTHORIZED }
    },
    {
      id: "session-state-foreign",
      route: "GET /SASjsApi/session/{sessionId}/state",
      description: "will not report another account's session state",
      request: { subject: RESTRICTED, params: { sessionId: "sess-admin" } },
      expect: { status: 404, error: notFound("sess-admin") }
    }
  ];

  // src/session/service.ts
  var createSessionService = (directory, host) => {
    const notFound2 = (id) => `Session with ID '${id}' was not found.`;
    const visible = async (caller, id) => {
      if (!caller) throw new ApiError(401, "Unauthorized");
      const reader = await directory.userById(
        caller.userId
      );
      if (!reader || !reader.isActive) throw new ApiError(401, "Unauthorized");
      const session = await host.session(id);
      if (!session) throw new ApiError(404, notFound2(id));
      const owner = session.owner;
      if (owner !== reader.uid && owner !== reader.username && !reader.isAdmin)
        throw new ApiError(404, notFound2(id));
      return session;
    };
    return {
      async summary(caller, id) {
        const session = await visible(caller, id);
        return session.summary;
      },
      async state(caller, id) {
        await visible(caller, id);
        const state = await host.state(id);
        if (!state) throw new ApiError(404, notFound2(id));
        return state;
      },
      async log(caller, id) {
        await visible(caller, id);
        const log = await host.log(id);
        if (log === void 0) throw new ApiError(404, notFound2(id));
        return log;
      },
      async output(caller, id) {
        await visible(caller, id);
        const output = await host.output(id);
        if (output === void 0) throw new ApiError(404, notFound2(id));
        return output;
      }
    };
  };

  // src/session/memory-host.ts
  var DEFAULT_SESSIONS = {
    "sess-admin": {
      owner: "user-admin",
      summary: {
        sessionId: "sess-admin",
        state: "completed",
        pid: 4242,
        creationTimeStamp: "2026-11-07T09:00:00.000Z",
        deathTimeStamp: "2026-11-07T09:00:04.000Z",
        expiresAfterMins: { mins: 60, used: false }
      }
    },
    "sess-restricted": {
      owner: "user-restricted",
      summary: {
        sessionId: "sess-restricted",
        state: "running",
        pid: 4243,
        creationTimeStamp: "2026-11-07T09:05:00.000Z",
        // the document makes both stamps required, and a real session carries
        // the death stamp from the moment it is created: sasjs/server writes
        // creation + its default lifetime, which is what a poller reads to know
        // when the folder will be gone. A running session without one is a shape
        // no host produces.
        deathTimeStamp: "2026-11-07T09:20:00.000Z"
      }
    },
    "sess-silent": {
      owner: "user-admin",
      summary: {
        sessionId: "sess-silent",
        state: "running",
        pid: 4244,
        creationTimeStamp: "2026-11-07T09:10:00.000Z"
      }
    }
  };
  var STATES = {
    // `state` alone: the document's SessionStateResponse allows no other property,
    // and a mock that answered `pid` or a line count would let a case pass here
    // and fail against a server that answers the shape the document states
    "sess-admin": { state: "completed" },
    "sess-restricted": { state: "running" }
  };
  var LOGS = {
    "sess-admin": "NOTE: session started\nNOTE: session completed\n",
    "sess-restricted": "NOTE: session started\n",
    "sess-silent": ""
  };
  var OUTPUTS = {
    "sess-admin": {
      contents: "<html><body>42</body></html>",
      contentType: "text/html"
    },
    "sess-restricted": { contents: "" },
    "sess-silent": { contents: "" }
  };
  var MemorySessionHost = class {
    constructor(sessions = {
      ...DEFAULT_SESSIONS
    }, states = {
      ...STATES
    }, logs = { ...LOGS }, outputs = {
      ...OUTPUTS
    }) {
      this.sessions = sessions;
      this.states = states;
      this.logs = logs;
      this.outputs = outputs;
    }
    async session(id) {
      return this.sessions[id];
    }
    async state(id) {
      return this.states[id];
    }
    async log(id) {
      return this.logs[id];
    }
    async output(id) {
      return this.outputs[id];
    }
  };

  // src/runtime/service.ts
  var CODE_DEBUG = 131;
  var DOCUMENTED_RUN_TIMES = ["sas", "js", "py", "r", "sasviya"];
  var parseDebugValue = (value) => {
    if (value === void 0 || value === null || value === "") return void 0;
    if (typeof value === "number")
      return Number.isFinite(value) ? value : void 0;
    const text2 = String(value).trim();
    if (!text2) return void 0;
    return /^[+-]?\d+$/.test(text2) ? Number(text2) : CODE_DEBUG;
  };
  var pad = (value) => String(value).padStart(2, "0");
  var timestamp = (now) => [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds())
  ].join("");
  var newSessionId = (now) => `${timestamp(now)}-${Math.round(Math.random() * 1e5)}-${now.getTime()}`;
  var notThere = (programPath) => `The Program at (${programPath}) does not exist.`;
  var failedRun = (error) => {
    const message = "Job execution failed.";
    throw new ApiError(400, message, {
      status: "failure",
      message,
      error: String(error)
    });
  };
  var createRuntimeService = (directory, runner, options = {}) => {
    const runTimes = options.runTimes || DOCUMENTED_RUN_TIMES;
    const callerOf = async (caller) => {
      if (!caller) throw new ApiError(401, "Unauthorized");
      const reader = await directory.userById(caller.userId);
      if (!reader || !reader.isActive) throw new ApiError(401, "Unauthorized");
      return reader;
    };
    const programOf2 = (request) => {
      if (request.source === "code") {
        if (request.code === void 0)
          throw new ApiError(400, '"code" is required');
        if (typeof request.code !== "string")
          throw new ApiError(400, '"code" must be a string');
        if (request.code === "")
          throw new ApiError(400, '"code" is not allowed to be empty');
        return { code: request.code };
      }
      if (request.program === void 0)
        throw new ApiError(400, '"_program" is required');
      if (typeof request.program !== "string")
        throw new ApiError(400, '"_program" must be a string');
      if (request.program === "")
        throw new ApiError(400, '"_program" is not allowed to be empty');
      const resolved = normaliseDrivePath(request.program);
      if (resolved === null) return failedRun(notThere(request.program));
      return { path: resolved };
    };
    const runTimeForPath = (path, request) => {
      const file = path.split("/").pop() || "";
      const dot = file.lastIndexOf(".");
      const extension = dot > 0 ? file.slice(dot + 1).toLowerCase() : "";
      if (DOCUMENTED_RUN_TIMES.includes(extension)) return extension;
      return runTimeOf(request);
    };
    const runTimeOf = (request) => {
      if (request.runTime === void 0) {
        if (request.source === "code")
          throw new ApiError(400, '"runTime" is required');
        return void 0;
      }
      if (typeof request.runTime !== "string")
        throw new ApiError(400, '"runTime" must be a string');
      if (!runTimes.includes(request.runTime))
        throw new ApiError(
          400,
          `"runTime" must be one of [${runTimes.join(", ")}]`
        );
      return request.runTime;
    };
    const expiryOf = (request) => {
      const value = request.expiresAfterMins;
      if (value === void 0) return void 0;
      const minutes = typeof value === "number" ? value : typeof value === "string" && /^\s*[+-]?\d+(\.\d+)?\s*$/.test(value) ? Number(value) : NaN;
      if (Number.isNaN(minutes))
        throw new ApiError(400, '"expiresAfterMins" must be a number');
      if (minutes <= 0)
        throw new ApiError(400, '"expiresAfterMins" must be greater than 0');
      return minutes;
    };
    const prepare = async (caller, request) => {
      const reader = await callerOf(caller);
      const program = programOf2(request);
      const vars = { ...request.vars || {} };
      const debug = "code" in program ? CODE_DEBUG : parseDebugValue(vars._debug);
      if (debug === void 0) delete vars._debug;
      else vars._debug = debug;
      return {
        reader,
        program,
        vars,
        // a code route's run time is the one it named; a stored program's is the
        // one its extension names, when it names one at all
        runTime: "code" in program ? runTimeOf(request) : runTimeForPath(program.path, request)
      };
    };
    return {
      async execute(caller, request) {
        const prepared = await prepare(caller, request);
        let outcome;
        try {
          outcome = await runner.run({
            program: prepared.program,
            vars: prepared.vars,
            runTime: prepared.runTime,
            files: request.files
          });
        } catch (error) {
          return failedRun(error);
        }
        return outcome.output || { contents: "" };
      },
      async trigger(caller, request) {
        const prepared = await prepare(caller, request);
        const expiresAfterMins = expiryOf(request);
        const session = {
          sessionId: newSessionId(/* @__PURE__ */ new Date()),
          owner: prepared.reader.uid,
          ...prepared.runTime === void 0 ? {} : { runTime: prepared.runTime },
          ...expiresAfterMins === void 0 ? {} : { expiresAfterMins }
        };
        let outcome;
        try {
          outcome = await runner.run({
            program: prepared.program,
            vars: prepared.vars,
            runTime: prepared.runTime,
            session,
            files: request.files
          });
        } catch (error) {
          return failedRun(error);
        }
        return outcome.pid === void 0 ? { sessionId: session.sessionId } : { sessionId: session.sessionId, pid: outcome.pid };
      }
    };
  };

  // src/runtime/memory-runner.ts
  var MemorySessionRunner = class extends MemorySessionHost {
    constructor(options = {}) {
      super();
      this.options = options;
    }
    async run(request) {
      if (this.options.fail) throw new Error("the mock run failed");
      const key = "code" in request.program ? request.program.code : request.program.path;
      const output = this.options.outputs?.[key] || { contents: "" };
      const pid = this.options.pid;
      if (request.session) {
        const { sessionId, owner, expiresAfterMins } = request.session;
        const started = (/* @__PURE__ */ new Date()).toISOString();
        const summary = {
          sessionId,
          // the work is finished by the time this returns: a memory runner has
          // nothing to wait for, and the session routes report what it did
          state: "completed",
          creationTimeStamp: started,
          deathTimeStamp: started
        };
        if (pid !== void 0) summary.pid = pid;
        if (expiresAfterMins !== void 0)
          summary.expiresAfterMins = { mins: expiresAfterMins, used: false };
        this.sessions[sessionId] = { owner, summary };
        this.states[sessionId] = { state: "completed" };
        this.logs[sessionId] = "";
        this.outputs[sessionId] = output;
      }
      return pid === void 0 ? { output } : { output, pid };
    }
  };

  // src/corpus/runtime.ts
  var ADMIN2 = { userId: "user-admin", clientId: "web_app" };
  var PROGRAM = "/Public/apps/demo/run.sas";
  var CODE = 'data _null_;\n  put "hello";\nrun;';
  var UNAUTHORIZED2 = "Unauthorized";
  var FAILED = "Job execution failed.";
  var bytes2 = (...values) => Uint8Array.from(values);
  var RUNTIME_CORPUS = [
    // ------------------------------------------------- GET /stp/execute
    {
      id: "stp-execute-get-answers-output",
      route: "GET /SASjsApi/stp/execute",
      description: "answers the output the program produced",
      request: { subject: ADMIN2, query: { _program: PROGRAM } },
      runOutput: { contents: "hello from the program" },
      expect: { status: 200, contents: "hello from the program" }
    },
    {
      id: "stp-execute-get-answers-bytes",
      route: "GET /SASjsApi/stp/execute",
      description: "answers an output that is bytes as bytes",
      request: { subject: ADMIN2, query: { _program: PROGRAM } },
      runOutput: { contents: bytes2(1, 2, 3) },
      expect: { status: 200, contents: bytes2(1, 2, 3) }
    },
    {
      id: "stp-execute-get-missing-program",
      route: "GET /SASjsApi/stp/execute",
      description: "refuses a request that names no program",
      request: { subject: ADMIN2, query: {} },
      expect: { status: 400, error: '"_program" is required' }
    },
    {
      id: "stp-execute-get-failed-run",
      route: "GET /SASjsApi/stp/execute",
      description: "answers 400 when the program could not be run",
      request: { subject: ADMIN2, query: { _program: PROGRAM } },
      failingRun: true,
      expect: { status: 400, error: FAILED }
    },
    {
      id: "stp-execute-get-unauthenticated",
      route: "GET /SASjsApi/stp/execute",
      description: "refuses a caller with no token",
      request: { query: { _program: PROGRAM } },
      expect: { status: 401, error: UNAUTHORIZED2 }
    },
    // ------------------------------------------------ POST /stp/execute
    {
      id: "stp-execute-post-body-program",
      route: "POST /SASjsApi/stp/execute",
      description: "runs the program the body names",
      request: { subject: ADMIN2, body: { _program: PROGRAM } },
      runOutput: { contents: "hello from the body" },
      expect: { status: 200, contents: "hello from the body" }
    },
    {
      id: "stp-execute-post-query-program",
      route: "POST /SASjsApi/stp/execute",
      description: "runs the program the query names, with no body",
      request: { subject: ADMIN2, query: { _program: PROGRAM }, body: {} },
      runOutput: { contents: "hello from the query" },
      expect: { status: 200, contents: "hello from the query" }
    },
    {
      id: "stp-execute-post-no-program",
      route: "POST /SASjsApi/stp/execute",
      description: "refuses a request with no program in the query or the body",
      request: { subject: ADMIN2, body: {} },
      expect: { status: 400, error: '"_program" is required' }
    },
    {
      id: "stp-execute-post-failed-run",
      route: "POST /SASjsApi/stp/execute",
      description: "answers 400 when the program could not be run",
      request: { subject: ADMIN2, body: { _program: PROGRAM } },
      failingRun: true,
      expect: { status: 400, error: FAILED }
    },
    {
      id: "stp-execute-post-unauthenticated",
      route: "POST /SASjsApi/stp/execute",
      description: "refuses a caller with no token, before it reads the payload",
      request: { body: {} },
      expect: { status: 401, error: UNAUTHORIZED2 }
    },
    // ------------------------------------------------ POST /stp/trigger
    {
      id: "stp-trigger-answers-session",
      route: "POST /SASjsApi/stp/trigger",
      description: "answers the session a caller polls, and no pid from a mock",
      request: { subject: ADMIN2, query: { _program: PROGRAM } },
      expect: { status: 200, keys: ["sessionId"] }
    },
    {
      id: "stp-trigger-retention",
      route: "POST /SASjsApi/stp/trigger",
      description: "accepts a retention in minutes, as the query carries it",
      request: {
        subject: ADMIN2,
        query: { _program: PROGRAM, expiresAfterMins: "15" }
      },
      expect: { status: 200, keys: ["sessionId"] }
    },
    {
      id: "stp-trigger-retention-not-positive",
      route: "POST /SASjsApi/stp/trigger",
      description: "refuses a retention that is not a positive number of minutes",
      request: {
        subject: ADMIN2,
        query: { _program: PROGRAM, expiresAfterMins: "0" }
      },
      expect: { status: 400, error: '"expiresAfterMins" must be greater than 0' }
    },
    {
      id: "stp-trigger-missing-program",
      route: "POST /SASjsApi/stp/trigger",
      description: "refuses a request that names no program",
      request: { subject: ADMIN2, query: {} },
      expect: { status: 400, error: '"_program" is required' }
    },
    {
      id: "stp-trigger-failed-run",
      route: "POST /SASjsApi/stp/trigger",
      description: "answers 400 when the program could not be started",
      request: { subject: ADMIN2, query: { _program: PROGRAM } },
      failingRun: true,
      expect: { status: 400, error: FAILED }
    },
    {
      id: "stp-trigger-unauthenticated",
      route: "POST /SASjsApi/stp/trigger",
      description: "refuses a caller with no token",
      request: { query: { _program: PROGRAM } },
      expect: { status: 401, error: UNAUTHORIZED2 }
    },
    // ----------------------------------------------- POST /code/execute
    {
      id: "code-execute-answers-output",
      route: "POST /SASjsApi/code/execute",
      description: "runs the code in the body and answers its output",
      request: { subject: ADMIN2, body: { code: CODE, runTime: "sas" } },
      runOutput: { contents: "NOTE: mock run" },
      expect: { status: 200, contents: "NOTE: mock run" }
    },
    {
      // The refusal's *message* is not pinned here: it names the run times the
      // host holds, which is deployment data - `r` is a valid request where R is
      // configured and a 400 where it is not - so a corpus that stated a list
      // would be asserting one host's install. `spec/runtime.spec.ts` pins the
      // wording against an explicit list; this states the status every host sends
      // for a name no host holds.
      id: "code-execute-unknown-runtime",
      route: "POST /SASjsApi/code/execute",
      description: "refuses a run time the document does not name",
      request: { subject: ADMIN2, body: { code: CODE, runTime: "cobol" } },
      expect: { status: 400 }
    },
    {
      id: "code-execute-missing-code",
      route: "POST /SASjsApi/code/execute",
      description: "refuses a payload with no code",
      request: { subject: ADMIN2, body: { runTime: "sas" } },
      expect: { status: 400, error: '"code" is required' }
    },
    {
      id: "code-execute-empty-code",
      route: "POST /SASjsApi/code/execute",
      description: "refuses code that is present but empty",
      request: { subject: ADMIN2, body: { code: "", runTime: "sas" } },
      expect: { status: 400, error: '"code" is not allowed to be empty' }
    },
    {
      id: "code-execute-non-string-code",
      route: "POST /SASjsApi/code/execute",
      description: "refuses code that is not a string rather than running its text",
      request: { subject: ADMIN2, body: { code: 123, runTime: "sas" } },
      expect: { status: 400, error: '"code" must be a string' }
    },
    {
      id: "code-execute-failed-run",
      route: "POST /SASjsApi/code/execute",
      description: "answers 400 when the code could not be run",
      request: { subject: ADMIN2, body: { code: CODE, runTime: "sas" } },
      failingRun: true,
      expect: { status: 400, error: FAILED }
    },
    {
      id: "code-execute-unauthenticated",
      route: "POST /SASjsApi/code/execute",
      description: "refuses a caller with no token, before it reads the payload",
      request: { body: {} },
      expect: { status: 401, error: UNAUTHORIZED2 }
    },
    // ----------------------------------------------- POST /code/trigger
    {
      id: "code-trigger-answers-session",
      route: "POST /SASjsApi/code/trigger",
      description: "answers the session a caller polls, and no pid from a mock",
      request: { subject: ADMIN2, body: { code: CODE, runTime: "sas" } },
      expect: { status: 200, keys: ["sessionId"] }
    },
    {
      id: "code-trigger-missing-runtime",
      route: "POST /SASjsApi/code/trigger",
      description: "refuses a payload with no run time, which the document requires",
      request: { subject: ADMIN2, body: { code: CODE } },
      expect: { status: 400, error: '"runTime" is required' }
    },
    {
      id: "code-trigger-retention-not-positive",
      route: "POST /SASjsApi/code/trigger",
      description: "refuses a retention that is not a positive number of minutes",
      request: {
        subject: ADMIN2,
        body: { code: CODE, runTime: "sas", expiresAfterMins: 0 }
      },
      expect: { status: 400, error: '"expiresAfterMins" must be greater than 0' }
    },
    {
      id: "code-trigger-failed-run",
      route: "POST /SASjsApi/code/trigger",
      description: "answers 400 when the code could not be started",
      request: { subject: ADMIN2, body: { code: CODE, runTime: "sas" } },
      failingRun: true,
      expect: { status: 400, error: FAILED }
    },
    {
      id: "code-trigger-unauthenticated",
      route: "POST /SASjsApi/code/trigger",
      description: "refuses a caller with no token",
      request: { body: { code: CODE, runTime: "sas" } },
      expect: { status: 401, error: UNAUTHORIZED2 }
    }
  ];

  // src/corpus/records.ts
  var SIGNED_IN_TOKENS = [
    {
      username: "sasjsadmin",
      clientId: "web_app",
      accessToken: "admin-access",
      refreshToken: "admin-refresh"
    },
    {
      username: "sasjsuser",
      clientId: "web_app",
      accessToken: "user-access",
      refreshToken: "user-refresh"
    }
  ];
  var ADMIN_SIGNED_IN = {
    ...DEFAULT_IDENTITY,
    tokens: SIGNED_IN_TOKENS
  };
  var PROVIDER_MANAGED = {
    ...ADMIN_SIGNED_IN,
    tokens: [
      ...SIGNED_IN_TOKENS,
      {
        username: "diruser",
        clientId: "web_app",
        accessToken: "dir-access",
        refreshToken: "dir-refresh"
      }
    ],
    users: [
      ...ADMIN_SIGNED_IN.users,
      {
        uid: "user-directory",
        username: "diruser",
        displayName: "Directory User",
        password: "dir123",
        isAdmin: false,
        isActive: true,
        needsToUpdatePassword: false,
        authProvider: "oidc"
      }
    ],
    groups: [
      ...ADMIN_SIGNED_IN.groups,
      {
        uid: "group-directory",
        name: "Directory",
        description: "Managed by the directory",
        isActive: true,
        users: [],
        authProvider: "oidc"
      },
      {
        uid: "group-public",
        name: "public",
        description: "Everyone",
        isActive: true,
        users: []
      }
    ]
  };
  var ADMIN3 = "admin-access";
  var RESTRICTED2 = "user-access";
  var RESTRICTED_UID = "user-restricted";
  var ADMIN_UID = "user-admin";
  var RECORD_CORPUS = [
    // ------------------------------------------------------------------ users
    {
      id: "list-users",
      route: "GET /SASjsApi/user",
      description: "lists the accounts any signed-in caller may see",
      identity: ADMIN_SIGNED_IN,
      request: { token: ADMIN3 },
      expect: {
        status: 200,
        body: [
          {
            uid: ADMIN_UID,
            username: "sasjsadmin",
            displayName: "Demo Admin",
            isAdmin: true
          },
          {
            uid: RESTRICTED_UID,
            username: "sasjsuser",
            displayName: "Demo User",
            isAdmin: false
          }
        ]
      }
    },
    {
      id: "get-user-self",
      route: "GET /SASjsApi/user/{uid}",
      description: "returns the caller their own details, with the auto-exec code",
      identity: ADMIN_SIGNED_IN,
      request: { token: RESTRICTED2, params: { uid: RESTRICTED_UID } },
      expect: {
        status: 200,
        partial: {
          uid: RESTRICTED_UID,
          username: "sasjsuser",
          isActive: true,
          isAdmin: false,
          autoExec: ""
        }
      }
    },
    {
      id: "get-user-unauthenticated",
      route: "GET /SASjsApi/user/{uid}",
      description: "refuses a read with no caller at all",
      identity: ADMIN_SIGNED_IN,
      request: { params: { uid: RESTRICTED_UID } },
      expect: { status: 401, error: "Unauthorized" }
    },
    {
      id: "get-user-missing",
      route: "GET /SASjsApi/user/{uid}",
      description: "answers 404 for an identifier no account has",
      identity: ADMIN_SIGNED_IN,
      request: { token: ADMIN3, params: { uid: "user-none" } },
      expect: { status: 404, error: "User is not found." }
    },
    {
      id: "get-user-by-username",
      route: "GET /SASjsApi/user/by/username/{username}",
      description: "finds an account by username",
      identity: ADMIN_SIGNED_IN,
      request: { token: ADMIN3, params: { username: "sasjsuser" } },
      expect: {
        status: 200,
        partial: { uid: RESTRICTED_UID, username: "sasjsuser", isAdmin: false }
      }
    },
    {
      id: "get-user-by-username-unauthenticated",
      route: "GET /SASjsApi/user/by/username/{username}",
      description: "refuses the by-username read with no caller",
      identity: ADMIN_SIGNED_IN,
      request: { params: { username: "sasjsuser" } },
      expect: { status: 401, error: "Unauthorized" }
    },
    {
      id: "get-user-by-username-missing",
      route: "GET /SASjsApi/user/by/username/{username}",
      description: "answers 404 for a username no account has",
      identity: ADMIN_SIGNED_IN,
      request: { token: ADMIN3, params: { username: "nobody" } },
      expect: { status: 404, error: "User is not found." }
    },
    {
      id: "create-user",
      route: "POST /SASjsApi/user",
      description: "creates an account, sanitised, and reports it",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN3,
        body: {
          username: "newuser",
          displayName: "  New User  ",
          password: "newpass",
          isAdmin: false,
          isActive: true
        }
      },
      expect: {
        status: 200,
        partial: {
          username: "newuser",
          displayName: "New User",
          isAdmin: false,
          isActive: true
        }
      }
    },
    {
      id: "create-user-not-admin",
      route: "POST /SASjsApi/user",
      description: "refuses a creation by a caller who is not an administrator",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: RESTRICTED2,
        body: {
          username: "newuser",
          displayName: "New User",
          password: "newpass"
        }
      },
      expect: { status: 401, error: "Admin account required" }
    },
    {
      id: "create-user-anonymous-incomplete",
      route: "POST /SASjsApi/user",
      description: "answers 401 before the payload schema, anonymously and empty",
      identity: ADMIN_SIGNED_IN,
      request: { body: {} },
      expect: { status: 401, error: "Unauthorized" }
    },
    {
      id: "create-user-duplicate",
      route: "POST /SASjsApi/user",
      description: "refuses a username that is taken",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN3,
        body: {
          username: "sasjsuser",
          displayName: "Another",
          password: "newpass"
        }
      },
      expect: { status: 409, error: "Username already exists." }
    },
    {
      id: "update-user",
      route: "PATCH /SASjsApi/user/{uid}",
      description: "changes an account's display name",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN3,
        params: { uid: RESTRICTED_UID },
        body: {
          displayName: "Renamed User",
          username: "sasjsuser",
          password: "Orion123"
        }
      },
      expect: {
        status: 200,
        partial: { uid: RESTRICTED_UID, displayName: "Renamed User" }
      }
    },
    {
      id: "update-user-not-admin",
      route: "PATCH /SASjsApi/user/{uid}",
      description: "refuses a change to somebody else's account",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: RESTRICTED2,
        params: { uid: ADMIN_UID },
        body: {
          displayName: "Hijacked",
          username: "sasjsadmin",
          password: "Orion123"
        }
      },
      expect: { status: 401, error: "Admin account required" }
    },
    {
      id: "update-user-missing",
      route: "PATCH /SASjsApi/user/{uid}",
      description: "answers 404 with the identifier it looked up",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN3,
        params: { uid: "user-none" },
        body: { displayName: "Nobody", username: "nobody", password: "none123" }
      },
      expect: { status: 404, error: "Unable to find user with user-none" }
    },
    {
      id: "update-user-provider",
      route: "PATCH /SASjsApi/user/{uid}",
      description: "refuses a username change on a provider-managed account",
      identity: PROVIDER_MANAGED,
      request: {
        token: ADMIN3,
        params: { uid: "user-directory" },
        body: {
          username: "renamed",
          displayName: "Directory User",
          password: "dir123"
        }
      },
      expect: {
        status: 405,
        error: "Can not update username of user that is created by an external auth provider."
      }
    },
    {
      id: "update-user-username-taken",
      route: "PATCH /SASjsApi/user/{uid}",
      description: "refuses a username another account already has",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN3,
        params: { uid: RESTRICTED_UID },
        body: {
          username: "sasjsadmin",
          displayName: "Demo User",
          password: "Orion123"
        }
      },
      expect: { status: 409, error: "Username already exists." }
    },
    {
      id: "update-user-by-username",
      route: "PATCH /SASjsApi/user/by/username/{username}",
      description: "changes an account looked up by username",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN3,
        params: { username: "sasjsuser" },
        body: {
          isActive: false,
          username: "sasjsuser",
          displayName: "Demo User",
          password: "Orion123"
        }
      },
      expect: { status: 200, partial: { username: "sasjsuser", isActive: false } }
    },
    {
      id: "update-user-by-username-not-admin",
      route: "PATCH /SASjsApi/user/by/username/{username}",
      description: "refuses a change to another account by username",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: RESTRICTED2,
        params: { username: "sasjsadmin" },
        body: {
          displayName: "Hijacked",
          username: "sasjsadmin",
          password: "Orion123"
        }
      },
      expect: { status: 401, error: "Admin account required" }
    },
    {
      id: "update-user-by-username-missing",
      route: "PATCH /SASjsApi/user/by/username/{username}",
      description: "answers 404 with the username it looked up",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN3,
        params: { username: "nobody" },
        body: { displayName: "Nobody", username: "nobody", password: "none123" }
      },
      expect: { status: 404, error: "Unable to find user with nobody" }
    },
    {
      id: "update-user-by-username-provider",
      route: "PATCH /SASjsApi/user/by/username/{username}",
      description: "refuses a display-name change on a provider-managed account",
      identity: PROVIDER_MANAGED,
      request: {
        token: ADMIN3,
        params: { username: "diruser" },
        body: { displayName: "Renamed", username: "diruser", password: "dir123" }
      },
      expect: {
        status: 405,
        error: "Can not update display name of user that is created by an external auth provider."
      }
    },
    {
      id: "update-user-by-username-taken",
      route: "PATCH /SASjsApi/user/by/username/{username}",
      description: "refuses a username another account already has",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN3,
        params: { username: "sasjsuser" },
        body: {
          username: "sasjsadmin",
          displayName: "Demo User",
          password: "Orion123"
        }
      },
      expect: { status: 409, error: "Username already exists." }
    },
    {
      id: "delete-user",
      route: "DELETE /SASjsApi/user/{uid}",
      description: "deletes an account as an administrator, without a password",
      identity: ADMIN_SIGNED_IN,
      request: { token: ADMIN3, params: { uid: RESTRICTED_UID }, body: {} },
      expect: { status: 200, body: "Account Deleted!" }
    },
    {
      id: "delete-user-not-admin",
      route: "DELETE /SASjsApi/user/{uid}",
      description: "refuses a deletion of somebody else's account",
      identity: ADMIN_SIGNED_IN,
      request: { token: RESTRICTED2, params: { uid: ADMIN_UID }, body: {} },
      expect: { status: 401, error: "Admin account required" }
    },
    {
      id: "delete-user-missing",
      route: "DELETE /SASjsApi/user/{uid}",
      description: "answers 404 for an identifier no account has",
      identity: ADMIN_SIGNED_IN,
      request: { token: ADMIN3, params: { uid: "user-none" }, body: {} },
      expect: { status: 404, error: "User is not found." }
    },
    {
      id: "delete-user-by-username",
      route: "DELETE /SASjsApi/user/by/username/{username}",
      description: "deletes an account looked up by username",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN3,
        params: { username: "sasjsuser" },
        body: {}
      },
      expect: { status: 200, body: "Account Deleted!" }
    },
    {
      id: "delete-user-by-username-wrong-password",
      route: "DELETE /SASjsApi/user/by/username/{username}",
      description: "refuses a self-deletion whose password is wrong",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: RESTRICTED2,
        params: { username: "sasjsuser" },
        body: { password: "wrong123" }
      },
      expect: { status: 401, error: "Invalid password." }
    },
    {
      id: "delete-user-by-username-missing",
      route: "DELETE /SASjsApi/user/by/username/{username}",
      description: "answers 404 for a username no account has",
      identity: ADMIN_SIGNED_IN,
      request: { token: ADMIN3, params: { username: "nobody" }, body: {} },
      expect: { status: 404, error: "User is not found." }
    },
    // ----------------------------------------------------------------- groups
    {
      id: "list-groups",
      route: "GET /SASjsApi/group",
      description: "lists the groups",
      identity: ADMIN_SIGNED_IN,
      request: { token: RESTRICTED2 },
      expect: {
        status: 200,
        body: [
          {
            uid: "group-data-controller",
            name: "DCGroup",
            description: "Data Controller users"
          },
          {
            uid: "group-admins",
            name: "Admins",
            description: "Everything the API offers"
          }
        ]
      }
    },
    {
      id: "get-group",
      route: "GET /SASjsApi/group/{uid}",
      description: "returns a group and its members",
      identity: ADMIN_SIGNED_IN,
      request: { token: RESTRICTED2, params: { uid: "group-admins" } },
      expect: {
        status: 200,
        partial: {
          uid: "group-admins",
          name: "Admins",
          isActive: true,
          users: [
            {
              uid: ADMIN_UID,
              username: "sasjsadmin",
              displayName: "Demo Admin",
              isAdmin: true
            }
          ]
        }
      }
    },
    {
      id: "get-group-missing",
      route: "GET /SASjsApi/group/{uid}",
      description: "answers 404 for an identifier no group has",
      identity: ADMIN_SIGNED_IN,
      request: { token: ADMIN3, params: { uid: "group-none" } },
      expect: { status: 404, error: "Group not found." }
    },
    {
      id: "get-group-by-name",
      route: "GET /SASjsApi/group/by/groupname/{name}",
      description: "finds a group by name",
      identity: ADMIN_SIGNED_IN,
      request: { token: ADMIN3, params: { name: "DCGroup" } },
      expect: {
        status: 200,
        partial: { uid: "group-data-controller", name: "DCGroup" }
      }
    },
    {
      id: "get-group-by-name-missing",
      route: "GET /SASjsApi/group/by/groupname/{name}",
      description: "answers 404 for a name no group has",
      identity: ADMIN_SIGNED_IN,
      request: { token: ADMIN3, params: { name: "nope" } },
      expect: { status: 404, error: "Group not found." }
    },
    {
      id: "create-group",
      route: "POST /SASjsApi/group",
      description: "creates a group with no members",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN3,
        body: { name: "NewGroup", description: "A new group", isActive: true }
      },
      expect: {
        status: 200,
        partial: {
          name: "NewGroup",
          description: "A new group",
          isActive: true,
          users: []
        }
      }
    },
    {
      id: "create-group-not-admin",
      route: "POST /SASjsApi/group",
      description: "refuses a creation by a caller who is not an administrator",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: RESTRICTED2,
        body: { name: "NewGroup", description: "x" }
      },
      expect: { status: 401, error: "Admin account required" }
    },
    {
      id: "create-group-duplicate",
      route: "POST /SASjsApi/group",
      description: "refuses a name that is taken",
      identity: ADMIN_SIGNED_IN,
      request: { token: ADMIN3, body: { name: "DCGroup", description: "again" } },
      expect: { status: 409, error: "Group name already exists." }
    },
    {
      id: "add-user-to-group",
      route: "POST /SASjsApi/group/{groupUid}/{userUid}",
      description: "adds a member and returns the group",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN3,
        params: { groupUid: "group-admins", userUid: RESTRICTED_UID }
      },
      expect: {
        status: 200,
        partial: { uid: "group-admins", name: "Admins" }
      }
    },
    {
      id: "add-user-to-public-group",
      route: "POST /SASjsApi/group/{groupUid}/{userUid}",
      description: "refuses a change to the reserved public group",
      identity: PROVIDER_MANAGED,
      request: {
        token: ADMIN3,
        params: { groupUid: "group-public", userUid: RESTRICTED_UID }
      },
      expect: { status: 400, error: "Can't add/remove user to 'public' group." }
    },
    {
      id: "add-user-to-group-not-admin",
      route: "POST /SASjsApi/group/{groupUid}/{userUid}",
      description: "refuses a membership change by a non-administrator",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: RESTRICTED2,
        params: { groupUid: "group-admins", userUid: RESTRICTED_UID }
      },
      expect: { status: 401, error: "Admin account required" }
    },
    {
      id: "add-user-to-group-missing-group",
      route: "POST /SASjsApi/group/{groupUid}/{userUid}",
      description: "answers 404 for a group that does not exist",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN3,
        params: { groupUid: "group-none", userUid: RESTRICTED_UID }
      },
      expect: { status: 404, error: "Group not found." }
    },
    {
      id: "add-user-to-group-provider",
      route: "POST /SASjsApi/group/{groupUid}/{userUid}",
      description: "refuses a membership change on a provider-managed group",
      identity: PROVIDER_MANAGED,
      request: {
        token: ADMIN3,
        params: { groupUid: "group-directory", userUid: RESTRICTED_UID }
      },
      expect: {
        status: 405,
        error: "Can't add/remove user to group created by external auth provider."
      }
    },
    {
      id: "remove-user-from-group",
      route: "DELETE /SASjsApi/group/{groupUid}/{userUid}",
      description: "removes a member and returns the group",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN3,
        params: { groupUid: "group-data-controller", userUid: RESTRICTED_UID }
      },
      expect: {
        status: 200,
        partial: { uid: "group-data-controller", name: "DCGroup", users: [] }
      }
    },
    {
      id: "add-provider-user-to-group",
      route: "POST /SASjsApi/group/{groupUid}/{userUid}",
      description: "refuses a membership change for a provider-managed user",
      identity: PROVIDER_MANAGED,
      request: {
        token: ADMIN3,
        params: { groupUid: "group-admins", userUid: "user-directory" }
      },
      expect: {
        status: 405,
        error: "Can't add/remove user to group created by external auth provider."
      }
    },
    {
      id: "remove-provider-user-from-group",
      route: "DELETE /SASjsApi/group/{groupUid}/{userUid}",
      description: "refuses a membership change for a provider-managed user",
      identity: PROVIDER_MANAGED,
      request: {
        token: ADMIN3,
        params: { groupUid: "group-admins", userUid: "user-directory" }
      },
      expect: {
        status: 405,
        error: "Can't add/remove user to group created by external auth provider."
      }
    },
    {
      id: "remove-user-from-public-group",
      route: "DELETE /SASjsApi/group/{groupUid}/{userUid}",
      description: "refuses a change to the reserved public group",
      identity: PROVIDER_MANAGED,
      request: {
        token: ADMIN3,
        params: { groupUid: "group-public", userUid: RESTRICTED_UID }
      },
      expect: { status: 400, error: "Can't add/remove user to 'public' group." }
    },
    {
      id: "remove-user-from-group-not-admin",
      route: "DELETE /SASjsApi/group/{groupUid}/{userUid}",
      description: "refuses a membership change by a non-administrator",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: RESTRICTED2,
        params: { groupUid: "group-data-controller", userUid: RESTRICTED_UID }
      },
      expect: { status: 401, error: "Admin account required" }
    },
    {
      id: "remove-user-from-group-missing-user",
      route: "DELETE /SASjsApi/group/{groupUid}/{userUid}",
      description: "answers 404 for a member that does not exist",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN3,
        params: { groupUid: "group-admins", userUid: "user-none" }
      },
      expect: { status: 404, error: "User not found." }
    },
    {
      id: "remove-user-from-group-provider",
      route: "DELETE /SASjsApi/group/{groupUid}/{userUid}",
      description: "refuses a membership change on a provider-managed group",
      identity: PROVIDER_MANAGED,
      request: {
        token: ADMIN3,
        params: { groupUid: "group-directory", userUid: RESTRICTED_UID }
      },
      expect: {
        status: 405,
        error: "Can't add/remove user to group created by external auth provider."
      }
    },
    {
      id: "delete-group",
      route: "DELETE /SASjsApi/group/{uid}",
      description: "deletes a group",
      identity: ADMIN_SIGNED_IN,
      request: { token: ADMIN3, params: { uid: "group-data-controller" } },
      expect: { status: 200 }
    },
    {
      id: "delete-group-not-admin",
      route: "DELETE /SASjsApi/group/{uid}",
      description: "refuses a deletion by a caller who is not an administrator",
      identity: ADMIN_SIGNED_IN,
      request: { token: RESTRICTED2, params: { uid: "group-admins" } },
      expect: { status: 401, error: "Admin account required" }
    },
    {
      id: "delete-group-missing",
      route: "DELETE /SASjsApi/group/{uid}",
      description: "answers 404 for an identifier no group has",
      identity: ADMIN_SIGNED_IN,
      request: { token: ADMIN3, params: { uid: "group-none" } },
      expect: { status: 404, error: "Group not found." }
    },
    // ------------------------------------------------------------ permissions
    {
      id: "authorized-routes-as-admin",
      route: "GET /SASjsApi/info/authorizedRoutes",
      description: "answers the route inventory to an administrator",
      identity: ADMIN_SIGNED_IN,
      request: { token: ADMIN3 },
      expect: {
        status: 200,
        body: {
          paths: [
            "/AppStream",
            "/SASjsApi",
            "/SASjsApi/code/execute",
            "/SASjsApi/stp/execute",
            "/SASjsApi/drive/deploy",
            "/SASjsApi/drive/deploy/upload",
            "/SASjsApi/drive/file",
            "/SASjsApi/drive/folder",
            "/SASjsApi/drive/fileTree",
            "/SASjsApi/drive/rename"
          ]
        }
      }
    },
    {
      id: "authorized-routes-as-user",
      route: "GET /SASjsApi/info/authorizedRoutes",
      description: "refuses the inventory to a caller who is not an administrator",
      identity: ADMIN_SIGNED_IN,
      request: { token: RESTRICTED2 },
      expect: { status: 401, error: "Admin account required" }
    },
    {
      id: "my-authorized-routes-as-admin",
      route: "GET /SASjsApi/info/myAuthorizedRoutes",
      description: "answers every route to an administrator",
      identity: ADMIN_SIGNED_IN,
      request: { token: ADMIN3 },
      expect: {
        status: 200,
        body: {
          paths: [
            "/AppStream",
            "/SASjsApi",
            "/SASjsApi/code/execute",
            "/SASjsApi/stp/execute",
            "/SASjsApi/drive/deploy",
            "/SASjsApi/drive/deploy/upload",
            "/SASjsApi/drive/file",
            "/SASjsApi/drive/folder",
            "/SASjsApi/drive/fileTree",
            "/SASjsApi/drive/rename"
          ]
        }
      }
    },
    {
      id: "my-authorized-routes-as-user",
      route: "GET /SASjsApi/info/myAuthorizedRoutes",
      description: "answers a caller only the routes its rules grant",
      identity: ADMIN_SIGNED_IN,
      request: { token: RESTRICTED2 },
      expect: {
        status: 200,
        // /AppStream is visible whatever the rules say; the two grants come from
        // DCGroup; /SASjsApi/code/execute is denied to this user by a user rule,
        // and nothing grants the rest
        body: {
          paths: ["/AppStream", "/SASjsApi/stp/execute", "/SASjsApi/drive/file"]
        }
      }
    },
    {
      id: "list-permissions-as-admin",
      route: "GET /SASjsApi/permission",
      description: "returns every rule to an administrator",
      identity: ADMIN_SIGNED_IN,
      request: { token: ADMIN3 },
      expect: {
        status: 200,
        body: [
          {
            uid: "rule-routes",
            path: "/SASjsApi/drive/file",
            type: "Route",
            setting: "Grant",
            group: "group-data-controller"
          },
          {
            uid: "rule-execute",
            path: "/SASjsApi/stp/execute",
            type: "Route",
            setting: "Grant",
            group: "group-data-controller"
          },
          {
            uid: "rule-code",
            path: "/SASjsApi/code/execute",
            type: "Route",
            setting: "Deny",
            user: RESTRICTED_UID
          }
        ]
      }
    },
    {
      id: "list-permissions-as-user",
      route: "GET /SASjsApi/permission",
      description: "returns a caller only their own rules and their groups'",
      identity: ADMIN_SIGNED_IN,
      request: { token: RESTRICTED2 },
      expect: {
        status: 200,
        body: [
          {
            uid: "rule-routes",
            path: "/SASjsApi/drive/file",
            type: "Route",
            setting: "Grant",
            group: "group-data-controller"
          },
          {
            uid: "rule-execute",
            path: "/SASjsApi/stp/execute",
            type: "Route",
            setting: "Grant",
            group: "group-data-controller"
          },
          {
            uid: "rule-code",
            path: "/SASjsApi/code/execute",
            type: "Route",
            setting: "Deny",
            user: RESTRICTED_UID
          }
        ]
      }
    },
    {
      id: "list-permissions-unauthenticated",
      route: "GET /SASjsApi/permission",
      description: "refuses the list with no caller",
      identity: ADMIN_SIGNED_IN,
      request: {},
      expect: { status: 401, error: "Unauthorized" }
    },
    {
      id: "create-permission-user",
      route: "POST /SASjsApi/permission",
      description: "creates a rule for a user",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN3,
        body: {
          path: "/SASjsApi/drive/folder",
          type: "Route",
          setting: "Grant",
          principalType: "user",
          principalId: RESTRICTED_UID
        }
      },
      expect: {
        status: 200,
        partial: { path: "/SASjsApi/drive/folder", setting: "Grant" }
      }
    },
    {
      id: "create-permission-group",
      route: "POST /SASjsApi/permission",
      description: "creates a rule for a group",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN3,
        body: {
          path: "/SASjsApi/drive/rename",
          type: "Route",
          setting: "Grant",
          principalType: "group",
          principalId: "group-data-controller"
        }
      },
      expect: {
        status: 200,
        partial: {
          path: "/SASjsApi/drive/rename",
          setting: "Grant",
          group: "group-data-controller"
        }
      }
    },
    {
      id: "create-permission-invalid-principal-type",
      route: "POST /SASjsApi/permission",
      description: "refuses a principal type that is neither a user nor a group",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN3,
        body: {
          path: "/SASjsApi/drive/deploy",
          type: "Route",
          setting: "Grant",
          principalType: "role",
          principalId: "anything"
        }
      },
      expect: {
        status: 400,
        error: "Invalid principal type. Valid types are user or group."
      }
    },
    {
      id: "create-permission-admin-principal",
      route: "POST /SASjsApi/permission",
      description: "refuses a rule assigned to an administrator",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN3,
        body: {
          path: "/SASjsApi/drive/folder",
          type: "Route",
          setting: "Grant",
          principalType: "user",
          principalId: ADMIN_UID
        }
      },
      expect: {
        status: 400,
        error: "Can not add permission for admin user."
      }
    },
    {
      id: "create-permission-not-admin",
      route: "POST /SASjsApi/permission",
      description: "refuses a creation by a non-administrator",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: RESTRICTED2,
        body: {
          path: "/SASjsApi/drive/folder",
          type: "Route",
          setting: "Grant",
          principalType: "user",
          principalId: RESTRICTED_UID
        }
      },
      expect: { status: 401, error: "Admin account required" }
    },
    {
      id: "create-permission-missing-principal",
      route: "POST /SASjsApi/permission",
      description: "answers 404 for a principal that does not exist",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN3,
        body: {
          path: "/SASjsApi/drive/rename",
          type: "Route",
          setting: "Grant",
          principalType: "group",
          principalId: "group-none"
        }
      },
      expect: { status: 404, error: "Group not found." }
    },
    {
      id: "create-permission-duplicate-group",
      route: "POST /SASjsApi/permission",
      description: "refuses a group rule that already exists",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN3,
        body: {
          path: "/SASjsApi/drive/file",
          type: "Route",
          setting: "Grant",
          principalType: "group",
          principalId: "group-data-controller"
        }
      },
      expect: {
        status: 409,
        error: "Permission already exists with provided Path, Type and Group."
      }
    },
    {
      id: "create-permission-duplicate",
      route: "POST /SASjsApi/permission",
      description: "refuses a rule that already exists",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN3,
        body: {
          path: "/SASjsApi/code/execute",
          type: "Route",
          setting: "Deny",
          principalType: "user",
          principalId: RESTRICTED_UID
        }
      },
      expect: {
        status: 409,
        error: "Permission already exists with provided Path, Type and User."
      }
    },
    {
      id: "update-permission",
      route: "PATCH /SASjsApi/permission/{uid}",
      description: "flips a rule from Deny to Grant",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN3,
        params: { uid: "rule-code" },
        body: { setting: "Grant" }
      },
      expect: { status: 200, partial: { uid: "rule-code", setting: "Grant" } }
    },
    {
      id: "update-permission-not-admin",
      route: "PATCH /SASjsApi/permission/{uid}",
      description: "refuses a change by a non-administrator",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: RESTRICTED2,
        params: { uid: "rule-code" },
        body: { setting: "Grant" }
      },
      expect: { status: 401, error: "Admin account required" }
    },
    {
      id: "update-permission-missing",
      route: "PATCH /SASjsApi/permission/{uid}",
      description: "answers 404 for a rule that does not exist",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN3,
        params: { uid: "rule-none" },
        body: { setting: "Grant" }
      },
      expect: { status: 404, error: "Permission not found." }
    },
    {
      id: "delete-permission",
      route: "DELETE /SASjsApi/permission/{uid}",
      description: "deletes a rule",
      identity: ADMIN_SIGNED_IN,
      request: { token: ADMIN3, params: { uid: "rule-code" } },
      expect: { status: 200, body: "Permission Deleted!" }
    },
    {
      id: "delete-permission-not-admin",
      route: "DELETE /SASjsApi/permission/{uid}",
      description: "refuses a deletion by a non-administrator",
      identity: ADMIN_SIGNED_IN,
      request: { token: RESTRICTED2, params: { uid: "rule-code" } },
      expect: { status: 401, error: "Admin account required" }
    },
    {
      id: "delete-permission-missing",
      route: "DELETE /SASjsApi/permission/{uid}",
      description: "answers 404 for a rule that does not exist",
      identity: ADMIN_SIGNED_IN,
      request: { token: ADMIN3, params: { uid: "rule-none" } },
      expect: { status: 404, error: "Permission not found." }
    },
    // --------------------------------------------------------------- clients
    {
      id: "list-clients",
      route: "GET /SASjsApi/client",
      description: "lists the registered clients",
      identity: ADMIN_SIGNED_IN,
      request: { token: ADMIN3 },
      expect: {
        status: 200,
        body: [
          {
            clientId: "web_app",
            clientSecret: "web_app",
            accessTokenExpiration: 86400,
            refreshTokenExpiration: 2592e3
          },
          {
            clientId: "sasjs",
            clientSecret: "sasjs",
            accessTokenExpiration: 3600,
            refreshTokenExpiration: 86400
          }
        ]
      }
    },
    {
      id: "list-clients-not-admin",
      route: "GET /SASjsApi/client",
      description: "refuses the list to a caller who is not an administrator",
      identity: ADMIN_SIGNED_IN,
      request: { token: RESTRICTED2 },
      expect: { status: 401, error: "Admin account required" }
    },
    {
      id: "create-client",
      route: "POST /SASjsApi/client",
      description: "registers a client",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN3,
        body: {
          clientId: "new_app",
          clientSecret: "new_secret",
          accessTokenExpiration: 3600,
          refreshTokenExpiration: 86400
        }
      },
      expect: {
        status: 200,
        body: {
          clientId: "new_app",
          clientSecret: "new_secret",
          accessTokenExpiration: 3600,
          refreshTokenExpiration: 86400
        }
      }
    },
    {
      id: "create-client-defaults",
      route: "POST /SASjsApi/client",
      description: "applies the schema defaults when the lifetimes are omitted",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN3,
        body: { clientId: "default_app", clientSecret: "default_secret" }
      },
      expect: {
        status: 200,
        body: {
          clientId: "default_app",
          clientSecret: "default_secret",
          accessTokenExpiration: 86400,
          refreshTokenExpiration: 2592e3
        }
      }
    },
    {
      id: "create-client-not-admin",
      route: "POST /SASjsApi/client",
      description: "refuses a registration by a non-administrator",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: RESTRICTED2,
        body: {
          clientId: "new_app",
          clientSecret: "new_secret",
          accessTokenExpiration: 3600,
          refreshTokenExpiration: 86400
        }
      },
      expect: { status: 401, error: "Admin account required" }
    },
    {
      id: "create-client-duplicate",
      route: "POST /SASjsApi/client",
      description: "refuses a client id that is registered, with the 403 the server sends",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN3,
        body: {
          clientId: "web_app",
          clientSecret: "other",
          accessTokenExpiration: 3600,
          refreshTokenExpiration: 86400
        }
      },
      expect: { status: 403, error: "Error: Client ID already exists." }
    },
    // -------------------------------------------------------------- passwords
    {
      id: "update-password",
      route: "PATCH /SASjsApi/auth/updatePassword",
      description: "changes the caller’s own password",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: RESTRICTED2,
        body: { currentPassword: "Orion123", newPassword: "changed123" }
      },
      expect: { status: 204 }
    },
    {
      id: "update-password-missing-field",
      route: "PATCH /SASjsApi/auth/updatePassword",
      description: "refuses a body without the current password",
      identity: ADMIN_SIGNED_IN,
      request: { token: RESTRICTED2, body: { newPassword: "changed123" } },
      expect: { status: 400, error: '"currentPassword" is required' }
    },
    {
      id: "update-password-unauthenticated",
      route: "PATCH /SASjsApi/auth/updatePassword",
      description: "refuses the change with no caller",
      identity: ADMIN_SIGNED_IN,
      request: {
        body: { currentPassword: "Orion123", newPassword: "changed123" }
      },
      expect: { status: 401, error: "Unauthorized" }
    },
    {
      id: "update-password-wrong-current",
      route: "PATCH /SASjsApi/auth/updatePassword",
      description: "refuses a change whose current password is wrong",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: RESTRICTED2,
        body: { currentPassword: "wrong", newPassword: "changed123" }
      },
      expect: { status: 403, error: "Invalid current password!" }
    },
    {
      id: "update-password-provider",
      route: "PATCH /SASjsApi/auth/updatePassword",
      description: "refuses a password change on a provider-managed account",
      identity: PROVIDER_MANAGED,
      request: {
        token: "dir-access",
        body: { currentPassword: "dir123", newPassword: "changed123" }
      },
      expect: {
        status: 405,
        error: "Can not update password of user that is created by an external auth provider."
      }
    }
  ];

  // src/corpus/runner.ts
  var CORPUS_APP = {
    id: "6f1c1c1e-6a1e-4c4a-9d1a-1b2c3d4e5f60",
    name: "myApp",
    appLoc: "/Public/myApp",
    streamWebFolder: "web",
    publishedAt: "2026-01-01T00:00:00.000Z"
  };
  var servicesFor = (testCase) => {
    const identity = new MemoryIdentityStore(
      testCase.identity || DEFAULT_IDENTITY
    );
    const runner = new MemorySessionRunner({
      fail: testCase.failingRun,
      outputs: testCase.runOutput ? { [programOf(testCase)]: testCase.runOutput } : void 0
    });
    return {
      drive: createDriveService(
        testCase.unwritable ? new RefusingDriveStore(testCase.seed || {}) : new MemoryDriveStore(testCase.seed || {})
      ),
      info: createInfoService(BROWSER_INFO),
      home: createHomeService(async () => CORPUS_WEB_PAGE),
      authConfig: createAuthConfigService(CORPUS_AUTH_CONFIG),
      admin: createAdminService({
        diagnostics: async () => CORPUS_DIAGNOSTICS,
        logs: async () => [CORPUS_LOG],
        logTail: async (fileName) => fileName === CORPUS_LOG.name ? CORPUS_LOG_TAIL : void 0
      }),
      directory: createDirectoryService(identity, CORPUS_DIRECTORY),
      identity: createIdentityService(identity),
      records: createRecordService(identity),
      appStream: createAppStreamService(new MemoryAppStreamStore([CORPUS_APP])),
      session: createSessionService(identity, runner),
      // no `runTimes` option: the default is the five the document names, so a
      // case is never refused for a reason that belongs to one host's install
      runtime: createRuntimeService(identity, runner)
    };
  };
  var programOf = (testCase) => String(
    testCase.request.query?._program ?? testCase.request.body?._program ?? testCase.request.body?.code ?? ""
  );
  var RefusingDriveStore = class extends MemoryDriveStore {
    async write() {
      throw new Error("the store refused the write");
    }
    async mkdirp() {
      throw new Error("the store refused the write");
    }
  };
  var checkDrive = async (testCase, services) => {
    if (!testCase.expectDrive || !services.drive) return;
    const holds = async (path) => {
      try {
        await services.drive.read(path);
        return true;
      } catch (e) {
        return false;
      }
    };
    for (const path of testCase.expectDrive.present || [])
      if (!await holds(path))
        throw new Error(
          `${testCase.id}: expected a file at ${path}, and the drive has none`
        );
    for (const path of testCase.expectDrive.missing || [])
      if (await holds(path))
        throw new Error(
          `${testCase.id}: expected no file at ${path}, and the drive still holds one`
        );
  };
  var runCase = async (testCase, services = servicesFor(testCase)) => {
    try {
      const response = await dispatch(services, testCase.route, testCase.request);
      await checkDrive(testCase, services);
      return {
        status: response.status,
        body: response.body,
        contents: response.contents
      };
    } catch (error) {
      if (isApiError(error))
        return { status: error.status, body: error.body, error: error.message };
      throw error;
    }
  };

  // src/appstream/store.ts
  var APP_STREAM_INDEX = "/.sasjs/apps.json";
  var isEntry = (value) => {
    if (typeof value !== "object" || value === null) return false;
    const entry = value;
    return typeof entry.id === "string" && typeof entry.name === "string" && typeof entry.appLoc === "string" && typeof entry.streamWebFolder === "string" && typeof entry.publishedAt === "string";
  };
  var createDriveAppStreamStore = (drive, filePath2 = APP_STREAM_INDEX) => ({
    async read() {
      let contents;
      try {
        contents = (await drive.read(filePath2)).contents;
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return [];
        throw error;
      }
      if (typeof contents !== "string")
        throw new ApiError(
          500,
          `The app index at ${filePath2} is not text, so no app can be read from it.`
        );
      let parsed;
      try {
        parsed = JSON.parse(contents);
      } catch (error) {
        throw new ApiError(
          500,
          `The app index at ${filePath2} is not valid JSON, so no app is registered: ${error.message}`
        );
      }
      if (!Array.isArray(parsed) || !parsed.every(isEntry))
        throw new ApiError(
          500,
          `The app index at ${filePath2} is not a list of app entries, so no app is registered.`
        );
      return parsed;
    },
    async write(entries) {
      const contents = JSON.stringify(entries, null, 2);
      try {
        await drive.update(filePath2, contents);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          await drive.save(filePath2, contents);
          return;
        }
        throw error;
      }
    }
  });

  // src/appstream/web.ts
  var DEFAULT_APP_PATH = "/app";
  var NO_SUCH_APP = "There's no App Stream available here.";
  var ESCAPES = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  };
  var escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ESCAPES[character]);
  var CONTENT_TYPES = {
    html: "text/html; charset=utf-8",
    htm: "text/html; charset=utf-8",
    js: "text/javascript; charset=utf-8",
    mjs: "text/javascript; charset=utf-8",
    css: "text/css; charset=utf-8",
    json: "application/json; charset=utf-8",
    map: "application/json; charset=utf-8",
    txt: "text/plain; charset=utf-8",
    svg: "image/svg+xml",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    ico: "image/x-icon",
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
    otf: "font/otf",
    wasm: "application/wasm",
    pdf: "application/pdf",
    zip: "application/zip"
  };
  var contentTypeFor = (filePath2) => {
    const extension = filePath2.slice(filePath2.lastIndexOf(".") + 1).toLowerCase();
    return CONTENT_TYPES[extension] ?? "application/octet-stream";
  };
  var cacheControlFor = (filePath2) => /\.[0-9a-f]{8,}\.[A-Za-z0-9]+$/.test(filePath2) ? "public, max-age=31536000, immutable" : "public, max-age=0, must-revalidate";
  var html = (status, markup) => ({
    status,
    body: markup,
    contentType: "text/html; charset=utf-8"
  });
  var json = (status, body) => ({
    status,
    body: JSON.stringify(body),
    contentType: "application/json; charset=utf-8"
  });
  var noSuchApp = () => html(404, `<!doctype html><html><body>${NO_SUCH_APP}</body></html>`);
  var methodNotAllowed = (allowed) => ({
    status: 405,
    body: JSON.stringify({ status: "failure", message: `${allowed} only.` }),
    contentType: "application/json; charset=utf-8",
    headers: { allow: allowed }
  });
  var decoded = (segment) => {
    try {
      return decodeURIComponent(segment);
    } catch (_) {
      return void 0;
    }
  };
  var createAppStreamWebService = (appStream, drive, options = {}) => {
    const base = (options.basePath ?? DEFAULT_APP_PATH).replace(/\/+$/, "");
    const title = options.title ?? "SASjs App Stream";
    const urlOf = (entry) => `${base}/${entry.id}/`;
    const rowOf = (entry) => ({
      id: entry.id,
      name: entry.name,
      appLoc: entry.appLoc,
      logo: entry.logo === void 0 ? null : `${urlOf(entry)}${entry.logo}`,
      url: urlOf(entry),
      publishedAt: entry.publishedAt ?? null
    });
    const apps = async (allow) => {
      const entries = await appStream.list(allow);
      return { apps: entries.map(rowOf) };
    };
    const landing = async (allow) => {
      const { apps: rows } = await apps(allow);
      const tiles = rows.length ? `<ul class="apps">${rows.map(
        (row) => `<li><a href="${escapeHtml(row.url)}">${escapeHtml(row.name)}</a><span class="loc">${escapeHtml(row.appLoc)}</span></li>`
      ).join("")}</ul>` : '<p class="empty">No apps have been published yet.</p>';
      return html(
        200,
        [
          '<!doctype html><html lang="en"><head><meta charset="utf-8">',
          '<meta name="viewport" content="width=device-width,initial-scale=1">',
          `<title>${escapeHtml(title)}</title>`,
          "<style>",
          "body{font-family:system-ui,sans-serif;margin:2rem;color:#1f2430}",
          "h1{font-size:1.4rem}",
          "ul.apps{list-style:none;padding:0;display:grid;gap:.75rem;max-width:40rem}",
          "ul.apps li{display:flex;flex-direction:column;gap:.15rem;padding:.75rem 1rem;",
          "border:1px solid #d8dee9;border-radius:.5rem}",
          "ul.apps a{font-weight:600;text-decoration:none;color:#0b5cad}",
          ".loc{font-size:.8rem;color:#5b6472;font-family:ui-monospace,monospace}",
          ".empty{color:#5b6472}",
          "</style></head><body>",
          `<h1>${escapeHtml(title)}</h1>`,
          tiles,
          "</body></html>"
        ].join("")
      );
    };
    const resolve = async (segment, allow) => {
      const entries = await appStream.list(allow);
      const byId2 = entries.find((entry) => entry.id === segment);
      if (byId2) return byId2;
      const byName = entries.filter((entry) => entry.name === segment);
      return byName.length === 1 ? byName[0] : void 0;
    };
    const asset = async (entry, segments) => {
      const parts = segments.map(decoded);
      if (parts.some((part) => part === void 0)) return noSuchApp();
      const relative = parts.join("/") || "index.html";
      try {
        const file = await drive.read(
          `${entry.appLoc}/services/${entry.streamWebFolder}/${relative}`
        );
        return {
          status: 200,
          body: file.contents,
          contentType: contentTypeFor(relative),
          headers: { "cache-control": cacheControlFor(relative) }
        };
      } catch (error) {
        if (error instanceof ApiError && (error.status === 404 || error.status === 400))
          return noSuchApp();
        throw error;
      }
    };
    return {
      apps,
      landing,
      async request({ method, path, allow }) {
        const clean = (path.split(/[?#]/)[0] || "/").replace(/\/{2,}/g, "/");
        const relative = base === "" ? clean : clean === base ? "/" : clean.startsWith(`${base}/`) ? clean.slice(base.length) : null;
        if (relative === null) return noSuchApp();
        if (relative === "" || relative === "/" || relative === "/index.html") {
          if (method !== "GET") return methodNotAllowed("GET");
          return landing(allow);
        }
        if (relative === "/apps.json") {
          if (method !== "GET") return methodNotAllowed("GET");
          return json(200, await apps(allow));
        }
        const segments = relative.split("/").filter(Boolean);
        const key = decoded(segments[0]);
        if (key === void 0) return noSuchApp();
        if (method === "DELETE") {
          const entry2 = await resolve(key, allow);
          if (!entry2) return noSuchApp();
          const removed = await appStream.unpublish(entry2.id);
          return json(200, { status: "success", app: rowOf(removed) });
        }
        if (method !== "GET") return methodNotAllowed("GET, DELETE");
        const entry = await resolve(key, allow);
        if (!entry) return noSuchApp();
        if (segments.length === 1 && !relative.endsWith("/"))
          return { status: 301, location: urlOf(entry) };
        return asset(entry, segments.slice(1));
      }
    };
  };
  return __toCommonJS(index_exports);
})();
if (typeof self !== 'undefined') self.SASjsApi = SASjsApi
