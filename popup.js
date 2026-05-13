document.addEventListener('DOMContentLoaded', function () {
    const extractBtn = document.getElementById('extract');
    const copyDevtoolsBtn = document.getElementById('copyDevtools');
    const copySourceBtn = document.getElementById('copySource');
    const loadingDiv = document.getElementById('loading');
    const resultDiv = document.getElementById('comparisonResult');
    const langEnBtn = document.getElementById('lang-en');
    const langPlBtn = document.getElementById('lang-pl');
    const viewTechBtn = document.getElementById('view-tech');
    const viewContentBtn = document.getElementById('view-content');
    const btnMissing = document.getElementById('btn-missing');
    const missingResult = document.getElementById('missingResult');

    let currentLang = 'en';
    let currentView = 'tech'; // 'tech' or 'content'
    let lastResult = null;

    const translations = {
        en: {
            subtitle: "Compare DOM (Browser) with HTML (Server)",
            compareBtn: "Compare Now",
            copyDevtools: "Copy DevTools",
            copySource: "Copy Source",
            loading: "Fetching and analyzing data... (may take up to 5s)",
            comparisonTitle: "Comparison Result (Cleaned SEO Elements)",
            legendMismatch: "Difference",
            legendMatch: "Match",
            titleFullCode: "Full Code Comparison",
            summaryDevtools: "DevTools Code (DOM)",
            summarySource: "Source Code (Server)",
            copied: "Copied!",
            error: "An error occurred while fetching data. Make sure you are on an active webpage.",
            headerSource: "Source (Server)",
            headerDevTools: "DevTools (Browser)",
            titleChecklist: "SEO Checklist",
            btnMissing: "Check Missing",
            techView: "Technical",
            contentView: "Content",
            element: "Element",
            status: "Status"
        },
        pl: {
            subtitle: "Porównaj DOM (Przeglądarka) z HTML (Serwer)",
            compareBtn: "Porównaj teraz",
            copyDevtools: "Kopiuj DevTools",
            copySource: "Kopiuj Source",
            loading: "Pobieranie i analizowanie danych... (może to zająć do 5s)",
            comparisonTitle: "Wynik porównania (Oczyszczone elementy SEO)",
            legendMismatch: "Różnica",
            legendMatch: "Zgodność",
            titleFullCode: "Pełne porównanie kodu",
            summaryDevtools: "Kod DevTools (DOM)",
            summarySource: "Kod Source (Serwer)",
            copied: "Skopiowano!",
            error: "Wystąpił błąd podczas pobierania danych. Upewnij się, że jesteś na aktywnej stronie internetowej.",
            headerSource: "Source (Serwer)",
            headerDevTools: "DevTools (Przeglądarka)",
            titleChecklist: "Checklista SEO",
            btnMissing: "Brakujące",
            techView: "Techniczne",
            contentView: "Treść",
            element: "Element",
            status: "Status"
        }
    };

    function updateLanguage(lang) {
        currentLang = lang;
        langEnBtn.classList.toggle('active', lang === 'en');
        langPlBtn.classList.toggle('active', lang === 'pl');

        document.getElementById('subtitle').textContent = translations[lang].subtitle;
        extractBtn.textContent = translations[lang].compareBtn;
        copyDevtoolsBtn.textContent = translations[lang].copyDevtools;
        copySourceBtn.textContent = translations[lang].copySource;
        document.getElementById('loading-text').textContent = translations[lang].loading;
        document.getElementById('title-comparison').textContent = translations[lang].comparisonTitle;
        document.getElementById('legend-mismatch').textContent = translations[lang].legendMismatch;
        document.getElementById('legend-match').textContent = translations[lang].legendMatch;
        document.getElementById('title-full-code').textContent = translations[lang].titleFullCode;
        document.getElementById('summary-devtools').textContent = translations[lang].summaryDevtools;
        document.getElementById('summary-source').textContent = translations[lang].summarySource;
        document.getElementById('header-source').textContent = translations[lang].headerSource;
        document.getElementById('header-devtools').textContent = translations[lang].headerDevTools;
        document.getElementById('title-checklist').textContent = translations[lang].titleChecklist;
        btnMissing.textContent = translations[lang].btnMissing;
        viewTechBtn.textContent = translations[lang].techView;
        viewContentBtn.textContent = translations[lang].contentView;
    }

    langEnBtn.addEventListener('click', () => updateLanguage('en'));
    langPlBtn.addEventListener('click', () => updateLanguage('pl'));

    viewTechBtn.addEventListener('click', () => {
        currentView = 'tech';
        viewTechBtn.classList.add('active');
        viewContentBtn.classList.remove('active');
        if (lastResult) redisplayComparison();
    });

    viewContentBtn.addEventListener('click', () => {
        currentView = 'content';
        viewContentBtn.classList.add('active');
        viewTechBtn.classList.remove('active');
        if (lastResult) redisplayComparison();
    });

    btnMissing.addEventListener('click', () => {
        if (!lastResult) return;
        missingResult.style.display = missingResult.style.display === 'none' ? 'block' : 'none';
        if (missingResult.style.display === 'block') generateChecklist();
    });

    extractBtn.addEventListener('click', async () => {
        resultDiv.style.display = 'none';
        missingResult.style.display = 'none';
        loadingDiv.style.display = 'block';
        extractBtn.disabled = true;

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            await new Promise(resolve => setTimeout(resolve, 3000));

            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: getPageData,
            });

            const { fullHTML: devtoolsHTML, techElements: devtoolsTech, contentElements: devtoolsContent } = results[0].result;
            document.getElementById('devtoolsCode').textContent = devtoolsHTML;

            const response = await fetch(tab.url);
            const sourceFullHTML = await response.text();
            document.getElementById('sourceCode').textContent = sourceFullHTML;

            const sourceData = extractSEODataFromHTML(sourceFullHTML);

            lastResult = {
                source: sourceData,
                devtools: { tech: devtoolsTech, content: devtoolsContent }
            };

            redisplayComparison();

            loadingDiv.style.display = 'none';
            resultDiv.style.display = 'block';
            copyDevtoolsBtn.disabled = false;
            copySourceBtn.disabled = false;
        } catch (error) {
            console.error('Extraction failed:', error);
            alert(translations[currentLang].error);
            loadingDiv.style.display = 'none';
        } finally {
            extractBtn.disabled = false;
        }
    });

    function redisplayComparison() {
        const sourceSEO = currentView === 'tech' ? lastResult.source.tech : lastResult.source.content;
        const devtoolsSEO = currentView === 'tech' ? lastResult.devtools.tech : lastResult.devtools.content;
        compareSEOElements(devtoolsSEO, sourceSEO);
    }

    function generateChecklist() {
        const sourceAll = [...lastResult.source.tech, ...lastResult.source.content];
        const devtoolsAll = [...lastResult.devtools.tech, ...lastResult.devtools.content];

        const checks = [
            { name: 'Title', pattern: /<title/i },
            { name: 'Description', pattern: /<meta[^>]*name="description"/i },
            { name: 'Canonical', pattern: /<link[^>]*rel="canonical"/i },
            { name: 'JSON-LD', pattern: /<script[^>]*type="application\/ld\+json"/i },
            { name: 'OG:Title', pattern: /<meta[^>]*property="og:title"/i },
            { name: 'OG:Description', pattern: /<meta[^>]*property="og:description"/i },
            { name: 'H1 Tag', pattern: /<h1/i }
        ];

        let html = `<table><tr><th>${translations[currentLang].element}</th><th>${translations[currentLang].headerSource}</th><th>${translations[currentLang].headerDevTools}</th></tr>`;
        checks.forEach(check => {
            const inSource = sourceAll.some(line => check.pattern.test(line));
            const inDevtools = devtoolsAll.some(line => check.pattern.test(line));
            html += `<tr>
                <td>${check.name}</td>
                <td class="${inSource ? 'status-check' : 'status-missing'}">${inSource ? '✓' : '✗'}</td>
                <td class="${inDevtools ? 'status-check' : 'status-missing'}">${inDevtools ? '✓' : '✗'}</td>
            </tr>`;
        });
        html += '</table>';
        document.getElementById('checklistOutput').innerHTML = html;
    }

    copyDevtoolsBtn.addEventListener('click', () => copyToClipboard('devtoolsCode'));
    copySourceBtn.addEventListener('click', () => copyToClipboard('sourceCode'));

    function copyToClipboard(elementId) {
        const text = document.getElementById(elementId).textContent;
        navigator.clipboard.writeText(text).then(() => {
            const type = elementId.replace('Code', '');
            const btnId = `copy${type.charAt(0).toUpperCase() + type.slice(1)}`;
            const btn = document.getElementById(btnId);
            const translationKey = `copy${type.charAt(0).toUpperCase() + type.slice(1)}`;

            const originalText = translations[currentLang][translationKey];
            btn.textContent = translations[currentLang].copied;
            setTimeout(() => btn.textContent = originalText, 2000);
        });
    }

    document.getElementById('legend-mismatch').addEventListener('click', () => filterResults('mismatch'));
    document.getElementById('legend-match').addEventListener('click', () => filterResults('match'));
});

