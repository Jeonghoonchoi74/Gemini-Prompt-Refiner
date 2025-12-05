# 프롬프트 개선 (Gemini Prompt Refiner)

Gemini API를 활용하여 사용자의 거친 아이디어를 LLM이 이해하기 쉬운 **최적의 프롬프트로 다듬어주는 크롬 확장 프로그램**입니다.
Gemini 사이트에서 바로 작동하며, 작업을 방해하지 않는 플로팅 윈도우 UI를 제공합니다.

## 주요 기능 (Key Features)

*   **간편한 접근 (Floating Button)**
    *   `Gemini` 사이트의 입력창 옆에 자동으로 **'✨' 버튼**이 나타납니다.
    *   버튼을 누르면 프롬프트 개선 도구가 즉시 실행됩니다.

*   **드래그 가능한 창 (Modeless & Draggable)**
    *   작업 내용을 가리지 않도록 창을 **원하는 위치로 드래그**할 수 있습니다.
    *   창을 닫았다가 다시 열어도 **마지막 위치를 기억**합니다.
    *   창이 떠 있는 상태에서도 페이지의 다른 내용을 클릭하거나 복사할 수 있습니다.

*   **AI 프롬프트 최적화**
    *   사용자의 대략적인 아이디어를 Gemini API가 분석하여 구체적이고 체계적인 프롬프트로 변환해줍니다.

*   **사용자 친화적 UI**
    *   **완벽한 한글 지원**.
    *   **스마트 API Key 관리**: API Key는 브라우저 내부에 안전하게 저장되며, 등록 후에는 화면에서 숨겨져 깔끔한 UI를 유지합니다. (필요 시 '수정' 가능)

## 설치 방법 (Installation)

1.  이 저장소를 다운로드하거나 클론(Clone)합니다.
2.  크롬 브라우저 주소창에 `chrome://extensions`를 입력하여 **확장 프로그램 관리 페이지**로 이동합니다.
3.  우측 상단의 **'개발자 모드(Developer mode)'** 스위치를 켭니다.
4.  좌측 상단의 **'압축 해제된 확장 프로그램을 로드합니다(Load unpacked)'** 버튼을 클릭합니다.
5.  다운로드 받은 폴더(`gemini extension`)를 선택합니다.

## 사용법 (Usage)

1.  [Google Gemini](https://gemini.google.com/) 사이트에 접속합니다.
2.  입력창 옆에 나타난 **✨ 버튼**을 클릭합니다.
3.  (최초 1회) **Gemini API Key**를 입력합니다. ([API Key 발급받기](https://aistudio.google.com/app/apikey))
4.  **'나의 아이디어'** 칸에 프롬프트 원본을 대충 적습니다.
    *   예: *"여행 계획 짜줘 일본으로"*
5.  **✨ 프롬프트 개선하기** 버튼을 클릭합니다.
6.  결과를 확인하고, **'입력창에 넣기'** 버튼을 누르면 채팅창에 자동으로 입력됩니다.

## 기술 스택 (Tech Stack)

*   **Language**: JavaScript (Vanilla), HTML, CSS
*   **Platform**: Chrome Extensions API (Manifest V3)
*   **AI Model**: Google Gemini 2.5 Flash API (via `fetch` in Background Script)

## 개인정보 보호 (Privacy)

*   사용자의 **API Key**는 어디론가 전송되지 않으며, 오직 사용자의 **로컬 크롬 브라우저 저장소(`chrome.storage.local`)**에만 저장됩니다.
*   프롬프트 데이터는 오직 개선을 위해 Google Gemini API로만 전송됩니다.
