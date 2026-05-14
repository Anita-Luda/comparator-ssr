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
            subtitle: "Analyze and compare SSR vs CSR rendering",
            compareBtn: "Run Analysis",
            copyDevtools: "Copy DOM",
            copySource: "Copy Source",
            loading: "Analyzing document structure... (3-5s)",
            comparisonTitle: "SEO Comparison (Semantic)",
            legendMismatch: "Difference",
            legendMatch: "Match",
            titleFullCode: "Source Code Inspector",
            summaryDevtools: "Rendered DOM (CSR)",
            summarySource: "Server HTML (SSR)",
            copied: "Copied!",
            error: "Analysis failed. Please refresh the page and try again.",
            headerSource: "SSR (Server)",
            headerDevTools: "CSR (Browser)",
            titleChecklist: "Technical SEO Audit",
            btnMissing: "Audit Tags",
            techView: "Technical",
            contentView: "Content",
            element: "Audit Point",
            status: "Status",
            checkTitle: "Page Title",
            checkDesc: "Meta Description",
            checkCanon: "Canonical URL",
            checkJsonLd: "JSON-LD Schema",
            checkOgTitle: "OpenGraph Title",
            checkOgDesc: "OpenGraph Desc",
            checkH1: "H1 Header",
            checkH2: "H2 Header",
            checkRobots: "Robots Meta",
            checkTwitter: "Twitter Card",
            checkLang: "HTML Lang",
            checkFavicon: "Favicon",
            checkOgImage: "OG:Image",
            checkTwitterImage: "Twitter:Image",
            checkViewport: "Viewport",
            checkCharset: "Charset",
            checkH3: "H3 Header",
            checkHreflang: "Hreflang",
            h1Count: "H1 Tags Count",
            titleLen: "Title Length",
            descLen: "Description Length",
            imgMissingAlt: "Images missing ALT",
            labelLang: "Language",
            labelAnalysis: "Analysis",
            labelView: "View Filter",
            labelTools: "Tools",
            on: "ON",
            off: "OFF"
        },
        pl: {
            subtitle: "Analiza i porównanie renderowania SSR vs CSR",
            compareBtn: "Uruchom analizę",
            copyDevtools: "Kopiuj DOM",
            copySource: "Kopiuj Source",
            loading: "Analizowanie struktury dokumentu... (3-5s)",
            comparisonTitle: "Porównanie SEO (Semantyka)",
            legendMismatch: "Różnica",
            legendMatch: "Zgodność",
            titleFullCode: "Inspektor kodu źródłowego",
            summaryDevtools: "Wyrenderowany DOM (CSR)",
            summarySource: "Kod HTML serwera (SSR)",
            copied: "Skopiowano!",
            error: "Analiza nieudana. Odśwież stronę i spróbuj ponownie.",
            headerSource: "SSR (Serwer)",
            headerDevTools: "CSR (Przeglądarka)",
            titleChecklist: "Audyt techniczny SEO",
            btnMissing: "Audyt tagów",
            techView: "Techniczne",
            contentView: "Treść",
            element: "Punkt audytu",
            status: "Status",
            checkTitle: "Tytuł strony (Title)",
            checkDesc: "Opis meta (Description)",
            checkCanon: "Link kanoniczny",
            checkJsonLd: "Schemat JSON-LD",
            checkOgTitle: "Tytuł OpenGraph",
            checkOgDesc: "Opis OpenGraph",
            checkH1: "Nagłówek H1",
            checkH2: "Nagłówek H2",
            checkRobots: "Meta Robots",
            checkTwitter: "Twitter Card",
            checkLang: "Język HTML (Lang)",
            checkFavicon: "Fawikona",
            checkOgImage: "OG:Image",
            checkTwitterImage: "Twitter:Image",
            checkViewport: "Viewport",
            checkCharset: "Charset",
            checkH3: "Nagłówek H3",
            checkHreflang: "Tagi Hreflang",
            h1Count: "Liczba tagów H1",
            titleLen: "Długość tytułu",
            descLen: "Długość opisu",
            imgMissingAlt: "Obrazy bez atrybutu ALT",
            labelLang: "Język",
            labelAnalysis: "Analiza",
            labelView: "Filtr widoku",
            labelTools: "Narzędzia",
            on: "WŁ",
            off: "WYŁ"
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
        document.getElementById('audit-on').textContent = translations[lang].on;
        document.getElementById('audit-off').textContent = translations[lang].off;
        viewTechBtn.textContent = translations[lang].techView;
        viewContentBtn.textContent = translations[lang].contentView;

        document.getElementById('label-lang').textContent = translations[lang].labelLang;
        document.getElementById('label-analysis').textContent = translations[lang].labelAnalysis;
        document.getElementById('label-view').textContent = translations[lang].labelView;
        document.getElementById('label-tools').textContent = translations[lang].labelTools;

        if (missingResult.style.display === 'block') generateChecklist();
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

    function toggleAudit(state) {
        if (!lastResult) return;
        const btnOn = document.getElementById('audit-on');
        const btnOff = document.getElementById('audit-off');

        if (state === 'on') {
            btnOn.classList.add('active');
            btnOff.classList.remove('active');
            missingResult.style.display = 'block';
            generateChecklist();
        } else {
            btnOff.classList.add('active');
            btnOn.classList.remove('active');
            missingResult.style.display = 'none';
        }
    }

    document.getElementById('audit-on').addEventListener('click', () => toggleAudit('on'));
    document.getElementById('audit-off').addEventListener('click', () => toggleAudit('off'));

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
        const t = translations[currentLang];

        const checks = [
            { name: t.checkTitle, pattern: /<title/i },
            { name: t.checkDesc, pattern: /<meta[^>]*name="description"/i },
            { name: t.checkCanon, pattern: /<link[^>]*rel="canonical"/i },
            { name: t.checkHreflang, pattern: /<link[^>]*hreflang=/i },
            { name: t.checkJsonLd, pattern: /<script[^>]*type="application\/ld\+json"/i },
            { name: t.checkOgTitle, pattern: /<meta[^>]*property="og:title"/i },
            { name: t.checkOgDesc, pattern: /<meta[^>]*property="og:description"/i },
            { name: t.checkOgImage, pattern: /<meta[^>]*property="og:image"/i },
            { name: t.checkTwitter, pattern: /<meta[^>]*name="twitter:card"/i },
            { name: t.checkTwitterImage, pattern: /<meta[^>]*name="twitter:image"/i },
            { name: t.checkH1, pattern: /<h1/i },
            { name: t.checkH2, pattern: /<h2/i },
            { name: t.checkH3, pattern: /<h3/i },
            { name: t.checkRobots, pattern: /<meta[^>]*name="robots"/i },
            { name: t.checkLang, pattern: /<html[^>]*lang=/i },
            { name: t.checkFavicon, pattern: /<link[^>]*rel="icon"|<link[^>]*rel="shortcut icon"/i },
            { name: t.checkViewport, pattern: /<meta[^>]*name="viewport"/i },
            { name: t.checkCharset, pattern: /<meta[^>]*charset=/i }
        ];

        // Advanced Analysis
        const h1CountSource = lastResult.source.content.filter(l => l.startsWith('<h1')).length;
        const h1CountDev = lastResult.devtools.content.filter(l => l.startsWith('<h1')).length;

        const titleLine = devtoolsAll.find(l => l.startsWith('<title'));
        const titleLen = titleLine ? titleLine.replace(/<[^>]+>/g, '').length : 0;

        const descLine = devtoolsAll.find(l => l.includes('name="description"'));
        const descLen = descLine ? (descLine.match(/content="([^"]*)"/) || [0, ''])[1].length : 0;

        const missingAltSource = lastResult.source.content.filter(l => l.startsWith('<img') && !l.includes('alt=')).length;
        const missingAltDev = lastResult.devtools.content.filter(l => l.startsWith('<img') && !l.includes('alt=')).length;

        let html = `<table><tr><th>${t.element}</th><th>${t.headerSource}</th><th>${t.headerDevTools}</th></tr>`;
        checks.forEach(check => {
            const inSource = sourceAll.some(line => check.pattern.test(line));
            const inDevtools = devtoolsAll.some(line => check.pattern.test(line));
            html += `<tr>
                <td>${check.name}</td>
                <td class="${inSource ? 'status-check' : 'status-missing'}">${inSource ? '✓' : '✗'}</td>
                <td class="${inDevtools ? 'status-check' : 'status-missing'}">${inDevtools ? '✓' : '✗'}</td>
            </tr>`;
        });

        // Add Analysis Rows
        html += `<tr class="analysis-row"><td>${t.h1Count}</td><td>${h1CountSource}</td><td>${h1CountDev}</td></tr>`;
        html += `<tr class="analysis-row"><td>${t.titleLen}</td><td>-</td><td>${titleLen} ch</td></tr>`;
        html += `<tr class="analysis-row"><td>${t.descLen}</td><td>-</td><td>${descLen} ch</td></tr>`;
        html += `<tr class="analysis-row"><td>${t.imgMissingAlt}</td><td>${missingAltSource}</td><td>${missingAltDev}</td></tr>`;

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

    function getCleanHtmlTag(el) {
        const lang = el.getAttribute('lang');
        return `<html${lang ? ` lang="${lang}"` : ''}>`;
    }
    const htmlTag = getCleanHtmlTag(document.documentElement);

    function extract() {
        const tech = [];
        const content = [];
        const techTags = ['title', 'meta', 'link', 'script'];
        const contentTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'img', 'a', 'button', 'li', 'td', 'th'];
        const ignoreTags = ['style', 'noscript', 'svg', 'template', 'iframe'];

        function walk(n, insideContentTag = false) {
            if (n.nodeType === Node.TEXT_NODE) {
                const text = n.textContent.trim();
                // Basic cleanup to avoid capturing technical artifacts in text nodes
                if (text && !insideContentTag && !text.includes('@media') && !text.includes('{')) content.push(text);
                return;
            }
            if (n.nodeType !== Node.ELEMENT_NODE) return;

            const tag = n.tagName.toLowerCase();
            if (ignoreTags.includes(tag)) return;

            let isContent = contentTags.includes(tag);

            if (techTags.includes(tag)) {
                const allowedAttrs = {
                    'meta': ['name', 'property', 'content', 'http-equiv', 'charset'],
                    'link': ['rel', 'href', 'hreflang', 'as', 'type', 'media'],
                    'script': ['type', 'src'],
                    'html': ['lang']
                };

                let attrs = '';
                const attrsToCopy = allowedAttrs[tag] || [];
                attrsToCopy.forEach(attrName => {
                    const val = n.getAttribute(attrName);
                    if (val !== null) attrs += ` ${attrName}="${val}"`;
                });

                if (tag === 'link') {
                    const rel = n.getAttribute('rel');
                    const important = ['canonical', 'alternate', 'icon', 'shortcut icon'];
                    if (important.includes(rel)) tech.push(`<link${attrs}>`);
                } else if (tag === 'script') {
                    if (n.getAttribute('type') === 'application/ld+json') {
                        let jsonText = (n.innerText || n.textContent).trim();
                        try {
                            jsonText = JSON.stringify(JSON.parse(jsonText), null, 2);
                        } catch (e) {}
                        tech.push(`<script${attrs}>\n${jsonText}\n</script>`);
                    }
                } else if (tag === 'meta') {
                    const name = n.getAttribute('name') || n.getAttribute('property') || n.getAttribute('http-equiv') || n.getAttribute('charset');
                    if (name) tech.push(`<meta${attrs}>`);
                } else if (tag === 'title') {
                    tech.push(`<title>${n.textContent.trim()}</title>`);
                }
                return;
            } else if (isContent) {
                const innerText = (n.innerText || n.textContent || '').trim();
                if (innerText.includes('{') && (innerText.includes('@media') || innerText.includes('display:'))) return;

                const allowedAttrs = ['href', 'src', 'alt'];
                let attrs = '';
                allowedAttrs.forEach(attrName => {
                    const val = n.getAttribute(attrName);
                    if (val !== null) attrs += ` ${attrName}="${val}"`;
                });

                let htmlContent = `<${tag}${attrs}>${innerText}</${tag}>`;
                if (tag === 'img') htmlContent = `<img${attrs}>`;
                content.push(htmlContent);
            }

            Array.from(n.childNodes).forEach(child => walk(child, insideContentTag || isContent));
        }

        walk(document.documentElement);
        return { tech, content };
    }

    const { tech, content } = extract();
    tech.push(htmlTag);

    return {
        fullHTML: fullHTML,
        techElements: tech,
        contentElements: content
    };
}

