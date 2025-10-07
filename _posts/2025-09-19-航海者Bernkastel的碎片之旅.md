---
title: 航海者Bernkastel的碎片之旅
date: 2025-09-19 00:01:00 +0800
last_modified_at: 2025-09-19 00:02:00 +0800
categories: [AI] # 最多两层
tags: [flow matching]
# toc: false # 关闭目录
math: true
---


## 连续性方程

### 概念

连续性方程描述的是概率密度在空间和时间中的守恒关系。

设有一个随机过程 $$ \mathbf{X}(t) \in \mathbb{R}^n $$，其概率密度函数为 $$ \rho(\mathbf{x}, t) $$

满足归一化条件：

$$
\int_{\mathbb{R}^n} \rho(\mathbf{x}, t) \, d^n x = 1, \quad \forall t
$$

假设该过程存在**概率流密度矢量场**（probability current density）：

$$
\mathbf{J}(\mathbf{x}, t) \in \mathbb{R}^n
$$

它表示单位时间内通过单位面积的概率流量。

> 两种视角：
> - 拉格朗日视角（Lagrangian Perspective）跟踪**粒子**本身的运动轨迹和状态，而
> - 欧拉视角（Eulerian Perspective）则关注**空间中固定点**上的流体状态变化。

---

### 欧拉视角：局部概率守恒

考虑空间中任意体积元 $$ V \subset \mathbb{R}^n $$，其边界为 $$ \partial V $$。那么：

- **体积内总概率的变化率** = **流入该体积的净概率流**


$$
\frac{d}{dt} \int_V \rho(\mathbf{x}, t) \, d^n x = - \oint_{\partial V} \mathbf{J}(\mathbf{x}, t) \cdot d\mathbf{S}
$$

> **说明**：右侧的负号是因为 $$d\mathbf{S}$$ 通常定义为指向外的法向量。若流矢量 $$\mathbf{J}$$ 指向外（$$\mathbf{J} \cdot d\mathbf{S} > 0$$），则概率流出，导致体积 $$V$$ 内的概率减少。

由于体积 $$V$$ 是在空间中固定的（欧拉视角），不随时间变化，所以时间导数可以和空间积分交换顺序，即：$$ \frac{d}{dt} \int_V \rho(\mathbf{x}, t) \, d^n x = \int_V \frac{\partial \rho(\mathbf{x}, t)}{\partial t} \, d^n x $$

根据**散度定理（Gauss 定理）**  ($$\nabla \cdot$$ 是 n 维空间中的散度算子)：$$ \oint_{\partial V} \mathbf{J} \cdot d\mathbf{S} = \int_V \nabla \cdot \mathbf{J} \, d^n x $$


所以：

$$
\int_V \frac{\partial \rho}{\partial t} \, d^n x = - \int_V \nabla \cdot \mathbf{J} \, d^n x
$$

由于体积 $$ V $$ 是任意选取的，被积函数必须处处相等：

$$
\boxed{
\frac{\partial \rho}{\partial t} + \nabla \cdot \mathbf{J} = 0
}
$$

### 流密度 $$\mathbf{J}$$ 的具体形式

$$\mathbf{J}$$ 的具体形式依赖于具体的动力学模型。

#### 漂移-扩散过程（Fokker-Planck 方程）

若粒子服从朗之万方程：

$$
d\mathbf{X}_t = \boldsymbol{\mu}(\mathbf{X}_t, t)\, dt + \boldsymbol{\sigma}(\mathbf{X}_t, t)\, d\mathbf{W}_t
$$

$$ d\mathbf{W}_t $$ 是维纳过程（布朗运动）的无穷小增量，它有以下关键特性：
*   它的期望（均值）是 0。
*   它的方差是 $$dt$$。这意味着它的标准差，也就是它的大小尺度，是 $$ \sqrt{dt} $$。

$$
\frac{d\mathbf{X}_t}{dt} = \boldsymbol{\mu}(\mathbf{X}_t, t) + \boldsymbol{\sigma}(\mathbf{X}_t, t) \frac{d\mathbf{W}_t}{dt}
$$


