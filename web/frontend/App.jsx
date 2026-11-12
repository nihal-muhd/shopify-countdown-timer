import { BrowserRouter } from "react-router-dom";
import { NavMenu } from "@shopify/app-bridge-react";
import Routes from "./Routes";

import { QueryProvider, PolarisProvider } from "./components";

export default function App() {
  const pages = import.meta.glob("./pages/**/!(*.test.[jt]sx)*.([jt]sx)", {
    eager: true,
  });

  return (
    <PolarisProvider>
      <BrowserRouter>
        <QueryProvider>
          <NavMenu>
            <a href="/" rel="home">
              Timers
            </a>
            <a href="/timers/new">Create timer</a>
          </NavMenu>
          <Routes pages={pages} />
        </QueryProvider>
      </BrowserRouter>
    </PolarisProvider>
  );
}
