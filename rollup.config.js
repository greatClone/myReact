import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { terser } from "rollup-plugin-terser";
import prettier from "rollup-plugin-prettier";
import { babel } from "@rollup/plugin-babel";

// `npm run build` -> `production` is true
// `npm run dev` -> `production` is false
const production = !process.env.ROLLUP_WATCH;

export default {
  input: "src/index.js",
  output: {
    file: "public/bundle.js",
    format: "iife", // immediately-invoked function expression — suitable for <script> tags
    sourcemap: true,
  },
  plugins: [
    prettier({
      // 一行最多 120 字符
      printWidth: 120,
      // 使用 2 个空格缩进
      tabWidth: 2,
      // 不使用缩进符，而使用空格
      useTabs: false,
      // 行尾需要有分号
      semi: true,
      // 使用单引号
      singleQuote: true,
      // 对象的 key 仅在必要时用引号
      quoteProps: "as-needed",
      // jsx 不使用单引号，而使用双引号
      jsxSingleQuote: false,
      // 末尾需要有逗号
      trailingComma: "all",
      // 大括号内的首尾需要空格
      bracketSpacing: true,
      // jsx 标签的反尖括号需要换行
      bracketSameLine: false,
      // 箭头函数，只有一个参数的时候，也需要括号
      arrowParens: "always",
      // 每个文件格式化的范围是文件的全部内容
      rangeStart: 0,
      rangeEnd: Infinity,
      // 不需要写文件开头的 @prettier
      requirePragma: false,
      // 不需要自动在文件开头插入 @prettier
      insertPragma: false,
      // 使用默认的折行标准
      proseWrap: "preserve",
      // 根据显示样式决定 html 要不要折行
      htmlWhitespaceSensitivity: "css",
      // vue 文件中的 script 和 style 内不用缩进
      vueIndentScriptAndStyle: false,
      // 换行符使用 auto
      endOfLine: "auto",
      // 格式化嵌入的内容
      embeddedLanguageFormatting: "auto",
    }),
    babel({ babelHelpers: "bundled" }),
    resolve(), // tells Rollup how to find date-fns in node_modules
    commonjs(), // converts date-fns to ES modules
    production && terser(), // minify, but only in production
  ],
};
