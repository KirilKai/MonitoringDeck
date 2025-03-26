import {
  action,
  KeyDownEvent,
  SingletonAction,
  WillAppearEvent,
} from '@elgato/streamdeck';
import { execSync } from 'child_process';

@action({ UUID: 'com.kiril-kaikov.monitoringdeck.gpuutilization' })
export class GPUUtilizationAction extends SingletonAction {
  private interval: NodeJS.Timeout | null = null;
  private isMonitoring: boolean = true;

  constructor() {
    super();
  }

  /**
   * Called when the action appears on the Stream Deck.
   * Initializes and starts an interval to update the GPU utilization every second.
   */
  override onWillAppear(ev: WillAppearEvent): void {
    this.updateGPUUtilization(ev);
    this.interval = setInterval(() => this.updateGPUUtilization(ev), 1000);
  }

  /**
   * Called when the button is pressed.
   * Toggles GPU utilization monitoring on/off.
   */
  override onKeyDown(ev: KeyDownEvent): void {
    if (this.isMonitoring) {
      // Stop monitoring
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
      ev.action.setTitle('GPU\nPaused');
    } else {
      // Start monitoring
      this.updateGPUUtilization(ev);
      this.interval = setInterval(() => this.updateGPUUtilization(ev), 1000);
    }

    this.isMonitoring = !this.isMonitoring;
  }

  /**
   * Updates the GPU utilization and sets the title of the Stream Deck button.
   * @param ev - The event triggering the update.
   */
  async updateGPUUtilization(
    ev: WillAppearEvent | KeyDownEvent
  ): Promise<void> {
    const utilization = this.getGPUUtilization();
    await ev.action.setTitle(`GPU\n${Math.round(utilization)}%`);
  }

  /**
   * Retrieves GPU utilization using Windows' built-in tools (WMIC/NVIDIA-SMI if available).
   * @returns The GPU utilization as a percentage (0-100).
   */
  getGPUUtilization(): number {
    try {
      // Attempt to use WMIC
      const result = execSync(
        'wmic path Win32_PerfFormattedData_GPUPerformanceCounters_GPUEngine query',
        { encoding: 'utf8' }
      );
      const match = result.match(/Utilization_Percentage\s*=\s*(\d+)/);
      if (match) return parseInt(match[1], 10);
    } catch (error) {
      console.error('WMIC failed:', error);
    }

    try {
      // Attempt to use NVIDIA-SMI for NVIDIA GPUs
      const result = execSync(
        'nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits',
        { encoding: 'utf8' }
      ).trim();
      return parseInt(result, 10);
    } catch (error) {
      console.error('NVIDIA-SMI failed:', error);
    }

    return 0; // Default to 0 if no data found
  }

  /**
   * Called when the action disappears from the Stream Deck.
   * Clears the update interval to prevent memory leaks.
   */
  override onWillDisappear(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
