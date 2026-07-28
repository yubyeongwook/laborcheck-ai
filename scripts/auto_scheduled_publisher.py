import sys
import os
import random
import time
from datetime import datetime
import collections
import collections.abc
collections.Iterable = collections.abc.Iterable

from wordpress_xmlrpc import Client, WordPressPost
from wordpress_xmlrpc.methods.posts import NewPost

# 로깅 환경 설정
LOG_FILE = os.path.join(os.path.dirname(__file__), "auto_publisher.log")

def log(msg):
    now_str = datetime.now().strftime("[%Y-%m-%d %H:%M:%S]")
    line = f"{now_str} {msg}"
    print(line)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(line + "\n")

WP_URL = "http://43.200.245.223/xmlrpc.php"
WP_USER = "user"
WP_PASS = "***REMOVED_PASSWORD***"
LABORCHECK_AI_URL = "https://laborcheck-ai.vercel.app"

# 고트래픽 노무 키워드 및 트렌드 데이터베이스 (오전 7시, 오후 12시, 저녁 6시 시간대별 타겟팅)
HIGH_TRAFFIC_TOPICS = [
    # 오전 7시 타겟: 출근길 산재, 연차, 최저임금 출근 유저 관심사
    {
        "slot": "morning",
        "category": "산재보상",
        "title": "출퇴근길 자차·대중교통 사고 산재 100% 승인 요건 및 휴업급여 70% 신청 가이드",
        "img": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80",
        "law": "산업재해보상보험법 제37조 제1항 제3호",
        "summary_1": "대중교통 뿐만 아니라 자차·도보 출퇴근 중 발생한 사고도 통상적인 경로라면 100% 산재 처리 가능",
        "summary_2": "산업재해보상보험법 제37조 (출퇴근 재해) 근거",
        "summary_3": "블랙박스 영상, 교통카드 내역, 병원 초진기록지 즉시 확보 필요",
        "h1": "I · 법적 근거 — 산업재해보상보험법의 출퇴근 재해 규정",
        "p1": "산업재해보상보험법 제37조 제1항 제3호에 따라 주거지와 사업장 간 이동 중 발생한 사고는 업무상 재해로 인정됩니다. 자택에서 회사로 이동하는 도보, 승용차, 대중교통 이용 사고 모두 산재 보상 대상입니다.",
        "h2": "II · 일상생활 경로 이탈 시 산재 인정 기준",
        "p2": "출퇴근길 자녀 등하교, 생필품 구매 등 일상생활에 필수적인 이탈은 예외적으로 업무상 재해로 인정될 수 있으나 사적 모임은 제외됩니다.",
        "h3": "III · 근로자 실전 대응 수칙",
        "p3": "사고 발생 즉시 응급실 초진기록지에 '출퇴근 중 사고'임을 기재하고, 근로복지공단(comwel.or.kr)에 요양급여 및 70% 휴업급여를 청구해야 합니다.",
        "h4": "IV · 사업주 의무 및 불이익 여부",
        "p4": "출퇴근 산재 승인은 사업장 산재보험료율 인상이나 불이익을 초래하지 않으므로 사업주는 솔직하게 확인서에 서명 협조해야 합니다."
    },
    {
        "slot": "morning",
        "category": "휴가·연차",
        "title": "1년 미만 신입사원 매월 1일 연차 발생 조건과 미사용 연차수당 정밀 계산법",
        "img": "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1200&q=80",
        "law": "근로기준법 제60조 제2항",
        "summary_1": "입사 1년 미만 근로자는 1개월 개근 시 1일의 유급휴가가 발생하여 최대 11개 부여",
        "summary_2": "근로기준법 제60조 (유급휴가) 제2항 적용",
        "summary_3": "1년 미만 연차는 발생일로부터 1년간 미사용 시 수당 청구권으로 전환",
        "h1": "I · 법적 근거 — 근로기준법 제60조 제2항",
        "p1": "근로기준법 제60조 제2항에 따라 최초 1년간 80퍼센트 미만 출근하거나 1년 미만 근로한 자에게 1개월 개근 시 1일의 유급휴가를 주어야 합니다.",
        "h2": "II · 연차 미사용 수당 산출 공식",
        "p2": "미사용 연차수당은 [1일 통상임금(시간급 x 8시간) x 미사용 연차 일수]로 산정되며, 퇴직 시 미사용분은 즉시 정산 대상입니다.",
        "h3": "III · 근로자 실전 대응 체크포인트",
        "p3": "연차 사용 현황을 스스로 기록하고, 사업주의 연차 사용 촉진 조치가 적법하게 이루어졌는지 서면 통보 여부를 확인하십시오.",
        "h4": "IV · 사업주 주의사항 — 사용 촉진 서면 절차",
        "p4": "사업주가 1년 미만 연차 사용 촉진을 할 경우 근로기준법 제60조 제7항의 서면 통보 기한을 엄격히 준수해야 수당 지급 의무가 면제됩니다."
    },

    # 오후 12시 타겟: 점심시간 최저임금, 주휴수당, 급여 계산 관심사
    {
        "slot": "noon",
        "category": "임금체불",
        "title": "2026년 최저시급 10,030원 기준 209시간 월급 계산기 및 미지급 체불 신고 절차",
        "img": "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80",
        "law": "근로기준법 제55조 및 최저임금법 제6조",
        "summary_1": "월 소정근로시간 209시간(주 40시간 + 유급주휴 8시간) 기준 최소 월급 2,096,270원",
        "summary_2": "근로기준법 제55조 (휴일), 최저임금법 제6조 기준",
        "summary_3": "최저임금 미달 시 최근 3년 치 미지급 체불액 소급 진정 가능",
        "h1": "I · 법적 근거 — 209시간 월 산정 소정근로시간 산식",
        "p1": "주 40시간 근무 시 주휴시간 8시간이 포함되어 (40+8)*365/7/12 = 209시간이 산출됩니다. 2026년 최저시급 10,030원 적용 시 최저 기본월급은 2,096,270원입니다.",
        "h2": "II · 포괄임금제 및 식대 비과세 산입 판단",
        "p2": "기본급에 연장수당이나 식대가 포함되어 있어도 실제 최저시급 산정 기본급이 10,030원에 미달하면 최저임금법 위반 조항에 해당합니다.",
        "h3": "III · 근로자 임금체불 소급 진정 방법",
        "p3": "임금명세서와 통장 내역, 출퇴근 기록을 확보하여 고용노동부 노동포털(labor.moel.go.kr)에 임금체불 진정서를 제출할 수 있습니다.",
        "h4": "IV · 사업주 최저임금 준수 및 벌칙 조항",
        "p4": "최저임금 미달 지급 시 3년 이하의 징역 또는 2천만원 이하의 벌금이 부과되므로 매월 정확한 임금명세서를 교부해야 합니다."
    },
    {
        "slot": "noon",
        "category": "근로계약",
        "title": "포괄임금제 무효 요건과 수습기간 3개월 최저임금 90% 감액 적용 한계",
        "img": "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80",
        "law": "최저임금법 제5조 제2항 및 근로기준법 제56조",
        "summary_1": "근로시간 산정이 어렵지 않은 일반 사무직의 포괄임금 약정은 법적으로 무효",
        "summary_2": "최저임금법 제5조 제2항 및 근로기준법 제56조 적용",
        "summary_3": "1년 미만 단기 계약직이나 단순 노무직은 수습 90% 감액 적용 불가",
        "h1": "I · 법적 근거 — 대법원 판례상 포괄임금제 성립 요건",
        "p1": "근로시간 산정이 곤란한 예외적인 경우에만 포괄임금제가 인정됩니다. 출퇴근 관리가 가능한 일반 사업장의 포괄임금 약정은 무효이며 실제 연장·야간 근로수당을 청구할 수 있습니다.",
        "h2": "II · 수습기간 최저임금 90% 감액의 정당한 기준",
        "p2": "1년 이상 근로계약을 체결하고 3개월 이내 수습 근로자에 한해 최저임금의 90% 감액이 가능합니다. 단, 단순 노무직종은 감액이 금지됩니다.",
        "h3": "III · 근로자의 미지급 연장수당 소급 청구법",
        "p3": "포괄임금제로 묶여있던 야간·휴일 근무 내역을 증빙하여 과거 3년 치 수당 차액을 정산 요청할 수 있습니다.",
        "h4": "IV · 사업주의 올바른 포괄임금 계약서 작성법",
        "p4": "기본급과 정액 수당 항목을 명확히 구분 산정하고, 고용노동부 가이드라인에 적합한 근로계약서를 체결하십시오."
    },

    # 저녁 6시 타겟: 퇴근길 부당해고, 실업급여, 해고예고수당 관심사
    {
        "slot": "evening",
        "category": "해고분쟁",
        "title": "5인 미만 사업장 부당해고 적용 한계와 30일 해고예고수당 청구 자격 분석",
        "img": "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80",
        "law": "근로기준법 제23조 및 제26조",
        "summary_1": "5인 미만 사업장은 부당해고 구제신청은 불가능하나 30일 전 해고예고 의무는 100% 적용",
        "summary_2": "근로기준법 제26조 (해고의 예고) 규정",
        "summary_3": "3개월 이상 근무 후 해고 시 30일분 통상임금 해고예고수당 수령 가능",
        "h1": "I · 법적 근거 — 근로기준법 제26조 해고예고 의무",
        "p1": "근로기준법 제26조에 따라 사용자는 근로자를 해고하려면 적어도 30일 전에 예고를 해야 하며, 예고하지 않은 경우 30일분 이상의 통상임금을 지급해야 합니다.",
        "h2": "II · 5인 미만 사업장과 5인 이상 사업장의 해고 규정 차이",
        "p2": "5인 이상 사업장은 서면 통지(제27조) 없는 해고나 정당한 이유 없는 해고가 무효가 되며 노동위원회에 부당해고 구제신청을 할 수 있습니다.",
        "h3": "III · 근로자의 해고 발생 시 즉시 조치 사항",
        "p3": "자발적 사직서에 절대 서명하지 말고 해고 통보 문자, 녹취, 서면 통지서를 수집하여 노동청에 해고예고수당 진정을 접수하십시오.",
        "h4": "IV · 사업주의 권고사직과 해고 구별 실무",
        "p4": "권고사직은 서면 합의에 의하므로 해고예고수당이 발생하지 않으나, 일방적 퇴사 통보는 해고에 해당하므로 30일 전 예고를 이행해야 합니다."
    },
    {
        "slot": "evening",
        "category": "4대보험",
        "title": "실업급여 수급자격 조건 180일 피보험단위기간 계산 및 자진퇴사 예외 기준",
        "img": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
        "law": "고용보험법 제40조 및 제58조",
        "summary_1": "퇴직 전 18개월간 피보험단위기간 180일 이상 충족 시 구직급여 자격 취득",
        "summary_2": "고용보험법 제40조 (구직급여 수급 요건) 적용",
        "summary_3": "권고사직, 계약기간 만료, 임금체불, 원거리 이사 등 자진퇴사 예외 수급 가능",
        "h1": "I · 법적 근거 — 고용보험법 제40조 피보험단위기간 산식",
        "p1": "구직급여를 받으려면 이직일 이전 18개월간 피보험단위기간이 통산하여 180일 이상이어야 합니다. 이때 피보험단위기간은 실제 유급으로 인정된 날만 포함됩니다.",
        "h2": "II · 자진퇴사 시에도 실업급여 수급이 가능한 정당한 이직 사유",
        "p2": "자진퇴사라 하더라도 2개월 이상 임금체불 발생, 사업장 이전으로 통근 3시간 이상 소요, 최저임금 미달 등 정당한 사유가 입증되면 실업급여 수급이 가능합니다.",
        "h3": "III · 근로자 실업급여 신청 단계별 수칙",
        "p3": "퇴사 후 고용보험 이직확인서 처리를 요청하고 고용24(work24.go.kr)에서 수급자격 신청자 온라인 교육을 이수한 뒤 고용센터를 방문하십시오.",
        "h4": "IV · 사업주의 이직확인서 작성 및 코드 관리",
        "p4": "이직코드(11 권고사직, 23 계약만료 등)를 사실대로 작성 제출해야 하며 거짓 작성 시 고용보험법상 과태료 부과 대상이 됩니다."
    }
]

