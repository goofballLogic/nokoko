export function loadCSS(href) {
    const matcher = /\.js(\?|$)/;
    if (matcher.test(href)) {
        href = href.replace(matcher, ".css");
    }
    if (Array.from(document.querySelectorAll("LINK")).every(l => l.href !== "href")) {
        const link = document.createElement("LINK");
        link.setAttribute("rel", "stylesheet");
        link.href = href;
        document.head.appendChild(link);
    }
}
