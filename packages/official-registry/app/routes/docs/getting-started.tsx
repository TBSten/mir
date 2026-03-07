import { createRoute } from "honox/factory";
import { Breadcrumb } from "../../components/breadcrumb.js";
import { CodeBlock } from "../../components/code-block.js";
import { INSTALL_COMMAND } from "../../lib/constants.js";

export default createRoute((c) => {
  return c.render(
    <div class="flex flex-col gap-8 px-8 py-8 lg:px-32">
      <Breadcrumb
        items={[
          { label: "docs", href: "/docs" },
          { label: "getting-started" },
        ]}
      />

      {/* Introduction */}
      <section class="flex flex-col gap-3">
        <h1 class="font-mono text-2xl font-bold text-sky-900">
          Getting Started with mir
        </h1>
        <p class="font-body text-sm leading-relaxed text-sky-600">
          // Learn how to install mir and start using code snippets
        </p>
      </section>

      {/* What is mir? */}
      <section class="flex flex-col gap-4 border-l-4 border-sky-300 bg-sky-50 px-4 py-3">
        <h2 class="font-mono text-lg font-bold text-sky-800">
          What is mir?
        </h2>
        <p class="font-body text-sm text-sky-600">
          mir is a command-line tool for sharing and installing reusable code snippets. A snippet can be anything from a single function to a complete directory structure with multiple files. Use mir to save time on repetitive code and maintain consistency across your projects.
        </p>
      </section>

      {/* Installation */}
      <section class="flex flex-col gap-4">
        <h2 class="font-mono text-lg font-bold text-sky-800">
          Installation
        </h2>

        <div class="flex flex-col gap-3">
          <h3 class="font-mono text-sm font-bold text-sky-700">
            Option 1: Using npx (Recommended)
          </h3>
          <p class="font-body text-sm text-sky-600">
            Run mir directly without installing:
          </p>
          <CodeBlock
            fileName="terminal"
            code={`${INSTALL_COMMAND} --help`}
          />
        </div>

        <div class="flex flex-col gap-3">
          <h3 class="font-mono text-sm font-bold text-sky-700">
            Option 2: Global Installation
          </h3>
          <p class="font-body text-sm text-sky-600">
            Install mir globally on your system:
          </p>
          <CodeBlock
            fileName="terminal"
            code={`npm install -g @tbsten/mir
mir --help`}
          />
        </div>
      </section>

      {/* Quick Start */}
      <section class="flex flex-col gap-4">
        <h2 class="font-mono text-lg font-bold text-sky-800">
          Quick Start
        </h2>

        <div class="flex flex-col gap-3">
          <h3 class="font-mono text-sm font-bold text-sky-700">
            Step 1: Initialize a Project
          </h3>
          <p class="font-body text-sm text-sky-600">
            Create a new mir project in your current directory:
          </p>
          <CodeBlock
            fileName="terminal"
            code={`${INSTALL_COMMAND} init`}
          />
          <p class="font-body text-sm text-sky-600">
            This creates a <span class="font-mono bg-sky-50 px-1">.mir/</span> directory with sample snippets and configuration.
          </p>
        </div>

        <div class="flex flex-col gap-3">
          <h3 class="font-mono text-sm font-bold text-sky-700">
            Step 2: View Available Snippets
          </h3>
          <p class="font-body text-sm text-sky-600">
            List snippets in your local registry:
          </p>
          <CodeBlock
            fileName="terminal"
            code={`${INSTALL_COMMAND} list`}
          />
        </div>

        <div class="flex flex-col gap-3">
          <h3 class="font-mono text-sm font-bold text-sky-700">
            Step 3: Install a Snippet
          </h3>
          <p class="font-body text-sm text-sky-600">
            Install a snippet from the official registry:
          </p>
          <CodeBlock
            fileName="terminal"
            code={`${INSTALL_COMMAND} install react-hook`}
          />
          <p class="font-body text-sm text-sky-600">
            mir will prompt you for any required variables, then generate the files.
          </p>
        </div>

        <div class="flex flex-col gap-3">
          <h3 class="font-mono text-sm font-bold text-sky-700">
            Step 4: Create Your Own Snippet
          </h3>
          <p class="font-body text-sm text-sky-600">
            Create a new snippet template:
          </p>
          <CodeBlock
            fileName="terminal"
            code={`${INSTALL_COMMAND} create my-snippet`}
          />
          <p class="font-body text-sm text-sky-600">
            Edit the generated <span class="font-mono bg-sky-50 px-1">.mir/snippets/my-snippet.yaml</span> and template files, then publish:
          </p>
          <CodeBlock
            fileName="terminal"
            code={`${INSTALL_COMMAND} publish my-snippet`}
          />
        </div>
      </section>

      {/* Core Concepts */}
      <section class="flex flex-col gap-4">
        <h2 class="font-mono text-lg font-bold text-sky-800">
          Core Concepts
        </h2>

        <div class="flex flex-col gap-3">
          <h3 class="font-mono text-sm font-bold text-sky-700">
            Snippets
          </h3>
          <p class="font-body text-sm text-sky-600">
            A snippet is a reusable collection of template files with configurable variables. When you install a snippet, mir generates files with your custom values substituted in.
          </p>
        </div>

        <div class="flex flex-col gap-3">
          <h3 class="font-mono text-sm font-bold text-sky-700">
            Registries
          </h3>
          <p class="font-body text-sm text-sky-600">
            Registries store snippets. mir supports both local registries (<span class="font-mono bg-sky-50 px-1">~/.mir/registry/</span>) and remote registries (e.g., the official registry at mir.tbsten.me).
          </p>
        </div>

        <div class="flex flex-col gap-3">
          <h3 class="font-mono text-sm font-bold text-sky-700">
            Variables
          </h3>
          <p class="font-body text-sm text-sky-600">
            Variables are placeholders in your snippet templates. When installing, mir prompts you for values and substitutes them using Handlebars syntax (e.g., <span class="font-mono bg-sky-50 px-1">{"{{variableName}}"}</span>).
          </p>
        </div>
      </section>

      {/* Common Commands */}
      <section class="flex flex-col gap-4">
        <h2 class="font-mono text-lg font-bold text-sky-800">
          Common Commands
        </h2>

        <table class="w-full border-collapse text-left">
          <thead>
            <tr class="border-b border-sky-200">
              <th class="px-3 py-2 font-mono text-sm font-bold text-sky-700">Command</th>
              <th class="px-3 py-2 font-mono text-sm font-bold text-sky-700">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-sky-100">
            <tr>
              <td class="px-3 py-2 font-mono text-sm text-sky-600">
                {`${INSTALL_COMMAND} init`}
              </td>
              <td class="px-3 py-2 font-body text-sm text-sky-600">
                Initialize a new mir project
              </td>
            </tr>
            <tr>
              <td class="px-3 py-2 font-mono text-sm text-sky-600">
                {`${INSTALL_COMMAND} list`}
              </td>
              <td class="px-3 py-2 font-body text-sm text-sky-600">
                List snippets in registry
              </td>
            </tr>
            <tr>
              <td class="px-3 py-2 font-mono text-sm text-sky-600">
                {`${INSTALL_COMMAND} info <name>`}
              </td>
              <td class="px-3 py-2 font-body text-sm text-sky-600">
                Show snippet details
              </td>
            </tr>
            <tr>
              <td class="px-3 py-2 font-mono text-sm text-sky-600">
                {`${INSTALL_COMMAND} search <query>`}
              </td>
              <td class="px-3 py-2 font-body text-sm text-sky-600">
                Search snippets
              </td>
            </tr>
            <tr>
              <td class="px-3 py-2 font-mono text-sm text-sky-600">
                {`${INSTALL_COMMAND} install <name>`}
              </td>
              <td class="px-3 py-2 font-body text-sm text-sky-600">
                Install a snippet
              </td>
            </tr>
            <tr>
              <td class="px-3 py-2 font-mono text-sm text-sky-600">
                {`${INSTALL_COMMAND} create <name>`}
              </td>
              <td class="px-3 py-2 font-body text-sm text-sky-600">
                Create a new snippet
              </td>
            </tr>
            <tr>
              <td class="px-3 py-2 font-mono text-sm text-sky-600">
                {`${INSTALL_COMMAND} publish <name>`}
              </td>
              <td class="px-3 py-2 font-body text-sm text-sky-600">
                Publish a snippet
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Next Steps */}
      <section class="flex flex-col gap-4">
        <h2 class="font-mono text-lg font-bold text-sky-800">
          Next Steps
        </h2>
        <ul class="flex flex-col gap-2 ml-4">
          <li class="font-body text-sm text-sky-600">
            → Check out the <a href="/docs/tutorial" class="text-sky-500 hover:text-sky-700">Tutorial</a> for a detailed walkthrough
          </li>
          <li class="font-body text-sm text-sky-600">
            → Learn about <a href="/docs/template-syntax" class="text-sky-500 hover:text-sky-700">Template Syntax</a> for advanced features
          </li>
          <li class="font-body text-sm text-sky-600">
            → Explore the <a href="/docs/variables" class="text-sky-500 hover:text-sky-700">Variables</a> guide
          </li>
          <li class="font-body text-sm text-sky-600">
            → Browse <a href="/snippets" class="text-sky-500 hover:text-sky-700">available snippets</a> to use
          </li>
        </ul>
      </section>

      {/* Help */}
      <section class="flex flex-col gap-4 border-l-4 border-sky-300 bg-sky-50 px-4 py-3">
        <h3 class="font-mono text-sm font-bold text-sky-800">
          Need Help?
        </h3>
        <p class="font-body text-sm text-sky-600">
          Use <span class="font-mono bg-sky-50 px-1">{`${INSTALL_COMMAND} --help`}</span> to view all available commands and options.
        </p>
        <p class="font-body text-sm text-sky-600">
          For more information, visit the{" "}
          <a
            href="https://github.com/tbsten/mir"
            target="_blank"
            rel="noopener noreferrer"
            class="text-sky-500 hover:text-sky-700"
          >
            GitHub repository
          </a>
          .
        </p>
      </section>
    </div>,
    { title: "getting-started" },
  );
});
