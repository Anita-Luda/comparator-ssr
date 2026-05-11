document.addEventListener('DOMContentLoaded', function () {
    const extractBtn = document.getElementById('extract');
    const copyDevtoolsBtn = document.getElementById('copyDevtools');
    const copySourceBtn = document.getElementById('copySource');
    const loadingDiv = document.getElementById('loading');
    const resultDiv = document.getElementById('comparisonResult');

    extractBtn.addEventListener('click', async () => {
        // Reset UI
        resultDiv.style.display = 'none';
        loadingDiv.style.display = 'block';
        extractBtn.disabled = true;

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            // Wait for potential dynamic content (SEO tools often do this)
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Get the HTML from DevTools
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: extractSEOElements,
            });

            const devtoolsHTML = results[0].result;
            document.getElementById('devtoolsCode').textContent = devtoolsHTML;

            // Get the source code
            const response = await fetch(tab.url);
            const sourceCode = await response.text();
            const seoElementsFromSource = extractSEOElementsFromHTML(sourceCode);
            document.getElementById('sourceCode').textContent = seoElementsFromSource;

            // Compare and display
            compareSEOElements(devtoolsHTML, seoElementsFromSource);

            // Show results
            loadingDiv.style.display = 'none';
            resultDiv.style.display = 'block';
            copyDevtoolsBtn.disabled = false;
            copySourceBtn.disabled = false;
        } catch (error) {
            console.error('Extraction failed:', error);
            alert('Wystąpił błąd podczas pobierania danych. Upewnij się, że jesteś na aktywnej stronie internetowej.');
            loadingDiv.style.display = 'none';
        } finally {
            extractBtn.disabled = false;
        }
    });

    copyDevtoolsBtn.addEventListener('click', () => copyToClipboard('devtoolsCode'));
    copySourceBtn.addEventListener('click', () => copyToClipboard('sourceCode'));
});

// Shared SEO extraction logic (as string to be used in both contexts)
const SEO_SELECTORS = {
    semantic: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'img', 'a', 'button']
};

function extractSEOElements() {
    const elements = [];
    const htmlTag = document.documentElement;
    if (htmlTag) {
        elements.push(`<html lang="${htmlTag.lang || ''}">`);
    }

    const headElements = [
        'title',
        'meta[name="description"]',
        'link[rel="canonical"]',
        'meta[http-equiv="content-language"]',
        'link[rel="alternate"][hreflang]',
        'script[type="application/ld+json"]',
        'meta[property^="og:"]',
        'meta[name^="twitter:"]'
    ];

    headElements.forEach(selector => {
        const found = document.querySelectorAll(selector);
        found.forEach(el => elements.push(el.outerHTML));
    });

    const semanticTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'img', 'a', 'button'];
    semanticTags.forEach(tag => {
        const nodes = document.querySelectorAll(tag);
        nodes.forEach(node => {
            if (tag === 'a') {
                // For links, we might want to see if they contain semantic elements
                const hasSemanticChildren = [...node.children].some(child => semanticTags.includes(child.tagName.toLowerCase()));
                if (hasSemanticChildren) {
                    [...node.children].forEach(child => {
                        if (semanticTags.includes(child.tagName.toLowerCase())) {
                            elements.push(`<${child.tagName.toLowerCase()}>${child.innerText || child.alt || ''}</${child.tagName.toLowerCase()}>`);
                        }
                    });
                } else {
                    elements.push(`<a>${node.innerText || ''}</a>`);
                }
            } else {
                const content = node.innerText || node.alt || node.src || '';
                elements.push(`<${tag}>${content.trim()}</${tag}>`);
            }
        });
    });

    return elements.join('\n');
}

function extractSEOElementsFromHTML(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // We can reuse a similar logic here or ideally the same function if we pass 'doc' as context
    // For simplicity in this environment, I'll adapt the same logic to use 'doc'
    const elements = [];
    const htmlTag = doc.documentElement;
    if (htmlTag) {
        elements.push(`<html lang="${htmlTag.lang || ''}">`);
    }

    const headElements = [
        'title',
        'meta[name="description"]',
        'link[rel="canonical"]',
        'meta[http-equiv="content-language"]',
        'link[rel="alternate"][hreflang]',
        'script[type="application/ld+json"]',
        'meta[property^="og:"]',
        'meta[name^="twitter:"]'
    ];

    headElements.forEach(selector => {
        const found = doc.querySelectorAll(selector);
        found.forEach(el => elements.push(el.outerHTML));
    });

    const semanticTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'img', 'a', 'button'];
    semanticTags.forEach(tag => {
        const nodes = doc.querySelectorAll(tag);
        nodes.forEach(node => {
            if (tag === 'a') {
                const hasSemanticChildren = [...node.children].some(child => semanticTags.includes(child.tagName.toLowerCase()));
                if (hasSemanticChildren) {
                    [...node.children].forEach(child => {
                        if (semanticTags.includes(child.tagName.toLowerCase())) {
                            elements.push(`<${child.tagName.toLowerCase()}>${child.innerText || child.alt || ''}</${child.tagName.toLowerCase()}>`);
                        }
                    });
                } else {
                    elements.push(`<a>${node.innerText || ''}</a>`);
                }
            } else {
                const content = node.innerText || node.alt || node.src || '';
                elements.push(`<${tag}>${content.trim()}</${tag}>`);
            }
        });
    });

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

function copyToClipboard(elementId) {
    const text = document.getElementById(elementId).textContent;
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector(`button[id^="copy${elementId.replace('Code', '')}"]`);
        const originalText = btn.textContent;
        btn.textContent = 'Skopiowano!';
        setTimeout(() => btn.textContent = originalText, 2000);
    });
}
