# Vaani Client — Frontend Integration Guide

> **For backend team / backend Claude:** This document explains exactly how the frontend works, what it expects from the backend, and the contracts you need to implement.

---

## What this is

A Next.js 15 web app that serves as the browser-based UI for the Vaani farmer advisory system.

Built on top of LiveKit's agent-starter-react template. Farmers interact through a **WhatsApp-style chat interface** connected to a LiveKit room.

---

## App Flow

```
User opens app
    ↓
Phone number entry (10-digit Indian mobile)
    ↓
GET /api/v1/farmer/{phone}  →  Backend
    ↓
Not registered?             Registered?
    ↓                           ↓
POST /api/v1/sip/call/outbound  Connect to LiveKit room
(farmer_onboarding)             (farmer phone = participant identity)
    ↓                           ↓
"Vaani will call you"       WhatsApp chat UI
                                ↓
                        User speaks/types/sends images
                                ↓
                        Agent responds via LiveKit
```

---

## Backend API Contracts

### Base URL
```
http://13.233.165.50:8010
```

### Auth header (required on every request)
```
X-API-Key: vaani_ai_for_bharat_2026
```

---

### 1. Farmer Lookup — `GET /api/v1/farmer/{phone_number}`

Called on every login. Phone is in E.164 format (`+91XXXXXXXXXX`).

**Response — farmer found and complete:**
```json
{
  "farmer_id": "uuid",
  "phone_number": "+919876543210",
  "name": "Ramesh Kumar",
  "state": "Uttar Pradesh",
  "district": "Lucknow",
  "village": "Mohanlalganj",
  "pincode": "226301",
  "land_area_acres": 3.5,
  "irrigation_type": "rainfed",
  "preferred_language": "hindi",
  "is_profile_complete": true,
  "primary_crops": ["wheat", "paddy"]
}
```

**Response — not found:**
```json
{ "detail": "Farmer not found" }
```
HTTP 404.

**Frontend behaviour:**
- `is_profile_complete: true` → connect to LiveKit chat
- `is_profile_complete: false` OR 404 → trigger onboarding PSTN call

---

### 2. Outbound Call — `POST /api/v1/sip/call/outbound`

Triggered for both onboarding and advisory flows. Fire-and-forget — no polling needed.

**Onboarding call (new farmer):**
```json
{
  "agent_params": {
    "farmer_id": "new_farmer",
    "farmer_phone": "+91XXXXXXXXXX"
  },
  "agent_config": {
    "agent_type": "farmer_onboarding",
    "stt_config": "sarvam-saarika-2.5",
    "llm_config": "gemini-2.5-flash",
    "tts_config": "sarvam-bulbul"
  },
  "call_config": {
    "call_direction": "outbound",
    "call_type": "pstn",
    "call_provider": "exotel",
    "call_from": "+918048332926",
    "call_to": "+91XXXXXXXXXX"
  }
}
```

**Advisory call (registered farmer):**
Same structure but:
- `farmer_id`: the farmer's UUID from the DB
- `agent_type`: `"farmer_advisory"`

**Expected response:**
```json
{
  "status": "initiated",
  "call_id": "...",
  "message": "Outbound call initiated"
}
```

---

## LiveKit Session — Participant Identity

When a registered farmer connects via browser, the frontend generates a LiveKit token using:

```
participantIdentity = "farmer_{digits}"    e.g. "farmer_919876543210"
participantName     = "+91XXXXXXXXXX"      (E.164 phone)
roomName            = "vaani_room_{digits}"
```

**The backend agent can read `participantIdentity` or `participantName` from the LiveKit room to identify which farmer is in the session.** No need for any separate session parameter — the phone is baked into the identity.

Token is generated at `POST /api/token` on the Next.js server (uses `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET`).

---

## CTA Message Protocol — Critical for Agent

The frontend supports a special **CTA (Call-To-Action) message type** rendered as tappable button pills inside the agent's chat bubble.

To send CTAs, the backend agent must send a **chat message** (via LiveKit data channel) in this exact JSON format:

```json
{
  "vaani_cta": true,
  "message": "How can I help you today?",
  "buttons": ["Newsletter", "Know Your Crop"]
}
```

**Rules:**
- `vaani_cta: true` — required flag, triggers CTA rendering
- `message` — helper text shown above the buttons (can be empty string)
- `buttons` — array of strings, each becomes a tappable pill button

