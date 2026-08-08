import sys, os, ssl, re, time, json
import collections, collections.abc
collections.Iterable = collections.abc.Iterable
import xmlrpc.client

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

WP_URLS = ["https://43.200.245.223/xmlrpc.php","http://www.laborcheckai.co.kr/xmlrpc.php"]
WP_USER = os.environ.get("WP_USER", "user")
WP_PASS = os.environ.get("WP_PASS")
if not WP_PASS:
    raise RuntimeError("WP_PASS 환경변수가 설정되지 않았습니다. scripts/.env(로컬) 또는 GitHub Actions Secrets(WP_PASS)에 설정하세요.")
LABORCHECK_AI_URL = "https://노무체크ai.com"
SITE_URL = "https://www.laborcheckai.co.kr"

# 카테고리별 FAQ (JSON-LD용)
CATEGORY_FAQS = {
    "산재보상": [
        {"q":"회사가 산재 처리를 거부하면 어떻게 하나요?","a":"근로복지공단에 산재 요양급여 신청서 제출 시 사업주 날인 거부 사유서를 첨부하면 공단이 직권으로 사실관계를 조사하여 승인 여부를 결정합니다."},
        {"q":"산재 휴업급여는 세금이 공제되나요?","a":"산업재해보상보험법 제91조에 따라 지급받는 산재 보험금은 비과세 소득으로 소득세 및 4대보험료가 차감되지 않습니다."},
        {"q":"기존 개인 실손보험과 중복 보상이 가능한가요?","a":"산재보험 처리 후 본인부담금으로 발생한 의료비에 대해서는 약관에 따라 실손보험 보상이 가능한 경우가 있으므로 보험사에 별도 확인이 필요합니다."}
    ],
    "임금체불": [
        {"q":"포괄임금제라며 연장수당을 안 주는데 소급 청구가 가능한가요?","a":"출퇴근 관리가 가능한 사무직이나 일반 매장 근로자의 포괄임금 약정은 대법원 판례상 무효입니다. 과거 3년치 수당 차액을 고용노동부 진정으로 소급 정산받을 수 있습니다."},
        {"q":"최저임금 계산 시 식대나 복리후생비도 포함되나요?","a":"최저임금법 개정에 따라 매월 현금으로 지급되는 식대 및 복리후생비는 법정 비산입 비율을 초과하는 금액에 한해 최저임금 산입 기본급에 합산됩니다."},
        {"q":"임금체불 신고 후 회사가 지급 능력이 없다면 어떻게 하나요?","a":"고용노동부 체불 임금 확인서를 발급받아 근로복지공단의 대지급금 제도를 활용하면 국가가 사업주 대신 체불 임금을 선지급해 줍니다."}
    ],
    "휴가·연차": [
        {"q":"입사 1년 미만 연차는 1년이 지나면 소멸하나요?","a":"입사 1년 미만 동안 매월 발생한 연차는 입사일로부터 1년이 되는 시점까지 사용하지 않으면 수당 청구권으로 전환되어 미사용 수당으로 정산받아야 합니다."},
        {"q":"구두로 연차 사용을 권고한 것도 법적 촉진으로 인정되나요?","a":"아니요, 근로기준법 제60조 제7항에 따른 연차 사용 촉진은 반드시 서면으로 기한을 명시하여 개인별로 통보해야만 유효한 사용 촉진으로 인정됩니다."},
        {"q":"5인 미만 사업장에서도 연차유급휴가가 발생하나요?","a":"현재 근로기준법상 연차유급휴가 규정은 상시 5인 이상 사업장에만 법적 의무로 적용됩니다. 5인 미만 사업장은 약정 휴가로만 운용됩니다."}
    ],
    "근로계약": [
        {"q":"근로계약서를 작성하지 않으면 어떤 처벌이 있나요?","a":"근로기준법 제17조에 따라 서면 근로계약서를 작성 및 교부하지 않은 사업주는 500만원 이하의 벌금형 대상이 될 수 있습니다."},
        {"q":"수습기간 중 최저임금 90%만 지급해도 되나요?","a":"1년 이상 근로계약을 체결한 경우에만 3개월 이내 최저임금 90% 감액이 허용됩니다. 단기 계약이나 단순 노무직종은 수습기간이라도 100% 지급해야 합니다."},
        {"q":"수습기간 중에 자유롭게 해고할 수 있나요?","a":"수습 근로자라 하더라도 해고 시에는 객관적이고 정당한 사유가 존재해야 하며, 5인 이상 사업장은 서면 해고 통지 의무가 동일하게 적용됩니다."}
    ],
    "해고분쟁": [
        {"q":"5인 미만 사업장에서도 해고예고수당을 받을 수 있나요?","a":"네, 5인 미만 사업장이라 하더라도 30일 전 해고예고 의무(근로기준법 제26조)는 100% 적용되므로 예고 없이 해고 시 30일분 통상임금을 청구할 수 있습니다."},
        {"q":"권고사직서에 서명하면 어떤 불이익이 있나요?","a":"권고사직서에 서명하면 자발적 합의 해지로 간주되어 부당해고 구제신청 및 해고예고수당 청구가 불가능해질 수 있습니다."},
        {"q":"해고예고수당을 받아도 실업급여를 신청할 수 있나요?","a":"해고예고수당 청구와 고용보험 실업급여 수급 자격은 별개의 법적 권리이므로 중복하여 혜택을 받으실 수 있습니다."}
    ],
    "4대보험": [
        {"q":"주 15시간 미만 단기 알바도 4대보험에 가입해야 하나요?","a":"주 15시간 미만 근로자라도 3개월 이상 계속 근무 시 고용보험 가입 대상이 되며, 산재보험은 근무 시간과 상관없이 입사 첫날부터 의무 적용됩니다."},
        {"q":"실업급여 180일 요건에 주말도 포함되나요?","a":"무급 휴일(토요일 등)은 제외되며 실제 근무일과 유급 주휴일만 합산하여 180일을 계산합니다."},
        {"q":"사업주가 4대보험료를 공제하고 미납하면 어떻게 하나요?","a":"급여명세서와 입금 내역을 지참하여 국민건강보험공단 및 근로복지공단에 체불 미납 신고를 접수하면 정산 처리가 진행됩니다."}
    ],
    "직장내괴롭힘·성희롱": [
        {"q":"폭언이나 카톡 폭탄도 법적 괴롭힘이 되나요?","a":"근로기준법 제76조의2에 따라 신체적·정신적 고통을 주는 행위는 증빙 확보 시 100% 직장 내 괴롭힘으로 성립합니다."}
    ],
    "육아휴직·출산휴가": [
        {"q":"근속 6개월 이상이면 육아휴직 거부가 불가능한가요?","a":"네, 남녀고용평등법 제19조에 따라 계속 근로 6개월 이상 근로자의 육아휴직을 거부 시 500만원 이하 과태료 대상이 됩니다."}
    ],
    "알바·단기직 노무": [
        {"q":"하루 4시간 일하는 알바도 주휴수당을 받나요?","a":"주 소정근로시간이 15시간 이상(예: 주 4일 4시간)이면 단기 알바도 주휴수당 청구권이 발생합니다."}
    ],
    "취업규칙·노동청점검": [
        {"q":"10인 이상 사업장은 취업규칙 작성이 의무인가요?","a":"근로기준법 제93조에 따라 상시 10인 이상 사업주는 취업규칙을 작성하여 노동부에 신고해야 합니다."}
    ],
    "법정의무교육": [
        {"q":"5대 법정의무교육 미이행 시 과태료는 얼마인가요?","a":"성희롱 예방교육 최대 500만원, 장애인 인식개선 최대 300만원 등 항목별 과태료 처분을 받을 수 있습니다."}
    ],
    "직종별 맞춤노무": [
        {"q":"음식점 브레이크 타임도 법적 휴게시간인가요?","a":"근로자가 자유롭게 외출하거나 쉴 수 있는 완전한 자유 시간이 보장되어야 법적 휴게시간으로 인정됩니다."}
    ]
}

