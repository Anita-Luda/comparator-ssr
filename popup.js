document.addEventListener('DOMContentLoaded', function () {
    const extractBtn = document.getElementById('extract');
    const copyDevtoolsBtn = document.getElementById('copyDevtools');
    const copySourceBtn = document.getElementById('copySource');
    const loadingDiv = document.getElementById('loading');
    const resultDiv = document.getElementById('comparisonResult');
    const langEnBtn = document.getElementById('lang-en');
    const langPlBtn = document.getElementById('lang-pl');

    let currentLang = 'en';

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
            error: "An error occurred while fetching data. Make sure you are on an active webpage."
        },
        pl: {
            subtitle: "Porównaj DOM (Browser) z HTML (Server)",
            compareBtn: "Porównaj teraz",
            copyDevtools: "Kopiuj DevTools",
            copySource: "Kopiuj Source",
            loading: "Pobieranie i analizowanie danych... (może to zająć do 5s)",
            comparisonTitle: "Wynik porównania (Oczyszczone elementy SEO)",
            legendMismatch: "Różnica",
            legendMatch: "Zgodność",
            titleFullCode: "Pełne porównanie kodu",
            summaryDevtools: "Kod DevTools (DOM)",
            summarySource: "Kod Source (Server)",
            copied: "Skopiowano!",
            error: "Wystąpił błąd podczas pobierania danych. Upewnij się, że jesteś na aktywnej stronie internetowej."
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
    }

    langEnBtn.addEventListener('click', () => updateLanguage('en'));
    langPlBtn.addEventListener('click', () => updateLanguage('pl'));

    extractBtn.addEventListener('click', async () => {
        resultDiv.style.display = 'none';
        loadingDiv.style.display = 'block';
        extractBtn.disabled = true;

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            await new Promise(resolve => setTimeout(resolve, 3000));

            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: getPageData,
            });

            const { fullHTML: devtoolsHTML, seoElements: devtoolsSEO } = results[0].result;
            document.getElementById('devtoolsCode').textContent = devtoolsHTML;

            const response = await fetch(tab.url);
            const sourceFullHTML = await response.text();
            document.getElementById('sourceCode').textContent = sourceFullHTML;

            const sourceSEO = extractSEOElementsFromHTML(sourceFullHTML);

            compareSEOElements(devtoolsSEO, sourceSEO);

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

    copyDevtoolsBtn.addEventListener('click', () => copyToClipboard('devtoolsCode'));
    copySourceBtn.addEventListener('click', () => copyToClipboard('sourceCode'));

    function copyToClipboard(elementId) {
        const text = document.getElementById(elementId).textContent;
        navigator.clipboard.writeText(text).then(() => {
            const type = elementId.replace('Code', ''); // 'devtools' or 'source'
            const btnId = `copy${type.charAt(0).toUpperCase() + type.slice(1)}`; // 'copyDevtools' or 'copySource'
            const btn = document.getElementById(btnId);
            const translationKey = `copy${type.charAt(0).toUpperCase() + type.slice(1)}`;

            const originalText = translations[currentLang][translationKey];
            btn.textContent = translations[currentLang].copied;
            setTimeout(() => btn.textContent = originalText, 2000);
        });
    }
});

