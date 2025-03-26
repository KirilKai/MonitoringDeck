import {
  action,
  KeyDownEvent,
  SingletonAction,
  WillAppearEvent,
} from '@elgato/streamdeck';
import os from 'os';

@action({ UUID: 'com.kiril-kaikov.monitoringdeck.cpuutilization' })
export class CPUUtilizationAction extends SingletonAction {
  private interval: NodeJS.Timeout | null = null;
  private lastIdle: number = 0;
  private lastTotal: number = 0;
  private isMonitoring: boolean = true;

  constructor() {
    super();
  }

  /**
   * Called when the action appears on the Stream Deck.
   * Initializes and starts an interval to update the CPU utilization every second.
   */
  override onWillAppear(ev: WillAppearEvent): void {
    this.updateCPUUtilization(ev);
    this.interval = setInterval(() => this.updateCPUUtilization(ev), 1000); // Update every second
  }

  /**
   * Called when the button is pressed.
   * Toggles CPU utilization monitoring on/off.
   */
  override onKeyDown(ev: KeyDownEvent): void {
    if (this.isMonitoring) {
      // Stop monitoring
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
      ev.action.setTitle('CPU\nPaused');
    } else {
      // Start monitoring
      this.updateCPUUtilization(ev);
      this.interval = setInterval(() => this.updateCPUUtilization(ev), 1000);
    }

    this.isMonitoring = !this.isMonitoring;
  }

  /**
   * Updates the CPU utilization and sets the title of the Stream Deck button.
   * @param ev - The event triggering the update (appearance or key press).
   */
  async updateCPUUtilization(
    ev: WillAppearEvent | KeyDownEvent
  ): Promise<void> {
    const utilization = this.getCPUUtilization();
    await ev.action.setTitle(`CPU\n${Math.round(utilization)}%`);
  }

  /**
   * Calculates the CPU utilization based on system statistics.
   * Uses the difference in CPU times to estimate the current usage.
   * @returns The CPU utilization as a percentage (0-100).
   */
  getCPUUtilization(): number {
    const cpus = os.cpus();
    let idle = 0;
    let total = 0;

    // Aggregate CPU times
    for (const cpu of cpus) {
      idle += cpu.times.idle;
      total +=
        cpu.times.user +
        cpu.times.nice +
        cpu.times.sys +
        cpu.times.irq +
        cpu.times.idle;
    }

    // Calculate differences since last update
    const idleDiff = idle - this.lastIdle;
    const totalDiff = total - this.lastTotal;

    // Store the latest values for the next calculation
    this.lastIdle = idle;
    this.lastTotal = total;

    if (totalDiff === 0) return 0; // Prevent division by zero

    return 100 * (1 - idleDiff / totalDiff); // CPU usage percentage
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
