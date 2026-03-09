// src/app/fonts.ts
import localFont from "next/font/local";

export const acrom = localFont({
    src: [
        {
            path: "../../public/fonts/Acrom-Thin.woff2",
            weight: "100",
            style: "normal",
        },
        {
            path: "../../public/fonts/Acrom-Light.woff2",
            weight: "300",
            style: "normal",
        },
        {
            path: "../../public/fonts/Acrom-Regular.woff2",
            weight: "400",
            style: "normal",
        },
        {
            path: "../../public/fonts/Acrom-Medium.woff2",
            weight: "500",
            style: "normal",
        },
        {
            path: "../../public/fonts/Acrom-Bold.woff2",
            weight: "700",
            style: "normal",
        },
    ],
    variable: "--font-acrom",
    display: "swap",
    preload: true,
});