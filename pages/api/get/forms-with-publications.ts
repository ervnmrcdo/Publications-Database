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
      .from("publication_authors")
      .select(`
        publication_id,
        publications!inner(
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
          publication_award_applications(*)
        ),
        users!inner(
          id,
          first_name,
          middle_name,
          last_name,
          university,
          college,
          department,
          position,
          contact_number,
          email_address
        )
      `)
      .eq("user_id", userId);

    if (pubsError) {
      console.log("Publications error:", pubsError);
      return res.status(400).json({ error: pubsError.message });
    }

    const unsubmittedPublications = (publicationsData ?? []).filter(
      (row: any) => !row.publications?.publication_award_applications?.length
    );

    const result = awardsData.map((award: any) => {
      const eligible = unsubmittedPublications
        .filter((row: any) => row.publications?.book_or_journal === award.allowed_type)
        .map((row: any) => {
          const pub = row.publications;
          const currentUser = row.users;

          const authors = [
            {
              first_name: currentUser?.first_name || "",
              last_name: currentUser?.last_name || "",
              middle_name: currentUser?.middle_name || "",
              university: currentUser?.university || "",
              college: currentUser?.college || "",
              department: currentUser?.department || "",
              position: currentUser?.position || "",
              contact_number: currentUser?.contact_number || "",
              email_address: currentUser?.email_address || "",
            },
          ];

          return {
            doi: pub.doi,
            book_or_journal: pub.book_or_journal,
            title: pub.title,
            publisher: pub.publisher,
            issue_number: pub.issue_number,
            journal_name: pub.journal_name,
            page_numbers: pub.page_numbers,
            volume_number: pub.volume_number,
            date_published: pub.date_published,
            publication_id: pub.publication_id,
            publication_status: pub.publication_status,
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
