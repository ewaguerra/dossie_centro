#!/usr/bin/env python3
"""Servidor proxy para dossie_centro_mapa — resolve paths sem alterar HTML."""
import http.server
import os
import sys
import urllib.error
import urllib.request

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
ROOT = os.path.dirname(os.path.abspath(__file__))
BASEMAP_ORIGIN = 'https://tiles.openfreemap.org'

# Superfícies que migraram para repositórios separados — 404 limpo, sem listagem.
REMOVED_PREFIXES = ('/landing/', '/arquivo-morto/', '/arquivista/')


class ProxyHandler(http.server.SimpleHTTPRequestHandler):
    # Vendor third-party (MapLibre etc.) tem nome estável e nunca muda em dev:
    # pode ser imutável. Qualquer outra coisa do projeto é mutável e precisa
    # revalidar a cada request — senão tiles antigos, JS antigo ou CSS antigo
    # ficam fantasiando o navegador (bug "Access blocked / 403" do OSM, etc.).
    IMMUTABLE_PREFIXES = ('/vendor/', '/app/vendor/')

    def send_response(self, code, message=None):
        # Captura o status para que end_headers() possa decidir cache em função
        # dele. Sem isso um 404 em /vendor/ recebia immutable e ficava grudado
        # no navegador por um ano (foi exatamente o que envenenou three.core).
        self._response_code = code
        super().send_response(code, message)

    def end_headers(self):
        request_path = (self.path or '').split('?', 1)[0]
        status = getattr(self, '_response_code', 200)
        is_vendor = request_path.startswith(self.IMMUTABLE_PREFIXES)
        is_success = 200 <= status < 300

        if is_vendor and is_success:
            self.send_header('Cache-Control', 'public, max-age=31536000, immutable')
        elif request_path.startswith('/basemap/') and is_success:
            self.send_header('Cache-Control', 'public, max-age=86400')
        else:
            # no-cache != no-store: o navegador pode guardar a resposta, mas
            # PRECISA revalidar com o servidor (If-Modified-Since / ETag)
            # antes de usá-la. Em dev isso devolve 304 quase sempre — rápido e
            # imune a placeholders fantasmas. Para 404/5xx em /vendor/ esse
            # comportamento é obrigatório: cache de erro é veneno.
            self.send_header('Cache-Control', 'no-cache, must-revalidate')

        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()

    def _proxy_basemap(self, request_path):
        upstream_path = request_path[len('/basemap'):]
        query = ''
        if '?' in self.path:
            query = '?' + self.path.split('?', 1)[1]
        upstream_url = BASEMAP_ORIGIN + upstream_path + query
        try:
            req = urllib.request.Request(
                upstream_url,
                headers={'User-Agent': 'projeto-centro/0.1 (local basemap proxy)'},
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = resp.read()
                self.send_response(resp.status)
                content_type = resp.headers.get('Content-Type', 'application/octet-stream')
                self.send_header('Content-Type', content_type)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(data)
        except urllib.error.HTTPError as err:
            self.send_error(err.code, f'Basemap upstream: {err.reason}')
        except OSError as err:
            self.send_error(502, f'Basemap proxy: {err}')

    def do_GET(self):
        request_path = (self.path or '').split('?', 1)[0]
        if request_path.startswith('/basemap/'):
            self._proxy_basemap(request_path)
            return
        if request_path.startswith(REMOVED_PREFIXES):
            self.send_error(404, 'Superficie removida - ver repositorio dedicado')
            return
        super().do_GET()

    def translate_path(self, path):
        # /pages/centro/* → ./centro/* (HTML, JS, CSS, data, ícones do mapa)
        if path.startswith('/pages/centro/'):
            rel = path[len('/pages/centro/'):]
            translated = os.path.join(ROOT, 'centro', rel)
            if os.path.exists(translated):
                return translated

        # /app/vendor/maplibre/* → ./node_modules/maplibre-gl/dist/*
        if path.startswith('/app/vendor/maplibre/'):
            rel = path[len('/app/vendor/maplibre/'):]
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
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except (AttributeError, OSError):
        pass
    os.chdir(ROOT)
    server = http.server.HTTPServer(('127.0.0.1', PORT), ProxyHandler)
    print(f">> Servidor proxy rodando em http://127.0.0.1:{PORT}")
    print(f"   Projeto: {ROOT}")
    print(f"   Paths /pages/centro/ → /centro/, /app/ → /vendor/app/")
    print(f"   /basemap/* → proxy OpenFreeMap (paridade Vercel)")
    print(f"   /landing/, /arquivo-morto/, /arquivista/ → 404 (repos separados)")
    print(f"   Ctrl+C para parar.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor encerrado.")
        server.server_close()
