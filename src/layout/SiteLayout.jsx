// src/SiteLayout.jsx
import { Outlet } from "react-router-dom";
import HeaderNav from "@/components/HeaderNav";
import Footer from "@/components/Footer";

export default function SiteLayout() {
    return (
        <div className="min-h-screen bg-neutral-100 dark:bg-[#0b0b0c] dark:text-neutral-200 text-slate-900">
            <HeaderNav />
            <main className="pb-16">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
