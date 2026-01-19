import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import axios from "axios";

admin.initializeApp();

interface SkillAuthResponse {
  success: boolean;
  result: {
    token: string;
  };
}

interface SkillEvent {
  eventNumber: number;
  title: string;
  eventStatus?: {
    eventStatusDescription?: string;
  };
  eventStatusDescription?: string;
}

interface SkillEventsResponse {
  success: boolean;
  result: {
    events?: SkillEvent[];
  };
}

interface RequestData {
  month?: number;
  year?: number;
  eventNumber?: string | number;
}

export const getSkillEvents = onCall({
  region: "us-central1",
  invoker: "public",
  maxInstances: 10,
}, async (request) => {
  const data = request.data as RequestData;
  const {month, year, eventNumber} = data;

  if (!eventNumber && (!month || !year)) {
    throw new HttpsError("invalid-argument", "Either eventNumber or Month and Year are required");
  }

  try {
    const apiUrl = process.env.SKILL_API_URL;
    const username = process.env.SKILL_USERNAME;
    const password = process.env.SKILL_PASSWORD;
    const companyAuthId = process.env.SKILL_COMPANY_AUTH_ID;
    const idData = process.env.SKILL_ID_DATA;

    if (!apiUrl || !username || !password) {
      throw new Error("Configuration error: Missing API credentials");
    }

    // 1. Authenticate
    const authResponse = await axios.post<SkillAuthResponse>(`${apiUrl}/authenticate`, {
      username,
      password,
      companyAuthId,
      companyId: "",
    });

    if (!authResponse.data.success) {
      throw new Error("Authentication failed with Skill API");
    }

    const token = authResponse.data.result.token;

    // 2. Prepare Payload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventsPayload: any = { Events: {} };
    if (eventNumber) {
      // Ensure it's a number if possible
      eventsPayload.Events.eventNumber = typeof eventNumber === "string" ? parseInt(eventNumber, 10) : eventNumber;
      console.log(`Searching specifically for eventNumber: ${eventsPayload.Events.eventNumber}`);
    } else if (month && year) {
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      eventsPayload.Events.startDate = startDate;
      eventsPayload.Events.endDate = endDate;
      console.log(`Searching for events in range: ${startDate} to ${endDate}`);
    }

    // 3. Get Events
    const eventsResponse = await axios.post<SkillEventsResponse>(
      `${apiUrl}/events`,
      eventsPayload,
      {
        headers: {
          "idData": idData,
          "companyAuthId": companyAuthId,
          "Authorization": `Bearer ${token}`,
        },
      }
    );

    if (!eventsResponse.data.success) {
      console.log(`Events API returned success: false for payload:`, JSON.stringify(eventsPayload));
      return {success: true, events: []};
    }

    const allEvents = eventsResponse.data.result.events || [];
    console.log(`Total events fetched from Skill: ${allEvents.length}`);

    // Filter events
    const filteredEvents = allEvents.filter((event: SkillEvent) => {
      // If user searched for a specific ID, we bypass the status filter to be sure we find it
      if (eventNumber) return true;

      const statusFromDesc = (event.eventStatus?.eventStatusDescription || "").trim().toLowerCase();
      const statusFromDirect = (event.eventStatusDescription || "").trim().toLowerCase();
      
      const target1 = "confirmado";
      const target2 = "por confirmar";

      return statusFromDesc === target1 || statusFromDesc === target2 ||
             statusFromDirect === target1 || statusFromDirect === target2;
    });

    console.log(`Events after filtering: ${filteredEvents.length}`);
    if (eventNumber && filteredEvents.length === 0 && allEvents.length > 0) {
      console.log("Note: Event found by ID but might have been filtered if we didn't bypass status check.");
    }

    const events = filteredEvents.map((event: SkillEvent) => ({
      idEvento: event.eventNumber,
      nombre: event.title,
    }));

    return {success: true, events};
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error("Axios error fetching Skill events:", error.response?.data || error.message);
      throw new HttpsError("internal", `Skill API Error: ${error.message}`);
    }
    const err = error as Error;
    console.error("General error fetching Skill events:", err);
    throw new HttpsError("internal", err.message || "Internal Server Error");
  }
});
