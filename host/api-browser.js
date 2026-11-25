/* @sasjs/api 0.46.0 - the SASjs Server API, for a service worker. https://github.com/sasjs/api */
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
    APP_CORPUS: () => APP_CORPUS,
    APP_FOLDERS_ROOT: () => APP_FOLDERS_ROOT,
    APP_MANIFEST: () => APP_MANIFEST,
    APP_STREAM_INDEX: () => APP_STREAM_INDEX,
    AUTH_CONFIG_CORPUS: () => AUTH_CONFIG_CORPUS,
    ApiError: () => ApiError,
    BACKEND_FOLDER: () => BACKEND_FOLDER,
    BROWSER_INFO: () => BROWSER_INFO,
    BUNDLE_NAME: () => BUNDLE_NAME,
    CODE_CORPUS: () => CODE_CORPUS,
    CODE_DEBUG: () => CODE_DEBUG,
    DEFAULT_APP_PATH: () => DEFAULT_APP_PATH,
    DEFAULT_GRANTABLE_ROUTES: () => DEFAULT_GRANTABLE_ROUTES,
    DEFAULT_IDENTITY: () => DEFAULT_IDENTITY,
    DEFAULT_LOG_LINES: () => DEFAULT_LOG_LINES,
    DEFAULT_SESSIONS: () => DEFAULT_SESSIONS,
    DEPLOYMENT_FILE_ERROR: () => DEPLOYMENT_FILE_ERROR,
    DEPLOY_CORPUS: () => DEPLOY_CORPUS,
    DEPLOY_LIMITS: () => DEPLOY_LIMITS,
    DEPLOY_PAYLOAD_BYTES: () => DEPLOY_PAYLOAD_BYTES,
    DEPLOY_SUCCESS: () => DEPLOY_SUCCESS,
    DIRECTORY_CORPUS: () => DIRECTORY_CORPUS,
    DOCUMENTED_RUN_TIMES: () => DOCUMENTED_RUN_TIMES,
    DRIVE_CORPUS: () => DRIVE_CORPUS,
    EMULATED_HEADER: () => EMULATED_HEADER,
    EMULATED_HEADER_VALUE: () => EMULATED_HEADER_VALUE,
    FRONTEND_FOLDER: () => FRONTEND_FOLDER,
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
    ONE_NAME_ONLY: () => ONE_NAME_ONLY,
    OVERLAY: () => OVERLAY,
    PROVIDER_MANAGED: () => PROVIDER_MANAGED,
    RECORD_CORPUS: () => RECORD_CORPUS,
    ROUTES: () => ROUTES,
    RUNTIME_CORPUS: () => RUNTIME_CORPUS,
    SESSION_CORPUS: () => SESSION_CORPUS,
    STATIC_AUTHORIZED_ROUTES: () => STATIC_AUTHORIZED_ROUTES,
    SURFACE: () => SURFACE,
    SURFACE_ADAPTER_VERSION: () => SURFACE_ADAPTER_VERSION,
    SURFACE_CLI_VERSION: () => SURFACE_CLI_VERSION,
    TAG_CAPABILITIES: () => TAG_CAPABILITIES,
    TOP_LEVEL_ROUTES: () => TOP_LEVEL_ROUTES,
    UNRECORDED: () => UNRECORDED,
    VIYA_CAPTURED_AT: () => VIYA_CAPTURED_AT,
    VIYA_CORPUS: () => VIYA_CORPUS,
    VIYA_HANDLERS: () => VIYA_HANDLERS,
    VIYA_OVERLAY: () => VIYA_OVERLAY,
    VIYA_TABLE: () => VIYA_TABLE,
    VIYA_TARGET_VERSION: () => VIYA_TARGET_VERSION,
    appRootOf: () => appRootOf,
    appSummary: () => appSummary,
    assertOneFileName: () => assertOneFileName,
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
    createDeploymentFileService: () => createDeploymentFileService,
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
    dispatchViya: () => dispatchViya,
    emulatedHeaders: () => emulatedHeaders,
    escapeHtml: () => escapeHtml,
    findRoute: () => findRoute,
    findViyaOperation: () => findViyaOperation,
    frontendFolderOf: () => frontendFolderOf,
    hasBlockedExtension: () => hasBlockedExtension,
    hasFrontendRoot: () => hasFrontendRoot,
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
    programNotFound: () => programNotFound,
    publishRequestFor: () => publishRequestFor,
    resolveProgram: () => resolveProgram,
    routeById: () => routeById,
    runCase: () => runCase,
    runTimeOfPath: () => runTimeOfPath,
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
  var APP_FOLDERS_ROOT = "apps";
  var frontendFolderOf = (name) => `/${APP_FOLDERS_ROOT}/${name}`;
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
  var hasFrontendRoot = (tree) => {
    const members = tree?.members;
    if (!Array.isArray(members)) return false;
    return members.some((member) => {
      const entry = member;
      return entry?.type === "file" && entry?.name === "index.html";
    });
  };
  var checkPublishRequest = (request, tree, options = {}) => {
    const logo = logoOf(request.logo);
    const frameAncestors = frameAncestorsOf(request.frameAncestors);
    const timing = request.publishedAt === void 0 ? {} : { publishedAt: request.publishedAt };
    if (request.streamWebFolder !== void 0) {
      if (request.appLoc === void 0)
        throw new ApiError(
          400,
          '"appLoc" is required when "streamWebFolder" is stated: the entry keeps its web assets at <appLoc>/services/<streamWebFolder>, so both halves are needed to say where they are.'
        );
      const appLoc2 = appLocOf(request.appLoc);
      if (appLoc2 === "/")
        throw new ApiError(400, "An app cannot be published at the drive root.");
      const streamWebFolder = webFolderOf(request.streamWebFolder);
      if (tree !== void 0 && !hasStreamFolder(tree, streamWebFolder))
        throw new ApiError(
          400,
          `The deployed tree has no "services/${streamWebFolder}" folder, so nothing would be published at ${appLoc2}. Deploy the web assets under services/${streamWebFolder}, or ${options.folderFromManifest ? "correct the folder sasjs.app.json names." : "omit streamWebFolder."}`
        );
      return {
        appLoc: appLoc2,
        streamWebFolder,
        ...request.name === void 0 ? {} : { name: nameOf(request.name) },
        ...logo === void 0 ? {} : { logo },
        ...frameAncestors === void 0 ? {} : { frameAncestors },
        ...timing
      };
    }
    if (request.name === void 0)
      throw new ApiError(
        400,
        '"name" is required: an app is published at apps/<name>, so the publish has to say what it is called.'
      );
    const name = nameOf(request.name);
    const appLoc = request.appLoc === void 0 ? void 0 : appLocOf(request.appLoc);
    if (appLoc === "/")
      throw new ApiError(400, "An app cannot name the drive root as its backend.");
    if (tree !== void 0 && !hasFrontendRoot(tree))
      throw new ApiError(
        400,
        `The deployed tree has no "index.html" at its root, so nothing would be published at apps/${name}. Publish the compiled web folder itself, not the folder that holds it.`
      );
    return {
      name,
      ...appLoc === void 0 ? {} : { appLoc },
      ...logo === void 0 ? {} : { logo },
      ...frameAncestors === void 0 ? {} : { frameAncestors },
      ...timing
    };
  };
  var nameOf = (value) => {
    if (typeof value !== "string" || value.trim() === "")
      throw new ApiError(400, '"name" must be a non-empty string');
    return urlSafeName(value.trim());
  };
  var NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._~-]*$/;
  var NAME_MAX_LENGTH = 64;
  var RESERVED_NAMES = ["apps.json", "index.html"];
  var urlSafeName = (name) => {
    if (name.length > NAME_MAX_LENGTH)
      throw new ApiError(
        400,
        `"name" must be at most ${NAME_MAX_LENGTH} characters, and "${name}" is ${name.length}.`
      );
    if (!NAME_PATTERN.test(name))
      throw new ApiError(
        400,
        `"name" must be usable as a URL segment - letters, digits, dot, dash, underscore or tilde, starting with a letter or digit - so "/app/${name}" can be opened. "${name}" is not, because it carries a character that has to be percent-encoded, or a space.`
      );
    if (RESERVED_NAMES.includes(name.toLowerCase()))
      throw new ApiError(
        400,
        `"name" cannot be "${name}": the App Stream answers /app/${name} itself, so an app with that name could never be opened by name.`
      );
    return name;
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
          (candidate) => candidate.streamWebFolder !== void 0 && candidate.appLoc !== void 0 && sameAppLoc(candidate.appLoc, normalised)
        );
        return entry ? { ...entry } : void 0;
      },
      publish(request) {
        return mutate(async () => {
          const checked = checkPublishRequest(request);
          const entries = await store.read();
          const legacy = checked.streamWebFolder !== void 0;
          const sameTarget = (candidate) => legacy ? candidate.streamWebFolder !== void 0 && candidate.appLoc !== void 0 && sameAppLoc(candidate.appLoc, checked.appLoc) : candidate.streamWebFolder === void 0 && candidate.name === checked.name;
          const existing = entries.find(sameTarget);
          const logo = checked.logo;
          const frameAncestors = checked.frameAncestors;
          const name = legacy ? checked.name ?? existing?.name ?? defaultAppName(checked.appLoc) : checked.name;
          if (!legacy || checked.name !== void 0) {
            const clash = entries.find(
              (candidate) => candidate !== existing && candidate.name.toLowerCase() === name.toLowerCase()
            );
            if (clash)
              throw new ApiError(
                409,
                `The name "${name}" is already the address of the app at ${clash.appLoc ?? frontendFolderOf(clash.name)}. An app's name is how it opens (/app/${name}), and two apps holding one name would answer an ambiguous lookup with nothing, so publish this one under a different name.`
              );
          }
          const entry = {
            id: existing ? existing.id : newAppId(),
            // the label is the one field a redeploy inherits: everything else is
            // what this publish states
            name,
            ...checked.appLoc === void 0 ? {} : { appLoc: checked.appLoc },
            ...checked.streamWebFolder === void 0 ? {} : { streamWebFolder: checked.streamWebFolder },
            ...logo === void 0 ? {} : { logo },
            ...frameAncestors === void 0 ? {} : { frameAncestors },
            publishedAt: checked.publishedAt ?? (/* @__PURE__ */ new Date()).toISOString()
          };
          await store.write([
            ...entries.filter((candidate) => !sameTarget(candidate)),
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
  var appRootOf = (entry) => entry.streamWebFolder !== void 0 && entry.appLoc !== void 0 ? `${entry.appLoc}/services/${entry.streamWebFolder}` : frontendFolderOf(entry.name);
  var createAppStreamWebService = (appStream, drive, options = {}) => {
    const base = (options.basePath ?? DEFAULT_APP_PATH).replace(/\/+$/, "");
    const title = options.title ?? "SASjs App Stream";
    const urlOf = (entry) => `${base}/${entry.id}/`;
    const rowOf = (entry) => ({
      id: entry.id,
      name: entry.name,
      appLoc: entry.appLoc ?? null,
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
        (row) => `<li><a href="${escapeHtml(row.url)}">${escapeHtml(row.name)}</a><span class="loc">${escapeHtml(
          row.appLoc ?? frontendFolderOf(row.name)
        )}</span></li>`
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
        const file = await drive.read(`${appRootOf(entry)}/${relative}`);
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

  // src/drive/deploymentFile.ts
  var DEPLOYMENT_FILE_ERROR = "Parameter Error\nFile error";
  var ONE_NAME_ONLY = 'Exactly one of "_filePath" and "_FILE" may be given.';
  var assertOneFileName = (query) => {
    if (query._filePath !== void 0 && query._FILE !== void 0)
      throw new ApiError(400, ONE_NAME_ONLY);
  };
  var notFound = (error) => isApiError(error) && error.status === 404 || // a structural read, not `NodeJS.ErrnoException`: this module is in the
  // browser build, which has no node types at all
  error?.code === "ENOENT";
  var notThere = () => ({
    status: 202,
    contentType: "text/plain; charset=utf-8",
    body: DEPLOYMENT_FILE_ERROR
  });
  var createDeploymentFileService = (store) => ({
    async read(input) {
      const checked = checkFilePath(input);
      if ("reason" in checked)
        throw checked.reason === "extension" ? new ApiError(400, "Invalid file extension") : new ApiError(400, `Can't get file outside drive.`);
      if (isRoot(checked.path))
        throw new ApiError(400, `Can't get file outside drive.`);
      const path = checked.path;
      try {
        if ((await store.stat(path)).directory) return notThere();
        return {
          status: 200,
          contentType: contentTypeFor(path),
          // lower case, matching the app stream's own answer (src/appstream/web.ts):
          // the names are case-insensitive in HTTP but not in a plain object, and a
          // host copying one into the other would lose a policy that mattered
          headers: { "cache-control": cacheControlFor(path) },
          body: await store.read(path)
        };
      } catch (error) {
        if (notFound(error)) return notThere();
        throw error;
      }
    }
  });

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
      id: "GET /SASjsApi/app/{id}",
      method: "GET",
      path: "/SASjsApi/app/{id}",
      tag: "App Stream",
      summary: "Get a published app by id",
      params: [
        {
          name: "id",
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
          description: "No App Stream is registered with that id."
        },
        {
          status: 500,
          description: "Internal Server Error"
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
        },
        {
          name: "layout",
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
          status: 401,
          description: "Unauthorized"
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
          required: false,
          type: "string"
        },
        {
          name: "name",
          in: "body",
          required: false,
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
          status: 401,
          description: "Unauthorized"
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
          name: "name",
          in: "query",
          required: false,
          type: "string"
        },
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
          status: 401,
          description: "Unauthorized"
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
          status: 401,
          description: "Unauthorized"
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
          required: false,
          type: "string"
        },
        {
          name: "_FILE",
          in: "query",
          required: false,
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
          status: 202,
          description: "A streamed file is not there: Parameter Error / File error"
        },
        {
          status: 400,
          description: "A path outside the drive, a refused extension, or a request naming neither or both"
        },
        {
          status: 401,
          description: "Unauthorized"
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
          status: 401,
          description: "Unauthorized"
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
          status: 401,
          description: "Unauthorized"
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
        },
        {
          status: 401,
          description: "Unauthorized"
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
          status: 401,
          description: "Unauthorized"
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
          status: 401,
          description: "Unauthorized"
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
          status: 401,
          description: "Unauthorized"
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
          status: 401,
          description: "Unauthorized"
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
          required: false,
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
          status: 400,
          description: 'A body the schema refuses, e.g. `"isActive" must be a boolean`.'
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
          status: 400,
          description: 'A body the schema refuses, e.g. `"isAdmin" must be a boolean`.'
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
          status: 400,
          description: 'A password shorter than six characters, or a key the deletion takes none of; e.g. `"password" is required`'
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
          required: false,
          type: "string"
        },
        {
          name: "username",
          in: "body",
          required: false,
          type: "string"
        },
        {
          name: "password",
          in: "body",
          required: false,
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
          status: 400,
          description: 'A body the schema refuses, e.g. `"isAdmin" must be a boolean`.'
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
          status: 400,
          description: 'A username the schema refuses, a password shorter than six characters, or a key an administrator\'s deletion takes none of; e.g. `"password" is required`'
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
          status: 400,
          description: 'A username the schema refuses, e.g. `"username" must only contain alpha-numeric characters`'
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
          required: false,
          type: "string"
        },
        {
          name: "username",
          in: "body",
          required: false,
          type: "string"
        },
        {
          name: "password",
          in: "body",
          required: false,
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
          status: 400,
          description: 'A body the schema refuses, e.g. `"isAdmin" must be a boolean`.'
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
    Web: ["identity"],
    // an app's entry is indexed, and the file it is served from is read off the drive
    "App Stream": ["storage"]
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
    // The administrator check is the package's, so its 401 is a case like any
    // other; the 500 a genuine failure answers stays the host's.
    "GET /SASjsApi/admin/diagnostics": {
      implemented: true,
      hostResponses: [500],
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
      hostResponses: [500],
      responses: { 200: { files: [] } }
    },
    "GET /SASjsApi/admin/logs/{fileName}": {
      implemented: true,
      // 400 and 404 are the name rule's, and this package answers them before the
      // host is asked for anything
      hostResponses: [500],
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
    // The `_FILE=` read needs one capability the plain drive read does not: a
    // host that serves a streamed deployment must supply the typed read, and one
    // that does not answers 501 naming it - which is what a capability is for.
    // (No route documents 501; the answer a host gives for a capability it lacks
    // is outside the contract, and this field is where the package says it may
    // happen.)
    "GET /SASjsApi/drive/file": {
      implemented: true,
      capabilities: ["storage", "deploymentFile"]
    },
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
    // App Stream - what is published under one app's id.
    //
    // Carried here: the answer is the app index plus the drive, and `APP_CORPUS` pins
    // its shape. The mock build (`sasjs/cli`) still answers the App Stream surface by
    // hand; consuming this operation from the table is its next step on
    // sasjs/cli#1550, not this package's.
    "GET /SASjsApi/app/{id}": {
      implemented: true,
      // a drive read that broke is the host's to answer
      hostResponses: [500],
      // the shape a client reads: the entry as registered, the file it is served from,
      // and whether that file is there
      responses: {
        404: {
          status: "failure",
          message: "No App Stream is registered with that id."
        },
        200: {
          id: "",
          name: "",
          appLoc: "",
          streamWebFolder: "",
          publishedAt: null,
          entryFile: "index.html",
          entryFileExists: false,
          lastModified: null,
          url: ""
        }
      }
    },
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

  // src/viya/surface.ts
  var SURFACE_ADAPTER_VERSION = "6.1.2";
  var SURFACE_CLI_VERSION = "8.0.5";
  var SURFACE = [
    // sas9
    {
      path: "/Public/seedapp",
      family: "sas9",
      decision: "declined",
      reason: "a default config value the client falls back to, not a call"
    },
    {
      path: "/host/boot.js",
      family: "sasjs-api",
      decision: "declined",
      reason: "the mock host's own boot script: the adapter reads it off a page's script tag to tell whether the mock service worker is serving, so it is never a request to an estate"
    },
    {
      path: "/SASJobExecution",
      family: "sas9",
      decision: "declined",
      reason: "SAS 9 and SASjs surfaces: the emulator answers Viya, and the same client reaches these on an EBI deployment"
    },
    // viya-auth
    {
      path: "/SASLogon",
      family: "viya-auth",
      decision: "in",
      reason: "the auth flow the client speaks, and the reason the emulated paths cannot be renamed"
    },
    {
      path: "/SASLogon/authorize",
      family: "viya-auth",
      decision: "in",
      reason: "the transport the CLI signs in with: it posts the credential here for a code, and this server answers it as its own auth route rather than the emulator"
    },
    {
      path: "/SASLogon/login",
      family: "viya-auth",
      decision: "in",
      reason: "the auth flow the client speaks, and the reason the emulated paths cannot be renamed"
    },
    {
      path: "/SASLogon/login.do",
      family: "viya-auth",
      decision: "in",
      reason: "the auth flow the client speaks, and the reason the emulated paths cannot be renamed"
    },
    {
      path: "/SASLogon/logout",
      family: "viya-auth",
      decision: "in",
      reason: "the auth flow the client speaks, and the reason the emulated paths cannot be renamed"
    },
    {
      path: "/SASLogon/logout.do",
      family: "viya-auth",
      decision: "in",
      reason: "the auth flow the client speaks, and the reason the emulated paths cannot be renamed"
    },
    {
      path: "/SASLogon/oauth/authorize",
      family: "viya-auth",
      decision: "in",
      reason: "the auth flow the client speaks, and the reason the emulated paths cannot be renamed"
    },
    {
      path: "/SASLogon/oauth/token",
      family: "viya-auth",
      decision: "in",
      reason: "the auth flow the client speaks, and the reason the emulated paths cannot be renamed"
    },
    // sas9
    {
      path: "/SASStoredProcess",
      family: "sas9",
      decision: "declined",
      reason: "SAS 9 and SASjs surfaces: the emulator answers Viya, and the same client reaches these on an EBI deployment"
    },
    {
      path: "/SASStoredProcess/do",
      family: "sas9",
      decision: "declined",
      reason: "SAS 9 and SASjs surfaces: the emulator answers Viya, and the same client reaches these on an EBI deployment"
    },
    {
      path: "/SASStoredProcess/j_spring_cas_security_check",
      family: "sas9",
      decision: "declined",
      reason: "SAS 9 and SASjs surfaces: the emulator answers Viya, and the same client reaches these on an EBI deployment"
    },
    // sasjs-api
    {
      path: "/SASjsApi",
      family: "sasjs-api",
      decision: "declined",
      reason: "the SASjs API surface, answered by the server's own registered routes, not by a Viya-shaped one"
    },
    // sas9
    {
      path: "/User Folders/{}/My Folder/sasjs/runner",
      family: "sas9",
      decision: "declined",
      reason: "SAS 9 and SASjs surfaces: the emulator answers Viya, and the same client reaches these on an EBI deployment"
    },
    // sasjs-api
    {
      path: "/auth/refresh",
      family: "sasjs-api",
      decision: "declined",
      reason: "the SASjs API surface, answered by the server's own registered routes, not by a Viya-shaped one"
    },
    {
      path: "/auth/token",
      family: "sasjs-api",
      decision: "declined",
      reason: "the SASjs API surface, answered by the server's own registered routes, not by a Viya-shaped one"
    },
    {
      path: "/code/execute",
      family: "sasjs-api",
      decision: "declined",
      reason: "the SASjs API surface, answered by the server's own registered routes, not by a Viya-shaped one"
    },
    // viya-compute
    {
      path: "/compute/contexts",
      family: "viya-compute",
      decision: "in",
      reason: "contexts, sessions, jobs and the webout fileref, which the emulator backs with SessionService and RuntimeService"
    },
    {
      path: "/compute/contexts/{}",
      family: "viya-compute",
      decision: "in",
      reason: "contexts, sessions, jobs and the webout fileref, which the emulator backs with SessionService and RuntimeService"
    },
    {
      path: "/compute/contexts/{}/sessions",
      family: "viya-compute",
      decision: "in",
      reason: "contexts, sessions, jobs and the webout fileref, which the emulator backs with SessionService and RuntimeService"
    },
    {
      path: "/compute/sessions/{}",
      family: "viya-compute",
      decision: "in",
      reason: "contexts, sessions, jobs and the webout fileref, which the emulator backs with SessionService and RuntimeService"
    },
    {
      path: "/compute/sessions/{}/filerefs/_webout/content",
      family: "viya-compute",
      decision: "in",
      reason: "contexts, sessions, jobs and the webout fileref, which the emulator backs with SessionService and RuntimeService"
    },
    {
      path: "/compute/sessions/{}/jobs",
      family: "viya-compute",
      decision: "in",
      reason: "contexts, sessions, jobs and the webout fileref, which the emulator backs with SessionService and RuntimeService"
    },
    {
      path: "/compute/sessions/{}/jobs/{}",
      family: "viya-compute",
      decision: "in",
      reason: "contexts, sessions, jobs and the webout fileref, which the emulator backs with SessionService and RuntimeService"
    },
    {
      path: "/compute/sessions/{}/variables/{}",
      family: "viya-compute",
      decision: "in",
      reason: "contexts, sessions, jobs and the webout fileref, which the emulator backs with SessionService and RuntimeService"
    },
    // viya-files
    {
      path: "/content",
      family: "viya-files",
      decision: "declined",
      reason: "not a route: a suffix the client appends to a file or log URI, which is why the file-content and job-log entries above carry it"
    },
    // sasjs-api
    {
      path: "/drive/deploy",
      family: "sasjs-api",
      decision: "declined",
      reason: "the SASjs API surface, answered by the server's own registered routes, not by a Viya-shaped one"
    },
    {
      path: "/drive/deploy/upload",
      family: "sasjs-api",
      decision: "declined",
      reason: "the SASjs API surface, answered by the server's own registered routes, not by a Viya-shaped one"
    },
    // viya-files
    {
      path: "/files/files",
      family: "viya-files",
      decision: "in",
      reason: "file create, read and replace, which the emulator backs with DriveService"
    },
    {
      path: "/files/files/{}",
      family: "viya-files",
      decision: "in",
      reason: "file create, read and replace, which the emulator backs with DriveService"
    },
    // viya-folders
    {
      path: "/folders/folders",
      family: "viya-folders",
      decision: "in",
      reason: "content structure, which the emulator backs with DriveService"
    },
    {
      path: "/folders/folders/@item",
      family: "viya-folders",
      decision: "in",
      reason: "content structure, which the emulator backs with DriveService"
    },
    {
      path: "/folders/folders/@myRecycleBin",
      family: "viya-folders",
      decision: "in",
      reason: "content structure, which the emulator backs with DriveService"
    },
    {
      path: "/folders/folders/{}",
      family: "viya-folders",
      decision: "in",
      reason: "content structure, which the emulator backs with DriveService"
    },
    {
      path: "/folders/folders/{}/members",
      family: "viya-folders",
      decision: "in",
      reason: "content structure, which the emulator backs with DriveService"
    },
    // viya-identity
    {
      path: "/identities/users/@currentUser",
      family: "viya-identity",
      decision: "in",
      reason: "who the caller is; every session and folder answer is scoped to it"
    },
    // viya-jobs
    {
      path: "/jobDefinitions/definitions",
      family: "viya-jobs",
      decision: "in",
      reason: "the job path a deployed service runs through"
    },
    {
      path: "/jobDefinitions/definitions/{}",
      family: "viya-jobs",
      decision: "in",
      source: "capture",
      reason: "the definition itself, which the client reads through the link a folder listing handed it - the URL arrives as data, so no literal in the adapter states it"
    },
    {
      path: "/jobExecution/jobs",
      family: "viya-jobs",
      decision: "in",
      reason: "the job path a deployed service runs through"
    },
    {
      path: "/jobExecution/jobs/{}",
      family: "viya-jobs",
      decision: "in",
      reason: "the job path a deployed service runs through"
    },
    // viya-compute
    {
      path: "/launcher/contexts",
      family: "viya-compute",
      decision: "in",
      reason: "contexts, sessions, jobs and the webout fileref, which the emulator backs with SessionService and RuntimeService"
    },
    // viya-files
    {
      path: "/log",
      family: "viya-files",
      decision: "declined",
      reason: "not a route: a suffix the client appends to a file or log URI, which is why the file-content and job-log entries above carry it"
    },
    // viya-auth
    {
      path: "/oauth/clients/{}",
      family: "viya-auth",
      decision: "declined",
      reason: "client registration is an identity-provider admin action; the emulated estate accepts the public `sas.cli` client and mints its own tokens"
    },
    // sasjs-api
    {
      path: "/session/{}",
      family: "sasjs-api",
      decision: "declined",
      reason: "the SASjs API surface, answered by the server's own registered routes, not by a Viya-shaped one"
    },
    {
      path: "/session/{}/log",
      family: "sasjs-api",
      decision: "declined",
      reason: "the SASjs API surface, answered by the server's own registered routes, not by a Viya-shaped one"
    },
    {
      path: "/session/{}/state",
      family: "sasjs-api",
      decision: "declined",
      reason: "the SASjs API surface, answered by the server's own registered routes, not by a Viya-shaped one"
    },
    {
      path: "/stp/execute",
      family: "sasjs-api",
      decision: "declined",
      reason: "the SASjs API surface, answered by the server's own registered routes, not by a Viya-shaped one"
    },
    {
      path: "/stp/trigger",
      family: "sasjs-api",
      decision: "declined",
      reason: "the SASjs API surface, answered by the server's own registered routes, not by a Viya-shaped one"
    },
    // viya-files
    {
      path: "/types/types",
      family: "viya-files",
      decision: "in",
      reason: "read before every file create, to find the type definition for the extension"
    }
  ];

  // src/viya/table.ts
  var VIYA_TABLE = [
    {
      id: "GET /compute/contexts",
      method: "GET",
      path: "/compute/contexts",
      steps: [
        "compute/context-by-name",
        "compute/contexts",
        "compute/execute-script",
        "compute/session-create"
      ],
      statuses: [200],
      queries: ["filter", "limit"],
      request: {
        queries: ["filter", "limit"],
        body: void 0
      },
      shape: {
        accept: "string",
        count: "number",
        items: [
          {
            createdBy: "string",
            id: "string",
            links: [
              {
                href: "string",
                method: "string",
                rel: "string",
                type: "string",
                uri: "string"
              }
            ],
            name: "string",
            version: "number"
          }
        ],
        limit: "number",
        links: [
          {
            href: "string",
            itemType: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        name: "string",
        start: "number",
        version: "number"
      }
    },
    {
      id: "POST /compute/contexts/{}/sessions",
      method: "POST",
      path: "/compute/contexts/{}/sessions",
      steps: ["compute/execute-script", "compute/session-create"],
      statuses: [201],
      queries: [],
      request: {
        queries: [],
        body: {}
      },
      shape: {
        applicationName: "string",
        attributes: {
          homeDirectory: "string",
          sessionInactiveTimeout: "number"
        },
        creationTimeStamp: "string",
        environment: {
          autoExecLines: ["string"]
        },
        id: "string",
        links: [
          {
            href: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        owner: "string",
        serverId: "string",
        serviceAPIVersion: "number",
        sessionConditionCode: "number",
        state: "string",
        stateElapsedTime: "number",
        version: "number"
      }
    },
    {
      id: "DELETE /compute/sessions/{}",
      method: "DELETE",
      path: "/compute/sessions/{}",
      steps: ["compute/session-delete"],
      statuses: [204],
      queries: [],
      request: {
        queries: [],
        body: void 0
      },
      shape: void 0
    },
    {
      id: "POST /compute/sessions/{}/jobs",
      method: "POST",
      path: "/compute/sessions/{}/jobs",
      steps: ["compute/execute-script"],
      statuses: [201],
      queries: [],
      request: {
        queries: [],
        body: {
          code: "string",
          description: "string",
          name: "string",
          variables: {
            SYS_JES_JOB_URI: "string",
            _DEBUG: "number",
            _program: "string"
          },
          version: "number"
        }
      },
      shape: {
        creationTimeStamp: "string",
        id: "string",
        links: [
          {
            href: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        sessionId: "string",
        state: "string",
        stateElapsedTime: "number",
        version: "number"
      }
    },
    {
      id: "GET /compute/sessions/{}/jobs/{}",
      method: "GET",
      path: "/compute/sessions/{}/jobs/{}",
      steps: ["compute/execute-script"],
      statuses: [200],
      queries: [],
      request: {
        queries: [],
        body: void 0
      },
      shape: {
        completedTimeStamp: "string",
        creationTimeStamp: "string",
        id: "string",
        jobConditionCode: "number",
        links: [
          {
            href: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        listingStatistics: {
          lineCount: "number",
          modifiedTimeStamp: "string"
        },
        logStatistics: {
          lineCount: "number",
          modifiedTimeStamp: "string"
        },
        sessionId: "string",
        state: "string",
        stateElapsedTime: "number",
        statistics: {
          systemCpuTime: "number",
          userCpuTime: "number"
        },
        version: "number"
      }
    },
    {
      id: "GET /compute/sessions/{}/jobs/{}/log/content",
      method: "GET",
      path: "/compute/sessions/{}/jobs/{}/log/content",
      steps: ["compute/execute-script"],
      statuses: [200],
      queries: ["limit", "start"],
      request: {
        queries: ["limit", "start"],
        body: void 0
      },
      shape: {
        accept: "string",
        count: "number",
        items: [
          {
            line: "string",
            type: "string",
            version: "number"
          }
        ],
        limit: "number",
        links: [
          {
            href: "string",
            itemType: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        name: "string",
        start: "number",
        version: "number"
      }
    },
    {
      id: "GET /compute/sessions/{}/jobs/{}/state",
      method: "GET",
      path: "/compute/sessions/{}/jobs/{}/state",
      steps: ["compute/execute-script"],
      statuses: [200],
      queries: ["_action", "wait"],
      request: {
        queries: ["_action", "wait"],
        body: void 0
      },
      shape: void 0
    },
    {
      id: "GET /compute/sessions/{}/state",
      method: "GET",
      path: "/compute/sessions/{}/state",
      steps: ["compute/execute-script", "compute/session-state"],
      statuses: [200],
      queries: ["wait"],
      request: {
        queries: ["wait"],
        body: void 0
      },
      shape: void 0
    },
    {
      id: "GET /compute/sessions/{}/variables/{}",
      method: "GET",
      path: "/compute/sessions/{}/variables/{}",
      steps: ["compute/execute-script"],
      statuses: [200],
      queries: [],
      request: {
        queries: [],
        body: void 0
      },
      shape: {
        links: [
          {
            href: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        name: "string",
        scope: "string",
        value: "string",
        version: "number"
      }
    },
    {
      id: "POST /files/files",
      method: "POST",
      path: "/files/files",
      steps: ["files/create"],
      statuses: [201],
      queries: ["parentFolderUri", "typeDefName"],
      request: {
        queries: ["parentFolderUri", "typeDefName"],
        body: {
          multipart: ["file"]
        }
      },
      shape: {
        contentDisposition: "string",
        contentType: "string",
        createdBy: "string",
        creationTimeStamp: "string",
        encoding: "string",
        fileStatus: "string",
        fileVersion: "number",
        id: "string",
        links: [
          {
            href: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        modifiedBy: "string",
        modifiedTimeStamp: "string",
        name: "string",
        properties: {},
        quarantine: "boolean",
        searchable: "boolean",
        size: "number",
        typeDefName: "string",
        urlDetected: "boolean",
        version: "number",
        virusDetected: "boolean"
      }
    },
    {
      id: "GET /files/files/{}",
      method: "GET",
      path: "/files/files/{}",
      steps: ["files/replace"],
      statuses: [200],
      queries: [],
      request: {
        queries: [],
        body: void 0
      },
      shape: {
        contentDisposition: "string",
        contentType: "string",
        createdBy: "string",
        creationTimeStamp: "string",
        encoding: "string",
        fileStatus: "string",
        fileVersion: "number",
        id: "string",
        links: [
          {
            href: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        modifiedBy: "string",
        modifiedTimeStamp: "string",
        name: "string",
        properties: {
          "content.download": "string",
          "content.openInBrowser": "string",
          "content.preview": "string",
          sasIconKey: "string",
          typeRegistrant: "string"
        },
        quarantine: "boolean",
        searchable: "boolean",
        size: "number",
        typeDefName: "string",
        urlDetected: "boolean",
        version: "number",
        virusDetected: "boolean"
      }
    },
    {
      id: "PATCH /files/files/{}",
      method: "PATCH",
      path: "/files/files/{}",
      steps: ["files/create"],
      statuses: [200],
      queries: [],
      request: {
        queries: [],
        body: {
          name: "string",
          properties: {
            "content.download": "string",
            "content.openInBrowser": "string",
            "content.preview": "string",
            sasIconKey: "string",
            typeRegistrant: "string"
          }
        }
      },
      shape: {
        contentDisposition: "string",
        contentType: "string",
        createdBy: "string",
        creationTimeStamp: "string",
        encoding: "string",
        fileStatus: "string",
        fileVersion: "number",
        id: "string",
        links: [
          {
            href: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        modifiedBy: "string",
        modifiedTimeStamp: "string",
        name: "string",
        properties: {
          "content.download": "string",
          "content.openInBrowser": "string",
          "content.preview": "string",
          sasIconKey: "string",
          typeRegistrant: "string"
        },
        quarantine: "boolean",
        searchable: "boolean",
        size: "number",
        typeDefName: "string",
        urlDetected: "boolean",
        version: "number",
        virusDetected: "boolean"
      }
    },
    {
      id: "GET /files/files/{}/content",
      method: "GET",
      path: "/files/files/{}/content",
      steps: ["files/content", "jobs/execute"],
      statuses: [200],
      queries: [],
      request: {
        queries: [],
        body: void 0
      },
      shape: void 0
    },
    {
      id: "PUT /files/files/{}/content",
      method: "PUT",
      path: "/files/files/{}/content",
      steps: ["files/replace"],
      statuses: [200],
      queries: [],
      request: {
        queries: [],
        body: void 0
      },
      shape: {
        contentDisposition: "string",
        contentType: "string",
        createdBy: "string",
        creationTimeStamp: "string",
        encoding: "string",
        fileStatus: "string",
        fileVersion: "number",
        id: "string",
        links: [
          {
            href: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        modifiedBy: "string",
        modifiedTimeStamp: "string",
        name: "string",
        properties: {
          "content.download": "string",
          "content.openInBrowser": "string",
          "content.preview": "string",
          sasIconKey: "string",
          typeRegistrant: "string"
        },
        quarantine: "boolean",
        searchable: "boolean",
        size: "number",
        typeDefName: "string",
        urlDetected: "boolean",
        version: "number",
        virusDetected: "boolean"
      }
    },
    {
      id: "POST /folders/folders",
      method: "POST",
      path: "/folders/folders",
      steps: ["folders/create", "jobs/folder-create"],
      statuses: [201],
      queries: ["parentFolderUri"],
      request: {
        queries: ["parentFolderUri"],
        body: {
          name: "string",
          type: "string"
        }
      },
      shape: {
        createdBy: "string",
        creationTimeStamp: "string",
        id: "string",
        links: [
          {
            href: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        memberCount: "number",
        modifiedBy: "string",
        modifiedTimeStamp: "string",
        name: "string",
        parentFolderUri: "string",
        type: "string",
        version: "number"
      }
    },
    {
      id: "GET /folders/folders/{}",
      method: "GET",
      path: "/folders/folders/{}",
      steps: ["folders/delete", "jobs/folders/delete"],
      statuses: [200],
      queries: [],
      request: {
        queries: [],
        body: void 0
      },
      shape: {
        createdBy: "string",
        creationTimeStamp: "string",
        description: "string",
        id: "string",
        links: [
          {
            href: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        memberCount: "number",
        modifiedBy: "string",
        modifiedTimeStamp: "string",
        name: "string",
        parentFolderUri: "string",
        properties: {
          allowMove: "string"
        },
        type: "string",
        version: "number"
      }
    },
    {
      id: "PATCH /folders/folders/{}",
      method: "PATCH",
      path: "/folders/folders/{}",
      steps: ["folders/delete", "jobs/folders/delete"],
      statuses: [200],
      queries: [],
      request: {
        queries: [],
        body: {
          id: "string",
          name: "string",
          parentFolderUri: "string"
        }
      },
      shape: {
        createdBy: "string",
        creationTimeStamp: "string",
        id: "string",
        links: [
          {
            href: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        memberCount: "number",
        modifiedBy: "string",
        modifiedTimeStamp: "string",
        name: "string",
        parentFolderUri: "string",
        type: "string",
        version: "number"
      }
    },
    {
      id: "GET /folders/folders/{}/members",
      method: "GET",
      path: "/folders/folders/{}/members",
      steps: [
        "files/content",
        "files/replace",
        "folders/members",
        "jobs/execute"
      ],
      statuses: [200],
      queries: ["limit"],
      request: {
        queries: ["limit"],
        body: void 0
      },
      shape: {
        accept: "string",
        count: "number",
        items: [
          {
            added: "string",
            contentType: "string",
            createdBy: "string",
            creationTimeStamp: "string",
            id: "string",
            links: [
              {
                href: "string",
                method: "string",
                rel: "string",
                type: "string",
                uri: "string"
              }
            ],
            modifiedBy: "string",
            modifiedTimeStamp: "string",
            name: "string",
            parentFolderUri: "string",
            type: "string",
            uri: "string",
            version: "number"
          }
        ],
        limit: "number",
        links: [
          {
            href: "string",
            itemType: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        name: "string",
        start: "number",
        version: "number"
      }
    },
    {
      id: "GET /folders/folders/@item",
      method: "GET",
      path: "/folders/folders/@item",
      steps: [
        "files/content",
        "files/create",
        "files/replace",
        "folders/create",
        "folders/delete",
        "folders/item",
        "folders/members",
        "folders/missing",
        "folders/unauthorized",
        "jobs/definition",
        "jobs/execute",
        "jobs/folder-create",
        "jobs/folders/delete"
      ],
      statuses: [200, 401, 404],
      queries: ["path"],
      request: {
        queries: ["path"],
        body: void 0
      },
      shape: {
        createdBy: "string",
        creationTimeStamp: "string",
        description: "string",
        id: "string",
        links: [
          {
            href: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        memberCount: "number",
        modifiedBy: "string",
        modifiedTimeStamp: "string",
        name: "string",
        parentFolderUri: "string",
        type: "string",
        version: "number"
      }
    },
    {
      id: "GET /folders/folders/@myRecycleBin",
      method: "GET",
      path: "/folders/folders/@myRecycleBin",
      steps: ["folders/delete", "jobs/folders/delete"],
      statuses: [200],
      queries: [],
      request: {
        queries: [],
        body: void 0
      },
      shape: {
        createdBy: "string",
        creationTimeStamp: "string",
        description: "string",
        id: "string",
        links: [
          {
            href: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        memberCount: "number",
        modifiedBy: "string",
        modifiedTimeStamp: "string",
        name: "string",
        parentFolderUri: "string",
        properties: {
          allowMove: "string"
        },
        type: "string",
        version: "number"
      }
    },
    {
      id: "GET /identities/users/@currentUser",
      method: "GET",
      path: "/identities/users/@currentUser",
      steps: ["identities/current-user"],
      statuses: [200],
      queries: [],
      request: {
        queries: [],
        body: void 0
      },
      shape: {
        addresses: [
          {
            locality: "string",
            type: "string"
          }
        ],
        emailAddresses: [
          {
            type: "string",
            value: "string"
          }
        ],
        id: "string",
        links: [
          {
            href: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        name: "string",
        providerId: "string",
        state: "string",
        version: "number"
      }
    },
    {
      id: "POST /jobDefinitions/definitions",
      method: "POST",
      path: "/jobDefinitions/definitions",
      steps: ["jobs/definition"],
      statuses: [201],
      queries: ["parentFolderUri"],
      request: {
        queries: ["parentFolderUri"],
        body: {
          code: "string",
          name: "string",
          parameters: [
            {
              defaultValue: "string",
              name: "string",
              type: "string"
            }
          ],
          type: "string"
        }
      },
      shape: {
        code: "string",
        createdBy: "string",
        creationTimeStamp: "string",
        id: "string",
        links: [
          {
            href: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        modifiedBy: "string",
        modifiedTimeStamp: "string",
        name: "string",
        parameters: [
          {
            defaultValue: "string",
            name: "string",
            required: "boolean",
            type: "string",
            version: "number"
          }
        ],
        type: "string",
        version: "number"
      }
    },
    {
      id: "GET /jobDefinitions/definitions/{}",
      method: "GET",
      path: "/jobDefinitions/definitions/{}",
      steps: ["jobs/execute"],
      statuses: [200],
      queries: [],
      request: {
        queries: [],
        body: void 0
      },
      shape: {
        code: "string",
        createdBy: "string",
        creationTimeStamp: "string",
        id: "string",
        links: [
          {
            href: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        modifiedBy: "string",
        modifiedTimeStamp: "string",
        name: "string",
        parameters: [
          {
            defaultValue: "string",
            name: "string",
            required: "boolean",
            type: "string",
            version: "number"
          }
        ],
        type: "string",
        version: "number"
      }
    },
    {
      id: "POST /jobExecution/jobs",
      method: "POST",
      path: "/jobExecution/jobs",
      steps: ["jobs/execute"],
      statuses: [201],
      queries: ["_action"],
      request: {
        queries: ["_action"],
        body: {
          arguments: {
            _DEBUG: "string",
            _OMITJSONLISTING: "string",
            _OMITJSONLOG: "string",
            _OMITTEXTLISTING: "string",
            _OMITTEXTLOG: "string",
            _contextName: "string",
            _omitSessionResults: "string",
            _program: "string",
            _webin_file_count: "string"
          },
          description: "string",
          jobDefinition: {
            code: "string",
            createdBy: "string",
            creationTimeStamp: "string",
            id: "string",
            links: [
              {
                href: "string",
                method: "string",
                rel: "string",
                type: "string",
                uri: "string"
              }
            ],
            modifiedBy: "string",
            modifiedTimeStamp: "string",
            name: "string",
            parameters: [
              {
                defaultValue: "string",
                name: "string",
                required: "boolean",
                type: "string",
                version: "number"
              }
            ],
            type: "string",
            version: "number"
          },
          name: "string"
        }
      },
      shape: {
        createdBy: "string",
        creationTimeStamp: "string",
        elapsedTime: "number",
        heartbeatInterval: "number",
        heartbeatTimeStamp: "string",
        id: "string",
        jobRequest: {
          arguments: {
            _DEBUG: "string",
            _OMITJSONLISTING: "string",
            _OMITJSONLOG: "string",
            _OMITTEXTLISTING: "string",
            _OMITTEXTLOG: "string",
            _addjesbeginendmacros: "string",
            _contextName: "string",
            _omitSessionResults: "string",
            _program: "string",
            _webin_file_count: "string"
          },
          createdByApplication: "string",
          description: "string",
          jobDefinition: {
            code: "string",
            createdBy: "string",
            creationTimeStamp: "string",
            id: "string",
            links: ["object"],
            modifiedBy: "string",
            modifiedTimeStamp: "string",
            name: "string",
            parameters: ["object"],
            type: "string",
            version: "number"
          },
          name: "string",
          properties: "array",
          version: "number"
        },
        links: [
          {
            href: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        modifiedBy: "string",
        modifiedTimeStamp: "string",
        results: {},
        state: "string",
        submittedByApplication: "string",
        version: "number"
      }
    },
    {
      id: "GET /jobExecution/jobs/{}",
      method: "GET",
      path: "/jobExecution/jobs/{}",
      steps: ["jobs/execute"],
      statuses: [200],
      queries: [],
      request: {
        queries: [],
        body: void 0
      },
      shape: {
        createdBy: "string",
        creationTimeStamp: "string",
        elapsedTime: "number",
        endTimeStamp: "string",
        heartbeatInterval: "number",
        heartbeatTimeStamp: "string",
        id: "string",
        jobRequest: {
          arguments: {
            _DEBUG: "string",
            _OMITJSONLISTING: "string",
            _OMITJSONLOG: "string",
            _OMITTEXTLISTING: "string",
            _OMITTEXTLOG: "string",
            _addjesbeginendmacros: "string",
            _contextName: "string",
            _omitSessionResults: "string",
            _program: "string",
            _webin_file_count: "string"
          },
          createdByApplication: "string",
          description: "string",
          jobDefinition: {
            code: "string",
            createdBy: "string",
            creationTimeStamp: "string",
            id: "string",
            links: ["object"],
            modifiedBy: "string",
            modifiedTimeStamp: "string",
            name: "string",
            parameters: ["object"],
            type: "string",
            version: "number"
          },
          name: "string",
          properties: "array",
          version: "number"
        },
        links: [
          {
            href: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        logLocation: "string",
        modifiedBy: "string",
        modifiedTimeStamp: "string",
        results: {
          COMPUTE_CONTEXT: "string",
          COMPUTE_JOB: "string",
          COMPUTE_SESSION: "string",
          "{}.log": "string",
          "{}.log.txt": "string"
        },
        state: "string",
        submittedByApplication: "string",
        version: "number"
      }
    },
    {
      id: "GET /jobExecution/jobs/{}/state",
      method: "GET",
      path: "/jobExecution/jobs/{}/state",
      steps: ["jobs/execute"],
      statuses: [200],
      queries: ["_action", "wait"],
      request: {
        queries: ["_action", "wait"],
        body: void 0
      },
      shape: void 0
    },
    {
      id: "GET /launcher/contexts",
      method: "GET",
      path: "/launcher/contexts",
      steps: ["compute/launcher-contexts"],
      statuses: [200],
      queries: ["limit"],
      request: {
        queries: ["limit"],
        body: void 0
      },
      shape: {
        accept: "string",
        count: "number",
        items: [
          {
            createdBy: "string",
            creationTimeStamp: "string",
            description: "string",
            id: "string",
            links: [
              {
                href: "string",
                method: "string",
                rel: "string",
                type: "string",
                uri: "string"
              }
            ],
            modifiedBy: "string",
            modifiedTimeStamp: "string",
            name: "string",
            type: "string",
            version: "number"
          }
        ],
        limit: "number",
        links: [
          {
            href: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        name: "string",
        start: "number",
        version: "number"
      }
    },
    {
      id: "POST /SASLogon/oauth/token",
      method: "POST",
      path: "/SASLogon/oauth/token",
      steps: ["auth/token-refresh", "auth/token-refresh-refused"],
      statuses: [200, 401],
      queries: [],
      request: {
        queries: [],
        body: {
          multipart: ["grant_type", "refresh_token"]
        }
      },
      shape: {
        access_token: "string",
        expires_in: "number",
        id_token: "string",
        jti: "string",
        refresh_expires_in: "number",
        refresh_revocable: "boolean",
        refresh_token: "string",
        revocable: "boolean",
        scope: "string",
        token_type: "string"
      }
    },
    {
      id: "GET /types/types",
      method: "GET",
      path: "/types/types",
      steps: ["files/create"],
      statuses: [200],
      queries: ["limit"],
      request: {
        queries: ["limit"],
        body: void 0
      },
      shape: {
        accept: "string",
        count: "number",
        items: [
          {
            description: "string",
            iconUri: "string",
            label: "string",
            links: [
              {
                href: "string",
                method: "string",
                rel: "string",
                type: "string",
                uri: "string"
              }
            ],
            mediaType: "string",
            name: "string",
            resourceUri: "string",
            tags: ["string"],
            version: "number"
          }
        ],
        limit: "number",
        links: [
          {
            href: "string",
            itemType: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        name: "string",
        start: "number",
        version: "number"
      }
    }
  ];

  // src/viya/unrecorded.ts
  var UNRECORDED = [
    // The recorder hands the adapter a token it obtained itself, so the calls that
    // obtain one never pass through the proxy. The capture tool records them as a
    // separate pass, which needs a client id and secret.
    {
      path: "/SASLogon",
      reason: "no capture: the pass authenticates outside the adapter, so the login root is never requested through the client"
    },
    {
      path: "/SASLogon/authorize",
      reason: "no capture: this is the CLI's sign-in against this server's own auth route, which a Viya estate does not serve"
    },
    {
      path: "/SASLogon/login",
      reason: "no capture: an interactive login; the pass presents a token instead of a form"
    },
    {
      path: "/SASLogon/login.do",
      reason: "no capture: an interactive login; the pass presents a token instead of a form"
    },
    {
      path: "/SASLogon/logout",
      reason: "no capture: the pass never signs out, because a capture run must leave the estate as it found it"
    },
    {
      path: "/SASLogon/logout.do",
      reason: "no capture: the pass never signs out, because a capture run must leave the estate as it found it"
    },
    {
      path: "/SASLogon/oauth/authorize",
      reason: "no capture: the authorisation-code step needs a browser; the pass uses the password grant"
    }
  ];

  // src/viya/version.ts
  var VIYA_TARGET_VERSION = "V.04.00M0P100526";
  var VIYA_CAPTURED_AT = "2026-11-12";
  var EMULATED_HEADER = "x-sasjs-emulated";
  var EMULATED_HEADER_VALUE = `viya@${VIYA_TARGET_VERSION}`;
  var emulatedHeaders = () => ({
    [EMULATED_HEADER]: EMULATED_HEADER_VALUE,
    "Access-Control-Expose-Headers": EMULATED_HEADER
  });

  // src/viya/declared.ts
  var DECLARED = [
    {
      id: "GET /compute/sessions/{}/filerefs/_webout/content",
      method: "GET",
      path: "/compute/sessions/{}/filerefs/_webout/content",
      steps: [],
      // what this emulator answers, not what an estate did: 200 with the webout,
      // 404 when no program has run in the session
      statuses: [200, 404],
      queries: [],
      request: { queries: [], body: void 0 },
      // the body is the program's `_webout`, which is whatever the program wrote:
      // there is no JSON shape to record
      shape: void 0,
      declared: "The adapter fetches this only when a run expects a webout (`expectWebout`), and the recording pass submits a `%put` and reads the log instead. Without it an application cannot receive the data its service returns, so the emulator answers it from the job it just ran."
    }
  ];
  var VIYA_OPERATIONS = [...VIYA_TABLE, ...DECLARED];

  // src/viya/overlay.ts
  var NEEDS_AUTH = "The token endpoint is answered by the host that mounts the emulator, which owns the token port.";
  var NEEDS_JOBS = "The emulator answers the compute and content families; the job definitions a deploy creates and the executions a run submits are not modelled yet.";
  var VIYA_OVERLAY = {
    // answered here
    "POST /folders/folders": { implemented: true },
    "GET /folders/folders/{}": { implemented: true },
    "PATCH /folders/folders/{}": { implemented: true },
    "GET /folders/folders/{}/members": { implemented: true },
    "GET /folders/folders/@item": { implemented: true },
    "GET /folders/folders/@myRecycleBin": { implemented: true },
    "GET /identities/users/@currentUser": { implemented: true },
    "GET /types/types": { implemented: true },
    // answered here: compute
    "GET /compute/contexts": { implemented: true },
    "POST /compute/contexts/{}/sessions": { implemented: true },
    "DELETE /compute/sessions/{}": { implemented: true },
    "POST /compute/sessions/{}/jobs": { implemented: true },
    "GET /compute/sessions/{}/jobs/{}": { implemented: true },
    "GET /compute/sessions/{}/jobs/{}/log/content": { implemented: true },
    "GET /compute/sessions/{}/jobs/{}/state": { implemented: true },
    "GET /compute/sessions/{}/state": { implemented: true },
    // answered here: files
    "POST /files/files": { implemented: true },
    "GET /files/files/{}": { implemented: true },
    "PATCH /files/files/{}": { implemented: true },
    "GET /files/files/{}/content": { implemented: true },
    "PUT /files/files/{}/content": { implemented: true },
    // declined: the job family needs a job service
    //
    // A capture describes what the estate answers on the deploy-and-run path, and
    // the emulator does not answer that path yet: a client that deploys a service
    // pack against an emulated estate stops here, with a reason rather than a 404.
    "POST /jobDefinitions/definitions": {
      implemented: false,
      reason: NEEDS_JOBS
    },
    "GET /jobDefinitions/definitions/{}": {
      implemented: false,
      reason: NEEDS_JOBS
    },
    "POST /jobExecution/jobs": { implemented: false, reason: NEEDS_JOBS },
    "GET /jobExecution/jobs/{}": { implemented: false, reason: NEEDS_JOBS },
    "GET /jobExecution/jobs/{}/state": { implemented: false, reason: NEEDS_JOBS },
    // declined: contexts come from the seed, not from the launcher
    "GET /launcher/contexts": {
      implemented: false,
      reason: "The emulator answers compute contexts from its seed; the launcher list a client falls back to is not modelled, and nothing on the emulated path asks for it."
    },
    // declined: session variables are not modelled
    "GET /compute/sessions/{}/variables/{}": {
      implemented: false,
      reason: "The emulator does not model session variables; the client reads these only to log the pid of a job it is about to submit (SYSJOBID), and any name it asks for is refused here rather than answered with a value the emulator did not run."
    },
    // declined: the host owns the token port
    "POST /SASLogon/oauth/token": { implemented: false, reason: NEEDS_AUTH },
    // declared, not captured: the webout an application's service returns
    "GET /compute/sessions/{}/filerefs/_webout/content": { implemented: true }
  };
  var assertOverlayEntries = (overlay, operations = VIYA_OPERATIONS) => {
    const known2 = new Set(operations.map((operation) => operation.id));
    for (const id of Object.keys(overlay))
      if (!known2.has(id))
        throw new Error(
          `src/viya/overlay.ts names an operation the table does not have: ${id}. The table is generated from a capture, so an entry for an operation nobody observed is a claim about a call no client makes.`
        );
    for (const operation of operations)
      if (!(operation.id in overlay))
        throw new Error(
          `src/viya/overlay.ts has no decision for ${operation.id}. Every captured operation states whether this package implements it and, when it does not, the reason it does not: add \`{ implemented: false, reason: '...' }\` until a handler exists.`
        );
  };
  assertOverlayEntries(VIYA_OVERLAY);

  // src/viya/ports.ts
  var requireDrive = (services) => services.drive;

  // src/viya/seed.ts
  var DEFAULT_SEED = "emulated";
  var normaliseServerUrl = (url) => {
    if (!url) return "";
    const trimmed = url.trim();
    if (!trimmed) return "";
    const match = /^(?:([a-z][a-z0-9+.-]*):\/\/)?([^/?#]+)/i.exec(trimmed);
    if (!match) return trimmed.replace(/\/+$/, "").toLowerCase();
    const scheme = (match[1] ?? "http").toLowerCase();
    let authority = match[2].toLowerCase();
    const credentials = authority.lastIndexOf("@");
    if (credentials >= 0) authority = authority.slice(credentials + 1);
    let host = authority;
    let port = "";
    if (authority.startsWith("[")) {
      const close = authority.indexOf("]");
      if (close >= 0) {
        host = authority.slice(0, close + 1);
        if (authority[close + 1] === ":") port = authority.slice(close + 2);
      }
    } else {
      const colon = authority.lastIndexOf(":");
      if (colon >= 0) {
        host = authority.slice(0, colon);
        port = authority.slice(colon + 1);
      }
    }
    const isDefault = scheme === "http" && port === "80" || scheme === "https" && port === "443";
    return `${scheme}://${host}${port && !isDefault ? `:${port}` : ""}`;
  };
  var hash = (input) => {
    let value = 2166136261;
    for (let index = 0; index < input.length; index++) {
      value ^= input.charCodeAt(index);
      value = Math.imul(value, 16777619) >>> 0;
    }
    return value >>> 0;
  };
  var seedOf = (settings = {}) => {
    if (settings.seed !== void 0 && settings.seed !== "")
      return hash(`seed:${settings.seed}`);
    const address = normaliseServerUrl(settings.serverUrl);
    return hash(`url:${address || DEFAULT_SEED}`);
  };
  var generator = (seed) => {
    let state = seed >>> 0;
    return () => {
      state = state + 1831565813 >>> 0;
      let value = state;
      value = Math.imul(value ^ value >>> 15, value | 1);
      value ^= value + Math.imul(value ^ value >>> 7, value | 61);
      return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
  };
  var drawInt = (next, bound) => Math.floor(next() * bound);
  var drawFrom = (next, values) => values[drawInt(next, values.length)];

  // src/viya/sessions.ts
  var logFor = (seed, program) => {
    const code = Array.isArray(program) ? program.join("\n") : program;
    const next = generator(seed ^ hash(`code:${code}`));
    const rows = drawInt(next, 900) + 100;
    const seconds = (drawInt(next, 90) + 10) / 100;
    const lines = code.split("\n").map((line, index) => `${String(index + 1).padStart(3, " ")}    ${line}`);
    return [
      "NOTE: Emulated compute engine - this log is generated, not produced by SAS.",
      "NOTE:  No library was touched: the emulated engine has none.",
      ...lines,
      `NOTE: The data set WORK.EMULATED has ${rows} observations and 3 variables.`,
      `NOTE:  DATA statement used (Total process time):`,
      `NOTE:      real time           ${seconds.toFixed(2)} seconds`,
      `NOTE:      user cpu time       ${(seconds / 2).toFixed(2)} seconds`,
      `NOTE:  ${drawFrom(next, ["The emulated run completed.", "Emulation complete - no SAS was executed."])}`
    ];
  };
  var EmulatedEstate = class {
    constructor(seed) {
      this.seed = seed;
      this.sessions = /* @__PURE__ */ new Map();
      this.created = 0;
    }
    /** A new session: deterministic id, no jobs. */
    create() {
      const session = {
        id: `emulated-${this.seed.toString(16)}-ses${String(this.created++).padStart(4, "0")}`,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        jobs: /* @__PURE__ */ new Map(),
        submitted: 0
      };
      this.sessions.set(session.id, session);
      return session;
    }
    session(id) {
      return this.sessions.get(id);
    }
    remove(id) {
      return this.sessions.delete(id);
    }
    /** A job accepted into a session, with the log the emulator generated for it. */
    submit(session, job) {
      const id = `${session.id}-job${String(session.submitted++).padStart(4, "0")}`;
      const code = job.code ?? "";
      const submitted = {
        id,
        name: job.name ?? id,
        // the log is a function of the seed and the program alone, so the same
        // program answers the same lines whatever session it was submitted in
        log: logFor(this.seed, code),
        state: "running",
        // the real clock, unlike a folder's: a client computes a session's age
        // from this stamp and expires it, so a fixed instant in the past is a
        // session that is born expired
        creationTimeStamp: (/* @__PURE__ */ new Date()).toISOString(),
        // no completion stamp here: a job is finished when something finished it,
        // and the handler that knows whether anything will run sets both
        sessionId: session.id
      };
      session.jobs.set(id, submitted);
      return submitted;
    }
  };
  var estates = /* @__PURE__ */ new Map();
  var estateFor = (seed) => {
    const existing = estates.get(seed);
    if (existing) return existing;
    const estate = new EmulatedEstate(seed);
    estates.set(seed, estate);
    return estate;
  };

  // src/viya/ids.ts
  var EMULATED_NOW = "2026-01-01T00:00:00.000Z";
  var EMULATED_USER = { id: "emulated-user", name: "Emulated User" };
  var idFor = (path, kind = "folder") => {
    const hash2 = (input, seed) => {
      let value = seed;
      for (let index = 0; index < input.length; index++) {
        value ^= input.charCodeAt(index);
        value = Math.imul(value, 16777619) >>> 0;
      }
      return value.toString(16).padStart(8, "0");
    };
    const raw = hash2(`${kind}:${path}`, 2166136261) + hash2(`${kind}:${path}`, 2246822519) + hash2(`${kind}:${path}`, 3266489917) + hash2(`${kind}:${path}`, 668265263);
    const hex = raw.slice(0, 32);
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      `4${hex.slice(13, 16)}`,
      `a${hex.slice(17, 20)}`,
      hex.slice(20, 32)
    ].join("-");
  };
  var normalisePath = (path) => {
    const collapsed = `/${path}`.replace(/\/{2,}/g, "/");
    return collapsed.length > 1 ? collapsed.replace(/\/+$/, "") : collapsed;
  };

  // src/viya/compute.ts
  var DEFAULT_CONTEXT_NAME = "SAS Job Execution compute context";
  var EMULATED_CONTEXT_ID = idFor("emulated-context", "context");
  var relLinks = (type, rels) => rels.map(([rel, href]) => ({ href, uri: href, rel, method: "GET", type }));
  var linksFor = (uri, type, collection = false, itemType = false) => [
    // the collection link comes first, because that is the order the capture
    // recorded and the item shape assertion walks the first element
    ...collection ? [
      {
        href: `${uri}/members`,
        uri: `${uri}/members`,
        rel: "members",
        method: "GET",
        type,
        itemType: type
      }
    ] : [],
    {
      href: uri,
      uri,
      rel: "self",
      method: "GET",
      type,
      // the log's capture records itemType on its first link, so it is stamped
      // there rather than invented as a members link the estate does not have
      ...itemType ? { itemType: type } : {}
    }
  ];
  var estateOf = (services) => estateFor(seedOf(services.viya));
  var contextNameFrom = (filter) => {
    if (!filter) return DEFAULT_CONTEXT_NAME;
    const match = /name\s*,\s*'([^']*)'|name\s*,\s*"([^"]*)"/i.exec(filter);
    return match?.[1] ?? match?.[2] ?? DEFAULT_CONTEXT_NAME;
  };
  var contextBody = (name) => ({
    id: EMULATED_CONTEXT_ID,
    name,
    createdBy: EMULATED_USER.id,
    version: 2,
    links: linksFor(
      `/compute/contexts/${EMULATED_CONTEXT_ID}`,
      "application/vnd.sas.compute.context"
    )
  });
  var sessionBody = (services, session, autoExecLines) => {
    const { id } = session;
    const uri = `/compute/sessions/${id}`;
    return {
      id,
      applicationName: "emulated",
      owner: EMULATED_USER.id,
      serverId: idFor(
        normaliseServerUrl(services.viya?.serverUrl) || "emulated",
        "server"
      ),
      state: "idle",
      attributes: {
        homeDirectory: "/tmp/emulated",
        sessionInactiveTimeout: 3600
      },
      environment: { autoExecLines },
      // the real clock: the adapter computes a session's age from this stamp and
      // expires it against sessionInactiveTimeout
      creationTimeStamp: session.createdAt,
      serviceAPIVersion: 1,
      sessionConditionCode: 0,
      stateElapsedTime: 0,
      version: 2,
      links: relLinks("application/vnd.sas.compute.session", [
        ["self", uri],
        ["state", `${uri}/state`],
        ["log", `${uri}/log`],
        ["jobs", `${uri}/jobs`]
      ])
    };
  };
  var jobBody = (job) => {
    const uri = `/compute/sessions/${job.sessionId}/jobs/${job.id}`;
    return {
      id: job.id,
      name: job.name,
      sessionId: job.sessionId,
      state: job.state,
      creationTimeStamp: job.creationTimeStamp,
      ...job.completedTimeStamp ? { completedTimeStamp: job.completedTimeStamp } : {},
      jobConditionCode: 0,
      stateElapsedTime: 1,
      listingStatistics: {
        lineCount: job.log.length,
        modifiedTimeStamp: job.completedTimeStamp ?? job.creationTimeStamp
      },
      logStatistics: {
        lineCount: job.log.length,
        modifiedTimeStamp: job.completedTimeStamp ?? job.creationTimeStamp
      },
      statistics: { systemCpuTime: 0.01, userCpuTime: 0.02 },
      version: 2,
      links: relLinks("application/vnd.sas.compute.job", [
        ["self", uri],
        ["state", `${uri}/state`],
        ["log", `${uri}/log`],
        ["up", `/compute/sessions/${job.sessionId}`]
      ])
    };
  };
  var sessionOf = (services, id) => {
    const session = estateOf(services).session(id);
    if (!session)
      throw new ApiError(404, `Session with ID '${id}' was not found.`);
    return session;
  };
  var jobOf = (services, sessionId, jobId) => {
    const job = sessionOf(services, sessionId).jobs.get(jobId);
    if (!job) throw new ApiError(404, `Job with ID '${jobId}' was not found.`);
    return job;
  };
  var segmentsOf = (params) => params.segments;
  var COMPUTE_HANDLERS = {
    "GET /compute/contexts": async ({ request }) => {
      const limit = Number(request.query?.limit ?? 0) || 0;
      return {
        status: 200,
        body: {
          accept: "application/json",
          name: "contexts",
          start: 0,
          limit,
          count: 1,
          version: 2,
          items: [contextBody(contextNameFrom(request.query?.filter))],
          links: linksFor(
            "/compute/contexts",
            "application/vnd.sas.compute.context",
            true
          )
        }
      };
    },
    "POST /compute/contexts/{}/sessions": async ({
      services,
      params,
      request
    }) => {
      if (params.id !== EMULATED_CONTEXT_ID)
        throw new ApiError(404, `Context with ID '${params.id}' was not found.`);
      const body = request.body ?? {};
      const session = estateOf(services).create();
      return {
        status: 201,
        body: sessionBody(
          services,
          session,
          body.environment?.autoExecLines ?? []
        )
      };
    },
    "GET /compute/sessions/{}/state": async ({ services, params }) => {
      sessionOf(services, params.id);
      return { status: 200, body: "idle" };
    },
    "DELETE /compute/sessions/{}": async ({ services, params }) => {
      sessionOf(services, params.id);
      estateOf(services).remove(params.id);
      return { status: 204, body: void 0 };
    },
    "POST /compute/sessions/{}/jobs": async ({ services, params, request }) => {
      const session = sessionOf(services, params.id);
      const body = request.body ?? {};
      const job = estateOf(services).submit(session, body);
      const execute = services.viya?.execute;
      if (!execute) {
        job.state = "completed";
        job.completedTimeStamp = (/* @__PURE__ */ new Date()).toISOString();
        return { status: 201, body: jobBody(job) };
      }
      job.state = "running";
      job.log = [];
      void execute({
        program: body.code ?? "",
        variables: body.variables,
        name: body.name,
        sessionId: session.id
      }).then((ran) => {
        job.log = ran.log.split("\n");
        job.state = ran.state ?? "completed";
        if (ran.webout !== void 0) job.webout = ran.webout;
        job.completedTimeStamp = (/* @__PURE__ */ new Date()).toISOString();
      }).catch((error) => {
        job.state = "failed";
        job.log = [`ERROR: ${error.message}`];
        job.completedTimeStamp = (/* @__PURE__ */ new Date()).toISOString();
      });
      return { status: 201, body: jobBody(job) };
    },
    "GET /compute/sessions/{}/filerefs/_webout/content": async ({
      services,
      params
    }) => {
      const session = sessionOf(services, params.id);
      const last = [...session.jobs.values()].pop();
      if (!last)
        throw new ApiError(
          404,
          "This session has no `_webout` yet: nothing has run in it."
        );
      if (last.webout === void 0)
        throw new ApiError(
          404,
          last.state === "running" ? `This session has no \`_webout\` yet: job '${last.id}' has not finished.` : services.viya?.execute ? `This session has no \`_webout\`: job '${last.id}' ran and produced none.` : `This session has no \`_webout\`: the host supplied no engine, so no program has run.`
        );
      return {
        status: 200,
        contents: last.webout,
        headers: { "content-type": "text/plain" }
      };
    },
    "GET /compute/sessions/{}/jobs/{}": async ({ services, params }) => {
      const [sessionId, jobId] = segmentsOf(params);
      return { status: 200, body: jobBody(jobOf(services, sessionId, jobId)) };
    },
    "GET /compute/sessions/{}/jobs/{}/state": async ({ services, params }) => {
      const [sessionId, jobId] = segmentsOf(params);
      return {
        status: 200,
        body: jobOf(services, sessionId, jobId).state
      };
    },
    "GET /compute/sessions/{}/jobs/{}/log/content": async ({
      services,
      params,
      request
    }) => {
      const [sessionId, jobId] = segmentsOf(params);
      const job = jobOf(services, sessionId, jobId);
      const start = Number(request.query?.start ?? 0) || 0;
      const limit = Number(request.query?.limit ?? 0) || 0;
      const lines = job.log.slice(start, limit ? start + limit : void 0);
      return {
        status: 200,
        body: {
          accept: "application/json",
          name: "content",
          start,
          limit: limit || lines.length,
          count: job.log.length,
          version: 2,
          items: lines.map((line) => ({ line, type: "NOTE", version: 2 })),
          links: linksFor(
            `/compute/sessions/${job.sessionId}/jobs/${job.id}/log`,
            "application/vnd.sas.compute.job.log",
            false,
            true
          )
        }
      };
    }
  };

  // src/viya/files.ts
  var contentTypeOf = (name) => {
    if (/\.sas$/i.test(name)) return "text/plain";
    if (/\.(json)$/i.test(name)) return "application/json";
    if (/\.(csv|txt|log)$/i.test(name)) return "text/plain";
    if (/\.(html?)$/i.test(name)) return "text/html";
    if (/\.(png)$/i.test(name)) return "image/png";
    if (/\.(jpe?g)$/i.test(name)) return "image/jpeg";
    return "application/octet-stream";
  };
  var fileBody = (file) => {
    const id = idFor(file.path, "file");
    const uri = `/files/files/${id}`;
    const contentType = contentTypeOf(file.name);
    return {
      id,
      name: file.name,
      contentType,
      contentDisposition: `attachment; filename="${file.name}"`,
      encoding: "UTF-8",
      size: file.size,
      fileStatus: "complete",
      fileVersion: 1,
      version: 2,
      typeDefName: "file",
      createdBy: EMULATED_USER.id,
      modifiedBy: EMULATED_USER.id,
      creationTimeStamp: EMULATED_NOW,
      modifiedTimeStamp: EMULATED_NOW,
      quarantine: false,
      searchable: true,
      virusDetected: false,
      urlDetected: false,
      properties: {
        "content.download": "true",
        "content.openInBrowser": "true",
        "content.preview": "false",
        sasIconKey: "file",
        typeRegistrant: EMULATED_USER.id
      },
      links: [
        {
          href: uri,
          uri,
          rel: "self",
          method: "GET",
          type: "application/vnd.sas.file"
        },
        {
          href: `${uri}/content`,
          uri: `${uri}/content`,
          rel: "content",
          method: "GET",
          type: "application/vnd.sas.file.content"
        }
      ]
    };
  };
  var utf8Length2 = (text2) => {
    let bytes3 = 0;
    for (const character of text2) {
      const point = character.codePointAt(0);
      bytes3 += point < 128 ? 1 : point < 2048 ? 2 : point < 65536 ? 3 : 4;
    }
    return bytes3;
  };
  var sizeOf = (contents) => typeof contents === "string" ? utf8Length2(contents) : contents.byteLength;
  var filesIn = async (drive) => {
    const walk2 = (node, found) => {
      if (!node.isFolder)
        found.push({ name: node.name, path: node.relativePath, size: 0 });
      for (const child of node.children) walk2(child, found);
      return found;
    };
    return walk2((await drive.tree("/")).tree, []);
  };
  var pathForFileId = async (drive, id) => {
    const file = (await filesIn(drive)).find(
      (candidate) => idFor(candidate.path, "file") === id
    );
    if (!file) throw new ApiError(404, `File with ID '${id}' was not found.`);
    return file.path;
  };
  var bodyOf = async (drive, path) => {
    const read = await drive.read(path);
    return {
      name: path.split("/").pop(),
      path,
      size: sizeOf(read.contents)
    };
  };
  var parentOf = async (drive, uri) => {
    if (!uri) return "/";
    const id = uri.split("/").pop();
    const tree = await drive.tree("/");
    const walk2 = (node) => {
      if (node.isFolder && idFor(node.relativePath, "folder") === id)
        return node.relativePath;
      for (const child of node.children) {
        const hit = walk2(child);
        if (hit !== void 0) return hit;
      }
      return void 0;
    };
    const found = walk2(tree.tree);
    if (found === void 0)
      throw new ApiError(404, `Folder with ID '${id}' was not found.`);
    return found;
  };
  var FILE_HANDLERS = {
    "POST /files/files": async ({ services, request }) => {
      const drive = requireDrive(services);
      const upload = request.file;
      if (!upload?.name)
        throw new ApiError(400, "A file named `file` is required.");
      const parent = await parentOf(drive, request.query?.parentFolderUri);
      const path = `${parent}/${upload.name}`.replace(/\/{2,}/g, "/");
      await drive.save(path, upload.contents);
      return { status: 201, body: fileBody(await bodyOf(drive, path)) };
    },
    "GET /files/files/{}": async ({ services, params }) => {
      const drive = requireDrive(services);
      const path = await pathForFileId(drive, params.id);
      return { status: 200, body: fileBody(await bodyOf(drive, path)) };
    },
    "PATCH /files/files/{}": async ({ services, params, request }) => {
      const drive = requireDrive(services);
      const path = await pathForFileId(drive, params.id);
      const body = request.body ?? {};
      const name = body.name ?? path.split("/").pop();
      const target = `${path.split("/").slice(0, -1).join("/")}/${name}`.replace(
        /\/{2,}/g,
        "/"
      );
      if (target !== path) await drive.rename(path, target);
      return { status: 200, body: fileBody(await bodyOf(drive, target)) };
    },
    "GET /files/files/{}/content": async ({ services, params }) => {
      const drive = requireDrive(services);
      const path = await pathForFileId(drive, params.id);
      const read = await drive.read(path);
      return {
        status: 200,
        contents: read.contents,
        headers: {
          "content-type": contentTypeOf(path.split("/").pop())
        }
      };
    },
    "PUT /files/files/{}/content": async ({ services, params, request }) => {
      const drive = requireDrive(services);
      const path = await pathForFileId(drive, params.id);
      const body = request.body;
      const contents = request.contents ?? request.file?.contents ?? (typeof body === "string" || body instanceof Uint8Array ? body : body?.contents);
      if (contents === void 0 || contents === null)
        throw new ApiError(400, "File content is required.");
      await drive.update(path, contents);
      return { status: 200, body: fileBody(await bodyOf(drive, path)) };
    }
  };

  // src/viya/service.ts
  var linksFor2 = (uri, collection = false) => {
    const self = {
      href: uri,
      uri,
      rel: "self",
      method: "GET",
      type: "application/vnd.sas.folder"
    };
    const members = {
      href: `${uri}/members`,
      uri: `${uri}/members`,
      rel: "members",
      method: "GET",
      type: "application/vnd.sas.collection",
      itemType: "folder"
    };
    return collection ? [members, self] : [self, members];
  };
  var folderBody = async (drive, path) => {
    const listing = await drive.list(path);
    const id = idFor(path);
    const name = path.split("/").filter(Boolean).pop() ?? "";
    const parent = path.split("/").slice(0, -1).join("/") || "/";
    return {
      id,
      name,
      description: "",
      type: "folder",
      version: 1,
      createdBy: EMULATED_USER.id,
      modifiedBy: EMULATED_USER.id,
      creationTimeStamp: EMULATED_NOW,
      modifiedTimeStamp: EMULATED_NOW,
      memberCount: listing.files.length + listing.folders.length,
      parentFolderUri: `/folders/folders/${idFor(parent)}`,
      links: linksFor2(`/folders/folders/${id}`)
    };
  };
  var recycleBin = () => {
    const path = "@myRecycleBin";
    const id = idFor(path);
    return {
      id,
      name: "Recycle Bin",
      description: "Recycle Bin",
      type: "trashFolder",
      version: 1,
      createdBy: EMULATED_USER.id,
      modifiedBy: EMULATED_USER.id,
      creationTimeStamp: EMULATED_NOW,
      modifiedTimeStamp: EMULATED_NOW,
      memberCount: 0,
      parentFolderUri: "",
      properties: { allowMove: "false" },
      links: linksFor2(`/folders/folders/${id}`)
    };
  };
  var pathFromQuery = (request) => {
    const path = request.query?.path;
    if (!path) throw new ApiError(400, "The path parameter is required.");
    return normalisePath(path);
  };
  var RECYCLE_BIN_ALIAS = "/folders/folders/@myRecycleBin";
  var isRecycleBin = (uri) => !!uri && (uri === RECYCLE_BIN_ALIAS || uri.endsWith(`/${idFor("@myRecycleBin")}`));
  var pathForId = async (drive, id) => {
    const walk2 = (node) => {
      if (node.isFolder && idFor(node.relativePath) === id)
        return node.relativePath;
      for (const child of node.children) {
        const hit = walk2(child);
        if (hit) return hit;
      }
      return void 0;
    };
    const { tree } = await drive.tree("/");
    const path = walk2(tree);
    if (!path)
      throw new ApiError(
        404,
        `No folder matches the id ${id}. Ids are derived from paths, so an id that names no folder is one no folder ever had.`
      );
    return path;
  };
  var VIYA_HANDLERS = {
    "GET /identities/users/@currentUser": async ({ services, request }) => {
      const subject = request.subject ?? await services.identity?.authenticate(request.token);
      const id = subject?.userId ?? EMULATED_USER.id;
      return {
        status: 200,
        body: {
          id,
          name: subject?.userId ?? EMULATED_USER.name,
          providerId: "sas",
          state: "active",
          version: 1,
          addresses: [],
          emailAddresses: [],
          links: [
            {
              href: `/identities/users/${id}`,
              uri: `/identities/users/${id}`,
              rel: "self",
              method: "GET",
              type: "application/vnd.sas.identity.user"
            }
          ]
        }
      };
    },
    "GET /types/types": async () => ({
      status: 200,
      body: {
        count: 1,
        items: [
          {
            name: "file",
            type: "typeDef",
            version: 1,
            links: [{ href: "/types/types/file", rel: "self", method: "GET" }]
          }
        ]
      }
    }),
    "GET /folders/folders/@item": async ({ services, request }) => ({
      status: 200,
      body: await folderBody(requireDrive(services), pathFromQuery(request))
    }),
    "GET /folders/folders/@myRecycleBin": async () => ({
      status: 200,
      body: recycleBin()
    }),
    "GET /folders/folders/{}": async ({ services, params }) => {
      if (params.id === idFor("@myRecycleBin"))
        return { status: 200, body: recycleBin() };
      const drive = requireDrive(services);
      return {
        status: 200,
        body: await folderBody(drive, await pathForId(drive, params.id))
      };
    },
    "GET /folders/folders/{}/members": async ({ services, params, request }) => {
      const drive = requireDrive(services);
      const limit = Number(request.query?.limit ?? 0) || 0;
      if (params.id === idFor("@myRecycleBin"))
        return {
          status: 200,
          body: {
            accept: "application/json",
            name: "members",
            start: 0,
            // the query value is echoed as the sibling branch echoes it: a caller
            // that asked for five and is told zero cannot tell what happened
            limit,
            count: 0,
            version: 2,
            items: [],
            links: linksFor2(`/folders/folders/${idFor("@myRecycleBin")}`, true)
          }
        };
      const path = await pathForId(drive, params.id);
      const listing = await drive.list(path);
      const items = [
        ...listing.folders.map((name) => ({
          id: idFor(`${path}/${name}`.replace(/\/{2,}/g, "/")),
          name,
          type: "folder",
          version: 1,
          createdBy: EMULATED_USER.id,
          modifiedBy: EMULATED_USER.id,
          creationTimeStamp: EMULATED_NOW,
          modifiedTimeStamp: EMULATED_NOW,
          parentFolderUri: `/folders/folders/${idFor(path)}`,
          uri: `/folders/folders/${idFor(`${path}/${name}`.replace(/\/{2,}/g, "/"))}`,
          links: linksFor2(
            `/folders/folders/${idFor(`${path}/${name}`.replace(/\/{2,}/g, "/"))}`
          )
        })),
        ...listing.files.map((name) => ({
          id: idFor(`${path}/${name}`.replace(/\/{2,}/g, "/"), "file"),
          name,
          type: "file",
          version: 1,
          contentType: "text/plain",
          createdBy: EMULATED_USER.id,
          modifiedBy: EMULATED_USER.id,
          creationTimeStamp: EMULATED_NOW,
          modifiedTimeStamp: EMULATED_NOW,
          parentFolderUri: `/folders/folders/${idFor(path)}`,
          added: EMULATED_NOW,
          uri: `/files/files/${idFor(`${path}/${name}`.replace(/\/{2,}/g, "/"), "file")}`,
          links: linksFor2(
            `/files/files/${idFor(`${path}/${name}`.replace(/\/{2,}/g, "/"), "file")}`
          )
        }))
      ];
      const page = limit > 0 ? items.slice(0, limit) : items;
      return {
        status: 200,
        body: {
          accept: "application/json",
          name: "members",
          start: 0,
          limit: limit || page.length,
          count: page.length,
          version: 2,
          items: page,
          links: linksFor2(`/folders/folders/${idFor(path)}`, true)
        }
      };
    },
    "POST /folders/folders": async ({ services, request }) => {
      const drive = requireDrive(services);
      const body = request.body ?? {};
      if (!body.name) throw new ApiError(400, "A folder name is required.");
      const parentUri = request.query?.parentFolderUri ?? body.parentFolderUri;
      const parent = parentUri ? await pathForId(drive, String(parentUri).split("/").pop()) : "/";
      const path = normalisePath(`${parent}/${body.name}`);
      await drive.mkdir(path);
      return { status: 201, body: await folderBody(drive, path) };
    },
    "PATCH /folders/folders/{}": async ({ services, request, params }) => {
      const drive = requireDrive(services);
      if (params.id === idFor("@myRecycleBin"))
        throw new ApiError(400, "The recycle bin cannot be moved or renamed.");
      const path = await pathForId(drive, params.id);
      const body = request.body ?? {};
      if (isRecycleBin(body.parentFolderUri)) {
        const removed = await folderBody(drive, path);
        await drive.rmdir(path);
        return {
          status: 200,
          body: { ...removed, parentFolderUri: String(body.parentFolderUri) }
        };
      }
      const name = body.name ?? path.split("/").pop();
      const parent = body.parentFolderUri === void 0 ? path.split("/").slice(0, -1).join("/") || "/" : body.parentFolderUri === "" ? "/" : await pathForId(
        drive,
        body.parentFolderUri.split("/").pop()
      );
      const target = normalisePath(`${parent}/${name}`);
      if (target !== path) await drive.rename(path, target);
      return { status: 200, body: await folderBody(drive, target) };
    },
    ...COMPUTE_HANDLERS,
    ...FILE_HANDLERS
  };

  // src/viya/dispatch.ts
  var escape2 = (segment) => segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  var compiled2 = VIYA_OPERATIONS.filter(
    (operation) => operation.path.includes("{}")
  ).map((operation) => ({
    operation,
    pattern: new RegExp(
      "^" + operation.path.split("/").map((segment) => segment === "{}" ? "([^/]+)" : escape2(segment)).join("/") + "$",
      // the static segments ignore case, as the hosts do
      "i"
    )
  }));
  var exact2 = /* @__PURE__ */ new Map();
  for (const operation of VIYA_OPERATIONS)
    if (!operation.path.includes("{}"))
      exact2.set(`${operation.method} ${operation.path}`.toLowerCase(), operation);
  var findViyaOperation = (method, path) => {
    const verb = method.toUpperCase();
    const clean = path.split("?")[0].replace(/\/+$/, "") || "/";
    const staticHit = exact2.get(`${verb} ${clean}`.toLowerCase());
    if (staticHit) return { operation: staticHit, segments: [] };
    for (const candidate of compiled2) {
      if (candidate.operation.method !== verb) continue;
      const match = candidate.pattern.exec(clean);
      if (match)
        return {
          operation: candidate.operation,
          segments: match.slice(1).map((segment) => {
            try {
              return decodeURIComponent(segment);
            } catch {
              return segment;
            }
          })
        };
    }
    return void 0;
  };
  var dispatchViya = async (services, method, path, request = {}) => {
    const headers = emulatedHeaders();
    const found = findViyaOperation(method, path);
    if (!found)
      return {
        status: 404,
        headers,
        body: {
          version: 2,
          httpStatusCode: 404,
          errorCode: 404,
          message: `No operation is emulated at ${method.toUpperCase()} ${path}. The emulated estate answers the client's call surface and nothing else.`
        }
      };
    const entry = VIYA_OVERLAY[found.operation.id];
    if (!entry)
      return {
        status: 501,
        headers,
        body: { message: `${found.operation.id} has no decision in the overlay.` }
      };
    if (!entry.implemented)
      return {
        status: 501,
        headers,
        body: {
          message: `${found.operation.id} is not emulated. ${entry.reason ?? ""}`.trim()
        }
      };
    const handler = VIYA_HANDLERS[found.operation.id];
    if (!handler)
      return {
        status: 501,
        headers,
        body: {
          message: `${found.operation.id} is marked implemented, but no handler answers it.`
        }
      };
    try {
      const answer = await handler({
        services,
        request,
        params: {
          id: found.segments[0],
          segments: found.segments
        }
      });
      return {
        ...answer,
        // the emulated headers are spread LAST: they are the invariant this module
        // exists to guarantee, so a handler cannot overwrite the stamp even by
        // returning headers of its own
        headers: { ...answer.headers, ...headers }
      };
    } catch (error) {
      if (isApiError(error))
        return {
          status: error.status,
          headers,
          body: error.body ?? {
            version: 2,
            httpStatusCode: error.status,
            errorCode: error.status,
            message: error.message
          }
        };
      return {
        status: 500,
        headers,
        body: {
          version: 2,
          httpStatusCode: 500,
          errorCode: 500,
          message: String(error?.message ?? error)
        }
      };
    }
  };

  // src/corpus/viya/operations.ts
  var VIYA_CORPUS = [
    {
      route: "GET /compute/contexts",
      step: "compute/context-by-name",
      queries: ["filter", "limit"],
      statuses: [200],
      expected: 200,
      shape: {
        accept: "string",
        count: "number",
        items: [
          {
            createdBy: "string",
            id: "string",
            links: [
              {
                href: "string",
                method: "string",
                rel: "string",
                type: "string",
                uri: "string"
              }
            ],
            name: "string",
            version: "number"
          }
        ],
        limit: "number",
        links: [
          {
            href: "string",
            itemType: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        name: "string",
        start: "number",
        version: "number"
      }
    },
    {
      route: "POST /compute/contexts/{}/sessions",
      step: "compute/execute-script",
      queries: [],
      statuses: [201],
      expected: 201,
      shape: {
        applicationName: "string",
        attributes: {
          homeDirectory: "string",
          sessionInactiveTimeout: "number"
        },
        creationTimeStamp: "string",
        environment: {
          autoExecLines: ["string"]
        },
        id: "string",
        links: [
          {
            href: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        owner: "string",
        serverId: "string",
        serviceAPIVersion: "number",
        sessionConditionCode: "number",
        state: "string",
        stateElapsedTime: "number",
        version: "number"
      }
    },
    {
      route: "DELETE /compute/sessions/{}",
      step: "compute/session-delete",
      queries: [],
      statuses: [204],
      expected: 204,
      shape: void 0
    },
    {
      route: "POST /compute/sessions/{}/jobs",
      step: "compute/execute-script",
      queries: [],
      statuses: [201],
      expected: 201,
      shape: {
        creationTimeStamp: "string",
        id: "string",
        links: [
          {
            href: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        sessionId: "string",
        state: "string",
        stateElapsedTime: "number",
        version: "number"
      }
    },
    {
      route: "GET /compute/sessions/{}/jobs/{}",
      step: "compute/execute-script",
      queries: [],
      statuses: [200],
      expected: 200,
      shape: {
        completedTimeStamp: "string",
        creationTimeStamp: "string",
        id: "string",
        jobConditionCode: "number",
        links: [
          {
            href: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        listingStatistics: {
          lineCount: "number",
          modifiedTimeStamp: "string"
        },
        logStatistics: {
          lineCount: "number",
          modifiedTimeStamp: "string"
        },
        sessionId: "string",
        state: "string",
        stateElapsedTime: "number",
        statistics: {
          systemCpuTime: "number",
          userCpuTime: "number"
        },
        version: "number"
      }
    },
    {
      route: "GET /compute/sessions/{}/jobs/{}/log/content",
      step: "compute/execute-script",
      queries: ["limit", "start"],
      statuses: [200],
      expected: 200,
      shape: {
        accept: "string",
        count: "number",
        items: [
          {
            line: "string",
            type: "string",
            version: "number"
          }
        ],
        limit: "number",
        links: [
          {
            href: "string",
            itemType: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        name: "string",
        start: "number",
        version: "number"
      }
    },
    {
      route: "GET /compute/sessions/{}/jobs/{}/state",
      step: "compute/execute-script",
      queries: ["_action", "wait"],
      statuses: [200],
      expected: 200,
      shape: void 0
    },
    {
      route: "GET /compute/sessions/{}/state",
      step: "compute/execute-script",
      queries: ["wait"],
      statuses: [200],
      expected: 200,
      shape: void 0
    },
    {
      route: "GET /compute/sessions/{}/variables/{}",
      step: "compute/execute-script",
      queries: [],
      statuses: [200],
      expected: 200,
      shape: {
        links: [
          {
            href: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        name: "string",
        scope: "string",
        value: "string",
        version: "number"
      }
    },
    {
      route: "POST /files/files",
      step: "files/create",
      queries: ["parentFolderUri", "typeDefName"],
      statuses: [201],
      expected: 201,
      shape: {
        contentDisposition: "string",
        contentType: "string",
        createdBy: "string",
        creationTimeStamp: "string",
        encoding: "string",
        fileStatus: "string",
        fileVersion: "number",
        id: "string",
        links: [
          {
            href: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        modifiedBy: "string",
        modifiedTimeStamp: "string",
        name: "string",
        properties: {},
        quarantine: "boolean",
        searchable: "boolean",
        size: "number",
        typeDefName: "string",
        urlDetected: "boolean",
        version: "number",
        virusDetected: "boolean"
      }
    },
    {
      route: "GET /files/files/{}",
      step: "files/replace",
      queries: [],
      statuses: [200],
      expected: 200,
      shape: {
        contentDisposition: "string",
        contentType: "string",
        createdBy: "string",
        creationTimeStamp: "string",
        encoding: "string",
        fileStatus: "string",
        fileVersion: "number",
        id: "string",
        links: [
          {
            href: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        modifiedBy: "string",
        modifiedTimeStamp: "string",
        name: "string",
        properties: {
          "content.download": "string",
          "content.openInBrowser": "string",
          "content.preview": "string",
          sasIconKey: "string",
          typeRegistrant: "string"
        },
        quarantine: "boolean",
        searchable: "boolean",
        size: "number",
        typeDefName: "string",
        urlDetected: "boolean",
        version: "number",
        virusDetected: "boolean"
      }
    },
    {
      route: "PATCH /files/files/{}",
      step: "files/create",
      queries: [],
      statuses: [200],
      expected: 200,
      shape: {
        contentDisposition: "string",
        contentType: "string",
        createdBy: "string",
        creationTimeStamp: "string",
        encoding: "string",
        fileStatus: "string",
        fileVersion: "number",
        id: "string",
        links: [
          {
            href: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        modifiedBy: "string",
        modifiedTimeStamp: "string",
        name: "string",
        properties: {
          "content.download": "string",
          "content.openInBrowser": "string",
          "content.preview": "string",
          sasIconKey: "string",
          typeRegistrant: "string"
        },
        quarantine: "boolean",
        searchable: "boolean",
        size: "number",
        typeDefName: "string",
        urlDetected: "boolean",
        version: "number",
        virusDetected: "boolean"
      }
    },
    {
      route: "GET /files/files/{}/content",
      step: "files/content",
      queries: [],
      statuses: [200],
      expected: 200,
      shape: void 0
    },
    {
      route: "PUT /files/files/{}/content",
      step: "files/replace",
      queries: [],
      statuses: [200],
      expected: 200,
      shape: {
        contentDisposition: "string",
        contentType: "string",
        createdBy: "string",
        creationTimeStamp: "string",
        encoding: "string",
        fileStatus: "string",
        fileVersion: "number",
        id: "string",
        links: [
          {
            href: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        modifiedBy: "string",
        modifiedTimeStamp: "string",
        name: "string",
        properties: {
          "content.download": "string",
          "content.openInBrowser": "string",
          "content.preview": "string",
          sasIconKey: "string",
          typeRegistrant: "string"
        },
        quarantine: "boolean",
        searchable: "boolean",
        size: "number",
        typeDefName: "string",
        urlDetected: "boolean",
        version: "number",
        virusDetected: "boolean"
      }
    },
    {
      route: "POST /folders/folders",
      step: "folders/create",
      queries: ["parentFolderUri"],
      statuses: [201],
      expected: 201,
      shape: {
        createdBy: "string",
        creationTimeStamp: "string",
        id: "string",
        links: [
          {
            href: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        memberCount: "number",
        modifiedBy: "string",
        modifiedTimeStamp: "string",
        name: "string",
        parentFolderUri: "string",
        type: "string",
        version: "number"
      }
    },
    {
      route: "GET /folders/folders/{}",
      step: "folders/delete",
      queries: [],
      statuses: [200],
      expected: 200,
      shape: {
        createdBy: "string",
        creationTimeStamp: "string",
        description: "string",
        id: "string",
        links: [
          {
            href: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        memberCount: "number",
        modifiedBy: "string",
        modifiedTimeStamp: "string",
        name: "string",
        parentFolderUri: "string",
        properties: {
          allowMove: "string"
        },
        type: "string",
        version: "number"
      }
    },
    {
      route: "PATCH /folders/folders/{}",
      step: "folders/delete",
      queries: [],
      statuses: [200],
      expected: 200,
      shape: {
        createdBy: "string",
        creationTimeStamp: "string",
        id: "string",
        links: [
          {
            href: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        memberCount: "number",
        modifiedBy: "string",
        modifiedTimeStamp: "string",
        name: "string",
        parentFolderUri: "string",
        type: "string",
        version: "number"
      }
    },
    {
      route: "GET /folders/folders/{}/members",
      step: "files/content",
      queries: ["limit"],
      statuses: [200],
      expected: 200,
      shape: {
        accept: "string",
        count: "number",
        items: [
          {
            added: "string",
            contentType: "string",
            createdBy: "string",
            creationTimeStamp: "string",
            id: "string",
            links: [
              {
                href: "string",
                method: "string",
                rel: "string",
                type: "string",
                uri: "string"
              }
            ],
            modifiedBy: "string",
            modifiedTimeStamp: "string",
            name: "string",
            parentFolderUri: "string",
            type: "string",
            uri: "string",
            version: "number"
          }
        ],
        limit: "number",
        links: [
          {
            href: "string",
            itemType: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        name: "string",
        start: "number",
        version: "number"
      }
    },
    {
      route: "GET /folders/folders/@item",
      step: "files/content",
      queries: ["path"],
      statuses: [200, 401, 404],
      expected: 200,
      shape: {
        createdBy: "string",
        creationTimeStamp: "string",
        description: "string",
        id: "string",
        links: [
          {
            href: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        memberCount: "number",
        modifiedBy: "string",
        modifiedTimeStamp: "string",
        name: "string",
        parentFolderUri: "string",
        type: "string",
        version: "number"
      }
    },
    {
      route: "GET /folders/folders/@myRecycleBin",
      step: "folders/delete",
      queries: [],
      statuses: [200],
      expected: 200,
      shape: {
        createdBy: "string",
        creationTimeStamp: "string",
        description: "string",
        id: "string",
        links: [
          {
            href: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        memberCount: "number",
        modifiedBy: "string",
        modifiedTimeStamp: "string",
        name: "string",
        parentFolderUri: "string",
        properties: {
          allowMove: "string"
        },
        type: "string",
        version: "number"
      }
    },
    {
      route: "GET /identities/users/@currentUser",
      step: "identities/current-user",
      queries: [],
      statuses: [200],
      expected: 200,
      shape: {
        addresses: [
          {
            locality: "string",
            type: "string"
          }
        ],
        emailAddresses: [
          {
            type: "string",
            value: "string"
          }
        ],
        id: "string",
        links: [
          {
            href: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        name: "string",
        providerId: "string",
        state: "string",
        version: "number"
      }
    },
    {
      route: "POST /jobDefinitions/definitions",
      step: "jobs/definition",
      queries: ["parentFolderUri"],
      statuses: [201],
      expected: 201,
      shape: {
        code: "string",
        createdBy: "string",
        creationTimeStamp: "string",
        id: "string",
        links: [
          {
            href: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        modifiedBy: "string",
        modifiedTimeStamp: "string",
        name: "string",
        parameters: [
          {
            defaultValue: "string",
            name: "string",
            required: "boolean",
            type: "string",
            version: "number"
          }
        ],
        type: "string",
        version: "number"
      }
    },
    {
      route: "GET /jobDefinitions/definitions/{}",
      step: "jobs/execute",
      queries: [],
      statuses: [200],
      expected: 200,
      shape: {
        code: "string",
        createdBy: "string",
        creationTimeStamp: "string",
        id: "string",
        links: [
          {
            href: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        modifiedBy: "string",
        modifiedTimeStamp: "string",
        name: "string",
        parameters: [
          {
            defaultValue: "string",
            name: "string",
            required: "boolean",
            type: "string",
            version: "number"
          }
        ],
        type: "string",
        version: "number"
      }
    },
    {
      route: "POST /jobExecution/jobs",
      step: "jobs/execute",
      queries: ["_action"],
      statuses: [201],
      expected: 201,
      shape: {
        createdBy: "string",
        creationTimeStamp: "string",
        elapsedTime: "number",
        heartbeatInterval: "number",
        heartbeatTimeStamp: "string",
        id: "string",
        jobRequest: {
          arguments: {
            _DEBUG: "string",
            _OMITJSONLISTING: "string",
            _OMITJSONLOG: "string",
            _OMITTEXTLISTING: "string",
            _OMITTEXTLOG: "string",
            _addjesbeginendmacros: "string",
            _contextName: "string",
            _omitSessionResults: "string",
            _program: "string",
            _webin_file_count: "string"
          },
          createdByApplication: "string",
          description: "string",
          jobDefinition: {
            code: "string",
            createdBy: "string",
            creationTimeStamp: "string",
            id: "string",
            links: ["object"],
            modifiedBy: "string",
            modifiedTimeStamp: "string",
            name: "string",
            parameters: ["object"],
            type: "string",
            version: "number"
          },
          name: "string",
          properties: "array",
          version: "number"
        },
        links: [
          {
            href: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        modifiedBy: "string",
        modifiedTimeStamp: "string",
        results: {},
        state: "string",
        submittedByApplication: "string",
        version: "number"
      }
    },
    {
      route: "GET /jobExecution/jobs/{}",
      step: "jobs/execute",
      queries: [],
      statuses: [200],
      expected: 200,
      shape: {
        createdBy: "string",
        creationTimeStamp: "string",
        elapsedTime: "number",
        endTimeStamp: "string",
        heartbeatInterval: "number",
        heartbeatTimeStamp: "string",
        id: "string",
        jobRequest: {
          arguments: {
            _DEBUG: "string",
            _OMITJSONLISTING: "string",
            _OMITJSONLOG: "string",
            _OMITTEXTLISTING: "string",
            _OMITTEXTLOG: "string",
            _addjesbeginendmacros: "string",
            _contextName: "string",
            _omitSessionResults: "string",
            _program: "string",
            _webin_file_count: "string"
          },
          createdByApplication: "string",
          description: "string",
          jobDefinition: {
            code: "string",
            createdBy: "string",
            creationTimeStamp: "string",
            id: "string",
            links: ["object"],
            modifiedBy: "string",
            modifiedTimeStamp: "string",
            name: "string",
            parameters: ["object"],
            type: "string",
            version: "number"
          },
          name: "string",
          properties: "array",
          version: "number"
        },
        links: [
          {
            href: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        logLocation: "string",
        modifiedBy: "string",
        modifiedTimeStamp: "string",
        results: {
          COMPUTE_CONTEXT: "string",
          COMPUTE_JOB: "string",
          COMPUTE_SESSION: "string",
          "{}.log": "string",
          "{}.log.txt": "string"
        },
        state: "string",
        submittedByApplication: "string",
        version: "number"
      }
    },
    {
      route: "GET /jobExecution/jobs/{}/state",
      step: "jobs/execute",
      queries: ["_action", "wait"],
      statuses: [200],
      expected: 200,
      shape: void 0
    },
    {
      route: "GET /launcher/contexts",
      step: "compute/launcher-contexts",
      queries: ["limit"],
      statuses: [200],
      expected: 200,
      shape: {
        accept: "string",
        count: "number",
        items: [
          {
            createdBy: "string",
            creationTimeStamp: "string",
            description: "string",
            id: "string",
            links: [
              {
                href: "string",
                method: "string",
                rel: "string",
                type: "string",
                uri: "string"
              }
            ],
            modifiedBy: "string",
            modifiedTimeStamp: "string",
            name: "string",
            type: "string",
            version: "number"
          }
        ],
        limit: "number",
        links: [
          {
            href: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        name: "string",
        start: "number",
        version: "number"
      }
    },
    {
      route: "POST /SASLogon/oauth/token",
      step: "auth/token-refresh",
      queries: [],
      statuses: [200, 401],
      expected: 200,
      shape: {
        access_token: "string",
        expires_in: "number",
        id_token: "string",
        jti: "string",
        refresh_expires_in: "number",
        refresh_revocable: "boolean",
        refresh_token: "string",
        revocable: "boolean",
        scope: "string",
        token_type: "string"
      }
    },
    {
      route: "GET /types/types",
      step: "files/create",
      queries: ["limit"],
      statuses: [200],
      expected: 200,
      shape: {
        accept: "string",
        count: "number",
        items: [
          {
            description: "string",
            iconUri: "string",
            label: "string",
            links: [
              {
                href: "string",
                method: "string",
                rel: "string",
                type: "string",
                uri: "string"
              }
            ],
            mediaType: "string",
            name: "string",
            resourceUri: "string",
            tags: ["string"],
            version: "number"
          }
        ],
        limit: "number",
        links: [
          {
            href: "string",
            itemType: "string",
            method: "string",
            rel: "string",
            type: "string",
            uri: "string"
          }
        ],
        name: "string",
        start: "number",
        version: "number"
      }
    }
  ];

  // src/appstream/bundle.ts
  var APP_MANIFEST = "sasjs.app.json";
  var FRONTEND_FOLDER = "web";
  var BACKEND_FOLDER = "backend";
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
    const name = text(value.name, "name");
    const appLoc = text(value.appLoc, "appLoc");
    const streamWebFolder = text(value.streamWebFolder, "streamWebFolder");
    const logo = text(value.logo, "logo");
    if (streamWebFolder !== void 0 && /[\\/]/.test(streamWebFolder))
      throw new ApiError(
        400,
        `"streamWebFolder" in ${APP_MANIFEST} must be a single path segment.`
      );
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
      ...appLoc === void 0 ? {} : { appLoc },
      ...streamWebFolder === void 0 ? {} : { streamWebFolder },
      ...logo === void 0 ? {} : { logo },
      ...frameAncestors === void 0 ? {} : { frameAncestors }
    };
  };
  var folderNamed = (members, name) => members.find(
    (member) => isObject(member) && member.type === "folder" && member.name === name
  );
  var contentsOf = (member) => {
    const members = member?.members;
    return Array.isArray(members) ? { members } : void 0;
  };
  var splitAppBundle = (tree) => {
    if (!isObject(tree) || !Array.isArray(tree.members))
      return { tree };
    const members = tree.members;
    const at = members.findIndex(
      (member) => isObject(member) && member.type === "file" && member.name === APP_MANIFEST
    );
    const withoutManifest = at === -1 ? members : members.filter((_, index) => index !== at);
    let manifest;
    if (at !== -1) {
      const member = members[at];
      if (typeof member.code !== "string")
        throw new ApiError(400, `${APP_MANIFEST} carries no text.`);
      const source = member.encoding === "base64" ? new TextDecoder().decode(decodeBase64(member.code)) : member.code;
      let parsed;
      try {
        parsed = JSON.parse(source);
      } catch (error) {
        throw new ApiError(
          400,
          `${APP_MANIFEST} is not valid JSON: ${error.message}`
        );
      }
      manifest = parseAppManifest(parsed);
    }
    const rest = { ...tree, members: withoutManifest };
    const web = folderNamed(withoutManifest, FRONTEND_FOLDER);
    const backendFolder = folderNamed(withoutManifest, BACKEND_FOLDER);
    if (web === void 0 && backendFolder === void 0 && manifest === void 0)
      return { tree };
    if (manifest?.streamWebFolder !== void 0) return { tree: rest, manifest };
    const backend = contentsOf(backendFolder);
    const ownFiles = withoutManifest.filter((member) => member !== backendFolder);
    const frontend = contentsOf(web) ?? (ownFiles.length === 0 ? void 0 : { members: ownFiles });
    return {
      tree: rest,
      ...frontend === void 0 ? {} : { frontend },
      ...backend === void 0 ? {} : { backend },
      manifest
    };
  };
  var publishRequestFor = (deploy, manifest, options = {}) => {
    const streamWebFolder = deploy.streamWebFolder ?? manifest?.streamWebFolder;
    const appLoc = deploy.appLoc ?? manifest?.appLoc;
    const name = deploy.name ?? deploy.streamServiceName ?? manifest?.name;
    const logo = deploy.streamLogo ?? manifest?.logo;
    const frameAncestors = manifest?.frameAncestors;
    if (streamWebFolder !== void 0)
      return {
        ...appLoc === void 0 ? {} : { appLoc },
        streamWebFolder,
        ...name === void 0 ? {} : { name },
        ...logo === void 0 ? {} : { logo },
        ...frameAncestors === void 0 ? {} : { frameAncestors }
      };
    if (name === void 0 && !options.packaged) return void 0;
    return {
      ...name === void 0 ? {} : { name },
      ...appLoc === void 0 ? {} : { appLoc },
      ...logo === void 0 ? {} : { logo },
      ...frameAncestors === void 0 ? {} : { frameAncestors }
    };
  };

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

  // src/host/dispatch.ts
  var SECONDS_IN_A_DAY = 86400;
  var RUN_ROUTES = [
    "GET /SASjsApi/stp/execute",
    "POST /SASjsApi/stp/execute",
    "POST /SASjsApi/stp/trigger",
    "POST /SASjsApi/code/execute",
    "POST /SASjsApi/code/trigger"
  ];
  var GRANTED_ROUTES = DEFAULT_GRANTABLE_ROUTES.filter(
    (path) => !TOP_LEVEL_ROUTES.includes(path)
  );
  var grantPath = (path) => GRANTED_ROUTES.find(
    (candidate) => candidate.toLowerCase() === path.toLowerCase()
  );
  var ADMIN_ROUTES = [
    "GET /SASjsApi/admin/diagnostics",
    "GET /SASjsApi/admin/logs",
    "GET /SASjsApi/admin/logs/{fileName}"
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
  var APP_ENTRY_FILE = "index.html";
  var refused = (message) => new ApiError(400, message);
  var stringField = (field, value, allowEmpty = false) => {
    if (typeof value !== "string") throw refused(`"${field}" must be a string`);
    if (value === "" && !allowEmpty)
      throw refused(`"${field}" is not allowed to be empty`);
    return value;
  };
  var requiredField = (field, value) => {
    if (value === void 0) throw refused(`"${field}" is required`);
    return stringField(field, value);
  };
  var alphanumeric = (field, value, min, max) => {
    if (!/^[A-Za-z0-9]+$/.test(value))
      throw refused(`"${field}" must only contain alpha-numeric characters`);
    if (value.length < min)
      throw refused(`"${field}" length must be at least ${min} characters long`);
    if (value.length > max)
      throw refused(
        `"${field}" length must be less than or equal to ${max} characters long`
      );
    return value;
  };
  var lengthBetween = (field, value, min, max) => {
    if (value.length < min)
      throw refused(`"${field}" length must be at least ${min} characters long`);
    if (value.length > max)
      throw refused(
        `"${field}" length must be less than or equal to ${max} characters long`
      );
    return value;
  };
  var trimmedName = (field, value) => {
    const name = value.trim();
    if (name === "") throw refused(`"${field}" is not allowed to be empty`);
    if (name.length < 6)
      throw refused(`"${field}" length must be at least 6 characters long`);
    return name;
  };
  var refuseUnknown = (body, keys) => {
    for (const key of Object.keys(body))
      if (!keys.includes(key)) throw refused(`"${key}" is not allowed`);
  };
  var ADMIN_GATED_ROUTES = /* @__PURE__ */ new Set([
    "POST /SASjsApi/permission",
    "PATCH /SASjsApi/permission/{uid}",
    "DELETE /SASjsApi/permission/{uid}",
    "GET /SASjsApi/client",
    "POST /SASjsApi/client"
  ]);
  var foldedUsername = (value) => alphanumeric(
    "username",
    requiredField("username", value).toLowerCase(),
    3,
    16
  );
  var deletionBody = (body, admin) => {
    if (admin) {
      for (const key of Object.keys(body))
        throw refused(`"${key}" is not allowed`);
      return {};
    }
    const password = lengthBetween(
      "password",
      requiredField("password", body.password),
      6,
      1024
    );
    for (const key of Object.keys(body))
      if (key !== "password") throw refused(`"${key}" is not allowed`);
    return { password };
  };
  var USER_KEYS = [
    "displayName",
    "username",
    "password",
    "isAdmin",
    "isActive",
    "autoExec"
  ];
  var userCreate = (body) => {
    const displayName = trimmedName(
      "displayName",
      requiredField("displayName", body.displayName)
    );
    const username = alphanumeric(
      "username",
      requiredField("username", body.username).toLowerCase(),
      3,
      16
    );
    const password = lengthBetween(
      "password",
      requiredField("password", body.password),
      6,
      1024
    );
    const isAdmin = booleanOf(body.isAdmin, "isAdmin");
    const isActive = booleanOf(body.isActive, "isActive");
    const autoExec = body.autoExec === void 0 ? void 0 : stringField("autoExec", body.autoExec, true);
    refuseUnknown(body, USER_KEYS);
    return { displayName, username, password, isAdmin, isActive, autoExec };
  };
  var GROUP_CREATE_KEYS = ["name", "description", "isActive"];
  var groupCreate = (body) => {
    const name = alphanumeric("name", requiredField("name", body.name), 3, 16);
    const description = body.description === void 0 ? void 0 : stringField("description", body.description);
    const isActive = booleanOf(body.isActive, "isActive");
    refuseUnknown(body, GROUP_CREATE_KEYS);
    return { name, description, isActive };
  };
  var userUpdate = (body, admin) => {
    const changes = { ...body };
    if (changes.displayName !== void 0)
      changes.displayName = trimmedName(
        "displayName",
        stringField("displayName", changes.displayName)
      );
    if (changes.username !== void 0)
      changes.username = alphanumeric(
        "username",
        stringField("username", changes.username).toLowerCase(),
        3,
        16
      );
    if (changes.password !== void 0)
      lengthBetween(
        "password",
        stringField("password", changes.password),
        6,
        1024
      );
    if (changes.autoExec !== void 0)
      stringField("autoExec", changes.autoExec, true);
    const declared = admin ? USER_KEYS : USER_KEYS.filter((key) => key !== "isAdmin" && key !== "isActive");
    for (const field of ["isAdmin", "isActive"])
      if (admin && field in changes)
        changes[field] = booleanOf(changes[field], field);
    refuseUnknown(changes, declared);
    return changes;
  };
  var booleanOf = (value, field) => {
    if (value === void 0) return void 0;
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const text2 = value.trim().toLowerCase();
      if (text2 === "true") return true;
      if (text2 === "false") return false;
    }
    throw new ApiError(400, `"${field}" must be a boolean`);
  };
  var APP_NOT_REGISTERED = "No App Stream is registered with that id.";
  var appNotRegistered = () => new ApiError(404, APP_NOT_REGISTERED, {
    status: "failure",
    message: APP_NOT_REGISTERED
  });
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
    const adminScoped = ADMIN_ROUTES.includes(routeId) && Boolean(services.admin);
    const grantScoped = grantPath(route.path);
    const appDetailScoped = routeId === "GET /SASjsApi/app/{id}";
    if ((grantScoped || appDetailScoped) && (identity || request.subject || request.token) && !records)
      throw new ApiError(
        501,
        `This host has no record service, so it cannot answer ${routeId}.`
      );
    if (adminScoped && !records)
      throw new ApiError(
        501,
        `This host has no record service, so it cannot answer ${routeId}.`
      );
    let subject = request.subject;
    let subjectResolved = Boolean(request.subject);
    const caller = async () => {
      if (!subjectResolved) {
        subject = identity ? await identity.authenticate(request.token) : void 0;
        subjectResolved = true;
      }
      return subject;
    };
    if (appDetailScoped && (identity || records || request.subject || request.token) && !await caller()) {
      if (!identity)
        throw new ApiError(
          501,
          `This host has no identity service, so it cannot answer ${routeId}.`
        );
      throw new ApiError(401, "Unauthorized");
    }
    if (appDetailScoped && records && !await records.mayAct(await caller()))
      throw new ApiError(401, "Unauthorized");
    if (identityScoped && records || runtimeScoped && services.runtime || adminScoped || grantScoped && records) {
      const callerSubject = await caller();
      let publicGrant = false;
      if (!callerSubject) {
        publicGrant = Boolean(
          grantScoped && records && !identityScoped && !runtimeScoped && !adminScoped && await records.mayUseRoute(void 0, grantScoped)
        );
        if (!publicGrant) {
          if (!identity)
            throw new ApiError(
              501,
              `This host has no identity service, so it cannot answer ${routeId}.`
            );
          throw new ApiError(401, "Unauthorized");
        }
      }
      if (adminScoped && !await records.mayAdminister(callerSubject)) {
        if (!await records.mayAct(callerSubject))
          throw new ApiError(401, "Unauthorized");
        throw new ApiError(401, "Admin account required");
      }
      if (grantScoped && records && !publicGrant && !await records.mayUseRoute(callerSubject, grantScoped))
        throw new ApiError(401, "Unauthorized");
    }
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
    const callerRecord = async () => {
      const recordsService = required();
      const subject2 = await caller();
      return recordsService.getUser(subject2, {
        uid: String(subject2?.userId ?? "")
      });
    };
    const verifyAdminIfNeeded = async (target) => {
      const me = await callerRecord();
      if (me.isAdmin) return true;
      const ownAccount = target.uid !== void 0 && target.uid === me.uid || target.username !== void 0 && target.username === me.username;
      if (!ownAccount) throw new ApiError(401, "Admin account required");
      return false;
    };
    const required = () => {
      if (!records)
        throw new ApiError(
          501,
          `This host has no record service, so it cannot answer ${routeId}.`
        );
      return records;
    };
    const controllerRules = {
      "POST /SASjsApi/user": async (request2) => {
        if (!(await callerRecord()).isAdmin)
          throw new ApiError(401, "Admin account required");
        return { body: userCreate(request2.body || {}) };
      },
      "POST /SASjsApi/group": async (request2) => {
        if (!(await callerRecord()).isAdmin)
          throw new ApiError(401, "Admin account required");
        return { body: groupCreate(request2.body || {}) };
      },
      "PATCH /SASjsApi/user/{uid}": async (request2) => {
        const admin = await verifyAdminIfNeeded({
          uid: String(request2.params?.uid ?? "")
        });
        return { body: userUpdate(request2.body || {}, admin) };
      },
      "PATCH /SASjsApi/user/by/username/{username}": async (request2) => {
        const admin = await verifyAdminIfNeeded({
          username: String(request2.params?.username ?? "")
        });
        const username = foldedUsername(request2.params?.username);
        return { body: userUpdate(request2.body || {}, admin), username };
      },
      "DELETE /SASjsApi/user/by/username/{username}": async (request2) => {
        const admin = await verifyAdminIfNeeded({
          username: String(request2.params?.username ?? "")
        });
        const username = foldedUsername(request2.params?.username);
        return { body: deletionBody(request2.body || {}, admin), username };
      },
      "DELETE /SASjsApi/user/{uid}": async (request2) => {
        const admin = await verifyAdminIfNeeded({
          uid: String(request2.params?.uid ?? "")
        });
        return { body: deletionBody(request2.body || {}, admin) };
      }
    };
    const controllerRule = controllerRules[routeId];
    const controllerAnswer = controllerRule ? await controllerRule(request) : void 0;
    if (!controllerRule) {
      if (ADMIN_GATED_ROUTES.has(routeId) && !(await callerRecord()).isAdmin)
        throw new ApiError(401, "Admin account required");
      validate(route, request);
    }
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
      // The administrator check is the package's, from the caller the transport
      // resolved: `mayAdminister` is the decision `verifyAdmin` makes on a server,
      // asked here so a browser host that supplies these reports cannot serve them
      // to anyone who asks. What stays the host's is the body, and for a log tail
      // the refusals that belong to the name rule.
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
        assertOneFileName(query);
        if (query._FILE !== void 0) {
          if (!services.deploymentFile)
            throw new ApiError(
              501,
              `This host has no deployment-file service, so it cannot answer ${routeId}.`
            );
          const page = await services.deploymentFile.read(String(query._FILE));
          return {
            status: page.status,
            contents: page.body,
            contentType: page.contentType,
            headers: page.headers
          };
        }
        if (query._filePath === void 0)
          throw new ApiError(400, '"_filePath" is required');
        const file = await drive.read(String(query._filePath));
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
        const packaged = bundle.frontend !== void 0;
        const isUpload = routeId === "POST /SASjsApi/drive/deploy/upload";
        const setting = (name) => isUpload ? given(query[name]) ?? body?.[name] : body?.[name];
        const statedAppLoc = given(setting("appLoc"));
        const appLoc = typeof statedAppLoc === "string" ? statedAppLoc : void 0;
        const requested = services.appStream ? publishRequestFor(
          {
            name: given(setting("name")),
            appLoc,
            streamWebFolder: given(setting("streamWebFolder")),
            streamServiceName: given(setting("streamServiceName")),
            streamLogo: given(setting("streamLogo"))
          },
          bundle.manifest,
          { packaged }
        ) : void 0;
        const folderFromManifest = requested?.streamWebFolder !== void 0 && given(setting("streamWebFolder")) === void 0 && bundle.manifest?.streamWebFolder !== void 0;
        const publish = requested === void 0 ? void 0 : checkPublishRequest(
          requested,
          packaged ? bundle.frontend : bundle.tree,
          { folderFromManifest }
        );
        if (packaged && publish === void 0)
          throw new ApiError(
            501,
            `This host has no app stream, so it cannot publish the frontend this bundle carries.`
          );
        if (publish !== void 0 && publish.streamWebFolder === void 0) {
          if (bundle.backend !== void 0 && publish.appLoc === void 0)
            throw new ApiError(
              400,
              'This bundle carries a "backend" folder but names no "appLoc" for it: state the backend folder in sasjs.app.json, or in the request.'
            );
          if (bundle.backend !== void 0)
            await drive.deploy(publish.appLoc, bundle.backend, {
              replace: false
            });
          await drive.deploy(
            frontendFolderOf(publish.name),
            packaged ? bundle.frontend : bundle.tree,
            { replace: true }
          );
          const entry2 = await services.appStream.publish(publish);
          return {
            status: 200,
            body: { ...DEPLOY_SUCCESS, app: appSummary(entry2) }
          };
        }
        const replace = replaceOf(setting("replace")) ?? isUpload;
        if (appLoc === void 0)
          throw new ApiError(
            400,
            '"appLoc" is required to deploy files that do not name an app.'
          );
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
      // --------------------------------------------------- what an app *is*
      //
      // The surface serves an app's files; this describes the app itself - the entry
      // as registered, and whether the file it is served from is there. Addressed by id,
      // which is what a publish answers with and what the app's URL carries: a label is
      // shared by design, so "the app with this name" is not one app.
      case "GET /SASjsApi/app/{id}": {
        if (!services.appStream)
          throw new ApiError(
            501,
            `This host has no app stream, so it cannot answer ${routeId}.`
          );
        const entry = await services.appStream.get(String(params.id ?? "")).catch((err) => {
          if (isApiError(err) && err.status === 404) throw appNotRegistered();
          throw err;
        });
        if (records) {
          const subject2 = await caller();
          if (!await records.mayAdminister(subject2)) {
            const rules = (await records.listPermissions(subject2)).filter(
              (rule) => rule.type === "Route"
            );
            const paths = [`/AppStream/${entry.id}`, `/AppStream/${entry.name}`];
            const decided = paths.find((path) => rules.some((rule) => rule.path === path)) ?? paths[0];
            const routeRules = {
              user: rules.filter((rule) => rule.user === subject2.userId),
              group: rules.filter((rule) => rule.group !== void 0)
            };
            if (!isRouteGranted(routeRules, decided, "/AppStream"))
              throw appNotRegistered();
          }
        }
        const folder = appRootOf(entry);
        let entryFileExists = false;
        let lastModified = null;
        try {
          const { tree } = await drive.tree(folder);
          const file = tree.children.find(
            (child) => child.name === APP_ENTRY_FILE && !child.isFolder
          );
          entryFileExists = file !== void 0;
          lastModified = file?.modified ?? null;
        } catch (err) {
          if (!isApiError(err) || err.status !== 404) throw err;
          entryFileExists = false;
        }
        const body2 = {
          id: entry.id,
          name: entry.name,
          // the folder the entry is read from, which is what this route describes:
          // `apps/<name>` for a frontend, and the legacy deployment's own folder for
          // the older shape. A host that answered one and not the other would leave
          // a client reading a path out of fields the entry may not carry.
          frontendFolder: folder,
          ...entry.appLoc === void 0 ? {} : { appLoc: entry.appLoc },
          ...entry.streamWebFolder === void 0 ? {} : { streamWebFolder: entry.streamWebFolder },
          publishedAt: entry.publishedAt ?? null,
          entryFile: APP_ENTRY_FILE,
          entryFileExists,
          lastModified,
          url: `/app/${entry.id}/`
        };
        if (entry.logo !== void 0) body2.logo = entry.logo;
        if (entry.frameAncestors !== void 0)
          body2.frameAncestors = entry.frameAncestors;
        return { status: 200, body: body2 };
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
            username: foldedUsername(params.username)
          })
        };
      case "POST /SASjsApi/user":
        return {
          status: 200,
          body: await required().createUser(
            await caller(),
            controllerAnswer.body
          )
        };
      case "PATCH /SASjsApi/user/{uid}":
        return {
          status: 200,
          body: await required().updateUser(
            await caller(),
            { uid: String(params.uid ?? "") },
            // the body the controller's own schema accepted, with what Joi converts
            // already converted
            controllerAnswer.body
          )
        };
      case "PATCH /SASjsApi/user/by/username/{username}":
        return {
          status: 200,
          body: await required().updateUser(
            await caller(),
            { username: controllerAnswer.username ?? "" },
            controllerAnswer.body
          )
        };
      case "DELETE /SASjsApi/user/{uid}":
        return {
          status: 200,
          body: await required().deleteUser(
            await caller(),
            { uid: String(params.uid ?? "") },
            { password: controllerAnswer.body.password }
          )
        };
      case "DELETE /SASjsApi/user/by/username/{username}":
        return {
          status: 200,
          body: await required().deleteUser(
            await caller(),
            { username: controllerAnswer.username ?? "" },
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
            filePath: body.filePath,
            // the body is rebuilt field by field here, so a flag the service reads
            // has to be named or the request's own answer is lost on the way
            layout: booleanOf(body.layout, "layout")
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
            name: String(controllerAnswer.body.name ?? ""),
            // left absent rather than made empty: the service applies the model's default
            description: controllerAnswer.body.description,
            isActive: controllerAnswer.body.isActive
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
    "GET /SASjsApi/app/{id}",
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
  var readerOf = async (store, caller) => {
    if (!caller) return void 0;
    const user3 = await store.userById(caller.userId);
    return user3 && user3.isActive ? user3 : void 0;
  };
  var requireCaller = async (store, caller) => {
    const user3 = await readerOf(store, caller);
    if (!user3) throw unauthorized2();
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
    const grantedRoutesFor = async (reader) => {
      if (reader.isAdmin) return new Set(grantableRoutes);
      const rules = await store.permissions();
      const mine = {
        user: rules.filter((rule) => rule.user === reader.uid).map((rule) => ({ path: rule.path, setting: rule.setting })),
        group: rules.filter(
          (rule) => rule.group !== void 0 && reader.groups.includes(rule.group)
        ).map((rule) => ({ path: rule.path, setting: rule.setting }))
      };
      const publicGroup = rules.some((rule) => rule.group !== void 0) ? (await store.groups()).find((group) => group.name === PUBLIC_GROUP) : void 0;
      const publicGrants = publicGroup ? rules.filter(
        (rule) => rule.group === publicGroup.uid && rule.setting === "Grant"
      ).map((rule) => rule.path) : [];
      return new Set(
        grantableRoutes.filter(
          (path) => ALWAYS_VISIBLE_ROUTES.includes(path) || publicGrants.includes(path) || isRouteGranted(mine, path, topLevelRouteFor(path))
        )
      );
    };
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
        change.displayName = displayName;
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
          // the model defaults the field, so an absent description is the model's
          description: body.description ?? "Group description.",
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
        const granted = await grantedRoutesFor(reader);
        return { paths: grantableRoutes.filter((path) => granted.has(path)) };
      },
      async mayAdminister(caller) {
        const reader = await readerOf(store, caller);
        return Boolean(reader?.isAdmin);
      },
      async mayAct(caller) {
        return Boolean(await readerOf(store, caller));
      },
      async mayUseRoute(caller, path) {
        if (!caller) {
          const rules = await store.permissions();
          if (!rules.some((rule) => rule.group !== void 0)) return false;
          const publicGroup = (await store.groups()).find(
            (group) => group.name === PUBLIC_GROUP
          );
          return Boolean(
            publicGroup && rules.some(
              (rule) => rule.group === publicGroup.uid && rule.path === path && rule.setting === "Grant"
            )
          );
        }
        const reader = await readerOf(store, caller);
        if (!reader) return false;
        if (reader.isAdmin) return true;
        const granted = await grantedRoutesFor(reader);
        return granted.has(path);
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
  var ADMIN = { userId: "user-admin", clientId: "web_app" };
  var RESTRICTED = { userId: "user-restricted", clientId: "web_app" };
  var ADMIN_CORPUS = [
    {
      id: "admin-diagnostics-answers-the-report",
      route: "GET /SASjsApi/admin/diagnostics",
      description: "answers the host diagnostics report field for field",
      request: { subject: ADMIN },
      expect: { status: 200, body: CORPUS_DIAGNOSTICS }
    },
    {
      id: "admin-logs-lists-the-files",
      route: "GET /SASjsApi/admin/logs",
      description: "answers the log files the host holds, newest first",
      request: { subject: ADMIN },
      expect: { status: 200, body: { files: [CORPUS_LOG] } }
    },
    {
      id: "admin-log-tail-answers-the-tail",
      route: "GET /SASjsApi/admin/logs/{fileName}",
      description: "answers the tail of a log the folder holds",
      request: { subject: ADMIN, params: { fileName: CORPUS_LOG.name } },
      expect: { status: 200, body: CORPUS_LOG_TAIL }
    },
    {
      id: "admin-log-tail-refuses-a-traversal",
      route: "GET /SASjsApi/admin/logs/{fileName}",
      description: "refuses a name that could resolve outside the log folder, before the host is asked",
      request: { subject: ADMIN, params: { fileName: "../20260101000000.log" } },
      expect: { status: 400, error: "Invalid log file name." }
    },
    {
      id: "admin-log-tail-answers-404",
      route: "GET /SASjsApi/admin/logs/{fileName}",
      description: "answers 404 for a name the folder does not hold",
      request: { subject: ADMIN, params: { fileName: "20250101000000.log" } },
      expect: { status: 404, error: "Log file not found." }
    },
    {
      id: "admin-diagnostics-refused-to-a-restricted-account",
      route: "GET /SASjsApi/admin/diagnostics",
      description: "refuses a signed-in account that is not an administrator, in the wording verifyAdmin uses",
      request: { subject: RESTRICTED },
      expect: { status: 401, error: "Admin account required" }
    },
    {
      id: "admin-logs-refused-to-a-restricted-account",
      route: "GET /SASjsApi/admin/logs",
      description: "refuses the log inventory to a restricted account",
      request: { subject: RESTRICTED },
      expect: { status: 401, error: "Admin account required" }
    },
    {
      id: "admin-log-tail-refused-to-a-restricted-account",
      route: "GET /SASjsApi/admin/logs/{fileName}",
      description: "refuses a log tail to a restricted account",
      request: { subject: RESTRICTED, params: { fileName: CORPUS_LOG.name } },
      expect: { status: 401, error: "Admin account required" }
    },
    {
      id: "admin-logs-refused-with-no-caller",
      route: "GET /SASjsApi/admin/logs",
      description: "refuses a request that carries no caller at all",
      request: {},
      expect: { status: 401, error: "Unauthorized" }
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
  var ADMIN2 = { userId: "user-admin", clientId: "web_app" };
  var RESTRICTED2 = { userId: "user-restricted", clientId: "web_app" };
  var NO_DRIVE_GRANTS = {
    ...DEFAULT_IDENTITY,
    permissions: DEFAULT_IDENTITY.permissions.filter(
      (rule) => rule.uid !== "rule-routes"
    )
  };
  var PUBLIC_FILE = {
    ...DEFAULT_IDENTITY,
    groups: [
      ...DEFAULT_IDENTITY.groups,
      {
        uid: "group-public",
        name: "public",
        description: "Everyone",
        isActive: true,
        users: []
      }
    ],
    permissions: [
      ...DEFAULT_IDENTITY.permissions,
      {
        uid: "rule-public-file",
        path: "/SASjsApi/drive/file",
        type: "Route",
        setting: "Grant",
        group: "group-public"
      }
    ]
  };
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
        subject: ADMIN2,
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
        subject: ADMIN2,
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
        subject: ADMIN2,
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
        subject: ADMIN2,
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
        subject: ADMIN2,
        query: { _filePath: "/../escape.csv" },
        file: { name: "x", contents: "x" }
      },
      expect: { status: 400, error: "Can't put file outside drive." }
    },
    {
      id: "create-file-without-payload",
      route: "POST /SASjsApi/drive/file",
      description: "answers for a missing file with the server wording",
      request: {
        subject: ADMIN2,
        query: { _filePath: "/data/x.csv" }
      },
      expect: { status: 400, error: '"file" is not present.' }
    },
    {
      id: "create-file-without-destination",
      route: "POST /SASjsApi/drive/file",
      description: "answers for a missing destination with the validation wording",
      request: {
        subject: ADMIN2,
        file: { name: "x", contents: "x" }
      },
      expect: { status: 400, error: '"_filePath" is required' }
    },
    {
      id: "replace-file",
      route: "PATCH /SASjsApi/drive/file",
      description: "replaces the contents of a file that exists",
      seed: { "/data/keep.csv": "old" },
      request: {
        subject: ADMIN2,
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
        subject: ADMIN2,
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
        subject: ADMIN2,
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
      request: {
        subject: ADMIN2,
        query: { _filePath: "/data/keep.csv" }
      },
      expect: { status: 200, contents: "a,b\n1,2\n" }
    },
    {
      id: "read-file-missing",
      route: "GET /SASjsApi/drive/file",
      description: "refuses a read of a file that is not there",
      request: {
        subject: ADMIN2,
        query: { _filePath: "/data/missing.csv" }
      },
      expect: { status: 404, error: `File doesn't exist.` }
    },
    {
      id: "read-file-outside-drive",
      route: "GET /SASjsApi/drive/file",
      description: "refuses a read of a path that climbs out of the drive",
      request: {
        subject: ADMIN2,
        query: { _filePath: "/../escape.csv" }
      },
      expect: { status: 400, error: "Can't get file outside drive." }
    },
    {
      id: "read-file-names-both",
      route: "GET /SASjsApi/drive/file",
      description: "refuses a request that names the file twice, in two readings",
      seed: { "/data/keep.csv": "a" },
      request: {
        subject: ADMIN2,
        query: { _filePath: "/data/keep.csv", _FILE: "/data/keep.csv" }
      },
      expect: {
        status: 400,
        error: 'Exactly one of "_filePath" and "_FILE" may be given.'
      }
    },
    {
      id: "read-streamed-file",
      route: "GET /SASjsApi/drive/file",
      description: "reads a deployment file by the name a streamed page links to",
      seed: { "/Public/app/services/web/main.js": "console.log(1)" },
      request: {
        subject: ADMIN2,
        query: { _FILE: "/Public/app/services/web/main.js" }
      },
      expect: { status: 200, contents: "console.log(1)" }
    },
    {
      id: "read-streamed-file-missing",
      route: "GET /SASjsApi/drive/file",
      description: "answers a missing deployment file the way the estate does, not as a 404",
      request: {
        subject: ADMIN2,
        query: { _FILE: "/Public/app/services/web/gone.js" }
      },
      expect: { status: 202, contents: DEPLOYMENT_FILE_ERROR }
    },
    {
      id: "delete-file",
      route: "DELETE /SASjsApi/drive/file",
      description: "deletes a file that exists",
      seed: { "/data/keep.csv": "a" },
      request: {
        subject: ADMIN2,
        query: { _filePath: "/data/keep.csv" }
      },
      expect: { status: 200, body: success2 }
    },
    {
      id: "delete-file-missing",
      route: "DELETE /SASjsApi/drive/file",
      description: "refuses a delete of a file that is not there",
      request: {
        subject: ADMIN2,
        query: { _filePath: "/data/missing.csv" }
      },
      expect: { status: 404, error: `File doesn't exist.` }
    },
    {
      id: "delete-file-outside-drive",
      route: "DELETE /SASjsApi/drive/file",
      description: "refuses a delete of a path that climbs out of the drive",
      request: {
        subject: ADMIN2,
        query: { _filePath: "/../escape.csv" }
      },
      expect: { status: 400, error: "Can't delete file outside drive." }
    },
    {
      id: "list-folder",
      route: "GET /SASjsApi/drive/folder",
      description: "lists the files and folders of a folder",
      seed: { "/data/a.csv": "a", "/data/reports/b.csv": "b" },
      request: {
        subject: ADMIN2,
        query: { _folderPath: "/data" }
      },
      expect: { status: 200, body: { files: ["a.csv"], folders: ["reports"] } }
    },
    {
      id: "list-folder-missing",
      route: "GET /SASjsApi/drive/folder",
      description: "refuses a listing of a folder that is not there",
      request: {
        subject: ADMIN2,
        query: { _folderPath: "/nope" }
      },
      expect: { status: 404, error: `Folder doesn't exist.` }
    },
    {
      id: "list-folder-outside-drive",
      route: "GET /SASjsApi/drive/folder",
      description: "refuses a listing of a path that climbs out of the drive",
      request: {
        subject: ADMIN2,
        query: { _folderPath: "/../escape" }
      },
      expect: { status: 400, error: "Can't get folder outside drive." }
    },
    {
      id: "delete-folder-without-path",
      route: "DELETE /SASjsApi/drive/folder",
      description: "answers for a missing folder path, because the table marks it required",
      request: {
        subject: ADMIN2
      },
      expect: { status: 400, error: '"_folderPath" is required' }
    },
    {
      id: "create-folder-without-path",
      route: "POST /SASjsApi/drive/folder",
      description: "answers for a missing folder path in the body",
      request: {
        subject: ADMIN2,
        body: {}
      },
      expect: { status: 400, error: '"folderPath" is required' }
    },
    {
      id: "create-folder",
      route: "POST /SASjsApi/drive/folder",
      description: "creates a folder",
      request: {
        subject: ADMIN2,
        body: { folderPath: "/data/reports" }
      },
      expect: { status: 200, body: success2 }
    },
    {
      id: "create-folder-existing",
      route: "POST /SASjsApi/drive/folder",
      description: "refuses a folder that already exists, as 409",
      seed: { "/data/reports/a.csv": "a" },
      request: {
        subject: ADMIN2,
        body: { folderPath: "/data/reports" }
      },
      expect: { status: 409, error: "Folder already exists." }
    },
    {
      id: "delete-folder",
      route: "DELETE /SASjsApi/drive/folder",
      description: "deletes a folder with everything under it",
      seed: { "/data/reports/a.csv": "a", "/data/reports/nested/b.csv": "b" },
      request: {
        subject: ADMIN2,
        query: { _folderPath: "/data/reports" }
      },
      expect: { status: 200, body: success2 }
    },
    {
      id: "delete-folder-missing",
      route: "DELETE /SASjsApi/drive/folder",
      description: "refuses a delete of a folder that is not there",
      request: {
        subject: ADMIN2,
        query: { _folderPath: "/nope" }
      },
      expect: { status: 404, error: `Folder doesn't exist.` }
    },
    {
      id: "rename-file",
      route: "POST /SASjsApi/drive/rename",
      description: "moves a file to a new path",
      seed: { "/data/old.csv": "r" },
      request: {
        subject: ADMIN2,
        body: { oldPath: "/data/old.csv", newPath: "/data/new.csv" }
      },
      expect: { status: 200, body: success2 }
    },
    {
      id: "rename-onto-existing",
      route: "POST /SASjsApi/drive/rename",
      description: "refuses a move onto something that exists",
      seed: { "/data/a.csv": "a", "/data/b.csv": "b" },
      request: {
        subject: ADMIN2,
        body: { oldPath: "/data/a.csv", newPath: "/data/b.csv" }
      },
      expect: { status: 409, error: "File with new name already exists." }
    },
    {
      id: "rename-missing",
      route: "POST /SASjsApi/drive/rename",
      description: "refuses a move of something that is not there",
      request: {
        subject: ADMIN2,
        body: { oldPath: "/data/nope.csv", newPath: "/data/x.csv" }
      },
      expect: { status: 404, error: "No file/folder found for provided path." }
    },
    {
      id: "rename-file-to-blocked-extension",
      route: "POST /SASjsApi/drive/rename",
      description: "refuses a rename that would produce a name the file routes refuse",
      seed: { "/data/report.csv": "a,b" },
      request: {
        subject: ADMIN2,
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
        subject: ADMIN2,
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
        subject: ADMIN2,
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
      request: {
        subject: ADMIN2,
        query: { _folderPath: "/data" }
      },
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
        subject: ADMIN2,
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
        subject: ADMIN2,
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
        subject: ADMIN2,
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
      request: {
        subject: ADMIN2,
        body: { appLoc: "/Public/apps/bad", fileTree: { members: 1 } }
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
      id: "deploy-refused-by-store",
      route: "POST /SASjsApi/drive/deploy",
      description: "answers the routes 500 when the drive refuses the write",
      unwritable: true,
      request: {
        subject: ADMIN2,
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
        subject: ADMIN2,
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
      request: {
        subject: ADMIN2,
        query: { _filePath: "/data/pack.zip" }
      },
      expect: { status: 200, contents: bytes(80, 75, 3, 4) }
    },
    // --------------------------------------------------- the rule that decides
    {
      id: "read-file-anonymous-public-grant",
      route: "GET /SASjsApi/drive/file",
      description: "admits an anonymous caller through an exact public group grant",
      identity: PUBLIC_FILE,
      seed: { "/data/public.csv": "public contents" },
      request: { query: { _filePath: "/data/public.csv" } },
      expect: { status: 200, contents: "public contents" }
    },
    {
      id: "read-file-public-invalid-token",
      route: "GET /SASjsApi/drive/file",
      description: "treats an invalid token as anonymous on an exactly public route",
      identity: PUBLIC_FILE,
      seed: { "/data/public.csv": "public contents" },
      request: {
        token: "invalid-token",
        query: { _filePath: "/data/public.csv" }
      },
      expect: { status: 200, contents: "public contents" }
    },
    {
      id: "read-file-public-inactive-token",
      route: "GET /SASjsApi/drive/file",
      description: "treats a deactivated token as anonymous on an exactly public route",
      identity: {
        ...PUBLIC_FILE,
        users: PUBLIC_FILE.users.map(
          (user3) => user3.uid === "user-restricted" ? { ...user3, isActive: false } : user3
        ),
        tokens: [
          {
            username: "sasjsuser",
            clientId: "web_app",
            accessToken: "inactive-access",
            refreshToken: "inactive-refresh"
          }
        ]
      },
      seed: { "/data/public.csv": "public contents" },
      request: {
        token: "inactive-access",
        query: { _filePath: "/data/public.csv" }
      },
      expect: { status: 200, contents: "public contents" }
    },
    {
      id: "create-file-anonymous-public-grant",
      route: "POST /SASjsApi/drive/file",
      description: "admits public writes when the exact route is granted",
      identity: PUBLIC_FILE,
      request: {
        query: { _filePath: "/data/new.csv" },
        file: { name: "new.csv", contents: "new" }
      },
      expect: { status: 200, body: success2 },
      expectDrive: { present: ["/data/new.csv"] }
    },
    {
      id: "read-folder-anonymous-other-public-grant",
      route: "GET /SASjsApi/drive/folder",
      description: "refuses an anonymous caller when a different path is public",
      identity: PUBLIC_FILE,
      request: { query: { _folderPath: "/data" } },
      expect: { status: 401, error: "Unauthorized" }
    },
    {
      id: "read-file-anonymous-public-parent-grant",
      route: "GET /SASjsApi/drive/file",
      description: "does not inherit public authentication from a parent grant",
      identity: {
        ...PUBLIC_FILE,
        permissions: PUBLIC_FILE.permissions.map(
          (rule) => rule.uid === "rule-public-file" ? { ...rule, path: "/SASjsApi" } : rule
        )
      },
      seed: { "/data/public.csv": "public contents" },
      request: { query: { _filePath: "/data/public.csv" } },
      expect: { status: 401, error: "Unauthorized" }
    },
    {
      id: "read-file-anonymous-public-deny",
      route: "GET /SASjsApi/drive/file",
      description: "does not authenticate an anonymous caller through a public deny",
      identity: {
        ...PUBLIC_FILE,
        permissions: PUBLIC_FILE.permissions.map(
          (rule) => rule.uid === "rule-public-file" ? { ...rule, setting: "Deny" } : rule
        )
      },
      request: { query: { _filePath: "/data/public.csv" } },
      expect: { status: 401, error: "Unauthorized" }
    },
    {
      id: "read-file-public-user-deny",
      route: "GET /SASjsApi/drive/file",
      description: "admits an authenticated caller despite an explicit user deny on a public route",
      identity: {
        ...PUBLIC_FILE,
        permissions: [
          ...PUBLIC_FILE.permissions,
          {
            uid: "user-file-deny",
            path: "/SASjsApi/drive/file",
            type: "Route",
            setting: "Deny",
            user: "user-restricted"
          }
        ]
      },
      seed: { "/data/public.csv": "public contents" },
      request: { subject: RESTRICTED2, query: { _filePath: "/data/public.csv" } },
      expect: { status: 200, contents: "public contents" }
    },
    {
      id: "read-file-granted-by-a-group-rule",
      route: "GET /SASjsApi/drive/file",
      description: "admits a restricted account the fixture grants this route, so the refusal beside it is the rule",
      seed: { "/data/keep.csv": "a,b\n1,2\n" },
      request: { subject: RESTRICTED2, query: { _filePath: "/data/keep.csv" } },
      expect: { status: 200, contents: "a,b\n1,2\n" }
    },
    {
      id: "rename-file-denied-to-a-restricted-account",
      route: "POST /SASjsApi/drive/rename",
      description: "refuses a drive route the rules do not grant, with the 401 a missing token earns",
      seed: { "/data/old.csv": "r" },
      request: {
        subject: RESTRICTED2,
        body: { oldPath: "/data/old.csv", newPath: "/data/new.csv" }
      },
      expect: { status: 401, error: "Unauthorized" }
    },
    // The permission gate refuses a caller the rules do not grant, on every route
    // the inventory addresses. Each of these is the same account and the same
    // refusal - the gate runs before the payload is read, which is why a bare
    // request answers 401 rather than the 400 a missing parameter would earn.
    ...[
      "GET /SASjsApi/drive/file",
      "GET /SASjsApi/drive/folder",
      "GET /SASjsApi/drive/filetree",
      "POST /SASjsApi/drive/file",
      "PATCH /SASjsApi/drive/file",
      "DELETE /SASjsApi/drive/file",
      "POST /SASjsApi/drive/folder",
      "DELETE /SASjsApi/drive/folder",
      "POST /SASjsApi/drive/deploy",
      "DELETE /SASjsApi/drive/deploy",
      "POST /SASjsApi/drive/deploy/upload"
    ].map((route) => ({
      id: `${route.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-denied-to-a-restricted-account`,
      route,
      description: "refuses a drive route the rules do not grant, before it reads the payload",
      identity: NO_DRIVE_GRANTS,
      request: { subject: RESTRICTED2 },
      expect: { status: 401, error: "Unauthorized" }
    }))
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
      id: "deploy-publishes-a-package",
      route: "POST /SASjsApi/drive/deploy",
      description: "publishes a frontend to apps/<name> and writes the backend it carries to appLoc",
      request: {
        subject: SUBJECT,
        body: {
          fileTree: {
            members: [
              {
                name: "sasjs.app.json",
                type: "file",
                code: JSON.stringify({
                  name: "macrodash",
                  appLoc: "/Public/app/md"
                })
              },
              {
                name: "web",
                type: "folder",
                members: [
                  { name: "index.html", type: "file", code: "<h1>Dash</h1>" }
                ]
              },
              {
                name: "backend",
                type: "folder",
                members: [
                  {
                    name: "services",
                    type: "folder",
                    members: [{ name: "run", type: "service", code: "%put hi;" }]
                  }
                ]
              }
            ]
          }
        }
      },
      // the halves are named, so a host has to write them to two folders rather
      // than deploy the container: a status alone cannot see that
      expectDrive: {
        present: ["/apps/macrodash/index.html", "/Public/app/md/services/run.sas"]
      },
      expect: {
        status: 200,
        partial: {
          status: "success",
          app: { name: "macrodash" }
        }
      }
    },
    {
      id: "deploy-refuses-a-backend-with-no-apploc",
      route: "POST /SASjsApi/drive/deploy",
      description: "refuses a bundle carrying services that names no folder to deploy them to",
      request: {
        subject: SUBJECT,
        body: {
          fileTree: {
            members: [
              {
                name: "sasjs.app.json",
                type: "file",
                code: JSON.stringify({ name: "orphan-backend" })
              },
              {
                name: "web",
                type: "folder",
                members: [
                  { name: "index.html", type: "file", code: "<h1>orphan</h1>" }
                ]
              },
              {
                name: "backend",
                type: "folder",
                members: [
                  {
                    name: "services",
                    type: "folder",
                    members: [{ name: "run", type: "service", code: "" }]
                  }
                ]
              }
            ]
          }
        }
      },
      // both hosts refuse this the same way, and neither writes the frontend it
      // could have deployed: half a deployment is worse than none
      expectDrive: { missing: ["/apps/orphan-backend/index.html"] },
      expect: {
        status: 400,
        error: 'This bundle carries a "backend" folder but names no "appLoc" for it: state the backend folder in sasjs.app.json, or in the request.'
      }
    },
    {
      id: "deploy-refuses-a-bundle-that-names-no-folder",
      route: "POST /SASjsApi/drive/deploy",
      description: "refuses a tree with no app named and no folder to deploy to, naming the field",
      request: {
        subject: SUBJECT,
        body: {
          fileTree: {
            members: [{ name: "run", type: "service", code: "%put hi;" }]
          }
        }
      },
      expect: {
        status: 400,
        error: '"appLoc" is required to deploy files that do not name an app.'
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

  // src/session/service.ts
  var createSessionService = (directory, host) => {
    const notFound3 = (id) => `Session with ID '${id}' was not found.`;
    const visible = async (caller, id) => {
      if (!caller) throw new ApiError(401, "Unauthorized");
      const reader = await directory.userById(
        caller.userId
      );
      if (!reader || !reader.isActive) throw new ApiError(401, "Unauthorized");
      const session = await host.session(id);
      if (!session) throw new ApiError(404, notFound3(id));
      const owner = session.owner;
      if (owner !== reader.uid && owner !== reader.username && !reader.isAdmin)
        throw new ApiError(404, notFound3(id));
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
        if (!state) throw new ApiError(404, notFound3(id));
        return state;
      },
      async log(caller, id) {
        await visible(caller, id);
        const log = await host.log(id);
        if (log === void 0) throw new ApiError(404, notFound3(id));
        return log;
      },
      async output(caller, id) {
        await visible(caller, id);
        const output = await host.output(id);
        if (output === void 0) throw new ApiError(404, notFound3(id));
        return output;
      }
    };
  };

  // src/runtime/runTimes.ts
  var DOCUMENTED_RUN_TIMES = ["sas", "js", "py", "r", "sasviya"];

  // src/runtime/program.ts
  var programNotFound = (given2) => `The Program at (${given2}) does not exist.`;
  var notThere2 = (given2) => new ApiError(400, programNotFound(given2));
  var runTimeOfPath = (path) => {
    const file = path.split(/[\\/]/).pop() || "";
    const dot = file.lastIndexOf(".");
    const extension = dot > 0 ? file.slice(dot + 1).toLowerCase() : "";
    return DOCUMENTED_RUN_TIMES.includes(extension) ? extension : void 0;
  };
  var resolveProgram = async (given2, deps) => {
    const resolved = deps.resolve(given2);
    if (resolved === null) throw notThere2(given2);
    const extension = runTimeOfPath(resolved);
    if (extension !== void 0) {
      if (await deps.exists(resolved))
        return { path: resolved, runTime: extension };
    } else {
      for (const runTime of deps.runTimes) {
        const candidate = `${resolved}.${runTime}`;
        if (await deps.exists(candidate)) return { path: candidate, runTime };
      }
    }
    throw notThere2(given2);
  };

  // src/runtime/service.ts
  var CODE_DEBUG = 131;
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
  var notThere3 = (programPath) => programNotFound(programPath);
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
      if (resolved === null) return failedRun(notThere3(request.program));
      return { path: resolved };
    };
    const runTimeForPath = (path, request) => (
      // the extension rule is `resolveProgram`'s; this asks it and falls back to what
      // the request stated, which is the part that is this route's
      runTimeOfPath(path) ?? runTimeOf(request)
    );
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
    const driveStore = testCase.unwritable ? new RefusingDriveStore(testCase.seed || {}) : new MemoryDriveStore(testCase.seed || {});
    return {
      drive: createDriveService(driveStore),
      deploymentFile: createDeploymentFileService(driveStore),
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
      appStream: createAppStreamService(
        new MemoryAppStreamStore(testCase.appStream ?? [CORPUS_APP])
      ),
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

  // src/corpus/app.ts
  var SUBJECT2 = { userId: "user-admin", clientId: "web_app" };
  var FRONTEND_APP = {
    id: "9d8c7b6a-5f4e-4d3c-8b2a-1f0e9d8c7b6a",
    name: "frontend-only",
    publishedAt: "2026-02-02T00:00:00.000Z"
  };
  var FRONTEND_ENTRY_FILE = `/apps/${FRONTEND_APP.name}/index.html`;
  var ENTRY_FILE_PATH = `${CORPUS_APP.appLoc}/services/${CORPUS_APP.streamWebFolder}/index.html`;
  var APP_CORPUS = [
    {
      id: "app-detail-anonymous",
      route: "GET /SASjsApi/app/{id}",
      description: "refuses an anonymous caller before looking up an app",
      request: { params: { id: CORPUS_APP.id } },
      expect: { status: 401, error: "Unauthorized" }
    },
    {
      id: "app-detail-published",
      route: "GET /SASjsApi/app/{id}",
      description: "describes the app the id names, and the entry file it is served from",
      // the deployment the index entry points at: the entry file is on the drive, so
      // `entryFileExists` is the answer this case is really about
      seed: { [ENTRY_FILE_PATH]: "<!doctype html><title>app</title>" },
      request: { subject: SUBJECT2, params: { id: CORPUS_APP.id } },
      expect: {
        status: 200,
        // the entry as registered, and the file it is served from. `lastModified` is
        // the host's clock and not pinned: a drive with no clock answers `null`, one
        // with a filesystem answers the time the seed was written.
        partial: {
          id: CORPUS_APP.id,
          name: CORPUS_APP.name,
          appLoc: CORPUS_APP.appLoc,
          streamWebFolder: CORPUS_APP.streamWebFolder,
          publishedAt: CORPUS_APP.publishedAt,
          entryFile: "index.html",
          entryFileExists: true,
          url: `/app/${CORPUS_APP.id}/`
        }
      }
    },
    {
      id: "app-detail-frontend",
      route: "GET /SASjsApi/app/{id}",
      description: "describes an app published as a frontend, from the folder its name derives",
      // the two shapes an index can hold, and the folder each is read from: this
      // entry names no `appLoc` and no `streamWebFolder`, so the folder has to come
      // from the name
      appStream: [FRONTEND_APP],
      seed: { [FRONTEND_ENTRY_FILE]: "<!doctype html><title>frontend</title>" },
      request: { subject: SUBJECT2, params: { id: FRONTEND_APP.id } },
      expect: {
        status: 200,
        partial: {
          id: FRONTEND_APP.id,
          name: FRONTEND_APP.name,
          frontendFolder: `/apps/${FRONTEND_APP.name}`,
          entryFile: "index.html",
          entryFileExists: true,
          url: `/app/${FRONTEND_APP.id}/`
        }
      }
    },
    {
      id: "app-detail-entry-file-missing",
      route: "GET /SASjsApi/app/{id}",
      description: "answers the entry as registered with no file and no date, for a deployment that is gone",
      // the index entry outlived its folder: no seed, so nothing is deployed
      request: { subject: SUBJECT2, params: { id: CORPUS_APP.id } },
      expect: {
        status: 200,
        partial: { entryFileExists: false, lastModified: null }
      }
    },
    {
      id: "app-detail-denied",
      route: "GET /SASjsApi/app/{id}",
      description: "conceals a registered app from a caller without a stream grant",
      request: {
        subject: { userId: "user-restricted", clientId: "web_app" },
        params: { id: CORPUS_APP.id }
      },
      expect: { status: 404, error: "No App Stream is registered with that id." }
    },
    {
      id: "app-detail-unknown-id",
      route: "GET /SASjsApi/app/{id}",
      description: "refuses an id the index does not hold, in the route’s own wording",
      request: {
        subject: SUBJECT2,
        params: { id: "9a9a9a9a-9a9a-4a9a-8a9a-9a9a9a9a9a9a" }
      },
      expect: { status: 404, error: "No App Stream is registered with that id." }
    }
  ];

  // src/corpus/session.ts
  var ADMIN3 = { userId: "user-admin", clientId: "web_app" };
  var RESTRICTED3 = { userId: "user-restricted", clientId: "web_app" };
  var notFound2 = (id) => `Session with ID '${id}' was not found.`;
  var UNAUTHORIZED = "Unauthorized";
  var SESSION_CORPUS = [
    // ---------------------------------------------------------------- summary
    {
      id: "session-summary-own",
      route: "GET /SASjsApi/session/{sessionId}",
      description: "answers the owner the summary of their own session",
      request: { subject: ADMIN3, params: { sessionId: "sess-admin" } },
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
      request: { subject: ADMIN3, params: { sessionId: "sess-restricted" } },
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
      request: { subject: RESTRICTED3, params: { sessionId: "sess-admin" } },
      expect: { status: 404, error: notFound2("sess-admin") }
    },
    {
      id: "session-summary-unknown",
      route: "GET /SASjsApi/session/{sessionId}",
      description: "answers the same 404 for a session that does not exist",
      request: { subject: ADMIN3, params: { sessionId: "sess-nope" } },
      expect: { status: 404, error: notFound2("sess-nope") }
    },
    // -------------------------------------------------------------------- log
    {
      id: "session-log-own",
      route: "GET /SASjsApi/session/{sessionId}/log",
      description: "answers the log this session wrote",
      request: { subject: ADMIN3, params: { sessionId: "sess-admin" } },
      expect: {
        status: 200,
        contents: "NOTE: session started\nNOTE: session completed\n"
      }
    },
    {
      id: "session-log-nothing-written",
      route: "GET /SASjsApi/session/{sessionId}/log",
      description: "answers an empty body for a session that has written nothing",
      request: { subject: ADMIN3, params: { sessionId: "sess-silent" } },
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
      request: { subject: RESTRICTED3, params: { sessionId: "sess-admin" } },
      expect: { status: 404, error: notFound2("sess-admin") }
    },
    // ----------------------------------------------------------------- output
    {
      id: "session-output-own",
      route: "GET /SASjsApi/session/{sessionId}/output",
      description: "answers the webout this session produced",
      request: { subject: ADMIN3, params: { sessionId: "sess-admin" } },
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
      request: { subject: RESTRICTED3, params: { sessionId: "sess-admin" } },
      expect: { status: 404, error: notFound2("sess-admin") }
    },
    // ------------------------------------------------------------------ state
    {
      id: "session-state-own",
      route: "GET /SASjsApi/session/{sessionId}/state",
      description: "answers the run time's state for this session",
      request: { subject: RESTRICTED3, params: { sessionId: "sess-restricted" } },
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
      request: { subject: RESTRICTED3, params: { sessionId: "sess-admin" } },
      expect: { status: 404, error: notFound2("sess-admin") }
    }
  ];

  // src/corpus/runtime.ts
  var ADMIN4 = { userId: "user-admin", clientId: "web_app" };
  var RESTRICTED4 = { userId: "user-restricted", clientId: "web_app" };
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
      request: { subject: ADMIN4, query: { _program: PROGRAM } },
      runOutput: { contents: "hello from the program" },
      expect: { status: 200, contents: "hello from the program" }
    },
    {
      id: "stp-execute-get-answers-bytes",
      route: "GET /SASjsApi/stp/execute",
      description: "answers an output that is bytes as bytes",
      request: { subject: ADMIN4, query: { _program: PROGRAM } },
      runOutput: { contents: bytes2(1, 2, 3) },
      expect: { status: 200, contents: bytes2(1, 2, 3) }
    },
    {
      id: "stp-execute-get-missing-program",
      route: "GET /SASjsApi/stp/execute",
      description: "refuses a request that names no program",
      request: { subject: ADMIN4, query: {} },
      expect: { status: 400, error: '"_program" is required' }
    },
    {
      id: "stp-execute-get-failed-run",
      route: "GET /SASjsApi/stp/execute",
      description: "answers 400 when the program could not be run",
      request: { subject: ADMIN4, query: { _program: PROGRAM } },
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
      request: { subject: ADMIN4, body: { _program: PROGRAM } },
      runOutput: { contents: "hello from the body" },
      expect: { status: 200, contents: "hello from the body" }
    },
    {
      id: "stp-execute-post-query-program",
      route: "POST /SASjsApi/stp/execute",
      description: "runs the program the query names, with no body",
      request: { subject: ADMIN4, query: { _program: PROGRAM }, body: {} },
      runOutput: { contents: "hello from the query" },
      expect: { status: 200, contents: "hello from the query" }
    },
    {
      id: "stp-execute-post-no-program",
      route: "POST /SASjsApi/stp/execute",
      description: "refuses a request with no program in the query or the body",
      request: { subject: ADMIN4, body: {} },
      expect: { status: 400, error: '"_program" is required' }
    },
    {
      id: "stp-execute-post-failed-run",
      route: "POST /SASjsApi/stp/execute",
      description: "answers 400 when the program could not be run",
      request: { subject: ADMIN4, body: { _program: PROGRAM } },
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
      request: { subject: ADMIN4, query: { _program: PROGRAM } },
      expect: { status: 200, keys: ["sessionId"] }
    },
    {
      id: "stp-trigger-retention",
      route: "POST /SASjsApi/stp/trigger",
      description: "accepts a retention in minutes, as the query carries it",
      request: {
        subject: ADMIN4,
        query: { _program: PROGRAM, expiresAfterMins: "15" }
      },
      expect: { status: 200, keys: ["sessionId"] }
    },
    {
      id: "stp-trigger-retention-not-positive",
      route: "POST /SASjsApi/stp/trigger",
      description: "refuses a retention that is not a positive number of minutes",
      request: {
        subject: ADMIN4,
        query: { _program: PROGRAM, expiresAfterMins: "0" }
      },
      expect: { status: 400, error: '"expiresAfterMins" must be greater than 0' }
    },
    {
      id: "stp-trigger-missing-program",
      route: "POST /SASjsApi/stp/trigger",
      description: "refuses a request that names no program",
      request: { subject: ADMIN4, query: {} },
      expect: { status: 400, error: '"_program" is required' }
    },
    {
      id: "stp-trigger-failed-run",
      route: "POST /SASjsApi/stp/trigger",
      description: "answers 400 when the program could not be started",
      request: { subject: ADMIN4, query: { _program: PROGRAM } },
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
      request: { subject: ADMIN4, body: { code: CODE, runTime: "sas" } },
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
      request: { subject: ADMIN4, body: { code: CODE, runTime: "cobol" } },
      expect: { status: 400 }
    },
    {
      id: "code-execute-missing-code",
      route: "POST /SASjsApi/code/execute",
      description: "refuses a payload with no code",
      request: { subject: ADMIN4, body: { runTime: "sas" } },
      expect: { status: 400, error: '"code" is required' }
    },
    {
      id: "code-execute-empty-code",
      route: "POST /SASjsApi/code/execute",
      description: "refuses code that is present but empty",
      request: { subject: ADMIN4, body: { code: "", runTime: "sas" } },
      expect: { status: 400, error: '"code" is not allowed to be empty' }
    },
    {
      id: "code-execute-non-string-code",
      route: "POST /SASjsApi/code/execute",
      description: "refuses code that is not a string rather than running its text",
      request: { subject: ADMIN4, body: { code: 123, runTime: "sas" } },
      expect: { status: 400, error: '"code" must be a string' }
    },
    {
      id: "code-execute-failed-run",
      route: "POST /SASjsApi/code/execute",
      description: "answers 400 when the code could not be run",
      request: { subject: ADMIN4, body: { code: CODE, runTime: "sas" } },
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
    {
      // The fixture denies this account `/SASjsApi/code/execute` with a user rule,
      // and a denied rule refuses the call rather than only the menu entry beside
      // it. On a server that is `authorize`; here it is the decision
      // `myAuthorizedRoutes` reports from, asked of the same store.
      id: "code-execute-denied-by-a-rule",
      route: "POST /SASjsApi/code/execute",
      description: "refuses a caller the rules do not grant, with the 401 a missing token earns",
      request: { subject: RESTRICTED4, body: { code: CODE, runTime: "sas" } },
      expect: { status: 401, error: UNAUTHORIZED2 }
    },
    {
      // The positive control for the case above: the same account is granted
      // `stp/execute` by a group rule, so the refusal there is the rule and not a
      // blanket refusal of everything a restricted account asks for.
      id: "stp-execute-granted-by-a-group-rule",
      route: "POST /SASjsApi/stp/execute",
      description: "admits a restricted account the rules grant",
      request: { subject: RESTRICTED4, body: { _program: PROGRAM } },
      runOutput: { contents: "granted run" },
      expect: { status: 200, contents: "granted run" }
    },
    // ----------------------------------------------- POST /code/trigger
    {
      id: "code-trigger-answers-session",
      route: "POST /SASjsApi/code/trigger",
      description: "answers the session a caller polls, and no pid from a mock",
      request: { subject: ADMIN4, body: { code: CODE, runTime: "sas" } },
      expect: { status: 200, keys: ["sessionId"] }
    },
    {
      id: "code-trigger-missing-runtime",
      route: "POST /SASjsApi/code/trigger",
      description: "refuses a payload with no run time, which the document requires",
      request: { subject: ADMIN4, body: { code: CODE } },
      expect: { status: 400, error: '"runTime" is required' }
    },
    {
      id: "code-trigger-retention-not-positive",
      route: "POST /SASjsApi/code/trigger",
      description: "refuses a retention that is not a positive number of minutes",
      request: {
        subject: ADMIN4,
        body: { code: CODE, runTime: "sas", expiresAfterMins: 0 }
      },
      expect: { status: 400, error: '"expiresAfterMins" must be greater than 0' }
    },
    {
      id: "code-trigger-failed-run",
      route: "POST /SASjsApi/code/trigger",
      description: "answers 400 when the code could not be started",
      request: { subject: ADMIN4, body: { code: CODE, runTime: "sas" } },
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
  var ADMIN5 = "admin-access";
  var RESTRICTED5 = "user-access";
  var RESTRICTED_UID = "user-restricted";
  var ADMIN_UID = "user-admin";
  var RECORD_CORPUS = [
    // ------------------------------------------------------------------ users
    {
      id: "list-users",
      route: "GET /SASjsApi/user",
      description: "lists the accounts any signed-in caller may see",
      identity: ADMIN_SIGNED_IN,
      request: { token: ADMIN5 },
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
      request: { token: RESTRICTED5, params: { uid: RESTRICTED_UID } },
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
      request: { token: ADMIN5, params: { uid: "user-none" } },
      expect: { status: 404, error: "User is not found." }
    },
    {
      id: "get-user-by-username",
      route: "GET /SASjsApi/user/by/username/{username}",
      description: "finds an account by username",
      identity: ADMIN_SIGNED_IN,
      request: { token: ADMIN5, params: { username: "sasjsuser" } },
      expect: {
        status: 200,
        partial: { uid: RESTRICTED_UID, username: "sasjsuser", isAdmin: false }
      }
    },
    {
      id: "get-user-by-username-mixed-case",
      route: "GET /SASjsApi/user/by/username/{username}",
      description: "finds the account when the path names it in another case",
      identity: ADMIN_SIGNED_IN,
      request: { token: ADMIN5, params: { username: "SASJSUSER" } },
      expect: { status: 200, partial: { uid: RESTRICTED_UID } }
    },
    {
      id: "get-user-by-username-refused-name",
      route: "GET /SASjsApi/user/by/username/{username}",
      description: "refuses a path parameter the username schema does not allow",
      identity: ADMIN_SIGNED_IN,
      request: { token: ADMIN5, params: { username: "a-b" } },
      expect: {
        status: 400,
        error: '"username" must only contain alpha-numeric characters'
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
      request: { token: ADMIN5, params: { username: "nobody" } },
      expect: { status: 404, error: "User is not found." }
    },
    {
      id: "create-user",
      route: "POST /SASjsApi/user",
      description: "creates an account, sanitised, and reports it",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN5,
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
        token: RESTRICTED5,
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
        token: ADMIN5,
        body: {
          username: "sasjsuser",
          displayName: "Another",
          password: "newpass"
        }
      },
      expect: { status: 409, error: "Username already exists." }
    },
    {
      id: "create-user-bad-admin-flag",
      route: "POST /SASjsApi/user",
      description: "refuses an isAdmin the schema does not call a boolean",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN5,
        body: {
          username: "flaguser",
          displayName: "Flag User",
          password: "password",
          isAdmin: "yes"
        }
      },
      expect: { status: 400, error: '"isAdmin" must be a boolean' }
    },
    {
      id: "create-user-bad-active-flag",
      route: "POST /SASjsApi/user",
      description: "refuses an isActive the schema does not call a boolean",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN5,
        body: {
          username: "flaguser",
          displayName: "Flag User",
          password: "password",
          isActive: "sometimes"
        }
      },
      expect: { status: 400, error: '"isActive" must be a boolean' }
    },
    {
      id: "create-user-not-admin-incomplete",
      route: "POST /SASjsApi/user",
      description: "refuses a non-admin before it reads the body it sent",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: RESTRICTED5,
        body: { username: "incomplete" }
      },
      expect: { status: 401, error: "Admin account required" }
    },
    {
      id: "update-user",
      route: "PATCH /SASjsApi/user/{uid}",
      description: "changes an account's display name",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN5,
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
        token: RESTRICTED5,
        params: { uid: ADMIN_UID },
        // the body is one the schema would refuse too, so the case only passes when
        // the caller is gated before the body is read, as the middleware order has it
        body: { isAdmin: "yes" }
      },
      expect: { status: 401, error: "Admin account required" }
    },
    {
      id: "update-user-empty-body",
      route: "PATCH /SASjsApi/user/{uid}",
      description: "applies an update that omits every field, which the controller stores as an empty name",
      identity: ADMIN_SIGNED_IN,
      request: { token: ADMIN5, params: { uid: RESTRICTED_UID }, body: {} },
      // the controller always puts the sanitised display name into the update, so an
      // omitted one is written as the empty string rather than left as it was
      expect: {
        status: 200,
        partial: { uid: RESTRICTED_UID, displayName: "" }
      }
    },
    {
      id: "update-user-self-admin-flag",
      route: "PATCH /SASjsApi/user/{uid}",
      description: "refuses a flag only an administrator may send, on the caller's own account",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: RESTRICTED5,
        params: { uid: RESTRICTED_UID },
        body: { isAdmin: true }
      },
      expect: { status: 400, error: '"isAdmin" is not allowed' }
    },
    {
      id: "update-user-by-username-self-admin-flag",
      route: "PATCH /SASjsApi/user/by/username/{username}",
      description: "refuses a flag only an administrator may send, by username",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: RESTRICTED5,
        params: { username: "sasjsuser" },
        body: { isAdmin: true }
      },
      expect: { status: 400, error: '"isAdmin" is not allowed' }
    },
    {
      id: "update-user-missing",
      route: "PATCH /SASjsApi/user/{uid}",
      description: "answers 404 with the identifier it looked up",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN5,
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
        token: ADMIN5,
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
        token: ADMIN5,
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
        token: ADMIN5,
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
        token: RESTRICTED5,
        params: { username: "sasjsadmin" },
        // a body the schema would refuse for this caller, so the case only passes
        // when the caller is gated before the body is read
        body: { isAdmin: "yes" }
      },
      expect: { status: 401, error: "Admin account required" }
    },
    {
      id: "update-user-by-username-mixed-case",
      route: "PATCH /SASjsApi/user/by/username/{username}",
      description: "finds the account when the path names it in another case",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN5,
        params: { username: "SASJSUSER" },
        body: { displayName: "Renamed User" }
      },
      expect: {
        status: 200,
        partial: { uid: RESTRICTED_UID, displayName: "Renamed User" }
      }
    },
    {
      id: "update-user-by-username-parameter-before-body",
      route: "PATCH /SASjsApi/user/by/username/{username}",
      description: "refuses the path parameter before the body it is sent with",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN5,
        params: { username: "a-b" },
        body: { displayName: "x" }
      },
      expect: {
        status: 400,
        error: '"username" must only contain alpha-numeric characters'
      }
    },
    {
      id: "update-user-by-username-refused-name",
      route: "PATCH /SASjsApi/user/by/username/{username}",
      description: "refuses a path parameter the username schema does not allow",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN5,
        params: { username: "a-b" },
        body: { displayName: "Renamed User" }
      },
      expect: {
        status: 400,
        error: '"username" must only contain alpha-numeric characters'
      }
    },
    {
      id: "update-user-by-username-missing",
      route: "PATCH /SASjsApi/user/by/username/{username}",
      description: "answers 404 with the username it looked up",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN5,
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
        token: ADMIN5,
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
        token: ADMIN5,
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
      request: { token: ADMIN5, params: { uid: RESTRICTED_UID }, body: {} },
      expect: { status: 200, body: "Account Deleted!" }
    },
    {
      id: "delete-user-not-admin",
      route: "DELETE /SASjsApi/user/{uid}",
      description: "refuses a deletion of somebody else's account",
      identity: ADMIN_SIGNED_IN,
      request: { token: RESTRICTED5, params: { uid: ADMIN_UID }, body: {} },
      expect: { status: 401, error: "Admin account required" }
    },
    {
      id: "delete-user-not-admin-no-password",
      route: "DELETE /SASjsApi/user/{uid}",
      description: "requires the caller's own password when it is not an admin",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: RESTRICTED5,
        params: { uid: RESTRICTED_UID },
        body: {}
      },
      expect: { status: 400, error: '"password" is required' }
    },
    {
      id: "delete-user-missing",
      route: "DELETE /SASjsApi/user/{uid}",
      description: "answers 404 for an identifier no account has",
      identity: ADMIN_SIGNED_IN,
      request: { token: ADMIN5, params: { uid: "user-none" }, body: {} },
      expect: { status: 404, error: "User is not found." }
    },
    {
      id: "delete-user-by-username",
      route: "DELETE /SASjsApi/user/by/username/{username}",
      description: "deletes an account looked up by username",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN5,
        params: { username: "sasjsuser" },
        body: {}
      },
      expect: { status: 200, body: "Account Deleted!" }
    },
    {
      id: "delete-user-admin-bodys-refused",
      route: "DELETE /SASjsApi/user/by/username/{username}",
      description: "refuses a body an administrator's deletion takes none of",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN5,
        params: { username: "sasjsuser" },
        body: { password: "Orion123" }
      },
      expect: { status: 400, error: '"password" is not allowed' }
    },
    {
      id: "delete-user-by-username-extra-key",
      route: "DELETE /SASjsApi/user/by/username/{username}",
      description: "refuses a key outside the password a self-deletion carries",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: RESTRICTED5,
        params: { username: "sasjsuser" },
        body: { password: "Orion123", extra: 1 }
      },
      expect: { status: 400, error: '"extra" is not allowed' }
    },
    {
      id: "delete-user-by-username-parameter-before-body",
      route: "DELETE /SASjsApi/user/by/username/{username}",
      description: "refuses the path parameter before the body it is sent with",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN5,
        params: { username: "a-b" },
        body: { password: "Orion123" }
      },
      expect: {
        status: 400,
        error: '"username" must only contain alpha-numeric characters'
      }
    },
    {
      id: "delete-user-by-username-short-password",
      route: "DELETE /SASjsApi/user/by/username/{username}",
      description: "refuses a password shorter than the schema allows, uncompared",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: RESTRICTED5,
        params: { username: "sasjsuser" },
        body: { password: "abc" }
      },
      expect: {
        status: 400,
        error: '"password" length must be at least 6 characters long'
      }
    },
    {
      id: "delete-user-by-username-no-password",
      route: "DELETE /SASjsApi/user/by/username/{username}",
      description: "requires the caller's own password for a self-deletion",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: RESTRICTED5,
        params: { username: "sasjsuser" },
        body: {}
      },
      expect: { status: 400, error: '"password" is required' }
    },
    {
      id: "delete-user-by-username-wrong-password",
      route: "DELETE /SASjsApi/user/by/username/{username}",
      description: "refuses a self-deletion whose password is wrong",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: RESTRICTED5,
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
      request: { token: ADMIN5, params: { username: "nobody" }, body: {} },
      expect: { status: 404, error: "User is not found." }
    },
    // ----------------------------------------------------------------- groups
    {
      id: "list-groups",
      route: "GET /SASjsApi/group",
      description: "lists the groups",
      identity: ADMIN_SIGNED_IN,
      request: { token: RESTRICTED5 },
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
      request: { token: RESTRICTED5, params: { uid: "group-admins" } },
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
      request: { token: ADMIN5, params: { uid: "group-none" } },
      expect: { status: 404, error: "Group not found." }
    },
    {
      id: "get-group-by-name",
      route: "GET /SASjsApi/group/by/groupname/{name}",
      description: "finds a group by name",
      identity: ADMIN_SIGNED_IN,
      request: { token: ADMIN5, params: { name: "DCGroup" } },
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
      request: { token: ADMIN5, params: { name: "nope" } },
      expect: { status: 404, error: "Group not found." }
    },
    {
      id: "create-group",
      route: "POST /SASjsApi/group",
      description: "creates a group with no members",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN5,
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
        token: RESTRICTED5,
        body: { name: "NewGroup", description: "x" }
      },
      expect: { status: 401, error: "Admin account required" }
    },
    {
      id: "create-group-duplicate",
      route: "POST /SASjsApi/group",
      description: "refuses a name that is taken",
      identity: ADMIN_SIGNED_IN,
      request: { token: ADMIN5, body: { name: "DCGroup", description: "again" } },
      expect: { status: 409, error: "Group name already exists." }
    },
    {
      id: "create-group-empty-description",
      route: "POST /SASjsApi/group",
      description: "refuses an empty description, which the schema does not allow",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN5,
        body: { name: "EmptyDescription", description: "" }
      },
      expect: {
        status: 400,
        error: '"description" is not allowed to be empty'
      }
    },
    {
      id: "create-group-no-description",
      route: "POST /SASjsApi/group",
      description: "creates a group whose description the caller left out",
      identity: ADMIN_SIGNED_IN,
      request: { token: ADMIN5, body: { name: "NoDescription" } },
      expect: {
        status: 200,
        partial: { name: "NoDescription", description: "Group description." }
      }
    },
    {
      id: "create-group-bad-active-flag",
      route: "POST /SASjsApi/group",
      description: "refuses an isActive the schema does not call a boolean",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN5,
        body: { name: "FlagGroup", description: "a group", isActive: "yes" }
      },
      expect: { status: 400, error: '"isActive" must be a boolean' }
    },
    {
      id: "add-user-to-group",
      route: "POST /SASjsApi/group/{groupUid}/{userUid}",
      description: "adds a member and returns the group",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN5,
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
        token: ADMIN5,
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
        token: RESTRICTED5,
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
        token: ADMIN5,
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
        token: ADMIN5,
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
        token: ADMIN5,
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
        token: ADMIN5,
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
        token: ADMIN5,
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
        token: ADMIN5,
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
        token: RESTRICTED5,
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
        token: ADMIN5,
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
        token: ADMIN5,
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
      request: { token: ADMIN5, params: { uid: "group-data-controller" } },
      expect: { status: 200 }
    },
    {
      id: "delete-group-not-admin",
      route: "DELETE /SASjsApi/group/{uid}",
      description: "refuses a deletion by a caller who is not an administrator",
      identity: ADMIN_SIGNED_IN,
      request: { token: RESTRICTED5, params: { uid: "group-admins" } },
      expect: { status: 401, error: "Admin account required" }
    },
    {
      id: "delete-group-missing",
      route: "DELETE /SASjsApi/group/{uid}",
      description: "answers 404 for an identifier no group has",
      identity: ADMIN_SIGNED_IN,
      request: { token: ADMIN5, params: { uid: "group-none" } },
      expect: { status: 404, error: "Group not found." }
    },
    // ------------------------------------------------------------ permissions
    {
      id: "authorized-routes-as-admin",
      route: "GET /SASjsApi/info/authorizedRoutes",
      description: "answers the route inventory to an administrator",
      identity: ADMIN_SIGNED_IN,
      request: { token: ADMIN5 },
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
      request: { token: RESTRICTED5 },
      expect: { status: 401, error: "Admin account required" }
    },
    {
      id: "my-authorized-routes-as-admin",
      route: "GET /SASjsApi/info/myAuthorizedRoutes",
      description: "answers every route to an administrator",
      identity: ADMIN_SIGNED_IN,
      request: { token: ADMIN5 },
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
      request: { token: RESTRICTED5 },
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
      request: { token: ADMIN5 },
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
      request: { token: RESTRICTED5 },
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
        token: ADMIN5,
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
        token: ADMIN5,
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
        token: ADMIN5,
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
        token: ADMIN5,
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
      // an empty body, which the document requires five fields of, so the case only
      // passes when the caller is refused before the schema is consulted
      request: { token: RESTRICTED5, body: {} },
      expect: { status: 401, error: "Admin account required" }
    },
    {
      id: "create-permission-missing-principal",
      route: "POST /SASjsApi/permission",
      description: "answers 404 for a principal that does not exist",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN5,
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
        token: ADMIN5,
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
        token: ADMIN5,
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
        token: ADMIN5,
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
      // `setting` is required, so an empty body only reaches 401 when the gate runs first
      request: { token: RESTRICTED5, params: { uid: "rule-code" }, body: {} },
      expect: { status: 401, error: "Admin account required" }
    },
    {
      id: "update-permission-missing",
      route: "PATCH /SASjsApi/permission/{uid}",
      description: "answers 404 for a rule that does not exist",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN5,
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
      request: { token: ADMIN5, params: { uid: "rule-code" } },
      expect: { status: 200, body: "Permission Deleted!" }
    },
    {
      id: "delete-permission-not-admin",
      route: "DELETE /SASjsApi/permission/{uid}",
      description: "refuses a deletion by a non-administrator",
      identity: ADMIN_SIGNED_IN,
      request: { token: RESTRICTED5, params: { uid: "rule-code" } },
      expect: { status: 401, error: "Admin account required" }
    },
    {
      id: "delete-permission-missing",
      route: "DELETE /SASjsApi/permission/{uid}",
      description: "answers 404 for a rule that does not exist",
      identity: ADMIN_SIGNED_IN,
      request: { token: ADMIN5, params: { uid: "rule-none" } },
      expect: { status: 404, error: "Permission not found." }
    },
    // --------------------------------------------------------------- clients
    {
      id: "list-clients",
      route: "GET /SASjsApi/client",
      description: "lists the registered clients",
      identity: ADMIN_SIGNED_IN,
      request: { token: ADMIN5 },
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
      request: { token: RESTRICTED5 },
      expect: { status: 401, error: "Admin account required" }
    },
    {
      id: "create-client",
      route: "POST /SASjsApi/client",
      description: "registers a client",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN5,
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
        token: ADMIN5,
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
      // the document requires `clientId` here, so an empty body would be refused
      // first by a host that validated before it gated
      request: { token: RESTRICTED5, body: {} },
      expect: { status: 401, error: "Admin account required" }
    },
    {
      id: "create-client-duplicate",
      route: "POST /SASjsApi/client",
      description: "refuses a client id that is registered, with the 403 the server sends",
      identity: ADMIN_SIGNED_IN,
      request: {
        token: ADMIN5,
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
        token: RESTRICTED5,
        body: { currentPassword: "Orion123", newPassword: "changed123" }
      },
      expect: { status: 204 }
    },
    {
      id: "update-password-missing-field",
      route: "PATCH /SASjsApi/auth/updatePassword",
      description: "refuses a body without the current password",
      identity: ADMIN_SIGNED_IN,
      request: { token: RESTRICTED5, body: { newPassword: "changed123" } },
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
        token: RESTRICTED5,
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

  // src/appstream/store.ts
  var APP_STREAM_INDEX = "/.sasjs/apps.json";
  var isEntry = (value) => {
    if (typeof value !== "object" || value === null) return false;
    const entry = value;
    if (typeof entry.id !== "string" || typeof entry.name !== "string" || typeof entry.publishedAt !== "string")
      return false;
    if (entry.appLoc !== void 0 && typeof entry.appLoc !== "string")
      return false;
    if (entry.streamWebFolder !== void 0 && typeof entry.streamWebFolder !== "string")
      return false;
    return !(entry.streamWebFolder !== void 0 && entry.appLoc === void 0);
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
  return __toCommonJS(index_exports);
})();
if (typeof self !== 'undefined') self.SASjsApi = SASjsApi
