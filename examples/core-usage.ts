/**
 * @tbsten/mir-core の使用例
 */

import {
  expandTemplate,
  loadSnippetSchema,
  validateSnippetYaml,
  RemoteRegistry,
} from '@tbsten/mir-core';

// 例 1: Handlebars テンプレート展開
async function example1_TemplateExpansion() {
  const template = `
Hello {{name}}!
You are {{age}} years old.
Welcome to {{community}}!`;

  const variables = {
    name: 'Alice',
    age: 25,
    community: 'mir',
  };

  const result = expandTemplate(template, variables);
  console.log(result);
  // Output:
  // Hello Alice!
  // You are 25 years old.
  // Welcome to mir!
}

// 例 2: スキーマ検証
async function example2_SchemaValidation() {
  const snippetData = {
    name: 'hello-world',
    description: 'A simple hello world snippet',
    version: '1.0.0',
    variables: [
      {
        name: 'name',
        type: 'string',
        description: 'Your name',
        default: 'World',
      },
    ],
    files: {
      'hello.txt': 'Hello {{name}}!',
    },
  };

  const schema = await loadSnippetSchema();
  const isValid = validateSnippetYaml(snippetData, schema);
  console.log('Is valid:', isValid);
}

// 例 3: リモート Registry からスニペット取得
async function example3_RemoteRegistry() {
  const registry = new RemoteRegistry('https://mir.tbsten.me');

  // スニペット一覧取得
  const snippets = await registry.getSnippets();
  console.log('Available snippets:', snippets);

  // スニペット詳細取得
  const snippet = await registry.getSnippet('hello-world');
  console.log('Snippet info:', snippet);

  // スニペット定義ファイル取得
  const yaml = await registry.getSnippetYaml('hello-world');
  console.log('Snippet YAML:', yaml);
}

// 例 4: テンプレート変数の複雑な使用例
async function example4_ComplexTemplate() {
  const template = `
{{#if isAdmin}}
Admin Panel
===========
Users: {{userCount}}
{{else}}
User Dashboard
===============
{{/if}}

{{#each items}}
- {{this.name}}: {{this.value}}
{{/each}}`;

  const variables = {
    isAdmin: true,
    userCount: 42,
    items: [
      { name: 'Item 1', value: 'Value 1' },
      { name: 'Item 2', value: 'Value 2' },
    ],
  };

  const result = expandTemplate(template, variables);
  console.log(result);
}

// 実行例
async function runExamples() {
  console.log('=== Example 1: Template Expansion ===');
  await example1_TemplateExpansion();

  console.log('\n=== Example 2: Schema Validation ===');
  await example2_SchemaValidation();

  console.log('\n=== Example 3: Remote Registry ===');
  // await example3_RemoteRegistry();

  console.log('\n=== Example 4: Complex Template ===');
  await example4_ComplexTemplate();
}

// runExamples().catch(console.error);
