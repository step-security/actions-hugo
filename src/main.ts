import * as core from '@actions/core';
import axios, {isAxiosError} from 'axios';
import * as exec from '@actions/exec';
import {getLatestVersion} from './get-latest-version';
import {installer} from './installer';
import {Tool} from './constants';

export interface ActionResult {
  exitcode: number;
  output: string;
}

export async function showVersion(cmd: string, args: string[]): Promise<ActionResult> {
  const result: ActionResult = {
    exitcode: 0,
    output: ''
  };

  const options = {
    listeners: {
      stdout: (data: Buffer): void => {
        result.output += data.toString();
      }
    }
  };

  result.exitcode = await exec.exec(cmd, args, options);
  core.debug(`command: ${cmd} ${args}`);
  core.debug(`exit code: ${result.exitcode}`);
  core.debug(`stdout: ${result.output}`);
  return result;
}

async function validateSubscription(): Promise<void> {
    const API_URL = `https://agent.api.stepsecurity.io/v1/github/${process.env.GITHUB_REPOSITORY}/actions/subscription`;

    try {
        await axios.get(API_URL, {timeout: 3000});
    } catch (error) {
        if (isAxiosError(error) && error.response?.status === 403) {
            core.error(
                'Subscription is not valid. Reach out to support@stepsecurity.io'
            );
            // eslint-disable-next-line no-process-exit
            process.exit(1);
        } else {
        core.info('Timeout or API not reachable. Continuing to next step.');
        }
    }
}

export async function run(): Promise<ActionResult> {
  await validateSubscription();

  const toolVersion: string = core.getInput('hugo-version');
  let installVersion = '';

  let result: ActionResult = {
    exitcode: 0,
    output: ''
  };

  if (toolVersion === '' || toolVersion === 'latest') {
    installVersion = await getLatestVersion(Tool.Org, Tool.Repo, 'brew');
  } else {
    installVersion = toolVersion;
  }

  core.info(`${Tool.Name} version: ${installVersion}`);
  await installer(installVersion);
  result = await showVersion(Tool.CmdName, [Tool.CmdOptVersion]);

  return result;
}
