import { createRoute } from "honox/factory";
import { INSTALL_COMMAND } from "../../lib/constants.js";

const sections = [
  {
    title: "getting-started",
    description: "Install and set up mir in your project",
    href: "/docs/getting-started",
  },
  {
    title: "template-syntax",
    description: "Handlebars template variables and expressions",
    href: "/docs/template-syntax",
  },
  {
    title: "variables",
    description: "Define and use variables in your snippets",
    href: "/docs/variables",
  },
  {
    title: "tutorial",
    description: "Step-by-step guide to create your first snippet",
    href: "/docs/tutorial",
  },
  {
    title: "api",
    description: "Registry API endpoints and protocol",
    href: "/docs/api",
  },
  {
    title: "submission-guide",
    description: "How to submit your snippet to the registry",
    href: "/docs/submission-guide",
  },
];

export default createRoute((c) => {
  return c.render(
    <div class="flex flex-col gap-8 px-8 py-12 lg:px-32">
      <div class="flex flex-col gap-2">
        <h1 class="font-mono text-2xl font-bold text-sky-900">
          $ mir docs
        </h1>
        <p class="font-body text-sm text-sky-600">
          // learn how to create, publish, and install code snippets
        </p>
      </div>

      {/* Quick Install */}
      <div class="border border-sky-200 bg-sky-100 px-5 py-4">
        <p class="font-mono text-sm text-sky-600">
          <span class="text-sky-500">$</span> {INSTALL_COMMAND}
        </p>
      </div>

      {/* Sections */}
      <div class="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <a
            href={section.href}
            class="flex flex-col gap-2 border border-sky-200 bg-white p-5 hover:border-sky-400"
          >
            <p class="font-mono text-sm font-medium text-sky-900">
              {`> ${section.title}`}
            </p>
            <p class="font-body text-xs text-sky-600">
              {`// ${section.description}`}
            </p>
          </a>
        ))}
      </div>
    </div>,
    { title: "docs" },
  );
});
