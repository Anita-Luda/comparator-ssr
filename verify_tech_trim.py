import os
from playwright.sync_api import sync_playwright

def test_tech_trim():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.set_content("""
            <head>
                <title>Trimmed</title>
                <link rel="canonical" href="https://example.com">
                <link rel="stylesheet" href="main.css">
                <link rel="preload" href="font.woff2" as="font">
                <link rel="icon" href="favicon.ico">
                <meta name="description" content="test">
            </head>
        """)

        result = page.evaluate("""() => {
            const tech = [];
            const techTags = ['title', 'meta', 'link', 'script'];

            function walk(n) {
                if (n.nodeType !== 1) return;
                const tag = n.tagName.toLowerCase();
                if (techTags.includes(tag)) {
                    const allowedAttrs = {
                        'meta': ['name', 'property', 'content'],
                        'link': ['rel', 'href']
                    };
                    let attrs = '';
                    (allowedAttrs[tag] || []).forEach(a => {
                        const v = n.getAttribute(a);
                        if (v !== null) attrs += ` ${a}="${v}"`;
                    });
                    if (tag === 'link') {
                        const rel = n.getAttribute('rel');
                        const important = ['canonical', 'alternate', 'icon', 'shortcut icon'];
                        if (important.includes(rel)) tech.push(`<link${attrs}>`);
                    } else if (tag === 'meta') {
                        tech.push(`<meta${attrs}>`);
                    } else if (tag === 'title') {
                        tech.push(`<title>${n.textContent.trim()}</title>`);
                    }
                    return;
                }
                Array.from(n.childNodes).forEach(walk);
            }
            walk(document.documentElement);
            return tech;
        }""")

        print("TECH ELEMENTS FOUND:")
        for t in result:
            print(f"  {t}")

        # Ensure junk is NOT there
        for t in result:
            assert "stylesheet" not in t
            assert "preload" not in t

        # Ensure essentials ARE there
        assert any("canonical" in t for t in result)
        assert any("favicon.ico" in t for t in result)
        assert any("Trimmed" in t for t in result)

        print("\nVerification successful: Technical elements are properly trimmed.")
        browser.close()

if __name__ == "__main__":
    test_tech_trim()
