/**
 * Composite Preview Component
 * Displays composite image with zoom and pan controls
 */

import cv from "opencv-ts";
import type { LayoutInfo } from "../lib/compositeGenerator";

export interface CompositePreviewOptions {
  onDownload?: () => void;
}

export class CompositePreview {
  private container: HTMLElement;
  private options: CompositePreviewOptions;
  private composite: any = null; // cv.Mat
  private layout: LayoutInfo | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private zoomLevel: number = 1;
  private panX: number = 0;
  private panY: number = 0;
  private isPanning: boolean = false;
  private lastX: number = 0;
  private lastY: number = 0;

  constructor(container: HTMLElement, options: CompositePreviewOptions = {}) {
    this.container = container;
    this.options = options;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="composite-preview">
        <div class="preview-header">
          <h3>Composite Preview</h3>
          <div class="preview-controls">
            <button id="zoom-out-btn" class="icon-btn" title="Zoom Out">-</button>
            <span id="zoom-level" class="zoom-display">100%</span>
            <button id="zoom-in-btn" class="icon-btn" title="Zoom In">+</button>
            <button id="zoom-fit-btn" class="icon-btn" title="Fit to Screen">⊡</button>
            <button id="download-composite-btn" class="upload-btn" disabled>Download Composite</button>
          </div>
        </div>
        <div class="preview-viewport" id="preview-viewport">
          <div class="preview-canvas-wrapper" id="canvas-wrapper">
            <canvas id="composite-canvas" class="composite-canvas"></canvas>
          </div>
        </div>
        <div class="preview-info" id="preview-info"></div>
      </div>
    `;

    this.canvas = this.container.querySelector(
      "#composite-canvas"
    ) as HTMLCanvasElement;

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    // Zoom controls
    const zoomInBtn = this.container.querySelector("#zoom-in-btn");
    const zoomOutBtn = this.container.querySelector("#zoom-out-btn");
    const zoomFitBtn = this.container.querySelector("#zoom-fit-btn");

    zoomInBtn?.addEventListener("click", () => this.zoomIn());
    zoomOutBtn?.addEventListener("click", () => this.zoomOut());
    zoomFitBtn?.addEventListener("click", () => this.zoomToFit());

    // Download button
    const downloadBtn = this.container.querySelector("#download-composite-btn");
    downloadBtn?.addEventListener("click", () => {
      if (this.options.onDownload) {
        this.options.onDownload();
      }
    });

    // Pan controls (mouse drag)
    const viewport = this.container.querySelector("#preview-viewport");
    const wrapper = this.container.querySelector("#canvas-wrapper");

    if (viewport && wrapper) {
      wrapper.addEventListener("mousedown", (e) => {
        const mouseEvent = e as MouseEvent;
        this.isPanning = true;
        this.lastX = mouseEvent.clientX;
        this.lastY = mouseEvent.clientY;
        (wrapper as HTMLElement).style.cursor = "grabbing";
      });

      document.addEventListener("mousemove", (e) => {
        if (!this.isPanning) return;
        const mouseEvent = e as MouseEvent;

        const dx = mouseEvent.clientX - this.lastX;
        const dy = mouseEvent.clientY - this.lastY;

        this.panX += dx;
        this.panY += dy;

        this.lastX = mouseEvent.clientX;
        this.lastY = mouseEvent.clientY;

        this.updateTransform();
      });

      document.addEventListener("mouseup", () => {
        if (this.isPanning) {
          this.isPanning = false;
          (wrapper as HTMLElement).style.cursor = "grab";
        }
      });

      // Mouse wheel zoom
      viewport.addEventListener("wheel", (e) => {
        e.preventDefault();
        const wheelEvent = e as WheelEvent;
        if (wheelEvent.deltaY < 0) {
          this.zoomIn();
        } else {
          this.zoomOut();
        }
      });
    }
  }

  public update(composite: any, layout: LayoutInfo): void {
    // Clean up old composite
    if (this.composite) {
      this.composite.delete();
    }

    this.composite = composite;
    this.layout = layout;

    // Draw composite to canvas
    if (this.canvas) {
      this.canvas.width = composite.cols;
      this.canvas.height = composite.rows;
      cv.imshow(this.canvas, composite);
    }

    // Reset zoom and pan
    this.zoomLevel = 1;
    this.panX = 0;
    this.panY = 0;
    this.updateTransform();

    // Auto fit to screen
    this.zoomToFit();

    // Update info
    this.updateInfo();

    // Enable download button
    const downloadBtn = this.container.querySelector(
      "#download-composite-btn"
    ) as HTMLButtonElement;
    if (downloadBtn) {
      downloadBtn.disabled = false;
    }
  }

  private zoomIn(): void {
    this.zoomLevel = Math.min(this.zoomLevel * 1.2, 5);
    this.updateTransform();
    this.updateZoomDisplay();
  }

  private zoomOut(): void {
    this.zoomLevel = Math.max(this.zoomLevel / 1.2, 0.1);
    this.updateTransform();
    this.updateZoomDisplay();
  }

  private zoomToFit(): void {
    if (!this.canvas) return;

    const viewport = this.container.querySelector("#preview-viewport");
    if (!viewport) return;

    const viewportWidth = viewport.clientWidth - 40; // padding
    const viewportHeight = viewport.clientHeight - 40;

    const scaleX = viewportWidth / this.canvas.width;
    const scaleY = viewportHeight / this.canvas.height;

    this.zoomLevel = Math.min(scaleX, scaleY, 1);
    this.panX = 0;
    this.panY = 0;

    this.updateTransform();
    this.updateZoomDisplay();
  }

  private updateTransform(): void {
    const wrapper = this.container.querySelector("#canvas-wrapper");
    if (wrapper) {
      (
        wrapper as HTMLElement
      ).style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoomLevel})`;
    }
  }

  private updateZoomDisplay(): void {
    const zoomDisplay = this.container.querySelector("#zoom-level");
    if (zoomDisplay) {
      zoomDisplay.textContent = `${Math.round(this.zoomLevel * 100)}%`;
    }
  }

  private updateInfo(): void {
    const infoContainer = this.container.querySelector("#preview-info");
    if (!infoContainer || !this.layout) return;

    infoContainer.innerHTML = `
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Dimensions:</span>
          <span class="info-value">${this.layout.totalWidth}x${this.layout.totalHeight}px</span>
        </div>
        <div class="info-item">
          <span class="info-label">Grid:</span>
          <span class="info-value">${this.layout.rows} rows × ${this.layout.cols} cols</span>
        </div>
        <div class="info-item">
          <span class="info-label">Total Cards:</span>
          <span class="info-value">${this.layout.cardPositions.length}</span>
        </div>
      </div>
    `;
  }

  public clear(): void {
    if (this.composite) {
      this.composite.delete();
      this.composite = null;
    }

    this.layout = null;
    this.zoomLevel = 1;
    this.panX = 0;
    this.panY = 0;

    if (this.canvas) {
      const ctx = this.canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }

    const downloadBtn = this.container.querySelector(
      "#download-composite-btn"
    ) as HTMLButtonElement;
    if (downloadBtn) {
      downloadBtn.disabled = true;
    }

    const infoContainer = this.container.querySelector("#preview-info");
    if (infoContainer) {
      infoContainer.innerHTML = "";
    }
  }

  public getComposite(): any {
    return this.composite;
  }

  public getLayout(): LayoutInfo | null {
    return this.layout;
  }
}
