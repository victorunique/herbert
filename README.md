# Herbert - 经典算法编程解谜游戏权威介绍与完整规则规范

本文档旨在完整、真实、权威地还原 **Herbert** 算法编程解谜游戏及其专用 **"H" 编程语言** 的标准逻辑、物理规则、语法语义与计分体系，作为重新设计与实现本项目的核心需求与技术规范（Specification）。

---

## 1. 游戏背景与历史渊源

**Herbert** 是一款经典的算法与程序设计解谜游戏（Programming Puzzle Game），最早由 **Brian Conte** 创立的 **Wild Noodle Corporation** 开发并运营，后因作为 **微软创新杯（Microsoft Imagine Cup）** 算法邀请赛（Algorithm Invitational）第一轮（Round 1）线上选拔赛的核心挑战项目而风靡全球高校计算机竞赛圈。

### 1.1 赛事背景与历史定位

1. **Microsoft Imagine Cup 算法邀请赛（2007 - 2008）**
   - 在 2005 至 2008 年间，微软创新杯设有专门的 **Algorithm Invitational（算法邀请赛）** 赛道。
   - **Herbert** 在 **2007 年（韩国首尔全球总决赛周期）与 2008 年（法国巴黎全球总决赛周期）** 的算法赛第一轮（Round 1）中被作为标志性的在线编程闯关挑战。全球参赛选手需要在限定时间内解出尽可能多的关卡，并尽可能压缩每关代码的字节数（Bytes），以争夺晋级下一轮及全球总决赛的资格。
2. **Wild Noodle 编程能力评估体系**
   - 研发该系统的 **Wild Noodle** 公司（位于美国西雅图地区）将 Herbert 设计为一套不依赖任何特定工业界编程语言或标准库知识的纯粹算法思维测评工具。它重点考察程序员的四大核心能力：
     - **模式识别（Pattern Recognition）**：从复杂的二维几何阵列中提炼重复与对称结构；
     - **抽象与泛化（Abstraction & Generalization）**：通过带参过程将局部路径抽象为通用模块；
     - **递归与分形思维（Recursion & Fractals）**：在没有传统循环与条件语句的限制下控制执行流；
     - **空间状态规划与极限编码压缩（Code Golfing）**：在严格的字节数配额下寻找全局最优解。
3. **社区传承（Herbert Online Judge - HOJ）**
   - 微软创新杯比赛结束后，由于 Herbert 的语言设计与解谜机制极其精妙，全球算法爱好者（尤其是日本、俄罗斯与中国的技术社区）搭建了开源实现（如 `dwayne/herbert-python`）及非官方在线评测平台 **HOJ (Herbert Online Judge)**，收录了上千道高难度自制关卡，并催生了针对 H 语言的形式化分析与自动求解研究。

---

## 2. 游戏核心物理逻辑与地图规则

### 2.1 二维网格世界（2D Grid World）

- **标准尺寸**：标准地图为一个固定 **$25 \times 25$** 的二维正交方格矩阵（行、列索引通常从 $0$ 到 $24$）。
- **网格边界**：$25 \times 25$ 网格的四周外侧为不可逾越的绝对边界，撞击边界的物理效果与撞击墙壁完全一致。
- **机器人（Herbert）的状态**：
  在任意离散时间步（Step）中，机器人 **Herbert** 的状态由二元组决定：
  1. **位置坐标 $(r, c)$**：当前所在的网格行、列坐标；
  2. **朝向（Orientation）**：**上（Up / North）**、**右（Right / East）**、**下（Down / South）**、**左（Left / West）** 四个正交方向之一。每个关卡开始时，Herbert 具有唯一的初始坐标和初始朝向。

### 2.2 地图元素类型与交互规则

地图上的每个单元格属于以下五种标准元素之一：

