"""조사 결과(research/*.json)를 사이트 데이터(assets/data/schools.json)로 합친다."""
import json, glob, sys
src = sys.argv[1]; out = sys.argv[2]
raw = {}
for f in [src + '/' + n for n in ('yonsei_snu.json','kaist_korea.json','sogang_hanyang.json','ewha_cau.json','konkuk_skku.json')]:
    raw.update(json.load(open(f)))
# 앱(app-web.html)의 schools 배열과 같은 id·이름·색
APP = [
 ('yonsei','연세대학교','연세','#003876','#E7EEF7'), ('snu','서울대학교','서울','#16348C','#E9ECF7'),
 ('kaist','카이스트','KAIST','#004191','#E6EFF9'), ('korea','고려대학교','고려','#8E0E1F','#F7E9EB'),
 ('sogang','서강대학교','서강','#B3242F','#FAECED'), ('hanyang','한양대학교','한양','#1A6FAF','#E8F2F9'),
 ('ewha','이화여자대학교','이화','#00462A','#E6F0EC'), ('cau','중앙대학교','중앙','#1240AB','#E8EDF9'),
 ('konkuk','건국대학교','건국','#036B3F','#E6F3EC'), ('skku','성균관대학교','성균관','#0F6B5C','#E7F3F0'),
]
# 2027 입학 원서 접수 기간 (공식 요강 확인분). 상태는 페이지에서 오늘 날짜로 계산
D = {
 'yonsei': [('Corporate·Finance·Executive MBA','2026-09-15','2026-10-16')],
 'snu':    [('Executive MBA','2026-09-07','2026-10-08')],
 'kaist':  [('봄학기 MBA 공통 (KMBA·FMBA·EMBA·PMBA 등)','2026-09-29','2026-10-08')],
 'korea':  [('Korea·Executive·Finance MBA','2026-09-07','2026-10-16')],
 'sogang': [('Pro·S·AI-MBA 1차','2026-10-08','2026-10-21'),('Pro·S·AI-MBA 2차','2026-11-06','2026-11-19'),('Pro·S·AI-MBA 3차','2026-12-04','2026-12-17'),
            ('G-MBA 1차','2026-09-28','2026-10-09'),('G-MBA 2차','2026-10-26','2026-11-06'),('G-MBA 3차','2026-11-23','2026-12-04')],
 'hanyang':[('Hanyang·Professional·International MBA','2026-10-15','2026-10-29')],
 'ewha':   [('전 과정 1차','2026-10-01','2026-10-21'),('전 과정 2차','2026-11-25','2026-12-22')],
 'cau':    [('수시전형','2026-10-19','2026-11-01'),('일반전형','2026-11-25','2026-12-13'),('특별전형','2026-12-28','2027-01-10')],
 'konkuk': [],
 'skku':   [('EMBA (경영전문대학원) 121기','2026-10-19','2026-11-02'),('Professional·AI MBA R1','2026-09-01','2026-10-16'),
            ('Professional·AI MBA R2','2026-10-17','2026-11-13'),('Kelley-SKK EMBA R1','2026-09-07','2026-10-12'),('Full-Time MBA R1 마감','2026-11-06','2026-11-06')],
}
TYPE = {'Full-time':'주간 풀타임','Part-time(야간/주말)':'야간·주말','Executive':'Executive','Global/English':'영어 과정','Specialized':'특화 과정'}
res = []
for sid,name,short,color,soft in APP:
    r = raw[sid]
    for p in r['programs']:
        p['type_ko'] = TYPE.get(p.get('type'), p.get('type') or '')
    res.append({
        'id':sid,'name':name,'short':short,'color':color,'soft':soft,
        'official_name':r.get('official_name'),'mba_site_url':r.get('mba_site_url'),'admissions_url':r.get('admissions_url'),
        'programs':r['programs'],'admissions':r['admissions'],'analysis':r.get('analysis') or [],
        'news_sources':r.get('news_sources') or [],
        'news':sorted(r.get('news') or [], key=lambda n:n.get('date') or '', reverse=True),
        'deadlines':[{'label':a,'start':b,'end':c} for a,b,c in D[sid]],
        'notes':r.get('notes'),
    })
json.dump({'checked':'2026-10-15','schools':res}, open(out,'w'), ensure_ascii=False, indent=1)
print('ok', len(res))