$$ \frac{d\mathbf{W}_t}{dt} $$ 这一项的尺度是 $$ \frac{\sqrt{dt}}{dt} = \frac{1}{\sqrt{dt}} $$。

当 $$ dt \to 0 $$ 时，$$ \frac{1}{\sqrt{dt}} \to \infty $$！

这意味着：
1.  **单个粒子的瞬时速度是无穷大的、没有良好定义的**。
2.  粒子的运动轨迹是**连续的**，但**处处不可微**。它的路径充满了无限微小的剧烈抖动。

所以，对于单个随机粒子，我们无法像在经典力学中那样谈论一个光滑的、良定义的瞬时速度。

上面讨论的 $$ \frac{d\mathbf{X}_t}{dt} $$。它在数学上是病态的，无法用于描述一个平滑的“流场”。

宏观速度：概率流的速度 $$ \mathbf{v} = \mathbf{J}/\rho $$ 不是某一个粒子的速度，而是在空间中的**一个点**，概率的整体是如何流动的？


对应的 Fokker-Planck 方程为：

$$
\frac{\partial \rho}{\partial t} = -\nabla \cdot (\boldsymbol{\mu} \rho) + \nabla \cdot (D \nabla \rho)
$$

其中 $$ D = \frac{1}{2} \boldsymbol{\sigma} \boldsymbol{\sigma}^\top $$ 是扩散张量。

将其写成连续性方程形式：

$$
\frac{\partial \rho}{\partial t} + \nabla \cdot \mathbf{J} = 0
\quad \text{其中} \quad
\boxed{
    \mathbf{J} = \boldsymbol{\mu} \rho - D \nabla \rho
}
$$