| 标准元素名称 | 标准地图字符 | 俗称 / 对应概念 | 核心交互与物理规则 |
| :--- | :---: | :--- | :--- |
| **空地 (Empty Space)** | `.` | 地板 / 空白格 | Herbert 可以自由踏入与穿过，不触发任何状态变更。 |
| **起点与初始朝向 (Start)** | `u` / `r` / `d` / `l` | 出生点 | 分别代表初始面朝 **上 (Up)**、**右 (Right)**、**下 (Down)**、**左 (Left)** 的机器人初始位置。游戏开始后，该格在物理上等同于普通空地 `.`。 |
| **墙壁 (Wall)** | `*` | 障碍物 | **不可通行**。当 Herbert 面朝墙壁（或 $25 \times 25$ 地图外边界）执行前进指令 `s` 时，**不会报错、不会终止程序，也不会改变位置和朝向**，而是留在原地不动（即“撞墙空转”），仅消耗 1 个执行步。 |
| **白色按钮 (White Button)** | `w` | 目标得分点 | **通关收集目标**。初始处于“未按下（Unpressed / 未点亮）”状态。当 Herbert 移动进入该格时，该白色按钮变为“已按下（Pressed / 已点亮）”状态。**允许重复踩踏**：再次踏入已点亮的白色按钮不会使其熄灭，也无任何副作用。 |
| **灰色按钮 (Gray Button)** | `g` | 炸弹 / 清零陷阱 | **进度重置陷阱**。Herbert 可以正常踏入并穿过该格（机器人不会被销毁，程序也不会中断），但**一旦踏入灰色按钮，当前地图上所有已被点亮的白色按钮会瞬间全部恢复为“未点亮”状态（即此前走过的得分点全部清零）**，必须重新走遍所有白色按钮才能完成关卡。 |

> **注**：在后续的日本社区版 HOJ 中，墙壁、白色按钮、灰色按钮的字符表示曾被替换为 `x`、`o`、`*`，但官方原版（Wild Noodle / Imagine Cup）的标准定义为 `.`（空地）、`*`（墙壁）、`w`（白钮）、`g`（灰钮）。

### 2.3 动作执行与即时胜利判定（Execution & Win Condition）

1. **离散步进（Step-by-Step Execution）**：
   - 只有执行基础指令 `s`、`l`、`r` 才会推进游戏世界的时间步（1 次基本指令 = 1 Step）。
   - 过程调用、参数求值与递归展开属于解释器内部控制流，本身不消耗地图移动步数，也不移动机器人。
2. **即时通关判定（Immediate Victory）**：
   - 在任意一步移动（`s`）完成后的瞬间，系统检查地图状态：**只要地图上所有的白色按钮（`w`）同时处于“已点亮”状态，关卡立即宣告通关（Level Solved），程序立刻终止执行**。
   - 这一规则意味着**程序不需要自然结束**：选手可以编写一个无限尾递归程序（如 `a:sra`），只要机器人在无限延展的轨迹中点亮了最后一个白色按钮，就在此刻直接获胜，后续即使再有灰色按钮也不会被触发。

---

## 3. "H" 编程语言完整语法与执行语义规范

控制 Herbert 的专用语言名为 **"H" 语言**（或简写为 `h`）。它是一种极简主义的领域特定语言（DSL），通过**单字符标识符、无关键字语法、高阶指令块传递与非正数隐式截断**实现了强大的表达能力。

### 3.1 基础动作原语（Primitive Commands）

H 语言仅有 **3 个内置动作原语**，均为单个小写字母（这三个字母为语言保留字，严禁作为自定义过程名）：

- **`s` (Step)**：向当前面朝的方向前进 1 格（若前方为墙壁 `*` 或地图边界，则位置不变）。
- **`l` (Left)**：在原地逆时针旋转（左转）$90^\circ$，坐标位置不变。
- **`r` (Right)**：在原地顺时针旋转（右转）$90^\circ$，坐标位置不变。

### 3.2 程序整体结构与词法约定

1. **程序结构**：
   一个合法的 H 程序由 **0 个或多个过程定义（Procedure Definitions）**，以及位于程序末尾的 **1 条主执行语句序列（Main Body）** 组成，各部分之间以换行符分隔：
   ```text
   <过程定义 1>
   <过程定义 2>
   ...
   <主执行语句序列>
   ```
2. **标识符大小写铁律**：
   - **过程名（Procedure Name）**：必须是除 `s`、`l`、`r` 以外的**单个小写英文字母**（共 23 个可用字母：`a`-`k`, `m`-`q`, `t`-`z`）。每个过程名在同一程序中最多只能定义一次。
   - **参数名（Parameter Name）**：必须是**单个大写英文字母**（`A`-`Z`，共 26 个可用字母）。同一过程的参数列表中不能出现重复的参数名。
   - 因为所有指令、过程名、参数名均为单字符且通过大小写严格区分，语句内部**无需任何空格或分隔符**（如 `s l r` 与 `slr` 完全等价）。

