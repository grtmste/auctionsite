// NOTE: do NOT import "@uploadthing/react/styles.css". It ships a full Tailwind
// v3 bundle (its own `.hidden`, `*` resets, responsive utilities) that clobbers
// this app's Tailwind v4 utilities wherever it loads — and the offer modal puts
// a dropzone in the header, so it would load site-wide. The dropzones are
// styled entirely via the `appearance` prop instead.
import {
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();
