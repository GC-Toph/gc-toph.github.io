---
title: 碎片收集者Bernkastel
date: 2025-07-05 00:01:00 +0800
last_modified_at: 2026-05-13 00:02:00 +0800
categories: [不可解, 记忆管理] # 最多两层
tags: [Anki, Bernkastel, 碎片, 拼图]
# toc: false # 关闭目录
---

## 基本原理

全文：[间隔重复](https://ncase.me/remember/)

![不带回忆的遗忘曲线](/assets/images/20250705/sci_b_back.png)
不带回忆的遗忘曲线，指数级衰减

![适时主动回忆的遗忘曲线](/assets/images/20250705/sci_c_back.png)
在黄色区域（不是太难，也不是太简单，难度刚刚好）主动回忆的遗忘曲线，半衰期变长。

同样回忆次数的情况下，效率最大化的方式是逐渐拉长复习时间，并根据每次的难度反馈调整。

## 卡片特性

理想的Anki卡片如同拼图的碎片，

- **小**: 每一张都包含一个独立的知识点，
- **可相互连接**: 但又能与其他卡片相互关联，共同构成一个完整的知识体系，
- **有意义**: 并且每个碎片本身都承载着明确的学习价值。
这种方法有助于学习者构建知识网络，而非孤立地记忆零散信息。

![Small Connected Meaningful](/assets/images/20250705/cards2.png)

![Small Connected Meaningful](/assets/images/20250705/cards.png)

## 流程

### 提取内容

Python库: 
- `PyPDF2`
- `pdfplumber`
- `PyMuPDF4LLM`

### Prompt_1

*   **阶段一：提取核心事实。**
    ```
    请从以上文本中提取所有独立的核心事实和关键概念，以要点的形式列出。
    确保每个要点都是一个原子化的信息单元。
    确保信息单元之间具有逻辑上的递进关系，并能覆盖所有关键知识点。

    [此处粘贴教材中的一节内容]
    ```

*   **阶段二：基于事实生成卡片。**
    ```
    根据以上核心事实列表，为每一个事实生成一张Anki卡片。请遵循以下规则：
    卡片类型：“基本卡片”或“填空题(Cloze Deletion)”
    原子化： 每张卡片只测试一个知识点。
    上下文独立：每张卡片都应包含足够的信息，使其在没有上下文的情况下也能被理解。
    促进关联：在答案或额外字段中，可以适当地引导思考与其他概念的联系。
    输出格式：使用分号或制表符分隔问题和答案，以便于导入Anki。例如：问题1;答案1
    ```

### Prompt_2

```
请从上传的文件中提取所有独立的核心事实和关键概念。
确保信息单元之间具有逻辑上的递进关系，并能覆盖所有关键知识点。
为每一个信息单元生成一张Anki卡片。请遵循以下规则：
卡片类型：基本卡片
原子化： 每张卡片只测试一个知识点。
上下文独立：每张卡片都应包含足够的信息，使其在没有上下文的情况下也能被理解。
促进关联：在答案中，可以适当地引导思考与其他概念的联系。
遵循 Small Connected Meaningful 原则
输出语言：简体中文
输出格式：使用分号分隔问题和答案，以便于导入Anki。例如：问题1;答案1
```

### 图片和公式

*   **图片：** 对于图表、示意图等，可以使用工具（如PyMuPDF4LLM）将图片从PDF中提取出来。一些自动化工具如Anki Decks已经支持自动创建图片遮挡题。
*   **公式：** 使用支持LaTeX的Anki插件

### 生成并导入Anki

生成一个可以被Anki识别的文本文件（如CSV或TXT）。
确保文件中的分隔符（如分号、逗号或制表符）与在Anki导入时选择的一致。

## 例子

### 二分类器指标

```
#separator:tab
#html:true
混淆矩阵比较什么？	比较模型的<b>预测结果</b>与<b>真实情况</b>。
混淆矩阵中的 TP (True Positive) 代表什么？	真实为+，预测也为+<br>&nbsp;(真的有病，模型也说有病)。
混淆矩阵中的 TN (True Negative) 代表什么？	真实为-，预测也为- <br>(真的没病，模型也说没病)。
混淆矩阵中的 FP (False Positive) 代表什么？	真实为-，预测为+ <br>(真的没病，模型说有病)。
混淆矩阵中的 FN (False Negative) 代表什么？	真实为+，预测为- <br>(真的有病，模型说没病)。
混淆矩阵中 T/F 和 P/N 的命名规则是什么？	第一个字母(T/F)代表预测是否正确；<br>第二个字母(P/N)代表模型做出的预测是什么。
FP (False Positive) 通常被称为什么？	误报 (或 假阳性)。
FN (False Negative) 通常被称为什么？	漏报 (或 假阴性)。
准确率 (Accuracy) 的一句话定义是什么？	所有样本中，模型预测正确的比例是多少？<br>混淆矩阵对角线的占比。
在什么情况下，准确率 (Accuracy) 是一个有误导性的指标？	在数据类别不均衡时。<br>例：1000个人里只有1个病人，预测全健康的准确率有99.9%。
精度 (Precision) 的一句话定义是什么？	所有被模型【预测为+】的样本中，真正是+例的比例。<br><br>关心【不误报】，可以理解为“宁可放过，不可杀错”。
在【垃圾邮件过滤】或【股票推荐】场景中，更关注精度还是召回率？为什么？	精度 (Precision)。<br>因为【误报】(FP) 的代价极其高昂<br>（将重要邮件判为垃圾或推荐了错误的股票）。
召回率 (Recall) 的一句话定义是什么？	所有【真实为+】的样本中，被模型成功找出来的比例。<br>关心【不漏报】，可以理解为“宁可杀错，不可放过”。
在【疾病诊断】或【金融反欺诈】场景中，更关注精度还是召回率？为什么？	召回率 (Recall)。<br>因为【漏报】(FN) 的代价极其高昂<br>（漏掉病人或欺诈交易）。
要提高精度，模型需要如何？	模型需要变得更“苛刻”，只有非常有把握时才预测为Positive。<br>这会导致一些模棱两可的样本被放弃，从而降低召回率。
要提高召回率，模型需要如何？	模型需要变得更“宽松”，尽可能多地将样本预测为Positive。<br>这会导致一些本不该是Positive的样本被误判，从而降低精度。
为什么说精度 (Precision) 和召回率 (Recall) 是一对矛盾的指标？	提高精度（要求更严格）通常会牺牲召回率（漏掉更多）；<br>提高召回率（放宽标准）通常会牺牲精度（误报更多）。
F1-Score 的一句话定义是什么？	精度 (Precision) 和召回率 (Recall) 的调和平均数，<br>一个兼顾两者的综合指标。
准确率 (Accuracy) 的公式是什么？	(TP + TN) / (TP + TN + FP + FN)
精度 (Precision) 的公式是什么？	TP / (TP + FP)
召回率 (Recall) 的公式是什么？	TP / (TP + FN)
F1-Score 的公式是什么？	2 * (Precision * Recall) / (Precision + Recall)
如果你希望同时关注精度和召回率，应该使用哪个综合指标？	F1-Score。
ROC曲线的全称是什么？	ROC曲线 (Receiver Operating Characteristic Curve)
ROC 曲线的横轴和纵轴分别是什么？	横轴：假阳性率 (FPR = FP / (FP+TN))；纵轴：真阳性率 (TPR = TP / (TP+FN))，也就是召回率。
AUC 的全称是什么？	Area Under the Curve (ROC曲线下面积)。
AUC 指标的核心优点是什么？	它不受<b>类别不均衡</b>和<b>分类阈值</b>的影响，能全面评估模型的整体排序能力。
AUC=0.5 代表什么？	模型性能相当于<b>随机猜测</b>。
AUC=1 代表什么？	模型是<b>完美</b>的分类器。
当需要评估模型整体的【排序能力】而非特定阈值下的表现时，哪个指标最合适？	AUC。
```


### git

```
#separator:tab
#html:true
Git 与 SVN 的主要区别是什么	Git 是分布式版本控制系统，每个本地仓库都是完整仓库，而 SVN 是集中式版本控制系统。	
Git 中仓库（Repository）指的是什么	Git 仓库是用来存储代码、历史记录和分支信息的目录。	
Git 中工作区（Working Directory）指的是什么	工作区是用户正在编辑的文件所在的本地目录。	
Git 中暂存区（Staging Area）是什么	暂存区是 Git 用来记录将要提交到版本库文件的临时区域。	
如何初始化一个新的 Git 仓库	使用命令 <b>git init</b> 可以在当前目录初始化一个新的 Git 仓库。	
如何将文件添加到暂存区	使用命令 <b>git add &lt;文件名&gt;</b> 可以将文件添加到暂存区。	
如何提交暂存区的内容到本地仓库	"使用命令 <b>git commit -m ""提交信息""</b> 可以提交暂存区的内容。"	
<b>.gitignore&nbsp;</b>文件的作用是什么	用于指定哪些文件或目录需要被 Git 忽略（不纳入版本控制），常用于排除编译生成的文件、依赖包（如 node_modules）、日志文件或本地配置文件。	
Git 中 HEAD 指的是什么	HEAD 指向当前分支的最新提交。	
什么是 Detached HEAD 状态	当 HEAD 指向一个具体的 commit ID 而不是分支名时，就处于 detached HEAD 状态。在此状态下提交的更改不会关联到任何分支，容易丢失。通常发生在检出特定标签或旧提交时。	
Git 中分支（Branch）的作用是什么	分支用于并行开发，允许在不影响主分支的情况下进行修改。	
如何创建一个新的分支	使用命令<b> git branch &lt;分支名&gt;</b> 创建新的分支。	
如何将当前分支重命名为 main ?	使用命令 <b>git branch -m main</b>&nbsp;重命名。	
如何查看分支列表	使用命令 <b>git branch</b>&nbsp;可以查看本地分支列表，<b>git branch -a</b>&nbsp;查看所有分支。	
如何切换分支	使用命令 <b>git checkout &lt;分支名&gt;</b>&nbsp;可以切换到指定分支。	
创建并切换分支的快捷方式	使用命令 <b>git checkout -b &lt;分支名&gt;</b>&nbsp;可以创建并切换到新分支。	
如何合并分支	使用命令 <b>git merge &lt;分支名&gt;</b>&nbsp;可以将指定分支合并到当前分支。	
Git 中冲突（Conflict）是什么	当同一文件的同一部分在不同分支修改且合并时，Git 无法自动合并，就产生冲突。	
如何查看提交历史	使用命令 <b>git log</b>&nbsp;可以查看提交历史，<b>git log --oneline</b> 简化显示。	
Git 中远程仓库（Remote Repository）是什么	远程仓库是托管在服务器上的 Git 仓库，用于团队协作。	
如何添加远程仓库	使用命令 <b>git remote add &lt;名字&gt; &lt;URL&gt;</b>&nbsp;可以添加远程仓库。	
如何将本地提交推送到远程仓库	使用命令 <b>git push &lt;远程名&gt; &lt;分支名&gt;</b>&nbsp;可以推送提交。	
如何从远程仓库拉取更新	使用命令 <b>git pull &lt;远程名&gt; &lt;分支名&gt;</b>&nbsp;可以获取并合并远程更新。相当于 <i>git fetch + git merge</i>	
<b>git push -u &lt;远程名&gt; &lt;分支名&gt;</b>&nbsp;的作用是什么	`-u` 是 `--set-upstream` 的缩写。<br>它不仅将本地分支推送到远程，还会建立本地分支与远程分支的追踪关系。<br>之后在该分支上只需输入 `git push` 或 `git pull`，无需再指定远程名和分支名。	
Git 中标签（Tag）的作用是什么	标签用于标记特定的提交点，常用于发布版本。	
如何创建一个标签	"使用命令 <b>git tag &lt;标签名&gt;</b>&nbsp;可以创建轻量标签，<b>git tag -a &lt;标签名&gt; -m ""信息""</b> 创建带注释标签。"	
如何查看标签列表	使用命令 <b>git tag</b> 查看仓库中的所有标签。	
如何撤销工作区的修改（未 add）	使用命令 <b>git restore &lt;文件名&gt;</b> 可以丢弃工作区中未暂存的修改，恢复到最后一次提交或暂存的状态。	
如何撤销暂存区的文件（已 add 未 commit）	使用命令 <b>git restore --staged &lt;文件名&gt;</b> 可以将文件从暂存区移除，但保留工作区的修改。	
如何修改最近一次提交（Commit）	如果刚提交后发现漏了文件或写错了信息，可以使用 <b>git commit --amend</b>。<br>它会<b>将当前暂存区的内容合并到上一次提交中，并允许修改提交信息</b>。<br><br>注意：不要对已推送到远程的公共提交使用此命令。	
大文件处理建议	Git 不适合存储大型二进制文件（如视频、高清图片、数据库 dump）。<br>这会导致仓库体积迅速膨胀，克隆和拉取变慢。<br>建议使用 Git LFS (Large File Storage) 来管理大文件，或者将其排除在版本控制之外。	
```

### tmux

```python
import genanki
import hashlib
import markdown

# =======================
# 1. 定义 cards 列表
# =======================

deck_name = "tmux"

cards_raw = [
    (
        "tmux 的作用是什么？",
        "tmux (Terminal Multiplexer) 允许在单个终端 (Terminal) 中运行多个会话 (Session)、窗口 (Window) 和窗格 (Pane)。支持会话分离 (Detach) 与恢复 (Attach)，即使网络断开或关闭终端，后台进程仍会持续运行，适合远程开发和长期任务。",
    ),
    (
        "tmux 的层级结构？",
        "三层结构：\n1. **会话 (Session)**：包含一组窗口\n2. **窗口 (Window)**：类似浏览器标签\n3. **窗格 (Pane)**：窗口内的独立 shell",
    ),
    (
        "如何启动 tmux 会话？",
        "```bash\ntmux                 # 启动默认新会话\ntmux new -s <会话名> # 启动指定名称新会话\n```",
    ),
    (
        "如何列出当前 tmux 会话？",
        "使用命令 `tmux ls` 或 `tmux list-sessions` 查看当前所有会话及状态。",
    ),
    (
        "如何附加到已有会话？",
        "使用命令 `tmux attach -t <会话名>` 或简写 `tmux a -t <会话名>`。若只有一个会话，可直接 `tmux a`。",
    ),
    (
        "如何分离 tmux 会话？",
        "按下前缀键 `Ctrl+b` 后按 `d` (detach)，会将当前会话放入后台运行。",
    ),
    ("如何创建新窗口？", "按下 `Ctrl+b` 后按 `c` (create)，在当前会话中创建新窗口。"),
    (
        "如何在窗口之间切换？",
        "`Ctrl+b n`：下一个窗口\n`Ctrl+b p`：上一个窗口\n`Ctrl+b <数字>`：切换到指定编号窗口\n`Ctrl+b w`：交互式窗口选择",
    ),
    ("如何重命名窗口？", "按 `Ctrl+b ,` (comma) 自定义当前窗口名称，便于识别用途。"),
    ("如何关闭窗口？", "在窗口中输入 `exit` 或 `Ctrl+d` 并确认关闭当前窗口。"),
    ("如何在 tmux 中分屏？", '`Ctrl+b %`：垂直分屏\n`Ctrl+b "`：水平分屏'),
    (
        "如何在分屏间切换？",
        "`Ctrl+b` + 方向键：移动到相邻窗格\n`Ctrl+b o`：循环切换到下一个窗格\n`Ctrl+b ;`：切换到上一次活跃窗格",
    ),
    (
        "如何调整 Pane 大小？",
        "方法一：`Ctrl+b` + `Ctrl` + 方向键\n方法二：`Ctrl+b` + `Alt` + 方向键\n方法三：`Ctrl+b z` 最大化/还原当前窗格",
    ),
    ("如何关闭分屏？", "在窗格中输入 `exit` 或 `Ctrl+d` 并确认关闭当前窗格"),
    ("如何交换窗格位置？", "`Ctrl+b {` 或 `Ctrl+b }` 与相邻窗格交换位置"),
    ("如何将窗格提升为独立窗口？", "`Ctrl+b !` (break-pane) 将当前窗格变成独立窗口"),
    (
        "如何使用复制模式 (Copy Mode)？",
        "进入复制模式：`Ctrl+b [`\n方向键/Vim 移动光标\nSpace 开始选择，Enter 确认复制\n粘贴：`Ctrl+b ]`",
    ),
    ("如何查找会话内容？", "复制模式下按 `/` 可搜索历史输出"),
    (
        "tmux 配置文件位置？",
        "用户级配置文件位于 `~/.tmux.conf`，修改后需重启 tmux 或运行 `tmux source-file ~/.tmux.conf`",
    ),
]

