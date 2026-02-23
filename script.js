document.addEventListener('DOMContentLoaded', () => {

    // --- PWA Registration ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js').then(reg => {
                console.log('SW registered: ', reg.scope);
            }).catch(err => {
                console.log('SW registration failed: ', err);
            });
        });
    }

    // --- DOM Elements ---
    const themeBtn = document.getElementById('theme-toggle');
    const historyBtn = document.getElementById('history-toggle');
    const historyCloseBtn = document.getElementById('history-close');
    const historySidebar = document.getElementById('history-sidebar');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const historyList = document.getElementById('history-list');

    const toast = document.getElementById('toast');
    const shareBtn = document.getElementById('share-btn');
    const clearBtn = document.getElementById('clear-btn');
    const refInput = document.getElementById('reference-val');

    // Calc 1: Change
    const changePrev = document.getElementById('change-prev');
    const changeNew = document.getElementById('change-new');
    const resChange = document.getElementById('res-change');

    // Calc 2: Of
    const ofPart = document.getElementById('of-part');
    const ofBase = document.getElementById('of-base');
    const resOf = document.getElementById('res-of');

    // Calc 3: Add/Sub
    const addSubBase = document.getElementById('addsub-base');
    const addSubPct = document.getElementById('addsub-pct');
    const addSubOp = document.getElementById('addsub-op');
    const resAddSub = document.getElementById('res-addsub');

    // Calc 4: Reverse
    const revVal = document.getElementById('rev-val');
    const revOp = document.getElementById('rev-op');
    const revPct = document.getElementById('rev-pct');
    const resRev = document.getElementById('res-rev');

    // Calc 5: Fraction
    const fracNum = document.getElementById('frac-num');
    const fracDen = document.getElementById('frac-den');
    const resFrac = document.getElementById('res-frac');

    // Global State
    let history = JSON.parse(localStorage.getItem('calcHistory')) || [];
    let historyTimeout = null;

    // --- Theme Logic ---
    const currentTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcons(currentTheme);

    themeBtn.addEventListener('click', () => {
        let theme = document.documentElement.getAttribute('data-theme');
        let newTheme = theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcons(newTheme);
    });

    function updateThemeIcons(theme) {
        const lightIcon = document.querySelector('.theme-icon-light');
        const darkIcon = document.querySelector('.theme-icon-dark');
        if (theme === 'light') {
            lightIcon.style.display = 'none';
            darkIcon.style.display = 'block';
        } else {
            lightIcon.style.display = 'block';
            darkIcon.style.display = 'none';
        }
    }

    // --- Mobile Sidebar Logic ---
    historyBtn.addEventListener('click', () => historySidebar.classList.add('open'));
    historyCloseBtn.addEventListener('click', () => historySidebar.classList.remove('open'));

    // --- History Store ---
    function renderHistory() {
        if (history.length === 0) {
            historyList.innerHTML = '<div class="empty-history">No history yet.</div>';
            return;
        }

        historyList.innerHTML = history.slice(0, 50).map(item => `
            <div class="history-item">
                <div class="hi-type">${item.type} ${item.ref ? `• ${item.ref}` : ''}</div>
                <div class="hi-val">${item.val}</div>
                <div class="hi-sub">${item.sub}</div>
            </div>
        `).join('');
    }

    function pushHistory(type, val, sub) {
        const ref = refInput.value.trim();
        const latest = history[0];

        // Prevent immediate duplicates
        if (latest && latest.type === type && latest.val === val && latest.sub === sub) return;

        // Debounce history saving a bit so it doesn't spam on every keystroke
        clearTimeout(historyTimeout);
        historyTimeout = setTimeout(() => {
            history.unshift({ type, val, sub, ref, timestamp: Date.now() });
            if (history.length > 50) history.pop();
            localStorage.setItem('calcHistory', JSON.stringify(history));
            renderHistory();
        }, 1000);
    }

    clearHistoryBtn.addEventListener('click', () => {
        if (confirm("Clear all history?")) {
            history = [];
            localStorage.setItem('calcHistory', JSON.stringify(history));
            renderHistory();
        }
    });

    // --- Formatting ---
    const fNum = num => Number.isInteger(num) ? num.toString() : num.toFixed(2);

    function updateResultUI(wrapper, valEl, subEl, valText, subText, isActive, typeClass = '') {
        valEl.textContent = valText;
        subEl.textContent = subText;
        valEl.className = 'val ' + typeClass;

        if (isActive) {
            wrapper.classList.add('active');
            shareBtn.style.display = 'flex';
        } else {
            wrapper.classList.remove('active');
        }

        return isActive; // Return whether it succeeded so caller can log history
    }

    // --- Calculators ---

    function calcChange() {
        const p = parseFloat(changePrev.value);
        const n = parseFloat(changeNew.value);
        let valT = '--', subT = '--', tc = '', act = false;

        if (!isNaN(p) && !isNaN(n)) {
            if (p === 0) {
                if (n === 0) {
                    valT = '0%'; subT = 'No change'; act = true;
                } else {
                    valT = '∞%'; subT = 'Increase from zero'; tc = 'positive'; act = true;
                }
            } else {
                const diff = n - p;
                const pc = (diff / Math.abs(p)) * 100;
                valT = (diff > 0 ? '+' : diff < 0 ? '-' : '') + fNum(Math.abs(pc)) + '%';
                subT = `${fNum(p)} to ${fNum(n)}`;
                tc = diff > 0 ? 'positive' : diff < 0 ? 'negative' : '';
                act = true;
            }
        }

        const ok = updateResultUI(resChange, resChange.querySelector('.val'), resChange.querySelector('.sub'), valT, subT, act, tc);
        if (ok) pushHistory("Change", valT, subT);
    }

    function calcOf() {
        const pt = parseFloat(ofPart.value);
        const bs = parseFloat(ofBase.value);
        let valT = '--', subT = '--', act = false;

        if (!isNaN(pt) && !isNaN(bs)) {
            if (bs === 0) {
                valT = 'Undefined'; subT = 'Div by zero';
            } else {
                const pc = (pt / bs) * 100;
                valT = fNum(pc) + '%';
                subT = `${fNum(pt)} is ${valT} of ${fNum(bs)}`;
                act = true;
            }
        }

        const ok = updateResultUI(resOf, resOf.querySelector('.val'), resOf.querySelector('.sub'), valT, subT, act);
        if (ok) pushHistory("Percent Of", valT, subT);
    }

    function calcAddSub() {
        const bs = parseFloat(addSubBase.value);
        const pt = parseFloat(addSubPct.value);
        const op = addSubOp.value;
        let valT = '--', subT = '--', act = false, tc = '';

        if (!isNaN(bs) && !isNaN(pt)) {
            const amt = bs * (pt / 100);
            const res = op === 'add' ? bs + amt : bs - amt;
            const sign = op === 'add' ? '+' : '-';

            valT = fNum(res);
            subT = `${fNum(bs)} ${sign} ${fNum(pt)}% (${fNum(amt)})`;
            tc = op === 'add' ? 'positive' : 'negative';
            act = true;
        }

        const ok = updateResultUI(resAddSub, resAddSub.querySelector('.val'), resAddSub.querySelector('.sub'), valT, subT, act, tc);
        if (ok) pushHistory("Add/Sub", valT, subT);
    }

    function calcRev() {
        const final = parseFloat(revVal.value);
        let pc = parseFloat(revPct.value);
        const op = revOp.value;
        let valT = '--', subT = '--', act = false;

        if (!isNaN(final) && !isNaN(pc)) {
            let divisor = op === 'inc' ? (1 + (pc / 100)) : (1 - (pc / 100));
            if (divisor !== 0) {
                const orig = final / divisor;
                valT = fNum(orig);
                let dir = op === 'inc' ? 'increase' : 'decrease';
                subT = `Original value before ${fNum(pc)}% ${dir}`;
                act = true;
            }
        }

        const ok = updateResultUI(resRev, resRev.querySelector('.val'), resRev.querySelector('.sub'), valT, subT, act);
        if (ok) pushHistory("Reverse %", valT, subT);
    }

    function calcFrac() {
        const num = parseFloat(fracNum.value);
        const den = parseFloat(fracDen.value);
        let valT = '--', subT = '--', act = false;

        if (!isNaN(num) && !isNaN(den)) {
            if (den === 0) {
                valT = 'Undefined'; subT = 'Div by zero';
            } else {
                const pc = (num / den) * 100;
                valT = fNum(pc) + '%';
                subT = `${fNum(num)} / ${fNum(den)}`;
                act = true;
            }
        }

        const ok = updateResultUI(resFrac, resFrac.querySelector('.val'), resFrac.querySelector('.sub'), valT, subT, act);
        if (ok) pushHistory("Fraction", valT, subT);
    }

    // --- Listeners ---
    [changePrev, changeNew].forEach(i => i.addEventListener('input', calcChange));
    [ofPart, ofBase].forEach(i => i.addEventListener('input', calcOf));
    [addSubBase, addSubPct, addSubOp].forEach(i => i.addEventListener('input', calcAddSub));
    [revVal, revPct, revOp].forEach(i => i.addEventListener('input', calcRev));
    [fracNum, fracDen].forEach(i => i.addEventListener('input', calcFrac));

    // Clear functionality
    clearBtn.addEventListener('click', () => {
        document.querySelectorAll('.calculator-container input').forEach(inp => inp.value = '');
        shareBtn.style.display = 'none';
        calcChange();
        calcOf();
        calcAddSub();
        calcRev();
        calcFrac();
    });

    // Preset functionality
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.target.getAttribute('data-target');
            const val = e.target.getAttribute('data-val');
            const targetInput = document.getElementById(targetId);

            targetInput.value = val;

            // Dispatch input event to trigger calculation
            targetInput.dispatchEvent(new Event('input'));
        });
    });

    // Copy Toasts
    function showToast() {
        toast.className = 'toast show';
        setTimeout(() => toast.className = 'toast', 2000);
    }

    // Individual Copy Buttons
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetKey = e.target.getAttribute('data-target');
            const wrapper = document.getElementById(`res-${targetKey}`);
            if (wrapper && wrapper.classList.contains('active')) {
                const val = wrapper.querySelector('.val').textContent;
                navigator.clipboard.writeText(val).then(showToast);
            }
        });
    });

    // Share All
    shareBtn.addEventListener('click', () => {
        const ref = refInput.value ? `Reference: ${refInput.value}\n\n` : '';
        let shareText = ref + 'Percentage Results:\n';

        const activeRows = document.querySelectorAll('.calc-result.active');
        activeRows.forEach(row => {
            const title = row.parentElement.querySelector('h3').textContent.replace(/^\d+\.\s*/, '');
            const val = row.querySelector('.val').textContent;
            const sub = row.querySelector('.sub').textContent;
            shareText += `\n- ${title}: ${val} (${sub})`;
        });

        if (navigator.share) {
            navigator.share({ title: 'Percentage Calculations', text: shareText }).catch(console.error);
        } else {
            navigator.clipboard.writeText(shareText).then(() => alert('Copied results to clipboard!')).catch(console.error);
        }
    });

    // Initial Render
    renderHistory();
});
