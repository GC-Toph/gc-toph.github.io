---
title: Python 组合配置：Hydra
date: 2026-06-05 00:01:00 +0800
last_modified_at: 2026-06-05 00:02:00 +0800
categories: [AI, 实践] # 最多两层
tags: [Hydra, OmegaConf, Pydantic]
# toc: false # 关闭目录
---

## 需求

做 AI research 时，很多实验并不是代码逻辑发生了巨大变化，而是配置在不断变化：

* 换模型：`gpt2`、`llama`、`mistral`、`qwen`
* 换数据集和指标：`GSM8K`、`HumanEval`、`MATH`、自定义 benchmark
* 换方法：baseline、CoT、self-consistency、verifier、RAG
* 换超参数：learning rate、batch size、temperature、top_p、seed
* 做 ablation：关闭 LoRA、减少 few-shot、关闭某个模块
* 跑 sweep：多个模型 × 多个数据集 × 多个方法 × 多个 seed

如果这些变化都写死在代码里，项目很快会变得难以维护：

```python
if model == "llama":
    ...
elif model == "gpt2":
    ...

if dataset == "math":
    ...
elif dataset == "code":
    ...
```

这种写法的主要问题是：

1. 实验条件分散在代码里，不容易复现。
2. 每次换实验都要改 Python，容易引入无关 bug。
3. sweep、ablation、日志统计都很难自动化。
4. 结果和配置没有强绑定，后续很难确认某个分数到底是怎么跑出来的。

更适合 AI research 的方式是：**把实验变量配置化，把 Python 代码写成稳定的实验入口**。

本文介绍一种常见且实用的组合：

```text
Hydra 负责配置组合、CLI 覆盖、multirun
OmegaConf 负责配置对象和插值
Pydantic 负责类型校验
```

---

## 安装依赖


```bash
pip install hydra-core omegaconf torch transformers datasets peft accelerate pydantic numpy
```

固定版本：

```bash
pip freeze > requirements.lock.txt
```


## 项目结构

采用模块化配置结构，把模型、数据集、方法、运行环境、命名实验拆开管理。

```text
ai_exp/
├── run.py
└── conf/
    ├── config.yaml
    ├── model/
    │   ├── gpt2.yaml
    │   └── llama.yaml
    ├── dataset/
    │   ├── gsm8k.yaml
    │   └── humaneval.yaml
    ├── method/
    │   ├── baseline.yaml
    │   └── cot.yaml
    ├── runtime/
    │   ├── cpu.yaml
    │   └── cuda.yaml
    └── experiment/
        ├── gpt2_gsm8k_cot.yaml
        └── ablation_no_lora.yaml
```

本文的入口脚本`run.py`主要展示模型加载、数据集加载、prompt 构造和评估流程，并不是完整的训练 loop。

如果项目包含 optimizer、loss、backward、scheduler、checkpoint，可以再添加 `train.py`。

---

## 主配置文件：`conf/config.yaml`

```yaml
# conf/config.yaml

defaults:
  - model: gpt2
  - dataset: gsm8k
  - method: baseline
  - runtime: cuda
  - _self_
  - optional experiment: null

# 全局实验参数
seed: 0
epochs: 1
batch_size: 8
lr: 0.0003

generation:
  max_new_tokens: 128
  do_sample: false

# 输出目录。Hydra 运行时会解析成当前 run 的 output directory。
output_dir: ${hydra:runtime.output_dir}

# Hydra 行为
hydra:
  run:
    dir: outputs/${now:%Y-%m-%d}/${now:%H-%M-%S}_${model.name}_${dataset.name}_${method.name}

  sweep:
    dir: multirun/${now:%Y-%m-%d}/${now:%H-%M-%S}
    subdir: ${hydra.job.num}_${model.name}_${dataset.name}_${method.name}_seed${seed}

  job:
    chdir: false
    env_set:
      CUDA_VISIBLE_DEVICES: ${runtime.visible_devices}
```

### 优先级

```yaml
defaults:
  - model: gpt2
  - dataset: gsm8k
  - method: baseline
  - runtime: cuda
  - _self_
  - optional experiment: null
```

这段配置告诉 Hydra 默认加载：

```text
conf/model/gpt2.yaml
conf/dataset/gsm8k.yaml
conf/method/baseline.yaml
conf/runtime/cuda.yaml
```

