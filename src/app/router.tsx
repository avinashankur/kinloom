import { createBrowserRouter } from "react-router-dom";
import { LandingPage } from "@/features/landing/components/landing-page";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  // We can add the /tree route here later
]);
