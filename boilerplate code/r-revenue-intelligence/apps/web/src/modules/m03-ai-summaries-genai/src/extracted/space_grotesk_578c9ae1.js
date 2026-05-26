import cssModule from "@vercel/turbopack-next/internal/font/google/cssmodule.module.css?{%22path%22:%22layout.tsx%22,%22import%22:%22Space_Grotesk%22,%22arguments%22:[{%22subsets%22:[%22latin%22],%22variable%22:%22--font-mono%22}],%22variableName%22:%22spaceGrotesk%22}";
const fontData = {
    className: cssModule.className,
    style: {
        fontFamily: "'Space Grotesk', 'Space Grotesk Fallback'",
        fontStyle: "normal",

    },
};

if (cssModule.variable != null) {
    fontData.variable = cssModule.variable;
}

export default fontData;
