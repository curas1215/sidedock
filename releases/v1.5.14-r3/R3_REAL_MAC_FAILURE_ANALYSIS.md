# SideDock v1.5.14 R3｜最新真实 Mac 失败分析与修复闭环

## 结论

R2 安装已经真实通过 `[1/9]`～`[9/9]`。最新阻断不是安装提交失败，也不是 TargetResolver 抓错窗口，而是三件可独立复现的问题：

1. **Running Host identity false mismatch**：Host 文件 SHA/路径/ABI 全部与 receipt 一致，但运行时 Designated Requirement 显示文本解析为空；
2. **Chrome unique exact geometry 被 min-gap 规则误判 AMBIGUOUS**：IoU 1.000 的唯一精确候选被 IoU 0.966 的 runner-up 拖入拒绝分支；
3. **Chrome 实际仍运行 1.5.13 Extension worker**：新文件已安装，但旧 service worker 未被 Chrome 重载。

## R3 acceptance criteria

- `codesign -d -r-` display parser 返回空时，只要当前正式 `SideDock.app` 能通过 receipt requirement 的 `codesign -R`，Running Host 应与 receipt 匹配；若 `-R` 失败，必须 fail-closed。
- Chrome 存在唯一 1px 内 exact geometry candidate 时必须选它；多个 exact candidate 仍 AMBIGUOUS。
- Runtime/Host commit 前必须 clean-stop SideDock 自身旧进程，不能在 live process 下切换 runtime/receipt。
- Chrome heartbeat 若仍是 1.5.13，self-test / release gate 必须 FAIL 并明确要求 reload/restart；不能把文件版本当运行版本。
- 以上修复不得改变窗口截图只读、no-full-display、PreActivationSession、attachment/outside-click/IME/lifecycle 规则。
