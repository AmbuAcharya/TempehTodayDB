import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';

const CreateUser = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const onSignUp = async (e) => {
    e.preventDefault();

    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uuid = userCredential.user.uid;
      const usersRef = ref(db, `users/${uuid}`);

      // Set the value in the database
      await set(usersRef, { isAdmin });

      console.log('Data set successfully');
      navigate('/home');
    } catch (error) {
      setError("User already added");
      console.error('Error signing up:', error.message);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <section className="max-w-md w-full">
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 transition-all duration-500 ease-in-out transform hover:scale-105">
          <h1 className="text-2xl font-bold text-center mb-4">CREATE USER</h1>
          <form onSubmit={onSignUp}>
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

            <div className="mb-4 flex items-center">
              <input
                id="isAdmin"
                name="isAdmin"
                type="checkbox"
                className="mr-2"
                onChange={() => setIsAdmin(!isAdmin)}
              />
              <label htmlFor="isAdmin" className="text-gray-700 text-sm font-bold">
                Register as Admin
              </label>
            </div>

            <div className="flex items-center justify-center">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Create User
              </button>
            </div>
          </form>
          {error && (
            <p className="text-red-600 font-bold">{error}</p>
          )}
        </div>
      </section>
    </main>
  );
};

export default CreateUser;