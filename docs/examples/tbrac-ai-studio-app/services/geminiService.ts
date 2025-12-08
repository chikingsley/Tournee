import { GoogleGenAI } from "@google/genai";
import type { Bowler, Event } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateTournamentRecap = async (
  event: Event,
  bowlers: Bowler[]
): Promise<string> => {
  try {
    const _bowlerMap = new Map(bowlers.map((b) => [b.id, b]));

    // Construct a context string about the event status
    const checkedInCount = event.checkedInBowlerIds.length;
    const bracketInfo = event.brackets
      .map(
        (b) =>
          `${b.name}: ${b.status} (${b.matches.filter((m) => m.winnerId).length} matches completed)`
      )
      .join("; ");

    const prompt = `
      You are a professional bowling tournament commentator. 
      Generate a short, exciting status recap for the bowling tournament named "${event.name}".
      
      Details:
      - Date: ${event.date}
      - Location: ${event.location}
      - Bowlers Checked In: ${checkedInCount}
      - Prize Fund: $${event.prizeFund}
      - Bracket Status: ${bracketInfo || "No brackets started yet."}

      Keep it under 100 words. Be hype but professional.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "No commentary available.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI Commentary unavailable at this time.";
  }
};

export const suggestSidepots = async (entryFee: number): Promise<string[]> => {
  try {
    const prompt = `
          Suggest 3 creative sidepot ideas for a bowling tournament with an entry fee of $${entryFee}.
          Return ONLY a JSON array of strings. Example: ["High Game Pot", "Mystery Doubles", "Eliminator"].
        `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) {
      return [];
    }
    return JSON.parse(text) as string[];
  } catch (_e) {
    return ["High Game", "Eliminator", "Mystery Score"];
  }
};
