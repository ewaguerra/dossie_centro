#!/usr/bin/env python3
"""Servidor proxy para projeto_centro — resolve paths sem alterar HTML."""
import http.server
import os
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
ROOT = os.path.dirname(os.path.abspath(__file__))

class ProxyHandler(http.server.SimpleHTTPRequestHandler):
    # Vendor third-party (MapLibre etc.) tem nome estável e nunca muda em dev:
    # pode ser imutável. Qualquer outra coisa do projeto é mutável e precisa
    # revalidar a cada request — senão tiles antigos, JS antigo ou CSS antigo
    # ficam fantasiando o navegador (bug "Access blocked / 403" do OSM, etc.).
    IMMUTABLE_PREFIXES = ('/vendor/', '/app/vendor/')

    def end_headers(self):
        request_path = (self.path or '').split('?', 1)[0]

        if request_path.startswith(self.IMMUTABLE_PREFIXES):
            self.send_header('Cache-Control', 'public, max-age=31536000, immutable')
        else:
            # no-cache != no-store: o navegador pode guardar a resposta, mas
            # PRECISA revalidar com o servidor (If-Modified-Since / ETag)
            # antes de usá-la. Em dev isso devolve 304 quase sempre — rápido e
            # imune a placeholders fantasmas.
            self.send_header('Cache-Control', 'no-cache, must-revalidate')

        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()

    def translate_path(self, path):
        # Legado: mídia da landing costumava apontar para /pages/centro/assets/
        if path.startswith('/pages/centro/assets/'):
            rel = path[len('/pages/centro/assets/'):]
            landing_asset = os.path.join(ROOT, 'landing', 'assets', rel)
            if os.path.exists(landing_asset):
                return landing_asset

        # /pages/centro/* → ./centro/* (HTML, JS, CSS, data, ícones do mapa)
        if path.startswith('/pages/centro/'):
            rel = path[len('/pages/centro/'):]
            translated = os.path.join(ROOT, 'centro', rel)
            if os.path.exists(translated):
                return translated

        # /app/vendor/maplibre/* → ./node_modules/maplibre-gl/dist/*
        if path.startswith('/app/vendor/maplibre/'):
            rel = path[len('/app/vendor/maplibre/'):]
            # Try dist/ first
            translated = os.path.join(ROOT, 'node_modules', 'maplibre-gl', 'dist', rel)
            if os.path.exists(translated):
                return translated

        # /app/vendor/* → ./vendor/app/vendor/*
        if path.startswith('/app/vendor/'):
            rel = path[len('/app/vendor/'):]
            translated = os.path.join(ROOT, 'vendor', 'app', 'vendor', rel)
            if os.path.exists(translated):
                return translated

        # /app/* → ./vendor/app/*
        if path.startswith('/app/'):
            rel = path[len('/app/'):]
            translated = os.path.join(ROOT, 'vendor', 'app', rel)
            if os.path.exists(translated):
                return translated

        # Default: serve from ROOT
        return super().translate_path(path)

    def log_message(self, format, *args):
        status = args[1] if len(args) > 1 else '?'
        status_ok = '' if str(status).startswith('2') else ' ←'
        if status_ok:
            print(f"  [{status}] {args[0]}", flush=True)

if __name__ == '__main__':
    os.chdir(ROOT)
    server = http.server.HTTPServer(('127.0.0.1', PORT), ProxyHandler)
    print(f"🚀 Servidor proxy rodando em http://127.0.0.1:{PORT}")
    print(f"   Projeto: {ROOT}")
    print(f"   Paths /pages/centro/ → /centro/, /pages/centro/assets/ → /landing/assets/, /app/ → /vendor/app/")
    print(f"   Ctrl+C para parar.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor encerrado.")
        server.server_close()
