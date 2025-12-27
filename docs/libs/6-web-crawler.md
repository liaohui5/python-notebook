## 什么是爬虫?

简单来说, 爬虫就是自动浏览互联网上的网页, 然后获取所需数据的一种程序

### 爬虫的主要实现方式

1. 直接发送HTTP请求 + 解析xml结构 => 获取所需数据
2. 控制浏览器程序发送请求(模拟人使用浏览器) => 获取所需数据

| 方式             | 优点       | 缺点                                              |
| :--------------- | :--------- | :------------------------------------------------ |
| 发送请求+解析xml | 速度快     | 无法爬取 SPA 网页的数据, 容易被识别, 然后限制反爬 |
| 控制浏览器       | 速度相对慢 | 完全模拟人类操作浏览器, 不容易被识别              |

三个都可以控制浏览器, 但是首推: `playwrite` 它同时支持 `js/ts/python`, 而且资料比较齐全,
其次推荐 `selenium`, 它可以兼容老旧 IE 浏览器, 这是 playwright 做不到的
`puppeteer` 可以作为了解, 他的速度可能比 `playwright` 快一些, 但是社区不够健壮, 功能有限

### 发送 HTTP 请求

| 名称     | 链接                                                                  | 是否支持异步 |
| :------- | :-------------------------------------------------------------------- | :----------- |
| urlib    | 内置模块: https://docs.python.org/zh-cn/3/library/urllib.request.html | NO           |
| requests | https://github.com/psf/requests                                       | NO           |
| aiohttp  | https://github.com/aio-libs/aiohttp                                   | YES          |
| httpx    | https://github.com/encode/httpx                                       | YES          |

### 解析XML结构

- [lxml](https://github.com/lxml/lxml) 将文档字符串解析为 python 对象(dom 树), 方便遍历和操作
- [pyquery](https://github.com/gawel/pyquery) 在 dom 树中选中想要的 node 及其属性

### 控制浏览器

- [playwrite](https://playwright.nodejs.cn/) 用来做端到端测试的,同时支持 js/ts/python
- [selenium](https://www.runoob.com/selenium/selenium-tutorial.html) 仅支持 python
- [puppeteer](https://pptr.nodejs.cn/) 仅支持js, 速度快, 如果会 js 可以了解下

## lxml + requests 爬取图片

其实吧, 用其他语言也能做同样的事情, 比如 NodeJS, 不一定非得用 python 来发送请求解析 xml 文档
只是说, 看你对哪个语言比较熟悉, 就用哪个编程语言

```python
import requests
import os
import uuid
from pyquery import PyQuery as jQuery


state = {
    "page": 1,  # 要爬取的页数
    "links": [],  # 要爬取网页的url
    "image_list": [],  # 要爬取的图片url
    "contents": [],  # 爬取的内容
    "host": "https://pic.netbian.com",
}


def input_pages():
    try:
        user_input = input("请输入要爬取的页数: ")

        # 直接使用默认值
        if user_input.strip() == "":
            return

        # 限制输入的数字范围
        num = int(user_input)
        if num < 1 or num > 10:
            print("请输入1-10之间的数字")

        # 设置 state
        state["page"] = num
    except Exception as e:
        print("请输入1-10之间的数字\n", e)


def get_links():
    host = state["host"]
    links = [f"{host}/index.html"]
    if state["page"] == 1:
        state["links"] = links
        return

    for i in range(1, state["page"]):
        page = f"{host}/index_{i}.html"
        links.append(page)
    state["links"] = links


def fetch_content(url):
    headers = {
        "accept": "text/html,application/xhtml+xml;charset=UTF-8",
        "user-agent": "X-Requests-Agent",
    }
    response = requests.get(url, headers=headers)
    response.encoding = "gbk"  # source html is gbk encoding
    if response.status_code == 200:
        state["contents"].append(response.text)

def fetch_content_list():
    for url in state["links"]:
        fetch_content(url)

def parse_content(content):
    host = state["host"]
    imgs = jQuery(content).find(".slist").find("a").find("img")
    links = [
        {
            "src": f"{host}{img.attrib['src']}",
            "alt": img.attrib["alt"],
        }
        for img in imgs
    ]
    # merge image lists
    state["image_list"] += links


def parse_content_list():
    for content in state["contents"]:
        parse_content(content)


def download_image(url, file_name=None):
    img_save_path = "./images"
    os.makedirs(img_save_path, exist_ok=True)
    img_file_name = file_name or uuid.uuid4()
    img_file_path = f"{img_save_path}/{img_file_name}.jpg"
    headers = {
        "user-agent": "X-Requests-Agent",
        "accept ": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "referer": "https://pic.netbian.com/index.html",
    }
    response = requests.get(url, headers=headers)
    with open(img_file_path, "wb") as f:
        f.write(response.content)


def download_image_list():
    for img in state["image_list"]:
        download_image(img["src"], img["alt"])


def main():
    input_pages()
    get_links()
    fetch_content_list()
    parse_content_list()
    download_image_list()
    print("爬取完成")


if __name__ == "__main__":
    main()
```
