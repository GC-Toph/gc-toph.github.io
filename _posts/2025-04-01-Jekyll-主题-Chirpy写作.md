---
title: Chirpy写作
date: 2025-04-01 00:00:00 +0800
last_modified_at: 2025-04-03 00:00:00 +0800
categories: [Meta] # 最多两层
tags: [Meta, Jekyll, Chirpy]
# toc: false # 关闭目录
math: true
mermaid: true # diagram generation
---

## 搭建

[使用Jekyll + GitHub Pages搭建个人博客](https://zzy979.github.io/posts/creating-personal-blog-site/)

### 安装

[ruby](https://rubyinstaller.org/downloads/)

将`MSYS2`目录添加到环境变量中

```bash
ridk
ridk enable
```

检查

```bash
ruby -v
gem -v
```

安装`jekyll`

``` bash
gem install jekyll bundler
jekyll -v
```

安装依赖的theme模板库，在项目目录运行 `bundle`

使用:

构建 `jekyll build` 或 `jekyll b`

本地部署 `jekyll serve` 或 `jekyll s`

## 写作

[Writing a New Post](https://chirpy.cotes.page/posts/write-a-new-post/)

[Text and Typography](https://chirpy.cotes.page/posts/text-and-typography/)

## blockquote

> 一个领域专家的标准：犯过这个领域内几乎所有的错误。
{: .prompt-tip }

> For we walk by faith, not by sight.
{: .prompt-info }

> 己所不欲，勿施于人。
{: .prompt-warning }

> 很多东西更重要，不要浪费在根本**不存在**的东西上。欺骗、狂妄、病态的利己主义、满腹怨恨、极端自怜、受害妄想症，这些都阻止成功。你们要找到所有这些阻碍成功的东西，将它们当作瘟疫，绕道而走。 -- 查理芒格 2017
{: .prompt-danger }

> God grant me the serenity to accept the things I can not change,\
请赐我平静的心，去接受我无法改变的事；\
courage to change the things I can,\
赐我勇气，去改变我能够改变的事；\
And the wisdom to know the difference.\
并赐我智慧，去分辨这两者的不同。

## 代码

```bash
echo lambda
```

```
delta
```

## 公式

$$
\lambda \delta
$$

$$
\Lambda \Delta
$$

## mermaid

### demo

```mermaid
graph TD;
    A[Start] --> B[Decision];
    B -->|Yes| C[Do Task];
    B -->|No| D[End];
```

### Flowchart

```mermaid
graph LR;
    A[User logs in] --> B{Valid credentials?};
    B -->|Yes| C[Grant access];
    B -->|No| D[Show error];
    C --> E[Load dashboard];
```

### Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant System
    User->>System: Login request
    System-->>User: Authenticate
    System->>Database: Verify credentials
    Database-->>System: Credentials valid
    System-->>User: Access granted
```

### Class Diagram

```mermaid
classDiagram
    Animal <|-- Dog
    Animal <|-- Cat
    Animal : +String name
    Animal : +int age
    Animal : +makeSound()
    Dog : +fetch()
    Cat : +scratch()
```

### Gantt Chart  

```mermaid
gantt
    title Project Timeline
    dateFormat  YYYY-MM-DD
    section Phase 1
    Task A       :a1, 2023-10-01, 5d
    Task B       :after a1, 3d
    section Phase 2
    Task C       :2023-10-10, 4d
```

### Customizing Appearance 

```mermaid
graph TD;
    A[Start] --> B[Process];
    B --> C[End];
    style A fill:#f96,stroke:#333,stroke-width:2px;
    style C fill:#bbf,stroke:#333,stroke-width:2px;
```

### schema

```mermaid
graph TD
    subgraph Entities
        U[用户 User]
        T[推文 Tweet]
        TG[标签 Tag]
        C[分类 Category]
    end

    subgraph Relationships
        U -- FOLLOWS --> U
        U -- POSTS --> T
        U -- LIKES --> T
        T -- HAS_TAG --> TG
        TG -- HAS_TYPE --> C
        U -- HAS_INTEREST --> TG
    end

    style U fill:#87CEEB
    style T fill:#98FB98
    style TG fill:#FFD700
    style C fill:#FFA07A
```

![warning](/assets/images/warning.jpg)
