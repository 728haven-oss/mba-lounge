"""학교별 '특징 · 입학 시기 · 입학 방법 · 금액' 정리 (조사 기준일 2026-10-15)

공식 홈페이지·모집요강·등록금 표를 바탕으로 라운지가 직접 정리한 값이다.
실행: python3 tools/guide_data.py  → assets/data/schools.json 에 guide / faculty 를 합친다.
금액 단위는 원. sem=졸업까지 등록금을 내는 학기 수, adm=입학금, total=등록금 합계(입학금 제외).
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

G = {
'yonsei': {
  'tagline': '야간·주말·영어·기업 맞춤까지 과정이 가장 다양하다. EMBA는 FT 2026 평가 국내 1위.',
  'intake': [
    ['Corporate · Finance MBA', '매년 3월', '9월 중순 ~ 10월 중순'],
    ['Executive MBA', '매년 3월', '9월 중순 ~ 10월 중순'],
    ['Global MBA (영어)', '매년 9월', '3월 (2026년 기준)'],
    ['Advanced · GBI · Police MBA', '매년 3월', '협약 기업·기관 추천'],
  ],
  'process': [
    ['Corporate · Finance MBA 2027년 3월 입학', [['원서 접수', '2026.9.15 – 10.16'], ['면접 대상 발표', '11.18'], ['대면 면접', '11.28 (토)'], ['최종 발표', '12.15']]],
    ['Executive MBA 2027년 3월 입학', [['원서 접수', '2026.9.15 – 10.16'], ['면접 대상 발표', '11.4'], ['대면 면접', '11.14 (토)'], ['최종 발표', '12.1']]],
  ],
  'req': [
    ['학력', '학사 학위 (2027년 2월 취득 예정 포함)'],
    ['경력', 'Corporate·Finance: 만 2년 이상 재직 중 / EMBA: 10년 내외 재직 중'],
    ['영어', '국내 과정은 선택 제출(가점). Global MBA는 TOEFL 91 · TOEIC 800 · IELTS 6.0 이상'],
    ['GMAT', '요구하지 않음 (Global MBA는 제출 시 우대)'],
    ['선발', '서류 심사 → 대면 면접'],
    ['제출 서류', '자기소개서, 추천서 1부, 졸업·성적증명서, 재직·경력증명서'],
  ],
  'cost': [
    ['Corporate MBA', 11866000, 4, 1211000, None, '2026'],
    ['Finance MBA', 11866000, 4, 1211000, None, '2026'],
    ['Executive MBA', 22702000, 4, 1211000, None, '2026'],
    ['Global MBA', 16933000, 3, 1211000, None, '2026', "외국인 등록금표 '22~'25 기수 기준"],
    ['Advanced MBA', 12520000, 4, None, 50110000, '2026', '입학금 별도'],
  ],
},
'snu': {
  'tagline': '1년 만에 끝나는 주간 풀타임 MBA와, 협약 기업이 보내는 주말 EMBA 두 과정에 집중한다.',
  'intake': [
    ['Full-time MBA (주간)', '매년 7월 말 ~ 8월 초', '2월 말 ~ 3월 중순 (2027 요강은 12월경 게시)'],
    ['Executive MBA (주말)', '매년 3월', '9월 초 ~ 10월 초'],
  ],
  'process': [
    ['Executive MBA 2027년 3월 입학', [['원서 접수', '2026.9.7 – 10.8'], ['TEPS 특별시험', '10.14'], ['1단계 발표', '10.30'], ['면접·구술고사', '11.4'], ['합격 발표', '11.23']]],
    ['Full-time MBA (2026년 입학 일정, 참고)', [['원서 접수', '2026.2.26 – 3.13'], ['1차 발표', '4.10'], ['면접·구술고사', '5.1'], ['합격 발표', '5.22']]],
  ],
  'req': [
    ['학력', '학사 학위'],
    ['경력', 'Full-time: 요건 없음 (입학생 평균 6년) / EMBA: 7년 이상 + 협약 기업 추천, 회사가 학비 50% 이상 지원'],
    ['영어', 'Full-time: TEPS 322 · TOEFL 94 · TOEIC 825 · IELTS 6.5 이상 / EMBA: 성적 필수(최저점 없음)'],
    ['GMAT', '선택 (Full-time은 제출 권장)'],
    ['선발', '서류 심사 → 면접 및 구술고사'],
    ['전형료', '100,000원'],
  ],
  'cost': [
    ['Full-time MBA', 10782500, 4, 169000, 43130000, '2026'],
    ['Executive MBA', 22000000, 4, 169000, None, '2026', '입학금은 대학원 공통 기준'],
  ],
},
'kaist': {
  'tagline': '금융·디지털·소셜벤처 등 분야별 전문 MBA가 여럿이다. 디지털금융MBA는 여의도에서 수업한다.',
  'intake': [
    ['KMBA · Impact · 금융MBA · MFE (주간)', '매년 3월', '9월 말 ~ 10월 초'],
    ['Executive · Professional · 디지털금융 MBA', '매년 3월', '9월 말 ~ 10월 초'],
    ['정보경영프로그램 (IMMS)', '매년 9월', '3월 말 ~ 4월 초'],
  ],
  'process': [
    ['봄학기 7개 과정 공통 2027년 3월 입학', [['원서 접수', '2026.9.29 – 10.8'], ['서류 합격 발표', '11.12'], ['면접', '11.14 – 11.22'], ['최종 발표', '12.10']]],
  ],
  'req': [
    ['학력', '학사 학위 (입학 전 취득 예정 포함)'],
    ['경력', 'KMBA 2년 이상 우대 / 금융MBA·MFE·디지털금융 필수 아님 / PMBA 재직자 5년 이상 우대 / EMBA 10년 이상'],
    ['영어', 'KMBA·PMBA·디지털금융: TOEFL iBT 4.5(구 83) · TOEIC 720 · TEPS 326 · IELTS 6.5 / 금융MBA·MFE 필수 / Impact MBA 없음'],
    ['GMAT', '요구하지 않음 (금융MBA·MFE·디지털금융은 우수성 자료로 제출 가능)'],
    ['선발', '서류 심사 → 면접 (필기 없음)'],
  ],
  'cost': [
    ['KAIST MBA (KMBA)', 13200000, 4, None, None, '2025', '총액징수제: 입학 연도 금액이 재학 중 고정'],
    ['Impact MBA', 13200000, 4, None, None, '2025', '창업 학생 전액 장학 가능'],
    ['금융MBA', 15910000, 4, None, None, '2025'],
    ['금융공학 (MFE)', 15910000, 4, None, None, '2025'],
    ['Executive MBA', 22000000, 4, None, None, '2025'],
    ['Professional MBA', 8300000, 6, None, None, '2025'],
    ['디지털금융MBA', 12000000, 4, None, None, '2025'],
    ['정보경영 (IMMS)', 10500000, 4, None, None, '2025'],
  ],
},
'korea': {
  'tagline': '정원 약 200명의 대형 야간 MBA와 경력 없이 지원 가능한 Finance MBA, QS 국내 1위 Global MBA.',
  'intake': [
    ['Korea MBA · Finance MBA', '매년 3월', '9월 초 ~ 10월 중순'],
    ['Executive MBA', '매년 3월', '9월 초 ~ 10월 중순'],
    ['Global MBA (영어)', '매년 9월', '1월 ~ 4월, 3차례 (2026년 기준)'],
  ],
  'process': [
    ['Korea MBA 2027년 3월 입학', [['원서 접수', '2026.9.7 – 10.16'], ['서류 발표', '11.6'], ['구술면접 (영어 포함)', '11.15'], ['최종 발표', '11.25']]],
    ['Executive MBA 2027년 3월 입학', [['원서 접수', '2026.9.7 – 10.16'], ['서류 발표', '10.30'], ['구술면접', '11.7'], ['최종 발표', '11.13']]],
    ['Finance MBA 2027년 3월 입학', [['원서 접수', '2026.9.7 – 10.16'], ['서류 발표', '11.6'], ['구술면접 (한국어)', '11.14'], ['최종 발표', '11.25']]],
  ],
  'req': [
    ['학력', '4년제 대학 학사 학위'],
    ['경력', 'Korea MBA: 재직 중 (3년 이상 권장) / EMBA: 중견간부 이상, 10년 이상 우대 / Finance: 경력 없어도 지원 가능'],
    ['영어', '국내 과정은 선택 제출(최저점 없음) / Global MBA는 성적 필수(최저점 없음)'],
    ['GMAT', '요구하지 않음 (Global MBA는 선택)'],
    ['선발', '서류 심사 → 구술면접'],
  ],
  'cost': [
    ['Korea MBA', 12200000, 4, 1234000, None, '2026'],
    ['Finance MBA', 12200000, 4, 1234000, None, '2026'],
    ['Executive MBA', 22200000, 4, 1234000, None, '2026'],
    ['Global MBA', 23210000, None, 1234000, None, '2026', '학기 수는 1년·1.5년·2년 중 선택에 따라 다름'],
  ],
},
'sogang': {
  'tagline': '1년 주간 S-MBA와 토요일만 다니는 AI-MBA. 3월·9월 두 번 입학하고 원서는 세 차례 받는다.',
  'intake': [
    ['Pro-MBA (야간) · S-MBA (주간)', '3월 · 9월', '3월 입학은 10월 ~ 12월, 3차례'],
    ['AI-MBA (토요일)', '매년 3월', '10월 ~ 12월, 3차례'],
    ['G-MBA (외국인, 중국어)', '3월 · 9월', '9월 말 ~ 12월 초, 3차례'],
  ],
  'process': [
    ['Pro · S · AI-MBA 2027년 3월 입학', [['1차 접수', '2026.10.8 – 10.21 (면접 10.30, 발표 11.6)'], ['2차 접수', '11.6 – 11.19 (면접 11.27, 발표 12.4)'], ['3차 접수', '12.4 – 12.17 (면접 12.24, 발표 12.31)'], ['등록', '2027년 1월']]],
  ],
  'req': [
    ['학력', '학사 학위 (2027년 2월 취득 예정 포함)'],
    ['경력', 'Pro-MBA: 재직자·경력자 (3년 이상 권장) / S-MBA·AI-MBA: 필수 요건 없음'],
    ['영어', '필기 시험 없음. S-MBA 일반 트랙은 영어 성적 가산점'],
    ['GMAT', '요구하지 않음'],
    ['선발', '서류와 면접을 합산해 평가'],
    ['전형료', '100,000원'],
  ],
  'cost': [
    ['Pro-MBA', 11075000, 4, 1145000, None, '2026'],
    ['S-MBA', 15667000, 3, None, 41778000, '2026', '정규 2학기 + 여름학기(10,444,000원)'],
    ['AI-MBA', 11070000, 3, None, 33210000, '2026'],
    ['G-MBA', 8564000, None, 1145000, None, '2026'],
  ],
},
'hanyang': {
  'tagline': '의료·금융·문화예술·ESG 등 산업별 트랙이 가장 많다. 논문·졸업시험 없이 2년.',
  'intake': [
    ['Hanyang MBA · Professional MBA', '3월 · 9월', '3월 입학은 10월 중순 ~ 말'],
    ['International MBA (영어)', '3월 · 9월', '내국인은 국내 과정과 같은 일정'],
    ['China MBA (외국인)', '공식 안내 확인', '외국인 모집 요강 별도'],
  ],
  'process': [
    ['Hanyang · Professional · International MBA 2027년 3월 입학', [['입학설명회', '2026.10.15 (목) 19:00'], ['원서 접수·서류 제출', '10.15 – 10.29'], ['대면 면접', '11.14 (토)'], ['합격 발표', '11.20']]],
  ],
  'req': [
    ['학력', '학사 학위 (2027년 2월 취득 예정 포함)'],
    ['경력', '필수 요건 없음'],
    ['영어', '필기 시험 없음'],
    ['선발', '서류 40% + 면접 60%'],
    ['전형료', '80,000원 (수수료 별도)'],
    ['장학', '한양대 졸업생·공무원·군인·경찰 등록금 20%, 협약 기관 파견 50% 이내'],
  ],
  'cost': [
    ['Hanyang MBA', 10634000, 4, 1030000, None, '2026'],
    ['Professional MBA', 10634000, 4, 1030000, None, '2026'],
    ['International MBA', 10634000, 4, 1030000, None, '2026'],
  ],
},
'ewha': {
  'tagline': '여성 직장인을 위한 야간 Frontier MBA와 예술·럭셔리 산업 특화 Art&Luxury MBA. AACSB 4회 연속 인증.',
  'intake': [
    ['Global MBA · Frontier MBA · Art&Luxury MBA', '매년 3월', '10월 · 11월 ~ 12월, 2차례'],
  ],
  'process': [
    ['전 과정 2027년 3월 입학', [['1차 접수', '2026.10.1 – 10.21 (면접 11.7, 발표 11.23)'], ['2차 접수', '11.25 – 12.22 (면접 2027.1.9, 발표 1.22)']]],
  ],
  'req': [
    ['학력', '학사 학위 (2027년 2월 이전 취득 예정 포함)'],
    ['경력', '필수 요건 없음'],
    ['영어', '어학 성적은 소지자만 제출'],
    ['GMAT', '요구하지 않음'],
    ['선발', '서류 → 구술 면접, 총점 순'],
    ['전형료', '80,000원'],
  ],
  'cost': [
    ['Global MBA', 12200000, 3, 1120000, None, '2026', '약'],
    ['Frontier MBA', 10200000, 4, 1120000, None, '2026', '약'],
    ['Art&Luxury MBA', 10200000, 4, 1120000, None, '2026', '약'],
  ],
},
'cau': {
  'tagline': '원하는 요일로 시간표를 짜는 야간 Leader MBA와 Zoom 중심의 ESG(SM) MBA. 원서를 세 번 받는다.',
  'intake': [
    ['Global MBA · CAU-Leader MBA · SM MBA', '매년 3월', '10월 ~ 2027년 1월, 3차례'],
  ],
  'process': [
    ['전 과정 2027년 3월 입학', [['수시 전형', '2026.10.19 – 11.1 (면접 11.6 또는 11.7, 발표 11.17)'], ['일반 전형', '11.25 – 12.13 (면접 12.19, 발표 12.29)'], ['특별 전형', '12.28 – 2027.1.10 (면접 1.23, 발표 1.29)']]],
  ],
  'req': [
    ['학력', '학사 학위, 전공 무관'],
    ['경력', 'Leader MBA는 실무 경력자, SM MBA는 ESG 경력자 우대 (필수 아님)'],
    ['영어', '필수 아님 (가산 요소). Global MBA는 영어 강의 수강 가능해야 함'],
    ['GMAT', '요구하지 않음'],
    ['선발', '서류 100점 + 면접 100점, 각각 60% 미만은 탈락'],
    ['전형료', '80,000원'],
  ],
  'cost': [
    ['Global MBA', 11841000, 4, None, None, '2026'],
    ['CAU-Leader MBA', 10393000, 4, 980000, None, '2026'],
    ['SM MBA', 10393000, 4, 980000, None, '2026'],
  ],
},
'konkuk': {
  'tagline': '학기 등록금이 낮은 편이고 입학·성적 장학이 넓다. 인사조직·노사와 AI-DX 특화 과정.',
  'intake': [
    ['Konkuk · AI-DX · 인사조직·노사 MBA', '3월 · 9월', '3월 입학은 보통 10월 ~ 1월 (2027 요강 미게시)'],
  ],
  'process': [
    ['2026학년도 후기 (참고)', [['1차 접수', '2026.4.14 – 5.8'], ['서류 발표', '5.14'], ['면접', '5.23 (토)'], ['최종 발표', '5.29']]],
  ],
  'req': [
    ['학력', '4년제 대학 학사 학위 (취득 예정 포함)'],
    ['경력', '필수 요건 없음'],
    ['영어', '선택 제출'],
    ['선발', '서류 50% + 면접 50%'],
    ['전형료', '80,000원'],
    ['장학', '입학 장학 등록금 15 ~ 30%, 재학 중 성적에 따라 최대 60%'],
  ],
  'cost': [
    ['Konkuk MBA', 9316000, 4, None, None, '2026', '경영전문대학원 수업료 · 학술활동비 250,000원/학기 별도'],
    ['AI-DX MBA', 9316000, 4, None, None, '2026', '경영전문대학원 수업료 · 학술활동비 250,000원/학기 별도'],
    ['인사조직·노사 MBA', 9316000, 4, None, None, '2026', '경영전문대학원 수업료 · 학술활동비 250,000원/학기 별도'],
  ],
},
'skku': {
  'tagline': '영어로 수업하는 SKK GSB(인디애나대 복수학위 EMBA 포함)와 한국어 EMBA 두 갈래로 운영한다.',
  'intake': [
    ['SKK GSB Full-Time MBA', '매년 8월', '라운드 1: 11월 6일 마감'],
    ['SKK GSB Professional · AI MBA', '1월 (PMBA는 8월도)', '9월 ~ 11월, 2라운드'],
    ['Kelley-SKK Executive MBA', '매년 8월', '9월 ~ 2027년 4월, 2라운드'],
    ['경영전문대학원 EMBA (한국어)', '매년 3월', '10월 중순 ~ 11월 초'],
  ],
  'process': [
    ['경영전문대학원 EMBA 121기 2027년 3월 입학', [['원서 접수', '2026.10.19 – 11.2'], ['서류 제출', '~ 11.3'], ['대면 면접', '11.7 (토)'], ['합격 발표', '11.13']]],
    ['SKK GSB Professional · AI MBA 2027년 1월 입학', [['라운드 1', '2026.9.1 – 10.16 (면접 11.2 – 6, 발표 11.23)'], ['라운드 2', '10.17 – 11.13 (면접 11.30 – 12.4, 발표 12.16)']]],
  ],
  'req': [
    ['학력', '학사 학위'],
    ['경력', 'Full-Time: 요건 없음 / PMBA·AI MBA: 2년 이상 / Kelley EMBA: 8년 이상 / 한국어 EMBA: 재직 중'],
    ['영어', 'Full-Time 성적 필수 / PMBA·AI MBA 선택 / 한국어 EMBA 없음'],
    ['GMAT', '선택'],
    ['선발', '서류 → 초청 면접'],
    ['장학', 'SKK GSB는 과정별 500만 ~ 3,000만원 장학 공개'],
  ],
  'cost': [
    ['Full-Time MBA', None, 3, 1300000, 53000000, '2025'],
    ['Professional MBA', None, 6, 1300000, 53000000, '2026'],
    ['Kelley-SKK Executive MBA', None, 4, 1300000, 95000000, '2026', '인디애나대 학위 포함'],
    ['AI MBA', None, 4, 1300000, 53000000, '2026'],
    ['FinTech MBA', 10600000, 4, 1465000, None, '2026'],
    ['경영전문대학원 EMBA', 9387000, 4, 1465000, None, '2026'],
  ],
},
}

def cost_rows(rows):
    out = []
    for r in rows:
        prog, per, sem, adm, total, year = r[:6]
        note = r[6] if len(r) > 6 else ''
        if total is None and per and sem:
            total = per * sem
        out.append({'program': prog, 'per_semester': per, 'semesters': sem, 'admission': adm, 'total': total,
                    'all_in': (total + (adm or 0)) if total else None, 'year': year, 'note': note})
    return out

def main():
    path = os.path.join(ROOT, 'assets/data/schools.json')
    data = json.load(open(path))
    fac_path = sys.argv[1] if len(sys.argv) > 1 else None
    fac = json.load(open(fac_path)) if fac_path else {}
    for s in data['schools']:
        g = G[s['id']]
        s['guide'] = {'tagline': g['tagline'],
                      'intake': [{'program': a, 'start': b, 'apply': c} for a, b, c in g['intake']],
                      'process': [{'title': t, 'steps': [{'label': a, 'when': b} for a, b in st]} for t, st in g['process']],
                      'req': [{'k': a, 'v': b} for a, b in g['req']],
                      'cost': cost_rows(g['cost'])}
        if fac:
            f = fac[s['id']]
            s['faculty'] = {
                'url': f.get('faculty_page_url'), 'count': f['total_faculty'].get('count'), 'as_of': f['total_faculty'].get('as_of'),
                'areas': [{'area': a['area'], 'count': a['count']} for a in f.get('areas', []) if a.get('count')],
                'strengths': f.get('strengths', []),
                'notable': [{k: n.get(k) for k in ('name', 'name_en', 'role', 'area', 'phd', 'highlights', 'source_url')} for n in f.get('notable', [])],
                'news': [n for n in f.get('recent_news', []) if n.get('url')],
            }
    json.dump(data, open(path, 'w'), ensure_ascii=False, indent=1)
    print('guide merged', len(data['schools']))

if __name__ == '__main__':
    main()
