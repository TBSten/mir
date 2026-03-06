import { createRoute } from "honox/factory";
import { Breadcrumb } from "../../components/breadcrumb.js";
import { CodeBlock } from "../../components/code-block.js";

export default createRoute((c) => {
  return c.render(
    <div class="flex flex-col gap-8 px-8 py-8 lg:px-32">
      <Breadcrumb
        items={[
          { label: "docs", href: "/docs" },
          { label: "api" },
        ]}
      />

      <div class="flex flex-col gap-3">
        <h1 class="font-mono text-2xl font-bold text-sky-900">
          Registry API
        </h1>
        <p class="font-body text-sm leading-relaxed text-sky-600">
          // Protocol for accessing registry snippets
        </p>
      </div>

      <section class="flex flex-col gap-4">
        <h2 class="font-mono text-lg font-bold text-sky-800">
          GET /registry/index.json
        </h2>
        <p class="font-body text-sm text-sky-600">
          List all available snippets in the registry.
        </p>
        <CodeBlock
          fileName="response"
          code={`{
  "snippets": [
    {
      "name": "react-hook",
      "description": "Custom React hook template"
    },
    {
      "name": "api-client",
      "description": "API client generator"
    }
  ]
}`}
        />
      </section>

      <section class="flex flex-col gap-4">
        <h2 class="font-mono text-lg font-bold text-sky-800">
          GET /registry/:name.yaml
        </h2>
        <p class="font-body text-sm text-sky-600">
          Get snippet definition in YAML format.
        </p>
        <CodeBlock
          fileName="example"
          code={`curl https://mir.tbsten.me/registry/react-hook.yaml`}
        />
      </section>

      <section class="flex flex-col gap-4">
        <h2 class="font-mono text-lg font-bold text-sky-800">
          GET /registry/:name/*
        </h2>
        <p class="font-body text-sm text-sky-600">
          Get template file content.
        </p>
        <CodeBlock
          fileName="example"
          code={`# Get template file for react-hook
curl https://mir.tbsten.me/registry/react-hook/{{ name }}.ts`}
        />
      </section>

      <section class="flex flex-col gap-4">
        <h2 class="font-mono text-lg font-bold text-sky-800">
          Using with CLI
        </h2>
        <CodeBlock
          fileName="terminal"
          code={`# Add registry to mirconfig.yaml
registries:
  - name: official
    url: https://mir.tbsten.me/registry

# Install from registry
mir install react-hook --registry=official`}
        />
      </section>
    </div>,
    { title: "api" },
  );
});
