import { action, KeyDownEvent, SingletonAction } from '@elgato/streamdeck';
import { exec } from 'child_process';

@action({ UUID: 'com.kiril-kaikov.monitoringdeck.secret' })
export class SecretAction extends SingletonAction {
  constructor() {
    super();
  }

  override onKeyDown(ev: KeyDownEvent): void {
    const url = 'https://kirilkai.github.io';
    exec(`start ${url}`);
  }
}