cards = [
    (
        markdown.markdown(q, extensions=["extra"]),
        markdown.markdown(a, extensions=["extra"]),
    )
    for q, a in cards_raw
]

# =======================
# 2. 根据内容生成 Deck ID
# =======================
all_text = "".join([q + a for q, a in cards])
hash_bytes = hashlib.sha256(all_text.encode("utf-8")).digest()
deck_id = int.from_bytes(hash_bytes[:4], "little", signed=False)

# =======================
# 3. 创建 Deck 和 Model
# =======================
deck = genanki.Deck(deck_id, deck_name)

model = genanki.Model(
    731802524,
    "Markdown Model",
    fields=[{"name": "Question"}, {"name": "Answer"}],
    templates=[
        {
            "name": "Card 1",
            "qfmt": "{{Question}}",
            "afmt": '{{FrontSide}}<hr id="answer">{{Answer}}',
        }
    ],
    css="""
.card, .card p, .card li, .card h1, .card h2, .card h3 {
    font-family: "Consolas", "Monaco", monospace;
    font-size: 14px;
    color: #303030;
}

.card pre {
    background-color: #f4f4f4;
    padding: 6px;
    border-radius: 4px;
    overflow-x: auto;
}

.card code {
    background-color: #bbb;
    padding: 2px 4px;
    border-radius: 3px;
}

.card pre code {
    background-color: transparent;
    padding: 0;
}
    """,
)

# =======================
# 4. 添加卡片
# =======================
for q, a in cards:
    deck.add_note(genanki.Note(model=model, fields=[q, a]))

# =======================
# 5. 生成 apkg 文件
# =======================
genanki.Package(deck).write_to_file("tmux.apkg")
print(f"tmux.apkg 已生成，Deck ID={deck_id}")
```

![warning](/assets/images/warning.jpg)
