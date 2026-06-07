import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TaskProvider } from './context/TaskContext';
import { ThemeProvider } from './context/ThemeContext';
import { StudyBuddyProvider } from './context/StudyBuddyContext';
import Landing from './components/Landing/Landing';
import Auth from './components/Auth/Auth';
import Dashboard from './components/Dashboard/Dashboard';
import AddTask from './components/AddTask/AddTask';
import StudyPlanning from './components/StudyPlanning/StudyPlanning';
import ResultScreen from './components/ResultScreen/ResultScreen';
import TaskDetail from './components/TaskDetail/TaskDetail';
import EditTask from './components/EditTask/EditTask';
import CuteDecorations from './components/CuteDecorations/CuteDecorations';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Public Route Component (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" /> : children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Auth />
          </PublicRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <Auth />
          </PublicRoute>
        } 
      />

      {/* Protected Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/add-task" 
        element={
          <ProtectedRoute>
            <AddTask />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/study-planning" 
        element={
          <ProtectedRoute>
            <StudyPlanning />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/result" 
        element={
          <ProtectedRoute>
            <ResultScreen />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/task/:taskId" 
        element={
          <ProtectedRoute>
            <TaskDetail />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/edit-task/:taskId" 
        element={
          <ProtectedRoute>
            <EditTask />
          </ProtectedRoute>
        } 
      />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <StudyBuddyProvider>
        <CuteDecorations />
        <Router>
          <AuthProvider>
            <TaskProvider>
              <AppRoutes />
            </TaskProvider>
          </AuthProvider>
        </Router>
      </StudyBuddyProvider>
    </ThemeProvider>
  );
}

export default App;