(function(){
    const existing = document.getElementById('__forest_panel__');
    if (existing) existing.remove();

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

    // Helper: reduce a fraction
    function gcd(a, b) { return b ? gcd(b, a % b) : Math.abs(a); }
    function simplifyFraction(n, d) {
        if (d === 0) return `${n}/${d}`;
        const g = gcd(n, d);
        return `${n / g}/${d / g}`;
    }

    // FIXED: handles "2/4", "(2/4)", "1 / 7", negative numerators, etc.
    function parseFraction(str) {
        if (!str) return null;
        let s = String(str).trim();
        // Strip outer parentheses or brackets
        s = s.replace(/^[\(\[\{]\s*/, '').replace(/\s*[\)\]\}]$/, '');
        // Strip inner brackets like "2/[14]" → "2/14"
        s = s.replace(/[\[\]\(\)\{\}]/g, '');
        const m = s.match(/^(-?\d+)\s*\/\s*(\d+)$/);
        if (!m) return null;
        const n = parseInt(m[1], 10);
        const d = parseInt(m[2], 10);
        if (!isFinite(n) || !isFinite(d) || d === 0) return null;
        return { n, d };
    }

    function makeLongCalculationFor(targetStr) {
        // Try to read it as a fraction (with or without parens/brackets)
        const frac = parseFraction(targetStr);
        if (frac) {
            const { n, d } = frac;
            const factor = Math.floor(Math.random() * 5) + 2;
            return `${n * factor}/${d * factor}=${simplifyFraction(n, d)}`;
        }

        const cleaned = String(targetStr).replace(/,/g, '.').replace(/[\[\]\(\)\{\}]/g, '');
        const target = parseFloat(cleaned);
        if (isNaN(target)) return String(targetStr);

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
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(15, 15, 25, 0.93)';
        const rect = canvas.getBoundingClientRect();
        const toScreen = (x, y) => ({
            x: rect.left + (x / cw) * rect.width,
            y: rect.top + (y / ch) * rect.height
        });

        function linePoints(x1, y1, x2, y2) {
            const dx = x2 - x1, dy = y2 - y1;
            const len = Math.hypot(dx, dy) || 1;
            const nx = -dy / len, ny = dx / len;
            const bow = (Math.random() - 0.5) * 0.08 * len;
            const mx = (x1 + x2) / 2 + nx * bow;
            const my = (y1 + y2) / 2 + ny * bow;
            const over = Math.random() * 0.04 * len;
            const ux = dx / len, uy = dy / len;
            const x2o = x2 + ux * over;
            const y2o = y2 + uy * over;
            const steps = Math.max(6, Math.floor(len / 3));
            const pts = [];
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const mt = 1 - t;
                pts.push({
                    x: mt * mt * x1 + 2 * mt * t * mx + t * t * x2o,
                    y: mt * mt * y1 + 2 * mt * t * my + t * t * y2o
                });
            }
            return pts;
        }

        function circlePoints(cx, cy, r) {
            const pts = [];
            const startAngle = Math.random() * Math.PI * 2;
            const overshoot = 0.15 + Math.random() * 0.25;
            const totalAngle = Math.PI * 2 + overshoot;
            const steps = 28;
            const rBase = r * (1 + (Math.random() - 0.5) * 0.05);
            let rJitter = 0;
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const a = startAngle + totalAngle * t;
                rJitter = rJitter * 0.6 + (Math.random() - 0.5) * rBase * 0.06;
                const rHere = rBase + rJitter;
                pts.push({
                    x: cx + rHere * Math.cos(a),
                    y: cy + rHere * Math.sin(a)
                });
            }
            return pts;
        }

        function jitterize(points, amt) {
            const dense = [];
            for (let i = 0; i < points.length - 1; i++) {
                const p1 = points[i], p2 = points[i + 1];
                const seg = Math.hypot(p2.x - p1.x, p2.y - p1.y);
                const sub = Math.max(1, Math.floor(seg / 3));
                for (let s = 0; s < sub; s++) {
                    const t = s / sub;
                    dense.push({
                        x: p1.x + (p2.x - p1.x) * t,
                        y: p1.y + (p2.y - p1.y) * t
                    });
                }
            }
            if (points.length) dense.push(points[points.length - 1]);
            let jx = 0, jy = 0;
            return dense.map((p) => {
                jx = jx * 0.7 + (Math.random() - 0.5) * amt;
                jy = jy * 0.7 + (Math.random() - 0.5) * amt;
                return { x: p.x + jx, y: p.y + jy };
            });
        }

        function drawStroke(points, baseWidth) {
            if (!points.length) return;
            const f = toScreen(points[0].x, points[0].y);
            canvas.dispatchEvent(new MouseEvent('mousedown', {
                clientX: f.x, clientY: f.y, button: 0, bubbles: true
            }));
            for (let i = 1; i < points.length; i++) {
                const p0 = points[i - 1], p1 = points[i];
                const t = i / points.length;
                const pressure = 0.55 + Math.sin(t * Math.PI) * 0.45;
                ctx.lineWidth = baseWidth * pressure * (0.9 + Math.random() * 0.2);
                ctx.beginPath();
                ctx.moveTo(p0.x, p0.y);
                ctx.lineTo(p1.x, p1.y);
                ctx.stroke();
                if (i % 2 === 0) {
                    const sp = toScreen(p1.x, p1.y);
                    canvas.dispatchEvent(new MouseEvent('mousemove', {
                        clientX: sp.x, clientY: sp.y, button: 0, bubbles: true
                    }));
                }
            }
            const l = toScreen(points[points.length - 1].x, points[points.length - 1].y);
            canvas.dispatchEvent(new MouseEvent('mouseup', {
                clientX: l.x, clientY: l.y, button: 0, bubbles: true
            }));
        }

        function getCharStrokes(ch, x, y, size) {
            const h = size, w = size * 0.6;
            const S = [];
            const L = (x1, y1, x2, y2) => S.push(linePoints(x1, y1, x2, y2));
            const C = (cx, cy, r) => S.push(circlePoints(cx, cy, r));
            switch (ch) {
                case '0': C(x + w / 2, y + h / 2, h / 2); break;
                case '1':
                    L(x + w * 0.35, y + h * 0.75, x + w / 2, y + h * 0.1);
                    L(x + w * 0.15, y + h * 0.75, x + w * 0.85, y + h * 0.75);
                    break;
                case '2':
                    L(x + w * 0.1, y + h * 0.25, x + w * 0.55, y + h * 0.05);
                    L(x + w * 0.55, y + h * 0.05, x + w * 0.85, y + h * 0.45);
                    L(x + w * 0.85, y + h * 0.45, x + w * 0.1, y + h * 0.85);
                    L(x + w * 0.1, y + h * 0.85, x + w * 0.9, y + h * 0.85);
                    break;
                case '3':
                    L(x + w * 0.15, y + h * 0.1, x + w * 0.8, y + h * 0.15);
                    L(x + w * 0.8, y + h * 0.15, x + w * 0.5, y + h * 0.5);
                    L(x + w * 0.5, y + h * 0.5, x + w * 0.85, y + h * 0.7);
                    L(x + w * 0.85, y + h * 0.7, x + w * 0.15, y + h * 0.9);
                    break;
                case '4':
                    L(x + w * 0.65, y + h * 0.05, x + w * 0.15, y + h * 0.65);
                    L(x + w * 0.15, y + h * 0.65, x + w * 0.9, y + h * 0.65);
                    L(x + w * 0.7, y + h * 0.4, x + w * 0.7, y + h * 0.95);
                    break;
                case '5':
                    L(x + w * 0.8, y + h * 0.1, x + w * 0.2, y + h * 0.1);
                    L(x + w * 0.2, y + h * 0.1, x + w * 0.15, y + h * 0.5);
                    L(x + w * 0.15, y + h * 0.5, x + w * 0.7, y + h * 0.45);
                    L(x + w * 0.7, y + h * 0.45, x + w * 0.85, y + h * 0.75);
                    L(x + w * 0.85, y + h * 0.75, x + w * 0.15, y + h * 0.9);
                    break;
                case '6':
                    L(x + w * 0.8, y + h * 0.1, x + w * 0.25, y + h * 0.4);
                    L(x + w * 0.25, y + h * 0.4, x + w * 0.2, y + h * 0.75);
                    L(x + w * 0.2, y + h * 0.75, x + w * 0.6, y + h * 0.9);
                    L(x + w * 0.6, y + h * 0.9, x + w * 0.8, y + h * 0.7);
                    L(x + w * 0.8, y + h * 0.7, x + w * 0.55, y + h * 0.55);
                    L(x + w * 0.55, y + h * 0.55, x + w * 0.2, y + h * 0.65);
                    break;
                case '7':
                    L(x + w * 0.1, y + h * 0.1, x + w * 0.85, y + h * 0.1);
                    L(x + w * 0.85, y + h * 0.1, x + w * 0.4, y + h * 0.9);
                    break;
                case '8':
                    C(x + w / 2, y + h * 0.28, h * 0.22);
                    C(x + w / 2, y + h * 0.72, h * 0.25);
                    break;
                case '9':
                    C(x + w / 2, y + h * 0.3, h * 0.22);
                    L(x + w * 0.75, y + h * 0.45, x + w * 0.4, y + h * 0.9);
                    break;
                case '.':
                    C(x + w / 2, y + h - size * 0.08, size * 0.05);
                    break;
                case '+':
                    L(x + w / 2, y + h * 0.15, x + w / 2, y + h * 0.85);
                    L(x + w * 0.05, y + h / 2, x + w * 0.95, y + h / 2);
                    break;
                case '-':
                    L(x, y + h / 2, x + w, y + h / 2);
                    break;
                case '*':
                    L(x + w * 0.05, y + h * 0.15, x + w * 0.95, y + h * 0.85);
                    L(x + w * 0.95, y + h * 0.15, x + w * 0.05, y + h * 0.85);
                    L(x + w / 2, y + h * 0.05, x + w / 2, y + h * 0.95);
                    break;
                case '/':
                    L(x + w * 0.95, y + h * 0.1, x + w * 0.05, y + h * 0.9);
                    break;
                case '=':
                    L(x + w * 0.05, y + h * 0.35, x + w * 0.95, y + h * 0.38);
                    L(x + w * 0.05, y + h * 0.65, x + w * 0.95, y + h * 0.68);
                    break;
                case '(':
                    {
                        const cx = x + w * 1.5;
                        const cy = y + h / 2;
                        const r = h / 2;
                        const pts = [];
                        const startA = -Math.PI * 0.55;
                        const endA = Math.PI * 0.55;
                        const steps = 14;
                        for (let i = 0; i <= steps; i++) {
                            const t = i / steps;
                            const a = startA + (endA - startA) * t;
                            pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
                        }
                        S.push(pts);
                    }
                    break;
                case ')':
                    {
                        const cx = x - w * 0.5;
                        const cy = y + h / 2;
                        const r = h / 2;
                        const pts = [];
                        const startA = Math.PI - Math.PI * 0.55;
                        const endA = Math.PI + Math.PI * 0.55;
                        const steps = 14;
                        for (let i = 0; i <= steps; i++) {
                            const t = i / steps;
                            const a = startA + (endA - startA) * t;
                            pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
                        }
                        S.push(pts);
                    }
                    break;
            }
            return S;
        }

        const text = textOverride || '0';
        console.log('Drawing on whiteboard:', text);
        const chars = text.split('');
        const targetWidth = cw * 0.92;
        const targetHeight = ch * 0.35;
        let size = Math.min(targetHeight, (targetWidth / chars.length) / 0.7);
        size = Math.max(14, Math.min(size, 120));
        const avgSpacing = size * 0.75;
        const totalW = chars.length * avgSpacing;
        const startX = Math.max(8, (cw - totalW) / 2);
        const baseY = (ch - size) / 2;
        const jitterAmt = size * 0.015;
        const baseWidth = Math.max(1.5, 2 * scale);
        let cx = startX;
        let baselineDrift = 0;
        let driftVel = 0;
        for (let i = 0; i < chars.length; i++) {
            const ch = chars[i];
            driftVel += (Math.random() - 0.5) * size * 0.02;
            driftVel *= 0.75;
            baselineDrift += driftVel;
            baselineDrift = Math.max(-size * 0.06, Math.min(size * 0.06, baselineDrift));
            const charSize = size * (0.93 + Math.random() * 0.14);
            const xOff = (Math.random() - 0.5) * size * 0.05;
            const yOff = baselineDrift + (Math.random() - 0.5) * size * 0.04;
            const rot = (Math.random() - 0.5) * 0.1;
            const charX = cx + xOff;
            const charY = baseY + yOff;
            const strokes = getCharStrokes(ch, charX, charY, charSize);
            const rcX = charX + charSize * 0.3;
            const rcY = charY + charSize / 2;
            const cos = Math.cos(rot), sin = Math.sin(rot);
            for (const rawStroke of strokes) {
                const rotated = rawStroke.map(p => {
                    const dx = p.x - rcX;
                    const dy = p.y - rcY;
                    return {
                        x: rcX + dx * cos - dy * sin,
                        y: rcY + dx * sin + dy * cos
                    };
                });
                const jittered = jitterize(rotated, jitterAmt);
                drawStroke(jittered, baseWidth);
            }
            cx += avgSpacing * (0.92 + Math.random() * 0.16);
        }
        return true;
    }
        function isPlausibleAnswer(v) {
        if (v === null || v === undefined) return false;
        if (typeof v === 'number') {
            if (!isFinite(v)) return false;
            if (Math.abs(v) > 1000000) return false;
            return true;
        }
        if (typeof v === 'string') {
            const t = v.trim();
            if (!t) return false;
            if (/^\d{6,}$/.test(t)) return false;
            return true;
        }
        if (typeof v === 'object') {
            if (Array.isArray(v)) return v.length > 0 && isPlausibleAnswer(v[0]);
            if (v.numerator !== undefined && v.denominator !== undefined) {
                const n = Number(v.numerator), d = Number(v.denominator);
                if (!isFinite(n) || !isFinite(d) || d === 0) return false;
                if (Math.abs(n) > 10000 || Math.abs(d) > 10000) return false;
                return true;
            }
            if (v.n !== undefined && v.d !== undefined) {
                const n = Number(v.n), d = Number(v.d);
                if (!isFinite(n) || !isFinite(d) || d === 0) return false;
                if (Math.abs(n) > 10000 || Math.abs(d) > 10000) return false;
                return true;
            }
            if (v.value !== undefined) return isPlausibleAnswer(v.value);
        }
        return false;
    }

    function findReactAnswer() {
        const root = document.getElementById('root');
        if (!root) return null;
        const key = Object.keys(root).find(k => k.includes('react'));
        if (!key) return null;
        let bestAnswer = null;
        let bestPriority = -1;
        function consider(value, priority) {
            if (!isPlausibleAnswer(value)) return;
            if (priority > bestPriority) {
                bestAnswer = value;
                bestPriority = priority;
            }
        }
        function scan(n) {
            if (!n) return;
            let st = n.memoizedState;
            while (st) {
                const v = st.memoizedState;
                if (v && typeof v === 'object') {
                    if (v.correctAnswer !== undefined) consider(v.correctAnswer, 3);
                    if (v.correctAnswerValue !== undefined) consider(v.correctAnswerValue, 3);
                    if (v.expectedAnswer !== undefined) consider(v.expectedAnswer, 2);
                    if (v.answer !== undefined && v.correctAnswer === undefined) {
                        consider(v.answer, 1);
                    }
                }
                st = st.next;
            }
            const p = n.memoizedProps || {};
            if (p.correctAnswer !== undefined) consider(p.correctAnswer, 3);
            if (p.correctAnswerValue !== undefined) consider(p.correctAnswerValue, 3);
            if (p.expectedAnswer !== undefined) consider(p.expectedAnswer, 2);
            if (p.answer !== undefined && p.correctAnswer === undefined) {
                consider(p.answer, 1);
            }
            scan(n.child);
            scan(n.sibling);
        }
        scan(root[key]);
        return bestAnswer;
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
            if (a.numerator !== undefined && a.denominator !== undefined) {
                return `${a.numerator}/${a.denominator}`;
            }
            if (a.n !== undefined && a.d !== undefined) return `${a.n}/${a.d}`;
            if (a.value !== undefined) return String(a.value);
        }
        return String(a);
    }

    // FIXED: strips ALL brackets/parens, simplifies fractions
    function getCleanAnswer() {
        const raw = findReactAnswer();
        console.log('[Forest] raw React answer:', raw, '| type:', typeof raw);
        let s = answerToString(raw);
        // Remove any brackets or parens anywhere in the string
        s = s.replace(/[\[\]\(\)\{\}]/g, '');
        s = s.replace(/\s+/g, '').trim();
        // Simplification check
        const frac = parseFraction(s);
        if (frac) {
            s = simplifyFraction(frac.n, frac.d);
        } else {
            s = s.replace(/(\d),(\d)/g, '$1.$2');
        }
        s = s.replace(/^=\s*/, '').trim();
        console.log('[Forest] final answer:', JSON.stringify(s));
        return s;
    }

    async function fillFields(clean) {
        const fields = [...document.querySelectorAll('math-field')];
        for (const field of fields) {
            try { field.blur(); } catch (e) {}
            try {
                if (typeof field.setValue === 'function') {
                    field.setValue('', { suppressChangeNotifications: true });
                }
            } catch (e) {}
            try { field.value = ''; } catch (e) {}
            const inner = field.querySelector('input, textarea');
            if (inner) inner.value = '';
            field.dispatchEvent(new Event('input', { bubbles: true }));
            field.dispatchEvent(new Event('change', { bubbles: true }));
            field.focus();
            await new Promise(r => setTimeout(r, 50));
            try {
                if (typeof field.setValue === 'function') {
                    field.setValue(clean, { suppressChangeNotifications: false });
                } else if (typeof field.insert === 'function') {
                    field.insert(clean);
                } else {
                    field.value = clean;
                }
            } catch (e) { console.error(e); }
            field.dispatchEvent(new InputEvent('input', {
                bubbles: true, cancelable: true,
                inputType: 'insertText', data: clean
            }));
            field.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    function pickMultipleChoice(clean, fallbackToFirst) {
        const choices = [...document.querySelectorAll('.answer-variant-container')];
        if (!choices.length) return false;
        const norm = x => String(x).replace(/\s+/g, '').replace(/[\[\]\(\)\{\}]/g, '').replace(',', '.').toLowerCase();
        const target = norm(clean);
        let picked = false;
        for (const c of choices) {
            const t = norm(c.innerText);
            if (t === target) {
                const radio = c.querySelector('input[type="radio"]');
                if (radio) {
                    radio.checked = true;
                    radio.dispatchEvent(new Event('click', { bubbles: true }));
                    radio.dispatchEvent(new Event('change', { bubbles: true }));
                }
                c.click();
                picked = true;
                break;
            }
        }
        if (!picked && fallbackToFirst) {
            choices[0].click();
            picked = true;
        }
        return picked;
    }

    async function actionAnswerOnly() {
        const clean = getCleanAnswer();
        if (!clean) { alert('No answer found in React state'); return; }
        await fillFields(clean);
        pickMultipleChoice(clean, false);
    }

    async function actionDrawOnly() {
        await zoomOutWhiteboard();
        const clean = getCleanAnswer();
        const line = clean
            ? makeLongCalculationFor(clean)
            : makeLongCalculationFor(String(Math.floor(Math.random() * 900) + 100));
        console.log('Draw only. Line:', line);
        const canvas = findWhiteboard();
        if (canvas) simulateDrawing(canvas, line);
    }

    async function actionComplete() {
        await zoomOutWhiteboard();
        const clean = getCleanAnswer();
        if (clean) {
            const line = makeLongCalculationFor(clean);
            console.log('Whiteboard line:', line);
            const canvas = findWhiteboard();
            if (canvas) simulateDrawing(canvas, line);
            await fillFields(clean);
            pickMultipleChoice(clean, true);
        }
        setTimeout(() => {
            const trySubmit = (n) => {
                const b = document.querySelector('#SUBMIT_ANSWER_BUTTON');
                if (!b) return;
                if (!b.disabled) { b.click(); return; }
                if (n >= 3) {
                    b.disabled = false;
                    b.classList.remove(
                        '_Disabled_1vdsg_349',
                        '_ProblemAnswerButtonDisabled_1ov0s_21'
                    );
                    b.click();
                    return;
                }
                setTimeout(() => trySubmit(n + 1), 500 * n);
            };
            trySubmit(1);
        }, 700);
    }

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
        transition: all 0.15s ease;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
        cursor: move;
    `;

    const title = document.createElement('div');
    title.textContent = 'Forest';
    title.style.cssText = 'font-weight:700; font-size:15px; color:#89b4fa;';
    header.appendChild(title);

    const headerBtns = document.createElement('div');
    headerBtns.style.cssText = 'display:flex; gap:6px;';

    const minBtn = document.createElement('button');
    minBtn.textContent = '–';
    minBtn.title = 'Minimize';
    minBtn.style.cssText = `
        width: 22px; height: 22px;
        border:none; border-radius: 5px;
        background:#45475a; color:#fff;
        font-size: 14px; font-weight:700;
        line-height: 1; cursor:pointer;
        display:flex; align-items:center; justify-content:center;
        padding: 0;
    `;
    minBtn.onmouseenter = () => minBtn.style.filter = 'brightness(1.3)';
    minBtn.onmouseleave = () => minBtn.style.filter = 'none';
    headerBtns.appendChild(minBtn);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.title = 'Close';
    closeBtn.style.cssText = `
        width: 22px; height: 22px;
        border:none; border-radius: 5px;
        background:#45475a; color:#fff;
        font-size: 14px; font-weight:700;
        line-height: 1; cursor:pointer;
        display:flex; align-items:center; justify-content:center;
        padding: 0;
    `;
    closeBtn.onmouseenter = () => closeBtn.style.filter = 'brightness(1.3)';
    closeBtn.onmouseleave = () => closeBtn.style.filter = 'none';
    closeBtn.onclick = (e) => {
        e.stopPropagation();
        panel.remove();
    };
    headerBtns.appendChild(closeBtn);

    header.appendChild(headerBtns);
    panel.appendChild(header);

    const body = document.createElement('div');
    body.id = '__forest_body__';
    panel.appendChild(body);

    const info = document.createElement('div');
    info.textContent = 'Pick an action:';
    info.style.cssText = 'margin-bottom:10px; opacity:0.8;';
    body.appendChild(info);

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
        body.appendChild(b);
        return b;
    }

    makeBtn('1. Complete (draw + answer + submit)', '#89b4fa', actionComplete);
    makeBtn('2. Answer only', '#a6e3a1', actionAnswerOnly);
    makeBtn('3. Draw on whiteboard only', '#f9e2af', actionDrawOnly);

    let minimized = false;

    function setMinimized(state) {
        minimized = state;
        if (minimized) {
            body.style.display = 'none';
            panel.style.minWidth = '0';
            panel.style.padding = '8px 12px';
            title.textContent = 'Forest (click to open)';
            title.style.fontSize = '12px';
            minBtn.textContent = '+';
            minBtn.title = 'Restore';
        } else {
            body.style.display = '';
            panel.style.minWidth = '220px';
            panel.style.padding = '14px 16px';
            title.textContent = 'Forest';
            title.style.fontSize = '15px';
            minBtn.textContent = '–';
            minBtn.title = 'Minimize';
        }
    }

    minBtn.onclick = (e) => {
        e.stopPropagation();
        setMinimized(!minimized);
    };

    header.onclick = () => {
        if (minimized) setMinimized(false);
    };

    let drag = false, dx = 0, dy = 0, moved = false;
    title.style.cursor = 'move';
    header.addEventListener('mousedown', (e) => {
        if (e.target === minBtn || e.target === closeBtn) return;
        drag = true;
        moved = false;
        dx = e.clientX - panel.offsetLeft;
        dy = e.clientY - panel.offsetTop;
        e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
        if (!drag) return;
        moved = true;
        panel.style.left = (e.clientX - dx) + 'px';
        panel.style.top = (e.clientY - dy) + 'px';
        panel.style.right = 'auto';
    });
    document.addEventListener('mouseup', () => {
        if (drag && minimized && !moved) {
            setMinimized(false);
        }
        drag = false;
    });

    document.body.appendChild(panel);
    console.log('Forest panel ready');
})();
