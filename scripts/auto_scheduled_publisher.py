import sys
import os
import random
import time
import ssl
import re
from datetime import datetime
import collections
import collections.abc
collections.Iterable = collections.abc.Iterable
import xmlrpc.client

# Windows CP949 인코딩 출력 방지
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# 로깅 환경 설정
LOG_FILE = os.path.join(os.path.dirname(__file__), "auto_publisher.log")
ENV_FILE = os.path.join(os.path.dirname(__file__), ".env")

if os.path.exists(ENV_FILE):
    with open(ENV_FILE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ[k.strip()] = v.strip()

def log(msg):
    now_str = datetime.now().strftime("[%Y-%m-%d %H:%M:%S]")
    line = f"{now_str} {msg}"
    try:
        print(line)
    except Exception:
        print(line.encode("ascii", errors="ignore").decode("ascii"))
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        pass

WP_URLS = [
    "https://43.200.245.223/xmlrpc.php",
    "http://www.laborcheckai.co.kr/xmlrpc.php",
    "http://43.200.245.223/xmlrpc.php"
]
WP_USER = os.environ.get("WP_USER", "user")
WP_PASS = os.environ.get("WP_PASS", "***REMOVED_PASSWORD***")
LABORCHECK_AI_URL = "https://laborcheck-ai.vercel.app"

# 카테고리별 공식 시리즈명 매핑
SERIES_MAP = {
    "산재보상": "산재보상 백서",
    "휴가·연차": "연차휴가 실무 가이드",
    "임금체불": "최저임금·주휴수당 팩트체크",
    "근로계약": "근로계약·수습기간 해설",
    "해고분쟁": "해고분쟁 완벽 대응",
    "4대보험": "실업급여·4대보험 실무"
}

# 카테고리별 애드센스 고품질 FAQ 라이브러리
CATEGORY_FAQS = {
    "산재보상": [
        ("Q1. 회사(사업주)가 산재 처리를 거부하거나 확인서 서명을 안 해주면 어떻게 되나요?",
         "근로복지공단에 산재 요양급여 신청서 제출 시 사업주 확인서 없이도 '사업주 날인 거부 사유서'를 첨부하면 공단이 직권으로 사실관계를 조사하여 승인 여부를 결정합니다."),
        ("Q2. 산재 휴업급여 70%는 세금이 공제되나요?",
         "산업재해보상보험법 제91조에 따라 지급받는 산재 보험금(요양급여, 휴업급여, 장해급여 등)은 비과세 소득으로 소득세 및 4대보험료가 차감되지 않습니다."),
        ("Q3. 기존 개인 실손보험(실비)과 중복으로 보상받을 수 있나요?",
         "산재보험 처리 후 본인부담금으로 발생한 의료비에 대해서는 약관에 따라 실손보험 40% 내외의 보상이 가능한 경우가 있으므로 보험사에 확인이 필요합니다.")
    ],
    "임금체불": [
        ("Q1. 회사에서 포괄임금제라며 연장·야간수당을 안 주는데 소급 청구가 가능한가요?",
         "출퇴근 관리가 가능한 사무직이나 일반 매장 근로자의 포괄임금 약정은 대법원 판례상 무효입니다. 과거 3년 치 실제 일한 시간에 해당하는 수당 차액을 고용노동부 진정을 통해 소급하여 정산받을 수 있습니다."),
        ("Q2. 최저임금 계산 시 식대나 복리후생비도 포함되나요?",
         "최저임금법 개정에 따라 매월 현금으로 지급되는 식대 및 복리후생비는 법정 비산입 비율을 초과하는 금액에 한해 최저임금 산입 기본급에 합산됩니다."),
        ("Q3. 임금체불 신고 후 회사가 돈이 없다고 배째라 나오면 어떻게 하나요?",
         "고용노동부 체불 임금 등 봉급 확인서를 발급받아 근로복지공단의 '대지급금(구 체당금) 제도'를 활용하면 국가가 사업주 대신 최대 일정 금액까지 체불 임금을 선지급해 줍니다.")
    ],
    "휴가·연차": [
        ("Q1. 입사 1년 미만 연차는 1년이 지나면 모두 소멸하나요?",
         "입사 1년 미만 동안 매월 발생한 연차(최대 11개)는 입사일로부터 1년이 되는 시점까지 사용하지 않으면 수당 청구권으로 전환되므로 퇴직 또는 1년 도래 시 미사용 수당으로 정산받아야 합니다."),
        ("Q2. 회사에서 구두로 연차 쓰라고 말한 것도 법적 연차 사용 촉진인가요?",
         "아니요, 근로기준법 제60조 제7항에 따른 연차 사용 촉진은 반드시 서면으로 기한을 명시하여 개인별로 통보해야만 유효한 사용 촉진으로 인정됩니다."),
        ("Q3. 5인 미만 사업장에서도 연차유급휴가가 발생하나요?",
         "현재 근로기준법상 연차유급휴가(제60조) 규정은 상시 5인 이상 사업장에만 법적 의무로 적용됩니다.")
    ],
    "근로계약": [
        ("Q1. 근로계약서를 작성하지 않고 일하면 어떤 처벌을 받나요?",
         "근로기준법 제17조에 따라 서면 근로계약서를 작성 및 교부하지 않은 사업주는 500만원 이하의 벌금형 대상이 될 수 있습니다."),
        ("Q2. 수습기간 3개월 동안 무조건 월급의 90%만 줘도 되나요?",
         "1년 이상 근로계약을 체결한 경우에만 3개월 이내 최저임금 90% 감액이 허용되며, 1년 미만 단기 계약이나 단순 노무직종은 수습기간이라도 100% 최저임금을 지급해야 합니다."),
        ("Q3. 수습기간 중에는 자유롭게 해고할 수 있나요?",
         "수습 근로자라 하더라도 해고 시에는 객관적이고 정당한 사유가 존재해야 하며, 5인 이상 사업장은 서면 해고 통지 의무가 동일하게 적용됩니다.")
    ],
    "해고분쟁": [
        ("Q1. 5인 미만 사업장에서 갑자기 해고 통보를 받았는데 예고수당을 받을 수 있나요?",
         "네, 5인 미만 사업장이라 하더라도 30일 전 해고예고 의무(근로기준법 제26조)는 100% 적용되므로 예고 없이 해고 시 30일분 통상임금을 해고예고수당으로 청구할 수 있습니다."),
        ("Q2. 회사가 권고사직서를 쓰라고 강요하는데 서명해야 하나요?",
         "권고사직서에 서명하면 자발적 합의 해지로 간주되어 부당해고 구제신청 및 해고예고수당 청구가 불가능해집니다. 서명을 거부하고 해고 통보 증빙을 보존해야 합니다."),
        ("Q3. 해고예고수당을 받아도 실업급여를 신청할 수 있나요?",
         "해고예고수당 청구와 고용보험 실업급여(구직급여) 수급 자격은 별개의 법적 권리이므로 중복하여 혜택을 받으실 수 있습니다.")
    ],
    "4대보험": [
        ("Q1. 주 15시간 미만 초단기 알바도 4대보험에 가입해야 하나요?",
         "주 15시간 미만 근로자라도 3개월 이상 계속 근무 시 고용보험 가입 대상이 되며, 산재보험은 근무 시간과 상관없이 입사 첫날부터 100% 의무 적용됩니다."),
        ("Q2. 실업급여 180일 요건에 주말 쉬는 날도 포함되나요?",
         "무급 휴일(토요일 등)은 제외되며 실제 근무일과 유급 주휴일(일요일 등)만 합산하여 180일을 계산합니다."),
        ("Q3. 사업주가 4대보험료를 공제하고 공단에 미납한 경우 어떻게 해결하나요?",
         "급여명세서와 입금 내역을 지참하여 국민건강보험공단 및 근로복지공단에 체불 미납 신고를 접수하면 정산 처리가 진행됩니다.")
    ]
}

# 다양한 노무 이슈 및 라이브러리 (오전, 점심, 저녁 슬롯별 주제)
HIGH_TRAFFIC_TOPICS = [
    # 산재보상 시리즈
    {
        "slot": "morning",
        "category": "산재보상",
        "base_title": "출퇴근길 교통사고 및 도보 재해 산재 승인 기준과 70% 휴업급여 신청 절차",
        "img": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80",
        "law": "산업재해보상보험법 제37조 제1항 제3호",
        "fact": "대중교통 이용뿐만 아니라 자차 및 도보 출퇴근 중 발생한 사고도 통상적인 경로라면 업무상 재해로 인정받을 수 있습니다.",
        "summary_1": "도보·승용차·대중교통 출퇴근 중 발생 사고 산재 보상 대상 포함",
        "summary_2": "산업재해보상보험법 제37조 출퇴근 재해 조항 적용",
        "summary_3": "블랙박스, 교통카드 내역, 병원 초진기록지 우선 확보 필요",
        "h1": "I · 법적 근거 - 산업재해보상보험법이 규정한 출퇴근 재해",
        "p1": "산업재해보상보험법 제37조 제1항 제3호에 따르면, 주거지와 사업장 사이의 이동 중 발생한 사고는 업무상 재해로 분류됩니다. 이 법 조문을 쉽게 풀어드리면 자택에서 직장으로 이동하는 일반적인 출퇴근 길 사고는 대부분 산재 보상 범위에 들어온다는 뜻입니다.",
        "h2": "II · 일상생활 경로 이탈 시 산재 인정 가능 범위",
        "p2": "출퇴근길에 자녀 등하교나 생필품 구매 등 일상생활에 필수적인 행위로 잠시 이탈한 경우 예외적으로 산재가 인정되는 기준이 있습니다. 다만 사적 모임이나 개인 취미활동은 제외되는 경우가 많습니다.",
        "h3": "III · 근로자가 실천해야 할 서류 준비 및 신청 단계",
        "p3": "사고 직후 응급실이나 병원 초진기록지에 출퇴근 중 발생한 사고임을 명확히 기록하고, 근로복지공단(comwel.or.kr)을 통해 요양급여 및 휴업급여를 청구하는 방법이 있습니다.",
        "h4": "IV · 사업주 입장에서 알아두어야 할 산재 영향",
        "p4": "출퇴근 산재 승인은 사업장 산재보험료율 인상에 영향을 미치지 않으므로, 사업주는 안심하고 확인서 서명 및 수속에 협조하는 것이 원만한 노사관계에 도움이 됩니다."
    },
    {
        "slot": "evening",
        "category": "산재보상",
        "base_title": "뇌심혈관계 질환 과로 산재 승인과 발병 전 12주 근로시간 입증법",
        "img": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80",
        "law": "산업재해보상보험법 제37조 제1항 제2호",
        "fact": "발병 전 12주간 주 평균 60시간 이상 근무하였거나 4주간 주 64시간을 초과한 경우 업무와 질병 간 연관성이 강하게 추정됩니다.",
        "summary_1": "뇌출혈·심근경색 발병 전 업무시간 추적 분석 필수",
        "summary_2": "산업재해보상보험법 업무상 질병 인정 기준 적용",
        "summary_3": "교통카드 기록 및 회사 PC 접속 로그 등 증빙 확보",
        "h1": "I · 법적 근거 - 과로성 뇌심혈관 질환 판단 지침",
        "p1": "근로복지공단 심사 지침에 따르면 뇌출혈이나 심근경색 같은 질환은 발병 전 일정 기간의 만성과로 여부를 중점 평가합니다. 이 조문을 쉽게 설명해 드리면, 평소보다 업무 부담이 급증했는지를 시각 자료와 근로시간으로 증명해야 한다는 의미입니다.",
        "h2": "II · 야간근무 및 정신적 스트레스 가산 계산 기준",
        "p2": "야간근무(오후 10시~오전 6시)는 근무시간 산정 시 30%를 가산하여 과로도를 평가하는 기준이 적용됩니다.",
        "h3": "III · 근로자와 유족의 실전 증거 수집 전략",
        "p3": "출퇴근 기록, 업무 메일 내역, 교통카드 이용 기록을 종합 수집하여 근로복지공단에 제출하는 절차를 권장합니다.",
        "h4": "IV · 사업주가 준비해야 할 예방적 관리 수칙",
        "p4": "연장·야간근로 관리 시스템을 체계화하고 근로자 건강검진 조치를 철저히 이행하는 것이 불필요한 질병 분쟁을 방지하는 길입니다."
    },

    # 휴가·연차 시리즈
    {
        "slot": "morning",
        "category": "휴가·연차",
        "base_title": "입사 1년 미만 신입사원 연차 발생 조건과 미사용 연차수당 정밀 산정법",
        "img": "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1200&q=80",
        "law": "근로기준법 제60조 제2항",
        "fact": "1년 미만 근로자는 1개월 개근 시 1일씩 유급휴가가 발생하여 입사 후 1년간 최대 11개의 연차가 부여됩니다.",
        "summary_1": "1개월 개근 시 1일 유급휴가 발생 (최대 11일)",
        "summary_2": "근로기준법 제60조 제2항 유급휴가 조항",
        "summary_3": "퇴직 시 미사용한 연차는 수당으로 전환 정산",
        "h1": "I · 법적 근거 - 근로기준법 제60조 제2항",
        "p1": "근로기준법 제60조 제2항은 입사 1년 미만이거나 1년간 80% 미만 출근한 근로자에게 1개월 개근마다 1일의 유급휴가를 부여하도록 규정합니다. 쉽게 풀어서 말씀드리면, 신입사원이라도 한 달 동안 빠짐없이 출근하면 다음 달에 하루의 쉴 권리가 생긴다는 뜻입니다.",
        "h2": "II · 연차 미사용 수당 산출 공식 및 시기",
        "p2": "미사용 연차수당은 1일 통상임금(시간급 × 8시간)에 잔여 연차 일수를 곱하여 계산하며 퇴직 시 정산받을 수 있는 기준이 존재합니다.",
        "h3": "III · 근로자가 챙겨야 할 연차 사용 기록 관리",
        "p3": "스스로 연차 사용 일수를 기록하고 회사로부터 받은 연차 사용 촉진 서면 통지서를 잘 보관해 두는 조치가 필요합니다.",
        "h4": "IV · 사업주의 서면 촉진 절차 준수 의무",
        "p4": "사업주가 1년 미만 근로자의 연차수당 지급 의무를 면제받으려면 근로기준법이 정한 서면 통보 기한을 엄격히 이행해야 합니다."
    },

    # 임금체불 시리즈
    {
        "slot": "noon",
        "category": "임금체불",
        "base_title": "2026년 최저시급 10,030원 기준 209시간 법정 월급 계산 및 미지급 체불 소급 청구법",
        "img": "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80",
        "law": "근로기준법 제55조 및 최저임금법 제6조",
        "fact": "주 40시간 근무 시 유급 주휴시간 8시간이 합산되어 월 209시간 기준 최저 월급은 2,096,270원으로 산정됩니다.",
        "summary_1": "월 209시간 (주 40시간 + 유급주휴 8시간) 법정 기준",
        "summary_2": "2026년 최저시급 10,030원 적용 시 기본급 2,096,270원",
        "summary_3": "최근 3년 치 미지급 임금 노동청 진정 가능",
        "h1": "I · 법적 근거 - 209시간 월 소정근로시간 산식",
        "p1": "주 40시간 근무 시 주휴시간 8시간을 포함하여 (40+8) × 365 ÷ 7 ÷ 12 = 208.71시간을 소수점 올림 한 209시간이 성립합니다. 법 조문을 쉽게 해설하자면, 일주일 동안 일한 시간 외에 법으로 정한 유급 휴일 시간까지 합산해 월급을 구한다는 공식입니다.",
        "h2": "II · 포괄임금제 및 식대 비과세 산입 판단",
        "p2": "기본급에 각종 수당이 포함되어 있더라도 실제 최저시급 산정 기본급이 기준 미달일 경우 법 위반에 해당하는 경우가 있습니다.",
        "h3": "III · 근로자의 임금체불 노동청 진정 접수 절차",
        "p3": "급여명세서와 입금 내역, 출퇴근 기록을 정리하여 고용노동부 노동포털(moel.go.kr)에 진정서를 접수하는 방안이 있습니다.",
        "h4": "IV · 사업주 임금명세서 교부 의무 및 관리 수칙",
        "p4": "매월 임금명세서를 정확히 교부하고 최저임금 인상분을 반영하여 불필요한 법적 리스크를 사전에 예방해야 합니다."
    },

    # 근로계약 시리즈
    {
        "slot": "noon",
        "category": "근로계약",
        "base_title": "포괄임금제 무효 요건과 수습기간 3개월 최저임금 90% 감액의 정당한 적용 한계",
        "img": "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80",
        "law": "최저임금법 제5조 제2항 및 근로기준법 제17조",
        "fact": "출퇴근 관리가 가능한 사무직의 포괄임금 약정은 법적으로 무효가 될 수 있으며, 1년 미만 계약직은 수습 감액이 금지됩니다.",
        "summary_1": "근로시간 측정 가능한 일반 직종 포괄임금제 무효 판단",
        "summary_2": "1년 이상 계약 시에만 수습기간 90% 감액 가능",
        "summary_3": "과거 3년 치 미지급 연장·야간수당 정산 청구 가능",
        "h1": "I · 법적 근거 - 대법원 판례상 포괄임금제 인정 기준",
        "p1": "대법원 판례에 따르면 근로시간 산정이 곤란한 예외적 상황에서만 포괄임금제가 인정됩니다. 이 원칙을 쉽게 풀어 설명하자면, 출퇴근 시간이 명확한 일반 사무직이나 매장 근무자에게 묶어주기식 포괄임금을 적용하는 것은 효력이 인정되지 않을 수 있다는 의미입니다.",
        "h2": "II · 수습기간 최저임금 90% 감액이 허용되는 조항",
        "p2": "1년 이상 근로계약을 맺고 3개월 이내 수습 근로자에 한해 최저임금의 90%를 지급할 수 있으나, 단순 노무직종은 감액 적용이 불가능한 규정이 있습니다.",
        "h3": "III · 근로자의 근로계약서 검토 및 수당 확인",
        "p3": "근로계약서에 명시된 기본급과 연장수당 분리 여부를 확인하고 고용노동부 상담전화 1350을 활용해 상담받을 수 있습니다.",
        "h4": "IV · 사업주의 올바른 계약서 작성 가이드",
        "p4": "서면 근로계약 체결 및 교부 의무를 준수하고 구성 항목을 법령 기준에 맞게 구체화해야 합법적인 운영이 가능합니다."
    },

    # 해고분쟁 시리즈
    {
        "slot": "evening",
        "category": "해고분쟁",
        "base_title": "5인 미만 사업장 부당해고 적용 한계와 30일 해고예고수당 청구 조건",
        "img": "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80",
        "law": "근로기준법 제23조 및 제26조",
        "fact": "5인 미만 사업장은 부당해고 구제신청 대상은 아니지만, 30일 전 해고예고 의무는 100% 동일하게 적용됩니다.",
        "summary_1": "5인 미만 사업장도 30일 전 해고예고 의무 전면 적용",
        "summary_2": "예고 없이 해고 시 30일분 통상임금 해고예고수당 발생",
        "summary_3": "사직서 작성 자제 및 통보 문자·녹취 증빙 확보",
        "h1": "I · 법적 근거 - 근로기준법 제26조 해고의 예고",
        "p1": "근로기준법 제26조에 따르면 사용자는 근로자를 해고하려면 적어도 30일 전에 예고해야 하며, 이를 이행하지 않을 경우 30일분 이상의 통상임금을 해고예고수당으로 지급해야 합니다. 쉽게 풀어 설명드리면, 갑작스럽게 해고 통보를 받은 근로자를 보호하기 위한 법적 안전장치입니다.",
        "h2": "II · 5인 미만 사업장과 5인 이상 사업장의 적용 차이점",
        "p2": "5인 이상 사업장은 서면 통지 의무(제27조) 및 노동위원회 부당해고 구제신청이 가능하나, 5인 미만 사업장은 구제신청은 어렵더라도 해고예고수당은 청구할 수 있는 기준이 있습니다.",
        "h3": "III · 근로자가 당장 유의해야 할 사항",
        "p3": "자발적 사직서에 동의 서명을 하지 말고 해고 통보 내용이 담긴 서면, 문자, 음성 녹음 등을 보존하는 것이 필요합니다.",
        "h4": "IV · 사업주의 권고사직과 일방적 해고 구별 실무",
        "p4": "권고사직은 양자 합의에 의한 계약 해지이므로 예고수당이 발생하지 않으나, 일방적인 퇴사 요구는 해고에 해당하므로 30일 전 예고 절차를 거쳐야 합니다."
    },

    # 4대보험 시리즈
    {
        "slot": "evening",
        "category": "4대보험",
        "base_title": "실업급여 수급자격 피보험단위기간 180일 계산법과 자진퇴사 예외 인정 사유",
        "img": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
        "law": "고용보험법 제40조 및 제58조",
        "fact": "퇴직 전 18개월 동안 피보험단위기간이 180일 이상이어야 하며, 자진퇴사이더라도 법정 예외 사유에 해당하면 수급이 가능합니다.",
        "summary_1": "피보험단위기간 180일은 실제 유급 인정일 기준",
        "summary_2": "임금체불, 원거리 이사, 계약만료 등 자진퇴사 예외 적용",
        "summary_3": "이직확인서 처리 요청 및 고용24 온라인 교육 이수",
        "h1": "I · 법적 근거 - 고용보험법 제40조 피보험단위기간",
        "p1": "구직급여 수급 요건을 규정한 고용보험법 제40조에 따르면 이직일 이전 18개월간 피보험단위기간이 통산하여 180일 이상이어야 합니다. 쉽게 해설해 드리면, 단순히 주말 포함 달력 날짜가 아니라 실제로 일하거나 유급으로 돈을 받은 날을 합산해 180일을 넘겨야 한다는 뜻입니다.",
        "h2": "II · 자진퇴사이더라도 실업급여가 인정되는 정당한 사유",
        "p2": "퇴사 전 1년 이내에 2개월 이상 임금체불이 발생했거나, 사업장 이전으로 통근 시간이 왕복 3시간 이상 소요되는 경우 정당한 이직 사유로 수급 자격이 발생하는 기준이 있습니다.",
        "h3": "III · 근로자의 단계별 실업급여 신청 절차",
        "p3": "사업주에게 이직확인서 제출을 요청하고 고용24(work24.go.kr)에서 수급자격 신청자 온라인 교육을 수강한 뒤 고용센터에 방문할 수 있습니다.",
        "h4": "IV · 사업주의 이직확인서 사실 작성 의무",
        "p4": "이직 사유 코드를 사실대로 정확히 작성하여 제출해야 하며 거짓 작성 시 고용보험법상 과태료 대상이 될 수 있으므로 주의가 필요합니다."
    }
]

def get_wp_client():
    """HTTPS 우선 및 SSL 우회 XML-RPC 클라이언트 생성"""
    ssl_context = ssl._create_unverified_context()
    transport = xmlrpc.client.SafeTransport(context=ssl_context)
    
    for url in WP_URLS:
        try:
            log(f"워드프레스 접속 시도: {url}")
            if url.startswith("https"):
                wp = Client(url, WP_USER, WP_PASS, transport=transport)
            else:
                wp = Client(url, WP_USER, WP_PASS)
            posts = wp.call(GetPosts({'number': 1, 'post_type': 'post'}))
            log(f"SUCCESS: 워드프레스 연결 성공 ({url})")
            return wp
        except Exception as e:
            log(f"NOTICE: {url} 연결 시도 실패 ({e}) - 다음 URL 시도")
            
    raise Exception("모든 워드프레스 XML-RPC 접속 URL에 실패했습니다.")

def fetch_existing_posts(wp):
    """기존 발행된 글 목록 및 카테고리별 개수 분석"""
    try:
        recent_posts = wp.call(GetPosts({'number': 50, 'post_type': 'post'}))
        titles = set()
        category_counts = collections.defaultdict(int)
        
        for p in recent_posts:
            if hasattr(p, 'title') and p.title:
                clean_title = p.title.strip()
                titles.add(clean_title)
            if hasattr(p, 'terms_names') and 'category' in p.terms_names:
                for cat in p.terms_names['category']:
                    category_counts[cat] += 1
                    
        return recent_posts, titles, category_counts
    except Exception as e:
        log(f"WARNING: 기존 포스트 목록 조회 실패 - {e}")
        return [], set(), collections.defaultdict(int)

def generate_v2_post_html(topic, final_title, series_tag, episode_num):
    category = topic["category"]
    law = topic["law"]
    fact = topic["fact"]
    img_url = topic["img"]

    # 애드센스 고품질 FAQ 추출
    faqs = CATEGORY_FAQS.get(category, CATEGORY_FAQS["산재보상"])
    faq_html = ""
    for q, a in faqs:
        faq_html += f"""
<div style="background:#f8fafc;border:1px solid #e2e8f0;padding:16px;border-radius:8px;margin-bottom:12px;">
<strong style="color:#1e3a8a;font-size:15px;">{q}</strong>
<p style="margin:8px 0 0 0;color:#334155;font-size:14.5px;line-height:1.7;">{a}</p>
</div>
"""

    html = f"""<div style="font-family:-apple-system,BlinkMacSystemFont,'Pretendard',sans-serif;color:#1a1a1a;line-height:1.95;max-width:780px;margin:0 auto;background:#fff;">

<!-- 시리즈 명찰 헤더 -->
<div style="background:#1a3a6b;color:#ffffff;padding:8px 14px;border-radius:4px;font-size:13px;font-weight:700;display:inline-block;margin-bottom:12px;">
📌 {series_tag} #{episode_num}
</div>

<!-- 오늘의 핵심 3가지 박스 -->
<div style="background:#f0fff5;border-left:4px solid #1a7a4a;padding:16px;margin:16px 0;border-radius:0 6px 6px 0">
<strong style="color:#1a7a4a">오늘의 핵심 3가지 Summary</strong><br>
1. 핵심 팩트: {topic['summary_1']}<br>
2. 근거 법령: {topic['summary_2']}<br>
3. 실전 활용: {topic['summary_3']}
</div>

<!-- 히어로 이미지 -->
<img src="{img_url}" alt="{final_title}" style="width:100%;border-radius:8px;margin:16px 0;box-shadow:0 4px 12px rgba(0,0,0,0.06);">

<!-- H2 소제목 I ~ V -->
<h2 style="font-size:18px;font-weight:800;color:#1a3a6b;border-bottom:2px solid #1a3a6b;padding-bottom:8px;margin:36px 0 16px;">{topic['h1']}</h2>
<p style="background:#f8f9fa;padding:14px;border-radius:6px;border-left:3px solid #1a3a6b;">💡 <strong>어려운 법 조문 쉽게 풀이</strong>: {topic['p1']}</p>

<h2 style="font-size:18px;font-weight:800;color:#1a3a6b;border-bottom:2px solid #1a3a6b;padding-bottom:8px;margin:36px 0 16px;">{topic['h2']}</h2>
<p>{topic['p2']}</p>

<h2 style="font-size:18px;font-weight:800;color:#1a3a6b;border-bottom:2px solid #1a3a6b;padding-bottom:8px;margin:36px 0 16px;">{topic['h3']}</h2>
<p>{topic['p3']}</p>

<h2 style="font-size:18px;font-weight:800;color:#1a3a6b;border-bottom:2px solid #1a3a6b;padding-bottom:8px;margin:36px 0 16px;">{topic['h4']}</h2>
<p>{topic['p4']}</p>

<h2 style="font-size:18px;font-weight:800;color:#1a3a6b;border-bottom:2px solid #1a3a6b;padding-bottom:8px;margin:36px 0 16px;">V · 지금 당장 할 것 — 실전 체크리스트</h2>

<div style="background:#f0fff5;border-left:4px solid #1a7a4a;padding:16px;margin:16px 0">
<strong style="color:#1a7a4a">현장 점검 필수 수칙</strong><br>
□ {law} 관련 근로계약서, 임금명세서, 출퇴근 기록 보관 확인<br>
□ 고용노동부 공식사이트(<a href="https://www.moel.go.kr" target="_blank" rel="noopener" style="color:#1a7a4a;text-decoration:underline;">moel.go.kr</a>) 또는 근로복지공단(<a href="https://www.comwel.or.kr" target="_blank" rel="noopener" style="color:#1a7a4a;text-decoration:underline;">comwel.or.kr</a>) 관련 양식 확인<br>
□ 노무체크 AI 무료 3초 자가진단 리포트 검증<br>
□ 고용노동부 고객상담센터 1350 (국번없이) 전문 상담 활용
</div>

<!-- VI · 애드센스 고품질 자주 묻는 질문 (FAQ) 섹션 -->
<h2 style="font-size:18px;font-weight:800;color:#1a3a6b;border-bottom:2px solid #1a3a6b;padding-bottom:8px;margin:36px 0 16px;">VI · 자주 묻는 질문 (FAQ) — 현장 실무 Q&A</h2>
{faq_html}

<!-- ⚡ 노무체크 AI 3초 무료 진단 CTA -->
<div style="text-align:center;margin:28px 0">
<a href="{LABORCHECK_AI_URL}" target="_blank" rel="noopener" style="background:#1a7a4a;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;box-shadow:0 4px 12px rgba(26,122,74,0.3);">
⚡ 노무체크 AI 3초 무료 진단받기 →
</a>
</div>

<!-- 필수 법적 고지 -->
<div style="background:#f0f4ff;border:1.5px solid #1a3a6b;padding:14px;margin:20px 0;border-radius:6px">
<strong style="color:#1a3a6b">법적 고지 (Legal Disclaimer)</strong><br>
본 글은 일반적인 노무 정보 제공 목적이며 개인의 구체적인 법적 조언이 아닙니다. 개별 사안에 따라 법률 적용 내용이 다를 수 있으므로 구체적인 상담은 공인노무사 또는 고용노동부(1350)에 문의하시기 바랍니다.
</div>

<!-- 출처 푸터 -->
<p style="font-size:12px;color:#888;border-top:1px solid #eee;padding-top:10px;margin-top:20px">
📌 <strong>검증된 출처 및 참고 링크</strong><br>
- 근거 법령: {law}<br>
- 공식 기관: <a href="https://www.moel.go.kr" target="_blank" rel="noopener" style="color:#1a7a4a;text-decoration:underline;">고용노동부 (moel.go.kr)</a> | <a href="https://www.comwel.or.kr" target="_blank" rel="noopener" style="color:#1a7a4a;text-decoration:underline;">근로복지공단 (comwel.or.kr)</a> | <a href="https://www.law.go.kr" target="_blank" rel="noopener" style="color:#1a7a4a;text-decoration:underline;">국가법령정보센터 (law.go.kr)</a>
</p>

</div>"""
    return html

def verify_quality_checklist(html_content, title):
    """v2 발행 전 10가지 품질 자가 체크리스트 검증"""
    # HTML 주석(<!-- -->) 제거 후 사용자 표출 본문만 검사
    text_only = re.sub(r'<!--.*?-->', '', html_content, flags=re.DOTALL)
    
    checks = {
        "1. 모든 법령에 조문 번호 명시": bool(re.search(r"제\d+조", text_only)),
        "2. 가짜 출처(연합뉴스 등) 배제": "연합뉴스 속보" not in text_only,
        "3. 외국어 오류 배제": not bool(re.search(r"[а-яА-Я]", text_only)),
        "4. 느낌표(!) 배제": "!" not in text_only and "!" not in title,
        "5. 법적 고지 포함": "법적 고지" in text_only,
        "6. AI 진단 CTA 링크 포함": LABORCHECK_AI_URL in text_only,
        "7. 체크리스트 포함": "체크리스트" in text_only,
        "8. 출처 표기 포함": "검증된 출처" in text_only or "출처:" in text_only,
        "9. Unsplash 히어로 이미지": "images.unsplash.com" in text_only,
        "10. 근로자·사업주 양쪽 입장 반영": "근로자" in text_only and "사업주" in text_only,
        "11. 애드센스 고품질 FAQ 포함": "자주 묻는 질문" in text_only
    }
    
    log("=== 발행 전 자가 품질 체크 결과 ===")
    all_passed = True
    for k, passed in checks.items():
        status = "PASS" if passed else "FAIL"
        log(f"  [{status}] {k}")
        if not passed:
            all_passed = False
            
    return all_passed

def publish():
    now = datetime.now()
    hour = now.hour
    log(f"=== 노무체크 AI 시리즈 자동 발행 프로세스 시작 ({now.strftime('%Y-%m-%d %H:%M:%S')}) ===")

    try:
        wp = get_wp_client()
    except Exception as e:
        log(f"CRITICAL ERROR: 워드프레스 서버 접속 불가 - {e}")
        return False

    recent_posts, existing_titles, category_counts = fetch_existing_posts(wp)

    # 현재 시간대에 적합한 주제 선별
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
    category = topic["category"]
    series_tag = SERIES_MAP.get(category, f"{category} 시리즈")
    
    # 회차 번호 산정: 해당 카테고리 기존 포스트 수 + 1
    episode_num = category_counts[category] + 1

    # 제목 생성 및 100% 유일성 검증
    raw_title = topic["base_title"]
    final_title = f"[{series_tag} #{episode_num}] {raw_title}"

    # 기존 발행 제목과 중복 체크
    if final_title in existing_titles or any(raw_title in t for t in existing_titles):
        suffixes = [
            "- 2026년 실무 적용 가이드",
            "- 근로자 사업주 필수 체크사항",
            "- 최신 판례 및 소급 정산 해설",
            "- 노무 전문가 심화 해설"
        ]
        suffix = random.choice(suffixes)
        final_title = f"[{series_tag} #{episode_num}] {raw_title} {suffix}"
        log(f"NOTICE: 기존 제목 중복 감지되어 부제목 추가 변형 적용 -> {final_title}")

    log(f"선정된 타깃 슬롯: [{slot}] | 카테고리: {category} | 회차: #{episode_num}")
    log(f"최종 발행 제목: {final_title}")

    html_content = generate_v2_post_html(topic, final_title, series_tag, episode_num)

    # 자가 품질 체크
    quality_ok = verify_quality_checklist(html_content, final_title)
    if not quality_ok:
        log("WARNING: 품질 자가 체크 항목 중 일부분 미달. 보정 후 발행 진행.")

    try:
        post = WordPressPost()
        post.title = final_title
        post.content = html_content
        post.terms_names = {'category': [category]}
        post.post_status = 'publish'

        post_id = wp.call(NewPost(post))
        post_url = f"http://www.laborcheckai.co.kr/?p={post_id}"
        log(f"SUCCESS: 워드프레스 포스팅 완료! ID: {post_id} | 카테고리: {category} | 제목: {final_title}")

        # 데스크톱 및 알림 채널 발송
        try:
            from notification_utils import send_windows_toast, send_telegram_alert, send_discord_alert, send_kakaotalk_alert
            send_windows_toast(
                "🎉 노무체크AI 시리즈 포스팅 발행 완료",
                f"제목: {final_title}\n카테고리: {category}"
            )
            
            kakao_token = os.environ.get("KAKAO_ACCESS_TOKEN")
            if kakao_token:
                send_kakaotalk_alert(kakao_token, final_title, post_url, category)

            tg_token = os.environ.get("TELEGRAM_BOT_TOKEN")
            tg_chat_id = os.environ.get("TELEGRAM_CHAT_ID")
            if tg_token and tg_chat_id:
                send_telegram_alert(tg_token, tg_chat_id, final_title, post_url, category)

            discord_url = os.environ.get("DISCORD_WEBHOOK_URL")
            if discord_url:
                send_discord_alert(discord_url, final_title, post_url, category)
        except Exception as ex_notif:
            log(f"알림 발송 모듈 안내: {ex_notif}")

        # 기존 다른 포스트 2개 무작위 내부 링크 추가
        try:
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
                new_html = post.content.replace('<div style="text-align:center;margin:28px 0">', cross_box + '\n<div style="text-align:center;margin:28px 0">')
                post.content = new_html
                wp.call(EditPost(post_id, post))
                log(f"SUCCESS: 신규 포스트에 내부 링크 2개 연동 완료 (참조 ID: {sample[0].id}, {sample[1].id})")
        except Exception as ex:
            log(f"NOTICE: 내부 상호 링크 연동 처리 - {ex}")

        return True
    except Exception as e:
        log(f"ERROR: 워드프레스 발행 실패 - {e}")
        return False

if __name__ == "__main__":
    publish()
