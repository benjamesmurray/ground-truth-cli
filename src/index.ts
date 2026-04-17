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
 * ground-truth-cli MCP Server (v1.1.7)
 * 
 * An Agent-Native project scanner that synthesizes "Ground Truth" rules.
 * Enhanced for monorepos, modern test runtimes (Bun, Playwright), 
 * and AGENTS.md prioritization.
 */

const server = new Server(
  {
    name: "ground-truth-cli",
    version: "1.1.7",
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
  const context: {
    language: string;
    test_framework: string;
    build_system: string;
    strict_typing: string;
    docs_standard: string;
    guidelines: string;
    stack: Set<string>;
    project_root: string;
    architecture: string;
  } = {
    language: "JavaScript/TypeScript",
    test_framework: "Unknown",
    build_system: "npm",
    strict_typing: "DISABLED",
    docs_standard: "JSDoc",
    guidelines: "",
    stack: new Set<string>(),
    project_root: absoluteDir,
    architecture: "Unknown",
  };

  // 1. Language & Monorepo-Aware Dependency Aggregation
  const pkgFiles = await glob("**/package.json", { 
    cwd: absoluteDir, 
    ignore: ["**/node_modules/**", "**/dist/**"] 
  });

  if (pkgFiles.length > 0) {
    context.language = "JavaScript/TypeScript";
  } else if (await glob("**/go.mod", { cwd: absoluteDir })) {
    context.language = "Go";
  } else if (await glob("**/Cargo.toml", { cwd: absoluteDir })) {
    context.language = "Rust";
  } else if (await glob("**/requirements.txt", { cwd: absoluteDir }) || await glob("**/pyproject.toml", { cwd: absoluteDir })) {
    context.language = "Python";
  } else if (await glob("**/*.kt", { cwd: absoluteDir })) {
    context.language = "Kotlin";
  }

  const allDeps: Record<string, string> = {};
  for (const pkgFile of pkgFiles) {
    try {
      const content = await fs.readFile(path.join(absoluteDir, pkgFile), "utf-8");
      const pkg = JSON.parse(content);
      Object.assign(allDeps, pkg.dependencies, pkg.devDependencies);
    } catch (e) {}
  }

  // 2. Broad Ecosystem & Architecture Heuristics
  // Test Frameworks
  if (allDeps.jest) context.test_framework = "Jest";
  else if (allDeps.vitest) context.test_framework = "Vitest";
  else if (allDeps.mocha) context.test_framework = "Mocha";
  else if (allDeps["@playwright/test"]) context.test_framework = "Playwright (E2E)";
  else if (allDeps.cypress) context.test_framework = "Cypress (E2E)";
  else if (allDeps.api) context.test_framework = "AVA";
  else if (allDeps["@types/bun"] || allDeps["bun-types"]) context.test_framework = "Bun Native Testing";

  // Build Systems & Frameworks
  if (allDeps.vite) context.build_system = "Vite";
  else if (allDeps.webpack) context.build_system = "Webpack";
  else if (allDeps.sst) context.build_system = "SST (Serverless Stack)";
  
  if (allDeps["solid-js"]) context.stack.add("Solid.js");
  if (allDeps.effect) context.stack.add("Effect-ts");
  if (allDeps["@effect/io"]) context.stack.add("Effect-ts");

  // Architecture Detection
  if (context.language === "JavaScript/TypeScript") {
    if (allDeps.next) context.architecture = "NextJS_App_Router";
    else if (allDeps.vue && allDeps.nuxt) context.architecture = "Nuxt_Hybrid_Island_Topology";
    else if (allDeps.vue) context.architecture = "Modern_DOM_Compiler_Ergonomics";
    else if (allDeps.fastify) context.architecture = "Fastify_High_Performance_API";
    else if (allDeps["@aws-sdk/client-s3"] || allDeps["aws-lambda"]) context.architecture = "AWS_Lambda_Serverless";
    else if (allDeps["@modelcontextprotocol/sdk"]) context.architecture = "Agentic_Orchestration";
  } else if (context.language === "Rust") {
    if (allDeps.tokio && allDeps.axum) context.architecture = "Asynchronous_Web_Microservices";
    else if (allDeps.clap) context.architecture = "Command_Line_Interfaces";
    else if (allDeps.rayon || allDeps.polars) context.architecture = "High_Performance_Parallel_Data";
    // Detect no_std via Cargo.toml inspection
    try {
      const cargoTomls = await glob("**/Cargo.toml", { cwd: absoluteDir });
      for (const f of cargoTomls) {
        const content = await fs.readFile(path.join(absoluteDir, f), "utf-8");
        if (content.includes("default-features = false") || content.includes("no_std")) {
          context.architecture = "Embedded_Bare_Metal_no_std";
          break;
        }
      }
    } catch {}
  } else if (context.language === "Go") {
    if (allDeps["github.com/segmentio/kafka-go"] || allDeps["github.com/confluentinc/confluent-kafka-go"]) context.architecture = "Kafka_Event_Driven";
  } else if (context.language === "Python") {
    if (allDeps.fastapi) context.architecture = "Async_Microservices_FastAPI";
    else if (allDeps.polars) context.architecture = "Event_Driven_Data_Pipelines";
    else if (allDeps.taskiq) context.architecture = "Stateful_Agentic_Workflows";
  }

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
export async function synthesizeRules(targetDir: string) {
  const ctx = await gatherContext(targetDir);
  
  // Resolve path relative to THIS script (V1.1.0 Fix)
  const templatePath = path.resolve(__dirname, "..", "ground_truth_rules.toon");
  let rulesToon = await fs.readFile(templatePath, "utf-8");

  // Load rules from .toon files
  let toonRules = "";
  let toonFileName = ctx.language.toLowerCase() + ".toon";
  if (ctx.language === "JavaScript/TypeScript") {
    toonFileName = ctx.stack.includes("vue") || ctx.stack.includes("nuxt") ? "vue.toon" : "typescript.toon";
  }
  
  const toonPath = path.resolve(__dirname, "..", toonFileName);
  try {
    const toonContent = await fs.readFile(toonPath, "utf-8");
    const toonData = JSON.parse(toonContent);
    const ruleIds = toonData.architecture_map[ctx.architecture] || [];
    const rules = toonData.rule_registry.filter((r: any) => ruleIds.includes(r.id));
    
    toonRules = rules.map((r: any) => `
  - rule:
      id: ${r.id}
      Trigger: ${r.trigger}
      Behaviour: ${r.behavior}
      Example:
        Correct:
        <|">
        ${r.example.correct}
        <|">
        Incorrect:
        <|">
        ${r.example.incorrect}
        <|">
`).join("\n");
  } catch (e) {
    // Silently continue if toon file or architecture map is missing
  }

  // Sequentially replace dynamic placeholders
  rulesToon = rulesToon.replace("[EXPERT_DEV_GUIDANCE]", toonRules);

  let specificPack = `
ZONE 3: PROJECT-SPECIFIC RULES (Context-Aware Gaps)
project_specific_pack:
`;

  if (ctx.stack && ctx.stack.trim() !== "") {
    specificPack += `  - rule:
      Trigger: When performing a multi-file refactor or implementing new features
      Behaviour: Adhere strictly to the detected stack conventions (${ctx.stack}).
      Example:
        Valid:
        <|">
        // Adhering to ${ctx.language} and ${ctx.test_framework}
        <|">
`;
  }

  if (specificPack.trim() === "ZONE 3: PROJECT-SPECIFIC RULES (Context-Aware Gaps)\nproject_specific_pack:") {
    specificPack = "";
  }

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
            text: `Project: ground-truth-cli (v1.1.7) | Phase: IDLE\nNext: Run \`ground gt_refresh\` or \`ground gt_exec scan .\`` 
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
  console.error("Ground Truth CLI MCP server (v1.1.7) running on stdio");
}

main().catch(console.error);
