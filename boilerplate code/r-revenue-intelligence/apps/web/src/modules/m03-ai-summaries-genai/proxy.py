from flask import Flask, request, Response, jsonify
import requests
import os

app = Flask(__name__)

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

# Handle preflight for ALL routes
@app.before_request
def handle_preflight():
    if request.method == 'OPTIONS':
        return Response(status=200, headers=CORS_HEADERS)

# ── HubSpot Proxy ─────────────────────────────────────────────────────────────
@app.route('/hubspot/<path:path>', methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
def proxy_hubspot(path):
    url = f'https://api.hubapi.com/{path}'
    fwd_headers = {
        'Authorization': request.headers.get('Authorization', ''),
        'Content-Type':  request.headers.get('Content-Type', 'application/json'),
    }
    resp = requests.request(
        method=request.method,
        url=url,
        headers=fwd_headers,
        data=request.get_data(),
        params=request.args,
        allow_redirects=True,
    )
    response = Response(
        response=resp.content,
        status=resp.status_code,
        content_type=resp.headers.get('Content-Type', 'application/json'),
    )
    for k, v in CORS_HEADERS.items():
        response.headers[k] = v
    return response



if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    print(f'\n  SalesIQ Proxy running at http://localhost:{port}\n')
    app.run(port=port, debug=True)
