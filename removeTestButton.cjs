const fs = require('fs');
let content = fs.readFileSync('src/LandingPage.tsx', 'utf8');

const testButtonStr = `          <div className="flex justify-center gap-4 text-sm opacity-70 mt-4">
            <a href="/admin" className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors font-bold text-sm">Accéder au Dashboard (Test)</a>
          </div>`;

content = content.replace(testButtonStr, '');

fs.writeFileSync('src/LandingPage.tsx', content);
