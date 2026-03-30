import { spawnSync } from "node:child_process";

const pnpmExecPath = process.env.npm_execpath;
const hasPnpmExecPath = typeof pnpmExecPath === "string" && pnpmExecPath.length > 0;
const pnpmInvoker = hasPnpmExecPath
	? {
			command: process.execPath,
			argsPrefix: [pnpmExecPath],
			shell: false,
		}
	: {
			command: process.platform === "win32" ? "pnpm.cmd" : "pnpm",
			argsPrefix: [],
			shell: process.platform === "win32",
		};

function runScript(scriptName) {
	console.log(`[postinstall] Running pnpm script: ${scriptName}`);
	const result = spawnSync(pnpmInvoker.command, [...pnpmInvoker.argsPrefix, "run", scriptName], {
		stdio: "inherit",
		env: process.env,
		shell: pnpmInvoker.shell,
	});

	if (result.error) {
		console.error(`[postinstall] Failed to start "${scriptName}" (${result.error.message}).`);
		return false;
	}

	if (result.signal) {
		console.error(`[postinstall] "${scriptName}" was terminated by signal ${result.signal}.`);
		return false;
	}

	if (result.status !== 0) {
		console.error(`[postinstall] "${scriptName}" exited with code ${result.status}.`);
		return false;
	}

	return true;
}

if (!runScript("rebuild:native")) {
	process.exit(1);
}

if (!runScript("build:platform-native-helpers")) {
	process.exit(1);
}
