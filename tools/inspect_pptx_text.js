const fs = require("fs");
const JSZip = require("jszip");

const path = process.argv[2];

function decodeXml(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"');
}

async function main() {
  const zip = await JSZip.loadAsync(fs.readFileSync(path));
  const names = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => Number(a.match(/slide(\d+)/)[1]) - Number(b.match(/slide(\d+)/)[1]));

  for (const name of names) {
    const xml = await zip.file(name).async("string");
    const texts = [...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((m) => decodeXml(m[1]));
    console.log(`\n--- SLIDE ${name.match(/slide(\d+)/)[1]} ---`);
    console.log(texts.join(" | "));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