function filterResults(type) {
    const rows = document.querySelectorAll('#comparisonOutput tr');
    rows.forEach(row => {
        const isMismatch = row.querySelector('.mismatch-cell');
        if (type === 'mismatch') {
            row.style.display = isMismatch ? '' : 'none';
        } else if (type === 'match') {
            row.style.display = !isMismatch ? '' : 'none';
        }
    });
}

function getPageData() {
    const fullHTML = document.documentElement.outerHTML;

    function extract() {
        const tech = [];
        const content = [];
        const techTags = ['title', 'meta', 'link', 'script'];
        const contentTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'img', 'a', 'button', 'li', 'td', 'th'];

        function walk(n, insideContentTag = false) {
            if (n.nodeType === Node.TEXT_NODE) {
                const text = n.textContent.trim();
                if (text && !insideContentTag) content.push(text);
                return;
            }
            if (n.nodeType !== Node.ELEMENT_NODE) return;

            const tag = n.tagName.toLowerCase();
            let isContent = contentTags.includes(tag);

            if (techTags.includes(tag)) {
                const clone = n.cloneNode(true);
                if (tag === 'link') {
                    const rel = clone.getAttribute('rel');
                    if (rel === 'canonical' || rel === 'alternate') tech.push(clone.outerHTML);
                } else if (tag === 'script') {
                    if (clone.getAttribute('type') === 'application/ld+json') tech.push(clone.outerHTML);
                } else if (tag === 'meta') {
                    const name = clone.getAttribute('name') || clone.getAttribute('property') || clone.getAttribute('http-equiv');
                    if (name) tech.push(clone.outerHTML);
                } else {
                    tech.push(clone.outerHTML);
                }
            } else if (isContent) {
                const alt = n.getAttribute('alt');
                const innerText = n.innerText.trim();
                let html = `<${tag}${alt ? ` alt="${alt}"` : ''}>${innerText}</${tag}>`;
                if (tag === 'img') html = `<img alt="${alt || ''}">`;
                content.push(html);
            }

            Array.from(n.childNodes).forEach(child => walk(child, insideContentTag || isContent));
        }

        walk(document.documentElement);
        return { tech, content };
    }

    const { tech, content } = extract();

    return {
        fullHTML: fullHTML,
        techElements: tech,
        contentElements: content
    };
}

