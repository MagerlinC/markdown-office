// ponytail: #show rules survive conf(), #set rules don't — keep only show rules here,
// everything else goes through pandoc variables in md2pdf.sh

// Section heading styles
#show heading.where(level: 1): it => [
  #v(1.5em)
  #text(14pt, weight: "bold", it)
  #v(0.4em)
  #line(length: 100%, stroke: 0.4pt + luma(160))
  #v(0.3em)
]

#show heading.where(level: 2): it => [
  #v(1.2em)
  #text(12pt, weight: "semibold", it)
  #v(0.3em)
]

// Compact nested lists for contract clauses
#set enum(indent: 1.5em, body-indent: 0.5em, full: true)
#set list(indent: 1.5em, body-indent: 0.5em)

// Prefix enum items with section number and use full hierarchical numbering
#set enum(numbering: (..nums) => {
  let nums = nums.pos()
  context {
    let section = counter(heading).get().first()
    let full = (str(section),) + nums.map(str)
    full.join(".") + "."
  }
})

// Signature block table
#set table(
  stroke: 0.5pt + luma(160),
  inset: 8pt,
)
