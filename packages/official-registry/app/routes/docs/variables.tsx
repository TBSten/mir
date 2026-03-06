import { createRoute } from "honox/factory";
import { Breadcrumb } from "../../components/breadcrumb.js";
import { CodeBlock } from "../../components/code-block.js";

export default createRoute((c) => {
  return c.render(
    <div class="flex flex-col gap-8 px-8 py-8 lg:px-32">
      <Breadcrumb
        items={[
          { label: "docs", href: "/docs" },
          { label: "variables" },
        ]}
      />

      <div class="flex flex-col gap-3">
        <h1 class="font-mono text-2xl font-bold text-sky-900">
          Variables Guide
        </h1>
        <p class="font-body text-sm leading-relaxed text-sky-600">
          // Define and use variables in your snippets
        </p>
      </div>

      <section class="flex flex-col gap-4">
        <h2 class="font-mono text-lg font-bold text-sky-800">
          Defining Variables
        </h2>
        <p class="font-body text-sm text-sky-600">
          Variables are defined in snippet.yaml with a schema.
        </p>
        <CodeBlock
          fileName="snippet.yaml"
          code={`variables:
  name:
    description: "Function name"
    name: "Function Name"
    schema:
      type: string
      default: "myFunction"

  framework:
    description: "Target framework"
    schema:
      type: string
      default: "react"
    suggests:
      - "react"
      - "vue"
      - "svelte"`}
        />
      </section>

      <section class="flex flex-col gap-4">
        <h2 class="font-mono text-lg font-bold text-sky-800">
          Variable Types
        </h2>
        <div class="flex flex-col gap-2">
          <div class="flex gap-4 border-l-4 border-sky-300 pl-4">
            <p class="font-mono text-sm font-bold text-sky-700 min-w-40">
              string
            </p>
            <p class="font-body text-sm text-sky-600">
              Text input (default)
            </p>
          </div>
          <div class="flex gap-4 border-l-4 border-sky-300 pl-4">
            <p class="font-mono text-sm font-bold text-sky-700 min-w-40">
              number
            </p>
            <p class="font-body text-sm text-sky-600">
              Numeric input
            </p>
          </div>
          <div class="flex gap-4 border-l-4 border-sky-300 pl-4">
            <p class="font-mono text-sm font-bold text-sky-700 min-w-40">
              boolean
            </p>
            <p class="font-body text-sm text-sky-600">
              Yes/No input
            </p>
          </div>
        </div>
      </section>

      <section class="flex flex-col gap-4">
        <h2 class="font-mono text-lg font-bold text-sky-800">
          Built-in Variables
        </h2>
        <p class="font-body text-sm text-sky-600">
          These variables are automatically available in all snippets:
        </p>
        <div class="flex flex-col gap-2">
          <div class="flex gap-4 border-l-4 border-sky-300 pl-4">
            <p class="font-mono text-sm font-bold text-sky-700 min-w-40">
              project-name
            </p>
            <p class="font-body text-sm text-sky-600">
              Project name from package.json or directory name
            </p>
          </div>
        </div>
      </section>

      <section class="flex flex-col gap-4">
        <h2 class="font-mono text-lg font-bold text-sky-800">
          Using Variables in Templates
        </h2>
        <CodeBlock
          fileName="{{ name }}.ts"
          code={`export function {{ name }}() {
  // Component: {{ name }}
  // Type: {{ type }}
}

export default {{ name }};`}
        />
      </section>
    </div>,
    { title: "variables" },
  );
});
