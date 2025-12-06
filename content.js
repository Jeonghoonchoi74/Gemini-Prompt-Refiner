// content.js
let activeInput = null;
let floatingBtn = null;
let modal = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

// 1. Initialize Floating Button
function createFloatingButton() {
    const btn = document.createElement('button');
    btn.id = 'gemini-floating-btn';
    btn.innerText = '✨';
    btn.style.display = 'none';
    document.body.appendChild(btn);

    btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleModal();
    });

    return btn;
}

// 2. Initialize Draggable Modal
function createModal() {
    const modalContainer = document.createElement('div');
    modalContainer.id = 'gemini-refiner-modal';
    modalContainer.style.display = 'none';

    modalContainer.innerHTML = `
    <div class="gemini-modal-content">
      <header id="gemini-drag-handle" title="드래그해서 이동">
        <h3>프롬프트 도우미</h3>
        <div style="display:flex; align-items:center;">
            <input type="range" id="gemini-opacity-slider" min="0.2" max="1" step="0.1" value="1" title="투명도 조절">
            <button id="gemini-close-btn" title="닫기">✕</button>
        </div>
      </header>
      <div class="gemini-body">
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <label style="margin:0;">Gemini API Key</label>
            <button id="gemini-edit-key-btn" style="font-size:11px; color:#6B7280; background:none; border:none; cursor:pointer; text-decoration:underline; display:none;">수정</button>
        </div>
        
        <div id="gemini-api-key-container">
            <input type="password" id="gemini-api-key" placeholder="API Key를 입력하세요">
            <p style="font-size:10px; color:#9CA3AF; margin-top:4px;">* 키는 브라우저에만 안전하게 저장됩니다.</p>
        </div>
        
        <div style="display:flex; justify-content:space-between; align-items:flex-end;">
            <label style="margin-top:10px; margin-bottom:6px;">나의 아이디어</label>
            <div class="gemini-chips">
                <button class="gemini-chip-btn" data-insert="[역할]: ">+ 역할</button>
                <button class="gemini-chip-btn" data-insert="[목표]: ">+ 목표</button>
                <button class="gemini-chip-btn" data-insert="[분량]: ">+ 분량</button>
            </div>
        </div>
        
        <textarea id="gemini-user-prompt" placeholder="원하는 내용을 대략적으로 적어보세요..."></textarea>
        
        <button id="gemini-refine-btn">프롬프트 개선하기</button>
        
        <label>결과</label>
        <textarea id="gemini-result-prompt" placeholder="개선된 프롬프트가 여기에 나타납니다."></textarea>
        
        <div class="gemini-actions">
           <!-- Copy button removed as requested -->
           <button id="gemini-insert-btn">입력창에 넣기</button>
        </div>
      </div>
    </div>
  `;

    document.body.appendChild(modalContainer);

    const header = modalContainer.querySelector('header');
    const closeBtn = modalContainer.querySelector('#gemini-close-btn');

    // Slider Logic
    const slider = modalContainer.querySelector('#gemini-opacity-slider');
    slider.addEventListener('input', (e) => {
        modalContainer.style.opacity = e.target.value;
    });
    slider.addEventListener('change', (e) => {
        chrome.storage.local.set({ modalOpacity: e.target.value });
    });
    // Prevent Drag when using slider
    slider.addEventListener('mousedown', (e) => e.stopPropagation());

    // Chip Logic
    const chips = modalContainer.querySelectorAll('.gemini-chip-btn');
    const promptInput = modalContainer.querySelector('#gemini-user-prompt');

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            const textToInsert = chip.getAttribute('data-insert');
            const cursorPosition = promptInput.selectionStart;
            const currentText = promptInput.value;

            const newText = currentText.slice(0, cursorPosition) +
                (cursorPosition > 0 && currentText[cursorPosition - 1] !== '\n' ? '\n' : '') +
                textToInsert +
                currentText.slice(cursorPosition);

            promptInput.value = newText;
            promptInput.focus();
        });
    });

    // Toggle API Key Field
    modalContainer.querySelector('#gemini-edit-key-btn').addEventListener('click', () => {
        const container = modalContainer.querySelector('#gemini-api-key-container');
        if (container.style.display === 'none') {
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    });

    // CLOSE Logic
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeModal();
    });

    // DRAG Logic
    header.addEventListener('mousedown', startDrag);

    // LOGIC
    modalContainer.querySelector('#gemini-refine-btn').addEventListener('click', async () => {
        const apiKeyInput = modalContainer.querySelector('#gemini-api-key');
        const userPrompt = modalContainer.querySelector('#gemini-user-prompt').value;
        const resultArea = modalContainer.querySelector('#gemini-result-prompt');
        const refineBtn = modalContainer.querySelector('#gemini-refine-btn');

        let apiKey = apiKeyInput.value;
        if (!apiKey) {
            const stored = await chrome.storage.local.get(['geminiApiKey']);
            apiKey = stored.geminiApiKey;
        }

        if (!apiKey) {
            alert('API Key를 입력해주세요.');
            modalContainer.querySelector('#gemini-api-key-container').style.display = 'block';
            return;
        }

        // Save Key locally
        if (apiKeyInput.value) {
            chrome.storage.local.set({ geminiApiKey: apiKey });
        }

        if (!userPrompt) {
            alert('아이디어를 입력해주세요.');
            return;
        }

        refineBtn.innerText = '개선 중...';
        refineBtn.disabled = true;

        chrome.runtime.sendMessage({
            action: 'CALL_GEMINI',
            apiKey: apiKey,
            prompt: userPrompt
        }, (response) => {
            refineBtn.innerText = '프롬프트 개선하기';
            refineBtn.disabled = false;

            if (response && response.success) {
                resultArea.value = response.data;
            } else {
                resultArea.value = '오류가 발생했습니다: ' + (response.error || '알 수 없는 오류');
            }
        });
    });

    modalContainer.querySelector('#gemini-insert-btn').addEventListener('click', async () => {
        const text = modalContainer.querySelector('#gemini-result-prompt').value;

        try {
            await navigator.clipboard.writeText(text);
        } catch (e) { }

        closeModal();
        if (activeInput) {
            activeInput.focus();
            const success = document.execCommand('insertText', false, text);
            if (!success) {
                if (activeInput.value !== undefined && activeInput.tagName !== 'DIV') {
                    activeInput.value = text;
                } else {
                    activeInput.innerText = text;
                }
                const event = new Event('input', { bubbles: true });
                activeInput.dispatchEvent(event);
            }
        }
    });

    // Stop click propagation inside modal
    modalContainer.addEventListener('mousedown', (e) => {
        e.stopPropagation();
    });

    return modalContainer;
}

