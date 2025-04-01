import {
  action,
  KeyDownEvent,
  SingletonAction,
  WillAppearEvent,
} from '@elgato/streamdeck';
import { execSync } from 'child_process';

@action({ UUID: 'com.kiril-kaikov.monitoringdeck.downloadspeed' })
export class DownloadSpeedAction extends SingletonAction {
  private interval: NodeJS.Timeout | null = null;
  private isMonitoring: boolean = true;
  private prevRxBytes: number = 0;

  constructor() {
    super();
  }

  /**
   * Called when the action appears on the Stream Deck.
   * Starts monitoring download speed.
   */
  override async onWillAppear(ev: WillAppearEvent): Promise<void> {
    console.log('DownloadSpeedAction appeared.');
    this.prevRxBytes = this.getReceivedBytes();

    this.updateDownloadSpeed(ev);
    this.interval = setInterval(() => this.updateDownloadSpeed(ev), 500);
  }

  /**
   * Called when the button is pressed.
   * Toggles network speed monitoring on/off.
   */
  override onKeyDown(ev: KeyDownEvent): void {
    if (this.isMonitoring) {
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
      ev.action.setTitle('Speed\nPaused');
    } else {
      this.prevRxBytes = this.getReceivedBytes();
      this.updateDownloadSpeed(ev);
      this.interval = setInterval(() => this.updateDownloadSpeed(ev), 500);
    }
    this.isMonitoring = !this.isMonitoring;
  }

  /**
   * Gets the total received bytes from Windows using PowerShell.
   */
  private getReceivedBytes(): number {
    try {
      const output = execSync('netstat -e | findstr "Bytes Received"', {
        encoding: 'utf8',
      }).trim();
      const bytesReceived = output.match(/\d+/g);
      if (bytesReceived && bytesReceived[0]) {
        return parseInt(bytesReceived[0], 10) || 0;
      }
      return 0;
    } catch (error) {
      console.error('Error fetching received bytes with netstat:', error);
      return 0;
    }
  }

  // old
  // private getReceivedBytes(): number {
  //   try {
  //     const output = execSync(
  //       'powershell -Command "& {(Get-NetAdapterStatistics | Where-Object { $_.ReceivedBytes -gt 0 } | Select-Object -ExpandProperty ReceivedBytes)}"',
  //       { encoding: 'utf8' }
  //     ).trim();
  //     return parseInt(output, 10) || 0;
  //   } catch (error) {
  //     console.error('Error fetching received bytes:', error);
  //     return 0;
  //   }
  // }

  /**
   * Fetches network stats and updates the Stream Deck button title.
   */
  private async updateDownloadSpeed(
    ev: WillAppearEvent | KeyDownEvent
  ): Promise<void> {
    console.log('Fetching network speed...');
    const currentRxBytes = this.getReceivedBytes();

    // Convert to Megabits per second (Mbps)
    const speedMbps = ((currentRxBytes - this.prevRxBytes) * 8) / 1_000_000;
    this.prevRxBytes = currentRxBytes;

    console.log(`Download Speed: ${speedMbps.toFixed(1)} Mbps`);
    await ev.action.setTitle(`DL\n${speedMbps.toFixed(1)}\nMbps`);
  }

  /**
   * Called when the action disappears from the Stream Deck.
   * Clears the update interval to prevent memory leaks.
   */
  override onWillDisappear(): void {
    console.log('DownloadSpeedAction disappeared. Stopping interval.');
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
