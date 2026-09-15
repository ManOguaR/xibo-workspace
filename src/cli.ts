#!/usr/bin/env node

import {
    printUsage,
    runAddCommand,
    runNewCommand
} from "./commands/scaffold.js";

import {
    runBuildCommand
} from "./commands/build.js";

import { 
    runRunCommand 
} from "./commands/run.js";

import { 
    runAppCommand 
} from "./commands/application.js";

const [, , command, ...args] = process.argv;

switch (command) {
    case "new":
        await runNewCommand(args);
        break;

    case "add":
        await runAddCommand(args);
        break;

    case "build":
        await runBuildCommand();
        break;
        
    case "run":
        await runRunCommand();
        break;

    case "app":
        await runAppCommand(args);
        break;

    default:
        await printUsage();
        process.exit(1);
}