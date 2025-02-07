# Goat

A modern web application built with Express.js and styled using Tailwind CSS.

## Features

- Express.js backend
- Tailwind CSS for styling
- Hot-reloading development environment
- EJS templating engine

## Requirements

- Node.js 14.0 or higher
- npm or yarn

## Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/goat.git

# Navigate to project directory
cd goat

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

## Available Scripts

- `npm run dev` - Starts development server with hot reloading
- `npm start` - Starts production server
- `npm run build:css` - Builds Tailwind CSS

## Project Structure

```
.
├── app.js              # Express application entry point
├── public/             # Static files
│   └── css/           # Compiled CSS
├── src/               # Source files
│   └── input.css      # Tailwind CSS entry point
├── views/             # EJS templates
│   └── index.ejs      # Main template
├── package.json       # Project dependencies and scripts
└── tailwind.config.js # Tailwind configuration
```

## Development

```bash
# Start development server with hot reloading
npm run dev
```

This will:
- Start the Express server (with nodemon)
- Watch and compile Tailwind CSS changes
- Enable hot reloading

## Production

```bash
# Build CSS for production
npm run build:css

# Start production server
npm start
```

## Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Divya Teja

## Acknowledgments

- Express.js
- Tailwind CSS
- EJS
- Node.js