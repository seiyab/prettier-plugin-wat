# Development Guide

This document provides instructions for developing `prettier-plugin-wat`.

## Directory Structure

-   `index.ts`: The main entry point for the Prettier plugin. This file should be kept as small as possible.
-   `lib/`: Contains the core logic for the plugin.
    -   `parser/`: The implementation of the WAT parser.
        -   `p.ts`: Domain-agnostic parser utilities.
        -   `wat-*.ts`: Parsers for the WebAssembly Text Format, with files separated according to the structure of the official specification.
    -   `printer.ts`: The main printer implementation.
    -   `printer-*.ts`: It is recommended to separate files for printers for complex (> 7 lines of code for printer) nodes.
-   `tests/`: Contains integration and formatting tests.


## Available Scripts

- `npm run format`: Format code with Prettier.
- `npm run lint`: Check formatting, compile with TypeScript, and lint with ESLint.
- `npm test`: Run tests with Vitest.
- `npm test:update-snapshots`: Update test snapshots.
- `npm run check`: Run all checks (linting and tests).
- `npm run build`: Build the project.

