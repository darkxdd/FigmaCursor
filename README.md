# Figma to React Converter

A web application that converts Figma designs into React components using Material-UI and the Gemini AI API.

## Features

- **Figma Integration**: Load and parse Figma files using the Figma API
- **AI-Powered Generation**: Convert Figma components to React code using Google's Gemini AI
- **Complete Page Generation**: Generate full pages with header, footer, and all components (30%+ visual similarity)
- **Material-UI Components**: Generate components using Material-UI library
- **Real-time Preview**: View component images and generated code side by side
- **Memory Optimized**: Efficient handling of complex Figma projects with pagination and filtering
- **Dual Mode**: Switch between individual component generation and complete page generation
- **Dark Mode**: Toggle between light and dark themes for better user experience

## Memory Optimization for Complex Projects

This application includes several optimizations to handle large Figma files without consuming excessive RAM:

### Component Loading Optimizations
- **Pagination**: Load components in small batches (20 per page by default)
- **Type Filtering**: Filter components by type (Components, Instances, Frames, Text)
- **Size Filtering**: Automatically exclude very small (<30px) or very large (>1500px) elements
- **Depth Limiting**: Limit component tree traversal depth to prevent deep recursion
- **Memory Usage Indicator**: Visual feedback showing current memory usage

### API Optimizations
- **Minimal Prompts**: Use ultra-minimal prompts for AI generation to reduce token count
- **Reduced Output**: Limit AI response size to save memory
- **Simplified Metadata**: Extract only essential component information

### Performance Features
- **Lazy Loading**: Components are loaded on-demand as you navigate
- **Efficient Filtering**: Filter components without reloading the entire file
- **Memory Monitoring**: Real-time memory usage tracking

## Page Generation Features

### Complete Page Analysis
- **Layout Detection**: Automatically detects header, hero, main content, footer, and sidebar sections
- **Component Categorization**: Identifies navigation, buttons, cards, and other UI elements
- **Position Analysis**: Analyzes component positioning and relationships
- **Visual Hierarchy**: Preserves design hierarchy and spacing

### Smart Generation
- **Token Optimization**: Stays within 8k token limits while maintaining quality
- **Visual Similarity**: Aims for 30%+ visual similarity to original designs
- **Material-UI Integration**: Uses appropriate MUI components for each element type
- **Responsive Design**: Generates responsive layouts that work on different screen sizes

### Multi-Component Selection
- **Checkbox Selection**: Select multiple components for page inclusion
- **Visual Feedback**: Clear indication of selected components
- **Smart Limits**: Automatically optimizes for complex designs
- **Batch Processing**: Handles multiple components efficiently

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with your API keys:
   ```
   VITE_FIGMA_ACCESS_TOKEN=your_figma_token
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```
4. Start the development server: `npm run dev`

## Usage

### Component Mode (Default)
1. Enter your Figma file key and access token
2. Browse components using pagination and filtering
3. Select a component to view its preview
4. Generate React code using the AI-powered converter
5. Copy the generated code for use in your project

### Page Generation Mode
1. Switch to "Page Mode" using the toggle button in the top bar
2. Select multiple components from the sidebar that you want to include in the page
3. Click "Generate Full Page" to create a complete React page
4. The system will analyze the design structure and generate:
   - Header/navigation components
   - Hero sections
   - Main content areas
   - Footer components
   - All selected components with proper layout
5. The generated page will maintain 30%+ visual similarity to the original Figma design
6. Copy or download the complete page code

### Dark Mode
- Click the dark/light mode toggle button in the top bar to switch themes
- Dark mode provides better contrast and reduced eye strain
- All components and code display adapt to the selected theme
- Smooth transitions between light and dark modes
- Consistent theming across all Material-UI components
- CSS variables ensure proper color coordination
- Available on both the file input screen and main application interface

## API Keys Required

- **Figma Access Token**: Get from [Figma Account Settings](https://www.figma.com/developers/api#access-tokens)
- **Gemini API Key**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Dark Mode Implementation

The application features a comprehensive dark mode implementation with the following characteristics:

### Theme System
- **Material-UI Theme Provider**: Uses MUI's built-in theming system
- **CSS Variables**: Custom CSS variables for consistent color management
- **Smooth Transitions**: 0.3s ease transitions for all color changes
- **State Synchronization**: Dark mode state is synchronized between React state and CSS attributes

### Color Palette
- **Light Theme**: Clean, bright interface with high contrast
- **Dark Theme**: Dark backgrounds with appropriate text contrast
- **Component Colors**: All Material-UI components adapt to the selected theme
- **Custom Elements**: Scrollbars, borders, and other UI elements follow the theme

### User Experience
- **Toggle Button**: Easy-to-use icon button with tooltips
- **Visual Feedback**: Hover effects and smooth animations
- **Persistent State**: Dark mode preference is maintained during the session
- **Accessibility**: Proper contrast ratios for both themes

## Technologies Used

- React 18
- Material-UI (MUI)
- Vite
- Figma API
- Google Gemini AI API
- Axios

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to this project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
