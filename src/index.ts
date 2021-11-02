
'use strict';
import * as Server from './core/server';
import { Config } from './configurations';

// Catch unhandled unexpected exceptions
process.on('uncaughtException', (error: Error) => {
  console.info(`uncaughtException ${error.message}`);
});

// Catch unhandled rejected promises
process.on('unhandledRejection', (reason: any) => {
  console.info(`unhandledRejection ${reason}`);
  if (reason.message.includes(`Couldn't load service definitions`)) {
    process.exit(1);
  }
});

console.info(`Running environment ${process.env.CLUSTER_NAME || 'default'}`);

const config = Config.config().get();
console.info('Loaded config');

const app = Server.init(config);
