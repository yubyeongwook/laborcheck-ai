import collections
import collections.abc
collections.Iterable = collections.abc.Iterable

import os
import ssl
import re
import xmlrpc.client
from wordpress_xmlrpc import Client, WordPressPost
from wordpress_xmlrpc.methods.posts import GetPosts, GetPost, EditPost

WP_URL = "https://www.laborcheckai.co.kr/xmlrpc.php"
WP_USER = os.environ["WP_USER"]
WP_PASS = os.environ["WP_PASS"]
TARGET_SITE = "https://노무체크ai.com/?calc=1"

# 1. 포스트별 100% 완벽한 정식 제목 및 가독성 요약문(엔터 줄바꿈 포함) 전수 테이블
MASTER_DATA = {
    1336: {
        "title": "[근로계약 수습기간 해설] 포괄임금제 무효 요건과 수습기간 3개월 최저임금 90% 감액의 정당한 적용 범위",
        "excerpt": "1. 일반 사무직 및 매장 직종의 포괄임금제 약정은 법적으로 무효가 됩니다.\n2. 1년 이상 장기 근로계약 체결 시에만 수습기간 3개월간 90% 감액이 허용됩니다."
    },
    1333: {
        "title": "[최저임금·주휴수당 팩트체크] 2025년 최저시급 10,030원 및 2026년 10,320원 기준 209시간 법정 월급 정밀 산정 가이드",
        "excerpt": "1. 2025년 최저시급 10,030원 (월 2,096,270원) 산정 공식\n2. 2026년 최저시급 10,320원 (월 2,156,880원) 및 주휴수당 체불 소급 청구법"
    },
    1302: {
        "title": "[해고분쟁 완벽 대응] 부당해고 구제신청 절차와 원직복직·금전보상 청구 방법",
        "excerpt": "1. 노동위원회 부당해고 구제신청 절차 안내\n2. 원직복직 및 금전보상 명령 청구와 해고수당 정산 실무"
    },
    1251: {
        "title": "[실업급여·4대보험 실무] 실업급여 수급자격 피보험기간 180일 요건과 4대보험 신청 가이드",
        "excerpt": "1. 퇴직 전 18개월간 피보험 180일 충족 요건\n2. 실업급여 자격 판단 및 4대보험 수급 신청 절차"
    },
    1108: {
        "title": "[최저임금·주휴수당 팩트체크] 2025년 최저시급 10,030원 기준 209시간 법정 월급 계산 및 미지급 체불 소급 청구법",
        "excerpt": "1. 월 209시간 유급 주휴 소정근로시간 산출법\n2. 2025년 최저임금 10,030원 기준 미달 임금 진정서 작성법"
    },
    1105: {
        "title": "[근로계약·수습기간 해설] 포괄임금제 무효 요건과 수습기간 3개월 최저임금 90% 감액의 정당한 적용 한계",
        "excerpt": "1. 수습 3개월간 최저임금 90% 지급 허용 범위\n2. 단순 노무직종 감액 금지 규정 및 근로계약서 체크사항"
    },
    406: {
        "title": "2026년 최저시급 10,320원 결정 반영 209시간 법정 소정근로시간 산식 및 주휴수당 미지급 체불 소급 청구 가이드",
        "excerpt": "1. 2026년 최저시급 10,320원 결정 반영 209시간 법정 소정근로시간 산식\n2. 주휴수당 미지급 체불 소급 청구 및 노동청 진정 수칙"
    },
    259: {
        "title": "5인 미만 사업장 부당해고 적용 한계와 30일 전 해고예고수당 100% 청구 기준 및 실무 수칙",
        "excerpt": "1. 5인 미만 사업장 부당해고 적용 한계와 법적 보호 조항\n2. 30일 전 해고예고수당 100% 청구 기준 및 실무 수칙"
    },
    239: {
        "title": "임금체불 효력 소멸시효 3년 단기 채권 법적 사유와 출퇴근 기록·입금 내역 증빙 제출 수칙",
        "excerpt": "1. 임금체불 효력 소멸시효 3년 단기 채권 법적 사유 해설\n2. 출퇴근 기록 및 입금 내역 증빙 제출 수칙"
    },
    228: {
        "title": "노무체크 AI 근로계약서 작성 및 노동법령 필수 의무 준수 해설",
        "excerpt": "1. 노무체크 AI 근로계약서 작성 규칙 해설\n2. 노동법령 필수 의무 준수 및 리스크 예방 가이드"
    },
    183: {
        "title": "출퇴근길 교통사고·도보 재해 산재 승인 기준과 70% 휴업급여 신청 실무 절차",
        "excerpt": "1. 출퇴근길 교통사고 및 도보 재해 산재 승인 기준\n2. 70% 휴업급여 신청 실무 절차 안내"
    },
    181: {
        "title": "입사 1년 미만 신입사원 연차 발생 조건과 미사용 연차수당 정밀 산정 가이드",
        "excerpt": "1. 입사 1년 미만 신입사원 연차 발생 조건 해설\n2. 미사용 연차수당 정밀 산정 가이드"
    },
    175: {
        "title": "뇌출혈·심근경색 과로성 뇌심혈관 질환 산재 인정 기준과 주 52시간 초과 증빙 수칙",
        "excerpt": "1. 뇌출혈 및 심근경색 과로성 뇌심혈관 질환 산재 인정 기준\n2. 주 52시간 초과 증빙 수칙 안내"
    },
    96: {
        "title": "2025년 2026년 최저임금 209시간 법정 월급 계산기 및 포괄임금제 수당 체불 예방 가이드",
        "excerpt": "1. 2025년 2026년 최저임금 209시간 법정 월급 계산기 검증\n2. 포괄임금제 수당 체불 예방 가이드"
    },
    54: {
        "title": "5인 미만 사업장 연차휴가 가산수당 제외 규정과 해고예고수당 지급 의무 안내",
        "excerpt": "1. 5인 미만 사업장 연차휴가 가산수당 제외 규정 안내\n2. 해고예고수당 지급 의무 해설"
    },
    1: {
        "title": "노무체크 AI 24시 자가진단 센터 공식 안내",
        "excerpt": "1. 노무체크 AI 24시 자가진단 센터 공식 안내\n2. 근로자 및 사업주 전용 자가진단 리포트 제공"
    }
}

