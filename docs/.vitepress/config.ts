import markdownItCheckBox from "markdown-it-todo-lists";
import { defineConfig } from "vitepress";
import { genSidebarByNavs } from "./sidebar";

const nav = [
  {
    text: "基础语法",
    link: "/base/",
    isAutoGenSidebar: true,
  },
  {
    text: "标准库",
    link: "https://docs.python.org/zh-cn/3.12/library/index.html",
    isAutoGenSidebar: false,
  },
  {
    text: "工具类库",
    link: "/libs/",
    isAutoGenSidebar: true,
  },
  {
    text: "GUI 编程",
    link: "/gui/",
    isAutoGenSidebar: true,
  },
];
const sidebar = genSidebarByNavs(nav);

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: "/",
  title: "Python",
  description: "学习 python 的一些笔记",

  head: [
    ["link", { rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
    ["link", { rel: "icon", type: "image/png", href: "/logo.png" }],
    ["link", { rel: "icon", type: "image/svg+xml", href: "/logo.svg" }],
    ["meta", { name: "og:type", content: "website" }],
    ["meta", { name: "og:locale", content: "zh-CN" }],
    ["meta", { name: "og:site_name", content: "notebook" }],
  ],

  themeConfig: {
    nav,
    sidebar,
    logo: "/logo.svg",
    outline: "deep",

    search: {
      provider: "local",
    },

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/liaohui5",
      },
    ],

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2023-present liaohui5",
    },
  },

  markdown: {
    lineNumbers: true,
    image: {
      lazyLoading: true,
    },
    config: (md) => {
      md.use(markdownItCheckBox);
    },
  },

  vite: {
    optimizeDeps: {
      exclude: ["@nolebase/vitepress-plugin-enhanced-readabilities/client"],
    },
    ssr: {
      noExternal: ["@nolebase/vitepress-plugin-enhanced-readabilities"],
    },
  },
});
