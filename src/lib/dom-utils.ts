/**
 * Post-processes rendered HTML to wrap images + their captions in <figure> tags,
 * and wraps tables in scrollable containers. Used by both ProtectedHtml and
 * ChapterReader to avoid duplicating DOM manipulation logic.
 */
export function postProcessContent(root: HTMLElement) {
  wrapImagesWithCaptions(root);
  wrapTables(root);
}

function wrapImagesWithCaptions(root: HTMLElement) {
  root.querySelectorAll("p > img, img").forEach((img) => {
    if (img.closest("figure")) return;

    const imgP =
      img.parentElement?.tagName === "P" ? img.parentElement : img;

    // Check if next sibling is a caption paragraph
    const nextP = imgP?.nextElementSibling;
    if (!nextP || nextP.tagName !== "P") return;

    const text = nextP.textContent?.trim() || "";
    const isCaption =
      /चित्र|figure|fig\.|diagram|map|chart/i.test(text) &&
      nextP.querySelectorAll("img").length === 0;

    if (!isCaption) return;

    // Create <figure> wrapper
    const figure = document.createElement("figure");
    figure.appendChild(imgP.cloneNode(true));

    const figcaption = document.createElement("figcaption");
    figcaption.innerHTML = nextP.innerHTML;
    figure.appendChild(figcaption);

    imgP.parentNode?.insertBefore(figure, imgP);
    imgP.remove();
    nextP.remove();
  });
}

function wrapTables(root: HTMLElement) {
  root.querySelectorAll("table").forEach((table) => {
    if (table.parentElement?.classList.contains("table-wrap")) return;
    const wrap = document.createElement("div");
    wrap.className = "table-wrap";
    table.parentNode?.insertBefore(wrap, table);
    wrap.appendChild(table);
  });
}
