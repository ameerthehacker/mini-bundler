import * as Babel from '@babel/standalone';
import babelTraverse from '@babel/traverse';
import * as BabelParser from '@babel/parser';
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
  },
  '/waste.js': {
    content: `console.log('')`
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

function buildDependencyGraph(files, entryPoint) {
  const queue = [entryPoint];
  const dependencyGraph = {};

  for (const filePath of queue) {
    const fileContent = files[filePath].content;
    const dependencies = [];
    const ext = path.extname(filePath);

    if (ext === '.js') {
      const transpiledCode = Babel.transform(files[filePath].content, { presets: ['env'] }).code;
      const ast = BabelParser.parse(fileContent, { sourceType: 'module' });

      babelTraverse(ast, {
        ImportDeclaration: (importDeclaration) => {
          dependencies.push(importDeclaration.node.source.value);
        }
      });

      dependencyGraph[filePath] = {
        code: transpiledCode,
        dependencies
      }
    } else if (ext === '.json') {
      const transpiledCode = `
        module.exports = ${files[filePath].content};
      `

      dependencyGraph[filePath] = {
        code: transpiledCode,
        dependencies: []
      }
    } else {
      throw new Error(`invalid file ${ext}`)
    }

    const dirname = path.dirname(filePath);

    const dependenciesInAbsolutePath = dependencies.map(relativeFilePath => path.resolve('/', dirname, relativeFilePath));

    queue.push(...dependenciesInAbsolutePath);
  }

  return dependencyGraph;
}

function run(files) {
  const depGraph = buildDependencyGraph(files, '/index.js');

  runCode(depGraph, '/index.js');
}

run(files);
