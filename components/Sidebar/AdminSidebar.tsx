import { useRouter, usePathname } from "next/navigation";
import "../../app/globals.css";
import { createClient } from '@/lib/supabase/client'

type Page =
  | "Home"
  | "Profile"
  | "To Review"
  | "Signed Forms"
  | "Teaching"
  | "NonTeaching"
  | "Awards"
  | "Crawler"
  | "Database"
  | "Publication Types";

const AdminSidebar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  const getActivePage = (): Page => {
    const path = pathname?.split("/").pop() || "home";
    if (path === "home") return "Home";
    if (path === "profile") return "Profile";
    if (path === "to-review") return "To Review";
    if (path === "teaching") return "Teaching";
    if (path === "nonteaching") return "NonTeaching";
    if (path === "awards") return "Awards";
    if (path === "crawler") return "Crawler";
    if (path === "publication-types") return "Publication Types";
    if (path === "database") return "Database";
    return "Home";
  };

  const active = getActivePage();

  const buttonStyle = (label: Page): string =>
    `m-[5px] flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer transition ${active === label
      ? "bg-blue-500/20 text-blue-400"
      : "hover:bg-gray-700 text-gray-300"
    }`;

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
}

  return (
    <aside className="h-screen w-18 bg-[#1b1e2b] flex flex-col p-8">
      <div className="flex items-center space-x-2 mb-8">
        <span
          className="font-semibold text-lg text-gray-400 cursor-pointer"
          onClick={() => router.push("/admin/home")}
        >
          DCS Records
        </span>
      </div>

      <div className="mb-6">
        <h2 className="text-xs uppercase text-gray-500 mb-2">Personal</h2>
        <ul className="space-y-1">
          <li
            onClick={() => router.push("/admin/home")}
            className={buttonStyle("Home")}
          >
            <span>Home</span>
          </li>
          <li
            onClick={() => router.push("/admin/profile")}
            className={buttonStyle("Profile")}
          >
            <span>Profile</span>
          </li>
          <li
            onClick={() => router.push("/admin/to-review")}
            className={buttonStyle("To Review")}
          >
            <span>To Review</span>
          </li>
          <li
            onClick={() => router.push("/admin/signed-forms")}
            className={buttonStyle("Signed Forms")}
          >
            <span>Signed Forms</span>
          </li>
        </ul>
      </div>
      <div className="mb-6">
        <h2 className="text-xs uppercase text-gray-500 mb-2">Personnel</h2>
        <ul className="space-y-1">
          <li
            onClick={() => router.push("/admin/teaching")}
            className={buttonStyle("Teaching")}
          >
            <span>Teaching</span>
          </li>
          <li
            onClick={() => router.push("/admin/nonteaching")}
            className={buttonStyle("NonTeaching")}
          >
            <span>NonTeaching</span>
          </li>
        </ul>
      </div>
      <div className="mb-6">
        <h2 className="text-xs uppercase text-gray-500 mb-2">Settings</h2>
        <ul className="space-y-1">
          <li
            onClick={() => router.push("/admin/awards")}
            className={buttonStyle("Awards")}
          >
            <span>Awards</span>
          </li>
          <li
            onClick={() => router.push("/admin/settings/publication-types")}
            className={buttonStyle("Publication Types")}
          >
            <span>Publication Types</span>
          </li>

          <li
            onClick={() => router.push("/admin/crawler")}
            className={buttonStyle("Crawler")}
          >
            <span>Crawler</span>
          </li>
        </ul>
      </div>

      <div className="mt-auto">
        <button
          onClick={handleLogout}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded-lg transition"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
