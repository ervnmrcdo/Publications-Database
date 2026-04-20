import { useRouter, usePathname } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import "../../app/globals.css";

type TeachingPage =
  | "Home"
  | "Profile"
  | "Publications"
  | "Award Application"
  | "Submissions";

const TeachingSidebar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [completedCount, setCompletedCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const checkCompleted = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('submissions')
          .select('submission_id')
          .eq('submitter_id', user.id)
          .in('status', ['VALIDATED', 'PENDING_SUBMISSION', 'SUBMITTED', 'PROCESSED']);
        setCompletedCount(data?.length || 0);
      }
    };
    checkCompleted();
  }, []);

  const handleAwardsClick = () => {
    if (completedCount > 0) {
      setShowWarning(true);
    } else {
      router.push("/teaching/awards");
    }
  };

  const proceedToAwards = () => {
    setShowWarning(false);
    router.push("/teaching/awards");
  };

  const getActivePage = (): TeachingPage => {
    const path = pathname?.split("/").pop() || "home";
    if (path === "home") return "Home";
    if (path === "profile") return "Profile";
    if (path === "publications") return "Publications";
    if (path === "awards") return "Award Application";
    if (path === "submissions") return "Submissions";
    return "Home";
  };

  const active = getActivePage();

  const buttonStyle = (label: TeachingPage): string =>
    `m-[5px] flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer transition ${active === label
      ? "bg-blue-500/20 text-blue-400"
      : "hover:bg-gray-700 text-gray-300"
    }`;

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="h-screen w-18 bg-[#1b1e2b] flex flex-col p-8">
      <div className="flex items-center space-x-2 mb-8">
        <span
          className="font-semibold text-lg text-gray-400 cursor-pointer"
          onClick={() => router.push("/teaching/home")}
        >
          DCS Records
        </span>
      </div>

      <div className="mb-6">
        <h2 className="text-xs uppercase text-gray-500 mb-2">Personal</h2>
        <ul className="space-y-1">
          <li
            onClick={() => router.push("/teaching/home")}
            className={buttonStyle("Home")}
          >
            <span>Home</span>
          </li>
          <li
            onClick={() => router.push("/teaching/profile")}
            className={buttonStyle("Profile")}
          >
            <span>Profile</span>
          </li>
          <li
            onClick={() => router.push("/teaching/publications")}
            className={buttonStyle("Publications")}
          >
            <span>Publications</span>
          </li>
          <li
            onClick={handleAwardsClick}
            className={buttonStyle("Award Application")}
          >
            <span>Award Application</span>
          </li>
          <li
            onClick={() => router.push("/teaching/submissions")}
            className={buttonStyle("Submissions")}
          >
            <span>Submissions</span>
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

      {showWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1b1e2b] p-4 rounded-lg max-w-sm border border-yellow-600">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <h3 className="text-md font-semibold text-white">Existing Applications</h3>
            </div>
            <p className="text-gray-300 text-sm mb-3">
              You have {completedCount} existing application{completedCount > 1 ? 's' : ''} that have been validated or processed.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowWarning(false)}
                className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={proceedToAwards}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default TeachingSidebar;
