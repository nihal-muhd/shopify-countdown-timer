import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { gzipSync } from "zlib";
import * as esbuild from "esbuild";

const outputFile = fileURLToPath(
  new URL("../extensions/countdown-timer/assets/countdown.js", import.meta.url)
);

const buildOptions = {
  entryPoints: [fileURLToPath(new URL("./src/index.jsx", import.meta.url))],
  outfile: outputFile,
  bundle: true,
  minify: true,
  format: "iife",
  target: ["es2018"],
  jsx: "automatic",
  jsxImportSource: "preact",
  loader: { ".css": "text" },
  legalComments: "none",
  logLevel: "info",
};

function reportBundleSize() {
  const bundle = readFileSync(outputFile);
  const toKilobytes = (bytes) => (bytes / 1024).toFixed(2);
  console.log(
    `countdown.js: ${toKilobytes(bundle.length)} KB minified, ${toKilobytes(gzipSync(bundle).length)} KB gzipped`
  );
}

if (process.argv.includes("--watch")) {
  const context = await esbuild.context(buildOptions);
  await context.watch();
  console.log("Watching widget/src for changes...");
} else {
  await esbuild.build(buildOptions);
  reportBundleSize();
}
