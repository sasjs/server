# SASjs Server container image.
#
# Built from this repository's own source. The base image is pinned by
# digest so the build is reproducible; bump it deliberately.
#
# The container contract this image follows is documented in
# container/README.md: plain HTTP on 5000, one writable path (DATA_DIR),
# non-root application user, everything else configured by environment.
#
# The build context is the repository root; BuildKit uses
# container/Dockerfile.dockerignore (not the root .dockerignore, which is
# written for the development compose files and would exclude api/public).

FROM cloudron/node-base:24-20260920@sha256:d984683ec59bf2379130bf41cf3c2b6bc0453f327297d7183525cb05424e7b34

# Node ships with this base image (the 'js' runtime). Python does not, so add
# it for the 'py' runtime.
#
# linux-libc-dev is pulled up to the archive's current version as well. The
# base image ships the release-pocket build, and the kernel headers carry a
# stream of CVEs that would otherwise trip the OS-layer scan gate on every
# build with something this repo cannot act on.
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 linux-libc-dev && \
    rm -rf /var/lib/apt/lists/*

COPY web/ /usr/server/web/

# The web bundle must exist before the api build: the api's build copies
# ../web/build into its own tree, which is where the server serves the UI
# from.
RUN set -eux; \
    cd /usr/server/web; \
    npm ci --no-audit --no-fund; \
    npm run build; \
    rm -rf /usr/server/web/node_modules

COPY api/ /usr/server/api/

# The api's own build compiles TypeScript and pulls in the web bundle, the
# SASjs core macros and the swagger spec. node_modules is kept in full - the
# built server requires it at runtime.
#
# Do NOT add `npm prune --omit=dev` here. `dotenv` is listed under
# devDependencies even though app.ts, setProcessVariables.ts and sas9-web.ts
# import it at runtime, so pruning removes a module the server cannot start
# without: the container dies with "Error: Cannot find module 'dotenv'".
RUN set -eux; \
    cd /usr/server/api; \
    npm ci --no-audit --no-fund; \
    npm run build; \
    test -f /usr/server/api/build/src/server.js; \
    test -d /usr/server/api/web/build

COPY container/entrypoint.sh /usr/server/entrypoint.sh
RUN chmod +x /usr/server/entrypoint.sh

# The default DATA_DIR. Mount it to persist the SASjs Drive, logs, uploads
# and the generated admin password.
VOLUME ["/usr/server/data"]

EXPOSE 5000

CMD [ "/usr/server/entrypoint.sh" ]