### 3.3 过程定义与无参调用（Procedures & Recursion）

- **语法格式**：`<过程名>:<函数体>`
- **语义**：调用无参过程时，直接书写该过程的小写字母名称，解释器即会进入该过程的函数体依次执行其中的语句。过程可以调用其他过程，也可以直接或间接调用自身（递归）。
- **示例**：
  ```text
  a:sslr
  b:aala
  b
  ```
  其中 `a` 表示“前进2格、左转、右转”，`b` 调用了三次 `a` 并在中间夹杂一次左转 `l`，主程序 `b` 启动执行。

### 3.4 带参过程：两类参数（数值参数 vs. 指令序列参数）

H 语言的过程可以声明 1 个或多个形式参数，用括号括起并以逗号分隔：
`<过程名>(<参数1>,<参数2>,...):<函数体>`

在调用带参过程时，传入的每个实参（Argument）可以是以下两种类型之一：

#### 类型一：数值表达式参数（Numeric Expression Argument）

1. **算术语法**：实参可以是一个整数常量（如 `5`、`0`、`-3`）、一个代表数值的形参变量（如 `X`），或者由 `+`（加）、`-`（减 / 负号）连接而成的线性算术表达式（如 `X-1`、`X+2`、`A-B+1`、`-X+5`）。
2. **传值求值（Call-by-Value）**：在调用发生时，算术表达式会在**当前调用者（Caller）的作用域内立即计算出具体的整数值**，然后绑定到被调过程（Callee）对应的形参上。
3. **核心控制流 - 非正数隐式截断规则（Non-Positive Termination Rule）**：
   - H 语言**没有任何 `if`、`else`、`for`、`while` 关键字**。
   - 唯一的条件分支机制是：**在调用带参过程时，先计算所有实参的值；如果传入的实参中包含数值参数，且其中任意一个数值参数的计算结果小于或等于 0（即 $\le 0$），则本次过程调用被整体取消（视为空操作 No-op，函数体内的任何语句均不会执行，直接返回调用点）**。
   - 备注：如果一个过程有多个参数（例如 `f(A,B,X)`），哪怕 `A` 和 `B` 是指令序列或正整数，只要 `X` 的求值结果 $\le 0$，整个 `f(A,B,X)` 调用立即终止跳过。
4. **数值形参在函数体内的直接出现**：
   - 通常数值形参仅用于传递给下层过程调用（如 `a(X-1)`）；如果将绑定了整数值的形参 `X` 直接作为独立语句写在函数体中（例如 `a(X):sXa(X-1)`），当 `X` 为数值时，单独的 `X` 语句不产生任何机器人动作（视为空语句）。

**示例（数值递归与循环）**：
```text
a(X):sa(X-1)
b(X,Y):a(X)rb(X-Y,Y)
b(10,2)
```
- `a(X)` 实现了精确向前走 `X` 步（当 `X` 递减至 `0` 时 `a(0)` 自动终止）。
- `b(10,2)` 先走 10 步右转，再走 8 步右转、6 步右转、4 步右转、2 步右转，随后调用 `b(0,2)` 因第一个参数 $0 \le 0$ 而终止。

#### 类型二：指令序列参数（Command Sequence / Macro Argument）

1. **高阶动作传递**：实参不仅可以是数字，还可以是**任意合法的语句序列**（包含基础指令 `s/l/r`、过程调用 `p(...)`、以及当前作用域内的形参 `A`）。
2. **词法绑定与闭包展开（Lexical Substitution）**：
   - 当实参是一段指令序列时（例如在 `f(X):...` 内部调用 `g(Xs)` 或 `g(a(X-1)r)`），该指令序列中所引用的当前作用域形参（如 `X`）会在调用传递时与当前作用域的值完成绑定（即静态词法作用域，不会与被调函数内部的同名形参发生动态作用域冲突）。
   - 当被调过程在函数体内执行该形参时，等同于执行其绑定的那段指令序列。

**示例（指令序列倍增与动态生长）**：
```text
a(X):XX
b(X):Xrb(Xs)
a(s)b(s)
```
- `a(X):XX` 将传入的动作执行两遍，`a(s)` 即 `ss`。
- `b(X):Xrb(Xs)` 每次先执行动作 `X`，右转 `r`，然后在参数末尾追加一步 `s` 递归调用自身：`s` -> `r` -> `ss` -> `r` -> `sss` -> `r` ...

