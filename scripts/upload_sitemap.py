import sys, ssl, ftplib
import collections, collections.abc
collections.Iterable = collections.abc.Iterable

# SFTP/FTP 대신 WordPress REST API나 wp-cli로 파일 업로드 시도
# WordPress xmlrpc를 통해 파일 업로드
import xmlrpc.client, base64

if hasattr(sys.stdout, 'reconfigure'):
    try: sys.stdout.reconfigure(encoding='utf-8')
    except: pass

WP_USER = "user"
WP_PASS = "***REMOVED_PASSWORD***"

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
