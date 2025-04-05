document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('extract').addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // Wait for the page to load completely
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Get the HTML from DevTools
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: extractSEOElements,
        }, async (results) => {
            const devtoolsHTML = results[0].result;
            document.getElementById('devtoolsCode').textContent = devtoolsHTML;

            // Get the source code and extract SEO elements
            const response = await fetch(tab.url);
            const sourceCode = await response.text();
            const seoElementsFromSource = extractSEOElementsFromHTML(sourceCode);
            document.getElementById('sourceCode').textContent = seoElementsFromSource;

            // Show results
            document.getElementById('comparisonResult').style.display = 'block';

            // Compare elements
            compareSEOElements(devtoolsHTML, seoElementsFromSource);
        });
    });

    // Copy buttons
    document.getElementById('copyDevtools').addEventListener('click', () => copyToClipboard('devtoolsCode'));
    document.getElementById('copySource').addEventListener('click', () => copyToClipboard('sourceCode'));
});

// Function to extract SEO elements from DevTools HTML
function extractSEOElements() {
    const elements = [];
    const htmlTag = document.documentElement;
    if (htmlTag) {
        const lang = htmlTag.lang ? ` lang="${htmlTag.lang}"` : '';
        elements.push(`<html${lang}>`);
    }

    const title = document.querySelector('title');
    if (title) elements.push(title.outerHTML);

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) elements.push(metaDescription.outerHTML);

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) elements.push(canonical.outerHTML);

    const contentLanguage = document.querySelector('meta[http-equiv="content-language"]');
    if (contentLanguage) elements.push(contentLanguage.outerHTML);

    const hreflangTags = [...document.querySelectorAll('link[rel="alternate"][hreflang]')];
    hreflangTags.forEach(tag => elements.push(tag.outerHTML));

    const jsonLD = [...document.querySelectorAll('script[type="application/ld+json"]')];
    jsonLD.forEach(script => elements.push(script.outerHTML));

    const socialTags = [...document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]')];
    socialTags.forEach(tag => elements.push(tag.outerHTML));

    const semanticTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'a', 'button'];
    semanticTags.forEach(tag => {
        const elementsOfTag = document.querySelectorAll(tag);
        elementsOfTag.forEach(element => {
            if (tag === 'a') {
                const semanticChildren = [...element.children].filter(child => semanticTags.includes(child.tagName.toLowerCase()));
                semanticChildren.forEach(child => {
                    const content = child.innerHTML || child.alt || child.src || '';
                    elements.push(`<${child.tagName.toLowerCase()}>${content}</${child.tagName.toLowerCase()}>`);
                });
            } else {
                const content = element.innerHTML || element.alt || element.src || '';
                elements.push(`<${tag}>${content}</${tag}>`);
            }
        });
    });

    return elements.join('\n\n');
}

// Function to extract SEO elements from fetched HTML
function extractSEOElementsFromHTML(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const elements = [];

    const htmlTag = doc.documentElement;
    if (htmlTag) {
        const lang = htmlTag.lang ? ` lang="${htmlTag.lang}"` : '';
        elements.push(`<html${lang}>`);
    }

    const title = doc.querySelector('title');
    if (title) elements.push(title.outerHTML);

    const metaDescription = doc.querySelector('meta[name="description"]');
    if (metaDescription) elements.push(metaDescription.outerHTML);

    const canonical = doc.querySelector('link[rel="canonical"]');
    if (canonical) elements.push(canonical.outerHTML);

    const contentLanguage = doc.querySelector('meta[http-equiv="content-language"]');
    if (contentLanguage) elements.push(contentLanguage.outerHTML);

    const hreflangTags = [...doc.querySelectorAll('link[rel="alternate"][hreflang]')];
    hreflangTags.forEach(tag => elements.push(tag.outerHTML));

    const jsonLD = [...doc.querySelectorAll('script[type="application/ld+json"]')];
    jsonLD.forEach(script => elements.push(script.outerHTML));

    const socialTags = [...doc.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]')];
    socialTags.forEach(tag => elements.push(tag.outerHTML));

    const semanticTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'a', 'button'];
    semanticTags.forEach(tag => {
        const elementsOfTag = doc.querySelectorAll(tag);
        elementsOfTag.forEach(element => {
            if (tag === 'a') {
                const semanticChildren = [...element.children].filter(child => semanticTags.includes(child.tagName.toLowerCase()));
                semanticChildren.forEach(child => {
                    const content = child.innerHTML || child.alt || child.src || '';
                    elements.push(`<${child.tagName.toLowerCase()}>${content}</${child.tagName.toLowerCase()}>`);
                });
            } else {
                const content = element.innerHTML || element.alt || element.src || '';
                elements.push(`<${tag}>${content}</${tag}>`);
            }
        });
    });

    return elements.join('\n\n');
}

// Function to compare two versions of code
function compareSEOElements(code1, code2) {
    const lines1 = code1.split('\n').map(line => line.trim()).filter(line => line); // Split and trim lines
    const lines2 = code2.split('\n').map(line => line.trim()).filter(line => line); // Split and trim lines

    const set1 = new Set(lines1); // Create a Set for lines from the first code
    const set2 = new Set(lines2); // Create a Set for lines from the second code

    const allLines = Array.from(new Set([...lines1, ...lines2])); // Create a combined Set of all unique lines
    let resultHTML = '<table style="width: 100%; border-collapse: collapse;">';

    allLines.forEach(line => {
        const isInFirst = set1.has(line);
        const isInSecond = set2.has(line);

        resultHTML += '<tr>';
        if (!isInFirst && !isInSecond) {
            // If line is not in either set, do not display it
            resultHTML += `<td style="padding: 5px; width: 50%; white-space: pre-wrap;"></td>`;
            resultHTML += `<td style="padding: 5px; width: 50%; white-space: pre-wrap;"></td>`;
        } else {
            if (isInFirst && isInSecond) {
                // Both lines are identical, no background color
                resultHTML += `<td style="padding: 5px; width: 50%; white-space: pre-wrap;">${escapeHTML(line)}</td>`;
                resultHTML += `<td style="padding: 5px; width: 50%; white-space: pre-wrap;">${escapeHTML(line)}</td>`;
            } else {
                // Highlight differences
                if (isInFirst) {
                    resultHTML += `<td style="background-color: lightcoral; padding: 5px; width: 50%; white-space: pre-wrap;">${escapeHTML(line)}</td>`;
                } else {
                    resultHTML += `<td style="padding: 5px; width: 50%; white-space: pre-wrap;"></td>`;
                }

                if (isInSecond) {
                    resultHTML += `<td style="background-color: lightcoral; padding: 5px; width: 50%; white-space: pre-wrap;">${escapeHTML(line)}</td>`;
                } else {
                    resultHTML += `<td style="padding: 5px; width: 50%; white-space: pre-wrap;"></td>`;
                }
            }
        }
        resultHTML += '</tr>';
    });
    
    resultHTML += '</table>';
    document.getElementById('comparisonOutput').innerHTML = resultHTML;
}

// Function to escape HTML characters to prevent XSS
function escapeHTML(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Function to copy code to clipboard
function copyToClipboard(elementId) {
    const codeElement = document.getElementById(elementId);
    navigator.clipboard.writeText(codeElement.textContent)
        .then(() => alert("Kod skopiowany do schowka!"))
        .catch(err => alert("Wystąpił błąd przy kopiowaniu kodu: " + err));
}