### 3.5 H 语言形式化文法（Formal BNF Grammar）

```bnf
<program>   ::= (<proc_def> <EOL>)* <stmt_list>
<proc_def>  ::= <pname> [ "(" <param_list> ")" ] ":" <body_list>
<param_list>::= <PARAM> ("," <PARAM>)*
<body_list> ::= (<stmt> | <PARAM>)*              ; 函数体可为空，也可包含语句与形参
<stmt_list> ::= <stmt>+                          ; 主执行行至少包含一条语句
<stmt>      ::= "s" | "l" | "r" | <proc_call>
<proc_call> ::= <pname> [ "(" <arg_list> ")" ]
<arg_list>  ::= <arg> ("," <arg>)*
<arg>       ::= <num_expr> | <cmd_seq>
<cmd_seq>   ::= (<stmt> | <PARAM>)+              ; 当单个 <PARAM> 作为实参时，继承其绑定类型（数值或指令序列）
<num_expr>  ::= <term> (("+" | "-") <term>)*
<term>      ::= ["+" | "-"] (<NUMBER> | <PARAM>)
<pname>     ::= "a".."k" | "m".."q" | "t".."z"   ; 除 s, l, r 外的单个小写字母
<PARAM>     ::= "A".."Z"                         ; 单个大写字母
<NUMBER>    ::= ("0".."9")+
```

### 3.6 静态语义校验与运行时边界规范（Validation & Limits）

为了保证语言实现的严密性，标准的 H 语言解释器必须强制执行以下校验规则：

1. **静态编译期错误（Compile-Time / Syntax Errors）**：
   - 调用未定义的过程名（Undefined Procedure）；
   - 重复定义同名过程（Duplicate Procedure Definition）；
   - 过程定义中出现重复形参名（如 `a(X,X):s`）；
   - **参数个数不匹配（Arity Mismatch）**：调用过程时传入的实参个数与定义时的形参个数严格不一致（例如定义了 `a(X,Y):...` 却以 `a(1)` 或 `a` 调用，或定义了无参 `a:...` 却以 `a(1)` 调用）；
   - 引用未在当前过程形参列表中声明的形参变量（Undeclared Parameter）；
   - **类型错误（Type Mismatch）**：将绑定了“指令序列”的形参用于算术加减表达式中（例如向 `a(X):b(X-1)` 传入了 `a(sr)`）。
2. **运行时边界限制（Runtime Limits）**：
   - **数值范围限制**：在原版规范中，整数常量与算术表达式求值结果通常限制在 **$[-255, +255]$**（或标准单字节/短整型上限）内，超出范围判定为数值溢出（Numeric Overflow）。
   - **调用栈/宏展开深度上限**：防止非尾递归或指数级代码块嵌套耗尽内存（通常栈深上限设为 $100 \sim 1000$ 层）。
   - **最大执行步数上限（Max Steps）**：防止无法覆盖全部目标点的死循环程序无限运行（单局步数上限通常设为 $10,000 \sim 100,000$ 步）。

---

## 4. 字节数计算与竞赛评分标准（Byte Counting & Scoring）

Herbert 最具魅力的设计在于其独特的 **“字节数（Bytes）”计算方式**。它并非统计源码的字符串长度，而是统计**有效语法词元（Tokens）的数量**。

### 4.1 权威字节数（Byte Count）计费表

| 语法单元 (Token) | 计费权重 | 详细规则说明 |
| :--- | :---: | :--- |
| **基本动作指令 (`s`, `l`, `r`)** | **1 Byte** | 每次出现计 1 Byte。 |
| **过程定义名与过程调用名 (`a`-`z`)** | **1 Byte** | 定义头部的过程名计 1 Byte；每次调用该过程时，过程名也计 1 Byte。 |
| **形参声明与形参引用 (`A`-`Z`)** | **1 Byte** | 过程定义括号内的每个形参计 1 Byte；函数体或实参表达式中每次出现形参名也各计 1 Byte。 |
| **整数常量（连续数字序列）** | **1 Byte** | **不论该整数有几位数字，整个连续数字常量统一只计 1 Byte**（例如 `1`、`25`、`255` 均只算 **1 Byte**）。 |
| **标点符号 (`:`, `(`, `)`, `,`)** | **0 Byte** | 冒号、左右圆括号、逗号 **完全免费（不计入字节数）**。 |
| **算术运算符 (`+`, `-`)** | **0 Byte** | 加号、减号、负号 **完全免费（不计入字节数）**。 |
| **空白字符（空格、制表符、换行符）** | **0 Byte** | 所有空白与换行 **完全免费（不计入字节数）**。 |

