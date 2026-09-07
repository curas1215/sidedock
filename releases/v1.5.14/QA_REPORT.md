# SideDock v1.5.14 QA REPORT

## Release status

`CODE_VALIDATED_V1514_REAL_MAC_TCC_WINDOW_GATE_PENDING`

v1.5.14 的代码、自动化回归、语法与静态安全 Gate 已通过；**没有**把 Linux 容器无法模拟的 macOS TCC / WindowServer / 真实 ChatGPT DOM 标成 PASS。

## 本版解决的两个剩余 P0

### P0-1 H1 / TCC identity

已实现：
- 一次性识别 v1.5.13 弱 H1 identity；
- `AD_HOC_STABLE_CUSTOM_DR_V1`；
- 固定显式 Designated Requirement；
- `codesign --requirements "=<literal source>"`；
- staging 与 commit 后都执行 `codesign --verify --deep --strict -R`；
- Host receipt / install receipt / upgrade identity 三处记录稳定 identity；
- 稳定 H1 之后普通更新只能更新外部 Runtime；
- Host tree hash / DR / fingerprint 任何变化都失败；
- 不执行 `tccutil reset`。

### P0-2 Browser Adapter Native connected-but-stalled

已实现：
- HTTP localhost command long-poll 永远保持待命；
- Native 350ms hedge window；
- Native / HTTP 共用 requestId；
- Extension request cache 进行 running/done 去重，避免重复 DOM read；
- Native command health / 5s circuit breaker；
- Native outstanding timeout 上限 1.4s；
- circuit unhealthy 时直接 HTTP bypass。

## Automated regression

最终源码冻结回归：
- **131 / 131 PASS**
- **0 FAIL**

日志：`logs/v1514_full_regression_final.log`

其中新增 v1.5.14 专项测试：
- `test_v1514_stable_h1_identity_repair.js`
- `test_v1514_browser_transport_hedge.js`
- `test_v1514_native_command_circuit.js`
- `test_v1514_delivery_version_contract.js`

其余全部 v1.5.x 历史回归继续执行，未删除、不降级。

## Active source syntax QA

- JavaScript: **213 / 213 PASS**
- Shell: **6 / 6 PASS**
- JSON: **12 / 12 PASS**

日志：`logs/v1514_static_syntax_final.log`

## Static safety QA

全部 PASS：
- executable `tccutil reset`: 0
- `CGEventPost(...)` input injection call: 0
- `AXUIElementSetAttributeValue(...)` write call: 0
- `AXUIElementPerformAction(...)` action call: 0
- H1 read-only automation write denylist: present
- installer user compiler/toolchain invocation: 0
- browser `getDisplayMedia()` screen-wide capture: 0
- stable custom DR: present
- literal requirement `=` prefix: present
- explicit `codesign -R`: present
- HTTP command long-poll stays armed while Native connected: PASS
- 350ms hedge: present
- same requestId: present
- running/done request dedup: present
- Native command circuit: present

日志：`logs/v1514_static_safety_final.log`

## 无法在当前环境伪造的真实 Mac Gate

以下仍必须由目标 Mac 产生真实证据：

1. v1.5.14 weak-H1 identity repair 后，macOS 实际写入指定 DR；
2. 用户打开 Screen Recording + Accessibility，完全退出/重启后两项实际为 GRANTED；
3. H1 authorization fingerprint 与当前 HOST_RECEIPT 一致；
4. 第二次 v1.5.14 安装是 runtime-only，SideDock.app tree hash 完全不变；
5. 第二次安装与再次重启后权限仍 GRANTED、0 新权限弹窗；
6. Chrome 正常 Native 与 Native stalled -> HTTP hedge 的真实链路；
7. Chrome 单窗口/双窗口 exact isolation；
8. Activity Monitor / Terminal / 飞书真实窗口视觉；
9. 非 fullscreen target 不得整屏；
10. Permission denied 50 次 pixel backend delta=0；
11. ChatGPT live attachment 最近 20 次 20/20 ACK；
12. outside click >=100、0 FAIL、P95<=250ms；
13. >=50 个唯一点击前 Session/snapshot，wrongWindow=0；
14. 输入/IME 与 30 秒生命周期真实行为。

目标 Mac 未完成这些 Gate 前，不能写 `FULLY_VERIFIED_ON_TARGET_MAC`。

## Delivery-tree pre-manifest validation

在新增 v1.5.14 checkpoint 后，对整个交付目录（包含历史 checkpoint/source snapshot）再次做语法扫描：

- JavaScript: **570 / 570 PASS**
- Shell: **30 / 30 PASS**
- JSON: **87 / 87 PASS**

日志：`logs/v1514_delivery_tree_syntax_pre_manifest.log`

## Candidate ZIP reverse verification

第一次 artifact freeze 后已在全新目录反解并重新验证：

- Manifest integrity: **PASS**
- Automated regression: **131 / 131 PASS**
- Full delivery JavaScript syntax: **570 / 570 PASS**
- Full delivery Shell syntax: **30 / 30 PASS**
- Full delivery JSON parse: **88 / 88 PASS**（包含 BUILD_MANIFEST）
- Static safety: **PASS**

日志：`logs/v1514_packaged_reverse_verification.log`

该日志随后被纳入最终 artifact，并重新生成最终 manifest。最终 artifact 已再次在独立目录反解验证；结果写在包外 `SideDock_v1.5.14_FINAL_VERIFICATION.txt`，避免验证日志写回包内导致 manifest 再变化的循环。

## Final artifact verification

- Final ZIP SHA256: `fb8d9917739a2fe5c93432094d9bfdf76f9076e7cb293045891e66e5d08c445c`
- BUILD_MANIFEST integrity: **PASS**, **1151** files
- Automated regression: **131 / 131 PASS**
- JavaScript syntax: **570 / 570 PASS**
- Shell syntax: **30 / 30 PASS**
- JSON parse: **88 / 88 PASS**
- Static safety: **PASS**
- Real-Mac TCC/WindowServer/ChatGPT Gate: **PENDING_NOT_FABRICATED**
