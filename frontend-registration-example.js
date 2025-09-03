// Frontend Registration Example
// This shows how to properly call the registration endpoint from your React frontend

const registerUser = async (userData) => {
  try {
    console.log('Registering user:', { ...userData, password: 'provided' });
    
    const response = await fetch('http://localhost:5000/api/user/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important: Include cookies for session management
      body: JSON.stringify({
        name: userData.name.trim(),
        email: userData.email.trim().toLowerCase(),
        password: userData.password,
        role: userData.role || 'user'
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      // Handle different error types
      if (response.status === 400) {
        if (data.message === 'Email already registered') {
          throw new Error('This email is already registered. Please use a different email or try logging in.');
        } else if (data.errors) {
          // Validation errors
          const errorMessages = data.errors.map(err => err.message).join(', ');
          throw new Error(`Validation failed: ${errorMessages}`);
        } else {
          throw new Error(data.message || 'Registration failed. Please check your input.');
        }
      } else if (response.status === 500) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    }

    console.log('Registration successful:', data);
    
    // Store user data and token if needed
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }
    
    return {
      success: true,
      user: data.user,
      token: data.token,
      message: data.message
    };

  } catch (error) {
    console.error('Registration error:', error);
    
    // Return error in a consistent format
    return {
      success: false,
      error: error.message || 'Registration failed'
    };
  }
};

// Example usage in a React component
const RegistrationForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic client-side validation
    if (!formData.name.trim()) {
      setError('Name is required');
      setLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      setLoading(false);
      return;
    }

    if (!formData.password) {
      setError('Password is required');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    const result = await registerUser(formData);
    
    if (result.success) {
      // Registration successful - redirect or update UI
      console.log('User registered successfully:', result.user);
      // Redirect to dashboard or login page
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error-message">{error}</div>}
      
      <input
        type="text"
        placeholder="Full Name"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        required
      />
      
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        required
      />
      
      <input
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={(e) => setFormData({...formData, password: e.target.value})}
        required
      />
      
      <select
        value={formData.role}
        onChange={(e) => setFormData({...formData, role: e.target.value})}
      >
        <option value="user">User</option>
        <option value="restaurant_owner">Restaurant Owner</option>
      </select>
      
      <button type="submit" disabled={loading}>
        {loading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
};

// Axios version (alternative)
const registerUserWithAxios = async (userData) => {
  try {
    const response = await axios.post('http://localhost:5000/api/user/register', {
      name: userData.name.trim(),
      email: userData.email.trim().toLowerCase(),
      password: userData.password,
      role: userData.role || 'user'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true, // Important: Include cookies
      timeout: 10000
    });

    return {
      success: true,
      user: response.data.user,
      token: response.data.token,
      message: response.data.message
    };

  } catch (error) {
    console.error('Registration error:', error);
    
    let errorMessage = 'Registration failed';
    
    if (error.response) {
      // Server responded with error status
      const data = error.response.data;
      
      if (error.response.status === 400) {
        if (data.message === 'Email already registered') {
          errorMessage = 'This email is already registered. Please use a different email.';
        } else if (data.errors) {
          errorMessage = data.errors.map(err => err.message).join(', ');
        } else {
          errorMessage = data.message || 'Invalid input data';
        }
      } else if (error.response.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else {
        errorMessage = data.message || errorMessage;
      }
    } else if (error.request) {
      errorMessage = 'Network error. Please check your connection.';
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};

export { registerUser, registerUserWithAxios };