javascript:(function(){
    // ===== REMOVE ANY EXISTING PANEL =====
    const existing = document.getElementById('__forest_panel__');
    if (existing) existing.remove();

    // ===== HELPERS (shared by all actions) =====
    function findWhiteboard() {
        const selectors = [
            'canvas', '.whiteboard canvas', '#whiteboard canvas',
            '[data-testid="whiteboard"] canvas', '.drawing-canvas', '#canvas'
        ];
        for (const s of selectors) {
            const el = document.querySelector(s);
            if (el) { console.log('Found whiteboard canvas:', s); return el; }
        }
        return null;
    }

    function zoomOutWhiteboard() {
        const targets = [
            document.activeElement, document.body, document,
            ...document.querySelectorAll('canvas'),
            ...document.querySelectorAll('[class*="whiteboard" i]'),
            ...document.querySelectorAll('[class*="canvas" i]')
        ].filter(Boolean);
        for (let i = 0; i < 30; i++) {
            for (const t of targets) {
                try {
                    t.dispatchEvent(new KeyboardEvent('keydown', {
                        key: '-', code: 'Minus', keyCode: 189, which: 189,
                        ctrlKey: true, bubbles: true, cancelable: true
                    }));
                    t.dispatchEvent(new KeyboardEvent('keyup', {
                        key: '-', code: 'Minus', keyCode: 189, which: 189,
                        ctrlKey: true, bubbles: true, cancelable: true
                    }));
                } catch (e) {}
            }
        }
        const sels = [
            'button[aria-label*="zoom out" i]', 'button[title*="zoom out" i]',
            'button[data-testid*="zoom-out" i]', '[class*="zoom-out" i]',
            'button[aria-label*="zooma ut" i]', 'button[title*="zooma ut" i]',
            '[aria-label*="minus" i]'
        ];
        function scan(root) {
            sels.forEach(s => {
                try {
                    root.querySelectorAll(s).forEach(b => {
                        for (let i = 0; i < 40; i++) b.click();
                    });
                } catch (e) {}
            });
            root.querySelectorAll('*').forEach(el => {
                if (el.shadowRoot) scan(el.shadowRoot);
            });
        }
        scan(document);
        document.querySelectorAll('input[type="range"]').forEach(sl => {
            const min = parseFloat(sl.min || '0');
            if (!isNaN(min)) {
                sl.value = String(min);
                sl.dispatchEvent(new Event('input', {bubbles: true}));
                sl.dispatchEvent(new Event('change', {bubbles: true}));
            }
        });
        return new Promise(r => setTimeout(r, 500));
    }

    function makeLongCalculationFor(targetStr) {
        const fracMatch = targetStr.match(/^(-?\d+)\s*\/\s*(\d+)$/);
        if (fracMatch) {
            const num = parseInt(fracMatch[1], 10);
            const den = parseInt(fracMatch[2], 10);
            const factor = Math.floor(Math.random() * 5) + 2;
            return `${num * factor}/${den * factor}=${num}/${den}`;
        }

        const cleaned = targetStr.replace(/,/g, '.');
        const target = parseFloat(cleaned);
        if (isNaN(target)) return targetStr;

        const isDecimal = !Number.isInteger(target);
        const decimals = isDecimal ? (cleaned.split('.')[1] || '').length : 0;
        const style = Math.floor(Math.random() * 4);

        if (!isDecimal) {
            if (style === 0) {
                if (Math.random() < 0.5) {
                    const a = Math.floor(Math.random() * 50) + 20;
                    const b = Math.floor(Math.random() * 50) + 20;
                    const c = (a + b) - target;
                    if (c > 0) return `(${a}+${b})-${c}=${target}`;
                } else {
                    const a = Math.floor(Math.random() * 12) + 2;
                    const b = Math.floor(Math.random() * 12) + 2;
                    const prod = a * b;
                    if (target !== 0 && prod % target === 0) {
                        const c = prod / target;
                        return `(${a}*${b})/${c}=${target}`;
                    }
                }
            }
            if (style === 1) {
                const b = Math.floor(Math.random() * 12) + 2;
                const c = Math.floor(Math.random() * 12) + 2;
                const a = target - b * c;
                if (a >= 0) return `${a}+${b}*${c}=${target}`;
            }
            if (style === 2) {
                const a = Math.floor(Math.random() * 15) + 2;
                const b = Math.floor(Math.random() * 15) + 2;
                const c = a * b - target;
                if (c >= 0) return `${a}*${b}-${c}=${target}`;
            }
            if (style === 3) {
                const a = Math.floor(Math.random() * 40) + 10;
                const b = Math.floor(Math.random() * 40) + 10;
                const c = Math.floor(Math.random() * 40) + 10;
                const d = (a + b + c) - target;
                if (d >= 0) return `${a}+${b}+${c}-${d}=${target}`;
            }
            const a = Math.floor(Math.random() * 30) + 1;
            const b = target - a;
            return b >= 0 ? `${a}+${b}=${target}` : `${target}+0=${target}`;
        }

        const scale = Math.pow(10, decimals);
        const targetScaled = Math.round(target * scale);
        for (let i = 0; i < 20; i++) {
            const a = Math.floor(Math.random() * 20) + 2;
            const b = Math.floor(Math.random() * 20) + 2;
            const prod = a * b;
            const c = (prod * scale) / targetScaled;
            if (Number.isInteger(c) && c > 0 && c < 1000) {
                return `(${a}*${b})/${c}=${target}`;
            }
        }
        const a = Math.floor(Math.random() * Math.max(1, Math.floor(target))) + 1;
        const b = +(target - a).toFixed(decimals);
        return `${a}+${b}=${target}`;
    }

    function simulateDrawing(canvas, textOverride) {
        if (!canvas) { console.log('No canvas'); return false; }
        const ctx = canvas.getContext('2d');
        if (!ctx) return false;

        const cw = canvas.width, ch = canvas.height;
        const scale = Math.min(cw / 800, ch / 600);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = Math.max(2, 2 * scale);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const rect = canvas.getBoundingClientRect();
        const toScreen = (x, y) => ({
            x: rect.left + (x / cw) * rect.width,
            y: rect.top + (y / ch) * rect.height
        });

        function path(points) {
            if (!points.length) return;
            const f = toScreen(points[0].x, points[0].y);
            canvas.dispatchEvent(new MouseEvent('mousedown', {
                clientX: f.x, clientY: f.y, button: 0, bubbles: true
            }));
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            points.forEach(p => {
                const sp = toScreen(p.x, p.y);
                canvas.dispatchEvent(new MouseEvent('mousemove', {
                    clientX: sp.x, clientY: sp.y, button: 0, bubbles: true
                }));
                ctx.lineTo(p.x, p.y);
            });
            ctx.stroke();
            const l = toScreen(points[points.length - 1].x, points[points.length - 1].y);
            canvas.dispatchEvent(new MouseEvent('mouseup', {
                clientX: l.x, clientY: l.y, button: 0, bubbles: true
            }));
        }

        const line = (x1, y1, x2, y2) => path([{x: x1, y: y1}, {x: x2, y: y2}]);
        const circle = (cx, cy, r) => {
            const pts = [];
            for (let i = 0; i <= 20; i++) {
                const a = (i / 20) * Math.PI * 2;
                pts.push({x: cx + r * Math.cos(a), y: cy + r * Math.sin(a)});
            }
            path(pts);
        };

        function drawChar(ch, x, y, size) {
            const h = size, w = size * 0.6;
            switch (ch) {
                case '0': circle(x + w/2, y + h/2, h/2); break;
                case '1': line(x + w/2, y, x + w/2, y + h); break;
                case '2':
                    line(x, y, x + w, y);
                    line(x + w, y, x + w, y + h/2);
                    line(x + w, y + h/2, x, y + h/2);
                    line(x, y + h/2, x, y + h);
                    line(x, y + h, x + w, y + h);
                    break;
                case '3':
                    line(x, y, x + w, y);
                    line(x + w, y, x + w, y + h);
                    line(x + w, y + h, x, y + h);
                    line(x + w, y + h/2, x, y + h/2);
                    break;
                case '4':
                    line(x, y, x, y + h/2);
                    line(x, y + h/2, x + w, y + h/2);
                    line(x + w, y, x + w, y + h);
                    break;
                case '5':
                    line(x + w, y, x, y);
                    line(x, y, x, y + h/2);
                    line(x, y + h/2, x + w, y + h/2);
                    line(x + w, y + h/2, x + w, y + h);
                    line(x + w, y + h, x, y + h);
                    break;
                case '6':
                    line(x + w, y, x, y);
                    line(x, y, x, y + h);
                    line(x, y + h, x + w, y + h);
                    line(x + w, y + h, x + w, y + h/2);
                    line(x + w, y + h/2, x, y + h/2);
                    break;
                case '7':
                    line(x, y, x + w, y);
                    line(x + w, y, x + w, y + h);
                    break;
                case '8':
                    circle(x + w/2, y + h/4, h/4);
                    circle(x + w/2, y + 3*h/4, h/4);
                    break;
                case '9':
                    line(x + w, y + h, x + w, y);
                    line(x + w, y, x, y);
                    line(x, y, x, y + h/2);
                    line(x, y + h/2, x + w, y + h/2);
                    break;
                case '.':
                    circle(x + w/2, y + h - size*0.08, size*0.06);
                    break;
                case '+':
                    line(x + w/2, y + h*0.15, x + w/2, y + h*0.85);
                    line(x, y + h/2, x + w, y + h/2);
                    break;
                case '-': line(x, y + h/2, x + w, y + h/2); break;
                case '*':
                    line(x, y + h*0.15, x + w, y + h*0.85);
                    line(x + w, y + h*0.15, x, y + h*0.85);
                    break;
                case '/':
                    line(x + w, y + h*0.15, x, y + h*0.85);
                    break;
                case '=':
                    line(x, y + h*0.35, x + w, y + h*0.35);
                    line(x, y + h*0.65, x + w, y + h*0.65);
                    break;
                case '(':
                    circle(x + w*1.5, y + h/2, h/2);
                    break;
                case ')':
                    circle(x - w*0.5, y + h/2, h/2);
                    break;
            }
        }

        const text = textOverride || '0';
        console.log('Drawing on whiteboard:', text);

        const chars = text.split('');
        const targetWidth = cw * 0.92;
        const targetHeight = ch * 0.35;
        let size = Math.min(targetHeight, (targetWidth / chars.length) / 0.7);
        size = Math.max(14, Math.min(size, 120));

        const spacing = size * 0.75;
        const totalW = chars.length * spacing;
        const startX = Math.max(8, (cw - totalW) / 2);
        const startY = (ch - size) / 2;

        let cx = startX;
        for (const ch of chars) {
            drawChar(ch, cx, startY, size);
            cx += spacing;
        }
        return true;
    }

    function findReactAnswer() {
        const root = document.getElementById('root');
        if (!root) return null;
        const key = Object.keys(root).find(k => k.includes('react'));
        if (!key) return null;
        let answer = null;
        function scan(n) {
            if (!n || answer !== null) return;
            let st = n.memoizedState;
            while (st) {
                const v = st.memoizedState;
                if (v && v.correctAnswer !== undefined) answer = v.correctAnswer;
                if (v && v.answer !== undefined) answer = v.answer;
                st = st.next;
            }
            const p = n.memoizedProps || {};
            if (p.correctAnswer !== undefined) answer = p.correctAnswer;
            if (p.answer !== undefined) answer = p.answer;
            scan(n.child); scan(n.sibling);
        }
        scan(root[key]);
        return answer;
    }

    function answerToString(a) {
        if (a === null || a === undefined) return '';
        if (Array.isArray(a)) a = a[0];
        if (typeof a === 'number') {
            let s = String(a);
            if (s.includes('e') || s.includes('E')) {
                s = a.toFixed(10).replace(/0+$/, '').replace(/\.$/, '');
            }
            return s;
        }
        if (typeof a === 'string') return a.trim();
        if (typeof a === 'object') {
            if (a.numerator !== undefined && a.denominator !== undefined)
                return `${a.numerator}/${a.denominator}`;
            if (a.n !== undefined && a.d !== undefined) return `${a.n}/${a.d}`;
            if (a.value !== undefined) return String(a.value);
        }
        return String(a);
    }

    function getCleanAnswer() {
        const raw = findReactAnswer();
        let s = answerToString(raw);
        s = s.replace(/^\[|\]$/g, '').trim();
        s = s.replace(/(\d),(\d)/g, '$1.$2');
        s = s.replace(/^=\s*/, '').trim();
        return s;
    }

    // ===== ACTIONS =====
    async function actionAnswerOnly() {
        const clean = getCleanAnswer();
        console.log('Answer only. Normalized answer:', clean);
        if (!clean) { alert('No answer found in React state'); return; }
        const fields = [...document.querySelectorAll('math-field')];
        fields.forEach(field => {
            try { field.blur(); } catch (e) {}
            try {
                if (typeof field.setValue === 'function')
                    field.setValue('', {suppressChangeNotifications: true});
            } catch (e) {}
            try { field.value = ''; } catch (e) {}
            const inner = field.querySelector('input, textarea');
            if (inner) inner.value = '';
            field.dispatchEvent(new Event('input', {bubbles: true}));
            field.dispatchEvent(new Event('change', {bubbles: true}));
            field.focus();
            setTimeout(() => {
                let ok = false;
                try {
                    if (typeof field.insert === 'function') {
                        field.insert(clean);
                        ok = true;
                    }
                } catch (e) {}
                if (!ok) { try { field.value = clean; } catch (e) {} }
                field.dispatchEvent(new InputEvent('input', {
                    bubbles: true, cancelable: true,
                    inputType: 'insertText', data: clean
                }));
                field.dispatchEvent(new Event('change', {bubbles: true}));
            }, 50);
        });
        // Multiple-choice too, in case it's that kind
        const choices = [...document.querySelectorAll('.answer-variant-container')];
        if (choices.length && clean) {
            choices.forEach(c => {
                const t = c.innerText.replace(/\s+/g, ' ').trim();
                if (t.includes(clean) || clean.includes(t)) {
                    const radio = c.querySelector('input[type="radio"]');
                    if (radio) {
                        radio.checked = true;
                        radio.dispatchEvent(new Event('click', {bubbles: true}));
                        radio.dispatchEvent(new Event('change', {bubbles: true}));
                    }
                    c.click();
                }
            });
        }
    }

    async function actionDrawOnly() {
        await zoomOutWhiteboard();
        const clean = getCleanAnswer();
        const line = clean ? makeLongCalculationFor(clean) : makeLongCalculationFor(String(Math.floor(Math.random() * 900) + 100));
        console.log('Draw only. Line:', line);
        const canvas = findWhiteboard();
        if (canvas) simulateDrawing(canvas, line);
    }

    async function actionComplete() {
        await zoomOutWhiteboard();
        const clean = getCleanAnswer();
        console.log('Complete. Normalized answer:', clean);

        // Draw long work on whiteboard
        if (clean) {
            const line = makeLongCalculationFor(clean);
            console.log('Whiteboard line:', line);
            const canvas = findWhiteboard();
            if (canvas) simulateDrawing(canvas, line);
        }

        // Fill math-field or select multiple choice
        if (clean) {
            const fields = [...document.querySelectorAll('math-field')];
            fields.forEach(field => {
                try { field.blur(); } catch (e) {}
                try {
                    if (typeof field.setValue === 'function')
                        field.setValue('', {suppressChangeNotifications: true});
                } catch (e) {}
                try { field.value = ''; } catch (e) {}
                const inner = field.querySelector('input, textarea');
                if (inner) inner.value = '';
                field.dispatchEvent(new Event('input', {bubbles: true}));
                field.dispatchEvent(new Event('change', {bubbles: true}));
                field.focus();
                setTimeout(() => {
                    let ok = false;
                    try {
                        if (typeof field.insert === 'function') {
                            field.insert(clean);
                            ok = true;
                        }
                    } catch (e) {}
                    if (!ok) { try { field.value = clean; } catch (e) {} }
                    field.dispatchEvent(new InputEvent('input', {
                        bubbles: true, cancelable: true,
                        inputType: 'insertText', data: clean
                    }));
                    field.dispatchEvent(new Event('change', {bubbles: true}));
                }, 50);
            });

            const choices = [...document.querySelectorAll('.answer-variant-container')];
            if (choices.length) {
                let found = false;
                choices.forEach(c => {
                    const t = c.innerText.replace(/\s+/g, ' ').trim();
                    if (t.includes(clean) || clean.includes(t)) {
                        const radio = c.querySelector('input[type="radio"]');
                        if (radio) {
                            radio.checked = true;
                            radio.dispatchEvent(new Event('click', {bubbles: true}));
                            radio.dispatchEvent(new Event('change', {bubbles: true}));
                        }
                        c.click();
                        found = true;
                    }
                });
                if (!found) choices[0].click();
            }
        }

        // Submit
        setTimeout(() => {
            const trySubmit = (n) => {
                const b = document.querySelector('#SUBMIT_ANSWER_BUTTON');
                if (b) {
                    if (!b.disabled) { b.click(); return; }
                    if (n >= 3) {
                        b.disabled = false;
                        b.classList.remove('_Disabled_1vdsg_349', '_ProblemAnswerButtonDisabled_1ov0s_21');
                        b.click();
                        return;
                    }
                    setTimeout(() => trySubmit(n + 1), 500 * n);
                }
            };
            trySubmit(1);
        }, 700);
    }

    // ===== GUI PANEL =====
    const panel = document.createElement('div');
    panel.id = '__forest_panel__';
    panel.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 2147483647;
        background: #1e1e2e;
        color: #fff;
        padding: 14px 16px;
        border-radius: 10px;
        font-family: system-ui, sans-serif;
        font-size: 13px;
        box-shadow: 0 6px 24px rgba(0,0,0,0.5);
        min-width: 220px;
        user-select: none;
    `;

    const title = document.createElement('div');
    title.textContent = 'Forest';
    title.style.cssText = 'font-weight:700; font-size:15px; margin-bottom:10px; color:#89b4fa;';
    panel.appendChild(title);

    const info = document.createElement('div');
    info.textContent = 'Pick an action:';
    info.style.cssText = 'margin-bottom:10px; opacity:0.8;';
    panel.appendChild(info);

    function makeBtn(label, bg, fn) {
        const b = document.createElement('button');
        b.textContent = label;
        b.style.cssText = `
            display:block; width:100%; margin-bottom:8px;
            padding:9px 10px; border:none; border-radius:6px;
            background:${bg}; color:#fff; font-size:13px;
            cursor:pointer; font-weight:600;
        `;
        b.onmouseenter = () => b.style.filter = 'brightness(1.15)';
        b.onmouseleave = () => b.style.filter = 'none';
        b.onclick = async () => {
            b.disabled = true;
            b.style.opacity = '0.6';
            try { await fn(); } catch (e) { console.error(e); }
            b.disabled = false;
            b.style.opacity = '1';
        };
        panel.appendChild(b);
        return b;
    }

    makeBtn('1. Complete (draw + answer + submit)', '#89b4fa', actionComplete);
    makeBtn('2. Answer only', '#a6e3a1', actionAnswerOnly);
    makeBtn('3. Draw on whiteboard only', '#f9e2af', actionDrawOnly);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.cssText = `
        display:block; width:100%; margin-top:4px;
        padding:7px 10px; border:none; border-radius:6px;
        background:#45475a; color:#fff; font-size:12px;
        cursor:pointer;
    `;
    closeBtn.onclick = () => panel.remove();
    panel.appendChild(closeBtn);

    // Make draggable
    let drag = false, dx = 0, dy = 0;
    title.style.cursor = 'move';
    title.onmousedown = (e) => {
        drag = true;
        dx = e.clientX - panel.offsetLeft;
        dy = e.clientY - panel.offsetTop;
        e.preventDefault();
    };
    document.addEventListener('mousemove', (e) => {
        if (!drag) return;
        panel.style.left = (e.clientX - dx) + 'px';
        panel.style.top = (e.clientY - dy) + 'px';
        panel.style.right = 'auto';
    });
    document.addEventListener('mouseup', () => drag = false);

    document.body.appendChild(panel);
    console.log('Forest panel ready');
})();
