-- =========================================================
-- 노무체크AI (laborcheckai.co.kr) 워드프레스 DB 통합 수정 SQL Script
-- phpMyAdmin 또는 DB 관리 도구(DBeaver, MySQL Client)에서 실행하십시오.
-- =========================================================

-- ---------------------------------------------------------
-- [작업 3] 워드프레스 고유주소 구조 변경 (글 이름 /%postname%/)
-- ---------------------------------------------------------
UPDATE wp_options
SET option_value = '/%postname%/'
WHERE option_name = 'permalink_structure';

-- ---------------------------------------------------------
-- [작업 4] 카테고리 구조 6개 생성 (wp_terms 및 wp_term_taxonomy)
-- ---------------------------------------------------------
INSERT IGNORE INTO wp_terms (name, slug, term_group) VALUES
('산재보상', 'industrial-accident', 0),
('임금체불', 'wage-theft', 0),
('해고분쟁', 'unfair-dismissal', 0),
('근로계약', 'labor-contract', 0),
('4대보험', 'insurance', 0),
('연차휴가', 'annual-leave', 0);

-- wp_term_taxonomy에 카테고리로 등록 (없는 경우 연동)
INSERT IGNORE INTO wp_term_taxonomy (term_id, taxonomy, description, parent, count)
SELECT term_id, 'category', '', 0, 0
FROM wp_terms
WHERE slug IN ('industrial-accident', 'wage-theft', 'unfair-dismissal', 'labor-contract', 'insurance', 'annual-leave')
AND term_id NOT IN (SELECT term_id FROM wp_term_taxonomy WHERE taxonomy = 'category');

-- ---------------------------------------------------------
-- [작업 5] 기존 글 본문 러시아어 오류 수정 ("ограничен" -> "제한")
-- ---------------------------------------------------------
UPDATE wp_posts
SET post_content = REPLACE(post_content, 'ограничен적으로', '제한적으로')
WHERE post_content LIKE '%ограничен%';

UPDATE wp_posts
SET post_content = REPLACE(post_content, 'ограничен', '제한')
WHERE post_content LIKE '%ограничен%';

-- ---------------------------------------------------------
-- [작업 6] 가짜 출처 제거 ("연합뉴스 속보" -> 실제 참고 법령)
-- ---------------------------------------------------------
UPDATE wp_posts
SET post_content = REPLACE(
    post_content,
    '[관련 기사]:** 연합뉴스 속보',
    '[참고 법령]:** 고용노동부 공식 사이트 (moel.go.kr)'
)
WHERE post_content LIKE '%연합뉴스 속보%';

UPDATE wp_posts
SET post_content = REPLACE(
    post_content,
    '연합뉴스 속보',
    '고용노동부 공식 사이트 (moel.go.kr)'
)
WHERE post_content LIKE '%연합뉴스 속보%';

-- ---------------------------------------------------------
-- [작업 7] 필수 페이지 3개 생성 (소개, 개인정보처리방침, 연락처)
-- ---------------------------------------------------------

-- 1. 소개 페이지 (about)
INSERT INTO wp_posts (
    post_author, post_date, post_date_gmt, post_content, post_title, post_excerpt,
    post_status, comment_status, ping_status, post_name, to_ping, pinged,
    post_modified, post_modified_gmt, post_content_filtered, post_parent, guid,
    menu_order, post_type, post_mime_type, comment_count
)
SELECT 
    1, NOW(), NOW(),
    '노무체크AI는 근로자와 사업주가 노무·산재 관련 정보를 쉽게 확인할 수 있는 AI 기반 정보 제공 플랫폼입니다.\n\n본 사이트는 일반적인 노무 정보를 제공하며 개인별 법률 조언이 아닙니다.\n구체적인 상담은 고용노동부(1350) 또는 공인노무사에게 문의하시기 바랍니다.',
    '노무체크AI 소개', '', 'publish', 'closed', 'closed', 'about', '', '',
    NOW(), NOW(), '', 0, 'http://www.laborcheckai.co.kr/about',
    0, 'page', '', 0
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM wp_posts WHERE post_name = 'about' AND post_type = 'page');

-- 2. 개인정보처리방침 페이지 (privacy-policy)
INSERT INTO wp_posts (
    post_author, post_date, post_date_gmt, post_content, post_title, post_excerpt,
    post_status, comment_status, ping_status, post_name, to_ping, pinged,
    post_modified, post_modified_gmt, post_content_filtered, post_parent, guid,
    menu_order, post_type, post_mime_type, comment_count
)
SELECT 
    1, NOW(), NOW(),
    '노무체크AI(이하 "사이트")는 이용자의 개인정보를 중요시하며 정보통신망 이용촉진 및 정보보호에 관한 법률을 준수합니다.\n\n수집하는 개인정보: 없음 (비회원 열람 서비스)\n쿠키 사용: 방문 통계 목적 (Google Analytics)\n제3자 제공: 없음\n문의: laborcheckai@gmail.com',
    '개인정보처리방침', '', 'publish', 'closed', 'closed', 'privacy-policy', '', '',
    NOW(), NOW(), '', 0, 'http://www.laborcheckai.co.kr/privacy-policy',
    0, 'page', '', 0
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM wp_posts WHERE post_name = 'privacy-policy' AND post_type = 'page');

-- 3. 연락처 페이지 (contact)
INSERT INTO wp_posts (
    post_author, post_date, post_date_gmt, post_content, post_title, post_excerpt,
    post_status, comment_status, ping_status, post_name, to_ping, pinged,
    post_modified, post_modified_gmt, post_content_filtered, post_parent, guid,
    menu_order, post_type, post_mime_type, comment_count
)
SELECT 
    1, NOW(), NOW(),
    '노무체크AI 문의\n\n이메일: laborcheckai@gmail.com\n운영시간: 24시간 AI 자동 응답\n노무 긴급 상담: 고용노동부 1350 (무료)',
    '연락처', '', 'publish', 'closed', 'closed', 'contact', '', '',
    NOW(), NOW(), '', 0, 'http://www.laborcheckai.co.kr/contact',
    0, 'page', '', 0
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM wp_posts WHERE post_name = 'contact' AND post_type = 'page');
