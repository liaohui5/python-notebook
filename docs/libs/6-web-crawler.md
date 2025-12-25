## 什么是爬虫?

简单来说, 爬虫就是自动浏览互联网上的网页, 然后获取所需数据的一种程序

### 爬虫的主要实现方式

1. 直接发送HTTP请求 + 解析xml结构 => 获取所需数据
2. 控制浏览器程序发送请求(模拟人使用浏览器) => 获取所需数据

| 方式             | 优点       | 缺点                                              |
| :--------------- | :--------- | :------------------------------------------------ |
| 发送请求+解析xml | 速度快     | 无法爬取 SPA 网页的数据, 容易被是被, 然后限制反爬 |
| 控制浏览器       | 速度相对慢 | 完全模拟人类操作浏览器,不容易被识别               |

## requests + lxml + pyquery

### 发送请求: requests/urllib

### 解析XML结构: lxml + pyquery

## playwrite

- [playwrite](https://playwright.nodejs.cn/)
- [selenium](https://www.runoob.com/selenium/selenium-tutorial.html)
- [puppeteer](https://pptr.nodejs.cn/)

三个都可以控制浏览器, 但是首推: `playwrite` 它同时支持 `js/ts/python`, 而且资料比较齐全,
其次推荐 `selenium`, 它可以兼容老旧 IE 浏览器, 这是 playwright 做不到的
`puppeteer` 可以作为了解, 他的速度可能比 `playwright` 快一些, 但是社区不够健壮, 功能有限
