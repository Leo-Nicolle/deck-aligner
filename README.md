# Deck Aligner

A web-based tool for automatically detecting, extracting, and organizing playing cards from scanned images. Built with Vue.js and OpenCV.js, Deck Aligner uses computer vision to identify individual cards in photographs and extract them as separate, perspective-corrected images.

**🌐 Live Demo**: [https://leo-nicolle.github.io/deck-aligner/](https://leo-nicolle.github.io/deck-aligner/)

## Features

### Card Detection & Extraction

- **Automatic Card Detection**: Uses contour detection and shape analysis to identify playing cards in images
- **Perspective Correction**: Automatically straightens and aligns extracted cards using perspective transformation
- **Batch Processing**: Process multiple cards from a single image at once
- **Smart Filtering**: Configurable filters based on area ratio, aspect ratio, and solidity to reduce false positives

### Image Preprocessing

- **Grayscale Conversion**: Simplifies images for better detection
- **Gaussian Blur**: Reduces noise and smooths edges
- **Adaptive/Fixed Thresholding**: Creates binary images optimized for contour detection
- **Morphological Operations**: Cleans up binary images for improved detection accuracy

### Texture Generation

- **Grid Layout**: Arrange multiple cards in customizable grid patterns
- **Flexible Spacing**: Control spacing between cards in composites
- **Scale Modes**: Choose between original size or fitted scaling
- **Custom Background**: Set custom background colors for composite images
- **Batch Export**: Download individual cards or composite textures

### User Interface

- **Real-time Preview**: See preprocessing and detection results instantly
- **Interactive Controls**: Fine-tune all processing parameters through an intuitive UI
- **Dark Theme**: Easy on the eyes with Naive UI's dark theme
- **Progress Tracking**: Real-time statistics showing detected contours and extracted cards

## Technology Stack

- **Frontend Framework**: Vue 3 with Composition API
- **UI Library**: Naive UI
- **Computer Vision**: OpenCV.js (opencv-ts)
- **Build Tool**: Vite
- **Language**: TypeScript
- **Utilities**:
  - JSZip for batch downloads
  - VueUse for composables
  - Vue Router for navigation

## Getting Started

### Prerequisites

- **Node.js v20.19+ or v22.12+** (required for Vite 7)
- **npm v10.0.0+** or yarn

> **Note:** This project uses Vite 7, which requires Node.js 20.19+ or 22.12+. If you're using an older version, please upgrade.

You can check your Node.js version with:
```bash
node --version
```

We recommend using [nvm](https://github.com/nvm-sh/nvm) to manage Node.js versions:
```bash
nvm install 20
nvm use 20
```

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd deck-aligner
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser to the URL shown in the terminal (typically `http://localhost:5173`)

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready for deployment.

### Type Checking

```bash
npm run type-check
```

## Usage

### Basic Workflow

1. **Upload an Image**: Click the upload area or drag and drop an image containing playing cards
2. **Adjust Preprocessing**: Fine-tune blur, threshold, and morphology settings until cards are clearly separated
3. **Configure Detection**: Adjust area ratio, aspect ratio, and solidity filters to optimize card detection
4. **Review Results**: Check the detection preview to ensure all cards are properly identified
5. **Extract Cards**: View extracted cards in the preview gallery
6. **Create Textures**: (Optional) Combine multiple extracted cards into composite texture sheets

### Preprocessing Controls

- **Blur Kernel Size**: Controls noise reduction (higher = more blur)
- **Threshold Value**: Sets the binary threshold for card separation
- **Adaptive Threshold**: Toggle between fixed and adaptive thresholding
- **Morphology Kernel Size**: Controls cleanup operations on binary images

### Detection Controls

- **Min/Max Area Ratio**: Filters based on card size relative to image size
- **Min/Max Aspect Ratio**: Filters based on card height-to-width ratio (typically 1.2-1.8 for standard cards)
- **Min Solidity**: Filters based on how "filled" the detected shape is (helps eliminate incomplete detections)

### Extraction Controls

- **Output Width**: Width of extracted card images (default: 750px)
- **Output Height**: Height of extracted card images (default: 1050px)

### Texture Creator

- **Cards Per Row**: Number of cards to place in each row of the composite
- **Spacing**: Pixels between cards in the grid
- **Background Color**: Hex color for the composite background
- **Scale Mode**: Choose between "fit" (scales cards to fit) or "original" (uses original extraction size)

## Project Structure

```
deck-aligner/
├── src/
│   ├── components/          # Vue components
│   │   ├── ImageUploader.vue
│   │   ├── PreprocessingControls.vue
│   │   ├── PreprocessingPreview.vue
│   │   ├── DetectionControls.vue
│   │   ├── DetectionPreview.vue
│   │   ├── ExtractionControls.vue
│   │   ├── ExtractionPreview.vue
│   │   ├── CardGallery.vue
│   │   └── TextureCreator.vue
│   ├── lib/                 # Core processing logic
│   │   ├── imageProcessor.ts    # Image preprocessing
│   │   ├── cardDetector.ts      # Card detection algorithms
│   │   ├── cardExtractor.ts     # Card extraction & perspective transform
│   │   ├── compositeGenerator.ts # Texture/composite generation
│   │   ├── cardManager.ts       # Card collection management
│   │   ├── types.ts             # TypeScript type definitions
│   │   ├── defaults.ts          # Default configuration values
│   │   └── index.ts             # Library entry point
│   ├── workers/            # Web workers
│   │   └── imageProcessor.worker.ts
│   ├── views/              # Page components
│   │   └── Main.vue
│   ├── router/             # Vue Router configuration
│   │   └── index.ts
│   ├── App.vue             # Root component
│   └── main.ts             # Application entry point
├── public/                 # Static assets
├── index.html              # HTML entry point
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Project dependencies
```

## Core Algorithms

### Card Detection Pipeline

1. **Preprocessing**: Convert to grayscale, apply Gaussian blur, threshold to binary
2. **Morphological Operations**: Clean up binary image with erosion/dilation
3. **Contour Detection**: Find all external contours in the binary image
4. **Filtering**: Apply area, aspect ratio, and solidity filters
5. **Corner Extraction**: Use minimum area rectangle to find card corners

### Perspective Transform

1. **Corner Ordering**: Order detected corners in clockwise order from top-left
2. **Orientation Detection**: Determine if card is portrait or landscape
3. **Transform Calculation**: Compute perspective transform matrix
4. **Warping**: Apply transform to extract rectified card image

### Composite Generation

1. **Layout Calculation**: Determine grid dimensions and card positions
2. **Canvas Creation**: Create output canvas with specified background
3. **Card Placement**: Resize (if needed) and position each card in the grid
4. **Export**: Convert to PNG blob for download

## Configuration

### Default Values

The application uses sensible defaults that work well for most scanned playing card images:

- **Preprocessing**:

  - Blur kernel: 5
  - Threshold: 127
  - Morphology kernel: 5

- **Detection**:

  - Area ratio: 0.01 - 0.5 (1% - 50% of image)
  - Aspect ratio: 1.2 - 1.8
  - Minimum solidity: 0.85

- **Extraction**:

  - Output size: 750x1050 pixels

- **Composite**:
  - Cards per row: 3
  - Spacing: 10px
  - Background: #000000

All defaults can be customized in [src/lib/defaults.ts](src/lib/defaults.ts).

## Tips for Best Results

1. **Good Lighting**: Ensure even lighting across all cards
2. **Flat Surface**: Keep cards as flat as possible to minimize perspective distortion
3. **Contrasting Background**: Use a background color that contrasts with your cards
4. **Minimal Overlap**: Avoid overlapping cards in the source image
5. **High Resolution**: Higher resolution images generally produce better results
6. **Preprocessing First**: Always adjust preprocessing settings before fine-tuning detection
7. **Check Binary Preview**: The binary (thresholded) image should show clear card outlines

## Browser Compatibility

Deck Aligner uses modern web technologies and requires a recent browser version:

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

WebAssembly support is required for OpenCV.js.

## Performance Considerations

- Processing time increases with image resolution
- Large images (>4000px) may take several seconds to process
- Web workers are used where possible to keep UI responsive
- OpenCV.js WASM module is loaded on-demand

## License

MIT

## Contributing

This is a personal project. If you have suggestions or find bugs, please open an issue.

## Acknowledgments

- Built with [OpenCV.js](https://docs.opencv.org/4.x/d5/d10/tutorial_js_root.html) for computer vision capabilities
- UI powered by [Naive UI](https://www.naiveui.com/)
- Vue.js ecosystem and community

## Future Enhancements

Potential features for future versions:

- [ ] Manual corner adjustment for difficult cards
- [ ] Automatic card sorting/grouping
- [ ] Support for different card sizes and formats
- [ ] Save/load processing presets
- [ ] Batch processing of multiple images
- [ ] Card database integration
- [ ] Auto-rotation correction
- [ ] Edge enhancement options
