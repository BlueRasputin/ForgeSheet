#!/usr/bin/env python3
"""Dev server: http.server with caching disabled so edits always show on refresh.
Run: python3 tools/serve.py [port]"""
import http.server
import os
import sys

os.chdir(os.path.join(os.path.dirname(__file__), ".."))


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()


http.server.ThreadingHTTPServer(("", int(sys.argv[1]) if len(sys.argv) > 1 else 8080), NoCacheHandler).serve_forever()
