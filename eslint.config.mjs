import js from "@eslint/js";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettier from "eslint-plugin-prettier";
import tseslint from "typescript-eslint";

const eslintConfig = tseslint.config(
    {
        ignores: ["dist", ".next", "node_modules", "coverage"],
    },
    js.configs.recommended,
    ...nextCoreWebVitals,
    ...nextTypescript,
    {
        // Plugins
        plugins: {
            prettier: prettier,
        },
        rules: {
            quotes: ["error", "double"],
            indent: ["error", 4, { SwitchCase: 1 }],
            "max-len": ["error", { code: 150, ignoreStrings: true, ignoreTemplateLiterals: true }],
            "no-console": ["error", { allow: ["warn", "error"] }],
            "react-hooks/exhaustive-deps": "off",
            "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
            "no-unused-vars": "off",
            "prettier/prettier": [
                "error",
                {
                    endOfLine: "auto",
                    tabWidth: 4,
                    printWidth: 150,
                },
            ],
        },
    },
);

export default eslintConfig;
