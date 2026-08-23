const fs = require("fs");
const mammoth = require("mammoth");

mammoth.convertToHtml({ path: "C:/Users/dell/Downloads/अध्याय_1.1-_राजस्थान_में_पशुपालन_का_आर्थिक_महत्व_(अद्यतन).docx" }).then(r => {
  const html = r.value;
  const tables = html.match(/<table[\s\S]*?<\/table>/gi) || [];
  console.log("Total tables:", tables.length);
  
  // Check for inline styles on TH elements
  const thWithStyle = [];
  for (const t of tables) {
    const matches = t.match(/<th[^>]*style="[^"]*"[^>]*>/gi) || [];
    thWithStyle.push(...matches);
  }
  console.log("TH with inline style:", thWithStyle.length);
  thWithStyle.slice(0, 5).forEach(s => console.log("  ", s.substring(0, 200)));
  
  // Check for any style attributes in tables
  const allStyles = [];
  for (const t of tables) {
    const m = t.match(/style="[^"]*"/gi) || [];
    allStyles.push(...m);
  }
  console.log("\nTotal style attrs in tables:", allStyles.length);
  allStyles.slice(0, 10).forEach(s => console.log("  ", s.substring(0, 200)));

  // Check first TR for background colors
  const firstTable = tables[0];
  const trs = firstTable.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
  console.log("\nFirst table TR count:", trs.length);
  if (trs[0]) {
    const trStyle = trs[0].match(/style="[^"]*"/gi);
    console.log("First TR style:", trStyle ? trStyle.join(", ") : "none");
    console.log("First TR:", trs[0].substring(0, 300));
  }
});
