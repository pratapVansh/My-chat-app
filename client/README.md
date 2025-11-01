# Chat App - Frontend

Modern React frontend for the MERN Chat App with real-time messaging capabilities.

## 🚀 Features

- **Real-time messaging** with Socket.io
- **Modern UI** with Tailwind CSS and Shadcn UI
- **State management** with Redux Toolkit
- **Responsive design** for all devices
- **Smooth animations** with Framer Motion
- **Authentication flow** with protected routes
- **Search functionality** for users
- **Group chat support**
- **Typing indicators**
- **Online/offline status**

## 🛠️ Tech Stack

- **React 18+** with Vite
- **Redux Toolkit** for state management
- **React Router DOM** for routing
- **Tailwind CSS** for styling
- **Shadcn UI** for components
- **Framer Motion** for animations
- **Socket.io-client** for real-time communication
- **Axios** for API calls
- **Lucide React** for icons

## 📁 Project Structure

```
src/
├── components/           # Reusable components
│   ├── ui/              # Base UI components (Shadcn)
│   └── Chat/            # Chat-specific components
├── pages/               # Page components
├── store/               # Redux store and slices
│   └── slices/          # Redux slices (auth, chat, message)
├── lib/                 # Utilities and configurations
├── App.jsx              # Main app component
└── main.jsx             # Entry point
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Backend server running on port 5000

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Access the application**
   - Open http://localhost:3000 in your browser

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎨 UI Components

### Base Components (Shadcn UI)
- Button
- Input
- Card
- Avatar
- And more...

### Chat Components
- **ChatBox** - Main chat interface
- **MyChats** - Chat list sidebar
- **ProtectedRoute** - Authentication wrapper

## 🔄 State Management

### Redux Slices

#### Auth Slice
- User authentication state
- Login/logout functionality
- User search
- Profile management

#### Chat Slice
- Chat list management
- Selected chat state
- Online users tracking
- Group chat functionality

#### Message Slice
- Message sending/receiving
- Typing indicators
- Message history

## 🌐 API Integration

The frontend communicates with the backend through:
- **Axios** for HTTP requests
- **Socket.io-client** for real-time messaging
- **JWT tokens** for authentication

### API Endpoints Used
- Authentication endpoints
- Chat management endpoints
- Message endpoints

## 🎭 Animations

Smooth animations powered by Framer Motion:
- Page transitions
- Component mounting/unmounting
- Loading states
- Interactive feedback

## 📱 Responsive Design

The app is fully responsive with:
- Mobile-first approach
- Flexible layouts
- Adaptive components
- Touch-friendly interactions

## 🔒 Authentication

- JWT token-based authentication
- Protected routes
- Automatic token refresh
- Secure logout

## 🎨 Theming

Customizable theme system:
- Light/dark mode support
- CSS variables for easy customization
- Consistent design tokens
- Accessible color schemes

## 🚀 Deployment

### Build for Production

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Preview the build**
   ```bash
   npm run preview
   ```

### Deploy to Vercel/Netlify

1. Connect your repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Deploy!

## 🔧 Customization

### Adding New Pages
1. Create component in `src/pages/`
2. Add route in `App.jsx`
3. Update navigation if needed

### Styling
- Modify `tailwind.config.js` for theme
- Update CSS variables in `src/index.css`
- Add custom styles to components

### State Management
- Create new slices in `src/store/slices/`
- Add to store configuration
- Use in components with `useSelector`/`useDispatch`

## 🤝 Contributing

1. Follow the existing code structure
2. Use TypeScript-style JSDoc comments
3. Maintain consistent styling
4. Test on multiple devices
5. Update documentation

---

**Happy Coding! 💻**
