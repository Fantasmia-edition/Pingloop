export interface Message {
  id: string;
  from: "me" | "them";
  text: string;
  sent_at: string;
}

export interface Conversation {
  id: string;
  listing_id: string;
  listing_title: string;
  listing_price: number;
  other_user: string;
  other_user_location: string;
  last_message: string;
  last_message_at: string;
  unread: number;
  messages: Message[];
}

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-1",
    listing_id: "2",
    listing_title: "Tibhar Evolution MX-P · Noir",
    listing_price: 22,
    other_user: "Julien R.",
    other_user_location: "Paris",
    last_message: "C'est toujours dispo ?",
    last_message_at: "2025-01-15T10:32:00",
    unread: 1,
    messages: [
      {
        id: "m1",
        from: "me",
        text: "Bonjour ! Ton Evolution MX-P m'intéresse. C'est toujours dispo ?",
        sent_at: "2025-01-15T10:30:00",
      },
      {
        id: "m2",
        from: "them",
        text: "Oui toujours dispo ! Tu es où ?",
        sent_at: "2025-01-15T10:32:00",
      },
    ],
  },
  {
    id: "conv-2",
    listing_id: "3",
    listing_title: "Butterfly Timo Boll ALC",
    listing_price: 65,
    other_user: "Maryline T.",
    other_user_location: "Bordeaux",
    last_message: "Je te fais 60€ si tu passes le chercher.",
    last_message_at: "2025-01-14T18:05:00",
    unread: 0,
    messages: [
      {
        id: "m3",
        from: "me",
        text: "Bonjour Maryline, le bois est toujours disponible ?",
        sent_at: "2025-01-14T17:50:00",
      },
      {
        id: "m4",
        from: "them",
        text: "Oui ! Il est en très bon état, quelques micro-rayures sur la tranche mais le jeu est parfait.",
        sent_at: "2025-01-14T17:55:00",
      },
      {
        id: "m5",
        from: "me",
        text: "Tu peux faire un effort sur le prix ? 60€ ça m'irait bien.",
        sent_at: "2025-01-14T18:00:00",
      },
      {
        id: "m6",
        from: "them",
        text: "Je te fais 60€ si tu passes le chercher.",
        sent_at: "2025-01-14T18:05:00",
      },
    ],
  },
];