def generate_html(topic):
    return f"""<div style="font-family:-apple-system,BlinkMacSystemFont,'Pretendard',sans-serif;color:#1a1a1a;line-height:1.95;max-width:780px;margin:0 auto;background:#fff;">

<div style="background:#f0fff5;border-left:4px solid #1a7a4a;padding:16px;margin:16px 0;border-radius:0 6px 6px 0">
<strong style="color:#1a7a4a">오늘의 핵심 3가지</strong><br>
1. {topic['summary_1']}<br>
2. 근거 법령: {topic['summary_2']}<br>
3. 실전 활용: {topic['summary_3']}
</div>

<img src="{topic['img']}" alt="{topic['title']}" style="width:100%;border-radius:8px;margin:16px 0">

<h2 style="font-size:18px;font-weight:800;color:#1a3a6b;border-bottom:2px solid #1a3a6b;padding-bottom:8px;margin:36px 0 16px;">{topic['h1']}</h2>
<p>{topic['p1']}</p>

<h2 style="font-size:18px;font-weight:800;color:#1a3a6b;border-bottom:2px solid #1a3a6b;padding-bottom:8px;margin:36px 0 16px;">{topic['h2']}</h2>
<p>{topic['p2']}</p>

<h2 style="font-size:18px;font-weight:800;color:#1a3a6b;border-bottom:2px solid #1a3a6b;padding-bottom:8px;margin:36px 0 16px;">{topic['h3']}</h2>
<p>{topic['p3']}</p>

<h2 style="font-size:18px;font-weight:800;color:#1a3a6b;border-bottom:2px solid #1a3a6b;padding-bottom:8px;margin:36px 0 16px;">{topic['h4']}</h2>
<p>{topic['p4']}</p>

<h2 style="font-size:18px;font-weight:800;color:#1a3a6b;border-bottom:2px solid #1a3a6b;padding-bottom:8px;margin:36px 0 16px;">V · 지금 당장 할 것 — 실전 체크리스트</h2>

<div style="background:#f0fff5;border-left:4px solid #1a7a4a;padding:16px;margin:16px 0">
<strong>지금 당장 확인할 것</strong><br>
□ {topic['law']} 관련 증빙 자료(근로계약서, 임금명세서, 출퇴근 기록) 확보<br>
□ 고용노동부 공식사이트(moel.go.kr) 또는 근로복지공단(comwel.or.kr) 서식 확인<br>
□ 노무체크 AI 무료 자가진단 리포트 생성 및 전문가 조언 확인<br>
□ 고용노동부 고객상담센터 1350 (국번없이) 연결
</div>

<div style="text-align:center;margin:24px 0">
<a href="{LABORCHECK_AI_URL}" style="background:#1a7a4a;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:700;font-size:15px">
⚡ 노무체크 AI 3초 무료 진단받기 →
</a>
</div>

<div style="background:#f0f4ff;border:1.5px solid #1a3a6b;padding:14px;margin:20px 0;border-radius:6px">
<strong style="color:#1a3a6b">법적 고지</strong><br>
본 글은 일반적인 노무 정보 제공 목적이며 개인의 구체적인 법적 조언이 아닙니다. 개별 사안에 따라 적용 내용이 다를 수 있으므로 구체적인 상담은 공인노무사 또는 고용노동부(1350)에 문의하시기 바랍니다.
</div>

<p style="font-size:12px;color:#888;border-top:1px solid #eee;padding-top:10px">
📌 <strong>검증된 출처 및 참고 링크</strong><br>
- 근거 법령: {topic['law']}<br>
- 공식 보도자료 및 정보: <a href="https://www.moel.go.kr" target="_blank" rel="noopener" style="color:#1a7a4a;text-decoration:underline;">고용노동부 (moel.go.kr)</a> | <a href="https://www.comwel.or.kr" target="_blank" rel="noopener" style="color:#1a7a4a;text-decoration:underline;">근로복지공단 (comwel.or.kr)</a> | <a href="https://www.law.go.kr" target="_blank" rel="noopener" style="color:#1a7a4a;text-decoration:underline;">국가법령정보센터 (law.go.kr)</a>
</p>

</div>"""

