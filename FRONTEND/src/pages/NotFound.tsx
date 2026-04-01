import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Header from "@/components/Header";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404: Бет табылмады:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="text-center">
          <p className="text-7xl font-black text-primary">404</p>
          <h1 className="mt-4 text-2xl font-bold text-foreground">
            Бет табылмады
          </h1>
          <p className="mt-2 text-muted-foreground">
            Сіз іздеген бет жоқ немесе жойылған
          </p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:-translate-y-0.5 transition-all"
          >
            Басты бетке оралу
          </Link>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
