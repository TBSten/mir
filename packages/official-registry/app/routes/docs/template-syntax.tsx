import { createRoute } from "honox/factory";
import { Breadcrumb } from "../../components/breadcrumb.js";
import { CodeBlock } from "../../components/code-block.js";

export default createRoute((c) => {
  return c.render(
    <div class="flex flex-col gap-8 px-8 py-8 lg:px-32">
      <Breadcrumb
        items={[
          { label: "docs", href: "/docs" },
          { label: "template-syntax" },
        ]}
      />

      <div class="flex flex-col gap-3">
        <h1 class="font-mono text-2xl font-bold text-sky-900">
          Template Syntax
        </h1>
        <p class="font-body text-sm leading-relaxed text-sky-600">
          // Handlebars template engine for dynamic file generation
        </p>
      </div>

      <section class="flex flex-col gap-4">
        <h2 class="font-mono text-lg font-bold text-sky-800">
          Basic Variables
        </h2>
        <p class="font-body text-sm text-sky-600">
          Use double braces to insert variables into file names and content.
        </p>
        <CodeBlock
          fileName="snippet.yaml"
          code={`variables:
  name:
    schema:
      type: string
      default: "myFunction"
  author:
    schema:
      type: string`}
        />
        <CodeBlock
          fileName="template"
          code={`// File: {{ name }}.ts
// Author: {{ author }}
export function {{ name }}() {
  // implementation here
}`}
        />
      </section>

      <section class="flex flex-col gap-4">
        <h2 class="font-mono text-lg font-bold text-sky-800">
          Conditionals
        </h2>
        <p class="font-body text-sm text-sky-600">
          Use #if...#endif blocks for conditional content.
        </p>
        <CodeBlock
          fileName="template"
          code={`{{#if typescript}}
interface Props {
  {{#each fields}}
  {{this}}: string;
  {{/each}}
}
{{/if}}`}
        />
      </section>

      <section class="flex flex-col gap-4">
        <h2 class="font-mono text-lg font-bold text-sky-800">
          Lists
        </h2>
        <p class="font-body text-sm text-sky-600">
          Use #each...#end to iterate over arrays.
        </p>
        <CodeBlock
          fileName="template"
          code={`{{#each imports}}
import {{ this }} from '{{ this }}';
{{/each}}`}
        />
      </section>

      <section class="flex flex-col gap-4">
        <h2 class="font-mono text-lg font-bold text-sky-800">
          Built-in Variables
        </h2>
        <p class="font-body text-sm text-sky-600">
          The following variables are always available:
        </p>
        <div class="flex flex-col gap-2">
          <div class="flex gap-4 border-l-4 border-sky-300 pl-4">
            <p class="font-mono text-sm font-bold text-sky-700 min-w-40">
              project-name
            </p>
            <p class="font-body text-sm text-sky-600">
              Name from package.json or directory name
            </p>
          </div>
        </div>
      </section>
    </div>,
    { title: "template-syntax" },
  );
});
