"""Regenerate public/whel-methods-v0.1.pdf from docs/methods-draft.md.

methods-print.html is a styled HTML template that uses JavaScript at
runtime to fetch methods-draft.md and inject the rendered markdown into
<article id="content">. WeasyPrint does not execute JavaScript, so this
script does the markdown-to-HTML rendering server-side, injects the
rendered HTML into the template, and runs WeasyPrint on the resulting
static page.

This mirrors what Chrome's print-to-PDF does when the HTML is opened
manually, but lets the regeneration run from the sandbox without a
browser. Run as:

    python3 scripts/build-methods-pdf.py

Writes to public/whel-methods-v0.1.pdf.
"""

from pathlib import Path
import re

import markdown
from weasyprint import HTML

REPO = Path(__file__).resolve().parent.parent
MD_PATH = REPO / "docs" / "methods-draft.md"
TEMPLATE_PATH = REPO / "docs" / "methods-print.html"
OUTPUT_PATH = REPO / "public" / "whel-methods-v0.1.pdf"


def render_markdown_to_html(md_text: str) -> str:
    """Render the methods markdown to HTML with the extensions the
    document depends on (tables for the five-dimension rubric, smarty
    for typographic quotes, sane_lists for bullet behavior)."""
    md = markdown.Markdown(
        extensions=[
            "tables",
            "fenced_code",
            "attr_list",
            "smarty",
            "sane_lists",
        ]
    )
    return md.convert(md_text)


def inject_content(template_html: str, content_html: str) -> str:
    """Replace the loading placeholder inside <article id="content">
    with the rendered markdown HTML.

    The template has:
        <article id="content">
          <p class="loading">Rendering methods document…</p>
        </article>

    Plus a runtime <script> block lower down that fetches the markdown
    and renders it. We replace the inner content and strip the runtime
    script (which would otherwise produce a console warning under
    WeasyPrint but does not affect output)."""
    pattern = re.compile(
        r'(<article id="content">)(.*?)(</article>)',
        re.DOTALL,
    )
    replacement = (
        '<article id="content">\n'
        + content_html
        + '\n</article>'
    )
    new_html, n = pattern.subn(replacement, template_html, count=1)
    if n != 1:
        raise SystemExit("Failed to find <article id=\"content\"> block in template")

    # Strip the runtime renderer script block — not strictly needed for
    # WeasyPrint (which ignores it) but keeps the static HTML clean.
    new_html = re.sub(
        r"<script>\s*//\s*Render the document.*?</script>",
        "<!-- runtime renderer script removed for static PDF build -->",
        new_html,
        flags=re.DOTALL,
    )
    return new_html


def main() -> None:
    md_text = MD_PATH.read_text()
    template_html = TEMPLATE_PATH.read_text()

    content_html = render_markdown_to_html(md_text)
    final_html = inject_content(template_html, content_html)

    # Resolve relative URLs against the docs/ directory so Google Fonts
    # @import calls and any relative asset references work.
    HTML(string=final_html, base_url=str(TEMPLATE_PATH.parent)).write_pdf(
        str(OUTPUT_PATH)
    )
    size_kb = OUTPUT_PATH.stat().st_size / 1024
    print(f"wrote {OUTPUT_PATH} ({size_kb:.1f} KB)")


if __name__ == "__main__":
    main()
