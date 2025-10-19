/**
 * Batch Progress Component
 * Displays processing progress and queue status
 */

import type { ProcessedImage } from "../lib/batchProcessor";

export class BatchProgress {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="batch-progress">
        <h2 class="collapsible">Batch Processing <span class="toggle-icon">▼</span></h2>
        <div class="collapsible-content">
          <div class="progress-stats">
            <div class="stat-item">
              <span class="stat-label">Images:</span>
              <span class="stat-value" id="progress-images">0/0</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Total Cards:</span>
              <span class="stat-value" id="progress-cards">0</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Status:</span>
              <span class="stat-value" id="progress-status">Ready</span>
            </div>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar" id="batch-progress-bar"></div>
          </div>
          <div id="progress-message" class="progress-message"></div>
          <div id="image-queue" class="image-queue"></div>
        </div>
      </div>
    `;
  }

  public updateProgress(current: number, total: number, imageName: string): void {
    const progressBar = this.container.querySelector(
      "#batch-progress-bar"
    ) as HTMLElement;
    const progressImages = this.container.querySelector("#progress-images");
    const progressStatus = this.container.querySelector("#progress-status");
    const progressMessage = this.container.querySelector("#progress-message");

    if (progressBar) {
      const percentage = (current / total) * 100;
      progressBar.style.width = `${percentage}%`;
    }

    if (progressImages) {
      progressImages.textContent = `${current}/${total}`;
    }

    if (progressStatus) {
      progressStatus.textContent = "Processing...";
      progressStatus.className = "stat-value processing";
    }

    if (progressMessage) {
      progressMessage.textContent = `Processing: ${imageName}`;
    }
  }

  public updateStats(completed: number, total: number, totalCards: number): void {
    const progressImages = this.container.querySelector("#progress-images");
    const progressCards = this.container.querySelector("#progress-cards");
    const progressStatus = this.container.querySelector("#progress-status");

    if (progressImages) {
      progressImages.textContent = `${completed}/${total}`;
    }

    if (progressCards) {
      progressCards.textContent = totalCards.toString();
    }

    if (progressStatus) {
      if (completed === total) {
        progressStatus.textContent = "Completed";
        progressStatus.className = "stat-value completed";
      } else {
        progressStatus.textContent = "Processing...";
        progressStatus.className = "stat-value processing";
      }
    }
  }

  public updateQueue(images: ProcessedImage[]): void {
    const queue = this.container.querySelector("#image-queue");
    if (!queue) return;

    queue.innerHTML = `
      <h3>Image Queue</h3>
      <div class="queue-list">
        ${images
          .map(
            (img) => `
          <div class="queue-item ${img.status}">
            <span class="queue-icon">${this.getStatusIcon(img.status)}</span>
            <span class="queue-name">${img.fileName}</span>
            <span class="queue-cards">${img.extractedCards.length} cards</span>
            ${img.error ? `<span class="queue-error">${img.error}</span>` : ""}
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case "completed":
        return "✓";
      case "processing":
        return "⏳";
      case "error":
        return "✗";
      default:
        return "○";
    }
  }

  public setComplete(): void {
    const progressStatus = this.container.querySelector("#progress-status");
    const progressMessage = this.container.querySelector("#progress-message");

    if (progressStatus) {
      progressStatus.textContent = "Completed";
      progressStatus.className = "stat-value completed";
    }

    if (progressMessage) {
      progressMessage.textContent = "All images processed successfully!";
    }
  }

  public clear(): void {
    const progressBar = this.container.querySelector(
      "#batch-progress-bar"
    ) as HTMLElement;
    const progressImages = this.container.querySelector("#progress-images");
    const progressCards = this.container.querySelector("#progress-cards");
    const progressStatus = this.container.querySelector("#progress-status");
    const progressMessage = this.container.querySelector("#progress-message");
    const queue = this.container.querySelector("#image-queue");

    if (progressBar) progressBar.style.width = "0%";
    if (progressImages) progressImages.textContent = "0/0";
    if (progressCards) progressCards.textContent = "0";
    if (progressStatus) {
      progressStatus.textContent = "Ready";
      progressStatus.className = "stat-value";
    }
    if (progressMessage) progressMessage.textContent = "";
    if (queue) queue.innerHTML = "";
  }
}
