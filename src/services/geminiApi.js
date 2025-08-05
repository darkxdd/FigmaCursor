const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Generate React component using Gemini API
export const generateReactComponent = async (componentMetadata) => {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Gemini API key not found. Please add VITE_GEMINI_API_KEY to your .env file.');
    }

    const prompt = createComponentPrompt(componentMetadata);
    
    const response = await fetch(`${GEMINI_API_BASE_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Debug logging to see what we're getting
    console.log('Gemini API Response:', JSON.stringify(data, null, 2));

    // Robust response check
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.candidates?.[0]?.content?.parts?.[0] ||
      null;

    if (!text) {
      console.error('Response structure:', {
        hasCandidates: !!data?.candidates,
        candidatesLength: data?.candidates?.length,
        firstCandidate: data?.candidates?.[0],
        hasContent: !!data?.candidates?.[0]?.content,
        hasParts: !!data?.candidates?.[0]?.content?.parts,
        partsLength: data?.candidates?.[0]?.content?.parts?.length,
        firstPart: data?.candidates?.[0]?.content?.parts?.[0]
      });
      throw new Error('Invalid or empty response from Gemini API');
    }

    // Remove markdown code fences if present
    const cleaned = text.replace(/```(?:[a-zA-Z]+)?\n?([\s\S]*?)```/, '$1').trim();

    return cleaned;
  } catch (error) {
    console.error('Error generating React component:', error);
    throw new Error(`Failed to generate React component: ${error.message}`);
  }
};

// Create a detailed prompt for component generation
const createComponentPrompt = (metadata) => {
  return `Generate a React component using Material-UI (MUI) based on the following Figma component metadata:

Component Name: ${metadata.name}
Type: ${metadata.type}
Dimensions: ${metadata.width}px x ${metadata.height}px

${metadata.characters ? `Text Content: "${metadata.characters}"` : ''}

${metadata.fills.length > 0 ? `Background Colors: ${JSON.stringify(metadata.fills)}` : ''}
${metadata.strokes.length > 0 ? `Border Colors: ${JSON.stringify(metadata.strokes)}` : ''}
${metadata.effects.length > 0 ? `Effects: ${JSON.stringify(metadata.effects)}` : ''}

Please generate a **complete React functional component** that:

1. Uses Material-UI (MUI) components for layout and styling where applicable
2. Accurately matches the **visual layout and elements** described in the metadata
3. Includes **SVG elements** to represent any vector paths (curves, icons, shapes)
4. Places all visual elements correctly using **absolute positioning or flex/grid**
5. Implements **box shadows, borders, and fills** as seen in the design
6. Uses **responsive units** (like %, vh, vw, rem) for adaptability
7. Includes proper **TypeScript types** (optional props, children, etc.)
8. Uses **semantic HTML and accessibility attributes**
9. Is **self-contained** with no external dependencies outside of MUI
10. Includes **inline comments** explaining structure and visual logic

Return only the React component code (no markdown formatting or extra explanation).`;
}; 