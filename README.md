# Figma to React

A React application that connects to the Figma API and Gemini API to automatically generate React components with Material-UI from Figma designs.

## Features

- 🔗 Connect to Figma files using file key and personal access token
- 📋 Display all components, frames, and instances from your Figma file
- 🖼️ Preview component images from Figma
- 🤖 Generate React components using Google's Gemini AI
- 📝 Copy or download generated code
- 🎨 Modern Material-UI interface with responsive design

## Tech Stack

- **Frontend**: React + Vite
- **UI Framework**: Material-UI (MUI)
- **HTTP Client**: Axios
- **APIs**: Figma REST API, Google Gemini API

## Prerequisites

Before running this application, you'll need:

1. **Figma Personal Access Token**
   - Go to Figma Settings → Account → Personal access tokens
   - Create a new token with appropriate permissions

2. **Google Gemini API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key for the Gemini API

3. **Figma File Key**
   - Open your Figma file
   - Copy the key from the URL: `figma.com/file/YOUR_FILE_KEY/...`

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd FigmaCursor
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Edit the `.env` file and add your API keys:
```env
VITE_FIGMA_ACCESS_TOKEN=your_figma_access_token_here
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

## Usage

1. Start the development server:
```bash
npm run dev
```

2. Open your browser and navigate to `http://localhost:5173`

3. Enter your Figma file key and personal access token

4. Browse through your Figma components in the sidebar

5. Select a component to see its preview and generate React code

6. Click "Generate React Component" to create MUI-based React code

7. Copy or download the generated code

## Project Structure

```
src/
├── components/
│   ├── ComponentList.jsx      # Sidebar with Figma components
│   ├── DesignPreview.jsx      # Center pane for component preview
│   ├── CodeDisplay.jsx        # Right pane for generated code
│   └── FileInput.jsx          # Initial file connection form
├── services/
│   ├── figmaApi.js           # Figma API integration
│   └── geminiApi.js          # Gemini API integration
├── hooks/                    # Custom React hooks (future)
├── types/                    # TypeScript types (future)
└── App.jsx                   # Main application component
```

## API Integration

### Figma API
- Fetches file structure and component metadata
- Retrieves component images for preview
- Extracts design properties (colors, dimensions, text, etc.)

### Gemini API
- Generates React components based on Figma metadata
- Uses detailed prompts to create MUI-compatible code
- Includes accessibility and responsive design best practices

## Features in Detail

### Component Discovery
- Automatically finds all components, frames, and instances
- Displays component hierarchy and metadata
- Shows component dimensions and types

### Design Preview
- Fetches and displays component images from Figma
- Shows component metadata (colors, text, effects)
- Responsive preview with zoom capabilities

### Code Generation
- Creates functional React components with hooks
- Uses Material-UI components and styling
- Includes TypeScript types and accessibility attributes
- Follows modern React patterns and best practices

## Error Handling

The application includes comprehensive error handling for:
- Invalid Figma file keys or access tokens
- Network connectivity issues
- API rate limiting
- Invalid component selections
- Code generation failures

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues or have questions:
1. Check the browser console for error messages
2. Verify your API keys are correct
3. Ensure your Figma file is accessible with the provided token
4. Check that your Gemini API key has sufficient quota

## Future Enhancements

- [ ] TypeScript support
- [ ] Component customization options
- [ ] Batch code generation
- [ ] Code preview with syntax highlighting
- [ ] Component library export
- [ ] Design system integration
- [ ] Real-time collaboration features
