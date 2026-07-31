import sys, os, ssl, ftplib
import collections, collections.abc
collections.Iterable = collections.abc.Iterable

# SFTP/FTP 대신 WordPress REST API나 wp-cli로 파일 업로드 시도
# WordPress xmlrpc를 통해 파일 업로드
import xmlrpc.client, base64

if hasattr(sys.stdout, 'reconfigure'):
    try: sys.stdout.reconfigure(encoding='utf-8')
    except: pass

ENV_FILE = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(ENV_FILE):
    with open(ENV_FILE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

WP_USER = os.environ.get("WP_USER", "user")
WP_PASS = os.environ.get("WP_PASS")
if not WP_PASS:
    raise RuntimeError("WP_PASS 환경변수가 설정되지 않았습니다. scripts/.env(로컬) 또는 GitHub Actions Secrets(WP_PASS)에 설정하세요.")

ssl_ctx = ssl._create_unverified_context()
transport = xmlrpc.client.SafeTransport(context=ssl_ctx)
wp = xmlrpc.client.ServerProxy("https://43.200.245.223/xmlrpc.php", transport=transport)

# sitemap.xml 업로드
with open("sitemap_output.xml", "rb") as f:
    sitemap_data = f.read()

result = wp.wp.uploadFile(1, WP_USER, WP_PASS, {
    'name': 'sitemap.xml',
    'type': 'text/xml',
    'bits': sitemap_data,
    'overwrite': True
})
print(f"sitemap.xml 업로드 결과: {result}")
