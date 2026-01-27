import { Command } from 'commander';
import { scanCommand } from './commands/scan';

const program = new Command();

program
  .name('vulx')
  .description('Combined CLI for VULX API Security Scanner')
  .version('1.0.0');

program.addCommand(scanCommand);

program.parse(process.argv);
