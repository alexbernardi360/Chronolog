/** @type {import('tailwindcss').Config} */
export const content = ["./src/**/*.{html,ts}"];
export const theme = { extend: {} };
export const plugins = [require("daisyui")];
export const daisyui = { themes: ["light", "dark"] }

