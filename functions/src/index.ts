import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";

admin.initializeApp();

export const getSkillEvents = functions.https.onCall(async (request) => {
  const data = request.data as { month: number, year: number };
  const {month, year} = data;

  if (!month || !year) {
    throw new functions.https.HttpsError("invalid-argument", "Month and Year are required");
  }

  try {
    const apiUrl = process.env.SKILL_API_URL;
    const username = process.env.SKILL_USERNAME;
    const password = process.env.SKILL_PASSWORD;
    const companyAuthId = process.env.SKILL_COMPANY_AUTH_ID;
    const idData = process.env.SKILL_ID_DATA;

    // 1. Authenticate
    const authResponse = await axios.post(`${apiUrl}/authenticate`, {
      username,
      password,
      companyAuthId,
      companyId: "",
    });

    if (!authResponse.data.success) {
      throw new Error("Authentication failed with Skill API");
    }

    const token = authResponse.data.result.token;

    // 2. Prepare dates for the month
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    // 3. Get Events
    const eventsResponse = await axios.post(
      `${apiUrl}/events`,
      {
        Events: {
          startDate,
          endDate,
        },
      },
      {
        headers: {
          "idData": idData,
          "companyAuthId": companyAuthId,
          "Authorization": `Bearer ${token}`,
        },
      }
    );

    if (!eventsResponse.data.success) {
      return {success: true, events: []};
    }

    // Map to the format needed by the frontend
    // eventNumber -> ID de Evento
    // title -> Nombre del evento
    const events = (eventsResponse.data.result.events || []).map((event: { eventNumber: number, title: string }) => ({
      idEvento: event.eventNumber,
      nombre: event.title,
    }));

    return {success: true, events};
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error fetching Skill events:", err);
    throw new functions.https.HttpsError("internal", err.message || "Internal Server Error");
  }
});
