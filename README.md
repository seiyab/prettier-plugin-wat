# prettier-plugin-wat

> **Note**
> This plugin is currently in alpha. It may not support all WebAssembly Text Format syntax yet.

This is a Prettier plugin for the WebAssembly Text Format (`.wat`).

## Installation

Install Prettier and the plugin:

```bash
npm install --save-dev prettier prettier-plugin-wat
```

## Usage

Create a `.prettierrc` file in your project root and add the plugin:

```json
{
  "plugins": ["prettier-plugin-wat"]
}
```

Then you can format your `.wat` files:

```bash
npx prettier --write your-file.wat
```

## Development

See [DEVELOPMENT.md](./DEVELOPMENT.md) for details on how to develop this plugin.

## License

[MIT](./LICENSE)