#### 字节数计算精确示例

以如下经典的螺旋线程序为例：
```text
a(X):sa(X-1)
b(X):a(X)rb(X+1)
b(1)
```
逐行拆解计费 Token：
- 第 1 行 `a(X):sa(X-1)`：
  - 计费单元：`a`、`X`、`s`、`a`、`X`、`1` -> 共 **6 Bytes**（`(`、`)`、`:`、`-` 均为 0 Byte）。
- 第 2 行 `b(X):a(X)rb(X+1)`：
  - 计费单元：`b`、`X`、`a`、`X`、`r`、`b`、`X`、`1` -> 共 **8 Bytes**。
- 第 3 行 `b(1)`：
  - 计费单元：`b`、`1` -> 共 **2 Bytes**。
- **程序总大小**：$6 + 8 + 2 =$ **16 Bytes**。

### 4.2 关卡字节配额（Max Bytes）与积分计算公式

在 Imagine Cup 算法邀请赛及原版关卡体系中，每个关卡预设了两个核心参数：
- **$M$ (`max_bytes`)**：该关卡允许的最大程序字节数配额；
- **$P$ (`level_points`)**：该关卡的基础满分值（随关卡难度递增，例如 100 分、250 分、500 分等）。

当选手提交一段字节数为 $B$ 的 H 程序并运行结束后，设地图上共有 $W_{\text{total}}$ 个白色按钮，程序运行结束时处于点亮状态的白色按钮数量为 $W_{\text{lit}}$（若中途全部点亮则立即结束，$W_{\text{lit}} = W_{\text{total}}$）：

1. **字节超限（$B > M$）**：
   - 若程序字节数超过了该关允许的最大字节数 $M$，则无论是否点亮所有按钮，该方案均视为**不合规（Size Limit Exceeded）**，得分为 $0$。
2. **部分完成得分（Partial Score，当 $B \le M$ 且 $W_{\text{lit}} < W_{\text{total}}$）**：
   - 若程序未能点亮全部白色按钮，但在结束时点亮了部分白色按钮（且最后未被灰色按钮清零），选手可按比例获得部分基础分（通常按点亮比例折算，不享受通关与字节压缩奖励）。
3. **完美通关与字节压缩奖励（Solved & Efficiency Bonus，当 $B \le M$ 且 $W_{\text{lit}} = W_{\text{total}}$）**：
   - 选手首先获得关卡全部基础分 $P$（包含全点亮完成奖）；
   - **字节节约奖励（Byte-Saving Bonus）**：如果选手使用的字节数 $B$ 严格小于配额 $M$（即节省了 $M - B$ 个字节），每节省 1 个字节都会获得额外的奖励加分（在原版与排行榜体系中，总分由基础通关分与 $(M - B)$ 成正比的效率奖励分共同构成，字节数越少得分越高）。

---

## 5. 标准关卡文件格式规范（Standard Level Format）

在标准 Herbert 模拟器（如原版关卡包及 `herbert-python`）中，每个关卡由纯文本格式定义，包含三部分信息：

1. **$25 \times 25$ 地图字符矩阵**：由 `.`、`*`、`w`、`g` 以及唯一的起点字符（`u`、`r`、`d`、`l` 之一）组成；
2. **关卡配额与分值元数据**：
   - `max_bytes`（最大允许字节数 $M$）
   - `points`（关卡基础分值 $P$）

### 标准关卡文件示例（Level Representation Example）

```text
*************************
*.......................*
*..w.................w..*
*.......................*
*...........g...........*
*.......................*
*....*.............*....*
*....*......u......*....*
*....*.............*....*
*.......................*
*...........g...........*
*.......................*
*..w.................w..*
*.......................*
*************************
```

---

## 6. 经典高阶解题范式（Algorithmic Idioms in H）