def detect_category(title):
    kw_map = {
        "산재":"산재보상","업무상":"산재보상","휴업급여":"산재보상",
        "임금체불":"임금체불","포괄임금":"임금체불","최저임금":"임금체불","주휴수당":"임금체불",
        "연차":"휴가·연차","휴가":"휴가·연차","연장근로":"휴가·연차",
        "근로계약":"근로계약","수습":"근로계약",
        "해고":"해고분쟁","부당해고":"해고분쟁","권고사직":"해고분쟁",
        "4대보험":"4대보험","실업급여":"4대보험","고용보험":"4대보험",
    }
    for kw, cat in kw_map.items():
        if kw in title: return cat
    return "임금체불"

def build_jsonld_faq(faqs, title):
    items = [{"@type":"Question","name":f["q"],"acceptedAnswer":{"@type":"Answer","text":f["a"]}} for f in faqs]
    schema = {"@context":"https://schema.org","@type":"FAQPage","name":title,"mainEntity":items}
    return f'<script type="application/ld+json">\n{json.dumps(schema, ensure_ascii=False, indent=2)}\n</script>'

def build_jsonld_article(title, post_id, category):
    schema = {
        "@context":"https://schema.org",
        "@type":"Article",
        "headline": title,
        "author":{"@type":"Organization","name":"노무체크AI","url":"http://www.laborcheckai.co.kr"},
        "publisher":{"@type":"Organization","name":"노무체크AI","logo":{"@type":"ImageObject","url":"http://www.laborcheckai.co.kr/wp-content/uploads/logo.png"}},
        "url": f"{SITE_URL}/?p={post_id}",
        "description": f"{category} 관련 최신 노무 정보 및 실무 가이드 - 노무체크AI",
        "inLanguage":"ko-KR"
    }
    return f'<script type="application/ld+json">\n{json.dumps(schema, ensure_ascii=False, indent=2)}\n</script>'

