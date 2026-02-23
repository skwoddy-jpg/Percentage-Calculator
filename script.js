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

    // Ohms Law
    const ohmsV = document.getElementById('ohms-v');
    const ohmsR = document.getElementById('ohms-r');
    const ohmsI = document.getElementById('ohms-i');
    const ohmsW = document.getElementById('ohms-w');

    // Vape Liquid
    const vapeMode = document.getElementById('vape-mode');
    const vapeSfInputs = document.getElementById('vape-sf-inputs');
    const vapeDiyInputs = document.getElementById('vape-diy-inputs');

    // SF Inputs
    const vapeSfVol = document.getElementById('vape-sf-vol');
    const vapeSfNic = document.getElementById('vape-sf-nic');
    const vapeSfTarget = document.getElementById('vape-sf-target');

    // DIY Inputs
    const vapeVol = document.getElementById('vape-volume');
    const vapeFlavor = document.getElementById('vape-flavor');
    const vapeBaseNic = document.getElementById('vape-base-nic');
    const vapeTargetNic = document.getElementById('vape-target-nic');

    // Result Containers
    const vapeResSfContainer = document.getElementById('vape-res-sf-container');
    const vapeResDiyContainer = document.getElementById('vape-res-diy-container');

    // Temperature
    const tempC = document.getElementById('temp-c');
    const tempF = document.getElementById('temp-f');
    const tempK = document.getElementById('temp-k');

    // Distance
    const distMi = document.getElementById('dist-mi');
    const distKm = document.getElementById('dist-km');
    const distM = document.getElementById('dist-m');
    const distFt = document.getElementById('dist-ft');
    const distIn = document.getElementById('dist-in');

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

    // --- Tab Navigation ---
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabPanes = document.querySelectorAll('.tab-pane');

    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            navTabs.forEach(t => t.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.getAttribute('data-tab')).classList.add('active');
        });
    });

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

    // --- New Calculators ---
    function calcOhms(e) {
        let v = parseFloat(ohmsV.value), r = parseFloat(ohmsR.value);
        let i = parseFloat(ohmsI.value), w = parseFloat(ohmsW.value);

        const vals = [v, r, i, w].filter(x => !isNaN(x)).length;
        let act = false, valT = '--', subT = '--';

        if (vals >= 2) {
            let cv, cr, ci, cw;
            if (!isNaN(v) && !isNaN(r)) { ci = v / r; cw = v * v / r; cv = v; cr = r; }
            else if (!isNaN(v) && !isNaN(i)) { cr = v / i; cw = v * i; cv = v; ci = i; }
            else if (!isNaN(v) && !isNaN(w)) { ci = w / v; cr = v * v / w; cv = v; cw = w; }
            else if (!isNaN(r) && !isNaN(i)) { cv = i * r; cw = i * i * r; cr = r; ci = i; }
            else if (!isNaN(r) && !isNaN(w)) { cv = Math.sqrt(w * r); ci = Math.sqrt(w / r); cr = r; cw = w; }
            else if (!isNaN(i) && !isNaN(w)) { cv = w / i; cr = w / (i * i); ci = i; cw = w; }

            if (e && e.target !== ohmsV) ohmsV.value = fNum(cv);
            if (e && e.target !== ohmsR) ohmsR.value = fNum(cr);
            if (e && e.target !== ohmsI) ohmsI.value = fNum(ci);
            if (e && e.target !== ohmsW) ohmsW.value = fNum(cw);

            valT = `${fNum(cw)}W`; subT = `${fNum(cv)}V, ${fNum(ci)}A, ${fNum(cr)}Ω`; act = true;
        }

        const wrapper = document.getElementById('res-ohms');
        const ok = updateResultUI(wrapper, wrapper.querySelector('.val'), wrapper.querySelector('.sub'), valT, subT, act);
        if (ok) pushHistory("Ohm's Law", valT, subT);
    }

    function calcVape() {
        if (vapeMode.value === 'shortfill') {
            const vol = parseFloat(vapeSfVol.value);
            const nicShot = parseFloat(vapeSfNic.value);
            const targetNic = parseFloat(vapeSfTarget.value);

            if (!isNaN(vol) && !isNaN(nicShot) && !isNaN(targetNic)) {
                if (nicShot > targetNic) {
                    const nicMl = (vol * targetNic) / (nicShot - targetNic);
                    const totalMl = vol + nicMl;

                    document.getElementById('vape-res-sf-add').textContent = fNum(nicMl) + ' ml';
                    document.getElementById('vape-res-sf-total').textContent = fNum(totalMl) + ' ml';
                    pushHistory("Shortfill Vape", `${fNum(vol)}ml -> ${fNum(totalMl)}ml`, `Added ${fNum(nicMl)}ml of Nic`);
                } else if (targetNic === 0) {
                    document.getElementById('vape-res-sf-add').textContent = '0 ml';
                    document.getElementById('vape-res-sf-total').textContent = fNum(vol) + ' ml';
                } else {
                    document.getElementById('vape-res-sf-add').textContent = 'Error';
                    document.getElementById('vape-res-sf-total').textContent = '-- ml';
                }
            } else {
                document.getElementById('vape-res-sf-add').textContent = '-- ml';
                document.getElementById('vape-res-sf-total').textContent = '-- ml';
            }
        } else {
            const vol = parseFloat(vapeVol.value);
            const flavPct = parseFloat(vapeFlavor.value) || 0;
            const baseNic = parseFloat(vapeBaseNic.value) || 0;
            const targetNic = parseFloat(vapeTargetNic.value) || 0;

            if (!isNaN(vol) && targetNic <= baseNic) {
                const nicMl = baseNic > 0 ? (targetNic * vol) / baseNic : 0;
                const flavMl = (flavPct / 100) * vol;
                const baseMl = vol - nicMl - flavMl;

                if (baseMl >= 0) {
                    document.getElementById('vape-res-nic').textContent = fNum(nicMl) + ' ml';
                    document.getElementById('vape-res-flavor').textContent = fNum(flavMl) + ' ml';
                    document.getElementById('vape-res-base').textContent = fNum(baseMl) + ' ml';

                    pushHistory("DIY Vape", `${fNum(vol)}ml`, `Nic: ${fNum(nicMl)}ml, Flix: ${fNum(flavMl)}ml`);
                } else {
                    ['nic', 'flavor', 'base'].forEach(id => document.getElementById(`vape-res-${id}`).textContent = 'Error');
                }
            } else {
                ['nic', 'flavor', 'base'].forEach(id => document.getElementById(`vape-res-${id}`).textContent = '-- ml');
            }
        }
    }

    let tempTimeout, distTimeout;

    function calcTemp(e) {
        let v = parseFloat(e.target.value);
        if (isNaN(v)) {
            tempC.value = ''; tempF.value = ''; tempK.value = '';
            return;
        }

        let c, f, k;
        if (e.target === tempC) { c = v; f = c * 9 / 5 + 32; k = c + 273.15; tempF.value = fNum(f); tempK.value = fNum(k); }
        else if (e.target === tempF) { f = v; c = (f - 32) * 5 / 9; k = c + 273.15; tempC.value = fNum(c); tempK.value = fNum(k); }
        else if (e.target === tempK) { k = v; c = k - 273.15; f = c * 9 / 5 + 32; tempC.value = fNum(c); tempF.value = fNum(f); }

        clearTimeout(tempTimeout);
        tempTimeout = setTimeout(() => { pushHistory("Temperature", `${fNum(c)} °C`, `${fNum(f)} °F / ${fNum(k)} K`); }, 1500);
    }

    const distRatios = { mi: 1, km: 1.60934, m: 1609.34, ft: 5280, in: 63360 };

    function calcDist(e) {
        let v = parseFloat(e.target.value);
        if (isNaN(v)) {
            [distMi, distKm, distM, distFt, distIn].forEach(inp => inp.value = '');
            return;
        }

        const unit = e.target.id.replace('dist-', '');
        const miles = v / distRatios[unit];

        if (e.target !== distMi) distMi.value = fNum(miles * distRatios.mi);
        if (e.target !== distKm) distKm.value = fNum(miles * distRatios.km);
        if (e.target !== distM) distM.value = fNum(miles * distRatios.m);
        if (e.target !== distFt) distFt.value = fNum(miles * distRatios.ft);
        if (e.target !== distIn) distIn.value = fNum(miles * distRatios.in);

        clearTimeout(distTimeout);
        distTimeout = setTimeout(() => { pushHistory("Distance", `${fNum(miles * distRatios.km)} km`, `${fNum(miles)} mi`); }, 1500);
    }

    // --- Listeners ---
    [changePrev, changeNew].forEach(i => i.addEventListener('input', calcChange));
    [ofPart, ofBase].forEach(i => i.addEventListener('input', calcOf));
    [addSubBase, addSubPct, addSubOp].forEach(i => i.addEventListener('input', calcAddSub));
    [revVal, revPct, revOp].forEach(i => i.addEventListener('input', calcRev));
    [fracNum, fracDen].forEach(i => i.addEventListener('input', calcFrac));

    [ohmsV, ohmsR, ohmsI, ohmsW].forEach(i => i.addEventListener('input', calcOhms));
    [tempC, tempF, tempK].forEach(i => i.addEventListener('input', calcTemp));
    [distMi, distKm, distM, distFt, distIn].forEach(i => i.addEventListener('input', calcDist));

    [vapeVol, vapeFlavor, vapeBaseNic, vapeTargetNic, vapeSfVol, vapeSfNic, vapeSfTarget].forEach(i => i.addEventListener('input', calcVape));

    vapeMode.addEventListener('change', () => {
        if (vapeMode.value === 'shortfill') {
            vapeSfInputs.style.display = 'block';
            vapeResSfContainer.style.display = 'block';
            vapeDiyInputs.style.display = 'none';
            vapeResDiyContainer.style.display = 'none';
        } else {
            vapeSfInputs.style.display = 'none';
            vapeResSfContainer.style.display = 'none';
            vapeDiyInputs.style.display = 'block';
            vapeResDiyContainer.style.display = 'block';
        }
        calcVape();
    });

    // Clear functionality
    clearBtn.addEventListener('click', () => {
        document.querySelectorAll('.calculator-container input').forEach(inp => inp.value = '');
        shareBtn.style.display = 'none';

        calcChange();
        calcOf();
        calcAddSub();
        calcRev();
        calcFrac();
        calcOhms();
        calcVape();

        ['nic', 'flavor', 'base'].forEach(id => document.getElementById(`vape-res-${id}`).textContent = '-- ml');
        document.getElementById('vape-res-sf-add').textContent = '-- ml';
        document.getElementById('vape-res-sf-total').textContent = '-- ml';
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
