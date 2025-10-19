/**
 * Batch Uploader Component
 * Handles multiple file upload with drag & drop
 */

export interface BatchUploaderOptions {
  onFilesSelected: (files: File[]) => void;
  acceptedFormats?: string[];
  maxFiles?: number;
}

export class BatchUploader {
  private container: HTMLElement;
  private options: BatchUploaderOptions;
  private fileInput: HTMLInputElement;
  private dropZone: HTMLDivElement;

  constructor(container: HTMLElement, options: BatchUploaderOptions) {
    this.container = container;
    this.options = {
      acceptedFormats: ['image/png', 'image/jpeg', 'image/jpg'],
      maxFiles: 50,
      ...options,
    };

    this.fileInput = this.createFileInput();
    this.dropZone = this.createDropZone();

    this.render();
    this.attachEventListeners();
  }

  private createFileInput(): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = this.options.acceptedFormats?.join(',') || 'image/*';
    input.multiple = true;
    input.id = 'batch-file-input';
    input.style.display = 'none';
    return input;
  }

  private createDropZone(): HTMLDivElement {
    const zone = document.createElement('div');
    zone.className = 'batch-drop-zone';
    zone.innerHTML = `
      <div class="batch-drop-zone-content">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        <h3>Upload Multiple Images</h3>
        <p>Drop multiple scanned images here or click to select</p>
        <p class="file-info">Supported: PNG, JPEG (Max ${this.options.maxFiles} files)</p>
        <button type="button" id="batch-upload-btn" class="upload-btn">Select Images</button>
      </div>
    `;
    return zone;
  }

  private render(): void {
    this.container.innerHTML = '';
    this.container.appendChild(this.fileInput);
    this.container.appendChild(this.dropZone);
  }

  private attachEventListeners(): void {
    // File input change
    this.fileInput.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        this.handleFiles(Array.from(target.files));
      }
    });

    // Upload button click
    const uploadBtn = this.dropZone.querySelector('#batch-upload-btn');
    uploadBtn?.addEventListener('click', () => {
      this.fileInput.click();
    });

    // Drop zone click
    this.dropZone.addEventListener('click', (e) => {
      if (e.target === this.dropZone || (e.target as HTMLElement).closest('.batch-drop-zone-content')) {
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
        this.handleFiles(Array.from(files));
      }
    });
  }

  private handleFiles(files: File[]): void {
    // Validate file types
    const validFiles = files.filter((file) =>
      this.options.acceptedFormats?.includes(file.type)
    );

    if (validFiles.length < files.length) {
      alert(
        `${files.length - validFiles.length} file(s) rejected. Only ${this.options.acceptedFormats?.join(', ')} are supported.`
      );
    }

    // Check max files
    if (validFiles.length > (this.options.maxFiles || 50)) {
      alert(`Maximum ${this.options.maxFiles} files allowed. Only first ${this.options.maxFiles} will be processed.`);
      validFiles.splice(this.options.maxFiles!);
    }

    if (validFiles.length > 0) {
      this.options.onFilesSelected(validFiles);
    }
  }

  public reset(): void {
    this.fileInput.value = '';
    this.dropZone.style.display = 'block';
  }

  public hide(): void {
    this.dropZone.style.display = 'none';
  }

  public show(): void {
    this.dropZone.style.display = 'block';
  }
}
