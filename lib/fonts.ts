import { Roboto, Roboto_Slab } from "next/font/google";

export const roboto = Roboto({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

export const robotoSlab = Roboto_Slab({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600", "700"],
  variable: "--font-roboto-slab",
  display: "swap",
});

export const fontClasses = `${roboto.variable} ${robotoSlab.variable}`;
