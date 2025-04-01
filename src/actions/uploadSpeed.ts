import {
  action,
  KeyDownEvent,
  SingletonAction,
  WillAppearEvent,
} from '@elgato/streamdeck';
import { execSync } from 'child_process';

@action({ UUID: 'com.kiril-kaikov.monitoringdeck.uploadspeed' })
export class UploadSpeedAction extends SingletonAction {
  private interval: NodeJS.Timeout | null = null;
  private isMonitoring: boolean = true;
  private prevTxBytes: number = 0;

  constructor() {
    super();
  }

  /**
   * Called when the action appears on the Stream Deck.
   * Starts monitoring upload speed.
   */
  override async onWillAppear(ev: WillAppearEvent): Promise<void> {
    console.log('UploadSpeedAction appeared.');
    this.prevTxBytes = this.getSentBytes();

    this.updateUploadSpeed(ev);
    this.interval = setInterval(() => this.updateUploadSpeed(ev), 500);
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
      this.prevTxBytes = this.getSentBytes();
      this.updateUploadSpeed(ev);
      this.interval = setInterval(() => this.updateUploadSpeed(ev), 500);
    }
    this.isMonitoring = !this.isMonitoring;
  }

  /**
   * Gets the total sent bytes from Windows using PowerShell.
   */
  private getSentBytes(): number {
    try {
      const output = execSync('netstat -e | findstr "Bytes Sent"', {
        encoding: 'utf8',
      }).trim();
      const bytesSent = output.match(/\d+/g);
      if (bytesSent && bytesSent[0]) {
        return parseInt(bytesSent[0], 10) || 0;
      }
      return 0;
    } catch (error) {
      console.error('Error fetching sent bytes with netstat:', error);
      return 0;
    }
  }

  /**
   * Fetches network stats and updates the Stream Deck button title.
   */
  private async updateUploadSpeed(
    ev: WillAppearEvent | KeyDownEvent
  ): Promise<void> {
    console.log('Fetching network upload speed...');
    const currentTxBytes = this.getSentBytes();

    // Convert to Megabits per second (Mbps)
    const speedMbps = ((currentTxBytes - this.prevTxBytes) * 8) / 1_000_000;
    this.prevTxBytes = currentTxBytes;

    console.log(`Upload Speed: ${speedMbps.toFixed(1)} Mbps`);
    await ev.action.setTitle(`UL\n${speedMbps.toFixed(1)}\nMbps`);
  }

  // old
  // private getSentBytes(): number {
  //   try {
  //     const output = execSync(
  //       'powershell -Command "& {(Get-NetAdapterStatistics | Where-Object { $_.SentBytes -gt 0 } | Select-Object -ExpandProperty SentBytes)}"',
  //       { encoding: 'utf8' }
  //     ).trim();
  //     return parseInt(output, 10) || 0;
  //   } catch (error) {
  //     console.error('Error fetching sent bytes:', error);
  //     return 0;
  //   }
  // }

  /**
   * Called when the action disappears from the Stream Deck.
   * Clears the update interval to prevent memory leaks.
   */
  override onWillDisappear(): void {
    console.log('UploadSpeedAction disappeared. Stopping interval.');
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
