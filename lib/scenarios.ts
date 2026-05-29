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
        type: "text",
        role: "user",
        sender: "Taylor",
        text: "I need a hotel near Times Square for this weekend.",
      },
      {
        id: "s1-2",
        type: "text",
        role: "bot",
        sender: "bot",
        text: "Great choice! Here are top-rated options near Times Square available this weekend.",
      },
      {
        id: "s1-3",
        type: "products",
        items: [
          { img: "", name: "The Manhattan Hotel", sub: "$189 / night", cta: "Book now" },
          { img: "", name: "Times Square Inn",    sub: "$145 / night", cta: "Book now" },
        ],
      },
      {
        id: "s1-4",
        type: "actions",
        buttons: ["Check availability", "See more options"],
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
        type: "text",
        role: "user",
        sender: "Jordan",
        text: "Where's my order #4821? It was supposed to arrive yesterday.",
      },
      {
        id: "s2-2",
        type: "text",
        role: "bot",
        sender: "bot",
        text: "I found your order. It's out for delivery and should arrive by 6 PM today. There was a 1-day delay due to high demand — sorry about that!",
      },
      {
        id: "s2-3",
        type: "actions",
        buttons: ["Track on map", "Change delivery time", "Contact courier"],
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
        type: "text",
        role: "user",
        sender: "Alex",
        text: "I need to dispute a charge on my account. This is urgent.",
      },
      {
        id: "s3-2",
        type: "text",
        role: "bot",
        sender: "bot",
        text: "I understand — billing disputes need immediate attention. I'll connect you with a specialist right away. Average wait time is under 2 minutes.",
      },
      {
        id: "s3-3",
        type: "actions",
        buttons: ["Connect to agent", "Schedule callback"],
      },
    ],
  },
];
