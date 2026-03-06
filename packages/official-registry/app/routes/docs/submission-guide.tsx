import { createRoute } from "honox/factory";
import { Breadcrumb } from "../../components/breadcrumb.js";
import { CodeBlock } from "../../components/code-block.js";

export default createRoute((c) => {
  return c.render(
    <div class="flex flex-col gap-8 px-8 py-8 lg:px-32">
      <Breadcrumb
        items={[
          { label: "docs", href: "/docs" },
          { label: "submission-guide" },
        ]}
      />

      <div class="flex flex-col gap-3">
        <h1 class="font-mono text-2xl font-bold text-sky-900">
          Submission Guide
        </h1>
        <p class="font-body text-sm leading-relaxed text-sky-600">
          // How to submit your snippet to the official registry
        </p>
      </div>

      <section class="flex flex-col gap-4">
        <h2 class="font-mono text-lg font-bold text-sky-800">
          Before You Submit
        </h2>
        <p class="font-body text-sm text-sky-600">
          Ensure your snippet:
        </p>
        <ul class="flex flex-col gap-2 ml-4">
          <li class="font-body text-sm text-sky-600">
            - Has a clear, descriptive name
          </li>
          <li class="font-body text-sm text-sky-600">
            - Includes comprehensive documentation
          </li>
          <li class="font-body text-sm text-sky-600">
            - Has well-defined variables
          </li>
          <li class="font-body text-sm text-sky-600">
            - Follows community standards
          </li>
        </ul>
      </section>

      <section class="flex flex-col gap-4">
        <h2 class="font-mono text-lg font-bold text-sky-800">
          Create Your Snippet Locally
        </h2>
        <CodeBlock
          fileName="terminal"
          code={`$ mir init
$ mir create my-awesome-snippet
$ # Edit .mir/snippets/my-awesome-snippet.yaml
$ # Add template files to .mir/snippets/my-awesome-snippet/
$ mir sync my-awesome-snippet`}
        />
      </section>

      <section class="flex flex-col gap-4">
        <h2 class="font-mono text-lg font-bold text-sky-800">
          Submit via GitHub
        </h2>
        <p class="font-body text-sm text-sky-600">
          1. Create a GitHub issue or discussion
        </p>
        <p class="font-body text-sm text-sky-600">
          2. Include:
        </p>
        <ul class="flex flex-col gap-2 ml-4">
          <li class="font-body text-sm text-sky-600">
            - Snippet YAML content
          </li>
          <li class="font-body text-sm text-sky-600">
            - Description and use cases
          </li>
          <li class="font-body text-sm text-sky-600">
            - Template files (if applicable)
          </li>
        </ul>
        <p class="font-body text-sm text-sky-600">
          3. Wait for review and integration
        </p>
      </section>

      <section class="flex flex-col gap-4">
        <h2 class="font-mono text-lg font-bold text-sky-800">
          Build Custom Registry
        </h2>
        <p class="font-body text-sm text-sky-600">
          Want to maintain your own registry? Use @mir/registry-sdk:
        </p>
        <CodeBlock
          fileName="registry.ts"
          code={`import { createRegistryRoutes } from "@mir/registry-sdk";

// Implement your own RegistryProvider
const provider = {
  list: async () => [ /* snippet names */ ],
  get: async (name) => [ /* snippet definition and files */ ],
  search: async (query) => [ /* matching snippets */ ],
};

// Use with Hono or your preferred framework
app.route("/registry", createRegistryRoutes(provider));`}
        />
      </section>
    </div>,
    { title: "submission-guide" },
  );
});
