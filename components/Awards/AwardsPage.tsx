import { FC, useEffect, useState } from "react";
import Awards from "./Awards";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Loader2 } from "lucide-react";
import PublicationSelection from "./PublicationSelection";
import { Author, Award, Publication, AwardWithPublications } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { AwardsFlowProvider, useAwardsFlow } from "@/context/AwardsFlowContext";
import Form41Editor from "../Awards/Form41Editor";
import Form42Editor from "./Form42Editor";
import FormEditing from "./FormEditing";

const AwardsPageContent: FC = () => {
  const { step, setStep, setDraftId, setDraftUrls, draftsMap, setDraftsMap } = useAwardsFlow();
  const [selectedAward, setSelectedAward] = useState<Award | null>(null);
  const [selectedPublication, setSelectedPublication] =
    useState<Publication | null>(null);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [isLoadingPublications, setIsLoadingPublications] = useState(false);

  const [awardsWithPublications, setAwardsWithPublications] = useState<AwardWithPublications[]>([]);
  const [isLoadingAwards, setIsLoadingAwards] = useState(true);

  const { user } = useAuth();
  const ADMIN_UUID = user?.id;

  useEffect(() => {
    if (!user) return;

    setIsLoadingAwards(true);

    fetch("/api/get/forms-with-publications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ADMIN_UUID }),
    })
      .then((res) => res.json())
      .then((result) => {
        const normalizedAwards = Array.isArray(result)
          ? result
          : Array.isArray(result?.awards)
            ? result.awards
            : [];

        setAwardsWithPublications(normalizedAwards);
        setIsLoadingAwards(false);
      })
      .catch((err) => {
        console.error("Failed to fetch awards with publications:", err);
        setIsLoadingAwards(false);
      });
  }, [user?.id]);

  const handleAwardSelect = async (award: Award) => {
    setSelectedAward(award);

    const awardData = awardsWithPublications.find(
      (awp) => awp.award_id === award.id
    );

    if (awardData) {
      const allPublications: Publication[] = [];

      awardData.publication_per_award.forEach((pub: any) => {
        allPublications.push({
          type: pub.type,
          subType: pub.subType || pub.type,
          aggregation_type: pub.aggregation_type || null,
          publication_id: String(pub.publication_id),
          users: pub.authors || [],
          title: pub.title,
          date_published: pub.date_published,
          journal_name: pub.journal_name,
          volume_number: pub.volume_number,
          page_numbers: pub.page_numbers,
          publisher: pub.publisher,
          issue_number: pub.issue_number,
          publication_status: pub.publication_status,
          publication_type_id: pub.publication_type_id,
          doi: pub.doi,
        });
      });

      setPublications(allPublications);

      const draftsMap: Record<string, boolean> = {};
      for (const pub of allPublications) {
        try {
          const res = await fetch(`/api/drafts?publicationId=${pub.publication_id}&awardId=${award.id}`);
          const draft = await res.json();
          draftsMap[pub.publication_id] = !!(draft?.form41 || draft?.form42 || draft?.form43 || draft?.form44);
        } catch {
          draftsMap[pub.publication_id] = false;
        }
      }
      setDraftsMap(draftsMap);
    }

    setStep("publications");
  };

  console.log(draftsMap)


  const handlePublicationSelect = async (pub: Publication) => {
    setSelectedPublication(pub);

    if (selectedAward) {
      try {
        const res = await fetch(`/api/drafts?publicationId=${pub.publication_id}&awardId=${selectedAward.id}`);
        const draft = await res.json();

        if (draft) {
          setDraftId(draft.id);
          setDraftUrls({
            form41: draft.form41 || null,
            form42: draft.form42 || null,
            form43: draft.form43 || null,
            form44: draft.form44 || null,
          });
        } else {
          setDraftId(null);
          setDraftUrls({});
        }
      } catch (err) {
        console.error("Failed to fetch draft:", err);
        setDraftId(null);
        setDraftUrls({});
      }
    }

    setStep("form");
  };

  const handleBack = () => {
    if (step === "form") setStep("publications");
    else if (step === "publications") setStep("awards");
  };

  const awards: Award[] = awardsWithPublications.map((awp) => ({
    id: awp.award_id,
    title: awp.title,
    description: awp.description || "",
  }));

  return (
    <>
      <div className="relative overflow-hidden p-6">
        <AnimatePresence mode="wait">
          {step === "awards" && (
            <motion.div
              key="awards"
              initial={{ x: 0, opacity: 1 }}
              exit={{ x: -200, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {isLoadingAwards ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-3 text-gray-400">Loading awards...</span>
                </div>
              ) : (
                <Awards awards={awards} onSelect={handleAwardSelect} />
              )}
            </motion.div>
          )}

          {step === "publications" && (
            <motion.div
              key="publications"
              initial={{ x: 200, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -200, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <PublicationSelection
                handleBack={handleBack}
                handlePublicationSelect={(pub) => handlePublicationSelect(pub)}
                publications={publications}
                isLoading={isLoadingPublications}
                draftsMap={draftsMap}
                setDraftsMap={setDraftsMap}
                selectedAward={selectedAward}
              />
            </motion.div>
          )}

          {step === "form" && selectedAward && selectedPublication && (
            <motion.div
              key="form"
              initial={{ x: 200, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -200, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >

              <FormEditing
                handleBack={handleBack}
                selectedAward={selectedAward}
                selectedPublication={selectedPublication}
                userId={ADMIN_UUID} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

const AwardsPage: FC = () => {
  return (
    <AwardsFlowProvider>
      <AwardsPageContent />
    </AwardsFlowProvider>
  );
};

export default AwardsPage;
