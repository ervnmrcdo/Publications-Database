import { useRouter, usePathname } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import "../../app/globals.css";
import SidebarUserCard from './SidebarUserCard'


type NonTeachingPage =
  | "Home"
  | "Profile"
  | "Publications"
  | "Award Application"
  | "Submissions";

const NonTeachingSidebar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const getActivePage = (): NonTeachingPage => {
    const path = pathname?.split("/").pop() || "home";
    if (path === "home") return "Home";
    if (path === "profile") return "Profile";
    if (path === "publications") return "Publications";
    if (path === "awards") return "Award Application";
    if (path === "submissions") return "Submissions";
    return "Home";
  };

  const active = getActivePage();

  const buttonStyle = (label: NonTeachingPage): string =>
    `m-[5px] flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer transition ${active === label
      ? "bg-blue-500/20 text-blue-400"
      : "hover:bg-gray-700 text-gray-300"
    }`;

  const handleLogout = async () => {
      await signOut()
      router.push('/login')
      router.refresh()
  }

  return (
    <aside className="h-screen w-18 bg-[#1b1e2b] flex flex-col p-8">
      <div className="flex items-center space-x-2 mb-8">
        <span
          className="font-semibold text-lg text-gray-400 cursor-pointer"
          onClick={() => router.push("/nonteaching/home")}
        >
          DCS Records
        </span>
      </div>

      <div className="mb-6">
        <h2 className="text-xs uppercase text-gray-500 mb-2">Personal</h2>
        <ul className="space-y-1">
          <li
            onClick={() => router.push("/nonteaching/home")}
            className={buttonStyle("Home")}
          >
            <span>Home</span>
          </li>
          <li
            onClick={() => router.push("/nonteaching/profile")}
            className={buttonStyle("Profile")}
          >
            <span>Profile</span>
          </li>
          <li
            onClick={() => router.push("/nonteaching/publications")}
            className={buttonStyle("Publications")}
          >
            <span>Publications</span>
          </li>
          <li
            onClick={() => router.push("/nonteaching/awards")}
            className={buttonStyle("Award Application")}
          >
            <span>Award Application</span>
          </li>
          <li
            onClick={() => router.push("/nonteaching/submissions")}
            className={buttonStyle("Submissions")}
          >
            <span>Submissions</span>
          </li>
        </ul>
      </div>

      <div className="mb-6">
        <h2 className="text-xs uppercase text-gray-500 mb-2">Help</h2>
        <ul className="space-y-1">
          <li
            onClick={() => window.open('/user-manual.html', '_blank')}
            className="m-[5px] flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer transition hover:bg-gray-700 text-gray-300"
          >
            <span>User Manual</span>
          </li>
        </ul>
      </div>

      <SidebarUserCard onLogout={handleLogout} />
    </aside>
  );
};

export default NonTeachingSidebar;