def clean_body_text(content):
    """본문 내의 지저분한 특수기호, 예전 vercel 링크, 찌꺼기 텍스트 일괄 정돈"""
    c = content
    # 1. vercel/contact 링크 -> TARGET_SITE (https://노무체크ai.com/?calc=1)
    c = re.sub(r'https?://laborcheck-ai\.vercel\.app[^\s"\'<]*', TARGET_SITE, c)
    c = re.sub(r'https?://노무체크ai\.com[^\s"\'<]*', TARGET_SITE, c)
    
    # 2. 지저분한 기호 정리
    c = c.replace("📌 ", "").replace(" #1", "").replace("Summary", "요약")
    c = c.replace("I · ", "1. ").replace("II · ", "2. ").replace("III · ", "3. ").replace("IV · ", "4. ").replace("V · ", "5. ").replace("VI · ", "6. ")
    return c

def execute_master_all_in_one_fix():
    print("=== [MASTER ALL-IN-ONE SYSTEM FIX START] ===")
    ssl_context = ssl._create_unverified_context()
    transport = xmlrpc.client.SafeTransport(context=ssl_context)
    wp = Client(WP_URL, WP_USER, WP_PASS, transport=transport)
    
    posts = wp.call(GetPosts({'number': 100, 'post_type': 'post'}))
    print(f"Total WP Posts Scanned: {len(posts)}")
    
    fixed_count = 0
    for p in posts:
        pid = p.id
        master_info = MASTER_DATA.get(pid)
        
        target_title = master_info["title"] if master_info else (p.title if p.title and p.title != "Untitled" else f"노무체크 AI 인사노무 가이드 #{pid}")
        target_excerpt = master_info["excerpt"] if master_info else f"1. {target_title}\n2. 근로기준법 및 노동관계 법령 정밀 해설 가이드"
        cleaned_content = clean_body_text(p.content)
        
        print(f"Processing Post #{pid} | Title: {target_title[:25]}...")
        
        edit_p = WordPressPost()
        edit_p.id = pid
        edit_p.title = target_title     # 🔒 Title 강제 보존 락
        edit_p.excerpt = target_excerpt # 🔒 2줄 엔터 줄바꿈 Excerpt 락
        edit_p.content = cleaned_content # 🔒 특수기호 제거 및 ?calc=1 링크 락
        
        try:
            wp.call(EditPost(pid, edit_p))
            print(f"  [SUCCESS] Post #{pid} perfectly synced!")
            fixed_count += 1
        except Exception as err:
            print(f"  [ERROR] Post #{pid}: {err}")
            
    print(f"\n🎉 [COMPLETE] Total {fixed_count} posts 100% all-in-one synced!")

if __name__ == "__main__":
    execute_master_all_in_one_fix()