function extractSEODataFromHTML(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const tech = [];
    const content = [];
    const techTags = ['title', 'meta', 'link', 'script'];
    const contentTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'img', 'a', 'button', 'li', 'td', 'th'];

    function walk(n, insideContentTag = false) {
        if (n.nodeType === Node.TEXT_NODE) {
            const text = n.textContent.trim();
            if (text && !insideContentTag) content.push(text);
            return;
        }
        if (n.nodeType !== Node.ELEMENT_NODE) return;

        const tag = n.tagName.toLowerCase();
        let isContent = contentTags.includes(tag);

        if (techTags.includes(tag)) {
            const clone = n.cloneNode(true);
            if (tag === 'link') {
                const rel = clone.getAttribute('rel');
                if (rel === 'canonical' || rel === 'alternate') tech.push(clone.outerHTML);
            } else if (tag === 'script') {
                if (clone.getAttribute('type') === 'application/ld+json') tech.push(clone.outerHTML);
            } else if (tag === 'meta') {
                const name = clone.getAttribute('name') || clone.getAttribute('property') || clone.getAttribute('http-equiv');
                if (name) tech.push(clone.outerHTML);
            } else {
                tech.push(clone.outerHTML);
            }
        } else if (isContent) {
            const alt = n.getAttribute('alt');
            const innerText = n.innerText.trim();
            let html = `<${tag}${alt ? ` alt="${alt}"` : ''}>${innerText}</${tag}>`;
            if (tag === 'img') html = `<img alt="${alt || ''}">`;
            content.push(html);
        }

        Array.from(n.childNodes).forEach(child => walk(child, insideContentTag || isContent));
    }

    walk(doc.documentElement);
    return { tech, content };
}

function compareSEOElements(code1, code2) {
    const lines1 = code1.map(l => l.trim()).filter(l => l);
    const lines2 = code2.map(l => l.trim()).filter(l => l);

    const set1 = new Set(lines1);
    const set2 = new Set(lines2);

    const allLines = Array.from(new Set([...lines1, ...lines2]));
    let resultHTML = '<table style="width:100%">';

    allLines.forEach(line => {
        const isIn1 = set1.has(line);
        const isIn2 = set2.has(line);

        resultHTML += '<tr>';
        if (isIn1 && isIn2) {
            resultHTML += `<td class="match-cell">${escapeHTML(line)}</td>`;
            resultHTML += `<td class="match-cell">${escapeHTML(line)}</td>`;
        } else {
            resultHTML += `<td class="${isIn1 ? 'mismatch-cell' : ''}">${isIn1 ? escapeHTML(line) : ''}</td>`;
            resultHTML += `<td class="${isIn2 ? 'mismatch-cell' : ''}">${isIn2 ? escapeHTML(line) : ''}</td>`;
        }
        resultHTML += '</tr>';
    });

    resultHTML += '</table>';
    document.getElementById('comparisonOutput').innerHTML = resultHTML;
}

function escapeHTML(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
