---
layout: article
title: API
description: The SASjs Server REST API - every endpoint, its parameters and its responses, rendered from the OpenAPI specification the server itself serves.
---

# API

SASjs Server speaks REST under `/SASjsApi`, and the specification below is the same one a running server publishes at `/swagger.yaml` (and renders at `/SASjsApi/`). Every release ships its own copy, so the reference always describes the endpoints that release actually has.

The specification is generated, not checked in: the docs build copies `api/public/swagger.yaml` - the document tsoa generates from the controllers - to `docs/pages/swagger.yaml` and renders it. There is one authored copy, so the reference cannot quietly fall behind the code.

## Authentication

In `MODE=server` every endpoint except `/SASjsApi/info` and `/SASjsApi/auth/*` needs a credential:

| Caller | Credential |
| --- | --- |
| a script or server | `Authorization: Bearer <access_token>`, from `POST /SASjsApi/auth/token` |
| a browser app | the session cookie the login page sets |

`MODE=desktop` is single-user and unauthenticated, so calls need no header at all. See [Authentication](auth.md) for the token, refresh and OIDC details, and [Authorisation](permissions.md) for the per-user and per-group rules that decide who may call what.

## Try it out

The reference is a static render of the specification: this site has no server behind it, so "Try it out" cannot reach an instance from here. To send the calls, open `/SASjsApi/` on a running server - it serves the same specification with a live Swagger UI, and the request goes to that instance.

The examples in [Deployment](deployment.md) show the equivalent `curl` calls.

## The reference

<swagger-ui src="swagger.yaml"/>
