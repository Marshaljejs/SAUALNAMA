import { ClipboardList } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border bg-secondary/50 py-8">
    <div className="container mx-auto px-4 md:px-6">
      <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <ClipboardList className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">Сауалнама</span>
        </div>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Сауалнама. Барлық құқықтар қорғалған.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
