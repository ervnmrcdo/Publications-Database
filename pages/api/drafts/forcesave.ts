import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { key } = req.body;

    if (!key) {
      return res.status(400).json({ error: "Document key is required" });
    }

    const response = await fetch(

      "http://host.docker.internal:8080/coauthoring/CommandService.ashx",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ c: "forcesave", key }),
      }
    );

    const data = await response.json();
    return res.json(data);
  } catch (err) {
    console.error("Error triggering forcesave:", err);
    console.log(err)
    return res.status(500).json({ error: `Internal Server Error: ${err}` });
  }
}
