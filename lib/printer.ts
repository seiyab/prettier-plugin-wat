import { doc, Printer } from "prettier";

import { WatNode } from "./parser/wat";

const { join, hardline } = doc.builders;

export const print: Printer["print"] = (path, _options, print) => {
	const node: WatNode = path.node; // eslint-disable-line @typescript-eslint/no-unsafe-assignment

	switch (node.type) {
		case "Program":
			return [join(hardline, path.map(print, "body")), hardline];

		case "Module": {
			return "(module)";
		}

		default:
			return "";
	}
};
