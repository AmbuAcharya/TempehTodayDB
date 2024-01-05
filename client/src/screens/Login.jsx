import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import AppIcon from "../app_icon.png";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const onLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Signed in
      const user = userCredential.user;
      console.log(user);
      navigate("/home");
    } catch (error) {
      const errorMessage = error.message;
      setError(errorMessage);
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-700 bg-opacity-50">
          <div className="bg-white p-4 rounded-md flex items-center justify-center">
            <img
              src={AppIcon}
              alt="App Logo"
              className="animate-spin h-12 w-12"
            />
          </div>
        </div>
      )}
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <section className="max-w-md w-full">
          <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 transition-all duration-500 ease-in-out transform hover:scale-105">
            <h1 className="text-2xl font-bold text-center mb-4">LOGIN</h1>

            <form>
              <div className="mb-4">
                <label htmlFor="email-address" className="block text-gray-700 text-sm font-bold mb-2">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  required
                  placeholder="Email address"
                  className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="mb-6">
                <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Password"
                    className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline"
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 px-4 py-2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  onClick={onLogin}
                  disabled={loading}
                >
                  Login
                </button>
              </div>
            </form>

            {error && (
              <p className="error-text">{error}</p>
            )}
          </div>
        </section>
      </main>
    </>
  );
};

export default Login;
