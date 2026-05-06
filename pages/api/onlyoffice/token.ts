import { NextApiRequest, NextApiResponse } from "next";
import * as jose from "jose";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { config } = req.body;

    if (!config) {
      return res.status(400).json({ error: "Config is required" });
    }

    const secret = new TextEncoder().encode("my_super_secret_key");
    const token = await new jose.SignJWT(config)
      .setProtectedHeader({ alg: "HS256" })
      .sign(secret);

    return res.json({ token });
  } catch (err) {
    console.error("Error generating JWT:", err);
    return res.status(500).json({ error: "Failed to generate token" });
  }
}