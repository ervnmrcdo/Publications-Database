import { Application, SubmissionLog } from "@/lib/types";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  onSelect: (data: Application) => void;
};

export default function ListedApplications({ onSelect }: Props) {
  const [data, setData] = useState<Application[]>([]);


  useEffect(() => {
    fetch("/api/pendingAwards")
      .then((res) => res.json())
      .then((result) => {
        setData(
          result.map((item: any) => ({
            application_id: item.id,
            name: item.name,
            role: item.submitterType,
            award: item.awardTitle,
            dateSubmitted: item.dateSubmitted,
            logs: item.logs as SubmissionLog,
            form41Url: item.form41Url || null,
            form42Url: item.form42Url || null,
            form43Url: item.form43Url || null,
            form44Url: item.form44Url || null,
            awardId: item.awardId,
            journal_attachments: item.journal_attachments ?? {},
            book_attachments: item.book_attachments ?? {},  
          })),
        );
      });

    console.log(data)
  }, []);

  console.log(data)
  return (
    <>
      <div className="bg-[#1b1e2b] rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold mb-6 text-white">To Review</h1>


        <div className="space-y-4">
          {data.map((item) => (
            <div
              key={item.application_id}
              className="p-4 rounded-lg bg-[#252836] hover:bg-gray-600 cursor-pointer flex justify-between items-center transition"
              onClick={() => onSelect(item)}
            >
              <div>
                <p className="font-semibold text-lg text-white">{item.name}</p>
                <p className="text-sm text-gray-300">{item.role}</p>
                <p className="text-sm text-gray-300">{item.award}</p>
                <p className="text-xs text-gray-400">{new Date(item.dateSubmitted).toLocaleString()}</p>
              </div>
              <ChevronRight className="text-gray-400" />
            </div>
          ))}
        </div>

      </div>
      {/* <AllAwards /> */}
    </>
  );
}