`_self_` 表示当前文件 `config.yaml` 自身的内容。它的位置决定当前文件和其他配置文件的合并顺序。

上面的顺序含义是：

1. 先加载 `model`、`dataset`、`method`、`runtime`。
2. 再加载当前 `config.yaml` 的默认全局字段。
3. 再加载可选的 `experiment` 配置。
4. 最后加载CLI参数，可以临时覆盖任何字段。

这样设计的好处是：

* `config.yaml` 可以提供统一默认值，例如 `seed`、`lr`、`batch_size`。
* `experiment/*.yaml` 可以覆盖这些默认值，用来保存具体实验设置。

例如：

```bash
python run.py experiment=gpt2_gsm8k_cot lr=1e-4 seed=42
```

配置加载的优先级：

```text
CLI 覆盖 > experiment 配置 > config.yaml 默认值 > config group 默认值
```


## Runtime 配置

### `conf/runtime/cuda.yaml`

```yaml
name: cuda
accelerator: cuda
visible_devices: "0"
device_map: auto
precision: fp32
```

### `conf/runtime/cpu.yaml`

```yaml
name: cpu
accelerator: cpu
visible_devices: ""
device_map: null
precision: fp32
```

`CUDA_VISIBLE_DEVICES` 是 CUDA 进程启动前读取的环境变量，用来控制当前进程能看到哪些 GPU。

例如：

```bash
CUDA_VISIBLE_DEVICES=0 python run.py
```

表示当前进程只看到物理 GPU 0。

如果使用 Hydra，也可以把它配置到：

```yaml
hydra:
  job:
    env_set:
      CUDA_VISIBLE_DEVICES: ${runtime.visible_devices}
```

这样每次 run 的 GPU 可见性就会进入配置体系。

需要注意：`device_map: auto` 不是简单的“使用 GPU”。它表示让 Transformers / Accelerate 根据当前可见设备和显存自动放置模型权重。对于小模型，通常可以显式 `.to(device)`；对于大模型，`device_map: auto` 更适合自动切分和加载。

---

## 模型配置

### `conf/model/gpt2.yaml`

教学示例最好使用一个能快速跑通的小模型。真实实验时可以再切换到更大的模型。

```yaml
name: gpt2
pretrained_name: sshleifer/tiny-gpt2
max_length: 512
use_lora: false
```

也可以换成标准 GPT-2：

```yaml
pretrained_name: gpt2
```

但第一次教学示例建议用 `sshleifer/tiny-gpt2`，因为它下载快、显存要求低，更适合验证配置系统是否工作正常。

### `conf/model/llama.yaml`

```yaml
name: llama
pretrained_name: meta-llama/Llama-2-7b-hf
max_length: 2048
use_lora: true

lora:
  task_type: CAUSAL_LM
  r: 8
  lora_alpha: 16
  lora_dropout: 0.05
  bias: none
  target_modules:
    - q_proj
    - v_proj
```


`target_modules` 和模型结构相关，不同模型不能盲目复用。

例如：
* Llama 系列常见：`q_proj`、`v_proj`
* GPT-2 系列可能需要针对 `c_attn` 等模块单独配置
* Qwen、Mistral、Falcon 等模型也可能不同

因此，LoRA 配置应该作为模型配置的一部分，而不是写死在 Python 代码里。

---

## 数据集配置

### `conf/dataset/gsm8k.yaml`

```yaml
name: gsm8k
loader: hf
path: gsm8k
subset: main
split: test

input_field: question
answer_field: answer
metric: exact_match

max_samples: 100
```

### `conf/dataset/humaneval.yaml`

```yaml
name: humaneval
loader: hf
path: openai_humaneval
subset: null
split: test

input_field: prompt
answer_field: canonical_solution
metric: pass_at_1

max_samples: 50
```

---

## 方法配置

### `conf/method/baseline.yaml`

```yaml
name: baseline
prompt_template: direct
num_shots: 0
temperature: 0.0
top_p: 1.0
```

### `conf/method/cot.yaml`

```yaml
name: cot
prompt_template: chain_of_thought
num_shots: 4
temperature: 0.2
top_p: 0.95
```


## 命名实验：`experiment/`

很多时候，我们不希望每次都手动写一长串命令，而是希望保存一组有名字的实验设置。

例如：

```text
conf/experiment/gpt2_gsm8k_cot.yaml
```