def build_meta_desc(title, category):
    kw_map = {
        "산재보상":"산재보험 신청 절차, 휴업급여 70%, 요양급여",
        "임금체불":"임금체불 신고, 포괄임금제 무효, 최저임금 위반 소급",
        "휴가·연차":"연차유급휴가, 미사용 연차수당, 연차 사용 촉진",
        "근로계약":"근로계약서 미교부, 수습기간 최저임금, 해고 통지",
        "해고분쟁":"부당해고 구제신청, 해고예고수당, 권고사직 불이익",
        "4대보험":"실업급여 신청, 4대보험 가입 기준, 대지급금 제도",
    }
    keywords = kw_map.get(category, "노동법 실무 가이드")
    # 제목에서 핵심어 추출 (첫 30자)
    title_short = re.sub(r'\[.*?\]', '', title).strip()[:35]
    return f"{title_short} | {keywords} 등 현행 법령 기준 실무 해설. 노무체크AI에서 무료 AI 진단도 받아보세요."

def fix_img_alts(content, title, category):
    # img 태그에 alt 없거나 비어있으면 추가
    def replace_img(m):
        tag = m.group(0)
        if 'alt=' not in tag:
            tag = tag.replace('<img ', f'<img alt="{title[:40]} - {category} 노무 정보 이미지" ')
        elif 'alt=""' in tag or "alt=''" in tag:
            tag = re.sub(r'alt=["\'][\"\']', f'alt="{title[:40]} - {category} 노무 정보 이미지"', tag)
        return tag
    return re.sub(r'<img[^>]+>', replace_img, content)

def strip_html(html):
    clean = re.sub(r'<[^>]+>', '', html or '')
    return re.sub(r'\s+', ' ', clean).strip()

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

def main():
    print("=" * 60)
    print("노무체크AI - SEO 완전 최적화 스크립트")
    print("JSON-LD FAQ 스키마 + 메타 디스크립션 + 이미지 alt 태그")
    print("=" * 60)
    wp = connect_wp()
    print("\n[1단계] 포스트 조회...")
    all_posts = []
    try:
        posts = wp.metaWeblog.getRecentPosts(1, WP_USER, WP_PASS, 200)
        all_posts.extend(posts)
    except Exception as e:
        print(f"오류: {e}")
        return
    print(f"총 {len(all_posts)}개 포스트")
    print("\n[2단계] SEO 최적화 실행...")
    success = 0
    failed = 0
    for idx, post in enumerate(all_posts, 1):
        if isinstance(post, dict):
            post_id = post.get('postid') or post.get('post_id')
            content = post.get('description') or ""
            title = post.get('title') or ""
            excerpt = post.get('mt_excerpt') or post.get('post_excerpt') or ""
        else:
            post_id = getattr(post, 'id', None) or getattr(post, 'postid', None)
            content = getattr(post, 'content', '') or getattr(post, 'description', '')
            title = getattr(post, 'title', '')
            excerpt = getattr(post, 'mt_excerpt', '') or ''
        if not post_id: continue
        category = detect_category(title)
        faqs = CATEGORY_FAQS.get(category, CATEGORY_FAQS["임금체불"])
        print(f"\n[{idx}/{len(all_posts)}] ID:{post_id} - {title[:45]}")
        # 1. JSON-LD가 이미 있으면 스킵, 없으면 추가
        has_jsonld = 'application/ld+json' in (content or '')
        # 2. 이미지 alt 수정
        new_content = fix_img_alts(content, title, category)
        # 3. JSON-LD 스키마 추가 (맨 앞에 삽입)
        if not has_jsonld:
            jsonld_faq = build_jsonld_faq(faqs, title)
            jsonld_article = build_jsonld_article(title, post_id, category)
            new_content = jsonld_faq + "\n" + jsonld_article + "\n" + new_content
            print(f"  + JSON-LD FAQ 스키마 삽입")
        else:
            print(f"  - JSON-LD 이미 존재 (스킵)")
        # 4. 메타 디스크립션 (post_excerpt)
        if not excerpt or len(excerpt.strip()) < 20:
            new_excerpt = build_meta_desc(title, category)
            print(f"  + 메타 디스크립션 설정 ({len(new_excerpt)}자)")
        else:
            new_excerpt = excerpt
            print(f"  - 메타 디스크립션 이미 존재")
        # WordPress 업데이트
        try:
            r = wp.metaWeblog.editPost(post_id, WP_USER, WP_PASS, {
                'description': new_content,
                'mt_excerpt': new_excerpt
            }, True)
            if r:
                print(f"  OK SEO 완료")
                success += 1
            else:
                raise Exception("False 반환")
        except Exception as e:
            try:
                wp.wp.editPost(1, WP_USER, WP_PASS, post_id, {
                    'post_content': new_content,
                    'post_excerpt': new_excerpt,
                    'post_status': 'publish'
                })
                print(f"  OK SEO 완료 (wp.editPost)")
                success += 1
            except Exception as e2:
                print(f"  ERROR: {e2}")
                failed += 1
        time.sleep(1.2)
    print("\n" + "=" * 60)
    print(f"SEO 최적화 완료: 성공 {success}개 / 실패 {failed}개 / 총 {len(all_posts)}개")
    print("=" * 60)

if __name__ == "__main__":
    main()
