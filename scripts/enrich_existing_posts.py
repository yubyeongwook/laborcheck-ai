"""
enrich_existing_posts.py
========================
기존 WordPress 포스트를 애드센스 승인 기준으로 강화하는 스크립트.

수행 작업:
1. 모든 발행 포스트 가져오기
2. 500자 미만 짧은 포스트 또는 FAQ/CTA 섹션이 없는 포스트 탐지
3. 각 포스트 카테고리에 맞는 FAQ 섹션 + AI 진단 CTA 추가
4. 법적 고지 및 출처 섹션이 없으면 추가
5. 최소 800자 이상이 되도록 보강
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

WP_URLS = [
    "https://43.200.245.223/xmlrpc.php",
    "http://www.laborcheckai.co.kr/xmlrpc.php",
    "http://43.200.245.223/xmlrpc.php"
]
WP_USER = "user"
WP_PASS = "***REMOVED_PASSWORD***"
LABORCHECK_AI_URL = "https://laborcheck-ai.vercel.app"

CATEGORY_FAQS = {
    "산재보상": [
        ("Q1. 회사가 산재 처리를 거부하면 어떻게 하나요?",
         "근로복지공단에 산재 요양급여 신청서 제출 시 사업주 확인서 없이도 사업주 날인 거부 사유서를 첨부하면 공단이 직권으로 사실관계를 조사하여 승인 여부를 결정합니다."),
        ("Q2. 산재 휴업급여는 세금이 공제되나요?",
         "산업재해보상보험법 제91조에 따라 지급받는 산재 보험금은 비과세 소득으로 소득세 및 4대보험료가 차감되지 않습니다."),
        ("Q3. 기존 개인 실손보험과 중복으로 보상받을 수 있나요?",
         "산재보험 처리 후 본인부담금으로 발생한 의료비에 대해서는 약관에 따라 실손보험 보상이 가능한 경우가 있으므로 보험사에 별도 확인이 필요합니다.")
    ],
    "임금체불": [
        ("Q1. 포괄임금제라며 연장수당을 안 주는데 소급 청구가 가능한가요?",
         "출퇴근 관리가 가능한 사무직이나 일반 매장 근로자의 포괄임금 약정은 대법원 판례상 무효입니다. 과거 3년치 수당 차액을 고용노동부 진정으로 소급하여 정산받을 수 있습니다."),
        ("Q2. 최저임금 계산 시 식대나 복리후생비도 포함되나요?",
         "최저임금법 개정에 따라 매월 현금으로 지급되는 식대 및 복리후생비는 법정 비산입 비율을 초과하는 금액에 한해 최저임금 산입 기본급에 합산됩니다."),
        ("Q3. 임금체불 신고 후 회사가 지급 능력이 없다면 어떻게 하나요?",
         "고용노동부 체불 임금 확인서를 발급받아 근로복지공단의 대지급금 제도를 활용하면 국가가 사업주 대신 체불 임금을 선지급해 줍니다.")
    ],
    "휴가·연차": [
        ("Q1. 입사 1년 미만 연차는 1년이 지나면 소멸하나요?",
         "입사 1년 미만 동안 매월 발생한 연차는 입사일로부터 1년이 되는 시점까지 사용하지 않으면 수당 청구권으로 전환되어 미사용 수당으로 정산받아야 합니다."),
        ("Q2. 구두로 연차 쓰라고 말한 것도 법적 사용 촉진으로 인정되나요?",
         "아니요, 근로기준법 제60조 제7항에 따른 연차 사용 촉진은 반드시 서면으로 기한을 명시하여 개인별로 통보해야만 유효한 사용 촉진으로 인정됩니다."),
        ("Q3. 5인 미만 사업장에서도 연차유급휴가가 발생하나요?",
         "현재 근로기준법상 연차유급휴가 규정은 상시 5인 이상 사업장에만 법적 의무로 적용됩니다. 5인 미만 사업장은 약정 휴가로만 운용됩니다.")
    ],
    "근로계약": [
        ("Q1. 근로계약서를 작성하지 않으면 어떤 처벌이 있나요?",
         "근로기준법 제17조에 따라 서면 근로계약서를 작성 및 교부하지 않은 사업주는 500만원 이하의 벌금형 대상이 될 수 있습니다."),
        ("Q2. 수습기간 중 최저임금 90%만 줘도 되나요?",
         "1년 이상 근로계약을 체결한 경우에만 3개월 이내 최저임금 90% 감액이 허용되며, 단기 계약이나 단순 노무직종은 수습기간이라도 100% 최저임금을 지급해야 합니다."),
        ("Q3. 수습기간 중에 자유롭게 해고할 수 있나요?",
         "수습 근로자라 하더라도 해고 시에는 객관적이고 정당한 사유가 존재해야 하며, 5인 이상 사업장은 서면 해고 통지 의무가 동일하게 적용됩니다.")
    ],
    "해고분쟁": [
        ("Q1. 5인 미만 사업장에서 해고예고수당을 받을 수 있나요?",
         "네, 5인 미만 사업장이라 하더라도 30일 전 해고예고 의무는 100% 적용되므로 예고 없이 해고 시 30일분 통상임금을 해고예고수당으로 청구할 수 있습니다."),
        ("Q2. 권고사직서에 서명하면 불이익이 있나요?",
         "권고사직서에 서명하면 자발적 합의 해지로 간주되어 부당해고 구제신청 및 해고예고수당 청구가 불가능해질 수 있습니다. 서명 전 전문가 상담을 권장합니다."),
        ("Q3. 해고예고수당을 받아도 실업급여를 신청할 수 있나요?",
         "해고예고수당 청구와 고용보험 실업급여 수급 자격은 별개의 법적 권리이므로 중복하여 혜택을 받으실 수 있습니다.")
    ],
    "4대보험": [
        ("Q1. 주 15시간 미만 초단기 알바도 4대보험에 가입해야 하나요?",
         "주 15시간 미만 근로자라도 3개월 이상 계속 근무 시 고용보험 가입 대상이 되며, 산재보험은 근무 시간과 상관없이 입사 첫날부터 의무 적용됩니다."),
        ("Q2. 실업급여 180일 요건에 주말도 포함되나요?",
         "무급 휴일은 제외되며 실제 근무일과 유급 주휴일만 합산하여 180일을 계산합니다."),
        ("Q3. 사업주가 4대보험료를 공제하고 공단에 미납하면 어떻게 하나요?",
         "급여명세서와 입금 내역을 지참하여 국민건강보험공단 및 근로복지공단에 체불 미납 신고를 접수하면 정산 처리가 진행됩니다.")
    ]
}

def build_faq_section(faqs):
    qa_html = ""
    for q, a in faqs:
        qa_html += f"\n  <div style='margin-bottom:18px;'>\n    <p style='font-weight:700;color:#1a3a6b;font-size:15px;margin-bottom:6px;'>{q}</p>\n    <p style='color:#333;line-height:1.8;font-size:14px;'>{a}</p>\n  </div>"
    return f"\n<!-- ADSENSE_FAQ_SECTION -->\n<div style='background-color:#f0f7ff;border:1px solid #b3d4f5;border-radius:8px;padding:24px 28px;margin:32px 0;'>\n  <h2 style='font-size:17px;color:#1a3a6b;margin-bottom:18px;font-weight:800;'>VI &middot; 자주 묻는 질문 (FAQ) &mdash; 현장 실무 Q&amp;A</h2>\n  {qa_html}\n</div>\n"

def build_cta_section():
    return f"\n<!-- ADSENSE_CTA_SECTION -->\n<div style='text-align:center;margin:32px 0;'>\n  <a href='{LABORCHECK_AI_URL}' target='_blank' style='display:inline-block;background:linear-gradient(135deg,#1a7a4a,#0d5c35);color:#fff;padding:14px 36px;border-radius:6px;font-size:16px;font-weight:700;text-decoration:none;'>AI 무료 노무 진단 받기 &rarr;</a>\n  <p style='font-size:12px;color:#888;margin-top:8px;'>laborcheck-ai.vercel.app &middot; 24시간 무료 운영</p>\n</div>\n"

def build_legal_notice():
    return "\n<!-- LEGAL_NOTICE -->\n<div style='background-color:#f9f9f9;border-top:1px solid #ddd;padding:18px 20px;margin-top:40px;font-size:12px;color:#777;line-height:1.7;'>\n  <strong>법적 고지:</strong> 본 콘텐츠는 근로기준법, 산업재해보상보험법, 고용보험법 등 현행 법령에 기초한 일반적 정보 제공을 목적으로 하며, 개별 사안에 대한 법률 자문이 아닙니다. 구체적인 분쟁 해결을 위해서는 고용노동부(국번 없이 1350) 또는 노무사, 법률전문가와 상담하시기 바랍니다.\n</div>\n"

def build_source_footer(category):
    return f"\n<!-- SOURCE_FOOTER -->\n<div style='background-color:#f4f4f4;padding:14px 18px;margin-top:12px;font-size:12px;color:#666;border-radius:4px;'>\n  <strong>참고 법령 및 출처:</strong><br>\n  &bull; <a href='https://www.law.go.kr/lsInfoP.do?lsiSeq=233252' target='_blank' style='color:#1a7a4a;'>근로기준법 전문 (국가법령정보센터)</a><br>\n  &bull; <a href='https://www.comwel.or.kr' target='_blank' style='color:#1a7a4a;'>근로복지공단 공식 사이트</a><br>\n  &bull; <a href='https://www.moel.go.kr' target='_blank' style='color:#1a7a4a;'>고용노동부 공식 사이트</a><br>\n  <em>카테고리: {category} | 발행: 노무체크AI(laborcheckai.co.kr)</em>\n</div>\n"

def build_supplement():
    return "\n<div style='background-color:#fffbf0;border-left:4px solid #e6a817;padding:20px 24px;margin:24px 0;'>\n  <h3 style='font-size:15px;color:#7a4a00;margin-bottom:12px;font-weight:700;'>실무 적용 핵심 체크포인트</h3>\n  <ul style='list-style:disc;padding-left:22px;line-height:1.9;color:#444;font-size:14px;'>\n    <li>고용노동부(국번 없이 1350)는 무료 노무 상담을 운영합니다.</li>\n    <li>임금체불, 부당해고, 산재 등 모든 노동 분쟁은 고용노동부 민원포털(minwon.moel.go.kr)을 통해 온라인으로 신고 접수할 수 있습니다.</li>\n    <li>증빙 자료(근로계약서, 급여명세서, 출퇴근 기록)는 분쟁 발생 즉시 캡처하여 보관하는 것이 유리합니다.</li>\n    <li>무료 법률 지원이 필요하면 대한법률구조공단(132)을 이용할 수 있습니다.</li>\n    <li>5인 미만 사업장 근로자도 근로기준법 핵심 조항(임금체불, 해고예고, 산재 등)의 보호를 받습니다.</li>\n  </ul>\n</div>\n"

def strip_html(html):
    clean = re.sub(r'<[^>]+>', '', html or '')
    return re.sub(r'\s+', ' ', clean).strip()

def needs_enrichment(post_content):
    text = strip_html(post_content)
    char_count = len(text)
    has_faq = "ADSENSE_FAQ_SECTION" in (post_content or "") or "자주 묻는 질문" in (post_content or "")
    has_cta = LABORCHECK_AI_URL in (post_content or "") or "ADSENSE_CTA_SECTION" in (post_content or "")
    return {
        "short": char_count < 800,
        "no_faq": not has_faq,
        "no_cta": not has_cta,
        "char_count": char_count,
        "needs_update": char_count < 800 or not has_faq or not has_cta
    }

def detect_category(title):
    kw_map = {
        "산재": "산재보상", "업무상": "산재보상", "휴업급여": "산재보상",
        "임금체불": "임금체불", "포괄임금": "임금체불", "최저임금": "임금체불", "주휴수당": "임금체불",
        "연차": "휴가·연차", "휴가": "휴가·연차", "연장근로": "휴가·연차",
        "근로계약": "근로계약", "수습": "근로계약",
        "해고": "해고분쟁", "부당해고": "해고분쟁", "권고사직": "해고분쟁",
        "4대보험": "4대보험", "실업급여": "4대보험", "고용보험": "4대보험",
    }
    for kw, cat in kw_map.items():
        if kw in title:
            return cat
    return "임금체불"

def connect_wp():
    ssl_ctx = ssl._create_unverified_context()
    transport = xmlrpc.client.SafeTransport(context=ssl_ctx)
    for url in WP_URLS:
        try:
            wp = xmlrpc.client.ServerProxy(url, transport=transport)
            wp.wp.getOptions(1, WP_USER, WP_PASS)
            print(f"[연결 성공] {url}")
            return wp, url
        except Exception as e:
            print(f"[연결 실패] {url}: {e}")
    raise RuntimeError("모든 WordPress URL 연결 실패")

def main():
    print("=" * 60)
    print("노무체크AI 기존 포스트 애드센스 품질 강화 스크립트")
    print("=" * 60)
    try:
        wp, connected_url = connect_wp()
    except RuntimeError as e:
        print(f"오류: {e}")
        return
    print("\n[1단계] 기존 발행 포스트 조회 중...")
    all_posts = []
    try:
        posts = wp.metaWeblog.getRecentPosts(1, WP_USER, WP_PASS, 200)
        all_posts.extend(posts)
    except Exception as e:
        print(f"getRecentPosts 실패: {e}")
        try:
            posts = wp.wp.getPosts(1, WP_USER, WP_PASS, {'number': 200, 'post_status': 'publish', 'post_type': 'post'})
            all_posts.extend(posts)
        except Exception as e2:
            print(f"getPosts도 실패: {e2}")
            return
    print(f"총 {len(all_posts)}개 포스트 수집 완료.")
    print("\n[2단계] 애드센스 부족 포스트 분류 중...")
    targets = []
    for post in all_posts:
        if isinstance(post, dict):
            post_id = post.get('postid') or post.get('post_id') or post.get('ID')
            content = post.get('description') or post.get('post_content') or ""
            title = post.get('title') or post.get('post_title') or ""
        else:
            post_id = getattr(post, 'id', None) or getattr(post, 'postid', None)
            content = getattr(post, 'content', '') or getattr(post, 'description', '')
            title = getattr(post, 'title', '')
        if not post_id:
            continue
        analysis = needs_enrichment(content)
        if analysis["needs_update"]:
            status = []
            if analysis["short"]: status.append(f"짧음({analysis['char_count']}자)")
            if analysis["no_faq"]: status.append("FAQ없음")
            if analysis["no_cta"]: status.append("CTA없음")
            targets.append({"post_id": post_id, "title": title, "content": content, "analysis": analysis, "status": ", ".join(status)})
    print(f"강화 대상: {len(targets)}개 포스트")
    for i, t in enumerate(targets, 1):
        print(f"  [{i}] ID:{t['post_id']} | {t['status']} | {t['title'][:50]}")
    if not targets:
        print("모든 포스트가 이미 애드센스 기준을 충족합니다.")
        return
    print(f"\n[3단계] {len(targets)}개 포스트 강화 업데이트 시작...")
    success = 0
    failed = 0
    for idx, t in enumerate(targets, 1):
        post_id = t["post_id"]
        title = t["title"]
        original_content = t["content"]
        analysis = t["analysis"]
        category = detect_category(title)
        faqs = CATEGORY_FAQS.get(category, CATEGORY_FAQS["임금체불"])
        print(f"\n[{idx}/{len(targets)}] ID:{post_id} - {title[:40]}")
        additions = ""
        if analysis["short"]:
            additions += build_supplement()
            print(f"  + 실무 보강 단락 추가 (원본 {analysis['char_count']}자)")
        if analysis["no_faq"]:
            additions += build_faq_section(faqs)
            print(f"  + FAQ 섹션 추가 ({category})")
        if analysis["no_cta"]:
            additions += build_cta_section()
            print(f"  + CTA 추가")
        additions += build_legal_notice()
        additions += build_source_footer(category)
        new_content = original_content + additions
        try:
            try:
                r = wp.metaWeblog.editPost(post_id, WP_USER, WP_PASS, {'description': new_content}, True)
                if r:
                    print(f"  OK 완료 (metaWeblog.editPost)")
                    success += 1
                else:
                    raise Exception("returned False")
            except Exception:
                r = wp.wp.editPost(1, WP_USER, WP_PASS, post_id, {'post_content': new_content, 'post_status': 'publish'})
                print(f"  OK 완료 (wp.editPost)")
                success += 1
        except Exception as e:
            print(f"  ERROR: {e}")
            failed += 1
        time.sleep(1.5)
    print("\n" + "=" * 60)
    print(f"완료: 성공 {success}개 / 실패 {failed}개 / 총 {len(targets)}개")
    print("=" * 60)

if __name__ == "__main__":
    main()