```yaml
# conf/experiment/gpt2_gsm8k_cot.yaml

defaults:
  - override /model: gpt2
  - override /dataset: gsm8k
  - override /method: cot
  - override /runtime: cuda

seed: 42
lr: 0.0001
batch_size: 16
epochs: 1

generation:
  max_new_tokens: 256
  do_sample: true

method:
  num_shots: 4
  temperature: 0.3
  top_p: 0.95

runtime:
  visible_devices: "0"
  precision: fp16
```

运行：

```bash
python run.py experiment=gpt2_gsm8k_cot
```

为什么这里要写：

```yaml
defaults:
  - override /model: gpt2
```

而不是：

```yaml
defaults:
  - model: gpt2
```

因为主配置里已经选择过 `model` 组了：

```yaml
defaults:
  - model: gpt2
```

如果命名实验里还想重新指定同一个配置组，就应该用 `override` 明确表达“我要覆盖主配置中的默认选择”。

`/model` 里的 `/` 表示从`配置根路径`开始寻找 `model` 配置组。

---

## 入口脚本：`run.py`

它展示了：

* 加载模型
* 加载 tokenizer
* 可选应用 LoRA
* 加载数据集
* 根据 method 构造 prompt
* 将 generation 参数传入 `model.generate`
* 保存解析后的配置和实验结果
* 用 Pydantic 做基本类型校验

