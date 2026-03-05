import { createRoute } from "honox/factory";

export default createRoute((c) => {
  return c.render(
    <div>
      <h1>mir</h1>
      <p>Welcome to mir.</p>
    </div>,
    { title: "mir" },
  );
});
