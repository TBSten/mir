import { createRoute } from "honox/factory";
import { Breadcrumb } from "../../components/breadcrumb.js";
import { CodeBlock } from "../../components/code-block.js";

export default createRoute((c) => {
  return c.render(
    <div class="flex flex-col gap-8 px-8 py-8 lg:px-32">
      <Breadcrumb
        items={[
          { label: "docs", href: "/docs" },
          { label: "tutorial" },
        ]}
      />

      {/* Introduction */}
      <section class="flex flex-col gap-3">
        <h1 class="font-mono text-2xl font-bold text-sky-900">
          Tutorial: Create Your First Snippet
        </h1>
        <p class="font-body text-sm leading-relaxed text-sky-600">
          // Step-by-step guide to create, test, and install your first snippet
        </p>
      </section>

      <section class="flex flex-col gap-4 border-l-4 border-sky-300 bg-sky-50 px-4 py-3">
        <h2 class="font-mono text-lg font-bold text-sky-800">
          What is a Snippet?
        </h2>
        <p class="font-body text-sm text-sky-600">
          A <strong>snippet</strong> is a reusable piece of code, template, or directory structure that you can share and install across projects. Snippets support dynamic variable substitution using Handlebars templates, allowing you to create flexible, configurable code generation.
        </p>
        <p class="font-body text-sm text-sky-600">
          With mir, you can:
        </p>
        <ul class="flex flex-col gap-2 ml-4 font-body text-sm text-sky-600">
          <li>- Create reusable code templates with variables</li>
          <li>- Share snippets with your team or the community</li>
          <li>- Install snippets from local or remote registries</li>
          <li>- Customize snippets through interactive prompts</li>
        </ul>
      </section>

      {/* Installation */}
      <section class="flex flex-col gap-4">
        <h2 class="font-mono text-lg font-bold text-sky-800">
          Installation
        </h2>
        <p class="font-body text-sm text-sky-600">
          Install mir globally or use it with npx:
        </p>
        <CodeBlock
          fileName="terminal"
          code={`# Install globally
$ npm install -g @tbsten/mir

# Or use directly with npx
$ npx @tbsten/mir --help`}
        />
        <p class="font-body text-sm text-sky-600">
          You're now ready to create your first snippet!
        </p>
      </section>

      {/* Step 1 */}
      <section class="flex flex-col gap-4">
        <div class="flex items-center gap-2">
          <div class="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 font-mono text-xs font-bold text-white">
            1
          </div>
          <h2 class="font-mono text-lg font-bold text-sky-800">
            Initialize Your Project
          </h2>
        </div>
        <p class="font-body text-sm text-sky-600">
          Start by initializing a new mir project. This creates the necessary directory structure and sample configuration files.
        </p>
        <CodeBlock
          fileName="terminal"
          code={`$ mir init`}
        />
        <p class="font-body text-sm text-sky-600">
          This will create a <span class="font-mono bg-sky-50 px-1">.mir/</span> directory with:
        </p>
        <ul class="flex flex-col gap-2 ml-4">
          <li class="font-body text-sm text-sky-600">
            - <span class="font-mono bg-sky-50 px-1">snippets/</span> directory for your snippets
          </li>
          <li class="font-body text-sm text-sky-600">
            - <span class="font-mono bg-sky-50 px-1">mirconfig.yaml</span> with registry settings
          </li>
          <li class="font-body text-sm text-sky-600">
            - A sample <span class="font-mono bg-sky-50 px-1">hello-world</span> snippet
          </li>
          <li class="font-body text-sm text-sky-600">
            - <span class="font-mono bg-sky-50 px-1">README.md</span> with quick start guide
          </li>
        </ul>
      </section>

      {/* Step 2 */}
      <section class="flex flex-col gap-4">
        <div class="flex items-center gap-2">
          <div class="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 font-mono text-xs font-bold text-white">
            2
          </div>
          <h2 class="font-mono text-lg font-bold text-sky-800">
            Create a New Snippet
          </h2>
        </div>
        <p class="font-body text-sm text-sky-600">
          Create a new snippet template. Replace <span class="font-mono bg-sky-50 px-1">my-snippet</span> with your snippet name.
        </p>
        <CodeBlock
          fileName="terminal"
          code={`$ mir create my-snippet`}
        />
        <p class="font-body text-sm text-sky-600">
          This command creates:
        </p>
        <ul class="flex flex-col gap-2 ml-4">
          <li class="font-body text-sm text-sky-600">
            - <span class="font-mono bg-sky-50 px-1">.mir/snippets/my-snippet.yaml</span> (snippet definition)
          </li>
          <li class="font-body text-sm text-sky-600">
            - <span class="font-mono bg-sky-50 px-1">.mir/snippets/my-snippet/</span> (template directory)
          </li>
        </ul>
      </section>

      {/* Step 3 */}
      <section class="flex flex-col gap-4">
        <div class="flex items-center gap-2">
          <div class="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 font-mono text-xs font-bold text-white">
            3
          </div>
          <h2 class="font-mono text-lg font-bold text-sky-800">
            Edit the YAML Definition
          </h2>
        </div>
        <p class="font-body text-sm text-sky-600">
          Open <span class="font-mono bg-sky-50 px-1">.mir/snippets/my-snippet.yaml</span> and define your snippet metadata and variables.
        </p>
        <CodeBlock
          fileName=".mir/snippets/my-snippet.yaml"
          code={`name: my-snippet
version: "1.0.0"
description: "A description of what this snippet does"

variables:
  - name: projectName
    description: "Name of the project"
    default: "my-project"

  - name: authorName
    description: "Your name"
    default: "John Doe"

files:
  - path: "src/index.js"
  - path: "package.json"`}
        />
        <p class="font-body text-sm text-sky-600">
          Key fields:
        </p>
        <ul class="flex flex-col gap-2 ml-4">
          <li class="font-body text-sm text-sky-600">
            - <span class="font-mono bg-sky-50 px-1">name</span>: Unique identifier for your snippet
          </li>
          <li class="font-body text-sm text-sky-600">
            - <span class="font-mono bg-sky-50 px-1">variables</span>: Input fields for users
          </li>
          <li class="font-body text-sm text-sky-600">
            - <span class="font-mono bg-sky-50 px-1">files</span>: Template files to generate
          </li>
        </ul>
      </section>

      {/* Step 4 */}
      <section class="flex flex-col gap-4">
        <div class="flex items-center gap-2">
          <div class="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 font-mono text-xs font-bold text-white">
            4
          </div>
          <h2 class="font-mono text-lg font-bold text-sky-800">
            Create Template Files
          </h2>
        </div>
        <p class="font-body text-sm text-sky-600">
          Add template files to the <span class="font-mono bg-sky-50 px-1">my-snippet/</span> directory. Use Handlebars syntax to reference variables.
        </p>
        <CodeBlock
          fileName=".mir/snippets/my-snippet/src/index.js"
          code={`// Created for {{projectName}}
// Author: {{authorName}}

export function greet(name) {
  return \`Hello, \${name}! Welcome to {{projectName}}.\`;
}

// Main execution
console.log(greet('World'));`}
        />
        <CodeBlock
          fileName=".mir/snippets/my-snippet/package.json"
          code={`{
  "name": "{{projectName}}",
  "version": "1.0.0",
  "description": "Generated by mir",
  "main": "src/index.js",
  "author": "{{authorName}}",
  "license": "MIT"
}`}
        />
        <p class="font-body text-sm text-sky-600">
          Handlebars variables like <span class="font-mono bg-sky-50 px-1">{"{{projectName}}"}</span> will be replaced with user input. Learn more in the <a href="/docs/template-syntax" class="text-sky-500 hover:text-sky-700">Template Syntax</a> guide.
        </p>
      </section>

      {/* Step 5 */}
      <section class="flex flex-col gap-4">
        <div class="flex items-center gap-2">
          <div class="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 font-mono text-xs font-bold text-white">
            5
          </div>
          <h2 class="font-mono text-lg font-bold text-sky-800">
            Publish to Local Registry
          </h2>
        </div>
        <p class="font-body text-sm text-sky-600">
          Once your snippet is ready, publish it to your local registry.
        </p>
        <CodeBlock
          fileName="terminal"
          code={`$ mir publish my-snippet`}
        />
        <p class="font-body text-sm text-sky-600">
          This stores your snippet in <span class="font-mono bg-sky-50 px-1">~/.mir/registry/</span> where you (and others) can install it.
        </p>
      </section>

      {/* Step 6 */}
      <section class="flex flex-col gap-4">
        <div class="flex items-center gap-2">
          <div class="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 font-mono text-xs font-bold text-white">
            6
          </div>
          <h2 class="font-mono text-lg font-bold text-sky-800">
            Test Installation
          </h2>
        </div>
        <p class="font-body text-sm text-sky-600">
          Verify that your snippet works by installing it in a test directory.
        </p>
        <CodeBlock
          fileName="terminal"
          code={`$ cd /tmp/test-my-snippet
$ mir install my-snippet
# Follow the interactive prompts to enter variables`}
        />
        <p class="font-body text-sm text-sky-600">
          After installation, verify that:
        </p>
        <ul class="flex flex-col gap-2 ml-4">
          <li class="font-body text-sm text-sky-600">
            - All files are generated correctly
          </li>
          <li class="font-body text-sm text-sky-600">
            - Variables are properly substituted
          </li>
          <li class="font-body text-sm text-sky-600">
            - The generated code matches your expectations
          </li>
        </ul>
      </section>

      {/* Next Steps */}
      <section class="flex flex-col gap-4">
        <h2 class="font-mono text-lg font-bold text-sky-800">
          Next Steps
        </h2>
        <p class="font-body text-sm text-sky-600">
          Congratulations! You've successfully created your first snippet. Here are some next steps:
        </p>
        <ul class="flex flex-col gap-2 ml-4">
          <li class="font-body text-sm text-sky-600">
            - Share your snippet with others through a custom registry
          </li>
          <li class="font-body text-sm text-sky-600">
            - Learn advanced features in the <a href="/docs/variables" class="text-sky-500 hover:text-sky-700">Variables</a> guide
          </li>
          <li class="font-body text-sm text-sky-600">
            - Explore <a href="/docs/template-syntax" class="text-sky-500 hover:text-sky-700">Template Syntax</a> for more Handlebars features
          </li>
          <li class="font-body text-sm text-sky-600">
            - Submit your snippet to the <a href="/docs/submission-guide" class="text-sky-500 hover:text-sky-700">official registry</a>
          </li>
        </ul>
      </section>

      {/* FAQ */}
      <section class="flex flex-col gap-6">
        <h2 class="font-mono text-lg font-bold text-sky-800">
          Frequently Asked Questions
        </h2>

        <div class="flex flex-col gap-3">
          <h3 class="font-mono text-sm font-bold text-sky-700">
            Q: What's the difference between snippets and regular files?
          </h3>
          <p class="font-body text-sm text-sky-600">
            Snippets are <strong>parameterized templates</strong> that generate customized output based on user input. While you could copy files manually, snippets automate this process with variable substitution, making them perfect for boilerplate code and repeated patterns.
          </p>
        </div>

        <div class="flex flex-col gap-3">
          <h3 class="font-mono text-sm font-bold text-sky-700">
            Q: Can I use snippets in an existing project?
          </h3>
          <p class="font-body text-sm text-sky-600">
            Yes! You can install snippets anywhere. mir will generate files in your current directory. Just navigate to the location where you want to install the snippet and run the install command.
          </p>
        </div>

        <div class="flex flex-col gap-3">
          <h3 class="font-mono text-sm font-bold text-sky-700">
            Q: How do I create custom snippets for my team?
          </h3>
          <p class="font-body text-sm text-sky-600">
            Use <span class="font-mono bg-sky-50 px-1">mir create &lt;name&gt;</span> to create a snippet template. Edit the YAML definition and Handlebars template files, then publish with <span class="font-mono bg-sky-50 px-1">mir publish &lt;name&gt;</span>. You can share snippets via a custom registry URL.
          </p>
        </div>

        <div class="flex flex-col gap-3">
          <h3 class="font-mono text-sm font-bold text-sky-700">
            Q: Can I use a remote registry instead of the local one?
          </h3>
          <p class="font-body text-sm text-sky-600">
            Yes! Set your registry URL in <span class="font-mono bg-sky-50 px-1">~/.mir/mirconfig.yaml</span> or pass it directly with the <span class="font-mono bg-sky-50 px-1">--registry</span> flag. mir supports both local and remote registries.
          </p>
        </div>

        <div class="flex flex-col gap-3">
          <h3 class="font-mono text-sm font-bold text-sky-700">
            Q: How do I use Handlebars in snippet templates?
          </h3>
          <p class="font-body text-sm text-sky-600">
            Use <span class="font-mono bg-sky-50 px-1">{"{{variableName}}"}</span> syntax in your template files. Check the <a href="/docs/template-syntax" class="text-sky-500 hover:text-sky-700">Template Syntax</a> guide for advanced features like conditionals and loops.
          </p>
        </div>

        <div class="flex flex-col gap-3">
          <h3 class="font-mono text-sm font-bold text-sky-700">
            Q: What happens if I make a mistake in my snippet?
          </h3>
          <p class="font-body text-sm text-sky-600">
            You can update your snippet by editing the YAML and template files, then republishing. Use <span class="font-mono bg-sky-50 px-1">mir publish --force</span> to overwrite the existing version.
          </p>
        </div>
      </section>

      {/* Tips */}
      <section class="flex flex-col gap-4 border-l-4 border-sky-300 bg-sky-50 px-4 py-3">
        <h3 class="font-mono text-sm font-bold text-sky-800">
          Tips for Better Snippets
        </h3>
        <ul class="flex flex-col gap-2">
          <li class="font-body text-sm text-sky-600">
            - Keep variable names simple and descriptive
          </li>
          <li class="font-body text-sm text-sky-600">
            - Provide meaningful default values
          </li>
          <li class="font-body text-sm text-sky-600">
            - Include helpful comments in your templates
          </li>
          <li class="font-body text-sm text-sky-600">
            - Test your snippet with different variable values
          </li>
        </ul>
      </section>
    </div>,
    { title: "tutorial" },
  );
});