```python
import json
import logging
import random
from pathlib import Path
from typing import Any

import hydra
import numpy as np
import torch
from datasets import load_dataset
from omegaconf import DictConfig, OmegaConf
from pydantic import BaseModel, ConfigDict, Field
from transformers import AutoModelForCausalLM, AutoTokenizer


logger = logging.getLogger(__name__)


# ----------------------------
# 1. Pydantic config validation
# ----------------------------

class RuntimeConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    accelerator: str
    visible_devices: str = "0"
    device_map: str | None = "auto"
    precision: str = Field(pattern="^(fp32|fp16|bf16)$")


class GenerationConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    max_new_tokens: int = Field(gt=0)
    do_sample: bool = False


class MethodConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    prompt_template: str
    num_shots: int = Field(ge=0)
    temperature: float = Field(ge=0.0, le=2.0)
    top_p: float = Field(gt=0.0, le=1.0)


class DatasetConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    loader: str
    path: str
    subset: str | None = None
    split: str
    input_field: str
    answer_field: str
    metric: str
    max_samples: int | None = Field(default=None, gt=0)


class ModelConfig(BaseModel):
    model_config = ConfigDict(extra="allow")

    name: str
    pretrained_name: str
    max_length: int = Field(gt=0)
    use_lora: bool = False


class ExperimentConfig(BaseModel):
    model_config = ConfigDict(extra="allow")

    seed: int
    epochs: int = Field(gt=0)
    batch_size: int = Field(gt=0)
    lr: float = Field(gt=0)

    output_dir: str
    model: ModelConfig
    dataset: DatasetConfig
    method: MethodConfig
    runtime: RuntimeConfig
    generation: GenerationConfig


def validate_cfg(cfg: DictConfig) -> ExperimentConfig:
    cfg_dict = OmegaConf.to_container(cfg, resolve=True)
    return ExperimentConfig.model_validate(cfg_dict)


# ----------------------------
# 2. Reproducibility
# ----------------------------

def set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)

    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)

    # 更确定，但可能牺牲性能。
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False


# ----------------------------
# 3. Device and dtype
# ----------------------------

def get_torch_dtype(cfg: DictConfig):
    precision = cfg.runtime.precision

    if precision == "fp16":
        return torch.float16
    if precision == "bf16":
        return torch.bfloat16
    return torch.float32


def get_device(cfg: DictConfig) -> torch.device:
    accelerator = cfg.runtime.accelerator

    if accelerator == "cuda" and torch.cuda.is_available():
        return torch.device("cuda")
    if accelerator == "mps" and torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


# ----------------------------
# 4. Model
# ----------------------------

def build_model(cfg: DictConfig) -> dict[str, Any]:
    logger.info("Building model: %s", cfg.model.pretrained_name)

    tokenizer = AutoTokenizer.from_pretrained(cfg.model.pretrained_name)

    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    torch_dtype = get_torch_dtype(cfg)
    device = get_device(cfg)

    model_kwargs = {
        "torch_dtype": torch_dtype,
    }

    # device_map="auto" 通常用于大模型自动放置。
    # CPU 或小模型场景下，可以不传 device_map，加载后显式 .to(device)。
    if cfg.runtime.device_map is not None and cfg.runtime.accelerator == "cuda":
        model_kwargs["device_map"] = cfg.runtime.device_map

    model = AutoModelForCausalLM.from_pretrained(
        cfg.model.pretrained_name,
        **model_kwargs,
    )

    if "device_map" not in model_kwargs:
        model = model.to(device)

    if cfg.model.get("use_lora", False):
        logger.info("Applying LoRA configuration")

        from peft import LoraConfig, get_peft_model

        lora_cfg = LoraConfig(**OmegaConf.to_container(cfg.model.lora, resolve=True))
        model = get_peft_model(model, lora_cfg)
        model.print_trainable_parameters()

    return {
        "model": model,
        "tokenizer": tokenizer,
    }


# ----------------------------
# 5. Dataset
# ----------------------------

def build_dataset(cfg: DictConfig):
    logger.info("Loading dataset: %s", cfg.dataset.name)

    if cfg.dataset.loader != "hf":
        raise ValueError(f"Unsupported dataset loader: {cfg.dataset.loader}")

    subset = cfg.dataset.get("subset", None)

    if subset is None:
        dataset = load_dataset(
            cfg.dataset.path,
            split=cfg.dataset.split,
        )
    else:
        dataset = load_dataset(
            cfg.dataset.path,
            subset,
            split=cfg.dataset.split,
        )

    max_samples = cfg.dataset.get("max_samples", None)
    if max_samples is not None:
        max_n = min(len(dataset), int(max_samples))
        dataset = dataset.select(range(max_n))

    return dataset


# ----------------------------
# 6. Prompt
# ----------------------------

FEW_SHOT_EXAMPLES = {
    "gsm8k": [
        {
            "question": "Janet has 3 apples and buys 4 more. How many apples does she have?",
            "answer": "7",
        },
        {
            "question": "A box has 10 pens. Tom takes 6. How many pens remain?",
            "answer": "4",
        },
        {
            "question": "There are 5 bags with 2 candies each. How many candies are there?",
            "answer": "10",
        },
        {
            "question": "Sam read 8 pages on Monday and 9 pages on Tuesday. How many pages did he read?",
            "answer": "17",
        },
    ]
}


def format_example(question: str, answer: str, template: str) -> str:
    if template == "chain_of_thought":
        return (
            f"Question: {question}\n"
            f"Let's think step by step.\n"
            f"Answer: {answer}\n"
        )

    return (
        f"Question: {question}\n"
        f"Answer: {answer}\n"
    )


def build_prompt(item: dict[str, Any], cfg: DictConfig) -> str:
    input_field = cfg.dataset.input_field
    question = item.get(input_field, "")

    template = cfg.method.prompt_template
    num_shots = cfg.method.num_shots

    examples = FEW_SHOT_EXAMPLES.get(cfg.dataset.name, [])
    selected_examples = examples[:num_shots]

    prompt_parts = []

    for example in selected_examples:
        prompt_parts.append(
            format_example(
                question=example["question"],
                answer=example["answer"],
                template=template,
            )
        )

    if template == "chain_of_thought":
        prompt_parts.append(
            f"Question: {question}\n"
            f"Let's think step by step.\n"
            f"Answer:"
        )
    else:
        prompt_parts.append(
            f"Question: {question}\n"
            f"Answer:"
        )

    return "\n".join(prompt_parts)


# ----------------------------
# 7. Evaluation
# ----------------------------

def extract_prediction(text: str) -> str:
    # 示例函数。真实 benchmark 应使用任务对应的严格解析器。
    return text.strip()


def simple_exact_match(prediction: str, reference: str) -> bool:
    return reference.strip() in prediction.strip()


def evaluate(model_dict: dict[str, Any], dataset, cfg: DictConfig) -> dict[str, Any]:
    model = model_dict["model"]
    tokenizer = model_dict["tokenizer"]

    logger.info("Running evaluation with method: %s", cfg.method.name)

    model.eval()

    total = 0
    correct = 0
    predictions = []

    do_sample = bool(cfg.generation.do_sample or cfg.method.temperature > 0)

    generation_kwargs = {
        "max_new_tokens": cfg.generation.max_new_tokens,
        "do_sample": do_sample,
        "top_p": float(cfg.method.top_p),
        "pad_token_id": tokenizer.pad_token_id,
    }

    if do_sample:
        generation_kwargs["temperature"] = float(cfg.method.temperature)

    with torch.no_grad():
        for item in dataset:
            prompt = build_prompt(item, cfg)

            inputs = tokenizer(
                prompt,
                return_tensors="pt",
                truncation=True,
                max_length=cfg.model.max_length,
            )

            # 兼容 device_map="auto" 和普通 .to(device) 两种路径。
            if not hasattr(model, "hf_device_map"):
                inputs = inputs.to(model.device)
            else:
                first_device = next(model.parameters()).device
                inputs = inputs.to(first_device)

            outputs = model.generate(
                **inputs,
                **generation_kwargs,
            )

            generated_text = tokenizer.decode(
                outputs[0],
                skip_special_tokens=True,
            )

            prediction = extract_prediction(generated_text)
            reference = str(item.get(cfg.dataset.answer_field, ""))

            is_correct = simple_exact_match(prediction, reference)

            total += 1
            correct += int(is_correct)

            predictions.append(
                {
                    "prompt": prompt,
                    "prediction": prediction,
                    "reference": reference,
                    "correct": is_correct,
                }
            )

    score = correct / total if total > 0 else 0.0

    result = {
        "model": cfg.model.name,
        "pretrained_name": cfg.model.pretrained_name,
        "dataset": cfg.dataset.name,
        "method": cfg.method.name,
        "metric": cfg.dataset.metric,
        "score": round(score, 4),
        "num_samples": total,
        "hyperparams": {
            "seed": cfg.seed,
            "lr": cfg.lr,
            "batch_size": cfg.batch_size,
            "epochs": cfg.epochs,
            "temperature": cfg.method.temperature,
            "top_p": cfg.method.top_p,
            "num_shots": cfg.method.num_shots,
            "max_new_tokens": cfg.generation.max_new_tokens,
        },
        "runtime": {
            "accelerator": cfg.runtime.accelerator,
            "visible_devices": cfg.runtime.visible_devices,
            "device_map": cfg.runtime.device_map,
            "precision": cfg.runtime.precision,
        },
    }

    return result, predictions


# ----------------------------
# 8. Main
# ----------------------------

@hydra.main(version_base=None, config_path="conf", config_name="config")
def main(cfg: DictConfig) -> None:
    logger.info("Starting experiment")

    # 解析并校验完整配置。
    validate_cfg(cfg)

    set_seed(int(cfg.seed))

    logger.info(
        "\n========== CONFIG SNAPSHOT ==========\n%s",
        OmegaConf.to_yaml(cfg, resolve=True),
    )

    model_dict = build_model(cfg)
    dataset = build_dataset(cfg)

    result, predictions = evaluate(model_dict, dataset, cfg)

    output_dir = Path(cfg.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    config_path = output_dir / "config_resolved.yaml"
    with open(config_path, "w", encoding="utf-8") as f:
        f.write(OmegaConf.to_yaml(cfg, resolve=True))

    result_path = output_dir / "result.json"
    with open(result_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    predictions_path = output_dir / "predictions.jsonl"
    with open(predictions_path, "w", encoding="utf-8") as f:
        for row in predictions:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")

    logger.info("\n========== RESULT ==========\n%s", json.dumps(result, indent=2, ensure_ascii=False))
    logger.info("Artifacts saved to: %s", output_dir)


if __name__ == "__main__":
    main()
```

