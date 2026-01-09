## Notion Image Popup (정적 웹앱)

Notion에서 **특정 텍스트에 링크를 걸고**, 클릭 시 **이미지가 팝업(모달)로 뜨고**, 화면의 다른 곳을 클릭하면 **닫히며 돌아가는** 동작을 만드는 초경량 정적 페이지입니다.

> 참고: Notion은 페이지 내부에 임의 JS를 주입할 수 없어서, “Notion 내부에서 바로 팝업”은 불가능합니다.  
> 대신 **링크 클릭 → 아주 작은 외부 페이지가 즉시 모달로 이미지 표시** 방식으로 UX를 최대한 자연스럽게 맞춥니다.

### 파일 구성

- `index.html`: 팝업 표시 페이지 (Notion 텍스트에 걸 URL)
- `popup.js`: 모달/닫기/뒤로가기 로직
- `builder.html`: 링크 생성기 (img/caption/back URL을 넣으면 최종 링크를 만들어줌)
- `builder.js`: 링크 생성기 로직
- `styles.css`: 공통 스타일

### Notion에서 쓰는 방법

1) 이 폴더를 GitHub Pages(또는 사내 정적 호스팅)에 올립니다.  
2) Notion에서 원하는 텍스트를 선택 → 링크 추가 → 아래처럼 URL을 넣습니다.

예시:

`https://<your-domain>/notion-image-popup/index.html?img=https%3A%2F%2Fexample.com%2Fimage.png&caption=%ED%81%AC%EB%A6%AC%EC%97%90%EC%9D%B4%ED%8B%B0%EB%B8%8C%20A`

샘플(이 프로젝트에 포함된 이미지로 바로 테스트):

`https://<your-domain>/notion-image-popup/index.html?img=./assets/sample.svg&caption=Sample%20Creative`

로컬에서 빠르게 확인(서버 없이):

- `index.html`을 더블클릭으로 열고, 주소창에 `?img=./assets/sample.svg&caption=Sample%20Creative` 가 붙어있는지 확인하세요.  
  (로컬 미리보기를 위해 `file://`도 허용해두었습니다.)

### GitHub Pages로 배포(가장 쉬운 방법)

1) GitHub에 새 repo 생성 (예: `notion-image-popup`)  
2) 이 폴더의 파일들을 repo 루트에 업로드  
3) GitHub repo 설정 → **Pages** → Source를 `Deploy from a branch` / `main` / `/ (root)`로 선택  
4) 발급된 Pages 주소(예: `https://<id>.github.io/notion-image-popup/`)를 기반으로 Notion 링크를 만듭니다.

### URL 파라미터

- `img` (**필수**): 이미지 URL (http/https **또는 동일 호스트 기준 상대경로** `./assets/...`)
- `caption` (선택): 상단 캡션 텍스트
- `back` (강력 추천): 닫을 때 이동할 Notion URL  
  - **보안상 `notion.so` / `notion.site` 도메인만 허용**합니다.

### 닫기 동작

- 배경 클릭 / `ESC` / `×` 버튼: 닫기
- 닫을 때 우선순위
  - `back`(유효하면) → 해당 Notion URL로 이동
  - 그 외 `document.referrer`가 Notion이면 → referrer로 이동
  - 그 외 히스토리가 있으면 → `history.back()`
  - 마지막 fallback → “탭을 닫아주세요” 안내

> 참고: “탭을 자동으로 닫기”는 브라우저 정책상 **항상** 성공하지 않습니다.  
> 대신 `back`을 넣어두면 닫을 때 **원래 Notion 페이지로 즉시 복귀**가 안정적으로 됩니다.

