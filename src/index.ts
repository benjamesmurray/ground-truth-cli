import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs/promises";
import * as path from "path";

/**
 * ground-truth-cli MCP Server
 * 
 * An Agent-Native project scanner that synthesizes "Ground Truth" rules
 * for AI coding assistants. It leverages project-map-cli for repo traversal.
 */

const server = new Server(
  {
    name: "ground-truth-cli",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Tool Definitions
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "gt_status",
        description: "Orient the agent: returns current scanning state and findings in TOON.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "gt_help",
        description: "Pull deep documentation for a specific feature or command.",
        inputSchema: {
          type: "object",
          properties: {
            topic: { type: "string", description: "The topic (e.g., 'scan', 'toon', 'rules')." },
          },
        },
      },
      {
        name: "gt_exec",
        description: "The primary workhorse. Action format: [action] [resource]",
        inputSchema: {
          type: "object",
          properties: {
            action: { type: "string", description: "Action to perform.", enum: ["scan"] },
            resource: { type: "string", description: "The target directory." },
          },
          required: ["action", "resource"],
        },
      },
    ],
  };
});

/**
 * Enhanced Context Gathering
 */
async function gatherContext(dir: string) {
  const absoluteDir = path.resolve(dir);
  const context = {
    language: "JavaScript/TypeScript",
    test_framework: "Unknown",
    build_system: "npm",
    strict_typing: "DISABLED",
    docs_standard: "JSDoc",
    guidelines: "",
    stack: "",
    project_root: absoluteDir,
  };

  try {
    const pkgPath = path.join(absoluteDir, "package.json");
    const pkg = JSON.parse(await fs.readFile(pkgPath, "utf-8"));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    
    context.stack = Object.keys(deps).slice(0, 15).join(", ");
    
    // Detect Test Framework
    if (deps.jest) context.test_framework = "Jest";
    else if (deps.vitest) context.test_framework = "Vitest";
    else if (deps.mocha) context.test_framework = "Mocha";

    // Detect Build System
    if (deps.vite) context.build_system = "Vite";
    else if (deps.webpack) context.build_system = "Webpack";

    // Detect Strict Typing
    try {
      const tsPath = path.join(absoluteDir, "tsconfig.json");
      const tsContent = await fs.readFile(tsPath, "utf-8");
      // Basic check for strict mode
      if (tsContent.includes('"strict": true')) context.strict_typing = "ENABLED";
    } catch {}

  } catch (e) {
    try {
      const pyPath = path.join(absoluteDir, "pyproject.toml");
      await fs.access(pyPath);
      context.language = "Python";
      context.build_system = "Poetry/Pip";
      context.test_framework = "Pytest";
      context.docs_standard = "Docstrings (Google/NumPy)";
    } catch {}
  }

  const guidelineFiles = ["CONTRIBUTING.md", "README.md", ".editorconfig"];
  for (const file of guidelineFiles) {
    try {
      const content = await fs.readFile(path.join(absoluteDir, file), "utf-8");
      context.guidelines += `${file} guidelines found. `;
      break;
    } catch {}
  }

  return context;
}

/**
 * Tool Execution Handler
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "gt_status":
      return {
        content: [{ type: "text", text: "Project: ground-truth-cli | Phase: IDLE\nNext: gt_exec scan ." }],
      };

    case "gt_exec":
      if (args?.action === "scan") {
        const targetDir = (args.resource as string) || ".";
        const ctx = await gatherContext(targetDir);
        
        // 1. Read the permanent template
        const templatePath = "/home/benmurray/Projects/ground-truth-cli/ground_truth_rules.toon";
        let rulesToon = await fs.readFile(templatePath, "utf-8");

        // 2. Fill placeholders sequentially (preserving the template structure)
        rulesToon = rulesToon.replace("[DYNAMIC: TO BE FILLED BY MCP]", ctx.language); // fact_03
        rulesToon = rulesToon.replace("[DYNAMIC: TO BE FILLED BY MCP]", ctx.test_framework); // fact_04
        rulesToon = rulesToon.replace("[DYNAMIC: TO BE FILLED BY MCP]", ctx.project_root); // fact_06
        rulesToon = rulesToon.replace("[DYNAMIC: TO BE FILLED BY MCP]", ctx.build_system); // fact_07
        rulesToon = rulesToon.replace("[ENABLED/DISABLED]", ctx.strict_typing); // fact_08
        rulesToon = rulesToon.replace("[DYNAMIC] standard", `${ctx.docs_standard} standard`); // fact_10
        rulesToon = rulesToon.replace("[DYNAMIC: CURRENT SESSION GOAL]", "Project Initialization and Rule Synthesis"); // fact_12

        // 3. Append Project-Specific Pack (The "Gaps")
        const specificPack = `
ZONE 2: PROJECT-SPECIFIC RULES (Gaps detected by MCP)
project_specific_pack:
  - rule:
      Trigger: When performing a feature implementation in this workspace
      Behaviour: Adhere strictly to the detected stack (${ctx.stack}).
      Example:
        Correct:
        <|">
        // Context-aware code for ${ctx.language}
        <|">
`;
        const finalOutput = rulesToon + specificPack;
        await fs.writeFile(path.join(targetDir, ".assistant_rules.toon"), finalOutput);

        return { content: [{ type: "text", text: "Rules synthesized to .assistant_rules.toon successfully." }] };
      }
      return { content: [{ type: "text", text: "Invalid action." }], isError: true };

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Ground Truth CLI MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