这段代码仍然是教学 skeleton，不是完整 benchmark 实现。真实项目里，`evaluate()` 应该根据任务类型替换成严格评估逻辑：

* GSM8K：抽取最终数字答案
* MATH：做数学表达式标准化
* HumanEval：生成代码并运行单元测试
* 多选题：解析选项
* 开放式问答：exact match、F1、judge model 或人工 rubric

---

## 直接运行

在项目根目录下运行：

```bash
python run.py
```

默认使用：

```text
model=gpt2
dataset=gsm8k
method=baseline
runtime=cuda
```

输出目录类似：

```text
outputs/2026-06-06/14-30-12_gpt2_gsm8k_baseline/
  .hydra/
    config.yaml
    hydra.yaml
    overrides.yaml
  config_resolved.yaml
  result.json
  predictions.jsonl
  run.log
```

Hydra 默认会在输出目录里保存 `.hydra/`，包括：

```text
config.yaml
hydra.yaml
overrides.yaml
```

我们额外保存：

```text
config_resolved.yaml
result.json
predictions.jsonl
```

这样每个实验结果都和完整配置绑定，便于复现。


## 切换模型、数据集和方法

```bash
python run.py model=llama dataset=humaneval method=cot
```

Hydra 会自动加载：

```text
conf/model/llama.yaml
conf/dataset/humaneval.yaml
conf/method/cot.yaml
```