When the farmer taps a button, the frontend sends that button's label as a plain text chat message back to the agent. Example: tapping `"Know Your Crop"` → agent receives `"Know Your Crop"` as a user text message.

**If the message is not valid JSON with `vaani_cta: true`, it is rendered as plain text.**

### Example CTA flows to implement

**On session start (registered farmer):**
```json
{
  "vaani_cta": true,
  "message": "Namaste Ramesh ji! How can I help you today?",
  "buttons": ["Newsletter", "Know Your Crop"]
}
```

**After farmer clicks "Know Your Crop":**
```json
{
  "vaani_cta": true,
  "message": "How can I assist you with your crop today?",
  "buttons": ["Ask Me Anything", "Monday Info", "Back to Home"]
}
```

**After farmer clicks "Newsletter":**
```json
{
  "vaani_cta": true,
  "message": "Choose the updates you want to receive.",
  "buttons": ["Local News", "National News", "Government Schemes", "Back to Home"]
}
```

**"Back to Home" always returns to the main menu** — send the Home CTA again.

---

## Input Types the Frontend Supports

The farmer can send:

| Input | How it arrives at agent |
| --- | --- |
| **Text** | Plain string via LiveKit chat |
| **Voice** | Live audio track via LiveKit (agent hears directly) |
| **Image** | Rendered locally in chat, currently no upload pipeline to backend — to be wired |
| **PDF** | Same as image — local only for now |
| **CTA button tap** | Plain text string via LiveKit chat |

---

## Environment Variables Required

Create `.env.local` from `.env.example`:

```env
# LiveKit credentials
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
LIVEKIT_URL=wss://your-project.livekit.cloud

# Agent dispatch (leave blank for automatic dispatch)
AGENT_NAME=

# Vaani backend
NEXT_PUBLIC_VAANI_API_BASE_URL=http://13.233.165.50:8010
NEXT_PUBLIC_VAANI_API_KEY=vaani_ai_for_bharat_2026
NEXT_PUBLIC_EXOTEL_FROM_NUMBER=+918048332926
```

---

## Running Locally

```bash
pnpm install
pnpm dev
```

Opens at `http://localhost:3000`.

---

## Project Structure (relevant files)

```
vaani-client/
├── app/
│   ├── api/token/route.ts          # LiveKit token endpoint — accepts phone_number in body
│   ├── layout.tsx                  # Root layout — Vaani branding
│   └── page.tsx                    # Entry point
├── components/app/
│   ├── app.tsx                     # Phase state machine: entry → onboarding | chat
│   ├── phone-entry-view.tsx        # Phone number input, farmer lookup
│   ├── onboarding-pending-view.tsx # Triggers PSTN call, "Vaani will call you" screen
│   ├── view-controller.tsx         # Auto-connects to LiveKit, spinner while connecting
│   ├── chat-view.tsx               # WhatsApp UI — CTA JSON parsing, farmer name in header
│   ├── chat-message-bubble.tsx     # Renders: text | cta | image | pdf | voice-note
│   └── chat-input-bar.tsx          # Text input, mic, attach (image/pdf/camera)
├── lib/
│   └── vaani-api.ts                # getFarmer(), initiateOutboundCall(), toE164()
└── misc/                           # Product docs (conversation flow, agent framework, etc.)
```

---

## What the Backend Needs to Ensure

1. **`GET /api/v1/farmer/{phone}`** — farmer lookup by E.164 phone (returns profile or 404)
2. **`POST /api/v1/sip/call/outbound`** — outbound PSTN call endpoint (already built)
3. **CORS** — `allow_origins: ["*"]` so the browser can hit the API directly
4. **LiveKit agent reads participant identity** to know which farmer is in the room (`farmer_{digits}`)
5. **Agent sends CTAs as JSON chat messages** matching the `vaani_cta` protocol above
6. **Agent handles plain text replies** from CTA button taps (e.g. `"Know Your Crop"`)

---

## Notes

- Phone numbers are always E.164 (`+91XXXXXXXXXX`). Frontend converts 10-digit input automatically.
- The outbound call API is fire-and-forget. No WebSocket or polling from frontend.
- The web chat (LiveKit) and the PSTN call (Exotel) are two separate channels. Web chat is for registered farmers; PSTN is for onboarding only.
- Image and PDF uploads are rendered locally in the chat UI — the actual file upload pipeline to the backend needs to be wired separately when ready.