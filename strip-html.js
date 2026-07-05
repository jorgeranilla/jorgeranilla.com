const fs = require('fs');
const path = require('path');

const projectDir = __dirname;

// Helper to recursively find files
function walkSync(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.firebase') {
        walkSync(filepath, filelist);
      }
    } else {
      if (file.endsWith('.html') || file.endsWith('.js') || file.endsWith('.xml')) {
        filelist.push(filepath);
      }
    }
  }
  return filelist;
}

const files = walkSync(projectDir);
let changedFiles = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  if (file.endsWith('.html')) {
    // Replace href="something.html" or href="something.html#hash" for internal links
    // Ignore http:// and https://
    content = content.replace(/href="(?!(?:http|https):\/\/)([^"?#]+)\.html([?#][^"]*)?"/g, 'href="$1$2"');
    content = content.replace(/(https:\/\/jorgeranilla\.com\/[^"'<>\s]+?)\.html(?=([?#][^"'<>\s]*)?["'<>\s])/g, '$1');
    
    // Replace onclick="window.location.href='photo-tags.html'"
    content = content.replace(/window\.location\.href='([^'?#]+)\.html([?#][^']*)?'/g, "window.location.href='$1$2'");
  } else if (file.endsWith('.js')) {
    if (file.endsWith('script.js') && !file.includes('shop')) {
      // Main script.js
      // 1. buildSectionLink('dir', 'file.html') -> buildSectionLink('dir', 'file')
      content = content.replace(/buildSectionLink\('([^']*)',\s*'([^']+)\.html'\)/g, "buildSectionLink('$1', '$2')");
      
      // 2. PAGE_HIERARCHY keys: 'file.html': -> 'file':
      content = content.replace(/(["'])([^"']+)\.html\1(?=:\s*\[)/g, (match, quote, key) => `${quote}${key}${quote}`);
      
      // 3. Breadcrumb logic fix
      content = content.replace(/const path = window\.location\.pathname\.split\("\/"\)\.pop\(\) \|\| "index\.html";/g, 'const path = window.location.pathname.split("/").pop();');
      content = content.replace(/const file = decodeURIComponent\(path\)\.toLowerCase\(\);/g, 'const file = (path ? decodeURIComponent(path).toLowerCase() : "index").replace(/\\.html$/, "");');
      content = content.replace(/const hierarchyKey = normalizedPath\.includes\("\/gallery\/people\/"\) && file === "person\.html" \? "people-person\.html" : file;/g, 'const hierarchyKey = normalizedPath.includes("/gallery/people/") && file === "person" ? "people-person" : file;');
      content = content.replace(/const hierarchyKey = normalizedPath\.includes\("\/gallery\/people\/"\) && file === "person" \? "people-person" : file;/g, 'const hierarchyKey = normalizedPath.includes("/gallery/people/") && file === "person" ? "people-person" : file;'); // in case it was already partial
      
      // 4. Any other stray "index.html" defaults or similar in JS
      content = content.replace(/\|\| "index\.html"/g, '|| "index"');
    } else if (file.endsWith('shop\\script.js') || file.endsWith('shop/script.js')) {
      // shop/script.js template literals
      content = content.replace(/href="([^"?#]+)\.html([?#][^"]*)?"/g, 'href="$1$2"');
    } else if (file.endsWith('search-dynamic.js')) {
      content = content.replace(/\.html\?id=/g, '?id=');
      content = content.replace(/href="([^"#]+)\.html"/g, 'href="$1"');
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    changedFiles++;
    console.log(`Updated: ${path.relative(projectDir, file)}`);
  }
}

console.log(`\nFinished! Updated ${changedFiles} files.`);
