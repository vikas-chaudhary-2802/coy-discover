/**
 * Seed data for the demo.
 *
 * `likedMe: true` marks profiles that have *already* liked the logged-in user,
 * so a right-swipe on them produces an instant match during a demo.
 *
 * Privacy note: this flag only lives in seed data and in the `swipes` table.
 * It is never sent to the client, and the feed order (`rank`) is a fixed
 * curated order that does not depend on it, so the UI cannot infer who liked you.
 */

export interface SeedProfile {
  id: string;
  name: string;
  age: number;
  photo: string;
  bio: string;
  location: string;
  interests: string[];
  likedMe?: boolean;
}

export interface SeedData {
  me: SeedProfile;
  profiles: SeedProfile[];
}

/** Free-licence Unsplash portraits, pre-cropped to the card's aspect ratio around the face. */
const u = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=900&h=1200&fit=crop&crop=faces&auto=format&q=75`;

export const ME: SeedProfile = {
  id: "me",
  name: "You",
  age: 22,
  photo: "",
  bio: "",
  location: "Gurgaon",
  interests: [],
};

export const PROFILES: SeedProfile[] = [
  { id: "p01", name: "Aanya", age: 21, photo: u("1624610806209-82a4cbb4339a"), location: "Miranda House, DU", bio: "Will judge you by your chai order. Kadak only.", interests: ["Poetry", "Chai", "Indie music"] },
  { id: "p02", name: "Kabir", age: 23, photo: u("1758561274313-536bf1c4192c"), location: "Cyber City, Gurgaon", bio: "Product designer by day, terrible guitarist by night.", interests: ["Design", "Guitar", "Cycling"], likedMe: true },
  { id: "p03", name: "Ishita", age: 22, photo: u("1776440553775-75fc7e32abf7"), location: "IIT Delhi", bio: "Debugging code and my sleep schedule. Mostly failing at both.", interests: ["Coding", "Badminton", "Anime"] },
  { id: "p04", name: "Arjun", age: 24, photo: u("1790575188672-ee8d9d4e1c18"), location: "Hauz Khas, Delhi", bio: "Looking for someone to split momos and playlists with.", interests: ["Food walks", "Spotify", "Football"] },
  { id: "p05", name: "Meera", age: 20, photo: u("1764740185159-7bbfe02caa7a"), location: "LSR, DU", bio: "Debate team captain. I will win the argument about pineapple pizza.", interests: ["Debating", "Pizza", "Theatre"], likedMe: true },
  { id: "p06", name: "Vihaan", age: 22, photo: u("1577860756464-3e84ec40c04c"), location: "DTU, Delhi", bio: "Building a startup that my mom still calls a hobby.", interests: ["Startups", "F1", "Podcasts"] },
  { id: "p07", name: "Saanvi", age: 23, photo: u("1761125135368-f13b3a427631"), location: "Golf Course Road, Gurgaon", bio: "Sunrise runner. Sunset photographer. Midnight snacker.", interests: ["Running", "Photography", "Baking"] },
  { id: "p08", name: "Rohan", age: 21, photo: u("1712425718137-491250cfde88"), location: "SRCC, DU", bio: "Finance bro with a soft spot for Ghazals.", interests: ["Markets", "Ghazals", "Cricket"], likedMe: true },
  { id: "p09", name: "Diya", age: 22, photo: u("1658724683859-7f366527255d"), location: "Ashoka University", bio: "Half philosophy major, half golden retriever.", interests: ["Philosophy", "Dogs", "Journaling"] },
  { id: "p10", name: "Aditya", age: 25, photo: u("1593793439372-634665494332"), location: "Sector 29, Gurgaon", bio: "I know every good dhaba between Delhi and Jaipur.", interests: ["Road trips", "Food", "Cars"] },
  { id: "p11", name: "Tara", age: 21, photo: u("1663576139885-7e50517c75d3"), location: "NIFT Delhi", bio: "I'll design your outfit and your vibe.", interests: ["Fashion", "Thrifting", "Art"] },
  { id: "p12", name: "Karan", age: 23, photo: u("1658950125308-54d89022b25d"), location: "IIIT Delhi", bio: "Competitive programmer, competitive about board games too.", interests: ["CP", "Board games", "Chess"], likedMe: true },
  { id: "p13", name: "Nisha", age: 24, photo: u("1728141123512-87c415cecc9d"), location: "Saket, Delhi", bio: "Plant mom of 23. Looking for plant dad.", interests: ["Plants", "Yoga", "Cafés"] },
  { id: "p14", name: "Aryan", age: 22, photo: u("1633754463077-503ab07cdd23"), location: "Amity, Noida", bio: "Gym at 6, memes at 6:05.", interests: ["Fitness", "Memes", "Basketball"] },
  { id: "p15", name: "Riya", age: 22, photo: u("1747264464928-9795abf30a29"), location: "St. Stephen's, DU", bio: "3rd floor library regular. Say hi, quietly.", interests: ["Books", "Classical music", "Museums"], likedMe: true },
  { id: "p16", name: "Dev", age: 24, photo: u("1645114292307-e9f847b6bb4d"), location: "DLF Phase 3, Gurgaon", bio: "Stand-up comic in training. Laugh at my jokes, I'll laugh at yours.", interests: ["Comedy", "Open mics", "Biryani"] },
  { id: "p17", name: "Ananya", age: 20, photo: u("1659463034333-b9f5bad5b78d"), location: "Hindu College, DU", bio: "Can recite all of DDLJ. Please don't test me.", interests: ["Bollywood", "Dance", "Karaoke"] },
  { id: "p18", name: "Siddharth", age: 23, photo: u("1649738463288-fc499fe96608"), location: "NSUT, Delhi", bio: "Trekking > clubbing. Fight me (gently).", interests: ["Trekking", "Camping", "Stargazing"] },
  { id: "p19", name: "Kavya", age: 23, photo: u("1787072623435-3dcb7754fd75"), location: "Sohna Road, Gurgaon", bio: "Data analyst who turns your texts into a bar chart.", interests: ["Data", "Sudoku", "Coffee"], likedMe: true },
  { id: "p20", name: "Yash", age: 21, photo: u("1577898298765-eff2c928f94c"), location: "Ramjas, DU", bio: "Drummer. I'll keep the rhythm if you keep the conversation.", interests: ["Drums", "Jazz", "Vinyl"] },
  { id: "p21", name: "Pooja", age: 25, photo: u("1636007549777-72ffbb4b94df"), location: "Vasant Kunj, Delhi", bio: "Doctor in residency. If I reply late, I'm saving lives.", interests: ["Medicine", "Swimming", "True crime"] },
  { id: "p22", name: "Neel", age: 22, photo: u("1747374135959-9291ba69215e"), location: "IIT Delhi", bio: "Robotics club. My robot is more social than me.", interests: ["Robotics", "Sci-fi", "Lego"] },
  { id: "p23", name: "Zoya", age: 21, photo: u("1729918925543-61c1ccd878b2"), location: "Jamia Millia Islamia", bio: "Urdu poetry and late-night Old Delhi food runs.", interests: ["Shayari", "Street food", "Calligraphy"], likedMe: true },
  { id: "p24", name: "Rahul", age: 26, photo: u("1636470361279-5d983762cbfb"), location: "MG Road, Gurgaon", bio: "Consultant who actually takes weekends off.", interests: ["Tennis", "Wine", "Travel"] },
  { id: "p25", name: "Myra", age: 22, photo: u("1725033489648-a819750348eb"), location: "Ashoka University", bio: "Environmental science nerd. I will make you recycle.", interests: ["Sustainability", "Hiking", "Birding"] },
  { id: "p26", name: "Kunal", age: 23, photo: u("1670260482483-adc4fade4fb8"), location: "Gurgaon", bio: "Home chef. My butter chicken has a fan club.", interests: ["Cooking", "Cricket", "Netflix"] },
  { id: "p27", name: "Sneha", age: 24, photo: u("1615965763777-785b2b0e9162"), location: "Noida", bio: "UX researcher. I'll ask you 'why' five times.", interests: ["UX", "Pottery", "Travel"], likedMe: true },
  { id: "p28", name: "Ishaan", age: 21, photo: u("1577860694824-92bb5a985a7b"), location: "Kirori Mal, DU", bio: "Theatre kid who never left the stage.", interests: ["Theatre", "Film", "Poetry slams"] },
  { id: "p29", name: "Aditi", age: 23, photo: u("1536766768598-e09213fdcf22"), location: "Galleria Market, Gurgaon", bio: "Brunch enthusiast. Will rate every café in Gurgaon.", interests: ["Brunch", "Pilates", "Podcasts"] },
  { id: "p30", name: "Varun", age: 24, photo: u("1717135513958-c4d8edaa1b48"), location: "Dwarka, Delhi", bio: "Marathoner. Slow at texting, fast at 10Ks.", interests: ["Marathons", "Nutrition", "Audiobooks"] },
  { id: "p31", name: "Naina", age: 22, photo: u("1632718580326-e5d20d749316"), location: "IP University", bio: "Indie filmmaker. You might end up in my next short.", interests: ["Filmmaking", "Editing", "Cinema"], likedMe: true },
  { id: "p32", name: "Samar", age: 22, photo: u("1717665554058-7a83e4d238ff"), location: "Sector 56, Gurgaon", bio: "Gamer, but I touch grass on weekends.", interests: ["Gaming", "Football", "Lo-fi"] },
];

export const DEFAULT_SEED: SeedData = { me: ME, profiles: PROFILES };
