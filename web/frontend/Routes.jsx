import { Routes as ReactRouterRoutes, Route } from "react-router-dom";

function toRoutePath(pageFilePath) {
  const path = pageFilePath
    .replace("./pages", "")
    .replace(/\.(t|j)sx?$/, "")
    .replace(/\/index$/i, "/")
    .replace(/\b[A-Z]/, (firstLetter) => firstLetter.toLowerCase())
    .replace(/\[(?:[.]{3})?(\w+?)\]/g, (_match, param) => `:${param}`);

  if (path.endsWith("/") && path !== "/") {
    return path.substring(0, path.length - 1);
  }
  return path;
}

function toRoutes(pages) {
  return Object.keys(pages)
    .map((pageFilePath) => {
      if (!pages[pageFilePath].default) {
        console.warn(
          `${pageFilePath} doesn't export a default React component`,
        );
      }
      return {
        path: toRoutePath(pageFilePath),
        component: pages[pageFilePath].default,
      };
    })
    .filter((route) => route.component);
}

export default function Routes({ pages }) {
  const routes = toRoutes(pages);
  const NotFound = routes.find(({ path }) => path === "/notFound").component;

  return (
    <ReactRouterRoutes>
      {routes.map(({ path, component: PageComponent }) => (
        <Route key={path} path={path} element={<PageComponent />} />
      ))}
      <Route path="*" element={<NotFound />} />
    </ReactRouterRoutes>
  );
}
