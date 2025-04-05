# Comparator SSR - Compare What Your Browser Sees With What the Server Sends

Comparator SSR is a browser extension that helps you understand how much the webpage code your browser receives differs from what the server actually sends. This is especially useful for SEO analysis and debugging websites that heavily rely on JavaScript.

## How Does It Work?

The extension retrieves and compares the SEO elements of a webpage from two different sources:

* **Browser-Generated Code (DOM):**
    * This is what your browser actually displays after processing the webpage code and executing JavaScript.
    * The extension extracts key SEO elements, such as page titles, descriptions, canonical links, language tags, JSON-LD data, and more.
* **Webpage Source Code (HTML):**
    * This is what the server sends directly to your browser.
    * The extension extracts the same SEO elements from the source code.

Then, the extension compares these two sets of elements and displays the results in an easy-to-read table.

## Key Features:

* **SEO Element Extraction:** The extension identifies and extracts important information from the webpage code that affects its search engine ranking.
* **Code Comparison:** It compares the extracted elements from both sources, highlighting differences in red.
* **Results Display:** The comparison results are presented in a table for easy analysis.
* **Code Copying:** You can copy the browser-generated code or the source code to your clipboard.

## How to Use:

1.  **Install the Extension:** Add the Comparator SSR extension to your browser.
2.  **Open a Webpage:** Go to the webpage you want to inspect.
3.  **Run the Comparison:** Click the extension icon in your browser toolbar and press the "Compare" button.
4.  **Wait for Results:** The extension needs a few seconds (approximately 5) to retrieve and process the code. After that, the results will appear on the screen.
5.  **Analyze the Results:** Check the comparison table. Differences between the code will be highlighted in red.
6.  **Copy Code:** Use the "Copy DevTools Code" and "Copy Source Code" buttons to copy the desired code.

## Why Is This Useful?

* It helps with SEO optimization by showing whether important information is correctly visible to search engines.
* It facilitates debugging JavaScript issues that may affect how the webpage is displayed.
* It allows you to understand how dynamically generated content is processed by the browser.
