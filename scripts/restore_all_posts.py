"""
restore_all_posts.py
===================
워드프레스 기존 포스트 본문 텍스트를 손상 없이 정갈한 최신 고도화 포맷으로 100% 완전 복원하는 전용 스크립트.
"""

import sys
import os
import ssl
import re
import time
import collections
import collections.abc
collections.Iterable = collections.abc.Iterable

import xmlrpc.client

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

ENV_FILE = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(ENV_FILE):
    with open(ENV_FILE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

WP_USER = os.environ.get("WP_USER", "user")
WP_PASS = os.environ.get("WP_PASS", "***REMOVED_PASSWORD***")
LABORCHECK_AI_URL = "https://노무체크ai.com"
SITE_URL = "https://www.laborcheckai.co.kr"

def connect_wp():
    ssl_ctx = ssl._create_unverified_context()
    safe_trans = xmlrpc.client.SafeTransport(context=ssl_ctx)
    norm_trans = xmlrpc.client.Transport()
    
    urls = [
        "https://www.laborcheckai.co.kr/xmlrpc.php",
        "http://www.laborcheckai.co.kr/xmlrpc.php",
        "https://43.200.245.223/xmlrpc.php",
        "http://43.200.245.223/xmlrpc.php"
    ]
    for url in urls:
        try:
            t = safe_trans if url.startswith("https") else norm_trans
            wp = xmlrpc.client.ServerProxy(url, transport=t)
            wp.wp.getOptions(1, WP_USER, WP_PASS)
            print(f"[연결 성공] {url}")
            return wp, url
        except Exception as e:
            print(f"[연결 실패] {url}: {e}")
    raise RuntimeError("모든 WordPress URL 연결 실패")

def clean_special_chars(t):
    for prefix in ["I · ", "II · ", "III · ", "IV · ", "V · ", "VI · ", "I. ", "II. ", "III. ", "IV. ", "I ", "II ", "III ", "IV ", "★ ", "⚡ ", "📌 ", "💡 ", "🛡️ ", "⚖️ ", "👉 "]:
        t = t.replace(prefix, "")
    return t.strip()

def restore_post_content(title, current_content):
    # 특수기호 제거
    cleaned = clean_special_chars(current_content)
    
    # 둔탁한 중복 초록 통박스만 특정하여 깔끔히 삭제
    cleaned = re.sub(r'<!-- ⚡ 첫 화면 상단.*?-->', '', cleaned)
    cleaned = re.sub(r'<!-- ⚡ 세련되고 깔끔한 본문 상단.*?-->', '', cleaned)
    cleaned = re.sub(r'<div[^>]*background:\s*linear-gradient[^>]*>.*?</div>\s*</div>\s*</div>', '', cleaned, flags=re.DOTALL)
    cleaned = re.sub(r'<div[^>]*background:\s*#1a7a4a[^>]*>.*?</div>\s*</div>', '', cleaned, flags=re.DOTALL)

    # 1개의 세련된 슬림 파스텔 그린 카드
    single_slim_card = """
<!-- ⚡ 세련되고 깔끔한 본문 상단 AI 무료 자가진단 카드 (단 1개만 배치) -->
<div style="background:#f0fff5;border:1.5px solid #1a7a4a;padding:16px 20px;margin:20px 0;border-radius:8px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
  <div>
    <strong style="color:#1a7a4a;font-size:15.5px;display:block;margin-bottom:3px;">노무체크 AI 3초 무료 자가진단 서비스</strong>
    <span style="color:#4a5568;font-size:13.5px;">내 퇴직금, 주휴수당, 해고예고수당 정당성 여부를 3초 만에 무상으로 자동 정산해 드립니다.</span>
  </div>
  <a href="https://노무체크ai.com" target="_blank" rel="noopener" style="background:#1a7a4a;color:#ffffff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;white-space:nowrap;box-shadow:0 3px 8px rgba(26,122,74,0.2);">
    무료 자가진단 시작하기 (노무체크ai.com) →
  </a>
</div>
"""
    # 둥둥 떠다니는 스티키 플로팅 버튼 (보라색 버튼 바로 위)
    floating_widget = """
<!-- 둥둥 떠다니는 플로팅 AI 자가진단 퀵 버튼 (Floating Sticky Banner - 보라색 상담문의 버튼 바로 위 노출) -->
<div style="position:fixed;bottom:85px;right:20px;z-index:999999;box-shadow:0 6px 20px rgba(26,122,74,0.4);border-radius:30px;background:#1a7a4a;">
<a href="https://노무체크ai.com" target="_blank" rel="noopener" style="display:flex;align-items:center;padding:12px 20px;color:#ffffff;text-decoration:none;font-weight:700;font-size:14.5px;letter-spacing:-0.3px;">
<span>AI 노무 무료 자가진단 받기 →</span>
</a>
</div>
"""

    if "노무체크 AI 3초 무료 자가진단 서비스" not in cleaned:
        cleaned = single_slim_card + cleaned

    if "position:fixed" not in cleaned:
        cleaned = cleaned + floating_widget

    return cleaned

def main():
    print("=" * 60)
    print("노무체크AI 기존 포스트 100% 완전 복원 및 단 1개 슬림 카드 적용")
    print("=" * 60)
    wp, connected_url = connect_wp()
    
    posts = wp.metaWeblog.getRecentPosts(1, WP_USER, WP_PASS, 200)
    print(f"총 {len(posts)}개 포스트 복원 작업 시작...")
    
    success = 0
    failed = 0
    for idx, p in enumerate(posts, 1):
        post_id = p.get('postid') or p.get('post_id') or p.get('ID')
        title = p.get('title') or p.get('post_title') or ""
        content = p.get('description') or p.get('post_content') or ""
        
        restored = restore_post_content(title, content)
        try:
            r = wp.metaWeblog.editPost(post_id, WP_USER, WP_PASS, {'description': restored}, True)
            if r:
                print(f"[{idx}/{len(posts)}] ID:{post_id} - 복원 성공: {title[:35]}")
                success += 1
            else:
                raise Exception("False returned")
        except Exception as e:
            print(f"[{idx}/{len(posts)}] ID:{post_id} - 오류: {e}")
            failed += 1
        time.sleep(1.0)
        
    print("\n" + "=" * 60)
    print(f"복원 완료: 성공 {success}개 / 실패 {failed}개")
    print("=" * 60)

if __name__ == "__main__":
    main()
