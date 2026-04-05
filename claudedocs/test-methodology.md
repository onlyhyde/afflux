# Afflux 테스트 방법론

수정 작업 완료 후 재테스트 시 동일한 방법을 재현하기 위한 문서.

---

## 테스트 환경

- URL: http://localhost:3001/ko/
- 도구: Chrome DevTools MCP (mcp__plugin_chrome-devtools-mcp_chrome-devtools)
- 로케일: ko (한국어)
- DB: Docker PostgreSQL (pnpm docker:up), 시드 데이터 적용 (pnpm db:seed:dev)

## 사전 조건

```bash
pnpm docker:up        # PostgreSQL + Redis 시작
pnpm db:push          # 스키마 적용
pnpm db:custom        # RLS, GIN 인덱스, 트리거 적용
pnpm db:seed:dev      # 시드 데이터 삽입
pnpm dev              # 개발 서버 시작
```

## 테스트 순서

### 1. 페이지 순회 (스크린샷 + 콘솔 에러 확인)

각 페이지에서 수행할 것:
- `take_screenshot` — 화면 렌더링 확인
- `list_console_messages(types: ["error", "warn"])` — JS 에러 확인
- `take_snapshot` — DOM 구조 확인 (i18n 누락 탐지)

| # | 페이지 | URL |
|---|--------|-----|
| 1 | 홈 | /ko/ |
| 2 | 대시보드 | /ko/dashboard |
| 3 | 크리에이터 검색 | /ko/creators |
| 4 | 크리에이터 상세 | /ko/creators/{id} (첫 번째 크리에이터 "프로필 보기" 클릭) |
| 5 | 아웃리치 - Campaigns | /ko/outreach |
| 6 | 아웃리치 - 템플릿 | /ko/outreach (템플릿 탭 클릭) |
| 7 | 아웃리치 - Stats | /ko/outreach (Stats 탭 클릭) |
| 8 | CRM | /ko/crm |
| 9 | 분석 | /ko/analytics |
| 10 | 콘텐츠 - Videos | /ko/content |
| 11 | 콘텐츠 - Spark Codes | /ko/content (Spark Codes 탭 클릭) |
| 12 | 콘텐츠 - AI Scripts | /ko/content (AI Scripts 탭 클릭) |
| 13 | 캠페인 - Samples | /ko/campaigns |
| 14 | 캠페인 - Contests | /ko/campaigns (Contests 탭 클릭) |
| 15 | 캠페인 - Competitors | /ko/campaigns (Competitors 탭 클릭) |
| 16 | 설정 - General | /ko/settings |
| 17 | 설정 - Team | /ko/settings (Team 탭 클릭) |
| 18 | 설정 - Billing | /ko/settings (Billing 탭 클릭) |

### 2. 핵심 플로우 인터랙션 테스트

#### 플로우 A: 크리에이터 발견 → 아웃리치
1. /ko/creators 이동
2. 검색창에 "Beauty" 입력 → 필터링 확인
3. "필터" 버튼 클릭 → 필터 패널 열림 확인
4. 카테고리 드롭다운 변경 → 필터 적용 확인
5. 첫 번째 크리에이터 "프로필 보기" 클릭
6. 크리에이터 상세 프로필 정보 확인
7. "Send Outreach" 클릭 → 메시지 작성 폼 표시 확인
8. 메시지 작성 후 발송 확인

#### 플로우 B: 아웃리치 캠페인 관리
1. /ko/outreach 이동
2. "+ New Campaign" 클릭 → 폼 표시 확인
3. Campaign Name 입력, Channel/Template/Creator List 선택
4. "생성" 클릭 → 새 캠페인 카드 생성 확인
5. draft 캠페인 "Start" 클릭 → running 전환 확인
6. running 캠페인 "Pause" 클릭 → paused 전환 확인

#### 플로우 C: CRM 파이프라인 관리
1. /ko/crm 이동
2. 각 스테이지(발굴/접촉/협상 중/활성/비활성) 카드 표시 확인
3. 카드 "..." 메뉴 클릭 → 액션 메뉴 표시 확인
4. 스테이지 변경 동작 확인
5. 중복 카드 없이 크리에이터당 1카드 확인

#### 플로우 D: 콘텐츠 성과 추적
1. /ko/content 이동
2. Videos 탭 → 비디오 목록 표시 확인
3. Spark Codes 탭 → 스파크 코드 목록 확인
4. AI Scripts 탭 → 기능 확인

#### 플로우 E: 리스트 관리
1. /ko/creators 이동
2. "리스트에 추가" 버튼 클릭 → 드롭다운 표시 확인
3. 리스트 선택 → 추가 성공 확인
4. "New list..." 입력 → 새 리스트 생성 확인

### 3. i18n 검증

각 페이지의 `take_snapshot` 결과에서 영어 텍스트 탐지:
- StaticText 노드 중 영어만으로 구성된 텍스트 찾기
- 버튼/탭/헤더/라벨에 영어가 있으면 번역 누락으로 판정
- 데이터 값(크리에이터 이름, 카테고리 등)은 제외

### 4. 에러 체크리스트

- [ ] 모든 페이지에서 콘솔 에러 없음
- [ ] 모든 버튼/링크가 의도된 동작 수행
- [ ] alert/dialog가 에러 없이 처리됨
- [ ] 페이지 간 네비게이션 정상
- [ ] 데이터가 시드 기반으로 정확히 표시됨