由于 H 语言独特的计费与物理机制，许多在常规编程中看似“反直觉”的写法，在 Herbert 中却是最优解的核心技巧：

1. **借墙对齐（Wall Alignment / Overshooting）**
   - 因为撞墙不会报错且原地不动，当需要走到墙壁前转弯时，无需传入精确的距离（或者为了复用外层已有的大整数参数 `X`），可以直接让 Herbert 走远超实际距离的步数（如 `a(99)`），把多余步数全部撞在墙上消耗掉，从而省去专门定义或传递精确步数的字节开销。
2. **无限尾递归与空间填充（Infinite Recursion & Space-Filling）**
   - 利用“最后一个白钮点亮瞬间立即判胜”的规则，省去递归终止条件（如用无参的 `a:sa` 代替 6 字节的 `a(X):sa(X-1)`），配合墙壁反弹或螺旋扩张扫过全图。
3. **高阶参数交替（Alternating Polymorphic Parameters）**
   - 定义 `a(X,Y):Xa(Y,X)`，调用 `a(ssl,ssr)`，即可在每次递归时自动交换 `X` 与 `Y` 的角色，用极短的字节走出复杂的阶梯线（Zig-Zag）或对称摆动路径。
4. **战略性踩灰键重置（Intentional Gray Button Reset）**
   - 当某个灰色按钮（`g`）挡在狭窄通道中央，绕开它需要多写数个字节的转弯代码时，可以让 Herbert 先故意踩过该灰色按钮（此时之前顺路踩到的白钮被重置），而在后续的对称循环路径中自然地将那些白钮重新点亮，从而大幅压缩总字节数。

---

## 7. XHerbert 工程架构、构建、测试与部署指南