// Dragging Functions
function startDrag(e) {
    isDragging = true;
    const modalContainer = document.getElementById('gemini-refiner-modal');
    const rect = modalContainer.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;

    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
}

function drag(e) {
    if (!isDragging) return;
    e.preventDefault();
    const modalContainer = document.getElementById('gemini-refiner-modal');
    modalContainer.style.left = `${e.clientX - dragOffset.x}px`;
    modalContainer.style.top = `${e.clientY - dragOffset.y}px`;
}

function stopDrag() {
    isDragging = false;
    const modalContainer = document.getElementById('gemini-refiner-modal');
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDrag);

    // SAVE POSITION
    const rect = modalContainer.getBoundingClientRect();
    chrome.storage.local.set({
        modalPosition: {
            left: rect.left,
            top: rect.top
        }
    });
}

// Focus Logic
function handleFocus(target) {
    if (modal && modal.contains(target)) return;
    if (floatingBtn && floatingBtn.contains(target)) return;

    const isInput = target.tagName === 'TEXTAREA' ||
        (target.tagName === 'INPUT' && target.type === 'text') ||
        target.isContentEditable ||
        target.getAttribute('role') === 'textbox';

    if (isInput) {
        activeInput = target;
        setTimeout(() => repositionButton(target), 50);
    }
}

document.addEventListener('click', (e) => handleFocus(e.target), true);
document.addEventListener('focusin', (e) => handleFocus(e.target));


function repositionButton(input) {
    if (!floatingBtn) floatingBtn = createFloatingButton();

    // Find Wrapper
    let anchorElement = input;
    const geminiWrapper = input.closest('.text-input-field') || input.closest('.text-input-field_textarea-wrapper');
    if (geminiWrapper) {
        anchorElement = geminiWrapper;
    }

    const rect = anchorElement.getBoundingClientRect();
    if (rect.width === 0) return;

    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    // Default: Left of input
    let leftPos = rect.left + scrollX - 50;
    if (leftPos < 10) leftPos = rect.left + scrollX + 10;

    floatingBtn.style.display = 'flex';
    floatingBtn.style.top = `${rect.top + scrollY + 10}px`;
    floatingBtn.style.left = `${leftPos}px`;
}

function toggleModal() {
    if (!modal) modal = createModal();

    if (modal.style.display === 'none') {
        // OPEN

        // CHECK API KEY & Hide Input if exists
        chrome.storage.local.get(['modalPosition', 'geminiApiKey', 'modalOpacity'], (res) => {
            // LOAD OPACITY
            let initialOpacity = '1';
            if (res.modalOpacity) {
                initialOpacity = res.modalOpacity;
                modal.querySelector('#gemini-opacity-slider').value = res.modalOpacity;
            }
            modal.style.opacity = initialOpacity;
            modal.style.display = 'block';

            // UI Logic for Key
            const keyContainer = modal.querySelector('#gemini-api-key-container');
            const keyInput = modal.querySelector('#gemini-api-key');
            const editBtn = modal.querySelector('#gemini-edit-key-btn');

            if (res.geminiApiKey) {
                keyInput.value = res.geminiApiKey;
                keyContainer.style.display = 'none'; // Hide
                editBtn.style.display = 'inline-block'; // Show Edit
                editBtn.innerText = '수정';
            } else {
                keyInput.value = '';
                keyContainer.style.display = 'block'; // Show
                editBtn.style.display = 'none'; // Hide Edit
            }

            // POSITION Logic
            const btnRect = floatingBtn.getBoundingClientRect();
            const modalRect = modal.getBoundingClientRect();
            const scrollY = window.scrollY;
            const scrollX = window.scrollX;

            if (res.modalPosition) {
                modal.style.top = `${res.modalPosition.top}px`;
                modal.style.left = `${res.modalPosition.left}px`;
            } else {
                // Default: Left of Button
                let newLeft = (btnRect.left + scrollX) - modalRect.width - 15;
                let newTop = (btnRect.bottom + scrollY) - modalRect.height;

                if (newLeft < 10) newLeft = 10;
                if (newTop < 10) newTop = 10;

                modal.style.top = `${newTop}px`;
                modal.style.left = `${newLeft}px`;
            }
        });

        const promptInput = modal.querySelector('#gemini-user-prompt');
        let currentText = '';
        if (activeInput) {
            if (activeInput.value !== undefined && activeInput.tagName !== 'DIV') {
                currentText = activeInput.value;
            } else {
                currentText = activeInput.innerText;
            }
        }
        if (currentText && !promptInput.value) {
            promptInput.value = currentText;
        }

    } else {
        closeModal();
    }
}

function closeModal() {
    if (modal) modal.style.display = 'none';
}