也可以切换运行环境：

```bash
python run.py runtime=cpu
```

或者指定某张 GPU：

```bash
python run.py runtime.visible_devices=1
```


## 批量实验：multirun

Hydra 可以用 `-m` 或 `--multirun` 跑组合实验。

```bash
python run.py -m model=gpt2,llama dataset=gsm8k,humaneval method=baseline,cot seed=0,1,2
```

这会运行：

```text
2 models × 2 datasets × 2 methods × 3 seeds = 24 runs
```

输出目录类似：

```text
multirun/2026-06-06/14-35-00/
  0_gpt2_gsm8k_baseline_seed0/
  1_gpt2_gsm8k_baseline_seed1/
  2_gpt2_gsm8k_baseline_seed2/
  3_gpt2_gsm8k_cot_seed0/
  ...
```

这里的 `hydra.job.num` 可以避免不同 sweep 配置写入同一个目录。

需要注意：Hydra 原生 multirun 主要负责枚举配置组合。默认情况下，它不是完整的实验平台，也不自动做集群资源调度。如果要并行、上 SLURM、接 Optuna、接 Ray、接 W&B，通常需要额外的 launcher、sweeper 或外部平台集成。


## Ablation 示例

例如我们想做一个“不使用 LoRA”的 ablation：

```yaml
# conf/experiment/ablation_no_lora.yaml

defaults:
  - override /model: llama
  - override /dataset: gsm8k
  - override /method: cot
  - override /runtime: cuda

seed: 0

model:
  use_lora: false

method:
  num_shots: 4
  temperature: 0.2
  top_p: 0.95

runtime:
  visible_devices: "0"
  precision: fp16
```

运行：

```bash
python run.py experiment=ablation_no_lora
```

也可以用 multirun 同时扫 ablation 条件：

```bash
python run.py -m model.use_lora=true,false seed=0,1,2
```

---

## 常见误解

### 不要误解 Hydra 的工作目录行为

Hydra 会自动创建 output directory。

但是否把当前工作目录切换到 output directory，取决于：

```yaml
hydra:
  job:
    chdir: true
```

在较新的 Hydra 使用方式中，`hydra.job.chdir` 默认是 `false`。

为了稳妥，项目里访问文件时建议使用绝对路径，或者统一通过配置传入路径。

例如：

```python
from hydra.utils import get_original_cwd
from pathlib import Path

project_root = Path(get_original_cwd())
data_path = project_root / cfg.dataset.path
```

---

### 不要只保存 result，不保存 config

错误做法：

```text
result.json
```

正确做法：

```text
.hydra/
  config.yaml
  hydra.yaml
  overrides.yaml
config_resolved.yaml
result.json
predictions.jsonl
run.log
```

`config_resolved.yaml`是实际使用的配置，`.hydra/`自动生成的并没有计算解析表达式。

---

### 不要让 YAML 字段和代码读取字段不一致

例如配置里写：

```yaml
max_samples: 100
```

代码里却读：

```python
cfg.dataset.max_length
```

这是非常危险的。因为实验看起来“有配置”，但配置实际上没有生效。

建议每新增一个配置字段，都检查：

1. 是否真的被代码读取。
2. 是否被保存到最终 `config_resolved.yaml`。
3. 是否在 result 里记录了关键字段。
4. 是否有类型校验或范围校验。

---

### 不要在代码里偷偷覆盖配置

错误做法：

```python
cfg.lr = 1e-4
```

这样会破坏配置的可信度。

如果必须动态修改配置，例如根据 batch size 自动设置 gradient accumulation，建议：

1. 生成一个新的字段，例如 `effective_batch_size`。
2. 打印到日志。
3. 保存到最终配置或 result。


![warning](/assets/images/warning.jpg)
