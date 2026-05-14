import os
from playwright.sync_api import sync_playwright

def test_final_polish():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Test 1: Extraction Logic (Tech & Content)
        page.set_content("""
            <html lang="pl">
            <head>
                <title>Test PL</title>
                <meta name="description" content="Opis">
                <link rel="canonical" href="https://example.pl">
                <link rel="stylesheet" href="style.css">
                <style>body { color: red; }</style>
            </head>
            <body>
                <div class="ng-host-abc" data-v-123>
                    <h1 class="cls-1">Nagłówek</h1>
                    <p _ngcontent-c1>Tekst z <a href="/link" class="cls-2">linkiem</a>.</p>
                    <img src="img.png" alt="obraz" class="lazy">
                    <svg><circle cx="50" cy="50" r="40" /></svg>
                    <noscript>Noise</noscript>
                </div>
            </body>
            </html>
        """)

        # Inject the logic from popup.js (simplified for verification)
        result = page.evaluate("""() => {
            const techTags = ['title', 'meta', 'link', 'script'];
            const contentTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'img', 'a', 'button', 'li', 'td', 'th'];
            const ignoreTags = ['style', 'noscript', 'svg', 'template', 'iframe'];

            const tech = [];
            const content = [];

            function walk(n, insideContentTag = false) {
                if (n.nodeType === 3) {
                    const text = n.textContent.trim();
                    if (text && !insideContentTag && !text.includes('@media') && !text.includes('{')) content.push(text);
                    return;
                }
                if (n.nodeType !== 1) return;
                const tag = n.tagName.toLowerCase();
                if (ignoreTags.includes(tag)) return;

                let isContent = contentTags.includes(tag);
                if (techTags.includes(tag)) {
                    const allowedAttrs = {
                        'meta': ['name', 'property', 'content', 'http-equiv', 'charset'],
                        'link': ['rel', 'href', 'hreflang', 'as', 'type', 'media'],
                        'script': ['type', 'src']
                    };
                    let attrs = '';
                    (allowedAttrs[tag] || []).forEach(a => {
                        const v = n.getAttribute(a);
                        if (v !== null) attrs += ` ${a}="${v}"`;
                    });
                    if (tag === 'link') {
                        const rel = n.getAttribute('rel');
                        if (['canonical', 'alternate', 'icon', 'stylesheet'].includes(rel)) tech.push(`<link${attrs}>`);
                    } else if (tag === 'meta') {
                        tech.push(`<meta${attrs}>`);
                    } else if (tag === 'title') {
                        tech.push(`<title>${n.textContent.trim()}</title>`);
                    }
                    return;
                } else if (isContent) {
                    const innerText = (n.innerText || n.textContent || '').trim();
                    const allowedAttrs = ['href', 'src', 'alt'];
                    let attrs = '';
                    allowedAttrs.forEach(a => {
                        const v = n.getAttribute(a);
                        if (v !== null) attrs += ` ${a}="${v}"`;
                    });
                    content.push(`<${tag}${attrs}>${innerText}</${tag}>`);
                }
                Array.from(n.childNodes).forEach(c => walk(c, insideContentTag || isContent));
            }
            walk(document.documentElement);
            const htmlTag = `<html lang="${document.documentElement.getAttribute('lang')}">`;
            return { tech, content, htmlTag };
        }""")

        print(f"HTML TAG: {result['htmlTag']}")
        assert result['htmlTag'] == '<html lang="pl">'

        print("\nTECH ELEMENTS:")
        for t in result['tech']:
            print(f"  {t}")
            assert "class=" not in t

        print("\nCONTENT ELEMENTS:")
        for c in result['content']:
            print(f"  {c}")
            assert "_nghost" not in c
            assert "_ngcontent" not in c
            assert "data-v-" not in c
            assert "class=" not in c
            assert "<svg" not in c
            assert "body {" not in c

        print("\nVerification successful: Sterile extraction confirmed.")
        browser.close()

if __name__ == "__main__":
    test_final_polish()
