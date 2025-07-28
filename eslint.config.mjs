// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
	eslint.configs.recommended,
	tseslint.configs.recommendedTypeChecked,
	{
		languageOptions: {
			parserOptions: {
				projectService: true,
				// @ts-expect-error FIXME: resolve dirname
				tsconfigRootDir: import.meta.dirname, // eslint-disable-line @typescript-eslint/no-unsafe-assignment
			},
		},
	},
	{ ignores: ["references/**", "dist/**"] },
);