本项目（**XHerbert**，完整产品需求见 [PRD.md](file:///Users/victorxu/projects/herbert/PRD.md)）基于上述权威规则采用 React 19 + Vite 6 + TypeScript 5 + Tailwind CSS 实现，支持默认 $25 \times 25$ 以及任意宽高为 $[25, 75]$ 区间内奇数的长方形或正方形地图。

### 7.1 架构概览（Architecture Overview）

项目采用严格的模块化分层架构，各核心领域模块拥有显式的输入输出类型契约（[src/core/types.ts](file:///Users/victorxu/projects/herbert/src/core/types.ts)）且与 UI 零耦合：

- **核心引擎层 (`src/core/`)**：
  - [src/core/lexer.ts](file:///Users/victorxu/projects/herbert/src/core/lexer.ts)：H 语言词法分析器与官方 Token 字节数计费引擎（字母与连续整数计 `1 Byte`，标点、运算符、空白计 `0 Byte`）。
  - [src/core/parser.ts](file:///Users/victorxu/projects/herbert/src/core/parser.ts)：递归下降语法分析器与静态语义校验器（校验未定义过程、重名、形参个数 Arity 匹配、未声明形参及算术类型冲突）。
  - [src/core/interpreter.ts](file:///Users/victorxu/projects/herbert/src/core/interpreter.ts)：支持算术表达式传值求值（$[-255, +255]$ 边界检查与任一数值参数 $\le 0$ 隐式截断）及高阶指令序列词法闭包绑定的步进式生成器解释器。
  - [src/core/levelCodec.ts](file:///Users/victorxu/projects/herbert/src/core/levelCodec.ts)：标准 `.txt` 关卡文件解析器、序列化器、批量导入校验器（强制校验宽 $W$ 与高 $H$ 为 $[25, 75]$ 内的奇数）。
  - [src/core/gridEngine.ts](file:///Users/victorxu/projects/herbert/src/core/gridEngine.ts)：二维网格物理引擎、时间旅行快照会话（支持单步前进/后退/瞬间运行）与比例奖励积分计算器。
- **内容与持久化层 (`src/content/`, `src/storage/`)**：
  - [src/content/campaignLevels.ts](file:///Users/victorxu/projects/herbert/src/content/campaignLevels.ts)：4 大渐进章节共 9 道内置经典关卡（默认全部开放，包含 $35 \times 25$ 长方形奇数关卡）。
  - [src/content/tutorialLessons.ts](file:///Users/victorxu/projects/herbert/src/content/tutorialLessons.ts)：5 步交互式新手快速教程。
  - [src/storage/localRepository.ts](file:///Users/victorxu/projects/herbert/src/storage/localRepository.ts)：基于 `localStorage` 的免登录本地持久化仓储。
- **响应式 UI 与独立测试面板 (`src/ui/`)**：
  - 支持 Light / Dark 双主题切换，适配 Desktop、Tablet 与 Mobile 多尺寸视口，并提供 `?harness=grid|editor` 独立组件手动测试 UI。

### 7.2 设计原则（Design Principles）

1. **Specification-Driven & TDD**：所有核心模块与 UI 工作流均遵循“先写失败测试 -> 最小实现 -> 重构”的 TDD 流程。
2. **高内聚低耦合与独立可调用性**：每个核心模块均提供独立的 CLI 入口（位于 `src/cli/`），可通过 `uv run` 调用；每个核心前端视图均支持独立挂载测试。
3. **代码简洁度门禁**：单函数严格控制在 30 行以内，圈复杂度（Cyclomatic Complexity）严格小于 10，零 `any` 类型逃逸，零 ESLint/TypeScript 警告。

### 7.3 依赖安装与环境初始化（Setup with `uv` & `npm`）

```bash
# 1. 使用 uv 创建 Python 虚拟环境（用于 CLI 桥接器与自动化脚本）
uv venv

# 2. 安装前端与测试工具链依赖
npm install
```

### 7.4 构建与本地预览（Build & Preview Instructions）

```bash
# 启动开发热更新服务器 (http://127.0.0.1:5173)
npm run dev

# 构建生产环境静态产物 (输出至 dist/)
npm run build

# 本地预览生产构建包 (http://127.0.0.1:4173)
npm run preview
```

### 7.5 自动化测试与质量门禁（Testing Instructions）

```bash
# 1. 静态代码规范与类型检查（零警告策略）
npm run lint
npm run typecheck

# 2. 运行单元测试与集成测试（Vitest + React Testing Library）
npm test

# 3. 生成测试覆盖率报告（要求 >= 90%）
npm run test:coverage

# 4. 运行变异测试（StrykerJS，要求 >= 85%）
npm run test:mutate

# 5. 运行跨视口（Desktop / Tablet / Mobile）Playwright E2E 浏览器自动化测试
npm run test:e2e
```

### 7.6 部署说明（Deployment on Cloudflare Pages）

> 完整的本地部署验证、自动化测试、Cloudflare Pages 持续集成配置、Wrangler CLI 发布及 `xherbert.maxithome.com` 域名 DNS 绑定分步指南请参见独立文档：[DEPLOYMENT.md](file:///Users/victorxu/projects/herbert/DEPLOYMENT.md)。

本项目为纯静态前端单页应用（SPA），通过 **Cloudflare Pages** 部署并绑定自定义域名 `https://xherbert.maxithome.com`：

- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Node.js version**: `20+`
- **Custom Domain**: 在 Cloudflare Pages 项目的 *Custom domains* 中绑定 `xherbert.maxithome.com`。

### 7.7 模块独立 CLI 与 UI 调用示例（Usage Examples）

#### 后端/核心逻辑模块 CLI 调用（通过 `uv run`）

```bash
# 查看 CLI 参数帮助说明
uv run --no-sync python scripts/cli_runner.py --help

# 1. 独立调用词法分析与官方字节数计费器 (Lexer)
uv run --no-sync python scripts/cli_runner.py lexer --code "a(X):sa(X-1)\na(15)"

# 2. 独立调用语法分析与静态语义校验器 (Parser)
uv run --no-sync python scripts/cli_runner.py parser --code "a(X):Xra(Xs)\na(s)"

# 3. 独立调用 H 语言解释器展开动作序列 (Interpreter)
uv run --no-sync python scripts/cli_runner.py interpreter --code "a(X):Xra(Xs)\na(s)" --max-steps 20

# 4. 独立调用网格物理模拟与计分引擎 (Simulator)
uv run --no-sync python scripts/cli_runner.py simulate --code "ss" --max-steps 100
```

#### 前端组件独立手动测试面板（Isolated Manual Test UI）

启动 `npm run dev` 后，可通过 URL 参数单独挂载并测试各个 UI 模块：
- 独立网格画布测试：`http://127.0.0.1:5173/?harness=grid`
- 独立 H 代码编辑器与字节计费面板测试：`http://127.0.0.1:5173/?harness=editor`