function getPageData() {
    const fullHTML = document.documentElement.outerHTML;

    function cleanNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.trim();
            return text ? text : null;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) {
            return null;
        }

        const tag = node.tagName.toLowerCase();
        const bypassTags = ['div', 'span', 'section', 'article', 'header', 'footer', 'main', 'aside', 'nav', 'ul', 'ol', 'li', 'details', 'summary'];
        const seoTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'img', 'a', 'button', 'title', 'meta', 'link', 'script'];

        if (bypassTags.includes(tag)) {
            const children = Array.from(node.childNodes)
                .map(cleanNode)
                .filter(n => n !== null);
            return children.length > 0 ? children.join('\n') : null;
        }

        if (!seoTags.includes(tag)) {
            return null;
        }

        // Clone node to manipulate without affecting original
        const clone = node.cloneNode(true);

        // Remove all attributes except SEO relevant ones
        const attrs = Array.from(clone.attributes);
        const allowedAttrs = ['alt', 'href', 'src', 'name', 'property', 'content', 'rel', 'hreflang', 'type', 'http-equiv', 'title'];

        attrs.forEach(attr => {
            if (!allowedAttrs.includes(attr.name)) {
                clone.removeAttribute(attr.name);
            }
        });

        // Special handling for link/script to filter further if needed
        if (tag === 'link') {
            const rel = clone.getAttribute('rel');
            if (rel !== 'canonical' && rel !== 'alternate') {
                return null;
            }
        }
        if (tag === 'script') {
            if (clone.getAttribute('type') !== 'application/ld+json') {
                return null;
            }
        }
        if (tag === 'meta') {
             const name = clone.getAttribute('name') || clone.getAttribute('property') || clone.getAttribute('http-equiv');
             if (!name) return null;
        }

        return clone.outerHTML;
    }

    const elements = [];
    const htmlTag = document.documentElement;
    if (htmlTag && htmlTag.lang) {
        elements.push(`<html lang="${htmlTag.lang}">`);
    }

    const head = document.head;
    if (head) {
        Array.from(head.childNodes).forEach(node => {
            const cleaned = cleanNode(node);
            if (cleaned) elements.push(cleaned);
        });
    }

    const body = document.body;
    if (body) {
        Array.from(body.childNodes).forEach(node => {
            const cleaned = cleanNode(node);
            if (cleaned) elements.push(cleaned);
        });
    }

    return {
        fullHTML: fullHTML,
        seoElements: elements.join('\n')
    };
}

function extractSEOElementsFromHTML(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    function cleanNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.trim();
            return text ? text : null;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) {
            return null;
        }

        const tag = node.tagName.toLowerCase();
        const bypassTags = ['div', 'span', 'section', 'article', 'header', 'footer', 'main', 'aside', 'nav', 'ul', 'ol', 'li', 'details', 'summary'];
        const seoTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'img', 'a', 'button', 'title', 'meta', 'link', 'script'];

        if (bypassTags.includes(tag)) {
            const children = Array.from(node.childNodes)
                .map(cleanNode)
                .filter(n => n !== null);
            return children.length > 0 ? children.join('\n') : null;
        }

        if (!seoTags.includes(tag)) {
            return null;
        }

        const clone = node.cloneNode(true);
        const attrs = Array.from(clone.attributes);
        const allowedAttrs = ['alt', 'href', 'src', 'name', 'property', 'content', 'rel', 'hreflang', 'type', 'http-equiv', 'title'];

        attrs.forEach(attr => {
            if (!allowedAttrs.includes(attr.name)) {
                clone.removeAttribute(attr.name);
            }
        });

        if (tag === 'link') {
            const rel = clone.getAttribute('rel');
            if (rel !== 'canonical' && rel !== 'alternate') {
                return null;
            }
        }
        if (tag === 'script') {
            if (clone.getAttribute('type') !== 'application/ld+json') {
                return null;
            }
        }
        if (tag === 'meta') {
             const name = clone.getAttribute('name') || clone.getAttribute('property') || clone.getAttribute('http-equiv');
             if (!name) return null;
        }

        return clone.outerHTML;
    }

    const elements = [];
    const htmlTag = doc.documentElement;
    if (htmlTag && htmlTag.lang) {
        elements.push(`<html lang="${htmlTag.lang}">`);
    }

    if (doc.head) {
        Array.from(doc.head.childNodes).forEach(node => {
            const cleaned = cleanNode(node);
            if (cleaned) elements.push(cleaned);
        });
    }

    if (doc.body) {
        Array.from(doc.body.childNodes).forEach(node => {
            const cleaned = cleanNode(node);
            if (cleaned) elements.push(cleaned);
        });
    }

    return elements.join('\n');
}

function compareSEOElements(code1, code2) {
    const lines1 = code1.split('\n').map(l => l.trim()).filter(l => l);
    const lines2 = code2.split('\n').map(l => l.trim()).filter(l => l);

    const set1 = new Set(lines1);
    const set2 = new Set(lines2);

    const allLines = Array.from(new Set([...lines1, ...lines2]));
    let resultHTML = '<table>';

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
