import * as Babel from '@babel/standalone';
import path from 'path';

const files = {
  '/index.js': {
    content: `
      import { hello } from './utils.js';

      hello();
    `
  },
  '/utils.js': {
    content: `
      import { name } from './data.json';

      export function hello() {
        console.log("hello world from " + name);
      }
    `
  },
  '/data.json': {
    content: `{
      "name": "ameer"
    }`
  }
}

function runCode(transpiledFiles, filePath) {
  if (!transpiledFiles[filePath]) {
    throw new Error(`module not found ${filePath}`);
  }

  const fileContent = transpiledFiles[filePath].code;
  const exports = {};
  const module = { exports };

  const require = (relativeFilePath) => { 
    const dirname = path.dirname(filePath);
    const absolutePath = path.resolve('/', dirname, relativeFilePath)
    return runCode(transpiledFiles, absolutePath);
  }

  eval(fileContent);

  return module.exports;
}

function run(files) {
  const transpiledFiles = {};

  for (const filePath in files) {
    const ext = path.extname(filePath);

    if (ext === '.js') {
      const transpiledCode = Babel.transform(files[filePath].content, { presets: ['env'] }).code;

      transpiledFiles[filePath] = {
        code: transpiledCode
      }
    } else if (ext === '.json') {
      const transpiledCode = `
        module.exports = ${files[filePath].content};
      `

      transpiledFiles[filePath] = {
        code: transpiledCode
      }
    } else {
      throw new Error(`invalid file ${ext}`)
    }
  }

  runCode(transpiledFiles, '/index.js');
}

run(files);
