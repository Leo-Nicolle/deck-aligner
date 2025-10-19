/**
 * Image Uploader Component
 * Handles file selection, drag & drop, and displays image preview
 */

export interface ImageUploaderOptions {
  onImageSelected: (file: File) => void;
  acceptedFormats?: string[];
}

export class ImageUploader {
  private container: HTMLElement;
  private options: ImageUploaderOptions;
  private fileInput: HTMLInputElement;
  private dropZone: HTMLDivElement;
  private previewCanvas: HTMLCanvasElement;

  constructor(container: HTMLElement, options: ImageUploaderOptions) {
    this.container = container;
    this.options = {
      acceptedFormats: ['image/png', 'image/jpeg', 'image/jpg'],
      ...options,
    };

    this.fileInput = this.createFileInput();
    this.dropZone = this.createDropZone();
    this.previewCanvas = this.createPreviewCanvas();

    this.render();
    this.attachEventListeners();
  }

  private createFileInput(): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = this.options.acceptedFormats?.join(',') || 'image/*';
    input.id = 'file-input';
    input.style.display = 'none';
    return input;
  }

  private createDropZone(): HTMLDivElement {
    const zone = document.createElement('div');
    zone.className = 'drop-zone';
    zone.innerHTML = `
      <div class="drop-zone-content">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        <h3>Drop image here or click to upload</h3>
        <p>Supported formats: PNG, JPEG</p>
        <button type="button" id="upload-btn" class="upload-btn">Select Image</button>
      </div>
    `;
    return zone;
  }

  private createPreviewCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.className = 'preview-canvas';
    canvas.style.display = 'none';
    return canvas;
  }

  private render(): void {
    this.container.innerHTML = '';
    this.container.appendChild(this.fileInput);
    this.container.appendChild(this.dropZone);
    this.container.appendChild(this.previewCanvas);
  }

  private attachEventListeners(): void {
    // File input change
    this.fileInput.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        this.handleFile(target.files[0]);
      }
    });

    // Upload button click
    const uploadBtn = this.dropZone.querySelector('#upload-btn');
    uploadBtn?.addEventListener('click', () => {
      this.fileInput.click();
    });

    // Drop zone click
    this.dropZone.addEventListener('click', (e) => {
      if (e.target === this.dropZone || (e.target as HTMLElement).closest('.drop-zone-content')) {
        this.fileInput.click();
      }
    });

    // Drag and drop events
    this.dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dropZone.classList.add('drag-over');
    });

    this.dropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      this.dropZone.classList.remove('drag-over');
    });

    this.dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dropZone.classList.remove('drag-over');

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        this.handleFile(files[0]);
      }
    });
  }

  private handleFile(file: File): void {
    // Validate file type
    if (this.options.acceptedFormats && !this.options.acceptedFormats.includes(file.type)) {
      alert(`Invalid file type. Please upload: ${this.options.acceptedFormats.join(', ')}`);
      return;
    }

    // Show preview
    this.showPreview(file);

    // Notify parent
    this.options.onImageSelected(file);
  }

  private showPreview(file: File): void {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate dimensions to fit preview (max 800px width)
        const maxWidth = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        this.previewCanvas.width = width;
        this.previewCanvas.height = height;

        const ctx = this.previewCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
        }

        // Hide drop zone, show canvas
        this.dropZone.style.display = 'none';
        this.previewCanvas.style.display = 'block';
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  }

  public reset(): void {
    this.fileInput.value = '';
    this.dropZone.style.display = 'block';
    this.previewCanvas.style.display = 'none';

    const ctx = this.previewCanvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
    }
  }
}
