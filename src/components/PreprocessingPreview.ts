/**
 * Preprocessing Preview Component
 * Displays the various stages of image preprocessing
 */

import cv from 'opencv-ts';
import { matToCanvas, type PreprocessingResult } from '../lib/imageProcessor';

export class PreprocessingPreview {
  private container: HTMLElement;
  private canvases: Map<string, HTMLCanvasElement> = new Map();

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="preprocessing-preview">
        <h2 class="collapsible collapsed">Preprocessing Stages <span class="toggle-icon">▶</span></h2>
        <div class="collapsible-content preview-grid" style="display: none;">
          <div class="preview-item">
            <h3>Original</h3>
            <canvas id="preview-original"></canvas>
          </div>
          <div class="preview-item">
            <h3>Grayscale</h3>
            <canvas id="preview-grayscale"></canvas>
          </div>
          <div class="preview-item">
            <h3>Blurred</h3>
            <canvas id="preview-blurred"></canvas>
          </div>
          <div class="preview-item">
            <h3>Binary (Thresholded)</h3>
            <canvas id="preview-binary"></canvas>
          </div>
          <div class="preview-item">
            <h3>Processed (Morphology)</h3>
            <canvas id="preview-processed"></canvas>
          </div>
        </div>
      </div>
    `;

    // Store canvas references
    this.canvases.set('original', this.container.querySelector('#preview-original')!);
    this.canvases.set('grayscale', this.container.querySelector('#preview-grayscale')!);
    this.canvases.set('blurred', this.container.querySelector('#preview-blurred')!);
    this.canvases.set('binary', this.container.querySelector('#preview-binary')!);
    this.canvases.set('processed', this.container.querySelector('#preview-processed')!);
  }

  public update(result: PreprocessingResult): void {
    try {
      // Display each preprocessing stage
      const stages = [
        { key: 'original', mat: result.original },
        { key: 'grayscale', mat: result.grayscale },
        { key: 'blurred', mat: result.blurred },
        { key: 'binary', mat: result.binary },
        { key: 'processed', mat: result.processed },
      ];

      stages.forEach(({ key, mat }) => {
        const canvas = this.canvases.get(key);
        if (canvas && mat) {
          // Scale down for preview
          const maxWidth = 300;
          const scale = Math.min(1, maxWidth / mat.cols);
          canvas.width = mat.cols * scale;
          canvas.height = mat.rows * scale;

          // Create temporary resized mat if needed
          if (scale < 1) {
            const resized = new cv.Mat();
            const dsize = new cv.Size(canvas.width, canvas.height);
            cv.resize(mat, resized, dsize, 0, 0, cv.INTER_AREA);
            matToCanvas(resized, canvas);
            resized.delete();
          } else {
            matToCanvas(mat, canvas);
          }
        }
      });
    } catch (error) {
      console.error('Error updating preprocessing preview:', error);
    }
  }

  public clear(): void {
    this.canvases.forEach((canvas) => {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });
  }
}
