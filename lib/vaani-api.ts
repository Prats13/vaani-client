const BASE_URL = process.env.NEXT_PUBLIC_VAANI_API_BASE_URL || 'http://13.233.165.50:8010';
const API_KEY = process.env.NEXT_PUBLIC_VAANI_API_KEY || 'vaani_ai_for_bharat_2026';
const EXOTEL_FROM = process.env.NEXT_PUBLIC_EXOTEL_FROM_NUMBER || '+918048332926';

const API_HEADERS = {
  'Content-Type': 'application/json',
  'X-API-Key': API_KEY,
};

export interface FarmerProfile {
  farmer_id: string;
  phone_number: string;
  name: string;
  state: string;
  district: string;
  village: string;
  pincode: string;
  land_area_acres: number;
  irrigation_type: string;
  preferred_language: string;
  is_profile_complete: boolean;
  primary_crops: string[];
}

export interface OutboundCallResponse {
  status: string;
  call_id: string;
  message: string;
}

/** Convert a 10-digit Indian number to E.164 format */
export function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return phone.startsWith('+') ? phone : `+91${digits}`;
}

/** Returns farmer profile or null if not found (404) */
export async function getFarmer(phoneNumber: string): Promise<FarmerProfile | null> {
  const res = await fetch(`${BASE_URL}/api/v1/farmer/${phoneNumber}`, {
    headers: API_HEADERS,
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Farmer lookup failed: ${res.status}`);
  return res.json();
}

export async function initiateOutboundCall(
  farmerId: string,
  farmerPhone: string,
  agentType: 'farmer_onboarding' | 'farmer_advisory'
): Promise<OutboundCallResponse> {
  const res = await fetch(`${BASE_URL}/api/v1/sip/call/outbound`, {
    method: 'POST',
    headers: API_HEADERS,
    body: JSON.stringify({
      agent_params: {
        farmer_id: farmerId,
        farmer_phone: farmerPhone,
      },
      agent_config: {
        agent_type: agentType,
        stt_config: 'sarvam-saarika-2.5',
        llm_config: 'gemini-2.5-flash',
        tts_config: 'sarvam-bulbul',
      },
      call_config: {
        call_direction: 'outbound',
        call_type: 'pstn',
        call_provider: 'exotel',
        call_from: EXOTEL_FROM,
        call_to: farmerPhone,
      },
    }),
  });
  if (!res.ok) throw new Error(`Call initiation failed: ${res.status}`);
  return res.json();
}
