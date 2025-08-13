export const CATEGORIES = ["houshold", "sports & Outdoor", "Electronics", "Merch", "Other"] as const;

export type Category = typeof CATEGORIES[number];

export type Product = {
  id: number | string; // Support both numeric IDs (mock data) and string UUIDs (database)
  name: string;
  price: number; // Points for display
  category: Category;
  image: string; // primary image
  images?: string[]; // optional gallery
  description?: string;
};

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Smart Home Bundle",
    price: 2499,
    category: "Electronics",
    image: "/lovable-uploads/427ae857-5ebc-4643-b323-7c4cb576bf99.png",
    images: [
      "/lovable-uploads/427ae857-5ebc-4643-b323-7c4cb576bf99.png",
      "/lovable-uploads/427ae857-5ebc-4643-b323-7c4cb576bf99.png",
      "/lovable-uploads/427ae857-5ebc-4643-b323-7c4cb576bf99.png",
    ],
    description:
      "Complete smart home setup with voice assistant and smart bulbs. Transform your living space.",
  },
  {
    id: 2,
    name: "Wireless Headphones",
    price: 1999,
    category: "Electronics",
    image: "/lovable-uploads/06a3677e-b059-4811-b010-76076d6832e3.png",
    images: [
      "/lovable-uploads/06a3677e-b059-4811-b010-76076d6832e3.png",
      "/lovable-uploads/06a3677e-b059-4811-b010-76076d6832e3.png",
      "/lovable-uploads/06a3677e-b059-4811-b010-76076d6832e3.png",
    ],
    description: "Premium wireless headphones with noise cancellation and long battery life.",
  },
  {
    id: 3,
    name: "Kitchen Essentials Set",
    price: 1499,
    category: "houshold",
    image: "/lovable-uploads/f65156fb-b5c8-4be8-9219-bb594e8f65eb.png",
    images: [
      "/lovable-uploads/f65156fb-b5c8-4be8-9219-bb594e8f65eb.png",
      "/lovable-uploads/f65156fb-b5c8-4be8-9219-bb594e8f65eb.png",
      "/lovable-uploads/f65156fb-b5c8-4be8-9219-bb594e8f65eb.png",
    ],
    description: "Essential kitchen tools and gadgets for everyday cooking needs.",
  },
  {
    id: 4,
    name: "Brand Cap",
    price: 1200,
    category: "Merch",
    image: "/placeholder.svg",
    images: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg"],
    description: "Classic cap with brand logo. One size fits most.",
  },
  {
    id: 5,
    name: "Gift Card 2500 Points",
    price: 2500,
    category: "Other",
    image: "/placeholder.svg",
    images: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg"],
    description: "Share the love. Digital delivery, redeemable on the shop.",
  },
  {
    id: 6,
    name: "Portable Speaker",
    price: 999,
    category: "Electronics",
    image: "/lovable-uploads/427ae857-5ebc-4643-b323-7c4cb576bf99.png",
    images: [
      "/lovable-uploads/427ae857-5ebc-4643-b323-7c4cb576bf99.png",
      "/lovable-uploads/427ae857-5ebc-4643-b323-7c4cb576bf99.png",
      "/lovable-uploads/427ae857-5ebc-4643-b323-7c4cb576bf99.png",
    ],
    description: "Compact bluetooth speaker with powerful sound and waterproof design.",
  },
  {
    id: 7,
    name: "Camping Gear Set",
    price: 2999,
    category: "sports & Outdoor",
    image: "/lovable-uploads/06a3677e-b059-4811-b010-76076d6832e3.png",
    images: [
      "/lovable-uploads/06a3677e-b059-4811-b010-76076d6832e3.png",
      "/lovable-uploads/06a3677e-b059-4811-b010-76076d6832e3.png",
      "/lovable-uploads/06a3677e-b059-4811-b010-76076d6832e3.png",
    ],
    description: "Complete camping kit with tent, sleeping bag, and essential gear.",
  },
  {
    id: 8,
    name: "Home Cleaning Kit",
    price: 1850,
    category: "houshold",
    image: "/lovable-uploads/f65156fb-b5c8-4be8-9219-bb594e8f65eb.png",
    images: [
      "/lovable-uploads/f65156fb-b5c8-4be8-9219-bb594e8f65eb.png",
      "/lovable-uploads/f65156fb-b5c8-4be8-9219-bb594e8f65eb.png",
      "/lovable-uploads/f65156fb-b5c8-4be8-9219-bb594e8f65eb.png",
    ],
    description: "Professional-grade cleaning supplies for a spotless home.",
  },
  {
    id: 9,
    name: "Brand T-Shirt",
    price: 1600,
    category: "Merch",
    image: "/placeholder.svg",
    images: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg"],
    description: "Soft cotton tee with modern fit and brand logo.",
  },
];
