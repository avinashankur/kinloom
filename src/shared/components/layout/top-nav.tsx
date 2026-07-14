import { Link } from "react-router-dom";
import { Button } from "../ui/button";

export function TopNav() {
  return (
    <header className="flex items-center justify-between px-6 md:px-12 h-16 bg-canvas text-ink w-full sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <Link to="/" className="text-xl font-bold tracking-tight">
          kinloom
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="default">Open Family Tree</Button>
      </div>
    </header>
  );
}
