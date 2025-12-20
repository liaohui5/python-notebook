## 数据验证

web 开发无论用什么语言都无法避免要验证输入的数据是否正确,
比如使用 express 需要 zod 这样专门用于验证数据的库, 那么在 python 生态中,
也有很多类似的库, 但是开发体验比较好的有: [pydantic](https://pydantic.com.cn/concepts/models/)

## Pydantic 简介

Pydantic 是一个在 Python 中用于数据验证和解析的第三方库。它提供了一种简单且直观的方式来定义数据模型，并使用这些模型对数据进行验证和转换。

Pydantic 的一些特性：

1. 类型注解：Pydantic 使用类型注解来定义模型的字段类型。你可以使用 Python 内置的类型、自定义类型或者其他 Pydantic 提供的验证类型。
2. 数据验证：Pydantic 自动根据模型定义进行数据验证。它会检查字段的类型、长度、范围等，并自动报告验证错误。你可以使用 ValidationError 异常来捕获验证错误。
3. 模型转换：Pydantic 提供了从各种数据格式（例如 JSON、字典）到模型实例的转换功能。它可以自动将输入数据解析成模型实例，并保留类型安全性和验证规则。

- [在线中文文档](https://pydantic.com.cn/)

```sh
# 安装
uv add pydantic
```

## 快速开始

```python
from pydantic import BaseModel
from typing import Literal


# 继承 BaseModel
class StudentValidationSchema(BaseModel):
    name: str
    age: int
    # 允许值只能是: boy, girl, unknown,
    # 如果不设置默认值在创建时候就必须传入 gender 参数, 否则会报错
    gender: Literal["boy"] | Literal["girl"] | Literal["unknown"] = "unknown"


# 传入参数列表
zs = StudentValidationSchema(name="zs", age=18, gender="boy")
print(zs)

# 传入 dict
ls = StudentValidationSchema(**{"name": "ls", "age": 19})
print(ls)
```

## 自定义验证规则

```python
from typing import Literal
from pydantic import BaseModel, field_validator
import re


class StudentValidationSchema(BaseModel):
    name: str
    age: int
    gender: Literal["boy"] | Literal["girl"] | Literal["unknown"] = "unknown"
    telephone: str | None = None

    # 1.定义一个验证方法
    # 2.将需要自定义验证的字段添加到 field_validator 装饰器中
    # 3.实现验证处理逻辑
    # 4.验证函数的返回值就是被验证字段最终的值
    @field_validator("telephone")
    @classmethod
    def validate_telephone(cls, v: str | None):
        if v is None:
            return v
        if len(v) != 11:
            raise ValueError("telephone must be 11 digits")
        telephone_regex = "^1[3-9]\\d{9}$"
        if re.match(telephone_regex, v):
            return v
        raise ValueError("invalid telephone")


# 传入参数列表
zs = StudentValidationSchema(name="zs", age=18, gender="boy", telephone="13812345678")
print(zs)

# 传入不合条件的 telephone, 直接抛出异常
ls = StudentValidationSchema(name="ls", age=18, gender="boy", telephone="12345678901")

```

## 处理数据验证错误

```python
from typing import Literal
from pydantic import BaseModel, ValidationError, field_validator
import re


class StudentValidationSchema(BaseModel):
    name: str
    age: int
    gender: Literal["boy"] | Literal["girl"] | Literal["unknown"] = "unknown"
    telephone: str | None = None

    @field_validator("telephone")
    @classmethod
    def validate_telephone(cls, v: str | None):
        if v is None:
            return v
        if len(v) != 11:
            raise ValueError("telephone must be 11 digits")
        telephone_regex = "^1[3-9]\\d{9}$"
        if re.match(telephone_regex, v):
            return v
        raise ValueError("invalid telephone")


try:
    # 手机格式有误, 会抛出异常
    ls = StudentValidationSchema(
        **{
            "name": "ls",
            "age": 18,
            "gender": "boy",
            "telephone": "12345678901",
        }
    )
    print(ls)

    # 注意从 pydantic 包中导入 ValidationError 这个异常
except ValidationError as e:
    print(e.json())
    # 输出json格式, 接口可以方便的返回给前端
    # [
    # 	{
    # 		"type": "value_error",
    # 		"loc": ["telephone"],
    # 		"msg": "Value error, invalid telephone",
    # 		"input": "12345678901",
    # 		"ctx": { "error": "invalid telephone" },
    # 		"url": "https://errors.pydantic.dev/2.12/v/value_error"
    # 	}
    # ]

```

## 嵌套模型

```python
from typing import Literal
from pydantic import BaseModel, ValidationError

# 宠物类
class PetValidationSchema(BaseModel):
    name: str
    age: int
    animal_type: str

# 学生类
class StudentValidationSchema(BaseModel):
    name: str
    age: int
    gender: Literal["boy"] | Literal["girl"] | Literal["unknown"] = "unknown"
    telephone: str | None = None
    # 嵌套
    pets: list[PetValidationSchema] = []

ls = StudentValidationSchema(
    **{
        "name": "ls",
        "age": 18,
        "gender": "boy",
        "telephone": "12345678901",
        "pets": [
            PetValidationSchema(name="huahua", age=2, animal_type="cat"),
            PetValidationSchema(name="wancai", age=3, animal_type="dog")
        ]
    }
)

print(ls)
```

## json 操作

```python
from typing import Literal
from pydantic import BaseModel, ValidationError
import json

# 宠物类
class PetValidationSchema(BaseModel):
    name: str
    age: int
    animal_type: str

# 学生类
class StudentValidationSchema(BaseModel):
    name: str
    age: int
    gender: Literal["boy"] | Literal["girl"] | Literal["unknown"] = "unknown"
    telephone: str | None = None
    # 嵌套
    pets: list[PetValidationSchema] = []

ls = StudentValidationSchema(
    **{
        "name": "ls",
        "age": 18,
        "gender": "boy",
        "telephone": "12345678901",
        "pets": [
            PetValidationSchema(name="huahua", age=2, animal_type="cat"),
            PetValidationSchema(name="wancai", age=3, animal_type="dog")
        ]
    }
)

# model_dump_json 将实例转 json 字符串
print(ls.model_dump_json())


json_str = json.dumps({
    "name": "zs",
    "age": 20,
    "gender": "girl",
    "telephone": "13812345678",
    "pets": [
        {
            "name": "gitlab",
            "age": 10,
            "animal_type": "fox"
        },
    ]
})

print("--- json_str --- \n", json_str)

# 直接将 json 字符串转 model 对象并验证
zs = StudentValidationSchema.model_validate_json(json_str)
print(zs)
```

## 字段检查规则

如果这个库仅仅是验证数据类型, 所有数据内容验证逻辑都需要我们自己来写的话,
那就没有必要用这个库了, 所以它也内置了一些用于约束数字/字符串/默认值的类

- [Field](https://pydantic.com.cn/concepts/fields/): 具体的各种约束有很多, 详情可以查看文档

```python
from typing import Literal
from pydantic import BaseModel, ValidationError, Field

class StudentValidationSchema(BaseModel):
    # 字符串长度约束: 名字最少2个字符,最多4个字符
    name: str = Field(min_length=2, max_length=4)

    # 数字约束: 年龄最少1岁,最多100岁
    # gt - 大于
    # lt - 小于
    # ge - 大于或等于
    # le - 小于或等于
    # multiple_of - 给定数字的倍数
    age: int = Field(ge=1, le=100)

    # 默认值约束: 是否毕业(默认: 未毕业)
    is_outdated: bool = Field(default=False)

# 正常输出
zhang3 = StudentValidationSchema(
    **{
        "name": "张三",
        "age": 18
    }
)
print(zhang3)

# 报错
li4 = StudentValidationSchema(
    **{
        "name": "4",
        "age": -10,
        "is_outdated": True
    }
)
print(li4)
```

## 多个字段联动检查

数据之前可能存在关系, 这也需要检查, 如: 两次密码必须相同: `password` 和 `password_confirm`

```python
from typing import Literal
from pydantic import BaseModel, ValidationError, Field, model_validator

class LoginFormModel(BaseModel):
    email: str
    password: str
    password_confirm: str

    # model_validator 可以验证模型的所有字段
    # mode=after 表示: 这个验证器会在模型中的所有字段都被验证之后才执行
    # 验证密码和确认密码必须相同
    @model_validator(mode='after')
    def check_passwords_match(self):
        if self.password != self.password_confirm:
            raise ValueError('passwords do not match')
        return self

try:
    login_form = LoginFormModel(email='a', password='b', password_confirm='c')
except ValidationError as e:
    print(e.json())
    # [
    #     {
    #         "type":"value_error",
    #         "loc":[],
    #         "msg":"Value error, passwords do not match",
    #         "input":{"email":"a","password":"b","password_confirm":"c"},
    #         "ctx":{"error":"passwords do not match"},
    #         "url":"https://errors.pydantic.dev/2.12/v/value_error",
    #     },
    # ]
```

## 更多内容

推荐大致看下这些内容

- [validators](https://pydantic.oaix.tech/2.12/concepts/validators/)
- [严格模式](https://pydantic.oaix.tech/2.12/concepts/strict_mode/)
- [性能控制](https://pydantic.oaix.tech/2.12/concepts/performance/)
- [示例](https://pydantic.oaix.tech/2.12/examples/files/)
