// background.js - Handles API calls to avoid CORS issues in content scripts

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'CALL_GEMINI') {
        callGeminiAPI(request.apiKey, request.prompt)
            .then(data => sendResponse({ success: true, data: data }))
            .catch(error => sendResponse({ success: false, error: error.message }));

        return true; // Will respond asynchronously
    }
});

async function callGeminiAPI(apiKey, userPrompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const systemInstruction = `
당신은 전문 프롬프트 엔지니어입니다.
사용자가 제시하는 거친 아이디어나 요구사항을 LLM(Large Language Model)이 가장 잘 이해하고 고품질의 결과를 낼 수 있는 "최적화된 프롬프트"로 다시 작성해주는 것이 임무입니다.

지침:
1. 명확성: 모호한 표현을 구체적으로 바꿉니다.
2. 구조화: 역할 부여(Persona), 작업 설명(Task), 제약 조건(Constraints), 출력 형식(Output Format) 등을 포함하여 구조화합니다.
3. 언어: 사용자가 입력한 언어와 동일한 언어로 출력 프롬프트를 작성하세요.
4. 답변 형식: 서론이나 부가 설명 없이, 오직 "정제된 프롬프트 내용"만 출력하세요.
  `;

    const payload = {
        contents: [{
            parts: [{
                text: `${systemInstruction}\n\n사용자 입력: ${userPrompt}\n\n최적화된 프롬프트:`
            }]
        }]
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Gemini API call failed');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}
