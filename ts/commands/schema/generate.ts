import { writeFile as _writeFile } from 'fs';
import { resolve } from 'path';
import { promisify } from 'util';

import Command from 'ember-cli/lib/models/command';
import { withDir } from 'tmp-promise';

import { EmberMakeupAddon, addonName } from '../../addon';

const writeFile = promisify(_writeFile);

interface SchemaGenerateOptions {
  dependencies: boolean;
  environment: string;
  output: string;
}

export default class SchemaGenerateCommand extends Command {
  works = 'insideProject' as const;
  description = "Generates the makeup schema from the project's style files.";
  availableOptions = [
    {
      name: 'dependencies',
      type: Boolean,
      default: false,
      aliases: ['d'],
      description:
        'Whether to also parse and include style files of dependencies'
    },
    {
      name: 'environment',
      type: String,
      default: 'development',
      aliases: ['e'],
      description: 'The environment to use while building'
    },
    {
      name: 'output',
      type: String,
      default: './makeup.schema.json',
      aliases: ['o'],
      description:
        'The file path relative to the project root to write the schema to'
    }
  ];

  async run({ environment, output }: SchemaGenerateOptions) {
    const Builder = this.project.require(
      'ember-cli/lib/models/builder'
    ) as typeof import('ember-cli/lib/models/builder').default;
    const owner = this.project.findAddonByName(addonName) as EmberMakeupAddon;
    const schemaOutputFile = resolve(this.project.root, output);

    await withDir(
      async ({ path: outputPath }) => {
        const builder = new Builder({
          outputPath,
          environment,
          ui: this.ui,
          project: this.project
        });

        try {
          await builder.build();
        } finally {
          await builder.cleanup();
        }
      },
      { unsafeCleanup: true }
    );

    const { usages } = owner;

    // @TODO: write a proper schema generator
    await writeFile(schemaOutputFile, JSON.stringify(usages, null, 2));
  }
}

// https://github.com/ember-cli/ember-cli/blob/cf55d3c36118e6a04ace1cf183951f310cfca9cd/lib/cli/lookup-command.js#L18
SchemaGenerateCommand.prototype.name = 'makeup:schema:generate';
