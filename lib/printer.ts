import { Printer, doc } from "prettier";

export const print: Printer["print"] = (path, options, print) => {
  const node = path.getValue();

  switch (node.type) {
    case "Program":
      return [doc.builders.join(doc.builders.hardline, path.map(print, "body")), doc.builders.hardline];
    case "Module":
      return "(module)";
    default:
      return null;
  }
};
