import { Before, After, BeforeAll, AfterAll } from '@cucumber/cucumber';
import { PlaywrightWorld } from './world';

BeforeAll(async function () {
  // global setup if needed
});

AfterAll(async function () {
  // global teardown if needed
});

Before(async function (this: PlaywrightWorld) {
  this.consoleErrors = [];
  await this.init();

  this.page.on('console', (msg) => {
    if (msg.type() === 'error') {
      this.consoleErrors.push(msg.text());
    }
  });
});

After(async function (this: PlaywrightWorld) {
  await this.close();
});
