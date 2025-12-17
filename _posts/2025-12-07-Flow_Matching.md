---
title: Flow Matching
date: 2025-12-07 00:01:00 +0800
last_modified_at: 2025-12-07 00:02:00 +0800
categories: [AI] # 最多两层
tags: [flow matching]
# toc: false # 关闭目录
math: true
---

---

参考资料:

- [Flow Matching Guide and Code](https://arxiv.org/abs/2412.06264)
- [The Principles of Diffusion Models](https://arxiv.org/abs/2510.21890)
- [https://github.com/helblazer811/Diffusion-Explorer](https://github.com/helblazer811/Diffusion-Explorer)
- [Diffusion-Explorer](https://alechelbling.com/Diffusion-Explorer/)
- [NeurIPS 2024 Tutorial \| Flow Matching for Generative Modeling](https://www.bilibili.com/video/BV1cRwJeREgk/)

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
> - 欧拉视角（Eulerian Perspective）关注**空间中固定点**上的流体状态变化。
> - 拉格朗日视角（Lagrangian Perspective）跟踪**粒子**本身的运动轨迹和状态。

---

### 欧拉视角

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


#### 确定性流

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


### 拉格朗日视角

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
$$

## 流模型

### 生成模型

生成模型的目标: 从有限数据集中学习一个经验数据分布 $p_{\text{data}}(x)$

方法: 构建一个**参数化映射** $G_\theta: z \mapsto x$，将一个**简单先验分布**（如标准高斯 $p(z) = \mathcal{N}(0, I)$）映射到复杂的目标数据分布：

$$
x = G_\theta(z), \quad z \sim p(z) \quad \Rightarrow \quad x \sim p_{\text{data}}(x)
$$

### 流模型

与扩散模型的**随机过程**不同，流模型学习一个**确定性、可逆的变换** $F: z \mapsto x$，将简单先验 $p(z)$ 映射至数据分布 $p_{\text{data}}(x)$。

#### 归一化流 (Normalizing Flows)

核心公式：**变量替换公式**（Change of Variables）

$$
p_{\text{data}}(x) = p(z) \left| \det \frac{\partial F^{-1}}{\partial x} \right| = p(F^{-1}(x)) \left| \det J_{F^{-1}}(x) \right|
$$

其中 $J$ 为雅可比矩阵。

为提升表达能力，使用 $K$ 层变换 $F = f_K \circ \cdots \circ f_1$，对数似然为：

$$
\log p_{\text{data}}(x) = \log p(z_0) - \sum_{k=1}^K \log \left| \det J_{f_k}(z_{k-1}) \right|
$$

> **设计约束**：  
> 1. 每层 $f_k$ 必须可逆；  
> 2. 雅可比行列式必须**高效可计算**（如 $O(D)$ 而非 $O(D^3)$）。  
> → 导致架构受限（如 RealNVP、Glow 使用耦合层）。

#### 连续归一化流 (CNF)

将离散流视为连续 ODE 的离散化：

$$
\frac{dz(t)}{dt} = v_\theta(z(t), t), \quad z(0) = x, \quad z(1) = z
$$

其中 $v_\theta$ 是神经网络定义的**向量场**。

对数似然由**瞬时变量替换公式**给出：

$$
\log p_{\text{data}}(x) = \log p(z(1)) - \int_0^1 \mathrm{Tr}\left( \frac{\partial v_\theta}{\partial z}(z(t), t) \right) dt
$$

> **优势**：迹（trace）计算比行列式更灵活，释放网络设计自由度。  
> **代价**：训练需数值积分 ODE + 沿轨迹积分迹 → **计算昂贵**。

#### 高效训练：流匹配 (Flow Matching)

**核心**：不通过似然优化向量场，而是**直接回归目标向量场** $v^\ast(x, t)$。

目标：训练 $v_\theta(x, t) \approx v^\ast(x, t)$，其中 $v^\ast$ 是将 $p_0$ 流向 $p_1$ 的真实向量场。

但 $v^\ast$ 未知。借鉴扩散模型思路，引入**条件向量场**。

#### 条件流匹配 (Conditional Flow Matching)

设条件路径 $p_t(x \| x_1)$ 已知（如高斯路径），其对应的条件向量场 $u_t(x \| x_1)$ 有解析表达。

核心恒等式：

$$
v^\ast(x, t) = \mathbb{E}_{p(x_1 | x_t = x)} \left[ u_t(x | x_1) \right]
$$

> 边缘向量场 = 条件向量场在后验下的期望。

#### 损失函数

直接回归 $v^\ast$ 不可行（因后验未知）。转而最小化：

$$
\mathcal{L}_{\text{CFM}}(\theta) = \mathbb{E}_{t, x_1, x_t \sim p_t(x|x_1)} \left[ \| v_\theta(x_t, t) - u_t(x_t | x_1) \|^2 \right]
$$

根据**最优估计原理**，该损失的最优解满足：

$$
v_\theta^\ast(x, t) = \mathbb{E}[u_t(x | x_1) | x_t = x] = v^\ast(x, t)
$$


#### 高斯概率路径

设条件路径为高斯：

$$
p_t(x | x_1) = \mathcal{N}(x; \mu_t(x_1), \sigma_t(x_1)^2 I)
$$

则条件向量场有解析解：

$$
u_t(x | x_1) = \frac{\dot{\mu}_t(x_1) + \dot{\sigma}_t(x_1) \cdot \frac{x - \mu_t(x_1)}{\sigma_t(x_1)}}{1}
$$

**线性插值案例**：

$$
\mu_t(x_1) = t x_1, \quad \sigma_t = 1 - t \quad \Rightarrow \quad u_t(x | x_1) = \frac{x_1 - x}{1 - t}
$$

> 高斯 → 环形：  
> - 在 $t \approx 0$ 时，后验 $p(x_1 \| x_t = x)$ 弥散 → 边缘向量场 $v^\ast$ 是大量方向各异的 $u_t$ 的平均 → **平滑但模糊**；  
> - 在 $t \approx 1$ 时，后验收缩 → $v^\ast$ 接近单一 $u_t$ → **方向明确**。


#### 耦合 (Coupling)

**问题**：在独立耦合下（$x_0 \sim p_0$, $x_1 \sim p_1$ 独立采样），条件向量场 $u_t(x \| x_1)$ 方差极大，尤其当 $p_0$ 与 $p_1$ 几何不匹配时（如高斯→环形），导致训练不稳定。

**解决方案**：设计**耦合**（coupling）$\pi(x_0, x_1)$，使路径有序。

##### 单边条件作用 (One-Sided Conditioning)

$$
p_t(x) = \mathbb{E}_{x_1 \sim p_{\text{data}}} [p_t(x | x_1)]
$$

如：$p_t(x \mid x_1) = \mathcal{N}(x; x_1, \sigma_t^2 I)$

##### 双边条件作用 (Two-Sided Conditioning)

$$
p_t(x) = \mathbb{E}_{(x_0, x_1) \sim \pi} [p_t(x | x_0, x_1)]
$$

##### 最优传输耦合 (Optimal Transport Coupling)

寻找耦合 $\pi^\ast \in \arg\min_\pi \mathbb{E}_{(x_0,x_1)\sim\pi} \|x_0 - x_1\|^2$，即**最小化平均运输成本**。

- 解 $\pi^\ast$ 诱导的路径**无交叉、几何有序**；
- 显著降低条件向量场方差；
- 提升训练稳定性与样本质量。

> - **FM**：路径概率性，模态交叉严重；  
> - **CFM + 独立耦合**：路径随机配对，仍有交叉；  
> - **OT-CFM**：路径一一对应，完全消除交叉 → **高效、稳定**。

## 寻找高密度中心 (mode)

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
> 这种随机估计方法将计算引导项的成本从 $$O(D \cdot C)$$ 降低到与**两次**标准反向传播相当的 $$O(C)$$，使其在实践中变得可行。

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



![warning](/assets/images/warning.jpg)
