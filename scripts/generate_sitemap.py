import sys, ssl, time, datetime
import collections, collections.abc
collections.Iterable = collections.abc.Iterable
import xmlrpc.client

if hasattr(sys.stdout, 'reconfigure'):
    try: sys.stdout.reconfigure(encoding='utf-8')
    except: pass

WP_URLS = ["https://43.200.245.223/xmlrpc.php","http://www.laborcheckai.co.kr/xmlrpc.php"]
WP_USER = "user"
WP_PASS = "***REMOVED_PASSWORD***"
SITE_URL = "http://www.laborcheckai.co.kr"

def connect_wp():
    ssl_ctx = ssl._create_unverified_context()
    transport = xmlrpc.client.SafeTransport(context=ssl_ctx)
    for url in WP_URLS:
        try:
            wp = xmlrpc.client.ServerProxy(url, transport=transport)
            wp.wp.getOptions(1, WP_USER, WP_PASS)
            print(f"[연결 성공] {url}")
            return wp
        except Exception as e:
            print(f"[연결 실패] {url}: {e}")
    raise RuntimeError("연결 실패")

def safe_date(pub_date, fallback):
    try:
        # xmlrpc DateTime 객체
        if hasattr(pub_date, 'value'):
            s = str(pub_date.value)  # '20260101T12:00:00'
            return s[:4] + '-' + s[4:6] + '-' + s[6:8]
        elif hasattr(pub_date, 'timetuple'):
            return pub_date.strftime("%Y-%m-%d")
        else:
            return fallback
    except:
        return fallback

def main():
    wp = connect_wp()
    now = datetime.datetime.now().strftime("%Y-%m-%d")
    print("포스트 목록 수집 중...")
    all_posts = wp.metaWeblog.getRecentPosts(1, WP_USER, WP_PASS, 200)
    print(f"총 {len(all_posts)}개 포스트")

    urls = []
    urls.append(f'  <url>\n    <loc>{SITE_URL}/</loc>\n    <lastmod>{now}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>')

    for post in all_posts:
        if isinstance(post, dict):
            post_id = post.get('postid') or post.get('post_id')
            pub_date = post.get('dateCreated') or post.get('post_date')
        else:
            post_id = getattr(post, 'id', None) or getattr(post, 'postid', None)
            pub_date = getattr(post, 'date_created_gmt', None) or getattr(post, 'dateCreated', None)
        if not post_id: continue
        date_str = safe_date(pub_date, now)
        urls.append(f'  <url>\n    <loc>{SITE_URL}/?p={post_id}</loc>\n    <lastmod>{date_str}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>')

    sitemap_xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    sitemap_xml += '\n'.join(urls)
    sitemap_xml += '\n</urlset>'

    robots_txt = f"User-agent: *\nAllow: /\n\nUser-agent: Googlebot\nAllow: /\n\nUser-agent: Yeti\nAllow: /\n\nSitemap: {SITE_URL}/sitemap.xml\n"

    with open("sitemap_output.xml", "w", encoding="utf-8") as f:
        f.write(sitemap_xml)
    with open("robots_output.txt", "w", encoding="utf-8") as f:
        f.write(robots_txt)

    print(f"사이트맵 생성 완료: {len(urls)}개 URL -> sitemap_output.xml")
    print(f"robots.txt 생성 완료 -> robots_output.txt")

    # 사이트 제목/설명 업데이트
    try:
        result = wp.wp.setOptions(1, WP_USER, WP_PASS, {
            'blogname': '노무체크AI - 근로기준법 노무산재 24시 상담소',
            'blogdescription': '임금체불, 해고, 산재, 연차, 4대보험 실무 가이드. AI 무료 노무 진단 서비스 제공.'
        })
        print(f"\n사이트 제목/설명 업데이트 완료")
        for k, v in result.items():
            if k in ['blogname','blogdescription']:
                print(f"  {k}: {v.get('value','') if isinstance(v,dict) else v}")
    except Exception as e:
        print(f"설정 업데이트 오류: {e}")

    # Google Search Console URL 제출 안내
    print("\n========================================")
    print("다음 단계 (수동 필요):")
    print("========================================")
    print("1. WordPress FTP/파일관리자에서:")
    print("   scripts/sitemap_output.xml -> /public_html/sitemap.xml")
    print("   scripts/robots_output.txt  -> /public_html/robots.txt")
    print(f"\n2. Google Search Console에서 사이트맵 제출:")
    print(f"   URL: {SITE_URL}/sitemap.xml")
    print(f"\n3. 네이버 서치어드바이저에서 사이트맵 제출:")
    print(f"   URL: searchadvisor.naver.com")
    print("========================================")

if __name__ == "__main__":
    main()
