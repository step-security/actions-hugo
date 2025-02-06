import * as core from '@actions/core';
import * as main from './main';

(async (): Promise<void> => {
  try {
    await main.run();
  } catch (e) {
    let errorMessage = 'Action failed with erro';
    if (e instanceof Error) {
      errorMessage += `${e.message}`;
    }
    core.setFailed(errorMessage);
  }
})();
