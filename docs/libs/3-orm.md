## sqlalchemy 是什么?

SQLAlchemy SQL 工具包和对象关系映射器是一套全面的工具，用于Python链接数据库和处理数据库数据

- [官方文档](https://docs.sqlalchemy.org/en/20/orm/quickstart.html)
- [中文文档](https://docs.sqlalchemy.org.cn/en/20/orm/quickstart.html#simple-select)
- [教程](https://docs.sqlalchemy.org.cn/en/20/tutorial/engine.html)

## 安装

```sh
uv add sqlalchemy
```

## 快速开始

::: code-group

```python
import sqlalchemy as sa

# 0.准备工作
# 利用 sqlite 客户端工具创建一个 students 库并且插入一些数据
# 推荐使用开源的 dbgate: https://www.dbgate.io/zh/

# 1.创建引擎
# sqlite:     数据库类型
# pysqlite:   链接数据库所用的驱动API
# //students: 表示要链接的数据库名称
# echo=True:  打印 sql 语句等调试信息
engine = sa.create_engine("sqlite+pysqlite:///students.db", echo=True)

# 2.链接数据库获取链接对象
with engine.connect() as conn:
    # 3.直接执行 sql 查询语句
    sql_text = sa.text("SELECT * FROM students")

    # 4.输出获取到的结果
    result = conn.execute(sql_text).all()
    print(result)

# 5.关闭数据库链接
conn.close()
```

```SQL [准备数据SQL]
create table if not exists students (
  id integer primary key autoincrement, -- 自增主键
  name varchar(32) not null unique,     -- 用户名, 不能为空且唯一
  age  integer unsigned not null,       -- 年龄
  gender integer not null default 2     -- 性别(0女 1男 2未知)
);
insert into students(name, age, gender) values('张三', 16, 1);
insert into students(name, age, gender) values('李三', 15, 0);
-- select * from students;
```

:::

## 建表 & 执行 SQL 语句

使用 SQLAlchemy 自动建表

::: code-group

```py [1.建表]
import sqlalchemy as sa
from datetime import datetime

# 创建数据库引擎
engine = sa.create_engine("sqlite+pysqlite:///teachers.db", echo=True)

# 元对象
meta = sa.MetaData()

# 定义表结构(可以定义多个)
techers_table = sa.Table(
    # create table if not exists techers
    "techers",
    meta,  # 注意第二个参数必须是 meta 对象
    # id integer primary key autoincrement
    sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
    # name varchar(16) not null
    sa.Column("name", sa.String(16), nullable=False),
    # age integer not null
    sa.Column("age", sa.Integer, nullable=False),
    # gender integer not null default 2
    sa.Column("gender", sa.Integer, nullable=False, default=2),
    # birthday date not null
    sa.Column("birthday", sa.Date, nullable=True),  # 日期类型的数据
    # telephone varchar(16) not null
    sa.Column("telephone", sa.String(16), nullable=True),
    # email varchar(32) not null
    sa.Column("teach_subject", sa.String(32), nullable=True),
)


# 创建表
meta.create_all(engine)

# 执行 sql 语句的方法
def exec_sql(sql):
    with engine.connect() as conn:  # 1.链接数据库
        result = conn.execute(sql)  # 2.执行 sql 语句
        conn.commit()  # 3.提交事物(注意默认开启了事物)
        conn.close()  ## 4.关闭数据库链接
        return result  # 5.返回执行结果
```

```python [2.插入数据]
# 1.insert 方法会创建一个预处理 SQL 语句
insert_prepare_sql = techers_table.insert()
print(f"插入数据库的 SQL 语句: {insert_prepare_sql}")  # 预处理语句

# 2.使用 values 给预处理语句字段设置具体的值
net_teacher = {
    "name": "张三",
    "age": 26,
    "gender": 1,
    "birthday": datetime.strptime("2000-01-01", "%Y-%m-%d"),  # 注意转日期类型
    "telephone": "13812345678",
    "teach_subject": "计算机网络",
}
insert_sql = insert_prepare_sql.values(**net_teacher)
print(f"插入数据最终执行的 SQL 语句: {insert_sql}")

# 3.执行 sql
exec_sql(insert_sql)


# 4.一次插入多条数据(直接给 values 方法, 传一个 list)
insert_many_sql = techers_table.insert().values(
    [
        {
            "name": "李四",
            "age": 26,
            "gender": 2,
            "birthday": datetime.strptime("2000-02-02", "%Y-%m-%d"),
            "telephone": "13822345678",
            "teach_subject": "语文",
        },
        {
            "name": "王五",
            "age": 26,
            "gender": 0,
            "birthday": datetime.strptime("2000-03-03", "%Y-%m-%d"),
            "telephone": "13832345678",
            "teach_subject": "数学",
        },
    ]
)

result = exec_sql(insert_many_sql)
print(f"SQL执行后影响的行数: {result.rowcount}")

```

```python [查询数据]
# 1.查询所有记录 select * from techers
select_all_sql = techers_table.select()
res_set = exec_sql(select_all_sql)

# 1.1获取查询结果的第一个数据
firstRow = res_set.fetchall()
print("结果集的第一个数据:", firstRow)

# 1.2获取查询结果的第所有数据
rows = res_set.fetchall()
print("结果集的所有数据:", firstRow)

# 2.查询符合条件的记录 (张三的手机号, 李四的 id)
select_by_name_sql = techers_table.select().where(
    sa.sql.or_(
        # sa.sql 也有 and_, or_, not_ 等方法
        techers_table.c.telephone == "13812345678",
        techers_table.c.id == 2,
    )
)

result_set = exec_sql(select_by_name_sql).fetchall()
print("查询符合条件的所有记录:", result_set)


# 3.查询指定字段的数据: select id,name from techers
select_by_cols_sql = techers_table.select().with_only_columns(
    techers_table.c.id,
    techers_table.c.name,
)
result_set = exec_sql(select_by_cols_sql)
print("查询指定字段的记录:", result_set.fetchall())

```

```python [修改数据]
# 1.查看一条数据的详细信息
def show_target_detail(label: str) -> None:
    techers_table.select().where(techers_table.c.id == target_id)
    res = exec_sql(techers_table.select().where(techers_table.c.id == target_id))
    print(f">>> {label}:\n", res.fetchall())


# 2.要求: 将 name 为 "李四" 修改为 "李肆", 假设这条数据的ID=2
target_id = 2
show_target_detail("更新之前的数据")

# 3.执行sql
update_sql = (
    # update techers set name='李肆' where id=2
    techers_table.update().values(name="李肆").where(techers_table.c.id == target_id)
)
exec_sql(update_sql)

# 4.查看更新后的数据
show_target_detail("更新后的数据")
```

```python [删除数据]
# 1.查看所有数据
def list_teachers(label: str):
    res = exec_sql(techers_table.select())
    print(f">>> {label}", res.fetchall())

list_teachers("删除数据前")

# 2.删除数据
delete_sql = techers_table.delete().where(techers_table.c.id == 3)
exec_sql(delete_sql)

# 3.再次查看所有数据, 看 id=3 的数据是否删除
list_teachers("删除数据后")
```

:::

此时可以使用 sqlite 命令行客户端打开 `teachers.db` 去验证下:

```sh
$ sqlite3  ./teachers.db

sqlite> .table
```

## 建模(映射) & 使用 session

> 为什么要映射(建模)而不是直接执行 SQL 语句?

1. 更高层次面向对象编程的抽象
2. 更清晰的代码结构, 方便阅读和维护

> 为什么要使用session?

1. 提供更高的抽象方便面向对象编程的链式调用
2. 方便的事物管理
3. 更专业的数据库链接管理, 减少不必要的数据库访问

::: code-group

```python [建模]
import sqlalchemy as sa
from sqlalchemy.orm import sessionmaker, declarative_base

engine = sa.create_engine("sqlite+pysqlite:///teachers.db", echo=True)

# 创建基类(所有 ORM 的方法都继承自这个 Base)
Base = declarative_base()


# 定义 Teacher 类用于映射数据库中的 teachers 数据表
# 这样的类就叫做数据表映射类(数据表模型类)
class Teacher(Base):
    __tablename__ = "teachers"  # 数据表名称
    id = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    name = sa.Column(sa.String(16), nullable=False)
    age = sa.Column(sa.Integer, nullable=False)
    gender = sa.Column(sa.Integer, nullable=False, default=2)
    birthday = sa.Column(sa.Date, nullable=True)  # 日期类型的数据
    telephone = sa.Column(sa.String(16), nullable=True)
    teach_subject = sa.Column(sa.String(32), nullable=True)

    # 方便输出查看调试信息
    def __repr__(self):
        data_dict = {
            "id": self.id,
            "name": self.name,
            "age": self.age,
            "gender": self.gender,
            "birthday": self.birthday.strftime("%Y-%m-%d") if self.birthday else None,
            "telephone": self.telephone,
            "teach_subject": self.teach_subject,
        }
        return json.dumps(data_dict, indent=2)


# 创建表(如果表不存在则创建)
Base.metadata.create_all(engine)

create_session = sessionmaker(bind=engine)

# 使用 orm 的方式实现 curd
with create_session() as session:
    pass
```

```python [插入数据]
# 插入数据
with create_session() as session:
    new_teacher = {
        "name": "张三",
        "age": 26,
        "gender": 1,
        "birthday": datetime.strptime("2000-01-01", "%Y-%m-%d"),  # 日期类型
        "telephone": "13812345678",
        "teach_subject": "计算机网络",
    }
    # add 方法接受一个对象作为参数
    session.add(Teacher(**new_teacher))

    chinese_teacher = {
        "name": "李四",
        "age": 26,
        "gender": 2,
        "birthday": datetime.strptime("2000-02-02", "%Y-%m-%d"),
        "telephone": "13822345678",
        "teach_subject": "语文",
    }
    math_teacher = {
        "name": "王五",
        "age": 26,
        "gender": 0,
        "birthday": datetime.strptime("2000-03-03", "%Y-%m-%d"),
        "telephone": "13832345678",
        "teach_subject": "数学",
    }
    # add_all 一次插入多条数据
    session.add_all(
        [
            Teacher(**chinese_teacher),
            Teacher(**math_teacher),
        ]
    )
```

```python [查询数据]
with create_session() as session:
    # select * teachers
    rows = session.query(Teacher).all()
    print("查询所有数据:\n", rows)

    # select * teachers where id > 1
    rows = session.query(Teacher).filter(Teacher.id > 1).all()
    print("带有条件的查询数据:\n", rows)

    # 这个方法会直接返回一个 Teacher 对象, 而不是 Teacher 数组
    # select * teachers where id > 1 limit 1
    rows = session.query(Teacher).filter(Teacher.id > 1).first()
    print("查询符合条件的第一条数据:\n", rows)

    # 查询指定字段的数据: select id,name from techers
    # 返回一个数组: [(1, '张三'), (2, '李四'), (3, '王五')]
    rows = session.query().with_entities(Teacher.id, Teacher.name).all()
    print("查询指定字段的数据:\n", rows)

```

```python [修改数据]
with create_session() as session:
    target_id = 2
    before_row = session.query(Teacher).filter(Teacher.id == target_id).first()
    print("更新之前的数据:", before_row)

    # 更新数据
    session.query(Teacher).filter(Teacher.id == 2).update(
        {
            Teacher.name: "李肆",
            Teacher.age: 27,
        }
    )

    after_row = session.query(Teacher).filter(Teacher.id == target_id).first()
    print("更新之后的数据:", after_row)
```

```python [删除数据]
with create_session() as session:
    before_rows = session.query(Teacher).all()
    print("删除之前的数据:", before_rows)

    # 更新数据
    session.query(Teacher).filter(Teacher.id == 3).delete()

    after_rows = session.query(Teacher).all()
    print("删除之后的数据:", after_rows)
```

:::

## 新的映射方式定义表字段

::: code-group

```python [新的映射方式: 复用性更高]
from datetime import datetime
import sqlalchemy as sa

# 注意导入的包的来源路径
from sqlalchemy.orm import (
    sessionmaker,
    declarative_base,
    mapped_column,
    Mapped,
)
from sqlalchemy.sql import func

# 如果 Python >= 3.9, 可以使用标准库
from typing_extensions import Annotated
import json


engine = sa.create_engine("sqlite+pysqlite:///school.db", echo=True)

Base = declarative_base()

# 定义主键数字类型的自增主键 id
int_pk_id = Annotated[
    # 第一个参数是 python 的数据类
    # 第二个参数 mapped_column(数据库字段约束)
    int, mapped_column(sa.Integer, primary_key=True, autoincrement=True)
]

# 定义姓名字段
name_type = Annotated[str, mapped_column(sa.String(16), nullable=False)]
age_type = Annotated[int, mapped_column(sa.Integer, nullable=False)]
gender_type = Annotated[int, mapped_column(sa.Integer, nullable=False, default=2)]

created_at_type = Annotated[
    # 注意 python 的类型是 datetime, 注意导入这个包的
    # 数据库字段的类型是 datetime, 注意不同数据库的约束可能不同
    # server_default = func.now() 设置默认值为当前时间
    datetime, mapped_column(sa.DateTime, nullable=False, server_default=func.now())
]
updated_at_type = Annotated[datetime, mapped_column(sa.DateTime, nullable=True)]


# 教师表
class Teacher(Base):
    __tablename__ = "teachers"

    # 使用 Mapped 和 Annotated 定义字段
    id: Mapped[int_pk_id]
    name: Mapped[name_type]
    age: Mapped[age_type]
    gender: Mapped[gender_type]

    # 使用 mapped_column 定义其他字段，保持风格一致
    birthday: Mapped[datetime] = mapped_column(sa.Date, nullable=True)
    telephone: Mapped[str] = mapped_column(sa.String(16), nullable=True)
    teach_subject: Mapped[str] = mapped_column(sa.String(32), nullable=True)
    created_at: Mapped[created_at_type]
    updated_at: Mapped[updated_at_type]
    deleted_at: Mapped[updated_at_type]

    def __repr__(self):
        fmt_str = "%Y-%m-%d %H:%M:%S"
        created_at = self.created_at.strftime(fmt_str)
        updated_at = self.updated_at.strftime(fmt_str) if self.updated_at else None
        deleted_at = self.deleted_at.strftime(fmt_str) if self.deleted_at else None
        data_dict = {
            "id": self.id,
            "name": self.name,
            "age": self.age,
            "gender": self.gender,
            "birthday": self.birthday if self.birthday else None,
            "telephone": self.telephone,
            "teach_subject": self.teach_subject,
            "created_at": created_at,
            "updated_at": updated_at,
            "deleted_at": deleted_at,
        }
        return json.dumps(data_dict, indent=2)


# 学生表
class Student(Base):
    __tablename__ = "students"
    id: Mapped[int_pk_id]
    name: Mapped[name_type]
    age: Mapped[age_type]
    gender: Mapped[gender_type]
    created_at: Mapped[created_at_type]
    updated_at: Mapped[updated_at_type]
    deleted_at: Mapped[updated_at_type]


# 创建所有表
Base.metadata.create_all(engine)

create_session = sessionmaker(bind=engine)

# 由上代码观察可知, 假如有100个表, 且都需要定义
# id created_at updated_at deleted_at 等辅助字段
# 那么就可以很方便的用这种方式一次定义, 其他地方都引用它就好
# 如果要修改, 那么只修改一次就好
```

```python [老的映射方式: 兼容性好]
import sqlalchemy as sa
from sqlalchemy.orm import sessionmaker, declarative_base
import json

engine = sa.create_engine("sqlite+pysqlite:///school.db", echo=True)

Base = declarative_base()


# teachers 表
class Teacher(Base):
    __tablename__ = "teachers"  # 数据表名称
    id = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    name = sa.Column(sa.String(16), nullable=False)
    age = sa.Column(sa.Integer, nullable=False)
    gender = sa.Column(sa.Integer, nullable=False, default=2)
    birthday = sa.Column(sa.Date, nullable=True)  # 日期类型的数据
    telephone = sa.Column(sa.String(16), nullable=True)
    teach_subject = sa.Column(sa.String(32), nullable=True)

    # 方便输出查看调试信息
    def __repr__(self):
        data_dict = {
            "id": self.id,
            "name": self.name,
            "age": self.age,
            "gender": self.gender,
            "birthday": self.birthday.strftime("%Y-%m-%d") if self.birthday else None,
            "telephone": self.telephone,
            "teach_subject": self.teach_subject,
        }
        return json.dumps(data_dict, indent=2)


# students 表
class Student(Base):
    __tablename__ = "students"
    id = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    name = sa.Column(sa.String(16), nullable=False)
    age = sa.Column(sa.Integer, nullable=False)
    gender = sa.Column(sa.Integer, nullable=False, default=2)


# 创建表(如果表不存在则创建)
Base.metadata.create_all(engine)

create_session = sessionmaker(bind=engine)
```

:::

## 关联关系定义

数据库数据描述事物关系的一种方式

- 一对一: 一个公司只有一个法人
- 一对多: 一个公司可以有多个员工
- 多对多: 一个老师可以有多个学生, 一个学生也可以有多个老师

### 一对一

```python
import sqlalchemy as sa
from typing import Annotated
from sqlalchemy.orm import (
    sessionmaker,
    Mapped,
    mapped_column,
    declarative_base,
    relationship
)

engine = sa.create_engine("sqlite+pysqlite:///school.db", echo=False)
Base = declarative_base()

# 创建类型注解别名以简化常用字段定义
int_pk = Annotated[int, mapped_column(sa.Integer, primary_key=True, autoincrement=True)]
required_str_32 = Annotated[str, mapped_column(sa.String(32), nullable=False)]


# 国家表模型
class Country(Base):
    __tablename__ = "country"
    id: Mapped[int_pk]
    name: Mapped[required_str_32]

    # 定义关系: 注意是映射到 CapitalCity 的 country 属性而不是 country_id
    capital_city = relationship("CapitalCity", back_populates="country", uselist=False)


# 首都城市信息表模型
class CapitalCity(Base):
    __tablename__ = "capital_cities"
    id: Mapped[int_pk]
    name: Mapped[required_str_32]
    story: Mapped[str] = mapped_column(sa.String(), nullable=True)    # 关于首都的故事，允许为空
    history: Mapped[str] = mapped_column(sa.String(), nullable=True)  # 关于首都的历史，允许为空

    # 定义外键
    country_id: Mapped[int] = mapped_column(
        sa.Integer,
        sa.ForeignKey("country.id"),
        unique=True,
        nullable=False
    )

    # 定义映射关系
    country = relationship("Country", back_populates="capital_city", uselist=False)


# 创建表
Base.metadata.create_all(engine)

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 执行
with SessionLocal() as session:
    china = Country(name="中国")
    india = Country(name="印度")
    beijing = CapitalCity(name="北京", country=china, history="北京有着三千多年的建城史", story="紫禁城见证了明清两代的兴衰")
    new_delhi = CapitalCity(name="新德里", country=india, history="新德里是印度的政治中心", story="新德里由英国建筑师埃德温·鲁琴斯设计")

    session.add_all([
        china,
        india,
        beijing,
        new_delhi
    ])
    session.commit()
    print("=== 数据插入成功 ===")

    # 查询出所有数据
    countries = session.query(Country).all()
    for country in countries:
        print(f"{country.name}的首都是{country.capital_city.name}, {country.capital_city.story}, {country.capital_city.history}")



```

### 一对多

```python {46,51,52}
from datetime import datetime
import sqlalchemy as sa

# 注意导入的包的来源路径
from sqlalchemy.orm import (
    relationship,
    sessionmaker,
    declarative_base,
    mapped_column,
    Mapped,
)
from sqlalchemy.sql import func

# 如果 Python >= 3.9, 可以使用标准库
from typing_extensions import Annotated

engine = sa.create_engine("sqlite+pysqlite:///school.db", echo=True)

Base = declarative_base()

int_pk_id = Annotated[
    int, mapped_column(sa.Integer, primary_key=True, autoincrement=True)
]
created_at_type = Annotated[
    datetime, mapped_column(sa.DateTime, nullable=False, server_default=func.now())
]
updated_at_type = Annotated[datetime, mapped_column(sa.DateTime, nullable=True)]


# 公司表
class Company(Base):
    __tablename__ = "company"
    id: Mapped[int_pk_id]
    name: Mapped[str]
    created_at: Mapped[created_at_type]
    updated_at: Mapped[updated_at_type]

    def __repr__(self):
        return f"<Company(id={self.id}, name={self.name})>"


# 员工表
class Deployee(Base):
    __tablename__ = "employe"
    id: Mapped[int_pk_id]
    company_id: Mapped[int] = mapped_column(sa.ForeignKey("company.id"))  # 使用外键
    name: Mapped[str]
    created_at: Mapped[created_at_type]
    updated_at: Mapped[updated_at_type]

    # 定义关联关系对象(它不映射具体的数据库字段, 而是为了方便操作多个表)
    company: Mapped[Company] = relationship()

    # 方便查看调试输出信息
    def __repr__(self):
        return f"<Deployee(id={self.id}, name={self.name}, company_name={self.company.name})>"


# 创建所有表
Base.metadata.create_all(engine)

create_session = sessionmaker(bind=engine)
with create_session() as session:
    ## 一对多插入
    tencent = Company(name="腾讯")
    zs = Deployee(name="张三", company=tencent)
    ls = Deployee(name="李四", company=tencent)

    # 会自动处理好 company_id 和 Company 然后插入到数据库
    session.add(zs)
    session.add(ls)

    ## 一对多查询(能查到对应的数据, 证明插入没有问题)
    company_list = session.query(Company).all()
    print(">>> company_list:", company_list)

    deploy_list = session.query(Deployee).all()
    print(">>> deploy_list:", deploy_list)
```

### 多对多

```python
import sqlalchemy as sa
from typing import List, Annotated
from sqlalchemy.orm import (
    sessionmaker,
    Mapped,
    mapped_column,
    declarative_base,
    relationship
)

engine = sa.create_engine("sqlite+pysqlite:///school.db", echo=False)
Base = declarative_base()

# 创建类型注解别名以简化常用字段定义
int_pk = Annotated[int, mapped_column(sa.Integer, primary_key=True, autoincrement=True)]
required_str_32 = Annotated[str, mapped_column(sa.String(32), nullable=False)]
optional_str_32 = Annotated[str, mapped_column(sa.String(32))]

# 3.1 定义关联关系表(Association Table) 有的资料也叫 "中间表"
# 这是多对多关系的核心，只包含两个外键
# 注意：使用 Mapped 和 mapped_column 定义关联表的列也是可行的，
# 但传统上 Table 对象更常用，尤其是在定义纯关联表时。
student_teacher_association_table = sa.Table(
    "student_teacher_association",
    Base.metadata,
    sa.Column("student_id", sa.Integer, sa.ForeignKey("students.id"), primary_key=True),
    sa.Column("teacher_id", sa.Integer, sa.ForeignKey("teachers.id"), primary_key=True),
)

# 学生表模型
class Student(Base):
    __tablename__ = "students"
    id: Mapped[int_pk]
    name: Mapped[required_str_32]

    # 定义多对多关系
    # relationship:   使用字符串名称延迟解析 Teacher 类, 避免循环导入问题
    # secondary:      指定关联关系表(中间表)
    # back_populates: 指定另一侧模型中的关系属性名, 建立双向链接
    teachers: Mapped[List["Teacher"]] = relationship(
        "Teacher",
        secondary=student_teacher_association_table,
        back_populates="students",
    )

# 教师表模型
class Teacher(Base):
    __tablename__ = "teachers"
    id: Mapped[int_pk]
    name: Mapped[required_str_32]
    teach_subject: Mapped[optional_str_32]

    # 定义多对多关系
    students: Mapped[List["Student"]] = relationship(
        "Student",
        secondary=student_teacher_association_table,
        back_populates="teachers",
    )


# 创建表
Base.metadata.create_all(engine)

# 插入数据
def insert_datas(session):
    # 创建学生对象
    student1 = Student(name="张三")
    student2 = Student(name="李四")
    student3 = Student(name="王五")

    # 创建教师对象
    teacher1 = Teacher(name="王十八", teach_subject="数学")
    teacher2 = Teacher(name="李二十", teach_subject="语文")
    teacher3 = Teacher(name="宋十九", teach_subject="历史")

    # 建立关系 (通过向关系属性列表添加对象)
    # 张三 上 王老师 和 李老师 的课
    student1.teachers.append(teacher1)
    student1.teachers.append(teacher2)

    # 李四 上 李老师 和 宋老师 的课
    student2.teachers.append(teacher2)
    student2.teachers.append(teacher3)

    # 王五 上 王老师 和 宋老师 的课
    student3.teachers.append(teacher1)
    student3.teachers.append(teacher3)

    # 也可以通过教师端建立关系
    # teacher1.students.append(student1)
    # teacher1.students.append(student3)

    # 添加到会话
    session.add_all([student1, student2, student3, teacher1, teacher2, teacher3])

    # 提交事务
    session.commit()
    print("=== 数据插入成功 ===")


# 查询数据(查询出所有的学生及他们的老师)
def find_students(session):
    students = session.query(Student).all()
    session.commit()
    for student in students:
        # 访问 student.teachers 关系属性会自动加载关联的 Teacher 对象
        teacher_names = [t.name for t in student.teachers]
        print(f"{student.name} 的老师有: {teacher_names}")


# 查询数据(查询出所有的老师及他们的学生)
def find_teachers(session):
    teachers = session.query(Teacher).all()
    session.commit()
    for teacher in teachers:
        student_names = [s.name for s in teacher.students]
        print(f"{teacher.name} 老师的学生有: {student_names}")


# 创建会话工厂 & 执行
create_session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
with create_session() as session:
    insert_datas(session)
    find_students(session)
    find_teachers(session)
```

## 事务管理

::: code-group

```python [建模]
from datetime import datetime
import sqlalchemy as sa
from sqlalchemy.sql import func
from typing_extensions import Annotated

# 注意导入的包的来源路径
from sqlalchemy.orm import (
    sessionmaker,
    declarative_base,
    mapped_column,
    Mapped,
)

engine = sa.create_engine("sqlite+pysqlite:///school.db", echo=True)
Base = declarative_base()

# 定义主键数字类型的自增主键 id
int_pk_id = Annotated[
    # 第一个参数是 python 的数据类
    # 第二个参数 mapped_column(数据库字段约束)
    int, mapped_column(sa.Integer, primary_key=True, autoincrement=True)
]

# 定义姓名字段
name_type = Annotated[str, mapped_column(sa.String(16), nullable=False)]
age_type = Annotated[int, mapped_column(sa.Integer, nullable=False)]
gender_type = Annotated[int, mapped_column(sa.Integer, nullable=False, default=2)]

created_at_type = Annotated[
    # 注意 python 的类型是 datetime, 注意导入这个包的
    # 数据库字段的类型是 datetime, 注意不同数据库的约束可能不同
    # server_default = func.now() 设置默认值为当前时间
    datetime, mapped_column(sa.DateTime, nullable=False, server_default=func.now())
]
updated_at_type = Annotated[datetime, mapped_column(sa.DateTime, nullable=True)]


# 学生表
class Student(Base):
    __tablename__ = "students"
    id: Mapped[int_pk_id]
    name: Mapped[name_type]
    age: Mapped[age_type]
    gender: Mapped[gender_type]


# 创建所有表
Base.metadata.create_all(engine)

# session 工厂函数
create_session = sessionmaker(bind=engine)
```

```python [手动提交事务]
with create_session() as session:  # 默认开启事务
    student = Student(name="张三", age=18, gender=1)
    session.add(student)  # 如果不手动 commit, 不会插入到数据库中

    # 必须取消这一行的注释才能真正插入到数据库中
    # session.commit()
```

```python [如果有异常将自动回滚事务]
with create_session() as session:
    student = Student(name="李四", age=18, gender=1)
    session.add(student)

    x = 1 / 0 # 出现异常, 事务自动回滚, 所以不会插入到数据库中
    session.commit()
```

```python [自动提交事务]
# 自动提交的前提是代码没有异常, 没有自动回滚

with create_session() as session:  # 开启事务, 这个 with 结束, session 自动 close
    with session.begin():  # 开启事务的自动提交, 这个 with 结束, session 自动 commit
        student = Student(name="王五", age=18, gender=1)
        session.add(student)
        # 即便不手动commit, 这个数据也会插入到数据库中
        # session.commit()
```

:::

## 多表查询

以一对多为例, 开发中用的最多的可能就是一对多

假设是一个老师可以教多个学生

### 1.建模

```python
from datetime import datetime
import sqlalchemy as sa
from sqlalchemy.sql import func
from typing_extensions import Annotated
import random
import json
from sqlalchemy.orm import (
    # 注意导入的包的来源路径
    sessionmaker,
    declarative_base,
    mapped_column,
    relationship,
    Mapped,
)


engine = sa.create_engine("sqlite+pysqlite:///school.db", echo=True)
Base = declarative_base()

# 定义一些常用的字段类型
int_pk = Annotated[int, mapped_column(sa.Integer, primary_key=True, autoincrement=True)]
name_type = Annotated[str, mapped_column(sa.String(16), nullable=False)]
age_type = Annotated[int, mapped_column(sa.Integer, nullable=False)]
gender_type = Annotated[int, mapped_column(sa.Integer, nullable=False, default=2)]
created_at_type = Annotated[
    datetime, mapped_column(sa.DateTime, nullable=False, server_default=func.now())
]
updated_at_type = Annotated[datetime, mapped_column(sa.DateTime, nullable=True)]


# 教师表
class Teacher(Base):
    __tablename__ = "teachers"

    # 使用 Mapped 和 Annotated 定义字段
    id: Mapped[int_pk]
    name: Mapped[name_type]
    age: Mapped[age_type]
    gender: Mapped[gender_type]
    birthday: Mapped[datetime] = mapped_column(sa.Date, nullable=True)
    telephone: Mapped[str] = mapped_column(sa.String(16), nullable=True)
    teach_subject: Mapped[str] = mapped_column(sa.String(32), nullable=True)
    created_at: Mapped[created_at_type]
    updated_at: Mapped[updated_at_type]
    deleted_at: Mapped[updated_at_type]

    # 一对多: 一个老师对应多个学生, 关联字段
    students: Mapped[list["Student"]] = relationship(back_populates="teacher")

    # 方便调试输出
    def __repr__(self):
        fmt_str = "%Y-%m-%d %H:%M:%S"
        birthday = self.birthday.strftime(fmt_str)
        created_at = self.created_at.strftime(fmt_str)
        updated_at = self.updated_at.strftime(fmt_str) if self.updated_at else None
        deleted_at = self.deleted_at.strftime(fmt_str) if self.deleted_at else None
        data_dict = {
            "id": self.id,
            "name": self.name,
            "age": self.age,
            "gender": self.gender,
            "birthday": birthday,
            "telephone": self.telephone,
            "teach_subject": self.teach_subject,
            "created_at": created_at,
            "updated_at": updated_at,
            "deleted_at": deleted_at,
        }
        # ensure_ascii=False 可以解决中文被编码成 unicode 的问题
        return json.dumps(data_dict, indent=2, ensure_ascii=False)


# 学生表
class Student(Base):
    __tablename__ = "students"

    id: Mapped[int_pk]
    name: Mapped[name_type]
    age: Mapped[age_type]
    gender: Mapped[gender_type]

    # 多对一: 一个老师对应多个学生, 关联字段
    teacher_id: Mapped[int] = mapped_column(sa.ForeignKey("teachers.id"))  # 使用外键
    teacher: Mapped[Teacher] = relationship()  # 这个学生所属的老师

    # 方便调试输出
    def __repr__(self):
        data_dict = {
            "id": self.id,
            "name": self.name,
            "age": self.age,
            "gender": self.gender,
            "teacher_id": self.teacher_id,
        }
        return json.dumps(data_dict, indent=2, ensure_ascii=False)


# 创建所有表
Base.metadata.create_all(engine)

# 创建会话工厂
create_session = sessionmaker(bind=engine)
```

### 2.插入一些数据方便后续查询

```python
# 创建数据条数
teacher_count = 10
student_count = 30


# 创建老师数据
def create_teachers():
    teacher_list = []
    for i in range(1, teacher_count + 1):
        teacher_info = {
            "name": f"老师-{i}",
            "age": 20 + i,
            "gender": i % 2,
            "birthday": datetime.now(),
            "telephone": str(13812345678 + i),
            "teach_subject": f"数据库第{i}章节",
            "created_at": datetime.now(),
            "updated_at": None,
            "deleted_at": None,
        }
        teacher_list.append(Teacher(**teacher_info))
    return teacher_list


# 创建学生数据
def create_students():
    student_list = []
    for i in range(1, student_count + 1):
        student_info = {
            "name": f"学生-{i}",
            "age": 10 + i,
            "gender": i % 2,
            "teacher_id": random.randint(1, teacher_count),  # 随机分配老师id
        }
        student_list.append(Student(**student_info))
    return student_list


# 插入数据
with create_session() as session:
    session.add_all(create_teachers())
    session.add_all(create_students())
    session.commit()
```

### 3.查询出所有数据及其关联数据

```python
# 查询数据: 查询出所有的老师(所有字段)及其学生(所有字段)
with create_session() as session:
    teachers = session.query(Teacher).all()
    for teacher in teachers:
        print("======================")
        print(teacher)
        print(teacher.students)
```

### 4.排序 & 分页

```python
# 查询数据: 查询出所有的学生并按照年龄倒序排序然后分页
page = 2
page_size = 10
offset = (page - 1) * page_size
with create_session() as session:
    students = (
        session.query(Student)
        .order_by(Student.age.desc())  # 按照年龄倒序排序
        .offset(offset)                # 分页 offset
        .limit(page_size)              # 分页 limit
        .all()
    )
    print("======================")
    print(students)
```

## 链接其他数据库

在上面的例子中, 为了方便, 都是用 `sqlite` 数据库
但是在日常开发中, 用到最多可能是 `mysql` 和 `postgres`

> 使用不同的数据库, 在 ORM 建模和事务等处理上, 没有什么太大的区别, 只是需要的链接驱动不同

- sqlite: 需要的驱动是自带的, 不需要额外安装依赖包
- mysql : 需要的驱动是 [pymysql](https://github.com/PyMySQL/PyMySQL) 类似的包也有其他的, 不一定非得是这个, 只是这个比较常用
- postgres: 需要的驱动是 []

### 创建项目

```sh [1.创建项目 & 安装依赖]
# 0.创建项目
uv init py-db-demo
cd py-db-demo

# 1.安装依赖
uv add sqlalchemy pymysql psycopg2-binary
```

### 链接 mysql

```python main.py [2.链接测试]
import sqlalchemy as sa
import sqlalchemy.orm as saorm

# 链接数据库的配置信息类
# 注意, 任何一项都不能有错误
DB_TYPE = "mysql"
DB_DRIVER = "pymysql" # 注意需要安装链接驱动
DB_HOST = "localhost"
DB_PORT = 3306
DB_USER = "root"
DB_PASS = "root123456"
DB_NAME = "demo"
DB_URL = f"{DB_TYPE}+{DB_DRIVER}://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"


# 创建引擎, 链接数据库
engine = sa.create_engine(
    DB_URL,
    echo=True,  # 显示调试信息, 如:执行的SQL语句字符串
    # 连接池配置
    # pool_size=5,  # 连接池中保持的连接数
    # max_overflow=10,  # 超出pool_size时最多创建的连接数
    # pool_timeout=30,  # 获取连接的超时时间（秒）
    # pool_recycle=3600,  # 连接回收时间（秒），-1表示不回收
    # pool_pre_ping=True,  # 每次取连接时检查有效性
    connect_args={
        # 传递给PyMySQL的连接参数
        "charset": "utf8mb4",  # 字符集
        "autocommit": False,  # 自动提交(这个选项会影响事务处理)
    },
)


create_session = saorm.sessionmaker(bind=engine)

with create_session() as session:
    sql = sa.text("SELECT 1 + 1")
    res = session.execute(sql).all()
    print(f"sql执行成功,结果是: {res}")
```

### 链接 postgres

```py
import sqlalchemy as sa
import sqlalchemy.orm as saorm


# 链接数据库的配置信息类
# 注意, 任何一项都不能有错误
# 而且数据库必须是正常可以链接的
DB_TYPE = "postgresql"
DB_DRIVER = "psycopg2"  # 注意是 psycopg2 不是 psycopg2-binary
DB_HOST = "localhost"
DB_PORT = 5432
DB_USER = "dev"
DB_PASS = "root123456"
DB_NAME = "demo"
DB_URL = f"{DB_TYPE}+{DB_DRIVER}://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"


# 创建引擎, 链接数据库
engine = sa.create_engine(
    DB_URL,
    echo=True,
    connect_args={
        # 传递给 psycopg2 的连接参数
        "connect_timeout": 10,  # 连接超时
        "sslmode": "prefer",  # SSL 模式
    },
)


create_session = saorm.sessionmaker(bind=engine)

with create_session() as session:
    sql = sa.text("SELECT 1 + 1")
    res = session.execute(sql).all()
    print(f"sql执行成功,结果是: {res}")
```

## 数据库迁移 & 数据库填充

需要用到这个包: [alembic](https://github.com/sqlalchemy/alembic)

### 1.创建项目

```sh
uv init py-db-migration
cd  py-db-migration

# 安装依赖
uv add alembic sqlalchemy psycopg2-binary
```

### 2.项目结构

```python
.
├── README.md
├── main.py            # main
├── models             # 模型存放目录
│   ├── __init__.py
│   ├── student.py
│   └── teacher.py
├── pyproject.toml
└── uv.lock
```

### 3.代码

::: code-group

```python [main.py]
from models import create_session, StudentModel, TeacherModel


def main():
    with create_session() as session:
        students = session.query(StudentModel).all()
        print(students)
        print("==============华丽分割线===============")
        teachers = session.query(TeacherModel).all()
        print(teachers)
        session.commit()


if __name__ == "__main__":
    main()

```

```python [models/__init__.py]
from sqlalchemy import create_engine, Integer, String, DateTime, String, ForeignKey
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
    sessionmaker,
    declarative_base,
)
from sqlalchemy.sql import func
from datetime import datetime
from typing_extensions import Annotated

# 链接数据库的配置信息
DB_TYPE = "postgresql"
DB_DRIVER = "psycopg2"
DB_HOST = "localhost"
DB_PORT = 5432
DB_USER = "dev"
DB_PASS = "root123456"
DB_NAME = "demo"
DB_URL = f"{DB_TYPE}+{DB_DRIVER}://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

BaseModel = declarative_base()

engine = create_engine(DB_URL, echo=True)


# 定义一些常用的数据库字段类型
int_pk_id = Annotated[int, mapped_column(Integer, primary_key=True, autoincrement=True)]
name_type = Annotated[str, mapped_column(String(16), nullable=False)]
age_type = Annotated[int, mapped_column(Integer, nullable=False)]
gender_type = Annotated[int, mapped_column(Integer, nullable=False, default=2)]
created_at_type = Annotated[
    datetime,
    mapped_column(DateTime, nullable=False, server_default=func.now()),
]
updated_at_type = Annotated[datetime, mapped_column(DateTime, nullable=True)]


# 定义开启 session 的方法
def create_session():
    session_factory = sessionmaker(bind=engine)
    return session_factory()


# 导入模型类（放在最后避免循环导入）
from .student import StudentModel
from .teacher import TeacherModel
```

```python [models/student.py]
from . import (
    BaseModel,
    Mapped,
    mapped_column,
    int_pk_id,
    name_type,
    age_type,
    gender_type,
    relationship,
    ForeignKey,
)


# 学生表模型
class StudentModel(BaseModel):
    __tablename__ = "students"
    id: Mapped[int_pk_id]
    name: Mapped[name_type]
    age: Mapped[age_type]
    gender: Mapped[gender_type]

    # 多对一: 一个老师对应多个学生, 关联字段, 注意类型使用字符串的形式避免循环导入
    teacher_id: Mapped[int] = mapped_column(ForeignKey("teachers.id"))
    teacher: Mapped["TeacherModel"] = relationship(back_populates="students")

```

```python [models/teacher.py]
from . import (
    BaseModel,
    int_pk_id,
    name_type,
    age_type,
    gender_type,
    created_at_type,
    updated_at_type,
    DateTime,
    String,
    datetime,
    Mapped,
    mapped_column,
    relationship,
)


# 教师表模型
class TeacherModel(BaseModel):
    __tablename__ = "teachers"

    # 使用 Mapped 和 Annotated 定义字段
    id: Mapped[int_pk_id]
    name: Mapped[name_type]
    age: Mapped[age_type]
    gender: Mapped[gender_type]
    birthday: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    telephone: Mapped[str] = mapped_column(String(16), nullable=True)
    teach_subject: Mapped[str] = mapped_column(String(32), nullable=True)
    created_at: Mapped[created_at_type]
    updated_at: Mapped[updated_at_type]
    deleted_at: Mapped[updated_at_type]

    # 一对多: 一个老师对应多个学生, 关联字段
    students: Mapped[list["StudentModel"]] = relationship(back_populates="teacher")
```

:::

### 4.初始化 alembic

```sh
# -t: 指定初始化的模板(alembic list_templates 命令可以查看所有模板)
# ./migration: 指定迁移相关文件存放的目录(一般是 alembic 或 migrations)
uv run alembic init -t generic ./migrations
```

执行命令后项目结构如下:

```txt {2,5-9}
.
├── README.md
├── alembic.ini
├── main.py
├── migrations
│   ├── README
│   ├── env.py
│   ├── script.py.mako
│   └── versions
├── models
│   ├── __init__.py
│   ├── student.py
│   └── teacher.py
├── pyproject.toml
└── uv.lock

5 directories, 14 files
```

### 5.修改迁移配置文件

- 5.1 修改 `alembic.ini`

```txt
sqlalchemy.url = postgres+psycopg2://root:root123456@localhost:5432/demo
```

- 5.2 修改 `migration/env.py`

推荐使用这种方式, 使用代码的方式覆盖 .ini 配置文件的方式

```python
# 1.在文件最上方导入语句的后面假如这些代码
import sys
from pathlib import Path

# 将项目根目录添加到 python path 中
sys.path.insert(0, str(Path(__file__).parent.parent))

from models import DB_URL, BaseModel

# 中间的代码不用改 ...

# 2.找到 target_metadata 变量, 修改它, 加入这两行
# 这个要看 models 中定义的是什么 如果是 Base 就写 Base.metadata
target_metadata = BaseModel.metadata

# 覆盖 alembic.ini 中 sqlalchemy.url 的值
config.set_main_option("sqlalchemy.url", DB_URL)
```

### 6.执行迁移

#### 6.1 生成迁移文件

```sh
# --autogenerate: 表示自动工具模型文件生成迁移文件(SQL)
# -m: 这次迁移的提示信息, 类似 git commit -m "xxx"
uv run alembic revision --autogenerate -m "init migration"
```

迁移文件生成后的目录结构: `migration/versions/目录多了一个 xxx_init_migration.py` 文件

```txt {9-12}
.
├── README.md
├── alembic.ini
├── main.py
├── migrations
│   ├── README
│   ├── env.py
│   ├── script.py.mako
│   └── versions
│       ├── __pycache__
│       │   └── b83644628d1b_init_migration.cpython-312.pyc
│       └── b83644628d1b_init_migration.py
├── models
│   ├── __init__.py
│   ├── __pycache__
│   │   ├── __init__.cpython-312.pyc
│   │   ├── student.cpython-312.pyc
│   │   └── teacher.cpython-312.pyc
│   ├── student.py
│   └── teacher.py
├── pyproject.toml
└── uv.lock
```

#### 6.2 执行迁移

```sh
uv run alembic upgrade head
```

```
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade  -> b83644628d1b, init migration
```

如果出现这样的提示信息, 表示 `操作成功了`, 可以用[数据库GUI客户端](https://www.dbgate.io/zh/)查看,
发现数据库过了一个 `alembic_verions`, 但是 `students` 和 `teachers` 还并没有同步到数据库,
这是因为 `alembic` 在迁移时, 需要对比 `alembic_verions` 这个表中的数据, 如果这个表不存在就会创建

> 也就是说, 第一次执行迁移命令必须执行两次, 因为:

1. 第一次执行数据库中没有 `alembic_verions` 表, 需要创建
2. 真正执行的迁移文件的内容

#### 6.3 再次执行迁移

执行这一步骤之后, 才会真正的将模型同步到数据库表

```sh
uv run alembic upgrade head
```

如果执行没有任何报错, 那么就证明迁移应用成功, 用数据库GUI客户端查看, 数据表是否创建成功

### 7.修改模型字段再次迁移

模拟开发中需求变更, 需要修改数据表的情况

#### 7.1 给 StudentModel 添加一个字段

```python [models/student.py]{11,22}
from . import (
    BaseModel,
    Mapped,
    mapped_column,
    int_pk_id,
    name_type,
    age_type,
    gender_type,
    relationship,
    ForeignKey,
    String,
)


# 学生表模型
class StudentModel(BaseModel):
    __tablename__ = "students"
    id: Mapped[int_pk_id]
    name: Mapped[name_type]
    age: Mapped[age_type]
    gender: Mapped[gender_type]
    class_name: Mapped[str] = mapped_column(String(32), nullable=True)  # 学生所属班级

    # 多对一: 一个老师对应多个学生, 关联字段
    teacher_id: Mapped[int] = mapped_column(ForeignKey("teachers.id"))
    teacher: Mapped["TeacherModel"] = relationship(back_populates="students")
```

#### 7.2 再次生成迁移文件

```python
uv run alembic revision --autogenerate -m "add class_name for students"
```

查看目录结构变化: 发现多了一个 `26770c36bd54_add_class_name_for_students.py` 文件

```txt {10}
.
├── README.md
├── alembic.ini
├── main.py
├── migrations
│   ├── README
│   ├── env.py
│   ├── script.py.mako
│   └── versions
│       ├── 26770c36bd54_add_class_name_for_students.py
│       └── b83644628d1b_init_migration.py
├── models
│   ├── __init__.py
│   ├── student.py
│   └── teacher.py
├── pyproject.toml
└── uv.lock
```

#### 7.3 再次执行迁移

```python
uv run alembic upgrade head
```

此时再次用 数据库 GUI 客户端去查看字段是否添加成功

### 8.撤销迁移

或者叫回退迁移版本, 假如有个迁移被应用了, 需要回退, 可以执行

```sh
# 回退最近的一次迁移
uv run alembic downgrade -1

# uv run alembic downgrade xxx
# 回到指定版本的迁移, 这个 xxx 就是生成迁移文件时的前缀(Revision ID)
# 比如之前生成了一个: b83644628d1b_init_migration.py
# 那么这个迁移文件的 Revision ID 就是: b83644628d1b
# 执行这条命令之后, 在这个版本之后的所有版本都会撤销:
# 比如: uv run alembic downgrade b83644628d1b
# 第一迁移的是: b83644628d1b_init_migration.py
# 后面不管有多少次迁移, 都会全部被撤销, 只留下这个迁移的版本
# 但是注意: 它只会修改数据库表结构, 不会修改你的模型文件代码
```
