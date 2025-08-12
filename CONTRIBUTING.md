# Contributing to Figma to React Generator

Thank you for your interest in contributing to Figma to React Generator! This document provides guidelines and information for contributors.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Install dependencies**: `npm install`
4. **Set up environment**: `npm run setup`
5. **Start development server**: `npm start`

## Development Workflow

### Code Style

- Use **ESLint** for code linting: `npm run lint`
- Follow **React best practices**
- Use **functional components** with hooks
- Write **descriptive commit messages**

### File Structure

```
src/
├── components/     # React components
├── services/       # API services
├── hooks/          # Custom React hooks
├── types/          # TypeScript definitions
├── assets/         # Static assets
└── utils/          # Utility functions
```

### Component Guidelines

- Use **Material-UI** components when possible
- Implement **responsive design**
- Add **accessibility features**
- Write **clear component documentation**

## Making Changes

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the coding guidelines

3. **Test your changes**:
   - Run the development server
   - Test with different Figma files
   - Check for console errors

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** on GitHub

## Commit Message Format

Use conventional commit format:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions/changes
- `chore:` - Build/tooling changes

## Pull Request Guidelines

- **Clear description** of changes
- **Screenshots** for UI changes
- **Test cases** for new features
- **Update documentation** if needed

## Testing

- Test with **different Figma file types**
- Verify **generated code quality**
- Check **responsive behavior**
- Test **API integrations**

## Reporting Issues

When reporting issues, please include:

- **Clear description** of the problem
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Browser/OS information**
- **Figma file example** (if applicable)

## Getting Help

- Check existing **Issues** and **Pull Requests**
- Join our **Discussions** on GitHub
- Review the **Documentation**

## Code of Conduct

- Be **respectful** and **inclusive**
- Help **new contributors**
- Provide **constructive feedback**
- Follow **community guidelines**

Thank you for contributing! 🚀



