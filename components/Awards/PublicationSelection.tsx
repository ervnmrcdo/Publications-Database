import { ChevronRight, Loader2, Trash2 } from "lucide-react";
import { FC, useState } from "react";
import { Author, Award, Publication } from "@/lib/types";

interface PublicationSelectionProps {
  handleBack: () => void;
  handlePublicationSelect: (pub: Publication) => void;
  publications: Publication[];
  isLoading?: boolean;
  draftsMap: Record<string, boolean>;
  setDraftsMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  selectedAward: Award | null;
}

const PublicationSelection: FC<PublicationSelectionProps> = ({
  handleBack,
  handlePublicationSelect,
  publications,
  isLoading = false,
  draftsMap,
  setDraftsMap,
  selectedAward,
}) => {
  const [resettingId, setResettingId] = useState<string | null>(null);

  console.log(draftsMap)

  const handleResetDraft = async (publicationId: string) => {
    if (!confirm("Are you sure you want to reset this draft? This cannot be undone.")) return;
    if (!selectedAward) return;

    setResettingId(publicationId);
    try {
      const res = await fetch(`/api/drafts?publicationId=${publicationId}&awardId=${selectedAward.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        alert("Reset Complete");
        setDraftsMap((prev) => ({ ...prev, [publicationId]: false }));
        window.location.reload();
      }
    } catch (err) {
      console.error("Failed to reset draft:", err);
    } finally {
      setResettingId(null);
    }
  };

  return (
    <>
      <button
        onClick={handleBack}
        className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 px-3 py-1 rounded transition text-sm mb-4"
      >
        ← Back to Awards
      </button>
      <h1 className="text-2xl font-bold mb-6 text-white">Choose a publication</h1>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-400">Loading publications...</span>
        </div>
      ) : publications.length === 0 ? (
        <p className="text-gray-400">No publications found.</p>
      ) : (
        <div className="space-y-4">
          {publications.map((pub) => (
            <div
              key={pub.publication_id}
              className="flex justify-between items-center p-4 bg-[#1a1e2b] hover:bg-gray-700 rounded-xl shadow-sm transition group"
            >
              <div
                onClick={() => handlePublicationSelect(pub)}
                className="flex-grow cursor-pointer"
              >
                <h2 className="font-semibold text-gray-200">{pub.title}</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-400">{pub.date_published}</div>
                {draftsMap[pub.publication_id] && (
                  <button
                    onClick={() => handleResetDraft(pub.publication_id)}
                    disabled={resettingId === pub.publication_id}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition"
                    title="Reset Draft"
                  >
                    {resettingId === pub.publication_id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                )}
                <ChevronRight className="text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default PublicationSelection;
