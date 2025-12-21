## 介绍

Flask 是一个用 Python 编写的轻量级 Web 应用框架。

Flask 基于 WSGI（Web Server Gateway Interface）和 Jinja2 模板引擎，旨在帮助开发者快速、简便地创建 Web 应用。

Flask 被称为 "微框架"，类似 Node.js 的 express

[更多资料可查询官方文档](https://flask.palletsprojects.com/zh-cn/stable/installation)

## 安装和启动

安装: `uv add flask`

```python
from flask import Flask

app = Flask(__name__)


# app.get 可以将一个方法变成路由(GET请求方式)
@app.get("/")
def index():
    return "hello, flask"


# app.post 可以将一个方法变成 POST 请求方式的路由
@app.post("/api/login")
def login():
    return "login"


# app.get 和 app.post 都是 route 的方法的高级封装
# app.route 可以将一个方法变成路由(并且可以指定多种请求方式)
@app.route("/api/register", methods=["GET", "POST"])
def register():
    return "login"


# 启动 Flask 应用: 其实就是启动一个 http 服务
# port=3000 监听的端口默认是 5000
# debug=True 参数就是启动时是否开启 debug 模式
if __name__ == "__main__":
    app.run(port=3000, debug=True)
```

## 自动重启

使用: `uv run ./main.py` 这样每次修改后都需要关闭在重启, 所以需要类似
`nodemon` 的开发工具来帮助我们自动重启服务器

- [watchdog](https://pypi.org/project/watchdog/)

- [just](https://just.systems/man/zh/%E8%AF%B4%E6%98%8E.html)

```sh
watchmedo auto-restart --directory=./ --pattern=*.py --recursive -- uv run ./main.py
# 如果觉得这个命令特别长, 每次都敲比价麻烦, 可以使用 just 命令运行工具
```

## 加载 .env 文件

使用: `uv add python-dotenv` 安装模块

```python
from flask import Flask
from dotenv import load_dotenv, dotenv_values
import os


# 读取 .flaskenv 并设置到 os.environ
# 如果不传, 将自动加载 .env 文件
load_dotenv(".flaskenv")

# 读取 .flaskenv 文件并返回一个 dict
env = dotenv_values(".flaskenv")

app = Flask(__name__)


@app.get("/")
def index():
    return env


@app.get("/envs")
def envs():
    return {
        "flask_port": os.environ.get("FLASK_PORT"),
        "flask_debug": os.environ.get("FLASK_DEBUG"),
        # 如果不存在, 将返回 default value
        "not_exist": os.environ.get("NOT_EXIST") or "default value",
    }


if __name__ == "__main__":
    config = {
        "port": int(os.environ.get("FLASK_PORT") or 5000),
        "debug": bool(os.environ.get("FLASK_DEBUG") or False),
    }
    app.run(**config)
```

## 路由路径

路径参数类型限制支持的类型:

| 类型   | 说明                                   |
| ------ | -------------------------------------- |
| string | 接受任何不带斜杠的文本(如: abc)        |
| int    | 接受正整数(如: 10)                     |
| float  | 接受正浮点数(如: 1.1)                  |
| path   | 与 string 类似, 但也接受斜杠(如: /abc) |
| uuid   | 接受 UUID 字符串                       |

```python
from flask import Flask

app = Flask(__name__)


# 没有路径参数
@app.get("/")
def index():
    return "hello, flask"


# 路径参数会被当作参数传递给被修饰的函数
@app.get("/test/<username>")
def test1(username):
    return f"test1, {username}"


# 路径参数并限制数据类型
# 路经参数必须是整数, 否则会 404
# /test2/123 可以正确到执行到 test2 函数
# /test2/abc 会 404
@app.get("/test2/<int:user_id>")
def test2(user_id):
    return f"test2, {user_id}"


if __name__ == "__main__":
    app.run(port=3000, debug=True)
```

## 静态文件服务器

```python
from flask import Flask

app = Flask(
    __name__,
    static_folder="assets",  #### 自定义静态文件目录名
    static_url_path="/static",  # URL 路径前缀
)

# 自需要和这个 main.py 的同级目录下
# 有 ./assets 目录 并且有静态文件(html/css/js/jpg/png 等文件)
# 就可以通过 http://localhost:3000/static/文件名 来访问

@app.get("/")
def index():
    return "hello, flask"

if __name__ == "__main__":
    app.run(port=3000, debug=True)
```

## 请求对象

通过请求对象, 就可以获取请求信息, 比如携带的数据等

```py
from flask import Flask, request
from werkzeug.datastructures import FileStorage

app = Flask(__name__)


@app.get("/")
def get_method() -> str:
    # 获取请求的方式
    return "method:" + request.method

@app.get("/info/<dynamic_path>")
def get_url_path(dynamic_path: str):
    # 获取请求的 url, path, content_length, content_type
    # curl http://localhost:3000/info/test
    # {
    #   "content_length": 32,
    #   "content_type": "application/json",
    #   "dynamic_path": "test",
    #   "path": "/info/test",
    #   "url": "http://localhost:3000/info/test"
    # }
    return {
        "url": request.url,
        "path": request.path,
        "content_type": request.content_type,
        "content_length": request.content_length,
        "dynamic_path": dynamic_path,
    }


@app.get("/query")
def get_form() -> dict[str, str]:
    # curl http://localhost:3000?page=1&limit=10
    # 获取所有 query 参数, 返回一个字典 { page: 1, age: 2 }
    return request.args

@app.get("/query")
def get_form() -> dict[str, str]:
    # curl http://localhost:3000?page=1
    # 获取 query 某一个参数并设置默认值
    page = request.args.get("page", 1)
    limit = request.args.get("limit", 10)
    return { "page": page, "limit": 10 }



@app.post("/form1")
def get_form() -> dict[str, str]:
    # 注意请求格式为: Content-Type: application/x-www-form-urlencoded
    # 获取整个请求的数据, 返回一个字典: { name:"tom", age: "18" }
    return request.form


@app.post("/form2")
def get_form_field() -> str:
    # 注意请求格式为: Content-Type: application/x-www-form-urlencoded
    # 如果提交的表单数据有 name 字段, 那么就返回获取到的
    # 如果没有 name 字段, 那么就返回默认值 "default-value"
    return request.form.get("name", "default-value")


@app.post("/form3")
def get_upload_file() -> str:
    # 注意请求格式为: Content-Type: multipart/form-data
    file: FileStorage = request.files["file"]
    return str(file.filename)


@app.post("/form4")
def get_json() -> dict:
    # 注意请求格式为: Content-Type: application/json
    return request.get_json()

@app.get("/get_cookies")
def get_cookies() -> str:
    # 注意 request.cookies 是一个 dict, 可以通过 get 方法获取值
    return request.cookies.get("key", "some-cookie")

if __name__ == "__main__":
    app.run(port=3000, debug=True)
```

## 响应对象

::: code-group

```python [响应 json]
from flask import Flask, jsonify

app = Flask(__name__)

@app.get("/")
def index():
    # 直接使用 jsonify 传入 dict 即可
    return jsonify(
        {
            "id": 1,
            "username": "tom",
            "email": "xxx@xxx.com",
            "avatar": "https://xxx.com/xxx.jpg",
        }
    )

if __name__ == "__main__":
    app.run(port=3000, debug=True)
```

```python [二进制流响应]
import os
from flask import Flask, abort, send_file

load_dotenv(".flaskenv")
app = Flask(__name__)


@app.route("/download")
def download_file():
    file_path = os.path.join("./static/test.pdf")

    # 检查文件是否存在
    if not os.path.exists(file_path):
        abort(404)

    # 发送二进制文件
    return send_file(
        file_path,
        mimetype="application/octet-stream",  # 通用二进制类型
        download_name="your_test.pdf",  # 下载时的文件名
        as_attachment=True,  # 作为附件下载
    )


if __name__ == "__main__":
    app.run(port=3000, debug=True)
```

```python [错误响应]
from flask import Flask, redirect, abort

app = Flask(__name__)


# 重定向到 /home
@app.get("/")
def index():
    return redirect("/home")


@app.get("/home")
def home() -> str:
    return "home"


# 抛出错误并响应对应的错误码
@app.get("/error")
def not_found():
    abort(404)


# 直接抛出错误
@app.get("/error2")
def throw_error():
    raise Exception("error")


if __name__ == "__main__":
    app.run(port=3000, debug=True)
```

:::

## 异常处理

::: code-group

```python [处理 HTTP 状态码]
from flask import Flask, abort, jsonify, request

app = Flask(__name__)

# 抛出错误并响应对应的错误码
@app.get("/error")
def not_found():
    abort(500)

# 处理 abort(500) 的错误并响应 json
@app.errorhandler(500)
def internal_server_error(error):
    app.logger.error(f"Server Error: {error}, URL: {request.url}")
    response = jsonify(
        {
            "error": "Internal server error",
            "message": "An unexpected error occurred on the server.",
        }
    )
    response.status_code = 500
    return response

if __name__ == "__main__":
    app.run(port=3000, debug=True)
```

```python [处理自定义异常]
from flask import Flask, jsonify, request

app = Flask(__name__)


# 定义自定义异常
class APIError(Exception):
    status_code = 400

    def __init__(self, message, status_code=None, payload=None):
        super().__init__()
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        body = dict(self.payload or ())
        body["message"] = self.message
        return body


# 抛出自定义异常
@app.get("/error")
def not_found():
    raise APIError("failed to validation form data")


# 注册自定义异常处理器
@app.errorhandler(APIError)
def handle_api_error(error):
    app.logger.exception(f"Unexpected error: {error}, URL: {request.url}")
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response


if __name__ == "__main__":
    app.run(port=3000, debug=True)
```

```python [全局异常捕获]
from flask import Flask, jsonify, request

app = Flask(__name__)


@app.get("/error")
def error():
    res = 1 / 0  # 会抛出异常: division by zero
    print(res)
    return "finish"


@app.errorhandler(Exception)
def handle_unexpected_error(error):
    # 捕获所有未处理的异常
    app.logger.exception(f"Unexpected error: {error}, URL: {request.url}")
    return jsonify({"error": f"Server Internal Error: {error}"}), 500


if __name__ == "__main__":
    app.run(port=3000, debug=True)
```

:::

## 记录日志

```python
# 在 app 对象上有一个 logger 对象
app.logger.debug('A value for debugging')
app.logger.warning('A warning occurred (%d apples)', 42)
app.logger.error('An error occurred')
```

## 蓝图

蓝图是 Flask 应用的"子集"或"模块"，它定义了一组相关的路由、视图函数、模板、静态资源和错误处理器。**蓝图本身不是应用**，而是一个可以注册到应用的组件。

```python
from flask import Blueprint

# 创建一个蓝图实例
admin_bp = Blueprint('admin', __name__, url_prefix='/admin')
```

### 蓝图与应用的关系

- 应用(App): Flask 的核心实例, 负责最终请求分发
- 蓝图(Blueprint): 应用的功能模块, 定义了路由和视图但不能独立运行

```
Flask Application
├── Main Routes
├── User Blueprint (注册到 /user)
├── Admin Blueprint (注册到 /admin)
├── API Blueprint (注册到 /api)
└── Blog Blueprint (注册到 /blog)
```

### 创建和使用蓝图

::: code-group [基本使用]

```python
from flask import Flask, Blueprint, jsonify

# 创建一个蓝图实例的参数:
#   name: 蓝图名称（唯一标识）
#   import_name: 导入名，通常是 __name__
#   url_prefix: URL 前缀（可选）
#   static_folder: 静态文件目录（可选）
#   template_folder: 模板目录（可选）
#   static_url_path: 静态文件 URL 路径（可选）
api_bp = Blueprint("api", __name__, url_prefix="/api")

app = Flask(__name__)


# 在这个蓝图下定义路由
@api_bp.get("/ping")
def index():
    return jsonify(
        {
          "code": 0,
          "data": None,
          "msg": "success",
        }
    )


# 将蓝图注册到应用
app.register_blueprint(api_bp)
if __name__ == "__main__":
    app.run(port=3000, debug=True)

# 请求: http://localhost:3000/api/ping
```

```python [嵌套蓝图]
from flask import Flask, Blueprint, jsonify

app = Flask(__name__)


# 创建父蓝图
api_bp = Blueprint("api", __name__, url_prefix="/api")

# 创建子蓝图
v1_bp = Blueprint("v1", __name__, url_prefix="/v1")
v2_bp = Blueprint("v2", __name__, url_prefix="/v2")


# 在子蓝图中定义路由
@v1_bp.route("/users")
def v1_users():
    return jsonify({"version": "v1", "users": []})


# 在子蓝图中定义路由
@v2_bp.route("/users")
def v2_users():
    return jsonify({"version": "v2", "users": [], "pagination": {}})


# 注册子蓝图到父蓝图
api_bp.register_blueprint(v1_bp)
api_bp.register_blueprint(v2_bp)

# 注册蓝图到应用后可以请求: /api/v1/users 和 /api/v2/users
app.register_blueprint(api_bp)
if __name__ == "__main__":
    app.run(port=3000, debug=True)
```

:::

## 中间件

1. 开源中间件: cors/缓存/安全
2. 自定义中间件: auth

### CORS 允许跨域

- 安装: `uv add flask-cors`

```python
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


@app.get("/")
def index():
    return jsonify({"code": 0, "data": None, "msg": "success"})


if __name__ == "__main__":
    app.run(port=3000, debug=True)
```

### 自定义中间件

```python [请求钩子]
from flask import Flask, jsonify, request

app = Flask(__name__)

# 会在进入 / 路由前执行
@app.before_request
def before_request():
    # 是否有携带 name 和 password 参数
    name = request.args.get("name")
    password = request.args.get("password")
    # 并且值不是 admin 和 123456, 那么直接拦截掉
    if not (name == "admin" and password == "123456"):
        return jsonify({"code": 1, "data": None, "msg": "please login first"})


@app.get("/")
def index():
    return jsonify({"code": 0, "data": None, "msg": "success"})


if __name__ == "__main__":
    app.run(port=3000, debug=True)
```
