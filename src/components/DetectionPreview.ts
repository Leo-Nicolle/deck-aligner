/**
 * Detection Preview Component
 * Displays detected cards overlaid on the original image
 */

import { matToCanvas } from '../lib/imageProcessor';
import { drawDetectedCards, type CardDetectionResult } from '../lib/cardDetector';

export class DetectionPreview {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement | null = null;
  private statsDiv: HTMLDivElement | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="detection-preview">
        <h2 class="collapsible">Card Detection Results <span class="toggle-icon">▼</span></h2>
        <div class="collapsible-content">
          <div id="detection-stats" class="stats"></div>
          <canvas id="detection-canvas"></canvas>
        </div>
      </div>
    `;

    this.canvas = this.container.querySelector('#detection-canvas');
    this.statsDiv = this.container.querySelector('#detection-stats');
  }

  public update(
    originalImage: any,
    detectionResult: CardDetectionResult
  ): void {
    if (!this.canvas || !this.statsDiv) return;

    try {
      // Clone the original image to draw on
      const displayImage = originalImage.clone();

      // Draw detected cards on the image
      drawDetectedCards(displayImage, detectionResult);

      // Display the annotated image
      matToCanvas(displayImage, this.canvas);
      displayImage.delete();

      // Update statistics
      this.updateStats(detectionResult);
    } catch (error) {
      console.error('Error updating detection preview:', error);
    }
  }

  private updateStats(result: CardDetectionResult): void {
    if (!this.statsDiv) return;

    const statsHTML = `
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">Cards Detected:</span>
          <span class="stat-value">${result.filteredCount}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Total Contours Found:</span>
          <span class="stat-value">${result.totalContours}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Filtered Out:</span>
          <span class="stat-value">${result.totalContours - result.filteredCount}</span>
        </div>
      </div>
      ${result.filteredCount === 0 ? `
        <div class="warning">
          <strong>No cards detected!</strong>
          <p>Try adjusting the preprocessing settings or ensure your image has cards on a contrasting background.</p>
        </div>
      ` : ''}
      ${result.filteredCount > 0 ? `
        <div class="card-details">
          <h3>Detected Cards:</h3>
          <ul>
            ${result.cards.map((card, i) => `
              <li>
                Card ${i + 1}:
                ${card.boundingRect.width}x${card.boundingRect.height}px,
                Aspect Ratio: ${card.aspectRatio.toFixed(2)}
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}
    `;

    this.statsDiv.innerHTML = statsHTML;
  }

  public clear(): void {
    if (this.canvas) {
      const ctx = this.canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }
    if (this.statsDiv) {
      this.statsDiv.innerHTML = '';
    }
  }
}
