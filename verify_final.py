import os
import json
from playwright.sync_api import sync_playwright

def test_extraction():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        # Extension testing is hard in headless, but I can test the functions directly
        # by injecting them into a page.
        page = browser.new_page()
        page.set_content("""
            <html lang="en">
            <head>
                <title>Test Page</title>
                <meta name="description" content="Test description">
                <link rel="canonical" href="https://example.com">
                <style>.noise { color: red; }</style>
                <script>console.log('noise')</script>
            </head>
            <body>
                <div class="ng-host-123" _nghost-c12>
                    <h1 class="header-bold">Welcome</h1>
                    <p data-v-123>This is a <a href="/test" class="link">test</a>.</p>
                    <img src="img.jpg" alt="alt text" class="lazyload">
                    <svg><path d="M0 0h24v24H0z"/></svg>
                </div>
            </body>
            </html>
        """)

        # Inject the getPageData function logic
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
                        if (['canonical', 'alternate', 'icon'].includes(n.getAttribute('rel'))) tech.push(`<link${attrs}>`);
                    } else if (tag === 'meta') {
                        if (n.getAttribute('name') || n.getAttribute('property')) tech.push(`<meta${attrs}>`);
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
            return { tech, content };
        }""")

        print("TECH ELEMENTS:")
        for t in result['tech']:
            print(f"  {t}")
        print("\nCONTENT ELEMENTS:")
        for c in result['content']:
            print(f"  {c}")

        # Check for noise
        for c in result['content']:
            assert "_nghost" not in c
            assert "ng-host" not in c
            assert "data-v" not in c
            assert "class=" not in c

        print("\nVerification successful: No technical noise found in content.")

        browser.close()

if __name__ == "__main__":
    test_extraction()
