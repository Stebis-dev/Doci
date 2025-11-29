import pkg from "../package.json";

export const CLI_VERSION = pkg.version;

export const CLI_TOOL_NAME = 'doci-cli-tool';
export const CLI_TOOL_DESCRIPTION = 'Doci Command Line Interface Tool';

/** Minimal mime lookup for common extensions */
export const MIME_MAP: Record<string, string> = {
    js: "application/javascript",
    mjs: "application/javascript",
    cjs: "application/javascript",
    ts: "text/x.typescript",
    jsx: "text/jsx",
    tsx: "text/tsx",
    json: "application/json",
    html: "text/html",
    htm: "text/html",
    css: "text/css",
    scss: "text/x-scss",
    md: "text/markdown",
    markdown: "text/markdown",
    txt: "text/plain",
    csv: "text/csv",
    xml: "application/xml",
    yml: "application/x-yaml",
    yaml: "application/x-yaml",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    pdf: "application/pdf",
    zip: "application/zip",
    gz: "application/gzip",
    wasm: "application/wasm",
    go: "text/x-go",
    py: "text/x-python",
    java: "text/x-java-source",
    rs: "text/x-rust",
    sh: "application/x-sh",
};

/** Small language map by extension */
export const LANGUAGE_MAP: Record<string, string> = {
    js: "JavaScript",
    mjs: "JavaScript",
    cjs: "JavaScript",
    ts: "TypeScript",
    tsx: "TypeScript",
    jsx: "JavaScript",
    py: "Python",
    go: "Go",
    java: "Java",
    rs: "Rust",
    rb: "Ruby",
    php: "PHP",
    cs: "C#",
    cpp: "C++",
    c: "C",
    swift: "Swift",
    kt: "Kotlin",
    sh: "Shell",
    zsh: "Shell",
    ps1: "PowerShell",
    md: "Markdown",
    json: "JSON",
    yml: "YAML",
    yaml: "YAML",
    html: "HTML",
    css: "CSS",
};