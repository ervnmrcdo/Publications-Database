import { createPagesServerClient } from "@/lib/supabase/pager-server";
import { NextApiRequest, NextApiResponse } from "next";

interface PublicationRow {
  doi: string | null;
  book_or_journal: string | null;
  title: string;
  publisher: string;
  issue_number: string;
  journal_name: string;
  page_numbers: string;
  volume_number: string;
  date_published: string;
  publication_id: number;
  publication_status: string;
  publication_authors?: any[];
  users?: any[];
  publication_award_applications?: any[];
}

export default async function func(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = createPagesServerClient(req, res);
    const { id: userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const { data: awardsData, error: awardsError } = await supabase
      .from("awards")
      .select("award_id, title, description, allowed_type");

    if (awardsError) {
      console.log("Awards error:", awardsError);
      return res.status(400).json({ error: awardsError.message });
    }

    const { data: publicationsData, error: pubsError } = await supabase
      .from("publications")
      .select(`
        publication_id,
        book_or_journal,
        title,
        publisher,
        publication_status,
        date_published,
        issue_number,
        page_numbers,
        volume_number,
        journal_name,
        doi,
        publication_authors!inner(*, users!inner(*)),
        users!inner(*),
        publication_award_applications(*)
      `)
      .eq("users.id", userId);

    if (pubsError) {
      console.log("Publications error:", pubsError);
      return res.status(400).json({ error: pubsError.message });
    }

    const unsubmittedPublications = (publicationsData ?? []).filter(
      (p: any) => !p.publication_award_applications?.length
    );

    const result = awardsData.map((award: any) => {
      const eligible = unsubmittedPublications
        .filter((p: PublicationRow) => p.book_or_journal === award.allowed_type)
        .map((p: PublicationRow) => {
          const authors = p.publication_authors?.map((pa: any) => ({
            first_name: pa.first_name || pa.users?.first_name || "",
            last_name: pa.last_name || pa.users?.last_name || "",
            middle_name: pa.middle_name || pa.users?.middle_name || "",
            university: pa.university || pa.users?.university || "",
            college: pa.college || pa.users?.college || "",
            department: pa.department || pa.users?.department || "",
            position: pa.position || pa.users?.position || "",
            contact_number: pa.contact_number || pa.users?.contact_number || "",
            email_address: pa.email_address || pa.users?.email_address || "",
          })) || [];

          return {
            doi: p.doi,
            book_or_journal: p.book_or_journal,
            title: p.title,
            publisher: p.publisher,
            issue_number: p.issue_number,
            journal_name: p.journal_name,
            page_numbers: p.page_numbers,
            volume_number: p.volume_number,
            date_published: p.date_published,
            publication_id: p.publication_id,
            publication_status: p.publication_status,
            authors,
          };
        });

      return {
        award_id: award.award_id,
        title: award.title,
        description: award.description,
        publication_per_award: eligible,
      };
    });

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ message: `Internal Server Error: ${err}` });
  }
}