function extractSEODataFromHTML(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    function getCleanHtmlTag(el) {
        const lang = el.getAttribute('lang');
        return `<html${lang ? ` lang="${lang}"` : ''}>`;
    }
    const htmlTag = getCleanHtmlTag(doc.documentElement);

    const tech = [];
    const content = [];
    const techTags = ['title', 'meta', 'link', 'script'];
    const contentTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'img', 'a', 'button', 'li', 'td', 'th'];
    const ignoreTags = ['style', 'noscript', 'svg', 'template', 'iframe'];

    function walk(n, insideContentTag = false) {
        if (n.nodeType === Node.TEXT_NODE) {
            const text = n.textContent.trim();
            if (text && !insideContentTag && !text.includes('@media') && !text.includes('{')) content.push(text);
            return;
        }
        if (n.nodeType !== Node.ELEMENT_NODE) return;

        const tag = n.tagName.toLowerCase();
        if (ignoreTags.includes(tag)) return;

        let isContent = contentTags.includes(tag);

        if (techTags.includes(tag)) {
        const allowedAttrs = {
            'meta': ['name', 'property', 'content', 'http-equiv', 'charset'],
            'link': ['rel', 'href', 'hreflang', 'as', 'type', 'media'],
            'script': ['type', 'src'],
            'html': ['lang']
        };

        let attrs = '';
        const attrsToCopy = allowedAttrs[tag] || [];
        attrsToCopy.forEach(attrName => {
            const val = n.getAttribute(attrName);
            if (val !== null) attrs += ` ${attrName}="${val}"`;
        });

            if (tag === 'link') {
            const rel = n.getAttribute('rel');
            const important = ['canonical', 'alternate', 'icon', 'shortcut icon'];
            if (important.includes(rel)) tech.push(`<link${attrs}>`);
            } else if (tag === 'script') {
            if (n.getAttribute('type') === 'application/ld+json') {
                let jsonText = (n.innerText || n.textContent).trim();
                try {
                    jsonText = JSON.stringify(JSON.parse(jsonText), null, 2);
                } catch (e) {}
                tech.push(`<script${attrs}>\n${jsonText}\n</script>`);
            }
            } else if (tag === 'meta') {
            const name = n.getAttribute('name') || n.getAttribute('property') || n.getAttribute('http-equiv') || n.getAttribute('charset');
            if (name) tech.push(`<meta${attrs}>`);
        } else if (tag === 'title') {
            tech.push(`<title>${n.textContent.trim()}</title>`);
            }
        return;
        } else if (isContent) {
            const innerText = (n.innerText || n.textContent || '').trim();
            if (innerText.includes('{') && (innerText.includes('@media') || innerText.includes('display:'))) return;

            const allowedAttrs = ['href', 'src', 'alt'];
            let attrs = '';
            allowedAttrs.forEach(attrName => {
                const val = n.getAttribute(attrName);
                if (val !== null) attrs += ` ${attrName}="${val}"`;
            });

            let htmlContent = `<${tag}${attrs}>${innerText}</${tag}>`;
            if (tag === 'img') htmlContent = `<img${attrs}>`;
            content.push(htmlContent);
        }

        Array.from(n.childNodes).forEach(child => walk(child, insideContentTag || isContent));
    }

    walk(doc.documentElement);
    tech.push(htmlTag);
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
