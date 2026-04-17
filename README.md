# ground-truth-cli (v1.1.9)

An **Agent-Native** Model Context Protocol (MCP) server designed for project initialization and "Ground Truth" rule synthesis. It streamlines the onboarding process for AI coding assistants by scanning project context and generating rigid behavioural constraints in Token-Oriented Object Notation (TOON).

## 🚀 Core Philosophy: Agent-Native
This server follows the **Agent-Native** architecture pattern:
- **Cobra-Style Grammar:** Tools use an `[object]-[action]` reasoning structure.
- **Pull Discovery:** Minimal initial token footprint.
- **TOON Optimized:** Outputs are formatted in Token-Oriented Object Notation to reduce context usage by 40-60%.
- **State Aware:** Tracks project phase (Idle -> Scanned) to guide the agent's next steps. Usage is typically aliased via `ground` for consistent tool routing.

## 🛠 Tools

| Tool | Action | Description |
|--- |--- |--- |
| `gt_status` | Orient | Returns high-level summary of the current project state and orientation. |
| `gt_refresh` | Build | Parameterless tool to quickly rebuild the project rules based on current context. |
| `gt_exec` | Act | The workhorse tool. Usage: `ground gt_exec scan <path>`. |

## 🧩 Ground Truth Methodology (10 Cognitive Domains)
The scanner leverages a permanent rule library (`ground_truth_rules.toon`) covering 10 critical cognitive domains:
1. **Epistemic Integrity:** Validating knowledge and dependencies.
2. **Reasoning Discipline:** Planning and root-cause analysis.
3. **Memory Integrity:** Session-long consistency and state.
4. **Communication:** Suppressing filler, explanatory "why" comments.
5. **Anticipation:** Proactive security, null checks, and migrations.
6. **Learning:** Ingesting user corrections and design patterns.
7. **Self-Awareness:** Understanding environment limits (No-Execution).
8. **Tool Rules:** Proper invocation of file/search operations.
9. **Persistent State:** Managing TODOs and session handoffs.
10. **Expert Dev Guidance:** Dynamic injection of language/framework rules.

### Rule Format
Each rule follows a strict 3-part schema:
1. **Trigger:** The specific condition (e.g., "When writing a utility function...").
2. **Behaviour:** The rigid constraint (e.g., "You must use JSDoc for all parameters.").
3. **Example:** Correct vs. Incorrect illustrations using native string bounding tokens `<|">`.

## 🔄 The Scanning Pipeline (v1.1.9)
When `ground gt_exec scan .` or `ground gt_refresh` is invoked:
1. **Operational Fact Anchoring:** Injects 7 immutable facts regarding context limits, reasoning modes (LOW), and mandatory tool usage (mcpx).
2. **Multi-Language Discovery:** The server detects the primary project language (TypeScript, Vue, Rust, Go, Python, Kotlin).
3. **Architecture Mapping:** Automatically identifies the project's architectural domain (e.g., Next.js App Router, Axum Web Microservices, Kafka Event-Driven, etc.) based on dependency fingerprints.
4. **Dynamic Rule Injection:** Injects expert-level architectural rules from specialized `.toon` files (e.g., `typescript.toon`, `rust.toon`) that match the detected stack.
5. **Enhanced Ecosystem Heuristics:** Automatically detects modern runtimes and frameworks including:
   - **Testing:** Bun Native Testing, Playwright (E2E), Vitest, Jest, Cypress, AVA.
   - **Frameworks:** Solid.js, SST (Serverless Stack), Effect-ts.
6. **Prioritized Guideline Integration:** `AGENTS.md` is prioritized as a first-class architectural component. To avoid context redundancy, `AGENTS.md` content is no longer extracted into the generated `.toon` rule file.
7. **Conditional Project Gap Synthesis:** A `project_specific_pack` is generated only if unique project requirements (like specific stack conventions) are detected, preventing empty rule blocks.
8. **Final Output:** A complete `.assistant_rules.toon` file is generated, acting as the "Project Constitution".

## 📦 Installation

Add this server to your MCP client configuration (e.g., `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "ground-truth-cli": {
      "command": "node",
      "args": ["/home/benmurray/Projects/ground-truth-cli/dist/index.js"]
    }
  }
}
```

## 🔄 Workflow Integration
For maximum efficiency, this tool is designed to be used alongside `project-map-cli` and typically aliased to `ground`.

1. **Map:** Agent uses `project-map-cli` to understand repo structure.
2. **Scan:** Agent runs `ground gt_exec scan .`.
3. **Rules:** `.assistant_rules.toon` is generated with permanent 9-domain rules + project gaps.
4. **Develop:** The AI assistant now follows the "Ground Truth" project constitution.

## 🏗 Development

```bash
# Build the project
npm run build

# Start the server (stdio)
npm start
```

---
*Built for the 2026 AI-Native Developer Experience.*
