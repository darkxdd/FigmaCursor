import axios from 'axios';

const FIGMA_API_BASE_URL = 'https://api.figma.com/v1';

// Create axios instance for Figma API
const figmaApi = axios.create({
  baseURL: FIGMA_API_BASE_URL,
});

// Get file information
export const getFigmaFile = async (fileKey, accessToken) => {
  try {
    const response = await figmaApi.get(`/files/${fileKey}`, {
      headers: {
        'X-Figma-Token': accessToken,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching Figma file:', error);
    throw new Error(`Failed to fetch Figma file: ${error.response?.data?.message || error.message}`);
  }
};

// Get file images
export const getFigmaImages = async (fileKey, nodeIds, accessToken) => {
  try {
    const response = await figmaApi.get(`/images/${fileKey}`, {
      headers: {
        'X-Figma-Token': accessToken,
      },
      params: {
        ids: nodeIds.join(','),
        format: 'png',
        scale: 2,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching Figma images:', error);
    throw new Error(`Failed to fetch Figma images: ${error.response?.data?.message || error.message}`);
  }
};

// Extract component metadata from Figma node
export const extractComponentMetadata = (node) => {
  const metadata = {
    id: node.id,
    name: node.name,
    type: node.type,
    width: node.absoluteBoundingBox?.width,
    height: node.absoluteBoundingBox?.height,
    fills: node.fills || [],
    strokes: node.strokes || [],
    effects: node.effects || [],
    characters: node.characters || '',
    style: node.style || {},
    children: node.children || [],
  };

  return metadata;
};

// Recursively find all components in the file
export const findAllComponents = (nodes) => {
  const components = [];

  const traverse = (nodeList) => {
    if (!Array.isArray(nodeList)) return;

    nodeList.forEach((node) => {
      if (node.type === 'COMPONENT' || node.type === 'INSTANCE' || node.type === 'FRAME') {
        components.push(node);
      }
      
      if (node.children) {
        traverse(node.children);
      }
    });
  };

  traverse(nodes);
  return components;
}; 