## 安装 requests

- [github](https://github.com/psf/requests)
- [docs](https://requests.readthedocs.io/en/latest/)

```sh
pip install requests
```

## 发送 GET 请求

- [免费 API](https://api.songzixian.com/)

```python
import requests

url = "https://api.songzixian.com/api/ip"
query = {
    "dataSource":"generic_ip",
    "ip": "36.157.35.45",
}
resp = requests.get(url, params=query)
print(resp.status_code) # 200
print(resp.text)        # json string
data = resp.json()      # ==> json.loads(resp.text)

print(data['message'])
```

## 发送 post 请求

```python
import requests

url = "https://api.songzixian.com/api/speech-to-text"
body = {
    "dataSource": "text_to_speech",
}
resp = requests.post(url, data=body).json()

print(resp)
```

## 上传文件

```python
import requests

url = "https://api.songzixian.com/api/speech-to-text"
body = {
    "dataSource": "text_to_speech",
}
files = {
    'file': open('./1.txt', 'rb'),
}

# 上传文件同时发送数据
resp = requests.post(url, data=body, files=files).json()

print(resp)
```

## JSON 字符串转 python 字典

- [json 模块](https://docs.python.org/zh-cn/3/library/json.html#module-json)

```python
import json

user_info='{"id":1001, "name": "tom", "email": "tom@example.com"}'

user = json.loads(user_info)

for key in user.keys():
    val = user[key]
    print(f"key={key} val={val} type={type(val)}")

# key=id    val=1001            type=<class 'int'>
# key=name  val=tom             type=<class 'str'>
# key=email val=tom@example.com type=<class 'str'>
```

## python 字典转 JSON 字符串

```python
import json

user = {
    "id": 1001,
    "name": "tom",
    "email": "tom@example.com"
}
user_info = json.dumps(user)

print("user_info:", user_info)
print("data_type:", type(user_info))

# user_info: {"id": 1001, "name": "tom", "email": "tom@example.com"}
# data_type: <class 'str'>
```
