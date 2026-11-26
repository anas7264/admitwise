"""ADMITWISE Flask entrypoint.

The server only serves the application shell and a non-sensitive health endpoint.
Student profiles and admission records are stored and evaluated in the browser.
"""
from __future__ import annotations

import os
from flask import Flask, jsonify, make_response, render_template

app = Flask(__name__, static_folder="public", static_url_path="")
app.config["JSON_SORT_KEYS"] = False


@app.get("/")
def home():
    response = make_response(render_template("index.html"))
    # Do not cache the HTML shell; static assets are versioned by deployment.
    response.headers["Cache-Control"] = "no-store, max-age=0"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"
    return response


@app.get("/health")
def health():
    # Deliberately returns no user or browser data.
    return jsonify({"status": "ok", "application": "admitwise", "version": "0.1.0"})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", "5000")), debug=True)
