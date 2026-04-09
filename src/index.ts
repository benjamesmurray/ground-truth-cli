import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";
import { glob } from "glob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * ground-truth-cli MCP Server (v1.1.3)
 * 
 * An Agent-Native project scanner that synthesizes "Ground Truth" rules.
 * Enhanced for monorepos, modern test runtimes (Bun, Playwright), 
 * and AGENTS.md prioritization.
 */

const server = new Server(
  {
    name: "ground-truth-cli",
    version: "1.1.3",
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
        name: "gt_refresh",
        description: "A parameterless tool to quickly refresh project rules and the .assistant_rules.toon file.",
        inputSchema: { type: "object", properties: {} },
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
 * Enhanced Context Gathering (Monorepo-Aware & Ecosystem-Rich)
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
    stack: new Set<string>(),
    project_root: absoluteDir,
  };

  // 1. Monorepo-Aware Dependency Aggregation
  const pkgFiles = await glob("**/package.json", { 
    cwd: absoluteDir, 
    ignore: ["**/node_modules/**", "**/dist/**"] 
  });

  const allDeps: Record<string, string> = {};
  for (const pkgFile of pkgFiles) {
    try {
      const content = await fs.readFile(path.join(absoluteDir, pkgFile), "utf-8");
      const pkg = JSON.parse(content);
      Object.assign(allDeps, pkg.dependencies, pkg.devDependencies);
    } catch (e) {}
  }

  // 2. Broad Ecosystem Heuristics
  // Test Frameworks
  if (allDeps.jest) context.test_framework = "Jest";
  else if (allDeps.vitest) context.test_framework = "Vitest";
  else if (allDeps.mocha) context.test_framework = "Mocha";
  else if (allDeps["@playwright/test"]) context.test_framework = "Playwright (E2E)";
  else if (allDeps.cypress) context.test_framework = "Cypress (E2E)";
  else if (allDeps.ava) context.test_framework = "AVA";
  else if (allDeps["@types/bun"] || allDeps["bun-types"]) context.test_framework = "Bun Native Testing";

  // Build Systems & Frameworks
  if (allDeps.vite) context.build_system = "Vite";
  else if (allDeps.webpack) context.build_system = "Webpack";
  else if (allDeps.sst) context.build_system = "SST (Serverless Stack)";
  
  if (allDeps["solid-js"]) context.stack.add("Solid.js");
  if (allDeps.effect) context.stack.add("Effect-ts");
  if (allDeps["@effect/io"]) context.stack.add("Effect-ts");

  Object.keys(allDeps).slice(0, 20).forEach(d => context.stack.add(d));

  // 3. Detect Strict Typing
  try {
    const tsFiles = await glob("**/tsconfig.json", { 
      cwd: absoluteDir, 
      ignore: ["**/node_modules/**"] 
    });
    for (const tsFile of tsFiles) {
      const tsContent = await fs.readFile(path.join(absoluteDir, tsFile), "utf-8");
      if (tsContent.includes('"strict": true')) {
        context.strict_typing = "ENABLED";
        break;
      }
    }
  } catch {}

  // 4. Prioritized Guideline Extraction (AGENTS.md > .cursorrules > README.md)
  const guidelineFiles = ["AGENTS.md", ".cursorrules", ".windsurfrules", "CONTRIBUTING.md", "README.md"];
  for (const file of guidelineFiles) {
    try {
      const content = await fs.readFile(path.join(absoluteDir, file), "utf-8");
      context.guidelines = `Extracted from ${file}:\n${content.substring(0, 1000)}`;
      break; 
    } catch (e) {}
  }

  return { ...context, stack: Array.from(context.stack).join(", ") };
}

/**
 * Sequential Placeholder Injection Logic
 */
async function synthesizeRules(targetDir: string) {
  const ctx = await gatherContext(targetDir);
  
  // Resolve path relative to THIS script (V1.1.0 Fix)
  const templatePath = path.resolve(__dirname, "..", "ground_truth_rules.toon");
  let rulesToon = await fs.readFile(templatePath, "utf-8");

  // Sequentially replace dynamic placeholders
  rulesToon = rulesToon.replace("[DYNAMIC: TO BE FILLED BY MCP]", ctx.language);
  rulesToon = rulesToon.replace("[DYNAMIC: TO BE FILLED BY MCP]", ctx.test_framework);
  rulesToon = rulesToon.replace("[DYNAMIC: TO BE FILLED BY MCP]", ctx.project_root);
  rulesToon = rulesToon.replace("[DYNAMIC: TO BE FILLED BY MCP]", ctx.build_system);
  rulesToon = rulesToon.replace("[ENABLED/DISABLED]", ctx.strict_typing);
  rulesToon = rulesToon.replace("[DYNAMIC] standard", `${ctx.docs_standard} standard`);
  rulesToon = rulesToon.replace("[DYNAMIC: CURRENT SESSION GOAL]", "Project Optimization and Rule Synthesis");

  const specificPack = `
ZONE 3: PROJECT-SPECIFIC RULES (Context-Aware Gaps)
project_specific_pack:
  - rule:
      Trigger: When performing a multi-file refactor or implementing new features
      Behaviour: Adhere strictly to the detected stack conventions (${ctx.stack}).
      Example:
        Valid:
        <|">
        // Adhering to ${ctx.language} and ${ctx.test_framework}
        <|">

  - rule:
      Trigger: When interpreting project guidelines
      Behaviour: Prioritize the following extracted intent: ${ctx.guidelines.substring(0, 200)}...
      Example:
        Correct:
        <|">
        // Guideline alignment check
        <|">
`;

  const finalOutput = rulesToon + specificPack;
  await fs.writeFile(path.join(targetDir, ".assistant_rules.toon"), finalOutput);
  return finalOutput;
}

/**
 * Tool Execution Handler
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "gt_status": {
      try {
        const content = await fs.readFile(".assistant_rules.toon", "utf-8");
        return {
          content: [{ type: "text", text: content }],
        };
      } catch (e) {
        return {
          content: [{ 
            type: "text", 
            text: `Project: ground-truth-cli (v1.1.3) | Phase: IDLE\nNext: Run \`gt_refresh\` or \`gt_exec scan .\`` 
          }],
        };
      }
    }

    case "gt_refresh":
      await synthesizeRules(".");
      return {
        content: [{ type: "text", text: "Successfully refreshed .assistant_rules.toon based on current workspace context." }],
      };

    case "gt_exec":
      if (args?.action === "scan") {
        const targetDir = (args.resource as string) || ".";
        const output = await synthesizeRules(targetDir);
        return { 
          content: [{ 
            type: "text", 
            text: output 
          }] 
        };
      }
      return { content: [{ type: "text", text: "Invalid action." }], isError: true };

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Ground Truth CLI MCP server (v1.1.3) running on stdio");
}

main().catch(console.error);
