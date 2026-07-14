import { createBrowserRouter } from "react-router-dom";
import { HomePage } from "@/pages/home/home-page";
import { TreePage } from "@/pages/tree/tree-page";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/tree",
    element: <TreePage />,
  },
]);
