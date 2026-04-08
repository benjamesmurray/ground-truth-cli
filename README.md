# ground-truth-cli (v1.1.0)

An **Agent-Native** Model Context Protocol (MCP) server designed for project initialization and "Ground Truth" rule synthesis. It streamlines the onboarding process for AI coding assistants by scanning project context and generating rigid behavioural constraints in Token-Oriented Object Notation (TOON).

## 🚀 Core Philosophy: Agent-Native
This server follows the **Agent-Native** architecture pattern:
- **Cobra-Style Grammar:** Tools use an `[object]-[action]` reasoning structure.
- **Pull Discovery:** Minimal initial token footprint. The agent pulls deep documentation (`gt_help`) only when needed.
- **TOON Optimized:** Outputs are formatted in Token-Oriented Object Notation to reduce context usage by 40-60%.
- **State Aware:** Tracks project phase (Idle -> Scanned) to guide the agent's next steps without explicit system prompt instructions.

## 🛠 Tools

| Tool | Action | Description |
|--- |--- |--- |
| `gt_status` | Orient | Returns high-level summary of the current project state and orientation. |
| `gt_refresh` | Build | Parameterless tool to quickly rebuild the project rules based on current context. |
| `gt_help` | Learn | Pulls deep documentation for specific topics (e.g., `scan`, `rules`). |
| `gt_exec` | Act | The workhorse tool. Usage: `gt_exec scan <path>`. |

## 🧩 Ground Truth Methodology (9 Cognitive Domains)
The scanner leverages a permanent rule library (`ground_truth_rules.toon`) covering 9 critical cognitive domains:
1. **Epistemic Integrity:** Validating knowledge and dependencies.
2. **Reasoning Discipline:** Planning and root-cause analysis.
3. **Memory Integrity:** Session-long consistency and state.
4. **Communication:** Suppressing filler, explanatory "why" comments.
5. **Anticipation:** Proactive security, null checks, and migrations.
6. **Learning:** Ingesting user corrections and design patterns.
7. **Self-Awareness:** Understanding environment limits (No-Execution).
8. **Tool Rules:** Proper invocation of file/search operations.
9. **Persistent State:** Managing TODOs and session handoffs.

### Rule Format
Each rule follows a strict 3-part schema:
1. **Trigger:** The specific condition (e.g., "When writing a utility function...").
2. **Behaviour:** The rigid constraint (e.g., "You must use JSDoc for all parameters.").
3. **Example:** Correct vs. Incorrect illustrations using native string bounding tokens `<|">`.

## 🔄 The Scanning Pipeline (V1.1.0)
When `gt_exec scan .` or `gt_refresh` is invoked:
1. **Monorepo-Aware Fact Discovery:** The server traverses the workspace (using `glob`) to aggregate dependencies from all `package.json` files.
2. **Enhanced Ecosystem Heuristics:** Automatically detects modern runtimes and frameworks including:
   - **Testing:** Bun Native Testing, Playwright (E2E), Vitest, Jest, Cypress, AVA.
   - **Frameworks:** Solid.js, SST (Serverless Stack), Effect-ts.
3. **Prioritized Guideline Extraction:** The scanner prioritizes AI-specific instructions found in **`AGENTS.md`**, **`.cursorrules`**, and **`.windsurfrules`**.
4. **Dynamic Placeholder Population:** These facts are sequentially injected into the `ground_truth_rules.toon` template (now dynamically resolved for full portability).
5. **Project Gap Synthesis:** Any unique project requirements are synthesized into a `project_specific_pack`.
6. **Final Output:** A complete `.assistant_rules.toon` file is generated, acting as the "Project Constitution".

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
For maximum efficiency, this tool is designed to be used alongside `project-map-cli`.

1. **Map:** Agent uses `project-map-cli` to understand repo structure.
2. **Scan:** Agent runs `gt_exec scan .`.
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
