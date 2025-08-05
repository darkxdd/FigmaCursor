# Setup Guide - Figma to React

## Quick Start

### 1. Prerequisites

Before you can use this application, you need to obtain the following:

#### Figma Personal Access Token
1. Go to [Figma](https://www.figma.com)
2. Click on your profile icon → Settings
3. Navigate to Account → Personal access tokens
4. Click "Create new token"
5. Give it a name (e.g., "Figma to React")
6. Copy the generated token (you won't see it again!)

#### Google Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

#### Figma File Key
1. Open your Figma file in the browser
2. Look at the URL: `figma.com/file/YOUR_FILE_KEY/...`
3. Copy the file key (the long string after `/file/`)

### 2. Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and add your API keys:
   ```env
   VITE_FIGMA_ACCESS_TOKEN=your_figma_access_token_here
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

### 3. Running the Application

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and go to `http://localhost:5173`

## How to Use

### Step 1: Connect to Figma
- Enter your Figma file key and personal access token
- Click "Load Figma File"
- The app will fetch all components from your file

### Step 2: Browse Components
- Use the left sidebar to browse through all components, frames, and instances
- Each component shows its type, dimensions, and metadata
- Click on any component to select it

### Step 3: Preview Design
- The center pane shows a preview of the selected component
- If available, you'll see the actual image from Figma
- Component metadata (colors, text, effects) is displayed below

### Step 4: Generate React Code
- Click "Generate React Component" in the right pane
- The app will send component metadata to Gemini AI
- Generated React code will appear with syntax highlighting
- Use the copy/download buttons to save the code

## Troubleshooting

### Common Issues

**"Failed to fetch Figma file"**
- Check that your file key is correct
- Verify your access token has proper permissions
- Ensure the Figma file is accessible with your account

**"Gemini API key not found"**
- Make sure you've added `VITE_GEMINI_API_KEY` to your `.env` file
- Restart the development server after adding environment variables

**"No components found"**
- Check that your Figma file contains components, frames, or instances
- Try refreshing the file using the refresh button

**"Failed to generate React component"**
- Check your Gemini API quota and billing
- Verify your API key is valid
- Try selecting a different component

### API Limits

- **Figma API**: Rate limits apply, but generous for most use cases
- **Gemini API**: Check your quota at [Google AI Studio](https://makersuite.google.com/app/apikey)

## File Structure

```
FigmaCursor/
├── src/
│   ├── components/          # React components
│   │   ├── ComponentList.jsx    # Left sidebar
│   │   ├── DesignPreview.jsx    # Center preview
│   │   ├── CodeDisplay.jsx      # Right code panel
│   │   └── FileInput.jsx        # Initial form
│   ├── services/           # API integrations
│   │   ├── figmaApi.js         # Figma REST API
│   │   └── geminiApi.js        # Gemini AI API
│   └── App.jsx             # Main application
├── .env.example           # Environment variables template
├── README.md              # Project documentation
└── package.json           # Dependencies and scripts
```

## Next Steps

Once you have the basic setup working:

1. **Customize the prompt**: Edit the `createComponentPrompt` function in `src/services/geminiApi.js` to generate different types of components
2. **Add more metadata**: Extend the `extractComponentMetadata` function in `src/services/figmaApi.js` to capture more design properties
3. **Improve styling**: Modify the Material-UI theme in `src/App.jsx` to match your design system
4. **Add TypeScript**: Convert the project to TypeScript for better type safety

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify all API keys are correct
3. Ensure your Figma file is accessible
4. Check API quotas and billing status 