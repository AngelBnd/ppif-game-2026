import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
                noto : ['NotoCustom', "sans-serif"],
                arsenal : ["Arsenal", "sans-serif"]
            },

            colors: {
                // Taken from the Figma "Background colors" token (Linear Gradient)
                "surface-red": "#320005",
                "surface-dark": "#0F0F0F",
            },

            backgroundImage: {
                "surface-gradient":
                    "linear-gradient(180deg, #320005 0%, #0F0F0F 100%)",
            },

            keyframes: {
                "persona-in": {
                    "0%": {
                        opacity: "0",
                        transform: "scale(1.5) rotate(-12deg) skewX(-8deg)",
                        filter: "brightness(3.5) contrast(1.6)",
                    },
                    "45%": {
                        opacity: "1",
                        transform: "scale(0.92) rotate(5deg) skewX(3deg)",
                        filter: "brightness(1.3) contrast(1.1)",
                    },
                    "70%": {
                        transform: "scale(1.05) rotate(-2deg) skewX(-1deg)",
                        filter: "brightness(1)",
                    },
                    "100%": {
                        opacity: "1",
                        transform: "scale(1) rotate(0deg) skewX(0deg)",
                        filter: "brightness(1)",
                    },
                },
            },

            animation: {
                "persona-in": "persona-in 0.6s cubic-bezier(.19,1.6,.4,1) both",
            },
        },
    },

    plugins: [forms],
};