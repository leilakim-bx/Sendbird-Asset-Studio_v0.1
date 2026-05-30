import type { ChatMessage } from "./store";

export type Scenario = {
  id: string;
  title: string;
  subtitle: string;
  messages: ChatMessage[];
};

export const SCENARIOS: Scenario[] = [
  {
    id: "hotel-concierge",
    title: "Hotel concierge",
    subtitle: "Premium booking",
    messages: [
      {
        id: "s1-1",
        role: "user",
        sender: "Taylor",
        block: { type: "text", text: "I'd like a room with a city view for Friday–Sunday. Two guests." },
      },
      {
        id: "s1-2",
        role: "bot",
        sender: "bot",
        block: { type: "text", text: "Perfect timing — I have two city-view rooms available this weekend. Both include complimentary breakfast." },
      },
      {
        id: "s1-3",
        role: "bot",
        sender: "bot",
        block: {
          type: "products",
          items: [
            { img: "", name: "Deluxe City View",  sub: "$249 / night", cta: "Reserve" },
            { img: "", name: "Premium Suite",     sub: "$389 / night", cta: "Reserve" },
          ],
        },
      },
      {
        id: "s1-4",
        role: "bot",
        sender: "bot",
        block: { type: "actions", buttons: ["Add early check-in", "Request airport pickup"] },
      },
    ],
  },
  {
    id: "order-tracking",
    title: "Order tracking",
    subtitle: "Delivery status",
    messages: [
      {
        id: "s2-1",
        role: "user",
        sender: "Jordan",
        block: { type: "text", text: "Hey, where's my order #ORD-8821? It was supposed to arrive today." },
      },
      {
        id: "s2-2",
        role: "bot",
        sender: "bot",
        block: { type: "text", text: "Your package is 4 stops away — estimated delivery by 5:30 PM. The driver left the sorting hub at 2:14 PM." },
      },
      {
        id: "s2-3",
        role: "bot",
        sender: "bot",
        block: { type: "actions", buttons: ["Live tracking", "Change delivery address", "Leave at door"] },
      },
    ],
  },
  {
    id: "agent-handoff",
    title: "Agent handoff",
    subtitle: "AI → human",
    messages: [
      {
        id: "s3-1",
        role: "user",
        sender: "Alex",
        block: { type: "text", text: "I need to dispute a charge on my account. This is urgent." },
      },
      {
        id: "s3-2",
        role: "bot",
        sender: "bot",
        block: { type: "text", text: "I understand — billing disputes need immediate attention. I'll connect you with a specialist right away. Average wait time is under 2 minutes." },
      },
      {
        id: "s3-3",
        role: "bot",
        sender: "bot",
        block: { type: "actions", buttons: ["Connect to agent", "Schedule callback"] },
      },
    ],
  },
];
