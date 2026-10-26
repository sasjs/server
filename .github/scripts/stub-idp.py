#!/usr/bin/env python3
"""A minimal OpenID Connect provider, for testing the sign-in redirect.

Serves just enough of a discovery document for the app to build its
authorization request, plus an authorization endpoint to redirect to. It does
NOT validate tokens or issue codes - nothing here verifies a real sign-in, and
nothing should use it outside a test.

    python3 stub-idp.py [port]        # default 8899
"""

import json
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def _send(self, payload, content_type="application/json"):
        body = json.dumps(payload).encode()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        port = self.server.server_address[1]
        issuer = f"http://127.0.0.1:{port}"

        if self.path.startswith("/.well-known/openid-configuration"):
            self._send({
                "issuer": issuer,
                "authorization_endpoint": f"{issuer}/authorize",
                "token_endpoint": f"{issuer}/token",
                "jwks_uri": f"{issuer}/jwks",
                "userinfo_endpoint": f"{issuer}/userinfo",
                "end_session_endpoint": f"{issuer}/logout",
                "response_types_supported": ["code"],
                "subject_types_supported": ["public"],
                "id_token_signing_alg_values_supported": ["RS256"],
                "scopes_supported": ["openid", "profile", "email"],
                "code_challenge_methods_supported": ["S256"],
            })
        elif self.path.startswith("/jwks"):
            self._send({"keys": []})
        else:
            self._send({"stub": "idp"}, content_type="text/plain")


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8899
    HTTPServer(("127.0.0.1", port), Handler).serve_forever()


if __name__ == "__main__":
    main()
