document.addEventListener('DOMContentLoaded', () => {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsPanel = document.getElementById('settingsPanel');
    const saveKeyBtn = document.getElementById('saveKeyBtn');
    const apiKeyInput = document.getElementById('apiKey');

    const userPromptInput = document.getElementById('userPrompt');
    const refineBtn = document.getElementById('refineBtn');
    const refinedPromptOutput = document.getElementById('refinedPrompt');
    const copyBtn = document.getElementById('copyBtn');
    const loader = document.querySelector('.loader');

    // Load saved API key
    chrome.storage.local.get(['geminiApiKey'], (result) => {
        if (result.geminiApiKey) {
            apiKeyInput.value = result.geminiApiKey;
        } else {
            // Show settings if no key
            settingsPanel.classList.remove('hidden');
        }
    });

    // Toggle Settings
    settingsBtn.addEventListener('click', () => {
        settingsPanel.classList.toggle('hidden');
    });

    // Save API Key
    saveKeyBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (key) {
            chrome.storage.local.set({ geminiApiKey: key }, () => {
                alert('API Key가 저장되었습니다.');
                settingsPanel.classList.add('hidden');
            });
        } else {
            alert('API Key를 입력해주세요.');
        }
    });

    // Refine Prompt
    refineBtn.addEventListener('click', async () => {
        const prompt = userPromptInput.value.trim();
        if (!prompt) {
            alert('아이디어를 입력해주세요.');
            return;
        }

        chrome.storage.local.get(['geminiApiKey'], async (result) => {
            const apiKey = result.geminiApiKey;
            if (!apiKey) {
                alert('설정에서 Gemini API Key를 먼저 저장해주세요.');
                settingsPanel.classList.remove('hidden');
                return;
            }

            // UI Loading State
            refineBtn.disabled = true;
            loader.classList.remove('hidden');
            refinedPromptOutput.value = '정제 중...';

            try {
                const refinedText = await callGeminiAPI(apiKey, prompt);
                refinedPromptOutput.value = refinedText;
            } catch (error) {
                console.error('Error:', error);
                refinedPromptOutput.value = `오류가 발생했습니다: ${error.message}`;
            } finally {
                refineBtn.disabled = false;
                loader.classList.add('hidden');
            }
        });
    });

    // Copy to Clipboard
    copyBtn.addEventListener('click', () => {
        const content = refinedPromptOutput.value;
        navigator.clipboard.writeText(content).then(() => {
            const originalText = copyBtn.innerText;
            copyBtn.innerText = '복사됨!';
            setTimeout(() => {
                copyBtn.innerText = originalText;
            }, 2000);
        });
    });

    async function callGeminiAPI(apiKey, userPrompt) {
        // Using 'gemini-2.5-flash' as requested
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
            throw new Error(errorData.error?.message || 'Gemini API 호출 실패');
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }
});