其中
*   **漂移流 (Drift Current)**: $$ \mathbf{J}_{\text{drift}} = \boldsymbol{\mu} \rho $$。这一项描述了概率密度由于受到确定性力场（由漂移项 $$\boldsymbol{\mu}$$ 描述）的驱动而产生的整体平移。概率“粒子”倾向于顺着场 $$\boldsymbol{\mu}$$ 的方向移动。
*   **扩散流 (Diffusion Current)**: $$ \mathbf{J}_{\text{diffusion}} = - D \nabla \rho $$。这一项是**芬克第一定律 (Fick's First Law)** 的概率版本。它描述了概率从高密度区域流向低密度区域的趋势，其方向与概率密度梯度 $$\nabla \rho$$ 相反。$$D$$ 是扩散系数，衡量扩散的快慢。

#### 确定性流（无扩散）

若系统完全由速度场 $$\mathbf{v}(\mathbf{x}, t)$$ 驱动：

$$
\frac{d\mathbf{x}}{dt} = \mathbf{v}(\mathbf{x}, t)
$$

则概率流为：

$$
\boxed{
\mathbf{J} = \mathbf{v} \rho
}
$$

连续性方程变为：

$$
\frac{\partial \rho}{\partial t} + \nabla \cdot (\mathbf{v} \rho) = 0
$$

<!-- 
### 拉格朗日(粒子)视角：$$\ln \rho(\mathbf{x}, t)$$ 对时间 $$t$$ 的随体导数(全导数)

$$ \ln \rho(\mathbf{x}(t), t) $$ 是关于时间 $$t$$ 的复合函数。对其求全导数：

$$
\frac{d}{dt} \ln \rho(\mathbf{x}(t), t) 
= \frac{\partial}{\partial t} \ln \rho + \nabla \ln \rho \cdot \frac{d\mathbf{x}}{dt}
= \frac{1}{\rho} \frac{\partial \rho}{\partial t} + \frac{1}{\rho} \nabla \rho \cdot \dot{\mathbf{x}}
$$

其中 $$\dot{\mathbf{x}} = \frac{d\mathbf{x}}{dt}$$ 是粒子在空间中的瞬时速度。

连续性方程：

$$
\frac{\partial \rho}{\partial t} + \nabla \cdot \mathbf{J} = 0
$$

而确定性流的 $$\mathbf{J}$$ 可写成：

$$
\mathbf{J} = \rho \mathbf{v}
$$

其中 $$\mathbf{v}(\mathbf{x}, t)$$ 是速度场（这不一定是单个粒子的速度，而是描述概率密度输运的宏观场）

代入连续性方程：

$$
\frac{\partial \rho}{\partial t} = - \nabla \cdot (\rho \mathbf{v})
= - \rho \nabla \cdot \mathbf{v} - \mathbf{v} \cdot \nabla \rho
$$

代回原式：

$$
\frac{d}{dt} \ln \rho 
= \frac{1}{\rho} \left[ - \rho \nabla \cdot \mathbf{v} - \mathbf{v} \cdot \nabla \rho + \nabla \rho \cdot \dot{\mathbf{x}} \right]
= - \nabla \cdot \mathbf{v} + \frac{1}{\rho} \nabla \rho \cdot (\dot{\mathbf{x}} - \mathbf{v})
$$

---

对于确定性流，$$ \dot{\mathbf{x}} = \mathbf{v}(\mathbf{x}(t), t) $$


$$
\boxed{
\frac{d}{dt} \ln \rho(\mathbf{x}(t), t) = - \nabla \cdot \mathbf{v}(\mathbf{x}(t), t)
}
$$ -->



## 现代生成模型

**核心思想**：生成模型学习一个从简单先验分布（如高斯分布 $$ p_0(\mathbf{z}) $$）到复杂数据分布 $$ p_{data}(\mathbf{x}) $$ 的映射。我们可以将这个演化过程看作是概率“流体”从一个形状（高斯分布）变换到另一个形状（数据分布）的过程。

### 扩散模型 (Diffusion Models)

扩散模型通过两个过程来工作：一个**前向过程**将数据变成噪声，一个**反向过程**将噪声变回数据。

**A. 前向过程：数据 → 噪声**

对应于**漂移-扩散过程**。人为设计一个随机过程（SDE），逐渐地将任意数据点 $$ \mathbf{X}_0 \sim p_{data} $$ 转化为一个标准高斯噪声点 $$ \mathbf{X}_T \sim \mathcal{N}(0, I) $$。一个常见的 SDE 形式是：
$$
d\mathbf{X}_t = -\frac{1}{2} \beta(t) \mathbf{X}_t dt + \sqrt{\beta(t)} d\mathbf{W}_t
$$


* $$ \beta(t) $$: 一个预先设定的噪声调度表。

*   **漂移项**: $$ \boldsymbol{\mu}(\mathbf{X}_t, t) = -\frac{1}{2} \beta(t) \mathbf{X}_t $$。这个力的方向与位移相反，因此是向心力，指向原点。
*   **扩散项**: $$ \boldsymbol{\sigma}(\mathbf{X}_t, t) = \sqrt{\beta(t)} \mathbf{I} $$。持续地注入高斯噪声。

**B. 反向过程：噪声 → 数据**

扩散式生成模型的核心是**逆转**上述过程。

一个数学结论：任何一个漂移-扩散过程，其时间反向过程也是一个漂移-扩散过程。反向过程的 SDE 为：

$$
d\mathbf{X}_t = \left[ -\frac{1}{2} \beta(t) \mathbf{X}_t - \beta(t) \nabla_{\mathbf{x}} \log \rho(\mathbf{x}, t) \right] dt + \sqrt{\beta(t)} d\mathbf{W}_t
$$

这里的 $$ \nabla_{\mathbf{x}} \log \rho(\mathbf{x}, t) $$ 被称为**分数 (Score)**。

*   **模型目标**：我们无法知道真实的 $$ \rho(\mathbf{x}, t) $$，因此也无法知道分数。扩散模型就是训练一个深度神经网络 $$ \mathbf{s}_\theta(\mathbf{x}, t) $$ 来近似这个分数函数： $$ \mathbf{s}_\theta(\mathbf{x}, t) \approx \nabla_{\mathbf{x}} \log \rho(\mathbf{x}, t) $$。
*   **生成过程**：一旦网络训练好了，从 $$ \mathbf{z} \sim \mathcal{N}(0, I) $$ 出发，使用学到的分数来模拟反向 SDE，从时间 T 积分到 0，最终得到的 $$ \mathbf{X}_0 $$ 就是一个生成的样本。


### 流匹配 (Flow Matching) 与确定性流

[https://github.com/helblazer811/Diffusion-Explorer](https://github.com/helblazer811/Diffusion-Explorer)

[Diffusion-Explorer](https://alechelbling.com/Diffusion-Explorer/)

[tutorial video](https://www.bilibili.com/video/BV1cRwJeREgk/)

[tutorial video 2](https://www.bilibili.com/video/BV1pafRY2EQG/)

Flow Matching 假设概率密度的演化是由一个**确定性的速度场** $$ \mathbf{v}(\mathbf{x}, t) $$ 驱动的。

$$
\frac{\partial \rho}{\partial t} + \nabla \cdot (\mathbf{v} \rho) = 0
$$

这个方程描述粒子的轨迹都遵循一个常微分方程 (ODE)：

$$
\frac{d\mathbf{x}}{dt} = \mathbf{v}(\mathbf{x}, t)
$$

**A. 核心思想**
我们想学习一个速度场 $$ \mathbf{v}_\theta(\mathbf{x}, t) $$，使得如果我们从一个简单的先验分布 $$ p_0(\mathbf{z}) $$ 中采样一个点 $$ \mathbf{z} $$，然后根据 $$ \frac{d\mathbf{x}}{dt} = \mathbf{v}_\theta(\mathbf{x}, t) $$ 从 t=0 积分到 t=1，最终得到的点 $$ \mathbf{x}(1) $$ 的分布恰好是数据分布 $$ p_{data} $$。

**B. "Matching" 的含义**
直接学习这个理想的 $$ \mathbf{v} $$ 非常困难。Flow Matching 的贡献在于，它证明了我们不需要学习这个复杂的marginal速度场。我们可以定义一个更简单的、条件的(conditional)速度场。

例如，我们可以定义一个从噪声 $$ \mathbf{x}_0 $$ 到数据 $$ \mathbf{x}_1 $$ 的直线路径：
$$
\mathbf{x}(t) = (1-t) \mathbf{x}_0 + t \mathbf{x}_1
$$

这个路径对应的瞬时速度是恒定的：
$$
\mathbf{u}(\mathbf{x}(t) | \mathbf{x}_0, \mathbf{x}_1) = \mathbf{x}_1 - \mathbf{x}_0
$$

Flow Matching 证明了，我们只需要训练神经网络 $$ \mathbf{v}_\theta(\mathbf{x}, t) $$ 去**匹配**这个简单的条件速度场 $$ \mathbf{u} $$ 的期望即可。训练目标大致是：

$$
\min_\theta \mathbb{E}_{t, \mathbf{x}_0, \mathbf{x}_1} \left\| \mathbf{v}_\theta((1-t) \mathbf{x}_0 + t \mathbf{x}_1, t) - (\mathbf{x}_1 - \mathbf{x}_0) \right\|^2
$$

---
<!-- 
### 寻找高密度中心 (mode)

$$ \frac{d}{dt} \ln \rho(\mathbf{x}(t), t) = - \nabla \cdot \mathbf{v}(\mathbf{x}(t), t) $$ 

若在生成过程的每一步，不仅根据学到的速度场 $$ \mathbf{v}_\theta $$ 来更新位置 $$ \mathbf{x} $$，还可以额外地沿着引导向量 $$ \mathbf{g}(\mathbf{x}, t) = \nabla [ - \nabla \cdot \mathbf{v}_\theta(\mathbf{x}, t)] $$ 移动一小步。这会使得生成的样本更有可能落入数据分布的**高密度区域**，可能会提高生成样本的质量和典型性。


分析计算成本。

假设输入 $$ \mathbf{x} \in \mathbb{R}^D $$ (例如，对于 CIFAR-10 图像，$$ D = 3 \times 32 \times 32 = 3072 $$)，神经网络 $$ \mathbf{v}_\theta: (\mathbb{R}^D, \mathbb{R}) \to \mathbb{R}^D $$。

散度的定义是 $$ \nabla \cdot \mathbf{v}_\theta = \sum_{i=1}^D \frac{\partial v_i}{\partial x_i} $$。这是雅可比矩阵 $$ J_{ij} = \frac{\partial v_i}{\partial x_j} $$ 的对角线元素之和，即迹 (Trace)。

**精确计算迹的方法**：
在 PyTorch 中，可以通过多次反向传播来精确计算。对 $$ \mathbf{v}_\theta $$ 的每个输出分量 $$ v_i $$，分别对输入分量 $$ x_i $$ 求梯度，然后加起来。
```python
# 伪代码
trace = 0
for i in range(D):
    # 对第 i 个输出分量，关于所有输入求梯度
    grad_outputs = torch.zeros_like(v_output)
    grad_outputs[:, i] = 1
    grads = torch.autograd.grad(outputs=v_output, inputs=x_input, grad_outputs=grad_outputs, create_graph=True)[0]
    # 只取对角线元素
    trace += grads[:, i]
```
*   **计算复杂度**：这需要进行 D 次反向传播。如果一次标准的反向传播成本为 C，那么计算散度的成本就是 $$ O(D \times C) $$。这对于高维数据来说是**无法承受**的。

**总体计算成本**

*   **一次标准生成步骤**：计算 $$ \mathbf{v}_\theta(\mathbf{x}, t) $$，成本为一次前向传播，约为 $$ C/2 $$。
*   **一次带引导的生成步骤**：
    1.  计算散度：$$ O(D \times C) $$
    2.  计算散度的梯度：$$ O(C) $$

    总成本约为 $$ O(D \times C) $$。

**实际成本估算**:
假设在 CIFAR-10 ($$D=3072$$) 上，一次标准的生成步骤（前向传播）需要 50 毫秒。一次反向传播大约需要 100 毫秒 (C ≈ 100ms)。

*   标准生成：**50 毫秒/步**
*   带引导项的生成：$$ 3072 \times 100 \text{ms} + 100 \text{ms} \approx 307.3 \text{秒/步} $$

精确计算的成本高了约 **6000 倍**，这在实践中是完全不可行的。

**Hutchinson 迹估计器 (Hutchinson's Trace Estimator)**。

**原理**: 对于任何矩阵 A，它的迹可以被随机估计

$$
\text{Tr}(A) = \mathbb{E}_{\mathbf{u}} [\mathbf{u}^\top A \mathbf{u}]
$$

其中 $$ \mathbf{u} $$ 是一个随机向量，其协方差矩阵是单位矩阵。

对于该问题，$$ A $$ 是雅可比矩阵 $$ J $$，$$\mathbf{u}^\top J \mathbf{u} = \mathbf{u}^\top (\nabla_{\mathbf{x}} \mathbf{v}_\theta) \mathbf{u}$$ 可以被看作是先计算 $$ (\nabla_{\mathbf{x}} \mathbf{v}_\theta) \mathbf{u} $$，这个结果可以通过一次 vjp 得到，然后再与 $$ \mathbf{u} $$ 做点积。

**PyTorch 代码实现**:
```python
import torch

def get_guidance_vector(v_model, x, t):
    """
    计算引导向量 g(x, t) = ∇[- ∇·v(x, t)] 的随机估计。
    """
    x.requires_grad_(True)
    
    # 步骤 1: 估计散度 ∇·v
    # 使用 Hutchinson 迹估计器，这里为了简单只用一个样本 u
    # 在实际应用中可以采样多个 u 然后取平均以获得更准的估计
    u = torch.randn_like(x) # 或者用 rademacher 分布（每个元素等概率取 +1 或 -1）
    
    v = v_model(x, t)
    
    # 计算第一个 vjp: (∇v)·u
    # autograd.grad 计算的是 d_outputs/d_inputs · grad_outputs，所以我们让 grad_outputs=u
    vjp_u = torch.autograd.grad(outputs=v, inputs=x, grad_outputs=u, create_graph=True)[0]
    
    # 计算 u·(∇v)·u，这就是散度的估计
    divergence_estimate = torch.sum(u * vjp_u) # 点积

    # 步骤 2: 计算散度估计的梯度
    # autograd.grad 计算 ∇[divergence_estimate]
    guidance_vector_estimate = torch.autograd.grad(outputs=divergence_estimate, inputs=x, create_graph=False)[0]
    
    x.requires_grad_(False)
    
    return -guidance_vector_estimate
```

> **说明**: `create_graph=True` 告诉 PyTorch 在计算第一个梯度（`vjp_u`）时保留计算图，这样我们才能对结果（`divergence_estimate`）再次求导。这会消耗更多内存，但是实现高阶导数的标准方法。
>
> 这种随机估计方法将计算引导项的成本从 $$O(D \cdot C)$$ 降低到与**两次**标准反向传播相当的 $$O(C)$$，使其在实践中变得可行。 -->

## 附 torch.autograd.grad (vjp: vector-Jacobian product)

`torch.autograd.grad` 是在计算 **vector-Jacobian product（向量-雅可比积）**。

假设：

- 输入：$$ x ∈ R^N $$
- 输出：$$ y = f(x) ∈ R^M $$
- 雅可比矩阵：$$ J = ∂y/∂x ∈ R^{M×N} $$，其中 $$ J[i, j] = ∂y_i / ∂x_j $$


```python
grads = torch.autograd.grad(
    outputs=y,           # shape (M,)
    inputs=x,            # shape (N,)
    grad_outputs=v       # shape (M,)
)[0]                     # 返回 shape (N,)
```

计算的是：

$$ grads = v^T ⋅ J ∈ R^N $$


这正是 **vector-Jacobian product** —— 用向量 `v` 左乘雅可比矩阵 `J`。

### 链式法则视角

在神经网络反向模式中通常计算：

> `dL/dx = (dL/dy) ⋅ (∂y/∂x) = v^T ⋅ J`

其中：

- `dL/dy` 是上游梯度（标量损失对输出的梯度）`grad_outputs`
- `∂y/∂x` 是当前函数的雅可比
- `dL/dx` 是最终传播到输入的梯度


## 附 Time Reversal of Diffusions

### 反向过程 SDE

给定前向过程的 SDE：

$$
d\mathbf{X}_t = \boldsymbol{\mu}(\mathbf{X}_t, t) dt + \boldsymbol{\sigma}(t) d\mathbf{W}_t
$$

其对应的反向过程（从时间 T 到 0）由以下 SDE 描述：

$$
\boxed{
d\mathbf{X}_t = \left[ -\boldsymbol{\mu}(\mathbf{X}_t, t) + \boldsymbol{\sigma}(t)^2 \nabla_{\mathbf{X}_t} \log p_t(\mathbf{X}_t) \right] dt + \boldsymbol{\sigma}(t) d\mathbf{\bar{W}}_t
}
$$

其中 $$ d\mathbf{\bar{W}}_t $$ 是一个反向的维纳过程。

前向过程 $$d\mathbf{X}_t = -\frac{1}{2} \beta(t) \mathbf{X}_t dt + \sqrt{\beta(t)} d\mathbf{W}_t $$
具体代入，可得反向过程：

$$
d\mathbf{X}_t = \left[ \frac{1}{2} \beta(t) \mathbf{X}_t + \beta(t) \nabla_{\mathbf{X}_t} \log p_t(\mathbf{X}_t) \right] dt + \sqrt{\beta(t)} d\mathbf{\bar{W}}_t
$$

方程的各个部分：

1.  **反向漂移项**: $$ \left[ \frac{1}{2} \beta(t) \mathbf{X}_t + \beta(t) \nabla_{\mathbf{X}_t} \log p_t(\mathbf{X}_t) \right] $$
    *   $$ \frac{1}{2} \beta(t) \mathbf{X}_t $$: 方向与位移相同, 离心力将噪声点从原点推开。
    *   $$ \beta(t) \nabla_{\mathbf{X}_t} \log p_t(\mathbf{X}_t) $$: 最关键的**修正项**。
        *   $$ p_t(\mathbf{X}_t) $$ 是在时间 $$ t $$ 时，所有数据点经过前向过程后形成的边缘概率密度。
        *   $$ \nabla_{\mathbf{X}_t} \log p_t(\mathbf{X}_t) $$ 被称为**分数函数 (Score Function)**。该向量场指向 $$ log p_t(\mathbf{X}_t) $$ 增长最快的方向。

2.  **反向扩散项**: $$ \sqrt{\beta(t)} d\mathbf{\bar{W}}_t $$
    *   扩散项的幅度与前向过程相同，保证了过程的随机性量级是一致的。

如果没有分数修正项，反向过程就只是简单地将噪声从原点推开，无法恢复出任何有意义的结构。分数项 $$ \nabla_{\mathbf{X}_t} \log p_t(\mathbf{X}_t) $$ 包含了在每个时刻 $$ t $$ 恢复数据结构所需的所有信息。由于我们无法知道真实的 $$ p_t(\mathbf{X}_t) $$，**扩散模型的训练目标就是用一个神经网络 $$ \mathbf{s}_{\boldsymbol{\theta}}(\mathbf{X}_t, t) $$ 来近似这个分数函数**。

### 证明（基于离散时间的直观推导）

一个完全严格的证明需要用到随机过程理论中的 Fokker-Planck 方程或 Kolmogorov backward/forward 方程，过程比较复杂。这里我们提供一个在机器学习领域更常见、更直观的离散时间推导思路（源于 Anderson, 1982 的工作）。

考虑一个很小的时间步长 $$ \Delta t $$。

#### 前向转移概率
从 $$ \mathbf{X}_t $$ 到 $$ \mathbf{X}_{t+\Delta t} $$ 的转移可以写成：

$$
\mathbf{X}_{t+\Delta t} \approx \mathbf{X}_t + \boldsymbol{\mu}(\mathbf{X}_t, t) \Delta t + \boldsymbol{\sigma}(t) \sqrt{\Delta t} \mathbf{z}
$$

其中 $$ \mathbf{z} \sim \mathcal{N}(0, \mathbf{I}) $$。

这说明，给定 $$ \mathbf{X}_t $$，$$ \mathbf{X}_{t+\Delta t} $$ 的条件概率是一个高斯分布：

$$
p(\mathbf{X}_{t+\Delta t} | \mathbf{X}_t) = \mathcal{N}(\mathbf{X}_{t+\Delta t}; \mathbf{X}_t + \boldsymbol{\mu}(\mathbf{X}_t, t)\Delta t, \boldsymbol{\sigma}(t)^2 \Delta t)
$$

#### 反向转移概率
我们想要求的是反向的转移概率 $$ p(\mathbf{X}_t | \mathbf{X}_{t+\Delta t})  $$ 。根据贝叶斯定理：

$$
p(\mathbf{X}_t | \mathbf{X}_{t+\Delta t}) = \frac{p(\mathbf{X}_{t+\Delta t} | \mathbf{X}_t) p_t(\mathbf{X}_t)}{p_{t+\Delta t}(\mathbf{X}_{t+\Delta t})}
$$

取对数：

$$
\log p(\mathbf{X}_t | \mathbf{X}_{t+\Delta t}) = \log p(\mathbf{X}_{t+\Delta t} | \mathbf{X}_t) + \log p_t(\mathbf{X}_t) - \log p_{t+\Delta t}(\mathbf{X}_{t+\Delta t})
$$

- **第一项**:
  $$
  \log p(\mathbf{X}_{t+\Delta t} | \mathbf{X}_t) = C_1 - \frac{1}{2 \boldsymbol{\sigma}(t)^2 \Delta t} ||\mathbf{X}_{t+\Delta t} - (\mathbf{X}_t + \boldsymbol{\mu}(\mathbf{X}_t, t)\Delta t)||^2
  $$

- **后两项**: 我们对 $$ \log p_{t+\Delta t}(\mathbf{X}_{t+\Delta t}) $$ 在 $$ (\mathbf{X}_t, t) $$ 处一阶泰勒展开（忽略了高阶无穷小）：
  $$
    \begin{aligned}
    \log p_{t+\Delta t}(\mathbf{X}_{t+\Delta t}) &\approx \log p_t(\mathbf{X}_t) + \frac{\partial \log p_t}{\partial t} \Delta t + (\mathbf{X}_{t+\Delta t} - \mathbf{X}_t)^T \nabla_{\mathbf{X}_t} \log p_t(\mathbf{X}_t) \\
    \implies \log p_t(\mathbf{X}_t) - \log p_{t+\Delta t}(\mathbf{X}_{t+\Delta t}) &\approx - \frac{\partial \log p_t}{\partial t} \Delta t - (\mathbf{X}_{t+\Delta t} - \mathbf{X}_t)^T \nabla_{\mathbf{X}_t} \log p_t(\mathbf{X}_t)
    \end{aligned}
  $$
将展开式代入 $$ \log p(\mathbf{X}_t | \mathbf{X}_{t+\Delta t}) $$

我们只关心与 $$ \mathbf{X}_t $$ 相关的项，因为我们想得到一个关于 $$ \mathbf{X}_t $$ 的高斯分布。

$$
\log p(\mathbf{X}_t | \mathbf{X}_{t+\Delta t}) \approx C - \frac{1}{2 \sigma^2 \Delta t} ||\mathbf{X}_{t+\Delta t} - \mathbf{X}_t - \boldsymbol{\mu} \Delta t||^2 - (\mathbf{X}_{t+\Delta t} - \mathbf{X}_t)^T \nabla \log p_t
$$

展开二次项，保留与 $$ \mathbf{X}_t $$ 相关的主导项：

$$
\approx C' - \frac{1}{2 \sigma^2 \Delta t} (\mathbf{X}_t^T\mathbf{X}_t - 2 \mathbf{X}_t^T(\mathbf{X}_{t+\Delta t} - \boldsymbol{\mu}\Delta t)) + \mathbf{X}_t^T \nabla \log p_t
$$

我们对方程进行配方，使其形式为 $$ -\frac{1}{2\text{Var}} ||\mathbf{X}_t - \text{Mean}||^2 $$。
通过整理关于 $$ \mathbf{X}_t $$ 的一次项和二次项，可以发现这个分布是一个均值为 $$ \mathbf{X}_{t+\Delta t} - \boldsymbol{\mu}_{rev} \Delta t $$，方差为 $$ \sigma^2 \Delta t $$ 的高斯分布。

经过一些代数运算，可以推导出反向漂移项 $$ \boldsymbol{\mu}_{rev} $$ 满足：

$$
\boldsymbol{\mu}_{rev}(\mathbf{X}_t, t) \approx \boldsymbol{\mu}(\mathbf{X}_t, t) - \boldsymbol{\sigma}(t)^2 \nabla_{\mathbf{X}_t} \log p_t(\mathbf{X}_t)
$$

由于这个推导是针对从 $$ t+\Delta t $$ 到 $$ t $$ 的过程，时间在减少。如果我们定义反向 SDE 的时间是向前流逝的（即 $$dt$$ 为正），那么漂移项需要取反。因此，反向过程的漂移项为：

$$
\boldsymbol{\mu}_{reverse} = - \boldsymbol{\mu}_{rev} = -\boldsymbol{\mu}(\mathbf{X}_t, t) + \boldsymbol{\sigma}(t)^2 \nabla_{\mathbf{X}_t} \log p_t(\mathbf{X}_t)
$$

![warning](/assets/images/warning.jpg)
