// Central frontpage template for PineGrove documents.
//
// This file is NOT used directly — md2pdf.sh reads it and substitutes
// %%PLACEHOLDER%% tokens with values from config.json and the document's
// YAML front matter before passing it to pandoc via --include-before-body.
//
// Available placeholders:
//   %%COMPANY_PREFIX%%        e.g. "Pine"
//   %%COMPANY_HIGHLIGHT%%     e.g. "Grove AI"
//   %%BRAND_COLOR%%           e.g. "#257E34"
//   %%CONFIDENTIALITY%%       e.g. "Confidential"
//   %%LOGO_PATH%%             absolute path to logo file
//   %%TITLE%%                 document title
//   %%SUBTITLE%%              document subtitle (may be empty)

#align(center)[
  #v(2fr)
  #box(height: 48pt, image("%%LOGO_PATH%%"))
  #v(4pt)
  #text(20pt, weight: "bold", tracking: 1pt)[
    %%COMPANY_PREFIX%%#text(fill: rgb("%%BRAND_COLOR%%"))[%%COMPANY_HIGHLIGHT%%]
  ]
  #v(6pt)
  #line(length: 40%, stroke: 0.5pt + luma(180))
  #v(24pt)
  #text(18pt, weight: "bold")[%%TITLE%%]
  #v(12pt)
  #text(12pt, fill: luma(80))[%%SUBTITLE%%]
  #v(2fr)
  #text(10pt, fill: luma(120))[%%COMPANY_PREFIX%%%%COMPANY_HIGHLIGHT%% · %%CONFIDENTIALITY%%]
]
#pagebreak()