def publish():
    now = datetime.now()
    hour = now.hour
    log(f"자동 발행 프로세스 시작 (현재 시각: {now.strftime('%Y-%m-%d %H:%M:%S')})")

    # 현재 시간대에 적합한 키워드 필터링
    if hour < 10:
        slot = "morning"
    elif hour < 15:
        slot = "noon"
    else:
        slot = "evening"

    candidates = [t for t in HIGH_TRAFFIC_TOPICS if t["slot"] == slot]
    if not candidates:
        candidates = HIGH_TRAFFIC_TOPICS

    topic = random.choice(candidates)
    log(f"선정된 타깃 슬롯: [{slot}] | 주제: {topic['title']}")

    try:
        wp = Client(WP_URL, WP_USER, WP_PASS)
        post = WordPressPost()
        post.title = topic["title"]
        post.content = generate_html(topic)
        post.terms_names = {'category': [topic["category"]]}
        post.post_status = 'publish'

        post_id = wp.call(NewPost(post))
        log(f"SUCCESS: 워드프레스 포스팅 완료! ID: {post_id} | 카테고리: {topic['category']} | 제목: {topic['title']}")

        # Fetch 2 random existing posts to add cross-links
        try:
            from wordpress_xmlrpc.methods.posts import GetPosts, EditPost
            recent_posts = wp.call(GetPosts({'number': 10, 'post_type': 'post'}))
            valid_others = [p for p in recent_posts if p.id != post_id and getattr(p, 'title', '').strip()]
            if len(valid_others) >= 2:
                sample = random.sample(valid_others, 2)
                cross_box = f"""
<div style="background-color:#f8f9fa;border-left:4px solid #1a7a4a;padding:16px;margin:28px 0;border-radius:4px;">
  <h4 style="margin:0 0 10px 0;font-size:15px;color:#1a7a4a;font-weight:700;">📌 함께 읽으면 좋은 관련 노무 가이드</h4>
  <ul style="margin:0;padding-left:20px;line-height:1.8;">
    <li><a href="http://www.laborcheckai.co.kr/?p={sample[0].id}" target="_blank" style="color:#1a3a6b;text-decoration:underline;font-weight:600;">{sample[0].title}</a></li>
    <li><a href="http://www.laborcheckai.co.kr/?p={sample[1].id}" target="_blank" style="color:#1a3a6b;text-decoration:underline;font-weight:600;">{sample[1].title}</a></li>
  </ul>
</div>
"""
                new_html = post.content.replace('<div style="text-align:center;margin:24px 0">', cross_box + '\n<div style="text-align:center;margin:24px 0">')
                post.content = new_html
                wp.call(EditPost(post_id, post))
                log(f"SUCCESS: 신규 포스트에 내부 상호 링크 2개 연동 완료 (참조 포스트: ID {sample[0].id}, {sample[1].id})")
        except Exception as ex:
            log(f"WARNING: 내부 링크 추가 중 경고 - {ex}")

        return True
    except Exception as e:
        log(f"ERROR: 워드프레스 발행 실패 - {e}")
        return False

if __name__ == "__main__":
    publish()
